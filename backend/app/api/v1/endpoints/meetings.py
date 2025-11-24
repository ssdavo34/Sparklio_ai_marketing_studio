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

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, BackgroundTasks
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
    MeetingSummaryOutput,
    MeetingToBriefInput,
    CampaignBriefOutput,
    MeetingFromURLRequest,
    MeetingFromURLResponse
)
from app.services.storage import get_storage_service
from app.services.transcriber import get_transcriber_service
from app.services.agents.meeting_ai import get_meeting_ai_agent
from app.services.agents.base import AgentRequest
from app.models.meeting import TranscriptSourceType, TranscriptProvider, TranscriptBackend
from app.services.meeting_url_pipeline import get_meeting_url_pipeline

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


@router.post("/from-url", response_model=MeetingFromURLResponse, status_code=status.HTTP_201_CREATED)
async def create_meeting_from_url(
    request: MeetingFromURLRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    URL로부터 회의 생성 (YouTube, 웹 URL 등)

    Stage 1: Caption만 가져오기

    Args:
        request: URL 및 회의 정보
        background_tasks: 백그라운드 작업
        current_user: 현재 사용자
        db: 데이터베이스 세션

    Returns:
        MeetingFromURLResponse: 생성된 회의 정보
    """
    try:
        logger.info(f"Creating meeting from URL: {request.url}")

        # 1. Meeting 레코드 생성
        title = request.title or f"Meeting from {request.url[:50]}"

        meeting = Meeting(
            owner_id=current_user.id,
            brand_id=request.brand_id,
            project_id=request.project_id,
            title=title,
            description=request.description or f"Imported from: {request.url}",
            status=MeetingStatus.CREATED,  # ← PENDING → CREATED 변경
            meeting_metadata={"source_url": request.url}
        )

        db.add(meeting)
        db.commit()
        db.refresh(meeting)

        # 2. 백그라운드에서 URL 처리 시작
        pipeline = get_meeting_url_pipeline()

        async def process_meeting_url():
            """백그라운드 작업: URL 처리"""
            # 새로운 DB 세션 필요 (백그라운드 스레드)
            from app.core.database import SessionLocal
            bg_db = SessionLocal()
            try:
                await pipeline.process_url(
                    meeting_id=meeting.id,
                    url=request.url,
                    db=bg_db,
                    auto_transcribe=request.auto_transcribe
                )
            finally:
                bg_db.close()

        background_tasks.add_task(process_meeting_url)

        logger.info(
            f"Meeting {meeting.id} created, background processing started"
        )

        return MeetingFromURLResponse(
            meeting_id=meeting.id,
            status=meeting.status,
            message="Meeting created successfully. URL processing will start in background.",
            transcription_started=False  # Stage 1에서는 STT 없음
        )

    except Exception as e:
        logger.error(f"Error creating meeting from URL: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create meeting from URL: {str(e)}"
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
    회의 트랜스크립션 실행 (Multi-backend Whisper 통합)

    1. MinIO에서 오디오 파일 다운로드
    2. TranscriberService (4-mode)로 트랜스크립션
    3. meeting_transcripts 테이블에 저장 (backend, model, confidence, latency_ms 포함)
    4. Meeting status를 transcribed로 업데이트
    5. (선택) MeetingAgent 자동 실행

    Body:
        - language: 언어 코드 (ISO-639-1, 예: 'ko', 'en'). None이면 자동 감지
        - prompt: Whisper에게 주는 힌트 텍스트 (선택)
        - temperature: 샘플링 온도 (0.0 = 결정론적, 1.0 = 랜덤)
        - force_mode: 강제 모드 지정 (openai | local | hybrid_cost | hybrid_quality)
        - reprocess: 기존 트랜스크립트 무시하고 재처리 (True) vs 기존 사용 (False)
        - importance: 중요도 (normal | high) - high면 품질 우선
        - run_meeting_agent: 트랜스크립션 완료 후 MeetingAgent 분석 자동 실행
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

        # 2. 기존 트랜스크립트 확인
        existing_transcript = db.query(MeetingTranscript).filter(
            MeetingTranscript.meeting_id == meeting_id,
            MeetingTranscript.is_primary == True
        ).first()

        if existing_transcript and not transcribe_data.reprocess:
            # 기존 트랜스크립트 재사용
            logger.info(f"Reusing existing transcript: {existing_transcript.id}")

            return TranscribeResponse(
                meeting_id=meeting_id,
                transcript_id=existing_transcript.id,
                status=meeting.status,
                transcript_text=existing_transcript.transcript_text,
                language=existing_transcript.language or "unknown",
                duration=meeting.duration_seconds,
                segments_count=len(existing_transcript.segments) if existing_transcript.segments else 0
            )

        # 3. 상태 업데이트: transcribing
        meeting.status = MeetingStatus.TRANSCRIBING
        db.commit()

        # 4. Storage에서 파일 다운로드 (로컬 임시 경로)
        storage = get_storage_service()
        local_file_path = storage.download_file(
            bucket="meetings",
            object_key=meeting.file_url,
            local_path=f"/tmp/meeting_{meeting_id}.mp4"
        )

        # 5. TranscriberService (4-mode)로 트랜스크립션
        transcriber = get_transcriber_service()

        # importance가 high면 hybrid_quality 모드 강제
        force_mode = transcribe_data.force_mode
        if transcribe_data.importance == "high" and not force_mode:
            force_mode = "hybrid_quality"
            logger.info(f"High importance meeting, using hybrid_quality mode")

        try:
            result = await transcriber.transcribe(
                audio_path=local_file_path,
                duration_seconds=float(meeting.duration_seconds) if meeting.duration_seconds else None,
                force_mode=force_mode,
                importance=transcribe_data.importance,
                language=transcribe_data.language or "auto",
                temperature=transcribe_data.temperature
            )
        except Exception as e:
            # 트랜스크립션 실패
            meeting.status = MeetingStatus.FAILED
            db.commit()
            logger.error(f"Transcription failed: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Transcription failed: {str(e)}"
            )

        # 6. 기존 primary transcript 해제
        if transcribe_data.reprocess and existing_transcript:
            existing_transcript.is_primary = False
            db.commit()

        # 7. Backend enum 매핑
        backend_map = {
            "openai": TranscriptBackend.OPENAI,
            "faster_whisper": TranscriptBackend.FASTER_WHISPER,
            "whisper_cpp": TranscriptBackend.WHISPER_CPP,
        }
        backend_enum = backend_map.get(result.backend, TranscriptBackend.UNKNOWN)

        # 8. meeting_transcripts 저장
        transcript = MeetingTranscript(
            meeting_id=meeting_id,
            source_type=TranscriptSourceType.WHISPER,
            provider=TranscriptProvider.UPLOAD,
            backend=backend_enum,
            model=result.model,
            is_primary=True,
            confidence=result.confidence,
            latency_ms=result.latency_ms,
            transcript_text=result.text,
            language=result.language,
            segments=[
                {
                    "start": seg.start,
                    "end": seg.end,
                    "text": seg.text
                }
                for seg in result.segments
            ],
            whisper_metadata={
                "backend": result.backend,
                "model": result.model,
                "duration": result.duration_seconds,
                "language_detected": result.language,
                "confidence": result.confidence,
                "latency_ms": result.latency_ms
            }
        )

        db.add(transcript)

        # 9. Meeting 업데이트
        meeting.status = MeetingStatus.TRANSCRIBED
        if not meeting.duration_seconds:
            meeting.duration_seconds = int(result.duration_seconds)
        meeting.updated_at = datetime.utcnow()

        db.commit()
        db.refresh(transcript)

        logger.info(
            f"Meeting transcribed: {meeting_id}, transcript_id: {transcript.id}, "
            f"backend: {result.backend}, model: {result.model}, latency: {result.latency_ms}ms"
        )

        # 10. (선택) MeetingAgent 자동 실행
        if transcribe_data.run_meeting_agent:
            logger.info(f"Running MeetingAgent for meeting: {meeting_id}")
            try:
                # Brand context 조회
                brand_context = None
                if meeting.brand_id:
                    from app.models.brand import Brand
                    brand = db.query(Brand).filter(Brand.id == meeting.brand_id).first()
                    if brand and brand.brand_dna:
                        brand_context = str(brand.brand_dna)

                # MeetingAgent 실행
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

                if agent_response.outputs:
                    analysis_result = agent_response.outputs[0].value
                    meeting.analysis_result = analysis_result
                    meeting.status = MeetingStatus.ANALYZED
                    db.commit()
                    logger.info(f"MeetingAgent completed for meeting: {meeting_id}")

            except Exception as agent_error:
                logger.error(f"MeetingAgent failed for meeting {meeting_id}: {agent_error}")
                # Agent 실패해도 트랜스크립션 성공은 유지

        return TranscribeResponse(
            meeting_id=meeting_id,
            transcript_id=transcript.id,
            status=meeting.status,
            transcript_text=result.text,
            language=result.language,
            duration=result.duration_seconds,
            segments_count=len(result.segments)
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error transcribing meeting {meeting_id}: {str(e)}")
        # 실패 상태 업데이트
        if meeting:
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

        # 2. Primary Transcript 조회
        transcript = db.query(MeetingTranscript).filter(
            MeetingTranscript.meeting_id == meeting_id,
            MeetingTranscript.is_primary == True
        ).first()

        if not transcript:
            # Fallback: 가장 최근 트랜스크립트 사용
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


@router.post("/{meeting_id}/to-brief", response_model=CampaignBriefOutput)
async def meeting_to_brief(
    meeting_id: UUID,
    additional_context: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    회의 분석 결과를 캠페인 브리프로 변환 (MeetingAgent)

    1. Meeting의 analysis_result 조회 (없으면 자동 분석)
    2. MeetingAgent의 meeting_to_brief task 실행
    3. Campaign Brief 생성 및 반환

    Args:
        meeting_id: 회의 ID
        additional_context: 추가 컨텍스트 (사용자 입력, optional)

    Returns:
        CampaignBriefOutput: 생성된 캠페인 브리프
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

        # 2. analysis_result 확인 (없으면 자동 분석)
        if not meeting.analysis_result:
            logger.info(f"No analysis_result found for meeting {meeting_id}, running analysis first")

            # Primary Transcript 조회
            transcript = db.query(MeetingTranscript).filter(
                MeetingTranscript.meeting_id == meeting_id,
                MeetingTranscript.is_primary == True
            ).first()

            if not transcript:
                # Fallback: 가장 최근 트랜스크립트
                transcript = db.query(MeetingTranscript).filter(
                    MeetingTranscript.meeting_id == meeting_id
                ).order_by(desc(MeetingTranscript.created_at)).first()

            if not transcript:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="No transcript found. Please transcribe the meeting first."
                )

            # Brand context 조회
            brand_context = None
            if meeting.brand_id:
                from app.models.brand import Brand
                brand = db.query(Brand).filter(Brand.id == meeting.brand_id).first()
                if brand and brand.brand_dna:
                    brand_context = str(brand.brand_dna)

            # MeetingAgent로 분석 실행
            agent = get_meeting_ai_agent()
            summary_request = AgentRequest(
                task="meeting_summary",
                payload={
                    "transcript": transcript.transcript_text,
                    "meeting_title": meeting.title,
                    "meeting_date": meeting.meeting_date.isoformat() if meeting.meeting_date else None,
                    "brand_context": brand_context
                }
            )

            summary_response = await agent.execute(summary_request)
            meeting.analysis_result = summary_response.outputs[0].value
            meeting.status = MeetingStatus.ANALYZED
            db.commit()

        # 3. Brand context 조회
        brand_context = None
        if meeting.brand_id:
            from app.models.brand import Brand
            brand = db.query(Brand).filter(Brand.id == meeting.brand_id).first()
            if brand and brand.brand_dna:
                brand_context = str(brand.brand_dna)

        # 4. MeetingAgent로 meeting_to_brief 실행
        agent = get_meeting_ai_agent()
        brief_request = AgentRequest(
            task="meeting_to_brief",
            payload={
                "meeting_summary": meeting.analysis_result,
                "brand_context": brand_context,
                "additional_context": additional_context
            }
        )

        brief_response = await agent.execute(brief_request)

        # 5. 결과 파싱
        if not brief_response.outputs:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Agent returned no outputs"
            )

        brief_data = brief_response.outputs[0].value

        logger.info(f"Campaign brief generated for meeting {meeting_id}")

        # 6. CampaignBriefOutput으로 변환
        return CampaignBriefOutput(
            brief_title=brief_data.get("brief_title", ""),
            objective=brief_data.get("objective", ""),
            target_audience=brief_data.get("target_audience", ""),
            key_messages=brief_data.get("key_messages", []),
            channels=brief_data.get("channels", []),
            timeline=brief_data.get("timeline"),
            budget=brief_data.get("budget"),
            deliverables=brief_data.get("deliverables", []),
            constraints=brief_data.get("constraints"),
            success_metrics=brief_data.get("success_metrics"),
            created_at=datetime.utcnow()
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating brief from meeting {meeting_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Brief generation failed: {str(e)}"
        )
