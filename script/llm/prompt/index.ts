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
import { RouteResult } from "../parser/type/interface"

/**
 * Generates an instruction prompt for creating `itdoc` test scripts
 * based on analyzed route information and language settings.
 *
 * The function dynamically selects between JavaScript and TypeScript
 * examples and returns a localized prompt (Korean or English) with
 * strict formatting and output rules for test code generation.
 *
 * Rules include:
 * - Output only test code lines (no comments, explanations, or prose).
 * - Follow order and branching guides when generating tests.
 * - Ensure field calls have exactly two arguments.
 * - Properly quote HTTP headers with hyphens.
 * - Do not generate redundant imports or initialization code.
 * - Split long outputs into chunks when necessary.
 * @param {RouteResult[]} routesChunk - A chunk of parsed route definitions
 *                                      used as the basis for test generation.
 * @param {boolean} isEn - Whether to generate the prompt in English (true) or Korean (false).
 * @param {number} part - The sequential part number of the response when the GPT call does not return the full output at once and multiple calls are made to retrieve the continuation.
 * @param {boolean} [isTypeScript] - Whether to generate TypeScript-based test examples instead of JavaScript.
 * @returns {string} A formatted prompt containing route information, language rules,
 *                   and example code for generating `itdoc` tests.
 */
export function getItdocPrompt(
    routesChunk: RouteResult[],
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
            noComments:
                "설명, 주석(//, /* */), 백틱 코드블록(```), 여는/닫는 문구를 절대 포함하지 마세요.",
            orderGuide:
                "출력 순서는 경로(prefix)와 메서드 순으로 정렬하세요. 기본 응답 테스트 → 각 분기 테스트 순으로 묶어서 작성하세요.",
            branchGuide:
                "각 라우트에 정의된 기본 응답과 모든 branches(조건)를 각각 별도의 itdoc 테스트로 생성하세요.",
            branchGuide2:
                "만약 default.status의 값이 빈 배열이라면 해당 default 조건에 해당하는 테스트는 절대 작성하지 않습니다.",
            fieldGuide:
                '모든 field 호출은 반드시 field("설명", "예시값")처럼 2개의 매개변수를 포함해야 합니다(단일 인자 금지).',
            fieldGuide2:
                '만약 a : b 라고 했을 때 b가 객체인 경우 field는 field는("b설명", b) 이런식으로 객체 전체를 설명해야 합니다. 객체 안에 field가 들어가면 안됩니다.',
            headerGuide:
                'HTTP 헤더 키에 하이픈(-)이 포함되어 있으면 반드시 큰따옴표로 감싸세요. 예: "Cache-Control", "Last-Modified"',
            noPathImport:
                "파일 경로 import/require(예: examples/express-*)는 출력하지 마세요. 테스트 러너/초기 설정 코드는 이미 주어졌습니다.",
            initGiven:
                '다음 초기 설정은 이미 포함되어 있으므로 생성하지 마세요: const { describeAPI, itDoc, HttpStatus, field, HttpMethod } = require("itdoc")',
            chunksGuideFirst:
                "출력이 길어질 경우 다음 요청에서 이어받을 수 있도록 적절한 단위로 분할하여 출력하세요. 응답 마지막에 '...' 같은 기호는 넣지 마세요.",
            chunksGuideNext:
                "이전 출력의 이어지는 부분만 출력하세요. 이전 내용을 반복하지 마세요. 분할 제목(1/3 등)은 금지합니다.",
            langOut: "출력은 반드시 한글로 작성하세요.",
            codeOnly: "오직 테스트 코드 줄만 출력하세요.",
            etc: "function_call로 되어있는 부분은 그대로 함수로 출력해야 합니다. ex) fetchedAt: field('조회 시각(ISO 8601 형식)', new Date().toISOString()) 또한, parseInt() 등으로 타입을 유추할 수 있는 경우 해당 타입으로 반환해야 합니다. ex)parseInt(page) 의 경우 1, 2 등의 int 타입으로 출력되어야 합니다. 그리고 describeAPI에는 반드시 summary, tag, description값이 들어가야 합니다. 존재하지 않는 엔드포인트나 파라미터/헤더/바디 필드는 만들지 마세요. 입력에 있는 정보만 사용하세요. res() 이후에 반드시 유효한 status()가 붙어야 합니다.  responses에서 주어지는 json 값들은 임의로 바꾸지 않습니다.",
        },
        en: {
            codeTypes: { js: "JavaScript", ts: "TypeScript" },
            outputInstruction: "And the output must be in English.",
            codeLabel: "code",
            noComments:
                "Do NOT include explanations, comments (// or /* */), or fenced code blocks (```), or any opening/closing prose.",
            orderGuide:
                "Order tests by path prefix and HTTP method. For each route, output the default response test first, then branch tests.",
            branchGuide:
                "For every route, generate separate itdoc tests for the default response and for every branch condition.",
            branchGuide2:
                "If the default.status value is an empty array, never create a test that corresponds to that default condition.",
            fieldGuide:
                'Every field call MUST have exactly two arguments: field("label", "example"). Single-argument calls are forbidden.',
            fieldGuide2:
                'If b is an object when a : b, the field should describe the whole object like this ("b description", b). The field should not be inside the object.',
            headerGuide:
                'If an HTTP header key contains a hyphen (-), it MUST be quoted, e.g., "Cache-Control", "Last-Modified".',
            noPathImport:
                "Do not output any file-path import/require lines (e.g., examples/express-*). The runner/bootstrap is already provided.",
            initGiven:
                'Do not generate the following since it is already included: const { describeAPI, itDoc, HttpStatus, field, HttpMethod } = require("itdoc")',
            chunksGuideFirst:
                "If output is long, split into reasonable parts that can be continued later. Do not append trailing ellipses like '...'.",
            chunksGuideNext:
                "Output only the continuation of the previous part. Do NOT repeat earlier content. Do NOT print part titles like (1/3).",
            langOut: "The output must be in English.",
            codeOnly: "Output only test code lines.",
            etc: "The part with function_call must be output as a function as it is. ex) fetchedAt: field('Inquiry Time (ISO 8601)', new Date().toISOString()) Also, if the type can be inferred by pathInt(), etc., it must be returned to that type. ex) For pathInt(page), it must be output in int type such as 1, 2, etc. And describeAPI must have summary, tag, and description values. Do not create non-existent endpoints or parameter/header/body fields. Use only the information in the input. Be sure to have a valid status () after res().The json values given in responses are not arbitrarily changed.",
        },
    } as const

    const lang = isEn ? LANGUAGE_TEXTS.en : LANGUAGE_TEXTS.ko
    const codeType = isTypeScript ? lang.codeTypes.ts : lang.codeTypes.js
    const codeMessage = `${codeType} ${lang.codeLabel}`
    const partGuide = part > 1 ? lang.chunksGuideNext : lang.chunksGuideFirst

    const promptTemplate = isEn
        ? `
Generate an itdoc test script in ${codeMessage} based on the following test description.

Required Rules:
- ${lang.noComments}
- ${lang.codeOnly}
- ${lang.orderGuide}
- ${lang.branchGuide}
- ${lang.branchGuide2}
- ${lang.fieldGuide}
- ${lang.fieldGuide2}
- ${lang.headerGuide} 
- ${lang.noPathImport}
- ${lang.initGiven}
- ${lang.etc}
- ${partGuide}
- ${lang.outputInstruction} 

[Route Analysis Results to Test]
${JSON.stringify(routesChunk, null, 2)}

[Function Example]
${itdocExample}
`.trim()
        : `
다음 테스트 설명을 기반으로 itdoc 테스트 스크립트를 ${codeMessage}로 생성하세요.

필수 규칙:
- ${lang.noComments}
- ${lang.codeOnly}
- ${lang.orderGuide}
- ${lang.branchGuide}
- ${lang.branchGuide2}
- ${lang.fieldGuide}
- ${lang.fieldGuide2}
- ${lang.headerGuide} 
- ${lang.noPathImport}
- ${lang.initGiven}
- ${lang.etc}
- ${partGuide}
- ${lang.outputInstruction} 

[테스트를 진행해야하는 라우트 분석 결과]
${JSON.stringify(routesChunk, null, 2)}

[함수 예시]
${itdocExample}
`.trim()

    return promptTemplate
}
