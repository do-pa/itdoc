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
export { PathBuilder } from "./builders/PathBuilder"
export { OperationBuilder } from "./builders/OperationBuilder"

// 유틸리티 내보내기
export { Logger } from "./utils/Logger"

// 함수 내보내기 (직접 내보내지 않고 아래에서 래퍼 함수로 내보냄)
import { exportOASToJSON as rawExportOASToJSON } from "./commands"

// 싱글톤 인스턴스 내보내기
import { OpenAPIGenerator } from "./OpenAPIGenerator"
import { TestResultCollector } from "./TestResultCollector"

// 디버그 모드 설정 (기본값: false)
OpenAPIGenerator.setDebugMode(false)

// 싱글톤 인스턴스
export const oasGenerator = OpenAPIGenerator.getInstance()
export const resultCollector = TestResultCollector.getInstance()

// 편의를 위한 래퍼 함수
export const exportOASToJSON = (outputPath: string): void => {
    rawExportOASToJSON(oasGenerator, outputPath)
}
