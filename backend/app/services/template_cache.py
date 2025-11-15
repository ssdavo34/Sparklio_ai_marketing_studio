"""
Template Cache Service

Redis를 사용한 Template 캐싱 서비스
"""

from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
import logging

from app.core.redis_client import redis_client
from app.models.document import Template

logger = logging.getLogger(__name__)

# Cache TTL (1시간)
TEMPLATE_CACHE_TTL = 3600


class TemplateCacheService:
    """
    Template 캐싱 서비스

    Redis를 사용하여 Approved Template을 캐싱합니다.
    - 단일 Template 조회 캐싱
    - Template 목록 캐싱
    - Template 업데이트 시 캐시 무효화
    """

    @staticmethod
    def _get_cache_key(template_id: str) -> str:
        """
        Template 캐시 키 생성

        Args:
            template_id: Template ID

        Returns:
            Redis 캐시 키
        """
        return f"template:{template_id}"

    @staticmethod
    def _get_list_cache_key(
        type: Optional[str] = None,
        industry: Optional[str] = None,
        channel: Optional[str] = None
    ) -> str:
        """
        Template 목록 캐시 키 생성

        Args:
            type: Template 유형
            industry: 산업 분류
            channel: 채널 분류

        Returns:
            Redis 캐시 키
        """
        parts = ["template_list"]
        if type:
            parts.append(f"type:{type}")
        if industry:
            parts.append(f"industry:{industry}")
        if channel:
            parts.append(f"channel:{channel}")

        return ":".join(parts)

    @staticmethod
    def get_template(template_id: str, db: Session) -> Optional[Dict[str, Any]]:
        """
        Template 조회 (캐시 우선)

        Args:
            template_id: Template ID
            db: 데이터베이스 세션

        Returns:
            Template 데이터 (없으면 None)
        """
        cache_key = TemplateCacheService._get_cache_key(template_id)

        # 캐시 조회
        cached = redis_client.get_json(cache_key)
        if cached:
            logger.info(f"[TemplateCacheService] Cache HIT for template_id={template_id}")
            return cached

        # DB 조회
        logger.info(f"[TemplateCacheService] Cache MISS for template_id={template_id}, querying DB")
        template = db.query(Template).filter(
            Template.template_id == template_id,
            Template.status == "approved"
        ).first()

        if not template:
            return None

        # 캐시 저장
        template_data = {
            "id": str(template.id),
            "template_id": template.template_id,
            "type": template.type,
            "origin": template.origin,
            "industry": template.industry or [],
            "channel": template.channel or [],
            "document_json": template.document_json,
            "status": template.status,
            "template_metadata": template.template_metadata or {},
            "created_at": template.created_at.isoformat(),
            "updated_at": template.updated_at.isoformat()
        }

        redis_client.set_json(cache_key, template_data, ex=TEMPLATE_CACHE_TTL)
        logger.info(f"[TemplateCacheService] Cached template_id={template_id}")

        return template_data

    @staticmethod
    def invalidate_template(template_id: str) -> bool:
        """
        Template 캐시 무효화

        Args:
            template_id: Template ID

        Returns:
            성공 여부
        """
        cache_key = TemplateCacheService._get_cache_key(template_id)
        result = redis_client.delete(cache_key)

        if result:
            logger.info(f"[TemplateCacheService] Invalidated cache for template_id={template_id}")

        # Template 목록 캐시도 모두 무효화
        TemplateCacheService.invalidate_all_lists()

        return result

    @staticmethod
    def invalidate_all_lists() -> int:
        """
        모든 Template 목록 캐시 무효화

        Returns:
            삭제된 캐시 개수
        """
        count = redis_client.flush_pattern("template_list:*")
        logger.info(f"[TemplateCacheService] Invalidated {count} template list caches")
        return count

    @staticmethod
    def get_template_list(
        type: Optional[str] = None,
        industry: Optional[str] = None,
        channel: Optional[str] = None,
        db: Session = None
    ) -> Optional[List[Dict[str, Any]]]:
        """
        Template 목록 조회 (캐시 우선)

        Args:
            type: Template 유형 필터
            industry: 산업 분류 필터
            channel: 채널 분류 필터
            db: 데이터베이스 세션

        Returns:
            Template 목록 (없으면 None)
        """
        cache_key = TemplateCacheService._get_list_cache_key(type, industry, channel)

        # 캐시 조회
        cached = redis_client.get_json(cache_key)
        if cached:
            logger.info(f"[TemplateCacheService] Cache HIT for list: {cache_key}")
            return cached

        if not db:
            # DB 세션이 없으면 캐시만 조회
            return None

        # DB 조회
        logger.info(f"[TemplateCacheService] Cache MISS for list: {cache_key}, querying DB")
        query = db.query(Template).filter(Template.status == "approved")

        if type:
            query = query.filter(Template.type == type)
        if industry:
            query = query.filter(Template.industry.contains([industry]))
        if channel:
            query = query.filter(Template.channel.contains([channel]))

        templates = query.order_by(Template.created_at.desc()).limit(100).all()

        # 캐시 저장
        template_list = [
            {
                "id": str(t.id),
                "template_id": t.template_id,
                "type": t.type,
                "origin": t.origin,
                "industry": t.industry or [],
                "channel": t.channel or [],
                "status": t.status,
                "created_at": t.created_at.isoformat(),
                "updated_at": t.updated_at.isoformat()
            }
            for t in templates
        ]

        redis_client.set_json(cache_key, template_list, ex=TEMPLATE_CACHE_TTL)
        logger.info(f"[TemplateCacheService] Cached list: {cache_key} ({len(template_list)} templates)")

        return template_list

    @staticmethod
    def warm_up_cache(db: Session) -> int:
        """
        캐시 워밍업 (모든 Approved Template 캐싱)

        Args:
            db: 데이터베이스 세션

        Returns:
            캐싱된 Template 개수
        """
        templates = db.query(Template).filter(Template.status == "approved").all()

        count = 0
        for template in templates:
            template_data = {
                "id": str(template.id),
                "template_id": template.template_id,
                "type": template.type,
                "origin": template.origin,
                "industry": template.industry or [],
                "channel": template.channel or [],
                "document_json": template.document_json,
                "status": template.status,
                "template_metadata": template.template_metadata or {},
                "created_at": template.created_at.isoformat(),
                "updated_at": template.updated_at.isoformat()
            }

            cache_key = TemplateCacheService._get_cache_key(template.template_id)
            if redis_client.set_json(cache_key, template_data, ex=TEMPLATE_CACHE_TTL):
                count += 1

        logger.info(f"[TemplateCacheService] Warmed up cache with {count} templates")
        return count


# Global instance
template_cache_service = TemplateCacheService()
