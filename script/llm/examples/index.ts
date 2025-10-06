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

export const itdocExampleJs = ` 
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
                    username: field("User name", "username"),
                    password: field("Password", "P@ssw0rd123!@#"),
                })
                .res()
                .status(HttpStatus.CREATED)
        })

        itDoc("Fail to sign up without a username", async () => {
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
        itDoc("Return a 500 response when an error occurs", async () => {
            const layer = getRouteLayer(targetApp, "post", "/signup")
            sandbox.stub(layer, "handle").callsFake((req, res, next) => {
                return res.status(500).json({ error: "Internal Server Error" })
            })
            await apiDoc
                .test()
                .req()
                .body({
                    username: field("User name", "hun"),
                    password: field("Password (8 characters minimum)", "12345678"),
                })
                .res()
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body({
                    error: field("Error message", "Internal Server Error"),
                })
        })
    },
)

describeAPI(
    HttpMethod.GET,
    "/users/:userId",
    {
        summary: "User Lookup API",
        tag: "User",
        description: "Retrieves detailed information for a specific user.",
    },
    targetApp,
    (apiDoc) => {
        itDoc("Return 200 when a valid user ID is provided", async () => {
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

        itDoc("Return 200 when valid headers are provided", async () => {
            await apiDoc
                .test()
                .req()
                .queryParam({
                    token: field("Auth token A", 123456)
                })
                .header({
                    Authorization: field("Auth token B", "Bearer 123456"),
                })
                .res()
                .status(HttpStatus.OK) 
        }) 
    },
)
`
export const itdocExampleTs = ` 
describeAPI(
    HttpMethod.GET,
    "/api/products/:id",
    {
        summary: "Get product by ID",
        tag: "Products",
        description: "Retrieves a specific product by its ID.",
    },
    app,
    (apiDoc: any) => {
        itDoc("should return a specific product", async () => {
            await apiDoc
                .test()
                .req()
                .pathParam({ id: field("Product ID", 1) })
                .res()
                .status(HttpStatus.OK)
                .body({
                    id: field("Product ID", 1),
                    name: field("Product name", "Laptop"),
                    price: field("Product price", 999.99),
                    category: field("Product category", "Electronics"),
                })
        })
    },
)

describeAPI(
    HttpMethod.POST,
    "/api/products",
    {
        summary: "Create new product",
        tag: "Products",
        description: "Creates a new product with the provided information.",
    },
    app,
    (apiDoc: any) => {
        itDoc("should create a new product", async () => {
            await apiDoc
                .test()
                .req()
                .body({
                    name: field("Product name", "Test Product"),
                    price: field("Product price", 99.99),
                    category: field("Product category", "Test Category"),
                })
                .res()
                .status(HttpStatus.CREATED)
                .body({
                    id: field("Product ID", 3),
                    name: field("Product name", "Test Product"),
                    price: field("Product price", 99.99),
                    category: field("Product category", "Test Category"),
                })
        })
    },
)

describeAPI(
    HttpMethod.PUT,
    "/api/products/:id",
    {
        summary: "Update product",
        tag: "Products",
        description: "Updates an existing product with the provided information.",
    },
    app,
    (apiDoc: any) => {
        itDoc("should update a product", async () => {
            await apiDoc
                .test()
                .req()
                .pathParam({ id: field("Product ID", 1) })
                .body({
                    name: field("Product name", "Updated Product"),
                    price: field("Product price", 199.99),
                    category: field("Product category", "Updated Category"),
                })
                .res()
                .status(HttpStatus.OK)
                .body({
                    id: field("Product ID", 1),
                    name: field("Product name", "Updated Product"),
                    price: field("Product price", 199.99),
                    category: field("Product category", "Updated Category"),
                })
        })
    },
)

describeAPI(
    HttpMethod.DELETE,
    "/api/products/:id",
    {
        summary: "Delete product",
        tag: "Products",
        description: "Deletes a product by its ID.",
    },
    app,
    (apiDoc: any) => {
        itDoc("should delete a product", async () => {
            await apiDoc
                .test()
                .req()
                .pathParam({ id: field("Product ID", 1) })
                .res()
                .status(HttpStatus.NO_CONTENT)
        })
    },
)

`
