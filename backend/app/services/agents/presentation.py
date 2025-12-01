"""
Presentation Agent (Demo Day)

컨셉 기반 프레젠테이션 슬라이드 구조 및 내용 생성

작성일: 2025-11-30
작성자: B팀 (Backend)

LLM: Claude 3.5 Haiku
출력: 12-15개 슬라이드 구조 (Sparklio Vision Deck 지원)
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
        description="프레젠테이션 유형 (pitch, sales, internal, investor, vision)"
    )
    slide_count: int = Field(default=12, ge=5, le=20, description="슬라이드 수")
    include_speaker_notes: bool = Field(default=True, description="발표자 노트 포함")


class SlideOutput(BaseModel):
    """슬라이드 출력"""
    slide_number: int = Field(..., description="슬라이드 번호")
    slide_type: str = Field(..., description="슬라이드 유형 (vision, system_architecture, roadmap, team 등)")
    title: str = Field(..., description="슬라이드 제목")
    subtitle: Optional[str] = Field(None, description="부제목")
    body_points: List[str] = Field(default_factory=list, description="본문 포인트 (3-5개)")
    visual_suggestion: str = Field(..., description="비주얼 제안 (이미지/차트/아이콘 설명)")
    speaker_notes: Optional[str] = Field(None, description="발표자 노트")
    layout: str = Field(default="standard", description="레이아웃 (standard, two_column, full_image, stats, process)")
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
    Sparklio Vision Deck을 포함한 다양한 프레젠테이션 유형을 지원합니다.
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
            # LLM 호출 시도
            llm_response = await self.llm_gateway.generate(
                role=self.name,
                task="generate_presentation",
                payload={"prompt": prompt},
                mode="json",
                override_model="claude-3-5-haiku-20241022",
                options={
                    "temperature": 0.7,
                    "max_tokens": 4000
                }
            )
            output_data = self._parse_output(llm_response.output.value, input_data)
            
        except Exception as e:
            logger.error(f"[PresentationAgent] LLM generation failed: {e}. Using Mock Fallback.")
            # 실패 시 Mock 데이터 사용
            output_data = self._get_mock_data(input_data)

        return AgentResponse(
            agent=self.name,
            task=request.task,
            status="completed",
            outputs=[
                {
                    "type": "json",
                    "name": "presentation",
                    "value": output_data.model_dump()
                }
            ],
            execution_time=(datetime.utcnow() - start_time).total_seconds()
        )



    def _build_prompt(self, input_data: PresentationInput) -> str:
        """프롬프트 생성 (V2 고도화 - 콘텐츠 품질 향상)"""
        concept = input_data.concept

        presentation_type_desc = {
            "pitch": "투자자/파트너를 위한 피치 덱",
            "sales": "영업/세일즈를 위한 제품 소개 자료",
            "internal": "내부 팀을 위한 프로젝트 소개",
            "investor": "투자 유치를 위한 IR 자료",
            "vision": "Sparklio 비전 및 로드맵 발표 자료 (Vision Deck)"
        }

        type_desc = presentation_type_desc.get(
            input_data.presentation_type,
            "일반 프레젠테이션"
        )

        speaker_notes_instruction = ""
        if input_data.include_speaker_notes:
            speaker_notes_instruction = "- speaker_notes: 발표자 노트 (1-2문장)"

        prompt = f"""당신은 최고 수준의 프레젠테이션 전문가입니다.

## 제품/서비스: {input_data.product_name}
## 프레젠테이션 유형: {type_desc}
## 컨셉: {concept.get('concept_name', '')} - {concept.get('concept_description', '')}
## 타겟: {concept.get('target_audience', '일반 청중')}
## 핵심 메시지: {concept.get('key_message', input_data.product_name)}

---

## ⚠️ 슬라이드 작성 필수 원칙 (반드시 지켜야 함!)

### 1. 제목 규칙
- **10자 이내**, 임팩트 있는 한 줄
- 예: "문제의 핵심", "해결책 제시", "3배 성장"

### 2. 불릿 포인트 규칙
- **최대 4개**, 각 불릿은 **15자 이내**
- 구체적인 수치/데이터 포함 (예: "처리 속도 3배 향상", "비용 40% 절감")
- 절대 스크롤이 발생하지 않도록 짧게!

### 3. 레이아웃 (5종만 사용)
| layout | 용도 | 필수 요소 |
|--------|------|----------|
| `title_center` | 표지, 섹션 구분, CTA | 제목 + 부제목 (중앙 배치) |
| `two_column` | 문제-해결, 비교 | 좌: 텍스트/불릿, 우: 이미지 |
| `three_bullets` | 핵심 포인트 3개 | 3개 컬럼, 각 아이콘+텍스트 |
| `full_image` | 비전, 임팩트 | 전체 배경 이미지 + 오버레이 텍스트 |
| `stats` | 숫자/통계 강조 | 큰 숫자 3개 + 라벨 |

