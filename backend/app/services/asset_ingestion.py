"""
Asset Ingestion Pipeline

Base64 이미지를 받아 MinIO에 3종(original, preview, thumb) 저장하고
generated_assets 테이블에 레코드를 생성하는 파이프라인

작성일: 2025-11-30
작성자: B팀 (Backend)
참조: docs/STORAGE_SYSTEM_GAP_ANALYSIS_2025-11-30.md
"""

import base64
import hashlib
import logging
import asyncio
from io import BytesIO
from dataclasses import dataclass
from typing import Optional, Tuple
from uuid import UUID, uuid4
from datetime import datetime

from PIL import Image
from sqlalchemy.orm import Session

from app.models.asset import GeneratedAsset
from app.services.storage import storage_service
from app.core.config import settings

logger = logging.getLogger(__name__)


# =============================================================================
# Configuration
# =============================================================================

# 리사이즈 규격
PREVIEW_MAX_SIZE = 1080  # 긴 변 기준
THUMB_MAX_SIZE = 200     # 긴 변 기준

# 포맷
ORIGINAL_FORMAT = "PNG"
RESIZED_FORMAT = "WEBP"
RESIZED_QUALITY = 85


# =============================================================================
# Result Types
# =============================================================================

@dataclass
class IngestedAssetResult:
    """Asset Ingestion 결과"""
    asset_id: UUID
    original_url: str
    preview_url: Optional[str]
    thumb_url: Optional[str]
    minio_path: str
    file_size: int
    width: int
    height: int


@dataclass
class UploadedFile:
    """업로드된 파일 정보"""
    minio_path: str
    file_size: int
    checksum: str


# =============================================================================
# Asset Ingestion Pipeline
# =============================================================================

