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
import dependencyTree from "dependency-tree"
import * as t from "@babel/types"
import { flattenTree } from "./utils/flattenTree"

/**
 * 의존성 트리를 기반으로 분석할 파일 목록을 가져옵니다.
 * @param {string} appPath - 분석할 Express 앱 파일 경로
 * @returns {string[]} 분석할 파일 목록
 */
export function getAnalysisFiles(appPath: string): string[] {
    const appFile = path.resolve(appPath)
    const projectDir = path.dirname(appFile)
    const tree = dependencyTree({
        filename: appFile,
        directory: projectDir,
        filter: (p: string) => !p.includes("node_modules"),
    }) as Record<string, any>

    return Array.from(new Set(flattenTree(tree)))
}

/**
 * 파일 내용을 읽고 AST로 파싱합니다.
 * @param {string} filePath - 파일 경로
 * @returns {{ source: string; ast: t.File } | null} 파일 내용과 AST
 */
export function parseFile(filePath: string): { source: string; ast: t.File } | null {
    let source: string
    try {
        source = fs.readFileSync(filePath, "utf8").replace(/^#!.*\r?\n/, "")
    } catch {
        return null
    }

    let ast: t.File
    try {
        ast = parse(source, {
            sourceType: "unambiguous",
            plugins: ["jsx", "typescript", "classProperties", "dynamicImport"],
        })
    } catch {
        return null
    }

    return { source, ast }
}
