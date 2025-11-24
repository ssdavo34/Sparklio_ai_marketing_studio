"""
Product Detail Generator Service

상품 상세페이지 생성 서비스 (CopywriterAgent + Canvas 변환)

작성일: 2025-11-24
작성자: B팀 (Backend)
참조: SPARKLIO_MVP_MASTER_TRACKER.md - P1 Multi-Channel Generator
"""

import logging
from typing import Optional, Dict, Any
from uuid import UUID

from app.services.agents.copywriter import get_copywriter_agent
from app.services.agents.base import AgentRequest, AgentResponse
from app.schemas.product_detail import (
    ProductDetailFullInput,
    ProductDetailFullOutput
)
from app.schemas.canvas import DocumentPayload
from app.services.canvas.product_detail_to_canvas import convert_product_detail_to_canvas

logger = logging.getLogger(__name__)


class ProductDetailGenerator:
    """
    상품 상세페이지 생성 서비스

    CopywriterAgent의 product_detail_full task를 사용하여
    상품 상세페이지 콘텐츠를 생성하고, Canvas JSON으로 변환
    """

    def __init__(self):
        self.copywriter_agent = get_copywriter_agent()

    async def generate(
        self,
        product_input: ProductDetailFullInput,
        brand_id: Optional[UUID] = None,
        canvas_width: float = 1200,
        include_images: bool = True,
        brand_colors: Optional[Dict[str, str]] = None,
        brand_fonts: Optional[Dict[str, str]] = None
    ) -> tuple[ProductDetailFullOutput, DocumentPayload, Dict[str, Any]]:
        """
        상품 상세페이지 생성

        Args:
            product_input: 상품 정보 입력
            brand_id: 브랜드 ID (BrandKit 조회용)
            canvas_width: Canvas 너비
            include_images: 이미지 포함 여부
            brand_colors: 브랜드 컬러 (없으면 기본값)
            brand_fonts: 브랜드 폰트 (없으면 기본값)

        Returns:
            tuple: (ProductDetailFullOutput, DocumentPayload, usage)

        Raises:
            AgentError: 생성 실패 시
        """
        logger.info(f"ProductDetailGenerator: Generating for product={product_input.product_name}")

        # 1. CopywriterAgent 호출 (product_detail_full task)
        agent_request = AgentRequest(
            task="product_detail_full",
            payload={
                "product_name": product_input.product_name,
                "product_category": product_input.product_category,
                "key_features": product_input.key_features,
                "target_audience": product_input.target_audience,
                "price": product_input.price,
                "brand_context": product_input.brand_context,
                "product_description": product_input.product_description,
                "customer_pain_points": product_input.customer_pain_points,
                "solutions": product_input.solutions,
                "specifications": product_input.specifications,
                "faqs": product_input.faqs,
                "hero_image_url": product_input.hero_image_url,
                "additional_image_urls": product_input.additional_image_urls,
                "language": product_input.language
            },
            options={
                "tone": product_input.tone,
                "temperature": 0.4
            }
        )

        agent_response: AgentResponse = await self.copywriter_agent.execute(agent_request)

        # 2. AgentResponse → ProductDetailFullOutput 파싱
        content_raw = agent_response.outputs[0].value
        content = ProductDetailFullOutput(**content_raw)

        logger.info(f"ProductDetailGenerator: Content generated, converting to Canvas JSON")

        # 3. ProductDetailFullOutput → Canvas JSON 변환
        document = convert_product_detail_to_canvas(
            content=content,
            brand_id=str(brand_id) if brand_id else "default",
            canvas_width=canvas_width,
            brand_colors=brand_colors,
            brand_fonts=brand_fonts,
            include_images=include_images
        )

        # 4. 사용량 정보
        usage = {
            "llm_tokens": agent_response.usage.get("llm_tokens", 0),
            "total_tokens": agent_response.usage.get("total_tokens", 0),
            "elapsed_seconds": agent_response.usage.get("elapsed_seconds", 0.0),
            "agent": agent_response.agent,
            "task": agent_response.task
        }

        logger.info(
            f"ProductDetailGenerator: Success, "
            f"tokens={usage['llm_tokens']}, elapsed={usage['elapsed_seconds']}s"
        )

        return content, document, usage


# =============================================================================
# Factory Function
# =============================================================================

def get_product_detail_generator() -> ProductDetailGenerator:
    """
    ProductDetailGenerator 인스턴스 반환

    Returns:
        ProductDetailGenerator
    """
    return ProductDetailGenerator()
