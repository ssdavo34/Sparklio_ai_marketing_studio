"""
Redis 클라이언트

Template 캐싱, 세션 관리 등에 사용

Redis 연결 실패 시에도 애플리케이션이 정상 작동하도록 Graceful Degradation 지원
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

    Redis 연결 실패 시에도 예외를 발생시키지 않고,
    is_connected 플래그로 상태를 확인할 수 있습니다.
    """

    def __init__(self, url: Optional[str] = None):
        """
        Redis 클라이언트 초기화.
        - REDIS_URL이 설정되어 있으면 URL 우선 사용
        - 그렇지 않으면 HOST/PORT/DB/PASSWORD 개별 설정 사용

        Args:
            url: Redis 연결 URL (옵션, 없으면 settings에서 자동 탐지)
        """
        self.client = None
        self._connected = False

        # 환경별 Redis 필수 여부 (기본값: False, 개발/테스트 환경 친화적)
        redis_required = getattr(settings, "REDIS_REQUIRED", False)

        try:
            # REDIS_URL 우선 사용 (redis://:password@host:port/db 형식)
            redis_url = url or getattr(settings, "REDIS_URL", None)

            if redis_url:
                # URL 기반 연결 (비밀번호 자동 포함)
                self.client = redis.Redis.from_url(
                    redis_url,
                    decode_responses=True,
                    socket_timeout=5,
                    socket_connect_timeout=5
                )
                logger.info(f"[RedisClient] Connecting to Redis via URL: {redis_url.split('@')[0]}@***")
            else:
                # 개별 파라미터 기반 연결 (REDIS_URL이 없을 때 fallback)
                redis_kwargs = {
                    "host": getattr(settings, "REDIS_HOST", "redis"),
                    "port": getattr(settings, "REDIS_PORT", 6379),
                    "db": getattr(settings, "REDIS_DB", 0),
                    "decode_responses": True,
                    "socket_timeout": 5,
                    "socket_connect_timeout": 5
                }
                # 비밀번호가 있으면 추가
                redis_password = getattr(settings, "REDIS_PASSWORD", None)
                if redis_password:
                    redis_kwargs["password"] = redis_password

                self.client = redis.Redis(**redis_kwargs)
                logger.info(
                    f"[RedisClient] Connecting to Redis at "
                    f"{redis_kwargs['host']}:{redis_kwargs['port']}"
                )

            # 연결 테스트
            self.client.ping()
            self._connected = True
            logger.info("[RedisClient] ✅ Connected to Redis successfully")
        except Exception as e:
            logger.warning(f"[RedisClient] ⚠️ Failed to connect to Redis: {e}")
            logger.warning("[RedisClient] Running in NO-REDIS mode. Cache features will be disabled.")

            if redis_required:
                # 프로덕션 환경에서는 Redis 필수
                logger.error("[RedisClient] ❌ Redis is REQUIRED in this environment. Exiting.")
                raise

            # 개발/테스트 환경에서는 계속 진행
            self.client = None
            self._connected = False

    @property
    def is_connected(self) -> bool:
        """Redis 연결 상태 확인"""
        return self._connected

    def get(self, key: str) -> Optional[str]:
        """
        키로 값 조회

        Args:
            key: Redis 키

        Returns:
            값 (없으면 None)
        """
        if not self.is_connected:
            return None

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
        if not self.is_connected:
            return False

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
        if not self.is_connected:
            return None

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
        if not self.is_connected:
            return False

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
        if not self.is_connected:
            return False

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
        if not self.is_connected:
            return False

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
        if not self.is_connected:
            return False

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
        if not self.is_connected:
            return -2

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
        if not self.is_connected:
            return 0

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
        if not self.is_connected:
            return False

        try:
            return self.client.ping()
        except Exception as e:
            logger.error(f"[RedisClient] Ping failed: {e}")
            return False


# ============================================================================
# Global Redis client instance (안전한 초기화)
# ============================================================================

try:
    redis_client = RedisClient()
except Exception as e:
    # __init__에서 이미 예외를 잡고 있지만, 혹시 모를 예외를 한 번 더 방어
    logger.error(f"[RedisClient] ❌ Fatal error during initialization: {e}")
    redis_client = None
