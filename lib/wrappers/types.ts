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
 * API documentation metadata that can be attached to tests
 */
export interface ApiDocMetadata {
    summary?: string
    description?: string
    tags?: string[]
    deprecated?: boolean
    operationId?: string
}

/**
 * Captured HTTP request data
 */
export interface CapturedRequest {
    method?: string
    url?: string
    body?: any
    headers?: Record<string, string>
    queryParams?: Record<string, any>
    pathParams?: Record<string, any>
    formData?: {
        fields: Record<string, any>
        files: Array<{
            field: string
            filename: string
            mimetype?: string
        }>
    }
    response?: CapturedResponse
}

/**
 * Captured HTTP response data
 */
export interface CapturedResponse {
    status: number
    statusText?: string
    body?: any
    headers?: Record<string, string | string[]>
    text?: string
}

/**
 * Test function type
 */
export type TestFunction = () => void | Promise<void>

/**
 * Test framework's 'it' function type
 * Compatible with both Jest and Mocha
 * Using any for maximum compatibility across test frameworks
 */
export type ItFunction = (description: string, fn: any) => any

/**
 * Wrapped test function with metadata support
 */
export interface WrappedTestFunction {
    (description: string, testFn: TestFunction): void
    withMeta: (metadata: ApiDocMetadata) => (description: string, testFn: TestFunction) => void
}
