"""
Instagram Ads Agent (Demo Day)

컨셉 기반 인스타그램 광고 카피 및 비주얼 가이드 생성

작성일: 2025-11-27
작성자: B팀 (Backend)

LLM: Gemini 2.0 Flash
출력: 3-5개 광고 세트 (이미지 광고, 캐러셀, 릴스 등)
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

class InstagramAdsInput(BaseModel):
    """InstagramAdsAgent 입력"""
    concept: Dict[str, Any] = Field(..., description="컨셉 정보")
    product_name: str = Field(..., description="제품/서비스명")
    ad_objective: str = Field(
        default="conversion",
        description="광고 목표 (awareness, consideration, conversion)"
    )
    ad_count: int = Field(default=3, ge=1, le=5, description="생성할 광고 수")
    include_hashtags: bool = Field(default=True, description="해시태그 포함")
    cta_url: Optional[str] = Field(None, description="CTA 링크")


class SingleImageAdOutput(BaseModel):
    """단일 이미지 광고"""
    ad_name: str = Field(..., description="광고 이름")
    primary_text: str = Field(..., description="메인 텍스트 (125자 권장)")
    headline: str = Field(..., description="헤드라인 (40자 이내)")
    description: Optional[str] = Field(None, description="설명 (30자 이내)")
    cta_button: str = Field(..., description="CTA 버튼 (Learn More, Shop Now 등)")
    image_prompt: str = Field(..., description="이미지 생성용 프롬프트")
    image_style: str = Field(..., description="이미지 스타일 설명")
    text_overlay: Optional[str] = Field(None, description="이미지 위 텍스트 오버레이")


class CarouselAdOutput(BaseModel):
    """캐러셀 광고"""
    ad_name: str = Field(..., description="광고 이름")
    primary_text: str = Field(..., description="메인 텍스트")
    cards: List[Dict[str, str]] = Field(..., description="카드 목록 (headline, image_prompt)")
    cta_button: str = Field(..., description="CTA 버튼")


class ReelsAdOutput(BaseModel):
    """릴스 광고"""
    ad_name: str = Field(..., description="광고 이름")
    hook_text: str = Field(..., description="훅 텍스트 (첫 3초)")
    script_outline: List[str] = Field(..., description="스크립트 아웃라인")
    music_suggestion: str = Field(..., description="음악 제안")
    caption: str = Field(..., description="캡션")
    duration_seconds: int = Field(default=15, description="영상 길이")


class StoryAdOutput(BaseModel):
    """스토리 광고"""
    ad_name: str = Field(..., description="광고 이름")
    text_overlay: str = Field(..., description="텍스트 오버레이")
    background_description: str = Field(..., description="배경 설명")
    swipe_up_text: str = Field(..., description="스와이프업 텍스트")
    sticker_suggestions: List[str] = Field(default_factory=list, description="스티커 제안")


class InstagramAdSetOutput(BaseModel):
    """인스타그램 광고 세트"""
    ad_type: str = Field(..., description="광고 유형 (single_image, carousel, reels, story)")
    single_image: Optional[SingleImageAdOutput] = Field(None, description="단일 이미지 광고")
    carousel: Optional[CarouselAdOutput] = Field(None, description="캐러셀 광고")
    reels: Optional[ReelsAdOutput] = Field(None, description="릴스 광고")
    story: Optional[StoryAdOutput] = Field(None, description="스토리 광고")
    target_audience_note: str = Field(..., description="타겟 오디언스 노트")
    estimated_ctr: str = Field(..., description="예상 CTR 범위")


class InstagramAdsOutput(BaseModel):
    """InstagramAdsAgent 전체 출력"""
    campaign_name: str = Field(..., description="캠페인 이름")
    campaign_objective: str = Field(..., description="캠페인 목표")
    ad_sets: List[InstagramAdSetOutput] = Field(..., description="광고 세트 목록")
    hashtags: List[str] = Field(default_factory=list, description="추천 해시태그")
    posting_schedule: Dict[str, Any] = Field(..., description="게시 스케줄 제안")
    budget_recommendation: str = Field(..., description="예산 권장사항")


# =============================================================================
# Instagram Ads Agent
# =============================================================================

class InstagramAdsAgent(AgentBase):
    """
    Instagram Ads Agent

    마케팅 컨셉을 기반으로 고성과 인스타그램 광고 콘텐츠를 생성합니다.

    지원 광고 유형:
    1. Single Image: 단일 이미지 광고
    2. Carousel: 캐러셀 (최대 10장)
    3. Reels: 릴스 광고 (15-30초)
    4. Story: 스토리 광고

    각 광고는 다음을 포함:
    - 카피 (primary text, headline, description)
    - 비주얼 가이드 (이미지 프롬프트)
    - CTA 및 타겟팅 제안
    """

    @property
    def name(self) -> str:
        return "instagram_ads"

    async def execute(self, request: AgentRequest) -> AgentResponse:
        """인스타그램 광고 콘텐츠 생성"""
        start_time = datetime.utcnow()

        self._validate_request(request)

        try:
            input_data = InstagramAdsInput(**request.payload)
        except Exception as e:
            raise AgentError(
                message=f"Invalid input: {str(e)}",
                agent=self.name,
                details={"payload": request.payload}
            )

        prompt = self._build_prompt(input_data)

        logger.info(
            f"[InstagramAdsAgent] Generating {input_data.ad_count} ads "
            f"for {input_data.product_name}..."
        )

        try:
            llm_response = await self.llm_gateway.generate(
                role=self.name,
                task="generate_instagram_ads",
                payload={"prompt": prompt},
                mode="json",
                override_model="gemini-2.0-flash",
                options={
                    "temperature": 0.8,  # 창의성 높게
                    "max_tokens": 10000
                }
            )
        except Exception as e:
            logger.error(f"[InstagramAdsAgent] LLM call failed: {e}")
            raise AgentError(
                message=f"LLM generation failed: {str(e)}",
                agent=self.name,
                details={"input": input_data.model_dump()}
            )

        try:
            output_data = self._parse_output(llm_response.output.value, input_data)
        except Exception as e:
            logger.error(f"[InstagramAdsAgent] Output parsing failed: {e}")
            raise AgentError(
                message=f"Output parsing failed: {str(e)}",
                agent=self.name,
                details={"llm_output": llm_response.output.value}
            )

        elapsed = (datetime.utcnow() - start_time).total_seconds()

        logger.info(
            f"[InstagramAdsAgent] Generated {len(output_data.ad_sets)} ad sets "
            f"in {elapsed:.2f}s"
        )

        return AgentResponse(
            agent=self.name,
            task=request.task,
            outputs=[
                self._create_output(
                    output_type="json",
                    name="instagram_ads",
                    value=output_data.model_dump(),
                    meta={
                        "ad_count": len(output_data.ad_sets),
                        "hashtag_count": len(output_data.hashtags)
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
                "ad_objective": input_data.ad_objective
            }
        )

    def _build_prompt(self, input_data: InstagramAdsInput) -> str:
        """프롬프트 생성"""
        concept = input_data.concept

        objective_desc = {
            "awareness": "브랜드 인지도 향상 (도달, 노출)",
            "consideration": "고려 단계 (트래픽, 참여)",
            "conversion": "전환 (구매, 가입)"
        }

        obj_desc = objective_desc.get(input_data.ad_objective, "전환")

        hashtag_instruction = ""
        if input_data.include_hashtags:
            hashtag_instruction = """
