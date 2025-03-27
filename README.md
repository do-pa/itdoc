# itdoc

> ⚠️ 아직은 개발 중인 프로젝트 입니다. 당장은 사용하실 수 없습니다.

## Overview

이 프로젝트의 주된 목표는 javascript 진영에서 작성된 `RESTful` 웹 서비스의 문서를 **신뢰성 있게**
작성할 수 있도록 돕는 것입니다. 일반적으로 `JSON` 또는 `JSDoc` 기반 API 문서화와 달리, **itdoc**는
실제 테스트 코드에서 요청·응답 예시를 추출합니다. 테스트가 실패하면 문서가 생성되지 않으므로, 항상
검증된 최신 API 정보만 문서화할 수 있습니다.

[Spring REST Docs]가 테스트케이스에 명시된 예시를 `Asciidoctor`와 결합해 문서를 만드는 것처럼,
`itdoc`도 사용자가 작성한 설명과 테스트 결과를 합쳐 문서를 생성해 줍니다.

테스트 기반 문서화는 언제나 실제 동작하는 API를 반영하므로, 테스트가 통과하기만 하면 [OpenAPI
Specification], Markdown, HTML 형식 등으로 문서를 내보낼 수 있습니다. 필요한 형식으로 유연하게
배포해보세요.

[Spring REST Docs]: https://spring.io/projects/spring-restdocs
[OpenAPI Specification]: https://swagger.io/specification/

## Example

```javascript
import { describeAPI, itDoc, HttpStatus, field, HttpMethod } from "itdoc"

const targetApp = app

describeAPI(
    HttpMethod.POST,
    "/signup",
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
                .req()
                .body({
                    username: field("아이디", "penekhun"),
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
)
```

## Example

openai 를 이용한 문서생성의 경우 .env.example 를 참고, .env를 설정해야 합니다.

## License

해당 프로젝트는 [Apache 2.0] 라이센스에 따라 배포됩니다.

[Apache 2.0]: LICENSE.txt
