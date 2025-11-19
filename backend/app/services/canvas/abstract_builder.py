"""
Abstract Canvas Builder - Backend Canvas Spec v2.0

에디터 독립적 추상 문서 생성
Konva/Fabric/etc 어떤 렌더러도 사용 가능하도록 설계

작성일: 2025-11-19
작성자: B팀 (Backend)
참고: docs/BACKEND_CANVAS_SPEC_V2.md
"""

from typing import Dict, Any, List, Optional
import logging
import uuid

from app.schemas.canvas import (
    DocumentPayload,
    PagePayload,
    TextObject,
    ImageObject,
    ShapeObject,
    BrandInfo,
    BrandColors,
    BrandFonts,
    BackgroundColor,
    TextRole,
    ShapeType,
    FontWeight,
    DocumentKind,
    DocumentMetadata,
)

logger = logging.getLogger(__name__)


class AbstractCanvasBuilder:
    """
    Abstract Canvas Builder

    에디터 독립적인 추상 Canvas 문서 생성
    Flat structure, explicit IDs, role-based semantics

    사용 예시:
        builder = AbstractCanvasBuilder(
            kind=DocumentKind.PRODUCT_DETAIL,
            brand_info=brand_info
        )
        builder.add_page(width=1080, height=1350)
        builder.add_text(
            page_index=0,
            text="Hello World",
            role=TextRole.HEADLINE,
            x=100, y=100,
            font_size=48
        )
        document = builder.build()
    """

    def __init__(
        self,
        kind: DocumentKind,
        brand_info: Optional[BrandInfo] = None,
        doc_id: Optional[str] = None
    ):
        """
        Abstract Canvas Builder 초기화

        Args:
            kind: Document 종류
            brand_info: 브랜드 정보 (없으면 기본값)
            doc_id: Document ID (없으면 자동 생성)
        """
        self.kind = kind
        self.doc_id = doc_id or f"doc_{kind.value}_{uuid.uuid4().hex[:8]}"
        self.brand_info = brand_info or self._get_default_brand_info()
        self.pages: List[PagePayload] = []
        self.bindings: Dict[str, str] = {}
        self.metadata: Optional[DocumentMetadata] = None

    def _get_default_brand_info(self) -> BrandInfo:
        """기본 브랜드 정보"""
        return BrandInfo(
            colors=BrandColors(
                primary="#1f2937",
                secondary="#3b82f6",
                accent="#f59e0b",
                text_primary="#1f2937",
                text_secondary="#6b7280",
                background="#ffffff"
            ),
            fonts=BrandFonts(
                primary="Pretendard",
                secondary="Roboto",
                fallback="sans-serif"
            ),
            logo=None
        )

    def add_page(
        self,
        width: float,
        height: float,
        background: Optional[BackgroundColor] = None,
        page_id: Optional[str] = None
    ) -> "AbstractCanvasBuilder":
        """
        페이지 추가

        Args:
            width: Canvas 너비
            height: Canvas 높이
            background: 배경 (없으면 흰색)
            page_id: 페이지 ID (없으면 자동 생성)

        Returns:
            self (메서드 체이닝)
        """
        if background is None:
            background = BackgroundColor(
                type="color",
                value=self.brand_info.colors.background
            )

        page_id = page_id or f"page_{len(self.pages) + 1}"

        page = PagePayload(
            id=page_id,
            width=width,
            height=height,
            background=background,
            objects=[]
        )

        self.pages.append(page)
        logger.info(f"Page added: {page_id} ({width}x{height})")
        return self

    def add_text(
        self,
        page_index: int,
        text: str,
        role: TextRole,
        x: float,
        y: float,
        width: float,
        height: float,
        font_size: float,
        font_family: Optional[str] = None,
        font_weight: FontWeight = FontWeight.NORMAL,
        fill: Optional[str] = None,
        obj_id: Optional[str] = None,
        **kwargs
    ) -> str:
        """
        텍스트 객체 추가

        Args:
            page_index: 페이지 인덱스
            text: 텍스트 내용
            role: 텍스트 역할
            x: X 위치
            y: Y 위치
            width: 너비
            height: 높이
            font_size: 폰트 크기
            font_family: 폰트 패밀리 (없으면 브랜드 기본)
            font_weight: 폰트 굵기
            fill: 텍스트 색상 (없으면 브랜드 기본)
            obj_id: 객체 ID (없으면 자동 생성)
            **kwargs: 추가 속성

        Returns:
            생성된 객체 ID
        """
        if page_index >= len(self.pages):
            raise IndexError(f"Page index {page_index} out of range")

        obj_id = obj_id or f"obj_{role.value}_{uuid.uuid4().hex[:6]}"

        text_obj = TextObject(
            id=obj_id,
            type="text",
            role=role,
            text=text,
            x=x,
            y=y,
            width=width,
            height=height,
            font_size=font_size,
            font_family=font_family or self.brand_info.fonts.primary,
            font_weight=font_weight,
            fill=fill or self.brand_info.colors.text_primary,
            **kwargs
        )

        self.pages[page_index].objects.append(text_obj)
        logger.debug(f"Text object added: {obj_id} ({role.value})")
        return obj_id

    def add_image(
        self,
        page_index: int,
        src: str,
        x: float,
        y: float,
        width: float,
        height: float,
        role: Optional[str] = None,
        fit: str = "cover",
        obj_id: Optional[str] = None,
        **kwargs
    ) -> str:
        """
        이미지 객체 추가

        Args:
            page_index: 페이지 인덱스
            src: 이미지 URL
            x: X 위치
            y: Y 위치
            width: 너비
            height: 높이
            role: 이미지 역할
            fit: 이미지 fit 모드
            obj_id: 객체 ID
            **kwargs: 추가 속성

        Returns:
            생성된 객체 ID
        """
        if page_index >= len(self.pages):
            raise IndexError(f"Page index {page_index} out of range")

        obj_id = obj_id or f"obj_image_{uuid.uuid4().hex[:6]}"

        image_obj = ImageObject(
            id=obj_id,
            type="image",
            role=role,
            src=src,
            x=x,
            y=y,
            width=width,
            height=height,
            fit=fit,
            **kwargs
        )

        self.pages[page_index].objects.append(image_obj)
        logger.debug(f"Image object added: {obj_id}")
        return obj_id

    def add_shape(
        self,
        page_index: int,
        shape_type: ShapeType,
        x: float,
        y: float,
        width: float,
        height: float,
        fill: Optional[str] = None,
        role: Optional[str] = None,
        obj_id: Optional[str] = None,
        **kwargs
    ) -> str:
        """
        도형 객체 추가

        Args:
            page_index: 페이지 인덱스
            shape_type: 도형 타입
            x: X 위치
            y: Y 위치
            width: 너비
            height: 높이
            fill: 채우기 색상
            role: 도형 역할
            obj_id: 객체 ID
            **kwargs: 추가 속성

        Returns:
            생성된 객체 ID
        """
        if page_index >= len(self.pages):
            raise IndexError(f"Page index {page_index} out of range")

        obj_id = obj_id or f"obj_{shape_type.value}_{uuid.uuid4().hex[:6]}"

        shape_obj = ShapeObject(
            id=obj_id,
            type="shape",
            role=role,
            shape_type=shape_type,
            x=x,
            y=y,
            width=width,
            height=height,
            fill=fill or self.brand_info.colors.primary,
            **kwargs
        )

        self.pages[page_index].objects.append(shape_obj)
        logger.debug(f"Shape object added: {obj_id} ({shape_type.value})")
        return obj_id

    def add_binding(self, object_path: str, data_key: str) -> "AbstractCanvasBuilder":
        """
        데이터 바인딩 추가

        Args:
            object_path: 객체 경로 (e.g., "obj_headline.text")
            data_key: 데이터 키 (e.g., "copy.headline")

        Returns:
            self (메서드 체이닝)
        """
        self.bindings[object_path] = data_key
        return self

    def set_metadata(
        self,
        title: Optional[str] = None,
        description: Optional[str] = None,
        tags: Optional[List[str]] = None
    ) -> "AbstractCanvasBuilder":
        """
        메타데이터 설정

        Args:
            title: 문서 제목
            description: 문서 설명
            tags: 태그

        Returns:
            self (메서드 체이닝)
        """
        self.metadata = DocumentMetadata(
            title=title,
            description=description,
            tags=tags or [],
            version="2.0"
        )
        return self

    def build(self) -> DocumentPayload:
        """
        Abstract Document 생성

        Returns:
            DocumentPayload (v2.0 스펙)
        """
        if not self.pages:
            raise ValueError("Document must have at least one page")

        document = DocumentPayload(
            id=self.doc_id,
            kind=self.kind,
            brand=self.brand_info,
            pages=self.pages,
            metadata=self.metadata,
            bindings=self.bindings if self.bindings else None
        )

        logger.info(
            f"Document built: {self.doc_id} ({self.kind.value}), "
            f"{len(self.pages)} pages, "
            f"{sum(len(p.objects) for p in self.pages)} objects"
        )

        return document


