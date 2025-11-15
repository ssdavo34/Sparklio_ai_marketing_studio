"""
StrategistAgent

Brief → 마케팅 전략 수립
"""

from typing import Dict, Any
import logging
import json

from app.agents.base import LLMAgent
from app.schemas.agent import A2ARequest, A2AResponse
from app.integrations.ollama_client import OllamaClient


logger = logging.getLogger(__name__)


class StrategistAgent(LLMAgent):
    """
    StrategistAgent - 마케팅 전략 수립

    입력: Brief, BrandKit
    출력: 마케팅 전략 (채널, 타겟, 타임라인)
    """

    def __init__(self):
        super().__init__(agent_name="StrategistAgent", agent_version="1.0.0")
        self.ollama_client = OllamaClient()

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
        brand_analysis = request.payload.get("brand_analysis", {})

        logger.info(f"[StrategistAgent] Generating strategy for project={request.system_context.project_id}")

        # 1. Ollama를 사용하여 마케팅 전략 생성
        strategy = await self._generate_strategy_from_brief(brief, brand_kit, brand_analysis)

        # 2. 전략 검증
        validated_strategy = self._validate_strategy(strategy)

        result = {
            "strategy": validated_strategy,
            "confidence": validated_strategy.get("_confidence", 0.8),
            "brief_summary": {
                "goal": brief.get("goal", ""),
                "target_audience": brief.get("target_audience", ""),
                "budget": brief.get("budget")
            }
        }

        return self._create_success_response(
            request=request,
            result=result,
            metadata={
                "model_used": self.quality_model,
                "brief_provided": bool(brief),
                "brand_kit_provided": bool(brand_kit)
            }
        )

    async def _generate_strategy_from_brief(
        self,
        brief: Dict[str, Any],
        brand_kit: Dict[str, Any],
        brand_analysis: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Ollama를 사용하여 Brief로부터 마케팅 전략 생성

        Args:
            brief: Brief 데이터
            brand_kit: BrandKit 데이터
            brand_analysis: 브랜드 분석 데이터

        Returns:
            Dict: 마케팅 전략
        """
        system_prompt = """당신은 마케팅 전략 전문가입니다. Brief와 브랜드 정보를 분석하여 실행 가능한 마케팅 전략을 수립합니다.

다음 JSON 형식으로 응답하세요:
{
  "overview": "전략 개요 (2-3문장)",
  "objectives": ["목표 1", "목표 2", "목표 3"],
  "target_audience": {
    "primary": "주요 타겟 설명",
    "secondary": "부차 타겟 설명",
    "segments": [
      {
        "name": "세그먼트명",
        "characteristics": ["특성1", "특성2"],
        "approach": "접근 방식"
      }
    ]
  },
  "channels": [
    {
      "name": "채널명 (예: Instagram, YouTube, Blog)",
      "purpose": "채널 활용 목적",
      "priority": "high/medium/low",
      "kpis": ["KPI 1", "KPI 2"]
    }
  ],
  "timeline": {
    "total_duration": "전체 기간 (예: 3개월)",
    "phases": [
      {
        "name": "단계명 (예: Awareness)",
        "duration": "기간",
        "activities": ["활동1", "활동2"],
        "milestones": ["마일스톤1"]
      }
    ]
  },
  "budget_allocation": {
    "total_budget": "예산 (숫자 또는 null)",
    "breakdown": [
      {
        "category": "카테고리 (예: 광고, 콘텐츠 제작)",
        "percentage": 30,
        "amount": "금액 또는 null"
      }
    ]
  },
  "key_messages": ["핵심 메시지 1", "핵심 메시지 2"],
  "content_themes": ["콘텐츠 테마 1", "테마 2"],
  "success_metrics": ["성공 지표 1", "지표 2"],
  "risks": [
    {
      "risk": "리스크 설명",
      "mitigation": "완화 방안"
    }
  ],
  "_confidence": 0.0~1.0
}

예산이 명시되지 않은 경우 budget_allocation.total_budget를 null로 설정하되, percentage 기반 breakdown은 제공하세요."""

        user_prompt = f"""Brief 정보:
- 목표: {brief.get('goal', '정보 없음')}
- 타겟 오디언스: {brief.get('target_audience', '정보 없음')}
- 예산: {brief.get('budget') or '미정'}
- 일정: {brief.get('timeline', '미정')}
- 톤: {brief.get('tone', '정보 없음')}
- 핵심 메시지: {', '.join(brief.get('key_messages', []))}
- 채널: {', '.join(brief.get('channels', []))}
- 요구사항: {', '.join(brief.get('requirements', []))}

브랜드 정보:
- BrandKit: {json.dumps(brand_kit, ensure_ascii=False)}
- 브랜드 보이스: {brand_analysis.get('brand_voice', '정보 없음')}
- 핵심 가치: {', '.join(brand_analysis.get('key_values', []))}
- 타겟 페르소나: {brand_analysis.get('target_persona', '정보 없음')}

위 정보를 바탕으로 실행 가능한 마케팅 전략을 JSON 형식으로 생성해주세요."""

        try:
            # Ollama 호출 (quality_model 사용)
            response = await self.ollama_client.generate(
                prompt=user_prompt,
                system=system_prompt,
                model=self.quality_model,  # qwen2.5:14b for better strategy
                temperature=0.4,  # 창의성과 일관성 균형
                max_tokens=2000
            )

            # JSON 파싱
            response_text = response["response"].strip()

            # JSON 블록 추출
            if "```json" in response_text:
                json_start = response_text.find("```json") + 7
                json_end = response_text.find("```", json_start)
                response_text = response_text[json_start:json_end].strip()
            elif "```" in response_text:
                json_start = response_text.find("```") + 3
                json_end = response_text.find("```", json_start)
                response_text = response_text[json_start:json_end].strip()

            strategy = json.loads(response_text)

            logger.info(f"[StrategistAgent] Strategy generated successfully with confidence={strategy.get('_confidence', 0.0)}")

            return strategy

        except json.JSONDecodeError as e:
            logger.error(f"[StrategistAgent] Failed to parse JSON response: {e}")
            logger.error(f"[StrategistAgent] Response text: {response_text}")

            # 파싱 실패 시 기본 전략 반환
            return self._create_fallback_strategy(brief)

        except Exception as e:
            logger.error(f"[StrategistAgent] Error generating strategy: {e}")
            return self._create_fallback_strategy(brief)

    def _create_fallback_strategy(self, brief: Dict[str, Any]) -> Dict[str, Any]:
        """
        LLM 호출 실패 시 기본 전략 생성

        Args:
            brief: Brief 데이터

        Returns:
            Dict: 기본 전략
        """
        return {
            "overview": brief.get("goal", "마케팅 캠페인 실행")[:200],
            "objectives": brief.get("key_messages", ["브랜드 인지도 향상"]),
            "target_audience": {
                "primary": brief.get("target_audience", "분석 필요"),
                "secondary": "분석 필요",
                "segments": []
            },
            "channels": [
                {
                    "name": channel,
                    "purpose": "브랜드 노출",
                    "priority": "medium",
                    "kpis": ["도달률", "참여율"]
                } for channel in brief.get("channels", ["Instagram", "Blog"])
            ],
            "timeline": {
                "total_duration": brief.get("timeline", "3개월"),
                "phases": [
                    {
                        "name": "Phase 1",
                        "duration": "1개월",
                        "activities": ["캠페인 준비"],
                        "milestones": ["콘텐츠 제작 완료"]
                    }
                ]
            },
            "budget_allocation": {
                "total_budget": brief.get("budget"),
                "breakdown": []
            },
            "key_messages": brief.get("key_messages", []),
            "content_themes": [],
            "success_metrics": ["ROI", "참여율"],
            "risks": [],
            "_confidence": 0.3,
            "_error": "전략 생성 실패 - 기본 전략 반환"
        }

    def _validate_strategy(self, strategy: Dict[str, Any]) -> Dict[str, Any]:
        """
        전략 필수 필드 검증 및 보완

        Args:
            strategy: 생성된 전략

        Returns:
            Dict: 검증된 전략
        """
        # 필수 필드 확인
        required_fields = ["overview", "objectives", "target_audience", "channels", "timeline"]
        for field in required_fields:
            if not strategy.get(field):
                strategy[field] = "분석 필요" if isinstance(strategy.get(field), str) else {}
                strategy["_confidence"] = min(strategy.get("_confidence", 0.5), 0.5)

        # 리스트 필드 기본값
        list_fields = ["objectives", "key_messages", "content_themes", "success_metrics", "risks"]
        for field in list_fields:
            if not isinstance(strategy.get(field), list):
                strategy[field] = []

        # channels 검증
        if not isinstance(strategy.get("channels"), list) or not strategy.get("channels"):
            strategy["channels"] = [
                {
                    "name": "Instagram",
                    "purpose": "브랜드 인지도",
                    "priority": "medium",
                    "kpis": ["도달률"]
                }
            ]

        return strategy
