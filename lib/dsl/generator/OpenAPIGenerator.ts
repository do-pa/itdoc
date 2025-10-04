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

let instance: OpenAPIGenerator | null = null

interface OpenAPIInfo {
    title: string
    version: string
    description?: string
}

/**
 * OpenAPI Specification generator
 *
 * It operates in a Singleton pattern and collects test results
 * Create a Specification document in OpenAPI 3.0.0 format.
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
     * Constructor - set as private for singleton pattern
     */
    private constructor() {
        this.servers.push({
            url: getOpenAPIBaseUrl(),
            description: "",
        })
    }

    /**
     * Returns the singleton instance.
     * @returns {OpenAPIGenerator} Singleton instance of OpenAPIGenerator
     */
    public static getInstance(): OpenAPIGenerator {
        if (!instance) {
            instance = new OpenAPIGenerator()
        }
        return instance
    }

    /**
     * Collects results when tests pass.
     * @param {TestResult} result Test result object
     */
    public collectTestResult(result: TestResult): void {
        this.testResults.push(result)
    }

    /**
     * Converts collected test results to OpenAPI Specification.
     * @returns {object} OpenAPI Specification object
     */
    public generateOpenAPISpec(): Record<string, unknown> {
        const groupedResults = this.groupTestResults()

        const paths = this.generatePaths(groupedResults)

        this.validatePathParameters(paths)

        return this.createFinalOpenAPIDocument(paths)
    }

    /**
     * Groups test results by path, method, and status code.
     * @returns {Map<string, Map<string, Map<string, TestResult[]>>>} Grouped test results
     */
    private groupTestResults(): Map<string, Map<string, Map<string, TestResult[]>>> {
        const groupedResults: Map<string, Map<string, Map<string, TestResult[]>>> = new Map()

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

        return groupedResults
    }

    /**
     * Generates path objects from grouped test results.
     * @param {Map<string, Map<string, Map<string, TestResult[]>>>} groupedResults Grouped test results
     * @returns {Record<string, Record<string, unknown>>} Path objects
     */
    private generatePaths(
        groupedResults: Map<string, Map<string, Map<string, TestResult[]>>>,
    ): Record<string, Record<string, unknown>> {
        const paths: Record<string, Record<string, unknown>> = {}

        for (const [path, methods] of groupedResults) {
            const normalizedPath = this.normalizePathTemplate(path)
            paths[normalizedPath] = {}

            for (const [method, statusCodes] of methods) {
                paths[normalizedPath][method] = this.generateOperationObject(
                    normalizedPath,
                    method,
                    statusCodes,
                )
            }
        }

        return paths
    }

    /**
     * Generates an operation object for a specific path and method.
     * @param {string} path Path
     * @param {string} method Method
     * @param {Map<string, TestResult[]>} statusCodes Status codes
     * @returns {Record<string, unknown>} Operation object
     */
    private generateOperationObject(
        path: string,
        method: string,
        statusCodes: Map<string, TestResult[]>,
    ): Record<string, unknown> {
        const operationObj: Record<string, unknown> = {}
        const responses: Record<string, unknown> = {}

        const representativeResult = this.selectRepresentativeResult(
            Array.from(statusCodes.values()).flat(),
        )

        operationObj.summary =
            representativeResult.options?.summary || `${method.toUpperCase()} ${path} request`

        if (representativeResult.options?.tag) {
            operationObj.tags = [representativeResult.options.tag]
        }

        if (representativeResult.options?.description) {
            operationObj.description = representativeResult.options.description
        }

        operationObj.operationId = this.utilityBuilder.generateOperationId(representativeResult)

        this.setRequestInformation(operationObj, representativeResult)

        this.processStatusCodes(statusCodes, responses)

        operationObj.responses = responses

        const security = this.operationBuilder.generateOperation(representativeResult).security

        const hasBearerAuth =
            security &&
            Array.isArray(security) &&
            security.length > 0 &&
            security.some((item) => Object.keys(item).length > 0)

        operationObj.security = hasBearerAuth ? security : this.defaultSecurity

        return operationObj
    }

    /**
     * Processes responses for each status code.
     * @param {Map<string, TestResult[]>} statusCodes Status codes
     * @param {Record<string, unknown>} responses Response object
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
     * Adds a response without content.
     * @param {Record<string, unknown>} responses Response object
     * @param {string} statusCode Status code
     * @param {TestResult} result Test result
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
     * Processes responses with content.
     * @param {Record<string, unknown>} responses Response object
     * @param {string} statusCode Status code
     * @param {TestResult[]} results Test results
     * @param {boolean} isErrorStatus Whether the status code is an error status
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
     * Creates combined content.
     * @param {TestResult[]} results Test results
     * @param {string} statusCode Status code
     * @param {boolean} isErrorStatus Whether the status code is an error status
     * @returns {Record<string, any>} Combined content
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
     * Creates a base schema.
     * @param {boolean} isErrorStatus Whether the status code is an error status
     * @returns {Record<string, any>} Base schema object
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
     * Processes each content type.
     * @param {Record<string, any>} combinedContent Combined content object
     * @param {Record<string, any>} resContent Response content
     * @param {TestResult} result Test result
     * @param {string} statusCode Status code
     * @param {Record<string, any>} baseSchema Base schema
     * @param {boolean} isErrorStatus Whether the status code is an error status
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
                result.testSuiteDescription ||
                (isErrorStatus ? "Error Response" : "Success Response")
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
     * Checks if the status code is No Content response.
     * @param {number} numericStatusCode Numeric status code
     * @returns {boolean} Whether the status code is No Content response
     */
    private isNoContentStatusCode(numericStatusCode: number): boolean {
        return numericStatusCode === 204 || numericStatusCode === 304 || numericStatusCode === 100
    }

    /**
     * Checks if the response body is empty.
     * @param {TestResult} result Test result object
     * @returns {boolean} Whether the response body is empty
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
     * Checks if the response body is explicitly defined in the test case.
     * @param {TestResult} result Test result object
     * @returns {boolean} Whether the response body is explicitly defined
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
     * Creates the final OpenAPI document.
     * @param {Record<string, Record<string, unknown>>} paths Paths
     * @returns {Record<string, unknown>} Final OpenAPI document
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
     * Creates the Components section.
     * @returns {Record<string, unknown>} Components section
     */
    private createComponentsSection(): Record<string, unknown> {
        const components: Record<string, unknown> = {}

        const securitySchemes = this.operationBuilder.getSecuritySchemes()
        if (Object.keys(securitySchemes).length > 0) {
            components.securitySchemes = securitySchemes
        }

        return components
    }

    /**
     * Selects the representative result from multiple test results.
     * @param {TestResult[]} results Test results array
     * @returns {TestResult} Representative test result
     */
    private selectRepresentativeResult(results: TestResult[]): TestResult {
        const authTestCase = results.find(
            (result) => result.request.headers && "authorization" in result.request.headers,
        )

        if (authTestCase) {
            logger.debug(`Selected representative test case: Authorization header exists`)
            return authTestCase
        }

        return results.reduce((best, current) => {
            const bestOptionsCount = Object.keys(best.options || {}).length
            const currentOptionsCount = Object.keys(current.options || {}).length
            return currentOptionsCount > bestOptionsCount ? current : best
        }, results[0])
    }

    /**
     * Sets request information for an operation.
     * @param {Record<string, unknown>} operation Operation object
     * @param {TestResult} result Test result
     */
    private setRequestInformation(operation: Record<string, unknown>, result: TestResult): void {
        const requestObj = this.operationBuilder.generateOperation(result)

        if (requestObj.parameters) {
            operation.parameters = requestObj.parameters
        }

        if (result.request?.body && requestObj.requestBody) {
            operation.requestBody = requestObj.requestBody
        }

        if (requestObj.security) {
            operation.security = requestObj.security
        }
    }

    /**
     * Validates and modifies path parameters.
     * @param {Record<string, Record<string, unknown>>} paths Path object
     */
    private validatePathParameters(paths: Record<string, Record<string, unknown>>): void {
        for (const [path, pathItem] of Object.entries(paths)) {
            const pathParams = this.extractPathParameterNames(path)

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
                            description: `${param} parameter`,
                        })
                    }
                }
            }
        }
    }

    /**
     * Converts colon-prefixed Express parameters to OpenAPI-compatible templates.
     * @param {string} path Raw route path
     * @returns {string} Normalized OpenAPI path
     */
    private normalizePathTemplate(path: string): string {
        return path.replace(/:([A-Za-z0-9_]+)/g, "{$1}")
    }

    /**
     * Extracts parameter names from a normalized or raw path template.
     * @param {string} path Path string potentially containing parameters
     * @returns {string[]} Parameter names
     */
    private extractPathParameterNames(path: string): string[] {
        const braceMatches = path.match(/\{([^}]+)\}/g) || []
        if (braceMatches.length > 0) {
            return braceMatches.map((param) => param.slice(1, -1))
        }

        const colonMatches = path.match(/:([^/]+)/g) || []
        return colonMatches.map((param) => param.slice(1))
    }

    /**
     * Normalizes examples according to the schema.
     * @param {any} example Example value
     * @param {Record<string, any>} schema Schema definition
     * @returns {any} Normalized example
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
