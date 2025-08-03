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
import { IOpenAPIGenerator } from "./types/TestResult"
import logger from "../../config/logger"
import _ from "lodash"
/**
 * Exports OpenAPI Specification to JSON file based on test results.
 * @param {IOpenAPIGenerator} generator OAS generator instance
 * @param {string} outputPath Output file path
 */
export const exportOASToJSON = (generator: IOpenAPIGenerator, outputPath: string): void => {
    try {
        if (!generator) {
            throw new Error("A valid OpenAPI generator was not provided.")
        }

        if (!outputPath) {
            throw new Error("A valid output path was not provided.")
        }
        const spec = generator.generateOpenAPISpec()
        if (!spec) {
            throw new Error("Failed to generate OpenAPI specification.")
        }
        const outputDir = path.dirname(path.resolve(outputPath))
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true })
        }
        const filePath = path.resolve(outputPath)

        let finalSpec = spec
        if (fs.existsSync(filePath)) {
            try {
                const existingSpec: any = JSON.parse(fs.readFileSync(filePath, "utf8"))
                const { paths: oldPaths = {}, ...oldRest } = existingSpec
                const { paths: newPaths = {}, ...newRest } = spec
                const mergedRest = _.merge({}, oldRest, newRest)
                const allPathKeys = new Set([...Object.keys(oldPaths), ...Object.keys(newPaths)])
                const mergedPaths: Record<string, any> = {}
                for (const p of allPathKeys) {
                    mergedPaths[p] = _.merge({}, oldPaths[p] || {}, newPaths[p] || {})
                }

                finalSpec = {
                    ...mergedRest,
                    paths: mergedPaths,
                }
            } catch {
                finalSpec = spec
            }
        }
        fs.writeFileSync(filePath, JSON.stringify(finalSpec, null, 2), "utf8")
        logger.debug(`OpenAPI Specification exported to ${outputPath}`)
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
        logger.error(`Failed to export OpenAPI Specification: ${errorMessage}`)
    }
}
