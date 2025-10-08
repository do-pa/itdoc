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

import supertest from "supertest"
import { HttpAdapter, HttpClient, RequestBuilder, CapturedResponse } from "../types"
import { CaptureContext } from "../../core/CaptureContext"
import type { CapturedRequest } from "../../types"

export class SupertestAdapter implements HttpAdapter<any> {
    public create(app: any): HttpClient {
        return new SupertestClient(supertest(app) as any)
    }
}

class SupertestClient implements HttpClient {
    public constructor(private agent: any) {}

    public get(url: string) {
        return new SupertestRequestBuilder(this.agent.get(url), "GET", url)
    }
    public post(url: string) {
        return new SupertestRequestBuilder(this.agent.post(url), "POST", url)
    }
    public put(url: string) {
        return new SupertestRequestBuilder(this.agent.put(url), "PUT", url)
    }
    public patch(url: string) {
        return new SupertestRequestBuilder(this.agent.patch(url), "PATCH", url)
    }
    public delete(url: string) {
        return new SupertestRequestBuilder(this.agent.delete(url), "DELETE", url)
    }
    public head(url: string) {
        return new SupertestRequestBuilder(this.agent.head(url), "HEAD", url)
    }
    public options(url: string) {
        return new SupertestRequestBuilder(this.agent.options(url), "OPTIONS", url)
    }
}

class SupertestRequestBuilder implements RequestBuilder {
    private capturedData: Partial<CapturedRequest> = {}

    public constructor(
        private test: any,
        method: string,
        url: string,
    ) {
        if (CaptureContext.isActive()) {
            this.capturedData = { method, url }
            CaptureContext.addRequest(this.capturedData as any)
        }
    }

    public send(body: any): this {
        this.test.send(body)
        if (CaptureContext.isActive()) {
            CaptureContext.updateLastRequest({ body })
        }
        return this
    }

    public set(field: string | Record<string, string>, value?: string): this {
        if (typeof field === "string") {
            this.test.set(field, value!)
            if (CaptureContext.isActive()) {
                const headers = { [field]: value! }
                this.updateHeaders(headers)
            }
        } else {
            this.test.set(field)
            if (CaptureContext.isActive()) {
                this.updateHeaders(field)
            }
        }
        return this
    }

    public query(params: Record<string, any>): this {
        this.test.query(params)
        if (CaptureContext.isActive()) {
            CaptureContext.updateLastRequest({ queryParams: params })
        }
        return this
    }

    public attach(field: string, file: string | Buffer, filename?: string): this {
        this.test.attach(field, file, filename)
        if (CaptureContext.isActive()) {
            const store = CaptureContext.getStore()
            const requests = store?.capturedRequests || []
            const lastReq = requests[requests.length - 1]

            if (lastReq) {
                if (!lastReq.formData) {
                    lastReq.formData = { fields: {}, files: [] }
                }
                lastReq.formData.files.push({
                    field,
                    filename: filename || (typeof file === "string" ? file : "file"),
                })
            }
        }
        return this
    }

    public field(name: string, value: string | number): this {
        this.test.field(name, value)
        if (CaptureContext.isActive()) {
            const store = CaptureContext.getStore()
            const requests = store?.capturedRequests || []
            const lastReq = requests[requests.length - 1]

            if (lastReq) {
                if (!lastReq.formData) {
                    lastReq.formData = { fields: {}, files: [] }
                }
                lastReq.formData.fields[name] = value
            }
        }
        return this
    }

    public auth(username: string, password: string): this {
        this.test.auth(username, password)
        return this
    }

    public bearer(token: string): this {
        return this.set("Authorization", `Bearer ${token}`)
    }

    public timeout(ms: number): this {
        this.test.timeout(ms)
        return this
    }

    public expect(statusOrField: number | string, value?: string | RegExp): this {
        if (typeof statusOrField === "number") {
            this.test.expect(statusOrField)
        } else if (value !== undefined) {
            this.test.expect(statusOrField, value)
        }
        return this
    }

    public then<T = CapturedResponse>(
        onFulfilled?: (response: CapturedResponse) => T,
        onRejected?: (error: any) => any,
    ): Promise<T> {
        return this.test.then(
            (res: any) => {
                const response: CapturedResponse = {
                    status: res.status,
                    statusText: res.statusType || `${res.status}`,
                    headers: res.headers,
                    body: res.body,
                    text: res.text,
                }

                if (CaptureContext.isActive()) {
                    CaptureContext.updateLastRequest({ response })
                }

                return onFulfilled ? onFulfilled(response) : (response as any)
            },
            (error: any) => {
                if (onRejected) return onRejected(error)
                throw error
            },
        )
    }

    public async end(): Promise<CapturedResponse> {
        return this.then()
    }

    private updateHeaders(headers: Record<string, string>) {
        const store = CaptureContext.getStore()
        const requests = store?.capturedRequests || []
        const lastReq = requests[requests.length - 1]
        if (lastReq) {
            lastReq.headers = { ...lastReq.headers, ...headers }
        }
    }
}
