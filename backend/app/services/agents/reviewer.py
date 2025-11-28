"""
ReviewerAgent Implementation (v3.0)

광고 카피 품질 검토 및 피드백 제공 Agent
Plan-Act-Reflect 패턴 적용 + ConceptV1.guardrails 검증 통합

작성일: 2025-11-23
수정일: 2025-11-28
작성자: B팀 (Backend)
참조: B_TEAM_NEXT_STEPS_2025-11-23.md, AGENTS_SPEC.md
"""

import json
import logging
from typing import Any, Dict, List, Optional

from app.services.agents.base import (
    AgentBase, AgentError, AgentRequest, AgentResponse, AgentOutput,
    AgentGoal, SelfReview, ExecutionPlan
)
from app.services.validation.output_validator import OutputValidator
from app.schemas.reviewer import AdCopyReviewInputV1, AdCopyReviewOutputV1

logger = logging.getLogger(__name__)


# =============================================================================
# Guardrails Schema (ConceptV1 호환)
# =============================================================================

class GuardrailsConfig:
    """ConceptV1.guardrails 설정 래퍼"""

    def __init__(self, guardrails: Optional[Dict[str, Any]] = None):
        self.raw = guardrails or {}
        self.avoid_claims: List[str] = self.raw.get("avoid_claims", [])
        self.must_include: List[str] = self.raw.get("must_include", [])
        self.forbidden_words: List[str] = self.raw.get("forbidden_words", [])
        self.legal_disclaimers: List[str] = self.raw.get("legal_disclaimers", [])
        self.regulatory_notes: str = self.raw.get("regulatory_notes", "")

    def is_empty(self) -> bool:
        """guardrails가 비어있는지 확인"""
        return not any([
            self.avoid_claims,
            self.must_include,
            self.forbidden_words,
            self.legal_disclaimers,
            self.regulatory_notes
        ])


