import app from '../expressApp.js';
import { describeAPI, itDoc, HttpStatus, field, HttpMethod } from 'itdoc';

const targetApp = app;


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
    itDoc('회원가입 성공', () => {
      return apiDoc
        .test()
        .req()
        .body({
          username: field('아이디', 'penekhun'),
          password: field('패스워드', 'P@ssw0rd123!@#'),
        })
        .expect()
        .status(HttpStatus.CREATED);
    });

    itDoc('아이디를 입력하지 않으면 회원가입 실패한다.', async () => {
      await apiDoc
        .test()
        .req()
        .body({
          password: field('패스워드', 'P@ssw0rd123!@#'),
        })
        .expect()
        .status(HttpStatus.BAD_REQUEST)
        .body({
          "error": field('에러 메세지', 'username is required')
        });
    });

    itDoc('패스워드가 8자 이하면 회원가입 실패한다.', async () => {
      await apiDoc
        .test()
        .req()
        .body({
          username: field('아이디', 'penekhun'),
          password: field('패스워드', '1234567'),
        })
        .expect()
        .status(HttpStatus.BAD_REQUEST)
        .body({
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
        .req()
        .pathParam({
          userId: field('유효한 사용자 ID', 'penek'),
        })
        .expect()
        .status(HttpStatus.OK)
        .body({
          userId: field('유저 ID', 'penek'),
          username: field('유저 이름', 'hun'),
          email: field('유저 이메일', 'penekhun@gmail.com'),
          friends: field('유저의 친구', ['zagabi', 'json']),
        });
    });

    itDoc('존재하지 않는 사용자 ID가 주어지면 404 응답을 반환한다.', async () => {
      await apiDoc
        .test()
        .req()
        .pathParam({
          userId: field('존재하지 않는 사용자 ID', 'invalid-user-id'),
        })
        .expect()
        .status(HttpStatus.NOT_FOUND);
    });
  }
);

describeAPI(
  HttpMethod.DELETE,
  '/users/{userId}/friends/{friendId}',
  {
    name: '특정 사용자의 특정 친구 삭제 API',
    tag: 'User',
    summary: '특정 사용자의 친구를 삭제합니다.',
  },
  targetApp,
  (apiDoc) => {
    itDoc('존재 하지 않는 사용자 ID가 주어지면 400 응답을 반환한다.', async () => {
      await apiDoc
        .test()
        .req()
        .pathParam({
          userId: field('존재하지 않는 사용자 ID', 'invalid-user-id'),
        })
        .expect()
        .status(HttpStatus.BAD_REQUEST);
    });

    itDoc('존재하지 않는 친구 ID가 주어지면 404 응답을 반환한다.', async () => {
      await apiDoc
        .test()
        .req()
        .pathParam({
          userId: field('유효한 사용자 ID', 'penek'),
          friendId: field('존재하지 않는 친구 ID', 'invalid-friend-id'),
        })
        .expect()
        .status(HttpStatus.NOT_FOUND);
    });

    itDoc('유효한 사용자 ID와 친구 ID가 주어지면 정상 삭제된다.', async () => {
      await apiDoc
        .test()
        .req()
        .pathParam({
          userId: field('유효한 사용자 ID', 'penek'),
          friendId: field('유효한 친구 ID', 'zagabi'),
        })
        .expect()
        .status(HttpStatus.NO_CONTENT);
    });
  }
)
