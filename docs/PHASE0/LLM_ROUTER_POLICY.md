# LLM Router Policy Document

> **Version**: 1.1
> **Date**: 2025-11-13 (목요일 오후 5:59)
> **Status**: Final
> **Owner**: AI Infrastructure Team

---

## 1. Executive Summary

Smart LLM Router는 작업 특성에 따라 최적의 언어 모델을 자동으로 선택하는 시스템입니다. **비용**, **속도**, **품질**, **프라이버시**를 균형있게 고려하여 모델을 라우팅합니다.

### 1.1 핵심 목표
- **비용 최적화**: 월간 LLM 비용 40% 절감
- **성능 보장**: 응답 시간 SLA 준수
- **품질 유지**: 출력 품질 기준 충족
- **확장성**: 새 모델 쉽게 추가

### 1.2 라우팅 원칙
```
최적 모델 = f(Task, Cost, Latency, Quality, Resource, Privacy)
```

---

## 2. Multi-Node Infrastructure

Sparklio.ai는 **3-Node Hybrid 환경**에서 로컬/클라우드 모델을 유연하게 활용합니다:

```
┌────────────────────────┐     ┌────────────────────────┐     ┌────────────────────────┐
│  🖥 Desktop (주말)      │────│  💻 Laptop (평일)       │────│  🍎 Mac mini M2 (24/7)  │
│  RTX 4070 SUPER        │     │  RTX 4060 Laptop       │     │  M2 + Neural Engine     │
│  • 이미지/영상 추론     │     │  • 개발·시연·프론트     │     │  • API Server          │
│  • 로컬 LLM 7B~13B    │     │  • 테스트 환경          │     │  • DB/Redis            │
│  • Stable Diffusion    │     │  • 프레젠테이션        │     │  • Worker/Scheduler    │
└────────────────────────┘     └────────────────────────┘     └────────────────────────┘
                     Tailscale VPN + MinIO (Media) + Git (Code)
```

### 노드별 역할

- **Desktop (RTX 4070 SUPER)**: 고성능 추론 전담 (SDXL, Llama 70B, Qwen 14B)
- **Laptop (RTX 4060)**: 개발 및 경량 추론 (Llama 8B, Mistral 7B)
- **Mac mini M2**: API 서버 + 데이터베이스 + 스케줄러 상시 운영

### 라우팅 전략

```python
class NodeAwareRouter:
    """
    노드 가용성 기반 라우팅
    """

    async def select_inference_node(
        self,
        model: str,
        task_priority: str
    ) -> str:
        """추론 노드 선택"""

        # Desktop GPU 온라인 체크
        desktop_available = await self.check_node_health('desktop')

        # 고성능 모델 → Desktop 우선
        if model in ['llama-70b', 'sdxl', 'qwen-14b']:
            if desktop_available:
                return 'desktop'
            else:
                # Fallback to cloud
                return 'cloud'

        # 경량 모델 → Laptop 또는 Desktop
        if model in ['llama-8b', 'mistral-7b']:
            laptop_available = await self.check_node_health('laptop')
            if laptop_available:
                return 'laptop'
            elif desktop_available:
                return 'desktop'
            else:
                return 'cloud'

        # 클라우드 모델
        return 'cloud'
```

---

## 3. Model Catalog

### 3.1 Text Generation Models

| Model | Provider | Type | Cost/1K | Latency | Quality | Best For |
|-------|----------|------|---------|---------|---------|----------|
| **GPT-5** | OpenAI | Cloud | $0.015 | 3-6s | ⭐⭐⭐⭐⭐ | 최고 난이도 전략·분석 |
| **GPT-4.1** | OpenAI | Cloud | $0.012 | 2-5s | ⭐⭐⭐⭐⭐ | Complex reasoning |
| **GPT-4-Turbo** | OpenAI | Cloud | $0.01 | 2-5s | ⭐⭐⭐⭐⭐ | Complex reasoning |
| **GPT-4o** | OpenAI | Cloud | $0.005 | 1-3s | ⭐⭐⭐⭐⭐ | Balanced tasks |
| **GPT-4o-mini** | OpenAI | Cloud | $0.0015 | <1s | ⭐⭐⭐⭐ | Fast responses |
| **Claude 3.5 Sonnet** | Anthropic | Cloud | $0.003 | 2-4s | ⭐⭐⭐⭐⭐ | 톤 안정/긴 문서 |
| **Claude 3.5 Haiku** | Anthropic | Cloud | $0.0008 | <1s | ⭐⭐⭐⭐ | Quick tasks |
| **Gemini 2.5 Pro** | Google | Cloud | $0.0025 | 1-2s | ⭐⭐⭐⭐ | Multimodal |
| **Gemini 2.5 Flash** | Google | Cloud | $0.0003 | <1s | ⭐⭐⭐ | 요약/SNS/실시간 챗 |
| **Pi** | Inflection | Cloud | $0.0002 | <1s | ⭐⭐⭐ | 가벼운 어시스트 |
| **Llama 3.1 70B** | Meta | Local | $0.0001* | 3-8s | ⭐⭐⭐⭐ | Private data |
| **Llama 3.1 8B** | Meta | Local | $0.00005* | 1-2s | ⭐⭐⭐ | 프레젠테이션/요약 |
| **Qwen2 14B** | Alibaba | Local | $0.00008* | 2-4s | ⭐⭐⭐⭐ | 템플릿/프레젠테이션 |
| **Mistral 7B** | Mistral | Local | $0.00005* | <1s | ⭐⭐⭐ | 트렌드 분석 |

*Local model costs are estimated based on electricity and hardware amortization

### 3.2 Image Generation Models

| Model | Provider | Type | Cost/Image | Time | Quality | Best For |
|-------|----------|------|------------|------|---------|----------|
| **DALL-E 3** | OpenAI | Cloud | $0.04 | 10-20s | ⭐⭐⭐⭐⭐ | High quality |
| **DALL-E 2** | OpenAI | Cloud | $0.02 | 5-10s | ⭐⭐⭐⭐ | Standard |
| **Midjourney v6** | Midjourney | Cloud | $0.03 | 30-60s | ⭐⭐⭐⭐⭐ | Artistic |
| **NanoBanana** | Custom | Cloud | $0.01 | 5-15s | ⭐⭐⭐⭐ | 썸네일/시각 아이디어 |
| **SD XL** | Stability | Local | $0.001* | 10-30s | ⭐⭐⭐⭐ | 브랜드 특화 LoRA |
| **SD 1.5** | Stability | Local | $0.0005* | 5-15s | ⭐⭐⭐ | Fast local |

### 3.3 Video Generation Models

