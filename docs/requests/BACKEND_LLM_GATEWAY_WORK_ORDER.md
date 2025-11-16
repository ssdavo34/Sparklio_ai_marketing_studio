# B팀 작업 지시서: LLM/Media Gateway 구축

**작성일**: 2025-11-16
**담당 팀**: B팀 (Backend 개발)
**프로젝트**: Sparklio v4 - AI Gateway 아키텍처 구축
**총 예상 기간**: 5일
**우선순위**: 🔴 **최고**

---

## 🎯 핵심 목표

**지금 당장**: 006번 방식으로 최소 동작 버전 완성 (Ollama + ComfyUI)
**중요 원칙**: ⭐ **향후 확장을 고려한 설계** (GPT, Claude, DALL·E, Veo3 등)

### ⚠️ 절대 원칙 (반드시 지킬 것)

1. **확장 가능한 Provider 패턴 사용**
   - 현재는 Ollama만 구현하지만, OpenAI/Anthropic/Google 추가 시 **코드 수정 최소화**
   - Provider 인터페이스를 명확히 정의하고 **모든 Provider가 동일한 인터페이스 구현**

2. **설정 기반 라우팅**
   - 모델 선택 로직을 **하드코딩 금지**
   - `config.yaml` 또는 환경변수로 **Provider/모델 변경 가능**하게

3. **API Contract 불변성**
   - `/api/v1/llm/generate` 스펙은 **Provider 추가와 무관하게 동일**
   - 상위 레이어(Agent, Editor)는 **Gateway만 의존**, Provider 모름

4. **미래 Provider를 위한 스켈레톤 코드 포함**
   - `OpenAIProvider`, `AnthropicProvider`, `DalleProvider` 등 **클래스는 생성**
   - 실제 구현은 `TODO` 주석, 나중에 채우기만 하면 됨

---

## 📋 작업 범위 요약

### Phase 1: Gateway 기초 구축 (2.5일, 19시간)
LLM Gateway + Media Gateway를 Mock/Live 모드로 구현

### Phase 2: Agent 리팩터링 (1.25일, 10시간)
6개 Agent가 Gateway만 사용하도록 수정

### Phase 3: E2E 스크립트 (0.75일, 6시간)
"상품 상세 + 이미지 1장" 전체 플로우 스크립트

### Phase 4: 테스트 지원 (0.25일, 2시간)
Mock 응답 개선 및 타임아웃 최적화

---

## 🏗️ Phase 1: Gateway 기초 구축 (19시간)

### 작업 1.1: Backend 디렉토리 구조 생성 (0.5시간)

**목표**: 확장 가능한 디렉토리 구조

```
backend/app/
├── api/v1/endpoints/
│   ├── llm_gateway.py          # LLM Gateway 엔드포인트
│   └── media_gateway.py        # Media Gateway 엔드포인트
│
├── services/
│   ├── llm/
│   │   ├── gateway.py          # LLM Gateway 메인 로직
│   │   ├── router.py           # role/task → Provider/Model 라우팅
│   │   ├── prompt_builder.py   # 프롬프트 정규화
│   │   └── providers/
│   │       ├── base.py         # LLMProvider 인터페이스 (ABC)
│   │       ├── ollama.py       # OllamaProvider 구현 ✅
│   │       ├── openai.py       # OpenAIProvider 스켈레톤 (TODO)
│   │       ├── anthropic.py    # AnthropicProvider 스켈레톤 (TODO)
│   │       └── gemini.py       # GeminiProvider 스켈레톤 (TODO)
│   │
│   └── media/
│       ├── gateway.py          # Media Gateway 메인 로직
│       └── providers/
│           ├── base.py         # ImageProvider 인터페이스 (ABC)
│           ├── comfyui.py      # ComfyUIProvider 구현 ✅
│           ├── dalle.py        # DalleProvider 스켈레톤 (TODO)
│           └── nanobanana.py   # NanobananaProvider 스켈레톤 (TODO)
│
├── core/
│   ├── config.py               # GENERATOR_MODE, Provider 설정
│   └── provider_config.yaml    # Provider 활성화/비활성화, 모델 맵핑
│
└── schemas/
    ├── llm_gateway.py          # LLMGatewayRequest/Response
    └── media_gateway.py        # ImageRequest/Response
```

**중요**:
- `providers/base.py`는 **Abstract Base Class(ABC)** 사용
- 새 Provider 추가 시 **base.py 수정 없이** 새 파일만 추가

---

### 작업 1.2: GENERATOR_MODE 환경변수 추가 (0.5시간)

**파일**: `backend/.env`

