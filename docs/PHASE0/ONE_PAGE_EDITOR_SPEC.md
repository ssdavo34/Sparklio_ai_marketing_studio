# One-Page Unified Editor Specification

> **Version**: 1.1
> **Date**: 2025-11-14 (목요일)
> **Status**: Final
> **Owner**: Frontend Engineering Team
> **변경 이력**: v1.1 - Canva 2025 대응 기능 추가, AI 이미지 편집 파이프라인 확장, 반응형 레이아웃 시스템, 브랜드 가드레일 강화

---

## Executive Summary

**One-Page Editor는 Sparklio.ai의 핵심 작업 환경으로서, 모든 비영상 산출물을 하나의 화면에서 역할(Role) 기반으로 편집하는 통합 에디터입니다.**

### 핵심 원칙

- **"브랜드 관련 모든 비영상 산출물을, 하나의 화면·하나의 에디터에서 역할(Role) 단위로 편집한다."**
- **Chat-Driven + Direct Edit 하이브리드**: 자연어 명령과 직접 편집 모두 지원
- **Review Buffer → Editor 통합**: AI 초안 → 검토 → 에디터 반영 → 발행
- **Brand Kit 연동**: 역할별로 브랜드 스타일 자동 적용
- **One Editor, Many Outputs**: SNS Set ↔ Presentation ↔ Product Detail 포맷 간 자유로운 변환
- **Brand-First with Guardrails**: 브랜드 룰 자동 검사 + 잠금 요소 시스템

### Canva 대비 차별화 포인트 (2025년 기준)

| 항목 | Canva 2025 | Sparklio One-Page Editor |
|------|------------|--------------------------|
| **시작점** | 템플릿/디자인 유형 선택 후 시작 | **브랜드 킷 + 마케팅 브리프 기반 자동 초안 생성** |
| **브랜딩** | Brand Kit, Brand Templates | **브랜드 토큰(색/폰트/컴포넌트) + 브랜드 룰 검사 + 잠금 영역** |
| **멀티 포맷** | Magic Switch로 문서/슬라이드 변환 | **"한 브리프 → SNS 세트 + 상세페이지 + 프리젠 동시 생성 및 동기화"** |
| **AI 디자인** | Magic Media, Design Suggestions | **Editor Agent 기반 자연어 편집 + AI 레이아웃 + 이미지 자동 생성/변형/부분 편집** |
| **반응형** | 여러 사이즈 템플릿, 자동 리사이즈 | **플랫폼별 사이즈 세트 + 레이아웃 유지형 반응형 프레임 시스템** |
| **협업** | 댓글, 실시간 커서 | **문서 기반 협업 + 버전/브랜치 + 캠페인별 A/B 관리** |
| **마케팅 특화** | 범용 디자인 중심 | **마케팅·광고·상품 상세에 최적화된 컴포넌트·리포트·가이드** |
| **이미지 편집** | Background Remover, Magic Edit | **선택 영역 삭제/확장/스타일 변경 + Inpaint/Outpaint + 배경 제거 + 세트 동기화** |

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

### 7.6 AI 이미지 편집 파이프라인

**개요**: Canva의 Magic Edit, Background Remover 대응 + Sparklio 특화 기능 (브랜드 스타일 적용, 세트 동기화)

#### 7.6.1 빈 프레임 → AI 이미지 생성

**UX 플로우:**

1. 사용자가 이미지 프레임(빈 슬롯)을 선택
2. 우측 패널에 `[AI 이미지 생성]` 버튼 표시
3. 자동 프롬프트 구성:
   - 브리프(제품명, 타겟, 톤) + 브랜드 스타일 + 섹션 역할 기반
   - 사용자는 키워드만 추가/수정
4. 옵션 선택:
   - 스타일: 실사, 일러스트, 플랫, 3D, 브랜드 특화
   - 용도: 쇼핑 상세 대표, SNS 카드, 프리젠 배경, 썸네일
5. 3~6개 후보 생성 → 클릭 시 해당 프레임에 삽입
6. 나머지는 Assets 패널 "이번 문서에서 생성된 이미지"에 저장

**기술 구조:**

```typescript
interface AIImageGenerateRequest {
  documentId: string;
  pageId: string;
  frameId: string;
  prompt: string;  // 자동 구성 + 사용자 수정
  style: 'realistic' | 'illustration' | 'flat' | '3d' | 'brand_custom';
  purpose: 'product_hero' | 'sns_card' | 'presentation_bg' | 'thumbnail';
  brandId: string;
  aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3';
  count?: number;  // 후보 개수 (기본 4개)
}

interface AIImageGenerateResponse {
  jobId: string;
  status: 'processing' | 'completed' | 'failed';
  images?: Array<{
    imageId: string;
    url: string;
    thumbnailUrl: string;
    width: number;
    height: number;
  }>;
}
```

#### 7.6.2 기존 이미지 → 스타일 변경

**UX 플로우:**

1. 이미지 레이어 선택
2. 우측 패널에 `[이미지 스타일 변경]` 버튼
3. 옵션:
   - **브랜드 스타일로 리스타일링**: 브랜드 킷 색상/톤 적용
   - **배경만 교체**: 화이트 → 브랜드 그라데이션 등
   - **스타일 전환**: 실사 ↔ 일러스트
4. A/B 버전 생성:
   - 원본 유지 + 새 버전 생성
   - 각 버전에 라벨(A/B/C) 부여

**API 요청:**

```typescript
interface ImageStyleChangeRequest {
  documentId: string;
  layerId: string;
  sourceImageUrl: string;
  styleType: 'brand_restyle' | 'background_replace' | 'style_transfer';
  targetStyle?: string;  // 'illustration' | 'watercolor' | 'brand_gradient'
  keepOriginal: boolean;  // true면 A/B 버전 생성
}
```

#### 7.6.3 선택 영역 편집 (Inpaint) - **사용자 요청 추가 기능**

**UX 플로우:**

1. 이미지 선택 후 `[부분 편집]` 모드 진입
2. 도구 선택:
   - **브러시**: 자유 영역 선택
   - **라쏘**: 다각형 선택
   - **AI 자동 선택**: "이 상품만 선택", "사람만 선택"
3. 선택 영역에 대한 작업:
   - **삭제**: 선택 영역을 자연스럽게 채움 (배경 확장)
   - **교체**: "이 머그잔을 노트북으로 바꿔줘"
   - **색상 변경**: "파란색 버전으로 바꿔줘"
4. 실시간 프리뷰 → 적용

**API 요청:**

```typescript
interface InpaintRequest {
  documentId: string;
  layerId: string;
  sourceImageUrl: string;
  maskData: string;  // Base64 인코딩된 마스크 이미지
  action: 'remove' | 'replace' | 'recolor';
  prompt?: string;  // replace 시: "laptop on the same desk"
  targetColor?: string;  // recolor 시: "#FF0000"
}
```

#### 7.6.4 이미지 확장 (Outpaint) - **사용자 요청 추가 기능**

**UX 플로우:**

1. 이미지 선택 후 프레임 크기 조정 (예: 1:1 → 9:16)
2. 확장 영역 표시 (상/하 또는 좌/우)
3. `[AI로 확장]` 버튼 클릭
4. AI가 자연스럽게 주변 영역 생성
5. 프리뷰 → 적용

**API 요청:**

```typescript
interface OutpaintRequest {
  documentId: string;
  layerId: string;
  sourceImageUrl: string;
  expandDirection: 'top' | 'bottom' | 'left' | 'right' | 'all';
  targetAspectRatio: string;  // "9:16"
  prompt?: string;  // 선택적 가이드
}
```

#### 7.6.5 배경 제거 - **사용자 요청 추가 기능**

**UX 플로우:**

1. 이미지 선택
2. `[배경 제거]` 버튼 원클릭
3. AI가 자동으로 피사체 인식 및 배경 제거
4. 투명 배경 PNG로 변환
5. 새 배경색/이미지 선택 가능

**API 요청:**

```typescript
interface BackgroundRemoveRequest {
  documentId: string;
  layerId: string;
  sourceImageUrl: string;
  outputFormat: 'transparent' | 'white' | 'custom';
  customBackground?: string;  // 색상 코드 또는 이미지 URL
}
```

#### 7.6.6 세트 동기화

**UX 플로우:**

하나의 제품 메인 이미지가 SNS·상세페이지·프리젠 여러 페이지에서 사용될 때:

1. 메인 이미지를 새 버전으로 교체
2. `[전체 문서에 반영]` 옵션 선택
3. 같은 `productId` 또는 태그 기준으로 연결된 모든 레이어 업데이트
4. 사이즈별 자동 크롭/리사이즈 적용

**데이터 구조:**

```typescript
interface ImageAssetLink {
  assetId: string;
  linkedLayers: Array<{
    documentId: string;
    pageId: string;
    layerId: string;
    cropSettings?: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  }>;
  syncEnabled: boolean;
}
```

#### 7.6.7 백엔드 통신 (추상화)

**요청 예시:**

```json
{
  "type": "inpaint",
  "documentId": "doc_123",
  "pageId": "p1",
  "layerId": "img_4",
  "mask": "base64...",
  "prompt": "replace the mug with a laptop on the same desk",
  "style": "brand_default"
}
```

**응답 (Job 기반):**

```json
{
  "jobId": "job_ai_img_789",
  "status": "processing",
  "estimatedTime": 15,
  "message": "AI 이미지 생성 중... (약 15초 소요)"
}
```

