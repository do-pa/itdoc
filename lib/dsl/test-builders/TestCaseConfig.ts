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

import { HttpStatus } from "../enums"
import { DSLField } from "../interface"
import { FIELD_TYPES } from "../interface/field"
import { ApiDocOptions } from "../interface"

export type PATH_PARAM_TYPES = string | number
export type QUERY_PARAM_TYPES = string | number | boolean

/**
 * 각 testcase 마다 설정하는 설정값을 정의합니다.
 */
export interface TestCaseConfig {
    /**
     * API 문서화를 위한 옵션
     */
    apiOptions?: ApiDocOptions
    pathParams?: Record<string, DSLField<PATH_PARAM_TYPES> | PATH_PARAM_TYPES>
    queryParams?: Record<string, DSLField<QUERY_PARAM_TYPES> | QUERY_PARAM_TYPES>
    requestBody?: Record<string, DSLField | FIELD_TYPES>
    requestHeaders?: Record<string, DSLField<string> | string>
    expectedStatus?: HttpStatus | number
    expectedResponseBody?: Record<string, DSLField>
    expectedResponseHeaders?: Record<string, DSLField<string> | string>
    prettyPrint?: boolean
}
