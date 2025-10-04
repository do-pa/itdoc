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

import { describe, it } from "mocha"
import { expect } from "chai"
import { CaptureContext } from "../core/CaptureContext"

describe("CaptureContext", () => {
    describe("isActive", () => {
        it("should return false when not in context", () => {
            void expect(CaptureContext.isActive()).to.be.false
        })

        it("should return true when in context", () => {
            CaptureContext.run("test", undefined, () => {
                void expect(CaptureContext.isActive()).to.be.true
            })
        })

        it("should return false after context ends", () => {
            CaptureContext.run("test", undefined, () => {
                // inside context
            })
            void expect(CaptureContext.isActive()).to.be.false
        })
    })

    describe("getStore", () => {
        it("should return undefined when not in context", () => {
            void expect(CaptureContext.getStore()).to.be.undefined
        })

        it("should return store when in context", () => {
            CaptureContext.run("test description", { summary: "Test" }, () => {
                const store = CaptureContext.getStore()
                void expect(store).to.not.be.undefined
                void expect(store?.description).to.equal("test description")
                void expect(store?.metadata?.summary).to.equal("Test")
                void expect(store?.capturedRequests).to.be.an("array").that.is.empty
            })
        })
    })

    describe("addRequest", () => {
        it("should add request to store", () => {
            CaptureContext.run("test", undefined, () => {
                CaptureContext.addRequest({
                    method: "POST",
                    url: "/users",
                })

                const requests = CaptureContext.getCapturedRequests()
                expect(requests).to.have.lengthOf(1)
                expect(requests[0].method).to.equal("POST")
                expect(requests[0].url).to.equal("/users")
            })
        })

        it("should add multiple requests", () => {
            CaptureContext.run("test", undefined, () => {
                CaptureContext.addRequest({ method: "GET", url: "/users" })
                CaptureContext.addRequest({ method: "POST", url: "/users" })

                const requests = CaptureContext.getCapturedRequests()
                expect(requests).to.have.lengthOf(2)
            })
        })

        it("should not add request when not in context", () => {
            CaptureContext.addRequest({ method: "POST", url: "/users" })
            void expect(CaptureContext.getCapturedRequests()).to.be.empty
        })
    })

    describe("updateLastRequest", () => {
        it("should update last request with additional data", () => {
            CaptureContext.run("test", undefined, () => {
                CaptureContext.addRequest({ method: "POST", url: "/users" })
                CaptureContext.updateLastRequest({ body: { name: "John" } })

                const requests = CaptureContext.getCapturedRequests()
                expect(requests[0].body).to.deep.equal({ name: "John" })
            })
        })

        it("should merge data with existing request", () => {
            CaptureContext.run("test", undefined, () => {
                CaptureContext.addRequest({
                    method: "POST",
                    url: "/users",
                    headers: { "Content-Type": "application/json" },
                })
                CaptureContext.updateLastRequest({
                    body: { name: "John" },
                })

                const requests = CaptureContext.getCapturedRequests()
                expect(requests[0]).to.deep.include({
                    method: "POST",
                    url: "/users",
                    body: { name: "John" },
                })
                expect(requests[0].headers).to.deep.equal({
                    "Content-Type": "application/json",
                })
            })
        })

        it("should do nothing when no requests exist", () => {
            CaptureContext.run("test", undefined, () => {
                CaptureContext.updateLastRequest({ body: { name: "John" } })
                void expect(CaptureContext.getCapturedRequests()).to.be.empty
            })
        })

        it("should do nothing when not in context", () => {
            CaptureContext.updateLastRequest({ body: { name: "John" } })
            void expect(CaptureContext.getCapturedRequests()).to.be.empty
        })
    })

    describe("clear", () => {
        it("should clear all captured requests", () => {
            CaptureContext.run("test", undefined, () => {
                CaptureContext.addRequest({ method: "GET", url: "/users" })
                CaptureContext.addRequest({ method: "POST", url: "/users" })

                void expect(CaptureContext.getCapturedRequests()).to.have.lengthOf(2)

                CaptureContext.clear()

                void expect(CaptureContext.getCapturedRequests()).to.be.empty
            })
        })
    })

    describe("nested contexts", () => {
        it("should isolate contexts properly", () => {
            CaptureContext.run("outer", undefined, () => {
                CaptureContext.addRequest({ method: "GET", url: "/outer" })

                CaptureContext.run("inner", undefined, () => {
                    CaptureContext.addRequest({ method: "POST", url: "/inner" })

                    const innerRequests = CaptureContext.getCapturedRequests()
                    expect(innerRequests).to.have.lengthOf(1)
                    expect(innerRequests[0].url).to.equal("/inner")
                })

                const outerRequests = CaptureContext.getCapturedRequests()
                expect(outerRequests).to.have.lengthOf(1)
                expect(outerRequests[0].url).to.equal("/outer")
            })
        })
    })

    describe("async support", () => {
        it("should work with async functions", async () => {
            await CaptureContext.run("test", undefined, async () => {
                CaptureContext.addRequest({ method: "GET", url: "/users" })

                await new Promise((resolve) => setTimeout(resolve, 10))

                CaptureContext.updateLastRequest({ body: { name: "John" } })

                const requests = CaptureContext.getCapturedRequests()
                expect(requests[0]).to.deep.include({
                    method: "GET",
                    url: "/users",
                    body: { name: "John" },
                })
            })
        })
    })
})
