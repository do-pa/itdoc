const app = require("../expressApp.js")
const { describeAPI, itDoc, HttpStatus, field, HttpMethod } = require("itdoc")

const targetApp = app
describeAPI(
    HttpMethod.POST,
    "signup",
    {
        summary: "User Signup API",
        tag: "Auth",
        description: "Registers a user by receiving a username and password.",
    },
    targetApp,
    (apiDoc) => {
        itDoc("Sign up successfully", async () => {
            await apiDoc
                .test()
                .prettyPrint()
                .req()
                .body({
                    username: field("Username", "username"),
                    password: field("Password", "P@ssw0rd123!@#"),
                })
                .res()
                .status(HttpStatus.CREATED)
        })

        itDoc("Fail to sign up without a username.", async () => {
            await apiDoc
                .test()
                .req()
                .body({
                    password: field("Password", "P@ssw0rd123!@#"),
                })
                .res()
                .status(HttpStatus.BAD_REQUEST)
                .body({
                    error: field("Error message", "username is required"),
                })
        })

        itDoc("Fail to sign up if the password is shorter than eight characters.", async () => {
            await apiDoc
                .test()
                .req()
                .body({
                    username: field("Username", "penekhun"),
                    password: field("Password", "1234567"),
                })
                .res()
                .status(HttpStatus.BAD_REQUEST)
                .body({
                    error: field("Error message", "password must be at least 8 characters"),
                })
        })
    },
)

describeAPI(
    HttpMethod.GET,
    "/users/:userId",
    {
        summary: "User lookup API",
        tag: "User",
        description: "Retrieves detailed information about a specific user.",
    },
    targetApp,
    (apiDoc) => {
        itDoc("Return 200 when a valid user ID is provided.", async () => {
            await apiDoc
                .test()
                .req()
                .pathParam({
                    userId: field("Valid user ID", "penek"),
                })
                .res()
                .status(HttpStatus.OK)
                .body({
                    userId: field("User ID", "penek"),
                    username: field("User name", "hun"),
                    email: field("User email", "penekhun@gmail.com"),
                    friends: field("User friends", ["zagabi", "json"]),
                })
        })

        itDoc("Return 404 when the user ID does not exist.", async () => {
            await apiDoc
                .test()
                .req()
                .pathParam({
                    userId: "invalid-user-id",
                })
                .res()
                .status(HttpStatus.NOT_FOUND)
        })
    },
)

describeAPI(
    HttpMethod.DELETE,
    "/users/:userId/friends/:friendName",
    {
        summary: "Deletes a specific user's friend.",
        tag: "User",
        description: "Delete a specific friend for a user.",
    },
    targetApp,
    (apiDoc) => {
        itDoc("Return 400 when the user ID does not exist.", async () => {
            await apiDoc
                .test()
                .req()
                .pathParam({
                    userId: field("Nonexistent user ID", "invalid-user-id"),
                })
                .res()
                .status(HttpStatus.BAD_REQUEST)
        })

        itDoc("Return 404 when the friend ID does not exist.", async () => {
            await apiDoc
                .test()
                .req()
                .pathParam({
                    userId: field("Valid user ID", "penek"),
                    friendName: field("Nonexistent friend name", "invalid-friend-name"),
                })
                .res()
                .status(HttpStatus.NOT_FOUND)
        })

        itDoc("Delete successfully when both the user ID and friend ID are valid.", async () => {
            await apiDoc
                .test()
                .req()
                .pathParam({
                    userId: field("Valid user ID", "penek"),
                    friendName: field("Valid friend name", "zagabi"),
                })
                .res()
                .status(HttpStatus.NO_CONTENT)
        })
    },
)

describeAPI(
    HttpMethod.GET,
    "/users",
    {
        summary: "User list API",
        tag: "User",
        description: "Retrieve the user list.",
    },
    targetApp,
    (apiDoc) => {
        itDoc("Retrieve the user list.", async () => {
            await apiDoc
                .test()
                .req()
                .queryParam({
                    page: field("Page", 1),
                    size: field("Page size", 3),
                })
                .res()
                .status(HttpStatus.OK)
                .body({
                    page: 1,
                    size: field("Page size", 3),
                    total: field("Total number of users", 6),
                    members: field("User list", [
                        {
                            username: field("User ID", "penekhun"),
                            name: field("User real name", "seonghun"),
                        },
                        { username: "zagabi", name: "hongchul" },
                        { username: "json", name: "jaesong" },
                    ]),
                })
        })

        itDoc("Return 400 when the page number is missing.", async () => {
            await apiDoc
                .test()
                .req()
                .queryParam({
                    size: 10,
                })
                .res()
                .status(HttpStatus.BAD_REQUEST)
                .body({
                    error: field("Error message", "page are required"),
                })
        })

        itDoc("Return 400 when the page size is missing.", async () => {
            await apiDoc
                .test()
                .req()
                .queryParam({
                    page: 1,
                })
                .res()
                .status(HttpStatus.BAD_REQUEST)
                .body({
                    error: "size are required",
                })
        })
    },
)

