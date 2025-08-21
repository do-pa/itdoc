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

import * as t from "@babel/types"
import traversePkg, { NodePath } from "@babel/traverse"
// @ts-expect-error Interop between CJS/ESM default export of @babel/traverse
const traverse = traversePkg.default

/**
 * Convert a call's argument list into a compact string signature.
 *
 * - Spreads become `...<expr>`
 * - Argument placeholders become `?`
 * - Other expressions are rendered via `exprToString`
 * @param {(t.Expression | t.SpreadElement | t.ArgumentPlaceholder)[]} args Call arguments.
 * @returns {string} Comma-separated argument signature.
 */
function argsToString(args: Array<t.Expression | t.SpreadElement | t.ArgumentPlaceholder>): string {
    return args
        .map((a) => {
            if (t.isSpreadElement(a)) return `...${exprToString(a.argument as t.Node)}`
            if (t.isArgumentPlaceholder(a)) return "?"
            return exprToString(a as t.Node)
        })
        .join(", ")
}

/**
 * Retrieve a representative array sample for an identifier that refers to an array.
 *
 * Looks up:
 * 1) `localArrays[name]` for in-scope literals
 * 2) `variableMap[name].sample` for previously captured samples
 * @param {string | undefined} objName Identifier to resolve.
 * @param {Record<string, any[]>} localArrays Map of local array literals.
 * @param {Record<string, any>} variableMap Map of prior variable descriptors.
 * @returns {any[] | undefined} An example array if known.
 */
function getArraySample(
    objName: string | undefined,
    localArrays: Record<string, any[]>,
    variableMap: Record<string, any>,
): any[] | undefined {
    if (!objName) return undefined
    if (Array.isArray(localArrays[objName])) return localArrays[objName]
    const v = variableMap[objName]
    if (v && Array.isArray(v.sample)) return v.sample
    return undefined
}

/**
 * Safely converts a value to a string.
 *
 * - If the value is already a string, it is returned as-is.
 * - If the value is an object, it is serialized into a JSON string.
 * @param {string | object} v - The value to be converted.
 * @returns {string} The string representation of the input value.
 */
function toSig(v: string | object): string {
    return typeof v === "string" ? v : JSON.stringify(v)
}
/**
 * Create a normalized descriptor for a member access expression.
 *
 * Supports:
 * - Optional chaining (`a?.b`)
 * - Computed properties (`a["b"]`, `a?.[x]`)
 * @param {t.MemberExpression | t.OptionalMemberExpression} mem Member expression node.
 * @returns {{type: 'member_access', object: string, property: string, identifier: string}} Access metadata.
 */

/**
 *
 * @param mem
 */
function createMemberAccessIdentifier(mem: t.MemberExpression | t.OptionalMemberExpression) {
    const objStr = toSig(exprToString(mem.object)) // <- string | object → string

    let propName = "<prop>"
    if (t.isIdentifier(mem.property)) propName = mem.property.name
    else if (t.isStringLiteral(mem.property)) propName = mem.property.value
    else propName = toSig(exprToString(mem.property as t.Node)) // <- 안전 변환

    const sep = t.isOptionalMemberExpression(mem) ? "?." : "."
    const accessor = mem.computed
        ? `${sep}[${toSig(exprToString(mem.property as t.Node))}]` // <- 안전 변환
        : `${sep}${propName}`

    return {
        type: "member_access" as const,
        object: objStr,
        property: propName,
        identifier: `${objStr}${accessor}`,
    }
}

/**
 * Render an AST expression as a readable string or structured object.
 *
 * - Literals → literal string
 * - `new Ctor(args)` → `"new Ctor(<argsSig>)"`
 * - `a.b` / `a?.b` / computed forms → `"a.b"` / `"a?.[b]"`
 * - Calls/optional calls → structured via `createInvocationIdentifier`
 * @param {t.Node | null | undefined} node AST node to stringify.
 * @param {Record<string, any[]>} [localArrays] Local arrays for enrichment.
 * @param {Record<string, any>} [variableMap] Variable descriptors for enrichment.
 * @returns {string | object} Human-readable signature or a call descriptor.
 */
