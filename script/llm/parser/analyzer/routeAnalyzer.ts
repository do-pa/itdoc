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
import * as path from "path"
import * as fs from "fs"
import { RouteResult, BranchDetail, RoutePrefix } from "../type/interface"
import { parseFile } from "../utils/fileParser"
import {
    collectExportedRouters,
    determineRoutePrefix,
    buildFullPath,
} from "../collector/routeCollector"
import { analyzeVariableDeclarator, analyzeMemberExpression } from "./variableAnalyzer"
import { analyzeResponseCall } from "./responseAnalyzer"
const EXTENSIONS = [".ts", ".js", ".cjs", ".mjs"]
/**
 * Finds the file path from which a specific function is imported within the given AST.
 * @param {string} functionName - The name of the function to locate.
 * @param {t.File} ast - The Babel-parsed AST of the current file.
 * @param {string} currentFilePath - The file path of the currently parsed file.
 * @returns {string | null} - The resolved absolute file path where the function is imported from, or null if not found.
 */
function findImportedFilePath(
    functionName: string,
    ast: t.File,
    currentFilePath: string,
): string | null {
    let resolvedImportPath: string | null = null

    traverse(ast, {
        ImportDeclaration(importDeclPath: NodePath<t.ImportDeclaration>) {
            const specifiers = importDeclPath.node.specifiers
            const source = importDeclPath.node.source.value

            for (const specifier of specifiers) {
                if (t.isImportSpecifier(specifier) && t.isIdentifier(specifier.imported)) {
                    if (specifier.imported.name === functionName) {
                        const currentDir = path.dirname(currentFilePath)
                        let resolvedPath = path.resolve(currentDir, source)

                        if (!path.extname(resolvedPath)) {
                            for (const ext of EXTENSIONS) {
                                if (fs.existsSync(resolvedPath + ext)) {
                                    resolvedPath += ext
                                    break
                                }
                            }
                        }

                        resolvedImportPath = resolvedPath
                        return
                    }
                }
            }
        },
    })

    return resolvedImportPath
}

/**
 * Searches for the function definition of a given function name within an AST.
 * It also follows import declarations if the function is imported from another file.
 * @param {string} functionName - The name of the function to locate.
 * @param {t.File} ast - The Babel-parsed AST of the file.
 * @param {string} [currentFilePath] - The current file path (used for resolving imported functions).
 * @returns {t.FunctionExpression | t.ArrowFunctionExpression | null} - The matched function expression or null if not found.
 */
