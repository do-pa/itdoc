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
import { RoutePrefix } from "./interface"
import { parseFile } from "./fileParser"

/**
 * app.use() 호출을 찾아 라우트 프리픽스를 수집합니다.
 * @param {string[]} files - 분석할 파일 목록
 * @returns {RoutePrefix[]} 라우트 프리픽스 목록
 */
export function collectRoutePrefixes(files: string[]): RoutePrefix[] {
    const routePrefixes: RoutePrefix[] = []

    for (const file of files) {
        const parsed = parseFile(file)
        if (!parsed) continue

        const { ast } = parsed

        traverse(ast, {
            CallExpression(pathExpr: NodePath<t.CallExpression>) {
                const { node } = pathExpr
                if (
                    !t.isMemberExpression(node.callee) ||
                    !t.isIdentifier(node.callee.object) ||
                    !t.isIdentifier(node.callee.property, { name: "use" })
                )
                    return

                const obj = node.callee.object.name
                if (obj !== "app") return

                if (node.arguments.length < 2) return

                const prefixArg = node.arguments[0]
                if (!t.isStringLiteral(prefixArg)) return

                const prefix = prefixArg.value

                const routerArg = node.arguments[1]
                if (!t.isIdentifier(routerArg)) return

                const routerName = routerArg.name

                routePrefixes.push({
                    prefix,
                    routerName,
                    filePath: file,
                })
            },
        })
    }

    return routePrefixes
}

/**
 * 파일에서 내보낸 라우터 정보를 수집합니다.
 * @param {t.File} ast - 파일 AST
 * @returns {Record<string, string>} 내보낸 라우터 정보
 */
export function collectExportedRouters(ast: t.File): Record<string, string> {
    const exportedRouters: Record<string, string> = {}

    traverse(ast, {
        ExportNamedDeclaration(path: NodePath<t.ExportNamedDeclaration>) {
            const { node } = path
            if (t.isVariableDeclaration(node.declaration)) {
                node.declaration.declarations.forEach((decl) => {
                    if (t.isIdentifier(decl.id)) {
                        exportedRouters[decl.id.name] = decl.id.name
                    }
                })
            }
        },
    })

    return exportedRouters
}

/**
 * 라우트 프리픽스를 결정합니다.
 * @param {string} obj - 객체 이름
 * @param {Record<string, string>} exportedRouters - 내보낸 라우터 정보
 * @param {RoutePrefix[]} routePrefixes - 라우트 프리픽스 목록
 * @returns {string} 라우트 프리픽스
 */
export function determineRoutePrefix(
    obj: string,
    exportedRouters: Record<string, string>,
    routePrefixes: RoutePrefix[],
): string {
    if (obj === "app") {
        return ""
    }

    if (obj === "router") {
        for (const routerName of Object.keys(exportedRouters)) {
            const routePrefix = routePrefixes.find((rp) => rp.routerName === routerName)
            if (routePrefix) {
                return routePrefix.prefix
            }
        }
    }

    return ""
}

/**
 * 전체 경로를 구성합니다.
 * @param {string} prefix - 라우트 프리픽스
 * @param {string} routePath - 라우트 경로
 * @returns {string} 전체 경로
 */
export function buildFullPath(prefix: string, routePath: string): string {
    if (!prefix) return routePath

    return prefix.endsWith("/") ? prefix + routePath.replace(/^\//, "") : prefix + routePath
}
