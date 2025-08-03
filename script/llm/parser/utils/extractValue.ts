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
import traversePkg from "@babel/traverse"
// @ts-expect-error - CommonJS/ES modules 호환성 이슈로 인한 타입 에러 무시
const traverse = traversePkg.default
import { NodePath } from "@babel/traverse"

/**
 * Creates identifier information for function calls.
 * @param {t.CallExpression} callExpression - Function call expression
 * @returns {object} Identifier information
 */
export function createFunctionIdentifier(callExpression: t.CallExpression): object {
    if (t.isMemberExpression(callExpression.callee)) {
        const { object, property } = callExpression.callee

        if (t.isIdentifier(object) && t.isIdentifier(property)) {
            return {
                type: "function_call",
                object: object.name,
                method: property.name,
                identifier: `${object.name}.${property.name}()`,
            }
        }
    } else if (t.isIdentifier(callExpression.callee)) {
        return {
            type: "function_call",
            method: callExpression.callee.name,
            identifier: `${callExpression.callee.name}()`,
        }
    }

    return {
        type: "function_call",
        identifier: "<function_call>",
    }
}

/**
 * Handles basic literal values
 * @param node
 */
function extractLiteralValue(node: t.Node): any {
    if (t.isStringLiteral(node)) return node.value
    if (t.isNumericLiteral(node) || t.isBooleanLiteral(node)) return node.value
    if (t.isNullLiteral(node)) return null
    return undefined
}

/**
 * Handles object expressions
 * @param node
 * @param localArrays
 * @param variableMap
 * @param ast
 * @param visitedVariables
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
 * Handles array expressions
 * @param node
 * @param localArrays
 * @param variableMap
 * @param ast
 * @param visitedVariables
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
 * Handles identifiers
 * @param node
 * @param localArrays
 * @param variableMap
 * @param ast
 * @param visitedVariables
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
        return mapping.sample || mapping
    }

    if (ast) {
        return findVariableValue(name, ast, visitedVariables, localArrays, variableMap)
    }

    return null
}

/**
 * Value extraction function
 * @param {t.Node} node - AST node to extract
 * @param {Record<string, any[]>} localArrays - Map of locally defined array variables
 * @param {Record<string, any>} variableMap - Variable name to data structure mapping
 * @param {t.File} ast - Complete file AST (for variable tracking)
 * @param {Set<string>} visitedVariables - For preventing circular references
 * @returns {any} Extracted actual value or identifier information
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

    if (t.isCallExpression(node)) {
        return createFunctionIdentifier(node)
    }

    return null
}

/**
 * Resolves values referenced by spread operators
 * @param {t.Node} node - Spread target node
 * @param {Record<string, any[]>} localArrays - Local array map
 * @param {Record<string, any>} variableMap - Variable map
 * @param {t.File} ast - File AST
 * @param {Set<string>} visitedVariables - Visited variables
 * @returns {any} Resolved value or null
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
 * Finds the actual value of a variable from AST
 * @param {string} variableName - Variable name to find
 * @param {t.File} ast - File AST
 * @param {Set<string>} visitedVariables - Visited variables (to prevent circular references)
 * @param {Record<string, any[]>} localArrays - Local arrays
 * @param {Record<string, any>} variableMap - Variable map
 * @returns {any} Actual value of the variable or null
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