function findFunctionDefinition(
    functionName: string,
    ast: t.File,
    currentFilePath?: string,
): t.FunctionExpression | t.ArrowFunctionExpression | null {
    let foundFunction: t.FunctionExpression | t.ArrowFunctionExpression | null = null

    traverse(ast, {
        FunctionDeclaration(funcPath: NodePath<t.FunctionDeclaration>) {
            if (funcPath.node.id && funcPath.node.id.name === functionName) {
                foundFunction = t.functionExpression(
                    funcPath.node.id,
                    funcPath.node.params,
                    funcPath.node.body,
                    funcPath.node.generator,
                    funcPath.node.async,
                )
            }
        },
        VariableDeclarator(varPath: NodePath<t.VariableDeclarator>) {
            if (t.isObjectExpression(varPath.node.init)) {
                const objExpr = varPath.node.init
                objExpr.properties.forEach((prop) => {
                    if (t.isObjectProperty(prop) && t.isIdentifier(prop.key)) {
                        if (prop.key.name === functionName) {
                            if (
                                t.isArrowFunctionExpression(prop.value) ||
                                t.isFunctionExpression(prop.value)
                            ) {
                                foundFunction = prop.value
                            }
                        }
                    }
                })
            } else if (
                t.isIdentifier(varPath.node.id) &&
                varPath.node.id.name === functionName &&
                varPath.node.init &&
                (t.isFunctionExpression(varPath.node.init) ||
                    t.isArrowFunctionExpression(varPath.node.init))
            ) {
                foundFunction = varPath.node.init
            }
        },
        ExportNamedDeclaration(exportPath: NodePath<t.ExportNamedDeclaration>) {
            if (exportPath.node.specifiers) {
                exportPath.node.specifiers.forEach((specifier) => {
                    if (
                        t.isExportSpecifier(specifier) &&
                        t.isIdentifier(specifier.exported) &&
                        specifier.exported.name === functionName
                    ) {
                        const localName = t.isIdentifier(specifier.local)
                            ? specifier.local.name
                            : functionName
                        if (localName !== functionName) {
                            foundFunction = findFunctionDefinition(localName, ast, currentFilePath)
                        }
                    }
                })
            }
        },
    })

    if (!foundFunction && currentFilePath) {
        const importedFilePath = findImportedFilePath(functionName, ast, currentFilePath)
        if (importedFilePath) {
            const importedFile = parseFile(importedFilePath)
            if (importedFile) {
                foundFunction = findFunctionDefinition(functionName, importedFile.ast)
            }
        }
    }

    return foundFunction
}
/**
 * Analyze the body of a route handler function to extract request/response metadata.
 *
 * Walks the handler’s AST and delegates to specialized analyzers:
 * - **VariableDeclarator** → `analyzeVariableDeclarator`
 * Captures destructured `req` fields (`query`, `params`, `headers`, `body`), tracks identifiers,
 * and records samples for local array literals (e.g., `const members = [...]`).
 * - **CallExpression** → `analyzeResponseCall`
 * Detects `res.status(...)`, `res.json(...)`, `res.send(...)`, and aggregates default/branch responses.
 * - **MemberExpression** → `analyzeMemberExpression`
 * Tracks usage like `req.headers.*`, `req.body.*`, and analyzes inline `res.json({ ... })` objects.
 *
 * The function **mutates** the provided accumulator `ret` in place (adds req field sets, response maps, etc.).
 * @param {t.FunctionExpression | t.ArrowFunctionExpression} functionNode
 *        The route handler (function or arrow function) whose body will be traversed.
 * @param {string} source
 *        Raw source code of the file; forwarded to sub-analyzers for context (e.g., snippet extraction).
 * @param {any} ret
 *        Mutable accumulator object that will be enriched with analysis results
 *        (e.g., `reqHeaders`, `reqParams`, `reqQuery`, `bodyFields`, `defaultResponse`, `branchResponses`).
 * @param {NodePath<t.CallExpression>} parentPath
 *        The `CallExpression` path that registered the route (e.g., `app.get(...)`), used to inherit scope during traversal.
 * @param {t.File} [ast]
 *        Optional full-file AST. When provided, sub-analyzers may use it to resolve identifiers across the file.
 * @returns {void} Mutates `ret` in place; no value is returned.
 */
export function analyzeFunctionBody(
    functionNode: t.FunctionExpression | t.ArrowFunctionExpression,
    source: string,
    ret: any,
    parentPath: NodePath<t.CallExpression>,
    ast?: t.File,
) {
    const localArrays: Record<string, any[]> = {}

    traverse(
        functionNode.body as t.Node,
        {
            VariableDeclarator(varPath: NodePath<t.VariableDeclarator>) {
                analyzeVariableDeclarator(varPath, ret, localArrays)
            },
            CallExpression(callPath: NodePath<t.CallExpression>) {
                analyzeResponseCall(callPath, source, ret, localArrays, ast)
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
 * Analyzes a call expression that represents an HTTP route definition (e.g., app.get).
 * @param {NodePath<t.CallExpression>} pathExpr - The call expression node to analyze.
 * @param {string} source - The source code of the file.
 * @param {Record<string, string>} exportedRouters - A map of exported router variables and their identifiers.
 * @param {RoutePrefix[]} routePrefixes - List of known route prefixes to resolve full paths.
 * @param {t.File} [ast] - The AST of the current file.
 * @param {string} [filePath] - The file path, used for resolving imported handlers.
 * @returns {RouteResult[]} - An array of analyzed route definitions with metadata.
 */
export function analyzeRouteDefinition(
    pathExpr: NodePath<t.CallExpression>,
    source: string,
    exportedRouters: Record<string, string>,
    routePrefixes: RoutePrefix[],
    ast?: t.File,
    filePath?: string,
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
        let functionToAnalyze: t.FunctionExpression | t.ArrowFunctionExpression | null = null

        if (t.isFunctionExpression(arg) || t.isArrowFunctionExpression(arg)) {
            functionToAnalyze = arg
        } else if (t.isIdentifier(arg) && ast) {
            functionToAnalyze = findFunctionDefinition(arg.name, ast, filePath)
        }

        if (!functionToAnalyze) return

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

        analyzeFunctionBody(functionToAnalyze, source, ret, pathExpr, ast)

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
 * Analyzes all route definitions in a given file.
 * @param {string} filePath - The path to the source file to be analyzed.
 * @param {RoutePrefix[]} routePrefixes - List of known route prefixes to resolve full paths.
 * @returns {RouteResult[]} - An array of route definitions found in the file.
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
                ast,
                filePath,
            )
            results.push(...routeResults)
        },
    })

    return results
}
