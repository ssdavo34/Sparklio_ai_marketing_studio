# B팀 (Backend) 작업 요청서 - 업데이트

**발행일**: 2025-11-19
**최종 업데이트**: 2025-11-19 (수요일)
**프로젝트**: Sparklio Editor v2.0 + Multi-Agent System
**담당**: B팀 (Backend/Python/FastAPI)
**우선순위**: Phase 1 → Phase 8 순차 진행

---

## 📋 최신 업데이트 (2025-11-19)

### ✅ 완료된 작업

1. **VisionAnalyzerAgent 구현 완료** (Phase 1 - Agent 확장)
   - Agent 클래스 구현 완료 ([vision_analyzer.py](app/services/agents/vision_analyzer.py))
   - Vision API 통합 (Claude 3.5 Sonnet Primary, GPT-4o Fallback)
   - 품질 평가 스키마 정의 (CompositionAnalysis, ColorHarmonyAnalysis, BrandConsistencyAnalysis, TechnicalQualityAnalysis)
   - 기본 테스트 완료 ([test_vision_analyzer.py](tests/test_vision_analyzer.py))
   - **상태**: STEP 1-2 완료, STEP 3-5 남음 (품질 평가 로직 고도화, 통합 테스트, 문서화)

2. **AGENTS_SPEC.md 작성 완료**
   - 24개 Agent 전체 명세 문서화
   - 7개 구현 완료 Agent 상세 스펙 (CopywriterAgent, StrategistAgent, DesignerAgent, ReviewerAgent, OptimizerAgent, EditorAgent, VisionAnalyzerAgent)
   - 17개 계획 Agent 개요 (Input/Output 스키마)
   - Agent API 엔드포인트 표준화
   - Frontend 연동 가이드 (JavaScript/TypeScript 예시)
   - **위치**: [backend/AGENTS_SPEC.md](AGENTS_SPEC.md)

3. **LLM Provider 구조적 결함 수정** (2025-11-19 오전)
   - Anthropic, Gemini, Novita Provider의 Abstract Method 구현 누락 해결
   - Prompt 자동 변환 기능 구현 (자유 형식 입력 → 구조화된 데이터)

### 🎯 현재 Agent 구현 상태

| Agent | 상태 | 구현 일자 | 비고 |
|-------|------|----------|------|
| **Creation Agents** |
| CopywriterAgent | ✅ 완료 | 2025-11-16 | 텍스트 콘텐츠 생성 |
| StrategistAgent | ✅ 완료 | 2025-11-16 | 마케팅 전략 수립 |
| DesignerAgent | ✅ 완료 | 2025-11-16 | 비주얼 콘텐츠 생성 (Mock 모드) |
| ReviewerAgent | ✅ 완료 | 2025-11-16 | 콘텐츠 품질 검토 |
| OptimizerAgent | ✅ 완료 | 2025-11-16 | 콘텐츠 최적화 |
| EditorAgent | ✅ 완료 | 2025-11-16 | 콘텐츠 편집 및 교정 |
| VisionAnalyzerAgent | 🔄 진행 중 | 2025-11-19 | 이미지 품질 평가 (STEP 1-2 완료) |
| ScenePlannerAgent | ⏳ 계획 | Phase 2 | 광고 영상 씬 구성 |
| TemplateAgent | ⏳ 계획 | Phase 2 | 마케팅 템플릿 자동 생성 |
| **Intelligence Agents** |
| TrendCollectorAgent | ⏳ 계획 | Phase 3 | 트렌드 데이터 크롤링 |
| DataCleanerAgent | ⏳ 계획 | Phase 3 | 데이터 정제 |
| EmbedderAgent | ⏳ 계획 | Phase 3 | 임베딩 생성 |
| IngestorAgent | ⏳ 계획 | Phase 3 | DB 저장 및 캐싱 |
| PerformanceAnalyzerAgent | ⏳ 계획 | Phase 3 | SNS/광고 성과 분석 |
| SelfLearningAgent | ⏳ 계획 | Phase 3 | 브랜드 벡터 조정 |
| RAGAgent | ⏳ 계획 | Phase 3 | 지식 검색 및 컨텍스트 제공 |
| **System Agents** |
| PMAgent | ⏳ 계획 | Phase 4 | 워크플로우 조율 |
| SecurityAgent | ⏳ 계획 | Phase 4 | 민감정보 탐지 |
| BudgetAgent | ⏳ 계획 | Phase 4 | LLM Token/비용 추적 |
| ADAgent | ⏳ 계획 | Phase 4 | 광고 퍼포먼스 최적화 |
| **Orchestration** |
| WorkflowExecutor | ✅ 완료 | 2025-11-16 | 워크플로우 실행 |
| ProductContentWorkflow | ✅ 완료 | 2025-11-16 | Copywriter → Reviewer → Optimizer |
| BrandIdentityWorkflow | ✅ 완료 | 2025-11-16 | Strategist → Copywriter → Reviewer |
| ContentReviewWorkflow | ✅ 완료 | 2025-11-16 | Reviewer → Editor → Reviewer |

