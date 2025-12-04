"""
Transcript Refiner

트랜스크립트 정제 및 마크다운 변환 유틸리티

작성일: 2025-12-04
작성자: B팀
"""

import re
import logging
from datetime import datetime
from typing import List, Dict, Any, Optional

logger = logging.getLogger(__name__)


def format_timestamp(seconds: float) -> str:
    """초를 HH:MM:SS 형식으로 변환"""
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    if hours > 0:
        return f"{hours:02d}:{minutes:02d}:{secs:02d}"
    return f"{minutes:02d}:{secs:02d}"


def refine_transcript(text: str, keep_speaker_marker: bool = False) -> str:
    """
    트랜스크립트 텍스트 정제

    Whisper STT 결과에서 노이즈를 제거하고 정제된 텍스트를 반환.
    DB에 저장되기 전에 호출되어 깨끗한 텍스트가 저장되도록 함.

    Args:
        text: 원본 텍스트
        keep_speaker_marker: True면 >> 마커를 [화자]로 변환, False면 제거

    정제 항목:
    1. 소리 태그 제거: [음악], [박수], [웃음], [침묵] 등
    2. 화자 마커 정리: >> 기호 변환 또는 제거
    3. 반복 문구 제거: 연속 중복 문장 제거
    4. 공백 정규화: 과도한 공백/줄바꿈 정리
    5. 인사말/광고 패턴 제거
    """
    if not text:
        return ""

    original_len = len(text)

    # 1. 소리/환경 태그 제거 (대소문자 무시, 더 많은 패턴)
    sound_patterns = [
        r'\[음악\]', r'\[박수\]', r'\[웃음\]', r'\[침묵\]',
        r'\[한숨\]', r'\[기침\]', r'\[노래\]', r'\[박수 소리\]',
        r'\[Music\]', r'\[Applause\]', r'\[Laughter\]', r'\[Silence\]',
        r'\[Cough\]', r'\[Sigh\]', r'\[음악 재생\]', r'\[배경음악\]',
    ]
    for pattern in sound_patterns:
        text = re.sub(pattern, '', text, flags=re.IGNORECASE)

    # 2. 화자 마커 정리 (>> 기호)
    if keep_speaker_marker:
        # >> 를 줄바꿈 + [화자] 로 변환 (화자 분리용)
        text = re.sub(r'>>\s*', '\n\n**[화자]** ', text)
    else:
        # >> 제거
        text = re.sub(r'>>\s*', '', text)

    # 3. 타임스탬프 패턴 제거 (00:00:00 형식)
    text = re.sub(r'\b\d{1,2}:\d{2}(:\d{2})?\b\s*', '', text)

    # 4. 광고/인사말 패턴 제거 (유튜브 등)
    ad_patterns = [
        r'자세한 사항은\s*댓글창을\s*확인하세요\.?',
        r'미래를\s*먼저\s*보다\.?\s*디타임즈\.?',
        r'구독과\s*좋아요\s*부탁드립니다\.?',
        r'채널\s*구독\s*부탁드립니다\.?',
    ]
    for pattern in ad_patterns:
        text = re.sub(pattern, '', text, flags=re.IGNORECASE)

    # 5. 반복 문장 제거 (연속된 동일/유사 문장)
    lines = text.split('\n')
    deduplicated_lines = []
    prev_line = None
    for line in lines:
        stripped = line.strip()
        # 빈 줄 처리
        if not stripped:
            if deduplicated_lines and deduplicated_lines[-1].strip():
                deduplicated_lines.append('')
            continue
        # 이전과 동일하면 스킵
        if stripped == prev_line:
            continue
        # 이전과 80% 이상 유사하면 스킵 (짧은 문장은 제외)
        if prev_line and len(stripped) > 20 and len(prev_line) > 20:
            # 간단한 유사도 체크 (공통 단어 비율)
            words1 = set(stripped.split())
            words2 = set(prev_line.split())
            if len(words1) > 0 and len(words2) > 0:
                common = len(words1 & words2)
                similarity = common / max(len(words1), len(words2))
                if similarity > 0.8:
                    continue
        deduplicated_lines.append(line)
        prev_line = stripped
    text = '\n'.join(deduplicated_lines)

    # 6. 연속 공백 정규화
    text = re.sub(r' {2,}', ' ', text)

    # 7. 연속 줄바꿈 정규화 (3개 이상 -> 2개)
    text = re.sub(r'\n{3,}', '\n\n', text)

    # 8. 앞뒤 공백 제거
    text = text.strip()

    refined_len = len(text)
    if original_len != refined_len:
        logger.debug(f"Transcript refined: {original_len} -> {refined_len} chars (removed {original_len - refined_len})")

    return text


def generate_transcript_markdown(
    title: str,
    segments: List[Dict[str, Any]],
    meeting_date: Optional[str] = None,
    duration_seconds: Optional[float] = None,
    language: Optional[str] = None
) -> str:
    """
    정제된 트랜스크립트를 마크다운 형식으로 변환

    Args:
        title: 회의 제목
        segments: 세그먼트 리스트 [{"start": float, "end": float, "text": str}, ...]
        meeting_date: 회의 날짜 (optional)
        duration_seconds: 총 길이 (optional)
        language: 언어 (optional)

    Returns:
        마크다운 형식의 트랜스크립트
    """
    lines = []

    # 헤더
    lines.append(f"# {title}")
    lines.append("")

    # 메타 정보
    lines.append("## 회의 정보")
    lines.append("")
    if meeting_date:
        lines.append(f"- **날짜**: {meeting_date}")
    if duration_seconds:
        lines.append(f"- **길이**: {format_timestamp(duration_seconds)}")
    if language:
        lines.append(f"- **언어**: {language}")
    lines.append(f"- **생성일**: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')} UTC")
    lines.append("")

    # 구분선
    lines.append("---")
    lines.append("")

    # 트랜스크립트 본문
    lines.append("## 트랜스크립트")
    lines.append("")

    if not segments:
        lines.append("_(트랜스크립트 없음)_")
    else:
        speaker_count = 0
        prev_text = None

        for seg in segments:
            start = seg.get("start", 0)
            raw_text = seg.get("text", "").strip()

            if not raw_text:
                continue

            # 세그먼트별 정제 (keep_speaker_marker=True로 화자 분리)
            # 먼저 >> 가 있는지 확인
            has_speaker_change = ">>" in raw_text

            # 정제 적용
            cleaned_text = refine_transcript(raw_text, keep_speaker_marker=False)

            if not cleaned_text:
                continue

            # 이전과 동일하면 스킵 (중복 방지)
            if cleaned_text == prev_text:
                continue
            prev_text = cleaned_text

            # 화자 변경 감지
            if has_speaker_change:
                speaker_count += 1
                lines.append("")
                lines.append(f"### 화자 {speaker_count}")
                lines.append("")

            # 타임스탬프와 텍스트
            timestamp = format_timestamp(start)
            lines.append(f"**[{timestamp}]** {cleaned_text}")
            lines.append("")

    return "\n".join(lines)
