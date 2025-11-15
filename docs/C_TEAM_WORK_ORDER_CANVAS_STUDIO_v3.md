# C_TEAM_WORK_ORDER_CANVAS_STUDIO_v3.md

# Sparklio V4.3 — C팀(Frontend) 작업 지시서 v3.0 (Canvas Studio 전면 재설계)

- 작성일: 2025-11-15
- 작성자: A팀 (Infrastructure Team)
- 버전: v3.0 (Canvas Studio 기반 전면 재설계)
- 상태: **최종 확정본 - 즉시 작업 시작 가능**

---

## ⚠️ 중요 공지

**기존 C_TEAM_WORK_ORDER.md (v2.0)는 폐기되었습니다.**

v2.0의 문제점:
- ❌ 원페이지 에디터의 실제 UX/레이아웃과 맞지 않음
- ❌ VSCode 스타일 패널 구조 누락
- ❌ Concept Board, Pitch Deck, Product Story 등 멀티 모드 지원 부족
- ❌ 이미지/표/그래프 고급 편집 기능 명세 부족

**이 문서(v3.0)가 유일한 기준 문서입니다.**

---

## 0. 전체 개요

### 0.1 Sparklio Canvas Studio란?

**하나의 화면**에서 브랜드 킷, 컨셉보드, 상품상세, 프리젠테이션, 광고·쇼츠, SNS 세트까지
**"챗으로 생성 → 캔버스로 정밀 수정 → 한 번에 발행"** 하는 **단일 원페이지 에디터**입니다.

**핵심 컨셉**:
- VSCode 스타일의 **양쪽 패널 + 중앙 캔버스 + 우측 챗/인스펙터 Dock** 구조
- 컨셉보드(Concept Board)는 이미지·색상·폰트·키워드가 모여 있는 **무드/아이디어 보드**
- 나중에 "Deck / 상품상세 / 광고"의 출발점이 되도록 설계

### 0.2 이 문서의 목적

이 문서만 보고도 C팀이 **Sparklio Canvas Studio**를 구현할 수 있도록:
- 전체 레이아웃 구조
- 폴더/파일 구조
- 핵심 React 컴포넌트 구조
- 에디터 전역 상태 모델
- 모드(Concept Board / Pitch Deck / Product Story) 구성 방식
- 우측 Dock(챗/인스펙터/레이어/데이터/브랜드) 구조

를 명확히 정의합니다.

---

## 1. 전체 레이아웃 구조

### 1.1 화면 분할 (데스크톱 기준, 최소 1366×768)

```text
[ 좌측 액티비티 바 ] [ 좌측 패널 ] | [ 중앙 캔버스 영역 ] | [ 우측 Dock (탭: Chat / Inspector / Layers / Data / Brand) ]
```

- **좌측 액티비티 바 (Activity Bar)**
  - 얇은 세로 아이콘 바 (약 56px)
  - 에디터 안에서 작업 "종류" 전환

- **좌측 패널 (Side Panel)**
  - 선택한 모드에 따라:
    - 프로젝트/템플릿 선택
    - 페이지 썸네일(여러 장)
    - 컨셉보드에서는 레이어/그룹 리스트
  - 접기/펼치기 가능, 드래그로 폭 조절 (VSCode 사이드바 느낌)

- **중앙 캔버스 (Canvas Area)**
  - 모든 제작물(컨셉보드, 슬라이드, 상세페이지 등)이 실제로 편집되는 영역
  - 확대/축소, 그리드, 정렬가이드, 드래그 편집 지원

- **우측 Dock (Right Dock)**
  - 탭 구조:
    - `Spark Chat` (AI 대화)
    - `Inspector` (속성 편집)
    - `Layers` (레이어/오브젝트 트리)
    - `Data` (표/그래프 데이터, 외부 연동)
    - `Brand` (브랜드 킷, 컬러/폰트/컴포넌트)
  - Dock 전체는 접기/펼치기 가능, 폭 조절 가능

### 1.2 뷰 모드

상단 우측에 뷰 전환 아이콘 3개:

1. **Studio View**
   - 좌/우 패널 모두 보이는 기본 모드

2. **Canvas Focus**
   - 좌/우 패널 숨기고 중앙 캔버스만 전체 화면
   - 툴바는 상단 얇게 유지

3. **Chat Focus**
   - 우측 Dock 폭 확대, 좌측 패널 최소화
   - AI와 대화하며 빠르게 수정할 때 사용

---

## 2. 메뉴 체계

### 2.1 상단 메인 플로우 메뉴

상단 글로벌 탭 (왼쪽 로고, 오른쪽 사용자 영역 사이):

1. **Spark Chat** — 생성 시작점 (챗으로 브리프 받고 초안 만들기)
2. **Canvas Studio** — 원페이지 에디터(현재 문서 편집)
3. **Asset Library** — 이미지/영상/템플릿/브랜드 에셋 관리
4. **Publish Hub** — 블로그·SNS·광고·프리젠테이션 배포
5. **Insight Radar** — 캠페인 데이터, 트렌드, 성과 분석 (후순위)

