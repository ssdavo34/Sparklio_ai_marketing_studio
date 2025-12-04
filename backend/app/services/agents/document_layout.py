"""
Document Layout Agent

문서 콘텐츠를 분석하여 최적의 레이아웃 구조를 생성하는 Agent

작성일: 2025-12-04
작성자: B팀 (Backend)

기능:
- 콘텐츠 양과 유형에 따른 자동 페이지 분배
- 섹션별 레이아웃 타입 결정 (cover, two_column, cards, list 등)
- 폰트 크기, 색상 등 스타일 자동 최적화
- 다양한 문서 유형 지원:
  * meeting_summary: 회의 요약
  * presentation: 프레젠테이션/피치덱
  * brief: 캠페인 브리프
  * product_detail: 상품 상세 페이지
  * sns_ad: SNS 광고 (Instagram, Facebook 등)
  * banner: 배너 광고
  * report: 일반 보고서
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
        """Fallback 레이아웃 생성 (LLM 실패 시)"""

        margin = 60
        content_width = page_width - margin * 2

        pages: List[PageLayout] = []

        # === PAGE 1: Cover + Executive Summary ===
        cover_elements: List[LayoutElement] = []

        # 헤더 배경
        cover_elements.append(LayoutElement(
            type="figure",
            x=0,
            y=0,
            width=page_width,
            height=180,
            properties={"fill": "linear-gradient(135deg, #7C3AED 0%, #4F46E5 100%)"}
        ))

        # 제목
        cover_elements.append(LayoutElement(
            type="text",
            x=margin,
            y=50,
            width=content_width,
            properties={"fontSize": 42, "fontWeight": "bold", "fill": "#FFFFFF"},
            content=content.title
        ))

        # 부제목
        if content.subtitle:
            cover_elements.append(LayoutElement(
                type="text",
                x=margin,
                y=110,
                width=content_width,
                properties={"fontSize": 18, "fill": "rgba(255,255,255,0.9)"},
                content=content.subtitle
            ))

        # 요약 섹션
        current_y = 210
        if content.summary:
            # 요약 제목
            cover_elements.append(LayoutElement(
                type="text",
                x=margin,
                y=current_y,
                width=content_width,
                properties={"fontSize": 22, "fontWeight": "bold", "fill": "#1F2937"},
                content="Executive Summary"
            ))
            current_y += 40

            # 요약 구조화 (도입/본문/결론)
            summary = content.summary
            sentences = summary.split('. ')

            if len(sentences) > 5:
                intro = '. '.join(sentences[:2]) + '.'
                conclusion = '. '.join(sentences[-2:])
                main = '. '.join(sentences[2:-2]) + '.'

                # 도입부 (이탤릭)
                cover_elements.append(LayoutElement(
                    type="text",
                    x=margin,
                    y=current_y,
                    width=content_width,
                    properties={"fontSize": 13, "fill": "#6B7280", "fontStyle": "italic"},
                    content=intro
                ))
                current_y += 50

                # 본문
                cover_elements.append(LayoutElement(
                    type="text",
                    x=margin,
                    y=current_y,
                    width=content_width,
                    properties={"fontSize": 14, "fill": "#374151", "lineHeight": 1.6},
                    content=main
                ))
                current_y += min(200, len(main) // 3)

                # 결론 박스
                box_height = 70
                cover_elements.append(LayoutElement(
                    type="figure",
                    x=margin,
                    y=current_y,
                    width=content_width,
                    height=box_height,
                    properties={"fill": "#F3F4F6", "cornerRadius": 8}
                ))
                cover_elements.append(LayoutElement(
                    type="text",
                    x=margin + 15,
                    y=current_y + 15,
                    width=content_width - 30,
                    properties={"fontSize": 12, "fill": "#374151"},
                    content=f"💡 {conclusion}"
                ))
                current_y += box_height + 20
            else:
                # 짧은 요약은 그대로
                cover_elements.append(LayoutElement(
                    type="text",
                    x=margin,
                    y=current_y,
                    width=content_width,
                    properties={"fontSize": 14, "fill": "#374151", "lineHeight": 1.6},
                    content=summary
                ))
                current_y += 100

        # 키워드 태그
        if content.keywords:
            tag_x = margin
            for keyword in content.keywords[:6]:
                tag_width = len(keyword) * 9 + 24
                if tag_x + tag_width > page_width - margin:
                    break

                cover_elements.append(LayoutElement(
                    type="figure",
                    x=tag_x,
                    y=current_y,
                    width=tag_width,
                    height=28,
                    properties={"fill": "#EEF2FF", "cornerRadius": 14}
                ))
                cover_elements.append(LayoutElement(
                    type="text",
                    x=tag_x + 12,
                    y=current_y + 7,
                    width=tag_width - 24,
                    properties={"fontSize": 11, "fill": "#4F46E5"},
                    content=keyword
                ))
                tag_x += tag_width + 8

        pages.append(PageLayout(
            page_number=1,
            page_type="cover",
            layout_type="full_header",
            section_title="Executive Summary",
            elements=cover_elements
        ))

        # === PAGE 2: 안건 & 결정사항 (Two Column) ===
        agenda_section = next((s for s in content.sections if s.get("type") == "agenda"), None)
        decisions_section = next((s for s in content.sections if s.get("type") == "decisions"), None)

        if agenda_section or decisions_section:
            content_elements: List[LayoutElement] = []

            # 페이지 헤더
            content_elements.append(LayoutElement(
                type="figure",
                x=0,
                y=0,
                width=page_width,
                height=80,
                properties={"fill": "#4F46E5"}
            ))
            content_elements.append(LayoutElement(
                type="text",
                x=margin,
                y=25,
                width=content_width,
                properties={"fontSize": 24, "fontWeight": "bold", "fill": "#FFFFFF"},
                content="Key Points & Decisions"
            ))

            col_width = (content_width - 30) // 2
            left_y = 100
            right_y = 100

            # 왼쪽: 주요 안건
            if agenda_section:
                items = agenda_section.get("items", [])
                content_elements.append(LayoutElement(
                    type="text",
                    x=margin,
                    y=left_y,
                    width=col_width,
                    properties={"fontSize": 16, "fontWeight": "bold", "fill": "#1F2937"},
                    content="📋 주요 안건"
                ))
                left_y += 30

                for idx, item in enumerate(items[:8]):
                    item_height = max(40, len(str(item)) // 35 * 20 + 15)

                    # 배경
                    content_elements.append(LayoutElement(
                        type="figure",
                        x=margin,
                        y=left_y,
                        width=col_width,
                        height=item_height,
                        properties={"fill": "#F9FAFB" if idx % 2 == 0 else "#FFFFFF", "cornerRadius": 6}
                    ))

                    # 번호 뱃지
                    content_elements.append(LayoutElement(
                        type="figure",
                        x=margin + 8,
                        y=left_y + 8,
                        width=22,
                        height=22,
                        properties={"fill": "#4F46E5", "cornerRadius": 11}
                    ))
                    content_elements.append(LayoutElement(
                        type="text",
                        x=margin + 8,
                        y=left_y + 12,
                        width=22,
                        properties={"fontSize": 11, "fontWeight": "bold", "fill": "#FFFFFF", "align": "center"},
                        content=str(idx + 1)
                    ))

                    # 텍스트
                    content_elements.append(LayoutElement(
                        type="text",
                        x=margin + 40,
                        y=left_y + 10,
                        width=col_width - 55,
                        properties={"fontSize": 12, "fill": "#374151"},
                        content=str(item)
                    ))

                    left_y += item_height + 8

            # 오른쪽: 결정 사항
            if decisions_section:
                items = decisions_section.get("items", [])
                right_x = margin + col_width + 30

                content_elements.append(LayoutElement(
                    type="text",
                    x=right_x,
                    y=right_y,
                    width=col_width,
                    properties={"fontSize": 16, "fontWeight": "bold", "fill": "#059669"},
                    content="✅ 결정 사항"
                ))
                right_y += 30

                for idx, item in enumerate(items[:8]):
                    item_height = max(40, len(str(item)) // 35 * 20 + 15)

                    # 배경
                    content_elements.append(LayoutElement(
                        type="figure",
                        x=right_x,
                        y=right_y,
                        width=col_width,
                        height=item_height,
                        properties={"fill": "#ECFDF5", "cornerRadius": 6}
                    ))

                    # 체크
                    content_elements.append(LayoutElement(
                        type="text",
                        x=right_x + 10,
                        y=right_y + 10,
                        width=20,
                        properties={"fontSize": 14, "fill": "#059669"},
                        content="✓"
                    ))

                    # 텍스트
                    content_elements.append(LayoutElement(
                        type="text",
                        x=right_x + 35,
                        y=right_y + 10,
                        width=col_width - 50,
                        properties={"fontSize": 12, "fill": "#047857"},
                        content=str(item)
                    ))

                    right_y += item_height + 8

            pages.append(PageLayout(
                page_number=2,
                page_type="content",
                layout_type="two_column",
                section_title="Key Points & Decisions",
                elements=content_elements
            ))

        # === PAGE 3: Action Items (Card Grid) ===
        action_section = next((s for s in content.sections if s.get("type") == "action_items"), None)

        if action_section:
            items = action_section.get("items", [])
            if items:
                action_elements: List[LayoutElement] = []

                # 페이지 헤더
                action_elements.append(LayoutElement(
                    type="figure",
                    x=0,
                    y=0,
                    width=page_width,
                    height=80,
                    properties={"fill": "#DC2626"}
                ))
                action_elements.append(LayoutElement(
                    type="text",
                    x=margin,
                    y=25,
                    width=content_width,
                    properties={"fontSize": 24, "fontWeight": "bold", "fill": "#FFFFFF"},
                    content="Action Items"
                ))

                # 카드 그리드
                card_width = (content_width - 20) // 2
                card_height = 80
                start_y = 100

                for idx, item in enumerate(items[:6]):
                    row = idx // 2
                    col = idx % 2
                    card_x = margin + col * (card_width + 20)
                    card_y = start_y + row * (card_height + 15)

                    # 카드 배경
                    action_elements.append(LayoutElement(
                        type="figure",
                        x=card_x,
                        y=card_y,
                        width=card_width,
                        height=card_height,
                        properties={"fill": "#FEF2F2", "cornerRadius": 8, "stroke": "#FECACA"}
                    ))

                    # 우선순위 뱃지
                    action_elements.append(LayoutElement(
                        type="figure",
                        x=card_x + 10,
                        y=card_y + 10,
                        width=24,
                        height=24,
                        properties={"fill": "#DC2626", "cornerRadius": 4}
                    ))
                    action_elements.append(LayoutElement(
                        type="text",
                        x=card_x + 10,
                        y=card_y + 14,
                        width=24,
                        properties={"fontSize": 12, "fontWeight": "bold", "fill": "#FFFFFF", "align": "center"},
                        content=str(idx + 1)
                    ))

                    # 텍스트
                    item_text = str(item)
                    if len(item_text) > 80:
                        item_text = item_text[:77] + "..."

                    action_elements.append(LayoutElement(
                        type="text",
                        x=card_x + 45,
                        y=card_y + 15,
                        width=card_width - 60,
                        properties={"fontSize": 12, "fill": "#991B1B", "lineHeight": 1.4},
                        content=item_text
                    ))

                pages.append(PageLayout(
                    page_number=len(pages) + 1,
                    page_type="content",
                    layout_type="card_grid",
                    section_title="Action Items",
                    elements=action_elements
                ))

        # 디자인 토큰
        design_tokens = {
            "primary_color": "#7C3AED",
            "secondary_color": "#4F46E5",
            "success_color": "#059669",
            "danger_color": "#DC2626",
            "text_primary": "#1F2937",
            "text_secondary": "#6B7280",
            "background": "#F9FAFB",
            "font_family": "Pretendard, sans-serif",
            "base_font_size": 14,
            "margin": margin
        }

        # 권장 사항
        recommendations = []
        if content.summary and len(content.summary) > 500:
            recommendations.append("요약이 길어 도입/본문/결론으로 구조화됨")
        if agenda_section and len(agenda_section.get("items", [])) > 5:
            recommendations.append("안건 항목이 많아 2컬럼 레이아웃 적용")
        if action_section and len(action_section.get("items", [])) > 3:
            recommendations.append("액션아이템 카드 그리드로 시각적 강조")

        return DocumentLayoutOutput(
            document_type=document_type,
            total_pages=len(pages),
            pages=pages,
            design_tokens=design_tokens,
            recommendations=recommendations
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


# =============================================================================
# Factory Function
# =============================================================================

def get_document_layout_agent(llm_gateway=None) -> DocumentLayoutAgent:
    """DocumentLayoutAgent 인스턴스 반환"""
    return DocumentLayoutAgent(llm_gateway=llm_gateway)
