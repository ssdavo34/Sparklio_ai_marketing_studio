"""
Shorts Video Generator

숏폼 영상 생성 통합 서비스
- 스크립트 생성 (LLM)
- 이미지 생성 (선택적)
- AI 영상 생성 (HunyuanVideo)
- 최종 조립 (VideoBuilder)

작성일: 2025-12-06
"""

import logging
import uuid
from typing import Dict, Any, Optional, List
from dataclasses import dataclass
from datetime import datetime

logger = logging.getLogger(__name__)


@dataclass
class ShortsProject:
    """숏폼 프로젝트"""
    id: str
    title: str
    status: str = "draft"  # draft, generating, completed, failed
    script: Optional[Dict] = None
    scenes: Optional[List[Dict]] = None
    video_url: Optional[str] = None
    created_at: datetime = None
    updated_at: datetime = None


class ShortsGenerator:
    """
    숏폼 영상 생성 통합 서비스

    전체 플로우:
    1. 스크립트 생성 (LLM으로 씬 구성)
    2. 이미지 생성 (각 씬별 이미지)
    3. AI 영상 생성 (Image-to-Video)
    4. TTS 나레이션 생성
    5. 최종 영상 조립
    """

    def __init__(
        self,
        hunyuan_provider=None,
        video_builder=None,
        llm_client=None
    ):
        self.hunyuan_provider = hunyuan_provider
        self.video_builder = video_builder
        self.llm_client = llm_client

    async def create_project(self, title: str, prompt: str) -> ShortsProject:
        """새 프로젝트 생성"""
        project = ShortsProject(
            id=f"shorts_{uuid.uuid4().hex[:8]}",
            title=title,
            status="draft",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )

        logger.info(f"[ShortsGenerator] Created project: {project.id}")
        return project

    async def generate_script(
        self,
        project: ShortsProject,
        topic: str,
        duration_sec: int = 30,
        style: str = "engaging",
        num_scenes: int = 5
    ) -> Dict[str, Any]:
        """
        스크립트 생성

        Args:
            project: 프로젝트
            topic: 영상 주제
            duration_sec: 목표 영상 길이
            style: 스타일 (engaging, educational, promotional)
            num_scenes: 씬 개수

        Returns:
            script: 생성된 스크립트
        """
        logger.info(f"[ShortsGenerator] Generating script for: {topic}")

        # LLM으로 스크립트 생성 (간단한 예시)
        scene_duration = duration_sec / num_scenes

        script = {
            "project_id": project.id,
            "title": project.title,
            "topic": topic,
            "duration_sec": duration_sec,
            "style": style,
            "scenes": [],
            "audio": {
                "tts_voice": "ko-KR-SunHiNeural",
                "bgm_track": "upbeat_corporate_01.mp3",
                "bgm_volume": 0.3
            }
        }

        # 씬 생성 (실제로는 LLM 사용)
        for i in range(num_scenes):
            scene = {
                "scene_number": i + 1,
                "duration_seconds": scene_duration,
                "narration": f"씬 {i + 1}의 나레이션입니다.",
                "image_prompt": f"Scene {i + 1}: Professional marketing visual for {topic}",
                "motion_prompt": "Gentle camera pan with subtle zoom",
                "text_overlay": f"포인트 {i + 1}",
                "transition": "fade"
            }
            script["scenes"].append(scene)

        project.script = script
        project.status = "script_ready"
        project.updated_at = datetime.utcnow()

        logger.info(f"[ShortsGenerator] Script generated: {num_scenes} scenes")
        return script

    async def generate_images(
        self,
        project: ShortsProject,
        image_provider=None
    ) -> Dict[int, str]:
        """
        씬별 이미지 생성

        Args:
            project: 프로젝트
            image_provider: 이미지 생성 Provider (ZImage, ComfyUI 등)

        Returns:
            images: 씬 번호 → 이미지 URL 매핑
        """
        if not project.script:
            raise ValueError("Script not generated")

        images = {}
        scenes = project.script.get("scenes", [])

        for scene in scenes:
            scene_num = scene.get("scene_number")
            prompt = scene.get("image_prompt", "")

            # TODO: 실제 이미지 생성 구현
            # 현재는 플레이스홀더
            images[scene_num] = f"https://placeholder.com/scene_{scene_num}.png"

            logger.info(f"[ShortsGenerator] Image generated for scene {scene_num}")

        project.scenes = scenes
        project.status = "images_ready"
        project.updated_at = datetime.utcnow()

        return images

    async def generate_ai_videos(
        self,
        project: ShortsProject,
        images: Dict[int, str]
    ) -> Dict[int, str]:
        """
        Image-to-Video 생성

        Args:
            project: 프로젝트
            images: 씬별 이미지 URL

        Returns:
            videos: 씬 번호 → 비디오 URL 매핑
        """
        if not self.hunyuan_provider:
            from app.services.media.providers import get_hunyuan_provider
            self.hunyuan_provider = get_hunyuan_provider()

        videos = {}
        scenes = project.script.get("scenes", [])

        for scene in scenes:
            scene_num = scene.get("scene_number")
            image_url = images.get(scene_num)
            motion_prompt = scene.get("motion_prompt", "")

            if not image_url:
                continue

            try:
                result = await self.hunyuan_provider.generate(
                    prompt=motion_prompt,
                    task="image_to_video",
                    media_type="video",
                    options={
                        "image_url": image_url,
                        "width": 720,
                        "height": 480,
                        "frames": 75  # 3초
                    }
                )

                video_data = result.outputs[0].data
                videos[scene_num] = video_data

                logger.info(f"[ShortsGenerator] AI video generated for scene {scene_num}")

            except Exception as e:
                logger.error(f"[ShortsGenerator] Failed to generate AI video: {e}")
                videos[scene_num] = None

        project.status = "videos_ready"
        project.updated_at = datetime.utcnow()

        return videos

    async def build_final_video(
        self,
        project: ShortsProject,
        images: Dict[int, str]
    ) -> str:
        """
        최종 영상 조립

        Args:
            project: 프로젝트
            images: 씬별 이미지 URL

        Returns:
            video_url: 최종 영상 URL
        """
        if not self.video_builder:
            from app.services.video.builder import get_video_builder
            self.video_builder = get_video_builder()

        try:
            video_path = await self.video_builder.build_shorts_video(
                script=project.script,
                images=images
            )

            project.video_url = video_path
            project.status = "completed"
            project.updated_at = datetime.utcnow()

            logger.info(f"[ShortsGenerator] Final video built: {video_path}")
            return video_path

        except Exception as e:
            project.status = "failed"
            project.updated_at = datetime.utcnow()
            logger.error(f"[ShortsGenerator] Failed to build video: {e}")
            raise


# Singleton
_shorts_generator: Optional[ShortsGenerator] = None


def get_shorts_generator() -> ShortsGenerator:
    """ShortsGenerator 인스턴스 반환"""
    global _shorts_generator

    if _shorts_generator is None:
        _shorts_generator = ShortsGenerator()

    return _shorts_generator
