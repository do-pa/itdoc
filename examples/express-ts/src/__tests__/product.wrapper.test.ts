/**
 * Product API Tests using wrapTest wrapper approach
 *
 * This demonstrates the new high-order function wrapping method
 * that automatically captures HTTP requests/responses
 */

import { app } from "../index"
import { wrapTest, request } from "itdoc"

// Create wrapped test function
const apiTest = wrapTest(it)

describe("Product API - Wrapper Approach", () => {
    describe("GET /api/products/:id", () => {
        apiTest.withMeta({
            summary: "Get product by ID",
            tags: ["Products"],
            description: "Retrieves a specific product by its ID",
        })("should return a specific product", async () => {
            const response = await request(app).get("/api/products/1")

            expect(response.status).toBe(200)
            expect(response.body).toHaveProperty("id", 1)
            expect(response.body).toHaveProperty("name", "Laptop")
            expect(response.body).toHaveProperty("price", 999.99)
            expect(response.body).toHaveProperty("category", "Electronics")
        })

        apiTest("should return product with different ID", async () => {
            const response = await request(app).get("/api/products/2")

            expect(response.status).toBe(200)
            expect(response.body).toHaveProperty("id", 2)
            expect(response.body).toHaveProperty("name", "Phone")
        })
    })

    describe("POST /api/products", () => {
        apiTest.withMeta({
            summary: "Create new product",
            tags: ["Products", "Create"],
            description: "Creates a new product with the provided information",
        })("should create a new product", async () => {
            const response = await request(app).post("/api/products").send({
                name: "Test Product",
                price: 99.99,
                category: "Test Category",
            })

            expect(response.status).toBe(201)
            expect(response.body).toHaveProperty("id", 3)
            expect(response.body).toHaveProperty("name", "Test Product")
            expect(response.body).toHaveProperty("price", 99.99)
            expect(response.body).toHaveProperty("category", "Test Category")
        })

        apiTest.withMeta({
            summary: "Create product with different data",
            tags: ["Products", "Create"],
        })("should create another product", async () => {
            const response = await request(app).post("/api/products").send({
                name: "Another Product",
                price: 199.99,
                category: "Another Category",
            })

            expect(response.status).toBe(201)
            expect(response.body.name).toBe("Another Product")
        })
    })

    describe("PUT /api/products/:id", () => {
        apiTest.withMeta({
            summary: "Update product",
            tags: ["Products", "Update"],
            description: "Updates an existing product with the provided information",
        })("should update a product", async () => {
            const response = await request(app).put("/api/products/1").send({
                name: "Updated Product",
                price: 199.99,
                category: "Updated Category",
            })

            expect(response.status).toBe(200)
            expect(response.body).toHaveProperty("id", 1)
            expect(response.body).toHaveProperty("name", "Updated Product")
            expect(response.body).toHaveProperty("price", 199.99)
            expect(response.body).toHaveProperty("category", "Updated Category")
        })

        apiTest("should update product with partial data", async () => {
            const response = await request(app).put("/api/products/2").send({
                name: "Partially Updated",
                price: 299.99,
                category: "Electronics",
            })

            expect(response.status).toBe(200)
            expect(response.body.name).toBe("Partially Updated")
        })
    })

    describe("DELETE /api/products/:id", () => {
        apiTest.withMeta({
            summary: "Delete product",
            tags: ["Products", "Delete"],
            description: "Deletes a product by its ID",
        })("should delete a product", async () => {
            const response = await request(app).delete("/api/products/1")

            expect(response.status).toBe(204)
        })

        apiTest("should delete another product", async () => {
            const response = await request(app).delete("/api/products/2")

            expect(response.status).toBe(204)
        })
    })

    describe("Complete product CRUD workflow", () => {
        apiTest.withMeta({
            summary: "Product CRUD workflow",
            tags: ["Products", "Workflow", "CRUD"],
            description: "Complete create, read, update, delete workflow for products",
        })("should perform complete CRUD operations", async () => {
            // Step 1: Create a product
            const createResponse = await request(app).post("/api/products").send({
                name: "Workflow Product",
                price: 149.99,
                category: "Test",
            })

            expect(createResponse.status).toBe(201)
            const productId = createResponse.body.id

            // Step 2: Read the product
            const getResponse = await request(app).get(`/api/products/${productId}`)

            expect(getResponse.status).toBe(200)
            expect(getResponse.body.name).toBe("Workflow Product")

            // Step 3: Update the product
            const updateResponse = await request(app).put(`/api/products/${productId}`).send({
                name: "Updated Workflow Product",
                price: 179.99,
                category: "Updated Test",
            })

            expect(updateResponse.status).toBe(200)
            expect(updateResponse.body.name).toBe("Updated Workflow Product")

            // Step 4: Delete the product
            const deleteResponse = await request(app).delete(`/api/products/${productId}`)

            expect(deleteResponse.status).toBe(204)
        })
    })

    describe("Product filtering and search", () => {
        apiTest.withMeta({
            summary: "Filter products by category",
            tags: ["Products", "Filter"],
        })("should filter products with query params", async () => {
            const response = await request(app)
                .get("/api/products/1")
                .query({ category: "Electronics", minPrice: 500 })

            expect(response.status).toBe(200)
        })

        apiTest("should search products with multiple params", async () => {
            const response = await request(app).get("/api/products/1").query({
                search: "laptop",
                sortBy: "price",
                order: "asc",
            })

            expect(response.status).toBe(200)
        })
    })

    describe("Product API with authentication", () => {
        apiTest.withMeta({
            summary: "Create product with auth",
            tags: ["Products", "Authentication"],
        })("should create product with authorization header", async () => {
            const response = await request(app)
                .post("/api/products")
                .set("Authorization", "Bearer fake-token-123")
                .send({
                    name: "Authenticated Product",
                    price: 299.99,
                    category: "Secure",
                })

            expect(response.status).toBe(201)
        })

        apiTest("should include custom headers", async () => {
            const response = await request(app)
                .get("/api/products/1")
                .set("Authorization", "Bearer token")
                .set("X-Client-ID", "test-client")
                .set("Accept", "application/json")

            expect(response.status).toBe(200)
        })
    })
})
