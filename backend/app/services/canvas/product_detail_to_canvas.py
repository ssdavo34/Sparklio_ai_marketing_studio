"""
Product Detail to Canvas Converter

ProductDetailFullOutput → Canvas DocumentPayload 변환 유틸리티

작성일: 2025-11-24
작성자: B팀 (Backend)
참조: BACKEND_CANVAS_SPEC_V2.md
"""

from typing import List, Dict, Any, Optional
from uuid import uuid4

from app.schemas.product_detail import ProductDetailFullOutput
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
    TextObject,
    ImageObject,
    ShapeObject,
    FrameObject,
    TextRole,
    FontWeight,
    TextAlign,
    VerticalAlign,
    ShapeType,
    ObjectType
)


class ProductDetailToCanvasConverter:
    """
    상품 상세페이지 콘텐츠를 Canvas JSON으로 변환

    Layout 구조:
    - 1개 Page (세로 스크롤 형태)
    - 4개 섹션 (Hero, Problem/Solution, Specs, FAQ)
    - 각 섹션은 Frame으로 구성
    """

    def __init__(
        self,
        canvas_width: float = 1200,
        brand_colors: Optional[Dict[str, str]] = None,
        brand_fonts: Optional[Dict[str, str]] = None
    ):
        """
        Args:
            canvas_width: Canvas 너비 (기본 1200px)
            brand_colors: 브랜드 컬러 딕셔너리 (primary, secondary, accent)
            brand_fonts: 브랜드 폰트 딕셔너리 (primary, secondary)
        """
        self.canvas_width = canvas_width
        self.section_padding = 60  # 섹션 간 패딩
        self.content_padding = 40  # 섹션 내부 패딩

        # 기본 브랜드 정보
        self.brand_colors = BrandColors(
            primary=brand_colors.get("primary", "#3b82f6") if brand_colors else "#3b82f6",
            secondary=brand_colors.get("secondary", "#8b5cf6") if brand_colors else "#8b5cf6",
            accent=brand_colors.get("accent", "#ec4899") if brand_colors else "#ec4899",
            text_primary="#1f2937",
            text_secondary="#6b7280",
            background="#ffffff"
        )

        self.brand_fonts = BrandFonts(
            primary=brand_fonts.get("primary", "Pretendard") if brand_fonts else "Pretendard",
            secondary=brand_fonts.get("secondary") if brand_fonts else None,
            fallback="sans-serif"
        )

    def convert(
        self,
        content: ProductDetailFullOutput,
        brand_id: str,
        include_images: bool = True
    ) -> DocumentPayload:
        """
        ProductDetailFullOutput → DocumentPayload 변환

        Args:
            content: 상품 상세 콘텐츠
            brand_id: 브랜드 ID
            include_images: 이미지 포함 여부

        Returns:
            DocumentPayload
        """
        # Page 생성
        page = self._build_page(content, include_images)

        # Brand Info
        brand = BrandInfo(
            colors=self.brand_colors,
            fonts=self.brand_fonts,
            logo=None  # TODO: BrandKit에서 로고 조회
        )

        # Document Metadata
        metadata = DocumentMetadata(
            title=f"{content.hero.headline} - 상품 상세",
            description=content.hero.subheadline,
            tags=["product_detail", content.tone, content.language],
            created_at=content.generated_at.isoformat(),
            version="2.0"
        )

        # Document 생성
        document = DocumentPayload(
            id=str(uuid4()),
            kind=DocumentKind.PRODUCT_DETAIL,
            brand=brand,
            pages=[page],
            metadata=metadata,
            bindings=None
        )

        return document

    def _build_page(
        self,
        content: ProductDetailFullOutput,
        include_images: bool
    ) -> PagePayload:
        """
        전체 Page 구성

        Layout:
        1. Hero Section (이미지 + 헤드라인 + CTA)
        2. Problem/Solution Section (문제점 + 솔루션)
        3. Specs Section (제품 사양 테이블)
        4. FAQ Section (Q&A 아코디언)
        """
        objects: List[Any] = []
        current_y = 0

        # 1. Hero Section
        hero_section, hero_height = self._build_hero_section(content.hero, current_y, include_images)
        objects.extend(hero_section)
        current_y += hero_height + self.section_padding

        # 2. Problem/Solution Section
        ps_section, ps_height = self._build_problem_solution_section(content.problem_solution, current_y)
        objects.extend(ps_section)
        current_y += ps_height + self.section_padding

        # 3. Specs Section
        specs_section, specs_height = self._build_specs_section(content.specs, current_y)
        objects.extend(specs_section)
        current_y += specs_height + self.section_padding

        # 4. FAQ Section
        faq_section, faq_height = self._build_faq_section(content.faq, current_y)
        objects.extend(faq_section)
        current_y += faq_height + self.section_padding

        # 총 높이
        total_height = current_y

        # Page 생성
        page = PagePayload(
            id="page_1",
            width=self.canvas_width,
            height=total_height,
            background=BackgroundColor(type="color", value=self.brand_colors.background),
            objects=objects
        )

        return page

    def _build_hero_section(
        self,
        hero: Any,
        y_offset: float,
        include_images: bool
    ) -> tuple[List[Any], float]:
        """
        Hero Section 생성

        Layout:
        - 왼쪽: 이미지 (옵션)
        - 오른쪽: 헤드라인 + 서브헤드라인 + CTA 버튼
        """
        objects = []
        section_height = 600

        # Background Frame
        frame = FrameObject(
            id=f"hero_frame_{uuid4().hex[:8]}",
            type=ObjectType.FRAME,
            x=0,
            y=y_offset,
            width=self.canvas_width,
            height=section_height,
            role="hero_section",
            background=BackgroundColor(type="color", value="#f9fafb"),
            clip_content=True,
            children=[]
        )
        objects.append(frame)

        content_x = self.content_padding
        content_width = self.canvas_width - (2 * self.content_padding)

        if include_images and hero.image_url:
            # 이미지 (왼쪽 50%)
            image = ImageObject(
                id=f"hero_image_{uuid4().hex[:8]}",
                type=ObjectType.IMAGE,
                role="hero_image",
                x=content_x,
                y=y_offset + self.content_padding,
                width=content_width * 0.5 - 20,
                height=section_height - (2 * self.content_padding),
                src=hero.image_url,
                fit="cover",
                border_radius=12
            )
            objects.append(image)

            # 텍스트는 오른쪽 50%
            text_x = content_x + (content_width * 0.5) + 20
            text_width = content_width * 0.5 - 20
        else:
            # 텍스트 전체 너비
            text_x = content_x + 100
            text_width = content_width - 200

        # Headline
        headline = TextObject(
            id=f"hero_headline_{uuid4().hex[:8]}",
            type=ObjectType.TEXT,
            role=TextRole.HEADLINE,
            text=hero.headline,
            x=text_x,
            y=y_offset + 150,
            width=text_width,
            height=80,
            font_size=48,
            font_family=self.brand_fonts.primary,
            font_weight=FontWeight.BOLD,
            line_height=1.2,
            text_align=TextAlign.LEFT,
            vertical_align=VerticalAlign.TOP,
            fill=self.brand_colors.text_primary
        )
        objects.append(headline)

        # Subheadline
        subheadline = TextObject(
            id=f"hero_subheadline_{uuid4().hex[:8]}",
            type=ObjectType.TEXT,
            role=TextRole.SUBHEADLINE,
            text=hero.subheadline,
            x=text_x,
            y=y_offset + 250,
            width=text_width,
            height=60,
            font_size=24,
            font_family=self.brand_fonts.primary,
            font_weight=FontWeight.NORMAL,
            line_height=1.5,
            text_align=TextAlign.LEFT,
            vertical_align=VerticalAlign.TOP,
            fill=self.brand_colors.text_secondary
        )
        objects.append(subheadline)

        # CTA Button (Shape + Text)
        cta_button_bg = ShapeObject(
            id=f"cta_button_bg_{uuid4().hex[:8]}",
            type=ObjectType.SHAPE,
            role="cta_button",
            shape_type=ShapeType.RECT,
            x=text_x,
            y=y_offset + 350,
            width=200,
            height=60,
            fill=self.brand_colors.primary,
            border_radius=8
        )
        objects.append(cta_button_bg)

        cta_text = TextObject(
            id=f"cta_text_{uuid4().hex[:8]}",
            type=ObjectType.TEXT,
            role=TextRole.CTA,
            text=hero.cta,
            x=text_x,
            y=y_offset + 350,
            width=200,
            height=60,
            font_size=18,
            font_family=self.brand_fonts.primary,
            font_weight=FontWeight.SEMI_BOLD,
            line_height=1.0,
            text_align=TextAlign.CENTER,
            vertical_align=VerticalAlign.MIDDLE,
            fill="#ffffff"
        )
        objects.append(cta_text)

        return objects, section_height

    def _build_problem_solution_section(
        self,
        ps: Any,
        y_offset: float
    ) -> tuple[List[Any], float]:
        """
        Problem/Solution Section 생성

        Layout:
        - 섹션 제목
        - 문제점 리스트 (아이콘 + 텍스트)
        - 솔루션 제목
        - 솔루션 리스트 (체크마크 + 텍스트)
        """
        objects = []
        current_y = y_offset + self.content_padding
        content_x = self.content_padding + 100
        content_width = self.canvas_width - (2 * self.content_padding) - 200

        # Section Title
        section_title = TextObject(
            id=f"ps_title_{uuid4().hex[:8]}",
            type=ObjectType.TEXT,
            role=TextRole.HEADLINE,
            text=ps.section_title,
            x=content_x,
            y=current_y,
            width=content_width,
            height=60,
            font_size=36,
            font_family=self.brand_fonts.primary,
            font_weight=FontWeight.BOLD,
            line_height=1.3,
            text_align=TextAlign.CENTER,
            vertical_align=VerticalAlign.TOP,
            fill=self.brand_colors.text_primary
        )
        objects.append(section_title)
        current_y += 80

        # Problems (빨간 X 아이콘 + 텍스트)
        for idx, problem in enumerate(ps.problems):
            # Icon (Shape)
            icon = ShapeObject(
                id=f"problem_icon_{idx}_{uuid4().hex[:8]}",
                type=ObjectType.SHAPE,
                shape_type=ShapeType.CIRCLE,
                x=content_x,
                y=current_y + 5,
                width=30,
                height=30,
                fill="#ef4444",
                stroke=None
            )
            objects.append(icon)

            # Text
            problem_text = TextObject(
                id=f"problem_text_{idx}_{uuid4().hex[:8]}",
                type=ObjectType.TEXT,
                role=TextRole.BODY,
                text=problem,
                x=content_x + 50,
                y=current_y,
                width=content_width - 50,
                height=40,
                font_size=18,
                font_family=self.brand_fonts.primary,
                font_weight=FontWeight.NORMAL,
                line_height=1.5,
                text_align=TextAlign.LEFT,
                vertical_align=VerticalAlign.MIDDLE,
                fill=self.brand_colors.text_primary
            )
            objects.append(problem_text)
            current_y += 50

        current_y += 40

        # Solution Title
        solution_title = TextObject(
            id=f"solution_title_{uuid4().hex[:8]}",
            type=ObjectType.TEXT,
            role=TextRole.SUBHEADLINE,
            text=ps.solution_title,
            x=content_x,
            y=current_y,
            width=content_width,
            height=50,
            font_size=28,
            font_family=self.brand_fonts.primary,
            font_weight=FontWeight.BOLD,
            line_height=1.3,
            text_align=TextAlign.CENTER,
            vertical_align=VerticalAlign.TOP,
            fill=self.brand_colors.primary
        )
        objects.append(solution_title)
        current_y += 70

        # Solutions (녹색 체크 아이콘 + 텍스트)
        for idx, solution in enumerate(ps.solutions):
            # Icon (Shape)
            icon = ShapeObject(
                id=f"solution_icon_{idx}_{uuid4().hex[:8]}",
                type=ObjectType.SHAPE,
                shape_type=ShapeType.CIRCLE,
                x=content_x,
                y=current_y + 5,
                width=30,
                height=30,
                fill="#10b981",
                stroke=None
            )
            objects.append(icon)

            # Text
            solution_text = TextObject(
                id=f"solution_text_{idx}_{uuid4().hex[:8]}",
                type=ObjectType.TEXT,
                role=TextRole.BODY,
                text=solution,
                x=content_x + 50,
                y=current_y,
                width=content_width - 50,
                height=40,
                font_size=18,
                font_family=self.brand_fonts.primary,
                font_weight=FontWeight.NORMAL,
                line_height=1.5,
                text_align=TextAlign.LEFT,
                vertical_align=VerticalAlign.MIDDLE,
                fill=self.brand_colors.text_primary
            )
            objects.append(solution_text)
            current_y += 50

        section_height = current_y - y_offset + self.content_padding
        return objects, section_height

    def _build_specs_section(
        self,
        specs: Any,
        y_offset: float
    ) -> tuple[List[Any], float]:
        """
        Specs Section 생성

        Layout:
        - 섹션 제목
        - 2-column 테이블 형태 (Key | Value)
        """
        objects = []
        current_y = y_offset + self.content_padding
        content_x = self.content_padding + 100
        content_width = self.canvas_width - (2 * self.content_padding) - 200

        # Section Title
        section_title = TextObject(
            id=f"specs_title_{uuid4().hex[:8]}",
            type=ObjectType.TEXT,
            role=TextRole.HEADLINE,
            text=specs.section_title,
            x=content_x,
            y=current_y,
            width=content_width,
            height=60,
            font_size=36,
            font_family=self.brand_fonts.primary,
            font_weight=FontWeight.BOLD,
            line_height=1.3,
            text_align=TextAlign.CENTER,
            vertical_align=VerticalAlign.TOP,
            fill=self.brand_colors.text_primary
        )
        objects.append(section_title)
        current_y += 80

        # Specs Table (Key-Value rows)
        row_height = 50
        key_width = content_width * 0.35
        value_width = content_width * 0.65

        for idx, (key, value) in enumerate(specs.specs.items()):
            # Row background (alternating colors)
            row_bg = ShapeObject(
                id=f"spec_row_bg_{idx}_{uuid4().hex[:8]}",
                type=ObjectType.SHAPE,
                shape_type=ShapeType.RECT,
                x=content_x,
                y=current_y,
                width=content_width,
                height=row_height,
                fill="#f9fafb" if idx % 2 == 0 else "#ffffff",
                border_radius=4
            )
            objects.append(row_bg)

            # Key
            key_text = TextObject(
                id=f"spec_key_{idx}_{uuid4().hex[:8]}",
                type=ObjectType.TEXT,
                role=TextRole.BODY,
                text=key,
                x=content_x + 20,
                y=current_y,
                width=key_width - 40,
                height=row_height,
                font_size=16,
                font_family=self.brand_fonts.primary,
                font_weight=FontWeight.SEMI_BOLD,
                line_height=1.5,
                text_align=TextAlign.LEFT,
                vertical_align=VerticalAlign.MIDDLE,
                fill=self.brand_colors.text_primary
            )
            objects.append(key_text)

            # Value
            value_text = TextObject(
                id=f"spec_value_{idx}_{uuid4().hex[:8]}",
                type=ObjectType.TEXT,
                role=TextRole.BODY,
                text=value,
                x=content_x + key_width + 20,
                y=current_y,
                width=value_width - 40,
                height=row_height,
                font_size=16,
                font_family=self.brand_fonts.primary,
                font_weight=FontWeight.NORMAL,
                line_height=1.5,
                text_align=TextAlign.LEFT,
                vertical_align=VerticalAlign.MIDDLE,
                fill=self.brand_colors.text_secondary
            )
            objects.append(value_text)

            current_y += row_height

        section_height = current_y - y_offset + self.content_padding
        return objects, section_height

    def _build_faq_section(
        self,
        faq: Any,
        y_offset: float
    ) -> tuple[List[Any], float]:
        """
        FAQ Section 생성

        Layout:
        - 섹션 제목
        - Q&A 아코디언 형태 (질문 + 답변)
        """
        objects = []
        current_y = y_offset + self.content_padding
        content_x = self.content_padding + 100
        content_width = self.canvas_width - (2 * self.content_padding) - 200

        # Section Title
        section_title = TextObject(
            id=f"faq_title_{uuid4().hex[:8]}",
            type=ObjectType.TEXT,
            role=TextRole.HEADLINE,
            text=faq.section_title,
            x=content_x,
            y=current_y,
            width=content_width,
            height=60,
            font_size=36,
            font_family=self.brand_fonts.primary,
            font_weight=FontWeight.BOLD,
            line_height=1.3,
            text_align=TextAlign.CENTER,
            vertical_align=VerticalAlign.TOP,
            fill=self.brand_colors.text_primary
        )
        objects.append(section_title)
        current_y += 80

        # FAQ Items
        for idx, item in enumerate(faq.faqs):
            # Question Background
            q_bg = ShapeObject(
                id=f"faq_q_bg_{idx}_{uuid4().hex[:8]}",
                type=ObjectType.SHAPE,
                shape_type=ShapeType.RECT,
                x=content_x,
                y=current_y,
                width=content_width,
                height=50,
                fill=self.brand_colors.primary,
                border_radius=8
            )
            objects.append(q_bg)

            # Question
            question_text = TextObject(
                id=f"faq_question_{idx}_{uuid4().hex[:8]}",
                type=ObjectType.TEXT,
                role=TextRole.BODY,
                text=f"Q. {item.question}",
                x=content_x + 20,
                y=current_y,
                width=content_width - 40,
                height=50,
                font_size=18,
                font_family=self.brand_fonts.primary,
                font_weight=FontWeight.SEMI_BOLD,
                line_height=1.5,
                text_align=TextAlign.LEFT,
                vertical_align=VerticalAlign.MIDDLE,
                fill="#ffffff"
            )
            objects.append(question_text)
            current_y += 60

            # Answer Background
            answer_height = max(80, len(item.answer) * 0.5)  # 대략적인 높이 계산
            a_bg = ShapeObject(
                id=f"faq_a_bg_{idx}_{uuid4().hex[:8]}",
                type=ObjectType.SHAPE,
                shape_type=ShapeType.RECT,
                x=content_x,
                y=current_y,
                width=content_width,
                height=answer_height,
                fill="#f9fafb",
                border_radius=8
            )
            objects.append(a_bg)

            # Answer
            answer_text = TextObject(
                id=f"faq_answer_{idx}_{uuid4().hex[:8]}",
                type=ObjectType.TEXT,
                role=TextRole.BODY,
                text=f"A. {item.answer}",
                x=content_x + 20,
                y=current_y + 10,
                width=content_width - 40,
                height=answer_height - 20,
                font_size=16,
                font_family=self.brand_fonts.primary,
                font_weight=FontWeight.NORMAL,
                line_height=1.6,
                text_align=TextAlign.LEFT,
                vertical_align=VerticalAlign.TOP,
                fill=self.brand_colors.text_secondary
            )
            objects.append(answer_text)
            current_y += answer_height + 20

        section_height = current_y - y_offset + self.content_padding
        return objects, section_height


# =============================================================================
# Helper Function
# =============================================================================

def convert_product_detail_to_canvas(
    content: ProductDetailFullOutput,
    brand_id: str,
    canvas_width: float = 1200,
    brand_colors: Optional[Dict[str, str]] = None,
    brand_fonts: Optional[Dict[str, str]] = None,
    include_images: bool = True
) -> DocumentPayload:
    """
    ProductDetailFullOutput → Canvas DocumentPayload 변환

    Args:
        content: 상품 상세 콘텐츠
        brand_id: 브랜드 ID
        canvas_width: Canvas 너비
        brand_colors: 브랜드 컬러
        brand_fonts: 브랜드 폰트
        include_images: 이미지 포함 여부

    Returns:
        DocumentPayload
    """
    converter = ProductDetailToCanvasConverter(
        canvas_width=canvas_width,
        brand_colors=brand_colors,
        brand_fonts=brand_fonts
    )
    return converter.convert(content, brand_id, include_images)
