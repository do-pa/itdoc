# Wrapper-based API Testing

고차함수 래핑 방식으로 기존 Jest/Mocha 테스트를 최소한으로 수정하여 자동으로 API 문서를 생성합니다.

## 📋 개요

이 모듈은 기존 테스트 프레임워크의 `it` 함수를 감싸서 HTTP request/response를 자동으로 캡처하고, 테스트 성공 시 OpenAPI 문서를 생성합니다.

### 핵심 특징

- ✅ **최소 변경**: `it` → `wrapTest(it)` 한 줄만 변경
- ✅ **자동 캡처**: Proxy 기반 투명한 request/response 인터셉션
- ✅ **프레임워크 중립**: Jest/Mocha 모두 지원
- ✅ **기존 코드 보존**: 새로운 방식이므로 기존 `itDoc` 방식과 공존 가능
- ✅ **타입 안전**: 완전한 TypeScript 지원

## 🚀 사용법

### Before (기존 테스트)

```typescript
import request from 'supertest'

describe('User API', () => {
  it('should create user', async () => {
    const response = await request(app)
      .post('/users')
      .send({ name: 'John', email: 'john@test.com' })
    
    expect(response.status).toBe(201)
  })
})
```

### After (itdoc wrappers 적용)

```typescript
import { wrapTest, request } from 'itdoc/wrappers'

const apiTest = wrapTest(it)  // ← it 함수를 래핑

describe('User API', () => {
  apiTest('should create user', async () => {  // ← it 대신 apiTest 사용
    const response = await request(app)        // ← itdoc의 request 사용
      .post('/users')
      .send({ name: 'John', email: 'john@test.com' })
    
    expect(response.status).toBe(201)
    // ✅ 자동으로 request/response 캡처 & 문서 생성!
  })
})
```

## 📝 주요 API

### `wrapTest(it)`

테스트 프레임워크의 `it` 함수를 래핑하여 자동 캡처 기능을 추가합니다.

```typescript
import { wrapTest } from 'itdoc/wrappers'

const apiTest = wrapTest(it)  // Jest 또는 Mocha의 it
```

### `request(app)`

Supertest를 기반으로 한 HTTP 클라이언트입니다. `CaptureContext`가 활성화된 상태에서는 자동으로 request/response를 캡처합니다.

```typescript
import { request } from 'itdoc/wrappers'

const response = await request(app)
  .post('/users')
  .send({ name: 'John' })
```

### 메타데이터 추가

`withMeta()` 메서드로 API 문서 메타데이터를 추가할 수 있습니다.

```typescript
apiTest.withMeta({
  summary: 'Create User',
  tags: ['Users', 'Registration'],
  description: 'Register a new user account',
})('should create user', async () => {
  const response = await request(app)
    .post('/users')
    .send({ name: 'John' })
  
  expect(response.status).toBe(201)
})
```

## 💡 사용 예시

### 1. 기본 사용

```typescript
import { wrapTest, request } from 'itdoc/wrappers'

const apiTest = wrapTest(it)

describe('User API', () => {
  apiTest('should get all users', async () => {
    const response = await request(app).get('/users')
    
    expect(response.status).toBe(200)
    expect(response.body).toHaveProperty('users')
  })
})
```

### 2. 인증 헤더 사용

```typescript
apiTest('should get user profile', async () => {
  const response = await request(app)
    .get('/users/me')
    .set('Authorization', 'Bearer token123')
  
  expect(response.status).toBe(200)
})
```

### 3. 쿼리 파라미터

```typescript
apiTest('should filter users', async () => {
  const response = await request(app)
    .get('/users')
    .query({ role: 'admin', active: true })
  
  expect(response.status).toBe(200)
})
```

### 4. 여러 API 호출 (단일 테스트)

