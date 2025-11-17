"""
Fabric.js Canvas Builder

Fabric.js 호환 Canvas JSON 생성

작성일: 2025-11-17
작성자: B팀 (Backend)
참고: Fabric.js v5.3.0 toJSON() 형식
"""

from typing import Dict, Any, List, Optional
import logging

logger = logging.getLogger(__name__)


class FabricCanvasBuilder:
    """
    Fabric.js 호환 Canvas JSON 생성 클래스

    Fabric.js v5.3.0 toJSON() 형식으로 Canvas 객체 생성

    사용 예시:
        builder = FabricCanvasBuilder()
        builder.add_text("Hello World", left=100, top=100)
        builder.add_rect(left=50, top=50, width=200, height=100, fill="#3b82f6")
        canvas_json = builder.build()
    """

    def __init__(self, width: int = 1200, height: int = 800, background: str = "#ffffff"):
        """
        Canvas Builder 초기화

        Args:
            width: Canvas 너비
            height: Canvas 높이
            background: 배경색
        """
        self.width = width
        self.height = height
        self.background = background
        self.objects: List[Dict[str, Any]] = []

    def add_text(
        self,
        text: str,
        left: float = 100,
        top: float = 100,
        font_size: int = 24,
        font_family: str = "Pretendard",
        fill: str = "#000000",
        font_weight: str = "normal",
        **kwargs
    ) -> "FabricCanvasBuilder":
        """
        텍스트 객체 추가

        Args:
            text: 텍스트 내용
            left: 왼쪽 위치
            top: 위쪽 위치
            font_size: 폰트 크기
            font_family: 폰트 패밀리
            fill: 텍스트 색상
            font_weight: 폰트 굵기
            **kwargs: 추가 Fabric.js 속성

        Returns:
            self (메서드 체이닝)
        """
        text_obj = {
            "type": "text",
            "version": "5.3.0",
            "originX": "left",
            "originY": "top",
            "left": left,
            "top": top,
            "width": len(text) * font_size * 0.6,  # 대략적 너비 계산
            "height": font_size,
            "fill": fill,
            "stroke": None,
            "strokeWidth": 0,
            "strokeDashArray": None,
            "strokeLineCap": "butt",
            "strokeLineJoin": "miter",
            "strokeMiterLimit": 4,
            "scaleX": 1,
            "scaleY": 1,
            "angle": 0,
            "flipX": False,
            "flipY": False,
            "opacity": 1,
            "shadow": None,
            "visible": True,
            "backgroundColor": "",
            "fillRule": "nonzero",
            "paintFirst": "fill",
            "globalCompositeOperation": "source-over",
            "skewX": 0,
            "skewY": 0,
            "text": text,
            "fontSize": font_size,
            "fontWeight": font_weight,
            "fontFamily": font_family,
            "fontStyle": "normal",
            "lineHeight": 1.16,
            "underline": False,
            "overline": False,
            "linethrough": False,
            "textAlign": "left",
            "textBackgroundColor": "",
            "charSpacing": 0,
            "minWidth": 20,
            "splitByGrapheme": False,
            **kwargs
        }

        self.objects.append(text_obj)
        return self

    def add_rect(
        self,
        left: float,
        top: float,
        width: float,
        height: float,
        fill: str = "#3b82f6",
        stroke: Optional[str] = None,
        stroke_width: float = 0,
        rx: float = 0,
        ry: float = 0,
        **kwargs
    ) -> "FabricCanvasBuilder":
        """
        사각형 객체 추가

        Args:
            left: 왼쪽 위치
            top: 위쪽 위치
            width: 너비
            height: 높이
            fill: 채우기 색상
            stroke: 테두리 색상
            stroke_width: 테두리 두께
            rx: 가로 모서리 둥글기
            ry: 세로 모서리 둥글기
            **kwargs: 추가 Fabric.js 속성

        Returns:
            self (메서드 체이닝)
        """
        rect_obj = {
            "type": "rect",
            "version": "5.3.0",
            "originX": "left",
            "originY": "top",
            "left": left,
            "top": top,
            "width": width,
            "height": height,
            "fill": fill,
            "stroke": stroke,
            "strokeWidth": stroke_width,
            "strokeDashArray": None,
            "strokeLineCap": "butt",
            "strokeLineJoin": "miter",
            "strokeMiterLimit": 4,
            "scaleX": 1,
            "scaleY": 1,
            "angle": 0,
            "flipX": False,
            "flipY": False,
            "opacity": 1,
            "shadow": None,
            "visible": True,
            "backgroundColor": "",
            "fillRule": "nonzero",
            "paintFirst": "fill",
            "globalCompositeOperation": "source-over",
            "skewX": 0,
            "skewY": 0,
            "rx": rx,
            "ry": ry,
            **kwargs
        }

        self.objects.append(rect_obj)
        return self

    def add_circle(
        self,
        left: float,
        top: float,
        radius: float,
        fill: str = "#3b82f6",
        stroke: Optional[str] = None,
        stroke_width: float = 0,
        **kwargs
    ) -> "FabricCanvasBuilder":
        """
        원 객체 추가

        Args:
            left: 왼쪽 위치
            top: 위쪽 위치
            radius: 반지름
            fill: 채우기 색상
            stroke: 테두리 색상
            stroke_width: 테두리 두께
            **kwargs: 추가 Fabric.js 속성

        Returns:
            self (메서드 체이닝)
        """
        circle_obj = {
            "type": "circle",
            "version": "5.3.0",
            "originX": "left",
            "originY": "top",
            "left": left,
            "top": top,
            "width": radius * 2,
            "height": radius * 2,
            "fill": fill,
            "stroke": stroke,
            "strokeWidth": stroke_width,
            "strokeDashArray": None,
            "strokeLineCap": "butt",
            "strokeLineJoin": "miter",
            "strokeMiterLimit": 4,
            "scaleX": 1,
            "scaleY": 1,
            "angle": 0,
            "flipX": False,
            "flipY": False,
            "opacity": 1,
            "shadow": None,
            "visible": True,
            "backgroundColor": "",
            "fillRule": "nonzero",
            "paintFirst": "fill",
            "globalCompositeOperation": "source-over",
            "skewX": 0,
            "skewY": 0,
            "radius": radius,
            "startAngle": 0,
            "endAngle": 6.283185307179586,
            **kwargs
        }

        self.objects.append(circle_obj)
        return self

    def add_image(
        self,
        src: str,
        left: float,
        top: float,
        width: float,
        height: float,
        **kwargs
    ) -> "FabricCanvasBuilder":
        """
        이미지 객체 추가

        Args:
            src: 이미지 URL
            left: 왼쪽 위치
            top: 위쪽 위치
            width: 너비
            height: 높이
            **kwargs: 추가 Fabric.js 속성

        Returns:
            self (메서드 체이닝)
        """
        image_obj = {
            "type": "image",
            "version": "5.3.0",
            "originX": "left",
            "originY": "top",
            "left": left,
            "top": top,
            "width": width,
            "height": height,
            "fill": "rgb(0,0,0)",
            "stroke": None,
            "strokeWidth": 0,
            "strokeDashArray": None,
            "strokeLineCap": "butt",
            "strokeLineJoin": "miter",
            "strokeMiterLimit": 4,
            "scaleX": 1,
            "scaleY": 1,
            "angle": 0,
            "flipX": False,
            "flipY": False,
            "opacity": 1,
            "shadow": None,
            "visible": True,
            "backgroundColor": "",
            "fillRule": "nonzero",
            "paintFirst": "fill",
            "globalCompositeOperation": "source-over",
            "skewX": 0,
            "skewY": 0,
            "cropX": 0,
            "cropY": 0,
            "src": src,
            **kwargs
        }

        self.objects.append(image_obj)
        return self

    def build(self) -> Dict[str, Any]:
        """
        Fabric.js Canvas JSON 생성

        Returns:
            Fabric.js 호환 Canvas JSON
        """
        return {
            "version": "5.3.0",
            "objects": self.objects,
            "background": self.background
        }

    def clear(self) -> "FabricCanvasBuilder":
        """
        모든 객체 제거

        Returns:
            self (메서드 체이닝)
        """
        self.objects = []
        return self