**구현 진행률**: 10/24 Agents (41% 완료)

---

## 📂 핵심 문서

반드시 먼저 읽어주세요:

1. **Agent 명세**
   - [AGENTS_SPEC.md](AGENTS_SPEC.md) - 24개 Agent 전체 명세 ⭐ **필독**
   - [AGENT_EXPANSION_PLAN_2025-11-18.md](AGENT_EXPANSION_PLAN_2025-11-18.md) - 8주 확장 로드맵
   - [docs/OPENAPI_SPEC_V4_AGENT.md](docs/OPENAPI_SPEC_V4_AGENT.md) - Agent API OpenAPI 명세

2. **Editor 통합**
   - [frontend/docs/editor/000_MASTER_PLAN.md](../frontend/docs/editor/000_MASTER_PLAN.md) - 프로젝트 전체 비전
   - [frontend/docs/editor/002_DATA_MODEL.md](../frontend/docs/editor/002_DATA_MODEL.md) - EditorDocument, ObjectRole
   - [frontend/docs/editor/008_AGENTS_INTEGRATION.md](../frontend/docs/editor/008_AGENTS_INTEGRATION.md) - 메뉴 ↔ Agent 연계 ⭐ **필독**
   - [frontend/docs/editor/010_IMPLEMENTATION_ROADMAP.md](../frontend/docs/editor/010_IMPLEMENTATION_ROADMAP.md) - 전체 로드맵

3. **C팀 통합 요청사항**
   - [C_TEAM_INTEGRATION_REVIEW_2025-11-19.md](C_TEAM_INTEGRATION_REVIEW_2025-11-19.md) - C팀 요청사항 검토

---

## 🎯 Agent 확장 계획 (8주)

### Phase 1: VisionAnalyzerAgent (2025-11-18 ~ 12-01)

**목표**: 이미지 품질 자동 평가 Agent 구현

**상태**: 🔄 진행 중 (STEP 1-2 완료)

**완료된 작업** (2025-11-19):
- ✅ STEP 1: Agent 클래스 구현
  - `app/services/agents/vision_analyzer.py` 작성 (450+ 줄)
  - Pydantic 스키마 정의 (CompositionAnalysis, ColorHarmonyAnalysis, BrandConsistencyAnalysis, TechnicalQualityAnalysis, VisionAnalysisResult)
  - Mock 분석 결과 생성 (개발용 Fallback)

- ✅ STEP 2: Vision API 통합
  - `app/services/llm/gateway.py`에 `generate_with_vision()` 메서드 추가 (150+ 줄)
  - Vision Provider 선택 로직 구현 (Primary: Claude 3.5 Sonnet, Fallback: GPT-4o)
  - Vision Prompt 빌더 구현

- ✅ 기본 테스트
  - `tests/test_vision_analyzer.py` 작성 (150+ 줄)
  - 기본 테스트 시나리오 2개 (기본 분석, 브랜드 가이드라인 포함)

**남은 작업**:
- [ ] STEP 3: 품질 평가 로직 고도화 (2일)
  - 실제 Vision API 호출 로직 완성
  - 품질 점수 계산 알고리즘 개선
  - 개선 제안 생성 로직

- [ ] STEP 4: 통합 테스트 (2일)
  - DesignerAgent 생성 이미지 → VisionAnalyzerAgent 평가 파이프라인 테스트
  - 10개 테스트 케이스 작성
  - 품질 점수 정확도 검증 (>90%)

