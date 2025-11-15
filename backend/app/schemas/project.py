"""
Project Pydantic 스키마

프로젝트 관련 요청/응답 스키마 정의
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import UUID


class ProjectBase(BaseModel):
    """프로젝트 기본 스키마"""
    name: str = Field(..., min_length=1, max_length=255)
    slug: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    project_type: str = Field(..., min_length=1, max_length=50)
    brief: Optional[Dict[str, Any]] = None
    status: Optional[str] = Field(default="draft", max_length=20)
    tags: Optional[List[str]] = None


class ProjectCreate(ProjectBase):
    """프로젝트 생성 스키마"""
    brand_id: UUID


class ProjectUpdate(BaseModel):
    """프로젝트 수정 스키마"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    slug: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    project_type: Optional[str] = Field(None, min_length=1, max_length=50)
    brief: Optional[Dict[str, Any]] = None
    status: Optional[str] = Field(None, max_length=20)
    tags: Optional[List[str]] = None
    project_metadata: Optional[Dict[str, Any]] = None


class ProjectResponse(ProjectBase):
    """프로젝트 응답 스키마"""
    id: UUID
    brand_id: UUID
    owner_id: UUID
    project_metadata: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
