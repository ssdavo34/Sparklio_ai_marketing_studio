"""
Brand Pydantic 스키마

브랜드 관련 요청/응답 스키마 정의
"""

from pydantic import BaseModel, Field
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
    logo_url: Optional[str] = None
    website_url: Optional[str] = None
    industry: Optional[str] = None
    tags: Optional[List[str]] = None
    brand_metadata: Optional[Dict[str, Any]] = None


class BrandResponse(BrandBase):
    """브랜드 응답 스키마"""
    id: UUID
    owner_id: UUID
    brand_metadata: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
