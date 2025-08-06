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
import { getProjectFiles, parseMultipleFiles } from "../utils/fileParser"
import { extractValue } from "../utils/extractValue"
import traversePkg from "@babel/traverse"
// @ts-expect-error - CommonJS/ES modules 호환성 이슈로 인한 타입 에러 무시
const traverse = traversePkg.default

/**
 * Dynamically finds related service methods across the project and extracts actual return values.
 * @param {string} methodName - Method name to find (e.g., getAllProducts)
 * @param {string} projectRoot - Project root path
 * @returns {any} Extracted actual return value or null
 */
export function extractActualReturnValue(methodName: string, projectRoot: string): any {
    try {
        const filePaths = getProjectFiles(projectRoot)
        const parsedFiles = parseMultipleFiles(filePaths)

        for (const { ast } of parsedFiles) {
            const result = extractReturnValueFromAST(ast, methodName)

            if (result && !hasPartialNullValues(result)) {
                return result
            }
        }

        return null
    } catch {
        return null
    }
}

/**
 * Checks if an object contains null values.
 * @param {any} obj - Object to check
 * @returns {boolean} Whether null values are included
 */
export function hasPartialNullValues(obj: any): boolean {
    if (obj === null || obj === undefined) return true
    if (typeof obj !== "object") return false
    if (Array.isArray(obj)) {
        return obj.some((item) => hasPartialNullValues(item))
    }
    return Object.values(obj).some((value) => hasPartialNullValues(value))
}

/**
 * Dynamically extracts return values of specific methods from AST.
 * @param {t.File} ast - File AST
 * @param {string} methodName - Method name
 * @returns {any} Return value structure
 */
export function extractReturnValueFromAST(ast: t.File, methodName: string): any {
    let returnValue: any = null

    traverse(ast, {
        ClassMethod(methodPath: NodePath<t.ClassMethod>) {
            if (t.isIdentifier(methodPath.node.key) && methodPath.node.key.name === methodName) {
                returnValue = extractReturnFromFunction(methodPath.node, ast)
            }
        },
        ObjectMethod(methodPath: NodePath<t.ObjectMethod>) {
            if (t.isIdentifier(methodPath.node.key) && methodPath.node.key.name === methodName) {
                returnValue = extractReturnFromFunction(methodPath.node, ast)
            }
        },
        VariableDeclarator(varPath: NodePath<t.VariableDeclarator>) {
            if (t.isObjectExpression(varPath.node.init)) {
                const objExpr = varPath.node.init
                objExpr.properties.forEach((prop) => {
                    if (t.isObjectProperty(prop) && t.isIdentifier(prop.key)) {
                        if (prop.key.name === methodName) {
                            if (
                                t.isArrowFunctionExpression(prop.value) ||
                                t.isFunctionExpression(prop.value)
                            ) {
                                returnValue = extractReturnFromFunction(prop.value, ast)
                            }
                        }
                    }
                })
            } else if (
                t.isIdentifier(varPath.node.id) &&
                varPath.node.id.name === methodName &&
                (t.isArrowFunctionExpression(varPath.node.init) ||
                    t.isFunctionExpression(varPath.node.init))
            ) {
                returnValue = extractReturnFromFunction(varPath.node.init, ast)
            }
        },
        FunctionDeclaration(funcPath: NodePath<t.FunctionDeclaration>) {
            if (funcPath.node.id && funcPath.node.id.name === methodName) {
                returnValue = extractReturnFromFunction(funcPath.node, ast)
            }
        },
    })

    return returnValue
}

/**
 * Extracts return structure from function/method
 * @param {t.Function} func - Function node
 * @param {t.File} ast - Complete file AST (for variable finding)
 * @returns {any} Return value structure
 */
export function extractReturnFromFunction(func: t.Function, ast?: t.File): any {
    let returnValue: any = null
    const visitedVariables = new Set<string>()

    /**
     * Recursively traverses nodes to find all ReturnStatements.
     * @param {t.Node} node Node to traverse
     * @returns {t.ReturnStatement[]} All ReturnStatements
     */
    function findAllReturnStatements(node: t.Node): t.ReturnStatement[] {
        const returns: t.ReturnStatement[] = []

        if (t.isReturnStatement(node)) {
            returns.push(node)
        }

        if (t.isBlockStatement(node)) {
            for (const stmt of node.body) {
                returns.push(...findAllReturnStatements(stmt))
            }
        }

        if (t.isIfStatement(node)) {
            returns.push(...findAllReturnStatements(node.consequent))
            if (node.alternate) {
                returns.push(...findAllReturnStatements(node.alternate))
            }
        }

        return returns
    }

    /**
     * Selects the most meaningful ReturnStatement.
     * Prioritizes actual values over undefined or null.
     * @param {t.ReturnStatement[]} returnStatements Return statements
     * @returns {t.ReturnStatement | null} The most meaningful ReturnStatement
     */
    function selectBestReturnStatement(
        returnStatements: t.ReturnStatement[],
    ): t.ReturnStatement | null {
        if (returnStatements.length === 0) return null

        for (const stmt of returnStatements) {
            if (stmt.argument) {
                if (t.isIdentifier(stmt.argument)) {
                    if (stmt.argument.name !== "undefined" && stmt.argument.name !== "null") {
                        return stmt
                    }
                } else {
                    return stmt
                }
            }
        }

        return returnStatements[0]
    }

    if (func.body && t.isBlockStatement(func.body)) {
        const allReturns = findAllReturnStatements(func.body)
        const returnStmt = selectBestReturnStatement(allReturns)

        if (returnStmt?.argument) {
            returnValue = extractValue(returnStmt.argument, {}, {}, ast, visitedVariables)
        }
    } else if (func.body && t.isExpression(func.body)) {
        returnValue = extractValue(func.body, {}, {}, ast, visitedVariables)
    }

    return returnValue
}
