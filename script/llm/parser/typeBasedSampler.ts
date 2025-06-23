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
import traversePkg from "@babel/traverse"
// @ts-expect-error - CommonJS/ES modules 호환성 이슈로 인한 타입 에러 무시
const traverse = traversePkg.default

/**
 * TypeScript 타입 정의에서 샘플 데이터를 생성합니다.
 * @param {t.File} ast - 파일 AST
 * @param {string} typeName - 타입명 (예: "Product")
 * @returns {any} 타입 기반 샘플 데이터
 */
export function generateSampleFromType(ast: t.File, typeName: string): any {
    let sampleData: any = null

    traverse(ast, {
        TSInterfaceDeclaration(interfacePath: NodePath<t.TSInterfaceDeclaration>) {
            if (interfacePath.node.id.name === typeName) {
                sampleData = generateSampleFromInterface(interfacePath.node, ast)
            }
        },
        TSTypeAliasDeclaration(typePath: NodePath<t.TSTypeAliasDeclaration>) {
            if (typePath.node.id.name === typeName) {
                if (t.isTSTypeLiteral(typePath.node.typeAnnotation)) {
                    sampleData = generateSampleFromTypeLiteral(typePath.node.typeAnnotation, ast)
                }
            }
        },
    })

    return sampleData
}

/**
 * TypeScript 인터페이스에서 샘플 객체를 생성합니다.
 * @param {t.TSInterfaceDeclaration} interfaceNode - 인터페이스 노드
 * @param {t.File} ast - AST (중첩 타입 참조용)
 * @returns {any} 샘플 객체
 */
export function generateSampleFromInterface(
    interfaceNode: t.TSInterfaceDeclaration,
    ast: t.File,
): any {
    const sample: any = {}

    interfaceNode.body.body.forEach((member) => {
        if (
            t.isTSPropertySignature(member) &&
            t.isIdentifier(member.key) &&
            member.typeAnnotation
        ) {
            const propName = member.key.name
            const typeAnnotation = member.typeAnnotation.typeAnnotation

            sample[propName] = generateSampleFromTypeAnnotation(typeAnnotation, propName, ast)
        }
    })

    return sample
}

/**
 * TypeScript 타입 리터럴에서 샘플 객체를 생성합니다.
 * @param {t.TSTypeLiteral} typeLiteral - 타입 리터럴 노드
 * @param {t.File} ast - AST (중첩 타입 참조용)
 * @returns {any} 샘플 객체
 */
export function generateSampleFromTypeLiteral(typeLiteral: t.TSTypeLiteral, ast: t.File): any {
    const sample: any = {}

    typeLiteral.members.forEach((member) => {
        if (
            t.isTSPropertySignature(member) &&
            t.isIdentifier(member.key) &&
            member.typeAnnotation
        ) {
            const propName = member.key.name
            const typeAnnotation = member.typeAnnotation.typeAnnotation

            sample[propName] = generateSampleFromTypeAnnotation(typeAnnotation, propName, ast)
        }
    })

    return sample
}

/**
 * TypeScript 타입 어노테이션에서 샘플 값을 생성합니다.
 * 실용적 접근: 기본 타입들만 지원하고 나머지는 스마트 기본값 제공
 * @param {t.TSType} typeAnnotation - 타입 어노테이션
 * @param {string} propName - 속성명 (샘플 값 생성 힌트)
 * @param {t.File} ast - AST (interface/type 참조용)
 * @returns {any} 샘플 값
 */
export function generateSampleFromTypeAnnotation(
    typeAnnotation: t.TSType,
    propName: string,
    ast?: t.File,
): any {
    if (t.isTSStringKeyword(typeAnnotation)) {
        return generateSmartStringValue(propName)
    }

    if (t.isTSNumberKeyword(typeAnnotation)) {
        return generateSmartNumberValue(propName)
    }

    if (t.isTSBooleanKeyword(typeAnnotation)) {
        return true
    }

    if (t.isTSArrayType(typeAnnotation)) {
        const elementSample = generateSampleFromTypeAnnotation(
            typeAnnotation.elementType,
            propName,
            ast,
        )
        return [elementSample]
    }

    if (t.isTSTypeReference(typeAnnotation) && t.isIdentifier(typeAnnotation.typeName)) {
        const typeName = typeAnnotation.typeName.name

        const knownType = getKnownTypeValue(typeName)
        if (knownType !== null) {
            return knownType
        }

        if (ast) {
            const nestedSample = generateSampleFromType(ast, typeName)
            if (nestedSample) {
                return nestedSample
            }
        }

        return generateSmartDefaultValue(typeName)
    }

    if (t.isTSUnionType(typeAnnotation)) {
        for (const type of typeAnnotation.types) {
            if (t.isTSLiteralType(type)) {
                return extractLiteralValue(type)
            }
        }

        for (const type of typeAnnotation.types) {
            if (!t.isTSUndefinedKeyword(type) && !t.isTSNullKeyword(type)) {
                return generateSampleFromTypeAnnotation(type, propName, ast)
            }
        }
    }

    if (t.isTSLiteralType(typeAnnotation)) {
        return extractLiteralValue(typeAnnotation)
    }

    if (t.isTSTypeLiteral(typeAnnotation)) {
        return generateSampleFromTypeLiteral(typeAnnotation, ast || ({} as t.File))
    }

    return generateFallbackValue(propName, typeAnnotation.type)
}

