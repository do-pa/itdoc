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

function getCdocprompt(content) {
    return `
    다음의 테스트내용을 기반으로 다음의 인터페이스를 갖춘 함수를 출력해주세요. 오로지 자바스크립트파일로만 떨어져야 하며 코드에 대한 설명은 하지 않습니다.
    테스트내용:
    ${content}
    인터페이스:
     - 테스트 함수: describeAPI는 API 문서 및 테스트 케이스를 정의하는 함수입니다.
     - 테스트 케이스 함수: itDoc은 각 세부 테스트 시나리오를 기술하며, 테스트 실행을 위한 설정을 포함합니다.
     - 테스트 실행: 각 테스트는 apiDoc.test()를 통해 실행되며, 메서드체이닝으로 withRequestBody()와 expectStatus()로 요청본문과 응답상태값 등을 수행합니다.

    함수예시:
    describeAPI(
      HttpMethod.POST,
      '/signup',
      {
        name: '회원가입 API',
        tag: 'Auth',
        summary: '사용자로 부터 아이디와 패스워드를 받아 회원가입을 수행합니다.',
      },
      targetApp,
      (apiDoc) => {
        itDoc('회원가입 성공', async () => {
          await apiDoc
            .test()
            .withRequestBody({
              username: field('아이디', 'penekhun'),
              password: field('패스워드', 'P@ssw0rd123!@#'),
            })
            // .withPrettyPrint()
            .expectStatus(HttpStatus.CREATED);
        });

        itDoc('아이디를 입력하지 않으면 회원가입 실패한다.', async () => {
          await apiDoc
            .test()
            .withRequestBody({
              password: field('패스워드', 'P@ssw0rd123!@#'),
            })
            .expectStatus(HttpStatus.BAD_REQUEST)
            .expectResponseBody({
              "error": field('에러 메세지', 'username is required')
            });
        });

        itDoc('패스워드가 8자 이하면 회원가입 실패한다.', async () => {
          await apiDoc
            .test()
            .withRequestBody({
              username: field('아이디', 'penekhun'),
              password: field('패스워드', '1234567'),
            })
            .expectStatus(HttpStatus.BAD_REQUEST)
            .expectResponseBody({
              "error": field('에러 메세지', 'password must be at least 8 characters')
            });
        });
      },
    );

    describeAPI(
      HttpMethod.GET,
      '/users/{userId}',
      {
        name: '사용자 조회 API',
        tag: 'User',
        summary: '사용자 ID를 받아 사용자 정보를 반환합니다.',
      },
      targetApp,
      (apiDoc) => {
        itDoc('유효한 사용자 ID가 주어지면 200 응답을 반환한다.', async () => {
          await apiDoc
            .test()
            .withPathParams({
              userId: field('유효한 사용자 ID', 'penek'),
            })
            .expectStatus(HttpStatus.OK)
            .expectResponseBody({
              userId: field('유저 ID', 'penek'),
              username: field('유저 이름', 'hun'),
              email: field('유저 이메일', 'penekhun@gmail.com'),
              friends: field('유저의 친구', ['zagabi', 'json']),
            });
        });

        itDoc('존재하지 않는 사용자 ID가 주어지면 404 응답을 반환한다.', async () => {
          await apiDoc
            .test()
            .withPathParams({
              userId: field('존재하지 않는 사용자 ID', 'invalid-user-id'),
            })
            .expectStatus(HttpStatus.NOT_FOUND);
        });
      }
    );
`
}

export default getCdocprompt;
