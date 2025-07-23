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
 * Split raw Markdown into individual test blocks.
 * Each block starts with an HTTP method line and includes subsequent bullet lines.
 * @param {string} markdown - The raw Markdown string containing test definitions.
 * @returns {string[]} Array of trimmed test block strings.
 */
function splitTestBlocks(markdown: string): string[] {
    const blockRegex =
        /(?:^|\n)(?:-?\s*(?:GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)\s+[^\n]+)(?:\n(?:- .+))*/g
    const raw = markdown.match(blockRegex) || []
    return raw.map((b) => b.trim())
}
/**
 * Extract the API path prefix from a test block.
 * Strips any leading dash, matches the HTTP method and path, then returns the top two segments.
 * @param {string} mdBlock - A single test block string.
 * @returns {string} The normalized prefix (e.g. "/api/products").
 */
function getMarkdownPrefix(mdBlock: string): string {
    const firstLine = mdBlock.split("\n")[0].trim().replace(/^-\s*/, "") // remove leading “- ”
    const m = firstLine.match(
        /^(?:테스트 이름:\s*)?(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)\s+([^\s]+)/i,
    )
    if (!m) return "/unknown"
    const path = m[2]
    const parts = path.split("/").filter(Boolean)
    return "/" + parts.slice(0, 2).join("/")
}
/**
 * Group test blocks by their path prefix and chunk each group into arrays of limited size.
 * @param {string} markdown - The raw Markdown containing test blocks.
 * @param {number} [chunkSize] - Maximum number of blocks per chunk.
 * @returns {string[][]} Array of chunks, each a list of test block strings.
 */
function groupAndChunkMarkdownTests(markdown: string, chunkSize: number = 5): string[][] {
    const blocks = splitTestBlocks(markdown)
    const byPrefix: Record<string, string[]> = {}
    for (const blk of blocks) {
        const prefix = getMarkdownPrefix(blk)
        ;(byPrefix[prefix] ||= []).push(blk)
    }

    const allChunks: string[][] = []
    for (const group of Object.values(byPrefix)) {
        const chunks = _.chunk(group, chunkSize)
        for (const c of chunks) {
            allChunks.push(c)
        }
    }

    return allChunks
}
/**
 * Convert grouped Markdown test definitions into itdoc-formatted TypeScript,
 * calling the OpenAI API for each chunk.
 * @param {OpenAI} openai - An initialized OpenAI client instance.
 * @param {string} rawMarkdown - The raw Markdown test spec.
 * @param {boolean} isEn - Whether to generate prompts/output in English.
 * @param {boolean} [isTypeScript] - Whether output should use TypeScript syntax.
 * @returns {Promise<string|null>} The concatenated itdoc output or null on error.
 */
async function makeitdocByMD(
    openai: OpenAI,
    rawMarkdown: string,
    isEn: boolean,
    isTypeScript: boolean = false,
): Promise<string | null> {
    try {
        const maxRetry = 5
        let result = ""
        const chunks = groupAndChunkMarkdownTests(rawMarkdown, 5)
        let gptCallCount = 0

        for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
            const chunk = chunks[chunkIndex]
            const chunkContent = chunk.join("\n\n")
            let chunkResult = ""
            for (let retry = 0; retry < maxRetry; retry++) {
                gptCallCount++
                logger.info(`[makeitdocByMD] Attempting GPT call : ${gptCallCount} times`)
                const msg = getItdocPrompt(chunkContent, isEn, retry + 1, isTypeScript)
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
                chunkResult += cleaned + "\n"
                if (finishReason === "stop") break
                await new Promise((res) => setTimeout(res, 500))
            }
            result += chunkResult.trim() + "\n\n"
            await new Promise((res) => setTimeout(res, 500))
        }

        return result.trim()
    } catch (error: unknown) {
        logger.error(`makeitdocByMD() ERROR: ${error}`)
        return null
    }
}
/**
 * Extracts the top two segments of a URL path to use as a grouping prefix.
 * @param {string} path - The full request path (e.g. "/api/products/123").
 * @returns {string} The normalized prefix (e.g. "/api/products").
 */
