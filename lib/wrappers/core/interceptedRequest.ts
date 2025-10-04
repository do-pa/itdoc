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

import originalRequest from "supertest"
import { CaptureContext } from "./CaptureContext"

/**
 * Create an intercepted request function that captures HTTP requests and responses
 * When CaptureContext is active, this function wraps supertest to automatically
 * capture all request/response data for documentation generation
 *
 * @param app Express/Fastify/NestJS app instance
 * @returns Supertest Test instance (possibly wrapped in Proxy)
 */
export function request(app: any) {
    // If context is not active, return original supertest
    if (!CaptureContext.isActive()) {
        return originalRequest(app)
    }

    // Create supertest instance and wrap it with Proxy
    const testInstance = originalRequest(app)
    return createInterceptedTest(testInstance)
}

/**
 * Create a Proxy wrapper for the initial supertest Test object
 * This intercepts HTTP method calls (get, post, put, etc.)
 */
function createInterceptedTest(testObj: any) {
    return new Proxy(testObj, {
        get(target, prop: string) {
            const original = target[prop]

            // Intercept HTTP method calls
            const httpMethods = ["get", "post", "put", "patch", "delete", "head", "options"]

            if (httpMethods.includes(prop)) {
                return (url: string) => {
                    // Start new request capture
                    CaptureContext.addRequest({
                        method: prop.toUpperCase(),
                        url,
                    })

                    // Continue with request chain proxy
                    return createRequestChainProxy(target[prop](url))
                }
            }

            return original
        },
    })
}

/**
 * Create a Proxy wrapper for the supertest request chain
 * This intercepts method calls like .send(), .set(), .query(), etc.
 * and the final .then() to capture the response
 */
function createRequestChainProxy(chainObj: any): any {
    return new Proxy(chainObj, {
        get(target, prop: string) {
            const original = target[prop]

            // Capture request body
            if (prop === "send") {
                return (body: any) => {
                    CaptureContext.updateLastRequest({ body })
                    return createRequestChainProxy(target.send(body))
                }
            }

            // Capture request headers
            if (prop === "set") {
                return (field: string | Record<string, string>, val?: string) => {
                    const headers = typeof field === "string" ? { [field]: val as string } : field

                    const store = CaptureContext.getStore()
                    const requests = store?.capturedRequests || []
                    const lastReq = requests[requests.length - 1]

                    if (lastReq) {
                        lastReq.headers = { ...lastReq.headers, ...headers }
                    }

                    return createRequestChainProxy(target.set(field, val))
                }
            }

            // Capture query parameters
            if (prop === "query") {
                return (params: any) => {
                    CaptureContext.updateLastRequest({ queryParams: params })
                    return createRequestChainProxy(target.query(params))
                }
            }

            // Capture response when promise resolves
            if (prop === "then") {
                return (onFulfilled?: any, onRejected?: any) => {
                    return target.then((res: any) => {
                        // Capture response data
                        CaptureContext.updateLastRequest({
                            response: {
                                status: res.status,
                                body: res.body,
                                headers: res.headers,
                            },
                        })

                        return onFulfilled?.(res)
                    }, onRejected)
                }
            }

            // For other methods, maintain the chain
            if (typeof original === "function") {
                return (...args: any[]) => {
                    const result = original.apply(target, args)
                    // If result is the Test object itself, keep proxying
                    return result === target || result?.constructor?.name === "Test"
                        ? createRequestChainProxy(result)
                        : result
                }
            }

            return original
        },
    })
}
