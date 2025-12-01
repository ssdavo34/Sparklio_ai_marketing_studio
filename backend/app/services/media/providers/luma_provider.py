"""
Luma AI Provider (Image-to-Video)

Luma AI Dream Machine API를 사용하여 이미지를 실제 움직이는 영상으로 변환

작성일: 2025-12-01
작성자: B팀 (Backend)
참조: https://docs.lumalabs.ai/

기능:
- Image-to-Video: 정적 이미지를 움직이는 영상으로 변환
- Text-to-Video: 텍스트 프롬프트로 영상 생성
- Video Extension: 기존 영상 연장

요구사항:
- LUMA_API_KEY 환경변수 필요
"""

import logging
import asyncio
import httpx
import base64
from typing import Dict, Any, Optional, Literal
from datetime import datetime

from .base import MediaProvider, MediaProviderResponse, MediaProviderOutput, ProviderError

logger = logging.getLogger(__name__)


class LumaProvider(MediaProvider):
    """
    Luma AI Provider

    Dream Machine API를 사용하여 이미지를 실제 움직이는 영상으로 변환합니다.

    지원 기능:
    - image_to_video: 이미지 → 영상 변환 (5초)
    - text_to_video: 텍스트 → 영상 생성 (5초)
    - extend_video: 영상 연장

    사용 예시:
        provider = LumaProvider(api_key="luma-...")
        response = await provider.generate(
            prompt="The flower gently sways in the breeze",
            task="image_to_video",
            media_type="video",
            options={"image_url": "https://..."}
        )
    """

    # Luma API Endpoints
    API_BASE = "https://api.lumalabs.ai/dream-machine/v1"
    GENERATIONS_ENDPOINT = f"{API_BASE}/generations"

    def __init__(
        self,
        api_key: str,
        timeout: int = 300,  # 5분 (영상 생성은 오래 걸림)
        poll_interval: int = 5,  # 5초마다 상태 확인
        max_wait_time: int = 600  # 최대 10분 대기
    ):
        """
        Luma Provider 초기화

        Args:
            api_key: Luma AI API 키
            timeout: API 호출 타임아웃 (초)
            poll_interval: 상태 확인 간격 (초)
            max_wait_time: 최대 대기 시간 (초)
        """
        super().__init__(
            vendor="luma",
            base_url=self.API_BASE,
            timeout=timeout
        )
        self.api_key = api_key
        self.poll_interval = poll_interval
        self.max_wait_time = max_wait_time

    async def generate(
        self,
        prompt: str,
        task: str,
        media_type: Literal["image", "video", "audio"],
        options: Optional[Dict[str, Any]] = None
    ) -> MediaProviderResponse:
        """
        영상 생성

        Args:
            prompt: 모션 프롬프트 (어떻게 움직일지 설명)
            task: 작업 유형
                - "image_to_video": 이미지 → 영상
                - "text_to_video": 텍스트 → 영상
            media_type: "video"만 지원
            options:
                - image_url: 입력 이미지 URL (image_to_video 필수)
                - image_base64: 입력 이미지 Base64 (image_url 대체)
                - aspect_ratio: "16:9", "9:16", "1:1" 등
                - loop: True/False (루프 영상 여부)

        Returns:
            MediaProviderResponse: 생성된 영상 정보

        Raises:
            ProviderError: API 호출 실패
        """
        if media_type != "video":
            raise ProviderError(
                message=f"Luma only supports 'video', got '{media_type}'",
                provider=self.vendor,
                status_code=400
            )

        opts = options or {}
        start_time = datetime.utcnow()

        logger.info(f"[Luma] Starting {task}: prompt='{prompt[:50]}...'")

        try:
            # 1. Generation 요청 생성
            generation_id = await self._create_generation(prompt, task, opts)

            # 2. 완료까지 폴링
            result = await self._poll_generation(generation_id)

            # 3. 결과 처리
            elapsed = (datetime.utcnow() - start_time).total_seconds()

            video_url = result.get("assets", {}).get("video")
            if not video_url:
                raise ProviderError(
                    message="No video URL in response",
                    provider=self.vendor,
                    details=result
                )

            # 영상 다운로드 (Base64 변환은 선택적)
            video_data = await self._download_video(video_url)

            return MediaProviderResponse(
                provider=self.vendor,
                model="dream-machine-v1",
                usage={
                    "generation_time_sec": elapsed,
                    "credits_used": 1  # 추정치
                },
                outputs=[
                    MediaProviderOutput(
                        type="video",
                        format="mp4",
                        data=video_url,  # URL 반환 (Base64는 너무 큼)
                        width=result.get("resolution", {}).get("width", 1080),
                        height=result.get("resolution", {}).get("height", 1920),
                        duration=5.0  # Luma 기본 5초
                    )
                ],
                meta={
                    "generation_id": generation_id,
                    "prompt": prompt,
                    "task": task,
                    "state": result.get("state")
                }
            )

        except ProviderError:
            raise
        except Exception as e:
            logger.error(f"[Luma] Generation failed: {e}", exc_info=True)
            raise ProviderError(
                message=f"Luma generation failed: {str(e)}",
                provider=self.vendor,
                details={"prompt": prompt[:100], "task": task}
            )

    async def _create_generation(
        self,
        prompt: str,
        task: str,
        options: Dict[str, Any]
    ) -> str:
        """Generation 요청 생성"""
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

        # 요청 본문 구성
        payload = {
            "prompt": prompt,
        }

        # Image-to-Video인 경우 이미지 정보 추가
        if task == "image_to_video":
            image_url = options.get("image_url")
            image_base64 = options.get("image_base64")

            if image_url:
                payload["keyframes"] = {
                    "frame0": {
                        "type": "image",
                        "url": image_url
                    }
                }
            elif image_base64:
                # Base64를 임시 URL로 변환 필요 (Luma는 URL만 지원)
                # 또는 data URI 사용 시도
                payload["keyframes"] = {
                    "frame0": {
                        "type": "image",
                        "url": f"data:image/png;base64,{image_base64}"
                    }
                }
            else:
                raise ProviderError(
                    message="image_to_video requires 'image_url' or 'image_base64'",
                    provider=self.vendor,
                    status_code=400
                )

        # 옵션 추가
        if options.get("aspect_ratio"):
            payload["aspect_ratio"] = options["aspect_ratio"]
        if options.get("loop"):
            payload["loop"] = options["loop"]

        logger.debug(f"[Luma] Creating generation: {payload}")

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.post(
                self.GENERATIONS_ENDPOINT,
                headers=headers,
                json=payload
            )

            if response.status_code != 201:
                raise ProviderError(
                    message=f"Failed to create generation: {response.text}",
                    provider=self.vendor,
                    status_code=response.status_code,
                    details={"response": response.text}
                )

            data = response.json()
            generation_id = data.get("id")

            if not generation_id:
                raise ProviderError(
                    message="No generation ID in response",
                    provider=self.vendor,
                    details=data
                )

            logger.info(f"[Luma] Generation created: {generation_id}")
            return generation_id

    async def _poll_generation(self, generation_id: str) -> Dict[str, Any]:
        """Generation 완료까지 폴링"""
        headers = {
            "Authorization": f"Bearer {self.api_key}"
        }

        url = f"{self.GENERATIONS_ENDPOINT}/{generation_id}"
        start_time = datetime.utcnow()

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            while True:
                elapsed = (datetime.utcnow() - start_time).total_seconds()
                if elapsed > self.max_wait_time:
                    raise ProviderError(
                        message=f"Generation timed out after {self.max_wait_time}s",
                        provider=self.vendor,
                        details={"generation_id": generation_id}
                    )

                response = await client.get(url, headers=headers)

                if response.status_code != 200:
                    raise ProviderError(
                        message=f"Failed to poll generation: {response.text}",
                        provider=self.vendor,
                        status_code=response.status_code
                    )

                data = response.json()
                state = data.get("state")

                logger.debug(f"[Luma] Generation {generation_id} state: {state}")

                if state == "completed":
                    return data
                elif state == "failed":
                    raise ProviderError(
                        message=f"Generation failed: {data.get('failure_reason', 'Unknown')}",
                        provider=self.vendor,
                        details=data
                    )

                # 대기 후 재시도
                await asyncio.sleep(self.poll_interval)

    async def _download_video(self, url: str) -> Optional[bytes]:
        """영상 다운로드 (선택적)"""
        try:
            async with httpx.AsyncClient(timeout=60, follow_redirects=True) as client:
                response = await client.get(url)
                response.raise_for_status()
                return response.content
        except Exception as e:
            logger.warning(f"[Luma] Failed to download video: {e}")
            return None

    async def health_check(self) -> bool:
        """헬스 체크"""
        try:
            headers = {
                "Authorization": f"Bearer {self.api_key}"
            }
            async with httpx.AsyncClient(timeout=10) as client:
                response = await client.get(
                    f"{self.API_BASE}/generations",
                    headers=headers,
                    params={"limit": 1}
                )
                return response.status_code in [200, 401]  # 401도 API 작동 확인
        except Exception as e:
            logger.warning(f"[Luma] Health check failed: {e}")
            return False

    def get_default_options(self, task: str, media_type: str) -> Dict[str, Any]:
        """기본 옵션"""
        defaults = {
            "aspect_ratio": "9:16",  # 세로 영상 (숏폼용)
            "loop": False
        }

        if task == "text_to_video":
            defaults["aspect_ratio"] = "16:9"  # 가로 영상

        return defaults


# =============================================================================
# Factory Function
# =============================================================================

_luma_instance: Optional[LumaProvider] = None


def get_luma_provider(api_key: Optional[str] = None) -> LumaProvider:
    """
    Luma Provider 인스턴스 반환 (싱글톤)

    Args:
        api_key: Luma API 키 (없으면 환경변수에서 로드)

    Returns:
        LumaProvider 인스턴스

    Raises:
        ValueError: API 키가 없을 때
    """
    global _luma_instance

    if _luma_instance is None:
        if not api_key:
            from app.core.config import settings
            api_key = getattr(settings, 'LUMA_API_KEY', None)

        if not api_key:
            raise ValueError("LUMA_API_KEY not configured")

        _luma_instance = LumaProvider(api_key=api_key)

    return _luma_instance