- [ ] STEP 5: 문서화 (1일)
  - API 문서 업데이트
  - 사용 가이드 작성

**API 엔드포인트**:
```
POST /api/v1/agents/vision_analyzer/execute
```

**Request 예시**:
```json
{
    "task": "image_analysis",
    "payload": {
        "image_url": "https://example.com/product.jpg",
        "criteria": {
            "composition": true,
            "color_harmony": true,
            "brand_consistency": true,
            "technical_quality": true
        },
        "brand_guidelines": {
            "primary_colors": ["#FF0000", "#0000FF"],
            "style": "minimalist"
        }
    }
}
```

**Response 예시**:
```json
{
    "agent": "vision_analyzer",
    "task": "image_analysis",
    "outputs": [{
        "type": "json",
        "name": "vision_analysis",
        "value": {
            "quality_score": 0.87,
            "composition": {
                "score": 0.9,
                "analysis": "요소 배치가 균형적이며 시선 흐름이 자연스러움",
                "issues": ["텍스트와 이미지 간격이 약간 좁음"]
            },
            "color_harmony": {
                "score": 0.85,
                "analysis": "색상 조합이 조화로우며 브랜드 아이덴티티를 잘 반영함",
                "issues": []
            },
            "brand_consistency": {
                "score": 0.88,
                "matches_guidelines": true,
                "deviations": ["폰트 크기가 가이드라인보다 작음"]
            },
            "technical_quality": {
                "score": 0.80,
                "resolution": "good",
                "clarity": "good",
                "issues": []
            },
            "improvements": [
                "텍스트와 이미지 사이 여백을 20px에서 40px로 증가 권장",
                "배경색을 약간 밝게 조정하여 가독성 향상"
            ],
            "overall_verdict": "good",
            "requires_regeneration": false
        }
    }],
    "usage": {
        "vision_api_calls": 1,
        "elapsed_seconds": 2.5
    },
    "meta": {
        "task": "image_analysis",
        "has_brand_guidelines": true
    }
}
```

---

### Phase 2: ScenePlanner + Template Agents (2025-12-02 ~ 12-15)

**목표**: 광고 영상 씬 구성 및 템플릿 자동 생성 Agent 구현

**작업 항목**:

#### ScenePlannerAgent
```python
# app/services/agents/scene_planner.py

class ScenePlannerAgent(AgentBase):
    """광고 영상 씬 구성 설계 Agent"""

    @property
    def name(self) -> str:
        return "scene_planner"

    async def execute(self, request: AgentRequest) -> AgentResponse:
        # Task: scene_plan, storyboard
        # Input: product_info, duration, style
        # Output: scenes[] (id, duration, description, shots[], audio, text_overlay)
        pass
```

**API 엔드포인트**:
```
POST /api/v1/agents/scene_planner/execute
```

#### TemplateAgent
```python
# app/services/agents/template.py

class TemplateAgent(AgentBase):
    """마케팅 템플릿 자동 생성 Agent"""

    @property
    def name(self) -> str:
        return "template"

    async def execute(self, request: AgentRequest) -> AgentResponse:
        # Task: generate_template, list_templates
        # Input: industry, channel, purpose
        # Output: template (structure, variables, style_guide)
        pass
```

**API 엔드포인트**:
```
POST /api/v1/agents/template/execute
```

**완료 기준**:
- [ ] ScenePlannerAgent가 15초/30초/60초 영상 씬 생성
- [ ] TemplateAgent가 업종별 템플릿 자동 생성
- [ ] Template 재사용률 > 70%

---

### Phase 3: Intelligence Agents (2025-12-16 ~ 12-29)

**목표**: 데이터 파이프라인 Agent 7종 구현

**작업 항목**:

#### 1. TrendCollectorAgent
- 트렌드 데이터 크롤링 (Naver, Instagram, YouTube)
- Selenium + BeautifulSoup + API
- 크롤링 차단 대응 (User-Agent 로테이션, Rate Limiting)

#### 2. DataCleanerAgent
- HTML 제거, 중복 제거, OCR 정제
- BeautifulSoup + Tesseract OCR

