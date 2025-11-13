# One-Page Unified Editor Specification

> **Version**: 1.0
> **Date**: 2025-11-13 (목요일 오후 5:59)
> **Status**: Final
> **Owner**: Frontend Engineering Team

---

## Executive Summary

**One-Page Editor는 Sparklio.ai의 핵심 작업 환경으로서, 모든 비영상 산출물을 하나의 화면에서 역할(Role) 기반으로 편집하는 통합 에디터입니다.**

### 핵심 원칙

- **"브랜드 관련 모든 비영상 산출물을, 하나의 화면·하나의 에디터에서 역할(Role) 단위로 편집한다."**
- **Chat-Driven + Direct Edit 하이브리드**: 자연어 명령과 직접 편집 모두 지원
- **Review Buffer → Editor 통합**: AI 초안 → 검토 → 에디터 반영 → 발행
- **Brand Kit 연동**: 역할별로 브랜드 스타일 자동 적용

---

## 1. 목적 (Purpose)

### 1.1 비전

One-Page Editor는 다음을 목표로 설계되었습니다:

1. **모든 비영상 산출물의 편집 허브**
   - 상품상세페이지
   - 블로그 포스트
   - 랜딩/브로셔
   - SNS 카드/썸네일
   - 프레젠테이션(슬라이드형 페이지)

2. **역할(Role) 중심 편집**
   - 단순 텍스트/이미지가 아니라 `headline`, `product_name`, `price_block`, `cta_button` 같은 의미 있는 역할로 관리
   - 에이전트가 역할 기준으로 콘텐츠를 이해하고 수정할 수 있도록 설계

3. **챗 + 직접 편집 하이브리드**
   - 사용자는 마우스/키보드로 직접 수정할 수도 있고
   - "헤드라인 더 강하게", "USP 섹션 하나 더 추가해줘" 같은 자연어 명령으로도 수정 가능
   - 양쪽 모두 동일한 Editor Action 스키마로 처리

4. **Review Buffer → Editor 흐름**
   - 모든 산출물은 먼저 "초안(Review Buffer)"로 생성
   - 사용자가 검토/수정 후 "에디터에 반영 → 저장/발행"까지 진행

### 1.2 기술 스택

| 레이어 | 기술 | 용도 |
|--------|------|------|
| **Canvas Engine** | Fabric.js | 객체 기반 캔버스 렌더링, 드래그/리사이즈 |
| **State Management** | Zustand | 문서 상태, undo/redo 스택 관리 |
| **UI Framework** | Next.js + Tailwind CSS | 레이아웃, 패널, 툴바 |
| **WebSocket** | Socket.io | 실시간 AI 명령 처리, 협업 편집 |
| **Data Format** | JSON (SparklioDocument) | 문서 저장/로드 형식 |

---

## 2. 화면 레이아웃 (UI Layout)

### 2.1 전체 구조

```text
┌─────────────────────────────────────────────────────────────────────┐
│ 상단 바 (Top Bar)                                                    │
│ - 문서명, 브랜드명, 저장 상태, 실행취소/다시실행, 발행 버튼         │
├──────────────┬────────────────────────────────────┬─────────────────┤
│ 좌측 패널    │       캔버스 영역                  │ 우측 패널       │
│ (페이지/섹션)│  (Fabric.js Canvas)                │ (속성/AI/스타일)│
│              │                                    │                 │
│ - 페이지 목록│  - 텍스트/이미지/도형 렌더링      │ - 속성 패널     │
│ - 섹션 목록  │  - 드래그/리사이즈/회전/정렬       │ - AI 명령 패널  │
│ - 레이어 트리│  - 스냅/그리드 옵션                │ - Brand Preset  │
│              │  - 역할(Role) 하이라이트           │                 │
├──────────────┴────────────────────────────────────┴─────────────────┤
│ 하단 바 (Bottom Bar)                                                │
│ - 줌 인/아웃 (50% ~ 200%)                                           │
│ - 현재 페이지 정보 (Page 1 of 3)                                    │
│ - 상태 메시지 (저장됨, AI 처리중 등)                                │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 좌측 패널 (Left Panel)

**기능**: 문서 구조 탐색 및 관리

#### 2.2.1 페이지 목록
- 멀티 페이지 문서 지원 (예: 상품상세 1페이지, 후기 2페이지)
- 페이지 추가/삭제/순서 변경
- 페이지 썸네일 미리보기

#### 2.2.2 섹션(Section) 목록
- 역할 기반 섹션 구분
  - Hero, USP, 리뷰, FAQ, CTA 등
- 섹션 접기/펼치기
- 섹션 드래그로 순서 변경

#### 2.2.3 레이어 트리
- 객체 계층 구조 표시
- 객체 잠금/숨기기
- 그룹/언그룹

### 2.3 캔버스 영역 (Canvas Area)

**기능**: Fabric.js 기반 객체 편집

#### 2.3.1 기본 기능
- **선택**: 클릭/드래그로 객체 선택
- **이동**: 드래그로 위치 변경
- **리사이즈**: 모서리 핸들로 크기 조정
- **회전**: 회전 핸들로 각도 조정
- **정렬**: 좌/중앙/우 정렬, 상/중/하 정렬
- **스냅**: 가이드라인, 그리드 스냅

#### 2.3.2 역할(Role) 하이라이트
- 선택된 객체의 역할을 뱃지로 표시
  - 예: `[headline]`, `[product_name]`, `[cta_button]`
- 역할별 색상 코딩
  - headline: 파란색
  - cta_button: 초록색
  - body: 회색

#### 2.3.3 상황별 툴바
- 텍스트 선택 시: 폰트, 크기, 색상, 정렬
- 이미지 선택 시: 필터, 크롭, 효과
- 도형 선택 시: 채우기, 테두리, 그림자

### 2.4 우측 패널 (Right Panel)

**기능**: 선택된 객체의 속성 편집 및 AI 명령

#### 2.4.1 속성 패널 (Properties Panel)
```yaml
텍스트 속성:
  - 내용 (content)
  - 폰트 (fontFamily)
  - 크기 (fontSize)
  - 색상 (fill)
  - 굵기 (fontWeight)
  - 정렬 (textAlign)
  - 줄 간격 (lineHeight)
  - 자간 (charSpacing)

이미지 속성:
  - 소스 URL (src)
  - 필터 (grayscale, sepia, blur 등)
  - 투명도 (opacity)
  - 크롭 (crop)

공통 속성:
  - 위치 (x, y)
  - 크기 (width, height)
  - 회전 (angle)
  - 역할 (role)
  - 레이어 순서 (zIndex)
```

#### 2.4.2 AI 명령 패널 (AI Command Panel)
```yaml
자연어 명령 예시:
  - "헤드라인을 더 강렬하게 바꿔줘"
  - "이 섹션의 톤을 프리미엄 느낌으로 변경"
  - "USP 섹션을 하나 더 추가해줘"
  - "CTA 버튼 색상을 브랜드 컬러로"
  - "이미지를 좀 더 밝게"

