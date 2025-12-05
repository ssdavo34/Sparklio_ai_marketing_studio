"""
Content Generator Agent v1.0

확정된 컨셉(ConceptV1)을 기반으로 채널별 상세 콘텐츠 생성
- 프레젠테이션: 슬라이드별 제목, 본문, 불릿, 이미지 프롬프트
- 상세페이지: 섹션별 헤드라인, 설명, 기능, 이미지 프롬프트
- 인스타그램: 광고별 카피, 해시태그, 이미지 프롬프트

작성일: 2025-12-05
작성자: B팀 (Backend)
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
    AgentError,
)

logger = logging.getLogger(__name__)


# =============================================================================
# Input/Output Schemas
# =============================================================================

class ContentGenerationInput(BaseModel):
    """ContentGenerator 입력"""
    concept: Dict[str, Any] = Field(..., description="확정된 컨셉 (ConceptV1)")
    channels: List[str] = Field(
        default=["presentation", "detail_page", "instagram"],
        description="생성할 채널 목록"
    )
    presentation_config: Optional[Dict[str, Any]] = Field(
        default=None,
        description="프레젠테이션 설정 (slide_count, aspect_ratio 등)"
    )
    detail_page_config: Optional[Dict[str, Any]] = Field(
        default=None,
        description="상세페이지 설정 (section_count 등)"
    )
    instagram_config: Optional[Dict[str, Any]] = Field(
        default=None,
        description="인스타그램 설정 (ad_count, format 등)"
    )


# =============================================================================
# Presentation Slide Schema
# =============================================================================

class PresentationSlide(BaseModel):
    """프레젠테이션 슬라이드"""
    slide_number: int
    slide_type: str  # cover, agenda, problem, solution, features, benefits, stats, quote, cta, thank_you
    headline: str
    subheadline: Optional[str] = None
    body: Optional[str] = None
    bullets: Optional[List[str]] = None
    stats: Optional[List[Dict[str, str]]] = None  # [{"value": "50%", "label": "효율 향상"}]
    quote: Optional[Dict[str, str]] = None  # {"text": "...", "author": "..."}
    cta: Optional[Dict[str, str]] = None  # {"headline": "...", "button_text": "..."}
    image_prompt: Optional[str] = None
    layout: str = "left_image"  # left_image, right_image, full_image, no_image, split


class PresentationContent(BaseModel):
    """프레젠테이션 전체 콘텐츠"""
    title: str
    slides: List[PresentationSlide]
    brand_style: Dict[str, Any]


# =============================================================================
# Detail Page Section Schema
# =============================================================================

class DetailPageSection(BaseModel):
    """상세페이지 섹션"""
    section_number: int
    section_type: str  # hero, problem, solution, features, benefits, how_it_works, testimonial, pricing, faq, cta
    headline: str
    subheadline: Optional[str] = None
    body: Optional[str] = None
    features: Optional[List[Dict[str, str]]] = None  # [{"icon": "✨", "title": "...", "description": "..."}]
    benefits: Optional[List[Dict[str, str]]] = None  # [{"title": "...", "description": "..."}]
    steps: Optional[List[Dict[str, Any]]] = None  # [{"number": 1, "title": "...", "description": "..."}]
    testimonials: Optional[List[Dict[str, str]]] = None
    cta: Optional[Dict[str, str]] = None
    image_prompt: Optional[str] = None
    layout: str = "center"


class DetailPageContent(BaseModel):
    """상세페이지 전체 콘텐츠"""
    title: str
    sections: List[DetailPageSection]
    brand_style: Dict[str, Any]


# =============================================================================
# Instagram Ad Schema
# =============================================================================

class InstagramAd(BaseModel):
    """인스타그램 광고"""
    ad_number: int
    headline: str
    subheadline: Optional[str] = None
    cta: str
    hashtags: List[str] = []
    image_prompt: str
    layout: str = "text_overlay"  # text_overlay, text_bottom, text_top, minimal, bold
    format: str = "feed"  # feed, story


class InstagramContent(BaseModel):
    """인스타그램 광고 세트"""
    ads: List[InstagramAd]
    brand_style: Dict[str, Any]


# =============================================================================
# Combined Output
# =============================================================================

class GeneratedContent(BaseModel):
    """생성된 전체 콘텐츠"""
    concept_id: str
    concept_name: str
    presentation: Optional[PresentationContent] = None
    detail_page: Optional[DetailPageContent] = None
    instagram: Optional[InstagramContent] = None
    generated_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())


# =============================================================================
# Content Generator Agent
# =============================================================================

class ContentGeneratorAgent(AgentBase):
    """
    Content Generator Agent v1.0

    확정된 컨셉을 기반으로 채널별 풍부한 콘텐츠를 LLM으로 생성합니다.
    """

    @property
    def name(self) -> str:
        return "content_generator"

    async def execute(self, request: AgentRequest) -> AgentResponse:
        """콘텐츠 생성 실행"""
        start_time = datetime.utcnow()

        # 입력 검증
        self._validate_request(request)

        try:
            input_data = ContentGenerationInput(**request.payload)
        except Exception as e:
            raise AgentError(
                message=f"Invalid input: {str(e)}",
                agent=self.name,
                details={"payload": request.payload}
            )

        concept = input_data.concept
        concept_id = concept.get("id", f"CONCEPT_{uuid.uuid4().hex[:8]}")
        concept_name = concept.get("name", "Unnamed Concept")

        logger.info(f"[ContentGenerator] Generating content for concept: {concept_name}")

        # 브랜드 스타일 추출
        visual_world = concept.get("visual_world", {})
        hex_colors = visual_world.get("hex_colors", ["#6366f1", "#8b5cf6", "#f59e0b"])

        brand_style = {
            "primaryColor": hex_colors[0] if len(hex_colors) > 0 else "#6366f1",
            "secondaryColor": hex_colors[1] if len(hex_colors) > 1 else "#8b5cf6",
            "accentColor": hex_colors[2] if len(hex_colors) > 2 else "#f59e0b",
            "backgroundColor": "#ffffff",
            "textColor": "#1f2937",
            "headingFont": "Pretendard, sans-serif",
            "bodyFont": "Pretendard, sans-serif",
        }

        result = GeneratedContent(
            concept_id=concept_id,
            concept_name=concept_name,
        )

        # 채널별 콘텐츠 생성
        channels = input_data.channels

        if "presentation" in channels:
            config = input_data.presentation_config or {"slide_count": 10}
            presentation = await self._generate_presentation(concept, brand_style, config)
            result.presentation = presentation

        if "detail_page" in channels:
            config = input_data.detail_page_config or {"section_count": 8}
            detail_page = await self._generate_detail_page(concept, brand_style, config)
            result.detail_page = detail_page

        if "instagram" in channels:
            config = input_data.instagram_config or {"ad_count": 3, "format": "feed"}
            instagram = await self._generate_instagram(concept, brand_style, config)
            result.instagram = instagram

        elapsed = (datetime.utcnow() - start_time).total_seconds()

        logger.info(f"[ContentGenerator] Generated content in {elapsed:.2f}s")

        return AgentResponse(
            agent=self.name,
            task=request.task,
            outputs=[
                self._create_output(
                    output_type="json",
                    name="generated_content",
                    value=result.model_dump(),
                    meta={"channels": channels}
                )
            ],
            usage={"elapsed_seconds": elapsed},
            meta={"concept_id": concept_id, "channels": channels}
        )

    async def _generate_presentation(
        self,
        concept: Dict[str, Any],
        brand_style: Dict[str, Any],
        config: Dict[str, Any]
    ) -> PresentationContent:
        """프레젠테이션 콘텐츠 LLM 생성"""

        slide_count = config.get("slide_count", 10)

        prompt = self._build_presentation_prompt(concept, slide_count)

        try:
            llm_response = await self.llm_gateway.generate(
                role=self.name,
                task="generate_presentation",
                payload={"prompt": prompt},
                mode="json",
                override_model="gemini-2.0-flash",
                options={"temperature": 0.7, "max_tokens": 8000}
            )

            data = llm_response.output.value
            if isinstance(data, str):
                data = json.loads(data)

            slides = []
            for i, slide_data in enumerate(data.get("slides", [])):
                slide = PresentationSlide(
                    slide_number=i + 1,
                    slide_type=slide_data.get("slide_type", "content"),
                    headline=slide_data.get("headline", ""),
                    subheadline=slide_data.get("subheadline"),
                    body=slide_data.get("body"),
                    bullets=slide_data.get("bullets"),
                    stats=slide_data.get("stats"),
                    quote=slide_data.get("quote"),
                    cta=slide_data.get("cta"),
                    image_prompt=slide_data.get("image_prompt"),
                    layout=slide_data.get("layout", "left_image")
                )
                slides.append(slide)

            return PresentationContent(
                title=concept.get("name", "프레젠테이션"),
                slides=slides,
                brand_style=brand_style
            )

        except Exception as e:
            logger.error(f"[ContentGenerator] Presentation generation failed: {e}")
            # 폴백: 기본 슬라이드 생성
            return self._create_fallback_presentation(concept, brand_style, slide_count)

    async def _generate_detail_page(
        self,
        concept: Dict[str, Any],
        brand_style: Dict[str, Any],
        config: Dict[str, Any]
    ) -> DetailPageContent:
        """상세페이지 콘텐츠 LLM 생성"""

        section_count = config.get("section_count", 8)

        prompt = self._build_detail_page_prompt(concept, section_count)

        try:
            llm_response = await self.llm_gateway.generate(
                role=self.name,
                task="generate_detail_page",
                payload={"prompt": prompt},
                mode="json",
                override_model="gemini-2.0-flash",
                options={"temperature": 0.7, "max_tokens": 8000}
            )

            data = llm_response.output.value
            if isinstance(data, str):
                data = json.loads(data)

            sections = []
            for i, section_data in enumerate(data.get("sections", [])):
                section = DetailPageSection(
                    section_number=i + 1,
                    section_type=section_data.get("section_type", "content"),
                    headline=section_data.get("headline", ""),
                    subheadline=section_data.get("subheadline"),
                    body=section_data.get("body"),
                    features=section_data.get("features"),
                    benefits=section_data.get("benefits"),
                    steps=section_data.get("steps"),
                    testimonials=section_data.get("testimonials"),
                    cta=section_data.get("cta"),
                    image_prompt=section_data.get("image_prompt"),
                    layout=section_data.get("layout", "center")
                )
                sections.append(section)

            return DetailPageContent(
                title=concept.get("name", "상세페이지"),
                sections=sections,
                brand_style=brand_style
            )

        except Exception as e:
            logger.error(f"[ContentGenerator] Detail page generation failed: {e}")
            return self._create_fallback_detail_page(concept, brand_style, section_count)

    async def _generate_instagram(
        self,
        concept: Dict[str, Any],
        brand_style: Dict[str, Any],
        config: Dict[str, Any]
    ) -> InstagramContent:
        """인스타그램 광고 콘텐츠 LLM 생성"""

        ad_count = config.get("ad_count", 3)
        ad_format = config.get("format", "feed")

        prompt = self._build_instagram_prompt(concept, ad_count, ad_format)

        try:
            llm_response = await self.llm_gateway.generate(
                role=self.name,
                task="generate_instagram",
                payload={"prompt": prompt},
                mode="json",
                override_model="gemini-2.0-flash",
                options={"temperature": 0.8, "max_tokens": 4000}
            )

            data = llm_response.output.value
            if isinstance(data, str):
                data = json.loads(data)

            ads = []
            for i, ad_data in enumerate(data.get("ads", [])):
                ad = InstagramAd(
                    ad_number=i + 1,
                    headline=ad_data.get("headline", ""),
                    subheadline=ad_data.get("subheadline"),
                    cta=ad_data.get("cta", "자세히 보기"),
                    hashtags=ad_data.get("hashtags", []),
                    image_prompt=ad_data.get("image_prompt", ""),
                    layout=ad_data.get("layout", "text_overlay"),
                    format=ad_format
                )
                ads.append(ad)

            return InstagramContent(
                ads=ads,
                brand_style=brand_style
            )

        except Exception as e:
            logger.error(f"[ContentGenerator] Instagram generation failed: {e}")
            return self._create_fallback_instagram(concept, brand_style, ad_count, ad_format)

    # =========================================================================
    # Prompt Builders
    # =========================================================================

    def _build_presentation_prompt(self, concept: Dict[str, Any], slide_count: int) -> str:
        """프레젠테이션 생성 프롬프트"""

        return f"""당신은 전문 프레젠테이션 디자이너입니다.

