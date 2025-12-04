"""
Document Layout API

문서 레이아웃 자동 생성 API

작성일: 2025-12-04
작성자: B팀 (Backend)

엔드포인트:
- POST /api/v1/layout/generate: 문서 레이아웃 생성
- GET /api/v1/layout/presets: 문서 유형별 프리셋 조회
"""

import logging
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from app.services.agents.document_layout import (
    get_document_layout_agent,
    DocumentContent,
    DocumentLayoutOutput
)
from app.services.agents.base import AgentRequest

logger = logging.getLogger(__name__)

router = APIRouter(tags=["layout"])


# =============================================================================
# Request/Response Models
# =============================================================================

class SectionInput(BaseModel):
    """섹션 입력"""
    type: str = Field(..., description="섹션 유형 (agenda, decisions, action_items, features 등)")
    title: Optional[str] = Field(None, description="섹션 제목")
    items: List[Any] = Field(default_factory=list, description="섹션 항목들")


class LayoutGenerateRequest(BaseModel):
    """레이아웃 생성 요청"""
    document_type: str = Field(
        ...,
        description="문서 유형 (meeting_summary, presentation, brief, product_detail, sns_ad, banner, report)"
    )
    title: str = Field(..., description="문서 제목")
    subtitle: Optional[str] = Field(None, description="부제목")
    summary: Optional[str] = Field(None, description="요약/개요")
    sections: List[SectionInput] = Field(default_factory=list, description="섹션 목록")
    keywords: Optional[List[str]] = Field(None, description="키워드")
    page_width: int = Field(default=1920, description="페이지 너비 (px)")
    page_height: int = Field(default=1080, description="페이지 높이 (px)")
    platform: Optional[str] = Field(None, description="SNS 플랫폼 (instagram_feed, instagram_story 등)")
    use_llm: bool = Field(default=False, description="LLM 사용 여부 (기본: 휴리스틱)")

    class Config:
        json_schema_extra = {
            "example": {
                "document_type": "meeting_summary",
                "title": "주간 기획 회의",
                "subtitle": "2025년 12월 1주차",
                "summary": "이번 주 마케팅 캠페인 진행 상황을 점검하고 다음 단계 액션 아이템을 정리했습니다.",
                "sections": [
                    {
                        "type": "agenda",
                        "title": "주요 안건",
                        "items": ["캠페인 성과 분석", "신규 채널 검토", "예산 조정"]
                    },
                    {
                        "type": "decisions",
                        "title": "결정 사항",
                        "items": ["인스타그램 광고 예산 30% 증액", "TikTok 채널 테스트 진행"]
                    },
                    {
                        "type": "action_items",
                        "title": "액션 아이템",
                        "items": ["광고 크리에이티브 3종 제작", "성과 보고서 작성", "파트너사 미팅 일정 조율"]
                    }
                ],
                "keywords": ["마케팅", "캠페인", "SNS", "예산"],
                "page_width": 1920,
                "page_height": 1080
            }
        }


class LayoutPreset(BaseModel):
    """레이아웃 프리셋"""
    document_type: str
    name: str
    description: str
    default_size: Dict[str, int]
    supported_sections: List[str]
    example_use_case: str


class LayoutPresetsResponse(BaseModel):
    """프리셋 목록 응답"""
    presets: List[LayoutPreset]


# =============================================================================
# API Endpoints
# =============================================================================

@router.post("/generate", response_model=Dict[str, Any])
async def generate_layout(request: LayoutGenerateRequest):
    """
    문서 레이아웃 생성

    콘텐츠를 분석하여 최적의 문서 레이아웃을 자동 생성합니다.

    지원 문서 유형:
    - meeting_summary: 회의 요약 (안건, 결정사항, 액션아이템)
    - presentation: 프레젠테이션/피치덱
    - brief: 캠페인 브리프
    - product_detail: 상품 상세페이지
    - sns_ad: SNS 광고 (Instagram, Facebook 등)
    - banner: 배너 광고
    - report: 일반 보고서
    """
    try:
        logger.info(f"[Layout API] Generating {request.document_type} layout")

        # DocumentContent 구성
        content_data = {
            "title": request.title,
            "subtitle": request.subtitle,
            "summary": request.summary,
            "sections": [s.model_dump() for s in request.sections],
            "keywords": request.keywords
        }

        # Agent 호출
        agent = get_document_layout_agent()

        agent_request = AgentRequest(
            task="generate_layout",
            payload={
                "content": content_data,
                "document_type": request.document_type,
                "page_width": request.page_width,
                "page_height": request.page_height,
                "platform": request.platform,
                "use_llm": request.use_llm
            }
        )

        response = await agent.execute(agent_request)

        # 결과 추출
        layout_output = response.outputs[0].value if response.outputs else {}

        logger.info(
            f"[Layout API] Generated {layout_output.get('total_pages', 0)} pages "
            f"for {request.document_type}"
        )

        return {
            "success": True,
            "document_type": request.document_type,
            "layout": layout_output,
            "meta": {
                "page_size": f"{request.page_width}x{request.page_height}",
                "use_llm": request.use_llm
            }
        }

    except Exception as e:
        logger.error(f"[Layout API] Error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Layout generation failed: {str(e)}"
        )


