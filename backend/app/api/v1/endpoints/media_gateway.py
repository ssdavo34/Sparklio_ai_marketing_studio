"""
Media Gateway API Endpoints

미디어 생성 API

작성일: 2025-11-16
작성자: B팀 (Backend)
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Dict, Any, Optional, List, Literal
import logging

from app.services.media import get_media_gateway, MediaProviderOutput

router = APIRouter()
logger = logging.getLogger(__name__)


# Request/Response Models
class MediaGenerateRequest(BaseModel):
    """미디어 생성 요청"""
    prompt: str = Field(..., description="생성 프롬프트", example="A modern wireless earbud product photo")
    task: str = Field(..., description="작업 유형", example="product_image")
    media_type: Literal["image", "video", "audio"] = Field("image", description="미디어 타입")
    options: Optional[Dict[str, Any]] = Field(None, description="추가 옵션 (width, height, steps 등)")


class MediaGenerateResponse(BaseModel):
    """미디어 생성 응답"""
    provider: str = Field(..., description="사용된 Provider")
    model: str = Field(..., description="사용된 모델/워크플로우")
    usage: Dict[str, Any] = Field(..., description="리소스 사용량")
    outputs: List[MediaProviderOutput] = Field(..., description="생성된 미디어 목록")
    meta: Dict[str, Any] = Field(..., description="메타데이터")


@router.post("/generate", response_model=MediaGenerateResponse)
async def generate_media(request: MediaGenerateRequest):
    """
    미디어 생성

    ComfyUI 또는 Mock Provider를 사용하여 이미지/비디오/오디오 생성

    **작업 유형 (task)**:
    - `product_image`: 제품 이미지 (1024x1024)
    - `brand_logo`: 브랜드 로고 (512x512)
    - `sns_thumbnail`: SNS 썸네일 (1200x630)

    **옵션 예시**:
    ```json
    {
      "width": 1024,
      "height": 1024,
      "steps": 30,
      "cfg_scale": 7.0,
      "seed": 42,
      "negative_prompt": "low quality, blurry"
    }
    ```

    Returns:
        생성된 미디어 정보 (Base64 인코딩된 데이터 포함)
    """
    try:
        gateway = get_media_gateway()

        response = await gateway.generate(
            prompt=request.prompt,
            task=request.task,
            media_type=request.media_type,
            options=request.options
        )

        return MediaGenerateResponse(
            provider=response.provider,
            model=response.model,
            usage=response.usage,
            outputs=response.outputs,
            meta=response.meta
        )

    except ValueError as e:
        logger.error(f"Invalid request: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

    except Exception as e:
        logger.error(f"Media generation failed: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Media generation failed: {str(e)}")


@router.get("/health")
async def health_check():
    """
    Media Gateway 헬스 체크

    모든 Provider의 상태를 확인합니다.

    Returns:
        Provider별 상태 정보
    """
    try:
        gateway = get_media_gateway()
        status = await gateway.health_check()
        return status

    except Exception as e:
        logger.error(f"Health check failed: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Health check failed: {str(e)}")
