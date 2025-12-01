"""
Video Pipeline V2 API

PLAN/RENDER 2단계 플로우 기반 비디오 생성 API

작성일: 2025-11-30
작성자: B팀 (Backend)
참조: docs/VIDEO_PIPELINE_DESIGN_V2.md

엔드포인트:
- POST /api/v1/video6/projects - 프로젝트 생성
- POST /api/v1/video6/{project_id}/plan - PLAN 모드 실행
- PUT /api/v1/video6/{project_id}/plan - 유저 수정본 저장
- POST /api/v1/video6/{project_id}/render - RENDER 모드 실행
- GET /api/v1/video6/{project_id}/status - 상태 조회
- GET /api/v1/video6/{project_id}/assets - Asset Pool 조회

저장소: project_outputs 테이블 (output_type='video')
"""

import logging
from typing import Optional, List
from uuid import UUID, uuid4
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field

from app.core.database import get_db
from app.models.project_output import ProjectOutput
from app.schemas.video_timeline import (
    VideoDirectorMode,
    VideoGenerationMode,
    VideoProjectStatus,
    ScriptStatus,
    ImageApprovalStatus,
    VideoPlanDraftV1,
    SceneDraft,
    VideoPlanRequest,
    VideoPlanResponse,
    VideoRenderRequest,
    VideoRenderResponse,
    VideoStatusResponse,
    VideoProjectCreateRequest,
    VideoProjectCreateResponse,
    RenderMode,
    VideoRenderError,
    # Step 1: Script
    ScriptApproveRequest,
    ScriptApproveResponse,
    # Step 2: Images
    ImageGenerateRequest,
    ImageGenerateResponse,
    ImageApproveRequest,
    ImageApproveResponse,
    SceneImageApproval,
    ImageRegenerateRequest,
    ImageRegenerateResponse,
    # Step 3: Motion
    MotionGenerateRequest,
    MotionGenerateResponse,
    MotionApproveRequest,
    MotionApproveResponse,
    SceneMotionApproval,
    MotionRegenerateRequest,
    MotionRegenerateResponse,
)
from app.services.video.cost_guard import get_cost_guard
from app.services.agents.video_director import (
    get_video_director_agent,
    VideoDirectorInputV3,
)
from app.services.agents.base import AgentRequest
from app.services.llm import get_gateway as get_llm_gateway
from app.services.media import get_media_gateway

logger = logging.getLogger(__name__)

router = APIRouter()


# =============================================================================
# DB Helper Functions
# =============================================================================

def _get_project_from_db(db: Session, video_project_id: str) -> ProjectOutput:
    """DB에서 프로젝트 조회"""
    # video_project_id는 source_metadata.video_project_id에 저장됨
    project = db.query(ProjectOutput).filter(
        ProjectOutput.output_type == 'video',
        ProjectOutput.source_metadata['video_project_id'].astext == video_project_id
    ).first()

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Video project not found: {video_project_id}"
        )
    return project


def _get_project_data(project: ProjectOutput) -> dict:
    """ProjectOutput을 dict로 변환"""
    source_meta = project.source_metadata or {}
    output_meta = project.output_metadata or {}

    return {
        "video_project_id": source_meta.get("video_project_id"),
        "brand_id": str(project.brand_id) if project.brand_id else None,
        "project_id": str(project.project_id) if project.project_id else None,
        "name": project.name,
        "status": source_meta.get("status", "not_started"),
        "script_status": source_meta.get("script_status", "draft"),
        "plan_draft": source_meta.get("plan_draft"),
        "video_url": project.file_url,
        "thumbnail_url": project.thumbnail_url,
        "duration_sec": project.duration_sec,
        "error_message": source_meta.get("error_message"),
        "created_at": project.created_at.isoformat() if project.created_at else None,
        "updated_at": project.updated_at.isoformat() if project.updated_at else None,
    }


def _update_project_in_db(db: Session, project: ProjectOutput, updates: dict):
    """DB에서 프로젝트 업데이트"""
    from sqlalchemy.orm.attributes import flag_modified

    source_meta = dict(project.source_metadata or {})  # 복사본 생성

    # source_metadata 업데이트 항목
    meta_fields = ["status", "script_status", "plan_draft", "error_message", "render_job_id"]
    for field in meta_fields:
        if field in updates:
            source_meta[field] = updates[field]

    project.source_metadata = source_meta
    flag_modified(project, "source_metadata")  # JSONB 변경 감지

    # 직접 컬럼 업데이트 항목
    if "video_url" in updates:
        project.file_url = updates["video_url"]
    if "thumbnail_url" in updates:
        project.thumbnail_url = updates["thumbnail_url"]
    if "duration_sec" in updates:
        project.duration_sec = updates["duration_sec"]

    db.commit()
    db.refresh(project)


# =============================================================================
# API Endpoints
# =============================================================================

