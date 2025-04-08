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

import { HttpMethod } from "../../enums"
import { ApiDocOptions } from "../../interface"

/**
 * 테스트 결과 인터페이스
 *
 * 이 인터페이스는 API 테스트 결과를 캡처하기 위한 정보를 담습니다.
 * @param {HttpMethod} method - HTTP 메소드 (예: GET, POST 등).
 * @param {string} url - 요청 URL.
 * @param {ApiDocOptions} options - API 문서 생성 옵션.
 * @param {object} request - 요청 관련 정보.
 * @param {unknown} [request.body] - 요청 바디 (선택 사항).
 * @param {Record<string, string | unknown>} [request.headers] - 요청 헤더 (선택 사항).
 * @param {Record<string, string | unknown>} [request.queryParams] - URL 쿼리 파라미터 (선택 사항).
 * @param {Record<string, string | unknown>} [request.pathParams] - URL 경로 파라미터 (선택 사항).
 * @param {object} response - 응답 관련 정보.
 * @param {number} response.status - HTTP 응답 상태 코드.
 * @param {unknown} [response.body] - 응답 바디 (선택 사항).
 * @param {Record<string, string | unknown>} [response.headers] - 응답 헤더 (선택 사항).
 * @param {string} [testSuiteDescription] - 테스트 컨텍스트 설명. 예를 들어,
 *                                             itDoc("테스트 컨텍스트", () => { ... })에서 "테스트 컨텍스트"에 해당하는 부분.
 */
export interface TestResult {
    method: HttpMethod
    url: string
    options: ApiDocOptions
    request: {
        body?: unknown
        headers?: Record<string, string | unknown>
        queryParams?: Record<string, string | unknown>
        pathParams?: Record<string, string | unknown>
    }
    response: {
        status: number
        body?: unknown
        headers?: Record<string, string | unknown>
    }
    testSuiteDescription?: string
}

/**
 * OAS 생성기 인터페이스
 */
export interface IOpenAPIGenerator {
    collectTestResult(result: TestResult): void
    generateOpenAPISpec(): unknown
}
