"""
BriefAgent

사용자 요구사항 → 구조화된 Brief 생성
"""

from typing import Dict, Any
import logging

from app.agents.base import LLMAgent
from app.schemas.agent import A2ARequest, A2AResponse, BriefRequest, BriefResponse


logger = logging.getLogger(__name__)


class BriefAgent(LLMAgent):
    """
    BriefAgent - 사용자 요구사항을 구조화된 Brief로 변환

    입력: 사용자의 자연어 입력
    출력: 구조화된 Brief (goal, target_audience, budget, timeline 등)
    """

    def __init__(self):
        super().__init__(agent_name="BriefAgent", agent_version="1.0.0")

    def _register_capabilities(self) -> list[str]:
        return ["generate_brief", "parse_user_input", "extract_requirements"]

    async def process(self, request: A2ARequest) -> A2AResponse:
        """
        Brief 생성 메인 로직

        Args:
            request: A2A 요청

        Returns:
            A2AResponse: 생성된 Brief
        """
        # 페이로드 파싱
        user_input = request.payload.get("user_input", "")
        brand_id = request.system_context.brand_id

        logger.info(f"[BriefAgent] Generating brief for brand_id={brand_id}")

        # TODO: 실제 Brief 생성 로직 구현
        # 1. 사용자 입력 분석 (Ollama)
        # 2. Brief 구조화
        # 3. 필수 필드 검증

        # 임시 구현
        brief = {
            "goal": f"User goal: {user_input[:100]}",
            "target_audience": "To be analyzed",
            "budget": None,
            "timeline": "To be determined",
            "channels": [],
            "requirements": []
        }

        result = {
            "brief": brief,
            "confidence": 0.8
        }

        return self._create_success_response(
            request=request,
            result=result,
            metadata={"model_used": self.default_model}
        )