실행 플로우:
  1. 사용자 명령 입력
  2. EditorCommandParserAgent 분석
  3. EditorAction[] 생성
  4. Canvas 업데이트
  5. Undo 스택 저장
```

#### 2.4.3 Brand Style Preset
- Brand Kit 기반 스타일 미리보기
- 폰트 프리셋 (Primary, Body, Caption)
- 컬러 팔레트 (Primary, Secondary, Accent)
- 버튼 스타일 (Solid, Outline, Ghost)
- 역할별 기본 스타일 적용 버튼

### 2.5 상단 바 (Top Bar)

```yaml
좌측:
  - 문서명 (편집 가능)
  - 브랜드명 (읽기 전용)
  - 자동 저장 상태 (저장됨 / 저장 중...)

중앙:
  - 실행취소 (Undo) ⟲
  - 다시실행 (Redo) ⟳
  - 편집 모드 토글 (편집 / 미리보기)

우측:
  - [임시저장] 버튼
  - [발행] 버튼
  - [공유] 버튼
  - 사용자 아바타
```

### 2.6 하단 바 (Bottom Bar)

```yaml
좌측:
  - 줌 레벨 (50%, 75%, 100%, 125%, 150%, 200%)
  - 화면 맞춤 (Fit to Screen)

중앙:
  - 현재 페이지 정보 (Page 1 of 3)
  - 페이지 네비게이션 (◀ ▶)

우측:
  - 상태 메시지
    - "저장 완료"
    - "AI 처리 중..."
    - "발행 성공"
```

---

## 3. Role Taxonomy (역할 체계)

역할은 **"콘텐츠가 어떤 의미/기능을 가지는지"**를 나타냅니다.
에디터와 에이전트는 이 역할을 기준으로 동작합니다.

### 3.1 공통 역할 (모든 문서 유형 공통)

| Role | 설명 | 주요 사용 위치 | 에이전트 관련 |
|------|------|----------------|---------------|
| `headline` | 가장 핵심 메인 문구 | Hero, 상단 영역 | StrategistAgent, CopywriterAgent |
| `subheadline` | 서브 제목 | Hero 아래, 섹션 타이틀 | CopywriterAgent |
| `body` | 일반 본문 텍스트 | 전 영역 | CopywriterAgent |
| `tagline` | 짧은 브랜드/캠페인 구호 | 상단/푸터 | StrategistAgent |
| `cta_button` | 행동 유도 버튼 (구매/문의/다운로드) | Hero, 가격/CTA 영역 | CopywriterAgent |
| `image_primary` | 메인 상징 이미지 | Hero, 상단 영역 | VisionGeneratorAgent |
| `image_secondary` | 서브/보조 이미지 | USP/설명/후기 섹션 | VisionGeneratorAgent |
| `icon` | 작은 아이콘 | 리스트, USP, 기능 설명 | VisionGeneratorAgent |
| `logo` | 브랜드 로고 | 헤더, 푸터 | Brand Kit |
| `divider` | 구분선 | 섹션 구분 | TemplateAgent |

### 3.2 상품상세/랜딩 전용 역할

| Role | 설명 | 에이전트 관련 |
|------|------|---------------|
| `product_name` | 상품명 | CopywriterAgent |
| `product_summary` | 한 줄 요약 | CopywriterAgent |
| `feature_list` | 주요 특징 리스트 | StrategistAgent, CopywriterAgent |
| `spec_table` | 스펙 표 | DataCollectorAgent |
| `price_block` | 가격, 할인가, 조건 | DataCollectorAgent |
| `benefit_section` | 혜택/강점 설명 섹션 | StrategistAgent |
| `comparison_table` | 경쟁사/기존 제품과 비교 표 | StrategistAgent |
| `review_section` | 고객 후기 전체 섹션 | TrendAgent |
| `review_item` | 개별 후기 카드 | TrendAgent |
| `faq_section` | FAQ 전체 섹션 | CopywriterAgent |
| `faq_item` | 개별 FAQ 항목 | CopywriterAgent |
| `trust_badge` | 신뢰 배지 (인증, 수상 등) | BrandAnalyzerAgent |

### 3.3 블로그/콘텐츠 전용 역할

| Role | 설명 | 에이전트 관련 |
|------|------|---------------|
| `post_title` | 블로그 글 제목 | CopywriterAgent, SEOAgent |
| `post_subtitle` | 부제 | CopywriterAgent |
| `post_intro` | 도입부 문단 | CopywriterAgent |
| `post_section_title` | 본문 섹션 제목 | CopywriterAgent |
| `post_quote` | 인용구(quote) | CopywriterAgent |
| `post_image` | 본문 내 이미지 | VisionGeneratorAgent |
| `post_author` | 작성자 정보 | DataCollectorAgent |
| `post_meta` | 메타 정보 (날짜, 카테고리 등) | SEOAgent |

### 3.4 프레젠테이션/브로셔 전용 역할

| Role | 설명 | 에이전트 관련 |
|------|------|---------------|
| `slide_title` | 슬라이드 제목 | StrategistAgent |
| `slide_subtitle` | 슬라이드 서브 제목 | CopywriterAgent |
| `bullet_list` | 불릿 리스트 | CopywriterAgent |
| `chart_area` | 차트/그래프 영역 | DataCollectorAgent |
| `section_divider` | 구분 슬라이드/섹션 헤더 | TemplateAgent |
| `slide_number` | 슬라이드 번호 | TemplateAgent |
| `speaker_note` | 발표자 노트 | CopywriterAgent |

### 3.5 역할 확장 원칙

```yaml
새 역할 추가 시:
  1. 의미가 명확해야 함
     - ❌ text_001 (의미 없음)
     - ✅ testimonial_quote (의미 명확)

  2. 에이전트가 이해 가능해야 함
     - EditorCommandParserAgent가 자연어로 참조 가능
     - "고객 후기 섹션 추가해줘" → review_section

  3. Brand Kit과 매핑 가능해야 함
     - 역할마다 기본 스타일 정의 가능

  4. 문서 타입별로 의미가 달라질 수 있음
     - blog에서 headline: 글 제목
     - product_detail에서 headline: 제품 캐치프레이즈
```

---

## 4. Document & Object Schema

### 4.1 Document 타입

```typescript
type SparklioDocumentType =
  | "product_detail"      // 상품상세페이지
  | "blog"                // 블로그 포스트
  | "brochure"            // 브로셔
  | "sns_card"            // SNS 카드/썸네일
  | "deck"                // 프레젠테이션
  | "landing"             // 랜딩페이지
  | "email"               // 이메일 템플릿
  | "infographic";        // 인포그래픽
