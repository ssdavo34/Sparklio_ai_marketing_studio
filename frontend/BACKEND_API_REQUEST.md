# Backend API 구현 요청서

**발신**: C팀 (Frontend)
**수신**: B팀 (Backend)
**작성일**: 2025-11-15
**우선순위**: High
**목적**: Frontend 개발을 위한 기본 API 엔드포인트 구현 요청

---

## 📋 요청 개요

Frontend 초기 설정이 완료되었습니다. 다음 단계로 Backend API 연동 테스트 및 기본 기능 구현을 위해 아래 API 엔드포인트의 우선 구현을 요청드립니다.

---

## 🎯 우선순위별 요청사항

### Priority 1: 필수 (이번 주 내)

#### 1. Health Check API ⭐⭐⭐
**목적**: Backend 서버 상태 확인 및 Frontend-Backend 연결 테스트

**엔드포인트**:
```
GET /health
```

**응답 예시**:
```json
{
  "status": "healthy",
  "timestamp": "2025-11-15T14:30:00Z",
  "version": "1.0.0",
  "services": {
    "database": "connected",
    "redis": "connected",
    "ollama": "connected",
    "comfyui": "connected",
    "minio": "connected"
  }
}
```

**Frontend 사용처**:
- [components/HealthCheck.tsx](components/HealthCheck.tsx)
- [app/test/page.tsx](app/test/page.tsx)

---

#### 2. CORS 설정 ⭐⭐⭐
**목적**: Frontend에서 Backend API 호출 허용

**요청사항**:
FastAPI CORS 미들웨어에 다음 설정 추가:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",           # Frontend 개발 서버
        "http://100.101.68.23:3000",       # Laptop Tailscale (필요시)
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**테스트 방법**:
```bash
# Frontend에서 실행
curl -X GET http://100.123.51.5:8000/health \
  -H "Origin: http://localhost:3000"
```

---

#### 3. SmartRouter API ⭐⭐⭐
**목적**: 사용자 요청을 적절한 Agent로 라우팅

**엔드포인트**:
```
POST /api/v1/router/route
```

**요청 Body**:
```json
{
  "user_id": "string",
  "request_text": "브랜드 색상 알려줘",
  "brand_id": "optional-brand-uuid",
  "project_id": "optional-project-uuid",
  "context": {}
}
```

**응답 예시**:
```json
{
  "target_agent": "BrandAgent",
  "selected_model": "qwen2.5-7b",
  "risk_level": "low",
  "minimized_context": {
    "brand_id": "uuid",
    "brandkit_summary": {
      "primary_color": "#FF5733",
      "font": "Arial",
      "tone": "professional"
    }
  },
  "routing_metadata": {
    "intent": "brand_query",
    "confidence": 0.92,
    "reasoning": "Detected brand information query"
  }
}
```

**참고 문서**:
- [docs/SMART_ROUTER_SPEC.md](../docs/SMART_ROUTER_SPEC.md)
- Backend Starter: `app/agents/smart_router.py`

**Frontend 사용처**:
- `lib/api-client.ts` - `routeRequest()` 함수

---

### Priority 2: 중요 (다음 주)

#### 4. Asset 관련 API ⭐⭐

##### 4.1 Asset 업로드
```
POST /api/v1/assets
Content-Type: multipart/form-data
```

**요청 Body**:
```
file: <binary>
brand_id: string
user_id: string
asset_type: "image" | "video" | "text"
source: "manual"
tags: "tag1,tag2,tag3" (optional)
```

**응답 예시**:
```json
{
  "id": "asset-uuid",
  "brand_id": "brand-uuid",
  "user_id": "user-uuid",
  "type": "image",
  "minio_path": "brands/brand-uuid/assets/filename.jpg",
  "original_name": "image.jpg",
  "file_size": 1024000,
  "mime_type": "image/jpeg",
  "source": "manual",
  "status": "active",
  "tags": ["tag1", "tag2"],
  "presigned_url": "http://100.123.51.5:9000/...",
  "created_at": "2025-11-15T14:30:00Z",
  "updated_at": "2025-11-15T14:30:00Z"
}
```