프론트엔드는:
- Job ID로 상태 폴링 또는 WebSocket으로 실시간 업데이트
- 완료 시 Assets 및 해당 Layer 자동 업데이트

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

### 8.3 브랜드 가드레일 & 권한 시스템 (v1.1)

> **핵심 차별화**: 브랜드 일관성을 자동으로 보호하는 "브랜드 룰 엔진"
> - Canva의 Brand Kit은 색상/폰트 제공, Sparklio는 **브랜드 룰 자동 검사 + 잠금 영역 + 역할 기반 권한**
> - 마케팅 매니저는 핵심 브랜드 요소를 잠금, 디자이너는 레이아웃만 수정 가능
> - AI 에이전트도 브랜드 가드레일을 준수하도록 강제

---

#### 8.3.1 브랜드 룰 정의

**브랜드 룰 (Brand Rules)**:
- 브랜드마다 정의하는 "위반하면 안 되는 디자인 규칙"
- 예: "로고는 항상 상단 좌측 20px 이내", "빨간색은 CTA에만 사용", "헤드라인 폰트는 반드시 Bold"

```typescript
interface BrandRule {
  ruleId: string;
  brandId: string;
  ruleName: string;
  description: string;
  severity: 'error' | 'warning' | 'info';  // 위반 시 심각도

  // 룰 타입
  ruleType:
    | 'color_usage'       // 색상 사용 제한
    | 'font_usage'        // 폰트 사용 제한
    | 'logo_placement'    // 로고 위치 제한
    | 'spacing'           // 여백 규칙
    | 'size_limit'        // 크기 제한
    | 'position_lock'     // 위치 잠금
    | 'content_lock'      // 내용 잠금 (텍스트 변경 불가)
    | 'aspect_ratio'      // 비율 유지
    | 'layering';         // 레이어 순서 (로고는 항상 최상위)

  // 룰 조건 (JSON 형식)
  condition: {
    targetRole?: string;        // 'logo', 'cta_button', 'headline'
    targetLayerType?: 'text' | 'image' | 'shape' | 'button';

    // 색상 룰
    allowedColors?: string[];   // ["#0066FF", "#FF6B00"]
    forbiddenColors?: string[];

    // 폰트 룰
    allowedFonts?: string[];    // ["Pretendard Bold"]
    minFontSize?: number;
    maxFontSize?: number;

    // 위치 룰
    allowedArea?: {
      x: { min: number; max: number };
      y: { min: number; max: number };
    };

    // 크기 룰
    minWidth?: number;
    maxWidth?: number;
    minHeight?: number;
    maxHeight?: number;

    // 비율 룰
    maintainAspectRatio?: boolean;
  };

  // 자동 수정 가능 여부
  autoFixAvailable: boolean;
  autoFixAction?: string;  // "adjust_color_to_primary", "move_to_safe_area"

  // 활성화 여부
  enabled: boolean;
}
```

**예시 브랜드 룰**:

```typescript
// 룰 1: 로고는 항상 상단 좌측 모서리에만 배치 가능
{
  ruleId: "rule_logo_placement_001",
  brandId: "brand_sparklio",
  ruleName: "로고 위치 제한",
  description: "로고는 반드시 캔버스 상단 좌측 80x80 영역 내에 배치되어야 합니다.",
  severity: "error",
  ruleType: "logo_placement",
  condition: {
    targetRole: "logo",
    allowedArea: {
      x: { min: 0, max: 80 },
      y: { min: 0, max: 80 }
    }
  },
  autoFixAvailable: true,
  autoFixAction: "move_to_top_left",
  enabled: true
}

// 룰 2: CTA 버튼은 브랜드 Primary 색상만 사용
{
  ruleId: "rule_cta_color_001",
  brandId: "brand_sparklio",
  ruleName: "CTA 버튼 색상 제한",
  description: "CTA 버튼 배경색은 브랜드 Primary 색상(#0066FF) 또는 Accent 색상(#FF6B00)만 사용 가능합니다.",
  severity: "error",
  ruleType: "color_usage",
  condition: {
    targetRole: "cta_button",
    allowedColors: ["#0066FF", "#FF6B00"]
  },
  autoFixAvailable: true,
  autoFixAction: "adjust_color_to_primary",
  enabled: true
}

// 룰 3: 헤드라인은 반드시 Bold 폰트 사용
{
  ruleId: "rule_headline_font_001",
  brandId: "brand_sparklio",
  ruleName: "헤드라인 폰트 굵기 제한",
  description: "헤드라인은 반드시 Bold(700) 이상의 폰트 굵기를 사용해야 합니다.",
  severity: "warning",
  ruleType: "font_usage",
  condition: {
    targetRole: "headline",
    allowedFonts: ["Pretendard Bold", "Pretendard ExtraBold"],
    minFontSize: 24
  },
  autoFixAvailable: true,
  autoFixAction: "set_font_weight_700",
  enabled: true
}

// 룰 4: 브랜드 태그라인은 내용 변경 불가 (잠금)
{
  ruleId: "rule_tagline_lock_001",
  brandId: "brand_sparklio",
  ruleName: "태그라인 내용 잠금",
  description: "브랜드 태그라인 텍스트는 수정할 수 없습니다. 위치와 스타일만 변경 가능합니다.",
  severity: "error",
  ruleType: "content_lock",
  condition: {
    targetRole: "tagline",
    targetLayerType: "text"
  },
  autoFixAvailable: false,  // 자동 수정 불가, 편집 차단
  enabled: true
}
```

---

#### 8.3.2 브랜드 룰 검사 엔진

**실시간 검사**:
- 사용자가 레이어를 수정할 때마다 브랜드 룰 검사
- 위반 시 즉시 경고 표시 + 자동 수정 제안

```typescript
interface BrandRuleCheckResult {
  documentId: string;
  pageId: string;
  timestamp: string;
  passed: boolean;  // 모든 룰 통과 여부

  violations: Array<{
    ruleId: string;
    ruleName: string;
    severity: 'error' | 'warning' | 'info';
    layerId: string;
    layerRole?: string;
    message: string;
    suggestion: string;
    autoFixAvailable: boolean;
    autoFixAction?: string;
  }>;
}
```

**검사 트리거**:

```typescript
// 1. 레이어 수정 시 (실시간)
editorStore.on('layerUpdated', (layerId, updates) => {
  const layer = editorStore.getLayer(layerId);
  const brandRules = brandStore.getRulesForBrand(documentBrandId);

  const violations = checkBrandRules(layer, brandRules);

  if (violations.length > 0) {
    // 심각도별 처리
    const errors = violations.filter(v => v.severity === 'error');
    const warnings = violations.filter(v => v.severity === 'warning');

    if (errors.length > 0) {
      // 오류: 변경 사항 롤백 + 모달 표시
      editorStore.undo();
      showErrorDialog({
        title: "브랜드 룰 위반",
        message: "이 변경은 브랜드 가이드라인을 위반합니다.",
        violations: errors,
        actions: [
          { label: "자동 수정", onClick: () => autoFixViolations(errors) },
          { label: "취소" }
        ]
      });
    } else if (warnings.length > 0) {
      // 경고: 변경은 허용하되 경고 토스트 표시
      toast.warn(`브랜드 가이드라인 경고: ${warnings[0].message}`, {
        action: { label: "자동 수정", onClick: () => autoFixViolations(warnings) }
      });
    }
  }
});

// 2. 문서 저장/발행 전 (전체 검사)
async function validateDocumentBeforePublish(documentId: string) {
  const document = await getDocument(documentId);
  const brandRules = await getBrandRules(document.brandId);

  const allViolations = [];

  document.pages.forEach(page => {
    page.layers.forEach(layer => {
      const violations = checkBrandRules(layer, brandRules);
      allViolations.push(...violations);
    });
  });

  const errors = allViolations.filter(v => v.severity === 'error');

  if (errors.length > 0) {
    throw new BrandRuleViolationError(
      "문서에 브랜드 룰 위반 사항이 있습니다. 발행할 수 없습니다.",
      errors
    );
  }

  return { passed: true, violations: allViolations };
}
```

**예시: CTA 버튼 색상 변경 시 브랜드 룰 위반**

```typescript
// 사용자가 CTA 버튼 색상을 #FF0000 (빨강)으로 변경 시도
editorStore.updateLayer("layer_cta_001", {
  backgroundColor: "#FF0000"
});

// ❌ 브랜드 룰 검사: 위반 감지
// 룰: "CTA 버튼은 #0066FF 또는 #FF6B00만 사용 가능"

// 변경 사항 롤백
editorStore.undo();

// 사용자에게 모달 표시
showErrorDialog({
  title: "브랜드 룰 위반",
  message: "CTA 버튼 배경색은 브랜드 Primary(#0066FF) 또는 Accent(#FF6B00) 색상만 사용 가능합니다.",
  currentValue: "#FF0000",
  allowedValues: ["#0066FF", "#FF6B00"],
  actions: [
    {
      label: "Primary 색상으로 변경",
      variant: "primary",
      onClick: () => editorStore.updateLayer("layer_cta_001", { backgroundColor: "#0066FF" })
    },
    {
      label: "Accent 색상으로 변경",
      variant: "secondary",
      onClick: () => editorStore.updateLayer("layer_cta_001", { backgroundColor: "#FF6B00" })
    },
    { label: "취소" }
  ]
});
```

---

