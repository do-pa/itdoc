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

import { HttpMethod } from "../enums/HttpMethod"
import { getTestAdapterExports } from "../adapters"
import { ItdocBuilderEntry, ApiDocOptions } from "./ItdocBuilderEntry"
import { configureOASExport } from "../generator"

/**
 * API 명세를 위한 describe 함수
 * @param method {HttpMethod} HTTP 메서드
 * @param url {string} API URL
 * @param options {ApiDocOptions} API 문서 옵션
 * @param app Express 앱 인스턴스 (supertest 생성에 사용)
 * @param callback API 테스트 함수
 */
export const describeAPI = (
    method: HttpMethod,
    url: string,
    options: ApiDocOptions,
    app: unknown, // TODO: 이거 타입지정
    callback: (apiDoc: ItdocBuilderEntry) => void,
): void => {
    if (!options.name) {
        throw new Error("API name is required.")
    }

    if (!url.startsWith("/")) {
        url = "/" + url
    }

    if (!app) {
        throw new Error("Express app instance is required.")
    }

    if (!callback) {
        throw new Error("API test function is required.")
    }

    configureOASExport("./openapi.json")
    const { describeCommon } = getTestAdapterExports()
    describeCommon(`${options.name} | [${method}] ${url}`, () => {
        const apiDoc = new ItdocBuilderEntry(method, url, options, app)
        callback(apiDoc)
    })
}
