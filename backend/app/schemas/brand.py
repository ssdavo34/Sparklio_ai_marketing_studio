"""
Brand Pydantic 스키마

브랜드 관련 요청/응답 스키마 정의

MVP P0-1 Brand OS Module:
- BrandDocument schemas (upload, crawl, response)
- Enhanced Brand schemas with brand_dna
"""

from pydantic import BaseModel, Field, HttpUrl
from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import UUID


class BrandBase(BaseModel):
    """브랜드 기본 스키마"""
    name: str = Field(..., min_length=1, max_length=255)
    slug: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    brand_kit: Optional[Dict[str, Any]] = None
    logo_url: Optional[str] = None
    website_url: Optional[str] = None
    industry: Optional[str] = None
    tags: Optional[List[str]] = None


class BrandCreate(BrandBase):
    """브랜드 생성 스키마"""
    pass


class BrandUpdate(BaseModel):
    """브랜드 수정 스키마"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    slug: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    brand_kit: Optional[Dict[str, Any]] = None
    brand_dna: Optional[Dict[str, Any]] = None
    logo_url: Optional[str] = None
    website_url: Optional[str] = None
    industry: Optional[str] = None
    tags: Optional[List[str]] = None
    brand_metadata: Optional[Dict[str, Any]] = None


class BrandResponse(BrandBase):
    """브랜드 응답 스키마"""
    id: UUID
    owner_id: UUID
    brand_dna: Optional[Dict[str, Any]] = None
    brand_metadata: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ==========================================
# Brand Document Schemas (MVP P0-1)
# ==========================================

class BrandDocumentBase(BaseModel):
    """브랜드 문서 기본 스키마"""
    title: Optional[str] = Field(None, max_length=255)
    document_type: str = Field(..., description="pdf, image, text, url, brochure")


class BrandDocumentCreate(BrandDocumentBase):
    """브랜드 문서 생성 스키마 (파일 업로드)"""
    file_url: Optional[str] = None
    source_url: Optional[str] = None
    extracted_text: Optional[str] = None
    file_size: Optional[int] = None
    mime_type: Optional[str] = None
    document_metadata: Optional[Dict[str, Any]] = None


class BrandDocumentCrawl(BaseModel):
    """브랜드 URL 크롤링 요청 스키마"""
    url: str = Field(..., description="Crawl target URL")
    title: Optional[str] = Field(None, max_length=255)


class BrandDocumentResponse(BrandDocumentBase):
    """브랜드 문서 응답 스키마"""
    id: UUID
    brand_id: UUID
    file_url: Optional[str] = None
    source_url: Optional[str] = None
    extracted_text: Optional[str] = None
    file_size: Optional[int] = None
    mime_type: Optional[str] = None
    processed: str
    document_metadata: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class BrandDocumentListResponse(BaseModel):
    """브랜드 문서 목록 응답"""
    documents: List[BrandDocumentResponse]
    total: int
