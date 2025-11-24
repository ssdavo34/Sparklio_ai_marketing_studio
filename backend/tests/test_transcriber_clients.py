"""
Transcriber Clients Unit Tests

OpenAI, faster-whisper, whisper.cpp 클라이언트 테스트

작성일: 2025-11-24
작성자: B팀 (Backend)
참조: docs/MEETING_AI_TRANSCRIBER_SPEC.md - A팀 QA 체크리스트
"""

import pytest
from unittest.mock import Mock, AsyncMock, patch, mock_open
import httpx
from app.services.transcriber_clients import (
    OpenAIWhisperClient,
    FasterWhisperClient,
    WhisperCppClient
)
from app.schemas.transcriber import TranscriptionResult, TranscriptSegment


# =============================================================================
# Test 1: OpenAIWhisperClient Tests
# =============================================================================

@pytest.fixture
def openai_client():
    """Create OpenAIWhisperClient instance"""
    with patch('app.services.transcriber_clients.settings') as mock_settings:
        mock_settings.OPENAI_API_KEY = "test-api-key"
        mock_settings.WHISPER_OPENAI_MODEL = "whisper-1"
        mock_settings.WHISPER_TIMEOUT_SECONDS = 600
        return OpenAIWhisperClient()


@pytest.fixture
def mock_openai_response():
    """Mock OpenAI Whisper API response"""
    mock_response = Mock()
    mock_response.text = "Hello, this is a test transcription"
    mock_response.language = "en"
    mock_response.duration = 30.5

    # Mock segments
    segment1 = Mock()
    segment1.start = 0.0
    segment1.end = 15.0
    segment1.text = "Hello, this is a"

    segment2 = Mock()
    segment2.start = 15.0
    segment2.end = 30.5
    segment2.text = "test transcription"

    mock_response.segments = [segment1, segment2]

    return mock_response


@pytest.mark.asyncio
async def test_openai_transcribe_success(openai_client, mock_openai_response):
    """
    Test 1.1: OpenAI Whisper API 정상 트랜스크립션
    """
    with patch('app.services.transcriber_clients.AsyncOpenAI') as mock_openai_class:
        mock_client = Mock()
        mock_audio = Mock()
        mock_audio.transcriptions = Mock()
        mock_audio.transcriptions.create = AsyncMock(return_value=mock_openai_response)
        mock_client.audio = mock_audio
        mock_openai_class.return_value = mock_client

        with patch('builtins.open', mock_open(read_data=b'fake audio data')):
            result = await openai_client.transcribe("/tmp/test.wav")

        assert isinstance(result, TranscriptionResult)
        assert result.text == "Hello, this is a test transcription"
        assert result.language == "en"
        assert result.duration_seconds == 30.5
        assert result.backend == "openai"
        assert result.model == "whisper-1"
        assert len(result.segments) == 2
        assert result.latency_ms > 0


@pytest.mark.asyncio
async def test_openai_no_api_key_error(openai_client):
    """
    Test 1.2: OpenAI API key 없을 때 에러
    """
    openai_client.api_key = None

    with pytest.raises(ValueError, match="OpenAI API key not configured"):
        await openai_client.transcribe("/tmp/test.wav")


@pytest.mark.asyncio
async def test_openai_api_error_handling(openai_client):
    """
    Test 1.3: OpenAI API 오류 처리
    """
    with patch('app.services.transcriber_clients.AsyncOpenAI') as mock_openai_class:
        mock_client = Mock()
        mock_audio = Mock()
        mock_audio.transcriptions = Mock()
        mock_audio.transcriptions.create = AsyncMock(side_effect=Exception("API Error"))
        mock_client.audio = mock_audio
        mock_openai_class.return_value = mock_client

        with patch('builtins.open', mock_open(read_data=b'fake audio data')):
            with pytest.raises(Exception, match="API Error"):
                await openai_client.transcribe("/tmp/test.wav")


# =============================================================================
# Test 2: FasterWhisperClient Tests
# =============================================================================

@pytest.fixture
def faster_whisper_client():
    """Create FasterWhisperClient instance"""
    with patch('app.services.transcriber_clients.settings') as mock_settings:
        mock_settings.WHISPER_FAST_ENDPOINT = "http://100.123.51.6:9000/transcribe"
        mock_settings.WHISPER_TIMEOUT_SECONDS = 600
        return FasterWhisperClient()


@pytest.fixture
def mock_faster_whisper_response():
    """Mock faster-whisper HTTP response"""
    return {
        "text": "안녕하세요 오늘 회의를 시작하겠습니다",
        "segments": [
            {"start": 0.0, "end": 2.5, "text": "안녕하세요"},
            {"start": 2.5, "end": 5.0, "text": "오늘 회의를 시작하겠습니다"}
        ],
        "language": "ko",
        "duration": 120.5,
        "backend": "faster_whisper",
        "model": "large-v3",
        "latency_ms": 5000,
        "confidence": 0.95
    }


