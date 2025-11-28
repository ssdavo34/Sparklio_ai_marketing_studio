"""
Concept Agent v2.0 (CONCEPT_SPEC.md 기준)

회의 요약 + 브리프를 기반으로 전략적 마케팅 컨셉(ConceptV1) 생성

ConceptV1 = Audience Insight → Promise → Evidence → Creative Device
            → Visual World → Channel Strategy → Guardrails

작성일: 2025-11-27
작성자: B팀 (Backend)
참조: CONCEPT_SPEC.md, CONCEPT_AGENT_V2_UPGRADE_PLAN.md

LLM: Gemini 2.0 Flash (무료 티어)
"""

import json
import logging
import uuid
from typing import Dict, Any, Optional, List
from pydantic import BaseModel, Field
from datetime import datetime

from app.services.agents.base import (
    AgentBase,
    AgentRequest,
    AgentResponse,
    AgentOutput,
    AgentError,
    AgentGoal,
    SelfReview,
    ExecutionPlan
)

logger = logging.getLogger(__name__)


# =============================================================================
# Input/Output Schemas
# =============================================================================

class ConceptInput(BaseModel):
    """ConceptAgent 입력"""
    meeting_summary: Dict[str, Any] = Field(..., description="회의 요약 (MeetingAgent 출력)")
    campaign_brief: Optional[Dict[str, Any]] = Field(None, description="캠페인 브리프 (StrategistAgent 출력)")
    brand_context: Optional[str] = Field(None, description="브랜드 컨텍스트")
    concept_count: int = Field(default=3, ge=1, le=5, description="생성할 컨셉 수")


# =============================================================================
# ConceptV1 Schema (CONCEPT_SPEC.md 기준)
# =============================================================================

class VisualWorld(BaseModel):
    """비주얼 세계관"""
    color_palette: str = Field(default="", description="색상 설명 (예: 밤+네온)")
    photo_style: str = Field(default="", description="사진 스타일")
    layout_motifs: List[str] = Field(default_factory=list, description="레이아웃 모티프")
    hex_colors: List[str] = Field(default_factory=list, description="HEX 코드 3-5개")


class ChannelStrategy(BaseModel):
    """채널별 전략"""
    shorts: Optional[str] = Field(None, description="Shorts 적용 전략 (15-60초)")
    instagram_news: Optional[str] = Field(None, description="Instagram 뉴스 광고 전략")
    product_detail: Optional[str] = Field(None, description="상품 상세 페이지 전략")
    presentation: Optional[str] = Field(None, description="프레젠테이션 전략")


class Guardrails(BaseModel):
    """가드레일 (필수 준수 사항)"""
    avoid_claims: List[str] = Field(default_factory=list, description="피해야 할 표현")
    must_include: List[str] = Field(default_factory=list, description="반드시 포함할 메시지")


class ConceptMeta(BaseModel):
    """메타데이터"""
    brand_id: Optional[str] = None
    project_id: Optional[str] = None
    created_by: str = "concept_agent"
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    status: str = "active"  # draft / active / archived


class ConceptV1(BaseModel):
    """
    ConceptV1 - CONCEPT_SPEC.md 기준 완전 구현

    Sparklio의 "컨셉"은 단순한 주제+톤이 아니라,
    Audience Insight → Promise → Evidence → Creative Device
    → Visual World → Channel Strategy → Guardrails
    까지를 포함하는 중심 객체
    """
    # 기본 정보
    id: str = Field(default_factory=lambda: f"CONCEPT_{uuid.uuid4().hex[:8]}")
    version: int = Field(default=1)
    name: str = Field(..., description="컨셉 이름 (5-15자)")
    topic: str = Field(default="", description="제품/서비스 카테고리")
    mode: str = Field(default="launch_campaign", description="캠페인 모드")

    # 전략 핵심 (🆕)
    audience_insight: str = Field(default="", description="고객의 심리/상황 인사이트 1줄")
    core_promise: str = Field(default="", description="고객에게 하는 핵심 약속")
    brand_role: str = Field(default="", description="브랜드가 고객 삶에서 맡는 역할")

    # 근거 (🆕)
    reason_to_believe: List[str] = Field(
        default_factory=list,
        description="약속을 믿게 하는 근거 (스펙/데이터/증거)"
    )

    # 크리에이티브 (🆕)
    creative_device: str = Field(default="", description="캠페인을 묶는 비유/스토리 장치")
    hook_patterns: List[str] = Field(
        default_factory=list,
        description="헤드라인/오프닝에서 반복 사용할 훅 문장 패턴"
    )

    # 비주얼
    visual_world: VisualWorld = Field(default_factory=VisualWorld, description="비주얼 세계관")

    # 채널 전략 (🆕)
    channel_strategy: ChannelStrategy = Field(default_factory=ChannelStrategy, description="채널별 적용 전략")

    # 가드레일 (🆕)
    guardrails: Guardrails = Field(default_factory=Guardrails, description="필수 준수사항")

    # 기존 호환 필드
    target_audience: str = Field(default="", description="타겟 고객")
    tone_and_manner: str = Field(default="", description="톤앤매너")
    keywords: List[str] = Field(default_factory=list, description="연관 키워드")

    # 메타데이터
    meta: ConceptMeta = Field(default_factory=ConceptMeta)