#### 8.3.3 잠금 레이어 (Locked Layers)

**개념**:
- 특정 레이어를 "부분 잠금" 또는 "완전 잠금"
- 예: 로고는 위치만 잠금(크기 조정 가능), 법적 문구는 완전 잠금(수정/이동/삭제 불가)

```typescript
interface LayerLock {
  layerId: string;
  lockType: 'full' | 'partial';

  // 부분 잠금 시 허용/차단 작업
  allowedActions?: Array<
    | 'move'           // 이동
    | 'resize'         // 크기 조정
    | 'rotate'         // 회전
    | 'edit_content'   // 내용 편집 (텍스트, 이미지 교체)
    | 'edit_style'     // 스타일 편집 (색상, 폰트)
    | 'delete'         // 삭제
    | 'duplicate'      // 복제
    | 'reorder'        // 레이어 순서 변경
  >;

  lockedBy: 'brand_rule' | 'user' | 'admin';  // 잠금 주체
  lockedAt: string;
  lockReason?: string;  // "브랜드 로고는 위치 고정"
}
```

**예시**:

```typescript
// 로고: 내용과 위치는 잠금, 크기 조정과 스타일은 허용
{
  layerId: "layer_logo_001",
  lockType: "partial",
  allowedActions: ["resize", "edit_style"],  // 크기 조정과 스타일 편집만 허용
  lockedBy: "brand_rule",
  lockReason: "브랜드 로고는 내용과 위치를 변경할 수 없습니다."
}

// 법적 문구: 완전 잠금 (어떤 수정도 불가)
{
  layerId: "layer_legal_disclaimer_001",
  lockType: "full",
  allowedActions: [],  // 모든 작업 차단
  lockedBy: "admin",
  lockReason: "법적 문구는 수정할 수 없습니다."
}

// 태그라인: 내용만 잠금, 위치/크기/스타일은 허용
{
  layerId: "layer_tagline_001",
  lockType: "partial",
  allowedActions: ["move", "resize", "rotate", "edit_style"],  // 내용 편집 제외 모두 허용
  lockedBy: "brand_rule",
  lockReason: "태그라인 텍스트는 변경할 수 없습니다."
}
```

**UI 표시**:

```typescript
// 잠금 레이어 선택 시 UI
if (selectedLayer.lock) {
  const lock = selectedLayer.lock;

  // 레이어 패널에 잠금 아이콘 표시
  renderLayerIcon = (
    <div className="layer-item locked">
      <LockIcon color={lock.lockType === 'full' ? 'red' : 'orange'} />
      <span>{layer.name}</span>
      <Tooltip>{lock.lockReason}</Tooltip>
    </div>
  );

  // 속성 패널에 경고 배너 표시
  if (lock.lockType === 'full') {
    return (
      <PropertyPanel>
        <Alert variant="error" icon={<LockIcon />}>
          이 레이어는 완전히 잠겨있습니다. 수정할 수 없습니다.
          <br />
          <small>사유: {lock.lockReason}</small>
        </Alert>
      </PropertyPanel>
    );
  } else {
    return (
      <PropertyPanel>
        <Alert variant="warning" icon={<LockIcon />}>
          이 레이어는 부분적으로 잠겨있습니다.
          <br />
          <small>허용된 작업: {lock.allowedActions.join(', ')}</small>
          <br />
          <small>사유: {lock.lockReason}</small>
        </Alert>

        {/* 허용된 속성만 표시 */}
        {lock.allowedActions.includes('resize') && <SizeControls />}
        {lock.allowedActions.includes('edit_style') && <StyleControls />}
        {lock.allowedActions.includes('rotate') && <RotationControls />}
      </PropertyPanel>
    );
  }
}
```

**캔버스에서 잠금 레이어 시각적 표시**:

```typescript
// Fabric.js 객체에 잠금 스타일 적용
if (fabricObject.lock) {
  // 완전 잠금: 빨간 테두리 + 자물쇠 아이콘
  if (fabricObject.lock.lockType === 'full') {
    fabricObject.set({
      borderColor: 'red',
      cornerColor: 'red',
      hasControls: false,  // 크기 조정 핸들 숨김
      lockMovementX: true,
      lockMovementY: true,
      lockRotation: true,
      lockScalingX: true,
      lockScalingY: true,
      selectable: true,    // 선택은 가능 (정보 확인용)
      evented: false       // 드래그 이벤트 차단
    });
  }

  // 부분 잠금: 주황 테두리 + 일부 핸들만 표시
  else if (fabricObject.lock.lockType === 'partial') {
    fabricObject.set({
      borderColor: 'orange',
      cornerColor: 'orange',
      lockMovementX: !fabricObject.lock.allowedActions.includes('move'),
      lockMovementY: !fabricObject.lock.allowedActions.includes('move'),
      lockRotation: !fabricObject.lock.allowedActions.includes('rotate'),
      lockScalingX: !fabricObject.lock.allowedActions.includes('resize'),
      lockScalingY: !fabricObject.lock.allowedActions.includes('resize'),
      hasControls: fabricObject.lock.allowedActions.some(a => ['resize', 'rotate'].includes(a))
    });
  }
}
```

---

#### 8.3.4 역할 기반 권한 (Role-based Permissions)

**목적**:
- 협업 시나리오: 마케팅 매니저, 디자이너, 에이전시 파트너 등 다양한 역할이 함께 작업
- 역할에 따라 문서 편집 권한을 차등 부여

```typescript
interface DocumentPermission {
  documentId: string;
  userId: string;
  role: 'owner' | 'admin' | 'editor' | 'viewer' | 'commenter';

  // 세부 권한
  permissions: {
    canViewDocument: boolean;
    canEditDocument: boolean;
    canDeleteDocument: boolean;
    canPublishDocument: boolean;

    // 브랜드 요소 관련
    canEditBrandElements: boolean;    // 로고, 브랜드 색상, 폰트 변경
    canUnlockLayers: boolean;         // 잠금 레이어 해제
    canEditBrandRules: boolean;       // 브랜드 룰 추가/수정

    // 협업 관련
    canInviteCollaborators: boolean;
    canManagePermissions: boolean;
    canComment: boolean;

    // 발행 관련
    canApproveForPublish: boolean;    // 발행 승인 권한
    canPublishToProduction: boolean;  // 실제 발행 권한
  };

  grantedAt: string;
  grantedBy: string;  // userId
}
```

**역할별 기본 권한**:

```typescript
const DEFAULT_ROLE_PERMISSIONS = {
  owner: {
    canViewDocument: true,
    canEditDocument: true,
    canDeleteDocument: true,
    canPublishDocument: true,
    canEditBrandElements: true,
    canUnlockLayers: true,
    canEditBrandRules: true,
    canInviteCollaborators: true,
    canManagePermissions: true,
    canComment: true,
    canApproveForPublish: true,
    canPublishToProduction: true
  },

  admin: {
    canViewDocument: true,
    canEditDocument: true,
    canDeleteDocument: false,
    canPublishDocument: true,
    canEditBrandElements: true,
    canUnlockLayers: true,
    canEditBrandRules: false,  // 룰 편집은 owner만
    canInviteCollaborators: true,
    canManagePermissions: true,
    canComment: true,
    canApproveForPublish: true,
    canPublishToProduction: true
  },

  editor: {
    canViewDocument: true,
    canEditDocument: true,
    canDeleteDocument: false,
    canPublishDocument: false,
    canEditBrandElements: false,  // 브랜드 요소 편집 불가
    canUnlockLayers: false,
    canEditBrandRules: false,
    canInviteCollaborators: false,
    canManagePermissions: false,
    canComment: true,
    canApproveForPublish: false,
    canPublishToProduction: false
  },

  viewer: {
    canViewDocument: true,
    canEditDocument: false,
    canDeleteDocument: false,
    canPublishDocument: false,
    canEditBrandElements: false,
    canUnlockLayers: false,
    canEditBrandRules: false,
    canInviteCollaborators: false,
    canManagePermissions: false,
    canComment: false,
    canApproveForPublish: false,
    canPublishToProduction: false
  },

  commenter: {
    canViewDocument: true,
    canEditDocument: false,
    canDeleteDocument: false,
    canPublishDocument: false,
    canEditBrandElements: false,
    canUnlockLayers: false,
    canEditBrandRules: false,
    canInviteCollaborators: false,
    canManagePermissions: false,
    canComment: true,
    canApproveForPublish: false,
    canPublishToProduction: false
  }
};
```

**권한 체크**:

```typescript
// 레이어 편집 시도 시 권한 체크
function attemptLayerEdit(layerId: string, updates: Partial<Layer>) {
  const layer = editorStore.getLayer(layerId);
  const currentUser = authStore.getCurrentUser();
  const permission = getDocumentPermission(documentId, currentUser.userId);

  // 1. 기본 편집 권한 체크
  if (!permission.permissions.canEditDocument) {
    toast.error("문서 편집 권한이 없습니다.");
    return false;
  }

  // 2. 브랜드 요소 편집 권한 체크
  if (layer.role && ['logo', 'brand_color', 'brand_font'].includes(layer.role)) {
    if (!permission.permissions.canEditBrandElements) {
      toast.error("브랜드 요소는 관리자만 편집할 수 있습니다.");
      return false;
    }
  }

  // 3. 잠금 레이어 체크
  if (layer.lock) {
    if (layer.lock.lockType === 'full') {
      toast.error("이 레이어는 잠겨있습니다.");
      return false;
    }

    // 부분 잠금 시 특정 작업만 허용
    const requestedAction = detectActionType(updates);  // 'move', 'resize', 'edit_content' 등
    if (!layer.lock.allowedActions.includes(requestedAction)) {
      toast.error(`이 레이어는 ${requestedAction} 작업이 제한되어 있습니다.`);
      return false;
    }
  }

  // 4. 브랜드 룰 체크
  const brandRules = brandStore.getRulesForBrand(documentBrandId);
  const violations = checkBrandRules({ ...layer, ...updates }, brandRules);
  const errors = violations.filter(v => v.severity === 'error');

  if (errors.length > 0) {
    showBrandRuleViolationDialog(errors);
    return false;
  }

  // 모든 체크 통과 → 편집 허용
  editorStore.updateLayer(layerId, updates);
  return true;
}
```

