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

import { TestFramework } from "./TestFramework"
import { UserTestInterface } from "./UserTestInterface"
import { autoExportOAS, recordTestFailure } from "../generator"

export class JestAdapter implements UserTestInterface {
    public name = TestFramework.Jest
    private autoExportRegistered = false
    private failureDetectionRegistered = false

    public constructor() {
        // Jest 환경에서 최상위 afterAll 훅과 실패 감지 리스너를 한번만 등록
        this.registerAutoExportHook()
        this.registerFailureDetection()
    }

    private registerAutoExportHook(): void {
        if (this.autoExportRegistered) return

        try {
            // 전역 환경에 플래그를 설정하여 중복 실행 방지
            const globalAny = global as any
            if (globalAny.__itdoc_jest_global_after_registered) {
                return
            }

            // 최상위 레벨에서 afterAll 훅을 등록하여 모든 테스트가 끝나면 OAS를 자동 생성
            ;(globalAny as any).afterAll(function () {
                // process.nextTick을 사용하여 테스트 스택이 완전히 비워진 후 실행
                process.nextTick(() => {
                    autoExportOAS()
                })
            })

            globalAny.__itdoc_jest_global_after_registered = true
            this.autoExportRegistered = true
        } catch (error) {
            console.error("Failed to register Jest auto export hook:", error)
        }
    }

    private registerFailureDetection(): void {
        if (this.failureDetectionRegistered) return

        try {
            // Jest의 각 테스트가 실행된 후 실패 여부를 확인하는 afterEach 훅 등록
            global.afterEach((done) => {
                try {
                    // 현재 테스트 결과를 확인하기 위해 expect.getState() 사용
                    const expectState = (global as any).expect.getState?.()
                    if (
                        expectState &&
                        expectState.assertionCalls !== expectState.assertionsPassed
                    ) {
                        recordTestFailure()
                    }
                } catch (error) {
                    console.error("Error in failure detection:", error)
                }
                done()
            })

            // 테스트 실행 오류를 잡기 위한 추가 안전장치
            // jasmine 객체는 Jest 환경에서 사용할 수 있지만 타입 정의가 없음
            const globalAny = global as any
            if (globalAny.jasmine) {
                const originalAddExpectationResult =
                    globalAny.jasmine.Spec.prototype.addExpectationResult
                if (originalAddExpectationResult) {
                    globalAny.jasmine.Spec.prototype.addExpectationResult = function (
                        passed: boolean,
                        ...args: any[]
                    ): any {
                        if (!passed) {
                            recordTestFailure()
                        }
                        return originalAddExpectationResult.apply(this, [passed, ...args])
                    }
                }
            }

            this.failureDetectionRegistered = true
        } catch (error) {
            console.error("Failed to register Jest failure detection:", error)
        }
    }

    public describe(name: string, fn: () => void): void {
        global.describe(name, fn)
    }

    public it(name: string, fn: () => void): void {
        global.it(name, fn)
    }

    public before(fn: () => void): void {
        ;(global as any).beforeAll(fn)
    }

    public after(fn: () => void): void {
        ;(global as any).afterAll(fn)
    }

    public beforeEach(fn: () => void): void {
        global.beforeEach(fn)
    }

    public afterEach(fn: () => void): void {
        global.afterEach(fn)
    }
}
