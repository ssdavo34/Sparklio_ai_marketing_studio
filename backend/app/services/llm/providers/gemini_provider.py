"""
Google Gemini Provider (Gemini 2.0 Flash)

작성일: 2025-11-17
"""
import json
import logging
from typing import Dict, Any, Optional
import google.generativeai as genai

from .base import LLMProvider, LLMProviderOutput

logger = logging.getLogger(__name__)


class GeminiProvider(LLMProvider):
    """Google Gemini API Provider"""

    def __init__(
        self,
        api_key: str,
        default_model: str = "gemini-2.5-flash-preview",
        timeout: int = 60
    ):
        """
        Args:
            api_key: Google API Key
            default_model: 기본 모델 (gemini-2.5-flash-preview)
            timeout: 타임아웃 (초)
        """
        genai.configure(api_key=api_key)
        self.default_model = default_model
        self.timeout = timeout

    async def generate(
        self,
        prompt: str,
        options: Optional[Dict[str, Any]] = None
    ) -> LLMProviderOutput:
        """
        Gemini API 호출

        Args:
            prompt: 프롬프트
            options: 생성 옵션

        Returns:
            LLMProviderOutput
        """
        opts = options or {}
        model_name = opts.get("model", self.default_model)
        temperature = opts.get("temperature", 0.7)
        max_tokens = opts.get("max_tokens", 2000)

        logger.info(
            f"[Gemini] Generating with model={model_name}, "
            f"temp={temperature}, max_tokens={max_tokens}"
        )

        try:
            # Gemini 모델 초기화
            model = genai.GenerativeModel(
                model_name=model_name,
                generation_config=genai.GenerationConfig(
                    temperature=temperature,
                    max_output_tokens=max_tokens,
                    response_mime_type="application/json"  # JSON 모드
                )
            )

            # 생성
            response = model.generate_content(prompt)
            content = response.text

            # Usage 정보 (Gemini는 token count API 별도)
            try:
                usage = {
                    "prompt_tokens": response.usage_metadata.prompt_token_count,
                    "completion_tokens": response.usage_metadata.candidates_token_count,
                    "total_tokens": response.usage_metadata.total_token_count
                }
            except AttributeError:
                # Fallback if usage_metadata not available
                usage = {
                    "prompt_tokens": 0,
                    "completion_tokens": 0,
                    "total_tokens": 0
                }

            logger.info(
                f"[Gemini] Generated {usage['total_tokens']} tokens"
            )

            # JSON 파싱 시도
            try:
                json_data = json.loads(content)
                return LLMProviderOutput(
                    type="json",
                    value=json_data,
                    usage=usage,
                    model=model_name
                )
            except json.JSONDecodeError:
                logger.warning("[Gemini] Response not valid JSON, returning as text")
                return LLMProviderOutput(
                    type="text",
                    value=content,
                    usage=usage,
                    model=model_name
                )

        except Exception as e:
            logger.error(f"[Gemini] Error: {e}", exc_info=True)
            raise RuntimeError(f"Gemini API failed: {str(e)}")

    def get_name(self) -> str:
        return "gemini"

    def get_available_models(self) -> list:
        return [
            "gemini-2.0-flash-exp",
            "gemini-1.5-flash",
            "gemini-1.5-pro"
        ]
