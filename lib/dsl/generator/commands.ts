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

/**
 * 테스트 결과를 기반으로 OpenAPI Specification을 JSON 파일로 내보냅니다.
 * @param {IOpenAPIGenerator} generator OAS 생성기 인스턴스
 * @param {string} outputPath 출력 파일 경로
 */
export const exportOASToJSON = (generator: IOpenAPIGenerator, outputPath: string): void => {
    try {
        if (!generator) {
            throw new Error("유효한 OpenAPI 생성기가 제공되지 않았습니다.")
        }

        if (!outputPath) {
            throw new Error("유효한 출력 경로가 제공되지 않았습니다.")
        }

        // OAS 생성
        const spec = generator.generateOpenAPISpec()
        if (!spec) {
            throw new Error("OpenAPI 스펙 생성에 실패했습니다.")
        }

        // 출력 디렉토리 확인 및 생성
        const outputDir = path.dirname(path.resolve(outputPath))
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true })
        }

        // JSON 문자열로 변환
        const specJson = JSON.stringify(spec, null, 2)

        // 파일 쓰기
        fs.writeFileSync(path.resolve(outputPath), specJson, "utf8")

        // Node 환경에서 process.nextTick을 사용하여 테스트 스택이 완전히 비워진 후 로그가 출력되도록 합니다
        process.nextTick(() => {
            console.log(`OpenAPI Specification exported to ${outputPath}`)
        })
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "알 수 없는 오류 발생"
        console.error(`OpenAPI Specification 내보내기 실패: ${errorMessage}`)
        // 오류를 다시 던지지 않고 로깅만 수행하여 테스트 실행을 중단하지 않음
    }
}
