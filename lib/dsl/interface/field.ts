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

export type FIELD_TYPES =
    | string
    | number
    | boolean
    | object
    | Record<string, string | number | boolean | object | DSLField>
    | FIELD_TYPES[]

/**
 * DSL Field 인터페이스
 * - example은 값 또는 값 검증 함수일 수 있습니다.
 */
export interface DSLField<T extends FIELD_TYPES = FIELD_TYPES> {
    readonly description: string
    readonly example: T | ((value: T) => void)
    readonly required: boolean
}

/**
 * DSL Helper Functions
 * - DSLField 생성 함수
 * @param description {string} 문서에 표시될 필드 설명
 * @param example {object | function} 필드의 예시 값 또는 검증 함수
 * @param required {boolean} 필드가 필수인지 여부
 * @returns {DSLField} DSL Field 인터페이스
 */
export function field<T extends FIELD_TYPES>(
    description: string,
    example: T | ((value: T) => void),
    required: boolean = true,
): DSLField<FIELD_TYPES> {
    return { description, example, required } as DSLField<FIELD_TYPES>
}

/**
 * DSL Field 타입 가드
 * @description
 * @param obj
 * 값이 DSL Field 타입인지 확인합니다.
 * @returns {boolean} DSL Field 여부
 */
export const isDSLField = (obj: any): obj is DSLField<any> =>
    obj && typeof obj === "object" && "example" in obj && "description" in obj