@pytest.mark.asyncio
async def test_faster_whisper_transcribe_success(faster_whisper_client, mock_faster_whisper_response):
    """
    Test 2.1: faster-whisper 서버 정상 트랜스크립션
    """
    mock_response = Mock()
    mock_response.json.return_value = mock_faster_whisper_response
    mock_response.raise_for_status = Mock()

    with patch('httpx.AsyncClient') as mock_client_class:
        mock_client = AsyncMock()
        mock_client.__aenter__.return_value = mock_client
        mock_client.__aexit__.return_value = None
        mock_client.post = AsyncMock(return_value=mock_response)
        mock_client_class.return_value = mock_client

        with patch('builtins.open', mock_open(read_data=b'fake audio data')):
            result = await faster_whisper_client.transcribe("/tmp/test.wav", model_profile="large-v3")

        assert isinstance(result, TranscriptionResult)
        assert result.text == "안녕하세요 오늘 회의를 시작하겠습니다"
        assert result.language == "ko"
        assert result.duration_seconds == 120.5
        assert result.backend == "faster_whisper"
        assert result.model == "large-v3"
        assert len(result.segments) == 2
        assert result.latency_ms == 5000
        assert result.confidence == 0.95


@pytest.mark.asyncio
async def test_faster_whisper_model_profile_selection(faster_whisper_client):
    """
    Test 2.2: faster-whisper 모델 프로파일 전달 확인
    """
    mock_response = Mock()
    mock_response.json.return_value = {
        "text": "test",
        "segments": [],
        "language": "ko",
        "duration": 10.0,
        "backend": "faster_whisper",
        "model": "medium",
        "latency_ms": 1000
    }
    mock_response.raise_for_status = Mock()

    with patch('httpx.AsyncClient') as mock_client_class:
        mock_client = AsyncMock()
        mock_client.__aenter__.return_value = mock_client
        mock_client.__aexit__.return_value = None
        mock_client.post = AsyncMock(return_value=mock_response)
        mock_client_class.return_value = mock_client

        with patch('builtins.open', mock_open(read_data=b'fake audio data')):
            result = await faster_whisper_client.transcribe(
                "/tmp/test.wav",
                model_profile="medium",
                language="ko",
                task="transcribe",
                temperature=0.0
            )

        # POST 요청의 data 파라미터 확인
        call_args = mock_client.post.call_args
        assert call_args[1]["data"]["model"] == "medium"
        assert call_args[1]["data"]["language"] == "ko"
        assert call_args[1]["data"]["task"] == "transcribe"
        assert call_args[1]["data"]["temperature"] == "0.0"


@pytest.mark.asyncio
async def test_faster_whisper_http_error(faster_whisper_client):
    """
    Test 2.3: faster-whisper HTTP 에러 처리
    """
    mock_response = Mock()
    mock_response.status_code = 500
    mock_response.text = "Internal Server Error"
    mock_response.raise_for_status.side_effect = httpx.HTTPStatusError(
        "500 Server Error", request=Mock(), response=mock_response
    )

    with patch('httpx.AsyncClient') as mock_client_class:
        mock_client = AsyncMock()
        mock_client.__aenter__.return_value = mock_client
        mock_client.__aexit__.return_value = None
        mock_client.post = AsyncMock(return_value=mock_response)
        mock_client_class.return_value = mock_client

        with patch('builtins.open', mock_open(read_data=b'fake audio data')):
            with pytest.raises(httpx.HTTPStatusError):
                await faster_whisper_client.transcribe("/tmp/test.wav")


@pytest.mark.asyncio
async def test_faster_whisper_timeout(faster_whisper_client):
    """
    Test 2.4: faster-whisper 타임아웃 처리
    """
    with patch('httpx.AsyncClient') as mock_client_class:
        mock_client = AsyncMock()
        mock_client.__aenter__.return_value = mock_client
        mock_client.__aexit__.return_value = None
        mock_client.post = AsyncMock(side_effect=httpx.TimeoutException("Request timeout"))
        mock_client_class.return_value = mock_client

        with patch('builtins.open', mock_open(read_data=b'fake audio data')):
            with pytest.raises(httpx.TimeoutException):
                await faster_whisper_client.transcribe("/tmp/test.wav")


# =============================================================================
# Test 3: WhisperCppClient Tests
# =============================================================================

@pytest.fixture
def whisper_cpp_client():
    """Create WhisperCppClient instance"""
    with patch('app.services.transcriber_clients.settings') as mock_settings:
        mock_settings.WHISPER_CPP_ENDPOINT = "http://127.0.0.1:8765/transcribe"
        mock_settings.WHISPER_TIMEOUT_SECONDS = 600
        return WhisperCppClient()