```env
# ============================================
# Generator Mode (⭐ 핵심 설정)
# ============================================
GENERATOR_MODE=mock  # mock | live

# ============================================
# LLM Providers
# ============================================

# Ollama (Desktop Docker) - 현재 사용 중
OLLAMA_BASE_URL=http://100.120.180.42:11434
OLLAMA_DEFAULT_MODEL=qwen2.5:7b
OLLAMA_TIMEOUT=120

# OpenAI (미래 확장)
# OPENAI_API_KEY=sk-...
# OPENAI_DEFAULT_MODEL=gpt-4o
# OPENAI_TIMEOUT=60

# Anthropic (미래 확장)
# ANTHROPIC_API_KEY=sk-ant-...
# ANTHROPIC_DEFAULT_MODEL=claude-3-5-sonnet-20241022
# ANTHROPIC_TIMEOUT=60

# Google Gemini (미래 확장)
# GOOGLE_API_KEY=AIza...
# GEMINI_DEFAULT_MODEL=gemini-2.0-flash-exp
# GEMINI_TIMEOUT=60

# ============================================
# Media Providers
# ============================================

# ComfyUI (Desktop Standalone) - 현재 사용 중
COMFYUI_BASE_URL=http://100.120.180.42:8188
COMFYUI_WORKFLOW_DIR=workflows/
COMFYUI_TIMEOUT=300

# DALL·E (미래 확장)
# DALLE_API_KEY=sk-...  # OpenAI API 키 재사용
# DALLE_MODEL=dall-e-3
# DALLE_TIMEOUT=60

# Nanobanana (미래 확장)
# NANOBANANA_API_KEY=...
# NANOBANANA_BASE_URL=https://api.nanobanana.ai/v1
# NANOBANANA_TIMEOUT=60
```

**중요**:
- 주석 처리된 Provider 설정도 **모두 포함**
- 나중에 주석 해제만 하면 활성화되도록

---

### 작업 1.3: Provider 설정 파일 (YAML)

**파일**: `backend/app/core/provider_config.yaml`

```yaml
# ============================================
# Provider 활성화 설정
# ============================================
providers:
  llm:
    # 현재 활성화된 Provider
    active:
      - ollama

    # 미래 확장용 (현재 비활성)
    available:
      - openai
      - anthropic
      - gemini

  media:
    # 현재 활성화된 Provider
    active:
      - comfyui

    # 미래 확장용 (현재 비활성)
    available:
      - dalle
      - nanobanana

# ============================================
# LLM Router 규칙 (role/task → provider/model)
# ============================================
llm_routing:
  # 현재: 모두 Ollama
  rules:
    - role: [strategist, copywriter]
      provider: ollama
      model: qwen2.5:14b
      priority: 1

    - role: [brief, brand, editor, reviewer]
      provider: ollama
      model: qwen2.5:7b
      priority: 2

    - task: [heavy_reasoning]
      provider: ollama
      model: mistral-small
      priority: 3

    - task: [short_summary, tagging]
      provider: ollama
      model: llama3.2
      priority: 4

  # 미래: Cloud Provider 추가 시
  # future_rules:
  #   - role: [strategist]
  #     mode: final
  #     provider: anthropic
  #     model: claude-3-5-sonnet-20241022
  #
  #   - role: [copywriter]
  #     mode: final
  #     provider: openai
  #     model: gpt-4o

# ============================================
# Media Router 규칙 (kind → provider)
# ============================================
media_routing:
  image:
    - kind: [product_shot, hero, concept]
      provider: comfyui
      priority: 1

    # 미래 확장
    # - kind: [thumbnail]
    #   mode: final
    #   provider: dalle
    #   priority: 2
```

**중요**:
- 주석으로 미래 확장 규칙 **예시 포함**
- Priority 기반 폴백 가능하게 설계

---

### 작업 1.4: Provider 인터페이스 정의

**파일**: `backend/app/services/llm/providers/base.py`

```python
from abc import ABC, abstractmethod
from typing import Dict, Any, List
from pydantic import BaseModel

class LLMProviderResponse(BaseModel):
    """모든 LLM Provider의 응답 표준 포맷"""
    provider: str
    model: str
    usage: Dict[str, int]  # {prompt_tokens, completion_tokens, total_tokens}
    output: Dict[str, Any]  # {type, content, parsed}
    meta: Dict[str, Any]  # {latency_ms, ...}

class LLMProvider(ABC):
    """
    LLM Provider 공통 인터페이스

    ⭐ 확장 원칙:
    1. 모든 Provider는 이 인터페이스를 구현해야 함
    2. 새 Provider 추가 시 이 파일 수정 금지
    3. generate() 메서드 시그니처는 불변
    """

    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.name = self.__class__.__name__

    @property
    @abstractmethod
    def vendor(self) -> str:
        """
        Provider 벤더명
        Returns: 'ollama' | 'openai' | 'anthropic' | 'google'
        """
        pass

    @property
    @abstractmethod
    def supports_json(self) -> bool:
        """JSON mode 지원 여부"""
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
        """
        LLM 생성 요청

        Args:
            prompt: 최종 프롬프트 문자열 (Prompt Builder에서 생성)
            role: Agent 역할 (strategist, copywriter, ...)
            task: 비즈니스 태스크 (product_detail, ...)
            mode: chat | json | tools
            options: {temperature, max_tokens, model, ...}

        Returns:
            LLMProviderResponse: 표준 응답 포맷
        """
        pass

    @abstractmethod
    async def health_check(self) -> bool:
        """Provider 연결 상태 확인"""
        pass
```

**중요**:
- `ABC` 사용하여 인터페이스 강제
- 모든 Provider가 **동일한 메서드 시그니처** 사용
- 주석에 확장 원칙 명시

---

### 작업 1.5: OllamaProvider 구현 (4시간)

**파일**: `backend/app/services/llm/providers/ollama.py`

