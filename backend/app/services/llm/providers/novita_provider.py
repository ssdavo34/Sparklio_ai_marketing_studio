"""
Novita AI Provider (Llama 3.3 70B)

OpenAI 호환 API를 사용하는 Novita AI

작성일: 2025-11-17
"""
import json
import logging
from typing import Dict, Any, Optional
from openai import OpenAI

from .base import LLMProvider, LLMProviderOutput

logger = logging.getLogger(__name__)


class NovitaProvider(LLMProvider):
    """Novita AI Provider (Llama 3.3 70B via OpenAI-compatible API)"""

    def __init__(
        self,
        api_key: str,
        base_url: str = "https://api.novita.ai/v3/openai",
        default_model: str = "meta-llama/llama-3.3-70b-instruct",
        timeout: int = 60
    ):
        """
        Args:
            api_key: Novita API Key
            base_url: Novita API base URL
            default_model: 기본 모델
            timeout: 타임아웃 (초)
        """
        self.client = OpenAI(
            api_key=api_key,
            base_url=base_url,
            timeout=timeout
        )
        self.default_model = default_model
        self.timeout = timeout

    async def generate(
        self,
        prompt: str,
        options: Optional[Dict[str, Any]] = None
    ) -> LLMProviderOutput:
        """
        Novita AI API 호출 (OpenAI 호환)

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
            f"[Novita] Generating with model={model}, "
            f"temp={temperature}, max_tokens={max_tokens}"
        )

        try:
            # OpenAI 호환 API 호출
            response = self.client.chat.completions.create(
                model=model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are a helpful assistant that outputs JSON."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=temperature,
                max_tokens=max_tokens
            )

            content = response.choices[0].message.content
            usage = {
                "prompt_tokens": response.usage.prompt_tokens,
                "completion_tokens": response.usage.completion_tokens,
                "total_tokens": response.usage.total_tokens
            }

            logger.info(
                f"[Novita] Generated {usage['total_tokens']} tokens"
            )

            # JSON 파싱 시도
            try:
                # Llama 모델은 종종 ```json ... ``` 형식으로 반환
                if "```json" in content:
                    json_str = content.split("```json")[1].split("```")[0].strip()
                elif "```" in content:
                    json_str = content.split("```")[1].split("```")[0].strip()
                else:
                    json_str = content.strip()

                json_data = json.loads(json_str)
                return LLMProviderOutput(
                    type="json",
                    value=json_data,
                    usage=usage,
                    model=model
                )
            except (json.JSONDecodeError, IndexError):
                logger.warning("[Novita] Response not valid JSON, returning as text")
                return LLMProviderOutput(
                    type="text",
                    value=content,
                    usage=usage,
                    model=model
                )

        except Exception as e:
            logger.error(f"[Novita] Error: {e}", exc_info=True)
            raise RuntimeError(f"Novita API failed: {str(e)}")

    def get_name(self) -> str:
        return "novita"

    def get_available_models(self) -> list:
        return [
            "meta-llama/llama-3.3-70b-instruct",
            "meta-llama/llama-3.1-405b-instruct",
            "meta-llama/llama-3.1-70b-instruct"
        ]
