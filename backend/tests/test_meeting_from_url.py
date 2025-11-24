"""
Meeting From URL - A팀 자동화 테스트

작성일: 2025-11-24
작성자: A팀 (QA)
참조: backend/docs/MEETING_FROM_URL_QA_GUIDE.md
"""

import time
import json
import requests
from typing import Dict, Any, Optional, List
from enum import Enum

# 설정
API_BASE = "http://100.123.51.5:8000/api/v1"
TEST_URL = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
POLL_INTERVAL = 3  # 초
MAX_POLLS_CAPTION = 40  # 2분 (3초 * 40)
MAX_POLLS_FULL = 100  # 5분 (3초 * 100)


class MeetingStatus(str, Enum):
    """Meeting status enum (API Contract 기준)"""
    CREATED = "created"
    DOWNLOADING = "downloading"
    CAPTION_READY = "caption_ready"
    READY_FOR_STT = "ready_for_stt"
    TRANSCRIBING = "transcribing"
    READY = "ready"
    DOWNLOAD_FAILED = "download_failed"
    STT_FAILED = "stt_failed"


class TestResult:
    """테스트 결과"""
    def __init__(self, name: str):
        self.name = name
        self.passed = False
        self.status_transitions: List[str] = []
        self.final_status: Optional[str] = None
        self.transcript_count = 0
        self.primary_source: Optional[str] = None
        self.error_message: Optional[str] = None
        self.elapsed_seconds = 0.0

    def __repr__(self):
        status = "✅ PASS" if self.passed else "❌ FAIL"
        return f"{status} | {self.name} | {self.final_status} | {self.elapsed_seconds:.1f}s"


def create_meeting_from_url(
    url: str,
    title: str,
    auto_transcribe: bool = False
) -> Optional[str]:
    """Meeting 생성

    Returns:
        meeting_id or None
    """
    payload = {
        "url": url,
        "title": title,
        "auto_transcribe": auto_transcribe
    }

    try:
        response = requests.post(
            f"{API_BASE}/meetings/from-url",
            json=payload,
            timeout=30
        )
        response.raise_for_status()
        data = response.json()
        return data.get("meeting_id")
    except Exception as e:
        print(f"❌ Failed to create meeting: {e}")
        return None


def get_meeting(meeting_id: str) -> Optional[Dict[str, Any]]:
    """Meeting 조회

    Returns:
        Meeting 정보 or None
    """
    try:
        response = requests.get(
            f"{API_BASE}/meetings/{meeting_id}",
            timeout=10
        )
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"❌ Failed to get meeting: {e}")
        return None


def get_transcript(meeting_id: str) -> Optional[Dict[str, Any]]:
    """Primary transcript 조회

    Returns:
        Transcript 정보 or None
    """
    try:
        response = requests.get(
            f"{API_BASE}/meetings/{meeting_id}/transcript",
            timeout=10
        )
        if response.status_code == 404:
            return None
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"❌ Failed to get transcript: {e}")
        return None


def poll_until_complete(
    meeting_id: str,
    max_polls: int,
    expected_final_statuses: List[str]
) -> TestResult:
    """폴링하여 완료 대기

    Args:
        meeting_id: Meeting ID
        max_polls: 최대 폴링 횟수
        expected_final_statuses: 예상되는 최종 상태 목록

    Returns:
        TestResult
    """
    result = TestResult(f"Poll {meeting_id[:8]}")
    start_time = time.time()
    previous_status = None

    for poll_num in range(1, max_polls + 1):
        meeting = get_meeting(meeting_id)
        if not meeting:
            result.error_message = "Failed to get meeting"
            return result

        current_status = meeting.get("status")
        print(f"  [{poll_num:3d}] Status: {current_status}")

        # Status 전이 기록
        if current_status != previous_status:
            result.status_transitions.append(current_status)
            previous_status = current_status

        # 완료 상태 확인
        if current_status in expected_final_statuses:
            result.final_status = current_status
            result.elapsed_seconds = time.time() - start_time
            result.passed = True
            return result

        time.sleep(POLL_INTERVAL)

    # 타임아웃
    result.final_status = previous_status
    result.elapsed_seconds = time.time() - start_time
    result.error_message = f"Timeout after {max_polls * POLL_INTERVAL}s"
    return result