```python
import httpx
import time
from typing import Dict, Any
from .base import LLMProvider, LLMProviderResponse

class OllamaProvider(LLMProvider):
    """
    Ollama Provider 구현

    연결 대상: Desktop Docker (http://100.120.180.42:11434)
    모델: qwen2.5:7b/14b, mistral-small, llama3.2
    """

    @property
    def vendor(self) -> str:
        return "ollama"

    @property
    def supports_json(self) -> bool:
        return True  # Ollama는 JSON mode 지원

    async def generate(
        self,
        prompt: str,
        role: str,
        task: str,
        mode: str,
        options: Dict[str, Any]
    ) -> LLMProviderResponse:
        """Ollama API 호출"""

        start_time = time.time()

        # Ollama 요청 포맷
        model = options.get("model", self.config.get("default_model", "qwen2.5:7b"))

        request_data = {
            "model": model,
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": options.get("temperature", 0.7),
                "num_predict": options.get("max_tokens", 2048)
            }
        }

        # JSON mode 처리
        if mode == "json":
            request_data["format"] = "json"

        # Ollama API 호출
        base_url = self.config.get("base_url", "http://100.120.180.42:11434")
        timeout = self.config.get("timeout", 120)

        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.post(
                f"{base_url}/api/generate",
                json=request_data
            )
            response.raise_for_status()
            result = response.json()

        # 응답 변환
        latency_ms = int((time.time() - start_time) * 1000)

        output_content = result.get("response", "")
        parsed = None

        if mode == "json":
            try:
                import json
                parsed = json.loads(output_content)
            except:
                pass

        return LLMProviderResponse(
            provider="ollama",
            model=model,
            usage={
                "prompt_tokens": result.get("prompt_eval_count", 0),
                "completion_tokens": result.get("eval_count", 0),
                "total_tokens": result.get("prompt_eval_count", 0) + result.get("eval_count", 0)
            },
            output={
                "type": "json" if mode == "json" else "text",
                "content": output_content,
                "parsed": parsed
            },
            meta={
                "role": role,
                "task": task,
                "mode": mode,
                "latency_ms": latency_ms
            }
        )

    async def health_check(self) -> bool:
        """Ollama 서버 연결 확인"""
        try:
            base_url = self.config.get("base_url")
            async with httpx.AsyncClient(timeout=5) as client:
                response = await client.get(f"{base_url}/api/tags")
                return response.status_code == 200
        except:
            return False
```

**중요**:
- `LLMProvider` 인터페이스 **완벽 구현**
- 응답 포맷을 **표준 LLMProviderResponse**로 변환
- 다른 Provider도 동일한 패턴 따름

---

### 작업 1.6: 미래 Provider 스켈레톤 (1시간)

**파일**: `backend/app/services/llm/providers/openai.py`

```python
from typing import Dict, Any
from .base import LLMProvider, LLMProviderResponse

class OpenAIProvider(LLMProvider):
    """
    OpenAI Provider (GPT-4, GPT-4o 등)

    ⭐ 현재: 스켈레톤만 (TODO)
    ⭐ 미래: OpenAI SDK 사용하여 구현

    확장 시 해야 할 일:
    1. openai 패키지 설치 (pip install openai)
    2. generate() 메서드 구현
    3. provider_config.yaml에서 'openai' 활성화
    4. .env에서 OPENAI_API_KEY 설정
    """

    @property
    def vendor(self) -> str:
        return "openai"

    @property
    def supports_json(self) -> bool:
        return True  # GPT-4o는 JSON mode 지원

    async def generate(
        self,
        prompt: str,
        role: str,
        task: str,
        mode: str,
        options: Dict[str, Any]
    ) -> LLMProviderResponse:
        """
        TODO: OpenAI API 호출 구현

        구현 예시:
        1. openai.ChatCompletion.create() 사용
        2. 응답을 LLMProviderResponse 포맷으로 변환
        3. 토큰 사용량 추출
        """
        raise NotImplementedError(
            "OpenAIProvider is not implemented yet. "
            "See provider_config.yaml to enable it later."
        )

    async def health_check(self) -> bool:
        # TODO: OpenAI API 키 유효성 확인
        return False
```

**동일한 패턴으로 생성**:
- `anthropic.py` (AnthropicProvider)
- `gemini.py` (GeminiProvider)

**중요**:
- 인터페이스는 **완벽히 구현** (에러 발생하지만 타입은 맞음)
- TODO 주석으로 **나중에 할 일 명시**
- `NotImplementedError`로 명확한 에러 메시지

---

### 작업 1.7: LLM Gateway API 엔드포인트 (4시간)

**파일**: `backend/app/api/v1/endpoints/llm_gateway.py`

```python
from fastapi import APIRouter, HTTPException, Depends
from app.schemas.llm_gateway import LLMGatewayRequest, LLMGatewayResponse
from app.services.llm.gateway import LLMGatewayService
from app.core.config import settings

router = APIRouter(prefix="/llm", tags=["LLM Gateway"])

@router.post("/generate", response_model=LLMGatewayResponse)
async def generate(request: LLMGatewayRequest):
    """
    LLM 생성 요청 (단일 진입점)

    ⭐ 중요:
    - 모든 Agent/Editor는 이 엔드포인트만 호출
    - Provider 선택은 내부 Router에서 자동 처리
    - Mock/Live 모드는 GENERATOR_MODE 환경변수로 제어
    """

    gateway = LLMGatewayService()

    try:
        response = await gateway.generate(request)
        return response

    except Exception as e:
        # 표준 에러 포맷 반환
        raise HTTPException(
            status_code=500,
            detail={
                "error": {
                    "code": "LLM_GATEWAY_ERROR",
                    "message": str(e),
                    "request_id": request.request_id
                }
            }
        )

@router.get("/health")
async def health():
    """
    Gateway 헬스 체크

    Returns:
        활성화된 Provider별 상태
    """
    gateway = LLMGatewayService()
    return await gateway.health_check()
```

