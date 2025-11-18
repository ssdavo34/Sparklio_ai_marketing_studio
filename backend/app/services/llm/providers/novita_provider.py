"""
Novita AI Provider (Llama 3.3 70B)

OpenAI 호환 API를 사용하는 Novita AI

작성일: 2025-11-17
수정일: 2025-11-18 (generate() 시그니처 수정)
"""
import json
import logging
from typing import Dict, Any, Optional
from datetime import datetime
from openai import OpenAI

from .base import LLMProvider, LLMProviderOutput, LLMProviderResponse, ProviderError

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

    @property
    def vendor(self) -> str:
        """Provider 벤더명 반환"""
        return "novita"

    @property
    def supports_json(self) -> bool:
        """JSON 모드 지원 여부"""
        return True  # Novita AI (OpenAI 호환) JSON 지원

    async def generate(
        self,
        prompt: str,
        role: str,
        task: str,
        mode: str = "json",
        options: Optional[Dict[str, Any]] = None
    ) -> LLMProviderResponse:
        """
        Novita AI API 호출 (OpenAI 호환)

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
            f"[Novita] Generating: model={model}, role={role}, task={task}, "
            f"mode={mode}, temp={temperature}, max_tokens={max_tokens}"
        )

        try:
            # OpenAI 호환 API 호출
            response = self.client.chat.completions.create(
                model=model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are a helpful assistant that outputs JSON." if mode == "json" else "You are a helpful assistant."
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

            elapsed = (datetime.utcnow() - start_time).total_seconds()

            logger.info(
                f"[Novita] Success: {model} - {usage['total_tokens']} tokens, "
                f"elapsed={elapsed:.2f}s"
            )

            # JSON 파싱 시도
            output_type = "text"
            output_value = content

            if mode == "json":
                try:
                    # Llama 모델은 종종 ```json ... ``` 형식으로 반환
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
                    logger.warning(f"[Novita] JSON parsing failed: {e}, returning as text")

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
            logger.error(f"[Novita] Error: {e}", exc_info=True)
            raise ProviderError(
                message=f"Novita API failed: {str(e)}",
                provider=self.vendor,
                details={"role": role, "task": task}
            )

    def get_name(self) -> str:
        return "novita"

    def get_available_models(self) -> list:
        return [
            "meta-llama/llama-3.3-70b-instruct",
            "meta-llama/llama-3.1-405b-instruct",
            "meta-llama/llama-3.1-70b-instruct"
        ]
