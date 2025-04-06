const express = require("express")

const app = express()

app.use(express.json())

app.post("/signup", function (req, res) {
  const {
    username,
    password
  } = req.body

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
})

app.get("/users/:userId", (req, res) => {
  const {
    userId
  } = req.params

  if (userId !== "penek") {
    return res.status(404).json()
  }

  return res.status(200).json({
    userId,
    username: "hun",
    email: "penekhun@gmail.com",
    friends: ["zagabi", "json"],
  })
})

app.delete("/users/:userId/friends/:friendName", (req, res) => {
  const {
    userId,
    friendName
  } = req.params

  if (userId !== "penek") {
    return res.status(400).json()
  }

  if (friendName !== "zagabi") {
    return res.status(404).json()
  }

  return res.status(204).json()
})

app.get("/users", (req, res) => {
  const {
    page,
    size
  } = req.query

  const members = [{
      username: "penekhun",
      name: "seonghun"
    },
    {
      username: "zagabi",
      name: "hongchul"
    },
    {
      username: "json",
      name: "jaesong"
    },
    {
      username: "clearlove",
      name: "sangho"
    },
    {
      username: "dopa",
      name: "sanggil"
    },
    {
      username: "ageis26",
      name: "chanheok"
    },
  ]

  if (page === undefined) {
    return res.status(400).json({
      error: "page are required"
    })
  }

  if (size === undefined) {
    return res.status(400).json({
      error: "size are required"
    })
  }

  // sample pagination
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
  const {
    authorization
  } = req.headers
  if (authorization !== "Bearer 123456") {
    return res.status(401).json()
  }
  res.set({
    "Access-Control-Allow-Origin": "*",     
    "Content-Type": "application/json",       
    "itdoc-custom-Header":  "secret-header-value",
    "Authorization" : "Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIyMDI1MDQwNiIsIm5hbWUiOiJpdGRvYyIsImFkbWluIjp0cnVlLCJpYXQiOjE3NDM5MjQzNDEsImV4cCI6MTc0MzkyNzk0MX0.LXswgSAv_hjAH3KntMqnr-aLxO4ZytGeXk5q8lzzUM8"
  }) 
  return res.status(200).json({
    message: "This is a secret message",
  })
})

// PUT 요청으로 사용자 정보 수정 API
app.put("/users/:userId", (req, res) => {
  const {
    userId
  } = req.params

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

// PATCH 요청으로 사용자 부분 정보 수정 API
app.patch("/users/:userId", (req, res) => {
  const {
    userId
  } = req.params
  const {
    email
  } = req.body

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

// 프로필 이미지 업로드 API
app.post("/users/:userId/profile-image", (req, res) => {
  const {
    userId
  } = req.params
  const contentType = req.headers["content-type"]

  if (!contentType || !contentType.includes("multipart/form-data")) {
    return res.status(400).json({
      success: false,
      message: "Content-Type must be multipart/form-data",
    })
  }

  // 파일 확장자 확인 (테스트 목적)
  const fileExtension =
    req.body && req.body.image ? req.body.image.split(".").pop().toLowerCase() : ""

  if (["jpg", "jpeg", "png", "gif"].includes(fileExtension)) {
    return res.status(200).json({
      success: true,
      imageUrl: `https://example.com/images/${userId}.jpg`,
    })
  } else {
    return res.status(400).json({
      success: false,
      message: "Unsupported file type. Only jpg, png, gif are allowed.",
    })
  }
})

// 주문 생성 API
app.post("/orders", (req, res) => {
  const {
    authorization
  } = req.headers

  if (!authorization || !authorization.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    })
  }

  // 간단한 검증만 수행
  const {
    customer,
    items
  } = req.body

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

// 상품 검색 API
app.get("/products", (req, res) => {
  // 모든 쿼리 파라미터 제공되었다고 가정
  return res.status(200).json({
    products: [{
        id: "prod1",
        name: "무선 마우스",
        price: 50000,
        brand: "samsung"
      },
      {
        id: "prod2",
        name: "블루투스 키보드",
        price: 120000,
        brand: "lg"
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

// 캐시된 데이터 조회 API
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
        content: "캐시 가능한 데이터"
      },
      timestamp: 1697873280000,
    })
  }
})

// 데이터 유효성 검증 API
app.post("/validate", (req, res) => {
  const {
    username,
    email,
    age,
    registrationDate
  } = req.body
  const errors = []

  if (!username || username.length < 3) {
    errors.push({
      field: "username",
      message: "Username must be at least 3 characters",
      code: "MIN_LENGTH",
    })
  }

  if (!email || !email.includes("@")) {
    errors.push({
      field: "email",
      message: "Invalid email format",
      code: "INVALID_FORMAT",
    })
  }

  if (typeof age !== "number" || age <= 0) {
    errors.push({
      field: "age",
      message: "Age must be a positive number",
      code: "POSITIVE_NUMBER",
    })
  }

  if (registrationDate && !Date.parse(registrationDate)) {
    errors.push({
      field: "registrationDate",
      message: "Invalid date format",
      code: "INVALID_DATE",
    })
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      errors,
    })
  }

  return res.status(200).json({
    success: true,
    message: "All fields are valid",
  })
})

// 의도적으로 실패하는 테스트를 위한 API 엔드포인트
app.get("/failed-test", (req, res) => {
  // 테스트에서는 200(OK)을 기대하지만 404를 반환하여 의도적으로 실패
  return res.status(404).json({
    message: "This endpoint is designed to make tests fail",
  })
})

module.exports = app
