"""
Video Builder Agent (Non-LLM)

이미지, 오디오, 자막을 조합하여 영상을 생성하는 에이전트

작성일: 2025-11-28
수정일: 2025-11-29 - execute_v3() 메서드 추가 (Plan-Act-Reflect 패턴)
작성자: B팀 (Backend)
참조: AGENTS_DEMO_SPEC.md - VideoBuilder

LLM 사용: 없음 (ffmpeg, moviepy 기반)
"""

import os
import json
import logging
import asyncio
import subprocess
import tempfile
from pathlib import Path
from typing import Dict, Any, Optional, List
from pydantic import BaseModel, Field
from datetime import datetime
from uuid import uuid4

from app.services.agents.base import (
    AgentBase, AgentRequest, AgentResponse, AgentOutput, AgentError,
    AgentGoal, SelfReview, ExecutionPlan
)

logger = logging.getLogger(__name__)


# =============================================================================
# Input/Output Schemas
# =============================================================================

class VideoScene(BaseModel):
    """영상 씬 정의"""
    scene_id: str = Field(..., description="씬 ID")
    image_url: Optional[str] = Field(None, description="이미지 URL")
    image_path: Optional[str] = Field(None, description="로컬 이미지 경로")
    duration: float = Field(default=3.0, description="씬 길이 (초)")
    transition: str = Field(default="fade", description="전환 효과 (fade, cut, slide)")
    text_overlay: Optional[str] = Field(None, description="텍스트 오버레이")
    text_position: str = Field(default="center", description="텍스트 위치")
    zoom_effect: Optional[str] = Field(None, description="줌 효과 (in, out, none)")


class AudioTrack(BaseModel):
    """오디오 트랙"""
    track_id: str = Field(..., description="트랙 ID")
    audio_url: Optional[str] = Field(None, description="오디오 URL")
    audio_path: Optional[str] = Field(None, description="로컬 오디오 경로")
    track_type: str = Field(default="bgm", description="트랙 유형 (bgm, voiceover, sfx)")
    volume: float = Field(default=1.0, ge=0.0, le=2.0, description="볼륨")
    start_time: float = Field(default=0.0, description="시작 시간 (초)")
    fade_in: float = Field(default=0.5, description="페이드 인 (초)")
    fade_out: float = Field(default=0.5, description="페이드 아웃 (초)")


class SubtitleEntry(BaseModel):
    """자막 항목"""
    text: str = Field(..., description="자막 텍스트")
    start_time: float = Field(..., description="시작 시간 (초)")
    end_time: float = Field(..., description="종료 시간 (초)")
    style: str = Field(default="default", description="자막 스타일")


class VideoBuilderInput(BaseModel):
    """VideoBuilder 입력"""
    scenes: List[VideoScene] = Field(..., description="씬 목록")
    audio_tracks: List[AudioTrack] = Field(default_factory=list, description="오디오 트랙")
    subtitles: List[SubtitleEntry] = Field(default_factory=list, description="자막 목록")
    output_format: str = Field(default="mp4", description="출력 포맷 (mp4, webm, mov)")
    resolution: str = Field(default="1080x1920", description="해상도 (WxH)")
    fps: int = Field(default=30, description="프레임 레이트")
    quality: str = Field(default="high", description="품질 (draft, standard, high)")


class VideoBuilderOutput(BaseModel):
    """VideoBuilder 출력"""
    video_id: str = Field(..., description="영상 ID")
    video_url: Optional[str] = Field(None, description="영상 URL")
    video_path: Optional[str] = Field(None, description="로컬 영상 경로")
    duration: float = Field(..., description="총 길이 (초)")
    resolution: str = Field(..., description="해상도")
    file_size: Optional[int] = Field(None, description="파일 크기 (bytes)")
    scenes_count: int = Field(..., description="씬 수")
    status: str = Field(default="completed", description="상태")


# =============================================================================
# Video Builder Agent
# =============================================================================

