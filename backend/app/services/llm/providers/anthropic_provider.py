"""
Anthropic Provider (Claude 3.5 Haiku)

작성일: 2025-11-17
"""
import json
import logging
from typing import Dict, Any, Optional
from anthropic import Anthropic

from .base import LLMProvider, LLMProviderOutput

logger = logging.getLogger(__name__)


class AnthropicProvider(LLMProvider):
    """Anthropic API Provider (Claude 3.5 Haiku)"""

    def __init__(
        self,
        api_key: str,
        default_model: str = "claude-3-5-haiku-20241022",
        timeout: int = 60
    ):
        """
        Args:
            api_key: Anthropic API Key
            default_model: 기본 모델 (claude-3-5-haiku-20241022)
            timeout: 타임아웃 (초)
        """
        self.client = Anthropic(api_key=api_key, timeout=timeout)
        self.default_model = default_model
        self.timeout = timeout

    async def generate(
        self,
        prompt: str,
        options: Optional[Dict[str, Any]] = None
    ) -> LLMProviderOutput:
        """
        Anthropic API 호출

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
            f"[Anthropic] Generating with model={model}, "
            f"temp={temperature}, max_tokens={max_tokens}"
        )

        try:
            # Anthropic API 호출
            # Claude는 system과 user 메시지 분리
            response = self.client.messages.create(
                model=model,
                max_tokens=max_tokens,
                temperature=temperature,
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )

            content = response.content[0].text
            usage = {
                "prompt_tokens": response.usage.input_tokens,
                "completion_tokens": response.usage.output_tokens,
                "total_tokens": response.usage.input_tokens + response.usage.output_tokens
            }

            logger.info(
                f"[Anthropic] Generated {usage['total_tokens']} tokens"
            )

            # JSON 파싱 시도
            try:
                # Claude는 종종 ```json ... ``` 형식으로 반환
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
                logger.warning("[Anthropic] Response not valid JSON, returning as text")
                return LLMProviderOutput(
                    type="text",
                    value=content,
                    usage=usage,
                    model=model
                )

        except Exception as e:
            logger.error(f"[Anthropic] Error: {e}", exc_info=True)
            raise RuntimeError(f"Anthropic API failed: {str(e)}")

    def get_name(self) -> str:
        return "anthropic"

    def get_available_models(self) -> list:
        return [
            "claude-3-5-haiku-20241022",
            "claude-3-5-sonnet-20241022",
            "claude-3-opus-20240229"
        ]
