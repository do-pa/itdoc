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

/* TODO: no-console 해제 후, console.log() 제거. logger를 사용하도록 변경 해야함. */
/* eslint-disable no-console */

import { execSync } from "child_process"
import { existsSync, mkdirSync } from "fs"
import { fileURLToPath } from "url"
import { dirname, join } from "path"
import chalk from "chalk"
import logger from "../../lib/config/logger"

/**
 * 현재 파일의 절대 경로를 가져옵니다.
 * @constant {string}
 */
const __filename: string = fileURLToPath(import.meta.url)

/**
 * 현재 파일이 위치한 디렉토리의 경로를 가져옵니다.
 * @constant {string}
 */
const __dirname: string = dirname(__filename)

/**
 * 출력 디렉토리의 경로를 설정합니다.
 * @constant {string}
 */
const outputDir: string = join(__dirname, "../../", "output")
if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true })
}

/**
 * OpenAPI YAML 파일의 경로를 설정합니다.
 * @constant {string}
 */
const openapiPath: string = join(__dirname, "../oas/openapi.yaml")
if (!existsSync(openapiPath)) {
    logger.error(`OAS 파일을 찾을 수 없습니다. 경로: ${openapiPath}`)
    process.exit(1)
}

try {
    logger.box(`ITDOC MAKEDOCS SCRIPT START`)
    logger.info(`OAS 파일 경로: ${openapiPath}`)
    logger.info(`Step 1: OpenAPI YAML 파일을 Markdown으로 변환시작`)
    const markdownPath = join(outputDir, "output.md")
    execSync(`npx widdershins "${openapiPath}" -o "${markdownPath}"`, {
        stdio: "inherit",
        cwd: __dirname,
    })
    logger.info(`Step 1: OpenAPI YAML 파일을 Markdown으로 변환완료: ${markdownPath}`)
    logger.info(`Step 2: Redocly CLI를 사용하여 HTML 문서 생성시작`)
    const htmlPath = join(outputDir, "redoc.html")
    execSync(`npx @redocly/cli build-docs "${openapiPath}" --output "${htmlPath}"`, {
        stdio: "inherit",
        cwd: __dirname,
    })
    logger.info(`Step 2: Redocly CLI를 사용하여 HTML 문서 생성완료: ${htmlPath}`)
    logger.info(`모든 작업이 성공적으로 완료되었습니다.`)
} catch (error: unknown) {
    console.error(chalk.red("오류 발생:"), error)
    process.exit(1)
}
