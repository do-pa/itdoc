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

// 기본 인터페이스 및 상수 내보내기
export * from "./interfaces"
export * from "./constants"

// 각 빌더 클래스 내보내기
export * from "./UtilityBuilder"
export * from "./ParameterBuilder"
export * from "./SecurityBuilder"
export * from "./RequestBodyBuilder"
export * from "./ResponseBuilder"

// 주요 클래스들 가져오기
import { TestResult } from "../../types/TestResult"
import { OperationBuilderInterface } from "./interfaces"
import { Logger } from "../../utils/Logger"
import { ParameterBuilder } from "./ParameterBuilder"
import { SecurityBuilder } from "./SecurityBuilder"
import { RequestBodyBuilder } from "./RequestBodyBuilder"
import { ResponseBuilder } from "./ResponseBuilder"
import { UtilityBuilder } from "./UtilityBuilder"

/**
 * OpenAPI Operation 객체 생성을 담당하는 빌더 클래스
 */
export class OperationBuilder implements OperationBuilderInterface {
    private parameterBuilder = new ParameterBuilder()
    private securityBuilder = new SecurityBuilder()
    private requestBodyBuilder = new RequestBodyBuilder()
    private responseBuilder = new ResponseBuilder()
    private utilityBuilder = new UtilityBuilder()

    /**
     * 테스트 결과로부터 OpenAPI Operation 객체를 생성합니다.
     * @param result 테스트 결과
     * @returns OpenAPI Operation 객체
     */
    public generateOperation(result: TestResult): Record<string, unknown> {
        Logger.debug(`오퍼레이션 생성: ${result.method} ${result.url}`)

        const operation: Record<string, unknown> = {
            summary: result.options.summary || `${result.method} ${result.url}`,
            tags: [result.options.tag || this.utilityBuilder.generateDefaultTag(result.url)],
        }

        // operationId 생성 및 추가
        operation.operationId = this.utilityBuilder.generateOperationId(result)

        if (result.options.description) {
            operation.description = result.options.description
        }

        // 파라미터 추출 및 설정
        const parameters = this.parameterBuilder.extractParameters(result)
        if (parameters.length > 0) {
            operation.parameters = parameters
        }

        // 보안 요구사항 추출
        const security = this.securityBuilder.extractSecurityRequirements(result)
        if (security.length > 0) {
            operation.security = security
        }

        // 요청 본문 생성
        const requestBody = this.requestBodyBuilder.generateRequestBody(result)
        if (requestBody) {
            operation.requestBody = requestBody
        }

        // 응답 생성
        const responses = this.responseBuilder.generateResponses(result)
        operation.responses = responses

        return operation
    }

    /**
     * 보안 스키마를 가져옵니다.
     * @returns 현재 등록된 보안 스키마 맵
     */
    public getSecuritySchemes(): Record<string, any> {
        return this.securityBuilder.getSecuritySchemes()
    }
}
