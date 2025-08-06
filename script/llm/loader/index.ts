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

import fs from "fs"
import path from "path"
import logger from "../../../lib/config/logger"

type FileType = "spec" | "app" | "env"

/**
 * Checks the path according to the given type and returns the file path or content.
 * @param {FileType} type "spec" | "app" | "env"
 * @param {string} filePath Input path (relative or absolute)
 * @param {boolean} readContent If true, returns file content as string; if false, returns only the path
 * @returns {string} (file content or path)
 */
export function loadFile(type: FileType, filePath?: string, readContent: boolean = false): string {
    const defaultPaths: Record<FileType, string[]> = {
        spec: [path.resolve(process.cwd(), "md/testspec.md")],
        app: [
            path.resolve(process.cwd(), "app.js"),
            path.resolve(process.cwd(), "app.ts"),
            path.resolve(process.cwd(), "src/app.js"),
            path.resolve(process.cwd(), "src/app.ts"),
            path.resolve(process.cwd(), "index.js"),
            path.resolve(process.cwd(), "index.ts"),
        ],
        env: [path.resolve(process.cwd(), ".env")],
    }

    let resolvedPath: string

    if (filePath) {
        resolvedPath = path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath)
    } else {
        const foundPath = defaultPaths[type].find((p) => fs.existsSync(p))

        if (!foundPath) {
            logger.error(
                `${type} 파일을 찾을 수 없습니다. 기본 경로: ${defaultPaths[type].join(", ")}`,
            )
            process.exit(1)
        }

        resolvedPath = foundPath
    }

    if (!fs.existsSync(resolvedPath)) {
        logger.error(`${type} 파일이 존재하지 않습니다: ${resolvedPath}`)
        process.exit(1)
    }
    return readContent ? fs.readFileSync(resolvedPath, "utf8") : resolvedPath
}
