"""
Document Layout Agent v2.0 - Professional Presentation Quality

문서 콘텐츠를 분석하여 **전문적인 프레젠테이션 품질**의 레이아웃을 생성하는 Agent

작성일: 2025-12-04 (v2.0 Major Refactoring)
작성자: B팀 (Backend)

v2.0 개선사항 (Genspark AI Slides 수준):
- PART 번호 시스템으로 시각적 계층 구조
- 큰 폰트 크기 (제목 48-72px, 본문 24-32px)
- 카드 기반 레이아웃 + 배경색/그림자
- 아이콘/이모지 활용한 시각적 흥미
- 푸터 (페이지 번호, 메타데이터)
- 타임라인/플로우차트 시각화
- 2컬럼 레이아웃 (라벨 + 설명)
- 일관된 페이지 크기 (1920x1080)
- 콘텐츠에서 동적 제목 생성

지원 문서 유형:
- meeting_summary: 회의 요약
- presentation: 프레젠테이션/피치덱
- brief: 캠페인 브리프
- product_detail: 상품 상세 페이지
- sns_ad: SNS 광고
- report: 일반 보고서
"""

import json
import logging
from typing import Dict, Any, Optional, List
from pydantic import BaseModel, Field
from datetime import datetime

from app.services.agents.base import (
    AgentBase, AgentRequest, AgentResponse, AgentError, AgentOutput
)

logger = logging.getLogger(__name__)


# =============================================================================
# v2.0 Design System Constants
# =============================================================================

# 표준 페이지 크기 (16:9 Full HD)
STANDARD_WIDTH = 1920
STANDARD_HEIGHT = 1080

# 여백 시스템
MARGIN_LARGE = 120    # 페이지 좌우 여백
MARGIN_MEDIUM = 80    # 섹션 간 여백
MARGIN_SMALL = 40     # 요소 간 여백

# 폰트 크기 가이드 (v3.0 - 1920x1080에서 가독성 최적화)
FONT_SIZE = {
    "hero_title": 96,      # 커버 페이지 메인 제목 (더 크게)
    "page_title": 64,      # 페이지 제목 (더 크게)
    "section_title": 48,   # 섹션 제목
    "card_title": 36,      # 카드 제목
    "body_large": 32,      # 본문 (강조)
    "body": 28,            # 본문 (더 크게)
    "body_small": 24,      # 본문 (작은)
    "caption": 20,         # 캡션, 메타데이터
    "footer": 18,          # 푸터
    "part_number": 40,     # PART 번호
}

# 색상 팔레트 (모던 & 프로페셔널)
COLORS = {
    "primary": "#3B82F6",        # 파란색 (메인 강조)
    "primary_dark": "#1E40AF",   # 진한 파란색
    "secondary": "#8B5CF6",      # 보라색
    "accent": "#06B6D4",         # 청록색
    "success": "#10B981",        # 녹색
    "warning": "#F59E0B",        # 주황색
    "danger": "#EF4444",         # 빨간색
    "text_primary": "#111827",   # 거의 검정
    "text_secondary": "#4B5563", # 회색
    "text_light": "#9CA3AF",     # 밝은 회색
    "background": "#FFFFFF",     # 흰색
    "background_alt": "#F8FAFC", # 연한 회색
    "card_bg": "#F1F5F9",        # 카드 배경
    "border": "#E2E8F0",         # 테두리
}

# 섹션별 아이콘 매핑
SECTION_ICONS = {
    "summary": "📋",
    "agenda": "📌",
    "decisions": "✅",
    "action_items": "🎯",
    "key_points": "💡",
    "timeline": "⏱️",
    "goals": "🏆",
    "challenges": "⚠️",
    "next_steps": "➡️",
    "participants": "👥",
    "resources": "📦",
    "budget": "💰",
    "metrics": "📊",
    "default": "📝",
}

# PART 라벨
PART_LABELS = {
    "cover": "OVERVIEW",
    "summary": "PART 1",
    "agenda": "PART 2",
    "decisions": "PART 3",
    "action_items": "PART 4",
    "conclusion": "SUMMARY",
}


# =============================================================================
# Input/Output Schemas
# =============================================================================

class DocumentContent(BaseModel):
    """문서 콘텐츠 입력"""
    title: str = Field(..., description="문서 제목")
    subtitle: Optional[str] = Field(None, description="부제목")
    summary: Optional[str] = Field(None, description="요약/개요")
    sections: List[Dict[str, Any]] = Field(
        default_factory=list,
        description="섹션 목록 [{type, title, items}]"
    )
    keywords: Optional[List[str]] = Field(None, description="키워드 목록")
    metadata: Optional[Dict[str, Any]] = Field(None, description="추가 메타데이터")


class LayoutElement(BaseModel):
    """레이아웃 요소"""
    type: str = Field(..., description="요소 타입 (text, figure, tag 등)")
    x: float = Field(..., description="X 좌표")
    y: float = Field(..., description="Y 좌표")
    width: float = Field(..., description="너비")
    height: Optional[float] = Field(None, description="높이")
    properties: Dict[str, Any] = Field(
        default_factory=dict,
        description="스타일 속성 (fill, fontSize, fontWeight 등)"
    )
    content: Optional[str] = Field(None, description="텍스트 콘텐츠")


class PageLayout(BaseModel):
    """페이지 레이아웃"""
    page_number: int = Field(..., description="페이지 번호")
    page_type: str = Field(..., description="페이지 유형 (cover, content, summary)")
    layout_type: str = Field(
        ...,
        description="레이아웃 타입 (full_header, two_column, card_grid, list)"
    )
    elements: List[LayoutElement] = Field(
        default_factory=list,
        description="페이지 요소 목록"
    )
    section_title: Optional[str] = Field(None, description="섹션 제목")


class DocumentLayoutOutput(BaseModel):
    """DocumentLayoutAgent 출력"""
    document_type: str = Field(..., description="문서 유형")
    total_pages: int = Field(..., description="총 페이지 수")
    pages: List[PageLayout] = Field(..., description="페이지 레이아웃 목록")
    design_tokens: Dict[str, Any] = Field(
        default_factory=dict,
        description="디자인 토큰 (colors, fonts, spacing)"
    )
    recommendations: List[str] = Field(
        default_factory=list,
        description="레이아웃 권장 사항"
    )


# =============================================================================
# Document Layout Agent
# =============================================================================

class ContentAnalysis(BaseModel):
    """콘텐츠 분석 결과"""
    total_text_length: int = Field(default=0, description="총 텍스트 길이")
    summary_length: int = Field(default=0, description="요약 길이")
    summary_complexity: str = Field(default="simple", description="요약 복잡도: simple/moderate/complex")
    section_count: int = Field(default=0, description="섹션 수")
    sections_analysis: Dict[str, Dict[str, Any]] = Field(default_factory=dict, description="섹션별 분석")
    keyword_count: int = Field(default=0, description="키워드 수")
    recommended_pages: int = Field(default=1, description="권장 페이지 수")
    page_distribution: List[Dict[str, Any]] = Field(default_factory=list, description="페이지 분배 계획")


