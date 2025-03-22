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

import { TestResult } from "../types/TestResult"

/**
 * 경로 관련 로직을 담당하는 클래스
 */
export class PathBuilder {
    /**
     * 테스트 결과를 경로별로 그룹화합니다.
     * @param {TestResult[]} results 테스트 결과 배열
     * @returns {Record<string, TestResult[]>} 경로별로 그룹화된 테스트 결과
     */
    public static groupByEndpoint(results: TestResult[]): Record<string, TestResult[]> {
        return results.reduce(
            (acc, result) => {
                const key = result.url
                if (!acc[key]) {
                    acc[key] = []
                }
                acc[key].push(result)
                return acc
            },
            {} as Record<string, TestResult[]>,
        )
    }

    /**
     * URL에서 경로 매개변수를 추출합니다.
     * @param {string} url URL 문자열
     * @returns {string[]} 추출된 경로 매개변수 배열
     */
    public static extractPathParameters(url: string): string[] {
        const paramPattern = /{([^}]+)}/g
        const matches = url.match(paramPattern) || []

        return matches.map((match) => match.replace(/{|}/g, ""))
    }
}
