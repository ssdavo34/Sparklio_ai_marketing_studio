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
from app.models.brand import Brand
from app.schemas.agent import A2ARequest, A2AResponse, SystemContext
from app.agents.brief import BriefAgent
from app.agents.brand_agent import BrandAgent
from app.agents.strategist import StrategistAgent
from app.agents.copywriter import CopywriterAgent
from app.agents.vision_generator import VisionGeneratorAgent
from app.agents.reviewer import ReviewerAgent

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


@router.get("/brand/analyze/{brand_id}", response_model=dict)
async def analyze_brand(
    brand_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    브랜드 분석 API

    브랜드 정보와 BrandKit을 분석하여 마케팅 가이드를 생성합니다.

    Args:
        brand_id: 브랜드 ID
        current_user: 현재 로그인한 사용자
        db: 데이터베이스 세션

    Returns:
        BrandKit 데이터 + 브랜드 분석 결과
    """
    try:
        # 브랜드 조회 (권한 확인)
        brand = db.query(Brand).filter(
            Brand.id == brand_id,
            Brand.owner_id == current_user.id,
            Brand.deleted_at.is_(None)
        ).first()

        if not brand:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="브랜드를 찾을 수 없거나 접근 권한이 없습니다"
            )

        # BrandAgent 초기화
        brand_agent = BrandAgent()

        # A2A 요청 생성
        system_context = SystemContext(
            brand_id=str(brand_id),
            project_id=None,
            user_id=str(current_user.id),
            task_type="brand_analysis",
            risk_level="low"
        )

        request = A2ARequest(
            request_id=f"brand_{brand_id}",
            source_agent="API",
            target_agent="BrandAgent",
            system_context=system_context,
            payload={
                "db_session": db
            }
        )

        # Agent 실행
        logger.info(f"[API] Executing BrandAgent for brand_id={brand_id}")
        response = await brand_agent.execute(request)

        if response.status != "success":
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"브랜드 분석 실패: {response.error}"
            )

        return {
            "success": True,
            "brand": response.result,
            "metadata": response.metadata
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[API] Error in analyze_brand: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"브랜드 분석 중 오류 발생: {str(e)}"
        )


@router.post("/strategy/generate", response_model=dict)
async def generate_strategy(
    brief: dict,
    brand_id: UUID = None,
    project_id: UUID = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    마케팅 전략 생성 API

    Brief와 BrandKit을 기반으로 실행 가능한 마케팅 전략을 생성합니다.

    Args:
        brief: Brief 데이터 (goal, target_audience, budget 등)
        brand_id: 브랜드 ID (optional, BrandKit 조회 시 사용)
        project_id: 프로젝트 ID (optional)
        current_user: 현재 로그인한 사용자
        db: 데이터베이스 세션

    Returns:
        생성된 마케팅 전략
    """
    try:
        # BrandKit 조회 (brand_id가 제공된 경우)
        brand_kit = {}
        brand_analysis = {}

        if brand_id:
            brand = db.query(Brand).filter(
                Brand.id == brand_id,
                Brand.owner_id == current_user.id,
                Brand.deleted_at.is_(None)
            ).first()

            if brand:
                brand_kit = brand.brand_kit or {}

                # BrandAgent를 사용하여 브랜드 분석 (선택적)
                brand_agent = BrandAgent()
                brand_system_context = SystemContext(
                    brand_id=str(brand_id),
                    project_id=str(project_id) if project_id else None,
                    user_id=str(current_user.id),
                    task_type="brand_analysis",
                    risk_level="low"
                )

                brand_request = A2ARequest(
                    request_id=f"brand_{brand_id}",
                    source_agent="API",
                    target_agent="BrandAgent",
                    system_context=brand_system_context,
                    payload={"db_session": db}
                )

                brand_response = await brand_agent.execute(brand_request)
                if brand_response.status == "success":
                    brand_analysis = brand_response.result.get("brand_analysis", {})

        # StrategistAgent 초기화
        strategist_agent = StrategistAgent()

        # A2A 요청 생성
        system_context = SystemContext(
            brand_id=str(brand_id) if brand_id else None,
            project_id=str(project_id) if project_id else None,
            user_id=str(current_user.id),
            task_type="strategy_generation",
            risk_level="low"
        )

        request = A2ARequest(
            request_id=f"strategy_{current_user.id}",
            source_agent="API",
            target_agent="StrategistAgent",
            system_context=system_context,
            payload={
                "brief": brief,
                "brand_kit": brand_kit,
                "brand_analysis": brand_analysis
            }
        )

        # Agent 실행
        logger.info(f"[API] Executing StrategistAgent for user={current_user.username}")
        response = await strategist_agent.execute(request)

        if response.status != "success":
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"전략 생성 실패: {response.error}"
            )

        return {
            "success": True,
            "strategy": response.result["strategy"],
            "confidence": response.result.get("confidence", 0.0),
            "brief_summary": response.result.get("brief_summary", {}),
            "metadata": response.metadata
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[API] Error in generate_strategy: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"전략 생성 중 오류 발생: {str(e)}"
        )


