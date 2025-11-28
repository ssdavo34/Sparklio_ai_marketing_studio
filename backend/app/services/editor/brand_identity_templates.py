"""
Brand Identity Canvas v2.0 Templates

브랜드 아이덴티티 캔버스 전용 템플릿 컬렉션

작성일: 2025-11-28
작성자: B팀 (Backend)
참조: B_TEAM_REQUEST_2025-11-28.md (P3 - Brand Identity Canvas v2.0)

주요 템플릿:
1. 미니멀 브랜드 캔버스
2. 프리미엄 브랜드 보드
3. 스타트업 피치덱 스타일
4. 럭셔리 브랜드 가이드라인
5. 테크 브랜드 아이덴티티
6. 라이프스타일 브랜드 북
7. F&B 브랜드 스토리
8. 패션 브랜드 룩북
9. 에코 프렌들리 브랜드
10. 크리에이티브 에이전시 스타일
"""

from uuid import uuid4
from typing import List, Dict, Any


# =============================================================================
# Color Palettes
# =============================================================================

PALETTES = {
    "minimal": {
        "primary": "#1A1A1A",
        "secondary": "#4A4A4A",
        "accent": "#007AFF",
        "background": "#FFFFFF",
        "surface": "#F8F8F8",
        "text": "#333333",
        "muted": "#999999"
    },
    "premium": {
        "primary": "#0D1B2A",
        "secondary": "#1B263B",
        "accent": "#C9A227",
        "background": "#FFFFFF",
        "surface": "#F5F5F5",
        "text": "#1B263B",
        "muted": "#6B7280"
    },
    "startup": {
        "primary": "#6366F1",
        "secondary": "#8B5CF6",
        "accent": "#EC4899",
        "background": "#FFFFFF",
        "surface": "#F3F4F6",
        "text": "#111827",
        "muted": "#6B7280"
    },
    "luxury": {
        "primary": "#1C1C1C",
        "secondary": "#2D2D2D",
        "accent": "#D4AF37",
        "background": "#FAFAFA",
        "surface": "#F0F0F0",
        "text": "#1C1C1C",
        "muted": "#8A8A8A"
    },
    "tech": {
        "primary": "#0EA5E9",
        "secondary": "#0284C7",
        "accent": "#22D3EE",
        "background": "#0F172A",
        "surface": "#1E293B",
        "text": "#F8FAFC",
        "muted": "#94A3B8"
    },
    "lifestyle": {
        "primary": "#F97316",
        "secondary": "#EA580C",
        "accent": "#FBBF24",
        "background": "#FFFBEB",
        "surface": "#FEF3C7",
        "text": "#78350F",
        "muted": "#A16207"
    },
    "fnb": {
        "primary": "#059669",
        "secondary": "#047857",
        "accent": "#F59E0B",
        "background": "#ECFDF5",
        "surface": "#D1FAE5",
        "text": "#064E3B",
        "muted": "#6B7280"
    },
    "fashion": {
        "primary": "#000000",
        "secondary": "#171717",
        "accent": "#DC2626",
        "background": "#FFFFFF",
        "surface": "#FAFAFA",
        "text": "#171717",
        "muted": "#737373"
    },
    "eco": {
        "primary": "#166534",
        "secondary": "#15803D",
        "accent": "#84CC16",
        "background": "#F0FDF4",
        "surface": "#DCFCE7",
        "text": "#14532D",
        "muted": "#4D7C0F"
    },
    "creative": {
        "primary": "#7C3AED",
        "secondary": "#6D28D9",
        "accent": "#F472B6",
        "background": "#FFFFFF",
        "surface": "#FAF5FF",
        "text": "#1F2937",
        "muted": "#6B7280"
    }
}


# =============================================================================
# Template Definitions
# =============================================================================

def create_minimal_brand_canvas() -> Dict[str, Any]:
    """미니멀 브랜드 캔버스"""
    palette = PALETTES["minimal"]
    return {
        "id": str(uuid4()),
        "name": "미니멀 브랜드 캔버스",
        "description": "깔끔하고 심플한 브랜드 아이덴티티 캔버스",
        "kind": "brand_identity",
        "thumbnail": "/templates/brand/minimal-canvas.png",
        "category": "minimal",
        "tags": ["미니멀", "심플", "모던", "클린"],
        "isPremium": False,
        "colorPalette": palette,
        "pages": [
            _create_cover_page("미니멀", palette),
            _create_brand_essence_page(palette),
            _create_target_audience_page(palette),
            _create_brand_personality_page(palette),
            _create_visual_identity_page(palette),
            _create_color_typography_page(palette),
        ]
    }


