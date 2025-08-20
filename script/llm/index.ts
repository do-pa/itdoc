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
import { getItdocPrompt } from "./prompt/index"
import logger from "../../lib/config/logger"
import { loadFile } from "./loader/index"
import { getOutputPath } from "../../lib/config/getOutputPath"
import { analyzeRoutes } from "./parser/index"
import { RouteResult } from "./parser/type/interface"

/**
 * Extracts a path prefix for grouping tests (first two non-empty segments).
 * @param {string} pathStr - Full request path (e.g. "/api/products/123").
 * @returns {string} Normalized prefix (e.g. "/api/products"). Empty -> "/".
 */
function getPathPrefix(pathStr: string): string {
    const parts = pathStr.split("/").filter(Boolean)
    return "/" + parts.slice(0, 2).join("/")
}

/**
 * Groups routes by prefix and chunks each group.
 * @param {RouteResult[]} routes - Parsed route specs.
 * @param {number} [chunkSize] - Max routes per chunk.
 * @returns {RouteResult[][]} Chunked groups of routes.
 */
function groupAndChunkSpecRoutes(routes: RouteResult[], chunkSize: number = 10): RouteResult[][] {
    const by: Record<string, RouteResult[]> = {}
    for (const r of routes) {
        const prefix = getPathPrefix(r.path || "/unknown")
        ;(by[prefix] ||= []).push(r)
    }
    const out: RouteResult[][] = []
    for (const group of Object.values(by)) {
        for (const c of _.chunk(group, chunkSize)) out.push(c)
    }
    return out
}

/**
 * Creates itdoc test code from analyzed route JSON using an LLM.
 *
 * - Groups routes by prefix into chunks.
 * - For each chunk, builds a prompt and calls OpenAI Chat Completions.
 * - Concatenates all generated tests into a single string.
 * @param {OpenAI} openai - OpenAI client.
 * @param {RouteResult[]} raw - Array of analyzed route specs.
 * @param {boolean} isEn - Output in English (true) or Korean (false).
 * @param {boolean} [isTypeScript] - Generate TS-flavored examples.
 * @returns {Promise<string|null>} Generated test code or null on failure.
 */
export async function makeitdoc(
    openai: OpenAI,
    raw: RouteResult[],
    isEn: boolean,
    isTypeScript: boolean = false,
): Promise<string | null> {
    try {
        const maxRetry = 5
        let result = ""
        const specChunks = groupAndChunkSpecRoutes(raw)
        let gptCallCount = 0
        for (let chunkIndex = 0; chunkIndex < specChunks.length; chunkIndex++) {
            const routesChunk = specChunks[chunkIndex]
            let chunkResult = ""

            for (let retry = 0; retry < maxRetry; retry++) {
                gptCallCount++
                logger.info(`[makeitdocByMD] Attempting GPT call : ${gptCallCount} times`)
                const msg = getItdocPrompt(routesChunk, isEn, retry + 1, isTypeScript)

                const response = await openai.chat.completions.create({
                    model: "gpt-5",
                    messages: [{ role: "user", content: msg }],
                    max_completion_tokens: 10000,
                })

                const choice = response.choices?.[0]
                const text = choice?.message?.content?.trim() ?? ""
                const finishReason = choice?.finish_reason ?? null

                const cleaned = text
                    .replace(/```(?:json|javascript|typescript|markdown)?/g, "")
                    .replace(/```/g, "")
                    .trim()

                chunkResult += cleaned + "\n"
                if (finishReason === "stop" && cleaned) break
                await new Promise((res) => setTimeout(res, 500))
            }

            result += chunkResult.trim() + "\n\n"
            await new Promise((res) => setTimeout(res, 300))
        }

        return result.trim()
    } catch (error: unknown) {
        logger.error(`makeitdocByMD() ERROR: ${error}`)
        return null
    }
}

/**
 * CLI entrypoint that:
 * - Loads environment variables.
 * - Analyzes an Express app file into route specs.
 * - Invokes LLM to generate itdoc tests.
 * - Writes the resulting test file with prelude (imports/helpers).
 * @param {string} [appPath] - Path to Express app entry.
 * @param {string} [envPath] - Path to .env file containing OPENAI_API_KEY.
 * @returns {Promise<void>} Exits the process on unrecoverable errors.
 */
export default async function generateByLLM(appPath?: string, envPath?: string): Promise<void> {
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

    if (!appPath) {
        logger.error("App path not provided. Please specify it with -a or --app option.")
        process.exit(1)
    }

    resolvedAppPath = loadFile("app", appPath, false)
    isTypeScript = resolvedAppPath.endsWith(".ts")

    const relativePath = path.relative(outputDir, resolvedAppPath).replace(/\\/g, "/")
    appImportPath = relativePath.startsWith(".") ? relativePath : `./${relativePath}`

    const analyzedRoutes = await analyzeRoutes(resolvedAppPath)
    if (!analyzedRoutes) {
        logger.error(
            "AST analysis failed. Please ensure your routes use app.get() or router.post() format.",
        )
        process.exit(1)
    }

    const doc = await makeitdoc(openai, analyzedRoutes, false, isTypeScript)
    if (!doc) {
        logger.error("Failed to generate itdoc from markdown spec.")
        process.exit(1)
    }
    result = doc

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
import { describeAPI, itDoc, HttpStatus, field, HttpMethod } from "itdoc"
import sinon from "sinon"
const sandbox = sinon.createSandbox()
function getRouteLayer(app, method, path) {
  method = String(method).toLowerCase()
  const stack = app && app._router && app._router.stack ? app._router.stack : []
  for (const layer of stack) {
    if (!layer.route) continue
    if (layer.route.path !== path) continue
    if (!layer.route.methods || !layer.route.methods[method]) continue
    const routeStack = layer.route.stack || []
    if (routeStack.length > 0) return routeStack[0]
  } 
}
afterEach(() => {
  sandbox.restore()
})
`
    } else {
        importStatement = `const app = require('${appImportPath}')
const { describeAPI, itDoc, HttpStatus, field, HttpMethod } = require("itdoc")
const targetApp = app
const sinon = require("sinon")
const sandbox = sinon.createSandbox() 
function getRouteLayer(app, method, path) {
  method = String(method).toLowerCase()
  const stack = app && app._router && app._router.stack ? app._router.stack : []
  for (const layer of stack) {
    if (!layer.route) continue
    if (layer.route.path !== path) continue
    if (!layer.route.methods || !layer.route.methods[method]) continue
    const routeStack = layer.route.stack || []
    if (routeStack.length > 0) return routeStack[0]
  } 
}
afterEach(() => {
  sandbox.restore()
})
    `
    }

    result = importStatement + "\n\n" + result.trim()
    fs.writeFileSync(outPath, result, "utf8")
    logger.info(`[generateByLLM] itdoc LLM SCRIPT completed.`)
}
