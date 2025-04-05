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

import { SchemaGenerator } from "./interfaces"
import { FORMAT_PATTERNS } from "./constants"

/**
 * 스키마 생성기의 기본 기능을 제공하는 추상 클래스
 */
export abstract class BaseSchemaGenerator implements SchemaGenerator {
    /**
     * 값으로부터 스키마를 생성합니다.
     * @param value 스키마를 생성할 값
     * @returns 생성된 OpenAPI 스키마 객체
     */
    public abstract generateSchema(value: unknown): Record<string, unknown>

    /**
     * 문자열 값의 포맷을 감지합니다.
     * @param value 검사할 문자열 값
     * @returns 감지된 포맷 또는 undefined
     */
    protected detectStringFormat(value: string): string | undefined {
        if (FORMAT_PATTERNS.UUID.test(value)) {
            return "uuid"
        }
        if (FORMAT_PATTERNS.EMAIL.test(value)) {
            return "email"
        }
        if (FORMAT_PATTERNS.DATE_TIME.test(value)) {
            return "date-time"
        }
        if (FORMAT_PATTERNS.DATE.test(value)) {
            return "date"
        }
        if (FORMAT_PATTERNS.URI.test(value)) {
            return "uri"
        }
        if (FORMAT_PATTERNS.IPV4.test(value)) {
            return "ipv4"
        }
        if (FORMAT_PATTERNS.IPV6.test(value)) {
            return "ipv6"
        }

        return undefined
    }
}
