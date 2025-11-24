"""
Product Detail Generator Schemas

상품 상세페이지 생성을 위한 스키마

작성일: 2025-11-24
작성자: B팀 (Backend)
참조: SPARKLIO_MVP_MASTER_TRACKER.md - P1 Multi-Channel Generator
"""

from pydantic import BaseModel, Field, UUID4
from typing import Optional, List, Dict, Any
from datetime import datetime


# =============================================================================
# Product Detail Input Schemas
# =============================================================================

class ProductDetailFullInput(BaseModel):
    """
    상품 상세페이지 생성 입력

    CopywriterAgent 확장: Task `product_detail_full`
    Output: Hero + Problem/Solution + Specs + FAQ 카드 구성 (Canvas JSON)
    """
    product_name: str = Field(..., description="상품명")
    product_category: Optional[str] = Field(None, description="상품 카테고리 (예: 전자제품, 의류)")

    # 핵심 정보
    key_features: List[str] = Field(..., min_length=1, description="핵심 기능/특징 (3-5개)")
    target_audience: Optional[str] = Field(None, description="타겟 고객 (예: 20-30대 직장인)")
    price: Optional[str] = Field(None, description="가격 정보 (예: 89,000원)")

    # 컨텍스트
    brand_context: Optional[str] = Field(None, description="브랜드 DNA (톤앤매너, 가이드라인)")
    product_description: Optional[str] = Field(None, description="상품 설명/배경")

    # 문제-해결 구조
    customer_pain_points: Optional[List[str]] = Field(None, description="고객 문제점 (2-3개)")
    solutions: Optional[List[str]] = Field(None, description="솔루션 (key_features 기반 자동 생성 가능)")

    # 스펙
    specifications: Optional[Dict[str, str]] = Field(None, description="제품 스펙 (예: {'크기': '10cm x 5cm', '무게': '200g'})")

    # FAQ
    faqs: Optional[List[Dict[str, str]]] = Field(None, description="FAQ (예: [{'question': 'Q1', 'answer': 'A1'}])")

    # 이미지
    hero_image_url: Optional[str] = Field(None, description="히어로 이미지 URL")
    additional_image_urls: Optional[List[str]] = Field(None, description="추가 이미지 URLs")

    # 옵션
    tone: Optional[str] = Field("professional", description="톤앤매너 (professional, friendly, luxury)")
    language: str = Field("ko", description="언어 코드 (ko, en)")


# =============================================================================
# Product Detail Output Structure (Canvas JSON 구조 명세)
# =============================================================================

class HeroCardContent(BaseModel):
    """히어로 카드 콘텐츠"""
    headline: str = Field(..., description="메인 헤드라인 (10-20자)")
    subheadline: str = Field(..., description="서브 헤드라인 (30-50자)")
    cta: str = Field(..., description="행동 유도 버튼 텍스트 (10자 이내)")
    image_url: Optional[str] = Field(None, description="히어로 이미지 URL")


class ProblemSolutionCardContent(BaseModel):
    """문제-솔루션 카드 콘텐츠"""
    section_title: str = Field(..., description="섹션 제목 (예: '이런 고민 있으신가요?')")
    problems: List[str] = Field(..., min_length=2, max_length=3, description="고객 문제점 (2-3개)")
    solution_title: str = Field(..., description="솔루션 제목 (예: 'OO가 해결해드립니다')")
    solutions: List[str] = Field(..., min_length=2, max_length=5, description="솔루션 설명 (2-5개)")


class SpecsCardContent(BaseModel):
    """스펙 카드 콘텐츠"""
    section_title: str = Field(..., description="섹션 제목 (예: '제품 사양')")
    specs: Dict[str, str] = Field(..., description="스펙 Key-Value (예: {'크기': '10cm x 5cm'})")


class FAQItem(BaseModel):
    """FAQ 항목"""
    question: str = Field(..., description="질문")
    answer: str = Field(..., description="답변")


class FAQCardContent(BaseModel):
    """FAQ 카드 콘텐츠"""
    section_title: str = Field(..., description="섹션 제목 (예: '자주 묻는 질문')")
    faqs: List[FAQItem] = Field(..., min_length=3, max_length=8, description="FAQ 항목 (3-8개)")


