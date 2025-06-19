export const itdocExample = `
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
                    error: field("에러 메세지", "username is required"),
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
    },
) 
`
