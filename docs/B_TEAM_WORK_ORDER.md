# B_TEAM_WORK_ORDER.md

# Sparklio V4.3 — B팀(Backend) 작업 지시서 v2.0

- 작성일: 2025-11-15
- 작성자: A팀 (Infrastructure Team)
- 버전: v2.0 (SYSTEM_ARCHITECTURE.md 기반 전면 재작성)
- 상태: **최종 확정본 - 즉시 작업 시작 가능**

---

## ⚠️ 중요 공지

**이전 작업 지시서는 SYSTEM_ARCHITECTURE.md 작성 전의 임시 버전이었습니다.**

이 문서(v2.0)는 다음을 기반으로 작성되었습니다:
- ✅ SYSTEM_ARCHITECTURE.md v1.1 (2025-11-15 최종 확정)
- ✅ GENERATORS_SPEC.md
- ✅ ONE_PAGE_EDITOR_SPEC.md
- ✅ DATA_PIPELINE_ARCHITECTURE.md
- ✅ ADMIN_CONSOLE_SPEC.md

**현재 구현된 코드와의 불일치 사항**을 이 문서에서 명시하고, 수정 방향을 제시합니다.

---

## ⚠️ Mac mini 서버 관리 필수 규정 (2025-11-16 추가)

**B팀은 Mac mini 서버에 Backend 코드를 배포할 책임이 있습니다.**

### 필수 준수사항:
1. **매일 작업 시작 전**: Mac mini 서버 코드 상태 확인
2. **Backend 코드 변경 시**: 반드시 Mac mini 서버에 배포
3. **매일 작업 종료 후**: 배포 상태를 A팀에 공유

**상세 가이드**: [MAC_MINI_SERVER_GUIDELINES.md](MAC_MINI_SERVER_GUIDELINES.md)

**⚠️ 중요**: Backend API 엔드포인트를 추가하거나 수정한 경우, 로컬에서만 테스트하지 말고 반드시 Mac mini 서버에 배포하세요. 배포하지 않으면 A팀의 통합 테스트가 모두 실패합니다.

---

## 1. 핵심 설계 원칙 (반드시 숙지)

### 1.1 Chat-First 아키텍처

Sparklio는 **"Chat → Generator → Editor → Export"** 단일 플로우를 지향합니다.

```
사용자 경험:
1. Chat에 "제품 A 상세페이지 만들어줘" 입력
2. Backend가 Generator 실행 (SmartRouter → Agents)
3. Draft 생성 (textBlocks + editorDocument)
4. Frontend Editor에 로딩
5. 사용자가 수정 후 Export

Backend의 역할:
- Chat 입력 → Generator 라우팅
- 16~24개 Agent 조율
- Draft JSON 생성
- Editor Action 처리
```

### 1.2 Agent 기반 생성 파이프라인

모든 콘텐츠 생성은 **Agent 조합**으로 이루어집니다.

```python
# 예시: Product Detail Generator 파이프라인
1. BriefAgent: 사용자 입력 → 브리프 생성
2. StrategistAgent: 브리프 → 구조 설계 (Section 목록)
3. DataFetcherAgent: RAG로 브랜드/트렌드 데이터 수집
4. TemplateSelectorAgent: 적합한 Layout Template 선택
5. CopywriterAgent: 섹션별 텍스트 생성
6. LayoutDesignerAgent: Template + 텍스트 → Editor JSON 생성
7. ReviewerAgent: 품질 검토 및 최종 조정
```

**중요**:
- Agent는 **내부 구성 요소**입니다
- Frontend는 Agent를 직접 호출하지 않습니다
- Frontend는 **통합 `/api/v1/generate` 엔드포인트만** 호출합니다

### 1.3 P0 우선순위

| P0 (지금 구현) | P1 (나중에) |
|---------------|------------|
| Brand Kit Generator | Meeting AI Generator |
| Product Detail Generator | Variant/Localization Generator |
| SNS Generator | Presentation Generator (확장) |
| 텍스트 Template 기반 생성 | 이미지 기반 Template 자동 생성 |
| Editor JSON 저장/로드 | PPTX/HTML Export |
| PNG/PDF Export | Video Script Generator |

**P0 외 기능은 절대 구현하지 마세요.**

---

## 2. 필독 문서 (작업 전 반드시 읽기)