def create_product_detail_canvas(text_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Product Detail용 Canvas 생성

    Args:
        text_data: 텍스트 데이터 (headline, subheadline, body 등)

    Returns:
        Fabric.js Canvas JSON
    """
    builder = FabricCanvasBuilder(width=1200, height=1600)

    # 1. 배경 사각형
    builder.add_rect(
        left=0,
        top=0,
        width=1200,
        height=400,
        fill="#f3f4f6",
        rx=0,
        ry=0
    )

    # 2. 헤드라인
    if text_data.get("headline"):
        builder.add_text(
            text=text_data["headline"],
            left=100,
            top=100,
            font_size=48,
            font_weight="bold",
            fill="#1f2937"
        )

    # 3. 서브헤드라인
    if text_data.get("subheadline"):
        builder.add_text(
            text=text_data["subheadline"],
            left=100,
            top=180,
            font_size=24,
            font_weight="normal",
            fill="#6b7280"
        )

    # 4. 본문
    if text_data.get("body"):
        # 본문이 너무 길면 150자로 제한
        body_text = text_data["body"][:150] + "..." if len(text_data.get("body", "")) > 150 else text_data.get("body", "")

        builder.add_text(
            text=body_text,
            left=100,
            top=450,
            font_size=16,
            font_weight="normal",
            fill="#374151"
        )

    # 5. Bullet Points
    if text_data.get("bullets"):
        bullets = text_data["bullets"]
        for idx, bullet in enumerate(bullets[:3]):  # 최대 3개
            # 아이콘 (원)
            builder.add_circle(
                left=100,
                top=650 + idx * 100,
                radius=12,
                fill="#3b82f6"
            )

            # Bullet 텍스트
            builder.add_text(
                text=bullet,
                left=140,
                top=640 + idx * 100,
                font_size=18,
                font_weight="normal",
                fill="#1f2937"
            )

    # 6. CTA 버튼
    if text_data.get("cta"):
        # 버튼 배경
        builder.add_rect(
            left=100,
            top=1050,
            width=200,
            height=60,
            fill="#3b82f6",
            rx=8,
            ry=8
        )

        # 버튼 텍스트
        builder.add_text(
            text=text_data["cta"],
            left=150,
            top=1070,
            font_size=18,
            font_weight="bold",
            fill="#ffffff"
        )

    return builder.build()


def create_brand_identity_canvas(text_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Brand Identity용 Canvas 생성

    Args:
        text_data: 텍스트 데이터

    Returns:
        Fabric.js Canvas JSON
    """
    builder = FabricCanvasBuilder(width=1200, height=1200)

    # 간단한 브랜드 아이덴티티 레이아웃
    builder.add_text(
        text=text_data.get("headline", "Brand Identity"),
        left=100,
        top=100,
        font_size=60,
        font_weight="bold",
        fill="#1f2937"
    )

    if text_data.get("body"):
        builder.add_text(
            text=text_data["body"][:200],
            left=100,
            top=200,
            font_size=18,
            fill="#6b7280"
        )

    return builder.build()


def create_sns_set_canvas(text_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    SNS Set용 Canvas 생성 (정사각형 1080x1080)

    Args:
        text_data: 텍스트 데이터

    Returns:
        Fabric.js Canvas JSON
    """
    builder = FabricCanvasBuilder(width=1080, height=1080, background="#ffffff")

    # SNS 카드 스타일
    builder.add_rect(
        left=40,
        top=40,
        width=1000,
        height=1000,
        fill="#f9fafb",
        stroke="#e5e7eb",
        stroke_width=2,
        rx=16,
        ry=16
    )

    # 헤드라인 (중앙)
    if text_data.get("headline"):
        builder.add_text(
            text=text_data["headline"],
            left=540,
            top=400,
            font_size=36,
            font_weight="bold",
            fill="#1f2937",
            textAlign="center",
            originX="center"
        )

    # 서브헤드라인
    if text_data.get("subheadline"):
        builder.add_text(
            text=text_data["subheadline"],
            left=540,
            top=480,
            font_size=20,
            font_weight="normal",
            fill="#6b7280",
            textAlign="center",
            originX="center"
        )

    # CTA
    if text_data.get("cta"):
        # CTA 버튼 배경
        builder.add_rect(
            left=390,
            top=900,
            width=300,
            height=70,
            fill="#3b82f6",
            rx=35,
            ry=35
        )

        # CTA 텍스트
        builder.add_text(
            text=text_data["cta"],
            left=540,
            top=920,
            font_size=22,
            font_weight="bold",
            fill="#ffffff",
            textAlign="center",
            originX="center"
        )

    return builder.build()
