"""
TranscriberService Unit Tests

TranscriberService의 4-mode 전략 및 retry 로직 테스트

작성일: 2025-11-24
작성자: B팀 (Backend)
참조: docs/MEETING_AI_TRANSCRIBER_SPEC.md - A팀 QA 체크리스트
"""

import pytest
from unittest.mock import Mock, AsyncMock, patch, MagicMock
from app.services.transcriber import TranscriberService, get_transcriber_service
from app.schemas.transcriber import TranscriptionResult, TranscriptSegment
from app.core.config import settings


# =============================================================================
# Fixtures
# =============================================================================

@pytest.fixture
def mock_transcription_result():
    """Mock TranscriptionResult"""
    return TranscriptionResult(
        text="안녕하세요 오늘 회의를 시작하겠습니다",
        segments=[
            TranscriptSegment(start=0.0, end=2.5, text="안녕하세요"),
            TranscriptSegment(start=2.5, end=5.0, text="오늘 회의를 시작하겠습니다")
        ],
        language="ko",
        duration_seconds=120.5,
        backend="faster_whisper",
        model="large-v3",
        latency_ms=5000,
        confidence=0.95
    )


@pytest.fixture
def mock_openai_result():
    """Mock OpenAI Whisper result"""
    return TranscriptionResult(
        text="Hello, let's start the meeting",
        segments=[
            TranscriptSegment(start=0.0, end=3.0, text="Hello, let's start the meeting")
        ],
        language="en",
        duration_seconds=60.0,
        backend="openai",
        model="whisper-1",
        latency_ms=3000,
        confidence=None
    )


@pytest.fixture
def transcriber_service():
    """Create TranscriberService instance"""
    return TranscriberService()


# =============================================================================
# Test 1: Mode Selection Tests
# =============================================================================

@pytest.mark.asyncio
async def test_openai_only_mode(transcriber_service, mock_openai_result):
    """
    Test 1.1: openai 모드에서 OpenAI만 사용하는지 확인
    """
    transcriber_service.mode = "openai"

    with patch.object(transcriber_service.openai_client, 'transcribe', new_callable=AsyncMock) as mock_openai:
        mock_openai.return_value = mock_openai_result

        result = await transcriber_service.transcribe(
            audio_path="/tmp/test.mp4",
            duration_seconds=60.0
        )

        assert result.backend == "openai"
        assert result.model == "whisper-1"
        mock_openai.assert_called_once()


@pytest.mark.asyncio
async def test_local_only_mode_faster_whisper(transcriber_service, mock_transcription_result):
    """
    Test 1.2: local 모드에서 faster-whisper 사용 확인
    """
    transcriber_service.mode = "local"
    transcriber_service.local_backend = "faster_whisper"

    with patch.object(transcriber_service.faster_whisper_client, 'transcribe', new_callable=AsyncMock) as mock_fw:
        mock_fw.return_value = mock_transcription_result

        result = await transcriber_service.transcribe(
            audio_path="/tmp/test.mp4",
            duration_seconds=120.0
        )

        assert result.backend == "faster_whisper"
        assert result.model == "large-v3"
        mock_fw.assert_called_once()


@pytest.mark.asyncio
async def test_local_only_mode_whisper_cpp(transcriber_service, mock_transcription_result):
    """
    Test 1.3: local 모드에서 whisper.cpp 사용 확인
    """
    transcriber_service.mode = "local"
    transcriber_service.local_backend = "whisper_cpp"

    mock_transcription_result.backend = "whisper_cpp"
    mock_transcription_result.model = "medium"

    with patch.object(transcriber_service.whisper_cpp_client, 'transcribe', new_callable=AsyncMock) as mock_cpp:
        mock_cpp.return_value = mock_transcription_result

        result = await transcriber_service.transcribe(
            audio_path="/tmp/test.mp4",
            duration_seconds=120.0
        )

        assert result.backend == "whisper_cpp"
        mock_cpp.assert_called_once()


