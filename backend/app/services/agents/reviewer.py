"""
Reviewer Agent

콘텐츠 품질 검토 전문 Agent

작성일: 2025-11-16
작성자: B팀 (Backend)
문서: ARCH-003, SPEC-002
"""

import logging
from typing import Dict, Any
from datetime import datetime

from .base import AgentBase, AgentRequest, AgentResponse, AgentError
from app.services.llm import LLMProviderOutput

logger = logging.getLogger(__name__)


class ReviewerAgent(AgentBase):
    """
    Reviewer Agent

    생성된 콘텐츠의 품질, 적합성, 개선 사항 검토

    주요 작업:
    1. content_review: 콘텐츠 전반적 검토
    2. copy_review: 카피 품질 검토
    3. brand_consistency: 브랜드 일관성 검토
    4. grammar_check: 문법 및 맞춤법 검토
    5. effectiveness_analysis: 효과성 분석

    사용 예시:
        agent = ReviewerAgent()
        response = await agent.execute(AgentRequest(
            task="content_review",
            payload={
                "content": {...},  # 검토할 콘텐츠
                "criteria": ["quality", "brand_fit", "effectiveness"],
                "brand_guidelines": {...}  # 브랜드 가이드라인 (선택)
            }
        ))
    """

    @property
    def name(self) -> str:
        return "reviewer"

    async def execute(self, request: AgentRequest) -> AgentResponse:
        """
        Reviewer Agent 실행

        Args:
            request: Agent 요청

        Returns:
            AgentResponse: 검토 결과 (JSON 형식)

        Raises:
            AgentError: 실행 실패 시
        """
        start_time = datetime.utcnow()

        try:
            # 1. 요청 검증
            self._validate_request(request)

            logger.info(f"Reviewer Agent executing: task={request.task}")

            # 2. LLM 프롬프트 구성
            enhanced_payload = self._enhance_payload(request)

            # 3. LLM 호출 (JSON 모드)
            llm_response = await self.llm_gateway.generate(
                role=self.name,
                task=request.task,
                payload=enhanced_payload,
                mode="json",
                options=request.options
            )

            # 4. 응답 파싱
            outputs = self._parse_llm_response(llm_response.output, request.task)

            # 5. 사용량 계산
            elapsed = (datetime.utcnow() - start_time).total_seconds()
            usage = {
                "llm_tokens": llm_response.usage.get("total_tokens", 0),
                "total_tokens": llm_response.usage.get("total_tokens", 0),  # GeneratorService가 사용
                "elapsed_seconds": round(elapsed, 2)
            }

            # 6. 메타데이터
            meta = {
                "llm_provider": llm_response.provider,
                "llm_model": llm_response.model,
                "task": request.task
            }

            logger.info(
                f"Reviewer Agent success: task={request.task}, "
                f"elapsed={elapsed:.2f}s"
            )

            return AgentResponse(
                agent=self.name,
                task=request.task,
                outputs=outputs,
                usage=usage,
                meta=meta
            )

        except Exception as e:
            logger.error(f"Reviewer Agent failed: {str(e)}", exc_info=True)
            raise AgentError(
                message=f"Reviewer execution failed: {str(e)}",
                agent=self.name,
                details={"task": request.task}
            )

    def _enhance_payload(self, request: AgentRequest) -> Dict[str, Any]:
        """
        Payload에 작업별 추가 지시사항 추가

        Args:
            request: Agent 요청

        Returns:
            향상된 Payload
        """
        enhanced = request.payload.copy()

        # 언어 설정 추가 (기본값: 한국어)
        if "language" not in enhanced:
            enhanced["language"] = "ko"

        # 작업별 기본 지시사항 추가
        task_instructions = {
            "content_review": {
                "instruction": (
                    "콘텐츠를 객관적으로 검토하고 평가하세요. "
                    "강점, 약점, 개선 사항을 구체적으로 제시하세요."
                ),
                "structure": {
                    "overall_score": "전체 점수 (1-10)",
                    "strengths": "강점 리스트",
                    "weaknesses": "약점 리스트",
                    "improvements": "개선 제안 리스트",
                    "detailed_feedback": "상세 피드백"
                }
            },
            "copy_review": {
                "instruction": (
                    "카피의 품질을 다각도로 검토하세요. "
                    "명확성, 설득력, 임팩트를 평가하세요."
                ),
                "structure": {
                    "clarity_score": "명확성 점수 (1-10)",
                    "persuasiveness_score": "설득력 점수 (1-10)",
                    "impact_score": "임팩트 점수 (1-10)",
                    "feedback": "상세 피드백",
                    "suggestions": "수정 제안"
                }
            },
            "brand_consistency": {
                "instruction": (
                    "브랜드 가이드라인과의 일관성을 검토하세요. "
                    "톤앤매너, 메시지, 비주얼 일관성을 평가하세요."
                ),
                "structure": {
                    "consistency_score": "일관성 점수 (1-10)",
                    "tone_match": "톤앤매너 적합도",
                    "message_alignment": "메시지 정렬도",
                    "deviations": "가이드라인 이탈 사항",
                    "recommendations": "개선 권장사항"
                }
            },
            "grammar_check": {
                "instruction": (
                    "문법, 맞춤법, 표현의 정확성을 검토하세요."
                ),
                "structure": {
                    "errors": "오류 목록 (위치, 유형, 수정안)",
                    "style_issues": "스타일 이슈",
                    "readability_score": "가독성 점수 (1-10)",
                    "corrected_version": "수정된 버전"
                }
            },
            "effectiveness_analysis": {
                "instruction": (
                    "마케팅 효과성을 분석하세요. "
                    "타겟 적합성, 행동 유도력, 차별성을 평가하세요."
                ),
                "structure": {
                    "target_fit_score": "타겟 적합성 (1-10)",
                    "cta_effectiveness": "행동 유도 효과",
                    "differentiation": "차별성 분석",
                    "predicted_performance": "예상 성과",
                    "optimization_tips": "최적화 팁"
                }
            }
        }

        # 작업별 지시사항 추가
        if request.task in task_instructions:
            enhanced["_instructions"] = task_instructions[request.task]["instruction"]
            enhanced["_output_structure"] = task_instructions[request.task]["structure"]

        return enhanced

    def _parse_llm_response(
        self,
        llm_output: LLMProviderOutput,
        task: str
    ) -> list:
        """
        LLM 응답을 AgentOutput 리스트로 변환

        Args:
            llm_output: LLM 출력
            task: 작업 유형

        Returns:
            AgentOutput 리스트
        """
        outputs = []

        # JSON 응답 처리
        if llm_output.type == "json":
            content = llm_output.value

            outputs.append(self._create_output(
                output_type="json",
                name="review_result",
                value=content,
                meta={"task": task, "format": "review_analysis"}
            ))

        # 텍스트 응답 처리 (폴백)
        elif llm_output.type == "text":
            outputs.append(self._create_output(
                output_type="text",
                name="review_feedback",
                value=llm_output.value
            ))

        return outputs


# ============================================================================
# Factory Function
# ============================================================================

def get_reviewer_agent(llm_gateway=None) -> ReviewerAgent:
    """
    Reviewer Agent 인스턴스 반환

    Args:
        llm_gateway: LLM Gateway (None이면 전역 인스턴스 사용)

    Returns:
        ReviewerAgent 인스턴스
    """
    return ReviewerAgent(llm_gateway=llm_gateway)
