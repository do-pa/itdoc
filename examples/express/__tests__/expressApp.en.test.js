const app = require("../expressApp.js")
const { describeAPI, itDoc, HttpStatus, field, HttpMethod } = require("itdoc")

const targetApp = app

describeAPI(
    HttpMethod.POST,
    "signup",
    {
        summary: "User Signup API",
        tag: "Auth",
        description: "Performs user signup by receiving ID and password from the user.",
    },
    targetApp,
    (apiDoc) => {
        itDoc("Successful signup", async () => {
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

        itDoc("Signup fails if username is not provided.", async () => {
            await apiDoc
                .test()
                .req()
                .body({
                    password: field("Password", "P@ssw0rd123!@#"),
                })
                .res()
                .status(HttpStatus.BAD_REQUEST)
                .body({
                    error: field("Error Message", "username is required"),
                })
        })

        itDoc("Signup fails if password is less than 8 characters.", async () => {
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
                    error: field("Error Message", "password must be at least 8 characters"),
                })
        })
    },
)

describeAPI(
    HttpMethod.GET,
    "/users/:userId",
    {
        summary: "Retrieve User API",
        tag: "User",
        description: "API to retrieve detailed information of a specific user.",
    },
    targetApp,
    (apiDoc) => {
        itDoc("Returns 200 response when a valid user ID is provided.", async () => {
            await apiDoc
                .test()
                .req()
                .pathParam({
                    userId: field("Valid User ID", "penek"),
                })
                .res()
                .status(HttpStatus.OK)
                .body({
                    userId: field("User ID", "penek"),
                    username: field("Username", "hun"),
                    email: field("User Email", "penekhun@gmail.com"),
                    friends: field("User's Friends", ["zagabi", "json"]),
                })
        })

        itDoc("Returns 404 response when a non-existent user ID is provided.", async () => {
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
    "/users/:userId/friends/:friendId",
    {
        summary: "Delete a specific user's friend.",
        tag: "User",
        description: "API to delete a specific friend of a specific user.",
    },
    targetApp,
    (apiDoc) => {
        itDoc("Returns 400 response when a non-existent user ID is provided.", async () => {
            await apiDoc
                .test()
                .req()
                .pathParam({
                    userId: field("Non-existent User ID", "invalid-user-id"),
                })
                .res()
                .status(HttpStatus.BAD_REQUEST)
        })

        itDoc("Returns 404 response when a non-existent friend ID is provided.", async () => {
            await apiDoc
                .test()
                .req()
                .pathParam({
                    userId: field("Valid User ID", "penek"),
                    friendId: field("Non-existent Friend ID", "invalid-friend-id"),
                })
                .res()
                .status(HttpStatus.NOT_FOUND)
        })

        itDoc("Successfully deletes when a valid user ID and friend ID are provided.", async () => {
            await apiDoc
                .test()
                .req()
                .pathParam({
                    userId: field("Valid User ID", "penek"),
                    friendId: field("Valid Friend ID", "zagabi"),
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
        summary: "Retrieve User List API",
        tag: "User",
        description: "Retrieves a list of users.",
    },
    targetApp,
    (apiDoc) => {
        itDoc("Retrieves a list of users.", async () => {
            await apiDoc
                .test()
                .req()
                .queryParam({
                    page: field("Page", 1),
                    size: field("Page Size", 3),
                })
                .res()
                .status(HttpStatus.OK)
                .body({
                    page: 1,
                    size: field("Page Size", 3),
                    total: field("Total Users", 6),
                    members: field("User List", [
                        {
                            username: field("User ID", "penekhun"),
                            name: field("User Name (Real Name)", "seonghun"),
                        },
                        { username: "zagabi", name: "hongchul" },
                        { username: "json", name: "jaesong" },
                    ]),
                })
        })

        itDoc("Returns 400 response if page number is missing.", async () => {
            await apiDoc
                .test()
                .req()
                .queryParam({
                    size: 10,
                })
                .res()
                .status(HttpStatus.BAD_REQUEST)
                .body({
                    error: field("Error Message", "page are required"),
                })
        })

        itDoc("Returns 400 response if page size is missing.", async () => {
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
        description: "This is a secret API. Authentication is required.",
    },
    targetApp,
    (apiDoc) => {
        itDoc("Cannot access without an authentication token.", async () => {
            await apiDoc.test().req().res().status(HttpStatus.UNAUTHORIZED)
        })

        itDoc("Can access with an authentication token.", async () => {
            const token =
                "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIyMDI1MDQwNiIsIm5hbWUiOiJpdGRvYyIsImFkbWluIjp0cnVlLCJpYXQiOjE3NDM5MjQzNDEsImV4cCI6MTc0MzkyNzk0MX0.LXswgSAv_hjAH3KntMqnr-aLxO4ZytGeXk5q8lzzUM8"
            await apiDoc
                .test()
                .req()
                .header({
                    Authorization: field("Authentication Token", "Bearer 123456"),
                })
                .res()
                .status(HttpStatus.OK)
                .header({
                    "Content-Type": "application/json; charset=utf-8",
                    "itdoc-custom-Header": "secret-header-value",
                    Authorization: `Bearer ${token}`,
                })
                .body({
                    message: field("Secret Message", "This is a secret message"),
                })
        })
    },
)

describeAPI(
    HttpMethod.PUT,
    "/users/:userId",
    {
        summary: "Update User Information API",
        tag: "User",
        description: "Receives a user ID and performs a full update of the user's information.",
    },
    targetApp,
    (apiDoc) => {
        itDoc("Successfully updates with valid user information", async () => {
            await apiDoc
                .test()
                .req()
                .pathParam({
                    userId: field("Valid User ID", "user123"),
                })
                .body({
                    name: field("Name", "Hong Gil-dong"),
                    email: field("Email", "hong@example.com"),
                    age: field("Age", 30),
                    address: {
                        city: field("City", "Seoul"),
                        street: field("Street", "Gangnam-daero 123"),
                        zipcode: field("Zip Code", "06000"),
                    },
                })
                .res()
                .status(HttpStatus.OK)
                .body({
                    success: true,
                    message: "User updated successfully",
                })
        })

        itDoc("Attempts to update a non-existent user", async () => {
            await apiDoc
                .test()
                .req()
                .pathParam({
                    userId: field("Non-existent ID", "nonexistent"),
                })
                .body({
                    name: "Hong Gil-dong",
                    email: "hong@example.com",
                })
                .res()
                .status(HttpStatus.NOT_FOUND)
                .body({
                    success: false,
                    message: field("Error Message", "User not found"),
                })
        })
    },
)

describeAPI(
    HttpMethod.PATCH,
    "/users/:userId",
    {
        summary: "Partial User Information Update API",
        tag: "User",
        description: "Receives a user ID and partially updates the user's information.",
    },
    targetApp,
    (apiDoc) => {
        itDoc("Successfully updates only email", async () => {
            await apiDoc
                .test()
                .req()
                .pathParam({
                    userId: field("Valid User ID", "user123"),
                })
                .body({
                    email: field("New Email", "newemail@example.com"),
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
        summary: "Create Order API",
        tag: "Order",
        description: "Creates a new order.",
    },
    targetApp,
    (apiDoc) => {
        itDoc("Successfully creates a complex order", async () => {
            await apiDoc
                .test()
                .req()
                .header({
                    Authorization: field("Authentication Token", "Bearer token123"),
                    "X-Request-ID": field("Request ID", "req-12345"),
                })
                .body({
                    customer: {
                        id: field("Customer ID", "cust123"),
                        name: field("Customer Name", "Hong Gil-dong"),
                        contact: {
                            email: field("Email", "hong@example.com"),
                            phone: field("Phone Number", "010-1234-5678"),
                        },
                    },
                    items: field("Order Item List", [
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
                            zipcode: field("Zip Code", "06000"),
                            city: field("City", "Seoul"),
                            street: field("Detailed Address", "Gangnam-daero 123"),
                        },
                        method: field("Shipping Method", "express"),
                        instructions: field("Shipping Instructions", "Leave with security guard if absent"),
                    },
                    payment: {
                        method: field("Payment Method", "credit_card"),
                        details: {
                            cardType: field("Card Type", "visa"),
                            lastFourDigits: field("Last Four Digits", "1234"),
                        },
                    },
                    couponCodes: field("Coupon Codes", ["SUMMER10", "WELCOME"]),
                })
                .res()
                .status(HttpStatus.CREATED)
                .body({
                    orderId: field("Order ID", "order123"),
                    totalAmount: field("Total Amount", 1560000),
                    estimatedDelivery: field("Estimated Delivery Date", "2023-09-15"),
                    status: field("Order Status", "PAYMENT_PENDING"),
                })
        })
    },
)

describeAPI(
    HttpMethod.POST,
    "/validate",
    {
        summary: "Data Validation API",
        tag: "Validation",
        description: "Validates various types of data and provides detailed error information.",
    },
    targetApp,
    (apiDoc) => {
        itDoc("Various field validation errors", async () => {
            await apiDoc
                .test()
                .req()
                .body({
                    username: field("Invalid Username", "a"),
                    email: field("Invalid Email", "not-an-email"),
                    age: field("Invalid Age", -5),
                    registrationDate: field("Invalid Date", "2023-13-45"),
                })
                .res()
                .status(HttpStatus.BAD_REQUEST)
                .body({
                    success: false,
                    errors: field("Error List", [
                        {
                            field: "username",
                            message: "Username must be at least 3 characters",
                            code: "MIN_LENGTH",
                        },
                        {
                            field: "email",
                            message: "Invalid email format",
                            code: "INVALID_FORMAT",
                        },
                        {
                            field: "age",
                            message: "Age must be a positive number",
                            code: "POSITIVE_NUMBER",
                        },
                        {
                            field: "registrationDate",
                            message: "Invalid date format",
                            code: "INVALID_DATE",
                        },
                    ]),
                })
        })
    },
)