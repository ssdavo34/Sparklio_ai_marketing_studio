"""
Video Cost Guard Service

영상 렌더링 비용 제어 및 검증 서비스

작성일: 2025-12-01
작성자: B팀 (Backend)
참조: VIDEO_PIPELINE_FLOW_V2.md
"""

import logging
from datetime import datetime, date
from typing import Dict, Optional, Tuple
from dataclasses import dataclass

from app.core.config import settings
from app.schemas.video_timeline import (
    VideoPlanDraftV1,
    RenderMode,
    VideoRenderError,
)

logger = logging.getLogger(__name__)


# =============================================================================
# Cost Constants (Provider별 비용)
# =============================================================================

# AI 영상 생성 비용 ($ per 5 seconds)
PROVIDER_COSTS = {
    "veo": 0.50,      # Google Veo 3 - 고품질
    "luma": 0.30,     # Luma AI
    "runway": 0.40,   # Runway Gen-3
    "mock": 0.00,     # Mock - 무료
}

# 이미지 생성 비용 ($ per image)
IMAGE_GEN_COST = 0.02  # Gemini 이미지 생성

# TTS 비용 ($ per 100 characters)
TTS_COST_PER_100_CHARS = 0.01


@dataclass
class CostEstimate:
    """비용 추정 결과"""
    total_cost: float
    breakdown: Dict[str, float]
    ai_video_scenes: int
    static_scenes: int
    estimated_time_sec: int


@dataclass
class CostCheckResult:
    """비용 체크 결과"""
    allowed: bool
    error_code: Optional[VideoRenderError] = None
    error_message: Optional[str] = None
    daily_cost_used: float = 0.0
    daily_cost_limit: float = 0.0
    estimated_cost: float = 0.0