#### 3. EmbedderAgent
- 텍스트 임베딩 생성 (OpenAI, BGE)
- Batch 처리 (최대 2048개)

#### 4. IngestorAgent
- PostgreSQL 저장, Redis 캐싱, S3 업로드
- Insertion Rate > 1000 records/sec

#### 5. PerformanceAnalyzerAgent
- SNS·광고 성과 데이터 분석
- Instagram API, Naver Ad API 연동

#### 6. SelfLearningAgent
- 사용자 피드백 기반 브랜드 벡터 조정
- PostgreSQL (brand_vectors 테이블)

#### 7. RAGAgent
- 지식 검색 및 컨텍스트 제공
- PostgreSQL (pgvector) + Embedding
- Retrieval@10 > 0.85

**완료 기준**:
- [ ] Trend 크롤링 → 정제 → 임베딩 → 저장 → RAG 검색 전체 파이프라인 작동
- [ ] 검색 정확도 (Retrieval@10) > 0.85
- [ ] 처리 속도 > 1000 records/sec

---

### Phase 4: System Agents (2025-12-30 ~ 2026-01-12)

**목표**: 시스템 안정성 Agent 4종 구현

**작업 항목**:

#### 1. PMAgent
- 전체 워크플로우 조율 및 태스크 분배
- 자연어 요청 → 워크플로우 자동 계획
- Planning Time < 5초

#### 2. SecurityAgent
- 민감정보 탐지 및 정책 위반 검사
- PII Detection Library
- False Positive Rate < 5%

#### 3. BudgetAgent
- LLM Token/Cost 추적 및 비용 최적화
- Prometheus + Cost Tracking DB
- Cost Prediction Accuracy ±10%

#### 4. ADAgent
- 광고 퍼포먼스 최적화 (Google Ads, Naver, Kakao)
- Google Ads API, Naver Ad API
- ROI Improvement > 20%

**완료 기준**:
- [ ] PMAgent가 자연어 요청 → 워크플로우 자동 계획
- [ ] SecurityAgent PII 탐지 정확도 > 98%
- [ ] BudgetAgent 비용 예측 오차 < ±10%
- [ ] ADAgent 광고 최적화 ROI 개선 > 20%

---

## Phase 1: Canvas Studio (Week 1-3)

### 🎯 목표

**EditorDocument CRUD API + 이미지 업로드**

A팀이 에디터를 만들 수 있도록 **문서 저장/로드 API**를 제공합니다.

### ✅ 1차 성공 조건

```
[ ] Documents CRUD API 완성
[ ] EditorDocument를 PostgreSQL JSONB에 저장
[ ] MinIO 이미지 업로드 API 완성
[ ] A팀과 통합 테스트 완료
```

### 📂 작업 항목

#### Week 1: Database Schema

```sql
-- 1. documents 테이블 생성
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    mode VARCHAR(50),               -- 'pitch-deck', 'product-story', etc.
    brand_id UUID,
    content JSONB NOT NULL,         -- EditorDocument 전체 (pages, tokens 포함)
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. 인덱스
CREATE INDEX idx_documents_brand_id ON documents(brand_id);
CREATE INDEX idx_documents_created_at ON documents(created_at DESC);

-- 3. Trigger (updated_at 자동 업데이트)
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_documents_updated_at
BEFORE UPDATE ON documents
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();
```

#### Week 1-2: API Endpoints

```python
# backend/app/api/v1/documents.py

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID
from models.editor import EditorDocument

router = APIRouter()

# ===== Request/Response Models =====

class CreateDocumentRequest(BaseModel):
    title: str
    mode: Optional[str] = None
    brandId: Optional[UUID] = None
    content: EditorDocument  # 002_DATA_MODEL.md 참고

class UpdateDocumentRequest(BaseModel):
    content: EditorDocument

class DocumentResponse(BaseModel):
    id: UUID
    title: str
    mode: Optional[str]
    brandId: Optional[UUID]
    content: EditorDocument
    createdAt: str
    updatedAt: str

# ===== Endpoints =====

@router.post('/documents', response_model=DocumentResponse)
async def create_document(request: CreateDocumentRequest):
    """새 문서 생성"""
    # 구현 필요

@router.get('/documents/{document_id}', response_model=DocumentResponse)
async def get_document(document_id: UUID):
    """문서 조회"""
    # 구현 필요

@router.put('/documents/{document_id}', response_model=DocumentResponse)
async def update_document(document_id: UUID, request: UpdateDocumentRequest):
    """문서 업데이트"""
    # 구현 필요

@router.delete('/documents/{document_id}')
async def delete_document(document_id: UUID):
    """문서 삭제"""
    # 구현 필요

@router.get('/documents', response_model=List[DocumentResponse])
async def list_documents(
    brand_id: Optional[UUID] = None,
    limit: int = 20,
    offset: int = 0
):
    """문서 목록 조회"""
    # 구현 필요
```

