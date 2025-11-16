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
            logger.info(f"Initializing Ollama Provider with base_url={settings.OLLAMA_BASE_URL}...")
            self.providers["ollama"] = OllamaProvider(
                base_url=settings.OLLAMA_BASE_URL,
                timeout=settings.OLLAMA_TIMEOUT,
                default_model=settings.OLLAMA_DEFAULT_MODEL
            )
            logger.info("Ollama Provider initialized successfully")

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
                "product_detail": "당신은 전문 카피라이터입니다. 제품의 특징을 매력적으로 표현하세요.",
                "sns": "당신은 SNS 콘텐츠 전문가입니다. 짧고 임팩트 있는 메시지를 작성하세요.",
                "brand_kit": "당신은 브랜드 스토리텔링 전문가입니다. 브랜드의 목소리와 톤을 정의하세요."
            },
            "strategist": {
                "brand_kit": "당신은 마케팅 전략가입니다. 브랜드 포지셔닝과 타겟 전략을 수립하세요.",
                "campaign": "당신은 캠페인 기획자입니다. 효과적인 마케팅 캠페인을 설계하세요."
            },
            "reviewer": {
                "review": "당신은 콘텐츠 검토 전문가입니다. 객관적으로 품질을 평가하세요."
            }
        }

        # 역할/작업별 프롬프트 가져오기
        role_prompts = system_prompts.get(role, {})
        prompt = role_prompts.get(task)

        if not prompt:
            # 기본 프롬프트
            prompt = f"당신은 {role} 역할을 수행합니다. {task} 작업을 처리하세요."

        return prompt

    def _format_payload(self, payload: Dict[str, Any]) -> str:
        """
        Payload를 프롬프트 형식으로 변환

        Args:
            payload: 입력 데이터

        Returns:
            포맷된 문자열
        """
        lines = []
        for key, value in payload.items():
            if isinstance(value, (list, dict)):
                import json
                value_str = json.dumps(value, ensure_ascii=False, indent=2)
            else:
                value_str = str(value)

            lines.append(f"{key}: {value_str}")

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
