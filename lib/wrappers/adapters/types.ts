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

import type { CapturedResponse, CapturedRequest } from "../types"
export type { CapturedResponse, CapturedRequest }

/**
 * Builder interface for constructing HTTP requests
 * All adapters must implement this interface
 */
export interface RequestBuilder {
    send(body: any): this

    set(field: string, value: string): this
    set(fields: Record<string, string>): this

    query(params: Record<string, any>): this

    attach(field: string, file: string | Buffer, filename?: string): this
    field(name: string, value: string | number): this

    auth(username: string, password: string): this
    bearer(token: string): this

    timeout(ms: number): this

    expect(status: number): this
    expect(field: string, value: string | RegExp): this

    then<T = CapturedResponse>(
        onFulfilled?: (response: CapturedResponse) => T,
        onRejected?: (error: any) => any,
    ): Promise<T>

    end(): Promise<CapturedResponse>
}

/**
 * Main HTTP client interface
 * All HTTP method calls return RequestBuilder
 */
export interface HttpClient {
    get(url: string): RequestBuilder
    post(url: string): RequestBuilder
    put(url: string): RequestBuilder
    patch(url: string): RequestBuilder
    delete(url: string): RequestBuilder
    head(url: string): RequestBuilder
    options(url: string): RequestBuilder
}

/**
 * Adapter interface for creating HTTP clients
 */
export interface HttpAdapter<TConfig = any> {
    /**
     * Create a new HTTP client instance
     * @param config - Configuration (app instance, base URL, etc.)
     */
    create(config: TConfig): HttpClient
}
