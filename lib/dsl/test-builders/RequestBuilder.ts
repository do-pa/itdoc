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

// import { PATH_PARAM_TYPES, QUERY_PARAM_TYPES } from "./TestCaseConfig"
import { DSLField } from "../interface"
import { ResponseBuilder } from "./ResponseBuilder"
import { FIELD_TYPES } from "../interface/field"
import { AbstractTestBuilder } from "./AbstractTestBuilder"

/**
 * API 요청 정보를 설정하는 빌더 클래스입니다.
 */
export class RequestBuilder extends AbstractTestBuilder {
    /**
     * 요청시 사용할 헤더를 설정합니다.
     * @param headers
     */
    public header(headers: Record<string, DSLField<string>>): this {
        this.config.requestHeaders = headers
        return this
    }

    /**
     * 요청 바디를 설정합니다.
     * @param body
     */
    public body(body: Record<string, DSLField<FIELD_TYPES> | FIELD_TYPES>): this {
        this.config.requestBody = body
        return this
    }

    /**
     * 요청시 사용할 쿼리 파라미터를 설정합니다.
     * @param params
     */
    public queryParam(params: Record<string, any>): this {
        this.config.queryParams = params
        return this
    }

    public pathParam(params: Record<string, any>): this {
        this.config.pathParams = params
        return this
    }

    public res(): ResponseBuilder {
        return new ResponseBuilder(this.config, this.method, this.url, this.app)
    }
}
