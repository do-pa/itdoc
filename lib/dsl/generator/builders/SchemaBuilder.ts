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

/**
 * OpenAPI 스키마 생성을 담당하는 클래스
 */
export class SchemaBuilder {
    /**
     * 데이터로부터 스키마를 추론합니다.
     * @param {unknown} data 스키마를 추론할 데이터
     * @returns {unknown} 추론된 스키마 객체
     */
    public static inferSchema(data: unknown): unknown {
        // TODO: 데이터로부터 자동으로 스키마를 추론하는 기능 구현 필요
        // 현재는 임시 구현이며, 향후 더 정교한 스키마 추론 로직으로 개선해야 함
        return {
            type: typeof data,
            example: data,
        }
    }
}
