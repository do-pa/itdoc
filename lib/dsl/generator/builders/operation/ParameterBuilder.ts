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

/**
 * OpenAPI Parameter 객체 생성을 담당하는 빌더 클래스
 */
export class ParameterBuilder implements ParameterBuilderInterface {
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
            const schema = SchemaBuilder.inferSchema(value) as Record<string, any>
            parameters.push({
                name,
                in: "path",
                required: true,
                schema,
                example: value,
            })
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
