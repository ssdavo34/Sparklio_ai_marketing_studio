"""
Storage Service

파일 스토리지 서비스 (Mock 구현)

작성일: 2025-11-20
작성자: B팀 (Backend)
"""

from typing import Optional
import logging

logger = logging.getLogger(__name__)


class StorageService:
    """스토리지 서비스 클래스 (Mock)"""

    async def upload_file(
        self,
        file_content: bytes,
        file_key: str,
        content_type: str = "application/octet-stream"
    ) -> str:
        """파일 업로드 (Mock)"""
        # 실제로는 S3, MinIO 등에 업로드
        # 현재는 가상 URL 반환
        logger.info(f"Mock 파일 업로드: {file_key}")
        return f"https://storage.sparklio.ai/{file_key}"

    async def download_file(self, file_key: str) -> Optional[bytes]:
        """파일 다운로드 (Mock)"""
        logger.info(f"Mock 파일 다운로드: {file_key}")
        return b"Mock file content"

    async def delete_file(self, file_key: str) -> bool:
        """파일 삭제 (Mock)"""
        logger.info(f"Mock 파일 삭제: {file_key}")
        return True

    async def get_file_url(self, file_key: str, expires_in: int = 3600) -> str:
        """임시 URL 생성 (Mock)"""
        logger.info(f"Mock URL 생성: {file_key}")
        return f"https://storage.sparklio.ai/{file_key}?expires={expires_in}"