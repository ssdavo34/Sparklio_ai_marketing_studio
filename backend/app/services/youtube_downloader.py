"""
YouTube 다운로드 서비스 (yt-dlp 사용)

Stage 1: Caption만 다운로드
Stage 2: Audio도 다운로드

작성일: 2025-11-24
작성자: B팀
참조: MEETING_FROM_URL_CONTRACT.md, MEETING_FROM_URL_BACKEND_GUIDE.md
"""

import logging
import subprocess
import json
import tempfile
from pathlib import Path
from typing import Optional, Dict, Any, List, Tuple

logger = logging.getLogger(__name__)


class YouTubeDownloader:
    """
    YouTube URL에서 자막/오디오 다운로드

    yt-dlp 래퍼 클래스
    """

    def __init__(self):
        self.yt_dlp_path = "yt-dlp"  # PATH에서 찾기

    async def get_captions(
        self,
        url: str,
        language: str = "ko"
    ) -> Optional[List[Dict[str, Any]]]:
        """
        YouTube 자막 가져오기 (Stage 1)

        Args:
            url: YouTube URL
            language: 언어 코드 (ko, en 등)

        Returns:
            자막 데이터 (segments 리스트) 또는 None

            예시:
            [
                {
                    "start": 0.0,
                    "end": 2.5,
                    "text": "안녕하세요"
                },
                ...
            ]

        Raises:
            Exception: yt-dlp 실행 실패
        """
        logger.info(f"YouTubeDownloader: Getting captions from {url}, lang={language}")

        try:
            # yt-dlp로 자막 다운로드
            cmd = [
                self.yt_dlp_path,
                "--skip-download",           # 동영상은 다운로드 안 함
                "--write-auto-sub",          # 자동 생성 자막도 포함
                "--sub-lang", language,      # 언어 지정
                "--sub-format", "json3",     # JSON 포맷 (타임스탬프 포함)
                "--output", "%(id)s.%(ext)s",  # 파일명 포맷
                "--js-runtimes", "node",     # Node.js를 JS 런타임으로 사용 (yt-dlp-ejs 필요)
                url
            ]

            with tempfile.TemporaryDirectory() as tmpdir:
                result = subprocess.run(
                    cmd,
                    cwd=tmpdir,
                    capture_output=True,
                    text=True,
                    timeout=60
                )

                if result.returncode != 0:
                    logger.error(f"yt-dlp failed: {result.stderr}")
                    return None

                # JSON 자막 파일 찾기
                subtitle_files = list(Path(tmpdir).glob("*.json3"))

                if not subtitle_files:
                    logger.warning(f"No captions found for {url}")
                    return None

                # JSON 파싱
                with open(subtitle_files[0], "r", encoding="utf-8") as f:
                    caption_data = json.load(f)

                # segments 추출
                events = caption_data.get("events", [])
                segments = []

                for event in events:
                    if "segs" not in event:
                        continue

                    start_time = event.get("tStartMs", 0) / 1000.0
                    duration = event.get("dDurationMs", 0) / 1000.0
                    end_time = start_time + duration

                    text = "".join(seg.get("utf8", "") for seg in event["segs"])
                    text = text.strip()

                    if text:
                        segments.append({
                            "start": start_time,
                            "end": end_time,
                            "text": text
                        })

                logger.info(f"YouTubeDownloader: Got {len(segments)} caption segments")
                return segments

        except subprocess.TimeoutExpired:
            logger.error(f"yt-dlp timeout for {url}")
            return None
        except Exception as e:
            logger.exception(f"Failed to get captions: {e}")
            return None

    async def download_audio(
        self,
        url: str,
        output_path: str
    ) -> Tuple[bool, Optional[str]]:
        """
        YouTube 오디오 다운로드 (Stage 2)

        Args:
            url: YouTube URL
            output_path: 저장할 파일 경로 (예: /tmp/audio.mp4)

        Returns:
            Tuple[성공여부, 에러메시지]
            - (True, None): 성공
            - (False, "에러메시지"): 실패
        """
        logger.info(f"YouTubeDownloader: Downloading audio from {url}")

        try:
            cmd = [
                self.yt_dlp_path,
                "--format", "bestaudio",  # 오디오만
                "--output", output_path,
                "--js-runtimes", "node",  # Node.js를 JS 런타임으로 사용 (yt-dlp-ejs 필요)
                url
            ]

            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=300  # 5분 타임아웃
            )

            if result.returncode != 0:
                error_msg = result.stderr.strip() if result.stderr else "Unknown yt-dlp error"
                # 에러 메시지 정리 (너무 길면 자르기)
                if len(error_msg) > 500:
                    error_msg = error_msg[:500] + "..."
                logger.error(f"yt-dlp audio download failed: {error_msg}")
                return False, f"yt-dlp error: {error_msg}"

            if not Path(output_path).exists():
                error_msg = f"Audio file not created at {output_path}"
                logger.error(error_msg)
                return False, error_msg

            logger.info(f"YouTubeDownloader: Audio downloaded to {output_path}")
            return True, None

        except subprocess.TimeoutExpired:
            error_msg = f"Download timeout (>5min) for {url}"
            logger.error(error_msg)
            return False, error_msg
        except FileNotFoundError:
            error_msg = "yt-dlp not installed. Please install: pip install yt-dlp"
            logger.error(error_msg)
            return False, error_msg
        except Exception as e:
            error_msg = f"Download failed: {str(e)}"
            logger.exception(error_msg)
            return False, error_msg


def get_youtube_downloader() -> YouTubeDownloader:
    """
    YouTubeDownloader 인스턴스 반환

    Returns:
        YouTubeDownloader
    """
    return YouTubeDownloader()