@router.post("/projects", response_model=VideoProjectCreateResponse, status_code=status.HTTP_201_CREATED)
async def create_video_project(
    request: VideoProjectCreateRequest,
    db: Session = Depends(get_db)
):
    """
    비디오 프로젝트 생성

    새로운 비디오 프로젝트를 생성하고 ID를 반환합니다.
    DB(project_outputs 테이블)에 저장됩니다.
    """
    video_project_id = f"vp_{uuid4().hex[:8]}"

    # user_id가 없으면 기존 테스트 사용자 조회 (회원 시스템 구현 전 임시)
    user_id = request.user_id
    if not user_id:
        from app.models.user import User
        test_user = db.query(User).first()
        if test_user:
            user_id = test_user.id
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No users found. Please create a user first."
            )

    # ProjectOutput 생성
    project = ProjectOutput(
        brand_id=request.brand_id,
        project_id=request.project_id,
        user_id=user_id,
        output_type='video',
        name=request.name or f"Video Project {video_project_id}",
        status='draft',  # ProjectOutput status
        source='video_pipeline_v2',
        source_metadata={
            "video_project_id": video_project_id,
            "concept_board_id": request.concept_board_id,
            "status": VideoProjectStatus.NOT_STARTED.value,
            "script_status": ScriptStatus.DRAFT.value,
            "plan_draft": None,
        },
        output_metadata={
            "generation_mode": None,
            "scenes_count": 0,
        }
    )

    db.add(project)
    db.commit()
    db.refresh(project)

    logger.info(f"[VideoPipeline] Created project: {video_project_id}, db_id={project.id}")

    return VideoProjectCreateResponse(
        video_project_id=video_project_id,
        status=VideoProjectStatus.NOT_STARTED,
        created_at=project.created_at.isoformat()
    )