def create_premium_brand_board() -> Dict[str, Any]:
    """프리미엄 브랜드 보드"""
    palette = PALETTES["premium"]
    return {
        "id": str(uuid4()),
        "name": "프리미엄 브랜드 보드",
        "description": "고급스러운 브랜드 아이덴티티 보드",
        "kind": "brand_identity",
        "thumbnail": "/templates/brand/premium-board.png",
        "category": "premium",
        "tags": ["프리미엄", "고급", "비즈니스", "전문"],
        "isPremium": True,
        "colorPalette": palette,
        "pages": [
            _create_cover_page("프리미엄", palette),
            _create_brand_story_page(palette),
            _create_brand_values_page(palette),
            _create_target_audience_page(palette),
            _create_visual_identity_page(palette),
            _create_color_typography_page(palette),
            _create_brand_applications_page(palette),
        ]
    }


def create_startup_pitch_style() -> Dict[str, Any]:
    """스타트업 피치덱 스타일"""
    palette = PALETTES["startup"]
    return {
        "id": str(uuid4()),
        "name": "스타트업 피치덱 스타일",
        "description": "활기찬 스타트업을 위한 브랜드 캔버스",
        "kind": "brand_identity",
        "thumbnail": "/templates/brand/startup-pitch.png",
        "category": "startup",
        "tags": ["스타트업", "피치덱", "활기찬", "혁신"],
        "isPremium": False,
        "colorPalette": palette,
        "pages": [
            _create_cover_page("스타트업", palette),
            _create_problem_solution_page(palette),
            _create_brand_essence_page(palette),
            _create_target_audience_page(palette),
            _create_visual_identity_page(palette),
            _create_color_typography_page(palette),
        ]
    }


def create_luxury_brand_guideline() -> Dict[str, Any]:
    """럭셔리 브랜드 가이드라인"""
    palette = PALETTES["luxury"]
    return {
        "id": str(uuid4()),
        "name": "럭셔리 브랜드 가이드라인",
        "description": "럭셔리 브랜드를 위한 세련된 가이드라인",
        "kind": "brand_identity",
        "thumbnail": "/templates/brand/luxury-guideline.png",
        "category": "luxury",
        "tags": ["럭셔리", "고급", "세련된", "우아한"],
        "isPremium": True,
        "colorPalette": palette,
        "pages": [
            _create_cover_page("럭셔리", palette),
            _create_brand_heritage_page(palette),
            _create_brand_values_page(palette),
            _create_visual_identity_page(palette),
            _create_color_typography_page(palette),
            _create_brand_applications_page(palette),
        ]
    }


def create_tech_brand_identity() -> Dict[str, Any]:
    """테크 브랜드 아이덴티티"""
    palette = PALETTES["tech"]
    return {
        "id": str(uuid4()),
        "name": "테크 브랜드 아이덴티티",
        "description": "테크 기업을 위한 다크 테마 브랜드 캔버스",
        "kind": "brand_identity",
        "thumbnail": "/templates/brand/tech-identity.png",
        "category": "tech",
        "tags": ["테크", "기술", "다크모드", "미래적"],
        "isPremium": False,
        "colorPalette": palette,
        "pages": [
            _create_cover_page("테크", palette),
            _create_brand_mission_page(palette),
            _create_target_audience_page(palette),
            _create_visual_identity_page(palette),
            _create_color_typography_page(palette),
        ]
    }


def create_lifestyle_brand_book() -> Dict[str, Any]:
    """라이프스타일 브랜드 북"""
    palette = PALETTES["lifestyle"]
    return {
        "id": str(uuid4()),
        "name": "라이프스타일 브랜드 북",
        "description": "따뜻하고 친근한 라이프스타일 브랜드",
        "kind": "brand_identity",
        "thumbnail": "/templates/brand/lifestyle-book.png",
        "category": "lifestyle",
        "tags": ["라이프스타일", "따뜻한", "친근한", "일상"],
        "isPremium": False,
        "colorPalette": palette,
        "pages": [
            _create_cover_page("라이프스타일", palette),
            _create_brand_story_page(palette),
            _create_target_audience_page(palette),
            _create_visual_identity_page(palette),
            _create_color_typography_page(palette),
        ]
    }


def create_fnb_brand_story() -> Dict[str, Any]:
    """F&B 브랜드 스토리"""
    palette = PALETTES["fnb"]
    return {
        "id": str(uuid4()),
        "name": "F&B 브랜드 스토리",
        "description": "식음료 브랜드를 위한 신선한 템플릿",
        "kind": "brand_identity",
        "thumbnail": "/templates/brand/fnb-story.png",
        "category": "fnb",
        "tags": ["식음료", "레스토랑", "카페", "신선한"],
        "isPremium": False,
        "colorPalette": palette,
        "pages": [
            _create_cover_page("F&B", palette),
            _create_brand_story_page(palette),
            _create_brand_values_page(palette),
            _create_visual_identity_page(palette),
            _create_color_typography_page(palette),
        ]
    }


def create_fashion_brand_lookbook() -> Dict[str, Any]:
    """패션 브랜드 룩북"""
    palette = PALETTES["fashion"]
    return {
        "id": str(uuid4()),
        "name": "패션 브랜드 룩북",
        "description": "세련된 패션 브랜드를 위한 룩북 스타일",
        "kind": "brand_identity",
        "thumbnail": "/templates/brand/fashion-lookbook.png",
        "category": "fashion",
        "tags": ["패션", "룩북", "스타일리시", "트렌디"],
        "isPremium": True,
        "colorPalette": palette,
        "pages": [
            _create_cover_page("패션", palette),
            _create_brand_essence_page(palette),
            _create_visual_identity_page(palette),
            _create_color_typography_page(palette),
            _create_brand_applications_page(palette),
        ]
    }


