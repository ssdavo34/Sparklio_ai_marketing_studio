"""
Product Detail Agent (Demo Day)

컨셉 기반 상세 페이지/랜딩 페이지 콘텐츠 생성

작성일: 2025-11-27
작성자: B팀 (Backend)

LLM: Gemini 2.0 Flash
출력: 섹션별 콘텐츠 (히어로, 기능, 혜택, FAQ, CTA 등)
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

class ProductDetailInput(BaseModel):
    """ProductDetailAgent 입력"""
    concept: Dict[str, Any] = Field(..., description="컨셉 정보")
    product_name: str = Field(..., description="제품/서비스명")
    product_type: str = Field(
        default="saas",
        description="제품 유형 (saas, ecommerce, service, app)"
    )
    key_features: Optional[List[str]] = Field(None, description="핵심 기능 목록")
    pricing_info: Optional[str] = Field(None, description="가격 정보")
    include_faq: bool = Field(default=True, description="FAQ 섹션 포함")


class HeroSectionOutput(BaseModel):
    """히어로 섹션"""
    headline: str = Field(..., description="메인 헤드라인 (10-15자)")
    subheadline: str = Field(..., description="서브 헤드라인 (20-30자)")
    description: str = Field(..., description="상세 설명 (2-3문장)")
    cta_primary: str = Field(..., description="주요 CTA 버튼 텍스트")
    cta_secondary: Optional[str] = Field(None, description="보조 CTA 버튼 텍스트")
    hero_image_description: str = Field(..., description="히어로 이미지 설명")
    trust_badges: List[str] = Field(default_factory=list, description="신뢰 배지 (수상, 인증 등)")


class FeatureItemOutput(BaseModel):
    """기능 항목"""
    title: str = Field(..., description="기능 제목")
    description: str = Field(..., description="기능 설명 (1-2문장)")
    icon_suggestion: str = Field(..., description="아이콘 제안")
    benefit: str = Field(..., description="이 기능의 고객 혜택")


class BenefitItemOutput(BaseModel):
    """혜택 항목"""
    headline: str = Field(..., description="혜택 헤드라인")
    description: str = Field(..., description="혜택 상세 설명")
    metric: Optional[str] = Field(None, description="수치/통계 (예: '50% 시간 절약')")
    image_description: str = Field(..., description="이미지/일러스트 설명")


class TestimonialOutput(BaseModel):
    """후기/사례"""
    quote: str = Field(..., description="후기 내용")
    author_name: str = Field(..., description="작성자 이름")
    author_title: str = Field(..., description="작성자 직책/회사")
    rating: int = Field(default=5, ge=1, le=5, description="평점")


class FAQItemOutput(BaseModel):
    """FAQ 항목"""
    question: str = Field(..., description="질문")
    answer: str = Field(..., description="답변 (2-3문장)")


class CTASectionOutput(BaseModel):
    """CTA 섹션"""
    headline: str = Field(..., description="CTA 헤드라인")
    description: str = Field(..., description="CTA 설명")
    button_text: str = Field(..., description="버튼 텍스트")
    urgency_text: Optional[str] = Field(None, description="긴급성 메시지")
    guarantee_text: Optional[str] = Field(None, description="보증 메시지")


class ProductDetailOutput(BaseModel):
    """ProductDetailAgent 전체 출력"""
    page_title: str = Field(..., description="페이지 제목 (SEO)")
    meta_description: str = Field(..., description="메타 설명 (SEO, 150자 이내)")
    hero: HeroSectionOutput = Field(..., description="히어로 섹션")
    problem_statement: str = Field(..., description="문제 정의 (2-3문장)")
    solution_statement: str = Field(..., description="해결책 제시 (2-3문장)")
    features: List[FeatureItemOutput] = Field(..., description="기능 목록")
    benefits: List[BenefitItemOutput] = Field(..., description="혜택 목록")
    testimonials: List[TestimonialOutput] = Field(..., description="후기 목록")
    faq: List[FAQItemOutput] = Field(default_factory=list, description="FAQ 목록")
    cta: CTASectionOutput = Field(..., description="CTA 섹션")
    seo_keywords: List[str] = Field(..., description="SEO 키워드")


# =============================================================================
# Product Detail Agent
# =============================================================================

class ProductDetailAgent(AgentBase):
    """
    Product Detail Agent

    마케팅 컨셉을 기반으로 고품질 상세 페이지/랜딩 페이지 콘텐츠를 생성합니다.

    섹션 구조:
    1. Hero: 첫인상, 메인 메시지
    2. Problem: 고객의 고통점 공감
    3. Solution: 우리의 해결책
    4. Features: 핵심 기능 (4-6개)
    5. Benefits: 고객 혜택 (3-4개, 수치화)
    6. Testimonials: 사회적 증거 (3개)
    7. FAQ: 자주 묻는 질문 (5-7개)
    8. CTA: 최종 행동 유도
    """

    @property
    def name(self) -> str:
        return "product_detail"

    async def execute(self, request: AgentRequest) -> AgentResponse:
        """상세 페이지 콘텐츠 생성"""
        start_time = datetime.utcnow()

        self._validate_request(request)

        try:
            input_data = ProductDetailInput(**request.payload)
        except Exception as e:
            raise AgentError(
                message=f"Invalid input: {str(e)}",
                agent=self.name,
                details={"payload": request.payload}
            )

        prompt = self._build_prompt(input_data)

        logger.info(
            f"[ProductDetailAgent] Generating landing page content "
            f"for {input_data.product_name}..."
        )

        try:
            llm_response = await self.llm_gateway.generate(
                role=self.name,
                task="generate_product_detail",
                payload={"prompt": prompt},
                mode="json",
                override_model="gemini-2.0-flash",
                options={
                    "temperature": 0.7,
                    "max_tokens": 12000
                }
            )
        except Exception as e:
            logger.error(f"[ProductDetailAgent] LLM call failed: {e}")
            raise AgentError(
                message=f"LLM generation failed: {str(e)}",
                agent=self.name,
                details={"input": input_data.model_dump()}
            )

        try:
            output_data = self._parse_output(llm_response.output.value, input_data)
        except Exception as e:
            logger.error(f"[ProductDetailAgent] Output parsing failed: {e}")
            raise AgentError(
                message=f"Output parsing failed: {str(e)}",
                agent=self.name,
                details={"llm_output": llm_response.output.value}
            )

        elapsed = (datetime.utcnow() - start_time).total_seconds()

        logger.info(
            f"[ProductDetailAgent] Generated content with "
            f"{len(output_data.features)} features, "
            f"{len(output_data.benefits)} benefits in {elapsed:.2f}s"
        )

        return AgentResponse(
            agent=self.name,
            task=request.task,
            outputs=[
                self._create_output(
                    output_type="json",
                    name="product_detail",
                    value=output_data.model_dump(),
                    meta={
                        "feature_count": len(output_data.features),
                        "benefit_count": len(output_data.benefits),
                        "faq_count": len(output_data.faq)
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
                "product_type": input_data.product_type
            }
        )

    def _build_prompt(self, input_data: ProductDetailInput) -> str:
        """프롬프트 생성 (ConceptV1 지원)"""
        concept = input_data.concept

        features_text = ""
        if input_data.key_features:
            features_text = f"- 핵심 기능: {', '.join(input_data.key_features)}"

        pricing_text = ""
        if input_data.pricing_info:
            pricing_text = f"- 가격 정보: {input_data.pricing_info}"

        # ConceptV1 전략 필드 추출
        audience_insight = concept.get('audience_insight', '')
        core_promise = concept.get('core_promise', '')
        brand_role = concept.get('brand_role', '')
        reason_to_believe = concept.get('reason_to_believe', [])
        creative_device = concept.get('creative_device', '')
        channel_strategy = concept.get('channel_strategy', {})
        guardrails = concept.get('guardrails', {})
        visual_world = concept.get('visual_world', {})

        # 상세페이지 채널 전략 (ConceptV1)
        product_detail_strategy = channel_strategy.get('product_detail', '') if isinstance(channel_strategy, dict) else ''

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

        faq_instruction = ""
        if input_data.include_faq:
            faq_instruction = """
