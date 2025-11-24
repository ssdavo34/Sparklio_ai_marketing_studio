"""
Banner Generator Service

광고 배너 세트 생성 서비스 (BannerAIAgent + Canvas 변환)

작성일: 2025-11-24
작성자: B팀 (Backend)
참조: SPARKLIO_MVP_MASTER_TRACKER.md - P1 Multi-Channel Generator
"""

import logging
from typing import Optional, Dict, Any, List
from uuid import UUID

from app.services.agents.banner_ai import get_banner_ai_agent
from app.services.agents.base import AgentRequest, AgentResponse
from app.schemas.banner import (
    BannerSetInput,
    BannerSetOutput,
    AdComplianceResult
)
from app.schemas.canvas import DocumentPayload
from app.services.canvas.banner_to_canvas import convert_banner_set_to_canvas

logger = logging.getLogger(__name__)


class BannerGenerator:
    """
    광고 배너 세트 생성 서비스

    BannerAIAgent의 banner_set task를 사용하여
    여러 사이즈의 배너를 생성하고, Canvas JSON으로 변환
    """

    def __init__(self):
        self.banner_agent = get_banner_ai_agent()

    async def generate(
        self,
        banner_input: BannerSetInput,
        brand_id: Optional[UUID] = None,
        brand_colors: Optional[Dict[str, str]] = None,
        brand_fonts: Optional[Dict[str, str]] = None
    ) -> tuple[BannerSetOutput, List[DocumentPayload], Dict[str, Any]]:
        """
        배너 세트 생성

        Args:
            banner_input: 배너 입력 정보
            brand_id: 브랜드 ID (BrandKit 조회용)
            brand_colors: 브랜드 컬러 (없으면 기본값)
            brand_fonts: 브랜드 폰트 (없으면 기본값)

        Returns:
            tuple: (BannerSetOutput, List[DocumentPayload], usage)

        Raises:
            AgentError: 생성 실패 시
        """
        logger.info(
            f"BannerGenerator: Generating banners, "
            f"headline={banner_input.headline}, sizes={banner_input.sizes}"
        )

        # 1. BannerAIAgent 호출 (banner_set task)
        agent_request = AgentRequest(
            task="banner_set",
            payload={
                "headline": banner_input.headline,
                "subheadline": banner_input.subheadline,
                "body_text": banner_input.body_text,
                "cta_text": banner_input.cta_text,
                "background_image_url": banner_input.background_image_url,
                "product_image_url": banner_input.product_image_url,
                "brand_context": banner_input.brand_context,
                "ad_type": banner_input.ad_type,
                "target_platforms": banner_input.target_platforms,
                "sizes": [size.value for size in banner_input.sizes],
                "language": banner_input.language
            },
            options={
                "tone": banner_input.tone,
                "temperature": 0.5
            }
        )

        agent_response: AgentResponse = await self.banner_agent.execute(agent_request)

        # 2. AgentResponse → BannerSetOutput 파싱
        content_raw = agent_response.outputs[0].value

        # 광고 컴플라이언스 체크 (옵션)
        ad_compliance = None
        if banner_input.enable_ad_compliance_check:
            ad_compliance = await self._check_ad_compliance(content_raw)

        # BannerSetOutput 생성
        banner_set = BannerSetOutput(
            banners=content_raw.get("banners", []),
            ad_compliance=ad_compliance,
            tone=banner_input.tone,
            language=banner_input.language,
            ad_type=banner_input.ad_type
        )

        logger.info(
            f"BannerGenerator: {len(banner_set.banners)} banners generated, "
            f"converting to Canvas JSON"
        )

        # 3. BannerSetOutput → Canvas JSON 변환 (각 사이즈별)
        documents = convert_banner_set_to_canvas(
            banner_set=banner_set,
            brand_id=str(brand_id) if brand_id else "default",
            brand_colors=brand_colors,
            brand_fonts=brand_fonts
        )

        # 4. 사용량 정보
        usage = {
            "llm_tokens": agent_response.usage.get("llm_tokens", 0),
            "total_tokens": agent_response.usage.get("total_tokens", 0),
            "elapsed_seconds": agent_response.usage.get("elapsed_seconds", 0.0),
            "agent": agent_response.agent,
            "task": agent_response.task,
            "banner_count": len(banner_set.banners)
        }

        logger.info(
            f"BannerGenerator: Success, "
            f"banners={len(banner_set.banners)}, "
            f"tokens={usage['llm_tokens']}, elapsed={usage['elapsed_seconds']}s"
        )

        return banner_set, documents, usage

    async def _check_ad_compliance(
        self,
        banners_data: Dict[str, Any]
    ) -> Optional[AdComplianceResult]:
        """
        광고 과대광고 체크 (ReviewerAgent 사용)

        TODO: ReviewerAgent 구현 후 연동

        Args:
            banners_data: 배너 데이터

        Returns:
            AdComplianceResult or None
        """
        # 간단한 룰 기반 체크 (임시)
        issues = []
        warnings = []
        suggestions = []

        for banner in banners_data.get("banners", []):
            headline = banner.get("headline", "")
            subheadline = banner.get("subheadline", "")
            body_text = banner.get("body_text", "")

            all_text = f"{headline} {subheadline} {body_text}".lower()

            # 과대광고 키워드 체크
            excessive_keywords = ["최고", "1등", "100%", "무조건", "확실한", "완벽한", "세계 최초"]
            for keyword in excessive_keywords:
                if keyword in all_text:
                    issues.append(f"과대광고 표현 발견: '{keyword}' (검증 불가 표현)")

            # 법적 문구 누락 체크
            if "할인" in all_text or "이벤트" in all_text or "프로모션" in all_text:
                if "기간" not in all_text and "한정" not in all_text:
                    warnings.append("할인/이벤트 기간 명시 권장")

            # 개선 제안
            if len(headline) < 10:
                suggestions.append("헤드라인을 더 구체적으로 작성 권장 (10자 이상)")

        passed = len(issues) == 0

        return AdComplianceResult(
            passed=passed,
            issues=issues,
            warnings=warnings,
            suggestions=suggestions
        )


# =============================================================================
# Factory Function
# =============================================================================

def get_banner_generator() -> BannerGenerator:
    """
    BannerGenerator 인스턴스 반환

    Returns:
        BannerGenerator
    """
    return BannerGenerator()
