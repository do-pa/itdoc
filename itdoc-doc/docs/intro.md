---
sidebar_position: 1
---

# itdoc 시작하기

**itdoc**은 자체 인터페이스를 기반으로 jest, mocha.js 기반의 테스트코드, oas, markdown, redocli-html
문서를 자동으로 생성할 수 있게 도와주는 경량 라이브러리입니다. 테스트 기반 개발(TDD)을 하면서
자연스럽게 API 문서도 함께 작성하고 싶은 개발자에게 이상적입니다.

## 설치

1. [Node.js](https://nodejs.org/en/download/) 20이 설치되어 있어야 합니다.

```bash
pnpm install itdoc --save-dev
```

또는 yarn을 사용한다면 다음과 같습니다.

```bash
yarn add -D itdoc
```

---

### 테스트 작성 예제

자바스크립트

```js
describeAPI(
    HttpMethod.POST,
    "/signup",
    {
        summary: "회원가입 API",
        tag: "Auth",
        summary: "사용자로 부터 아이디와 패스워드를 받아 회원가입을 수행합니다.",
    },
    targetApp,
    (apiDoc) => {
        itdoc("회원가입 성공", () => {
            return apiDoc
                .test()
                .req()
                .body({
                    username: "penekhun",
                    password: field("패스워드", "P@ssw0rd123!@#"),
                })
                .res()
                .status(HttpStatus.CREATED)
        })
    },
)
```

## 개요

**itdoc**은 테스트 자동화 및 API 문서 생성을 위해 설계된 라이브러리입니다.  
주요 특징은 다음과 같습니다.

- **도메인 특화 언어(DSL) 제공:** 테스트 케이스와 API 동작을 선언적으로 기술할 수 있는 인터페이스를
  제공합니다.
- **빌더 패턴 활용:** 테스트 케이스를 구성하기 위한 `RootBuilder`, `RequestBuilder`,
  `ResponseBuilder` 등 다양한 빌더 클래스를 제공합니다.
- **다양한 테스트 프레임워크 지원:** Mocha와 Jest 등 여러 테스트 프레임워크에 대응할 수 있도록
  어댑터(`MochaAdapter`, `JestAdapter`)를 내장하고 있습니다.
- **HTTP 관련 상수 정의:** HTTP 메소드와 상태 코드를 관리하기 위한 열거형(`HttpMethod`,
  `HttpStatus`)을 제공합니다.

---

### 주요 디렉터리 구조 : lib

```
lib/
 ├─ dsl/
 │   ├─ interface/
 │   │    ├─ itdoc.ts
 │   │    ├─ describeAPI.ts
 │   │    ├─ header.ts
 │   │    ├─ field.ts
 │   │    ├─ itdocBuilderEntry.ts
 │   │    └─ index.ts
 │   ├─ test-builders/
 │   │    ├─ RootBuilder.ts
 │   │    ├─ TestCaseConfig.ts
 │   │    ├─ AbstractTestBuilder.ts
 │   │    ├─ RequestBuilder.ts
 │   │    ├─ ResponseBuilder.ts
 │   │    └─ validateResponse.ts
 │   ├─ enums/
 │   │    ├─ HttpMethod.ts
 │   │    ├─ HttpStatus.ts
 │   │    └─ index.ts
 │   └─ adapters/
 │        ├─ MochaAdapter.ts
 │        ├─ JestAdapter.ts
 │        ├─ UserTestInterface.ts
 │        ├─ TestFramework.ts
 │        └─ index.ts
 └─ __tests__/          // 유닛 테스트 코드 (DSL 인터페이스, 빌더 등)
```

또한, `examples/` 폴더 아래에 실제 사용 예제가 제공되어 있습니다.

- **express 예제:** Express 애플리케이션과 itdoc을 연동하는 방법
- **testframework-compatibility-test 예제:** 다양한 테스트 프레임워크(Jest, Mocha 등)와의 호환성을
  검증하는 예제

---

### 주요 구성 요소

#### 1. DSL 인터페이스

`lib/dsl/interface/` 폴더 내 파일들은 라이브러리의 DSL 핵심 기능을 제공합니다.

- **itdoc.ts:** 테스트 문서 작성을 위한 진입점 모듈입니다.  
  _예시:_ itdoc을 이용해 테스트 케이스를 선언하고 실행할 수 있습니다.

- **describeAPI.ts:** API 엔드포인트 또는 기능을 설명하는 함수가 포함되어 있습니다.  
  _예시:_ `describeAPI('GET /users', () => { ... })`와 같이 API를 정의합니다.

- **header.ts, field.ts:** 테스트에 필요한 메타 데이터(예: HTTP 헤더, 필드 정의)를 기술할 수 있는
  인터페이스를 제공합니다.

- **itdocBuilderEntry.ts:** DSL과 빌더 패턴을 연결하는 인터페이스 또는 타입 정의 파일입니다.

#### 2. 테스트 빌더

`lib/dsl/test-builders/` 폴더는 빌더 패턴을 활용하여 테스트 케이스를 구성하는 역할을 합니다.

- **RootBuilder.ts:** 테스트 케이스의 최상위 빌더로, 전체 테스트 시나리오의 흐름을 구성합니다.
- **RequestBuilder.ts & ResponseBuilder.ts:** 각각 HTTP 요청과 응답에 대한 테스트 케이스를 구성하는
  빌더입니다.
- **AbstractTestBuilder.ts:** 빌더 구현 시 공통으로 사용되는 추상 클래스로, 확장하여 사용할 수
  있습니다.
- **TestCaseConfig.ts:** 개별 테스트 케이스의 설정 정보를 정의합니다.
- **validateResponse.ts:** 응답 결과를 검증하는 유틸리티 함수로, 테스트의 정확성을 보장합니다.

#### 3. HTTP 관련 열거형

`lib/dsl/enums/` 폴더에서는 HTTP 관련 상수들을 관리합니다.

- **HttpMethod.ts:** GET, POST, PUT, DELETE 등 HTTP 메소드를 열거형으로 정의합니다.
- **HttpStatus.ts:** 200, 404, 500 등 HTTP 상태 코드를 열거형으로 제공합니다.
- **index.ts:** 관련 열거형들을 집합적으로 내보내기 위한 모듈입니다.

#### 4. 어댑터 (Test Framework Integration)

`lib/dsl/adapters/` 폴더는 다양한 테스트 프레임워크와의 연동을 지원합니다.

- **MochaAdapter.ts & JestAdapter.ts:** 각각 Mocha와 Jest에 최적화된 어댑터로, itdoc DSL을 해당
  프레임워크의 문법과 실행 방식에 맞게 변환합니다.
- **UserTestInterface.ts:** 사용자 정의 테스트 인터페이스를 제공하여, 추가적인 프레임워크 통합 또는
  커스터마이징을 용이하게 합니다.
- **TestFramework.ts:** 테스트 프레임워크에 대한 공통 인터페이스나 추상화 계층을 제공합니다.
- **index.ts:** 어댑터 관련 모듈들을 한데 모아 내보냅니다.

---
