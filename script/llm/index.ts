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
import { fileURLToPath } from "url"
import getItdocPrompt from "./prompt/index.js"
import logger from "../../lib/config/logger"
const __filename: string = fileURLToPath(import.meta.url)
const __dirname: string = path.dirname(__filename)
dotenv.config({ path: path.join(__dirname, "../../.env") })

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
})

const outputDir: string = path.join(__dirname, "../../", "output")
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
}

const filePath: string = path.join(outputDir, "output.js")
/**
 * 주어진 테스트 스펙(content)과 언어 설정(isEn)에 기반하여,
 * GPT 모델을 호출하고, 생성된 테스트 코드 결과물을 반환합니다.
 * @param {string} content - 테스트 스펙 내용을 담은 문자열.
 * @param {boolean} isEn - 결과물을 영어로 출력할지 여부 (true: 영어, false: 한글).
 * @returns {Promise<string | null>} - 생성된 테스트 코드 문자열 또는 에러 발생 시 null.
 */
async function makedocLLM(content: string, isEn: boolean): Promise<string | null> {
    try {
        const msg: string = getItdocPrompt(content, isEn)
        const response: any = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [{ role: "user", content: msg }],
            temperature: 0,
        })
        const ret: string = response.choices[0].message.content
            .replace(/```(?:json|javascript)?/g, "")
            .replace(/```/g, "")
            .trim()
        return ret
    } catch (error: unknown) {
        logger.error(`makedocLLM() 에러 발생: ${error}`)
        return null
    }
}
/**
 * 전체 프로세스를 실행하는 메인 함수입니다.
 * 테스트 스펙 파일(testspec.md)을 읽어와 makedoc_llm 함수를 호출하고,
 * 생성된 결과물을 output.js 파일에 저장합니다.
 * @param testspecPath
 * @returns {Promise<void>} - 비동기 실행 결과.
 */
async function main(testspecPath?: string): Promise<void> {
    const isEn: boolean = false

    const actualTestspecPath: string =
        testspecPath ?? path.join(__dirname, "../../", "md", "testspec.md")

    if (!fs.existsSync(actualTestspecPath)) {
        logger.error(`Error: File does not exist at ${actualTestspecPath}`)
        process.exit(1)
    }
    const msg: string = fs.readFileSync(actualTestspecPath, "utf8")

    const ret = await makedocLLM(msg, isEn)
    if (ret !== null) {
        fs.writeFileSync(filePath, ret, "utf8")
        logger.info(`GPT를 기반으로 테스트생성이 다 완성되었습니다.`)
    }
}

main()