```

### 4.2 Document 스키마

```typescript
interface SparklioDocument {
  // 기본 정보
  documentId: string;           // "doc_20251113_001"
  brandId: string;              // "brand_456"
  type: SparklioDocumentType;

  // 메타데이터
  meta: {
    name: string;               // "신제품 상세페이지"
    description?: string;
    source?: string;            // "brief_v1_123"
    llmModel?: string;          // "gpt-4o"
    version: number;            // 1
    createdAt: string;          // ISO 8601
    updatedAt: string;
    createdBy: string;          // "user_789"
    tags?: string[];            // ["summer", "campaign"]
  };

  // 페이지 목록
  pages: SparklioPage[];

  // 브랜드 설정
  brandKit?: {
    brandKitId: string;
    appliedAt: string;
  };

  // 협업 정보 (v1.1 확장)
  collaboration?: {
    isShared: boolean;
    sharedWith: string[];       // user IDs
    permissions: Record<string, "view" | "edit">;
  };
}
```

### 4.3 Page 스키마

```typescript
interface SparklioPage {
  pageId: string;               // "page_001"
  name: string;                 // "메인 상세"

  // 캔버스 크기
  width: number;                // 1200
  height: number;               // 2400

  // 배경
  background?: {
    type: "color" | "gradient" | "image";
    value: string;              // "#FFFFFF" or "url(...)"
  };

  // 객체 목록
  objects: SparklioObject[];

  // 페이지 설정
  settings?: {
    gridSize?: number;          // 10
    snapToGrid?: boolean;
    guides?: Array<{
      type: "horizontal" | "vertical";
      position: number;
    }>;
  };
}
```

### 4.4 Object 스키마

```typescript
type SparklioObjectType =
  | "text"
  | "image"
  | "shape"
  | "group"
  | "frame"
  | "icon"
  | "button";

interface SparklioObject {
  // 기본 정보
  id: string;                   // "text_001"
  type: SparklioObjectType;
  role?: string;                // Role Taxonomy 기준

  // 위치 및 크기
  position: { x: number; y: number };
  size?: { width: number; height: number };
  rotation?: number;            // 각도 (0-360)

  // 스타일
  style?: Record<string, any>;  // Fabric.js 속성

  // 레이어
  layerIndex: number;           // z-index
  locked?: boolean;             // 편집 잠금
  visible?: boolean;            // 표시/숨김

  // 그룹
  groupId?: string;             // 섹션/그룹 단위 묶음

  // 메타데이터
  meta?: {
    generatedBy?: string;       // "CopywriterAgent"
    dataBinding?: string;       // "{{product.price}}"
    altText?: string;           // 이미지 alt
    linkUrl?: string;           // 클릭 시 링크
  };
}
```

### 4.5 텍스트 객체 예시

```typescript
const headlineObject: SparklioObject = {
  id: "text_headline_001",
  type: "text",
  role: "headline",
  position: { x: 100, y: 50 },
  size: { width: 800, height: 80 },
  rotation: 0,
  layerIndex: 10,
  style: {
    fontFamily: "Pretendard",
    fontSize: 48,
    fontWeight: 700,
    fill: "#1A1A1A",
    textAlign: "center",
    lineHeight: 1.2,
    text: "당신의 일상을 한 단계 끌어올리는 프리미엄 선택"
  },
  meta: {
    generatedBy: "CopywriterAgent",
    dataBinding: "{{brief.headline}}"
  }
};
```

### 4.6 이미지 객체 예시

```typescript
const heroImageObject: SparklioObject = {
  id: "image_hero_001",
  type: "image",
  role: "image_primary",
  position: { x: 200, y: 150 },
  size: { width: 600, height: 400 },
  rotation: 0,
  layerIndex: 5,
  style: {
    src: "https://cdn.sparklio.ai/brand_456/hero_001.jpg",
    opacity: 1,
    filters: ["brightness(1.1)", "contrast(1.05)"],
    borderRadius: 8,
    shadow: "0 4px 12px rgba(0,0,0,0.1)"
  },
  meta: {
    generatedBy: "VisionGeneratorAgent",
    altText: "프리미엄 제품 이미지"
  }
};
```

### 4.7 버튼 객체 예시

```typescript
const ctaButtonObject: SparklioObject = {
  id: "button_cta_001",
  type: "button",
  role: "cta_button",
  position: { x: 400, y: 600 },
  size: { width: 200, height: 56 },
  rotation: 0,
  layerIndex: 20,
  style: {
    backgroundColor: "#0066FF",
    color: "#FFFFFF",
    fontFamily: "Pretendard",
    fontSize: 18,
    fontWeight: 600,
    borderRadius: 8,
    padding: "16px 32px",
    text: "지금 구매하기"
  },
  meta: {
    linkUrl: "/checkout",
    generatedBy: "CopywriterAgent"
  }
};
```

---

## 5. Editor Action Schema (에디터/에이전트 공통 언어)

에디터와 에이전트는 모두 **EditorAction** 객체로 상태를 변경합니다.

### 5.1 Action 타입

```typescript
type EditorActionType =
  | "insert_object"      // 새 객체 추가
  | "update_object"      // 객체 내용 수정
  | "delete_object"      // 객체 삭제
  | "update_style"       // 스타일만 변경
  | "move_object"        // 위치 이동
  | "resize_object"      // 크기 조정
  | "rotate_object"      // 회전
  | "insert_section"     // 섹션 추가
  | "delete_section"     // 섹션 삭제
  | "reorder_section"    // 섹션 순서 변경
  | "reorder_layer"      // 레이어 순서 변경
  | "group_objects"      // 객체 그룹화
  | "ungroup_objects"    // 그룹 해제
  | "duplicate_object"   // 객체 복제
  | "update_page"        // 페이지 설정 변경
  | "insert_page"        // 새 페이지 추가
  | "delete_page";       // 페이지 삭제
```

### 5.2 EditorAction 구조

```typescript
interface EditorAction {
  // 기본 정보
  type: EditorActionType;
  timestamp: string;         // ISO 8601
  userId: string;            // 실행자

  // 타겟 지정
  targetId?: string;         // 객체 ID
  targetRole?: string;       // 역할 기반 타겟
  targetPageId?: string;     // 페이지 ID

  // 액션 데이터
  payload: any;

  // Undo/Redo 지원
  previousState?: any;       // 이전 상태 (Undo용)

