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
const printBanner = () => {
    console.log(
        ` 
 ___  _________  ________  ________  ________          ___       ___       _____ ______      
|\\  \\|\\___   ___|\\   ___ \\|\\   __  \\|\\   ____\\        |\\  \\     |\\  \\     |\\   _ \\  _   \\    
\\ \\  \\|___ \\  \\_\\ \\  \\_|\\ \\ \\  \\|\\  \\ \\  \\___|        \\ \\  \\    \\ \\  \\    \\ \\  \\\\\\__\\ \\  \\   
 \\ \\  \\   \\ \\  \\ \\ \\  \\ \\\\ \\ \\  \\\\\\  \\ \\  \\            \\ \\  \\    \\ \\  \\    \\ \\  \\\\|__| \\  \\  
  \\ \\  \\   \\ \\  \\ \\ \\  \\_\\\\ \\ \\  \\\\\\  \\ \\  \\____        \\ \\  \\____\\ \\  \\____\\ \\  \\    \\ \\  \\ 
   \\ \\__\\   \\ \\__\\ \\ \\_______\\ \\_______\\ \\_______\\       \\ \\_______\\ \\_______\\ \\__\\    \\ \\__\\
    \\|__|    \\|__|  \\|_______|\\|_______|\\|_______|        \\|_______|\\|_______|\\|__|     \\|__|
                                                                                                                                                         
    `,
    )
}
if (isRootHelp) {
    printBanner()
}
const program = new Command()

program
    .name("itdoc")
    .usage("A CLI tool for generating ITDOC test code using LLM") // ✅ 직접 Usage 설정
    .addHelpText(
        "after",
        `
Example:
  itdoc generate -a <appPath>
`,
    )

program
    .command("generate")
    .description("Generate ITDOC test code based on LLM.")
    .option("-p, --path <testspecPath>", "Path to the markdown test spec file.")
    .option("-a, --app <appPath>", "Path to the Express root app file.")
    .option("-e, --env <envPath>", "Path to the .env file.")
    .action((options: { path?: string; env?: string; app?: string }) => {
        const envPath = options.env
            ? path.isAbsolute(options.env)
                ? options.env
                : path.resolve(process.cwd(), options.env)
            : path.resolve(process.cwd(), ".env")

        if (!options.path && !options.app) {
            logger.error(
                "Either a test spec path (-p) or an Express app path (-a) must be provided. By default, the OpenAI key (OPENAI_API_KEY in .env) is loaded from the root directory, but you can customize the path if needed",
            )
            logger.info("ex) itdoc generate -p ../md/testspec.md")
            logger.info("ex) itdoc generate --path ../md/testspec.md")
            logger.info("ex) itdoc generate -a ../app.js")
            logger.info("ex) itdoc generate --app ../app.js")
            logger.info("ex) itdoc generate -a ../app.js -e <custom path : env>")
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
