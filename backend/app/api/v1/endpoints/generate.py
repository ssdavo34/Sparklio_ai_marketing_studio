"""
Generate API 엔드포인트

통합 Generator API
SYSTEM_ARCHITECTURE.md 5.1.3, B_TEAM_WORK_ORDER.md 섹션 5.2 기반
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import logging

from app.core.database import get_db
from app.auth.jwt import get_current_user
from app.models.user import User
from app.generators.base import GenerationRequest, GenerationResult
from app.generators.brand_kit import BrandKitGenerator

router = APIRouter()
logger = logging.getLogger(__name__)

# Generator 인스턴스 관리
# P0: Brand Kit만 구현
# P1: Product Detail, SNS, Presentation 추가
generators = {
    "brand_kit": BrandKitGenerator(),
    # "product_detail": ProductDetailGenerator(),  # P1
    # "sns": SNSGenerator(),  # P1
}


@router.post("/generate", response_model=dict)
async def generate_content(
    request: GenerationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    통합 Generator 엔드포인트

    **P0 범위**:
    - kind: "brand_kit"

    **P1 범위** (향후):
    - kind: "product_detail", "sns", "presentation"

    ---

    ### 요청 예시:

    ```json
    {
      "kind": "brand_kit",
      "brandId": "brand_001",
      "locale": "ko-KR",
      "input": {
        "brand": {
          "name": "스킨케어 브랜드 A",
          "industry": "beauty",
          "description": "자연주의 스킨케어",
          "target_audience": "20-30대 여성",
          "values": ["자연", "건강", "지속가능성"]
        }
      }
    }
    ```

    ### 응답:

    ```json
    {
      "taskId": "gen_abc123",
      "kind": "brand_kit",
      "textBlocks": {
        "slogan": "브랜드 슬로건",
        "mission": "브랜드 미션",
        "values": "핵심 가치들",
        ...
      },
      "editorDocument": {
        "documentId": "doc_xyz789",
        "type": "brand_kit",
        "pages": [...]
      },
      "meta": {
        "templates_used": ["brand_kit_default"],
        "agents_trace": [...],
        "llm_cost": {...}
      }
    }
    ```

    ---

    Args:
        request: Generator 요청 (kind, brandId, input, context)
        current_user: 현재 로그인한 사용자
        db: 데이터베이스 세션

    Returns:
        GenerationResult: textBlocks + editorDocument + meta

    Raises:
        HTTPException(400): 지원하지 않는 Generator kind
        HTTPException(500): Generator 실행 실패
    """
    logger.info(
        f"[Generate API] kind={request.kind}, "
        f"brandId={request.brandId}, "
        f"user={current_user.username}"
    )

    # 1. Generator 검증
    if request.kind not in generators:
        available_kinds = list(generators.keys())
        logger.warning(f"[Generate API] Unknown kind: {request.kind}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"지원하지 않는 Generator 타입: {request.kind}. "
                   f"사용 가능한 타입: {available_kinds}"
        )

    # 2. Generator 실행
    generator = generators[request.kind]

    try:
        result: GenerationResult = await generator.generate(request)

        logger.info(
            f"[Generate API] Completed - task_id={result.taskId}, "
            f"kind={result.kind}, "
            f"doc_id={result.editorDocument.get('documentId')}"
        )

        # 3. DB 저장 (선택사항 - P0에서는 응답만 반환)
        # TODO: generation_jobs 테이블에 task 기록

        return result.model_dump()

    except ValueError as e:
        # 입력 검증 실패
        logger.error(f"[Generate API] Validation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except RuntimeError as e:
        # Generator 실행 실패
        logger.error(f"[Generate API] Runtime error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Generator 실행 실패: {str(e)}"
        )
    except Exception as e:
        # 예상치 못한 오류
        logger.error(f"[Generate API] Unexpected error: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"예상치 못한 오류 발생: {str(e)}"
        )


@router.get("/generate/status/{task_id}", response_model=dict)
async def get_generation_status(
    task_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Generation Task 상태 조회 (P1)

    Args:
        task_id: 생성 작업 ID
        current_user: 현재 로그인한 사용자
        db: 데이터베이스 세션

    Returns:
        Task 상태 정보

    Note:
        P0에서는 미구현 (HTTP 501)
        P1에서 generation_jobs 테이블 연동하여 구현
    """
    logger.info(f"[Generate API] Status check - task_id={task_id}")

    # TODO: P1에서 generation_jobs 테이블 조회 구현
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Task 상태 조회 기능은 P1에서 구현 예정입니다"
    )
