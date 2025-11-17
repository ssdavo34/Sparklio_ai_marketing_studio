"""
Generator Schemas

프론트엔드와 공유되는 Generator API 인터페이스

작성일: 2025-11-17
"""

from pydantic import BaseModel, Field
from typing import Any, Dict, Optional, List
from datetime import datetime


class GenerateRequest(BaseModel):
    """
    Generator 실행 요청

    프론트엔드가 POST /api/v1/generate에 전송하는 요청
    """
    kind: str = Field(
        ...,
        description="생성 타입",
        example="product_detail"
    )
    brandId: str = Field(
        ...,
        description="브랜드 ID",
        example="brand_demo"
    )
    input: Dict[str, Any] = Field(
        ...,
        description="입력 데이터 (kind에 따라 다름)"
    )
    options: Optional[Dict[str, Any]] = Field(
        None,
        description="추가 옵션"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "kind": "product_detail",
                "brandId": "brand_demo",
                "input": {
                    "product_name": "딥그린 진정 토너",
                    "features": ["저자극", "지성피부"],
                    "target_audience": "2030 직장인"
                },
                "options": {
                    "tone": "professional",
                    "length": "medium"
                }
            }
        }


class DocumentPayload(BaseModel):
    """Editor Document 구조"""
    documentId: str = Field(..., description="Document ID")
    type: str = Field(..., description="Document 타입")
    canvas_json: Dict[str, Any] = Field(
        ...,
        description="Fabric.js Canvas JSON"
    )


class TextPayload(BaseModel):
    """생성된 텍스트 블록"""
    headline: Optional[str] = Field(None, description="헤드라인")
    subheadline: Optional[str] = Field(None, description="서브헤드라인")
    body: Optional[str] = Field(None, description="본문")
    bullets: Optional[List[str]] = Field(None, description="불릿 포인트")
    cta: Optional[str] = Field(None, description="Call to Action")


class GenerateResponse(BaseModel):
    """
    Generator 실행 응답

    프론트엔드가 받는 응답
    """
    kind: str = Field(..., description="생성 타입")
    document: DocumentPayload = Field(..., description="Editor Document")
    text: TextPayload = Field(..., description="생성된 텍스트")
    meta: Dict[str, Any] = Field(
        default_factory=dict,
        description="메타데이터 (워크플로우 추적, 토큰 사용량 등)"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "kind": "product_detail",
                "document": {
                    "documentId": "doc_xyz789",
                    "type": "product_detail",
                    "canvas_json": {
                        "version": "5.3.0",
                        "objects": []
                    }
                },
                "text": {
                    "headline": "완벽한 소음 차단의 시작",
                    "body": "프리미엄 노이즈캔슬링 기술...",
                    "bullets": ["24시간 배터리", "IPX7 방수"]
                },
                "meta": {
                    "workflow": "product_content_pipeline",
                    "agents_used": ["copywriter", "reviewer"],
                    "elapsed_seconds": 12.35,
                    "tokens_used": 350
                }
            }
        }
