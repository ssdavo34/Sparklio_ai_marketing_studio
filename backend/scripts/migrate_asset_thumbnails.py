"""
기존 에셋 리사이즈 마이그레이션 스크립트

기존 generated_assets 테이블의 이미지를 3종(original, preview, thumb)으로 리사이즈하여
MinIO에 업로드하고 DB를 업데이트합니다.

작성일: 2025-11-30
작성자: B팀 (Backend)

사용법:
    # 드라이런 (실제 변경 없이 확인만)
    python scripts/migrate_asset_thumbnails.py --dry-run

    # 실행 (배치 크기 50)
    python scripts/migrate_asset_thumbnails.py --batch-size 50

    # 특정 brand_id만 처리
    python scripts/migrate_asset_thumbnails.py --brand-id 550e8400-e29b-41d4-a716-446655440000
"""

import asyncio
import argparse
import logging
import sys
from pathlib import Path
from uuid import UUID
from datetime import datetime
from io import BytesIO

# 프로젝트 루트를 path에 추가
sys.path.insert(0, str(Path(__file__).parent.parent))

from PIL import Image
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.core.database import SessionLocal
from app.models.asset import GeneratedAsset
from app.services.storage import storage_service

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# 리사이즈 규격
PREVIEW_MAX_SIZE = 1080  # 긴 변 기준
THUMB_MAX_SIZE = 200     # 긴 변 기준
RESIZED_FORMAT = "WEBP"
RESIZED_QUALITY = 85