## 컨셉 정보
- 이름: {concept.get('name', '')}
- 핵심 약속: {concept.get('core_promise', '')}
- 타겟: {concept.get('target_audience', '')}
- 인사이트: {concept.get('audience_insight', '')}
- 브랜드 역할: {concept.get('brand_role', '')}
- 크리에이티브 장치: {concept.get('creative_device', '')}
- 훅 패턴: {', '.join(concept.get('hook_patterns', []))}
- 믿음의 근거: {', '.join(concept.get('reason_to_believe', []))}
- 톤앤매너: {concept.get('tone_and_manner', '')}
- 키워드: {', '.join(concept.get('keywords', []))}

## 요구사항
{slide_count}장의 프레젠테이션 슬라이드를 생성하세요.

슬라이드 구성:
1. cover (표지) - 강렬한 헤드라인과 서브헤드라인
2. agenda (목차) - 발표 흐름 소개
3. problem (문제) - 타겟이 겪는 문제/고충 (Pain Point 3개)
4. solution (솔루션) - 우리의 해결책 소개
5. features (기능) - 주요 기능 3-4개
6. benefits (혜택) - 고객이 얻는 혜택 3개
7. stats (통계) - 인상적인 숫자 데이터 3개
8. how_it_works (사용방법) - 3단계 사용 프로세스
9. cta (행동유도) - 강력한 CTA
10. thank_you (마무리) - 감사 인사와 연락처

