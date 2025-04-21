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

import { loadConfig, bundle } from "@redocly/openapi-core"
import widdershins from "widdershins"
import { promises as fs } from "fs"
import { join } from "path"
import logger from "../../lib/config/logger"
import chalk from "chalk"

/**
 * OpenAPI 파일을 Markdown 및 HTML 문서로 변환합니다.
 * @param {string} oasOutputPath 변환할 OpenAPI 파일 경로 (YAML 또는 JSON)
 * @param {string} outputDir 생성된 문서를 저장할 출력 디렉터리 경로
 * @returns {Promise<void>} 변환 작업이 완료되면 해결되는 Promise
 */
export async function generateDocs(oasOutputPath: string, outputDir: string): Promise<void> {
    if (!outputDir) {
        throw new Error("유효한 출력 경로가 제공되지 않았습니다.")
    }

    try {
        logger.box("ITDOC MAKEDOCS SCRIPT START")

        const markdownPath = join(outputDir, "api.md")
        const htmlPath = join(outputDir, "redoc.html")

        logger.info(`OAS 파일 경로: ${oasOutputPath}`)
        logger.info(`Markdown 경로: ${markdownPath}`)
        logger.info(`HTML 경로: ${htmlPath}`)

        const config = await loadConfig({})
        logger.info("Step 1: Redocly 구성 로드 완료")

        const bundleResult = await bundle({ ref: oasOutputPath, config })
        const api = bundleResult.bundle.parsed
        logger.info("Step 2: OpenAPI 번들링 완료")
        const widdershinsOpts = { headings: 2, summary: true }
        console.log = () => {}
        const markdown = await widdershins.convert(api, widdershinsOpts)
        await fs.writeFile(markdownPath, markdown, "utf-8")
        logger.info("Step 3: Markdown 생성 완료")

        const safeSpec = JSON.stringify(api).replace(/</g, "\\u003c")
        const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>${api.info.title ?? "API Docs"}</title>
  <script src="https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js"></script>
</head>
<body>
  <redoc></redoc>
  <script>
    window.addEventListener('DOMContentLoaded', () => {
      Redoc.init(${safeSpec}, {}, document.querySelector('redoc'));
    });
  </script>
</body>
</html>`
        await fs.writeFile(htmlPath, htmlContent, "utf-8")
        logger.info("Step 4: HTML 생성 완료")
    } catch (error: unknown) {
        logger.error(chalk.red("문서 생성 중 오류 발생:"), error)
        process.exit(1)
    }
}
