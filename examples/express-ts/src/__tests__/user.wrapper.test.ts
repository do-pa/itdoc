/**
 * User API Tests using wrapTest wrapper approach
 *
 * This demonstrates the new high-order function wrapping method
 * that automatically captures HTTP requests/responses
 */

import { app } from "../index"
import { wrapTest, request } from "itdoc"

// Create wrapped test function
const apiTest = wrapTest(it)

describe("User API - Wrapper Approach", () => {
    describe("POST /api/user/register", () => {
        apiTest.withMeta({
            summary: "Register new user",
            tags: ["Users", "Authentication"],
            description: "Registers a new user with username and password",
        })("should register a new user successfully", async () => {
            const response = await request(app).post("/api/user/register").send({
                username: "testuser",
                password: "testpassword",
            })

            expect(response.status).toBe(201)
            expect(response.body).toHaveProperty("message", "User registered successfully")
            expect(response.body.user).toHaveProperty("username", "testuser")
        })

        apiTest.withMeta({
            summary: "Register user - missing username",
            tags: ["Users", "Authentication", "Validation"],
        })("should return error when username is missing", async () => {
            const response = await request(app).post("/api/user/register").send({
                password: "testpassword",
            })

            expect(response.status).toBe(400)
            expect(response.body).toHaveProperty("message", "Username and password are required.")
        })

        apiTest.withMeta({
            summary: "Register user - missing password",
            tags: ["Users", "Authentication", "Validation"],
        })("should return error when password is missing", async () => {
            const response = await request(app).post("/api/user/register").send({
                username: "testuser",
            })

            expect(response.status).toBe(400)
            expect(response.body).toHaveProperty("message", "Username and password are required.")
        })
    })

    describe("POST /api/user/login", () => {
        apiTest.withMeta({
            summary: "User login",
            tags: ["Users", "Authentication"],
            description: "Authenticates a user with username and password",
        })("should login successfully with valid credentials", async () => {
            const response = await request(app).post("/api/user/login").send({
                username: "admin",
                password: "admin",
            })

            expect(response.status).toBe(200)
            expect(response.body).toHaveProperty("message", "Login successful")
            expect(response.body).toHaveProperty("token", "fake-jwt-token")
        })

        apiTest.withMeta({
            summary: "User login - invalid credentials",
            tags: ["Users", "Authentication", "Error"],
        })("should return error with invalid credentials", async () => {
            const response = await request(app).post("/api/user/login").send({
                username: "wronguser",
                password: "wrongpassword",
            })

            expect(response.status).toBe(401)
            expect(response.body).toHaveProperty("message", "Invalid credentials")
        })
    })

    describe("GET /api/user/:id", () => {
        apiTest.withMeta({
            summary: "Get user by ID",
            tags: ["Users"],
            description: "Retrieves a specific user by their ID",
        })("should return user information", async () => {
            const response = await request(app).get("/api/user/123")

            expect(response.status).toBe(200)
            expect(response.body).toHaveProperty("id", "123")
            expect(response.body).toHaveProperty("username", "exampleUser")
            expect(response.body).toHaveProperty("email", "user@example.com")
            expect(response.body).toHaveProperty("profilePicture", null)
        })

        apiTest("should handle different user IDs", async () => {
            const response = await request(app).get("/api/user/456")

            expect(response.status).toBe(200)
            expect(response.body).toHaveProperty("id", "456")
        })
    })

    describe("Complete user workflow", () => {
        apiTest.withMeta({
            summary: "User registration and login flow",
            tags: ["Users", "Workflow"],
            description: "Complete user registration and authentication workflow",
        })("should register and login successfully", async () => {
            // Step 1: Register new user
            const registerResponse = await request(app).post("/api/user/register").send({
                username: "newuser",
                password: "newpassword",
            })

            expect(registerResponse.status).toBe(201)
            expect(registerResponse.body.user.username).toBe("newuser")

            // Step 2: Login with new credentials
            const loginResponse = await request(app).post("/api/user/login").send({
                username: "admin", // Using admin for demo
                password: "admin",
            })

            expect(loginResponse.status).toBe(200)
            expect(loginResponse.body).toHaveProperty("token")

            // Step 3: Get user info
            const userResponse = await request(app).get("/api/user/123")

            expect(userResponse.status).toBe(200)
            expect(userResponse.body).toHaveProperty("username")
        })
    })
})
