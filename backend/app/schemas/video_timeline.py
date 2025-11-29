"""
Video Timeline Schemas (V2)

VideoBuilder의 입력 타입과 PLAN/RENDER 2단계 플로우를 위한 스키마 정의

작성일: 2025-11-30
작성자: B팀 (Backend)
참조: docs/VIDEO_PIPELINE_DESIGN_V2.md
"""

from pydantic import BaseModel, Field, field_validator, model_validator
from typing import List, Optional, Literal
from enum import Enum
from uuid import UUID


# ============================================================================
# Enums - Scene & Motion
# ============================================================================

class SceneType(str, Enum):
    """씬 타입"""
    IMAGE = "image"
    TITLE_CARD = "title_card"
    BLANK = "blank"


class MotionType(str, Enum):
    """모션 타입"""
    NONE = "none"
    KENBURNS = "kenburns"


class TransitionType(str, Enum):
    """전환 효과 타입"""
    CUT = "cut"
    CROSSFADE = "crossfade"
    SLIDE_LEFT = "slide_left"
    SLIDE_UP = "slide_up"
    ZOOM_OUT = "zoom_out"


class FitMode(str, Enum):
    """이미지 맞춤 모드"""
    COVER = "cover"
    CONTAIN = "contain"
    BLUR_BG = "blur_bg"


class EasingType(str, Enum):
    """이징 함수 타입"""
    LINEAR = "linear"
    EASE_IN = "ease_in"
    EASE_OUT = "ease_out"
    EASE_IN_OUT = "ease_in_out"


# ============================================================================
# Enums - Text
# ============================================================================

class TextRole(str, Enum):
    """텍스트 역할"""
    SUBTITLE = "subtitle"
    TITLE = "title"
    CTA = "cta"


class TextPosition(str, Enum):
    """텍스트 위치"""
    TOP_CENTER = "top_center"
    CENTER = "center"
    BOTTOM_CENTER = "bottom_center"


class AnimationType(str, Enum):
    """애니메이션 타입"""
    NONE = "none"
    FADE = "fade"
    SLIDE_UP = "slide_up"


# ============================================================================
# Enums - Audio
# ============================================================================

class BGMMode(str, Enum):
    """BGM 모드"""
    AUTO = "auto"
    LIBRARY = "library"
    GENERATED = "generated"


# ============================================================================
# Enums - Video Generation
# ============================================================================

class VideoGenerationMode(str, Enum):
    """비디오 생성 모드 (3단계 자유도)"""
    REUSE = "reuse"        # Level 1: 기존 이미지만 사용
    HYBRID = "hybrid"      # Level 2: 혼합 (기존 + 신규)
    CREATIVE = "creative"  # Level 3: 신규 이미지 생성


class VideoDirectorMode(str, Enum):
    """VideoDirector 실행 모드"""
    PLAN = "plan"          # LLM만 사용, 스크립트/스토리보드 생성
    RENDER = "render"      # GPU/API 사용, 실제 영상 렌더링


class VideoProjectStatus(str, Enum):
    """비디오 프로젝트 상태"""
    NOT_STARTED = "not_started"
    PLANNING = "planning"
    PLAN_READY = "plan_ready"
    RENDERING = "rendering"
    COMPLETED = "completed"
    FAILED = "failed"


class ScriptStatus(str, Enum):
    """스크립트 상태"""
    DRAFT = "draft"
    USER_EDITED = "user_edited"
    APPROVED = "approved"


# ============================================================================
# Config Models
# ============================================================================

class CanvasConfig(BaseModel):
    """캔버스 설정"""
    width: int = 1080
    height: int = 1920
    fps: int = 24


class GlobalConfig(BaseModel):
    """전역 설정"""
    total_duration_sec: float
    bg_color: str = "#000000"
    music_mood: Optional[str] = None


class AudioConfig(BaseModel):
    """오디오 설정"""
    bgm_mode: BGMMode = BGMMode.AUTO
    bgm_url: Optional[str] = None
    bgm_generated_id: Optional[str] = None
    bgm_volume: float = Field(default=0.5, ge=0.0, le=1.0)