  // 메타데이터
  meta?: {
    source?: "user" | "agent" | "system";
    agentName?: string;      // "CopywriterAgent"
    commandText?: string;    // 원본 명령 (AI 명령인 경우)
  };
}
```

### 5.3 예시: 헤드라인 텍스트/스타일 변경

```typescript
const updateHeadlineAction: EditorAction = {
  type: "update_object",
  timestamp: "2025-11-13T17:59:00Z",
  userId: "user_789",
  targetRole: "headline",
  payload: {
    content: "새로운 강렬한 헤드라인",
    style: {
      fontSize: 52,
      color: "#1A73E8",
      fontWeight: 700,
      textAlign: "center"
    }
  },
  previousState: {
    content: "기존 헤드라인",
    style: {
      fontSize: 48,
      color: "#1A1A1A",
      fontWeight: 700
    }
  },
  meta: {
    source: "agent",
    agentName: "CopywriterAgent",
    commandText: "헤드라인을 더 강렬하게 바꿔줘"
  }
};
```

### 5.4 예시: USP 섹션 추가

```typescript
const insertSectionAction: EditorAction = {
  type: "insert_section",
  timestamp: "2025-11-13T18:00:00Z",
  userId: "user_789",
  targetPageId: "page_001",
  payload: {
    sectionRole: "benefit_section",
    position: "below_hero",  // 또는 { afterObjectId: "text_headline_001" }
    objects: [
      {
        id: "text_benefit_title_001",
        type: "text",
        role: "subheadline",
        position: { x: 100, y: 800 },
        style: {
          text: "왜 우리 제품을 선택해야 할까요?",
          fontSize: 32,
          fontWeight: 600
        }
      },
      {
        id: "text_benefit_item_001",
        type: "text",
        role: "feature_list",
        position: { x: 100, y: 860 },
        style: {
          text: "• 업계 최고 수준의 품질\n• 합리적인 가격\n• 24시간 고객 지원",
          fontSize: 18,
          lineHeight: 1.6
        }
      }
    ]
  },
  meta: {
    source: "agent",
    agentName: "StrategistAgent",
    commandText: "USP 섹션을 하나 더 추가해줘"
  }
};
```

### 5.5 예시: 객체 이동 (드래그)

```typescript
const moveObjectAction: EditorAction = {
  type: "move_object",
  timestamp: "2025-11-13T18:01:00Z",
  userId: "user_789",
  targetId: "image_hero_001",
  payload: {
    position: { x: 250, y: 200 }
  },
  previousState: {
    position: { x: 200, y: 150 }
  },
  meta: {
    source: "user"
  }
};
```

### 5.6 예시: 스타일만 변경

```typescript
const updateStyleAction: EditorAction = {
  type: "update_style",
  timestamp: "2025-11-13T18:02:00Z",
  userId: "user_789",
  targetId: "button_cta_001",
  payload: {
    style: {
      backgroundColor: "#FF6B00",  // Primary color로 변경
      borderRadius: 12
    }
  },
  previousState: {
    style: {
      backgroundColor: "#0066FF",
      borderRadius: 8
    }
  },
  meta: {
    source: "user"
  }
};
```

### 5.7 Action 적용 플로우

```typescript
class EditorActionManager {
  private undoStack: EditorAction[] = [];
  private redoStack: EditorAction[] = [];

  apply(action: EditorAction): void {
    // 1. Action 적용
    this.applyActionToDocument(action);

    // 2. Undo 스택에 저장
    this.undoStack.push(action);
    this.redoStack = []; // Redo 스택 초기화

    // 3. Canvas 업데이트
    this.updateCanvas();

    // 4. WebSocket 브로드캐스트 (협업 모드)
    if (action.meta?.source !== "remote") {
      this.broadcastAction(action);
    }
  }

  undo(): void {
    const lastAction = this.undoStack.pop();
    if (lastAction && lastAction.previousState) {
      this.revertAction(lastAction);
      this.redoStack.push(lastAction);
      this.updateCanvas();
    }
  }

  redo(): void {
    const lastUndone = this.redoStack.pop();
    if (lastUndone) {
      this.applyActionToDocument(lastUndone);
      this.undoStack.push(lastUndone);
      this.updateCanvas();
    }
  }
}
```

---

## 6. WebSocket 이벤트 설계 (자연어 명령 연동)

### 6.1 클라이언트 → 서버 (명령)

```typescript
interface EditorCommandEvent {
  event: "editor.command";
  documentId: string;
  brandId: string;
  userId: string;
  payload: {
    commandText: string;         // "헤드라인을 더 고급스럽게 바꿔줘"
    selection?: {
      objectIds?: string[];      // 선택된 객체 IDs
      roles?: string[];          // 선택된 역할들
      pageId?: string;
    };
    context?: {
      currentPage: number;
      brandKit?: BrandKit;
    };
  };
}
```

예시:
```json
{
  "event": "editor.command",
  "documentId": "doc_123",
  "brandId": "brand_456",
  "userId": "user_789",
  "payload": {
    "commandText": "헤드라인을 더 고급스럽게 바꿔줘",
    "selection": {
      "roles": ["headline"]
    },
    "context": {
      "currentPage": 1
    }
  }
}
```

### 6.2 서버 → 클라이언트 (액션 결과)

```typescript
interface EditorActionsEvent {
  event: "editor.actions";
  documentId: string;
  requestId: string;           // 요청 추적용
  payload: {
    status: "success" | "error";
    actions?: EditorAction[];
    error?: {
      code: string;
      message: string;
    };
    meta?: {
      agentName: string;
      processingTime: number;  // ms
      costEstimate?: number;   // $
    };
  };
}
```

예시:
```json
{
  "event": "editor.actions",
  "documentId": "doc_123",
  "requestId": "req_abc",
  "payload": {
    "status": "success",
    "actions": [
      {
        "type": "update_object",
        "targetRole": "headline",
        "payload": {
          "content": "당신의 일상을 한 단계 끌어올리는 프리미엄 선택",
          "style": {
            "fontSize": 52,
            "fontWeight": 700,
            "color": "#1A1A1A"
          }
        }
      }
    ],
    "meta": {
      "agentName": "CopywriterAgent",
      "processingTime": 1250,
      "costEstimate": 0.003
    }
  }
}
```

### 6.3 서버 → 클라이언트 (실시간 협업)

```typescript
interface EditorSyncEvent {
  event: "editor.sync";
  documentId: string;
  userId: string;              // 액션 실행자
  payload: {
    action: EditorAction;
    cursor?: {                 // 커서 위치 (협업 모드)
      x: number;
      y: number;
      userName: string;
      color: string;
    };
  };
}
```

### 6.4 에러 처리

```typescript
interface EditorErrorEvent {
  event: "editor.error";
  documentId: string;
  requestId: string;
  payload: {
    code: string;              // "INVALID_COMMAND", "AGENT_TIMEOUT" 등
    message: string;
    details?: any;
    retry?: boolean;
  };
}
```

---

## 7. Review Buffer → Editor 플로우

### 7.1 전체 프로세스

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ 브리프 작성 │────→│ AI 초안생성 │────→│Review Buffer│────→│   Editor    │
│   (Chat)    │     │  (Agents)   │     │  (검토/수정)│     │ (최종편집)  │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
                                                │
                                                ↓
                                          [초안 선택]
                                          [부분 수정]
                                          [스타일 조정]
```

### 7.2 Review Buffer UI

