"""
Demo Day Schemas

데모 데이 API 요청/응답 스키마 정의

작성일: 2025-11-26
작성자: B팀 (Backend)
참조: B_TEAM_REVIEW_OF_C_TEAM_REPORT_2025-11-26.md
"""

from pydantic import BaseModel, Field, UUID4
from typing import Optional, List, Dict, Any, Literal
from datetime import datetime
from enum import Enum


# =============================================================================
# Enums
# =============================================================================

class DemoTaskStatus(str, Enum):
    """Demo Task 상태"""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class DemoAssetType(str, Enum):
    """에셋 유형"""
    PRESENTATION = "presentation"
    PRODUCT_DETAIL = "product_detail"
    INSTAGRAM_ADS = "instagram_ads"
    SHORTS_SCRIPT = "shorts_script"


class DemoAssetStatus(str, Enum):
    """에셋 상태"""
    PENDING = "pending"
    GENERATING = "generating"
    COMPLETED = "completed"
    FAILED = "failed"


# =============================================================================
# Meeting to Campaign Request/Response
# =============================================================================

class DemoCampaignOptions(BaseModel):
    """캠페인 생성 옵션"""
    concept_count: int = Field(
        default=3,
        ge=1,
        le=5,
        description="생성할 컨셉 수 (1-5)"
    )
    generate_assets: bool = Field(
        default=True,
        description="에셋 자동 생성 여부"
    )
    asset_types: List[DemoAssetType] = Field(
        default=[
            DemoAssetType.PRESENTATION,
            DemoAssetType.PRODUCT_DETAIL,
            DemoAssetType.INSTAGRAM_ADS,
            DemoAssetType.SHORTS_SCRIPT
        ],
        description="생성할 에셋 유형"
    )


class DemoCampaignRequest(BaseModel):
    """
    POST /api/v1/demo/meeting-to-campaign 요청

    회의 ID를 받아 캠페인 + 컨셉 + 에셋 생성
    """
    meeting_id: UUID4 = Field(..., description="분석할 회의 ID")
    options: Optional[DemoCampaignOptions] = Field(
        default_factory=DemoCampaignOptions,
        description="캠페인 생성 옵션"
    )


class DemoCampaignResponse(BaseModel):
    """
    POST /api/v1/demo/meeting-to-campaign 응답

    비동기 처리를 위한 Task ID 반환
    """
    task_id: str = Field(..., description="SSE 스트림용 Task ID")
    status: DemoTaskStatus = Field(
        default=DemoTaskStatus.PROCESSING,
        description="Task 상태"
    )
    message: str = Field(
        default="캠페인 생성이 시작되었습니다",
        description="상태 메시지"
    )


# =============================================================================
# SSE Event Schemas
# =============================================================================

class SSEProgressEvent(BaseModel):
    """SSE progress 이벤트 데이터"""
    step: str = Field(..., description="현재 단계 (예: 'analyzing_meeting')")
    progress: int = Field(..., ge=0, le=100, description="진행률 (0-100)")
    message: str = Field(..., description="사용자에게 표시할 메시지")
    details: Optional[Dict[str, Any]] = Field(None, description="추가 상세 정보")


class SSEConceptPreview(BaseModel):
    """SSE concept 이벤트용 컨셉 프리뷰"""
    concept_id: str = Field(..., description="컨셉 ID")
    concept_name: str = Field(..., description="컨셉 이름")
    key_message: str = Field(..., description="핵심 메시지")
    thumbnail_url: Optional[str] = Field(None, description="썸네일 URL")


class SSEConceptEvent(BaseModel):
    """SSE concept 이벤트 데이터 (컨셉 생성 완료 시)"""
    concepts: List[SSEConceptPreview] = Field(..., description="생성된 컨셉 목록")


