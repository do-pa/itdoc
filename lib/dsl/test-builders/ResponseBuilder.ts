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

import { HttpStatus } from "../enums"
import { DSLField } from "../interface"
import supertest, { Response } from "supertest"
import { validateResponse } from "./validateResponse"
import { isDSLField } from "../interface/field"
import { AbstractTestBuilder } from "./AbstractTestBuilder"
import { resultCollector, testEventManager } from "../generator"
import logger from "../../config/logger"

/**
 * API 응답을 검증하기 위한 결과값을 설정하는 빌더 클래스입니다.
 */
export class ResponseBuilder extends AbstractTestBuilder {
    public status(status: HttpStatus | number): this {
        this.config.expectedStatus = status
        return this
    }

    public header(headers: Record<string, string | DSLField<string>>): this {
        this.config.expectedResponseHeaders = headers
        return this
    }

    public body(body: Record<string, DSLField>): this {
        this.config.expectedResponseBody = body
        return this
    }

    private async runTest(): Promise<Response> {
        logger.debug(`runTest: ${this.method} ${this.url}`)
        if (!this.config.expectedStatus) {
            throw new Error("Expected status is required")
        }
        let finalUrl = this.url
        for (const [key, fieldObj] of Object.entries(this.config.pathParams || {})) {
            const paramValue = isDSLField(fieldObj) ? String(fieldObj.example) : String(fieldObj)
            finalUrl = finalUrl.replace(`{${key}}`, encodeURIComponent(paramValue))
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

        for (const [key, headerObj] of Object.entries(this.config.requestHeaders || {})) {
            const headerValue = isDSLField(headerObj) ? headerObj.example : headerObj
            if (typeof headerValue === "string") {
                req.set(key, headerValue)
            }
        }
        const queryParams: Record<string, any> = {}
        for (const [key, value] of Object.entries(this.config.queryParams || {})) {
            queryParams[key] = isDSLField(value) ? value.example : value
        }
        req = req.query(queryParams)

        const body: Record<string, any> = {}
        for (const [key, fieldObj] of Object.entries(this.config.requestBody || {})) {
            body[key] = isDSLField(fieldObj) ? fieldObj.example : fieldObj
        }
        req = req.send(body)

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
        } else {
            req = req.expect((res: Response) => {
                if (Object.keys(res.body ?? {}).length > 0) {
                    const formattedBody = JSON.stringify(res.body, null, 2)
                    logger.debug(`Response body is required. Response Body:${formattedBody}`)
                    throw new Error(
                        `Expected response body is required. Response Body:${formattedBody}`,
                    )
                }
            })
        }
        if (this.config.expectedResponseHeaders) {
            req = req.expect((res: Response) => {
                for (const [headerName, headerValue] of Object.entries(
                    this.config.expectedResponseHeaders!,
                )) {
                    const expectedHeaderValue = isDSLField(headerValue)
                        ? headerValue.example
                        : headerValue
                    const actualHeaderValue = res.headers[headerName.toLowerCase()]
                    if (expectedHeaderValue !== actualHeaderValue) {
                        logger.debug(
                            `Expected response header "${headerName}" to be "${expectedHeaderValue}", but got "${actualHeaderValue}"`,
                        )
                        throw new Error(
                            `Expected response header "${headerName}" to be "${expectedHeaderValue}", but got "${actualHeaderValue}"`,
                        )
                    }
                }
            })
        }

        const logToPrint = {
            request: {
                path: finalUrl,
                method: this.method,
                headers: this.config.requestHeaders,
                queryParams: this.config.queryParams,
                pathParams: this.config.pathParams,
                requestBody: this.config.requestBody,
            },
            response: {
                status: 1,
                responseBody: null,
            },
        }
        try {
            const res = await req
            logToPrint.response = {
                status: res.status,
                responseBody: res.body,
            }

            if (this.config.prettyPrint) {
                logger.info("API TEST PASSED", {
                    request: logToPrint.request,
                    response: logToPrint.response,
                })
            }

            resultCollector.collectResult({
                method: this.method,
                url: this.url,
                options: this.config.apiOptions || { name: "", tag: "", summary: "" },
                request: {
                    body: this.config.requestBody,
                    headers: this.prepareHeadersForCollector(this.config.requestHeaders),
                    queryParams: this.config.queryParams,
                    pathParams: this.config.pathParams,
                },
                response: {
                    status: res.status,
                    body: this.config.expectedResponseBody || res.body, // 검증을 위한 예상 응답 본문을 우선으로 사용
                    headers: res.headers,
                },
            })
            return res
        } catch (error: any) {
            if (this.config.prettyPrint) {
                logger.info("API TEST FAILED", {
                    request: logToPrint.request,
                    error: error.response ? error.response : error.message,
                })
            }
            // 테스트 실패를 기록하여 OAS 생성 방지
            testEventManager.completeTestFailure()
            throw error
        }
    }

    private prepareHeadersForCollector(
        headers?: Record<string, string | DSLField<string>>,
    ): Record<string, string> | undefined {
        if (!headers) return undefined

        const result: Record<string, string> = {}
        for (const [key, value] of Object.entries(headers)) {
            result[key] = isDSLField(value) ? String(value.example) : String(value)
        }
        return result
    }

    public then<TResult1 = Response, TResult2 = never>(
        resolve?: ((value: Response) => TResult1 | PromiseLike<TResult1>) | null,
        reject?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null,
    ): Promise<TResult1 | TResult2> {
        return this.runTest().then(resolve, reject)
    }
}
