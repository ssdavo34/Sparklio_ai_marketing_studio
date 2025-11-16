# QA 팀 작업 요청서: API 엔드포인트 검증 및 테스트 정리

**담당 팀**: A팀 (QA & Testing)
**작성일**: 2025-11-16
**우선순위**: 🟡 **중간**
**예상 소요 시간**: 2-3시간

---

## 1. 작업 배경

Backend API 통합 테스트에서 **404 Not Found** 에러가 발생하고 있습니다.

**404 에러의 두 가지 유형**:

1. **엔드포인트가 존재하지 않음**
   - 예: 테스트가 `/api/v1/old-endpoint`를 호출하는데, 실제로는 `/api/v1/new-endpoint`로 변경됨
   - 원인: API 스펙 변경 후 테스트 코드 미반영

2. **리소스가 존재하지 않음**
   - 예: `GET /api/v1/templates/template-pitch-001` 호출 시, 해당 ID의 템플릿이 DB에 없음
   - 원인: 테스트 데이터 시드 누락

이 작업은 **엔드포인트 404**를 먼저 정리하고, **리소스 404**는 Backend 팀과 협의하여 해결합니다.

---

## 2. 작업 내용

### 2.1 Mac mini 서버의 실제 API 엔드포인트 목록 추출

**목표**: OpenAPI 스펙에서 실제로 존재하는 엔드포인트 목록 확인

**실행 명령어**:

```bash
# 1. OpenAPI JSON 다운로드 및 경로 추출
curl -s http://100.123.51.5:8000/openapi.json | \
  grep -oP '"/api/[^"]*"' | \
  sort -u > actual_endpoints.txt

# 2. 결과 확인
cat actual_endpoints.txt
```

**예상 출력** (`actual_endpoints.txt`):
```
"/api/v1/admin/agents"
"/api/v1/admin/dashboard"
"/api/v1/admin/health"
"/api/v1/admin/jobs"
"/api/v1/admin/users"
"/api/v1/auth/login"
"/api/v1/documents/"
"/api/v1/documents/{docId}"
"/api/v1/documents/{docId}/save"
"/api/v1/editor/action"
"/api/v1/editor/actions/supported"
"/api/v1/generate"
"/api/v1/templates"
"/api/v1/templates/{templateId}"
"/api/v1/templates/{templateId}/approve"
"/api/v1/templates/{templateId}/reject"
"/health"
"/metrics"
```

---

### 2.2 테스트 코드에서 호출하는 엔드포인트 목록 추출

**목표**: 테스트 코드가 실제로 호출하는 API 경로 확인

**실행 명령어**:

```bash
# 1. 테스트 파일에서 API 경로 추출
grep -rhoP 'request\.(get|post|patch|put|delete)\([^)]*(/api/[^"'\'']+)' tests/integration/ | \
  sed -E 's/.*\/api/\/api/g' | \
  sed -E 's/[?&].*//' | \
  sort -u > test_endpoints.txt

# 2. 결과 확인
cat test_endpoints.txt
```

**예상 출력** (`test_endpoints.txt`):
```
/api/v1/admin/agents
/api/v1/admin/dashboard
/api/v1/admin/health
/api/v1/admin/jobs
/api/v1/admin/users
/api/v1/documents/
/api/v1/documents/new/save
/api/v1/documents/undefined
/api/v1/editor/action
/api/v1/editor/actions/supported
/api/v1/generate
/api/v1/templates
/api/v1/templates/template-pitch-001
/api/v1/templates/undefined
/api/v1/templates/undefined/approve
/api/v1/templates/undefined/reject
```

---

### 2.3 두 목록 비교 및 불일치 식별

**목표**: 테스트에만 있고 실제 API에는 없는 엔드포인트 찾기

**실행 명령어**:

