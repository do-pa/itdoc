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

import { TestResult, IOpenAPIGenerator } from "./types/TestResult"
import { OperationBuilder, UtilityBuilder } from "./builders/operation"
import logger from "../../config/logger"
import { HttpStatus } from "../enums"
import {
    getOpenAPIBaseUrl,
    getOpenAPIDocumentDescription,
    getOpenAPITitle,
} from "../../config/getOpenAPIConfig"

// 싱글톤 인스턴스를 저장할 변수
let instance: OpenAPIGenerator | null = null

interface OpenAPIInfo {
    title: string
    version: string
    description?: string
}

/**
 * OpenAPI Specification 생성기
 */
export class OpenAPIGenerator implements IOpenAPIGenerator {
    private testResults: TestResult[] = []
    private title: string = getOpenAPITitle()
    private version: string = "1.0.0"
    private description: string = getOpenAPIDocumentDescription()
    private servers: Array<{ url: string; description?: string }> = []
    private defaultSecurity: Record<string, string[]>[] = [{}] // 기본값은 빈 보안 요구사항 (선택적 보안)
    private operationBuilder = new OperationBuilder()
    private utilityBuilder = new UtilityBuilder()

    /**
     * 생성자 - 싱글톤 패턴을 위해 private으로 설정
     */
    private constructor() {
        this.servers.push({
            url: getOpenAPIBaseUrl(),
            description: "",
        })
    }

    /**
     * 싱글톤 인스턴스를 반환합니다.
     * @returns {OpenAPIGenerator} OpenAPIGenerator의 싱글톤 인스턴스
     */
    public static getInstance(): OpenAPIGenerator {
        if (!instance) {
            instance = new OpenAPIGenerator()
        }
        return instance
    }

    /**
     * 테스트가 통과했을 때 결과를 수집합니다.
     * @param {TestResult} result 테스트 결과 객체
     */
    public collectTestResult(result: TestResult): void {
        this.testResults.push(result)
    }

    /**
     * 수집된 테스트 결과를 OpenAPI Specification으로 변환합니다.
     * @returns {object} OpenAPI Specification 객체
     */
    public generateOpenAPISpec(): Record<string, unknown> {
        // 테스트 결과를 그룹화
        const groupedResults = this.groupTestResults()

        // 경로 객체 생성
        const paths = this.generatePaths(groupedResults)

        // 경로 파라미터 검증 및 수정
        this.validatePathParameters(paths)

        // 최종 OpenAPI 문서 생성
        return this.createFinalOpenAPIDocument(paths)
    }

    /**
     * 테스트 결과를 경로, 메서드, 상태 코드별로 그룹화합니다.
     */
    private groupTestResults(): Map<string, Map<string, Map<string, TestResult[]>>> {
        const groupedResults: Map<string, Map<string, Map<string, TestResult[]>>> = new Map()

        // 테스트 결과를 그룹화
        for (const result of this.testResults) {
            const path = result.url
            const method = result.method.toLowerCase()
            const statusCode = result.response.status.toString()

            if (!groupedResults.has(path)) {
                groupedResults.set(path, new Map())
            }
            if (!groupedResults.get(path)!.has(method)) {
                groupedResults.get(path)!.set(method, new Map())
            }
            if (!groupedResults.get(path)!.get(method)!.has(statusCode)) {
                groupedResults.get(path)!.get(method)!.set(statusCode, [])
            }

            groupedResults.get(path)!.get(method)!.get(statusCode)!.push(result)
        }

        logger.info("Grouped test results:", groupedResults)

        return groupedResults
    }

    /**
     * 그룹화된 테스트 결과로부터 경로 객체를 생성합니다.
     * @param groupedResults
     */
    private generatePaths(
        groupedResults: Map<string, Map<string, Map<string, TestResult[]>>>,
    ): Record<string, Record<string, unknown>> {
        const paths: Record<string, Record<string, unknown>> = {}

        // 그룹화된 테스트 결과를 처리
        for (const [path, methods] of groupedResults) {
            paths[path] = {}

            for (const [method, statusCodes] of methods) {
                paths[path][method] = this.generateOperationObject(path, method, statusCodes)
            }
        }

        return paths
    }