---

#### 8.3.5 AI 에이전트의 브랜드 가드레일 준수

**문제**:
- AI가 자동 생성한 디자인이 브랜드 가이드라인을 위반할 수 있음
- 예: AI가 브랜드 색상이 아닌 임의의 색상 사용, 로고를 잘못된 위치에 배치

**해결**:
- AI 에이전트도 동일한 브랜드 룰 엔진을 통과해야 함
- AI 생성 결과 → 브랜드 룰 검사 → 위반 시 자동 수정 → 사용자에게 제공

```typescript
// AI 에이전트가 레이아웃 생성 시
async function generateAILayout(brief: MarketingBrief, brandKit: BrandKit) {
  // 1. AI에게 브랜드 킷 정보 제공
  const aiPrompt = `
    다음 마케팅 브리프에 맞는 인스타그램 포스트 레이아웃을 생성하세요.

    브리프: ${brief.description}

    **브랜드 가이드라인 (반드시 준수):**
    - 색상: Primary ${brandKit.colors.primary}, Accent ${brandKit.colors.accent}만 사용
    - 폰트: ${brandKit.typography.primary.fontFamily}
    - 로고 위치: 상단 좌측 80x80 영역 내
    - CTA 버튼 색상: Primary 또는 Accent만 사용
  `;

  // 2. AI 생성
  const aiLayout = await callAIAgent(aiPrompt);

  // 3. 브랜드 룰 검사
  const brandRules = await getBrandRules(brandKit.brandId);
  const violations = [];

  aiLayout.layers.forEach(layer => {
    const layerViolations = checkBrandRules(layer, brandRules);
    violations.push(...layerViolations);
  });

  // 4. 위반 사항 자동 수정
  if (violations.length > 0) {
    console.log(`AI 생성 레이아웃에서 ${violations.length}개의 브랜드 룰 위반 감지. 자동 수정 중...`);

    violations.forEach(violation => {
      if (violation.autoFixAvailable) {
        autoFixViolation(violation, aiLayout);
      } else {
        // 자동 수정 불가능한 경우: 해당 레이어 제거 또는 기본값으로 대체
        console.warn(`자동 수정 불가: ${violation.message}`);
        removeLayerOrUseDefault(violation.layerId, aiLayout);
      }
    });
  }

  // 5. 최종 검증
  const finalCheck = validateBrandCompliance(aiLayout, brandRules);
  if (!finalCheck.passed) {
    throw new Error("AI 생성 레이아웃이 브랜드 가이드라인을 만족하지 못했습니다.");
  }

  return aiLayout;
}
```

**자동 수정 예시**:

```typescript
function autoFixViolation(violation: BrandRuleViolation, layout: Layout) {
  const layer = layout.layers.find(l => l.layerId === violation.layerId);

  switch (violation.ruleType) {
    case 'color_usage':
      // AI가 #FF0000 사용 → 브랜드 Primary 색상으로 변경
      layer.backgroundColor = violation.rule.condition.allowedColors[0];
      console.log(`색상 자동 수정: ${layer.layerId} → ${layer.backgroundColor}`);
      break;

    case 'logo_placement':
      // 로고 위치가 허용 영역 밖 → 상단 좌측으로 이동
      layer.position.x = 20;
      layer.position.y = 20;
      console.log(`로고 위치 자동 수정: ${layer.layerId} → (20, 20)`);
      break;

    case 'font_usage':
      // AI가 비브랜드 폰트 사용 → 브랜드 폰트로 변경
      layer.fontFamily = violation.rule.condition.allowedFonts[0];
      console.log(`폰트 자동 수정: ${layer.layerId} → ${layer.fontFamily}`);
      break;
  }
}
```

---

## 9. 반응형 레이아웃 & 멀티포맷 변환 (Canva Magic Switch 대응)

> **핵심 차별화**: "One Brief → Many Outputs"
> - 한 번의 브리프로 SNS 세트(인스타/페북/링크드인), 상세페이지, 프레젠테이션을 동시 생성
> - 플랫폼별 사이즈 자동 대응 + 레이아웃 유지형 반응형 시스템
> - Canva의 Magic Switch(문서 타입 변환)를 넘어 **마케팅 목적별 세트 동기화**까지 지원

---

### 9.1 Frame 기반 레이아웃 시스템

**개념**:
- 각 페이지는 하나 이상의 **Frame**을 가질 수 있음
- Frame = "플랫폼별 출력 단위" (예: 인스타그램 정사각형, 페이스북 링크 카드, A4 프레젠테이션 슬라이드)
- Frame 내부의 객체는 **상대 좌표**와 **앵커 포인트**를 사용해 반응형으로 배치됨

```typescript
interface Frame {
  frameId: string;
  name: string;  // "Instagram Square", "Facebook Link Card"
  width: number;  // 1080
  height: number;  // 1080
  platform: 'instagram' | 'facebook' | 'linkedin' | 'presentation' | 'product_detail' | 'custom';
  aspectRatio: string;  // "1:1", "16:9", "9:16", "4:5"

  // 반응형 레이아웃 규칙
  layoutRules: {
    type: 'fixed' | 'flex' | 'grid';

    // Flex 레이아웃 (자동 배치)
    flexDirection?: 'column' | 'row';
    justifyContent?: 'flex-start' | 'center' | 'flex-end' | 'space-between';
    alignItems?: 'flex-start' | 'center' | 'flex-end' | 'stretch';
    gap?: number;

    // Grid 레이아웃 (정렬 그리드)
    gridTemplateColumns?: string;  // "1fr 2fr 1fr"
    gridTemplateRows?: string;
    gridGap?: number;
  };

  // 안전 영역 (Safe Area)
  safeArea: {
    top: number;     // 40px (플랫폼 UI 회피)
    bottom: number;  // 40px
    left: number;    // 32px
    right: number;   // 32px
  };

  backgroundColor: string;
  backgroundImage?: string;
}
```

**예시**: 한 페이지에 3개의 Frame을 동시에 가지는 경우

```typescript
{
  pageId: "page_001",
  pageName: "Product Launch Hero",
  frames: [
    {
      frameId: "frame_ig_square",
      name: "Instagram Square 1080x1080",
      width: 1080,
      height: 1080,
      platform: "instagram",
      aspectRatio: "1:1",
      layoutRules: { type: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" },
      safeArea: { top: 40, bottom: 40, left: 32, right: 32 }
    },
    {
      frameId: "frame_fb_link",
      name: "Facebook Link Card 1200x630",
      width: 1200,
      height: 630,
      platform: "facebook",
      aspectRatio: "1.91:1",
      layoutRules: { type: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
      safeArea: { top: 24, bottom: 24, left: 40, right: 40 }
    },
    {
      frameId: "frame_presentation",
      name: "Presentation Slide 16:9",
      width: 1920,
      height: 1080,
      platform: "presentation",
      aspectRatio: "16:9",
      layoutRules: { type: "grid", gridTemplateColumns: "1fr 2fr", gridGap: 32 },
      safeArea: { top: 60, bottom: 60, left: 80, right: 80 }
    }
  ]
}
```

---

### 9.2 객체의 앵커 & 상대 좌표 시스템

**문제**: 1080x1080 → 1200x630으로 Frame 크기 변경 시 객체 위치가 깨짐

**해결**: 앵커 포인트 + 상대 좌표 사용

```typescript
interface LayerPosition {
  // 앵커 포인트 (객체가 어디에 고정되는가?)
  anchor:
    | 'top-left' | 'top-center' | 'top-right'
    | 'middle-left' | 'middle-center' | 'middle-right'
    | 'bottom-left' | 'bottom-center' | 'bottom-right';

  // 상대 좌표 (앵커로부터의 거리)
  offsetX: number;  // 앵커로부터 X축 거리 (px)
  offsetY: number;  // 앵커로부터 Y축 거리 (px)

  // 혹은 퍼센트 좌표 (더 유연함)
  relativeX?: number;  // 0.0 ~ 1.0 (Frame 너비 대비)
  relativeY?: number;  // 0.0 ~ 1.0 (Frame 높이 대비)

  // 크기 조정 정책
  scalePolicy: 'fixed' | 'fit-width' | 'fit-height' | 'fill' | 'scale-proportional';
}
```

**예시**:

