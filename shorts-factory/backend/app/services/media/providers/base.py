"""
Media Provider Base

모든 Media Provider가 구현해야 하는 추상 인터페이스

작성일: 2025-12-06
원본: sparklio_ai_marketing_studio/backend/app/services/media/providers/base.py
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, List, Literal
from pydantic import BaseModel, Field
from datetime import datetime


class MediaProviderOutput(BaseModel):
    """Media Provider 출력 구조화 모델"""
    type: Literal["image", "video", "audio"] = Field(..., description="미디어 타입")
    format: str = Field(..., description="미디어 포맷 (png, jpg, mp4, wav 등)")
    data: str = Field(..., description="Base64 인코딩된 데이터 또는 URL")
    width: Optional[int] = Field(None, description="이미지/비디오 너비 (픽셀)")
    height: Optional[int] = Field(None, description="이미지/비디오 높이 (픽셀)")
    duration: Optional[float] = Field(None, description="비디오/오디오 길이 (초)")


class MediaProviderResponse(BaseModel):
    """Media Provider 응답 표준 형식"""
    provider: str = Field(..., description="Provider 벤더명")
    model: str = Field(..., description="사용된 모델명")
    usage: Dict[str, Any] = Field(default_factory=dict, description="리소스 사용량")
    outputs: List[MediaProviderOutput] = Field(..., description="생성된 미디어 목록")
    meta: Dict[str, Any] = Field(default_factory=dict, description="메타데이터")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="응답 생성 시각")


class MediaProvider(ABC):
    """Media Provider 추상 베이스 클래스"""

    def __init__(self, vendor: str, base_url: str, timeout: int = 300):
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
        """미디어 생성"""
        pass

    @abstractmethod
    async def health_check(self) -> bool:
        """Provider 헬스 체크"""
        pass

    def get_default_options(self, task: str, media_type: str) -> Dict[str, Any]:
        """작업 유형별 기본 옵션 반환"""
        return {}


class ProviderError(Exception):
    """Provider 호출 중 발생하는 에러"""

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