@router.post("/{video_project_id}/plan", response_model=VideoPlanResponse)
async def execute_plan_mode(
    video_project_id: str,
    request: VideoPlanRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    PLAN 모드 실행

    LLM을 사용하여 스토리보드/스크립트 초안을 생성합니다.
    GPU/API 비용이 들지 않습니다.

    Parameters:
    - mode: 이미지 생성 모드 (reuse, hybrid, creative)
    - concept_board_id: 컨셉보드 ID (선택)
    - available_assets: 재사용 가능한 이미지 ID 목록
    - total_duration_sec: 목표 영상 길이 (초)
    - music_mood: 음악 분위기

    Returns:
    - plan_draft: VideoPlanDraftV1 (유저 수정 가능한 초안)
    - estimated_render_cost: 예상 렌더링 비용
    - estimated_render_time_sec: 예상 렌더링 시간
    """
    project = _get_project_from_db(db, video_project_id)
    project_data = _get_project_data(project)

    # 상태 체크
    if project_data["status"] == VideoProjectStatus.RENDERING.value:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Project is currently rendering"
        )

    # 상태 업데이트
    _update_project_in_db(db, project, {"status": VideoProjectStatus.PLANNING.value})

    try:
        # VideoDirector V3 호출
        llm_gateway = get_llm_gateway()
        media_gateway = get_media_gateway()

        director = get_video_director_agent(
            llm_gateway=llm_gateway,
            media_gateway=media_gateway
        )

        # 컨셉 정보 구성 (MVP: 기본값 사용)
        concept = {
            "concept_name": project_data.get("name", "Marketing Video"),
            "concept_description": "Short-form marketing video",
            "target_audience": "General audience",
            "tone_and_manner": "Professional",
            "visual_style": "Modern"
        }

        input_data = VideoDirectorInputV3(
            mode=VideoDirectorMode.PLAN,
            generation_mode=request.mode,
            concept=concept,
            concept_board_id=request.concept_board_id,
            available_assets=request.available_assets,
            target_duration=request.total_duration_sec,
            music_mood=request.music_mood,
            style="dynamic"
        )

        response = await director.execute_v3(AgentRequest(
            task="video_plan",
            payload=input_data.model_dump()
        ))

        result = response.outputs[0].value

        if result.get("status") == VideoProjectStatus.FAILED.value:
            _update_project_in_db(db, project, {"status": VideoProjectStatus.FAILED.value})
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=result.get("error_message", "PLAN mode failed")
            )

        # 플랜 저장
        plan_draft = result.get("plan_draft")
        if plan_draft:
            # project_id와 mode를 저장
            plan_draft["project_id"] = video_project_id
            plan_draft["mode"] = request.mode.value  # RENDER 시 이미지 생성 모드 결정에 필요

        _update_project_in_db(db, project, {
            "status": VideoProjectStatus.SCRIPT_READY.value,
            "plan_draft": plan_draft,
            "script_status": ScriptStatus.DRAFT.value
        })

        # output_metadata 업데이트
        project.output_metadata = {
            **(project.output_metadata or {}),
            "generation_mode": request.mode.value,
            "scenes_count": len(plan_draft.get("scenes", [])) if plan_draft else 0,
        }
        db.commit()

        logger.info(f"[VideoPipeline] PLAN complete: {video_project_id}")

        return VideoPlanResponse(
            project_id=video_project_id,
            plan_draft=VideoPlanDraftV1(**plan_draft) if plan_draft else None,
            estimated_render_cost=result.get("estimated_render_cost"),
            estimated_render_time_sec=result.get("estimated_render_time_sec")
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[VideoPipeline] PLAN failed: {e}")
        _update_project_in_db(db, project, {"status": VideoProjectStatus.FAILED.value})
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.put("/{video_project_id}/plan", response_model=VideoPlanResponse)
async def update_plan_draft(
    video_project_id: str,
    plan_draft: VideoPlanDraftV1,
    db: Session = Depends(get_db)
):
    """
    유저 수정본 저장

    유저가 수정한 플랜을 저장합니다.
    RENDER 실행 전에 호출해야 합니다.
    """
    project = _get_project_from_db(db, video_project_id)
    project_data = _get_project_data(project)

    # 상태 체크
    if project_data["status"] not in [
        VideoProjectStatus.SCRIPT_READY.value,
        VideoProjectStatus.NOT_STARTED.value
    ]:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Cannot update plan in status: {project_data['status']}"
        )

    # project_id 확인
    plan_draft.project_id = video_project_id
    plan_draft.script_status = ScriptStatus.USER_EDITED

    # 저장
    _update_project_in_db(db, project, {
        "plan_draft": plan_draft.model_dump(),
        "script_status": ScriptStatus.USER_EDITED.value
    })

    logger.info(f"[VideoPipeline] Plan updated: {video_project_id}")

    return VideoPlanResponse(
        project_id=video_project_id,
        plan_draft=plan_draft
    )


@router.post("/{video_project_id}/render", response_model=VideoRenderResponse)
async def execute_render_mode(
    video_project_id: str,
    background_tasks: BackgroundTasks,
    request: Optional[VideoRenderRequest] = None,
    db: Session = Depends(get_db)
):
    """
    RENDER 모드 실행

    GPU/API를 사용하여 실제 영상을 생성합니다.

    Parameters:
    - plan_draft: 유저가 수정한 플랜 (선택, 없으면 저장된 플랜 사용)
    - render_mode: 렌더 모드 (mock/real) - 기본값: mock
    - dry_run: True면 비용만 계산하고 실제 렌더하지 않음

    Returns:
    - job_id: 렌더링 작업 ID
    - status: 현재 상태 (rendering)
    - render_mode: 실제 사용된 렌더 모드
    - estimated_cost: 예상 비용 ($)
    - estimated_time_sec: 예상 소요 시간

    Cost Guard:
    - render_mode="real" 요청 시 VIDEO_ALLOW_REAL 환경변수 확인
    - 일일 비용 한도 (RENDER_DAILY_COST_LIMIT) 체크
    """
    project = _get_project_from_db(db, video_project_id)
    project_data = _get_project_data(project)

    # 상태 체크
    if project_data["status"] == VideoProjectStatus.RENDERING.value:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Project is already rendering"
        )

    # 플랜 확인
    plan_draft_data = request.plan_draft.model_dump() if request and request.plan_draft else project_data.get("plan_draft")

    if not plan_draft_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No plan draft available. Run PLAN mode first."
        )

    # 렌더 모드 결정 (요청 값 또는 기본값)
    render_mode = request.render_mode if request else RenderMode.MOCK
    dry_run = request.dry_run if request else False

    # VideoPlanDraftV1 객체로 변환
    plan_draft = VideoPlanDraftV1(**plan_draft_data)

    # ========== Cost Guard 체크 ==========
    cost_guard = get_cost_guard()

    # 비용 한도 체크
    check_result = await cost_guard.check_cost_limit(
        plan_draft=plan_draft,
        render_mode=render_mode,
        provider="veo",  # 기본 Provider
        brand_id=str(project.brand_id) if project.brand_id else None,
    )

    if not check_result.allowed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error_code": check_result.error_code.value if check_result.error_code else "unknown",
                "message": check_result.error_message,
                "daily_cost_used": check_result.daily_cost_used,
                "daily_cost_limit": check_result.daily_cost_limit,
            }
        )

    # 비용 추정
    cost_estimate = cost_guard.estimate_cost(plan_draft, render_mode, "veo")

    # dry_run 모드: 비용만 계산하고 반환
    if dry_run:
        logger.info(f"[VideoPipeline] dry_run mode: {video_project_id}")
        return VideoRenderResponse(
            job_id="dry_run",
            status=VideoProjectStatus.RENDER_QUEUED,
            render_mode=render_mode,
            estimated_time_sec=cost_estimate.estimated_time_sec,
            estimated_cost=cost_estimate.total_cost,
            dry_run=True,
            cost_breakdown=cost_estimate.breakdown,
            daily_cost_used=check_result.daily_cost_used,
            daily_cost_limit=check_result.daily_cost_limit,
        )
    # ========== Cost Guard 체크 끝 ==========

    # 플랜 상태를 approved로 변경
    plan_draft_data["script_status"] = ScriptStatus.APPROVED.value

    # 렌더링 작업 ID 생성
    job_id = f"job_{uuid4().hex[:8]}"

    # 상태 업데이트
    _update_project_in_db(db, project, {
        "status": VideoProjectStatus.RENDER_QUEUED.value,
        "plan_draft": plan_draft_data,
        "script_status": ScriptStatus.APPROVED.value,
        "render_job_id": job_id,
        "render_mode": render_mode.value,
    })

    # 백그라운드에서 렌더링 실행 (DB ID 전달)
    background_tasks.add_task(
        _execute_render_background,
        str(project.id),
        video_project_id,
        plan_draft_data,
        project_data.get("name", "Marketing Video"),
        render_mode.value,
    )

    logger.info(f"[VideoPipeline] RENDER started: {video_project_id}, job_id={job_id}, mode={render_mode.value}")

    return VideoRenderResponse(
        job_id=job_id,
        status=VideoProjectStatus.RENDER_QUEUED,
        render_mode=render_mode,
        estimated_time_sec=cost_estimate.estimated_time_sec,
        estimated_cost=cost_estimate.total_cost,
        dry_run=False,
        daily_cost_used=check_result.daily_cost_used,
        daily_cost_limit=check_result.daily_cost_limit,
    )


async def _execute_render_background(
    db_id: str,
    video_project_id: str,
    plan_draft_data: dict,
    project_name: str,
    render_mode: str = "mock"
):
    """백그라운드 렌더링 실행"""
    from app.core.database import SessionLocal

    # ============ DEBUG V4: 백그라운드 태스크 진입 확인 ============
    print(f"!!! _execute_render_background CALLED !!! video_project_id={video_project_id}")
    logger.info(f"[VideoPipeline] === RENDER BACKGROUND START ===")
    logger.info(f"[VideoPipeline] db_id={db_id}, video_project_id={video_project_id}")
    logger.info(f"[VideoPipeline] plan_draft_data.mode={plan_draft_data.get('mode')}")
    logger.info(f"[VideoPipeline] plan_draft_data.scenes count={len(plan_draft_data.get('scenes', []))}")

    # 씬별 generate_new_image 확인
    scenes = plan_draft_data.get("scenes", [])
    generate_new_count = sum(1 for s in scenes if s.get("generate_new_image"))
    logger.info(f"[VideoPipeline] scenes with generate_new_image=True: {generate_new_count}")
    # ============ DEBUG V4 END ============

    db = SessionLocal()
    try:
        project = db.query(ProjectOutput).filter(ProjectOutput.id == db_id).first()
        if not project:
            logger.error(f"[VideoPipeline] Project not found in DB: {db_id}")
            return

        llm_gateway = get_llm_gateway()
        media_gateway = get_media_gateway()

        director = get_video_director_agent(
            llm_gateway=llm_gateway,
            media_gateway=media_gateway
        )

        # 컨셉 정보 구성
        concept = {
            "concept_name": project_name,
            "concept_description": "Short-form marketing video",
            "target_audience": "General audience",
            "tone_and_manner": "Professional",
            "visual_style": "Modern"
        }

        # generation_mode 결정
        mode_str = plan_draft_data.get("mode", "hybrid")
        logger.info(f"[VideoPipeline] Creating VideoDirectorInputV3 with generation_mode={mode_str}")
        print(f"!!! generation_mode from plan_draft_data: {mode_str} !!!")

        input_data = VideoDirectorInputV3(
            mode=VideoDirectorMode.RENDER,
            generation_mode=VideoGenerationMode(mode_str),
            concept=concept,
            plan_draft=VideoPlanDraftV1(**plan_draft_data)
        )

        response = await director.execute_v3(AgentRequest(
            task="video_render",
            payload=input_data.model_dump()
        ))

        result = response.outputs[0].value

        if result.get("status") == VideoProjectStatus.FAILED.value:
            _update_project_in_db(db, project, {
                "status": VideoProjectStatus.FAILED.value,
                "error_message": result.get("error_message")
            })
        else:
            # 성공 시 ProjectOutput 업데이트
            project.status = 'active'
            project.file_url = result.get("video_url")
            project.thumbnail_url = result.get("thumbnail_url")
            project.duration_sec = result.get("duration_sec")
            project.completed_at = datetime.utcnow()

            _update_project_in_db(db, project, {
                "status": VideoProjectStatus.COMPLETED.value
            })

        logger.info(f"[VideoPipeline] RENDER complete: {video_project_id}")

    except Exception as e:
        logger.error(f"[VideoPipeline] RENDER failed: {video_project_id}, error={e}")
        try:
            project = db.query(ProjectOutput).filter(ProjectOutput.id == db_id).first()
            if project:
                _update_project_in_db(db, project, {
                    "status": VideoProjectStatus.FAILED.value,
                    "error_message": str(e)
                })
        except Exception:
            pass
    finally:
        db.close()


@router.get("/{video_project_id}/status", response_model=VideoStatusResponse)
async def get_project_status(
    video_project_id: str,
    db: Session = Depends(get_db)
):
    """
    프로젝트 상태 조회

    현재 프로젝트의 상태와 결과를 반환합니다.

    Returns:
    - status: 프로젝트 상태 (not_started, planning, plan_ready, rendering, completed, failed)
    - plan_draft: 플랜 초안 (있으면)
    - video_url: 완성된 영상 URL (completed 상태에서)
    - thumbnail_url: 썸네일 URL (completed 상태에서)
    """
    project = _get_project_from_db(db, video_project_id)
    project_data = _get_project_data(project)

    plan_draft = None
    if project_data.get("plan_draft"):
        try:
            plan_draft = VideoPlanDraftV1(**project_data["plan_draft"])
        except Exception:
            pass

    return VideoStatusResponse(
        project_id=video_project_id,
        status=VideoProjectStatus(project_data["status"]),
        script_status=ScriptStatus(project_data.get("script_status", "draft")),
        plan_draft=plan_draft,
        video_url=project_data.get("video_url"),
        thumbnail_url=project_data.get("thumbnail_url"),
        duration_sec=project_data.get("duration_sec"),
        error_message=project_data.get("error_message")
    )


@router.get("/{video_project_id}/assets")
async def get_asset_pool(
    video_project_id: str,
    db: Session = Depends(get_db)
):
    """
    Asset Pool 조회

    프로젝트에서 사용 가능한 이미지 목록을 반환합니다.

    TODO: ConceptBoard 연동 후 실제 에셋 조회 구현
    """
    from app.models.asset import GeneratedAsset

    project = _get_project_from_db(db, video_project_id)

    # brand_id로 GeneratedAsset 조회
    assets = db.query(GeneratedAsset).filter(
        GeneratedAsset.brand_id == project.brand_id,
        GeneratedAsset.type == 'image',
        GeneratedAsset.status == 'active'
    ).order_by(GeneratedAsset.created_at.desc()).limit(50).all()

    return {
        "video_project_id": video_project_id,
        "assets": [
            {
                "id": str(a.id),
                "url": a.preview_url or a.original_url or a.minio_path,
                "thumb_url": a.thumb_url,
                "name": a.name,
            }
            for a in assets
        ],
        "total": len(assets),
    }


# =============================================================================
# Step 1: Script Approve API
# =============================================================================

@router.post("/{video_project_id}/script/approve", response_model=ScriptApproveResponse)
async def approve_script(
    video_project_id: str,
    request: ScriptApproveRequest,
    db: Session = Depends(get_db)
):
    """
    Step 1: 스크립트 승인

    유저가 확인/수정한 스크립트를 승인하고 이미지 생성 단계로 진행합니다.
    """
    project = _get_project_from_db(db, video_project_id)
    project_data = _get_project_data(project)

    # 상태 체크
    if project_data["status"] not in [
        VideoProjectStatus.SCRIPT_READY.value,
        VideoProjectStatus.NOT_STARTED.value
    ]:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Cannot approve script in status: {project_data['status']}"
        )

    # 플랜 업데이트
    plan_draft_data = request.plan_draft.model_dump()
    plan_draft_data["script_status"] = ScriptStatus.APPROVED.value
    plan_draft_data["project_id"] = video_project_id

    _update_project_in_db(db, project, {
        "status": VideoProjectStatus.SCRIPT_APPROVED.value,
        "plan_draft": plan_draft_data,
        "script_status": ScriptStatus.APPROVED.value
    })

    logger.info(f"[VideoPipeline] Script approved: {video_project_id}")

    return ScriptApproveResponse(
        project_id=video_project_id,
        status=VideoProjectStatus.SCRIPT_APPROVED,
        message="스크립트가 승인되었습니다. 이미지 생성을 시작합니다."
    )


# =============================================================================
# Step 2: Images Generate/Approve/Regenerate APIs
# =============================================================================

@router.post("/{video_project_id}/images/generate", response_model=ImageGenerateResponse)
async def generate_images(
    video_project_id: str,
    request: ImageGenerateRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Step 2: 이미지 생성 시작

    스크립트 승인 후 각 씬의 이미지를 생성합니다.
    generate_new_image=True인 씬만 새로 생성됩니다.
    """
    project = _get_project_from_db(db, video_project_id)
    project_data = _get_project_data(project)

    # 상태 체크
    if project_data["status"] not in [
        VideoProjectStatus.SCRIPT_APPROVED.value,
        VideoProjectStatus.IMAGES_READY.value,  # 재생성 허용
    ]:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Cannot generate images in status: {project_data['status']}"
        )

    # 상태 업데이트
    _update_project_in_db(db, project, {
        "status": VideoProjectStatus.GENERATING_IMAGES.value,
        "plan_draft": request.plan_draft.model_dump()
    })

    # 백그라운드에서 이미지 생성
    background_tasks.add_task(
        _generate_images_background,
        str(project.id),
        video_project_id,
        request.plan_draft.model_dump()
    )

    logger.info(f"[VideoPipeline] Image generation started: {video_project_id}")

    return ImageGenerateResponse(
        project_id=video_project_id,
        status=VideoProjectStatus.GENERATING_IMAGES,
        plan_draft=request.plan_draft,
        message="이미지 생성을 시작합니다."
    )