def create_eco_friendly_brand() -> Dict[str, Any]:
    """에코 프렌들리 브랜드"""
    palette = PALETTES["eco"]
    return {
        "id": str(uuid4()),
        "name": "에코 프렌들리 브랜드",
        "description": "친환경 브랜드를 위한 자연 친화적 템플릿",
        "kind": "brand_identity",
        "thumbnail": "/templates/brand/eco-friendly.png",
        "category": "eco",
        "tags": ["에코", "친환경", "자연", "지속가능"],
        "isPremium": False,
        "colorPalette": palette,
        "pages": [
            _create_cover_page("에코", palette),
            _create_brand_mission_page(palette),
            _create_brand_values_page(palette),
            _create_visual_identity_page(palette),
            _create_color_typography_page(palette),
        ]
    }


def create_creative_agency_style() -> Dict[str, Any]:
    """크리에이티브 에이전시 스타일"""
    palette = PALETTES["creative"]
    return {
        "id": str(uuid4()),
        "name": "크리에이티브 에이전시 스타일",
        "description": "창의적인 에이전시를 위한 대담한 템플릿",
        "kind": "brand_identity",
        "thumbnail": "/templates/brand/creative-agency.png",
        "category": "creative",
        "tags": ["크리에이티브", "에이전시", "대담한", "창의적"],
        "isPremium": True,
        "colorPalette": palette,
        "pages": [
            _create_cover_page("크리에이티브", palette),
            _create_brand_personality_page(palette),
            _create_target_audience_page(palette),
            _create_visual_identity_page(palette),
            _create_color_typography_page(palette),
            _create_brand_applications_page(palette),
        ]
    }


# =============================================================================
# Page Templates
# =============================================================================

def _create_cover_page(style_name: str, palette: Dict) -> Dict[str, Any]:
    """표지 페이지"""
    return {
        "id": str(uuid4()),
        "name": "표지",
        "width": 1920,
        "height": 1080,
        "backgroundColor": palette["primary"],
        "elements": [
            {
                "id": str(uuid4()),
                "type": "text",
                "x": 160,
                "y": 400,
                "width": 800,
                "height": 120,
                "props": {
                    "text": "Brand Identity",
                    "fontSize": 72,
                    "fontFamily": "Pretendard",
                    "fontWeight": "bold",
                    "color": palette["background"]
                }
            },
            {
                "id": str(uuid4()),
                "type": "text",
                "x": 160,
                "y": 520,
                "width": 600,
                "height": 60,
                "props": {
                    "text": "브랜드 아이덴티티 캔버스",
                    "fontSize": 28,
                    "fontFamily": "Pretendard",
                    "color": palette.get("muted", "#999999")
                }
            },
            {
                "id": str(uuid4()),
                "type": "shape",
                "x": 160,
                "y": 600,
                "width": 120,
                "height": 4,
                "props": {
                    "fill": palette["accent"]
                }
            }
        ]
    }


def _create_brand_essence_page(palette: Dict) -> Dict[str, Any]:
    """브랜드 에센스 페이지"""
    return {
        "id": str(uuid4()),
        "name": "브랜드 에센스",
        "width": 1920,
        "height": 1080,
        "backgroundColor": palette["background"],
        "elements": [
            {
                "id": str(uuid4()),
                "type": "text",
                "x": 100,
                "y": 80,
                "width": 400,
                "height": 60,
                "props": {
                    "text": "Brand Essence",
                    "fontSize": 42,
                    "fontFamily": "Pretendard",
                    "fontWeight": "bold",
                    "color": palette["primary"]
                }
            },
            # 핵심 가치 박스
            {
                "id": str(uuid4()),
                "type": "shape",
                "x": 100,
                "y": 180,
                "width": 540,
                "height": 340,
                "props": {
                    "fill": palette["surface"],
                    "radius": 16
                }
            },
            {
                "id": str(uuid4()),
                "type": "text",
                "x": 140,
                "y": 220,
                "width": 460,
                "height": 40,
                "props": {
                    "text": "핵심 가치",
                    "fontSize": 24,
                    "fontFamily": "Pretendard",
                    "fontWeight": "bold",
                    "color": palette["text"]
                }
            },
            {
                "id": str(uuid4()),
                "type": "text",
                "x": 140,
                "y": 280,
                "width": 460,
                "height": 200,
                "props": {
                    "text": "브랜드의 핵심 가치를\n입력하세요",
                    "fontSize": 18,
                    "fontFamily": "Pretendard",
                    "color": palette["muted"],
                    "lineHeight": 1.8
                }
            },
            # 브랜드 약속 박스
            {
                "id": str(uuid4()),
                "type": "shape",
                "x": 680,
                "y": 180,
                "width": 540,
                "height": 340,
                "props": {
                    "fill": palette["surface"],
                    "radius": 16
                }
            },
            {
                "id": str(uuid4()),
                "type": "text",
                "x": 720,
                "y": 220,
                "width": 460,
                "height": 40,
                "props": {
                    "text": "브랜드 약속",
                    "fontSize": 24,
                    "fontFamily": "Pretendard",
                    "fontWeight": "bold",
                    "color": palette["text"]
                }
            },
            # 미션 박스
            {
                "id": str(uuid4()),
                "type": "shape",
                "x": 1260,
                "y": 180,
                "width": 540,
                "height": 340,
                "props": {
                    "fill": palette["accent"],
                    "radius": 16
                }
            },
            {
                "id": str(uuid4()),
                "type": "text",
                "x": 1300,
                "y": 220,
                "width": 460,
                "height": 40,
                "props": {
                    "text": "미션",
                    "fontSize": 24,
                    "fontFamily": "Pretendard",
                    "fontWeight": "bold",
                    "color": palette["background"]
                }
            }
        ]
    }