# ============================================================================
# Scene Components
# ============================================================================

class ImageConfig(BaseModel):
    """이미지 설정"""
    source_type: Literal["asset", "generated"] = "asset"
    url: str
    fit_mode: FitMode = FitMode.COVER


class MotionConfig(BaseModel):
    """모션 설정 (Ken Burns)"""
    type: MotionType = MotionType.NONE
    pan_start: List[float] = Field(default=[0.5, 0.5], min_length=2, max_length=2)
    pan_end: List[float] = Field(default=[0.5, 0.5], min_length=2, max_length=2)
    zoom_start: float = Field(default=1.0, ge=0.5, le=2.0)
    zoom_end: float = Field(default=1.0, ge=0.5, le=2.0)
    easing: EasingType = EasingType.EASE_IN_OUT


class TransitionConfig(BaseModel):
    """전환 효과 설정"""
    type: TransitionType = TransitionType.CUT
    duration_sec: float = Field(default=0.5, ge=0.0, le=2.0)


class TextAnimationConfig(BaseModel):
    """텍스트 애니메이션 설정"""
    in_type: AnimationType = AnimationType.FADE
    out_type: AnimationType = AnimationType.FADE
    in_duration_sec: float = Field(default=0.3, ge=0.0, le=1.0)
    out_duration_sec: float = Field(default=0.3, ge=0.0, le=1.0)


class TextLayer(BaseModel):
    """텍스트 레이어"""
    role: TextRole
    text: str
    start_sec: float = Field(ge=0.0)
    end_sec: float = Field(ge=0.0)
    position: TextPosition = TextPosition.BOTTOM_CENTER
    animation: TextAnimationConfig = Field(default_factory=TextAnimationConfig)


# ============================================================================
# Scene
# ============================================================================

class SceneConfig(BaseModel):
    """씬 설정"""
    scene_index: int = Field(ge=1)
    start_sec: float = Field(ge=0.0)
    end_sec: float = Field(ge=0.0)
    type: SceneType = SceneType.IMAGE
    image: Optional[ImageConfig] = None
    motion: MotionConfig = Field(default_factory=MotionConfig)
    transition_out: TransitionConfig = Field(default_factory=TransitionConfig)
    texts: List[TextLayer] = Field(default_factory=list)

    @field_validator("end_sec")
    @classmethod
    def validate_end_after_start(cls, v, info):
        """end_sec는 start_sec보다 커야 함"""
        if "start_sec" in info.data and v <= info.data["start_sec"]:
            raise ValueError("end_sec must be greater than start_sec")
        return v


# ============================================================================
# Main Schema: VideoTimelinePlanV1
# ============================================================================

class VideoTimelinePlanV1(BaseModel):
    """
    VideoBuilder의 단일 입력 타입

    VideoBuilder는 이 스키마를 받아 ffmpeg로 실제 mp4 파일을 생성합니다.
    """
    version: str = "1.0"
    canvas: CanvasConfig = Field(default_factory=CanvasConfig)
    global_config: GlobalConfig
    audio: AudioConfig = Field(default_factory=AudioConfig)
    scenes: List[SceneConfig] = Field(min_length=1)


# ============================================================================
# Draft Schema: VideoPlanDraftV1 (유저 수정용)
# ============================================================================

class SceneDraft(BaseModel):
    """
    유저가 수정하기 쉬운 단순화된 씬 구조

    PLAN 단계에서 생성되며, 유저가 수정 후 RENDER 단계로 진행
    """
    scene_index: int = Field(ge=1)
    image_id: Optional[str] = None  # Asset Pool의 이미지 ID
    image_url: Optional[str] = None
    caption: str = ""
    duration_sec: float = Field(default=3.0, ge=2.0, le=5.0)
    generate_new_image: bool = False  # True면 새로 생성
    image_prompt: Optional[str] = None  # 새 이미지 프롬프트

    @model_validator(mode="after")
    def validate_image_source(self):
        """image_id 또는 image_url 중 하나는 필수 (generate_new_image=False인 경우)"""
        # 새로 생성할 이미지면 기존 이미지 정보 불필요
        if self.generate_new_image:
            return self

        # 기존 이미지 재사용인데 이미지 정보가 없으면 에러
        if not self.image_id and not self.image_url:
            raise ValueError("image_id 또는 image_url 중 하나는 필수입니다 (generate_new_image=False)")

        return self