**파일**: `backend/app/services/llm/gateway.py`

```python
from app.schemas.llm_gateway import LLMGatewayRequest, LLMGatewayResponse
from app.services.llm.router import LLMRouter
from app.services.llm.prompt_builder import PromptBuilder
from app.core.config import settings
import time

class LLMGatewayService:
    """
    LLM Gateway 메인 로직

    책임:
    1. Mock/Live 모드 분기
    2. Router를 통한 Provider 선택
    3. Prompt 정규화
    4. Provider 호출 및 응답 변환
    """

    def __init__(self):
        self.router = LLMRouter()
        self.prompt_builder = PromptBuilder()

    async def generate(self, request: LLMGatewayRequest) -> LLMGatewayResponse:
        """LLM 생성 요청 처리"""

        # Mock 모드
        if settings.GENERATOR_MODE == "mock":
            return self._mock_response(request)

        # Live 모드
        start_time = time.time()

        # 1. Router: role/task → Provider + Model 선택
        provider = self.router.route(request)

        # 2. Prompt 정규화
        prompt = self.prompt_builder.build(request)

        # 3. Provider 호출
        provider_response = await provider.generate(
            prompt=prompt,
            role=request.role,
            task=request.task,
            mode=request.mode,
            options=request.options or {}
        )

        # 4. Gateway 응답으로 변환
        latency_ms = int((time.time() - start_time) * 1000)

        return LLMGatewayResponse(
            provider=provider_response.provider,
            model=provider_response.model,
            usage=provider_response.usage,
            output=provider_response.output,
            meta={
                **provider_response.meta,
                "latency_ms": latency_ms,
                "generator_mode": "live"
            }
        )

    def _mock_response(self, request: LLMGatewayRequest) -> LLMGatewayResponse:
        """Mock 모드 응답 (빠른 테스트용)"""

        # role/task에 따른 Mock 데이터
        mock_content = self._get_mock_content(request.role, request.task)

        return LLMGatewayResponse(
            provider="mock",
            model="mock-model",
            usage={"prompt_tokens": 100, "completion_tokens": 200, "total_tokens": 300},
            output={
                "type": "json" if request.mode == "json" else "text",
                "content": mock_content,
                "parsed": {"status": "mock"} if request.mode == "json" else None
            },
            meta={
                "role": request.role,
                "task": request.task,
                "mode": request.mode,
                "latency_ms": 50,
                "generator_mode": "mock"
            }
        )

    def _get_mock_content(self, role: str, task: str) -> str:
        """role/task별 Mock 응답 내용"""
        # TODO: 실제와 유사한 Mock 데이터 추가
        return f"Mock {role} response for {task}"

    async def health_check(self):
        """활성화된 Provider 상태 확인"""
        return await self.router.health_check_all()
```

**중요**:
- Mock/Live 분기는 **Gateway 레벨에서만** 처리
- Provider는 Mock/Live 구분 없이 **항상 실제 구현만**
- 확장 시 이 파일 수정 불필요

---

### 작업 1.8: LLM Router 구현 (2시간)

**파일**: `backend/app/services/llm/router.py`

```python
import yaml
from pathlib import Path
from typing import Dict, Any
from app.services.llm.providers.base import LLMProvider
from app.services.llm.providers.ollama import OllamaProvider
# 미래 확장
# from app.services.llm.providers.openai import OpenAIProvider
# from app.services.llm.providers.anthropic import AnthropicProvider
# from app.services.llm.providers.gemini import GeminiProvider
from app.core.config import settings

class LLMRouter:
    """
    LLM Provider 라우팅

    ⭐ 확장 원칙:
    1. provider_config.yaml 기반 라우팅
    2. 새 Provider 추가 시 _initialize_providers()만 수정
    3. route() 메서드는 수정 불필요 (YAML 규칙 기반)
    """

    def __init__(self):
        self.config = self._load_config()
        self.providers = self._initialize_providers()

    def _load_config(self) -> Dict[str, Any]:
        """provider_config.yaml 로드"""
        config_path = Path(__file__).parent.parent.parent / "core" / "provider_config.yaml"
        with open(config_path) as f:
            return yaml.safe_load(f)

    def _initialize_providers(self) -> Dict[str, LLMProvider]:
        """
        활성화된 Provider 초기화

        ⭐ 새 Provider 추가 시 여기에 등록
        """
        providers = {}

        active_providers = self.config["providers"]["llm"]["active"]

        if "ollama" in active_providers:
            providers["ollama"] = OllamaProvider({
                "base_url": settings.OLLAMA_BASE_URL,
                "default_model": settings.OLLAMA_DEFAULT_MODEL,
                "timeout": settings.OLLAMA_TIMEOUT
            })

        # 미래 확장 (주석 해제만 하면 됨)
        # if "openai" in active_providers:
        #     providers["openai"] = OpenAIProvider({
        #         "api_key": settings.OPENAI_API_KEY,
        #         "default_model": settings.OPENAI_DEFAULT_MODEL,
        #         "timeout": settings.OPENAI_TIMEOUT
        #     })

        # if "anthropic" in active_providers:
        #     providers["anthropic"] = AnthropicProvider({...})

        # if "gemini" in active_providers:
        #     providers["gemini"] = GeminiProvider({...})

        return providers

    def route(self, request) -> LLMProvider:
        """
        role/task → Provider 선택

        Args:
            request: LLMGatewayRequest

        Returns:
            LLMProvider: 선택된 Provider 인스턴스
        """
        routing_rules = self.config["llm_routing"]["rules"]

        # 명시적 provider 지정
        if request.options and request.options.get("provider"):
            provider_name = request.options["provider"]
            if provider_name in self.providers:
                return self.providers[provider_name]

        # YAML 규칙 기반 자동 선택
        for rule in routing_rules:
            # role 매칭
            if "role" in rule and request.role in rule["role"]:
                provider_name = rule["provider"]
                provider = self.providers.get(provider_name)
                if provider:
                    return provider

            # task 매칭
            if "task" in rule and request.task in rule["task"]:
                provider_name = rule["provider"]
                provider = self.providers.get(provider_name)
                if provider:
                    return provider

        # 기본값: 첫 번째 활성 Provider
        default_provider = list(self.providers.values())[0]
        return default_provider

    async def health_check_all(self) -> Dict[str, bool]:
        """모든 Provider 헬스 체크"""
        results = {}
        for name, provider in self.providers.items():
            results[name] = await provider.health_check()
        return results
```

