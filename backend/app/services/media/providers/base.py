"""
Media Provider Base

모든 Media Provider가 구현해야 하는 추상 인터페이스

작성일: 2025-11-16
작성자: B팀 (Backend)
문서: ARCH-002, SPEC-001
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, List, Literal
from pydantic import BaseModel, Field
from datetime import datetime


class MediaProviderOutput(BaseModel):
    """
    Media Provider 출력 구조화 모델

    type: "image" | "video" | "audio"
    format: 출력 포맷 (png, jpg, mp4, wav 등)
    data: Base64 인코딩된 미디어 데이터 또는 URL
    """
    type: Literal["image", "video", "audio"] = Field(..., description="미디어 타입")
    format: str = Field(..., description="미디어 포맷 (png, jpg, mp4, wav 등)")
    data: str = Field(..., description="Base64 인코딩된 데이터 또는 URL")
    width: Optional[int] = Field(None, description="이미지/비디오 너비 (픽셀)")
    height: Optional[int] = Field(None, description="이미지/비디오 높이 (픽셀)")
    duration: Optional[float] = Field(None, description="비디오/오디오 길이 (초)")


class MediaProviderResponse(BaseModel):
    """
    Media Provider 응답 표준 형식

    모든 Provider는 이 형식으로 응답을 반환해야 함
    """
    provider: str = Field(..., description="Provider 벤더명 (comfyui, dalle, midjourney 등)")
    model: str = Field(..., description="사용된 모델명 또는 워크플로우명")
    usage: Dict[str, Any] = Field(
        default_factory=dict,
        description="리소스 사용량 (generation_time, vram_used 등)"
    )
    outputs: List[MediaProviderOutput] = Field(..., description="생성된 미디어 목록")
    meta: Dict[str, Any] = Field(
        default_factory=dict,
        description="메타데이터 (seed, steps, cfg_scale 등)"
    )
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="응답 생성 시각")


class MediaProvider(ABC):
    """
    Media Provider 추상 베이스 클래스

    모든 Media Provider는 이 인터페이스를 구현해야 함
    - ComfyUI Provider
    - DALL-E Provider
    - Midjourney Provider
    - Stable Diffusion Provider
    """

    def __init__(self, vendor: str, base_url: str, timeout: int = 300):
        """
        Provider 초기화

        Args:
            vendor: Provider 벤더명
            base_url: Provider API Base URL
            timeout: API 호출 타임아웃 (초)
        """
        self.vendor = vendor
        self.base_url = base_url
        self.timeout = timeout

    @abstractmethod
    async def generate(
        self,
        prompt: str,
        task: str,
        media_type: Literal["image", "video", "audio"],
        options: Optional[Dict[str, Any]] = None
    ) -> MediaProviderResponse:
        """
        미디어 생성

        Args:
            prompt: 생성 프롬프트 (텍스트 설명)
            task: 작업 유형 (product_image, brand_logo, sns_thumbnail 등)
            media_type: 생성할 미디어 타입
            options: Provider별 추가 옵션

        Returns:
            MediaProviderResponse: 표준 형식의 응답

        Raises:
            ProviderError: Provider 호출 실패 시
        """
        pass

    @abstractmethod
    async def health_check(self) -> bool:
        """
        Provider 헬스 체크

        Returns:
            정상 동작 여부
        """
        pass

    def get_default_options(self, task: str, media_type: str) -> Dict[str, Any]:
        """
        작업 유형별 기본 옵션 반환

        Args:
            task: 작업 유형
            media_type: 미디어 타입

        Returns:
            기본 옵션 딕셔너리
        """
        # 하위 클래스에서 오버라이드 가능
        return {}


class ProviderError(Exception):
    """
    Provider 호출 중 발생하는 에러

    모든 Provider는 이 에러를 발생시켜야 함
    """

    def __init__(
        self,
        message: str,
        provider: str,
        status_code: Optional[int] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        self.message = message
        self.provider = provider
        self.status_code = status_code
        self.details = details or {}
        super().__init__(self.message)