| Model | Provider | Type | Cost/Sec | Time/Sec | Quality | Best For |
|-------|----------|------|----------|----------|---------|----------|
| **Sora2** | OpenAI | Cloud | $0.50 | 60s | ⭐⭐⭐⭐⭐ | 광고/쇼츠 합성 |
| **Runway Gen-3** | Runway | Cloud | $0.30 | 30s | ⭐⭐⭐⭐ | Standard |
| **Pika Labs** | Pika | Cloud | $0.20 | 20s | ⭐⭐⭐ | Quick drafts |

### 3.4 Embedding Models

| Model | Provider | Dimensions | Cost/1M | Best For |
|-------|----------|------------|---------|----------|
| **text-embedding-ada-002** | OpenAI | 1536 | $0.10 | General |
| **text-embedding-3-small** | OpenAI | 1536 | $0.02 | Cost-effective |
| **voyage-2** | Voyage | 1024 | $0.10 | Quality |
| **e5-large-v2** | Local | 1024 | $0.001* | Private |

---

## 4. Agent Integration

Smart LLM Router는 **AGENTS_SPEC.md**에 정의된 16개 에이전트와 긴밀하게 통합됩니다.

### 4.1 에이전트별 최적 모델 매핑

```python
AGENT_MODEL_PREFERENCES = {
    # Creation Agents
    "StrategistAgent": {
        "primary": ["gpt-5", "claude-3.5-sonnet", "gpt-4.1"],
        "fallback": ["gemini-2.5-pro", "llama-3.1-70b"],
        "preset": "high_fidelity"  # 전략은 품질 우선
    },
    "CopywriterAgent": {
        "primary": ["claude-3.5-sonnet", "gpt-4o"],
        "fallback": ["gemini-2.5-pro", "qwen2-14b"],
        "preset": "balanced"  # 톤·스타일 일관성 중요
    },
    "VisionGeneratorAgent": {
        "primary": ["dall-e-3", "nanobanana"],
        "fallback": ["sdxl"],
        "preset": "high_fidelity"  # 브랜드 이미지는 품질 우선
    },
    "VideoDirectorAgent": {
        "primary": ["gpt-4o", "gemini-2.5-pro"],
        "fallback": ["claude-3.5-sonnet"],
        "preset": "balanced"
    },

    # Intelligence Agents
    "TrendCollectorAgent": {
        "primary": ["gemini-2.5-flash", "pi"],
        "fallback": ["mistral-7b"],
        "preset": "draft_fast"  # 빠른 요약 우선
    },
    "DataCleanerAgent": {
        "primary": ["gemini-2.5-flash", "gpt-4o-mini"],
        "fallback": ["llama-3.1-8b"],
        "preset": "cost_optimized"  # 대량 처리, 비용 최소화
    },
    "RAGAgent": {
        "primary": ["gpt-4o", "claude-3.5-sonnet"],
        "fallback": ["gemini-2.5-pro", "llama-3.1-70b"],
        "preset": "balanced"  # 정확도와 속도 균형
    },
    "ReviewerAgent": {
        "primary": ["claude-3.5-sonnet", "gpt-4o"],
        "fallback": ["gemini-2.5-pro"],
        "preset": "high_fidelity"  # 품질 평가는 정확도 중요
    },
    "PerformanceAnalyzerAgent": {
        "primary": ["gpt-4o", "gemini-2.5-pro"],
        "fallback": ["llama-3.1-70b"],
        "preset": "balanced"
    },

    # System Agents
    "PMAgent": {
        "primary": ["gpt-4o", "claude-3.5-sonnet"],
        "fallback": ["gemini-2.5-pro"],
        "preset": "balanced"  # 워크플로 조율
    },
    "BudgetAgent": {
        "primary": ["gemini-2.5-flash", "gpt-4o-mini"],
        "fallback": ["mistral-7b"],
        "preset": "cost_optimized"  # 비용 추적은 경량 모델
    },
    "ADAgent": {
        "primary": ["gpt-4o", "gemini-2.5-pro"],
        "fallback": ["claude-3.5-sonnet"],
        "preset": "balanced"  # 광고 최적화
    }
}
```

### 4.2 에이전트 호출 패턴

```python
class AgentAwareLLMRouter:
    """
    에이전트 컨텍스트 기반 라우팅
    """

    async def route_for_agent(
        self,
        agent_name: str,
        task: Dict[str, Any],
        override_preset: Optional[str] = None
    ) -> SelectedModel:
        """에이전트별 최적 모델 선택"""

        # 에이전트 프리퍼런스 로드
        preferences = AGENT_MODEL_PREFERENCES.get(agent_name, {})
        preset = override_preset or preferences.get("preset", "balanced")

        # 작업 분석
        task_obj = self.analyze_task(task, agent_name)

        # 우선순위 모델 시도
        for model_name in preferences.get("primary", []):
            if await self.is_available(model_name):
                return await self.select_model(
                    task_obj,
                    mode=f"preset:{preset}",
                    preferred_model=model_name
                )

        # Fallback 모델
        for model_name in preferences.get("fallback", []):
            if await self.is_available(model_name):
                return await self.select_model(
                    task_obj,
                    mode=f"preset:{preset}",
                    preferred_model=model_name
                )

        # 최후 자동 선택
        return await self.auto_select(task_obj)
```

### 4.3 Brand Learning Engine 통합

**BRAND_LEARNING_ENGINE.md**의 Self-Learning Loop에서 생성되는 브랜드 벡터를 라우팅에 활용:

```python
class BrandAwareLLMRouter:
    """
    브랜드 일관성 기반 라우팅
    """

    async def select_with_brand_context(
        self,
        task: Task,
        brand_id: str
    ) -> SelectedModel:
        """브랜드 컨텍스트 기반 모델 선택"""

        # 브랜드 벡터 로드
        brand_vector = await self.load_brand_vector(brand_id)

        # 모델별 브랜드 일관성 점수
        consistency_scores = {}
        for model in self.get_candidates(task):
            # 이전 생성물의 브랜드 일관성 히스토리
            history = await self.get_brand_consistency_history(
                brand_id,
                model.name
            )
            consistency_scores[model.name] = np.mean(history) if history else 0.7

        # 기존 점수에 브랜드 일관성 가중치 추가
        adjusted_scores = {}
        for model in self.get_candidates(task):
            base_score = self.calculator.calculate_score(task, model)
            brand_score = consistency_scores[model.name]

            # 브랜드 일관성을 20% 가중치로 반영
            adjusted_scores[model.name] = (
                base_score * 0.8 + brand_score * 0.2
            )

        best_model_name = max(adjusted_scores, key=adjusted_scores.get)
        return self.models.get(best_model_name)
```

---

## 5. Routing Algorithm

### 5.1 Score Calculation

