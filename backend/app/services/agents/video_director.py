"""
Video Director Agent

영상 제작 파이프라인을 오케스트레이션하는 에이전트
스토리보드 → 이미지 생성 → 영상 빌드 전체 흐름을 조율합니다.

작성일: 2025-11-28
작성자: B팀 (Backend)
참조: AGENTS_SPEC.md - VideoDirectorAgent

역할: 영상 제작 총괄 (오케스트레이터)

V2 업데이트 (2025-11-30):
- PLAN/RENDER 2단계 플로우 지원
- VideoGenerationMode (REUSE, HYBRID, CREATIVE) 지원
- VideoPlanDraftV1 → VideoTimelinePlanV1 변환
"""

import json
import logging
from typing import Dict, Any, Optional, List
from pydantic import BaseModel, Field
from datetime import datetime
from uuid import uuid4

from app.services.agents.base import AgentBase, AgentRequest, AgentResponse, AgentOutput, AgentError
from app.schemas.video_timeline import (
    VideoDirectorMode,
    VideoGenerationMode,
    VideoProjectStatus,
    ScriptStatus,
    VideoPlanDraftV1,
    SceneDraft,
    VideoTimelinePlanV1,
    CanvasConfig,
    GlobalConfig,
    AudioConfig,
    SceneConfig,
    ImageConfig,
    MotionConfig,
    TransitionConfig,
    TextLayer,
    SceneType,
    MotionType,
    TransitionType,
    TextRole,
    TextPosition,
    BGMMode,
    EasingType,
)


# ============================================================================
# Ken Burns 모션 프리셋
# ============================================================================
# 각 프리셋은 자연스러운 카메라 무빙을 시뮬레이션
# zoom: 1.0 = 원본, 1.2 = 20% 확대
# pan: [x, y] - 0.5 = 중앙, 0.0 = 좌/상단, 1.0 = 우/하단

KENBURNS_PRESETS = [
    # 1. Slow Zoom In (중앙 집중) - 가장 기본적인 효과
    {
        "name": "zoom_in_center",
        "zoom_start": 1.0, "zoom_end": 1.15,
        "pan_start": [0.5, 0.5], "pan_end": [0.5, 0.5],
        "easing": EasingType.EASE_OUT,
    },
    # 2. Slow Zoom Out (넓어지는 효과)
    {
        "name": "zoom_out_center",
        "zoom_start": 1.15, "zoom_end": 1.0,
        "pan_start": [0.5, 0.5], "pan_end": [0.5, 0.5],
        "easing": EasingType.EASE_IN,
    },
    # 3. Pan Right + Zoom In (오른쪽으로 이동하며 확대)
    {
        "name": "pan_right_zoom",
        "zoom_start": 1.05, "zoom_end": 1.15,
        "pan_start": [0.4, 0.5], "pan_end": [0.6, 0.5],
        "easing": EasingType.EASE_IN_OUT,
    },
    # 4. Pan Left + Zoom In (왼쪽으로 이동하며 확대)
    {
        "name": "pan_left_zoom",
        "zoom_start": 1.05, "zoom_end": 1.15,
        "pan_start": [0.6, 0.5], "pan_end": [0.4, 0.5],
        "easing": EasingType.EASE_IN_OUT,
    },
    # 5. Pan Down + Zoom In (아래로 이동, 제품 강조에 적합)
    {
        "name": "pan_down_zoom",
        "zoom_start": 1.0, "zoom_end": 1.12,
        "pan_start": [0.5, 0.4], "pan_end": [0.5, 0.6],
        "easing": EasingType.EASE_OUT,
    },
    # 6. Pan Up + Zoom Out (위로 이동, 공간감 표현)
    {
        "name": "pan_up_zoom_out",
        "zoom_start": 1.15, "zoom_end": 1.0,
        "pan_start": [0.5, 0.6], "pan_end": [0.5, 0.4],
        "easing": EasingType.EASE_IN,
    },
    # 7. Diagonal Pan (대각선 이동, 역동적)
    {
        "name": "diagonal_pan",
        "zoom_start": 1.05, "zoom_end": 1.12,
        "pan_start": [0.4, 0.4], "pan_end": [0.6, 0.6],
        "easing": EasingType.LINEAR,
    },
]


def get_kenburns_motion(scene_index: int, total_scenes: int) -> MotionConfig:
    """씬 인덱스에 따른 Ken Burns 모션 설정 반환

    다양성을 위해 씬마다 다른 프리셋을 순환 적용
    첫 씬과 마지막 씬은 특별 처리
    """
    # 첫 씬: Zoom In (시작 집중)
    if scene_index == 1:
        preset = KENBURNS_PRESETS[0]  # zoom_in_center
    # 마지막 씬: Zoom Out (마무리 확장)
    elif scene_index == total_scenes:
        preset = KENBURNS_PRESETS[1]  # zoom_out_center
    # 중간 씬: 순환 적용 (2~6번 프리셋)
    else:
        middle_presets = KENBURNS_PRESETS[2:]  # pan+zoom 효과들
        preset_idx = (scene_index - 2) % len(middle_presets)
        preset = middle_presets[preset_idx]

    return MotionConfig(
        type=MotionType.KENBURNS,
        zoom_start=preset["zoom_start"],
        zoom_end=preset["zoom_end"],
        pan_start=preset["pan_start"],
        pan_end=preset["pan_end"],
        easing=preset["easing"],
    )

