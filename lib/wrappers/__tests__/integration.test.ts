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
import { wrapTest, request } from "../index"

describe("wrapTest integration", () => {
    let app: express.Application

    beforeEach(() => {
        app = express()
        app.use(express.json())

        // Setup test routes
        app.post("/auth/signup", (req, res) => {
            const { username, password } = req.body
            if (!username || !password) {
                return res.status(400).json({ error: "Missing fields" })
            }
            res.status(201).json({ id: 1, username })
        })

        app.post("/auth/login", (req, res) => {
            res.status(200).json({ token: "jwt-token-123" })
        })

        app.get("/users/profile", (req, res) => {
            const auth = req.headers.authorization
            if (!auth) {
                return res.status(401).json({ error: "Unauthorized" })
            }
            res.status(200).json({ id: 1, username: "john" })
        })
    })

    describe("real-world usage scenarios", () => {
        const apiTest = wrapTest(it)

        apiTest("should register new user successfully", async () => {
            const response = await request(app).post("/auth/signup").send({
                username: "john",
                password: "password123",
            })

            expect(response.status).to.equal(201)
            expect(response.body).to.have.property("id")
            expect(response.body.username).to.equal("john")
        })

        apiTest("should handle validation errors", async () => {
            const response = await request(app).post("/auth/signup").send({
                username: "john",
                // missing password
            })

            expect(response.status).to.equal(400)
            expect(response.body.error).to.equal("Missing fields")
        })

        apiTest("should login and get profile", async () => {
            // First login
            const loginRes = await request(app).post("/auth/login").send({
                username: "john",
                password: "password123",
            })

            expect(loginRes.status).to.equal(200)
            const token = loginRes.body.token

            // Then get profile with token
            const profileRes = await request(app)
                .get("/users/profile")
                .set("Authorization", `Bearer ${token}`)

            expect(profileRes.status).to.equal(200)
            expect(profileRes.body.username).to.equal("john")
        })

        apiTest.withMeta({
            summary: "User Registration",
            tags: ["Auth", "Users"],
            description: "Register a new user account",
        })("should create user with metadata", async () => {
            const response = await request(app).post("/auth/signup").send({
                username: "jane",
                password: "secure123",
            })

            expect(response.status).to.equal(201)
        })
    })

    describe("comparison with existing itDoc", () => {
        it("should show the difference in usage", () => {
            // OLD WAY (with itDoc):
            // itDoc('should create user', async () => {
            //   const response = await req(app)
            //     .post('/users')
            //     .description('Create user')
            //     .tag('Users')
            //     .send({ name: 'John' })
            //     .expect(201)
            // })

            // NEW WAY (with wrapTest):
            // Example usage (commented out for now):
            // const apiTest = wrapTest(it)
            // apiTest('should create user', async () => {
            //   const response = await request(app)
            //     .post('/users')
            //     .send({ name: 'John' })
            //
            //   expect(response.status).toBe(201)
            // })

            void expect(true).to.be.true
        })
    })
})
