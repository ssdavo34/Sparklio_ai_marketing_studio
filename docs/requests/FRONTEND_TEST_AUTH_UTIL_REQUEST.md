# Frontend/QA 팀 작업 요청서: 테스트 인증 유틸 구현

**요청 팀**: A팀 (QA & Testing)
**요청일**: 2025-11-16
**우선순위**: 🟡 **중간** (Backend 작업 완료 후 진행)
**담당**: C팀 (Frontend) 또는 A팀 (QA)

---

## 1. 요청 배경

현재 Backend API 통합 테스트에서 JWT 인증 토큰을 `.env.test` 파일에 하드코딩된 더미 값으로 사용하고 있습니다.

**현재 방식의 문제점**:
- 토큰이 만료되면 테스트 전체 실패
- 비밀키 변경 시 토큰 재생성 필요
- 관리가 번거롭고 보안에 취약

**개선 방향**:
- 테스트 실행 시 로그인 API를 호출하여 **동적으로 JWT 토큰 발급**
- 토큰을 재사용하여 불필요한 로그인 요청 최소화
- 계정 정보만 `.env.test`에 보관

---

## 2. 요청 작업 내용

### 2.1 테스트 인증 유틸 함수 작성

**파일 위치**: `tests/utils/auth.ts` (신규 생성)

```typescript
/**
 * 테스트용 인증 유틸리티
 *
 * 사용법:
 *   const token = await getTestToken();
 *   const response = await request.get('/api/v1/protected', {
 *     headers: { Authorization: `Bearer ${token}` }
 *   });
 */

import axios from 'axios';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8000';
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || 'testuser@sparklio.ai';
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || 'testpass123';

// 토큰 캐시 (테스트 세션 동안 재사용)
let cachedToken: string | null = null;
let tokenExpiry: number | null = null;

/**
 * 테스트용 JWT 토큰을 가져옵니다.
 *
 * - 캐시된 토큰이 유효하면 재사용
 * - 만료되었거나 없으면 로그인 API 호출하여 새로 발급
 *
 * @returns {Promise<string>} JWT access token
 * @throws {Error} 로그인 실패 시
 */
export async function getTestToken(): Promise<string> {
  // 캐시된 토큰이 있고 유효하면 재사용
  if (cachedToken && tokenExpiry && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  try {
    // 로그인 API 호출
    const response = await axios.post(`${API_BASE_URL}/api/v1/auth/login`, {
      email: TEST_USER_EMAIL,
      password: TEST_USER_PASSWORD,
    });

    const { access_token, expires_in } = response.data;

    if (!access_token) {
      throw new Error('No access_token in login response');
    }

    // 토큰 캐시 및 만료 시간 설정
    cachedToken = access_token;

    // expires_in이 있으면 사용, 없으면 1시간으로 가정
    const expirySeconds = expires_in || 3600;
    tokenExpiry = Date.now() + (expirySeconds * 1000) - 60000; // 1분 여유

    console.log(`✅ Test token acquired (expires in ${expirySeconds}s)`);
    return cachedToken;

  } catch (error: any) {
    console.error('❌ Failed to get test token:', error.message);

    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }

    throw new Error(`Test authentication failed: ${error.message}`);
  }
}

/**
 * 캐시된 토큰을 초기화합니다.
 *
 * 테스트 간 토큰을 강제로 재발급해야 할 때 사용합니다.
 */
export function clearTestToken(): void {
  cachedToken = null;
  tokenExpiry = null;
  console.log('🗑️  Test token cache cleared');
}

/**
 * 테스트용 사용자 정보를 가져옵니다.
 *
 * @returns {Object} 테스트 사용자 이메일과 비밀번호
 */
export function getTestUserInfo() {
  return {
    email: TEST_USER_EMAIL,
    password: TEST_USER_PASSWORD,
  };
}
```

---

### 2.2 `.env.test` 업데이트

기존 `.env.test` 파일에서 `TEST_TOKEN`을 제거하고, 대신 계정 정보를 추가합니다.

**수정 위치**: `.env.test` (라인 48-58)

**변경 전**:
```bash
# 인증 (JWT)
# ============================================

# 테스트용 JWT 시크릿 (프로덕션과 다른 값 사용)
JWT_SECRET=test-secret-key-do-not-use-in-production
JWT_ALGORITHM=HS256
JWT_EXPIRES_IN=86400

# 테스트용 JWT 토큰 (test_data.sql의 user-test-001용)
# 생성 방법: 백엔드에서 /api/v1/auth/login 호출
TEST_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLXRlc3QtMDAxIiwiZW1haWwiOiJxYUBzcGFya2xpby5haSIsInJvbGUiOiJhZG1pbiIsImV4cCI6OTk5OTk5OTk5OX0.test
```

**변경 후**:
```bash
# 인증 (JWT)
# ============================================

# 테스트용 사용자 계정 정보
# Backend 팀이 생성한 테스트 전용 계정
TEST_USER_EMAIL=testuser@sparklio.ai
TEST_USER_PASSWORD=testpass123

# 참고: 테스트 실행 시 자동으로 로그인하여 JWT 토큰 발급받음
# 토큰은 tests/utils/auth.ts의 getTestToken() 함수에서 관리
```

---

### 2.3 기존 테스트 코드 수정

기존 테스트 코드에서 `TEST_TOKEN` 직접 사용을 `getTestToken()` 호출로 변경합니다.

**예시 1: Generator API 테스트**