```yaml
레이아웃:
  상단:
    - 브리프 요약
    - AI 모델 정보 (gpt-4o-mini, 처리 시간 2.3초)
    - 예상 비용 ($0.05)

  중앙:
    초안 카드들:
      - 헤드라인 후보 3개
        ✓ "당신의 일상을 한 단계 끌어올리는 프리미엄 선택"
        ○ "품격있는 라이프스타일, 지금 시작하세요"
        ○ "차별화된 경험을 원한다면"

      - 섹션 구성안 2개
        ✓ Hero + USP + 리뷰 + FAQ + CTA
        ○ Hero + 비교표 + USP + CTA

      - 컬러 스킴 3개
        ✓ Modern Blue (#0066FF)
        ○ Premium Gold (#FFD700)
        ○ Natural Green (#4CAF50)

  하단:
    - [다시 생성] 버튼 (다른 옵션 요청)
    - [수정 요청] 버튼 (추가 명령)
    - [에디터에 반영] 버튼 (최종 선택)
```

### 7.3 초안 생성 → Review Buffer

```typescript
// 1. StrategistAgent + CopywriterAgent가 초안 생성
const draftDocument: SparklioDocument = {
  documentId: "draft_temp_001",
  brandId: "brand_456",
  type: "product_detail",
  pages: [
    {
      pageId: "page_001",
      name: "메인 상세",
      width: 1200,
      height: 2400,
      objects: [
        { /* headline */ },
        { /* image_primary */ },
        { /* product_name */ },
        // ... 더 많은 객체
      ]
    }
  ],
  meta: {
    name: "신제품 상세페이지 - 초안",
    source: "brief_v1_123",
    llmModel: "gpt-4o-mini",
    version: 0,  // 초안은 버전 0
    createdAt: "2025-11-13T18:00:00Z",
    updatedAt: "2025-11-13T18:00:00Z",
    createdBy: "user_789"
  }
};

// 2. Review Buffer에 표시
interface ReviewBufferState {
  drafts: {
    document: SparklioDocument;
    alternatives: {
      headlines: string[];        // 3개 후보
      layouts: LayoutOption[];    // 2개 레이아웃 안
      colorSchemes: ColorScheme[];// 3개 컬러 스킴
    };
    meta: {
      agentsUsed: string[];       // ["StrategistAgent", "CopywriterAgent"]
      processingTime: number;     // 2300ms
      costEstimate: number;       // $0.05
    };
  };
  userSelection: {
    headlineIndex: number;        // 0 (첫 번째 선택)
    layoutIndex: number;          // 0
    colorSchemeIndex: number;     // 0
  };
  userEdits: EditorAction[];      // 사용자가 Review Buffer에서 수정한 내역
}
```

### 7.4 Review Buffer → Editor 반영

```typescript
// 사용자가 [에디터에 반영] 버튼 클릭 시
function applyDraftToEditor(reviewState: ReviewBufferState): void {
  // 1. 선택된 안을 최종 Document로 변환
  const finalDocument: SparklioDocument = {
    ...reviewState.drafts.document,
    documentId: generateId("doc"),  // 새 ID 부여
    meta: {
      ...reviewState.drafts.document.meta,
      version: 1,                     // 버전 1로 승격
      name: "신제품 상세페이지",      // 임시 제거
      updatedAt: new Date().toISOString()
    }
  };

  // 2. 사용자 선택 반영
  applyUserSelection(finalDocument, reviewState.userSelection);

  // 3. 사용자 수정 내역 적용
  reviewState.userEdits.forEach(action => {
    applyAction(finalDocument, action);
  });

  // 4. Editor로 로드
  loadDocumentToEditor(finalDocument);

  // 5. 자동 저장
  saveDocument(finalDocument);
}
```

### 7.5 부분 수정 플로우

```yaml
Review Buffer에서 "헤드라인만 다시 생성":
  1. 사용자가 헤드라인 영역 클릭 + [다시 생성] 버튼
  2. WebSocket 명령 전송
     {
       "event": "editor.regenerate",
       "targetRole": "headline",
       "keepOthers": true
     }
  3. CopywriterAgent가 새 헤드라인 3개 생성
  4. Review Buffer 업데이트 (헤드라인 후보만 변경)
  5. 사용자 재선택
```

---

## 8. Brand Kit & Role 연동

### 8.1 Brand Kit 구조

```typescript
interface BrandKit {
  brandKitId: string;
  brandId: string;
  name: string;

  // 타이포그래피
  typography: {
    primary: {
      fontFamily: string;        // "Pretendard"
      weights: number[];         // [400, 600, 700]
    };
    body: {
      fontFamily: string;        // "Pretendard"
      weights: number[];         // [400, 500]
    };
    caption: {
      fontFamily: string;        // "Pretendard"
      weights: number[];         // [400]
    };
  };

  // 컬러 팔레트
  colors: {
    primary: string;             // "#0066FF"
    secondary: string;           // "#1A1A1A"
    accent: string;              // "#FF6B00"
    background: string;          // "#FFFFFF"
    surface: string;             // "#F5F5F5"
    text: {
      primary: string;           // "#1A1A1A"
      secondary: string;         // "#666666"
      disabled: string;          // "#CCCCCC"
    };
    success: string;             // "#4CAF50"
    warning: string;             // "#FFC107"
    error: string;               // "#F44336"
  };

  // 간격 시스템
  spacing: {
    unit: number;                // 8
    scale: number[];             // [4, 8, 16, 24, 32, 40, 48, 64, 80]
  };

  // 버튼 스타일
  buttons: {
    primary: {
      backgroundColor: string;   // colors.primary
      color: string;             // "#FFFFFF"
      borderRadius: number;      // 8
      padding: string;           // "12px 24px"
      fontSize: number;          // 16
      fontWeight: number;        // 600
    };
    secondary: {
      backgroundColor: string;   // "transparent"
      color: string;             // colors.primary
      border: string;            // "2px solid"
      borderColor: string;       // colors.primary
      borderRadius: number;      // 8
      padding: string;           // "12px 24px"
    };
    ghost: {
      backgroundColor: string;   // "transparent"
      color: string;             // colors.primary
      borderRadius: number;      // 8
      padding: string;           // "12px 24px"
    };
  };

  // 그림자
  shadows: {
    sm: string;                  // "0 1px 2px rgba(0,0,0,0.05)"
    md: string;                  // "0 4px 6px rgba(0,0,0,0.1)"
    lg: string;                  // "0 10px 15px rgba(0,0,0,0.1)"
    xl: string;                  // "0 20px 25px rgba(0,0,0,0.1)"
  };

  // 테두리
  borders: {
    radius: {
      sm: number;                // 4
      md: number;                // 8
      lg: number;                // 12
      full: number;              // 9999
    };
  };
}
```

### 8.2 Role → Brand Style 매핑