```typescript
// "SALE 50%" 텍스트는 항상 프레임 상단 중앙에서 40px 아래
{
  layerId: "text_headline",
  content: "SALE 50%",
  position: {
    anchor: "top-center",
    offsetX: 0,
    offsetY: 40,
    scalePolicy: "fixed"
  },
  fontSize: 72,
  fontFamily: "Pretendard",
  fontWeight: 700,
  color: "#FF0000"
}

// CTA 버튼은 항상 프레임 하단 중앙에서 60px 위
{
  layerId: "button_cta",
  role: "cta_button",
  content: "지금 구매하기",
  position: {
    anchor: "bottom-center",
    offsetX: 0,
    offsetY: -60,
    scalePolicy: "fixed"
  },
  width: 240,
  height: 56
}

// 상품 이미지는 프레임 중앙에 배치, 크기는 프레임 너비의 80%로 자동 조정
{
  layerId: "image_product",
  role: "product_image",
  position: {
    anchor: "middle-center",
    offsetX: 0,
    offsetY: 0,
    relativeX: 0.5,
    relativeY: 0.5,
    scalePolicy: "fit-width"
  },
  width: 864,  // 1080 * 0.8
  height: 864
}
```

**동작**:
- 1080x1080 → 1200x630 변환 시:
  - "SALE 50%": 여전히 상단 중앙에서 40px 아래
  - CTA 버튼: 여전히 하단 중앙에서 60px 위
  - 상품 이미지: 1200 * 0.8 = 960px 너비로 자동 조정

---

### 9.3 플랫폼별 자동 리사이즈 (Magic Switch 대응)

**시나리오**: "인스타그램 정사각형" 디자인을 **"페이스북 링크 카드(1.91:1)"**로 자동 변환

**변환 프로세스**:

```typescript
interface FormatConversionRequest {
  sourceDocumentId: string;
  sourcePageId: string;
  sourceFrameId: string;
  targetPlatform: 'instagram' | 'facebook' | 'linkedin' | 'presentation' | 'product_detail';
  targetAspectRatio?: string;  // 선택적, 플랫폼 기본값 사용 가능
  conversionMode: 'auto' | 'manual' | 'ai_suggest';
}

interface FormatConversionResponse {
  newFrameId: string;
  newDocumentId?: string;  // 별도 문서로 생성 시
  conversionLog: Array<{
    layerId: string;
    action: 'repositioned' | 'resized' | 'cropped' | 'removed' | 'duplicated';
    reason: string;
  }>;
  warnings: string[];  // "CTA 버튼이 Safe Area 밖에 있습니다"
}
```

**변환 규칙**:

1. **텍스트 객체**: 앵커 유지, 폰트 크기는 scale-proportional이면 비율 조정
2. **이미지 객체**:
   - `fit-width`: 새 Frame 너비에 맞춤
   - `fill`: 새 Frame 전체 채우기 + 중앙 크롭
   - `scale-proportional`: 비율 유지하며 리사이즈
3. **Safe Area 체크**: 변환 후 객체가 Safe Area 밖으로 나가면 경고
4. **AI 제안 모드**: 레이아웃이 깨질 것으로 예상되면 AI가 대안 제시

**예시**:

```typescript
// Request
{
  sourceFrameId: "frame_ig_square",  // 1080x1080
  targetPlatform: "facebook",        // 1200x630 Link Card
  conversionMode: "auto"
}

// Response
{
  newFrameId: "frame_fb_link_auto",
  conversionLog: [
    { layerId: "text_headline", action: "repositioned", reason: "anchor=top-center, offsetY maintained" },
    { layerId: "image_product", action: "resized", reason: "scalePolicy=fit-width, new width=960px" },
    { layerId: "button_cta", action: "repositioned", reason: "anchor=bottom-center, offsetY maintained" },
    { layerId: "decorative_circle", action: "cropped", reason: "exceeded new frame bounds" }
  ],
  warnings: [
    "decorative_circle의 일부가 잘렸습니다. 수동 조정을 권장합니다."
  ]
}
```

---

### 9.4 멀티포맷 세트 동기화

**핵심 가치**: "한 브리프 → SNS 세트 + 상세페이지 + 프레젠테이션 동시 생성 및 동기화"

**DocumentSet 개념**:

```typescript
interface DocumentSet {
  setId: string;
  setName: string;  // "Product Launch Campaign - 2025 Spring"
  brandId: string;
  briefId: string;  // 원본 마케팅 브리프

  // 세트 내 문서들
  documents: Array<{
    documentId: string;
    documentType: 'sns_set' | 'product_detail' | 'presentation' | 'email_banner' | 'print_material';
    platform?: string;  // 'instagram', 'facebook', 'linkedin'
    status: 'draft' | 'approved' | 'published';
  }>;

  // 동기화 정책
  syncPolicy: {
    // 텍스트 동기화 (headline, product_name 등 역할 기반)
    syncText: boolean;  // true면 한 곳 수정 시 모든 문서 반영
    syncRoles: string[];  // ['headline', 'product_name', 'tagline']

    // 이미지 동기화 (imageAssetId 기반)
    syncImages: boolean;

    // 색상/폰트 동기화 (브랜드 킷 기반)
    syncBrandKit: boolean;  // 항상 true 권장
  };

  createdAt: string;
  updatedAt: string;
}
```

**동기화 동작**:

```typescript
// 시나리오: 인스타그램 정사각형 포스트의 headline을 수정
editorStore.updateLayer("doc_ig_square", "page_001", "text_headline", {
  content: "SALE 70%"  // 50% → 70% 수정
});

// 자동 동기화 트리거
if (documentSet.syncPolicy.syncText && documentSet.syncPolicy.syncRoles.includes("headline")) {
  documentSet.documents.forEach(doc => {
    // 각 문서에서 role="headline"인 레이어를 찾아 동일하게 수정
    updateLayerByRole(doc.documentId, "headline", { content: "SALE 70%" });
  });

  toast.success("세트 내 모든 문서의 헤드라인이 업데이트되었습니다.");
}
```

**사용자 경험**:

```
[One-Page Editor 화면]

좌측 패널:
  📁 Document Set: "Product Launch Campaign"
    ├── 📄 Instagram Square (1080x1080) ✅
    ├── 📄 Facebook Link Card (1200x630) ✅
    └── 📄 Presentation Slide (1920x1080) 🟡

중앙 캔버스:
  [현재 선택: Instagram Square]

  🔗 동기화 상태: ON
    - 텍스트 역할 동기화: headline, product_name, cta_button
    - 이미지 동기화: product_hero
    - 브랜드 킷 동기화: 활성화

우측 속성 패널:
  선택한 객체: "SALE 70%" (role: headline)

  [!] 이 텍스트는 세트 내 모든 문서와 동기화됩니다.
      수정 시 Facebook, Presentation에도 반영됩니다.

  [ ] 이 문서에만 적용 (동기화 일시 해제)
```

---

### 9.5 접근성 자동 체크 (WCAG 준수)

**목적**: 모든 산출물이 웹 접근성 기준(WCAG 2.1 AA)을 자동으로 만족하도록 보장

**체크 항목**:

1. **색 대비 (Color Contrast)**:
   - 텍스트와 배경의 명암비 ≥ 4.5:1 (일반 텍스트)
   - 텍스트와 배경의 명암비 ≥ 3:1 (큰 텍스트, 18pt 이상)

2. **텍스트 최소 크기**:
   - 본문 텍스트 ≥ 14px
   - 모바일 CTA 버튼 텍스트 ≥ 16px

3. **터치 영역 크기** (모바일 타겟팅 시):
   - 버튼/링크 최소 크기 44x44px

```typescript
interface AccessibilityCheckResult {
  documentId: string;
  pageId: string;
  passed: boolean;
  issues: Array<{
    severity: 'error' | 'warning' | 'info';
    type: 'color_contrast' | 'text_size' | 'touch_target' | 'alt_text_missing';
    layerId: string;
    message: string;
    suggestion: string;
    autoFixAvailable: boolean;
  }>;
}
```

**예시**:

```typescript
// 접근성 체크 결과
{
  documentId: "doc_ig_square",
  pageId: "page_001",
  passed: false,
  issues: [
    {
      severity: "error",
      type: "color_contrast",
      layerId: "text_cta",
      message: "CTA 버튼 텍스트 명암비 2.8:1 (기준: 4.5:1)",
      suggestion: "텍스트 색상을 #FFFFFF로 변경하거나 배경을 어둡게 조정하세요.",
      autoFixAvailable: true
    },
    {
      severity: "warning",
      type: "text_size",
      layerId: "text_caption",
      message: "캡션 텍스트 크기 12px (권장: ≥14px)",
      suggestion: "폰트 크기를 14px 이상으로 늘리세요.",
      autoFixAvailable: true
    },
    {
      severity: "info",
      type: "alt_text_missing",
      layerId: "image_product",
      message: "이미지에 대체 텍스트(alt)가 없습니다.",
      suggestion: "스크린 리더 사용자를 위해 alt 텍스트를 추가하세요.",
      autoFixAvailable: false
    }
  ]
}
```

**자동 수정**:

```typescript
// "접근성 문제 자동 수정" 버튼 클릭
function autoFixAccessibility(result: AccessibilityCheckResult) {
  result.issues.forEach(issue => {
    if (!issue.autoFixAvailable) return;

    switch (issue.type) {
      case 'color_contrast':
        // 텍스트 색상을 대비가 충분한 색으로 자동 조정
        adjustTextColorForContrast(issue.layerId, 4.5);
        break;

      case 'text_size':
        // 텍스트 크기를 최소 기준으로 조정
        updateLayer(issue.layerId, { fontSize: 14 });
        break;

      case 'touch_target':
        // 버튼 크기를 최소 기준으로 확장
        updateLayer(issue.layerId, { width: 44, height: 44 });
        break;
    }
  });

  toast.success("접근성 문제가 자동으로 수정되었습니다.");
}
```

