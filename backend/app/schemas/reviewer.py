"""
Reviewer Agent Pydantic Schemas

ad_copy_quality_check Task의 입출력 스키마 정의

작성일: 2025-11-23
작성자: B팀 (Backend)
참조: B_TEAM_NEXT_STEPS_2025-11-23.md
"""

from typing import List, Optional, Dict, Any, Literal
from pydantic import BaseModel, Field, field_validator


# ============================================================================
# Input Schema
# ============================================================================

class AdCopyReviewInputV1(BaseModel):
    """
    광고 카피 리뷰 입력 스키마

    Copywriter/Strategist 출력을 입력받아 품질 검토
    """

    original_copy: Dict[str, Any] = Field(
        ...,
        description="리뷰할 원본 카피 (ProductDetailOutput, AdCopySimpleOutputV2 등)",
        examples=[{
            "headline": "소음은 지우고, 음악만 남기다",
            "subheadline": "24시간 배터리, ANC 노이즈캔슬링",
            "body": "프리미엄 무선 이어폰의 새로운 기준",
            "bullets": ["ANC 노이즈캔슬링", "24시간 배터리", "IPX7 방수"],
            "cta": "지금 체험하기"
        }]
    )

    campaign_context: Optional[Dict[str, Any]] = Field(
        default=None,
        description="캠페인 컨텍스트 (브랜드, 타겟, 목표 등)",
        examples=[{
            "brand_name": "SoundPro",
            "target_audience": "2030 직장인",
            "tone": "professional",
            "campaign_objective": "신제품 런칭"
        }]
    )

    review_criteria: Optional[List[str]] = Field(
        default=None,
        description="특정 검토 기준 강조 (tone, clarity, persuasiveness 등)",
        examples=[["tone", "clarity", "brand_alignment"]]
    )

    strict_mode: bool = Field(
        default=False,
        description="엄격 모드 (90% 이상 필요, 기본 False)"
    )


# ============================================================================
# Output Schema
# ============================================================================