> v3 P0에서는 `Spark Chat`, `Canvas Studio`, `Asset Library`, `Publish Hub`까지만 구현.
> `Insight Radar`는 메뉴만 두고 비활성/Coming soon 처리.

### 2.2 좌측 액티비티 바 메뉴 (에디터 내 "작업 타입")

아이콘 + 영문/국문 명칭:

1. **Brand DNA (브랜드 킷)**
2. **Concept Board (컨셉보드)**
3. **Product Story (상품상세·브로셔)**
4. **Social Set (SNS 세트)**
5. **Pitch Deck (프리젠테이션)**
6. **Ad Studio (광고·쇼츠)**
7. **Print & Collateral (인쇄물·리플렛)** - P1
8. **Blog & Article (블로그 콘텐츠)** - P1

→ 어떤 아이콘을 클릭하든, **동일한 원페이지 에디터 레이아웃 안에서**
템플릿/페이지 구조/툴바 프리셋만 바뀌도록 설계.

---

## 3. 컨셉보드 모드 (Concept Board Mode)

컨셉보드는 우리의 "브랜드·캠페인 아이디어의 출발점"이므로, 별도 모드로 정리.

### 3.1 컨셉보드 캔버스 구조

- 하나의 보드 안에:
  - 이미지 타일
  - 색상칩(Color Swatch)
  - 폰트 샘플 텍스트
  - 키워드 카드(태그 카드)
  - 간단한 메모(포스트잇 느낌)

- 자동 정렬 옵션:
  - Mood Wall (사진 중심 그리드)
  - Palette Wall (색상 강조)
  - Type Wall (폰트/슬로건 중심)
  - Mixed (사진 + 키워드 + 컬러가 균형 있게)

### 3.2 AI 기능 (P0/P1)

**P0**
- "브랜드 설명/URL/이미지 여러 장"을 입력하면:
  - 이미지를 분류하고,
  - 대표 색상 팔레트 추출,
  - 키워드 10개, 톤&매너 3줄 설명 생성
- 컨셉보드 한 장을 자동 생성:
  - 대표 이미지 6~12장
  - 색상칩 5개
  - 키워드 카드
  - 타이틀/슬로건 제안 2~3개

**P1**
- 컨셉보드 → `Pitch Deck` 초안으로 변환
- 컨셉보드 → `Product Story` 섹션 이미지/카피 자동 배치

### 3.3 컨셉보드 전용 도구

- 이미지 자동 정렬 (`Tidy` 버튼, 간격 유지)
- 그룹별 섹션 나누기 (예: "타겟", "무드", "경쟁사" 그룹)
- 이미지 클릭 시 오른쪽 `Inspector`에서:
  - 출처/노트/태그 입력
  - "이 이미지를 기반으로 광고 크리에이티브 생성" 버튼

---

## 4. 프리젠테이션 / 상품상세 / 광고까지 공통 에디터 기능

### 4.1 이미지 기능

- **배경 제거**
  - 한 번 클릭으로 제거
  - "실루엣 강조", "제품만 남기기" 등 프리셋

- **이미지 새로 생성**
  - Chat에서 프롬프트 입력 → 새 이미지 생성 → 캔버스에 바로 삽입
  - 선택한 이미지 기반 변형(스타일 변경, 시즌/색상 변경)

- **부분 수정(인페인트)**
  - 브러시로 영역 선택 → Chat으로 "이 부분을 OOO로 바꿔줘"

- **비파괴 편집**
  - 자르기/필터/색보정/그림자/테두리 모두 되돌리기 가능
  - 원본 링크 유지

- **브랜드 스타일 버튼**
  - "브랜드 프레임 적용"
  - "브랜드 그림자/테두리 프리셋 적용"

### 4.2 표·테이블 기능

- 엑셀/시트 붙여넣기 → 표 자동 생성
- "이 텍스트를 표로 정리해줘" Chat 명령 지원
- 표 스타일:
  - 가격표, 비교표, 타임라인, 스펙표 프리셋
  - 브랜드 컬러 기반 테마
- 열/행 단위 정렬, 서식(숫자/통화/퍼센트), 머리글 고정
- 표 데이터를 `그래프`와 연결 (옵션 ON 시 자동 업데이트)

### 4.3 그래프(차트) 기능

- 타입: 막대/라인/파이/도넛/콤보 차트 (P0에서 2~3개만 시작 가능)
- 데이터 입력:
  - 표에서 가져오기
  - CSV 업로드
  - Chat에 "2022~2024 매출 이렇게 넣어줘"라고 말하기
- 브랜드 기반 색상 테마
- 슬라이드 쇼 시 간단한 애니메이션 (막대 올라오기, 선 그려지기)

---

