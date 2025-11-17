# A팀 API 테스트 요청서

**요청일**: 2025-11-17
**요청팀**: B팀 (Backend)
**수신팀**: A팀 (QA)
**작업**: P0 Generator 오케스트레이션 완료 후 API 테스트

---

## 📋 요청 개요

**B팀 작업 완료**:
- ✅ Phase 2-3: Agent Orchestration (WorkflowExecutor)
- ✅ P0: Generator Orchestration (GeneratorService)
- ✅ `/api/v1/generate` v2 엔드포인트 구현
- ✅ 5개 kind 지원 완료

**테스트 대상 서버**: **Mac mini M2 (100.123.51.5)** - Docker 컨테이너 방식

---

## 🖥️ Mac mini 서버 배포 (중요!)

### ⚠️ 중요: Docker 컨테이너 기반 서버

Mac mini는 **Docker Compose**로 구동됩니다. 호스트 Python이 아닌 **Docker 컨테이너 내부의 Python 환경**에서 Backend API가 실행됩니다.

### 배포 절차 (A팀 수행)

#### 1단계: SSH 접속
```bash
ssh woosun@100.123.51.5
```

#### 2단계: 최신 코드 Pull
```bash
cd ~/sparklio_ai_marketing_studio
git pull origin master
```

**확인 사항**: 최신 커밋이 `feat(generator): GeneratorService 구현 (P0 완료)` 인지 확인
```bash
git log -1 --oneline
```

#### 3단계: Docker 컨테이너 재시작
```bash
cd ~/sparklio_ai_marketing_studio
docker compose restart backend
```

**중요**: `python -m uvicorn ...` 명령어로 직접 실행하지 마세요!
Docker 컨테이너 내부에서 자동으로 서버가 시작됩니다.

#### 4단계: 서버 상태 확인
```bash
# 컨테이너 실행 확인
docker compose ps

# 로그 확인
docker compose logs backend --tail=50
```

**정상 실행 로그 예시**:
```
backend-1  | INFO:     Uvicorn running on http://0.0.0.0:8001
backend-1  | INFO:     Application startup complete.
```

#### 5단계: Health Check
```bash
curl http://100.123.51.5:8001/health
```

**예상 응답**:
```json
{
  "status": "healthy",
  "timestamp": "2025-11-17T...",
  "services": {
    "ollama": "available",
    "comfyui": "not configured",
    "mock_llm": "available"
  }
}
```

---

## 🧪 테스트 시나리오

### ⚠️ 스키마 변경 주의사항

**VERTICAL_SLICE_1_QA_PLAN.md v1.0의 스키마가 변경되었습니다!**

참고 문서: [`docs/qa/B_TEAM_QA_PLAN_REVIEW.md`](../qa/B_TEAM_QA_PLAN_REVIEW.md)

#### 변경 전 (구버전 - 사용 불가)
```json
POST /api/v1/generate
{
  "role": "copywriter",
  "task": "product_detail",
  "input": {...}
}
```

#### 변경 후 (현재 버전 - 사용해야 함)
```json
POST /api/v1/generate
{
  "kind": "product_detail",
  "brandId": "brand_demo",
  "input": {
    "product_name": "무선 이어폰",
    "features": ["노이즈캔슬링", "24시간 배터리"],
    "target_audience": "2030 직장인"
  },
  "options": {
    "tone": "professional",
    "length": "medium"
  }
}
```

---

### 테스트 케이스 1: 사용 가능한 kind 목록 조회

**엔드포인트**: `GET /api/v1/generate/kinds`

**curl 예시**:
```bash
curl http://100.123.51.5:8001/api/v1/generate/kinds
```

