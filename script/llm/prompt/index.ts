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
- HTTP 헤더와 같이 하이픈(-)이 포함된 키는 반드시 큰따옴표로 감싸야 합니다. 예: "Cache-Control", "Last-Modified" (✅) Cache-Control, Last-Modified (❌) 
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
    return `
        다음 JSON 기반으로 API 테스트 명세서 마크다운(Markdown)을 생성하세요.${partNote}
        - "API 테스트 명세서" 같은 제목은 포함하지 마세요.
        - 각 테스트 항목만 상세히 기술합니다. 파일 제목, 개요, 결론, 요약 등은 작성하지 마세요.
        - 특히 "모든 테스트 케이스는 ~ 기반으로 작성되어야 합니다" 또는 "정상적인 흐름과 오류 상황을 모두 포함해야 합니다" 같은 일반적인 설명은 절대 포함하지 마세요.
        다음 JSON 기반으로 API 테스트 명세서 마크다운(Markdown)을 생성하세요.${partNote}
        - "API 테스트 명세서" 같은 제목은 포함하지 마세요.
        - 제목, 개요, 결론, 요약, 일반 지침 등은 절대 포함하지 마세요.
        - "정상적인 응답과 오류 응답을 테스트합니다", "조건 분기 확인", "상태 코드 확인" 등의 일반적 설명은 절대 쓰지 마세요.
        - 오직 테스트 케이스만 상세히 작성하세요. 테스트 이름, 요청 조건, 예상 응답만 나열하십시오.
        - 각 항목은 서로 구분 가능하도록 개별적으로 작성하되, 서론/설명 없이 직접 시작하세요.
        - 각 테스트 항목만 상세히 기술합니다. 파일 제목, 개요, 결론, 요약 등은 작성하지 마세요.
        - 출력이 길 경우 반드시 (1/10), (2/10), (3/10)처럼 분할해주세요. 분할된 응답은 이어지도록 하며 중복 없이 구성합니다.
        - 강조표시(**), 백틱(\`\`\`) 등 마크다운 스타일은 사용하지 마세요.
        JSON 입력:
        ${JSON.stringify(content, null, 2)}

        `
}