class AdCopyReviewOutputV1(BaseModel):
    """
    광고 카피 리뷰 출력 스키마

    사람 마케터가 카피를 보고 줄 법한 리뷰를 구조화
    """

    # ========================================
    # 점수 (0-10)
    # ========================================

    overall_score: float = Field(
        ...,
        ge=0.0,
        le=10.0,
        description="전체 품질 점수 (0-10)",
        examples=[8.5]
    )

    tone_match_score: float = Field(
        ...,
        ge=0.0,
        le=10.0,
        description="요청 톤과의 일치도 (0-10)",
        examples=[9.0]
    )

    clarity_score: float = Field(
        ...,
        ge=0.0,
        le=10.0,
        description="명확성 점수 (0-10)",
        examples=[8.0]
    )

    persuasiveness_score: float = Field(
        ...,
        ge=0.0,
        le=10.0,
        description="설득력 점수 (0-10)",
        examples=[8.5]
    )

    brand_alignment_score: float = Field(
        ...,
        ge=0.0,
        le=10.0,
        description="브랜드 정렬도 (0-10)",
        examples=[9.0]
    )

    # ========================================
    # 정성 평가
    # ========================================

    strengths: List[str] = Field(
        ...,
        min_items=1,
        max_items=5,
        description="강점 (1-5개, 각 10-150자)",
        examples=[[
            "Headline이 임팩트 있고 제품 핵심 가치를 잘 전달",
            "CTA가 명확하고 행동 유도가 강함",
            "Bullets가 주요 특징을 간결하게 정리"
        ]]
    )

    weaknesses: List[str] = Field(
        ...,
        min_items=1,
        max_items=5,
        description="약점 (1-5개, 각 10-150자)",
        examples=[[
            "Subheadline이 스펙 나열형으로 차별화 부족",
            "Body가 너무 짧아 제품 스토리 전달 미흡"
        ]]
    )

    improvement_suggestions: List[str] = Field(
        ...,
        min_items=1,
        max_items=5,
        description="구체적 개선 제안 (1-5개, 각 10-200자)",
        examples=[[
            "Subheadline을 '하루 종일 끊김 없는 몰입, 당신의 음악 세계'처럼 감성적으로 변경",
            "Body에 사용자 경험 스토리 추가 (예: '출퇴근길이 나만의 콘서트홀로')",
            "Bullets 중 하나를 차별점으로 교체 (예: '프리미엄 사운드 튜닝')"
        ]]
    )

    # ========================================
    # 리스크 플래그
    # ========================================

    risk_flags: List[str] = Field(
        default=[],
        max_items=10,
        description="리스크 요인 (규제/과장/톤 오류 등, 0-10개, 각 10-100자)",
        examples=[[
            "Subheadline '24시간 배터리'는 실제 사용 시간과 다를 수 있어 과대광고 우려",
            "IPX7 방수 등급 표기 시 사용 조건 명시 필요 (방송통신심의위원회)"
        ]]
    )

    # ========================================
    # 종합 판정
    # ========================================

    approval_status: Literal["approved", "needs_revision", "rejected"] = Field(
        ...,
        description="승인 상태 (approved: 승인, needs_revision: 수정 필요, rejected: 재작성 필요)",
        examples=["approved"]
    )

    revision_priority: Literal["low", "medium", "high", "critical"] = Field(
        ...,
        description="수정 우선순위 (low: 낮음, medium: 중간, high: 높음, critical: 긴급)",
        examples=["medium"]
    )

    approval_reason: Optional[str] = Field(
        default=None,
        max_length=200,
        description="승인/거부 사유 (10-200자)",
        examples=["전반적인 품질이 우수하나 Subheadline 개선 후 최종 승인 권장"]
    )

    # ========================================
    # Validators
    # ========================================

    @field_validator("strengths", "weaknesses", "improvement_suggestions")
    @classmethod
    def validate_text_items(cls, v: List[str], info) -> List[str]:
        """각 항목의 길이 검증"""
        field_name = info.field_name

        min_length = 10
        max_length = 150 if field_name in ["strengths", "weaknesses"] else 200

        for item in v:
            if len(item) < min_length:
                raise ValueError(f"{field_name} item too short (min {min_length} chars): {item}")
            if len(item) > max_length:
                raise ValueError(f"{field_name} item too long (max {max_length} chars): {item[:50]}...")

        return v

    @field_validator("risk_flags")
    @classmethod
    def validate_risk_flags(cls, v: List[str]) -> List[str]:
        """리스크 플래그 길이 검증"""
        for flag in v:
            if len(flag) > 100:
                raise ValueError(f"Risk flag too long (max 100 chars): {flag[:50]}...")
        return v

    @field_validator("approval_status", mode="after")
    @classmethod
    def validate_approval_logic(cls, v: str, info) -> str:
        """승인 상태 로직 검증"""
        # overall_score와 approval_status 일관성 체크
        # (이 validator는 전체 모델이 구성된 후 실행됨)
        data = info.data
        overall_score = data.get("overall_score", 0.0)

        if v == "approved" and overall_score < 7.0:
            raise ValueError(f"Cannot approve with overall_score {overall_score} < 7.0")
        elif v == "rejected" and overall_score >= 7.0:
            raise ValueError(f"Cannot reject with overall_score {overall_score} >= 7.0")

        return v


# ============================================================================
# Convenience Types (Optional)
# ============================================================================

# 리뷰 타입별 별칭 (추후 확장 시)
ContentReviewInputV1 = AdCopyReviewInputV1  # 일반 콘텐츠 리뷰
BrandComplianceInputV1 = AdCopyReviewInputV1  # 브랜드 가이드라인 준수

ContentReviewOutputV1 = AdCopyReviewOutputV1
BrandComplianceOutputV1 = AdCopyReviewOutputV1
