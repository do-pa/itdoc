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

import { SchemaFactory } from "./schema/SchemaFactory"
import logger from "../../../config/logger"

/**
 * OpenAPI Schema 객체를 생성하기 위한 빌더 클래스
 * 이 클래스는 복잡한 스키마 생성 로직을 추상화하여 사용자가 쉽게 스키마를 생성할 수 있도록 합니다.
 */
export class SchemaBuilder {
    private schemaFactory = new SchemaFactory()

    /**
     * 주어진 값에 대한 OpenAPI Schema를 생성합니다.
     * 값의 타입에 따라 적절한 스키마 생성기를 선택하여 사용합니다.
     * @param value 스키마를 생성할 값 (객체, 배열, 원시값 등)
     * @returns 생성된 OpenAPI Schema 객체
     */
    public createSchema(value: unknown): Record<string, unknown> {
        try {
            const schema = this.schemaFactory.createSchema(value)
            return schema as Record<string, unknown>
        } catch (error) {
            logger.error("스키마 생성 중 오류 발생:", error)
            // 오류 발생 시 기본 스키마 반환
            return { type: "object", description: "스키마 생성 실패" }
        }
    }
}

// 스키마 관련 타입 및 인터페이스 내보내기
export * from "./schema"
