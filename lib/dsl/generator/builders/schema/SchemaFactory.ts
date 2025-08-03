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

import { SchemaGenerator, SchemaFactory as ISchemaFactory } from "./interfaces"
import { StringSchemaGenerator } from "./generators/StringSchemaGenerator"
import { NumberSchemaGenerator } from "./generators/NumberSchemaGenerator"
import { BooleanSchemaGenerator } from "./generators/BooleanSchemaGenerator"
import { ArraySchemaGenerator } from "./generators/ArraySchemaGenerator"
import { ObjectSchemaGenerator } from "./generators/ObjectSchemaGenerator"
import { DSLFieldSchemaGenerator } from "./generators/DSLFieldSchemaGenerator"
import { isDSLField } from "../../../interface/field"

/**
 * Schema generator factory class
 * Selects appropriate schema generator based on type to generate schema.
 */
export class SchemaFactory implements ISchemaFactory {
    private generators: Record<string, SchemaGenerator> = {}

    /**
     * Factory constructor
     * Registers default schema generators.
     */
    public constructor() {
        this.registerDefaultGenerators()
    }

    /**
     * Registers default schema generators.
     */
    private registerDefaultGenerators(): void {
        this.generators["string"] = new StringSchemaGenerator()
        this.generators["number"] = new NumberSchemaGenerator()
        this.generators["boolean"] = new BooleanSchemaGenerator()
        this.generators["array"] = new ArraySchemaGenerator(this)
        this.generators["object"] = new ObjectSchemaGenerator(this)
        this.generators["dslfield"] = new DSLFieldSchemaGenerator(this)
    }

    /**
     * Registers generator according to schema type.
     * @param type Value type
     * @param generator Schema generator instance
     */
    public registerGenerator(type: string, generator: SchemaGenerator): void {
        this.generators[type] = generator
    }

    /**
     * Selects appropriate schema generator based on value type and generates schema.
     * @param value Value to generate schema from
     * @param includeExample Whether to include example in schema (default: true)
     * @returns Generated OpenAPI schema
     */
    public createSchema(value: unknown, includeExample: boolean = true): unknown {
        if (value === undefined || value === null) {
            return { type: "object" }
        }

        // DSL 필드 처리
        if (isDSLField(value)) {
            return this.generators["dslfield"].generateSchema(value, includeExample)
        }

        // 배열 처리
        if (Array.isArray(value)) {
            return this.generators["array"].generateSchema(value, includeExample)
        }

        // 객체 처리
        if (typeof value === "object") {
            return this.generators["object"].generateSchema(value, includeExample)
        }

        // 기본 타입 처리 (문자열, 숫자, 불리언)
        const type = typeof value
        if (this.generators[type]) {
            return this.generators[type].generateSchema(value, includeExample)
        }

        // 알 수 없는 타입인 경우
        return { type: "string" }
    }
}