**중요**:
- 라우팅 로직은 **YAML 설정 기반**
- 새 Provider는 `_initialize_providers()`에 **3줄 추가**만 하면 됨
- `route()` 메서드는 **수정 불필요**

---

### 작업 1.9: Media Gateway 구현 (3-4시간)

**동일한 패턴으로 구현**:
- `media/providers/base.py` (ImageProvider 인터페이스)
- `media/providers/comfyui.py` (ComfyUIProvider 구현)
- `media/providers/dalle.py` (DalleProvider 스켈레톤)
- `media/providers/nanobanana.py` (NanobananaProvider 스켈레톤)
- `media/gateway.py` (MediaGatewayService)
- `api/v1/endpoints/media_gateway.py` (API 엔드포인트)

**중요 차이점**:
- Image는 **동기 가능**, 하지만 **Job 처리 옵션** 제공
- `kind` 기반 라우팅 (`product_shot`, `hero`, `concept` 등)

---

### 작업 1.10: Mock 응답 구현 (2시간)

**파일**: `backend/app/services/llm/mock_data.py`

```python
"""
Mock 모드 응답 데이터
⭐ 실제 응답과 동일한 구조 유지
"""

MOCK_LLM_RESPONSES = {
    ("brief", "marketing_brief"): {
        "type": "json",
        "content": '{"target":"20-30대 직장인","positioning":"간편 고단백 영양식","key_messages":["1회분 30g 단백질","5분 완성","맛있는 초코맛"]}',
        "parsed": {
            "target": "20-30대 직장인",
            "positioning": "간편 고단백 영양식",
            "key_messages": ["1회분 30g 단백질", "5분 완성", "맛있는 초코맛"]
        }
    },

    ("strategist", "content_plan"): {
        "type": "json",
        "content": '{"sections":[{"id":"hero","type":"hero","title":"메인 비주얼"},{"id":"features","type":"features","title":"제품 특징"}]}',
        "parsed": {
            "sections": [
                {"id": "hero", "type": "hero", "title": "메인 비주얼"},
                {"id": "features", "type": "features", "title": "제품 특징"}
            ]
        }
    },

    # 나머지 role/task 조합 추가...
}

MOCK_IMAGE_RESPONSES = {
    "product_shot": {
        "id": "img_mock_001",
        "url": "https://via.placeholder.com/1280x720/FF6600/FFFFFF?text=Product+Shot+Mock",
        "meta": {"workflow": "mock", "seed": 12345}
    },

    "hero": {
        "id": "img_mock_002",
        "url": "https://via.placeholder.com/1920x1080/0066FF/FFFFFF?text=Hero+Image+Mock",
        "meta": {"workflow": "mock", "seed": 12346}
    }
}
```

**중요**:
- Mock 데이터는 **실제 응답과 구조 동일**
- Live로 전환 시 **테스트 코드 수정 불필요**

---

## 🏗️ Phase 2: Agent 리팩터링 (10시간)

### 작업 2.1: Gateway Client 구현 (2-3시간)

**파일**: `backend/app/services/clients/llm_client.py`

```python
import httpx
from typing import Dict, Any, Optional

class LLMGatewayClient:
    """
    LLM Gateway 클라이언트

    ⭐ Agent에서 사용하는 유일한 LLM 인터페이스
    ⭐ Ollama/GPT/Claude 모두 이 클라이언트로 접근
    """

    def __init__(self, base_url: str = None):
        self.base_url = base_url or "http://localhost:8000/api/v1"

    async def generate(
        self,
        role: str,
        task: str,
        payload: Dict[str, Any],
        mode: str = "chat",
        options: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        LLM 생성 요청

        Args:
            role: Agent 역할 (brief, strategist, copywriter, ...)
            task: 비즈니스 태스크 (marketing_brief, content_plan, ...)
            payload: 입력 데이터 (brand, context, payload)
            mode: chat | json
            options: {temperature, max_tokens, provider, ...}

        Returns:
            Gateway 응답 JSON
        """

        request_data = {
            "role": role,
            "task": task,
            "mode": mode,
            "input": payload,
            "options": options or {}
        }

        async with httpx.AsyncClient(timeout=120) as client:
            response = await client.post(
                f"{self.base_url}/llm/generate",
                json=request_data
            )
            response.raise_for_status()
            return response.json()
```