function getPathPrefix(path: string): string {
    const parts = path.split("/").filter(Boolean)
    return "/" + parts.slice(0, 2).join("/")
}
/**
 * Groups an array of route objects by their path prefix and then chunks each group.
 * @param {{ path: string }[]} content - Array of route objects with a `path` property.
 * @param {number} [chunkSize=5] - Maximum number of routes per chunk.
 * @returns {any[][]} A list of route chunks, each chunk is an array of route objects.
 */

/**
 *
 * @param content
 * @param chunkSize
 */
function groupAndChunkRoutes(content: any[], chunkSize: number = 5): any[][] {
    const grouped = _.groupBy(content, (item: { path: string }) => getPathPrefix(item.path))
    const chunkedGroups: any[][] = []
    for (const groupItems of Object.values(grouped)) {
        const chunks = _.chunk(groupItems, chunkSize)
        chunkedGroups.push(...chunks)
    }
    return chunkedGroups
}
/**
 * Generates a Markdown specification by batching routes into chunks and querying the LLM.
 * @param {OpenAI} openai - An initialized OpenAI client.
 * @param {any[]} content - Array of route definitions to generate spec for.
 * @returns {Promise<string|null>} The concatenated Markdown spec, or null if an error occurred.
 */

/**
 *
 * @param openai
 * @param content
 */
async function makeMDByApp(openai: OpenAI, content: any): Promise<string | null> {
    try {
        let cnt = 0
        const chunks = groupAndChunkRoutes(content, 4)
        const maxRetry = 5
        let result = ""
        for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
            const chunk = chunks[chunkIndex]
            let chunkResult = ""
            for (let retry = 0; retry < maxRetry; retry++) {
                logger.info(`[makeMDByApp] Attempting GPT API call : ${++cnt} times`)
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
                if (finishReason === "stop") break
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
 * Main entry point to generate both Markdown specs and itdoc TypeScript tests.
 * - If `testspecPath` is provided, reads and processes that file.
 * - Otherwise analyzes an Express app's routes to build the spec.
 * @param {string} [testspecPath] - Optional path to an existing Markdown test spec file.
 * @param {string} [appPath] - Path to the Express app entry file (overrides spec metadata).
 * @param {string} [envPath] - Path to the .env file containing OPENAI_API_KEY.
 * @returns {Promise<void>} Exits the process on error, otherwise writes output files.
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
            logger.info(`[generateByLLM] App path found in : ${metadata.app} -> ${appPath}`)
        } else {
            logger.error(`
                [generateByLLM] App path is not defined in the test spec file. Please define it at the top of the test spec file like below:
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
        let analyzedRoutes = await analyzeRoutes(resolvedAppPath)

        if (!analyzedRoutes) {
            logger.error(
                "AST analysis failed. Please ensure your routes use app.get() or router.post() format.",
            )
            process.exit(1)
        }
        analyzedRoutes = analyzedRoutes.sort((a, b) => a.path.localeCompare(b.path))

        const specFromApp = await makeMDByApp(openai, analyzedRoutes)

        if (!specFromApp) {
            logger.error("Failed to generate markdown spec from app analysis.")
            process.exit(1)
        }

        const mdPath = path.join(outputDir, "output.md")
        fs.writeFileSync(mdPath, specFromApp, "utf8")
        logger.info(`Your APP Markdown spec analysis completed: ${mdPath}`)

        const doc = await makeitdocByMD(openai, specFromApp, false, isTypeScript)
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

        const doc = await makeitdocByMD(openai, specContent, false, isTypeScript)
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
    logger.info(`[generateByLLM] itdoc LLM SCRIPT completed.`)
}