async def _generate_images_background(
    db_id: str,
    video_project_id: str,
    plan_draft_data: dict
):
    """백그라운드 이미지 생성"""
    from app.core.database import SessionLocal

    logger.info(f"[VideoPipeline] === IMAGE GENERATION START ===")

    db = SessionLocal()
    try:
        project = db.query(ProjectOutput).filter(ProjectOutput.id == db_id).first()
        if not project:
            logger.error(f"[VideoPipeline] Project not found: {db_id}")
            return

        media_gateway = get_media_gateway()
        scenes = plan_draft_data.get("scenes", [])

        # generate_new_image=True인 씬만 생성
        for scene in scenes:
            if scene.get("generate_new_image") and scene.get("image_prompt"):
                try:
                    result = await media_gateway.generate_image(
                        prompt=scene["image_prompt"],
                        width=1080,
                        height=1920,
                    )
                    scene["image_url"] = result.get("url") or result.get("base64")
                    scene["image_approval_status"] = ImageApprovalStatus.GENERATED.value
                    scene["generation_attempts"] = scene.get("generation_attempts", 0) + 1
                    logger.info(f"[VideoPipeline] Scene {scene['scene_index']} image generated")
                except Exception as e:
                    logger.error(f"[VideoPipeline] Scene {scene['scene_index']} image failed: {e}")
                    scene["image_approval_status"] = ImageApprovalStatus.PENDING.value

        # 상태 업데이트
        plan_draft_data["scenes"] = scenes
        _update_project_in_db(db, project, {
            "status": VideoProjectStatus.IMAGES_READY.value,
            "plan_draft": plan_draft_data
        })

        logger.info(f"[VideoPipeline] Image generation complete: {video_project_id}")

    except Exception as e:
        logger.error(f"[VideoPipeline] Image generation failed: {e}")
        try:
            project = db.query(ProjectOutput).filter(ProjectOutput.id == db_id).first()
            if project:
                _update_project_in_db(db, project, {
                    "status": VideoProjectStatus.FAILED.value,
                    "error_message": str(e)
                })
        except Exception:
            pass
    finally:
        db.close()


