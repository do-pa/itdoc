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

import { BaseSchemaGenerator } from "../BaseSchemaGenerator"
import { SchemaFactory } from "../interfaces"
import { DSLField, FIELD_TYPES } from "../../../../interface/field"

/**
 * Generator that creates schema from DSL fields
 */
export class DSLFieldSchemaGenerator extends BaseSchemaGenerator {
    private factory: SchemaFactory

    /**
     * Constructor
     * @param factory Schema factory instance
     */
    public constructor(factory: SchemaFactory) {
        super()
        this.factory = factory
    }

    /**
     * Generates schema from DSL fields.
     * @param value DSL field object
     * @param includeExample Whether to include example in schema (default: true)
     * @returns Generated schema
     */
    public generateSchema(value: unknown, includeExample: boolean = true): Record<string, unknown> {
        const field = value as DSLField<FIELD_TYPES>

        const schema = this.factory.createSchema(field.example) as Record<string, unknown>

        this.enrichSchemaWithMetadata(schema, field, includeExample)

        return schema
    }

    /**
     * Enriches schema with field metadata.
     * @param schema Schema to enrich
     * @param field DSL field
     * @param includeExample Whether to include example field
     */
    private enrichSchemaWithMetadata(
        schema: Record<string, unknown>,
        field: DSLField<FIELD_TYPES>,
        includeExample: boolean = true,
    ): void {
        if (field.description) {
            schema.description = field.description
        }

        if (includeExample && field.example !== undefined && typeof field.example !== "function") {
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
