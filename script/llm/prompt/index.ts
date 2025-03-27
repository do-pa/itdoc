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

import fs from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"

const __filename: string = fileURLToPath(import.meta.url)
const __dirname: string = dirname(__filename)

/**
 * 주어진 테스트 내용과 언어 설정에 따라, API 문서 및 테스트 케이스를 생성하기 위한
 * itdoc함수를 출력하기 위한 프롬프트 메시지를 반환합니다.
 *
 * 이 함수는 지정된 예제 파일(예: express 테스트 파일)을 읽어와 함수 예시로 포함하며,
 * 입력된 테스트 내용(content)와 언어 설정(isEn)에 따라 추가 메시지를 덧붙입니다.
 * @param {string} content - 테스트 내용(테스트 케이스에 대한 설명)을 담은 문자열.
 * @param {boolean} isEn - true일 경우 결과물을 영어로, false일 경우 한글로 출력하도록 추가 메시지를 설정.
 * @returns {string} - 생성된 프롬프트 메시지 문자열.
 */
function getCdocprompt(content: string, isEn: boolean): string {
    const itdocExamplePath: string = join(
        __dirname,
        "../../../examples/express/__tests__/expressApp.test.js",
    )
    const itdocExample: string = fs.readFileSync(itdocExamplePath, "utf8")

    const addmsg: string = isEn
        ? "그리고 반드시 영어로 출력해야 합니다."
        : "그리고 반드시 한글로 출력해야 합니다."

    return `
다음의 테스트내용을 기반으로 다음의 인터페이스를 갖춘 함수를 출력해주세요. 오로지 자바스크립트 파일로만 결과물이 떨어져야 하며, 코드에 대한 설명은 하지 않습니다.
테스트내용:
${content}
인터페이스:
 - 테스트 함수: describeAPI는 API 문서 및 테스트 케이스를 정의하는 함수입니다.
 - 테스트 케이스 함수: itDoc은 각 세부 테스트 시나리오를 기술하며, 테스트 실행을 위한 설정을 포함합니다.
 - 테스트 실행: 각 테스트는 apiDoc.test()를 통해 실행되며, 메서드 체이닝으로 withRequestBody()와 expectStatus()로 요청본문과 응답상태값 등을 수행합니다.
${addmsg}

함수예시:
${itdocExample}
`
}

export default getCdocprompt
