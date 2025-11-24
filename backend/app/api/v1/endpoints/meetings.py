"""
Meeting API Endpoints

회의 음성/영상 파일 업로드 및 트랜스크립션 API

작성일: 2025-11-24
작성자: B팀 (Backend)
참조: SPARKLIO_MVP_MASTER_TRACKER.md - P0-2 Meeting AI Module
"""

import logging
from typing import List, Optional
from uuid import UUID
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.core.database import get_db
from app.core.auth import get_current_user
from app.models.user import User
from app.models.meeting import Meeting, MeetingTranscript, MeetingStatus
from app.schemas.meeting import (
    MeetingCreate,
    MeetingUpdate,
    MeetingResponse,
    MeetingListResponse,
    MeetingTranscriptResponse,
    TranscribeRequest,
    TranscribeResponse,
    MeetingUploadResponse,
    MeetingSummaryInput,
    MeetingSummaryOutput
)
from app.services.storage import get_storage_service
from app.services.transcriber import get_transcriber, TranscriberError
from app.services.agents.meeting_ai import get_meeting_ai_agent
from app.services.agents.base import AgentRequest

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/meetings", tags=["meetings"])


# =============================================================================
# Meeting CRUD
# =============================================================================

@router.post("", response_model=MeetingUploadResponse, status_code=status.HTTP_201_CREATED)
async def create_meeting(
    title: str = Form(...),
    description: Optional[str] = Form(None),
    meeting_date: Optional[datetime] = Form(None),
    brand_id: Optional[UUID] = Form(None),
    project_id: Optional[UUID] = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    회의 생성 및 파일 업로드 URL 반환

    1. Meeting 레코드 생성 (status=uploaded)
    2. MinIO presigned upload URL 생성
    3. 클라이언트는 presigned URL로 파일 업로드

    Returns:
        MeetingUploadResponse: meeting_id, upload_url, file_key, expires_in
    """
    try:
        # 1. Meeting 생성
        meeting = Meeting(
            owner_id=current_user.id,
            brand_id=brand_id,
            project_id=project_id,
            title=title,
            description=description,
            meeting_date=meeting_date,
            status=MeetingStatus.UPLOADED
        )

        db.add(meeting)
        db.commit()
        db.refresh(meeting)

        # 2. Storage service로 presigned upload URL 생성
        storage = get_storage_service()
        file_key = f"meetings/{current_user.id}/{meeting.id}/audio.mp4"

        upload_url = storage.generate_presigned_upload_url(
            bucket="meetings",
            object_key=file_key,
            expires_in=3600  # 1 hour
        )

        # 3. file_url 저장 (MinIO 경로)
        meeting.file_url = file_key
        db.commit()

        logger.info(f"Meeting created: {meeting.id}, upload_url generated")

        return MeetingUploadResponse(
            meeting_id=meeting.id,
            upload_url=upload_url,
            file_key=file_key,
            expires_in=3600
        )

    except Exception as e:
        logger.error(f"Error creating meeting: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create meeting: {str(e)}"
        )


@router.get("", response_model=MeetingListResponse)
def list_meetings(
    page: int = 1,
    page_size: int = 20,
    brand_id: Optional[UUID] = None,
    project_id: Optional[UUID] = None,
    status_filter: Optional[MeetingStatus] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    회의 목록 조회

    Query Params:
        - page: 페이지 번호 (기본값: 1)
        - page_size: 페이지 크기 (기본값: 20)
        - brand_id: 브랜드 ID 필터
        - project_id: 프로젝트 ID 필터
        - status_filter: 상태 필터
    """
    try:
        # 쿼리 빌드
        query = db.query(Meeting).filter(
            Meeting.owner_id == current_user.id,
            Meeting.deleted_at.is_(None)
        )

        if brand_id:
            query = query.filter(Meeting.brand_id == brand_id)

        if project_id:
            query = query.filter(Meeting.project_id == project_id)

        if status_filter:
            query = query.filter(Meeting.status == status_filter)

        # 총 개수
        total = query.count()

        # 페이징 및 정렬
        meetings = query.order_by(desc(Meeting.created_at)).offset((page - 1) * page_size).limit(page_size).all()

        return MeetingListResponse(
            items=meetings,
            total=total,
            page=page,
            page_size=page_size
        )

    except Exception as e:
        logger.error(f"Error listing meetings: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list meetings: {str(e)}"
        )


@router.get("/{meeting_id}", response_model=MeetingResponse)
def get_meeting(
    meeting_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    회의 상세 조회
    """
    meeting = db.query(Meeting).filter(
        Meeting.id == meeting_id,
        Meeting.owner_id == current_user.id,
        Meeting.deleted_at.is_(None)
    ).first()

    if not meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Meeting not found: {meeting_id}"
        )

    return meeting


@router.patch("/{meeting_id}", response_model=MeetingResponse)
def update_meeting(
    meeting_id: UUID,
    update_data: MeetingUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    회의 정보 수정
    """
    meeting = db.query(Meeting).filter(
        Meeting.id == meeting_id,
        Meeting.owner_id == current_user.id,
        Meeting.deleted_at.is_(None)
    ).first()

    if not meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Meeting not found: {meeting_id}"
        )

    # 수정
    update_dict = update_data.model_dump(exclude_unset=True)
    for key, value in update_dict.items():
        setattr(meeting, key, value)

    meeting.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(meeting)

    logger.info(f"Meeting updated: {meeting_id}")

    return meeting


@router.delete("/{meeting_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_meeting(
    meeting_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    회의 삭제 (soft delete)
    """
    meeting = db.query(Meeting).filter(
        Meeting.id == meeting_id,
        Meeting.owner_id == current_user.id,
        Meeting.deleted_at.is_(None)
    ).first()

    if not meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Meeting not found: {meeting_id}"
        )

    # Soft delete
    meeting.deleted_at = datetime.utcnow()
    db.commit()

    logger.info(f"Meeting deleted: {meeting_id}")

    return None


# =============================================================================
# Transcription
# =============================================================================

@router.post("/{meeting_id}/transcribe", response_model=TranscribeResponse)
async def transcribe_meeting(
    meeting_id: UUID,
    transcribe_data: TranscribeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    회의 트랜스크립션 실행

    1. MinIO에서 오디오 파일 다운로드
    2. Whisper API로 트랜스크립션
    3. meeting_transcripts 테이블에 저장
    4. Meeting status를 transcribed로 업데이트

    Body:
        - language: 언어 코드 (ISO-639-1, 예: 'ko', 'en'). None이면 자동 감지
        - prompt: Whisper에게 주는 힌트 텍스트 (선택)
        - temperature: 샘플링 온도 (0.0 = 결정론적, 1.0 = 랜덤)
    """
    try:
        # 1. Meeting 조회
        meeting = db.query(Meeting).filter(
            Meeting.id == meeting_id,
            Meeting.owner_id == current_user.id,
            Meeting.deleted_at.is_(None)
        ).first()

        if not meeting:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Meeting not found: {meeting_id}"
            )

        if not meeting.file_url:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Meeting file not uploaded yet"
            )

        # 2. 상태 업데이트: transcribing
        meeting.status = MeetingStatus.TRANSCRIBING
        db.commit()

        # 3. Storage에서 파일 다운로드 (로컬 임시 경로)
        storage = get_storage_service()
        local_file_path = storage.download_file(
            bucket="meetings",
            object_key=meeting.file_url,
            local_path=f"/tmp/meeting_{meeting_id}.mp4"
        )

        # 4. Whisper API 트랜스크립션
        transcriber = get_transcriber()
        try:
            result = await transcriber.transcribe_async(
                file_path=local_file_path,
                language=transcribe_data.language,
                prompt=transcribe_data.prompt,
                temperature=transcribe_data.temperature
            )
        except TranscriberError as e:
            # 트랜스크립션 실패
            meeting.status = MeetingStatus.FAILED
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Transcription failed: {str(e)}"
            )

        # 5. meeting_transcripts 저장
        transcript = MeetingTranscript(
            meeting_id=meeting_id,
            transcript_text=result["transcript_text"],
            language=result["language"],
            segments=result["segments"],
            whisper_metadata=result["whisper_metadata"]
        )

        db.add(transcript)

        # 6. Meeting 업데이트
        meeting.status = MeetingStatus.TRANSCRIBED
        meeting.duration_seconds = int(result.get("duration", 0)) if result.get("duration") else None
        meeting.updated_at = datetime.utcnow()

        db.commit()
        db.refresh(transcript)

        logger.info(f"Meeting transcribed: {meeting_id}, transcript_id: {transcript.id}")

        return TranscribeResponse(
            meeting_id=meeting_id,
            transcript_id=transcript.id,
            status=meeting.status,
            transcript_text=result["transcript_text"],
            language=result["language"],
            duration=result.get("duration"),
            segments_count=len(result["segments"]) if result["segments"] else 0
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error transcribing meeting {meeting_id}: {str(e)}")
        # 실패 상태 업데이트
        meeting.status = MeetingStatus.FAILED
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Transcription failed: {str(e)}"
        )


