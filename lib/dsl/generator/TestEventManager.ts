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
import { getOutputPath } from "../../config/getOutputPath"
import * as path from "path"
import { generateDocs } from "../../../script/makedocs"
/**
 * TestEventManager는 테스트 이벤트를 관리하고 테스트 상태를 추적하는 싱글톤 클래스입니다.
 *
 * 이 클래스는 다음과 같은 역할을 합니다:
 * - 테스트 등록: 새로운 테스트가 시작될 때 테스트 개수를 증가시킵니다.
 * - 테스트 완료 추적: 테스트가 성공 또는 실패할 때마다 완료된 테스트 수를 업데이트합니다.
 * - 모든 테스트가 완료되면, 실패한 테스트가 없는 경우 자동으로 OpenAPI 스펙(OAS)을 생성합니다.
 *   OAS는 JSON 형식으로 파일에 저장되며, 이후 문서(Markdown, HTML) 생성 작업이 실행됩니다.
 * @class TestEventManager
 * @singleton
 */
export class TestEventManager {
    private static instance: TestEventManager
    private testCount = 0
    private completedTests = 0
    private failedTests = 0
    private oasAlreadyGenerated = false
    private oasGenerationScheduled = false

    public static getInstance(): TestEventManager {
        if (!TestEventManager.instance) {
            TestEventManager.instance = new TestEventManager()
        }
        return TestEventManager.instance
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
    private onAllTestsCompleted(): void {
        if (this.failedTests > 0) {
            logger.error(`[OAS_GENERATION_SKIPPED] 실패한 테스트 수: ${this.failedTests}`)
            return
        }
        try {
            this.generateOAS()
        } catch (error) {
            logger.error("OAS 생성 중 오류 발생:", error)
        }
    }

    private generateOAS(): void {
        if (this.oasAlreadyGenerated) {
            return
        }
        const outputPath = getOutputPath()
        const oasPath = path.resolve(outputPath, "oas.json")

        const oasGenerator = OpenAPIGenerator.getInstance()
        exportOASToJSON(oasGenerator, oasPath)
        this.oasAlreadyGenerated = true
        logger.info(`OAS 생성 완료: ${oasPath}`)
        generateDocs(oasPath, outputPath)
    }
}
