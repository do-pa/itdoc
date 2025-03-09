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
import { ApiDoc, ApiDocOptions } from "./ApiDoc"

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
    callback: (apiDoc: ApiDoc) => void,
): void => {
    if (!options.name) {
        throw new Error("API 이름이 필요합니다.")
    }

    if (!url.startsWith("/")) {
        throw new Error("API URL은 /로 시작해야 합니다.")
    }

    if (!app) {
        throw new Error("Express 앱 인스턴스가 필요합니다.")
    }

    if (!callback) {
        throw new Error("API 테스트 함수가 필요합니다.")
    }

    const { describeCommon } = getTestAdapterExports()
    describeCommon(`${options.name} | [${method}] ${url}`, () => {
        const apiDoc = new ApiDoc(method, url, options, app)
        callback(apiDoc)
    })
}
