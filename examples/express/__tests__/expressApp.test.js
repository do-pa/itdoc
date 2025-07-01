const app = require("../expressApp.js")
const { describeAPI, itDoc, HttpStatus, field, HttpMethod } = require("itdoc")

const targetApp = app

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
                    error: field("에러 메시지", "username is required"),
                })
        })

        itDoc("패스워드가 8자 미만이면 회원가입 실패한다.", async () => {
            await apiDoc
                .test()
                .req()
                .body({
                    username: field("아이디", "penekhun"),
                    password: field("패스워드", "1234567"),
                })
                .res()
                .status(HttpStatus.BAD_REQUEST)
                .body({
                    error: field("에러 메시지", "password must be at least 8 characters"),
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

        itDoc("존재하지 않는 사용자 ID가 주어지면 404 응답을 반환한다.", async () => {
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
        summary: "특정 사용자의 친구를 삭제합니다.",
        tag: "User",
        description: "특정 사용자의 특정 친구 삭제 API",
    },
    targetApp,
    (apiDoc) => {
        itDoc("존재 하지 않는 사용자 ID가 주어지면 400 응답을 반환한다.", async () => {
            await apiDoc
                .test()
                .req()
                .pathParam({
                    userId: field("존재하지 않는 사용자 ID", "invalid-user-id"),
                })
                .res()
                .status(HttpStatus.BAD_REQUEST)
        })

        itDoc("존재하지 않는 친구 ID가 주어지면 404 응답을 반환한다.", async () => {
            await apiDoc
                .test()
                .req()
                .pathParam({
                    userId: field("유효한 사용자 ID", "penek"),
                    friendName: field("존재하지 않는 친구 이름", "invalid-friend-name"),
                })
                .res()
                .status(HttpStatus.NOT_FOUND)
        })

        itDoc("유효한 사용자 ID와 친구 ID가 주어지면 정상 삭제된다.", async () => {
            await apiDoc
                .test()
                .req()
                .pathParam({
                    userId: field("유효한 사용자 ID", "penek"),
                    friendName: field("유효한 친구 이름", "zagabi"),
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
        summary: "회원 목록 조회 API",
        tag: "User",
        description: "회원 목록을 조회합니다.",
    },
    targetApp,
    (apiDoc) => {
        itDoc("회원 목록을 조회한다.", async () => {
            await apiDoc
                .test()
                .req()
                .queryParam({
                    page: field("페이지", 1),
                    size: field("페이지 사이즈", 3),
                })
                .res()
                .status(HttpStatus.OK)
                .body({
                    page: 1,
                    size: field("페이지 사이즈", 3),
                    total: field("전체 회원 수", 6),
                    members: field("회원 목록", [
                        {
                            username: field("사용자 아이디", "penekhun"),
                            name: field("사용자 이름(본명)", "seonghun"),
                        },
                        { username: "zagabi", name: "hongchul" },
                        { username: "json", name: "jaesong" },
                    ]),
                })
        })

        itDoc("페이지 번호가 누락 되면 400 응답을 반환한다.", async () => {
            await apiDoc
                .test()
                .req()
                .queryParam({
                    size: 10,
                })
                .res()
                .status(HttpStatus.BAD_REQUEST)
                .body({
                    error: field("에러 메시지", "page are required"),
                })
        })

        itDoc("페이지 사이즈가 누락 되면 400 응답을 반환한다.", async () => {
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
        summary: "비밀 API",
        tag: "Secret",
        description: "비밀 API 입니다. 인증이 필요합니다.",
    },
    targetApp,
    (apiDoc) => {
        itDoc("인증 토큰이 없으면 접근할 수 없다.", async () => {
            await apiDoc.test().req().res().status(HttpStatus.UNAUTHORIZED)
        })

        itDoc("인증 토큰이 있으면 접근할 수 있다.", async () => {
            const token =
                "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIyMDI1MDQwNiIsIm5hbWUiOiJpdGRvYyIsImFkbWluIjp0cnVlLCJpYXQiOjE3NDM5MjQzNDEsImV4cCI6MTc0MzkyNzk0MX0.LXswgSAv_hjAH3KntMqnr-aLxO4ZytGeXk5q8lzzUM8"
            await apiDoc
                .test()
                .req()
                .header({
                    Authorization: field("인증 토큰", "Bearer 123456"),
                })
                .res()
                .status(HttpStatus.OK)
                .header({
                    "Content-Type": "application/json; charset=utf-8",
                    "itdoc-custom-Header": "secret-header-value",
                    Authorization: `Bearer ${token}`,
                })
                .body({
                    message: field("비밀 메시지", "This is a secret message"),
                })
        })
    },
)

describeAPI(
    HttpMethod.PUT,
    "/users/:userId",
    {
        summary: "사용자 정보 수정 API",
        tag: "User",
        description: "사용자 ID를 받아 해당 사용자의 정보를 전체 수정합니다.",
    },
    targetApp,
    (apiDoc) => {
        itDoc("유효한 사용자 정보로 수정 성공", async () => {
            await apiDoc
                .test()
                .req()
                .pathParam({
                    userId: field("유효한 사용자 ID", "user123"),
                })
                .body({
                    name: field("이름", "홍길동"),
                    email: field("이메일", "hong@example.com"),
                    age: field("나이", 30),
                    address: {
                        city: field("도시", "서울"),
                        street: field("거리", "강남대로 123"),
                        zipcode: field("우편번호", "06000"),
                    },
                })
                .res()
                .status(HttpStatus.OK)
                .body({
                    success: true,
                    message: "User updated successfully",
                })
        })

        itDoc("존재하지 않는 사용자 수정 시도", async () => {
            await apiDoc
                .test()
                .req()
                .pathParam({
                    userId: field("존재하지 않는 ID", "nonexistent"),
                })
                .body({
                    name: "홍길동",
                    email: "hong@example.com",
                })
                .res()
                .status(HttpStatus.NOT_FOUND)
                .body({
                    success: false,
                    message: field("에러 메시지", "User not found"),
                })
        })
    },
)

describeAPI(
    HttpMethod.PATCH,
    "/users/:userId",
    {
        summary: "사용자 부분 정보 수정 API",
        tag: "User",
        description: "사용자 ID를 받아 해당 사용자의 정보를 부분적으로 수정합니다.",
    },
    targetApp,
    (apiDoc) => {
        itDoc("이메일만 수정 성공", async () => {
            await apiDoc
                .test()
                .req()
                .pathParam({
                    userId: field("유효한 사용자 ID", "user123"),
                })
                .body({
                    email: field("새 이메일", "newemail@example.com"),
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
        summary: "주문 생성 API",
        tag: "Order",
        description: "새로운 주문을 생성합니다.",
    },
    targetApp,
    (apiDoc) => {
        itDoc("복잡한 주문 생성 성공", async () => {
            await apiDoc
                .test()
                .req()
                .header({
                    Authorization: field("인증 토큰", "Bearer token123"),
                    "X-Request-ID": field("요청 ID", "req-12345"),
                })
                .body({
                    customer: {
                        id: field("고객 ID", "cust123"),
                        name: field("고객명", "홍길동"),
                        contact: {
                            email: field("이메일", "hong@example.com"),
                            phone: field("전화번호", "010-1234-5678"),
                        },
                    },
                    items: field("주문 상품 목록", [
                        {
                            productId: "prod1",
                            name: "노트북",
                            price: 1500000,
                            quantity: 1,
                            options: ["8GB RAM", "512GB SSD"],
                        },
                        {
                            productId: "prod2",
                            name: "마우스",
                            price: 30000,
                            quantity: 2,
                            options: [],
                        },
                    ]),
                    shipping: {
                        address: {
                            zipcode: field("우편번호", "06000"),
                            city: field("도시", "서울"),
                            street: field("상세주소", "강남대로 123"),
                        },
                        method: field("배송 방법", "express"),
                        instructions: field("배송 지침", "부재시 경비실에 맡겨주세요"),
                    },
                    payment: {
                        method: field("결제 방법", "credit_card"),
                        details: {
                            cardType: field("카드 종류", "visa"),
                            lastFourDigits: field("마지막 4자리", "1234"),
                        },
                    },
                    couponCodes: field("쿠폰 코드", ["SUMMER10", "WELCOME"]),
                })
                .res()
                .status(HttpStatus.CREATED)
                .body({
                    orderId: field("주문 ID", "order123"),
                    totalAmount: field("총 금액", 1560000),
                    estimatedDelivery: field("예상 배송일", "2023-09-15"),
                    status: field("주문 상태", "PAYMENT_PENDING"),
                })
        })
    },
)

describeAPI(
    HttpMethod.GET,
    "/products",
    {
        summary: "상품 검색 API",
        tag: "Product",
        description: "다양한 조건으로 상품을 검색합니다.",
    },
    targetApp,
    (apiDoc) => {
        itDoc("다양한 검색 조건으로 상품 검색", async () => {
            await apiDoc
                .test()
                .req()
                .queryParam({
                    category: field("카테고리", "electronics"),
                    minPrice: field("최소 가격", 50000),
                    maxPrice: field("최대 가격", 2000000),
                    brands: field("브랜드 목록", ["samsung", "lg", "apple"]),
                    sort: field("정렬 기준", "price_asc"),
                    inStock: field("재고 있음 여부", true),
                    page: field("페이지 번호", 1),
                    pageSize: field("페이지 크기", 20),
                    features: field("특징", "wireless,bluetooth"),
                })
                .res()
                .status(HttpStatus.OK)
                .body({
                    products: field("상품 목록", [
                        { id: "prod1", name: "무선 마우스", price: 50000, brand: "samsung" },
                        { id: "prod2", name: "블루투스 키보드", price: 120000, brand: "lg" },
                    ]),
                    pagination: {
                        currentPage: 1,
                        pageSize: 20,
                        totalItems: field("전체 상품 수", 42),
                        totalPages: field("전체 페이지 수", 3),
                    },
                    filters: {
                        appliedFilters: field("적용된 필터", [
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
        summary: "캐시된 데이터 조회 API",
        tag: "System",
        description: "HTTP 캐싱 메커니즘을 활용하여 데이터를 조회합니다.",
    },
    targetApp,
    (apiDoc) => {
        itDoc("If-None-Match 헤더로 캐시 활용", async () => {
            await apiDoc
                .test()
                .req()
                .header({
                    "If-None-Match": field("ETag 값", '"abc123"'),
                    Accept: "application/json",
                    "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
                })
                .res()
                .status(HttpStatus.NOT_MODIFIED)
        })

        itDoc("신선한 데이터 조회", async () => {
            await apiDoc
                .test()
                .req()
                .res()
                .status(HttpStatus.OK)
                .body({
                    data: field("데이터", { version: "1.0", content: "캐시 가능한 데이터" }),
                    timestamp: field("타임스탬프", 1697873280000),
                })
        })
    },
)

describeAPI(
    HttpMethod.POST,
    "/validate",
    {
        summary: "데이터 유효성 검증 API",
        tag: "Validation",
        description: "다양한 형태의 데이터 유효성을 검증하고 상세한 오류 정보를 제공합니다.",
    },
    targetApp,
    (apiDoc) => {
        itDoc("다양한 필드 유효성 오류", async () => {
            await apiDoc
                .test()
                .req()
                .body({
                    username: field("잘못된 사용자명", "a"),
                    email: field("잘못된 이메일", "not-an-email"),
                    age: field("잘못된 나이", -5),
                    registrationDate: field("잘못된 날짜", "2023-13-45"),
                })
                .res()
                .status(HttpStatus.BAD_REQUEST)
                .body({
                    success: false,
                    errors: field("오류 목록", [
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
describeAPI(
    HttpMethod.GET,
    "/failed-test",
    {
        summary: "테스트 실패 유도 API",
        tag: "Test",
        description: "일부러 실패하는 응답을 주는 API입니다.",
    },
    targetApp,
    (apiDoc) => {
        itDoc("404 응답을 의도적으로 반환", async () => {
            await apiDoc
                .test()
                .req()
                .res()
                .status(HttpStatus.NOT_FOUND)
                .body({
                    message: field("실패 메시지", "This endpoint is designed to make tests fail"),
                })
        })
    },
)
