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

/**
 * Class that generates schema for array values
 */
export class ArraySchemaGenerator extends BaseSchemaGenerator {
    private schemaFactory: SchemaFactory

    /**
     * Constructor
     * @param schemaFactory Schema factory
     */
    public constructor(schemaFactory: SchemaFactory) {
        super()
        this.schemaFactory = schemaFactory
    }

    /**
     * Generates schema from array values.
     * @param value Array value
     * @param includeExample Whether to include example in schema (default: true)
     * @returns Generated schema
     */
    public generateSchema(value: unknown, includeExample: boolean = true): Record<string, unknown> {
        const array = value as unknown[]

        if (array.length === 0) {
            return {
                type: "array",
                items: { type: "string" },
            }
        }

        const itemSchema = this.schemaFactory.createSchema(array[0], includeExample)

        const result: Record<string, unknown> = {
            type: "array",
            items: itemSchema,
        }

        return result
    }
}