## 해시태그 전략
- 브랜드 해시태그 (1-2개)
- 산업/니치 해시태그 (5-7개)
- 트렌딩 해시태그 (3-5개)
- 총 15-20개 추천"""

        prompt = f"""당신은 인스타그램 광고 전문가입니다. 아래 정보를 바탕으로 {input_data.ad_count}개의 고성과 인스타그램 광고를 제작하세요.

## 제품/서비스
- 이름: {input_data.product_name}

## 마케팅 컨셉
- 컨셉명: {concept.get('concept_name', '')}
- 설명: {concept.get('concept_description', '')}
- 타겟: {concept.get('target_audience', '')}
- 핵심 메시지: {concept.get('key_message', '')}
- 톤앤매너: {concept.get('tone_and_manner', '')}
- 비주얼 스타일: {concept.get('visual_style', '')}

## 광고 목표
{obj_desc}

## 고성과 인스타그램 광고 원칙

### 1. 단일 이미지 광고 (Single Image)
- primary_text: 125자 권장, 첫 줄에 훅
- headline: 40자 이내, 임팩트 있게
- image_prompt: 이미지 생성 AI용 상세 프롬프트
  - 구체적인 장면, 인물, 색감, 분위기 포함
  - 예: "밝은 오피스에서 노트북을 사용하는 20대 여성, 미소, 모던한 인테리어, 자연광"

