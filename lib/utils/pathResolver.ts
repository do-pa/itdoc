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

import path from "path"
import fs from "fs"

/**
 * @/ 형식의 경로를 프로젝트 루트 기준으로 해석합니다.
 * @param inputPath - 해석할 경로 (@/path/to/file 형식)
 * @param baseDir - 기준 디렉토리 (기본값: process.cwd())
 * @returns 해석된 절대 경로
 */
export function resolvePath(inputPath: string, baseDir: string = process.cwd()): string {
    if (inputPath.startsWith("@/")) {
        const projectRoot = findProjectRoot(baseDir)
        return path.resolve(projectRoot, inputPath.substring(2))
    }

    if (path.isAbsolute(inputPath)) {
        return inputPath
    }

    return path.resolve(baseDir, inputPath)
}

/**
 * 프로젝트 루트 디렉토리를 찾습니다 (package.json이 있는 곳)
 * @param startDir - 검색을 시작할 디렉토리
 * @returns 프로젝트 루트 디렉토리 경로
 */
function findProjectRoot(startDir: string): string {
    let currentDir = startDir

    while (currentDir !== path.dirname(currentDir)) {
        const packageJsonPath = path.join(currentDir, "package.json")

        if (fs.existsSync(packageJsonPath)) {
            return currentDir
        }

        currentDir = path.dirname(currentDir)
    }

    return startDir
}