def _create_target_audience_page(palette: Dict) -> Dict[str, Any]:
    """타겟 고객 페이지"""
    return {
        "id": str(uuid4()),
        "name": "타겟 고객",
        "width": 1920,
        "height": 1080,
        "backgroundColor": palette["background"],
        "elements": [
            {
                "id": str(uuid4()),
                "type": "text",
                "x": 100,
                "y": 80,
                "width": 400,
                "height": 60,
                "props": {
                    "text": "Target Audience",
                    "fontSize": 42,
                    "fontFamily": "Pretendard",
                    "fontWeight": "bold",
                    "color": palette["primary"]
                }
            },
            # 페르소나 카드 1
            {
                "id": str(uuid4()),
                "type": "shape",
                "x": 100,
                "y": 180,
                "width": 400,
                "height": 500,
                "props": {
                    "fill": palette["surface"],
                    "radius": 16
                }
            },
            {
                "id": str(uuid4()),
                "type": "shape",
                "x": 200,
                "y": 240,
                "width": 200,
                "height": 200,
                "props": {
                    "fill": palette["muted"],
                    "radius": 100
                }
            },
            {
                "id": str(uuid4()),
                "type": "text",
                "x": 150,
                "y": 480,
                "width": 300,
                "height": 40,
                "props": {
                    "text": "페르소나 1",
                    "fontSize": 24,
                    "fontFamily": "Pretendard",
                    "fontWeight": "bold",
                    "color": palette["text"],
                    "textAlign": "center"
                }
            },
            # 페르소나 카드 2
            {
                "id": str(uuid4()),
                "type": "shape",
                "x": 540,
                "y": 180,
                "width": 400,
                "height": 500,
                "props": {
                    "fill": palette["surface"],
                    "radius": 16
                }
            },
            # 인사이트 박스
            {
                "id": str(uuid4()),
                "type": "shape",
                "x": 980,
                "y": 180,
                "width": 820,
                "height": 500,
                "props": {
                    "fill": palette["primary"],
                    "radius": 16
                }
            },
            {
                "id": str(uuid4()),
                "type": "text",
                "x": 1040,
                "y": 240,
                "width": 700,
                "height": 60,
                "props": {
                    "text": "고객 인사이트",
                    "fontSize": 28,
                    "fontFamily": "Pretendard",
                    "fontWeight": "bold",
                    "color": palette["background"]
                }
            }
        ]
    }


def _create_brand_personality_page(palette: Dict) -> Dict[str, Any]:
    """브랜드 퍼스널리티 페이지"""
    return {
        "id": str(uuid4()),
        "name": "브랜드 퍼스널리티",
        "width": 1920,
        "height": 1080,
        "backgroundColor": palette["background"],
        "elements": [
            {
                "id": str(uuid4()),
                "type": "text",
                "x": 100,
                "y": 80,
                "width": 500,
                "height": 60,
                "props": {
                    "text": "Brand Personality",
                    "fontSize": 42,
                    "fontFamily": "Pretendard",
                    "fontWeight": "bold",
                    "color": palette["primary"]
                }
            },
            # 키워드 태그들
            {
                "id": str(uuid4()),
                "type": "shape",
                "x": 100,
                "y": 200,
                "width": 180,
                "height": 60,
                "props": {
                    "fill": palette["accent"],
                    "radius": 30
                }
            },
            {
                "id": str(uuid4()),
                "type": "text",
                "x": 120,
                "y": 218,
                "width": 140,
                "height": 24,
                "props": {
                    "text": "혁신적인",
                    "fontSize": 18,
                    "fontFamily": "Pretendard",
                    "fontWeight": "bold",
                    "color": palette["background"],
                    "textAlign": "center"
                }
            },
            {
                "id": str(uuid4()),
                "type": "shape",
                "x": 300,
                "y": 200,
                "width": 180,
                "height": 60,
                "props": {
                    "fill": palette["surface"],
                    "radius": 30
                }
            },
            {
                "id": str(uuid4()),
                "type": "shape",
                "x": 500,
                "y": 200,
                "width": 180,
                "height": 60,
                "props": {
                    "fill": palette["surface"],
                    "radius": 30
                }
            },
            # 톤앤매너
            {
                "id": str(uuid4()),
                "type": "shape",
                "x": 100,
                "y": 320,
                "width": 820,
                "height": 400,
                "props": {
                    "fill": palette["surface"],
                    "radius": 16
                }
            },
            {
                "id": str(uuid4()),
                "type": "text",
                "x": 160,
                "y": 380,
                "width": 300,
                "height": 40,
                "props": {
                    "text": "톤앤매너",
                    "fontSize": 28,
                    "fontFamily": "Pretendard",
                    "fontWeight": "bold",
                    "color": palette["text"]
                }
            }
        ]
    }