### 2. 캐러셀 광고 (Carousel)
- 3-5개 카드로 스토리텔링
- 각 카드: headline + image_prompt
- 마지막 카드: 강력한 CTA

### 3. 릴스 광고 (Reels)
- hook_text: 첫 3초 시청자 고정
- 15-30초 스크립트 아웃라인
- 트렌디한 음악 제안

### 4. 스토리 광고 (Story)
- 풀스크린 활용
- 스와이프업 유도
- 스티커/이모지 활용

## 광고 유형 조합
{input_data.ad_count}개 광고 중:
- 최소 1개: single_image (기본)
- 1개: carousel (스토리텔링)
- 나머지: reels 또는 story
{hashtag_instruction}

## 출력 형식 (JSON)
{{
    "campaign_name": "캠페인 이름",
    "campaign_objective": "{input_data.ad_objective}",
    "ad_sets": [
        {{
            "ad_type": "single_image",
            "single_image": {{
                "ad_name": "광고 이름",
                "primary_text": "메인 텍스트 (이모지 포함 가능)",
                "headline": "헤드라인",
                "description": "설명",
                "cta_button": "Learn More",
                "image_prompt": "상세 이미지 프롬프트",
                "image_style": "이미지 스타일",
                "text_overlay": "이미지 위 텍스트"
            }},
            "carousel": null,
            "reels": null,
            "story": null,
            "target_audience_note": "타겟 오디언스 노트",
            "estimated_ctr": "1.5-2.5%"
        }},
        {{
            "ad_type": "carousel",
            "single_image": null,
            "carousel": {{
                "ad_name": "캐러셀 광고 이름",
                "primary_text": "메인 텍스트",
                "cards": [
                    {{"headline": "카드1 헤드라인", "image_prompt": "카드1 이미지 프롬프트"}},
                    {{"headline": "카드2 헤드라인", "image_prompt": "카드2 이미지 프롬프트"}}
                ],
                "cta_button": "Shop Now"
            }},
            "reels": null,
            "story": null,
            "target_audience_note": "타겟 노트",
            "estimated_ctr": "2.0-3.0%"
        }},
        {{
            "ad_type": "reels",
            "single_image": null,
            "carousel": null,
            "reels": {{
                "ad_name": "릴스 광고 이름",
                "hook_text": "훅 텍스트",
                "script_outline": ["씬1", "씬2", "씬3"],
                "music_suggestion": "음악 제안",
                "caption": "캡션 (이모지+해시태그 포함)",
                "duration_seconds": 15
            }},
            "story": null,
            "target_audience_note": "타겟 노트",
            "estimated_ctr": "3.0-5.0%"
        }}
    ],
    "hashtags": ["#해시태그1", "#해시태그2"],
    "posting_schedule": {{
        "best_days": ["화요일", "목요일"],
        "best_times": ["오전 9시", "오후 7시"],
        "frequency": "주 3-4회"
    }},
    "budget_recommendation": "일 예산 3-5만원 권장"
}}