class ConceptV1Output(BaseModel):
    """ConceptAgent v2.0 출력"""
    concepts: List[ConceptV1] = Field(..., description="생성된 컨셉 목록 (ConceptV1)")
    reasoning: str = Field(..., description="컨셉 도출 근거")


# =============================================================================
# Legacy Schema (하위 호환성)
# =============================================================================

class ConceptOutput(BaseModel):
    """생성된 컨셉 (v1.0 하위 호환)"""
    concept_name: str = Field(..., description="컨셉 이름 (한글, 5-15자)")
    concept_description: str = Field(..., description="컨셉 설명 (2-3문장)")
    target_audience: str = Field(..., description="타겟 고객")
    key_message: str = Field(..., description="핵심 메시지 (10-30자)")
    tone_and_manner: str = Field(..., description="톤앤매너")
    visual_style: str = Field(..., description="비주얼 스타일")
    color_palette: List[str] = Field(default_factory=list, description="색상 팔레트 (HEX)")
    keywords: List[str] = Field(default_factory=list, description="연관 키워드")


class ConceptAgentOutput(BaseModel):
    """ConceptAgent 전체 출력 (v1.0 하위 호환)"""
    concepts: List[ConceptOutput] = Field(..., description="생성된 컨셉 목록")
    reasoning: str = Field(..., description="컨셉 도출 근거")


# =============================================================================
# Concept Agent v2.0
# =============================================================================

