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

import { consola as defaultConsola, ConsolaReporter, createConsola, LogObject } from "consola"
import chalk from "chalk"
import { LoggerInterface } from "./LoggerInterface"
import { TestFramework } from "../dsl/adapters/TestFramework"
import { detectTestFramework } from "../dsl/adapters"

// 테스트 완료 여부 추적 (Jest 환경에서만 사용)
let testsCompleted = false

// Jest 환경에서 테스트 완료 후 로그 안전하게 처리
try {
    if (detectTestFramework() === TestFramework.Jest) {
        ;(global as any).afterAll(() => {
            testsCompleted = true
        })
    }
} catch {
    // do-nothing
}

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
    WARN: {
        color: chalk.yellow,
        bgColor: chalk.bgYellow.black.bold,
    },
    ERROR: {
        color: chalk.red.bold,
        bgColor: chalk.bgRed.white.bold,
    },
} as const
const MAX_LOG_LEVEL_LABEL_LENGTH = Math.max(...Object.keys(levels).map((key) => key.length))

const isTestEnv = detectTestFramework() != TestFramework.Unknown && process.env.NODE_ENV === "test"
const safeConsoleLog = (message: string, ...args: any[]): void => {
    if (isTestEnv && testsCompleted) {
        return
    }

    if (isTestEnv) {
        process.stdout.write(message + "\n")
        if (args.length > 0) {
            args.forEach((arg) => {
                try {
                    const str = typeof arg === "string" ? arg : JSON.stringify(arg, null, 2)
                    process.stdout.write(str + "\n")
                } catch {
                    // do-nothing
                }
            })
        }
    } else {
        console.log(message, ...args)
    }
}

const customReporter: ConsolaReporter = {
    log(logObj: LogObject) {
        const { type, args } = logObj
        if (type === "box") return

        const levelKey = type.toUpperCase() as keyof typeof levels
        const meta = levels[levelKey]

        const levelText = `[${levelKey}]`
        const styledLevel = meta?.bgColor?.(levelText) ?? levelText

        const paddingLength = MAX_LOG_LEVEL_LABEL_LENGTH - levelKey.length

        const [message, ...extra] = args

        safeConsoleLog(`${styledLevel}${" ".repeat(paddingLength)} ${message}`)

        if (extra.length > 0) {
            const formattedExtra = formatExtra(extra)
            for (const line of formattedExtra) {
                safeConsoleLog(`       ${line}`)
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
            const pretty = JSON.stringify(item, null, 2)
            return `↳ ${pretty.split("\n").join("\n       ")}`
        } catch {
            return `↳ ${String(item)}`
        }
    })
}

const itdocLoggerInstance = createConsola({
    level: isTestEnv ? 5 : DEFAULT_LOG_LEVEL,
    reporters: [customReporter],
})

const logger: LoggerInterface = {
    debug: (msg, ...extra) => {
        if (isTestEnv && !process.env.ITDOC_DEBUG) return
        itdocLoggerInstance.debug(formatLog("DEBUG", msg), ...extra)
    },
    info: (msg, ...extra) => {
        if (isTestEnv && !process.env.ITDOC_DEBUG) return
        itdocLoggerInstance.info(formatLog("INFO", msg), ...extra)
    },
    box: (msg) => {
        if (isTestEnv) return
        defaultConsola.box(msg)
    },
    warn: (msg) => {
        itdocLoggerInstance.warn(formatLog("WARN", msg))
    },
    error: (msg, ...extra) => {
        itdocLoggerInstance.error(formatLog("ERROR", msg), ...extra)
    },
    level: itdocLoggerInstance.level,
}

export default logger
