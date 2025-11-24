"""
Meeting AI Agent

회의록 분석 및 문서 초안 생성 전문 Agent

작성일: 2025-11-20
작성자: B팀 (Backend)
문서: ARCH-003, SPEC-002
"""

import logging
from typing import Dict, Any
from datetime import datetime

from .base import AgentBase, AgentRequest, AgentResponse, AgentError
from app.services.llm import LLMProviderOutput

logger = logging.getLogger(__name__)


class MeetingAIAgent(AgentBase):
    """
    Meeting AI Agent

    회의록 분석, 요약, Action Item 추출 및 문서 초안 생성

    주요 작업:
    1. meeting_summary: 회의 요약 및 분석 (요약, 안건, 결정사항, 액션아이템, 캠페인 아이디어)
    2. meeting_to_brief: 회의 분석 결과 → 캠페인 브리프 자동 생성
    3. analyze_transcript: 회의록 분석 (요약, Action Items, 주요 안건) - Legacy
    4. generate_draft: 회의 내용을 바탕으로 마케팅 문서 초안 생성 - Legacy

    사용 예시:
        agent = MeetingAIAgent()
        response = await agent.execute(AgentRequest(
            task="meeting_summary",
            payload={
                "transcript": "A: 이번 캠페인은...",
                "meeting_title": "신제품 런칭 회의",
                "brand_context": "Brand DNA..."
            }
        ))
    """

    @property
    def name(self) -> str:
        return "meeting_ai"

    async def execute(self, request: AgentRequest) -> AgentResponse:
        """
        Meeting AI Agent 실행

        Args:
            request: Agent 요청

        Returns:
            AgentResponse: 분석 결과 또는 생성된 문서

        Raises:
            AgentError: 실행 실패 시
        """
        start_time = datetime.utcnow()

        try:
            # 1. 요청 검증
            self._validate_request(request)

            logger.info(f"Meeting AI Agent executing: task={request.task}")

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
                f"Meeting AI Agent success: task={request.task}, "
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
            logger.error(f"Meeting AI Agent failed: {str(e)}", exc_info=True)
            raise AgentError(
                message=f"Meeting AI execution failed: {str(e)}",
                agent=self.name,
                details={"task": request.task}
            )

    def _enhance_payload(self, request: AgentRequest) -> Dict[str, Any]:
        """
        Payload에 작업별 추가 지시사항 추가
        """
        enhanced = request.payload.copy()

        if request.task == "meeting_summary":
            # P0-2 Meeting AI: meeting_summary task
            enhanced["_instructions"] = (
                "제공된 회의 트랜스크립트를 분석하여 다음을 추출하세요:\n"
                "1. 전체 요약 (summary): 회의의 핵심 내용을 3-5문장으로 요약\n"
                "2. 회의 안건 (agenda): 논의된 주요 안건 목록\n"
                "3. 결정 사항 (decisions): 회의에서 내려진 결정사항 목록\n"
                "4. 액션 아이템 (action_items): 향후 실행해야 할 과제 목록 (담당자, 기한 포함 시 명시)\n"
                "5. 캠페인 아이디어 (campaign_ideas): 회의 중 언급된 마케팅/캠페인 아이디어 목록\n\n"
                "브랜드 컨텍스트(brand_context)가 제공된 경우, 브랜드의 톤앤매너와 전략에 맞춰 분석하세요.\n"
                "한국어 회의인 경우 한국어로, 영어 회의인 경우 영어로 결과를 생성하세요."
            )
            enhanced["_output_structure"] = {
                "summary": "회의 전체 요약 (3-5문장)",
                "agenda": ["안건1", "안건2", "안건3"],
                "decisions": ["결정사항1", "결정사항2"],
                "action_items": [
                    "액션아이템1 (담당자: OOO, 기한: YYYY-MM-DD)",
                    "액션아이템2"
                ],
                "campaign_ideas": ["캠페인 아이디어1", "캠페인 아이디어2"]
            }

        elif request.task == "meeting_to_brief":
            # P0-2 Meeting AI: meeting_to_brief task
            enhanced["_instructions"] = (
                "회의 분석 결과(meeting_summary)를 바탕으로 실행 가능한 캠페인 브리프를 생성하세요.\n\n"
                "**입력 정보:**\n"
                "- meeting_summary: 회의 요약, 안건, 결정사항, 액션 아이템, 캠페인 아이디어\n"
                "- brand_context: 브랜드 DNA (있는 경우 브랜드에 맞게 조정)\n"
                "- additional_context: 사용자 추가 요청사항\n\n"
                "**생성 지침:**\n"
                "1. brief_title: 회의 제목과 핵심 내용을 반영한 브리프 제목\n"
                "2. objective: 명확한 마케팅 목표 (SMART 원칙)\n"
                "3. target_audience: 구체적인 타겟 고객 페르소나\n"
                "4. key_messages: 3-5개의 핵심 메시지 (회의 내용 기반)\n"
                "5. channels: 논의된 마케팅 채널 목록\n"
                "6. timeline: 회의에서 언급된 일정 (없으면 null)\n"
                "7. budget: 회의에서 논의된 예산 (없으면 null)\n"
                "8. deliverables: 구체적인 산출물 목록 (campaign_ideas 및 decisions 기반)\n"
                "9. constraints: 제약사항 (기한, 브랜드 가이드라인 등)\n"
                "10. success_metrics: 성공 지표 (언급된 경우, 없으면 null)\n\n"
                "**중요:**\n"
                "- 회의에서 실제로 논의된 내용만 사용 (추측하지 말 것)\n"
                "- 없는 정보는 null 또는 빈 리스트로 처리\n"
                "- 브랜드 컨텍스트가 있으면 브랜드 톤에 맞게 작성"
            )
            enhanced["_output_structure"] = {
                "brief_title": "브리프 제목",
                "objective": "마케팅 목표",
                "target_audience": "타겟 고객 설명",
                "key_messages": ["핵심 메시지 1", "핵심 메시지 2", "핵심 메시지 3"],
                "channels": ["채널1", "채널2"],
                "timeline": "일정 (없으면 null)",
                "budget": "예산 (없으면 null)",
                "deliverables": ["산출물1", "산출물2"],
                "constraints": ["제약사항1", "제약사항2"] or null,
                "success_metrics": ["지표1", "지표2"] or null
            }

        elif request.task == "analyze_transcript":
            # Legacy task (하위 호환성)
            enhanced["_instructions"] = (
                "제공된 회의록(transcript)을 분석하여 다음을 추출하세요:\n"
                "1. 전체 요약 (3-5문장)\n"
                "2. 주요 논의 안건 (Key Topics)\n"
                "3. 결정 사항 (Decisions)\n"
                "4. 향후 실행 과제 (Action Items) - 담당자 및 기한 포함 시 명시"
            )
            enhanced["_output_structure"] = {
                "summary": "전체 요약 텍스트",
                "key_topics": ["주제1", "주제2"],
                "decisions": ["결정1", "결정2"],
                "action_items": [
                    {"task": "할일", "assignee": "담당자(없으면 null)", "due_date": "기한(없으면 null)"}
                ]
            }

        elif request.task == "generate_draft":
            enhanced["_instructions"] = (
                "회의록 내용을 바탕으로 마케팅 문서(EditorDocument) 초안을 생성하세요.\n"
                "문서 구조는 Canvas Studio Editor와 호환되어야 합니다.\n"
                "회의에서 논의된 핵심 전략, 타겟, 메시지를 포함하는 구조화된 문서를 만드세요."
            )
            enhanced["_output_structure"] = {
                "document": {
                    "title": "문서 제목",
                    "pages": [
                        {
                            "id": "page_1",
                            "elements": [
                                {"type": "text", "content": "제목...", "style": {}}
                            ]
                        }
                    ]
                },
                "rationale": "문서 구조 설계 이유"
            }

        return enhanced

    def _parse_llm_response(
        self,
        llm_output: LLMProviderOutput,
        task: str
    ) -> list:
        """
        LLM 응답을 AgentOutput 리스트로 변환
        """
        outputs = []

        if llm_output.type == "json":
            content = llm_output.value

            output_name = "analysis_result"
            if task == "generate_draft":
                output_name = "draft_document"
            elif task == "meeting_to_brief":
                output_name = "campaign_brief"

            outputs.append(self._create_output(
                output_type="json",
                name=output_name,
                value=content,
                meta={"task": task}
            ))

        elif llm_output.type == "text":
            outputs.append(self._create_output(
                output_type="text",
                name="raw_text",
                value=llm_output.value
            ))

        return outputs


def get_meeting_ai_agent(llm_gateway=None) -> MeetingAIAgent:
    """
    Meeting AI Agent 인스턴스 반환
    """
    return MeetingAIAgent(llm_gateway=llm_gateway)
