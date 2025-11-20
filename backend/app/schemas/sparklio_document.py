"""
Sparklio Document Pydantic 스키마

API 요청/응답에 사용되는 스키마 정의

작성일: 2025-11-20
작성자: B팀 (Backend)
문서: SPARKLIO_EDITOR_PLAN_v1.1
"""

from pydantic import BaseModel, Field, ConfigDict, field_validator
from typing import Optional, List, Dict, Any, Literal
from datetime import datetime
from uuid import UUID
import uuid


# ============================================================================
# Element 스키마 (문서 구성 요소)
# ============================================================================

class SparklioElementType(str):
    """엘리먼트 타입"""
    TEXT = "text"
    IMAGE = "image"
    SHAPE = "shape"
    FRAME = "frame"
    GROUP = "group"
    VIDEO = "video"


class ElementProps(BaseModel):
    """엘리먼트 속성"""
    # 공통 스타일
    fill: Optional[str] = None
    stroke: Optional[str] = None
    strokeWidth: Optional[float] = None
    opacity: Optional[float] = 1.0
    visible: Optional[bool] = True
    locked: Optional[bool] = False

    # 텍스트 속성
    text: Optional[str] = None
    fontSize: Optional[float] = None
    fontFamily: Optional[str] = None
    fontWeight: Optional[str] = None
    fontStyle: Optional[str] = None
    textAlign: Optional[str] = None
    lineHeight: Optional[float] = None
    letterSpacing: Optional[float] = None
    textDecoration: Optional[str] = None
    color: Optional[str] = None

    # 이미지/비디오 속성
    src: Optional[str] = None
    cropX: Optional[float] = None
    cropY: Optional[float] = None
    cropWidth: Optional[float] = None
    cropHeight: Optional[float] = None

    # 셰이프 속성
    radius: Optional[float] = None
    points: Optional[List[float]] = None

    # 기타 동적 속성
    extra: Optional[Dict[str, Any]] = Field(default_factory=dict)

    model_config = ConfigDict(extra='allow')


class SparklioElement(BaseModel):
    """Sparklio 엘리먼트"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    type: Literal["text", "image", "shape", "frame", "group", "video"]
    x: float
    y: float
    width: float
    height: float
    rotation: Optional[float] = 0
    scaleX: Optional[float] = 1
    scaleY: Optional[float] = 1
    props: ElementProps = Field(default_factory=ElementProps)

    @field_validator('id', mode='before')
    @classmethod
    def ensure_id(cls, v):
        if not v:
            return str(uuid.uuid4())
        return v


# ============================================================================
# Page 스키마
# ============================================================================

class SparklioPage(BaseModel):
    """Sparklio 페이지"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str = Field(default="Untitled Page")
    elements: List[SparklioElement] = Field(default_factory=list)
    width: Optional[float] = 1920
    height: Optional[float] = 1080
    backgroundColor: Optional[str] = "#FFFFFF"

    @field_validator('id', mode='before')
    @classmethod
    def ensure_id(cls, v):
        if not v:
            return str(uuid.uuid4())
        return v


# ============================================================================
# Document 스키마
# ============================================================================

class DocumentKind(str):
    """문서 종류"""
    CONCEPT_BOARD = "concept_board"
    BANNER = "banner"
    SLIDE = "slide"
    CARD_NEWS = "card_news"
    SOCIAL_POST = "social_post"


class SparklioDocumentBase(BaseModel):
    """문서 기본 스키마"""
    title: str = Field(..., min_length=1, max_length=255)
    kind: Literal["concept_board", "banner", "slide", "card_news", "social_post"]
    pages: List[SparklioPage] = Field(default_factory=list)
    metadata: Optional[Dict[str, Any]] = None
    brandId: Optional[UUID] = None
    projectId: Optional[UUID] = None


class SparklioDocumentCreate(SparklioDocumentBase):
    """문서 생성 스키마"""
    aiPrompt: Optional[str] = None


class SparklioDocumentUpdate(BaseModel):
    """문서 업데이트 스키마"""
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    kind: Optional[Literal["concept_board", "banner", "slide", "card_news", "social_post"]] = None
    pages: Optional[List[SparklioPage]] = None
    metadata: Optional[Dict[str, Any]] = None


class SparklioDocumentResponse(SparklioDocumentBase):
    """문서 응답 스키마"""
    id: UUID
    createdAt: datetime
    updatedAt: datetime
    createdById: UUID
    updatedById: Optional[UUID] = None

    model_config = ConfigDict(from_attributes=True)


# ============================================================================
# AI Command 스키마
# ============================================================================

class AICommandType(str):
    """AI 명령 타입"""
    GENERATE = "generate"  # 새로 생성
    MODIFY = "modify"      # 기존 수정
    SUGGEST = "suggest"    # 제안


class AICommand(BaseModel):
    """AI 명령"""
    type: Literal["generate", "modify", "suggest"]
    prompt: str = Field(..., min_length=1)
    context: Optional[SparklioDocumentBase] = None
    targetElementId: Optional[str] = None  # modify 시 대상 엘리먼트
    brandId: Optional[UUID] = None
    options: Optional[Dict[str, Any]] = None


class AICommandResponse(BaseModel):
    """AI 명령 응답"""
    success: bool
    document: Optional[SparklioDocumentResponse] = None
    suggestions: Optional[List[str]] = None
    message: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


# ============================================================================
# 문서 변환 스키마
# ============================================================================

class DocumentConversionRequest(BaseModel):
    """문서 변환 요청"""
    sourceFormat: Literal["sparklio", "polotno", "layerhub", "konva"]
    targetFormat: Literal["sparklio", "polotno", "layerhub", "konva"]
    data: Dict[str, Any]


class DocumentConversionResponse(BaseModel):
    """문서 변환 응답"""
    success: bool
    data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None


# ============================================================================
# 문서 Export 스키마
# ============================================================================

class DocumentExportRequest(BaseModel):
    """문서 내보내기 요청"""
    documentId: UUID
    format: Literal["pdf", "png", "jpg", "svg", "json"]
    pages: Optional[List[str]] = None  # 특정 페이지만 내보내기
    quality: Optional[int] = Field(None, ge=1, le=100)  # 이미지 품질
    scale: Optional[float] = Field(None, ge=0.1, le=10.0)  # 스케일


class DocumentExportResponse(BaseModel):
    """문서 내보내기 응답"""
    success: bool
    url: Optional[str] = None  # 다운로드 URL
    data: Optional[str] = None  # Base64 데이터 (작은 파일용)
    error: Optional[str] = None


# ============================================================================
# 템플릿 스키마
# ============================================================================

class DocumentTemplate(BaseModel):
    """문서 템플릿"""
    id: UUID
    name: str
    description: Optional[str] = None
    kind: Literal["concept_board", "banner", "slide", "card_news", "social_post"]
    thumbnail: Optional[str] = None
    pages: List[SparklioPage]
    tags: Optional[List[str]] = None
    category: Optional[str] = None
    isPremium: Optional[bool] = False


class TemplateListResponse(BaseModel):
    """템플릿 목록 응답"""
    templates: List[DocumentTemplate]
    total: int
    page: int
    pageSize: int