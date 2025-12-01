"""
Video Builder V2

VideoTimelinePlanV1을 입력받아 ffmpeg로 실제 mp4 파일을 생성하는 렌더링 엔진

작성일: 2025-11-30
작성자: B팀 (Backend)
참조: docs/VIDEO_PIPELINE_DESIGN_V2.md

기능:
- VideoTimelinePlanV1 기반 영상 렌더링
- Ken Burns 효과 (zoompan)
- 전환 효과 (xfade)
- 텍스트 오버레이 (drawtext)
- BGM 믹싱 (loudnorm)

의존성:
- ffmpeg (시스템 설치 필요)
- edge-tts (음성 생성)
"""

import asyncio
import logging
import os
import tempfile
import hashlib
import httpx
from pathlib import Path
from typing import Dict, Any, Optional, List
from uuid import uuid4
from datetime import datetime
from dataclasses import dataclass

from app.schemas.video_timeline import (
    VideoTimelinePlanV1,
    SceneConfig,
    SceneType,
    MotionType,
    TransitionType,
    EasingType,
    TextLayer,
    TextPosition,
    AnimationType,
    BGMMode,
    VideoBuildResult,
)
from app.services.storage import storage_service

logger = logging.getLogger(__name__)


# =============================================================================
# Constants
# =============================================================================

# FFmpeg 전환 효과 매핑
TRANSITION_MAP = {
    TransitionType.CUT: None,  # concat으로 처리
    TransitionType.CROSSFADE: "fade",
    TransitionType.SLIDE_LEFT: "slideleft",
    TransitionType.SLIDE_UP: "slideup",
    TransitionType.ZOOM_OUT: "zoomout",
}

# 텍스트 위치 매핑 (x, y)
TEXT_POSITION_MAP = {
    TextPosition.TOP_CENTER: ("(w-text_w)/2", "100"),
    TextPosition.CENTER: ("(w-text_w)/2", "(h-text_h)/2"),
    TextPosition.BOTTOM_CENTER: ("(w-text_w)/2", "h-150"),
}

# 기본 폰트 경로 (시스템별)
FONT_PATHS = {
    "darwin": "/System/Library/Fonts/AppleSDGothicNeo.ttc",  # macOS
    "linux": "/usr/share/fonts/truetype/noto/NotoSansCJK-Regular.ttc",
    "win32": "C:/Windows/Fonts/malgun.ttf",  # Windows
}


# =============================================================================
# Data Classes
# =============================================================================

@dataclass
class RenderContext:
    """렌더링 컨텍스트"""
    job_id: str
    workdir: Path
    timeline: VideoTimelinePlanV1
    image_paths: Dict[int, str]  # scene_index -> local path
    scene_clips: List[str]  # 씬별 클립 경로
    final_video_path: Optional[str] = None
    thumbnail_path: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None


# =============================================================================
# Video Builder V2
# =============================================================================

