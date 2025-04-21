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

import { assert } from "chai"
import { OpenAPIGenerator } from "../../../dsl/generator/OpenAPIGenerator"
import { TestResult } from "../../../dsl/generator/types/TestResult"
import { HttpMethod } from "../../../dsl/enums"

describe("OpenAPIGenerator", () => {
    let generator: OpenAPIGenerator
    let originalGetInstance: any

    before(() => {
        originalGetInstance = OpenAPIGenerator.getInstance
    })

    beforeEach(() => {
        Object.defineProperty(OpenAPIGenerator, "instance", { value: null, writable: true })
        generator = OpenAPIGenerator.getInstance()
    })

    afterEach(() => {
        Object.defineProperty(OpenAPIGenerator, "instance", { value: null, writable: true })
    })

    after(() => {
        Object.defineProperty(OpenAPIGenerator, "getInstance", { value: originalGetInstance })
    })

    describe("응답 본문 처리", () => {
        it("204 No Content 응답을 올바르게 처리해야 한다", () => {
            const testResult: TestResult = {
                method: HttpMethod.DELETE,
                url: "/test/resource",
                options: { tag: "Test" },
                request: {},
                response: {
                    status: 204,
                },
                testSuiteDescription: "리소스가 성공적으로 삭제됨",
            }

            generator.collectTestResult(testResult)
            const spec = generator.generateOpenAPISpec() as any

            assert.isDefined(spec.paths["/test/resource"].delete.responses["204"])
            assert.isUndefined(spec.paths["/test/resource"].delete.responses["204"].content)
            assert.equal(
                spec.paths["/test/resource"].delete.responses["204"].description,
                "리소스가 성공적으로 삭제됨",
            )
        })

        it("304 Not Modified 응답을 올바르게 처리해야 한다", () => {
            const testResult: TestResult = {
                method: HttpMethod.GET,
                url: "/test/cached",
                options: { tag: "Test" },
                request: {
                    headers: {
                        "If-Not-Modified-Since": "Mon, 1 Jan 2023 00:00:00 GMT",
                    },
                },
                response: {
                    status: 304,
                },
                testSuiteDescription: "리소스가 수정되지 않음",
            }

            generator.collectTestResult(testResult)
            const spec = generator.generateOpenAPISpec() as any

            assert.isDefined(spec.paths["/test/cached"].get.responses["304"])
            assert.isUndefined(spec.paths["/test/cached"].get.responses["304"].content)
            assert.equal(
                spec.paths["/test/cached"].get.responses["304"].description,
                "리소스가 수정되지 않음",
            )
        })

        it("상태 코드와 관계없이 본문이 없는 응답을 올바르게 처리해야 한다", () => {
            const testResult: TestResult = {
                method: HttpMethod.HEAD,
                url: "/test/head",
                options: { tag: "Test" },
                request: {},
                response: {
                    status: 200,
                },
                testSuiteDescription: "리소스 존재 여부 확인",
            }

            generator.collectTestResult(testResult)
            const spec = generator.generateOpenAPISpec() as any

            assert.isDefined(spec.paths["/test/head"].head.responses["200"])
            assert.isUndefined(spec.paths["/test/head"].head.responses["200"].content)
            assert.equal(
                spec.paths["/test/head"].head.responses["200"].description,
                "리소스 존재 여부 확인",
            )
        })
    })
})
