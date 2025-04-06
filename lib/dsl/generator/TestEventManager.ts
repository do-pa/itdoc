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
    private oasAlreadyGenerated = false
    private oasGenerationScheduled = false

    // 싱글톤 패턴
    private constructor() {
        // process.exit 이벤트 핸들러를 제거하고 completeTest 메서드에서 처리
    }

    /**
     * 싱글톤 인스턴스를 반환합니다.
     */
    public static getInstance(): TestEventManager {
        if (!TestEventManager.instance) {
            TestEventManager.instance = new TestEventManager()
        }
        return TestEventManager.instance
    }

    /**
     * OAS 출력 경로를 설정합니다.
     * @param path OAS JSON 파일 출력 경로
     */
    public setOASOutputPath(path: string): void {
        this.oasOutputPath = path
        logger.debug(`OAS 출력 경로 설정: ${path}`)
    }

    /**
     * 테스트를 등록합니다. 테스트가 시작될 때 호출됩니다.
     */
    public registerTest(): void {
        this.testCount++
        logger.debug(`테스트 등록: 현재 총 ${this.testCount}개 테스트`)
    }

    /**
     * 테스트 성공을 기록합니다.
     */
    public completeTestSuccess(): void {
        this.completedTests++
        logger.debug(
            `테스트 완료: ${this.completedTests}/${this.testCount} (실패: ${this.failedTests})`,
        )
        this.checkAllTestsCompleted()
    }

    /**
     * 테스트 실패를 기록합니다.
     */
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
        // 모든 테스트가 완료되었고, OAS 생성이 예약되지 않았으며, 아직 OAS를 생성하지 않았다면
        if (
            this.completedTests === this.testCount &&
            !this.oasGenerationScheduled &&
            !this.oasAlreadyGenerated
        ) {
            // 이벤트 루프의 다음 틱에서 OAS 생성 (테스트 프레임워크가 완전히 테스트를 마무리하도록)
            this.oasGenerationScheduled = true

            // setTimeout을 사용하여 현재 이벤트 루프가 완료된 후 실행
            // TODO: setTimeout이 왜 필요한지.
            setTimeout(() => {
                this.onAllTestsCompleted()
            }, 0)
        }
    }

    /**
     * 상태를 초기화합니다.
     */
    public reset(): void {
        this.testCount = 0
        this.completedTests = 0
        this.failedTests = 0
        this.oasAlreadyGenerated = false
        this.oasGenerationScheduled = false
        // oasOutputPath는 유지 (재설정하지 않는 한)
    }

    /**
     * 모든 테스트가 완료되었을 때 호출됩니다.
     */
    private onAllTestsCompleted(): void {
        if (this.failedTests > 0) {
            logger.debug(`${this.failedTests}개의 테스트가 실패하여 OAS 생성을 건너뜁니다.`)
            return
        }

        if (!this.oasOutputPath) {
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
        if (this.oasAlreadyGenerated || !this.oasOutputPath) {
            return
        }

        // OAS 생성
        const oasGenerator = OpenAPIGenerator.getInstance()
        exportOASToJSON(oasGenerator, this.oasOutputPath)
        this.oasAlreadyGenerated = true
        logger.debug(`OAS 생성 완료: ${this.oasOutputPath}`)
    }
}
