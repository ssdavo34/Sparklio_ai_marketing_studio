"""
Video Builder Service (Demo Day)

숏폼 영상 조립 서비스
- Edge TTS: 나레이션 음성 생성
- ffmpeg: 영상 조립

작성일: 2025-11-26
작성자: B팀 (Backend)

기술 스택:
- TTS: Edge TTS (무료, 한국어 지원)
- BGM: 사전 다운로드 파일 (/assets/bgm/)
- 영상: ffmpeg
"""

import asyncio
import logging
import os
import uuid
import tempfile
from pathlib import Path
from typing import Dict, Any, Optional, List
from dataclasses import dataclass
from datetime import datetime

logger = logging.getLogger(__name__)


# =============================================================================
# Data Classes
# =============================================================================

@dataclass
class TTSSegment:
    """TTS 세그먼트"""
    text: str
    output_path: str
    voice: str = "ko-KR-SunHiNeural"
    rate: str = "+0%"
    duration_ms: Optional[int] = None


@dataclass
class VideoScene:
    """비디오 씬"""
    scene_number: int
    image_path: str
    audio_path: Optional[str]
    duration_seconds: float
    text_overlay: Optional[str]
    transition: str = "fade"


@dataclass
class VideoConfig:
    """비디오 설정"""
    width: int = 1080
    height: int = 1920
    fps: int = 30
    format: str = "mp4"
    codec: str = "libx264"
    audio_codec: str = "aac"
    bgm_path: Optional[str] = None
    bgm_volume: float = 0.3


# =============================================================================
# Edge TTS Service
# =============================================================================

class EdgeTTSService:
    """
    Edge TTS 음성 생성 서비스

    Microsoft Edge의 무료 TTS API 사용
    한국어 음성: ko-KR-SunHiNeural (여성), ko-KR-InJoonNeural (남성)
    """

    VOICES = {
        "ko_female": "ko-KR-SunHiNeural",
        "ko_male": "ko-KR-InJoonNeural",
        "en_female": "en-US-JennyNeural",
        "en_male": "en-US-GuyNeural",
    }

    def __init__(self, output_dir: Optional[str] = None):
        """
        Args:
            output_dir: 음성 파일 저장 디렉토리
        """
        self.output_dir = output_dir or tempfile.gettempdir()
        Path(self.output_dir).mkdir(parents=True, exist_ok=True)

    async def generate_speech(
        self,
        text: str,
        voice: str = "ko-KR-SunHiNeural",
        rate: str = "+0%",
        output_path: Optional[str] = None
    ) -> str:
        """
        텍스트 → 음성 변환

        Args:
            text: 변환할 텍스트
            voice: 음성 ID
            rate: 속도 조절 (예: "+10%", "-10%")
            output_path: 출력 파일 경로 (None이면 자동 생성)

        Returns:
            생성된 음성 파일 경로
        """
        import edge_tts

        if not output_path:
            output_path = os.path.join(
                self.output_dir,
                f"tts_{uuid.uuid4().hex[:8]}.mp3"
            )

        try:
            communicate = edge_tts.Communicate(text, voice, rate=rate)
            await communicate.save(output_path)

            logger.info(f"[EdgeTTS] Generated: {output_path} ({len(text)} chars)")
            return output_path

        except Exception as e:
            logger.error(f"[EdgeTTS] Failed to generate speech: {e}")
            raise

    async def generate_multiple(
        self,
        segments: List[TTSSegment]
    ) -> List[str]:
        """
        여러 세그먼트 병렬 생성

        Args:
            segments: TTSSegment 목록

        Returns:
            생성된 파일 경로 목록
        """
        tasks = [
            self.generate_speech(
                text=seg.text,
                voice=seg.voice,
                rate=seg.rate,
                output_path=seg.output_path
            )
            for seg in segments
        ]

        return await asyncio.gather(*tasks)


# =============================================================================
# Video Builder Service
# =============================================================================

