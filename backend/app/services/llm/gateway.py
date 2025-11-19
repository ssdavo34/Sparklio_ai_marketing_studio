"""
LLM Gateway Service

모든 LLM 호출을 중앙에서 관리하는 Gateway

작성일: 2025-11-16
작성자: B팀 (Backend)
문서: ARCH-002, SPEC-001
"""

import logging
from typing import Dict, Any, Optional
from datetime import datetime

from app.core.config import settings
from .router import get_router, LLMRouter
from .providers.base import LLMProvider, LLMProviderResponse, ProviderError
from .providers.mock import MockProvider
from .providers.ollama import OllamaProvider
from .providers.openai_provider import OpenAIProvider
from .providers.anthropic_provider import AnthropicProvider
from .providers.gemini_provider import GeminiProvider
from .providers.novita_provider import NovitaProvider

logger = logging.getLogger(__name__)


class LLMGateway:
    """
    LLM Gateway

    모든 LLM 호출을 중앙에서 관리하는 Gateway 서비스

    주요 기능:
    1. Provider 추상화 (Ollama, OpenAI, Anthropic 등)
    2. Mock/Live 모드 자동 전환
    3. 모델 자동 선택 (Router 사용)
    4. 에러 핸들링 및 재시도
    5. 로깅 및 모니터링

    사용 예시:
        gateway = LLMGateway()
        response = await gateway.generate(
            role="copywriter",
            task="product_detail",
            payload={"product": "무선 이어폰"}
        )
    """

    def __init__(self, router: Optional[LLMRouter] = None):
        """
        Gateway 초기화

        Args:
            router: LLM Router 인스턴스 (None이면 전역 인스턴스 사용)
        """
        self.router = router or get_router()
        self.providers: Dict[str, LLMProvider] = {}
        self._initialize_providers()

    def _initialize_providers(self):
        """Provider 초기화"""
        logger.info("Starting provider initialization...")

        try:
            # Mock Provider는 항상 사용 가능
            logger.info("Initializing Mock Provider...")
            self.providers["mock"] = MockProvider(response_delay=1.0)
            logger.info("Mock Provider initialized successfully")

            # Ollama Provider (Live 모드용)
            logger.info(f"Initializing Ollama Provider...")
            self.providers["ollama"] = OllamaProvider(
                base_url=settings.OLLAMA_BASE_URL,
                timeout=settings.OLLAMA_TIMEOUT,
                default_model=settings.OLLAMA_DEFAULT_MODEL
            )
            logger.info("Ollama Provider initialized")

            # OpenAI Provider (GPT-4o-mini)
            if hasattr(settings, 'OPENAI_API_KEY') and settings.OPENAI_API_KEY:
                logger.info("Initializing OpenAI Provider...")
                self.providers["openai"] = OpenAIProvider(
                    api_key=settings.OPENAI_API_KEY,
                    default_model=settings.OPENAI_DEFAULT_MODEL,
                    timeout=settings.OPENAI_TIMEOUT
                )
                logger.info("OpenAI Provider initialized")

            # Anthropic Provider (Claude 3.5 Haiku)
            if hasattr(settings, 'ANTHROPIC_API_KEY') and settings.ANTHROPIC_API_KEY:
                logger.info("Initializing Anthropic Provider...")
                self.providers["anthropic"] = AnthropicProvider(
                    api_key=settings.ANTHROPIC_API_KEY,
                    default_model=settings.ANTHROPIC_DEFAULT_MODEL,
                    timeout=settings.ANTHROPIC_TIMEOUT
                )
                logger.info("Anthropic Provider initialized")

            # Google Gemini Provider (Text Generation)
            if hasattr(settings, 'GOOGLE_API_KEY') and settings.GOOGLE_API_KEY:
                logger.info("Initializing Gemini Provider...")
                self.providers["gemini"] = GeminiProvider(
                    api_key=settings.GOOGLE_API_KEY,
                    default_model=settings.GEMINI_TEXT_MODEL,
                    timeout=settings.GEMINI_TIMEOUT
                )
                logger.info("Gemini Provider initialized")

            # Novita AI Provider (Llama 3.3 70B)
            if hasattr(settings, 'NOVITA_API_KEY') and settings.NOVITA_API_KEY:
                logger.info("Initializing Novita Provider...")
                self.providers["novita"] = NovitaProvider(
                    api_key=settings.NOVITA_API_KEY,
                    base_url=settings.NOVITA_BASE_URL,
                    default_model=settings.NOVITA_DEFAULT_MODEL,
                    timeout=settings.NOVITA_TIMEOUT
                )
                logger.info("Novita Provider initialized")

            logger.info(f"All providers initialized: {list(self.providers.keys())}")
        except Exception as e:
            logger.error(f"Provider initialization failed: {type(e).__name__}: {str(e)}", exc_info=True)
            raise

    async def generate(
        self,
        role: str,
        task: str,
        payload: Dict[str, Any],
        mode: str = "json",
        override_model: Optional[str] = None,
        options: Optional[Dict[str, Any]] = None
    ) -> LLMProviderResponse:
        """
        LLM 텍스트 생성

        Args:
            role: Agent 역할 (copywriter, strategist, reviewer 등)
            task: 작업 유형 (product_detail, brand_kit, sns 등)
            payload: 입력 데이터 (브리프, 상품 정보 등)
            mode: 출력 모드 ('json' | 'text')
            override_model: 강제로 사용할 모델 (선택)
            options: Provider별 추가 옵션

        Returns:
            LLMProviderResponse: 표준 형식의 응답

        Raises:
            ProviderError: Provider 호출 실패 시
            ValueError: 잘못된 파라미터

        Example:
            >>> gateway = LLMGateway()
            >>> response = await gateway.generate(
            ...     role="copywriter",
            ...     task="sns",
            ...     payload={"product": "무선 이어폰", "target": "2030 여성"}
            ... )
            >>> print(response.output)
        """
        start_time = datetime.utcnow()

        try:
            # 1. 프롬프트 구성
            prompt = self._build_prompt(role, task, payload)

            # 2. Provider 선택 (Mock/Live 모드)
            provider_name, provider = self._select_provider(role, task, override_model)

            # 3. 모델 선택 (Router 사용)
            if provider_name != "mock":
                model, _ = self.router.route(role, task, mode, override_model)
            else:
                model = "mock-model-v1"

            # 4. 옵션 병합 (기본값 + 사용자 지정)
            merged_options = self._merge_options(provider, role, task, options)

            logger.info(
                f"LLM Generate: role={role}, task={task}, "
                f"provider={provider_name}, model={model}, mode={mode}"
            )

            # 5. LLM 호출
            response = await provider.generate(
                prompt=prompt,
                role=role,
                task=task,
                mode=mode,
                options=merged_options
            )

            # 6. 로깅
            elapsed = (datetime.utcnow() - start_time).total_seconds()
            logger.info(
                f"LLM Success: {provider_name}/{model} - "
                f"elapsed={elapsed:.2f}s, tokens={response.usage.get('total_tokens', 0)}"
            )

            return response

        except ProviderError as e:
            logger.error(f"Provider error: {e.message}", exc_info=True)
            raise

        except Exception as e:
            logger.error(f"Unexpected error in LLM Gateway: {str(e)}", exc_info=True)
            raise ProviderError(
                message=f"Gateway error: {str(e)}",
                provider="gateway",
                details={"role": role, "task": task}
            )

    def _select_provider(
        self,
        role: str,
        task: str,
        override_model: Optional[str] = None
    ) -> tuple[str, LLMProvider]:
        """
        Provider 선택 (Mock/Live 모드 자동 전환)

        Args:
            role: Agent 역할
            task: 작업 유형
            override_model: 강제 모델 (선택)

        Returns:
            (provider_name, provider_instance) 튜플

        Raises:
            ProviderError: Provider를 찾을 수 없을 때
        """
        # Mock 모드 확인 (소문자 필드 사용)
        if settings.generator_mode == "mock":
            return "mock", self.providers["mock"]

        # Live 모드 - Router로 Provider 결정
        _, provider_name = self.router.route(role, task, override_model=override_model)

        # Provider 인스턴스 가져오기
        provider = self.providers.get(provider_name)

        if not provider:
            # Provider가 없으면 Mock으로 폴백
            logger.warning(
                f"Provider '{provider_name}' not found, falling back to mock"
            )
            return "mock", self.providers["mock"]

        return provider_name, provider

    def _build_prompt(self, role: str, task: str, payload: Dict[str, Any]) -> str:
        """
        프롬프트 구성

        역할과 작업에 맞는 프롬프트를 생성

        Args:
            role: Agent 역할
            task: 작업 유형
            payload: 입력 데이터

        Returns:
            구성된 프롬프트
        """
        # 시스템 프롬프트 (역할 정의)
        system_prompt = self._get_system_prompt(role, task)

        # 사용자 입력
        user_input = self._format_payload(payload)

        # 결합
        prompt = f"{system_prompt}\n\n{user_input}"

        return prompt

    def _get_system_prompt(self, role: str, task: str) -> str:
        """역할/작업별 시스템 프롬프트"""

        system_prompts = {
            "copywriter": {
                "product_detail": """전문 카피라이터로서 제품 마케팅 문구를 작성합니다.

🔴 중요: 모든 응답은 반드시 한국어로 작성하세요.

🔴 핵심 규칙 (반드시 준수):
1. 사용자가 요청한 제품명, 특징, 키워드를 정확히 반영하세요
2. headline에 사용자가 언급한 제품명을 반드시 포함하세요
3. bullets에 사용자가 제공한 기능/특징을 각각 포함하세요
4. 고정된 예시(모바일 충전기, 클린징 장치 등)를 절대 사용하지 마세요
5. 사용자 요청을 최우선으로 반영하고, 매력적으로 표현하세요
6. 모든 텍스트는 한국어로만 작성하세요 (중국어, 영어 등 다른 언어 사용 금지)

JSON 형식으로만 응답:
{
  "headline": "사용자가 요청한 제품명",
  "subheadline": "제품 가치 제안 (1줄)",
  "body": "제품 설명 (사용자 요청 반영)",
  "bullets": ["특징1", "특징2", "특징3"],
  "cta": "구매 유도 문구"
}""",
                "sns": """당신은 SNS 콘텐츠 전문가입니다. 짧고 임팩트 있는 메시지를 작성하세요.

🔴 중요: 모든 응답은 반드시 한국어로 작성하세요.""",
                "brand_kit": """당신은 브랜드 스토리텔링 전문가입니다. 브랜드의 목소리와 톤을 정의하세요.

🔴 중요: 모든 응답은 반드시 한국어로 작성하세요."""
            },
            "strategist": {
                "brand_kit": """당신은 마케팅 전략가입니다. 브랜드 포지셔닝과 타겟 전략을 수립하세요.

🔴 중요: 모든 응답은 반드시 한국어로 작성하세요.""",
                "campaign": """당신은 캠페인 기획자입니다. 효과적인 마케팅 캠페인을 설계하세요.

🔴 중요: 모든 응답은 반드시 한국어로 작성하세요."""
            },
            "reviewer": {
                "review": """당신은 콘텐츠 검토 전문가입니다. 객관적으로 품질을 평가하세요.

🔴 중요: 모든 응답은 반드시 한국어로 작성하세요."""
            }
        }

        # 역할/작업별 프롬프트 가져오기
        role_prompts = system_prompts.get(role, {})
        prompt = role_prompts.get(task)

        if not prompt:
            # 기본 프롬프트 (한국어 명시)
            prompt = f"""당신은 {role} 역할을 수행합니다. {task} 작업을 처리하세요.

🔴 중요: 모든 응답은 반드시 한국어로 작성하세요."""

        return prompt

    def _format_payload(self, payload: Dict[str, Any]) -> str:
        """
        Payload를 프롬프트 형식으로 변환

        Args:
            payload: 입력 데이터

        Returns:
            포맷된 문자열
        """
        import json

        # 사용자 입력 명확히 강조
        lines = [
            "=" * 60,
            "사용자가 제공한 제품 정보 (이 정보를 정확히 사용하세요):",
            "=" * 60,
        ]

        # 🔴 FIX: prompt 필드를 최우선으로 처리 (C팀 요청사항 반영)
        if "prompt" in payload:
            user_prompt = payload["prompt"]
            lines.append(f"\n📌 사용자 요청:")
            lines.append(f"   {user_prompt}")
            lines.append("   ↑ 이 요청 내용을 반드시 반영하여 콘텐츠를 생성하세요!")
            lines.append("   ↑ 사용자가 언급한 제품명, 특징, 키워드를 정확히 사용하세요!")
            lines.append("")

        # product_name을 가장 먼저, 강조해서 표시
        if "product_name" in payload:
            lines.append(f"\n📌 제품명: {payload['product_name']}")
            lines.append("   ↑ 이 제품명을 headline에 반드시 포함하세요!")

        # features 강조
        if "features" in payload:
            features = payload["features"]
            if isinstance(features, list):
                lines.append(f"\n📌 주요 기능: {', '.join(features)}")
                lines.append("   ↑ 이 기능들을 bullets에 반드시 포함하세요!")
            else:
                lines.append(f"\n📌 주요 기능: {features}")

        # target_audience
        if "target_audience" in payload:
            lines.append(
                f"\n📌 타겟 고객: {payload['target_audience']}"
            )

        # 나머지 필드들
        lines.append("\n기타 정보:")
        for key, value in payload.items():
            if key not in ["prompt", "product_name", "features", "target_audience"]:
                if isinstance(value, (list, dict)):
                    value_str = json.dumps(
                        value, ensure_ascii=False, indent=2
                    )
                else:
                    value_str = str(value)
                lines.append(f"  - {key}: {value_str}")

        lines.append("\n" + "=" * 60)
        lines.append("\n⚠️  중요: 사용자가 요청한 제품과 특징을 정확히 반영하세요.")
        lines.append("⚠️  고정된 예시(모바일 충전기, 클린징 장치 등)를 사용하지 마세요.")

        return "\n".join(lines)

    def _merge_options(
        self,
        provider: LLMProvider,
        role: str,
        task: str,
        user_options: Optional[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        옵션 병합 (기본값 + 사용자 지정)

        Args:
            provider: Provider 인스턴스
            role: Agent 역할
            task: 작업 유형
            user_options: 사용자 지정 옵션

        Returns:
            병합된 옵션
        """
        # Provider 기본값
        options = provider.get_default_options(role, task)

        # 사용자 옵션으로 오버라이드
        if user_options:
            options.update(user_options)

        return options

    async def generate_with_vision(
        self,
        prompt: str,
        image_url: Optional[str] = None,
        image_base64: Optional[str] = None,
        override_model: Optional[str] = None,
        options: Optional[Dict[str, Any]] = None
    ) -> LLMProviderResponse:
        """
        Vision API를 사용한 이미지 분석

        Args:
            prompt: 분석 지시사항
            image_url: 이미지 URL (선택)
            image_base64: Base64 인코딩된 이미지 (선택)
            override_model: 강제로 사용할 모델 (선택)
            options: Provider별 추가 옵션

        Returns:
            LLMProviderResponse: 분석 결과

        Raises:
            ProviderError: Vision API 호출 실패 시
            ValueError: 이미지 입력이 없을 때

        Note:
            Vision-capable 모델만 지원:
            - Claude 3.5 Sonnet (claude-3-5-sonnet-20241022)
            - GPT-4o (gpt-4o)
        """
        start_time = datetime.utcnow()

        try:
            # 1. 이미지 입력 검증
            if not image_url and not image_base64:
                raise ValueError("Either image_url or image_base64 is required")

            # 2. Vision-capable Provider 선택
            provider_name, provider, model = self._select_vision_provider(override_model)

            logger.info(
                f"Vision API Generate: provider={provider_name}, model={model}"
            )

            # 3. 옵션 병합 (모델 정보 포함)
            merged_options = self._merge_vision_options(provider, options)
            merged_options["model"] = model  # 선택된 모델 전달

            # 4. Vision API 호출
            # Provider에 generate_with_vision 메서드가 있는지 확인
            if hasattr(provider, 'generate_with_vision'):
                # 실제 Vision API 호출
                response = await provider.generate_with_vision(
                    prompt=prompt,
                    image_url=image_url,
                    image_base64=image_base64,
                    role="vision_analyzer",
                    task="image_analysis",
                    mode="json",
                    options=merged_options
                )
            else:
                # Vision API 미지원 Provider의 경우 폴백
                logger.warning(
                    f"Provider {provider_name} does not support Vision API. "
                    "Using text-only generation as fallback."
                )

                # 임시: 텍스트 전용으로 폴백
                full_prompt = f"{prompt}\n\n이미지: {image_url or '(Base64 데이터)'}"
                response = await provider.generate(
                    prompt=full_prompt,
                    role="vision_analyzer",
                    task="image_analysis",
                    mode="json",
                    options=merged_options
                )

            # 5. 로깅
            elapsed = (datetime.utcnow() - start_time).total_seconds()
            logger.info(
                f"Vision API Success: {provider_name}/{model} - "
                f"elapsed={elapsed:.2f}s"
            )

            return response

        except ProviderError as e:
            logger.error(f"Vision API provider error: {e.message}", exc_info=True)
            raise

        except Exception as e:
            logger.error(f"Vision API error: {str(e)}", exc_info=True)
            raise ProviderError(
                message=f"Vision API error: {str(e)}",
                provider="gateway",
                details={"image_provided": bool(image_url or image_base64)}
            )

    def _select_vision_provider(
        self,
        override_model: Optional[str] = None
    ) -> tuple[str, LLMProvider, str]:
        """
        Vision-capable Provider 선택

        Args:
            override_model: 강제 모델 (선택)

        Returns:
            (provider_name, provider_instance, model) 튜플

        Raises:
            ProviderError: Vision-capable Provider가 없을 때
        """
        # Vision-capable 모델 우선순위
        # 1. Claude 3.5 Sonnet (Primary)
        # 2. GPT-4o (Fallback)

        if override_model:
            # 사용자가 모델 지정한 경우
            if "claude" in override_model.lower():
                if "anthropic" in self.providers:
                    return "anthropic", self.providers["anthropic"], override_model
            elif "gpt" in override_model.lower():
                if "openai" in self.providers:
                    return "openai", self.providers["openai"], override_model

        # Primary: Claude 3 Opus (most reliable vision-capable model)
        if "anthropic" in self.providers:
            model = "claude-3-opus-20240229"  # Most capable vision model
            logger.info(f"Using Claude 3 Opus for vision analysis")
            return "anthropic", self.providers["anthropic"], model

        # Fallback: GPT-4o
        if "openai" in self.providers:
            model = "gpt-4o"
            logger.info(f"Using GPT-4o for vision analysis")
            return "openai", self.providers["openai"], model

        # 둘 다 없으면 에러
        raise ProviderError(
            message="No vision-capable provider available",
            provider="gateway",
            details={
                "available_providers": list(self.providers.keys()),
                "required": ["anthropic (Claude 3.5 Sonnet)", "openai (GPT-4o)"]
            }
        )

    def _merge_vision_options(
        self,
        provider: LLMProvider,
        user_options: Optional[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Vision API용 옵션 병합

        Args:
            provider: Provider 인스턴스
            user_options: 사용자 지정 옵션

        Returns:
            병합된 옵션
        """
        # Vision API 기본 옵션
        options = {
            "temperature": 0.2,  # 분석의 일관성을 위해 낮은 온도
            "max_tokens": 2000   # 상세한 분석을 위해 충분한 토큰
        }

        # Provider 기본값 병합
        provider_defaults = provider.get_default_options("vision_analyzer", "image_analysis")
        options.update(provider_defaults)

        # 사용자 옵션으로 오버라이드
        if user_options:
            options.update(user_options)

        return options

    async def health_check(self) -> Dict[str, Any]:
        """
        Gateway 및 모든 Provider 상태 확인

        Returns:
            상태 정보
        """
        results = {}

        for name, provider in self.providers.items():
            try:
                is_healthy = await provider.health_check()
                results[name] = {
                    "status": "healthy" if is_healthy else "unhealthy",
                    "vendor": provider.vendor
                }
            except Exception as e:
                results[name] = {
                    "status": "error",
                    "error": str(e)
                }

        return {
            "gateway": "healthy",
            "mode": settings.GENERATOR_MODE,
            "providers": results
        }


# 전역 Gateway 인스턴스
_gateway_instance: Optional[LLMGateway] = None


def get_gateway() -> LLMGateway:
    """
    전역 Gateway 인스턴스 반환 (싱글톤)

    Returns:
        LLMGateway 인스턴스
    """
    global _gateway_instance
    if _gateway_instance is None:
        _gateway_instance = LLMGateway()
    return _gateway_instance
