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

import { BaseSchemaGenerator } from "../BaseSchemaGenerator"

/**
 * 불리언 값의 스키마를 생성하는 클래스
 */
export class BooleanSchemaGenerator extends BaseSchemaGenerator {
    /**
     * 불리언 값으로부터 스키마를 생성합니다.
     * @param value 불리언 값
     * @param includeExample 스키마에 example 포함 여부 (기본값: true)
     * @returns 생성된 스키마
     */
    public generateSchema(value: unknown, includeExample: boolean = true): Record<string, unknown> {
        // 불리언 값이 아닌 경우 기본 불리언 스키마 반환
        if (typeof value !== "boolean") {
            return { type: "boolean" }
        }

        const schema: Record<string, unknown> = {
            type: "boolean",
        }

        // 예제 값 설정 (선택적)
        if (includeExample) {
            schema.example = value
        }

        return schema
    }
}
