"""
Document Pydantic 스키마

Document, Template, GenerationJob 관련 요청/응답 스키마 정의
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import UUID


# ========================================
# Document Schemas
# ========================================

class DocumentSaveRequest(BaseModel):
    """
    Document 저장 요청 스키마

    POST /api/v1/documents/{docId}/save
    """
    documentJson: Dict[str, Any] = Field(..., description="Editor Document JSON")
    metadata: Optional[Dict[str, Any]] = Field(default={}, description="메타데이터")


class DocumentUpdateRequest(BaseModel):
    """
    Document 수정 요청 스키마

    PATCH /api/v1/documents/{docId}
    """
    documentJson: Optional[Dict[str, Any]] = Field(None, description="Editor Document JSON")
    metadata: Optional[Dict[str, Any]] = Field(None, description="메타데이터")


class DocumentResponse(BaseModel):
    """
    Document 응답 스키마

    GET /api/v1/documents/{docId}
    """
    id: UUID
    brand_id: Optional[UUID] = None
    project_id: Optional[UUID] = None
    user_id: UUID

    document_json: Dict[str, Any]
    document_metadata: Optional[Dict[str, Any]] = {}
    version: int

    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class DocumentListResponse(BaseModel):
    """
    Document 목록 응답 스키마

    GET /api/v1/documents
    """
    documents: List[DocumentResponse]
    total: int


# ========================================
# Template Schemas
# ========================================

class TemplateCreate(BaseModel):
    """
    Template 생성 스키마

    POST /api/v1/templates
    """
    template_id: str = Field(..., min_length=1, max_length=255)
    type: str = Field(..., min_length=1, max_length=50)
    origin: str = Field(..., min_length=1, max_length=50)
    industry: Optional[List[str]] = Field(default=[], description="산업 분류")
    channel: Optional[List[str]] = Field(default=[], description="채널 분류")
    document_json: Dict[str, Any] = Field(..., description="Template JSON")
    status: Optional[str] = Field(default="draft", max_length=20)
    template_metadata: Optional[Dict[str, Any]] = Field(default={}, description="메타데이터")


class TemplateUpdate(BaseModel):
    """
    Template 수정 스키마

    PATCH /api/v1/templates/{templateId}
    """
    type: Optional[str] = Field(None, min_length=1, max_length=50)
    origin: Optional[str] = Field(None, min_length=1, max_length=50)
    industry: Optional[List[str]] = None
    channel: Optional[List[str]] = None
    document_json: Optional[Dict[str, Any]] = None
    status: Optional[str] = Field(None, max_length=20)
    template_metadata: Optional[Dict[str, Any]] = None


class TemplateResponse(BaseModel):
    """
    Template 응답 스키마

    GET /api/v1/templates/{templateId}
    """
    id: UUID
    template_id: str
    type: str
    origin: str
    industry: List[str]
    channel: List[str]
    document_json: Dict[str, Any]
    status: str
    template_metadata: Optional[Dict[str, Any]] = {}
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TemplateListResponse(BaseModel):
    """
    Template 목록 응답 스키마

    GET /api/v1/templates
    """
    templates: List[TemplateResponse]
    total: int


# ========================================
# Generation Job Schemas
# ========================================

class GenerationJobCreate(BaseModel):
    """
    Generation Job 생성 스키마

    POST /api/v1/generation-jobs
    """
    task_id: str = Field(..., min_length=1, max_length=255)
    kind: str = Field(..., min_length=1, max_length=50)
    input_data: Dict[str, Any] = Field(..., description="Generator 입력 데이터")
    brand_id: Optional[UUID] = None


class GenerationJobUpdate(BaseModel):
    """
    Generation Job 수정 스키마

    PATCH /api/v1/generation-jobs/{taskId}
    """
    status: Optional[str] = Field(None, max_length=20)
    result_data: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None
    duration_ms: Optional[int] = None


class GenerationJobResponse(BaseModel):
    """
    Generation Job 응답 스키마

    GET /api/v1/generation-jobs/{taskId}
    """
    id: UUID
    task_id: str
    user_id: Optional[UUID] = None
    brand_id: Optional[UUID] = None
    kind: str
    status: str
    input_data: Optional[Dict[str, Any]] = None
    result_data: Optional[Dict[str, Any]] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    duration_ms: Optional[int] = None
    error_message: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class GenerationJobListResponse(BaseModel):
    """
    Generation Job 목록 응답 스키마

    GET /api/v1/generation-jobs
    """
    jobs: List[GenerationJobResponse]
    total: int
