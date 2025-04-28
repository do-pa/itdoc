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
import getItdocPrompt from "./prompt/index.js"
import logger from "../../lib/config/logger.js"

/**
 * LLM을 호출해 itdoc 테스트스크립트를 작성합니다.
 * @param {OpenAI} openai - 초기화된 OpenAI 클라이언트 인스턴스
 * @param {string} content - 처리할 마크다운 콘텐츠
 * @param {boolean} isEn - 영어 출력을 원할 경우 true
 * @returns {Promise<string|null>} 생성된 문서 문자열, 오류 발생 시 null 반환
 */

/**
 *
 * @param openai
 * @param content
 * @param isEn
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
export default async function generateByLLM(
    testspecPath?: string,
    envPath?: string,
): Promise<void> {
    const actualEnvPath = envPath
        ? path.isAbsolute(envPath)
            ? envPath
            : path.resolve(process.cwd(), envPath)
        : path.resolve(process.cwd(), ".env")

    if (!fs.existsSync(actualEnvPath)) {
        logger.error(`.env 파일이 존재하지 않습니다: ${actualEnvPath}`)
        process.exit(1)
    } else {
        logger.info(`GPT API키가 있는 env파일을 로드합니다. ${actualEnvPath}`)
    }

    dotenv.config({ path: actualEnvPath })
    if (!process.env.OPENAI_API_KEY) {
        logger.error("환경 변수 OPENAI_API_KEY가 설정되어 있지 않습니다.")
        process.exit(1)
    }
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    const defaultSpec = path.join(process.cwd(), "md", "testspec.md")
    const actualSpec = testspecPath
        ? path.isAbsolute(testspecPath)
            ? testspecPath
            : path.resolve(process.cwd(), testspecPath)
        : defaultSpec
    if (!fs.existsSync(actualSpec)) {
        logger.error(`테스트스펙파일이 존재하지 않습니다: ${actualSpec}`)
        logger.info(`다음의 경로에 테스트스펙파일을 생성해주셔야 합니다. ${actualSpec}`)
        process.exit(1)
    } else {
        logger.info(`테스트스펙파일 경로: ${actualSpec}`)
    }
    const content = fs.readFileSync(actualSpec, "utf8")

    const packageJsonPath = path.resolve(process.cwd(), "package.json")
    let outputDir: string
    try {
        const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"))
        if (pkg.itdoc && typeof pkg.itdoc.output === "string") {
            outputDir = path.resolve(process.cwd(), pkg.itdoc.output)
            logger.info(`output 경로가 ${pkg.itdoc.output}로 설정됩니다. `)
        } else {
            logger.info(
                `package.json - itdoc - output 경로가 설정되어있지 않습니다. 현재 경로를 기반으로 output 폴더가 설정됩니다.`,
            )
            outputDir = path.resolve(process.cwd(), "output")
        }
    } catch (err) {
        logger.error(`package.json 파일을 읽는 중 오류 발생: ${err}`)
        logger.info(
            `package.json - itdoc - output 경로가 설정되어있지 않습니다. 현재 경로를 기반으로 output 폴더가 설정됩니다.`,
        )
        outputDir = path.resolve(process.cwd(), "output")
    }
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true })
        logger.info(`output 디렉토리가 생성되어있지 않아 ${outputDir}를 생성합니다.`)
    }
    const filePath = path.resolve(outputDir, "output.js")

    const isEn = false
    const result = await makedocLLM(openai, content, isEn)
    if (result) {
        fs.writeFileSync(filePath, result, "utf8")
        logger.info(`GPT 기반 테스트 코드 생성 완료: ${filePath}`)
    }
}
