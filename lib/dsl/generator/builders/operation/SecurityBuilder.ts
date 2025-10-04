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
import { SecurityBuilderInterface } from "./interfaces"
import { isDSLField } from "../../../interface/field"

/**
 * Builder class responsible for generating OpenAPI Security requirements
 */
export class SecurityBuilder implements SecurityBuilderInterface {
    private securitySchemes: Record<string, any> = {}

    /**
     * Extracts security requirements from test results.
     * @param {TestResult} result Test result
     * @returns {Array<Record<string, string[]>>} Array of security requirements
     */
    public extractSecurityRequirements(result: TestResult): Array<Record<string, string[]>> {
        const security: Array<Record<string, string[]>> = []

        if (result.request.headers && "authorization" in result.request.headers) {
            const authHeaderValue = result.request.headers["authorization"]
            let authHeader = ""

            if (typeof authHeaderValue === "string") {
                authHeader = authHeaderValue
            } else if (isDSLField(authHeaderValue)) {
                const example = authHeaderValue.example
                authHeader = typeof example === "string" ? example : String(example)
            }

            if (authHeader) {
                if (authHeader.startsWith("Bearer ")) {
                    const bearerKey = "BearerAuth"
                    if (!this.securitySchemes[bearerKey]) {
                        this.securitySchemes[bearerKey] = {
                            type: "http",
                            scheme: "bearer",
                            bearerFormat: "JWT",
                        }
                    }
                    security.push({ [bearerKey]: [] })
                } else if (authHeader.startsWith("Basic ")) {
                    const basicKey = "BasicAuth"
                    if (!this.securitySchemes[basicKey]) {
                        this.securitySchemes[basicKey] = {
                            type: "http",
                            scheme: "basic",
                        }
                    }
                    security.push({ [basicKey]: [] })
                } else {
                    const apiKeyKey = "ApiKeyAuth"
                    if (!this.securitySchemes[apiKeyKey]) {
                        this.securitySchemes[apiKeyKey] = {
                            type: "apiKey",
                            name: "Authorization",
                            in: "header",
                        }
                    }
                    security.push({ [apiKeyKey]: [] })
                }
            }
        }

        if (security.length === 0) {
            security.push({})
        }

        return security
    }

    /**
     * Gets security schemas.
     * @returns {Record<string, any>} Currently registered security schema map
     */
    public getSecuritySchemes(): Record<string, any> {
        return this.securitySchemes
    }
}
