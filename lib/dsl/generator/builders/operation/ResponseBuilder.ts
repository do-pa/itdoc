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

/**
 * Builder class responsible for creating OpenAPI Response objects
 */
export class ResponseBuilder implements ResponseBuilderInterface {
    private utilityBuilder = new UtilityBuilder()

    /**
     * Generates responses.
     * @param {TestResult} result Test result
     * @returns {Record<string, ResponseObject>} Response object map
     */
    public generateResponses(result: TestResult): Record<string, ResponseObject> {
        const responses: Record<string, ResponseObject> = {}

        if (result.response.status) {
            const statusCode = result.response.status.toString()

            responses[statusCode] = {
                description: result.testSuiteDescription,
            }

            if (result.response.headers && Object.keys(result.response.headers).length > 0) {
                const headers: Record<string, HeaderObject> = {}

                // List of default HTTP headers to filter
                const skipHeaders = [
                    "x-powered-by",
                    "content-type",
                    "date",
                    "connection",
                    "content-length",
                    "etag",
                    "keep-alive",
                    "proxy-authenticate",
                    "proxy-authorization",
                    "te",
                    "trailer",
                    "transfer-encoding",
                    "upgrade",
                ]

                for (const [name, value] of Object.entries(result.response.headers)) {
                    // Skip default headers
                    if (skipHeaders.includes(name.toLowerCase())) {
                        continue
                    }

                    headers[name] = {
                        schema: SchemaBuilder.inferSchema(value) as Record<string, any>,
                    }
                }

                // Add only when there is at least one header
                if (Object.keys(headers).length > 0) {
                    responses[statusCode].headers = headers
                }
            }

            if (result.response.body) {
                const contentType =
                    result.response.headers && "content-type" in result.response.headers
                        ? String(result.response.headers["content-type"])
                        : "application/json; charset=utf-8"

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
     * Adds appropriate default responses based on request method.
     * @param {Record<string, ResponseObject>} responses Current response map
     * @param {string} method HTTP method
     */
    private addDefaultResponses(responses: Record<string, ResponseObject>, method: string): void {
        const has4xx = Object.keys(responses).some((status) => status.startsWith("4"))

        if (!has4xx) {
            responses["400"] = { description: "Bad Request" }

            if (!["OPTIONS", "HEAD"].includes(method.toUpperCase())) {
                responses["404"] = { description: "Not Found" }
            }
        }
    }
}
