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
 * OpenAPI type definitions
 */

// Media type object
export interface MediaTypeObject {
    schema?: Record<string, any>
    example?: any
    examples?: ExamplesObject
}

// Example object
export interface ExamplesObject {
    [name: string]: any
}

// Content object
export interface Content {
    [mediaType: string]: MediaTypeObject
}

// Parameter object
export interface ParameterObject {
    name: string
    in: string // "query", "header", "path", "cookie"
    description?: string
    required?: boolean
    schema?: Record<string, any>
    example?: any
}

// Header object
export interface HeaderObject {
    description?: string
    schema?: Record<string, any>
    example?: any
}

// Request body object
export interface RequestBodyObject {
    description?: string
    content: Content
    required?: boolean
}

// Response object
export interface ResponseObject {
    description?: string
    headers?: Record<string, HeaderObject>
    content?: Content
}

// Security scheme type
export type SecuritySchemeType = "apiKey" | "http" | "oauth2" | "openIdConnect"

// Security scheme object
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