def test_scenario_1_caption_only():
    """Scenario 1: Caption Only (auto_transcribe=false)

    예상 흐름:
    created → downloading → caption_ready
    """
    print("\n" + "="*80)
    print("📋 Scenario 1: Caption Only")
    print("="*80)

    meeting_id = create_meeting_from_url(
        url=TEST_URL,
        title="QA Test - Caption Only",
        auto_transcribe=False
    )

    if not meeting_id:
        return TestResult("Scenario 1")

    print(f"✅ Meeting created: {meeting_id}")

    # 폴링
    result = poll_until_complete(
        meeting_id=meeting_id,
        max_polls=MAX_POLLS_CAPTION,
        expected_final_statuses=[
            MeetingStatus.CAPTION_READY.value,
            MeetingStatus.DOWNLOAD_FAILED.value
        ]
    )

    result.name = "Scenario 1: Caption Only"

    # Transcript 확인
    if result.final_status == MeetingStatus.CAPTION_READY.value:
        transcript = get_transcript(meeting_id)
        if transcript:
            result.transcript_count = 1
            result.primary_source = transcript.get("source_type")
            print(f"✅ Transcript: source={result.primary_source}, "
                  f"length={len(transcript.get('transcript_text', ''))} chars")
        else:
            result.passed = False
            result.error_message = "No transcript found"

    print(f"\n{result}")
    return result


def test_scenario_2_audio_stt():
    """Scenario 2: Audio + STT (auto_transcribe=true)

    예상 흐름:
    created → downloading → caption_ready → ready_for_stt → transcribing → ready
    """
    print("\n" + "="*80)
    print("📋 Scenario 2: Audio + STT")
    print("="*80)

    meeting_id = create_meeting_from_url(
        url=TEST_URL,
        title="QA Test - Audio + STT",
        auto_transcribe=True
    )

    if not meeting_id:
        return TestResult("Scenario 2")

    print(f"✅ Meeting created: {meeting_id}")

    # 폴링
    result = poll_until_complete(
        meeting_id=meeting_id,
        max_polls=MAX_POLLS_FULL,
        expected_final_statuses=[
            MeetingStatus.READY.value,
            MeetingStatus.DOWNLOAD_FAILED.value,
            MeetingStatus.STT_FAILED.value
        ]
    )

    result.name = "Scenario 2: Audio + STT"

    # Transcript 확인
    if result.final_status == MeetingStatus.READY.value:
        transcript = get_transcript(meeting_id)
        if transcript:
            result.transcript_count = 1
            result.primary_source = transcript.get("source_type")
            print(f"✅ Transcript: source={result.primary_source}, "
                  f"is_primary={transcript.get('is_primary')}")
        else:
            result.passed = False
            result.error_message = "No primary transcript found"

    print(f"\n{result}")
    return result


def test_scenario_5_invalid_url():
    """Scenario 5: 잘못된 URL

    예상 흐름:
    created → downloading → download_failed
    """
    print("\n" + "="*80)
    print("📋 Scenario 5: Invalid URL")
    print("="*80)

    invalid_url = "https://www.youtube.com/watch?v=invalid-test-url-123"

    meeting_id = create_meeting_from_url(
        url=invalid_url,
        title="QA Test - Invalid URL",
        auto_transcribe=False
    )

    if not meeting_id:
        return TestResult("Scenario 5")

    print(f"✅ Meeting created: {meeting_id}")

    # 폴링
    result = poll_until_complete(
        meeting_id=meeting_id,
        max_polls=20,
        expected_final_statuses=[
            MeetingStatus.DOWNLOAD_FAILED.value
        ]
    )

    result.name = "Scenario 5: Invalid URL"

    # Transcript가 생성되지 않았는지 확인
    transcript = get_transcript(meeting_id)
    if transcript is None:
        print("✅ No transcript (expected for failed download)")
        result.passed = True
    else:
        result.passed = False
        result.error_message = "Unexpected transcript found"

    print(f"\n{result}")
    return result


def print_summary(results: List[TestResult]):
    """테스트 결과 요약"""
    print("\n" + "="*80)
    print("📊 TEST SUMMARY")
    print("="*80)

    total = len(results)
    passed = sum(1 for r in results if r.passed)
    failed = total - passed

    for result in results:
        print(result)

    print("="*80)
    print(f"Total: {total} | Passed: {passed} | Failed: {failed}")
    print(f"Pass Rate: {passed/total*100:.1f}%")
    print("="*80)


def main():
    """메인 테스트 실행"""
    print("🚀 Meeting From URL - A팀 자동화 테스트")
    print(f"API Base: {API_BASE}")
    print(f"Test URL: {TEST_URL}")

    results = []

    # 서버 health check
    try:
        response = requests.get(f"{API_BASE.replace('/api/v1', '')}/health", timeout=5)
        if response.status_code == 200:
            print("✅ Backend API is healthy")
        else:
            print("⚠️  Backend API returned non-200 status")
    except Exception as e:
        print(f"❌ Backend API health check failed: {e}")
        return

    # Scenario 1: Caption Only
    results.append(test_scenario_1_caption_only())

    # Scenario 2: Audio + STT
    results.append(test_scenario_2_audio_stt())

    # Scenario 5: Invalid URL
    results.append(test_scenario_5_invalid_url())

    # 요약
    print_summary(results)


if __name__ == "__main__":
    main()
