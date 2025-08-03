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
import { determineBranchKey, getBranchDetail } from "./branchAnalyzer"
import { extractValue } from "../utils/extractValue"
import { BranchDetail } from "../type/interface"

/**
 * Handles response status codes.
 * @param {t.CallExpression} call - Call expression node
 * @param {BranchDetail} target - Branch details
 */
function handleResponseStatus(call: t.CallExpression, target: BranchDetail) {
    if (t.isNumericLiteral(call.arguments[0])) {
        target.status.push(call.arguments[0].value)
    }
}

/**
 * Handles JSON responses.
 * @param {t.CallExpression} call - Call expression node
 * @param {BranchDetail} target - Branch details
 * @param {Record<string, any[]>} localArrays - Local array storage object
 * @param {Record<string, any>} variableMap - Variable name to data structure mapping
 * @param {t.File} ast - File AST
 */
function handleJsonResponse(
    call: t.CallExpression,
    target: BranchDetail,
    localArrays: Record<string, any[]>,
    variableMap: Record<string, any> = {},
    ast?: t.File,
) {
    if (!call.arguments[0]) return

    const argNode = call.arguments[0]
    const extractedValue = extractValue(argNode, localArrays, variableMap, ast)

    if (extractedValue !== null) {
        target.json.push(extractedValue)
    }
}

/**
 * Handles header settings.
 * @param {t.CallExpression} call - Call expression node
 * @param {BranchDetail} target - Branch details
 * @param {Record<string, any[]>} localArrays - Local array storage object
 * @param {Record<string, any>} variableMap - Variable name to data structure mapping
 * @param {t.File} ast - File AST
 */
function handleHeaderResponse(
    call: t.CallExpression,
    target: BranchDetail,
    localArrays: Record<string, any[]>,
    variableMap: Record<string, any> = {},
    ast?: t.File,
) {
    const callee = call.callee as t.MemberExpression
    if (!t.isIdentifier(callee.property)) return

    const method = callee.property.name

    if (method === "setHeader" && t.isStringLiteral(call.arguments[0]) && call.arguments[1]) {
        target.headers.push({
            key: call.arguments[0].value,
            value: extractValue(call.arguments[1], localArrays, variableMap, ast),
        })
    } else if (method === "set" && t.isObjectExpression(call.arguments[0])) {
        call.arguments[0].properties.forEach((prop) => {
            if (
                t.isObjectProperty(prop) &&
                (t.isIdentifier(prop.key) || t.isStringLiteral(prop.key))
            ) {
                const key = t.isIdentifier(prop.key) ? prop.key.name : prop.key.value
                target.headers.push({
                    key,
                    value: extractValue(prop.value as t.Node, localArrays, variableMap, ast),
                })
            }
        })
    }
}

/**
 * Analyzes response calls.
 * @param {NodePath<t.CallExpression>} callPath - Call expression node
 * @param {string} source - Source code
 * @param {any} ret - Analysis result storage object
 * @param {Record<string, any[]>} localArrays - Local array storage object
 * @param {t.File} ast - File AST
 */
export function analyzeResponseCall(
    callPath: NodePath<t.CallExpression>,
    source: string,
    ret: any,
    localArrays: Record<string, any[]>,
    ast?: t.File,
) {
    const call = callPath.node

    if (!t.isMemberExpression(call.callee)) return

    let base = call.callee.object
    while (t.isCallExpression(base)) {
        base = (base.callee as t.MemberExpression).object
    }

    if (!t.isIdentifier(base) || base.name !== "res") return

    if (!t.isIdentifier(call.callee.property)) return

    const branchKey = determineBranchKey(callPath, source)
    const target = getBranchDetail(branchKey, ret)
    const method = call.callee.property.name
    const variableMap = ret.variableMap || {}

    switch (method) {
        case "status":
            handleResponseStatus(call, target)
            break
        case "json":
            handleJsonResponse(call, target, localArrays, variableMap, ast)
            break
        case "send":
            if (call.arguments[0]) {
                const extractedValue = extractValue(
                    call.arguments[0],
                    localArrays,
                    variableMap,
                    ast,
                )
                if (extractedValue !== null) {
                    target.send.push(extractedValue)
                }
            }
            break
        case "setHeader":
        case "set":
            handleHeaderResponse(call, target, localArrays, variableMap, ast)
            break
    }
}