class DocumentLayoutAgent(AgentBase):
    """
    Document Layout Agent

    콘텐츠를 분석하여 최적의 문서 레이아웃을 자동 생성합니다.

    지원 문서 유형:
    - meeting_summary: 회의 요약 (Executive Summary, 안건, 결정사항, 액션아이템)
    - report: 일반 보고서
    - presentation: 프레젠테이션 슬라이드
    - brief: 캠페인 브리프

    레이아웃 타입:
    - cover: 표지 (큰 제목, 부제, 날짜)
    - full_header: 전체 너비 헤더 + 콘텐츠
    - two_column: 2단 레이아웃
    - card_grid: 카드 그리드 (2-3열)
    - list: 목록형
    - highlight_box: 강조 박스
    """

    @property
    def name(self) -> str:
        return "document_layout"

    def _analyze_content(self, content: DocumentContent) -> ContentAnalysis:
        """
        콘텐츠를 분석하여 레이아웃 결정에 필요한 정보 추출

        분석 항목:
        1. 요약 길이 및 복잡도
        2. 각 섹션별 항목 수 및 텍스트 길이
        3. 전체 콘텐츠 양 기반 페이지 수 결정
        """
        analysis = ContentAnalysis()

        # 요약 분석
        if content.summary:
            analysis.summary_length = len(content.summary)
            sentences = content.summary.split('. ')
            if len(sentences) <= 3:
                analysis.summary_complexity = "simple"
            elif len(sentences) <= 6:
                analysis.summary_complexity = "moderate"
            else:
                analysis.summary_complexity = "complex"

        # 키워드 분석
        analysis.keyword_count = len(content.keywords or [])

        # 섹션별 분석
        analysis.section_count = len(content.sections)
        total_items = 0

        for section in content.sections:
            section_type = section.get("type", "unknown")
            items = section.get("items", [])
            item_count = len(items)
            total_items += item_count

            # 항목별 평균 텍스트 길이
            avg_item_length = 0
            if items:
                total_length = sum(len(str(item)) for item in items)
                avg_item_length = total_length // item_count

            analysis.sections_analysis[section_type] = {
                "item_count": item_count,
                "avg_item_length": avg_item_length,
                "total_length": item_count * avg_item_length,
                "needs_multiline": avg_item_length > 100,
                "layout_hint": self._get_section_layout_hint(section_type, item_count, avg_item_length)
            }

        # 총 텍스트 길이
        analysis.total_text_length = (
            analysis.summary_length +
            sum(s["total_length"] for s in analysis.sections_analysis.values())
        )

        # 페이지 분배 결정
        analysis.page_distribution = self._determine_page_distribution(content, analysis)
        analysis.recommended_pages = len(analysis.page_distribution)

        logger.info(
            f"[DocumentLayoutAgent] Content analysis: "
            f"summary={analysis.summary_complexity}({analysis.summary_length}), "
            f"sections={analysis.section_count}, items={total_items}, "
            f"recommended_pages={analysis.recommended_pages}"
        )

        return analysis

    def _get_section_layout_hint(
        self,
        section_type: str,
        item_count: int,
        avg_item_length: int
    ) -> str:
        """섹션 타입과 콘텐츠 양에 따른 레이아웃 힌트"""

        # 액션 아이템: 카드 그리드 선호
        if section_type == "action_items":
            if item_count <= 2:
                return "horizontal_cards"
            elif item_count <= 4:
                return "card_grid_2col"
            else:
                return "card_grid_2col_multirow"

        # 안건/결정사항: 리스트 또는 2컬럼
        if section_type in ("agenda", "decisions"):
            if item_count <= 3:
                return "simple_list"
            elif item_count <= 6:
                return "numbered_list"
            else:
                return "compact_list"

        # 긴 텍스트 항목: 박스 형태
        if avg_item_length > 150:
            return "content_boxes"

        # 기본
        if item_count <= 3:
            return "simple_list"
        elif item_count <= 6:
            return "numbered_list"
        else:
            return "compact_list"

    def _determine_page_distribution(
        self,
        content: DocumentContent,
        analysis: ContentAnalysis
    ) -> List[Dict[str, Any]]:
        """
        콘텐츠 분석 결과를 바탕으로 페이지 분배 결정

        규칙:
        1. 항상 커버 페이지 (제목 + 요약)
        2. 요약이 긴 경우 (500자+) 요약만으로 1페이지
        3. 안건+결정사항: 항목 합이 6개 이하면 같은 페이지, 그 이상이면 분리
        4. 액션아이템: 3개 이상이면 별도 페이지
        5. 각 페이지는 콘텐츠 양에 따라 레이아웃 타입 결정
        """
        pages = []

        # 섹션별 분석 결과
        agenda_info = analysis.sections_analysis.get("agenda", {"item_count": 0})
        decisions_info = analysis.sections_analysis.get("decisions", {"item_count": 0})
        actions_info = analysis.sections_analysis.get("action_items", {"item_count": 0})

        agenda_count = agenda_info.get("item_count", 0)
        decisions_count = decisions_info.get("item_count", 0)
        actions_count = actions_info.get("item_count", 0)

        # === PAGE 1: Cover + Summary ===
        cover_sections = ["title", "summary"]
        cover_layout = "full_header"

        # 요약이 짧고 (300자 미만) 키워드가 있으면 키워드도 표시
        if analysis.summary_length < 300 and analysis.keyword_count > 0:
            cover_sections.append("keywords")

        # 요약이 매우 짧으면 (150자 미만) 안건도 표시 가능
        if analysis.summary_length < 150 and agenda_count <= 3:
            cover_sections.append("agenda_preview")

        pages.append({
            "page_type": "cover",
            "layout_type": cover_layout,
            "sections": cover_sections,
            "title": "Executive Summary"
        })

        # === 요약이 긴 경우: 커버에 이미 요약이 포함되므로 별도 페이지 생성하지 않음 ===
        # 이전에는 summary_detail 페이지를 추가했지만, 이는 중복을 유발함
        # 커버 페이지의 요약 카드가 페이지를 충분히 채우므로 별도 페이지 불필요

        # === PAGE 2 (or 3): 안건 & 결정사항 ===
        combined_count = agenda_count + decisions_count

        if combined_count > 0:
            if combined_count <= 8:
                # 같은 페이지에 2컬럼으로
                pages.append({
                    "page_type": "content",
                    "layout_type": "two_column",
                    "sections": ["agenda", "decisions"],
                    "title": "Key Points & Decisions"
                })
            else:
                # 안건과 결정사항 분리
                if agenda_count > 0:
                    layout = "numbered_list" if agenda_count > 4 else "card_list"
                    pages.append({
                        "page_type": "content",
                        "layout_type": layout,
                        "sections": ["agenda"],
                        "title": "Agenda"
                    })
                if decisions_count > 0:
                    layout = "numbered_list" if decisions_count > 4 else "card_list"
                    pages.append({
                        "page_type": "content",
                        "layout_type": layout,
                        "sections": ["decisions"],
                        "title": "Decisions"
                    })

        # === 액션 아이템 페이지 ===
        if actions_count > 0:
            if actions_count <= 2:
                layout = "horizontal_cards"
            elif actions_count <= 4:
                layout = "card_grid_2col"
            else:
                layout = "card_grid_compact"

            pages.append({
                "page_type": "content",
                "layout_type": layout,
                "sections": ["action_items"],
                "title": "Action Items"
            })

        return pages

    async def execute(self, request: AgentRequest) -> AgentResponse:
        """문서 레이아웃 생성"""
        start_time = datetime.utcnow()

        self._validate_request(request)

        try:
            # 입력 파싱
            content = DocumentContent(**request.payload.get("content", {}))
            page_width = request.payload.get("page_width", 1920)
            page_height = request.payload.get("page_height", 1080)
            document_type = request.payload.get("document_type", "meeting_summary")

            use_llm = request.payload.get("use_llm", False)

            logger.info(
                f"[DocumentLayoutAgent] Generating layout for {document_type}, "
                f"page size: {page_width}x{page_height}, use_llm={use_llm}"
            )

            # 문서 유형별 전용 레이아웃 생성
            if document_type == "sns_ad":
                platform = request.payload.get("platform", "instagram_feed")
                output_data = self._generate_sns_ad_layout(content, page_width, page_height, platform)
            elif document_type == "product_detail":
                output_data = self._generate_product_detail_layout(content, page_width, page_height)
            elif document_type == "brief":
                output_data = self._generate_brief_layout(content, page_width, page_height)
            elif use_llm and self.llm_gateway:
                # LLM을 사용한 레이아웃 생성
                prompt = self._build_prompt(content, page_width, page_height, document_type)

                try:
                    llm_response = await self.llm_gateway.generate(
                        role=self.name,
                        task="generate_document_layout",
                        payload={"prompt": prompt},
                        mode="json",
                        override_model="claude-3-5-haiku-20241022",
                        options={
                            "temperature": 0.3,
                            "max_tokens": 4000
                        }
                    )
                    output_data = self._parse_output(
                        llm_response.output.value,
                        content,
                        page_width,
                        page_height,
                        document_type
                    )

                    # 결과 검증 - 페이지 중 빈 elements가 있으면 fallback 사용
                    if any(not page.elements for page in output_data.pages):
                        logger.warning("[DocumentLayoutAgent] LLM returned empty pages. Using fallback.")
                        output_data = self._generate_fallback_layout(
                            content, page_width, page_height, document_type
                        )
                except Exception as e:
                    logger.warning(f"[DocumentLayoutAgent] LLM failed: {e}. Using fallback.")
                    output_data = self._generate_fallback_layout(
                        content, page_width, page_height, document_type
                    )
            else:
                # Fallback 레이아웃 사용 (기본)
                output_data = self._generate_fallback_layout(
                    content, page_width, page_height, document_type
                )

            elapsed = (datetime.utcnow() - start_time).total_seconds()

            return AgentResponse(
                agent=self.name,
                task=request.task,
                status="completed",
                outputs=[
                    AgentOutput(
                        type="json",
                        name="document_layout",
                        value=output_data.model_dump()
                    )
                ],
                usage={"elapsed_seconds": round(elapsed, 2)},
                meta={"document_type": document_type, "page_count": output_data.total_pages}
            )

        except Exception as e:
            logger.error(f"[DocumentLayoutAgent] Error: {e}", exc_info=True)
            raise AgentError(
                message=f"Document layout generation failed: {str(e)}",
                agent=self.name,
                details={"payload": request.payload}
            )

    def _build_prompt(
        self,
        content: DocumentContent,
        page_width: int,
        page_height: int,
        document_type: str
    ) -> str:
        """LLM 프롬프트 생성"""

        # 섹션 정보 요약
        sections_summary = []
        for section in content.sections:
            section_type = section.get("type", "unknown")
            title = section.get("title", "")
            items = section.get("items", [])
            sections_summary.append(f"- {section_type}: {title} ({len(items)} items)")

        prompt = f"""당신은 전문 문서 레이아웃 디자이너입니다.

## 문서 정보
- 유형: {document_type}
- 제목: {content.title}
- 부제목: {content.subtitle or '없음'}
- 요약 길이: {len(content.summary or '')} 글자
- 키워드: {', '.join(content.keywords or [])}

## 섹션 목록
{chr(10).join(sections_summary) if sections_summary else '섹션 없음'}

## 페이지 크기
- 너비: {page_width}px
- 높이: {page_height}px
- 여백: 60px

## 레이아웃 규칙

### 1. 페이지 타입
| 타입 | 용도 | 특징 |
|------|------|------|
| cover | 표지 | 그라데이션 헤더, 큰 제목, 날짜 |
| content | 본문 | 섹션별 콘텐츠 |
| summary | 요약 | 핵심 내용 강조 |

### 2. 레이아웃 타입
| 타입 | 용도 | 구조 |
|------|------|------|
| full_header | 표지, 섹션 시작 | 상단 색상 바 + 제목 |
| two_column | 비교, 병렬 정보 | 좌측/우측 분할 |
| card_grid | 항목 나열 | 2열 카드 그리드 |
| list | 순차 목록 | 번호/불릿 목록 |
| highlight_box | 결론, 핵심 | 배경 박스 + 강조 |

### 3. 색상 팔레트
- primary: #7C3AED (보라색, 헤더/강조)
- secondary: #4F46E5 (파란색, 서브)
- success: #059669 (녹색, 결정사항)
- danger: #DC2626 (빨간색, 액션아이템)
- text_primary: #1F2937
- text_secondary: #6B7280
- background: #F9FAFB

### 4. 폰트 크기 가이드
- 제목 (h1): 36-42px
- 섹션 제목 (h2): 20-24px
- 본문: 12-14px
- 캡션: 10-11px

### 5. 콘텐츠 배치 원칙
1. 요약이 길면 (500자+): 도입/본문/결론으로 분리
2. 목록 항목이 5개+: 2컬럼 또는 카드 그리드
3. 안건/결정사항: two_column으로 나란히 배치
4. 액션아이템: card_grid (우선순위 강조)
5. 키워드: 상단 태그 형태로 표시

## 출력 형식 (JSON)

```json
{{
    "document_type": "{document_type}",
    "total_pages": 2,
    "design_tokens": {{
        "primary_color": "#7C3AED",
        "secondary_color": "#4F46E5",
        "success_color": "#059669",
        "danger_color": "#DC2626",
        "font_family": "Pretendard, sans-serif",
        "base_font_size": 14,
        "margin": 60
    }},
    "pages": [
        {{
            "page_number": 1,
            "page_type": "cover",
            "layout_type": "full_header",
            "section_title": "Meeting Summary",
            "elements": [
                {{
                    "type": "figure",
                    "x": 0,
                    "y": 0,
                    "width": {page_width},
                    "height": 180,
                    "properties": {{
                        "fill": "linear-gradient(135deg, #7C3AED 0%, #4F46E5 100%)"
                    }}
                }},
                {{
                    "type": "text",
                    "x": 60,
                    "y": 50,
                    "width": {page_width - 120},
                    "properties": {{
                        "fontSize": 42,
                        "fontWeight": "bold",
                        "fill": "#FFFFFF"
                    }},
                    "content": "Meeting Summary"
                }}
            ]
        }}
    ],
    "recommendations": [
        "요약이 길어 2페이지로 분할",
        "액션아이템 5개 이상으로 카드 그리드 권장"
    ]
}}
```

위 콘텐츠에 맞는 최적의 레이아웃을 생성하세요.
각 섹션의 콘텐츠 양을 고려하여 페이지를 적절히 분배하세요.
"""
        return prompt

    def _parse_output(
        self,
        llm_output: Any,
        content: DocumentContent,
        page_width: int,
        page_height: int,
        document_type: str
    ) -> DocumentLayoutOutput:
        """LLM 출력 파싱"""

        if isinstance(llm_output, dict):
            data = llm_output
        elif isinstance(llm_output, str):
            try:
                data = json.loads(llm_output)
            except json.JSONDecodeError:
                import re
                json_match = re.search(r'\{[\s\S]*\}', llm_output)
                if json_match:
                    data = json.loads(json_match.group())
                else:
                    raise ValueError("Cannot parse LLM output as JSON")
        else:
            raise ValueError(f"Unexpected output type: {type(llm_output)}")

        # 페이지 파싱
        pages = []
        for page_data in data.get("pages", []):
            elements = []
            for elem_data in page_data.get("elements", []):
                elements.append(LayoutElement(
                    type=elem_data.get("type", "text"),
                    x=elem_data.get("x", 0),
                    y=elem_data.get("y", 0),
                    width=elem_data.get("width", page_width - 120),
                    height=elem_data.get("height"),
                    properties=elem_data.get("properties", {}),
                    content=elem_data.get("content")
                ))

            pages.append(PageLayout(
                page_number=page_data.get("page_number", len(pages) + 1),
                page_type=page_data.get("page_type", "content"),
                layout_type=page_data.get("layout_type", "list"),
                elements=elements,
                section_title=page_data.get("section_title")
            ))

        return DocumentLayoutOutput(
            document_type=data.get("document_type", document_type),
            total_pages=data.get("total_pages", len(pages)),
            pages=pages,
            design_tokens=data.get("design_tokens", {}),
            recommendations=data.get("recommendations", [])
        )

    def _generate_fallback_layout(
        self,
        content: DocumentContent,
        page_width: int,
        page_height: int,
        document_type: str
    ) -> DocumentLayoutOutput:
        """
        v2.0 Professional Presentation Layout Generator

        Genspark AI Slides 수준의 전문적인 프레젠테이션 레이아웃 생성

        특징:
        - 일관된 1920x1080 페이지 크기
        - PART 번호 시스템
        - 큰 폰트 (제목 48-72px, 본문 20-24px)
        - 카드 기반 레이아웃
        - 푸터 (페이지 번호)
        - 시각적 계층 구조
        """

        # 표준 크기로 강제 (일관성 유지)
        page_width = STANDARD_WIDTH
        page_height = STANDARD_HEIGHT

        # 1. 콘텐츠 분석
        analysis = self._analyze_content(content)

        pages: List[PageLayout] = []
        recommendations: List[str] = []

        # 섹션 데이터 추출
        agenda_section = next((s for s in content.sections if s.get("type") == "agenda"), None)
        decisions_section = next((s for s in content.sections if s.get("type") == "decisions"), None)
        action_section = next((s for s in content.sections if s.get("type") == "action_items"), None)

        # 동적 제목 생성 (콘텐츠 기반)
        dynamic_title = self._generate_dynamic_title(content)

        part_counter = 0

        # 2. 페이지 생성
        for page_plan in analysis.page_distribution:
            page_type = page_plan["page_type"]
            sections = page_plan["sections"]

            if page_type == "cover":
                # 커버 페이지 (OVERVIEW)
                page = self._build_cover_page_v2(
                    content, analysis, dynamic_title, page_width, page_height
                )
            elif "agenda" in sections and "decisions" in sections:
                # 2컬럼: 안건 + 결정사항
                part_counter += 1
                page = self._build_two_column_page_v2(
                    agenda_section, decisions_section,
                    page_width, page_height, part_counter
                )
            elif "agenda" in sections:
                part_counter += 1
                page = self._build_content_page_v2(
                    agenda_section, page_width, page_height,
                    "주요 안건", "agenda", part_counter
                )
            elif "decisions" in sections:
                part_counter += 1
                page = self._build_content_page_v2(
                    decisions_section, page_width, page_height,
                    "결정 사항", "decisions", part_counter
                )
            elif "action_items" in sections:
                part_counter += 1
                page = self._build_action_items_page_v2(
                    action_section, page_width, page_height, part_counter
                )
            elif "summary_detail" in sections:
                part_counter += 1
                page = self._build_summary_page_v2(
                    content, page_width, page_height, part_counter
                )
            else:
                continue

            page.page_number = len(pages) + 1
            pages.append(page)

        # 3. 모든 페이지에 푸터 추가
        total_pages = len(pages)
        for idx, page in enumerate(pages):
            self._add_footer_to_page(page, idx + 1, total_pages, dynamic_title)

        # 4. 권장 사항 생성
        if analysis.summary_complexity == "complex":
            recommendations.append(f"요약이 복잡하여 구조화 처리됨 ({analysis.summary_length}자)")
        if analysis.recommended_pages > 2:
            recommendations.append(f"콘텐츠 양에 따라 {analysis.recommended_pages}페이지로 분배")

        # 디자인 토큰 (v2.0)
        design_tokens = {
            "version": "2.0",
            "page_size": f"{page_width}x{page_height}",
            "colors": COLORS,
            "font_sizes": FONT_SIZE,
            "margins": {
                "large": MARGIN_LARGE,
                "medium": MARGIN_MEDIUM,
                "small": MARGIN_SMALL
            },
            "font_family": "Pretendard, sans-serif",
            "content_analysis": {
                "summary_complexity": analysis.summary_complexity,
                "total_sections": analysis.section_count,
                "page_distribution": analysis.page_distribution
            }
        }

        logger.info(
            f"[DocumentLayoutAgent v2.0] Generated {len(pages)} professional pages "
            f"(title: {dynamic_title})"
        )

        return DocumentLayoutOutput(
            document_type=document_type,
            total_pages=len(pages),
            pages=pages,
            design_tokens=design_tokens,
            recommendations=recommendations
        )

    def _generate_dynamic_title(self, content: DocumentContent) -> str:
        """콘텐츠 기반 동적 제목 생성"""

        # 제목이 있으면 사용
        if content.title and content.title.strip():
            title = content.title.strip()
            # "YouTube Video" 같은 기본값 제거
            if title.lower() not in ["youtube video", "video", "untitled", "제목 없음"]:
                return title

        # 키워드에서 제목 생성
        if content.keywords and len(content.keywords) > 0:
            keywords = content.keywords[:3]
            return " · ".join(keywords) + " 회의"

        # 요약에서 첫 문장 추출
        if content.summary:
            first_sentence = content.summary.split('.')[0].strip()
            if len(first_sentence) > 5 and len(first_sentence) < 50:
                return first_sentence

        # 날짜 기반 기본 제목
        return f"회의 요약 ({datetime.now().strftime('%Y.%m.%d')})"

    def _add_footer_to_page(
        self,
        page: PageLayout,
        current_page: int,
        total_pages: int,
        title: str
    ) -> None:
        """페이지에 푸터 추가"""

        footer_y = STANDARD_HEIGHT - 50

        # 왼쪽: 제목
        page.elements.append(LayoutElement(
            type="text",
            x=MARGIN_LARGE,
            y=footer_y,
            width=600,
            properties={
                "fontSize": FONT_SIZE["footer"],
                "fill": COLORS["text_light"],
            },
            content=title[:50] + "..." if len(title) > 50 else title
        ))

        # 오른쪽: 페이지 번호
        page.elements.append(LayoutElement(
            type="text",
            x=STANDARD_WIDTH - MARGIN_LARGE - 100,
            y=footer_y,
            width=100,
            properties={
                "fontSize": FONT_SIZE["footer"],
                "fill": COLORS["text_light"],
                "align": "right",
            },
            content=f"{current_page} / {total_pages}"
        ))

    def _build_cover_page(
        self,
        content: DocumentContent,
        analysis: ContentAnalysis,
        page_width: int,
        page_height: int,
        margin: int,
        sections: List[str]
    ) -> PageLayout:
        """커버 페이지 생성 (콘텐츠 양에 따라 동적 조정)"""

        content_width = page_width - margin * 2
        elements: List[LayoutElement] = []

        # 헤더 높이: 요약 길이에 따라 조정
        header_height = 180 if analysis.summary_length < 300 else 140

        # 헤더 배경
        elements.append(LayoutElement(
            type="figure",
            x=0,
            y=0,
            width=page_width,
            height=header_height,
            properties={"fill": "#7C3AED"}
        ))

        # 제목 크기: 길이에 따라 조정
        title_size = 42 if len(content.title) < 30 else 36 if len(content.title) < 50 else 28
        elements.append(LayoutElement(
            type="text",
            x=margin,
            y=header_height // 2 - title_size // 2,
            width=content_width,
            properties={"fontSize": title_size, "fontWeight": "bold", "fill": "#FFFFFF"},
            content=content.title
        ))

        # 부제목
        if content.subtitle:
            elements.append(LayoutElement(
                type="text",
                x=margin,
                y=header_height - 40,
                width=content_width,
                properties={"fontSize": 16, "fill": "rgba(255,255,255,0.85)"},
                content=content.subtitle
            ))

        current_y = header_height + 30

        # 요약 섹션 (복잡도에 따라 다르게 처리)
        if content.summary and "summary" in sections:
            current_y = self._render_summary_section(
                elements, content.summary, analysis.summary_complexity,
                margin, current_y, content_width, page_height
            )

        # 키워드 태그 (페이지에 공간이 있고, sections에 포함된 경우)
        if content.keywords and "keywords" in sections and current_y < page_height - 100:
            current_y = self._render_keyword_tags(
                elements, content.keywords, margin, current_y, content_width, page_width
            )

        # 안건 미리보기 (커버에 여유 공간이 있는 경우)
        if "agenda_preview" in sections and current_y < page_height - 200:
            agenda_section = next((s for s in content.sections if s.get("type") == "agenda"), None)
            if agenda_section:
                items = agenda_section.get("items", [])[:3]
                if items:
                    current_y += 20
                    elements.append(LayoutElement(
                        type="text",
                        x=margin,
                        y=current_y,
                        width=content_width,
                        properties={"fontSize": 14, "fontWeight": "bold", "fill": "#6B7280"},
                        content="주요 안건"
                    ))
                    current_y += 25
                    for item in items:
                        elements.append(LayoutElement(
                            type="text",
                            x=margin + 15,
                            y=current_y,
                            width=content_width - 15,
                            properties={"fontSize": 12, "fill": "#374151"},
                            content=f"• {str(item)[:60]}..."
                        ))
                        current_y += 22

        return PageLayout(
            page_number=1,
            page_type="cover",
            layout_type="full_header",
            section_title="Executive Summary",
            elements=elements
        )

    def _render_summary_section(
        self,
        elements: List[LayoutElement],
        summary: str,
        complexity: str,
        margin: int,
        start_y: int,
        content_width: int,
        page_height: int
    ) -> int:
        """요약 섹션 렌더링 (복잡도에 따라 구조화)"""

        current_y = start_y

        # 섹션 제목
        elements.append(LayoutElement(
            type="text",
            x=margin,
            y=current_y,
            width=content_width,
            properties={"fontSize": 18, "fontWeight": "bold", "fill": "#1F2937"},
            content="Executive Summary"
        ))
        current_y += 35

        sentences = summary.split('. ')

        if complexity == "complex" and len(sentences) > 5:
            # 복잡한 요약: 도입/본문/결론 구조화
            intro = '. '.join(sentences[:2]) + '.'
            main_parts = sentences[2:-2]
            conclusion = '. '.join(sentences[-2:])

            # 도입부 (이탤릭 스타일의 리드 문장)
            elements.append(LayoutElement(
                type="text",
                x=margin,
                y=current_y,
                width=content_width,
                properties={"fontSize": 13, "fill": "#6B7280", "fontStyle": "italic"},
                content=intro
            ))
            intro_height = max(40, len(intro) // 80 * 20 + 25)
            current_y += intro_height

            # 본문 (핵심 내용)
            if main_parts:
                main_text = '. '.join(main_parts) + '.'

                # 남은 공간 계산
                available_height = page_height - current_y - 150
                max_main_height = min(available_height, 250)

                elements.append(LayoutElement(
                    type="text",
                    x=margin,
                    y=current_y,
                    width=content_width,
                    height=max_main_height,
                    properties={"fontSize": 13, "fill": "#374151", "lineHeight": 1.6},
                    content=main_text
                ))
                main_height = min(max_main_height, len(main_text) // 70 * 20 + 30)
                current_y += main_height + 15

            # 결론 박스
            if conclusion and current_y < page_height - 120:
                box_height = max(50, len(conclusion) // 80 * 20 + 30)
                elements.append(LayoutElement(
                    type="figure",
                    x=margin,
                    y=current_y,
                    width=content_width,
                    height=box_height,
                    properties={"fill": "#F3F4F6", "cornerRadius": 8}
                ))
                elements.append(LayoutElement(
                    type="text",
                    x=margin + 15,
                    y=current_y + 12,
                    width=content_width - 30,
                    properties={"fontSize": 12, "fill": "#374151", "fontWeight": "500"},
                    content=f"💡 {conclusion}"
                ))
                current_y += box_height + 15

        elif complexity == "moderate":
            # 중간 복잡도: 2단락으로 분리
            mid = len(sentences) // 2
            first_half = '. '.join(sentences[:mid]) + '.'
            second_half = '. '.join(sentences[mid:])

            elements.append(LayoutElement(
                type="text",
                x=margin,
                y=current_y,
                width=content_width,
                properties={"fontSize": 13, "fill": "#374151", "lineHeight": 1.6},
                content=first_half
            ))
            first_height = max(50, len(first_half) // 70 * 20 + 20)
            current_y += first_height

            elements.append(LayoutElement(
                type="text",
                x=margin,
                y=current_y,
                width=content_width,
                properties={"fontSize": 13, "fill": "#374151", "lineHeight": 1.6},
                content=second_half
            ))
            second_height = max(50, len(second_half) // 70 * 20 + 20)
            current_y += second_height

        else:
            # 단순 요약: 그대로 표시
            elements.append(LayoutElement(
                type="text",
                x=margin,
                y=current_y,
                width=content_width,
                properties={"fontSize": 13, "fill": "#374151", "lineHeight": 1.6},
                content=summary
            ))
            summary_height = max(60, len(summary) // 70 * 20 + 20)
            current_y += summary_height

        return current_y + 15

    def _render_keyword_tags(
        self,
        elements: List[LayoutElement],
        keywords: List[str],
        margin: int,
        start_y: int,
        content_width: int,
        page_width: int
    ) -> int:
        """키워드 태그 렌더링"""

        tag_x = margin
        tag_y = start_y
        row_height = 32

        for keyword in keywords[:8]:
            tag_width = len(keyword) * 9 + 24

            # 줄 바꿈 필요 시
            if tag_x + tag_width > page_width - margin:
                tag_x = margin
                tag_y += row_height + 8

            # 태그 배경
            elements.append(LayoutElement(
                type="figure",
                x=tag_x,
                y=tag_y,
                width=tag_width,
                height=28,
                properties={"fill": "#EEF2FF", "cornerRadius": 14}
            ))

            # 태그 텍스트
            elements.append(LayoutElement(
                type="text",
                x=tag_x + 12,
                y=tag_y + 7,
                width=tag_width - 24,
                properties={"fontSize": 11, "fill": "#4F46E5", "fontWeight": "500"},
                content=keyword
            ))

            tag_x += tag_width + 8

        return tag_y + row_height + 10

    def _build_two_column_page(
        self,
        content: DocumentContent,
        agenda_section: Optional[Dict[str, Any]],
        decisions_section: Optional[Dict[str, Any]],
        page_width: int,
        page_height: int,
        margin: int,
        title: str,
        layout_type: str
    ) -> PageLayout:
        """2컬럼 페이지 생성 (안건 + 결정사항)"""

        content_width = page_width - margin * 2
        elements: List[LayoutElement] = []

        # 페이지 헤더
        elements.append(LayoutElement(
            type="figure",
            x=0,
            y=0,
            width=page_width,
            height=70,
            properties={"fill": "#4F46E5"}
        ))
        elements.append(LayoutElement(
            type="text",
            x=margin,
            y=22,
            width=content_width,
            properties={"fontSize": 22, "fontWeight": "bold", "fill": "#FFFFFF"},
            content=title
        ))

        # 컬럼 설정
        col_width = (content_width - 30) // 2
        left_x = margin
        right_x = margin + col_width + 30
        start_y = 90

        # 왼쪽 컬럼: 안건
        if agenda_section:
            items = agenda_section.get("items", [])
            self._render_list_column(
                elements, items, left_x, start_y, col_width, page_height,
                "📋 주요 안건", "#4F46E5", "#F9FAFB"
            )

        # 오른쪽 컬럼: 결정사항
        if decisions_section:
            items = decisions_section.get("items", [])
            self._render_list_column(
                elements, items, right_x, start_y, col_width, page_height,
                "✅ 결정 사항", "#059669", "#ECFDF5"
            )

        return PageLayout(
            page_number=0,
            page_type="content",
            layout_type="two_column",
            section_title=title,
            elements=elements
        )

    def _render_list_column(
        self,
        elements: List[LayoutElement],
        items: List[Any],
        x: int,
        start_y: int,
        width: int,
        page_height: int,
        title: str,
        accent_color: str,
        bg_color: str
    ) -> None:
        """리스트 컬럼 렌더링"""

        current_y = start_y

        # 컬럼 제목
        elements.append(LayoutElement(
            type="text",
            x=x,
            y=current_y,
            width=width,
            properties={"fontSize": 14, "fontWeight": "bold", "fill": accent_color},
            content=title
        ))
        current_y += 28

        # 항목 수에 따른 폰트 크기 및 간격 조정
        item_count = len(items)
        available_height = page_height - current_y - 40

        if item_count <= 4:
            font_size = 12
            item_padding = 12
            min_item_height = 45
        elif item_count <= 6:
            font_size = 11
            item_padding = 8
            min_item_height = 38
        else:
            font_size = 10
            item_padding = 6
            min_item_height = 32

        # 표시할 최대 항목 수 계산
        max_items = min(item_count, int(available_height / (min_item_height + item_padding)))

        for idx, item in enumerate(items[:max_items]):
            item_text = str(item)

            # 텍스트 길이에 따른 높이 계산
            chars_per_line = width // (font_size * 0.6)
            lines = max(1, len(item_text) // int(chars_per_line) + 1)
            item_height = max(min_item_height, lines * (font_size + 4) + 16)

            # 배경
            elements.append(LayoutElement(
                type="figure",
                x=x,
                y=current_y,
                width=width,
                height=item_height,
                properties={"fill": bg_color if idx % 2 == 0 else "#FFFFFF", "cornerRadius": 6}
            ))

            # 번호 뱃지
            badge_size = 20 if font_size >= 11 else 18
            elements.append(LayoutElement(
                type="figure",
                x=x + 8,
                y=current_y + (item_height - badge_size) // 2,
                width=badge_size,
                height=badge_size,
                properties={"fill": accent_color, "cornerRadius": badge_size // 2}
            ))
            elements.append(LayoutElement(
                type="text",
                x=x + 8,
                y=current_y + (item_height - badge_size) // 2 + 3,
                width=badge_size,
                properties={"fontSize": font_size - 1, "fontWeight": "bold", "fill": "#FFFFFF", "align": "center"},
                content=str(idx + 1)
            ))

            # 텍스트
            elements.append(LayoutElement(
                type="text",
                x=x + 8 + badge_size + 10,
                y=current_y + 10,
                width=width - badge_size - 26,
                properties={"fontSize": font_size, "fill": "#374151", "lineHeight": 1.4},
                content=item_text
            ))

            current_y += item_height + item_padding

        # 더 많은 항목이 있음을 표시
        if item_count > max_items:
            elements.append(LayoutElement(
                type="text",
                x=x,
                y=current_y,
                width=width,
                properties={"fontSize": 10, "fill": "#9CA3AF", "align": "center"},
                content=f"외 {item_count - max_items}개 항목..."
            ))

    def _build_list_page(
        self,
        section: Optional[Dict[str, Any]],
        page_width: int,
        page_height: int,
        margin: int,
        title: str,
        accent_color: str,
        layout_type: str
    ) -> PageLayout:
        """단일 섹션 리스트 페이지"""

        if not section:
            return PageLayout(
                page_number=0,
                page_type="content",
                layout_type=layout_type,
                section_title=title,
                elements=[]
            )

        content_width = page_width - margin * 2
        elements: List[LayoutElement] = []
        items = section.get("items", [])

        # 페이지 헤더
        elements.append(LayoutElement(
            type="figure",
            x=0,
            y=0,
            width=page_width,
            height=70,
            properties={"fill": accent_color}
        ))
        elements.append(LayoutElement(
            type="text",
            x=margin,
            y=22,
            width=content_width,
            properties={"fontSize": 22, "fontWeight": "bold", "fill": "#FFFFFF"},
            content=title
        ))

        # 리스트 렌더링
        bg_color = "#F9FAFB" if accent_color == "#4F46E5" else "#ECFDF5"
        self._render_list_column(
            elements, items, margin, 90, content_width, page_height,
            "", accent_color, bg_color
        )

        return PageLayout(
            page_number=0,
            page_type="content",
            layout_type=layout_type,
            section_title=title,
            elements=elements
        )

    def _build_action_items_page(
        self,
        section: Optional[Dict[str, Any]],
        page_width: int,
        page_height: int,
        margin: int,
        layout_type: str
    ) -> PageLayout:
        """액션 아이템 페이지 (카드 그리드)"""

        if not section:
            return PageLayout(
                page_number=0,
                page_type="content",
                layout_type=layout_type,
                section_title="Action Items",
                elements=[]
            )

        content_width = page_width - margin * 2
        elements: List[LayoutElement] = []
        items = section.get("items", [])

        # 페이지 헤더
        elements.append(LayoutElement(
            type="figure",
            x=0,
            y=0,
            width=page_width,
            height=70,
            properties={"fill": "#DC2626"}
        ))
        elements.append(LayoutElement(
            type="text",
            x=margin,
            y=22,
            width=content_width,
            properties={"fontSize": 22, "fontWeight": "bold", "fill": "#FFFFFF"},
            content="Action Items"
        ))

        # 아이템 수에 따른 레이아웃 결정
        item_count = len(items)

        if layout_type == "horizontal_cards" and item_count <= 2:
            # 2개 이하: 가로로 큰 카드
            card_width = content_width
            card_height = 100
            start_y = 90

            for idx, item in enumerate(items):
                card_y = start_y + idx * (card_height + 15)
                self._render_action_card(
                    elements, item, idx, margin, card_y, card_width, card_height
                )

        elif layout_type == "card_grid_2col" and item_count <= 4:
            # 3-4개: 2열 그리드
            card_width = (content_width - 20) // 2
            card_height = 90
            start_y = 90

            for idx, item in enumerate(items):
                row = idx // 2
                col = idx % 2
                card_x = margin + col * (card_width + 20)
                card_y = start_y + row * (card_height + 15)
                self._render_action_card(
                    elements, item, idx, card_x, card_y, card_width, card_height
                )

        else:
            # 5개 이상: 컴팩트 그리드
            card_width = (content_width - 20) // 2
            card_height = 70
            start_y = 90

            for idx, item in enumerate(items[:8]):
                row = idx // 2
                col = idx % 2
                card_x = margin + col * (card_width + 20)
                card_y = start_y + row * (card_height + 12)
                self._render_action_card(
                    elements, item, idx, card_x, card_y, card_width, card_height, compact=True
                )

            # 더 많은 항목 표시
            if item_count > 8:
                elements.append(LayoutElement(
                    type="text",
                    x=margin,
                    y=start_y + 4 * (card_height + 12) + 10,
                    width=content_width,
                    properties={"fontSize": 11, "fill": "#9CA3AF", "align": "center"},
                    content=f"외 {item_count - 8}개 액션 아이템..."
                ))

        return PageLayout(
            page_number=0,
            page_type="content",
            layout_type=layout_type,
            section_title="Action Items",
            elements=elements
        )

    def _render_action_card(
        self,
        elements: List[LayoutElement],
        item: Any,
        idx: int,
        x: int,
        y: int,
        width: int,
        height: int,
        compact: bool = False
    ) -> None:
        """액션 아이템 카드 렌더링"""

        # 카드 배경
        elements.append(LayoutElement(
            type="figure",
            x=x,
            y=y,
            width=width,
            height=height,
            properties={"fill": "#FEF2F2", "cornerRadius": 8, "stroke": "#FECACA", "strokeWidth": 1}
        ))

        # 우선순위 뱃지
        badge_size = 22 if not compact else 18
        badge_y = y + 10 if not compact else y + 8
        elements.append(LayoutElement(
            type="figure",
            x=x + 10,
            y=badge_y,
            width=badge_size,
            height=badge_size,
            properties={"fill": "#DC2626", "cornerRadius": 4}
        ))
        elements.append(LayoutElement(
            type="text",
            x=x + 10,
            y=badge_y + 4,
            width=badge_size,
            properties={"fontSize": 11 if not compact else 9, "fontWeight": "bold", "fill": "#FFFFFF", "align": "center"},
            content=str(idx + 1)
        ))

        # 텍스트
        item_text = str(item)
        max_len = 100 if not compact else 60
        if len(item_text) > max_len:
            item_text = item_text[:max_len - 3] + "..."

        text_x = x + 10 + badge_size + 10
        text_y = y + (12 if not compact else 10)
        text_width = width - badge_size - 35

        elements.append(LayoutElement(
            type="text",
            x=text_x,
            y=text_y,
            width=text_width,
            properties={
                "fontSize": 12 if not compact else 10,
                "fill": "#991B1B",
                "lineHeight": 1.4
            },
            content=item_text
        ))

    def _build_summary_detail_page(
        self,
        content: DocumentContent,
        page_width: int,
        page_height: int,
        margin: int
    ) -> PageLayout:
        """요약 상세 페이지 (긴 요약용)"""

        content_width = page_width - margin * 2
        elements: List[LayoutElement] = []

        # 페이지 헤더
        elements.append(LayoutElement(
            type="figure",
            x=0,
            y=0,
            width=page_width,
            height=70,
            properties={"fill": "#7C3AED"}
        ))
        elements.append(LayoutElement(
            type="text",
            x=margin,
            y=22,
            width=content_width,
            properties={"fontSize": 22, "fontWeight": "bold", "fill": "#FFFFFF"},
            content="Summary Details"
        ))

        if content.summary:
            sentences = content.summary.split('. ')
            current_y = 90

            # 요약을 섹션으로 분할
            sections = []
            current_section = []

            for sentence in sentences:
                current_section.append(sentence)
                if len(current_section) >= 3:
                    sections.append('. '.join(current_section) + '.')
                    current_section = []

            if current_section:
                sections.append('. '.join(current_section))

            # 각 섹션 렌더링
            for section_text in sections:
                if current_y > page_height - 100:
                    break

                section_height = max(80, len(section_text) // 70 * 18 + 30)

                elements.append(LayoutElement(
                    type="figure",
                    x=margin,
                    y=current_y,
                    width=content_width,
                    height=section_height,
                    properties={"fill": "#F9FAFB", "cornerRadius": 8}
                ))

                elements.append(LayoutElement(
                    type="text",
                    x=margin + 15,
                    y=current_y + 15,
                    width=content_width - 30,
                    properties={"fontSize": 12, "fill": "#374151", "lineHeight": 1.6},
                    content=section_text
                ))

                current_y += section_height + 15

        return PageLayout(
            page_number=0,
            page_type="content",
            layout_type="summary_detail",
            section_title="Summary Details",
            elements=elements
        )

    def _generate_sns_ad_layout(
        self,
        content: DocumentContent,
        page_width: int,
        page_height: int,
        platform: str = "instagram"
    ) -> DocumentLayoutOutput:
        """SNS 광고용 레이아웃 생성"""

        # 플랫폼별 크기 프리셋
        platform_sizes = {
            "instagram_feed": (1080, 1080),
            "instagram_story": (1080, 1920),
            "facebook_feed": (1200, 628),
            "facebook_story": (1080, 1920),
            "youtube_thumbnail": (1280, 720),
        }

        if platform in platform_sizes:
            page_width, page_height = platform_sizes[platform]

        margin = 40
        content_width = page_width - margin * 2

        elements: List[LayoutElement] = []

        # 그라데이션 배경
        elements.append(LayoutElement(
            type="figure",
            x=0,
            y=0,
            width=page_width,
            height=page_height,
            properties={"fill": "linear-gradient(180deg, #667eea 0%, #764ba2 100%)"}
        ))

        # 메인 텍스트 (중앙 배치)
        center_y = page_height // 2 - 80

        # 헤드라인
        headline = content.title
        headline_size = 48 if len(headline) < 20 else 36 if len(headline) < 40 else 28

        elements.append(LayoutElement(
            type="text",
            x=margin,
            y=center_y,
            width=content_width,
            properties={
                "fontSize": headline_size,
                "fontWeight": "bold",
                "fill": "#FFFFFF",
                "align": "center",
                "shadow": "0 2px 4px rgba(0,0,0,0.3)"
            },
            content=headline
        ))

        # 서브헤드라인
        if content.subtitle:
            elements.append(LayoutElement(
                type="text",
                x=margin,
                y=center_y + headline_size + 20,
                width=content_width,
                properties={
                    "fontSize": 18,
                    "fill": "rgba(255,255,255,0.9)",
                    "align": "center"
                },
                content=content.subtitle
            ))

        # CTA 버튼
        cta_section = next((s for s in content.sections if s.get("type") == "cta"), None)
        if cta_section:
            cta_text = cta_section.get("items", ["자세히 보기"])[0]
            btn_width = len(cta_text) * 14 + 60
            btn_x = (page_width - btn_width) // 2

            elements.append(LayoutElement(
                type="figure",
                x=btn_x,
                y=page_height - 150,
                width=btn_width,
                height=50,
                properties={"fill": "#FFFFFF", "cornerRadius": 25}
            ))
            elements.append(LayoutElement(
                type="text",
                x=btn_x,
                y=page_height - 135,
                width=btn_width,
                properties={
                    "fontSize": 16,
                    "fontWeight": "bold",
                    "fill": "#764ba2",
                    "align": "center"
                },
                content=cta_text
            ))

        # 로고/브랜드 영역 (하단)
        brand_section = next((s for s in content.sections if s.get("type") == "brand"), None)
        if brand_section:
            brand_name = brand_section.get("items", [""])[0]
            elements.append(LayoutElement(
                type="text",
                x=margin,
                y=page_height - 60,
                width=content_width,
                properties={
                    "fontSize": 14,
                    "fill": "rgba(255,255,255,0.7)",
                    "align": "center"
                },
                content=brand_name
            ))

        page = PageLayout(
            page_number=1,
            page_type="sns_ad",
            layout_type="centered",
            section_title=platform,
            elements=elements
        )

        return DocumentLayoutOutput(
            document_type="sns_ad",
            total_pages=1,
            pages=[page],
            design_tokens={
                "primary_gradient": "linear-gradient(180deg, #667eea 0%, #764ba2 100%)",
                "text_color": "#FFFFFF",
                "cta_color": "#764ba2",
                "platform": platform,
                "size": f"{page_width}x{page_height}"
            },
            recommendations=["SNS 광고는 3초 내 주목을 끌어야 함", "텍스트는 이미지의 20% 이하 권장"]
        )

    def _generate_product_detail_layout(
        self,
        content: DocumentContent,
        page_width: int,
        page_height: int
    ) -> DocumentLayoutOutput:
        """상품 상세페이지용 레이아웃 생성"""

        margin = 60
        content_width = page_width - margin * 2
        pages: List[PageLayout] = []

        # === 섹션 1: 히어로 (상품 이미지 + 제목) ===
        hero_elements: List[LayoutElement] = []

        # 배경
        hero_elements.append(LayoutElement(
            type="figure",
            x=0,
            y=0,
            width=page_width,
            height=page_height,
            properties={"fill": "#FFFFFF"}
        ))

        # 상품 이미지 영역 (좌측 60%)
        image_width = int(page_width * 0.6)
        hero_elements.append(LayoutElement(
            type="figure",
            x=0,
            y=0,
            width=image_width,
            height=page_height,
            properties={"fill": "#F3F4F6", "placeholder": "product_image"}
        ))

        # 상품 정보 (우측 40%)
        info_x = image_width + 40
        info_width = page_width - image_width - 80
        info_y = 100

        # 브랜드명
        brand_section = next((s for s in content.sections if s.get("type") == "brand"), None)
        if brand_section:
            hero_elements.append(LayoutElement(
                type="text",
                x=info_x,
                y=info_y,
                width=info_width,
                properties={"fontSize": 14, "fill": "#6B7280", "fontWeight": "bold"},
                content=brand_section.get("items", [""])[0]
            ))
            info_y += 30

        # 상품명
        hero_elements.append(LayoutElement(
            type="text",
            x=info_x,
            y=info_y,
            width=info_width,
            properties={"fontSize": 32, "fill": "#1F2937", "fontWeight": "bold"},
            content=content.title
        ))
        info_y += 60

        # 가격
        price_section = next((s for s in content.sections if s.get("type") == "price"), None)
        if price_section:
            price = price_section.get("items", [""])[0]
            hero_elements.append(LayoutElement(
                type="text",
                x=info_x,
                y=info_y,
                width=info_width,
                properties={"fontSize": 28, "fill": "#DC2626", "fontWeight": "bold"},
                content=price
            ))
            info_y += 50

        # 간단 설명
        if content.subtitle:
            hero_elements.append(LayoutElement(
                type="text",
                x=info_x,
                y=info_y,
                width=info_width,
                properties={"fontSize": 14, "fill": "#4B5563", "lineHeight": 1.6},
                content=content.subtitle
            ))
            info_y += 80

        # 구매 버튼
        hero_elements.append(LayoutElement(
            type="figure",
            x=info_x,
            y=info_y,
            width=info_width,
            height=50,
            properties={"fill": "#1F2937", "cornerRadius": 8}
        ))
        hero_elements.append(LayoutElement(
            type="text",
            x=info_x,
            y=info_y + 15,
            width=info_width,
            properties={"fontSize": 16, "fill": "#FFFFFF", "fontWeight": "bold", "align": "center"},
            content="구매하기"
        ))

        pages.append(PageLayout(
            page_number=1,
            page_type="hero",
            layout_type="split",
            section_title="상품 정보",
            elements=hero_elements
        ))

        # === 섹션 2: 상품 특징 ===
        features_section = next((s for s in content.sections if s.get("type") == "features"), None)
        if features_section:
            feature_elements: List[LayoutElement] = []

            # 섹션 제목
            feature_elements.append(LayoutElement(
                type="text",
                x=margin,
                y=60,
                width=content_width,
                properties={"fontSize": 28, "fill": "#1F2937", "fontWeight": "bold", "align": "center"},
                content="주요 특징"
            ))

            # 특징 카드 (3열)
            features = features_section.get("items", [])
            card_width = (content_width - 40) // 3
            card_height = 200

            for idx, feature in enumerate(features[:6]):
                row = idx // 3
                col = idx % 3
                card_x = margin + col * (card_width + 20)
                card_y = 120 + row * (card_height + 20)

                # 카드 배경
                feature_elements.append(LayoutElement(
                    type="figure",
                    x=card_x,
                    y=card_y,
                    width=card_width,
                    height=card_height,
                    properties={"fill": "#F9FAFB", "cornerRadius": 12}
                ))

                # 아이콘 영역
                feature_elements.append(LayoutElement(
                    type="figure",
                    x=card_x + (card_width - 50) // 2,
                    y=card_y + 20,
                    width=50,
                    height=50,
                    properties={"fill": "#E0E7FF", "cornerRadius": 25}
                ))

                # 특징 텍스트
                feature_text = str(feature) if isinstance(feature, str) else feature.get("text", "")
                feature_elements.append(LayoutElement(
                    type="text",
                    x=card_x + 15,
                    y=card_y + 90,
                    width=card_width - 30,
                    properties={"fontSize": 14, "fill": "#374151", "align": "center", "lineHeight": 1.5},
                    content=feature_text
                ))

            pages.append(PageLayout(
                page_number=2,
                page_type="content",
                layout_type="card_grid",
                section_title="주요 특징",
                elements=feature_elements
            ))

        # === 섹션 3: 상세 설명 ===
        if content.summary:
            detail_elements: List[LayoutElement] = []

            detail_elements.append(LayoutElement(
                type="text",
                x=margin,
                y=60,
                width=content_width,
                properties={"fontSize": 28, "fill": "#1F2937", "fontWeight": "bold", "align": "center"},
                content="상세 설명"
            ))

            detail_elements.append(LayoutElement(
                type="text",
                x=margin,
                y=120,
                width=content_width,
                properties={"fontSize": 14, "fill": "#4B5563", "lineHeight": 1.8},
                content=content.summary
            ))

            pages.append(PageLayout(
                page_number=len(pages) + 1,
                page_type="content",
                layout_type="full_width",
                section_title="상세 설명",
                elements=detail_elements
            ))

        return DocumentLayoutOutput(
            document_type="product_detail",
            total_pages=len(pages),
            pages=pages,
            design_tokens={
                "primary_color": "#1F2937",
                "accent_color": "#DC2626",
                "background": "#FFFFFF",
                "card_background": "#F9FAFB"
            },
            recommendations=["상품 이미지는 고해상도 권장", "특징은 3-6개가 적정"]
        )

    def _generate_brief_layout(
        self,
        content: DocumentContent,
        page_width: int,
        page_height: int
    ) -> DocumentLayoutOutput:
        """캠페인 브리프용 레이아웃 생성"""

        margin = 60
        content_width = page_width - margin * 2
        pages: List[PageLayout] = []

        # === PAGE 1: 브리프 개요 ===
        cover_elements: List[LayoutElement] = []

        # 헤더
        cover_elements.append(LayoutElement(
            type="figure",
            x=0,
            y=0,
            width=page_width,
            height=120,
            properties={"fill": "#10B981"}
        ))
        cover_elements.append(LayoutElement(
            type="text",
            x=margin,
            y=40,
            width=content_width,
            properties={"fontSize": 36, "fontWeight": "bold", "fill": "#FFFFFF"},
            content="Campaign Brief"
        ))

        current_y = 150

        # 캠페인 제목
        cover_elements.append(LayoutElement(
            type="text",
            x=margin,
            y=current_y,
            width=content_width,
            properties={"fontSize": 28, "fontWeight": "bold", "fill": "#1F2937"},
            content=content.title
        ))
        current_y += 50

        # 브리프 섹션들
        brief_fields = [
            ("background", "배경 및 목적", "#3B82F6"),
            ("target_audience", "타겟 오디언스", "#8B5CF6"),
            ("key_message", "핵심 메시지", "#EC4899"),
            ("tone_manner", "톤앤매너", "#F59E0B"),
            ("mandatory_elements", "필수 포함 요소", "#EF4444"),
        ]

        for section_type, label, color in brief_fields:
            section = next((s for s in content.sections if s.get("type") == section_type), None)
            if section:
                items = section.get("items", [])
                if items:
                    # 섹션 헤더
                    cover_elements.append(LayoutElement(
                        type="figure",
                        x=margin,
                        y=current_y,
                        width=8,
                        height=24,
                        properties={"fill": color, "cornerRadius": 4}
                    ))
                    cover_elements.append(LayoutElement(
                        type="text",
                        x=margin + 20,
                        y=current_y,
                        width=content_width - 20,
                        properties={"fontSize": 14, "fontWeight": "bold", "fill": color},
                        content=label
                    ))
                    current_y += 30

                    # 내용
                    item_text = items[0] if isinstance(items[0], str) else str(items[0])
                    cover_elements.append(LayoutElement(
                        type="text",
                        x=margin + 20,
                        y=current_y,
                        width=content_width - 20,
                        properties={"fontSize": 13, "fill": "#4B5563", "lineHeight": 1.5},
                        content=item_text
                    ))
                    current_y += max(40, len(item_text) // 60 * 20 + 20)

        pages.append(PageLayout(
            page_number=1,
            page_type="cover",
            layout_type="structured",
            section_title="Campaign Brief",
            elements=cover_elements
        ))

        return DocumentLayoutOutput(
            document_type="brief",
            total_pages=len(pages),
            pages=pages,
            design_tokens={
                "primary_color": "#10B981",
                "section_colors": {
                    "background": "#3B82F6",
                    "target": "#8B5CF6",
                    "message": "#EC4899",
                    "tone": "#F59E0B",
                    "mandatory": "#EF4444"
                }
            },
            recommendations=["브리프는 간결하고 명확하게 작성", "핵심 메시지는 한 문장으로"]
        )

    # =========================================================================
    # v2.0 Professional Page Builders
    # =========================================================================

    def _build_cover_page_v2(
        self,
        content: DocumentContent,
        analysis: ContentAnalysis,
        dynamic_title: str,
        page_width: int,
        page_height: int
    ) -> PageLayout:
        """
        v3.0 커버 페이지 - 전체 공간 활용, 큰 폰트

        특징:
        - 96px 대형 제목
        - 페이지 전체를 채우는 레이아웃
        - 2열 구성 (좌: 제목+요약, 우: 키워드+날짜)
        - 요약 카드가 페이지 하단까지 확장
        """

        elements: List[LayoutElement] = []
        content_width = page_width - MARGIN_LARGE * 2

        # === 배경 ===
        elements.append(LayoutElement(
            type="figure",
            x=0,
            y=0,
            width=page_width,
            height=page_height,
            properties={"fill": COLORS["background"]}
        ))

        # === 상단 컬러 바 (파란색 액센트) ===
        elements.append(LayoutElement(
            type="figure",
            x=0,
            y=0,
            width=page_width,
            height=16,
            properties={"fill": COLORS["primary"]}
        ))

        # === OVERVIEW 라벨 ===
        elements.append(LayoutElement(
            type="text",
            x=MARGIN_LARGE,
            y=60,
            width=300,
            properties={
                "fontSize": FONT_SIZE["part_number"],
                "fontWeight": "bold",
                "fill": COLORS["primary"],
                "letterSpacing": 6,
            },
            content="OVERVIEW"
        ))

        # === 날짜 (우측 상단) ===
        date_str = datetime.now().strftime("%Y년 %m월 %d일")
        elements.append(LayoutElement(
            type="text",
            x=page_width - MARGIN_LARGE - 300,
            y=70,
            width=300,
            properties={
                "fontSize": FONT_SIZE["caption"],
                "fill": COLORS["text_light"],
                "align": "right",
            },
            content=date_str
        ))

        # === 메인 제목 (96px 대형 폰트) ===
        title_y = 130
        elements.append(LayoutElement(
            type="text",
            x=MARGIN_LARGE,
            y=title_y,
            width=content_width,
            properties={
                "fontSize": FONT_SIZE["hero_title"],
                "fontWeight": "bold",
                "fill": COLORS["text_primary"],
                "lineHeight": 1.15,
            },
            content=dynamic_title
        ))

        # === 부제목 (있으면) ===
        current_y = title_y + 130
        if content.subtitle:
            elements.append(LayoutElement(
                type="text",
                x=MARGIN_LARGE,
                y=current_y,
                width=content_width,
                properties={
                    "fontSize": FONT_SIZE["section_title"],
                    "fill": COLORS["text_secondary"],
                },
                content=content.subtitle
            ))
            current_y += 70

        # === 요약 카드 (페이지 하단까지 확장) ===
        if content.summary:
            current_y += 40
            # 요약 카드가 페이지 하단(footer 공간 제외)까지 채움
            summary_height = page_height - current_y - 100  # 100px footer 공간

            # 카드 배경 (전체 너비, 큰 높이)
            elements.append(LayoutElement(
                type="figure",
                x=MARGIN_LARGE,
                y=current_y,
                width=content_width,
                height=summary_height,
                properties={
                    "fill": COLORS["card_bg"],
                    "cornerRadius": 24,
                }
            ))

            # 아이콘 (더 큰 크기)
            elements.append(LayoutElement(
                type="text",
                x=MARGIN_LARGE + 40,
                y=current_y + 40,
                width=60,
                properties={
                    "fontSize": 48,
                },
                content=SECTION_ICONS["summary"]
            ))

            # "Executive Summary" 라벨
            elements.append(LayoutElement(
                type="text",
                x=MARGIN_LARGE + 110,
                y=current_y + 50,
                width=400,
                properties={
                    "fontSize": FONT_SIZE["body_large"],
                    "fontWeight": "bold",
                    "fill": COLORS["primary"],
                },
                content="Executive Summary"
            ))

            # 요약 텍스트 (더 큰 폰트, 여러 줄)
            summary_text = content.summary
            # 긴 요약도 표시 가능 (카드가 크므로)
            if len(summary_text) > 800:
                summary_text = summary_text[:800] + "..."

            elements.append(LayoutElement(
                type="text",
                x=MARGIN_LARGE + 40,
                y=current_y + 120,
                width=content_width - 80,
                height=summary_height - 200,
                properties={
                    "fontSize": FONT_SIZE["body"],
                    "fill": COLORS["text_secondary"],
                    "lineHeight": 1.7,
                },
                content=summary_text
            ))

            # === 키워드 태그 (요약 카드 하단에 배치) ===
            if content.keywords and len(content.keywords) > 0:
                tag_y = current_y + summary_height - 80
                tag_x = MARGIN_LARGE + 40

                for keyword in content.keywords[:8]:
                    tag_width = len(keyword) * 16 + 48  # 더 큰 태그

                    if tag_x + tag_width > page_width - MARGIN_LARGE - 40:
                        break  # 한 줄만 표시

                    # 태그 배경
                    elements.append(LayoutElement(
                        type="figure",
                        x=tag_x,
                        y=tag_y,
                        width=tag_width,
                        height=48,
                        properties={
                            "fill": "#DBEAFE",
                            "cornerRadius": 24,
                        }
                    ))

                    # 태그 텍스트
                    elements.append(LayoutElement(
                        type="text",
                        x=tag_x + 24,
                        y=tag_y + 12,
                        width=tag_width - 48,
                        properties={
                            "fontSize": FONT_SIZE["body_small"],
                            "fill": COLORS["primary_dark"],
                            "fontWeight": "600",
                        },
                        content=keyword
                    ))

                    tag_x += tag_width + 16

        return PageLayout(
            page_number=1,
            page_type="cover",
            layout_type="professional_cover",
            section_title="Overview",
            elements=elements
        )

    def _build_content_page_v2(
        self,
        section: Optional[Dict[str, Any]],
        page_width: int,
        page_height: int,
        title: str,
        section_type: str,
        part_number: int
    ) -> PageLayout:
        """
        v3.0 콘텐츠 페이지 - 2열 카드 레이아웃으로 공간 최대 활용

        특징:
        - PART 번호 (40px)
        - 큰 섹션 제목 (64px)
        - 2열 카드 레이아웃 (항목이 4개 이상일 때)
        - 카드가 페이지를 가득 채움
        """

        elements: List[LayoutElement] = []
        content_width = page_width - MARGIN_LARGE * 2

        if not section:
            return PageLayout(
                page_number=0,
                page_type="content",
                layout_type="card_list",
                section_title=title,
                elements=elements
            )

        items = section.get("items", [])
        icon = SECTION_ICONS.get(section_type, SECTION_ICONS["default"])
        accent_color = self._get_section_color(section_type)

        # === 배경 ===
        elements.append(LayoutElement(
            type="figure",
            x=0,
            y=0,
            width=page_width,
            height=page_height,
            properties={"fill": COLORS["background"]}
        ))

        # === 상단 컬러 바 ===
        elements.append(LayoutElement(
            type="figure",
            x=0,
            y=0,
            width=page_width,
            height=16,
            properties={"fill": accent_color}
        ))

        # === PART 라벨 ===
        elements.append(LayoutElement(
            type="text",
            x=MARGIN_LARGE,
            y=50,
            width=300,
            properties={
                "fontSize": FONT_SIZE["part_number"],
                "fontWeight": "bold",
                "fill": accent_color,
                "letterSpacing": 4,
            },
            content=f"PART {part_number}"
        ))

        # === 섹션 제목 (아이콘 + 텍스트) ===
        elements.append(LayoutElement(
            type="text",
            x=MARGIN_LARGE,
            y=110,
            width=80,
            properties={
                "fontSize": 56,
            },
            content=icon
        ))

        elements.append(LayoutElement(
            type="text",
            x=MARGIN_LARGE + 80,
            y=115,
            width=content_width - 80,
            properties={
                "fontSize": FONT_SIZE["page_title"],
                "fontWeight": "bold",
                "fill": COLORS["text_primary"],
            },
            content=title
        ))

        # === 카드 영역 (2열 레이아웃) ===
        card_start_y = 210
        card_gap = 24
        col_gap = 32

        # 2열 레이아웃 결정 (4개 이상이면 2열)
        use_two_columns = len(items) >= 4

        if use_two_columns:
            col_width = (content_width - col_gap) // 2
            max_items = min(len(items), 8)  # 최대 8개 (4행 x 2열)
            rows = (max_items + 1) // 2
        else:
            col_width = content_width
            max_items = min(len(items), 4)
            rows = max_items

        # 카드 높이 계산 (남은 공간을 채우도록)
        available_height = page_height - card_start_y - 80  # footer 공간
        card_height = (available_height - (rows - 1) * card_gap) // rows
        card_height = max(120, min(200, card_height))  # 120~200px 범위

        current_y = card_start_y

        for idx, item in enumerate(items[:max_items]):
            item_text = str(item)

            if use_two_columns:
                row = idx // 2
                col = idx % 2
                card_x = MARGIN_LARGE + col * (col_width + col_gap)
                card_y = card_start_y + row * (card_height + card_gap)
            else:
                card_x = MARGIN_LARGE
                card_y = card_start_y + idx * (card_height + card_gap)

            # 카드 배경
            elements.append(LayoutElement(
                type="figure",
                x=card_x,
                y=card_y,
                width=col_width,
                height=card_height,
                properties={
                    "fill": COLORS["card_bg"],
                    "cornerRadius": 16,
                }
            ))

            # 번호 뱃지 (더 크게)
            badge_size = 56
            elements.append(LayoutElement(
                type="figure",
                x=card_x + 24,
                y=card_y + (card_height - badge_size) // 2,
                width=badge_size,
                height=badge_size,
                properties={
                    "fill": accent_color,
                    "cornerRadius": badge_size // 2,
                }
            ))
            elements.append(LayoutElement(
                type="text",
                x=card_x + 24,
                y=card_y + (card_height - badge_size) // 2 + 14,
                width=badge_size,
                properties={
                    "fontSize": FONT_SIZE["body"],
                    "fontWeight": "bold",
                    "fill": "#FFFFFF",
                    "align": "center",
                },
                content=str(idx + 1)
            ))

            # 항목 텍스트 (더 큰 폰트)
            text_x = card_x + 24 + badge_size + 24
            text_width = col_width - badge_size - 80

            # 텍스트 길이에 따른 처리
            max_len = 100 if use_two_columns else 200
            if len(item_text) > max_len:
                item_text = item_text[:max_len - 3] + "..."

            elements.append(LayoutElement(
                type="text",
                x=text_x,
                y=card_y + (card_height - FONT_SIZE["body"]) // 2,
                width=text_width,
                properties={
                    "fontSize": FONT_SIZE["body"],
                    "fill": COLORS["text_primary"],
                    "lineHeight": 1.5,
                },
                content=item_text
            ))

        # 더 많은 항목 표시
        if len(items) > max_items:
            final_y = card_start_y + rows * (card_height + card_gap) + 10
            elements.append(LayoutElement(
                type="text",
                x=MARGIN_LARGE,
                y=final_y,
                width=content_width,
                properties={
                    "fontSize": FONT_SIZE["caption"],
                    "fill": COLORS["text_light"],
                    "align": "center",
                },
                content=f"외 {len(items) - max_items}개 항목..."
            ))

        return PageLayout(
            page_number=0,
            page_type="content",
            layout_type="card_list",
            section_title=title,
            elements=elements
        )

    def _build_two_column_page_v2(
        self,
        agenda_section: Optional[Dict[str, Any]],
        decisions_section: Optional[Dict[str, Any]],
        page_width: int,
        page_height: int,
        part_number: int
    ) -> PageLayout:
        """
        v3.0 2컬럼 페이지 - 안건 + 결정사항 (전체 공간 활용)

        특징:
        - 좌/우 분리 레이아웃
        - 각 컬럼별 색상 구분
        - 카드가 페이지 하단까지 채움
        - 큰 폰트
        """

        elements: List[LayoutElement] = []
        col_gap = 48  # 컬럼 간 간격
        col_width = (page_width - MARGIN_LARGE * 2 - col_gap) // 2

        # === 배경 ===
        elements.append(LayoutElement(
            type="figure",
            x=0,
            y=0,
            width=page_width,
            height=page_height,
            properties={"fill": COLORS["background"]}
        ))

        # === 상단 헤더 영역 (더 크게) ===
        header_height = 180
        elements.append(LayoutElement(
            type="figure",
            x=0,
            y=0,
            width=page_width,
            height=header_height,
            properties={"fill": COLORS["primary_dark"]}
        ))

        # PART 라벨
        elements.append(LayoutElement(
            type="text",
            x=MARGIN_LARGE,
            y=40,
            width=300,
            properties={
                "fontSize": FONT_SIZE["body_small"],
                "fontWeight": "bold",
                "fill": "rgba(255,255,255,0.7)",
                "letterSpacing": 4,
            },
            content=f"PART {part_number}"
        ))

        # 페이지 제목 (더 큰 폰트)
        elements.append(LayoutElement(
            type="text",
            x=MARGIN_LARGE,
            y=90,
            width=page_width - MARGIN_LARGE * 2,
            properties={
                "fontSize": FONT_SIZE["page_title"],
                "fontWeight": "bold",
                "fill": "#FFFFFF",
            },
            content="주요 안건 & 결정 사항"
        ))

        # === 왼쪽 컬럼: 안건 ===
        left_x = MARGIN_LARGE
        col_start_y = header_height + 30

        # 컬럼 제목 (더 큰 폰트)
        elements.append(LayoutElement(
            type="text",
            x=left_x,
            y=col_start_y,
            width=col_width,
            properties={
                "fontSize": FONT_SIZE["section_title"],
                "fontWeight": "bold",
                "fill": COLORS["primary"],
            },
            content=f"{SECTION_ICONS['agenda']} 주요 안건"
        ))

        if agenda_section:
            items = agenda_section.get("items", [])
            self._render_column_items_v2(
                elements, items, left_x, col_start_y + 80, col_width,
                page_height - col_start_y - 160, COLORS["primary"]
            )

        # === 오른쪽 컬럼: 결정사항 ===
        right_x = MARGIN_LARGE + col_width + col_gap

        # 컬럼 제목
        elements.append(LayoutElement(
            type="text",
            x=right_x,
            y=col_start_y,
            width=col_width,
            properties={
                "fontSize": FONT_SIZE["section_title"],
                "fontWeight": "bold",
                "fill": COLORS["success"],
            },
            content=f"{SECTION_ICONS['decisions']} 결정 사항"
        ))

        if decisions_section:
            items = decisions_section.get("items", [])
            self._render_column_items_v2(
                elements, items, right_x, col_start_y + 80, col_width,
                page_height - col_start_y - 160, COLORS["success"]
            )

        return PageLayout(
            page_number=0,
            page_type="content",
            layout_type="two_column",
            section_title="Key Points & Decisions",
            elements=elements
        )

    def _render_column_items_v2(
        self,
        elements: List[LayoutElement],
        items: List[Any],
        x: int,
        start_y: int,
        width: int,
        available_height: int,
        accent_color: str
    ) -> None:
        """v3.0 컬럼 항목 렌더링 - 더 큰 카드, 더 큰 폰트"""

        max_items = min(len(items), 5)  # 최대 5개
        item_gap = 20
        item_height = (available_height - (max_items - 1) * item_gap) // max_items
        item_height = max(100, min(160, item_height))  # 100~160px 범위

        current_y = start_y

        for idx, item in enumerate(items[:max_items]):
            item_text = str(item)
            if len(item_text) > 100:
                item_text = item_text[:97] + "..."

            # 항목 배경 (더 크고 둥근 모서리)
            elements.append(LayoutElement(
                type="figure",
                x=x,
                y=current_y,
                width=width,
                height=item_height,
                properties={
                    "fill": COLORS["card_bg"],
                    "cornerRadius": 16,
                }
            ))

            # 번호 뱃지 (더 크게)
            badge_size = 48
            elements.append(LayoutElement(
                type="figure",
                x=x + 20,
                y=current_y + (item_height - badge_size) // 2,
                width=badge_size,
                height=badge_size,
                properties={
                    "fill": accent_color,
                    "cornerRadius": 12,
                }
            ))
            elements.append(LayoutElement(
                type="text",
                x=x + 20,
                y=current_y + (item_height - badge_size) // 2 + 10,
                width=badge_size,
                properties={
                    "fontSize": FONT_SIZE["body_small"],
                    "fontWeight": "bold",
                    "fill": "#FFFFFF",
                    "align": "center",
                },
                content=str(idx + 1)
            ))

            # 텍스트 (더 큰 폰트)
            elements.append(LayoutElement(
                type="text",
                x=x + 20 + badge_size + 20,
                y=current_y + (item_height - FONT_SIZE["body_small"]) // 2,
                width=width - badge_size - 70,
                properties={
                    "fontSize": FONT_SIZE["body_small"],
                    "fill": COLORS["text_primary"],
                    "lineHeight": 1.5,
                },
                content=item_text
            ))

            current_y += item_height + item_gap

    def _build_action_items_page_v2(
        self,
        section: Optional[Dict[str, Any]],
        page_width: int,
        page_height: int,
        part_number: int
    ) -> PageLayout:
        """
        v3.0 액션 아이템 페이지 - 2열 큰 카드

        특징:
        - 2열 레이아웃으로 페이지 가득 채움
        - 더 큰 카드 (높이 최대화)
        - 큰 폰트
        - 담당자 정보
        """

        elements: List[LayoutElement] = []
        content_width = page_width - MARGIN_LARGE * 2

        if not section:
            return PageLayout(
                page_number=0,
                page_type="content",
                layout_type="action_cards",
                section_title="Action Items",
                elements=elements
            )

        items = section.get("items", [])

        # === 배경 ===
        elements.append(LayoutElement(
            type="figure",
            x=0,
            y=0,
            width=page_width,
            height=page_height,
            properties={"fill": COLORS["background"]}
        ))

        # === 상단 컬러 바 (빨간색) ===
        elements.append(LayoutElement(
            type="figure",
            x=0,
            y=0,
            width=page_width,
            height=16,
            properties={"fill": COLORS["danger"]}
        ))

        # === PART 라벨 ===
        elements.append(LayoutElement(
            type="text",
            x=MARGIN_LARGE,
            y=50,
            width=300,
            properties={
                "fontSize": FONT_SIZE["part_number"],
                "fontWeight": "bold",
                "fill": COLORS["danger"],
                "letterSpacing": 4,
            },
            content=f"PART {part_number}"
        ))

        # === 섹션 제목 ===
        elements.append(LayoutElement(
            type="text",
            x=MARGIN_LARGE,
            y=110,
            width=80,
            properties={"fontSize": 56},
            content=SECTION_ICONS["action_items"]
        ))

        elements.append(LayoutElement(
            type="text",
            x=MARGIN_LARGE + 80,
            y=115,
            width=content_width - 80,
            properties={
                "fontSize": FONT_SIZE["page_title"],
                "fontWeight": "bold",
                "fill": COLORS["text_primary"],
            },
            content="Action Items"
        ))

        # === 카드 그리드 (2열) ===
        card_start_y = 210
        card_gap = 28
        col_gap = 40

        # 카드 크기 계산 (페이지를 가득 채움)
        card_width = (content_width - col_gap) // 2
        max_items = min(len(items), 6)
        rows = (max_items + 1) // 2

        available_height = page_height - card_start_y - 80
        card_height = (available_height - (rows - 1) * card_gap) // rows
        card_height = max(150, min(250, card_height))  # 150~250px 범위

        for idx, item in enumerate(items[:max_items]):
            row = idx // 2
            col = idx % 2

            card_x = MARGIN_LARGE + col * (card_width + col_gap)
            card_y = card_start_y + row * (card_height + card_gap)

            # 카드 배경 (부드러운 빨간색)
            elements.append(LayoutElement(
                type="figure",
                x=card_x,
                y=card_y,
                width=card_width,
                height=card_height,
                properties={
                    "fill": "#FEF2F2",
                    "cornerRadius": 20,
                    "stroke": "#FECACA",
                    "strokeWidth": 2,
                }
            ))

            # 체크박스 스타일 번호 (더 크게)
            checkbox_size = 56
            elements.append(LayoutElement(
                type="figure",
                x=card_x + 28,
                y=card_y + 28,
                width=checkbox_size,
                height=checkbox_size,
                properties={
                    "fill": COLORS["danger"],
                    "cornerRadius": 12,
                }
            ))
            elements.append(LayoutElement(
                type="text",
                x=card_x + 28,
                y=card_y + 40,
                width=checkbox_size,
                properties={
                    "fontSize": FONT_SIZE["body"],
                    "fontWeight": "bold",
                    "fill": "#FFFFFF",
                    "align": "center",
                },
                content=str(idx + 1)
            ))

            # 항목 텍스트 (더 큰 폰트)
            item_text = str(item)
            if isinstance(item, dict):
                item_text = item.get("task", item.get("text", str(item)))

            if len(item_text) > 80:
                item_text = item_text[:77] + "..."

            elements.append(LayoutElement(
                type="text",
                x=card_x + 28 + checkbox_size + 24,
                y=card_y + 36,
                width=card_width - checkbox_size - 90,
                properties={
                    "fontSize": FONT_SIZE["body"],
                    "fontWeight": "600",
                    "fill": COLORS["text_primary"],
                    "lineHeight": 1.5,
                },
                content=item_text
            ))

            # 담당자 (있으면) - 카드 하단에 표시
            assignee = None
            if isinstance(item, dict):
                assignee = item.get("assignee", item.get("담당자"))

            if assignee:
                elements.append(LayoutElement(
                    type="text",
                    x=card_x + 28 + checkbox_size + 24,
                    y=card_y + card_height - 50,
                    width=card_width - checkbox_size - 90,
                    properties={
                        "fontSize": FONT_SIZE["body_small"],
                        "fill": COLORS["danger"],
                        "fontWeight": "500",
                    },
                    content=f"👤 {assignee}"
                ))

        # 더 많은 항목 표시
        if len(items) > max_items:
            final_y = card_start_y + rows * (card_height + card_gap) + 10
            elements.append(LayoutElement(
                type="text",
                x=MARGIN_LARGE,
                y=final_y,
                width=content_width,
                properties={
                    "fontSize": FONT_SIZE["caption"],
                    "fill": COLORS["text_light"],
                    "align": "center",
                },
                content=f"외 {len(items) - max_items}개 항목..."
            ))

        return PageLayout(
            page_number=0,
            page_type="content",
            layout_type="action_cards",
            section_title="Action Items",
            elements=elements
        )

    def _build_summary_page_v2(
        self,
        content: DocumentContent,
        page_width: int,
        page_height: int,
        part_number: int
    ) -> PageLayout:
        """v2.0 요약 상세 페이지"""

        elements: List[LayoutElement] = []
        content_width = page_width - MARGIN_LARGE * 2

        # === 배경 ===
        elements.append(LayoutElement(
            type="figure",
            x=0,
            y=0,
            width=page_width,
            height=page_height,
            properties={"fill": COLORS["background"]}
        ))

        # === 좌측 장식 바 ===
        elements.append(LayoutElement(
            type="figure",
            x=0,
            y=0,
            width=12,
            height=page_height,
            properties={"fill": COLORS["secondary"]}
        ))

        # === PART 라벨 ===
        elements.append(LayoutElement(
            type="text",
            x=MARGIN_LARGE,
            y=60,
            width=200,
            properties={
                "fontSize": FONT_SIZE["part_number"],
                "fontWeight": "bold",
                "fill": COLORS["secondary"],
                "letterSpacing": 3,
            },
            content=f"PART {part_number}"
        ))

        # === 섹션 제목 ===
        elements.append(LayoutElement(
            type="text",
            x=MARGIN_LARGE,
            y=110,
            width=60,
            properties={"fontSize": 40},
            content="📋"
        ))

        elements.append(LayoutElement(
            type="text",
            x=MARGIN_LARGE + 60,
            y=115,
            width=content_width - 60,
            properties={
                "fontSize": FONT_SIZE["page_title"],
                "fontWeight": "bold",
                "fill": COLORS["text_primary"],
            },
            content="상세 요약"
        ))

        # === 요약 내용 카드들 ===
        if content.summary:
            sentences = content.summary.split('. ')
            current_y = 200

            # 3문장씩 카드로 그룹핑
            groups = []
            current_group = []
            for sentence in sentences:
                current_group.append(sentence)
                if len(current_group) >= 3:
                    groups.append('. '.join(current_group) + '.')
                    current_group = []
            if current_group:
                groups.append('. '.join(current_group))

            for group_text in groups[:3]:
                if current_y > page_height - 150:
                    break

                card_height = min(200, max(100, len(group_text) // 2))

                # 카드 배경
                elements.append(LayoutElement(
                    type="figure",
                    x=MARGIN_LARGE,
                    y=current_y,
                    width=content_width,
                    height=card_height,
                    properties={
                        "fill": COLORS["card_bg"],
                        "cornerRadius": 12,
                    }
                ))

                # 텍스트
                elements.append(LayoutElement(
                    type="text",
                    x=MARGIN_LARGE + 30,
                    y=current_y + 25,
                    width=content_width - 60,
                    properties={
                        "fontSize": FONT_SIZE["body"],
                        "fill": COLORS["text_secondary"],
                        "lineHeight": 1.7,
                    },
                    content=group_text
                ))

                current_y += card_height + 24

        return PageLayout(
            page_number=0,
            page_type="content",
            layout_type="summary_detail",
            section_title="Summary Details",
            elements=elements
        )

    def _get_section_color(self, section_type: str) -> str:
        """섹션 타입별 색상 반환"""
        color_map = {
            "agenda": COLORS["primary"],
            "decisions": COLORS["success"],
            "action_items": COLORS["danger"],
            "summary": COLORS["secondary"],
            "key_points": COLORS["accent"],
            "timeline": COLORS["warning"],
        }
        return color_map.get(section_type, COLORS["primary"])


# =============================================================================
# Factory Function
# =============================================================================

def get_document_layout_agent(llm_gateway=None) -> DocumentLayoutAgent:
    """DocumentLayoutAgent 인스턴스 반환"""
    return DocumentLayoutAgent(llm_gateway=llm_gateway)
