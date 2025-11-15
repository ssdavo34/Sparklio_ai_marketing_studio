"""
Brand Learning Engine Service

브랜드 학습 및 RAG (Retrieval-Augmented Generation) 서비스

브랜드별 과거 생성 이력, 선호 스타일, 키워드 등을 학습하여
Generator에서 활용할 수 있도록 제공합니다.
"""

from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
import logging

from app.models.document import GenerationJob, Document
from app.models.brand import Brand
from app.core.redis_client import redis_client

logger = logging.getLogger(__name__)

# 학습 데이터 캐시 TTL (6시간)
LEARNING_CACHE_TTL = 21600


class BrandLearningEngine:
    """
    Brand Learning Engine

    브랜드별 생성 이력 및 선호도를 학습하여 Generator에 제공
    """

    @staticmethod
    def _get_cache_key(brand_id: str, data_type: str) -> str:
        """
        학습 데이터 캐시 키 생성

        Args:
            brand_id: 브랜드 ID
            data_type: 데이터 유형 (generation_history, preferences, keywords)

        Returns:
            Redis 캐시 키
        """
        return f"brand_learning:{brand_id}:{data_type}"

    @staticmethod
    def get_generation_history(
        brand_id: str,
        kind: Optional[str] = None,
        limit: int = 10,
        db: Session = None
    ) -> List[Dict[str, Any]]:
        """
        브랜드의 과거 생성 이력 조회

        Args:
            brand_id: 브랜드 ID
            kind: Generator 유형 필터 (brand_kit, product_detail, sns)
            limit: 조회할 최대 개수
            db: 데이터베이스 세션

        Returns:
            생성 이력 목록
        """
        cache_key = BrandLearningEngine._get_cache_key(brand_id, f"history:{kind or 'all'}:{limit}")

        # 캐시 조회
        cached = redis_client.get_json(cache_key)
        if cached:
            logger.info(f"[BrandLearningEngine] Cache HIT for history: brand_id={brand_id}, kind={kind}")
            return cached

        if not db:
            return []

        # DB 조회
        logger.info(f"[BrandLearningEngine] Cache MISS for history: brand_id={brand_id}, kind={kind}, querying DB")
        query = db.query(GenerationJob).filter(
            GenerationJob.brand_id == brand_id,
            GenerationJob.status == "completed"
        )

        if kind:
            query = query.filter(GenerationJob.kind == kind)

        jobs = query.order_by(desc(GenerationJob.completed_at)).limit(limit).all()

        # 결과 변환
        history = [
            {
                "task_id": job.task_id,
                "kind": job.kind,
                "input_data": job.input_data,
                "result_data": job.result_data,
                "completed_at": job.completed_at.isoformat() if job.completed_at else None,
                "duration_ms": job.duration_ms
            }
            for job in jobs
        ]

        # 캐시 저장
        redis_client.set_json(cache_key, history, ex=LEARNING_CACHE_TTL)
        logger.info(f"[BrandLearningEngine] Cached history: brand_id={brand_id}, count={len(history)}")

        return history

    @staticmethod
    def get_brand_preferences(
        brand_id: str,
        db: Session = None
    ) -> Dict[str, Any]:
        """
        브랜드 선호도 분석

        과거 생성 이력을 분석하여 브랜드 선호 스타일, 톤, 색상 등을 추출합니다.

        Args:
            brand_id: 브랜드 ID
            db: 데이터베이스 세션

        Returns:
            브랜드 선호도 데이터
        """
        cache_key = BrandLearningEngine._get_cache_key(brand_id, "preferences")

        # 캐시 조회
        cached = redis_client.get_json(cache_key)
        if cached:
            logger.info(f"[BrandLearningEngine] Cache HIT for preferences: brand_id={brand_id}")
            return cached

        if not db:
            return {}

        # 생성 이력 조회
        history = BrandLearningEngine.get_generation_history(brand_id, limit=50, db=db)

        if not history:
            logger.info(f"[BrandLearningEngine] No history for brand_id={brand_id}, returning empty preferences")
            return {}

        # 선호도 분석 (간단한 통계 기반)
        preferences = {
            "total_generations": len(history),
            "most_used_generator": None,
            "average_duration_ms": 0,
            "preferred_tones": [],  # 향후 구현: 생성된 카피 톤 분석
            "preferred_styles": [],  # 향후 구현: 템플릿 스타일 분석
            "common_keywords": [],  # 향후 구현: 키워드 빈도 분석
        }

        # Generator 사용 빈도 분석
        kind_count = {}
        total_duration = 0
        for item in history:
            kind = item.get("kind")
            if kind:
                kind_count[kind] = kind_count.get(kind, 0) + 1

            duration = item.get("duration_ms", 0)
            if duration:
                total_duration += duration

        if kind_count:
            preferences["most_used_generator"] = max(kind_count, key=kind_count.get)

        if len(history) > 0:
            preferences["average_duration_ms"] = total_duration // len(history)

        # 캐시 저장
        redis_client.set_json(cache_key, preferences, ex=LEARNING_CACHE_TTL)
        logger.info(f"[BrandLearningEngine] Cached preferences: brand_id={brand_id}")

        return preferences

    @staticmethod
    def get_recommended_templates(
        brand_id: str,
        generator_kind: str,
        db: Session = None
    ) -> List[str]:
        """
        브랜드에 추천할 Template ID 목록 반환

        과거 사용 이력 및 선호도를 기반으로 템플릿을 추천합니다.

        Args:
            brand_id: 브랜드 ID
            generator_kind: Generator 유형
            db: 데이터베이스 세션

        Returns:
            추천 Template ID 목록
        """
        # 향후 구현: 실제 Template 사용 이력 분석
        # 현재는 기본 템플릿 반환
        logger.info(f"[BrandLearningEngine] Recommending templates for brand_id={brand_id}, kind={generator_kind}")

        # 기본 템플릿 ID (실제로는 DB에서 조회)
        default_templates = {
            "brand_kit": ["brand_kit_modern", "brand_kit_classic"],
            "product_detail": ["product_detail_premium", "product_detail_minimal"],
            "sns": ["sns_instagram_square", "sns_instagram_story"]
        }

        return default_templates.get(generator_kind, [])

    @staticmethod
    def record_generation_feedback(
        brand_id: str,
        task_id: str,
        feedback: Dict[str, Any],
        db: Session = None
    ) -> bool:
        """
        생성 결과에 대한 사용자 피드백 기록

        향후 학습 개선에 활용

        Args:
            brand_id: 브랜드 ID
            task_id: Generation Task ID
            feedback: 피드백 데이터
            db: 데이터베이스 세션

        Returns:
            성공 여부
        """
        logger.info(f"[BrandLearningEngine] Recording feedback for brand_id={brand_id}, task_id={task_id}")

        # 향후 구현: 피드백 DB 저장 및 학습 모델 업데이트
        # 현재는 로그만 기록
        logger.info(f"[BrandLearningEngine] Feedback: {feedback}")

        # 캐시 무효화 (피드백 반영)
        cache_key = BrandLearningEngine._get_cache_key(brand_id, "preferences")
        redis_client.delete(cache_key)

        return True

    @staticmethod
    def invalidate_cache(brand_id: str) -> int:
        """
        브랜드 학습 캐시 무효화

        Args:
            brand_id: 브랜드 ID

        Returns:
            삭제된 캐시 개수
        """
        pattern = f"brand_learning:{brand_id}:*"
        count = redis_client.flush_pattern(pattern)
        logger.info(f"[BrandLearningEngine] Invalidated {count} caches for brand_id={brand_id}")
        return count


# Global instance
brand_learning_engine = BrandLearningEngine()
