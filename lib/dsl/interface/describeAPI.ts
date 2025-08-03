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

import { HttpMethod } from "../enums"
import { getTestAdapterExports } from "../adapters"
import { ItdocBuilderEntry, ApiDocOptions } from "./ItdocBuilderEntry"
/**
 * Describe function for API specification
 * @param method {HttpMethod} HTTP method
 * @param url {string} API URL
 * @param options {ApiDocOptions} API documentation options
 * @param app Express app instance (used for supertest creation)
 * @param callback API test function
 */
export const describeAPI = (
    method: HttpMethod,
    url: string,
    options: ApiDocOptions,
    app: unknown, // TODO: Type specification for this
    callback: (apiDoc: ItdocBuilderEntry) => void,
): void => {
    if (!options.summary) {
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

    const { describeCommon } = getTestAdapterExports()
    describeCommon(`${options.summary} | [${method}] ${url}`, () => {
        const apiDoc = new ItdocBuilderEntry(method, url, options, app)
        callback(apiDoc)
    })
}
