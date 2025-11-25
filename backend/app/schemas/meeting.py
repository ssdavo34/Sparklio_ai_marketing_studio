"""
Meeting Schemas

회의 API 요청/응답 스키마

작성일: 2025-11-24
작성자: B팀 (Backend)
참조: SPARKLIO_MVP_MASTER_TRACKER.md - P0-2 Meeting AI Module
"""

from pydantic import BaseModel, Field, UUID4
from typing import Optional, List, Dict, Any
from datetime import datetime

from app.models.meeting import MeetingStatus


# =============================================================================
# Meeting Schemas
# =============================================================================

class MeetingBase(BaseModel):
    """회의 기본 스키마"""
    title: str = Field(..., max_length=255, description="회의 제목")
    description: Optional[str] = Field(None, description="회의 설명")
    meeting_date: Optional[datetime] = Field(None, description="회의 날짜")
    brand_id: Optional[UUID4] = Field(None, description="브랜드 ID")
    project_id: Optional[UUID4] = Field(None, description="프로젝트 ID")


class MeetingCreate(MeetingBase):
    """회의 생성 요청"""
    pass


class MeetingUpdate(BaseModel):
    """회의 수정 요청"""
    title: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = Field(None)
    meeting_date: Optional[datetime] = Field(None)
    brand_id: Optional[UUID4] = Field(None)
    project_id: Optional[UUID4] = Field(None)


class MeetingResponse(MeetingBase):
    """회의 응답"""
    id: UUID4
    owner_id: UUID4
    file_url: Optional[str]
    file_size: Optional[int]
    mime_type: Optional[str]
    duration_seconds: Optional[int]
    status: MeetingStatus
    error_message: Optional[str] = Field(None, description="실패 시 에러 메시지")
    analysis_result: Optional[Dict[str, Any]]
    meeting_metadata: Optional[Dict[str, Any]]
    created_at: datetime
    updated_at: datetime
    deleted_at: Optional[datetime]

    class Config:
        from_attributes = True


class MeetingListResponse(BaseModel):
    """회의 목록 응답"""
    items: List[MeetingResponse]
    total: int
    page: int
    page_size: int


# =============================================================================
# Transcript Schemas
# =============================================================================

class TranscriptSegment(BaseModel):
    """트랜스크립트 세그먼트"""
    start: float = Field(..., description="시작 시간 (초)")
    end: float = Field(..., description="종료 시간 (초)")
    text: str = Field(..., description="세그먼트 텍스트")
    speaker: Optional[str] = Field(None, description="화자 (optional)")


class MeetingTranscriptBase(BaseModel):
    """트랜스크립트 기본 스키마"""
    transcript_text: str = Field(..., description="전체 트랜스크립트")
    language: Optional[str] = Field(None, description="언어 코드")
    segments: Optional[List[TranscriptSegment]] = Field(None, description="타임스탬프 세그먼트")
    whisper_metadata: Optional[Dict[str, Any]] = Field(None, description="Whisper 메타데이터")


class MeetingTranscriptResponse(MeetingTranscriptBase):
    """트랜스크립트 응답"""
    id: UUID4
    meeting_id: UUID4
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# =============================================================================
# Transcribe Request
# =============================================================================

class TranscribeRequest(BaseModel):
    """트랜스크립션 요청"""
    language: Optional[str] = Field(
        None,
        description="언어 코드 (ISO-639-1, 예: 'ko', 'en'). None이면 자동 감지"
    )
    prompt: Optional[str] = Field(
        None,
        description="Whisper에게 주는 힌트 텍스트 (선택)"
    )
    temperature: float = Field(
        0.0,
        ge=0.0,
        le=1.0,
        description="샘플링 온도 (0.0 = 결정론적, 1.0 = 랜덤)"
    )
    force_mode: Optional[str] = Field(
        None,
        description="강제 모드 지정 (openai | local | hybrid_cost | hybrid_quality)"
    )
    reprocess: bool = Field(
        False,
        description="기존 트랜스크립트 무시하고 재처리 (True) vs 기존 사용 (False)"
    )
    importance: str = Field(
        "normal",
        description="중요도 (normal | high) - high면 품질 우선 모드 사용"
    )
    run_meeting_agent: bool = Field(
        False,
        description="트랜스크립션 완료 후 MeetingAgent 분석 자동 실행"
    )


class TranscribeResponse(BaseModel):
    """트랜스크립션 응답"""
    meeting_id: UUID4
    transcript_id: UUID4
    status: MeetingStatus
    transcript_text: str
    language: str
    duration: Optional[float]
    segments_count: int


# =============================================================================
# Meeting Analysis Schemas (MeetingAgent)
# =============================================================================

class MeetingSummaryInput(BaseModel):
    """회의 요약 입력 (MeetingAgent)"""
    transcript: str = Field(..., description="회의 트랜스크립트")
    meeting_title: Optional[str] = Field(None, description="회의 제목")
    meeting_date: Optional[datetime] = Field(None, description="회의 날짜")
    brand_context: Optional[str] = Field(None, description="브랜드 컨텍스트 (Brand DNA)")