# ===================
# Helper Functions
# ===================

def create_product_detail_document(
    text_data: Dict[str, Any],
    brand_info: Optional[BrandInfo] = None,
    image_url: Optional[str] = None
) -> DocumentPayload:
    """
    Product Detail 문서 생성

    Args:
        text_data: 텍스트 데이터 (headline, subheadline, body, bullets, cta)
        brand_info: 브랜드 정보
        image_url: 제품 이미지 URL

    Returns:
        DocumentPayload (v2.0 스펙)
    """
    builder = AbstractCanvasBuilder(
        kind=DocumentKind.PRODUCT_DETAIL,
        brand_info=brand_info
    )

    # Page 추가 (1080x1350)
    builder.add_page(width=1080, height=1350)

    # Headline
    headline_id = builder.add_text(
        page_index=0,
        text=text_data.get("headline", "Product Headline"),
        role=TextRole.HEADLINE,
        x=60,
        y=80,
        width=960,
        height=80,
        font_size=56,
        font_weight=FontWeight.BOLD,
        z_index=10
    )
    builder.add_binding(f"{headline_id}.text", "copy.headline")

    # Subheadline
    subheadline_id = builder.add_text(
        page_index=0,
        text=text_data.get("subheadline", "Product subheadline"),
        role=TextRole.SUBHEADLINE,
        x=60,
        y=180,
        width=960,
        height=60,
        font_size=28,
        font_weight=FontWeight.MEDIUM,
        fill="#6b7280",
        z_index=9
    )
    builder.add_binding(f"{subheadline_id}.text", "copy.subheadline")

    # Main Image (if provided)
    if image_url:
        image_id = builder.add_image(
            page_index=0,
            src=image_url,
            x=90,
            y=280,
            width=900,
            height=600,
            role="product_image",
            fit="contain",
            border_radius=16,
            z_index=8
        )
        builder.add_binding(f"{image_id}.src", "media.product_image")
    else:
        # Placeholder rectangle
        builder.add_shape(
            page_index=0,
            shape_type=ShapeType.RECT,
            x=90,
            y=280,
            width=900,
            height=600,
            fill="#e5e7eb",
            role="product_image_placeholder",
            border_radius=16,
            z_index=8
        )

    # Features (bullets)
    bullets = text_data.get("bullets", ["Feature 1", "Feature 2", "Feature 3"])
    bullet_text = "\n".join(f"• {bullet}" for bullet in bullets[:3])

    features_id = builder.add_text(
        page_index=0,
        text=bullet_text,
        role=TextRole.BODY,
        x=60,
        y=920,
        width=960,
        height=120,
        font_size=20,
        line_height=1.8,
        z_index=7
    )
    builder.add_binding(f"{features_id}.text", "copy.features")

    # CTA Button Background
    builder.add_shape(
        page_index=0,
        shape_type=ShapeType.RECT,
        x=60,
        y=1080,
        width=300,
        height=70,
        fill="#3b82f6",
        role="cta_button",
        border_radius=12,
        z_index=5
    )

    # CTA Button Text
    cta_id = builder.add_text(
        page_index=0,
        text=text_data.get("cta", "지금 구매하기"),
        role=TextRole.CTA,
        x=60,
        y=1080,
        width=300,
        height=70,
        font_size=22,
        font_weight=FontWeight.BOLD,
        fill="#ffffff",
        text_align="center",
        vertical_align="middle",
        z_index=6
    )
    builder.add_binding(f"{cta_id}.text", "copy.cta")

    # Decoration Circle
    builder.add_shape(
        page_index=0,
        shape_type=ShapeType.CIRCLE,
        x=850,
        y=100,
        width=150,
        height=150,
        fill="#3b82f6",
        role="decoration",
        opacity=0.1,
        z_index=1
    )

    # Metadata
    builder.set_metadata(
        title=f"Product Detail - {text_data.get('headline', 'Untitled')}",
        description="제품 상세 페이지 마케팅 자료",
        tags=["product_detail", "marketing"]
    )

    return builder.build()