    /**
     * 특정 경로와 메서드에 대한 작업 객체를 생성합니다.
     * @param path
     * @param method
     * @param statusCodes
     */
    private generateOperationObject(
        path: string,
        method: string,
        statusCodes: Map<string, TestResult[]>,
    ): Record<string, unknown> {
        // 각 경로/메서드에 대한 작업 생성
        const operationObj: Record<string, unknown> = {}
        const responses: Record<string, unknown> = {}

        // 대표 테스트 결과 선택 (상태 코드 우선순위 무관)
        // 이 결과는 기본 작업 정보(요약, 태그 등)를 위해 사용됨
        const representativeResult = this.selectRepresentativeResult(
            Array.from(statusCodes.values()).flat(),
        )

        // 기본 작업 정보 설정
        operationObj.summary =
            representativeResult.options?.summary || `${method.toUpperCase()} ${path} 요청`

        if (representativeResult.options?.tag) {
            operationObj.tags = [representativeResult.options.tag]
        }

        // description 설정 추가
        if (representativeResult.options?.description) {
            operationObj.description = representativeResult.options.description
        }

        operationObj.operationId = this.utilityBuilder.generateOperationId(representativeResult)

        // 요청 본문, 파라미터 등 공통 작업 정보
        this.setRequestInformation(operationObj, representativeResult)

        // 각 상태 코드별 응답 처리
        this.processStatusCodes(statusCodes, responses)

        // 응답 정보 설정
        operationObj.responses = responses

        // 보안 요구사항 추출
        const security = this.operationBuilder.generateOperation(representativeResult).security

        // Authorization 헤더가 있으면 보안 요구사항 적용, 없으면 기본값 사용
        // security가 비어있거나 [{}]인 경우는 제외
        const hasBearerAuth =
            security &&
            Array.isArray(security) &&
            security.length > 0 &&
            security.some((item) => Object.keys(item).length > 0)

        operationObj.security = hasBearerAuth ? security : this.defaultSecurity

        return operationObj
    }

    /**
     * 각 상태 코드별 응답 처리
     * @param statusCodes 상태 코드별 테스트 결과 맵
     * @param responses 응답 객체
     */
    private processStatusCodes(
        statusCodes: Map<string, TestResult[]>,
        responses: Record<string, unknown>,
    ): void {
        for (const [statusCode, results] of statusCodes) {
            const firstResult = results[0]
            const numericStatusCode = parseInt(statusCode, 10)

            const isErrorStatus = numericStatusCode >= 400
            const isNoContentStatus = this.isNoContentStatusCode(numericStatusCode)

            if (isNoContentStatus || this.hasEmptyResponseBody(firstResult)) {
                this.addResponseWithoutContent(responses, statusCode, firstResult)
                continue
            }

            const hasAnyResponseBodyDefined = results.some(
                this.hasResponseBodyExplicitlyDefined.bind(this),
            )
            if (!hasAnyResponseBodyDefined) {
                this.addResponseWithoutContent(responses, statusCode, firstResult)
                continue
            }

            this.processResponsesWithContent(responses, statusCode, results, isErrorStatus)
        }
    }

    /**
     * 응답 본문이 없는 응답을 추가합니다.
     * @param responses 응답 객체
     * @param statusCode 상태 코드
     * @param result 테스트 결과
     */
    private addResponseWithoutContent(
        responses: Record<string, unknown>,
        statusCode: string,
        result: TestResult,
    ): void {
        responses[statusCode] = {
            description: result.testSuiteDescription || this.getStatusText(statusCode),
        }
    }

    /**
     * 응답 본문이 있는 경우 처리합니다.
     * @param responses 응답 객체
     * @param statusCode 상태 코드
     * @param results 테스트 결과 배열
     * @param isErrorStatus 에러 상태 여부
     */
    private processResponsesWithContent(
        responses: Record<string, unknown>,
        statusCode: string,
        results: TestResult[],
        isErrorStatus: boolean,
    ): void {
        const firstResult = results[0]
        const combinedContent = this.createCombinedContent(results, statusCode, isErrorStatus)

        if (Object.keys(combinedContent).length === 0) {
            this.addResponseWithoutContent(responses, statusCode, firstResult)
        } else {
            responses[statusCode] = {
                description: firstResult.testSuiteDescription || this.getStatusText(statusCode),
                content: combinedContent,
            }
        }
    }

    /**
     * 통합된 응답 컨텐츠를 생성합니다.
     * @param results 테스트 결과 배열
     * @param statusCode 상태 코드
     * @param isErrorStatus 에러 상태 여부
     * @returns 통합된 응답 컨텐츠
     */
    private createCombinedContent(
        results: TestResult[],
        statusCode: string,
        isErrorStatus: boolean,
    ): Record<string, any> {
        const combinedContent: Record<string, any> = {}
        const baseSchema = this.createBaseSchema(isErrorStatus)

        for (const result of results) {
            if (!this.hasResponseBodyExplicitlyDefined(result)) {
                continue
            }

            const opObj = this.operationBuilder.generateOperation(result)
            const res = (opObj.responses as Record<string, any>)[statusCode]

            if (!res?.content) {
                continue
            }

            this.processContentTypes(
                combinedContent,
                res.content,
                result,
                statusCode,
                baseSchema,
                isErrorStatus,
            )
        }

        return combinedContent
    }