## FAQ 섹션 (5-7개)
실제 고객이 궁금해할 질문들:
- 가격/요금 관련
- 사용 방법 관련
- 환불/취소 정책
- 기술 지원
- 경쟁사 대비 차별점"""

        prompt = f"""당신은 전환율 최적화(CRO) 전문 카피라이터입니다. 아래 정보를 바탕으로 고전환 랜딩 페이지 콘텐츠를 작성하세요.

## 제품/서비스
- 이름: {input_data.product_name}
- 유형: {input_data.product_type}
{features_text}
{pricing_text}

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
- 상세페이지 채널 전략: {product_detail_strategy}
{guardrails_text}

## 비주얼 세계관{visual_world_text}

## 고품질 랜딩 페이지 작성 원칙

### 1. 히어로 섹션
- headline: 고객의 욕구를 자극하는 강력한 헤드라인 (10-15자)
- subheadline: 구체적인 혜택 제시 (20-30자)
- CTA는 행동 지향적으로 ("무료 체험 시작", "지금 시작하기")

### 2. 문제-해결 프레임워크
- 고객이 공감할 수 있는 구체적인 문제점
- 우리가 제공하는 명확한 해결책

### 3. 기능 섹션 (4-6개)
- 각 기능은 고객 혜택과 연결
- 아이콘 제안 포함

### 4. 혜택 섹션 (3-4개)
- 가능하면 수치화 ("50% 시간 절약", "매출 2배 증가")
- 감정적 혜택도 포함

