/*
 * Copyright 2025 the original author or authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { NodePath } from "@babel/traverse"
import * as t from "@babel/types"
import { extractValue } from "../utils/extractValue"

/**
 * Ensures that the accumulator object `ret` has a response json field map.
 * @param {any} ret Mutable accumulator for analysis results.
 * @returns {Record<string, any>} The ensured `responseJsonFieldMap`.
 */
function ensureResMap(ret: any) {
    if (!ret.responseJsonFieldMap) ret.responseJsonFieldMap = {}
    return ret.responseJsonFieldMap as Record<string, any>
}

/**
 * Analyze `res.json({ ... })` object literal and fill metadata for each property.
 * @param {t.ObjectExpression} obj Object literal passed to `res.json`.
 * @param {any} ret Mutable accumulator for analysis results (augments `responseJsonFieldMap`).
 * @param {Record<string, any> | undefined} variableMap Mapping of identifiers to previously-resolved descriptors.
 * @param {Record<string, any[]>} localArrays Map of local array identifiers (for value tracking).
 * @param {t.File | undefined} ast Whole-file AST (optional).
 * @returns {void}
 */
function analyzeJsonObjectFields(
    obj: t.ObjectExpression,
    ret: any,
    variableMap: Record<string, any> | undefined,
    localArrays: Record<string, any[]>,
    ast?: t.File,
) {
    const out = ensureResMap(ret)

    for (const p of obj.properties) {
        if (!t.isObjectProperty(p)) continue

        let keyName: string | null = null
        if (t.isIdentifier(p.key)) keyName = p.key.name
        else if (t.isStringLiteral(p.key)) keyName = p.key.value
        if (!keyName) continue

        const v = p.value
        const extracted = extractValue(v as t.Node, localArrays, variableMap ?? {}, ast)
        if (extracted !== null && extracted !== undefined) {
            out[keyName] = extracted
        }
    }
}

/**
 * Analyze a variable declarator for:
 * - Calls/constructors assigned to identifiers
 * - Destructuring from `req.query|params|body|headers` and track field usage
 * @param {NodePath<t.VariableDeclarator>} varPath Variable declarator path.
 * @param {any} ret Mutable accumulator for analysis results (adds `variableMap`, `req*` sets).
 * @param {Record<string, any[]>} localArrays Map of local array identifiers (for value tracking).
 * @returns {void}
 */
export function analyzeVariableDeclarator(
    varPath: NodePath<t.VariableDeclarator>,
    ret: any,
    localArrays: Record<string, any[]>,
) {
    const decl = varPath.node

    if (t.isIdentifier(decl.id) && t.isArrayExpression(decl.init)) {
        const arrVal = extractValue(
            decl.init,
            localArrays,
            ret.variableMap ?? {},
            ret.ast as t.File | undefined,
        )
        localArrays[decl.id.name] = Array.isArray(arrVal) ? arrVal : []
        return
    }

    if (t.isIdentifier(decl.id) && decl.init) {
        if (!ret.variableMap) ret.variableMap = {}
        const maybe = extractValue(
            decl.init as t.Node,
            localArrays,
            ret.variableMap,
            ret.ast as t.File | undefined,
        )

        if (maybe !== null && maybe !== undefined) {
            ret.variableMap[decl.id.name] = maybe
        }
    }

    if (
        t.isObjectPattern(decl.id) &&
        t.isMemberExpression(decl.init) &&
        t.isIdentifier(decl.init.object, { name: "req" }) &&
        (t.isIdentifier(decl.init.property) || t.isStringLiteral(decl.init.property))
    ) {
        const propName = t.isIdentifier(decl.init.property)
            ? decl.init.property.name
            : decl.init.property.value

        decl.id.properties.forEach((prop: any) => {
            if (t.isObjectProperty(prop)) {
                const key = prop.key
                const fieldName = t.isIdentifier(key)
                    ? key.name
                    : t.isStringLiteral(key)
                      ? key.value
                      : null
                if (!fieldName) return

                switch (propName) {
                    case "query":
                        ret.reqQuery.add(fieldName)
                        if (!ret.variableMap) ret.variableMap = {}
                        ret.variableMap[fieldName] = {
                            type: "member_access",
                            object: "req.query",
                            property: fieldName,
                            identifier: `req.query.${fieldName}`,
                        }
                        break
                    case "params":
                        ret.reqParams.add(fieldName)
                        if (!ret.variableMap) ret.variableMap = {}
                        ret.variableMap[fieldName] = {
                            type: "member_access",
                            object: "req.params",
                            property: fieldName,
                            identifier: `req.params.${fieldName}`,
                        }
                        break
                    case "headers":
                        ret.reqHeaders.add(fieldName.toLowerCase())
                        if (!ret.variableMap) ret.variableMap = {}
                        ret.variableMap[fieldName] = {
                            type: "member_access",
                            object: "req.headers",
                            property: fieldName.toLowerCase(),
                            identifier: `req.headers.${fieldName.toLowerCase()}`,
                        }
                        break
                    case "body":
                        ret.bodyFields.add(fieldName)
                        if (!ret.variableMap) ret.variableMap = {}
                        ret.variableMap[fieldName] = {
                            type: "member_access",
                            object: "req.body",
                            property: fieldName,
                            identifier: `req.body.${fieldName}`,
                        }
                        break
                }
            }
        })
    }
}

