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
import express from "express"
import { wrapTest, createClient } from "../index"

describe("wrapTest integration", () => {
    let app: express.Application

    beforeEach(() => {
        app = express()
        app.use(express.json())

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

    describe("basic usage", () => {
        const apiTest = wrapTest(it)

        apiTest("should make GET request successfully", async () => {
            const response = await createClient.supertest(app).get("/users")

            expect(response.status).to.equal(200)
            expect(response.body).to.deep.equal({ users: [] })
        })

        apiTest("should make POST request with body", async () => {
            const response = await createClient.supertest(app).post("/users").send({
                name: "John",
                email: "john@test.com",
            })

            expect(response.status).to.equal(201)
            expect(response.body).to.have.property("id")
            expect(response.body.name).to.equal("John")
        })

        apiTest("should send headers", async () => {
            const response = await createClient
                .supertest(app)
                .get("/users")
                .set("Authorization", "Bearer token123")

            expect(response.status).to.equal(200)
        })

        apiTest("should send query parameters", async () => {
            const response = await createClient
                .supertest(app)
                .get("/users")
                .query({ page: 1, limit: 10 })

            expect(response.status).to.equal(200)
        })

        apiTest("should handle multiple requests in one test", async () => {
            const createRes = await createClient
                .supertest(app)
                .post("/users")
                .send({ name: "John" })
            expect(createRes.status).to.equal(201)

            const getRes = await createClient.supertest(app).get("/users/1")
            expect(getRes.status).to.equal(200)
        })
    })

    describe("with metadata", () => {
        const apiTest = wrapTest(it)

        apiTest.withMeta({
            summary: "Create User",
            tags: ["Users", "Registration"],
        })("should create user with metadata", async () => {
            const response = await createClient.supertest(app).post("/users").send({
                name: "Jane",
                email: "jane@test.com",
            })

            expect(response.status).to.equal(201)
        })

        apiTest.withMeta({
            description: "Custom description for API",
            deprecated: false,
        })("should use custom description", async () => {
            const response = await createClient.supertest(app).get("/users")

            expect(response.status).to.equal(200)
        })
    })

    describe("error handling", () => {
        const apiTest = wrapTest(it)

        apiTest("should handle successful requests", async () => {
            const response = await createClient.supertest(app).get("/users")

            expect(response.status).to.equal(200)
            expect(response.body).to.have.property("users")
        })
    })

    describe("compatibility", () => {
        const apiTest = wrapTest(it)

        apiTest("should work with chai expect", async () => {
            const response = await createClient.supertest(app).get("/users")

            expect(response.status).to.equal(200)
            expect(response.body).to.be.an("object")
            expect(response.body).to.have.property("users")
        })

        apiTest("should work with supertest expect()", async () => {
            await createClient
                .supertest(app)
                .get("/users")
                .expect(200)
                .expect("Content-Type", /json/)
        })
    })

    describe("without capture (regular it)", () => {
        it("should work as normal test", async () => {
            const response = await createClient.supertest(app).get("/users")

            expect(response.status).to.equal(200)
        })
    })
})