```bash
# 1. 테스트에만 있고 실제 API에는 없는 경로
comm -13 <(sort actual_endpoints.txt) <(sort test_endpoints.txt) > missing_endpoints.txt

# 2. 결과 확인
cat missing_endpoints.txt
```

**예상 출력** (`missing_endpoints.txt`):
```
/api/v1/documents/new/save        # 실제는 POST /api/v1/documents/{docId}/save
/api/v1/documents/undefined       # 테스트에서 docId를 undefined로 전달
/api/v1/templates/template-pitch-001  # 리소스 404 (데이터 없음)
/api/v1/templates/undefined       # 테스트에서 templateId를 undefined로 전달
```

---

### 2.4 불일치 엔드포인트 분류

**분류 기준**:

| 엔드포인트 | 문제 유형 | 조치 방안 |
|-----------|----------|---------|
| `/api/v1/documents/new/save` | 경로 오류 | 테스트 코드 수정 필요 |
| `/api/v1/documents/undefined` | 변수 오류 | 테스트 로직 수정 (docId 생성 필요) |
| `/api/v1/templates/template-pitch-001` | 리소스 없음 | Backend 시드 데이터 추가 요청 |
| `/api/v1/templates/undefined` | 변수 오류 | 테스트 로직 수정 (templateId 생성 필요) |

---

### 2.5 테스트 코드 수정

#### 2.5.1 경로 오류 수정

**문제**: `/api/v1/documents/new/save` 호출 시 404

**원인**: 실제 API는 `/api/v1/documents/{docId}/save` 형식

**수정 위치**: `tests/integration/backend-api.spec.ts:91`

**수정 전**:
```typescript
test('POST /api/v1/documents/{docId}/save - 문서 저장', async ({ request }) => {
  const token = await getTestToken();

  const response = await request.post(`${API_BASE_URL}/api/v1/documents/new/save`, {
```

**수정 후**:
```typescript
test('POST /api/v1/documents/{docId}/save - 문서 저장', async ({ request }) => {
  const token = await getTestToken();

  // 새 문서를 위한 임시 ID 생성
  const docId = `doc-test-${Date.now()}`;

  const response = await request.post(`${API_BASE_URL}/api/v1/documents/${docId}/save`, {
```

---

#### 2.5.2 변수 오류 수정 (undefined 문제)

**문제**: `createdDocId`가 `undefined`로 전달됨

**원인**: 이전 테스트에서 `createdDocId` 값을 제대로 저장하지 못함

**수정 위치**: `tests/integration/backend-api.spec.ts:88-180`

**수정 전**:
```typescript
test.describe('B팀 Backend API - Documents API (5개)', () => {
  let createdDocId: string;

  test('POST /api/v1/documents/{docId}/save - 문서 저장', async ({ request }) => {
    // ... 문서 생성
    // createdDocId 저장 누락
  });

  test('GET /api/v1/documents/{docId} - 문서 조회', async ({ request }) => {
    const response = await request.get(`${API_BASE_URL}/api/v1/documents/${createdDocId}`, {
      // createdDocId가 undefined
```

**수정 후**:
```typescript
test.describe('B팀 Backend API - Documents API (5개)', () => {
  let createdDocId: string;

  test('POST /api/v1/documents/{docId}/save - 문서 저장', async ({ request }) => {
    const token = await getTestToken();
    const docId = `doc-test-${Date.now()}`;

    const response = await request.post(`${API_BASE_URL}/api/v1/documents/${docId}/save`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      data: {
        name: 'Test Document',
        document_type: 'brand_kit',
        brand_id: 'brand-test-001',
        editor_json: {
          version: '3.0',
          objects: [],
        },
      },
    });

    expect(response.status()).toBe(200);

    const body = await response.json();

    // 응답에서 document_id 저장
    if (body.document_id) {
      createdDocId = body.document_id;
    } else {
      // 응답에 ID가 없으면 요청 시 사용한 ID 사용
      createdDocId = docId;
    }

    expect(createdDocId).toBeTruthy();
  });

  test('GET /api/v1/documents/{docId} - 문서 조회', async ({ request }) => {
    const token = await getTestToken();

    // createdDocId가 설정되어 있는지 확인
    if (!createdDocId) {
      throw new Error('createdDocId is not set. Did the previous test fail?');
    }

    const response = await request.get(`${API_BASE_URL}/api/v1/documents/${createdDocId}`, {
```