@router.post("/copy/generate", response_model=dict)
async def generate_copy(
    brief: dict,
    strategy: dict = None,
    brand_voice: str = "professional",
    channel: str = "general",
    copy_type: str = "general",
    max_length: int = None,
    variants_count: int = 2,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    마케팅 카피 생성 API

    Brief와 전략을 기반으로 채널별 최적화된 마케팅 카피를 생성합니다.

    Args:
        brief: Brief 데이터 (goal, target_audience 등)
        strategy: 마케팅 전략 (optional)
        brand_voice: 브랜드 보이스 (professional, friendly, energetic 등)
        channel: 채널 (twitter, instagram, facebook, linkedin, blog, email, ad, general)
        copy_type: 카피 타입 (headline, body, cta, general)
        max_length: 최대 길이 제한 (optional, 채널별 기본값 사용)
        variants_count: 생성할 변형 개수 (기본 2개)
        current_user: 현재 로그인한 사용자
        db: 데이터베이스 세션

    Returns:
        생성된 마케팅 카피 및 변형
    """
    try:
        # 전략이 제공되지 않은 경우 기본 전략 사용
        if not strategy:
            strategy = {
                "objectives": brief.get("key_messages", []),
                "key_messages": brief.get("key_messages", []),
                "target_audience": {
                    "primary": brief.get("target_audience", "")
                }
            }

        # CopywriterAgent 초기화
        copywriter_agent = CopywriterAgent()

        # A2A 요청 생성
        system_context = SystemContext(
            brand_id=None,
            project_id=None,
            user_id=str(current_user.id),
            task_type="copy_generation",
            risk_level="low"
        )

        request = A2ARequest(
            request_id=f"copy_{current_user.id}",
            source_agent="API",
            target_agent="CopywriterAgent",
            system_context=system_context,
            payload={
                "brief": brief,
                "strategy": strategy,
                "brand_voice": brand_voice,
                "channel": channel,
                "copy_type": copy_type,
                "max_length": max_length,
                "variants_count": variants_count
            }
        )

        # Agent 실행
        logger.info(f"[API] Executing CopywriterAgent for user={current_user.username}, channel={channel}, type={copy_type}")
        response = await copywriter_agent.execute(request)

        if response.status != "success":
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"카피 생성 실패: {response.error}"
            )

        return {
            "success": True,
            "primary_copy": response.result["primary_copy"],
            "variants": response.result["variants"],
            "channel": response.result["channel"],
            "copy_type": response.result["copy_type"],
            "brand_voice": response.result["brand_voice"],
            "tone_match_score": response.result.get("tone_match_score", 0.0),
            "metadata": response.metadata
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[API] Error in generate_copy: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"카피 생성 중 오류 발생: {str(e)}"
        )


@router.post("/vision/generate", response_model=dict)
async def generate_vision(
    brief: dict,
    copy_text: str = "",
    brand_id: UUID = None,
    project_id: UUID = None,
    style: str = "modern",
    aspect_ratio: str = "1:1",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    마케팅 이미지 생성 API

    Brief와 카피를 기반으로 ComfyUI를 사용하여 이미지를 생성합니다.

    Args:
        brief: Brief 데이터 (goal, target_audience 등)
        copy_text: 마케팅 카피 (optional)
        brand_id: 브랜드 ID (optional, 브랜드 컬러 조회 시 사용)
        project_id: 프로젝트 ID (optional)
        style: 이미지 스타일 (modern, minimalist, vibrant, professional 등)
        aspect_ratio: 비율 (1:1, 16:9, 9:16, 4:3, 3:4)
        current_user: 현재 로그인한 사용자
        db: 데이터베이스 세션

    Returns:
        생성된 이미지 URL 및 정보
    """
    try:
        # 브랜드 컬러 조회 (brand_id가 제공된 경우)
        brand_colors = {}

        if brand_id:
            brand = db.query(Brand).filter(
                Brand.id == brand_id,
                Brand.owner_id == current_user.id,
                Brand.deleted_at.is_(None)
            ).first()

            if brand and brand.brand_kit:
                brand_colors = brand.brand_kit.get("colors", {})

        # VisionGeneratorAgent 초기화
        vision_agent = VisionGeneratorAgent()

        # A2A 요청 생성
        system_context = SystemContext(
            brand_id=str(brand_id) if brand_id else None,
            project_id=str(project_id) if project_id else None,
            user_id=str(current_user.id),
            task_type="image_generation",
            risk_level="low"
        )

        request = A2ARequest(
            request_id=f"vision_{current_user.id}",
            source_agent="API",
            target_agent="VisionGeneratorAgent",
            system_context=system_context,
            payload={
                "brief": brief,
                "copy": copy_text,
                "style": style,
                "aspect_ratio": aspect_ratio,
                "brand_colors": brand_colors,
                "db_session": db
            }
        )

        # Agent 실행
        logger.info(f"[API] Executing VisionGeneratorAgent for user={current_user.username}, style={style}")
        response = await vision_agent.execute(request)

        if response.status != "success":
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"이미지 생성 실패: {response.error}"
            )

        return {
            "success": True,
            "image_urls": response.result["image_urls"],
            "asset_ids": response.result["asset_ids"],
            "prompt_used": response.result["prompt_used"],
            "comfyui_prompt_id": response.result["comfyui_prompt_id"],
            "image_count": response.result["image_count"],
            "style": response.result["style"],
            "aspect_ratio": response.result["aspect_ratio"],
            "metadata": response.metadata
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[API] Error in generate_vision: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"이미지 생성 중 오류 발생: {str(e)}"
        )


