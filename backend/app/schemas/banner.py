"""
Banner Generator Schemas

광고 배너 생성을 위한 스키마

작성일: 2025-11-24
작성자: B팀 (Backend)
참조: SPARKLIO_MVP_MASTER_TRACKER.md - P1 Multi-Channel Generator
"""

from pydantic import BaseModel, Field, UUID4
from typing import Optional, List, Dict, Any, Literal
from datetime import datetime
from enum import Enum


# =============================================================================
# Banner Size Presets
# =============================================================================

class BannerSize(str, Enum):
    """배너 사이즈 프리셋"""
    SQUARE = "1080x1080"  # 인스타그램 피드, 페이스북 포스트
    LANDSCAPE = "1200x628"  # 페이스북 링크 포스트, 트위터 카드
    STORY = "1080x1920"  # 인스타그램/페이스북 스토리, 틱톡


BANNER_SIZE_MAP = {
    BannerSize.SQUARE: {"width": 1080, "height": 1080, "name": "Square (Instagram Feed)"},
    BannerSize.LANDSCAPE: {"width": 1200, "height": 628, "name": "Landscape (Facebook Link)"},
    BannerSize.STORY: {"width": 1080, "height": 1920, "name": "Story (Instagram/TikTok)"}
}


# =============================================================================
# Banner Input Schemas
# =============================================================================

class BannerSetInput(BaseModel):
    """
    배너 세트 생성 입력

    하나의 캠페인 메시지로 여러 사이즈의 배너를 자동 생성
    """
    # 필수 입력
    headline: str = Field(..., min_length=5, max_length=50, description="메인 헤드라인 (5-50자)")
    subheadline: Optional[str] = Field(None, max_length=100, description="서브 헤드라인 (100자 이내, 옵션)")
    body_text: Optional[str] = Field(None, max_length=200, description="본문 텍스트 (200자 이내, 옵션)")
    cta_text: str = Field(..., min_length=2, max_length=20, description="CTA 버튼 텍스트 (2-20자)")

    # 이미지
    background_image_url: Optional[str] = Field(None, description="배경 이미지 URL")
    product_image_url: Optional[str] = Field(None, description="제품 이미지 URL")

    # 브랜드 컨텍스트
    brand_context: Optional[str] = Field(None, description="브랜드 DNA (톤앤매너, 가이드라인)")

    # 광고 유형
    ad_type: Literal["product", "brand", "event", "sale"] = Field(
        "product",
        description="광고 유형 (product: 제품 홍보, brand: 브랜드 인지도, event: 이벤트, sale: 세일)"
    )

    # 타겟 플랫폼
    target_platforms: List[Literal["instagram", "facebook", "twitter", "tiktok"]] = Field(
        default=["instagram", "facebook"],
        description="타겟 플랫폼 (사이즈 자동 선택)"
    )

    # 생성 옵션
    sizes: List[BannerSize] = Field(
        default=[BannerSize.SQUARE, BannerSize.LANDSCAPE, BannerSize.STORY],
        description="생성할 배너 사이즈 (기본: 모든 사이즈)"
    )
    tone: Literal["professional", "friendly", "luxury", "energetic", "casual"] = Field(
        "professional",
        description="톤앤매너"
    )
    language: str = Field("ko", description="언어 코드 (ko, en)")

    # 과대광고 방지 옵션
    enable_ad_compliance_check: bool = Field(
        True,
        description="과대광고 체크 활성화 (ReviewerAgent 사용)"
    )


# =============================================================================
# Banner Output Schemas
# =============================================================================

class BannerContent(BaseModel):
    """단일 배너 콘텐츠"""
    size: BannerSize = Field(..., description="배너 사이즈")
    width: int = Field(..., description="너비 (px)")
    height: int = Field(..., description="높이 (px)")

    # 텍스트 레이어
    headline: str = Field(..., description="헤드라인 (크기에 맞게 조정)")
    subheadline: Optional[str] = Field(None, description="서브헤드라인 (옵션)")
    body_text: Optional[str] = Field(None, description="본문 (옵션, 사이즈에 따라 생략 가능)")
    cta_text: str = Field(..., description="CTA 버튼 텍스트")

    # 레이아웃 정보
    layout_type: Literal["center", "left", "right", "top", "bottom"] = Field(
        ...,
        description="레이아웃 타입 (텍스트 배치 위치)"
    )
    text_area: Dict[str, float] = Field(
        ...,
        description="텍스트 영역 (x, y, width, height in px)"
    )

    # 이미지 레이어
    background_image_url: Optional[str] = Field(None, description="배경 이미지 URL")
    product_image_url: Optional[str] = Field(None, description="제품 이미지 URL")

    # 메타데이터
    platform_fit: List[str] = Field(
        ...,
        description="적합한 플랫폼 (instagram, facebook, twitter, tiktok)"
    )


