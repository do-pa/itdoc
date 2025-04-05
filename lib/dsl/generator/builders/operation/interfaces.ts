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

import { TestResult } from "../../types/TestResult"
import { ParameterObject, RequestBodyObject, ResponseObject } from "../../types/OpenAPITypes"

/**
 * OpenAPI Operation 객체 생성을 위한 인터페이스
 */
export interface OperationBuilderInterface {
    /**
     * 테스트 결과로부터 OpenAPI Operation 객체를 생성합니다.
     * @param result 테스트 결과
     * @returns OpenAPI Operation 객체
     */
    generateOperation(result: TestResult): Record<string, unknown>
}

/**
 * 파라미터 생성을 위한 인터페이스
 */
export interface ParameterBuilderInterface {
    /**
     * 테스트 결과에서 파라미터를 추출합니다.
     * @param result 테스트 결과
     * @returns 파라미터 객체 배열
     */
    extractParameters(result: TestResult): ParameterObject[]
}

/**
 * 보안 요구사항 처리를 위한 인터페이스
 */
export interface SecurityBuilderInterface {
    /**
     * 테스트 결과에서 보안 요구사항을 추출합니다.
     * @param result 테스트 결과
     * @returns 보안 요구사항 배열
     */
    extractSecurityRequirements(result: TestResult): Array<Record<string, string[]>>

    /**
     * 보안 스키마를 가져옵니다.
     * @returns 현재 등록된 보안 스키마 맵
     */
    getSecuritySchemes(): Record<string, any>
}

/**
 * 요청 본문 생성을 위한 인터페이스
 */
export interface RequestBodyBuilderInterface {
    /**
     * 요청 본문을 생성합니다.
     * @param result 테스트 결과
     * @returns 요청 본문 객체 또는 undefined
     */
    generateRequestBody(result: TestResult): RequestBodyObject | undefined
}

/**
 * 응답 객체 생성을 위한 인터페이스
 */
export interface ResponseBuilderInterface {
    /**
     * 응답을 생성합니다.
     * @param result 테스트 결과
     * @returns 응답 객체 맵
     */
    generateResponses(result: TestResult): Record<string, ResponseObject>
}

/**
 * 유틸리티 함수를 위한 인터페이스
 */
export interface UtilityBuilderInterface {
    /**
     * 테스트 결과로부터 operationId를 생성합니다.
     * @param result 테스트 결과
     * @returns 생성된 operationId
     */
    generateOperationId(result: TestResult): string

    /**
     * 경로에서 기본 태그를 생성합니다.
     * @param path API 경로
     * @returns 기본 태그
     */
    generateDefaultTag(path: string): string
}
