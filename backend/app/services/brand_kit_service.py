"""
Brand Kit Service

브랜드 킷 관리 서비스 (Mock 구현)

작성일: 2025-11-20
작성자: B팀 (Backend)
"""

from sqlalchemy.orm import Session
from typing import Optional, Dict, Any
from uuid import UUID
import logging

logger = logging.getLogger(__name__)


class BrandKitService:
    """브랜드 킷 서비스 클래스 (Mock)"""

    def __init__(self, db: Session):
        self.db = db

    async def get_brand_kit(
        self,
        brand_id: UUID,
        user_id: Optional[UUID] = None
    ) -> Optional[Dict[str, Any]]:
        """브랜드 킷 조회 (Mock)"""
        # Mock 브랜드 데이터 반환
        logger.info(f"Mock 브랜드 킷 조회: {brand_id}")

        return {
            "id": str(brand_id),
            "name": "샘플 브랜드",
            "colors": ["#FF6B6B", "#4ECDC4", "#45B7D1", "#F9F9F9"],
            "fonts": ["Pretendard", "Noto Sans KR"],
            "tone": "친근하고 전문적인",
            "logo_url": f"https://storage.sparklio.ai/brands/{brand_id}/logo.png",
            "guidelines": {
                "voice": "친근하면서도 신뢰감 있는 톤",
                "style": "모던하고 깔끔한 디자인",
                "target": "20-40대 직장인"
            }
        }

    async def create_brand_kit(
        self,
        brand_data: Dict[str, Any],
        user_id: UUID
    ) -> Dict[str, Any]:
        """브랜드 킷 생성 (Mock)"""
        logger.info(f"Mock 브랜드 킷 생성: {brand_data.get('name')}")

        # Mock 생성 응답
        return {
            "id": str(UUID('12345678-1234-5678-1234-567812345678')),
            **brand_data
        }

    async def update_brand_kit(
        self,
        brand_id: UUID,
        brand_data: Dict[str, Any],
        user_id: UUID
    ) -> Optional[Dict[str, Any]]:
        """브랜드 킷 업데이트 (Mock)"""
        logger.info(f"Mock 브랜드 킷 업데이트: {brand_id}")

        # Mock 업데이트 응답
        existing = await self.get_brand_kit(brand_id, user_id)
        if existing:
            existing.update(brand_data)
            return existing
        return None

    async def delete_brand_kit(
        self,
        brand_id: UUID,
        user_id: UUID
    ) -> bool:
        """브랜드 킷 삭제 (Mock)"""
        logger.info(f"Mock 브랜드 킷 삭제: {brand_id}")
        return True