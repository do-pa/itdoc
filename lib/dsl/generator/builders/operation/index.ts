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

export * from "./interfaces"

export * from "./UtilityBuilder"
export * from "./ParameterBuilder"
export * from "./SecurityBuilder"
export * from "./RequestBodyBuilder"
export * from "./ResponseBuilder"

import { TestResult } from "../../types/TestResult"
import { OperationBuilderInterface } from "./interfaces"
import { ParameterBuilder } from "./ParameterBuilder"
import { SecurityBuilder } from "./SecurityBuilder"
import { RequestBodyBuilder } from "./RequestBodyBuilder"
import { ResponseBuilder } from "./ResponseBuilder"
import { UtilityBuilder } from "./UtilityBuilder"

/**
 * Builder class responsible for creating OpenAPI Operation objects
 */
export class OperationBuilder implements OperationBuilderInterface {
    private parameterBuilder = new ParameterBuilder()
    private securityBuilder = new SecurityBuilder()
    private requestBodyBuilder = new RequestBodyBuilder()
    private responseBuilder = new ResponseBuilder()
    private utilityBuilder = new UtilityBuilder()

    /**
     * Generates an OpenAPI Operation object from test results.
     * @param {TestResult} result Test result
     * @returns {Record<string, unknown>} OpenAPI Operation object
     */
    public generateOperation(result: TestResult): Record<string, unknown> {
        const operation: Record<string, unknown> = {
            tags: [result.options.tag || this.utilityBuilder.generateDefaultTag(result.url)],
        }

        operation.operationId = this.utilityBuilder.generateOperationId(result)

        if (result.options.description) {
            operation.description = result.options.description
        }

        const parameters = this.parameterBuilder.extractParameters(result)
        if (parameters.length > 0) {
            operation.parameters = parameters
        }

        const security = this.securityBuilder.extractSecurityRequirements(result)
        if (security.length > 0) {
            operation.security = security
        }

        const requestBody = this.requestBodyBuilder.generateRequestBody(result)
        if (requestBody) {
            operation.requestBody = requestBody
        }

        const responses = this.responseBuilder.generateResponses(result)
        operation.responses = responses

        return operation
    }

    /**
     * Gets the security schemes.
     * @returns {Record<string, any>} Currently registered security schema map
     */
    public getSecuritySchemes(): Record<string, any> {
        return this.securityBuilder.getSecuritySchemes()
    }
}
