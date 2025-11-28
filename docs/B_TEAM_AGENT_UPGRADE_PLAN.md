# Sparklio AI Marketing Studio - 에이전트 시스템 고도화 계획

**작성일**: 2025-11-28
**작성자**: B팀 (Backend)
**상태**: 초안

---

## 1. 배경 - "진정한 에이전트"의 7가지 조건

최신 AI 에이전트 연구에 따르면, 진정한 에이전트는 다음 7가지 조건을 충족해야 합니다:

| 조건 | 설명 |
|------|------|
| 1. 목표 지향적 (Goal-oriented) | 명령이 아닌 목표 기반으로 동작 |
| 2. Plan → Act → Reflect | 계획-실행-검토 루프 |
| 3. 툴 사용 능력 (Tool Use) | 외부 도구 활용 |
| 4. 상태/메모리 관리 | 세션 간 학습 유지 |
| 5. 품질 기준/자기 검수 | 가드레일과 자체 검토 |
| 6. 환경 이해/한계 인식 | 능력 한계 인지 |
| 7. 사람-에이전트 협업 | Human-in-the-Loop |

**핵심 원칙**: LLM은 "두뇌"로만 사용 (20-30%), 나머지 70-80%는 툴/엔진/규칙으로 처리

---

## 2. 현황 분석 - Gap Analysis

### 2.1 조건별 평가표

| 조건 | 현재 수준 | 점수 | 주요 Gap |
|------|----------|------|----------|
| 1. 목표 지향적 | 부분 충족 | 5/10 | 명시적 Goal 객체 부재, 목표 달성 기준 미정의 |
| 2. Plan-Act-Reflect | 미흡 | 3/10 | Act만 수행, Plan/Reflect 단계 없음 |
| 3. 툴 사용 능력 | 양호 | 7/10 | LLM/Media Gateway 통합됨 |
| 4. 상태/메모리 | 부분 충족 | 4/10 | 인메모리만, 세션 간 지속성 미흡 |
| 5. 품질/자기검수 | 부분 충족 | 6/10 | ReviewerAgent 존재, 에이전트별 자기 검수 부재 |
| 6. 환경/한계 인식 | 미흡 | 3/10 | 능력 한계, 불확실성 미인지 |
| 7. 사람 협업 | 부분 충족 | 5/10 | Chat 있으나 명시적 확인 루프 미흡 |

**전체 평균**: 4.7/10

### 2.2 핵심 문제점

#### (A) Plan-Act-Reflect 루프 부재
```python
# 현재 흐름
User Request → Agent.execute() → LLM 호출 → 결과 반환

# 문제점
# - 계획 단계 없음: "어떻게 접근할지" 명시적 계획 미수립
# - 검토 단계 없음: 결과 생성 후 "잘 됐는지" 자체 검토 없음
```

#### (B) 목표-결과 정렬 미확인
- Goal 객체 부재
- 성공 기준 미정의
- 달성 여부 측정 불가

#### (C) 메모리 휘발성
```python
# SelfLearningAgent 상태 - 재시작 시 유실
self.brand_vectors: Dict[str, BrandVector] = {}
self.feedback_history: Dict[str, deque] = {}
```

---

## 3. 우선순위 결정

| 개선 사항 | 영향력 | 난이도 | 우선순위 |
|----------|--------|--------|----------|
| Plan-Act-Reflect 루프 | 매우 높음 | 중간 | **P0** |
| 목표 객체(Goal) 도입 | 높음 | 중간 | **P0** |
| 에이전트별 자기 검수 | 높음 | 낮음 | **P0** |
| 지속적 메모리 (Redis/DB) | 높음 | 중간 | **P1** |
| Human-in-the-Loop 개선 | 중간 | 낮음 | **P1** |
| 환경/한계 인식 | 중간 | 높음 | P2 |
| A2A 프로토콜 | 중간 | 높음 | P2 |

---

## 4. 구체적 고도화 계획

### Phase 1: 즉시 적용 (1-3일)

#### 4.1.1 AgentGoal 객체 도입

**파일**: `app/services/agents/base.py`