```typescript
const roleBrandStyleMap: Record<string, (brandKit: BrandKit) => any> = {
  headline: (brandKit) => ({
    fontFamily: brandKit.typography.primary.fontFamily,
    fontSize: 48,
    fontWeight: 700,
    color: brandKit.colors.text.primary,
    lineHeight: 1.2
  }),

  subheadline: (brandKit) => ({
    fontFamily: brandKit.typography.primary.fontFamily,
    fontSize: 32,
    fontWeight: 600,
    color: brandKit.colors.text.primary,
    lineHeight: 1.3
  }),

  body: (brandKit) => ({
    fontFamily: brandKit.typography.body.fontFamily,
    fontSize: 16,
    fontWeight: 400,
    color: brandKit.colors.text.primary,
    lineHeight: 1.6
  }),

  tagline: (brandKit) => ({
    fontFamily: brandKit.typography.primary.fontFamily,
    fontSize: 20,
    fontWeight: 600,
    color: brandKit.colors.primary,
    lineHeight: 1.4
  }),

  cta_button: (brandKit) => ({
    ...brandKit.buttons.primary,
    shadow: brandKit.shadows.md
  }),

  product_name: (brandKit) => ({
    fontFamily: brandKit.typography.primary.fontFamily,
    fontSize: 36,
    fontWeight: 700,
    color: brandKit.colors.text.primary,
    lineHeight: 1.3
  }),

  price_block: (brandKit) => ({
    fontFamily: brandKit.typography.primary.fontFamily,
    fontSize: 28,
    fontWeight: 700,
    color: brandKit.colors.accent,
    backgroundColor: brandKit.colors.surface,
    padding: brandKit.spacing.scale[3], // 24px
    borderRadius: brandKit.borders.radius.md
  })

  // ... 더 많은 역할
};
```

### 8.3 에디터에서 Brand Style 적용

```typescript
class BrandStyleApplier {
  constructor(private brandKit: BrandKit) {}

  // 새 객체 생성 시 자동 적용
  applyBrandStyleToObject(object: SparklioObject): SparklioObject {
    if (!object.role) return object;

    const styleGetter = roleBrandStyleMap[object.role];
    if (!styleGetter) return object;

    const brandStyle = styleGetter(this.brandKit);

    return {
      ...object,
      style: {
        ...brandStyle,
        ...object.style  // 사용자 커스텀 우선
      }
    };
  }

  // 역할 변경 시 스타일 재적용
  changeRoleAndReapplyStyle(
    object: SparklioObject,
    newRole: string
  ): SparklioObject {
    const updatedObject = { ...object, role: newRole };
    return this.applyBrandStyleToObject(updatedObject);
  }

  // Brand Kit 업데이트 시 전체 문서 스타일 갱신
  updateAllObjectsWithNewBrandKit(
    document: SparklioDocument,
    newBrandKit: BrandKit
  ): SparklioDocument {
    this.brandKit = newBrandKit;

    return {
      ...document,
      pages: document.pages.map(page => ({
        ...page,
        objects: page.objects.map(obj =>
          this.applyBrandStyleToObject(obj)
        )
      }))
    };
  }
}
```

### 8.4 우측 패널 - Brand Style Preset UI

```yaml
Brand Style Preset 패널:
  타이포그래피:
    - [Primary Font] Pretendard Bold
    - [Body Font] Pretendard Regular
    - [Caption Font] Pretendard Regular

  컬러 팔레트:
    - ■ Primary (#0066FF)
    - ■ Secondary (#1A1A1A)
    - ■ Accent (#FF6B00)
    - ■ Background (#FFFFFF)

  버튼 스타일:
    - [Primary Button 적용] (배경 Primary 색상)
    - [Secondary Button 적용] (테두리만)
    - [Ghost Button 적용] (투명 배경)

  간격:
    - [적용] 8px 그리드
    - [적용] 16px 여백
    - [적용] 24px 여백
```

---

## 9. 개발 단계 (Phase별 구현 계획)

### Phase 0: 기반 설정 (1주)

```yaml
환경 구축:
  - Next.js 프로젝트 초기화
  - Fabric.js 설치 및 기본 Canvas 셋업
  - Zustand 상태 관리 설정
  - Socket.io 클라이언트 설정

디렉토리 구조:
  /pages
    /editor/[documentId].tsx  # 에디터 메인 페이지
  /components
    /Editor
      - TopBar.tsx
      - LeftPanel.tsx
      - Canvas.tsx
      - RightPanel.tsx
      - BottomBar.tsx
  /stores
    - editorStore.ts           # Zustand store
  /types
    - document.ts
    - action.ts
  /lib
    - fabricHelpers.ts
    - actionManager.ts
```

### Phase 1: 에디터 골격 (2주)

```yaml
레이아웃 구현:
  - [x] Top Bar 컴포넌트
  - [x] Left Panel (페이지/섹션/레이어 트리)
  - [x] Canvas Area (Fabric.js 초기화)
  - [x] Right Panel (속성 패널)
  - [x] Bottom Bar (줌, 페이지 네비게이션)

기본 기능:
  - [x] 텍스트 객체 추가
  - [x] 이미지 객체 추가
  - [x] 도형 객체 추가
  - [x] 객체 선택/이동/리사이즈
  - [x] 레이어 순서 변경
  - [x] 객체 삭제

파일 작업:
  - [x] Document JSON 저장
  - [x] Document JSON 로드
  - [x] 자동 저장 (5초마다)
```

### Phase 2: Document/Role/Action 도입 (2주)

```yaml
타입 시스템:
  - [x] SparklioDocument 인터페이스
  - [x] SparklioObject 인터페이스
  - [x] EditorAction 인터페이스
  - [x] Role Taxonomy 타입

Document 관리:
  - [x] Document → Canvas 렌더링
  - [x] Canvas → Document 동기화
  - [x] 멀티 페이지 지원
  - [x] 섹션 그룹 관리

Role 기능:
  - [x] 객체에 역할 부여
  - [x] 역할 표시 (뱃지)
  - [x] 역할 변경 UI
  - [x] 역할별 색상 코딩

EditorAction:
  - [x] EditorAction 스키마 구현
  - [x] Action 적용 로직
  - [x] Undo 스택
  - [x] Redo 스택
  - [x] Action History 뷰어
```

### Phase 3: Brand Kit 연동 (1주)

```yaml
Brand Kit:
  - [x] BrandKit 인터페이스 정의
  - [x] Brand Style Preset UI
  - [x] Role → Brand Style 매핑
  - [x] 새 객체에 Brand Style 자동 적용
  - [x] 역할 변경 시 스타일 재적용

우측 패널:
  - [x] Brand Style Preset 표시
  - [x] 폰트/컬러 원클릭 적용
  - [x] 버튼 스타일 프리셋
```

### Phase 4: AI 연동 v0 (2주)

