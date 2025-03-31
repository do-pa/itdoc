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

import { TestResult } from "../../types/TestResult"
import { Content, HeaderObject, ResponseObject } from "../../types/OpenAPITypes"
import { ResponseBuilderInterface } from "./interfaces"
import { SchemaBuilder } from "../schema"
import { UtilityBuilder } from "./UtilityBuilder"
import { HTTP_STATUS_DESCRIPTIONS, DEFAULT_SUCCESS_STATUS_CODES } from "./constants"

/**
 * OpenAPI Response 객체 생성을 담당하는 빌더 클래스
 */
export class ResponseBuilder implements ResponseBuilderInterface {
    private utilityBuilder = new UtilityBuilder()

    /**
     * 응답을 생성합니다.
     * @param result 테스트 결과
     * @returns 응답 객체 맵
     */
    public generateResponses(result: TestResult): Record<string, ResponseObject> {
        const responses: Record<string, ResponseObject> = {}

        if (result.response.status) {
            const statusCode = result.response.status.toString()

            responses[statusCode] = {
                description: this.getStatusDescription(result.response.status),
            }

            if (result.response.headers && Object.keys(result.response.headers).length > 0) {
                const headers: Record<string, HeaderObject> = {}

                for (const [name, value] of Object.entries(result.response.headers)) {
                    headers[name] = {
                        schema: SchemaBuilder.inferSchema(value) as Record<string, any>,
                    }
                }

                responses[statusCode].headers = headers
            }

            if (result.response.body) {
                const contentType =
                    result.response.headers && "content-type" in result.response.headers
                        ? String(result.response.headers["content-type"])
                        : "application/json"

                const content: Content = {
                    [contentType]: {
                        schema: SchemaBuilder.inferSchema(result.response.body) as Record<
                            string,
                            any
                        >,
                        example: this.utilityBuilder.extractSimpleExampleValue(
                            result.response.body,
                        ),
                    },
                }

                responses[statusCode].content = content
            }
        }

        this.addDefaultResponses(responses, result.method)

        return responses
    }

    /**
     * 요청 메서드에 따라 적절한 기본 응답을 추가합니다.
     * @param responses 현재 응답 맵
     * @param method HTTP 메서드
     */
    private addDefaultResponses(responses: Record<string, ResponseObject>, method: string): void {
        const has2xx = Object.keys(responses).some((status) => status.startsWith("2"))
        const has4xx = Object.keys(responses).some((status) => status.startsWith("4"))

        if (!has2xx) {
            const defaultStatusCode = DEFAULT_SUCCESS_STATUS_CODES[method.toUpperCase()] || "200"
            responses[defaultStatusCode] = {
                description: this.getStatusDescription(parseInt(defaultStatusCode)),
            }
        }

        if (!has4xx) {
            responses["400"] = { description: "Bad Request" }

            if (!["OPTIONS", "HEAD"].includes(method.toUpperCase())) {
                responses["404"] = { description: "Not Found" }
            }
        }
    }

    /**
     * HTTP 상태 코드에 대한 설명을 반환합니다.
     * @param status HTTP 상태 코드
     * @returns 상태 코드 설명
     */
    private getStatusDescription(status: number): string {
        return HTTP_STATUS_DESCRIPTIONS[status] || `Status ${status}`
    }
}
