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
import { validateResponse } from "../../../../dsl/test-builders/validateResponse"
import { field } from "../../../../dsl"

describe("validateResponse function", () => {
    describe("when field is not used", () => {
        it("does not throw when primitive values match", () => {
            const expected = { a: 1, b: "test", c: true }
            const actual = { a: 1, b: "test", c: true }
            expect(() => validateResponse(expected, actual)).to.not.throw()
        })
        ;[
            {
                expected: { a: 1 },
                actual: { a: 2 },
                throwMessage: "Expected response body[a] to be 1 but got 2",
            },
            {
                expected: { a: true },
                actual: { a: false },
                throwMessage: "Expected response body[a] to be true but got false",
            },
            {
                expected: { a: "a" },
                actual: { a: "b" },
                throwMessage: "Expected response body[a] to be a but got b",
            },
        ].forEach((scenario) => {
            it("throws when primitive values differ", () => {
                const { expected, actual, throwMessage } = scenario
                expect(() => validateResponse(expected, actual)).to.throw(throwMessage)
            })
        })

        it("does not throw when nested objects match", () => {
            const expected = {
                user: {
                    id: 1,
                    name: "Chulsoo",
                },
            }
            const actual = {
                user: {
                    id: 1,
                    name: "Chulsoo",
                },
            }
            expect(() => validateResponse(expected, actual)).to.not.throw()
        })

        it("throws when nested object values differ", () => {
            const expected = {
                user: {
                    id: 1,
                    name: "Chulsoo",
                },
            }
            const actual = {
                user: {
                    id: 1,
                    name: "Younghee",
                },
            }
            expect(() => validateResponse(expected, actual)).to.throw(
                "Expected response body[user.name] to be Chulsoo but got Younghee",
            )
        })

        it("does not throw when arrays match", () => {
            const expected = { list: [1, 2, 3] }
            const actual = { list: [1, 2, 3] }
            expect(() => validateResponse(expected, actual)).to.not.throw()
        })

        it("throws when array lengths differ", () => {
            const expected = { list: [1, 2, 3] }
            const actual = { list: [1, 2] }
            expect(() => validateResponse(expected, actual)).to.throw(
                "Expected response body[list] to have length 3 but got 2",
            )
        })
    })

    describe("when using field objects", () => {
        it("handles a DSL field example function happy case", () => {
            const expected = {
                value: field("Value info", (val) => {
                    if (val !== 42) {
                        throw new Error("Value is not 42")
                    }
                }),
            }
            const actual = { value: 42 }
            expect(() => validateResponse(expected, actual)).to.not.throw()
        })

        it("throws when the DSL field example function fails", () => {
            const expected = {
                value: field("Value info", (val) => {
                    if (val !== 42) {
                        throw new Error("Value is not 42")
                    }
                }),
            }
            const actual = { value: -10 }
            expect(() => validateResponse(expected, actual)).to.throw("Value is not 42")
        })

        it("does not throw when a DSL field with null matches", () => {
            const expected = {
                value: field("Null value", null),
            }
            const actual = { value: null }
            expect(() => validateResponse(expected, actual)).to.not.throw()
        })

        it("throws when a DSL field with null differs", () => {
            const expected = {
                value: field("Null value", null),
            }
            const actual = { value: "not null" }
            expect(() => validateResponse(expected, actual)).to.throw(
                "Expected response body[value] to be null but got not null",
            )
        })

        it("does not throw when null values match in plain objects", () => {
            const expected = { value: null }
            const actual = { value: null }
            expect(() => validateResponse(expected, actual)).to.not.throw()
        })

        it("throws when null values differ in plain objects", () => {
            const expected = { value: null }
            const actual = { value: "not null" }
            expect(() => validateResponse(expected, actual)).to.throw(
                "Expected response body[value] to be null but got not null",
            )
        })
    })

    describe("for nested data structures", () => {
        it("does not throw when nested structures match", () => {
            const expected = {
                data: field("Search result", {
                    id: field("pk", {
                        items: field("Detailed items", ["C", "D"]),
                    }),
                }),
            }
            const actual = {
                data: field("Search result", {
                    id: field("pk", {
                        items: field("Detailed items", ["C", "D"]),
                    }),
                }),
            }
            expect(() => validateResponse(expected, actual)).to.not.throw()
        })

        it("throws when nested structures differ", () => {
            const expected = {
                data: [
                    { id: 1, items: ["A", "B"] },
                    { id: 2, items: ["C", "D"] },
                ],
            }
            const actual = {
                data: [
                    { id: 1, items: ["A", "B"] },
                    { id: "invalid value", items: ["C", "D"] },
                ],
            }
            expect(() => validateResponse(expected, actual)).to.throw(
                "Expected response body[data[1].id] to be 2 but got invalid value",
            )
        })
    })
})