**파일**: `backend/app/services/clients/media_client.py`

```python
import httpx
from typing import Dict, Any, Optional, List

class MediaGatewayClient:
    """Media Gateway 클라이언트"""

    def __init__(self, base_url: str = None):
        self.base_url = base_url or "http://localhost:8000/api/v1"

    async def generate_image(
        self,
        kind: str,
        prompt: str,
        brand: Optional[Dict[str, Any]] = None,
        options: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        이미지 생성 요청

        Args:
            kind: product_shot | hero | concept | thumbnail
            prompt: 이미지 프롬프트
            brand: 브랜드 정보
            options: {aspect_ratio, width, height, workflow, ...}

        Returns:
            Gateway 응답 JSON
        """

        request_data = {
            "provider": "auto",  # Gateway가 자동 선택
            "kind": kind,
            "prompt": prompt,
            "brand": brand or {},
            "options": options or {}
        }

        async with httpx.AsyncClient(timeout=300) as client:
            response = await client.post(
                f"{self.base_url}/media/image/generate",
                json=request_data
            )
            response.raise_for_status()
            return response.json()
```

---

### 작업 2.2~2.8: Agent 리팩터링 (각 1-1.5시간)

**예시**: BriefAgent 수정

**수정 전**:
```python
# ❌ 직접 Ollama 호출
import ollama

class BriefAgent:
    async def execute(self, brand_info, product_info):
        prompt = f"Generate brief for {product_info}"
        response = ollama.generate(
            model="qwen2.5:7b",
            prompt=prompt
        )
        return response["response"]
```

**수정 후**:
```python
# ✅ Gateway Client 사용
from app.services.clients.llm_client import LLMGatewayClient

class BriefAgent:
    def __init__(self):
        self.llm_client = LLMGatewayClient()

    async def execute(self, brand_info, product_info):
        response = await self.llm_client.generate(
            role="brief",
            task="marketing_brief",
            mode="json",
            payload={
                "brand": brand_info,
                "product": product_info
            }
        )

        # 응답 파싱
        return response["output"]["parsed"]
```

**핵심 변경사항**:
1. ❌ `import ollama` 제거
2. ✅ `LLMGatewayClient` 사용
3. ✅ `role`, `task` 명시
4. ✅ Provider/모델 선택은 Gateway에 위임

**동일하게 수정할 Agent**:
- BrandAgent (role="brand", task="brand_summary")
- StrategistAgent (role="strategist", task="content_plan")
- CopywriterAgent (role="copywriter", task="product_detail")
- ReviewerAgent (role="reviewer", task="style_check")

---

### 작업 2.7: VisionGeneratorAgent 특별 처리 (1.5시간)

**파일**: `backend/app/agents/vision_generator.py`

```python
from app.services.clients.llm_client import LLMGatewayClient
from app.services.clients.media_client import MediaGatewayClient

class VisionGeneratorAgent:
    """
    Vision Generator Agent

    ⭐ LLM + Media 두 Gateway 사용
    1. LLM Gateway: 이미지 프롬프트 생성
    2. Media Gateway: 실제 이미지 생성
    """

    def __init__(self):
        self.llm_client = LLMGatewayClient()
        self.media_client = MediaGatewayClient()

    async def execute(
        self,
        brief: Dict[str, Any],
        section: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        이미지 생성

        Args:
            brief: 마케팅 브리프
            section: 섹션 정보 (hero, features, ...)

        Returns:
            {image_id, url, prompt_used}
        """

        # 1단계: LLM으로 이미지 프롬프트 생성
        prompt_response = await self.llm_client.generate(
            role="vision",
            task="image_prompt",
            mode="json",
            payload={
                "brief": brief,
                "section": section
            }
        )

        image_prompt_data = prompt_response["output"]["parsed"]

        # 2단계: Media Gateway로 이미지 생성
        image_response = await self.media_client.generate_image(
            kind="product_shot",  # or section["type"]
            prompt=image_prompt_data["prompt"],
            brand=brief.get("brand"),
            options={
                "aspect_ratio": "16:9",
                "workflow": "product_shot_v1",
                "negative_prompt": image_prompt_data.get("negative_prompt")
            }
        )

        # 결과 반환
        return {
            "image_id": image_response["images"][0]["id"],
            "url": image_response["images"][0]["url"],
            "prompt_used": image_prompt_data["prompt"]
        }
```

---

## 🏗️ Phase 3: P0 E2E 스크립트 (6시간)

**파일**: `backend/scripts/run_p0_product_detail_flow.py`