@router.post("/review/content", response_model=dict)
async def review_content(
    brief: dict,
    generated_content: dict,
    content_type: str = "copy",
    brand_id: UUID = None,
    strict_mode: bool = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    생성된 콘텐츠 품질 검토 API

    Brief와 BrandKit을 기준으로 생성된 콘텐츠의 품질을 평가합니다.

    Args:
        brief: Brief 데이터 (goal, target_audience 등)
        generated_content: 검토할 콘텐츠 (copy, strategy, image 등)
        content_type: 콘텐츠 타입 (copy, strategy, image)
        brand_id: 브랜드 ID (optional, BrandKit 조회 시 사용)
        strict_mode: 엄격한 검토 모드 (90% 이상 필요, 기본 False)
        current_user: 현재 로그인한 사용자
        db: 데이터베이스 세션

    Returns:
        검토 결과 (점수, 피드백, 승인 여부)
    """
    try:
        # BrandKit 조회 (brand_id가 제공된 경우)
        brand_kit = {}

        if brand_id:
            brand = db.query(Brand).filter(
                Brand.id == brand_id,
                Brand.owner_id == current_user.id,
                Brand.deleted_at.is_(None)
            ).first()

            if brand and brand.brand_kit:
                brand_kit = brand.brand_kit

        # ReviewerAgent 초기화
        reviewer_agent = ReviewerAgent()

        # A2A 요청 생성
        system_context = SystemContext(
            brand_id=str(brand_id) if brand_id else None,
            project_id=None,
            user_id=str(current_user.id),
            task_type="content_review",
            risk_level="low"
        )

        request = A2ARequest(
            request_id=f"review_{current_user.id}",
            source_agent="API",
            target_agent="ReviewerAgent",
            system_context=system_context,
            payload={
                "brief": brief,
                "generated_content": generated_content,
                "content_type": content_type,
                "brand_kit": brand_kit,
                "strict_mode": strict_mode
            }
        )

        # Agent 실행
        logger.info(f"[API] Executing ReviewerAgent for user={current_user.username}, type={content_type}, strict={strict_mode}")
        response = await reviewer_agent.execute(request)

        if response.status != "success":
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"콘텐츠 검토 실패: {response.error}"
            )

        return {
            "success": True,
            "overall_score": response.result["overall_score"],
            "scores": response.result["scores"],
            "brief_alignment": response.result["brief_alignment"],
            "brand_compliance": response.result["brand_compliance"],
            "feedback": response.result["feedback"],
            "suggestions": response.result["suggestions"],
            "approved": response.result["approved"],
            "approval_reason": response.result["approval_reason"],
            "issues": response.result["issues"],
            "metadata": response.metadata
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[API] Error in review_content: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"콘텐츠 검토 중 오류 발생: {str(e)}"
        )
