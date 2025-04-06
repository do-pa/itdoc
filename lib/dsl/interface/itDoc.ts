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
import { recordTestFailure, resultCollector, testEventManager, TestResult } from "../generator"

export const itDoc = (description: string, testFn: () => Promise<TestResult | void>): void => {
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
            const result: TestResult | void = await testFn()
            if (!result) {
                throw new Error("testFn을 await로 실행하지 말고 return 하세요.")
            }
            result.context = description

            resultCollector.collectResult(result)
            // 테스트 성공 기록
            testEventManager.completeTestSuccess()
            return null
        } catch (error) {
            // 테스트 실패 기록
            recordTestFailure()
            throw error
        }
    })
}
