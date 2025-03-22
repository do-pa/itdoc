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

import * as fs from "fs"
import * as path from "path"
import { IOpenAPIGenerator } from "./types/TestResult"
import { Logger } from "./utils/Logger"

/**
 * 테스트 결과를 기반으로 OpenAPI Specification을 JSON 파일로 내보냅니다.
 * @param {IOpenAPIGenerator} generator OAS 생성기 인스턴스
 * @param {string} outputPath 출력 파일 경로
 */
export const exportOASToJSON = (generator: IOpenAPIGenerator, outputPath: string): void => {
    const spec = generator.generateOpenAPISpec()
    const specJson = JSON.stringify(spec, null, 2)

    fs.writeFileSync(path.resolve(outputPath), specJson, "utf8")
    console.log(`OpenAPI Specification exported to ${outputPath}`)
    Logger.debug(`OpenAPI Specification JSON: ${specJson.substring(0, 100)}...`)
}
