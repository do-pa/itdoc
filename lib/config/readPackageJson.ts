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
import { ItdocConfiguration, PackageJson } from "./ItdocConfiguration"

/**
 * package.json의 "itdoc" 항목 내에서 특정 인자를 읽어옵니다.
 * 만약 해당 인자가 존재하지 않으면, 기본값을 반환합니다.
 * @param key 조회할 인자명 (.으로 depth 추가 가능)
 * @param defaultValue 기본값
 * @returns {string} itdoc[key] 값 또는 defaultValue
 */
export function readItdocConfig(key: string, defaultValue: string): string {
    const packageJson = readPackageJson()
    if (!packageJson?.itdoc) {
        return defaultValue
    }

    const itdocConfig: ItdocConfiguration = packageJson.itdoc
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
 * package.json 파일을 읽어옵니다.
 * @returns {object} package.json 데이터
 */
function readPackageJson(): PackageJson {
    const packageJsonPath = path.resolve(process.cwd(), "package.json")
    try {
        const packageJsonData = fs.readFileSync(packageJsonPath, "utf8")
        return JSON.parse(packageJsonData)
    } catch (error) {
        logger.error("package.json을 읽는 중 오류 발생.", error)
        return {}
    }
}