```python
class RouterScoreCalculator:
    """
    라우팅 점수 계산기
    """

    def __init__(self):
        self.weights = {
            'cost': 0.3,      # 비용 가중치
            'latency': 0.25,  # 지연시간 가중치
            'quality': 0.25,  # 품질 가중치
            'resource': 0.1,  # 리소스 가중치
            'privacy': 0.1    # 프라이버시 가중치
        }

    def calculate_score(self, task: Task, model: Model) -> float:
        """
        종합 점수 계산
        Score = Σ(weight_i × normalized_score_i)
        """

        scores = {
            'cost': self.cost_score(task, model),
            'latency': self.latency_score(task, model),
            'quality': self.quality_score(task, model),
            'resource': self.resource_score(task, model),
            'privacy': self.privacy_score(task, model)
        }

        # Normalize scores to [0, 1]
        normalized = self.normalize_scores(scores)

        # Calculate weighted sum
        total = sum(
            self.weights[key] * normalized[key]
            for key in scores
        )

        return total

    def cost_score(self, task: Task, model: Model) -> float:
        """비용 점수 (낮을수록 좋음)"""
        estimated_tokens = task.estimated_tokens
        cost = model.cost_per_1k * (estimated_tokens / 1000)

        # Inverse score: lower cost = higher score
        max_acceptable_cost = 1.0  # $1
        return max(0, 1 - (cost / max_acceptable_cost))

    def latency_score(self, task: Task, model: Model) -> float:
        """지연시간 점수 (낮을수록 좋음)"""
        estimated_latency = model.base_latency + (
            task.estimated_tokens * model.tokens_per_second
        )

        # SLA based scoring
        if task.priority == 'realtime':
            target_latency = 1.0  # 1 second
        elif task.priority == 'interactive':
            target_latency = 5.0  # 5 seconds
        else:
            target_latency = 30.0  # 30 seconds

        return max(0, 1 - (estimated_latency / target_latency))

    def quality_score(self, task: Task, model: Model) -> float:
        """품질 점수 (높을수록 좋음)"""
        # Task-specific quality requirements
        quality_matrix = {
            'reasoning': {
                'gpt-4-turbo': 1.0,
                'claude-3.5-sonnet': 0.95,
                'gemini-2.5-pro': 0.9,
                'llama-3.1-70b': 0.85
            },
            'creative': {
                'claude-3.5-sonnet': 1.0,
                'gpt-4-turbo': 0.95,
                'gemini-2.5-pro': 0.85,
                'llama-3.1-70b': 0.8
            },
            'summarization': {
                'gemini-2.5-flash': 0.9,
                'gpt-4o-mini': 0.85,
                'claude-3.5-haiku': 0.9,
                'llama-3.1-8b': 0.75
            }
        }

        task_type = task.type
        model_name = model.name

        if task_type in quality_matrix:
            return quality_matrix[task_type].get(model_name, 0.5)
        return 0.7  # Default quality score

    def resource_score(self, task: Task, model: Model) -> float:
        """리소스 가용성 점수"""
        if model.type == 'local':
            # Check GPU availability
            gpu_available = self.check_gpu_availability()
            gpu_memory_free = self.get_gpu_memory_free()

            if not gpu_available:
                return 0.0

            # Check if model fits in memory
            if model.memory_requirement > gpu_memory_free:
                return 0.0

            # Score based on utilization
            utilization = self.get_gpu_utilization()
            return max(0, 1 - (utilization / 100))
        else:
            # Cloud models: check rate limits
            rate_limit_usage = self.get_rate_limit_usage(model)
            return max(0, 1 - rate_limit_usage)

    def privacy_score(self, task: Task, model: Model) -> float:
        """프라이버시 점수"""
        if task.contains_pii or task.confidential:
            # Prefer local models for sensitive data
            return 1.0 if model.type == 'local' else 0.2
        return 0.7  # Neutral for non-sensitive data
```

### 5.2 Model Selection Logic

```python
class SmartRouter:
    """
    스마트 LLM 라우터
    """

    def __init__(self):
        self.calculator = RouterScoreCalculator()
        self.models = ModelRegistry()
        self.cache = ModelSelectionCache()

    async def select_model(
        self,
        task: Task,
        mode: str = 'auto'
    ) -> SelectedModel:
        """
        최적 모델 선택
        """

        # Check cache
        cache_key = self.get_cache_key(task)
        if cached := self.cache.get(cache_key):
            return cached

        if mode == 'auto':
            model = await self.auto_select(task)
        elif mode == 'manual':
            model = await self.manual_select(task)
        elif mode == 'preset':
            model = await self.preset_select(task)
        else:
            raise ValueError(f"Unknown mode: {mode}")

        # Cache the selection
        self.cache.set(cache_key, model, ttl=300)

        return model

    async def auto_select(self, task: Task) -> SelectedModel:
        """자동 모델 선택"""

        # Get eligible models
        candidates = await self.get_candidates(task)

        # Calculate scores
        scores = {}
        for model in candidates:
            score = self.calculator.calculate_score(task, model)
            scores[model.name] = score

        # Select best model
        best_model_name = max(scores, key=scores.get)
        best_model = self.models.get(best_model_name)

        # Check if cost warning needed
        if self.needs_cost_warning(task, best_model):
            await self.send_cost_warning(task, best_model)

        return SelectedModel(
            model=best_model,
            score=scores[best_model_name],
            reasoning=self.explain_selection(task, best_model, scores)
        )

    async def get_candidates(self, task: Task) -> List[Model]:
        """작업에 적합한 후보 모델 필터링"""
        all_models = self.models.get_all()
        candidates = []

        for model in all_models:
            # Check capability match
            if not self.check_capability(task, model):
                continue

            # Check availability
            if not await self.check_availability(model):
                continue

            # Check budget constraint
            if not self.check_budget(task, model):
                continue

            candidates.append(model)

        if not candidates:
            raise NoSuitableModelError(task)

        return candidates
```

### 5.3 Preset Configurations

README.md에 정의된 3가지 프리셋 모드를 포함한 총 5가지 프리셋:

#### 5.3.1 Draft Fast (빠른 초안)

**용도**: 빠른 초안 생성 (속도 우선)
- **가중치**: 속도 50%, 비용 20%, 품질 20%
- **최적 모델**: Gemini Flash, GPT-4o-mini, Pi, Mistral
- **사용 케이스**: SNS 카피 초안, 트렌드 요약, 간단한 질문 응답

#### 5.3.2 Balanced (균형)

**용도**: 균형잡힌 품질과 속도
- **가중치**: 품질 25%, 속도 25%, 비용 25%, 리소스 15%, 프라이버시 10%
- **최적 모델**: GPT-4o, Claude Sonnet, Gemini Pro, Llama 70B
- **사용 케이스**: 대부분의 일반적인 작업 (기본값)

#### 5.3.3 High-Fidelity (최고 품질)

**용도**: 최고 품질 (품질 우선)
- **가중치**: 품질 60%, 비용 10%, 속도 10%
- **최적 모델**: GPT-5, GPT-4.1, Claude Sonnet
- **사용 케이스**: 전략 브리프, 중요 카피, 브랜드 이미지, 프레젠테이션