@router.post("/{video_project_id}/images/approve", response_model=ImageApproveResponse)
async def approve_images(
    video_project_id: str,
    request: ImageApproveRequest,
    db: Session = Depends(get_db)
):
    """
    Step 2: 이미지 승인

    유저가 각 씬의 이미지를 확인하고 승인/거부합니다.
    거부된 이미지는 재생성이 필요합니다.
    """
    project = _get_project_from_db(db, video_project_id)
    project_data = _get_project_data(project)

    # 상태 체크
    if project_data["status"] != VideoProjectStatus.IMAGES_READY.value:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Cannot approve images in status: {project_data['status']}"
        )

    plan_draft_data = project_data.get("plan_draft", {})
    scenes = plan_draft_data.get("scenes", [])

    # 승인 상태 업데이트
    needs_regeneration = False
    regenerating_scenes = []

    for approval in request.scene_approvals:
        for scene in scenes:
            if scene["scene_index"] == approval.scene_index:
                if approval.approved:
                    scene["image_approval_status"] = ImageApprovalStatus.APPROVED.value
                else:
                    scene["image_approval_status"] = ImageApprovalStatus.REJECTED.value
                    scene["regenerate_reason"] = approval.regenerate_reason
                    needs_regeneration = True
                    regenerating_scenes.append(approval.scene_index)
                break

    plan_draft_data["scenes"] = scenes

    # 상태 결정
    if needs_regeneration:
        new_status = VideoProjectStatus.IMAGES_READY  # 재생성 필요하면 그대로 유지
    else:
        new_status = VideoProjectStatus.IMAGES_APPROVED

    _update_project_in_db(db, project, {
        "status": new_status.value,
        "plan_draft": plan_draft_data
    })

    logger.info(f"[VideoPipeline] Images {'partially ' if needs_regeneration else ''}approved: {video_project_id}")

    return ImageApproveResponse(
        project_id=video_project_id,
        status=new_status,
        plan_draft=VideoPlanDraftV1(**plan_draft_data),
        needs_regeneration=needs_regeneration,
        regenerating_scenes=regenerating_scenes
    )