## 5. 다중 페이지 & 썸네일

### 5.1 좌측 패널 — Pages 뷰

- 모든 "여러 장" 출력물(Deck, Product Story, Ad 세트 등)은
  좌측 패널에 **페이지 썸네일** 리스트로 표시

- 동작:
  - 클릭 → 해당 페이지가 중앙 캔버스에 열림
  - 드래그 & 드롭 → 순서 변경
  - 우클릭 → 복제/삭제/숨김/템플릿 변경

- 섹션(챕터) 지원:
  - 프리젠테이션은 섹션 헤더로 묶어서 접기/펼치기 가능

### 5.2 초기 생성 플로우

예) "이 제품으로 10장짜리 프리젠테이션 만들어줘"

1. Spark Chat에서 브리프 입력
2. 시스템이 `Pitch Deck` 모드 + 템플릿 선택
3. 10장의 슬라이드 구조를 자동으로 만들고,
4. 좌측 패널에 썸네일 10장이 생성된 뒤,
5. 중앙 캔버스에는 1번 슬라이드부터 순차 편집

---

## 6. 우측 Dock 탭 상세

### 6.1 Spark Chat 탭

- 위: 메시지 스크롤
- 아래: 입력창 (항상 화면 안에 보이도록 고정 높이)
- 기능:
  - "지금 슬라이드에 카피 넣어줘"
  - "2번째 표를 매출 기준 내림차순으로 정렬해줘"
  - "컨셉보드 기반으로 이 페이지 레이아웃 새로 구성해줘"
- AI 명령은 **에디터 액션**으로 변환 (undo/redo에 포함)

### 6.2 Inspector 탭

오브젝트 유형별 패널:
- 텍스트: 폰트, 크기, 색, 정렬, 자간/행간 등
- 이미지: 크기, 비율, 필터, 배경 제거, 그림자, 프레임
- 블록/섹션: 패딩, 배경, 테두리, 레이아웃 옵션
- 표/그래프: 스타일, 데이터, 축/범례 설정

### 6.3 Layers 탭

- 페이지/보드의 모든 오브젝트를 트리 구조로 표시
- 잠금/숨김/이름 변경
- 그룹/언그룹

### 6.4 Data 탭

- 현재 문서에서 사용 중인 데이터 소스 리스트
  - 표 데이터, 외부 스프레드시트 링크, 업로드된 CSV 등
- "이 데이터로 새 그래프 만들기" 버튼

### 6.5 Brand 탭

- 브랜드 킷에서 가져온:
  - 로고, 색상 팔레트, 폰트, 버튼 스타일, 컴포넌트
- 드래그 & 드롭으로 캔버스에 삽입 가능
- "문서 전체에 브랜드 스타일 적용" 버튼

---

## 7. P0 / P1 우선순위

### P0 — 반드시 v3에서 완성할 것

1. VSCode 스타일 레이아웃 (좌측 액티비티 바 + 좌측 패널 + 중앙 캔버스 + 우측 Dock)
2. `Pitch Deck`, `Product Story`, `Concept Board` 모드 (3가지만 먼저)
3. 페이지 썸네일 리스트 + 선택/정렬/복제
4. 텍스트/이미지 기본 편집 + Inspector
5. Spark Chat 탭에서
   - 텍스트 삽입/수정
   - 간단한 레이아웃 변경
6. 이미지:
   - 삽입/크기조절/정렬
   - 배경 제거 (백엔드 API 호출이라도 stub 연결)
7. 표 생성 + 기본 스타일링
8. Undo/Redo 히스토리

### P1 — P0 안정화 후 확장

1. 컨셉보드 자동 생성 (이미지+색상+키워드)
2. 그래프/차트 컴포넌트
3. 표-그래프 데이터 연동
4. 고급 이미지 인페인트/스타일 변환
5. 프리젠테이션 애니메이션
6. Deck/Concept Board → Product Story/Ad 세트로 변환

---

## 8. 기술 스택 (확정)

| 분류 | 기술 | 버전 |
|------|------|------|
| Framework | Next.js | 14.x (App Router) |
| Language | TypeScript | 5.x |
| Styling | Tailwind CSS | 3.x |
| State | Zustand | 4.x |
| Canvas | Fabric.js | 5.x |
| HTTP | Axios | 1.x |
| Testing | Jest + RTL | Latest |

**금지 기술**:
- ❌ Pages Router (App Router 사용)
- ❌ Redux (Zustand 사용)
- ❌ Styled Components (Tailwind 사용)
- ❌ Konva, Paper.js (Fabric.js만 사용)

---

## 9. 폴더 구조 (확정안)

**중요**: 기존 프로젝트 구조를 유지하면서, 새로운 Canvas Studio만 추가합니다.