각 슬라이드는 풍부하고 설득력 있는 콘텐츠를 포함해야 합니다.
이미지 프롬프트는 SDXL로 생성할 수 있는 구체적인 영문 프롬프트여야 합니다.

## 출력 형식 (JSON)
{{
  "slides": [
    {{
      "slide_type": "cover",
      "headline": "강렬한 메인 헤드라인",
      "subheadline": "서브헤드라인",
      "image_prompt": "professional hero image, modern office, technology concept, high quality, 4k",
      "layout": "full_image"
    }},
    {{
      "slide_type": "problem",
      "headline": "이런 문제, 겪어보셨나요?",
      "bullets": [
        "Pain Point 1: 구체적인 문제 설명",
        "Pain Point 2: 구체적인 문제 설명",
        "Pain Point 3: 구체적인 문제 설명"
      ],
      "image_prompt": "frustrated person at desk, problem concept, realistic photo",
      "layout": "left_image"
    }},
    {{
      "slide_type": "stats",
      "headline": "숫자로 보는 효과",
      "stats": [
        {{"value": "50%", "label": "시간 절약"}},
        {{"value": "3X", "label": "효율 향상"}},
        {{"value": "99%", "label": "고객 만족도"}}
      ],
      "layout": "no_image"
    }},
    {{
      "slide_type": "cta",
      "headline": "지금 시작하세요",
      "cta": {{
        "headline": "CTA 헤드라인",
        "button_text": "무료로 시작하기"
      }},
      "image_prompt": "success celebration, achievement, bright future concept",
      "layout": "full_image"
    }}
  ]
}}