describeAPI(
    HttpMethod.GET,
    "/secret",
    {
        summary: "Secret API",
        tag: "Secret",
        description: "Secret API that requires authentication.",
    },
    targetApp,
    (apiDoc) => {
        itDoc("Deny access when the auth token is missing.", async () => {
            await apiDoc.test().req().res().status(HttpStatus.UNAUTHORIZED)
        })

        itDoc("Allow access when the auth token is present.", async () => {
            const token =
                "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIyMDI1MDQwNiIsIm5hbWUiOiJpdGRvYyIsImFkbWluIjp0cnVlLCJpYXQiOjE3NDM5MjQzNDEsImV4cCI6MTc0MzkyNzk0MX0.LXswgSAv_hjAH3KntMqnr-aLxO4ZytGeXk5q8lzzUM8"
            await apiDoc
                .test()
                .req()
                .header({
                    Authorization: field("Auth token", "Bearer 123456"),
                })
                .res()
                .status(HttpStatus.OK)
                .header({
                    "Content-Type": "application/json; charset=utf-8",
                    "itdoc-custom-Header": "secret-header-value",
                    Authorization: `Bearer ${token}`,
                })
                .body({
                    message: field("Secret message", "This is a secret message"),
                })
        })
    },
)

describeAPI(
    HttpMethod.PUT,
    "/users/:userId",
    {
        summary: "User update API",
        tag: "User",
        description: "Updates a user's information entirely by user ID.",
    },
    targetApp,
    (apiDoc) => {
        itDoc("Update successfully with valid user information", async () => {
            await apiDoc
                .test()
                .req()
                .pathParam({
                    userId: field("Valid user ID", "user123"),
                })
                .body({
                    name: field("Name", "Hong Gil-dong"),
                    email: field("Email", "hong@example.com"),
                    age: field("Age", 30),
                    address: {
                        city: field("City", "Seoul"),
                        street: field("Street", "123 Gangnam-daero"),
                        zipcode: field("Postal code", "06000"),
                    },
                })
                .res()
                .status(HttpStatus.OK)
                .body({
                    success: true,
                    message: "User updated successfully",
                })
        })

        itDoc("Attempt to update a nonexistent user", async () => {
            await apiDoc
                .test()
                .req()
                .pathParam({
                    userId: field("Nonexistent ID", "nonexistent"),
                })
                .body({
                    name: "Hong Gil-dong",
                    email: "hong@example.com",
                })
                .res()
                .status(HttpStatus.NOT_FOUND)
                .body({
                    success: false,
                    message: field("Error message", "User not found"),
                })
        })
    },
)

describeAPI(
    HttpMethod.PATCH,
    "/users/:userId",
    {
        summary: "User partial update API",
        tag: "User",
        description: "Updates a user's information partially by user ID.",
    },
    targetApp,
    (apiDoc) => {
        itDoc("Update only the email successfully", async () => {
            await apiDoc
                .test()
                .req()
                .pathParam({
                    userId: field("Valid user ID", "user123"),
                })
                .body({
                    email: field("New email", "newemail@example.com"),
                })
                .res()
                .status(HttpStatus.OK)
                .body({
                    success: true,
                    message: "User partially updated",
                    updatedFields: ["email"],
                })
        })
    },
)

