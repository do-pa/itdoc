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

// 싱글톤 인스턴스를 저장할 변수
let instance: TestResultCollector | null = null

/**
 * 테스트 결과 수집기 클래스
 */
export class TestResultCollector {
    private generator: IOpenAPIGenerator

    /**
     * 생성자 - 싱글톤 패턴을 위해 private으로 설정
     * @param {IOpenAPIGenerator} generator OpenAPI 생성기
     */
    private constructor(generator: IOpenAPIGenerator) {
        this.generator = generator
    }

    /**
     * 싱글톤 인스턴스를 반환합니다.
     * @returns {TestResultCollector} TestResultCollector의 싱글톤 인스턴스
     */
    public static getInstance(): TestResultCollector {
        if (!instance) {
            const generator = OpenAPIGenerator.getInstance()
            instance = new TestResultCollector(generator)
        }
        return instance
    }

    /**
     * 테스트 결과를 수집합니다
     * @param {TestResult} result 테스트 결과
     */
    public collectResult(result: TestResult): void {
        this.generator.collectTestResult(result)
    }
}