def create_sns_feed_document(
    text_data: Dict[str, Any],
    brand_info: Optional[BrandInfo] = None,
    image_urls: Optional[Dict[str, str]] = None
) -> DocumentPayload:
    """
    SNS Feed 콘텐츠 세트 생성 (Multi-page: 1:1, 4:5, 9:16)

    Args:
        text_data: 텍스트 데이터
        brand_info: 브랜드 정보
        image_urls: 이미지 URL 딕셔너리 (square, portrait, story)

    Returns:
        DocumentPayload (v2.0 스펙, 3 pages)
    """
    builder = AbstractCanvasBuilder(
        kind=DocumentKind.SNS_FEED,
        brand_info=brand_info
    )

    image_urls = image_urls or {}

    # Page 1: Square (1:1 - 1080x1080)
    builder.add_page(width=1080, height=1080)

    headline_sq = builder.add_text(
        page_index=0,
        text=text_data.get("headline", "당신만의 공간"),
        role=TextRole.HEADLINE,
        x=80,
        y=100,
        width=920,
        height=100,
        font_size=64,
        font_weight=FontWeight.BOLD,
        text_align="center",
        z_index=10
    )
    builder.add_binding(f"{headline_sq}.text", "copy.headline_square")

    if image_urls.get("square"):
        img_sq = builder.add_image(
            page_index=0,
            src=image_urls["square"],
            x=140,
            y=250,
            width=800,
            height=600,
            role="product_image",
            border_radius=20,
            z_index=8
        )
        builder.add_binding(f"{img_sq}.src", "media.product_image_square")

    # Page 2: Portrait (4:5 - 1080x1350)
    builder.add_page(width=1080, height=1350)

    headline_pt = builder.add_text(
        page_index=1,
        text=text_data.get("headline", "최고의 선택"),
        role=TextRole.HEADLINE,
        x=60,
        y=80,
        width=960,
        height=90,
        font_size=68,
        font_weight=FontWeight.BOLD,
        z_index=10
    )
    builder.add_binding(f"{headline_pt}.text", "copy.headline_portrait")

    subheadline_pt = builder.add_text(
        page_index=1,
        text=text_data.get("subheadline", "프리미엄 경험"),
        role=TextRole.SUBHEADLINE,
        x=60,
        y=190,
        width=960,
        height=60,
        font_size=28,
        fill="#6b7280",
        z_index=9
    )
    builder.add_binding(f"{subheadline_pt}.text", "copy.subheadline_portrait")

    if image_urls.get("portrait"):
        img_pt = builder.add_image(
            page_index=1,
            src=image_urls["portrait"],
            x=90,
            y=320,
            width=900,
            height=700,
            role="product_image",
            border_radius=24,
            z_index=8
        )
        builder.add_binding(f"{img_pt}.src", "media.product_image_portrait")

    # Page 3: Story (9:16 - 1080x1920)
    builder.add_page(width=1080, height=1920)

    # Overlay
    builder.add_shape(
        page_index=2,
        shape_type=ShapeType.RECT,
        x=0,
        y=0,
        width=1080,
        height=1920,
        fill="#000000",
        role="decoration",
        opacity=0.6,
        z_index=1
    )

    headline_st = builder.add_text(
        page_index=2,
        text=text_data.get("headline", "소음을 차단하고\n당신의 세계로"),
        role=TextRole.HEADLINE,
        x=80,
        y=300,
        width=920,
        height=180,
        font_size=72,
        font_weight=FontWeight.BOLD,
        fill="#ffffff",
        text_align="center",
        line_height=1.2,
        text_shadow="0px 4px 12px rgba(0, 0, 0, 0.5)",
        z_index=10
    )
    builder.add_binding(f"{headline_st}.text", "copy.headline_story")

    if image_urls.get("story"):
        img_st = builder.add_image(
            page_index=2,
            src=image_urls["story"],
            x=140,
            y=600,
            width=800,
            height=800,
            role="product_image",
            z_index=9
        )
        builder.add_binding(f"{img_st}.src", "media.product_image_story")

    # CTA Button
    builder.add_shape(
        page_index=2,
        shape_type=ShapeType.RECT,
        x=240,
        y=1550,
        width=600,
        height=90,
        fill="#ffffff",
        role="cta_button",
        border_radius=45,
        z_index=7
    )

    cta_st = builder.add_text(
        page_index=2,
        text=text_data.get("cta", "구매하기"),
        role=TextRole.CTA,
        x=240,
        y=1550,
        width=600,
        height=90,
        font_size=24,
        font_weight=FontWeight.BOLD,
        fill="#1f2937",
        text_align="center",
        vertical_align="middle",
        z_index=8
    )
    builder.add_binding(f"{cta_st}.text", "copy.cta")

    # Metadata
    builder.set_metadata(
        title=f"SNS Feed Set - {text_data.get('headline', 'Untitled')}",
        description="Instagram 피드용 멀티 포맷 마케팅 자료 (1:1, 4:5, 9:16)",
        tags=["sns_feed", "instagram", "multi_format"]
    )

    return builder.build()
