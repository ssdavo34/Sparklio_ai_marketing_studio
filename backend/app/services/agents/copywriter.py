"""
Copywriter Agent

텍스트 콘텐츠 생성 전문 Agent

작성일: 2025-11-16
수정일: 2025-11-29 - execute_v3() 메서드 추가 (Plan-Act-Reflect 패턴)
작성자: B팀 (Backend)
문서: ARCH-003, SPEC-002, B_TEAM_AGENT_UPGRADE_PLAN.md
"""

import logging
from typing import Dict, Any, Optional
from datetime import datetime

from .base import (
    AgentBase, AgentRequest, AgentResponse, AgentError,
    AgentGoal, SelfReview, ExecutionPlan
)
from app.services.llm import LLMProviderOutput
from app.services.validation import OutputValidator

logger = logging.getLogger(__name__)


class CopywriterAgent(AgentBase):
    """
    Copywriter Agent

    제품 설명, SNS 콘텐츠, 브랜드 메시지 등 텍스트 콘텐츠 생성

    주요 작업:
    1. product_detail: 제품 상세 설명 작성 (단일 카드)
    2. product_detail_full: 상품 상세페이지 전체 생성 (Hero + Problem/Solution + Specs + FAQ)
    3. sns: SNS 콘텐츠 작성
    4. brand_message: 브랜드 메시지 작성
    5. headline: 헤드라인/제목 생성
    6. ad_copy: 광고 카피 작성

    사용 예시:
        agent = CopywriterAgent()
        response = await agent.execute(AgentRequest(
            task="product_detail",
            payload={
                "product_name": "무선 이어폰",
                "features": ["노이즈캔슬링", "24시간 배터리"],
                "target_audience": "2030 직장인"
            },
            options={"tone": "professional", "length": "medium"}
        ))
    """

    @property
    def name(self) -> str:
        return "copywriter"

    async def execute(self, request: AgentRequest) -> AgentResponse:
        """
        Copywriter Agent 실행

        Args:
            request: Agent 요청

        Returns:
            AgentResponse: 생성된 카피 (JSON 형식)

        Raises:
            AgentError: 실행 실패 시
        """
        start_time = datetime.utcnow()

        try:
            # 1. 요청 검증
            self._validate_request(request)

            logger.info(f"Copywriter Agent executing: task={request.task}")

            # 2. LLM 프롬프트 구성
            enhanced_payload = self._enhance_payload(request)

            # 3. Retry Logic (A팀 Roadmap 2025-11-23)
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
                    logger.info(f"🐛 LLM Raw Output: {llm_response.output.value}")
                    outputs = self._parse_llm_response(llm_response.output, request.task)
                    logger.info(f"🐛 Parsed Output: {outputs[0].value}")

                    # Validation Pipeline
                    # chat task는 자유 형식 응답이므로 validation 건너뛰기
                    skip_validation = request.task in ['chat', 'free_chat', 'general_chat']

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
                "total_tokens": llm_response.usage.get("total_tokens", 0),  # GeneratorService가 사용
                "elapsed_seconds": round(elapsed, 2)
            }

            # 6. 메타데이터
            meta = {
                "llm_provider": llm_response.provider,
                "llm_model": llm_response.model,
                "task": request.task,
                "tone": request.options.get("tone", "default") if request.options else "default"
            }

            logger.info(
                f"Copywriter Agent success: task={request.task}, "
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
            logger.error(f"Copywriter Agent failed: {str(e)}", exc_info=True)
            raise AgentError(
                message=f"Copywriter execution failed: {str(e)}",
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
            "product_detail": {
                "instruction": "제품의 핵심 가치와 차별점을 강조하여 매력적인 설명을 작성하세요.",
                "structure": {
                    "headline": "임팩트 있는 헤드라인 (10자 이내)",
                    "body": "본문 설명 (100-200자)",
                    "features": "주요 특징 3개 (각 30자 이내)",
                    "cta": "행동 유도 문구 (15자 이내)"
                }
            },
            "sns": {
                "instruction": "SNS에 최적화된 짧고 임팩트 있는 콘텐츠를 작성하세요.",
                "structure": {
                    "post": "메인 포스팅 내용 (80-120자)",
                    "hashtags": "해시태그 5-10개",
                    "cta": "행동 유도 문구"
                }
            },
            "brand_message": {
                "instruction": "브랜드의 가치와 비전을 담은 메시지를 작성하세요.",
                "structure": {
                    "tagline": "브랜드 태그라인 (10자 이내)",
                    "message": "브랜드 메시지 (50-100자)",
                    "values": "핵심 가치 3개"
                }
            },
            "headline": {
                "instruction": "주목도 높은 헤드라인을 3가지 버전으로 작성하세요.",
                "structure": {
                    "version_a": "임팩트형 헤드라인",
                    "version_b": "혜택 강조형 헤드라인",
                    "version_c": "질문형 헤드라인"
                }
            },
            "ad_copy": {
                "instruction": "광고 효과를 극대화할 수 있는 카피를 작성하세요.",
                "structure": {
                    "headline": "광고 헤드라인",
                    "body": "광고 본문 (50-100자)",
                    "cta": "행동 유도 문구"
                }
            },
            # Chat task: 자유 형식 대화
            "chat": {
                "instruction": (
                    "사용자의 질문에 친절하고 도움이 되게 응답하세요. "
                    "마케팅, 카피라이팅, 브랜딩에 대한 전문적인 조언을 제공하세요. "
                    "응답은 간결하고 실용적이어야 합니다."
                ),
                "structure": {
                    "response": "사용자 질문에 대한 응답"
                }
            },
            "product_detail_full": {
                "instruction": (
                    "상품 상세페이지 전체 콘텐츠를 생성하세요. "
                    "4개 섹션으로 구성됩니다: Hero, Problem/Solution, Specs, FAQ\\n\\n"
                    "**1. Hero 섹션:**\\n"
                    "- headline: 임팩트 있는 메인 헤드라인 (10-20자)\\n"
                    "- subheadline: 핵심 가치를 담은 서브헤드라인 (30-50자)\\n"
                    "- cta: 행동 유도 문구 (10자 이내)\\n\\n"
                    "**2. Problem/Solution 섹션:**\\n"
                    "- section_title: 섹션 제목 (예: '이런 고민 있으신가요?')\\n"
                    "- problems: 고객이 겪는 문제점 2-3개 (각 30-50자)\\n"
                    "- solution_title: 솔루션 제목 (예: 'OO가 해결해드립니다')\\n"
                    "- solutions: 제품이 제공하는 솔루션 2-5개 (key_features 기반, 각 40-70자)\\n\\n"
                    "**3. Specs 섹션:**\\n"
                    "- section_title: 섹션 제목 (예: '제품 사양')\\n"
                    "- specs: 제품 스펙 딕셔너리 (Key-Value 형태, 예: {'크기': '10cm x 5cm', '무게': '200g'})\\n\\n"
                    "**4. FAQ 섹션:**\\n"
                    "- section_title: 섹션 제목 (예: '자주 묻는 질문')\\n"
                    "- faqs: 질문-답변 리스트 3-8개 (question: 질문, answer: 답변)\\n\\n"
                    "**중요 지침:**\\n"
                    "- 제공된 product_name, key_features, target_audience를 최대한 활용\\n"
                    "- customer_pain_points가 제공되면 그대로 사용, 없으면 target_audience 기반 추론\\n"
                    "- specifications가 제공되면 사용, 없으면 일반적인 스펙 생성\\n"
                    "- faqs가 제공되면 사용, 없으면 제품 특성 기반 FAQ 생성\\n"
                    "- 브랜드 컨텍스트(brand_context)가 있으면 톤앤매너 반영\\n"
                    "- language에 맞는 언어로 생성 (ko/en)"
                ),
                "structure": {
                    "hero": {
                        "headline": "메인 헤드라인 (10-20자)",
                        "subheadline": "서브 헤드라인 (30-50자)",
                        "cta": "행동 유도 문구 (10자 이내)",
                        "image_url": "이미지 URL (옵션)"
                    },
                    "problem_solution": {
                        "section_title": "섹션 제목",
                        "problems": ["문제점1", "문제점2", "문제점3"],
                        "solution_title": "솔루션 제목",
                        "solutions": ["솔루션1", "솔루션2", "솔루션3", "솔루션4", "솔루션5"]
                    },
                    "specs": {
                        "section_title": "제품 사양",
                        "specs": {
                            "크기": "값",
                            "무게": "값",
                            "재질": "값"
                        }
                    },
                    "faq": {
                        "section_title": "자주 묻는 질문",
                        "faqs": [
                            {"question": "질문1", "answer": "답변1"},
                            {"question": "질문2", "answer": "답변2"},
                            {"question": "질문3", "answer": "답변3"}
                        ]
                    }
                }
            }
        }

        # 작업별 지시사항 추가
        if request.task in task_instructions:
            enhanced["_instructions"] = task_instructions[request.task]["instruction"]
            enhanced["_output_structure"] = task_instructions[request.task]["structure"]

        # 옵션 추가 (tone, length 등)
        if request.options:
            if "tone" in request.options:
                tone_guide = {
                    "professional": "전문적이고 신뢰감 있는 톤",
                    "friendly": "친근하고 따뜻한 톤",
                    "luxury": "프리미엄하고 세련된 톤",
                    "casual": "편안하고 자연스러운 톤",
                    "energetic": "활기차고 역동적인 톤"
                }
                enhanced["_tone_guide"] = tone_guide.get(
                    request.options["tone"],
                    "기본 톤"
                )

            if "length" in request.options:
                enhanced["_length"] = request.options["length"]

        return enhanced

    def _normalize_product_detail(self, content: dict) -> dict:
        """
        product_detail 응답의 필드명을 정규화

        LLM이 다른 필드명을 사용할 경우를 대비하여
        표준 필드명으로 변환하고 누락된 필드는 기본값으로 채움

        Args:
            content: LLM 응답 JSON

        Returns:
            정규화된 dict (headline, subheadline, body, bullets, cta)
        """
        normalized = {}

        # headline (title, name 등으로 올 수 있음)
        normalized["headline"] = (
            content.get("headline") or
            content.get("title") or
            content.get("name") or
            "제품명"
        )

        # subheadline (subtitle, tagline 등으로 올 수 있음)
        # ✅ B팀 수정 (2025-11-23): "제품 설명" Fallback 제거
        # ✅ A팀 수정 (2025-11-23): body에서 첫 30자 Fallback
        normalized["subheadline"] = (
            content.get("subheadline") or
            content.get("subtitle") or
            content.get("tagline") or
            (content.get("body") or content.get("description") or "")[:30] or
            ""  # 빈 문자열로 변경 (Validation에서 잡힘)
        )

        # body (description, content 등으로 올 수 있음)
        normalized["body"] = (
            content.get("body") or
            content.get("description") or
            content.get("content") or
            ""
        )

        # bullets (features, highlights, benefits 등으로 올 수 있음)
        bullets = (
            content.get("bullets") or
            content.get("features") or
            content.get("highlights") or
            content.get("benefits") or
            []
        )
        # 리스트가 아니면 빈 리스트로
        normalized["bullets"] = bullets if isinstance(bullets, list) else []

        # cta (call_to_action, action 등으로 올 수 있음)
        normalized["cta"] = (
            content.get("cta") or
            content.get("call_to_action") or
            content.get("action") or
            "자세히 보기"
        )

        return normalized

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
            if task == "product_detail":
                # 필드명 정규화 (LLM이 다른 필드명을 사용할 경우 대비)
                normalized_content = self._normalize_product_detail(content)
                outputs.append(self._create_output(
                    output_type="json",
                    name="product_copy",
                    value=normalized_content,
                    meta={"format": "structured_copy"}
                ))
            elif task == "sns":
                outputs.append(self._create_output(
                    output_type="json",
                    name="sns_content",
                    value=content,
                    meta={"format": "social_media"}
                ))
            elif task == "brand_message":
                outputs.append(self._create_output(
                    output_type="json",
                    name="brand_message",
                    value=content,
                    meta={"format": "brand_identity"}
                ))
            elif task == "headline":
                outputs.append(self._create_output(
                    output_type="json",
                    name="headlines",
                    value=content,
                    meta={"format": "variations"}
                ))
            elif task == "ad_copy":
                outputs.append(self._create_output(
                    output_type="json",
                    name="ad_copy",
                    value=content,
                    meta={"format": "advertising"}
                ))
            elif task == "chat":
                # Chat 응답 (자유 형식)
                outputs.append(self._create_output(
                    output_type="json",
                    name="chat_response",
                    value=content,
                    meta={"format": "chat"}
                ))
            elif task == "product_detail_full":
                # Product Detail Full (Canvas JSON 변환 전 원본)
                outputs.append(self._create_output(
                    output_type="json",
                    name="product_detail_full",
                    value=content,
                    meta={"format": "product_detail_full", "sections": ["hero", "problem_solution", "specs", "faq"]}
                ))
            else:
                # 기본 처리
                outputs.append(self._create_output(
                    output_type="json",
                    name="content",
                    value=content
                ))

        # 텍스트 응답 처리 (폴백)
        elif llm_output.type == "text":
            outputs.append(self._create_output(
                output_type="text",
                name="raw_text",
                value=llm_output.value
            ))

        return outputs


    # ========================================================================
    # Plan-Act-Reflect 패턴 (v3.0)
    # ========================================================================

    async def execute_v3(self, request: AgentRequest) -> AgentResponse:
        """
        Copywriter Agent v3.0 - Plan-Act-Reflect 패턴 적용

        기존 execute()를 래핑하여 목표 기반 자기 검수를 수행합니다.

        Args:
            request: Agent 요청 (goal 필드 권장)

        Returns:
            AgentResponse: 품질 검수를 통과한 카피

        Example:
            response = await agent.execute_v3(AgentRequest(
                task="product_detail",
                payload={"product_name": "무선 이어폰", ...},
                goal=AgentGoal(
                    primary_objective="제품의 핵심 USP를 효과적으로 전달하는 카피 작성",
                    success_criteria=["USP 포함", "CTA 포함", "타겟 언어 사용"],
                    constraints=["최상급 표현 금지", "경쟁사 언급 금지"],
                    quality_threshold=7.0
                ),
                context={"guardrails": {"avoid_claims": ["최고", "1위"]}}
            ))
        """
        logger.info(f"[{self.name}] execute_v3 called (Plan-Act-Reflect)")

        # Goal이 없으면 기본 Goal 생성
        if not request.goal:
            request.goal = AgentGoal(
                primary_objective=f"{request.task} 작업에 최적화된 카피 생성",
                success_criteria=[
                    "핵심 메시지 전달",
                    "톤앤매너 일관성",
                    "문법/맞춤법 정확성"
                ],
                quality_threshold=7.0,
                max_iterations=2
            )

        # Plan-Act-Reflect 실행 (base.py의 execute_with_reflection 사용)
        return await self.execute_with_reflection(request)

    async def _plan(self, request: AgentRequest) -> ExecutionPlan:
        """
        Copywriter 전용 Plan 단계

        Args:
            request: Agent 요청

        Returns:
            ExecutionPlan
        """
        plan_id = f"copywriter_plan_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"
        goal = request.goal

        # 작업별 접근 방식 결정
        approach_map = {
            "product_detail": "USP 분석 → 타겟 인사이트 추출 → 구조화된 카피 생성",
            "sns": "플랫폼 특성 분석 → 임팩트 문구 생성 → 해시태그 최적화",
            "ad_copy": "AIDA 모델 적용 → 헤드라인/바디/CTA 구성",
            "headline": "다양한 관점 (임팩트/혜택/질문) → 3개 버전 생성",
            "brand_message": "브랜드 가치 분석 → 핵심 메시지 도출"
        }

        approach = approach_map.get(request.task, "표준 카피 생성 프로세스")

        steps = [
            {"step": 1, "action": "입력 분석 및 컨텍스트 파악", "status": "pending"},
            {"step": 2, "action": "프롬프트 구성", "status": "pending"},
            {"step": 3, "action": "LLM 카피 생성", "status": "pending"},
            {"step": 4, "action": "품질 검증 (Validation)", "status": "pending"},
            {"step": 5, "action": "자기 검수 (Self-Review)", "status": "pending"}
        ]

        risks = []
        if goal and goal.constraints:
            risks.append(f"제약 조건 위반 가능성: {len(goal.constraints)}개 조건")

        context = request.context or {}
        if context.get("guardrails", {}).get("avoid_claims"):
            risks.append("Guardrails 위반 가능성 (금지 표현 체크 필요)")

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

def get_copywriter_agent(llm_gateway=None) -> CopywriterAgent:
    """
    Copywriter Agent 인스턴스 반환

    Args:
        llm_gateway: LLM Gateway (None이면 전역 인스턴스 사용)

    Returns:
        CopywriterAgent 인스턴스
    """
    return CopywriterAgent(llm_gateway=llm_gateway)