function exprToString(
    node: t.Node | null | undefined,
    localArrays: Record<string, any[]> = {},
    variableMap: Record<string, any> = {},
): string | object {
    if (!node) return "<unknown>"
    if (t.isIdentifier(node)) return node.name
    if (t.isThisExpression(node)) return "this"
    if (t.isSuper(node)) return "super"
    if (t.isStringLiteral(node)) return node.value
    if (t.isNumericLiteral(node)) return String(node.value)
    if (t.isBooleanLiteral(node)) return String(node.value)
    if (t.isNullLiteral(node)) return "null"

    if (t.isNewExpression(node)) {
        const ctor = exprToString(node.callee, localArrays, variableMap)
        const argsSig = node.arguments ? argsToString(node.arguments as any) : ""
        return `new ${ctor}(${argsSig})`
    }

    if (t.isMemberExpression(node)) {
        const obj = exprToString(node.object, localArrays, variableMap)
        const prop = node.computed
            ? `[${exprToString(node.property as t.Node, localArrays, variableMap)}]`
            : `.${exprToString(node.property as t.Node, localArrays, variableMap)}`
        return `${obj}${prop}`
    }

    if (t.isOptionalMemberExpression(node)) {
        const obj = exprToString(node.object, localArrays, variableMap)
        const prop = node.computed
            ? `?.[${exprToString(node.property as t.Node, localArrays, variableMap)}]`
            : `?.${exprToString(node.property as t.Node, localArrays, variableMap)}`
        return `${obj}${prop}`
    }

    if (t.isOptionalCallExpression(node)) {
        const info: any = createInvocationIdentifier(node, localArrays, variableMap)
        if (info && typeof info.object === "string") {
            const sample = getArraySample(info.object, localArrays, variableMap)
            if (sample) info.sample = sample
        }
        return info
    }

    if (t.isCallExpression(node)) {
        const info: any = createInvocationIdentifier(node, localArrays, variableMap)
        if (info && typeof info.object === "string") {
            const sample = getArraySample(info.object, localArrays, variableMap)
            if (sample) info.sample = sample
        }
        return info
    }

    return `<${node.type}>`
}

/**
 * Build a normalized descriptor for call and optional-call expressions.
 *
 * Shapes:
 * - Member calls → `{ type: 'function_call', object, method, identifier }`
 * - Identifier calls → `{ type: 'function_call', method, identifier }`
 * - Complex callees → `{ type: 'function_call', identifier }`
 * @param {t.CallExpression | t.OptionalCallExpression} inv Invocation node.
 * @param {Record<string, any[]>} [localArrays] Local array map for enrichment.
 * @param {Record<string, any>} [variableMap] Variable map for enrichment.
 * @returns {object} Call descriptor.
 */
function createInvocationIdentifier(
    inv: t.CallExpression | t.OptionalCallExpression,
    localArrays: Record<string, any[]> = {},
    variableMap: Record<string, any> = {},
): object {
    const callee = inv.callee as t.Expression
    const argsSig = argsToString(inv.arguments)

    if (t.isMemberExpression(callee) || t.isOptionalMemberExpression(callee)) {
        const objResult = exprToString(callee.object, localArrays, variableMap)
        const objStr = typeof objResult === "string" ? objResult : JSON.stringify(objResult)

        let methodName = "<prop>"
        if (t.isIdentifier(callee.property)) methodName = callee.property.name
        else if (t.isStringLiteral(callee.property)) methodName = callee.property.value
        else {
            const propResult = exprToString(callee.property as t.Node, localArrays, variableMap)
            methodName = typeof propResult === "string" ? propResult : JSON.stringify(propResult)
        }

        const sep = t.isOptionalMemberExpression(callee) ? "?." : "."
        const accessorForId = callee.computed
            ? `${sep}[${exprToString(callee.property as t.Node, localArrays, variableMap)}]`
            : `${sep}${methodName}`

        return {
            type: "function_call",
            object: objStr,
            method: methodName,
            identifier: `${objStr}${accessorForId}(${argsSig})`,
        }
    }

    if (t.isIdentifier(callee)) {
        return {
            type: "function_call",
            method: callee.name,
            identifier: `${callee.name}(${argsSig})`,
        }
    }

    const calleeResult = exprToString(callee, localArrays, variableMap)
    const calleeStr = typeof calleeResult === "string" ? calleeResult : JSON.stringify(calleeResult)

    return {
        type: "function_call",
        identifier: `${calleeStr}(${argsSig})`,
    }
}

/**
 * Create a function-call descriptor while preserving the existing signature,
 * extended to support `OptionalCallExpression`.
 * @param {t.CallExpression | t.OptionalCallExpression} callExpression Call or optional-call.
 * @param {Record<string, any[]>} [localArrays] Local arrays for enrichment.
 * @param {Record<string, any>} [variableMap] Variable map for enrichment.
 * @returns {object} Call descriptor.
 */
