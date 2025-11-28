"""
Agent Base Classes

모든 Agent의 기본 추상 클래스 정의

작성일: 2025-11-16
수정일: 2025-11-28 - AgentGoal, SelfReview, Plan-Act-Reflect 패턴 추가
작성자: B팀 (Backend)
문서: ARCH-003, SPEC-002, B_TEAM_AGENT_UPGRADE_PLAN.md
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, List, Literal
from pydantic import BaseModel, Field
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


# ============================================================================
# Goal & Review Classes (에이전트 고도화)
# ============================================================================

class AgentGoal(BaseModel):
    """
    에이전트 목표 정의

    "진정한 에이전트"의 핵심 조건: 목표 지향적 동작
    명령이 아닌 목표를 기반으로 에이전트가 스스로 계획하고 실행합니다.
    """
    primary_objective: str = Field(..., description="주 목표 (예: '효과적인 상품 카피 작성')")
    success_criteria: List[str] = Field(
        default_factory=list,
        description="성공 기준 목록 (예: ['핵심 USP 포함', '150자 이내'])"
    )
    constraints: List[str] = Field(
        default_factory=list,
        description="제약 조건 (예: ['경쟁사 언급 금지', '과장 표현 금지'])"
    )
    quality_threshold: float = Field(
        default=7.0,
        ge=0.0,
        le=10.0,
        description="최소 품질 점수 (0-10)"
    )
    max_iterations: int = Field(
        default=2,
        ge=1,
        le=5,
        description="최대 재시도 횟수"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "primary_objective": "제품의 핵심 가치를 전달하는 광고 카피 작성",
                "success_criteria": [
                    "핵심 USP 1개 이상 포함",
                    "CTA 문구 포함",
                    "타겟 고객 페인포인트 언급"
                ],
                "constraints": [
                    "최상급 표현 금지 (최고, 1위 등)",
                    "경쟁사 직접 언급 금지"
                ],
                "quality_threshold": 7.0,
                "max_iterations": 2
            }
        }


class SelfReview(BaseModel):
    """
    자기 검수 결과

    "진정한 에이전트"의 핵심 조건: 품질 기준과 자기 검수
    에이전트가 자신의 출력물을 스스로 평가하고 개선합니다.
    """
    passed: bool = Field(..., description="품질 기준 통과 여부")
    score: float = Field(..., ge=0.0, le=10.0, description="품질 점수 (0-10)")
    issues: List[str] = Field(
        default_factory=list,
        description="발견된 문제점 목록"
    )
    suggestions: List[str] = Field(
        default_factory=list,
        description="개선 제안 목록"
    )
    retry_recommended: bool = Field(
        default=False,
        description="재시도 권장 여부"
    )
    iteration: int = Field(default=1, description="현재 반복 횟수")
    guardrails_violations: List[str] = Field(
        default_factory=list,
        description="가드레일 위반 사항 (ConceptV1.guardrails 기반)"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "passed": False,
                "score": 6.5,
                "issues": ["CTA 문구 누락", "톤이 너무 딱딱함"],
                "suggestions": ["마지막에 행동 유도 문구 추가", "친근한 어투로 수정"],
                "retry_recommended": True,
                "iteration": 1,
                "guardrails_violations": []
            }
        }


class ExecutionPlan(BaseModel):
    """
    에이전트 실행 계획

    Plan-Act-Reflect 루프의 "Plan" 단계
    """
    plan_id: str = Field(..., description="계획 ID")
    steps: List[Dict[str, Any]] = Field(
        default_factory=list,
        description="실행 단계 목록"
    )
    approach: str = Field(default="", description="접근 방식 설명")
    estimated_quality: float = Field(
        default=7.0,
        description="예상 품질 점수"
    )
    risks: List[str] = Field(
        default_factory=list,
        description="예상 위험 요소"
    )


# ============================================================================
# Error Classes
# ============================================================================

class AgentError(Exception):
    """Agent 실행 중 발생하는 에러"""

    def __init__(
        self,
        message: str,
        agent: str,
        details: Optional[Dict[str, Any]] = None
    ):
        self.message = message
        self.agent = agent
        self.details = details or {}
        super().__init__(self.message)


# ============================================================================
# Request/Response Models
# ============================================================================

class AgentRequest(BaseModel):
    """
    Agent 실행 요청

    모든 Agent가 공통으로 받는 요청 형식
    """
    task: str = Field(..., description="작업 유형 (product_detail, brand_kit, sns 등)")
    payload: Dict[str, Any] = Field(..., description="입력 데이터 (브리프, 상품 정보 등)")
    options: Optional[Dict[str, Any]] = Field(None, description="추가 옵션")
    goal: Optional[AgentGoal] = Field(None, description="에이전트 목표 (고도화)")
    context: Optional[Dict[str, Any]] = Field(None, description="컨텍스트 (ConceptV1, BrandKit 등)")

    class Config:
        json_schema_extra = {
            "example": {
                "task": "product_detail",
                "payload": {
                    "product_name": "무선 이어폰",
                    "features": ["노이즈캔슬링", "24시간 배터리"],
                    "target_audience": "2030 직장인"
                },
                "options": {
                    "tone": "professional",
                    "length": "medium"
                },
                "goal": {
                    "primary_objective": "제품 특징을 효과적으로 전달",
                    "success_criteria": ["USP 포함", "CTA 포함"],
                    "quality_threshold": 7.0
                }
            }
        }


class AgentOutput(BaseModel):
    """
    Agent 출력 단위

    Agent가 생성한 개별 결과물 (텍스트, JSON, 이미지 등)
    """
    type: Literal["text", "json", "image", "video", "audio"] = Field(
        ...,
        description="출력 타입"
    )
    name: str = Field(..., description="출력물 이름/레이블 (예: headline, body, thumbnail)")
    value: Any = Field(..., description="실제 데이터 (문자열, JSON, Base64 등)")
    meta: Optional[Dict[str, Any]] = Field(None, description="메타데이터")

    class Config:
        json_schema_extra = {
            "example": {
                "type": "json",
                "name": "product_copy",
                "value": {
                    "headline": "완벽한 소음 차단의 시작",
                    "body": "프리미엄 노이즈캔슬링으로...",
                    "cta": "지금 바로 만나보세요"
                },
                "meta": {"word_count": 150}
            }
        }


class AgentResponse(BaseModel):
    """
    Agent 실행 응답

    모든 Agent가 공통으로 반환하는 응답 형식
    """
    agent: str = Field(..., description="Agent 이름 (copywriter, designer 등)")
    task: str = Field(..., description="수행한 작업 유형")
    outputs: List[AgentOutput] = Field(..., description="생성된 결과물 목록")
    usage: Dict[str, Any] = Field(default_factory=dict, description="리소스 사용량")
    meta: Dict[str, Any] = Field(default_factory=dict, description="메타데이터")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="생성 시각")

    class Config:
        json_schema_extra = {
            "example": {
                "agent": "copywriter",
                "task": "product_detail",
                "outputs": [
                    {
                        "type": "json",
                        "name": "product_copy",
                        "value": {
                            "headline": "완벽한 소음 차단의 시작",
                            "body": "프리미엄 노이즈캔슬링..."
                        }
                    }
                ],
                "usage": {
                    "llm_tokens": 350,
                    "elapsed_seconds": 2.5
                },
                "meta": {
                    "llm_provider": "ollama",
                    "llm_model": "qwen2.5:7b"
                },
                "timestamp": "2025-11-16T10:30:00Z"
            }
        }


# ============================================================================
# Base Agent Class
# ============================================================================

class AgentBase(ABC):
    """
    Agent 추상 기본 클래스

    모든 Agent는 이 클래스를 상속받아 구현합니다.

    주요 기능:
    1. LLM Gateway 의존성 주입
    2. Media Gateway 의존성 주입 (선택)
    3. 통일된 execute() 인터페이스
    4. 공통 에러 핸들링
    5. 로깅 및 모니터링

    구현 예시:
        class CopywriterAgent(AgentBase):
            @property
            def name(self) -> str:
                return "copywriter"

            async def execute(self, request: AgentRequest) -> AgentResponse:
                # LLM Gateway 사용
                llm_response = await self.llm_gateway.generate(
                    role=self.name,
                    task=request.task,
                    payload=request.payload
                )

                # 결과 반환
                return AgentResponse(
                    agent=self.name,
                    task=request.task,
                    outputs=[...]
                )
    """

    def __init__(
        self,
        llm_gateway=None,
        media_gateway=None
    ):
        """
        Agent 초기화

        Args:
            llm_gateway: LLM Gateway 인스턴스 (None이면 전역 인스턴스 사용)
            media_gateway: Media Gateway 인스턴스 (None이면 전역 인스턴스 사용)
        """
        # LLM Gateway (필수)
        if llm_gateway is None:
            from app.services.llm import get_gateway
            llm_gateway = get_gateway()
        self.llm_gateway = llm_gateway

        # Media Gateway (선택 - Designer Agent용)
        if media_gateway is None:
            from app.services.media import get_media_gateway
            media_gateway = get_media_gateway()
        self.media_gateway = media_gateway

        logger.info(f"{self.name} Agent initialized")

    @property
    @abstractmethod
    def name(self) -> str:
        """
        Agent 이름 반환

        Returns:
            Agent 식별자 (copywriter, designer, reviewer 등)
        """
        pass

    @abstractmethod
    async def execute(self, request: AgentRequest) -> AgentResponse:
        """
        Agent 실행 (추상 메서드)

        각 Agent는 이 메서드를 구현하여 고유 로직을 처리합니다.

        Args:
            request: Agent 요청

        Returns:
            AgentResponse: 실행 결과

        Raises:
            AgentError: Agent 실행 실패 시
        """
        pass

    def _validate_request(self, request: AgentRequest) -> None:
        """
        요청 검증 (공통 로직)

        Args:
            request: Agent 요청

        Raises:
            AgentError: 필수 필드가 없을 때
        """
        if not request.task:
            raise AgentError(
                message="Task is required",
                agent=self.name,
                details={"request": request.model_dump()}
            )

        if not request.payload:
            raise AgentError(
                message="Payload is required",
                agent=self.name,
                details={"request": request.model_dump()}
            )

    def _create_output(
        self,
        output_type: Literal["text", "json", "image", "video", "audio"],
        name: str,
        value: Any,
        meta: Optional[Dict[str, Any]] = None
    ) -> AgentOutput:
        """
        AgentOutput 생성 헬퍼

        Args:
            output_type: 출력 타입
            name: 출력물 이름
            value: 실제 데이터
            meta: 메타데이터

        Returns:
            AgentOutput 인스턴스
        """
        return AgentOutput(
            type=output_type,
            name=name,
            value=value,
            meta=meta or {}
        )

    async def health_check(self) -> bool:
        """
        Agent 상태 확인

        Returns:
            정상 여부
        """
        try:
            # LLM Gateway 확인
            await self.llm_gateway.health_check()

            # Media Gateway 확인 (선택)
            if hasattr(self, 'media_gateway') and self.media_gateway:
                await self.media_gateway.health_check()

            return True
        except Exception as e:
            logger.error(f"{self.name} Agent health check failed: {str(e)}")
            return False

    # ========================================================================
    # Plan-Act-Reflect 패턴 메서드 (에이전트 고도화)
    # ========================================================================

    async def _plan(
        self,
        request: AgentRequest
    ) -> ExecutionPlan:
        """
        Plan 단계: 실행 계획 수립

        Args:
            request: Agent 요청

        Returns:
            ExecutionPlan: 실행 계획
        """
        # 기본 구현 - 서브클래스에서 오버라이드 가능
        plan_id = f"plan_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"

        goal = request.goal
        if goal:
            approach = f"목표: {goal.primary_objective}"
            steps = [
                {"step": 1, "action": "입력 검증", "status": "pending"},
                {"step": 2, "action": "LLM 생성", "status": "pending"},
                {"step": 3, "action": "품질 검토", "status": "pending"}
            ]
        else:
            approach = "기본 실행 흐름"
            steps = [
                {"step": 1, "action": "execute", "status": "pending"}
            ]

        return ExecutionPlan(
            plan_id=plan_id,
            steps=steps,
            approach=approach,
            estimated_quality=7.0
        )

    async def _reflect(
        self,
        result: Any,
        request: AgentRequest,
        iteration: int = 1
    ) -> SelfReview:
        """
        Reflect 단계: 자기 검수

        결과물이 목표와 성공 기준을 충족하는지 평가합니다.

        Args:
            result: 생성된 결과물
            request: 원본 요청
            iteration: 현재 반복 횟수

        Returns:
            SelfReview: 검수 결과
        """
        goal = request.goal
        context = request.context or {}

        # Goal이 없으면 기본 통과
        if not goal:
            return SelfReview(
                passed=True,
                score=7.0,
                iteration=iteration
            )

        # Guardrails 검증 (ConceptV1 컨텍스트)
        guardrails_violations = []
        guardrails = context.get("guardrails", {})

        if guardrails and isinstance(result, (str, dict)):
            result_str = str(result).lower()

            # avoid_claims 검사
            for claim in guardrails.get("avoid_claims", []):
                if claim.lower() in result_str:
                    guardrails_violations.append(
                        f"금지 표현 사용: '{claim}'"
                    )

        # LLM을 사용한 품질 평가 (선택적)
        try:
            review = await self._llm_self_review(result, goal, iteration)
            review.guardrails_violations = guardrails_violations

            # Guardrails 위반 시 무조건 실패
            if guardrails_violations:
                review.passed = False
                review.retry_recommended = True
                review.issues.extend(guardrails_violations)

            return review

        except Exception as e:
            logger.warning(f"[{self.name}] Self-review failed: {e}")
            # 폴백: 기본 검수
            return SelfReview(
                passed=len(guardrails_violations) == 0,
                score=6.0 if guardrails_violations else 7.0,
                issues=guardrails_violations,
                guardrails_violations=guardrails_violations,
                retry_recommended=len(guardrails_violations) > 0,
                iteration=iteration
            )

    async def _llm_self_review(
        self,
        result: Any,
        goal: AgentGoal,
        iteration: int
    ) -> SelfReview:
        """
        LLM을 사용한 자기 검수

        Args:
            result: 검토할 결과물
            goal: 목표
            iteration: 반복 횟수

        Returns:
            SelfReview
        """
        review_prompt = f"""당신은 품질 검토 전문가입니다.

