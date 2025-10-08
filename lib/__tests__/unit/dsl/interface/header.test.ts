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
import { header } from "../../../../dsl/interface/header"

describe("header()", () => {
    it("sets required to true when the third argument is omitted.", () => {
        expect(header("description", "example")).deep.equal({
            description: "description",
            example: "example",
            required: true,
        })
    })

    it("sets required to false when the third argument is false.", () => {
        expect(header("description", "example", false)).deep.equal({
            description: "description",
            example: "example",
            required: false,
        })
    })
})