@pytest.fixture
def mock_whisper_cpp_response():
    """Mock whisper.cpp HTTP response"""
    return {
        "text": "Hello from whisper.cpp",
        "segments": [
            {"start": 0.0, "end": 3.0, "text": "Hello from whisper.cpp"}
        ],
        "language": "en",
        "duration": 30.0,
        "model": "medium",
        "confidence": 0.92
    }


@pytest.mark.asyncio
async def test_whisper_cpp_transcribe_success(whisper_cpp_client, mock_whisper_cpp_response):
    """
    Test 3.1: whisper.cpp 서버 정상 트랜스크립션
    """
    mock_response = Mock()
    mock_response.json.return_value = mock_whisper_cpp_response
    mock_response.raise_for_status = Mock()

    with patch('httpx.AsyncClient') as mock_client_class:
        mock_client = AsyncMock()
        mock_client.__aenter__.return_value = mock_client
        mock_client.__aexit__.return_value = None
        mock_client.post = AsyncMock(return_value=mock_response)
        mock_client_class.return_value = mock_client

        with patch('builtins.open', mock_open(read_data=b'fake audio data')):
            result = await whisper_cpp_client.transcribe("/tmp/test.wav", model_profile="medium")

        assert isinstance(result, TranscriptionResult)
        assert result.text == "Hello from whisper.cpp"
        assert result.language == "en"
        assert result.duration_seconds == 30.0
        assert result.backend == "whisper_cpp"
        assert result.model == "medium"
        assert len(result.segments) == 1
        assert result.confidence == 0.92


@pytest.mark.asyncio
async def test_whisper_cpp_error_handling(whisper_cpp_client):
    """
    Test 3.2: whisper.cpp 에러 처리
    """
    with patch('httpx.AsyncClient') as mock_client_class:
        mock_client = AsyncMock()
        mock_client.__aenter__.return_value = mock_client
        mock_client.__aexit__.return_value = None
        mock_client.post = AsyncMock(side_effect=Exception("Connection refused"))
        mock_client_class.return_value = mock_client

        with patch('builtins.open', mock_open(read_data=b'fake audio data')):
            with pytest.raises(Exception, match="Connection refused"):
                await whisper_cpp_client.transcribe("/tmp/test.wav")


# =============================================================================
# Test 4: Common Interface Tests
# =============================================================================

def test_all_clients_implement_base_interface():
    """
    Test 4.1: 모든 클라이언트가 BaseWhisperClient 인터페이스 구현
    """
    from app.services.transcriber_clients import BaseWhisperClient

    with patch('app.services.transcriber_clients.settings') as mock_settings:
        mock_settings.OPENAI_API_KEY = "test-key"
        mock_settings.WHISPER_OPENAI_MODEL = "whisper-1"
        mock_settings.WHISPER_FAST_ENDPOINT = "http://localhost:9000/transcribe"
        mock_settings.WHISPER_CPP_ENDPOINT = "http://localhost:8765/transcribe"
        mock_settings.WHISPER_TIMEOUT_SECONDS = 600

        openai_client = OpenAIWhisperClient()
        faster_whisper_client = FasterWhisperClient()
        whisper_cpp_client = WhisperCppClient()

        assert isinstance(openai_client, BaseWhisperClient)
        assert isinstance(faster_whisper_client, BaseWhisperClient)
        assert isinstance(whisper_cpp_client, BaseWhisperClient)

        # 모두 transcribe 메서드 구현
        assert hasattr(openai_client, 'transcribe')
        assert hasattr(faster_whisper_client, 'transcribe')
        assert hasattr(whisper_cpp_client, 'transcribe')


