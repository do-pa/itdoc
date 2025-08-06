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
import logger from "./logger"

/**
 * Reads a specific argument from the "itdoc" section in package.json.
 * If the argument does not exist, returns the default value.
 * @param key Argument name to query (depth can be added with .)
 * @param defaultValue Default value
 * @returns itdoc[key] value or defaultValue
 */
export function readItdocConfig(key: string, defaultValue: string): string {
    const packageJson = readPackageJson()
    if (!packageJson) {
        return defaultValue
    }

    const itdocConfig = packageJson.itdoc
    if (!itdocConfig || typeof itdocConfig !== "object") {
        return defaultValue
    }

    const keys = key.split(".")
    let value: any = itdocConfig

    for (const k of keys) {
        if (value && typeof value === "object" && k in value) {
            value = value[k]
        } else {
            return defaultValue
        }
    }

    return typeof value === "string" ? value : defaultValue
}

/**
 * Reads and returns the parsed object of `package.json` from the current working directory.
 *
 * Returns null and outputs error logs if an error occurs during reading or parsing.
 * @returns {object | null} Parsed package.json object or null
 */
function readPackageJson(): any {
    const packageJsonPath = path.resolve(process.cwd(), "package.json")
    try {
        const packageJsonData = fs.readFileSync(packageJsonPath, "utf8")
        return JSON.parse(packageJsonData)
    } catch (error) {
        logger.error("Error occurred while reading package.json.", error)
        return null
    }
}
