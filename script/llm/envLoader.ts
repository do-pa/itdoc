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

import fs from "fs"
import path from "path"
import logger from "../../lib/config/logger"

/**
 *
 * @param envPath
 */
export function resolveEnv(envPath?: string): string {
    const actual =
        envPath && path.isAbsolute(envPath)
            ? envPath
            : path.resolve(process.cwd(), envPath || ".env")
    if (!fs.existsSync(actual)) {
        logger.error(`.env 파일이 없습니다: ${actual}`)
        process.exit(1)
    }
    logger.info(`env 파일 로드: ${actual}`)
    return actual
}
