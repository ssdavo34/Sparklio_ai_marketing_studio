"""
Mock Media Provider

테스트용으로 샘플 미디어를 빠르게 생성하는 Provider

작성일: 2025-11-16
작성자: B팀 (Backend)
문서: ARCH-002, SPEC-001
"""

import asyncio
import base64
from typing import Dict, Any, Optional, Literal
from datetime import datetime

from .base import MediaProvider, MediaProviderResponse, MediaProviderOutput


class MockMediaProvider(MediaProvider):
    """
    Mock Media Provider

    테스트용으로 샘플 이미지를 빠르게 생성하는 Provider
    - 실제 미디어 생성 없이 더미 데이터 반환
    - 빠른 응답 시간 (1~2초)
    """

    def __init__(self, response_delay: float = 1.5):
        """
        Mock Provider 초기화

        Args:
            response_delay: 응답 지연 시간 (초) - 네트워크 지연 시뮬레이션
        """
        super().__init__(
            vendor="mock",
            base_url="http://localhost:8188",
            timeout=60
        )
        self.response_delay = response_delay

    async def generate(
        self,
        prompt: str,
        task: str,
        media_type: Literal["image", "video", "audio"],
        options: Optional[Dict[str, Any]] = None
    ) -> MediaProviderResponse:
        """
        샘플 미디어 생성

        Args:
            prompt: 생성 프롬프트
            task: 작업 유형
            media_type: 미디어 타입
            options: 추가 옵션

        Returns:
            MediaProviderResponse: 샘플 응답
        """
        # 네트워크 지연 시뮬레이션
        await asyncio.sleep(self.response_delay)

        # 작업별 샘플 미디어 생성
        sample_output = self._generate_sample_media(prompt, task, media_type, options)

        return MediaProviderResponse(
            provider="mock",
            model="mock-media-v1",
            usage={
                "generation_time": self.response_delay,
                "vram_used": 0
            },
            outputs=[sample_output],
            meta={
                "prompt": prompt,
                "task": task,
                "seed": 42
            }
        )

    def _generate_sample_media(
        self,
        prompt: str,
        task: str,
        media_type: str,
        options: Optional[Dict[str, Any]]
    ) -> MediaProviderOutput:
        """
        작업 유형별 샘플 미디어 생성

        Args:
            prompt: 프롬프트
            task: 작업 유형
            media_type: 미디어 타입
            options: 추가 옵션

        Returns:
            샘플 미디어 데이터
        """
        if media_type == "image":
            return self._generate_sample_image(task, options)
        elif media_type == "video":
            return self._generate_sample_video(task, options)
        elif media_type == "audio":
            return self._generate_sample_audio(task, options)
        else:
            raise ValueError(f"Unsupported media_type: {media_type}")

    def _generate_sample_image(
        self,
        task: str,
        options: Optional[Dict[str, Any]]
    ) -> MediaProviderOutput:
        """
        샘플 이미지 생성 (1x1 빨간색 픽셀)

        Returns:
            샘플 이미지 데이터
        """
        # 1x1 빨간색 PNG (Base64)
        # 실제로는 ComfyUI가 생성한 이미지가 들어갈 자리
        red_pixel_png = (
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQI"
            "AX8jx0QAAAABJRU5ErkJggg=="
        )

        width = options.get("width", 512) if options else 512
        height = options.get("height", 512) if options else 512

        return MediaProviderOutput(
            type="image",
            format="png",
            data=red_pixel_png,
            width=width,
            height=height
        )

    def _generate_sample_video(
        self,
        task: str,
        options: Optional[Dict[str, Any]]
    ) -> MediaProviderOutput:
        """
        샘플 비디오 생성 (더미 데이터)

        Returns:
            샘플 비디오 데이터
        """
        # 실제로는 ComfyUI가 생성한 비디오가 들어갈 자리
        dummy_video = "DUMMY_VIDEO_BASE64_DATA"

        width = options.get("width", 1920) if options else 1920
        height = options.get("height", 1080) if options else 1080
        duration = options.get("duration", 5.0) if options else 5.0

        return MediaProviderOutput(
            type="video",
            format="mp4",
            data=dummy_video,
            width=width,
            height=height,
            duration=duration
        )

    def _generate_sample_audio(
        self,
        task: str,
        options: Optional[Dict[str, Any]]
    ) -> MediaProviderOutput:
        """
        샘플 오디오 생성 (더미 데이터)

        Returns:
            샘플 오디오 데이터
        """
        # 실제로는 TTS 엔진이 생성한 오디오가 들어갈 자리
        dummy_audio = "DUMMY_AUDIO_BASE64_DATA"

        duration = options.get("duration", 10.0) if options else 10.0

        return MediaProviderOutput(
            type="audio",
            format="wav",
            data=dummy_audio,
            duration=duration
        )

    async def health_check(self) -> bool:
        """
        Mock Provider는 항상 정상

        Returns:
            True (항상 정상)
        """
        return True

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
            return {
                "product_image": {"width": 1024, "height": 1024, "steps": 30},
                "brand_logo": {"width": 512, "height": 512, "steps": 20},
                "sns_thumbnail": {"width": 1200, "height": 630, "steps": 25}
            }.get(task, {"width": 512, "height": 512, "steps": 20})

        elif media_type == "video":
            return {
                "product_demo": {"width": 1920, "height": 1080, "duration": 10.0},
                "sns_video": {"width": 1080, "height": 1920, "duration": 15.0}
            }.get(task, {"width": 1920, "height": 1080, "duration": 5.0})

        elif media_type == "audio":
            return {
                "voiceover": {"duration": 30.0, "format": "wav"},
                "bgm": {"duration": 60.0, "format": "mp3"}
            }.get(task, {"duration": 10.0, "format": "wav"})

        return {}


def get_mock_media_provider(response_delay: float = 1.5) -> MockMediaProvider:
    """
    Mock Media Provider 인스턴스 생성

    Args:
        response_delay: 응답 지연 시간 (초)

    Returns:
        MockMediaProvider 인스턴스
    """
    return MockMediaProvider(response_delay=response_delay)