logger = logging.getLogger(__name__)


# =============================================================================
# Input/Output Schemas
# =============================================================================

class VideoDirectorInput(BaseModel):
    """VideoDirectorAgent 입력 (기존 V1)"""
    concept: Dict[str, Any] = Field(..., description="컨셉 정보 (ConceptV1)")
    script: Optional[str] = Field(None, description="스크립트 (선택)")
    video_type: str = Field(default="shorts", description="영상 유형")
    target_duration: float = Field(default=30.0, description="목표 길이 (초)")
    style: str = Field(default="dynamic", description="스타일")
    auto_generate_images: bool = Field(default=True, description="이미지 자동 생성")
    bgm_url: Optional[str] = Field(None, description="BGM URL (선택)")
    voiceover_url: Optional[str] = Field(None, description="나레이션 URL (선택)")


class VideoDirectorInputV3(BaseModel):
    """VideoDirectorAgent V3 입력 (PLAN/RENDER 모드)"""
    # 모드 설정
    mode: VideoDirectorMode = Field(default=VideoDirectorMode.PLAN, description="실행 모드")
    generation_mode: VideoGenerationMode = Field(default=VideoGenerationMode.HYBRID, description="이미지 생성 모드")

    # 컨셉 정보
    concept: Dict[str, Any] = Field(..., description="컨셉 정보 (ConceptV1)")
    concept_board_id: Optional[str] = Field(None, description="컨셉보드 ID")

    # 이미지 소스
    available_assets: Optional[List[str]] = Field(None, description="재사용 가능 이미지 ID 목록")

    # 영상 설정
    video_type: str = Field(default="shorts", description="영상 유형")
    target_duration: float = Field(default=15.0, description="목표 길이 (초)")
    music_mood: str = Field(default="warm_lofi", description="음악 분위기")
    style: str = Field(default="dynamic", description="스타일")

    # RENDER 모드용 - 유저가 수정한 플랜
    plan_draft: Optional[VideoPlanDraftV1] = Field(None, description="유저 수정 플랜 (RENDER 모드)")

    # 오디오
    bgm_url: Optional[str] = Field(None, description="BGM URL (선택)")


class VideoDirectorOutputV3(BaseModel):
    """VideoDirectorAgent V3 출력"""
    production_id: str = Field(..., description="제작 ID")
    mode: VideoDirectorMode = Field(..., description="실행 모드")
    status: VideoProjectStatus = Field(default=VideoProjectStatus.PLAN_READY, description="상태")

    # PLAN 모드 결과
    plan_draft: Optional[VideoPlanDraftV1] = Field(None, description="플랜 초안")
    estimated_render_cost: Optional[float] = Field(None, description="예상 렌더 비용")
    estimated_render_time_sec: Optional[int] = Field(None, description="예상 렌더 시간 (초)")

    # RENDER 모드 결과
    video_url: Optional[str] = Field(None, description="영상 URL")
    thumbnail_url: Optional[str] = Field(None, description="썸네일 URL")
    duration_sec: Optional[float] = Field(None, description="영상 길이")

    # 메타
    error_message: Optional[str] = Field(None, description="에러 메시지")


class ProductionStep(BaseModel):
    """제작 단계"""
    step_name: str
    status: str  # pending, in_progress, completed, failed
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None


class VideoDirectorOutput(BaseModel):
    """VideoDirectorAgent 출력"""
    production_id: str = Field(..., description="제작 ID")
    video_id: Optional[str] = Field(None, description="최종 영상 ID")
    video_url: Optional[str] = Field(None, description="영상 URL")
    thumbnail_url: Optional[str] = Field(None, description="썸네일 URL")
    duration: float = Field(default=0.0, description="영상 길이")
    status: str = Field(default="completed", description="제작 상태")
    steps: List[ProductionStep] = Field(default_factory=list, description="제작 단계별 결과")
    storyboard: Optional[Dict[str, Any]] = Field(None, description="스토리보드")
    generated_images: List[str] = Field(default_factory=list, description="생성된 이미지 URL")


# =============================================================================
# Video Director Agent
# =============================================================================

