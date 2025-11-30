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
            prompt: 프롬프트 (system과 user가 구분자로 분리될 수 있음)
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
            # 프롬프트에서 system/user 분리 (구분자: "\n\n===USER_INPUT===\n\n")
            messages = []
            separator = "\n\n===USER_INPUT===\n\n"
            if separator in prompt:
                system_part, user_part = prompt.split(separator, 1)
                messages = [
                    {"role": "system", "content": system_part.strip()},
                    {"role": "user", "content": user_part.strip()}
                ]
            else:
                # 구분자가 없으면 전체를 user로
                messages = [{"role": "user", "content": prompt}]

            # OpenAI API 호출
            call_params = {
                "model": model,
                "messages": messages,
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

    async def generate_with_vision(
        self,
        prompt: str,
        image_url: Optional[str] = None,
        image_base64: Optional[str] = None,
        role: str = "vision_analyzer",
        task: str = "image_analysis",
        mode: str = "json",
        options: Optional[Dict[str, Any]] = None
    ) -> LLMProviderResponse:
        """
        OpenAI Vision API 호출 (GPT-4o)

        Args:
            prompt: 분석 프롬프트
            image_url: 이미지 URL
            image_base64: Base64 인코딩 이미지
            role: Agent 역할
            task: 작업 유형
            mode: 출력 모드 ('json' | 'text')
            options: 생성 옵션

        Returns:
            LLMProviderResponse
        """
        # 기본 옵션과 병합
        default_opts = self.get_default_options(role, task)
        opts = {**default_opts, **(options or {})}

        model = opts.get("model", "gpt-4o")  # Vision은 gpt-4o 사용
        temperature = opts.get("temperature", 0.7)
        max_tokens = opts.get("max_tokens", 4000)

        logger.info(
            f"[OpenAI Vision] Generating with model={model}, "
            f"temp={temperature}, max_tokens={max_tokens}, mode={mode}"
        )

        try:
            # 이미지 콘텐츠 준비
            image_content = None

            if image_url:
                # URL 방식
                image_content = {
                    "type": "image_url",
                    "image_url": {
                        "url": image_url
                    }
                }
            elif image_base64:
                # Base64 방식
                # data:image/png;base64,... 형식으로 변환
                if not image_base64.startswith("data:"):
                    image_base64 = f"data:image/png;base64,{image_base64}"

                image_content = {
                    "type": "image_url",
                    "image_url": {
                        "url": image_base64
                    }
                }
            else:
                raise ValueError("Either image_url or image_base64 is required")

            # 메시지 구성: 텍스트 + 이미지
            message_content = [
                {
                    "type": "text",
                    "text": prompt
                },
                image_content
            ]

            # OpenAI Vision API 호출
            call_params = {
                "model": model,
                "messages": [
                    {"role": "user", "content": message_content}
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
                f"[OpenAI Vision] Generated {usage['total_tokens']} tokens"
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
                    logger.warning("[OpenAI Vision] Response not valid JSON, returning as text")
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
                    "task": task,
                    "vision": True
                }
            )

        except Exception as e:
            logger.error(f"[OpenAI Vision] Error: {e}", exc_info=True)
            raise RuntimeError(f"OpenAI Vision API failed: {str(e)}")

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