class AssetMigrator:
    """기존 에셋 마이그레이션 클래스"""

    def __init__(self, dry_run: bool = False):
        self.dry_run = dry_run
        self.stats = {
            "total": 0,
            "processed": 0,
            "skipped": 0,
            "failed": 0,
            "already_done": 0
        }

    def run(
        self,
        batch_size: int = 100,
        brand_id: str = None
    ):
        """마이그레이션 실행"""
        logger.info(f"Starting asset thumbnail migration (dry_run={self.dry_run})")

        db = SessionLocal()
        try:
            # 마이그레이션 대상 에셋 조회
            query = db.query(GeneratedAsset).filter(
                GeneratedAsset.type == 'image',
                GeneratedAsset.status == 'active',
                GeneratedAsset.minio_path.isnot(None)
            )

            # preview_url이 없는 것만 처리
            query = query.filter(GeneratedAsset.preview_url.is_(None))

            if brand_id:
                query = query.filter(GeneratedAsset.brand_id == UUID(brand_id))

            # 총 개수
            total = query.count()
            self.stats["total"] = total
            logger.info(f"Found {total} assets to migrate")

            if total == 0:
                logger.info("No assets to migrate. All done!")
                return

            # 배치 처리
            offset = 0
            while offset < total:
                assets = query.offset(offset).limit(batch_size).all()
                if not assets:
                    break

                logger.info(f"Processing batch {offset // batch_size + 1} ({offset + 1}-{min(offset + batch_size, total)} of {total})")

                for asset in assets:
                    self._process_asset(db, asset)

                offset += batch_size

            # 결과 출력
            logger.info(f"""
Migration complete!
------------------
Total:        {self.stats['total']}
Processed:    {self.stats['processed']}
Skipped:      {self.stats['skipped']}
Failed:       {self.stats['failed']}
Already done: {self.stats['already_done']}
""")

        finally:
            db.close()

    def _process_asset(self, db: Session, asset: GeneratedAsset):
        """개별 에셋 처리"""
        try:
            # 이미 처리된 경우 스킵
            if asset.preview_url and asset.thumb_url:
                self.stats["already_done"] += 1
                return

            logger.debug(f"Processing asset {asset.id}")

            # MinIO에서 원본 다운로드
            original_bytes = self._download_original(asset.minio_path)
            if not original_bytes:
                logger.warning(f"Failed to download asset {asset.id}")
                self.stats["failed"] += 1
                return

            # 이미지 로드
            try:
                pil_image = Image.open(BytesIO(original_bytes))
            except Exception as e:
                logger.warning(f"Failed to open image {asset.id}: {e}")
                self.stats["failed"] += 1
                return

            # 경로 생성 (original 경로 기반)
            base_path = self._get_base_path(asset.minio_path)
            bucket = storage_service._get_bucket_name("image")

            # Preview 생성 (1080px)
            preview_url = None
            if not asset.preview_url:
                preview_bytes = self._resize_image(pil_image, PREVIEW_MAX_SIZE)
                if preview_bytes:
                    preview_path = f"{base_path}_preview.webp"
                    if not self.dry_run:
                        result = storage_service.upload_file(
                            bucket=bucket,
                            object_path=preview_path,
                            file_data=preview_bytes,
                            content_type="image/webp"
                        )
                        preview_url = result["minio_path"]
                    else:
                        preview_url = f"{bucket}/{preview_path}"
                    logger.debug(f"Created preview: {preview_url}")

            # Thumb 생성 (200px)
            thumb_url = None
            if not asset.thumb_url:
                thumb_bytes = self._resize_image(pil_image, THUMB_MAX_SIZE)
                if thumb_bytes:
                    thumb_path = f"{base_path}_thumb.webp"
                    if not self.dry_run:
                        result = storage_service.upload_file(
                            bucket=bucket,
                            object_path=thumb_path,
                            file_data=thumb_bytes,
                            content_type="image/webp"
                        )
                        thumb_url = result["minio_path"]
                    else:
                        thumb_url = f"{bucket}/{thumb_path}"
                    logger.debug(f"Created thumb: {thumb_url}")

            # DB 업데이트
            if not self.dry_run:
                if not asset.original_url:
                    asset.original_url = asset.minio_path
                if preview_url:
                    asset.preview_url = preview_url
                if thumb_url:
                    asset.thumb_url = thumb_url
                db.commit()

            self.stats["processed"] += 1
            logger.info(f"Processed asset {asset.id}")

        except Exception as e:
            logger.error(f"Error processing asset {asset.id}: {e}")
            self.stats["failed"] += 1
            db.rollback()

    def _download_original(self, minio_path: str) -> bytes:
        """MinIO에서 원본 다운로드"""
        try:
            parts = minio_path.split('/', 1)
            if len(parts) != 2:
                return None

            bucket, object_path = parts
            response = storage_service.client.get_object(bucket, object_path)
            data = response.read()
            response.close()
            response.release_conn()
            return data
        except Exception as e:
            logger.error(f"Download failed for {minio_path}: {e}")
            return None

    def _get_base_path(self, minio_path: str) -> str:
        """minio_path에서 base path 추출 (확장자 제외)"""
        # bucket/path/to/file.png -> path/to/file
        parts = minio_path.split('/', 1)
        if len(parts) != 2:
            return minio_path

        object_path = parts[1]
        # 확장자 제거
        if '.' in object_path:
            object_path = object_path.rsplit('.', 1)[0]
        return object_path

    def _resize_image(self, pil_image: Image.Image, max_size: int) -> bytes:
        """이미지 리사이즈"""
        try:
            width, height = pil_image.size

            # 이미 작으면 리사이즈 안 함
            if max(width, height) <= max_size:
                buffer = BytesIO()
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

            if resized.mode not in ("RGB", "RGBA"):
                resized = resized.convert("RGB")

            buffer = BytesIO()
            resized.save(buffer, format=RESIZED_FORMAT, quality=RESIZED_QUALITY)
            return buffer.getvalue()

        except Exception as e:
            logger.error(f"Resize failed: {e}")
            return None


def main():
    parser = argparse.ArgumentParser(description="Migrate existing assets to 3-type thumbnails")
    parser.add_argument("--dry-run", action="store_true", help="Run without making changes")
    parser.add_argument("--batch-size", type=int, default=100, help="Batch size for processing")
    parser.add_argument("--brand-id", type=str, help="Only process assets for this brand")

    args = parser.parse_args()

    migrator = AssetMigrator(dry_run=args.dry_run)
    migrator.run(batch_size=args.batch_size, brand_id=args.brand_id)


if __name__ == "__main__":
    main()