describeAPI(
    HttpMethod.POST,
    "/orders",
    {
        summary: "Order creation API",
        tag: "Order",
        description: "Creates a new order.",
    },
    targetApp,
    (apiDoc) => {
        itDoc("Create a complex order successfully", async () => {
            await apiDoc
                .test()
                .req()
                .header({
                    Authorization: field("Auth token", "Bearer token123"),
                    "X-Request-ID": field("Request ID", "req-12345"),
                })
                .body({
                    customer: {
                        id: field("Customer ID", "cust123"),
                        name: field("Customer name", "Hong Gil-dong"),
                        contact: {
                            email: field("Email", "hong@example.com"),
                            phone: field("Phone number", "010-1234-5678"),
                        },
                    },
                    items: field("Order item list", [
                        {
                            productId: "prod1",
                            name: "Laptop",
                            price: 1500000,
                            quantity: 1,
                            options: ["8GB RAM", "512GB SSD"],
                        },
                        {
                            productId: "prod2",
                            name: "Mouse",
                            price: 30000,
                            quantity: 2,
                            options: [],
                        },
                    ]),
                    shipping: {
                        address: {
                            zipcode: field("Postal code", "06000"),
                            city: field("City", "Seoul"),
                            street: field("Detailed address", "123 Gangnam-daero"),
                        },
                        method: field("Delivery method", "express"),
                        instructions: field("Delivery instructions", "Leave it with security when absent."),
                    },
                    payment: {
                        method: field("Payment method", "credit_card"),
                        details: {
                            cardType: field("Card type", "visa"),
                            lastFourDigits: field("Last four digits", "1234"),
                        },
                    },
                    couponCodes: field("Coupon codes", ["SUMMER10", "WELCOME"]),
                })
                .res()
                .status(HttpStatus.CREATED)
                .body({
                    orderId: field("Order ID", "order123"),
                    totalAmount: field("Total amount", 1560000),
                    estimatedDelivery: field("Estimated delivery date", "2023-09-15"),
                    status: field("Order status", "PAYMENT_PENDING"),
                })
        })
    },
)

describeAPI(
    HttpMethod.GET,
    "/products",
    {
        summary: "Product search API",
        tag: "Product",
        description: "Search products with a variety of conditions.",
    },
    targetApp,
    (apiDoc) => {
        itDoc("Search products with diverse filters", async () => {
            await apiDoc
                .test()
                .req()
                .queryParam({
                    category: field("Category", "electronics"),
                    minPrice: field("Minimum price", 50000),
                    maxPrice: field("Maximum price", 2000000),
                    brands: field("Brand list", ["samsung", "lg", "apple"]),
                    sort: field("Sort order", "price_asc"),
                    inStock: field("In-stock status", true),
                    page: field("Page number", 1),
                    pageSize: field("Page size", 20),
                    features: field("Features", "wireless,bluetooth"),
                })
                .res()
                .status(HttpStatus.OK)
                .body({
                    products: field("Product list", [
                        { id: "prod1", name: "Wireless Mouse", price: 50000, brand: "samsung" },
                        { id: "prod2", name: "Bluetooth Keyboard", price: 120000, brand: "lg" },
                    ]),
                    pagination: {
                        currentPage: 1,
                        pageSize: 20,
                        totalItems: field("Total number of products", 42),
                        totalPages: field("Total number of pages", 3),
                    },
                    filters: {
                        appliedFilters: field("Applied filters", [
                            "category",
                            "minPrice",
                            "maxPrice",
                            "brands",
                            "features",
                        ]),
                    },
                })
        })
    },
)

describeAPI(
    HttpMethod.GET,
    "/cached-data",
    {
        summary: "Cached data API",
        tag: "System",
        description: "Retrieves data using HTTP caching mechanisms.",
    },
    targetApp,
    (apiDoc) => {
        itDoc("Leverage the If-None-Match header for caching", async () => {
            await apiDoc
                .test()
                .req()
                .header({
                    "if-none-match": field("ETag value", '"abc123"'),
                    Accept: "application/json",
                    "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
                })
                .res()
                .status(HttpStatus.NOT_MODIFIED)
        })

        itDoc("Retrieve fresh data", async () => {
            await apiDoc
                .test()
                .req()
                .res()
                .status(HttpStatus.OK)
                .body({
                    data: field("Data", { version: "1.0", content: "Cacheable data" }),
                    timestamp: field("Timestamp", 1697873280000),
                })
        })
    },
)
describeAPI(
    HttpMethod.GET,
    "/failed-test",
    {
        summary: "Failure-inducing API",
        tag: "Test",
        description: "Deliberately returns a failing response.",
    },
    targetApp,
    (apiDoc) => {
        itDoc("Intentionally return a 404 response", async () => {
            await apiDoc
                .test()
                .req()
                .res()
                .status(HttpStatus.NOT_FOUND)
                .body({
                    message: field("Failure message", "This endpoint is designed to make tests fail"),
                })
        })
    },
)
