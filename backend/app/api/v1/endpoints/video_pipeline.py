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
"""

import logging
from typing import Optional, List
from uuid import UUID, uuid4
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field

from app.core.database import get_db
from app.schemas.video_timeline import (
    VideoDirectorMode,
    VideoGenerationMode,
    VideoProjectStatus,
    ScriptStatus,
    VideoPlanDraftV1,
    SceneDraft,
    VideoPlanRequest,
    VideoPlanResponse,
    VideoRenderRequest,
    VideoRenderResponse,
    VideoStatusResponse,
    VideoProjectCreateRequest,
    VideoProjectCreateResponse,
)
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
# In-Memory Storage (MVP용 - 추후 DB로 이관)
# =============================================================================

# 비디오 프로젝트 저장소 (video_project_id -> project_data)
_video_projects: dict = {}


# =============================================================================
# Helper Functions
# =============================================================================

def _get_project(video_project_id: str) -> dict:
    """프로젝트 조회"""
    if video_project_id not in _video_projects:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Video project not found: {video_project_id}"
        )
    return _video_projects[video_project_id]


def _update_project(video_project_id: str, updates: dict):
    """프로젝트 업데이트"""
    if video_project_id not in _video_projects:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Video project not found: {video_project_id}"
        )
    _video_projects[video_project_id].update(updates)
    _video_projects[video_project_id]["updated_at"] = datetime.utcnow().isoformat()


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
    """
    video_project_id = f"vp_{uuid4().hex[:8]}"
    now = datetime.utcnow().isoformat()

    project_data = {
        "video_project_id": video_project_id,
        "brand_id": str(request.brand_id),
        "project_id": str(request.project_id) if request.project_id else None,
        "name": request.name or f"Video Project {video_project_id}",
        "concept_board_id": request.concept_board_id,
        "status": VideoProjectStatus.NOT_STARTED.value,
        "script_status": ScriptStatus.DRAFT.value,
        "plan_draft": None,
        "video_url": None,
        "thumbnail_url": None,
        "created_at": now,
        "updated_at": now,
    }

    _video_projects[video_project_id] = project_data

    logger.info(f"[VideoPipeline] Created project: {video_project_id}")

    return VideoProjectCreateResponse(
        video_project_id=video_project_id,
        status=VideoProjectStatus.NOT_STARTED,
        created_at=now
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
    project = _get_project(video_project_id)

    # 상태 체크
    if project["status"] == VideoProjectStatus.RENDERING.value:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Project is currently rendering"
        )

    # 상태 업데이트
    _update_project(video_project_id, {"status": VideoProjectStatus.PLANNING.value})

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
            "concept_name": project.get("name", "Marketing Video"),
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
            _update_project(video_project_id, {"status": VideoProjectStatus.FAILED.value})
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=result.get("error_message", "PLAN mode failed")
            )

        # 플랜 저장
        plan_draft = result.get("plan_draft")
        if plan_draft:
            # project_id를 실제 프로젝트 ID로 업데이트
            plan_draft["project_id"] = video_project_id

        _update_project(video_project_id, {
            "status": VideoProjectStatus.PLAN_READY.value,
            "plan_draft": plan_draft,
            "script_status": ScriptStatus.DRAFT.value
        })

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
        _update_project(video_project_id, {"status": VideoProjectStatus.FAILED.value})
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
    project = _get_project(video_project_id)

    # 상태 체크
    if project["status"] not in [
        VideoProjectStatus.PLAN_READY.value,
        VideoProjectStatus.NOT_STARTED.value
    ]:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Cannot update plan in status: {project['status']}"
        )

    # project_id 확인
    plan_draft.project_id = video_project_id
    plan_draft.script_status = ScriptStatus.USER_EDITED

    # 저장
    _update_project(video_project_id, {
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
    비용이 발생합니다.

    Parameters:
    - plan_draft: 유저가 수정한 플랜 (선택, 없으면 저장된 플랜 사용)

    Returns:
    - job_id: 렌더링 작업 ID
    - status: 현재 상태 (rendering)
    - estimated_time_sec: 예상 소요 시간
    """
    project = _get_project(video_project_id)

    # 상태 체크
    if project["status"] == VideoProjectStatus.RENDERING.value:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Project is already rendering"
        )

    # 플랜 확인
    plan_draft_data = request.plan_draft.model_dump() if request and request.plan_draft else project.get("plan_draft")

    if not plan_draft_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No plan draft available. Run PLAN mode first."
        )

    # 플랜 상태를 approved로 변경
    plan_draft_data["script_status"] = ScriptStatus.APPROVED.value

    # 렌더링 작업 ID 생성
    job_id = f"job_{uuid4().hex[:8]}"

    # 상태 업데이트
    _update_project(video_project_id, {
        "status": VideoProjectStatus.RENDERING.value,
        "plan_draft": plan_draft_data,
        "script_status": ScriptStatus.APPROVED.value,
        "render_job_id": job_id
    })

    # 백그라운드에서 렌더링 실행
    background_tasks.add_task(
        _execute_render_background,
        video_project_id,
        plan_draft_data
    )

    logger.info(f"[VideoPipeline] RENDER started: {video_project_id}, job_id={job_id}")

    # 예상 시간 계산
    scene_count = len(plan_draft_data.get("scenes", []))
    new_image_count = sum(1 for s in plan_draft_data.get("scenes", []) if s.get("generate_new_image"))
    estimated_time = 30 + (new_image_count * 10) + (scene_count * 5) + 60

    return VideoRenderResponse(
        job_id=job_id,
        status=VideoProjectStatus.RENDERING,
        estimated_time_sec=estimated_time
    )


async def _execute_render_background(video_project_id: str, plan_draft_data: dict):
    """백그라운드 렌더링 실행"""
    try:
        llm_gateway = get_llm_gateway()
        media_gateway = get_media_gateway()

        director = get_video_director_agent(
            llm_gateway=llm_gateway,
            media_gateway=media_gateway
        )

        # 컨셉 정보 구성
        project = _video_projects.get(video_project_id, {})
        concept = {
            "concept_name": project.get("name", "Marketing Video"),
            "concept_description": "Short-form marketing video",
            "target_audience": "General audience",
            "tone_and_manner": "Professional",
            "visual_style": "Modern"
        }

        input_data = VideoDirectorInputV3(
            mode=VideoDirectorMode.RENDER,
            generation_mode=VideoGenerationMode(plan_draft_data.get("mode", "hybrid")),
            concept=concept,
            plan_draft=VideoPlanDraftV1(**plan_draft_data)
        )

        response = await director.execute_v3(AgentRequest(
            task="video_render",
            payload=input_data.model_dump()
        ))

        result = response.outputs[0].value

        if result.get("status") == VideoProjectStatus.FAILED.value:
            _video_projects[video_project_id]["status"] = VideoProjectStatus.FAILED.value
            _video_projects[video_project_id]["error_message"] = result.get("error_message")
        else:
            _video_projects[video_project_id].update({
                "status": VideoProjectStatus.COMPLETED.value,
                "video_url": result.get("video_url"),
                "thumbnail_url": result.get("thumbnail_url"),
                "duration_sec": result.get("duration_sec")
            })

        logger.info(f"[VideoPipeline] RENDER complete: {video_project_id}")

    except Exception as e:
        logger.error(f"[VideoPipeline] RENDER failed: {video_project_id}, error={e}")
        _video_projects[video_project_id]["status"] = VideoProjectStatus.FAILED.value
        _video_projects[video_project_id]["error_message"] = str(e)


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
    project = _get_project(video_project_id)

    plan_draft = None
    if project.get("plan_draft"):
        try:
            plan_draft = VideoPlanDraftV1(**project["plan_draft"])
        except Exception:
            pass

    return VideoStatusResponse(
        project_id=video_project_id,
        status=VideoProjectStatus(project["status"]),
        script_status=ScriptStatus(project.get("script_status", "draft")),
        plan_draft=plan_draft,
        video_url=project.get("video_url"),
        thumbnail_url=project.get("thumbnail_url"),
        duration_sec=project.get("duration_sec"),
        error_message=project.get("error_message")
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
    project = _get_project(video_project_id)

    # MVP: 빈 목록 반환
    # TODO: brand_id로 GeneratedAsset 조회
    return {
        "video_project_id": video_project_id,
        "assets": [],
        "total": 0,
        "message": "Asset Pool integration coming soon"
    }


# =============================================================================
# Health Check
# =============================================================================

@router.get("/health")
async def health_check():
    """Video Pipeline V2 헬스체크"""
    return {
        "status": "ok",
        "service": "video_pipeline_v2",
        "version": "2.0.0",
        "active_projects": len(_video_projects)
    }