**수정 전** (`tests/integration/backend-api.spec.ts:21-31`):
```typescript
test('POST /api/v1/generate - Brand Kit Generator', async ({ request }) => {
  const response = await request.post(`${API_BASE_URL}/api/v1/generate`, {
    headers: {
      'Authorization': `Bearer ${TEST_TOKEN}`,
      'Content-Type': 'application/json',
    },
    data: {
      generator_type: 'brand_kit',
      prompt: '스킨케어 브랜드 키트를 만들어주세요',
      brand_id: 'brand-test-001',
    },
  });
```

**수정 후**:
```typescript
import { getTestToken } from '../utils/auth';

test('POST /api/v1/generate - Brand Kit Generator', async ({ request }) => {
  const token = await getTestToken();

  const response = await request.post(`${API_BASE_URL}/api/v1/generate`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    data: {
      generator_type: 'brand_kit',
      prompt: '스킨케어 브랜드 키트를 만들어주세요',
      brand_id: 'brand-test-001',
    },
  });
```

**예시 2: Documents API 테스트**

**수정 전** (`tests/integration/backend-api.spec.ts:91-99`):
```typescript
test('POST /api/v1/documents/{docId}/save - 문서 저장', async ({ request }) => {
  const response = await request.post(`${API_BASE_URL}/api/v1/documents/new/save`, {
    headers: {
      'Authorization': `Bearer ${TEST_TOKEN}`,
      'Content-Type': 'application/json',
    },
```

**수정 후**:
```typescript
test('POST /api/v1/documents/{docId}/save - 문서 저장', async ({ request }) => {
  const token = await getTestToken();

  const response = await request.post(`${API_BASE_URL}/api/v1/documents/new/save`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
```

---

### 2.4 수정 대상 파일 목록

다음 파일들에서 `TEST_TOKEN` 사용을 `getTestToken()`으로 변경해야 합니다:

1. **`tests/integration/backend-api.spec.ts`**
   - Generator API 테스트 (3개)
   - Documents API 테스트 (5개)
   - Editor API 테스트 (2개)
   - Templates API 테스트 (7개)
   - Admin API 테스트 (5개)

2. **기타 Backend API 통합 테스트 파일** (있는 경우)
   - `tests/integration/*.spec.ts`
   - `tests/integration/*.test.ts`

---

### 2.5 검색 및 치환 가이드

**검색 대상 패턴**:
```typescript
'Authorization': `Bearer ${TEST_TOKEN}`
```

**치환 방법**:

1. 파일 상단에 import 추가:
   ```typescript
   import { getTestToken } from '../utils/auth';
   ```

2. 각 `test()` 함수 시작 부분에 토큰 발급:
   ```typescript
   test('테스트 이름', async ({ request }) => {
     const token = await getTestToken();

     // 기존 코드...
   ```

3. Authorization 헤더를 `token` 변수 사용으로 변경:
   ```typescript
   'Authorization': `Bearer ${token}`
   ```

---

## 3. 완료 기준

### 3.1 필수 완료 항목

- [ ] `tests/utils/auth.ts` 파일 생성
- [ ] `.env.test` 파일에서 `TEST_TOKEN` 제거, 계정 정보 추가
- [ ] `tests/integration/backend-api.spec.ts` 수정 완료
- [ ] 기타 Backend API 테스트 파일 수정 완료 (있는 경우)
- [ ] Git commit 및 push

### 3.2 검증 방법

**로컬 환경에서 테스트**:

```bash
# 1. .env.test가 올바르게 설정되었는지 확인
cat .env.test | grep TEST_USER

# 예상 출력:
# TEST_USER_EMAIL=testuser@sparklio.ai
# TEST_USER_PASSWORD=testpass123

# 2. Backend API 테스트 실행
npm run test:backend

# 3. 콘솔에서 "✅ Test token acquired" 메시지 확인
# 4. 401 Unauthorized 에러 감소 확인
```

**성공 기준**:
- `getTestToken()` 함수가 정상적으로 JWT 토큰 발급
- 토큰이 캐시되어 재사용됨 (로그인 요청 1회만 발생)
- Backend API 테스트 성공률 향상 (현재 7.4% → 90%+)

---

## 4. 예상 소요 시간

- **`tests/utils/auth.ts` 작성**: 20분
- **`.env.test` 수정**: 5분
- **테스트 코드 수정**: 1-2시간 (파일 수에 따라)
- **검증 및 디버깅**: 30분
- **총 예상 시간**: **2-3시간**

---

## 5. 의존성

**선행 작업** (Backend 팀):
- ✅ 테스트용 사용자 계정 생성 (`testuser@sparklio.ai`)
- ✅ 로그인 API 엔드포인트 정상 작동 확인

**주의사항**:
- Backend 팀의 작업이 완료된 후 시작해야 합니다
- 로그인 API 스펙 확인 필요 (요청/응답 구조)

---

## 6. 참고 문서

- **Backend 작업 요청서**: [docs/requests/BACKEND_TEST_AUTH_FIX_REQUEST.md](BACKEND_TEST_AUTH_FIX_REQUEST.md)
- **Mac mini 서버 가이드**: [docs/MAC_MINI_SERVER_GUIDELINES.md](../MAC_MINI_SERVER_GUIDELINES.md)
- **A팀 작업지시서**: [docs/A_TEAM_QA_WORK_ORDER.md](../A_TEAM_QA_WORK_ORDER.md)

---

## 7. 문의사항

작업 중 문제가 발생하거나 질문이 있으면 A팀 QA Lead에게 연락해 주세요.

**연락처**: A팀 Slack 채널 또는 이메일

---

**작성일**: 2025-11-16
**작성자**: A팀 (QA & Testing)
**버전**: v1.0