#### 5.3.4 Privacy First (프라이버시 우선)

**용도**: 로컬 모델만 사용
- **가중치**: 프라이버시 50%, 품질 20%, 비용 10%
- **최적 모델**: Llama 70B/8B, Qwen 14B, Mistral 7B
- **사용 케이스**: 민감 데이터 처리, 내부 문서, 개인정보 포함

#### 5.3.5 Cost Optimized (비용 최적화)

**용도**: 비용 최소화
- **가중치**: 비용 60%, 속도 15%, 품질 15%
- **최적 모델**: 로컬 모델 우선 → Gemini Flash
- **사용 케이스**: 대량 데이터 처리, 크롤링 후 요약, 배치 작업

```python
ROUTER_PRESETS = {
    "draft_fast": {
        "description": "빠른 초안 생성 (속도 우선)",
        "korean_name": "Draft Fast",
        "weights": {
            "cost": 0.2,
            "latency": 0.5,  # 속도 우선
            "quality": 0.2,
            "resource": 0.05,
            "privacy": 0.05
        },
        "preferred_models": [
            "gemini-2.5-flash",
            "gpt-4o-mini",
            "pi",
            "claude-3.5-haiku",
            "mistral-7b"
        ]
    },

    "balanced": {
        "description": "균형잡힌 품질과 속도",
        "korean_name": "Balanced",
        "weights": {
            "cost": 0.25,
            "latency": 0.25,
            "quality": 0.25,
            "resource": 0.15,
            "privacy": 0.1
        },
        "preferred_models": [
            "gpt-4o",
            "claude-3.5-sonnet",
            "gemini-2.5-pro",
            "llama-3.1-70b"
        ]
    },

    "high_fidelity": {
        "description": "최고 품질 (품질 우선)",
        "korean_name": "High-Fidelity",
        "weights": {
            "cost": 0.1,
            "latency": 0.1,
            "quality": 0.6,  # 품질 우선
            "resource": 0.1,
            "privacy": 0.1
        },
        "preferred_models": [
            "gpt-5",
            "gpt-4.1",
            "gpt-4-turbo",
            "claude-3.5-sonnet"
        ]
    },

    "privacy_first": {
        "description": "로컬 모델만 사용 (프라이버시 우선)",
        "korean_name": "Privacy First",
        "weights": {
            "cost": 0.1,
            "latency": 0.1,
            "quality": 0.2,
            "resource": 0.1,
            "privacy": 0.5  # 프라이버시 우선
        },
        "preferred_models": [
            "llama-3.1-70b",
            "llama-3.1-8b",
            "qwen2-14b",
            "mistral-7b"
        ]
    },

    "cost_optimized": {
        "description": "비용 최소화",
        "korean_name": "Cost Optimized",
        "weights": {
            "cost": 0.6,  # 비용 우선
            "latency": 0.15,
            "quality": 0.15,
            "resource": 0.05,
            "privacy": 0.05
        },
        "preferred_models": [
            "mistral-7b",
            "llama-3.1-8b",
            "gemini-2.5-flash",
            "claude-3.5-haiku"
        ]
    }
}
```

---

## 6. Task Classification

### 6.1 Task Types

```python
class TaskClassifier:
    """
    작업 유형 분류기
    """

    TASK_TYPES = {
        "reasoning": {
            "keywords": ["analyze", "solve", "explain", "understand"],
            "complexity": "high",
            "token_estimate": "high",
            "quality_requirement": "critical"
        },
        "creative": {
            "keywords": ["create", "generate", "imagine", "design"],
            "complexity": "medium",
            "token_estimate": "medium",
            "quality_requirement": "high"
        },
        "summarization": {
            "keywords": ["summarize", "brief", "outline", "highlight"],
            "complexity": "low",
            "token_estimate": "low",
            "quality_requirement": "medium"
        },
        "translation": {
            "keywords": ["translate", "convert", "localize"],
            "complexity": "medium",
            "token_estimate": "medium",
            "quality_requirement": "high"
        },
        "extraction": {
            "keywords": ["extract", "find", "identify", "parse"],
            "complexity": "low",
            "token_estimate": "low",
            "quality_requirement": "medium"
        },
        "conversation": {
            "keywords": ["chat", "discuss", "talk", "respond"],
            "complexity": "low",
            "token_estimate": "low",
            "quality_requirement": "medium"
        },
        "coding": {
            "keywords": ["code", "program", "implement", "debug"],
            "complexity": "high",
            "token_estimate": "high",
            "quality_requirement": "critical"
        }
    }

    def classify(self, task_description: str) -> TaskType:
        """작업 유형 자동 분류"""
        lower_desc = task_description.lower()

        scores = {}
        for task_type, config in self.TASK_TYPES.items():
            score = sum(
                1 for keyword in config["keywords"]
                if keyword in lower_desc
            )
            scores[task_type] = score

        # Return task with highest score
        best_type = max(scores, key=scores.get)

        return TaskType(
            name=best_type,
            config=self.TASK_TYPES[best_type]
        )
```

### 6.2 Context Requirements

```python
CONTEXT_REQUIREMENTS = {
    "brand_analysis": {
        "required_context": ["brand_kit", "industry", "target_audience"],
        "optimal_models": ["gpt-4o", "claude-3.5-sonnet"],
        "fallback_models": ["llama-3.1-70b"]
    },
    "marketing_brief": {
        "required_context": ["campaign_goal", "budget", "timeline"],
        "optimal_models": ["claude-3.5-sonnet", "gpt-4-turbo"],
        "fallback_models": ["gemini-2.5-pro"]
    },
    "product_description": {
        "required_context": ["product_info", "target_market", "competitors"],
        "optimal_models": ["gpt-4o", "claude-3.5-sonnet"],
        "fallback_models": ["qwen2-14b"]
    },
    "social_media": {
        "required_context": ["platform", "audience", "tone"],
        "optimal_models": ["gemini-2.5-flash", "gpt-4o-mini"],
        "fallback_models": ["llama-3.1-8b"]
    },
    "presentation": {
        "required_context": ["topic", "audience_level", "duration"],
        "optimal_models": ["gpt-4-turbo", "claude-3.5-sonnet"],
        "fallback_models": ["llama-3.1-70b"]
    }
}
```

---

## 7. Cost Management

README.md에 정의된 비용 경보 시스템을 포함한 종합 비용 관리:

### 7.1 비용 경보 시스템 (Cost Alert System)

영상·대용량 작업 시 예상 비용/시간 팝업 고지 및 사용자 승인:

