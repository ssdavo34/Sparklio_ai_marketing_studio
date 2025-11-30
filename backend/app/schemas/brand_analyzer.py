"""
BrandAnalyzerAgent Pydantic Schemas

브랜드 분석 입출력 스키마 정의 - V2 (Repomix 기준 풍부한 구조)

작성일: 2025-11-24
수정일: 2025-11-30
작성자: B팀 (Backend)
참조: SPARKLIO_MVP_MASTER_TRACKER.md - P0-1 Brand OS Module
변경사항: Repomix Brand DNA 분석 기준으로 스키마 확장
"""

from pydantic import BaseModel, Field, field_validator
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
# V2 Extended Output Schemas (Repomix 기준)
# ==========================================

class BrandCore(BaseModel):
    """브랜드 핵심 정체성 (Brand Core)"""
    one_liner: str = Field(
        ...,
        min_length=10,
        max_length=100,
        description="브랜드 한줄정의 (10-100자)",
        examples=["개발자 코드베이스를 AI가 이해할 수 있는 형태로 압축하는 도구"]
    )
    purpose: str = Field(
        ...,
        min_length=20,
        max_length=200,
        description="브랜드 존재 목적 (Why we exist)",
        examples=["AI와 개발자 간의 소통 장벽을 허물어 더 나은 코드 작성을 돕는다"]
    )
    promise: str = Field(
        ...,
        min_length=20,
        max_length=200,
        description="브랜드 약속 (What we promise)",
        examples=["복잡한 코드베이스도 하나의 파일로, 누구나 쉽게 AI와 협업할 수 있도록"]
    )
    personality: List[str] = Field(
        ...,
        min_items=3,
        max_items=6,
        description="브랜드 성격 키워드 (3-6개)",
        examples=[["실용적", "기술친화적", "간결함을 추구", "개발자 중심", "오픈소스 지향"]]
    )


class MessagePillar(BaseModel):
    """메시지 기둥 (Sub-message pillar)"""
    title: str = Field(
        ...,
        min_length=5,
        max_length=50,
        description="메시지 제목"
    )
    description: str = Field(
        ...,
        min_length=20,
        max_length=200,
        description="메시지 상세 설명"
    )


class MessageStructure(BaseModel):
    """핵심 메시지 구조"""
    main_message: str = Field(
        ...,
        min_length=10,
        max_length=100,
        description="메인 메시지 (한 문장 핵심)",
        examples=["코드를 AI가 이해하도록, Repomix가 해결합니다"]
    )
    sub_pillars: List[MessagePillar] = Field(
        ...,
        min_items=2,
        max_items=5,
        description="서브 메시지 기둥 (2-5개)"
    )


class ToneAndManner(BaseModel):
    """톤앤매너 상세 정의"""
    summary: str = Field(
        ...,
        min_length=30,
        max_length=200,
        description="톤앤매너 요약 설명",
        examples=["기술적이지만 친근하게, 전문성과 접근성의 균형"]
    )
    keywords: List[str] = Field(
        ...,
        min_items=4,
        max_items=8,
        description="톤 키워드 (4-8개)",
        examples=[["실용적", "직관적", "깔끔한", "개발자 친화적", "무겁지 않은", "신뢰감 있는"]]
    )
    voice_style: str = Field(
        ...,
        min_length=20,
        max_length=150,
        description="보이스 스타일 설명",
        examples=["기술 문서처럼 정확하되, 대화하듯 자연스럽게"]
    )


class TargetAudienceSegment(BaseModel):
    """타겟 오디언스 세그먼트"""
    segment_name: str = Field(
        ...,
        min_length=3,
        max_length=50,
        description="세그먼트 이름 (Primary/Secondary 등)"
    )
    description: str = Field(
        ...,
        min_length=30,
        max_length=300,
        description="세그먼트 상세 설명"
    )
    needs: List[str] = Field(
        ...,
        min_items=2,
        max_items=5,
        description="니즈/페인포인트 (2-5개)"
    )


class TargetAudience(BaseModel):
    """타겟 오디언스 (다중 세그먼트)"""
    primary: TargetAudienceSegment = Field(
        ...,
        description="주요 타겟 오디언스"
    )
    secondary: Optional[TargetAudienceSegment] = Field(
        None,
        description="보조 타겟 오디언스 (선택)"
    )


class BenefitLadder(BaseModel):
    """베네핏 래더 (Functional + Emotional)"""
    functional: List[str] = Field(
        ...,
        min_items=2,
        max_items=5,
        description="기능적 혜택 (2-5개)",
        examples=[["빠른 코드 분석", "AI 프롬프트 최적화", "대용량 코드베이스 처리"]]
    )
    emotional: List[str] = Field(
        ...,
        min_items=2,
        max_items=5,
        description="감성적 혜택 (2-5개)",
        examples=[["개발 생산성 향상의 뿌듯함", "AI와 협업하는 미래지향적 느낌", "복잡함에서 해방되는 안도감"]]
    )