def _create_visual_identity_page(palette: Dict) -> Dict[str, Any]:
    """비주얼 아이덴티티 페이지"""
    return {
        "id": str(uuid4()),
        "name": "비주얼 아이덴티티",
        "width": 1920,
        "height": 1080,
        "backgroundColor": palette["background"],
        "elements": [
            {
                "id": str(uuid4()),
                "type": "text",
                "x": 100,
                "y": 80,
                "width": 500,
                "height": 60,
                "props": {
                    "text": "Visual Identity",
                    "fontSize": 42,
                    "fontFamily": "Pretendard",
                    "fontWeight": "bold",
                    "color": palette["primary"]
                }
            },
            # 로고 영역
            {
                "id": str(uuid4()),
                "type": "shape",
                "x": 100,
                "y": 180,
                "width": 540,
                "height": 400,
                "props": {
                    "fill": palette["surface"],
                    "radius": 16
                }
            },
            {
                "id": str(uuid4()),
                "type": "text",
                "x": 140,
                "y": 220,
                "width": 200,
                "height": 40,
                "props": {
                    "text": "로고",
                    "fontSize": 20,
                    "fontFamily": "Pretendard",
                    "fontWeight": "bold",
                    "color": palette["muted"]
                }
            },
            {
                "id": str(uuid4()),
                "type": "shape",
                "x": 220,
                "y": 300,
                "width": 300,
                "height": 200,
                "props": {
                    "fill": palette["muted"],
                    "radius": 8
                }
            },
            # 무드보드 영역
            {
                "id": str(uuid4()),
                "type": "shape",
                "x": 680,
                "y": 180,
                "width": 1120,
                "height": 400,
                "props": {
                    "fill": palette["surface"],
                    "radius": 16
                }
            },
            {
                "id": str(uuid4()),
                "type": "text",
                "x": 720,
                "y": 220,
                "width": 200,
                "height": 40,
                "props": {
                    "text": "무드보드",
                    "fontSize": 20,
                    "fontFamily": "Pretendard",
                    "fontWeight": "bold",
                    "color": palette["muted"]
                }
            },
            # 무드보드 이미지 플레이스홀더
            {
                "id": str(uuid4()),
                "type": "shape",
                "x": 720,
                "y": 280,
                "width": 260,
                "height": 260,
                "props": {
                    "fill": palette["muted"],
                    "radius": 8
                }
            },
            {
                "id": str(uuid4()),
                "type": "shape",
                "x": 1000,
                "y": 280,
                "width": 260,
                "height": 260,
                "props": {
                    "fill": palette["muted"],
                    "radius": 8
                }
            },
            {
                "id": str(uuid4()),
                "type": "shape",
                "x": 1280,
                "y": 280,
                "width": 260,
                "height": 260,
                "props": {
                    "fill": palette["muted"],
                    "radius": 8
                }
            }
        ]
    }


