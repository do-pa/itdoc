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
 * DSL Field 타입 가드
 * @description
 * @param obj
 * 값이 DSL Field 타입인지 확인합니다.
 * @returns {boolean} DSL Field 여부
 * @example
 * ```typescript
 * if (isField(value)) {
 *   // value는 DSL Field 타입
 * }
 * ```
 */
const isDSLField = (obj: any): boolean =>
    obj && typeof obj === "object" && "example" in obj && "description" in obj

/**
 * DSL Field 값을 검증하는 함수
 * @description
 * Field의 example 값을 사용하여 검증을 수행합니다.
 * @param field - DSL Field 객체
 * @param field.example
 * @param actual - 실제 값
 * @param actualVal
 * @param expectedDSL
 * @param path - 현재 검증 중인 경로
 * @throws {Error} 검증 실패 시 에러를 발생시킵니다.
 * @example
 * ```typescript
 * const field = { example: (value) => value > 0 };
 * validateField(field, 42, 'response.age');
 * ```
 */
const validateDSLField = (expectedDSL: any, actualVal: any, path: string): void => {
    // DSL Field의 example이 함수인 경우
    if (typeof expectedDSL.example === "function") {
        expectedDSL.example(actualVal)
        return
    }

    // DSL Field의 example이 객체인 경우
    if (expectedDSL.example && typeof expectedDSL.example === "object") {
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
 * 배열 타입의 응답을 검증하는 함수
 * @description
 * 배열의 길이와 각 요소를 순서대로 비교합니다.
 * @param expected - 예상되는 배열
 * @param actual - 실제 응답 값
 * @param actualArr
 * @param expectedArr
 * @param path - 현재 검증 중인 객체 경로
 * @throws {Error} 검증 실패 시 에러를 발생시킵니다.
 * @example
 * ```typescript
 * const expected = [1, 2, 3];
 * const actual = [1, 2, 3];
 * validateArray(expected, actual, 'numbers');
 * ```
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
 * 응답 객체의 구조와 값을 검증하는 함수
 * @description
 * 예상되는 응답 구조와 실제 응답을 재귀적으로 비교하여 검증합니다.
 * 배열, 객체, 기본 타입에 대한 검증을 수행하며, DSL Field도 지원합니다.
 * @param expectedObj - 예상되는 응답 객체
 * @param actualObj - 실제 응답 객체
 * @param actual
 * @param expected
 * @param path - 현재 검증 중인 객체 경로 (기본값: '')
 * @throws {Error} 검증 실패 시 에러를 발생시킵니다.
 * @example
 * ```typescript
 * const expected = { name: 'John', age: 30 };
 * const actual = { name: 'John', age: 30 };
 * validateResponse(expected, actual);
 * // 성공: 객체가 일치함
 *
 * const invalidActual = { name: 'John', age: 25 };
 * validateResponse(expected, invalidActual);
 * // 에러: Expected response body[age] to be 30 but got 25
 * ```
 */
export const validateResponse = (expected: any, actual: any, path: string = ""): void => {
    // 배열인 경우
    if (Array.isArray(expected)) {
        validateArray(expected, actual, path)
        return
    }

    // 객체인 경우
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