**Frontend 사용처**:
- 계획 중인 `components/AssetUpload.tsx`
- `lib/api-client.ts` - `uploadAsset()` 함수

---

##### 4.2 Asset 목록 조회
```
GET /api/v1/assets?brand_id={uuid}&page=1&page_size=20
```

**응답 예시**:
```json
{
  "total": 150,
  "page": 1,
  "page_size": 20,
  "assets": [
    {
      "id": "asset-uuid",
      "brand_id": "brand-uuid",
      "type": "image",
      "original_name": "image.jpg",
      "file_size": 1024000,
      "status": "active",
      "tags": ["tag1"],
      "presigned_url": "http://100.123.51.5:9000/...",
      "created_at": "2025-11-15T14:30:00Z"
    }
  ]
}
```

**Frontend 사용처**:
- 계획 중인 `app/assets/page.tsx`
- `lib/api-client.ts` - `listAssets()` 함수

---

##### 4.3 Asset 상세 조회
```
GET /api/v1/assets/{asset_id}
```

**응답**: 단일 Asset 객체 (4.1과 동일 구조)

---

##### 4.4 Asset 삭제
```
DELETE /api/v1/assets/{asset_id}?hard_delete=false
```

**응답**:
```json
{
  "message": "Asset deleted successfully",
  "asset_id": "uuid",
  "hard_delete": false
}
```

---

#### 5. 임시 인증 API ⭐⭐

##### 5.1 로그인 (간단한 버전)
```
POST /api/v1/auth/login
```

**요청**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**응답**:
```json
{
  "access_token": "jwt-token-here",
  "token_type": "bearer",
  "user": {
    "id": "user-uuid",
    "email": "user@example.com",
    "name": "User Name"
  }
}
```

**Frontend 사용처**:
- 계획 중인 `app/login/page.tsx`
- Zustand store: `store/authStore.ts`

---

##### 5.2 현재 사용자 정보
```
GET /api/v1/auth/me
Authorization: Bearer {token}
```

**응답**:
```json
{
  "id": "user-uuid",
  "email": "user@example.com",
  "name": "User Name",
  "created_at": "2025-01-01T00:00:00Z"
}
```

---

### Priority 3: 선택 (2주 후)

#### 6. EditorAgent API ⭐

```
POST /api/v1/editor/process
```

**요청**:
```json
{
  "canvas": {
    "objects": [
      {
        "id": "text_001",
        "type": "textbox",
        "text": "Hello",
        "fontSize": 36,
        "left": 100,
        "top": 100,
        "zIndex": 1,
        "meta": { "layerType": "title" }
      }
    ],
    "background": { "type": "color", "value": "#FFFFFF" },
    "size": { "width": 1080, "height": 1920 }
  },
  "command": {
    "raw": "제목 글자를 크게 해줘"
  },
  "rules": {
    "brand": {
      "allowed_colors": ["#000000", "#FFFFFF"],
      "primary_font": "Arial"
    },
    "system": { "safe_mode": true }
  }
}
```

**응답**:
```json
{
  "actions": [
    {
      "type": "set_property",
      "target": "text_001",
      "property": "fontSize",
      "value": { "delta": 8 }
    }
  ],
  "metadata": {
    "target_id": "text_001",
    "reasoning": "Applied change_font_size to text_001"
  },
  "confidence": 0.9
}
```

**참고 문서**:
- [docs/EDITOR_ENGINE_IMPLEMENTATION.md](../docs/EDITOR_ENGINE_IMPLEMENTATION.md)

---

## 🔧 구현 참고사항

### 1. Pydantic 스키마
Backend Starter에 이미 정의되어 있습니다:
- `app/schemas/common.py` - A2ARequest, A2AResponse
- `app/schemas/router.py` - RouterRequest, RouterResponse

### 2. 에러 처리
모든 API는 다음 에러 포맷을 따라주세요:

```json
{
  "error_type": "validation_error",
  "error_message": "Invalid brand_id format",
  "error_details": {
    "field": "brand_id",
    "value": "invalid-uuid"
  },
  "timestamp": "2025-11-15T14:30:00Z"
}
```

