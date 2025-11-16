---
doc_id: ARCH-002
title: Gateway Pattern 설계
created: 2025-11-16
updated: 2025-11-16
status: approved
phase: Phase 1 - Gateway 구축
priority: P0
authors: A팀 (Claude + QA)
supersedes: K:\obsidian-k\Sparklio_ai_marketing_studio\최종계획\LLM\002. LLM Gateway Spec v1.0.md
related:
  - ARCH-001: System Overview
  - SPEC-001: LLM Gateway Spec
  - SPEC-002: Media Gateway Spec
  - DEC-001: Why Gateway Pattern
---

# Gateway Pattern 설계

## TL;DR (30초 요약)

**핵심 원칙**: 모든 AI 모델 호출은 Gateway를 통해서만 가능
- **Agent**: Gateway만 호출 (직접 모델 호출 금지)
- **Gateway**: Provider 라우팅 + API Contract 유지
- **Provider**: 실제 모델 호출 (Ollama, GPT, ComfyUI 등)

**장점**: Provider 교체 시 Agent 코드 수정 불필요

---

## 목차

1. [Gateway Pattern이란?](#gateway-pattern이란)
2. [왜 Gateway Pattern인가?](#왜-gateway-pattern인가)
3. [Gateway 레이어 구조](#gateway-레이어-구조)
4. [Provider 인터페이스](#provider-인터페이스)
5. [Router 설계](#router-설계)
6. [Mock / Live 모드](#mock--live-모드)
7. [확장 시나리오](#확장-시나리오)

---

## Gateway Pattern이란?

### 기본 개념

```
❌ 나쁜 설계 (직접 호출)

Agent → Ollama
     → ComfyUI
     → GPT
     → DALL·E

문제점:
- Agent가 모든 Provider를 알아야 함
- Provider 교체 시 모든 Agent 수정 필요
- 테스트 시 Mock 처리 어려움
```

```
✅ Gateway Pattern (간접 호출)

Agent → LLM Gateway → Router → Provider (Ollama | GPT | Claude)
     → Media Gateway → Router → Provider (ComfyUI | DALL·E)

장점:
- Agent는 Gateway만 알면 됨
- Provider 교체 시 Gateway 내부만 수정
- Mock/Live 모드 전환 쉬움
- API Contract 불변
```

### Gateway의 책임

1. **요청 정규화**: Agent 요청을 표준 포맷으로 변환
2. **Provider 라우팅**: role/task/mode 기준으로 적절한 Provider 선택
3. **에러 통일**: Provider별 에러를 표준 포맷으로 변환
4. **로깅/모니터링**: 모든 호출 기록, 비용 추적
5. **Mock 처리**: GENERATOR_MODE에 따라 Mock/Live 분기

---

## 왜 Gateway Pattern인가?

### 문제 상황 (Before)

**2025-11-15 테스트 타임아웃 사건**:
- Backend API 테스트 189개 중 대부분 타임아웃
- 원인: Generator API가 실제 LLM/ComfyUI 호출 시도
- Mock 모드 없이 모든 테스트가 실제 모델 호출
- Ollama/ComfyUI가 연결되지 않아 타임아웃

**문제 분석**:
```python
# Agent 코드 (Before)
import ollama

class CopywriterAgent:
    def generate(self, brief):
        # ❌ 직접 Ollama 호출
        response = ollama.generate(
            model="qwen2.5:14b",  # 하드코딩
            prompt=f"Generate copy for {brief}"
        )
        return response
```

문제점:
1. 모델명 하드코딩 (`qwen2.5:14b`)
2. 직접 Ollama 호출 (테스트 시 Mock 불가)
3. Ollama → GPT 변경 시 모든 Agent 수정 필요
4. 에러 처리 각자 구현 (일관성 없음)

### 해결 방안 (After)

```python
# Agent 코드 (After)
from app.services.clients.llm_client import LLMGatewayClient

class CopywriterAgent:
    def __init__(self):
        self.llm_client = LLMGatewayClient()

    def generate(self, brief):
        # ✅ Gateway 호출
        response = await self.llm_client.generate(
            role="copywriter",  # 역할만 명시
            task="product_detail",
            payload={"brief": brief}
        )
        return response
```

장점:
1. 모델 선택은 Gateway Router가 결정
2. GENERATOR_MODE=mock 시 자동으로 Mock 응답
3. Ollama → GPT 변경해도 Agent 코드 수정 불필요
4. 에러 포맷 통일

---

## Gateway 레이어 구조

### 3계층 구조

```
┌──────────────────────────────────────────┐
│  Agent Layer                             │
│  - Brief / Brand / Strategist / ...      │
│  - Gateway Client 사용                    │
└───────────────┬──────────────────────────┘
                │ HTTP Request
┌───────────────▼──────────────────────────┐
│  Gateway API Layer                       │
│  - Validation                            │
│  - Normalization                         │
│  - Logging                               │
│  - Mock/Live 분기                         │
└───────────────┬──────────────────────────┘
                │ Router 호출
┌───────────────▼──────────────────────────┐
│  Router Layer                            │
│  - role/task/mode 기반 라우팅             │
│  - Provider 선택                          │
│  - 모델 선택                              │
└───────────────┬──────────────────────────┘
                │ Provider 호출
┌───────────────▼──────────────────────────┐
│  Provider Layer                          │
│  - OllamaProvider                        │
│  - OpenAIProvider (미래)                 │
│  - AnthropicProvider (미래)              │
└───────────────┬──────────────────────────┘
                │ 실제 모델 API
┌───────────────▼──────────────────────────┐
│  Model API                               │
│  - Ollama (Desktop)                      │
│  - OpenAI API (미래)                     │
│  - Anthropic API (미래)                  │
└──────────────────────────────────────────┘
```

### 계층별 책임

#### 1. Gateway API Layer
```python
# /api/v1/llm/generate

async def llm_generate(request: LLMGenerateRequest):
    # 1. Validation
    validate_request(request)

    # 2. Mock/Live 분기
    if settings.GENERATOR_MODE == "mock":
        return get_mock_response(request.role, request.task)

    # 3. Router 호출
    provider_id, model = router.route(
        role=request.role,
        task=request.task,
        mode=request.mode
    )

    # 4. Provider 호출
    provider = get_provider(provider_id)
    result = await provider.generate(...)

    # 5. Logging
    log_usage(provider_id, model, result.usage)

    return result
```

#### 2. Router Layer
```python
class LLMRouter:
    def route(self, role, task, mode):
        # role 기반 라우팅
        if role in ["strategist", "copywriter"]:
            return ("ollama_qwen25_14b", "qwen2.5:14b")

        if role in ["brief", "brand", "reviewer"]:
            return ("ollama_qwen25_7b", "qwen2.5:7b")

        # task 기반 라우팅
        if task == "heavy_reasoning":
            return ("ollama_mistral_small", "mistral-small")

        # 기본값
        return ("ollama_qwen25_7b", "qwen2.5:7b")
```

#### 3. Provider Layer
```python
class OllamaProvider(LLMProvider):
    def __init__(self):
        self.base_url = settings.OLLAMA_BASE_URL

    async def generate(self, prompt, role, task, mode, options):
        # Ollama API 호출
        response = await http_client.post(
            f"{self.base_url}/api/generate",
            json={
                "model": options.get("model"),
                "prompt": prompt,
                "stream": False
            }
        )

        # 표준 응답 포맷으로 변환
        return LLMProviderResponse(
            provider="ollama",
            model=options.get("model"),
            output=response["response"],
            usage={"total_tokens": response.get("total_duration", 0)}
        )
```

---

## Provider 인터페이스

### LLM Provider 인터페이스

```python
from abc import ABC, abstractmethod

class LLMProvider(ABC):
    @property
    @abstractmethod
    def vendor(self) -> str:
        """Provider 벤더명: 'ollama' | 'openai' | 'anthropic' | 'google'"""
        pass

    @property
    @abstractmethod
    def supports_json(self) -> bool:
        """JSON 모드 지원 여부"""
        pass

    @abstractmethod
    async def generate(
        self,
        prompt: str,
        role: str,
        task: str,
        mode: str,
        options: Dict[str, Any]
    ) -> LLMProviderResponse:
        """실제 LLM 호출"""
        pass
```

### 구현 예시

```python
class OllamaProvider(LLMProvider):
    vendor = "ollama"
    supports_json = True

    async def generate(self, prompt, role, task, mode, options):
        # Ollama 구현
        ...

class OpenAIProvider(LLMProvider):
    vendor = "openai"
    supports_json = True

    async def generate(self, prompt, role, task, mode, options):
        # 미래 구현
        raise NotImplementedError(
            "OpenAIProvider is not implemented yet. "
            "See provider_config.yaml to enable it later."
        )
```

---

## Router 설계

### 라우팅 규칙 (Phase 1)

```yaml
# provider_config.yaml
llm_routing:
  rules:
    - role: [strategist, copywriter]
      provider: ollama
      model: qwen2.5:14b
      reason: "복잡한 카피/전략 작업은 14B 모델 필요"

    - role: [brief, brand, reviewer]
      provider: ollama
      model: qwen2.5:7b
      reason: "빠른 응답이 필요한 작업"

    - role: [vision]
      provider: ollama
      model: qwen2.5:7b
      reason: "이미지 프롬프트는 짧고 자주 호출"

    - task: [heavy_reasoning]
      provider: ollama
      model: mistral-small
      reason: "고급 추론 작업"

    - task: [tagging, short_summary]
      provider: ollama
      model: llama3.2
      reason: "경량 작업"

  default:
    provider: ollama
    model: qwen2.5:7b
```

### 미래 라우팅 규칙 (Phase 3)

```yaml
# provider_config.yaml (확장 버전)
llm_routing:
  rules:
    # Draft 모드 (빠름, 무료)
    - role: [strategist]
      mode: draft
      provider: ollama
      model: qwen2.5:14b

    # Final 모드 (느림, 유료, 고품질)
    - role: [strategist]
      mode: final
      provider: anthropic
      model: claude-3-5-sonnet-20241022

    # 특정 브랜드는 GPT 사용
    - brand_id: premium_clients
      provider: openai
      model: gpt-4o
```

---

## Mock / Live 모드

### 환경 변수 분리

```bash
# .env (기본)
GENERATOR_MODE=live

# .env.test (테스트용)
GENERATOR_MODE=mock

# .env.e2e (E2E 테스트용)
GENERATOR_MODE=live
```

### Mock 응답 구조

```python
# Mock 응답은 Live 응답과 **완전히 동일한 구조**
MOCK_RESPONSES = {
    ("brief", "marketing_brief"): {
        "provider": "mock_ollama",
        "model": "qwen2.5:7b",
        "usage": {
            "prompt_tokens": 100,
            "completion_tokens": 200,
            "total_tokens": 300
        },
        "output": {
            "type": "json",
            "content": '{"target":"20-30대","positioning":"..."}'
        }
    }
}
```

### Gateway에서 Mock 처리

```python
async def llm_generate(request: LLMGenerateRequest):
    if settings.GENERATOR_MODE == "mock":
        # Mock 응답 반환
        mock_key = (request.role, request.task)
        if mock_key in MOCK_RESPONSES:
            return MOCK_RESPONSES[mock_key]
        else:
            # 기본 Mock 응답
            return generate_default_mock(request)

    # Live 모드: 실제 Provider 호출
    ...
```

### 테스트 분리

```bash
# 빠른 통합 테스트 (Mock 모드, 30초)
GENERATOR_MODE=mock npm run test:backend

# E2E 테스트 (Live 모드, 3분)
GENERATOR_MODE=live npm run test:e2e:gateway
```

---

## 확장 시나리오

### 시나리오 1: Ollama → GPT로 특정 Agent만 변경

**요구사항**: StrategistAgent만 GPT-4o 사용

**변경 사항**:
1. `.env`에 `OPENAI_API_KEY` 추가
2. `OpenAIProvider` 구현
3. `provider_config.yaml` 수정:
   ```yaml
   - role: [strategist]
     provider: openai
     model: gpt-4o
   ```

**Agent 코드 수정**: 불필요 ✅

### 시나리오 2: Draft/Final 모드 추가

**요구사항**: 빠른 초안은 Ollama, 최종본은 Claude 사용

**변경 사항**:
1. Request에 `mode: "draft" | "final"` 추가
2. Router 규칙 확장:
   ```yaml
   - mode: draft
     provider: ollama
   - mode: final
     provider: anthropic
   ```

**Agent 코드 수정**: `mode` 파라미터만 추가 ✅

### 시나리오 3: ComfyUI → DALL·E 변경

**요구사항**: 특정 워크플로는 DALL·E 3 사용

**변경 사항**:
1. `DalleProvider` 구현
2. Media Gateway Router 규칙:
   ```yaml
   - kind: high_quality_hero
     provider: dalle
   - kind: product_shot
     provider: comfyui
   ```

**VisionGeneratorAgent 코드 수정**: 불필요 ✅

---

## 핵심 원칙 (반드시 지킬 것)

### ✅ 해야 할 것

1. **API Contract 불변성**
   - Provider가 바뀌어도 Request/Response 포맷 동일
   - Agent는 Gateway API 변경 없이 계속 동작

2. **Provider 인터페이스 준수**
   - 모든 Provider는 동일한 ABC 구현
   - 표준 응답 포맷 반환

3. **설정 기반 라우팅**
   - 모델 선택은 YAML/환경변수로
   - 코드에 모델명 하드코딩 금지

4. **Mock 응답 = Live 응답**
   - 필드명, 타입 완전히 동일
   - Mock으로 테스트한 코드가 Live에서도 동작

### ❌ 절대 금지

1. **Agent에서 직접 모델 호출**
   ```python
   # ❌ 금지
   import ollama
   response = ollama.generate(...)

   # ✅ 필수
   response = await llm_client.generate(role="...", task="...")
   ```

2. **모델명 하드코딩**
   ```python
   # ❌ 금지
   model = "qwen2.5:14b"

   # ✅ 필수
   # Router가 자동 선택
   ```

3. **Provider별 로직을 Gateway API에 노출**
   ```python
   # ❌ 금지
   if provider == "ollama":
       # Ollama 전용 처리

   # ✅ 필수
   # Provider 내부에서 처리
   ```

4. **확장을 고려하지 않은 if/else**
   ```python
   # ❌ 금지
   if provider == "ollama":
       ...
   elif provider == "gpt":
       ...
   # 새 Provider 추가 시 코드 수정 필요

   # ✅ 필수
   provider = get_provider(provider_id)
   result = await provider.generate(...)
   # 새 Provider 추가해도 코드 수정 불필요
   ```

---

## 관련 문서

### 필수 읽기
- [SPEC-001: LLM Gateway Spec](../specs/LLM_GATEWAY_SPEC_v1.0.md)
- [SPEC-002: Media Gateway Spec](../specs/MEDIA_GATEWAY_SPEC_v1.0.md)

### 배경
- [DEC-001: Why Gateway Pattern](../decisions/2025-11-16_001_WHY_GATEWAY.md)
- [DEC-002: Ollama First Strategy](../decisions/2025-11-16_002_OLLAMA_FIRST.md)

### 구현
- [B팀 작업 지시서](../requests/BACKEND_LLM_GATEWAY_WORK_ORDER.md)

---

**작성**: 2025-11-16 by A팀 (Claude + QA)
**승인**: PM
**다음 리뷰**: Phase 1 완료 후