@pytest.mark.asyncio
async def test_hybrid_cost_short_meeting(transcriber_service, mock_openai_result):
    """
    Test 1.4: hybrid_cost 모드 - 짧은 회의는 OpenAI 사용
    """
    transcriber_service.mode = "hybrid_cost"
    transcriber_service.openai_max_minutes = 20

    with patch.object(transcriber_service.openai_client, 'transcribe', new_callable=AsyncMock) as mock_openai:
        mock_openai.return_value = mock_openai_result

        # 10분 회의 (600초)
        result = await transcriber_service.transcribe(
            audio_path="/tmp/short.mp4",
            duration_seconds=600.0
        )

        assert result.backend == "openai"
        mock_openai.assert_called_once()


@pytest.mark.asyncio
async def test_hybrid_cost_long_meeting(transcriber_service, mock_transcription_result):
    """
    Test 1.5: hybrid_cost 모드 - 긴 회의는 로컬 사용
    """
    transcriber_service.mode = "hybrid_cost"
    transcriber_service.openai_max_minutes = 20
    transcriber_service.local_backend = "faster_whisper"

    with patch.object(transcriber_service.faster_whisper_client, 'transcribe', new_callable=AsyncMock) as mock_fw:
        mock_fw.return_value = mock_transcription_result

        # 30분 회의 (1800초)
        result = await transcriber_service.transcribe(
            audio_path="/tmp/long.mp4",
            duration_seconds=1800.0
        )

        assert result.backend == "faster_whisper"
        mock_fw.assert_called_once()


@pytest.mark.asyncio
async def test_hybrid_quality_mode(transcriber_service, mock_transcription_result):
    """
    Test 1.6: hybrid_quality 모드 - 항상 로컬 large-v3 사용
    """
    transcriber_service.mode = "hybrid_quality"
    transcriber_service.local_backend = "faster_whisper"

    with patch.object(transcriber_service.faster_whisper_client, 'transcribe', new_callable=AsyncMock) as mock_fw:
        mock_fw.return_value = mock_transcription_result

        result = await transcriber_service.transcribe(
            audio_path="/tmp/important.mp4",
            duration_seconds=600.0
        )

        assert result.backend == "faster_whisper"
        assert result.model == "large-v3"

        # large-v3 모델이 전달되었는지 확인
        call_kwargs = mock_fw.call_args[1]
        assert call_kwargs["model_profile"] == settings.WHISPER_PROFILE_ACCURATE


@pytest.mark.asyncio
async def test_force_mode_override(transcriber_service, mock_openai_result):
    """
    Test 1.7: force_mode로 기본 모드 오버라이드
    """
    transcriber_service.mode = "local"  # 기본값은 local

    with patch.object(transcriber_service.openai_client, 'transcribe', new_callable=AsyncMock) as mock_openai:
        mock_openai.return_value = mock_openai_result

        # force_mode로 openai 강제
        result = await transcriber_service.transcribe(
            audio_path="/tmp/test.mp4",
            duration_seconds=120.0,
            force_mode="openai"
        )

        assert result.backend == "openai"
        mock_openai.assert_called_once()


# =============================================================================
# Test 2: Model Profile Selection Tests
# =============================================================================

def test_choose_model_profile_short(transcriber_service):
    """
    Test 2.1: 짧은 회의 (<10분) → small 모델 선택
    """
    profile = transcriber_service._choose_model_profile(duration_seconds=300)  # 5분
    assert profile == settings.WHISPER_PROFILE_FAST


def test_choose_model_profile_medium(transcriber_service):
    """
    Test 2.2: 중간 회의 (10-30분) → medium 모델 선택
    """
    profile = transcriber_service._choose_model_profile(duration_seconds=1200)  # 20분
    assert profile == settings.WHISPER_PROFILE_BALANCED


def test_choose_model_profile_long(transcriber_service):
    """
    Test 2.3: 긴 회의 (>30분) → large-v3 모델 선택
    """
    profile = transcriber_service._choose_model_profile(duration_seconds=2400)  # 40분
    assert profile == settings.WHISPER_PROFILE_ACCURATE


