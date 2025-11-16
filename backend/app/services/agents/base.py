"""
Agent Base Classes

모든 Agent의 기본 추상 클래스 정의

작성일: 2025-11-16
작성자: B팀 (Backend)
문서: ARCH-003, SPEC-002
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, List, Literal
from pydantic import BaseModel, Field
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


# ============================================================================
# Error Classes
# ============================================================================

class AgentError(Exception):
    """Agent 실행 중 발생하는 에러"""

    def __init__(
        self,
        message: str,
        agent: str,
        details: Optional[Dict[str, Any]] = None
    ):
        self.message = message
        self.agent = agent
        self.details = details or {}
        super().__init__(self.message)


# ============================================================================
# Request/Response Models
# ============================================================================

class AgentRequest(BaseModel):
    """
    Agent 실행 요청

    모든 Agent가 공통으로 받는 요청 형식
    """
    task: str = Field(..., description="작업 유형 (product_detail, brand_kit, sns 등)")
    payload: Dict[str, Any] = Field(..., description="입력 데이터 (브리프, 상품 정보 등)")
    options: Optional[Dict[str, Any]] = Field(None, description="추가 옵션")

    class Config:
        json_schema_extra = {
            "example": {
                "task": "product_detail",
                "payload": {
                    "product_name": "무선 이어폰",
                    "features": ["노이즈캔슬링", "24시간 배터리"],
                    "target_audience": "2030 직장인"
                },
                "options": {
                    "tone": "professional",
                    "length": "medium"
                }
            }
        }


class AgentOutput(BaseModel):
    """
    Agent 출력 단위

    Agent가 생성한 개별 결과물 (텍스트, JSON, 이미지 등)
    """
    type: Literal["text", "json", "image", "video", "audio"] = Field(
        ...,
        description="출력 타입"
    )
    name: str = Field(..., description="출력물 이름/레이블 (예: headline, body, thumbnail)")
    value: Any = Field(..., description="실제 데이터 (문자열, JSON, Base64 등)")
    meta: Optional[Dict[str, Any]] = Field(None, description="메타데이터")

    class Config:
        json_schema_extra = {
            "example": {
                "type": "json",
                "name": "product_copy",
                "value": {
                    "headline": "완벽한 소음 차단의 시작",
                    "body": "프리미엄 노이즈캔슬링으로...",
                    "cta": "지금 바로 만나보세요"
                },
                "meta": {"word_count": 150}
            }
        }


class AgentResponse(BaseModel):
    """
    Agent 실행 응답

    모든 Agent가 공통으로 반환하는 응답 형식
    """
    agent: str = Field(..., description="Agent 이름 (copywriter, designer 등)")
    task: str = Field(..., description="수행한 작업 유형")
    outputs: List[AgentOutput] = Field(..., description="생성된 결과물 목록")
    usage: Dict[str, Any] = Field(default_factory=dict, description="리소스 사용량")
    meta: Dict[str, Any] = Field(default_factory=dict, description="메타데이터")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="생성 시각")

    class Config:
        json_schema_extra = {
            "example": {
                "agent": "copywriter",
                "task": "product_detail",
                "outputs": [
                    {
                        "type": "json",
                        "name": "product_copy",
                        "value": {
                            "headline": "완벽한 소음 차단의 시작",
                            "body": "프리미엄 노이즈캔슬링..."
                        }
                    }
                ],
                "usage": {
                    "llm_tokens": 350,
                    "elapsed_seconds": 2.5
                },
                "meta": {
                    "llm_provider": "ollama",
                    "llm_model": "qwen2.5:7b"
                },
                "timestamp": "2025-11-16T10:30:00Z"
            }
        }


# ============================================================================
# Base Agent Class
# ============================================================================

class AgentBase(ABC):
    """
    Agent 추상 기본 클래스

    모든 Agent는 이 클래스를 상속받아 구현합니다.

    주요 기능:
    1. LLM Gateway 의존성 주입
    2. Media Gateway 의존성 주입 (선택)
    3. 통일된 execute() 인터페이스
    4. 공통 에러 핸들링
    5. 로깅 및 모니터링

    구현 예시:
        class CopywriterAgent(AgentBase):
            @property
            def name(self) -> str:
                return "copywriter"

            async def execute(self, request: AgentRequest) -> AgentResponse:
                # LLM Gateway 사용
                llm_response = await self.llm_gateway.generate(
                    role=self.name,
                    task=request.task,
                    payload=request.payload
                )

                # 결과 반환
                return AgentResponse(
                    agent=self.name,
                    task=request.task,
                    outputs=[...]
                )
    """

    def __init__(
        self,
        llm_gateway=None,
        media_gateway=None
    ):
        """
        Agent 초기화

        Args:
            llm_gateway: LLM Gateway 인스턴스 (None이면 전역 인스턴스 사용)
            media_gateway: Media Gateway 인스턴스 (None이면 전역 인스턴스 사용)
        """
        # LLM Gateway (필수)
        if llm_gateway is None:
            from app.services.llm import get_gateway
            llm_gateway = get_gateway()
        self.llm_gateway = llm_gateway

        # Media Gateway (선택 - Designer Agent용)
        if media_gateway is None:
            from app.services.media import get_media_gateway
            media_gateway = get_media_gateway()
        self.media_gateway = media_gateway

        logger.info(f"{self.name} Agent initialized")

    @property
    @abstractmethod
    def name(self) -> str:
        """
        Agent 이름 반환

        Returns:
            Agent 식별자 (copywriter, designer, reviewer 등)
        """
        pass

    @abstractmethod
    async def execute(self, request: AgentRequest) -> AgentResponse:
        """
        Agent 실행 (추상 메서드)

        각 Agent는 이 메서드를 구현하여 고유 로직을 처리합니다.

        Args:
            request: Agent 요청

        Returns:
            AgentResponse: 실행 결과

        Raises:
            AgentError: Agent 실행 실패 시
        """
        pass

    def _validate_request(self, request: AgentRequest) -> None:
        """
        요청 검증 (공통 로직)

        Args:
            request: Agent 요청

        Raises:
            AgentError: 필수 필드가 없을 때
        """
        if not request.task:
            raise AgentError(
                message="Task is required",
                agent=self.name,
                details={"request": request.model_dump()}
            )

        if not request.payload:
            raise AgentError(
                message="Payload is required",
                agent=self.name,
                details={"request": request.model_dump()}
            )

    def _create_output(
        self,
        output_type: Literal["text", "json", "image", "video", "audio"],
        name: str,
        value: Any,
        meta: Optional[Dict[str, Any]] = None
    ) -> AgentOutput:
        """
        AgentOutput 생성 헬퍼

        Args:
            output_type: 출력 타입
            name: 출력물 이름
            value: 실제 데이터
            meta: 메타데이터

        Returns:
            AgentOutput 인스턴스
        """
        return AgentOutput(
            type=output_type,
            name=name,
            value=value,
            meta=meta or {}
        )

    async def health_check(self) -> bool:
        """
        Agent 상태 확인

        Returns:
            정상 여부
        """
        try:
            # LLM Gateway 확인
            llm_status = await self.llm_gateway.health_check()

            # Media Gateway 확인 (선택)
            if hasattr(self, 'media_gateway'):
                media_status = await self.media_gateway.health_check()

            return True
        except Exception as e:
            logger.error(f"{self.name} Agent health check failed: {str(e)}")
            return False