```typescript
apiTest('should complete user workflow', async () => {
  // 1. Create user
  const createRes = await request(app)
    .post('/users')
    .send({ name: 'John' })
  
  const userId = createRes.body.id
  
  // 2. Get user
  const getRes = await request(app)
    .get(`/users/${userId}`)
  
  expect(getRes.status).toBe(200)
  expect(getRes.body.name).toBe('John')
  
  // ✅ 두 API 호출 모두 자동 캡처됨!
})
```

### 5. 메타데이터와 함께 사용

```typescript
apiTest.withMeta({
  summary: 'User Registration API',
  tags: ['Auth', 'Users'],
  description: 'Register a new user with email and password',
})('POST /auth/signup - Register user', async () => {
  const response = await request(app)
    .post('/auth/signup')
    .send({
      email: 'john@example.com',
      password: 'secure123'
    })
  
  expect(response.status).toBe(201)
  expect(response.body).toHaveProperty('token')
})
```

## 🏗️ 아키텍처

### 핵심 컴포넌트

1. **CaptureContext** (`core/CaptureContext.ts`)
   - AsyncLocalStorage 기반 컨텍스트 관리
   - 스레드 안전한 request/response 데이터 격리

2. **interceptedRequest** (`core/interceptedRequest.ts`)
   - Proxy 기반 Supertest 래핑
   - 투명한 HTTP request/response 캡처

3. **wrapTest** (`wrapTest.ts`)
   - 고차함수 래퍼
   - 테스트 라이프사이클 관리 및 문서 생성

### 동작 흐름

```
1. wrapTest(it) → 래핑된 테스트 함수 반환
2. apiTest(...) 호출 → AsyncLocalStorage 컨텍스트 생성
3. 사용자 테스트 실행 → request(app) 감지
4. Proxy로 감싸서 반환 → 메서드 호출 캡처
5. .then() 호출 → response 캡처
6. 테스트 성공 → TestResultCollector로 전달
7. 모든 테스트 완료 → OpenAPI 문서 생성
```

## ⚖️ 기존 방식과 비교

### 기존 `itDoc` 방식

```typescript
import { itDoc, req } from 'itdoc'

itDoc('should create user', async () => {
  const response = await req(app)
    .post('/users')
    .description('Create user')
    .tag('Users')
    .send({ name: 'John' })
    .expect(201)
})
```

**특징:**
- DSL 방식으로 명시적 메타데이터 추가
- 체이닝 기반 API
- 기존 코드 패턴 변경 필요

### 새로운 `wrapTest` 방식

```typescript
import { wrapTest, request } from 'itdoc/wrappers'

const apiTest = wrapTest(it)

apiTest('should create user', async () => {
  const response = await request(app)
    .post('/users')
    .send({ name: 'John' })
  
  expect(response.status).toBe(201)
})
```

**특징:**
- 고차함수 래핑으로 자동 캡처
- 기존 테스트 패턴 유지
- 최소한의 코드 변경

**두 방식 모두 사용 가능하며, 프로젝트 요구사항에 따라 선택할 수 있습니다.**

## 🧪 테스트

### Unit Tests

```bash
pnpm test:unit -- --grep "CaptureContext"
pnpm test:unit -- --grep "interceptedRequest"
pnpm test:unit -- --grep "wrapTest"
```

### Integration Tests

```bash
pnpm test:unit -- --grep "wrapTest integration"
```

## 📦 Export

```typescript
// Public API
export { wrapTest } from './wrapTest'
export { request } from './core/interceptedRequest'
export type { ApiDocMetadata, WrappedTestFunction, TestFunction } from './types'
```

## 🔄 확장 가능성

### 다른 HTTP 클라이언트 지원

```typescript
// axios, fetch 등 다른 클라이언트도 추가 가능
import { createAxiosInterceptor } from 'itdoc/wrappers/axios'
```

### 커스텀 훅

```typescript
// 향후 확장 가능
wrapTest(it, {
  beforeCapture: (req) => { /* 민감 데이터 마스킹 */ },
  afterCapture: (result) => { /* 커스텀 검증 */ }
})
```

## 📄 라이선스

Apache License 2.0