@pytest.mark.asyncio
async def test_all_clients_return_transcription_result(mock_openai_response, mock_faster_whisper_response, mock_whisper_cpp_response):
    """
    Test 4.2: 모든 클라이언트가 TranscriptionResult 반환
    """
    with patch('app.services.transcriber_clients.settings') as mock_settings:
        mock_settings.OPENAI_API_KEY = "test-key"
        mock_settings.WHISPER_OPENAI_MODEL = "whisper-1"
        mock_settings.WHISPER_FAST_ENDPOINT = "http://localhost:9000/transcribe"
        mock_settings.WHISPER_CPP_ENDPOINT = "http://localhost:8765/transcribe"
        mock_settings.WHISPER_TIMEOUT_SECONDS = 600

        # OpenAI
        with patch('app.services.transcriber_clients.AsyncOpenAI') as mock_openai_class:
            mock_client = Mock()
            mock_audio = Mock()
            mock_audio.transcriptions = Mock()
            mock_audio.transcriptions.create = AsyncMock(return_value=mock_openai_response)
            mock_client.audio = mock_audio
            mock_openai_class.return_value = mock_client

            openai_client = OpenAIWhisperClient()

            with patch('builtins.open', mock_open(read_data=b'fake audio data')):
                openai_result = await openai_client.transcribe("/tmp/test.wav")

            assert isinstance(openai_result, TranscriptionResult)

        # FasterWhisper
        mock_http_response = Mock()
        mock_http_response.json.return_value = mock_faster_whisper_response
        mock_http_response.raise_for_status = Mock()

        with patch('httpx.AsyncClient') as mock_client_class:
            mock_client = AsyncMock()
            mock_client.__aenter__.return_value = mock_client
            mock_client.__aexit__.return_value = None
            mock_client.post = AsyncMock(return_value=mock_http_response)
            mock_client_class.return_value = mock_client

            faster_whisper_client = FasterWhisperClient()

            with patch('builtins.open', mock_open(read_data=b'fake audio data')):
                fw_result = await faster_whisper_client.transcribe("/tmp/test.wav")

            assert isinstance(fw_result, TranscriptionResult)

        # WhisperCpp
        mock_http_response.json.return_value = mock_whisper_cpp_response

        with patch('httpx.AsyncClient') as mock_client_class:
            mock_client = AsyncMock()
            mock_client.__aenter__.return_value = mock_client
            mock_client.__aexit__.return_value = None
            mock_client.post = AsyncMock(return_value=mock_http_response)
            mock_client_class.return_value = mock_client

            whisper_cpp_client = WhisperCppClient()

            with patch('builtins.open', mock_open(read_data=b'fake audio data')):
                cpp_result = await whisper_cpp_client.transcribe("/tmp/test.wav")

            assert isinstance(cpp_result, TranscriptionResult)


# =============================================================================
# Test 5: Performance & Latency Tests
# =============================================================================

@pytest.mark.asyncio
async def test_latency_measurement(faster_whisper_client, mock_faster_whisper_response):
    """
    Test 5.1: 모든 클라이언트가 latency_ms 측정
    """
    mock_response = Mock()
    mock_response.json.return_value = mock_faster_whisper_response
    mock_response.raise_for_status = Mock()

    with patch('httpx.AsyncClient') as mock_client_class:
        mock_client = AsyncMock()
        mock_client.__aenter__.return_value = mock_client
        mock_client.__aexit__.return_value = None
        mock_client.post = AsyncMock(return_value=mock_response)
        mock_client_class.return_value = mock_client

        with patch('builtins.open', mock_open(read_data=b'fake audio data')):
            result = await faster_whisper_client.transcribe("/tmp/test.wav")

        # latency_ms가 서버 응답 또는 측정값으로 설정됨
        assert result.latency_ms > 0


# =============================================================================
# Test 6: Edge Cases
# =============================================================================

@pytest.mark.asyncio
async def test_empty_segments(faster_whisper_client):
    """
    Test 6.1: 세그먼트가 없는 응답 처리
    """
    mock_response_data = {
        "text": "test",
        "segments": [],  # 빈 세그먼트
        "language": "ko",
        "duration": 10.0,
        "backend": "faster_whisper",
        "model": "medium",
        "latency_ms": 1000
    }

    mock_response = Mock()
    mock_response.json.return_value = mock_response_data
    mock_response.raise_for_status = Mock()

    with patch('httpx.AsyncClient') as mock_client_class:
        mock_client = AsyncMock()
        mock_client.__aenter__.return_value = mock_client
        mock_client.__aexit__.return_value = None
        mock_client.post = AsyncMock(return_value=mock_response)
        mock_client_class.return_value = mock_client

        with patch('builtins.open', mock_open(read_data=b'fake audio data')):
            result = await faster_whisper_client.transcribe("/tmp/test.wav")

        assert len(result.segments) == 0


@pytest.mark.asyncio
async def test_missing_optional_fields(faster_whisper_client):
    """
    Test 6.2: 선택적 필드 누락 시 처리
    """
    mock_response_data = {
        "text": "test",
        "segments": [],
        "language": "ko",
        "duration": 10.0,
        "backend": "faster_whisper",
        "model": "medium",
        "latency_ms": 1000
        # confidence 누락
    }

    mock_response = Mock()
    mock_response.json.return_value = mock_response_data
    mock_response.raise_for_status = Mock()

    with patch('httpx.AsyncClient') as mock_client_class:
        mock_client = AsyncMock()
        mock_client.__aenter__.return_value = mock_client
        mock_client.__aexit__.return_value = None
        mock_client.post = AsyncMock(return_value=mock_response)
        mock_client_class.return_value = mock_client

        with patch('builtins.open', mock_open(read_data=b'fake audio data')):
            result = await faster_whisper_client.transcribe("/tmp/test.wav")

        assert result.confidence is None  # 선택적 필드는 None
