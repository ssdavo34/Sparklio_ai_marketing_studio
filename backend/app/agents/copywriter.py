"""
CopywriterAgent

Brief + Strategy → 마케팅 카피 생성
"""

from typing import Dict, Any, List
import logging

from app.agents.base import LLMAgent
from app.schemas.agent import A2ARequest, A2AResponse


logger = logging.getLogger(__name__)


class CopywriterAgent(LLMAgent):
    """
    CopywriterAgent - 마케팅 카피 생성

    입력: Brief, Strategy, 톤
    출력: 카피 텍스트 + 대안
    """

    def __init__(self):
        super().__init__(agent_name="CopywriterAgent", agent_version="1.0.0")

    def _register_capabilities(self) -> list[str]:
        return ["generate_copy", "adjust_tone", "create_variants"]

    async def process(self, request: A2ARequest) -> A2AResponse:
        """
        카피 생성 메인 로직

        Args:
            request: A2A 요청

        Returns:
            A2AResponse: 생성된 카피
        """
        brief = request.payload.get("brief", {})
        strategy = request.payload.get("strategy", {})
        tone = request.payload.get("tone", "professional")
        max_length = request.payload.get("max_length", 500)

        logger.info(f"[CopywriterAgent] Generating copy with tone={tone}")

        # TODO: 실제 구현
        # 1. Brief + Strategy 분석
        # 2. 톤 매칭 프롬프트 생성
        # 3. Ollama로 카피 생성 (qwen2.5:14b)
        # 4. 대안 카피 생성

        # 임시 구현
        result = {
            "copy": "혁신적인 제품으로 당신의 일상을 변화시키세요. 지금 바로 경험해보세요!",
            "variants": [
                "새로운 경험의 시작, 지금 바로 만나보세요.",
                "당신만의 특별한 순간을 위한 완벽한 선택."
            ],
            "tone_score": 0.85
        }

        return self._create_success_response(
            request=request,
            result=result,
            metadata={
                "model_used": self.quality_model,
                "tone_requested": tone,
                "length": len(result["copy"])
            }
        )
