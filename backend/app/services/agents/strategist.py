"""
Strategist Agent

마케팅 전략 수립 전문 Agent

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


class StrategistAgent(AgentBase):
    """
    Strategist Agent

    브랜드 전략, 캠페인 기획, 타겟 분석 등 마케팅 전략 수립

    주요 작업:
    1. brand_kit: 브랜드 아이덴티티 전략 수립
    2. campaign: 마케팅 캠페인 기획
    3. target_analysis: 타겟 고객 분석
    4. positioning: 브랜드 포지셔닝 전략
    5. content_strategy: 콘텐츠 전략 수립

    사용 예시:
        agent = StrategistAgent()
        response = await agent.execute(AgentRequest(
            task="brand_kit",
            payload={
                "brand_name": "EcoTech",
                "industry": "친환경 기술",
                "target_market": "환경의식 높은 MZ세대"
            }
        ))
    """

    @property
    def name(self) -> str:
        return "strategist"

    async def execute(self, request: AgentRequest) -> AgentResponse:
        """
        Strategist Agent 실행

        Args:
            request: Agent 요청

        Returns:
            AgentResponse: 전략 분석 결과 (JSON 형식)

        Raises:
            AgentError: 실행 실패 시
        """
        start_time = datetime.utcnow()

        try:
            # 1. 요청 검증
            self._validate_request(request)

            logger.info(f"Strategist Agent executing: task={request.task}")

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
                f"Strategist Agent success: task={request.task}, "
                f"elapsed={elapsed:.2f}s, tokens={usage['llm_tokens']}"
            )

            return AgentResponse(
                agent=self.name,
                task=request.task,
                outputs=outputs,
                usage=usage,
                meta=meta
            )

        except Exception as e:
            logger.error(f"Strategist Agent failed: {str(e)}", exc_info=True)
            raise AgentError(
                message=f"Strategist execution failed: {str(e)}",
                agent=self.name,
                details={"task": request.task, "payload": request.payload}
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
            "brand_kit": {
                "instruction": (
                    "브랜드의 아이덴티티를 정의하고 일관된 브랜드 경험을 위한 "
                    "가이드라인을 수립하세요. 시장 분석과 경쟁사 분석을 포함하세요."
                ),
                "structure": {
                    "brand_identity": {
                        "mission": "브랜드 미션",
                        "vision": "브랜드 비전",
                        "values": "핵심 가치 3-5개"
                    },
                    "positioning": {
                        "target_audience": "주 타겟 고객층",
                        "unique_value": "고유 가치 제안",
                        "differentiation": "차별화 포인트"
                    },
                    "personality": {
                        "tone": "브랜드 톤앤매너",
                        "archetype": "브랜드 원형",
                        "characteristics": "성격 특성"
                    },
                    "strategy": {
                        "short_term": "단기 전략 (3개월)",
                        "long_term": "장기 전략 (1년)",
                        "kpi": "핵심 성과 지표"
                    }
                }
            },
            "campaign": {
                "instruction": (
                    "마케팅 캠페인의 목표, 전략, 실행 계획을 체계적으로 수립하세요. "
                    "채널별 전략과 예상 성과를 포함하세요."
                ),
                "structure": {
                    "overview": {
                        "campaign_name": "캠페인명",
                        "objective": "캠페인 목표",
                        "duration": "기간"
                    },
                    "strategy": {
                        "key_message": "핵심 메시지",
                        "creative_concept": "크리에이티브 컨셉",
                        "channels": "활용 채널 및 전략"
                    },
                    "execution": {
                        "timeline": "실행 일정",
                        "budget_allocation": "예산 배분",
                        "content_plan": "콘텐츠 계획"
                    },
                    "measurement": {
                        "kpi": "성과 지표",
                        "expected_results": "예상 성과",
                        "tracking_method": "측정 방법"
                    }
                }
            },
            "target_analysis": {
                "instruction": (
                    "타겟 고객을 심층 분석하고 페르소나를 구체화하세요. "
                    "인구통계학적 특성, 심리적 특성, 행동 패턴을 포함하세요."
                ),
                "structure": {
                    "demographics": {
                        "age": "연령대",
                        "gender": "성별",
                        "income": "소득 수준",
                        "location": "거주 지역"
                    },
                    "psychographics": {
                        "interests": "관심사",
                        "values": "가치관",
                        "lifestyle": "라이프스타일",
                        "pain_points": "불편사항/니즈"
                    },
                    "behavior": {
                        "media_consumption": "미디어 소비 패턴",
                        "purchase_behavior": "구매 행동",
                        "brand_loyalty": "브랜드 충성도"
                    },
                    "persona": {
                        "name": "페르소나 이름",
                        "description": "상세 설명",
                        "key_needs": "핵심 니즈"
                    }
                }
            },
            "positioning": {
                "instruction": (
                    "브랜드의 시장 포지셔닝 전략을 수립하세요. "
                    "경쟁사 분석과 차별화 전략을 포함하세요."
                ),
                "structure": {
                    "market_analysis": {
                        "market_size": "시장 규모",
                        "trends": "시장 트렌드",
                        "opportunities": "기회 요인"
                    },
                    "competitive_analysis": {
                        "competitors": "주요 경쟁사",
                        "their_positioning": "경쟁사 포지셔닝",
                        "gaps": "시장 공백"
                    },
                    "positioning_strategy": {
                        "target_position": "목표 포지션",
                        "differentiation": "차별화 전략",
                        "key_benefits": "핵심 혜택"
                    }
                }
            },
            "content_strategy": {
                "instruction": (
                    "콘텐츠 마케팅 전략을 수립하세요. "
                    "채널별 콘텐츠 방향성과 퍼블리싱 계획을 포함하세요."
                ),
                "structure": {
                    "content_pillars": {
                        "pillar_1": "콘텐츠 기둥 1",
                        "pillar_2": "콘텐츠 기둥 2",
                        "pillar_3": "콘텐츠 기둥 3"
                    },
                    "channel_strategy": {
                        "blog": "블로그 전략",
                        "social_media": "SNS 전략",
                        "email": "이메일 전략"
                    },
                    "calendar": {
                        "frequency": "퍼블리싱 빈도",
                        "themes": "월별 테마",
                        "formats": "콘텐츠 포맷"
                    }
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

            # 작업별로 적절한 이름으로 출력 생성
            output_names = {
                "brand_kit": "brand_strategy",
                "campaign": "campaign_plan",
                "target_analysis": "target_insights",
                "positioning": "positioning_strategy",
                "content_strategy": "content_plan"
            }

            output_name = output_names.get(task, "strategy")

            outputs.append(self._create_output(
                output_type="json",
                name=output_name,
                value=content,
                meta={"format": "strategic_analysis", "task": task}
            ))

        # 텍스트 응답 처리 (폴백)
        elif llm_output.type == "text":
            outputs.append(self._create_output(
                output_type="text",
                name="raw_analysis",
                value=llm_output.value
            ))

        return outputs


# ============================================================================
# Factory Function
# ============================================================================

def get_strategist_agent(llm_gateway=None) -> StrategistAgent:
    """
    Strategist Agent 인스턴스 반환

    Args:
        llm_gateway: LLM Gateway (None이면 전역 인스턴스 사용)

    Returns:
        StrategistAgent 인스턴스
    """
    return StrategistAgent(llm_gateway=llm_gateway)
