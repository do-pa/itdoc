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
import { PathBuilder } from "./builders/PathBuilder"
import { OperationBuilder } from "./builders/OperationBuilder"
import { Logger } from "./utils/Logger"

// 싱글톤 인스턴스를 저장할 변수
let instance: OpenAPIGenerator | null = null

/**
 * OpenAPI Specification 생성기
 */
export class OpenAPIGenerator implements IOpenAPIGenerator {
    private testResults: TestResult[] = []

    /**
     * 생성자 - 싱글톤 패턴을 위해 private으로 설정
     */
    private constructor() {
        // 메모리 기반 구현으로 별도 초기화 작업 불필요
    }

    /**
     * 디버그 모드를 설정합니다.
     * @param {boolean} enable 디버그 모드 활성화 여부
     */
    public static setDebugMode(enable: boolean): void {
        Logger.setDebugMode(enable)
    }

    /**
     * 싱글톤 인스턴스를 반환합니다.
     * @returns {OpenAPIGenerator} OpenAPIGenerator의 싱글톤 인스턴스
     */
    public static getInstance(): OpenAPIGenerator {
        if (!instance) {
            instance = new OpenAPIGenerator()
        }
        return instance
    }

    /**
     * 테스트가 통과했을 때 결과를 수집합니다.
     * @param {TestResult} result 테스트 결과 객체
     */
    public collectTestResult(result: TestResult): void {
        Logger.debug("OpenAPIGenerator.collectTestResult called with:", result)
        this.testResults.push(result)
    }

    /**
     * 수집된 테스트 결과를 OpenAPI Specification으로 변환합니다.
     * @returns {object} OpenAPI Specification 객체
     */
    public generateOpenAPISpec(): unknown {
        Logger.debug(`Generating OpenAPI spec with ${this.testResults.length} test results`)

        // 엔드포인트별로 테스트 결과 그룹화
        const endpoints = PathBuilder.groupByEndpoint(this.testResults)

        // OpenAPI paths 객체 생성
        const paths: Record<string, Record<string, unknown>> = {}

        // 각 엔드포인트에 대한 경로 항목 생성
        for (const [path, results] of Object.entries(endpoints)) {
            const pathItem: Record<string, unknown> = {}

            // 각 테스트 결과에 대한 오퍼레이션 생성 및 추가
            for (const result of results) {
                const method = result.method.toLowerCase()
                pathItem[method] = OperationBuilder.generateOperation(result)
            }

            paths[path] = pathItem
        }

        // 최종 OpenAPI 문서 생성
        return {
            openapi: "3.0.0",
            info: {
                title: "API Documentation",
                version: "1.0.0",
            },
            paths,
        }
    }
}
