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

import { TestCaseConfig } from "./TestCaseConfig"
import { HttpMethod } from "../enums"

/**
 * Abstract class containing common settings for builder classes under test-builders.
 * @see https://github.com/do-pa/itdoc/issues/10
 */
export abstract class AbstractTestBuilder {
    protected readonly config: TestCaseConfig
    protected readonly method: HttpMethod
    protected readonly url: string
    protected readonly app: any

    public constructor(defaults: TestCaseConfig = {}, method: HttpMethod, url: string, app: any) {
        this.config = { ...defaults }
        this.method = method
        this.url = url
        this.app = app
    }
}
