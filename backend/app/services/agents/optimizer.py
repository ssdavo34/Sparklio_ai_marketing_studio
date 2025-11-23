"""
Optimizer Agent

콘텐츠 최적화 전문 Agent

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


class OptimizerAgent(AgentBase):
    """
    Optimizer Agent

    기존 콘텐츠를 개선하고 최적화하는 Agent

    주요 작업:
    1. seo_optimize: SEO 최적화
    2. conversion_optimize: 전환율 최적화
    3. readability_improve: 가독성 개선
    4. length_adjust: 길이 조정 (확장/축약)
    5. tone_adjust: 톤앤매너 조정

    사용 예시:
        agent = OptimizerAgent()
        response = await agent.execute(AgentRequest(
            task="seo_optimize",
            payload={
                "content": "...",
                "target_keywords": ["무선 이어폰", "노이즈캔슬링"],
                "target_platform": "blog"
            }
        ))
    """

    @property
    def name(self) -> str:
        return "optimizer"

    async def execute(self, request: AgentRequest) -> AgentResponse:
        """
        Optimizer Agent 실행

        Args:
            request: Agent 요청

        Returns:
            AgentResponse: 최적화된 콘텐츠 (JSON 형식)

        Raises:
            AgentError: 실행 실패 시
        """
        start_time = datetime.utcnow()

        try:
            # 1. 요청 검증
            self._validate_request(request)

            logger.info(f"Optimizer Agent executing: task={request.task}")

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
                "total_tokens": llm_response.usage.get("total_tokens", 0),
                "elapsed_seconds": round(elapsed, 2)
            }

            # 6. 메타데이터
            meta = {
                "llm_provider": llm_response.provider,
                "llm_model": llm_response.model,
                "task": request.task
            }

            logger.info(
                f"Optimizer Agent success: task={request.task}, "
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
            logger.error(f"Optimizer Agent failed: {str(e)}", exc_info=True)
            raise AgentError(
                message=f"Optimizer execution failed: {str(e)}",
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
            "seo_optimize": {
                "instruction": (
                    "SEO에 최적화된 콘텐츠로 개선하세요. "
                    "키워드를 자연스럽게 배치하고 검색 엔진 친화적으로 작성하세요."
                ),
                "structure": {
                    "optimized_content": "최적화된 콘텐츠",
                    "keyword_placement": "키워드 배치 분석",
                    "meta_title": "메타 타이틀 제안",
                    "meta_description": "메타 디스크립션 제안",
                    "improvements": "개선 내역"
                }
            },
            "conversion_optimize": {
                "instruction": (
                    "전환율을 높이기 위해 콘텐츠를 최적화하세요. "
                    "CTA를 강화하고 설득력을 향상시키세요."
                ),
                "structure": {
                    "optimized_content": "최적화된 콘텐츠",
                    "cta_improvements": "CTA 개선사항",
                    "persuasion_elements": "추가된 설득 요소",
                    "expected_lift": "예상 개선율"
                }
            },
            "readability_improve": {
                "instruction": (
                    "가독성을 높이기 위해 콘텐츠를 개선하세요. "
                    "문장 구조를 단순화하고 명확하게 작성하세요."
                ),
                "structure": {
                    "improved_content": "개선된 콘텐츠",
                    "readability_score": "가독성 점수",
                    "changes_made": "변경 사항",
                    "explanation": "개선 설명"
                }
            },
            "length_adjust": {
                "instruction": (
                    "목표 길이에 맞게 콘텐츠를 조정하세요. "
                    "핵심 메시지를 유지하면서 확장 또는 축약하세요."
                ),
                "structure": {
                    "adjusted_content": "조정된 콘텐츠",
                    "original_length": "원본 길이",
                    "new_length": "새 길이",
                    "modifications": "수정 내역"
                }
            },
            "tone_adjust": {
                "instruction": (
                    "지정된 톤앤매너에 맞게 콘텐츠를 조정하세요. "
                    "목표 분위기와 스타일을 반영하세요."
                ),
                "structure": {
                    "adjusted_content": "조정된 콘텐츠",
                    "target_tone": "목표 톤",
                    "tone_changes": "톤 변경사항",
                    "examples": "변경 예시"
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
                name="optimized_result",
                value=content,
                meta={"task": task, "format": "optimization"}
            ))

        # 텍스트 응답 처리 (폴백)
        elif llm_output.type == "text":
            outputs.append(self._create_output(
                output_type="text",
                name="optimized_content",
                value=llm_output.value
            ))

        return outputs


# ============================================================================
# Factory Function
# ============================================================================

def get_optimizer_agent(llm_gateway=None) -> OptimizerAgent:
    """
    Optimizer Agent 인스턴스 반환

    Args:
        llm_gateway: LLM Gateway (None이면 전역 인스턴스 사용)

    Returns:
        OptimizerAgent 인스턴스
    """
    return OptimizerAgent(llm_gateway=llm_gateway)
