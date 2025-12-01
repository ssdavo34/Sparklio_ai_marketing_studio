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
    IMAGE = "image"           # 정적 이미지 (Ken Burns 효과)
    AI_VIDEO = "ai_video"     # AI 생성 영상 (Luma/Runway)
    TITLE_CARD = "title_card"
    BLANK = "blank"


class MotionType(str, Enum):
    """모션 타입"""
    NONE = "none"
    KENBURNS = "kenburns"
    AI_MOTION = "ai_motion"   # AI 기반 모션 (Luma/Runway)


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
    """비디오 프로젝트 상태 (4단계 확인 플로우)"""
    NOT_STARTED = "not_started"
    # Step 1: 스크립트 플래닝
    PLANNING = "planning"
    SCRIPT_READY = "script_ready"          # 스크립트 생성 완료, 유저 확인 대기
    SCRIPT_APPROVED = "script_approved"    # 스크립트 유저 승인 완료
    # Step 2: 이미지 생성
    GENERATING_IMAGES = "generating_images"
    IMAGES_READY = "images_ready"          # 이미지 생성 완료, 유저 확인 대기
    IMAGES_APPROVED = "images_approved"    # 이미지 유저 승인 완료
    # Step 3: 모션 프롬프트 생성 (AI 영상용)
    GENERATING_MOTION = "generating_motion"
    MOTION_READY = "motion_ready"          # 모션 프롬프트 생성 완료, 유저 확인 대기
    MOTION_APPROVED = "motion_approved"    # 모션 프롬프트 유저 승인 완료
    # Step 4: 동영상 렌더
    RENDERING = "rendering"
    COMPLETED = "completed"
    FAILED = "failed"


class ScriptStatus(str, Enum):
    """스크립트 상태"""
    DRAFT = "draft"
    USER_EDITED = "user_edited"
    APPROVED = "approved"