### ⭐⭐⭐ 최우선 (총 3시간 소요)

1. **SYSTEM_ARCHITECTURE.md** ← **가장 중요**
   - 경로: `K:\sparklio_ai_marketing_studio\docs\SYSTEM_ARCHITECTURE.md`
   - 읽기: 80분
   - 내용: 전체 시스템 구조, P0 범위, API 설계, Agent 조율
   - **이 문서가 최상위 기준입니다**

2. **GENERATORS_SPEC.md**
   - 경로: `K:\sparklio_ai_marketing_studio\docs\PHASE0\GENERATORS_SPEC.md`
   - 읽기: 60분
   - 내용: 8개 Generator 상세 스펙, Agent 파이프라인, 입출력 구조

3. **ONE_PAGE_EDITOR_SPEC.md**
   - 경로: `K:\sparklio_ai_marketing_studio\docs\PHASE0\ONE_PAGE_EDITOR_SPEC.md`
   - 읽기: 40분
   - 내용: Editor JSON 구조, Object 타입, Action 모델

4. **DATA_PIPELINE_ARCHITECTURE.md**
   - 경로: `K:\sparklio_ai_marketing_studio\docs\PHASE0\DATA_PIPELINE_ARCHITECTURE.md`
   - 읽기: 40분
   - 내용: 크롤링, RAG, Template 생성 파이프라인

### ⭐⭐ 참고 (필요 시)

5. **ADMIN_CONSOLE_SPEC.md**
   - 경로: `K:\sparklio_ai_marketing_studio\docs\PHASE0\ADMIN_CONSOLE_SPEC.md`
   - 내용: Admin API 요구사항 (P0에서는 최소 구현)

---

## 3. 현재 구현 상태 분석 (2025-11-15 기준)

### 3.1 ✅ 잘 구현된 부분

#### 3.1.1 인증 API (`/api/v1/users`)
- 위치: `backend/app/api/v1/endpoints/users.py`
- ✅ 회원가입, 로그인, JWT 토큰 발급
- ✅ 비밀번호 해싱 (bcrypt)
- ✅ 현재 사용자 조회 (`/me`)
- ✅ Admin 전용 조회 (`/{user_id}`)

**평가**: SYSTEM_ARCHITECTURE.md 4.3 인증 스펙 완벽 준수

#### 3.1.2 Brand CRUD API (`/api/v1/brands`)
- 위치: `backend/app/api/v1/endpoints/brands.py`
- ✅ Brand 생성/조회/수정/삭제
- ✅ Soft delete 지원
- ✅ 소유자 권한 확인

**평가**: 정상 작동, 유지

#### 3.1.3 Project CRUD API (`/api/v1/projects`)
- 위치: `backend/app/api/v1/endpoints/projects.py`
- ✅ Project 생성/조회/수정/삭제
- ✅ Brand 연결 확인
- ✅ Soft delete 지원

**평가**: 정상 작동, 유지

#### 3.1.4 Asset 관리 API (`/api/v1/assets`)
- 위치: `backend/app/api/v1/endpoints/assets.py`
- ✅ MinIO 연동
- ✅ 파일 업로드/다운로드 (Presigned URL)
- ✅ 파일 크기 제한
- ✅ Checksum 관리

**평가**: 완벽 구현, 유지

#### 3.1.5 Base Agent 클래스
- 위치: `backend/app/agents/base.py`
- ✅ BaseAgent, LLMAgent, VisionAgent 계층 구조
- ✅ A2ARequest, A2AResponse 프로토콜 구현
- ✅ 에러 핸들링 및 메타데이터 추가

**평가**: SYSTEM_ARCHITECTURE.md 5.1.1 A2A 프로토콜 완벽 준수

---

### 3.2 🚨 **반드시 수정해야 할 부분**

#### 3.2.1 **Agent API 구조 (`/api/v1/agents/*`) - 심각**

**현재 구현**:
```python
# endpoints/agents.py
POST /api/v1/agents/brief/generate
POST /api/v1/agents/brief/update/{project_id}
GET  /api/v1/agents/brand/analyze/{brand_id}
POST /api/v1/agents/strategy/generate
POST /api/v1/agents/copy/generate
POST /api/v1/agents/vision/generate
POST /api/v1/agents/review/content
```

