"""
Canvas Document Schemas - Backend Abstract Spec v2.0

Editor-agnostic document specification for visual content generation.
Based on: docs/BACKEND_CANVAS_SPEC_V2.md
"""

from pydantic import BaseModel, Field, field_validator
from typing import Optional, List, Literal, Union, Dict, Any
from enum import Enum


# ===================
# Enums
# ===================

class TextRole(str, Enum):
    """Text element roles with semantic meaning"""
    HEADLINE = "headline"           # 메인 헤드라인 (50자, 36-72px)
    SUBHEADLINE = "subheadline"     # 서브헤드라인 (100자, 24-48px)
    BODY = "body"                   # 본문 텍스트 (14-24px)
    CAPTION = "caption"             # 캡션/부가설명 (200자, 12-16px)
    CTA = "cta"                     # 행동유도 (20자, 16-24px)


class ShapeType(str, Enum):
    """Shape object types"""
    RECT = "rect"
    CIRCLE = "circle"
    ELLIPSE = "ellipse"
    LINE = "line"
    POLYGON = "polygon"


class FontWeight(str, Enum):
    """Font weight values"""
    THIN = "100"
    EXTRA_LIGHT = "200"
    LIGHT = "300"
    NORMAL = "400"
    MEDIUM = "500"
    SEMI_BOLD = "600"
    BOLD = "700"
    EXTRA_BOLD = "800"
    BLACK = "900"


class TextAlign(str, Enum):
    """Text alignment"""
    LEFT = "left"
    CENTER = "center"
    RIGHT = "right"
    JUSTIFY = "justify"


class VerticalAlign(str, Enum):
    """Vertical alignment"""
    TOP = "top"
    MIDDLE = "middle"
    BOTTOM = "bottom"


class ObjectType(str, Enum):
    """Canvas object types"""
    TEXT = "text"
    IMAGE = "image"
    SHAPE = "shape"
    FRAME = "frame"
    GROUP = "group"


class DocumentKind(str, Enum):
    """Document kinds/types"""
    PRODUCT_DETAIL = "product_detail"
    SNS_FEED = "sns_feed"
    SNS_STORY = "sns_story"
    BLOG_THUMBNAIL = "blog_thumbnail"
    AD_BANNER = "ad_banner"


# ===================
# Background Types
# ===================

class BackgroundColor(BaseModel):
    """Solid color background"""
    type: Literal["color"] = "color"
    value: str = Field(..., description="Hex color code", pattern="^#[0-9A-Fa-f]{6}$")


class GradientStop(BaseModel):
    """Gradient color stop"""
    offset: float = Field(..., ge=0.0, le=1.0, description="Position (0-1)")
    color: str = Field(..., description="Hex color code", pattern="^#[0-9A-Fa-f]{6}$")


class BackgroundGradient(BaseModel):
    """Linear or radial gradient background"""
    type: Literal["gradient"] = "gradient"
    gradient_type: Literal["linear", "radial"] = Field(..., description="Gradient type")
    stops: List[GradientStop] = Field(..., min_length=2, description="Color stops")
    angle: Optional[float] = Field(None, description="Angle in degrees (linear only)")
    center_x: Optional[float] = Field(None, ge=0.0, le=1.0, description="Center X (radial only, 0-1)")
    center_y: Optional[float] = Field(None, ge=0.0, le=1.0, description="Center Y (radial only, 0-1)")


class BackgroundImage(BaseModel):
    """Image background"""
    type: Literal["image"] = "image"
    src: str = Field(..., description="Image URL (S3 presigned URL or data URI)")
    fit: Literal["fill", "contain", "cover", "none"] = Field(default="cover", description="Image fit mode")
    opacity: float = Field(default=1.0, ge=0.0, le=1.0, description="Background image opacity")


Background = Union[BackgroundColor, BackgroundGradient, BackgroundImage]


# ===================
# Brand Information
# ===================

class BrandColors(BaseModel):
    """Brand color palette"""
    primary: str = Field(..., description="Primary brand color", pattern="^#[0-9A-Fa-f]{6}$")
    secondary: Optional[str] = Field(None, description="Secondary brand color", pattern="^#[0-9A-Fa-f]{6}$")
    accent: Optional[str] = Field(None, description="Accent color", pattern="^#[0-9A-Fa-f]{6}$")
    text_primary: str = Field(default="#1f2937", description="Primary text color", pattern="^#[0-9A-Fa-f]{6}$")
    text_secondary: str = Field(default="#6b7280", description="Secondary text color", pattern="^#[0-9A-Fa-f]{6}$")
    background: str = Field(default="#ffffff", description="Default background color", pattern="^#[0-9A-Fa-f]{6}$")


