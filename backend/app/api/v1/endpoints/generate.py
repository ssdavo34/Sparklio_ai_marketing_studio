"""
Generate API 엔드포인트 (v2)

통합 Generator API - WorkflowExecutor + Agent 기반

작성일: 2025-11-17
"""

from fastapi import APIRouter, HTTPException, status
import logging

from app.schemas.generator import GenerateRequest, GenerateResponse
from app.services.generator import GeneratorService

router = APIRouter()
logger = logging.getLogger(__name__)


def get_generator_service() -> GeneratorService:
    """GeneratorService 인스턴스 생성"""
    return GeneratorService()


@router.post("/generate", response_model=GenerateResponse)
async def generate_content(req: GenerateRequest):
    """
    통합 Generator 엔드포인트

    **지원하는 kind (P0)**:
    - `product_detail`: 제품 상세 콘텐츠 생성
    - `sns_set`: SNS 콘텐츠 세트 생성
    - `presentation_simple`: 간단한 프레젠테이션 생성
    - `brand_identity`: 브랜드 아이덴티티 수립
    - `content_review`: 콘텐츠 검토 및 개선

    **요청 예시**:
    ```json
    {
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
    ```

    **응답 구조**:
    ```json
    {
      "kind": "product_detail",
      "document": {
        "documentId": "doc_abc123",
        "type": "product_detail",
        "canvas_json": {...}
      },
      "text": {
        "headline": "완벽한 소음 차단의 시작",
        "body": "...",
        "bullets": [...]
      },
      "meta": {
        "workflow": "product_content_pipeline",
        "agents_used": ["copywriter", "reviewer"],
        "elapsed_seconds": 12.35,
        "tokens_used": 350
      }
    }
    ```

    Args:
        req: GenerateRequest (kind, brandId, input, options)

    Returns:
        GenerateResponse: document + text + meta

    Raises:
        HTTPException(400): 지원하지 않는 kind
        HTTPException(500): Generator 실행 실패
    """
    logger.info(
        f"[Generate API] kind={req.kind}, brandId={req.brandId}"
    )

    service = get_generator_service()

    try:
        result = await service.generate(req)

        logger.info(
            f"[Generate API] 완료 - docId={result.document.documentId}, "
            f"elapsed={result.meta.get('elapsed_seconds', 0):.2f}s"
        )

        return result

    except ValueError as e:
        # 입력 검증 실패 (잘못된 kind 등)
        logger.error(f"[Generate API] Validation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

    except RuntimeError as e:
        # Generator 실행 실패
        logger.error(
            f"[Generate API] Runtime error: {e}",
            exc_info=True
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Generator 실행 실패: {str(e)}"
        )

    except Exception as e:
        # 예상치 못한 오류
        logger.error(
            f"[Generate API] Unexpected error: {e}",
            exc_info=True
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"예상치 못한 오류 발생: {str(e)}"
        )


@router.get("/generate/kinds")
async def list_available_kinds():
    """
    사용 가능한 kind 목록 조회

    Returns:
        사용 가능한 kind 목록 및 설명
    """
    return {
        "kinds": [
            {
                "kind": "product_detail",
                "description": "제품 상세 콘텐츠 생성",
                "workflow": "product_content_pipeline"
            },
            {
                "kind": "sns_set",
                "description": "SNS 콘텐츠 세트 생성",
                "workflow": "product_content_pipeline"
            },
            {
                "kind": "presentation_simple",
                "description": "간단한 프레젠테이션 생성",
                "workflow": "product_content_pipeline"
            },
            {
                "kind": "brand_identity",
                "description": "브랜드 아이덴티티 수립",
                "workflow": "brand_identity_pipeline"
            },
            {
                "kind": "content_review",
                "description": "콘텐츠 검토 및 개선",
                "workflow": "content_review_pipeline"
            }
        ]
    }
