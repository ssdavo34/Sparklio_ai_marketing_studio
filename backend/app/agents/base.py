"""
Base Agent Class

모든 Agent의 기본 클래스
A2A (Agent-to-Agent) 프로토콜 구현
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from datetime import datetime
import uuid
import logging

from app.schemas.agent import A2ARequest, A2AResponse, SystemContext


logger = logging.getLogger(__name__)


class BaseAgent(ABC):
    """
    Base Agent Class

    모든 Agent는 이 클래스를 상속받아 구현해야 함

    Attributes:
        agent_name: Agent 이름
        agent_version: Agent 버전
        capabilities: Agent가 제공하는 기능 목록
    """

    def __init__(self, agent_name: str, agent_version: str = "1.0.0"):
        self.agent_name = agent_name
        self.agent_version = agent_version
        self.capabilities = self._register_capabilities()

        logger.info(f"[{self.agent_name}] Initialized (v{self.agent_version})")

    @abstractmethod
    def _register_capabilities(self) -> list[str]:
        """
        Agent가 제공하는 기능 목록 등록

        Returns:
            list[str]: 기능 목록 (예: ["generate_brief", "analyze_brand"])
        """
        pass

    @abstractmethod
    async def process(self, request: A2ARequest) -> A2AResponse:
        """
        Agent 메인 처리 로직

        Args:
            request: A2A 요청

        Returns:
            A2AResponse: A2A 응답
        """
        pass

    async def execute(self, request: A2ARequest) -> A2AResponse:
        """
        Agent 실행 (공통 로직 + 개별 처리)

        Args:
            request: A2A 요청

        Returns:
            A2AResponse: A2A 응답
        """
        start_time = datetime.utcnow()

        try:
            # 요청 검증
            self._validate_request(request)

            # 로그 시작
            logger.info(
                f"[{self.agent_name}] Processing request: {request.request_id} "
                f"from {request.source_agent}"
            )

            # 개별 Agent 처리 로직 실행
            response = await self.process(request)

            # 메타데이터 추가
            response.metadata = response.metadata or {}
            response.metadata["agent_name"] = self.agent_name
            response.metadata["agent_version"] = self.agent_version
            response.metadata["processing_time_ms"] = (
                datetime.utcnow() - start_time
            ).total_seconds() * 1000

            logger.info(
                f"[{self.agent_name}] Completed request: {request.request_id} "
                f"({response.metadata['processing_time_ms']:.2f}ms)"
            )

            return response

        except Exception as e:
            logger.error(
                f"[{self.agent_name}] Error processing request: {request.request_id} "
                f"- {str(e)}",
                exc_info=True
            )

            # 에러 응답 생성
            return self._create_error_response(request, str(e))

    def _validate_request(self, request: A2ARequest) -> None:
        """
        요청 검증

        Args:
            request: A2A 요청

        Raises:
            ValueError: 검증 실패 시
        """
        if not request.request_id:
            raise ValueError("request_id is required")

        if not request.source_agent:
            raise ValueError("source_agent is required")

        if request.target_agent != self.agent_name:
            raise ValueError(
                f"target_agent mismatch: expected {self.agent_name}, "
                f"got {request.target_agent}"
            )

    def _create_error_response(
        self,
        request: A2ARequest,
        error_message: str
    ) -> A2AResponse:
        """
        에러 응답 생성

        Args:
            request: 원본 요청
            error_message: 에러 메시지

        Returns:
            A2AResponse: 에러 응답
        """
        return A2AResponse(
            request_id=request.request_id,
            source_agent=self.agent_name,
            target_agent=request.source_agent,
            status="error",
            result={},
            error=error_message,
            metadata={
                "agent_name": self.agent_name,
                "agent_version": self.agent_version
            }
        )

    def _create_success_response(
        self,
        request: A2ARequest,
        result: Dict[str, Any],
        metadata: Optional[Dict[str, Any]] = None
    ) -> A2AResponse:
        """
        성공 응답 생성

        Args:
            request: 원본 요청
            result: 처리 결과
            metadata: 추가 메타데이터

        Returns:
            A2AResponse: 성공 응답
        """
        return A2AResponse(
            request_id=request.request_id,
            source_agent=self.agent_name,
            target_agent=request.source_agent,
            status="success",
            result=result,
            metadata=metadata or {}
        )


class LLMAgent(BaseAgent):
    """
    LLM을 사용하는 Agent의 기본 클래스

    Ollama 연동을 위한 공통 기능 제공
    """

    def __init__(self, agent_name: str, agent_version: str = "1.0.0"):
        super().__init__(agent_name, agent_version)
        self.default_model = "qwen2.5:7b"  # 빠른 응답용
        self.quality_model = "qwen2.5:14b"  # 고품질 생성용

    async def _call_ollama(
        self,
        prompt: str,
        model: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 2000
    ) -> str:
        """
        Ollama API 호출

        Args:
            prompt: 프롬프트
            model: 모델 이름 (기본: qwen2.5:7b)
            temperature: 온도 (0.0 ~ 2.0)
            max_tokens: 최대 토큰 수

        Returns:
            str: 생성된 텍스트
        """
        # TODO: 실제 Ollama API 호출 구현
        # A팀의 OllamaClient 사용 예정

        logger.debug(
            f"[{self.agent_name}] Calling Ollama: model={model or self.default_model}, "
            f"temp={temperature}, max_tokens={max_tokens}"
        )

        # 임시 구현 (실제로는 A팀의 통합 레이어 사용)
        return f"Mock response for prompt: {prompt[:50]}..."


class VisionAgent(BaseAgent):
    """
    이미지 생성 Agent의 기본 클래스

    ComfyUI 연동을 위한 공통 기능 제공
    """

    def __init__(self, agent_name: str, agent_version: str = "1.0.0"):
        super().__init__(agent_name, agent_version)

    async def _call_comfyui(
        self,
        workflow: Dict[str, Any],
        prompt: str
    ) -> str:
        """
        ComfyUI API 호출

        Args:
            workflow: ComfyUI 워크플로우
            prompt: 이미지 프롬프트

        Returns:
            str: 생성된 이미지 URL (MinIO)
        """
        # TODO: 실제 ComfyUI API 호출 구현
        # A팀의 ComfyUIClient 사용 예정

        logger.debug(
            f"[{self.agent_name}] Calling ComfyUI: prompt={prompt[:50]}..."
        )

        # 임시 구현 (실제로는 A팀의 통합 레이어 사용)
        return "https://minio-url/generated-image.png"
