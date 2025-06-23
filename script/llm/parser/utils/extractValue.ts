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
/**
 * AST 노드의 리터럴 값을 재귀적으로 추출합니다.
 * 문자열, 숫자, 불리언, null, 객체, 배열 리터럴을 처리하며,
 * 로컬 배열 식별자의 경우 해당 배열 값을 반환합니다.
 * @param {t.Node} node - 추출할 AST 노드
 * @param {Record<string, any[]>} localArrays - 로컬에서 정의된 배열 변수 맵
 * @param {Record<string, any>} variableMap - 변수명과 데이터 구조 매핑
 * @returns {any} 추출된 값 또는 식별자 표현(`<Identifier:name>`) 혹은 null
 */
export function extractValue(
    node: t.Node,
    localArrays: Record<string, any[]>,
    variableMap: Record<string, any> = {},
): any {
    if (t.isStringLiteral(node)) {
        return node.value
    }
    if (t.isNumericLiteral(node) || t.isBooleanLiteral(node)) {
        return node.value
    }
    if (t.isNullLiteral(node)) {
        return null
    }
    if (t.isObjectExpression(node)) {
        const obj: Record<string, any> = {}
        node.properties.forEach((prop) => {
            if (
                t.isObjectProperty(prop) &&
                (t.isIdentifier(prop.key) || t.isStringLiteral(prop.key))
            ) {
                const key = t.isIdentifier(prop.key) ? prop.key.name : prop.key.value
                obj[key] = extractValue(prop.value as t.Node, localArrays, variableMap)
            }
        })
        return obj
    }
    if (t.isArrayExpression(node)) {
        return node.elements.map((el) => (el ? extractValue(el, localArrays, variableMap) : null))
    }
    if (t.isIdentifier(node)) {
        const name = node.name

        if (localArrays[name]) return localArrays[name]

        if (variableMap[name]) {
            const mapping = variableMap[name]
            return mapping.sample || mapping
        }

        return `<Identifier:${name}>`
    }
    return null
}