```python
class CostAlertSystem:
    """
    비용 경보 시스템
    """

    def __init__(self):
        self.thresholds = {
            'warning': 1.0,   # $1 이상
            'approval': 5.0,  # $5 이상 승인 필요
            'critical': 20.0  # $20 이상 critical 경고
        }

    async def check_cost_alert(
        self,
        task: Task,
        selected_model: Model
    ) -> CostAlertResult:
        """비용 경보 확인"""

        # 예상 비용 계산
        estimated_cost = self.estimate_cost(task, selected_model)
        estimated_time = self.estimate_time(task, selected_model)

        # 경보 수준 결정
        if estimated_cost >= self.thresholds['critical']:
            return CostAlertResult(
                level='critical',
                cost=estimated_cost,
                time=estimated_time,
                requires_approval=True,
                message=f"⚠️ 높은 비용 예상: ${estimated_cost:.2f}\n"
                        f"예상 소요 시간: {estimated_time}초\n"
                        f"계속 진행하시겠습니까?"
            )
        elif estimated_cost >= self.thresholds['approval']:
            return CostAlertResult(
                level='approval',
                cost=estimated_cost,
                time=estimated_time,
                requires_approval=True,
                message=f"💰 예상 비용: ${estimated_cost:.2f}\n"
                        f"예상 소요 시간: {estimated_time}초\n"
                        f"승인하시겠습니까?"
            )
        elif estimated_cost >= self.thresholds['warning']:
            return CostAlertResult(
                level='warning',
                cost=estimated_cost,
                time=estimated_time,
                requires_approval=False,
                message=f"ℹ️ 예상 비용: ${estimated_cost:.2f}"
            )

        return CostAlertResult(level='none', cost=estimated_cost)

    def estimate_cost(self, task: Task, model: Model) -> float:
        """비용 예측"""

        if task.type == 'video_generation':
            # 영상 생성: 초당 비용
            duration_seconds = task.params.get('duration', 30)
            return model.cost_per_second * duration_seconds

        elif task.type == 'image_generation':
            # 이미지 생성: 이미지당 비용
            num_images = task.params.get('num_images', 1)
            return model.cost_per_image * num_images

        else:
            # 텍스트 생성: 토큰당 비용
            estimated_tokens = task.estimated_tokens
            return model.cost_per_1k * (estimated_tokens / 1000)

    def estimate_time(self, task: Task, model: Model) -> int:
        """시간 예측 (초)"""

        if task.type == 'video_generation':
            duration = task.params.get('duration', 30)
            return int(duration * model.time_per_second)

        elif task.type == 'image_generation':
            num_images = task.params.get('num_images', 1)
            return int(num_images * model.time_per_image)

        else:
            return int(task.estimated_tokens / model.tokens_per_second)
```

### 7.2 실시간 비용 대시보드

```python
class CostDashboard:
    """
    실시간 비용 대시보드
    """

    async def get_realtime_stats(
        self,
        user_id: str
    ) -> DashboardStats:
        """실시간 통계 조회"""

        now = datetime.utcnow()
        today_start = now.replace(hour=0, minute=0, second=0)

        return DashboardStats(
            # 오늘 사용량
            today={
                'total_cost': await self.get_cost(user_id, today_start, now),
                'total_requests': await self.get_request_count(user_id, today_start, now),
                'by_model': await self.get_cost_by_model(user_id, today_start, now)
            },

            # 이번 달 사용량
            this_month={
                'total_cost': await self.get_monthly_cost(user_id),
                'budget_remaining': await self.get_budget_remaining(user_id),
                'trend': await self.get_cost_trend(user_id)
            },

            # 한도 정보
            limits={
                'daily_limit': 100.0,
                'daily_used': await self.get_daily_usage(user_id),
                'daily_remaining': await self.get_daily_remaining(user_id),
                'warning_level': await self.get_warning_level(user_id)
            },

            # 최근 작업
            recent_tasks=await self.get_recent_tasks(user_id, limit=10)
        )

    async def get_warning_level(self, user_id: str) -> str:
        """경고 수준 조회"""
        usage = await self.get_daily_usage(user_id)
        limit = 100.0

        usage_percentage = (usage / limit) * 100

        if usage_percentage >= 90:
            return 'critical'
        elif usage_percentage >= 70:
            return 'warning'
        elif usage_percentage >= 50:
            return 'caution'
        else:
            return 'normal'
```

### 7.3 Budget Controls

```python
class BudgetManager:
    """
    예산 관리자
    """

    def __init__(self):
        self.daily_limit = 100.0  # $100 per day
        self.hourly_limit = 10.0  # $10 per hour
        self.per_user_limit = 5.0  # $5 per user per day

    async def check_budget(
        self,
        user_id: str,
        estimated_cost: float
    ) -> BudgetCheckResult:
        """예산 확인"""

        # Get current usage
        daily_usage = await self.get_daily_usage()
        hourly_usage = await self.get_hourly_usage()
        user_usage = await self.get_user_usage(user_id)

        # Check limits
        checks = {
            "daily": daily_usage + estimated_cost <= self.daily_limit,
            "hourly": hourly_usage + estimated_cost <= self.hourly_limit,
            "user": user_usage + estimated_cost <= self.per_user_limit
        }

        if all(checks.values()):
            return BudgetCheckResult(
                approved=True,
                remaining_budget=min(
                    self.daily_limit - daily_usage,
                    self.hourly_limit - hourly_usage,
                    self.per_user_limit - user_usage
                )
            )

        return BudgetCheckResult(
            approved=False,
            reason=self.get_rejection_reason(checks),
            alternatives=await self.suggest_alternatives(estimated_cost)
        )

    async def suggest_alternatives(
        self,
        original_cost: float
    ) -> List[Alternative]:
        """저렴한 대안 제시"""
        alternatives = []

        # Suggest cheaper models
        if original_cost > 0.1:
            alternatives.append(Alternative(
                suggestion="Use Gemini Flash instead",
                estimated_cost=original_cost * 0.1,
                quality_impact="Minor reduction in quality"
            ))

        # Suggest local models
        if self.check_local_availability():
            alternatives.append(Alternative(
                suggestion="Use local Llama model",
                estimated_cost=original_cost * 0.01,
                quality_impact="Moderate reduction, longer processing"
            ))

        # Suggest batching
        alternatives.append(Alternative(
            suggestion="Batch with other requests",
            estimated_cost=original_cost * 0.7,
            quality_impact="Increased latency"
        ))

        return alternatives
```

### 7.4 Cost Tracking

