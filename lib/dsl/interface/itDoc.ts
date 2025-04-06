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

import { getTestAdapterExports } from "../adapters"
import { recordTestFailure, testEventManager } from "../generator"
import { TestResult } from "../generator"

/**
 * 케이스 별 테스트를 정의를 위한 함수
 * @param description 테스트 설명
 * @param testFn 테스트 함수
 */
export interface TestFnResult {
    testResult?: TestResult
    [key: string]: unknown
}

export const itDoc = (
    description: string,
    testFn: () => Promise<TestFnResult | void> | TestFnResult | void,
): void => {
    if (!description) {
        throw new Error("테스트 설명이 itDoc에 필요합니다.")
    }

    if (!testFn) {
        throw new Error("테스트 함수가 itDoc에 필요합니다.")
    }

    // 테스트 등록
    testEventManager.registerTest()

    const { itCommon } = getTestAdapterExports()

    itCommon(description, async () => {
        try {
            const result = await testFn()

            // 테스트 성공 기록
            testEventManager.completeTestSuccess()
            return result
        } catch (error) {
            // 테스트 실패 기록
            recordTestFailure()
            throw error
        }
    })
}