**문제점**:
1. ❌ Agent가 **외부 API로 직접 노출**되어 있음
2. ❌ Frontend가 Agent 호출 순서를 알아야 함 (책임 역전)
3. ❌ SYSTEM_ARCHITECTURE.md 5.1.3 Generator 통합 API 명세 불일치

**SYSTEM_ARCHITECTURE.md 명세**:
```typescript
POST /api/v1/generate
{
  "kind": "brand_kit" | "product_detail" | "sns",
  "brandId": "brand_001",
  "locale": "ko-KR",
  "input": {
    "product": { "name": "...", "features": [...] }
  }
}

Response:
{
  "taskId": "gen_123",
  "textBlocks": { ... },
  "editorDocument": { ... },
  "meta": { "templates_used": [...], "agents_trace": [...] }
}
```

**수정 방향**:
1. **신규 생성**: `backend/app/api/v1/endpoints/generate.py`
2. **통합 라우터**: `kind` 파라미터로 Generator 선택
3. **내부 Agent 호출**: Generator가 내부적으로 Agent 조율
4. **기존 `/agents/*` 엔드포인트**: 삭제 또는 내부 전용으로 변경

#### 3.2.2 **Generator 파이프라인 누락 - 심각**

**현재 상태**:
- ✅ Individual Agent 존재 (BriefAgent, CopyAgent, etc.)
- ❌ **Generator 오케스트레이션 로직 없음**

**필요한 구현**:
- `backend/app/generators/base.py` (신규)
- `backend/app/generators/product_detail.py` (신규)
- `backend/app/generators/brand_kit.py` (신규)
- `backend/app/generators/sns.py` (신규)

**참조**: GENERATORS_SPEC.md 섹션 3, 4 참조

#### 3.2.3 **Editor Document 저장/로드 API 누락 - 높음**

**SYSTEM_ARCHITECTURE.md 5.3.3 명세**:
```python
POST /api/v1/documents/{docId}/save
GET  /api/v1/documents/{docId}
PATCH /api/v1/documents/{docId}
```

**현재 상태**:
- ❌ `/documents` 엔드포인트 존재하지 않음

**수정 방향**:
1. **신규 생성**: `backend/app/api/v1/endpoints/documents.py`
2. **DB 저장**: PostgreSQL `documents` 테이블
3. **버전 관리**: Auto-save 지원

#### 3.2.4 **Editor Action API 누락 - 중간**

**SYSTEM_ARCHITECTURE.md 5.3.2 명세**:
```python
POST /api/v1/editor/action
{
  "documentId": "doc_123",
  "actions": [{
    "type": "update_object",
    "target": { "role": "TITLE" },
    "payload": { "props": { "fontSize": 60 } }
  }]
}
```

**현재 상태**:
- ❌ `/editor/action` 엔드포인트 없음

**수정 방향**:
1. **신규 생성**: `backend/app/api/v1/endpoints/editor.py`
2. **P0 기본 4종 Action** 구현

#### 3.2.5 **Template 관리 API 누락 - 중간**

**현재 상태**:
- ❌ `/templates` 엔드포인트 없음

**수정 방향**:
1. **신규 생성**: `backend/app/api/v1/endpoints/templates.py`
2. **Redis 캐싱**: Approved 템플릿만 캐싱

---

## 4. 작업 계획 (4주, P0 완료 기준)

### Phase 1: Generator 통합 API 구축 (1주)

**목표**: `/api/v1/generate` 엔드포인트 완성

**체크리스트**:
- [ ] Generator 기반 클래스 구현 (`generators/base.py`)
- [ ] BrandKitGenerator 구현
- [ ] ProductDetailGenerator 구현
- [ ] SNSGenerator 구현
- [ ] 통합 Generate 엔드포인트 (`endpoints/generate.py`)
- [ ] 기존 `/agents/*` 처리 (삭제 또는 내부 전용)

**산출물**:
- `POST /api/v1/generate` 작동
- 3개 Generator 모두 200 응답
- `editorDocument` JSON 반환 확인

---

### Phase 2: Editor Document & Action API (1주)

**목표**: Editor JSON 저장/로드/수정 완성

**체크리스트**:
- [ ] Documents 엔드포인트 (`endpoints/documents.py`)
- [ ] Document DB 모델 및 마이그레이션
- [ ] Editor Action 엔드포인트 (`endpoints/editor.py`)
- [ ] Export API (PNG/PDF 기본)

