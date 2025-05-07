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
 * 주어진 타입에 따라 경로를 확인하고 파일 경로 또는 내용을 반환합니다.
 * @param type "spec" | "app" | "env"
 * @param filePath 입력된 경로 (상대 또는 절대)
 * @param readContent true일 경우 파일 내용을 string으로 반환, false면 경로만 반환
 * @returns string (파일 내용 또는 경로)
 */
export function loadFile(type: FileType, filePath?: string, readContent: boolean = false): string {
    const defaultPaths: Record<FileType, string> = {
        spec: path.resolve(process.cwd(), "md/testspec.md"),
        app: path.resolve(process.cwd(), "app.js"),
        env: path.resolve(process.cwd(), ".env"),
    }

    const resolvedPath =
        filePath && path.isAbsolute(filePath)
            ? filePath
            : path.resolve(process.cwd(), filePath || defaultPaths[type])

    if (!fs.existsSync(resolvedPath)) {
        logger.error(`${type} 파일이 존재하지 않습니다: ${resolvedPath}`)
        process.exit(1)
    }

    logger.info(`${type} 파일 로드: ${resolvedPath}`)
    return readContent ? fs.readFileSync(resolvedPath, "utf8") : resolvedPath
}