class VideoBuilderV2:
    """
    Video Builder V2

    VideoTimelinePlanV1을 받아 ffmpeg로 실제 mp4 파일을 생성합니다.

    렌더링 파이프라인:
    1. 입력 검증 & 작업 디렉토리 생성
    2. 이미지 다운로드 & 리사이즈
    3. 씬별 클립 생성 (Ken Burns 포함)
    4. 씬 연결 + 전환 효과
    5. 텍스트 오버레이
    6. BGM 믹싱
    7. 최종 인코딩 & 썸네일 생성
    """

    def __init__(
        self,
        output_dir: Optional[str] = None,
        bgm_dir: Optional[str] = None,
        font_path: Optional[str] = None
    ):
        self.output_dir = output_dir or tempfile.gettempdir()
        self.bgm_dir = bgm_dir or "/assets/bgm"
        self.font_path = font_path or self._get_default_font()

        Path(self.output_dir).mkdir(parents=True, exist_ok=True)

    def _get_default_font(self) -> str:
        """기본 폰트 경로 (NanumGothic 권장)"""
        # Docker 환경의 assets 폴더
        font_path = Path("/app/assets/fonts/NanumGothic-Bold.ttf")
        if font_path.exists():
            return str(font_path)
        
        # 로컬 개발 환경용 fallback
        import sys
        if sys.platform == "darwin": # Mac
            return "/System/Library/Fonts/AppleSDGothicNeo.ttc"
        elif sys.platform == "win32": # Windows
            return "C:\\Windows\\Fonts\\malgun.ttf"
        
        return str(font_path)

    async def _ensure_font_exists(self):
        """폰트 파일 확인 및 다운로드"""
        if os.path.exists(self.font_path) and os.path.getsize(self.font_path) > 0:
            return

        # 폰트가 없으면 다운로드
        font_url = "https://github.com/google/fonts/raw/main/ofl/nanumgothic/NanumGothic-Bold.ttf"
        logger.info(f"[VideoBuilderV2] Downloading font from {font_url}")
        
        try:
            os.makedirs(os.path.dirname(self.font_path), exist_ok=True)
            async with httpx.AsyncClient() as client:
                response = await client.get(font_url, follow_redirects=True)
                response.raise_for_status()
                with open(self.font_path, "wb") as f:
                    f.write(response.content)
            logger.info(f"[VideoBuilderV2] Font downloaded to {self.font_path}")
        except Exception as e:
            logger.error(f"[VideoBuilderV2] Failed to download font: {e}")
            # Fallback to system font if download fails
            self.font_path = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"

    async def build(
        self,
        timeline: VideoTimelinePlanV1,
        job_id: Optional[str] = None
    ) -> VideoBuildResult:
        """
        영상 빌드

        Args:
            timeline: VideoTimelinePlanV1
            job_id: 작업 ID (없으면 자동 생성)

        Returns:
            VideoBuildResult
        """
        job_id = job_id or f"vb_{uuid4().hex[:8]}"
        start_time = datetime.utcnow()

        logger.info(f"[VideoBuilderV2] Starting build: {job_id}, scenes={len(timeline.scenes)}")

        # 작업 디렉토리 생성
        workdir = Path(self.output_dir) / job_id
        workdir.mkdir(parents=True, exist_ok=True)

        ctx = RenderContext(
            job_id=job_id,
            workdir=workdir,
            timeline=timeline,
            image_paths={},
            scene_clips=[],
            start_time=start_time
        )

        try:
            # 0. 폰트 확인
            await self._ensure_font_exists()

            # 1. 이미지 다운로드
            await self._download_images(ctx)

            # 2. 음성(TTS) 생성
            await self._generate_voiceovers(ctx)

            # 3. 씬별 클립 생성 (TTS 길이에 맞춰 duration 조정)
            await self._render_scene_clips(ctx)

            # 4. 씬 연결 + 전환 효과
            video_no_audio = await self._concatenate_scenes(ctx)

            # 5. 텍스트 오버레이
            video_with_text = await self._apply_text_overlays(ctx, video_no_audio)

            # 6. BGM 및 보이스오버 믹싱
            final_video = await self._mix_audio(ctx, video_with_text)
            
            # 7. 썸네일 생성
            thumbnail = await self._generate_thumbnail(ctx, final_video)

            # 8. 스토리지 업로드
            video_url, thumb_url = await self._upload_to_storage(ctx, final_video, thumbnail)

            ctx.end_time = datetime.utcnow()
            render_time = (ctx.end_time - ctx.start_time).total_seconds()

            # 파일 크기
            file_size = os.path.getsize(final_video) if os.path.exists(final_video) else 0

            logger.info(f"[VideoBuilderV2] Build complete: {job_id}, time={render_time:.2f}s")

            return VideoBuildResult(
                video_url=video_url,
                thumbnail_url=thumb_url,
                duration_sec=timeline.global_config.total_duration_sec,
                fps=timeline.canvas.fps,
                file_size_bytes=file_size,
                render_time_sec=render_time
            )

        except Exception as e:
            logger.error(f"[VideoBuilderV2] Build failed: {job_id}, error={e}")
            raise

    async def _generate_voiceovers(self, ctx: RenderContext):
        """TTS 오디오 생성 및 타임라인 동기화"""
        from app.services.media.gateway import get_media_gateway
        gateway = get_media_gateway()

        ctx.voiceover_paths = {}  # scene_index -> path
        ctx.voiceover_durations = {}  # scene_index -> duration (TTS 실제 길이)

        logger.info(f"[VideoBuilderV2] Generating voiceovers for {len(ctx.timeline.scenes)} scenes")

        for scene in ctx.timeline.scenes:
            script = scene.script
            if not script or not script.strip():
                continue

            try:
                # TTS 생성 요청 (한국어 기본, 속도/피치 조정 가능)
                voice_options = {
                    "voice": "ko-KR-SunHiNeural",
                    "rate": "-5%",  # 약간 느리게 (명확성 향상)
                    "pitch": "+0Hz"
                }

                response = await gateway.generate(
                    prompt=script,
                    task="voiceover",
                    media_type="audio",
                    options=voice_options
                )

                if response.outputs and response.outputs[0].data:
                    import base64
                    audio_data = base64.b64decode(response.outputs[0].data)

                    # 파일 크기 검증 (최소 1KB)
                    if len(audio_data) < 1024:
                        logger.warning(f"[VideoBuilderV2] TTS output too small for scene {scene.scene_index}, skipping")
                        continue

                    output_path = ctx.workdir / f"voice_{scene.scene_index}.mp3"
                    with open(output_path, "wb") as f:
                        f.write(audio_data)

                    ctx.voiceover_paths[scene.scene_index] = str(output_path)

                    # 오디오 길이 측정 및 씬 길이 업데이트
                    audio_duration = await self._get_audio_duration(str(output_path))
                    if audio_duration > 0:
                        ctx.voiceover_durations[scene.scene_index] = audio_duration

                        # 씬 길이를 오디오 길이 + 여유 시간으로 조정
                        # 기존 duration보다 짧아지지 않도록 max 사용
                        min_duration = scene.end_sec - scene.start_sec
                        padding = 0.8  # 음성 끝난 후 여유 시간
                        new_duration = max(min_duration, audio_duration + padding)

                        # Pydantic 모델은 불변이므로 별도 저장
                        scene.duration_override = new_duration
                        logger.info(
                            f"[VideoBuilderV2] Scene {scene.scene_index} duration: "
                            f"{min_duration:.2f}s → {new_duration:.2f}s (TTS: {audio_duration:.2f}s)"
                        )
                    else:
                        logger.warning(f"[VideoBuilderV2] Could not measure TTS duration for scene {scene.scene_index}")

            except Exception as e:
                logger.error(f"[VideoBuilderV2] TTS failed for scene {scene.scene_index}: {e}", exc_info=True)

        # 전체 TTS 생성 결과 로깅
        logger.info(
            f"[VideoBuilderV2] TTS generation complete: "
            f"{len(ctx.voiceover_paths)}/{len(ctx.timeline.scenes)} scenes with voiceover"
        )

    async def _get_audio_duration(self, audio_path: str) -> float:
        """오디오 파일 길이 측정 (ffprobe)"""
        cmd = [
            "ffprobe", 
            "-v", "error", 
            "-show_entries", "format=duration", 
            "-of", "default=noprint_wrappers=1:nokey=1", 
            audio_path
        ]
        
        import asyncio
        import subprocess
        
        try:
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE
            )
            stdout, stderr = await process.communicate()
            
            if process.returncode == 0:
                return float(stdout.decode().strip())
        except Exception as e:
            logger.warning(f"Failed to get audio duration: {e}")
        
        return 0.0

    async def _download_images(self, ctx: RenderContext):
        """이미지 다운로드"""
        logger.info(f"[VideoBuilderV2] Downloading {len(ctx.timeline.scenes)} images")

        async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
            for scene in ctx.timeline.scenes:
                if not scene.image or not scene.image.url:
                    continue

                # URL 해시로 파일명 생성
                url_hash = hashlib.md5(scene.image.url.encode()).hexdigest()[:8]
                local_path = ctx.workdir / f"img_{scene.scene_index}_{url_hash}.png"

                try:
                    # URL이 로컬 파일인 경우
                    if scene.image.url.startswith("file://"):
                        # 로컬 파일 복사
                        import shutil
                        src = scene.image.url.replace("file://", "")
                        shutil.copy(src, local_path)
                    elif scene.image.url.startswith("http"):
                        # HTTP 다운로드
                        response = await client.get(scene.image.url)
                        response.raise_for_status()
                        with open(local_path, "wb") as f:
                            f.write(response.content)
                    else:
                        # MinIO presigned URL 등
                        response = await client.get(scene.image.url)
                        response.raise_for_status()
                        with open(local_path, "wb") as f:
                            f.write(response.content)

                    ctx.image_paths[scene.scene_index] = str(local_path)
                    logger.debug(f"[VideoBuilderV2] Downloaded: scene_{scene.scene_index}")

                except Exception as e:
                    logger.warning(f"[VideoBuilderV2] Failed to download image for scene {scene.scene_index}: {e}")

    async def _render_scene_clips(self, ctx: RenderContext):
        """씬별 클립 생성 (Ken Burns 또는 AI 영상)"""
        logger.info(f"[VideoBuilderV2] Rendering scene clips")

        for scene in ctx.timeline.scenes:
            image_path = ctx.image_paths.get(scene.scene_index)
            if not image_path:
                logger.warning(f"[VideoBuilderV2] No image for scene {scene.scene_index}")
                continue

            # TTS에 의해 조정된 길이 사용
            if hasattr(scene, 'duration_override'):
                duration = scene.duration_override
            else:
                duration = scene.end_sec - scene.start_sec

            output_path = ctx.workdir / f"scene_{scene.scene_index}.mp4"

            # AI 영상 생성 모드 확인
            if scene.type == SceneType.AI_VIDEO or scene.motion.type == MotionType.AI_MOTION:
                # AI 기반 영상 생성 (Luma/Runway)
                success = await self._render_ai_video_clip(
                    ctx=ctx,
                    scene=scene,
                    image_path=image_path,
                    duration=duration,
                    output_path=str(output_path)
                )
            else:
                # 기존 Ken Burns 방식
                filters = self._build_scene_filters(ctx, scene, duration)
                cmd = self._build_scene_ffmpeg_cmd(
                    image_path=image_path,
                    duration=duration,
                    filters=filters,
                    output_path=str(output_path),
                    fps=ctx.timeline.canvas.fps
                )
                success = await self._run_ffmpeg(cmd)

            if success and output_path.exists():
                ctx.scene_clips.append(str(output_path))
            else:
                logger.error(f"[VideoBuilderV2] Failed to render scene {scene.scene_index}")
                # Fallback: Ken Burns로 대체 시도
                if scene.type == SceneType.AI_VIDEO or scene.motion.type == MotionType.AI_MOTION:
                    logger.info(f"[VideoBuilderV2] Falling back to Ken Burns for scene {scene.scene_index}")
                    filters = self._build_scene_filters(ctx, scene, duration)
                    cmd = self._build_scene_ffmpeg_cmd(
                        image_path=image_path,
                        duration=duration,
                        filters=filters,
                        output_path=str(output_path),
                        fps=ctx.timeline.canvas.fps
                    )
                    if await self._run_ffmpeg(cmd) and output_path.exists():
                        ctx.scene_clips.append(str(output_path))

    async def _render_ai_video_clip(
        self,
        ctx: RenderContext,
        scene,
        image_path: str,
        duration: float,
        output_path: str
    ) -> bool:
        """AI 기반 영상 클립 생성 (Luma/Runway)"""
        from app.services.media.gateway import get_media_gateway

        try:
            gateway = get_media_gateway()

            # 이미지를 URL 또는 Base64로 변환
            # MinIO 업로드 후 presigned URL 사용
            import base64
            with open(image_path, "rb") as f:
                image_base64 = base64.b64encode(f.read()).decode()

            # 모션 프롬프트 생성 (씬의 script 또는 기본 프롬프트 사용)
            motion_prompt = scene.script or "Subtle camera movement, gentle parallax effect"

            logger.info(f"[VideoBuilderV2] Generating AI video for scene {scene.scene_index}: '{motion_prompt[:50]}...'")

            # AI 영상 생성 요청
            response = await gateway.generate(
                prompt=motion_prompt,
                task="image_to_video",
                media_type="video",
                options={
                    "image_base64": image_base64,
                    "aspect_ratio": "9:16",  # 세로 영상
                    "duration": min(5, duration)  # 대부분 AI는 5초 제한
                }
            )

            if response.outputs and response.outputs[0].data:
                video_url = response.outputs[0].data

                # 영상 다운로드
                import httpx
                async with httpx.AsyncClient(timeout=120, follow_redirects=True) as client:
                    dl_response = await client.get(video_url)
                    dl_response.raise_for_status()

                    # AI 영상은 보통 5초이므로, 필요하면 루프/연장
                    ai_video_path = ctx.workdir / f"ai_scene_{scene.scene_index}_raw.mp4"
                    with open(ai_video_path, "wb") as f:
                        f.write(dl_response.content)

                # 필요한 길이로 조정 (5초보다 길면 루프)
                ai_duration = await self._get_video_duration(str(ai_video_path))
                if duration > ai_duration + 0.5:
                    # 루프 처리
                    loop_count = int(duration / ai_duration) + 1
                    cmd = (
                        f'ffmpeg -y -stream_loop {loop_count} -i "{ai_video_path}" '
                        f'-t {duration} -c:v libx264 -preset fast -pix_fmt yuv420p '
                        f'"{output_path}"'
                    )
                else:
                    # 길이 조정만
                    cmd = (
                        f'ffmpeg -y -i "{ai_video_path}" '
                        f'-t {duration} -c:v libx264 -preset fast -pix_fmt yuv420p '
                        f'"{output_path}"'
                    )

                return await self._run_ffmpeg(cmd)

            else:
                logger.warning(f"[VideoBuilderV2] AI video generation returned no output")
                return False

        except Exception as e:
            logger.error(f"[VideoBuilderV2] AI video generation failed: {e}", exc_info=True)
            return False

    def _build_scene_filters(
        self,
        ctx: RenderContext,
        scene: SceneConfig,
        duration: float
    ) -> str:
        """씬 필터 문자열 생성"""
        canvas = ctx.timeline.canvas
        fps = canvas.fps
        total_frames = int(duration * fps)

        filters = []

        # 1. 기본 스케일 & 패딩
        filters.append(f"scale={canvas.width}:{canvas.height}:force_original_aspect_ratio=decrease")
        filters.append(f"pad={canvas.width}:{canvas.height}:(ow-iw)/2:(oh-ih)/2:color=black")

        # 2. Ken Burns 효과
        if scene.motion.type == MotionType.KENBURNS:
            kenburns_filter = self._build_kenburns_filter(scene.motion, duration, fps)
            if kenburns_filter:
                # Ken Burns는 zoompan 필터로 구현
                # 기존 scale/pad 대신 zoompan 사용
                filters = [kenburns_filter]

        # 3. FPS 설정
        filters.append(f"fps={fps}")

        return ",".join(filters)

    def _build_kenburns_filter(
        self,
        motion,
        duration: float,
        fps: int
    ) -> str:
        """Ken Burns zoompan 필터 생성"""
        total_frames = int(duration * fps)

        # zoom 표현식
        zoom_start = motion.zoom_start
        zoom_end = motion.zoom_end
        zoom_delta = zoom_end - zoom_start

        # easing 함수 적용
        if motion.easing == EasingType.LINEAR:
            zoom_expr = f"'{zoom_start}+{zoom_delta}*(on/{total_frames})'"
        elif motion.easing == EasingType.EASE_IN:
            zoom_expr = f"'{zoom_start}+{zoom_delta}*pow(on/{total_frames},2)'"
        elif motion.easing == EasingType.EASE_OUT:
            zoom_expr = f"'{zoom_start}+{zoom_delta}*(1-pow(1-on/{total_frames},2))'"
        else:  # EASE_IN_OUT
            zoom_expr = f"'{zoom_start}+{zoom_delta}*(3*pow(on/{total_frames},2)-2*pow(on/{total_frames},3))'"

        # pan 표현식 (0~1 좌표를 실제 픽셀로 변환)
        pan_start_x = motion.pan_start[0]
        pan_start_y = motion.pan_start[1]
        pan_end_x = motion.pan_end[0]
        pan_end_y = motion.pan_end[1]

        # x = (이미지중심 - 보이는영역/2)
        x_expr = f"'iw*({pan_start_x}+({pan_end_x}-{pan_start_x})*(on/{total_frames}))-(iw/zoom)/2'"
        y_expr = f"'ih*({pan_start_y}+({pan_end_y}-{pan_start_y})*(on/{total_frames}))-(ih/zoom)/2'"

        return f"zoompan=zoom={zoom_expr}:x={x_expr}:y={y_expr}:d={total_frames}:fps={fps}:s=1080x1920"

    def _build_scene_ffmpeg_cmd(
        self,
        image_path: str,
        duration: float,
        filters: str,
        output_path: str,
        fps: int
    ) -> str:
        """씬 FFmpeg 명령 생성"""
        cmd = (
            f'ffmpeg -y -loop 1 -i "{image_path}" '
            f'-t {duration} '
            f'-vf "{filters}" '
            f'-c:v libx264 -preset fast -pix_fmt yuv420p '
            f'-an '
            f'"{output_path}"'
        )
        return cmd

    async def _concatenate_scenes(self, ctx: RenderContext) -> str:
        """씬 연결 + 전환 효과"""
        logger.info(f"[VideoBuilderV2] Concatenating {len(ctx.scene_clips)} clips")

        if not ctx.scene_clips:
            raise ValueError("No scene clips to concatenate")

        if len(ctx.scene_clips) == 1:
            return ctx.scene_clips[0]

        # 전환 효과 확인
        has_transitions = any(
            scene.transition_out.type != TransitionType.CUT
            for scene in ctx.timeline.scenes[:-1]
        )

        if has_transitions:
            # xfade 기반 연결
            return await self._concatenate_with_xfade(ctx)
        else:
            # 단순 concat
            return await self._concatenate_simple(ctx)

    async def _concatenate_simple(self, ctx: RenderContext) -> str:
        """단순 연결 (전환 없음)"""
        concat_file = ctx.workdir / "concat_list.txt"
        output_path = ctx.workdir / "concat_output.mp4"

        with open(concat_file, "w") as f:
            for clip in ctx.scene_clips:
                f.write(f"file '{clip}'\n")

        cmd = f'ffmpeg -y -f concat -safe 0 -i "{concat_file}" -c copy "{output_path}"'
        await self._run_ffmpeg(cmd)

        return str(output_path)

    async def _concatenate_with_xfade(self, ctx: RenderContext) -> str:
        """xfade 기반 연결 (누적 offset 방식으로 앞뒤 짤림 방지)"""
        # MVP: 2개씩 순차적으로 xfade 적용
        current = ctx.scene_clips[0]
        scenes = ctx.timeline.scenes

        # 첫 번째 클립의 실제 길이 측정
        current_duration = await self._get_video_duration(current)

        for i in range(1, len(ctx.scene_clips)):
            next_clip = ctx.scene_clips[i]
            output_path = ctx.workdir / f"xfade_{i}.mp4"

            # 전환 정보
            prev_scene = scenes[i - 1]
            transition = prev_scene.transition_out
            xfade_type = TRANSITION_MAP.get(transition.type, "fade")

            if xfade_type is None:  # CUT
                # concat 처리
                concat_file = ctx.workdir / f"concat_{i}.txt"
                with open(concat_file, "w") as f:
                    f.write(f"file '{current}'\n")
                    f.write(f"file '{next_clip}'\n")
                cmd = f'ffmpeg -y -f concat -safe 0 -i "{concat_file}" -c copy "{output_path}"'

                # concat 후 현재 길이 업데이트
                next_duration = await self._get_video_duration(next_clip)
                current_duration = current_duration + next_duration
            else:
                # xfade 처리 - offset은 현재 영상의 실제 길이에서 전환 시간을 뺀 값
                # 전환 효과가 시작되는 지점 = 현재 영상 끝 - 전환 시간
                offset = max(0, current_duration - transition.duration_sec)

                logger.info(f"[VideoBuilderV2] xfade: clip {i}, current_duration={current_duration:.2f}, offset={offset:.2f}, transition={transition.duration_sec}")

                cmd = (
                    f'ffmpeg -y -i "{current}" -i "{next_clip}" '
                    f'-filter_complex "[0:v][1:v]xfade=transition={xfade_type}:'
                    f'duration={transition.duration_sec}:offset={offset}[v]" '
                    f'-map "[v]" -c:v libx264 -preset fast -pix_fmt yuv420p '
                    f'"{output_path}"'
                )

                # xfade 후 현재 길이 업데이트
                # xfade는 두 클립이 겹치므로 총 길이 = current + next - transition
                next_duration = await self._get_video_duration(next_clip)
                current_duration = current_duration + next_duration - transition.duration_sec

            await self._run_ffmpeg(cmd)
            current = str(output_path)

        return current

    async def _get_video_duration(self, video_path: str) -> float:
        """비디오 파일 길이 측정 (ffprobe)"""
        cmd = [
            "ffprobe",
            "-v", "error",
            "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1",
            video_path
        ]

        try:
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            stdout, stderr = await process.communicate()

            if process.returncode == 0 and stdout:
                return float(stdout.decode().strip())
        except Exception as e:
            logger.warning(f"Failed to get video duration: {e}")

        return 4.0  # fallback to default scene duration

    async def _apply_text_overlays(self, ctx: RenderContext, video_path: str) -> str:
        """텍스트 오버레이 적용"""
        # 모든 텍스트 레이어 수집
        all_texts = []
        for scene in ctx.timeline.scenes:
            for text in scene.texts:
                all_texts.append(text)

        if not all_texts:
            return video_path

        logger.info(f"[VideoBuilderV2] Applying {len(all_texts)} text overlays")

        output_path = ctx.workdir / "with_text.mp4"

        # drawtext 필터 생성
        drawtext_filters = []
        for text in all_texts:
            dt_filter = self._build_drawtext_filter(text)
            drawtext_filters.append(dt_filter)

        filter_str = ",".join(drawtext_filters)

        cmd = (
            f'ffmpeg -y -i "{video_path}" '
            f'-vf "{filter_str}" '
            f'-c:v libx264 -preset fast -pix_fmt yuv420p '
            f'-c:a copy '
            f'"{output_path}"'
        )

        success = await self._run_ffmpeg(cmd)
        return str(output_path) if success else video_path

    def _build_drawtext_filter(self, text: TextLayer) -> str:
        """drawtext 필터 생성"""
        pos = TEXT_POSITION_MAP.get(text.position, TEXT_POSITION_MAP[TextPosition.BOTTOM_CENTER])

        # 텍스트 이스케이프
        safe_text = text.text.replace("'", "\\'").replace(":", "\\:")

        # 알파 애니메이션
        alpha_expr = self._build_alpha_expression(text)

        filter_str = (
            f"drawtext=text='{safe_text}':"
            f"fontfile={self.font_path}:"
            f"fontsize=48:"
            f"fontcolor=white:"
            f"x={pos[0]}:y={pos[1]}:"
            f"borderw=3:bordercolor=black:"
            f"alpha={alpha_expr}"
        )

        return filter_str

    def _build_alpha_expression(self, text: TextLayer) -> str:
        """텍스트 알파 애니메이션 표현식"""
        start = text.start_sec
        end = text.end_sec
        in_dur = text.animation.in_duration_sec
        out_dur = text.animation.out_duration_sec

        # between(t, start, end) 조건 내에서 fade in/out
        fade_in_end = start + in_dur
        fade_out_start = end - out_dur

        alpha_expr = (
            f"'if(between(t,{start},{end}),"
            f"if(lt(t,{fade_in_end}),(t-{start})/{in_dur},"
            f"if(gt(t,{fade_out_start}),({end}-t)/{out_dur},1)),"
            f"0)'"
        )

        return alpha_expr

    async def _mix_audio(self, ctx: RenderContext, video_path: str) -> str:
        """BGM 및 보이스오버 믹싱 (개선된 볼륨 밸런싱)"""
        audio_config = ctx.timeline.audio

        # 1. BGM 준비 (mood 기반 선택)
        bgm_path = None
        if audio_config.bgm_mode == BGMMode.AUTO:
            bgm_url = self._get_bgm_url_by_mood(ctx.timeline.global_config.music_mood)
            bgm_path = await self._download_bgm(ctx, bgm_url)
        elif audio_config.bgm_url:
            bgm_path = await self._download_bgm(ctx, audio_config.bgm_url)

        # 2. 보이스오버 준비
        voiceover_inputs = []  # (path, offset_ms)
        current_offset = 0.0

        has_voiceover = hasattr(ctx, 'voiceover_paths') and ctx.voiceover_paths

        if has_voiceover:
            for scene in ctx.timeline.scenes:
                # 씬 길이 계산 (TTS override 반영)
                duration = getattr(scene, 'duration_override', scene.end_sec - scene.start_sec)

                # 보이스오버가 있으면 추가 (약간의 딜레이로 자연스러운 시작)
                v_path = ctx.voiceover_paths.get(scene.scene_index)
                if v_path:
                    # 씬 시작 0.3초 후부터 음성 시작 (자연스러운 타이밍)
                    voice_offset = int((current_offset + 0.3) * 1000)
                    voiceover_inputs.append((v_path, voice_offset))

                current_offset += duration

        if not bgm_path and not voiceover_inputs:
            return video_path

        logger.info(f"[VideoBuilderV2] Mixing Audio: BGM={bool(bgm_path)}, Voiceovers={len(voiceover_inputs)}")

        output_path = ctx.workdir / "with_audio.mp4"

        # FFmpeg 명령 구성
        inputs = [f'-i "{video_path}"']
        filter_complex = []

        # 총 길이 계산
        total_duration = current_offset if current_offset > 0 else ctx.timeline.global_config.total_duration_sec

        # BGM 입력 (인덱스 1)
        if bgm_path:
            inputs.append(f'-i "{bgm_path}"')

            # 보이스오버가 있으면 BGM 볼륨을 더 낮춤 (음성 우선)
            # 보이스오버 없으면 BGM 볼륨 유지
            bgm_volume = audio_config.bgm_volume
            if has_voiceover and voiceover_inputs:
                bgm_volume = min(bgm_volume, 0.25)  # 음성이 있으면 BGM 최대 25%

            # BGM 페이드 인/아웃 + 루프 처리
            # afade: 처음 1초 페이드 인, 마지막 2초 페이드 아웃
            filter_complex.append(
                f"[1:a]aloop=loop=-1:size=2e+09,atrim=0:{total_duration},asetpts=PTS-STARTPTS,"
                f"volume={bgm_volume},"
                f"afade=t=in:st=0:d=1,"
                f"afade=t=out:st={max(0, total_duration - 2)}:d=2,"
                f"loudnorm=I=-20:TP=-2:LRA=11[bgm]"
            )

        # 보이스오버 입력 (인덱스 2부터)
        vo_filter_tags = []
        for i, (path, offset) in enumerate(voiceover_inputs):
            input_idx = len(inputs)
            inputs.append(f'-i "{path}"')
            # 딜레이 적용 (adelay는 ms 단위) + 볼륨 정규화
            tag = f"vo{i}"
            filter_complex.append(
                f"[{input_idx}:a]adelay={offset}|{offset},"
                f"volume=1.2,"  # 음성 약간 증폭
                f"loudnorm=I=-14:TP=-1:LRA=7[{tag}]"
            )
            vo_filter_tags.append(f"[{tag}]")

        # 믹싱 (음성 우선, BGM 배경)
        mix_inputs = []
        if bgm_path:
            mix_inputs.append("[bgm]")
        mix_inputs.extend(vo_filter_tags)

        if len(mix_inputs) > 1:
            # normalize=0: 볼륨 자동 정규화 비활성화 (수동 제어)
            filter_complex.append(
                f"{''.join(mix_inputs)}amix=inputs={len(mix_inputs)}:"
                f"duration=first:dropout_transition=2:normalize=0[a]"
            )
        elif len(mix_inputs) == 1:
            filter_complex.append(f"{mix_inputs[0]}anull[a]")
        else:
            # 오디오 없음 (위에서 리턴했으므로 도달 안함)
            return video_path

        cmd = (
            f'ffmpeg -y {" ".join(inputs)} '
            f'-filter_complex "{";".join(filter_complex)}" '
            f'-map 0:v -map "[a]" '
            f'-c:v copy -c:a aac -shortest '
            f'"{output_path}"'
        )

        success = await self._run_ffmpeg(cmd)
        return str(output_path) if success else video_path

    def _get_bgm_url_by_mood(self, mood: Optional[str]) -> str:
        """
        mood 기반 BGM URL 반환

        지원 mood:
        - warm_lofi: 따뜻한 로파이 (기본값)
        - upbeat: 밝고 에너지 넘치는
        - corporate: 비즈니스/기업용
        - emotional: 감성적인
        - chill: 차분한
        - epic: 웅장한
        """
        # 무료 BGM 라이브러리 URL (저작권 무료)
        # 출처: Pixabay, SoundHelix, FreeMusic Archive
        BGM_LIBRARY = {
            "warm_lofi": "https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3",  # Lofi Study
            "upbeat": "https://cdn.pixabay.com/download/audio/2022/10/25/audio_946eb5731f.mp3",  # Happy Day
            "corporate": "https://cdn.pixabay.com/download/audio/2022/02/22/audio_d1718ab41b.mp3",  # Corporate
            "emotional": "https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0c6ff1bbd.mp3",  # Emotional
            "chill": "https://cdn.pixabay.com/download/audio/2021/11/25/audio_91b32e02f9.mp3",  # Chill Abstract
            "epic": "https://cdn.pixabay.com/download/audio/2022/03/15/audio_8cb749d484.mp3",  # Epic Cinematic
        }

        # Fallback URL (SoundHelix - 항상 사용 가능)
        FALLBACK_URL = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"

        if not mood:
            mood = "warm_lofi"

        mood_lower = mood.lower().replace(" ", "_").replace("-", "_")
        url = BGM_LIBRARY.get(mood_lower, FALLBACK_URL)

        logger.info(f"[VideoBuilderV2] Selected BGM for mood '{mood}': {url[:50]}...")
        return url

    async def _download_bgm(self, ctx: RenderContext, url: str) -> Optional[str]:
        """BGM 다운로드 (재시도 및 fallback 포함)"""
        local_path = ctx.workdir / "bgm.mp3"

        # 1차 시도
        try:
            async with httpx.AsyncClient(timeout=60.0, follow_redirects=True) as client:
                response = await client.get(url)
                response.raise_for_status()

                # 파일 크기 검증 (최소 10KB)
                if len(response.content) < 10240:
                    raise ValueError("BGM file too small")

                with open(local_path, "wb") as f:
                    f.write(response.content)

                logger.info(f"[VideoBuilderV2] BGM downloaded: {len(response.content) / 1024:.1f}KB")
                return str(local_path)

        except Exception as e:
            logger.warning(f"[VideoBuilderV2] Primary BGM download failed: {e}")

        # 2차 시도 - Fallback URL
        fallback_url = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
        if url != fallback_url:
            try:
                logger.info("[VideoBuilderV2] Trying fallback BGM...")
                async with httpx.AsyncClient(timeout=60.0, follow_redirects=True) as client:
                    response = await client.get(fallback_url)
                    response.raise_for_status()
                    with open(local_path, "wb") as f:
                        f.write(response.content)
                    return str(local_path)
            except Exception as e:
                logger.error(f"[VideoBuilderV2] Fallback BGM download also failed: {e}")

        return None

    async def _generate_thumbnail(self, ctx: RenderContext, video_path: str) -> str:
        """썸네일 생성"""
        output_path = ctx.workdir / "thumbnail.png"

        # 1초 지점에서 프레임 추출
        cmd = f'ffmpeg -y -i "{video_path}" -ss 1.0 -vframes 1 "{output_path}"'
        await self._run_ffmpeg(cmd)

        return str(output_path)

    async def _upload_to_storage(
        self,
        ctx: RenderContext,
        video_path: str,
        thumbnail_path: str
    ) -> tuple:
        """스토리지 업로드"""
        # MVP: MinIO 업로드
        try:
            # 비디오 업로드
            with open(video_path, "rb") as f:
                video_data = f.read()

            bucket = storage_service._get_bucket_name("video")
            video_object_path = f"video/{ctx.job_id}/output.mp4"
            video_result = storage_service.upload_file(
                bucket=bucket,
                object_path=video_object_path,
                file_data=video_data,
                content_type="video/mp4"
            )
            video_url = storage_service.get_presigned_url(video_result["minio_path"])

            # 썸네일 업로드
            with open(thumbnail_path, "rb") as f:
                thumb_data = f.read()

            thumb_object_path = f"video/{ctx.job_id}/thumbnail.png"
            thumb_result = storage_service.upload_file(
                bucket=bucket,
                object_path=thumb_object_path,
                file_data=thumb_data,
                content_type="image/png"
            )
            thumb_url = storage_service.get_presigned_url(thumb_result["minio_path"])

            return video_url, thumb_url

        except Exception as e:
            logger.error(f"[VideoBuilderV2] Upload failed: {e}")
            # 로컬 경로 반환 (fallback)
            return video_path, thumbnail_path

    async def _run_ffmpeg(self, cmd: str) -> bool:
        """FFmpeg 명령 실행"""
        logger.debug(f"[VideoBuilderV2] FFmpeg: {cmd[:100]}...")

        process = await asyncio.create_subprocess_shell(
            cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        stdout, stderr = await process.communicate()

        if process.returncode != 0:
            logger.error(f"[VideoBuilderV2] FFmpeg error: {stderr.decode()[:500]}")
            return False

        return True


# =============================================================================
# Factory Function
# =============================================================================

_builder_instance: Optional[VideoBuilderV2] = None


def get_video_builder_v2(
    output_dir: Optional[str] = None,
    bgm_dir: Optional[str] = None
) -> VideoBuilderV2:
    """VideoBuilderV2 인스턴스 반환"""
    global _builder_instance
    if _builder_instance is None:
        _builder_instance = VideoBuilderV2(output_dir=output_dir, bgm_dir=bgm_dir)
    return _builder_instance
