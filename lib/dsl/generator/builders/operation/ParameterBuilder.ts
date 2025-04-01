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
import { ParameterObject } from "../../types/OpenAPITypes"
import { ParameterBuilderInterface } from "./interfaces"
import { isDSLField } from "../../../interface/field"
import { SchemaBuilder } from "../schema"
import { UtilityBuilder } from "./UtilityBuilder"

/**
 * OpenAPI Parameter 객체 생성을 담당하는 빌더 클래스
 */
export class ParameterBuilder implements ParameterBuilderInterface {
    private utilityBuilder = new UtilityBuilder()

    /**
     * 테스트 결과에서 파라미터를 추출합니다.
     * @param result 테스트 결과
     * @returns 파라미터 객체 배열
     */
    public extractParameters(result: TestResult): ParameterObject[] {
        const parameters: ParameterObject[] = []

        if (result.request.pathParams) {
            parameters.push(...this.extractPathParameters(result.request.pathParams))
        }

        if (result.request.queryParams) {
            parameters.push(...this.extractQueryParameters(result.request.queryParams))
        }

        if (result.request.headers) {
            parameters.push(...this.extractHeaderParameters(result.request.headers))
        }

        return parameters
    }

    /**
     * 경로 파라미터를 추출합니다.
     * @param pathParams 경로 파라미터 객체
     * @returns 파라미터 객체 배열
     */
    private extractPathParameters(pathParams: Record<string, any>): ParameterObject[] {
        const parameters: ParameterObject[] = []

        for (const [name, value] of Object.entries(pathParams)) {
            // 기본 파라미터 객체 생성
            const parameter: ParameterObject = {
                name,
                in: "path",
                required: true,
                schema: {
                    type: "string",
                },
            }

            // DSL 필드인 경우 메타데이터 추출 (description 및 example)
            if (isDSLField(value)) {
                if (value.description) {
                    parameter.description = value.description
                }

                // example 값 직접 설정 (DSL 필드의 example 값 자체가 필요)
                if (value.example !== undefined && value.example !== null) {
                    if (isDSLField(value.example)) {
                        // example이 다시 DSL 필드인 경우 재귀적으로 처리
                        parameter.example = this.utilityBuilder.extractSimpleExampleValue(
                            value.example,
                        )
                    } else {
                        parameter.example = value.example
                    }
                }

                // 스키마 생성 시 example 제외하고 생성
                parameter.schema = SchemaBuilder.inferSchema(value.example, false) as Record<
                    string,
                    any
                >
            } else {
                // 일반 값인 경우
                parameter.schema = SchemaBuilder.inferSchema(value, false) as Record<string, any>
                parameter.example = value
            }

            parameters.push(parameter)
        }

        return parameters
    }

    /**
     * 쿼리 파라미터를 추출합니다.
     * @param queryParams 쿼리 파라미터 객체
     * @returns 파라미터 객체 배열
     */
    private extractQueryParameters(queryParams: Record<string, any>): ParameterObject[] {
        const parameters: ParameterObject[] = []

        for (const [name, value] of Object.entries(queryParams)) {
            if (value !== undefined) {
                let required = false
                let description: string | undefined

                if (isDSLField(value)) {
                    required = value.required
                    description = value.description
                }

                const schema = SchemaBuilder.inferSchema(value) as Record<string, any>
                const param: ParameterObject = {
                    name,
                    in: "query",
                    schema,
                    required,
                }

                if (description) {
                    param.description = description
                }

                parameters.push(param)
            }
        }

        return parameters
    }

    /**
     * 헤더 파라미터를 추출합니다.
     * @param headers 헤더 객체
     * @returns 파라미터 객체 배열
     */
    private extractHeaderParameters(headers: Record<string, any>): ParameterObject[] {
        const parameters: ParameterObject[] = []

        for (const [name, value] of Object.entries(headers)) {
            if (name.toLowerCase() !== "authorization" && value !== undefined) {
                let required = false
                let description: string | undefined

                if (isDSLField(value)) {
                    required = value.required
                    description = value.description
                }

                const schema = SchemaBuilder.inferSchema(value) as Record<string, any>
                const param: ParameterObject = {
                    name,
                    in: "header",
                    schema,
                    required,
                }

                if (description) {
                    param.description = description
                }

                parameters.push(param)
            }
        }

        return parameters
    }
}