**UI 통합**:

```
[One-Page Editor - 우측 패널]

🛡️ 접근성 검사
  ❌ 2개의 오류, 1개의 경고

  [오류]
  • CTA 버튼 명암비 부족 (2.8:1 < 4.5:1)
    → [자동 수정] 버튼

  [경고]
  • 캡션 텍스트 크기 12px (권장: 14px)
    → [자동 수정] 버튼

  [정보]
  • 상품 이미지에 alt 텍스트 없음
    → [수동 입력]

  [전체 자동 수정] 버튼
```

---

### 9.6 UI: 멀티포맷 전환 & 세트 관리

**화면 구성**:

```
[One-Page Editor - 상단 툴바]

좌측:
  [< 뒤로] [문서 이름: Product Launch - Instagram] [저장됨 ✓]

중앙:
  [세트 보기 ▼]  <- 클릭 시 드롭다운
    ├── Instagram Square (1080x1080) ⬅ 현재
    ├── Facebook Link Card (1200x630)
    ├── Presentation Slide (1920x1080)
    └── + 새 포맷 추가

  [동기화: ON 🔗]  <- 토글 버튼

우측:
  [접근성 검사] [미리보기] [발행]
```

**"새 포맷 추가" 다이얼로그**:

```
┌─────────────────────────────────────────┐
│ 새 포맷 추가                              │
├─────────────────────────────────────────┤
│                                         │
│ 플랫폼 선택:                             │
│   ○ Instagram (1080x1080, 1080x1350)   │
│   ● Facebook (1200x630 Link Card)      │
│   ○ LinkedIn (1200x627)                │
│   ○ Presentation (1920x1080, 16:9)    │
│   ○ Product Detail (custom)            │
│                                         │
│ 변환 모드:                               │
│   ● 자동 변환 (레이아웃 자동 조정)         │
│   ○ AI 제안 (여러 레이아웃 후보 생성)      │
│   ○ 수동 복사 (빈 프레임에서 시작)         │
│                                         │
│ 동기화 설정:                             │
│   ☑ 텍스트 역할 동기화                    │
│   ☑ 이미지 동기화                         │
│   ☑ 브랜드 킷 동기화                      │
│                                         │
│         [취소]      [생성]               │
└─────────────────────────────────────────┘
```

**동기화 토글 동작**:

```typescript
// 동기화 ON → OFF
if (toggleSync === false) {
  // 경고 다이얼로그
  showDialog({
    title: "동기화 해제",
    message: "동기화를 해제하면 이 문서의 수정사항이 다른 포맷에 반영되지 않습니다. 계속하시겠습니까?",
    actions: [
      { label: "취소", variant: "secondary" },
      { label: "해제", variant: "danger", onClick: () => setSync(false) }
    ]
  });
}

// 동기화 OFF → ON
if (toggleSync === true) {
  // 충돌 확인
  const conflicts = checkSyncConflicts(documentSet);
  if (conflicts.length > 0) {
    showDialog({
      title: "동기화 충돌 감지",
      message: "다른 문서에서 이미 수정된 항목이 있습니다. 어떻게 처리하시겠습니까?",
      conflicts: [
        { role: "headline", currentValue: "SALE 70%", otherValue: "SALE 50%" },
        { role: "product_name", currentValue: "프리미엄 가방", otherValue: "럭셔리 백팩" }
      ],
      actions: [
        { label: "현재 문서 우선", onClick: () => mergeSyncConflicts("current") },
        { label: "다른 문서 우선", onClick: () => mergeSyncConflicts("other") },
        { label: "취소" }
      ]
    });
  } else {
    setSync(true);
    toast.success("동기화가 활성화되었습니다.");
  }
}
```

---

## 10. 개발 단계 (Phase별 구현 계획)

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

#### 9.2.1 타입 시스템 구현

**목표**: TypeScript 타입 정의를 통한 타입 안전성 확보

**구현 파일**:
- `src/types/document.ts`: SparklioDocument 및 관련 타입
- `src/types/object.ts`: SparklioObject 및 관련 타입
- `src/types/action.ts`: EditorAction 및 관련 타입
- `src/types/role.ts`: Role Taxonomy 타입

**상세 작업**:

```typescript
// src/types/document.ts
export type SparklioDocumentType =
  | "product_detail"
  | "blog"
  | "brochure"
  | "sns_card"
  | "deck"
  | "landing"
  | "email"
  | "infographic";

export interface SparklioDocument {
  documentId: string;
  brandId: string;
  type: SparklioDocumentType;
  meta: DocumentMeta;
  pages: SparklioPage[];
  brandKit?: BrandKitReference;
  collaboration?: CollaborationInfo;
}

// Validation 함수
export function validateDocument(doc: unknown): doc is SparklioDocument {
  // Runtime validation logic
  if (!doc || typeof doc !== 'object') return false;
  const d = doc as any;
  return (
    typeof d.documentId === 'string' &&
    typeof d.brandId === 'string' &&
    isValidDocumentType(d.type) &&
    Array.isArray(d.pages)
  );
}
```

**테스트 케이스**:
```typescript
// src/types/__tests__/document.test.ts
describe('SparklioDocument', () => {
  it('should validate valid document', () => {
    const doc = createMockDocument();
    expect(validateDocument(doc)).toBe(true);
  });

  it('should reject invalid document', () => {
    const invalid = { foo: 'bar' };
    expect(validateDocument(invalid)).toBe(false);
  });
});
```

---

#### 9.2.2 Document → Canvas 렌더링 엔진

**목표**: JSON Document를 Fabric.js Canvas로 렌더링

**구현 파일**:
- `src/lib/renderer/DocumentRenderer.ts`
- `src/lib/renderer/ObjectFactory.ts`
- `src/lib/renderer/StyleApplier.ts`

**핵심 로직**:

```typescript
// src/lib/renderer/DocumentRenderer.ts
export class DocumentRenderer {
  constructor(
    private canvas: fabric.Canvas,
    private brandKit?: BrandKit
  ) {}

  /**
   * Document를 Canvas에 렌더링
   * @param document 렌더링할 문서
   * @param pageIndex 렌더링할 페이지 인덱스 (기본값: 0)
   */
  async renderDocument(
    document: SparklioDocument,
    pageIndex: number = 0
  ): Promise<void> {
    const page = document.pages[pageIndex];
    if (!page) {
      throw new Error(`Page ${pageIndex} not found`);
    }

    // 1. Canvas 초기화
    this.canvas.clear();
    this.canvas.setDimensions({
      width: page.width,
      height: page.height
    });

    // 2. 배경 설정
    if (page.background) {
      this.setBackground(page.background);
    }

    // 3. 객체 렌더링 (z-index 순서대로)
    const sortedObjects = this.sortObjectsByLayerIndex(page.objects);

    for (const obj of sortedObjects) {
      const fabricObject = await this.createFabricObject(obj);
      if (fabricObject) {
        this.canvas.add(fabricObject);
      }
    }

    // 4. Canvas 렌더링
    this.canvas.renderAll();
  }

  /**
   * SparklioObject → Fabric.js 객체 변환
   */
  private async createFabricObject(
    obj: SparklioObject
  ): Promise<fabric.Object | null> {
    switch (obj.type) {
      case 'text':
        return this.createTextObject(obj);
      case 'image':
        return await this.createImageObject(obj);
      case 'shape':
        return this.createShapeObject(obj);
      case 'button':
        return this.createButtonObject(obj);
      case 'group':
        return await this.createGroupObject(obj);
      default:
        console.warn(`Unknown object type: ${obj.type}`);
        return null;
    }
  }

  private createTextObject(obj: SparklioObject): fabric.Text {
    const text = new fabric.Text(obj.style?.text || '', {
      left: obj.position.x,
      top: obj.position.y,
      width: obj.size?.width,
      height: obj.size?.height,
      angle: obj.rotation || 0,
      fontFamily: obj.style?.fontFamily,
      fontSize: obj.style?.fontSize,
      fontWeight: obj.style?.fontWeight,
      fill: obj.style?.fill || obj.style?.color,
      textAlign: obj.style?.textAlign,
      lineHeight: obj.style?.lineHeight,
      charSpacing: obj.style?.charSpacing,
      selectable: !obj.locked,
      visible: obj.visible !== false
    });

    // 메타데이터 저장
    text.set('data', {
      id: obj.id,
      role: obj.role,
      meta: obj.meta
    });

    return text;
  }

  private async createImageObject(obj: SparklioObject): Promise<fabric.Image> {
    return new Promise((resolve, reject) => {
      fabric.Image.fromURL(
        obj.style?.src || '',
        (img) => {
          if (!img) {
            reject(new Error('Failed to load image'));
            return;
          }

          img.set({
            left: obj.position.x,
            top: obj.position.y,
            width: obj.size?.width,
            height: obj.size?.height,
            angle: obj.rotation || 0,
            opacity: obj.style?.opacity ?? 1,
            selectable: !obj.locked,
            visible: obj.visible !== false
          });

          // 필터 적용
          if (obj.style?.filters) {
            this.applyFilters(img, obj.style.filters);
          }

          // 메타데이터 저장
          img.set('data', {
            id: obj.id,
            role: obj.role,
            meta: obj.meta
          });

          resolve(img);
        },
        { crossOrigin: 'anonymous' }
      );
    });
  }

  private sortObjectsByLayerIndex(objects: SparklioObject[]): SparklioObject[] {
    return [...objects].sort((a, b) => a.layerIndex - b.layerIndex);
  }

  private setBackground(background: PageBackground): void {
    switch (background.type) {
      case 'color':
        this.canvas.setBackgroundColor(background.value, () => {});
        break;
      case 'gradient':
        // Gradient implementation
        break;
      case 'image':
        fabric.Image.fromURL(background.value, (img) => {
          this.canvas.setBackgroundImage(img, () => {});
        });
        break;
    }
  }
}
```

