# B팀 → C팀 API 응답서

**작성일**: 2025-11-15 (토요일)
**작성자**: B팀 (Backend Team)
**버전**: 1.0

---

## 📋 요청사항 처리 현황

### Priority 1 (이번 주 내 - 필수) ✅

| 항목 | 상태 | 완료일 | 비고 |
|------|------|--------|------|
| Health Check API | ✅ 완료 | 2025-11-15 | DB 연결 확인 추가 |
| CORS 설정 | ✅ 완료 | 2025-11-15 | 모든 origin 허용 (개발용) |
| SmartRouter API | ✅ 구현됨 | 2025-11-15 | A팀 작업 완료 |

### Priority 2 (다음 주 - 중요) ✅

| 항목 | 상태 | 완료일 | 비고 |
|------|------|--------|------|
| Asset APIs | ✅ 완료 | 2025-11-15 | A팀 작업 완료 |
| 인증 API | ✅ 완료 | 2025-11-15 | JWT 기반 인증 |

### Priority 3 (2주 후 - 선택) ⏳

| 항목 | 상태 | 예정일 | 비고 |
|------|------|--------|------|
| EditorAgent API | 📅 Phase 5 | 2025-12월 | Phase 5에서 구현 |

---

## 🚀 사용 가능한 API 엔드포인트

### 1. Health Check API ✅

**엔드포인트**: `GET /health`

**응답 예시**:
```json
{
  "status": "healthy",
  "services": {
    "api": "ok",
    "database": "ok",
    "storage": "ok"
  },
  "environment": "development",
  "version": "0.1.0"
}
```

**Frontend 사용처**:
- 앱 시작 시 Backend 연결 확인
- 대시보드 시스템 상태 표시

---

### 2. CORS 설정 ✅

**현재 설정**:
```python
allow_origins=["*"]  # 모든 origin 허용 (개발용)
allow_credentials=True
allow_methods=["*"]
allow_headers=["*"]
```

**프로덕션 권장 설정**:
```python
allow_origins=[
    "http://localhost:3000",  # C팀 개발 서버
    "http://100.101.68.23:3000",  # Tailscale
    "https://sparklio.ai"  # 프로덕션
]
```

---

### 3. SmartRouter API ✅

**엔드포인트**: `POST /api/v1/router/route`

**요청 예시**:
```json
{
  "user_id": "user-uuid",
  "request_text": "브랜드 색상 알려줘",
  "brand_id": "brand-uuid"
}
```

**응답 예시**:
```json
{
  "request_id": "req-uuid",
  "detected_intent": "brand_query",
  "selected_agent": "BrandAgent",
  "selected_model": "qwen2.5-7b",
  "risk_level": "low",
  "context_size": 1024
}
```

**참고**: [app/agents/smart_router.py](../backend_starter/app/agents/smart_router.py)

---

### 4. 인증 API ✅

#### 4.1 회원가입
**엔드포인트**: `POST /api/v1/users/register`

**요청**:
```json
{
  "email": "user@example.com",
  "username": "testuser",
  "password": "securepassword123",
  "full_name": "홍길동"
}
```

**응답**:
```json
{
  "id": "user-uuid",
  "email": "user@example.com",
  "username": "testuser",
  "role": "user",
  "is_active": true,
  "created_at": "2025-11-15T14:00:00"
}
```

#### 4.2 로그인 (JWT 토큰 발급)
**엔드포인트**: `POST /api/v1/users/login`