export function createFunctionIdentifier(
    callExpression: t.CallExpression | t.OptionalCallExpression,
    localArrays: Record<string, any[]> = {},
    variableMap: Record<string, any> = {},
): object {
    return createInvocationIdentifier(callExpression, localArrays, variableMap)
}

/**
 * Extract a primitive value from a literal node.
 * @param {t.Node} node Candidate literal node.
 * @returns {any} JS value for string/number/boolean/null, or `undefined` if not a basic literal.
 */
function extractLiteralValue(node: t.Node): any {
    if (t.isStringLiteral(node)) return node.value
    if (t.isNumericLiteral(node) || t.isBooleanLiteral(node)) return node.value
    if (t.isNullLiteral(node)) return null
    return undefined
}

/**
 * Extract a plain object from an `ObjectExpression`.
 *
 * - Each property value is recursively extracted via `extractValue`.
 * - Spread properties are resolved via `resolveSpreadValue`.
 * @param {t.ObjectExpression} node Object literal node.
 * @param {Record<string, any[]>} localArrays Local arrays map.
 * @param {Record<string, any>} variableMap Variable descriptors.
 * @param {t.File} [ast] Whole-file AST, used to chase identifiers if needed.
 * @param {Set<string>} [visitedVariables] Cycle guard set.
 * @returns {any} Plain JS object representing the expression.
 */
function extractObjectValue(
    node: t.ObjectExpression,
    localArrays: Record<string, any[]>,
    variableMap: Record<string, any>,
    ast?: t.File,
    visitedVariables: Set<string> = new Set(),
): any {
    const obj: Record<string, any> = {}

    node.properties.forEach((prop) => {
        if (t.isObjectProperty(prop) && (t.isIdentifier(prop.key) || t.isStringLiteral(prop.key))) {
            const key = t.isIdentifier(prop.key) ? prop.key.name : prop.key.value
            const value = extractValue(
                prop.value as t.Node,
                localArrays,
                variableMap,
                ast,
                visitedVariables,
            )
            obj[key] = value !== null ? value : null
        } else if (t.isSpreadElement(prop)) {
            const resolved = resolveSpreadValue(
                prop.argument,
                localArrays,
                variableMap,
                ast,
                visitedVariables,
            )

            if (resolved && typeof resolved === "object" && !Array.isArray(resolved)) {
                Object.assign(obj, resolved)
            } else if (t.isIdentifier(prop.argument)) {
                if (!resolved && ast) {
                    const deepResolved = findVariableValue(
                        prop.argument.name,
                        ast,
                        visitedVariables,
                        localArrays,
                        variableMap,
                    )
                    if (
                        deepResolved &&
                        typeof deepResolved === "object" &&
                        !Array.isArray(deepResolved)
                    ) {
                        Object.assign(obj, deepResolved)
                    } else {
                        obj[`...${prop.argument.name}`] = deepResolved || "<spread>"
                    }
                } else {
                    obj[`...${prop.argument.name}`] = resolved || "<spread>"
                }
            }
        }
    })

    return obj
}

/**
 * Extract an array from an `ArrayExpression`.
 *
 * - Elements are recursively extracted via `extractValue`.
 * - Spread elements are resolved via `resolveSpreadValue`.
 * @param {t.ArrayExpression} node Array literal node.
 * @param {Record<string, any[]}> localArrays Local arrays map.
 * @param {Record<string, any}> variableMap Variable descriptors.
 * @param localArrays
 * @param variableMap
 * @param {t.File} [ast] Whole-file AST for identifier resolution.
 * @param {Set<string>} [visitedVariables] Cycle guard set.
 * @returns {any[]} Array value.
 */
function extractArrayValue(
    node: t.ArrayExpression,
    localArrays: Record<string, any[]>,
    variableMap: Record<string, any>,
    ast?: t.File,
    visitedVariables: Set<string> = new Set(),
): any {
    const elements: any[] = []

    node.elements.forEach((el) => {
        if (!el) return

        if (t.isSpreadElement(el)) {
            const resolved = resolveSpreadValue(
                el.argument,
                localArrays,
                variableMap,
                ast,
                visitedVariables,
            )
            if (Array.isArray(resolved)) {
                elements.push(...resolved)
            } else if (resolved !== null) {
                elements.push(resolved)
            } else if (t.isIdentifier(el.argument)) {
                elements.push(`<spread:${el.argument.name}>`)
            }
        } else {
            const value = extractValue(el, localArrays, variableMap, ast, visitedVariables)
            if (value !== null) {
                elements.push(value)
            }
        }
    })

    return elements
}