class AssetIngestionPipeline:
    """
    Asset Ingestion Pipeline

    Base64/bytes 이미지를 받아서:
    1. original 저장
    2. preview (1080px) 리사이즈 후 저장
    3. thumb (200px) 리사이즈 후 저장
    4. generated_assets 테이블에 레코드 생성

    에러 처리 정책:
    - original 업로드 실패 → 전체 실패 (롤백)
    - preview/thumb 실패 → partial success (original만 저장)
    """

    def __init__(self):
        self.storage = storage_service

    async def ingest_from_base64(
        self,
        base64_str: str,
        *,
        brand_id: UUID,
        user_id: UUID,
        project_id: Optional[UUID] = None,
        source: str = "nanobanana",
        source_metadata: Optional[dict] = None,
        tags: Optional[list] = None,
        db: Session,
    ) -> IngestedAssetResult:
        """
        Base64 문자열에서 이미지를 추출하여 3종 저장

        Args:
            base64_str: Base64 인코딩된 이미지 (data:image/... 접두어 있어도 됨)
            brand_id: 브랜드 ID
            user_id: 사용자 ID
            project_id: 프로젝트 ID (선택)
            source: 이미지 생성 소스 (nanobanana, comfyui, dalle 등)
            source_metadata: 소스 관련 메타데이터
            tags: 태그 목록
            db: SQLAlchemy 세션

        Returns:
            IngestedAssetResult: 저장된 에셋 정보

        Raises:
            ValueError: Base64 디코딩 실패
            Exception: MinIO 업로드 실패
        """
        # Base64 디코딩
        image_bytes = self._decode_base64(base64_str)

        return await self.ingest_from_bytes(
            image_bytes=image_bytes,
            brand_id=brand_id,
            user_id=user_id,
            project_id=project_id,
            source=source,
            source_metadata=source_metadata,
            tags=tags,
            db=db,
        )

    async def ingest_from_bytes(
        self,
        image_bytes: bytes,
        *,
        brand_id: UUID,
        user_id: UUID,
        project_id: Optional[UUID] = None,
        source: str = "nanobanana",
        source_metadata: Optional[dict] = None,
        tags: Optional[list] = None,
        db: Session,
    ) -> IngestedAssetResult:
        """
        bytes 이미지를 3종 저장

        Args:
            image_bytes: 이미지 바이트
            brand_id: 브랜드 ID
            user_id: 사용자 ID
            project_id: 프로젝트 ID (선택)
            source: 이미지 생성 소스
            source_metadata: 소스 관련 메타데이터
            tags: 태그 목록
            db: SQLAlchemy 세션

        Returns:
            IngestedAssetResult
        """
        asset_id = uuid4()
        uploaded_files: list[UploadedFile] = []

        try:
            # 이미지 로드 및 크기 확인
            pil_image = Image.open(BytesIO(image_bytes))
            width, height = pil_image.size
            mime_type = f"image/{pil_image.format.lower()}" if pil_image.format else "image/png"

            logger.info(f"[AssetIngestion] Processing image: {width}x{height}, format={pil_image.format}")

            # 경로 생성용 기본 정보
            now = datetime.now()
            base_path = self._generate_base_path(brand_id, project_id, now)
            bucket = self.storage._get_bucket_name("image")

            # 1. Original 업로드 (필수)
            original_path = f"{base_path}/original_{asset_id}.png"
            original_result = await self._upload_image(
                bucket, original_path, image_bytes, "image/png"
            )
            uploaded_files.append(original_result)
            original_url = original_result.minio_path

            logger.info(f"[AssetIngestion] Original uploaded: {original_url}")

            # 2. Preview 업로드 (선택 - 실패해도 계속)
            preview_url = None
            try:
                preview_bytes = self._resize_image(pil_image, PREVIEW_MAX_SIZE)
                preview_path = f"{base_path}/preview_{asset_id}.webp"
                preview_result = await self._upload_image(
                    bucket, preview_path, preview_bytes, "image/webp"
                )
                uploaded_files.append(preview_result)
                preview_url = preview_result.minio_path
                logger.info(f"[AssetIngestion] Preview uploaded: {preview_url}")
            except Exception as e:
                logger.warning(f"[AssetIngestion] Preview generation failed (continuing): {e}")

            # 3. Thumb 업로드 (선택 - 실패해도 계속)
            thumb_url = None
            try:
                thumb_bytes = self._resize_image(pil_image, THUMB_MAX_SIZE)
                thumb_path = f"{base_path}/thumb_{asset_id}.webp"
                thumb_result = await self._upload_image(
                    bucket, thumb_path, thumb_bytes, "image/webp"
                )
                uploaded_files.append(thumb_result)
                thumb_url = thumb_result.minio_path
                logger.info(f"[AssetIngestion] Thumb uploaded: {thumb_url}")
            except Exception as e:
                logger.warning(f"[AssetIngestion] Thumb generation failed (continuing): {e}")

            # 4. DB 레코드 생성
            db_asset = GeneratedAsset(
                id=asset_id,
                brand_id=brand_id,
                project_id=project_id,
                user_id=user_id,
                type="image",
                minio_path=original_url,
                original_url=original_url,
                preview_url=preview_url,
                thumb_url=thumb_url,
                file_size=original_result.file_size,
                mime_type=mime_type,
                checksum=original_result.checksum,
                source=source,
                source_metadata=source_metadata or {},
                tags=tags,
                status="active",
            )

            db.add(db_asset)
            db.commit()
            db.refresh(db_asset)

            logger.info(f"[AssetIngestion] Asset created: {asset_id}")

            return IngestedAssetResult(
                asset_id=asset_id,
                original_url=original_url,
                preview_url=preview_url,
                thumb_url=thumb_url,
                minio_path=original_url,
                file_size=original_result.file_size,
                width=width,
                height=height,
            )

        except Exception as e:
            # 롤백: 업로드된 파일 삭제
            logger.error(f"[AssetIngestion] Failed, rolling back: {e}")
            for uploaded in uploaded_files:
                try:
                    self.storage.delete_file(uploaded.minio_path)
                    logger.info(f"[AssetIngestion] Rolled back: {uploaded.minio_path}")
                except Exception as del_e:
                    logger.warning(f"[AssetIngestion] Rollback delete failed: {del_e}")

            db.rollback()
            raise

    def _decode_base64(self, base64_str: str) -> bytes:
        """Base64 문자열 디코딩 (data:image/... 접두어 처리)"""
        # data:image/png;base64,xxxx 형식 처리
        if "," in base64_str:
            base64_str = base64_str.split(",", 1)[1]

        try:
            return base64.b64decode(base64_str)
        except Exception as e:
            raise ValueError(f"Invalid base64 string: {e}")

    def _generate_base_path(
        self,
        brand_id: UUID,
        project_id: Optional[UUID],
        now: datetime
    ) -> str:
        """MinIO 경로 생성 (파일명 제외)"""
        project_part = str(project_id) if project_id else "no-project"
        return f"image/{brand_id}/{project_part}/{now.year:04d}/{now.month:02d}/{now.day:02d}"

    def _resize_image(self, pil_image: Image.Image, max_size: int) -> bytes:
        """
        이미지 리사이즈 (긴 변 기준)

        Args:
            pil_image: PIL Image 객체
            max_size: 긴 변 최대 크기

        Returns:
            WEBP 포맷 bytes
        """
        width, height = pil_image.size

        # 이미 작으면 리사이즈 안 함
        if max(width, height) <= max_size:
            buffer = BytesIO()
            # RGB 변환 (WEBP는 RGBA/RGB만 지원)
            if pil_image.mode not in ("RGB", "RGBA"):
                pil_image = pil_image.convert("RGB")
            pil_image.save(buffer, format=RESIZED_FORMAT, quality=RESIZED_QUALITY)
            return buffer.getvalue()

        # 비율 유지 리사이즈
        if width > height:
            new_width = max_size
            new_height = int(height * (max_size / width))
        else:
            new_height = max_size
            new_width = int(width * (max_size / height))

        resized = pil_image.resize((new_width, new_height), Image.Resampling.LANCZOS)

        # RGB 변환
        if resized.mode not in ("RGB", "RGBA"):
            resized = resized.convert("RGB")

        buffer = BytesIO()
        resized.save(buffer, format=RESIZED_FORMAT, quality=RESIZED_QUALITY)
        return buffer.getvalue()

    async def _upload_image(
        self,
        bucket: str,
        object_path: str,
        image_bytes: bytes,
        content_type: str
    ) -> UploadedFile:
        """MinIO에 이미지 업로드 (비동기)"""

        def _upload():
            checksum = hashlib.sha256(image_bytes).hexdigest()
            result = self.storage.upload_file(
                bucket=bucket,
                object_path=object_path,
                file_data=image_bytes,
                content_type=content_type
            )
            return UploadedFile(
                minio_path=result["minio_path"],
                file_size=result["file_size"],
                checksum=f"sha256:{checksum}"
            )

        return await asyncio.to_thread(_upload)


# =============================================================================
# Singleton & Factory
# =============================================================================

_pipeline_instance: Optional[AssetIngestionPipeline] = None


def get_asset_ingestion_pipeline() -> AssetIngestionPipeline:
    """AssetIngestionPipeline 싱글톤 인스턴스 반환"""
    global _pipeline_instance
    if _pipeline_instance is None:
        _pipeline_instance = AssetIngestionPipeline()
    return _pipeline_instance
