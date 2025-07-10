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
 * 고급 값 추출 함수 - SpreadElement, CallExpression 등 복잡한 케이스 처리
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
    if (t.isStringLiteral(node)) {
        return node.value
    }
    if (t.isNumericLiteral(node) || t.isBooleanLiteral(node)) {
        return node.value
    }
    if (t.isNullLiteral(node)) {
        return null
    }

    if (t.isObjectExpression(node)) {
        const obj: Record<string, any> = {}
        let hasActualValues = false

        node.properties.forEach((prop) => {
            if (
                t.isObjectProperty(prop) &&
                (t.isIdentifier(prop.key) || t.isStringLiteral(prop.key))
            ) {
                const key = t.isIdentifier(prop.key) ? prop.key.name : prop.key.value
                const value = extractValue(
                    prop.value as t.Node,
                    localArrays,
                    variableMap,
                    ast,
                    visitedVariables,
                )

                if (value !== null) {
                    obj[key] = value
                    hasActualValues = true
                } else {
                    obj[key] = null
                }
            } else if (t.isSpreadElement(prop)) {
                const spreadValue = extractValue(
                    prop.argument,
                    localArrays,
                    variableMap,
                    ast,
                    visitedVariables,
                )

                if (spreadValue && typeof spreadValue === "object" && !Array.isArray(spreadValue)) {
                    Object.assign(obj, spreadValue)
                    hasActualValues = true
                } else if (t.isIdentifier(prop.argument)) {
                    obj[`...${prop.argument.name}`] = "<spread>"
                    hasActualValues = true
                } else {
                    hasActualValues = true
                }
            }
        })

        return hasActualValues ? obj : null
    }

    if (t.isArrayExpression(node)) {
        const elements = node.elements
            .map((el) =>
                el ? extractValue(el, localArrays, variableMap, ast, visitedVariables) : null,
            )
            .filter((value) => value !== null)

        return elements.length > 0 ? elements : null
    }

    if (t.isCallExpression(node)) {
        return createFunctionIdentifier(node)
    }

    if (t.isIdentifier(node)) {
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

    return null
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
                if (value === null && t.isIdentifier(varPath.node.init)) {
                    value = findVariableValue(
                        varPath.node.init.name,
                        ast,
                        visitedVariables,
                        localArrays,
                        variableMap,
                    )
                }
            }
        },
        AssignmentExpression(assignPath: NodePath<t.AssignmentExpression>) {
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
