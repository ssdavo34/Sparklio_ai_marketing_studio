"""
CopywriterAgent

Brief + Strategy → 마케팅 카피 생성
"""

from typing import Dict, Any, List
import logging
import json

from app.agents.base import LLMAgent
from app.schemas.agent import A2ARequest, A2AResponse
from app.integrations.ollama_client import OllamaClient


logger = logging.getLogger(__name__)


class CopywriterAgent(LLMAgent):
    """
    CopywriterAgent - 마케팅 카피 생성

    입력: Brief, Strategy, 톤
    출력: 카피 텍스트 + 대안
    """

    def __init__(self):
        super().__init__(agent_name="CopywriterAgent", agent_version="1.0.0")
        self.ollama_client = OllamaClient()

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
        brand_voice = request.payload.get("brand_voice", "professional")
        channel = request.payload.get("channel", "general")  # SNS, blog, ad, email 등
        copy_type = request.payload.get("copy_type", "general")  # headline, body, cta 등
        max_length = request.payload.get("max_length", None)
        variants_count = request.payload.get("variants_count", 2)

        logger.info(f"[CopywriterAgent] Generating copy: channel={channel}, type={copy_type}, voice={brand_voice}")

        # 1. Ollama를 사용하여 마케팅 카피 생성
        copy_result = await self._generate_copy_with_llm(
            brief=brief,
            strategy=strategy,
            brand_voice=brand_voice,
            channel=channel,
            copy_type=copy_type,
            max_length=max_length,
            variants_count=variants_count
        )

        # 2. 카피 검증
        validated_copy = self._validate_copy(copy_result, max_length)

        result = {
            "primary_copy": validated_copy.get("primary_copy", ""),
            "variants": validated_copy.get("variants", []),
            "channel": channel,
            "copy_type": copy_type,
            "brand_voice": brand_voice,
            "tone_match_score": validated_copy.get("tone_match_score", 0.8),
            "metadata": validated_copy.get("metadata", {})
        }

        return self._create_success_response(
            request=request,
            result=result,
            metadata={
                "model_used": self.quality_model,
                "channel": channel,
                "copy_type": copy_type,
                "length": len(result["primary_copy"]),
                "variants_generated": len(result["variants"])
            }
        )

    async def _generate_copy_with_llm(
        self,
        brief: Dict[str, Any],
        strategy: Dict[str, Any],
        brand_voice: str,
        channel: str,
        copy_type: str,
        max_length: int = None,
        variants_count: int = 2
    ) -> Dict[str, Any]:
        """
        Ollama를 사용하여 마케팅 카피 생성

        Args:
            brief: Brief 데이터
            strategy: 마케팅 전략
            brand_voice: 브랜드 보이스 (예: professional, friendly, energetic)
            channel: 채널 (SNS, blog, ad, email)
            copy_type: 카피 타입 (headline, body, cta, general)
            max_length: 최대 길이 제한 (optional)
            variants_count: 생성할 변형 개수

        Returns:
            Dict: 생성된 카피 및 변형
        """
        # 채널별 길이 제약 설정
        channel_constraints = {
            "twitter": {"headline": 280, "body": 280, "cta": 50},
            "instagram": {"headline": 150, "body": 2200, "cta": 30},
            "facebook": {"headline": 255, "body": 63206, "cta": 30},
            "linkedin": {"headline": 200, "body": 3000, "cta": 30},
            "blog": {"headline": 100, "body": 5000, "cta": 50},
            "email": {"headline": 70, "body": 3000, "cta": 40},
            "ad": {"headline": 90, "body": 300, "cta": 30},
            "general": {"headline": 100, "body": 1000, "cta": 50}
        }

        # 채널별 제약 가져오기
        constraints = channel_constraints.get(channel.lower(), channel_constraints["general"])
        if max_length is None:
            max_length = constraints.get(copy_type, 500)

        system_prompt = f"""당신은 전문 카피라이터입니다. 브랜드 보이스와 마케팅 전략에 맞는 효과적인 카피를 작성합니다.

다음 JSON 형식으로 응답하세요:
{{
  "primary_copy": "메인 카피 (가장 효과적인 버전)",
  "variants": ["{variants_count}개의 대안 카피"],
  "tone_match_score": 0.0~1.0,
  "metadata": {{
    "key_techniques": ["사용된 카피라이팅 기법"],
    "emotional_appeal": "감정적 소구 방식",
    "cta_strength": "high/medium/low"
  }}
}}

카피 작성 가이드라인:
1. 브랜드 보이스: {brand_voice}
2. 채널: {channel}
3. 카피 타입: {copy_type}
4. 최대 길이: {max_length}자
5. 핵심 메시지를 명확하게 전달
6. 타겟 오디언스에게 적합한 표현 사용
7. 행동 유도(CTA)가 필요한 경우 명확하고 강력하게 작성"""

        # 전략 요약
        strategy_summary = {
            "objectives": strategy.get("objectives", [])[:3],
            "key_messages": strategy.get("key_messages", [])[:3],
            "target": strategy.get("target_audience", {}).get("primary", "")
        }

        user_prompt = f"""다음 정보를 바탕으로 {copy_type} 카피를 작성해주세요:

Brief 정보:
- 목표: {brief.get('goal', '')}
- 타겟 오디언스: {brief.get('target_audience', '')}
- 핵심 메시지: {', '.join(brief.get('key_messages', [])[:3])}
- 브랜드 톤: {brief.get('tone', brand_voice)}

마케팅 전략:
- 전략 목표: {', '.join(strategy_summary['objectives'])}
- 핵심 메시지: {', '.join(strategy_summary['key_messages'])}
- 주요 타겟: {strategy_summary['target']}

채널: {channel}
카피 타입: {copy_type}
브랜드 보이스: {brand_voice}
최대 길이: {max_length}자

위 정보를 바탕으로 효과적인 마케팅 카피를 JSON 형식으로 생성해주세요."""

        try:
            # Ollama 호출 (quality_model 사용)
            response = await self.ollama_client.generate(
                prompt=user_prompt,
                system=system_prompt,
                model=self.quality_model,  # qwen2.5:14b for better copywriting
                temperature=0.7,  # 창의성을 위해 높은 temperature
                max_tokens=1500
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

            copy_result = json.loads(response_text)

            logger.info(f"[CopywriterAgent] Copy generated successfully with tone_match={copy_result.get('tone_match_score', 0.0)}")

            return copy_result

        except json.JSONDecodeError as e:
            logger.error(f"[CopywriterAgent] Failed to parse JSON response: {e}")
            logger.error(f"[CopywriterAgent] Response text: {response_text}")

            # 파싱 실패 시 기본 카피 반환
            return self._create_fallback_copy(brief, brand_voice, copy_type)

        except Exception as e:
            logger.error(f"[CopywriterAgent] Error generating copy: {e}")
            return self._create_fallback_copy(brief, brand_voice, copy_type)

    def _create_fallback_copy(self, brief: Dict[str, Any], brand_voice: str, copy_type: str) -> Dict[str, Any]:
        """
        LLM 호출 실패 시 기본 카피 생성

        Args:
            brief: Brief 데이터
            brand_voice: 브랜드 보이스
            copy_type: 카피 타입

        Returns:
            Dict: 기본 카피
        """
        goal = brief.get("goal", "혁신적인 경험")

        fallback_copies = {
            "headline": f"{goal[:50]}을 지금 바로 경험하세요",
            "body": f"{goal}. 특별한 가치를 제공합니다.",
            "cta": "지금 시작하기",
            "general": f"{goal}. 새로운 변화를 만나보세요."
        }

        return {
            "primary_copy": fallback_copies.get(copy_type, fallback_copies["general"]),
            "variants": [
                "특별한 경험이 기다립니다",
                "지금 바로 만나보세요"
            ],
            "tone_match_score": 0.5,
            "metadata": {
                "key_techniques": ["direct"],
                "emotional_appeal": "neutral",
                "cta_strength": "medium"
            },
            "_error": "카피 생성 실패 - 기본 카피 반환"
        }

    def _validate_copy(self, copy_result: Dict[str, Any], max_length: int = None) -> Dict[str, Any]:
        """
        생성된 카피 검증 및 보완

        Args:
            copy_result: 생성된 카피
            max_length: 최대 길이 제한

        Returns:
            Dict: 검증된 카피
        """
        # 필수 필드 확인
        if not copy_result.get("primary_copy"):
            copy_result["primary_copy"] = "특별한 경험을 만나보세요"

        # 길이 제한 적용
        if max_length and len(copy_result["primary_copy"]) > max_length:
            copy_result["primary_copy"] = copy_result["primary_copy"][:max_length-3] + "..."
            copy_result["_truncated"] = True

        # variants 검증
        if not isinstance(copy_result.get("variants"), list):
            copy_result["variants"] = []

        # variants 길이 제한
        if max_length:
            copy_result["variants"] = [
                v[:max_length-3] + "..." if len(v) > max_length else v
                for v in copy_result["variants"]
            ]

        # metadata 기본값
        if not copy_result.get("metadata"):
            copy_result["metadata"] = {
                "key_techniques": [],
                "emotional_appeal": "neutral",
                "cta_strength": "medium"
            }

        # tone_match_score 기본값
        if "tone_match_score" not in copy_result:
            copy_result["tone_match_score"] = 0.7

        return copy_result