```
frontend/
├── app/
│   ├── studio/
│   │   └── page.tsx                 # Canvas Studio 메인 페이지 (NEW)
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
│
├── components/
│   ├── canvas-studio/               # 새로운 Canvas Studio 전용 폴더 (NEW)
│   │   ├── index.ts
│   │   ├── CanvasStudioShell.tsx   # 전체 레이아웃 셸
│   │   │
│   │   ├── layout/
│   │   │   ├── StudioLayout.tsx    # 좌/중/우 3분할 레이아웃
│   │   │   ├── ActivityBar.tsx
│   │   │   ├── LeftPanel.tsx
│   │   │   ├── LeftPanelHeader.tsx
│   │   │   ├── LeftPanelPages.tsx  # 페이지 썸네일 리스트
│   │   │   ├── LeftPanelConceptBoard.tsx  # 컨셉보드용 패널
│   │   │   ├── CanvasViewport.tsx  # 중앙 캔버스 뷰
│   │   │   ├── TopToolbar.tsx      # 캔버스 상단 툴바
│   │   │   ├── ViewModeSwitcher.tsx # Studio / Canvas Focus / Chat Focus
│   │   │   ├── RightDock.tsx
│   │   │   └── RightDockTabs.tsx
│   │   │
│   │   ├── right-dock/
│   │   │   ├── SparkChatTab.tsx
│   │   │   ├── InspectorTab.tsx
│   │   │   ├── LayersTab.tsx
│   │   │   ├── DataTab.tsx
│   │   │   └── BrandTab.tsx
│   │   │
│   │   ├── modes/
│   │   │   ├── ModeSwitchProvider.tsx
│   │   │   ├── modeConfig.ts       # 모드별 설정 정의
│   │   │   ├── ConceptBoardMode.tsx
│   │   │   ├── PitchDeckMode.tsx
│   │   │   └── ProductStoryMode.tsx
│   │   │
│   │   ├── canvas/
│   │   │   ├── canvasStore.ts      # Fabric.js 캔버스 상태/초기화
│   │   │   ├── useCanvasCommands.ts # 캔버스 조작용 훅
│   │   │   └── types.ts            # 캔버스 요소 타입 등
│   │   │
│   │   ├── editor-store/
│   │   │   ├── useEditorStore.ts   # Zustand 전역 스토어
│   │   │   └── types.ts
│   │   │
│   │   ├── chat/
│   │   │   ├── chatStore.ts
│   │   │   ├── useChatActions.ts
│   │   │   └── types.ts
│   │   │
│   │   └── components/
│   │       ├── PageThumbnail.tsx
│   │       ├── ThumbnailList.tsx
│   │       ├── IconButton.tsx
│   │       ├── SplitPane.tsx       # 좌/우 패널 사이 드래그 리사이즈
│   │       ├── ResizablePanel.tsx
│   │       ├── PanelGroup.tsx
│   │       └── EmptyState.tsx
│   │
│   ├── Chat/                        # 기존 컴포넌트 (유지)
│   ├── Editor/                      # 기존 컴포넌트 (유지)
│   ├── Layout/                      # 기존 컴포넌트 (유지)
│   └── Common/                      # 기존 컴포넌트 (유지)
│
├── lib/
│   ├── api-client.ts                # 기존 유지
│   ├── fabric-utils.ts              # 기존 유지
│   └── storage.ts                   # 기존 유지
│
├── store/
│   ├── chat-store.ts                # 기존 유지
│   ├── editor-store.ts              # 기존 유지
│   └── app-store.ts                 # 기존 유지
│
├── types/
│   ├── api.ts                       # 기존 유지
│   ├── editor.ts                    # 기존 유지
│   └── generator.ts                 # 기존 유지
│
├── hooks/
│   ├── useChat.ts                   # 기존 유지
│   ├── useEditor.ts                 # 기존 유지
│   ├── useGenerator.ts              # 기존 유지
│   ├── useKeyboardShortcuts.ts      # NEW
│   └── useMediaQuery.ts             # NEW
│
├── public/
│   └── assets/
│
├── .env.local
├── next.config.js
├── package.json
└── tsconfig.json
```

**중요 원칙**:
- ✅ 기존 `components/`, `store/`, `hooks/` 등은 **그대로 유지**
- ✅ 새로운 Canvas Studio는 `components/canvas-studio/` 폴더에 **독립적으로 추가**
- ✅ 기존 `/app` 라우트는 유지, `/studio` 라우트만 추가
- ✅ 롤백이 쉬움: `components/canvas-studio/` 폴더와 `app/studio/` 삭제하면 원복

---

## 10. 핵심 컴포넌트 구현 가이드

### 10.1 `app/studio/page.tsx`

```tsx
// app/studio/page.tsx
import { CanvasStudioShell } from "@/components/canvas-studio/CanvasStudioShell";

export default function StudioPage() {
  return <CanvasStudioShell />;
}
```

### 10.2 `CanvasStudioShell.tsx`