class ConceptAgent(AgentBase):
    """
    Concept Agent v3.0 (Plan-Act-Reflect 패턴 적용)

    회의 요약과 브리프를 분석하여 전략적 마케팅 컨셉(ConceptV1)을 생성합니다.

    ConceptV1 구조:
    - Audience Insight (고객 인사이트)
    - Core Promise (핵심 약속)
    - Brand Role (브랜드 역할)
    - Reason to Believe (믿음의 근거)
    - Creative Device (크리에이티브 장치)
    - Hook Patterns (훅 패턴)
    - Visual World (비주얼 세계관)
    - Channel Strategy (채널 전략)
    - Guardrails (가드레일)

    v3.0 고도화:
    - Plan: 컨셉 생성 전략 수립
    - Act: LLM 호출하여 컨셉 생성
    - Reflect: 자기 검수 (일관성, 가드레일 준수 확인)
    """

    @property
    def name(self) -> str:
        return "concept"

    # ========================================================================
    # Plan-Act-Reflect 오버라이드
    # ========================================================================

    async def _plan(self, request: AgentRequest) -> ExecutionPlan:
        """
        컨셉 생성 전략 계획

        접근 방식을 결정:
        - 감성적 접근 vs 이성적 접근
        - 타겟 고객 분석
        - 채널별 중점 사항
        """
        plan_id = f"concept_plan_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"

        goal = request.goal
        payload = request.payload
        concept_count = payload.get("concept_count", 3)

        # 전략 접근 방식 결정
        approaches = []
        if concept_count >= 1:
            approaches.append("감성적/라이프스타일 강조")
        if concept_count >= 2:
            approaches.append("이성적/효과/근거 강조")
        if concept_count >= 3:
            approaches.append("혁신적/차별화 강조")

        steps = [
            {"step": 1, "action": "입력 분석", "status": "pending"},
            {"step": 2, "action": "인사이트 도출", "status": "pending"},
            {"step": 3, "action": "컨셉 생성", "status": "pending"},
            {"step": 4, "action": "일관성 검증", "status": "pending"},
            {"step": 5, "action": "가드레일 검증", "status": "pending"}
        ]

        return ExecutionPlan(
            plan_id=plan_id,
            steps=steps,
            approach=f"{concept_count}개 컨셉 생성: {', '.join(approaches)}",
            estimated_quality=7.5,
            risks=["LLM 일관성 부족", "가드레일 위반 가능성"]
        )

    async def _reflect(
        self,
        result: Any,
        request: AgentRequest,
        iteration: int = 1
    ) -> SelfReview:
        """
        컨셉 자기 검수

        검증 항목:
        1. 전략적 일관성: audience_insight → core_promise → creative_device
        2. 가드레일 준수: avoid_claims, must_include
        3. 완성도: 필수 필드 모두 채워졌는지
        """
        issues = []
        suggestions = []
        guardrails_violations = []

        # 결과가 dict인 경우 (ConceptV1Output)
        if isinstance(result, dict):
            concepts = result.get("concepts", [])

            for i, concept in enumerate(concepts):
                # 1. 필수 필드 검증
                required = [
                    "audience_insight", "core_promise", "brand_role",
                    "creative_device", "hook_patterns"
                ]
                for field in required:
                    if not concept.get(field):
                        issues.append(f"컨셉 {i+1}: {field} 누락")

                # 2. 가드레일 검증
                guardrails = concept.get("guardrails", {})
                avoid_claims = guardrails.get("avoid_claims", [])
                must_include = guardrails.get("must_include", [])

                # 모든 텍스트 필드에서 avoid_claims 검사
                text_fields = [
                    concept.get("core_promise", ""),
                    concept.get("creative_device", ""),
                    *concept.get("hook_patterns", [])
                ]
                combined_text = " ".join(str(t) for t in text_fields).lower()

                for claim in avoid_claims:
                    if claim.lower() in combined_text:
                        guardrails_violations.append(
                            f"컨셉 {i+1}: 금지 표현 '{claim}' 발견"
                        )

                # 3. 일관성 검증 (LLM 사용)
                # - 간단한 규칙 기반 검증만 수행 (빠른 처리)
                insight = concept.get("audience_insight", "")
                promise = concept.get("core_promise", "")

                if insight and promise:
                    # 인사이트와 약속이 관련있는지 간단 체크
                    if len(set(insight.split()) & set(promise.split())) == 0:
                        suggestions.append(
                            f"컨셉 {i+1}: insight와 promise 연결 강화 필요"
                        )

        # 점수 계산
        base_score = 8.0
        base_score -= len(issues) * 0.5
        base_score -= len(guardrails_violations) * 1.5
        base_score -= len(suggestions) * 0.2
        score = max(0.0, min(10.0, base_score))

        # 통과 여부
        goal = request.goal
        threshold = goal.quality_threshold if goal else 7.0
        passed = score >= threshold and len(guardrails_violations) == 0

        return SelfReview(
            passed=passed,
            score=score,
            issues=issues,
            suggestions=suggestions,
            retry_recommended=not passed and iteration < 2,
            iteration=iteration,
            guardrails_violations=guardrails_violations
        )

    async def execute(self, request: AgentRequest) -> AgentResponse:
        """
        컨셉 생성 실행 (v2.0 - ConceptV1)

        Args:
            request: AgentRequest (payload에 ConceptInput 필드 포함)

        Returns:
            AgentResponse (outputs에 ConceptV1 concepts 포함)
        """
        start_time = datetime.utcnow()

        # 입력 검증
        self._validate_request(request)

        try:
            input_data = ConceptInput(**request.payload)
        except Exception as e:
            raise AgentError(
                message=f"Invalid input: {str(e)}",
                agent=self.name,
                details={"payload": request.payload}
            )

        # v2.0 프롬프트 생성
        prompt = self._build_prompt_v2(input_data)

        logger.info(f"[ConceptAgent v2.0] Generating {input_data.concept_count} ConceptV1 concepts...")

        # LLM 호출 (Gemini 2.0 Flash) - 더 많은 토큰 필요
        try:
            llm_response = await self.llm_gateway.generate(
                role=self.name,
                task="generate_concepts_v2",
                payload={"prompt": prompt},
                mode="json",
                override_model="gemini-2.0-flash",
                options={
                    "temperature": 0.8,  # 창의성 중요
                    "max_tokens": 10000  # ConceptV1은 더 많은 필드
                }
            )
        except Exception as e:
            logger.error(f"[ConceptAgent v2.0] LLM call failed: {e}")
            raise AgentError(
                message=f"LLM generation failed: {str(e)}",
                agent=self.name,
                details={"input": input_data.model_dump()}
            )

        # v2.0 결과 파싱
        try:
            output_data = self._parse_output_v2(llm_response.output.value, input_data.concept_count)
        except Exception as e:
            logger.error(f"[ConceptAgent v2.0] Output parsing failed: {e}")
            raise AgentError(
                message=f"Output parsing failed: {str(e)}",
                agent=self.name,
                details={"llm_output": llm_response.output.value}
            )

        elapsed = (datetime.utcnow() - start_time).total_seconds()

        logger.info(
            f"[ConceptAgent v2.0] Generated {len(output_data.concepts)} ConceptV1 concepts in {elapsed:.2f}s"
        )

        # AgentResponse 반환
        return AgentResponse(
            agent=self.name,
            task=request.task,
            outputs=[
                self._create_output(
                    output_type="json",
                    name="concepts",
                    value=output_data.model_dump(),
                    meta={
                        "count": len(output_data.concepts),
                        "version": "v2.0",
                        "schema": "ConceptV1"
                    }
                )
            ],
            usage={
                "llm_tokens": llm_response.usage.get("total_tokens", 0),
                "elapsed_seconds": elapsed
            },
            meta={
                "llm_provider": llm_response.provider,
                "llm_model": llm_response.model,
                "concept_count": len(output_data.concepts),
                "agent_version": "v2.0"
            }
        )

    def _build_prompt_v2(self, input_data: ConceptInput) -> str:
        """
        ConceptV1 생성을 위한 고도화된 프롬프트 (v2.0)

        CONCEPT_SPEC.md 기준:
        - Audience Insight 도출
        - Core Promise (핵심 약속)
        - Reason to Believe (근거)
        - Creative Device (비유/장치)
        - Hook Patterns (반복 사용 훅)
        - Channel Strategy (채널별 전략)
        - Guardrails (가드레일)
        """

        # 회의 요약 정리
        meeting = input_data.meeting_summary
        meeting_text = f"""
## 회의 요약
- 제목: {meeting.get('title', '제목 없음')}
- 핵심 포인트: {', '.join(meeting.get('key_points', []))}
- 핵심 메시지: {meeting.get('core_message', '')}
- 제품/서비스: {meeting.get('product', meeting.get('topic', ''))}
"""

        # 브리프 정리 (있으면)
        brief_text = ""
        if input_data.campaign_brief:
            brief = input_data.campaign_brief
            brief_text = f"""
## 캠페인 브리프
- 목표: {brief.get('objective', '')}
- 타겟: {brief.get('target_audience', '')}
- 톤앤매너: {brief.get('tone_and_manner', '')}
- KPI: {brief.get('kpi', '')}
"""

        # 브랜드 컨텍스트
        brand_text = ""
        if input_data.brand_context:
            brand_text = f"""
## 브랜드 컨텍스트
{input_data.brand_context}
"""

        prompt = f"""당신은 Sparklio AI의 수석 전략가입니다.
아래 정보를 바탕으로 {input_data.concept_count}개의 **전략적 마케팅 컨셉(ConceptV1)** 을 생성하세요.

{meeting_text}
{brief_text}
{brand_text}

---

## ConceptV1 생성 가이드

각 컨셉은 다음 구조를 **반드시** 포함해야 합니다:

### 1. 전략 핵심
- **audience_insight**: 고객의 심리/상황 인사이트 1줄
  - 예: "퇴근길에 허기져서 자꾸 편의점 과자를 사게 되는데, 내일 아침이 걱정된다."

- **core_promise**: 고객에게 하는 핵심 약속 (Benefit 중심)
  - 예: "배는 차게, 속은 편하게 채워주는 단백질 루틴"

- **brand_role**: 이 브랜드가 고객 삶에서 맡는 역할
  - 예: "나를 챙겨주는 '퇴근 후 루틴' 가이드"

### 2. 근거
- **reason_to_believe**: 약속을 믿게 하는 근거 2-4개
  - 예: ["당 5g 이하, 단백질 15g 이상", "위에 부담을 줄이는 원료 조합"]

### 3. 크리에이티브
- **creative_device**: 캠페인 전반을 묶는 비유/스토리 장치
  - 예: "하루의 '마침표'를 찍는 작은 의식"

- **hook_patterns**: 헤드라인/오프닝에서 반복 사용할 훅 문장 2-3개
  - 예: ["오늘도 무사히 버틴 당신에게", "퇴근 후 딱 5분, 내 몸을 위해 쓰자"]

### 4. 비주얼 세계관
- **visual_world**:
  - color_palette: 색상 설명 (예: "밤+네온 (퇴근길 도시 조명)")
  - photo_style: 사진 스타일 (예: "실내 조명 아래 책상/소파 컷")
  - layout_motifs: 레이아웃 모티프 리스트 (예: ["루틴 체크리스트", "ONE DAY 타임라인"])
  - hex_colors: HEX 코드 3-5개 (예: ["#1F2937", "#F59E0B", "#10B981"])

### 5. 채널 전략
- **channel_strategy**: 채널별 적용 요약
  - shorts: Shorts 전략 (15-60초)
  - instagram_news: Instagram 뉴스 광고 전략
  - product_detail: 상품 상세 페이지 전략
  - presentation: 프레젠테이션 전략

### 6. 가드레일
- **guardrails**:
  - avoid_claims: 피해야 할 표현 리스트 (예: ["살 빠진다", "질병 치료"])
  - must_include: 반드시 포함할 메시지 리스트 (예: ["위에 부담 적음"])

---

## 요구사항

1. **전략적 다양성**: 각 컨셉은 서로 다른 접근 방식을 가져야 합니다
   - 컨셉 1: 감성적 / 라이프스타일 강조
   - 컨셉 2: 이성적 / 효과/근거 강조
   - 컨셉 3: 혁신적 / 차별화 강조

2. **깊이**: 단순히 "주제 + 톤"이 아니라, 고객 인사이트부터 채널 전략까지 완결된 컨셉

3. **실행 가능성**: channel_strategy는 실제로 Shorts/Instagram/Detail에 바로 적용 가능해야 함

4. **일관성**: 같은 컨셉 내에서 audience_insight → promise → creative_device → hook_patterns가 자연스럽게 연결되어야 함

---

## 출력 형식 (JSON)

{{
  "concepts": [
    {{
      "name": "컨셉명 (5-15자)",
      "topic": "제품/서비스 카테고리",
      "mode": "launch_campaign",

      "audience_insight": "고객 심리/상황 인사이트 1줄",
      "core_promise": "핵심 약속",
      "brand_role": "브랜드 역할",

      "reason_to_believe": ["근거1", "근거2", "근거3"],

      "creative_device": "비유/스토리 장치",
      "hook_patterns": ["훅1", "훅2", "훅3"],

      "visual_world": {{
        "color_palette": "색상 설명",
        "photo_style": "사진 스타일",
        "layout_motifs": ["모티프1", "모티프2"],
        "hex_colors": ["#HEX1", "#HEX2", "#HEX3"]
      }},

      "channel_strategy": {{
        "shorts": "Shorts 전략",
        "instagram_news": "Instagram 전략",
        "product_detail": "상세 페이지 전략",
        "presentation": "프레젠테이션 전략"
      }},

      "guardrails": {{
        "avoid_claims": ["피할 표현1", "피할 표현2"],
        "must_include": ["필수 메시지1", "필수 메시지2"]
      }},

      "target_audience": "타겟 고객",
      "tone_and_manner": "톤앤매너",
      "keywords": ["키워드1", "키워드2", "키워드3"]
    }}
  ],
  "reasoning": "컨셉 도출 근거 설명"
}}

{input_data.concept_count}개의 컨셉을 생성하세요. 한국어로 작성하세요.
"""
        return prompt

    def _build_prompt(self, input_data: ConceptInput) -> str:
        """프롬프트 생성 (v1.0 legacy - 하위 호환)"""

        # 회의 요약 정리
        meeting = input_data.meeting_summary
        meeting_text = f"""
## 회의 요약
- 제목: {meeting.get('title', '제목 없음')}
- 핵심 포인트: {', '.join(meeting.get('key_points', []))}
- 핵심 메시지: {meeting.get('core_message', '')}
"""

        # 브리프 정리 (있으면)
        brief_text = ""
        if input_data.campaign_brief:
            brief = input_data.campaign_brief
            brief_text = f"""
## 캠페인 브리프
- 목표: {brief.get('objective', '')}
- 타겟: {brief.get('target_audience', '')}
- 톤앤매너: {brief.get('tone_and_manner', '')}
"""

        # 브랜드 컨텍스트
        brand_text = ""
        if input_data.brand_context:
            brand_text = f"""
## 브랜드 컨텍스트
{input_data.brand_context}
"""

        prompt = f"""당신은 마케팅 전문가입니다. 아래 정보를 바탕으로 {input_data.concept_count}개의 마케팅 컨셉을 생성하세요.

{meeting_text}
{brief_text}
{brand_text}

## 요구사항
1. 각 컨셉은 서로 다른 접근 방식을 가져야 합니다 (예: 감성적 vs 이성적, 가격 강조 vs 품질 강조)
2. 타겟 고객이 공감할 수 있는 핵심 메시지를 만드세요
3. 비주얼 스타일은 구체적으로 설명하세요 (예: "밝고 모던한 오피스 분위기")
4. 색상 팔레트는 HEX 코드 3-5개를 제안하세요

## 출력 형식 (JSON)
{{
    "concepts": [
        {{
            "concept_name": "컨셉명 (5-15자)",
            "concept_description": "컨셉 설명 (2-3문장)",
            "target_audience": "타겟 고객",
            "key_message": "핵심 메시지 (10-30자)",
            "tone_and_manner": "톤앤매너",
            "visual_style": "비주얼 스타일 설명",
            "color_palette": ["#HEX1", "#HEX2", "#HEX3"],
            "keywords": ["키워드1", "키워드2", "키워드3"]
        }}
    ],
    "reasoning": "컨셉 도출 근거 설명"
}}

{input_data.concept_count}개의 컨셉을 생성하세요. 한국어로 작성하세요.
"""
        return prompt

    def _parse_output(self, llm_output: Any, expected_count: int) -> ConceptAgentOutput:
        """LLM 출력 파싱"""

        # 이미 dict인 경우 (JSON 모드)
        if isinstance(llm_output, dict):
            data = llm_output
        elif isinstance(llm_output, str):
            # JSON 파싱 시도
            try:
                data = json.loads(llm_output)
            except json.JSONDecodeError:
                # JSON 블록 추출 시도
                import re
                json_match = re.search(r'\{[\s\S]*\}', llm_output)
                if json_match:
                    data = json.loads(json_match.group())
                else:
                    raise ValueError("Cannot parse LLM output as JSON")
        else:
            raise ValueError(f"Unexpected output type: {type(llm_output)}")

        # concepts 필드 확인
        if "concepts" not in data:
            raise ValueError("Missing 'concepts' field in output")

        # 컨셉 파싱
        concepts = []
        for i, concept_data in enumerate(data["concepts"]):
            try:
                concept = ConceptOutput(
                    concept_name=concept_data.get("concept_name", f"컨셉 {i+1}"),
                    concept_description=concept_data.get("concept_description", ""),
                    target_audience=concept_data.get("target_audience", ""),
                    key_message=concept_data.get("key_message", ""),
                    tone_and_manner=concept_data.get("tone_and_manner", ""),
                    visual_style=concept_data.get("visual_style", ""),
                    color_palette=concept_data.get("color_palette", ["#4F46E5", "#10B981", "#F59E0B"]),
                    keywords=concept_data.get("keywords", [])
                )
                concepts.append(concept)
            except Exception as e:
                logger.warning(f"Failed to parse concept {i}: {e}")
                continue

        if len(concepts) == 0:
            raise ValueError("No valid concepts parsed")

        return ConceptAgentOutput(
            concepts=concepts,
            reasoning=data.get("reasoning", "")
        )

    def _parse_output_v2(self, llm_output: Any, expected_count: int) -> ConceptV1Output:
        """
        ConceptV1 파싱 (v2.0)

        LLM이 반환한 JSON을 ConceptV1 스키마로 변환
        """
        import re

        # 이미 dict인 경우 (JSON 모드)
        if isinstance(llm_output, dict):
            data = llm_output
        elif isinstance(llm_output, str):
            # JSON 파싱 시도
            try:
                data = json.loads(llm_output)
            except json.JSONDecodeError:
                # JSON 블록 추출 시도
                json_match = re.search(r'\{[\s\S]*\}', llm_output)
                if json_match:
                    data = json.loads(json_match.group())
                else:
                    raise ValueError("Cannot parse LLM output as JSON")
        else:
            raise ValueError(f"Unexpected output type: {type(llm_output)}")

        # concepts 필드 확인
        if "concepts" not in data:
            raise ValueError("Missing 'concepts' field in output")

        # ConceptV1 파싱
        concepts = []
        for i, concept_data in enumerate(data["concepts"]):
            try:
                # visual_world 파싱
                vw_data = concept_data.get("visual_world", {})
                visual_world = VisualWorld(
                    color_palette=vw_data.get("color_palette", ""),
                    photo_style=vw_data.get("photo_style", ""),
                    layout_motifs=vw_data.get("layout_motifs", []),
                    hex_colors=vw_data.get("hex_colors", ["#4F46E5", "#10B981", "#F59E0B"])
                )

                # channel_strategy 파싱
                cs_data = concept_data.get("channel_strategy", {})
                channel_strategy = ChannelStrategy(
                    shorts=cs_data.get("shorts"),
                    instagram_news=cs_data.get("instagram_news"),
                    product_detail=cs_data.get("product_detail"),
                    presentation=cs_data.get("presentation")
                )

                # guardrails 파싱
                gr_data = concept_data.get("guardrails", {})
                guardrails = Guardrails(
                    avoid_claims=gr_data.get("avoid_claims", []),
                    must_include=gr_data.get("must_include", [])
                )

                # ConceptV1 생성
                concept = ConceptV1(
                    name=concept_data.get("name", f"컨셉 {i+1}"),
                    topic=concept_data.get("topic", ""),
                    mode=concept_data.get("mode", "launch_campaign"),

                    # 전략 핵심
                    audience_insight=concept_data.get("audience_insight", ""),
                    core_promise=concept_data.get("core_promise", ""),
                    brand_role=concept_data.get("brand_role", ""),

                    # 근거
                    reason_to_believe=concept_data.get("reason_to_believe", []),

                    # 크리에이티브
                    creative_device=concept_data.get("creative_device", ""),
                    hook_patterns=concept_data.get("hook_patterns", []),

                    # 비주얼
                    visual_world=visual_world,

                    # 채널 전략
                    channel_strategy=channel_strategy,

                    # 가드레일
                    guardrails=guardrails,

                    # 기존 호환 필드
                    target_audience=concept_data.get("target_audience", ""),
                    tone_and_manner=concept_data.get("tone_and_manner", ""),
                    keywords=concept_data.get("keywords", [])
                )
                concepts.append(concept)
            except Exception as e:
                logger.warning(f"Failed to parse ConceptV1 {i}: {e}")
                continue

        if len(concepts) == 0:
            raise ValueError("No valid ConceptV1 concepts parsed")

        return ConceptV1Output(
            concepts=concepts,
            reasoning=data.get("reasoning", "")
        )


    async def execute_v3(self, request: AgentRequest) -> AgentResponse:
        """
        Plan-Act-Reflect 패턴으로 컨셉 생성 (v3.0)

        자기 검수를 통해 품질 보장:
        1. 가드레일 준수 확인
        2. 전략적 일관성 검증
        3. 필요시 재생성

        Args:
            request: AgentRequest (goal 포함 권장)

        Returns:
            AgentResponse: 검수 통과된 컨셉
        """
        # Goal이 없으면 기본 Goal 생성
        if not request.goal:
            request.goal = AgentGoal(
                primary_objective="전략적 마케팅 컨셉 생성",
                success_criteria=[
                    "audience_insight 포함",
                    "core_promise 포함",
                    "guardrails 준수"
                ],
                quality_threshold=7.0,
                max_iterations=2
            )

        # Plan-Act-Reflect 실행
        return await self.execute_with_reflection(request)


# =============================================================================
# Factory Function
# =============================================================================

def get_concept_agent(llm_gateway=None) -> ConceptAgent:
    """ConceptAgent v3.0 인스턴스 반환"""
    return ConceptAgent(llm_gateway=llm_gateway)
