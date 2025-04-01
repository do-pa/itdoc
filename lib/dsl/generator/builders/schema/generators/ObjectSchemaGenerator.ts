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

import { isDSLField } from "../../../../interface/field"
import { BaseSchemaGenerator } from "../BaseSchemaGenerator"
import { SchemaFactory } from "../interfaces"

/**
 * 객체 값의 스키마를 생성하는 클래스
 */
export class ObjectSchemaGenerator extends BaseSchemaGenerator {
    private factory: SchemaFactory

    /**
     * 생성자
     * @param factory 스키마 팩토리
     */
    public constructor(factory: SchemaFactory) {
        super()
        this.factory = factory
    }

    /**
     * 객체 값으로부터 스키마를 생성합니다.
     * @param value 객체 값
     * @param includeExample 스키마에 example 포함 여부 (기본값: true)
     * @returns 생성된 스키마
     */
    public generateSchema(value: unknown, includeExample: boolean = true): Record<string, unknown> {
        const obj = value as Record<string, unknown>

        const properties: Record<string, unknown> = {}
        const required: string[] = []

        for (const [propName, propValue] of Object.entries(obj)) {
            if (propValue === undefined) continue

            if (isDSLField(propValue) && propValue.required) {
                required.push(propName)
            }

            properties[propName] = this.factory.createSchema(propValue, includeExample)
        }

        const schema: Record<string, unknown> = {
            type: "object",
        }

        if (Object.keys(properties).length > 0) {
            schema.properties = properties
        }

        if (required.length > 0) {
            schema.required = required
        }

        return schema
    }
}
