from minio import Minio
from minio.error import S3Error
from app.core.config import settings
from io import BytesIO
from datetime import timedelta
import hashlib
from typing import Optional
from uuid import UUID
from datetime import datetime

class StorageService:
    def __init__(self):
        self.client = Minio(
            settings.MINIO_ENDPOINT,
            access_key=settings.MINIO_ACCESS_KEY,
            secret_key=settings.MINIO_SECRET_KEY,
            secure=settings.MINIO_SECURE
        )
        self.bucket_prefix = settings.MINIO_BUCKET_PREFIX

    def _get_bucket_name(self, asset_type: str) -> str:
        """Get bucket name based on asset type"""
        if asset_type in ['temp', 'temporary']:
            return f"{self.bucket_prefix}sparklio-temp"
        return f"{self.bucket_prefix}sparklio-assets"

    def generate_object_path(
        self,
        asset_type: str,
        brand_id: UUID,
        project_id: Optional[UUID],
        file_extension: str
    ) -> str:
        """
        Generate object path: {asset_type}/{brand_id}/{project_id}/{YYYY}/{MM}/{DD}/{uuid}.ext
        """
        from uuid import uuid4
        now = datetime.now()

        project_part = str(project_id) if project_id else 'no-project'

        path = (
            f"{asset_type}/{brand_id}/{project_part}/"
            f"{now.year:04d}/{now.month:02d}/{now.day:02d}/"
            f"{uuid4()}.{file_extension}"
        )
        return path

    def ensure_bucket_exists(self, bucket_name: str):
        """Ensure bucket exists, create if not"""
        try:
            if not self.client.bucket_exists(bucket_name):
                self.client.make_bucket(bucket_name)
        except S3Error as e:
            # Ignore if bucket already owned by you (race condition)
            if e.code != 'BucketAlreadyOwnedByYou':
                raise Exception(f"Failed to create bucket {bucket_name}: {str(e)}")

    def upload_file(
        self,
        bucket: str,
        object_path: str,
        file_data: bytes,
        content_type: str
    ) -> dict:
        """Upload file to MinIO and return metadata"""
        try:
            # Ensure bucket exists
            self.ensure_bucket_exists(bucket)

            # Calculate checksum
            checksum = hashlib.sha256(file_data).hexdigest()

            # Upload to MinIO
            self.client.put_object(
                bucket_name=bucket,
                object_name=object_path,
                data=BytesIO(file_data),
                length=len(file_data),
                content_type=content_type
            )

            return {
                "bucket": bucket,
                "object_path": object_path,
                "minio_path": f"{bucket}/{object_path}",
                "file_size": len(file_data),
                "checksum": f"sha256:{checksum}"
            }
        except S3Error as e:
            raise Exception(f"MinIO upload failed: {str(e)}")

    def get_presigned_url(
        self,
        minio_path: str,
        expiry: Optional[int] = None
    ) -> str:
        """Generate presigned URL for file access"""
        try:
            # Parse minio_path: "bucket/object/path"
            parts = minio_path.split('/', 1)
            if len(parts) != 2:
                raise ValueError(f"Invalid minio_path format: {minio_path}")

            bucket, object_path = parts

            # Set expiry time
            expiry_seconds = expiry or settings.PRESIGNED_URL_EXPIRY

            url = self.client.presigned_get_object(
                bucket_name=bucket,
                object_name=object_path,
                expires=timedelta(seconds=expiry_seconds)
            )

            return url
        except S3Error as e:
            raise Exception(f"Failed to generate presigned URL: {str(e)}")

    def delete_file(self, minio_path: str) -> bool:
        """Delete file from MinIO (for hard delete)"""
        try:
            parts = minio_path.split('/', 1)
            if len(parts) != 2:
                raise ValueError(f"Invalid minio_path format: {minio_path}")

            bucket, object_path = parts

            self.client.remove_object(bucket_name=bucket, object_name=object_path)
            return True
        except S3Error as e:
            raise Exception(f"MinIO delete failed: {str(e)}")

    async def upload_file_async(
        self,
        file_path: str,
        bucket: str,
        object_key: str,
        content_type: str = "application/octet-stream"
    ) -> dict:
        """
        Async wrapper for file upload from local path

        Args:
            file_path: Local file path
            bucket: Target bucket name
            object_key: Object key (path in bucket)
            content_type: MIME type

        Returns:
            Upload metadata dict
        """
        import asyncio

        def _upload():
            with open(file_path, 'rb') as f:
                file_data = f.read()
            return self.upload_file(bucket, object_key, file_data, content_type)

        return await asyncio.to_thread(_upload)

    async def download_file_async(
        self,
        bucket: str,
        object_key: str,
        file_path: str
    ) -> bool:
        """
        Async wrapper for file download to local path

        Args:
            bucket: Source bucket name
            object_key: Object key (path in bucket)
            file_path: Local file path to save

        Returns:
            Success boolean
        """
        import asyncio

        def _download():
            try:
                response = self.client.get_object(bucket, object_key)
                with open(file_path, 'wb') as f:
                    for chunk in response.stream(32*1024):
                        f.write(chunk)
                response.close()
                response.release_conn()
                return True
            except S3Error as e:
                raise Exception(f"MinIO download failed: {str(e)}")

        return await asyncio.to_thread(_download)

# Global storage service instance
storage_service = StorageService()


def get_storage_service() -> StorageService:
    """
    Get StorageService singleton instance

    FastAPI dependency injection에서 사용
    """
    return storage_service
