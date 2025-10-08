import { app } from "../../index"
import { describeAPI, itDoc, HttpStatus, field, HttpMethod } from "itdoc"

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
