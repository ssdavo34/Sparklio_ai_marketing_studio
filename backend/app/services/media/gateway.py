"""
Media Gateway Service

모든 미디어 생성 호출을 중앙에서 관리하는 Gateway

작성일: 2025-11-16
작성자: B팀 (Backend)
문서: ARCH-002, SPEC-001
"""

import logging
from typing import Dict, Any, Optional, Literal
from datetime import datetime

from app.core.config import settings
from .providers.base import MediaProvider, MediaProviderResponse, ProviderError
from .providers.mock import MockMediaProvider
from .providers.comfyui import ComfyUIProvider

logger = logging.getLogger(__name__)

# NanoBanana Provider - optional (requires google-genai package)
try:
    from .providers.nanobanana_provider import NanoBananaProvider
    NANOBANANA_AVAILABLE = True
except ImportError:
    NANOBANANA_AVAILABLE = False
    logger.warning("NanoBanana Provider not available (missing google-genai package)")


class MediaGateway:
    """
    Media Gateway

    모든 미디어 생성 호출을 중앙에서 관리하는 Gateway 서비스

    주요 기능:
    1. Provider 추상화 (ComfyUI, DALL-E, Midjourney 등)
    2. Mock/Live 모드 자동 전환
    3. 에러 핸들링 및 재시도
    4. 로깅 및 모니터링

    사용 예시:
        gateway = MediaGateway()
        response = await gateway.generate(
            prompt="A beautiful product photo",
            task="product_image",
            media_type="image"
        )
    """

    def __init__(self):
        """Gateway 초기화"""
        self.providers: Dict[str, MediaProvider] = {}
        self._initialize_providers()

    def _initialize_providers(self):
        """Provider 초기화"""
        logger.info("Starting Media Provider initialization...")

        try:
            # Mock Provider는 항상 사용 가능
            logger.info("Initializing Mock Media Provider...")
            self.providers["mock"] = MockMediaProvider(response_delay=1.5)
            logger.info("Mock Media Provider initialized successfully")

            # ComfyUI Provider (Live 모드용)
            logger.info(f"Initializing ComfyUI Provider with base_url={settings.comfyui_base_url}...")
            self.providers["comfyui"] = ComfyUIProvider(
                base_url=settings.comfyui_base_url,
                timeout=settings.comfyui_timeout
            )
            logger.info("ComfyUI Provider initialized successfully")

            # Nano Banana Provider (Gemini Image Generation)
            if NANOBANANA_AVAILABLE and hasattr(settings, 'GOOGLE_API_KEY') and settings.GOOGLE_API_KEY:
                logger.info("Initializing Nano Banana Provider...")
                self.providers["nanobanana"] = NanoBananaProvider(
                    api_key=settings.GOOGLE_API_KEY,
                    default_model=settings.GEMINI_IMAGE_MODEL,
                    timeout=settings.GEMINI_TIMEOUT
                )
                logger.info("Nano Banana Provider initialized successfully")
            elif not NANOBANANA_AVAILABLE:
                logger.info("Nano Banana Provider skipped (google-genai not installed)")

            logger.info(f"All Media Providers initialized: {list(self.providers.keys())}")

        except Exception as e:
            logger.error(f"Media Provider initialization failed: {type(e).__name__}: {str(e)}", exc_info=True)
            raise

    async def generate(
        self,
        prompt: str,
        task: str,
        media_type: Literal["image", "video", "audio"] = "image",
        options: Optional[Dict[str, Any]] = None
    ) -> MediaProviderResponse:
        """
        미디어 생성

        Args:
            prompt: 생성 프롬프트
            task: 작업 유형 (product_image, brand_logo, sns_thumbnail 등)
            media_type: 미디어 타입 (image, video, audio)
            options: Provider별 추가 옵션

        Returns:
            MediaProviderResponse: 표준 형식의 응답

        Raises:
            ProviderError: Provider 호출 실패 시
            ValueError: 잘못된 파라미터

        Example:
            >>> gateway = MediaGateway()
            >>> response = await gateway.generate(
            ...     prompt="A modern wireless earbud",
            ...     task="product_image",
            ...     media_type="image"
            ... )
            >>> print(response.outputs[0].data)
        """
        start_time = datetime.utcnow()

        try:
            # 1. Provider 선택 (Mock/Live 모드)
            provider_name, provider = self._select_provider(task, media_type)

            # 2. 옵션 병합 (기본값 + 사용자 지정)
            merged_options = self._merge_options(provider, task, media_type, options)

            logger.info(
                f"Media Generate: task={task}, media_type={media_type}, "
                f"provider={provider_name}"
            )

            # 3. 미디어 생성
            response = await provider.generate(
                prompt=prompt,
                task=task,
                media_type=media_type,
                options=merged_options
            )

            # 4. 로깅
            elapsed = (datetime.utcnow() - start_time).total_seconds()
            logger.info(
                f"Media Success: {provider_name} - "
                f"elapsed={elapsed:.2f}s, outputs={len(response.outputs)}"
            )

            return response

        except ProviderError as e:
            logger.error(f"Media Provider error: {e.message}", exc_info=True)
            raise

        except Exception as e:
            logger.error(f"Unexpected error in Media Gateway: {str(e)}", exc_info=True)
            raise ProviderError(
                message=f"Gateway error: {str(e)}",
                provider="gateway",
                details={"task": task, "media_type": media_type}
            )

    def _select_provider(
        self,
        task: str,
        media_type: str
    ) -> tuple[str, MediaProvider]:
        """
        Provider 선택 (Mock/Live 모드 자동 전환)

        Args:
            task: 작업 유형
            media_type: 미디어 타입

        Returns:
            (provider_name, provider_instance) 튜플

        Raises:
            ProviderError: Provider를 찾을 수 없을 때
        """
        # Mock 모드 확인
        if settings.generator_mode == "mock":
            return "mock", self.providers["mock"]

        # Live 모드 - 미디어 타입별 Provider 결정
        if media_type == "image":
            # 나노바나나 우선, 없으면 ComfyUI
            if "nanobanana" in self.providers:
                provider_name = "nanobanana"
            else:
                provider_name = "comfyui"
        elif media_type == "video":
            # 추후 비디오 Provider 추가
            logger.warning("Video provider not implemented, falling back to mock")
            return "mock", self.providers["mock"]
        elif media_type == "audio":
            # 추후 오디오 Provider 추가
            logger.warning("Audio provider not implemented, falling back to mock")
            return "mock", self.providers["mock"]
        else:
            raise ValueError(f"Unsupported media_type: {media_type}")

        # Provider 인스턴스 가져오기
        provider = self.providers.get(provider_name)

        if not provider:
            # Provider가 없으면 Mock으로 폴백
            logger.warning(
                f"Provider '{provider_name}' not found, falling back to mock"
            )
            return "mock", self.providers["mock"]

        return provider_name, provider

    def _merge_options(
        self,
        provider: MediaProvider,
        task: str,
        media_type: str,
        user_options: Optional[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        옵션 병합 (기본값 + 사용자 지정)

        Args:
            provider: Provider 인스턴스
            task: 작업 유형
            media_type: 미디어 타입
            user_options: 사용자 지정 옵션

        Returns:
            병합된 옵션
        """
        # Provider 기본값
        options = provider.get_default_options(task, media_type)

        # 사용자 옵션으로 오버라이드
        if user_options:
            options.update(user_options)

        return options

    async def generate_image(
        self,
        prompt: str,
        negative_prompt: Optional[str] = None,
        width: int = 1024,
        height: int = 1024,
        seed: Optional[int] = None,
        size: Optional[str] = None,
        provider: str = "auto",
        **kwargs
    ) -> Dict[str, Any]:
        """
        이미지 생성 (VisionGeneratorAgent 호환 인터페이스)

        Args:
            prompt: 이미지 생성 프롬프트
            negative_prompt: 네거티브 프롬프트
            width: 이미지 너비
            height: 이미지 높이
            seed: 랜덤 시드
            size: DALL-E 스타일 크기 (예: "1024x1024")
            provider: 사용할 provider (nanobanana, dalle, comfyui, auto)
            **kwargs: 추가 옵션

        Returns:
            {"url": str, "base64": str, "seed": int}
        """
        # size 파라미터가 있으면 width/height로 변환
        if size:
            try:
                w, h = size.split("x")
                width, height = int(w), int(h)
            except ValueError:
                pass

        # Provider 선택
        if provider == "auto":
            # nanobanana 우선, 없으면 comfyui, 마지막으로 mock
            if "nanobanana" in self.providers:
                selected_provider = "nanobanana"
            elif "comfyui" in self.providers:
                selected_provider = "comfyui"
            else:
                selected_provider = "mock"
        else:
            selected_provider = provider

        # Provider 확인
        if selected_provider not in self.providers:
            logger.warning(f"Provider '{selected_provider}' not found, using mock")
            selected_provider = "mock"

        provider_instance = self.providers[selected_provider]

        # 옵션 구성
        options = {
            "width": width,
            "height": height,
            "negative_prompt": negative_prompt,
            "seed": seed,
            **kwargs
        }

        logger.info(f"[MediaGateway] generate_image: provider={selected_provider}, size={width}x{height}")

        try:
            # Provider 호출
            response = await provider_instance.generate(
                prompt=prompt,
                task="image_generation",
                media_type="image",
                options=options
            )

            # 응답 변환
            if response.outputs and len(response.outputs) > 0:
                output = response.outputs[0]
                return {
                    "url": output.data if output.data.startswith("http") else None,
                    "base64": output.data if not output.data.startswith("http") else None,
                    "seed": output.metadata.get("seed") if output.metadata else seed
                }
            else:
                raise ValueError("No output from provider")

        except Exception as e:
            logger.error(f"[MediaGateway] generate_image failed: {e}")
            raise

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
            "mode": settings.generator_mode,
            "providers": results
        }


# 전역 Gateway 인스턴스
_gateway_instance: Optional[MediaGateway] = None


def get_media_gateway() -> MediaGateway:
    """
    전역 Media Gateway 인스턴스 반환 (싱글톤)

    Returns:
        MediaGateway 인스턴스
    """
    global _gateway_instance
    if _gateway_instance is None:
        _gateway_instance = MediaGateway()
    return _gateway_instance
