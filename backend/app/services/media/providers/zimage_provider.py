"""
Z-Image Media Provider

로컬 GPU 서버에서 실행되는 Z-Image 이미지 생성 Provider
- ComfyUI보다 간단한 REST API 인터페이스
- SDXL/Flux 모델 지원
- 빠른 응답 (8스텝 기본)

작성일: 2025-12-03
작성자: B팀 (Backend)
"""

import httpx
import base64
import logging
import random
from typing import Dict, Any, Optional, Literal, List
from datetime import datetime

from app.core.config import settings
from .base import MediaProvider, MediaProviderResponse, MediaProviderOutput, ProviderError

logger = logging.getLogger(__name__)


class ZImageProvider(MediaProvider):
    """
    Z-Image Provider

    로컬 GPU 서버에서 실행되는 경량 이미지 생성 API

    특징:
    - REST API 기반 (ComfyUI 워크플로우보다 단순)
    - SDXL, Flux 등 다양한 모델 지원
    - 빠른 생성 (기본 8스텝)
    - 비용 없음 (로컬 GPU)
    - 콘텐츠 필터 없음
    """

    def __init__(
        self,
        base_url: str,
        timeout: int = 120,
        default_model: str = "sdxl",
        default_steps: int = 30
    ):
        """
        Z-Image Provider 초기화

        Args:
            base_url: Z-Image 서버 URL (예: http://100.120.180.42:7860)
            timeout: API 호출 타임아웃 (초)
            default_model: 기본 모델 (sdxl, flux, sd15 등)
            default_steps: 기본 스텝 수 (빠른 생성을 위해 8 권장)
        """
        super().__init__(
            vendor="zimage",
            base_url=base_url,
            timeout=timeout
        )
        self.default_model = default_model
        self.default_steps = default_steps

    async def generate(
        self,
        prompt: str,
        task: str,
        media_type: Literal["image", "video", "audio"],
        options: Optional[Dict[str, Any]] = None
    ) -> MediaProviderResponse:
        """
        Z-Image를 통한 이미지 생성

        Args:
            prompt: 생성 프롬프트
            task: 작업 유형 (product_image, brand_logo 등)
            media_type: 미디어 타입 (현재는 image만 지원)
            options: 추가 옵션
                - width: 이미지 너비 (기본 1024)
                - height: 이미지 높이 (기본 1024)
                - steps: 샘플링 스텝 수 (기본 8)
                - cfg_scale: CFG 스케일 (기본 7.0)
                - seed: 랜덤 시드 (-1이면 자동)
                - negative_prompt: 네거티브 프롬프트
                - model: 사용할 모델 (sdxl, flux 등)

        Returns:
            MediaProviderResponse: 생성된 이미지

        Raises:
            ProviderError: 생성 실패 시
        """
        start_time = datetime.utcnow()

        if media_type != "image":
            raise ProviderError(
                message=f"Z-Image Provider only supports 'image' type, got '{media_type}'",
                provider="zimage",
                details={"media_type": media_type}
            )

        try:
            # 기본 옵션 + 사용자 옵션 병합
            default_opts = self.get_default_options(task, "image")
            merged_opts = {**default_opts, **(options or {})}

            # 시드값 처리
            seed = merged_opts.get("seed", -1)
            if seed == -1:
                seed = random.randint(0, 2**32 - 1)

            # 요청 페이로드 구성
            payload = {
                "prompt": self._enhance_prompt(prompt, task),
                "negative_prompt": merged_opts.get("negative_prompt", "low quality, blurry, distorted, ugly"),
                "width": merged_opts.get("width", 1024),
                "height": merged_opts.get("height", 1024),
                "steps": merged_opts.get("steps", self.default_steps),
                "cfg_scale": merged_opts.get("cfg_scale", 7.0),
                "seed": seed,
                "model": merged_opts.get("model", self.default_model),
                "sampler": merged_opts.get("sampler", "euler"),
                "scheduler": merged_opts.get("scheduler", "normal"),
            }

            logger.info(f"[ZImage] Generating image: model={payload['model']}, size={payload['width']}x{payload['height']}, steps={payload['steps']}")

            # API 호출
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.base_url}/api/generate",
                    json=payload
                )
                response.raise_for_status()

                result = response.json()

            # 응답 파싱
            elapsed = (datetime.utcnow() - start_time).total_seconds()

            # 이미지 데이터 추출 (base64)
            image_data = result.get("image") or result.get("images", [None])[0]
            if not image_data:
                raise ProviderError(
                    message="No image data in Z-Image response",
                    provider="zimage",
                    details={"response": result}
                )

            # base64 prefix 제거 (있으면)
            if image_data.startswith("data:image"):
                image_data = image_data.split(",", 1)[1]

            outputs = [
                MediaProviderOutput(
                    type="image",
                    format="png",
                    data=image_data,
                    width=payload["width"],
                    height=payload["height"]
                )
            ]

            logger.info(f"[ZImage] Generation complete: elapsed={elapsed:.2f}s, seed={seed}")

            return MediaProviderResponse(
                provider="zimage",
                model=payload["model"],
                usage={
                    "generation_time": elapsed,
                    "steps": payload["steps"],
                    "vram_used": result.get("vram_used", 0)
                },
                outputs=outputs,
                meta={
                    "prompt": prompt,
                    "task": task,
                    "seed": seed,
                    "cfg_scale": payload["cfg_scale"],
                    "sampler": payload["sampler"]
                }
            )

        except httpx.HTTPStatusError as e:
            logger.error(f"[ZImage] HTTP error: {e.response.status_code} - {e.response.text}")
            raise ProviderError(
                message=f"Z-Image HTTP error: {e.response.text}",
                provider="zimage",
                status_code=e.response.status_code,
                details={"prompt": prompt, "task": task}
            )

        except httpx.TimeoutException:
            logger.error(f"[ZImage] Timeout after {self.timeout}s")
            raise ProviderError(
                message=f"Z-Image timeout after {self.timeout}s",
                provider="zimage",
                details={"prompt": prompt, "task": task, "timeout": self.timeout}
            )

        except Exception as e:
            logger.error(f"[ZImage] Generation failed: {type(e).__name__}: {str(e)}", exc_info=True)
            raise ProviderError(
                message=f"Z-Image generation failed: {str(e)}",
                provider="zimage",
                details={"prompt": prompt, "task": task}
            )

    def _enhance_prompt(self, prompt: str, task: str) -> str:
        """
        작업 유형별 프롬프트 개선

        Args:
            prompt: 원본 프롬프트
            task: 작업 유형

        Returns:
            개선된 프롬프트
        """
        # 작업별 스타일 가이드
        style_guides = {
            "product_image": "professional product photography, studio lighting, clean background, high quality, sharp details",
            "brand_logo": "minimalist logo design, vector style, clean lines, professional",
            "sns_thumbnail": "eye-catching social media image, vibrant colors, modern design",
            "banner_image": "wide banner design, professional layout, marketing style",
            "story_image": "instagram story style, vertical format, trendy design",
            "profile_image": "professional profile picture, clean background, well-lit",
        }

        style = style_guides.get(task, "high quality, professional")

        # 프롬프트 조합
        enhanced = f"{prompt}, {style}"

        return enhanced

    async def health_check(self) -> bool:
        """
        Z-Image 서버 헬스 체크

        Returns:
            정상 동작 여부
        """
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                # /health 또는 /api/health 엔드포인트 시도
                try:
                    response = await client.get(f"{self.base_url}/api/health")
                    response.raise_for_status()
                    return True
                except:
                    # 대체 엔드포인트 시도
                    response = await client.get(f"{self.base_url}/health")
                    response.raise_for_status()
                    return True

        except Exception as e:
            logger.warning(f"[ZImage] Health check failed: {str(e)}")
            return False

    def get_default_options(self, task: str, media_type: str) -> Dict[str, Any]:
        """
        작업별 기본 옵션

        Args:
            task: 작업 유형
            media_type: 미디어 타입

        Returns:
            기본 옵션
        """
        if media_type == "image":
            task_options = {
                "product_image": {
                    "width": 1024,
                    "height": 1024,
                    "steps": 30,
                    "cfg_scale": 7.0,
                    "model": "sdxl",
                    "sampler": "euler",
                    "negative_prompt": "low quality, blurry, distorted, watermark, text, logo"
                },
                "brand_logo": {
                    "width": 512,
                    "height": 512,
                    "steps": 30,
                    "cfg_scale": 8.0,
                    "model": "sdxl",
                    "sampler": "euler_ancestral",
                    "negative_prompt": "realistic photo, complex, busy background"
                },
                "sns_thumbnail": {
                    "width": 1200,
                    "height": 630,
                    "steps": 30,
                    "cfg_scale": 7.5,
                    "model": "sdxl",
                    "sampler": "euler",
                    "negative_prompt": "boring, low quality, ugly, blurry"
                },
                "banner_image": {
                    "width": 1920,
                    "height": 480,
                    "steps": 30,
                    "cfg_scale": 7.0,
                    "model": "sdxl",
                    "sampler": "euler",
                    "negative_prompt": "low quality, cluttered, unprofessional"
                },
                "story_image": {
                    "width": 1080,
                    "height": 1920,
                    "steps": 30,
                    "cfg_scale": 7.0,
                    "model": "sdxl",
                    "sampler": "euler",
                    "negative_prompt": "low quality, boring, outdated"
                },
                "image_generation": {
                    "width": 1024,
                    "height": 1024,
                    "steps": 30,
                    "cfg_scale": 7.0,
                    "model": "sdxl",
                    "sampler": "euler",
                    "negative_prompt": "low quality, blurry, distorted"
                }
            }

            return task_options.get(task, {
                "width": 1024,
                "height": 1024,
                "steps": self.default_steps,
                "cfg_scale": 7.0,
                "model": self.default_model,
                "sampler": "euler",
                "negative_prompt": "low quality, blurry"
            })

        return {}


def get_zimage_provider(
    base_url: str = None,
    timeout: int = 120,
    default_model: str = "sdxl",
    default_steps: int = 8
) -> ZImageProvider:
    """
    Z-Image Provider 인스턴스 생성

    Args:
        base_url: Z-Image 서버 URL (None이면 settings에서 가져옴)
        timeout: API 호출 타임아웃 (초)
        default_model: 기본 모델
        default_steps: 기본 스텝 수

    Returns:
        ZImageProvider 인스턴스
    """
    return ZImageProvider(
        base_url=base_url or getattr(settings, 'zimage_base_url', 'http://100.120.180.42:7860'),
        timeout=timeout or getattr(settings, 'zimage_timeout', 120),
        default_model=default_model or getattr(settings, 'zimage_default_model', 'sdxl'),
        default_steps=default_steps or getattr(settings, 'zimage_default_steps', 8)
    )
