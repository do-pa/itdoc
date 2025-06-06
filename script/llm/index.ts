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
import fs from "fs"
import path from "path"
import dotenv from "dotenv"
import { getItdocPrompt, getMDPrompt } from "./prompt/index"
import logger from "../../lib/config/logger"
import { loadFile } from "./loader/index"
import { getOutputPath } from "../../lib/config/getOutputPath"
import { analyzeRoutes } from "./parser/index"

/**
 * LLM을 호출해 itdoc 테스트스크립트를 작성합니다.
 * @param {OpenAI} openai - 초기화된 OpenAI 클라이언트 인스턴스
 * @param {string} content - 처리할 마크다운 콘텐츠
 * @param {boolean} isEn - 영어 출력을 원할 경우 true
 * @returns {Promise<string|null>} 생성된 문서 문자열, 오류 발생 시 null 반환
 */
async function makedocByMD(openai: OpenAI, content: string, isEn: boolean): Promise<string | null> {
    try {
        const maxRetry = 3
        let result = ""

        logger.info(
            `테스트명세서(md)를 기반으로 GPT API를 통해 itdoc 테스트 코드를 생성합니다. GPT API 호출은 최대 3회까지 이루어집니다.`,
        )
        for (let i = 0; i < maxRetry; i++) {
            logger.info(`호출횟수: (${i + 1}/${maxRetry})`)
            const msg = getItdocPrompt(content, isEn, i + 1)

            const response: any = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: [{ role: "user", content: msg }],
                temperature: 0,
                max_tokens: 4096,
            })

            const text = response.choices[0].message.content?.trim() ?? ""
            const finishReason = response.choices[0].finish_reason

            const cleaned = text
                .replace(/```(?:json|javascript|typescript|markdown)?/g, "")
                .replace(/```/g, "")
                .replace(/\(.*?\/.*?\)/g, "") // (1/3) 제거
                .trim()

            result += cleaned + "\n"

            if (
                finishReason === "stop" &&
                !cleaned.endsWith("...") &&
                !/\(\d+\/\d+\)\s*$/.test(cleaned)
            ) {
                break
            }

            await new Promise((res) => setTimeout(res, 500))
        }

        return result.trim()
    } catch (error: unknown) {
        logger.error(`makedocByMD() 에러 발생: ${error}`)
        return null
    }
}

/**
 *
 * @param openai
 * @param content
 */
async function makeMDByApp(openai: OpenAI, content: any): Promise<string | null> {
    try {
        const maxRetry = 3
        let result = ""
        logger.info(
            `AST파서로 분석된 앱을 기반으로 GPT API를 통해 테스트명세서(md)를 생성합니다. GPT API 호출은 최대 3회까지 이루어집니다.`,
        )
        for (let i = 0; i < maxRetry; i++) {
            logger.info(`호출횟수: (${i + 1}/${maxRetry})`)
            const msg = getMDPrompt(content, i + 1)
            const response: any = await openai.chat.completions.create({
                model: "gpt-4o",
                messages: [{ role: "user", content: msg }],
                temperature: 0,
                max_tokens: 4096,
            })

            const text = response.choices[0].message.content?.trim() ?? ""
            const finishReason = response.choices[0].finish_reason
            const cleaned = text
                .replace(/```(?:json|javascript|typescript|markdown)?/g, "")
                .replace(/```/g, "")
                .replace(/`markdown/g, "")
                .replace(/\(.*?\/.*?\)/g, "")
                .trim()

            result += cleaned + "\n"
            if (
                finishReason === "stop" &&
                !cleaned.endsWith("...") &&
                !/\(\d+\/\d+\)\s*$/.test(cleaned)
            ) {
                break
            }
            await new Promise((res) => setTimeout(res, 500))
        }

        return result.trim()
    } catch (error: unknown) {
        logger.error(`makeMDByApp() 에러 발생: ${error}`)
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
        logger.error("환경 변수 OPENAI_API_KEY가 설정되어 있지 않습니다.")
        process.exit(1)
    }
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    const outputDir = getOutputPath()
    fs.mkdirSync(outputDir, { recursive: true })
    let result = ""
    if (appPath) {
        const resolvedAppContent = loadFile("app", appPath, false)
        logger.info(`appPath: ${appPath}를 기반으로 AST분석을 통해 테스트명세서(md)를 생성합니다.`)
        logger.info("참고: app 또는 router 이름으로 시작하는 코드를 찾아 분석을 실행합니다.")
        logger.info("ex) app.get(...), router.post(...) 등")

        const analyzedRoutes = await analyzeRoutes(resolvedAppContent)
        if (!analyzedRoutes) {
            logger.error(
                "앱에 대한 AST분석이 실패하였습니다. 사용자의 코드 중 라우터 부분을 app.get() 또는 router.post()와 같은 형식으로 작성해 주세요.",
            )
            process.exit(1)
        }
        const specFromApp = await makeMDByApp(openai, analyzedRoutes)
        if (!specFromApp) {
            logger.error("앱 분석 기반 스펙 MD문서 생성 실패")
            process.exit(1)
        }
        const mdPath = path.join(outputDir, "output.md")
        fs.writeFileSync(mdPath, specFromApp, "utf8")
        logger.info(`앱 분석 기반 스펙 MD문서 생성 완료: ${mdPath}`)

        const doc = await makedocByMD(openai, specFromApp, false)
        if (!doc) {
            logger.error("앱 분석 기반 스펙 MD문서 생성 실패")
            process.exit(1)
        }
        result = doc
    } else if (testspecPath) {
        const specContent = loadFile("spec", testspecPath, true)
        const doc = await makedocByMD(openai, specContent, false)
        if (!doc) {
            logger.error("마크다운 스펙 기반 테스트 코드 생성 실패")
            process.exit(1)
        }
        result = doc
    }

    if (!result) {
        logger.error("generateByLLM()이 작동하지 않습니다.")
        process.exit(1)
    }
    const outPath = path.join(outputDir, "output.js")
    fs.writeFileSync(outPath, result, "utf8")
    logger.info(`itdoc 문서 생성 완료: ${outPath}`)
}
