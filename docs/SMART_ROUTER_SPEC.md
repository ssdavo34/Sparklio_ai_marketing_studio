# SMART_ROUTER_SPEC.md
Sparklio V4 — SmartRouter 구현 사양서
작성일: 2025-11-15
작성자: A팀 (Infrastructure Team)

---

# 1. 목적

SmartRouter는 Sparklio의 **중앙 라우팅 엔진**입니다.
사용자 요청을 분석하여 적절한 에이전트를 선택하고, 최적의 LLM 모델을 선택하며,
Context를 최소화하여 효율적인 A2A 통신을 보장합니다.

---

# 2. SmartRouter의 역할

## 2.1 핵심 책임
1. **Intent Classification**: 사용자 요청 의도 분류
2. **Agent Selection**: 적합한 에이전트 선택 (24개 에이전트 중)
3. **Model Selection**: 최적 LLM 모델 선택 (Qwen, Llama, Gemini, etc.)
4. **Context Minimization**: 불필요한 컨텍스트 제거
5. **Risk Assessment**: 요청의 위험도 평가 (low/medium/high)

## 2.2 SmartRouter vs PMAgent
- **SmartRouter**: 단일 요청 내에서 어느 에이전트를 호출할지 결정
- **PMAgent**: 복잡한 워크플로우를 DAG로 계획하고 실행

**예시**:
- "브랜드 색상 알려줘" → SmartRouter → BrandAgent (단일 호출)
- "SNS 이미지 10개 만들어줘" → PMAgent → DAG 실행 (복합 워크플로우)

---

# 3. 입출력 스키마

## 3.1 Input Schema

```python
from pydantic import BaseModel
from typing import Optional, Dict, Any

class RouterRequest(BaseModel):
    user_id: str
    request_text: str
    brand_id: Optional[str] = None
    project_id: Optional[str] = None
    context: Optional[Dict[str, Any]] = None
    force_model: Optional[str] = None  # 모델 강제 지정 (테스트용)
```

**예시**:
```json
{
  "user_id": "user_123",
  "request_text": "프리미엄 브랜드 이미지에 맞는 카피를 작성해줘",
  "brand_id": "brand_456",
  "project_id": "project_789"
}
```

---

## 3.2 Output Schema

```python
class RouterResponse(BaseModel):
    target_agent: str
    selected_model: str
    risk_level: str  # "low" | "medium" | "high"
    minimized_context: Dict[str, Any]
    routing_metadata: Dict[str, Any]
```

**예시**:
```json
{
  "target_agent": "CopywriterAgent",
  "selected_model": "qwen2.5-14b",
  "risk_level": "medium",
  "minimized_context": {
    "brand_id": "brand_456",
    "brandkit_summary": {...},
    "tone": "premium"
  },
  "routing_metadata": {
    "confidence": 0.92,
    "intent": "copywriting",
    "reasoning": "Detected premium tone requirement"
  }
}
```

---

# 4. Intent Classification (의도 분류)

## 4.1 지원하는 Intent 목록

| Intent | 설명 | Target Agent(s) |
|--------|------|-----------------|
| brand_query | 브랜드 정보 조회 | BrandAgent |
| copywriting | 카피 작성 | CopywriterAgent |
| visual_generation | 이미지/비주얼 생성 | VisionGeneratorAgent |
| template_selection | 템플릿 선택 | TemplateMatcherAgent |
| editing | 에디터 수정 | EditorAgent |
| strategy | 전략 수립 | StrategistAgent |
| brief_creation | 브리프 생성 | BriefAgent |
| complex_workflow | 복합 작업 | PMAgent |
| trend_query | 트렌드 조회 | RAGAgent |
| unknown | 의도 불명 | PMAgent (fallback) |

---

## 4.2 Intent Classification 알고리즘

### 방법 1: 키워드 기반 (빠름, 낮은 정확도)
```python
INTENT_KEYWORDS = {
    "copywriting": ["카피", "문구", "헤드라인", "슬로건", "작성"],
    "visual_generation": ["이미지", "비주얼", "그래픽", "디자인", "만들어"],
    "brand_query": ["브랜드", "색상", "폰트", "톤"],
    "editing": ["수정", "바꿔", "변경", "편집"],
}

def classify_by_keywords(text: str) -> str:
    for intent, keywords in INTENT_KEYWORDS.items():
        if any(kw in text for kw in keywords):
            return intent
    return "unknown"
```

### 방법 2: LLM 기반 (느림, 높은 정확도)
```python
async def classify_by_llm(text: str, llm_client) -> str:
    prompt = f"""
    Classify the following user request into one of these intents:
    - brand_query
    - copywriting
    - visual_generation
    - template_selection
    - editing
    - strategy
    - brief_creation
    - complex_workflow
    - trend_query
    - unknown

    User request: "{text}"

    Intent:
    """
    response = await llm_client.generate(prompt)
    return response.strip()
```

