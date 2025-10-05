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

// import { PATH_PARAM_TYPES, QUERY_PARAM_TYPES } from "./TestCaseConfig"
import { DSLField } from "../interface"
import { ResponseBuilder } from "./ResponseBuilder"
import { DSLRequestFile, FIELD_TYPES } from "../interface/field"
import { AbstractTestBuilder } from "./AbstractTestBuilder"
import logger from "../../config/logger"

interface FileDescriptor {
    readonly path?: string
    readonly buffer?: Buffer
    readonly stream?: NodeJS.ReadableStream
    readonly filename?: string
    readonly contentType?: string
}

/**
 * Builder class for setting API request information.
 */
export class RequestBuilder extends AbstractTestBuilder {
    /**
     * Sets headers to be used in requests. Header names are normalized to lowercase.
     * @param {Record<string, DSLField<string>>} headers Headers to be used in requests
     * @returns {this} Request builder instance
     */
    public header(headers: Record<string, DSLField<string>>): this {
        const normalizedHeaders: Record<string, DSLField<string>> = {}
        const seen = new Set<string>()

        Object.entries(headers).forEach(([headerName, headerValue]) => {
            const normalized = headerName.toLowerCase()

            if (seen.has(normalized)) {
                logger.warn(`Duplicate header detected: "${headerName}" (already set)`)
                return
            }

            seen.add(normalized)
            normalizedHeaders[normalized] = headerValue
        })

        this.config.requestHeaders = normalizedHeaders
        if (normalizedHeaders["content-type"]) {
            throw new Error('You cannot set "Content-Type" header using header().')
        }
        this.config.requestHeaders = headers
        return this
    }

    /**
     * Sets the request body as a raw file (NOT multipart/form-data).
     *
     * Two invocation styles are supported:
     * 1. Shorthand – `req().file("description", { path | buffer | stream, filename?, contentType? })`
     * 2. Advanced – pass a custom {@link DSLRequestFile} object (legacy support).
     *
     * The request is mutually exclusive with {@link body()}.
     */
    public file(description: string, descriptor: FileDescriptor): this
    public file(requestFile: DSLRequestFile): this
    public file(descriptionOrRequest: string | DSLRequestFile, descriptor?: FileDescriptor): this {
        const normalized = this.normalizeFileArguments(descriptionOrRequest, descriptor)
        return this.applyFile(normalized)
    }

    private normalizeFileArguments(
        descriptionOrRequest: string | DSLRequestFile | undefined,
        descriptor?: FileDescriptor,
    ): DSLRequestFile | undefined {
        if (typeof descriptionOrRequest !== "string") {
            return descriptionOrRequest
        }

        if (!descriptor || typeof descriptor !== "object") {
            return undefined
        }

        const file: DSLRequestFile["file"] = {}

        const { path, buffer, stream } = descriptor

        if (path !== undefined) {
            file.path = path
        }
        if (buffer !== undefined) {
            if (!Buffer.isBuffer(buffer)) {
                throw new Error("req().file(): buffer must be a Buffer instance.")
            }
            file.buffer = buffer
        }
        if (stream !== undefined) {
            if (!this.isReadableStream(stream)) {
                throw new Error("req().file(): stream must be a readable stream.")
            }
            file.stream = stream
        }

        const providedSources = [file.path, file.buffer, file.stream].filter((value) => value)
        if (providedSources.length !== 1) {
            throw new Error(
                "req().file(): provide exactly one of path | buffer | stream in the descriptor.",
            )
        }

        const normalizedContentType = descriptor.contentType ?? "application/octet-stream"

        return {
            description: descriptionOrRequest,
            file,
            opts: descriptor.filename
                ? { contentType: normalizedContentType, filename: descriptor.filename }
                : { contentType: normalizedContentType },
        }
    }

    private isReadableStream(value: unknown): value is NodeJS.ReadableStream {
        return (
            !!value &&
            typeof value === "object" &&
            typeof (value as NodeJS.ReadableStream).pipe === "function"
        )
    }

    private applyFile(requestFile: DSLRequestFile | undefined): this {
        if (this.config.requestHeaders) {
            throw new Error("already defined headers. can't use file()")
        }

        if (!requestFile || typeof requestFile !== "object") {
            this.config.requestHeaders = {
                "content-type": "application/octet-stream",
            }
            logger.warn("req().file(): provide one of file.path | file.buffer | file.stream.")
            return this
        }

        this.config.requestHeaders = {
            "content-type": requestFile.opts?.contentType ?? "application/octet-stream",
        }

        const { file } = requestFile

        const sources = [file.path ? 1 : 0, file.buffer ? 1 : 0, file.stream ? 1 : 0].reduce(
            (a, b) => a + b,
            0,
        )
        if (sources > 1) {
            throw new Error(
                "req().file(): only one of file.path | file.buffer | file.stream must be provided.",
            )
        }

        if (this.config.requestBody) {
            throw new Error(
                [
                    "❌ Conflict: request body has already been set using .body().",
                    "",
                    "You cannot mix JSON body (.body()) and raw file (.file()) in the same request.",
                    "Please choose exactly one of:",
                    "  • req().body(...) → for JSON payloads",
                    "  • req().file(...) → for raw binary uploads (application/octet-stream)",
                ].join("\n"),
            )
        }

        this.config.requestFile = requestFile
        return this
    }

    /**
     * Sets the request body.
     * @param {Record<string, DSLField<FIELD_TYPES> | FIELD_TYPES>} body Request body
     * @returns {this} Request builder instance
     */
    public body(body: Record<string, DSLField<FIELD_TYPES> | FIELD_TYPES>): this {
        if (this.config.requestBody) {
            throw new Error(
                [
                    "❌ Conflict: request body has already been set using .body().",
                    "",
                    "You cannot mix JSON body (.body()) and raw file (.file()) in the same request.",
                    "Please choose exactly one of:",
                    "  • req().body(...) → for JSON payloads",
                    "  • req().file(...) → for raw binary uploads (application/octet-stream)",
                ].join("\n"),
            )
        }

        this.config.requestBody = body
        return this
    }

    /**
     * Sets query parameters to be used in requests.
     * @param {Record<string, any>} params Query parameters to be used in requests
     * @returns {this} Request builder instance
     */
    public queryParam(params: Record<string, any>): this {
        this.config.queryParams = params
        return this
    }

    /**
     * Sets path parameters to be used in requests.
     * @param {Record<string, any>} params Path parameters to be used in requests
     * @returns {this} Request builder instance
     */
    public pathParam(params: Record<string, any>): this {
        this.config.pathParams = params
        return this
    }

    /**
     * Creates a ResponseBuilder instance.
     * @returns {ResponseBuilder} Response builder instance
     */
    public res(): ResponseBuilder {
        return new ResponseBuilder(this.config, this.method, this.url, this.app)
    }
}