### 3. HTTP 상태 코드
- `200 OK` - 성공
- `201 Created` - 생성 성공
- `400 Bad Request` - 잘못된 요청
- `401 Unauthorized` - 인증 실패
- `404 Not Found` - 리소스 없음
- `500 Internal Server Error` - 서버 오류

---

## 📊 API 문서

구현 후 FastAPI의 자동 문서를 확인할 수 있도록 설정해주세요:
- Swagger UI: http://100.123.51.5:8000/docs
- ReDoc: http://100.123.51.5:8000/redoc

---

## ✅ 테스트 방법

### Frontend에서 테스트
```bash
# 개발 서버 실행 (Frontend)
cd frontend_starter
npm run dev

# 테스트 페이지 접속
# http://localhost:3000/test
```

### curl로 테스트
```bash
# Health Check
curl http://100.123.51.5:8000/health

# SmartRouter
curl -X POST http://100.123.51.5:8000/api/v1/router/route \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test_user",
    "request_text": "브랜드 색상 알려줘",
    "brand_id": "test_brand"
  }'
```

---

## 📅 구현 일정 제안

| 우선순위 | 항목 | 요청 완료일 | 비고 |
|---------|------|-----------|------|
| P1 | Health Check API | 2025-11-16 | 가장 먼저 필요 |
| P1 | CORS 설정 | 2025-11-16 | Health Check와 함께 |
| P1 | SmartRouter API | 2025-11-18 | 핵심 기능 |
| P2 | Asset APIs (전체) | 2025-11-20 | 파일 업로드 포함 |
| P2 | 임시 인증 API | 2025-11-22 | 간단한 JWT 구현 |
| P3 | EditorAgent API | 2025-11-25 | Phase 2에서 사용 |

---

## 🤝 협업 방법

### 1. API 구현 완료 시
다음 정보를 Frontend팀에 공유해주세요:
- ✅ 구현 완료 알림
- 📝 실제 엔드포인트 URL
- 📄 요청/응답 예시
- ⚠️ 주의사항 (있다면)

### 2. 이슈 발생 시
GitHub Issues에 다음 라벨로 등록:
- `backend-api` - Backend API 관련
- `frontend-blocker` - Frontend 작업 차단 중
- `priority-high` - 긴급

### 3. 소통 채널
- 일반 질문: GitHub Discussions
- 긴급 이슈: GitHub Issues
- 일일 진행사항: daily_logs/ 공유

---

## 📖 참고 문서

Backend 구현 시 참고할 문서:
1. [STARTER_CODE_COMPLETE.md](../docs/STARTER_CODE_COMPLETE.md) - Backend Starter 구조
2. [SMART_ROUTER_SPEC.md](../docs/SMART_ROUTER_SPEC.md) - SmartRouter 스펙
3. [AGENT_IO_SCHEMA_CATALOG.md](../docs/AGENT_IO_SCHEMA_CATALOG.md) - Agent 스키마
4. [EDITOR_ENGINE_IMPLEMENTATION.md](../docs/EDITOR_ENGINE_IMPLEMENTATION.md) - Editor 구현

---

## 💡 추가 요청사항

### MinIO Presigned URL
Asset 조회 시 `presigned_url` 필드에 MinIO presigned URL을 포함해주세요.
- 유효기간: 1시간
- Frontend에서 직접 이미지를 표시할 때 사용

### 페이지네이션
목록 조회 API는 다음 파라미터를 지원해주세요:
- `page` (기본값: 1)
- `page_size` (기본값: 20, 최대: 100)

---

## ❓ 질문사항

구현 중 궁금한 사항이 있으시면:
1. 이 문서에 코멘트 추가
2. GitHub Issue 생성
3. Frontend팀 멘션

---

**작성 완료**: 2025-11-15
**검토자**: C팀 Frontend 개발자
**승인 대기**: B팀 Backend 개발자

---

**감사합니다!** 🙏

Frontend 개발을 위해 위 API들의 우선 구현을 부탁드립니다.
특히 **Priority 1 (Health Check, CORS, SmartRouter)** 항목은 이번 주 내에 완료되면 매우 감사하겠습니다.