### 4. 슬라이드별 레이아웃 매핑
- 슬라이드 1 (표지): `title_center`
- 슬라이드 2-3 (문제/해결): `two_column`
- 슬라이드 4-5 (기능/장점): `three_bullets`
- 슬라이드 6-7 (데이터/성과): `stats`
- 슬라이드 8-10 (상세): `two_column`
- 슬라이드 11 (임팩트): `full_image`
- 슬라이드 12 (CTA): `title_center`

---

## Pitch Deck 구조 ({input_data.slide_count}장)

1. **Title** (title_center): 회사/제품명 + 한 줄 슬로건
2. **Problem** (two_column): 시장의 문제점 3가지
3. **Solution** (two_column): 우리의 해결책 개요
4. **Features** (three_bullets): 핵심 기능 3가지
5. **Benefits** (stats): ROI 수치 3개 (예: 3배, 40%, $1M)
6. **How It Works** (two_column): 작동 원리 설명
7. **Market** (stats): TAM/SAM/SOM 또는 시장 규모
8. **Competition** (two_column): 경쟁 우위 비교
9. **Business Model** (three_bullets): 수익 모델 3가지
10. **Traction** (stats): 현재 성과 수치
11. **Team** (two_column): 팀 소개
12. **CTA** (title_center): 연락처 + 다음 단계

---

## 출력 형식 (JSON)

```json
{{
    "title": "프레젠테이션 제목 (10자 이내)",
    "subtitle": "부제목 (20자 이내)",
    "target_audience": "대상 청중",
    "estimated_duration_minutes": 15,
    "slides": [
        {{
            "slide_number": 1,
            "slide_type": "cover",
            "title": "제목 (10자 이내)",
            "subtitle": "부제목",
            "body_points": ["불릿1 (15자 이내)", "불릿2", "불릿3"],
            "visual_suggestion": "구체적인 이미지 설명 (검색 키워드 형태)",
            "speaker_notes": "발표자 노트 (선택)",
            "layout": "title_center"
        }}
    ],
    "design_guidelines": {{
        "primary_color": "#4F46E5",
        "secondary_color": "#10B981",
        "font_style": "Pretendard, 모던 산세리프",
        "image_style": "고품질 비즈니스 이미지"
    }}
}}
```

{speaker_notes_instruction}

⚠️ 중요:
- 모든 텍스트는 **한국어**로 작성
- 제목은 반드시 **10자 이내**
- 불릿은 **4개 이하**, 각 **15자 이내**
- 구체적인 **수치/데이터** 포함 (가상이어도 OK)
- visual_suggestion은 **Unsplash 검색 키워드** 형태로 (예: "business meeting", "technology abstract")

{input_data.slide_count}개 슬라이드를 생성하세요.
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
                slide_type=slide_data.get("slide_type", "default"),
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

    def _get_mock_data(self, input_data: PresentationInput) -> PresentationOutput:
        """Mock 데이터 생성 (Fallback)"""
        slides = []
        titles = [
            "Vision & Mission", "Problem Statement", "Why Now?", "Solution Overview",
            "Core Technology", "Market Opportunity", "Business Model", "Go-to-Market Strategy",
            "Competitive Advantage", "Financial Projections", "Team", "Vision & Roadmap"
        ]
        
        for i in range(input_data.slide_count):
            title = titles[i] if i < len(titles) else f"Slide {i+1}"
            slide_type = "default"
            layout = "standard"
            
            if i == 0:
                slide_type = "cover"
                layout = "full_image"
            elif i == 1:
                slide_type = "problem"
                layout = "two_column"
            elif i == 4:
                slide_type = "tech"
                layout = "process"
            elif i == 6:
                slide_type = "business"
                layout = "stats"
                
            slides.append(SlideOutput(
                slide_number=i + 1,
                slide_type=slide_type,
                title=title,
                subtitle=f"{input_data.product_name}의 {title}",
                body_points=[
                    f"핵심 포인트 1: {title}에 대한 설명",
                    f"핵심 포인트 2: {input_data.product_name}의 장점",
                    "핵심 포인트 3: 시장의 반응 및 데이터"
                ],
                visual_suggestion=f"{title}를 표현하는 모던하고 전문적인 비주얼",
                speaker_notes=f"이 슬라이드에서는 {title}에 대해 설명합니다. 청중에게 핵심 메시지를 전달하세요.",
                layout=layout,
                animation_hint="fade_in"
            ))
            
        return PresentationOutput(
            title=f"{input_data.product_name} Pitch Deck",
            subtitle="AI Generated Presentation",
            target_audience=input_data.concept.get("target_audience", "General Audience"),
            estimated_duration_minutes=15,
            slides=slides,
            design_guidelines={
                "primary_color": "#4F46E5",
                "secondary_color": "#10B981",
                "font_style": "Pretendard",
                "image_style": "Modern Business"
            }
        )


# =============================================================================
# Factory Function
# =============================================================================

def get_presentation_agent(llm_gateway=None) -> PresentationAgent:
    """PresentationAgent 인스턴스 반환"""
    return PresentationAgent(llm_gateway=llm_gateway)
