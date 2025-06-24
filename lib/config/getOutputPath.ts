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

import * as path from "path"
import { readItdocConfig } from "./readPackageJson"
import logger from "./logger"

/**
 *
 */
export function getOutputPath(): string {
    let outputPath = readItdocConfig("output", "output")

    if (!path.isAbsolute(outputPath)) {
        outputPath = path.resolve(process.cwd(), outputPath)
    }

    logger.info(
        `
        itdoc - output 경로는 다음과 같습니다. : ${outputPath}
        output 경로는 package.json내의 itdoc - output을 수정해서 바꿀 수 있습니다.`,
        `ex) {itdoc:{output : 'output'}}`,
    )

    return outputPath
}