**요청**:
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**응답**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": "user-uuid",
    "email": "user@example.com",
    "username": "testuser",
    "role": "user"
  }
}
```

**Frontend 사용법**:
```typescript
// 로그인 후 토큰 저장
const response = await fetch('/api/v1/users/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});
const { access_token } = await response.json();
localStorage.setItem('token', access_token);

// 이후 요청 시 토큰 포함
fetch('/api/v1/brands', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
});
```

#### 4.3 내 정보 조회
**엔드포인트**: `GET /api/v1/users/me`

**헤더**: `Authorization: Bearer {token}`

**응답**:
```json
{
  "id": "user-uuid",
  "email": "user@example.com",
  "username": "testuser",
  "full_name": "홍길동",
  "role": "user",
  "is_active": true,
  "last_login_at": "2025-11-15T14:30:00"
}
```

---

### 5. Asset APIs ✅

#### 5.1 자산 업로드
**엔드포인트**: `POST /api/v1/assets`

**요청** (multipart/form-data):
```
file: [File]
brand_id: "brand-uuid"
user_id: "user-uuid"
asset_type: "image"
source: "manual"
tags: "banner,promotion"
```

**응답**:
```json
{
  "id": "asset-uuid",
  "brand_id": "brand-uuid",
  "type": "image",
  "minio_path": "dev-sparklio-assets/image/...",
  "file_size": 123456,
  "status": "active",
  "presigned_url": "http://100.123.51.5:9000/..."
}
```

#### 5.2 자산 목록 조회
**엔드포인트**: `GET /api/v1/assets?brand_id={uuid}&page=1&page_size=20`

**응답**:
```json
{
  "items": [
    {
      "id": "asset-uuid",
      "type": "image",
      "minio_path": "...",
      "presigned_url": "...",
      "created_at": "2025-11-15T14:00:00"
    }
  ],
  "total": 50,
  "page": 1,
  "page_size": 20
}
```

#### 5.3 자산 삭제
**엔드포인트**: `DELETE /api/v1/assets/{asset_id}?hard_delete=false`

**응답**: `204 No Content`

---

### 6. Brand APIs ✅

#### 6.1 브랜드 생성
**엔드포인트**: `POST /api/v1/brands`

**요청**:
```json
{
  "name": "My Brand",
  "slug": "my-brand",
  "description": "브랜드 설명",
  "brand_kit": {
    "colors": {
      "primary": "#FF5733",
      "secondary": "#33FF57"
    },
    "fonts": {
      "heading": "Montserrat",
      "body": "Open Sans"
    }
  }
}
```

**응답**: (BrandResponse)

#### 6.2 브랜드 목록
**엔드포인트**: `GET /api/v1/brands`

**헤더**: `Authorization: Bearer {token}`

---

### 7. Project APIs ✅

#### 7.1 프로젝트 생성
**엔드포인트**: `POST /api/v1/projects`

**요청**:
```json
{
  "name": "2025 신제품 런칭",
  "slug": "2025-new-product",
  "brand_id": "brand-uuid",
  "project_type": "campaign",
  "brief": {
    "goal": "신제품 런칭 캠페인",
    "target_audience": "20-30대 여성",
    "budget": 5000000
  }
}
```

#### 7.2 프로젝트 목록
**엔드포인트**: `GET /api/v1/projects?brand_id={uuid}`

---

## 📖 API 문서 (Swagger)

**URL**: `http://100.123.51.5:8000/docs`

모든 API는 Swagger UI에서 **직접 테스트 가능**합니다.

---

## 🔧 개발 환경 설정

### Backend 서버 시작 (Mac mini)

```bash
cd ~/sparklio_ai_marketing_studio/backend_starter
source .venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Frontend에서 Backend 연결

```typescript
// .env.local
NEXT_PUBLIC_API_URL=http://100.123.51.5:8000
```

```typescript
// lib/api.ts
const API_BASE = process.env.NEXT_PUBLIC_API_URL;

export async function fetchWithAuth(url: string, options = {}) {
  const token = localStorage.getItem('token');
  return fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json',
      ...options.headers
    }
  });
}
```

---

## ⚠️ 주의사항

### 1. 인증 필요 API

다음 API는 JWT 토큰이 필요합니다:
- ✅ `/api/v1/brands/*`
- ✅ `/api/v1/projects/*`
- ✅ `/api/v1/users/me`
- ✅ `/api/v1/assets/*`

**인증 헤더 형식**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2. 에러 응답 형식

```json
{
  "detail": "Not authenticated"
}
```

**HTTP 상태 코드**:
- `401 Unauthorized` - 인증 실패
- `403 Forbidden` - 권한 없음
- `404 Not Found` - 리소스 없음
- `400 Bad Request` - 잘못된 요청

### 3. CORS 이슈 해결

Frontend 개발 서버(`http://localhost:3000`)는 이미 CORS 허용됨.

만약 다른 도메인에서 접근하려면 B팀에 요청:
```python
# backend_starter/app/main.py
allow_origins=["http://your-domain.com"]
```

---

## 📞 협업 방법

### 1. API 수정 요청

**GitHub Issue 생성**:
```markdown
Title: [API Request] 브랜드 목록 필터 추가
Label: api, frontend

## 요청 내용
브랜드 목록 API에 industry 필터를 추가해주세요.

## 예상 사용법
GET /api/v1/brands?industry=fashion

## 우선순위
Medium
```

### 2. 버그 리포트

**GitHub Issue 생성**:
```markdown
Title: [Bug] 로그인 시 404 에러
Label: bug, api

## 재현 단계
1. POST /api/v1/users/login
2. 올바른 이메일/비밀번호 입력
3. 404 Not Found 응답

## 예상 동작
200 OK + JWT 토큰

## 실제 동작
404 Not Found
```

### 3. 긴급 문의

**Slack 채널**: `#backend-frontend-sync`

---

## 📅 다음 업데이트 예정

### 2025-11-18 (월)
- [ ] SmartRouter API 성능 최적화
- [ ] 브랜드 목록 페이지네이션 개선

### 2025-11-20 (수)
- [ ] Asset 업로드 진행률 API
- [ ] 파일 미리보기 URL 생성

### 2025-11-22 (금)
- [ ] Workflow API (Phase 3)
- [ ] Agent 실행 상태 추적 API

---

## ✅ C팀 작업 시작 가능

**지금 바로 사용 가능한 API**:
1. ✅ Health Check
2. ✅ 회원가입/로그인
3. ✅ 브랜드 CRUD
4. ✅ 프로젝트 CRUD
5. ✅ 자산 관리

**API 문서**: http://100.123.51.5:8000/docs

**문의사항**: B팀에게 GitHub Issue로 문의해주세요!

---

**작성 완료**: 2025-11-15 (토요일) 15:05
**B팀 담당자**: Backend Development Team
