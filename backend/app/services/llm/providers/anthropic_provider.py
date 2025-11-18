"""
Anthropic Provider (Claude 3.5 Haiku)

작성일: 2025-11-17
수정일: 2025-11-18 (generate() 시그니처 수정)
"""
import json
import logging
from typing import Dict, Any, Optional
from datetime import datetime
from anthropic import Anthropic

from .base import LLMProvider, LLMProviderOutput, LLMProviderResponse, ProviderError

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

    @property
    def vendor(self) -> str:
        """Provider 벤더명 반환"""
        return "anthropic"

    @property
    def supports_json(self) -> bool:
        """JSON 모드 지원 여부"""
        return True  # Claude는 JSON 형식 응답 가능

    async def generate(
        self,
        prompt: str,
        role: str,
        task: str,
        mode: str = "json",
        options: Optional[Dict[str, Any]] = None
    ) -> LLMProviderResponse:
        """
        Anthropic API 호출

        Args:
            prompt: 프롬프트
            role: Agent 역할 (copywriter, strategist 등)
            task: 작업 유형 (product_detail, brand_kit 등)
            mode: 출력 모드 ('json' | 'text')
            options: 생성 옵션

        Returns:
            LLMProviderResponse
        """
        start_time = datetime.utcnow()

        # 옵션 병합
        merged_options = self.get_default_options(role, task)
        if options:
            merged_options.update(options)

        model = merged_options.pop("model", self.default_model)
        temperature = merged_options.get("temperature", 0.7)
        max_tokens = merged_options.get("max_tokens", 2000)

        logger.info(
            f"[Anthropic] Generating: model={model}, role={role}, task={task}, "
            f"mode={mode}, temp={temperature}, max_tokens={max_tokens}"
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

            elapsed = (datetime.utcnow() - start_time).total_seconds()

            logger.info(
                f"[Anthropic] Success: {model} - {usage['total_tokens']} tokens, "
                f"elapsed={elapsed:.2f}s"
            )

            # JSON 파싱 시도
            output_type = "text"
            output_value = content

            if mode == "json":
                try:
                    # Claude는 종종 ```json ... ``` 형식으로 반환
                    if "```json" in content:
                        json_str = content.split("```json")[1].split("```")[0].strip()
                    elif "```" in content:
                        json_str = content.split("```")[1].split("```")[0].strip()
                    else:
                        json_str = content.strip()

                    json_data = json.loads(json_str)
                    output_type = "json"
                    output_value = json_data
                except (json.JSONDecodeError, IndexError) as e:
                    logger.warning(f"[Anthropic] JSON parsing failed: {e}, returning as text")

            # LLMProviderResponse 반환
            return LLMProviderResponse(
                provider=self.vendor,
                model=model,
                usage=usage,
                output=LLMProviderOutput(
                    type=output_type,
                    value=output_value
                ),
                meta={
                    "role": role,
                    "task": task,
                    "mode": mode,
                    "latency": elapsed,
                    "temperature": temperature
                },
                timestamp=datetime.utcnow()
            )

        except Exception as e:
            logger.error(f"[Anthropic] Error: {e}", exc_info=True)
            raise ProviderError(
                message=f"Anthropic API failed: {str(e)}",
                provider=self.vendor,
                details={"role": role, "task": task}
            )

    def get_name(self) -> str:
        return "anthropic"

    def get_available_models(self) -> list:
        return [
            "claude-3-5-haiku-20241022",
            "claude-3-5-sonnet-20241022",
            "claude-3-opus-20240229"
        ]