class VideoBuilder:
    """
    비디오 빌더 서비스

    이미지 + 오디오 → 영상 조립
    ffmpeg 사용
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
        self.output_dir = output_dir or tempfile.gettempdir()
        self.bgm_dir = bgm_dir or "/assets/bgm"
        self.tts_service = EdgeTTSService(output_dir)

        Path(self.output_dir).mkdir(parents=True, exist_ok=True)

    async def build_shorts_video(
        self,
        script: Dict[str, Any],
        images: Dict[int, str],
        config: Optional[VideoConfig] = None
    ) -> str:
        """
        숏폼 영상 빌드

        Args:
            script: ShortsScriptAgent 출력
            images: 씬 번호 → 이미지 경로 매핑
            config: 비디오 설정

        Returns:
            생성된 영상 파일 경로
        """
        config = config or VideoConfig()

        logger.info(f"[VideoBuilder] Starting build: {len(images)} images")

        # 1. TTS 생성
        tts_files = await self._generate_tts(script)

        # 2. 씬별 비디오 생성
        scene_videos = await self._create_scene_videos(
            script=script,
            images=images,
            tts_files=tts_files,
            config=config
        )

        # 3. 씬 연결
        concat_video = await self._concat_videos(scene_videos, config)

        # 4. BGM 믹싱
        audio_config = script.get("audio", {})
        bgm_track = audio_config.get("bgm_track", "upbeat_corporate_01.mp3")
        bgm_volume = audio_config.get("bgm_volume", 0.3)

        final_video = await self._add_bgm(
            video_path=concat_video,
            bgm_track=bgm_track,
            bgm_volume=bgm_volume,
            config=config
        )

        logger.info(f"[VideoBuilder] Completed: {final_video}")
        return final_video

    async def _generate_tts(self, script: Dict[str, Any]) -> Dict[int, str]:
        """씬별 TTS 생성"""
        tts_files = {}
        audio_config = script.get("audio", {})
        voice = audio_config.get("tts_voice", "ko-KR-SunHiNeural")

        scenes = script.get("scenes", [])
        segments = []

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

    async def _create_scene_videos(
        self,
        script: Dict[str, Any],
        images: Dict[int, str],
        tts_files: Dict[int, str],
        config: VideoConfig
    ) -> List[str]:
        """씬별 비디오 클립 생성"""
        scene_videos = []
        scenes = script.get("scenes", [])

        for scene in scenes:
            scene_num = scene.get("scene_number", 0)
            duration = scene.get("duration_seconds", 5)
            text_overlay = scene.get("text_overlay")

            image_path = images.get(scene_num)
            tts_path = tts_files.get(scene_num)

            if not image_path:
                logger.warning(f"[VideoBuilder] No image for scene {scene_num}, using placeholder")
                continue

            output_path = os.path.join(
                self.output_dir,
                f"scene_{scene_num}.mp4"
            )

            # ffmpeg 명령 구성
            cmd = self._build_scene_ffmpeg_cmd(
                image_path=image_path,
                audio_path=tts_path,
                duration=duration,
                output_path=output_path,
                text_overlay=text_overlay,
                config=config
            )

            # 실행
            process = await asyncio.create_subprocess_shell(
                cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            stdout, stderr = await process.communicate()

            if process.returncode != 0:
                logger.error(f"[VideoBuilder] ffmpeg error: {stderr.decode()}")
            else:
                scene_videos.append(output_path)

        return scene_videos

    def _build_scene_ffmpeg_cmd(
        self,
        image_path: str,
        audio_path: Optional[str],
        duration: float,
        output_path: str,
        text_overlay: Optional[str],
        config: VideoConfig
    ) -> str:
        """씬용 ffmpeg 명령 생성"""
        # 기본 명령
        cmd = f'ffmpeg -y -loop 1 -i "{image_path}"'

        # 오디오 입력
        if audio_path and os.path.exists(audio_path):
            cmd += f' -i "{audio_path}"'
            audio_opts = "-c:a aac -shortest"
        else:
            audio_opts = f"-t {duration}"

        # 비디오 필터
        filters = [
            f"scale={config.width}:{config.height}:force_original_aspect_ratio=decrease",
            f"pad={config.width}:{config.height}:(ow-iw)/2:(oh-ih)/2",
            f"fps={config.fps}"
        ]

        # 텍스트 오버레이 (옵션)
        if text_overlay:
            # 한글 폰트 지정 필요
            safe_text = text_overlay.replace("'", "\\'")
            filters.append(
                f"drawtext=text='{safe_text}':fontsize=60:fontcolor=white:"
                f"x=(w-text_w)/2:y=h-150:borderw=3:bordercolor=black"
            )

        filter_str = ",".join(filters)
        cmd += f' -vf "{filter_str}"'

        # 출력 옵션
        cmd += f" -c:v {config.codec} -pix_fmt yuv420p {audio_opts}"
        cmd += f' "{output_path}"'

        return cmd

    async def _concat_videos(
        self,
        video_paths: List[str],
        config: VideoConfig
    ) -> str:
        """비디오 연결"""
        if not video_paths:
            raise ValueError("No video files to concat")

        if len(video_paths) == 1:
            return video_paths[0]

        # concat 파일 생성
        concat_file = os.path.join(self.output_dir, "concat_list.txt")
        with open(concat_file, "w") as f:
            for path in video_paths:
                f.write(f"file '{path}'\n")

        output_path = os.path.join(
            self.output_dir,
            f"concat_{uuid.uuid4().hex[:8]}.mp4"
        )

        cmd = f'ffmpeg -y -f concat -safe 0 -i "{concat_file}" -c copy "{output_path}"'

        process = await asyncio.create_subprocess_shell(
            cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        await process.communicate()

        return output_path

    async def _add_bgm(
        self,
        video_path: str,
        bgm_track: str,
        bgm_volume: float,
        config: VideoConfig
    ) -> str:
        """BGM 추가"""
        bgm_path = os.path.join(self.bgm_dir, bgm_track)

        if not os.path.exists(bgm_path):
            logger.warning(f"[VideoBuilder] BGM not found: {bgm_path}, skipping")
            return video_path

        output_path = os.path.join(
            self.output_dir,
            f"final_{uuid.uuid4().hex[:8]}.mp4"
        )

        # BGM 볼륨 조절 및 믹싱
        cmd = (
            f'ffmpeg -y -i "{video_path}" -i "{bgm_path}" '
            f'-filter_complex "[0:a]volume=1[a1];[1:a]volume={bgm_volume}[a2];'
            f'[a1][a2]amix=inputs=2:duration=first[aout]" '
            f'-map 0:v -map "[aout]" -c:v copy -c:a aac -shortest '
            f'"{output_path}"'
        )

        process = await asyncio.create_subprocess_shell(
            cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        await process.communicate()

        if os.path.exists(output_path):
            return output_path
        else:
            logger.warning("[VideoBuilder] BGM mixing failed, returning original")
            return video_path


# =============================================================================
# Factory Function
# =============================================================================

def get_video_builder(
    output_dir: Optional[str] = None,
    bgm_dir: Optional[str] = None
) -> VideoBuilder:
    """VideoBuilder 인스턴스 반환"""
    return VideoBuilder(output_dir=output_dir, bgm_dir=bgm_dir)


def get_tts_service(output_dir: Optional[str] = None) -> EdgeTTSService:
    """EdgeTTSService 인스턴스 반환"""
    return EdgeTTSService(output_dir=output_dir)
