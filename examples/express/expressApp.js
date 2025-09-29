const express = require("express")

const app = express()

app.use(express.json())

app.post("/signup", function (req, res) {
    try {
        const { username, password } = req.body

        if (!username) {
            return res.status(400).json({
                error: "username is required",
            })
        }

        if (!password) {
            return res.status(400).json({
                error: "password is required",
            })
        }

        if (password.length < 8) {
            return res.status(400).json({
                error: "password must be at least 8 characters",
            })
        }
        return res.status(201).json()
    } catch (err) {
        return res.status(500).json({
            error: "Internal Server Error",
        })
    }
})

app.get("/users/:userId", (req, res) => {
    const { userId } = req.params

    if (userId !== "penek") {
        return res.status(404).json()
    }

    return res.status(200).json({
        userId,
        username: "hun",
        email: "penekhun@gmail.com",
        friends: ["zagabi", "json"],
        // fetchedAt: new Date().toISOString(),
    })
})

app.delete("/users/:userId/friends/:friendName", (req, res) => {
    const { userId, friendName } = req.params

    if (userId !== "penek") {
        return res.status(400).json()
    }

    if (friendName !== "zagabi") {
        return res.status(404).json()
    }

    return res.status(204).json()
})

app.get("/users", (req, res) => {
    const { page, size } = req.query

    const members = [
        {
            username: "penekhun",
            name: "seonghun",
        },
        {
            username: "zagabi",
            name: "hongchul",
        },
        {
            username: "json",
            name: "jaesong",
        },
        {
            username: "clearlove",
            name: "sangho",
        },
        {
            username: "dopa",
            name: "sanggil",
        },
        {
            username: "ageis26",
            name: "chanheok",
        },
    ]

    if (page === undefined) {
        return res.status(400).json({
            error: "page are required",
        })
    }

    if (size === undefined) {
        return res.status(400).json({
            error: "size are required",
        })
    }
    const pageNumber = parseInt(page)
    const sizeNumber = parseInt(size)
    const startIndex = (pageNumber - 1) * sizeNumber
    const endIndex = startIndex + sizeNumber

    const result = members.slice(startIndex, endIndex)
    return res.status(200).json({
        page: pageNumber,
        size: sizeNumber,
        total: members.length,
        members: result,
    })
})

app.get("/secret", (req, res) => {
    const { authorization } = req.headers
    if (authorization !== "Bearer 123456") {
        return res.status(401).json()
    }
    res.set({
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json; charset=utf-8",
        "itdoc-custom-Header": "secret-header-value",
        Authorization:
            "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIyMDI1MDQwNiIsIm5hbWUiOiJpdGRvYyIsImFkbWluIjp0cnVlLCJpYXQiOjE3NDM5MjQzNDEsImV4cCI6MTc0MzkyNzk0MX0.LXswgSAv_hjAH3KntMqnr-aLxO4ZytGeXk5q8lzzUM8",
    })
    return res.status(200).json({
        message: "This is a secret message",
    })
})

app.put("/users/:userId", (req, res) => {
    const { userId } = req.params

    if (userId === "user123") {
        return res.status(200).json({
            success: true,
            message: "User updated successfully",
        })
    } else {
        return res.status(404).json({
            success: false,
            message: "User not found",
        })
    }
})

app.patch("/users/:userId", (req, res) => {
    const { userId } = req.params
    const { email } = req.body

    if (userId === "user123" && email) {
        return res.status(200).json({
            success: true,
            message: "User partially updated",
            updatedFields: ["email"],
        })
    } else {
        return res.status(404).json({
            success: false,
            message: "User not found or invalid data",
        })
    }
})

app.post("/orders", (req, res) => {
    const { authorization } = req.headers

    if (!authorization || !authorization.startsWith("Bearer ")) {
        return res.status(401).json({
            success: false,
            message: "Authentication required",
        })
    }

    const { customer, items } = req.body

    if (!customer || !items) {
        return res.status(400).json({
            success: false,
            message: "Customer and items are required",
        })
    }

    return res.status(201).json({
        orderId: "order123",
        totalAmount: 1560000,
        estimatedDelivery: "2023-09-15",
        status: "PAYMENT_PENDING",
    })
})

app.get("/products", (req, res) => {
    return res.status(200).json({
        products: [
            {
                id: "prod1",
                name: "무선 마우스",
                price: 50000,
                brand: "samsung",
            },
            {
                id: "prod2",
                name: "블루투스 키보드",
                price: 120000,
                brand: "lg",
            },
        ],
        pagination: {
            currentPage: 1,
            pageSize: 20,
            totalItems: 42,
            totalPages: 3,
        },
        filters: {
            appliedFilters: ["category", "minPrice", "maxPrice", "brands", "features"],
        },
    })
})

app.get("/cached-data", (req, res) => {
    const ifNoneMatch = req.headers["if-none-match"]

    if (ifNoneMatch === '"abc123"') {
        res.setHeader("ETag", '"abc123"')
        res.setHeader("Cache-Control", "max-age=3600")
        return res.status(304).send()
    } else {
        res.setHeader("ETag", '"xyz789"')
        res.setHeader("Cache-Control", "max-age=3600")
        res.setHeader("Last-Modified", "Wed, 21 Oct 2023 07:28:00 GMT")
        return res.status(200).json({
            data: {
                version: "1.0",
                content: "캐시 가능한 데이터",
            },
            timestamp: 1697873280000,
        })
    }
})

app.get("/failed-test", (req, res) => {
    return res.status(404).json({
        message: "This endpoint is designed to make tests fail",
    })
})

app.post("/uploads", (req, res) => {
    const file = req.body
    if (!file || file.length === 0) {
        return res.status(400).json({
            error: "No file uploaded",
        })
    }

    return res.status(201).json({
        fileId: "file123",
        fileName: "uploaded_file.txt",
        fileSize: file.length,
        uploadTime: new Date().toISOString(),
    })
})

module.exports = app
