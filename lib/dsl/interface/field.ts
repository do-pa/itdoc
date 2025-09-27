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

export type FIELD_TYPES =
    | string
    | number
    | boolean
    | object
    | null
    | Record<string, string | number | boolean | object | null | DSLField>
    | FIELD_TYPES[]

/**
 * DSL Field interface
 * - example can be a value or value validation function.
 */
export interface DSLField<T extends FIELD_TYPES = FIELD_TYPES> {
    readonly description: string
    readonly example: T | ((value: T) => void)
    readonly required: boolean
}

export interface DSLRequestFile {
    file: { path?: string; buffer?: Buffer; stream?: NodeJS.ReadableStream }
    opts: { contentType: string; filename?: string }
}

/**
 * DSL Helper Functions
 * - DSL Field creation function
 * @param {string} description  Field description to be displayed in documentation
 * @param {T | (value: T) => void} example  Example value, or a validator that receives the value
 * @param {boolean} required Whether the field is required
 * @returns {DSLField<FIELD_TYPES>} DSL Field interface
 */
export function field<T extends FIELD_TYPES>(
    description: string,
    example: T | ((value: T) => void),
    required: boolean = true,
): DSLField<FIELD_TYPES> {
    return { description, example, required } as DSLField<FIELD_TYPES>
}

/**
 * DSL Field type guard
 * @description
 * @param obj
 * Checks if the value is of DSL Field type.
 * @returns {boolean} Whether it is a DSL Field
 */
export const isDSLField = (obj: any): obj is DSLField<any> =>
    obj && typeof obj === "object" && "example" in obj && "description" in obj
