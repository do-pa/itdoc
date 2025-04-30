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
import getItdocPrompt from "./prompt/index"
import logger from "../../lib/config/logger"
import { loadSpec } from "./specLoader"
import { resolveEnv } from "./envLoader"
import { getOutputPath } from "../../lib/config/getOutputPath"

/**
 * LLM을 호출해 itdoc 테스트스크립트를 작성합니다.
 * @param {OpenAI} openai - 초기화된 OpenAI 클라이언트 인스턴스
 * @param {string} content - 처리할 마크다운 콘텐츠
 * @param {boolean} isEn - 영어 출력을 원할 경우 true
 * @returns {Promise<string|null>} 생성된 문서 문자열, 오류 발생 시 null 반환
 */
async function makedocLLM(openai: OpenAI, content: string, isEn: boolean): Promise<string | null> {
    try {
        const msg = getItdocPrompt(content, isEn)
        const response: any = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [{ role: "user", content: msg }],
            temperature: 0,
        })
        return response.choices[0].message.content
            .replace(/```(?:json|javascript)?/g, "")
            .replace(/```/g, "")
            .trim()
    } catch (error: unknown) {
        logger.error(`makedocLLM() 에러 발생: ${error}`)
        return null
    }
}

/**
 * 테스트 코드 생성 메인 함수
 * .env 파일, 테스트 스펙 마크다운 파일, package.json을 읽고 출력 디렉토리 결정 후 makedocLLM()를 호출합니다.
 * @param {string} [testspecPath] - 테스트 스펙 마크다운 파일 경로(절대/상대)
 * @param {string} [envPath] - 환경 변수 파일(.env) 경로(절대/상대)
 * @returns {Promise<void>}
 */

/**
 *
 * @param testspecPath
 * @param envPath
 */
export default async function generateByLLM(
    testspecPath?: string,
    envPath?: string,
): Promise<void> {
    const actualEnv = resolveEnv(envPath)
    dotenv.config({ path: actualEnv })
    if (!process.env.OPENAI_API_KEY) {
        logger.error("환경 변수 OPENAI_API_KEY가 설정되어 있지 않습니다.")
        process.exit(1)
    }
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    const specContent = loadSpec(testspecPath)

    const result = await makedocLLM(openai, specContent, false)
    if (!result) return

    const outputDir = getOutputPath()
    fs.mkdirSync(outputDir, { recursive: true })
    const outPath = path.join(outputDir, "output.js")
    fs.writeFileSync(outPath, result, "utf8")
    logger.info(`문서 생성 완료: ${outPath}`)
}
