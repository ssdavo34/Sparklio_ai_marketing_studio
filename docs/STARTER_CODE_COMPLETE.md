# STARTER_CODE_COMPLETE.md
Sparklio V4 — Backend Starter Code 완료 보고서
작성일: 2025-11-15
작성자: A팀 (Infrastructure Team)

---

# 1. 개요

**2단계: Backend Starter Code 생성**이 완료되었습니다.
B팀(Backend)이 즉시 사용할 수 있는 **완전한 FastAPI 프로젝트 골격**이 준비되었습니다.

---

# 2. 완성된 Backend 구조

```
backend/
├── app/
│   ├── main.py                    ✅ FastAPI 앱 메인
│   ├── celery_app.py              ✅ Celery 설정
│   │
│   ├── api/
│   │   └── v1/
│   │       ├── __init__.py        ✅ API v1 라우터
│   │       └── router.py          ✅ SmartRouter 엔드포인트
│   │
│   ├── agents/
│   │   ├── __init__.py
│   │   └── smart_router.py        ✅ SmartRouter 구현
│   │
│   ├── integrations/
│   │   ├── __init__.py
│   │   ├── ollama_client.py       ✅ Ollama 통합
│   │   └── comfyui_client.py      ✅ ComfyUI 통합
│   │
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── common.py              ✅ 공통 스키마 (A2A, Context)
│   │   └── router.py              ✅ Router 스키마
│   │
│   └── tasks/
│       ├── __init__.py
│       └── workflow.py            ✅ Celery tasks
│
├── tests/
│   ├── __init__.py
│   ├── test_ollama_client.py      ✅ Ollama 테스트
│   └── test_comfyui_client.py     ✅ ComfyUI 테스트
│
├── requirements.txt               ✅ 의존성
├── pytest.ini                     ✅ Pytest 설정
├── .env.example                   ✅ 환경 변수 템플릿
├── .gitignore                     ✅ Git 무시 파일
├── CELERY_SETUP_GUIDE.md          ✅ Celery 가이드
└── README.md                      (TODO: B팀이 작성)
```

---

# 3. 핵심 구성요소

## 3.1 FastAPI Application ✅

**파일**: `app/main.py`

**기능**:
- FastAPI 앱 초기화
- CORS 미들웨어
- API v1 라우터 포함
- Health check 엔드포인트

**실행 방법**:
```bash
cd ~/sparklio_ai_marketing_studio/backend
source .venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

---

## 3.2 SmartRouter 구현 ✅

**파일**: `app/agents/smart_router.py`

**기능**:
- Intent Classification (키워드 기반)
- Agent Selection (9개 Intent → Agent 매핑)
- Model Selection (Risk/Context 기반)
- Context Minimization (47% 축소 목표)
- Risk Assessment (low/medium/high)

**API 엔드포인트**:
```
POST /api/v1/router/route
GET /api/v1/router/health
```

**사용 예시**:
```bash
curl -X POST http://100.123.51.5:8000/api/v1/router/route \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test_user",
    "request_text": "브랜드 색상 알려줘",
    "brand_id": "test_brand"
  }'
```

---

## 3.3 Pydantic Schemas ✅

**파일**: `app/schemas/common.py`, `app/schemas/router.py`

**정의된 스키마**:
- `A2ARequest` / `A2AResponse` (표준 A2A 프로토콜)
- `SystemContext`, `TaskContext`, `WorkingMemory`, `EphemeralContext`
- `RouterRequest` / `RouterResponse`
- `AgentError` (표준 에러 포맷)
- `BrandKitSummary`, `Brief`

**Enum 타입**:
- `TaskType` (image/brochure/ppt/video/copy/strategy)
- `RiskLevel` (low/medium/high)
- `AgentStatus` (success/error/partial)

---

## 3.4 통합 레이어 ✅

이미 1단계에서 완성:
- `app/integrations/ollama_client.py`
- `app/integrations/comfyui_client.py`

---

## 3.5 Celery Tasks ✅

**파일**: `app/tasks/workflow.py`

**Tasks**:
- `execute_workflow_node()` - 단일 노드 실행
- `execute_workflow()` - DAG 전체 실행 (placeholder)

---

# 4. API 엔드포인트

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/` | Root |
| GET | `/health` | 전체 헬스체크 |
| POST | `/api/v1/router/route` | SmartRouter 라우팅 |
| GET | `/api/v1/router/health` | Router 헬스체크 |