### 방법 3: Hybrid (추천)
1. 먼저 키워드 기반으로 빠르게 필터링
2. 신뢰도가 낮으면 LLM으로 재분류

---

# 5. Agent Selection (에이전트 선택)

## 5.1 선택 규칙 테이블

| Intent | Primary Agent | Fallback Agent |
|--------|---------------|----------------|
| brand_query | BrandAgent | RAGAgent |
| copywriting | CopywriterAgent | PMAgent |
| visual_generation | VisionGeneratorAgent | PMAgent |
| template_selection | TemplateMatcherAgent | VisionGeneratorAgent |
| editing | EditorAgent | - |
| strategy | StrategistAgent | PMAgent |
| brief_creation | BriefAgent | PMAgent |
| complex_workflow | PMAgent | - |
| trend_query | RAGAgent | - |
| unknown | PMAgent | - |

---

## 5.2 선택 로직 (Pseudo-code)

```python
def select_agent(intent: str, context: dict) -> str:
    # Type B 에이전트는 라우팅 대상에서 제외
    TYPE_B_AGENTS = ["TrendCollectorAgent", "DataCleanerAgent", "EmbedderAgent", "IngestorAgent"]

    if intent == "complex_workflow":
        return "PMAgent"

    agent_map = {
        "brand_query": "BrandAgent",
        "copywriting": "CopywriterAgent",
        "visual_generation": "VisionGeneratorAgent",
        "editing": "EditorAgent",
        # ... (위 테이블 참조)
    }

    agent = agent_map.get(intent, "PMAgent")

    # Type B 에이전트 필터링
    if agent in TYPE_B_AGENTS:
        return "PMAgent"

    return agent
```

---

# 6. Model Selection (모델 선택)

## 6.1 사용 가능한 모델 목록

| 모델 | 크기 | 속도 | 품질 | 비용 | 용도 |
|------|------|------|------|------|------|
| qwen2.5-7b | 7B | 빠름 | 중간 | 무료 | 일반 작업 |
| qwen2.5-14b | 14B | 중간 | 높음 | 무료 | 고품질 작업 |
| llama3.2-3b | 3B | 매우 빠름 | 낮음 | 무료 | 간단한 작업 |
| mistral-small | 7B | 빠름 | 중간 | 무료 | 코드 생성 |
| gemini-1.5-pro | 대형 | 느림 | 매우 높음 | 유료 | 전략/복잡한 작업 |
| gpt-4 | 대형 | 느림 | 최고 | 비싸음 | 최종 검토 |

---

## 6.2 모델 선택 알고리즘

### 6.2.1 에이전트별 기본 모델

```python
AGENT_DEFAULT_MODELS = {
    "StrategistAgent": "qwen2.5-14b",      # 전략은 고품질 필요
    "CopywriterAgent": "qwen2.5-14b",      # 카피도 고품질
    "VisionGeneratorAgent": "qwen2.5-7b",  # 프롬프트 생성은 중간 품질
    "BrandAgent": "qwen2.5-7b",            # 브랜드 정보는 빠르게
    "EditorAgent": "qwen2.5-7b",           # 편집 명령은 빠르게
    "ReviewerAgent": "qwen2.5-14b",        # 검토는 고품질
    "PMAgent": "qwen2.5-14b",              # 계획은 고품질
}
```

---

### 6.2.2 Risk Level 기반 모델 선택

```python
def select_model_by_risk(agent: str, risk_level: str) -> str:
    default_model = AGENT_DEFAULT_MODELS.get(agent, "qwen2.5-7b")

    if risk_level == "high":
        # 고위험 작업은 최고 품질 모델 사용
        return "qwen2.5-14b"
    elif risk_level == "medium":
        return default_model
    else:  # low
        # 저위험 작업은 빠른 모델 사용
        return "qwen2.5-7b"
```

---

### 6.2.3 Context Size 기반 모델 선택

```python
def select_model_by_context_size(context_size: int) -> str:
    if context_size > 10000:  # 10KB 이상
        # 큰 컨텍스트는 대형 모델 필요
        return "qwen2.5-14b"
    elif context_size > 5000:
        return "qwen2.5-7b"
    else:
        return "llama3.2-3b"  # 작은 컨텍스트는 작은 모델로 충분
```

---

## 6.3 최종 모델 선택 로직 (통합)

```python
def select_model(agent: str, risk_level: str, context: dict) -> str:
    # 1. 기본 모델 선택
    default_model = AGENT_DEFAULT_MODELS.get(agent, "qwen2.5-7b")

    # 2. Risk Level 조정
    if risk_level == "high":
        return "qwen2.5-14b"

    # 3. Context Size 고려
    context_size = len(json.dumps(context).encode('utf-8'))
    if context_size > 10000:
        return "qwen2.5-14b"

    # 4. 에이전트 타입 고려
    if agent in ["StrategistAgent", "ReviewerAgent", "PMAgent"]:
        return "qwen2.5-14b"  # 항상 고품질

    return default_model
```