class VisualDirection(BaseModel):
    """비주얼 방향성"""
    style_keywords: List[str] = Field(
        ...,
        min_items=3,
        max_items=6,
        description="비주얼 스타일 키워드 (3-6개)",
        examples=[["미니멀", "모노톤", "개발자 친화적", "다크모드 기반", "코드 에디터 느낌"]]
    )
    mood: str = Field(
        ...,
        min_length=20,
        max_length=150,
        description="전체적인 무드/분위기",
        examples=["개발자 IDE처럼 깔끔하고 집중력 있는 분위기"]
    )
    avoid: List[str] = Field(
        ...,
        min_items=2,
        max_items=5,
        description="피해야 할 비주얼 요소 (2-5개)",
        examples=[["과도한 그라데이션", "화려한 일러스트", "비즈니스맨 스톡 이미지"]]
    )


# ==========================================
# Output Schemas (V1 - Legacy, 호환성 유지)
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
    Brand DNA Card 출력 스키마 v1 (Legacy - 호환성 유지)

    BrandAnalyzerAgent가 생성하는 Brand DNA Card
    Note: V2로 마이그레이션 권장
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


# ==========================================
# Output Schemas V2 (Repomix 기준 풍부한 구조)
# ==========================================

class BrandDNAOutputV2(BaseModel):
    """
    Brand DNA Card 출력 스키마 v2 (Repomix 기준 풍부한 구조)

    BrandAnalyzerAgent가 생성하는 Brand DNA Card - 확장 버전
    GPT의 Repomix 브랜드 분석 품질을 기준으로 설계

    구조:
    1. brand_core: 브랜드 핵심 정체성 (한줄정의, Purpose, Promise, Personality)
    2. message_structure: 핵심 메시지 구조 (Main + Sub Pillars)
    3. tone_and_manner: 톤앤매너 상세 (Summary, Keywords, Voice Style)
    4. target_audience: 타겟 오디언스 (Primary/Secondary + Needs)
    5. benefit_ladder: 베네핏 래더 (Functional + Emotional)
    6. dos: 브랜드 Do's
    7. donts: 브랜드 Don'ts
    8. sample_copies: 샘플 카피
    9. visual_direction: 비주얼 방향성
    10. suggested_brand_kit: Brand Kit 제안
    """

    # 1. Brand Core
    brand_core: BrandCore = Field(
        ...,
        description="브랜드 핵심 정체성 (한줄정의, Purpose, Promise, Personality)"
    )

    # 2. Message Structure
    message_structure: MessageStructure = Field(
        ...,
        description="핵심 메시지 구조 (Main Message + Sub Pillars)"
    )

    # 3. Tone & Manner
    tone_and_manner: ToneAndManner = Field(
        ...,
        description="톤앤매너 상세 (Summary, Keywords, Voice Style)"
    )

    # 4. Target Audience
    target_audience: TargetAudience = Field(
        ...,
        description="타겟 오디언스 (Primary/Secondary + Needs)"
    )

    # 5. Benefit Ladder
    benefit_ladder: BenefitLadder = Field(
        ...,
        description="베네핏 래더 (Functional + Emotional)"
    )

    # 6. Do's
    dos: List[str] = Field(
        ...,
        min_items=3,
        max_items=7,
        description="브랜드 Do's 리스트 (3-7개, 각 10-100자)"
    )

    # 7. Don'ts
    donts: List[str] = Field(
        ...,
        min_items=3,
        max_items=7,
        description="브랜드 Don'ts 리스트 (3-7개, 각 10-100자)"
    )

    # 8. Sample Copies
    sample_copies: List[str] = Field(
        ...,
        min_items=3,
        max_items=5,
        description="샘플 카피 리스트 (3-5개, 각 20-100자)"
    )

    # 9. Visual Direction
    visual_direction: VisualDirection = Field(
        ...,
        description="비주얼 방향성 (Style Keywords, Mood, Avoid)"
    )

    # 10. Suggested Brand Kit
    suggested_brand_kit: BrandKitSuggestion = Field(
        ...,
        description="제안된 Brand Kit"
    )

    # Meta
    confidence_score: float = Field(
        ...,
        ge=0.0,
        le=10.0,
        description="분석 신뢰도 (0-10)"
    )

    analysis_notes: Optional[str] = Field(
        None,
        max_length=1000,
        description="분석 노트 (추가 인사이트, 500→1000자로 확장)"
    )

    @field_validator("dos", "donts")
    @classmethod
    def validate_list_items(cls, v: List[str]) -> List[str]:
        """각 항목의 길이 검증"""
        for item in v:
            if len(item) < 10 or len(item) > 100:
                raise ValueError("Each item must be between 10-100 characters")
        return v

    class Config:
        json_schema_extra = {
            "example": {
                "brand_core": {
                    "one_liner": "개발자 코드베이스를 AI가 이해할 수 있는 형태로 압축하는 도구",
                    "purpose": "AI와 개발자 간의 소통 장벽을 허물어 더 나은 코드 작성을 돕는다",
                    "promise": "복잡한 코드베이스도 하나의 파일로, 누구나 쉽게 AI와 협업할 수 있도록",
                    "personality": ["실용적", "기술친화적", "간결함을 추구", "개발자 중심", "오픈소스 지향"]
                },
                "message_structure": {
                    "main_message": "코드를 AI가 이해하도록, Repomix가 해결합니다",
                    "sub_pillars": [
                        {
                            "title": "간편한 통합",
                            "description": "복잡한 레포지토리 구조를 단일 파일로 변환하여 AI 프롬프트에 즉시 활용"
                        },
                        {
                            "title": "개발자 친화적",
                            "description": "CLI 기반의 직관적인 사용법으로 기존 워크플로우에 자연스럽게 통합"
                        },
                        {
                            "title": "오픈소스 투명성",
                            "description": "누구나 기여할 수 있는 오픈소스 프로젝트로 지속적인 개선과 신뢰 확보"
                        }
                    ]
                },
                "tone_and_manner": {
                    "summary": "기술적이지만 친근하게, 전문성과 접근성의 균형을 유지하는 실용적 커뮤니케이션",
                    "keywords": ["실용적", "직관적", "깔끔한", "개발자 친화적", "무겁지 않은", "신뢰감 있는"],
                    "voice_style": "기술 문서처럼 정확하되, 대화하듯 자연스럽게"
                },
                "target_audience": {
                    "primary": {
                        "segment_name": "AI 협업 개발자",
                        "description": "Claude, GPT 등 AI를 코딩 파트너로 활용하는 개발자. 대규모 코드베이스를 AI에게 설명하는 데 어려움을 겪음",
                        "needs": [
                            "코드베이스 전체 맥락을 AI에게 효율적으로 전달",
                            "반복적인 복사-붙여넣기 작업 최소화",
                            "토큰 제한 내에서 최대한 많은 정보 전달"
                        ]
                    },
                    "secondary": {
                        "segment_name": "오픈소스 컨트리뷰터",
                        "description": "오픈소스 프로젝트에 기여하고자 하는 개발자. 새로운 코드베이스 이해에 시간이 많이 소요됨",
                        "needs": [
                            "새로운 프로젝트 구조 빠르게 파악",
                            "코드 리뷰 시 전체 맥락 이해",
                            "문서화되지 않은 코드 분석"
                        ]
                    }
                },
                "benefit_ladder": {
                    "functional": [
                        "복잡한 레포를 단일 파일로 변환",
                        "AI 프롬프트 토큰 효율 최적화",
                        "CLI 한 줄로 즉시 사용 가능",
                        "다양한 출력 포맷 지원 (XML, Markdown 등)"
                    ],
                    "emotional": [
                        "AI와 진짜 협업하는 느낌",
                        "복잡한 코드도 두렵지 않은 자신감",
                        "개발 생산성 향상의 뿌듯함",
                        "오픈소스 커뮤니티의 일원이라는 소속감"
                    ]
                },
                "dos": [
                    "기술적 정확성을 유지하되 쉽게 설명하기",
                    "개발자의 실제 워크플로우를 중심으로 소통하기",
                    "오픈소스 정신과 커뮤니티 기여 강조하기",
                    "실용적인 예시와 코드 스니펫 제공하기",
                    "CLI 도구의 간편함과 효율성 부각하기"
                ],
                "donts": [
                    "과도한 마케팅 용어나 과장된 표현 사용",
                    "비개발자를 위한 불필요한 설명 추가",
                    "경쟁 도구를 직접적으로 비난하기",
                    "복잡한 설정이나 의존성 요구하기",
                    "개발자 커뮤니티 문화에 어긋나는 표현 사용"
                ],
                "sample_copies": [
                    "코드베이스 전체를 AI에게 한 번에 전달하세요",
                    "npx repomix 한 줄이면 충분합니다",
                    "복잡한 레포도, 하나의 파일로, AI가 이해할 수 있게",
                    "오픈소스의 힘으로 만들어가는 개발자 도구"
                ],
                "visual_direction": {
                    "style_keywords": ["미니멀", "모노톤", "개발자 친화적", "다크모드 기반", "코드 에디터 느낌"],
                    "mood": "개발자 IDE처럼 깔끔하고 집중력 있는 분위기, 불필요한 장식 없이 기능에 집중",
                    "avoid": ["과도한 그라데이션", "화려한 일러스트", "비즈니스맨 스톡 이미지", "과장된 3D 그래픽"]
                },
                "suggested_brand_kit": {
                    "primary_colors": ["#1A1A2E", "#16213E"],
                    "secondary_colors": ["#0F3460", "#E94560"],
                    "fonts": {
                        "primary": "JetBrains Mono",
                        "secondary": "Inter"
                    },
                    "tone_keywords": ["실용적", "기술적", "간결한", "신뢰감", "개발자 친화적"],
                    "forbidden_expressions": ["혁신적인", "게임체인저", "완벽한", "최고의", "유일한"]
                },
                "confidence_score": 9.2,
                "analysis_notes": "Repomix GitHub 레포지토리, README, 공식 문서 분석 완료. 오픈소스 개발자 도구로서의 정체성이 명확하며, 타겟 오디언스(AI 협업 개발자)의 페인포인트를 정확히 해결하는 포지셔닝"
            }
        }