class SSECompleteEvent(BaseModel):
    """SSE complete 이벤트 데이터"""
    campaign_id: str = Field(..., description="생성된 캠페인 ID")
    concept_count: int = Field(..., description="생성된 컨셉 수")
    redirect_url: str = Field(..., description="Concept Board로 이동할 URL")


class SSEErrorEvent(BaseModel):
    """SSE error 이벤트 데이터"""
    error_code: str = Field(..., description="에러 코드")
    message: str = Field(..., description="에러 메시지")
    recoverable: bool = Field(default=False, description="복구 가능 여부")


# =============================================================================
# Concept Board Schemas
# =============================================================================

class MeetingSummaryBrief(BaseModel):
    """회의 요약 (간략)"""
    title: str = Field(..., description="회의 제목")
    duration_minutes: Optional[int] = Field(None, description="회의 시간 (분)")
    participants: Optional[List[str]] = Field(None, description="참석자 목록")
    key_points: List[str] = Field(..., description="핵심 포인트")
    core_message: str = Field(..., description="핵심 메시지")


class AssetInfo(BaseModel):
    """에셋 정보"""
    id: str = Field(..., description="에셋 ID")
    status: DemoAssetStatus = Field(..., description="에셋 상태")
    preview_url: Optional[str] = Field(None, description="미리보기 URL")


class InstagramAdsInfo(BaseModel):
    """인스타그램 광고 에셋 정보"""
    id: str = Field(..., description="에셋 ID")
    status: DemoAssetStatus = Field(..., description="에셋 상태")
    count: int = Field(..., description="광고 수")
    preview_urls: Optional[List[str]] = Field(None, description="미리보기 URL 목록")


class ShortsScriptInfo(BaseModel):
    """숏폼 스크립트 에셋 정보"""
    id: str = Field(..., description="에셋 ID")
    status: DemoAssetStatus = Field(..., description="에셋 상태")
    duration_seconds: int = Field(..., description="영상 길이 (초)")


class ConceptAssets(BaseModel):
    """컨셉별 에셋 모음"""
    presentation: Optional[AssetInfo] = Field(None, description="발표자료")
    product_detail: Optional[AssetInfo] = Field(None, description="상세페이지")
    instagram_ads: Optional[InstagramAdsInfo] = Field(None, description="인스타 광고")
    shorts_script: Optional[ShortsScriptInfo] = Field(None, description="숏폼 스크립트")


class ConceptDetail(BaseModel):
    """컨셉 상세 정보"""
    concept_id: str = Field(..., description="컨셉 ID")
    concept_name: str = Field(..., description="컨셉 이름")
    concept_description: str = Field(..., description="컨셉 설명")
    target_audience: str = Field(..., description="타겟 고객")
    key_message: str = Field(..., description="핵심 메시지")
    tone_and_manner: str = Field(..., description="톤앤매너")
    visual_style: str = Field(..., description="비주얼 스타일")
    thumbnail_url: Optional[str] = Field(None, description="썸네일 URL")
    assets: ConceptAssets = Field(..., description="에셋 정보")


class ConceptBoardResponse(BaseModel):
    """
    GET /api/v1/demo/concept-board/{campaign_id} 응답

    캠페인 전체 정보 + 컨셉 목록 + 에셋 정보
    """
    campaign_id: str = Field(..., description="캠페인 ID")
    campaign_name: str = Field(..., description="캠페인 이름")
    status: DemoTaskStatus = Field(..., description="캠페인 상태")
    created_at: datetime = Field(..., description="생성 시각")
    meeting_summary: MeetingSummaryBrief = Field(..., description="회의 요약")
    concepts: List[ConceptDetail] = Field(..., description="컨셉 목록")


# =============================================================================
# Chat NextActions Schema
# =============================================================================

class NextAction(BaseModel):
    """Chat 응답의 다음 액션 버튼"""
    id: str = Field(..., description="액션 ID")
    label: str = Field(..., description="버튼 라벨")
    action_type: Literal["view_concept_board", "regenerate", "select_concept", "download"] = Field(
        ..., description="액션 유형"
    )
    payload: Dict[str, Any] = Field(..., description="액션 페이로드")
    variant: Literal["primary", "secondary", "outline"] = Field(
        default="primary",
        description="버튼 스타일"
    )