**예상 응답**:
```json
{
  "kinds": [
    {
      "kind": "product_detail",
      "description": "제품 상세 콘텐츠 생성",
      "workflow": "product_content_pipeline"
    },
    {
      "kind": "sns_set",
      "description": "SNS 콘텐츠 세트 생성",
      "workflow": "product_content_pipeline"
    },
    {
      "kind": "presentation_simple",
      "description": "간단한 프레젠테이션 생성",
      "workflow": "product_content_pipeline"
    },
    {
      "kind": "brand_identity",
      "description": "브랜드 아이덴티티 수립",
      "workflow": "brand_identity_pipeline"
    },
    {
      "kind": "content_review",
      "description": "콘텐츠 검토 및 개선",
      "workflow": "content_review_pipeline"
    }
  ]
}
```

**성공 기준**:
- ✅ HTTP 200 OK
- ✅ 5개 kind 반환

---

### 테스트 케이스 2: Product Detail 생성 (Mock 모드)

**엔드포인트**: `POST /api/v1/generate`

**curl 예시** (JSON 파일 사용 권장):
```bash
curl -X POST http://100.123.51.5:8001/api/v1/generate \
  -H "Content-Type: application/json" \
  -d @product_detail_request.json
```

**product_detail_request.json**:
```json
{
  "kind": "product_detail",
  "brandId": "brand_demo",
  "input": {
    "product_name": "프리미엄 무선 이어폰",
    "features": [
      "프리미엄 노이즈캔슬링",
      "24시간 배터리",
      "IPX7 방수"
    ],
    "target_audience": "2030 직장인"
  },
  "options": {
    "tone": "professional",
    "length": "medium"
  }
}
```

**예상 응답 구조**:
```json
{
  "kind": "product_detail",
  "document": {
    "documentId": "doc_a1b2c3d4e5f6",
    "type": "product_detail",
    "canvas_json": {
      "version": "5.3.0",
      "objects": []
    }
  },
  "text": {
    "headline": "혁신을 담은 무선 자유, 프리미엄 무선 이어폰",
    "subheadline": "노이즈캔슬링과 24시간 배터리로 완성한 프리미엄 경험",
    "body": "2030 직장인을 위한 완벽한 오디오 솔루션...",
    "bullets": [
      "프리미엄 노이즈캔슬링으로 집중력 극대화",
      "24시간 배터리로 하루 종일 자유롭게",
      "IPX7 방수 등급으로 어디서나 안심"
    ]
  },
  "meta": {
    "workflow": "product_content_pipeline",
    "agents_used": ["copywriter", "reviewer", "optimizer"],
    "elapsed_seconds": 12.35,
    "tokens_used": 1500,
    "steps_completed": 3,
    "total_steps": 3
  }
}
```

**성공 기준**:
- ✅ HTTP 200 OK
- ✅ `document.documentId` 생성됨
- ✅ `text.headline`, `text.body` 등 텍스트 생성됨
- ✅ `meta.workflow` = "product_content_pipeline"
- ✅ `meta.agents_used` = ["copywriter", "reviewer", "optimizer"]
- ✅ `meta.elapsed_seconds` < 30초 (Mock 모드)

---

### 테스트 케이스 3: Brand Identity 생성 (Mock 모드)

**요청**:
```json
{
  "kind": "brand_identity",
  "brandId": "brand_ecotech",
  "input": {
    "brand_name": "EcoTech",
    "industry": "친환경 기술",
    "target_market": "환경의식 높은 MZ세대"
  }
}
```

**성공 기준**:
- ✅ HTTP 200 OK
- ✅ `meta.workflow` = "brand_identity_pipeline"
- ✅ `meta.agents_used` = ["strategist", "copywriter", "editor"]
- ✅ `meta.elapsed_seconds` < 30초

---

### 테스트 케이스 4: SNS Set 생성 (Mock 모드)

**요청**:
```json
{
  "kind": "sns_set",
  "brandId": "brand_demo",
  "input": {
    "product_name": "친환경 텀블러",
    "features": ["이중 단열", "24시간 보온", "재활용 소재"],
    "target_audience": "환경 의식 높은 2030"
  }
}
```

**성공 기준**:
- ✅ HTTP 200 OK
- ✅ `meta.workflow` = "product_content_pipeline"
- ✅ 응답 시간 < 30초

---

### 테스트 케이스 5: Invalid Kind 에러 처리

