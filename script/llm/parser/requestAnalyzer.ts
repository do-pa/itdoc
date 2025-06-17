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

/**
 * 변수 선언에서 요청 매개변수를 분석합니다.
 * @param {NodePath<t.VariableDeclarator>} varPath - 변수 선언 노드
 * @param {any} ret - 분석 결과 저장 객체
 * @param {Record<string, any[]>} localArrays - 로컬 배열 저장 객체
 */
export function analyzeVariableDeclarator(
    varPath: NodePath<t.VariableDeclarator>,
    ret: any,
    localArrays: Record<string, any[]>,
) {
    const decl = varPath.node

    if (t.isIdentifier(decl.id) && t.isArrayExpression(decl.init)) {
        localArrays[decl.id.name] = []
        return
    }

    if (
        t.isObjectPattern(decl.id) &&
        t.isMemberExpression(decl.init) &&
        t.isIdentifier(decl.init.object, { name: "req" }) &&
        t.isIdentifier(decl.init.property)
    ) {
        const propName = decl.init.property.name
        decl.id.properties.forEach((prop: any) => {
            if (t.isObjectProperty(prop) && t.isIdentifier(prop.key)) {
                const fieldName = prop.key.name

                switch (propName) {
                    case "query":
                        ret.reqQuery.add(fieldName)
                        break
                    case "params":
                        ret.reqParams.add(fieldName)
                        break
                    case "headers":
                        ret.reqHeaders.add(fieldName.toLowerCase())
                        break
                    case "body":
                        ret.bodyFields.add(fieldName)
                        break
                }
            }
        })
    }
}

/**
 * 멤버 표현식에서 요청 매개변수를 분석합니다.
 * @param {NodePath<t.MemberExpression>} memPath - 멤버 표현식 노드
 * @param {any} ret - 분석 결과 저장 객체
 */
export function analyzeMemberExpression(memPath: NodePath<t.MemberExpression>, ret: any) {
    const mm = memPath.node

    if (
        t.isMemberExpression(mm.object) &&
        t.isIdentifier(mm.object.object, { name: "req" }) &&
        t.isIdentifier(mm.object.property) &&
        t.isIdentifier(mm.property)
    ) {
        const parent = mm.object.property.name
        const child = mm.property.name

        if (parent === "headers") {
            ret.reqHeaders.add(child.toLowerCase())
        } else if (parent === "body") {
            ret.bodyFields.add(child)
        }
    }
}
