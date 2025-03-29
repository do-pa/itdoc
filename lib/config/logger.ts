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

/* eslint-disable no-console */

import { ConsolaReporter, createConsola, LogObject } from "consola"
import chalk from "chalk"
import { LoggerInterface } from "./LoggerInterface"

const DEFAULT_LOG_LEVEL = process.env.ITDOC_DEBUG ? 0 : 4

const levels = {
    DEBUG: {
        color: chalk.gray,
        bgColor: chalk.bgGray.black.bold,
    },
    INFO: {
        color: chalk.blue,
        bgColor: chalk.bgBlue.white.bold,
    },
    WARNING: {
        color: chalk.yellow,
        bgColor: chalk.bgYellow.black.bold,
    },
    ERROR: {
        color: chalk.red.bold,
        bgColor: chalk.bgRed.white.bold,
    },
}

const customReporter: ConsolaReporter = {
    log(logObj: LogObject) {
        const { type, args } = logObj
        const levelKey = type.toUpperCase() as keyof typeof levels
        const meta = levels[levelKey]

        const levelText = `[${levelKey.padEnd(5)}]`
        const styledLevel = meta?.bgColor?.(levelText) ?? levelText

        const [message, ...extra] = args
        console.log(`${styledLevel} ${message}`)

        if (extra.length > 0) {
            const formattedExtra = formatExtra(extra)
            for (const line of formattedExtra) {
                console.log(`       ${line}`)
            }
        }
    },
}

const formatLog = (levelKey: keyof typeof levels, message: string | Error): string => {
    const level = levels[levelKey]
    const text = `${message instanceof Error ? message.message : message}`
    return level.color(text)
}

const formatExtra = (extra: unknown[]): string[] => {
    return extra.map((item) => {
        if (typeof item === "string") return `↳ ${item}`

        try {
            const pretty = JSON.stringify(item, null, 2) // 2-space indent
            return `↳ ${pretty.split("\n").join("\n       ")}`
        } catch {
            return `↳ ${String(item)}`
        }
    })
}

const consolaInstance = createConsola({
    level: DEFAULT_LOG_LEVEL,
    reporters: [customReporter],
})

const logger: LoggerInterface = {
    debug: (msg, ...extra) => consolaInstance.debug(formatLog("DEBUG", msg), ...extra),
    info: (msg, ...extra) => consolaInstance.info(formatLog("INFO", msg), ...extra),
    warn: (msg, ...extra) => consolaInstance.warn(formatLog("WARNING", msg), ...extra),
    error: (msg, ...extra) => consolaInstance.error(formatLog("ERROR", msg), ...extra),
    level: consolaInstance.level,
}

export default logger
