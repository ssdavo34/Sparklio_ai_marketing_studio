"""
Strategist Agent

마케팅 전략 수립 전문 Agent

작성일: 2025-11-16
수정일: 2025-11-29 - execute_v3() 메서드 추가 (Plan-Act-Reflect 패턴)
작성자: B팀 (Backend)
문서: ARCH-003, SPEC-002, B_TEAM_AGENT_UPGRADE_PLAN.md
"""

import logging
from typing import Dict, Any
from datetime import datetime

from .base import (
    AgentBase, AgentRequest, AgentResponse, AgentError,
    AgentGoal, SelfReview, ExecutionPlan
)
from app.services.llm import LLMProviderOutput
from app.services.validation import OutputValidator

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

            # 3. Retry Logic (CopywriterAgent 패턴 적용)
            # 최대 3회 시도 (초기 시도 + 2회 재시도)
            max_retries = 3
            base_temperature = 0.4
            last_error = None
            validator = OutputValidator()

            for attempt in range(max_retries):
                try:
                    # Temperature 조정: 재시도마다 약간 증가 (다양성 확보)
                    current_temp = base_temperature + (attempt * 0.1)  # 0.4, 0.5, 0.6

                    if attempt > 0:
                        logger.info(f"🔄 Retry attempt {attempt}/{max_retries - 1} (temperature={current_temp})")

                    llm_options = {
                        **(request.options or {}),
                        "temperature": current_temp
                    }

                    # LLM 호출 (JSON 모드)
                    llm_response = await self.llm_gateway.generate(
                        role=self.name,
                        task=request.task,
                        payload=enhanced_payload,
                        mode="json",
                        options=llm_options
                    )

                    # 응답 파싱
                    logger.info(f"🐛 LLM Raw Output Type: {llm_response.output.type}")
                    outputs = self._parse_llm_response(llm_response.output, request.task)
                    # dict 타입일 때만 keys() 호출 (str일 경우 AttributeError 방지)
                    if outputs and isinstance(outputs[0].value, dict):
                        logger.info(f"🐛 Parsed Output Keys: {list(outputs[0].value.keys())}")
                    else:
                        logger.info(f"🐛 Parsed Output Type: {type(outputs[0].value).__name__ if outputs else 'None'}")

                    # Validation Pipeline
                    # chat/brand_message task는 자유 형식 응답이므로 validation 건너뛰기
                    skip_validation = request.task in ['chat', 'free_chat', 'general_chat', 'brand_message']

                    if skip_validation:
                        logger.info(f"⏭️ Skipping validation for task: {request.task}")
                        validation_result = type('ValidationResult', (), {
                            'passed': True,
                            'overall_score': 10.0,
                            'stage_results': [],
                            'errors': [],
                            'warnings': []
                        })()
                    else:
                        validation_result = validator.validate(
                            output=outputs[0].value,
                            task=request.task,
                            input_data=request.payload
                        )

                    if not validation_result.passed:
                        logger.warning(
                            f"Validation failed (attempt {attempt + 1}/{max_retries}): "
                            f"{validation_result.errors} | Score: {validation_result.overall_score:.1f}/10"
                        )

                        # 마지막 시도가 아니면 재시도
                        if attempt < max_retries - 1:
                            last_error = AgentError(
                                message=f"Output validation failed",
                                agent=self.name,
                                details={
                                    "validation_errors": validation_result.errors,
                                    "validation_score": validation_result.overall_score,
                                    "output": outputs[0].value,
                                    "attempt": attempt + 1
                                }
                            )
                            continue  # 재시도
                        else:
                            # 마지막 시도도 실패
                            raise AgentError(
                                message=f"Output validation failed after {max_retries} attempts",
                                agent=self.name,
                                details={
                                    "validation_errors": validation_result.errors,
                                    "validation_score": validation_result.overall_score,
                                    "output": outputs[0].value,
                                    "attempts": max_retries
                                }
                            )

                    # Validation 성공!
                    logger.info(
                        f"✅ Validation passed (attempt {attempt + 1}/{max_retries}): "
                        f"Score {validation_result.overall_score:.1f}/10"
                    )

                    # 구조화된 품질 로그 (모니터링용)
                    logger.info(
                        "quality_metrics",
                        extra={
                            "agent": self.name,
                            "task": request.task,
                            "overall_score": round(validation_result.overall_score, 2),
                            "field_scores": {
                                stage.stage: round(stage.score, 2)
                                for stage in validation_result.stage_results
                            },
                            "validation_passed": validation_result.passed,
                            "validation_errors": validation_result.errors,
                            "validation_warnings": validation_result.warnings,
                            "attempt": attempt + 1,
                            "max_retries": max_retries,
                            "temperature": current_temp
                        }
                    )

                    break  # 성공 시 루프 탈출

                except AgentError:
                    # Validation 에러는 재시도
                    if attempt == max_retries - 1:
                        raise  # 마지막 시도는 에러 전파
                    continue

                except Exception as e:
                    # 다른 예외는 즉시 실패
                    logger.error(f"Unexpected error during generation: {e}")
                    raise

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
            "campaign_strategy": {
                "instruction": (
                    "마케팅 캠페인 전략을 체계적으로 수립하세요. "
                    "타겟 인사이트, 창의적인 빅 아이디어, 실행 가능한 전략 기둥, "
                    "채널별 전술, 마케팅 퍼널 구조, 리스크 대응 방안을 포함하세요. "
                    "모든 전략은 측정 가능한 성공 지표(KPI)와 연결되어야 합니다.\n\n"
                    "중요: target_insights, risk_factors, success_metrics는 반드시 문자열(string) 배열이어야 합니다. "
                    "객체(object) 배열이 아닙니다!\n"
                    "예시 (올바름): \"target_insights\": [\"인사이트1\", \"인사이트2\", \"인사이트3\"]\n"
                    "예시 (틀림): \"target_insights\": [{\"insight\": \"...\"}]\n\n"
                    "success_metrics는 각 항목이 10-100자 사이여야 합니다. 너무 길면 안됩니다."
                ),
                "structure": {
                    "core_message": "캠페인 핵심 메시지 (20-100자, 임팩트 있고 명확하게)",
                    "positioning": "브랜드/제품 포지셔닝 (20-150자, 차별점 강조)",
                    "target_insights": ["인사이트1 (20-150자 문자열)", "인사이트2", "인사이트3"],
                    "big_idea": "캠페인 빅 아이디어 (15-100자, 창의적이고 기억에 남는)",
                    "strategic_pillars": [
                        {
                            "title": "전략 기둥 제목 (5-50자)",
                            "description": "전략 설명 (20-200자)",
                            "key_actions": ["실행 방안 1 (5-100자)", "실행 방안 2", "..."]
                        }
                    ],
                    "channel_strategy": [
                        {
                            "channel": "채널명 (예: 인스타그램, 유튜브)",
                            "objective": "채널 목표 (10-200자)",
                            "content_types": ["콘텐츠 유형 1", "..."],
                            "kpi": "핵심 성과 지표 (10-300자, 구체적 수치)"
                        }
                    ],
                    "funnel_structure": {
                        "awareness": ["인지 단계 전술 1", "..."],
                        "consideration": ["고려 단계 전술 1", "..."],
                        "conversion": ["전환 단계 전술 1", "..."],
                        "retention": ["유지 단계 전술 1", "..."]
                    },
                    "risk_factors": ["리스크1 및 대응방안 (20-200자 문자열)", "리스크2 및 대응방안"],
                    "success_metrics": ["런칭 첫 달 매출 5000만원 (10-100자)", "인스타그램 도달률 50만+", "재구매율 25%"]
                }
            },
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
            },
            # Chat task: 자유 형식 대화
            "chat": {
                "instruction": (
                    "사용자의 질문에 친절하고 도움이 되게 응답하세요. "
                    "마케팅, 브랜딩, 콘텐츠 전략에 대한 전문적인 조언을 제공하세요. "
                    "응답은 간결하고 실용적이어야 합니다."
                ),
                "structure": {
                    "response": "사용자 질문에 대한 응답"
                }
            },
            # Brand message task: 브랜드 메시지/톤앤매너 관련 자유 형식 대화
            "brand_message": {
                "instruction": (
                    "브랜드 메시징과 톤앤매너에 대한 전문적인 조언을 제공하세요. "
                    "브랜드 DNA, 브랜드 보이스, 커뮤니케이션 스타일에 대해 설명하세요. "
                    "사용자가 제공한 브랜드 컨텍스트를 바탕으로 응답하세요."
                ),
                "structure": {
                    "response": "브랜드 메시지에 대한 조언"
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
                "campaign_strategy": "campaign_strategy",  # 2025-11-23 추가
                "brand_kit": "brand_strategy",
                "campaign": "campaign_plan",
                "target_analysis": "target_insights",
                "positioning": "positioning_strategy",
                "content_strategy": "content_plan",
                "chat": "chat_response",  # Chat task 지원
                "brand_message": "chat_response"  # Brand message task 지원
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


    # ========================================================================
    # Plan-Act-Reflect 패턴 (v3.0)
    # ========================================================================

    async def execute_v3(self, request: AgentRequest) -> AgentResponse:
        """
        Strategist Agent v3.0 - Plan-Act-Reflect 패턴 적용

        기존 execute()를 래핑하여 목표 기반 자기 검수를 수행합니다.

        Args:
            request: Agent 요청 (goal 필드 권장)

        Returns:
            AgentResponse: 품질 검수를 통과한 전략 문서
        """
        logger.info(f"[{self.name}] execute_v3 called (Plan-Act-Reflect)")

        # Goal이 없으면 기본 Goal 생성
        if not request.goal:
            request.goal = AgentGoal(
                primary_objective=f"{request.task} 작업에 최적화된 마케팅 전략 수립",
                success_criteria=[
                    "실행 가능한 전략 제시",
                    "측정 가능한 KPI 포함",
                    "타겟 인사이트 반영"
                ],
                quality_threshold=7.0,
                max_iterations=2
            )

        # Plan-Act-Reflect 실행
        return await self.execute_with_reflection(request)

    async def _plan(self, request: AgentRequest) -> ExecutionPlan:
        """
        Strategist 전용 Plan 단계

        Args:
            request: Agent 요청

        Returns:
            ExecutionPlan
        """
        plan_id = f"strategist_plan_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"
        goal = request.goal

        # 작업별 접근 방식 결정
        approach_map = {
            "campaign_strategy": "시장 분석 → 타겟 정의 → 전략 기둥 수립 → 채널 전략 → KPI 설정",
            "brand_kit": "브랜드 DNA 분석 → 포지셔닝 정의 → 톤앤매너 설정",
            "target_analysis": "인구통계 분석 → 심리그래픽 분석 → 페르소나 구체화",
            "positioning": "시장 분석 → 경쟁사 분석 → 차별화 전략 수립",
            "content_strategy": "콘텐츠 기둥 정의 → 채널별 전략 → 퍼블리싱 계획"
        }

        approach = approach_map.get(request.task, "표준 전략 수립 프로세스")

        steps = [
            {"step": 1, "action": "입력 분석 및 시장 컨텍스트 파악", "status": "pending"},
            {"step": 2, "action": "전략 프레임워크 선택", "status": "pending"},
            {"step": 3, "action": "LLM 전략 생성", "status": "pending"},
            {"step": 4, "action": "품질 검증 (Validation)", "status": "pending"},
            {"step": 5, "action": "자기 검수 (Self-Review)", "status": "pending"}
        ]

        risks = ["전략의 실행 가능성 부족", "KPI 측정 방법 불명확"]
        if goal and goal.constraints:
            risks.append(f"제약 조건 위반 가능성: {len(goal.constraints)}개 조건")

        return ExecutionPlan(
            plan_id=plan_id,
            steps=steps,
            approach=approach,
            estimated_quality=7.5,
            risks=risks
        )


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
