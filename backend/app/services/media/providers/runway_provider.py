"""
Runway Gen-3 Provider (Image-to-Video)

Runway ML Gen-3 API를 사용하여 이미지를 실제 움직이는 영상으로 변환

작성일: 2025-12-01
작성자: B팀 (Backend)
참조: https://docs.runwayml.com/

기능:
- Image-to-Video: 정적 이미지를 움직이는 영상으로 변환
- Text-to-Video: 텍스트 프롬프트로 영상 생성

요구사항:
- RUNWAY_API_KEY 환경변수 필요
"""

import logging
import asyncio
import httpx
from typing import Dict, Any, Optional, Literal
from datetime import datetime

from .base import MediaProvider, MediaProviderResponse, MediaProviderOutput, ProviderError

logger = logging.getLogger(__name__)


class RunwayProvider(MediaProvider):
    """
    Runway Gen-3 Provider

    Gen-3 Alpha/Turbo 모델을 사용하여 이미지를 실제 움직이는 영상으로 변환합니다.

    모델 종류:
    - gen3a_turbo: 빠른 생성 (5 credits/sec)
    - gen3a: 고품질 (12 credits/sec)

    사용 예시:
        provider = RunwayProvider(api_key="runway-...")
        response = await provider.generate(
            prompt="Camera slowly zooms in while petals fall",
            task="image_to_video",
            media_type="video",
            options={"image_url": "https://...", "duration": 5}
        )
    """

    # Runway API Endpoints
    API_BASE = "https://api.runwayml.com/v1"
    TASKS_ENDPOINT = f"{API_BASE}/tasks"

    def __init__(
        self,
        api_key: str,
        model: str = "gen3a_turbo",  # turbo가 더 빠르고 저렴
        timeout: int = 300,
        poll_interval: int = 5,
        max_wait_time: int = 600
    ):
        """
        Runway Provider 초기화

        Args:
            api_key: Runway API 키
            model: 사용할 모델 (gen3a_turbo, gen3a)
            timeout: API 호출 타임아웃 (초)
            poll_interval: 상태 확인 간격 (초)
            max_wait_time: 최대 대기 시간 (초)
        """
        super().__init__(
            vendor="runway",
            base_url=self.API_BASE,
            timeout=timeout
        )
        self.api_key = api_key
        self.model = model
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
            prompt: 모션 프롬프트
            task: 작업 유형 ("image_to_video", "text_to_video")
            media_type: "video"만 지원
            options:
                - image_url: 입력 이미지 URL
                - duration: 영상 길이 (5 또는 10초)
                - ratio: 화면 비율 ("16:9", "9:16", "1:1")
                - watermark: 워터마크 여부 (기본 False)

        Returns:
            MediaProviderResponse

        Raises:
            ProviderError
        """
        if media_type != "video":
            raise ProviderError(
                message=f"Runway only supports 'video', got '{media_type}'",
                provider=self.vendor,
                status_code=400
            )

        opts = options or {}
        start_time = datetime.utcnow()

        logger.info(f"[Runway] Starting {task}: prompt='{prompt[:50]}...'")

        try:
            # 1. Task 생성
            task_id = await self._create_task(prompt, task, opts)

            # 2. 완료까지 폴링
            result = await self._poll_task(task_id)

            # 3. 결과 처리
            elapsed = (datetime.utcnow() - start_time).total_seconds()

            video_url = result.get("output", [None])[0]
            if not video_url:
                raise ProviderError(
                    message="No video URL in response",
                    provider=self.vendor,
                    details=result
                )

            duration = opts.get("duration", 5)

            return MediaProviderResponse(
                provider=self.vendor,
                model=self.model,
                usage={
                    "generation_time_sec": elapsed,
                    "credits_used": duration * (5 if "turbo" in self.model else 12)
                },
                outputs=[
                    MediaProviderOutput(
                        type="video",
                        format="mp4",
                        data=video_url,
                        width=1280 if opts.get("ratio") == "16:9" else 720,
                        height=720 if opts.get("ratio") == "16:9" else 1280,
                        duration=float(duration)
                    )
                ],
                meta={
                    "task_id": task_id,
                    "prompt": prompt,
                    "model": self.model,
                    "status": result.get("status")
                }
            )

        except ProviderError:
            raise
        except Exception as e:
            logger.error(f"[Runway] Generation failed: {e}", exc_info=True)
            raise ProviderError(
                message=f"Runway generation failed: {str(e)}",
                provider=self.vendor,
                details={"prompt": prompt[:100], "task": task}
            )

    async def _create_task(
        self,
        prompt: str,
        task: str,
        options: Dict[str, Any]
    ) -> str:
        """Task 생성"""
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "X-Runway-Version": "2024-11-06"  # API 버전
        }

        # 요청 본문 구성
        payload = {
            "model": self.model,
            "promptText": prompt,
            "duration": options.get("duration", 5),
            "ratio": options.get("ratio", "9:16"),
            "watermark": options.get("watermark", False)
        }

        # Image-to-Video인 경우
        if task == "image_to_video":
            image_url = options.get("image_url")
            if not image_url:
                raise ProviderError(
                    message="image_to_video requires 'image_url'",
                    provider=self.vendor,
                    status_code=400
                )
            payload["promptImage"] = image_url

        logger.debug(f"[Runway] Creating task: {payload}")

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.post(
                f"{self.TASKS_ENDPOINT}/image_to_video" if task == "image_to_video" else f"{self.TASKS_ENDPOINT}/text_to_video",
                headers=headers,
                json=payload
            )

            if response.status_code not in [200, 201]:
                raise ProviderError(
                    message=f"Failed to create task: {response.text}",
                    provider=self.vendor,
                    status_code=response.status_code,
                    details={"response": response.text}
                )

            data = response.json()
            task_id = data.get("id")

            if not task_id:
                raise ProviderError(
                    message="No task ID in response",
                    provider=self.vendor,
                    details=data
                )

            logger.info(f"[Runway] Task created: {task_id}")
            return task_id

    async def _poll_task(self, task_id: str) -> Dict[str, Any]:
        """Task 완료까지 폴링"""
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "X-Runway-Version": "2024-11-06"
        }

        url = f"{self.TASKS_ENDPOINT}/{task_id}"
        start_time = datetime.utcnow()

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            while True:
                elapsed = (datetime.utcnow() - start_time).total_seconds()
                if elapsed > self.max_wait_time:
                    raise ProviderError(
                        message=f"Task timed out after {self.max_wait_time}s",
                        provider=self.vendor,
                        details={"task_id": task_id}
                    )

                response = await client.get(url, headers=headers)

                if response.status_code != 200:
                    raise ProviderError(
                        message=f"Failed to poll task: {response.text}",
                        provider=self.vendor,
                        status_code=response.status_code
                    )

                data = response.json()
                status = data.get("status")

                logger.debug(f"[Runway] Task {task_id} status: {status}")

                if status == "SUCCEEDED":
                    return data
                elif status in ["FAILED", "CANCELLED"]:
                    raise ProviderError(
                        message=f"Task {status}: {data.get('failure', 'Unknown')}",
                        provider=self.vendor,
                        details=data
                    )

                # 대기 후 재시도
                await asyncio.sleep(self.poll_interval)

    async def health_check(self) -> bool:
        """헬스 체크"""
        try:
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "X-Runway-Version": "2024-11-06"
            }
            async with httpx.AsyncClient(timeout=10) as client:
                response = await client.get(
                    f"{self.TASKS_ENDPOINT}",
                    headers=headers,
                    params={"limit": 1}
                )
                return response.status_code in [200, 401]
        except Exception as e:
            logger.warning(f"[Runway] Health check failed: {e}")
            return False

    def get_default_options(self, task: str, media_type: str) -> Dict[str, Any]:
        """기본 옵션"""
        return {
            "duration": 5,
            "ratio": "9:16",  # 세로 영상 (숏폼용)
            "watermark": False
        }


# =============================================================================
# Factory Function
# =============================================================================

_runway_instance: Optional[RunwayProvider] = None


def get_runway_provider(api_key: Optional[str] = None) -> RunwayProvider:
    """
    Runway Provider 인스턴스 반환 (싱글톤)

    Args:
        api_key: Runway API 키 (없으면 환경변수에서 로드)

    Returns:
        RunwayProvider 인스턴스

    Raises:
        ValueError: API 키가 없을 때
    """
    global _runway_instance

    if _runway_instance is None:
        if not api_key:
            from app.core.config import settings
            api_key = getattr(settings, 'RUNWAY_API_KEY', None)

        if not api_key:
            raise ValueError("RUNWAY_API_KEY not configured")

        _runway_instance = RunwayProvider(api_key=api_key)

    return _runway_instance
