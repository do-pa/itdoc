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
 * Builder class responsible for creating OpenAPI RequestBody objects
 */
export class RequestBodyBuilder implements RequestBodyBuilderInterface {
    private utilityBuilder = new UtilityBuilder()

    /**
     * Generates request body.
     * @param result Test result
     * @returns Request body object or undefined
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
     * Gets the Content-Type of the request.
     * @param request Request object
     * @returns Content-Type value
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