class ChatDemoResponse(BaseModel):
    """Demo용 Chat 응답 (NextActions 포함)"""
    message: str = Field(..., description="AI 응답 메시지")
    task_id: Optional[str] = Field(None, description="진행 중인 Task ID")
    campaign_id: Optional[str] = Field(None, description="생성된 캠페인 ID")
    next_actions: Optional[List[NextAction]] = Field(None, description="다음 액션 버튼")


# =============================================================================
# Asset Detail Schemas
# =============================================================================

# --- Presentation ---

class SlideElement(BaseModel):
    """슬라이드 요소"""
    type: str = Field(..., description="요소 유형 (logo, icon, image, text)")
    position: Optional[Dict[str, int]] = Field(None, description="위치 {x, y}")
    size: Optional[Dict[str, int]] = Field(None, description="크기 {width, height}")
    url: Optional[str] = Field(None, description="이미지 URL")
    name: Optional[str] = Field(None, description="아이콘 이름")


class PresentationSlide(BaseModel):
    """발표자료 슬라이드"""
    slide_number: int = Field(..., description="슬라이드 번호")
    slide_type: str = Field(..., description="슬라이드 유형 (cover, problem, solution, features, benefits, cta)")
    title: str = Field(..., description="슬라이드 제목")
    subtitle: Optional[str] = Field(None, description="부제목")
    content: Optional[Any] = Field(None, description="슬라이드 내용 (구조는 slide_type에 따라 다름)")
    background_image_url: Optional[str] = Field(None, description="배경 이미지 URL")
    elements: Optional[List[SlideElement]] = Field(None, description="슬라이드 요소")


class PresentationStyle(BaseModel):
    """발표자료 스타일"""
    primary_color: str = Field(..., description="주 색상")
    secondary_color: str = Field(..., description="보조 색상")
    font_family: str = Field(..., description="폰트")
    theme: str = Field(..., description="테마")


class PresentationAssetResponse(BaseModel):
    """GET /api/v1/assets/presentations/{id} 응답"""
    id: str = Field(..., description="에셋 ID")
    concept_id: str = Field(..., description="컨셉 ID")
    title: str = Field(..., description="발표자료 제목")
    status: DemoAssetStatus = Field(..., description="상태")
    created_at: datetime = Field(..., description="생성 시각")
    slides: List[PresentationSlide] = Field(..., description="슬라이드 목록")
    style: PresentationStyle = Field(..., description="스타일")
    export_formats: List[str] = Field(..., description="지원 포맷")
    download_url: str = Field(..., description="다운로드 URL")


# --- Product Detail ---

class ProductDetailSection(BaseModel):
    """상세페이지 섹션"""
    section_type: str = Field(..., description="섹션 유형")
    order: int = Field(..., description="순서")
    content: Dict[str, Any] = Field(..., description="섹션 내용")


class ProductDetailAssetResponse(BaseModel):
    """GET /api/v1/assets/product-details/{id} 응답"""
    id: str = Field(..., description="에셋 ID")
    concept_id: str = Field(..., description="컨셉 ID")
    title: str = Field(..., description="상세페이지 제목")
    status: DemoAssetStatus = Field(..., description="상태")
    created_at: datetime = Field(..., description="생성 시각")
    sections: List[ProductDetailSection] = Field(..., description="섹션 목록")
    style: PresentationStyle = Field(..., description="스타일")
    export_formats: List[str] = Field(..., description="지원 포맷")
    preview_url: str = Field(..., description="미리보기 URL")
    download_url: str = Field(..., description="다운로드 URL")


# --- Instagram Ads ---

