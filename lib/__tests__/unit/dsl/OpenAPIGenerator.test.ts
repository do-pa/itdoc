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
        it("응답 본문이 비어있으면 content를 포함하지 않아야 한다", () => {
            const testResult: TestResult = {
                method: HttpMethod.GET,
                url: "/test/empty",
                options: { tag: "Test" },
                request: {},
                response: {
                    status: 200,
                    body: {},
                },
                testSuiteDescription: "빈 응답 본문",
            }

            generator.collectTestResult(testResult)
            const spec = generator.generateOpenAPISpec() as any

            assert.isDefined(spec.paths["/test/empty"].get.responses["200"])
            assert.isUndefined(spec.paths["/test/empty"].get.responses["200"].content)
            assert.equal(spec.paths["/test/empty"].get.responses["200"].description, "빈 응답 본문")
        })

        it("응답 본문이 null이면 content를 포함하지 않아야 한다", () => {
            const testResult: TestResult = {
                method: HttpMethod.GET,
                url: "/test/null",
                options: { tag: "Test" },
                request: {},
                response: {
                    status: 200,
                    body: null,
                },
                testSuiteDescription: "null 응답 본문",
            }

            generator.collectTestResult(testResult)
            const spec = generator.generateOpenAPISpec() as any

            assert.isDefined(spec.paths["/test/null"].get.responses["200"])
            assert.isUndefined(spec.paths["/test/null"].get.responses["200"].content)
            assert.equal(
                spec.paths["/test/null"].get.responses["200"].description,
                "null 응답 본문",
            )
        })

        it("응답 본문이 명시적으로 정의되지 않으면 content가 생성되지 않아야 한다", () => {
            const testResult: TestResult = {
                method: HttpMethod.GET,
                url: "/test/undefined-body",
                options: { tag: "Test" },
                request: {},
                response: {
                    status: 400,
                },
                testSuiteDescription: "응답 본문 미정의 에러",
            }

            generator.collectTestResult(testResult)
            const spec = generator.generateOpenAPISpec() as any

            assert.isDefined(spec.paths["/test/undefined-body"].get.responses["400"])
            assert.isUndefined(spec.paths["/test/undefined-body"].get.responses["400"].content)
            assert.equal(
                spec.paths["/test/undefined-body"].get.responses["400"].description,
                "응답 본문 미정의 에러",
            )
        })

        it("명시적으로 응답 본문이 정의된 에러 응답은 error 객체 구조로 생성되어야 한다", () => {
            const testResult: TestResult = {
                method: HttpMethod.GET,
                url: "/test/error",
                options: { tag: "Test" },
                request: {},
                response: {
                    status: 404,
                    body: { message: "리소스를 찾을 수 없습니다" },
                },
                testSuiteDescription: "존재하지 않는 리소스 요청",
            }

            generator.collectTestResult(testResult)
            const spec = generator.generateOpenAPISpec() as any

            assert.isDefined(spec.paths["/test/error"].get.responses["404"])
            assert.isDefined(spec.paths["/test/error"].get.responses["404"].content)

            const contentTypeKey = Object.keys(
                spec.paths["/test/error"].get.responses["404"].content,
            )[0]
            assert.isDefined(contentTypeKey, "content-type 키가 존재해야 합니다")

            const content = spec.paths["/test/error"].get.responses["404"].content[contentTypeKey]
            assert.isDefined(content, "content 객체가 존재해야 합니다")
            assert.isDefined(content.schema, "schema가 존재해야 합니다")

            if (content.schema.properties && content.schema.properties.error) {
                assert.isDefined(content.examples, "examples가 존재해야 합니다")
                const exampleKey = Object.keys(content.examples)[0]
                assert.isDefined(exampleKey, "example 키가 존재해야 합니다")

                const exampleValue = content.examples[exampleKey].value
                assert.isDefined(exampleValue, "example 값이 존재해야 합니다")

                assert.isDefined(exampleValue.error, "error 객체가 존재해야 합니다")
                assert.isDefined(exampleValue.error.message, "error.message가 존재해야 합니다")
                assert.equal(exampleValue.error.message, "존재하지 않는 리소스 요청")
            } else {
                assert.isDefined(content.examples, "examples가 존재해야 합니다")
                const exampleKey = Object.keys(content.examples)[0]
                assert.isDefined(content.examples[exampleKey], "example이 존재해야 합니다")
            }
        })

        it("명시적으로 응답 본문이 정의된 성공 응답은 원본 응답 구조를 유지해야 한다", () => {
            const responseBody = { id: 1, name: "테스트 데이터" }
            const testResult: TestResult = {
                method: HttpMethod.GET,
                url: "/test/success",
                options: { tag: "Test" },
                request: {},
                response: {
                    status: 200,
                    body: responseBody,
                },
                testSuiteDescription: "성공적인 응답",
            }

            generator.collectTestResult(testResult)
            const spec = generator.generateOpenAPISpec() as any

            assert.isDefined(spec.paths["/test/success"].get.responses["200"])
            assert.isDefined(spec.paths["/test/success"].get.responses["200"].content)

            const contentTypeKey = Object.keys(
                spec.paths["/test/success"].get.responses["200"].content,
            )[0]
            assert.isDefined(contentTypeKey, "content-type 키가 존재해야 합니다")

            const content = spec.paths["/test/success"].get.responses["200"].content[contentTypeKey]
            assert.isDefined(content, "content 객체가 존재해야 합니다")
            assert.isDefined(content.schema, "schema가 존재해야 합니다")

            assert.isDefined(content.examples, "examples가 존재해야 합니다")
            const exampleKey = Object.keys(content.examples)[0]
            assert.isDefined(exampleKey, "example 키가 존재해야 합니다")
            assert.isDefined(content.examples[exampleKey], "example이 존재해야 합니다")
            assert.isDefined(content.examples[exampleKey].value, "example 값이 존재해야 합니다")

            if (
                typeof content.examples[exampleKey].value === "object" &&
                content.examples[exampleKey].value !== null
            ) {
                if (!content.examples[exampleKey].value.error) {
                    assert.isNotNull(content.examples[exampleKey].value)
                }
            }
        })

        it("동일한 상태 코드에 대해 모든 테스트 케이스가 본문을 정의하지 않으면 content가 생성되지 않아야 한다", () => {
            const testResult1: TestResult = {
                method: HttpMethod.GET,
                url: "/test/no-body-responses",
                options: { tag: "Test" },
                request: {},
                response: {
                    status: 400,
                },
                testSuiteDescription: "본문 없는 테스트 1",
            }

            const testResult2: TestResult = {
                method: HttpMethod.GET,
                url: "/test/no-body-responses",
                options: { tag: "Test" },
                request: {},
                response: {
                    status: 400,
                },
                testSuiteDescription: "본문 없는 테스트 2",
            }

            generator.collectTestResult(testResult1)
            generator.collectTestResult(testResult2)
            const spec = generator.generateOpenAPISpec() as any

            assert.isDefined(spec.paths["/test/no-body-responses"].get.responses["400"])
            assert.isUndefined(spec.paths["/test/no-body-responses"].get.responses["400"].content)
        })
    })
})