@router.post("/{video_project_id}/images/regenerate", response_model=ImageRegenerateResponse)
async def regenerate_image(
    video_project_id: str,
    request: ImageRegenerateRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    이미지 재생성

    특정 씬의 이미지를 새로 생성합니다.
    """
    project = _get_project_from_db(db, video_project_id)
    project_data = _get_project_data(project)

    # 상태 체크
    if project_data["status"] not in [
        VideoProjectStatus.IMAGES_READY.value,
        VideoProjectStatus.IMAGES_APPROVED.value,
    ]:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Cannot regenerate image in status: {project_data['status']}"
        )

    plan_draft_data = project_data.get("plan_draft", {})
    scenes = plan_draft_data.get("scenes", [])

    # 해당 씬 찾기
    target_scene = None
    for scene in scenes:
        if scene["scene_index"] == request.scene_index:
            target_scene = scene
            scene["image_approval_status"] = ImageApprovalStatus.REGENERATING.value
            if request.new_prompt:
                scene["image_prompt"] = request.new_prompt
            break

    if not target_scene:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Scene {request.scene_index} not found"
        )

    plan_draft_data["scenes"] = scenes
    _update_project_in_db(db, project, {
        "plan_draft": plan_draft_data
    })

    # 백그라운드에서 재생성
    background_tasks.add_task(
        _regenerate_image_background,
        str(project.id),
        video_project_id,
        request.scene_index,
        target_scene.get("image_prompt", "")
    )

    logger.info(f"[VideoPipeline] Image regeneration started: scene {request.scene_index}")

    return ImageRegenerateResponse(
        project_id=video_project_id,
        scene_index=request.scene_index,
        new_image_url="",  # 백그라운드에서 업데이트됨
        generation_attempts=target_scene.get("generation_attempts", 0) + 1,
        message="이미지 재생성을 시작합니다."
    )


async def _regenerate_image_background(
    db_id: str,
    video_project_id: str,
    scene_index: int,
    prompt: str
):
    """백그라운드 이미지 재생성"""
    from app.core.database import SessionLocal

    db = SessionLocal()
    try:
        project = db.query(ProjectOutput).filter(ProjectOutput.id == db_id).first()
        if not project:
            return

        media_gateway = get_media_gateway()

        result = await media_gateway.generate_image(
            prompt=prompt,
            width=1080,
            height=1920,
        )

        plan_draft_data = dict(project.source_metadata.get("plan_draft", {}))
        scenes = plan_draft_data.get("scenes", [])

        for scene in scenes:
            if scene["scene_index"] == scene_index:
                scene["image_url"] = result.get("url") or result.get("base64")
                scene["image_approval_status"] = ImageApprovalStatus.GENERATED.value
                scene["generation_attempts"] = scene.get("generation_attempts", 0) + 1
                break

        plan_draft_data["scenes"] = scenes
        _update_project_in_db(db, project, {
            "plan_draft": plan_draft_data
        })

        logger.info(f"[VideoPipeline] Image regenerated: scene {scene_index}")

    except Exception as e:
        logger.error(f"[VideoPipeline] Image regeneration failed: {e}")
    finally:
        db.close()


# =============================================================================
# Step 3: Motion Generate/Approve/Regenerate APIs
# =============================================================================

@router.post("/{video_project_id}/motion/generate", response_model=MotionGenerateResponse)
async def generate_motion_prompts(
    video_project_id: str,
    request: MotionGenerateRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Step 3: 모션 프롬프트 생성

    이미지 승인 후 AI 영상용 모션 프롬프트를 생성합니다.
    use_ai_video=True인 씬에 대해서만 생성됩니다.
    """
    project = _get_project_from_db(db, video_project_id)
    project_data = _get_project_data(project)

    # 상태 체크
    if project_data["status"] not in [
        VideoProjectStatus.IMAGES_APPROVED.value,
        VideoProjectStatus.MOTION_READY.value,  # 재생성 허용
    ]:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Cannot generate motion prompts in status: {project_data['status']}"
        )

    # 상태 업데이트
    _update_project_in_db(db, project, {
        "status": VideoProjectStatus.GENERATING_MOTION.value,
        "plan_draft": request.plan_draft.model_dump()
    })

    # 백그라운드에서 모션 프롬프트 생성
    background_tasks.add_task(
        _generate_motion_prompts_background,
        str(project.id),
        video_project_id,
        request.plan_draft.model_dump()
    )

    logger.info(f"[VideoPipeline] Motion prompt generation started: {video_project_id}")

    return MotionGenerateResponse(
        project_id=video_project_id,
        status=VideoProjectStatus.GENERATING_MOTION,
        plan_draft=request.plan_draft,
        message="모션 프롬프트 생성을 시작합니다."
    )


