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
        """씬별 클립 생성 (Ken Burns 포함)"""
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

            # FFmpeg 필터 구성
            filters = self._build_scene_filters(ctx, scene, duration)

            # FFmpeg 명령
            cmd = self._build_scene_ffmpeg_cmd(
                image_path=image_path,
                duration=duration,
                filters=filters,
                output_path=str(output_path),
                fps=ctx.timeline.canvas.fps
            )

            # 실행
            success = await self._run_ffmpeg(cmd)
            if success and output_path.exists():
                ctx.scene_clips.append(str(output_path))
            else:
                logger.error(f"[VideoBuilderV2] Failed to render scene {scene.scene_index}")

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
        """xfade 기반 연결"""
        # MVP: 2개씩 순차적으로 xfade 적용
        current = ctx.scene_clips[0]
        scenes = ctx.timeline.scenes

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
            else:
                # xfade 처리
                offset = prev_scene.end_sec - prev_scene.start_sec - transition.duration_sec
                cmd = (
                    f'ffmpeg -y -i "{current}" -i "{next_clip}" '
                    f'-filter_complex "[0:v][1:v]xfade=transition={xfade_type}:'
                    f'duration={transition.duration_sec}:offset={offset}[v]" '
                    f'-map "[v]" -c:v libx264 -preset fast -pix_fmt yuv420p '
                    f'"{output_path}"'
                )

            await self._run_ffmpeg(cmd)
            current = str(output_path)

        return current

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
        """BGM 및 보이스오버 믹싱"""
        audio_config = ctx.timeline.audio
        
        # 1. BGM 준비
        bgm_path = None
        if audio_config.bgm_mode == BGMMode.AUTO:
            bgm_path = await self._download_bgm(ctx, "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3")
        elif audio_config.bgm_url:
            bgm_path = await self._download_bgm(ctx, audio_config.bgm_url)

        # 2. 보이스오버 준비
        voiceover_inputs = [] # (path, offset_ms)
        current_offset = 0.0
        
        has_voiceover = hasattr(ctx, 'voiceover_paths') and ctx.voiceover_paths
        
        if has_voiceover:
            for scene in ctx.timeline.scenes:
                # 씬 길이 계산 (TTS override 반영)
                duration = getattr(scene, 'duration_override', scene.end_sec - scene.start_sec)
                
                # 보이스오버가 있으면 추가
                v_path = ctx.voiceover_paths.get(scene.scene_index)
                if v_path:
                    voiceover_inputs.append((v_path, int(current_offset * 1000)))
                
                current_offset += duration

        if not bgm_path and not voiceover_inputs:
            return video_path

        logger.info(f"[VideoBuilderV2] Mixing Audio: BGM={bool(bgm_path)}, Voiceovers={len(voiceover_inputs)}")

        output_path = ctx.workdir / "with_audio.mp4"
        
        # FFmpeg 명령 구성
        inputs = [f'-i "{video_path}"']
        filter_complex = []
        
        # BGM 입력 (인덱스 1)
        if bgm_path:
            inputs.append(f'-i "{bgm_path}"')
            # BGM 루프 및 볼륨 조절
            # video duration 구하기 (current_offset이 총 길이)
            total_duration = current_offset if current_offset > 0 else ctx.timeline.global_config.total_duration_sec
            
            filter_complex.append(
                f"[1:a]atrim=0:{total_duration},asetpts=PTS-STARTPTS,"
                f"volume={audio_config.bgm_volume},loudnorm=I=-16:TP=-1.5:LRA=11[bgm]"
            )
        
        # 보이스오버 입력 (인덱스 2부터)
        vo_filter_tags = []
        for i, (path, offset) in enumerate(voiceover_inputs):
            input_idx = len(inputs)
            inputs.append(f'-i "{path}"')
            # 딜레이 적용 (adelay는 ms 단위)
            tag = f"vo{i}"
            filter_complex.append(f"[{input_idx}:a]adelay={offset}|{offset}[{tag}]")
            vo_filter_tags.append(f"[{tag}]")
            
        # 믹싱
        mix_inputs = []
        if bgm_path:
            mix_inputs.append("[bgm]")
        mix_inputs.extend(vo_filter_tags)
        
        if len(mix_inputs) > 1:
            filter_complex.append(f"{''.join(mix_inputs)}amix=inputs={len(mix_inputs)}:duration=first:dropout_transition=2[a]")
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

    async def _download_bgm(self, ctx: RenderContext, url: str) -> Optional[str]:
        """BGM 다운로드"""
        try:
            local_path = ctx.workdir / "bgm.mp3"
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(url)
                response.raise_for_status()
                with open(local_path, "wb") as f:
                    f.write(response.content)
            return str(local_path)
        except Exception as e:
            logger.warning(f"[VideoBuilderV2] Failed to download BGM: {e}")
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
