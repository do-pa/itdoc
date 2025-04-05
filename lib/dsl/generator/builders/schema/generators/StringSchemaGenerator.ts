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
 * 문자열 값의 스키마를 생성하는 클래스
 */
export class StringSchemaGenerator extends BaseSchemaGenerator {
    /**
     * 문자열 값으로부터 스키마를 생성합니다.
     * @param value 문자열 값
     * @param includeExample 스키마에 example 포함 여부 (기본값: true)
     * @returns 생성된 스키마
     */
    public generateSchema(value: unknown, includeExample: boolean = true): Record<string, unknown> {
        if (typeof value !== "string") {
            return { type: "string" }
        }

        const schema: Record<string, unknown> = {
            type: "string",
        }

        const format = this.detectStringFormat(value)
        if (format) {
            schema.format = format
        }

        if (includeExample) {
            schema.example = value
        }

        return schema
    }
}
