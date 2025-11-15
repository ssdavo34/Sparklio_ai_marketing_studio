"""
StrategistAgent

Brief → 마케팅 전략 수립
"""

from typing import Dict, Any
import logging

from app.agents.base import LLMAgent
from app.schemas.agent import A2ARequest, A2AResponse


logger = logging.getLogger(__name__)


class StrategistAgent(LLMAgent):
    """
    StrategistAgent - 마케팅 전략 수립

    입력: Brief, BrandKit
    출력: 마케팅 전략 (채널, 타겟, 타임라인)
    """

    def __init__(self):
        super().__init__(agent_name="StrategistAgent", agent_version="1.0.0")

    def _register_capabilities(self) -> list[str]:
        return ["generate_strategy", "analyze_target_audience", "recommend_channels"]

    async def process(self, request: A2ARequest) -> A2AResponse:
        """
        전략 수립 메인 로직

        Args:
            request: A2A 요청

        Returns:
            A2AResponse: 마케팅 전략
        """
        brief = request.payload.get("brief", {})
        brand_kit = request.payload.get("brand_kit", {})

        logger.info(f"[StrategistAgent] Generating strategy for project={request.system_context.project_id}")

        # TODO: 실제 구현
        # 1. Brief 분석
        # 2. 타겟 오디언스 분석 (Ollama qwen2.5:14b)
        # 3. 채널 추천
        # 4. 타임라인 수립

        # 임시 구현
        result = {
            "strategy": {
                "overview": "Multi-channel digital marketing campaign",
                "timeline": "3 months",
                "phases": ["awareness", "consideration", "conversion"]
            },
            "channels": ["Instagram", "YouTube", "Blog"],
            "target_audience": {
                "primary": "20-30대 여성",
                "secondary": "30-40대 직장인",
                "psychographics": ["트렌드에 민감", "품질 중시"]
            }
        }

        return self._create_success_response(
            request=request,
            result=result,
            metadata={"model_used": self.quality_model}
        )