@router.get("/presets", response_model=LayoutPresetsResponse)
async def get_layout_presets():
    """
    문서 유형별 레이아웃 프리셋 조회

    각 문서 유형에 대한 기본 설정과 지원 섹션 목록을 반환합니다.
    """
    presets = [
        LayoutPreset(
            document_type="meeting_summary",
            name="회의 요약",
            description="회의 내용을 요약하고 액션 아이템을 정리하는 문서",
            default_size={"width": 1920, "height": 1080},
            supported_sections=["agenda", "decisions", "action_items", "summary"],
            example_use_case="주간 회의록, 스프린트 리뷰, 기획 회의"
        ),
        LayoutPreset(
            document_type="presentation",
            name="프레젠테이션",
            description="피치덱, 발표 자료 등 슬라이드 형식 문서",
            default_size={"width": 1920, "height": 1080},
            supported_sections=["cover", "problem", "solution", "features", "benefits", "cta"],
            example_use_case="투자 피칭, 제품 소개, 팀 발표"
        ),
        LayoutPreset(
            document_type="brief",
            name="캠페인 브리프",
            description="마케팅 캠페인 기획을 위한 브리프 문서",
            default_size={"width": 1920, "height": 1080},
            supported_sections=["background", "target_audience", "key_message", "tone_manner", "mandatory_elements"],
            example_use_case="광고 캠페인, 이벤트 기획, 콘텐츠 제작"
        ),
        LayoutPreset(
            document_type="product_detail",
            name="상품 상세페이지",
            description="이커머스 상품 상세 페이지 레이아웃",
            default_size={"width": 860, "height": 1200},
            supported_sections=["brand", "price", "features", "description", "reviews"],
            example_use_case="스마트스토어, 쿠팡, 자사몰 상품페이지"
        ),
        LayoutPreset(
            document_type="sns_ad",
            name="SNS 광고",
            description="소셜 미디어 광고용 이미지 레이아웃",
            default_size={"width": 1080, "height": 1080},
            supported_sections=["headline", "cta", "brand"],
            example_use_case="인스타그램 피드, 페이스북 광고, 스토리 광고"
        ),
        LayoutPreset(
            document_type="banner",
            name="배너 광고",
            description="웹사이트 배너, GDN 광고용 레이아웃",
            default_size={"width": 728, "height": 90},
            supported_sections=["headline", "cta", "brand", "offer"],
            example_use_case="웹 배너, GDN, 네이버 DA"
        ),
        LayoutPreset(
            document_type="report",
            name="일반 보고서",
            description="데이터 기반 분석 보고서",
            default_size={"width": 1920, "height": 1080},
            supported_sections=["summary", "findings", "recommendations", "appendix"],
            example_use_case="월간 보고서, 분석 리포트, 성과 보고"
        )
    ]

    return LayoutPresetsResponse(presets=presets)


class MeetingLayoutRequest(BaseModel):
    """회의 요약 레이아웃 요청"""
    title: str = Field(..., description="회의 제목")
    summary: Optional[str] = Field(None, description="회의 요약")
    agenda: Optional[List[str]] = Field(None, description="주요 안건")
    decisions: Optional[List[str]] = Field(None, description="결정 사항")
    action_items: Optional[List[Dict[str, Any]]] = Field(None, description="액션 아이템")
    keywords: Optional[List[str]] = Field(None, description="키워드")
    participants: Optional[List[str]] = Field(None, description="참석자")
    duration: Optional[str] = Field(None, description="회의 시간")
    options: Optional[Dict[str, Any]] = Field(None, description="레이아웃 옵션")


@router.post("/generate/meeting", response_model=Dict[str, Any])
async def generate_meeting_layout(request_body: MeetingLayoutRequest):
    """
    회의 요약 전용 레이아웃 생성 (간편 API)

    Meeting AI 분석 결과를 바로 전달하여 레이아웃을 생성합니다.
    """
    sections = []

    if request_body.agenda:
        sections.append(SectionInput(type="agenda", title="주요 안건", items=request_body.agenda))
    if request_body.decisions:
        sections.append(SectionInput(type="decisions", title="결정 사항", items=request_body.decisions))
    if request_body.action_items:
        # action_items는 dict 리스트일 수 있음 - task만 추출
        items = []
        for item in request_body.action_items:
            if isinstance(item, dict):
                task = item.get("task", "")
                assignee = item.get("assignee", "")
                items.append(f"{task}" + (f" ({assignee})" if assignee else ""))
            else:
                items.append(str(item))
        sections.append(SectionInput(type="action_items", title="액션 아이템", items=items))

    # 옵션에서 페이지 크기 가져오기
    options = request_body.options or {}
    page_width = options.get("page_width", 1920)
    page_height = options.get("page_height", 1080)

    request = LayoutGenerateRequest(
        document_type="meeting_summary",
        title=request_body.title,
        summary=request_body.summary,
        sections=sections,
        keywords=request_body.keywords,
        page_width=page_width,
        page_height=page_height
    )

    return await generate_layout(request)


