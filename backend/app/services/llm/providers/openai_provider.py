"""
OpenAI Provider (GPT-4o-mini)

작성일: 2025-11-17
"""
import json
import logging
from typing import Dict, Any, Optional
from openai import OpenAI

from .base import LLMProvider, LLMProviderOutput

logger = logging.getLogger(__name__)


class OpenAIProvider(LLMProvider):
    """OpenAI API Provider (GPT-4o-mini)"""

    def __init__(
        self,
        api_key: str,
        default_model: str = "gpt-4o-mini",
        timeout: int = 60
    ):
        """
        Args:
            api_key: OpenAI API Key
            default_model: 기본 모델 (gpt-4o-mini)
            timeout: 타임아웃 (초)
        """
        self.client = OpenAI(api_key=api_key, timeout=timeout)
        self.default_model = default_model
        self.timeout = timeout

    async def generate(
        self,
        prompt: str,
        options: Optional[Dict[str, Any]] = None
    ) -> LLMProviderOutput:
        """
        OpenAI API 호출

        Args:
            prompt: 프롬프트
            options: 생성 옵션

        Returns:
            LLMProviderOutput
        """
        opts = options or {}
        model = opts.get("model", self.default_model)
        temperature = opts.get("temperature", 0.7)
        max_tokens = opts.get("max_tokens", 2000)

        logger.info(
            f"[OpenAI] Generating with model={model}, "
            f"temp={temperature}, max_tokens={max_tokens}"
        )

        try:
            # OpenAI API 호출
            response = self.client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "user", "content": prompt}
                ],
                temperature=temperature,
                max_tokens=max_tokens,
                response_format={"type": "json_object"}  # JSON 모드 강제
            )

            content = response.choices[0].message.content
            usage = {
                "prompt_tokens": response.usage.prompt_tokens,
                "completion_tokens": response.usage.completion_tokens,
                "total_tokens": response.usage.total_tokens
            }

            logger.info(
                f"[OpenAI] Generated {usage['total_tokens']} tokens"
            )

            # JSON 파싱 시도
            try:
                json_data = json.loads(content)
                return LLMProviderOutput(
                    type="json",
                    value=json_data,
                    usage=usage,
                    model=model
                )
            except json.JSONDecodeError:
                logger.warning("[OpenAI] Response not valid JSON, returning as text")
                return LLMProviderOutput(
                    type="text",
                    value=content,
                    usage=usage,
                    model=model
                )

        except Exception as e:
            logger.error(f"[OpenAI] Error: {e}", exc_info=True)
            raise RuntimeError(f"OpenAI API failed: {str(e)}")

    def get_name(self) -> str:
        return "openai"

    def get_available_models(self) -> list:
        return [
            "gpt-4o-mini",
            "gpt-4o",
            "gpt-4-turbo",
            "gpt-3.5-turbo"
        ]