def test_choose_model_profile_no_duration(transcriber_service):
    """
    Test 2.4: duration이 없으면 기본값(balanced) 반환
    """
    profile = transcriber_service._choose_model_profile(duration_seconds=None)
    assert profile == settings.WHISPER_PROFILE_BALANCED


# =============================================================================
# Test 3: Retry & Fallback Tests
# =============================================================================

@pytest.mark.asyncio
async def test_retry_on_failure(transcriber_service, mock_transcription_result):
    """
    Test 3.1: Primary 클라이언트 실패 시 재시도
    """
    transcriber_service.max_retries = 2

    with patch.object(transcriber_service.faster_whisper_client, 'transcribe', new_callable=AsyncMock) as mock_fw:
        # 첫 번째 실패, 두 번째 성공
        mock_fw.side_effect = [
            Exception("Network error"),
            mock_transcription_result
        ]

        result = await transcriber_service.transcribe(
            audio_path="/tmp/test.mp4",
            duration_seconds=120.0,
            force_mode="local"
        )

        assert result.backend == "faster_whisper"
        assert mock_fw.call_count == 2  # 1회 실패 + 1회 성공


@pytest.mark.asyncio
async def test_fallback_to_openai(transcriber_service, mock_openai_result):
    """
    Test 3.2: 로컬 클라이언트 모두 실패 시 OpenAI fallback
    """
    transcriber_service.max_retries = 2
    transcriber_service.mode = "hybrid_cost"
    transcriber_service.local_backend = "faster_whisper"

    with patch.object(transcriber_service.faster_whisper_client, 'transcribe', new_callable=AsyncMock) as mock_fw, \
         patch.object(transcriber_service.openai_client, 'transcribe', new_callable=AsyncMock) as mock_openai:

        # faster-whisper 모두 실패
        mock_fw.side_effect = Exception("Service unavailable")
        # OpenAI fallback 성공
        mock_openai.return_value = mock_openai_result

        # 긴 회의 (로컬 우선 시도)
        result = await transcriber_service.transcribe(
            audio_path="/tmp/test.mp4",
            duration_seconds=1800.0  # 30분
        )

        assert result.backend == "openai"
        assert mock_fw.call_count == 2  # max_retries
        mock_openai.assert_called_once()  # fallback 1회


@pytest.mark.asyncio
async def test_no_fallback_openai_only_mode(transcriber_service):
    """
    Test 3.3: openai 모드에서는 fallback 없음
    """
    transcriber_service.max_retries = 2
    transcriber_service.mode = "openai"

    with patch.object(transcriber_service.openai_client, 'transcribe', new_callable=AsyncMock) as mock_openai:
        mock_openai.side_effect = Exception("API error")

        with pytest.raises(Exception, match="API error"):
            await transcriber_service.transcribe(
                audio_path="/tmp/test.mp4",
                duration_seconds=120.0
            )

        assert mock_openai.call_count == 2  # max_retries, no fallback


@pytest.mark.asyncio
async def test_all_retries_exhausted(transcriber_service):
    """
    Test 3.4: 모든 재시도 실패 시 에러 발생
    """
    transcriber_service.max_retries = 2
    transcriber_service.mode = "local"

    with patch.object(transcriber_service.faster_whisper_client, 'transcribe', new_callable=AsyncMock) as mock_fw, \
         patch.object(transcriber_service.openai_client, 'transcribe', new_callable=AsyncMock) as mock_openai:

        mock_fw.side_effect = Exception("Local service down")
        mock_openai.side_effect = Exception("OpenAI API down")

        with pytest.raises(Exception, match="OpenAI API down"):
            await transcriber_service.transcribe(
                audio_path="/tmp/test.mp4",
                duration_seconds=120.0
            )

        assert mock_fw.call_count == 2  # max_retries
        assert mock_openai.call_count == 1  # fallback


# =============================================================================
# Test 4: Integration Tests
# =============================================================================

