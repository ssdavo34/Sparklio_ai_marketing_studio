# AGENT_IO_SCHEMA_CATALOG.md
Sparklio V4 — 전체 에이전트 입출력 스키마 카탈로그
작성일: 2025-11-15
작성자: A팀 (Infrastructure Team)

---

# 1. 목적

Sparklio의 24개 에이전트가 사용하는 **모든 입출력 스키마를 Pydantic 모델로 정의**합니다.
이를 통해 A2A 통신의 일관성과 타입 안정성을 보장합니다.

---

# 2. A2A 공통 Request/Response 프레임워크

모든 에이전트는 아래 공통 구조를 따릅니다.

## 2.1 A2A Request (공통)

```python
from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime

class A2ARequest(BaseModel):
    request_id: str
    source_agent: str
    target_agent: str
    timestamp: datetime
    context: Dict[str, Any]
    payload: Dict[str, Any]  # 에이전트별 고유 데이터
```

---

## 2.2 A2A Response (공통)

```python
class A2AResponse(BaseModel):
    request_id: str
    source_agent: str
    status: str  # "success" | "error" | "partial"
    timestamp: datetime
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    metadata: Dict[str, Any] = {}
```

---

## 2.3 Context 공통 스키마

```python
class SystemContext(BaseModel):
    brand_id: str
    project_id: Optional[str] = None
    task_type: str  # "image" | "brochure" | "ppt" | "video" | "copy"
    risk_level: str  # "low" | "medium" | "high"
    language: str = "ko"
    output_format: str = "json"

class TaskContext(BaseModel):
    brief: Optional[Dict[str, Any]] = None
    brandkit_summary: Optional[Dict[str, Any]] = None
    user_command: Optional[str] = None
    quality_gates: Optional[Dict[str, Any]] = None

class WorkingMemory(BaseModel):
    previous_outputs: list[Dict[str, Any]] = []
    style_selections: Optional[Dict[str, Any]] = None
    decisions: Optional[Dict[str, Any]] = None

class EphemeralContext(BaseModel):
    recent_conversation: list[str] = []
    temp_settings: Optional[Dict[str, Any]] = None
```

---

# 3. Family 1: Strategy & Brief Agents

## 3.1 StrategistAgent

### Input Schema
```python
class StrategistInput(BaseModel):
    brand_id: str
    brandkit: Dict[str, Any]
    campaign_goal: str
    target_audience: Optional[str] = None
    budget: Optional[float] = None
    timeline: Optional[str] = None
    market_data: Optional[Dict[str, Any]] = None
```

### Output Schema
```python
class StrategistOutput(BaseModel):
    strategy: str  # 전략 요약
    key_messages: list[str]
    channel_recommendations: list[str]  # ["instagram", "tiktok", "blog"]
    tone_direction: str
    visual_direction: str
    estimated_timeline: str
    confidence_score: float
```

---

## 3.2 BriefAgent

### Input Schema
```python
class BriefInput(BaseModel):
    brand_id: str
    strategy_output: Optional[StrategistOutput] = None
    user_requirements: str
    asset_type: str  # "image" | "brochure" | "ppt" | "video"
```

### Output Schema
```python
class BriefOutput(BaseModel):
    brief_id: str
    asset_type: str
    objective: str
    key_messages: list[str]
    visual_requirements: Dict[str, Any]
    copy_requirements: Dict[str, Any]
    constraints: Optional[Dict[str, Any]] = None
    reference_materials: Optional[list[str]] = None
```

---

# 4. Family 2: Copy & Template Agents

## 4.1 CopywriterAgent

### Input Schema
```python
class CopywriterInput(BaseModel):
    brand_id: str
    brandkit_summary: Dict[str, Any]
    brief: BriefOutput
    tone: str  # "premium" | "friendly" | "professional" | "playful"
    length: str  # "short" | "medium" | "long"
    target_platform: Optional[str] = None  # "instagram" | "blog" | etc.
```

### Output Schema
```python
class CopywriterOutput(BaseModel):
    headline: str
    subheadline: Optional[str] = None
    body_copy: str
    cta: Optional[str] = None  # Call-to-Action
    keywords: list[str]
    character_count: int
    tone_match_score: float  # 브랜드 톤 일치도 (0-1)
```

---

## 4.2 TemplateMatcherAgent

### Input Schema
```python
class TemplateMatcherInput(BaseModel):
    brand_id: str
    asset_type: str
    style_preference: Optional[str] = None
    content_structure: Optional[Dict[str, Any]] = None
    filters: Optional[Dict[str, Any]] = None  # {"industry": "fashion", "color": "blue"}
```

