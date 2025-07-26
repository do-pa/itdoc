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