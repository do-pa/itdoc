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
 * Wrapper-based API testing module
 *
 * This module provides a high-order function approach to automatically capture
 * HTTP requests and responses from your tests and generate API documentation.
 *
 * @example Basic usage
 * ```typescript
 * import { wrapTest, request } from 'itdoc/wrappers'
 *
 * const apiTest = wrapTest(it)
 *
 * describe('User API', () => {
 *   apiTest('should create user', async () => {
 *     const response = await request(app)
 *       .post('/users')
 *       .send({ name: 'John' })
 *
 *     expect(response.status).toBe(201)
 *   })
 * })
 * ```
 *
 * @example With metadata
 * ```typescript
 * apiTest.withMeta({
 *   summary: 'Create User',
 *   tags: ['Users', 'Registration']
 * })('should create user', async () => {
 *   const response = await request(app)
 *     .post('/users')
 *     .send({ name: 'John' })
 *
 *   expect(response.status).toBe(201)
 * })
 * ```
 */

export { wrapTest } from "./wrapTest"
export { request } from "./core/interceptedRequest"
export type { ApiDocMetadata, WrappedTestFunction, TestFunction } from "./types"
