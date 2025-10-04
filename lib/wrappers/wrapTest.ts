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

import { TestEventManager } from "../dsl/generator/TestEventManager"
import { TestResultCollector } from "../dsl/generator/TestResultCollector"
import { CaptureContext } from "./core/CaptureContext"
import { TestResult } from "../dsl/generator/types/TestResult"
import { HttpMethod } from "../dsl/enums/HttpMethod"
import { ApiDocMetadata, ItFunction, TestFunction, WrappedTestFunction } from "./types"

/**
 * Wrap a test framework's 'it' function to automatically capture HTTP requests/responses
 * and generate API documentation from successful tests
 *
 * @param originalIt - The test framework's 'it' function (from Jest or Mocha)
 * @returns A wrapped test function with automatic capturing capabilities
 *
 * @example
 * ```typescript
 * import { wrapTest, request } from 'itdoc/wrappers'
 *
 * const apiTest = wrapTest(it)
 *
 * describe('User API', () => {
 *   apiTest('should create user', async () => {
 *     const res = await request(app)
 *       .post('/users')
 *       .send({ name: 'John' })
 *
 *     expect(res.status).toBe(201)
 *   })
 * })
 * ```
 */
export function wrapTest(originalIt: ItFunction): WrappedTestFunction {
    const testEventManager = TestEventManager.getInstance()
    const collector = TestResultCollector.getInstance()

    /**
     * Internal wrapper that executes the test with capturing
     */
    const executeTest = (
        description: string,
        testFn: TestFunction,
        metadata?: ApiDocMetadata,
    ): void => {
        // Register test with event manager
        testEventManager.registerTest()

        // Execute test with original 'it' function
        originalIt(description, async () => {
            let captured: any[] = []

            try {
                // Run test within capture context
                await CaptureContext.run(description, metadata, async () => {
                    await testFn()
                    // IMPORTANT: Get captured requests INSIDE the context
                    captured = CaptureContext.getCapturedRequests()
                })

                for (const req of captured) {
                    // Only collect requests that have responses (successful requests)
                    if (req.response) {
                        const testResult: TestResult = {
                            method: req.method as HttpMethod,
                            url: req.url!,
                            options: {
                                summary: metadata?.summary,
                                description: metadata?.description || description,
                                tag: metadata?.tags?.[0], // Use first tag for compatibility with ApiDocOptions
                            },
                            request: {
                                body: req.body,
                                headers: req.headers,
                                queryParams: req.queryParams,
                                pathParams: req.pathParams,
                            },
                            response: {
                                status: req.response.status,
                                body: req.response.body,
                                headers: req.response.headers,
                            },
                            testSuiteDescription: description,
                        }

                        collector.collectResult(testResult)
                    }
                }

                testEventManager.completeTestSuccess()
            } catch (error) {
                testEventManager.completeTestFailure()
                throw error
            }
        })
    }

    /**
     * Main wrapped test function
     */
    const wrapped = (description: string, testFn: TestFunction): void => {
        executeTest(description, testFn)
    }

    /**
     * Method to add metadata to the test
     */
    wrapped.withMeta = (metadata: ApiDocMetadata) => {
        return (description: string, testFn: TestFunction): void => {
            executeTest(description, testFn, metadata)
        }
    }

    return wrapped as WrappedTestFunction
}
