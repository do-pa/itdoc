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

import { TestResult } from "../../types/TestResult"
import { UtilityBuilderInterface } from "./interfaces"
import { isDSLField } from "../../../interface/field"

/**
 * OpenAPI Operation utility function class
 */
export class UtilityBuilder implements UtilityBuilderInterface {
    /**
     * Generates operationId from test results.
     * @param result Test result
     * @returns Generated operationId
     */
    public generateOperationId(result: TestResult): string {
        const method = result.method.toLowerCase()
        const pathSegments = result.url.split("/").filter(Boolean)
        const processedSegments = pathSegments.map((segment) => {
            if (segment.startsWith(":")) {
                const paramName = segment.slice(1) // String after ":"
                return "By" + paramName.charAt(0).toUpperCase() + paramName.slice(1)
            }
            return segment
        })

        let path = processedSegments
            .map((segment, index) => {
                if (index === 0) {
                    return segment.toLowerCase()
                }
                return segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase()
            })
            .join("")

        if (!path) {
            path = "root"
        }

        return `${method}${path.charAt(0).toUpperCase() + path.slice(1)}`
    }

    /**
     * Generates default tag from path.
     * @param path API path
     * @returns Default tag
     */
    public generateDefaultTag(path: string): string {
        const firstSegment = path.split("/").filter(Boolean)[0]
        return firstSegment
            ? firstSegment.charAt(0).toUpperCase() + firstSegment.slice(1)
            : "Default"
    }

    /**
     * Extracts actual example values from nested DSL fields.
     * @param value Value
     * @returns Extracted simple example value
     */
    public extractSimpleExampleValue(value: any): any {
        if (isDSLField(value)) {
            // Process recursively if the example value of DSL field is another DSL field
            if (isDSLField(value.example)) {
                return this.extractSimpleExampleValue(value.example)
            }
            return value.example
        } else if (Array.isArray(value)) {
            return value.map((item) => this.extractSimpleExampleValue(item))
        } else if (value !== null && typeof value === "object") {
            const result: Record<string, any> = {}
            for (const [key, val] of Object.entries(value)) {
                result[key] = this.extractSimpleExampleValue(val)
            }
            return result
        }
        return value
    }
}