```yaml
WebSocket:
  - [x] Socket.io 연결
  - [x] editor.command 이벤트 송신
  - [x] editor.actions 이벤트 수신
  - [x] 에러 처리

AI 명령 패널:
  - [x] 자연어 입력 필드
  - [x] 명령 히스토리
  - [x] 로딩 상태 표시
  - [x] 에러 메시지 표시

에이전트 연동:
  - [x] EditorCommandParserAgent 호출
  - [x] EditorAction 배열 수신
  - [x] Action 자동 적용
  - [x] Undo/Redo 통합
```

### Phase 5: Review Buffer 통합 (1주)

```yaml
Review Buffer UI:
  - [x] 초안 카드 레이아웃
  - [x] 헤드라인/레이아웃/컬러 선택 UI
  - [x] [에디터에 반영] 버튼
  - [x] [다시 생성] 버튼

플로우:
  - [x] 브리프 → 초안 생성
  - [x] Review Buffer 표시
  - [x] 사용자 선택/수정
  - [x] Editor로 로드
  - [x] 자동 저장
```

### Phase 6: 고급 기능 (2주)

```yaml
캔버스:
  - [ ] 그리드/가이드라인
  - [ ] 스냅 (객체/그리드)
  - [ ] 정렬 도구 (좌/중/우/상/중/하)
  - [ ] 분산 도구 (가로/세로)
  - [ ] 그룹/언그룹
  - [ ] 객체 복제 (Ctrl+D)

단축키:
  - [ ] Ctrl+Z (Undo)
  - [ ] Ctrl+Y (Redo)
  - [ ] Ctrl+C/V (복사/붙여넣기)
  - [ ] Delete (삭제)
  - [ ] Ctrl+D (복제)
  - [ ] Ctrl+G (그룹)
  - [ ] Ctrl+Shift+G (언그룹)

협업:
  - [ ] 멀티 커서 표시
  - [ ] 실시간 동기화 (WebSocket)
  - [ ] 충돌 해결
```

### Phase 7: 최적화 & 테스트 (1주)

```yaml
성능 최적화:
  - [ ] Canvas 렌더링 최적화
  - [ ] Document 직렬화/역직렬화 최적화
  - [ ] WebSocket 메시지 압축

테스트:
  - [ ] 단위 테스트 (Jest)
  - [ ] 통합 테스트
  - [ ] E2E 테스트 (Playwright)
  - [ ] 부하 테스트 (100명 동시 편집)

문서화:
  - [ ] 사용자 가이드
  - [ ] 개발자 문서
  - [ ] API 문서
```

---

## 10. 향후 확장 (로드맵)

### 10.1 v1.1 (3개월 후)

```yaml
반응형 프리뷰:
  - 모바일 프리뷰 (375px, 414px)
  - 태블릿 프리뷰 (768px, 1024px)
  - 데스크톱 프리뷰 (1440px, 1920px)
  - 반응형 레이아웃 자동 조정

협업 편집:
  - 멀티 커서 (Google Docs 스타일)
  - 코멘트 시스템
  - 버전 히스토리 (Git 스타일)
  - 브랜치/머지

AI 고급 기능:
  - "이 섹션을 A/B 테스트용 2개 버전으로"
  - "경쟁사 스타일 분석해서 적용해줘"
  - "모바일 최적화해줘"
```

### 10.2 v1.2 (6개월 후)

```yaml
템플릿 엔진:
  - 역할 기반 자동 레이아웃 생성
  - 산업별 템플릿 (이커머스, SaaS, F&B)
  - 사용자 커스텀 템플릿 저장

플랫폼 연동:
  - Google Ads 크리에이티브 프리뷰
  - Facebook Ads 크리에이티브 프리뷰
  - Instagram 피드/스토리 프리뷰
  - 네이버 쇼핑 상세 프리뷰

고급 에디팅:
  - 레이어 효과 (블렌드 모드, 불투명도)
  - 마스크/클리핑
  - 벡터 편집 (베지어 곡선)
  - 애니메이션 (간단한 트랜지션)
```

### 10.3 v2.0 (12개월 후)

```yaml
3D 지원:
  - 3D 객체 임포트
  - 3D 텍스트
  - 3D 씬 편집

AR 프리뷰:
  - 모바일 AR 프리뷰
  - QR 코드 스캔 → AR 보기

AI 완전 자동화:
  - "브리프만 주면 완성까지"
  - 자동 A/B 테스트 생성
  - 자동 다국어 버전 생성
```

---

## 11. 성능 요구사항

### 11.1 응답 시간

| 작업 | 목표 | 측정 방법 |
|------|------|-----------|
| **Canvas 렌더링** | 초기 로드 < 1s | Performance API |
| **객체 추가** | < 100ms | Performance API |
| **객체 이동** | < 16ms (60fps) | requestAnimationFrame |
| **Undo/Redo** | < 50ms | Performance API |
| **Document 저장** | < 500ms | Network timing |
| **AI 명령 처리** | < 3s | WebSocket roundtrip |

### 11.2 동시 사용자

- **목표**: 100명 동시 편집 지원
- **테스트**: Artillery, k6
- **WebSocket 연결**: 안정적인 1000 동시 연결

### 11.3 메모리 사용

- **브라우저 메모리**: < 500MB (일반 문서)
- **Canvas 객체 수**: 최대 1000개
- **페이지 수**: 최대 50페이지

---

## 12. 보안 요구사항

### 12.1 인증/권한

```yaml
인증:
  - JWT 토큰 기반
  - Refresh Token 자동 갱신
  - Session 타임아웃 (30분)

권한:
  - 문서 소유자 (Owner): 모든 권한
  - 편집자 (Editor): 편집 가능, 삭제 불가
  - 뷰어 (Viewer): 읽기 전용
```

### 12.2 데이터 보호

```yaml
전송:
  - HTTPS (TLS 1.3)
  - WebSocket Secure (WSS)

저장:
  - 문서 암호화 (AES-256)
  - 민감 데이터 마스킹

접근 제어:
  - IP 화이트리스트 (엔터프라이즈)
  - 2FA (Two-Factor Authentication)
```

### 12.3 XSS/CSRF 방어

```yaml
XSS:
  - 모든 사용자 입력 sanitize
  - DOMPurify 사용
  - Content Security Policy

CSRF:
  - CSRF 토큰
  - SameSite Cookie
```

---

## 13. 테스트 전략

### 13.1 단위 테스트 (Jest)

```typescript
// Example: EditorAction 테스트
describe("EditorActionManager", () => {
  it("should apply update_object action", () => {
    const action: EditorAction = {
      type: "update_object",
      targetId: "text_001",
      payload: { content: "New text" }
    };

    const result = actionManager.apply(action);

    expect(result.objects[0].style.text).toBe("New text");
  });

  it("should undo action", () => {
    actionManager.apply(action);
    actionManager.undo();

    expect(document.objects[0].style.text).toBe("Old text");
  });
});
```