class ReviewerAgent(AgentBase):
    """
    ReviewerAgent: 광고 카피 품질 검토 전문 Agent (v3.0)

    Role:
    - Copywriter/Strategist 출력을 입력받아 품질 검토
    - 다차원 점수 평가 (overall, tone_match, clarity, persuasiveness, brand_alignment)
    - 정성 평가 (strengths, weaknesses, improvement_suggestions)
    - 리스크 플래그 및 승인 판정
    - **NEW** ConceptV1.guardrails 기반 자동 검증

    Features:
    - Plan-Act-Reflect 패턴 적용
    - ConceptV1.guardrails 통합 (avoid_claims, must_include, forbidden_words)
    - Retry Logic (최대 3회, temperature 0.2 → 0.3 → 0.4)
    - 4-Stage Validation Pipeline 통합
    - Structured Quality Logging
    - 엄격 모드 지원 (strict_mode: 90% 이상 필요)

    v3.0 Changes:
    - guardrails 필드 지원: concept.guardrails 전달 시 자동 검증
    - _validate_guardrails(): avoid_claims, must_include 위반 검출
    - _plan(): 검토 전략 수립
    - _reflect(): 검토 결과 자기 평가
    - execute_v3(): Plan-Act-Reflect 루프 실행
    """

    def __init__(self, llm_gateway=None):
        super().__init__(llm_gateway=llm_gateway)
        self.task_instructions = self._build_task_instructions()
        self.guardrails: Optional[GuardrailsConfig] = None

    @property
    def name(self) -> str:
        return "reviewer"

    def _build_task_instructions(self) -> Dict[str, Any]:
        """
        Task별 Instruction 정의

        현재 지원: ad_copy_quality_check
        """
        return {
            "ad_copy_quality_check": {
                "instruction": (
                    "광고 카피의 품질을 전문 마케터 관점에서 체계적으로 검토하세요. "
                    "톤앤매너 일치도, 명확성, 설득력, 브랜드 정렬도를 0-10점으로 평가하고, "
                    "강점, 약점, 구체적인 개선 제안을 제시하세요. "
                    "\n\n"
                    "**중요: 과대광고 및 규제 리스크 검토**\n"
                    "- 명백한 과장 표현(예: '100% 보장', '완전히 제거', '부작용 전무', '영구 효과', '10년 젊어지는' 등)이 포함된 경우, "
                    "overall_score는 반드시 4.0 이하로 평가하고, approval_status는 'rejected'로 판정하세요.\n"
                    "- 의학적/과학적 효능을 검증 없이 주장하거나, 절대적 표현('모든', '전혀 없음', '영구적' 등)을 사용하는 경우, "
                    "규제 리스크로 간주하고 risk_flags에 구체적으로 기록하세요.\n"
                    "- risk_flags에 규제/과대광고 관련 항목이 하나라도 있는 경우, overall_score는 최대 6.0을 초과할 수 없습니다.\n"
                    "- 브랜드 톤앤매너와 완전히 불일치하는 경우(예: 럭셔리 브랜드에 저가 이미지 표현), "
                    "tone_match_score와 brand_alignment_score를 3.0 이하로 평가하고, approval_status는 'rejected'로 판정하며, revision_priority는 'critical'로 설정하세요.\n"
                    "\n"
                    "규제 리스크, 과장 광고 우려, 톤 오류 등을 리스크 플래그로 표시하고, "
                    "최종 승인 상태(approved/needs_revision/rejected)를 판정하세요."
                ),
                "structure": {
                    "overall_score": "전체 품질 점수 (0-10, 소수점 1자리)",
                    "tone_match_score": "요청 톤과의 일치도 (0-10, 소수점 1자리)",
                    "clarity_score": "명확성 점수 (0-10, 소수점 1자리)",
                    "persuasiveness_score": "설득력 점수 (0-10, 소수점 1자리)",
                    "brand_alignment_score": "브랜드 정렬도 (0-10, 소수점 1자리)",
                    "strengths": "강점 리스트 (1-5개, 각 10-150자, 구체적으로)",
                    "weaknesses": "약점 리스트 (1-5개, 각 10-150자, 구체적으로)",
                    "improvement_suggestions": "개선 제안 (1-5개, 각 10-200자, 실행 가능하게)",
                    "risk_flags": "리스크 플래그 (0-10개, 각 10-100자, 규제/과장/톤 오류 등)",
                    "approval_status": "승인 상태 (approved/needs_revision/rejected)",
                    "revision_priority": "수정 우선순위 (low/medium/high/critical)",
                    "approval_reason": "승인/거부 사유 (10-200자, optional)"
                },
                "example_scenario": {
                    "original_copy": {
                        "headline": "소음은 지우고, 음악만 남기다",
                        "subheadline": "24시간 배터리, ANC 노이즈캔슬링",
                        "body": "프리미엄 무선 이어폰의 새로운 기준",
                        "bullets": ["ANC 노이즈캔슬링", "24시간 배터리", "IPX7 방수"],
                        "cta": "지금 체험하기"
                    },
                    "campaign_context": {
                        "brand_name": "SoundPro",
                        "target_audience": "2030 직장인",
                        "tone": "professional"
                    },
                    "output": {
                        "overall_score": 8.5,
                        "tone_match_score": 9.0,
                        "clarity_score": 8.0,
                        "persuasiveness_score": 8.5,
                        "brand_alignment_score": 9.0,
                        "strengths": [
                            "Headline이 임팩트 있고 제품 핵심 가치를 잘 전달함",
                            "CTA가 명확하고 행동 유도가 강함",
                            "Bullets가 주요 특징을 간결하게 정리함"
                        ],
                        "weaknesses": [
                            "Subheadline이 스펙 나열형으로 차별화 부족",
                            "Body가 너무 짧아 제품 스토리 전달 미흡"
                        ],
                        "improvement_suggestions": [
                            "Subheadline을 '하루 종일 끊김 없는 몰입, 당신의 음악 세계'처럼 감성적으로 변경",
                            "Body에 사용자 경험 스토리 추가 (예: '출퇴근길이 나만의 콘서트홀로')",
                            "Bullets 중 하나를 차별점으로 교체 (예: '프리미엄 사운드 튜닝')"
                        ],
                        "risk_flags": [
                            "Subheadline '24시간 배터리'는 실제 사용 시간과 다를 수 있어 과대광고 우려",
                            "IPX7 방수 등급 표기 시 사용 조건 명시 필요 (방송통신심의위원회)"
                        ],
                        "approval_status": "needs_revision",
                        "revision_priority": "medium",
                        "approval_reason": "전반적인 품질이 우수하나 Subheadline 개선 및 리스크 완화 후 승인 권장"
                    }
                },
                "guidelines": [
                    "점수는 객관적 근거를 바탕으로 평가하세요",
                    "강점/약점은 구체적인 요소를 지적하세요 (예: 'Headline이 좋다' → 'Headline이 임팩트 있고 핵심 가치를 잘 전달')",
                    "개선 제안은 실행 가능한 대안을 제시하세요 (예: '더 좋게' → '~처럼 변경')",
                    "리스크 플래그는 규제, 과장 광고, 톤 오류, 브랜드 이미지 훼손 등을 포함하세요",
                    "\n**approval_status 판정 규칙 (점수 기준)**:",
                    "- overall_score >= 9.0: 'approved' (바로 게시 가능한 완성도 높은 카피)",
                    "- 7.0 <= overall_score < 9.0: 'needs_revision' (방향성은 맞지만 반드시 수정 필요)",
                    "- 4.0 <= overall_score < 7.0: 'needs_revision' (high/critical priority - 상당한 수정 필요)",
                    "- overall_score < 4.0: 'rejected' (방향성 오류 또는 심각한 리스크로 사용 불가)",
                    "\n**approval_status 판정 규칙 (규제 리스크 예외)**:",
                    "- risk_flags에 규제/과대광고 항목이 있는 경우: 점수와 무관하게 'needs_revision' (revision_priority: critical) 또는 'rejected'",
                    "- 심각한 규제 위반(예: 허위·과장 광고, 의료법 위반 가능성): 반드시 'rejected' + revision_priority: critical",
                    "\n**strict_mode 규칙**:",
                    "- strict_mode가 true인 경우: 9.0 이상만 'approved' 가능",
                    "\n**기타**:",
                    "각 항목의 길이 제약을 엄수하세요 (strengths/weaknesses: 10-150자, improvement_suggestions: 10-200자)"
                ]
            }
        }

    async def execute(self, request: AgentRequest) -> AgentResponse:
        """
        ReviewerAgent 실행 로직 (Retry + Validation 통합)

        Flow:
        1. Input validation (Pydantic)
        2. LLM 호출 (JSON Mode, 최대 3회 재시도)
        3. Output validation (4-stage pipeline)
        4. Quality logging
        5. AgentResponse 반환
        """
        logger.info(f"ReviewerAgent executing task: {request.task}")

        # Input validation
        if request.task == "ad_copy_quality_check":
            try:
                # 입력값 검증 (side effect로 validation)
                AdCopyReviewInputV1(**request.payload)
            except Exception as e:
                raise AgentError(
                    f"Input validation failed: {str(e)}",
                    agent=self.name
                )
        else:
            raise AgentError(
                f"Unknown task: {request.task}",
                agent=self.name
            )

        # Task instruction 가져오기
        task_config = self.task_instructions.get(request.task)
        if not task_config:
            raise AgentError(f"No instruction found for task: {request.task}", agent=self.name)

        # Payload 강화 (instruction + structure)
        enhanced_payload = {
            **request.payload,
            "_instruction": task_config["instruction"],
            "_structure": task_config["structure"],
            "_example": task_config.get("example_scenario"),
            "_guidelines": task_config.get("guidelines")
        }

        # Retry Logic with progressive temperature
        max_retries = 3
        base_temperature = 0.2  # Reviewer는 일관성이 더 중요 (0.2 → 0.3 → 0.4)
        validator = OutputValidator()

        for attempt in range(max_retries):
            try:
                current_temp = base_temperature + (attempt * 0.1)

                logger.info(
                    f"ReviewerAgent attempt {attempt + 1}/{max_retries} "
                    f"(temperature={current_temp})"
                )

                # LLM 호출
                llm_options = {
                    **(request.options or {}),
                    "temperature": current_temp
                }

                llm_response = await self.llm_gateway.generate(
                    role=self.name,
                    task=request.task,
                    payload=enhanced_payload,
                    mode="json",
                    options=llm_options
                )

                # Parse output
                output_data = llm_response.output.value
                if isinstance(output_data, str):
                    output_data = json.loads(output_data)

                # Pydantic validation
                if request.task == "ad_copy_quality_check":
                    validated_output = AdCopyReviewOutputV1(**output_data)
                    output_dict = validated_output.model_dump()
                else:
                    raise AgentError(f"Unknown task for validation: {request.task}", agent=self.name)

                # AgentOutput 생성
                outputs = [
                    AgentOutput(
                        type="json",
                        name=request.task,
                        value=output_dict,
                        meta={
                            "format": "review_analysis",
                            "task": request.task
                        }
                    )
                ]

                # 4-Stage Validation Pipeline
                validation_result = validator.validate(
                    output=outputs[0].value,
                    task=request.task,
                    input_data=request.payload
                )

                # Validation 실패 시 재시도
                if not validation_result.passed:
                    if attempt < max_retries - 1:
                        logger.warning(
                            f"Validation failed (attempt {attempt + 1}), retrying... "
                            f"Errors: {validation_result.errors}"
                        )
                        continue
                    else:
                        # 최종 실패
                        raise AgentError(
                            f"Validation failed after {max_retries} attempts: "
                            f"{', '.join(validation_result.errors)}",
                            agent=self.name
                        )

                # Structured quality logging
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
                        "temperature": current_temp,
                        "review_overall_score": output_dict.get("overall_score", 0.0),
                        "approval_status": output_dict.get("approval_status", "unknown")
                    }
                )

                # 성공 응답 생성
                return AgentResponse(
                    agent=self.name,
                    task=request.task,
                    outputs=outputs,
                    usage={
                        "llm_tokens": llm_response.usage.get("total_tokens", 0) if llm_response.usage else 0,
                        "total_tokens": llm_response.usage.get("total_tokens", 0) if llm_response.usage else 0,
                        "elapsed_seconds": llm_response.meta.get("elapsed_seconds", 0.0) if llm_response.meta else 0.0
                    },
                    meta={
                        "llm_provider": llm_response.provider,
                        "llm_model": llm_response.model,
                        "task": request.task,
                        "validation_score": round(validation_result.overall_score, 2),
                        "attempt": attempt + 1
                    }
                )

            except AgentError:
                raise
            except Exception as e:
                if attempt < max_retries - 1:
                    logger.warning(
                        f"ReviewerAgent execution failed (attempt {attempt + 1}), "
                        f"retrying... Error: {str(e)}"
                    )
                    continue
                else:
                    raise AgentError(f"ReviewerAgent failed after {max_retries} attempts: {str(e)}", agent=self.name)

        # 여기까지 도달하면 안 됨 (모든 retry 실패)
        raise AgentError(f"ReviewerAgent failed after {max_retries} attempts", agent=self.name)

    # =========================================================================
    # Plan-Act-Reflect Pattern Methods (v3.0)
    # =========================================================================

    async def _plan(self, request: AgentRequest) -> ExecutionPlan:
        """
        리뷰 전략 수립

        guardrails 유무에 따라 검토 포인트 결정
        """
        payload = request.payload or {}
        concept = payload.get("concept", {})
        guardrails_data = payload.get("guardrails") or concept.get("guardrails", {})

        # guardrails 설정
        self.guardrails = GuardrailsConfig(guardrails_data)

        # 검토 포인트 계획
        review_points = [
            "톤앤매너 일치도 평가",
            "명확성 및 설득력 분석",
            "브랜드 정렬도 검토",
            "리스크 플래그 식별"
        ]

        # guardrails가 있으면 추가 검토 포인트
        if not self.guardrails.is_empty():
            if self.guardrails.avoid_claims:
                review_points.append(f"avoid_claims 검증: {len(self.guardrails.avoid_claims)}개 금지 표현")
            if self.guardrails.must_include:
                review_points.append(f"must_include 검증: {len(self.guardrails.must_include)}개 필수 포함")
            if self.guardrails.forbidden_words:
                review_points.append(f"forbidden_words 검증: {len(self.guardrails.forbidden_words)}개 금지어")

        return ExecutionPlan(
            steps=review_points,
            estimated_llm_calls=1,
            tools_needed=["llm_gateway"],
            reasoning=f"카피 리뷰 수행. guardrails 적용: {not self.guardrails.is_empty()}"
        )

    async def _reflect(self, request: AgentRequest, response: AgentResponse) -> SelfReview:
        """
        리뷰 결과 자기 평가

        - guardrails 위반 여부 재검증
        - 리뷰 일관성 확인
        """
        output = response.outputs[0].value if response.outputs else {}

        issues = []
        suggestions = []
        guardrails_violations = []

        # 1. 기본 품질 검증
        overall_score = output.get("overall_score", 0)
        approval_status = output.get("approval_status", "unknown")
        risk_flags = output.get("risk_flags", [])

        # 2. guardrails 위반 검증 (카피 텍스트에서)
        copy_data = request.payload.get("original_copy", {})
        all_copy_text = self._extract_all_text(copy_data)

        if self.guardrails and not self.guardrails.is_empty():
            violations = self._validate_guardrails(all_copy_text)
            guardrails_violations.extend(violations)

            if violations:
                issues.append(f"Guardrails 위반 {len(violations)}건 발견")
                # 위반이 있는데 risk_flags에 반영 안 됐으면 문제
                if not any("guardrail" in rf.lower() for rf in risk_flags):
                    suggestions.append("risk_flags에 guardrails 위반 사항 명시 필요")

        # 3. 점수-판정 일관성 검증
        if overall_score >= 7.0 and approval_status == "rejected":
            issues.append(f"점수({overall_score})와 판정({approval_status}) 불일치")
        if overall_score < 4.0 and approval_status == "approved":
            issues.append(f"낮은 점수({overall_score})인데 approved 판정은 부적절")

        # 4. 리스크 반영 검증
        if risk_flags and overall_score > 6.0:
            issues.append("리스크 플래그가 있는데 점수가 높음 - 재검토 필요")

        # 5. 종합 점수 계산
        base_score = min(10.0, overall_score)
        penalty = len(issues) * 0.5 + len(guardrails_violations) * 1.0
        final_score = max(0.0, base_score - penalty)

        passed = len(issues) == 0 and len(guardrails_violations) == 0
        retry_needed = len(guardrails_violations) > 0 or len(issues) > 2

        return SelfReview(
            passed=passed,
            score=final_score,
            issues=issues,
            suggestions=suggestions,
            retry_recommended=retry_needed,
            iteration=1,
            guardrails_violations=guardrails_violations
        )

    def _validate_guardrails(self, text: str) -> List[str]:
        """
        텍스트에서 guardrails 위반 검출

        Args:
            text: 검증할 전체 카피 텍스트

        Returns:
            위반 사항 리스트
        """
        violations = []
        text_lower = text.lower()

        if not self.guardrails:
            return violations

        # 1. avoid_claims 검증
        for claim in self.guardrails.avoid_claims:
            claim_lower = claim.lower()
            if claim_lower in text_lower:
                violations.append(f"avoid_claims 위반: '{claim}' 포함됨")

        # 2. forbidden_words 검증
        for word in self.guardrails.forbidden_words:
            word_lower = word.lower()
            if word_lower in text_lower:
                violations.append(f"forbidden_word 위반: '{word}' 포함됨")

        # 3. must_include 검증
        for required in self.guardrails.must_include:
            required_lower = required.lower()
            if required_lower not in text_lower:
                violations.append(f"must_include 누락: '{required}' 미포함")

        return violations

    def _extract_all_text(self, copy_data: Dict[str, Any]) -> str:
        """카피 데이터에서 모든 텍스트 추출"""
        parts = []

        # 주요 필드
        for field in ["headline", "subheadline", "body", "cta"]:
            if field in copy_data:
                parts.append(str(copy_data[field]))

        # bullets (리스트)
        if "bullets" in copy_data:
            bullets = copy_data["bullets"]
            if isinstance(bullets, list):
                parts.extend([str(b) for b in bullets])

        # 기타 텍스트 필드
        for key, value in copy_data.items():
            if key not in ["headline", "subheadline", "body", "cta", "bullets"]:
                if isinstance(value, str):
                    parts.append(value)

        return " ".join(parts)

    async def execute_v3(self, request: AgentRequest) -> AgentResponse:
        """
        Plan-Act-Reflect 패턴으로 리뷰 실행 (v3.0)

        guardrails가 있을 경우 자동으로 위반 검증 수행
        """
        # Goal 설정
        if not request.goal:
            request.goal = AgentGoal(
                primary_objective="광고 카피 품질 검토 및 guardrails 준수 확인",
                success_criteria=[
                    "모든 점수 항목 평가 완료",
                    "guardrails 위반 여부 검증",
                    "리스크 플래그 식별",
                    "승인 판정 제공"
                ],
                constraints=["과대광고 검출 필수", "브랜드 톤 일치 확인"],
                quality_threshold=7.0,
                max_iterations=2
            )

        return await self.execute_with_reflection(request)

    def _build_guardrails_instruction(self) -> str:
        """guardrails 기반 추가 instruction 생성"""
        if not self.guardrails or self.guardrails.is_empty():
            return ""

        parts = ["\n\n## ConceptV1 Guardrails 검증 (CRITICAL)\n"]

        if self.guardrails.avoid_claims:
            parts.append("**반드시 금지해야 할 표현 (avoid_claims):**")
            for claim in self.guardrails.avoid_claims:
                parts.append(f"  - ❌ \"{claim}\"")
            parts.append("→ 위 표현이 포함되어 있으면 risk_flags에 명시하고 overall_score를 4.0 이하로 평가\n")

        if self.guardrails.must_include:
            parts.append("**반드시 포함해야 할 요소 (must_include):**")
            for item in self.guardrails.must_include:
                parts.append(f"  - ✓ \"{item}\"")
            parts.append("→ 위 요소가 누락되면 weaknesses에 기록하고 needs_revision 판정\n")

        if self.guardrails.forbidden_words:
            parts.append("**금지어 (forbidden_words):**")
            parts.append(f"  - {', '.join(self.guardrails.forbidden_words)}")
            parts.append("→ 금지어 포함 시 risk_flags에 명시\n")

        if self.guardrails.legal_disclaimers:
            parts.append("**법적 면책 조항 확인:**")
            for disclaimer in self.guardrails.legal_disclaimers:
                parts.append(f"  - {disclaimer}")

        if self.guardrails.regulatory_notes:
            parts.append(f"**규제 참고 사항:** {self.guardrails.regulatory_notes}")

        return "\n".join(parts)


# Factory function
def get_reviewer_agent(llm_gateway=None) -> ReviewerAgent:
    """
    ReviewerAgent 인스턴스 생성

    Args:
        llm_gateway: LLM Gateway (None이면 전역 인스턴스 사용)

    Returns:
        ReviewerAgent: LLMGateway와 함께 초기화된 ReviewerAgent
    """
    return ReviewerAgent(llm_gateway=llm_gateway)
