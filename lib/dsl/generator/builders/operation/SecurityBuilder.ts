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
import logger from "../../../../config/logger"

/**
 * OpenAPI Security 요구사항 생성을 담당하는 빌더 클래스
 */
export class SecurityBuilder implements SecurityBuilderInterface {
    private securitySchemes: Record<string, any> = {}

    /**
     * 테스트 결과에서 보안 요구사항을 추출합니다.
     * @param result 테스트 결과
     * @returns 보안 요구사항 배열
     */
    public extractSecurityRequirements(result: TestResult): Array<Record<string, string[]>> {
        const security: Array<Record<string, string[]>> = []

        logger.debug(
            `Checking headers for security requirements: ${JSON.stringify(result.request.headers || {})}`,
        )

        if (result.request.headers && "Authorization" in result.request.headers) {
            const authHeaderValue = result.request.headers["Authorization"]
            let authHeader = ""

            if (typeof authHeaderValue === "string") {
                authHeader = authHeaderValue
            } else if (isDSLField(authHeaderValue)) {
                const example = authHeaderValue.example
                authHeader = typeof example === "string" ? example : String(example)
            }

            logger.debug(`Authorization header found: ${authHeader}`)

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
                    logger.debug(`Added Bearer security requirement: ${JSON.stringify(security)}`)
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

        logger.debug(`Final security requirements: ${JSON.stringify(security)}`)
        return security
    }

    /**
     * 보안 스키마를 가져옵니다.
     * @returns 현재 등록된 보안 스키마 맵
     */
    public getSecuritySchemes(): Record<string, any> {
        return this.securitySchemes
    }
}
