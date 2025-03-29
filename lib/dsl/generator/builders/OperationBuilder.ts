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

import { TestResult } from "../types/TestResult"
import { SchemaBuilder } from "./SchemaBuilder"
import { PathBuilder } from "./PathBuilder"

/**
 * 오퍼레이션 생성 로직을 담당하는 클래스
 */
export class OperationBuilder {
    /**
     * 테스트 결과로부터 API 오퍼레이션 객체를 생성합니다.
     * @param {TestResult} result 테스트 결과
     * @returns {unknown} API 오퍼레이션 객체
     */
    public static generateOperation(result: TestResult): unknown {
        const { options, request, response } = result

        // URL에서 경로 매개변수 추출
        const pathParams = PathBuilder.extractPathParameters(result.url)

        return {
            summary: options.summary,
            tags: [options.tag],
            // 경로 매개변수가 있으면 parameters 배열에 추가
            parameters:
                pathParams.length > 0
                    ? pathParams.map((param) => ({
                          name: param,
                          in: "path",
                          required: true,
                          schema: {
                              type: "string",
                          },
                      }))
                    : undefined,
            requestBody: OperationBuilder.generateRequestBody(request),
            responses: OperationBuilder.generateResponses(response),
        }
    }

    /**
     * 요청 정보로부터 요청 바디 객체를 생성합니다.
     * @param {TestResult["request"]} request 요청 정보
     * @returns {unknown} 요청 바디 객체
     */
    private static generateRequestBody(request: TestResult["request"]): unknown {
        if (!request.body) return undefined

        return {
            content: {
                "application/json": {
                    schema: SchemaBuilder.inferSchema(request.body),
                },
            },
        }
    }

    /**
     * 응답 정보로부터 응답 객체를 생성합니다.
     * @param {TestResult["response"]} response 응답 정보
     * @returns {unknown} 응답 객체
     */
    private static generateResponses(response: TestResult["response"]): unknown {
        return {
            [response.status]: {
                description: OperationBuilder.getStatusDescription(response.status),
                content: response.body
                    ? {
                          "application/json": {
                              schema: SchemaBuilder.inferSchema(response.body),
                          },
                      }
                    : undefined,
            },
        }
    }

    /**
     * HTTP 상태 코드에 대한 설명을 반환합니다.
     * @param {number} status HTTP 상태 코드
     * @returns {string} 상태 코드 설명
     */
    private static getStatusDescription(status: number): string {
        const descriptions: Record<number, string> = {
            200: "Success",
            201: "Created",
            400: "Bad Request",
            401: "Unauthorized",
            403: "Forbidden",
            404: "Not Found",
            500: "Internal Server Error",
        }
        return descriptions[status] || "Unknown Status"
    }
}
