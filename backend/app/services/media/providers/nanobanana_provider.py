"""
Nano Banana Provider (Gemini 2.5 Flash Image Generation)

Google AI Studio의 네이티브 이미지 생성 기능

작성일: 2025-11-17
"""
import base64
import logging
from typing import Dict, Any, Optional, Literal
from google import genai  # Official Google GenAI SDK (requires: pip install google-genai)
from google.genai import types
from PIL import Image
from io import BytesIO

from .base import MediaProvider, MediaProviderResponse, MediaProviderOutput, ProviderError

logger = logging.getLogger(__name__)


class NanoBananaProvider(MediaProvider):
    """Nano Banana Provider (Gemini Image Generation)"""

    def __init__(
        self,
        api_key: str,
        default_model: str = "gemini-2.5-flash-image",
        timeout: int = 60
    ):
        """
        Args:
            api_key: Google API Key
            default_model: 기본 모델 (gemini-2.5-flash-image)
            timeout: 타임아웃 (초)
        """
        super().__init__(
            vendor="nanobanana",
            base_url="https://generativelanguage.googleapis.com",
            timeout=timeout
        )
        self.client = genai.Client(api_key=api_key)
        self.default_model = default_model

    async def generate(
        self,
        prompt: str,
        task: str,
        media_type: Literal["image", "video", "audio"],
        options: Optional[Dict[str, Any]] = None
    ) -> MediaProviderResponse:
        """
        Gemini Image Generation

        Args:
            prompt: 이미지 생성 프롬프트
            task: 작업 유형 (product_image, brand_logo 등)
            media_type: "image"만 지원
            options: 생성 옵션

        Returns:
            MediaProviderResponse

        Raises:
            ProviderError: 생성 실패 시
        """
        if media_type != "image":
            raise ProviderError(
                message=f"Nano Banana only supports 'image', got '{media_type}'",
                provider=self.vendor,
                status_code=400
            )

        opts = options or {}
        model_name = opts.get("model", self.default_model)
        num_images = opts.get("num_images", 1)
        aspect_ratio = opts.get("aspect_ratio", "1:1")

        logger.info(
            f"[NanoBanana] Generating image: model={model_name}, "
            f"num_images={num_images}, aspect_ratio={aspect_ratio}"
        )

        try:
            # 프롬프트 개선
            enhanced_prompt = self._enhance_prompt(prompt, task)

            logger.info(f"[NanoBanana] Enhanced prompt: {enhanced_prompt[:100]}...")

            # 이미지 생성 설정 (공식 문서: 대문자 'IMAGE' 사용)
            config = types.GenerateContentConfig(
                response_modalities=['IMAGE'],  # 대문자로 변경
                image_config=types.ImageConfig(
                    aspect_ratio=aspect_ratio
                )
            )

            # 이미지 생성
            logger.info(f"[NanoBanana] Calling Gemini API with model={model_name}")
            response = self.client.models.generate_content(
                model=model_name,
                contents=[enhanced_prompt],
                config=config
            )

            logger.info(f"[NanoBanana] Response received. Type: {type(response)}")

            # 응답에서 이미지 추출 (공식 문서 방식)
            outputs = []

            # response가 None인지 확인
            if response is None:
                logger.error("[NanoBanana] Response is None")
                raise ProviderError(
                    message="Gemini returned None response",
                    provider=self.vendor,
                    status_code=500
                )

            # response.candidates 확인 (content blocking 체크)
            if hasattr(response, 'candidates') and response.candidates:
                candidate = response.candidates[0]
                if hasattr(candidate, 'finish_reason') and candidate.finish_reason:
                    logger.info(f"[NanoBanana] Finish reason: {candidate.finish_reason}")
                    # SAFETY 등의 이유로 차단된 경우
                    if str(candidate.finish_reason) not in ['STOP', 'MAX_TOKENS']:
                        logger.warning(f"[NanoBanana] Content may be blocked: {candidate.finish_reason}")

            # response.parts가 None인지 확인
            if response.parts is None:
                # text 속성이 있으면 텍스트 응답일 수 있음
                response_text = getattr(response, 'text', None)
                logger.error(f"[NanoBanana] response.parts is None. text={response_text}")

                # prompt_feedback 확인 (safety blocking)
                if hasattr(response, 'prompt_feedback'):
                    logger.error(f"[NanoBanana] prompt_feedback: {response.prompt_feedback}")

                raise ProviderError(
                    message="Gemini returned no parts in response (possible content blocking)",
                    provider=self.vendor,
                    status_code=500,
                    details={"response_text": response_text or "N/A"}
                )

            # Gemini는 이미지를 response.parts에 반환
            for part in response.parts:
                if part.inline_data is not None:
                    # inline_data에서 직접 bytes 추출
                    inline_data = part.inline_data

                    # mime_type과 data 추출
                    mime_type = getattr(inline_data, 'mime_type', 'image/png')
                    img_bytes = getattr(inline_data, 'data', None)

                    if img_bytes is None:
                        # fallback: as_image() 사용
                        try:
                            pil_image = part.as_image()
                            img_buffer = BytesIO()
                            # PIL Image.save: format은 위치 인자로 전달
                            pil_image.save(img_buffer, 'PNG')
                            img_bytes = img_buffer.getvalue()
                            width = pil_image.width
                            height = pil_image.height
                        except Exception as e:
                            logger.warning(
                                f"[NanoBanana] as_image() failed: {e}"
                            )
                            continue
                    else:
                        # bytes에서 PIL Image로 변환하여 크기 확인
                        try:
                            pil_image = Image.open(BytesIO(img_bytes))
                            width = pil_image.width
                            height = pil_image.height
                        except Exception:
                            width = 0
                            height = 0

                    # Base64로 인코딩
                    if isinstance(img_bytes, bytes):
                        img_data = base64.b64encode(img_bytes).decode('utf-8')
                    else:
                        # bytes가 아닌 경우 (예: memoryview)
                        img_data = base64.b64encode(bytes(img_bytes)).decode('utf-8')

                    # 포맷 결정
                    img_format = "png"
                    if "jpeg" in mime_type or "jpg" in mime_type:
                        img_format = "jpeg"
                    elif "webp" in mime_type:
                        img_format = "webp"

                    outputs.append(MediaProviderOutput(
                        type="image",
                        format=img_format,
                        data=img_data,
                        width=width,
                        height=height
                    ))

            if not outputs:
                raise ProviderError(
                    message="No images generated by Gemini",
                    provider=self.vendor,
                    status_code=500
                )

            # Usage 정보
            usage = {}
            if hasattr(response, 'usage_metadata'):
                try:
                    usage = {
                        "prompt_tokens": (
                            response.usage_metadata.prompt_token_count
                        ),
                        "completion_tokens": (
                            response.usage_metadata.candidates_token_count
                        ),
                        "total_tokens": (
                            response.usage_metadata.total_token_count
                        )
                    }
                except AttributeError:
                    pass

            logger.info(f"[NanoBanana] Generated {len(outputs)} image(s)")

            return MediaProviderResponse(
                provider=self.vendor,
                model=model_name,
                usage=usage,
                outputs=outputs,
                meta={
                    "task": task,
                    "aspect_ratio": aspect_ratio,
                    "num_images": num_images
                }
            )

        except Exception as e:
            logger.error(f"[NanoBanana] Error: {e}", exc_info=True)
            raise ProviderError(
                message=f"Nano Banana generation failed: {str(e)}",
                provider=self.vendor,
                details={"task": task, "prompt": prompt[:100]}
            )

    async def health_check(self) -> bool:
        """
        Provider 헬스 체크

        Returns:
            True if healthy
        """
        try:
            # 간단한 이미지 생성으로 API 연결 확인
            response = self.client.models.generate_content(
                model=self.default_model,
                contents=["A simple test image"],
                config=types.GenerateContentConfig(
                    response_modalities=['Image']
                )
            )
            return response.parts and len(response.parts) > 0
        except Exception as e:
            logger.error(f"[NanoBanana] Health check failed: {e}")
            return False

    def get_default_options(self, task: str, media_type: str) -> Dict[str, Any]:
        """
        작업 유형별 기본 옵션

        Args:
            task: 작업 유형
            media_type: 미디어 타입

        Returns:
            기본 옵션
        """
        # 작업별 aspect ratio 기본값
        aspect_ratios = {
            "product_image": "1:1",
            "brand_logo": "1:1",
            "sns_thumbnail": "16:9",
            "banner_image": "16:9",
            "story_image": "9:16",
            "profile_image": "1:1"
        }

        return {
            "model": self.default_model,
            "num_images": 1,
            "aspect_ratio": aspect_ratios.get(task, "1:1")
        }

    def _enhance_prompt(self, prompt: str, task: str) -> str:
        """
        프롬프트 개선 (Gemini Image 최적화)

        Args:
            prompt: 원본 프롬프트
            task: 작업 유형

        Returns:
            개선된 프롬프트
        """
        # 작업별 스타일 가이드
        style_guides = {
            "product_image": (
                "high quality product photography, "
                "professional lighting, clean background"
            ),
            "brand_logo": (
                "modern minimalist logo design, "
                "vector style, clean lines"
            ),
            "sns_thumbnail": (
                "eye-catching social media thumbnail, "
                "vibrant colors, engaging composition"
            ),
            "banner_image": (
                "wide banner design, "
                "professional layout, marketing material"
            ),
            "story_image": (
                "vertical story image, "
                "mobile-friendly, attention-grabbing"
            ),
            "profile_image": (
                "professional profile photo, "
                "centered composition, clean background"
            )
        }

        style_guide = style_guides.get(task, "high quality digital art")

        # 최종 프롬프트
        enhanced = f"{prompt}, {style_guide}"

        logger.debug(f"[NanoBanana] Enhanced prompt: {enhanced}")

        return enhanced
