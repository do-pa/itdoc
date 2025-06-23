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
import { parseFile } from "./fileParser"
import traversePkg from "@babel/traverse"
// @ts-expect-error - CommonJS/ES modules 호환성 이슈로 인한 타입 에러 무시
const traverse = traversePkg.default
import path from "path"
import fs from "fs"
import { generateSampleFromType, extractReturnTypeName } from "./typeBasedSampler"

/**
 * 서비스 파일에서 메서드의 실제 리턴값을 추출합니다.
 * @param {string} serviceName - 서비스명
 * @param {string} methodName - 메서드명
 * @param {string} currentFilePath - 현재 파일 경로 (상대 경로 해석용)
 * @returns {any} 실제 리턴값 구조
 */
export function extractActualReturnValue(
    serviceName: string,
    methodName: string,
    currentFilePath: string,
): any {
    try {
        const currentDir = path.dirname(currentFilePath)

        const camelCaseServiceName = serviceName.charAt(0).toLowerCase() + serviceName.slice(1)

        const possiblePaths = [
            path.join(currentDir, `${serviceName}.ts`),
            path.join(currentDir, `${serviceName}.js`),
            path.join(currentDir, `${camelCaseServiceName}.ts`),
            path.join(currentDir, `${camelCaseServiceName}.js`),
            path.join(currentDir, "services", `${serviceName}.ts`),
            path.join(currentDir, "services", `${serviceName}.js`),
            path.join(currentDir, "services", `${serviceName.toLowerCase()}.ts`),
            path.join(currentDir, "services", `${serviceName.toLowerCase()}.js`),
            path.join(currentDir, "services", `${camelCaseServiceName}.ts`),
            path.join(currentDir, "services", `${camelCaseServiceName}.js`),
            path.join(currentDir, "..", "services", `${serviceName}.ts`),
            path.join(currentDir, "..", "services", `${serviceName}.js`),
            path.join(currentDir, "..", "services", `${serviceName.toLowerCase()}.ts`),
            path.join(currentDir, "..", "services", `${serviceName.toLowerCase()}.js`),
            path.join(currentDir, "..", "services", `${camelCaseServiceName}.ts`),
            path.join(currentDir, "..", "services", `${camelCaseServiceName}.js`),
        ]

        for (const filePath of possiblePaths) {
            if (fs.existsSync(filePath)) {
                const parsed = parseFile(filePath)
                if (parsed) {
                    const result = extractReturnValueFromAST(parsed.ast, methodName)

                    if (result && hasPartialNullValues(result)) {
                        const enhanced = enhanceWithTypeBasedFallback(
                            result,
                            parsed.ast,
                            methodName,
                        )
                        if (enhanced) {
                            return enhanced
                        }
                    }

                    return result
                }
            }
        }

        return null
    } catch {
        return null
    }
}

/**
 * 객체에 null 값이 포함되어 있는지 확인합니다.
 * @param {any} obj - 확인할 객체
 * @returns {boolean} null 값 포함 여부
 */
export function hasPartialNullValues(obj: any): boolean {
    if (obj === null || obj === undefined) return false
    if (typeof obj !== "object") return false

    if (Array.isArray(obj)) {
        return obj.some((item) => hasPartialNullValues(item))
    }

    for (const key in obj) {
        const value = obj[key]
        if (value === null) return true
        if (typeof value === "object" && hasPartialNullValues(value)) return true
    }

    return false
}

/**
 * 부분적으로 추출된 결과를 타입 기반으로 보완합니다.
 * @param {any} partialResult - 부분적 추출 결과
 * @param {t.File} ast - 파일 AST
 * @param {string} methodName - 메서드명
 * @returns {any} 보완된 결과
 */
export function enhanceWithTypeBasedFallback(
    partialResult: any,
    ast: t.File,
    methodName: string,
): any {
    let targetFunction: t.Function | null = null

    traverse(ast, {
        VariableDeclarator(varPath: NodePath<t.VariableDeclarator>) {
            if (t.isIdentifier(varPath.node.id) && t.isObjectExpression(varPath.node.init)) {
                const objExpr = varPath.node.init
                objExpr.properties.forEach((prop) => {
                    if (
                        t.isObjectProperty(prop) &&
                        t.isIdentifier(prop.key) &&
                        prop.key.name === methodName
                    ) {
                        if (
                            t.isArrowFunctionExpression(prop.value) ||
                            t.isFunctionExpression(prop.value)
                        ) {
                            targetFunction = prop.value
                        }
                    }
                })
            }
        },
    })

    if (!targetFunction) return partialResult

    const returnTypeName = extractReturnTypeName(targetFunction)
    if (!returnTypeName) return partialResult

    const typeSample = generateSampleFromType(ast, returnTypeName)
    if (!typeSample) return partialResult

    return mergePartialWithTypeSample(partialResult, typeSample)
}

/**
 * 부분 결과와 타입 샘플을 병합합니다.
 * @param {any} partial - 부분 결과
 * @param {any} typeSample - 타입 기반 샘플
 * @returns {any} 병합된 결과
 */
export function mergePartialWithTypeSample(partial: any, typeSample: any): any {
    if (!partial || typeof partial !== "object") return typeSample
    if (!typeSample || typeof typeSample !== "object") return partial

    if (Array.isArray(partial) && Array.isArray(typeSample)) {
        return partial.length > 0 ? partial : typeSample
    }

    const merged = { ...typeSample }

    for (const key in partial) {
        if (partial[key] !== null && partial[key] !== undefined) {
            merged[key] = partial[key]
        }
    }

    return merged
}