class VideoCostGuard:
    """
    영상 렌더링 비용 제어 서비스

    기능:
    1. 렌더 모드 검증 (VIDEO_ALLOW_REAL 체크)
    2. 비용 추정 (Provider별, 씬별)
    3. 일일 비용 한도 체크 (RENDER_DAILY_COST_LIMIT)
    4. dry_run 지원
    """

    def __init__(self):
        self.allow_real = settings.VIDEO_ALLOW_REAL
        self.default_mode = settings.VIDEO_DEFAULT_MODE
        self.daily_cost_limit = settings.RENDER_DAILY_COST_LIMIT

    def validate_render_mode(
        self,
        requested_mode: RenderMode
    ) -> Tuple[bool, Optional[str]]:
        """
        렌더 모드 검증

        Args:
            requested_mode: 요청된 렌더 모드

        Returns:
            (allowed, error_message)
        """
        if requested_mode == RenderMode.REAL and not self.allow_real:
            return False, (
                f"실제 AI 영상 생성이 비활성화되어 있습니다. "
                f"(VIDEO_ALLOW_REAL={self.allow_real}). "
                f"관리자에게 문의하거나 render_mode='mock'으로 요청하세요."
            )
        return True, None

    def estimate_cost(
        self,
        plan_draft: VideoPlanDraftV1,
        render_mode: RenderMode,
        provider: str = "veo"
    ) -> CostEstimate:
        """
        렌더링 비용 추정

        Args:
            plan_draft: 렌더링할 플랜
            render_mode: 렌더 모드
            provider: 주 사용 Provider

        Returns:
            CostEstimate 객체
        """
        if render_mode == RenderMode.MOCK:
            return CostEstimate(
                total_cost=0.0,
                breakdown={"mock": 0.0},
                ai_video_scenes=0,
                static_scenes=len(plan_draft.scenes),
                estimated_time_sec=30,  # Mock은 30초 고정
            )

        breakdown = {}
        ai_video_count = 0
        static_count = 0
        total_duration = 0

        # 씬별 비용 계산
        for scene in plan_draft.scenes:
            total_duration += scene.duration_sec

            if scene.use_ai_video:
                ai_video_count += 1
                # AI 영상 비용 (5초 단위)
                video_cost = PROVIDER_COSTS.get(provider, 0.50) * (scene.duration_sec / 5.0)
                breakdown[f"scene_{scene.scene_index}_video"] = video_cost
            else:
                static_count += 1

            # 새 이미지 생성 비용
            if scene.generate_new_image:
                breakdown[f"scene_{scene.scene_index}_image"] = IMAGE_GEN_COST

        # TTS 비용 (스크립트 있는 경우)
        total_script_chars = sum(
            len(scene.script or "") for scene in plan_draft.scenes
        )
        if total_script_chars > 0:
            breakdown["tts"] = (total_script_chars / 100) * TTS_COST_PER_100_CHARS

        # 총 비용
        total_cost = sum(breakdown.values())

        # 예상 렌더 시간 (AI 영상은 씬당 2분, 정적은 10초)
        estimated_time = (ai_video_count * 120) + (static_count * 10) + 30  # 후처리 30초

        return CostEstimate(
            total_cost=round(total_cost, 2),
            breakdown={k: round(v, 3) for k, v in breakdown.items()},
            ai_video_scenes=ai_video_count,
            static_scenes=static_count,
            estimated_time_sec=estimated_time,
        )

    async def get_daily_cost(
        self,
        brand_id: Optional[str] = None,
        user_id: Optional[str] = None
    ) -> float:
        """
        오늘 사용한 비용 조회

        TODO: DB에서 실제 비용 조회 (VideoDailyCost 테이블)
        현재는 0.0 반환 (임시)
        """
        # TODO: 실제 DB 조회 구현
        # from app.models.video_job import VideoDailyCost
        # today = date.today().isoformat()
        # ...

        logger.info(f"[CostGuard] get_daily_cost: brand_id={brand_id}, user_id={user_id}")
        return 0.0  # 임시

    async def check_cost_limit(
        self,
        plan_draft: VideoPlanDraftV1,
        render_mode: RenderMode,
        provider: str = "veo",
        brand_id: Optional[str] = None,
        user_id: Optional[str] = None
    ) -> CostCheckResult:
        """
        비용 한도 체크

        Args:
            plan_draft: 렌더링할 플랜
            render_mode: 렌더 모드
            provider: Provider 이름
            brand_id: 브랜드 ID
            user_id: 사용자 ID

        Returns:
            CostCheckResult 객체
        """
        # 1. 렌더 모드 검증
        mode_allowed, mode_error = self.validate_render_mode(render_mode)
        if not mode_allowed:
            return CostCheckResult(
                allowed=False,
                error_code=VideoRenderError.INVALID_INPUT,
                error_message=mode_error,
            )

        # 2. Mock 모드는 항상 허용
        if render_mode == RenderMode.MOCK:
            return CostCheckResult(
                allowed=True,
                daily_cost_used=0.0,
                daily_cost_limit=self.daily_cost_limit,
                estimated_cost=0.0,
            )

        # 3. 비용 추정
        estimate = self.estimate_cost(plan_draft, render_mode, provider)

        # 4. 오늘 사용한 비용 조회
        daily_used = await self.get_daily_cost(brand_id, user_id)

        # 5. 한도 체크
        if daily_used + estimate.total_cost > self.daily_cost_limit:
            return CostCheckResult(
                allowed=False,
                error_code=VideoRenderError.COST_LIMIT_EXCEEDED,
                error_message=(
                    f"일일 비용 한도 초과. "
                    f"현재 사용: ${daily_used:.2f}, "
                    f"예상 추가: ${estimate.total_cost:.2f}, "
                    f"한도: ${self.daily_cost_limit:.2f}"
                ),
                daily_cost_used=daily_used,
                daily_cost_limit=self.daily_cost_limit,
                estimated_cost=estimate.total_cost,
            )

        return CostCheckResult(
            allowed=True,
            daily_cost_used=daily_used,
            daily_cost_limit=self.daily_cost_limit,
            estimated_cost=estimate.total_cost,
        )

    def get_provider_cost_info(self) -> Dict[str, float]:
        """Provider별 비용 정보 반환"""
        return PROVIDER_COSTS.copy()


# 전역 인스턴스
_cost_guard_instance: Optional[VideoCostGuard] = None


def get_cost_guard() -> VideoCostGuard:
    """Cost Guard 인스턴스 반환 (싱글톤)"""
    global _cost_guard_instance
    if _cost_guard_instance is None:
        _cost_guard_instance = VideoCostGuard()
    return _cost_guard_instance