    /**
     * 기본 스키마를 생성합니다.
     * @param isErrorStatus 에러 상태 여부
     * @returns 기본 스키마 객체
     */
    private createBaseSchema(isErrorStatus: boolean): Record<string, any> {
        return isErrorStatus
            ? {
                  type: "object",
                  properties: {
                      error: {
                          type: "object",
                          properties: {
                              message: { type: "string" },
                              code: { type: "string" },
                          },
                      },
                  },
              }
            : {
                  type: "object",
              }
    }

    /**
     * 각 컨텐츠 타입을 처리합니다.
     * @param combinedContent 통합된 컨텐츠 객체
     * @param resContent 응답 컨텐츠
     * @param result 테스트 결과
     * @param statusCode 상태 코드
     * @param baseSchema 기본 스키마
     * @param isErrorStatus 에러 상태 여부
     */
    private processContentTypes(
        combinedContent: Record<string, any>,
        resContent: Record<string, any>,
        result: TestResult,
        statusCode: string,
        baseSchema: Record<string, any>,
        isErrorStatus: boolean,
    ): void {
        for (const [contentType, rawContentObj] of Object.entries(resContent)) {
            const contentObj = rawContentObj as Record<string, any>

            if (!combinedContent[contentType]) {
                combinedContent[contentType] = {
                    schema: contentObj.schema || baseSchema,
                    examples: {},
                }
            }

            const exampleKey =
                result.testSuiteDescription || (isErrorStatus ? "에러 응답" : "성공 응답")
            const exampleValue = contentObj.example || result.response.body || null

            if (isErrorStatus && exampleValue) {
                combinedContent[contentType].examples[exampleKey] = {
                    value: {
                        error: {
                            message: result.testSuiteDescription || `Status ${statusCode} error`,
                            code: `ERROR_${statusCode}`,
                        },
                    },
                }
            } else {
                combinedContent[contentType].examples[exampleKey] = {
                    value: exampleValue,
                }
            }
        }
    }

    /**
     * 상태 코드가 No Content 응답인지 확인합니다.
     * @param numericStatusCode 숫자 상태 코드
     * @returns No Content 응답이면 true, 그렇지 않으면 false
     */
    private isNoContentStatusCode(numericStatusCode: number): boolean {
        return numericStatusCode === 204 || numericStatusCode === 304 || numericStatusCode === 100
    }

    /**
     * 응답 본문이 비어있는지 확인합니다.
     * @param result 테스트 결과 객체
     * @returns {boolean} 응답 본문이 비어있으면 true, 그렇지 않으면 false
     */
    private hasEmptyResponseBody(result: TestResult): boolean {
        if (!result.response) {
            return true
        }

        const { body } = result.response

        if (body === undefined || body === null) {
            return true
        }

        if (typeof body === "object" && Object.keys(body).length === 0) {
            return true
        }

        return false
    }

    /**
     * 테스트 케이스에서 응답 본문이 명시적으로 정의되었는지 확인합니다.
     * @param result 테스트 결과 객체
     * @returns {boolean} 응답 본문이 명시적으로 정의되었으면 true, 그렇지 않으면 false
     */
    private hasResponseBodyExplicitlyDefined(result: TestResult): boolean {
        return (
            result.response &&
            typeof result.response === "object" &&
            "body" in result.response &&
            result.response.body !== undefined
        )
    }

    private getStatusText(code: string): string {
        const numericCode = parseInt(code, 10)
        const statusText = HttpStatus[numericCode]

        return statusText ? `${code} ${statusText.replace(/_/g, " ")}` : code
    }

    /**
     * 최종 OpenAPI 문서를 생성합니다.
     * @param paths
     */
    private createFinalOpenAPIDocument(
        paths: Record<string, Record<string, unknown>>,
    ): Record<string, unknown> {
        const info: OpenAPIInfo = {
            title: this.title,
            description: this.description,
            version: this.version,
        }

        if (this.description) {
            info.description = this.description
        }

        const openApiSpec: Record<string, unknown> = {
            openapi: "3.0.0",
            info,
            servers: this.servers,
            paths,
        }

        const components = this.createComponentsSection()
        if (Object.keys(components).length > 0) {
            openApiSpec.components = components
        }

        if (this.defaultSecurity.length > 0) {
            openApiSpec.security = this.defaultSecurity
        }

        return openApiSpec
    }

