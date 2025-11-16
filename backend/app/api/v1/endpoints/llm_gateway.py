"""
LLM Gateway API Endpoints

LLM Gateway를 위한 FastAPI 엔드포인트

작성일: 2025-11-16
작성자: B팀 (Backend)
문서: ARCH-002, SPEC-001
"""

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from typing import Dict, Any, Optional
import logging

from app.services.llm.gateway import get_gateway
from app.services.llm.providers.base import ProviderError

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/llm", tags=["LLM Gateway"])


# Request/Response Models
class LLMGenerateRequest(BaseModel):
    """LLM 생성 요청"""
    role: str = Field(..., description="Agent 역할 (copywriter, strategist, reviewer 등)")
    task: str = Field(..., description="작업 유형 (product_detail, brand_kit, sns 등)")
    payload: Dict[str, Any] = Field(..., description="입력 데이터 (브리프, 상품 정보 등)")
    mode: str = Field(default="json", description="출력 모드 (json | text)")
    override_model: Optional[str] = Field(None, description="강제 사용할 모델 (선택)")
    options: Optional[Dict[str, Any]] = Field(None, description="Provider별 추가 옵션")

    class Config:
        json_schema_extra = {
            "example": {
                "role": "copywriter",
                "task": "product_detail",
                "payload": {
                    "product_name": "프리미엄 무선 이어폰",
                    "features": ["노이즈 캔슬링", "24시간 배터리", "IPX7 방수"],
                    "target_audience": "2030 세대"
                },
                "mode": "json"
            }
        }


class LLMGenerateResponse(BaseModel):
    """LLM 생성 응답"""
    provider: str = Field(..., description="사용된 Provider")
    model: str = Field(..., description="사용된 모델")
    usage: Dict[str, int] = Field(..., description="토큰 사용량")
    output: Dict[str, Any] | str = Field(..., description="생성된 결과")
    meta: Dict[str, Any] = Field(..., description="메타데이터")


class HealthCheckResponse(BaseModel):
    """상태 확인 응답"""
    gateway: str = Field(..., description="Gateway 상태")
    mode: str = Field(..., description="현재 모드 (mock | live)")
    providers: Dict[str, Any] = Field(..., description="Provider별 상태")


# Endpoints
@router.post(
    "/generate",
    response_model=LLMGenerateResponse,
    summary="LLM 텍스트 생성",
    description="""
    LLM을 사용하여 텍스트를 생성합니다.

    **지원하는 역할 (role)**:
    - `copywriter`: 카피라이팅
    - `strategist`: 전략 수립
    - `reviewer`: 콘텐츠 검토
    - `brief_agent`: 브리프 추출
    - `brand_agent`: 브랜드킷 생성
    - `vision_generator`: 이미지 프롬프트 생성

    **지원하는 작업 (task)**:
    - `product_detail`: 상품 상세 설명
    - `sns`: SNS 콘텐츠
    - `brand_kit`: 브랜드킷
    - `campaign`: 캠페인 기획
    - `review`: 콘텐츠 검토

    **출력 모드 (mode)**:
    - `json`: JSON 형식 (기본값)
    - `text`: 일반 텍스트

    **Mock/Live 모드**:
    - Mock 모드: 빠른 테스트 (5초 이내)
    - Live 모드: 실제 LLM 호출 (GENERATOR_MODE 환경 변수로 설정)
    """
)
async def generate_text(request: LLMGenerateRequest) -> LLMGenerateResponse:
    """
    LLM 텍스트 생성

    Args:
        request: LLM 생성 요청

    Returns:
        LLMGenerateResponse: 생성 결과

    Raises:
        HTTPException: 요청 실패 시
    """
    try:
        gateway = get_gateway()

        # Gateway 호출
        response = await gateway.generate(
            role=request.role,
            task=request.task,
            payload=request.payload,
            mode=request.mode,
            override_model=request.override_model,
            options=request.options
        )

        # 응답 변환
        return LLMGenerateResponse(
            provider=response.provider,
            model=response.model,
            usage=response.usage,
            output=response.output,
            meta=response.meta
        )

    except ProviderError as e:
        logger.error(f"Provider error: {e.message}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "error": "provider_error",
                "message": e.message,
                "provider": e.provider,
                "details": e.details
            }
        )

    except ValueError as e:
        logger.error(f"Validation error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": "validation_error",
                "message": str(e)
            }
        )

    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": "internal_error",
                "message": "An unexpected error occurred"
            }
        )


@router.get(
    "/health",
    response_model=HealthCheckResponse,
    summary="Gateway 상태 확인",
    description="""
    LLM Gateway 및 모든 Provider의 상태를 확인합니다.

    **응답 상태**:
    - `healthy`: 정상 작동
    - `unhealthy`: 비정상 작동
    - `error`: 에러 발생
    """
)
async def health_check() -> HealthCheckResponse:
    """
    Gateway 및 Provider 상태 확인

    Returns:
        HealthCheckResponse: 상태 정보
    """
    try:
        gateway = get_gateway()
        health_status = await gateway.health_check()

        return HealthCheckResponse(**health_status)

    except Exception as e:
        logger.error(f"Health check failed: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": "health_check_failed",
                "message": str(e)
            }
        )


@router.get(
    "/models",
    summary="사용 가능한 모델 목록",
    description="현재 사용 가능한 LLM 모델 목록을 반환합니다."
)
async def list_models() -> Dict[str, Any]:
    """
    사용 가능한 모델 목록

    Returns:
        모델 정보
    """
    from app.services.llm.router import get_router

    router_instance = get_router()

    # Ollama 모델 정보
    models_info = []
    for tier, model in router_instance.ollama_models.items():
        info = router_instance.get_model_info(model, "ollama")
        models_info.append(info)

    return {
        "total": len(models_info),
        "models": models_info,
        "default_provider": "ollama"
    }


@router.get(
    "/router/info",
    summary="Router 설정 정보",
    description="Router의 현재 설정 정보를 반환합니다."
)
async def router_info() -> Dict[str, Any]:
    """
    Router 설정 정보

    Returns:
        Router 설정
    """
    from app.services.llm.router import get_router

    router_instance = get_router()

    return {
        "role_tiers": {k: v.value for k, v in router_instance.role_tiers.items()},
        "task_overrides": {k: v.value for k, v in router_instance.task_overrides.items()},
        "ollama_models": {k.value: v for k, v in router_instance.ollama_models.items()},
        "provider_priority": router_instance.provider_priority
    }
