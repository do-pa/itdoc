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

/**
 * OpenAPI 타입 정의
 */

// 미디어 타입 객체
export interface MediaTypeObject {
    schema?: Record<string, any>
    example?: any
    examples?: ExamplesObject
}

// 예제 객체
export interface ExamplesObject {
    [name: string]: any
}

// 콘텐트 객체
export interface Content {
    [mediaType: string]: MediaTypeObject
}

// 파라미터 객체
export interface ParameterObject {
    name: string
    in: string // "query", "header", "path", "cookie"
    description?: string
    required?: boolean
    schema?: Record<string, any>
    example?: any
}

// 헤더 객체
export interface HeaderObject {
    description?: string
    schema?: Record<string, any>
    example?: any
}

// 요청 본문 객체
export interface RequestBodyObject {
    description?: string
    content: Content
    required?: boolean
}

// 응답 객체
export interface ResponseObject {
    description: string
    headers?: Record<string, HeaderObject>
    content?: Content
}

// 보안 스키마 타입
export type SecuritySchemeType = "apiKey" | "http" | "oauth2" | "openIdConnect"

// 보안 스키마 객체
export interface SecuritySchemeObject {
    type: SecuritySchemeType
    description?: string
    name?: string
    in?: string
    scheme?: string
    bearerFormat?: string
    flows?: any
    openIdConnectUrl?: string
}