### Output Schema
```python
class TemplateMatcherOutput(BaseModel):
    template_id: str
    template_name: str
    preview_url: str
    match_score: float
    customization_options: Dict[str, Any]
    estimated_edit_time: int  # minutes
```

---

# 5. Family 3: Visual & Video Agents

## 5.1 VisionGeneratorAgent

### Input Schema
```python
class VisionGeneratorInput(BaseModel):
    brand_id: str
    brandkit_summary: Dict[str, Any]
    brief: BriefOutput
    copy: Optional[CopywriterOutput] = None
    style: str  # "photorealistic" | "illustration" | "minimalist"
    aspect_ratio: str = "1:1"  # "1:1" | "16:9" | "9:16"
```

### Output Schema
```python
class VisionGeneratorOutput(BaseModel):
    image_url: str
    prompt_used: str
    model_used: str  # "flux-dev" | "sdxl"
    generation_time: float
    quality_score: float
    style_match_score: float
    variations: Optional[list[str]] = None  # 추가 변형 이미지 URLs
```

---

## 5.2 ScenePlannerAgent (Video)

### Input Schema
```python
class ScenePlannerInput(BaseModel):
    brand_id: str
    brief: BriefOutput
    duration: int  # seconds
    video_style: str  # "cinematic" | "dynamic" | "calm"
```

### Output Schema
```python
class ScenePlannerOutput(BaseModel):
    scenes: list[Dict[str, Any]]  # [{"scene_id": 1, "duration": 3, "description": "..."}]
    total_duration: int
    transitions: list[str]
    audio_recommendation: Optional[str] = None
```

---

## 5.3 VideoDirectorAgent

### Input Schema
```python
class VideoDirectorInput(BaseModel):
    scene_plan: ScenePlannerOutput
    brandkit_summary: Dict[str, Any]
    visual_style: str
```

### Output Schema
```python
class VideoDirectorOutput(BaseModel):
    video_url: str
    scenes_rendered: int
    total_duration: float
    model_used: str  # "veo3" | "animatediff"
    quality_score: float
```

---

# 6. Family 4: Trend & Data Pipeline Agents (Type B)

## 6.1 TrendCollectorAgent

### Input Schema
```python
class TrendCollectorInput(BaseModel):
    sources: list[str]  # ["instagram", "tiktok", "pinterest"]
    keywords: Optional[list[str]] = None
    date_range: Optional[str] = None
```

### Output Schema
```python
class TrendCollectorOutput(BaseModel):
    collected_items: int
    raw_data: list[Dict[str, Any]]
    collection_timestamp: datetime
```

---

## 6.2 DataCleanerAgent

### Input Schema
```python
class DataCleanerInput(BaseModel):
    raw_data: list[Dict[str, Any]]
```

### Output Schema
```python
class DataCleanerOutput(BaseModel):
    cleaned_items: int
    removed_items: int
    cleaned_data: list[Dict[str, Any]]
```

---

## 6.3 EmbedderAgent

### Input Schema
```python
class EmbedderInput(BaseModel):
    cleaned_data: list[Dict[str, Any]]
    embedding_model: str = "sentence-transformers/all-MiniLM-L6-v2"
```

### Output Schema
```python
class EmbedderOutput(BaseModel):
    embeddings: list[list[float]]
    embedding_dimension: int
    processing_time: float
```

---

## 6.4 IngestorAgent

### Input Schema
```python
class IngestorInput(BaseModel):
    embeddings: EmbedderOutput
    metadata: list[Dict[str, Any]]
```

### Output Schema
```python
class IngestorOutput(BaseModel):
    ingested_count: int
    index_name: str
    status: str
```

---

# 7. Family 5: Brand Learning Agents

## 7.1 BrandAgent

### Input Schema
```python
class BrandAgentInput(BaseModel):
    brand_id: str
    query_type: str  # "get_info" | "analyze" | "update"
    materials: Optional[list[str]] = None  # URLs to brand materials
```

### Output Schema
```python
class BrandAgentOutput(BaseModel):
    brand_info: Dict[str, Any]
    colors: Dict[str, str]  # {"primary": "#FF5733", "secondary": "#C70039"}
    fonts: Dict[str, str]
    tone: str
    analysis_quality: float
```

---

## 7.2 BrandLearningAgent

### Input Schema
```python
class BrandLearningInput(BaseModel):
    brand_id: str
    feedback_data: list[Dict[str, Any]]
    performance_metrics: Dict[str, Any]
```

### Output Schema
```python
class BrandLearningOutput(BaseModel):
    updated_brandkit: Dict[str, Any]
    insights: list[str]
    improvement_suggestions: list[str]
```

---

# 8. Family 6: System Control Agents (Type C)