async def _generate_motion_prompts_background(
    db_id: str,
    video_project_id: str,
    plan_draft_data: dict
):
    """백그라운드 모션 프롬프트 생성"""
    from app.core.database import SessionLocal
    from app.services.agents.motion_prompt import get_motion_prompt_agent

    logger.info(f"[VideoPipeline] === MOTION PROMPT GENERATION START ===")

    db = SessionLocal()
    try:
        project = db.query(ProjectOutput).filter(ProjectOutput.id == db_id).first()
        if not project:
            return

        llm_gateway = get_llm_gateway()
        motion_agent = get_motion_prompt_agent(llm_gateway=llm_gateway)

        scenes = plan_draft_data.get("scenes", [])

        # use_ai_video=True인 씬에 대해 모션 프롬프트 생성
        for scene in scenes:
            if scene.get("use_ai_video") and not scene.get("motion_prompt"):
                try:
                    from app.services.agents.base import AgentRequest

                    response = await motion_agent.execute(AgentRequest(
                        task="generate_single_prompt",
                        payload={
                            "image_url": scene.get("image_url", ""),
                            "scene_index": scene["scene_index"],
                            "total_scenes": len(scenes),
                            "script": scene.get("script", ""),
                            "caption": scene.get("caption", ""),
                            "duration_sec": scene.get("duration_sec", 3.0),
                            "motion_style": "cinematic",
                        }
                    ))

                    result = response.outputs[0].value
                    scene["motion_prompt"] = result.get("motion_prompt", "")
                    scene["motion_prompt_ko"] = result.get("motion_prompt_ko", "")
                    logger.info(f"[VideoPipeline] Scene {scene['scene_index']} motion prompt generated")

                except Exception as e:
                    logger.error(f"[VideoPipeline] Scene {scene['scene_index']} motion prompt failed: {e}")
                    # 기본 모션 프롬프트 설정
                    scene["motion_prompt"] = "Gentle camera movement with subtle zoom"
                    scene["motion_prompt_ko"] = "부드러운 카메라 움직임과 미세한 줌"

        plan_draft_data["scenes"] = scenes
        _update_project_in_db(db, project, {
            "status": VideoProjectStatus.MOTION_READY.value,
            "plan_draft": plan_draft_data
        })

        logger.info(f"[VideoPipeline] Motion prompt generation complete: {video_project_id}")

    except Exception as e:
        logger.error(f"[VideoPipeline] Motion prompt generation failed: {e}")
        try:
            project = db.query(ProjectOutput).filter(ProjectOutput.id == db_id).first()
            if project:
                _update_project_in_db(db, project, {
                    "status": VideoProjectStatus.FAILED.value,
                    "error_message": str(e)
                })
        except Exception:
            pass
    finally:
        db.close()


