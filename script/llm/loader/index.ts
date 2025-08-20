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

type FileType = "app" | "env"

/**
 * Load and optionally read a file depending on its {@link FileType}.
 *
 * Behavior by type:
 * - **`"app"`** (required): If the file cannot be resolved, logs an error and **terminates the process** with `process.exit(1)`.
 * - **`"env"`** (optional): If the file cannot be resolved, logs a warning and returns an empty string.
 *
 * Resolution rules:
 * - If `filePath` is provided, it is resolved relative to `process.cwd()` when not absolute.
 * - If `filePath` is omitted, the function searches a set of sensible defaults for the given type.
 * @param {FileType} type
 *        The category of file to resolve (`"app"` or `"env"`).
 * @param {string} [filePath]
 *        An explicit path to the file. If relative, it is resolved from `process.cwd()`.
 *        When omitted, a default search list is used (see implementation).
 * @param {boolean} [readContent]
 *        When `true`, returns the UTF-8 file contents; when `false`, returns the resolved absolute path.
 * @returns {string}
 *        The resolved absolute path (when `readContent === false`) or the UTF-8 contents (when `true`).
 *        For missing `"env"` files, an empty string is returned.
 */
export function loadFile(type: FileType, filePath?: string, readContent: boolean = false): string {
    const defaults: Record<FileType, string[]> = {
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

    let resolved: string | undefined
    if (filePath) {
        resolved = path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath)
    } else {
        resolved = defaults[type].find((p) => fs.existsSync(p))
    }
    if (!resolved || !fs.existsSync(resolved)) {
        if (type === "env") {
            if (filePath) {
                logger.warn(
                    `ENV file not found at provided path: ${filePath}. Continuing without it.`,
                )
            } else {
                logger.warn(
                    `ENV file not found at default locations: ${defaults.env.join(", ")}. Continuing without it.`,
                )
            }
            return readContent ? "" : ""
        }
        if (filePath) {
            logger.error(`${type} file does not exist: ${filePath}`)
        } else {
            logger.error(`${type} file not found. Searched: ${defaults[type].join(", ")}`)
        }
        process.exit(1)
    }
    if (!readContent) return resolved

    try {
        return fs.readFileSync(resolved, "utf8")
    } catch (err) {
        logger.error(`Failed to read ${type} file: ${resolved}. ${(err as Error).message}`)
        if (type === "env") {
            return ""
        }
        process.exit(1)
    }
}
