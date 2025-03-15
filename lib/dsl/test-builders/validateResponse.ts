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
 * 응답에 대한 expect가 field일 경우 검증을 수행하는 함수입니다.
 * @param expectedDSL - 예상되는 DSL 필드
 * @param actualVal - 실제 응답 값
 * @param path - 현재 검증 중인 경로 (재귀 호출 시 사용)
 * @throws {Error} 검증 실패 시 에러를 발생시킵니다.
 * @see {@link import('../interface/field.ts').field}
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
 * @param {Array} expectedArr - 예상한 응답 값 (배열)
 * @param {Array} actualArr - 실제 응답 값 (배열)
 * @param {string} path - 현재 검증 중인 경로 (재귀 호출 시 사용)
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
 * `ResponseBuilder`에서 정의한 API 응답 값의 **실질적인 검증**을 수행하는 함수입니다.
 * 배열, 객체 등등 다양한 타입에 대해 분기하여 검증을 수행합니다.
 * @param expected - 예상되는 응답 값
 * @param actual - 실제 응답 값
 * @param path - 현재 검증 중인 경로 (재귀 호출 시 사용)
 * @see {ResponseBuilder}
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