**산출물**:
- `POST /api/v1/documents/{docId}/save` 작동
- `GET /api/v1/documents/{docId}` 작동
- `POST /api/v1/editor/action` 작동
- `POST /api/v1/export/png/{docId}` 작동

---

### Phase 3: Template & RAG 연동 (1주)

**목표**: Template 관리 + Brand Learning Engine 연동

**체크리스트**:
- [ ] Templates 엔드포인트 (`endpoints/templates.py`)
- [ ] Template DB 모델 및 마이그레이션
- [ ] Redis 템플릿 캐싱
- [ ] Brand Learning Engine 서비스 (`services/brand_learning.py`)

**산출물**:
- `GET /api/v1/templates` 작동
- Redis 캐싱 확인
- RAG 데이터 조회 확인

---

### Phase 4: Admin API & 모니터링 (1주)

**목표**: P0 최소 Admin API + Prometheus 메트릭

**체크리스트**:
- [ ] Admin Users API
- [ ] Admin Jobs API
- [ ] Admin Agents Status API
- [ ] Prometheus 메트릭 강화

**산출물**:
- `GET /admin/users` 작동
- `GET /admin/jobs` 작동
- `GET /admin/agents` 작동
- Prometheus 메트릭 수집 확인

---

## 5. 코드 구현 가이드

### 5.1 Generator Base 클래스

**파일**: `backend/app/generators/base.py`

```python
from abc import ABC, abstractmethod
from typing import Dict, Any
from pydantic import BaseModel

class GenerationRequest(BaseModel):
    kind: str  # "brand_kit" | "product_detail" | "sns"
    brandId: str
    locale: str = "ko-KR"
    input: Dict[str, Any]
    context: Dict[str, Any] = {}

class GenerationResult(BaseModel):
    taskId: str
    kind: str
    textBlocks: Dict[str, Any]
    editorDocument: Dict[str, Any]
    meta: Dict[str, Any]

class BaseGenerator(ABC):
    def __init__(self):
        self.strategist = None
        self.data_fetcher = None
        self.template_selector = None
        self.copywriter = None
        self.layout_designer = None
        self.reviewer = None

    @abstractmethod
    async def generate(self, request: GenerationRequest) -> GenerationResult:
        pass

    async def _execute_pipeline(self, request: GenerationRequest):
        # 1. Strategist: 구조 설계
        # 2. DataFetcher: RAG
        # 3. TemplateSelector: 템플릿 선택
        # 4. Copywriter: 텍스트 생성
        # 5. LayoutDesigner: Editor JSON 생성
        # 6. Reviewer: 품질 검토
        pass
```

### 5.2 통합 Generate 엔드포인트

**파일**: `backend/app/api/v1/endpoints/generate.py`

```python
from fastapi import APIRouter, Depends, HTTPException
from app.generators.base import GenerationRequest
from app.generators.brand_kit import BrandKitGenerator
from app.generators.product_detail import ProductDetailGenerator
from app.generators.sns import SNSGenerator

router = APIRouter()

generators = {
    "brand_kit": BrandKitGenerator(),
    "product_detail": ProductDetailGenerator(),
    "sns": SNSGenerator(),
}

@router.post("/generate")
async def generate_content(request: GenerationRequest):
    """
    통합 Generator 엔드포인트

    Examples:
        POST /api/v1/generate
        {
          "kind": "product_detail",
          "brandId": "brand_001",
          "input": {
            "product": {
              "name": "스킨케어 세럼",
              "features": ["보습", "주름개선"],
              "price": 39000
            }
          }
        }
    """
    if request.kind not in generators:
        raise HTTPException(400, f"Unknown generator kind: {request.kind}")

    generator = generators[request.kind]
    result = await generator.generate(request)

    return result
```

**router.py에 추가**:
```python
# backend/app/api/v1/router.py
from app.api.v1.endpoints import generate

api_router.include_router(generate.router, prefix="", tags=["generate"])
```

### 5.3 Documents 엔드포인트

**파일**: `backend/app/api/v1/endpoints/documents.py`