---

# 7. Context Minimization (컨텍스트 최소화)

## 7.1 4-Layer Context Model

SmartRouter는 Context Engineering Framework의 4-Layer 모델을 따릅니다.

1. **System Context** (항상 전송)
2. **Task Context** (필요한 부분만)
3. **Working Memory** (최근 2-3개만)
4. **Ephemeral Context** (거의 제거)

---

## 7.2 에이전트별 필요 Context 매핑

```python
AGENT_CONTEXT_REQUIREMENTS = {
    "BrandAgent": ["brand_id", "brandkit"],
    "CopywriterAgent": ["brand_id", "brandkit_summary", "brief", "tone"],
    "VisionGeneratorAgent": ["brand_id", "brandkit_summary", "brief", "style"],
    "EditorAgent": ["canvas", "command", "editor_rules"],
    "StrategistAgent": ["brand_id", "brandkit", "brief", "market_data"],
    "PMAgent": ["full_context"],  # PMAgent는 전체 컨텍스트 필요
}
```

---

## 7.3 Minimization 알고리즘

```python
def minimize_context(full_context: dict, target_agent: str) -> dict:
    required_fields = AGENT_CONTEXT_REQUIREMENTS.get(target_agent, [])

    minimized = {}
    for field in required_fields:
        if field in full_context:
            minimized[field] = full_context[field]

    # BrandKit 요약 (전체 대신 요약본만)
    if "brandkit" in minimized and target_agent != "BrandAgent":
        minimized["brandkit_summary"] = {
            "primary_color": minimized["brandkit"]["colors"]["primary"],
            "font": minimized["brandkit"]["typography"]["primary_font"],
            "tone": minimized["brandkit"]["tone"],
        }
        del minimized["brandkit"]

    return minimized
```

---

## 7.4 예상 효과

SYSTEM_IMPROVEMENT_PLAN.md에서 제시한 목표:
- **Before**: 평균 15KB
- **After**: 평균 8KB
- **Reduction**: 47%

---

# 8. Risk Assessment (위험도 평가)

## 8.1 Risk Level 정의

| Risk Level | 설명 | 예시 | 조치 |
|------------|------|------|------|
| low | 단순 조회, 정보 요청 | "브랜드 색상 알려줘" | 빠른 모델, 단일 에이전트 |
| medium | 일반 생성 작업 | "SNS 이미지 1개 만들어줘" | 기본 모델, 검토 생략 가능 |
| high | 대규모 캠페인, 중요 작업 | "런칭 캠페인 전체 기획" | 최고 품질 모델, Strategy Review Gate |

---

## 8.2 Risk Assessment 알고리즘

```python
def assess_risk(request_text: str, context: dict) -> str:
    # 1. 키워드 기반 판단
    high_risk_keywords = ["캠페인", "런칭", "전체", "브랜드 리뉴얼"]
    if any(kw in request_text for kw in high_risk_keywords):
        return "high"

    # 2. 수량 기반 판단
    if "10개" in request_text or "100개" in request_text:
        return "high"

    # 3. 예산 기반 판단
    if context.get("budget", 0) > 1000000:  # 100만원 이상
        return "high"

    # 4. Intent 기반 판단
    if context.get("intent") in ["strategy", "complex_workflow"]:
        return "medium"

    return "low"
```

---

# 9. SmartRouter 전체 구현

## 9.1 클래스 구조

```python
from typing import Dict, Any
import json

class SmartRouter:
    def __init__(self, llm_client):
        self.llm_client = llm_client

    async def route(self, request: RouterRequest) -> RouterResponse:
        # 1. Intent Classification
        intent = await self._classify_intent(request.request_text)

        # 2. Risk Assessment
        risk_level = self._assess_risk(request.request_text, request.context or {})

        # 3. Agent Selection
        target_agent = self._select_agent(intent)

        # 4. Model Selection
        selected_model = self._select_model(target_agent, risk_level, request.context or {})

        # 5. Context Minimization
        minimized_context = self._minimize_context(request.context or {}, target_agent)

        # 6. Build Response
        return RouterResponse(
            target_agent=target_agent,
            selected_model=selected_model,
            risk_level=risk_level,
            minimized_context=minimized_context,
            routing_metadata={
                "intent": intent,
                "confidence": 0.9,  # 실제로는 분류 신뢰도
                "reasoning": f"Classified as {intent}, routed to {target_agent}"
            }
        )

    async def _classify_intent(self, text: str) -> str:
        # Hybrid 방식 (키워드 + LLM)
        # (앞의 4.2.3 참조)
        pass

    def _assess_risk(self, text: str, context: dict) -> str:
        # (8.2 참조)
        pass

    def _select_agent(self, intent: str) -> str:
        # (5.2 참조)
        pass

    def _select_model(self, agent: str, risk_level: str, context: dict) -> str:
        # (6.3 참조)
        pass

    def _minimize_context(self, context: dict, agent: str) -> dict:
        # (7.3 참조)
        pass
```