@pytest.mark.asyncio
async def test_full_transcription_workflow(transcriber_service, mock_transcription_result):
    """
    Test 4.1: 전체 트랜스크립션 워크플로우 테스트
    """
    transcriber_service.mode = "hybrid_cost"

    with patch.object(transcriber_service.openai_client, 'transcribe', new_callable=AsyncMock) as mock_openai:
        mock_openai.return_value = mock_transcription_result

        result = await transcriber_service.transcribe(
            audio_path="/tmp/meeting.mp4",
            duration_seconds=600.0,  # 10분 (OpenAI 사용)
            language="ko",
            temperature=0.0
        )

        # 결과 검증
        assert result.text == "안녕하세요 오늘 회의를 시작하겠습니다"
        assert len(result.segments) == 2
        assert result.language == "ko"
        assert result.duration_seconds == 120.5
        assert result.backend == "faster_whisper"
        assert result.model == "large-v3"
        assert result.latency_ms == 5000
        assert result.confidence == 0.95


@pytest.mark.asyncio
async def test_importance_high_forces_quality_mode(transcriber_service, mock_transcription_result):
    """
    Test 4.2: importance=high면 hybrid_quality 모드 사용
    """
    transcriber_service.mode = "hybrid_cost"
    transcriber_service.local_backend = "faster_whisper"

    with patch.object(transcriber_service.faster_whisper_client, 'transcribe', new_callable=AsyncMock) as mock_fw:
        mock_fw.return_value = mock_transcription_result

        result = await transcriber_service.transcribe(
            audio_path="/tmp/important.mp4",
            duration_seconds=120.0,
            importance="high"  # force_mode 없이도 quality 모드 사용
        )

        # large-v3 모델 사용 확인
        call_kwargs = mock_fw.call_args[1]
        assert call_kwargs.get("model_profile") == settings.WHISPER_PROFILE_ACCURATE


# =============================================================================
# Test 5: Edge Cases
# =============================================================================

@pytest.mark.asyncio
async def test_unknown_mode_falls_back_to_hybrid_cost(transcriber_service, mock_openai_result):
    """
    Test 5.1: 알 수 없는 모드는 hybrid_cost로 fallback
    """
    transcriber_service.mode = "invalid_mode"
    transcriber_service.openai_max_minutes = 20

    with patch.object(transcriber_service.openai_client, 'transcribe', new_callable=AsyncMock) as mock_openai:
        mock_openai.return_value = mock_openai_result

        result = await transcriber_service.transcribe(
            audio_path="/tmp/test.mp4",
            duration_seconds=600.0
        )

        # hybrid_cost 로직 적용 (짧은 회의 → OpenAI)
        assert result.backend == "openai"


@pytest.mark.asyncio
async def test_no_duration_uses_local_backend(transcriber_service, mock_transcription_result):
    """
    Test 5.2: duration이 없으면 로컬 백엔드 사용 (hybrid_cost 모드)
    """
    transcriber_service.mode = "hybrid_cost"
    transcriber_service.local_backend = "faster_whisper"

    with patch.object(transcriber_service.faster_whisper_client, 'transcribe', new_callable=AsyncMock) as mock_fw:
        mock_fw.return_value = mock_transcription_result

        result = await transcriber_service.transcribe(
            audio_path="/tmp/test.mp4",
            duration_seconds=None  # duration 없음
        )

        assert result.backend == "faster_whisper"


def test_singleton_pattern():
    """
    Test 5.3: get_transcriber_service() 싱글톤 패턴 확인
    """
    service1 = get_transcriber_service()
    service2 = get_transcriber_service()

    assert service1 is service2  # 동일한 인스턴스


# =============================================================================
# Test 6: Configuration Tests
# =============================================================================

def test_transcriber_service_initialization():
    """
    Test 6.1: TranscriberService 초기화 확인
    """
    service = TranscriberService()

    assert service.mode == settings.WHISPER_MODE
    assert service.local_backend == settings.WHISPER_LOCAL_BACKEND
    assert service.openai_max_minutes == settings.WHISPER_OPENAI_MAX_MINUTES
    assert service.max_retries == settings.WHISPER_MAX_RETRIES

    # 클라이언트 초기화 확인
    assert service.openai_client is not None
    assert service.faster_whisper_client is not None
    assert service.whisper_cpp_client is not None
