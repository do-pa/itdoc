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

import { Command } from "commander"
import { createRequire } from "module"
import { fileURLToPath } from "url"
import path, { dirname, join } from "path"
import generateByLLM from "../script/llm/index"
import logger from "../lib/config/logger"

const require = createRequire(import.meta.url)
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const { version, description } = require(join(__dirname, "..", "..", "package.json"))

const args = process.argv.slice(2)
const isRootHelp = args.length === 0 || args[0] === "--help" || args[0] === "-h"
if (isRootHelp) {
    logger.box("ITDOC CLI")
}
const program = new Command()
program
    .name("itdoc")
    .description(description)
    .version(`Version ${version}`, "-v, --version", "버전 정보 출력")

program
    .command("generate")
    .description("LLM 기반 ITDOC 테스트 코드를 생성합니다.")
    .option("-p, --path <testspect>", "테스트 스펙 마크다운 경로를 지정합니다", undefined)
    .option("-e, --env <envPath>", ".env 파일 경로를 지정합니다", undefined)
    .action((options: { path?: string; env?: string }) => {
        // .env 로드
        const envPath = options.env
            ? path.isAbsolute(options.env)
                ? options.env
                : path.resolve(process.cwd(), options.env)
            : path.resolve(process.cwd(), ".env")

        // testspec 경로 처리
        if (!options.path) {
            logger.error("테스트 스펙이 담긴 경로를 지정해주세요. (-p 옵션 사용)")
            logger.info("ex) itdoc generate -p ../md/testspec.md")
            logger.info("ex) itdoc generate --path ../md/testspec.md")
            process.exit(1)
        }
        const specPath = options.path
        const resolvedPath = path.isAbsolute(specPath)
            ? specPath
            : path.resolve(process.cwd(), specPath)

        generateByLLM(resolvedPath, envPath)
    })

program.parse(process.argv)

if (!args.length) {
    program.outputHelp()
}
