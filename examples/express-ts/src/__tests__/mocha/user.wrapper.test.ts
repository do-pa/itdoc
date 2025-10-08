/**
 * User API Tests using wrapTest wrapper approach (Mocha version)
 *
 * This demonstrates the new high-order function wrapping method
 * that automatically captures HTTP requests/responses
 */

import { app } from "../../index"
import { wrapTest, createClient } from "itdoc"
import { expect } from "chai"

const apiTest = wrapTest(it)

const request = createClient.supertest(app)

describe("User API - Wrapper Approach (Mocha)", () => {
    describe("POST /api/user/register", () => {
        apiTest.withMeta({
            summary: "Register new user",
            tags: ["Users", "Authentication"],
            description: "Registers a new user with username and password",
        })("should register a new user successfully", async () => {
            const response = await request.post("/api/user/register").send({
                username: "testuser",
                password: "testpassword",
            })

            expect(response.status).to.equal(201)
            expect(response.body).to.have.property("message", "User registered successfully")
            expect((response.body as any).user).to.have.property("username", "testuser")
        })

        apiTest.withMeta({
            summary: "Register user - missing username",
            tags: ["Users", "Authentication", "Validation"],
        })("should return error when username is missing", async () => {
            const response = await request.post("/api/user/register").send({
                password: "testpassword",
            })

            expect(response.status).to.equal(400)
            expect(response.body).to.have.property("message", "Username and password are required.")
        })

        apiTest.withMeta({
            summary: "Register user - missing password",
            tags: ["Users", "Authentication", "Validation"],
        })("should return error when password is missing", async () => {
            const response = await request.post("/api/user/register").send({
                username: "testuser",
            })

            expect(response.status).to.equal(400)
            expect(response.body).to.have.property("message", "Username and password are required.")
        })
    })

    describe("POST /api/user/login", () => {
        apiTest.withMeta({
            summary: "User login",
            tags: ["Users", "Authentication"],
            description: "Authenticates a user with username and password",
        })("should login successfully with valid credentials", async () => {
            const response = await request.post("/api/user/login").send({
                username: "admin",
                password: "admin",
            })

            expect(response.status).to.equal(200)
            expect(response.body).to.have.property("message", "Login successful")
            expect(response.body).to.have.property("token", "fake-jwt-token")
        })

        apiTest.withMeta({
            summary: "User login - invalid credentials",
            tags: ["Users", "Authentication", "Error"],
        })("should return error with invalid credentials", async () => {
            const response = await request.post("/api/user/login").send({
                username: "wronguser",
                password: "wrongpassword",
            })

            expect(response.status).to.equal(401)
            expect(response.body).to.have.property("message", "Invalid credentials")
        })
    })

    describe("GET /api/user/:id", () => {
        apiTest.withMeta({
            summary: "Get user by ID",
            tags: ["Users"],
            description: "Retrieves a specific user by their ID",
        })("should return user information", async () => {
            const response = await request.get("/api/user/123")

            expect(response.status).to.equal(200)
            expect(response.body).to.have.property("id", "123")
            expect(response.body).to.have.property("username", "exampleUser")
            expect(response.body).to.have.property("email", "user@example.com")
            expect(response.body).to.have.property("profilePicture", null)
        })

        apiTest("should handle different user IDs", async () => {
            const response = await request.get("/api/user/456")

            expect(response.status).to.equal(200)
            expect(response.body).to.have.property("id", "456")
        })
    })

    describe("Complete user workflow", () => {
        apiTest.withMeta({
            summary: "User registration and login flow",
            tags: ["Users", "Workflow"],
            description: "Complete user registration and authentication workflow",
        })("should register and login successfully", async () => {
            const registerResponse = await request.post("/api/user/register").send({
                username: "newuser",
                password: "newpassword",
            })

            expect(registerResponse.status).to.equal(201)
            expect((registerResponse.body as any).user.username).to.equal("newuser")

            const loginResponse = await request.post("/api/user/login").send({
                username: "admin", // Using admin for demo
                password: "admin",
            })

            expect(loginResponse.status).to.equal(200)
            expect(loginResponse.body).to.have.property("token")

            const userResponse = await request.get("/api/user/123")

            expect(userResponse.status).to.equal(200)
            expect(userResponse.body).to.have.property("username")
        })
    })
})
