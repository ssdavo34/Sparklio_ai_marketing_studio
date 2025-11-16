# Sparklio Canvas Studio v3.0 - Component Architecture

**작성일**: 2025-11-16
**작성자**: C팀 (Frontend Team)
**버전**: v3.0
**상태**: 설계 완료

---

## 📋 목차

1. [개요](#1-개요)
2. [전체 구조](#2-전체-구조)
3. [폴더 구조](#3-폴더-구조)
4. [핵심 컴포넌트](#4-핵심-컴포넌트)
5. [컴포넌트 계층 구조](#5-컴포넌트-계층-구조)
6. [컴포넌트 상세 설계](#6-컴포넌트-상세-설계)
7. [Props 인터페이스](#7-props-인터페이스)
8. [구현 순서](#8-구현-순서)

---

## 1. 개요

### 1.1 목적

Canvas Studio v3.0은 VSCode 스타일의 레이아웃을 기반으로 한 단일 원페이지 에디터입니다.
이 문서는 v3.0 구현을 위한 컴포넌트 아키텍처를 정의합니다.

### 1.2 설계 원칙

- ✅ **기존 코드 유지**: v2.0 코드는 그대로 유지하고, 새로운 Canvas Studio만 추가
- ✅ **독립성**: `components/canvas-studio/` 폴더에 모든 v3 컴포넌트를 격리
- ✅ **재사용성**: 공통 컴포넌트는 최대한 재사용 가능하도록 설계
- ✅ **타입 안정성**: TypeScript를 활용한 완전한 타입 안정성
- ✅ **확장성**: 새로운 모드(Concept Board, Pitch Deck 등) 추가가 용이하도록 설계

---

## 2. 전체 구조

### 2.1 화면 레이아웃

```
┌──────────────────────────────────────────────────────────────────────┐
│                        Top Toolbar (Global)                          │
├──────┬────────────────┬──────────────────────────┬───────────────────┤
│      │                │                          │                   │
│ Act- │  Left Panel    │   Canvas Viewport        │   Right Dock      │
│ ivity│  (280px)       │   (flex-1)               │   (360px)         │
│ Bar  │                │                          │                   │
│(56px)│  - Pages       │  - Fabric.js Canvas      │  ┌─────────────┐ │
│      │  - Templates   │  - Zoom Controls         │  │ Chat│Insp│...│ │
│      │  - Layers      │  - Grid/Guidelines       │  ├─────────────┤ │
│      │                │                          │  │             │ │
│      │                │                          │  │   Content   │ │
│      │                │                          │  │             │ │
│      │                │                          │  └─────────────┘ │
└──────┴────────────────┴──────────────────────────┴───────────────────┘
```

### 2.2 뷰 모드

3가지 뷰 모드 지원:

1. **Studio View** (기본)
   - 좌/우 패널 모두 표시
   - 전체 편집 환경

2. **Canvas Focus**
   - 좌/우 패널 숨김
   - 캔버스만 전체 화면
   - 프레젠테이션 모드

3. **Chat Focus**
   - 우측 Dock 폭 확대 (50%)
   - 좌측 패널 최소화
   - AI와 대화 중심 작업

---

## 3. 폴더 구조

```
frontend/
├── app/
│   ├── studio/
│   │   └── page.tsx                    # Canvas Studio 엔트리 포인트
│   ├── page.tsx                        # 기존 v2.0 (유지)
│   └── layout.tsx
│
├── components/
│   ├── canvas-studio/                  # ✨ NEW: v3.0 전용 폴더
│   │   ├── index.ts                    # 공통 export
│   │   ├── CanvasStudioShell.tsx      # 최상위 컨테이너
│   │   │
│   │   ├── layout/                     # 레이아웃 컴포넌트
│   │   │   ├── StudioLayout.tsx       # 전체 레이아웃 셸
│   │   │   ├── ActivityBar.tsx        # 좌측 아이콘 바
│   │   │   ├── LeftPanel.tsx          # 좌측 패널 컨테이너
│   │   │   ├── LeftPanelHeader.tsx    # 패널 헤더
│   │   │   ├── LeftPanelPages.tsx     # 페이지 썸네일 리스트
│   │   │   ├── LeftPanelConceptBoard.tsx  # 컨셉보드용 패널
│   │   │   ├── CanvasViewport.tsx     # 중앙 캔버스 영역
│   │   │   ├── TopToolbar.tsx         # 상단 툴바
│   │   │   ├── ViewModeSwitcher.tsx   # 뷰모드 전환 버튼
│   │   │   ├── RightDock.tsx          # 우측 Dock 컨테이너
│   │   │   └── RightDockTabs.tsx      # Dock 탭 헤더
│   │   │
│   │   ├── right-dock/                 # 우측 Dock 탭 컴포넌트
│   │   │   ├── SparkChatTab.tsx       # Chat 탭
│   │   │   ├── InspectorTab.tsx       # Inspector 탭
│   │   │   ├── LayersTab.tsx          # Layers 탭
│   │   │   ├── DataTab.tsx            # Data 탭
│   │   │   └── BrandTab.tsx           # Brand Kit 탭
│   │   │
│   │   ├── modes/                      # 모드 관련
│   │   │   ├── modeConfig.ts          # 모드별 설정 정의
│   │   │   ├── ModeSwitchProvider.tsx # 모드 전환 Provider
│   │   │   ├── ConceptBoardMode.tsx   # 컨셉보드 모드
│   │   │   ├── PitchDeckMode.tsx      # 프리젠테이션 모드
│   │   │   └── ProductStoryMode.tsx   # 상품상세 모드
│   │   │
│   │   ├── canvas/                     # 캔버스 관련
│   │   │   ├── canvasEngine.ts        # Fabric.js 초기화/관리
│   │   │   ├── canvasCommands.ts      # 캔버스 조작 함수
│   │   │   ├── useCanvas.ts           # 캔버스 훅
│   │   │   └── types.ts               # 캔버스 타입
│   │   │
│   │   ├── stores/                     # Zustand Store
│   │   │   ├── useEditorStore.ts      # 에디터 전역 상태
│   │   │   ├── useLayoutStore.ts      # 레이아웃 상태 (패널 너비 등)
│   │   │   ├── useCanvasStore.ts      # 캔버스 상태 (줌, 팬 등)
│   │   │   ├── useTabsStore.ts        # 탭 상태
│   │   │   └── types.ts               # Store 타입
│   │   │
│   │   └── components/                 # 재사용 가능한 UI 컴포넌트
│   │       ├── PageThumbnail.tsx      # 페이지 썸네일
│   │       ├── ThumbnailList.tsx      # 썸네일 리스트
│   │       ├── IconButton.tsx         # 아이콘 버튼
│   │       ├── ResizablePanel.tsx     # 리사이즈 가능 패널
│   │       ├── SplitPane.tsx          # 분할 패널 (드래그 리사이즈)
│   │       ├── TabButton.tsx          # 탭 버튼
│   │       └── EmptyState.tsx         # 빈 상태 UI
│   │
│   ├── Chat/                           # 기존 v2.0 (유지)
│   ├── Editor/                         # 기존 v2.0 (유지)
│   ├── Layout/                         # 기존 v2.0 (유지)
│   └── Auth/                           # 기존 v2.0 (유지)
│
└── hooks/
    ├── useKeyboardShortcuts.ts         # ✨ NEW: 단축키 훅
    ├── useMediaQuery.ts                # ✨ NEW: 반응형 훅
    └── useResizeObserver.ts            # ✨ NEW: 리사이즈 감지 훅
```

---

## 4. 핵심 컴포넌트

### 4.1 컴포넌트 분류

| 분류 | 컴포넌트 | 설명 |
|------|----------|------|
| **Shell** | `CanvasStudioShell` | 최상위 컨테이너, Provider 래핑 |
| **Layout** | `StudioLayout` | 전체 레이아웃 (4분할) |
| | `ActivityBar` | 좌측 아이콘 바 (56px) |
| | `LeftPanel` | 좌측 패널 (280px, 리사이즈 가능) |
| | `CanvasViewport` | 중앙 캔버스 영역 |
| | `RightDock` | 우측 Dock (360px, 리사이즈 가능) |
| | `TopToolbar` | 상단 툴바 (전역) |
| **Right Dock Tabs** | `SparkChatTab` | AI 대화 탭 |
| | `InspectorTab` | 속성 편집 탭 |
| | `LayersTab` | 레이어 트리 탭 |
| | `DataTab` | 데이터 소스 탭 |
| | `BrandTab` | 브랜드 킷 탭 |
| **Modes** | `ConceptBoardMode` | 컨셉보드 모드 |
| | `PitchDeckMode` | 프리젠테이션 모드 |
| | `ProductStoryMode` | 상품상세 모드 |
| **UI Components** | `PageThumbnail` | 페이지 썸네일 |
| | `ResizablePanel` | 리사이즈 가능 패널 |
| | `IconButton` | 아이콘 버튼 |

---

## 5. 컴포넌트 계층 구조

```
CanvasStudioShell
└── EditorStoreProvider
    └── LayoutStoreProvider
        └── CanvasStoreProvider
            └── TabsStoreProvider
                └── ModeSwitchProvider
                    └── StudioLayout
                        ├── TopToolbar
                        │   ├── ViewModeSwitcher
                        │   └── DocumentTitle
                        └── div (flex container)
                            ├── ActivityBar
                            │   └── ActivityBarButton × 5
                            ├── LeftPanel
                            │   ├── LeftPanelHeader
                            │   └── (mode에 따라)
                            │       ├── LeftPanelPages
                            │       │   └── PageThumbnail × N
                            │       └── LeftPanelConceptBoard
                            ├── CanvasViewport
                            │   ├── canvas (Fabric.js)
                            │   └── ZoomControls
                            └── RightDock
                                ├── RightDockTabs
                                │   └── TabButton × 5
                                └── (activeTab에 따라)
                                    ├── SparkChatTab
                                    ├── InspectorTab
                                    ├── LayersTab
                                    ├── DataTab
                                    └── BrandTab
```

---

## 6. 컴포넌트 상세 설계

### 6.1 `CanvasStudioShell.tsx`

**역할**:
- 최상위 컨테이너
- 모든 Provider 래핑
- 전역 상태 초기화

**구조**:
```tsx
EditorStoreProvider
  LayoutStoreProvider
    CanvasStoreProvider
      TabsStoreProvider
        ModeSwitchProvider
          StudioLayout
```

**주요 기능**:
- Zustand Store 초기화
- Mode 초기화 (기본: Concept Board)
- 전역 키보드 단축키 등록

---

### 6.2 `StudioLayout.tsx`

**역할**:
- 4분할 레이아웃 구성
- 뷰 모드에 따른 레이아웃 변경

**레이아웃 구조**:
```
TopToolbar (h-12)
├── ActivityBar (w-14)
├── LeftPanel (w-[280px], resizable)
├── CanvasViewport (flex-1)
└── RightDock (w-[360px], resizable)
```

**뷰 모드별 동작**:
- **Studio View**: 모든 패널 표시
- **Canvas Focus**: LeftPanel, RightDock 숨김 (collapsed)
- **Chat Focus**: LeftPanel 최소화 (w-12), RightDock 확대 (w-[50%])

---

### 6.3 `ActivityBar.tsx`

**역할**:
- 작업 모드 전환 (Concept Board, Pitch Deck, Product Story 등)
- VSCode 스타일 아이콘 바

**구조**:
```tsx
<nav className="w-14 bg-neutral-950 text-white">
  {ACTIVITIES.map(activity => (
    <button onClick={() => switchMode(activity.id)}>
      {activity.icon}
    </button>
  ))}
</nav>
```

**활동 목록** (P0):
1. Brand DNA
2. Concept Board ⭐ (우선 구현)
3. Product Story
4. Pitch Deck ⭐ (우선 구현)
5. Ad Studio

---

### 6.4 `LeftPanel.tsx`

**역할**:
- 모드에 따라 다른 콘텐츠 표시
- 접기/펼치기 지원
- 폭 리사이즈 지원 (280px ~ 500px)

**모드별 콘텐츠**:
| 모드 | 표시 내용 |
|------|-----------|
| Concept Board | `LeftPanelConceptBoard` (레이어/그룹) |
| Pitch Deck | `LeftPanelPages` (슬라이드 썸네일) |
| Product Story | `LeftPanelPages` (섹션 썸네일) |

**구조**:
```tsx
<aside className="w-[280px] border-r bg-neutral-50">
  <LeftPanelHeader />
  {mode === 'concept-board' ? (
    <LeftPanelConceptBoard />
  ) : (
    <LeftPanelPages />
  )}
</aside>
```

---

### 6.5 `CanvasViewport.tsx`

**역할**:
- Fabric.js 캔버스 렌더링
- 줌/팬 컨트롤
- 그리드/가이드라인 표시

**구조**:
```tsx
<div className="flex-1 relative bg-neutral-100">
  <canvas ref={canvasRef} />
  <ZoomControls />
  <GridOverlay />
</div>
```

**주요 기능**:
- Fabric.js Canvas 초기화
- 줌 인/아웃 (25% ~ 400%)
- 팬 (마우스 드래그)
- 그리드 토글 (10px, 50px)
- 가이드라인 (정렬선)

---

### 6.6 `RightDock.tsx`

**역할**:
- 5개 탭 표시 (Chat, Inspector, Layers, Data, Brand)
- 탭 전환
- 접기/펼치기 지원
- 폭 리사이즈 지원 (360px ~ 600px)

**탭 목록**:
1. **Spark Chat**: AI 대화
2. **Inspector**: 속성 편집
3. **Layers**: 레이어 트리
4. **Data**: 데이터 소스
5. **Brand**: 브랜드 킷

**구조**:
```tsx
<aside className="w-[360px] border-l bg-white">
  <RightDockTabs />
  <div className="flex-1 overflow-auto">
    {activeTab === 'chat' && <SparkChatTab />}
    {activeTab === 'inspector' && <InspectorTab />}
    {/* ... */}
  </div>
</aside>
```

---

### 6.7 Right Dock 탭 컴포넌트

#### 6.7.1 `SparkChatTab.tsx`

**역할**: AI와 대화하여 콘텐츠 생성/수정

**구조**:
```tsx
<div className="flex flex-col h-full">
  <ChatMessageList messages={messages} />
  <ChatInputBox onSend={handleSend} />
</div>
```

**주요 기능**:
- 메시지 히스토리 표시
- 입력창 (고정 하단)
- AI 응답 스트리밍
- 에디터 액션 실행 (텍스트 삽입, 레이아웃 변경 등)

---

#### 6.7.2 `InspectorTab.tsx`

**역할**: 선택된 객체 속성 편집

**오브젝트별 패널**:
- **Text**: 폰트, 크기, 색상, 정렬, 자간, 행간
- **Image**: 크기, 비율, 필터, 배경 제거, 그림자, 프레임
- **Shape**: 색상, 테두리, 투명도
- **Table**: 스타일, 데이터, 정렬
- **Chart**: 타입, 데이터, 축/범례

**구조**:
```tsx
{selectedObject?.type === 'text' && <TextInspector object={selectedObject} />}
{selectedObject?.type === 'image' && <ImageInspector object={selectedObject} />}
{/* ... */}
```

---

#### 6.7.3 `LayersTab.tsx`

**역할**: 페이지/보드의 모든 오브젝트를 트리 구조로 표시

**구조**:
```tsx
<div className="p-2">
  <LayerTree layers={layers} onSelect={handleSelect} />
</div>
```

**주요 기능**:
- 트리 구조 표시 (그룹/개별 객체)
- 잠금/숨김 토글
- 이름 변경
- 순서 변경 (드래그)

---

#### 6.7.4 `DataTab.tsx`

**역할**: 현재 문서에서 사용 중인 데이터 소스 관리

**데이터 소스 타입**:
- 표 데이터
- CSV 파일
- 외부 스프레드시트 링크
- JSON 데이터

**주요 기능**:
- 데이터 소스 리스트
- 새 데이터 추가
- 데이터 편집
- "이 데이터로 그래프 만들기" 버튼

---

#### 6.7.5 `BrandTab.tsx`

**역할**: 브랜드 킷 에셋 관리 및 사용

**브랜드 에셋**:
- 로고
- 색상 팔레트
- 폰트
- 버튼 스타일
- 컴포넌트 (헤더, 푸터 등)

**주요 기능**:
- 에셋 드래그 & 드롭으로 캔버스에 삽입
- "문서 전체에 브랜드 스타일 적용" 버튼
- 브랜드 색상 팔레트 표시

---

## 7. Props 인터페이스

### 7.1 `StudioLayout`

```typescript
interface StudioLayoutProps {
  // Props 없음 (전역 상태 사용)
}
```

### 7.2 `ActivityBar`

```typescript
interface Activity {
  id: string;
  label: string;
  icon: React.ReactNode;
  enabled: boolean;
}

interface ActivityBarProps {
  activities: Activity[];
  currentActivity: string;
  onActivityChange: (activityId: string) => void;
}
```

### 7.3 `LeftPanel`

```typescript
interface LeftPanelProps {
  mode: 'concept-board' | 'pitch-deck' | 'product-story';
  isCollapsed: boolean;
  width: number;
  onWidthChange: (width: number) => void;
  onToggleCollapse: () => void;
}
```

### 7.4 `PageThumbnail`

```typescript
interface PageThumbnailProps {
  page: {
    id: string;
    title: string;
    thumbnailUrl?: string;
    order: number;
  };
  isSelected: boolean;
  onSelect: (pageId: string) => void;
  onDuplicate: (pageId: string) => void;
  onDelete: (pageId: string) => void;
}
```

### 7.5 `RightDock`

```typescript
interface RightDockTab {
  id: 'chat' | 'inspector' | 'layers' | 'data' | 'brand';
  label: string;
  icon: React.ReactNode;
}

interface RightDockProps {
  activeTab: RightDockTab['id'];
  onTabChange: (tabId: RightDockTab['id']) => void;
  isCollapsed: boolean;
  width: number;
  onWidthChange: (width: number) => void;
  onToggleCollapse: () => void;
}
```

### 7.6 `ResizablePanel`

```typescript
interface ResizablePanelProps {
  direction: 'horizontal' | 'vertical';
  minSize: number;
  maxSize: number;
  defaultSize: number;
  onResize: (size: number) => void;
  children: React.ReactNode;
}
```

---

## 8. 구현 순서

### Phase 1: 레이아웃 기반 (1-2일)

**목표**: VSCode 스타일 레이아웃 구조 완성

1. ✅ 폴더 구조 생성 (`components/canvas-studio/`)
2. ✅ `CanvasStudioShell.tsx` - 최상위 컨테이너
3. ✅ `StudioLayout.tsx` - 전체 레이아웃
4. ✅ `ActivityBar.tsx` - 좌측 아이콘 바
5. ✅ `LeftPanel.tsx` - 좌측 패널 (빈 컨테이너)
6. ✅ `CanvasViewport.tsx` - 중앙 캔버스 (빈 div)
7. ✅ `RightDock.tsx` - 우측 Dock (빈 컨테이너)
8. ✅ `TopToolbar.tsx` - 상단 툴바
9. ✅ 기본 스타일링 (Tailwind CSS)

**검증**:
- `/studio` 페이지 접속 시 4분할 레이아웃 표시
- 각 영역이 올바른 크기로 렌더링

---

### Phase 2: 상태 관리 (1일)

**목표**: Zustand Store 구현

1. ✅ `useEditorStore.ts` - 에디터 전역 상태
2. ✅ `useLayoutStore.ts` - 레이아웃 상태 (패널 너비, 접기/펼치기)
3. ✅ `useCanvasStore.ts` - 캔버스 상태 (줌, 팬, 선택 객체)
4. ✅ `useTabsStore.ts` - 탭 상태
5. ✅ Store 타입 정의
6. ✅ Provider 구현

**검증**:
- 패널 접기/펼치기 동작
- 탭 전환 동작
- 상태가 올바르게 저장/복원

---

### Phase 3: 캔버스 구현 (2일)

**목표**: Fabric.js 캔버스 기본 기능

1. ✅ Fabric.js 초기화
2. ✅ 캔버스 렌더링
3. ✅ 줌/팬 컨트롤
4. ✅ 그리드 표시
5. ✅ 객체 선택/이동/크기조절
6. ✅ 텍스트 추가/편집

**검증**:
- 캔버스가 정상 렌더링
- 줌 인/아웃 동작
- 객체 조작 가능

---

### Phase 4: Right Dock 탭 구현 (2-3일)

**목표**: 5개 탭 기본 UI 구현

1. ✅ `SparkChatTab.tsx` - Chat 기본 UI
2. ✅ `InspectorTab.tsx` - Inspector 기본 UI
3. ✅ `LayersTab.tsx` - Layers 트리 UI
4. ✅ `DataTab.tsx` - 빈 상태 UI
5. ✅ `BrandTab.tsx` - 빈 상태 UI
6. ✅ 탭 전환 동작

**검증**:
- 모든 탭이 표시
- 탭 전환 시 컨텐츠 변경

---

### Phase 5: 모드 시스템 (1-2일)

**목표**: Concept Board, Pitch Deck, Product Story 모드 구현

1. ✅ `modeConfig.ts` - 모드 설정 정의
2. ✅ `ConceptBoardMode.tsx`
3. ✅ `PitchDeckMode.tsx`
4. ✅ `ProductStoryMode.tsx`
5. ✅ 모드 전환 로직
6. ✅ 모드별 UI 차이 적용

**검증**:
- Activity Bar에서 모드 전환
- 모드별로 Left Panel 컨텐츠 변경

---

### Phase 6: 페이지 관리 (1-2일)

**목표**: 다중 페이지 지원

1. ✅ `PageThumbnail.tsx` - 썸네일 컴포넌트
2. ✅ `ThumbnailList.tsx` - 썸네일 리스트
3. ✅ `LeftPanelPages.tsx` - 페이지 패널
4. ✅ 페이지 추가/삭제/복제
5. ✅ 페이지 순서 변경 (드래그)
6. ✅ 페이지 선택 시 캔버스 업데이트

**검증**:
- 여러 페이지 생성 가능
- 페이지 썸네일 표시
- 페이지 전환 동작

---

### Phase 7: 리사이즈 기능 (1일)

**목표**: 패널 리사이즈 지원

1. ✅ `ResizablePanel.tsx` - 리사이즈 컴포넌트
2. ✅ `SplitPane.tsx` - 분할 패널
3. ✅ Left Panel 리사이즈
4. ✅ Right Dock 리사이즈
5. ✅ 최소/최대 크기 제한

**검증**:
- 패널 경계 드래그로 크기 조절
- 최소/최대 크기 제한 동작

---

### Phase 8: 통합 & 테스트 (1-2일)

**목표**: 전체 기능 통합 및 테스트

1. ✅ 전체 플로우 테스트
2. ✅ 버그 수정
3. ✅ 성능 최적화
4. ✅ A11y 개선
5. ✅ 문서 작성

---

## 📊 총 예상 기간

- **Phase 1-2**: 2-3일 (레이아웃 + 상태관리)
- **Phase 3-4**: 4-5일 (캔버스 + Dock 탭)
- **Phase 5-6**: 2-4일 (모드 + 페이지 관리)
- **Phase 7-8**: 2-3일 (리사이즈 + 통합)

**총 예상 기간**: **10-15일**

---

## ✅ 다음 단계

1. ✅ 이 문서 검토 및 승인
2. ⏳ Phase 1 구현 시작
3. ⏳ 레이아웃 스펙 문서 작성
4. ⏳ Zustand Store 설계

---

**작성 완료**: 2025-11-16
**검토자**: -
**승인자**: -
**상태**: ✅ 설계 완료, 구현 준비 완료
