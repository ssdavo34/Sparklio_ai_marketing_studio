# Sparklio AI Marketing Studio - 시스템 개선 계획서

**작성일**: 2025-11-15
**작성자**: A Team Leader
**기반 문서**: Agent 정의 문서 9개 종합 검토
**목적**: Multi-Agent 아키텍처 통합 및 운영 최적화

---

## 목차

1. [종합 검토 결과](#1-종합-검토-결과)
2. [핵심 개선사항](#2-핵심-개선사항)
3. [시스템 아키텍처 강화](#3-시스템-아키텍처-강화)
4. [모니터링 및 관리 시스템](#4-모니터링-및-관리-시스템)
5. [구현 로드맵](#5-구현-로드맵)
6. [기대 효과](#6-기대-효과)

---

## 1. 종합 검토 결과

### 1.1 검토 문서 목록

다음 9개 Agent 정의 문서를 종합 검토했습니다:

1. **Multi-Agent A2A System Specification v2.1**
   - 24개 Agent 정의
   - Type A/B/C 분류 (LLM Conversational / Pipeline Service / System Control)
   - 7개 Agent Family 구조
   - A2A 프로토콜 표준화

2. **Gemini 검토 의견 (GPT 분석)**
   - PMAgent 복잡성 관리 필요
   - Latency 최적화 (병렬화 + 비동기)
   - Agent vs Tool 구분 명확화
   - 전략 오류 전파 방지

3. **v2.2 헤더 교체용 (Planner/Executor 분리)**
   - PMAgent → PlanBuilder + PlanExecutor
   - DAG 기반 워크플로우
   - Risk-based Strategy Review
   - Latency & UX 정책

4. **워크플로우 스펙 (Pydantic & PMAgent 골격)**
   - WorkflowSpec / WorkflowNode / WorkflowEdge
   - Celery 기반 실행 모델
   - 재시도 / 백오프 정책

5. **AGENT_CONTEXT_SPEC.md**
   - 4-Layer Context 모델 (System / Task / Working Memory / Ephemeral)
   - Agent별 컨텍스트 명세
   - A2A Context Exchange 표준

6. **CONTEXT_ROUTING_POLICY.md**
   - SmartRouter 라우팅 규칙
   - Context Layer 우선순위
   - Context Minimization 정책

7. **EDITOR_CONTEXT_MODEL.md**
   - CanvasContext / CommandContext / EditorRules / HistoryContext
   - Action Model (12개 카테고리)
   - Natural Language → Action Parsing

8. **CONTEXT_ENGINEERING_FRAMEWORK.md**
   - 전사적 Context 관리 원칙
   - Context Propagation / Lifecycle
   - TrendPipeline & Brand Learning 통합

9. **Superset 대시보드 설계 템플릿**
   - 8개 메가 대시보드
   - 32개 핵심 KPI
   - DB 테이블 구조 권장안

### 1.2 핵심 발견사항

#### ✅ **강점**
- 체계적인 Multi-Agent 설계 (24개 Agent, 명확한 역할 분리)
- Type-based 분류로 실시간/배치 작업 구분
- A2A 프로토콜 표준화
- Context Engineering 철학 명확

#### ⚠️ **개선 필요**
- **PMAgent 복잡도**: 단일 Agent가 계획 + 실행 모두 담당 → 분리 필요
- **Latency 문제**: 순차 실행 기반 → 병렬화 + 비동기 필요
- **Type B Agent**: 실시간 플로우에 불필요하게 포함 → 배치 전용으로 격리
- **전략 오류 전파**: Strategist 실패 시 전체 실패 → Review Gate 필요
- **모니터링 부재**: 현재 시스템에 Observability 인프라 없음

---

## 2. 핵심 개선사항

### 2.1 PMAgent 아키텍처 강화

**현재 문제**:
- PMAgent가 "계획 + 실행 + 모니터링" 모두 담당
- 복잡도 증가로 유지보수 어려움

**개선안**:

```python
# PMAgent를 2개 컴포넌트로 분리

class PMAgent:
    def __init__(self):
        self.planner = PlanBuilder()      # 계획 수립
        self.executor = PlanExecutor()    # 실행 및 모니터링

    async def process_request(self, user_request, context):
        # 1단계: Plan 생성
        workflow_spec = await self.planner.build(user_request, context)

        # 2단계: Risk 평가 및 Review Gate 삽입
        if workflow_spec.context.risk_level == "high":
            workflow_spec = self._inject_strategy_review(workflow_spec)

        # 3단계: 실행
        job_id = await self.executor.execute(workflow_spec)

        return {"job_id": job_id, "status": "accepted"}
```

**구조**:
```
PMAgent (Coordinator)
├── PlanBuilder (Planner)
│   ├── Risk Assessment
│   ├── DAG Generation
│   └── Pre-check (Budget, Security)
└── PlanExecutor (Orchestrator)
    ├── Celery Task Distribution
    ├── Dependency Management
    └── Error Handling
```

**이점**:
- ✅ 단일 책임 원칙 준수
- ✅ 테스트 용이성 향상
- ✅ 계획과 실행을 독립적으로 최적화 가능

---

### 2.2 Workflow DAG 기반 실행 모델

**핵심**: 순차 실행 → DAG 기반 병렬 실행

**변경 전** (순차):
```
Strategist (3s) → Copywriter (5s) → VisionGenerator (10s) → Reviewer (3s) → Template (2s)
총 소요시간: 23초
```

**변경 후** (병렬):
```
Strategist (3s)
    ├─→ Copywriter (5s) ─┐
    └─→ VisionGenerator (10s) ─┤
                                ├─→ Reviewer (3s) → Template (2s)
총 소요시간: 18초 (22% 개선)
```

**WorkflowSpec JSON 예시**:
```json
{
  "workflow_id": "uuid",
  "name": "presentation_generation",
  "context": {
    "brand_id": "uuid",
    "risk_level": "low",
    "priority": "P1"
  },
  "nodes": [
    {
      "id": "node_strategist",
      "agent": "StrategistAgent",
      "type": "llm",
      "async": true,
      "depends_on": []
    },
    {
      "id": "node_copywriter",
      "agent": "CopywriterAgent",
      "type": "llm",
      "async": true,
      "depends_on": ["node_strategist"]
    },
    {
      "id": "node_vision",
      "agent": "VisionGeneratorAgent",
      "type": "llm",
      "async": true,
      "depends_on": ["node_strategist"]
    },
    {
      "id": "node_reviewer",
      "agent": "ReviewerAgent",
      "type": "llm",
      "async": true,
      "depends_on": ["node_copywriter", "node_vision"]
    }
  ]
}
```

---

### 2.3 Risk-based Strategy Review Flow

**문제**:
- Strategist가 잘못된 전략 제시 → 나머지 Agent가 잘못된 결과물 대량 생성
- 비용 + 시간 낭비

**해결**:

**Risk Level 계산**:
```python
def calculate_risk_level(context):
    budget = context.get("budget", 0)
    importance = context.get("importance", "normal")
    channels = context.get("channels", [])

    # High risk 조건
    if budget >= 10_000_000:
        return "high"
    if importance == "critical":
        return "high"
    if "tv" in channels or "main_portal" in channels:
        return "high"

    # Medium risk 조건
    if budget >= 3_000_000:
        return "medium"

    return "low"
```

**High-Risk 플로우**:
```
User Request
    ↓
PMAgent (risk_level = high 판정)
    ↓
StrategistAgent (전략 수립)
    ↓
[Strategy Review Gate] ← 🔥 NEW
    ├─ Human Approval (중요 캠페인)
    └─ StrategyReviewerAgent (자동 검증)
    ↓ (승인 시)
CopywriterAgent + VisionGeneratorAgent (병렬)
    ↓
...
```

**이점**:
- ✅ 중요 캠페인 품질 보장
- ✅ 저위험 작업은 기존대로 빠르게 처리
- ✅ 오류 조기 차단 (Fail Fast)

---

### 2.4 Context Engineering 체계화

**4-Layer Context Model 적용**:

```python
# 모든 Agent가 공통으로 사용하는 Context 구조

class SparkलioContext(BaseModel):
    # Layer 1: System Context (불변)
    system: SystemContext = Field(...)

    # Layer 2: Task Context (작업 목표)
    task: TaskContext = Field(...)

    # Layer 3: Working Memory (중간 결과)
    working_memory: WorkingMemory = Field(default_factory=dict)

    # Layer 4: Ephemeral Context (임시)
    ephemeral: EphemeralContext = Field(default_factory=dict)

class SystemContext(BaseModel):
    brand_id: UUID
    project_id: Optional[UUID]
    task_type: str  # "presentation" / "brochure" / "video"
    risk_level: RiskLevel
    guardrails: List[str]  # 금지 규칙

class TaskContext(BaseModel):
    brief: Dict[str, Any]
    brandkit_summary: Dict[str, Any]  # 전체가 아닌 요약본만
    user_instructions: str
    quality_gate: Dict[str, Any]

class WorkingMemory(BaseModel):
    previous_outputs: List[Dict[str, Any]]  # 최근 2~3개만
    style_selections: Dict[str, Any]
    decisions: List[Dict[str, Any]]

class EphemeralContext(BaseModel):
    recent_conversation: List[str]  # 최근 3~5턴
    temp_settings: Dict[str, Any]
```

**Context Minimization 원칙**:
```python
# ❌ 잘못된 예: 모든 정보를 다음 Agent에 전달
next_agent_context = {
    "full_brandkit": brandkit,  # 10MB
    "all_history": history,      # 5MB
    "entire_conversation": conversation  # 2MB
}

# ✅ 올바른 예: 필요한 정보만 전달
next_agent_context = {
    "brandkit_summary": {
        "colors": brandkit.colors[:3],  # 메인 3개만
        "fonts": brandkit.fonts[:2],
        "tone": brandkit.tone
    },
    "last_output": working_memory.previous_outputs[-1],
    "user_intent": task.user_instructions
}
```

---

### 2.5 Type B Agent 격리 (Pipeline Service)

**문제**:
- TrendCollector, DataCleaner, Embedder 등 Type B Agent가 실시간 플로우에 혼재
- SmartRouter가 불필요하게 Type B를 라우팅 후보로 고려

**해결**:

**명확한 구분**:
```python
# Type A: LLM Conversational (실시간 대화형)
TYPE_A_AGENTS = [
    "StrategistAgent",
    "CopywriterAgent",
    "VisionGeneratorAgent",
    "ReviewerAgent",
    "TrendAgent"
]

# Type B: Pipeline Service (배치 전용)
TYPE_B_AGENTS = [
    "TrendCollectorAgent",
    "DataCleanerAgent",
    "EmbedderAgent",
    "IngestorAgent",
    "RAGAgent"
]

# Type C: System Control
TYPE_C_AGENTS = [
    "PMAgent",
    "SecurityAgent",
    "BudgetAgent",
    "ADAgent"
]

# SmartRouter는 Type A + Type C만 라우팅 대상으로 사용
class SmartRouter:
    def route(self, user_intent):
        # Type B는 절대 선택 안 됨
        candidates = TYPE_A_AGENTS + TYPE_C_AGENTS
        return self._select_best(user_intent, candidates)
```

**Type B는 Cron/Celery Beat로 독립 실행**:
```python
# TrendPipeline은 매일 자정에 자동 실행 (사용자 요청과 무관)
@app.task
@periodic_task(run_every=crontab(hour=0, minute=0))
def run_trend_pipeline():
    """
    배치 파이프라인: TrendCollector → DataCleaner → Embedder → Ingestor
    """
    results = {}

    # 1. 수집
    collected = TrendCollectorAgent().collect()
    results['collected'] = len(collected)

    # 2. 정제
    cleaned = DataCleanerAgent().clean(collected)
    results['cleaned'] = len(cleaned)

    # 3. 임베딩
    embedded = EmbedderAgent().embed(cleaned)
    results['embedded'] = len(embedded)

    # 4. 저장
    IngestorAgent().ingest(embedded)

    logger.info(f"TrendPipeline completed: {results}")
```

---

## 3. 시스템 아키텍처 강화

### 3.1 전체 아키텍처 개선안

**현재 (A팀 완료 상태)**:
```
3-Node Infrastructure
├── Desktop (100.120.180.42): Ollama, ComfyUI
├── Mac mini (100.123.51.5): PostgreSQL, Redis, MinIO, FastAPI
└── Laptop (100.101.68.23): Next.js

Backend Structure
├── app/
│   ├── main.py
│   ├── core/ (config, database)
│   ├── models/ (asset.py)
│   ├── schemas/ (asset.py)
│   ├── services/ (storage.py)
│   └── api/v1/endpoints/ (assets.py)
```

**개선 후 (Multi-Agent 통합)**:
```
3-Node Infrastructure (동일)

Backend Structure
├── app/
│   ├── main.py
│   ├── core/
│   │   ├── config.py
│   │   ├── database.py
│   │   └── context.py  # 🆕 4-Layer Context Model
│   ├── models/
│   │   ├── asset.py
│   │   ├── workflow.py  # 🆕 WorkflowSpec
│   │   └── agent_log.py  # 🆕 Agent 실행 로그
│   ├── schemas/
│   │   ├── asset.py
│   │   └── context.py  # 🆕 SparkलioContext
│   ├── services/
│   │   ├── storage.py
│   │   └── smart_router.py  # 🆕 Agent 라우팅
│   ├── agents/  # 🆕 Agent 디렉토리
│   │   ├── base_agent.py
│   │   ├── pm_agent.py  # Planner + Executor
│   │   ├── strategist_agent.py
│   │   ├── copywriter_agent.py
│   │   ├── vision_generator_agent.py
│   │   ├── reviewer_agent.py
│   │   └── workflow_executor.py  # Celery 기반 실행
│   ├── pipelines/  # 🆕 Type B (배치 전용)
│   │   ├── trend_collector.py
│   │   ├── data_cleaner.py
│   │   ├── embedder.py
│   │   └── ingestor.py
│   └── api/v1/endpoints/
│       ├── assets.py
│       ├── workflows.py  # 🆕 워크플로우 API
│       └── agents.py  # 🆕 Agent 직접 호출 API
```

---

### 3.2 Database Schema 확장

**추가 테이블**:

```sql
-- 1. Workflow 실행 이력
CREATE TABLE workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    status VARCHAR(20),  -- 'running', 'success', 'failed'
    context JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    INDEX idx_workflow_id (workflow_id),
    INDEX idx_status (status)
);

-- 2. Agent 실행 로그
CREATE TABLE agent_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id VARCHAR(255),
    agent_name VARCHAR(100),
    node_id VARCHAR(100),
    input_context JSONB,
    output_result JSONB,
    status VARCHAR(20),
    latency_ms INT,
    tokens_used INT,
    cost DECIMAL(10, 6),
    model VARCHAR(50),
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    INDEX idx_workflow_id (workflow_id),
    INDEX idx_agent_name (agent_name),
    INDEX idx_created_at (created_at)
);

-- 3. Context 전파 추적
CREATE TABLE context_traces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id VARCHAR(255),
    source_agent VARCHAR(100),
    target_agent VARCHAR(100),
    context_size_kb INT,
    layer_breakdown JSONB,  -- {system: 2kb, task: 5kb, working: 1kb}
    created_at TIMESTAMP DEFAULT NOW()
);

-- 4. TrendPipeline 실행 로그
CREATE TABLE trendpipeline_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stage VARCHAR(50),  -- 'collector', 'cleaner', 'embedder', 'ingestor'
    volume INT,
    success_count INT,
    fail_count INT,
    latency_ms INT,
    created_at TIMESTAMP DEFAULT NOW(),
    INDEX idx_stage (stage),
    INDEX idx_created_at (created_at)
);

-- 5. Editor 사용 로그
CREATE TABLE editor_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    event_type VARCHAR(50),  -- 'add', 'delete', 'update', 'natural_command'
    object_id VARCHAR(100),
    command_text TEXT,
    llm_result VARCHAR(20),  -- 'success', 'fail'
    created_at TIMESTAMP DEFAULT NOW(),
    INDEX idx_user_id (user_id),
    INDEX idx_event_type (event_type)
);
```

---

## 4. 모니터링 및 관리 시스템

### 4.1 Superset 대시보드 구성

**8개 메가 대시보드** (Agent 정의 문서 009 기반):

#### Dashboard 1: Global Overview
- **KPI**: DAU/WAU/MAU, 전체 생성 요청, 성공률, 평균 생성 시간
- **차트**:
  - 상단: KPI 카드 (4개)
  - 중앙: Pipeline Sankey Diagram (Strategist → Copywriter → Vision → Reviewer → Template)
  - 하단: 시간대별 요청량 Heatmap

#### Dashboard 2: Agent Performance
- **KPI**: Agent별 실행 횟수, 평균 Latency, 성공률, 비용
- **차트**:
  - Agent별 Latency 분포 (Box Plot)
  - 모델별 성능 비교 (Bar Chart: GPT-4 vs Qwen vs Llama)
  - Token 사용량 추이 (Line Chart)

#### Dashboard 3: Workflow Monitoring
- **KPI**: 워크플로우 실행 횟수, 평균 소요시간, 병렬화율
- **차트**:
  - Workflow DAG 시각화 (Network Graph)
  - 단계별 병목 구간 (Gantt Chart)
  - Risk Level별 분포 (Pie Chart)

#### Dashboard 4: TrendPipeline
- **KPI**: 수집량, 정제율, 임베딩 생성 횟수
- **차트**:
  - Pipeline Flow (Sankey: Collector → Cleaner → Embedder → Ingestor)
  - 시간대별 Trend Influx (Line Chart)

#### Dashboard 5: Context Engineering
- **KPI**: 평균 Context 크기, Layer별 비율, Minimization 효과
- **차트**:
  - Layer별 크기 분포 (Stacked Bar)
  - Context 전파 추적 (Sankey: Agent → Agent)

#### Dashboard 6: Editor Activity
- **KPI**: 명령어 파싱 성공률, 자연어 명령 빈도
- **차트**:
  - 명령어 유형 분포 (Pie Chart)
  - 에디터 이벤트 타임라인 (Timeline)

#### Dashboard 7: Cost & Budget
- **KPI**: 일별/주별/월별 LLM 비용, Agent별 비용 분담
- **차트**:
  - 비용 추이 (Line Chart)
  - 모델별 비용 비교 (Stacked Bar)

#### Dashboard 8: Error & Alerts
- **KPI**: 에러율, 재시도 횟수, 실패 원인별 분포
- **차트**:
  - 에러 유형별 분포 (Tree Map)
  - 시간대별 에러 발생 (Heatmap)

---

### 4.2 Prometheus + Grafana 연동

**Metrics 수집**:
```python
# backend/app/core/metrics.py

from prometheus_client import Counter, Histogram, Gauge

# Agent 실행 메트릭
agent_requests_total = Counter(
    'sparklio_agent_requests_total',
    'Total agent requests',
    ['agent_name', 'status']
)

agent_latency_seconds = Histogram(
    'sparklio_agent_latency_seconds',
    'Agent execution latency',
    ['agent_name']
)

agent_tokens_used = Counter(
    'sparklio_agent_tokens_total',
    'Total tokens used',
    ['agent_name', 'model']
)

# Workflow 메트릭
workflow_active = Gauge(
    'sparklio_workflow_active',
    'Number of active workflows'
)

workflow_duration_seconds = Histogram(
    'sparklio_workflow_duration_seconds',
    'Workflow execution duration',
    ['workflow_name']
)

# Context 메트릭
context_size_bytes = Histogram(
    'sparklio_context_size_bytes',
    'Context size in bytes',
    ['layer']
)
```

**Grafana Dashboard**:
- Agent Latency (P50/P90/P99)
- Workflow Throughput
- Error Rate (5분 단위)
- Cost per Hour
- GPU Utilization (Desktop)

---

### 4.3 Logging & Tracing

**OpenTelemetry 통합**:
```python
# backend/app/core/tracing.py

from opentelemetry import trace
from opentelemetry.exporter.jaeger import JaegerExporter
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor

# Tracer 설정
tracer_provider = TracerProvider()
jaeger_exporter = JaegerExporter(
    agent_host_name="100.123.51.5",
    agent_port=6831,
)
tracer_provider.add_span_processor(BatchSpanProcessor(jaeger_exporter))
trace.set_tracer_provider(tracer_provider)

tracer = trace.get_tracer(__name__)

# Agent 실행 시 Trace
@tracer.start_as_current_span("strategist_agent_execute")
def execute_strategist(context):
    span = trace.get_current_span()
    span.set_attribute("agent.name", "StrategistAgent")
    span.set_attribute("context.size_kb", len(str(context)) / 1024)

    # Agent 실행
    result = strategist.process(context)

    span.set_attribute("result.confidence", result.confidence)
    return result
```

**이점**:
- ✅ 전체 요청 흐름 시각화 (Jaeger UI)
- ✅ 병목 구간 자동 탐지
- ✅ Agent 간 의존성 추적

---

## 5. 구현 로드맵

### Phase 1: 기반 구축 (1-2주)

**B팀 작업**:
- [ ] WorkflowSpec / WorkflowNode Pydantic 모델 작성
- [ ] PMAgent 기본 골격 (Planner + Executor)
- [ ] Workflow 테이블 생성 (PostgreSQL)
- [ ] Agent 로그 테이블 생성

**A팀 작업**:
- [ ] Celery Beat 설정 (TrendPipeline 스케줄링)
- [ ] Prometheus Exporter 설치 (Mac mini)
- [ ] Grafana 설치 및 기본 대시보드

---

### Phase 2: Agent 구현 (2-3주)

**B팀 작업**:
- [ ] BaseAgent 클래스 작성
- [ ] StrategistAgent 구현
- [ ] CopywriterAgent 구현
- [ ] VisionGeneratorAgent 구현
- [ ] ReviewerAgent 구현
- [ ] SmartRouter 기본 로직

**A팀 작업**:
- [ ] Ollama 모델 로드 테스트 (Desktop)
- [ ] ComfyUI API 연동 테스트

---

### Phase 3: 워크플로우 통합 (1-2주)

**B팀 작업**:
- [ ] PlanBuilder 로직 구현 (DAG 생성)
- [ ] PlanExecutor 로직 구현 (Celery 분배)
- [ ] Risk-based Strategy Review 구현
- [ ] Pre-check (Budget, Security)

---

### Phase 4: 모니터링 구축 (1-2주)

**A팀 + B팀 협업**:
- [ ] Superset 설치 (Mac mini)
- [ ] 8개 대시보드 구성
- [ ] OpenTelemetry Tracing 통합
- [ ] Alert 규칙 설정 (Error rate > 5%)

---

### Phase 5: Context Engineering 적용 (2-3주)

**B팀 작업**:
- [ ] 4-Layer Context Model 구현
- [ ] Context Minimization 로직
- [ ] Context Trace 로깅
- [ ] TrendPipeline 배치 전환

---

## 6. 기대 효과

### 6.1 성능 개선

| 지표 | 현재 | 개선 후 | 개선율 |
|------|------|---------|--------|
| **평균 생성 시간** | 23초 | 18초 | 22% ↓ |
| **Agent 호출 복잡도** | O(n) 순차 | O(log n) 병렬 | 50% ↓ |
| **Context 크기** | 평균 15KB | 평균 8KB | 47% ↓ |
| **에러 조기 탐지** | 최종 단계 (23초 후) | Pre-check (3초) | 87% ↓ |

---

### 6.2 운영 효율성

| 항목 | 현재 | 개선 후 |
|------|------|---------|
| **Agent 관리** | 수동 코드 수정 | DAG JSON 편집 |
| **모니터링** | 로그 수동 검색 | Superset + Grafana 실시간 |
| **비용 추적** | 불가능 | Agent별/모델별 실시간 |
| **병목 탐지** | 수작업 | OpenTelemetry 자동 |

---

### 6.3 품질 향상

| 항목 | 현재 | 개선 후 |
|------|------|---------|
| **전략 오류** | 전체 실패 | Review Gate로 조기 차단 |
| **Context 과부하** | 불필요 데이터 전송 | Minimization 자동 적용 |
| **Type B 혼재** | 실시간 플로우 방해 | 배치 격리 |

---

## 7. 다음 단계

### 즉시 착수 가능한 작업

1. **Backend 구조 확장**
   ```bash
   cd ~/sparklio_ai_marketing_studio/backend
   mkdir -p app/agents app/pipelines
   ```

2. **Pydantic 모델 작성**
   - `app/models/workflow.py` (WorkflowSpec)
   - `app/schemas/context.py` (SparkलioContext)

3. **Database Migration**
   ```sql
   -- workflows, agent_logs, context_traces 테이블 생성
   ```

4. **Superset 설치**
   ```bash
   # Mac mini
   docker run -d -p 8088:8088 --name superset apache/superset
   ```

---

## 결론

Agent 정의 문서 9개를 종합 검토한 결과, **현재 우리 시스템의 강점을 유지하면서 Multi-Agent 아키텍처의 장점을 통합**할 수 있는 명확한 방향을 확인했습니다.

**핵심 개선사항**:
1. ✅ PMAgent Planner/Executor 분리
2. ✅ DAG 기반 병렬 실행
3. ✅ Risk-based Strategy Review
4. ✅ Context Engineering 체계화
5. ✅ Type B Agent 배치 격리
6. ✅ Superset/Grafana 모니터링

**우선순위**:
- **High**: PMAgent 구조, Workflow 테이블, Agent 로그
- **Medium**: SmartRouter, Context Model, Monitoring
- **Low**: TrendPipeline 배치 전환

이 계획서를 기반으로 **B팀과 C팀이 Multi-Agent 시스템을 점진적으로 구현**할 수 있습니다.

---

**작성일**: 2025-11-15
**작성자**: A Team Leader
**버전**: 1.0
**다음 리뷰**: Phase 1 완료 후
