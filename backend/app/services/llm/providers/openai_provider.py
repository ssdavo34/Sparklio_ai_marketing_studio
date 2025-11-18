"""
OpenAI Provider (GPT-4o-mini)

작성일: 2025-11-17
수정일: 2025-11-18 (추상 메서드 구현 추가)
"""
import json
import logging
from typing import Dict, Any, Optional
from openai import OpenAI

from .base import LLMProvider, LLMProviderOutput, LLMProviderResponse

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

    @property
    def vendor(self) -> str:
        """Provider 벤더명"""
        return "openai"

    @property
    def supports_json(self) -> bool:
        """JSON 모드 지원 여부"""
        return True  # OpenAI는 response_format={"type": "json_object"} 지원

    async def generate(
        self,
        prompt: str,
        role: str,
        task: str,
        mode: str = "json",
        options: Optional[Dict[str, Any]] = None
    ) -> LLMProviderResponse:
        """
        OpenAI API 호출

        Args:
            prompt: 프롬프트
            role: Agent 역할 (copywriter, strategist 등)
            task: 작업 유형 (product_detail, brand_kit 등)
            mode: 출력 모드 ('json' | 'text')
            options: 생성 옵션

        Returns:
            LLMProviderResponse
        """
        # 기본 옵션과 병합
        default_opts = self.get_default_options(role, task)
        opts = {**default_opts, **(options or {})}

        model = opts.get("model", self.default_model)
        temperature = opts.get("temperature", 0.7)
        max_tokens = opts.get("max_tokens", 2000)

        logger.info(
            f"[OpenAI] Generating with model={model}, "
            f"temp={temperature}, max_tokens={max_tokens}, mode={mode}"
        )

        try:
            # OpenAI API 호출
            call_params = {
                "model": model,
                "messages": [
                    {"role": "user", "content": prompt}
                ],
                "temperature": temperature,
                "max_tokens": max_tokens,
            }

            # JSON 모드 활성화 (mode가 json이고 지원하는 경우)
            if mode == "json" and self.supports_json:
                call_params["response_format"] = {"type": "json_object"}

            response = self.client.chat.completions.create(**call_params)

            content = response.choices[0].message.content
            usage = {
                "prompt_tokens": response.usage.prompt_tokens,
                "completion_tokens": response.usage.completion_tokens,
                "total_tokens": response.usage.total_tokens
            }

            logger.info(
                f"[OpenAI] Generated {usage['total_tokens']} tokens"
            )

            # 출력 타입 결정 및 파싱
            if mode == "json":
                try:
                    json_data = json.loads(content)
                    output = LLMProviderOutput(
                        type="json",
                        value=json_data
                    )
                except json.JSONDecodeError:
                    logger.warning("[OpenAI] Response not valid JSON, returning as text")
                    output = LLMProviderOutput(
                        type="text",
                        value=content
                    )
            else:
                output = LLMProviderOutput(
                    type="text",
                    value=content
                )

            # 표준 형식으로 응답 반환
            return LLMProviderResponse(
                provider=self.vendor,
                model=model,
                usage=usage,
                output=output,
                meta={
                    "temperature": temperature,
                    "max_tokens": max_tokens,
                    "role": role,
                    "task": task
                }
            )

        except Exception as e:
            logger.error(f"[OpenAI] Error: {e}", exc_info=True)
            raise RuntimeError(f"OpenAI API failed: {str(e)}")

    def get_name(self) -> str:
        """레거시 메서드 (vendor 사용 권장)"""
        return self.vendor

    def get_available_models(self) -> list:
        """사용 가능한 모델 목록"""
        return [
            "gpt-4o-mini",
            "gpt-4o",
            "gpt-4-turbo",
            "gpt-3.5-turbo"
        ]
