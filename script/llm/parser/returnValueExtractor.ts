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
import dependencyTree from "dependency-tree"
import { flattenTree } from "./utils/flattenTree"

/**
 * 프로젝트 전체에서 관련 서비스 메서드를 동적으로 찾아 실제 리턴값을 추출합니다.
 * @param {string} methodName - 찾을 메서드명 (예: getAllProducts)
 * @param {string} projectRoot - 프로젝트 루트 경로
 * @returns {any} 추출된 실제 리턴값 또는 null
 */
export function extractActualReturnValue(methodName: string, projectRoot: string): any {
    try {
        const tree = dependencyTree({
            filename: path.resolve(projectRoot),
            directory: path.dirname(path.resolve(projectRoot)),
            filter: (p: string) => !p.includes("node_modules"),
        }) as Record<string, any>

        const files = Array.from(new Set(flattenTree(tree)))

        for (const filePath of files) {
            if (!fs.existsSync(filePath)) continue
            if (!/\.(ts|js)$/.test(filePath)) continue

            const parsed = parseFile(filePath)
            if (!parsed) continue

            const { ast } = parsed
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
 * 객체에 null 값이 포함되어 있는지 확인합니다.
 * @param {any} obj - 확인할 객체
 * @returns {boolean} null 값 포함 여부
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
 * AST에서 특정 메서드의 리턴값을 동적으로 추출합니다.
 * @param {t.File} ast - 파일 AST
 * @param {string} methodName - 메서드명
 * @returns {any} 리턴값 구조
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
                    if (
                        t.isObjectProperty(prop) &&
                        t.isIdentifier(prop.key) &&
                        prop.key.name === methodName
                    ) {
                        if (
                            t.isArrowFunctionExpression(prop.value) ||
                            t.isFunctionExpression(prop.value)
                        ) {
                            returnValue = extractReturnFromFunction(prop.value, ast)
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
 * 함수/메서드에서 리턴 구조를 추출합니다
 * @param {t.Function} func - 함수 노드
 * @param {t.File} ast - 전체 파일 AST (변수 찾기용)
 * @returns {any} 리턴값 구조
 */
export function extractReturnFromFunction(func: t.Function, ast?: t.File): any {
    let returnValue: any = null

    /**
     * AST 노드에서 실제 값을 추출합니다
     * @param node
     */
    function extractValueFromNode(node: t.Node): any {
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

    /**
     * AST에서 변수의 실제 값을 찾습니다
     * @param variableName
     */
    function findVariableValue(variableName: string): any {
        if (!ast) return null

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
     * Babel traverse를 이용해 리턴값을 추출합니다.
     * 함수 본문 내 `return` 구문만 탐색합니다.
     */
    traverse(
        t.file(t.program([])),
        {
            ReturnStatement(path: any) {
                const arg = path.node.argument
                if (!arg) return

                if (t.isIdentifier(arg)) {
                    const resolved = findVariableValue(arg.name)
                    returnValue = resolved ?? extractValueFromNode(arg)
                } else {
                    returnValue = extractValueFromNode(arg)
                }

                path.stop()
            },
        },
        undefined,
        undefined,
        func.body,
    )

    return returnValue
}
