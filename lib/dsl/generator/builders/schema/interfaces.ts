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
 * Schema generation interface
 */
export interface SchemaGenerator {
    /**
     * Generates schema from value.
     * @param value Value to generate schema from
     * @param includeExample Whether to include example field in schema
     * @returns Generated schema
     */
    generateSchema(value: unknown, includeExample?: boolean): Record<string, unknown>
}

/**
 * Schema factory interface
 */
export interface SchemaFactory {
    /**
     * Selects appropriate schema generator based on value type and generates schema.
     * @param value Value to generate schema from
     * @param includeExample Whether to include example in schema (default: true)
     * @returns Generated schema
     */
    createSchema(value: unknown, includeExample?: boolean): unknown

    /**
     * Registers generator according to schema type.
     * @param type Value type
     * @param generator Schema generator instance
     */
    registerGenerator(type: string, generator: SchemaGenerator): void
}
