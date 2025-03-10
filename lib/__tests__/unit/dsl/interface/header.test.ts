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

import { expect } from "chai"
import { field } from "../../../../dsl"

describe("header() 는", () => {
    it("3번째 인자를 생략하면 required가 true로 설정된다.", () => {
        const header = field("description", "example")
        console.info(header)
        expect(header).deep.equal({
            description: "description",
            example: "example",
            required: true,
        })
    })

    it("3번째 인자를 false로 설정하면 required가 false로 설정된다.", () => {
        const header = field("description", "example", false)
        expect(header).deep.equal({
            description: "description",
            example: "example",
            required: false,
        })
    })
})