```python
#!/usr/bin/env python3
"""
P0 E2E: 상품 상세 + 이미지 1장 생성 플로우

실행 방법:
  Mock 모드: GENERATOR_MODE=mock python scripts/run_p0_product_detail_flow.py
  Live 모드: GENERATOR_MODE=live python scripts/run_p0_product_detail_flow.py
"""

import asyncio
import json
import sys
import os
from pathlib import Path

# Backend 경로 추가
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.agents.brand import BrandAgent
from app.agents.brief import BriefAgent
from app.agents.strategist import StrategistAgent
from app.agents.copywriter import CopywriterAgent
from app.agents.vision_generator import VisionGeneratorAgent
from app.agents.reviewer import ReviewerAgent
from app.core.config import settings

async def run_product_detail_flow():
    """상품 상세 페이지 생성 E2E 플로우"""

    print(f"🚀 Starting P0 E2E Flow (Mode: {settings.GENERATOR_MODE})")
    print("=" * 60)

    # Input
    brand_input = {
        "name": "프로틴플러스",
        "industry": "건강식품",
        "uploaded_materials": []
    }

    product_input = {
        "name": "프로틴플러스 초코맛",
        "category": "단백질 보충제",
        "target": "20-30대 직장인",
        "key_features": ["고단백 30g", "저당", "간편 쉐이크"]
    }

    try:
        # 1. BrandAgent
        print("\n📋 Step 1: BrandAgent - 브랜드 요약")
        brand_agent = BrandAgent()
        brand_summary = await brand_agent.execute(brand_input)
        print(f"✅ Brand Summary: {json.dumps(brand_summary, ensure_ascii=False, indent=2)[:200]}...")

        # 2. BriefAgent
        print("\n📋 Step 2: BriefAgent - 마케팅 브리프")
        brief_agent = BriefAgent()
        brief = await brief_agent.execute({
            "brand": brand_summary,
            "product": product_input
        })
        print(f"✅ Brief: {json.dumps(brief, ensure_ascii=False, indent=2)[:200]}...")

        # 3. StrategistAgent
        print("\n📋 Step 3: StrategistAgent - 섹션 구조")
        strategist = StrategistAgent()
        sections = await strategist.execute(brief)
        print(f"✅ Sections: {len(sections.get('sections', []))}개")

        # 4. CopywriterAgent
        print("\n📋 Step 4: CopywriterAgent - 카피 작성")
        copywriter = CopywriterAgent()
        copy = await copywriter.execute({
            "brief": brief,
            "sections": sections
        })
        print(f"✅ Copy: {json.dumps(copy, ensure_ascii=False, indent=2)[:200]}...")

        # 5. VisionGeneratorAgent
        print("\n📋 Step 5: VisionGeneratorAgent - 메인 이미지")
        vision = VisionGeneratorAgent()
        image = await vision.execute({
            "brief": brief,
            "section": sections["sections"][0]  # Hero
        })
        print(f"✅ Image: {image['image_id']} - {image['url']}")

        # 6. ReviewerAgent
        print("\n📋 Step 6: ReviewerAgent - 카피 리뷰")
        reviewer = ReviewerAgent()
        review = await reviewer.execute({
            "brand": brand_summary,
            "copy": copy
        })
        print(f"✅ Review: {json.dumps(review, ensure_ascii=False, indent=2)[:200]}...")

        # Final Output
        result = {
            "brand_summary": brand_summary,
            "brief": brief,
            "sections": sections,
            "copy": copy,
            "image": image,
            "review": review
        }

        # 결과 저장
        output_path = Path(__file__).parent.parent / "test_results" / "p0_e2e_result.json"
        output_path.parent.mkdir(exist_ok=True)

        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(result, f, ensure_ascii=False, indent=2)

        print("\n" + "=" * 60)
        print(f"✅ P0 E2E Flow Completed Successfully!")
        print(f"📄 Result saved: {output_path}")
        print("=" * 60)

        return result

    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(run_product_detail_flow())
```

**실행 예시**:
```bash
# Mock 모드 (빠름, 30초)
GENERATOR_MODE=mock python backend/scripts/run_p0_product_detail_flow.py

# Live 모드 (느림, 2-3분)
GENERATOR_MODE=live python backend/scripts/run_p0_product_detail_flow.py
```

---

## 🏗️ Phase 4: 테스트 지원 (2시간)

### 작업 4.1: Mock 응답 품질 개선 (1.5시간)

- Mock 데이터를 **실제 응답과 더 유사하게** 개선
- role/task 조합별 **다양한 Mock 샘플** 추가

### 작업 4.2: 타임아웃 최적화 (0.5시간)

```python
# backend/app/core/config.py

class Settings(BaseSettings):
    # Timeout 설정
    GATEWAY_TIMEOUT_MOCK: int = 5  # Mock 모드는 5초면 충분
    GATEWAY_TIMEOUT_LIVE: int = 180  # Live 모드는 3분

    def get_timeout(self, mode: str = None) -> int:
        """Mode에 따른 타임아웃 반환"""
        if mode == "mock" or self.GENERATOR_MODE == "mock":
            return self.GATEWAY_TIMEOUT_MOCK
        return self.GATEWAY_TIMEOUT_LIVE
```

---

## ✅ 완료 기준 (Definition of Done)

### Phase 1 완료 조건
- [ ] `/api/v1/llm/generate` Mock 모드 정상 동작
- [ ] `/api/v1/llm/generate` Live 모드로 Ollama 연결 성공
- [ ] Postman으로 4가지 role (brief, strategist, copywriter, vision) 테스트 완료
- [ ] `/api/v1/media/image/generate` ComfyUI 호출 성공
- [ ] `provider_config.yaml`에 미래 Provider 주석 포함
- [ ] OpenAI/Anthropic/Gemini Provider 스켈레톤 파일 존재

