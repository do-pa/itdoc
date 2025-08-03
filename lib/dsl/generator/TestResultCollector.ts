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

import { TestResult, IOpenAPIGenerator } from "./types/TestResult"
import { OpenAPIGenerator } from "./OpenAPIGenerator"

// Variable to store singleton instance
let instance: TestResultCollector | null = null

/**
 * Test result collector class
 */
export class TestResultCollector {
    private generator: IOpenAPIGenerator

    /**
     * Constructor - set as private for singleton pattern
     * @param {IOpenAPIGenerator} generator OpenAPI generator
     */
    private constructor(generator: IOpenAPIGenerator) {
        this.generator = generator
    }

    /**
     * Returns the singleton instance.
     * @returns {TestResultCollector} Singleton instance of TestResultCollector
     */
    public static getInstance(): TestResultCollector {
        if (!instance) {
            const generator = OpenAPIGenerator.getInstance()
            instance = new TestResultCollector(generator)
        }
        return instance
    }

    /**
     * Collects test results
     * @param {TestResult} result Test result
     */
    public collectResult(result: TestResult): void {
        this.generator.collectTestResult(result)
    }
}
