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

import * as fs from "fs"
import * as path from "path"
import { parse } from "@babel/parser"
import traversePkg, { NodePath } from "@babel/traverse"
const traverse = traversePkg.default
import dependencyTree from "dependency-tree"
import * as t from "@babel/types"

import { RouteResult, BranchDetail } from "./interface"
import { extractValue } from "./utils/extractValue"
import { flattenTree } from "./utils/flattenTree"

/**
 * 주어진 Express 앱 파일을 시작점으로
 * 전체 라우트를 분석해 JSON으로 반환합니다.
 * @param appPath  진입점 파일 경로
 */
export async function analyzeRoutes(appPath: string): Promise<RouteResult[]> {
    const appFile = path.resolve(appPath)
    const projectDir = path.dirname(appFile)
    const tree = dependencyTree({
        filename: appFile,
        directory: projectDir,
        filter: (p: string) => !p.includes("node_modules"),
    }) as Record<string, any>
    const files = Array.from(new Set(flattenTree(tree)))
    const results: RouteResult[] = []

    for (const file of files) {
        let source: string
        try {
            source = fs.readFileSync(file, "utf8").replace(/^#!.*\r?\n/, "")
        } catch {
            continue
        }

        let ast: t.File
        try {
            ast = parse(source, {
                sourceType: "unambiguous",
                plugins: ["jsx", "typescript", "classProperties", "dynamicImport"],
            })
        } catch {
            continue
        }

        traverse(ast, {
            CallExpression(pathExpr: NodePath<t.CallExpression>) {
                const { node } = pathExpr
                if (
                    !t.isMemberExpression(node.callee) ||
                    !t.isIdentifier(node.callee.object) ||
                    !t.isIdentifier(node.callee.property)
                )
                    return

                const obj = node.callee.object.name
                const prop = node.callee.property.name
                if (
                    !["app", "router"].includes(obj) ||
                    !["get", "post", "put", "delete", "patch", "all"].includes(prop)
                )
                    return

                const method = prop.toUpperCase()
                const routePath = t.isStringLiteral(node.arguments[0])
                    ? node.arguments[0].value
                    : "<dynamic>"

                node.arguments.slice(1).forEach((arg) => {
                    if (!t.isFunctionExpression(arg) && !t.isArrowFunctionExpression(arg)) return

                    const ret = {
                        method,
                        path: routePath,
                        reqHeaders: new Set<string>(),
                        reqParams: new Set<string>(),
                        reqQuery: new Set<string>(),
                        bodyFields: new Set<string>(),
                        defaultResponse: {
                            status: [],
                            json: [],
                            send: [],
                            headers: [],
                        } as BranchDetail,
                        branchResponses: {} as Record<string, BranchDetail>,
                    }
                    const localArrays: Record<string, any[]> = {}

                    traverse(
                        arg.body as t.Node,
                        {
                            VariableDeclarator(varPath) {
                                const decl = varPath.node
                                if (t.isIdentifier(decl.id) && t.isArrayExpression(decl.init)) {
                                    localArrays[decl.id.name] = []
                                }
                                if (
                                    t.isObjectPattern(decl.id) &&
                                    t.isMemberExpression(decl.init) &&
                                    t.isIdentifier(decl.init.object, { name: "req" }) &&
                                    t.isIdentifier(decl.init.property)
                                ) {
                                    const propName = decl.init.property.name
                                    decl.id.properties.forEach((prop) => {
                                        if (t.isObjectProperty(prop) && t.isIdentifier(prop.key)) {
                                            if (propName === "query") {
                                                ret.reqQuery.add(prop.key.name)
                                            } else if (propName === "params") {
                                                ret.reqParams.add(prop.key.name)
                                            } else if (propName === "headers") {
                                                ret.reqHeaders.add(prop.key.name.toLowerCase())
                                            } else if (propName === "body") {
                                                ret.bodyFields.add(prop.key.name)
                                            }
                                        }
                                    })
                                }
                            },
                            CallExpression(callPath) {
                                const call = callPath.node
                                if (
                                    t.isMemberExpression(call.callee) &&
                                    t.isIdentifier(call.callee.property, { name: "push" }) &&
                                    t.isIdentifier(call.callee.object)
                                ) {
                                    const arrName = call.callee.object.name
                                    if (localArrays[arrName] && call.arguments[0]) {
                                        localArrays[arrName].push(
                                            extractValue(call.arguments[0], localArrays),
                                        )
                                    }
                                }
                                if (!t.isMemberExpression(call.callee)) return
                                let base = call.callee.object
                                while (t.isCallExpression(base)) {
                                    base = (base.callee as t.MemberExpression).object
                                }
                                if (!t.isIdentifier(base) || base.name !== "res") return

                                let branchKey = "default"
                                const ifParent = callPath.findParent((p) => p.isIfStatement())
                                if (ifParent?.isIfStatement()) {
                                    const { test, consequent, alternate } = ifParent.node
                                    const condSrc = source.slice(test.start!, test.end!)

                                    // call 노드의 위치를 이용해서 consequent(then) 블록 내부인지 검사
                                    const callStart = call.start!,
                                        callEnd = call.end!
                                    const inThen =
                                        callStart >= consequent.start! && callEnd <= consequent.end!

                                    if (inThen) {
                                        branchKey = `if ${condSrc}`
                                    } else if (
                                        alternate && // else 또는 else-if 블록이 있을 때
                                        callStart >= alternate.start! &&
                                        callEnd <= alternate.end!
                                    ) {
                                        branchKey = "else"
                                    }
                                }
                                const isDefault = branchKey === "default"
                                if (!isDefault && !ret.branchResponses[branchKey]) {
                                    ret.branchResponses[branchKey] = {
                                        status: [],
                                        json: [],
                                        send: [],
                                        headers: [],
                                    }
                                }
                                const target = isDefault
                                    ? ret.defaultResponse
                                    : ret.branchResponses[branchKey]!

                                const m = call.callee.property.name
                                if (m === "status" && t.isNumericLiteral(call.arguments[0])) {
                                    target.status.push(call.arguments[0].value)
                                }
                                if (m === "json" && call.arguments[0]) {
                                    const argNode = call.arguments[0]
                                    if (t.isObjectExpression(argNode)) {
                                        const obj: any = {}
                                        argNode.properties.forEach((prop) => {
                                            if (
                                                t.isObjectProperty(prop) &&
                                                (t.isIdentifier(prop.key) ||
                                                    t.isStringLiteral(prop.key))
                                            ) {
                                                const keyName = t.isIdentifier(prop.key)
                                                    ? prop.key.name
                                                    : prop.key.value
                                                const v = prop.value
                                                if (t.isArrayExpression(v)) {
                                                    obj[keyName] = v.elements.map((el) =>
                                                        t.isStringLiteral(el) ||
                                                        t.isNumericLiteral(el) ||
                                                        t.isBooleanLiteral(el) ||
                                                        t.isNullLiteral(el)
                                                            ? (
                                                                  el as
                                                                      | t.StringLiteral
                                                                      | t.NumericLiteral
                                                                      | t.BooleanLiteral
                                                              ).value
                                                            : `<Identifier:${keyName}>`,
                                                    )
                                                } else if (
                                                    t.isStringLiteral(v) ||
                                                    t.isNumericLiteral(v) ||
                                                    t.isBooleanLiteral(v) ||
                                                    t.isNullLiteral(v)
                                                ) {
                                                    obj[keyName] = (
                                                        v as
                                                            | t.StringLiteral
                                                            | t.NumericLiteral
                                                            | t.BooleanLiteral
                                                    ).value
                                                } else {
                                                    obj[keyName] = `<Identifier:${keyName}>`
                                                }
                                            }
                                        })
                                        target.json.push(obj)
                                    } else {
                                        target.json.push(extractValue(argNode, localArrays))
                                    }
                                }
                                if (m === "send" && call.arguments[0]) {
                                    target.send.push(extractValue(call.arguments[0], localArrays))
                                }
                                if (
                                    m === "setHeader" &&
                                    t.isStringLiteral(call.arguments[0]) &&
                                    call.arguments[1]
                                ) {
                                    target.headers.push({
                                        key: call.arguments[0].value,
                                        value: extractValue(call.arguments[1], localArrays),
                                    })
                                }
                                if (m === "set" && t.isObjectExpression(call.arguments[0])) {
                                    call.arguments[0].properties.forEach((prop) => {
                                        if (
                                            t.isObjectProperty(prop) &&
                                            (t.isIdentifier(prop.key) ||
                                                t.isStringLiteral(prop.key))
                                        ) {
                                            const key = t.isIdentifier(prop.key)
                                                ? prop.key.name
                                                : prop.key.value
                                            target.headers.push({
                                                key,
                                                value: extractValue(
                                                    prop.value as t.Node,
                                                    localArrays,
                                                ),
                                            })
                                        }
                                    })
                                }
                            },
                            MemberExpression(memPath) {
                                const mm = memPath.node
                                // req.body.image 또는 req.headers.authorization 등 구체적 필드
                                if (
                                    t.isMemberExpression(mm.object) &&
                                    t.isIdentifier(mm.object.object, { name: "req" }) &&
                                    t.isIdentifier(mm.object.property) &&
                                    t.isIdentifier(mm.property)
                                ) {
                                    const parent = mm.object.property.name
                                    const child = mm.property.name
                                    if (parent === "headers") {
                                        ret.reqHeaders.add(child.toLowerCase())
                                    } else if (parent === "body") {
                                        ret.bodyFields.add(child)
                                    }
                                }
                            },
                        },
                        (pathExpr as any).scope,
                        pathExpr as any,
                    )

                    results.push({
                        method: ret.method,
                        path: ret.path,
                        req: {
                            headers: [
                                ...new Set(
                                    [...ret.reqHeaders].filter(
                                        (h) => h !== "headers" && h !== "body",
                                    ),
                                ),
                            ],
                            params: [...ret.reqParams],
                            query: [...ret.reqQuery],
                            body: [...ret.bodyFields],
                        },
                        responses: {
                            default: ret.defaultResponse,
                            branches: ret.branchResponses,
                        },
                    })
                })
            },
        })
    }
    return results
}
