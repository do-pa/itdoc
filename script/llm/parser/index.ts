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

import { RouteResult } from "./type/interface"
import { getProjectFiles } from "./utils/fileParser"
import { collectRoutePrefixes } from "./collector/routeCollector"
import { analyzeFileRoutes } from "./analyzer/routeAnalyzer"
import logger from "../../../lib/config/logger"

/**
 * 주어진 Express 앱 파일을 시작점으로
 * 전체 라우트를 분석해 JSON으로 반환합니다.
 * @param {string} appPath - 분석할 Express 앱 파일 경로
 * @returns {Promise<RouteResult[]>} 라우트 분석 결과
 */
export async function analyzeRoutes(appPath: string): Promise<RouteResult[]> {
    const files = getProjectFiles(appPath)
    logger.info(`[analyzeRoutes] Found ${files.length} files for route analysis`)

    const routePrefixes = collectRoutePrefixes(files)
    const results: RouteResult[] = []

    for (const file of files) {
        logger.debug(`[analyzeRoutes] Analyzing file: ${file}`)
        const fileResults = analyzeFileRoutes(file, routePrefixes)
        results.push(...fileResults)
    }
    logger.info(
        `[analyzeRoutes] Analyzed ${results.length} API endpoint${results.length !== 1 ? "s" : ""}`,
    )
    return results
}
