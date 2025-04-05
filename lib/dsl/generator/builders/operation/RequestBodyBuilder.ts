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
import { Content, RequestBodyObject } from "../../types/OpenAPITypes"
import { RequestBodyBuilderInterface } from "./interfaces"
import { SchemaBuilder } from "../schema"
import { UtilityBuilder } from "./UtilityBuilder"
import { isDSLField } from "../../../interface/field"

/**
 * OpenAPI RequestBody 객체 생성을 담당하는 빌더 클래스
 */
export class RequestBodyBuilder implements RequestBodyBuilderInterface {
    private utilityBuilder = new UtilityBuilder()

    /**
     * 요청 본문을 생성합니다.
     * @param result 테스트 결과
     * @returns 요청 본문 객체 또는 undefined
     */
    public generateRequestBody(result: TestResult): RequestBodyObject | undefined {
        if (!result.request.body) {
            return undefined
        }

        const contentType = this.getContentType(result.request)
        const schema = SchemaBuilder.inferSchema(result.request.body) as Record<string, any>
        const content: Content = {
            [contentType]: {
                schema,
            },
        }

        if (result.request.body) {
            content[contentType].example = this.utilityBuilder.extractSimpleExampleValue(
                result.request.body,
            )
        }

        return {
            content,
            required: true,
        }
    }

    /**
     * 요청의 Content-Type을 가져옵니다.
     * @param request 요청 객체
     * @returns Content-Type 값
     */
    private getContentType(request: TestResult["request"]): string {
        if (request.headers && "content-type" in request.headers) {
            const contentType = request.headers["content-type"]
            if (typeof contentType === "string") {
                return contentType
            } else if (isDSLField(contentType) && typeof contentType.example === "string") {
                return contentType.example
            }
        }

        return "application/json"
    }
}
