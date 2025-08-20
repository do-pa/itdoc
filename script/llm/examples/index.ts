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
        summary: "회원 가입 API",
        tag: "Auth",
        description: "사용자로 부터 아이디와 패스워드를 받아 회원가입을 수행합니다.",
    },
    targetApp,
    (apiDoc) => {
        itDoc("회원가입 성공", async () => {
            await apiDoc
                .test()
                .prettyPrint()
                .req()
                .body({
                    username: field("사용자 이름", "username"),
                    password: field("패스워드", "P@ssw0rd123!@#"),
                })
                .res()
                .status(HttpStatus.CREATED)
        })

        itDoc("아이디를 입력하지 않으면 회원가입 실패한다.", async () => {
            await apiDoc
                .test()
                .req()
                .body({
                    password: field("패스워드", "P@ssw0rd123!@#"),
                })
                .res()
                .status(HttpStatus.BAD_REQUEST)
                .body({
                    error: field("에러 메세지", "username is required"),
                })
        })
        itDoc("에러가 발생할 경우, 500 응답을 반환한다.", async () => {
            const layer = getRouteLayer(targetApp, "post", "/signup")
            sandbox.stub(layer, "handle").callsFake((req, res, next) => {
                return res.status(500).json({ error: "Internal Server Error" })
            })
            await apiDoc
                .test()
                .req()
                .body({
                    username: field("사용자 이름", "hun"),
                    password: field("패스워드(8자 이상)", "12345678"),
                })
                .res()
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body({
                    error: field("에러 메시지", "Internal Server Error"),
                })
        })
    },
)

describeAPI(
    HttpMethod.GET,
    "/users/:userId",
    {
        summary: "사용자 조회 API",
        tag: "User",
        description: "특정 사용자의 상세 정보를 조회하는 API입니다.",
    },
    targetApp,
    (apiDoc) => {
        itDoc("유효한 사용자 ID가 주어지면 200 응답을 반환한다.", async () => {
            await apiDoc
                .test()
                .req()
                .pathParam({
                    userId: field("유효한 사용자 ID", "penek"),
                })
                .res()
                .status(HttpStatus.OK)
                .body({
                    userId: field("유저 ID", "penek"),
                    username: field("유저 이름", "hun"),
                    email: field("유저 이메일", "penekhun@gmail.com"),
                    friends: field("유저의 친구", ["zagabi", "json"]),
                })
        })

        itDoc("유효한 헤더로 접근하면 200 응답을 반환한다.", async () => {
            await apiDoc
                .test()
                .req()
                .queryParam({
                    token: field("인증 토큰A", 123456)
                })
                .header({
                    Authorization: field("인증 토큰B", "Bearer 123456"),
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
