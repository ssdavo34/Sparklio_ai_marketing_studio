"""
Editor Agent

콘텐츠 편집 및 수정 전문 Agent

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


class EditorAgent(AgentBase):
    """
    Editor Agent

    콘텐츠 편집, 교정, 재작성 전문 Agent

    주요 작업:
    1. proofread: 교정 (문법, 맞춤법, 표현)
    2. rewrite: 재작성 (구조 개선, 표현 변경)
    3. summarize: 요약
    4. expand: 확장 (내용 추가)
    5. translate: 번역 (다국어 지원)

    사용 예시:
        agent = EditorAgent()
        response = await agent.execute(AgentRequest(
            task="proofread",
            payload={
                "content": "...",
                "language": "ko"
            }
        ))
    """

    @property
    def name(self) -> str:
        return "editor"

    async def execute(self, request: AgentRequest) -> AgentResponse:
        """
        Editor Agent 실행

        Args:
            request: Agent 요청

        Returns:
            AgentResponse: 편집된 콘텐츠 (JSON 형식)

        Raises:
            AgentError: 실행 실패 시
        """
        start_time = datetime.utcnow()

        try:
            # 1. 요청 검증
            self._validate_request(request)

            logger.info(f"Editor Agent executing: task={request.task}")

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
                f"Editor Agent success: task={request.task}, "
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
            logger.error(f"Editor Agent failed: {str(e)}", exc_info=True)
            raise AgentError(
                message=f"Editor execution failed: {str(e)}",
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

        # 작업별 기본 지시사항 추가
        task_instructions = {
            "proofread": {
                "instruction": (
                    "콘텐츠를 교정하세요. "
                    "문법, 맞춤법, 띄어쓰기, 표현을 정확하게 수정하세요."
                ),
                "structure": {
                    "corrected_content": "교정된 콘텐츠",
                    "corrections": "수정 목록 (원문 -> 수정)",
                    "error_types": "오류 유형 분류",
                    "summary": "교정 요약"
                }
            },
            "rewrite": {
                "instruction": (
                    "콘텐츠를 재작성하세요. "
                    "원문의 의미를 유지하면서 구조와 표현을 개선하세요."
                ),
                "structure": {
                    "rewritten_content": "재작성된 콘텐츠",
                    "key_changes": "주요 변경사항",
                    "improvements": "개선 포인트",
                    "comparison": "원문 vs 수정본 비교"
                }
            },
            "summarize": {
                "instruction": (
                    "콘텐츠를 요약하세요. "
                    "핵심 내용을 간결하고 명확하게 정리하세요."
                ),
                "structure": {
                    "summary": "요약 (1-2 문장)",
                    "key_points": "핵심 포인트 리스트",
                    "detailed_summary": "상세 요약 (3-5 문장)",
                    "original_length": "원문 길이",
                    "summary_length": "요약본 길이"
                }
            },
            "expand": {
                "instruction": (
                    "콘텐츠를 확장하세요. "
                    "추가 세부 사항, 예시, 설명을 포함하여 내용을 풍부하게 하세요."
                ),
                "structure": {
                    "expanded_content": "확장된 콘텐츠",
                    "additions": "추가된 내용 설명",
                    "original_length": "원문 길이",
                    "expanded_length": "확장본 길이"
                }
            },
            "translate": {
                "instruction": (
                    "콘텐츠를 번역하세요. "
                    "의미를 정확하게 전달하고 자연스러운 표현을 사용하세요."
                ),
                "structure": {
                    "translated_content": "번역된 콘텐츠",
                    "source_language": "원문 언어",
                    "target_language": "대상 언어",
                    "notes": "번역 노트 (문화적 차이, 표현 선택 등)"
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

            # 작업별 출력 이름
            output_names = {
                "proofread": "proofread_result",
                "rewrite": "rewritten_content",
                "summarize": "summary",
                "expand": "expanded_content",
                "translate": "translation"
            }

            output_name = output_names.get(task, "edited_content")

            outputs.append(self._create_output(
                output_type="json",
                name=output_name,
                value=content,
                meta={"task": task, "format": "editing"}
            ))

        # 텍스트 응답 처리 (폴백)
        elif llm_output.type == "text":
            outputs.append(self._create_output(
                output_type="text",
                name="edited_text",
                value=llm_output.value
            ))

        return outputs


# ============================================================================
# Factory Function
# ============================================================================

def get_editor_agent(llm_gateway=None) -> EditorAgent:
    """
    Editor Agent 인스턴스 반환

    Args:
        llm_gateway: LLM Gateway (None이면 전역 인스턴스 사용)

    Returns:
        EditorAgent 인스턴스
    """
    return EditorAgent(llm_gateway=llm_gateway)