---

# 5. B팀이 해야 할 작업

Backend Starter Code는 완성되었지만, B팀이 추가로 구현해야 할 부분:

## 5.1 Database 모델 (SQLAlchemy)

**파일 생성 필요**: `app/models/`

**필요한 모델**:
- `User` - 사용자
- `Brand` - 브랜드
- `Project` - 프로젝트
- `Workflow` - 워크플로우
- `WorkflowNode` - 워크플로우 노드
- `AgentLog` - 에이전트 실행 로그
- `RouterLog` - 라우터 로그
- `Asset` - 생성된 에셋

**참고**: [SYSTEM_IMPROVEMENT_PLAN.md](SYSTEM_IMPROVEMENT_PLAN.md) 섹션 3.4

---

## 5.2 24개 Agent 구현

**파일 생성 필요**: `app/agents/`

**Family 1: Strategy & Brief**:
- `strategist.py` - StrategistAgent
- `brief.py` - BriefAgent

**Family 2: Copy & Template**:
- `copywriter.py` - CopywriterAgent
- `template_matcher.py` - TemplateMatcherAgent

**Family 3: Visual & Video**:
- `vision_generator.py` - VisionGeneratorAgent
- `scene_planner.py` - ScenePlannerAgent
- `video_director.py` - VideoDirectorAgent

**Family 4: Trend & Data Pipeline** (Type B):
- `trend_collector.py` - TrendCollectorAgent
- `data_cleaner.py` - DataCleanerAgent
- `embedder.py` - EmbedderAgent
- `ingestor.py` - IngestorAgent

**Family 5: Brand Learning**:
- `brand_agent.py` - BrandAgent
- `brand_learning.py` - BrandLearningAgent

**Family 6: System Control**:
- `pm_agent.py` - PMAgent
- `security.py` - SecurityAgent
- `budget.py` - BudgetAgent
- `ad_agent.py` - ADAgent (Anomaly Detection)

**Family 7: Router & Infra**:
- `rag.py` - RAGAgent

**Editor & Reviewer**:
- `editor.py` - EditorAgent
- `reviewer.py` - ReviewerAgent
- `strategy_reviewer.py` - StrategyReviewerAgent

**참고**: [AGENT_IO_SCHEMA_CATALOG.md](AGENT_IO_SCHEMA_CATALOG.md)

---

## 5.3 DB 마이그레이션 (Alembic)

**설정 필요**:
1. Alembic 초기화
```bash
cd ~/sparklio_ai_marketing_studio/backend
alembic init alembic
```

2. `alembic.ini` 설정
```ini
sqlalchemy.url = postgresql://sparklio:password@100.123.51.5:5432/sparklio_db
```

3. 마이그레이션 생성
```bash
alembic revision --autogenerate -m "initial tables"
alembic upgrade head
```

---

## 5.4 API 엔드포인트 추가

**파일 생성 필요**: `app/api/v1/`

- `agents.py` - 에이전트 호출 엔드포인트
- `workflow.py` - 워크플로우 관리
- `brands.py` - 브랜드 CRUD
- `projects.py` - 프로젝트 CRUD
- `assets.py` - 에셋 관리

---

## 5.5 인증 및 권한 (Auth)

**파일 생성 필요**: `app/auth/`

- JWT 토큰 발급/검증
- 사용자 로그인/회원가입
- 권한 관리 (RBAC)

---

# 6. 테스트 실행

## 6.1 Import 테스트

```bash
cd ~/sparklio_ai_marketing_studio/backend
source .venv/bin/activate

# Python imports 테스트
python -c "from app.main import app; print('Success')"
python -c "from app.agents.smart_router import get_smart_router; print('Success')"
```

✅ 모두 성공

---

## 6.2 Pytest 실행

```bash
pytest -v
```

**예상 결과**:
- `test_ollama_client.py`: Ollama가 실행 중이면 PASS, 아니면 SKIP
- `test_comfyui_client.py`: ComfyUI가 실행 중이면 PASS, 아니면 SKIP

---

## 6.3 서버 실행 테스트

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

