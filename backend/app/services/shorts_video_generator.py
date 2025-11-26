"""
Shorts Video Generator (Demo Day)

숏폼 영상 생성 파이프라인
Script → Image → TTS → Video 전체 흐름

작성일: 2025-11-26
작성자: B팀 (Backend)

파이프라인:
1. ShortsScriptAgent: 씬별 스크립트 생성
2. VisualPromptAgent: 씬별 이미지 프롬프트 생성
3. Nanobanana: 이미지 생성
4. EdgeTTS: 나레이션 음성 생성
5. VideoBuilder: ffmpeg로 영상 조립
"""

import asyncio
import logging
import os
import uuid
import base64
import tempfile
from pathlib import Path
from typing import Dict, Any, Optional, List
from dataclasses import dataclass
from datetime import datetime

from app.services.agents import (
    get_shorts_script_agent,
    get_visual_prompt_agent,
    AgentRequest
)
from app.services.video_builder import VideoBuilder, VideoConfig, get_tts_service

logger = logging.getLogger(__name__)


# =============================================================================
# Data Classes
# =============================================================================

@dataclass
class ShortsGenerationResult:
    """숏폼 생성 결과"""
    success: bool
    video_path: Optional[str]
    script: Optional[Dict[str, Any]]
    images: Dict[int, str]  # scene_number → image_path
    tts_files: Dict[int, str]  # scene_number → audio_path
    duration_seconds: int
    error_message: Optional[str] = None


@dataclass
class GenerationProgress:
    """생성 진행 상황"""
    step: str
    progress: int  # 0-100
    message: str
    details: Optional[Dict[str, Any]] = None


# =============================================================================
# Shorts Video Generator
# =============================================================================