class SNSLayoutRequest(BaseModel):
    """SNS 광고 레이아웃 요청"""
    platform: str = Field(default="instagram_feed", description="플랫폼")
    headline: str = Field(..., description="헤드라인")
    body_text: Optional[str] = Field(None, description="본문")
    cta_text: Optional[str] = Field("자세히 보기", description="CTA 텍스트")
    brand_name: Optional[str] = Field(None, description="브랜드명")
    product_name: Optional[str] = Field(None, description="상품명")
    hashtags: Optional[List[str]] = Field(None, description="해시태그")
    image_url: Optional[str] = Field(None, description="이미지 URL")
    options: Optional[Dict[str, Any]] = Field(None, description="레이아웃 옵션")


@router.post("/generate/sns", response_model=Dict[str, Any])
async def generate_sns_layout(request_body: SNSLayoutRequest):
    """
    SNS 광고 전용 레이아웃 생성 (간편 API)

    플랫폼별 최적 크기로 레이아웃을 자동 생성합니다.

    지원 플랫폼:
    - instagram_feed: 1080x1080
    - instagram_story: 1080x1920
    - facebook_feed: 1200x628
    - facebook_story: 1080x1920
    - youtube_thumbnail: 1280x720
    """
    # 플랫폼별 크기
    platform_sizes = {
        "instagram_feed": (1080, 1080),
        "instagram_story": (1080, 1920),
        "instagram_reel": (1080, 1920),
        "facebook_feed": (1200, 628),
        "facebook_story": (1080, 1920),
        "youtube_thumbnail": (1280, 720),
        "linkedin": (1200, 627),
        "twitter": (1200, 675),
        "tiktok": (1080, 1920),
    }

    width, height = platform_sizes.get(request_body.platform, (1080, 1080))

    sections = []
    if request_body.body_text:
        sections.append(SectionInput(type="body", items=[request_body.body_text]))
    if request_body.cta_text:
        sections.append(SectionInput(type="cta", items=[request_body.cta_text]))
    if request_body.brand_name:
        sections.append(SectionInput(type="brand", items=[request_body.brand_name]))
    if request_body.hashtags:
        sections.append(SectionInput(type="hashtags", items=request_body.hashtags))

    request = LayoutGenerateRequest(
        document_type="sns_ad",
        title=request_body.headline,
        subtitle=request_body.product_name,
        sections=sections,
        page_width=width,
        page_height=height,
        platform=request_body.platform
    )

    return await generate_layout(request)


class ProductLayoutRequest(BaseModel):
    """상품 상세페이지 레이아웃 요청"""
    product_name: str = Field(..., description="상품명")
    tagline: Optional[str] = Field(None, description="태그라인")
    description: str = Field(..., description="상품 설명")
    features: Optional[List[Dict[str, str]]] = Field(None, description="주요 특징")
    specifications: Optional[Dict[str, str]] = Field(None, description="제품 사양")
    price: Optional[str] = Field(None, description="가격")
    images: Optional[List[str]] = Field(None, description="이미지 URL 목록")
    cta_text: Optional[str] = Field(None, description="CTA 텍스트")
    options: Optional[Dict[str, Any]] = Field(None, description="레이아웃 옵션")


@router.post("/generate/product", response_model=Dict[str, Any])
async def generate_product_layout(request_body: ProductLayoutRequest):
    """
    상품 상세페이지 전용 레이아웃 생성 (간편 API)
    """
    sections = []

    if request_body.price:
        sections.append(SectionInput(type="price", items=[request_body.price]))
    if request_body.features:
        # features가 dict 리스트이면 title/description 추출
        feature_items = []
        for f in request_body.features:
            if isinstance(f, dict):
                title = f.get("title", "")
                desc = f.get("description", "")
                feature_items.append(f"{title}: {desc}" if desc else title)
            else:
                feature_items.append(str(f))
        sections.append(SectionInput(type="features", title="주요 특징", items=feature_items))
    if request_body.specifications:
        spec_items = [f"{k}: {v}" for k, v in request_body.specifications.items()]
        sections.append(SectionInput(type="specs", title="제품 사양", items=spec_items))
    if request_body.cta_text:
        sections.append(SectionInput(type="cta", items=[request_body.cta_text]))

    # 옵션에서 페이지 크기 가져오기
    options = request_body.options or {}
    page_width = options.get("page_width", 860)
    page_height = options.get("page_height", 1200)

    request = LayoutGenerateRequest(
        document_type="product_detail",
        title=request_body.product_name,
        subtitle=request_body.tagline,
        summary=request_body.description,
        sections=sections,
        page_width=page_width,
        page_height=page_height
    )

    return await generate_layout(request)
