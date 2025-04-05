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

import { SchemaFactory } from "./SchemaFactory"
import { SchemaGenerator } from "./interfaces"

// 인터페이스 및 기본 클래스 내보내기
export * from "./interfaces"
export * from "./constants"
export * from "./BaseSchemaGenerator"

// 스키마 생성기 내보내기
export * from "./generators/StringSchemaGenerator"
export * from "./generators/NumberSchemaGenerator"
export * from "./generators/BooleanSchemaGenerator"
export * from "./generators/ArraySchemaGenerator"
export * from "./generators/ObjectSchemaGenerator"
export * from "./generators/DSLFieldSchemaGenerator"

// 팩토리 내보내기
export { SchemaFactory } from "./SchemaFactory"

/**
 * OpenAPI 스키마 생성을 담당하는 빌더 클래스
 */
export class SchemaBuilder {
    private static schemaFactory: SchemaFactory = new SchemaFactory()

    /**
     * 값으로부터 스키마를 추론합니다.
     * @param value 스키마를 생성할 값
     * @param includeExample 스키마에 example 포함 여부 (기본값: true)
     * @returns 생성된 OpenAPI 스키마
     */
    public static inferSchema(value: unknown, includeExample: boolean = true): unknown {
        return this.schemaFactory.createSchema(value, includeExample)
    }

    /**
     * 스키마 타입에 따른 제너레이터를 등록합니다.
     * @param type 값의 타입
     * @param generator 스키마 제너레이터 인스턴스
     */
    public static registerGenerator(type: string, generator: SchemaGenerator): void {
        this.schemaFactory.registerGenerator(type, generator)
    }
}
