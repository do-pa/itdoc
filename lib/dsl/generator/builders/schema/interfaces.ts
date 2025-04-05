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
 * 스키마 생성 인터페이스
 */
export interface SchemaGenerator {
    /**
     * 값으로부터 스키마를 생성합니다.
     * @param value 스키마를 생성할 값
     * @param includeExample 스키마에 example 필드 포함 여부
     * @returns 생성된 스키마
     */
    generateSchema(value: unknown, includeExample?: boolean): Record<string, unknown>
}

/**
 * 스키마 팩토리 인터페이스
 */
export interface SchemaFactory {
    /**
     * 값의 타입에 따라 적절한 스키마 제너레이터를 선택하여 스키마를 생성합니다.
     * @param value 스키마를 생성할 값
     * @param includeExample 스키마에 example 포함 여부 (기본값: true)
     * @returns 생성된 스키마
     */
    createSchema(value: unknown, includeExample?: boolean): unknown

    /**
     * 스키마 타입에 따른 제너레이터를 등록합니다.
     * @param type 값의 타입
     * @param generator 스키마 제너레이터 인스턴스
     */
    registerGenerator(type: string, generator: SchemaGenerator): void
}
