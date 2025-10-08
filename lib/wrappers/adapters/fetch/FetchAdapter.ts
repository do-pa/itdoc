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

import { HttpAdapter, HttpClient, RequestBuilder, CapturedResponse } from "../types"
import { CaptureContext } from "../../core/CaptureContext"

export interface FetchAdapterConfig {
    baseURL: string
    headers?: Record<string, string>
}

export class FetchAdapter implements HttpAdapter<FetchAdapterConfig> {
    public create(config: FetchAdapterConfig): HttpClient {
        return new FetchClient(config)
    }
}

class FetchClient implements HttpClient {
    public constructor(private config: FetchAdapterConfig) {}

    public get(url: string) {
        return new FetchRequestBuilder(this.config, "GET", url)
    }
    public post(url: string) {
        return new FetchRequestBuilder(this.config, "POST", url)
    }
    public put(url: string) {
        return new FetchRequestBuilder(this.config, "PUT", url)
    }
    public patch(url: string) {
        return new FetchRequestBuilder(this.config, "PATCH", url)
    }
    public delete(url: string) {
        return new FetchRequestBuilder(this.config, "DELETE", url)
    }
    public head(url: string) {
        return new FetchRequestBuilder(this.config, "HEAD", url)
    }
    public options(url: string) {
        return new FetchRequestBuilder(this.config, "OPTIONS", url)
    }
}

class FetchRequestBuilder implements RequestBuilder {
    private init: RequestInit = {}
    private headers: Record<string, string> = {}
    private queryParams: Record<string, any> = {}
    private formDataObj?: any

    public constructor(
        private config: FetchAdapterConfig,
        method: string,
        private url: string,
    ) {
        this.init.method = method
        if (config.headers) {
            this.headers = { ...config.headers }
        }

        if (CaptureContext.isActive()) {
            CaptureContext.addRequest({ method, url })
        }
    }

    public send(body: any): this {
        this.init.body = JSON.stringify(body)
        this.headers["Content-Type"] = "application/json"

        if (CaptureContext.isActive()) {
            CaptureContext.updateLastRequest({ body })
        }
        return this
    }

    public set(field: string | Record<string, string>, value?: string): this {
        if (typeof field === "string") {
            this.headers[field] = value!
        } else {
            Object.assign(this.headers, field)
        }

        if (CaptureContext.isActive()) {
            const headers = typeof field === "string" ? { [field]: value! } : field
            this.updateHeaders(headers)
        }
        return this
    }

    public query(params: Record<string, any>): this {
        Object.assign(this.queryParams, params)
        if (CaptureContext.isActive()) {
            CaptureContext.updateLastRequest({ queryParams: params })
        }
        return this
    }

    public attach(field: string, file: string | Buffer, filename?: string): this {
        if (!this.formDataObj) {
            const FormData = require("form-data")
            this.formDataObj = new FormData()
        }

        if (typeof file === "string") {
            const fs = require("fs")
            this.formDataObj.append(field, fs.createReadStream(file), filename || file)
        } else {
            this.formDataObj.append(field, file, filename || "file")
        }

        this.init.body = this.formDataObj as any
        Object.assign(this.headers, this.formDataObj.getHeaders())

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
        if (!this.formDataObj) {
            const FormData = require("form-data")
            this.formDataObj = new FormData()
        }
        this.formDataObj.append(name, String(value))
        this.init.body = this.formDataObj as any
        Object.assign(this.headers, this.formDataObj.getHeaders())

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
        const token = Buffer.from(`${username}:${password}`).toString("base64")
        return this.set("Authorization", `Basic ${token}`)
    }

    public bearer(token: string): this {
        return this.set("Authorization", `Bearer ${token}`)
    }

    public timeout(_ms: number): this {
        return this
    }

    public expect(_statusOrField: number | string, _value?: string | RegExp): this {
        return this
    }

    public async then<T = CapturedResponse>(
        onFulfilled?: (response: CapturedResponse) => T,
        onRejected?: (error: any) => any,
    ): Promise<T> {
        try {
            let fullURL = `${this.config.baseURL}${this.url}`
            if (Object.keys(this.queryParams).length > 0) {
                const queryString = new URLSearchParams(this.queryParams).toString()
                fullURL += `?${queryString}`
            }

            this.init.headers = this.headers

            const res = await fetch(fullURL, this.init)
            const text = await res.text()
            let body: any
            try {
                body = JSON.parse(text)
            } catch {
                body = text
            }

            const response: CapturedResponse = {
                status: res.status,
                statusText: res.statusText,
                headers: Object.fromEntries(res.headers.entries()),
                body,
                text,
            }

            if (CaptureContext.isActive()) {
                CaptureContext.updateLastRequest({ response })
            }

            return onFulfilled ? onFulfilled(response) : (response as any)
        } catch (error) {
            if (onRejected) return onRejected(error)
            throw error
        }
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