---

## 9.2 FastAPI 엔드포인트

```python
from fastapi import APIRouter
from app.routers.smart_router import SmartRouter
from app.integrations.ollama_client import OllamaClient

router = APIRouter()
ollama_client = OllamaClient()
smart_router = SmartRouter(ollama_client)

@router.post("/route")
async def route_request(request: RouterRequest) -> RouterResponse:
    return await smart_router.route(request)
```

---

# 10. 에러 처리 및 폴백

## 10.1 에러 시나리오

1. **Intent 분류 실패**: "unknown" intent → PMAgent로 폴백
2. **에이전트 선택 실패**: PMAgent로 폴백
3. **모델 선택 실패**: 기본 모델 (qwen2.5-7b) 사용
4. **Context 최소화 실패**: 전체 컨텍스트 전송

---

## 10.2 폴백 로직

```python
try:
    intent = await self._classify_intent(request.request_text)
except Exception as e:
    logger.error(f"Intent classification failed: {e}")
    intent = "unknown"

try:
    target_agent = self._select_agent(intent)
except Exception as e:
    logger.error(f"Agent selection failed: {e}")
    target_agent = "PMAgent"  # 폴백
```

---

# 11. 성능 최적화

## 11.1 캐싱 전략

```python
from functools import lru_cache

@lru_cache(maxsize=1000)
def classify_by_keywords_cached(text: str) -> str:
    # 키워드 분류는 캐싱 가능
    return classify_by_keywords(text)
```

---

## 11.2 비동기 처리

```python
import asyncio

async def route_batch(requests: list[RouterRequest]) -> list[RouterResponse]:
    tasks = [smart_router.route(req) for req in requests]
    return await asyncio.gather(*tasks)
```

---

# 12. 모니터링 및 로깅

## 12.1 로깅 포맷

```python
import logging

logger = logging.getLogger("SmartRouter")

async def route(self, request: RouterRequest) -> RouterResponse:
    logger.info(f"Routing request: user={request.user_id}, text={request.request_text[:50]}...")

    response = await self._route_internal(request)

    logger.info(f"Routed to: {response.target_agent}, model={response.selected_model}, risk={response.risk_level}")

    return response
```

---

## 12.2 Superset 대시보드 연동

SmartRouter는 다음 메트릭을 `router_logs` 테이블에 저장:

| 컬럼 | 설명 |
|------|------|
| user_id | 사용자 ID |
| request_text | 요청 텍스트 (첫 100자) |
| intent | 분류된 의도 |
| target_agent | 선택된 에이전트 |
| selected_model | 선택된 모델 |
| risk_level | 위험도 |
| latency_ms | 라우팅 소요 시간 |
| created_at | 타임스탬프 |

---

# 13. 테스트 케이스

## 13.1 단위 테스트

```python
import pytest
from app.routers.smart_router import SmartRouter

@pytest.mark.asyncio
async def test_route_copywriting():
    router = SmartRouter(mock_llm_client)

    request = RouterRequest(
        user_id="test_user",
        request_text="프리미엄 브랜드 카피 작성해줘",
        brand_id="test_brand"
    )

    response = await router.route(request)

    assert response.target_agent == "CopywriterAgent"
    assert response.risk_level in ["low", "medium"]
```

---

## 13.2 통합 테스트

```python
@pytest.mark.asyncio
async def test_route_end_to_end():
    # 실제 Ollama와 연동하여 테스트
    router = SmartRouter(real_ollama_client)

    request = RouterRequest(
        user_id="test_user",
        request_text="런칭 캠페인 전체 기획해줘",
        brand_id="test_brand"
    )

    response = await router.route(request)

    assert response.target_agent == "PMAgent"
    assert response.risk_level == "high"
    assert response.selected_model == "qwen2.5-14b"
```

---

# 14. 다음 단계

SmartRouter 구현 후 다음 문서를 작성해야 합니다:

1. **AGENT_IO_SCHEMA_CATALOG.md**: 24개 에이전트 전체 입출력 스키마
2. **PMAgent 구현**: WorkflowSpec DAG 실행
3. **Ollama 통합 레이어**: `app/integrations/ollama_client.py`

---

**작성 완료일**: 2025-11-15
**다음 문서**: AGENT_IO_SCHEMA_CATALOG.md
