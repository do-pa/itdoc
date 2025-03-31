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
import { OperationBuilder } from "./builders/operation"
import { Logger } from "./utils/Logger"

// 싱글톤 인스턴스를 저장할 변수
let instance: OpenAPIGenerator | null = null

interface OpenAPIInfo {
    title: string
    version: string
    description?: string
    license?: {
        name: string
        url: string
    }
}

/**
 * OpenAPI Specification 생성기
 */
export class OpenAPIGenerator implements IOpenAPIGenerator {
    private testResults: TestResult[] = []
    private title: string = "API Documentation"
    private version: string = "1.0.0"
    private description: string = ""
    private servers: Array<{ url: string; description?: string }> = []
    private defaultSecurity: Record<string, string[]>[] = [{}] // 기본값은 빈 보안 요구사항 (선택적 보안)
    private operationBuilder = new OperationBuilder()

    /**
     * 생성자 - 싱글톤 패턴을 위해 private으로 설정
     */
    private constructor() {
        // 기본 서버 설정
        this.servers.push({
            url: "/",
            description: "기본 서버",
        })
    }

    /**
     * 디버그 모드를 설정합니다.
     * @param {boolean} enable 디버그 모드 활성화 여부
     */
    public static setDebugMode(enable: boolean): void {
        Logger.setDebugMode(enable)
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
     * API 문서의 기본 정보를 설정합니다.
     * @param {object} options API 문서 기본 정보 옵션
     * @param options.title
     * @param options.version
     * @param options.description
     * @returns {OpenAPIGenerator} 메서드 체이닝을 위한 인스턴스
     */
    public setInfo(options: {
        title?: string
        version?: string
        description?: string
    }): OpenAPIGenerator {
        if (options.title) this.title = options.title
        if (options.version) this.version = options.version
        if (options.description) this.description = options.description
        return this
    }

    /**
     * API 서버 정보를 추가합니다.
     * @param {string} url 서버 URL
     * @param {string} description 서버 설명
     * @returns {OpenAPIGenerator} 메서드 체이닝을 위한 인스턴스
     */
    public addServer(url: string, description?: string): OpenAPIGenerator {
        this.servers.push({ url, description })
        return this
    }

    /**
     * 모든 API에 적용할 기본 보안 요구사항을 설정합니다.
     * @param {string} scheme 보안 스키마 이름
     * @param {string[]} scopes 스코프 목록 (OAuth2의 경우)
     * @returns {OpenAPIGenerator} 메서드 체이닝을 위한 인스턴스
     */
    public setDefaultSecurity(scheme: string, scopes: string[] = []): OpenAPIGenerator {
        if (!scheme) {
            // 빈 보안 요구사항 (선택적 보안)
            this.defaultSecurity = [{}]
        } else {
            this.defaultSecurity = [{ [scheme]: scopes }]
        }
        return this
    }

    /**
     * 테스트가 통과했을 때 결과를 수집합니다.
     * @param {TestResult} result 테스트 결과 객체
     */
    public collectTestResult(result: TestResult): void {
        Logger.debug("테스트 결과 수집:", result)
        this.testResults.push(result)
    }

    /**
     * 수집된 테스트 결과를 OpenAPI Specification으로 변환합니다.
     * @returns {object} OpenAPI Specification 객체
     */
    public generateOpenAPISpec(): Record<string, unknown> {
        Logger.debug("OpenAPI 스펙 생성 시작")

        const paths: Record<string, Record<string, unknown>> = {}

        for (const result of this.testResults) {
            const path = result.url
            const method = result.method.toLowerCase()

            if (!paths[path]) {
                paths[path] = {}
            }

            paths[path][method] = this.operationBuilder.generateOperation(result)
        }

        // 경로 파라미터 검증 및 수정
        this.validatePathParameters(paths)

        // OpenAPI info 객체 생성
        const info: OpenAPIInfo = {
            title: this.title,
            version: this.version,
            license: {
                name: "Apache 2.0",
                url: "https://www.apache.org/licenses/LICENSE-2.0.html",
            },
        }

        // 설명이 있는 경우에만 추가
        if (this.description) {
            info.description = this.description
        }

        // 최종 OpenAPI 문서 생성
        const openApiSpec: Record<string, unknown> = {
            openapi: "3.0.0",
            info,
            servers: this.servers,
            paths,
        }

        // components 섹션 생성
        const components: Record<string, unknown> = {}

        // 보안 스키마가 있으면 추가
        const securitySchemes = this.operationBuilder.getSecuritySchemes()
        if (Object.keys(securitySchemes).length > 0) {
            components.securitySchemes = securitySchemes
        }

        // components 섹션에 내용이 있으면 추가
        if (Object.keys(components).length > 0) {
            openApiSpec.components = components
        }

        // 기본 보안 요구사항이 있으면 추가
        if (this.defaultSecurity.length > 0) {
            openApiSpec.security = this.defaultSecurity
        }

        // 각 경로의 오퍼레이션에 보안 정의가 없는 경우 기본 보안 정의 추가
        this.ensureSecurityDefinitions(paths, this.defaultSecurity)

        return openApiSpec
    }

    /**
     * 모든 오퍼레이션에 보안 정의가 있는지 확인하고 없으면 기본값 추가
     * @param paths 경로 객체
     * @param defaultSecurity 기본 보안 요구사항
     */
    private ensureSecurityDefinitions(
        paths: Record<string, Record<string, unknown>>,
        defaultSecurity: Record<string, string[]>[],
    ): void {
        for (const pathItem of Object.values(paths)) {
            for (const [, operation] of Object.entries(pathItem)) {
                const op = operation as Record<string, unknown>

                if (!op.security) {
                    op.security = defaultSecurity
                }
            }
        }
    }

    /**
     * 경로 파라미터가 올바르게 정의되었는지 확인하고 수정합니다.
     * @param {Record<string, Record<string, unknown>>} paths 경로 객체
     */
    private validatePathParameters(paths: Record<string, Record<string, unknown>>): void {
        for (const [path, pathItem] of Object.entries(paths)) {
            // 경로에서 파라미터 추출 (예: /users/{userId}/items/{itemId})
            const pathParamMatches = path.match(/\{([^}]+)\}/g) || []
            const pathParams = pathParamMatches.map((param) => param.slice(1, -1)) // '{userId}' -> 'userId'

            if (pathParams.length === 0) continue

            // 각 오퍼레이션에 대해 경로 파라미터가 정의되었는지 확인
            for (const [, operation] of Object.entries(pathItem)) {
                const op = operation as Record<string, unknown>

                // 파라미터가 없으면 생성
                if (!op.parameters) {
                    op.parameters = []
                }

                const parameters = op.parameters as Array<Record<string, unknown>>
                const definedPathParams = new Set(
                    parameters.filter((param) => param.in === "path").map((param) => param.name),
                )

                // 누락된 경로 파라미터 추가
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
}