/**
 * Inspect member-expressions to:
 * - Track request field usage (`req.headers.*`, `req.body.*`)
 * - Detect `res.json({ ... })` calls and analyze their object argument
 * @param {NodePath<t.MemberExpression>} memPath Member expression path.
 * @param {any} ret Mutable accumulator for analysis results.
 * @returns {void}
 */
export function analyzeMemberExpression(memPath: NodePath<t.MemberExpression>, ret: any) {
    const mm = memPath.node

    const parentObj = ((): t.MemberExpression | t.OptionalMemberExpression | null => {
        if (t.isMemberExpression(mm.object) || t.isOptionalMemberExpression(mm.object)) {
            return mm.object
        }
        return null
    })()

    if (
        parentObj &&
        t.isIdentifier(parentObj.object, { name: "req" }) &&
        (t.isIdentifier(parentObj.property) || t.isStringLiteral(parentObj.property))
    ) {
        const parent = t.isIdentifier(parentObj.property)
            ? parentObj.property.name
            : parentObj.property.value

        let child: string | null = null
        if (t.isIdentifier(mm.property)) child = mm.property.name
        else if (t.isStringLiteral(mm.property)) child = mm.property.value

        if (!child) return

        if (parent === "headers") {
            ret.reqHeaders.add(child.toLowerCase())
        } else if (parent === "body") {
            ret.bodyFields.add(child)
        }
    }

    const isJsonCallee =
        (t.isIdentifier(mm.property, { name: "json" }) ||
            t.isStringLiteral(mm.property, { value: "json" })) &&
        (t.isIdentifier(mm.object, { name: "res" }) ||
            (t.isCallExpression(mm.object) &&
                (t.isMemberExpression(mm.object.callee) ||
                    t.isOptionalMemberExpression(mm.object.callee)) &&
                (t.isIdentifier((mm.object.callee as t.MemberExpression).property, {
                    name: "status",
                }) ||
                    t.isStringLiteral((mm.object.callee as t.MemberExpression).property as any, {
                        value: "status",
                    }))))

    if (isJsonCallee && memPath.parentPath && memPath.parentPath.isCallExpression()) {
        const call = memPath.parentPath.node
        const firstArg = call.arguments[0]
        if (firstArg && t.isObjectExpression(firstArg)) {
            analyzeJsonObjectFields(
                firstArg,
                ret,
                ret.variableMap,
                ret.localArrays ?? {},
                ret.ast as t.File | undefined,
            )
        }
    }
}