한국어로 콘텐츠를 작성하고, image_prompt만 영어로 작성하세요.
"""

    def _build_detail_page_prompt(self, concept: Dict[str, Any], section_count: int) -> str:
        """상세페이지 생성 프롬프트"""

        return f"""당신은 전문 상세페이지 카피라이터입니다.

## 컨셉 정보
- 이름: {concept.get('name', '')}
- 핵심 약속: {concept.get('core_promise', '')}
- 타겟: {concept.get('target_audience', '')}
- 인사이트: {concept.get('audience_insight', '')}
- 브랜드 역할: {concept.get('brand_role', '')}
- 크리에이티브 장치: {concept.get('creative_device', '')}
- 훅 패턴: {', '.join(concept.get('hook_patterns', []))}
- 믿음의 근거: {', '.join(concept.get('reason_to_believe', []))}
- 톤앤매너: {concept.get('tone_and_manner', '')}

## 요구사항
{section_count}개의 상세페이지 섹션을 생성하세요.

섹션 구성:
1. hero - 강렬한 히어로 배너 (헤드라인 + CTA)
2. problem - 고객의 문제/고충 공감
3. solution - 솔루션 소개
4. features - 주요 기능 (아이콘 + 설명) 4-6개
5. benefits - 혜택 3개
6. how_it_works - 사용 방법 3단계
7. testimonial - 고객 후기 3개
8. cta - 최종 CTA

각 섹션은 전환율을 높이는 설득력 있는 카피를 포함해야 합니다.

