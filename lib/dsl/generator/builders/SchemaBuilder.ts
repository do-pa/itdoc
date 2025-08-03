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

import { SchemaFactory } from "./schema"
import logger from "../../../config/logger"

/**
 * Builder class for creating OpenAPI Schema objects
 * This class abstracts complex schema generation logic to enable users to easily create schemas.
 */
export class SchemaBuilder {
    private schemaFactory = new SchemaFactory()

    /**
     * Generates OpenAPI Schema for the given value.
     * Selects and uses appropriate schema generator based on the value type.
     * @param value Value to generate schema from (object, array, primitive values, etc.)
     * @returns Generated OpenAPI Schema object
     */
    public createSchema(value: unknown): Record<string, unknown> {
        try {
            const schema = this.schemaFactory.createSchema(value)
            return schema as Record<string, unknown>
        } catch (error) {
            logger.error("Error occurred during schema generation:", error)
            // Return default schema when error occurs
            return { type: "object", description: "Schema generation failed" }
        }
    }
}

// Export schema-related types and interfaces
export * from "./schema"