---

#### 2.5.3 Templates API도 동일하게 수정

**수정 위치**: `tests/integration/backend-api.spec.ts:226-330`

**적용 원칙**:
1. `templateId` 변수를 테스트 간 공유
2. 첫 번째 테스트에서 template 생성 후 ID 저장
3. 이후 테스트에서 저장된 ID 사용
4. `undefined` 체크 추가

---

### 2.6 리소스 404 정리 (Backend 팀 요청사항)

**발견된 리소스 404**:
- `GET /api/v1/templates/template-pitch-001` → 404

**조치**:
- Backend 팀에 `template-pitch-001` ID를 가진 템플릿 시드 데이터 추가 요청
- 또는 테스트에서 동적으로 template 생성 후 해당 ID 사용

**Backend 팀 요청 사항**:
- [BACKEND_TEST_AUTH_FIX_REQUEST.md](BACKEND_TEST_AUTH_FIX_REQUEST.md) 의 2.4절 참조
- `seed_test_data.py` 스크립트에 `template-pitch-001` 추가

---

## 3. 완료 기준

### 3.1 필수 완료 항목

- [ ] Mac mini 서버의 실제 API 엔드포인트 목록 추출 완료
- [ ] 테스트 코드의 호출 엔드포인트 목록 추출 완료
- [ ] 불일치 엔드포인트 분류 완료
- [ ] 경로 오류 수정 완료 (`/api/v1/documents/new/save` → `/{docId}/save`)
- [ ] 변수 오류 수정 완료 (`undefined` → 실제 ID)
- [ ] Git commit 및 push

### 3.2 검증 방법

```bash
# 1. 테스트 재실행
npm run test:backend

# 2. 404 에러 감소 확인
# 이전: 8건의 404 에러
# 목표: 0-2건 (리소스 시드 데이터 대기 중인 것만 허용)

# 3. 남은 404 에러 확인
npm run test:backend 2>&1 | grep "404"
```

**성공 기준**:
- 엔드포인트 404 에러 0건
- 리소스 404는 Backend 시드 데이터 추가 후 해결 예정

---

## 4. 예상 소요 시간

- **엔드포인트 목록 추출**: 30분
- **불일치 분석 및 분류**: 30분
- **테스트 코드 수정**: 1-2시간
- **검증 및 디버깅**: 30분
- **총 예상 시간**: **2-3시간**

---

## 5. 의존성

**선행 작업**:
- Backend 팀의 테스트 사용자 계정 생성 완료
- Frontend/QA 팀의 `getTestToken()` 유틸 구현 완료

**후속 작업** (Backend 팀):
- 리소스 404 해결을 위한 테스트 데이터 시드 추가

---

## 6. 참고 문서

- **Backend 작업 요청서**: [BACKEND_TEST_AUTH_FIX_REQUEST.md](BACKEND_TEST_AUTH_FIX_REQUEST.md)
- **Frontend 작업 요청서**: [FRONTEND_TEST_AUTH_UTIL_REQUEST.md](FRONTEND_TEST_AUTH_UTIL_REQUEST.md)
- **시스템 아키텍처**: [../SYSTEM_ARCHITECTURE.md](../SYSTEM_ARCHITECTURE.md)

---

## 7. 문의사항

작업 중 문제가 발생하거나 질문이 있으면 A팀 QA Lead에게 연락해 주세요.

---

**작성일**: 2025-11-16
**작성자**: A팀 (QA & Testing)
**버전**: v1.0
