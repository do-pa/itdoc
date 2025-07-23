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

import OpenAI from "openai"
import _ from "lodash"
import fs from "fs"
import path from "path"
import dotenv from "dotenv"
import { getItdocPrompt, getMDPrompt } from "./prompt/index"
import logger from "../../lib/config/logger"
import { loadFile } from "./loader/index"
import { getOutputPath } from "../../lib/config/getOutputPath"
import { analyzeRoutes } from "./parser/index"
import { parseSpecFile } from "../../lib/utils/specParser"
import { resolvePath } from "../../lib/utils/pathResolver"

/**
 * MD 콘텐츠에서 정의된 API 엔드포인트 개수를 계산합니다.
 * @param {string} mdContent - MD 파일 내용
 * @returns {number} API 엔드포인트 개수
 */
function countApiEndpointsInMD(mdContent: string): number {
    const apiRegex = /^(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)\s+\//gm
    const matches = mdContent.match(apiRegex)
    return matches ? matches.length : 0
}

/**
 * 생성된 TypeScript 코드에서 describeAPI 호출 개수를 계산합니다.
 * @param {string} tsContent - TypeScript 코드 내용
 * @returns {number} describeAPI 호출 개수
 */
function countDescribeAPICalls(tsContent: string): number {
    const describeAPIRegex = /describeAPI\s*\(/g
    const matches = tsContent.match(describeAPIRegex)
    return matches ? matches.length : 0
}

/**
 * LLM을 호출해 itdoc 테스트스크립트를 작성합니다.
 * @param {OpenAI} openai - 초기화된 OpenAI 클라이언트 인스턴스
 * @param {string} content - 처리할 마크다운 콘텐츠
 * @param {boolean} isEn - 영어 출력을 원할 경우 true
 * @param {boolean} isTypeScript - TypeScript 형식으로 출력할 경우 true
 * @returns {Promise<string|null>} 생성된 문서 문자열, 오류 발생 시 null 반환
 */
async function makedocByMD(
    openai: OpenAI,
    content: string,
    isEn: boolean,
    isTypeScript: boolean = false,
): Promise<string | null> {
    try {
        const maxRetry = 5
        let result = ""

        const expectedApiCount = countApiEndpointsInMD(content)
        for (let i = 0; i < maxRetry; i++) {
            logger.info(`Attempting GPT API call (${i + 1}/${maxRetry})`)
            const msg = getItdocPrompt(content, isEn, i + 1, isTypeScript)

            const response: any = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: [{ role: "user", content: msg }],
                temperature: 0,
                max_tokens: 10000,
            })

            const text = response.choices[0].message.content?.trim() ?? ""
            const finishReason = response.choices[0].finish_reason

            const cleaned = text
                .replace(/```(?:json|javascript|typescript|markdown)?/g, "")
                .replace(/```/g, "")
                .replace(/\(.*?\/.*?\)/g, "")
                .trim()
            result += cleaned + "\n"

            const generatedApiCount = countDescribeAPICalls(result)
            const isComplete = generatedApiCount >= expectedApiCount
            logger.info(
                `Progress of itdoc test generation: ${generatedApiCount} out of ${expectedApiCount}`,
            )

            if (
                finishReason === "stop" &&
                !cleaned.endsWith("...") &&
                !/\(\d+\/\d+\)\s*$/.test(cleaned) &&
                isComplete
            ) {
                break
            }

            if (finishReason === "stop" && !isComplete) {
                continue
            }

            if (finishReason === "length") {
                continue
            }

            await new Promise((res) => setTimeout(res, 500))
        }
        return result.trim()
    } catch (error: unknown) {
        logger.error(`makedocByMD() ERROR : ${error}`)
        return null
    }
}

/**
 * Extracts the path prefix from a given path string.
 * For example, '/api/products/123' → '/api/products'
 * @param {string} path - The full URL path.
 * @returns {string} The extracted prefix consisting of the first two non-empty segments.
 */
