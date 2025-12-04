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


class SpeakerTracker:
    """화자 번호 추적기 (전역 상태 유지)"""
    def __init__(self):
        self.speaker_count = 0

    def next_speaker(self) -> int:
        self.speaker_count += 1
        return self.speaker_count

    def reset(self):
        self.speaker_count = 0


# 전역 화자 추적기
_speaker_tracker = SpeakerTracker()


def refine_transcript(text: str, preserve_speakers: bool = True) -> str:
    """
    트랜스크립트 텍스트 정제

    Whisper STT 결과에서 노이즈를 제거하고 정제된 텍스트를 반환.
    DB에 저장되기 전에 호출되어 깨끗한 텍스트가 저장되도록 함.

    Args:
        text: 원본 텍스트
        preserve_speakers: True면 >> 마커를 [화자 N]으로 변환하여 화자 구분 유지
                          (LLM이 화자별 중요도/비중 분석 가능)

    정제 항목:
    1. 소리 태그 제거: [음악], [박수], [웃음], [침묵] 등
    2. 화자 마커 변환: >> 기호를 [화자 N]으로 변환 (순차 번호 부여)
    3. 반복 문구 제거: 연속 중복 문장 제거
    4. 문장 연결: 불완전하게 끊어진 문장을 연결
    5. 광고 패턴 제거
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

    # 2. 화자 마커 변환 (>> 기호 → [화자 N])
    if preserve_speakers:
        # 화자 변경 횟수 세기
        speaker_changes = text.count('>>')
        if speaker_changes > 0:
            # >> 를 [화자 N]으로 순차 변환
            speaker_num = 0
            def replace_speaker(match):
                nonlocal speaker_num
                speaker_num += 1
                return f'\n\n[화자 {speaker_num}] '
            text = re.sub(r'>>\s*', replace_speaker, text)
    else:
        # >> 제거 (화자 구분 불필요한 경우)
        text = re.sub(r'>>\s*', ' ', text)

    # 3. 타임스탬프 패턴 제거 (00:00:00 형식)
    text = re.sub(r'\b\d{1,2}:\d{2}(:\d{2})?\b\s*', '', text)

    # 4. 광고/아웃트로 패턴 제거 (유튜브 등)
    ad_patterns = [
        r'자세한 사항은\s*댓글창을\s*확인하세요\.?',
        r'미래를\s*먼저\s*보다\.?\s*디타임즈\.?',
        r'구독과\s*좋아요\s*부탁드립니다\.?',
        r'채널\s*구독\s*부탁드립니다\.?',
        r'좋아요와\s*구독\s*부탁드립니다\.?',
        r'다음\s*(영상|시간)에\s*만나요\.?',
        r'시청해\s*주셔서\s*감사합니다\.?',
    ]
    for pattern in ad_patterns:
        text = re.sub(pattern, '', text, flags=re.IGNORECASE)

    # 5. 문장 연결 로직 (불완전한 줄바꿈 수정)
    # - 문장 끝 기호(. ? ! 등)가 없이 줄바꿈된 경우 → 연결
    # - 화자 마커 [화자 N] 앞에서는 유지
    lines = text.split('\n')
    connected_lines = []
    buffer = ""

    for line in lines:
        stripped = line.strip()
        if not stripped:
            # 빈 줄: 버퍼 비우고 빈 줄 유지
            if buffer:
                connected_lines.append(buffer)
                buffer = ""
            if connected_lines and connected_lines[-1]:
                connected_lines.append('')
            continue

        # 화자 마커로 시작하면 새 문단
        if stripped.startswith('[화자'):
            if buffer:
                connected_lines.append(buffer)
                buffer = ""
            connected_lines.append('')  # 화자 앞에 빈 줄
            connected_lines.append(stripped)
            continue

        # 버퍼가 비어있으면 시작
        if not buffer:
            buffer = stripped
            continue

        # 버퍼 끝이 문장 종결 기호인지 확인
        ends_with_punctuation = buffer.rstrip()[-1] in '.?!。？！'

        if ends_with_punctuation:
            # 문장 끝났으면 저장하고 새로 시작
            connected_lines.append(buffer)
            buffer = stripped
        else:
            # 문장 끝 아니면 연결 (공백으로)
            buffer = buffer + ' ' + stripped

    # 마지막 버퍼 처리
    if buffer:
        connected_lines.append(buffer)

    text = '\n'.join(connected_lines)

    # 6. 반복 문장 제거 (연속된 동일/유사 문장)
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
        # 화자 마커는 항상 유지
        if stripped.startswith('[화자'):
            deduplicated_lines.append(line)
            prev_line = stripped
            continue
        # 이전과 동일하면 스킵
        if stripped == prev_line:
            continue
        # 이전과 80% 이상 유사하면 스킵 (짧은 문장은 제외)
        if prev_line and len(stripped) > 20 and len(prev_line) > 20:
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

    # 7. 연속 공백 정규화
    text = re.sub(r' {2,}', ' ', text)

    # 8. 연속 줄바꿈 정규화 (3개 이상 -> 2개)
    text = re.sub(r'\n{3,}', '\n\n', text)

    # 9. 앞뒤 공백 제거
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
        # 모든 세그먼트 텍스트를 합쳐서 한번에 정제
        # (세그먼트별로 정제하면 화자 번호가 올바르게 매겨지지 않음)
        all_texts = []
        segment_info = []  # (start, original_text) 저장

        for seg in segments:
            start = seg.get("start", 0)
            raw_text = seg.get("text", "").strip()
            if raw_text:
                all_texts.append(raw_text)
                segment_info.append((start, raw_text))

        # 전체 텍스트를 한번에 정제 (화자 구분 유지)
        combined_text = '\n'.join(all_texts)
        refined_full = refine_transcript(combined_text, preserve_speakers=True)

        # 정제된 텍스트 출력
        lines.append(refined_full)

    return "\n".join(lines)
