# Wrapper-based API Testing Examples

이 문서는 `wrapTest`를 사용한 실전 예제를 제공합니다.

## 📚 목차

- [기본 사용법](#기본-사용법)
- [인증 & 권한](#인증--권한)
- [복잡한 워크플로우](#복잡한-워크플로우)
- [에러 처리](#에러-처리)
- [메타데이터 활용](#메타데이터-활용)
- [기존 코드 마이그레이션](#기존-코드-마이그레이션)

## 기본 사용법

### 1. 간단한 GET 요청

```typescript
import { wrapTest, request } from 'itdoc/wrappers'

const apiTest = wrapTest(it)

describe('Product API', () => {
  apiTest('should get all products', async () => {
    const response = await request(app)
      .get('/api/products')
    
    expect(response.status).toBe(200)
    expect(response.body).toHaveProperty('products')
    expect(Array.isArray(response.body.products)).toBe(true)
  })
})
```

### 2. POST 요청으로 리소스 생성

```typescript
apiTest('should create new product', async () => {
  const response = await request(app)
    .post('/api/products')
    .send({
      name: 'iPhone 15',
      price: 999.99,
      category: 'electronics'
    })
  
  expect(response.status).toBe(201)
  expect(response.body).toHaveProperty('id')
  expect(response.body.name).toBe('iPhone 15')
})
```

### 3. 쿼리 파라미터 사용

```typescript
apiTest('should filter products by category', async () => {
  const response = await request(app)
    .get('/api/products')
    .query({ 
      category: 'electronics',
      minPrice: 500,
      maxPrice: 2000
    })
  
  expect(response.status).toBe(200)
  expect(response.body.products.every(p => p.category === 'electronics')).toBe(true)
})
```

## 인증 & 권한

### 4. JWT 토큰 인증

```typescript
describe('Auth API', () => {
  apiTest('should login and get token', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@example.com',
        password: 'password123'
      })
    
    expect(response.status).toBe(200)
    expect(response.body).toHaveProperty('token')
  })
})
```

### 5. 인증된 요청

```typescript
apiTest('should access protected route with token', async () => {
  const response = await request(app)
    .get('/api/admin/dashboard')
    .set('Authorization', 'Bearer eyJhbGciOiJIUzI1NiIs...')
  
  expect(response.status).toBe(200)
  expect(response.body).toHaveProperty('stats')
})
```

### 6. 권한 부족 에러

```typescript
apiTest('should reject unauthorized access', async () => {
  const response = await request(app)
    .get('/api/admin/users')
  // No Authorization header
  
  expect(response.status).toBe(401)
  expect(response.body.error).toBe('Unauthorized')
})
```

## 복잡한 워크플로우

### 7. 전체 사용자 등록 플로우

```typescript
apiTest('should complete user registration flow', async () => {
  // 1. 회원가입
  const signupRes = await request(app)
    .post('/api/auth/signup')
    .send({
      email: 'newuser@example.com',
      password: 'secure123',
      name: 'John Doe'
    })
  
  expect(signupRes.status).toBe(201)
  const userId = signupRes.body.id
  
  // 2. 이메일 인증 (시뮬레이션)
  const verifyRes = await request(app)
    .post(`/api/auth/verify/${userId}`)
    .send({ code: '123456' })
  
  expect(verifyRes.status).toBe(200)
  
  // 3. 로그인
  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({
      email: 'newuser@example.com',
      password: 'secure123'
    })
  
  expect(loginRes.status).toBe(200)
  expect(loginRes.body).toHaveProperty('token')
})
```

### 8. 주문 생성 및 결제

```typescript
apiTest('should create order and process payment', async () => {
  // 1. 장바구니에 상품 추가
  const cartRes = await request(app)
    .post('/api/cart/items')
    .set('Authorization', 'Bearer token')
    .send({
      productId: 123,
      quantity: 2
    })
  
  expect(cartRes.status).toBe(200)
  
  // 2. 주문 생성
  const orderRes = await request(app)
    .post('/api/orders')
    .set('Authorization', 'Bearer token')
    .send({
      shippingAddress: '123 Main St',
      paymentMethod: 'credit_card'
    })
  
  expect(orderRes.status).toBe(201)
  const orderId = orderRes.body.id
  
  // 3. 결제 처리
  const paymentRes = await request(app)
    .post(`/api/orders/${orderId}/pay`)
    .set('Authorization', 'Bearer token')
    .send({
      cardNumber: '4242424242424242',
      expiry: '12/25',
      cvv: '123'
    })
  
  expect(paymentRes.status).toBe(200)
  expect(paymentRes.body.status).toBe('paid')
})
```

## 에러 처리

### 9. Validation 에러

```typescript
apiTest('should validate required fields', async () => {
  const response = await request(app)
    .post('/api/products')
    .send({
      // name 누락
      price: 999.99
    })
  
  expect(response.status).toBe(400)
  expect(response.body.errors).toContain('name is required')
})
```

### 10. Not Found 에러

```typescript
apiTest('should return 404 for non-existent resource', async () => {
  const response = await request(app)
    .get('/api/products/99999')
  
  expect(response.status).toBe(404)
  expect(response.body.error).toBe('Product not found')
})
```

### 11. Server 에러

```typescript
apiTest('should handle server errors gracefully', async () => {
  const response = await request(app)
    .post('/api/products/import')
    .send({ file: 'invalid-data' })
  
  expect(response.status).toBe(500)
  expect(response.body).toHaveProperty('error')
})
```

## 메타데이터 활용

### 12. 상세한 API 문서 메타데이터

```typescript
apiTest.withMeta({
  summary: 'Create Product',
  description: 'Creates a new product in the inventory system',
  tags: ['Products', 'Inventory'],
})('POST /api/products - Create product', async () => {
  const response = await request(app)
    .post('/api/products')
    .send({
      name: 'MacBook Pro',
      price: 2499.99,
      category: 'computers'
    })
  
  expect(response.status).toBe(201)
})
```

### 13. Deprecated API 표시

```typescript
apiTest.withMeta({
  summary: 'Legacy User List',
  tags: ['Users', 'Legacy'],
  deprecated: true,
  description: 'This endpoint is deprecated. Use /api/v2/users instead.'
})('GET /api/users - List users (deprecated)', async () => {
  const response = await request(app)
    .get('/api/users')
  
  expect(response.status).toBe(200)
})
```

### 14. 여러 태그로 분류

```typescript
apiTest.withMeta({
  summary: 'Export User Data (GDPR)',
  tags: ['Users', 'Privacy', 'GDPR', 'Export'],
  description: 'Exports all user data for GDPR compliance'
})('GET /api/users/:id/export - Export user data', async () => {
  const response = await request(app)
    .get('/api/users/123/export')
    .set('Authorization', 'Bearer token')
  
  expect(response.status).toBe(200)
  expect(response.headers['content-type']).toContain('application/json')
})
```

## 기존 코드 마이그레이션

### 15. 기존 Supertest 코드 마이그레이션

**Before (원본):**
```typescript
import request from 'supertest'

describe('User API', () => {
  it('should create user', async () => {
    const response = await request(app)
      .post('/api/users')
      .send({ name: 'John', email: 'john@test.com' })
    
    expect(response.status).toBe(201)
  })
})
```

**After (wrapTest 적용):**
```typescript
import { wrapTest, request } from 'itdoc/wrappers'

const apiTest = wrapTest(it)

describe('User API', () => {
  apiTest('should create user', async () => {
    const response = await request(app)
      .post('/api/users')
      .send({ name: 'John', email: 'john@test.com' })
    
    expect(response.status).toBe(201)
  })
})
```

**변경사항:**
1. ✅ Import 변경: `supertest` → `itdoc/wrappers`
2. ✅ `wrapTest(it)` 추가
3. ✅ `it` → `apiTest` 사용
4. ✅ 나머지 코드는 동일!

### 16. Jest describe.each 패턴과 함께 사용

```typescript
const apiTest = wrapTest(it)

describe.each([
  { role: 'admin', canDelete: true },
  { role: 'user', canDelete: false },
  { role: 'guest', canDelete: false },
])('Authorization for $role', ({ role, canDelete }) => {
  apiTest(`${role} should ${canDelete ? 'be able to' : 'not be able to'} delete users`, async () => {
    const response = await request(app)
      .delete('/api/users/123')
      .set('Authorization', `Bearer ${role}-token`)
    
    expect(response.status).toBe(canDelete ? 200 : 403)
  })
})
```

### 17. Mocha에서 사용

```typescript
import { wrapTest, request } from 'itdoc/wrappers'
import { expect } from 'chai'

const apiTest = wrapTest(it)

describe('Product API', function() {
  apiTest('should get products', async function() {
    const response = await request(app)
      .get('/api/products')
    
    expect(response.status).to.equal(200)
    expect(response.body).to.have.property('products')
  })
})
```

## 🎯 Best Practices

### ✅ DO

```typescript
// ✅ 명확한 테스트 설명
apiTest('should return 404 when product not found', async () => {
  // ...
})

// ✅ 메타데이터로 문서 품질 향상
apiTest.withMeta({
  summary: 'User Registration',
  tags: ['Auth', 'Users']
})('POST /auth/signup', async () => {
  // ...
})

// ✅ 여러 API 호출을 워크플로우로 테스트
apiTest('should complete checkout flow', async () => {
  await request(app).post('/cart/add').send({...})
  await request(app).post('/orders').send({...})
  await request(app).post('/payment').send({...})
})
```

### ❌ DON'T

```typescript
// ❌ 모호한 테스트 설명
apiTest('test1', async () => {
  // ...
})

// ❌ 문서화가 필요 없는 헬퍼 함수를 apiTest로 감싸기
apiTest('helper function', async () => {
  // 이건 일반 it()을 사용하세요
})

// ❌ 너무 많은 API 호출 (10개 이상)
apiTest('complex flow', async () => {
  // 10개 이상의 API 호출...
  // 테스트를 분리하는 것이 좋습니다
})
```

## 📊 비교표

| 기능 | 기존 itDoc | wrapTest |
|------|-----------|----------|
| 사용 난이도 | 중간 (새 DSL 학습) | 쉬움 (기존 패턴 유지) |
| 코드 변경량 | 많음 | 최소 |
| 자동 캡처 | ❌ 수동 설정 | ✅ 자동 |
| 메타데이터 | 체이닝 방식 | `withMeta()` |
| 기존 코드 호환 | 낮음 | 높음 |
| 타입 안전성 | ✅ | ✅ |

## 🔗 추가 리소스

- [README.md](./README.md) - 전체 문서
- [기존 itDoc 문서](../../README.md) - 기존 방식 비교
- [TypeScript 타입 정의](./types.ts)
