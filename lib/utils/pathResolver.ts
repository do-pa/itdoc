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
 * Converts "@/..." format paths to absolute paths based on the project root path.
 * @param inputPath - Path to resolve (@/path/to/file format)
 * @param baseDir - Base directory (default: process.cwd())
 * @returns Resolved absolute path
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
 * Finds the project root directory (where package.json exists)
 * @param startDir - Directory to start the search from
 * @returns Project root directory path
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