### 13.2 통합 테스트

```yaml
테스트 시나리오:
  1. 문서 생성 → 객체 추가 → 저장 → 로드
  2. AI 명령 → 액션 수신 → Canvas 업데이트
  3. Review Buffer → 선택 → Editor 반영
  4. Brand Kit 변경 → 모든 객체 스타일 업데이트
```

### 13.3 E2E 테스트 (Playwright)

```typescript
test("should create and edit document", async ({ page }) => {
  await page.goto("/editor/new");

  // 텍스트 추가
  await page.click("[data-testid='add-text']");
  await page.fill("[data-testid='text-input']", "Test headline");

  // 스타일 변경
  await page.selectOption("[data-testid='font-size']", "48");

  // 저장
  await page.click("[data-testid='save-button']");

  // 저장 확인
  await expect(page.locator("[data-testid='save-status']")).toHaveText("저장됨");
});
```

---

## 14. 에러 처리 및 복구

### 14.1 에러 분류

```typescript
enum EditorErrorCode {
  // 네트워크 에러
  NETWORK_ERROR = "NETWORK_ERROR",
  WEBSOCKET_DISCONNECTED = "WEBSOCKET_DISCONNECTED",

  // 데이터 에러
  INVALID_DOCUMENT = "INVALID_DOCUMENT",
  OBJECT_NOT_FOUND = "OBJECT_NOT_FOUND",

  // AI 에러
  AGENT_TIMEOUT = "AGENT_TIMEOUT",
  AGENT_ERROR = "AGENT_ERROR",
  INVALID_COMMAND = "INVALID_COMMAND",

  // 권한 에러
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",

  // 시스템 에러
  CANVAS_RENDER_ERROR = "CANVAS_RENDER_ERROR",
  MEMORY_LIMIT_EXCEEDED = "MEMORY_LIMIT_EXCEEDED"
}
```

### 14.2 에러 복구 전략

```yaml
자동 복구:
  - WebSocket 재연결 (최대 5회, 지수 백오프)
  - Document 자동 저장 복구 (localStorage 백업)
  - Canvas 렌더링 실패 시 재시도

사용자 알림:
  - Toast 알림 (경고, 에러)
  - Modal 알림 (치명적 에러)
  - 상태바 메시지

로깅:
  - Sentry 연동
  - 에러 스택 트레이스
  - 사용자 액션 히스토리
```

---

## 15. 문서 간 통합 포인트

### 15.1 Phase 0 문서 연동

```yaml
AGENTS_SPEC.md:
  - EditorCommandParserAgent
  - CopywriterAgent → headline/body 생성
  - VisionGeneratorAgent → image_primary/secondary 생성
  - TemplateAgent → 역할 기반 레이아웃 생성

TECH_DECISION_v1.md:
  - Fabric.js 선택 근거
  - Zustand vs Redux 비교
  - WebSocket 이벤트 설계

LLM_ROUTER_POLICY.md:
  - AI 명령 처리 시 모델 선택
  - 비용 경보 시스템 연동

BRAND_LEARNING_ENGINE.md:
  - Brand Kit 자동 생성
  - 역할별 스타일 학습
  - Review Buffer 패턴

MVP_v0_SCOPE_PLAN.md:
  - Editor 개발 우선순위
  - Phase별 구현 일정
```

---

## 16. 변경 이력

| 날짜 | 버전 | 변경 내용 | 작성자 |
|------|------|-----------|--------|
| 2025-11-13 (목) | 1.0 | 초기 작성 - 역할 기반 에디터 설계, Document/Action 스키마, Brand Kit 연동, Review Buffer 플로우, 개발 단계 정의 | Frontend Team |

---

## 17. 부록: 참조 코드

### 17.1 EditorStore (Zustand)

```typescript
import create from 'zustand';

interface EditorStore {
  document: SparklioDocument | null;
  selectedObjectIds: string[];
  undoStack: EditorAction[];
  redoStack: EditorAction[];

  // Actions
  setDocument: (document: SparklioDocument) => void;
  applyAction: (action: EditorAction) => void;
  undo: () => void;
  redo: () => void;
  selectObjects: (ids: string[]) => void;
}

export const useEditorStore = create<EditorStore>((set, get) => ({
  document: null,
  selectedObjectIds: [],
  undoStack: [],
  redoStack: [],

  setDocument: (document) => set({ document }),

  applyAction: (action) => {
    const { document, undoStack } = get();
    if (!document) return;

    const newDocument = applyActionToDocument(document, action);

    set({
      document: newDocument,
      undoStack: [...undoStack, action],
      redoStack: []
    });
  },

  undo: () => {
    const { undoStack, redoStack } = get();
    const lastAction = undoStack[undoStack.length - 1];

    if (lastAction && lastAction.previousState) {
      set({
        document: revertAction(get().document!, lastAction),
        undoStack: undoStack.slice(0, -1),
        redoStack: [...redoStack, lastAction]
      });
    }
  },

  redo: () => {
    const { redoStack, undoStack } = get();
    const lastUndone = redoStack[redoStack.length - 1];

    if (lastUndone) {
      set({
        document: applyActionToDocument(get().document!, lastUndone),
        undoStack: [...undoStack, lastUndone],
        redoStack: redoStack.slice(0, -1)
      });
    }
  },

  selectObjects: (ids) => set({ selectedObjectIds: ids })
}));
```

### 17.2 WebSocket 훅

```typescript
import { useEffect } from 'react';
import io, { Socket } from 'socket.io-client';
import { useEditorStore } from '@/stores/editorStore';

export function useEditorWebSocket(documentId: string) {
  const applyAction = useEditorStore((state) => state.applyAction);

  useEffect(() => {
    const socket: Socket = io(process.env.NEXT_PUBLIC_WS_URL!);

    socket.emit('editor.join', { documentId });

    socket.on('editor.actions', (event: EditorActionsEvent) => {
      if (event.payload.status === 'success' && event.payload.actions) {
        event.payload.actions.forEach(applyAction);
      }
    });

    socket.on('editor.sync', (event: EditorSyncEvent) => {
      applyAction(event.payload.action);
    });

    return () => {
      socket.emit('editor.leave', { documentId });
      socket.disconnect();
    };
  }, [documentId, applyAction]);

  return {
    sendCommand: (commandText: string) => {
      const socket = io(process.env.NEXT_PUBLIC_WS_URL!);
      socket.emit('editor.command', {
        event: 'editor.command',
        documentId,
        payload: { commandText }
      });
    }
  };
}
```

---

**END OF DOCUMENT**

이 문서는 Sparklio.ai One-Page Unified Editor의 **완전한 설계 명세서**입니다.
모든 Phase 0 문서들과 일관성 있게 작성되었으며, 실제 개발 시 참조할 수 있는 구체적인 스키마, 예시, 코드가 포함되어 있습니다.
