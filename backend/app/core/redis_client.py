"""
Redis 클라이언트

Template 캐싱, 세션 관리 등에 사용
"""

import redis
import json
from typing import Any, Optional
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)


class RedisClient:
    """
    Redis 클라이언트 래퍼

    Template 캐싱, 세션 관리, Rate Limiting 등에 사용
    """

    def __init__(self):
        """Redis 클라이언트 초기화"""
        try:
            self.client = redis.Redis(
                host=settings.REDIS_HOST,
                port=settings.REDIS_PORT,
                db=settings.REDIS_DB,
                decode_responses=True,
                socket_timeout=5,
                socket_connect_timeout=5
            )
            # 연결 테스트
            self.client.ping()
            logger.info(f"[RedisClient] Connected to Redis at {settings.REDIS_HOST}:{settings.REDIS_PORT}")
        except redis.ConnectionError as e:
            logger.error(f"[RedisClient] Failed to connect to Redis: {e}")
            raise

    def get(self, key: str) -> Optional[str]:
        """
        키로 값 조회

        Args:
            key: Redis 키

        Returns:
            값 (없으면 None)
        """
        try:
            return self.client.get(key)
        except Exception as e:
            logger.error(f"[RedisClient] Failed to get key {key}: {e}")
            return None

    def set(
        self,
        key: str,
        value: str,
        ex: Optional[int] = None,
        nx: bool = False
    ) -> bool:
        """
        키에 값 저장

        Args:
            key: Redis 키
            value: 저장할 값
            ex: 만료 시간 (초), None이면 영구
            nx: True면 키가 없을 때만 저장

        Returns:
            성공 여부
        """
        try:
            return self.client.set(key, value, ex=ex, nx=nx)
        except Exception as e:
            logger.error(f"[RedisClient] Failed to set key {key}: {e}")
            return False

    def get_json(self, key: str) -> Optional[Any]:
        """
        JSON으로 저장된 값 조회

        Args:
            key: Redis 키

        Returns:
            파싱된 JSON 객체 (없으면 None)
        """
        try:
            value = self.client.get(key)
            if value:
                return json.loads(value)
            return None
        except json.JSONDecodeError as e:
            logger.error(f"[RedisClient] Failed to parse JSON for key {key}: {e}")
            return None
        except Exception as e:
            logger.error(f"[RedisClient] Failed to get JSON key {key}: {e}")
            return None

    def set_json(
        self,
        key: str,
        value: Any,
        ex: Optional[int] = None
    ) -> bool:
        """
        JSON으로 값 저장

        Args:
            key: Redis 키
            value: 저장할 객체 (JSON 직렬화 가능)
            ex: 만료 시간 (초), None이면 영구

        Returns:
            성공 여부
        """
        try:
            json_str = json.dumps(value, ensure_ascii=False)
            return self.client.set(key, json_str, ex=ex)
        except Exception as e:
            logger.error(f"[RedisClient] Failed to set JSON key {key}: {e}")
            return False

    def delete(self, key: str) -> bool:
        """
        키 삭제

        Args:
            key: Redis 키

        Returns:
            성공 여부
        """
        try:
            return self.client.delete(key) > 0
        except Exception as e:
            logger.error(f"[RedisClient] Failed to delete key {key}: {e}")
            return False

    def exists(self, key: str) -> bool:
        """
        키 존재 여부 확인

        Args:
            key: Redis 키

        Returns:
            존재 여부
        """
        try:
            return self.client.exists(key) > 0
        except Exception as e:
            logger.error(f"[RedisClient] Failed to check key {key}: {e}")
            return False

    def expire(self, key: str, seconds: int) -> bool:
        """
        키 만료 시간 설정

        Args:
            key: Redis 키
            seconds: 만료 시간 (초)

        Returns:
            성공 여부
        """
        try:
            return self.client.expire(key, seconds)
        except Exception as e:
            logger.error(f"[RedisClient] Failed to set expiry for key {key}: {e}")
            return False

    def ttl(self, key: str) -> int:
        """
        키 남은 만료 시간 조회

        Args:
            key: Redis 키

        Returns:
            남은 시간 (초), -1이면 만료 시간 없음, -2이면 키 없음
        """
        try:
            return self.client.ttl(key)
        except Exception as e:
            logger.error(f"[RedisClient] Failed to get TTL for key {key}: {e}")
            return -2

    def flush_pattern(self, pattern: str) -> int:
        """
        패턴에 매칭되는 모든 키 삭제

        Args:
            pattern: Redis 패턴 (예: "template:*")

        Returns:
            삭제된 키 개수
        """
        try:
            keys = self.client.keys(pattern)
            if keys:
                return self.client.delete(*keys)
            return 0
        except Exception as e:
            logger.error(f"[RedisClient] Failed to flush pattern {pattern}: {e}")
            return 0

    def ping(self) -> bool:
        """
        Redis 연결 확인

        Returns:
            연결 상태
        """
        try:
            return self.client.ping()
        except Exception as e:
            logger.error(f"[RedisClient] Ping failed: {e}")
            return False


# Global Redis client instance
redis_client = RedisClient()