**요청**:
```json
{
  "kind": "invalid_kind_xyz",
  "brandId": "brand_demo",
  "input": {}
}
```

**예상 응답**:
```json
{
  "detail": "Unknown kind: invalid_kind_xyz. Available: product_detail, sns_set, presentation_simple, brand_identity, content_review"
}
```

**성공 기준**:
- ✅ HTTP 400 Bad Request
- ✅ 에러 메시지에 사용 가능한 kind 목록 포함

---

## 📊 성능 기준

B팀이 검증한 성능 (Phase 2-3 테스트 결과):

| Workflow | Steps | 실측 시간 (Mock) | 목표 |
|----------|-------|------------------|------|
| Product Content | 3 | 12.35초 | < 30초 |
| Brand Identity | 3 | 22.23초 | < 30초 |
| Content Review | 3 | 13.04초 | < 30초 |

**QA Plan 성능 목표**:
- Mock 모드: **< 30초**
- Live 모드: **< 180초** (Ollama qwen2.5:7b 기준)

---

## 🔧 추가 엔드포인트 (참고용)

### Agent API v2

사용 가능한 6개 Agent 목록:
```bash
curl http://100.123.51.5:8001/api/v1/agents/list
```

개별 Agent 실행 (내부 테스트용):
```bash
curl -X POST http://100.123.51.5:8001/api/v1/agents/copywriter/execute \
  -H "Content-Type: application/json" \
  -d '{
    "task": "product_detail",
    "payload": {"product_name": "무선 이어폰"}
  }'
```

### Document API

Document 저장:
```bash
curl -X POST http://100.123.51.5:8001/api/v1/documents/doc_123/save \
  -H "Content-Type: application/json" \
  -d '{
    "type": "product_detail",
    "canvas_json": {...}
  }'
```

---

## 🚨 트러블슈팅

### 1. "Connection Refused" 에러

**증상**:
```
curl: (7) Failed to connect to 100.123.51.5 port 8001
```

**원인**: Docker 컨테이너가 실행되지 않음

**해결**:
```bash
ssh woosun@100.123.51.5
cd ~/sparklio_ai_marketing_studio
docker compose up -d backend
docker compose logs backend --tail=50
```

### 2. "ModuleNotFoundError: No module named 'minio'"

**증상**: 서버 로그에 Python 모듈 에러

**원인**: 호스트 Python에서 직접 실행하려고 시도

**해결**: Docker 컨테이너 재시작 (3단계 참고)
```bash
docker compose restart backend
```

### 3. "Unknown kind: ..." 에러

**증상**:
```json
{"detail": "Unknown kind: product_detail_old"}
```

**원인**: 잘못된 kind 값 사용

**해결**: `GET /api/v1/generate/kinds`로 유효한 kind 목록 확인

---

## 📞 B팀 연락처

**문의 사항**:
- API 스키마 변경 관련 질문
- Mac mini 배포 문제
- 테스트 결과 공유

**참고 문서**:
- [`EOD_REPORT_2025-11-17_P0_GENERATOR.md`](../../backend/EOD_REPORT_2025-11-17_P0_GENERATOR.md) - 전체 작업 기록
- [`B_TEAM_QA_PLAN_REVIEW.md`](./B_TEAM_QA_PLAN_REVIEW.md) - QA Plan 검토 의견
- [`app/schemas/generator.py`](../../backend/app/schemas/generator.py) - API 스키마 정의

---

## ✅ 테스트 완료 후 보고사항

다음 정보를 B팀에 전달해주세요:

1. **테스트 환경**:
   - Mac mini 배포 성공 여부
   - Docker 컨테이너 상태

2. **테스트 결과**:
   - 5개 테스트 케이스 성공/실패 여부
   - 각 API 응답 시간
   - 에러 발생 시 상세 로그

3. **발견된 이슈**:
   - API 동작 이상
   - 성능 문제
   - 스키마 불일치

---

**문서 버전**: v1.0
**작성일**: 2025-11-17
**작성자**: B팀 (Backend)
