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
 * Validate the DSL features exposed by the adapter-provided test framework.
 * @see {@link https://github.com/do-pa/itdoc/issues/35}
 */

import { getTestAdapterExports } from "../../../lib/dsl/adapters"
const {
    afterAllCommon,
    afterEachCommon,
    beforeAllCommon,
    beforeEachCommon,
    describeCommon,
    itCommon,
}: {
    afterAllCommon: (fn: () => void) => void
    afterEachCommon: (fn: () => void) => void
    beforeAllCommon: (fn: () => void) => void
    beforeEachCommon: (fn: () => void) => void
    describeCommon: (name: string, fn: () => void) => void
    itCommon: (name: string, fn: () => void) => void
} = getTestAdapterExports()

const hookOrder: string[] = []

describeCommon("TestFramework DSL Functionality", () => {
    beforeAllCommon(() => {
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

    afterAllCommon(() => {
        hookOrder.push("afterCommon")

        // prettier-ignore
        const expectedHookOrder = [
            "beforeCommon",
            "beforeEachCommon", "test1", "afterEachCommon",
            "beforeEachCommon", "test2", "afterEachCommon",
            "beforeEachCommon", "test3", "afterEachCommon",
            "afterCommon",
        ]

        // Verify the execution order.
        if (hookOrder.join(",") !== expectedHookOrder.join(",")) {
            throw new Error(
                `Hook order mismatch.\nExpected: ${expectedHookOrder.join(
                    ",",
                )}\nGot: ${hookOrder.join(",")}`,
            )
        }
    })
})