```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID
from datetime import datetime

router = APIRouter()

@router.post("/{docId}/save")
async def save_document(
    docId: UUID,
    data: DocumentSaveRequest,
    db: Session = Depends(get_db)
):
    """
    Editor Document 저장
    """
    doc = db.query(Document).filter(Document.id == docId).first()

    if not doc:
        doc = Document(
            id=docId,
            document_json=data.documentJson,
            metadata=data.metadata,
            version=1
        )
        db.add(doc)
    else:
        doc.document_json = data.documentJson
        doc.version += 1
        doc.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(doc)

    return {"status": "saved", "version": doc.version}

@router.get("/{docId}")
async def load_document(docId: UUID, db: Session = Depends(get_db)):
    """Document 로드"""
    doc = db.query(Document).filter(Document.id == docId).first()
    if not doc:
        raise HTTPException(404, "Document not found")
    return DocumentResponse.model_validate(doc)
```

---

## 6. DB Schema 추가

### 6.1 Documents 테이블

```sql
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID REFERENCES brands(id),
    project_id UUID REFERENCES projects(id),
    user_id UUID REFERENCES users(id) NOT NULL,

    document_json JSONB NOT NULL,
    metadata JSONB DEFAULT '{}',
    version INTEGER DEFAULT 1,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_documents_user ON documents(user_id);
CREATE INDEX idx_documents_project ON documents(project_id);
```

### 6.2 Templates 테이블

```sql
CREATE TABLE templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id VARCHAR(255) UNIQUE NOT NULL,

    type VARCHAR(50) NOT NULL,
    origin VARCHAR(50) NOT NULL,

    industry TEXT[] DEFAULT '{}',
    channel TEXT[] DEFAULT '{}',

    document_json JSONB NOT NULL,

    status VARCHAR(20) DEFAULT 'draft',

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_templates_type ON templates(type);
CREATE INDEX idx_templates_status ON templates(status);
```

### 6.3 Generation Jobs 테이블

```sql
CREATE TABLE generation_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id VARCHAR(255) UNIQUE NOT NULL,

    user_id UUID REFERENCES users(id),
    brand_id UUID REFERENCES brands(id),

    kind VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'queued',

    input_data JSONB,
    result_data JSONB,

    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    duration_ms INTEGER,

    error_message TEXT,

    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_jobs_user ON generation_jobs(user_id);
CREATE INDEX idx_jobs_status ON generation_jobs(status);
```

---

## 7. 환경 설정 (`.env` 추가)

```bash
# Generator 설정
GENERATOR_TIMEOUT_SECONDS=300
MAX_GENERATOR_RETRIES=2

# Template 캐싱
TEMPLATE_CACHE_TTL=3600

# Export 설정
EXPORT_PNG_MAX_WIDTH=2400
EXPORT_PDF_DPI=150

# Brand Learning Engine
BRAND_LEARNING_ENABLED=true

# Feature Flags
GEN_BRAND_KIT_ENABLED=true
GEN_PRODUCT_DETAIL_ENABLED=true
GEN_SNS_ENABLED=true
GEN_MEETING_AI_ENABLED=false
```

---

## 8. 테스트 시나리오

### 8.1 Generator 통합 테스트

```bash
# Product Detail Generator
curl -X POST http://100.123.51.5:8000/api/v1/generate \
  -H "Content-Type: application/json" \
  -d '{
    "kind": "product_detail",
    "brandId": "brand_001",
    "input": {
      "product": {
        "name": "비타민C 세럼",
        "features": ["주름개선", "미백"],
        "price": 49000
      }
    }
  }'
```

**예상 응답**:
```json
{
  "taskId": "gen_123",
  "textBlocks": { "headline": "...", "description": "..." },
  "editorDocument": {
    "documentId": "doc_123",
    "pages": [...]
  }
}
```

### 8.2 Document Save/Load 테스트

```bash
# 저장
curl -X POST http://100.123.51.5:8000/api/v1/documents/doc_123/save \
  -d '{"documentJson": {...}, "metadata": {}}'

# 로드
curl http://100.123.51.5:8000/api/v1/documents/doc_123
```

---

## 9. P0 완료 체크리스트

### 9.1 API 엔드포인트

- [ ] `POST /api/v1/generate`
- [ ] `POST /api/v1/documents/{docId}/save`
- [ ] `GET /api/v1/documents/{docId}`
- [ ] `POST /api/v1/editor/action`
- [ ] `POST /api/v1/export/png/{docId}`
- [ ] `POST /api/v1/export/pdf/{docId}`
- [ ] `GET /api/v1/templates`

