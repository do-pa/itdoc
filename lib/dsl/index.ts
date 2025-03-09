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
 * itdoc - Test-driven API Documentation Generator
 * @description
 * API 테스트 코드를 기반으로 문서를 자동 생성하는 라이브러리입니다.
 * @example
 * ```typescript
 * import { describeAPI, itDoc, HttpMethod } from 'itdoc';
 *
 * describeAPI('User API', () => {
 *   itDoc('should create a user')
 *     .method(HttpMethod.POST)
 *     .path("/users")
 *     .expect(201);
 * });
 * ```
 */

export { HttpMethod } from "./enums/HttpMethod"
export { HttpStatus } from "./enums/HttpStatus"
export { describeAPI, itDoc, field } from "./interface"
export type { ApiDocOptions } from "./interface/ItdocBuilderEntry"
