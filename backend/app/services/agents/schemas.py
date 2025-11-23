"""
Agent Schemas

모든 Agent가 사용하는 공통 스키마 정의

작성일: 2025-11-23
작성자: B팀 (Backend)
문서: Context Engineering Improvement Plan
"""

from typing import Dict, Any, Optional, List
from pydantic import BaseModel, Field


class EnhancedPayload(BaseModel):
    """
    모든 Agent가 사용하는 표준 Payload

    Context Engineering을 위한 메타 필드 포함
    """

    # =========================================================================
    # 기본 필드
    # =========================================================================
    language: str = Field(
        default="ko",
        description="응답 언어 (ko, en, ja 등)"
    )

    # =========================================================================
    # Context Engineering 필드 (LLM Gateway에서 활용)
    # =========================================================================
    _instructions: Optional[str] = Field(
        default=None,
        description="작업별 상세 지시사항 (System Prompt에 추가됨)"
    )

    _output_structure: Optional[Dict[str, str]] = Field(
        default=None,
        description="기대하는 출력 구조 설명"
    )

    _examples: Optional[List[Dict[str, Any]]] = Field(
        default=None,
        description="Few-shot Learning 예시"
    )

    _constraints: Optional[List[str]] = Field(
        default=None,
        description="추가 제약 조건 리스트"
    )

    _tone_guide: Optional[str] = Field(
        default=None,
        description="톤앤매너 가이드 (professional, friendly, luxury 등)"
    )

    _context: Optional[str] = Field(
        default=None,
        description="추가 컨텍스트 정보"
    )

    # =========================================================================
    # Agent별 커스텀 필드 (기존 payload 내용)
    # =========================================================================
    extra: Dict[str, Any] = Field(
        default_factory=dict,
        description="Agent별 커스텀 필드 (product_name, features, target_audience 등)"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "language": "ko",
                "_instructions": "제품의 핵심 가치와 차별점을 강조하여 매력적인 설명을 작성하세요.",
                "_output_structure": {
                    "headline": "임팩트 있는 헤드라인 (10자 이내)",
                    "body": "본문 설명 (100-200자)",
                    "cta": "행동 유도 문구 (15자 이내)"
                },
                "_constraints": [
                    "headline은 20자 이내",
                    "body는 80자 이내",
                    "bullets는 최대 3개"
                ],
                "_tone_guide": "전문적이고 신뢰감 있는 톤",
                "extra": {
                    "product_name": "무선 이어폰 Pro",
                    "features": ["노이즈캔슬링", "24시간 배터리"],
                    "target_audience": "2030 직장인"
                }
            }
        }

    @classmethod
    def from_dict(cls, payload: Dict[str, Any]) -> "EnhancedPayload":
        """
        일반 dict를 EnhancedPayload로 변환

        Args:
            payload: 일반 payload dict

        Returns:
            EnhancedPayload 인스턴스
        """
        # Context Engineering 필드 추출
        context_fields = {
            "language": payload.pop("language", "ko"),
            "_instructions": payload.pop("_instructions", None),
            "_output_structure": payload.pop("_output_structure", None),
            "_examples": payload.pop("_examples", None),
            "_constraints": payload.pop("_constraints", None),
            "_tone_guide": payload.pop("_tone_guide", None),
            "_context": payload.pop("_context", None),
        }

        # 나머지는 extra에 저장
        return cls(
            **context_fields,
            extra=payload
        )

    def to_dict(self) -> Dict[str, Any]:
        """
        EnhancedPayload를 일반 dict로 변환

        Returns:
            모든 필드가 포함된 dict
        """
        result = self.extra.copy()

        # 메타 필드 추가 (값이 있는 것만)
        if self.language != "ko":
            result["language"] = self.language

        if self._instructions:
            result["_instructions"] = self._instructions

        if self._output_structure:
            result["_output_structure"] = self._output_structure

        if self._examples:
            result["_examples"] = self._examples

        if self._constraints:
            result["_constraints"] = self._constraints

        if self._tone_guide:
            result["_tone_guide"] = self._tone_guide

        if self._context:
            result["_context"] = self._context

        return result


# =============================================================================
# Helper Functions
# =============================================================================

def enhance_payload(
    payload: Dict[str, Any],
    instructions: Optional[str] = None,
    output_structure: Optional[Dict[str, str]] = None,
    constraints: Optional[List[str]] = None,
    tone_guide: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Payload에 Context Engineering 필드 추가

    Args:
        payload: 원본 payload
        instructions: 작업 지시사항
        output_structure: 출력 구조
        constraints: 제약 조건
        tone_guide: 톤앤매너 가이드

    Returns:
        향상된 payload dict
    """
    enhanced = payload.copy()

    if instructions:
        enhanced["_instructions"] = instructions

    if output_structure:
        enhanced["_output_structure"] = output_structure

    if constraints:
        enhanced["_constraints"] = constraints

    if tone_guide:
        enhanced["_tone_guide"] = tone_guide

    return enhanced