class MeetingSummaryOutput(BaseModel):
    """회의 요약 출력 (MeetingAgent)"""
    summary: str = Field(..., description="회의 전체 요약")
    agenda: List[str] = Field(..., description="회의 안건 목록")
    decisions: List[str] = Field(..., description="결정 사항 목록")
    action_items: List[str] = Field(..., description="액션 아이템 목록")
    campaign_ideas: List[str] = Field(..., description="캠페인 아이디어 목록")
    analyzed_at: datetime = Field(default_factory=datetime.utcnow, description="분석 시각")
    analyzer_version: str = Field("v1.0", description="분석기 버전")

    class Config:
        json_schema_extra = {
            "example": {
                "summary": "2025년 봄 시즌 신제품 런칭 전략 회의. 타겟 고객층 20-30대 여성으로 설정하고, 인스타그램 중심의 소셜 미디어 캠페인을 계획함.",
                "agenda": [
                    "신제품 타겟 고객 분석",
                    "마케팅 채널 선정",
                    "예산 배분 논의"
                ],
                "decisions": [
                    "타겟 고객: 20-30대 여성",
                    "메인 채널: 인스타그램",
                    "예산: 5천만원"
                ],
                "action_items": [
                    "인플루언서 3명 섭외 (담당: 김마케팅, 기한: 12월 1일)",
                    "크리에이티브 시안 3개 제작 (담당: 박디자인, 기한: 12월 5일)"
                ],
                "campaign_ideas": [
                    "인플루언서 언박싱 챌린지",
                    "고객 후기 이벤트",
                    "시즌 한정 할인 프로모션"
                ],
                "analyzed_at": "2025-11-24T14:30:00Z",
                "analyzer_version": "v1.0"
            }
        }


# =============================================================================
# Meeting to Brief Schemas
# =============================================================================

class MeetingToBriefInput(BaseModel):
    """회의 → 브리프 변환 입력"""
    meeting_summary: Dict[str, Any] = Field(..., description="MeetingAgent 분석 결과")
    brand_context: Optional[str] = Field(None, description="브랜드 컨텍스트 (Brand DNA)")
    additional_context: Optional[str] = Field(None, description="추가 컨텍스트 (사용자 입력)")


class CampaignBriefOutput(BaseModel):
    """캠페인 브리프 출력"""
    brief_title: str = Field(..., description="브리프 제목")
    objective: str = Field(..., description="마케팅 목표")
    target_audience: str = Field(..., description="타겟 고객")
    key_messages: List[str] = Field(..., description="핵심 메시지 (3-5개)")
    channels: List[str] = Field(..., description="마케팅 채널")
    timeline: Optional[str] = Field(None, description="일정/타임라인")
    budget: Optional[str] = Field(None, description="예산")
    deliverables: List[str] = Field(..., description="산출물 목록")
    constraints: Optional[List[str]] = Field(None, description="제약사항")
    success_metrics: Optional[List[str]] = Field(None, description="성공 지표")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="생성 시각")

    class Config:
        json_schema_extra = {
            "example": {
                "brief_title": "2025 봄 시즌 신제품 런칭 캠페인",
                "objective": "20-30대 여성을 타겟으로 신제품 인지도 확보 및 초기 구매 유도",
                "target_audience": "20-30대 여성, 인스타그램/틱톡 활성 사용자, 트렌디한 제품에 관심 있는 얼리어답터",
                "key_messages": [
                    "혁신적인 신제품으로 새로운 경험 제공",
                    "20-30대 여성의 라이프스타일에 최적화",
                    "프리미엄 품질, 합리적인 가격"
                ],
                "channels": ["인스타그램", "틱톡", "인플루언서 협업"],
                "timeline": "2025년 12월 ~ 2026년 2월 (3개월)",
                "budget": "5천만원 (인플루언서 3천, 광고 2천)",
                "deliverables": [
                    "인플루언서 언박싱 영상 3편",
                    "소셜 미디어 광고 크리에이티브 10종",
                    "제품 상세페이지",
                    "이벤트 랜딩페이지"
                ],
                "constraints": ["12월 1일까지 인플루언서 섭외 완료", "브랜드 톤앤매너 준수"],
                "success_metrics": ["월 신규 고객 1,000명", "SNS 인게이지먼트 5% 이상", "전환율 3% 이상"],
                "created_at": "2025-11-24T15:00:00Z"
            }
        }


# =============================================================================
# Upload Response
# =============================================================================

class MeetingUploadResponse(BaseModel):
    """회의 파일 업로드 응답"""
    meeting_id: UUID4
    upload_url: str = Field(..., description="파일 업로드 URL (presigned URL)")
    file_key: str = Field(..., description="MinIO 파일 키")
    expires_in: int = Field(..., description="URL 만료 시간 (초)")


# =============================================================================
# From URL Request/Response
# =============================================================================

class MeetingFromURLRequest(BaseModel):
    """URL로부터 회의 생성 요청"""
    url: str = Field(..., description="YouTube URL 또는 웹 URL")
    title: Optional[str] = Field(None, description="회의 제목 (자동 생성 가능)")
    description: Optional[str] = Field(None, description="회의 설명")
    brand_id: Optional[UUID4] = Field(None, description="브랜드 ID")
    project_id: Optional[UUID4] = Field(None, description="프로젝트 ID")
    auto_transcribe: bool = Field(True, description="자동 트랜스크립션 실행")


class MeetingFromURLResponse(BaseModel):
    """URL로부터 회의 생성 응답"""
    meeting_id: UUID4
    status: MeetingStatus
    message: str
    transcription_started: bool = Field(False, description="트랜스크립션 시작 여부")
