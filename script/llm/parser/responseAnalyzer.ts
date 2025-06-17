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
import { extractValue } from "./utils/extractValue"

/**
 * 조건문 브랜치 키를 결정합니다.
 * @param {NodePath<t.CallExpression>} callPath - 호출 표현식 노드
 * @param {string} source - 소스 코드
 * @returns {string} 브랜치 키
 */
export function determineBranchKey(callPath: NodePath<t.CallExpression>, source: string): string {
    const tryParent = callPath.findParent((p: any) => p.isTryStatement())
    if (tryParent?.isTryStatement()) {
        const { block, handler } = tryParent.node
        const call = callPath.node
        const callStart = call.start!
        const callEnd = call.end!

        if (callStart >= block.start! && callEnd <= block.end!) {
            return "try"
        }

        if (handler && callStart >= handler.start! && callEnd <= handler.end!) {
            return "catch"
        }
    }

    const ifParent = callPath.findParent((p: any) => p.isIfStatement())
    if (!ifParent?.isIfStatement()) return "default"

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
    if (branchKey === "default" || branchKey === "try") {
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

/**
 * 응답 상태 코드를 처리합니다.
 * @param {t.CallExpression} call - 호출 표현식 노드
 * @param {BranchDetail} target - 브랜치 세부사항
 */
export function handleResponseStatus(call: t.CallExpression, target: BranchDetail) {
    if (t.isNumericLiteral(call.arguments[0])) {
        target.status.push(call.arguments[0].value)
    }
}

/**
 * JSON 응답을 처리합니다.
 * @param {t.CallExpression} call - 호출 표현식 노드
 * @param {BranchDetail} target - 브랜치 세부사항
 * @param {Record<string, any[]>} localArrays - 로컬 배열 저장 객체
 */
export function handleJsonResponse(
    call: t.CallExpression,
    target: BranchDetail,
    localArrays: Record<string, any[]>,
) {
    if (!call.arguments[0]) return

    const argNode = call.arguments[0]
    if (t.isObjectExpression(argNode)) {
        const obj: any = {}
        argNode.properties.forEach((prop) => {
            if (
                t.isObjectProperty(prop) &&
                (t.isIdentifier(prop.key) || t.isStringLiteral(prop.key))
            ) {
                const keyName = t.isIdentifier(prop.key) ? prop.key.name : prop.key.value
                const v = prop.value

                if (t.isArrayExpression(v)) {
                    obj[keyName] = v.elements.map((el) =>
                        t.isStringLiteral(el) ||
                        t.isNumericLiteral(el) ||
                        t.isBooleanLiteral(el) ||
                        t.isNullLiteral(el)
                            ? (el as t.StringLiteral | t.NumericLiteral | t.BooleanLiteral).value
                            : `<Identifier:${keyName}>`,
                    )
                } else if (
                    t.isStringLiteral(v) ||
                    t.isNumericLiteral(v) ||
                    t.isBooleanLiteral(v) ||
                    t.isNullLiteral(v)
                ) {
                    obj[keyName] = (
                        v as t.StringLiteral | t.NumericLiteral | t.BooleanLiteral
                    ).value
                } else {
                    obj[keyName] = `<Identifier:${keyName}>`
                }
            }
        })
        target.json.push(obj)
    } else {
        target.json.push(extractValue(argNode, localArrays))
    }
}

/**
 * 헤더 설정을 처리합니다.
 * @param {t.CallExpression} call - 호출 표현식 노드
 * @param {BranchDetail} target - 브랜치 세부사항
 * @param {Record<string, any[]>} localArrays - 로컬 배열 저장 객체
 */
export function handleHeaderResponse(
    call: t.CallExpression,
    target: BranchDetail,
    localArrays: Record<string, any[]>,
) {
    const callee = call.callee as t.MemberExpression
    if (!t.isIdentifier(callee.property)) return

    const method = callee.property.name

    if (method === "setHeader" && t.isStringLiteral(call.arguments[0]) && call.arguments[1]) {
        target.headers.push({
            key: call.arguments[0].value,
            value: extractValue(call.arguments[1], localArrays),
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
                    value: extractValue(prop.value as t.Node, localArrays),
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

    switch (method) {
        case "status":
            handleResponseStatus(call, target)
            break
        case "json":
            handleJsonResponse(call, target, localArrays)
            break
        case "send":
            if (call.arguments[0]) {
                target.send.push(extractValue(call.arguments[0], localArrays))
            }
            break
        case "setHeader":
        case "set":
            handleHeaderResponse(call, target, localArrays)
            break
    }
}
