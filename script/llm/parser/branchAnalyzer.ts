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

import { NodePath } from "@babel/traverse"
import * as t from "@babel/types"
import { BranchDetail } from "./interface"

/**
 * 조건문 브랜치 키를 결정합니다
 * @param {NodePath<t.CallExpression>} callPath - 호출 표현식 노드
 * @param {string} source - 소스 코드
 * @returns {string} 브랜치 키
 */
export function determineBranchKey(callPath: NodePath<t.CallExpression>, source: string): string {
    const ifParent = callPath.findParent((p: any) => p.isIfStatement())
    if (!ifParent?.isIfStatement()) {
        return "default"
    }

    const { test, consequent, alternate } = ifParent.node
    const condSrc = source.slice(test.start!, test.end!)
    const call = callPath.node
    const callStart = call.start!
    const callEnd = call.end!

    const inThen = callStart >= consequent.start! && callEnd <= consequent.end!

    if (inThen) {
        return `if ${condSrc}`
    } else if (alternate && callStart >= alternate.start! && callEnd <= alternate.end!) {
        return "else"
    }

    return "default"
}

/**
 * 응답 브랜치 세부사항을 가져오거나 생성합니다.
 * @param {string} branchKey - 브랜치 키
 * @param {any} ret - 분석 결과 저장 객체
 * @returns {BranchDetail} 브랜치 세부사항
 */
export function getBranchDetail(branchKey: string, ret: any): BranchDetail {
    if (branchKey === "default") {
        return ret.defaultResponse
    }

    if (!ret.branchResponses[branchKey]) {
        ret.branchResponses[branchKey] = {
            status: [],
            json: [],
            send: [],
            headers: [],
        }
    }

    return ret.branchResponses[branchKey]
}
