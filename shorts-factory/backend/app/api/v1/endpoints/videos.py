"""
Video API Endpoints

숏폼 영상 생성 API

작성일: 2025-12-06

엔드포인트:
- POST /api/v1/videos - 새 프로젝트 생성
- POST /api/v1/videos/{id}/script - 스크립트 생성
- POST /api/v1/videos/{id}/images - 이미지 생성
- POST /api/v1/videos/{id}/render - 최종 렌더링
- GET /api/v1/videos/{id}/status - 상태 조회
"""

import logging
from typing import Optional, List
from uuid import uuid4

from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field

from app.services.video import get_shorts_generator

logger = logging.getLogger(__name__)

router = APIRouter()


# =============================================================================
# Request/Response Models
# =============================================================================

class VideoProjectCreate(BaseModel):
    """프로젝트 생성 요청"""
    title: str = Field(..., description="프로젝트 제목")
    topic: str = Field(..., description="영상 주제")
    duration_sec: int = Field(30, description="목표 영상 길이 (초)")
    style: str = Field("engaging", description="스타일 (engaging, educational, promotional)")
    num_scenes: int = Field(5, description="씬 개수")


class VideoProjectResponse(BaseModel):
    """프로젝트 응답"""
    id: str
    title: str
    status: str
    video_url: Optional[str] = None
    message: Optional[str] = None


class SceneData(BaseModel):
    """씬 데이터"""
    scene_number: int
    duration_seconds: float
    narration: str
    image_prompt: str
    motion_prompt: str
    text_overlay: Optional[str] = None


class ScriptResponse(BaseModel):
    """스크립트 응답"""
    project_id: str
    scenes: List[SceneData]
    audio_settings: dict


class RenderRequest(BaseModel):
    """렌더링 요청"""
    use_ai_video: bool = Field(False, description="AI 영상 생성 사용 여부")
    render_mode: str = Field("mock", description="렌더 모드 (mock/real)")


# =============================================================================
# API Endpoints
# =============================================================================

@router.post("/", response_model=VideoProjectResponse)
async def create_project(request: VideoProjectCreate):
    """
    새 프로젝트 생성

    프로젝트를 생성하고 스크립트를 자동으로 생성합니다.
    """
    generator = get_shorts_generator()

    try:
        # 프로젝트 생성
        project = await generator.create_project(
            title=request.title,
            prompt=request.topic
        )

        # 스크립트 생성
        script = await generator.generate_script(
            project=project,
            topic=request.topic,
            duration_sec=request.duration_sec,
            style=request.style,
            num_scenes=request.num_scenes
        )

        return VideoProjectResponse(
            id=project.id,
            title=project.title,
            status=project.status,
            message=f"프로젝트 생성 완료. {len(script['scenes'])}개 씬 스크립트 생성됨."
        )

    except Exception as e:
        logger.error(f"Failed to create project: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{project_id}/status", response_model=VideoProjectResponse)
async def get_project_status(project_id: str):
    """프로젝트 상태 조회"""
    # TODO: DB에서 프로젝트 조회 구현
    return VideoProjectResponse(
        id=project_id,
        title="Sample Project",
        status="draft",
        message="상태 조회 기능 구현 예정"
    )


@router.post("/{project_id}/images")
async def generate_images(
    project_id: str,
    background_tasks: BackgroundTasks
):
    """씬별 이미지 생성"""
    # TODO: 실제 이미지 생성 구현
    return {
        "project_id": project_id,
        "status": "generating",
        "message": "이미지 생성을 시작합니다."
    }


@router.post("/{project_id}/render")
async def render_video(
    project_id: str,
    request: RenderRequest,
    background_tasks: BackgroundTasks
):
    """최종 영상 렌더링"""
    # TODO: 실제 렌더링 구현
    return {
        "project_id": project_id,
        "status": "rendering",
        "render_mode": request.render_mode,
        "message": "영상 렌더링을 시작합니다."
    }


@router.post("/text-to-video")
async def text_to_video(
    prompt: str = "A beautiful sunset over the ocean",
    width: int = 720,
    height: int = 480,
    frames: int = 125
):
    """
    Text-to-Video 생성 (HunyuanVideo)

    텍스트 프롬프트로 영상을 직접 생성합니다.
    """
    from app.services.media.providers import get_hunyuan_provider

    try:
        provider = get_hunyuan_provider()

        result = await provider.generate(
            prompt=prompt,
            task="text_to_video",
            media_type="video",
            options={
                "width": width,
                "height": height,
                "frames": frames
            }
        )

        return {
            "status": "completed",
            "video_data": result.outputs[0].data[:100] + "...",  # Base64 일부만
            "duration": result.outputs[0].duration,
            "generation_time_sec": result.usage.get("generation_time_sec")
        }

    except Exception as e:
        logger.error(f"Text-to-video failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/image-to-video")
async def image_to_video(
    image_url: str,
    prompt: str = "Gentle camera movement with subtle zoom",
    width: int = 720,
    height: int = 480,
    frames: int = 75  # 3초
):
    """
    Image-to-Video 생성 (HunyuanVideo)

    이미지를 움직이는 영상으로 변환합니다.
    """
    from app.services.media.providers import get_hunyuan_provider

    try:
        provider = get_hunyuan_provider()

        result = await provider.generate(
            prompt=prompt,
            task="image_to_video",
            media_type="video",
            options={
                "image_url": image_url,
                "width": width,
                "height": height,
                "frames": frames
            }
        )

        return {
            "status": "completed",
            "video_data": result.outputs[0].data[:100] + "...",
            "duration": result.outputs[0].duration,
            "generation_time_sec": result.usage.get("generation_time_sec")
        }

    except Exception as e:
        logger.error(f"Image-to-video failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# =============================================================================
# Health Check
# =============================================================================

@router.get("/health")
async def health_check():
    """Video API 헬스체크"""
    from app.services.media.providers import get_hunyuan_provider

    hunyuan_ok = await get_hunyuan_provider().health_check()

    return {
        "status": "ok",
        "service": "shorts-factory-videos",
        "providers": {
            "hunyuan": "ok" if hunyuan_ok else "unavailable"
        }
    }
