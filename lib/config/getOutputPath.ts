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

import * as path from "path"
import { readItdocConfig } from "./readPackageJson"
import logger from "./logger"

/**
 * Returns the absolute output path for generated documentation files.
 *
 * This function reads the output directory from the "itdoc.output" field
 * in the project's package.json using the `readItdocConfig` utility.
 * If the configured path is relative, it is resolved against the current working directory.
 *
 * It also logs the resolved path for developer visibility.
 * @function
 * @returns {string} The absolute path where output files should be saved.
 * @example
 * // In package.json:
 * {
 *   "itdoc": {
 *     "output": "docs/generated"
 *   }
 * }
 * // Returns: /absolute/path/to/project/docs/generated
 */
export function getOutputPath(): string {
    let outputPath = readItdocConfig("output", "output")

    if (!path.isAbsolute(outputPath)) {
        outputPath = path.resolve(process.cwd(), outputPath)
    }

    logger.info(
        `
        itdoc - The output path is set to: ${outputPath}
        You can change this path by modifying the 'itdoc.output' field in package.json.`,
        `ex) { "itdoc": { "output": "output" } }`,
    )

    return outputPath
}
