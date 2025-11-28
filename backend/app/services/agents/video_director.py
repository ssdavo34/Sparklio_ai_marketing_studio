"""
Video Director Agent

영상 제작 파이프라인을 오케스트레이션하는 에이전트
스토리보드 → 이미지 생성 → 영상 빌드 전체 흐름을 조율합니다.

작성일: 2025-11-28
작성자: B팀 (Backend)
참조: AGENTS_SPEC.md - VideoDirectorAgent

역할: 영상 제작 총괄 (오케스트레이터)
"""

import json
import logging
from typing import Dict, Any, Optional, List
from pydantic import BaseModel, Field
from datetime import datetime
from uuid import uuid4

from app.services.agents.base import AgentBase, AgentRequest, AgentResponse, AgentOutput, AgentError

logger = logging.getLogger(__name__)


# =============================================================================
# Input/Output Schemas
# =============================================================================

class VideoDirectorInput(BaseModel):
    """VideoDirectorAgent 입력"""
    concept: Dict[str, Any] = Field(..., description="컨셉 정보 (ConceptV1)")
    script: Optional[str] = Field(None, description="스크립트 (선택)")
    video_type: str = Field(default="shorts", description="영상 유형")
    target_duration: float = Field(default=30.0, description="목표 길이 (초)")
    style: str = Field(default="dynamic", description="스타일")
    auto_generate_images: bool = Field(default=True, description="이미지 자동 생성")
    bgm_url: Optional[str] = Field(None, description="BGM URL (선택)")
    voiceover_url: Optional[str] = Field(None, description="나레이션 URL (선택)")


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


# =============================================================================
# Factory Function
# =============================================================================

def get_video_director_agent(llm_gateway=None, media_gateway=None) -> VideoDirectorAgent:
    """VideoDirectorAgent 인스턴스 반환"""
    return VideoDirectorAgent(
        llm_gateway=llm_gateway,
        media_gateway=media_gateway
    )