```python
from pydantic import BaseModel, Field
from typing import List, Optional

class AgentGoal(BaseModel):
    """에이전트 목표 정의"""
    primary_objective: str = Field(..., description="주 목표")
    success_criteria: List[str] = Field(..., description="성공 기준 목록")
    constraints: List[str] = Field(default_factory=list, description="제약 조건")
    quality_threshold: float = Field(default=7.0, description="최소 품질 점수")

class SelfReview(BaseModel):
    """자기 검수 결과"""
    passed: bool
    score: float  # 0-10
    issues: List[str] = Field(default_factory=list)
    suggestions: List[str] = Field(default_factory=list)
    retry_recommended: bool = False
    iteration: int = 1
```

#### 4.1.2 _reflect() 메서드 추가

**각 에이전트에 추가:**

```python
async def _reflect(self, result: Any, request: AgentRequest) -> SelfReview:
    """자기 검수 - 결과 품질 평가"""
    review_prompt = f"""
    [목표]: {request.payload.get('goal', 'N/A')}
    [생성 결과]: {json.dumps(result, ensure_ascii=False)}

    위 결과 품질을 평가하세요:
    - passed: bool (기준 충족 여부)
    - score: float (0-10)
    - issues: List[str] (발견된 문제)
    - suggestions: List[str] (개선 제안)
    - retry_recommended: bool (재시도 권장)
    """
    # 빠른 모델로 평가
    review_response = await self.llm_gateway.generate(
        role="reviewer",
        task="self_check",
        payload={"prompt": review_prompt},
        override_model="gemini-2.0-flash"
    )
    return SelfReview(**review_response.output.value)
```

#### 4.1.3 ReviewerAgent Guardrails 통합

**ConceptV1.guardrails 검증 추가:**

```python
# ReviewerAgent._build_task_instructions() 수정
"copy_review_with_guardrails": {
    "instruction": """
    **Guardrails 검증** (컨셉 제공 시):
    1. avoid_claims 위반 검사:
       - guardrails.avoid_claims 표현이 카피에 있으면 rejected
    2. must_include 누락 검사:
       - guardrails.must_include 메시지가 없으면 needs_revision
    """
}
```

---

### Phase 2: 단기 (1-2주)

#### 4.2.1 Plan 단계 구현

**PMAgent 확장:**

```python
class ExecutionPlan(BaseModel):
    """에이전트 실행 계획"""
    steps: List[PlanStep]
    estimated_tokens: int
    required_resources: List[str]
    fallback_strategy: Optional[str]
    checkpoints: List[str]  # 중간 검증 포인트

class PlanStep(BaseModel):
    step_id: str
    action: str  # "generate", "validate", "refine", "review"
    agent: str
    input_from: Optional[str]
    success_criteria: List[str]
```

#### 4.2.2 지속적 메모리 - Redis 통합

**SelfLearningAgent 개선:**

```python
async def _save_to_redis(self, key: str, data: dict, ttl: int = 86400):
    """Redis에 상태 저장"""
    await self.redis.setex(
        f"sparklio:agent:{key}",
        ttl,
        json.dumps(data)
    )

async def _load_from_redis(self, key: str) -> Optional[dict]:
    """Redis에서 상태 로드"""
    data = await self.redis.get(f"sparklio:agent:{key}")
    return json.loads(data) if data else None
```

#### 4.2.3 Human-in-the-Loop 개선

**Checkpoint 시스템:**

```python
class CheckpointManager:
    """사람 확인 포인트 관리"""

    CRITICAL_CHECKPOINTS = [
        "concept_approval",      # 컨셉 확정 전
        "copy_final_review",     # 카피 최종 검토
        "guardrails_violation",  # 가드레일 위반 시
        "low_confidence",        # 신뢰도 낮은 결과
    ]

    async def request_human_review(
        self,
        checkpoint: str,
        content: Any,
        timeout_seconds: int = 300
    ) -> HumanReviewResult:
        """사람 검토 요청"""
        # WebSocket으로 프론트엔드에 알림
        await self.notify_frontend(checkpoint, content)
        # 응답 대기 또는 타임아웃
        return await self.wait_for_response(timeout_seconds)
```

---

### Phase 3: 중기 (2-4주)

