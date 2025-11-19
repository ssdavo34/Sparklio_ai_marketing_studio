"""
Canvas Service Module

추상 Canvas 생성 (v2.0) + Fabric.js 호환 (v1.0 하위호환)

작성일: 2025-11-17
수정일: 2025-11-19 (Abstract Builder 추가)
"""

from .fabric_builder import (
    FabricCanvasBuilder,
    create_product_detail_canvas,
    create_brand_identity_canvas,
    create_sns_set_canvas
)
from .abstract_builder import (
    AbstractCanvasBuilder,
    create_product_detail_document,
    create_sns_feed_document
)

__all__ = [
    # Legacy Fabric.js (v1.0)
    "FabricCanvasBuilder",
    "create_product_detail_canvas",
    "create_brand_identity_canvas",
    "create_sns_set_canvas",
    # Abstract Canvas (v2.0)
    "AbstractCanvasBuilder",
    "create_product_detail_document",
    "create_sns_feed_document"
]