class ProductDetailFullOutput(BaseModel):
    """
    상품 상세페이지 전체 출력

    Canvas JSON 구조로 변환되어 DocumentPayload로 반환됨
    """
    hero: HeroCardContent = Field(..., description="히어로 카드")
    problem_solution: ProblemSolutionCardContent = Field(..., description="문제-솔루션 카드")
    specs: SpecsCardContent = Field(..., description="스펙 카드")
    faq: FAQCardContent = Field(..., description="FAQ 카드")

    # 메타데이터
    generated_at: datetime = Field(default_factory=datetime.utcnow, description="생성 시각")
    tone: str = Field("professional", description="사용된 톤앤매너")
    language: str = Field("ko", description="생성 언어")

    class Config:
        json_schema_extra = {
            "example": {
                "hero": {
                    "headline": "혁신적인 무선 이어폰",
                    "subheadline": "24시간 배터리, 노이즈캔슬링으로 완벽한 사운드 경험",
                    "cta": "지금 구매하기",
                    "image_url": "https://example.com/hero.jpg"
                },
                "problem_solution": {
                    "section_title": "이런 고민 있으신가요?",
                    "problems": [
                        "출퇴근길 소음 때문에 음악이 잘 들리지 않아요",
                        "배터리가 금방 닳아서 불편해요",
                        "착용감이 불편해서 오래 쓰기 힘들어요"
                    ],
                    "solution_title": "AirPod Pro가 해결해드립니다",
                    "solutions": [
                        "액티브 노이즈캔슬링으로 주변 소음 99% 차단",
                        "24시간 초장시간 배터리로 하루 종일 사용 가능",
                        "인체공학적 디자인으로 편안한 착용감",
                        "IPX4 방수로 운동 중에도 안심",
                        "터치 컨트롤로 직관적인 조작"
                    ]
                },
                "specs": {
                    "section_title": "제품 사양",
                    "specs": {
                        "크기": "4.5cm x 2cm",
                        "무게": "5g (이어폰 1개)",
                        "배터리": "24시간 (케이스 포함)",
                        "방수 등급": "IPX4",
                        "연결": "블루투스 5.3",
                        "충전": "USB-C 고속충전"
                    }
                },
                "faq": {
                    "section_title": "자주 묻는 질문",
                    "faqs": [
                        {
                            "question": "배터리는 얼마나 사용할 수 있나요?",
                            "answer": "이어폰 단독으로 6시간, 충전 케이스 포함 24시간 사용 가능합니다."
                        },
                        {
                            "question": "노이즈캔슬링 효과는 어떤가요?",
                            "answer": "액티브 노이즈캔슬링(ANC) 기술로 주변 소음의 99%를 차단합니다."
                        },
                        {
                            "question": "방수 기능이 있나요?",
                            "answer": "IPX4 등급으로 땀과 가벼운 비에도 안심하고 사용 가능합니다."
                        },
                        {
                            "question": "어떤 기기와 호환되나요?",
                            "answer": "블루투스 5.3을 지원하는 모든 스마트폰, 태블릿, PC와 호환됩니다."
                        },
                        {
                            "question": "교환/환불 정책은 어떻게 되나요?",
                            "answer": "구매 후 14일 이내 무료 교환/환불이 가능합니다."
                        }
                    ]
                },
                "generated_at": "2025-11-24T15:00:00Z",
                "tone": "professional",
                "language": "ko"
            }
        }


# =============================================================================
# API Request/Response Schemas
# =============================================================================

class ProductDetailGenerateRequest(BaseModel):
    """상품 상세페이지 생성 요청"""
    product_input: ProductDetailFullInput = Field(..., description="상품 정보 입력")
    brand_id: Optional[UUID4] = Field(None, description="브랜드 ID (BrandKit 조회용)")
    project_id: Optional[UUID4] = Field(None, description="프로젝트 ID")

    # Canvas 옵션
    canvas_width: float = Field(1200, gt=0, description="Canvas 너비 (px)")
    include_images: bool = Field(True, description="이미지 포함 여부")


class ProductDetailGenerateResponse(BaseModel):
    """상품 상세페이지 생성 응답"""
    success: bool = Field(..., description="성공 여부")
    document_id: Optional[UUID4] = Field(None, description="생성된 Document ID")
    canvas_json: Optional[Dict[str, Any]] = Field(None, description="Canvas JSON (DocumentPayload)")
    content: Optional[ProductDetailFullOutput] = Field(None, description="생성된 콘텐츠 (원본)")
    error: Optional[str] = Field(None, description="에러 메시지")
    usage: Optional[Dict[str, Any]] = Field(None, description="사용량 (토큰, 시간)")
