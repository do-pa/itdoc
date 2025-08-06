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
 * Test result interface
 *
 * This interface contains information for capturing API test results.
 * @property {HttpMethod} method - HTTP method (e.g., GET, POST, etc.).
 * @property {string} url - Request URL.
 * @property {ApiDocOptions} options - API documentation generation options.
 * @property {object} request - Request-related information.
 * @property {unknown} [request.body] - Request body (optional).
 * @property {Record<string, string | unknown>} [request.headers] - Request headers (optional).
 * @property {Record<string, string | unknown>} [request.queryParams] - URL query parameters (optional).
 * @property {Record<string, string | unknown>} [request.pathParams] - URL path parameters (optional).
 * @property {object} response - Response-related information.
 * @property {number} response.status - HTTP response status code.
 * @property {unknown} [response.body] - Response body (optional).
 * @property {Record<string, string | unknown>} [response.headers] - Response headers (optional).
 * @property {string} [testSuiteDescription] - Test context description. For example,
 *                                             the "test context" part in itDoc("test context", () => { ... }).
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
 * OpenAPI Specification generator interface
 *
 * This interface is responsible for generating OpenAPI documents based on test results.
 * @interface IOpenAPIGenerator
 */
export interface IOpenAPIGenerator {
    collectTestResult(result: TestResult): void
    generateOpenAPISpec(): unknown
}