```python
class CostTracker:
    """
    비용 추적기
    """

    def __init__(self):
        self.db = CostDatabase()
        self.alerts = AlertSystem()

    async def track_usage(
        self,
        request_id: str,
        user_id: str,
        model: str,
        tokens: int,
        cost: float
    ):
        """사용량 기록"""

        # Record in database
        await self.db.insert({
            "request_id": request_id,
            "user_id": user_id,
            "model": model,
            "tokens": tokens,
            "cost": cost,
            "timestamp": datetime.utcnow()
        })

        # Check for anomalies
        if await self.is_anomaly(user_id, cost):
            await self.alerts.send(
                level="warning",
                message=f"Unusual cost spike for user {user_id}: ${cost}"
            )

        # Update aggregates
        await self.update_aggregates(user_id, model, cost)

    async def get_usage_report(
        self,
        start_date: datetime,
        end_date: datetime
    ) -> UsageReport:
        """사용량 리포트 생성"""

        data = await self.db.query_range(start_date, end_date)

        return UsageReport(
            total_cost=sum(d["cost"] for d in data),
            total_tokens=sum(d["tokens"] for d in data),
            by_model=self.aggregate_by_model(data),
            by_user=self.aggregate_by_user(data),
            by_day=self.aggregate_by_day(data),
            top_users=self.get_top_users(data, limit=10),
            cost_trend=self.calculate_trend(data)
        )
```

---

## 8. Performance Optimization

### 8.1 Caching Strategy

```python
class ModelResponseCache:
    """
    모델 응답 캐싱
    """

    def __init__(self):
        self.redis = Redis()
        self.ttl = {
            "reasoning": 3600,      # 1 hour
            "creative": 1800,       # 30 minutes
            "summarization": 7200,  # 2 hours
            "translation": 86400,   # 24 hours
            "extraction": 7200,     # 2 hours
        }

    async def get(
        self,
        prompt_hash: str,
        model: str
    ) -> Optional[CachedResponse]:
        """캐시 조회"""
        key = f"llm:cache:{model}:{prompt_hash}"
        cached = await self.redis.get(key)

        if cached:
            return CachedResponse(
                content=cached["content"],
                cached_at=cached["timestamp"],
                model=model,
                hit=True
            )

        return None

    async def set(
        self,
        prompt_hash: str,
        model: str,
        response: str,
        task_type: str
    ):
        """캐시 저장"""
        key = f"llm:cache:{model}:{prompt_hash}"
        ttl = self.ttl.get(task_type, 1800)

        await self.redis.set(
            key,
            {
                "content": response,
                "timestamp": datetime.utcnow().isoformat(),
                "task_type": task_type
            },
            ex=ttl
        )

    def should_cache(self, task: Task) -> bool:
        """캐싱 여부 결정"""
        # Don't cache personalized content
        if task.is_personalized:
            return False

        # Don't cache time-sensitive content
        if task.is_time_sensitive:
            return False

        # Don't cache if contains PII
        if task.contains_pii:
            return False

        return True
```

### 8.2 Batching Strategy

```python
class RequestBatcher:
    """
    요청 배칭
    """

    def __init__(self):
        self.batch_window = 100  # milliseconds
        self.max_batch_size = 10
        self.pending = defaultdict(list)

    async def add_request(
        self,
        request: ModelRequest
    ) -> ModelResponse:
        """배치에 요청 추가"""

        # Check if batching is beneficial
        if not self.should_batch(request):
            return await self.process_single(request)

        # Add to pending batch
        batch_key = self.get_batch_key(request)
        future = asyncio.Future()

        self.pending[batch_key].append({
            "request": request,
            "future": future
        })

        # Start batch timer if first in batch
        if len(self.pending[batch_key]) == 1:
            asyncio.create_task(
                self.process_batch_after_delay(batch_key)
            )

        # Process immediately if batch is full
        if len(self.pending[batch_key]) >= self.max_batch_size:
            await self.process_batch(batch_key)

        return await future

    async def process_batch(self, batch_key: str):
        """배치 처리"""
        batch = self.pending.pop(batch_key, [])
        if not batch:
            return

        # Combine requests
        combined_request = self.combine_requests(
            [item["request"] for item in batch]
        )

        # Process combined request
        try:
            response = await self.send_to_model(combined_request)
            responses = self.split_response(response, len(batch))

            # Resolve futures
            for item, resp in zip(batch, responses):
                item["future"].set_result(resp)

        except Exception as e:
            # Reject all futures
            for item in batch:
                item["future"].set_exception(e)
```

---

## 9. Fallback & Error Handling

### 9.1 Fallback Chain

```python
class FallbackChain:
    """
    폴백 체인 관리
    """

    FALLBACK_CHAINS = {
        "gpt-4-turbo": ["gpt-4o", "claude-3.5-sonnet", "llama-3.1-70b"],
        "claude-3.5-sonnet": ["gpt-4o", "gemini-2.5-pro", "llama-3.1-70b"],
        "gemini-2.5-flash": ["gpt-4o-mini", "claude-3.5-haiku", "mistral-7b"],
        "dall-e-3": ["dall-e-2", "sdxl", "sd-1.5"],
        "sora2": ["runway-gen3", "pika-labs"]
    }

    async def execute_with_fallback(
        self,
        primary_model: str,
        request: ModelRequest
    ) -> ModelResponse:
        """폴백 체인 실행"""

        chain = [primary_model] + self.FALLBACK_CHAINS.get(primary_model, [])

        for model in chain:
            try:
                # Check availability
                if not await self.check_availability(model):
                    continue

                # Try model
                response = await self.execute_model(model, request)

                # Log fallback usage
                if model != primary_model:
                    await self.log_fallback(primary_model, model, "success")

                return response

            except ModelError as e:
                # Log error
                await self.log_error(model, e)

                # Check if retryable
                if not self.is_retryable(e):
                    raise

                # Continue to next model
                continue

        # All models failed
        raise AllModelsFailed(chain)

    def is_retryable(self, error: ModelError) -> bool:
        """재시도 가능 여부 판단"""
        non_retryable = [
            "invalid_api_key",
            "insufficient_quota",
            "content_policy_violation"
        ]
        return error.code not in non_retryable
```

### 9.2 Circuit Breaker

```python
class CircuitBreaker:
    """
    서킷 브레이커
    """

    def __init__(self):
        self.failure_threshold = 5
        self.success_threshold = 2
        self.timeout = 60  # seconds
        self.states = {}  # model -> state

    async def call(
        self,
        model: str,
        func: Callable,
        *args,
        **kwargs
    ):
        """서킷 브레이커를 통한 호출"""

        state = self.get_state(model)

        if state == "open":
            # Check if timeout passed
            if self.should_attempt_reset(model):
                state = "half_open"
            else:
                raise CircuitOpenError(model)

        try:
            result = await func(*args, **kwargs)
            self.on_success(model)
            return result

        except Exception as e:
            self.on_failure(model)
            raise

    def get_state(self, model: str) -> str:
        """현재 상태 조회"""
        if model not in self.states:
            self.states[model] = {
                "state": "closed",
                "failures": 0,
                "successes": 0,
                "last_failure": None
            }
        return self.states[model]["state"]

    def on_success(self, model: str):
        """성공 처리"""
        state = self.states[model]
        state["failures"] = 0
        state["successes"] += 1

        if state["state"] == "half_open":
            if state["successes"] >= self.success_threshold:
                state["state"] = "closed"
                state["successes"] = 0

    def on_failure(self, model: str):
        """실패 처리"""
        state = self.states[model]
        state["failures"] += 1
        state["successes"] = 0
        state["last_failure"] = time.time()

        if state["failures"] >= self.failure_threshold:
            state["state"] = "open"
```