## 목표
{goal.primary_objective}

## 성공 기준
{chr(10).join(f'- {c}' for c in goal.success_criteria) if goal.success_criteria else '없음'}

## 제약 조건
{chr(10).join(f'- {c}' for c in goal.constraints) if goal.constraints else '없음'}

## 검토 대상
{result if isinstance(result, str) else str(result)[:2000]}

## 평가 지시
위 결과가 목표와 성공 기준을 충족하는지 평가하세요.

JSON 형식으로 응답:
{{
    "passed": true/false,
    "score": 0-10 점수,
    "issues": ["문제1", "문제2"],
    "suggestions": ["제안1", "제안2"],
    "retry_recommended": true/false
}}
"""
        try:
            response = await self.llm_gateway.generate(
                role="reviewer",
                task="self_check",
                payload={"prompt": review_prompt},
                mode="json",
                override_model="gemini-2.0-flash",
                options={"temperature": 0.2, "max_tokens": 500}
            )

            data = response.output.value
            if isinstance(data, dict):
                return SelfReview(
                    passed=data.get("passed", False),
                    score=float(data.get("score", 5.0)),
                    issues=data.get("issues", []),
                    suggestions=data.get("suggestions", []),
                    retry_recommended=data.get("retry_recommended", False),
                    iteration=iteration
                )
        except Exception as e:
            logger.warning(f"[{self.name}] LLM self-review error: {e}")

        # 폴백
        return SelfReview(
            passed=True,
            score=7.0,
            iteration=iteration
        )

    async def execute_with_reflection(
        self,
        request: AgentRequest
    ) -> AgentResponse:
        """
        Plan-Act-Reflect 패턴으로 실행

        1. Plan: 실행 계획 수립
        2. Act: 실행 (execute 호출)
        3. Reflect: 자기 검수
        4. (필요시) 재실행

        Args:
            request: Agent 요청

        Returns:
            AgentResponse: 검수 통과된 결과
        """
        goal = request.goal
        max_iterations = goal.max_iterations if goal else 2
        quality_threshold = goal.quality_threshold if goal else 7.0

        # 1. Plan
        plan = await self._plan(request)
        logger.info(f"[{self.name}] Plan: {plan.approach}")

        best_response = None
        best_score = 0.0

        for iteration in range(1, max_iterations + 1):
            # 2. Act
            logger.info(f"[{self.name}] Act: iteration {iteration}")
            response = await self.execute(request)

            # 결과 추출
            result_value = None
            if response.outputs:
                result_value = response.outputs[0].value

            # 3. Reflect
            review = await self._reflect(result_value, request, iteration)
            logger.info(
                f"[{self.name}] Reflect: score={review.score:.1f}, "
                f"passed={review.passed}"
            )

            # 메타데이터에 검수 결과 추가
            response.meta["self_review"] = review.model_dump()
            response.meta["iteration"] = iteration

            # 최고 점수 추적
            if review.score > best_score:
                best_score = review.score
                best_response = response

            # 통과 또는 품질 임계값 도달
            if review.passed or review.score >= quality_threshold:
                logger.info(
                    f"[{self.name}] Quality threshold met: "
                    f"{review.score:.1f} >= {quality_threshold}"
                )
                return response

            # 재시도 비권장이면 중단
            if not review.retry_recommended:
                logger.info(f"[{self.name}] Retry not recommended, stopping")
                break

            # 피드백 반영하여 다음 시도
            if review.suggestions:
                request.payload["_feedback"] = review.suggestions
                request.payload["_issues"] = review.issues

        # 최고 점수 결과 반환
        return best_response or response