---

## Phase 2: Spark Chat (Week 4-5)

### 🎯 목표

**자연어 브리프 → EditorDocument 자동 생성**

### ✅ 1차 성공 조건

```
[ ] Chat Analysis API (LLM 통합)
[ ] Document Generation API (기본 템플릿)
[ ] PMAgent, StrategistAgent, CopywriterAgent, EditorAgent 통합
[ ] A팀과 통합 테스트 완료
```

**참조**: [frontend/docs/editor/008_AGENTS_INTEGRATION.md](../frontend/docs/editor/008_AGENTS_INTEGRATION.md) Phase 2 섹션

---

## Phase 3: Meeting AI (Week 6-7)

### 🎯 목표

**음성 파일 → 텍스트 → EditorDocument 자동 생성**

### ✅ 1차 성공 조건

```
[ ] Meeting Upload API (Whisper STT)
[ ] Meeting Analysis API
[ ] MeetingAIAgent 통합
[ ] A팀과 통합 테스트 완료
```

**참조**: [frontend/docs/editor/008_AGENTS_INTEGRATION.md](../frontend/docs/editor/008_AGENTS_INTEGRATION.md) Phase 3 섹션

---

## 🚀 시작 방법

### 1. 문서 읽기 (필수)

```
1. AGENTS_SPEC.md (24개 Agent 명세)
2. frontend/docs/editor/002_DATA_MODEL.md (EditorDocument 스키마)
3. frontend/docs/editor/008_AGENTS_INTEGRATION.md (메뉴 ↔ Agent 연계)
4. AGENT_EXPANSION_PLAN_2025-11-18.md (8주 확장 로드맵)
```

### 2. 개발 환경 설정

```bash
cd k:/sparklio_ai_marketing_studio/backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt

# PostgreSQL, MinIO, Redis 실행
docker-compose up -d
```

### 3. Agent 확장 작업 시작

```
Phase 1 (진행 중):
- VisionAnalyzerAgent STEP 3-5 완료
- app/services/agents/vision_analyzer.py 수정
- tests/test_vision_analyzer.py 확장

Phase 2 (다음 2주):
- ScenePlannerAgent 구현
- TemplateAgent 구현
```

### 4. A팀/C팀과 협업

```
- API 스펙 문서화 (Swagger/OpenAPI)
- Postman Collection 공유
- 통합 테스트 정기 실행
- Agent API 호출 방법 공유
```

---

## 📞 질문 & 지원

- **Agent 명세**: [AGENTS_SPEC.md](AGENTS_SPEC.md)
- **Agent 확장 로드맵**: [AGENT_EXPANSION_PLAN_2025-11-18.md](AGENT_EXPANSION_PLAN_2025-11-18.md)
- **데이터 모델**: [frontend/docs/editor/002_DATA_MODEL.md](../frontend/docs/editor/002_DATA_MODEL.md)
- **Agent 통합**: [frontend/docs/editor/008_AGENTS_INTEGRATION.md](../frontend/docs/editor/008_AGENTS_INTEGRATION.md)
- **C팀 요청사항**: [C_TEAM_INTEGRATION_REVIEW_2025-11-19.md](C_TEAM_INTEGRATION_REVIEW_2025-11-19.md)
- **A팀 협업**: [frontend/docs/editor/TEAM_A_REQUEST.md](../frontend/docs/editor/TEAM_A_REQUEST.md)

---

**작성자**: B팀 (Backend)
**마지막 업데이트**: 2025-11-19 (수요일)
**승인**: 대기 중