/**
 * Resolve the value of an identifier where possible.
 * @param {t.Identifier} node Identifier node.
 * @param {Record<string, any[]}> localArrays Local arrays map.
 * @param {Record<string, any}> variableMap Variable descriptors.
 * @param localArrays
 * @param variableMap
 * @param {t.File} [ast] Whole-file AST for identifier resolution.
 * @param {Set<string>} [visitedVariables] Cycle guard set.
 * @returns {any} Resolved value or `null` when unknown.
 */
function extractIdentifierValue(
    node: t.Identifier,
    localArrays: Record<string, any[]>,
    variableMap: Record<string, any>,
    ast?: t.File,
    visitedVariables: Set<string> = new Set(),
): any {
    const name = node.name

    if (localArrays[name]) return localArrays[name]

    if (variableMap[name]) {
        const mapping = variableMap[name]
        if (Array.isArray(mapping?.samples)) return mapping.samples
        if (Array.isArray(mapping?.sample)) return mapping.sample
        return mapping
    }

    if (ast) {
        return findVariableValue(name, ast, visitedVariables, localArrays, variableMap)
    }

    return null
}

/**
 * Extract a best-effort JS value (or structured descriptor) from an arbitrary AST node.
 *
 * Order:
 * - Literals → primitive
 * - Object → plain object
 * - Array → array
 * - Identifier → resolved via maps/AST
 * - MemberExpression/OptionalMemberExpression → member access descriptor
 * - Call/OptionalCall → call descriptor
 * - NewExpression → constructor descriptor
 * @param {t.Node} node Any AST node to extract.
 * @param {Record<string, any[]>} localArrays Local arrays map.
 * @param {Record<string, any>} [variableMap] Variable descriptors.
 * @param {t.File} [ast] Whole-file AST (optional).
 * @param {Set<string>} [visitedVariables] Cycle guard set.
 * @returns {any} Extracted value or descriptor, or `null` if not resolvable.
 */
export function extractValue(
    node: t.Node,
    localArrays: Record<string, any[]>,
    variableMap: Record<string, any> = {},
    ast?: t.File,
    visitedVariables: Set<string> = new Set(),
): any {
    const literalValue = extractLiteralValue(node)
    if (literalValue !== undefined) return literalValue

    if (t.isObjectExpression(node)) {
        return extractObjectValue(node, localArrays, variableMap, ast, visitedVariables)
    }
    if (t.isArrayExpression(node)) {
        return extractArrayValue(node, localArrays, variableMap, ast, visitedVariables)
    }
    if (t.isIdentifier(node)) {
        return extractIdentifierValue(node, localArrays, variableMap, ast, visitedVariables)
    }

    if (t.isMemberExpression(node) || t.isOptionalMemberExpression(node)) {
        return createMemberAccessIdentifier(node)
    }

    if (t.isOptionalCallExpression(node)) {
        const info: any = createInvocationIdentifier(node, localArrays, variableMap)
        if (info && typeof info.object === "string") {
            const sampleArr = ((): any[] | undefined => {
                const v = variableMap[info.object]
                if (v && Array.isArray(v?.samples)) return v.samples
                if (v && Array.isArray(v?.sample)) return v.sample
                const fromLocal = localArrays[info.object]
                if (Array.isArray(fromLocal)) return fromLocal
                return undefined
            })()
            if (sampleArr) {
                info.samples = sampleArr // 주 출력
                if (info.sample === undefined) {
                    info.sample = sampleArr // 하위호환(단수 키도 채움)
                }
            }
        }
        return info
    }

    if (t.isCallExpression(node)) {
        const info: any = createInvocationIdentifier(node, localArrays, variableMap)
        if (info && typeof info.object === "string") {
            const sampleArr = ((): any[] | undefined => {
                const v = variableMap[info.object]
                if (v && Array.isArray(v?.samples)) return v.samples
                if (v && Array.isArray(v?.sample)) return v.sample
                const fromLocal = localArrays[info.object]
                if (Array.isArray(fromLocal)) return fromLocal
                return undefined
            })()
            if (sampleArr) {
                info.samples = sampleArr
                if (info.sample === undefined) {
                    info.sample = sampleArr
                }
            }
        }
        return info
    }
    if (t.isNewExpression(node)) {
        const ctor = exprToString(node.callee, localArrays, variableMap)
        const ctorStr = typeof ctor === "string" ? ctor : JSON.stringify(ctor)
        const argsSig = node.arguments ? argsToString(node.arguments as any) : ""
        return {
            type: "constructor_call",
            constructor: ctorStr,
            identifier: `new ${ctorStr}(${argsSig})`,
        }
    }

    return null
}

