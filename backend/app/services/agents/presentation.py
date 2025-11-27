"""
Presentation Agent (Demo Day)

컨셉 기반 프레젠테이션 슬라이드 구조 및 내용 생성

작성일: 2025-11-27
작성자: B팀 (Backend)

LLM: Gemini 2.0 Flash
출력: 6-10개 슬라이드 구조 (제목, 본문, 비주얼 가이드)
"""

import json
import logging
from typing import Dict, Any, Optional, List
from pydantic import BaseModel, Field
from datetime import datetime

from app.services.agents.base import (
    AgentBase, AgentRequest, AgentResponse, AgentError
)

logger = logging.getLogger(__name__)


# =============================================================================
# Input/Output Schemas
# =============================================================================

class PresentationInput(BaseModel):
    """PresentationAgent 입력"""
    concept: Dict[str, Any] = Field(..., description="컨셉 정보")
    product_name: str = Field(..., description="제품/서비스명")
    presentation_type: str = Field(
        default="pitch",
        description="프레젠테이션 유형 (pitch, sales, internal, investor)"
    )
    slide_count: int = Field(default=8, ge=5, le=15, description="슬라이드 수")
    include_speaker_notes: bool = Field(default=True, description="발표자 노트 포함")


class SlideOutput(BaseModel):
    """슬라이드 출력"""
    slide_number: int = Field(..., description="슬라이드 번호")
    slide_type: str = Field(..., description="슬라이드 유형 (title, content, comparison, cta 등)")
    title: str = Field(..., description="슬라이드 제목")
    subtitle: Optional[str] = Field(None, description="부제목")
    body_points: List[str] = Field(default_factory=list, description="본문 포인트 (3-5개)")
    visual_suggestion: str = Field(..., description="비주얼 제안 (이미지/차트/아이콘 설명)")
    speaker_notes: Optional[str] = Field(None, description="발표자 노트")
    layout: str = Field(default="standard", description="레이아웃 (standard, two_column, full_image)")
    animation_hint: Optional[str] = Field(None, description="애니메이션 힌트")


class PresentationOutput(BaseModel):
    """PresentationAgent 전체 출력"""
    title: str = Field(..., description="프레젠테이션 제목")
    subtitle: str = Field(..., description="부제목")
    target_audience: str = Field(..., description="대상 청중")
    estimated_duration_minutes: int = Field(..., description="예상 발표 시간 (분)")
    slides: List[SlideOutput] = Field(..., description="슬라이드 목록")
    design_guidelines: Dict[str, Any] = Field(..., description="디자인 가이드라인")


# =============================================================================
# Presentation Agent
# =============================================================================

