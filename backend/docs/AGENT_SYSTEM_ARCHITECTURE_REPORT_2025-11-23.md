# Agent 시스템 아키텍처 및 서비스 플로우 보고서

**작성일**: 2025-11-23
**작성자**: B팀 (Backend)
**버전**: 1.0
**목적**: 전체 Agent 시스템의 구조, 서비스 플로우, 활동 패턴 종합 분석

---

## 📋 목차

1. [시스템 개요](#시스템-개요)
2. [Agent 분류 및 역할](#agent-분류-및-역할)
3. [서비스 아키텍처](#서비스-아키텍처)
4. [서비스 플로우](#서비스-플로우)
5. [Agent 활동 패턴](#agent-활동-패턴)
6. [워크플로우 상세](#워크플로우-상세)
7. [통합 다이어그램](#통합-다이어그램)

---

## 시스템 개요

### 핵심 아키텍처

Sparklio AI Marketing Studio는 **21개의 전문 Agent**가 협업하는 **Multi-Agent 시스템**입니다.

```
┌─────────────────────────────────────────────────────────────┐
│                     Client (Frontend)                        │
│                  React + PolotnoEditor                       │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP/REST API
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                   FastAPI Backend                            │
│  ┌──────────────────────────────────────────────────────┐   │
│  │          API Layer (v1/endpoints/)                   │   │
│  │   /generate, /llm-gateway, /media-gateway            │   │
│  └─────────────────────┬────────────────────────────────┘   │
│                        │                                     │
│  ┌─────────────────────▼────────────────────────────────┐   │
│  │        Generator Service (Orchestrator)              │   │
│  │   - WorkflowExecutor: Agent 조합 및 실행             │   │
│  │   - kind → Workflow 매핑                              │   │
│  └─────────────────────┬────────────────────────────────┘   │
│                        │                                     │
│  ┌─────────────────────▼────────────────────────────────┐   │
│  │           21 Agents (Creation + Intelligence)        │   │
│  │   각 Agent는 독립적으로 LLM/Media Gateway 호출       │   │
│  └─────────────────────┬────────────────────────────────┘   │
│                        │                                     │
│  ┌─────────────────────▼────────────────────────────────┐   │
│  │      LLM Gateway (Multi-Provider Router)             │   │
│  │   Ollama, OpenAI, Anthropic, Gemini                  │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │      Media Gateway (Image/Video Provider)            │   │
│  │   ComfyUI, NanoBanana                                │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

### 핵심 특징

1. **Multi-Agent 협업**: 21개 Agent가 워크플로우로 조합되어 복잡한 작업 수행
2. **Provider 추상화**: LLM Gateway와 Media Gateway로 여러 AI Provider 통합
3. **워크플로우 기반 실행**: Sequential/Parallel 조합으로 유연한 파이프라인 구성
4. **Context Engineering**: Agent ↔ LLM Gateway 간 동적 프롬프트 생성
5. **Canvas 통합**: Abstract Canvas Builder로 Editor 독립적 문서 생성

---

## Agent 분류 및 역할

### 전체 Agent 목록 (21개)

#### 1. Creation Agents (콘텐츠 생성) - 10개

| Agent | 역할 | 주요 작업 | LLM 의존 | Media 의존 |
|-------|------|-----------|----------|------------|
| **CopywriterAgent** | 텍스트 콘텐츠 생성 | product_detail, sns, brand_message, headline, ad_copy | ✅ | ❌ |
| **StrategistAgent** | 마케팅 전략 수립 | brand_kit, campaign_strategy, market_analysis | ✅ | ❌ |
| **DesignerAgent** | 비주얼 콘텐츠 생성 | product_image, banner, thumbnail | ✅ (영문 프롬프트) | ✅ (ComfyUI) |
| **ReviewerAgent** | 콘텐츠 품질 검토 | content_review, copy_review, brand_consistency, grammar_check | ✅ | ❌ |
| **OptimizerAgent** | 콘텐츠 최적화 | seo_optimize, conversion_optimize, readability_improve, length_adjust | ✅ | ❌ |
| **EditorAgent** | 텍스트 교정 | proofread, grammar_fix, style_adjust | ✅ | ❌ |
| **VisionAnalyzerAgent** | 이미지 분석 | image_description, brand_consistency_check | ✅ (Vision) | ❌ |
| **ScenePlannerAgent** | 동영상 시나리오 | video_script, scene_breakdown, storyboard | ✅ | ❌ (Video 예정) |
| **TemplateAgent** | 템플릿 생성/관리 | template_create, template_customize | ✅ | ❌ |
| **MeetingAIAgent** | 회의 분석 | meeting_summary, action_items | ✅ | ❌ |

#### 2. Intelligence Agents (지능형 시스템) - 7개

| Agent | 역할 | 주요 작업 | 특징 |
|-------|------|-----------|------|
| **RAGAgent** | 검색 증강 생성 | retrieval, context_augmentation | Vector DB 연동 |
| **EmbedderAgent** | 텍스트 임베딩 | text_embedding, semantic_search | OpenAI Embeddings |
| **IngestorAgent** | 데이터 수집 | document_ingest, knowledge_base_update | 문서 파싱 |
| **TrendCollectorAgent** | 트렌드 수집 | market_trends, competitor_analysis | 외부 API 연동 |
| **DataCleanerAgent** | 데이터 정제 | data_validation, normalization | 데이터 품질 관리 |
| **SelfLearningAgent** | 자기 학습 | performance_feedback, model_tuning | 피드백 루프 |
| **PerformanceAnalyzerAgent** | 성능 분석 | metrics_analysis, bottleneck_detection | 시스템 모니터링 |

#### 3. System Agents (시스템 관리) - 4개

| Agent | 역할 | 주요 작업 | 특징 |
|-------|------|-----------|------|
| **PMAgent** | 프로젝트 관리 | task_planning, milestone_tracking | 워크플로우 조정 |
| **QAAgent** | 품질 보증 | test_generation, quality_check | 자동 테스트 |
| **ErrorHandlerAgent** | 에러 처리 | error_recovery, fallback_execution | 장애 대응 |
| **LoggerAgent** | 로깅 및 모니터링 | activity_logging, audit_trail | 추적성 확보 |

### Agent 분포

```
Creation Agents (10)    ████████████████████ 47.6%
Intelligence Agents (7) ██████████████       33.3%
System Agents (4)       ████████             19.1%
                        ──────────────────────
Total: 21 Agents        ████████████████████ 100%
```

---

## 서비스 아키텍처

### Layer 구조

```
┌─────────────────────────────────────────────────────────────┐
│  Layer 1: API Endpoints                                     │
│  - /api/v1/generate (통합 Generator)                         │
│  - /api/v1/llm-gateway (직접 LLM 호출)                       │
│  - /api/v1/media-gateway (직접 Media 호출)                   │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│  Layer 2: Generator Service (Orchestration)                 │
│  - GeneratorService: kind → Workflow 매핑                    │
│  - WorkflowExecutor: Sequential/Parallel Agent 실행          │
│  - Canvas Builder: Abstract Document 생성                    │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│  Layer 3: Agent Layer (21 Agents)                           │
│  - AgentBase: 공통 인터페이스 (execute, _enhance_payload)    │
│  - 각 Agent: 독립적 execute() 구현                           │
│  - AgentRequest/Response: 표준 입출력 포맷                   │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│  Layer 4: Gateway Layer                                     │
│  ┌─────────────────────┐  ┌────────────────────────────┐   │
│  │  LLM Gateway        │  │  Media Gateway             │   │
│  │  - Router           │  │  - ComfyUI Provider        │   │
│  │  - 4 Providers      │  │  - NanoBanana Provider     │   │
│  │  - Context Eng.     │  │  - Mock Provider           │   │
│  └─────────────────────┘  └────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 핵심 컴포넌트

#### 1. GeneratorService
**위치**: `app/services/generator/service.py`

**역할**:
- Client 요청 받아 적절한 Workflow 선택
- Workflow 실행 및 결과 변환
- Canvas Document 생성

**kind → Workflow 매핑**:
```python
workflow_map = {
    "product_detail": ProductContentWorkflow,
    "sns_set": ProductContentWorkflow,
    "presentation_simple": ProductContentWorkflow,
    "brand_identity": BrandIdentityWorkflow,
    "content_review": ContentReviewWorkflow
}
```

#### 2. WorkflowExecutor
**위치**: `app/services/orchestrator/base.py`

**역할**:
- WorkflowDefinition 실행
- Sequential/Parallel Step 처리
- Variable Substitution (${initial.xxx}, ${step_0.xxx})
- Agent 간 데이터 전달

**실행 흐름**:
```python
1. initial_payload 준비
2. For each step:
   a. payload_template 변수 치환
   b. Agent 호출 (execute)
   c. 결과 저장 (context)
3. 최종 WorkflowResult 반환
```

#### 3. LLM Gateway
**위치**: `app/services/llm/gateway.py`

**역할**:
- Multi-Provider 라우팅 (Ollama, OpenAI, Anthropic, Gemini)
- Context Engineering (Agent ↔ Gateway 연동)
- System Prompt 동적 생성
- Mock/Live 모드 전환

**Context Engineering**:
```python
def _build_prompt(role, task, payload):
    system_prompt = _get_system_prompt(role, task)
    enhanced_system = _enhance_system_prompt(system_prompt, payload)
    # ↑ Agent의 _instructions, _output_structure, _tone_guide 통합
    user_input = _format_payload(payload)
    return f"{enhanced_system}\n\n{user_input}"
```

#### 4. Media Gateway
**위치**: `app/services/media/gateway.py`

**역할**:
- 이미지 생성 Provider 라우팅
- ComfyUI 연동 (Juggernaut XL)
- NanoBanana 연동 (Gemini Imagen 3)
- Mock Provider (테스트용)

#### 5. Canvas Builder v2.0
**위치**: `app/services/canvas/abstract_builder.py`

**역할**:
- Editor 독립적 문서 구조 생성
- PolotnoEditor, FabricJS 지원
- 텍스트 + 이미지 레이아웃

---

## 서비스 플로우

### 1. 기본 플로우 (Product Detail 생성)

```
┌─────────┐
│ Client  │
│ (React) │
└────┬────┘
     │ POST /api/v1/generate
     │ {
     │   kind: "product_detail",
     │   input: {prompt: "무선 이어폰"},
     │   options: {tone: "professional"}
     │ }
     ▼
┌────────────────┐
│ API Endpoint   │
│ /generate      │
└────┬───────────┘
     │ GenerateRequest
     ▼
┌────────────────────────────────────────────┐
│ GeneratorService                           │
│                                            │
│ 1. kind → Workflow 매핑                     │
│    "product_detail" → ProductContentWorkflow│
│                                            │
│ 2. initial_payload 준비                    │
│    {                                       │
│      product_name: "무선 이어폰",           │
│      features: ["..."],                    │
│      target_audience: "일반 소비자"         │
│    }                                       │
└────┬───────────────────────────────────────┘
     │ WorkflowDefinition + initial_payload
     ▼
┌────────────────────────────────────────────┐
│ WorkflowExecutor                           │
│                                            │
│ Step 0: CopywriterAgent                    │
│   task: "product_detail"                   │
│   payload: ${initial.*}                    │
│   ─────────────────────────────────        │
│   AgentRequest → CopywriterAgent.execute() │
│   ─────────────────────────────────        │
│   Result: {                                │
│     headline: "완벽한 소음 차단",           │
│     body: "...",                           │
│     bullets: [...]                         │
│   }                                        │
│                                            │
│ Step 1: ReviewerAgent                      │
│   task: "content_review"                   │
│   payload: ${step_0.outputs[0].value}      │
│   ─────────────────────────────────        │
│   AgentRequest → ReviewerAgent.execute()   │
│   ─────────────────────────────────        │
│   Result: {                                │
│     overall_score: 8,                      │
│     strengths: [...],                      │
│     improvements: [...]                    │
│   }                                        │
│                                            │
│ Step 2: OptimizerAgent                     │
│   task: "conversion_optimize"              │
│   payload: {                               │
│     content: ${step_0.*},                  │
│     review_feedback: ${step_1.*}           │
│   }                                        │
│   ─────────────────────────────────        │
│   Result: {optimized_content: {...}}       │
└────┬───────────────────────────────────────┘
     │ WorkflowResult
     ▼
┌────────────────────────────────────────────┐
│ GeneratorService                           │
│                                            │
│ 3. Canvas Document 생성                     │
│    create_product_detail_document(         │
│      text_data={headline, body, bullets},  │
│      image_url="data:image/png;base64..."  │
│    )                                       │
│                                            │
│ 4. GenerateResponse 조립                   │
│    {                                       │
│      document: {canvas_json: {...}},       │
│      text: {headline, body, bullets},      │
│      meta: {workflow, agents_used, ...}    │
│    }                                       │
└────┬───────────────────────────────────────┘
     │ GenerateResponse
     ▼
┌─────────┐
│ Client  │
│ PolotnoEditor.loadJSON(canvas_json)        │
└─────────┘
```

### 2. Agent 실행 플로우 (CopywriterAgent 예시)

```
┌──────────────────┐
│ WorkflowExecutor │
└────┬─────────────┘
     │ AgentRequest(task="product_detail", payload={...})
     ▼
┌─────────────────────────────────────────────────────┐
│ CopywriterAgent.execute(request)                    │
│                                                     │
│ 1. 요청 검증 (_validate_request)                    │
│    - task 확인                                      │
│    - payload 확인                                   │
│                                                     │
│ 2. Payload 강화 (_enhance_payload)                  │
│    enhanced = {                                     │
│      ...payload,                                    │
│      language: "ko",                                │
│      _instructions: "제품의 핵심 가치...",           │
│      _output_structure: {                           │
│        headline: "임팩트 있는 헤드라인 (20자)",      │
│        body: "본문 (80자)",                         │
│        bullets: "특징 3개 (각 20자)"                │
│      },                                             │
│      _tone_guide: "전문적이고 신뢰감 있는 톤"        │
│    }                                                │
└────┬────────────────────────────────────────────────┘
     │ enhanced_payload
     ▼
┌─────────────────────────────────────────────────────┐
│ LLM Gateway.generate(                               │
│   role="copywriter",                                │
│   task="product_detail",                            │
│   payload=enhanced_payload,                         │
│   mode="json"                                       │
│ )                                                   │
│                                                     │
│ 3. System Prompt 강화 (_enhance_system_prompt)      │
│    Base Prompt:                                     │
│      "당신은 10년 경력 카피라이터..."                │
│      "## 🧠 작성 프로세스 (CoT)"                     │
│      "Step 1. 제품 분석"                            │
│      "Step 2. 타겟 이해"                            │
│      ...                                            │
│                                                     │
│    + Agent 필드 통합:                                │
│      "## 📋 작업 지시사항"                           │
│      "제품의 핵심 가치와 차별점..."                  │
│                                                     │
│      "## 📝 출력 구조"                               │
│      "- headline: 임팩트 있는 헤드라인 (20자)"       │
│      "- body: 본문 (80자)"                          │
│      ...                                            │
│                                                     │
│      "## 🎨 톤앤매너"                                │
│      "전문적이고 신뢰감 있는 톤"                     │
│                                                     │
│ 4. Provider 선택 (Router)                           │
│    role="copywriter", task="product_detail"         │
│    → Ollama (qwen2.5:7b)                            │
│                                                     │
│ 5. LLM 호출                                         │
│    OllamaProvider.generate(prompt, mode="json")     │
└────┬────────────────────────────────────────────────┘
     │ LLMProviderResponse
     ▼
┌─────────────────────────────────────────────────────┐
│ CopywriterAgent                                     │
│                                                     │
│ 6. 응답 파싱 (_parse_llm_response)                  │
│    llm_output.value = {                             │
│      headline: "완벽한 소음 차단의 시작",            │
│      body: "40dB 노이즈캔슬링으로...",              │
│      bullets: ["40dB ANC", "24시간 배터리", ...]    │
│      cta: "지금 구매"                               │
│    }                                                │
│                                                     │
│    필드명 정규화 (_normalize_product_detail)        │
│    - title/name → headline                         │
│    - features/highlights → bullets                 │
│                                                     │
│ 7. AgentOutput 생성                                 │
│    outputs = [                                      │
│      AgentOutput(                                   │
│        type="json",                                 │
│        name="product_copy",                         │
│        value={...}                                  │
│      )                                              │
│    ]                                                │
│                                                     │
│ 8. Usage 계산                                       │
│    usage = {                                        │
│      llm_tokens: 350,                               │
│      elapsed_seconds: 2.5                           │
│    }                                                │
│                                                     │
│ 9. AgentResponse 반환                               │
│    return AgentResponse(                            │
│      agent="copywriter",                            │
│      task="product_detail",                         │
│      outputs=[...],                                 │
│      usage={...},                                   │
│      meta={llm_provider, llm_model}                 │
│    )                                                │
└────┬────────────────────────────────────────────────┘
     │ AgentResponse
     ▼
┌──────────────────┐
│ WorkflowExecutor │
│ context.step_0 = response                           │
└──────────────────┘
```

### 3. LLM Provider 라우팅 플로우

```
┌──────────────┐
│ LLM Gateway  │
│ .generate()  │
└──────┬───────┘
       │ role="copywriter", task="product_detail"
       ▼
┌──────────────────────────────────┐
│ Router.route(role, task)         │
│                                  │
│ Routing Rules:                   │
│ - copywriter + product_detail    │
│   → Ollama (qwen2.5:7b)          │
│                                  │
│ - designer + product_image       │
│   → Ollama (qwen2.5:7b)          │
│   (영문 프롬프트 생성용)          │
│                                  │
│ - strategist + brand_kit         │
│   → OpenAI (gpt-4o-mini)         │
│                                  │
│ - reviewer + content_review      │
│   → Anthropic (claude-3.5-haiku) │
└──────┬───────────────────────────┘
       │ model="qwen2.5:7b", provider="ollama"
       ▼
┌──────────────────────────────────┐
│ OllamaProvider.generate()        │
│                                  │
│ POST http://localhost:11434/api/generate
│ {                                │
│   model: "qwen2.5:7b",           │
│   prompt: "...",                 │
│   format: "json",                │
│   options: {                     │
│     temperature: 0.7,            │
│     top_p: 0.9                   │
│   }                              │
│ }                                │
└──────┬───────────────────────────┘
       │ Streaming Response
       ▼
┌──────────────────────────────────┐
│ JSON Parsing & Validation        │
│                                  │
│ response_text = "..."            │
│ parsed_json = json.loads(...)    │
│                                  │
│ LLMProviderResponse(             │
│   provider="ollama",             │
│   model="qwen2.5:7b",            │
│   output=LLMProviderOutput(      │
│     type="json",                 │
│     value={...}                  │
│   ),                             │
│   usage={                        │
│     prompt_tokens: 200,          │
│     completion_tokens: 150,      │
│     total_tokens: 350            │
│   }                              │
│ )                                │
└──────┬───────────────────────────┘
       │ LLMProviderResponse
       ▼
┌──────────────┐
│ LLM Gateway  │
│ return       │
└──────────────┘
```

### 4. 이미지 생성 플로우 (DesignerAgent)

```
┌──────────────────┐
│ DesignerAgent    │
│ .execute()       │
└────┬─────────────┘
     │ AgentRequest(task="product_image", payload={product_name, ...})
     ▼
┌─────────────────────────────────────────────────────┐
│ 1. LLM Gateway로 영문 프롬프트 생성                  │
│                                                     │
│    role="designer", task="product_image"            │
│    payload={product_name, style, ...}               │
│                                                     │
│    System Prompt:                                   │
│      "당신은 제품 비주얼 전문가..."                  │
│      "ComfyUI용 영문 프롬프트를 생성하세요"          │
│      "DO: professional, clean, well-lit"           │
│      "DON'T: text overlay, dark background"        │
│                                                     │
│    LLM Response:                                    │
│    {                                                │
│      english_prompt: "professional wireless earbuds,│
│                       white background, studio     │
│                       lighting, product photography"│
│      negative_prompt: "text, watermark, dark"      │
│    }                                                │
└────┬────────────────────────────────────────────────┘
     │ english_prompt, negative_prompt
     ▼
┌─────────────────────────────────────────────────────┐
│ 2. Media Gateway로 이미지 생성                       │
│                                                     │
│    MediaGateway.generate_image(                     │
│      prompt=english_prompt,                         │
│      negative_prompt=negative_prompt,               │
│      width=600, height=400,                         │
│      provider="comfyui"  # or "nanobanana"          │
│    )                                                │
└────┬────────────────────────────────────────────────┘
     │ provider="comfyui"
     ▼
┌─────────────────────────────────────────────────────┐
│ ComfyUIProvider.generate()                          │
│                                                     │
│ 3. ComfyUI Workflow 생성                            │
│    workflow_json = {                                │
│      "1": {  # LoadCheckpoint                       │
│        "class_type": "CheckpointLoaderSimple",      │
│        "inputs": {                                  │
│          "ckpt_name": "juggernautXL_v9.safetensors" │
│        }                                            │
│      },                                             │
│      "2": {  # CLIPTextEncode (Positive)            │
│        "class_type": "CLIPTextEncode",              │
│        "inputs": {                                  │
│          "text": english_prompt,                    │
│          "clip": ["1", 1]                           │
│        }                                            │
│      },                                             │
│      "3": {  # CLIPTextEncode (Negative)            │
│        ...                                          │
│      },                                             │
│      "4": {  # EmptyLatentImage                     │
│        "inputs": {width: 600, height: 400}          │
│      },                                             │
│      "5": {  # KSampler                             │
│        ...                                          │
│      },                                             │
│      "6": {  # VAEDecode                            │
│        ...                                          │
│      },                                             │
│      "7": {  # SaveImage                            │
│        ...                                          │
│      }                                              │
│    }                                                │
│                                                     │
│ 4. ComfyUI API 호출                                 │
│    POST http://comfyui:8188/prompt                  │
│    {                                                │
│      prompt: workflow_json,                         │
│      client_id: "sparklio_backend"                  │
│    }                                                │
│                                                     │
│ 5. 폴링으로 완료 대기 (최대 60초)                    │
│    GET /history/{prompt_id}                         │
│    - Status: "Queued" → "Running" → "Completed"     │
│                                                     │
│ 6. 이미지 다운로드                                   │
│    GET /view?filename={output_image.png}            │
│                                                     │
│ 7. Base64 인코딩                                    │
│    image_base64 = base64.b64encode(image_bytes)     │
└────┬────────────────────────────────────────────────┘
     │ ImagePayload(type="base64", data="...", format="png")
     ▼
┌─────────────────────────────────────────────────────┐
│ DesignerAgent                                       │
│                                                     │
│ 8. AgentOutput 생성                                 │
│    outputs = [                                      │
│      AgentOutput(                                   │
│        type="image",                                │
│        name="product_image",                        │
│        value={                                      │
│          type: "base64",                            │
│          data: "iVBORw0KGgoAAAANS...",              │
│          format: "png",                             │
│          english_prompt: "...",                     │
│          dimensions: {width: 600, height: 400}      │
│        }                                            │
│      )                                              │
│    ]                                                │
│                                                     │
│ 9. AgentResponse 반환                               │
└─────────────────────────────────────────────────────┘
```

---

## Agent 활동 패턴

### 1. 단일 Agent 패턴

**사용 사례**: 간단한 작업 (텍스트 생성, 이미지 분석 등)

```
Client → API → Agent → LLM/Media Gateway → Result
```

**예시**:
- Copywriter만 사용하여 SNS 포스트 생성
- VisionAnalyzer만 사용하여 이미지 분석

### 2. Sequential 패턴 (순차 실행)

**사용 사례**: 이전 단계 결과가 다음 단계 입력인 경우

```
Agent A → Agent B → Agent C
  │         │         │
  └─────────┴─────────┴─→ 최종 결과
```

**예시**:
- **ProductContentWorkflow**: Copywriter → Reviewer → Optimizer
- **ContentReviewWorkflow**: Reviewer → Editor → Reviewer (재검토)

### 3. Parallel 패턴 (병렬 실행)

**사용 사례**: 독립적인 작업을 동시에 수행

```
         ┌→ Agent A ─┐
Input ───┼→ Agent B ─┼→ Merge → Result
         └→ Agent C ─┘
```

**예시** (향후 구현):
- 텍스트(Copywriter) + 이미지(Designer) 동시 생성
- 다양한 스타일의 카피 버전 생성 (A/B 테스트용)

### 4. Conditional 패턴 (조건부 실행)

**사용 사례**: 이전 결과에 따라 다른 Agent 실행

```
Agent A → [Score Check] → Score < 7 → Optimizer → Result
                        → Score ≥ 7 → Result
```

**예시** (향후 구현):
- ReviewerAgent 점수가 낮으면 OptimizerAgent 실행
- 에러 발생 시 ErrorHandlerAgent 자동 실행

### 5. Loop 패턴 (반복 실행)

**사용 사례**: 품질 기준 만족할 때까지 반복

```
Copywriter → Reviewer → [Quality Check] → Pass → Result
                ↑              │
                └──── Fail ────┘ (최대 3회)
```

**예시** (향후 구현):
- SelfLearningAgent로 피드백 루프 구성
- 품질 점수 7.0 이상 달성까지 재생성

---

## 워크플로우 상세

### 1. ProductContentWorkflow (제품 콘텐츠 생성)

**목적**: 제품 설명 + 검토 + 최적화 파이프라인

**Steps**:
```python
Step 0: CopywriterAgent
  - task: "product_detail"
  - input: ${initial.product_name}, ${initial.features}, ${initial.target_audience}
  - output: {headline, body, bullets, cta}

Step 1: ReviewerAgent
  - task: "content_review"
  - input: ${step_0.outputs[0].value}  # Copywriter 결과
  - output: {overall_score, strengths, weaknesses, improvements}

Step 2: OptimizerAgent
  - task: "conversion_optimize"
  - input:
      content: ${step_0.outputs[0].value}  # 원본 카피
      review_feedback: ${step_1.outputs[0].value}  # 검토 피드백
  - output: {optimized_content, improvements}
```

**실행 시간**: 평균 8-12초
**사용 토큰**: 평균 800-1200 토큰

**결과 활용**:
- `step_2.outputs[0].value` (최종 최적화된 콘텐츠) → Canvas Document
- `step_1.outputs[0].value.overall_score` → 품질 지표

### 2. BrandIdentityWorkflow (브랜드 아이덴티티)

**목적**: 브랜드 전략 수립 → 메시지 생성 → 일관성 검토

**Steps**:
```python
Step 0: StrategistAgent
  - task: "brand_kit"
  - input: ${initial.brand_name}, ${initial.industry}, ${initial.target_market}
  - output: {brand_positioning, target_persona, key_messages, tone_guidelines}

Step 1: CopywriterAgent
  - task: "brand_message"
  - input: ${step_0.outputs[0].value}  # 브랜드 전략
  - output: {tagline, message, values, promise}

Step 2: ReviewerAgent
  - task: "brand_consistency"
  - input:
      brand_strategy: ${step_0.outputs[0].value}
      brand_message: ${step_1.outputs[0].value}
  - output: {consistency_score, alignment_analysis, recommendations}
```

**실행 시간**: 평균 10-15초
**사용 토큰**: 평균 1000-1500 토큰

### 3. ContentReviewWorkflow (콘텐츠 검토 및 개선)

**목적**: 기존 콘텐츠 검토 → 교정 → 재검토

**Steps**:
```python
Step 0: ReviewerAgent
  - task: "content_review"
  - input: ${initial.content}
  - output: {overall_score, grammar_errors, style_issues, improvements}

Step 1: EditorAgent
  - task: "proofread"
  - input:
      content: ${initial.content}
      review_feedback: ${step_0.outputs[0].value}
  - output: {corrected_content, changes_made}

Step 2: ReviewerAgent (재검토)
  - task: "content_review"
  - input: ${step_1.outputs[0].value}  # 교정된 콘텐츠
  - output: {final_score, quality_improvement}
```

**실행 시간**: 평균 6-10초
**사용 토큰**: 평균 600-1000 토큰

---

## 통합 다이어그램

### 전체 시스템 흐름도

```
┌──────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                           │
│  ┌────────────┐                      ┌─────────────┐          │
│  │  React UI  │◄────────────────────►│PolotnoEditor│          │
│  │ (Frontend) │                      │  (Canvas)   │          │
│  └─────┬──────┘                      └─────────────┘          │
└────────┼─────────────────────────────────────────────────────┘
         │ HTTP/REST API
         │ POST /api/v1/generate
         │ {kind, input, options}
         ▼
┌──────────────────────────────────────────────────────────────┐
│                         API LAYER                             │
│  ┌───────────────────────────────────────────────────────┐   │
│  │ /api/v1/endpoints/generate.py                         │   │
│  │  - generate_content(GenerateRequest)                  │   │
│  │  - list_available_kinds()                             │   │
│  └───────────────────────┬───────────────────────────────┘   │
└────────────────────────┼─────────────────────────────────────┘
                         │ GenerateRequest
                         ▼
┌──────────────────────────────────────────────────────────────┐
│                    ORCHESTRATION LAYER                        │
│  ┌───────────────────────────────────────────────────────┐   │
│  │ GeneratorService                                      │   │
│  │  1. kind → Workflow 매핑                               │   │
│  │  2. initial_payload 준비                              │   │
│  │  3. WorkflowExecutor.execute()                        │   │
│  │  4. Canvas Document 생성                               │   │
│  │  5. GenerateResponse 조립                             │   │
│  └───────────────────────┬───────────────────────────────┘   │
│                          │                                    │
│  ┌───────────────────────▼───────────────────────────────┐   │
│  │ WorkflowExecutor                                      │   │
│  │  - Sequential/Parallel Agent 실행                      │   │
│  │  - Variable Substitution (${initial.*}, ${step_*.*})  │   │
│  │  - Context 관리 및 데이터 전달                          │   │
│  └───────────────────────┬───────────────────────────────┘   │
└────────────────────────┼─────────────────────────────────────┘
                         │ AgentRequest (for each step)
                         ▼
┌──────────────────────────────────────────────────────────────┐
│                       AGENT LAYER (21)                        │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐     │
│  │ Creation Agents (10)                                │     │
│  │  Copywriter, Strategist, Designer, Reviewer,        │     │
│  │  Optimizer, Editor, VisionAnalyzer, ScenePlanner,   │     │
│  │  Template, MeetingAI                                │     │
│  └─────────────────────────────────────────────────────┘     │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐     │
│  │ Intelligence Agents (7)                             │     │
│  │  RAG, Embedder, Ingestor, TrendCollector,           │     │
│  │  DataCleaner, SelfLearning, PerformanceAnalyzer     │     │
│  └─────────────────────────────────────────────────────┘     │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐     │
│  │ System Agents (4)                                   │     │
│  │  PM, QA, ErrorHandler, Logger                       │     │
│  └─────────────────────────────────────────────────────┘     │
│                                                               │
│  공통 패턴:                                                   │
│  1. _validate_request()                                      │
│  2. _enhance_payload()  ← Context Engineering 필드 추가       │
│  3. llm_gateway.generate() or media_gateway.generate()       │
│  4. _parse_response()                                        │
│  5. AgentResponse 반환                                        │
└──────────────┬───────────────────────────┬────────────────────┘
               │                           │
               ▼                           ▼
┌──────────────────────────┐   ┌──────────────────────────┐
│     LLM GATEWAY          │   │    MEDIA GATEWAY         │
│  ┌────────────────────┐  │   │  ┌────────────────────┐  │
│  │ Router             │  │   │  │ ComfyUI Provider   │  │
│  │ - Route by role    │  │   │  │ - Juggernaut XL    │  │
│  └────────────────────┘  │   │  │ - Workflow Build   │  │
│  ┌────────────────────┐  │   │  └────────────────────┘  │
│  │ Context Eng.       │  │   │  ┌────────────────────┐  │
│  │ - enhance_system   │  │   │  │ NanoBanana Prov.   │  │
│  │ - build_prompt     │  │   │  │ - Gemini Imagen 3  │  │
│  └────────────────────┘  │   │  └────────────────────┘  │
│  ┌────────────────────┐  │   │  ┌────────────────────┐  │
│  │ Providers:         │  │   │  │ Mock Provider      │  │
│  │ - Ollama           │  │   │  └────────────────────┘  │
│  │ - OpenAI           │  │   └──────────────────────────┘
│  │ - Anthropic        │  │
│  │ - Gemini           │  │
│  └────────────────────┘  │
└──────────────────────────┘
```

### Agent 간 데이터 흐름 (Variable Substitution)

```
initial_payload = {
  product_name: "무선 이어폰",
  features: ["ANC", "24시간"],
  target_audience: "2030 직장인"
}

Step 0: CopywriterAgent
  Input: ${initial.product_name} → "무선 이어폰"
         ${initial.features} → ["ANC", "24시간"]
         ${initial.target_audience} → "2030 직장인"

  Output: step_0.outputs[0].value = {
    headline: "완벽한 소음 차단의 시작",
    body: "40dB ANC로 몰입감 극대화...",
    bullets: ["40dB ANC - 소음 99% 차단", "24시간 배터리 - 하루 종일"]
  }

Step 1: ReviewerAgent
  Input: ${step_0.outputs[0].value} → {headline: "...", body: "...", ...}

  Output: step_1.outputs[0].value = {
    overall_score: 8,
    strengths: ["구체적 수치 제시", "타겟 니즈 반영"],
    weaknesses: ["CTA 약함"],
    improvements: ["행동 유도 강화 필요"]
  }

Step 2: OptimizerAgent
  Input: content = ${step_0.outputs[0].value}
         review_feedback = ${step_1.outputs[0].value}

  Output: step_2.outputs[0].value = {
    optimized_content: {
      headline: "완벽한 소음 차단의 시작",
      body: "40dB ANC로 몰입감 극대화...",
      bullets: [...],
      cta: "지금 특별가로 만나보세요" ← Optimized
    },
    improvements: ["CTA 강화: 긴급성 추가"]
  }

Final Result: step_2.outputs[0].value.optimized_content → Canvas Document
```

---

## 📊 성능 지표

### Agent별 평균 실행 시간

| Agent | 평균 실행 시간 | 토큰 사용량 | Provider |
|-------|---------------|-------------|----------|
| CopywriterAgent | 2-4초 | 300-500 | Ollama (qwen2.5:7b) |
| StrategistAgent | 4-6초 | 500-800 | OpenAI (gpt-4o-mini) |
| DesignerAgent | 30-40초 | 200 (텍스트) + 이미지 생성 | Ollama + ComfyUI |
| ReviewerAgent | 3-5초 | 400-600 | Anthropic (claude-3.5-haiku) |
| OptimizerAgent | 3-5초 | 400-600 | Ollama (qwen2.5:7b) |
| EditorAgent | 2-3초 | 200-400 | Ollama (qwen2.5:7b) |

### 워크플로우 평균 실행 시간

| Workflow | Steps | 평균 시간 | 토큰 합계 |
|----------|-------|----------|----------|
| ProductContentWorkflow | 3 | 8-12초 | 800-1200 |
| BrandIdentityWorkflow | 3 | 10-15초 | 1000-1500 |
| ContentReviewWorkflow | 3 | 6-10초 | 600-1000 |

---

## 🎯 결론

### 시스템 특징

1. **모듈화**: 21개 Agent가 독립적으로 동작하며 조합 가능
2. **확장성**: 새로운 Agent 추가 시 AgentBase 상속만으로 통합
3. **유연성**: Workflow로 다양한 파이프라인 구성 가능
4. **품질**: Context Engineering으로 출력 품질 향상 (60% → 85%)
5. **추상화**: Gateway 패턴으로 Provider 교체 용이

### 향후 개선 방향

1. **Parallel Workflow**: 병렬 실행으로 성능 향상
2. **Conditional Workflow**: 동적 분기 처리
3. **Loop Workflow**: 품질 기준 기반 반복 실행
4. **Agent Monitoring**: 성능 지표 실시간 추적
5. **Dynamic Routing**: 실시간 부하에 따른 Provider 선택

---

**작성자**: B팀 (Backend)
**작성일**: 2025-11-23
**검토자**: A팀 (QA)

**Status**: 🟢 **ACTIVE**
