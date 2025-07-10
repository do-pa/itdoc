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
import { determineBranchKey, getBranchDetail } from "./branchAnalyzer"
import { extractValue } from "../utils/extractValue"
import { BranchDetail } from "../type/interface"

/**
 * 응답 상태 코드를 처리합니다.
 * @param {t.CallExpression} call - 호출 표현식 노드
 * @param {BranchDetail} target - 브랜치 세부사항
 */
function handleResponseStatus(call: t.CallExpression, target: BranchDetail) {
    if (t.isNumericLiteral(call.arguments[0])) {
        target.status.push(call.arguments[0].value)
    }
}

/**
 * JSON 응답을 처리합니다.
 * @param {t.CallExpression} call - 호출 표현식 노드
 * @param {BranchDetail} target - 브랜치 세부사항
 * @param {Record<string, any[]>} localArrays - 로컬 배열 저장 객체
 * @param {Record<string, any>} variableMap - 변수명과 데이터 구조 매핑
 */
function handleJsonResponse(
    call: t.CallExpression,
    target: BranchDetail,
    localArrays: Record<string, any[]>,
    variableMap: Record<string, any> = {},
) {
    if (!call.arguments[0]) return

    const argNode = call.arguments[0]
    const extractedValue = extractValue(argNode, localArrays, variableMap)

    if (extractedValue !== null) {
        target.json.push(extractedValue)
    }
}

/**
 * 헤더 설정을 처리합니다.
 * @param {t.CallExpression} call - 호출 표현식 노드
 * @param {BranchDetail} target - 브랜치 세부사항
 * @param {Record<string, any[]>} localArrays - 로컬 배열 저장 객체
 * @param {Record<string, any>} variableMap - 변수명과 데이터 구조 매핑
 */
function handleHeaderResponse(
    call: t.CallExpression,
    target: BranchDetail,
    localArrays: Record<string, any[]>,
    variableMap: Record<string, any> = {},
) {
    const callee = call.callee as t.MemberExpression
    if (!t.isIdentifier(callee.property)) return

    const method = callee.property.name

    if (method === "setHeader" && t.isStringLiteral(call.arguments[0]) && call.arguments[1]) {
        target.headers.push({
            key: call.arguments[0].value,
            value: extractValue(call.arguments[1], localArrays, variableMap),
        })
    } else if (method === "set" && t.isObjectExpression(call.arguments[0])) {
        call.arguments[0].properties.forEach((prop) => {
            if (
                t.isObjectProperty(prop) &&
                (t.isIdentifier(prop.key) || t.isStringLiteral(prop.key))
            ) {
                const key = t.isIdentifier(prop.key) ? prop.key.name : prop.key.value
                target.headers.push({
                    key,
                    value: extractValue(prop.value as t.Node, localArrays, variableMap),
                })
            }
        })
    }
}

/**
 * 응답 호출을 분석합니다.
 * @param {NodePath<t.CallExpression>} callPath - 호출 표현식 노드
 * @param {string} source - 소스 코드
 * @param {any} ret - 분석 결과 저장 객체
 * @param {Record<string, any[]>} localArrays - 로컬 배열 저장 객체
 */
export function analyzeResponseCall(
    callPath: NodePath<t.CallExpression>,
    source: string,
    ret: any,
    localArrays: Record<string, any[]>,
) {
    const call = callPath.node

    if (!t.isMemberExpression(call.callee)) return

    let base = call.callee.object
    while (t.isCallExpression(base)) {
        base = (base.callee as t.MemberExpression).object
    }

    if (!t.isIdentifier(base) || base.name !== "res") return

    if (!t.isIdentifier(call.callee.property)) return

    const branchKey = determineBranchKey(callPath, source)
    const target = getBranchDetail(branchKey, ret)
    const method = call.callee.property.name
    const variableMap = ret.variableMap || {}

    switch (method) {
        case "status":
            handleResponseStatus(call, target)
            break
        case "json":
            handleJsonResponse(call, target, localArrays, variableMap)
            break
        case "send":
            if (call.arguments[0]) {
                const extractedValue = extractValue(call.arguments[0], localArrays, variableMap)
                if (extractedValue !== null) {
                    target.send.push(extractedValue)
                }
            }
            break
        case "setHeader":
        case "set":
            handleHeaderResponse(call, target, localArrays, variableMap)
            break
    }
}
