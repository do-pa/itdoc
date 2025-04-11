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

import logger from "../../config/logger"
import { exportOASToJSON } from "./commands"
import { OpenAPIGenerator } from "./OpenAPIGenerator"

/**
 * 테스트 이벤트를 관리하고 테스트 상태를 추적하는 클래스입니다.
 * 모든 테스트가 완료되면 자동으로 OAS를 생성합니다.
 */
export class TestEventManager {
    private static instance: TestEventManager
    private testCount = 0
    private completedTests = 0
    private failedTests = 0
    private oasOutputPath: string | null = null
    private outputPath: string | null = null
    private oasAlreadyGenerated = false
    private oasGenerationScheduled = false

    public static getInstance(): TestEventManager {
        if (!TestEventManager.instance) {
            TestEventManager.instance = new TestEventManager()
        }
        return TestEventManager.instance
    }

    /**
     * OAS 출력 경로를 설정합니다.
     * @param path OAS JSON 파일 출력 경로
     * @param outputPath
     */
    public setOASOutputPath(path: string, outputPath: string): void {
        this.oasOutputPath = path
        this.outputPath = outputPath
        logger.debug(`OAS JSON 파일 출력 경로 설정: ${path}`)
        logger.debug(`output 경로 설정: ${outputPath}`)
    }

    public registerTest(): void {
        this.testCount++
        logger.debug(`테스트 등록: 현재 총 ${this.testCount}개 테스트`)
    }

    public completeTestSuccess(): void {
        this.completedTests++
        logger.debug(
            `테스트 완료: ${this.completedTests}/${this.testCount} (실패: ${this.failedTests})`,
        )
        this.checkAllTestsCompleted()
    }

    public completeTestFailure(): void {
        this.completedTests++
        this.failedTests++
        logger.debug(`테스트 실패: 현재 ${this.failedTests}개 실패`)
        logger.debug(
            `테스트 완료: ${this.completedTests}/${this.testCount} (실패: ${this.failedTests})`,
        )
        this.checkAllTestsCompleted()
    }

    /**
     * 모든 테스트가 완료되었는지 확인하고 필요한 경우 OAS 생성을 예약합니다.
     */
    private checkAllTestsCompleted(): void {
        if (
            this.completedTests === this.testCount &&
            !this.oasGenerationScheduled &&
            !this.oasAlreadyGenerated
        ) {
            this.oasGenerationScheduled = true
            this.onAllTestsCompleted()
        }
    }

    /**
     * 모든 테스트가 완료되었을 때 호출됩니다.
     */
    private onAllTestsCompleted(): void {
        if (this.failedTests > 0) {
            logger.debug(`${this.failedTests}개의 테스트가 실패하여 OAS 생성을 건너뜁니다.`)
            return
        }

        if (!this.oasOutputPath || !this.outputPath) {
            logger.debug("OAS 출력 경로가 설정되지 않아 OAS 생성을 건너뜁니다.")
            return
        }
        try {
            this.generateOAS()
        } catch (error) {
            logger.error("OAS 생성 중 오류 발생:", error)
        }
    }

    /**
     * OAS를 생성합니다.
     */
    private generateOAS(): void {
        if (this.oasAlreadyGenerated || !this.oasOutputPath || !this.outputPath) {
            return
        }

        const oasGenerator = OpenAPIGenerator.getInstance()
        exportOASToJSON(oasGenerator, this.oasOutputPath)
        this.oasAlreadyGenerated = true
        logger.debug(`OAS 생성 완료: ${this.oasOutputPath}`)
    }
}