**성능 최적화**:
```typescript
// 대량 객체 렌더링 시 배치 처리
export class BatchRenderer extends DocumentRenderer {
  async renderDocument(
    document: SparklioDocument,
    pageIndex: number = 0
  ): Promise<void> {
    const page = document.pages[pageIndex];

    // 렌더링 비활성화 (성능 향상)
    this.canvas.renderOnAddRemove = false;

    // 객체 추가
    const sortedObjects = this.sortObjectsByLayerIndex(page.objects);
    const fabricObjects = await Promise.all(
      sortedObjects.map(obj => this.createFabricObject(obj))
    );

    fabricObjects.filter(Boolean).forEach(obj => {
      this.canvas.add(obj!);
    });

    // 렌더링 재활성화 및 한 번에 렌더링
    this.canvas.renderOnAddRemove = true;
    this.canvas.requestRenderAll();
  }
}
```

**테스트**:
```typescript
// src/lib/renderer/__tests__/DocumentRenderer.test.ts
describe('DocumentRenderer', () => {
  let canvas: fabric.Canvas;
  let renderer: DocumentRenderer;

  beforeEach(() => {
    canvas = new fabric.Canvas(null);
    renderer = new DocumentRenderer(canvas);
  });

  it('should render text object', async () => {
    const doc = createMockDocument([
      {
        id: 'text_001',
        type: 'text',
        position: { x: 100, y: 50 },
        style: { text: 'Hello' }
      }
    ]);

    await renderer.renderDocument(doc);

    expect(canvas.getObjects()).toHaveLength(1);
    expect(canvas.getObjects()[0].type).toBe('text');
  });

  it('should render objects in z-index order', async () => {
    const doc = createMockDocument([
      { id: 'obj1', layerIndex: 10 },
      { id: 'obj2', layerIndex: 5 },
      { id: 'obj3', layerIndex: 15 }
    ]);

    await renderer.renderDocument(doc);

    const objects = canvas.getObjects();
    expect(objects[0].get('data').id).toBe('obj2'); // layerIndex 5
    expect(objects[1].get('data').id).toBe('obj1'); // layerIndex 10
    expect(objects[2].get('data').id).toBe('obj3'); // layerIndex 15
  });
});
```

---

#### 9.2.3 Canvas → Document 동기화

**목표**: 사용자의 Canvas 조작을 Document에 실시간 반영

**구현 파일**:
- `src/lib/sync/CanvasSynchronizer.ts`
- `src/lib/sync/ObjectSerializer.ts`

**핵심 로직**:

```typescript
// src/lib/sync/CanvasSynchronizer.ts
export class CanvasSynchronizer {
  private syncDebounceTimer: NodeJS.Timeout | null = null;

  constructor(
    private canvas: fabric.Canvas,
    private updateDocument: (updater: (doc: SparklioDocument) => SparklioDocument) => void
  ) {
    this.attachEventListeners();
  }

  private attachEventListeners(): void {
    // 객체 이동
    this.canvas.on('object:moving', (e) => {
      this.debouncedSync(() => {
        this.syncObjectPosition(e.target!);
      });
    });

    // 객체 크기 조정
    this.canvas.on('object:scaling', (e) => {
      this.debouncedSync(() => {
        this.syncObjectSize(e.target!);
      });
    });

    // 객체 회전
    this.canvas.on('object:rotating', (e) => {
      this.debouncedSync(() => {
        this.syncObjectRotation(e.target!);
      });
    });

    // 객체 수정 완료
    this.canvas.on('object:modified', (e) => {
      this.syncObjectComplete(e.target!);
    });

    // 텍스트 변경
    this.canvas.on('text:changed', (e) => {
      this.syncTextContent(e.target as fabric.Text);
    });
  }

  private syncObjectPosition(fabricObj: fabric.Object): void {
    const data = fabricObj.get('data');
    if (!data?.id) return;

    this.updateDocument((doc) => {
      return updateObjectInDocument(doc, data.id, {
        position: {
          x: fabricObj.left || 0,
          y: fabricObj.top || 0
        }
      });
    });
  }

  private syncObjectSize(fabricObj: fabric.Object): void {
    const data = fabricObj.get('data');
    if (!data?.id) return;

    this.updateDocument((doc) => {
      return updateObjectInDocument(doc, data.id, {
        size: {
          width: (fabricObj.width || 0) * (fabricObj.scaleX || 1),
          height: (fabricObj.height || 0) * (fabricObj.scaleY || 1)
        }
      });
    });
  }

  private debouncedSync(fn: () => void, delay: number = 100): void {
    if (this.syncDebounceTimer) {
      clearTimeout(this.syncDebounceTimer);
    }
    this.syncDebounceTimer = setTimeout(fn, delay);
  }
}

// Helper function
function updateObjectInDocument(
  doc: SparklioDocument,
  objectId: string,
  updates: Partial<SparklioObject>
): SparklioDocument {
  return {
    ...doc,
    pages: doc.pages.map(page => ({
      ...page,
      objects: page.objects.map(obj =>
        obj.id === objectId
          ? { ...obj, ...updates }
          : obj
      )
    }))
  };
}
```

---

#### 9.2.4 멀티 페이지 지원

**목표**: 여러 페이지를 가진 문서 편집 지원

**구현 파일**:
- `src/components/Editor/PageNavigator.tsx`
- `src/hooks/usePageNavigation.ts`

**UI 컴포넌트**:

```typescript
// src/components/Editor/PageNavigator.tsx
export function PageNavigator() {
  const document = useEditorStore((state) => state.document);
  const currentPageIndex = useEditorStore((state) => state.currentPageIndex);
  const { goToPage, addPage, deletePage, reorderPages } = usePageNavigation();

  if (!document) return null;

  return (
    <div className="flex items-center gap-2 p-2 bg-gray-100">
      {/* 페이지 목록 */}
      <div className="flex gap-1 overflow-x-auto">
        {document.pages.map((page, index) => (
          <PageThumbnail
            key={page.pageId}
            page={page}
            index={index}
            isActive={index === currentPageIndex}
            onClick={() => goToPage(index)}
            onDelete={() => deletePage(index)}
          />
        ))}
      </div>

      {/* 페이지 추가 버튼 */}
      <button
        onClick={() => addPage()}
        className="px-3 py-1 bg-blue-500 text-white rounded"
      >
        + 페이지 추가
      </button>

      {/* 페이지 정보 */}
      <span className="text-sm text-gray-600">
        Page {currentPageIndex + 1} of {document.pages.length}
      </span>
    </div>
  );
}
```

**Hook 구현**:

```typescript
// src/hooks/usePageNavigation.ts
export function usePageNavigation() {
  const { document, currentPageIndex, setDocument, setCurrentPageIndex } =
    useEditorStore();

  const goToPage = useCallback((index: number) => {
    if (!document) return;
    if (index < 0 || index >= document.pages.length) return;

    setCurrentPageIndex(index);
  }, [document, setCurrentPageIndex]);

  const addPage = useCallback((afterIndex?: number) => {
    if (!document) return;

    const insertIndex = afterIndex ?? document.pages.length;
    const newPage: SparklioPage = {
      pageId: generateId('page'),
      name: `Page ${document.pages.length + 1}`,
      width: 1200,
      height: 2400,
      objects: []
    };

    const newPages = [
      ...document.pages.slice(0, insertIndex),
      newPage,
      ...document.pages.slice(insertIndex)
    ];

    setDocument({
      ...document,
      pages: newPages
    });

    goToPage(insertIndex);
  }, [document, setDocument, goToPage]);

  const deletePage = useCallback((index: number) => {
    if (!document) return;
    if (document.pages.length <= 1) {
      alert('마지막 페이지는 삭제할 수 없습니다.');
      return;
    }

    const newPages = document.pages.filter((_, i) => i !== index);

    setDocument({
      ...document,
      pages: newPages
    });

    // 현재 페이지가 삭제된 경우 이전 페이지로 이동
    if (index === currentPageIndex) {
      goToPage(Math.max(0, index - 1));
    } else if (index < currentPageIndex) {
      setCurrentPageIndex(currentPageIndex - 1);
    }
  }, [document, currentPageIndex, setDocument, setCurrentPageIndex, goToPage]);

  return {
    goToPage,
    addPage,
    deletePage,
    currentPage: document?.pages[currentPageIndex],
    totalPages: document?.pages.length || 0
  };
}
```

---

#### 9.2.5 Role 기능 구현

**구현 파일**:
- `src/components/Editor/RoleBadge.tsx`
- `src/components/Editor/RoleSelector.tsx`
- `src/lib/role/RoleManager.ts`

**Role Badge UI**:

