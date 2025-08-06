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
 * TestEventManager is a singleton class that manages test events and tracks test status.
 *
 * This class performs the following roles:
 * - Test registration: Increases test count when new tests start.
 * - Test completion tracking: Updates completed test count whenever tests succeed or fail.
 * - When all tests are completed, automatically generates OpenAPI spec (OAS) if there are no failed tests.
 *   OAS is saved to a file in JSON format, followed by document (Markdown, HTML) generation tasks.
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
        logger.debug(`Test registered: Currently ${this.testCount} tests total`)
    }

    public completeTestSuccess(): void {
        this.completedTests++
        logger.debug(
            `Test completed: ${this.completedTests}/${this.testCount} (failed: ${this.failedTests})`,
        )
        this.checkAllTestsCompleted()
    }

    public completeTestFailure(): void {
        this.completedTests++
        this.failedTests++
        logger.debug(`Test failed: Currently ${this.failedTests} failures`)
        logger.debug(
            `Test completed: ${this.completedTests}/${this.testCount} (failed: ${this.failedTests})`,
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
            logger.error(`[OAS_GENERATION_SKIPPED] Number of failed tests: ${this.failedTests}`)
            return
        }
        try {
            this.generateOAS()
        } catch (error) {
            logger.error("Error occurred during OAS generation:", error)
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
        logger.info(`OAS generation completed: ${oasPath}`)
        generateDocs(oasPath, outputPath)
    }
}