```tsx
// components/canvas-studio/CanvasStudioShell.tsx
"use client";

import { StudioLayout } from "./layout/StudioLayout";
import { ModeSwitchProvider } from "./modes/ModeSwitchProvider";
import { EditorStoreProvider } from "./editor-store/EditorStoreProvider";
import { ChatStoreProvider } from "./chat/ChatStoreProvider";

export function CanvasStudioShell() {
  return (
    <EditorStoreProvider>
      <ChatStoreProvider>
        <ModeSwitchProvider>
          <StudioLayout />
        </ModeSwitchProvider>
      </ChatStoreProvider>
    </EditorStoreProvider>
  );
}
```

### 10.3 `StudioLayout.tsx`

```tsx
// components/canvas-studio/layout/StudioLayout.tsx
import { ActivityBar } from "./ActivityBar";
import { LeftPanel } from "./LeftPanel";
import { CanvasViewport } from "./CanvasViewport";
import { RightDock } from "./RightDock";
import { TopToolbar } from "./TopToolbar";

export function StudioLayout() {
  return (
    <div className="flex h-screen flex-col">
      {/* 상단 글로벌 툴바 (뷰모드, 현재 문서명 등) */}
      <TopToolbar />

      <div className="flex flex-1 overflow-hidden">
        {/* 좌측 Activity 바 */}
        <ActivityBar />

        {/* 좌측 패널 + 중앙 캔버스 + 우측 Dock */}
        <div className="flex flex-1 overflow-hidden">
          <LeftPanel />
          <CanvasViewport />
          <RightDock />
        </div>
      </div>
    </div>
  );
}
```

### 10.4 `ActivityBar.tsx`

```tsx
// components/canvas-studio/layout/ActivityBar.tsx
"use client";

import { useEditorStore } from "../editor-store/useEditorStore";

const ACTIVITIES = [
  { id: "brand-dna", label: "Brand DNA", icon: "B" },
  { id: "concept-board", label: "Concept Board", icon: "C" },
  { id: "product-story", label: "Product Story", icon: "P" },
  { id: "pitch-deck", label: "Pitch Deck", icon: "D" },
  { id: "ad-studio", label: "Ad Studio", icon: "A" },
];

export function ActivityBar() {
  const { currentActivity, setActivity } = useEditorStore();

  return (
    <nav className="flex w-14 flex-col border-r bg-neutral-950 text-neutral-100">
      {ACTIVITIES.map((item) => (
        <button
          key={item.id}
          onClick={() => setActivity(item.id)}
          className={`flex h-12 items-center justify-center text-xs ${
            currentActivity === item.id ? "bg-neutral-800" : ""
          }`}
          title={item.label}
        >
          {item.icon}
        </button>
      ))}
    </nav>
  );
}
```

### 10.5 `LeftPanel.tsx`

```tsx
// components/canvas-studio/layout/LeftPanel.tsx
"use client";

import { useEditorStore } from "../editor-store/useEditorStore";
import { LeftPanelPages } from "./LeftPanelPages";
import { LeftPanelConceptBoard } from "./LeftPanelConceptBoard";

export function LeftPanel() {
  const { currentActivity, isLeftPanelCollapsed } = useEditorStore();

  if (isLeftPanelCollapsed) return null;

  let content = null;

  if (currentActivity === "concept-board") {
    content = <LeftPanelConceptBoard />;
  } else {
    // 기본은 페이지 썸네일 리스트
    content = <LeftPanelPages />;
  }

  return (
    <aside className="flex w-72 flex-col border-r bg-neutral-50">
      {content}
    </aside>
  );
}
```

### 10.6 `RightDock.tsx`

```tsx
// components/canvas-studio/layout/RightDock.tsx
"use client";

import { useEditorStore } from "../editor-store/useEditorStore";
import { SparkChatTab } from "../right-dock/SparkChatTab";
import { InspectorTab } from "../right-dock/InspectorTab";
import { LayersTab } from "../right-dock/LayersTab";
import { DataTab } from "../right-dock/DataTab";
import { BrandTab } from "../right-dock/BrandTab";

const TABS = [
  { id: "chat", label: "Spark Chat" },
  { id: "inspector", label: "Inspector" },
  { id: "layers", label: "Layers" },
  { id: "data", label: "Data" },
  { id: "brand", label: "Brand" },
];

export function RightDock() {
  const { isRightDockCollapsed, rightDockTab, setRightDockTab } =
    useEditorStore();

  if (isRightDockCollapsed) return null;

  let content = null;
  switch (rightDockTab) {
    case "chat":
      content = <SparkChatTab />;
      break;
    case "inspector":
      content = <InspectorTab />;
      break;
    case "layers":
      content = <LayersTab />;
      break;
    case "data":
      content = <DataTab />;
      break;
    case "brand":
      content = <BrandTab />;
      break;
  }

  return (
    <aside className="flex w-[360px] flex-col border-l bg-white">
      {/* 탭 헤더 */}
      <div className="flex border-b">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setRightDockTab(tab.id)}
            className={`flex-1 px-3 py-2 text-xs ${
              rightDockTab === tab.id ? "border-b-2 border-black font-medium" : ""
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 탭 컨텐츠 */}
      <div className="flex-1 overflow-hidden">{content}</div>
    </aside>
  );
}
```

---

## 11. 모드 시스템

### 11.1 `modeConfig.ts`

```ts
// components/canvas-studio/modes/modeConfig.ts
export type StudioMode = "concept-board" | "pitch-deck" | "product-story";

