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

// 타입 내보내기
export type { TestResult, IOpenAPIGenerator } from "./types/TestResult"

// 클래스 내보내기
export { OpenAPIGenerator } from "./OpenAPIGenerator"
export { TestResultCollector } from "./TestResultCollector"

// 빌더 클래스 내보내기
export { SchemaBuilder } from "./builders/SchemaBuilder"
export { OperationBuilder } from "./builders/OperationBuilder"

// 함수 내보내기 (직접 내보내지 않고 아래에서 래퍼 함수로 내보냄)
import { exportOASToJSON as rawExportOASToJSON } from "./commands"
import logger from "../../config/logger"

// 싱글톤 인스턴스 내보내기
import { OpenAPIGenerator } from "./OpenAPIGenerator"
import { TestResultCollector } from "./TestResultCollector"
import { TestEventManager } from "./TestEventManager"

// 싱글톤 인스턴스
export const oasGenerator = OpenAPIGenerator.getInstance()
export const resultCollector = TestResultCollector.getInstance()
export const testEventManager = TestEventManager.getInstance()

/**
 * OAS 생성 상태를 초기화합니다.
 * 이 함수는 테스트 실행 사이에 상태를 리셋하는 데 사용될 수 있습니다.
 */
export const resetOASGenerationState = (): void => {
    testEventManager.reset()
}

// 편의를 위한 래퍼 함수
export const exportOASToJSON = (outputPath: string): void => {
    rawExportOASToJSON(oasGenerator, outputPath)
}

/**
 * OAS 출력 경로를 설정합니다. 테스트가 모두 완료되면 자동으로 이 경로로 OAS를 저장합니다.
 * 테스트가 모두 통과된 경우에만 OAS가 생성되며, 하나라도 실패하면 생성되지 않습니다.
 *
 * 이 함수는 테스트 코드의 최상단에서 호출하세요. 아래 예시처럼:
 * ```
 * const { describeAPI, itDoc, HttpStatus, field, HttpMethod, configureOASExport } = require("itdoc")
 *
 * // OAS JSON 파일 출력 경로 설정
 * configureOASExport("./openapi.json")
 *
 * // 이후 테스트 코드 작성...
 * ```
 *
 * 정확한 동작 방식:
 * 1. 모든 itDoc 테스트가 성공적으로 완료되면 OAS 생성
 * 2. 하나라도 테스트가 실패하면 OAS 생성하지 않음
 * 3. 테스트 프레임워크 종료 시 자동으로 OAS 생성
 * @param outputPath OAS JSON 파일 경로
 */
export const configureOASExport = (outputPath: string): void => {
    testEventManager.setOASOutputPath(outputPath)
}

/**
 * 테스트 실패를 기록합니다.
 * 한 번이라도 호출되면 OAS 자동 생성을 건너뜁니다.
 */
export const recordTestFailure = (): void => {
    // testEventManager를 사용하여 테스트 실패 기록
    testEventManager.completeTestFailure()
    logger.debug("테스트 실패가 기록되어 OAS 생성이 건너뛰어집니다.")
}
