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
        if (headers["content-type"]) {
            throw new Error('You cannot set "Content-Type" header using header().')
        }
        this.config.requestHeaders = headers
        return this
    }

    /**
     * Sets the request body as a raw file (NOT multipart/form-data).
     *
     * - Accepts a {@link DSLRequestFile} containing:
     * • `file`: source (exactly one of path | buffer | stream)
     * • `opts`: metadata such as contentType (required) and filename (optional)
     * - Mutually exclusive with {@link body()}.
     * @param requestFile
     * @example
     * req().file({
     *   file: { path: "./fixtures/report.pdf" },
     *   opts: { contentType: "application/pdf", filename: "report.pdf" }
     * })
     */
    public file(requestFile: DSLRequestFile): this {
        if (!requestFile || typeof requestFile !== "object") {
            throw new Error("req().file(): you must provide a requestFile object as an argument.")
        }
        const { file } = requestFile

        const sources = [file.path ? 1 : 0, file.buffer ? 1 : 0, file.stream ? 1 : 0].reduce(
            (a, b) => a + b,
            0,
        )
        if (sources === 0) {
            throw new Error("req().file(): provide one of file.path | file.buffer | file.stream.")
        }
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