/**
 * Resolve the value referenced by a spread argument (`...x`) used in object/array literals.
 *
 * - Directly returns from `localArrays` or `variableMap` when available.
 * - Otherwise searches the AST for variable initializers/assignments.
 * @param {t.Node} node Spread argument node.
 * @param {Record<string, any[]>} localArrays Local arrays map.
 * @param {Record<string, any>} variableMap Variable descriptors.
 * @param {t.File} [ast] Whole-file AST for identifier resolution.
 * @param {Set<string>} [visitedVariables] Cycle guard set.
 * @returns {any} Resolved spread value or `null` if not resolvable.
 */
function resolveSpreadValue(
    node: t.Node,
    localArrays: Record<string, any[]>,
    variableMap: Record<string, any>,
    ast?: t.File,
    visitedVariables: Set<string> = new Set(),
): any {
    if (t.isIdentifier(node)) {
        const name = node.name
        if (visitedVariables.has(name)) return null

        visitedVariables.add(name)

        if (localArrays[name]) {
            visitedVariables.delete(name)
            return localArrays[name]
        }

        if (variableMap[name]) {
            visitedVariables.delete(name)
            return variableMap[name]
        }

        if (ast) {
            let result: any = null
            traverse(ast, {
                VariableDeclarator(varPath: NodePath<t.VariableDeclarator>) {
                    if (result !== null) return

                    if (
                        t.isIdentifier(varPath.node.id) &&
                        varPath.node.id.name === name &&
                        varPath.node.init
                    ) {
                        if (t.isObjectExpression(varPath.node.init)) {
                            const obj: Record<string, any> = {}
                            varPath.node.init.properties.forEach((prop) => {
                                if (
                                    t.isObjectProperty(prop) &&
                                    (t.isIdentifier(prop.key) || t.isStringLiteral(prop.key))
                                ) {
                                    const key = t.isIdentifier(prop.key)
                                        ? prop.key.name
                                        : prop.key.value
                                    const value = extractValue(
                                        prop.value as t.Node,
                                        localArrays,
                                        variableMap,
                                        ast,
                                        visitedVariables,
                                    )
                                    obj[key] = value
                                }
                            })
                            result = obj
                        } else {
                            result = extractValue(
                                varPath.node.init,
                                localArrays,
                                variableMap,
                                ast,
                                visitedVariables,
                            )
                        }
                    }
                },
            })

            visitedVariables.delete(name)
            return result
        }

        visitedVariables.delete(name)
        return null
    }

    return extractValue(node, localArrays, variableMap, ast, visitedVariables)
}

/**
 * Find the value assigned to a variable by scanning the AST for matching
 * declarations and assignments. Prevents cycles via `visitedVariables`.
 * @param {string} variableName Identifier to resolve.
 * @param {t.File | undefined} ast Whole-file AST.
 * @param {Set<string>} visitedVariables Cycle guard set.
 * @param {Record<string, any[]>} localArrays Local arrays map.
 * @param {Record<string, any>} variableMap Variable descriptors.
 * @returns {any} Resolved value or `null` when not found.
 */
function findVariableValue(
    variableName: string,
    ast: t.File | undefined,
    visitedVariables: Set<string>,
    localArrays: Record<string, any[]>,
    variableMap: Record<string, any>,
): any {
    if (!ast || visitedVariables.has(variableName)) {
        return null
    }

    visitedVariables.add(variableName)

    let value: any = null
    traverse(ast, {
        VariableDeclarator(varPath: NodePath<t.VariableDeclarator>) {
            if (value !== null) return

            if (
                t.isIdentifier(varPath.node.id) &&
                varPath.node.id.name === variableName &&
                varPath.node.init
            ) {
                value = extractValue(
                    varPath.node.init,
                    localArrays,
                    variableMap,
                    ast,
                    visitedVariables,
                )
            }
        },
        AssignmentExpression(assignPath: NodePath<t.AssignmentExpression>) {
            if (value !== null) return

            if (
                t.isIdentifier(assignPath.node.left) &&
                assignPath.node.left.name === variableName
            ) {
                value = extractValue(
                    assignPath.node.right,
                    localArrays,
                    variableMap,
                    ast,
                    visitedVariables,
                )
            }
        },
    })

    visitedVariables.delete(variableName)
    return value
}
