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
 * 어댑터를 통해 제공받은 테스트 프레임워크의 DSL 기능을 테스트하는 코드
 * @see {@link https://github.com/do-pa/itdoc/issues/35}
 */

import { getTestAdapterExports } from "../../../lib/dsl/adapters"
const {
    afterCommon,
    afterEachCommon,
    beforeCommon,
    beforeEachCommon,
    describeCommon,
    itCommon,
}: {
    afterCommon: (fn: () => void) => void
    afterEachCommon: (fn: () => void) => void
    beforeCommon: (fn: () => void) => void
    beforeEachCommon: (fn: () => void) => void
    describeCommon: (name: string, fn: () => void) => void
    itCommon: (name: string, fn: () => void) => void
} = getTestAdapterExports()

const hookOrder: any[] = []

describeCommon("TestFramework DSL Functionality", () => {
    beforeCommon(() => {
        hookOrder.push("beforeCommon")
    })

    beforeEachCommon(() => {
        hookOrder.push("beforeEachCommon")
    })

    itCommon("Test Case 1", () => {
        hookOrder.push("test1")
    })

    itCommon("Test Case 2", () => {
        hookOrder.push("test2")
    })

    itCommon("Test Case 3", () => {
        hookOrder.push("test3")
    })

    afterEachCommon(() => {
        hookOrder.push("afterEachCommon")
    })

    afterCommon(() => {
        hookOrder.push("afterCommon")

        // prettier-ignore
        const expectedHookOrder = [
            "beforeCommon",
            "beforeEachCommon", "test1", "afterEachCommon",
            "beforeEachCommon", "test2", "afterEachCommon",
            "beforeEachCommon", "test3", "afterEachCommon",
            "afterCommon",
        ]

        // 실행 순서 검증
        if (hookOrder.join(",") !== expectedHookOrder.join(",")) {
            throw new Error(
                `Hook order mismatch.\nExpected: ${expectedHookOrder.join(
                    ",",
                )}\nGot: ${hookOrder.join(",")}`,
            )
        }
    })
})