---

## 10. Monitoring & Analytics

### 10.1 Metrics Collection

```python
class RouterMetrics:
    """
    라우터 메트릭 수집
    """

    def __init__(self):
        self.prometheus = PrometheusClient()

    # Counter metrics
    model_selections = Counter(
        'router_model_selections_total',
        'Total model selections',
        ['model', 'task_type', 'preset']
    )

    # Histogram metrics
    selection_latency = Histogram(
        'router_selection_latency_seconds',
        'Model selection latency',
        ['task_type']
    )

    model_latency = Histogram(
        'model_response_latency_seconds',
        'Model response latency',
        ['model', 'task_type']
    )

    # Gauge metrics
    model_cost_rate = Gauge(
        'model_cost_dollars_per_hour',
        'Current cost rate',
        ['model']
    )

    cache_hit_rate = Gauge(
        'router_cache_hit_rate',
        'Cache hit rate',
        ['task_type']
    )

    # Summary metrics
    quality_scores = Summary(
        'model_quality_scores',
        'Quality scores by model',
        ['model', 'task_type']
    )

    async def record_selection(
        self,
        model: str,
        task_type: str,
        preset: str,
        latency: float
    ):
        """모델 선택 기록"""
        self.model_selections.labels(
            model=model,
            task_type=task_type,
            preset=preset
        ).inc()

        self.selection_latency.labels(
            task_type=task_type
        ).observe(latency)

    async def record_response(
        self,
        model: str,
        task_type: str,
        latency: float,
        tokens: int,
        cost: float
    ):
        """응답 기록"""
        self.model_latency.labels(
            model=model,
            task_type=task_type
        ).observe(latency)

        # Update cost rate
        current_rate = await self.calculate_cost_rate(model)
        self.model_cost_rate.labels(model=model).set(current_rate)
```

### 10.2 Analytics Dashboard

```python
class RouterAnalytics:
    """
    라우터 분석 대시보드
    """

    async def get_dashboard_data(
        self,
        time_range: str = "24h"
    ) -> DashboardData:
        """대시보드 데이터 생성"""

        return DashboardData(
            # Model usage distribution
            model_usage=await self.get_model_usage(time_range),

            # Cost breakdown
            cost_breakdown=await self.get_cost_breakdown(time_range),

            # Performance metrics
            performance={
                "avg_latency": await self.get_avg_latency(time_range),
                "p95_latency": await self.get_p95_latency(time_range),
                "error_rate": await self.get_error_rate(time_range)
            },

            # Quality metrics
            quality={
                "avg_quality_score": await self.get_avg_quality(time_range),
                "user_satisfaction": await self.get_satisfaction(time_range)
            },

            # Efficiency metrics
            efficiency={
                "cache_hit_rate": await self.get_cache_hit_rate(time_range),
                "fallback_rate": await self.get_fallback_rate(time_range),
                "batch_efficiency": await self.get_batch_efficiency(time_range)
            },

            # Top users
            top_users=await self.get_top_users(time_range, limit=10),

            # Anomalies
            anomalies=await self.detect_anomalies(time_range)
        )

    async def generate_optimization_report(self) -> OptimizationReport:
        """최적화 리포트 생성"""

        return OptimizationReport(
            recommendations=[
                {
                    "title": "Increase cache TTL for translations",
                    "impact": "Reduce costs by 15%",
                    "implementation": "Update cache TTL from 1h to 24h"
                },
                {
                    "title": "Use local models for simple tasks",
                    "impact": "Reduce costs by 30%",
                    "implementation": "Route summarization tasks to Llama-8B"
                }
            ],
            potential_savings=await self.calculate_potential_savings(),
            performance_improvements=await self.identify_bottlenecks()
        )
```

---

## 11. Configuration Management

### 11.1 Router Configuration

```yaml
# router_config.yaml
router:
  version: "1.0"
  mode: "auto"  # auto | manual | preset

  # Weight configuration
  weights:
    cost: 0.3
    latency: 0.25
    quality: 0.25
    resource: 0.1
    privacy: 0.1

  # Model registry
  models:
    - name: "gpt-4-turbo"
      enabled: true
      endpoint: "${OPENAI_API_ENDPOINT}"
      api_key: "${OPENAI_API_KEY}"
      max_tokens: 128000
      timeout: 30

    - name: "llama-3.1-70b"
      enabled: true
      type: "local"
      model_path: "/models/llama-70b.gguf"
      gpu_layers: 40
      context_size: 8192

  # Budget limits
  budget:
    daily_limit: 100.0
    hourly_limit: 10.0
    per_user_daily: 5.0
    warning_threshold: 0.8

  # Cache configuration
  cache:
    enabled: true
    ttl:
      default: 1800
      reasoning: 3600
      creative: 1800
      summarization: 7200
      translation: 86400

  # Fallback configuration
  fallback:
    enabled: true
    max_attempts: 3
    timeout: 5

  # Monitoring
  monitoring:
    metrics_enabled: true
    metrics_port: 9090
    log_level: "INFO"
    trace_sampling: 0.1
```

### 11.2 Dynamic Configuration

```python
class DynamicConfig:
    """
    동적 설정 관리
    """

    def __init__(self):
        self.config_source = ConfigSource()
        self.update_interval = 60  # seconds
        self.callbacks = []

    async def start(self):
        """설정 업데이트 시작"""
        while True:
            try:
                new_config = await self.config_source.fetch()
                if self.has_changed(new_config):
                    await self.apply_config(new_config)
                    await self.notify_callbacks(new_config)
            except Exception as e:
                logger.error(f"Config update failed: {e}")

            await asyncio.sleep(self.update_interval)

    async def apply_config(self, config: dict):
        """설정 적용"""
        # Update weights
        if "weights" in config:
            RouterScoreCalculator.weights = config["weights"]

        # Update limits
        if "budget" in config:
            BudgetManager.daily_limit = config["budget"]["daily_limit"]

        # Update model states
        if "models" in config:
            for model_config in config["models"]:
                await self.update_model_state(model_config)

    def register_callback(self, callback: Callable):
        """설정 변경 콜백 등록"""
        self.callbacks.append(callback)

    async def notify_callbacks(self, new_config: dict):
        """콜백 알림"""
        for callback in self.callbacks:
            try:
                await callback(new_config)
            except Exception as e:
                logger.error(f"Callback failed: {e}")
```

---

## 12. Testing & Validation

### 12.1 Router Testing