## 8.1 PMAgent (Planner + Executor)

### PlanBuilder Input
```python
class PlanBuilderInput(BaseModel):
    user_request: str
    brand_id: str
    context: Dict[str, Any]
```

### PlanBuilder Output (WorkflowSpec)
```python
class WorkflowNode(BaseModel):
    node_id: str
    agent_name: str
    input_schema: str
    dependencies: list[str] = []

class WorkflowEdge(BaseModel):
    from_node: str
    to_node: str
    condition: Optional[str] = None

class WorkflowSpec(BaseModel):
    workflow_id: str
    name: str
    nodes: list[WorkflowNode]
    edges: list[WorkflowEdge]
    context: SystemContext
```

### PlanExecutor Input
```python
class PlanExecutorInput(BaseModel):
    workflow_spec: WorkflowSpec
```

### PlanExecutor Output
```python
class PlanExecutorOutput(BaseModel):
    workflow_id: str
    status: str  # "running" | "completed" | "failed"
    job_id: str
    progress: float  # 0-1
    results: Optional[Dict[str, Any]] = None
```

---

## 8.2 SecurityAgent

### Input Schema
```python
class SecurityInput(BaseModel):
    request_text: str
    user_id: str
    brand_id: str
```

### Output Schema
```python
class SecurityOutput(BaseModel):
    is_safe: bool
    risk_score: float  # 0-1
    violations: list[str]
    recommendations: Optional[list[str]] = None
```

---

## 8.3 BudgetAgent

### Input Schema
```python
class BudgetInput(BaseModel):
    workflow_spec: WorkflowSpec
    user_id: str
```

### Output Schema
```python
class BudgetOutput(BaseModel):
    estimated_cost: float
    cost_breakdown: Dict[str, float]
    is_approved: bool
    remaining_budget: float
```

---

## 8.4 ADAgent (Anomaly Detection)

### Input Schema
```python
class ADInput(BaseModel):
    agent_name: str
    output: Dict[str, Any]
    expected_schema: str
```

### Output Schema
```python
class ADOutput(BaseModel):
    is_anomaly: bool
    anomaly_score: float
    detected_issues: list[str]
    suggested_actions: list[str]
```

---

# 9. Family 7: Router & Infra Agents

## 9.1 SmartRouter

이미 [SMART_ROUTER_SPEC.md](SMART_ROUTER_SPEC.md)에 정의되어 있습니다.

### Input Schema
```python
class RouterRequest(BaseModel):
    user_id: str
    request_text: str
    brand_id: Optional[str] = None
    project_id: Optional[str] = None
    context: Optional[Dict[str, Any]] = None
```

### Output Schema
```python
class RouterResponse(BaseModel):
    target_agent: str
    selected_model: str
    risk_level: str
    minimized_context: Dict[str, Any]
    routing_metadata: Dict[str, Any]
```

---

## 9.2 RAGAgent

### Input Schema
```python
class RAGInput(BaseModel):
    query: str
    brand_id: Optional[str] = None
    filters: Optional[Dict[str, Any]] = None
    top_k: int = 5
```

### Output Schema
```python
class RAGOutput(BaseModel):
    results: list[Dict[str, Any]]
    relevance_scores: list[float]
    sources: list[str]
```

---

# 10. Editor Agents

## 10.1 EditorAgent

### Input Schema
```python
class EditorInput(BaseModel):
    canvas: Dict[str, Any]  # Fabric.js Canvas JSON
    command: str  # 자연어 명령
    editor_rules: Optional[Dict[str, Any]] = None
    history: Optional[Dict[str, Any]] = None
```

### Output Schema
```python
class EditorAction(BaseModel):
    type: str  # "set_color" | "move" | "resize" | etc.
    target: str  # object ID
    property: str
    value: Any

class EditorOutput(BaseModel):
    actions: list[EditorAction]
    metadata: Dict[str, Any]
    confidence: float
```

---

# 11. Reviewer Agents

## 11.1 ReviewerAgent

### Input Schema
```python
class ReviewerInput(BaseModel):
    asset_type: str
    asset_url: str
    brief: BriefOutput
    brandkit_summary: Dict[str, Any]
    review_criteria: Optional[list[str]] = None
```

### Output Schema
```python
class ReviewerOutput(BaseModel):
    approval_status: str  # "approved" | "needs_revision" | "rejected"
    overall_score: float  # 0-100
    feedback: list[Dict[str, Any]]  # [{"aspect": "color", "score": 85, "comment": "..."}]
    suggestions: list[str]
```

---

## 11.2 StrategyReviewerAgent

