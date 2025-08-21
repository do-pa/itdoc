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

/**
 * Converts OpenAPI files to Markdown and HTML documents.
 * @param {string} oasOutputPath Path to the OpenAPI file to convert (YAML or JSON)
 * @param {string} outputDir Path to the output directory where generated documents will be saved
 * @returns {Promise<void>} Promise that resolves when the conversion operation is completed
 */
export async function generateDocs(oasOutputPath: string, outputDir: string): Promise<void> {
    if (!outputDir) {
        throw new Error("A valid output path was not provided.")
    }

    try {
        const markdownPath = join(outputDir, "api.md")
        const htmlPath = join(outputDir, "redoc.html")

        logger.info(`OAS file path: ${oasOutputPath}`)
        logger.info(`Markdown path: ${markdownPath}`)
        logger.info(`HTML path: ${htmlPath}`)

        const config = await loadConfig({})

        const bundleResult = await bundle({ ref: oasOutputPath, config })
        const api = bundleResult.bundle.parsed
        const widdershinsOpts = { headings: 2, summary: true }
        console.log = () => {}
        const markdown = await widdershins.convert(api, widdershinsOpts)
        await fs.writeFile(markdownPath, markdown, "utf-8")
        logger.info("Step 3: Markdown generation completed")

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
        logger.info("Step 4: HTML generation completed")
    } catch (error: unknown) {
        logger.error("Error occurred during document generation:", error)
        process.exit(1)
    }
}
