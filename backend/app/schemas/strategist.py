"""
Strategist Agent Pydantic Schemas

campaign_strategy Task의 입출력 스키마 정의

작성일: 2025-11-23
작성자: B팀 (Backend)
참조: TASK_SCHEMA_CATALOG_V2.md, Golden Set v1.0
"""

from typing import List, Optional
from pydantic import BaseModel, Field, field_validator


# ============================================================================
# Input Schema
# ============================================================================

class CampaignStrategyInputV1(BaseModel):
    """
    campaign_strategy Task 입력 스키마

    Golden Set 기준:
    - brand_name: 브랜드명 (필수)
    - product_category: 제품 카테고리 (필수)
    - target_audience: 타겟 고객 (필수)
    - campaign_objective: 캠페인 목표 (필수)
    - budget_range: 예산 범위 (필수)
    - tone: 톤앤매너 (선택, 기본값: "professional")
    - brand_values: 브랜드 가치 (선택)
    - key_messages: 핵심 메시지 (선택)
    - competitor_info: 경쟁사 정보 (선택)
    - channel_preferences: 선호 채널 (선택)
    """

    brand_name: str = Field(
        ...,
        min_length=1,
        max_length=100,
        description="브랜드명",
        examples=["루나 스킨케어", "제타 워크스테이션"]
    )

    product_category: str = Field(
        ...,
        min_length=1,
        max_length=200,
        description="제품 카테고리",
        examples=["프리미엄 안티에이징 세럼", "고성능 워크스테이션 PC"]
    )

    target_audience: str = Field(
        ...,
        min_length=1,
        max_length=300,
        description="타겟 고객",
        examples=["25-35세 직장인 여성, 피부 노화 고민", "3D 디자이너, 영상 편집자 (25-40세)"]
    )

    campaign_objective: str = Field(
        ...,
        min_length=1,
        max_length=300,
        description="캠페인 목표",
        examples=["신제품 런칭, 첫 달 매출 5000만원", "브랜드 인지도 확산, 첫 분기 판매 100대"]
    )

    budget_range: str = Field(
        ...,
        min_length=1,
        max_length=100,
        description="예산 범위",
        examples=["1억원", "5000만원", "3억원"]
    )

    tone: str = Field(
        default="professional",
        description="톤앤매너",
        examples=["luxury", "professional", "friendly", "casual"]
    )

    brand_values: Optional[List[str]] = Field(
        default=None,
        description="브랜드 핵심 가치",
        examples=[["과학적 접근", "지속가능성", "우아함"], ["성능", "안정성", "생산성"]]
    )

    key_messages: Optional[List[str]] = Field(
        default=None,
        description="핵심 메시지",
        examples=[["아침 식사 대용", "단백질 20g", "5가지 맛"]]
    )

    competitor_info: Optional[str] = Field(
        default=None,
        max_length=500,
        description="경쟁사 정보",
        examples=["맥 프로, 델 프리시전 등 경쟁", "파타고니아, 에코알프 등"]
    )

    channel_preferences: Optional[List[str]] = Field(
        default=None,
        description="선호 마케팅 채널",
        examples=[["인스타그램", "네이버 블로그", "유튜브"], ["링크드인", "유튜브", "웨비나"]]
    )

    @field_validator("tone")
    @classmethod
    def validate_tone(cls, v: str) -> str:
        """톤앤매너 검증"""
        allowed_tones = ["luxury", "professional", "friendly", "casual", "energetic"]
        if v not in allowed_tones:
            raise ValueError(f"tone must be one of {allowed_tones}")
        return v


# ============================================================================
# Output Schema (Nested Models)
# ============================================================================

class StrategicPillar(BaseModel):
    """전략 기둥 (Strategic Pillar)"""

    title: str = Field(
        ...,
        min_length=5,
        max_length=50,
        description="전략 기둥 제목",
        examples=["과학적 신뢰 구축", "성능 벤치마크 투명 공개"]
    )

    description: str = Field(
        ...,
        min_length=20,
        max_length=200,
        description="전략 설명",
        examples=["임상 데이터와 피부과 전문의 추천으로 제품의 효능을 객관적으로 입증"]
    )

    key_actions: List[str] = Field(
        ...,
        min_items=2,
        max_items=5,
        description="핵심 실행 방안",
        examples=[["Before/After 임상 결과 인포그래픽", "피부과 전문의 인터뷰 콘텐츠"]]
    )

    @field_validator("key_actions")
    @classmethod
    def validate_key_actions(cls, v: List[str]) -> List[str]:
        """각 액션의 길이 검증"""
        for action in v:
            if len(action) < 5 or len(action) > 100:
                raise ValueError("Each key_action must be between 5-100 characters")
        return v


class ChannelStrategy(BaseModel):
    """채널별 전략"""

    channel: str = Field(
        ...,
        min_length=2,
        max_length=50,
        description="채널명",
        examples=["인스타그램", "유튜브", "네이버 블로그", "링크드인", "틱톡"]
    )

    objective: str = Field(
        ...,
        min_length=10,
        max_length=200,
        description="채널 목표",
        examples=["브랜드 인지도 확산 및 제품 체험 유도", "제품 성능 입증 및 타겟 직접 도달"]
    )

    content_types: List[str] = Field(
        ...,
        min_items=1,
        max_items=10,
        description="콘텐츠 유형",
        examples=[["릴스 (Before/After 타임랩스)", "피드 (임상 데이터 인포그래픽)"]]
    )

    kpi: str = Field(
        ...,
        min_length=10,
        max_length=300,
        description="핵심 성과 지표",
        examples=["팔로워 증가율 30%, 릴스 조회수 10만+, 저장률 8%"]
    )


