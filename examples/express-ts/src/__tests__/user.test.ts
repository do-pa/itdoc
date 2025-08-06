import { app } from "../index"
import { describeAPI, itDoc, HttpStatus, field, HttpMethod } from "itdoc"

describeAPI(
    HttpMethod.POST,
    "/api/user/register",
    {
        summary: "Register new user",
        tag: "Users",
        description: "Registers a new user with username and password.",
    },
    app,
    (apiDoc: any) => {
        itDoc("should register a new user successfully", async () => {
            await apiDoc
                .test()
                .req()
                .body({
                    username: field("Username", "testuser"),
                    password: field("Password", "testpassword"),
                })
                .res()
                .status(HttpStatus.CREATED)
                .body({
                    message: field("Success message", "User registered successfully"),
                    user: {
                        username: field("Username", "testuser"),
                    },
                })
        })

        itDoc("should return error when username is missing", async () => {
            await apiDoc
                .test()
                .req()
                .body({
                    password: field("Password", "testpassword"),
                })
                .res()
                .status(HttpStatus.BAD_REQUEST)
                .body({
                    message: field("Error message", "Username and password are required."),
                })
        })

        itDoc("should return error when password is missing", async () => {
            await apiDoc
                .test()
                .req()
                .body({
                    username: field("Username", "testuser"),
                })
                .res()
                .status(HttpStatus.BAD_REQUEST)
                .body({
                    message: field("Error message", "Username and password are required."),
                })
        })
    },
)

describeAPI(
    HttpMethod.POST,
    "/api/user/login",
    {
        summary: "User login",
        tag: "Users",
        description: "Authenticates a user with username and password.",
    },
    app,
    (apiDoc: any) => {
        itDoc("should login successfully with valid credentials", async () => {
            await apiDoc
                .test()
                .req()
                .body({
                    username: field("Username", "admin"),
                    password: field("Password", "admin"),
                })
                .res()
                .status(HttpStatus.OK)
                .body({
                    message: field("Success message", "Login successful"),
                    token: field("JWT Token", "fake-jwt-token"),
                })
        })

        itDoc("should return error with invalid credentials", async () => {
            await apiDoc
                .test()
                .req()
                .body({
                    username: field("Username", "wronguser"),
                    password: field("Password", "wrongpassword"),
                })
                .res()
                .status(HttpStatus.UNAUTHORIZED)
                .body({
                    message: field("Error message", "Invalid credentials"),
                })
        })
    },
)

describeAPI(
    HttpMethod.GET,
    "/api/user/:id",
    {
        summary: "Get user by ID",
        tag: "Users",
        description: "Retrieves a specific user by their ID.",
    },
    app,
    (apiDoc: any) => {
        itDoc("should return user information", async () => {
            await apiDoc
                .test()
                .req()
                .pathParam({ id: field("User ID", "123") })
                .res()
                .status(HttpStatus.OK)
                .body({
                    id: field("User ID", "123"),
                    username: field("Username", "exampleUser"),
                    email: field("Email", "user@example.com"),
                    profilePicture: field("Profile picture URL (can be null)", null),
                })
        })
    },
)