/**
 * AST에서 특정 메서드의 리턴값을 추출합니다.
 * @param {t.File} ast - 파일 AST
 * @param {string} methodName - 메서드명
 * @returns {any} 리턴값 구조
 */
export function extractReturnValueFromAST(ast: t.File, methodName: string): any {
    let returnValue: any = null
    let targetFunction: t.Function | null = null

    traverse(ast, {
        Method(methodPath: NodePath<t.ClassMethod>) {
            if (t.isIdentifier(methodPath.node.key) && methodPath.node.key.name === methodName) {
                targetFunction = methodPath.node
                returnValue = extractReturnFromFunction(methodPath.node, ast)
            }
        },
        FunctionDeclaration(funcPath: NodePath<t.FunctionDeclaration>) {
            if (funcPath.node.id && funcPath.node.id.name === methodName) {
                targetFunction = funcPath.node
                returnValue = extractReturnFromFunction(funcPath.node, ast)
            }
        },
        VariableDeclarator(varPath: NodePath<t.VariableDeclarator>) {
            if (t.isIdentifier(varPath.node.id) && varPath.node.id.name === methodName) {
                if (
                    t.isArrowFunctionExpression(varPath.node.init) ||
                    t.isFunctionExpression(varPath.node.init)
                ) {
                    targetFunction = varPath.node.init
                    returnValue = extractReturnFromFunction(varPath.node.init, ast)
                }
            }

            if (t.isIdentifier(varPath.node.id) && t.isObjectExpression(varPath.node.init)) {
                const objExpr = varPath.node.init
                objExpr.properties.forEach((prop) => {
                    if (
                        t.isObjectProperty(prop) &&
                        t.isIdentifier(prop.key) &&
                        prop.key.name === methodName
                    ) {
                        if (
                            t.isArrowFunctionExpression(prop.value) ||
                            t.isFunctionExpression(prop.value)
                        ) {
                            targetFunction = prop.value
                            returnValue = extractReturnFromFunction(prop.value, ast)
                        }
                    }
                })
            }
        },
    })

    if ((returnValue === null || returnValue === undefined) && targetFunction) {
        const returnTypeName = extractReturnTypeName(targetFunction)
        if (returnTypeName) {
            const sampleFromType = generateSampleFromType(ast, returnTypeName)
            if (sampleFromType) {
                return sampleFromType
            }
        }
    }

    return returnValue
}

/**
 * 함수/메서드에서 리턴 구조를 추출합니다.
 * @param {t.Function} func - 함수 노드
 * @param {t.File} ast - 전체 파일 AST (변수 찾기용)
 * @returns {any} 리턴값 구조
 */
export function extractReturnFromFunction(func: t.Function, ast?: t.File): any {
    let returnValue: any = null

    /**
     *
     * @param node
     */
    function findReturnStatements(node: t.Node): void {
        if (t.isReturnStatement(node) && node.argument) {
            if (t.isIdentifier(node.argument) && ast) {
                const variableName = node.argument.name
                const actualValue = findVariableValue(ast, variableName)
                if (actualValue !== null) {
                    returnValue = actualValue
                } else {
                    returnValue = extractValueFromNode(node.argument)
                }
            } else {
                returnValue = extractValueFromNode(node.argument)
            }
            return
        }

        for (const key in node) {
            const child = (node as any)[key]
            if (Array.isArray(child)) {
                child.forEach((item) => {
                    if (item && typeof item === "object" && item.type) {
                        findReturnStatements(item)
                    }
                })
            } else if (child && typeof child === "object" && child.type) {
                findReturnStatements(child)
            }
        }
    }

    if (func.body) {
        findReturnStatements(func.body)
    }

    return returnValue
}

/**
 * AST에서 변수의 실제 값을 찾습니다.
 * @param {t.File} ast - 파일 AST
 * @param {string} variableName - 변수명
 * @returns {any} 변수의 실제 값
 */
export function findVariableValue(ast: t.File, variableName: string): any {
    let value: any = null

    traverse(ast, {
        VariableDeclarator(varPath: NodePath<t.VariableDeclarator>) {
            if (
                t.isIdentifier(varPath.node.id) &&
                varPath.node.id.name === variableName &&
                varPath.node.init
            ) {
                value = extractValueFromNode(varPath.node.init)
            }
        },
    })

    return value
}

/**
 * AST 노드에서 실제 값을 추출합니다.
 * @param {t.Node} node - AST 노드
 * @returns {any} 추출된 값
 */
export function extractValueFromNode(node: t.Node): any {
    if (t.isObjectExpression(node)) {
        const obj: Record<string, any> = {}
        node.properties.forEach((prop) => {
            if (
                t.isObjectProperty(prop) &&
                (t.isIdentifier(prop.key) || t.isStringLiteral(prop.key))
            ) {
                const key = t.isIdentifier(prop.key) ? prop.key.name : prop.key.value
                obj[key] = extractValueFromNode(prop.value as t.Node)
            }
        })
        return obj
    }

    if (t.isArrayExpression(node)) {
        return node.elements.map((el) => (el ? extractValueFromNode(el) : null))
    }

    if (t.isStringLiteral(node) || t.isNumericLiteral(node) || t.isBooleanLiteral(node)) {
        return node.value
    }

    if (t.isNullLiteral(node)) {
        return null
    }

    return null
}