### 5. 사회적 증거 (3개)
- 실제 사용자 후기 스타일
- 구체적인 성과 포함
{faq_instruction}

### 6. CTA 섹션
- 긴급성 또는 희소성 메시지
- 위험 제거 (환불 보장 등)

## 출력 형식 (JSON)
{{
    "page_title": "SEO 최적화된 페이지 제목",
    "meta_description": "150자 이내 메타 설명",
    "hero": {{
        "headline": "메인 헤드라인",
        "subheadline": "서브 헤드라인",
        "description": "상세 설명",
        "cta_primary": "주요 CTA",
        "cta_secondary": "보조 CTA",
        "hero_image_description": "히어로 이미지 설명",
        "trust_badges": ["인증1", "인증2"]
    }},
    "problem_statement": "문제 정의",
    "solution_statement": "해결책 제시",
    "features": [
        {{
            "title": "기능 제목",
            "description": "기능 설명",
            "icon_suggestion": "아이콘 제안",
            "benefit": "고객 혜택"
        }}
    ],
    "benefits": [
        {{
            "headline": "혜택 헤드라인",
            "description": "상세 설명",
            "metric": "50% 절약",
            "image_description": "이미지 설명"
        }}
    ],
    "testimonials": [
        {{
            "quote": "후기 내용",
            "author_name": "작성자",
            "author_title": "직책/회사",
            "rating": 5
        }}
    ],
    "faq": [
        {{
            "question": "질문",
            "answer": "답변"
        }}
    ],
    "cta": {{
        "headline": "CTA 헤드라인",
        "description": "CTA 설명",
        "button_text": "버튼 텍스트",
        "urgency_text": "긴급성 메시지",
        "guarantee_text": "보증 메시지"
    }},
    "seo_keywords": ["키워드1", "키워드2"]
}}

한국어로 작성하세요. 전환율을 최대화하는 설득력 있는 카피를 작성해주세요.
"""
        return prompt

    def _parse_output(
        self, llm_output: Any, input_data: ProductDetailInput
    ) -> ProductDetailOutput:
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

        # Hero 섹션 파싱
        hero_data = data.get("hero", {})
        hero = HeroSectionOutput(
            headline=hero_data.get("headline", input_data.concept.get("key_message", "")),
            subheadline=hero_data.get("subheadline", ""),
            description=hero_data.get("description", ""),
            cta_primary=hero_data.get("cta_primary", "시작하기"),
            cta_secondary=hero_data.get("cta_secondary"),
            hero_image_description=hero_data.get("hero_image_description", ""),
            trust_badges=hero_data.get("trust_badges", [])
        )

        # Features 파싱
        features = []
        for f in data.get("features", []):
            features.append(FeatureItemOutput(
                title=f.get("title", ""),
                description=f.get("description", ""),
                icon_suggestion=f.get("icon_suggestion", ""),
                benefit=f.get("benefit", "")
            ))

        # Benefits 파싱
        benefits = []
        for b in data.get("benefits", []):
            benefits.append(BenefitItemOutput(
                headline=b.get("headline", ""),
                description=b.get("description", ""),
                metric=b.get("metric"),
                image_description=b.get("image_description", "")
            ))

        # Testimonials 파싱
        testimonials = []
        for t in data.get("testimonials", []):
            testimonials.append(TestimonialOutput(
                quote=t.get("quote", ""),
                author_name=t.get("author_name", ""),
                author_title=t.get("author_title", ""),
                rating=t.get("rating", 5)
            ))

        # FAQ 파싱
        faq = []
        if input_data.include_faq:
            for q in data.get("faq", []):
                faq.append(FAQItemOutput(
                    question=q.get("question", ""),
                    answer=q.get("answer", "")
                ))

        # CTA 섹션 파싱
        cta_data = data.get("cta", {})
        cta = CTASectionOutput(
            headline=cta_data.get("headline", "지금 시작하세요"),
            description=cta_data.get("description", ""),
            button_text=cta_data.get("button_text", "무료 체험"),
            urgency_text=cta_data.get("urgency_text"),
            guarantee_text=cta_data.get("guarantee_text")
        )

        return ProductDetailOutput(
            page_title=data.get("page_title", f"{input_data.product_name} - 공식 사이트"),
            meta_description=data.get("meta_description", "")[:160],
            hero=hero,
            problem_statement=data.get("problem_statement", ""),
            solution_statement=data.get("solution_statement", ""),
            features=features,
            benefits=benefits,
            testimonials=testimonials,
            faq=faq,
            cta=cta,
            seo_keywords=data.get("seo_keywords", [])
        )


# =============================================================================
# Factory Function
# =============================================================================

def get_product_detail_agent(llm_gateway=None) -> ProductDetailAgent:
    """ProductDetailAgent 인스턴스 반환"""
    return ProductDetailAgent(llm_gateway=llm_gateway)