class ImageApprovalStatus(str, Enum):
    """이미지 승인 상태"""
    PENDING = "pending"           # 아직 생성 안됨
    GENERATED = "generated"       # 생성됨, 확인 대기
    APPROVED = "approved"         # 승인됨
    REJECTED = "rejected"         # 거부됨, 재생성 필요
    REGENERATING = "regenerating" # 재생성 중


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
    script: Optional[str] = None  # TTS용 스크립트

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

    3단계 플로우:
    1. 스크립트 확인/수정 (script, caption)
    2. 이미지 생성 후 확인/수정/재생성 (image_url, image_approval_status)
    3. 동영상 렌더 (최종)
    """
    scene_index: int = Field(ge=1)

    # 이미지 관련
    image_id: Optional[str] = None  # Asset Pool의 이미지 ID
    image_url: Optional[str] = None  # 생성된/기존 이미지 URL
    image_approval_status: ImageApprovalStatus = ImageApprovalStatus.PENDING

    # 스크립트 관련
    caption: str = ""  # 화면에 표시될 자막
    script: Optional[str] = None  # TTS용 스크립트 (음성 내용)

    # 타이밍
    duration_sec: float = Field(default=3.0, ge=2.0, le=8.0)

    # 이미지 생성 설정
    generate_new_image: bool = False  # True면 새로 생성
    image_prompt: Optional[str] = None  # 새 이미지 프롬프트

    # AI 영상 모션 설정 (Luma/Runway/Veo용)
    motion_prompt: Optional[str] = None  # AI 영상 생성용 모션 프롬프트
    motion_prompt_ko: Optional[str] = None  # 한국어 설명 (유저 확인용)
    use_ai_video: bool = False  # True면 Ken Burns 대신 AI 영상 사용

    # 재생성 관련
    regenerate_reason: Optional[str] = None  # 재생성 사유 (rejected 시)
    generation_attempts: int = 0  # 생성 시도 횟수

    @model_validator(mode="after")
    def validate_image_source(self):
        """image_id 또는 image_url 중 하나는 필수 (generate_new_image=False이고 승인된 경우)"""
        # 새로 생성할 이미지면 기존 이미지 정보 불필요
        if self.generate_new_image:
            return self

        # 아직 생성 전이면 검증 스킵
        if self.image_approval_status == ImageApprovalStatus.PENDING:
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


# =============================================================================
# Step 1: 스크립트 승인 API
# =============================================================================

class ScriptApproveRequest(BaseModel):
    """POST /api/v1/video6/{project_id}/script/approve 요청"""
    plan_draft: VideoPlanDraftV1  # 수정된 스크립트 포함


class ScriptApproveResponse(BaseModel):
    """POST /api/v1/video6/{project_id}/script/approve 응답"""
    project_id: str
    status: VideoProjectStatus  # → SCRIPT_APPROVED
    message: str = "스크립트가 승인되었습니다. 이미지 생성을 시작합니다."


# =============================================================================
# Step 2: 이미지 생성 & 승인 API
# =============================================================================

class ImageGenerateRequest(BaseModel):
    """POST /api/v1/video6/{project_id}/images/generate 요청"""
    plan_draft: VideoPlanDraftV1


class ImageGenerateResponse(BaseModel):
    """POST /api/v1/video6/{project_id}/images/generate 응답"""
    project_id: str
    status: VideoProjectStatus  # → GENERATING_IMAGES or IMAGES_READY
    plan_draft: VideoPlanDraftV1  # 이미지 URL이 채워진 상태
    message: str


class SceneImageApproval(BaseModel):
    """개별 씬 이미지 승인/거부"""
    scene_index: int
    approved: bool  # True: 승인, False: 재생성 요청
    regenerate_reason: Optional[str] = None  # 재생성 사유


class ImageApproveRequest(BaseModel):
    """POST /api/v1/video6/{project_id}/images/approve 요청"""
    scene_approvals: List[SceneImageApproval]


class ImageApproveResponse(BaseModel):
    """POST /api/v1/video6/{project_id}/images/approve 응답"""
    project_id: str
    status: VideoProjectStatus
    plan_draft: VideoPlanDraftV1
    needs_regeneration: bool = False  # True면 재생성 필요한 씬 있음
    regenerating_scenes: List[int] = []  # 재생성 중인 씬 인덱스


class ImageRegenerateRequest(BaseModel):
    """POST /api/v1/video6/{project_id}/images/regenerate 요청"""
    scene_index: int
    new_prompt: Optional[str] = None  # 새 프롬프트 (없으면 기존 사용)


class ImageRegenerateResponse(BaseModel):
    """POST /api/v1/video6/{project_id}/images/regenerate 응답"""
    project_id: str
    scene_index: int
    new_image_url: str
    generation_attempts: int
    message: str


# =============================================================================
# Step 3: 모션 프롬프트 생성 & 승인 API (AI 영상용)
# =============================================================================

class MotionGenerateRequest(BaseModel):
    """POST /api/v1/video6/{project_id}/motion/generate 요청"""
    plan_draft: VideoPlanDraftV1  # 이미지 URL이 채워진 상태


class MotionGenerateResponse(BaseModel):
    """POST /api/v1/video6/{project_id}/motion/generate 응답"""
    project_id: str
    status: VideoProjectStatus  # → MOTION_READY
    plan_draft: VideoPlanDraftV1  # motion_prompt가 채워진 상태
    message: str = "모션 프롬프트가 생성되었습니다. 확인 후 수정하세요."


class SceneMotionApproval(BaseModel):
    """개별 씬 모션 프롬프트 승인/수정"""
    scene_index: int
    approved: bool  # True: 승인, False: 수정됨
    motion_prompt: Optional[str] = None  # 수정된 프롬프트 (approved=False 시)
    motion_prompt_ko: Optional[str] = None  # 수정된 한국어 설명


class MotionApproveRequest(BaseModel):
    """POST /api/v1/video6/{project_id}/motion/approve 요청"""
    scene_approvals: List[SceneMotionApproval]


class MotionApproveResponse(BaseModel):
    """POST /api/v1/video6/{project_id}/motion/approve 응답"""
    project_id: str
    status: VideoProjectStatus  # → MOTION_APPROVED
    plan_draft: VideoPlanDraftV1
    message: str = "모션 프롬프트가 승인되었습니다. 영상 렌더링을 시작합니다."


class MotionRegenerateRequest(BaseModel):
    """POST /api/v1/video6/{project_id}/motion/regenerate 요청"""
    scene_index: int
    guidance: Optional[str] = None  # 재생성 가이드 (예: "더 다이나믹하게")


class MotionRegenerateResponse(BaseModel):
    """POST /api/v1/video6/{project_id}/motion/regenerate 응답"""
    project_id: str
    scene_index: int
    motion_prompt: str
    motion_prompt_ko: str
    message: str


# =============================================================================
# Step 4: 동영상 렌더 API (기존 호환)
# =============================================================================

class VideoRenderRequest(BaseModel):
    """POST /api/v1/video6/{project_id}/render 요청"""
    plan_draft: VideoPlanDraftV1


class VideoRenderResponse(BaseModel):
    """POST /api/v1/video6/{project_id}/render 응답"""
    job_id: str
    status: VideoProjectStatus
    estimated_time_sec: Optional[int] = None
    estimated_cost: Optional[float] = None  # AI 영상 생성 비용


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
    # 4단계 플로우 상태
    current_step: int = 1  # 1: 스크립트, 2: 이미지, 3: 모션, 4: 렌더
    step_description: str = ""
    images_pending_approval: int = 0  # 승인 대기 중인 이미지 수
    motions_pending_approval: int = 0  # 승인 대기 중인 모션 프롬프트 수


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
    user_id: Optional[UUID] = None  # 생성자 ID (회원 시스템 구현 전 Optional)
    project_id: Optional[UUID] = None  # 연결할 프로젝트 ID
    name: Optional[str] = None
    concept_board_id: Optional[str] = None


class VideoProjectCreateResponse(BaseModel):
    """POST /api/v1/video6/projects 응답"""
    video_project_id: str
    status: VideoProjectStatus
    created_at: str
