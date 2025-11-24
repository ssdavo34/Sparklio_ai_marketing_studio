"""
Banner to Canvas Converter

BannerSetOutput → Canvas DocumentPayload 변환 유틸리티 (각 사이즈별)

작성일: 2025-11-24
작성자: B팀 (Backend)
참조: BACKEND_CANVAS_SPEC_V2.md
"""

from typing import List, Dict, Any, Optional
from uuid import uuid4

from app.schemas.banner import BannerContent, BannerSetOutput, BannerSize
from app.schemas.canvas import (
    DocumentPayload,
    PagePayload,
    DocumentMetadata,
    DocumentKind,
    BrandInfo,
    BrandColors,
    BrandFonts,
    Background,
    BackgroundColor,
    BackgroundImage,
    TextObject,
    ImageObject,
    ShapeObject,
    TextRole,
    FontWeight,
    TextAlign,
    VerticalAlign,
    ShapeType,
    ObjectType
)


class BannerToCanvasConverter:
    """
    배너 콘텐츠를 Canvas JSON으로 변환

    각 사이즈별로 별도의 DocumentPayload 생성
    """

    def __init__(
        self,
        brand_colors: Optional[Dict[str, str]] = None,
        brand_fonts: Optional[Dict[str, str]] = None
    ):
        """
        Args:
            brand_colors: 브랜드 컬러 딕셔너리 (primary, secondary, accent)
            brand_fonts: 브랜드 폰트 딕셔너리 (primary, secondary)
        """
        # 기본 브랜드 정보
        self.brand_colors = BrandColors(
            primary=brand_colors.get("primary", "#3b82f6") if brand_colors else "#3b82f6",
            secondary=brand_colors.get("secondary", "#8b5cf6") if brand_colors else "#8b5cf6",
            accent=brand_colors.get("accent", "#ec4899") if brand_colors else "#ec4899",
            text_primary="#ffffff",  # 배너는 주로 흰색 텍스트
            text_secondary="#f3f4f6",
            background="#1f2937"
        )

        self.brand_fonts = BrandFonts(
            primary=brand_fonts.get("primary", "Pretendard") if brand_fonts else "Pretendard",
            secondary=brand_fonts.get("secondary") if brand_fonts else None,
            fallback="sans-serif"
        )

    def convert_banner_set(
        self,
        banner_set: BannerSetOutput,
        brand_id: str
    ) -> List[DocumentPayload]:
        """
        BannerSetOutput → List[DocumentPayload] 변환
        각 배너 사이즈마다 별도의 Document 생성

        Args:
            banner_set: 배너 세트 콘텐츠
            brand_id: 브랜드 ID

        Returns:
            List[DocumentPayload]
        """
        documents = []

        for banner in banner_set.banners:
            document = self._convert_single_banner(banner, brand_id, banner_set)
            documents.append(document)

        return documents

    def _convert_single_banner(
        self,
        banner: BannerContent,
        brand_id: str,
        banner_set: BannerSetOutput
    ) -> DocumentPayload:
        """
        단일 배너 → DocumentPayload 변환

        Args:
            banner: 배너 콘텐츠
            brand_id: 브랜드 ID
            banner_set: 배너 세트 (메타데이터용)

        Returns:
            DocumentPayload
        """
        # Page 생성
        page = self._build_banner_page(banner)

        # Brand Info
        brand = BrandInfo(
            colors=self.brand_colors,
            fonts=self.brand_fonts,
            logo=None
        )

        # Document Metadata
        size_name = banner.size.value
        metadata = DocumentMetadata(
            title=f"{banner.headline} - {size_name}",
            description=banner.subheadline or banner.headline,
            tags=["ad_banner", size_name, banner_set.ad_type, banner_set.tone],
            created_at=banner_set.generated_at.isoformat(),
            version="2.0"
        )

        # Document 생성
        document = DocumentPayload(
            id=str(uuid4()),
            kind=DocumentKind.AD_BANNER,
            brand=brand,
            pages=[page],
            metadata=metadata,
            bindings=None
        )

        return document

    def _build_banner_page(self, banner: BannerContent) -> PagePayload:
        """
        배너 Page 구성

        Layout:
        1. Background (이미지 또는 그라데이션)
        2. Product Image (옵션)
        3. Text Layers (headline, subheadline, body, CTA)
        """
        objects: List[Any] = []

        # 1. Background
        if banner.background_image_url:
            # 배경 이미지
            bg_image = ImageObject(
                id=f"bg_image_{uuid4().hex[:8]}",
                type=ObjectType.IMAGE,
                role="background",
                x=0,
                y=0,
                width=banner.width,
                height=banner.height,
                src=banner.background_image_url,
                fit="cover",
                opacity=0.7,  # 약간 어둡게 (텍스트 가독성)
                z_index=0
            )
            objects.append(bg_image)

            # 오버레이 (텍스트 가독성 향상)
            overlay = ShapeObject(
                id=f"overlay_{uuid4().hex[:8]}",
                type=ObjectType.SHAPE,
                shape_type=ShapeType.RECT,
                x=0,
                y=0,
                width=banner.width,
                height=banner.height,
                fill="#000000",
                opacity=0.3,
                z_index=1
            )
            objects.append(overlay)
        else:
            # 그라데이션 배경
            bg_shape = ShapeObject(
                id=f"bg_gradient_{uuid4().hex[:8]}",
                type=ObjectType.SHAPE,
                shape_type=ShapeType.RECT,
                x=0,
                y=0,
                width=banner.width,
                height=banner.height,
                fill=self.brand_colors.primary,
                z_index=0
            )
            objects.append(bg_shape)

        # 2. Product Image (옵션)
        if banner.product_image_url:
            product_image = self._create_product_image(banner)
            objects.append(product_image)

        # 3. Text Layers
        text_objects = self._create_text_layers(banner)
        objects.extend(text_objects)

        # 4. CTA Button
        cta_objects = self._create_cta_button(banner)
        objects.extend(cta_objects)

        # Page 생성
        page = PagePayload(
            id=f"banner_{banner.size.value}",
            width=banner.width,
            height=banner.height,
            background=BackgroundColor(type="color", value=self.brand_colors.background),
            objects=objects
        )

        return page

    def _create_product_image(self, banner: BannerContent) -> ImageObject:
        """
        제품 이미지 생성

        Layout에 따라 위치 조정:
        - center: 상단 중앙
        - left: 우측
        - right: 좌측
        - top: 하단
        - bottom: 상단
        """
        layout = banner.layout_type

        if banner.size == BannerSize.SQUARE:
            # 1080x1080 - 상단 또는 배경
            if layout == "center":
                # 상단 중앙
                x, y = 240, 100
                width, height = 600, 600
            else:
                # 전체 배경
                x, y = 90, 90
                width, height = 900, 900

        elif banner.size == BannerSize.LANDSCAPE:
            # 1200x628 - 좌우 분할
            if layout == "left":
                # 우측
                x, y = 650, 64
                width, height = 500, 500
            else:
                # 좌측
                x, y = 50, 64
                width, height = 500, 500

        else:  # STORY
            # 1080x1920 - 중앙 또는 상단
            if layout in ["top", "center"]:
                # 중앙
                x, y = 140, 480
                width, height = 800, 800
            else:
                # 상단
                x, y = 140, 200
                width, height = 800, 800

        return ImageObject(
            id=f"product_image_{uuid4().hex[:8]}",
            type=ObjectType.IMAGE,
            role="product_image",
            x=x,
            y=y,
            width=width,
            height=height,
            src=banner.product_image_url,
            fit="contain",
            z_index=2
        )

    def _create_text_layers(self, banner: BannerContent) -> List[TextObject]:
        """
        텍스트 레이어 생성 (headline, subheadline, body)

        Layout과 사이즈에 따라 위치 및 폰트 크기 조정
        """
        objects = []
        text_area = banner.text_area
        layout = banner.layout_type

        # 사이즈별 폰트 크기
        if banner.size == BannerSize.SQUARE:
            headline_size = 56
            subheadline_size = 32
            body_size = 20
        elif banner.size == BannerSize.LANDSCAPE:
            headline_size = 48
            subheadline_size = 28
            body_size = 18
        else:  # STORY
            headline_size = 64
            subheadline_size = 36
            body_size = 22

        current_y = text_area["y"]

        # Headline
        headline = TextObject(
            id=f"headline_{uuid4().hex[:8]}",
            type=ObjectType.TEXT,
            role=TextRole.HEADLINE,
            text=banner.headline,
            x=text_area["x"],
            y=current_y,
            width=text_area["width"],
            height=headline_size * 1.5,
            font_size=headline_size,
            font_family=self.brand_fonts.primary,
            font_weight=FontWeight.BOLD,
            line_height=1.2,
            text_align=TextAlign.CENTER if layout == "center" else TextAlign.LEFT,
            vertical_align=VerticalAlign.TOP,
            fill=self.brand_colors.text_primary,
            z_index=10
        )
        objects.append(headline)
        current_y += headline_size * 1.8

        # Subheadline (옵션)
        if banner.subheadline:
            subheadline = TextObject(
                id=f"subheadline_{uuid4().hex[:8]}",
                type=ObjectType.TEXT,
                role=TextRole.SUBHEADLINE,
                text=banner.subheadline,
                x=text_area["x"],
                y=current_y,
                width=text_area["width"],
                height=subheadline_size * 2,
                font_size=subheadline_size,
                font_family=self.brand_fonts.primary,
                font_weight=FontWeight.MEDIUM,
                line_height=1.4,
                text_align=TextAlign.CENTER if layout == "center" else TextAlign.LEFT,
                vertical_align=VerticalAlign.TOP,
                fill=self.brand_colors.text_secondary,
                z_index=10
            )
            objects.append(subheadline)
            current_y += subheadline_size * 2.5

        # Body Text (옵션, 주로 Landscape에만)
        if banner.body_text:
            body = TextObject(
                id=f"body_{uuid4().hex[:8]}",
                type=ObjectType.TEXT,
                role=TextRole.BODY,
                text=banner.body_text,
                x=text_area["x"],
                y=current_y,
                width=text_area["width"],
                height=body_size * 3,
                font_size=body_size,
                font_family=self.brand_fonts.primary,
                font_weight=FontWeight.NORMAL,
                line_height=1.6,
                text_align=TextAlign.CENTER if layout == "center" else TextAlign.LEFT,
                vertical_align=VerticalAlign.TOP,
                fill=self.brand_colors.text_secondary,
                z_index=10
            )
            objects.append(body)

        return objects

    def _create_cta_button(self, banner: BannerContent) -> List[Any]:
        """
        CTA 버튼 생성 (Shape + Text)

        Layout과 사이즈에 따라 위치 조정
        """
        objects = []
        text_area = banner.text_area
        layout = banner.layout_type

        # 사이즈별 버튼 크기
        if banner.size == BannerSize.SQUARE:
            button_width = 280
            button_height = 70
            font_size = 24
        elif banner.size == BannerSize.LANDSCAPE:
            button_width = 240
            button_height = 60
            font_size = 20
        else:  # STORY
            button_width = 320
            button_height = 80
            font_size = 26

        # 버튼 위치 (텍스트 영역 하단)
        button_x = text_area["x"] + (text_area["width"] - button_width) / 2
        button_y = text_area["y"] + text_area["height"] - button_height - 20

        # CTA Button Background
        cta_bg = ShapeObject(
            id=f"cta_button_bg_{uuid4().hex[:8]}",
            type=ObjectType.SHAPE,
            role="cta_button",
            shape_type=ShapeType.RECT,
            x=button_x,
            y=button_y,
            width=button_width,
            height=button_height,
            fill=self.brand_colors.accent,
            border_radius=button_height / 2,  # 둥근 버튼
            z_index=11
        )
        objects.append(cta_bg)

        # CTA Text
        cta_text = TextObject(
            id=f"cta_text_{uuid4().hex[:8]}",
            type=ObjectType.TEXT,
            role=TextRole.CTA,
            text=banner.cta_text,
            x=button_x,
            y=button_y,
            width=button_width,
            height=button_height,
            font_size=font_size,
            font_family=self.brand_fonts.primary,
            font_weight=FontWeight.BOLD,
            line_height=1.0,
            text_align=TextAlign.CENTER,
            vertical_align=VerticalAlign.MIDDLE,
            fill="#ffffff",
            z_index=12
        )
        objects.append(cta_text)

        return objects


# =============================================================================
# Helper Function
# =============================================================================

def convert_banner_set_to_canvas(
    banner_set: BannerSetOutput,
    brand_id: str,
    brand_colors: Optional[Dict[str, str]] = None,
    brand_fonts: Optional[Dict[str, str]] = None
) -> List[DocumentPayload]:
    """
    BannerSetOutput → List[DocumentPayload] 변환

    각 배너 사이즈마다 별도의 Document 생성

    Args:
        banner_set: 배너 세트 콘텐츠
        brand_id: 브랜드 ID
        brand_colors: 브랜드 컬러
        brand_fonts: 브랜드 폰트

    Returns:
        List[DocumentPayload]
    """
    converter = BannerToCanvasConverter(
        brand_colors=brand_colors,
        brand_fonts=brand_fonts
    )
    return converter.convert_banner_set(banner_set, brand_id)