class BrandFonts(BaseModel):
    """Brand typography"""
    primary: str = Field(default="Pretendard", description="Primary font family")
    secondary: Optional[str] = Field(None, description="Secondary font family")
    fallback: str = Field(default="sans-serif", description="Fallback font family")


class BrandLogo(BaseModel):
    """Brand logo information"""
    url: str = Field(..., description="Logo image URL")
    width: Optional[float] = Field(None, gt=0, description="Preferred width in px")
    height: Optional[float] = Field(None, gt=0, description="Preferred height in px")


class BrandInfo(BaseModel):
    """Brand identity information"""
    colors: BrandColors
    fonts: BrandFonts
    logo: Optional[BrandLogo] = None


# ===================
# Canvas Objects
# ===================

class BaseObject(BaseModel):
    """Base properties for all canvas objects"""
    id: str = Field(..., description="Unique object ID")
    type: ObjectType = Field(..., description="Object type")
    x: float = Field(..., description="X position in px")
    y: float = Field(..., description="Y position in px")
    width: float = Field(..., gt=0, description="Width in px")
    height: float = Field(..., gt=0, description="Height in px")
    rotation: float = Field(default=0.0, description="Rotation in degrees")
    opacity: float = Field(default=1.0, ge=0.0, le=1.0, description="Opacity (0-1)")
    visible: bool = Field(default=True, description="Visibility")
    locked: bool = Field(default=False, description="Lock state")
    z_index: Optional[int] = Field(None, description="Layer order (higher = front)")


class TextObject(BaseObject):
    """Text element"""
    type: Literal[ObjectType.TEXT] = ObjectType.TEXT
    role: TextRole = Field(..., description="Semantic role")
    text: str = Field(..., description="Text content")

    # Typography
    font_size: float = Field(..., gt=0, description="Font size in px")
    font_family: str = Field(default="Pretendard", description="Font family")
    font_weight: FontWeight = Field(default=FontWeight.NORMAL, description="Font weight")
    line_height: float = Field(default=1.5, gt=0, description="Line height multiplier")
    letter_spacing: float = Field(default=0.0, description="Letter spacing in px")

    # Alignment
    text_align: TextAlign = Field(default=TextAlign.LEFT, description="Horizontal alignment")
    vertical_align: VerticalAlign = Field(default=VerticalAlign.TOP, description="Vertical alignment")

    # Colors
    fill: str = Field(..., description="Text color", pattern="^#[0-9A-Fa-f]{6}$")
    stroke: Optional[str] = Field(None, description="Stroke color", pattern="^#[0-9A-Fa-f]{6}$")
    stroke_width: Optional[float] = Field(None, ge=0, description="Stroke width in px")

    # Effects
    text_decoration: Optional[Literal["underline", "line-through", "none"]] = Field(None, description="Text decoration")
    text_shadow: Optional[str] = Field(None, description="CSS text-shadow value")


class ImageObject(BaseObject):
    """Image element"""
    type: Literal[ObjectType.IMAGE] = ObjectType.IMAGE
    role: Optional[str] = Field(None, description="Semantic role (e.g., 'product_image', 'background')")
    src: str = Field(..., description="Image URL (S3 presigned URL or data URI)")
    fit: Literal["fill", "contain", "cover", "none"] = Field(default="cover", description="Image fit mode")

    # Effects
    border_radius: Optional[float] = Field(None, ge=0, description="Border radius in px")
    filters: Optional[str] = Field(None, description="CSS filter value (e.g., 'blur(5px) brightness(0.8)')")


class ShapeObject(BaseObject):
    """Shape element (rectangle, circle, etc.)"""
    type: Literal[ObjectType.SHAPE] = ObjectType.SHAPE
    role: Optional[str] = Field(None, description="Semantic role (e.g., 'cta_button', 'decoration')")
    shape_type: ShapeType = Field(..., description="Shape type")

    # Fill & Stroke
    fill: Optional[str] = Field(None, description="Fill color", pattern="^#[0-9A-Fa-f]{6}$")
    stroke: Optional[str] = Field(None, description="Stroke color", pattern="^#[0-9A-Fa-f]{6}$")
    stroke_width: float = Field(default=0.0, ge=0, description="Stroke width in px")

    # Shape-specific
    border_radius: Optional[float] = Field(None, ge=0, description="Border radius in px (rect only)")
    points: Optional[List[float]] = Field(None, description="Points for polygon/line [x1,y1,x2,y2,...]")


