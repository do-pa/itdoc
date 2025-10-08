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

import type { AxiosInstance, AxiosRequestConfig } from "axios"
import { HttpAdapter, HttpClient, RequestBuilder, CapturedResponse } from "../types"
import { CaptureContext } from "../../core/CaptureContext"

export interface AxiosAdapterConfig {
    baseURL?: string
    timeout?: number
    headers?: Record<string, string>
}

export class AxiosAdapter implements HttpAdapter<AxiosAdapterConfig> {
    public create(config: AxiosAdapterConfig): HttpClient {
        const axios = require("axios")
        const instance = axios.create(config)
        return new AxiosClient(instance)
    }
}

class AxiosClient implements HttpClient {
    public constructor(private axios: AxiosInstance) {}

    public get(url: string) {
        return new AxiosRequestBuilder(this.axios, "GET", url)
    }
    public post(url: string) {
        return new AxiosRequestBuilder(this.axios, "POST", url)
    }
    public put(url: string) {
        return new AxiosRequestBuilder(this.axios, "PUT", url)
    }
    public patch(url: string) {
        return new AxiosRequestBuilder(this.axios, "PATCH", url)
    }
    public delete(url: string) {
        return new AxiosRequestBuilder(this.axios, "DELETE", url)
    }
    public head(url: string) {
        return new AxiosRequestBuilder(this.axios, "HEAD", url)
    }
    public options(url: string) {
        return new AxiosRequestBuilder(this.axios, "OPTIONS", url)
    }
}

class AxiosRequestBuilder implements RequestBuilder {
    private config: AxiosRequestConfig = {}
    private formDataObj?: any

    public constructor(
        private axios: AxiosInstance,
        private method: string,
        private url: string,
    ) {
        if (CaptureContext.isActive()) {
            CaptureContext.addRequest({ method, url })
        }
    }

    public send(body: any): this {
        this.config.data = body
        if (CaptureContext.isActive()) {
            CaptureContext.updateLastRequest({ body })
        }
        return this
    }

    public set(field: string | Record<string, string>, value?: string): this {
        if (!this.config.headers) this.config.headers = {}

        if (typeof field === "string") {
            this.config.headers[field] = value!
        } else {
            Object.assign(this.config.headers, field)
        }

        if (CaptureContext.isActive()) {
            const headers = typeof field === "string" ? { [field]: value! } : field
            this.updateHeaders(headers)
        }
        return this
    }

    public query(params: Record<string, any>): this {
        this.config.params = params
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

        this.config.data = this.formDataObj

        if (!this.config.headers) this.config.headers = {}
        Object.assign(this.config.headers, this.formDataObj.getHeaders())

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
        this.config.data = this.formDataObj

        if (!this.config.headers) this.config.headers = {}
        Object.assign(this.config.headers, this.formDataObj.getHeaders())

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
        this.config.auth = { username, password }
        return this
    }

    public bearer(token: string): this {
        return this.set("Authorization", `Bearer ${token}`)
    }

    public timeout(ms: number): this {
        this.config.timeout = ms
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
            const res = await this.axios.request({
                method: this.method,
                url: this.url,
                ...this.config,
            })

            const response: CapturedResponse = {
                status: res.status,
                statusText: res.statusText,
                headers: res.headers as any,
                body: res.data,
                text: typeof res.data === "string" ? res.data : JSON.stringify(res.data),
            }

            if (CaptureContext.isActive()) {
                CaptureContext.updateLastRequest({ response })
            }

            return onFulfilled ? onFulfilled(response) : (response as any)
        } catch (error: any) {
            if (error.response && CaptureContext.isActive()) {
                const response: CapturedResponse = {
                    status: error.response.status,
                    statusText: error.response.statusText,
                    headers: error.response.headers,
                    body: error.response.data,
                }
                CaptureContext.updateLastRequest({ response })
            }

            if (onRejected) return onRejected(error)
            throw error
        }
    }

    public async end(): Promise<CapturedResponse> {
        return this.then()
    }

    private updateHeaders(headers: Record<string, string>): void {
        const store = CaptureContext.getStore()
        const requests = store?.capturedRequests || []
        const lastReq = requests[requests.length - 1]
        if (lastReq) {
            lastReq.headers = { ...lastReq.headers, ...headers }
        }
    }
}
