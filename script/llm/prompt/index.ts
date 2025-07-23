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

import { itdocExampleJs, itdocExampleTs } from "../examples/index"
/**
 * 주어진 테스트 내용과 언어 설정에 따라, API 문서 및 테스트 케이스를 생성하기 위한
 * itdoc함수를 출력하기 위한 프롬프트 메시지를 반환합니다.
 *
 * 이 함수는 지정된 예제 파일(예: express 테스트 파일)을 읽어와 함수 예시로 포함하며,
 * 입력된 테스트 내용(content)와 언어 설정(isEn)에 따라 추가 메시지를 덧붙입니다.
 * @param {string} content - 테스트 내용(테스트 케이스에 대한 설명)을 담은 문자열.
 * @param {boolean} isEn - true일 경우 결과물을 영어로, false일 경우 한글로 출력하도록 추가 메시지를 설정.
 * @param {number} part - 여러 출력으로 나누어질 경우 현재 부분 번호
 * @param {boolean} isTypeScript - true일 경우 TypeScript로, false일 경우 JavaScript로 출력
 * @returns {string} - 생성된 프롬프트 메시지 문자열.
 */
export function getItdocPrompt(
    content: string,
    isEn: boolean,
    part: number,
    isTypeScript: boolean = false,
): string {
    const itdocExample: string = isTypeScript ? itdocExampleTs : itdocExampleJs

    const LANGUAGE_TEXTS = {
        ko: {
            codeTypes: { js: "자바스크립트", ts: "타입스크립트" },
            outputInstruction: "그리고 반드시 한글로 출력해야 합니다.",
            codeLabel: "코드",
        },
        en: {
            codeTypes: { js: "JavaScript", ts: "TypeScript" },
            outputInstruction: "And the output must be in English.",
            codeLabel: "code",
        },
    } as const

    const lang = isEn ? LANGUAGE_TEXTS.en : LANGUAGE_TEXTS.ko
    const codeType = isTypeScript ? lang.codeTypes.ts : lang.codeTypes.js
    const codeMessage = `${codeType} ${lang.codeLabel}`

    const partGuide =
        part > 1
            ? `이전 출력의 이어지는 ${part}번째 부분만 출력하세요. 이전 내용을 반복하지 마세요.`
            : `출력이 길어질 경우 다음 요청에서 이어받을 수 있도록 적절한 단위로 분할하여 출력하세요. 응답 마지막에 '...' 같은 기호는 넣지 마세요.`

    return `
다음 테스트 내용을 기반으로 itdoc 테스트 스크립트를 ${codeMessage}로 생성해주세요.
- 모든 라우터에 대한 테스트를 포함해야 합니다.
- field는 field("a", "b") 처럼 2개의 매개변수를 반드시 포함해야 합니다. field로만 나오면 안됩니다.
- 중복되는 설명은 없어야 합니다.
- HTTP 헤더와 같이 하이픈(-)이 포함된 키는 반드시 큰따옴표로 감싸야 합니다. 
 올바른 예시: "Cache-Control", "Last-Modified" 
 잘못된 예시: Cache-Control, Last-Modified (no) 
- 코드 설명 없이 코드만 출력해야 하며, \`(1/10)\` 같은 자동 분할 제목은 넣지 마세요.
- 출력은 ${codeMessage}로만 구성되어야 하며, 백틱 블록(\`\`\`)도 사용하지 않습니다.
- ${partGuide}
${lang.outputInstruction}

[테스트 설명 내용]
${content}

[함수 예시]
${itdocExample}
- 경로에 해당하는 코드는 출력하지 말아야 합니다.
ex) import { app } from "examples/express-ts/index.ts"
    또는
    const app = require("examples/express/index.js")

- 아래 초기 설정 코드는 이미 포함되어 있으니 해당부분은 생성하지 말아야 합니다.
const { describeAPI, itDoc, HttpStatus, field, HttpMethod } = require("itdoc")
- header() 메서드는 다음과 같이 객체가 포함되어야 합니다.
header({
    Authorization: field("인증 토큰", "Bearer 123456"),
})
`.trim()
}

/**
 * JSON 기반 API 명세서를 마크다운 형태로 만들기 위한 프롬프트를 반환합니다.
 * @param {any} content - API 정의를 담은 JSON 객체.
 * @param part
 * @returns {string} - Markdown 생성용 프롬프트 메시지.
 */
export function getMDPrompt(content: any, part?: number): string {
    const partNote = part ? ` (이 문서는 ${part}번째 요청입니다)` : ""
    return `다음 JSON을 바탕으로 API 테스트 케이스만 Markdown 형식으로 작성하세요${partNote}.
입력 JSON: 
${JSON.stringify(content, null, 2)} 
출력 포맷 (각 항목만):
- 엔드포인트 (예: GET /api/products)
- 테스트 이름 (간결하게)
- 요청 조건 (필요 시 요청 바디·경로 매개변수 등 자세하게 표현할 것)
- 예상 응답 (상태 코드 및 반환되는 객체 또는 메시지 등 자세하게 표현할 것)

예시) 
PUT /api/products/:id
- 테스트 이름: 제품 업데이트 성공
- 요청 조건: 유효한 제품 ID와 name, price, category 제공
- 예상 응답: 상태 코드 500, "message"가 "Server is running"인 JSON 응답, "data"에 "timestamp", "uptime", "memoryUsage" 정보 포함

지켜야 할 사항:
1. 제목·개요·요약·결론 등의 부가 설명은 절대 포함하지 마세요.  
2. 일반 지침 문구(“정상 흐름과 오류 흐름을 모두 포함” 등)도 쓰지 않습니다.  
3. 마크다운 강조(**), 코드 블록 안의 별도 스타일링은 사용 금지입니다.  
4. 출력이 길어지면 (1 / 3), (2 / 3)처럼 순서 표기하여 분할하세요.  
5. 오직 테스트 케이스 목록만, 항목별로 구분해 나열합니다.
6. DELETE, PUT, GET, POST, PATCH 앞에 - 를 붙이지 않습니다.
`
}