#### 4.3.1 A2A 프로토콜

**에이전트 간 통신 표준화:**

```python
class A2AMessage(BaseModel):
    """Agent-to-Agent 메시지"""
    message_id: str
    sender: str
    receiver: str
    message_type: Literal["request", "response", "event"]
    payload: Dict[str, Any]
    context: A2AContext

class A2AContext(BaseModel):
    """공유 컨텍스트"""
    conversation_id: str
    project_id: Optional[str]
    concept_id: Optional[str]  # 현재 ConceptV1
    brand_id: Optional[str]
    workflow_id: Optional[str]
```

#### 4.3.2 환경/한계 인식

```python
class AgentEnvironment(BaseModel):
    """에이전트가 인식하는 환경"""
    available_models: List[str]
    rate_limits: Dict[str, int]
    current_load: float
    confidence_calibration: Dict[str, float]
    known_weaknesses: List[str]
```

---

## 5. 에이전트별 개선안

### 5.1 ConceptAgent (v2.0 → v3.0)

| 영역 | 현재 | 개선안 |
|------|------|--------|
| Plan | 없음 | 컨셉 생성 전략 수립 |
| Act | 단일 LLM 호출 | 3단계 (인사이트→전략→컨셉) |
| Reflect | 없음 | 컨셉 일관성 자기 검토 |
| Memory | 없음 | 과거 성공 컨셉 패턴 학습 |

### 5.2 CopywriterAgent

| 영역 | 현재 | 개선안 |
|------|------|--------|
| Plan | 없음 | 채널별 카피 전략 |
| Reflect | Retry만 | Guardrails 위반 자동 감지 |
| Collaboration | ReviewerAgent 의존 | 생성 중 실시간 가드레일 체크 |

### 5.3 ReviewerAgent

| 영역 | 현재 | 개선안 |
|------|------|--------|
| 입력 | Copy만 | Copy + ConceptV1 |
| 평가 | 5점수 | + concept_alignment 점수 |
| 출력 | 승인/수정/거부 | + 수정 버전 제안 |

---

## 6. 아키텍처 개선

### 6.1 Gateway 패턴 강화

```
현재:
Agent → LLM Gateway → Provider

개선:
Agent → Agent Gateway → Tool Registry → [LLM, Media, DB, External]
```

### 6.2 Vector DB 활용 확대

| 용도 | 현재 | 개선 |
|------|------|------|
| 브랜드 학습 | 인메모리 | pgvector 저장 |
| 컨셉 검색 | 없음 | 유사 컨셉 검색 |
| 카피 품질 | 없음 | 고품질 레퍼런스 |

---

## 7. 구현 로드맵

### Phase 1 (1-3일) - P0
- [ ] AgentGoal, SelfReview 클래스 정의
- [ ] base.py에 _reflect() 추상 메서드 추가
- [ ] ConceptAgent에 Plan-Act-Reflect 적용
- [ ] ReviewerAgent에 guardrails 검증 추가

### Phase 2 (1-2주) - P1
- [ ] PMAgent 워크플로우 계획 고도화
- [ ] Redis 연동 (메모리 지속화)
- [ ] CheckpointManager 구현
- [ ] CopywriterAgent Plan 단계 추가

### Phase 3 (2-4주) - P2
- [ ] A2A 프로토콜 설계/구현
- [ ] AgentEnvironment 구현
- [ ] RAG 시스템 강화
- [ ] 성능 모니터링 대시보드

---

## 8. 예상 효과

| 지표 | 현재 | 목표 |
|------|------|------|
| 목표 달성률 | 측정 불가 | 85%+ |
| 품질 일관성 | 변동 큼 | 50% 개선 |
| 재작업률 | ~30% | 15% 이하 |
| 가드레일 위반 | 측정 불가 | 5% 이하 |

---

## 9. 핵심 파일

- `app/services/agents/base.py` - AgentGoal, SelfReview 추가
- `app/services/agents/concept.py` - Plan-Act-Reflect 적용
- `app/services/agents/reviewer.py` - Guardrails 통합
- `app/services/agents/pm.py` - 워크플로우 계획
- `app/services/agents/self_learning.py` - Redis 연동
