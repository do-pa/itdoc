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
 * Class that generates schema for object values
 */
export class ObjectSchemaGenerator extends BaseSchemaGenerator {
    private factory: SchemaFactory

    /**
     * Constructor
     * @param {SchemaFactory} factory Schema factory
     */
    public constructor(factory: SchemaFactory) {
        super()
        this.factory = factory
    }

    /**
     * Generates schema from object values.
     * @param {unknown} value Object value
     * @param {boolean} includeExample Whether to include example in schema (default: true)
     * @returns {Record<string, unknown>} Generated schema
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