### 9.2 Generator

- [ ] BrandKitGenerator
- [ ] ProductDetailGenerator
- [ ] SNSGenerator
- [ ] Generator Base 클래스

### 9.3 Agent (필수 7종)

- [ ] StrategistAgent
- [ ] DataFetcherAgent
- [ ] TemplateSelectorAgent
- [ ] CopywriterAgent
- [ ] LayoutDesignerAgent
- [ ] ReviewerAgent
- [ ] BrandAnalyzerAgent

### 9.4 DB & Storage

- [ ] `documents` 테이블
- [ ] `templates` 테이블
- [ ] `generation_jobs` 테이블
- [ ] Redis 템플릿 캐싱

### 9.5 Admin API (최소)

- [ ] `GET /admin/users`
- [ ] `GET /admin/jobs`
- [ ] `GET /admin/agents`

---

## 10. 금지 사항

### 10.1 절대 금지

1. ❌ **Agent를 외부 API로 직접 노출**
   - Frontend는 `/api/v1/generate`만 호출

2. ❌ **P0 외 기능 구현**
   - Meeting AI, 이미지 템플릿, Video는 P1

3. ❌ **SYSTEM_ARCHITECTURE.md와 다른 API 구조**
   - 이 문서가 최상위 기준

### 10.2 주의 사항

1. ⚠️ **기존 `/agents/*` 엔드포인트 처리**
   - 삭제 또는 내부 전용으로 변경

2. ⚠️ **C팀과의 API 계약 준수**
   - C_TEAM_WORK_ORDER.md v2.0 참조

3. ⚠️ **Redis 캐싱 필수**
   - Template 성능 최적화

---

## 11. 완료 기준 (DoD)

**P0 완료 시나리오**:
1. Frontend에서 `POST /api/v1/generate` 호출
2. Product Detail Generator 실행
3. Draft 반환
4. Frontend Editor에 로딩
5. 사용자 수정 후 저장
6. PNG Export 성공

**통과 기준**:
- 시나리오 1회 이상 성공
- 모든 API < 5초 응답
- 에러율 < 5%
- Prometheus 메트릭 수집

---

## 12. 참고 자료

- Generator 파이프라인: GENERATORS_SPEC.md 섹션 2.1
- Editor JSON 구조: ONE_PAGE_EDITOR_SPEC.md 섹션 5.2
- Action 모델: ONE_PAGE_EDITOR_SPEC.md 섹션 8.1
- Template 구조: ONE_PAGE_EDITOR_SPEC.md 섹션 7.2

---

## 📌 추가 작업: Concept Board (Phase 1)

**우선순위**: P1 (Generator 완료 후 진행)
**예상 소요**: 1-2주
**담당 문서**: `docs/CONCEPT_BOARD_B_TEAM_TASKS.md`

### 작업 개요

Mixboard 스타일 무드보드 기능을 구현합니다. **Phase 1은 Mock Provider 기반**으로 진행하며, 나노바나나 API 스펙 확보 후 Phase 2에서 실제 연동합니다.

**Phase 1 핵심 작업**:
1. 데이터베이스 스키마 (concept_boards, concept_tiles, brand_visual_styles)
2. Mock ImageProvider (더미 이미지 생성)
3. 4개 API 엔드포인트
4. MinIO 이미지 저장 + 썸네일/팔레트 추출

**상세 지시사항**: `K:\sparklio_ai_marketing_studio\docs\CONCEPT_BOARD_B_TEAM_TASKS.md` 참조

---

**작업 시작 전 확인사항**:

1. [ ] SYSTEM_ARCHITECTURE.md 완독 (80분)
2. [ ] GENERATORS_SPEC.md 완독 (60분)
3. [ ] ONE_PAGE_EDITOR_SPEC.md 완독 (40분)
4. [ ] CONCEPT_BOARD_SPEC.md 확인 (30분) ← **NEW**
5. [ ] 현재 코드 검토 완료
6. [ ] C_TEAM_WORK_ORDER.md v2.0 확인
7. [ ] PostgreSQL, Redis, MinIO 연결 확인

**시작하세요!** 🚀
