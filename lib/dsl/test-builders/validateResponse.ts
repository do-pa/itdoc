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
    // DSL Field의 example이 함수인 경우
    if (typeof expectedDSL.example === "function") {
        expectedDSL.example(actualVal)
        return
    }

    // DSL Field의 example이 객체인 경우
    if (
        expectedDSL.example &&
        typeof expectedDSL.example === "object" &&
        expectedDSL.example !== null
    ) {
        if (isDSLField(actualVal)) {
            validateResponse(expectedDSL.example, actualVal.example, path)
        } else {
            validateResponse(expectedDSL.example, actualVal, path)
        }
        return
    }

    // DSL Field의 example이 원시값인 경우
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
    // 배열인 경우
    if (Array.isArray(expected)) {
        validateArray(expected, actual, path)
        return
    }

    // 객체인 경우 (null 제외)
    if (expected && typeof expected === "object") {
        for (const key in expected) {
            const currentPath = path ? `${path}.${key}` : key
            const expectedVal = expected[key]
            const actualVal = actual ? actual[key] : undefined

            if (isDSLField(expectedVal)) {
                validateDSLField(expectedVal, actualVal, currentPath)
            } else if (Array.isArray(expectedVal)) {
                validateArray(expectedVal, actualVal, currentPath)
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

    // 원시 타입인 경우 직접 비교
    if (actual !== expected) {
        throw new Error(`Expected response body[${path}] to be ${expected} but got ${actual}`)
    }
}