class PresentationAgent(AgentBase):
    """
    Presentation Agent

    마케팅 컨셉을 기반으로 고품질 프레젠테이션 구조를 생성합니다.

    구조:
    1. Title Slide: 브랜드/제품 소개
    2. Problem: 고객의 Pain Point
    3. Solution: 우리의 해결책
    4. Features: 핵심 기능/장점
    5. Benefits: 고객 혜택
    6. How It Works: 작동 방식
    7. Social Proof: 사례/후기
    8. Pricing/CTA: 가격/행동 유도
    """

    @property
    def name(self) -> str:
        return "presentation"

    async def execute(self, request: AgentRequest) -> AgentResponse:
        """프레젠테이션 구조 생성"""
        start_time = datetime.utcnow()

        self._validate_request(request)

        try:
            input_data = PresentationInput(**request.payload)
        except Exception as e:
            raise AgentError(
                message=f"Invalid input: {str(e)}",
                agent=self.name,
                details={"payload": request.payload}
            )

        prompt = self._build_prompt(input_data)

        logger.info(
            f"[PresentationAgent] Generating {input_data.slide_count} slides "
            f"for {input_data.presentation_type} presentation..."
        )

        try:
            llm_response = await self.llm_gateway.generate(
                role=self.name,
                task="generate_presentation",
                payload={"prompt": prompt},
                mode="json",
                override_model="gemini-2.0-flash",
                options={
                    "temperature": 0.7,
                    "max_tokens": 10000
                }
            )
        except Exception as e:
            logger.error(f"[PresentationAgent] LLM call failed: {e}")
            raise AgentError(
                message=f"LLM generation failed: {str(e)}",
                agent=self.name,
                details={"input": input_data.model_dump()}
            )

        try:
            output_data = self._parse_output(llm_response.output.value, input_data)
        except Exception as e:
            logger.error(f"[PresentationAgent] Output parsing failed: {e}")
            raise AgentError(
                message=f"Output parsing failed: {str(e)}",
                agent=self.name,
                details={"llm_output": llm_response.output.value}
            )

        elapsed = (datetime.utcnow() - start_time).total_seconds()

        logger.info(
            f"[PresentationAgent] Generated {len(output_data.slides)} slides "
            f"in {elapsed:.2f}s"
        )

        return AgentResponse(
            agent=self.name,
            task=request.task,
            outputs=[
                self._create_output(
                    output_type="json",
                    name="presentation",
                    value=output_data.model_dump(),
                    meta={
                        "slide_count": len(output_data.slides),
                        "duration_minutes": output_data.estimated_duration_minutes
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
                "presentation_type": input_data.presentation_type
            }
        )

    def _build_prompt(self, input_data: PresentationInput) -> str:
        """프롬프트 생성 (ConceptV1 지원)"""
        concept = input_data.concept

        presentation_type_desc = {
            "pitch": "투자자/파트너를 위한 피치 덱",
            "sales": "영업/세일즈를 위한 제품 소개 자료",
            "internal": "내부 팀을 위한 프로젝트 소개",
            "investor": "투자 유치를 위한 IR 자료"
        }

        type_desc = presentation_type_desc.get(
            input_data.presentation_type,
            "일반 프레젠테이션"
        )

        # ConceptV1 전략 필드 추출
        audience_insight = concept.get('audience_insight', '')
        core_promise = concept.get('core_promise', '')
        brand_role = concept.get('brand_role', '')
        reason_to_believe = concept.get('reason_to_believe', [])
        creative_device = concept.get('creative_device', '')
        channel_strategy = concept.get('channel_strategy', {})
        guardrails = concept.get('guardrails', {})
        visual_world = concept.get('visual_world', {})

        # 프레젠테이션 채널 전략 (ConceptV1)
        presentation_strategy = channel_strategy.get('presentation', '') if isinstance(channel_strategy, dict) else ''

        # RTB 텍스트
        rtb_text = ""
        if reason_to_believe:
            rtb_text = f"- 믿을 수 있는 이유 (RTB): {', '.join(reason_to_believe)}"

        # 가드레일
        avoid_claims = guardrails.get('avoid_claims', []) if isinstance(guardrails, dict) else []
        must_include = guardrails.get('must_include', []) if isinstance(guardrails, dict) else []
        guardrails_text = ""
        if avoid_claims:
            guardrails_text += f"\n- 피해야 할 표현: {', '.join(avoid_claims)}"
        if must_include:
            guardrails_text += f"\n- 반드시 포함할 요소: {', '.join(must_include)}"

        # 비주얼 세계관
        visual_world_text = ""
        if isinstance(visual_world, dict) and visual_world:
            color_palette = visual_world.get('color_palette', '')
            photo_style = visual_world.get('photo_style', '')
            hex_colors = visual_world.get('hex_colors', [])
            if color_palette:
                visual_world_text += f"\n- 컬러 팔레트: {color_palette}"
            if photo_style:
                visual_world_text += f"\n- 포토 스타일: {photo_style}"
            if hex_colors:
                visual_world_text += f"\n- HEX 컬러: {', '.join(hex_colors)}"

        speaker_notes_instruction = ""
        if input_data.include_speaker_notes:
            speaker_notes_instruction = """
- speaker_notes: 발표자가 참고할 노트 (2-3문장, 청중과의 소통 팁 포함)"""

        prompt = f"""당신은 프레젠테이션 전문가입니다. 아래 정보를 바탕으로 {input_data.slide_count}개 슬라이드의 {type_desc}을 설계하세요.

## 제품/서비스
- 이름: {input_data.product_name}

## 마케팅 컨셉 (기본)
- 컨셉명: {concept.get('concept_name', '')}
- 설명: {concept.get('concept_description', '')}
- 타겟: {concept.get('target_audience', '')}
- 핵심 메시지: {concept.get('key_message', '')}
- 톤앤매너: {concept.get('tone_and_manner', '')}
- 비주얼 스타일: {concept.get('visual_style', '')}

## 전략적 인사이트 (ConceptV1)
- 타겟 인사이트: {audience_insight}
- 핵심 약속 (Core Promise): {core_promise}
- 브랜드 역할: {brand_role}
{rtb_text}
- 크리에이티브 디바이스: {creative_device}
- 프레젠테이션 채널 전략: {presentation_strategy}
{guardrails_text}

## 비주얼 세계관{visual_world_text}

## 프레젠테이션 구조 가이드

**필수 슬라이드 유형:**
1. title: 제목 슬라이드 (브랜드, 슬로건)
2. problem: 문제 제기 (고객 Pain Point)
3. solution: 해결책 제시
4. features: 핵심 기능/특징 (3-4개)
5. benefits: 고객 혜택 (수치화된 결과)
6. how_it_works: 작동 방식/프로세스
7. social_proof: 사례/후기/수치 (신뢰 구축)
8. cta: 행동 유도 (다음 단계)

**선택 슬라이드 유형:**
- comparison: 경쟁사 비교
- pricing: 가격 정보
- team: 팀 소개
- roadmap: 로드맵

## 고품질 슬라이드 작성 원칙

1. **제목**: 청중이 기억할 수 있는 간결하고 임팩트 있는 문구 (10자 이내)
2. **본문 포인트**: 3-5개, 각 포인트는 한 줄로 요약 (15자 이내)
3. **비주얼 제안**: 구체적인 이미지/차트/아이콘 설명
4. **레이아웃**:
   - standard: 제목 + 본문 + 이미지
   - two_column: 좌우 분할 (비교용)
   - full_image: 전면 이미지 + 오버레이 텍스트
   - stats: 숫자/통계 강조
{speaker_notes_instruction}

## 출력 형식 (JSON)
{{
    "title": "프레젠테이션 제목",
    "subtitle": "부제목",
    "target_audience": "대상 청중",
    "estimated_duration_minutes": 15,
    "slides": [
        {{
            "slide_number": 1,
            "slide_type": "title",
            "title": "슬라이드 제목",
            "subtitle": "부제목 (선택)",
            "body_points": ["포인트1", "포인트2", "포인트3"],
            "visual_suggestion": "구체적인 비주얼 설명",
            "speaker_notes": "발표자 노트 (선택)",
            "layout": "standard",
            "animation_hint": "fade_in (선택)"
        }}
    ],
    "design_guidelines": {{
        "primary_color": "#색상코드",
        "secondary_color": "#색상코드",
        "font_style": "폰트 스타일 설명",
        "image_style": "이미지 스타일 설명"
    }}
}}

{input_data.slide_count}개 슬라이드를 생성하세요. 한국어로 작성하세요.
"""
        return prompt

    def _parse_output(
        self, llm_output: Any, input_data: PresentationInput
    ) -> PresentationOutput:
        """LLM 출력 파싱"""

        if isinstance(llm_output, dict):
            data = llm_output
        elif isinstance(llm_output, str):
            try:
                data = json.loads(llm_output)
            except json.JSONDecodeError:
                import re
                json_match = re.search(r'\{[\s\S]*\}', llm_output)
                if json_match:
                    data = json.loads(json_match.group())
                else:
                    raise ValueError("Cannot parse LLM output as JSON")
        else:
            raise ValueError(f"Unexpected output type: {type(llm_output)}")

        # 슬라이드 파싱
        slides = []
        for i, slide_data in enumerate(data.get("slides", [])):
            slide = SlideOutput(
                slide_number=slide_data.get("slide_number", i + 1),
                slide_type=slide_data.get("slide_type", "content"),
                title=slide_data.get("title", f"슬라이드 {i + 1}"),
                subtitle=slide_data.get("subtitle"),
                body_points=slide_data.get("body_points", []),
                visual_suggestion=slide_data.get("visual_suggestion", ""),
                speaker_notes=slide_data.get("speaker_notes") if input_data.include_speaker_notes else None,
                layout=slide_data.get("layout", "standard"),
                animation_hint=slide_data.get("animation_hint")
            )
            slides.append(slide)

        # 디자인 가이드라인 기본값
        design_guidelines = data.get("design_guidelines", {
            "primary_color": "#4F46E5",
            "secondary_color": "#10B981",
            "font_style": "모던하고 깔끔한 산세리프체",
            "image_style": "고품질 비즈니스 이미지"
        })

        return PresentationOutput(
            title=data.get("title", f"{input_data.product_name} 프레젠테이션"),
            subtitle=data.get("subtitle", input_data.concept.get("key_message", "")),
            target_audience=data.get("target_audience", input_data.concept.get("target_audience", "")),
            estimated_duration_minutes=data.get("estimated_duration_minutes", len(slides) * 2),
            slides=slides,
            design_guidelines=design_guidelines
        )


# =============================================================================
# Factory Function
# =============================================================================

def get_presentation_agent(llm_gateway=None) -> PresentationAgent:
    """PresentationAgent 인스턴스 반환"""
    return PresentationAgent(llm_gateway=llm_gateway)