## 출력 형식 (JSON)
{{
  "sections": [
    {{
      "section_type": "hero",
      "headline": "강력한 헤드라인",
      "subheadline": "서브헤드라인으로 핵심 가치 전달",
      "cta": {{"headline": "CTA 문구", "button_text": "시작하기"}},
      "image_prompt": "hero banner, modern product showcase, professional photography",
      "layout": "center"
    }},
    {{
      "section_type": "features",
      "headline": "주요 기능",
      "subheadline": "이런 것들이 가능해집니다",
      "features": [
        {{"icon": "✨", "title": "기능 1", "description": "상세 설명"}},
        {{"icon": "🚀", "title": "기능 2", "description": "상세 설명"}},
        {{"icon": "💡", "title": "기능 3", "description": "상세 설명"}},
        {{"icon": "🎯", "title": "기능 4", "description": "상세 설명"}}
      ],
      "layout": "grid"
    }},
    {{
      "section_type": "testimonial",
      "headline": "고객 후기",
      "testimonials": [
        {{"quote": "후기 내용", "author": "김OO", "role": "마케팅 팀장"}},
        {{"quote": "후기 내용", "author": "이OO", "role": "스타트업 대표"}}
      ],
      "layout": "center"
    }}
  ]
}}

한국어로 콘텐츠를 작성하고, image_prompt만 영어로 작성하세요.
"""

    def _build_instagram_prompt(self, concept: Dict[str, Any], ad_count: int, ad_format: str) -> str:
        """인스타그램 광고 생성 프롬프트"""

        format_desc = "정사각형 (1:1)" if ad_format == "feed" else "세로형 (9:16)"
        aspect_ratio = "1:1, square composition" if ad_format == "feed" else "9:16, vertical composition"

        # 비주얼 월드에서 색상 추출
        visual_world = concept.get('visual_world', {})
        color_palette = visual_world.get('palette', '')
        color_mood = visual_world.get('mood', '')
        hex_colors = visual_world.get('hex_colors', [])
        color_desc = f", color scheme: {' '.join(hex_colors)}" if hex_colors else ""

        return f"""당신은 세계적인 인스타그램 광고 크리에이티브 디렉터입니다.

## 컨셉 정보
- 브랜드/제품명: {concept.get('name', '')}
- 핵심 약속 (Core Promise): {concept.get('core_promise', '')}
- 타겟 오디언스: {concept.get('target_audience', '')}
- 오디언스 인사이트: {concept.get('audience_insight', '')}
- 브랜드 역할: {concept.get('brand_role', '')}
- 훅 패턴: {', '.join(concept.get('hook_patterns', []))}
- 톤앤매너: {concept.get('tone_and_manner', '')}
- 키워드: {', '.join(concept.get('keywords', []))}
- 비주얼 무드: {color_mood}
- 컬러 팔레트: {color_palette}

## 요구사항
{ad_count}개의 인스타그램 광고를 생성하세요.
포맷: {format_desc}

각 광고는 서로 다른 접근 방식을 사용해야 합니다:
1. 첫 번째: 감성적/공감형 - 타겟의 Pain Point에 깊이 공감하는 스토리텔링
2. 두 번째: 혜택 강조형 - 구체적이고 측정 가능한 이점 제시
3. 세 번째: 행동 유도형 - 긴급성과 희소성을 활용한 강력한 CTA

## 이미지 프롬프트 작성 가이드라인
image_prompt는 SDXL/Stable Diffusion으로 생성할 수 있는 고품질 프롬프트여야 합니다.
다음 요소를 반드시 포함하세요:

1. **주제/피사체**: 무엇을 보여줄지 구체적으로 (예: "happy Korean woman in her 30s using smartphone")
2. **스타일**: 사진 스타일 명시 (예: "professional product photography", "lifestyle photography", "flat lay")
3. **조명**: 조명 설정 (예: "soft natural lighting", "studio lighting", "golden hour")
4. **구도**: 카메라 앵글 (예: "close-up shot", "medium shot", "bird's eye view")
5. **배경**: 배경 설정 (예: "minimalist white background", "cozy home interior", "urban street")
6. **분위기**: 전체 무드 (예: "warm and inviting", "modern and sleek", "vibrant and energetic")
7. **품질 태그**: "8k, high resolution, professional quality, sharp focus"

피해야 할 것: "text", "watermark", "logo", "blurry", "low quality"

