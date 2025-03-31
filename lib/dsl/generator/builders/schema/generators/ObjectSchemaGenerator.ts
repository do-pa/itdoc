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
import { isDSLField } from "../../../../interface/field"
import { BaseSchemaGenerator } from "../BaseSchemaGenerator"
import { SchemaFactory } from "../interfaces"

/**
 * 객체 값의 스키마를 생성하는 클래스
 */
export class ObjectSchemaGenerator extends BaseSchemaGenerator {
    private schemaFactory: SchemaFactory

    /**
     * 생성자
     * @param schemaFactory 스키마 팩토리
     */
    public constructor(schemaFactory: SchemaFactory) {
        super()
        this.schemaFactory = schemaFactory
    }

    /**
     * 객체 값으로부터 스키마를 생성합니다.
     * @param value 객체 값
     * @returns 생성된 객체 스키마
     */
    public generateSchema(value: object): Record<string, unknown> {
        Logger.debug("ObjectSchemaGenerator.generateSchema called with:", value)

        const result = this.buildPropertiesWithRequired(value)
        const properties = result.properties
        const required = result.required

        const schema: Record<string, unknown> = {
            type: "object",
            properties,
        }

        if (required.length > 0) {
            schema.required = required
        }

        return schema
    }

    /**
     * 객체의 프로퍼티와 필수 필드 목록을 생성합니다.
     * @param obj 대상 객체
     * @returns properties와 required 배열을 포함한 객체
     */
    private buildPropertiesWithRequired(obj: object): {
        properties: Record<string, unknown>
        required: string[]
    } {
        const properties: Record<string, unknown> = {}
        const required: string[] = []

        for (const [key, value] of Object.entries(obj)) {
            if (isDSLField(value)) {
                properties[key] = this.schemaFactory.createSchema(value)

                if (value.required) {
                    required.push(key)
                }
            } else {
                properties[key] = this.schemaFactory.createSchema(value)

                if (value !== undefined && value !== null) {
                    required.push(key)
                }
            }
        }

        return { properties, required }
    }
}
