"""
ReviewerAgent

생성물 품질 검토 및 피드백
"""

from typing import Dict, Any, List
import logging

from app.agents.base import LLMAgent
from app.schemas.agent import A2ARequest, A2AResponse


logger = logging.getLogger(__name__)


class ReviewerAgent(LLMAgent):
    """
    ReviewerAgent - 생성물 품질 검토

    입력: Brief, 생성된 콘텐츠 (카피, 이미지 등)
    출력: 품질 점수, 피드백, 승인 여부
    """

    def __init__(self):
        super().__init__(agent_name="ReviewerAgent", agent_version="1.0.0")

    def _register_capabilities(self) -> list[str]:
        return ["review_content", "check_brief_alignment", "provide_feedback"]

    async def process(self, request: A2ARequest) -> A2AResponse:
        """
        검토 메인 로직

        Args:
            request: A2A 요청

        Returns:
            A2AResponse: 검토 결과
        """
        brief = request.payload.get("brief", {})
        generated_content = request.payload.get("generated_content", {})
        content_type = request.payload.get("content_type", "copy")

        logger.info(f"[ReviewerAgent] Reviewing {content_type} content")

        # TODO: 실제 구현
        # 1. Brief 분석
        # 2. 생성된 콘텐츠 평가 (Ollama)
        # 3. Brief 일치도 확인
        # 4. 피드백 생성
        # 5. 승인 여부 결정

        # 임시 구현
        result = {
            "score": 0.85,
            "brief_alignment": 0.90,
            "feedback": [
                "콘텐츠가 Brief의 목표와 잘 일치합니다.",
                "타겟 오디언스에 적합한 톤입니다.",
                "개선 제안: 브랜드 가치를 더 강조할 수 있습니다."
            ],
            "approved": True
        }

        return self._create_success_response(
            request=request,
            result=result,
            metadata={
                "content_type": content_type,
                "review_criteria": ["goal_alignment", "tone", "brand_consistency"]
            }
        )
