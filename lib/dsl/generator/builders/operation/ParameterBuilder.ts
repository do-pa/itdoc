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
 * Builder class responsible for creating OpenAPI Parameter objects
 */
export class ParameterBuilder implements ParameterBuilderInterface {
    private utilityBuilder = new UtilityBuilder()

    /**
     * Extracts parameters from test results.
     * @param {TestResult} result Test result
     * @returns {ParameterObject[]} Array of parameter objects
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
     * Extracts path parameters.
     * @param {Record<string, any>} pathParams Path parameter object
     * @returns {ParameterObject[]} Array of parameter objects
     */
    private extractPathParameters(pathParams: Record<string, any>): ParameterObject[] {
        const parameters: ParameterObject[] = []

        for (const [name, value] of Object.entries(pathParams)) {
            // Create basic parameter object
            const parameter: ParameterObject = {
                name,
                in: "path",
                required: true,
                schema: {
                    type: "string",
                },
            }

            // Extract metadata for DSL fields (description and example)
            if (isDSLField(value)) {
                if (value.description) {
                    parameter.description = value.description
                }

                // Set example value directly (the example value of DSL field itself is needed)
                if (value.example !== undefined && value.example !== null) {
                    if (isDSLField(value.example)) {
                        // Process recursively if example is again a DSL field
                        parameter.example = this.utilityBuilder.extractSimpleExampleValue(
                            value.example,
                        )
                    } else {
                        parameter.example = value.example
                    }
                }

                // Generate schema excluding example when creating schema
                parameter.schema = SchemaBuilder.inferSchema(value.example, false) as Record<
                    string,
                    any
                >
            } else {
                // For regular values
                parameter.schema = SchemaBuilder.inferSchema(value, false) as Record<string, any>
                parameter.example = value
            }

            parameters.push(parameter)
        }

        return parameters
    }

    /**
     * Extracts query parameters.
     * @param {Record<string, any>} queryParams Query parameter object
     * @returns {ParameterObject[]} Array of parameter objects
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
     * Extracts header parameters.
     * @param {Record<string, any>} headers Header object
     * @returns {ParameterObject[]} Array of parameter objects
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
