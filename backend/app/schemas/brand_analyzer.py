"""
BrandAnalyzerAgent Pydantic Schemas

브랜드 분석 입출력 스키마 정의

작성일: 2025-11-24
작성자: B팀 (Backend)
참조: SPARKLIO_MVP_MASTER_TRACKER.md - P0-1 Brand OS Module
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any


# ==========================================
# Input Schemas
# ==========================================

class BrandDocumentInput(BaseModel):
    """브랜드 문서 입력 (분석용)"""
    type: str = Field(..., description="문서 타입 (pdf, image, text, url, brochure)")
    extracted_text: str = Field(..., description="추출된 텍스트 내용")
    title: Optional[str] = Field(None, description="문서 제목")


class BrandAnalysisInputV1(BaseModel):
    """
    Brand DNA 생성 입력 스키마 v1

    브랜드 문서 분석 및 Brand DNA Card 생성에 필요한 입력
    """
    brand_name: str = Field(..., min_length=1, max_length=255, description="브랜드 이름")
    documents: List[BrandDocumentInput] = Field(..., min_items=1, description="분석할 문서 리스트 (최소 1개)")
    website_url: Optional[str] = Field(None, description="브랜드 웹사이트 URL")
    industry: Optional[str] = Field(None, max_length=100, description="산업/업종")
    existing_brand_kit: Optional[Dict[str, Any]] = Field(None, description="기존 Brand Kit (수정 시 사용)")


# ==========================================
# Output Schemas
# ==========================================

class BrandKitSuggestion(BaseModel):
    """Brand Kit 제안 스키마"""
    primary_colors: List[str] = Field(
        ...,
        min_items=1,
        max_items=3,
        description="주요 컬러 (HEX 코드)"
    )
    secondary_colors: List[str] = Field(
        ...,
        min_items=1,
        max_items=3,
        description="보조 컬러 (HEX 코드)"
    )
    fonts: Dict[str, str] = Field(
        ...,
        description="폰트 제안 (primary, secondary)"
    )
    tone_keywords: List[str] = Field(
        ...,
        min_items=3,
        max_items=5,
        description="톤 키워드"
    )
    forbidden_expressions: List[str] = Field(
        ...,
        min_items=3,
        max_items=10,
        description="사용 금지 표현"
    )


class BrandDNAOutputV1(BaseModel):
    """
    Brand DNA Card 출력 스키마 v1

    BrandAnalyzerAgent가 생성하는 Brand DNA Card
    """
    tone: str = Field(
        ...,
        min_length=50,
        max_length=200,
        description="브랜드 톤앤매너 (구체적으로)"
    )
    key_messages: List[str] = Field(
        ...,
        min_items=3,
        max_items=5,
        description="핵심 메시지 (각 10-50자)"
    )
    target_audience: str = Field(
        ...,
        min_length=50,
        max_length=300,
        description="타겟 오디언스 페르소나 (상세하게)"
    )
    dos: List[str] = Field(
        ...,
        min_items=3,
        max_items=5,
        description="Dos 리스트 (각 10-100자)"
    )
    donts: List[str] = Field(
        ...,
        min_items=3,
        max_items=5,
        description="Don'ts 리스트 (각 10-100자)"
    )
    sample_copies: List[str] = Field(
        ...,
        min_items=3,
        max_items=5,
        description="샘플 카피 (각 20-100자)"
    )
    suggested_brand_kit: BrandKitSuggestion = Field(
        ...,
        description="제안된 Brand Kit"
    )
    confidence_score: float = Field(
        ...,
        ge=0.0,
        le=10.0,
        description="분석 신뢰도 (0-10)"
    )
    analysis_notes: Optional[str] = Field(
        None,
        max_length=500,
        description="분석 노트 (추가 인사이트)"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "tone": "진정성 있고 따뜻한 톤, 환경 문제에 대한 진지함과 일상 속 실천 가능성을 동시에 전달",
                "key_messages": [
                    "지속 가능한 내일을 위한 오늘의 선택",
                    "품질과 환경, 두 마리 토끼를 모두 잡다",
                    "작은 실천이 만드는 큰 변화"
                ],
                "target_audience": "환경 문제에 관심이 많은 2030 밀레니얼/Z세대, 윤리적 소비를 실천하며 일상 속 작은 변화를 중시하는 라이프스타일",
                "dos": [
                    "환경 문제에 대한 진정성 있는 메시지 전달",
                    "실제 사용 가능한 구체적인 실천 방법 제시",
                    "제품의 친환경 인증, 소재 정보를 투명하게 공개"
                ],
                "donts": [
                    "과도한 환경 보호 주장으로 부담감 주기",
                    "비현실적이거나 극단적인 제안",
                    "그린워싱으로 의심받을 수 있는 과장 광고"
                ],
                "sample_copies": [
                    "오늘 하나, 내일의 지구를 위한 작은 실천",
                    "품질은 타협하지 않습니다. 환경도 마찬가지로.",
                    "일상이 바뀌면 지구가 바뀝니다"
                ],
                "suggested_brand_kit": {
                    "primary_colors": ["#2E7D32", "#66BB6A"],
                    "secondary_colors": ["#F5F5F5", "#8D6E63"],
                    "fonts": {
                        "primary": "Montserrat",
                        "secondary": "Noto Sans KR"
                    },
                    "tone_keywords": ["진정성", "따뜻함", "실천", "지속가능"],
                    "forbidden_expressions": ["완벽한", "100%", "절대"]
                },
                "confidence_score": 8.5,
                "analysis_notes": "브랜드 문서 2개 분석 완료. 추가 문서가 있으면 더 정확한 분석 가능"
            }
        }