@router.get("/{meeting_id}/transcripts", response_model=List[MeetingTranscriptResponse])
def get_meeting_transcripts(
    meeting_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    회의 트랜스크립트 목록 조회
    """
    # Meeting 권한 확인
    meeting = db.query(Meeting).filter(
        Meeting.id == meeting_id,
        Meeting.owner_id == current_user.id,
        Meeting.deleted_at.is_(None)
    ).first()

    if not meeting:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Meeting not found: {meeting_id}"
        )

    # Transcripts 조회
    transcripts = db.query(MeetingTranscript).filter(
        MeetingTranscript.meeting_id == meeting_id
    ).order_by(desc(MeetingTranscript.created_at)).all()

    return transcripts


# =============================================================================
# Analysis (MeetingAgent)
# =============================================================================

@router.post("/{meeting_id}/analyze", response_model=MeetingSummaryOutput)
async def analyze_meeting(
    meeting_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    회의 분석 실행 (MeetingAgent)

    1. meeting_transcripts에서 트랜스크립트 조회
    2. MeetingAgent로 요약 및 분석
    3. Meeting.analysis_result에 저장
    4. Meeting status를 analyzed로 업데이트

    Returns:
        MeetingSummaryOutput: {summary, agenda, decisions, action_items, campaign_ideas}
    """
    try:
        # 1. Meeting 조회
        meeting = db.query(Meeting).filter(
            Meeting.id == meeting_id,
            Meeting.owner_id == current_user.id,
            Meeting.deleted_at.is_(None)
        ).first()

        if not meeting:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Meeting not found: {meeting_id}"
            )

        # 2. Transcript 조회
        transcript = db.query(MeetingTranscript).filter(
            MeetingTranscript.meeting_id == meeting_id
        ).order_by(desc(MeetingTranscript.created_at)).first()

        if not transcript:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No transcript found. Please transcribe the meeting first."
            )

        # 3. Brand context (선택) - brand_id가 있으면 Brand DNA 조회
        brand_context = None
        if meeting.brand_id:
            from app.models.brand import Brand
            brand = db.query(Brand).filter(Brand.id == meeting.brand_id).first()
            if brand and brand.brand_dna:
                brand_context = str(brand.brand_dna)

        # 4. MeetingAgent 실행
        agent = get_meeting_ai_agent()
        agent_request = AgentRequest(
            task="meeting_summary",
            payload={
                "transcript": transcript.transcript_text,
                "meeting_title": meeting.title,
                "meeting_date": meeting.meeting_date.isoformat() if meeting.meeting_date else None,
                "brand_context": brand_context
            }
        )

        agent_response = await agent.execute(agent_request)

        # 5. Agent output 파싱
        if not agent_response.outputs:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Agent returned no outputs"
            )

        analysis_result = agent_response.outputs[0].value

        # 6. Meeting에 저장
        meeting.analysis_result = analysis_result
        meeting.status = MeetingStatus.ANALYZED
        meeting.updated_at = datetime.utcnow()

        db.commit()

        logger.info(f"Meeting analyzed: {meeting_id}")

        # 7. MeetingSummaryOutput으로 변환
        return MeetingSummaryOutput(
            summary=analysis_result.get("summary", ""),
            agenda=analysis_result.get("agenda", []),
            decisions=analysis_result.get("decisions", []),
            action_items=analysis_result.get("action_items", []),
            campaign_ideas=analysis_result.get("campaign_ideas", []),
            analyzed_at=datetime.utcnow(),
            analyzer_version="v1.0"
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error analyzing meeting {meeting_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Analysis failed: {str(e)}"
        )
