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

import traversePkg, { NodePath } from "@babel/traverse"
// @ts-expect-error - CommonJS/ES modules 호환성 이슈로 인한 타입 에러 무시
const traverse = traversePkg.default
import * as t from "@babel/types"
import { RouteResult, BranchDetail, RoutePrefix } from "./interface"
import { parseFile } from "./fileParser"
import { collectExportedRouters, determineRoutePrefix, buildFullPath } from "./routeCollector"
import { analyzeVariableDeclarator, analyzeMemberExpression } from "./variableAnalyzer"
import { analyzeResponseCall } from "./responseAnalyzer"

/**
 * 함수 내부를 순회하여 라우트 세부사항을 분석합니다.
 * @param {t.FunctionExpression | t.ArrowFunctionExpression} functionNode - 함수 노드
 * @param {string} source - 소스 코드
 * @param {any} ret - 분석 결과 저장 객체
 * @param {NodePath<t.CallExpression>} parentPath - 부모 노드
 * @param {string} filePath - 현재 파일 경로
 */
export function analyzeFunctionBody(
    functionNode: t.FunctionExpression | t.ArrowFunctionExpression,
    source: string,
    ret: any,
    parentPath: NodePath<t.CallExpression>,
    filePath: string,
) {
    const localArrays: Record<string, any[]> = {}

    traverse(
        functionNode.body as t.Node,
        {
            VariableDeclarator(varPath: NodePath<t.VariableDeclarator>) {
                analyzeVariableDeclarator(varPath, ret, localArrays, filePath)
            },
            CallExpression(callPath: NodePath<t.CallExpression>) {
                analyzeResponseCall(callPath, source, ret, localArrays)
            },
            MemberExpression(memPath: NodePath<t.MemberExpression>) {
                analyzeMemberExpression(memPath, ret)
            },
        },
        parentPath.scope,
        parentPath,
    )
}

/**
 * 라우트 정의를 분석합니다.
 * @param {NodePath<t.CallExpression>} pathExpr - 호출 표현식 노드
 * @param {string} source - 소스 코드
 * @param {Record<string, string>} exportedRouters - 내보낸 라우터 정보
 * @param {RoutePrefix[]} routePrefixes - 라우트 프리픽스 목록
 * @param {string} filePath - 현재 파일 경로
 * @returns {RouteResult[]} 라우트 분석 결과
 */
export function analyzeRouteDefinition(
    pathExpr: NodePath<t.CallExpression>,
    source: string,
    exportedRouters: Record<string, string>,
    routePrefixes: RoutePrefix[],
    filePath: string,
): RouteResult[] {
    const { node } = pathExpr

    if (
        !t.isMemberExpression(node.callee) ||
        !t.isIdentifier(node.callee.object) ||
        !t.isIdentifier(node.callee.property)
    ) {
        return []
    }

    const obj = node.callee.object.name
    const prop = node.callee.property.name

    const routerObjects = ["app", "router", "server", "express"]
    const httpMethods = ["get", "post", "put", "delete", "patch", "all", "use", "head", "options"]

    if (!routerObjects.includes(obj) || !httpMethods.includes(prop)) {
        return []
    }

    const method = prop.toUpperCase()
    const routePath = t.isStringLiteral(node.arguments[0]) ? node.arguments[0].value : "<dynamic>"

    const prefix = determineRoutePrefix(obj, exportedRouters, routePrefixes)
    const fullPath = buildFullPath(prefix, routePath)

    const results: RouteResult[] = []

    node.arguments.slice(1).forEach((arg) => {
        if (!t.isFunctionExpression(arg) && !t.isArrowFunctionExpression(arg)) return

        const ret = {
            method,
            path: fullPath,
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

        analyzeFunctionBody(arg, source, ret, pathExpr, filePath)

        results.push({
            method: ret.method,
            path: ret.path,
            req: {
                headers: [
                    ...new Set([...ret.reqHeaders].filter((h) => h !== "headers" && h !== "body")),
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

    return results
}

/**
 * 단일 파일에서 라우트를 분석합니다.
 * @param {string} filePath - 파일 경로
 * @param {RoutePrefix[]} routePrefixes - 라우트 프리픽스 목록
 * @returns {RouteResult[]} 라우트 분석 결과
 */
export function analyzeFileRoutes(filePath: string, routePrefixes: RoutePrefix[]): RouteResult[] {
    const parsed = parseFile(filePath)
    if (!parsed) return []

    const { source, ast } = parsed
    const exportedRouters = collectExportedRouters(ast)
    const results: RouteResult[] = []

    traverse(ast, {
        CallExpression(pathExpr: NodePath<t.CallExpression>) {
            const routeResults = analyzeRouteDefinition(
                pathExpr,
                source,
                exportedRouters,
                routePrefixes,
                filePath,
            )
            results.push(...routeResults)
        },
    })

    return results
}
