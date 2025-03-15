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
 * API 테스트를 위한 헬퍼 클래스와 타입 정의
 * @description
 * API 테스트를 쉽게 구성하고 실행할 수 있도록 도와주는 빌더 패턴 기반의 헬퍼 클래스입니다.
 */

import { HttpStatus } from "../enums"
import { DSLField } from "../interface"
import { FIELD_TYPES } from "../interface/field"

export type PATH_PARAM_TYPES = string | number
export type QUERY_PARAM_TYPES = string | number | boolean

export interface TestCaseConfig {
    pathParams?: Record<string, DSLField<PATH_PARAM_TYPES> | PATH_PARAM_TYPES>
    queryParams?: Record<string, DSLField<QUERY_PARAM_TYPES> | QUERY_PARAM_TYPES>
    requestBody?: Record<string, DSLField | FIELD_TYPES>
    requestHeaders?: Record<string, DSLField<string> | string>
    expectedStatus?: HttpStatus | number
    expectedResponseBody?: Record<string, DSLField>
    prettyPrint?: boolean
}