## 출력 형식 (JSON)
{{
  "ads": [
    {{
      "headline": "스크롤을 멈추게 하는 강력한 헤드라인 (15-25자)",
      "subheadline": "핵심 가치를 전달하는 보조 문구 (20-40자)",
      "cta": "행동 유도 버튼 텍스트 (예: 지금 시작하기, 무료 체험, 자세히 보기)",
      "hashtags": ["#관련해시태그", "#브랜드해시태그", "#트렌드해시태그"],
      "image_prompt": "detailed SDXL prompt here, {aspect_ratio}{color_desc}, professional advertising photography, trending on instagram, high engagement visual, 8k ultra detailed",
      "layout": "text_overlay"
    }}
  ]
}}

## 중요 지침
- 헤드라인은 3초 안에 관심을 끌어야 합니다. 숫자, 질문, 놀라움 요소 활용
- 해시태그는 5-7개, 검색량이 높고 관련성 있는 것으로 선택
- image_prompt는 50단어 이상의 상세한 영문 프롬프트로 작성
- 한국어로 콘텐츠를 작성하고, image_prompt만 영어로 작성하세요
"""

    # =========================================================================
    # Fallback Generators
    # =========================================================================

    def _create_fallback_presentation(
        self,
        concept: Dict[str, Any],
        brand_style: Dict[str, Any],
        slide_count: int
    ) -> PresentationContent:
        """폴백 프레젠테이션 생성"""

        name = concept.get("name", "제품")
        promise = concept.get("core_promise", "")
        hooks = concept.get("hook_patterns", [])

        slides = [
            PresentationSlide(
                slide_number=1,
                slide_type="cover",
                headline=hooks[0] if hooks else f"{name}을 소개합니다",
                subheadline=promise,
                image_prompt=f"professional hero image for {name}, modern, high quality",
                layout="full_image"
            ),
            PresentationSlide(
                slide_number=2,
                slide_type="problem",
                headline="이런 문제, 겪어보셨나요?",
                bullets=[
                    "기존 방식의 비효율성",
                    "시간과 비용의 낭비",
                    "만족스럽지 못한 결과"
                ],
                image_prompt="frustrated person, problem concept, realistic",
                layout="left_image"
            ),
        ]

        return PresentationContent(
            title=name,
            slides=slides[:slide_count],
            brand_style=brand_style
        )

    def _create_fallback_detail_page(
        self,
        concept: Dict[str, Any],
        brand_style: Dict[str, Any],
        section_count: int
    ) -> DetailPageContent:
        """폴백 상세페이지 생성"""

        name = concept.get("name", "제품")
        promise = concept.get("core_promise", "")

        sections = [
            DetailPageSection(
                section_number=1,
                section_type="hero",
                headline=promise or f"{name}으로 시작하세요",
                subheadline="더 나은 결과를 경험하세요",
                cta={"headline": "지금 시작하기", "button_text": "무료 체험"},
                image_prompt=f"hero banner for {name}, professional, modern",
                layout="center"
            ),
        ]

        return DetailPageContent(
            title=name,
            sections=sections[:section_count],
            brand_style=brand_style
        )

    def _create_fallback_instagram(
        self,
        concept: Dict[str, Any],
        brand_style: Dict[str, Any],
        ad_count: int,
        ad_format: str
    ) -> InstagramContent:
        """폴백 인스타그램 광고 생성"""

        name = concept.get("name", "제품")
        hooks = concept.get("hook_patterns", [])
        keywords = concept.get("keywords", [])

        ads = []
        for i in range(ad_count):
            headline = hooks[i] if i < len(hooks) else f"{name} 지금 만나보세요"
            ads.append(InstagramAd(
                ad_number=i + 1,
                headline=headline[:20],
                cta="자세히 보기",
                hashtags=[f"#{k}" for k in keywords[:5]],
                image_prompt=f"instagram ad for {name}, trendy, eye-catching, {ad_format}",
                layout="text_overlay",
                format=ad_format
            ))

        return InstagramContent(
            ads=ads,
            brand_style=brand_style
        )


# =============================================================================
# Factory Function
# =============================================================================

def get_content_generator_agent(llm_gateway=None) -> ContentGeneratorAgent:
    """ContentGeneratorAgent 인스턴스 반환"""
    return ContentGeneratorAgent(llm_gateway=llm_gateway)