export interface ModeConfig {
  id: StudioMode;
  label: string;
  defaultPageSize: { width: number; height: number }; // px
  defaultPages: "single" | "multi";
  allowedBlocks: string[]; // 예: ["headline", "body", "image", "table", "chart", "tagCard"]
}

export const MODE_CONFIG: Record<StudioMode, ModeConfig> = {
  "concept-board": {
    id: "concept-board",
    label: "Concept Board",
    defaultPageSize: { width: 1920, height: 1080 },
    defaultPages: "single",
    allowedBlocks: ["image", "colorSwatch", "fontSample", "tagCard", "note"],
  },
  "pitch-deck": {
    id: "pitch-deck",
    label: "Pitch Deck",
    defaultPageSize: { width: 1920, height: 1080 },
    defaultPages: "multi",
    allowedBlocks: ["headline", "body", "image", "table", "chart", "cta"],
  },
  "product-story": {
    id: "product-story",
    label: "Product Story",
    defaultPageSize: { width: 1440, height: 2560 }, // 스크롤형 상세 페이지
    defaultPages: "multi",
    allowedBlocks: ["hero", "featureList", "specTable", "review", "image"],
  },
};
```

### 11.2 전역 에디터 스토어 (Zustand)

```ts
// components/canvas-studio/editor-store/types.ts
import type { StudioMode } from "../modes/modeConfig";

export interface Page {
  id: string;
  name: string;
  thumbnailUrl?: string;
  // 추후 canvas JSON 등 연결
}

export interface EditorState {
  mode: StudioMode;
  currentActivity: string; // ActivityBar 선택 값
  viewMode: "studio" | "canvas-focus" | "chat-focus";

  pages: Page[];
  currentPageId: string | null;

  isLeftPanelCollapsed: boolean;
  isRightDockCollapsed: boolean;
  rightDockTab: "chat" | "inspector" | "layers" | "data" | "brand";

  // actions...
  setActivity: (activity: string) => void;
  setViewMode: (mode: "studio" | "canvas-focus" | "chat-focus") => void;
  setCurrentPageId: (pageId: string) => void;
  setRightDockTab: (tab: string) => void;
}
```

```ts
// components/canvas-studio/editor-store/useEditorStore.ts
import { create } from "zustand";
import type { EditorState } from "./types";

