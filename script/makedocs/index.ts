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

import { exec } from "child_process"
import { join, dirname } from "path"
import { fileURLToPath } from "url"
import logger from "../../lib/config/logger"
import chalk from "chalk"

// ESM 환경에서 __filename와 __dirname 계산
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

/**
 * OpenAPI 파일을 Markdown과 HTML 문서로 변환하는 함수.
 * @param oasOutputPath OpenAPI YAML 파일 경로
 * @param outputDir 생성된 문서 파일의 출력 디렉터리 경로
 */
export function generateDocs(oasOutputPath: string, outputDir: string): void {
    if (!outputDir) {
        throw new Error("유효한 출력 경로가 제공되지 않았습니다.")
    }
    try {
        logger.box("ITDOC MAKEDOCS SCRIPT START")
        logger.info(`OAS 파일 경로: ${oasOutputPath}`)
        const markdownPath = join(outputDir, "output.md")
        logger.info("Step 1: OpenAPI YAML 파일을 Markdown으로 변환시작")

        const child1 = exec(
            `npx widdershins "${oasOutputPath}" -o "${markdownPath}"`,
            { cwd: __dirname },
            (error) => {
                if (error) {
                    logger.error("Step 1: OpenAPI YAML 파일을 Markdown으로 변환중 오류 발생", error)
                } else {
                    logger.info(
                        `Step 1: OpenAPI YAML 파일을 Markdown으로 변환완료: ${markdownPath}`,
                    )
                }
            },
        )
        child1.unref()
        const htmlPath = join(outputDir, "redoc.html")
        logger.info("Step 2: Redocly CLI를 사용하여 HTML 문서 생성시작")

        const child2 = exec(
            `npx @redocly/cli build-docs "${oasOutputPath}" --output "${htmlPath}"`,
            { cwd: __dirname },
            (error) => {
                if (error) {
                    logger.error("Step 2: Redocly CLI를 사용하여 HTML 문서 생성중 오류 발생", error)
                } else {
                    logger.info(`Step 2: Redocly CLI를 사용하여 HTML 문서 생성완료: ${htmlPath}`)
                }
            },
        )
        child2.unref()
        logger.info("모든 작업이 실행되었습니다. (명령은 비동기적으로 수행됩니다)")
    } catch (error: unknown) {
        logger.error(chalk.red("오류 발생:"), error)
        process.exit(1)
    }
}