def _create_color_typography_page(palette: Dict) -> Dict[str, Any]:
    """컬러 & 타이포그래피 페이지"""
    return {
        "id": str(uuid4()),
        "name": "컬러 & 타이포그래피",
        "width": 1920,
        "height": 1080,
        "backgroundColor": palette["background"],
        "elements": [
            {
                "id": str(uuid4()),
                "type": "text",
                "x": 100,
                "y": 80,
                "width": 600,
                "height": 60,
                "props": {
                    "text": "Color & Typography",
                    "fontSize": 42,
                    "fontFamily": "Pretendard",
                    "fontWeight": "bold",
                    "color": palette["primary"]
                }
            },
            # 컬러 팔레트
            {
                "id": str(uuid4()),
                "type": "text",
                "x": 100,
                "y": 180,
                "width": 200,
                "height": 40,
                "props": {
                    "text": "Color Palette",
                    "fontSize": 20,
                    "fontFamily": "Pretendard",
                    "fontWeight": "bold",
                    "color": palette["muted"]
                }
            },
            # 컬러 스와치
            {
                "id": str(uuid4()),
                "type": "shape",
                "x": 100,
                "y": 240,
                "width": 160,
                "height": 160,
                "props": {
                    "fill": palette["primary"],
                    "radius": 8
                }
            },
            {
                "id": str(uuid4()),
                "type": "shape",
                "x": 280,
                "y": 240,
                "width": 160,
                "height": 160,
                "props": {
                    "fill": palette["secondary"],
                    "radius": 8
                }
            },
            {
                "id": str(uuid4()),
                "type": "shape",
                "x": 460,
                "y": 240,
                "width": 160,
                "height": 160,
                "props": {
                    "fill": palette["accent"],
                    "radius": 8
                }
            },
            {
                "id": str(uuid4()),
                "type": "shape",
                "x": 640,
                "y": 240,
                "width": 160,
                "height": 160,
                "props": {
                    "fill": palette["surface"],
                    "radius": 8,
                    "stroke": palette["muted"],
                    "strokeWidth": 1
                }
            },
            # 타이포그래피
            {
                "id": str(uuid4()),
                "type": "text",
                "x": 100,
                "y": 480,
                "width": 200,
                "height": 40,
                "props": {
                    "text": "Typography",
                    "fontSize": 20,
                    "fontFamily": "Pretendard",
                    "fontWeight": "bold",
                    "color": palette["muted"]
                }
            },
            {
                "id": str(uuid4()),
                "type": "text",
                "x": 100,
                "y": 540,
                "width": 800,
                "height": 80,
                "props": {
                    "text": "Heading 1 - Pretendard Bold",
                    "fontSize": 48,
                    "fontFamily": "Pretendard",
                    "fontWeight": "bold",
                    "color": palette["text"]
                }
            },
            {
                "id": str(uuid4()),
                "type": "text",
                "x": 100,
                "y": 640,
                "width": 800,
                "height": 60,
                "props": {
                    "text": "Heading 2 - Pretendard SemiBold",
                    "fontSize": 32,
                    "fontFamily": "Pretendard",
                    "fontWeight": "600",
                    "color": palette["text"]
                }
            },
            {
                "id": str(uuid4()),
                "type": "text",
                "x": 100,
                "y": 720,
                "width": 800,
                "height": 40,
                "props": {
                    "text": "Body Text - Pretendard Regular",
                    "fontSize": 18,
                    "fontFamily": "Pretendard",
                    "color": palette["text"]
                }
            }
        ]
    }


def _create_brand_story_page(palette: Dict) -> Dict[str, Any]:
    """브랜드 스토리 페이지"""
    return {
        "id": str(uuid4()),
        "name": "브랜드 스토리",
        "width": 1920,
        "height": 1080,
        "backgroundColor": palette["background"],
        "elements": [
            {
                "id": str(uuid4()),
                "type": "text",
                "x": 100,
                "y": 80,
                "width": 400,
                "height": 60,
                "props": {
                    "text": "Brand Story",
                    "fontSize": 42,
                    "fontFamily": "Pretendard",
                    "fontWeight": "bold",
                    "color": palette["primary"]
                }
            },
            {
                "id": str(uuid4()),
                "type": "shape",
                "x": 100,
                "y": 180,
                "width": 840,
                "height": 600,
                "props": {
                    "fill": palette["surface"],
                    "radius": 16
                }
            },
            {
                "id": str(uuid4()),
                "type": "text",
                "x": 160,
                "y": 240,
                "width": 720,
                "height": 480,
                "props": {
                    "text": "브랜드의 시작과 여정을\n여기에 작성하세요.\n\n우리는 왜 이 브랜드를\n시작하게 되었는지,\n어떤 가치를 추구하는지\n진정성 있게 전달합니다.",
                    "fontSize": 24,
                    "fontFamily": "Pretendard",
                    "color": palette["text"],
                    "lineHeight": 1.8
                }
            },
            # 이미지 영역
            {
                "id": str(uuid4()),
                "type": "shape",
                "x": 980,
                "y": 180,
                "width": 820,
                "height": 600,
                "props": {
                    "fill": palette["muted"],
                    "radius": 16
                }
            }
        ]
    }


