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

import * as t from "@babel/types"
import { extractValue } from "./extractValue"

/**
 * 배열 push 호출을 분석합니다.
 * @param {t.CallExpression} call - 호출 표현식 노드
 * @param {Record<string, any[]>} localArrays - 로컬 배열 저장 객체
 * @param {Record<string, any>} variableMap - 변수명과 데이터 구조 매핑
 */
export function analyzeArrayPush(
    call: t.CallExpression,
    localArrays: Record<string, any[]>,
    variableMap: Record<string, any> = {},
) {
    if (
        t.isMemberExpression(call.callee) &&
        t.isIdentifier(call.callee.property, { name: "push" }) &&
        t.isIdentifier(call.callee.object)
    ) {
        const arrName = call.callee.object.name
        if (localArrays[arrName] && call.arguments[0]) {
            localArrays[arrName].push(extractValue(call.arguments[0], localArrays, variableMap))
        }
    }
}
