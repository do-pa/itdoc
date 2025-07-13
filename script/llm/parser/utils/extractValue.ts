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
 * 함수 호출에 대한 식별자 정보를 생성합니다.
 * @param {t.CallExpression} callExpression - 함수 호출 표현식
 * @returns {object} 식별자 정보
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
 * 기본 리터럴 값들을 처리합니다
 * @param node
 */
function extractLiteralValue(node: t.Node): any {
    if (t.isStringLiteral(node)) return node.value
    if (t.isNumericLiteral(node) || t.isBooleanLiteral(node)) return node.value
    if (t.isNullLiteral(node)) return null
    return undefined
}

/**
 * 객체 표현식을 처리합니다
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
    let hasActualValues = false

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
            if (value !== null) hasActualValues = true
        } else if (t.isSpreadElement(prop)) {
            hasActualValues = true
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

    return hasActualValues ? obj : null
}

/**
 * 배열 표현식을 처리합니다
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

    return elements.length > 0 ? elements : null
}

/**
 * 식별자를 처리합니다
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
 * 값 추출 함수
 * @param {t.Node} node - 추출할 AST 노드
 * @param {Record<string, any[]>} localArrays - 로컬에서 정의된 배열 변수 맵
 * @param {Record<string, any>} variableMap - 변수명과 데이터 구조 매핑
 * @param {t.File} ast - 전체 파일 AST (변수 추적용)
 * @param {Set<string>} visitedVariables - 순환 참조 방지용
 * @returns {any} 추출된 실제 값 또는 식별자 정보
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
 * 스프레드 연산자에서 참조하는 값을 해결합니다
 * @param {t.Node} node - 스프레드 대상 노드
 * @param {Record<string, any[]>} localArrays - 로컬 배열 맵
 * @param {Record<string, any>} variableMap - 변수 맵
 * @param {t.File} ast - 파일 AST
 * @param {Set<string>} visitedVariables - 방문한 변수들
 * @returns {any} 해결된 값 또는 null
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
 * AST에서 변수의 실제 값을 찾습니다
 * @param {string} variableName - 찾을 변수명
 * @param {t.File} ast - 파일 AST
 * @param {Set<string>} visitedVariables - 방문한 변수들 (순환 참조 방지)
 * @param {Record<string, any[]>} localArrays - 로컬 배열
 * @param {Record<string, any>} variableMap - 변수 맵
 * @returns {any} 변수의 실제 값 또는 null
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
