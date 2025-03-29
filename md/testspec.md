회원가입 API 테스트 문서

1. API 개요

HTTP Method: POST  
Endpoint: /signup  
API 이름: 회원가입 API  
태그: Auth  
요약: 사용자의 아이디와 패스워드를 받아 회원가입을 수행합니다.

2. 테스트 케이스 상세 설명

테스트 1: 회원가입 성공

- 테스트 제목: 회원가입 성공
- 설명: 올바른 아이디와 패스워드를 제공하면 회원가입에 성공합니다.
- 요청 본문:  
  {  
   "username": "penekhun",  
   "password": "P@ssw0rd123!@#"  
  }
- 예상 응답 상태: HTTP 상태 코드 201 CREATED

테스트 2: 아이디 미입력으로 인한 회원가입 실패

- 테스트 제목: 아이디를 입력하지 않으면 회원가입 실패한다.
- 설명: 아이디(username) 필드가 없는 경우, 회원가입이 실패하며 적절한 오류 메시지가 반환됩니다.
- 요청 본문:  
  {  
   "password": "P@ssw0rd123!@#"  
  }
- 예상 응답 상태: HTTP 상태 코드 400 BAD REQUEST
- 예상 응답 본문:  
  {  
   "error": "username is required"  
  }

테스트 3: 패스워드 길이 미충족으로 인한 회원가입 실패

- 테스트 제목: 패스워드가 8자 이하면 회원가입 실패한다.
- 설명: 패스워드의 길이가 8자 미만인 경우, 회원가입이 실패하며 이에 따른 오류 메시지가 반환됩니다.
- 요청 본문:  
  {  
   "username": "penekhun",  
   "password": "1234567"  
  }
- 예상 응답 상태: HTTP 상태 코드 400 BAD REQUEST
- 예상 응답 본문:  
  {  
   "error": "password must be at least 8 characters"  
  }
