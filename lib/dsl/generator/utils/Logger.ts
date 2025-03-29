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
 * 디버그 로깅을 위한 유틸리티 클래스
 */
export class Logger {
    private static debugMode = false

    /**
     * 디버그 모드를 설정합니다.
     * @param {boolean} enable 디버그 모드 활성화 여부
     */
    public static setDebugMode(enable: boolean): void {
        Logger.debugMode = enable
    }

    /**
     * 디버그 모드 상태를 반환합니다.
     * @returns {boolean} 디버그 모드 활성화 여부
     */
    public static isDebugMode(): boolean {
        return Logger.debugMode
    }

    /**
     * 디버그 로그를 출력합니다.
     * @param {string} message 로그 메시지
     * @param {any} data 추가 데이터 (선택사항)
     */
    public static debug(message: string, data?: unknown): void {
        if (Logger.debugMode) {
            if (data !== undefined) {
                console.log(
                    message,
                    typeof data === "object" ? JSON.stringify(data, null, 2) : data,
                )
            } else {
                console.log(message)
            }
        }
    }
}