{input_data.ad_count}개의 다양한 광고 유형을 생성하세요. 한국어로 작성하세요.
이모지를 적절히 활용하여 눈에 띄는 카피를 작성하세요.
"""
        return prompt

    def _parse_output(
        self, llm_output: Any, input_data: InstagramAdsInput
    ) -> InstagramAdsOutput:
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

        # 광고 세트 파싱
        ad_sets = []
        for ad_data in data.get("ad_sets", []):
            ad_type = ad_data.get("ad_type", "single_image")

            single_image = None
            carousel = None
            reels = None
            story = None

            if ad_type == "single_image" and ad_data.get("single_image"):
                si = ad_data["single_image"]
                single_image = SingleImageAdOutput(
                    ad_name=si.get("ad_name", ""),
                    primary_text=si.get("primary_text", ""),
                    headline=si.get("headline", ""),
                    description=si.get("description"),
                    cta_button=si.get("cta_button", "Learn More"),
                    image_prompt=si.get("image_prompt", ""),
                    image_style=si.get("image_style", ""),
                    text_overlay=si.get("text_overlay")
                )

            elif ad_type == "carousel" and ad_data.get("carousel"):
                ca = ad_data["carousel"]
                carousel = CarouselAdOutput(
                    ad_name=ca.get("ad_name", ""),
                    primary_text=ca.get("primary_text", ""),
                    cards=ca.get("cards", []),
                    cta_button=ca.get("cta_button", "Learn More")
                )

            elif ad_type == "reels" and ad_data.get("reels"):
                re_ad = ad_data["reels"]
                reels = ReelsAdOutput(
                    ad_name=re_ad.get("ad_name", ""),
                    hook_text=re_ad.get("hook_text", ""),
                    script_outline=re_ad.get("script_outline", []),
                    music_suggestion=re_ad.get("music_suggestion", ""),
                    caption=re_ad.get("caption", ""),
                    duration_seconds=re_ad.get("duration_seconds", 15)
                )

            elif ad_type == "story" and ad_data.get("story"):
                st = ad_data["story"]
                story = StoryAdOutput(
                    ad_name=st.get("ad_name", ""),
                    text_overlay=st.get("text_overlay", ""),
                    background_description=st.get("background_description", ""),
                    swipe_up_text=st.get("swipe_up_text", ""),
                    sticker_suggestions=st.get("sticker_suggestions", [])
                )

            ad_set = InstagramAdSetOutput(
                ad_type=ad_type,
                single_image=single_image,
                carousel=carousel,
                reels=reels,
                story=story,
                target_audience_note=ad_data.get("target_audience_note", ""),
                estimated_ctr=ad_data.get("estimated_ctr", "1.0-2.0%")
            )
            ad_sets.append(ad_set)

        # 해시태그
        hashtags = []
        if input_data.include_hashtags:
            hashtags = data.get("hashtags", [])

        # 게시 스케줄 기본값
        posting_schedule = data.get("posting_schedule", {
            "best_days": ["화요일", "목요일", "토요일"],
            "best_times": ["오전 9시", "오후 12시", "오후 7시"],
            "frequency": "주 3-4회"
        })

        return InstagramAdsOutput(
            campaign_name=data.get("campaign_name", f"{input_data.product_name} 캠페인"),
            campaign_objective=data.get("campaign_objective", input_data.ad_objective),
            ad_sets=ad_sets,
            hashtags=hashtags,
            posting_schedule=posting_schedule,
            budget_recommendation=data.get("budget_recommendation", "일 예산 3-5만원 권장")
        )


# =============================================================================
# Factory Function
# =============================================================================

def get_instagram_ads_agent(llm_gateway=None) -> InstagramAdsAgent:
    """InstagramAdsAgent 인스턴스 반환"""
    return InstagramAdsAgent(llm_gateway=llm_gateway)
