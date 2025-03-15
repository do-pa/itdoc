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

import { TestCaseConfig } from "./TestCaseConfig"
import { HttpMethod, HttpStatus } from "../enums"
import { DSLField } from "../interface"
import supertest from "supertest"
import { validateResponse } from "./validateResponse"
import { isDSLField } from "../interface/field"

export class ResponseBuilder {
    private config: TestCaseConfig
    private readonly method: HttpMethod
    private readonly url: string
    private readonly app: any

    public constructor(defaults: TestCaseConfig = {}, method: HttpMethod, url: string, app: any) {
        this.config = { ...defaults }
        this.method = method
        this.url = url
        this.app = app
    }

    public status(status: HttpStatus | number): this {
        this.config.expectedStatus = status
        return this
    }

    // public header(headers: Record<string, string>): this {
    //   TODO: expectHeader 구현
    //   this.config.expectedHeaders = headers
    //   return this
    // }

    public body(body: Record<string, DSLField>): this {
        this.config.expectedResponseBody = body
        return this
    }

    private async runTest(): Promise<Response> {
        if (!this.config.expectedStatus) {
            throw new Error("Expected status is required")
        }
        let finalUrl = this.url
        if (this.config.pathParams) {
            for (const [key, fieldObj] of Object.entries(this.config.pathParams)) {
                let paramValue
                if (isDSLField(fieldObj)) {
                    paramValue = fieldObj.example.toString()
                } else {
                    paramValue = fieldObj.toString
                }
                finalUrl = finalUrl.replace(`{${key}}`, encodeURIComponent(paramValue))
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
                const headerValue = isDSLField(headerObj) ? headerObj.example : headerObj
                if (typeof headerValue === "string") {
                    req.set(key, headerValue)
                }
            }
        }
        if (this.config.queryParams) {
            const queryParams: Record<string, any> = {}
            for (const [key, value] of Object.entries(this.config.queryParams)) {
                queryParams[key] = isDSLField(value) ? value.example : value
            }
            req = req.query(queryParams)
        }
        if (this.config.requestBody) {
            const body: Record<string, any> = {}
            for (const [key, fieldObj] of Object.entries(this.config.requestBody)) {
                body[key] = isDSLField(fieldObj) ? fieldObj.example : fieldObj
            }
            req = req.send(body)
        }
        if (this.config.expectedStatus) {
            req = req.expect(this.config.expectedStatus)
        }
        if (this.config.expectedResponseBody) {
            const expectedBody: Record<string, any> = {}
            for (const [key, fieldObj] of Object.entries(this.config.expectedResponseBody)) {
                expectedBody[key] = isDSLField(fieldObj) ? fieldObj.example : fieldObj
            }
            req = req.expect((res: Response) => {
                validateResponse(expectedBody, res.body)
            })
        }
        if (!this.config.expectedResponseBody) {
            req = req.expect((res: Response) => {
                if (Object.keys(res.body ?? {}).length > 0) {
                    const formattedBody = JSON.stringify(res.body, null, 2)
                    throw new Error(
                        `Expected response body is required.
                    Response Body:${formattedBody}`,
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
            // @ts-expect-error TODO: ignore 사용하지 않도록 코드 수정
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
