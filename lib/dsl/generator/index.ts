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
import { Logger } from "./utils/Logger"

// 디버그 모드 설정 (기본값: false)
OpenAPIGenerator.setDebugMode(false)

// 싱글톤 인스턴스
export const oasGenerator = OpenAPIGenerator.getInstance()
export const resultCollector = TestResultCollector.getInstance()

// OAS 출력 경로 저장 변수
let oasOutputPath: string | null = null
// 테스트 실패 여부 추적 변수
let hasTestFailures = false
// OAS가 이미 생성되었는지 추적하는 변수
let oasAlreadyGenerated = false

/**
 * OAS 생성 상태를 초기화합니다.
 * 이 함수는 테스트 실행 사이에 상태를 리셋하는 데 사용될 수 있습니다.
 */
export const resetOASGenerationState = (): void => {
    oasOutputPath = null
    hasTestFailures = false
    oasAlreadyGenerated = false
}

// 상태 초기화: 자동 초기화 구현
// 노드 환경에서는 프로세스 시작 시 자동으로 초기화
// 프로세스 종료 직전에 상태 초기화
try {
    process.on("beforeExit", () => {
        resetOASGenerationState()
        Logger.debug("OAS generation state reset on process exit")
    })
} catch (error) {
    Logger.debug("Failed to register beforeExit handler:", error)
}

// 예상치 못한 종료 시에도 OAS를 생성하기 위한 시그널 핸들러
try {
    ;["SIGINT", "SIGTERM"].forEach((signal) => {
        process.on(signal, () => {
            if (!oasAlreadyGenerated && oasOutputPath && !hasTestFailures) {
                Logger.debug(`Process ${signal} detected, generating OAS before exit...`)
                rawExportOASToJSON(oasGenerator, oasOutputPath)
            }
            process.exit(0)
        })
    })
} catch (error) {
    Logger.debug("Failed to register signal handlers:", error)
}

// 편의를 위한 래퍼 함수
export const exportOASToJSON = (outputPath: string): void => {
    // 이미 OAS가 생성되었다면 중복 생성 방지
    if (oasAlreadyGenerated) {
        Logger.debug("OAS already generated, skipping duplicate generation")
        return
    }

    rawExportOASToJSON(oasGenerator, outputPath)
    oasAlreadyGenerated = true
}

/**
 * OAS 출력 경로를 설정합니다. 테스트가 모두 완료되면 자동으로 이 경로로 OAS를 저장합니다.
 * @param outputPath OAS JSON 파일 경로
 */
export const configureOASExport = (outputPath: string): void => {
    oasOutputPath = outputPath
}

/**
 * 테스트 실패를 기록합니다.
 * 한 번이라도 호출되면 OAS 자동 생성을 건너뜁니다.
 */
export const recordTestFailure = (): void => {
    hasTestFailures = true
    Logger.debug("Test failure recorded - OAS will not be generated automatically")
}

/**
 * 테스트가 모두 완료되면 자동으로 호출되어 OAS를 생성합니다.
 * 테스트 실패가 기록된 경우에는 OAS를 생성하지 않습니다.
 * 이 함수는 내부적으로 사용되며, 어댑터에서 호출합니다.
 */
export const autoExportOAS = (): void => {
    // 이미 OAS가 생성되었다면 중복 생성 방지
    if (oasAlreadyGenerated) {
        Logger.debug("OAS already generated, skipping duplicate generation")
        return
    }

    if (hasTestFailures) {
        Logger.debug("Tests failed - skipping automatic OAS generation")
        return
    }

    if (oasOutputPath) {
        Logger.debug("All tests passed - generating OAS automatically")
        // 이중 안전장치로 try-catch 추가
        try {
            rawExportOASToJSON(oasGenerator, oasOutputPath)
            oasAlreadyGenerated = true
        } catch (error) {
            Logger.debug("Error during OAS generation:", error)
        }
    } else {
        Logger.debug("No output path configured, skipping OAS generation")
    }
}