### Input Schema
```python
class StrategyReviewerInput(BaseModel):
    workflow_spec: WorkflowSpec
    strategy_output: StrategistOutput
    brief: BriefOutput
```

### Output Schema
```python
class StrategyReviewerOutput(BaseModel):
    is_approved: bool
    review_score: float
    concerns: list[str]
    recommendations: list[str]
```

---

# 12. 에러 응답 표준 포맷

모든 에이전트는 에러 발생 시 다음 포맷을 따릅니다:

```python
class AgentError(BaseModel):
    error_type: str  # "validation_error" | "model_error" | "timeout" | "unknown"
    error_message: str
    error_details: Optional[Dict[str, Any]] = None
    timestamp: datetime
    agent_name: str
    retry_possible: bool
```

---

# 13. 전체 스키마 import 예시

모든 스키마를 한 곳에서 import:

```python
# backend/app/schemas/agents.py

from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime

# Common
from .common import A2ARequest, A2AResponse, SystemContext, TaskContext

# Family 1: Strategy & Brief
from .strategy import StrategistInput, StrategistOutput
from .strategy import BriefInput, BriefOutput

# Family 2: Copy & Template
from .copy import CopywriterInput, CopywriterOutput
from .copy import TemplateMatcherInput, TemplateMatcherOutput

# Family 3: Visual & Video
from .visual import VisionGeneratorInput, VisionGeneratorOutput
from .visual import ScenePlannerInput, ScenePlannerOutput
from .visual import VideoDirectorInput, VideoDirectorOutput

# Family 4: Trend & Data
from .trend import TrendCollectorInput, TrendCollectorOutput
from .trend import DataCleanerInput, DataCleanerOutput
from .trend import EmbedderInput, EmbedderOutput
from .trend import IngestorInput, IngestorOutput

# Family 5: Brand Learning
from .brand import BrandAgentInput, BrandAgentOutput
from .brand import BrandLearningInput, BrandLearningOutput

# Family 6: System Control
from .pm import PlanBuilderInput, WorkflowSpec, PlanExecutorInput, PlanExecutorOutput
from .system import SecurityInput, SecurityOutput
from .system import BudgetInput, BudgetOutput
from .system import ADInput, ADOutput

# Family 7: Router & Infra
from .router import RouterRequest, RouterResponse
from .rag import RAGInput, RAGOutput

# Editor
from .editor import EditorInput, EditorOutput, EditorAction

# Reviewer
from .reviewer import ReviewerInput, ReviewerOutput
from .reviewer import StrategyReviewerInput, StrategyReviewerOutput

# Error
from .error import AgentError
```

---

# 14. 파일 구조

```
backend/app/schemas/
├── __init__.py
├── common.py          # A2ARequest, A2AResponse, Contexts
├── strategy.py        # StrategistAgent, BriefAgent
├── copy.py            # CopywriterAgent, TemplateMatcherAgent
├── visual.py          # VisionGeneratorAgent, ScenePlannerAgent, VideoDirectorAgent
├── trend.py           # TrendCollectorAgent, DataCleanerAgent, EmbedderAgent, IngestorAgent
├── brand.py           # BrandAgent, BrandLearningAgent
├── pm.py              # PMAgent (PlanBuilder, PlanExecutor)
├── system.py          # SecurityAgent, BudgetAgent, ADAgent
├── router.py          # SmartRouter
├── rag.py             # RAGAgent
├── editor.py          # EditorAgent
├── reviewer.py        # ReviewerAgent, StrategyReviewerAgent
└── error.py           # AgentError
```

---

# 15. Validation 규칙

모든 스키마는 Pydantic의 검증 기능을 활용합니다:

```python
from pydantic import BaseModel, validator, Field

class CopywriterInput(BaseModel):
    brand_id: str = Field(..., min_length=1)
    tone: str = Field(..., pattern="^(premium|friendly|professional|playful)$")
    length: str = Field(..., pattern="^(short|medium|long)$")

    @validator('brand_id')
    def validate_brand_id(cls, v):
        if not v.startswith('brand_'):
            raise ValueError('brand_id must start with "brand_"')
        return v
```

---

# 16. 다음 단계

이제 다음 문서를 작성할 수 있습니다:

1. **EDITOR_ENGINE_IMPLEMENTATION.md**: EditorAgent 구체적 구현
2. **Ollama 통합 레이어**: `app/integrations/ollama_client.py`
3. **Celery Worker 설정**: PMAgent 실행 준비

---

**작성 완료일**: 2025-11-15
**관련 문서**:
- [SMART_ROUTER_SPEC.md](SMART_ROUTER_SPEC.md)
- [SYSTEM_IMPROVEMENT_PLAN.md](SYSTEM_IMPROVEMENT_PLAN.md)