class VideoPlanDraftV1(BaseModel):
    """
    PLAN 단계 결과물 - 유저 수정 가능

    VideoDirector.PLAN 모드에서 생성되며,
    유저가 확인/수정 후 RENDER 단계로 진행합니다.
    """
    version: str = "1.0"
    project_id: str
    mode: VideoGenerationMode = VideoGenerationMode.HYBRID

    # 기본 설정
    total_duration_sec: float = Field(ge=5.0, le=60.0)
    music_mood: str = "warm_lofi"

    # 씬 목록
    scenes: List[SceneDraft] = Field(min_length=3, max_length=6)

    # 상태
    script_status: ScriptStatus = ScriptStatus.DRAFT

    @field_validator("scenes")
    @classmethod
    def validate_scene_count(cls, v):
        """V2 제한: 3~6개 씬"""
        if len(v) < 3:
            raise ValueError("최소 3개 씬 필요")
        if len(v) > 6:
            raise ValueError("최대 6개 씬까지 지원 (V2 제한)")
        return v


# ============================================================================
# API Request/Response Models
# ============================================================================

class VideoPlanRequest(BaseModel):
    """POST /api/v1/video6/{project_id}/plan 요청"""
    mode: VideoGenerationMode = VideoGenerationMode.HYBRID
    concept_board_id: Optional[str] = None
    available_assets: Optional[List[str]] = None  # 재사용 가능 이미지 ID
    total_duration_sec: float = Field(default=15.0, ge=5.0, le=60.0)
    music_mood: str = "warm_lofi"
    override_story: Optional[str] = None  # CREATIVE 모드에서 사용


class VideoPlanResponse(BaseModel):
    """POST /api/v1/video6/{project_id}/plan 응답"""
    project_id: str
    plan_draft: VideoPlanDraftV1
    estimated_render_cost: Optional[float] = None
    estimated_render_time_sec: Optional[int] = None


class VideoRenderRequest(BaseModel):
    """POST /api/v1/video6/{project_id}/render 요청"""
    plan_draft: VideoPlanDraftV1


class VideoRenderResponse(BaseModel):
    """POST /api/v1/video6/{project_id}/render 응답"""
    job_id: str
    status: VideoProjectStatus
    estimated_time_sec: Optional[int] = None


class VideoStatusResponse(BaseModel):
    """GET /api/v1/video6/{project_id}/status 응답"""
    project_id: str
    status: VideoProjectStatus
    script_status: ScriptStatus
    plan_draft: Optional[VideoPlanDraftV1] = None
    video_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    duration_sec: Optional[float] = None
    error_message: Optional[str] = None


# ============================================================================
# Video Build Result
# ============================================================================

class VideoBuildResult(BaseModel):
    """VideoBuilder 결과"""
    video_url: str
    thumbnail_url: str
    duration_sec: float
    fps: int
    file_size_bytes: int
    render_time_sec: float


# ============================================================================
# Video Project Create Request
# ============================================================================

class VideoProjectCreateRequest(BaseModel):
    """POST /api/v1/video6/projects 요청"""
    brand_id: UUID
    user_id: UUID  # 생성자 ID (필수)
    project_id: Optional[UUID] = None  # 연결할 프로젝트 ID
    name: Optional[str] = None
    concept_board_id: Optional[str] = None


class VideoProjectCreateResponse(BaseModel):
    """POST /api/v1/video6/projects 응답"""
    video_project_id: str
    status: VideoProjectStatus
    created_at: str