```typescript
// src/components/Editor/RoleBadge.tsx
const ROLE_COLORS: Record<string, string> = {
  headline: 'bg-blue-500',
  subheadline: 'bg-blue-400',
  body: 'bg-gray-500',
  cta_button: 'bg-green-500',
  product_name: 'bg-purple-500',
  image_primary: 'bg-orange-500',
  // ... 더 많은 역할
};

export function RoleBadge({ role }: { role?: string }) {
  if (!role) return null;

  const colorClass = ROLE_COLORS[role] || 'bg-gray-400';

  return (
    <div className={`px-2 py-1 text-xs text-white rounded ${colorClass}`}>
      {role}
    </div>
  );
}
```

**Role Selector**:

```typescript
// src/components/Editor/RoleSelector.tsx
export function RoleSelector({
  currentRole,
  onRoleChange
}: {
  currentRole?: string;
  onRoleChange: (role: string) => void;
}) {
  const documentType = useEditorStore((state) => state.document?.type);
  const availableRoles = getAvailableRolesForDocumentType(documentType);

  return (
    <select
      value={currentRole || ''}
      onChange={(e) => onRoleChange(e.target.value)}
      className="px-2 py-1 border rounded"
    >
      <option value="">역할 없음</option>
      {availableRoles.map((role) => (
        <option key={role.value} value={role.value}>
          {role.label}
        </option>
      ))}
    </select>
  );
}

function getAvailableRolesForDocumentType(
  type?: SparklioDocumentType
): Array<{ value: string; label: string }> {
  const commonRoles = [
    { value: 'headline', label: '헤드라인' },
    { value: 'subheadline', label: '서브 헤드라인' },
    { value: 'body', label: '본문' },
    { value: 'cta_button', label: 'CTA 버튼' },
    // ... 공통 역할
  ];

  const typeSpecificRoles: Record<SparklioDocumentType, Array<{value: string; label: string}>> = {
    product_detail: [
      { value: 'product_name', label: '상품명' },
      { value: 'price_block', label: '가격' },
      { value: 'feature_list', label: '특징 리스트' },
      // ...
    ],
    blog: [
      { value: 'post_title', label: '글 제목' },
      { value: 'post_intro', label: '도입부' },
      // ...
    ],
    // ... 다른 타입들
  };

  return [
    ...commonRoles,
    ...(type ? typeSpecificRoles[type] || [] : [])
  ];
}
```

---

#### 9.2.6 EditorAction 시스템

**구현 파일**:
- `src/lib/action/EditorActionManager.ts`
- `src/lib/action/actionAppliers.ts`
- `src/hooks/useEditorActions.ts`

**Action Manager**:

```typescript
// src/lib/action/EditorActionManager.ts
export class EditorActionManager {
  private undoStack: EditorAction[] = [];
  private redoStack: EditorAction[] = [];
  private maxStackSize: number = 100;

  constructor(
    private getDocument: () => SparklioDocument | null,
    private setDocument: (doc: SparklioDocument) => void,
    private onActionApplied?: (action: EditorAction) => void
  ) {}

  apply(action: EditorAction): void {
    const document = this.getDocument();
    if (!document) return;

    // 이전 상태 저장
    const previousState = this.captureRelevantState(document, action);
    const actionWithPrevious: EditorAction = {
      ...action,
      previousState,
      timestamp: new Date().toISOString()
    };

    // Action 적용
    const newDocument = this.applyActionToDocument(document, actionWithPrevious);

    // Document 업데이트
    this.setDocument(newDocument);

    // Undo 스택에 추가
    this.undoStack.push(actionWithPrevious);
    if (this.undoStack.length > this.maxStackSize) {
      this.undoStack.shift(); // 오래된 항목 제거
    }

    // Redo 스택 초기화
    this.redoStack = [];

    // 콜백 호출
    this.onActionApplied?.(actionWithPrevious);
  }

  undo(): boolean {
    const action = this.undoStack.pop();
    if (!action || !action.previousState) return false;

    const document = this.getDocument();
    if (!document) return false;

    // 역 Action 적용
    const revertedDocument = this.revertAction(document, action);
    this.setDocument(revertedDocument);

    // Redo 스택에 추가
    this.redoStack.push(action);

    return true;
  }

  redo(): boolean {
    const action = this.redoStack.pop();
    if (!action) return false;

    const document = this.getDocument();
    if (!document) return false;

    // Action 재적용
    const newDocument = this.applyActionToDocument(document, action);
    this.setDocument(newDocument);

    // Undo 스택에 추가
    this.undoStack.push(action);

    return true;
  }

  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  getHistory(): EditorAction[] {
    return [...this.undoStack];
  }

  clearHistory(): void {
    this.undoStack = [];
    this.redoStack = [];
  }

  private applyActionToDocument(
    document: SparklioDocument,
    action: EditorAction
  ): SparklioDocument {
    switch (action.type) {
      case 'insert_object':
        return applyInsertObject(document, action);
      case 'update_object':
        return applyUpdateObject(document, action);
      case 'delete_object':
        return applyDeleteObject(document, action);
      case 'move_object':
        return applyMoveObject(document, action);
      case 'update_style':
        return applyUpdateStyle(document, action);
      // ... 다른 액션 타입들
      default:
        console.warn(`Unknown action type: ${action.type}`);
        return document;
    }
  }

  private revertAction(
    document: SparklioDocument,
    action: EditorAction
  ): SparklioDocument {
    if (!action.previousState) return document;

    // previousState를 사용하여 역 Action 생성
    const revertAction: EditorAction = {
      ...action,
      payload: action.previousState,
      previousState: undefined
    };

    return this.applyActionToDocument(document, revertAction);
  }

  private captureRelevantState(
    document: SparklioDocument,
    action: EditorAction
  ): any {
    // Action 타입에 따라 필요한 상태만 캡처
    switch (action.type) {
      case 'update_object':
      case 'update_style':
      case 'move_object':
        return this.findObject(document, action.targetId!)?.style;
      case 'delete_object':
        return this.findObject(document, action.targetId!);
      default:
        return null;
    }
  }

  private findObject(
    document: SparklioDocument,
    objectId: string
  ): SparklioObject | null {
    for (const page of document.pages) {
      const obj = page.objects.find(o => o.id === objectId);
      if (obj) return obj;
    }
    return null;
  }
}
```

**React Hook**:

```typescript
// src/hooks/useEditorActions.ts
export function useEditorActions() {
  const document = useEditorStore((state) => state.document);
  const setDocument = useEditorStore((state) => state.setDocument);
  const [actionManager] = useState(() =>
    new EditorActionManager(
      () => document,
      setDocument
    )
  );

  const applyAction = useCallback((action: EditorAction) => {
    actionManager.apply(action);
  }, [actionManager]);

  const undo = useCallback(() => {
    actionManager.undo();
  }, [actionManager]);

  const redo = useCallback(() => {
    actionManager.redo();
  }, [actionManager]);

  return {
    applyAction,
    undo,
    redo,
    canUndo: actionManager.canUndo(),
    canRedo: actionManager.canRedo(),
    history: actionManager.getHistory()
  };
}
```

---

#### 9.2.7 통합 체크리스트

```yaml
타입 시스템:
  - [ ] SparklioDocument 인터페이스 정의
  - [ ] SparklioObject 인터페이스 정의
  - [ ] EditorAction 인터페이스 정의
  - [ ] Role Taxonomy 타입 정의
  - [ ] Validation 함수 작성
  - [ ] 타입 단위 테스트 작성

Document 관리:
  - [ ] DocumentRenderer 클래스 구현
  - [ ] ObjectFactory 구현
  - [ ] Canvas → Document 동기화
  - [ ] 멀티 페이지 Navigation UI
  - [ ] 페이지 추가/삭제/순서 변경
  - [ ] 섹션 그룹 관리

Role 기능:
  - [ ] RoleBadge 컴포넌트
  - [ ] RoleSelector 컴포넌트
  - [ ] 역할별 색상 코딩
  - [ ] 역할 변경 시 스타일 재적용
  - [ ] 역할 기반 검색/필터링

EditorAction:
  - [ ] EditorActionManager 구현
  - [ ] Action Appliers (insert, update, delete 등)
  - [ ] Undo/Redo 스택 관리
  - [ ] Action History 뷰어 UI
  - [ ] 키보드 단축키 연동 (Ctrl+Z, Ctrl+Y)
  - [ ] Action 단위 테스트

성능 최적화:
  - [ ] 대량 객체 배치 렌더링
  - [ ] Canvas 동기화 Debounce
  - [ ] Undo 스택 크기 제한 (100개)
  - [ ] 메모리 프로파일링

통합 테스트:
  - [ ] Document 로드 → 렌더링 테스트
  - [ ] 객체 추가/수정/삭제 E2E 테스트
  - [ ] Undo/Redo 플로우 테스트
  - [ ] 멀티 페이지 전환 테스트
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
| 2025-11-14 (목) | 1.1 | **Canva 2025 대응 대규모 업데이트**: (1) Canva 대비 차별화 포인트 비교표 추가, (2) AI 이미지 편집 파이프라인 확장 (생성/스타일변경/Inpaint/Outpaint/배경제거/세트동기화), (3) 반응형 레이아웃 & 멀티포맷 변환 시스템 (Frame 기반, 앵커 좌표, Magic Switch 대응, DocumentSet 동기화, 접근성 WCAG 체크), (4) 브랜드 가드레일 & 권한 시스템 (브랜드 룰 엔진, 잠금 레이어, 역할 기반 권한, AI 가드레일 준수) | Frontend Team |

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
