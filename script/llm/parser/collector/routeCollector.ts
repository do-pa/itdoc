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
// @ts-expect-error - Ignore the type error caused by a CommonJS/ES module compatibility issue.
const traverse = traversePkg.default
import * as t from "@babel/types"
import { RoutePrefix } from "../type/interface"
import { parseFile } from "../utils/fileParser"

/**
 * Finds app.use() calls and collects route prefixes.
 * @param {string[]} files - List of files to analyze
 * @returns {RoutePrefix[]} List of route prefixes
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
 * Collects exported router information from a file.
 * @param {t.File} ast - File AST
 * @returns {Record<string, string>} Exported router information
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
 * Determines the route prefix.
 * @param {string} obj - Object name
 * @param {Record<string, string>} exportedRouters - Exported router information
 * @param {RoutePrefix[]} routePrefixes - List of route prefixes
 * @returns {string} Route prefix
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
 * Builds the full path.
 * @param {string} prefix - Route prefix
 * @param {string} routePath - Route path
 * @returns {string} Full path
 */
export function buildFullPath(prefix: string, routePath: string): string {
    if (!prefix) return routePath

    return prefix.endsWith("/") ? prefix + routePath.replace(/^\//, "") : prefix + routePath
}