@router.post("/{video_project_id}/motion/approve", response_model=MotionApproveResponse)
async def approve_motion_prompts(
    video_project_id: str,
    request: MotionApproveRequest,
    db: Session = Depends(get_db)
):
    """
    Step 3: 모션 프롬프트 승인

    유저가 모션 프롬프트를 확인/수정하고 승인합니다.
    수정된 프롬프트는 그대로 저장됩니다.
    """
    project = _get_project_from_db(db, video_project_id)
    project_data = _get_project_data(project)

    # 상태 체크
    if project_data["status"] != VideoProjectStatus.MOTION_READY.value:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Cannot approve motion prompts in status: {project_data['status']}"
        )

    plan_draft_data = project_data.get("plan_draft", {})
    scenes = plan_draft_data.get("scenes", [])

    # 모션 프롬프트 업데이트
    for approval in request.scene_approvals:
        for scene in scenes:
            if scene["scene_index"] == approval.scene_index:
                if approval.motion_prompt:
                    scene["motion_prompt"] = approval.motion_prompt
                if approval.motion_prompt_ko:
                    scene["motion_prompt_ko"] = approval.motion_prompt_ko
                break

    plan_draft_data["scenes"] = scenes

    _update_project_in_db(db, project, {
        "status": VideoProjectStatus.MOTION_APPROVED.value,
        "plan_draft": plan_draft_data
    })

    logger.info(f"[VideoPipeline] Motion prompts approved: {video_project_id}")

    return MotionApproveResponse(
        project_id=video_project_id,
        status=VideoProjectStatus.MOTION_APPROVED,
        plan_draft=VideoPlanDraftV1(**plan_draft_data),
        message="모션 프롬프트가 승인되었습니다. 영상 렌더링을 시작할 수 있습니다."
    )


@router.post("/{video_project_id}/motion/regenerate", response_model=MotionRegenerateResponse)
async def regenerate_motion_prompt(
    video_project_id: str,
    request: MotionRegenerateRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    모션 프롬프트 재생성

    특정 씬의 모션 프롬프트를 새로 생성합니다.
    """
    project = _get_project_from_db(db, video_project_id)
    project_data = _get_project_data(project)

    # 상태 체크
    if project_data["status"] not in [
        VideoProjectStatus.MOTION_READY.value,
        VideoProjectStatus.MOTION_APPROVED.value,
    ]:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Cannot regenerate motion prompt in status: {project_data['status']}"
        )

    plan_draft_data = project_data.get("plan_draft", {})
    scenes = plan_draft_data.get("scenes", [])

    # 해당 씬 찾기
    target_scene = None
    for scene in scenes:
        if scene["scene_index"] == request.scene_index:
            target_scene = scene
            break

    if not target_scene:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Scene {request.scene_index} not found"
        )

    # 백그라운드에서 재생성
    background_tasks.add_task(
        _regenerate_motion_prompt_background,
        str(project.id),
        video_project_id,
        request.scene_index,
        request.guidance
    )

    logger.info(f"[VideoPipeline] Motion prompt regeneration started: scene {request.scene_index}")

    return MotionRegenerateResponse(
        project_id=video_project_id,
        scene_index=request.scene_index,
        motion_prompt="",  # 백그라운드에서 업데이트됨
        motion_prompt_ko="",
        message="모션 프롬프트 재생성을 시작합니다."
    )


async def _regenerate_motion_prompt_background(
    db_id: str,
    video_project_id: str,
    scene_index: int,
    guidance: Optional[str]
):
    """백그라운드 모션 프롬프트 재생성"""
    from app.core.database import SessionLocal
    from app.services.agents.motion_prompt import get_motion_prompt_agent

    db = SessionLocal()
    try:
        project = db.query(ProjectOutput).filter(ProjectOutput.id == db_id).first()
        if not project:
            return

        llm_gateway = get_llm_gateway()
        motion_agent = get_motion_prompt_agent(llm_gateway=llm_gateway)

        plan_draft_data = dict(project.source_metadata.get("plan_draft", {}))
        scenes = plan_draft_data.get("scenes", [])

        for scene in scenes:
            if scene["scene_index"] == scene_index:
                from app.services.agents.base import AgentRequest

                response = await motion_agent.execute(AgentRequest(
                    task="generate_single_prompt",
                    payload={
                        "image_url": scene.get("image_url", ""),
                        "scene_index": scene["scene_index"],
                        "total_scenes": len(scenes),
                        "script": scene.get("script", ""),
                        "caption": scene.get("caption", ""),
                        "duration_sec": scene.get("duration_sec", 3.0),
                        "motion_style": "cinematic",
                        "guidance": guidance,  # 재생성 가이드
                    }
                ))

                result = response.outputs[0].value
                scene["motion_prompt"] = result.get("motion_prompt", "")
                scene["motion_prompt_ko"] = result.get("motion_prompt_ko", "")
                break

        plan_draft_data["scenes"] = scenes
        _update_project_in_db(db, project, {
            "plan_draft": plan_draft_data
        })

        logger.info(f"[VideoPipeline] Motion prompt regenerated: scene {scene_index}")

    except Exception as e:
        logger.error(f"[VideoPipeline] Motion prompt regeneration failed: {e}")
    finally:
        db.close()


# =============================================================================
# Health Check
# =============================================================================

@router.get("/health")
async def health_check(db: Session = Depends(get_db)):
    """Video Pipeline V2 헬스체크"""
    # DB에서 활성 프로젝트 수 조회
    active_count = db.query(ProjectOutput).filter(
        ProjectOutput.output_type == 'video',
        ProjectOutput.status.in_(['draft', 'processing'])
    ).count()

    return {
        "status": "ok",
        "service": "video_pipeline_v2",
        "version": "2.0.0",
        "storage": "database",
        "active_projects": active_count
    }