class AdComplianceResult(BaseModel):
    """광고 과대광고 체크 결과"""
    passed: bool = Field(..., description="통과 여부")
    issues: List[str] = Field(default_factory=list, description="발견된 문제점")
    warnings: List[str] = Field(default_factory=list, description="경고 사항")
    suggestions: List[str] = Field(default_factory=list, description="개선 제안")
    checked_at: datetime = Field(default_factory=datetime.utcnow, description="체크 시각")


class BannerSetOutput(BaseModel):
    """
    배너 세트 출력

    여러 사이즈의 배너 + Canvas JSON 세트
    """
    banners: List[BannerContent] = Field(..., min_length=1, description="생성된 배너 목록")
    ad_compliance: Optional[AdComplianceResult] = Field(None, description="광고 컴플라이언스 체크 결과")

    # 메타데이터
    generated_at: datetime = Field(default_factory=datetime.utcnow, description="생성 시각")
    tone: str = Field(..., description="사용된 톤앤매너")
    language: str = Field(..., description="생성 언어")
    ad_type: str = Field(..., description="광고 유형")

    class Config:
        json_schema_extra = {
            "example": {
                "banners": [
                    {
                        "size": "1080x1080",
                        "width": 1080,
                        "height": 1080,
                        "headline": "혁신적인 무선 이어폰",
                        "subheadline": "24시간 배터리, 노이즈캔슬링",
                        "body_text": None,
                        "cta_text": "지금 구매하기",
                        "layout_type": "center",
                        "text_area": {"x": 100, "y": 400, "width": 880, "height": 300},
                        "background_image_url": "https://example.com/bg.jpg",
                        "product_image_url": "https://example.com/product.png",
                        "platform_fit": ["instagram", "facebook"]
                    },
                    {
                        "size": "1200x628",
                        "width": 1200,
                        "height": 628,
                        "headline": "혁신적인 무선 이어폰",
                        "subheadline": "24시간 배터리로 하루 종일 사용",
                        "body_text": "액티브 노이즈캔슬링으로 완벽한 사운드 경험",
                        "cta_text": "자세히 보기",
                        "layout_type": "left",
                        "text_area": {"x": 50, "y": 100, "width": 500, "height": 400},
                        "background_image_url": "https://example.com/bg.jpg",
                        "product_image_url": "https://example.com/product.png",
                        "platform_fit": ["facebook", "twitter"]
                    }
                ],
                "ad_compliance": {
                    "passed": True,
                    "issues": [],
                    "warnings": ["헤드라인에 구체적인 수치 표기 권장"],
                    "suggestions": ["CTA 텍스트를 더 구체적으로 (예: '50% 할인 받기')"],
                    "checked_at": "2025-11-24T16:00:00Z"
                },
                "generated_at": "2025-11-24T16:00:00Z",
                "tone": "professional",
                "language": "ko",
                "ad_type": "product"
            }
        }


# =============================================================================
# API Request/Response Schemas
# =============================================================================

class BannerSetGenerateRequest(BaseModel):
    """배너 세트 생성 요청"""
    banner_input: BannerSetInput = Field(..., description="배너 입력 정보")
    brand_id: Optional[UUID4] = Field(None, description="브랜드 ID (BrandKit 조회용)")
    project_id: Optional[UUID4] = Field(None, description="프로젝트 ID")


class BannerSetGenerateResponse(BaseModel):
    """배너 세트 생성 응답"""
    success: bool = Field(..., description="성공 여부")
    document_ids: Optional[List[UUID4]] = Field(None, description="생성된 Document IDs (각 사이즈별)")
    canvas_json_set: Optional[List[Dict[str, Any]]] = Field(None, description="Canvas JSON 세트 (각 사이즈별)")
    content: Optional[BannerSetOutput] = Field(None, description="생성된 배너 콘텐츠 (원본)")
    error: Optional[str] = Field(None, description="에러 메시지")
    usage: Optional[Dict[str, Any]] = Field(None, description="사용량 (토큰, 시간)")