class ShortsVideoGenerator:
    """
    숏폼 영상 생성기

    전체 파이프라인:
    1. 스크립트 생성 (ShortsScriptAgent)
    2. 이미지 프롬프트 생성 (VisualPromptAgent)
    3. 이미지 생성 (Nanobanana)
    4. TTS 생성 (EdgeTTS)
    5. 영상 조립 (ffmpeg)
    """

    def __init__(
        self,
        output_dir: Optional[str] = None,
        bgm_dir: Optional[str] = None
    ):
        """
        Args:
            output_dir: 출력 디렉토리
            bgm_dir: BGM 파일 디렉토리
        """
        self.output_dir = output_dir or tempfile.mkdtemp(prefix="shorts_")
        self.bgm_dir = bgm_dir or "/assets/bgm"

        Path(self.output_dir).mkdir(parents=True, exist_ok=True)

        # 서비스 초기화
        self.video_builder = VideoBuilder(
            output_dir=self.output_dir,
            bgm_dir=self.bgm_dir
        )
        self.tts_service = get_tts_service(self.output_dir)

        # Agents
        self.shorts_script_agent = get_shorts_script_agent()
        self.visual_prompt_agent = get_visual_prompt_agent()

        logger.info(f"[ShortsVideoGenerator] Initialized with output_dir={self.output_dir}")

    async def generate(
        self,
        concept: Dict[str, Any],
        product_name: str,
        key_features: Optional[List[str]] = None,
        target_duration: int = 45,
        progress_callback: Optional[callable] = None
    ) -> ShortsGenerationResult:
        """
        숏폼 영상 생성

        Args:
            concept: 컨셉 정보 (ConceptAgent 출력)
            product_name: 제품/서비스명
            key_features: 핵심 기능 목록
            target_duration: 목표 영상 길이 (초)
            progress_callback: 진행 상황 콜백 (async def callback(progress: GenerationProgress))

        Returns:
            ShortsGenerationResult
        """
        session_id = uuid.uuid4().hex[:8]
        logger.info(f"[ShortsVideoGenerator] Starting generation: session={session_id}")

        try:
            # 1. 스크립트 생성 (0-20%)
            await self._report_progress(
                progress_callback,
                GenerationProgress(
                    step="script_generation",
                    progress=5,
                    message="스크립트 생성 중..."
                )
            )

            script = await self._generate_script(
                concept=concept,
                product_name=product_name,
                key_features=key_features,
                target_duration=target_duration
            )

            await self._report_progress(
                progress_callback,
                GenerationProgress(
                    step="script_generation",
                    progress=20,
                    message=f"스크립트 생성 완료 ({len(script.get('scenes', []))} 씬)"
                )
            )

            # 2. 이미지 프롬프트 생성 (20-30%)
            await self._report_progress(
                progress_callback,
                GenerationProgress(
                    step="prompt_generation",
                    progress=25,
                    message="이미지 프롬프트 생성 중..."
                )
            )

            image_prompts = await self._generate_image_prompts(
                concept=concept,
                script=script
            )

            await self._report_progress(
                progress_callback,
                GenerationProgress(
                    step="prompt_generation",
                    progress=30,
                    message=f"프롬프트 생성 완료 ({len(image_prompts)} 개)"
                )
            )

            # 3. 이미지 생성 (30-60%)
            await self._report_progress(
                progress_callback,
                GenerationProgress(
                    step="image_generation",
                    progress=35,
                    message="이미지 생성 중..."
                )
            )

            images = await self._generate_images(
                image_prompts=image_prompts,
                script=script,
                session_id=session_id,
                progress_callback=progress_callback
            )

            await self._report_progress(
                progress_callback,
                GenerationProgress(
                    step="image_generation",
                    progress=60,
                    message=f"이미지 생성 완료 ({len(images)} 개)"
                )
            )

            # 4. TTS 생성 (60-80%)
            await self._report_progress(
                progress_callback,
                GenerationProgress(
                    step="tts_generation",
                    progress=65,
                    message="나레이션 생성 중..."
                )
            )

            tts_files = await self._generate_tts(script)

            await self._report_progress(
                progress_callback,
                GenerationProgress(
                    step="tts_generation",
                    progress=80,
                    message=f"나레이션 생성 완료 ({len(tts_files)} 개)"
                )
            )

            # 5. 영상 조립 (80-100%)
            await self._report_progress(
                progress_callback,
                GenerationProgress(
                    step="video_assembly",
                    progress=85,
                    message="영상 조립 중..."
                )
            )

            video_path = await self.video_builder.build_shorts_video(
                script=script,
                images=images,
                config=VideoConfig(
                    width=1080,
                    height=1920,
                    fps=30
                )
            )

            await self._report_progress(
                progress_callback,
                GenerationProgress(
                    step="complete",
                    progress=100,
                    message="영상 생성 완료!"
                )
            )

            # 영상 길이 계산
            total_duration = sum(
                scene.get("duration_seconds", 0)
                for scene in script.get("scenes", [])
            )

            logger.info(f"[ShortsVideoGenerator] Completed: {video_path}")

            return ShortsGenerationResult(
                success=True,
                video_path=video_path,
                script=script,
                images=images,
                tts_files=tts_files,
                duration_seconds=int(total_duration)
            )

        except Exception as e:
            logger.error(f"[ShortsVideoGenerator] Error: {e}", exc_info=True)

            await self._report_progress(
                progress_callback,
                GenerationProgress(
                    step="error",
                    progress=0,
                    message=f"생성 실패: {str(e)}"
                )
            )

            return ShortsGenerationResult(
                success=False,
                video_path=None,
                script=None,
                images={},
                tts_files={},
                duration_seconds=0,
                error_message=str(e)
            )

    async def _generate_script(
        self,
        concept: Dict[str, Any],
        product_name: str,
        key_features: Optional[List[str]],
        target_duration: int
    ) -> Dict[str, Any]:
        """스크립트 생성"""
        request = AgentRequest(
            task="generate_shorts_script",
            payload={
                "concept": concept,
                "product_name": product_name,
                "key_features": key_features or [],
                "target_duration": target_duration
            }
        )

        response = await self.shorts_script_agent.execute(request)
        return response.outputs[0].value

    async def _generate_image_prompts(
        self,
        concept: Dict[str, Any],
        script: Dict[str, Any]
    ) -> Dict[int, Dict[str, Any]]:
        """씬별 이미지 프롬프트 생성"""
        prompts = {}
        scenes = script.get("scenes", [])

        for scene in scenes:
            scene_num = scene.get("scene_number", 0)
            visual_description = scene.get("visual_description", "")

            request = AgentRequest(
                task="generate_visual_prompts",
                payload={
                    "concept": concept,
                    "asset_type": "shorts",
                    "scene_description": visual_description,
                    "image_count": 1
                }
            )

            response = await self.visual_prompt_agent.execute(request)
            output = response.outputs[0].value

            if output.get("prompts"):
                prompts[scene_num] = output["prompts"][0]

        return prompts

    async def _generate_images(
        self,
        image_prompts: Dict[int, Dict[str, Any]],
        script: Dict[str, Any],
        session_id: str,
        progress_callback: Optional[callable] = None
    ) -> Dict[int, str]:
        """Nanobanana로 이미지 생성"""
        from app.services.media import get_media_gateway

        images = {}
        media_gateway = get_media_gateway()

        total = len(image_prompts)
        completed = 0

        for scene_num, prompt_data in image_prompts.items():
            try:
                prompt_text = prompt_data.get("prompt_text", "")
                aspect_ratio = prompt_data.get("aspect_ratio", "9:16")

                # Nanobanana 호출
                response = await media_gateway.generate(
                    prompt=prompt_text,
                    task="shorts_scene",
                    media_type="image",
                    options={
                        "aspect_ratio": aspect_ratio,
                        "provider": "nanobanana"
                    }
                )

                if response.outputs:
                    # Base64 이미지 → 파일 저장
                    img_data = response.outputs[0].data
                    img_path = os.path.join(
                        self.output_dir,
                        f"scene_{scene_num}_{session_id}.png"
                    )

                    with open(img_path, "wb") as f:
                        f.write(base64.b64decode(img_data))

                    images[scene_num] = img_path
                    logger.info(f"[ShortsVideoGenerator] Image saved: {img_path}")

            except Exception as e:
                logger.warning(f"[ShortsVideoGenerator] Image generation failed for scene {scene_num}: {e}")
                # 플레이스홀더 이미지 사용
                images[scene_num] = self._get_placeholder_image(scene_num)

            completed += 1
            progress = 35 + int((completed / total) * 25)  # 35-60%

            if progress_callback:
                await self._report_progress(
                    progress_callback,
                    GenerationProgress(
                        step="image_generation",
                        progress=progress,
                        message=f"이미지 생성 중... ({completed}/{total})"
                    )
                )

        return images

    async def _generate_tts(self, script: Dict[str, Any]) -> Dict[int, str]:
        """EdgeTTS로 나레이션 생성"""
        from app.services.video_builder import TTSSegment

        tts_files = {}
        audio_config = script.get("audio", {})
        voice = audio_config.get("tts_voice", "ko-KR-SunHiNeural")

        segments = []
        scenes = script.get("scenes", [])

        for scene in scenes:
            scene_num = scene.get("scene_number", 0)
            narration = scene.get("narration", "")

            if narration:
                output_path = os.path.join(
                    self.output_dir,
                    f"tts_scene_{scene_num}.mp3"
                )
                segments.append(TTSSegment(
                    text=narration,
                    output_path=output_path,
                    voice=voice
                ))
                tts_files[scene_num] = output_path

        if segments:
            await self.tts_service.generate_multiple(segments)

        return tts_files

    def _get_placeholder_image(self, scene_num: int) -> str:
        """플레이스홀더 이미지 경로 반환"""
        # 실제 구현에서는 기본 이미지 사용
        placeholder_path = os.path.join(
            self.output_dir,
            f"placeholder_{scene_num}.png"
        )

        # 간단한 플레이스홀더 생성 (PIL)
        try:
            from PIL import Image, ImageDraw, ImageFont

            img = Image.new('RGB', (1080, 1920), color=(50, 50, 50))
            draw = ImageDraw.Draw(img)

            # 중앙에 텍스트
            text = f"Scene {scene_num}"
            draw.text((540, 960), text, fill=(200, 200, 200), anchor="mm")

            img.save(placeholder_path)
            return placeholder_path

        except Exception:
            return placeholder_path

    async def _report_progress(
        self,
        callback: Optional[callable],
        progress: GenerationProgress
    ):
        """진행 상황 보고"""
        if callback:
            try:
                if asyncio.iscoroutinefunction(callback):
                    await callback(progress)
                else:
                    callback(progress)
            except Exception as e:
                logger.warning(f"Progress callback error: {e}")


# =============================================================================
# Factory Function
# =============================================================================

def get_shorts_video_generator(
    output_dir: Optional[str] = None,
    bgm_dir: Optional[str] = None
) -> ShortsVideoGenerator:
    """ShortsVideoGenerator 인스턴스 반환"""
    return ShortsVideoGenerator(output_dir=output_dir, bgm_dir=bgm_dir)
