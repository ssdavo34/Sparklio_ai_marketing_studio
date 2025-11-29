from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import UUID

class AssetBase(BaseModel):
    brand_id: UUID
    project_id: Optional[UUID] = None
    type: str  # 'image', 'video', 'text'
    original_name: Optional[str] = None
    source: str  # 'comfyui', 'ollama', 'manual'
    source_metadata: Optional[Dict[str, Any]] = None
    metadata: Optional[Dict[str, Any]] = None
    tags: Optional[List[str]] = None

class AssetCreate(AssetBase):
    pass

class AssetUpdate(BaseModel):
    tags: Optional[List[str]] = None
    metadata: Optional[Dict[str, Any]] = None
    status: Optional[str] = None

class AssetResponse(AssetBase):
    id: UUID
    user_id: UUID
    minio_path: str
    file_size: int
    mime_type: Optional[str] = None
    checksum: Optional[str] = None
    status: str
    created_at: datetime
    updated_at: datetime

    # 3종 URL (2025-11-30 추가)
    # - original_url: 원본 이미지 (다운로드, 원본 보기)
    # - preview_url: 프리뷰 (캔버스, 상세뷰, 편집) - 긴 변 1080px
    # - thumb_url: 썸네일 (목록, 챗, 그리드) - 긴 변 200px
    original_url: Optional[str] = None
    preview_url: Optional[str] = None
    thumb_url: Optional[str] = None

    # Presigned URL (legacy, 하위 호환용)
    presigned_url: Optional[str] = None

    class Config:
        from_attributes = True

class AssetListResponse(BaseModel):
    total: int
    page: int
    page_size: int
    assets: List[AssetResponse]