export const useEditorStore = create<EditorState>((set) => ({
  mode: "concept-board",
  currentActivity: "concept-board",
  viewMode: "studio",
  pages: [],
  currentPageId: null,
  isLeftPanelCollapsed: false,
  isRightDockCollapsed: false,
  rightDockTab: "chat",

  setActivity: (activity) => set({ currentActivity: activity }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setCurrentPageId: (pageId) => set({ currentPageId: pageId }),
  setRightDockTab: (tab) => set({ rightDockTab: tab as any }),
  // ... 기타 액션 정의
}));
```

---

## 12. API 연동

### 12.1 Backend API Endpoint

**Base URL**: `http://100.123.51.5:8000`

**Canvas Studio 관련 API**:

```typescript
// 1. Generator 호출 (기존)
POST /api/v1/generate
{
  "kind": "product_detail",
  "brandId": "brand_001",
  "locale": "ko-KR",
  "input": { ... }
}

// 2. Concept Board 생성 (NEW - B팀 구현 후)
POST /api/v1/concept-board/generate
{
  "brandId": "brand_001",
  "basePrompt": "미니멀 럭셔리 화장품 스타일",
  "gridSize": "3x3",
  "variations": 9
}

// 3. Concept Board 조회 (NEW)
GET /api/v1/concept-board/{boardId}

// 4. 문서 저장
POST /api/v1/documents/{docId}/save
{
  "documentJson": { ... },
  "metadata": { ... }
}

// 5. 문서 로드
GET /api/v1/documents/{docId}

// 6. Editor Action
POST /api/v1/editor/action
{
  "documentId": "doc_123",
  "actions": [...]
}
```

### 12.2 API Client 확장

기존 `lib/api-client.ts`를 확장하여 Canvas Studio 전용 함수 추가:

```typescript
// lib/api-client.ts 에 추가

// Concept Board 생성
export async function generateConceptBoard(request: ConceptBoardGenerateRequest) {
  const response = await api.post('/api/v1/concept-board/generate', request);
  return response.data;
}

// Concept Board 조회
export async function getConceptBoard(boardId: string) {
  const response = await api.get(`/api/v1/concept-board/${boardId}`);
  return response.data;
}

// Concept Board 수정
export async function updateConceptBoard(boardId: string, data: any) {
  const response = await api.patch(`/api/v1/concept-board/${boardId}`, data);
  return response.data;
}
```

---

## 13. P0 작업 단계

### Phase 1: 기본 레이아웃 구현 (1주)

**목표**: VSCode 스타일 패널 구조 완성

- [ ] `app/studio/page.tsx` 생성
- [ ] `components/canvas-studio/` 폴더 구조 생성
- [ ] `CanvasStudioShell.tsx` 구현
- [ ] `StudioLayout.tsx` 구현 (좌/중/우 3분할)
- [ ] `ActivityBar.tsx` 구현
- [ ] `LeftPanel.tsx` 구현 (더미 데이터)
- [ ] `CanvasViewport.tsx` 구현 (빈 캔버스)
- [ ] `RightDock.tsx` + 5개 탭 레이아웃 구현
- [ ] `TopToolbar.tsx` 구현
- [ ] `ViewModeSwitcher.tsx` 구현

**산출물**:
- `/studio` 접속 시 VSCode 스타일 레이아웃 표시
- 좌/우 패널 접기/펼치기 동작
- Activity Bar 클릭 시 좌측 패널 내용 변경
- 우측 Dock 탭 전환 동작

---

### Phase 2: 캔버스 & 페이지 관리 (1주)

**목표**: Fabric.js 캔버스 초기화 및 페이지 썸네일 관리

- [ ] Fabric.js 설치 및 초기화
- [ ] `canvasStore.ts` 구현 (캔버스 상태 관리)
- [ ] `useCanvasCommands.ts` 구현 (캔버스 조작 훅)
- [ ] `LeftPanelPages.tsx` 구현 (페이지 썸네일 리스트)
- [ ] `PageThumbnail.tsx` 구현
- [ ] 페이지 추가/삭제/복제 기능
- [ ] 페이지 클릭 시 캔버스 전환
- [ ] 텍스트/이미지 오브젝트 추가 기능 (기본)

**산출물**:
- 페이지 썸네일 리스트 표시
- 페이지 추가/삭제 동작
- 캔버스에 텍스트/이미지 추가 가능

---

### Phase 3: 모드 시스템 & Chat 연동 (1주)

**목표**: 3개 모드(Concept Board, Pitch Deck, Product Story) 구현 및 Chat 연동

- [ ] `modeConfig.ts` 구현
- [ ] `ModeSwitchProvider.tsx` 구현
- [ ] `ConceptBoardMode.tsx` 구현
- [ ] `PitchDeckMode.tsx` 구현
- [ ] `ProductStoryMode.tsx` 구현
- [ ] `SparkChatTab.tsx` 구현 (Chat UI)
- [ ] `chatStore.ts` 구현 (Chat 상태 관리)
- [ ] Chat → Generator API 연동
- [ ] Chat 명령 → 캔버스 업데이트 흐름 구현

**산출물**:
- Activity Bar에서 모드 전환 시 캔버스 구조 변경
- Chat에서 "프리젠테이션 만들어줘" 입력 시 Generator 호출
- Generator 응답 → 캔버스 로딩

---

### Phase 4: Inspector & 고급 편집 (1주)

**목표**: Inspector 패널 구현 및 이미지/표 편집 기능

- [ ] `InspectorTab.tsx` 구현 (오브젝트별 속성 편집)
- [ ] 텍스트 편집: 폰트, 크기, 색상, 정렬
- [ ] 이미지 편집: 크기, 필터, 배경 제거 (stub)
- [ ] 표 생성 기능 (기본)
- [ ] 표 스타일링 (브랜드 컬러 적용)
- [ ] `LayersTab.tsx` 구현 (레이어 트리)
- [ ] Undo/Redo 기능
- [ ] PNG Export 기능

**산출물**:
- Inspector에서 오브젝트 속성 편집
- 표 생성 및 스타일링
- Layers 패널에서 레이어 관리
- PNG 다운로드 기능

---

## 14. 완료 기준 (DoD)

**P0 완료 시나리오**:
```
1. /studio 접속
2. Activity Bar에서 "Pitch Deck" 선택
3. 좌측 패널에서 "New Document" 클릭
4. Spark Chat에서 "10장짜리 회사 소개 프레젠테이션 만들어줘" 입력
5. Generator 호출 → 10장의 슬라이드 생성
6. 좌측 패널에 10개 썸네일 표시
7. 첫 번째 슬라이드 클릭 → 캔버스에 로딩
8. 제목 텍스트 클릭 → Inspector에서 폰트 변경
9. 이미지 추가 → 크기 조절
10. PNG Export → 파일 다운로드
```

**통과 기준**:
- 위 시나리오 1회 이상 성공
- VSCode 스타일 레이아웃 완전히 동작
- 3개 모드(Concept Board, Pitch Deck, Product Story) 전환 가능
- Chat → Generator → Canvas 흐름 완성
- Inspector에서 기본 속성 편집 가능
- PNG Export 성공

---

## 15. 시작하기

### Step 1: 환경 확인

```bash
# 현재 프로젝트 폴더로 이동
cd K:\sparklio_ai_marketing_studio\frontend

# 의존성 확인
npm list fabric zustand

# 없으면 설치
npm install fabric zustand
npm install -D @types/fabric
```

### Step 2: 필독 문서 (총 2시간)

- [ ] 이 문서 (C_TEAM_WORK_ORDER_CANVAS_STUDIO_v3.md) 정독 (60분)
- [ ] `K:\obsidian-k\Sparklio_ai_marketing_studio\최종계획\에디터\001.Sparklio One-Page Creative Studio — UX & Layout Master Spec (v1).md` (30분)
- [ ] `K:\obsidian-k\Sparklio_ai_marketing_studio\최종계획\에디터\002.FRONTEND_CANVAS_STUDIO_STRUCTURE_v1.md` (30분)

### Step 3: 첫 커밋

```bash
git checkout -b feature/canvas-studio-v3
mkdir -p components/canvas-studio
touch app/studio/page.tsx
git add .
git commit -m "feat(canvas-studio): Initialize Canvas Studio v3 structure"
git push origin feature/canvas-studio-v3
```

### Step 4: Phase 1 시작

- `app/studio/page.tsx` 부터 구현
- VSCode 스타일 레이아웃부터 완성
- 매일 작업 진행 상황 커밋

---

## 16. P0 완료 체크리스트

### Phase 1 완료 (1주차)
- [ ] VSCode 스타일 레이아웃 구현
- [ ] Activity Bar 동작
- [ ] 좌/우 패널 접기/펼치기
- [ ] 우측 Dock 5개 탭 전환
- [ ] TopToolbar 구현

### Phase 2 완료 (2주차)
- [ ] Fabric.js 캔버스 초기화
- [ ] 페이지 썸네일 리스트
- [ ] 페이지 추가/삭제/복제
- [ ] 텍스트/이미지 오브젝트 추가

### Phase 3 완료 (3주차)
- [ ] 3개 모드 구현 (Concept Board, Pitch Deck, Product Story)
- [ ] Chat UI 구현
- [ ] Chat → Generator API 연동
- [ ] Generator 응답 → Canvas 로딩

### Phase 4 완료 (4주차)
- [ ] Inspector 패널 구현
- [ ] 텍스트/이미지 속성 편집
- [ ] 표 생성 및 스타일링
- [ ] Layers 패널 구현
- [ ] Undo/Redo
- [ ] PNG Export

### 최종 통과
- [ ] End-to-End 시나리오 성공
- [ ] 테스트 커버리지 70% 이상
- [ ] ESLint 에러 0개
- [ ] Build 성공

---

## 17. 금지 사항

❌ **절대 하지 마세요**:
1. 기존 `components/`, `store/` 폴더 구조 변경
2. P1 기능 구현 (그래프, 애니메이션 등)
3. Redux, MobX 사용
4. Pages Router 사용
5. 독단적 기술 스택 변경

✅ **반드시 하세요**:
1. `components/canvas-studio/` 폴더에만 작업
2. VSCode 스타일 레이아웃 구조 준수
3. P0 범위만 구현
4. 2-3시간마다 커밋
5. 테스트 작성 (70% 이상)

---

## 18. 최종 확인

**C팀의 P0 목표**:
> "VSCode 스타일의 원페이지 에디터에서 Chat → Generator → Canvas 편집 → Export까지 작동하는 Canvas Studio 완성"

**완료 기준**:
> "Pitch Deck 모드에서 10장짜리 프레젠테이션 생성 → 편집 → PNG Export 성공"

**작업 기간**: 4주 (Phase 1-4)

---

**작성 완료일**: 2025-11-15
**버전**: v3.0 (Canvas Studio 기반 전면 재설계)
**다음 액션**: C팀 온보딩, 필독 문서 읽기, Phase 1 시작

**Good luck, C팀! 🚀**

---

## Changelog

- **v3.0 (2025-11-15)**
  - Canvas Studio 기반 전면 재설계
  - VSCode 스타일 패널 구조 명시
  - 3개 모드 (Concept Board, Pitch Deck, Product Story) 상세 명세
  - 우측 Dock 5개 탭 (Chat, Inspector, Layers, Data, Brand) 구조 정의
  - 폴더 구조 재정의 (기존 구조 유지, canvas-studio만 추가)
  - Phase별 작업 단계 명확화

- **v2.0 (폐기됨)**
  - Chat-First SPA 구조 (원페이지 에디터 UX 불일치)

- **v1.0 (폐기됨)**
  - 다중 페이지 구조로 잘못 설계
