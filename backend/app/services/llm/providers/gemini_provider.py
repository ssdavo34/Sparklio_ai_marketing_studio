"""
Google Gemini Provider (Gemini 2.0 Flash)

작성일: 2025-11-17
수정일: 2025-11-18 (generate() 시그니처 수정)
"""
import json
import logging
from typing import Dict, Any, Optional
from datetime import datetime
import google.generativeai as genai

from .base import LLMProvider, LLMProviderOutput, LLMProviderResponse, ProviderError

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

    @property
    def vendor(self) -> str:
        """Provider 벤더명 반환"""
        return "gemini"

    @property
    def supports_json(self) -> bool:
        """JSON 모드 지원 여부"""
        return True  # Gemini는 JSON 형식 응답 가능

    async def generate(
        self,
        prompt: str,
        role: str,
        task: str,
        mode: str = "json",
        options: Optional[Dict[str, Any]] = None
    ) -> LLMProviderResponse:
        """
        Gemini API 호출

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

        model_name = merged_options.pop("model", self.default_model)
        temperature = merged_options.get("temperature", 0.7)
        max_tokens = merged_options.get("max_tokens", 2000)

        logger.info(
            f"[Gemini] Generating: model={model_name}, role={role}, task={task}, "
            f"mode={mode}, temp={temperature}, max_tokens={max_tokens}"
        )

        try:
            # Gemini 모델 초기화
            gen_config = genai.GenerationConfig(
                temperature=temperature,
                max_output_tokens=max_tokens
            )

            # JSON 모드 설정
            if mode == "json":
                gen_config.response_mime_type = "application/json"

            model = genai.GenerativeModel(
                model_name=model_name,
                generation_config=gen_config
            )

            # 생성
            response = model.generate_content(prompt)
            content = response.text

            # Usage 정보
            try:
                usage = {
                    "prompt_tokens": response.usage_metadata.prompt_token_count,
                    "completion_tokens": response.usage_metadata.candidates_token_count,
                    "total_tokens": response.usage_metadata.total_token_count
                }
            except AttributeError:
                usage = {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0}

            elapsed = (datetime.utcnow() - start_time).total_seconds()

            logger.info(
                f"[Gemini] Success: {model_name} - {usage['total_tokens']} tokens, "
                f"elapsed={elapsed:.2f}s"
            )

            # JSON 파싱 시도
            output_type = "text"
            output_value = content

            if mode == "json":
                try:
                    json_data = json.loads(content)
                    output_type = "json"
                    output_value = json_data
                except json.JSONDecodeError as e:
                    logger.warning(f"[Gemini] JSON parsing failed: {e}, returning as text")

            # LLMProviderResponse 반환
            return LLMProviderResponse(
                provider=self.vendor,
                model=model_name,
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
            logger.error(f"[Gemini] Error: {e}", exc_info=True)
            raise ProviderError(
                message=f"Gemini API failed: {str(e)}",
                provider=self.vendor,
                details={"role": role, "task": task}
            )

    def get_name(self) -> str:
        return "gemini"

    def get_available_models(self) -> list:
        return [
            "gemini-2.0-flash-exp",
            "gemini-1.5-flash",
            "gemini-1.5-pro"
        ]
