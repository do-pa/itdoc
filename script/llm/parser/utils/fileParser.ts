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

/**
 * 주어진 의존성 트리 객체를 재귀적으로 플래트닝하여
 * 모든 파일 경로를 문자열 배열로 반환합니다.
 * @param {Record<string, any>} tree - dependency-tree 라이브러리로 생성된 트리 객체
 * @returns {string[]} 모든 파일 경로를 담은 문자열 배열
 */
function flattenTree(tree: Record<string, any>): string[] {
    return Object.keys(tree).reduce<string[]>(
        (acc, file) => acc.concat(file, flattenTree(tree[file] || {})),
        [],
    )
}
/**
 * 프로젝트 루트로부터 모든 관련 파일을 가져옵니다.
 * @param {string} projectRoot - 프로젝트 루트 경로
 * @returns {string[]} 분석 가능한 파일 목록
 */
export function getProjectFiles(projectRoot: string): string[] {
    try {
        const tree = dependencyTree({
            filename: path.resolve(projectRoot),
            directory: path.dirname(path.resolve(projectRoot)),
            filter: (p: string) => !p.includes("node_modules"),
        }) as Record<string, any>

        const files = Array.from(new Set(flattenTree(tree)))

        return files.filter((filePath) => {
            return fs.existsSync(filePath) && /\.(ts|js)$/.test(filePath)
        })
    } catch {
        return []
    }
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

/**
 * 여러 파일을 파싱하여 유효한 결과만 반환합니다.
 * @param {string[]} filePaths - 파일 경로 배열
 * @returns {Array<{ filePath: string; source: string; ast: t.File }>} 파싱된 파일 정보 배열
 */
export function parseMultipleFiles(
    filePaths: string[],
): Array<{ filePath: string; source: string; ast: t.File }> {
    const results: Array<{ filePath: string; source: string; ast: t.File }> = []

    for (const filePath of filePaths) {
        const parsed = parseFile(filePath)
        if (parsed) {
            results.push({
                filePath,
                source: parsed.source,
                ast: parsed.ast,
            })
        }
    }

    return results
}

/**
 * 파일이 존재하고 분석 가능한지 확인합니다.
 * @param {string} filePath - 파일 경로
 * @returns {boolean} 분석 가능 여부
 */
export function isAnalyzableFile(filePath: string): boolean {
    return fs.existsSync(filePath) && /\.(ts|js)$/.test(filePath)
}
