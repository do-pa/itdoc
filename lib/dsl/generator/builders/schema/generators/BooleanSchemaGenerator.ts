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

/**
 * Class that generates schema for boolean values
 */
export class BooleanSchemaGenerator extends BaseSchemaGenerator {
    /**
     * Generates schema from boolean values.
     * @param value Boolean value
     * @param includeExample Whether to include example in schema (default: true)
     * @returns Generated schema
     */
    public generateSchema(value: unknown, includeExample: boolean = true): Record<string, unknown> {
        // Return default boolean schema if not a boolean value
        if (typeof value !== "boolean") {
            return { type: "boolean" }
        }

        const schema: Record<string, unknown> = {
            type: "boolean",
        }

        // Set example value (optional)
        if (includeExample) {
            schema.example = value
        }

        return schema
    }
}