def _create_brand_values_page(palette: Dict) -> Dict[str, Any]:
    """브랜드 가치 페이지"""
    return {
        "id": str(uuid4()),
        "name": "브랜드 가치",
        "width": 1920,
        "height": 1080,
        "backgroundColor": palette["primary"],
        "elements": [
            {
                "id": str(uuid4()),
                "type": "text",
                "x": 100,
                "y": 80,
                "width": 400,
                "height": 60,
                "props": {
                    "text": "Our Values",
                    "fontSize": 42,
                    "fontFamily": "Pretendard",
                    "fontWeight": "bold",
                    "color": palette["background"]
                }
            },
            # 가치 카드 1
            {
                "id": str(uuid4()),
                "type": "shape",
                "x": 100,
                "y": 200,
                "width": 540,
                "height": 360,
                "props": {
                    "fill": palette["background"],
                    "radius": 16
                }
            },
            {
                "id": str(uuid4()),
                "type": "text",
                "x": 140,
                "y": 260,
                "width": 460,
                "height": 60,
                "props": {
                    "text": "01",
                    "fontSize": 48,
                    "fontFamily": "Pretendard",
                    "fontWeight": "bold",
                    "color": palette["accent"]
                }
            },
            {
                "id": str(uuid4()),
                "type": "text",
                "x": 140,
                "y": 340,
                "width": 460,
                "height": 40,
                "props": {
                    "text": "첫 번째 가치",
                    "fontSize": 28,
                    "fontFamily": "Pretendard",
                    "fontWeight": "bold",
                    "color": palette["text"]
                }
            },
            # 가치 카드 2
            {
                "id": str(uuid4()),
                "type": "shape",
                "x": 680,
                "y": 200,
                "width": 540,
                "height": 360,
                "props": {
                    "fill": palette["background"],
                    "radius": 16
                }
            },
            # 가치 카드 3
            {
                "id": str(uuid4()),
                "type": "shape",
                "x": 1260,
                "y": 200,
                "width": 540,
                "height": 360,
                "props": {
                    "fill": palette["background"],
                    "radius": 16
                }
            }
        ]
    }


def _create_brand_applications_page(palette: Dict) -> Dict[str, Any]:
    """브랜드 적용 예시 페이지"""
    return {
        "id": str(uuid4()),
        "name": "브랜드 적용",
        "width": 1920,
        "height": 1080,
        "backgroundColor": palette["surface"],
        "elements": [
            {
                "id": str(uuid4()),
                "type": "text",
                "x": 100,
                "y": 80,
                "width": 500,
                "height": 60,
                "props": {
                    "text": "Brand Applications",
                    "fontSize": 42,
                    "fontFamily": "Pretendard",
                    "fontWeight": "bold",
                    "color": palette["primary"]
                }
            },
            # 명함
            {
                "id": str(uuid4()),
                "type": "shape",
                "x": 100,
                "y": 180,
                "width": 540,
                "height": 320,
                "props": {
                    "fill": palette["background"],
                    "radius": 16
                }
            },
            {
                "id": str(uuid4()),
                "type": "text",
                "x": 140,
                "y": 460,
                "width": 200,
                "height": 30,
                "props": {
                    "text": "명함",
                    "fontSize": 16,
                    "fontFamily": "Pretendard",
                    "color": palette["muted"]
                }
            },
            # 문구류
            {
                "id": str(uuid4()),
                "type": "shape",
                "x": 680,
                "y": 180,
                "width": 540,
                "height": 320,
                "props": {
                    "fill": palette["background"],
                    "radius": 16
                }
            },
            {
                "id": str(uuid4()),
                "type": "text",
                "x": 720,
                "y": 460,
                "width": 200,
                "height": 30,
                "props": {
                    "text": "문구류",
                    "fontSize": 16,
                    "fontFamily": "Pretendard",
                    "color": palette["muted"]
                }
            },
            # 패키지
            {
                "id": str(uuid4()),
                "type": "shape",
                "x": 1260,
                "y": 180,
                "width": 540,
                "height": 320,
                "props": {
                    "fill": palette["background"],
                    "radius": 16
                }
            },
            {
                "id": str(uuid4()),
                "type": "text",
                "x": 1300,
                "y": 460,
                "width": 200,
                "height": 30,
                "props": {
                    "text": "패키지",
                    "fontSize": 16,
                    "fontFamily": "Pretendard",
                    "color": palette["muted"]
                }
            }
        ]
    }


def _create_brand_mission_page(palette: Dict) -> Dict[str, Any]:
    """브랜드 미션 페이지"""
    return {
        "id": str(uuid4()),
        "name": "미션 & 비전",
        "width": 1920,
        "height": 1080,
        "backgroundColor": palette["background"],
        "elements": [
            {
                "id": str(uuid4()),
                "type": "text",
                "x": 100,
                "y": 80,
                "width": 400,
                "height": 60,
                "props": {
                    "text": "Mission & Vision",
                    "fontSize": 42,
                    "fontFamily": "Pretendard",
                    "fontWeight": "bold",
                    "color": palette["primary"]
                }
            },
            # 미션 박스
            {
                "id": str(uuid4()),
                "type": "shape",
                "x": 100,
                "y": 200,
                "width": 840,
                "height": 300,
                "props": {
                    "fill": palette["primary"],
                    "radius": 16
                }
            },
            {
                "id": str(uuid4()),
                "type": "text",
                "x": 160,
                "y": 260,
                "width": 720,
                "height": 40,
                "props": {
                    "text": "MISSION",
                    "fontSize": 18,
                    "fontFamily": "Pretendard",
                    "fontWeight": "bold",
                    "color": palette["accent"]
                }
            },
            {
                "id": str(uuid4()),
                "type": "text",
                "x": 160,
                "y": 320,
                "width": 720,
                "height": 120,
                "props": {
                    "text": "우리의 미션을 작성하세요",
                    "fontSize": 32,
                    "fontFamily": "Pretendard",
                    "fontWeight": "bold",
                    "color": palette["background"]
                }
            },
            # 비전 박스
            {
                "id": str(uuid4()),
                "type": "shape",
                "x": 980,
                "y": 200,
                "width": 840,
                "height": 300,
                "props": {
                    "fill": palette["surface"],
                    "radius": 16
                }
            },
            {
                "id": str(uuid4()),
                "type": "text",
                "x": 1040,
                "y": 260,
                "width": 720,
                "height": 40,
                "props": {
                    "text": "VISION",
                    "fontSize": 18,
                    "fontFamily": "Pretendard",
                    "fontWeight": "bold",
                    "color": palette["accent"]
                }
            }
        ]
    }


