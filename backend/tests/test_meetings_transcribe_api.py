"""
Meeting Transcribe API Integration Tests

/meetings/{id}/transcribe API 엔드포인트 통합 테스트

작성일: 2025-11-24
작성자: B팀 (Backend)
참조: docs/MEETING_AI_TRANSCRIBER_SPEC.md - A팀 QA 체크리스트
"""

import pytest
from uuid import uuid4
from unittest.mock import Mock, AsyncMock, patch
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.meeting import Meeting, MeetingTranscript, MeetingStatus, TranscriptBackend, TranscriptSourceType, TranscriptProvider
from app.models.user import User
from app.schemas.transcriber import TranscriptionResult, TranscriptSegment


# =============================================================================
# Fixtures
# =============================================================================

@pytest.fixture
def test_user(db_session: Session):
    """Create test user"""
    user = User(
        email="test@example.com",
        username="testuser",
        hashed_password="hashed_password",
        full_name="Test User"
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def test_meeting(db_session: Session, test_user: User):
    """Create test meeting"""
    meeting = Meeting(
        owner_id=test_user.id,
        title="Test Meeting",
        description="Test meeting description",
        file_url="meetings/test_user/test_meeting/audio.mp4",
        duration_seconds=600,
        status=MeetingStatus.UPLOADED
    )
    db_session.add(meeting)
    db_session.commit()
    db_session.refresh(meeting)
    return meeting


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
def mock_storage_service():
    """Mock storage service"""
    with patch('app.api.v1.endpoints.meetings.get_storage_service') as mock:
        storage = Mock()
        storage.download_file.return_value = "/tmp/test_audio.mp4"
        mock.return_value = storage
        yield storage


@pytest.fixture
def mock_transcriber_service(mock_transcription_result):
    """Mock TranscriberService"""
    with patch('app.api.v1.endpoints.meetings.get_transcriber_service') as mock:
        service = Mock()
        service.transcribe = AsyncMock(return_value=mock_transcription_result)
        mock.return_value = service
        yield service


# =============================================================================
# Test 1: Basic Transcription Tests
# =============================================================================

@pytest.mark.asyncio
async def test_transcribe_meeting_success(
    client: TestClient,
    db_session: Session,
    test_meeting: Meeting,
    mock_storage_service,
    mock_transcriber_service
):
    """
    Test 1.1: 회의 트랜스크립션 정상 동작
    """
    # Mock authentication
    with patch('app.api.v1.endpoints.meetings.get_current_user') as mock_auth:
        mock_auth.return_value = test_meeting.owner

        response = client.post(
            f"/api/v1/meetings/{test_meeting.id}/transcribe",
            json={
                "language": "ko",
                "temperature": 0.0
            }
        )

    assert response.status_code == 200
    data = response.json()

    assert data["meeting_id"] == str(test_meeting.id)
    assert "transcript_id" in data
    assert data["status"] == "transcribed"
    assert data["transcript_text"] == "안녕하세요 오늘 회의를 시작하겠습니다"
    assert data["language"] == "ko"
    assert data["segments_count"] == 2

    # DB 확인
    transcript = db_session.query(MeetingTranscript).filter(
        MeetingTranscript.meeting_id == test_meeting.id
    ).first()

    assert transcript is not None
    assert transcript.backend == TranscriptBackend.FASTER_WHISPER
    assert transcript.model == "large-v3"
    assert transcript.is_primary == True
    assert transcript.confidence == 0.95
    assert transcript.latency_ms == 5000


@pytest.mark.asyncio
async def test_transcribe_with_force_mode(
    client: TestClient,
    test_meeting: Meeting,
    mock_storage_service,
    mock_transcriber_service
):
    """
    Test 1.2: force_mode로 모드 강제 지정
    """
    with patch('app.api.v1.endpoints.meetings.get_current_user') as mock_auth:
        mock_auth.return_value = test_meeting.owner

        response = client.post(
            f"/api/v1/meetings/{test_meeting.id}/transcribe",
            json={
                "force_mode": "openai",
                "temperature": 0.0
            }
        )

    assert response.status_code == 200

    # transcriber_service.transcribe가 force_mode="openai"로 호출되었는지 확인
    call_kwargs = mock_transcriber_service.transcribe.call_args[1]
    assert call_kwargs["force_mode"] == "openai"


@pytest.mark.asyncio
async def test_transcribe_with_high_importance(
    client: TestClient,
    test_meeting: Meeting,
    mock_storage_service,
    mock_transcriber_service
):
    """
    Test 1.3: importance=high면 hybrid_quality 모드 사용
    """
    with patch('app.api.v1.endpoints.meetings.get_current_user') as mock_auth:
        mock_auth.return_value = test_meeting.owner

        response = client.post(
            f"/api/v1/meetings/{test_meeting.id}/transcribe",
            json={
                "importance": "high",
                "temperature": 0.0
            }
        )

    assert response.status_code == 200

    # force_mode가 "hybrid_quality"로 설정되었는지 확인
    call_kwargs = mock_transcriber_service.transcribe.call_args[1]
    assert call_kwargs["force_mode"] == "hybrid_quality"


# =============================================================================
# Test 2: Reprocess & Primary Transcript Tests
# =============================================================================

@pytest.mark.asyncio
async def test_reuse_existing_transcript(
    client: TestClient,
    db_session: Session,
    test_meeting: Meeting,
    mock_storage_service,
    mock_transcriber_service
):
    """
    Test 2.1: 기존 트랜스크립트 재사용 (reprocess=False)
    """
    # 기존 트랜스크립트 생성
    existing_transcript = MeetingTranscript(
        meeting_id=test_meeting.id,
        source_type=TranscriptSourceType.WHISPER,
        provider=TranscriptProvider.UPLOAD,
        backend=TranscriptBackend.OPENAI,
        model="whisper-1",
        is_primary=True,
        transcript_text="Existing transcript",
        language="en",
        segments=[]
    )
    db_session.add(existing_transcript)
    db_session.commit()

    with patch('app.api.v1.endpoints.meetings.get_current_user') as mock_auth:
        mock_auth.return_value = test_meeting.owner

        response = client.post(
            f"/api/v1/meetings/{test_meeting.id}/transcribe",
            json={
                "reprocess": False,  # 재처리하지 않음
                "temperature": 0.0
            }
        )

    assert response.status_code == 200
    data = response.json()

    # 기존 트랜스크립트 재사용
    assert data["transcript_id"] == str(existing_transcript.id)
    assert data["transcript_text"] == "Existing transcript"

    # transcriber_service.transcribe가 호출되지 않음
    mock_transcriber_service.transcribe.assert_not_called()


@pytest.mark.asyncio
async def test_reprocess_existing_transcript(
    client: TestClient,
    db_session: Session,
    test_meeting: Meeting,
    mock_storage_service,
    mock_transcriber_service
):
    """
    Test 2.2: 기존 트랜스크립트 재처리 (reprocess=True)
    """
    # 기존 트랜스크립트 생성
    existing_transcript = MeetingTranscript(
        meeting_id=test_meeting.id,
        source_type=TranscriptSourceType.WHISPER,
        provider=TranscriptProvider.UPLOAD,
        backend=TranscriptBackend.OPENAI,
        model="whisper-1",
        is_primary=True,
        transcript_text="Old transcript",
        language="en",
        segments=[]
    )
    db_session.add(existing_transcript)
    db_session.commit()
    db_session.refresh(existing_transcript)

    with patch('app.api.v1.endpoints.meetings.get_current_user') as mock_auth:
        mock_auth.return_value = test_meeting.owner

        response = client.post(
            f"/api/v1/meetings/{test_meeting.id}/transcribe",
            json={
                "reprocess": True,  # 재처리
                "temperature": 0.0
            }
        )

    assert response.status_code == 200
    data = response.json()

    # 새 트랜스크립트 생성됨
    assert data["transcript_id"] != str(existing_transcript.id)
    assert data["transcript_text"] == "안녕하세요 오늘 회의를 시작하겠습니다"

    # 기존 트랜스크립트의 is_primary가 False로 변경됨
    db_session.refresh(existing_transcript)
    assert existing_transcript.is_primary == False

    # transcriber_service.transcribe 호출됨
    mock_transcriber_service.transcribe.assert_called_once()


# =============================================================================
# Test 3: MeetingAgent Auto-Run Tests
# =============================================================================

@pytest.mark.asyncio
async def test_run_meeting_agent_after_transcription(
    client: TestClient,
    db_session: Session,
    test_meeting: Meeting,
    mock_storage_service,
    mock_transcriber_service
):
    """
    Test 3.1: run_meeting_agent=True면 자동 분석 실행
    """
    mock_agent_response = Mock()
    mock_agent_output = Mock()
    mock_agent_output.value = {
        "summary": "Test summary",
        "agenda": ["Agenda 1"],
        "decisions": ["Decision 1"],
        "action_items": ["Action 1"],
        "campaign_ideas": ["Idea 1"]
    }
    mock_agent_response.outputs = [mock_agent_output]

    with patch('app.api.v1.endpoints.meetings.get_meeting_ai_agent') as mock_agent_getter, \
         patch('app.api.v1.endpoints.meetings.get_current_user') as mock_auth:

        mock_agent = Mock()
        mock_agent.execute = AsyncMock(return_value=mock_agent_response)
        mock_agent_getter.return_value = mock_agent
        mock_auth.return_value = test_meeting.owner

        response = client.post(
            f"/api/v1/meetings/{test_meeting.id}/transcribe",
            json={
                "run_meeting_agent": True,
                "temperature": 0.0
            }
        )

    assert response.status_code == 200
    data = response.json()

    # Meeting status가 analyzed로 변경됨
    assert data["status"] == "analyzed"

    # MeetingAgent 호출 확인
    mock_agent.execute.assert_called_once()

    # DB 확인
    db_session.refresh(test_meeting)
    assert test_meeting.status == MeetingStatus.ANALYZED
    assert test_meeting.analysis_result is not None
    assert test_meeting.analysis_result["summary"] == "Test summary"


# =============================================================================
# Test 4: Error Handling Tests
# =============================================================================

@pytest.mark.asyncio
async def test_meeting_not_found(client: TestClient):
    """
    Test 4.1: 존재하지 않는 회의 ID
    """
    fake_meeting_id = uuid4()

    with patch('app.api.v1.endpoints.meetings.get_current_user') as mock_auth:
        mock_user = Mock()
        mock_user.id = uuid4()
        mock_auth.return_value = mock_user

        response = client.post(
            f"/api/v1/meetings/{fake_meeting_id}/transcribe",
            json={"temperature": 0.0}
        )

    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_file_not_uploaded(
    client: TestClient,
    db_session: Session,
    test_meeting: Meeting
):
    """
    Test 4.2: 파일이 업로드되지 않은 회의
    """
    # file_url 제거
    test_meeting.file_url = None
    db_session.commit()

    with patch('app.api.v1.endpoints.meetings.get_current_user') as mock_auth:
        mock_auth.return_value = test_meeting.owner

        response = client.post(
            f"/api/v1/meetings/{test_meeting.id}/transcribe",
            json={"temperature": 0.0}
        )

    assert response.status_code == 400
    assert "not uploaded" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_transcription_failure(
    client: TestClient,
    db_session: Session,
    test_meeting: Meeting,
    mock_storage_service
):
    """
    Test 4.3: 트랜스크립션 실패 시 에러 처리
    """
    with patch('app.api.v1.endpoints.meetings.get_transcriber_service') as mock_transcriber, \
         patch('app.api.v1.endpoints.meetings.get_current_user') as mock_auth:

        service = Mock()
        service.transcribe = AsyncMock(side_effect=Exception("Transcription failed"))
        mock_transcriber.return_value = service
        mock_auth.return_value = test_meeting.owner

        response = client.post(
            f"/api/v1/meetings/{test_meeting.id}/transcribe",
            json={"temperature": 0.0}
        )

    assert response.status_code == 500
    assert "failed" in response.json()["detail"].lower()

    # Meeting status가 FAILED로 변경됨
    db_session.refresh(test_meeting)
    assert test_meeting.status == MeetingStatus.FAILED


# =============================================================================
# Test 5: Backend Enum Mapping Tests
# =============================================================================

@pytest.mark.asyncio
async def test_backend_enum_mapping_openai(
    client: TestClient,
    db_session: Session,
    test_meeting: Meeting,
    mock_storage_service
):
    """
    Test 5.1: backend="openai" → TranscriptBackend.OPENAI 매핑
    """
    openai_result = TranscriptionResult(
        text="Test",
        segments=[],
        language="en",
        duration_seconds=10.0,
        backend="openai",
        model="whisper-1",
        latency_ms=1000
    )

    with patch('app.api.v1.endpoints.meetings.get_transcriber_service') as mock_transcriber, \
         patch('app.api.v1.endpoints.meetings.get_current_user') as mock_auth:

        service = Mock()
        service.transcribe = AsyncMock(return_value=openai_result)
        mock_transcriber.return_value = service
        mock_auth.return_value = test_meeting.owner

        response = client.post(
            f"/api/v1/meetings/{test_meeting.id}/transcribe",
            json={"temperature": 0.0}
        )

    assert response.status_code == 200

    # DB 확인
    transcript = db_session.query(MeetingTranscript).filter(
        MeetingTranscript.meeting_id == test_meeting.id
    ).first()

    assert transcript.backend == TranscriptBackend.OPENAI
    assert transcript.model == "whisper-1"


@pytest.mark.asyncio
async def test_backend_enum_mapping_unknown(
    client: TestClient,
    db_session: Session,
    test_meeting: Meeting,
    mock_storage_service
):
    """
    Test 5.2: 알 수 없는 backend → TranscriptBackend.UNKNOWN 매핑
    """
    unknown_result = TranscriptionResult(
        text="Test",
        segments=[],
        language="en",
        duration_seconds=10.0,
        backend="unknown_backend",
        model="unknown_model",
        latency_ms=1000
    )

    with patch('app.api.v1.endpoints.meetings.get_transcriber_service') as mock_transcriber, \
         patch('app.api.v1.endpoints.meetings.get_current_user') as mock_auth:

        service = Mock()
        service.transcribe = AsyncMock(return_value=unknown_result)
        mock_transcriber.return_value = service
        mock_auth.return_value = test_meeting.owner

        response = client.post(
            f"/api/v1/meetings/{test_meeting.id}/transcribe",
            json={"temperature": 0.0}
        )

    assert response.status_code == 200

    # DB 확인
    transcript = db_session.query(MeetingTranscript).filter(
        MeetingTranscript.meeting_id == test_meeting.id
    ).first()

    assert transcript.backend == TranscriptBackend.UNKNOWN


# =============================================================================
# Test 6: Segments & Metadata Tests
# =============================================================================

@pytest.mark.asyncio
async def test_segments_stored_correctly(
    client: TestClient,
    db_session: Session,
    test_meeting: Meeting,
    mock_storage_service,
    mock_transcriber_service
):
    """
    Test 6.1: 세그먼트가 올바르게 저장되는지 확인
    """
    with patch('app.api.v1.endpoints.meetings.get_current_user') as mock_auth:
        mock_auth.return_value = test_meeting.owner

        response = client.post(
            f"/api/v1/meetings/{test_meeting.id}/transcribe",
            json={"temperature": 0.0}
        )

    assert response.status_code == 200

    # DB 확인
    transcript = db_session.query(MeetingTranscript).filter(
        MeetingTranscript.meeting_id == test_meeting.id
    ).first()

    assert len(transcript.segments) == 2
    assert transcript.segments[0]["start"] == 0.0
    assert transcript.segments[0]["end"] == 2.5
    assert transcript.segments[0]["text"] == "안녕하세요"


@pytest.mark.asyncio
async def test_whisper_metadata_stored(
    client: TestClient,
    db_session: Session,
    test_meeting: Meeting,
    mock_storage_service,
    mock_transcriber_service
):
    """
    Test 6.2: whisper_metadata가 올바르게 저장되는지 확인
    """
    with patch('app.api.v1.endpoints.meetings.get_current_user') as mock_auth:
        mock_auth.return_value = test_meeting.owner

        response = client.post(
            f"/api/v1/meetings/{test_meeting.id}/transcribe",
            json={"temperature": 0.0}
        )

    assert response.status_code == 200

    # DB 확인
    transcript = db_session.query(MeetingTranscript).filter(
        MeetingTranscript.meeting_id == test_meeting.id
    ).first()

    assert transcript.whisper_metadata["backend"] == "faster_whisper"
    assert transcript.whisper_metadata["model"] == "large-v3"
    assert transcript.whisper_metadata["duration"] == 120.5
    assert transcript.whisper_metadata["language_detected"] == "ko"
    assert transcript.whisper_metadata["confidence"] == 0.95
    assert transcript.whisper_metadata["latency_ms"] == 5000


@pytest.mark.asyncio
async def test_meeting_duration_updated(
    client: TestClient,
    db_session: Session,
    test_meeting: Meeting,
    mock_storage_service,
    mock_transcriber_service
):
    """
    Test 6.3: Meeting.duration_seconds가 업데이트되는지 확인
    """
    # duration_seconds 초기화
    test_meeting.duration_seconds = None
    db_session.commit()

    with patch('app.api.v1.endpoints.meetings.get_current_user') as mock_auth:
        mock_auth.return_value = test_meeting.owner

        response = client.post(
            f"/api/v1/meetings/{test_meeting.id}/transcribe",
            json={"temperature": 0.0}
        )

    assert response.status_code == 200

    # DB 확인
    db_session.refresh(test_meeting)
    assert test_meeting.duration_seconds == 120  # int(120.5)
