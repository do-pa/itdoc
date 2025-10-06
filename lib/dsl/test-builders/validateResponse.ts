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

import { isDSLField } from "../interface/field"

/**
 * Function that performs validation when the expected response is a field.
 * @param {any} expectedDSL Expected DSL field
 * @param {any} actualVal Actual response value
 * @param {string} path Current path being validated (used in recursive calls)
 * @throws {Error} Throws an error when validation fails.
 * @see {@link import('../interface/field.ts').field}
 */
const validateDSLField = (expectedDSL: any, actualVal: any, path: string): void => {
    const example = expectedDSL.example
    if (example === undefined) {
        throw new Error(
            `The example value of the DSL field at response body[${path}] is undefined. Skipping validation for this field.`,
        )
    }

    // Handle a DSL field whose example is a function.
    if (typeof expectedDSL.example === "function") {
        validateFunction(expectedDSL.example, actualVal)
        return
    }

    // Handle a DSL field whose example is an object.
    if (example && typeof example === "object") {
        if (isDSLField(actualVal)) {
            validateResponse(expectedDSL.example, actualVal.example, path)
        } else {
            validateResponse(expectedDSL.example, actualVal, path)
        }
        return
    }

    // Handle a DSL field whose example is a primitive value.
    if (isDSLField(actualVal)) {
        if (actualVal.example !== expectedDSL.example) {
            throw new Error(
                `Expected response body[${path}].example to be ${expectedDSL.example} but got ${actualVal.example}`,
            )
        }
    } else if (actualVal !== expectedDSL.example) {
        throw new Error(
            `Expected response body[${path}] to be ${expectedDSL.example} but got ${actualVal}`,
        )
    }
}

/**
 * Function that validates array-type responses
 * @param {any[]} expectedArr Expected response value (array)
 * @param {any[]} actualArr Actual response value (array)
 * @param {string} path Current path being validated (used in recursive calls)
 * @throws {Error} Throws an error when validation fails.
 */
const validateArray = (expectedArr: any[], actualArr: any[], path: string): void => {
    if (!Array.isArray(actualArr)) {
        throw new Error(`Expected response body[${path}] to be an array but got ${actualArr}`)
    }
    if (expectedArr.length !== actualArr.length) {
        throw new Error(
            `Expected response body[${path}] to have length ${expectedArr.length} but got ${actualArr.length}`,
        )
    }
    expectedArr.forEach((elem, index) => {
        validateResponse(elem, actualArr[index], `${path}[${index}]`)
    })
}

const validateFunction = (func: (actualValue: any) => any, actualVal: any): void => {
    const argsCount = func.length
    if (argsCount > 1) {
        throw new Error(
            `Validator function should have at most one argument, but got ${argsCount}.
            Please check the following function:

            ${func.toString()}`,
        )
    }

    func(actualVal)
}

/**
 * Function that performs **actual validation** of API response values defined in `ResponseBuilder`.
 * Performs validation by branching for various types such as arrays, objects, etc.
 * @param {any} expected Expected response value
 * @param {any} actual Actual response value
 * @param {string} path Current path being validated (used in recursive calls)
 * @throws {Error} Throws an error when validation fails.
 * @see {ResponseBuilder}
 */
export const validateResponse = (expected: any, actual: any, path: string = ""): void => {
    // Handle array comparisons.
    if (Array.isArray(expected)) {
        validateArray(expected, actual, path)
        return
    }

    // Handle objects except for null.
    if (expected && typeof expected === "object") {
        for (const key in expected) {
            const currentPath = path ? `${path}.${key}` : key
            const expectedVal = expected[key]
            const actualVal = actual ? actual[key] : undefined

            if (isDSLField(expectedVal)) {
                validateDSLField(expectedVal, actualVal, currentPath)
            } else if (Array.isArray(expectedVal)) {
                validateArray(expectedVal, actualVal, currentPath)
            } else if (typeof expectedVal === "function") {
                validateFunction(expectedVal, actualVal)
            } else if (expectedVal && typeof expectedVal === "object") {
                if (!actualVal || typeof actualVal !== "object") {
                    throw new Error(
                        `Expected response body[${currentPath}] to be an object but got ${actualVal}`,
                    )
                }
                validateResponse(expectedVal, actualVal, currentPath)
            } else if (actualVal !== expectedVal) {
                throw new Error(
                    `Expected response body[${currentPath}] to be ${expectedVal} but got ${actualVal}`,
                )
            }
        }
        return
    }

    // Compare primitive types directly.
    if (actual !== expected) {
        throw new Error(`Expected response body[${path}] to be ${expected} but got ${actual}`)
    }
}
