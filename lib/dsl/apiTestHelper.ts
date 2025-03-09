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

/**
 * API 테스트를 위한 헬퍼 클래스와 타입 정의
 * @description
 * API 테스트를 쉽게 구성하고 실행할 수 있도록 도와주는 빌더 패턴 기반의 헬퍼 클래스입니다.
 */

import { HttpMethod, HttpStatus } from "./enums"
import supertest, { Response } from "supertest"
import { DSLField } from "./interface"
import { validateResponse } from "./validateResponse"

export type PATH_PARAM_TYPES = string | number
export type QUERY_PARAM_TYPES = string | number | boolean

export interface APITestConfig {
    pathParams?: Record<string, DSLField<PATH_PARAM_TYPES>>
    queryParams?: Record<string, DSLField<QUERY_PARAM_TYPES>>
    requestBody?: Record<string, DSLField>
    requestHeaders?: Record<string, DSLField<string>>
    expectedStatus?: HttpStatus | number
    expectedResponseBody?: Record<string, DSLField>
    prettyPrint?: boolean
}

export class APITestBuilder {
    private config: APITestConfig
    private readonly method: HttpMethod
    private readonly url: string
    private readonly app: any

    public constructor(defaults: APITestConfig = {}, method: HttpMethod, url: string, app: any) {
        this.config = { ...defaults }
        this.method = method
        this.url = url
        this.app = app
    }

    public withPathParams(params: Record<string, DSLField<string | number>>): this {
        this.config.pathParams = params
        return this
    }

    public withQueryParams(params: Record<string, DSLField<string | number | boolean>>): this {
        this.config.queryParams = params
        return this
    }

    public withRequestBody(body: Record<string, DSLField<any>>): this {
        this.config.requestBody = body
        return this
    }

    public withRequestHeaders(headers: Record<string, DSLField<string>>): this {
        this.config.requestHeaders = headers
        return this
    }

    public withoutHeader(headerName: string): this {
        if (this.config.requestHeaders && this.config.requestHeaders[headerName]) {
            delete this.config.requestHeaders[headerName]
        } else {
            console.warn(`Header "${headerName}" not found`)
        }
        return this
    }

    public expectStatus(status: HttpStatus | number): this {
        this.config.expectedStatus = status
        return this
    }

    public expectResponseBody(body: Record<string, DSLField>): this {
        this.config.expectedResponseBody = body
        return this
    }

    public withPrettyPrint(): this {
        this.config.prettyPrint = true
        return this
    }

    public async runTest(): Promise<Response> {
        if (!this.config.expectedStatus) {
            throw new Error("Expected status is required")
        }
        let finalUrl = this.url
        if (this.config.pathParams) {
            for (const [key, fieldObj] of Object.entries(this.config.pathParams)) {
                finalUrl = finalUrl.replace(
                    `{${key}}`,
                    encodeURIComponent(fieldObj.example.toString()),
                )
            }
        }

        const requestInstance = supertest(this.app)
        let req: supertest.Test

        switch (this.method.toLowerCase()) {
            case "get":
                req = requestInstance.get(finalUrl)
                break
            case "post":
                req = requestInstance.post(finalUrl)
                break
            case "put":
                req = requestInstance.put(finalUrl)
                break
            case "delete":
                req = requestInstance.delete(finalUrl)
                break
            case "patch":
                req = requestInstance.patch(finalUrl)
                break
            default:
                throw new Error(`Unsupported HTTP method: ${this.method}`)
        }

        if (this.config.requestHeaders) {
            for (const [key, headerObj] of Object.entries(this.config.requestHeaders)) {
                const headerValue = headerObj.example
                if (typeof headerValue === "string") {
                    req.set(key, headerValue)
                }
            }
        }
        if (this.config.queryParams) {
            const queryParams: Record<string, any> = {}
            for (const [key, fieldObj] of Object.entries(this.config.queryParams)) {
                queryParams[key] = fieldObj.example
            }
            req = req.query(queryParams)
        }
        if (this.config.requestBody) {
            const body: Record<string, any> = {}
            for (const [key, fieldObj] of Object.entries(this.config.requestBody)) {
                body[key] = fieldObj.example
            }
            req = req.send(body)
        }
        if (this.config.expectedStatus) {
            req = req.expect(this.config.expectedStatus)
        }
        if (this.config.expectedResponseBody) {
            const expectedBody: Record<string, any> = {}
            for (const [key, fieldObj] of Object.entries(this.config.expectedResponseBody)) {
                expectedBody[key] = fieldObj.example
            }
            req = req.expect((res: Response) => {
                validateResponse(expectedBody, res.body)
            })
        }
        if (!this.config.expectedResponseBody) {
            req = req.expect((res: Response) => {
                if (Object.keys(res.body).length > 0) {
                    throw new Error(
                        "Expected response body is required \n    " +
                            JSON.stringify(res.body, null, 2),
                    )
                }
            })
        }
        try {
            const res = await req
            if (this.config.prettyPrint) {
                console.log(`=== API TEST REQUEST ===
              Method: ${this.method}
              URL: ${finalUrl}
              Headers: ${JSON.stringify(this.config.requestHeaders, null, 2)}
              Query Params: ${JSON.stringify(this.config.queryParams, null, 2)}
              Request Body: ${JSON.stringify(this.config.requestBody, null, 2)}
              === API TEST RESPONSE ===
              Status: ${res.status}
              Response Body: ${JSON.stringify(res.body, null, 2)}
              `)
            }
            return res
        } catch (error: any) {
            if (this.config.prettyPrint) {
                console.log(`=== API TEST REQUEST (on Error) ===
              Method: ${this.method}
              URL: ${finalUrl}
              Headers: ${JSON.stringify(this.config.requestHeaders, null, 2)}
              Query Params: ${JSON.stringify(this.config.queryParams, null, 2)}
              Request Body: ${JSON.stringify(this.config.requestBody, null, 2)}
              === API TEST RESPONSE (Error) ===
              ${error.response ? error.response : error.message}
              `)
            }
            throw error
        }
    }

    public then<TResult1 = Response, TResult2 = never>(
        resolve?: ((value: Response) => TResult1 | PromiseLike<TResult1>) | null,
        reject?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null,
    ): Promise<TResult1 | TResult2> {
        return this.runTest().then(resolve, reject)
    }
}
