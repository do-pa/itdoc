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

import { describe, it, beforeEach } from "mocha"
import { expect } from "chai"
import express from "express"
import { request } from "../core/interceptedRequest"
import { CaptureContext } from "../core/CaptureContext"

describe("interceptedRequest", () => {
    let app: express.Application

    beforeEach(() => {
        app = express()
        app.use(express.json())

        // Test routes
        app.get("/users", (req, res) => {
            res.status(200).json({ users: [] })
        })

        app.post("/users", (req, res) => {
            res.status(201).json({ id: 1, ...req.body })
        })

        app.get("/users/:id", (req, res) => {
            res.status(200).json({ id: req.params.id, name: "John" })
        })
    })

    describe("without capture context", () => {
        it("should work as normal supertest", async () => {
            const response = await request(app).get("/users")

            expect(response.status).to.equal(200)
            expect(response.body).to.deep.equal({ users: [] })
        })

        it("should not capture any data", async () => {
            await request(app).get("/users")

            expect(CaptureContext.getCapturedRequests()).to.be.empty
        })
    })

    describe("with capture context", () => {
        it("should capture GET request", async () => {
            await CaptureContext.run("test", undefined, async () => {
                await request(app).get("/users")

                const captured = CaptureContext.getCapturedRequests()
                expect(captured).to.have.lengthOf(1)
                expect(captured[0].method).to.equal("GET")
                expect(captured[0].url).to.equal("/users")
            })
        })

        it("should capture POST request with body", async () => {
            await CaptureContext.run("test", undefined, async () => {
                await request(app).post("/users").send({ name: "John", email: "john@test.com" })

                const captured = CaptureContext.getCapturedRequests()
                expect(captured).to.have.lengthOf(1)
                expect(captured[0].method).to.equal("POST")
                expect(captured[0].url).to.equal("/users")
                expect(captured[0].body).to.deep.equal({
                    name: "John",
                    email: "john@test.com",
                })
            })
        })

        it("should capture request headers", async () => {
            await CaptureContext.run("test", undefined, async () => {
                await request(app)
                    .get("/users")
                    .set("Authorization", "Bearer token123")
                    .set("Accept", "application/json")

                const captured = CaptureContext.getCapturedRequests()
                expect(captured[0].headers).to.include({
                    Authorization: "Bearer token123",
                    Accept: "application/json",
                })
            })
        })

        it("should capture query parameters", async () => {
            await CaptureContext.run("test", undefined, async () => {
                await request(app).get("/users").query({ page: 1, limit: 10 })

                const captured = CaptureContext.getCapturedRequests()
                expect(captured[0].queryParams).to.deep.equal({
                    page: 1,
                    limit: 10,
                })
            })
        })

        it("should capture response status and body", async () => {
            await CaptureContext.run("test", undefined, async () => {
                await request(app).get("/users")

                const captured = CaptureContext.getCapturedRequests()
                expect(captured[0].response?.status).to.equal(200)
                expect(captured[0].response?.body).to.deep.equal({ users: [] })
            })
        })

        it("should capture response headers", async () => {
            await CaptureContext.run("test", undefined, async () => {
                await request(app).get("/users")

                const captured = CaptureContext.getCapturedRequests()
                expect(captured[0].response?.headers).to.be.an("object")
                expect(captured[0].response?.headers).to.have.property("content-type")
            })
        })

        it("should capture multiple requests in order", async () => {
            await CaptureContext.run("test", undefined, async () => {
                await request(app).post("/users").send({ name: "John" })
                await request(app).get("/users/1")

                const captured = CaptureContext.getCapturedRequests()
                expect(captured).to.have.lengthOf(2)
                expect(captured[0].method).to.equal("POST")
                expect(captured[1].method).to.equal("GET")
            })
        })

        it("should handle request chain methods", async () => {
            await CaptureContext.run("test", undefined, async () => {
                await request(app)
                    .post("/users")
                    .set("Authorization", "Bearer token")
                    .send({ name: "John" })
                    .expect(201)

                const captured = CaptureContext.getCapturedRequests()
                expect(captured[0]).to.deep.include({
                    method: "POST",
                    url: "/users",
                    body: { name: "John" },
                })
                expect(captured[0].headers).to.include({
                    Authorization: "Bearer token",
                })
            })
        })

        it("should capture PUT requests", async () => {
            app.put("/users/:id", (req, res) => {
                res.status(200).json({ id: req.params.id, ...req.body })
            })

            await CaptureContext.run("test", undefined, async () => {
                await request(app).put("/users/1").send({ name: "Jane" })

                const captured = CaptureContext.getCapturedRequests()
                expect(captured[0].method).to.equal("PUT")
                expect(captured[0].url).to.equal("/users/1")
            })
        })

        it("should capture DELETE requests", async () => {
            app.delete("/users/:id", (req, res) => {
                res.status(204).send()
            })

            await CaptureContext.run("test", undefined, async () => {
                await request(app).delete("/users/1")

                const captured = CaptureContext.getCapturedRequests()
                expect(captured[0].method).to.equal("DELETE")
                expect(captured[0].response?.status).to.equal(204)
            })
        })

        it("should work with expect() assertions", async () => {
            await CaptureContext.run("test", undefined, async () => {
                const response = await request(app).get("/users").expect(200)

                expect(response.body).to.deep.equal({ users: [] })

                const captured = CaptureContext.getCapturedRequests()
                expect(captured).to.have.lengthOf(1)
            })
        })

        it("should capture even when request fails", async () => {
            app.get("/error", (req, res) => {
                res.status(500).json({ error: "Server error" })
            })

            await CaptureContext.run("test", undefined, async () => {
                await request(app).get("/error")

                const captured = CaptureContext.getCapturedRequests()
                expect(captured[0].response?.status).to.equal(500)
                expect(captured[0].response?.body).to.deep.equal({
                    error: "Server error",
                })
            })
        })
    })

    describe("header setting variations", () => {
        it("should capture headers set as object", async () => {
            await CaptureContext.run("test", undefined, async () => {
                await request(app).get("/users").set({
                    Authorization: "Bearer token",
                    "X-Custom": "value",
                })

                const captured = CaptureContext.getCapturedRequests()
                expect(captured[0].headers).to.include({
                    Authorization: "Bearer token",
                    "X-Custom": "value",
                })
            })
        })

        it("should merge multiple set() calls", async () => {
            await CaptureContext.run("test", undefined, async () => {
                await request(app)
                    .get("/users")
                    .set("Authorization", "Bearer token")
                    .set("Accept", "application/json")

                const captured = CaptureContext.getCapturedRequests()
                expect(captured[0].headers).to.include({
                    Authorization: "Bearer token",
                    Accept: "application/json",
                })
            })
        })
    })
})