class InstagramAdCreative(BaseModel):
    """인스타 광고 크리에이티브"""
    headline: str = Field(..., description="헤드라인")
    primary_text: str = Field(..., description="본문")
    cta_text: str = Field(..., description="CTA 텍스트")
    image_url: Optional[str] = Field(None, description="이미지 URL")
    image_prompt: str = Field(..., description="이미지 생성 프롬프트")
    cards: Optional[List[Dict[str, Any]]] = Field(None, description="캐러셀 카드 (캐러셀 유형일 때)")


class InstagramAd(BaseModel):
    """인스타 광고 단일 항목"""
    ad_id: str = Field(..., description="광고 ID")
    ad_type: str = Field(..., description="광고 유형 (single_image, carousel)")
    format: str = Field(..., description="포맷 (feed, story)")
    aspect_ratio: str = Field(..., description="비율")
    creative: InstagramAdCreative = Field(..., description="크리에이티브")
    specs: Dict[str, Any] = Field(..., description="스펙")


class InstagramAdsAssetResponse(BaseModel):
    """GET /api/v1/assets/instagram-ads/{concept_id} 응답"""
    id: str = Field(..., description="에셋 ID")
    concept_id: str = Field(..., description="컨셉 ID")
    title: str = Field(..., description="광고 세트 제목")
    status: DemoAssetStatus = Field(..., description="상태")
    created_at: datetime = Field(..., description="생성 시각")
    campaign_objective: str = Field(..., description="캠페인 목표")
    target_audience: Dict[str, Any] = Field(..., description="타겟 오디언스")
    ads: List[InstagramAd] = Field(..., description="광고 목록")
    hashtags: List[str] = Field(..., description="해시태그")
    style: Dict[str, Any] = Field(..., description="스타일")
    export_formats: List[str] = Field(..., description="지원 포맷")
    download_url: str = Field(..., description="다운로드 URL")


# --- Shorts Script ---

class ShortsScene(BaseModel):
    """숏폼 영상 씬"""
    scene_number: int = Field(..., description="씬 번호")
    start_time: float = Field(..., description="시작 시간 (초)")
    end_time: float = Field(..., description="종료 시간 (초)")
    duration_seconds: float = Field(..., description="씬 길이 (초)")
    narration: str = Field(..., description="나레이션")
    visual_description: str = Field(..., description="비주얼 설명")
    text_overlay: Optional[str] = Field(None, description="텍스트 오버레이")
    transition: str = Field(..., description="전환 효과")
    bgm_mood: str = Field(..., description="BGM 무드")


class ShortsAudioConfig(BaseModel):
    """숏폼 오디오 설정"""
    tts_voice: str = Field(..., description="TTS 음성")
    tts_provider: str = Field(..., description="TTS 프로바이더")
    bgm_track: str = Field(..., description="BGM 트랙")
    bgm_volume: float = Field(..., ge=0.0, le=1.0, description="BGM 볼륨")


class ShortsScriptAssetResponse(BaseModel):
    """GET /api/v1/assets/shorts-scripts/{id} 응답"""
    id: str = Field(..., description="에셋 ID")
    concept_id: str = Field(..., description="컨셉 ID")
    title: str = Field(..., description="스크립트 제목")
    status: DemoAssetStatus = Field(..., description="상태")
    created_at: datetime = Field(..., description="생성 시각")
    video_specs: Dict[str, Any] = Field(..., description="영상 스펙")
    hook: Dict[str, Any] = Field(..., description="훅 (오프닝)")
    scenes: List[ShortsScene] = Field(..., description="씬 목록")
    cta: Dict[str, Any] = Field(..., description="CTA")
    audio: ShortsAudioConfig = Field(..., description="오디오 설정")
    style: Dict[str, Any] = Field(..., description="스타일")
    export_formats: List[str] = Field(..., description="지원 포맷")
    preview_url: str = Field(..., description="미리보기 URL")
    download_url: str = Field(..., description="다운로드 URL")