브라우저에서 접속:
- http://100.123.51.5:8000 - Root
- http://100.123.51.5:8000/docs - Swagger UI
- http://100.123.51.5:8000/health - Health check

---

# 7. 개발 가이드

## 7.1 Agent 구현 템플릿

B팀이 새 에이전트를 추가할 때 사용할 템플릿:

```python
"""
{AgentName} Implementation
"""

from app.schemas.common import A2ARequest, A2AResponse, AgentStatus
from app.integrations.ollama_client import get_ollama_client
import logging

logger = logging.getLogger(__name__)


class {AgentName}:
    """
    {AgentName} - {Description}
    """

    def __init__(self, ollama_client=None):
        self.ollama_client = ollama_client or get_ollama_client()

    async def process(self, request: A2ARequest) -> A2AResponse:
        """
        Process A2A request

        Args:
            request: A2ARequest

        Returns:
            A2AResponse
        """
        try:
            logger.info(f"{self.__class__.__name__} processing request: {request.request_id}")

            # 1. Extract payload
            payload = request.payload

            # 2. Call LLM (Ollama)
            response = await self.ollama_client.generate(
                model="qwen2.5-7b",
                prompt=self._build_prompt(payload)
            )

            # 3. Parse response
            result = self._parse_response(response["response"])

            # 4. Return A2AResponse
            return A2AResponse(
                request_id=request.request_id,
                source_agent=self.__class__.__name__,
                status=AgentStatus.SUCCESS,
                result=result,
                metadata={"confidence": 0.9}
            )

        except Exception as e:
            logger.error(f"{self.__class__.__name__} failed: {e}", exc_info=True)
            return A2AResponse(
                request_id=request.request_id,
                source_agent=self.__class__.__name__,
                status=AgentStatus.ERROR,
                error=str(e)
            )

    def _build_prompt(self, payload: dict) -> str:
        """Build LLM prompt"""
        # TODO: Implement
        pass

    def _parse_response(self, llm_response: str) -> dict:
        """Parse LLM response"""
        # TODO: Implement
        pass
```

---

## 7.2 API 엔드포인트 추가 템플릿

```python
from fastapi import APIRouter, HTTPException
from app.agents.{agent_name} import {AgentName}
from app.schemas.common import A2ARequest, A2AResponse

router = APIRouter()


@router.post("/process", response_model=A2AResponse)
async def process_{agent_name}(request: A2ARequest):
    """Process request with {AgentName}"""
    try:
        agent = {AgentName}()
        response = await agent.process(request)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

---

# 8. 다음 단계 (B팀)

1. **Phase 1: Foundation** (1-2주)
   - [ ] DB 모델 생성 (SQLAlchemy)
   - [ ] Alembic 마이그레이션
   - [ ] 기본 CRUD API (Brand, Project)
   - [ ] 인증 시스템 (JWT)

2. **Phase 2: Core Agents** (2-3주)
   - [ ] StrategistAgent 구현
   - [ ] CopywriterAgent 구현
   - [ ] VisionGeneratorAgent 구현
   - [ ] ReviewerAgent 구현
   - [ ] BrandAgent 구현

3. **Phase 3: Workflow Integration** (1-2주)
   - [ ] PMAgent 완전 구현 (DAG 실행)
   - [ ] Workflow API 엔드포인트
   - [ ] Risk-based Review Gate

4. **Phase 4: Monitoring** (1주)
   - [ ] Logging 강화
   - [ ] Superset 대시보드 연동
   - [ ] OpenTelemetry 추가

5. **Phase 5: Advanced** (2-3주)
   - [ ] TrendPipeline (Type B agents)
   - [ ] Video Pipeline
   - [ ] EditorAgent

---

# 9. 결론

**2단계: Backend Starter Code 생성** 완료!

### 달성한 목표
✅ FastAPI 프로젝트 구조
✅ Pydantic 스키마 (A2A, Context)
✅ SmartRouter 구현
✅ API 엔드포인트 기본 골격
✅ 테스트 코드
✅ 개발 가이드

### B팀에게 인계
- 완전한 프로젝트 구조
- 재사용 가능한 통합 레이어
- 명확한 스키마 정의
- Agent 구현 템플릿

---

**작성 완료일**: 2025-11-15
**다음 단계**: B팀 온보딩 및 Phase 1 시작