### Phase 2 완료 조건
- [ ] 6개 Agent 모두 Gateway Client 사용
- [ ] Agent 파일에서 `import ollama` 완전 제거
- [ ] VisionGeneratorAgent가 LLM + Media Gateway 사용
- [ ] 각 Agent Mock 모드 단위 테스트 통과
- [ ] 각 Agent Live 모드 단위 테스트 통과 (Ollama 실제 호출)

### Phase 3 완료 조건
- [ ] `run_p0_product_detail_flow.py` Mock 모드 30초 이내 완료
- [ ] `run_p0_product_detail_flow.py` Live 모드 3분 이내 완료
- [ ] 최종 JSON 파일 생성 (6개 Agent 결과 포함)
- [ ] 이미지 URL이 실제 접근 가능 (ComfyUI 생성)
- [ ] 에러 발생 시 명확한 에러 메시지 및 스택 트레이스

### Phase 4 완료 조건
- [ ] Mock 응답 데이터가 Live 응답과 구조 동일
- [ ] role/task 조합별 Mock 데이터 10개 이상
- [ ] 타임아웃 설정이 Mode별로 자동 적용

---

## 📚 필수 읽기 문서

작업 시작 전 반드시 읽어야 할 문서:

1. **LLM_CONNECTION_ANALYSIS_REPORT.md** (종합 분석)
   - 위치: `docs/reports/LLM_CONNECTION_ANALYSIS_REPORT.md`
   - 왜 006번 방식인지, 확장 전략은 무엇인지

2. **002. LLM Gateway Spec v1.0.md** (상세 스펙)
   - 위치: `K:\obsidian-k\Sparklio_ai_marketing_studio\최종계획\LLM\002. LLM Gateway Spec v1.0.md`
   - Provider 인터페이스, Router 설계

3. **003. Media Gateway Spec v1.0.md** (상세 스펙)
   - 위치: `K:\obsidian-k\Sparklio_ai_marketing_studio\최종계획\LLM\003. Media Gateway Spec v1.0.md`
   - Image/Video/Audio Provider 설계

4. **006. 005의 축소버젼.md** (현실적 실행 가이드)
   - 위치: `K:\obsidian-k\Sparklio_ai_marketing_studio\최종계획\LLM\006. 005의 축소버젼.md`
   - Mock/Live 분리, 테스트 전략

---

## 🚨 주의사항 (Critical Points)

### ⭐ 확장성 관련 (가장 중요!)

1. **Provider 인터페이스는 절대 수정 금지**
   - 새 Provider는 **새 파일만 추가**
   - `base.py` 수정 금지

2. **API Contract 불변성 유지**
   - `/api/v1/llm/generate` 요청/응답 스펙 **절대 변경 금지**
   - Agent는 Gateway만 의존, Provider 몰라야 함

3. **설정 기반 확장**
   - 하드코딩 금지 (모델명, Provider명, 라우팅 규칙)
   - 모두 `provider_config.yaml` 또는 `.env`에

4. **미래 Provider 스켈레톤 반드시 포함**
   - OpenAI, Anthropic, Gemini Provider 클래스 생성
   - `NotImplementedError` + TODO 주석
   - 나중에 **코드 추가만** 하면 동작하도록

### ⚠️ Mock/Live 분리

1. **Mock 모드는 Gateway 레벨에서만**
   - Provider는 항상 실제 구현
   - `if GENERATOR_MODE == "mock"`은 Gateway에만

2. **Mock 응답 = Live 응답 구조**
   - 테스트 코드가 모드 전환 시 **수정 불필요**
   - 필드명, 타입 완전 동일

### ❌ 절대 금지

1. ❌ Agent에서 `import ollama`, `import openai` 직접 사용
2. ❌ Gateway를 거치지 않고 모델 직접 호출
3. ❌ 모델명 하드코딩 (`qwen2.5:7b` 같은 문자열 직접 사용)
4. ❌ Provider별 로직을 Gateway API에 노출
5. ❌ 확장을 고려하지 않은 if/else 분기

---

## 🆘 문제 발생 시

### Ollama 연결 실패
```
Error: Connection refused to http://100.120.180.42:11434
```
**해결**: A팀에 Desktop Docker Ollama 상태 확인 요청

### ComfyUI 워크플로 오류
```
Error: Workflow 'product_shot_v1' not found
```
**해결**: A팀에 ComfyUI 워크플로 파일 확인 요청

### Gateway 타임아웃
```
Error: Request timeout after 120s
```
**해결**: Live 모드 타임아웃 180초로 증가, 또는 Mock 모드로 먼저 테스트

---

## 📊 A팀 전달 사항

### Phase 1 완료 시
- [ ] Gateway API 엔드포인트 URL
- [ ] Postman Collection 파일
- [ ] Mock/Live 모드 테스트 가이드

### Phase 2 완료 시
- [ ] Agent별 입력/출력 JSON 샘플
- [ ] Gateway Client 사용 예시 코드

### Phase 3 완료 시
- [ ] E2E 스크립트 실행 방법
- [ ] 예상 실행 시간 (Mock: 30초, Live: 3분)

---

**작성 완료**: 2025-11-16
**예상 완료일**: 2025-11-21 (5일 후)
**담당**: B팀 Backend 개발자
**검증**: A팀 QA