class FunnelStructure(BaseModel):
    """마케팅 퍼널 구조"""

    awareness: List[str] = Field(
        ...,
        min_items=1,
        max_items=10,
        description="인지 단계 전술",
        examples=[["인스타그램 릴스 광고 (Before/After)", "유튜브 쇼츠 (7일의 기적)"]]
    )

    consideration: List[str] = Field(
        ...,
        min_items=1,
        max_items=10,
        description="고려 단계 전술",
        examples=[["블로그 성분 분석 포스팅", "인스타그램 피드 (임상 데이터)"]]
    )

    conversion: List[str] = Field(
        ...,
        min_items=1,
        max_items=10,
        description="전환 단계 전술",
        examples=[["인스타그램 스토리 체험단 모집", "랜딩 페이지 (첫 구매 할인)"]]
    )

    retention: List[str] = Field(
        ...,
        min_items=1,
        max_items=10,
        description="유지 단계 전술",
        examples=[["이메일 뉴스레터 (피부 관리 팁)", "재구매 할인 쿠폰"]]
    )


# ============================================================================
# Main Output Schema
# ============================================================================

class CampaignStrategyOutputV1(BaseModel):
    """
    campaign_strategy Task 출력 스키마

    Golden Set 기준 필드:
    - core_message: 핵심 메시지 (20-100자)
    - positioning: 포지셔닝 (20-150자)
    - target_insights: 타겟 인사이트 (3-5개, 각 20-150자)
    - big_idea: 빅 아이디어 (15-100자)
    - strategic_pillars: 전략 기둥 (2-3개)
    - channel_strategy: 채널별 전략 (2-5개)
    - funnel_structure: 퍼널 구조 (awareness/consideration/conversion/retention)
    - risk_factors: 리스크 요인 (1-5개, 각 20-200자)
    - success_metrics: 성공 지표 (3-8개, 각 10-100자)
    """

    core_message: str = Field(
        ...,
        min_length=20,
        max_length=100,
        description="캠페인 핵심 메시지",
        examples=[
            "과학이 만든 시간의 기적, 피부 본연의 빛을 되찾다",
            "창작의 속도를 높이는 절대 성능, 제타 워크스테이션"
        ]
    )

    positioning: str = Field(
        ...,
        min_length=20,
        max_length=150,
        description="브랜드/제품 포지셔닝",
        examples=[
            "의학 연구 기반의 안티에이징 솔루션, 지속가능한 프리미엄 뷰티",
            "3D/영상 크리에이터를 위한 최적화된 워크플로우 솔루션"
        ]
    )

    target_insights: List[str] = Field(
        ...,
        min_items=3,
        max_items=5,
        description="타겟 고객 인사이트",
        examples=[[
            "직장인 여성은 피부 관리 시간이 부족하지만 효과는 확실히 보고 싶어 함",
            "화학 성분보다 임상 데이터를 신뢰하는 경향",
            "환경을 생각하는 소비를 가치 있게 여김"
        ]]
    )

    big_idea: str = Field(
        ...,
        min_length=15,
        max_length=100,
        description="캠페인 빅 아이디어",
        examples=[
            "타임 리버스: 피부 시계를 되돌리는 7일의 기적",
            "렌더링 기다림의 종말: 창작에만 집중하세요"
        ]
    )

    strategic_pillars: List[StrategicPillar] = Field(
        ...,
        min_items=2,
        max_items=3,
        description="전략적 기둥 (2-3개)"
    )

    channel_strategy: List[ChannelStrategy] = Field(
        ...,
        min_items=2,
        max_items=5,
        description="채널별 전략 (2-5개)"
    )

    funnel_structure: FunnelStructure = Field(
        ...,
        description="마케팅 퍼널 구조 (AIDA 기반)"
    )

    risk_factors: List[str] = Field(
        ...,
        min_items=1,
        max_items=5,
        description="리스크 요인 및 대응 방안",
        examples=[[
            "고가 제품으로 인한 진입 장벽 (체험단/샘플 전략으로 대응)",
            "경쟁사의 유사 제품 및 프로모션 (차별화된 과학적 근거 강조)"
        ]]
    )

    success_metrics: List[str] = Field(
        ...,
        min_items=3,
        max_items=8,
        description="성공 지표 (KPI)",
        examples=[[
            "런칭 첫 달 매출 5000만원 달성",
            "인스타그램 도달률 50만+",
            "재구매율 25% (3개월 내)"
        ]]
    )

    @field_validator("target_insights")
    @classmethod
    def validate_target_insights(cls, v: List[str]) -> List[str]:
        """각 인사이트의 길이 검증"""
        for insight in v:
            if len(insight) < 20 or len(insight) > 150:
                raise ValueError("Each target_insight must be between 20-150 characters")
        return v

    @field_validator("risk_factors")
    @classmethod
    def validate_risk_factors(cls, v: List[str]) -> List[str]:
        """각 리스크의 길이 검증"""
        for risk in v:
            if len(risk) < 20 or len(risk) > 200:
                raise ValueError("Each risk_factor must be between 20-200 characters")
        return v

    @field_validator("success_metrics")
    @classmethod
    def validate_success_metrics(cls, v: List[str]) -> List[str]:
        """각 성공 지표의 길이 검증"""
        for metric in v:
            if len(metric) < 10 or len(metric) > 100:
                raise ValueError("Each success_metric must be between 10-100 characters")
        return v