function getPathPrefix(path: string): string {
    const parts = path.split("/").filter(Boolean)
    return "/" + parts.slice(0, 2).join("/")
}

/**
 * Groups routes by their path prefix (e.g., '/api/products') and then chunks them into smaller arrays.
 *
 * This is useful for batching routes for processing, such as sending them in GPT prompt segments.
 * @param {any[]} content - An array of route objects that contain a 'path' property.
 * @param {number} [chunkSize=5] - The desired size of each chunk after flattening the grouped routes.
 * @returns {any[][]} An array of chunks, where each chunk is an array of route objects.
 */

/**
 *
 * @param content
 * @param chunkSize
 */
function groupAndChunkRoutes(content: any[], chunkSize: number = 5): any[][] {
    const grouped = _.groupBy(content, (item) => getPathPrefix(item.path))
    const flatRoutes = Object.values(grouped).flat()
    const chunks = _.chunk(flatRoutes, chunkSize)
    return chunks
}

/**
 *
 * @param openai
 * @param content
 */
async function makeMDByApp(openai: OpenAI, content: any): Promise<string | null> {
    try {
        const chunks = groupAndChunkRoutes(content, 4)
        const maxRetry = 30
        let result = ""
        for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
            const chunk = chunks[chunkIndex]
            let chunkResult = ""
            console.log(chunk)
            for (let retry = 0; retry < maxRetry; retry++) {
                logger.info(
                    `Attempting GPT API call for chunk ${chunkIndex + 1}/${chunks.length} (Retry ${retry + 1}/${maxRetry})`,
                )
                const msg = getMDPrompt(chunk, retry + 1)

                const response: any = await openai.chat.completions.create({
                    model: "gpt-4o",
                    messages: [{ role: "user", content: msg }],
                    temperature: 0,
                    max_tokens: 10000,
                })

                const text = response.choices[0].message.content?.trim() ?? ""
                const finishReason = response.choices[0].finish_reason
                const cleaned = text
                    .replace(/```(?:json|javascript|typescript|markdown)?/g, "")
                    .replace(/```/g, "")
                    .replace(/`markdown/g, "")
                    .replace(/\(.*?\/.*?\)/g, "")
                    .trim()

                chunkResult += cleaned + "\n"

                if (
                    finishReason === "stop" &&
                    !cleaned.endsWith("...") &&
                    !/\(\d+\/\d+\)\s*$/.test(cleaned)
                ) {
                    break
                }

                await new Promise((res) => setTimeout(res, 500))
            }
            result += chunkResult.trim() + "\n\n"
        }

        return result.trim()
    } catch (error: unknown) {
        logger.error(`makeMDByApp() ERROR: ${error}`)
        return null
    }
}

/**
 * 테스트 코드 생성 메인 함수
 * .env 파일, 테스트 스펙 마크다운 파일, package.json을 읽고 출력 디렉토리 결정 후 makedocLLM()를 호출합니다.
 * @param {string} [testspecPath] - 테스트 스펙 마크다운 파일 경로(절대/상대)
 * @param {string} [appPath] - 앱 루트파일 경로 (절대/상대)
 * @param {string} [envPath] - 환경 변수 파일(.env) 경로(절대/상대)
 * @returns {Promise<void>}
 */
export default async function generateByLLM(
    testspecPath?: string,
    appPath?: string,
    envPath?: string,
): Promise<void> {
    const actualEnv = loadFile("env", envPath, false)
    dotenv.config({ path: actualEnv })
    if (!process.env.OPENAI_API_KEY) {
        logger.error("Missing environment variable: OPENAI_API_KEY is not defined.")
        process.exit(1)
    }
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    const outputDir = getOutputPath()
    fs.mkdirSync(outputDir, { recursive: true })
    let result = ""
    let isTypeScript = false
    let appImportPath = ""
    let resolvedAppPath = ""
    let parsedSpecContent = ""
    const originalAppPath = appPath

    if (testspecPath && !originalAppPath) {
        if (!fs.existsSync(testspecPath)) {
            logger.error(`Test spec file not found: ${testspecPath}`)
            process.exit(1)
        }

        const specContent = fs.readFileSync(testspecPath, "utf8")
        const { metadata, content } = parseSpecFile(specContent)
        parsedSpecContent = content

        if (metadata.app) {
            appPath = resolvePath(metadata.app)
            logger.info(`App path found in test spec: ${metadata.app} -> ${appPath}`)
        } else {
            logger.error(`
                App path is not defined in the test spec file.
                Please define it at the top of the test spec file like below:
                ---
                app:@/path/to/your/app.js
                ---
                `)
            process.exit(1)
        }
    }

    if (!appPath) {
        logger.error("App path not provided. Please specify it with -a or --app option.")
        process.exit(1)
    }

    resolvedAppPath = loadFile("app", appPath, false)
    isTypeScript = resolvedAppPath.endsWith(".ts")

    const relativePath = path.relative(outputDir, resolvedAppPath).replace(/\\/g, "/")
    appImportPath = relativePath.startsWith(".") ? relativePath : `./${relativePath}`

    if (!testspecPath) {
        logger.info(`
            appPath: ${appPath}
            AST Analysis → Markdown Spec Generation → Test Script Generation via GPT API
            * GPT API will be called up to 10 times.
        `)

        let analyzedRoutes = await analyzeRoutes(resolvedAppPath)

        if (!analyzedRoutes) {
            logger.error(
                "AST analysis failed. Please ensure your routes use app.get() or router.post() format.",
            )
            process.exit(1)
        }
        analyzedRoutes = analyzedRoutes.sort((a, b) => a.path.localeCompare(b.path))

        const routesDumpPath = path.join(outputDir, "analyzedRoutes.json")
        fs.writeFileSync(routesDumpPath, JSON.stringify(analyzedRoutes, null, 2), "utf8")
        logger.info(`Analyzed route info saved to: ${routesDumpPath}`)

        const specFromApp = await makeMDByApp(openai, analyzedRoutes)

        if (!specFromApp) {
            logger.error("Failed to generate markdown spec from app analysis.")
            process.exit(1)
        }

        const mdPath = path.join(outputDir, "output.md")
        fs.writeFileSync(mdPath, specFromApp, "utf8")
        logger.info(`Markdown spec from app analysis saved: ${mdPath}`)

        const doc = await makedocByMD(openai, specFromApp, false, isTypeScript)
        if (!doc) {
            logger.error("Failed to generate itdoc from markdown spec.")
            process.exit(1)
        }
        result = doc
    } else {
        let specContent: string
        if (parsedSpecContent) {
            specContent = parsedSpecContent
        } else {
            specContent = loadFile("spec", testspecPath, true)
        }

        const doc = await makedocByMD(openai, specContent, false, isTypeScript)
        if (!doc) {
            logger.error("Failed to generate test code from markdown spec.")
            process.exit(1)
        }
        result = doc
    }

    if (!result) {
        logger.error("generateByLLM() did not return any result.")
        process.exit(1)
    }

    const fileExtension = isTypeScript ? ".ts" : ".js"
    const outPath = path.join(outputDir, `output${fileExtension}`)

    if (isTypeScript && appImportPath.endsWith(".ts")) {
        appImportPath = appImportPath.replace(/\.ts$/, "")
    }

    let importStatement = ""
    if (isTypeScript) {
        importStatement = `import { app } from "${appImportPath}"
import { describeAPI, itDoc, HttpStatus, field, HttpMethod } from "itdoc"`
    } else {
        importStatement = `const app = require('${appImportPath}')
const { describeAPI, itDoc, HttpStatus, field, HttpMethod } = require("itdoc")
const targetApp = app
    `
    }
    result = importStatement + "\n\n" + result.trim()

    fs.writeFileSync(outPath, result, "utf8")
    logger.info(`itdoc 문서생성이 완료되었습니다.`)
}
