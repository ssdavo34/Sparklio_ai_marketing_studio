"""
Google Veo 3 Provider (Image-to-Video / Text-to-Video)

Google Veo 3 API를 사용하여 이미지를 실제 움직이는 영상으로 변환

작성일: 2025-12-01
작성자: B팀 (Backend)
참조: https://ai.google.dev/gemini-api/docs/video

기능:
- Image-to-Video: 정적 이미지를 움직이는 영상으로 변환
- Text-to-Video: 텍스트 프롬프트로 영상 생성
- 네이티브 오디오 생성 지원

요구사항:
- GOOGLE_API_KEY 환경변수 (Gemini API 키와 동일)
"""

import logging
import asyncio
import base64
import httpx
from typing import Dict, Any, Optional, Literal
from datetime import datetime

from .base import MediaProvider, MediaProviderResponse, MediaProviderOutput, ProviderError

logger = logging.getLogger(__name__)


class VeoProvider(MediaProvider):
    """
    Google Veo 3 Provider

    Veo 3 모델을 사용하여 이미지를 실제 움직이는 영상으로 변환합니다.

    모델:
    - veo-3.0-generate-preview: 최신 Veo 3 모델 (8초 영상 생성)

    특징:
    - 고품질 영상 생성 (1080p)
    - 네이티브 오디오 생성 지원
    - 물리적 움직임 이해

    사용 예시:
        provider = VeoProvider(api_key="google-api-key")
        response = await provider.generate(
            prompt="A flower swaying gently in the breeze",
            task="image_to_video",
            media_type="video",
            options={"image_url": "https://..."}
        )
    """

    # Google AI API Endpoints
    API_BASE = "https://generativelanguage.googleapis.com/v1beta"

    def __init__(
        self,
        api_key: str,
        model: str = "veo-3.0-generate-preview",
        timeout: int = 600,  # 10분 (Veo는 시간이 오래 걸림)
        poll_interval: int = 10,  # 10초마다 상태 확인
        max_wait_time: int = 900  # 최대 15분 대기
    ):
        """
        Veo Provider 초기화

        Args:
            api_key: Google API 키 (Gemini API 키와 동일)
            model: 사용할 모델 (veo-3.0-generate-preview)
            timeout: API 호출 타임아웃 (초)
            poll_interval: 상태 확인 간격 (초)
            max_wait_time: 최대 대기 시간 (초)
        """
        super().__init__(
            vendor="veo",
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
            prompt: 모션 프롬프트 (어떻게 움직일지 설명)
            task: 작업 유형
                - "image_to_video": 이미지 → 영상
                - "text_to_video": 텍스트 → 영상
            media_type: "video"만 지원
            options:
                - image_url: 입력 이미지 URL (image_to_video)
                - image_base64: 입력 이미지 Base64 (image_to_video)
                - aspect_ratio: "16:9", "9:16" 등
                - duration_seconds: 영상 길이 (5 또는 8초)
                - generate_audio: True/False (네이티브 오디오 생성)
                - negative_prompt: 제외할 내용

        Returns:
            MediaProviderResponse: 생성된 영상 정보

        Raises:
            ProviderError: API 호출 실패
        """
        if media_type != "video":
            raise ProviderError(
                message=f"Veo only supports 'video', got '{media_type}'",
                provider=self.vendor,
                status_code=400
            )

        opts = options or {}
        start_time = datetime.utcnow()

        logger.info(f"[Veo] Starting {task}: prompt='{prompt[:50]}...'")

        try:
            # 1. Generation 요청 생성
            operation_name = await self._create_generation(prompt, task, opts)

            # 2. 완료까지 폴링
            result = await self._poll_operation(operation_name)

            # 3. 결과 처리
            elapsed = (datetime.utcnow() - start_time).total_seconds()

            # 결과에서 비디오 데이터 추출
            video_data = self._extract_video_from_result(result)
            if not video_data:
                raise ProviderError(
                    message="No video data in response",
                    provider=self.vendor,
                    details=result
                )

            duration = opts.get("duration_seconds", 8)

            return MediaProviderResponse(
                provider=self.vendor,
                model=self.model,
                usage={
                    "generation_time_sec": elapsed,
                },
                outputs=[
                    MediaProviderOutput(
                        type="video",
                        format="mp4",
                        data=video_data,  # Base64 또는 URL
                        width=1920 if opts.get("aspect_ratio") == "16:9" else 1080,
                        height=1080 if opts.get("aspect_ratio") == "16:9" else 1920,
                        duration=float(duration)
                    )
                ],
                meta={
                    "operation_name": operation_name,
                    "prompt": prompt,
                    "task": task,
                    "model": self.model
                }
            )

        except ProviderError:
            raise
        except Exception as e:
            logger.error(f"[Veo] Generation failed: {e}", exc_info=True)
            raise ProviderError(
                message=f"Veo generation failed: {str(e)}",
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
        url = f"{self.API_BASE}/models/{self.model}:predictLongRunning"

        headers = {
            "Content-Type": "application/json",
        }

        # 요청 본문 구성
        generation_config = {
            "aspectRatio": options.get("aspect_ratio", "9:16"),
            "numberOfVideos": 1,
        }

        # 영상 길이 설정
        if options.get("duration_seconds"):
            generation_config["durationSeconds"] = options["duration_seconds"]

        # 네이티브 오디오 생성
        if options.get("generate_audio", False):
            generation_config["generateAudio"] = True

        # 네거티브 프롬프트
        if options.get("negative_prompt"):
            generation_config["negativePrompt"] = options["negative_prompt"]

        # 기본 요청 구조
        payload = {
            "instances": [{
                "prompt": prompt
            }],
            "parameters": generation_config
        }

        # Image-to-Video인 경우 이미지 추가
        if task == "image_to_video":
            image_data = None

            if options.get("image_url"):
                # URL에서 이미지 다운로드 후 Base64 변환
                image_data = await self._download_and_encode_image(options["image_url"])
            elif options.get("image_base64"):
                image_data = options["image_base64"]

            if image_data:
                payload["instances"][0]["image"] = {
                    "bytesBase64Encoded": image_data
                }
            else:
                raise ProviderError(
                    message="image_to_video requires 'image_url' or 'image_base64'",
                    provider=self.vendor,
                    status_code=400
                )

        logger.debug(f"[Veo] Creating generation with model: {self.model}")

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.post(
                url,
                headers=headers,
                json=payload,
                params={"key": self.api_key}
            )

            if response.status_code not in [200, 201]:
                raise ProviderError(
                    message=f"Failed to create generation: {response.text}",
                    provider=self.vendor,
                    status_code=response.status_code,
                    details={"response": response.text}
                )

            data = response.json()
            operation_name = data.get("name")

            if not operation_name:
                raise ProviderError(
                    message="No operation name in response",
                    provider=self.vendor,
                    details=data
                )

            logger.info(f"[Veo] Operation created: {operation_name}")
            return operation_name

    async def _poll_operation(self, operation_name: str) -> Dict[str, Any]:
        """Operation 완료까지 폴링"""
        url = f"{self.API_BASE}/{operation_name}"
        start_time = datetime.utcnow()

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            while True:
                elapsed = (datetime.utcnow() - start_time).total_seconds()
                if elapsed > self.max_wait_time:
                    raise ProviderError(
                        message=f"Operation timed out after {self.max_wait_time}s",
                        provider=self.vendor,
                        details={"operation_name": operation_name}
                    )

                response = await client.get(
                    url,
                    params={"key": self.api_key}
                )

                if response.status_code != 200:
                    raise ProviderError(
                        message=f"Failed to poll operation: {response.text}",
                        provider=self.vendor,
                        status_code=response.status_code
                    )

                data = response.json()
                done = data.get("done", False)

                logger.debug(f"[Veo] Operation {operation_name} done: {done}")

                if done:
                    # 에러 체크
                    if "error" in data:
                        error = data["error"]
                        raise ProviderError(
                            message=f"Operation failed: {error.get('message', 'Unknown')}",
                            provider=self.vendor,
                            details=error
                        )
                    return data.get("response", data)

                # 대기 후 재시도
                await asyncio.sleep(self.poll_interval)

    async def _download_and_encode_image(self, url: str) -> str:
        """URL에서 이미지 다운로드 후 Base64 인코딩"""
        try:
            async with httpx.AsyncClient(timeout=30, follow_redirects=True) as client:
                response = await client.get(url)
                response.raise_for_status()
                return base64.b64encode(response.content).decode()
        except Exception as e:
            logger.error(f"[Veo] Failed to download image: {e}")
            raise ProviderError(
                message=f"Failed to download image: {str(e)}",
                provider=self.vendor,
                details={"url": url}
            )

    def _extract_video_from_result(self, result: Dict[str, Any]) -> Optional[str]:
        """결과에서 비디오 데이터 추출"""
        try:
            # Veo API 응답 구조에 따라 비디오 추출
            # 응답은 predictions 배열에 video 객체 포함
            predictions = result.get("predictions", [])
            if predictions:
                video = predictions[0].get("video", {})
                # Base64 인코딩된 비디오 데이터 또는 URI
                if "bytesBase64Encoded" in video:
                    return video["bytesBase64Encoded"]
                elif "uri" in video:
                    return video["uri"]

            # 대안적 구조 (generateVideoResponse)
            video_response = result.get("generateVideoResponse", {})
            generated_samples = video_response.get("generatedSamples", [])
            if generated_samples:
                video = generated_samples[0].get("video", {})
                if "uri" in video:
                    return video["uri"]

            return None
        except Exception as e:
            logger.warning(f"[Veo] Failed to extract video: {e}")
            return None

    async def health_check(self) -> bool:
        """헬스 체크"""
        try:
            url = f"{self.API_BASE}/models/{self.model}"
            async with httpx.AsyncClient(timeout=10) as client:
                response = await client.get(
                    url,
                    params={"key": self.api_key}
                )
                return response.status_code in [200, 401, 403]  # 모델 존재 확인
        except Exception as e:
            logger.warning(f"[Veo] Health check failed: {e}")
            return False

    def get_default_options(self, task: str, media_type: str) -> Dict[str, Any]:
        """기본 옵션"""
        return {
            "aspect_ratio": "9:16",  # 세로 영상 (숏폼용)
            "duration_seconds": 8,   # Veo 3는 8초 지원
            "generate_audio": False,  # 오디오 생성 비활성화 (TTS 사용)
        }


# =============================================================================
# Factory Function
# =============================================================================

_veo_instance: Optional[VeoProvider] = None


def get_veo_provider(api_key: Optional[str] = None) -> VeoProvider:
    """
    Veo Provider 인스턴스 반환 (싱글톤)

    Args:
        api_key: Google API 키 (없으면 환경변수에서 로드)

    Returns:
        VeoProvider 인스턴스

    Raises:
        ValueError: API 키가 없을 때
    """
    global _veo_instance

    if _veo_instance is None:
        if not api_key:
            from app.core.config import settings
            api_key = getattr(settings, 'GOOGLE_API_KEY', None)

        if not api_key:
            raise ValueError("GOOGLE_API_KEY not configured for Veo")

        _veo_instance = VeoProvider(api_key=api_key)

    return _veo_instance
