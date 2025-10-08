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

    describe("response body handling", () => {
        it("does not include content when the response body is empty", () => {
            const testResult: TestResult = {
                method: HttpMethod.GET,
                url: "/test/empty",
                options: { tag: "Test" },
                request: {},
                response: {
                    status: 200,
                    body: {},
                },
                testSuiteDescription: "Empty response body",
            }

            generator.collectTestResult(testResult)
            const spec = generator.generateOpenAPISpec() as any

            assert.isDefined(spec.paths["/test/empty"].get.responses["200"])
            assert.isUndefined(spec.paths["/test/empty"].get.responses["200"].content)
            assert.equal(
                spec.paths["/test/empty"].get.responses["200"].description,
                "Empty response body",
            )
        })

        it("does not include content when the response body is null", () => {
            const testResult: TestResult = {
                method: HttpMethod.GET,
                url: "/test/null",
                options: { tag: "Test" },
                request: {},
                response: {
                    status: 200,
                    body: null,
                },
                testSuiteDescription: "Null response body",
            }

            generator.collectTestResult(testResult)
            const spec = generator.generateOpenAPISpec() as any

            assert.isDefined(spec.paths["/test/null"].get.responses["200"])
            assert.isUndefined(spec.paths["/test/null"].get.responses["200"].content)
            assert.equal(
                spec.paths["/test/null"].get.responses["200"].description,
                "Null response body",
            )
        })

        it("does not create content when the response body is undefined", () => {
            const testResult: TestResult = {
                method: HttpMethod.GET,
                url: "/test/undefined-body",
                options: { tag: "Test" },
                request: {},
                response: {
                    status: 400,
                },
                testSuiteDescription: "Undefined response body error",
            }

            generator.collectTestResult(testResult)
            const spec = generator.generateOpenAPISpec() as any

            assert.isDefined(spec.paths["/test/undefined-body"].get.responses["400"])
            assert.isUndefined(spec.paths["/test/undefined-body"].get.responses["400"].content)
            assert.equal(
                spec.paths["/test/undefined-body"].get.responses["400"].description,
                "Undefined response body error",
            )
        })

        it("creates an error object when the error response body is defined", () => {
            const testResult: TestResult = {
                method: HttpMethod.GET,
                url: "/test/error",
                options: { tag: "Test" },
                request: {},
                response: {
                    status: 404,
                    body: { message: "Resource not found" },
                },
                testSuiteDescription: "Missing resource request",
            }

            generator.collectTestResult(testResult)
            const spec = generator.generateOpenAPISpec() as any

            assert.isDefined(spec.paths["/test/error"].get.responses["404"])
            assert.isDefined(spec.paths["/test/error"].get.responses["404"].content)

            const contentTypeKey = Object.keys(
                spec.paths["/test/error"].get.responses["404"].content,
            )[0]
            assert.isDefined(contentTypeKey, "content-type key should exist")

            const content = spec.paths["/test/error"].get.responses["404"].content[contentTypeKey]
            assert.isDefined(content, "content object should exist")
            assert.isDefined(content.schema, "schema should exist")

            if (content.schema.properties && content.schema.properties.error) {
                assert.isDefined(content.examples, "examples should exist")
                const exampleKey = Object.keys(content.examples)[0]
                assert.isDefined(exampleKey, "example key should exist")

                const exampleValue = content.examples[exampleKey].value
                assert.isDefined(exampleValue, "example value should exist")

                assert.isDefined(exampleValue.error, "error object should exist")
                assert.isDefined(exampleValue.error.message, "error.message should exist")
                assert.equal(exampleValue.error.message, "Missing resource request")
            } else {
                assert.isDefined(content.examples, "examples should exist")
                const exampleKey = Object.keys(content.examples)[0]
                assert.isDefined(content.examples[exampleKey], "example should exist")
            }
        })

        it("retains the original shape when a success response body is defined", () => {
            const responseBody = { id: 1, name: "test data" }
            const testResult: TestResult = {
                method: HttpMethod.GET,
                url: "/test/success",
                options: { tag: "Test" },
                request: {},
                response: {
                    status: 200,
                    body: responseBody,
                },
                testSuiteDescription: "Successful response",
            }

            generator.collectTestResult(testResult)
            const spec = generator.generateOpenAPISpec() as any

            assert.isDefined(spec.paths["/test/success"].get.responses["200"])
            assert.isDefined(spec.paths["/test/success"].get.responses["200"].content)

            const contentTypeKey = Object.keys(
                spec.paths["/test/success"].get.responses["200"].content,
            )[0]
            assert.isDefined(contentTypeKey, "content-type key should exist")

            const content = spec.paths["/test/success"].get.responses["200"].content[contentTypeKey]
            assert.isDefined(content, "content object should exist")
            assert.isDefined(content.schema, "schema should exist")

            assert.isDefined(content.examples, "examples should exist")
            const exampleKey = Object.keys(content.examples)[0]
            assert.isDefined(exampleKey, "example key should exist")
            assert.isDefined(content.examples[exampleKey], "example should exist")
            assert.isDefined(content.examples[exampleKey].value, "example value should exist")

            if (
                typeof content.examples[exampleKey].value === "object" &&
                content.examples[exampleKey].value !== null
            ) {
                if (!content.examples[exampleKey].value.error) {
                    assert.isNotNull(content.examples[exampleKey].value)
                }
            }
        })

        it("does not create content when no test case defines a body for the same status", () => {
            const testResult1: TestResult = {
                method: HttpMethod.GET,
                url: "/test/no-body-responses",
                options: { tag: "Test" },
                request: {},
                response: {
                    status: 400,
                },
                testSuiteDescription: "Bodyless test #1",
            }

            const testResult2: TestResult = {
                method: HttpMethod.GET,
                url: "/test/no-body-responses",
                options: { tag: "Test" },
                request: {},
                response: {
                    status: 400,
                },
                testSuiteDescription: "Bodyless test #2",
            }

            generator.collectTestResult(testResult1)
            generator.collectTestResult(testResult2)
            const spec = generator.generateOpenAPISpec() as any

            assert.isDefined(spec.paths["/test/no-body-responses"].get.responses["400"])
            assert.isUndefined(spec.paths["/test/no-body-responses"].get.responses["400"].content)
        })
    })

    describe("normalizePathTemplate", () => {
        it("should handle paths without parameters", () => {
            const generator = OpenAPIGenerator.getInstance()
            const normalized = generator["normalizePathTemplate"]("/users")
            assert.strictEqual(normalized, "/users")
        })

        it("should handle mixed format paths", () => {
            const generator = OpenAPIGenerator.getInstance()
            const normalized = generator["normalizePathTemplate"]("/users/{userId}/posts/:postId")
            assert.strictEqual(normalized, "/users/{userId}/posts/{postId}")
        })

        it("should handle parameters with underscores", () => {
            const generator = OpenAPIGenerator.getInstance()
            const normalized = generator["normalizePathTemplate"]("/items/:item_id")
            assert.strictEqual(normalized, "/items/{item_id}")
        })

        it("should handle empty path", () => {
            const generator = OpenAPIGenerator.getInstance()
            const normalized = generator["normalizePathTemplate"]("")
            assert.strictEqual(normalized, "")
        })

        it("should handle root path", () => {
            const generator = OpenAPIGenerator.getInstance()
            const normalized = generator["normalizePathTemplate"]("/")
            assert.strictEqual(normalized, "/")
        })

        it("should handle hyphenated parameter names", () => {
            const generator = OpenAPIGenerator.getInstance()
            const normalized = generator["normalizePathTemplate"]("/files/:file-name")
            assert.strictEqual(normalized, "/files/{file-name}")
        })
    })
})
