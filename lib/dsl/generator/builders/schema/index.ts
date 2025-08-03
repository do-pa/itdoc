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

// Export interfaces and base classes
export * from "./interfaces"
export * from "./constants"
export * from "./BaseSchemaGenerator"

// Export schema generators
export * from "./generators/StringSchemaGenerator"
export * from "./generators/NumberSchemaGenerator"
export * from "./generators/BooleanSchemaGenerator"
export * from "./generators/ArraySchemaGenerator"
export * from "./generators/ObjectSchemaGenerator"
export * from "./generators/DSLFieldSchemaGenerator"

// Export factory
export { SchemaFactory } from "./SchemaFactory"

/**
 * Builder class responsible for OpenAPI schema generation
 */
export class SchemaBuilder {
    private static schemaFactory: SchemaFactory = new SchemaFactory()

    /**
     * Infers schema from value.
     * @param value Value to generate schema from
     * @param includeExample Whether to include example in schema (default: true)
     * @returns Generated OpenAPI schema
     */
    public static inferSchema(value: unknown, includeExample: boolean = true): unknown {
        return this.schemaFactory.createSchema(value, includeExample)
    }

    /**
     * Registers generator according to schema type.
     * @param type Value type
     * @param generator Schema generator instance
     */
    public static registerGenerator(type: string, generator: SchemaGenerator): void {
        this.schemaFactory.registerGenerator(type, generator)
    }
}