    /**
     * Components 섹션을 생성합니다.
     */
    private createComponentsSection(): Record<string, unknown> {
        const components: Record<string, unknown> = {}

        // 보안 스키마가 있으면 추가
        const securitySchemes = this.operationBuilder.getSecuritySchemes()
        if (Object.keys(securitySchemes).length > 0) {
            components.securitySchemes = securitySchemes
        }

        return components
    }

    /**
     * 여러 테스트 결과 중에서 대표 결과를 선택합니다.
     * @param results 테스트 결과 배열
     * @returns 선택된 대표 테스트 결과
     */
    private selectRepresentativeResult(results: TestResult[]): TestResult {
        // 먼저 Authorization 헤더가 있는 테스트 케이스를 찾습니다
        const authTestCase = results.find(
            (result) => result.request.headers && "Authorization" in result.request.headers,
        )

        // Authorization 헤더가 있는 테스트 케이스가 있으면 반환
        if (authTestCase) {
            logger.debug(`선택된 대표 테스트 케이스: Authorization 헤더 있음`)
            return authTestCase
        }

        // 그렇지 않으면 옵션 정보가 가장 많은 결과 선택 (요약, 태그 등)
        return results.reduce((best, current) => {
            const bestOptionsCount = Object.keys(best.options || {}).length
            const currentOptionsCount = Object.keys(current.options || {}).length
            return currentOptionsCount > bestOptionsCount ? current : best
        }, results[0])
    }

    /**
     * 작업에 요청 정보를 설정합니다.
     * @param operation 작업 객체
     * @param result 테스트 결과
     */
    private setRequestInformation(operation: Record<string, unknown>, result: TestResult): void {
        // 요청 객체 생성 - OperationBuilder가 올바르게 파라미터를 처리하도록 함
        const requestObj = this.operationBuilder.generateOperation(result)

        if (requestObj.parameters) {
            operation.parameters = requestObj.parameters
        }

        if (result.request?.body && requestObj.requestBody) {
            operation.requestBody = requestObj.requestBody
        }

        // 보안 요구사항이 있으면 설정
        if (requestObj.security) {
            operation.security = requestObj.security
        }
    }

    /**
     * 경로 파라미터가 올바르게 정의되었는지 확인하고 수정합니다.
     * @param {Record<string, Record<string, unknown>>} paths 경로 객체
     */
    private validatePathParameters(paths: Record<string, Record<string, unknown>>): void {
        for (const [path, pathItem] of Object.entries(paths)) {
            const pathParamMatches = path.match(/\{([^}]+)\}/g) || []
            const pathParams = pathParamMatches.map((param) => param.slice(1, -1))

            if (pathParams.length === 0) continue

            for (const [, operation] of Object.entries(pathItem)) {
                const op = operation as Record<string, unknown>

                if (!op.parameters) {
                    op.parameters = []
                }

                const parameters = op.parameters as Array<Record<string, unknown>>

                const definedPathParams = new Map<string, Record<string, unknown>>()
                parameters
                    .filter((param) => param.in === "path")
                    .forEach((param) => {
                        definedPathParams.set(param.name as string, param)
                    })

                for (const param of pathParams) {
                    if (!definedPathParams.has(param)) {
                        parameters.push({
                            name: param,
                            in: "path",
                            required: true,
                            schema: {
                                type: "string",
                            },
                            description: `${param} 파라미터`,
                        })
                    }
                }
            }
        }
    }

    /**
     * 스키마에 맞게 예제를 정규화
     * @param example 예제 값
     * @param schema 스키마 정의
     * @returns 정규화된 예제
     */
    private normalizeExample(example: any, schema: Record<string, any>): any {
        if (example === null || example === undefined || !schema) {
            return example
        }

        const schemaType = schema.type
        if (!schemaType) {
            return example
        }

        switch (schemaType) {
            case "object":
                if (typeof example === "object" && !Array.isArray(example) && schema.properties) {
                    const result: Record<string, any> = {}
                    for (const [propName, propSchema] of Object.entries(schema.properties)) {
                        if (example[propName] !== undefined) {
                            if (
                                typeof example[propName] === "object" &&
                                example[propName] !== null &&
                                "example" in example[propName]
                            ) {
                                result[propName] = example[propName].example
                            } else {
                                result[propName] = this.normalizeExample(
                                    example[propName],
                                    propSchema as Record<string, any>,
                                )
                            }
                        }
                    }
                    return result
                }
                return example

            case "array":
                if (Array.isArray(example) && schema.items) {
                    return example.map((item) =>
                        this.normalizeExample(item, schema.items as Record<string, any>),
                    )
                }
                return example

            default:
                return example
        }
    }
}
