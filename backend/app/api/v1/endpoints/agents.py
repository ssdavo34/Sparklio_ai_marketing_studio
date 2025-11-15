"""
Agents API 엔드포인트

Agent 실행 및 관리를 위한 API
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID
import logging

from app.core.database import get_db
from app.auth.jwt import get_current_user
from app.models.user import User
from app.models.project import Project
from app.schemas.agent import A2ARequest, A2AResponse, SystemContext
from app.agents.brief import BriefAgent

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/brief/generate", response_model=dict)
async def generate_brief(
    user_input: str,
    project_type: str = "campaign",
    brand_id: UUID = None,
    project_id: UUID = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Brief 생성 API

    사용자의 자연어 입력을 구조화된 마케팅 Brief로 변환합니다.

    Args:
        user_input: 사용자의 요구사항 (자연어)
        project_type: 프로젝트 타입 (campaign, brochure, sns 등)
        brand_id: 브랜드 ID (optional)
        project_id: 프로젝트 ID (optional, Brief 업데이트 시 사용)
        current_user: 현재 로그인한 사용자
        db: 데이터베이스 세션

    Returns:
        생성된 Brief 데이터
    """
    try:
        # BriefAgent 초기화
        brief_agent = BriefAgent()

        # A2A 요청 생성
        system_context = SystemContext(
            brand_id=str(brand_id) if brand_id else None,
            project_id=str(project_id) if project_id else None,
            user_id=str(current_user.id),
            task_type="brief_generation",
            risk_level="low"
        )

        request = A2ARequest(
            request_id=f"brief_{current_user.id}",
            source_agent="API",
            target_agent="BriefAgent",
            system_context=system_context,
            payload={
                "user_input": user_input,
                "project_type": project_type
            }
        )

        # Agent 실행
        logger.info(f"[API] Executing BriefAgent for user={current_user.username}")
        response = await brief_agent.execute(request)

        if response.status != "success":
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Brief 생성 실패: {response.error}"
            )

        # 프로젝트에 Brief 저장 (project_id가 제공된 경우)
        if project_id:
            project = db.query(Project).filter(
                Project.id == project_id,
                Project.owner_id == current_user.id,
                Project.deleted_at.is_(None)
            ).first()

            if not project:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="프로젝트를 찾을 수 없습니다"
                )

            # Brief 업데이트
            project.brief = response.result["brief"]
            db.commit()
            db.refresh(project)

            logger.info(f"[API] Brief saved to project_id={project_id}")

        return {
            "success": True,
            "brief": response.result["brief"],
            "confidence": response.result.get("confidence", 0.0),
            "project_id": str(project_id) if project_id else None,
            "metadata": response.metadata
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[API] Error in generate_brief: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Brief 생성 중 오류 발생: {str(e)}"
        )


@router.post("/brief/update/{project_id}", response_model=dict)
async def update_brief(
    project_id: UUID,
    user_input: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    기존 Brief 업데이트

    기존 프로젝트의 Brief를 사용자 입력으로 업데이트합니다.

    Args:
        project_id: 프로젝트 ID
        user_input: 추가/수정할 요구사항
        current_user: 현재 로그인한 사용자
        db: 데이터베이스 세션

    Returns:
        업데이트된 Brief 데이터
    """
    # 프로젝트 조회
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.owner_id == current_user.id,
        Project.deleted_at.is_(None)
    ).first()

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="프로젝트를 찾을 수 없습니다"
        )

    # Brief 생성 API 호출 (project_id 포함하여 저장)
    return await generate_brief(
        user_input=user_input,
        project_type=project.project_type,
        brand_id=project.brand_id,
        project_id=project_id,
        current_user=current_user,
        db=db
    )
