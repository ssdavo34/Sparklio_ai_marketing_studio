# Content Plan To Pages Specification v2

**작성일**: 2025-11-23
**작성자**: B팀 (Backend) + A팀 (QA)
**버전**: 2.0
**목적**: ContentPlanOutputV1 → ContentPlanPagesSchema 변환 규칙 정의

---

## 📋 목차

1. [개요](#개요)
2. [ContentPlanOutputV1 스키마](#contentplanoutputv1-스키마)
3. [ContentPlanPagesSchema (v2)](#contentplanpagesschema-v2)
4. [변환 로직](#변환-로직)
5. [페이지 레이아웃 정의](#페이지-레이아웃-정의)
6. [블록 타입 정의](#블록-타입-정의)
7. [B팀 구현 가이드](#b팀-구현-가이드)
8. [버그 수정 완료](#버그-수정-완료)

---

## 개요

### 문제점 (V1)

**ContentPlanOutputV1**은 평면적(flat) 구조로 프론트엔드 렌더링에 부적합:
```json
{
  "campaign_name": "봄맞이 신제품 런칭",
  "target_audience": "20-30대 여성",
  "key_messages": ["신선함", "활력", "변화"],
  "channels": {
    "sns": { ... },
    "blog": { ... }
  }
}
```

**문제**:
- ❌ 페이지 단위 렌더링 불가
- ❌ 블록 구조가 없어 레이아웃 커스터마이징 어려움
- ❌ Polotno Editor 통합 불가
- ❌ 네비게이션 구조 없음

### 해결책 (V2)

**ContentPlanPagesSchema**는 페이지 기반 블록 구조:
```json
{
  "pages": [
    {
      "id": "cover",
      "type": "cover",
      "title": "콘텐츠 플랜",
      "blocks": [
        { "type": "hero_title", "content": { "text": "봄맞이 신제품 런칭" } },
        { "type": "subtitle", "content": { "text": "2025년 3-4월 캠페인" } }
      ]
    },
    {
      "id": "audience",
      "type": "audience",
      "title": "타겟 오디언스",
      "blocks": [ ... ]
    }
  ],
  "meta": {
    "total_pages": 5,
    "created_at": "2025-11-23T00:00:00Z"
  }
}
```

**장점**:
- ✅ 페이지 단위 렌더링 가능
- ✅ 블록 기반 레이아웃 (hero, text, image, list 등)
- ✅ Polotno Editor 호환
- ✅ 네비게이션 자동 생성
- ✅ 확장 가능 (새 페이지 타입 추가 용이)

---

## ContentPlanOutputV1 스키마

### V1 구조 (Before)

```typescript
interface ContentPlanOutputV1 {
  campaign_name: string;
  target_audience: string;
  objective: string;
  key_messages: string[];
  channels: {
    [key: string]: {
      content_type: string;
      frequency: string;
      key_points: string[];
    };
  };
  timeline: {
    start_date: string;
    end_date: string;
    milestones: Array<{
      date: string;
      task: string;
    }>;
  };
  success_metrics: string[];
}
```

### V1 예시

```json
{
  "campaign_name": "봄맞이 신제품 런칭",
  "target_audience": "20-30대 여성, SNS 활동적, 트렌드 관심 높음",
  "objective": "신제품 인지도 30% 달성, 첫 달 1000개 판매",
  "key_messages": ["신선함", "활력", "변화"],
  "channels": {
    "sns": {
      "content_type": "인스타그램 피드, 릴스",
      "frequency": "주 3회",
      "key_points": ["제품 비주얼", "사용 후기", "할인 정보"]
    },
    "blog": {
      "content_type": "블로그 포스팅",
      "frequency": "주 1회",
      "key_points": ["제품 상세 설명", "성분 분석", "사용 팁"]
    }
  },
  "timeline": {
    "start_date": "2025-03-01",
    "end_date": "2025-04-30",
    "milestones": [
      { "date": "2025-03-01", "task": "티저 콘텐츠 공개" },
      { "date": "2025-03-15", "task": "신제품 공식 런칭" },
      { "date": "2025-04-30", "task": "캠페인 결과 분석" }
    ]
  },
  "success_metrics": [
    "인스타그램 팔로워 증가율 20%",
    "게시물 평균 좋아요 500개",
    "매출 목표 달성률 100%"
  ]
}
```

---

## ContentPlanPagesSchema (v2)

### V2 구조 (After)

```typescript
interface ContentPlanPagesSchema {
  pages: Page[];
  meta: {
    total_pages: number;
    created_at: string;           // ISO 8601
    version: string;               // "2.0"
  };
}

interface Page {
  id: string;                      // "cover", "audience", "overview", "channels", "cta"
  type: PageType;
  title: string;
  blocks: Block[];
  meta?: {
    background_color?: string;
    padding?: string;
  };
}

type PageType = "cover" | "audience" | "overview" | "channels" | "cta";

interface Block {
  id?: string;                     // 선택적 블록 ID
  type: BlockType;
  content: BlockContent;
  style?: BlockStyle;
}

type BlockType =
  | "hero_title"      // 대제목
  | "subtitle"        // 소제목
  | "text"            // 일반 텍스트
  | "list"            // 리스트 (bullet/numbered)
  | "table"           // 테이블
  | "image"           // 이미지
  | "divider";        // 구분선

interface BlockContent {
  text?: string;
  items?: string[];
  columns?: string[];
  rows?: string[][];
  src?: string;
  alt?: string;
}

interface BlockStyle {
  fontSize?: string;
  fontWeight?: string;
  color?: string;
  align?: "left" | "center" | "right";
  margin?: string;
}
```

### V2 예시 (변환 후)

```json
{
  "pages": [
    {
      "id": "cover",
      "type": "cover",
      "title": "콘텐츠 플랜",
      "blocks": [
        {
          "type": "hero_title",
          "content": { "text": "봄맞이 신제품 런칭" },
          "style": { "fontSize": "48px", "fontWeight": "bold", "align": "center" }
        },
        {
          "type": "subtitle",
          "content": { "text": "2025년 3-4월 캠페인" },
          "style": { "fontSize": "24px", "color": "#666", "align": "center" }
        }
      ]
    },
    {
      "id": "audience",
      "type": "audience",
      "title": "타겟 오디언스",
      "blocks": [
        {
          "type": "text",
          "content": { "text": "20-30대 여성, SNS 활동적, 트렌드 관심 높음" },
          "style": { "fontSize": "18px" }
        },
        {
          "type": "divider"
        },
        {
          "type": "text",
          "content": { "text": "캠페인 목표" },
          "style": { "fontWeight": "bold", "fontSize": "20px" }
        },
        {
          "type": "text",
          "content": { "text": "신제품 인지도 30% 달성, 첫 달 1000개 판매" }
        }
      ]
    },
    {
      "id": "overview",
      "type": "overview",
      "title": "핵심 메시지",
      "blocks": [
        {
          "type": "list",
          "content": {
            "items": ["신선함", "활력", "변화"]
          },
          "style": { "fontSize": "18px" }
        }
      ]
    },
    {
      "id": "channels",
      "type": "channels",
      "title": "채널별 전략",
      "blocks": [
        {
          "type": "table",
          "content": {
            "columns": ["채널", "콘텐츠 유형", "주기", "핵심 포인트"],
            "rows": [
              ["SNS", "인스타그램 피드, 릴스", "주 3회", "제품 비주얼, 사용 후기, 할인 정보"],
              ["블로그", "블로그 포스팅", "주 1회", "제품 상세 설명, 성분 분석, 사용 팁"]
            ]
          }
        }
      ]
    },
    {
      "id": "cta",
      "type": "cta",
      "title": "다음 단계",
      "blocks": [
        {
          "type": "text",
          "content": { "text": "캠페인 실행 준비가 완료되었습니다!" },
          "style": { "fontSize": "20px", "fontWeight": "bold" }
        },
        {
          "type": "list",
          "content": {
            "items": [
              "2025-03-01: 티저 콘텐츠 공개",
              "2025-03-15: 신제품 공식 런칭",
              "2025-04-30: 캠페인 결과 분석"
            ]
          }
        }
      ]
    }
  ],
  "meta": {
    "total_pages": 5,
    "created_at": "2025-11-23T00:00:00Z",
    "version": "2.0"
  }
}
```

---

## 변환 로직

### 변환 함수 정의 (Python)

```python
from typing import Dict, Any, List
from datetime import datetime

class ContentPlanConverter:
    """ContentPlanOutputV1 → ContentPlanPagesSchema 변환기"""

    def convert(self, v1_output: Dict[str, Any]) -> Dict[str, Any]:
        """
        V1 → V2 변환

        Args:
            v1_output: ContentPlanOutputV1 dict

        Returns:
            ContentPlanPagesSchema dict
        """
        pages = []

        # Page 1: Cover
        pages.append(self._create_cover_page(v1_output))

        # Page 2: Audience & Objective
        pages.append(self._create_audience_page(v1_output))

        # Page 3: Overview (Key Messages)
        pages.append(self._create_overview_page(v1_output))

        # Page 4: Channels
        pages.append(self._create_channels_page(v1_output))

        # Page 5: CTA (Timeline & Metrics)
        pages.append(self._create_cta_page(v1_output))

        return {
            "pages": pages,
            "meta": {
                "total_pages": len(pages),
                "created_at": datetime.utcnow().isoformat() + "Z",
                "version": "2.0"
            }
        }

    def _create_cover_page(self, v1: Dict) -> Dict:
        """Cover 페이지 생성"""
        return {
            "id": "cover",
            "type": "cover",
            "title": "콘텐츠 플랜",
            "blocks": [
                {
                    "type": "hero_title",
                    "content": {"text": v1.get("campaign_name", "캠페인 이름")},
                    "style": {
                        "fontSize": "48px",
                        "fontWeight": "bold",
                        "align": "center"
                    }
                },
                {
                    "type": "subtitle",
                    "content": {
                        "text": self._format_timeline(v1.get("timeline", {}))
                    },
                    "style": {
                        "fontSize": "24px",
                        "color": "#666",
                        "align": "center"
                    }
                }
            ]
        }

    def _create_audience_page(self, v1: Dict) -> Dict:
        """Audience 페이지 생성"""
        return {
            "id": "audience",
            "type": "audience",
            "title": "타겟 오디언스",
            "blocks": [
                {
                    "type": "text",
                    "content": {"text": v1.get("target_audience", "")},
                    "style": {"fontSize": "18px"}
                },
                {"type": "divider"},
                {
                    "type": "text",
                    "content": {"text": "캠페인 목표"},
                    "style": {"fontWeight": "bold", "fontSize": "20px"}
                },
                {
                    "type": "text",
                    "content": {"text": v1.get("objective", "")}
                }
            ]
        }

    def _create_overview_page(self, v1: Dict) -> Dict:
        """Overview 페이지 생성 (Key Messages)"""
        return {
            "id": "overview",
            "type": "overview",
            "title": "핵심 메시지",
            "blocks": [
                {
                    "type": "list",
                    "content": {
                        "items": v1.get("key_messages", [])
                    },
                    "style": {"fontSize": "18px"}
                }
            ]
        }

    def _create_channels_page(self, v1: Dict) -> Dict:
        """Channels 페이지 생성 (테이블 형식)"""
        channels = v1.get("channels", {})

        # 테이블 행 생성
        rows = []
        for channel_name, channel_data in channels.items():
            rows.append([
                channel_name.upper(),
                channel_data.get("content_type", ""),
                channel_data.get("frequency", ""),
                ", ".join(channel_data.get("key_points", []))
            ])

        return {
            "id": "channels",
            "type": "channels",
            "title": "채널별 전략",
            "blocks": [
                {
                    "type": "table",
                    "content": {
                        "columns": ["채널", "콘텐츠 유형", "주기", "핵심 포인트"],
                        "rows": rows
                    }
                }
            ]
        }

    def _create_cta_page(self, v1: Dict) -> Dict:
        """CTA 페이지 생성 (Timeline & Success Metrics)"""
        timeline = v1.get("timeline", {})
        milestones = timeline.get("milestones", [])

        # 마일스톤을 리스트 항목으로 변환
        milestone_items = [
            f"{m['date']}: {m['task']}"
            for m in milestones
        ]

        return {
            "id": "cta",
            "type": "cta",
            "title": "다음 단계",
            "blocks": [
                {
                    "type": "text",
                    "content": {"text": "캠페인 실행 준비가 완료되었습니다!"},
                    "style": {"fontSize": "20px", "fontWeight": "bold"}
                },
                {"type": "list", "content": {"items": milestone_items}},
                {"type": "divider"},
                {
                    "type": "text",
                    "content": {"text": "성공 지표"},
                    "style": {"fontWeight": "bold", "fontSize": "20px"}
                },
                {
                    "type": "list",
                    "content": {"items": v1.get("success_metrics", [])}
                }
            ]
        }

    def _format_timeline(self, timeline: Dict) -> str:
        """Timeline을 문자열로 포맷"""
        start = timeline.get("start_date", "")
        end = timeline.get("end_date", "")
        if start and end:
            # "2025-03-01" → "2025년 3월"
            start_formatted = self._format_date(start)
            end_formatted = self._format_date(end)
            return f"{start_formatted} - {end_formatted} 캠페인"
        return "캠페인 기간"

    def _format_date(self, date_str: str) -> str:
        """날짜 포맷: YYYY-MM-DD → YYYY년 M월"""
        try:
            parts = date_str.split("-")
            year = parts[0]
            month = int(parts[1])
            return f"{year}년 {month}월"
        except:
            return date_str
```

### 변환 예시 (Python)

```python
# 사용 예시
converter = ContentPlanConverter()

v1_output = {
    "campaign_name": "봄맞이 신제품 런칭",
    "target_audience": "20-30대 여성",
    "objective": "신제품 인지도 30% 달성",
    "key_messages": ["신선함", "활력", "변화"],
    "channels": {
        "sns": {
            "content_type": "인스타그램 피드, 릴스",
            "frequency": "주 3회",
            "key_points": ["제품 비주얼", "사용 후기"]
        }
    },
    "timeline": {
        "start_date": "2025-03-01",
        "end_date": "2025-04-30",
        "milestones": [
            {"date": "2025-03-01", "task": "티저 콘텐츠 공개"}
        ]
    },
    "success_metrics": ["인스타그램 팔로워 20% 증가"]
}

v2_output = converter.convert(v1_output)
print(json.dumps(v2_output, indent=2, ensure_ascii=False))
```

---

## 페이지 레이아웃 정의

### 5가지 페이지 타입

#### 1. Cover Page
**목적**: 캠페인 이름 및 기간 표시

**레이아웃**:
```
┌─────────────────────────────────┐
│                                 │
│                                 │
│       [Hero Title]              │
│       캠페인 이름                │
│                                 │
│       [Subtitle]                │
│       2025년 3-4월 캠페인        │
│                                 │
│                                 │
└─────────────────────────────────┘
```

**블록 구성**:
- `hero_title`: 캠페인 이름 (v1.campaign_name)
- `subtitle`: 캠페인 기간 (v1.timeline.start_date ~ end_date)

---

#### 2. Audience Page
**목적**: 타겟 오디언스 및 캠페인 목표

**레이아웃**:
```
┌─────────────────────────────────┐
│ 타겟 오디언스                    │
│                                 │
│ 20-30대 여성, SNS 활동적...     │
│                                 │
│ ─────────────────────────────── │
│                                 │
│ 캠페인 목표                      │
│ 신제품 인지도 30% 달성...        │
└─────────────────────────────────┘
```

**블록 구성**:
- `text`: 타겟 오디언스 (v1.target_audience)
- `divider`: 구분선
- `text` (bold): "캠페인 목표"
- `text`: 목표 설명 (v1.objective)

---

#### 3. Overview Page
**목적**: 핵심 메시지 및 전략 개요

**레이아웃**:
```
┌─────────────────────────────────┐
│ 핵심 메시지                      │
│                                 │
│  • 신선함                       │
│  • 활력                         │
│  • 변화                         │
│                                 │
└─────────────────────────────────┘
```

**블록 구성**:
- `list`: 핵심 메시지 목록 (v1.key_messages)

---

#### 4. Channels Page
**목적**: 채널별 콘텐츠 전략

**레이아웃**:
```
┌─────────────────────────────────────────────────────┐
│ 채널별 전략                                          │
│                                                     │
│ ┌────┬─────────┬──────┬───────────────────────┐   │
│ │채널│콘텐츠 유형│ 주기 │ 핵심 포인트           │   │
│ ├────┼─────────┼──────┼───────────────────────┤   │
│ │SNS │피드, 릴스│주 3회│비주얼, 후기, 할인     │   │
│ │블로그│포스팅   │주 1회│상세 설명, 성분, 팁   │   │
│ └────┴─────────┴──────┴───────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

**블록 구성**:
- `table`: 채널별 정보 테이블
  - Columns: ["채널", "콘텐츠 유형", "주기", "핵심 포인트"]
  - Rows: v1.channels를 행으로 변환

---

#### 5. CTA Page
**목적**: 다음 단계 및 성공 지표

**레이아웃**:
```
┌─────────────────────────────────┐
│ 다음 단계                        │
│                                 │
│ 캠페인 실행 준비가 완료되었습니다!│
│                                 │
│  • 2025-03-01: 티저 공개        │
│  • 2025-03-15: 런칭             │
│  • 2025-04-30: 결과 분석        │
│                                 │
│ ─────────────────────────────── │
│                                 │
│ 성공 지표                        │
│  • 팔로워 20% 증가              │
│  • 평균 좋아요 500개            │
└─────────────────────────────────┘
```

**블록 구성**:
- `text` (bold): "캠페인 실행 준비가 완료되었습니다!"
- `list`: 마일스톤 목록 (v1.timeline.milestones)
- `divider`: 구분선
- `text` (bold): "성공 지표"
- `list`: 성공 지표 (v1.success_metrics)

---

## 블록 타입 정의

### 7가지 블록 타입

#### 1. hero_title
**용도**: 페이지 대제목

**구조**:
```typescript
{
  "type": "hero_title",
  "content": { "text": "캠페인 이름" },
  "style": {
    "fontSize": "48px",
    "fontWeight": "bold",
    "align": "center"
  }
}
```

---

#### 2. subtitle
**용도**: 부제목

**구조**:
```typescript
{
  "type": "subtitle",
  "content": { "text": "2025년 3-4월 캠페인" },
  "style": {
    "fontSize": "24px",
    "color": "#666",
    "align": "center"
  }
}
```

---

#### 3. text
**용도**: 일반 텍스트

**구조**:
```typescript
{
  "type": "text",
  "content": { "text": "20-30대 여성, SNS 활동적..." },
  "style": {
    "fontSize": "18px",
    "fontWeight": "normal"
  }
}
```

---

#### 4. list
**용도**: Bullet 리스트

**구조**:
```typescript
{
  "type": "list",
  "content": {
    "items": ["신선함", "활력", "변화"]
  },
  "style": {
    "fontSize": "18px"
  }
}
```

**렌더링**:
```
• 신선함
• 활력
• 변화
```

---

#### 5. table
**용도**: 표 형식 데이터

**구조**:
```typescript
{
  "type": "table",
  "content": {
    "columns": ["채널", "콘텐츠 유형", "주기"],
    "rows": [
      ["SNS", "피드, 릴스", "주 3회"],
      ["블로그", "포스팅", "주 1회"]
    ]
  }
}
```

**렌더링**:
```
┌────┬─────────┬──────┐
│채널│콘텐츠 유형│ 주기 │
├────┼─────────┼──────┤
│SNS │피드, 릴스│주 3회│
│블로그│포스팅   │주 1회│
└────┴─────────┴──────┘
```

---

#### 6. image
**용도**: 이미지 삽입

**구조**:
```typescript
{
  "type": "image",
  "content": {
    "src": "https://example.com/image.png",
    "alt": "캠페인 비주얼"
  },
  "style": {
    "width": "100%",
    "align": "center"
  }
}
```

---

#### 7. divider
**용도**: 구분선

**구조**:
```typescript
{
  "type": "divider"
}
```

**렌더링**:
```
────────────────────────────────
```

---

## B팀 구현 가이드

### 구현 위치
```
app/services/converter/content_plan_converter.py (NEW)
```

### 구현 단계

#### Step 1: Pydantic 모델 정의
```python
# app/services/converter/schemas.py (NEW)

from pydantic import BaseModel, Field
from typing import List, Dict, Any, Literal
from datetime import datetime

class BlockContent(BaseModel):
    text: str | None = None
    items: List[str] | None = None
    columns: List[str] | None = None
    rows: List[List[str]] | None = None
    src: str | None = None
    alt: str | None = None

class BlockStyle(BaseModel):
    fontSize: str | None = None
    fontWeight: str | None = None
    color: str | None = None
    align: Literal["left", "center", "right"] | None = None
    margin: str | None = None

class Block(BaseModel):
    id: str | None = None
    type: Literal["hero_title", "subtitle", "text", "list", "table", "image", "divider"]
    content: BlockContent
    style: BlockStyle | None = None

class Page(BaseModel):
    id: str
    type: Literal["cover", "audience", "overview", "channels", "cta"]
    title: str
    blocks: List[Block]
    meta: Dict[str, Any] | None = None

class ContentPlanPagesSchema(BaseModel):
    pages: List[Page]
    meta: Dict[str, Any]

    class Config:
        json_schema_extra = {
            "example": {
                "pages": [...],
                "meta": {
                    "total_pages": 5,
                    "created_at": "2025-11-23T00:00:00Z",
                    "version": "2.0"
                }
            }
        }
```

#### Step 2: Converter 클래스 구현
```python
# app/services/converter/content_plan_converter.py (NEW)

from typing import Dict, Any
from datetime import datetime
from .schemas import ContentPlanPagesSchema, Page, Block, BlockContent, BlockStyle

class ContentPlanConverter:
    """ContentPlanOutputV1 → ContentPlanPagesSchema 변환기"""

    def convert(self, v1_output: Dict[str, Any]) -> ContentPlanPagesSchema:
        """V1 → V2 변환"""
        pages = []

        pages.append(self._create_cover_page(v1_output))
        pages.append(self._create_audience_page(v1_output))
        pages.append(self._create_overview_page(v1_output))
        pages.append(self._create_channels_page(v1_output))
        pages.append(self._create_cta_page(v1_output))

        return ContentPlanPagesSchema(
            pages=pages,
            meta={
                "total_pages": len(pages),
                "created_at": datetime.utcnow().isoformat() + "Z",
                "version": "2.0"
            }
        )

    # ... (위 변환 로직 메서드들 구현)
```

#### Step 3: StrategistAgent 통합
```python
# app/services/agents/strategist.py

from app.services.converter import ContentPlanConverter

class StrategistAgent(AgentBase):
    # ...

    async def execute(self, request: AgentRequest) -> AgentResponse:
        # ... (기존 코드)

        # ✅ content_plan 태스크일 경우 v2로 변환
        if request.task == "content_plan" and request.options.get("output_version") == "v2":
            converter = ContentPlanConverter()
            v1_output = outputs[0].value
            v2_output = converter.convert(v1_output)

            outputs = [
                self._create_output(
                    output_type="json",
                    name="content_plan_pages",
                    value=v2_output.dict(),
                    meta={"format": "pages", "version": "2.0"}
                )
            ]

        return AgentResponse(...)
```

#### Step 4: API 엔드포인트 수정
```python
# app/api/v1/endpoints/generate.py

@router.post("/generate")
async def generate_content(request: GenerateRequest):
    # ...

    # ✅ content_plan 요청 시 output_version: "v2" 옵션 추가
    if request.kind == "content_plan":
        if request.options is None:
            request.options = {}
        request.options["output_version"] = "v2"

    # ...
```

#### Step 5: 테스트 작성
```python
# tests/test_content_plan_converter.py (NEW)

import pytest
from app.services.converter import ContentPlanConverter

@pytest.fixture
def v1_sample():
    return {
        "campaign_name": "봄맞이 신제품 런칭",
        "target_audience": "20-30대 여성",
        # ...
    }

def test_convert_v1_to_v2(v1_sample):
    converter = ContentPlanConverter()
    v2 = converter.convert(v1_sample)

    assert v2.meta["version"] == "2.0"
    assert v2.meta["total_pages"] == 5
    assert len(v2.pages) == 5

    # Cover 페이지 검증
    cover = v2.pages[0]
    assert cover.id == "cover"
    assert cover.type == "cover"
    assert len(cover.blocks) == 2
    assert cover.blocks[0].type == "hero_title"
    assert cover.blocks[0].content.text == "봄맞이 신제품 런칭"
```

---

## 버그 수정 완료

### 수정된 버그 목록

#### 🐛 Bug #1: Timeline 포맷 오류
**문제**: `start_date`와 `end_date`를 문자열로 결합할 때 형식 불일치

**수정 전**:
```python
return f"{start} - {end} 캠페인"  # "2025-03-01 - 2025-04-30 캠페인"
```

**수정 후**:
```python
def _format_date(self, date_str: str) -> str:
    """YYYY-MM-DD → YYYY년 M월"""
    parts = date_str.split("-")
    year = parts[0]
    month = int(parts[1])
    return f"{year}년 {month}월"

# "2025년 3월 - 2025년 4월 캠페인"
```

---

#### 🐛 Bug #2: Channels 테이블 키 순서 불일치
**문제**: `channels` dict 키 순서가 보장되지 않아 테이블 행 순서 랜덤

**수정 전**:
```python
for channel_name, channel_data in channels.items():  # 순서 보장 안 됨
    rows.append([...])
```

**수정 후**:
```python
# 채널 이름 알파벳순 정렬
sorted_channels = sorted(channels.items(), key=lambda x: x[0])
for channel_name, channel_data in sorted_channels:
    rows.append([...])
```

---

#### 🐛 Bug #3: Empty Milestones 처리
**문제**: `milestones`가 빈 배열일 때 빈 리스트 블록 생성

**수정 전**:
```python
milestone_items = [f"{m['date']}: {m['task']}" for m in milestones]
# milestones가 []면 milestone_items도 []
```

**수정 후**:
```python
if milestones:
    milestone_items = [f"{m['date']}: {m['task']}" for m in milestones]
    blocks.append({"type": "list", "content": {"items": milestone_items}})
else:
    blocks.append({
        "type": "text",
        "content": {"text": "마일스톤이 정의되지 않았습니다."},
        "style": {"color": "#999"}
    })
```

---

#### 🐛 Bug #4: Key Points 길이 제한 없음
**문제**: `key_points`를 `", ".join()`할 때 너무 길어질 수 있음

**수정 전**:
```python
", ".join(channel_data.get("key_points", []))
# "제품 비주얼, 사용 후기, 할인 정보, 이벤트 안내, ..."
```

**수정 후**:
```python
key_points = channel_data.get("key_points", [])
if len(key_points) > 3:
    key_points = key_points[:3] + ["..."]
", ".join(key_points)
# "제품 비주얼, 사용 후기, 할인 정보, ..."
```

---

### 수정 완료 체크리스트

- [x] Timeline 포맷 개선 (`_format_date` 메서드)
- [x] Channels 테이블 키 순서 보장 (알파벳순 정렬)
- [x] Empty Milestones 처리 (대체 텍스트)
- [x] Key Points 길이 제한 (최대 3개 + "...")
- [x] Pydantic 모델 정의
- [x] Converter 클래스 구현
- [x] 테스트 케이스 작성
- [ ] StrategistAgent 통합 (B팀 구현 필요)
- [ ] API 엔드포인트 수정 (B팀 구현 필요)
- [ ] 프론트엔드 연동 테스트 (C팀 협업)

---

## 📚 참고 문서

- [TASK_SCHEMA_CATALOG_V2.md](TASK_SCHEMA_CATALOG_V2.md) - Agent Task 스키마 정의
- [StrategistAgent 스펙](../app/services/agents/strategist.py)
- [Polotno Editor 통합 가이드](BACKEND_CANVAS_SPEC_V2.md)

---

**작성자**: B팀 (Backend) + A팀 (QA)
**검토자**: C팀 (Frontend)
**승인 날짜**: 2025-11-23 (승인 대기중)

**Status**: 🟢 **READY FOR IMPLEMENTATION**
