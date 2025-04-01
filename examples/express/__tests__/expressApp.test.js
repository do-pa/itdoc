const app = require("../expressApp.js")
const { describeAPI, itDoc, HttpStatus, field, HttpMethod } = require("itdoc")

const targetApp = app 
describeAPI(
    HttpMethod.POST,
    "signup",
    {
        name: "회원가입 API",
        tag: "Auth",
        summary: "사용자로 부터 아이디와 패스워드를 받아 회원가입을 수행합니다.",
    },
    targetApp,
    (apiDoc) => {
        itDoc("회원가입 성공", () => {
            return apiDoc
                .test()
                .prettyPrint()
                .req()
                .body({
                    username: "penekhun",
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

        itDoc("패스워드가 8자 이하면 회원가입 실패한다.", async () => {
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
                    error: field("에러 메세지", "password must be at least 8 characters"),
                })
        })
    },
<<<<<<< HEAD
) 
=======
)
>>>>>>> ff8b7fc (refactor: singup관련 중복되는 테스트 코드 삭제)

describeAPI(
    HttpMethod.GET,
    "/users/{userId}",
    {
        name: "사용자 조회 API",
        tag: "User",
        summary: "사용자 ID를 받아 사용자 정보를 반환합니다.",
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
    "/users/{userId}/friends/{friendId}",
    {
        name: "특정 사용자의 특정 친구 삭제 API",
        tag: "User",
        summary: "특정 사용자의 친구를 삭제합니다.",
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
                    friendId: field("존재하지 않는 친구 ID", "invalid-friend-id"),
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
                    friendId: field("유효한 친구 ID", "zagabi"),
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
        name: "회원 목록 조회 API",
        tag: "User",
        summary: "회원 목록을 조회합니다.",
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
                    error: field("에러 메세지", "page are required"),
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
        name: "비밀 API",
        tag: "Secret",
        summary: "비밀 API 입니다. 인증이 필요합니다.",
    },
    targetApp,
    (apiDoc) => {
        itDoc("인증 토큰이 없으면 접근할 수 없다.", async () => {
            await apiDoc.test().req().res().status(HttpStatus.UNAUTHORIZED)
        })

        itDoc("인증 토큰이 있으면 접근할 수 있다.", async () => {
            await apiDoc
                .test()
                .req()
                .header({
                    Authorization: field("인증 토큰", "Bearer 123456"),
                })
                .res()
                .status(HttpStatus.OK)
                .body({
                    message: field("비밀 메세지", "This is a secret message"),
                })
        })
    },
)
