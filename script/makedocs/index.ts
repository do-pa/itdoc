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

import { execSync } from "child_process"
import { join } from "path"
import logger from "../../lib/config/logger"

/**
 * OpenAPI 파일을 Markdown과 HTML 문서로 변환하는 동기 함수.
 * @param oasOutputPath OpenAPI YAML 파일 경로
 * @param outputDir 생성된 문서 파일의 출력 디렉터리 경로
 */
export function generateDocs(oasOutputPath: string, outputDir: string): void {
    if (!outputDir) {
        throw new Error("유효한 출력 경로가 제공되지 않았습니다.")
    }

    try {
        logger.box(`ITDOC MAKEDOCS SCRIPT START`)
        logger.info(`OAS 파일 경로: ${oasOutputPath}`)

        // Step 1: OpenAPI YAML 파일을 Markdown으로 변환
        logger.info(`Step 1: OpenAPI YAML 파일을 Markdown으로 변환시작`)
        const markdownPath = join(outputDir, "output.md")
        execSync(`npx widdershins "${oasOutputPath}" -o "${markdownPath}"`, {
            stdio: "inherit",
        })
        logger.info(`Step 1: OpenAPI YAML 파일을 Markdown으로 변환완료: ${markdownPath}`)

        // Step 2: Redocly CLI를 사용하여 HTML 문서 생성
        logger.info(`Step 2: Redocly CLI를 사용하여 HTML 문서 생성시작`)
        const htmlPath = join(outputDir, "redoc.html")
        execSync(`"npx @redocly/cli build-docs  ${oasOutputPath} --output "${htmlPath}"`, {
            stdio: "inherit",
            cwd: __dirname,
        })
        logger.info(`Step 2: Redocly CLI를 사용하여 HTML 문서 생성완료: ${htmlPath}`)
        logger.info(`모든 작업이 성공적으로 완료되었습니다.`)
    } catch (error: unknown) {
        logger.error(`문서 생성 중 오류가 발생했습니다:`, error)
    }
}
