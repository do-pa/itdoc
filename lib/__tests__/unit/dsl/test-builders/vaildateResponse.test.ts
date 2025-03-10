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

describe("validateResponse 함수 검증", () => {
    describe("field를 사용하지 않는 경우", () => {
        it("단순 원시 타입이 올바른 경우 에러가 발생하지 않아야 한다", () => {
            const expected = { a: 1, b: "테스트", c: true }
            const actual = { a: 1, b: "테스트", c: true }
            expect(() => validateResponse(expected, actual)).to.not.throw()
        })
        ;[
            {
                expected: {
                    a: 1,
                },
                actual: {
                    a: 2,
                },
                throwMessage: "Expected response body[a] to be 1 but got 2",
            },
            {
                expected: {
                    a: true,
                },
                actual: {
                    a: false,
                },
                throwMessage: "Expected response body[a] to be true but got false",
            },
            {
                expected: {
                    a: "a",
                },
                actual: {
                    a: "b",
                },
                throwMessage: "Expected response body[a] to be a but got b",
            },
        ].forEach((obj) => {
            it("원시타입에 대해서 값이 불일치하면 에러가 발생해야 한다.", () => {
                const { expected, actual, throwMessage } = obj
                expect(() => validateResponse(expected, actual)).to.throw(throwMessage)
            })
        })

        it("중첩 객체가 올바른 경우 에러가 발생하지 않아야 한다", () => {
            const expected = {
                사용자: {
                    id: 1,
                    이름: "철수",
                },
            }
            const actual = {
                사용자: {
                    id: 1,
                    이름: "철수",
                },
            }
            expect(() => validateResponse(expected, actual)).to.not.throw()
        })

        it("중첩 객체의 값이 불일치하면 에러가 발생해야 한다", () => {
            const expected = {
                사용자: {
                    id: 1,
                    이름: "철수",
                },
            }
            const actual = {
                사용자: {
                    id: 1,
                    이름: "영희",
                },
            }
            expect(() => validateResponse(expected, actual)).to.throw(
                "Expected response body[사용자.이름] to be 철수 but got 영희",
            )
        })

        it("배열이 올바른 경우 에러가 발생하지 않아야 한다", () => {
            const expected = { 목록: [1, 2, 3] }
            const actual = { 목록: [1, 2, 3] }
            expect(() => validateResponse(expected, actual)).to.not.throw()
        })

        it("배열 길이가 다르면 에러가 발생해야 한다", () => {
            const expected = { 목록: [1, 2, 3] }
            const actual = { 목록: [1, 2] }
            expect(() => validateResponse(expected, actual)).to.throw(
                "Expected response body[목록] to have length 3 but got 2",
            )
        })
    })

    describe("field 객체를 사용한 경우", () => {
        it("DSL 필드의 example 함수 happy case", () => {
            const expected = {
                값: field("값 정보", (val) => {
                    if (val !== 42) {
                        throw new Error("값이 42가 아닙니다")
                    }
                }),
            }
            const actual = { 값: 42 }
            expect(() => validateResponse(expected, actual)).to.not.throw()
        })

        it("DSL 필드의 example 함수 검증이 실패하면 에러가 발생해야 한다", () => {
            const expected = {
                값: field("값 정보", (val) => {
                    if (val !== 42) {
                        throw new Error("값이 42가 아닙니다")
                    }
                }),
            }
            const actual = { 값: -10 }
            expect(() => validateResponse(expected, actual)).to.throw("값이 42가 아닙니다")
        })
    })

    describe("중첩 데이터 구조의 경우", () => {
        it("중첩 구조에서 데이터가 똑같은 경우 에러가 발생하지 않는다.", () => {
            const expected = {
                데이터: field("검색 결과", {
                    id: field("pk", {
                        항목: field("세부 항목", ["다", "라"]),
                    }),
                }),
            }
            const actual = {
                데이터: field("검색 결과", {
                    id: field("pk", {
                        항목: field("세부 항목", ["다", "라"]),
                    }),
                }),
            }
            expect(() => validateResponse(expected, actual)).to.not.throw()
        })

        it("중첩 구조에서 값이 다르면 에러가 발생한다.", () => {
            const expected = {
                데이터: [
                    { id: 1, 항목: ["가", "나"] },
                    { id: 2, 항목: ["다", "라"] },
                ],
            }
            const actual = {
                데이터: [
                    { id: 1, 항목: ["가", "나"] },
                    { id: "잘못된 값", 항목: ["다", "라"] },
                ],
            }
            expect(() => validateResponse(expected, actual)).to.throw(
                "Expected response body[데이터[1].id] to be 2 but got 잘못된 값",
            )
        })
    })
})