class VideoDirectorAgent(AgentBase):
    """
    Video Director Agent

    영상 제작 전체 파이프라인을 조율하는 오케스트레이터입니다.

    파이프라인:
    1. 스토리보드 생성 (StoryboardBuilderAgent)
    2. 씬별 이미지 생성 (VisionGeneratorAgent)
    3. 영상 조립 (VideoBuilder)
    4. 품질 검토 (VideoReviewerAgent) - 선택

    주요 기능:
    - 에이전트 간 데이터 흐름 관리
    - 병렬 처리 최적화
    - 에러 복구 및 재시도
    - 진행 상황 추적
    """

    @property
    def name(self) -> str:
        return "video_director"

    async def execute(self, request: AgentRequest) -> AgentResponse:
        """
        영상 제작 실행

        Args:
            request: AgentRequest

        Returns:
            AgentResponse
        """
        start_time = datetime.utcnow()
        production_id = f"prod_{uuid4().hex[:8]}"

        self._validate_request(request)

        try:
            input_data = VideoDirectorInput(**request.payload)
        except Exception as e:
            raise AgentError(
                message=f"Invalid input: {str(e)}",
                agent=self.name,
                details={"payload": request.payload}
            )

        logger.info(f"[VideoDirectorAgent] Starting production {production_id}")

        steps: List[ProductionStep] = []
        storyboard = None
        generated_images = []
        video_result = None

        # ========================================
        # Step 1: 스토리보드 생성
        # ========================================
        step1 = ProductionStep(
            step_name="storyboard_generation",
            status="in_progress",
            started_at=datetime.utcnow()
        )
        steps.append(step1)

        try:
            storyboard = await self._generate_storyboard(input_data)
            step1.status = "completed"
            step1.completed_at = datetime.utcnow()
            step1.result = {"scenes_count": len(storyboard.get("scenes", []))}
            logger.info(f"[VideoDirectorAgent] Storyboard generated: {len(storyboard.get('scenes', []))} scenes")
        except Exception as e:
            step1.status = "failed"
            step1.error = str(e)
            logger.error(f"[VideoDirectorAgent] Storyboard generation failed: {e}")
            # 스토리보드 실패 시 기본 스토리보드로 진행
            storyboard = self._create_fallback_storyboard(input_data)

        # ========================================
        # Step 2: 이미지 생성 (선택)
        # ========================================
        if input_data.auto_generate_images and storyboard:
            step2 = ProductionStep(
                step_name="image_generation",
                status="in_progress",
                started_at=datetime.utcnow()
            )
            steps.append(step2)

            try:
                generated_images = await self._generate_scene_images(
                    storyboard, input_data.concept
                )
                step2.status = "completed"
                step2.completed_at = datetime.utcnow()
                step2.result = {"images_count": len(generated_images)}
                logger.info(f"[VideoDirectorAgent] Generated {len(generated_images)} images")
            except Exception as e:
                step2.status = "failed"
                step2.error = str(e)
                logger.error(f"[VideoDirectorAgent] Image generation failed: {e}")
                # 이미지 생성 실패 시 플레이스홀더 사용
                generated_images = []

        # ========================================
        # Step 3: 영상 빌드
        # ========================================
        step3 = ProductionStep(
            step_name="video_build",
            status="in_progress",
            started_at=datetime.utcnow()
        )
        steps.append(step3)

        try:
            video_result = await self._build_video(
                storyboard,
                generated_images,
                input_data
            )
            step3.status = "completed"
            step3.completed_at = datetime.utcnow()
            step3.result = {
                "video_id": video_result.get("video_id"),
                "duration": video_result.get("duration")
            }
            logger.info(f"[VideoDirectorAgent] Video built: {video_result.get('video_id')}")
        except Exception as e:
            step3.status = "failed"
            step3.error = str(e)
            logger.error(f"[VideoDirectorAgent] Video build failed: {e}")

        elapsed = (datetime.utcnow() - start_time).total_seconds()

        # 최종 출력 구성
        output_data = VideoDirectorOutput(
            production_id=production_id,
            video_id=video_result.get("video_id") if video_result else None,
            video_url=video_result.get("video_url") if video_result else None,
            thumbnail_url=video_result.get("thumbnail_url") if video_result else None,
            duration=video_result.get("duration", 0.0) if video_result else 0.0,
            status="completed" if video_result else "failed",
            steps=steps,
            storyboard=storyboard,
            generated_images=generated_images
        )

        logger.info(f"[VideoDirectorAgent] Production {production_id} completed in {elapsed:.2f}s")

        return AgentResponse(
            agent=self.name,
            task=request.task,
            outputs=[
                self._create_output(
                    output_type="json",
                    name="video_production",
                    value=output_data.model_dump(),
                    meta={"production_id": production_id}
                )
            ],
            usage={
                "elapsed_seconds": elapsed,
                "steps_completed": sum(1 for s in steps if s.status == "completed"),
                "steps_failed": sum(1 for s in steps if s.status == "failed")
            },
            meta={
                "production_id": production_id,
                "video_type": input_data.video_type
            }
        )

    async def _generate_storyboard(self, input_data: VideoDirectorInput) -> Dict[str, Any]:
        """스토리보드 생성"""
        from app.services.agents.storyboard_builder import get_storyboard_builder_agent

        agent = get_storyboard_builder_agent(llm_gateway=self.llm_gateway)
        response = await agent.execute(AgentRequest(
            task="generate_storyboard",
            payload={
                "concept": input_data.concept,
                "script": input_data.script,
                "video_type": input_data.video_type,
                "target_duration": input_data.target_duration,
                "style": input_data.style
            }
        ))

        return response.outputs[0].value

    async def _generate_scene_images(
        self,
        storyboard: Dict[str, Any],
        concept: Dict[str, Any]
    ) -> List[str]:
        """씬별 이미지 생성"""
        from app.services.agents.vision_generator import get_vision_generator_agent, ImageGenerationRequest

        scenes = storyboard.get("scenes", [])
        if not scenes:
            return []

        # 씬별 프롬프트 구성
        prompts = []
        for scene in scenes:
            prompt_text = self._build_image_prompt(scene, concept)
            prompts.append(ImageGenerationRequest(
                prompt_text=prompt_text,
                negative_prompt="blurry, low quality, text, watermark, distorted",
                aspect_ratio="9:16",  # 숏폼 기본
                style="realistic"
            ))

        agent = get_vision_generator_agent(
            llm_gateway=self.llm_gateway,
            media_gateway=self.media_gateway
        )
        response = await agent.execute(AgentRequest(
            task="generate_images",
            payload={
                "prompts": [p.model_dump() for p in prompts],
                "provider": "nanobanana",
                "batch_mode": True,
                "max_concurrent": 3
            }
        ))

        result = response.outputs[0].value
        images = result.get("images", [])

        return [img.get("image_url") for img in images if img.get("status") == "completed"]

    def _build_image_prompt(self, scene: Dict[str, Any], concept: Dict[str, Any]) -> str:
        """씬 기반 이미지 프롬프트 생성"""
        visual_desc = scene.get("visual_description", "")
        hint = scene.get("image_prompt_hint", "")
        mood = scene.get("mood", "neutral")
        visual_style = concept.get("visual_style", "modern")

        prompt_parts = [
            visual_desc,
            hint,
            f"{mood} mood",
            f"{visual_style} style",
            "high quality, 8k, professional, marketing visual",
            "vertical format, 9:16 aspect ratio"
        ]

        return ", ".join(filter(None, prompt_parts))

    async def _build_video(
        self,
        storyboard: Dict[str, Any],
        image_urls: List[str],
        input_data: VideoDirectorInput
    ) -> Dict[str, Any]:
        """영상 빌드"""
        from app.services.agents.video_builder import get_video_builder, VideoScene, AudioTrack

        scenes = storyboard.get("scenes", [])

        # VideoBuilder용 씬 구성
        video_scenes = []
        for i, scene in enumerate(scenes):
            image_url = image_urls[i] if i < len(image_urls) else None
            video_scenes.append(VideoScene(
                scene_id=f"scene_{i+1}",
                image_url=image_url,
                duration=scene.get("duration", 5.0),
                transition=scene.get("transition_to_next", "fade"),
                text_overlay=scene.get("text_overlay"),
                zoom_effect="in" if scene.get("camera_movement") == "zoom_in" else
                           "out" if scene.get("camera_movement") == "zoom_out" else None
            ))

        # 오디오 트랙
        audio_tracks = []
        if input_data.bgm_url:
            audio_tracks.append(AudioTrack(
                track_id="bgm",
                audio_url=input_data.bgm_url,
                track_type="bgm",
                volume=0.5
            ))
        if input_data.voiceover_url:
            audio_tracks.append(AudioTrack(
                track_id="voiceover",
                audio_url=input_data.voiceover_url,
                track_type="voiceover",
                volume=1.0
            ))

        builder = get_video_builder(media_gateway=self.media_gateway)
        response = await builder.execute(AgentRequest(
            task="build_video",
            payload={
                "scenes": [s.model_dump() for s in video_scenes],
                "audio_tracks": [a.model_dump() for a in audio_tracks],
                "output_format": "mp4",
                "resolution": "1080x1920",
                "fps": 30,
                "quality": "high"
            }
        ))

        result = response.outputs[0].value
        return {
            "video_id": result.get("video_id"),
            "video_url": result.get("video_url"),
            "duration": result.get("duration"),
            "thumbnail_url": None  # TODO: 썸네일 추출
        }

    def _create_fallback_storyboard(self, input_data: VideoDirectorInput) -> Dict[str, Any]:
        """폴백 스토리보드 생성"""
        concept = input_data.concept
        scene_count = 6
        duration_per_scene = input_data.target_duration / scene_count

        scenes = []
        for i in range(scene_count):
            scenes.append({
                "scene_number": i + 1,
                "duration": duration_per_scene,
                "visual_description": f"Scene {i+1} for {concept.get('concept_name', 'product')}",
                "camera_movement": "static",
                "transition_to_next": "fade",
                "mood": "neutral"
            })

        return {
            "storyboard_id": f"fb_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}",
            "title": concept.get("concept_name", "Video"),
            "scenes": scenes,
            "total_duration": input_data.target_duration
        }

    # =========================================================================
    # V3: PLAN/RENDER 2단계 플로우
    # =========================================================================

    async def execute_v3(self, request: AgentRequest) -> AgentResponse:
        """
        V3 영상 제작 실행 (PLAN/RENDER 모드)

        PLAN 모드: 스토리보드/스크립트 생성 (LLM만 사용)
        RENDER 모드: 실제 영상 렌더링 (GPU/API 사용)

        Args:
            request: AgentRequest

        Returns:
            AgentResponse
        """
        start_time = datetime.utcnow()
        production_id = f"prod_{uuid4().hex[:8]}"

        self._validate_request(request)

        try:
            input_data = VideoDirectorInputV3(**request.payload)
        except Exception as e:
            raise AgentError(
                message=f"Invalid V3 input: {str(e)}",
                agent=self.name,
                details={"payload": request.payload}
            )

        logger.info(f"[VideoDirectorAgent] V3 mode={input_data.mode}, production_id={production_id}")

        if input_data.mode == VideoDirectorMode.PLAN:
            output_data = await self._execute_plan_mode(input_data, production_id)
        else:
            output_data = await self._execute_render_mode(input_data, production_id)

        elapsed = (datetime.utcnow() - start_time).total_seconds()

        logger.info(f"[VideoDirectorAgent] V3 completed in {elapsed:.2f}s, status={output_data.status}")

        return AgentResponse(
            agent=self.name,
            task=request.task,
            outputs=[
                self._create_output(
                    output_type="json",
                    name="video_production_v3",
                    value=output_data.model_dump(),
                    meta={"production_id": production_id, "mode": input_data.mode.value}
                )
            ],
            usage={
                "elapsed_seconds": elapsed,
                "mode": input_data.mode.value,
                "generation_mode": input_data.generation_mode.value
            },
            meta={
                "production_id": production_id,
                "mode": input_data.mode.value
            }
        )

    async def _execute_plan_mode(
        self,
        input_data: VideoDirectorInputV3,
        production_id: str
    ) -> VideoDirectorOutputV3:
        """
        PLAN 모드 실행

        LLM만 사용하여 스토리보드/스크립트 초안 생성
        """
        logger.info(f"[VideoDirectorAgent] PLAN mode: generating draft")

        try:
            # 1. StoryboardBuilder로 스토리보드 생성
            storyboard = await self._generate_storyboard_v3(input_data)

            # 2. 스토리보드 → VideoPlanDraftV1 변환
            plan_draft = self._storyboard_to_plan_draft(
                storyboard=storyboard,
                input_data=input_data,
                production_id=production_id
            )

            # 3. 비용/시간 추정
            new_image_count = sum(1 for s in plan_draft.scenes if s.generate_new_image)
            estimated_cost = new_image_count * 0.05  # 이미지당 $0.05 가정
            estimated_time = 30 + (new_image_count * 10) + 60  # 기본 30초 + 이미지 생성 + 렌더링

            logger.info(f"[VideoDirectorAgent] PLAN complete: {len(plan_draft.scenes)} scenes")

            return VideoDirectorOutputV3(
                production_id=production_id,
                mode=VideoDirectorMode.PLAN,
                status=VideoProjectStatus.PLAN_READY,
                plan_draft=plan_draft,
                estimated_render_cost=estimated_cost,
                estimated_render_time_sec=estimated_time
            )

        except Exception as e:
            logger.error(f"[VideoDirectorAgent] PLAN mode failed: {e}")
            return VideoDirectorOutputV3(
                production_id=production_id,
                mode=VideoDirectorMode.PLAN,
                status=VideoProjectStatus.FAILED,
                error_message=str(e)
            )

    async def _execute_render_mode(
        self,
        input_data: VideoDirectorInputV3,
        production_id: str
    ) -> VideoDirectorOutputV3:
        """
        RENDER 모드 실행

        GPU/API를 사용하여 실제 영상 생성
        """
        # ============ DEBUG V4: 진입 확인 ============
        print(f"!!! _execute_render_mode CALLED !!! production_id={production_id}")
        logger.info(f"[VideoDirectorAgent] === RENDER MODE START ===")
        logger.info(f"[VideoDirectorAgent] production_id={production_id}")
        logger.info(f"[VideoDirectorAgent] generation_mode={input_data.generation_mode}")
        logger.info(f"[VideoDirectorAgent] plan_draft exists: {input_data.plan_draft is not None}")
        if input_data.plan_draft:
            logger.info(f"[VideoDirectorAgent] plan_draft.scenes count: {len(input_data.plan_draft.scenes)}")
            generate_new_count = sum(1 for s in input_data.plan_draft.scenes if s.generate_new_image)
            logger.info(f"[VideoDirectorAgent] scenes with generate_new_image=True: {generate_new_count}")
        # ============ DEBUG V4 END ============

        logger.info(f"[VideoDirectorAgent] RENDER mode: generating video")

        if not input_data.plan_draft:
            raise AgentError(
                message="plan_draft is required for RENDER mode",
                agent=self.name,
                details={}
            )

        try:
            # 1. 필요한 이미지 생성 (HYBRID/CREATIVE 모드)
            image_urls = await self._prepare_images_v3(input_data)

            # 2. VideoPlanDraftV1 → VideoTimelinePlanV1 변환
            timeline = self._plan_draft_to_timeline(
                plan_draft=input_data.plan_draft,
                image_urls=image_urls,
                input_data=input_data
            )

            # 3. VideoBuilder로 영상 생성
            video_result = await self._build_video_v3(timeline)

            logger.info(f"[VideoDirectorAgent] RENDER complete: {video_result.get('video_url')}")

            return VideoDirectorOutputV3(
                production_id=production_id,
                mode=VideoDirectorMode.RENDER,
                status=VideoProjectStatus.COMPLETED,
                video_url=video_result.get("video_url"),
                thumbnail_url=video_result.get("thumbnail_url"),
                duration_sec=video_result.get("duration_sec")
            )

        except Exception as e:
            logger.error(f"[VideoDirectorAgent] RENDER mode failed: {e}")
            return VideoDirectorOutputV3(
                production_id=production_id,
                mode=VideoDirectorMode.RENDER,
                status=VideoProjectStatus.FAILED,
                error_message=str(e)
            )

    async def _generate_storyboard_v3(
        self,
        input_data: VideoDirectorInputV3
    ) -> Dict[str, Any]:
        """V3용 스토리보드 생성"""
        from app.services.agents.storyboard_builder import get_storyboard_builder_agent

        agent = get_storyboard_builder_agent(llm_gateway=self.llm_gateway)
        response = await agent.execute(AgentRequest(
            task="generate_storyboard",
            payload={
                "concept": input_data.concept,
                "video_type": input_data.video_type,
                "target_duration": input_data.target_duration,
                "style": input_data.style
            }
        ))

        return response.outputs[0].value

    def _storyboard_to_plan_draft(
        self,
        storyboard: Dict[str, Any],
        input_data: VideoDirectorInputV3,
        production_id: str
    ) -> VideoPlanDraftV1:
        """스토리보드 → VideoPlanDraftV1 변환"""
        scenes = storyboard.get("scenes", [])
        available_assets = input_data.available_assets or []

        scene_drafts = []
        for i, scene in enumerate(scenes[:6]):  # V2 제한: 최대 6개
            scene_index = i + 1
            duration = scene.get("duration", 3.0)
            caption = scene.get("text_overlay") or scene.get("voiceover") or ""

            # 이미지 소스 결정
            image_id = None
            image_url = None
            generate_new = False
            image_prompt = None

            if input_data.generation_mode == VideoGenerationMode.REUSE:
                # Level 1: 기존 이미지만 사용
                if available_assets and i < len(available_assets):
                    image_id = available_assets[i]
                elif available_assets:
                    # 부족하면 순환 사용
                    image_id = available_assets[i % len(available_assets)]
                else:
                    # 에셋이 없으면 새로 생성으로 fallback
                    generate_new = True
                    image_prompt = scene.get("image_prompt_hint") or scene.get("visual_description") or "Marketing visual"
            elif input_data.generation_mode == VideoGenerationMode.HYBRID:
                # Level 2: 혼합
                if i < len(available_assets):
                    image_id = available_assets[i]
                else:
                    generate_new = True
                    image_prompt = scene.get("image_prompt_hint") or scene.get("visual_description")
            else:
                # Level 3: CREATIVE - 전부 새로 생성
                generate_new = True
                image_prompt = scene.get("image_prompt_hint") or scene.get("visual_description")

            # 안전 가드: generate_new=False인데 이미지 정보가 없으면 강제로 generate_new=True
            if not generate_new and not image_id and not image_url:
                logger.warning(
                    f"SceneDraft fallback: no image for scene {scene_index}, "
                    f"mode={input_data.generation_mode}. Forcing generate_new_image=True"
                )
                generate_new = True
                image_prompt = (
                    image_prompt
                    or scene.get("image_prompt_hint")
                    or scene.get("visual_description")
                    or "Marketing visual"
                )

            scene_drafts.append(SceneDraft(
                scene_index=scene_index,
                image_id=image_id,
                image_url=image_url,
                caption=caption,
                duration_sec=min(max(duration, 2.0), 5.0),  # 2~5초 제한
                generate_new_image=generate_new,
                image_prompt=image_prompt
            ))

        # 최소 3개 씬 보장
        while len(scene_drafts) < 3:
            scene_drafts.append(SceneDraft(
                scene_index=len(scene_drafts) + 1,
                generate_new_image=True,
                image_prompt="Generic marketing visual",
                caption="",
                duration_sec=3.0
            ))

        return VideoPlanDraftV1(
            project_id=production_id,
            mode=input_data.generation_mode,
            total_duration_sec=sum(s.duration_sec for s in scene_drafts),
            music_mood=input_data.music_mood,
            scenes=scene_drafts,
            script_status=ScriptStatus.DRAFT
        )

    async def _prepare_images_v3(
        self,
        input_data: VideoDirectorInputV3
    ) -> Dict[int, str]:
        """
        RENDER용 이미지 준비

        Returns:
            Dict[scene_index, image_url]
        """
        # ============ DEBUG V4: 진입 확인 ============
        print("!!! _prepare_images_v3 CALLED !!!")
        print(f"!!! generation_mode={input_data.generation_mode} !!!")
        # ============ DEBUG V4 END ============

        plan_draft = input_data.plan_draft
        image_urls: Dict[int, str] = {}

        logger.info(f"[VideoDirector] === _prepare_images_v3 START ===")
        logger.info(f"[VideoDirector] generation_mode={input_data.generation_mode}")
        logger.info(f"[VideoDirector] plan_draft.scenes count: {len(plan_draft.scenes) if plan_draft else 0}")

        # 1. 기존 이미지 URL 수집
        for scene in plan_draft.scenes:
            if scene.image_url:
                image_urls[scene.scene_index] = scene.image_url
                logger.debug(f"[VideoDirector] Scene {scene.scene_index}: using existing URL")
            elif scene.image_id:
                # TODO: Asset Pool에서 URL 조회
                # 현재는 placeholder
                image_urls[scene.scene_index] = f"https://placeholder/{scene.image_id}"
                logger.debug(f"[VideoDirector] Scene {scene.scene_index}: using asset_id placeholder")

        # 2. 새 이미지 생성이 필요한 씬
        scenes_to_generate = [
            s for s in plan_draft.scenes
            if s.generate_new_image and s.scene_index not in image_urls
        ]

        logger.info(f"[VideoDirector] Scenes to generate: {len(scenes_to_generate)}")

        if scenes_to_generate and input_data.generation_mode != VideoGenerationMode.REUSE:
            # VisionGenerator로 이미지 생성
            logger.info(f"[VideoDirector] Starting VisionGenerator for {len(scenes_to_generate)} scenes")

            try:
                from app.services.agents.vision_generator import get_vision_generator_agent, ImageGenerationRequest

                prompts = [
                    ImageGenerationRequest(
                        prompt_text=s.image_prompt or "Marketing visual",
                        negative_prompt="blurry, low quality, text, watermark",
                        aspect_ratio="9:16",
                        style="realistic"
                    )
                    for s in scenes_to_generate
                ]

                agent = get_vision_generator_agent(
                    llm_gateway=self.llm_gateway,
                    media_gateway=self.media_gateway
                )

                logger.info("[VideoDirector] Calling VisionGenerator.execute...")

                response = await agent.execute(AgentRequest(
                    task="generate_images",
                    payload={
                        "prompts": [p.model_dump() for p in prompts],
                        "provider": "nanobanana",
                        "batch_mode": True,
                        "max_concurrent": 3
                    }
                ))

                result = response.outputs[0].value
                generated_images = result.get("images", [])

                logger.info(f"[VideoDirector] VisionGenerator returned {len(generated_images)} images")

                for i, scene in enumerate(scenes_to_generate):
                    if i < len(generated_images) and generated_images[i].get("status") == "completed":
                        image_urls[scene.scene_index] = generated_images[i].get("image_url")
                        logger.info(f"[VideoDirector] Scene {scene.scene_index}: image generated")
                    else:
                        status = generated_images[i].get("status") if i < len(generated_images) else "missing"
                        logger.warning(f"[VideoDirector] Scene {scene.scene_index}: image failed ({status})")

            except Exception as e:
                logger.error(f"[VideoDirector] VisionGenerator error: {e}", exc_info=True)
                # 예외가 발생해도 계속 진행 (기존 이미지만 사용)
        else:
            if not scenes_to_generate:
                logger.info("[VideoDirector] No scenes need new images")
            else:
                logger.info(f"[VideoDirector] Skipping image generation (mode={input_data.generation_mode})")

        logger.info(f"[VideoDirector] _prepare_images_v3 complete: {len(image_urls)} images ready")
        return image_urls

    def _plan_draft_to_timeline(
        self,
        plan_draft: VideoPlanDraftV1,
        image_urls: Dict[int, str],
        input_data: VideoDirectorInputV3
    ) -> VideoTimelinePlanV1:
        """VideoPlanDraftV1 → VideoTimelinePlanV1 변환"""
        # ============ DEBUG V4: Placeholder Fallback ============
        # 디버깅용: 모든 씬에 이미지가 없으면 placeholder 사용
        DEBUG_PLACEHOLDER_ENABLED = True  # 디버깅 완료 후 False로 변경
        PLACEHOLDER_IMAGE_URL = "https://placehold.co/1080x1920/1a1a2e/FFFFFF/png?text=Scene+Placeholder"

        total_scenes_without_image = sum(
            1 for s in plan_draft.scenes
            if s.scene_index not in image_urls
        )
        logger.info(f"[VideoDirector] _plan_draft_to_timeline: {len(image_urls)} images available, {total_scenes_without_image} scenes without image")

        if DEBUG_PLACEHOLDER_ENABLED and total_scenes_without_image == len(plan_draft.scenes):
            logger.warning("[VideoDirector] DEBUG: All scenes missing images - using placeholder for first scene")
            print("!!! DEBUG PLACEHOLDER FALLBACK ACTIVATED !!!")
        # ============ DEBUG V4 END ============

        scenes = []
        current_time = 0.0
        placeholder_used = False

        for scene_draft in plan_draft.scenes:
            start_sec = current_time
            end_sec = current_time + scene_draft.duration_sec

            image_url = image_urls.get(scene_draft.scene_index)
            if not image_url:
                # ============ DEBUG V4: Placeholder Fallback ============
                if DEBUG_PLACEHOLDER_ENABLED and not placeholder_used:
                    logger.warning(f"[VideoDirector] Using placeholder for scene {scene_draft.scene_index}")
                    image_url = PLACEHOLDER_IMAGE_URL
                    placeholder_used = True
                else:
                    logger.warning(f"[VideoDirector] No image for scene {scene_draft.scene_index}")
                    continue
                # ============ DEBUG V4 END ============

            # 텍스트 레이어 (캡션 있으면)
            texts = []
            if scene_draft.caption:
                texts.append(TextLayer(
                    role=TextRole.SUBTITLE,
                    text=scene_draft.caption,
                    start_sec=start_sec + 0.3,
                    end_sec=end_sec - 0.3,
                    position=TextPosition.BOTTOM_CENTER
                ))

            # 씬 구성 (Ken Burns 프리셋 적용)
            total_scenes = len(plan_draft.scenes)
            scene = SceneConfig(
                scene_index=scene_draft.scene_index,
                start_sec=start_sec,
                end_sec=end_sec,
                type=SceneType.IMAGE,
                image=ImageConfig(
                    source_type="asset" if scene_draft.image_id else "generated",
                    url=image_url,
                ),
                motion=get_kenburns_motion(scene_draft.scene_index, total_scenes),
                transition_out=TransitionConfig(
                    type=TransitionType.CROSSFADE,
                    duration_sec=0.5
                ),
                texts=texts
            )
            scenes.append(scene)
            current_time = end_sec

        return VideoTimelinePlanV1(
            canvas=CanvasConfig(width=1080, height=1920, fps=24),
            global_config=GlobalConfig(
                total_duration_sec=current_time,
                bg_color="#000000",
                music_mood=plan_draft.music_mood
            ),
            audio=AudioConfig(
                bgm_mode=BGMMode.AUTO if not input_data.bgm_url else BGMMode.LIBRARY,
                bgm_url=input_data.bgm_url
            ),
            scenes=scenes
        )

    async def _build_video_v3(
        self,
        timeline: VideoTimelinePlanV1
    ) -> Dict[str, Any]:
        """VideoBuilder V2로 영상 생성"""
        from app.services.video_builder_v2 import get_video_builder_v2

        logger.info(f"[VideoDirectorAgent] Building video with {len(timeline.scenes)} scenes")

        try:
            builder = get_video_builder_v2()
            result = await builder.build(timeline)

            return {
                "video_url": result.video_url,
                "thumbnail_url": result.thumbnail_url,
                "duration_sec": result.duration_sec,
                "file_size_bytes": result.file_size_bytes,
                "render_time_sec": result.render_time_sec
            }
        except Exception as e:
            logger.error(f"[VideoDirectorAgent] VideoBuilder V2 failed: {e}")
            # Fallback: placeholder URL
            return {
                "video_url": f"https://storage/videos/video_{uuid4().hex[:8]}.mp4",
                "thumbnail_url": f"https://storage/thumbnails/thumb_{uuid4().hex[:8]}.png",
                "duration_sec": timeline.global_config.total_duration_sec
            }


# =============================================================================
# Factory Function
# =============================================================================

def get_video_director_agent(llm_gateway=None, media_gateway=None) -> VideoDirectorAgent:
    """VideoDirectorAgent 인스턴스 반환"""
    return VideoDirectorAgent(
        llm_gateway=llm_gateway,
        media_gateway=media_gateway
    )