class VideoBuilder(AgentBase):
    """
    Video Builder Agent (Non-LLM)

    이미지, 오디오, 자막을 조합하여 숏폼/릴스 영상을 생성합니다.
    LLM을 사용하지 않고 ffmpeg/moviepy를 사용합니다.

    주요 기능:
    - 이미지 시퀀스 → 영상 변환
    - 전환 효과 (fade, slide, zoom)
    - 오디오 믹싱 (BGM, 나레이션)
    - 자막 삽입
    - 다양한 출력 포맷 지원
    """

    # 품질별 설정
    QUALITY_PRESETS = {
        "draft": {"crf": 28, "preset": "ultrafast"},
        "standard": {"crf": 23, "preset": "medium"},
        "high": {"crf": 18, "preset": "slow"}
    }

    @property
    def name(self) -> str:
        return "video_builder"

    async def execute(self, request: AgentRequest) -> AgentResponse:
        """
        영상 빌드 실행

        Args:
            request: AgentRequest

        Returns:
            AgentResponse
        """
        start_time = datetime.utcnow()

        self._validate_request(request)

        try:
            input_data = VideoBuilderInput(**request.payload)
        except Exception as e:
            raise AgentError(
                message=f"Invalid input: {str(e)}",
                agent=self.name,
                details={"payload": request.payload}
            )

        logger.info(f"[VideoBuilder] Building video with {len(input_data.scenes)} scenes")

        video_id = f"video_{uuid4().hex[:8]}"

        try:
            # 영상 빌드
            result = await self._build_video(video_id, input_data)
        except Exception as e:
            logger.error(f"[VideoBuilder] Build failed: {e}")
            raise AgentError(
                message=f"Video build failed: {str(e)}",
                agent=self.name,
                details={"video_id": video_id}
            )

        elapsed = (datetime.utcnow() - start_time).total_seconds()

        # 총 길이 계산
        total_duration = sum(scene.duration for scene in input_data.scenes)

        output_data = VideoBuilderOutput(
            video_id=video_id,
            video_url=result.get("url"),
            video_path=result.get("path"),
            duration=total_duration,
            resolution=input_data.resolution,
            file_size=result.get("file_size"),
            scenes_count=len(input_data.scenes),
            status="completed"
        )

        logger.info(f"[VideoBuilder] Built video {video_id} ({total_duration:.1f}s) in {elapsed:.2f}s")

        return AgentResponse(
            agent=self.name,
            task=request.task,
            outputs=[
                self._create_output(
                    output_type="video",
                    name="built_video",
                    value=output_data.model_dump(),
                    meta={"duration": total_duration}
                )
            ],
            usage={
                "scenes_processed": len(input_data.scenes),
                "elapsed_seconds": elapsed
            },
            meta={
                "resolution": input_data.resolution,
                "fps": input_data.fps,
                "format": input_data.output_format
            }
        )

    async def _build_video(
        self,
        video_id: str,
        input_data: VideoBuilderInput
    ) -> Dict[str, Any]:
        """영상 빌드 실행"""
        # 임시 디렉토리 생성
        with tempfile.TemporaryDirectory() as tmpdir:
            tmpdir = Path(tmpdir)

            # 1. 이미지 다운로드/준비
            image_paths = await self._prepare_images(input_data.scenes, tmpdir)

            # 2. 해상도 파싱
            width, height = map(int, input_data.resolution.split("x"))

            # 3. 품질 설정
            quality = self.QUALITY_PRESETS.get(input_data.quality, self.QUALITY_PRESETS["standard"])

            # 4. ffmpeg 명령 구성
            output_path = tmpdir / f"{video_id}.{input_data.output_format}"

            # 씬별 영상 생성
            scene_videos = []
            for i, (scene, img_path) in enumerate(zip(input_data.scenes, image_paths)):
                scene_video = await self._create_scene_video(
                    scene, img_path, tmpdir, i, width, height, input_data.fps
                )
                scene_videos.append(scene_video)

            # 5. 씬 연결
            concat_path = await self._concat_scenes(scene_videos, tmpdir, video_id)

            # 6. 오디오 추가
            if input_data.audio_tracks:
                final_path = await self._add_audio(
                    concat_path, input_data.audio_tracks, tmpdir, video_id
                )
            else:
                final_path = concat_path

            # 7. 자막 추가
            if input_data.subtitles:
                final_path = await self._add_subtitles(
                    final_path, input_data.subtitles, tmpdir, video_id
                )

            # 8. 최종 인코딩
            final_output = await self._final_encode(
                final_path, output_path, quality, input_data.fps
            )

            # 9. 스토리지 업로드
            uploaded_url = await self._upload_to_storage(final_output, video_id)

            file_size = os.path.getsize(final_output) if os.path.exists(final_output) else None

            return {
                "path": str(final_output),
                "url": uploaded_url,
                "file_size": file_size
            }

    async def _prepare_images(
        self,
        scenes: List[VideoScene],
        tmpdir: Path
    ) -> List[Path]:
        """이미지 준비 (다운로드/복사)"""
        image_paths = []

        for i, scene in enumerate(scenes):
            if scene.image_path and os.path.exists(scene.image_path):
                image_paths.append(Path(scene.image_path))
            elif scene.image_url:
                # URL에서 다운로드
                downloaded = await self._download_image(scene.image_url, tmpdir, i)
                image_paths.append(downloaded)
            else:
                # 기본 이미지 (검은 배경)
                default_path = tmpdir / f"scene_{i}_default.png"
                await self._create_default_image(default_path)
                image_paths.append(default_path)

        return image_paths

    async def _download_image(self, url: str, tmpdir: Path, index: int) -> Path:
        """이미지 다운로드"""
        import aiohttp

        output_path = tmpdir / f"scene_{index}.png"

        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(url) as response:
                    if response.status == 200:
                        content = await response.read()
                        with open(output_path, "wb") as f:
                            f.write(content)
                        return output_path
        except Exception as e:
            logger.warning(f"[VideoBuilder] Failed to download image: {e}")

        # 실패 시 기본 이미지
        await self._create_default_image(output_path)
        return output_path

    async def _create_default_image(self, path: Path):
        """기본 이미지 생성 (검은 배경)"""
        # ffmpeg로 검은 배경 이미지 생성
        cmd = [
            "ffmpeg", "-y",
            "-f", "lavfi",
            "-i", "color=c=black:s=1080x1920:d=1",
            "-frames:v", "1",
            str(path)
        ]
        await self._run_ffmpeg(cmd)

    async def _create_scene_video(
        self,
        scene: VideoScene,
        image_path: Path,
        tmpdir: Path,
        index: int,
        width: int,
        height: int,
        fps: int
    ) -> Path:
        """씬 영상 생성"""
        output_path = tmpdir / f"scene_{index}.mp4"

        # 기본 명령
        cmd = [
            "ffmpeg", "-y",
            "-loop", "1",
            "-i", str(image_path),
            "-t", str(scene.duration),
            "-vf", f"scale={width}:{height}:force_original_aspect_ratio=decrease,"
                   f"pad={width}:{height}:(ow-iw)/2:(oh-ih)/2:black"
        ]

        # 줌 효과 추가
        if scene.zoom_effect == "in":
            cmd[-1] += f",zoompan=z='min(zoom+0.001,1.5)':d={int(scene.duration * fps)}:s={width}x{height}"
        elif scene.zoom_effect == "out":
            cmd[-1] += f",zoompan=z='if(lte(zoom,1.0),1.5,max(1.001,zoom-0.001))':d={int(scene.duration * fps)}:s={width}x{height}"

        # 텍스트 오버레이
        if scene.text_overlay:
            text_filter = self._build_text_filter(scene.text_overlay, scene.text_position, width, height)
            cmd[-1] += f",{text_filter}"

        cmd.extend([
            "-c:v", "libx264",
            "-pix_fmt", "yuv420p",
            "-r", str(fps),
            str(output_path)
        ])

        await self._run_ffmpeg(cmd)
        return output_path

    def _build_text_filter(
        self,
        text: str,
        position: str,
        width: int,
        height: int
    ) -> str:
        """텍스트 필터 생성"""
        # 텍스트 위치 계산
        positions = {
            "center": f"x=(w-text_w)/2:y=(h-text_h)/2",
            "top": f"x=(w-text_w)/2:y=100",
            "bottom": f"x=(w-text_w)/2:y=h-text_h-100",
            "top_left": f"x=50:y=50",
            "bottom_left": f"x=50:y=h-text_h-50"
        }
        pos = positions.get(position, positions["center"])

        # 특수 문자 이스케이프
        escaped_text = text.replace("'", "\\'").replace(":", "\\:")

        return f"drawtext=text='{escaped_text}':{pos}:fontsize=48:fontcolor=white:borderw=2:bordercolor=black"

    async def _concat_scenes(
        self,
        scene_videos: List[Path],
        tmpdir: Path,
        video_id: str
    ) -> Path:
        """씬 연결"""
        output_path = tmpdir / f"{video_id}_concat.mp4"

        # 파일 목록 생성
        list_file = tmpdir / "concat_list.txt"
        with open(list_file, "w") as f:
            for video in scene_videos:
                f.write(f"file '{video}'\n")

        cmd = [
            "ffmpeg", "-y",
            "-f", "concat",
            "-safe", "0",
            "-i", str(list_file),
            "-c", "copy",
            str(output_path)
        ]

        await self._run_ffmpeg(cmd)
        return output_path

    async def _add_audio(
        self,
        video_path: Path,
        audio_tracks: List[AudioTrack],
        tmpdir: Path,
        video_id: str
    ) -> Path:
        """오디오 추가"""
        output_path = tmpdir / f"{video_id}_audio.mp4"

        # 첫 번째 오디오 트랙만 처리 (간단화)
        audio = audio_tracks[0]

        if audio.audio_url:
            audio_path = await self._download_audio(audio.audio_url, tmpdir)
        elif audio.audio_path:
            audio_path = Path(audio.audio_path)
        else:
            return video_path  # 오디오 없음

        cmd = [
            "ffmpeg", "-y",
            "-i", str(video_path),
            "-i", str(audio_path),
            "-c:v", "copy",
            "-c:a", "aac",
            "-map", "0:v:0",
            "-map", "1:a:0",
            "-shortest",
            str(output_path)
        ]

        await self._run_ffmpeg(cmd)
        return output_path

    async def _download_audio(self, url: str, tmpdir: Path) -> Path:
        """오디오 다운로드"""
        import aiohttp

        output_path = tmpdir / "audio.mp3"

        async with aiohttp.ClientSession() as session:
            async with session.get(url) as response:
                if response.status == 200:
                    content = await response.read()
                    with open(output_path, "wb") as f:
                        f.write(content)

        return output_path

    async def _add_subtitles(
        self,
        video_path: Path,
        subtitles: List[SubtitleEntry],
        tmpdir: Path,
        video_id: str
    ) -> Path:
        """자막 추가"""
        output_path = tmpdir / f"{video_id}_subs.mp4"

        # SRT 파일 생성
        srt_path = tmpdir / "subtitles.srt"
        self._create_srt_file(subtitles, srt_path)

        cmd = [
            "ffmpeg", "-y",
            "-i", str(video_path),
            "-vf", f"subtitles={srt_path}",
            "-c:a", "copy",
            str(output_path)
        ]

        await self._run_ffmpeg(cmd)
        return output_path

    def _create_srt_file(self, subtitles: List[SubtitleEntry], path: Path):
        """SRT 자막 파일 생성"""
        def format_time(seconds: float) -> str:
            hours = int(seconds // 3600)
            minutes = int((seconds % 3600) // 60)
            secs = int(seconds % 60)
            millis = int((seconds % 1) * 1000)
            return f"{hours:02d}:{minutes:02d}:{secs:02d},{millis:03d}"

        with open(path, "w", encoding="utf-8") as f:
            for i, sub in enumerate(subtitles, 1):
                f.write(f"{i}\n")
                f.write(f"{format_time(sub.start_time)} --> {format_time(sub.end_time)}\n")
                f.write(f"{sub.text}\n\n")

    async def _final_encode(
        self,
        input_path: Path,
        output_path: Path,
        quality: Dict[str, Any],
        fps: int
    ) -> Path:
        """최종 인코딩"""
        cmd = [
            "ffmpeg", "-y",
            "-i", str(input_path),
            "-c:v", "libx264",
            "-crf", str(quality["crf"]),
            "-preset", quality["preset"],
            "-c:a", "aac",
            "-b:a", "128k",
            "-r", str(fps),
            "-movflags", "+faststart",
            str(output_path)
        ]

        await self._run_ffmpeg(cmd)
        return output_path

    async def _run_ffmpeg(self, cmd: List[str]):
        """ffmpeg 명령 실행"""
        try:
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            stdout, stderr = await process.communicate()

            if process.returncode != 0:
                logger.error(f"[VideoBuilder] ffmpeg error: {stderr.decode()}")
                raise Exception(f"ffmpeg failed: {stderr.decode()[:500]}")

        except FileNotFoundError:
            logger.error("[VideoBuilder] ffmpeg not found")
            raise Exception("ffmpeg is not installed or not in PATH")

    async def _upload_to_storage(self, video_path: Path, video_id: str) -> Optional[str]:
        """스토리지에 업로드"""
        try:
            # Media Gateway를 통해 업로드
            result = await self.media_gateway.upload_file(
                file_path=str(video_path),
                file_type="video",
                file_id=video_id
            )
            return result.get("url")
        except Exception as e:
            logger.warning(f"[VideoBuilder] Storage upload failed: {e}")
            return None

    # =========================================================================
    # Plan-Act-Reflect 패턴 (v3.0)
    # =========================================================================

    async def execute_v3(self, request: AgentRequest) -> AgentResponse:
        """
        VideoBuilder v3.0 - Plan-Act-Reflect 패턴 적용

        기존 execute()를 래핑하여 목표 기반 자기 검수를 수행합니다.
        Non-LLM 에이전트이지만 빌드 프로세스 품질 검증을 수행합니다.

        Args:
            request: Agent 요청 (goal 필드 권장)

        Returns:
            AgentResponse: 품질 검수를 통과한 영상
        """
        logger.info(f"[{self.name}] execute_v3 called (Plan-Act-Reflect)")

        # Goal이 없으면 기본 Goal 생성
        if not request.goal:
            request.goal = AgentGoal(
                primary_objective="고품질 숏폼 영상 생성",
                success_criteria=[
                    "모든 씬 정상 렌더링",
                    "오디오/비디오 동기화",
                    "출력 파일 무결성"
                ],
                quality_threshold=7.0,
                max_iterations=2
            )

        # Plan-Act-Reflect 실행
        return await self.execute_with_reflection(request)

    async def _plan(self, request: AgentRequest) -> ExecutionPlan:
        """
        VideoBuilder 전용 Plan 단계

        Args:
            request: Agent 요청

        Returns:
            ExecutionPlan
        """
        plan_id = f"video_plan_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"
        goal = request.goal

        # 입력 분석
        scenes_count = len(request.payload.get("scenes", []))
        has_audio = len(request.payload.get("audio_tracks", [])) > 0
        has_subtitles = len(request.payload.get("subtitles", [])) > 0
        resolution = request.payload.get("resolution", "1080x1920")
        quality = request.payload.get("quality", "high")

        # 접근 방식 결정
        approach = f"이미지 {scenes_count}개 → 씬 렌더링 → "
        if has_audio:
            approach += "오디오 믹싱 → "
        if has_subtitles:
            approach += "자막 삽입 → "
        approach += f"최종 인코딩 ({quality} 품질)"

        steps = [
            {"step": 1, "action": f"이미지 {scenes_count}개 준비 (다운로드/검증)", "status": "pending"},
            {"step": 2, "action": "씬별 영상 렌더링", "status": "pending"},
            {"step": 3, "action": "씬 연결 및 전환 효과 적용", "status": "pending"}
        ]

        if has_audio:
            steps.append({"step": len(steps) + 1, "action": "오디오 트랙 믹싱", "status": "pending"})

        if has_subtitles:
            steps.append({"step": len(steps) + 1, "action": "자막 삽입", "status": "pending"})

        steps.append({"step": len(steps) + 1, "action": "최종 인코딩 및 업로드", "status": "pending"})
        steps.append({"step": len(steps) + 1, "action": "자기 검수 (파일 검증)", "status": "pending"})

        risks = ["ffmpeg 실행 실패", "이미지 다운로드 실패"]

        if scenes_count > 10:
            risks.append(f"대량 씬 처리 ({scenes_count}개)")
        if quality == "high":
            risks.append("높은 인코딩 시간")

        return ExecutionPlan(
            plan_id=plan_id,
            steps=steps,
            approach=approach,
            estimated_quality=7.5,
            risks=risks
        )


# =============================================================================
# Factory Function
# =============================================================================

def get_video_builder(media_gateway=None) -> VideoBuilder:
    """VideoBuilder 인스턴스 반환"""
    return VideoBuilder(media_gateway=media_gateway)
