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

import { SupertestAdapter } from "./supertest/SupertestAdapter"
import { AxiosAdapter, AxiosAdapterConfig } from "./axios/AxiosAdapter"
import { FetchAdapter, FetchAdapterConfig } from "./fetch/FetchAdapter"
import { HttpClient } from "./types"

/**
 * Factory for creating HTTP clients with different adapters
 *
 * This allows you to use different HTTP clients (supertest, axios, fetch)
 * while maintaining the same API and automatic request/response capture.
 * @example Supertest
 * ```typescript
 * const client = createClient.supertest(app)
 * await client.post('/api/users').send({ name: 'John' })
 * ```
 * @example Axios
 * ```typescript
 * const client = createClient.axios({ baseURL: 'http://localhost:3000' })
 * await client.post('/api/users').send({ name: 'John' })
 * ```
 * @example Fetch
 * ```typescript
 * const client = createClient.fetch({ baseURL: 'http://localhost:3000' })
 * await client.post('/api/users').send({ name: 'John' })
 * ```
 */
export const createClient = {
    /**
     * Create a client using supertest (for Express/Fastify/NestJS apps)
     * @param app - Express/Fastify app instance
     * @returns HTTP client with automatic capture
     */
    supertest(app: any): HttpClient {
        return new SupertestAdapter().create(app)
    },

    /**
     * Create a client using axios
     * @param config - Axios configuration (baseURL, headers, etc.)
     * @returns HTTP client with automatic capture
     */
    axios(config: AxiosAdapterConfig): HttpClient {
        return new AxiosAdapter().create(config)
    },

    /**
     * Create a client using fetch API
     * @param config - Fetch configuration (baseURL, headers)
     * @returns HTTP client with automatic capture
     */
    fetch(config: FetchAdapterConfig): HttpClient {
        return new FetchAdapter().create(config)
    },
}

/**
 * Backward compatibility: keep `request` as alias to `createClient.supertest`
 * @param app
 * @deprecated Use createClient.supertest() instead
 */
export function request(app: any): HttpClient {
    return createClient.supertest(app)
}

// Export types
export type * from "./types"
export { SupertestAdapter } from "./supertest/SupertestAdapter"
export { AxiosAdapter } from "./axios/AxiosAdapter"
export type { AxiosAdapterConfig } from "./axios/AxiosAdapter"
export { FetchAdapter } from "./fetch/FetchAdapter"
export type { FetchAdapterConfig } from "./fetch/FetchAdapter"