def _create_brand_heritage_page(palette: Dict) -> Dict[str, Any]:
    """브랜드 헤리티지 페이지"""
    return {
        "id": str(uuid4()),
        "name": "브랜드 헤리티지",
        "width": 1920,
        "height": 1080,
        "backgroundColor": palette["background"],
        "elements": [
            {
                "id": str(uuid4()),
                "type": "text",
                "x": 100,
                "y": 80,
                "width": 500,
                "height": 60,
                "props": {
                    "text": "Brand Heritage",
                    "fontSize": 42,
                    "fontFamily": "Pretendard",
                    "fontWeight": "bold",
                    "color": palette["primary"]
                }
            },
            # 타임라인
            {
                "id": str(uuid4()),
                "type": "shape",
                "x": 100,
                "y": 400,
                "width": 1720,
                "height": 4,
                "props": {
                    "fill": palette["muted"]
                }
            },
            # 이정표 1
            {
                "id": str(uuid4()),
                "type": "shape",
                "x": 200,
                "y": 380,
                "width": 40,
                "height": 40,
                "props": {
                    "fill": palette["accent"],
                    "radius": 20
                }
            },
            {
                "id": str(uuid4()),
                "type": "text",
                "x": 140,
                "y": 440,
                "width": 160,
                "height": 40,
                "props": {
                    "text": "2020",
                    "fontSize": 24,
                    "fontFamily": "Pretendard",
                    "fontWeight": "bold",
                    "color": palette["text"],
                    "textAlign": "center"
                }
            }
        ]
    }


def _create_problem_solution_page(palette: Dict) -> Dict[str, Any]:
    """문제 & 해결책 페이지 (스타트업용)"""
    return {
        "id": str(uuid4()),
        "name": "문제 & 해결책",
        "width": 1920,
        "height": 1080,
        "backgroundColor": palette["background"],
        "elements": [
            {
                "id": str(uuid4()),
                "type": "text",
                "x": 100,
                "y": 80,
                "width": 500,
                "height": 60,
                "props": {
                    "text": "Problem & Solution",
                    "fontSize": 42,
                    "fontFamily": "Pretendard",
                    "fontWeight": "bold",
                    "color": palette["primary"]
                }
            },
            # 문제 박스
            {
                "id": str(uuid4()),
                "type": "shape",
                "x": 100,
                "y": 200,
                "width": 840,
                "height": 500,
                "props": {
                    "fill": palette["surface"],
                    "radius": 16
                }
            },
            {
                "id": str(uuid4()),
                "type": "text",
                "x": 160,
                "y": 260,
                "width": 200,
                "height": 40,
                "props": {
                    "text": "PROBLEM",
                    "fontSize": 18,
                    "fontFamily": "Pretendard",
                    "fontWeight": "bold",
                    "color": "#EF4444"
                }
            },
            # 해결책 박스
            {
                "id": str(uuid4()),
                "type": "shape",
                "x": 980,
                "y": 200,
                "width": 840,
                "height": 500,
                "props": {
                    "fill": palette["accent"],
                    "radius": 16
                }
            },
            {
                "id": str(uuid4()),
                "type": "text",
                "x": 1040,
                "y": 260,
                "width": 200,
                "height": 40,
                "props": {
                    "text": "SOLUTION",
                    "fontSize": 18,
                    "fontFamily": "Pretendard",
                    "fontWeight": "bold",
                    "color": palette["background"]
                }
            }
        ]
    }


# =============================================================================
# Export Functions
# =============================================================================

def get_all_brand_identity_templates() -> List[Dict[str, Any]]:
    """모든 Brand Identity 템플릿 반환"""
    return [
        create_minimal_brand_canvas(),
        create_premium_brand_board(),
        create_startup_pitch_style(),
        create_luxury_brand_guideline(),
        create_tech_brand_identity(),
        create_lifestyle_brand_book(),
        create_fnb_brand_story(),
        create_fashion_brand_lookbook(),
        create_eco_friendly_brand(),
        create_creative_agency_style(),
    ]


def get_template_by_category(category: str) -> List[Dict[str, Any]]:
    """카테고리별 템플릿 반환"""
    all_templates = get_all_brand_identity_templates()
    return [t for t in all_templates if t.get("category") == category]


def get_color_palettes() -> Dict[str, Dict[str, str]]:
    """사용 가능한 컬러 팔레트 반환"""
    return PALETTES
