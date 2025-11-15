"""
ReviewerAgent

생성물 품질 검토 및 피드백
"""

from typing import Dict, Any, List
import logging
import json

from app.agents.base import LLMAgent
from app.schemas.agent import A2ARequest, A2AResponse
from app.integrations.ollama_client import OllamaClient


logger = logging.getLogger(__name__)


class ReviewerAgent(LLMAgent):
    """
    ReviewerAgent - 생성물 품질 검토

    입력: Brief, 생성된 콘텐츠 (카피, 이미지 등), BrandKit
    출력: 품질 점수, 피드백, 승인 여부
    """

    def __init__(self):
        super().__init__(agent_name="ReviewerAgent", agent_version="1.0.0")
        self.ollama_client = OllamaClient()

    def _register_capabilities(self) -> list[str]:
        return ["review_content", "check_brief_alignment", "provide_feedback", "check_brand_compliance"]

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
        brand_kit = request.payload.get("brand_kit", {})
        strict_mode = request.payload.get("strict_mode", False)

        logger.info(f"[ReviewerAgent] Reviewing {content_type} content, strict_mode={strict_mode}")

        # 1. Ollama를 사용하여 콘텐츠 품질 평가
        review_result = await self._review_content_with_llm(
            brief=brief,
            generated_content=generated_content,
            content_type=content_type,
            brand_kit=brand_kit,
            strict_mode=strict_mode
        )

        # 2. 검토 결과 검증
        validated_review = self._validate_review(review_result)

        # 3. 승인 여부 결정
        approval_decision = self._decide_approval(validated_review, strict_mode)

        result = {
            "overall_score": validated_review.get("overall_score", 0.7),
            "scores": validated_review.get("scores", {}),
            "brief_alignment": validated_review.get("brief_alignment", 0.7),
            "brand_compliance": validated_review.get("brand_compliance", 0.7),
            "feedback": validated_review.get("feedback", []),
            "suggestions": validated_review.get("suggestions", []),
            "approved": approval_decision["approved"],
            "approval_reason": approval_decision["reason"],
            "issues": validated_review.get("issues", [])
        }

        return self._create_success_response(
            request=request,
            result=result,
            metadata={
                "content_type": content_type,
                "strict_mode": strict_mode,
                "model_used": self.default_model,
                "review_criteria": list(validated_review.get("scores", {}).keys())
            }
        )

    async def _review_content_with_llm(
        self,
        brief: Dict[str, Any],
        generated_content: Dict[str, Any],
        content_type: str,
        brand_kit: Dict[str, Any],
        strict_mode: bool
    ) -> Dict[str, Any]:
        """
        Ollama를 사용하여 생성된 콘텐츠 품질 평가

        Args:
            brief: Brief 데이터
            generated_content: 생성된 콘텐츠 (copy, image_prompt 등)
            content_type: 콘텐츠 타입 (copy, image, strategy)
            brand_kit: BrandKit 데이터
            strict_mode: 엄격한 검토 모드

        Returns:
            Dict: 검토 결과
        """
        system_prompt = f"""당신은 전문 마케팅 콘텐츠 검토자입니다. 생성된 콘텐츠가 Brief와 BrandKit에 부합하는지 평가합니다.

{'엄격한 검토 모드: 모든 기준에서 90% 이상 충족해야 승인됩니다.' if strict_mode else '일반 검토 모드: 종합 점수 70% 이상이면 승인됩니다.'}

다음 JSON 형식으로 응답하세요:
{{
  "overall_score": 0.0~1.0,
  "scores": {{
    "goal_alignment": 0.0~1.0,
    "target_audience_fit": 0.0~1.0,
    "tone_match": 0.0~1.0,
    "brand_consistency": 0.0~1.0,
    "message_clarity": 0.0~1.0,
    "creativity": 0.0~1.0
  }},
  "brief_alignment": 0.0~1.0,
  "brand_compliance": 0.0~1.0,
  "feedback": [
    "긍정적인 피드백 1",
    "긍정적인 피드백 2"
  ],
  "suggestions": [
    "개선 제안 1",
    "개선 제안 2"
  ],
  "issues": [
    "심각한 문제 (있을 경우)"
  ]
}}

평가 기준:
1. goal_alignment: Brief의 목표와 일치도
2. target_audience_fit: 타겟 오디언스 적합도
3. tone_match: 요청된 톤앤매너 일치도
4. brand_consistency: 브랜드 가이드라인 준수
5. message_clarity: 메시지 명확성
6. creativity: 창의성 및 독창성"""

        content_summary = self._summarize_content(generated_content, content_type)

        user_prompt = f"""Brief 정보:
- 목표: {brief.get('goal', '')}
- 타겟 오디언스: {brief.get('target_audience', '')}
- 핵심 메시지: {', '.join(brief.get('key_messages', []))}
- 톤: {brief.get('tone', '')}
- 채널: {', '.join(brief.get('channels', []))}

BrandKit:
- 톤앤매너: {brand_kit.get('tone', '정보 없음')}
- 핵심 메시지: {', '.join(brand_kit.get('key_messages', []))}

생성된 콘텐츠 ({content_type}):
{content_summary}

위 콘텐츠를 평가하여 JSON 형식으로 검토 결과를 제공해주세요."""

        try:
            response = await self.ollama_client.generate(
                prompt=user_prompt,
                system=system_prompt,
                model=self.default_model,
                temperature=0.3,  # 일관된 평가를 위해 낮은 temperature
                max_tokens=1000
            )

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

            review_result = json.loads(response_text)

            logger.info(f"[ReviewerAgent] Review completed with overall_score={review_result.get('overall_score', 0.0)}")

            return review_result

        except json.JSONDecodeError as e:
            logger.error(f"[ReviewerAgent] Failed to parse JSON response: {e}")
            logger.error(f"[ReviewerAgent] Response text: {response_text}")

            # 파싱 실패 시 기본 검토 결과 반환
            return self._create_fallback_review(brief, generated_content)

        except Exception as e:
            logger.error(f"[ReviewerAgent] Error reviewing content: {e}")
            return self._create_fallback_review(brief, generated_content)

    def _summarize_content(self, generated_content: Dict[str, Any], content_type: str) -> str:
        """
        생성된 콘텐츠 요약

        Args:
            generated_content: 생성된 콘텐츠
            content_type: 콘텐츠 타입

        Returns:
            str: 콘텐츠 요약
        """
        if content_type == "copy":
            primary_copy = generated_content.get("primary_copy", "")
            variants = generated_content.get("variants", [])
            return f"""Primary Copy: {primary_copy}
Variants: {', '.join(variants[:3])}
Channel: {generated_content.get('channel', 'N/A')}
Copy Type: {generated_content.get('copy_type', 'N/A')}"""

        elif content_type == "strategy":
            strategy = generated_content.get("strategy", {})
            return f"""Overview: {strategy.get('overview', '')[:200]}
Objectives: {', '.join(strategy.get('objectives', [])[:3])}
Channels: {', '.join([ch.get('name', '') for ch in strategy.get('channels', [])[:3]])}
Key Messages: {', '.join(strategy.get('key_messages', [])[:3])}"""

        elif content_type == "image":
            return f"""Image Prompt: {generated_content.get('prompt_used', '')[:200]}
Style: {generated_content.get('style', 'N/A')}
Aspect Ratio: {generated_content.get('aspect_ratio', 'N/A')}
Image Count: {generated_content.get('image_count', 0)}"""

        else:
            return json.dumps(generated_content, ensure_ascii=False)[:500]

    def _create_fallback_review(self, brief: Dict[str, Any], generated_content: Dict[str, Any]) -> Dict[str, Any]:
        """
        LLM 호출 실패 시 기본 검토 결과 생성

        Args:
            brief: Brief 데이터
            generated_content: 생성된 콘텐츠

        Returns:
            Dict: 기본 검토 결과
        """
        # 간단한 규칙 기반 평가
        has_content = bool(generated_content)
        has_goal = bool(brief.get("goal"))

        base_score = 0.6 if has_content else 0.3

        return {
            "overall_score": base_score,
            "scores": {
                "goal_alignment": base_score,
                "target_audience_fit": base_score,
                "tone_match": base_score,
                "brand_consistency": base_score,
                "message_clarity": base_score,
                "creativity": base_score
            },
            "brief_alignment": base_score,
            "brand_compliance": base_score,
            "feedback": [
                "자동 검토: 콘텐츠가 생성되었습니다." if has_content else "자동 검토: 콘텐츠가 비어 있습니다."
            ],
            "suggestions": [
                "전문가 검토를 권장합니다."
            ],
            "issues": [
                "LLM 검토 실패 - 수동 검토 필요"
            ] if not has_content else []
        }

    def _validate_review(self, review_result: Dict[str, Any]) -> Dict[str, Any]:
        """
        검토 결과 검증 및 보완

        Args:
            review_result: 검토 결과

        Returns:
            Dict: 검증된 검토 결과
        """
        # 필수 필드 확인
        if "overall_score" not in review_result:
            scores = review_result.get("scores", {})
            if scores:
                review_result["overall_score"] = sum(scores.values()) / len(scores)
            else:
                review_result["overall_score"] = 0.5

        # 점수 범위 확인
        review_result["overall_score"] = max(0.0, min(1.0, review_result.get("overall_score", 0.5)))

        # scores 검증
        if not isinstance(review_result.get("scores"), dict):
            review_result["scores"] = {
                "goal_alignment": review_result["overall_score"],
                "target_audience_fit": review_result["overall_score"],
                "tone_match": review_result["overall_score"],
                "brand_consistency": review_result["overall_score"],
                "message_clarity": review_result["overall_score"],
                "creativity": review_result["overall_score"]
            }

        # 리스트 필드 기본값
        for field in ["feedback", "suggestions", "issues"]:
            if not isinstance(review_result.get(field), list):
                review_result[field] = []

        # brief_alignment, brand_compliance 기본값
        if "brief_alignment" not in review_result:
            review_result["brief_alignment"] = review_result["overall_score"]

        if "brand_compliance" not in review_result:
            review_result["brand_compliance"] = review_result["overall_score"]

        return review_result

    def _decide_approval(self, review_result: Dict[str, Any], strict_mode: bool) -> Dict[str, str]:
        """
        승인 여부 결정

        Args:
            review_result: 검토 결과
            strict_mode: 엄격한 모드

        Returns:
            Dict: 승인 여부 및 이유
        """
        overall_score = review_result.get("overall_score", 0.0)
        scores = review_result.get("scores", {})
        issues = review_result.get("issues", [])

        # 심각한 문제가 있으면 자동 거부
        if issues:
            return {
                "approved": False,
                "reason": f"심각한 문제 발견: {', '.join(issues[:2])}"
            }

        if strict_mode:
            # 엄격한 모드: 모든 항목 90% 이상
            threshold = 0.9
            failing_criteria = [k for k, v in scores.items() if v < threshold]

            if failing_criteria:
                return {
                    "approved": False,
                    "reason": f"엄격한 기준 미달 (90% 이상 필요): {', '.join(failing_criteria)}"
                }

            if overall_score < threshold:
                return {
                    "approved": False,
                    "reason": f"종합 점수 미달: {overall_score*100:.1f}% (90% 이상 필요)"
                }

            return {
                "approved": True,
                "reason": "모든 엄격한 기준 충족"
            }

        else:
            # 일반 모드: 종합 점수 70% 이상
            threshold = 0.7

            if overall_score < threshold:
                return {
                    "approved": False,
                    "reason": f"종합 점수 미달: {overall_score*100:.1f}% (70% 이상 필요)"
                }

            # 개별 항목 중 50% 미만인 것이 있으면 경고
            critical_failures = [k for k, v in scores.items() if v < 0.5]
            if critical_failures:
                return {
                    "approved": False,
                    "reason": f"치명적 항목 미달 (50% 미만): {', '.join(critical_failures)}"
                }

            return {
                "approved": True,
                "reason": f"기준 충족 (종합 {overall_score*100:.1f}%)"
            }
