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

import { MochaAdapter } from "./MochaAdapter"
import { TestFramework } from "./TestFramework"
import type { UserTestInterface } from "./UserTestInterface"

/**
 * Synchronous function that detects test framework
 */
function detectTestFramework(): TestFramework {
    const isJest =
        process.env.JEST_WORKER_ID !== undefined ||
        typeof (global as any).jest !== "undefined" ||
        process.argv.some((arg) => arg.includes("jest"))

    if (isJest) {
        return TestFramework.Jest
    }

    const isMocha =
        typeof global.describe === "function" &&
        typeof global.it === "function" &&
        process.argv.some((arg) => arg.toLowerCase().includes("mocha"))

    if (isMocha) {
        return TestFramework.Mocha
    }

    return TestFramework.Unknown
}

/**
 * Function that initializes adapter synchronously
 */
function initializeAdapterSync(): UserTestInterface {
    const framework = detectTestFramework()

    switch (framework) {
        case TestFramework.Jest: {
            /*
      Note: For Jest, dynamic imports must only be used when needed.
      Otherwise, "Do not import `@jest/globals` outside of the Jest test environment"
      error will occur.
      */
            const { JestAdapter } = require("./JestAdapter")
            return new JestAdapter()
        }
        case TestFramework.Mocha:
            return new MochaAdapter()
        default:
            throw new Error(
                "Could not detect test framework. Please use one of the following: " +
                    Object.keys(TestFramework)
                        .filter((key) => key !== TestFramework.Unknown)
                        .join(", ") +
                    ".",
            )
    }
}

/**
 * Function that initializes adapter and returns necessary test methods
 * Operates synchronously.
 * @returns {object} Common methods of test framework
 * @property {Function} describeCommon Function that defines test suite
 * @property {Function} itCommon Function that defines test case
 * @property {Function} beforeAllCommon Function executed before all tests
 * @property {Function} afterAllCommon Function executed after all tests
 * @property {Function} beforeEachCommon Function executed before each test
 * @property {Function} afterEachCommon Function executed after each test
 */
export function getTestAdapterExports(): {
    describeCommon: (name: string, fn: () => void) => void
    itCommon: (name: string, fn: () => void) => void
    beforeAllCommon: (fn: () => void) => void
    afterAllCommon: (fn: () => void) => void
    beforeEachCommon: (fn: () => void) => void
    afterEachCommon: (fn: () => void) => void
} {
    const adapter = initializeAdapterSync()
    return {
        describeCommon: adapter.describe.bind(adapter),
        itCommon: adapter.it.bind(adapter),
        beforeAllCommon: adapter.before.bind(adapter),
        afterAllCommon: adapter.after.bind(adapter),
        beforeEachCommon: adapter.beforeEach.bind(adapter),
        afterEachCommon: adapter.afterEach.bind(adapter),
    }
}
