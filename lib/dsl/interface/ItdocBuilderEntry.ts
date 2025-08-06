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
import { TestCaseConfig } from "../test-builders/TestCaseConfig"
import { RootBuilder } from "../test-builders/RootBuilder"

/**
 * Option interface to pass to Describe API
 */
export class ItdocBuilderEntry {
    public readonly method: HttpMethod
    public readonly url: string
    public readonly options: ApiDocOptions
    public readonly app: unknown

    public constructor(method: HttpMethod, url: string, options: ApiDocOptions, app: unknown) {
        this.method = method
        this.url = url
        this.options = options
        this.app = app
    }

    public test(): RootBuilder {
        const config = {
            apiOptions: this.options,
            ...this.options.defaults,
        }
        return new RootBuilder(config, this.method, this.url, this.app)
    }
}

/**
 * Option interface to pass to Describe API
 * @param summary One-line API summary
 * @param tag     API tag
 * @param description Detailed API description
 */
export interface ApiDocOptions {
    summary?: string
    tag?: string
    description?: string
    defaults?: TestCaseConfig
}
