"""
MinIO Client Integration Layer
Connects FastAPI backend to MinIO for asset storage
"""

from minio import Minio
from minio.error import S3Error
import logging
import io
from typing import Optional, BinaryIO
from datetime import timedelta
import os
from app.core.config import settings

logger = logging.getLogger(__name__)


class MinIOClient:
    """
    MinIO client for asset storage

    Usage:
        client = MinIOClient()
        url = client.upload_file("bucket", "path/to/file.png", file_data)
        data = client.download_file("bucket", "path/to/file.png")
    """

    def __init__(
        self,
        endpoint: str = getattr(settings, "MINIO_ENDPOINT", "100.120.180.42:9000"),
        access_key: str = getattr(settings, "MINIO_ACCESS_KEY", "minioadmin"),
        secret_key: str = getattr(settings, "MINIO_SECRET_KEY", "minioadmin"),
        secure: bool = getattr(settings, "MINIO_SECURE", False),
    ):
        """
        Initialize MinIO client

        Args:
            endpoint: MinIO server endpoint (host:port)
            access_key: Access key
            secret_key: Secret key
            secure: Use HTTPS (default False for local)
        """
        self.endpoint = endpoint
        self.client = Minio(
            endpoint,
            access_key=access_key,
            secret_key=secret_key,
            secure=secure
        )
        logger.info(f"MinIO client initialized: endpoint={endpoint}, secure={secure}")

    def ensure_bucket(self, bucket_name: str) -> bool:
        """
        Ensure bucket exists, create if not

        Args:
            bucket_name: Bucket name

        Returns:
            True if bucket exists or created successfully
        """
        try:
            if not self.client.bucket_exists(bucket_name):
                self.client.make_bucket(bucket_name)
                logger.info(f"Created MinIO bucket: {bucket_name}")
            return True
        except S3Error as e:
            logger.error(f"Failed to ensure bucket {bucket_name}: {e}")
            return False

    def upload_file(
        self,
        bucket_name: str,
        object_name: str,
        data: bytes,
        content_type: str = "application/octet-stream",
        metadata: Optional[dict] = None
    ) -> str:
        """
        Upload file to MinIO

        Args:
            bucket_name: Bucket name
            object_name: Object path (e.g., "images/2024/01/image.png")
            data: File data (bytes)
            content_type: MIME type
            metadata: Optional metadata dict

        Returns:
            Public URL or MinIO path

        Raises:
            S3Error: If upload fails
        """
        try:
            # Ensure bucket exists
            self.ensure_bucket(bucket_name)

            # Upload file
            self.client.put_object(
                bucket_name,
                object_name,
                data=io.BytesIO(data),
                length=len(data),
                content_type=content_type,
                metadata=metadata
            )

            # Generate path (MinIO doesn't provide public URLs without presigned)
            path = f"minio://{bucket_name}/{object_name}"

            logger.info(f"Uploaded file to MinIO: {path} ({len(data)} bytes)")

            return path

        except S3Error as e:
            logger.error(f"Failed to upload file to MinIO: {e}")
            raise

    def download_file(self, bucket_name: str, object_name: str) -> bytes:
        """
        Download file from MinIO

        Args:
            bucket_name: Bucket name
            object_name: Object path

        Returns:
            File data (bytes)

        Raises:
            S3Error: If download fails
        """
        try:
            response = self.client.get_object(bucket_name, object_name)
            data = response.read()
            response.close()
            response.release_conn()

            logger.info(f"Downloaded file from MinIO: {bucket_name}/{object_name} ({len(data)} bytes)")

            return data

        except S3Error as e:
            logger.error(f"Failed to download file from MinIO: {e}")
            raise

    def get_presigned_url(
        self,
        bucket_name: str,
        object_name: str,
        expires: timedelta = timedelta(hours=1)
    ) -> str:
        """
        Get presigned URL for temporary access

        Args:
            bucket_name: Bucket name
            object_name: Object path
            expires: Expiration time (default 1 hour)

        Returns:
            Presigned URL
        """
        try:
            url = self.client.presigned_get_object(
                bucket_name,
                object_name,
                expires=expires
            )

            logger.info(f"Generated presigned URL: {bucket_name}/{object_name}")

            return url

        except S3Error as e:
            logger.error(f"Failed to generate presigned URL: {e}")
            raise

    def delete_file(self, bucket_name: str, object_name: str) -> bool:
        """
        Delete file from MinIO

        Args:
            bucket_name: Bucket name
            object_name: Object path

        Returns:
            True if deleted successfully
        """
        try:
            self.client.remove_object(bucket_name, object_name)
            logger.info(f"Deleted file from MinIO: {bucket_name}/{object_name}")
            return True

        except S3Error as e:
            logger.error(f"Failed to delete file from MinIO: {e}")
            return False

    def list_objects(self, bucket_name: str, prefix: str = "") -> list:
        """
        List objects in bucket

        Args:
            bucket_name: Bucket name
            prefix: Object prefix filter

        Returns:
            List of object names
        """
        try:
            objects = self.client.list_objects(bucket_name, prefix=prefix, recursive=True)
            object_names = [obj.object_name for obj in objects]

            logger.info(f"Listed {len(object_names)} objects in {bucket_name}/{prefix}")

            return object_names

        except S3Error as e:
            logger.error(f"Failed to list objects: {e}")
            return []


# Singleton instance for reuse
_minio_client: Optional[MinIOClient] = None


def get_minio_client() -> MinIOClient:
    """
    Get singleton MinIO client instance

    Usage:
        client = get_minio_client()
        url = client.upload_file("sparklio-assets", "images/test.png", data)
    """
    global _minio_client
    if _minio_client is None:
        _minio_client = MinIOClient()
    return _minio_client
