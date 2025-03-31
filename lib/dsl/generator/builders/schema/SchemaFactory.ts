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

import { SchemaGenerator, SchemaFactory as ISchemaFactory } from "./interfaces"
import { StringSchemaGenerator } from "./generators/StringSchemaGenerator"
import { NumberSchemaGenerator } from "./generators/NumberSchemaGenerator"
import { BooleanSchemaGenerator } from "./generators/BooleanSchemaGenerator"
import { ArraySchemaGenerator } from "./generators/ArraySchemaGenerator"
import { ObjectSchemaGenerator } from "./generators/ObjectSchemaGenerator"
import { DSLFieldSchemaGenerator } from "./generators/DSLFieldSchemaGenerator"
import { isDSLField } from "../../../interface/field"
import { Logger } from "../../utils/Logger"

/**
 * 스키마 제너레이터 팩토리 클래스
 * 타입에 따라 적절한 스키마 제너레이터를 선택하여 스키마를 생성합니다.
 */
export class SchemaFactory implements ISchemaFactory {
    private generators: Record<string, SchemaGenerator> = {}

    /**
     * 팩토리 생성자
     * 기본 스키마 제너레이터들을 등록합니다.
     */
    public constructor() {
        this.registerDefaultGenerators()
    }

    /**
     * 기본 스키마 제너레이터들을 등록합니다.
     */
    private registerDefaultGenerators(): void {
        this.generators["string"] = new StringSchemaGenerator()
        this.generators["number"] = new NumberSchemaGenerator()
        this.generators["boolean"] = new BooleanSchemaGenerator()
        this.generators["array"] = new ArraySchemaGenerator(this)
        this.generators["object"] = new ObjectSchemaGenerator(this)
        this.generators["dslfield"] = new DSLFieldSchemaGenerator(this)
    }

    /**
     * 스키마 타입에 따른 제너레이터를 등록합니다.
     * @param type 값의 타입
     * @param generator 스키마 제너레이터 인스턴스
     */
    public registerGenerator(type: string, generator: SchemaGenerator): void {
        Logger.debug(`스키마 제너레이터 등록: ${type}`)
        this.generators[type] = generator
    }

    /**
     * 값의 타입에 따라 적절한 스키마 제너레이터를 선택하여 스키마를 생성합니다.
     * @param value 스키마를 생성할 값
     * @returns 생성된 OpenAPI 스키마
     */
    public createSchema(value: unknown): unknown {
        if (value === undefined || value === null) {
            return { type: "object" }
        }

        // DSL 필드 처리
        if (isDSLField(value)) {
            return this.generators["dslfield"].generateSchema(value)
        }

        // 배열 처리
        if (Array.isArray(value)) {
            return this.generators["array"].generateSchema(value)
        }

        // 객체 처리
        if (typeof value === "object") {
            return this.generators["object"].generateSchema(value)
        }

        // 기본 타입 처리 (문자열, 숫자, 불리언)
        const type = typeof value
        if (this.generators[type]) {
            return this.generators[type].generateSchema(value)
        }

        // 알 수 없는 타입인 경우
        Logger.debug(`알 수 없는 타입: ${type}, 기본 문자열 스키마 사용`)
        return { type: "string" }
    }
}
