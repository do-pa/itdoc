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
 * 테스트 프레임워크를 감지하는 동기 함수
 */
function detectTestFramework(): TestFramework {
    // Mocha 환경인지 확인하기 위해 전역 Mocha 함수들의 존재 여부를 검사
    if (typeof global.describe === "function" && typeof global.it === "function") {
        return TestFramework.Mocha
    }

    // Jest 감지 (기존 로직 유지)
    if (typeof (global as any).jest !== "undefined") {
        return TestFramework.Jest
    }
    if (
        typeof (global as any).expect === "function" &&
        typeof (global as any).expect(1).toBe === "function"
    ) {
        return TestFramework.Jest
    }

    // 마지막으로 process.argv에서 mocha 문자열을 찾아 Mocha 환경인지 확인
    if (process.argv.some((arg) => arg.toLowerCase().includes("mocha"))) {
        return TestFramework.Mocha
    }

    return TestFramework.Unknown
}

/**
 * 동기 방식으로 어댑터를 초기화하는 함수
 */
function initializeAdapterSync(): UserTestInterface {
    const framework = detectTestFramework()

    switch (framework) {
        case TestFramework.Jest: {
            /*
            참고: Jest의 경우, 반드시 사용할 때만 동적으로 import 해야 합니다.
            그렇지 않으면 "Do not import `@jest/globals` outside of the Jest test environment"
            에러가 발생하게 됩니다.
            */
            const { JestAdapter } = require("./JestAdapter.js")
            return new JestAdapter()
        }
        case TestFramework.Mocha:
            return new MochaAdapter()
        default:
            throw new Error("지원하지 않는 테스트 프레임워크입니다.")
    }
}

/**
 * 어댑터를 초기화하고 필요한 테스트 메서드들을 반환하는 함수
 * 동기 방식으로 동작합니다.
 * @returns {object} 테스트 프레임워크의 공통 메서드들
 * @property {Function} describeCommon 테스트 스위트를 정의하는 함수
 * @property {Function} itCommon 테스트 케이스를 정의하는 함수
 * @property {Function} beforeCommon 전체 테스트 전에 실행되는 함수
 * @property {Function} afterCommon 전체 테스트 후에 실행되는 함수
 * @property {Function} beforeEachCommon 각 테스트 전에 실행되는 함수
 * @property {Function} afterEachCommon 각 테스트 후에 실행되는 함수
 */
export function getTestAdapterExports(): {
    describeCommon: (name: string, fn: () => void) => void
    itCommon: (name: string, fn: () => void) => void
    beforeCommon: (fn: () => void) => void
    afterCommon: (fn: () => void) => void
    beforeEachCommon: (fn: () => void) => void
    afterEachCommon: (fn: () => void) => void
} {
    // 실제 어댑터 객체를 동기적으로 반환 (Promise가 아님)
    const adapter = initializeAdapterSync()
    return {
        describeCommon: adapter.describe.bind(adapter),
        itCommon: adapter.it.bind(adapter),
        beforeCommon: adapter.before.bind(adapter),
        afterCommon: adapter.after.bind(adapter),
        beforeEachCommon: adapter.beforeEach.bind(adapter),
        afterEachCommon: adapter.afterEach.bind(adapter),
    }
}
