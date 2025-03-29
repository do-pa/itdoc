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
import { Logger } from "../generator/utils/Logger"

export class MochaAdapter implements UserTestInterface {
    public name = TestFramework.Mocha
    private mochaGlobals: any
    private autoExportRegistered = false
    private failureDetectionRegistered = false

    public constructor() {
        this.mochaGlobals = {
            describe: global.describe,
            it: global.it,
            before: global.before,
            after: global.after,
            beforeEach: global.beforeEach,
            afterEach: global.afterEach,
        }

        // Mocha 환경에서 최상위 after 훅과 실패 감지 기능을 한번만 등록
        this.registerAutoExportHook()
        this.registerFailureDetection()
    }

    private registerAutoExportHook(): void {
        if (this.autoExportRegistered) return

        try {
            // Mocha에서는 "런타임"을 가져와서 이벤트에 리스너를 등록
            const globalAny = global as any

            // 1. 직접 런타임 이벤트에 리스너 등록 방식 시도
            if (globalAny.mocha && typeof globalAny.mocha.run === "function") {
                const originalRun = globalAny.mocha.run
                globalAny.mocha.run = function (...args: any[]): any {
                    const runner = originalRun.apply(this, args)
                    runner.on("end", () => {
                        Logger.debug("Mocha tests completed (runner.on end), auto-exporting OAS...")
                        autoExportOAS()
                    })
                    return runner
                }
                this.autoExportRegistered = true
                Logger.debug("Auto export hook registered for Mocha via runner events")
                return
            }

            // 2. 백업 방식: 표준 after 훅 사용
            // Mocha의 after 훅은 현재 describe 블록의 다른 모든 테스트가 끝난 후 실행됨
            // 최상위에 등록하면 모든 테스트 후 실행됨
            if (this.mochaGlobals.after) {
                // 중첩 후크를 방지하기 위한 플래그
                if (!globalAny.__itdoc_global_after_registered) {
                    this.mochaGlobals.after(function () {
                        // process.nextTick을 사용하여 모든 테스트 스택이 비워진 후 실행
                        process.nextTick(() => {
                            Logger.debug(
                                "Mocha tests completed (after hook), auto-exporting OAS...",
                            )
                            autoExportOAS()
                        })
                    })
                    globalAny.__itdoc_global_after_registered = true
                    this.autoExportRegistered = true
                    Logger.debug("Auto export hook registered for Mocha via after hook")
                }
            }
        } catch (error) {
            Logger.debug("Failed to register Mocha auto export hook:", error)
        }
    }

    private registerFailureDetection(): void {
        if (this.failureDetectionRegistered) return

        try {
            // Mocha 실행 환경 확인 - 타입 오류 수정
            const mocha = (global as any).mocha || (global as any).Mocha

            if (mocha) {
                // Mocha 이벤트 리스너에 등록
                if (mocha.Runner && mocha.Runner.prototype) {
                    // 기존 메소드 저장
                    const originalFail = mocha.Runner.prototype.fail

                    // 테스트 실패를 가로채서 recordTestFailure 호출
                    mocha.Runner.prototype.fail = function (...args: any[]): void {
                        Logger.debug("Mocha test failure detected")
                        recordTestFailure()
                        return originalFail.apply(this, args)
                    }
                    this.failureDetectionRegistered = true
                    Logger.debug("Failure detection registered for Mocha via Runner.fail")
                }
            }

            // 백업 방식으로 afterEach에 오류 확인 로직 추가
            this.mochaGlobals.afterEach(function (this: any, done: () => void) {
                const currentTest = this.currentTest || (this as any).test
                if (currentTest && currentTest.state === "failed") {
                    Logger.debug("Mocha test failure detected in afterEach")
                    recordTestFailure()
                }
                done()
            })

            if (!this.failureDetectionRegistered) {
                this.failureDetectionRegistered = true
                Logger.debug("Failure detection registered for Mocha via afterEach")
            }
        } catch (error) {
            Logger.debug("Failed to register Mocha failure detection:", error)

            // 마지막 방어 수단으로 uncaughtException 이벤트 리스너 추가
            try {
                process.on("uncaughtException", (err) => {
                    Logger.debug("Uncaught exception detected:", err)
                    recordTestFailure()
                })
                Logger.debug("Registered uncaughtException listener as fallback")
            } catch (processError) {
                Logger.debug("Failed to register uncaughtException listener:", processError)
            }
        }
    }

    public describe(name: string, fn: () => void): void {
        this.mochaGlobals.describe(name, fn)
    }

    public it(name: string, fn: () => void): void {
        this.mochaGlobals.it(name, fn)
    }

    public before(fn: () => void): void {
        this.mochaGlobals.before(fn)
    }

    public after(fn: () => void): void {
        this.mochaGlobals.after(fn)
    }

    public beforeEach(fn: () => void): void {
        this.mochaGlobals.beforeEach(fn)
    }

    public afterEach(fn: () => void): void {
        this.mochaGlobals.afterEach(fn)
    }
}