```python
import pytest
from unittest.mock import Mock, patch

class TestSmartRouter:

    @pytest.fixture
    def router(self):
        return SmartRouter()

    @pytest.mark.asyncio
    async def test_cost_optimized_selection(self, router):
        """비용 최적화 선택 테스트"""
        task = Task(
            type="summarization",
            estimated_tokens=1000,
            priority="low",
            contains_pii=False
        )

        # Mock model availability
        with patch.object(router, 'check_availability', return_value=True):
            selected = await router.select_model(task, mode='preset:cost_optimized')

            assert selected.model.name in ["gemini-2.5-flash", "mistral-7b"]
            assert selected.score > 0.7

    @pytest.mark.asyncio
    async def test_privacy_constraint(self, router):
        """프라이버시 제약 테스트"""
        task = Task(
            type="analysis",
            estimated_tokens=2000,
            contains_pii=True,
            confidential=True
        )

        selected = await router.select_model(task)

        # Should select local model
        assert selected.model.type == "local"
        assert selected.model.name in ["llama-3.1-70b", "llama-3.1-8b", "qwen2-14b"]

    @pytest.mark.asyncio
    async def test_fallback_chain(self, router):
        """폴백 체인 테스트"""
        task = Task(type="reasoning", estimated_tokens=5000)

        # Mock primary model failure
        with patch.object(router, 'execute_model') as mock_execute:
            mock_execute.side_effect = [
                ModelError("rate_limit"),  # Primary fails
                ModelResponse(content="Success")  # Fallback succeeds
            ]

            response = await router.execute_with_fallback("gpt-4-turbo", task)

            assert response.content == "Success"
            assert mock_execute.call_count == 2

    @pytest.mark.asyncio
    async def test_budget_enforcement(self, router):
        """예산 제한 테스트"""
        task = Task(
            type="creative",
            estimated_tokens=100000  # Very large
        )

        # Mock budget exceeded
        with patch.object(BudgetManager, 'check_budget') as mock_budget:
            mock_budget.return_value = BudgetCheckResult(
                approved=False,
                reason="Daily limit exceeded"
            )

            with pytest.raises(BudgetExceededError):
                await router.select_model(task)
```

### 12.2 Performance Testing

```python
class PerformanceTest:
    """
    성능 테스트
    """

    async def test_selection_latency(self):
        """선택 지연시간 테스트"""
        router = SmartRouter()
        latencies = []

        for _ in range(100):
            task = self.generate_random_task()
            start = time.time()
            await router.select_model(task)
            latencies.append(time.time() - start)

        assert np.percentile(latencies, 50) < 0.1  # P50 < 100ms
        assert np.percentile(latencies, 95) < 0.5  # P95 < 500ms

    async def test_concurrent_routing(self):
        """동시 라우팅 테스트"""
        router = SmartRouter()
        tasks = [self.generate_random_task() for _ in range(100)]

        start = time.time()
        results = await asyncio.gather(*[
            router.select_model(task) for task in tasks
        ])
        duration = time.time() - start

        assert len(results) == 100
        assert duration < 5.0  # Should handle 100 requests in < 5s
```

---

## 13. Migration & Rollout

### 13.1 Rollout Strategy

```python
class RouterRollout:
    """
    라우터 배포 전략
    """

    def __init__(self):
        self.phases = [
            {
                "name": "Phase 1: Shadow Mode",
                "duration": "1 week",
                "traffic": "0%",
                "description": "Log decisions without routing"
            },
            {
                "name": "Phase 2: Canary",
                "duration": "1 week",
                "traffic": "10%",
                "description": "Route 10% of traffic"
            },
            {
                "name": "Phase 3: Progressive",
                "duration": "2 weeks",
                "traffic": "10% -> 50%",
                "description": "Gradual increase"
            },
            {
                "name": "Phase 4: Full Rollout",
                "duration": "Ongoing",
                "traffic": "100%",
                "description": "Complete migration"
            }
        ]

    async def should_use_new_router(
        self,
        user_id: str,
        phase: int
    ) -> bool:
        """새 라우터 사용 여부 결정"""

        if phase == 1:
            # Shadow mode: always use old, log new
            await self.log_shadow_decision(user_id)
            return False

        traffic_percentage = self.get_traffic_percentage(phase)
        user_hash = hash(user_id) % 100

        return user_hash < traffic_percentage
```

### 13.2 Rollback Plan

```python
class RollbackManager:
    """
    롤백 관리
    """

    async def check_health_metrics(self) -> HealthStatus:
        """헬스 메트릭 확인"""
        metrics = await self.collect_metrics()

        if metrics.error_rate > 0.05:  # > 5% errors
            return HealthStatus.UNHEALTHY

        if metrics.p95_latency > 5.0:  # > 5 seconds
            return HealthStatus.DEGRADED

        if metrics.cost_spike > 2.0:  # 2x cost increase
            return HealthStatus.WARNING

        return HealthStatus.HEALTHY

    async def automatic_rollback(self):
        """자동 롤백"""
        health = await self.check_health_metrics()

        if health == HealthStatus.UNHEALTHY:
            logger.error("Unhealthy metrics detected, rolling back")
            await self.rollback()
            await self.alert_team("Automatic rollback triggered")

    async def rollback(self):
        """롤백 실행"""
        # Switch to previous router version
        await self.switch_router_version("previous")

        # Clear caches
        await self.clear_caches()

        # Reset configurations
        await self.reset_configs()

        logger.info("Rollback completed")
```

---

## 14. Appendix

### 14.1 Model Comparison Matrix

| Capability | GPT-4 | Claude 3.5 | Gemini 2.5 | Llama 3.1 |
|------------|-------|------------|------------|-----------|
| Reasoning | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| Creativity | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| Speed | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| Cost | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Context | 128K | 200K | 1M | 128K |
| Multi-modal | ✅ | ❌ | ✅ | ❌ |
| Code | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |

### 14.2 Cost Calculation Examples

```python
# Example: Blog post generation (2000 words)
# Estimated tokens: 3000 input + 2500 output = 5500 total

costs = {
    "gpt-4-turbo": 5.5 * 0.01 = 0.055,     # $0.055
    "gpt-4o": 5.5 * 0.005 = 0.0275,        # $0.0275
    "claude-3.5-sonnet": 5.5 * 0.003 = 0.0165,  # $0.0165
    "gemini-2.5-flash": 5.5 * 0.0003 = 0.00165, # $0.00165
    "llama-3.1-70b": 5.5 * 0.0001 = 0.00055,    # $0.00055 (local)
}
```

### 14.3 References

- [OpenAI Pricing](https://openai.com/pricing)
- [Anthropic Claude Pricing](https://anthropic.com/pricing)
- [Google AI Pricing](https://ai.google.dev/pricing)
- [Local LLM Benchmarks](https://github.com/eugeneyan/open-llms)

### 14.4 Change Log

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| 2025-01-13 | 1.0 | Initial policy | AI Team |
| 2025-11-13 (목) | 1.1 | Multi-Node Infrastructure, Agent Integration, Cost Alert System 추가 | AI Team |