/**
 * 속성명 기반 스마트 문자열 값 생성
 * @param propName
 */
export function generateSmartStringValue(propName: string): string {
    const lower = propName.toLowerCase()
    if (lower.includes("name")) return `Sample ${propName}`
    if (lower.includes("email")) return "sample@example.com"
    if (lower.includes("url")) return "https://example.com"
    if (lower.includes("description")) return `Sample ${propName} description`
    if (lower.includes("date")) return "2024-01-01"
    if (lower.includes("time")) return "12:00:00"
    if (lower.includes("status")) return "active"
    return `Sample ${propName}`
}

/**
 * 속성명 기반 스마트 숫자 값 생성
 * @param propName
 */
export function generateSmartNumberValue(propName: string): number {
    const lower = propName.toLowerCase()
    if (lower.includes("id")) return 1
    if (lower.includes("price")) return 99.99
    if (lower.includes("count")) return 10
    if (lower.includes("age")) return 25
    if (lower.includes("year")) return 2024
    return 100
}

/**
 * 알려진 타입들의 기본값 반환
 * @param typeName
 */
export function getKnownTypeValue(typeName: string): any {
    switch (typeName) {
        case "Date":
            return "2024-01-01T12:00:00.000Z"
        case "Buffer":
            return "base64encodeddata"
        case "ObjectId":
            return "507f1f77bcf86cd799439011"
        case "UUID":
            return "550e8400-e29b-41d4-a716-446655440000"
        default:
            return null
    }
}

/**
 * 리터럴 타입에서 값 추출
 * @param literalType
 */
export function extractLiteralValue(literalType: t.TSLiteralType): any {
    if (t.isStringLiteral(literalType.literal)) {
        return literalType.literal.value
    }
    if (t.isNumericLiteral(literalType.literal)) {
        return literalType.literal.value
    }
    if (t.isBooleanLiteral(literalType.literal)) {
        return literalType.literal.value
    }
    return null
}

/**
 * 알 수 없는 타입의 스마트 기본값 생성
 * @param typeName
 */
export function generateSmartDefaultValue(typeName: string): any {
    if (typeName.endsWith("[]") || typeName.includes("Array")) {
        return []
    }

    if (typeName.endsWith("Type") || typeName.endsWith("Interface") || /^[A-Z]/.test(typeName)) {
        return { [`sample${typeName}Field`]: `Sample ${typeName} value` }
    }

    return `Sample ${typeName}`
}

/**
 * 복잡한 타입들의 fallback 값 생성
 * @param propName
 * @param typeType
 */
export function generateFallbackValue(propName: string, typeType: string): any {
    console.warn(`Using fallback for unsupported type: ${typeType}`)

    if (propName.toLowerCase().includes("array") || propName.toLowerCase().includes("list")) {
        return []
    }

    if (propName.toLowerCase().includes("object") || propName.toLowerCase().includes("data")) {
        return { sampleField: "sample value" }
    }

    return `Sample ${propName}`
}

/**
 * 함수의 반환 타입에서 타입명을 추출합니다.
 * @param {t.Function} func - 함수 노드
 * @returns {string|null} 타입명
 */
export function extractReturnTypeName(func: t.Function): string | null {
    if (!func.returnType) return null

    if (t.isTSTypeAnnotation(func.returnType)) {
        const returnType = func.returnType.typeAnnotation

        if (
            t.isTSTypeReference(returnType) &&
            t.isIdentifier(returnType.typeName) &&
            returnType.typeName.name === "Promise" &&
            returnType.typeParameters &&
            returnType.typeParameters.params.length > 0
        ) {
            const promiseType = returnType.typeParameters.params[0]

            if (t.isTSUnionType(promiseType)) {
                for (const type of promiseType.types) {
                    if (t.isTSTypeReference(type) && t.isIdentifier(type.typeName)) {
                        return type.typeName.name
                    }
                }
            }

            if (t.isTSTypeReference(promiseType) && t.isIdentifier(promiseType.typeName)) {
                return promiseType.typeName.name
            }
        }

        if (t.isTSTypeReference(returnType) && t.isIdentifier(returnType.typeName)) {
            return returnType.typeName.name
        }
    }

    return null
}
