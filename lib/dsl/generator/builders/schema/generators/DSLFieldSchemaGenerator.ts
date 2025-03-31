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

import { Logger } from "../../../utils/Logger"
import { BaseSchemaGenerator } from "../BaseSchemaGenerator"
import { SchemaFactory } from "../interfaces"
import { DSLField, FIELD_TYPES } from "../../../../interface/field"

/**
 * DSL 필드로부터 스키마를 생성하는 제너레이터
 */
export class DSLFieldSchemaGenerator extends BaseSchemaGenerator {
    private factory: SchemaFactory

    /**
     * 생성자
     * @param factory 스키마 팩토리 인스턴스
     */
    public constructor(factory: SchemaFactory) {
        super()
        this.factory = factory
    }

    /**
     * DSL 필드로부터 스키마를 생성합니다.
     * @param value DSL 필드 객체
     * @returns 생성된 스키마
     */
    public generateSchema(value: unknown): Record<string, unknown> {
        Logger.debug("DSL 필드 스키마 생성 시작")
        const field = value as DSLField<FIELD_TYPES>

        const schema = this.factory.createSchema(field.example) as Record<string, unknown>

        this.enrichSchemaWithMetadata(schema, field)

        return schema
    }

    /**
     * 필드의 메타데이터로 스키마를 보강합니다.
     * @param schema 보강할 스키마
     * @param field DSL 필드
     */
    private enrichSchemaWithMetadata(
        schema: Record<string, unknown>,
        field: DSLField<FIELD_TYPES>,
    ): void {
        if (field.description) {
            schema.description = field.description
        }

        if (field.example !== undefined && typeof field.example !== "function") {
            schema.example = field.example
        }

        const extendedField = field as any

        if (extendedField.format) {
            schema.format = extendedField.format
        }

        if (extendedField.enum) {
            schema.enum = extendedField.enum
        }

        if (extendedField.pattern) {
            schema.pattern = extendedField.pattern
        }
    }
}
