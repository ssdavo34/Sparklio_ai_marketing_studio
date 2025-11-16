"""
LLM Provider Base Interface

모든 LLM Provider가 구현해야 하는 추상 인터페이스

작성일: 2025-11-16
작성자: B팀 (Backend)
문서: ARCH-002, SPEC-001
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, Union, Literal
from pydantic import BaseModel, Field
from datetime import datetime


class LLMProviderOutput(BaseModel):
    """
    LLM Provider 출력 구조화 모델

    type: "text" | "json"
    value: 실제 생성된 값 (문자열 또는 JSON 객체)
    """
    type: Literal["text", "json"] = Field(..., description="출력 타입 (text 또는 json)")
    value: Union[str, Dict[str, Any]] = Field(..., description="생성된 결과 (문자열 또는 JSON)")


class LLMProviderResponse(BaseModel):
    """
    LLM Provider 응답 표준 형식

    모든 Provider는 이 형식으로 응답을 반환해야 함
    """
    provider: str = Field(..., description="Provider 벤더명 (ollama, openai, anthropic 등)")
    model: str = Field(..., description="사용된 모델명")
    usage: Dict[str, int] = Field(
        default_factory=dict,
        description="토큰 사용량 (prompt_tokens, completion_tokens, total_tokens)"
    )
    output: LLMProviderOutput = Field(..., description="생성된 결과 (구조화)")
    meta: Dict[str, Any] = Field(
        default_factory=dict,
        description="메타데이터 (latency, temperature, top_p 등)"
    )
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="응답 생성 시각")


class LLMProvider(ABC):
    """
    LLM Provider 추상 베이스 클래스

    새로운 LLM Provider를 추가할 때는 이 클래스를 상속받아 구현

    Example:
        class OllamaProvider(LLMProvider):
            @property
            def vendor(self) -> str:
                return "ollama"

            async def generate(self, ...) -> LLMProviderResponse:
                # Ollama API 호출 구현
                ...
    """

    @property
    @abstractmethod
    def vendor(self) -> str:
        """
        Provider 벤더명 반환

        Returns:
            str: 'ollama' | 'openai' | 'anthropic' | 'mistral' | 'vllm' 등
        """
        pass

    @property
    @abstractmethod
    def supports_json(self) -> bool:
        """
        JSON 모드 지원 여부

        Returns:
            bool: JSON 모드 지원 시 True
        """
        pass

    @property
    def supports_streaming(self) -> bool:
        """
        스트리밍 응답 지원 여부

        Returns:
            bool: 스트리밍 지원 시 True (기본값: False)
        """
        return False

    @abstractmethod
    async def generate(
        self,
        prompt: str,
        role: str,
        task: str,
        mode: str = "json",
        options: Optional[Dict[str, Any]] = None
    ) -> LLMProviderResponse:
        """
        LLM 텍스트 생성

        Args:
            prompt: 프롬프트 (시스템 프롬프트 + 사용자 입력 통합)
            role: Agent 역할 (copywriter, strategist, reviewer 등)
            task: 작업 유형 (product_detail, brand_kit, sns 등)
            mode: 출력 모드 ('json' | 'text' | 'structured')
            options: Provider별 추가 옵션
                - temperature: float (기본값: 0.7)
                - top_p: float (기본값: 0.9)
                - max_tokens: int (기본값: 2000)
                - stop_sequences: list[str] (선택)

        Returns:
            LLMProviderResponse: 표준 형식의 응답

        Raises:
            ProviderError: Provider 호출 실패 시
            ValidationError: 응답 검증 실패 시
        """
        pass

    async def health_check(self) -> bool:
        """
        Provider 상태 확인

        Returns:
            bool: 정상 작동 시 True
        """
        try:
            # 간단한 테스트 생성 요청
            response = await self.generate(
                prompt="Test prompt",
                role="test",
                task="test",
                mode="text",
                options={"max_tokens": 10}
            )
            return response is not None
        except Exception:
            return False

    def get_default_options(self, role: str, task: str) -> Dict[str, Any]:
        """
        역할과 작업에 따른 기본 옵션 반환

        Args:
            role: Agent 역할
            task: 작업 유형

        Returns:
            Dict[str, Any]: 기본 옵션
        """
        # 기본 설정
        defaults = {
            "temperature": 0.7,
            "top_p": 0.9,
            "max_tokens": 2000,
        }

        # 역할별 커스터마이징
        if role == "copywriter":
            defaults["temperature"] = 0.8  # 더 창의적
        elif role == "reviewer":
            defaults["temperature"] = 0.3  # 더 일관적
        elif role == "strategist":
            defaults["temperature"] = 0.6

        # 작업별 토큰 제한
        if task == "brand_kit":
            defaults["max_tokens"] = 3000
        elif task == "sns":
            defaults["max_tokens"] = 1000

        return defaults


class ProviderError(Exception):
    """Provider 호출 실패 예외"""

    def __init__(
        self,
        message: str,
        provider: str,
        status_code: Optional[int] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        self.message = message
        self.provider = provider
        self.status_code = status_code
        self.details = details or {}
        super().__init__(self.message)