class FrameObject(BaseObject):
    """Frame/Container element (like Figma Frame)"""
    type: Literal[ObjectType.FRAME] = ObjectType.FRAME
    role: Optional[str] = Field(None, description="Semantic role")
    background: Optional[Background] = Field(None, description="Frame background")
    clip_content: bool = Field(default=True, description="Clip children to frame bounds")
    children: List[str] = Field(default_factory=list, description="Child object IDs")


class GroupObject(BaseObject):
    """Group element (multiple objects treated as one)"""
    type: Literal[ObjectType.GROUP] = ObjectType.GROUP
    role: Optional[str] = Field(None, description="Semantic role")
    children: List[str] = Field(default_factory=list, description="Child object IDs")


CanvasObject = Union[TextObject, ImageObject, ShapeObject, FrameObject, GroupObject]


# ===================
# Page & Document
# ===================

class PagePayload(BaseModel):
    """Single page/canvas in the document"""
    id: str = Field(..., description="Unique page ID")
    width: float = Field(..., gt=0, description="Canvas width in px")
    height: float = Field(..., gt=0, description="Canvas height in px")
    background: Background = Field(..., description="Page background")
    objects: List[CanvasObject] = Field(default_factory=list, description="Canvas objects (flat list)")


class DocumentMetadata(BaseModel):
    """Document metadata"""
    title: Optional[str] = Field(None, description="Document title")
    description: Optional[str] = Field(None, description="Document description")
    tags: List[str] = Field(default_factory=list, description="Document tags")
    created_at: Optional[str] = Field(None, description="ISO 8601 timestamp")
    version: str = Field(default="2.0", description="Spec version")


class DocumentPayload(BaseModel):
    """Complete document payload (editor-agnostic)"""
    id: str = Field(..., description="Unique document ID")
    kind: DocumentKind = Field(..., description="Document type")
    brand: BrandInfo = Field(..., description="Brand information")
    pages: List[PagePayload] = Field(..., min_length=1, description="Document pages")
    metadata: Optional[DocumentMetadata] = Field(None, description="Document metadata")
    bindings: Optional[Dict[str, str]] = Field(None, description="Data bindings (path -> data_key)")

    @field_validator('pages')
    @classmethod
    def validate_pages_not_empty(cls, v):
        if not v:
            raise ValueError("Document must have at least one page")
        return v


# ===================
# API Response
# ===================

class CanvasGenerateResponse(BaseModel):
    """API response for canvas generation"""
    success: bool = Field(..., description="Success status")
    document: Optional[DocumentPayload] = Field(None, description="Generated document")
    error: Optional[str] = Field(None, description="Error message if failed")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional metadata")


# ===================
# Validation Helpers
# ===================

def validate_text_role_constraints(text_obj: TextObject) -> None:
    """Validate text object against role constraints"""
    constraints = {
        TextRole.HEADLINE: {"max_length": 50, "min_font_size": 36, "max_font_size": 72},
        TextRole.SUBHEADLINE: {"max_length": 100, "min_font_size": 24, "max_font_size": 48},
        TextRole.BODY: {"max_length": None, "min_font_size": 14, "max_font_size": 24},
        TextRole.CAPTION: {"max_length": 200, "min_font_size": 12, "max_font_size": 16},
        TextRole.CTA: {"max_length": 20, "min_font_size": 16, "max_font_size": 24},
    }

    constraint = constraints.get(text_obj.role)
    if not constraint:
        return

    # Check text length
    if constraint["max_length"] and len(text_obj.text) > constraint["max_length"]:
        raise ValueError(f"{text_obj.role} text exceeds {constraint['max_length']} characters")

    # Check font size range
    if text_obj.font_size < constraint["min_font_size"]:
        raise ValueError(f"{text_obj.role} font size {text_obj.font_size}px is below minimum {constraint['min_font_size']}px")
    if text_obj.font_size > constraint["max_font_size"]:
        raise ValueError(f"{text_obj.role} font size {text_obj.font_size}px exceeds maximum {constraint['max_font_size']}px")
