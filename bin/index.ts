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
import path from "path"
import generateByLLM from "../script/llm/index"
import logger from "../lib/config/logger"
import { resolvePath } from "../lib/utils/pathResolver"

const args = process.argv.slice(2)
const isRootHelp = args.length === 0 || args[0] === "--help" || args[0] === "-h"
if (isRootHelp) {
    logger.box("ITDOC CLI")
}
const program = new Command()

program
    .command("generate")
    .description("LLM 기반 ITDOC 테스트 코드를 생성합니다.")
    .option("-p, --path <testspecPath>", "테스트 스펙 마크다운 경로가 설정됩니다.", undefined)
    .option("-a, --app <appPath>", "express로 만들어진 root app 경로가 설정됩니다.", undefined)
    .option("-e, --env <envPath>", ".env 파일 경로를 지정합니다", undefined)
    .action((options: { path?: string; env?: string; app?: string }) => {
        // .env 로드
        const envPath = options.env
            ? path.isAbsolute(options.env)
                ? options.env
                : path.resolve(process.cwd(), options.env)
            : path.resolve(process.cwd(), ".env")

        if (!options.path && !options.app) {
            logger.error("테스트 스펙(-p) 또는 express app 경로(-a) 중 적어도 하나는 필수입니다.")
            logger.info("ex) itdoc generate -p ../md/testspec.md")
            logger.info("ex) itdoc generate --path ../md/testspec.md")
            logger.info("ex) itdoc generate -a ../app.js")
            logger.info("ex) itdoc generate --app ../app.js")
            process.exit(1)
        }

        logger.box(`ITDOC LLM START`)
        if (options.app) {
            const appPath = resolvePath(options.app)
            logger.info(`express app 경로 기반으로 분석을 실행합니다. ${appPath}`)
            generateByLLM("", appPath, envPath)
        } else if (options.path) {
            const specPath = resolvePath(options.path)
            logger.info(`테스트명세서(MD) 경로 기반으로 분석을 실행합니다. ${specPath}`)
            generateByLLM(specPath, "", envPath)
        }
    })

program.parse(process.argv)

if (!args.length) {
    program.outputHelp()
}
