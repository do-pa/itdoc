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
    .description("Generate ITDOC test code based on LLM.")
    .option("-p, --path <testspecPath>", "Path to the markdown test spec file.", undefined)
    .option("-a, --app <appPath>", "Path to the Express root app file.", undefined)
    .option("-e, --env <envPath>", "Path to the .env file.", undefined)
    .action((options: { path?: string; env?: string; app?: string }) => {
        // Load .env
        const envPath = options.env
            ? path.isAbsolute(options.env)
                ? options.env
                : path.resolve(process.cwd(), options.env)
            : path.resolve(process.cwd(), ".env")

        if (!options.path && !options.app) {
            logger.error(
                "Either a test spec path (-p) or an Express app path (-a) must be provided.",
            )
            logger.info("Example: itdoc generate -p ../md/testspec.md")
            logger.info("Example: itdoc generate --path ../md/testspec.md")
            logger.info("Example: itdoc generate -a ../app.js")
            logger.info("Example: itdoc generate --app ../app.js")
            process.exit(1)
        }

        logger.box("ITDOC LLM START")
        if (options.app) {
            const appPath = resolvePath(options.app)
            logger.info(`Running analysis based on Express app path: ${appPath}`)
            generateByLLM("", appPath, envPath)
        } else if (options.path) {
            const specPath = resolvePath(options.path)
            logger.info(`Running analysis based on test spec (MD) path: ${specPath}`)
            generateByLLM(specPath, "", envPath)
        }
    })

program.parse(process.argv)

if (!args.length) {
    program.outputHelp()
}
