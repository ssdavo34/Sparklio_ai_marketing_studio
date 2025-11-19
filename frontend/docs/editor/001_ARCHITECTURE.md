# Canvas Studio v3 — System Architecture

**관련 문서**: [000_MASTER_PLAN.md](./000_MASTER_PLAN.md)
**작성일**: 2025-11-19

---

## 📋 목차

1. [아키텍처 개요](#아키텍처-개요)
2. [폴더 구조](#폴더 구조)
3. [Headless Editor 패턴](#headless-editor-패턴)
4. [데이터 흐름](#데이터-흐름)
5. [레이아웃 시스템](#레이아웃-시스템)
6. [컴포넌트 계층](#컴포넌트-계층)

---

## 아키텍처 개요

### 핵심 설계 원칙

**1. Data-First, Headless Editor**
- 모든 상태는 EditorStore (Zustand)에만 존재
- Konva는 오직 렌더링과 사용자 인터랙션만 담당
- UI 컴포넌트는 EditorStore를 구독하여 업데이트

**2. 단방향 데이터 흐름**
```
User Action → Konva Event → EditorStore Update → React Re-render → Konva Sync
```

**3. 모듈화 & 확장성**
- 각 기능은 독립적인 모듈
- 새로운 객체 타입 추가 용이
- 플러그인 시스템 가능

---

## 폴더 구조

### 전체 구조

```
frontend/
├── app/
│   └── studio/
│       ├── layout.tsx              # Canvas Studio 전용 레이아웃 (Navigation/Footer 제외)
│       └── page.tsx                # Canvas Studio 진입점
│
├── components/
│   └── canvas-studio/
│           ├── types/
│           │   ├── document.ts     # EditorDocument, EditorPage, EditorObject
│           │   ├── design-tokens.ts # DesignTokens, BrandPreset
│           │   ├── commands.ts     # EditorCommand (AI 연동용)
│           │   └── store.ts        # EditorStore 타입
│           │
│           ├── store/
│           │   ├── editorStore.ts  # Zustand Store (메인)
│           │   ├── slices/
│           │   │   ├── documentSlice.ts    # 문서 관리
│           │   │   ├── selectionSlice.ts   # 선택 관리
│           │   │   ├── historySlice.ts     # Undo/Redo
│           │   │   ├── uiSlice.ts          # UI 상태
│           │   │   └── panelsSlice.ts      # 패널 상태
│           │   └── middleware/
│           │       ├── historyMiddleware.ts # 히스토리 저장 로직
│           │       └── autoSaveMiddleware.ts # 자동 저장
│           │
│           ├── core/
│           │   ├── CanvasEngine.ts  # Konva Stage/Layer 관리
│           │   ├── ObjectRenderer.ts # Object → Konva Node 변환
│           │   ├── EventHandler.ts   # Konva 이벤트 처리
│           │   ├── SelectionManager.ts # 선택 상태 관리
│           │   ├── TransformManager.ts # Transform 처리
│           │   ├── HistoryManager.ts   # Undo/Redo 관리
│           │   └── CommandExecutor.ts  # EditorCommand 실행
│           │
│           ├── components/
│           │   ├── EditorShell.tsx   # 최상위 레이아웃
│           │   ├── TopBar/
│           │   │   ├── TopBar.tsx
│           │   │   ├── DocumentInfo.tsx
│           │   │   ├── ZoomControls.tsx
│           │   │   └── ActionButtons.tsx
│           │   │
│           │   ├── ActivityBar/
│           │   │   ├── ActivityBar.tsx
│           │   │   └── ModeButton.tsx
│           │   │
│           │   ├── LeftPanel/
│           │   │   ├── LeftPanel.tsx
│           │   │   ├── PagesPanel.tsx
│           │   │   ├── AssetsPanel.tsx
│           │   │   └── TemplatesPanel.tsx
│           │   │
│           │   ├── Canvas/
│           │   │   ├── CanvasStage.tsx     # Konva Stage 래퍼
│           │   │   ├── GridOverlay.tsx     # 그리드 표시
│           │   │   ├── GuidesOverlay.tsx   # 가이드 표시
│           │   │   └── SelectionBox.tsx    # 다중 선택 영역
│           │   │
│           │   └── RightDock/
│           │       ├── RightDock.tsx
│           │       ├── tabs/
│           │       │   ├── InspectorTab/
│           │       │   │   ├── InspectorTab.tsx
│           │       │   │   ├── PositionSection.tsx
│           │       │   │   ├── SizeSection.tsx
│           │       │   │   ├── StyleSection.tsx
│           │       │   │   └── TextSection.tsx
│           │       │   │
│           │       │   ├── LayersTab/
│           │       │   │   ├── LayersTab.tsx
│           │       │   │   ├── LayerItem.tsx
│           │       │   │   └── LayerTree.tsx
│           │       │   │
│           │       │   ├── ChatTab/
│           │       │   │   ├── ChatTab.tsx
│           │       │   │   ├── MessageList.tsx
│           │       │   │   └── CommandInput.tsx
│           │       │   │
│           │       │   ├── BrandTab/
│           │       │   │   ├── BrandTab.tsx
│           │       │   │   ├── ColorPalette.tsx
│           │       │   │   └── TypographyPresets.tsx
│           │       │   │
│           │       │   └── DataTab/
│           │       │       ├── DataTab.tsx
│           │       │       └── DataBindings.tsx
│           │       │
│           │       └── PanelHeader.tsx
│           │
│           ├── features/
│           │   ├── alignment/        # 정렬/분배 도구
│           │   ├── snap/              # 스냅/가이드
│           │   ├── templates/         # 템플릿 시스템
│           │   ├── components/        # 컴포넌트 시스템
│           │   ├── export/            # Export 기능
│           │   └── meeting/           # Meeting AI 연동
│           │
│           ├── adapters/
│           │   ├── document-adapter.ts    # Backend ↔ EditorDocument
│           │   ├── generator-adapter.ts   # AI Generator ↔ Editor
│           │   └── meeting-adapter.ts     # Meeting AI ↔ Editor
│           │
│           ├── hooks/
│           │   ├── useEditor.ts           # EditorStore 편의 훅
│           │   ├── useSelection.ts        # 선택 관리 훅
│           │   ├── useHistory.ts          # Undo/Redo 훅
│           │   ├── useCanvasEngine.ts     # CanvasEngine 훅
│           │   └── useKeyboardShortcuts.ts # 키보드 단축키
│           │
│           ├── utils/
│           │   ├── geometry.ts            # 기하학 유틸
│           │   ├── transform.ts           # 변형 계산
│           │   ├── snap.ts                # 스냅 계산
│           │   └── export.ts              # Export 유틸
│           │
│           └── mock/
│               ├── sampleDocument.ts      # 테스트 문서
│               └── mockTemplates.ts       # 테스트 템플릿
│
└── docs/
    └── editor/                            # 이 문서가 위치한 곳
```

---

## Headless Editor 패턴

### 개념

**"렌더링 엔진(Konva)과 상태 관리(Zustand)를 완전히 분리"**

### 구조

```typescript
┌─────────────────────────────────────────────────────────┐
│                  EditorStore (Zustand)                  │
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   Document   │  │  Selection   │  │   History    │ │
│  │              │  │              │  │              │ │
│  │ - pages[]    │  │ - selectedIds│  │ - past[]     │ │
│  │ - objects[]  │  │ - hoveredId  │  │ - future[]   │ │
│  │ - tokens     │  │ - activeId   │  │ - maxHistory │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │      UI      │  │    Tools     │  │   Panels     │ │
│  │              │  │              │  │              │ │
│  │ - zoom       │  │ - activeTool │  │ - collapsed  │ │
│  │ - pan        │  │ - mode       │  │ - activeTab  │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
                        ↓↑ Subscribe
┌─────────────────────────────────────────────────────────┐
│              React Components (UI Layer)                │
│                                                         │
│  EditorShell → CanvasStage → Konva Stage              │
│             → LeftPanel → PagesPanel                   │
│             → RightDock → InspectorTab/LayersTab       │
└─────────────────────────────────────────────────────────┘
                        ↓↑
┌─────────────────────────────────────────────────────────┐
│              CanvasEngine (Rendering Layer)             │
│                                                         │
│  Konva Stage                                           │
│    └─ Layer                                            │
│         ├─ Text (from EditorStore.TextObject)         │
│         ├─ Image (from EditorStore.ImageObject)       │
│         └─ Shape (from EditorStore.ShapeObject)       │
│                                                         │
│  Events: click, drag, transform → EditorStore.update  │
└─────────────────────────────────────────────────────────┘
```

### 장점

1. **테스트 용이**: Store만 테스트하면 됨
2. **재사용성**: CanvasEngine을 다른 프로젝트에서도 사용 가능
3. **확장성**: 새로운 렌더러 추가 용이 (예: Three.js)
4. **디버깅**: 상태와 렌더링을 분리하여 디버깅 쉬움

---

## 데이터 흐름

### 1. 사용자 액션 → Store 업데이트

```typescript
// 예시: 객체 드래그
[User]
  ↓ 마우스 드래그
[Konva Node]
  ↓ dragend event
[CanvasEngine.handleDragEnd()]
  ↓
[EditorStore.updateObject(id, { x, y })]
  ↓ Zustand update
[EditorStore state 변경]
  ↓ React re-render
[CanvasStage 컴포넌트]
  ↓ useEffect
[CanvasEngine.syncNode(id)]
  ↓
[Konva Node 위치 업데이트]
```

### 2. AI/Chat → Command → Store

```typescript
// 예시: "제목 크기를 48px로 키워줘"
[User Chat Input]
  ↓
[Backend AI Agent]
  ↓ EditorCommand 생성
[{ type: 'UPDATE_STYLE', targetIds: ['text-1'], style: { fontSize: 48 } }]
  ↓
[CommandExecutor.execute()]
  ↓
[EditorStore.updateObject('text-1', { fontSize: 48 })]
  ↓
[React re-render → Konva update]
```

### 3. Backend → Document → Store

```typescript
// 예시: 문서 로드
[Backend API]
  ↓ GET /api/documents/{id}
[document-adapter.ts]
  ↓ API Document → EditorDocument 변환
[EditorStore.loadDocument(doc)]
  ↓
[EditorStore state 완전 교체]
  ↓
[CanvasStage 컴포넌트]
  ↓ useEffect (document 변경 감지)
[CanvasEngine.renderPage(page)]
  ↓
[Konva Stage 전체 재렌더링]
```

---

## 레이아웃 시스템

### Desktop Layout (1440px+)

```
┌────────────────────────────────────────────────────────────┐
│                        TopBar (h-14)                       │
├───┬────────────┬─────────────────────────┬─────────────────┤
│ A │            │                         │                 │
│ c │   Left     │       Canvas            │   Right Dock    │
│ t │   Panel    │    (Konva Stage)        │                 │
│ i │            │                         │   ┌─────────┐  │
│ v │   Pages    │                         │   │Inspector│  │
│ i │   Assets   │    [Document Canvas]    │   │Layers   │  │
│ t │   Templates│                         │   │Chat     │  │
│ y │            │                         │   │Brand    │  │
│   │            │                         │   │Data     │  │
│ B │            │                         │   └─────────┘  │
│ a │            │                         │                 │
│ r │   (w-64)   │      (flex-1)           │    (w-80)       │
│   │   256px    │                         │    320px        │
└───┴────────────┴─────────────────────────┴─────────────────┘
 48px

Total: [48px] + [256px] + [flex] + [320px] = 1440px+
```

### Responsive Behavior

**1440px+** (Full Layout):
- ActivityBar: 48px (항상 표시)
- LeftPanel: 256px (표시)
- Canvas: flex-1
- RightDock: 320px (표시)

**1024px ~ 1440px** (Medium):
- ActivityBar: 48px
- LeftPanel: 200px (축소) 또는 접힘
- Canvas: flex-1
- RightDock: 280px (축소) 또는 접힘

**768px ~ 1024px** (Tablet):
- ActivityBar: 48px
- LeftPanel: 접힘 (오버레이로 표시)
- Canvas: 전체
- RightDock: 접힘 (오버레이로 표시)

**< 768px** (Mobile):
- 에디터 사용 제한 또는 심플 모드

---

## 컴포넌트 계층

### Component Tree

```typescript
<EditorShell>                          // 최상위 레이아웃
  ├─ <TopBar>                          // 상단 바
  │   ├─ <DocumentInfo />              // 문서 정보
  │   ├─ <ZoomControls />              // 줌 컨트롤
  │   └─ <ActionButtons />             // Undo/Redo/Save
  │
  ├─ <MainContainer>                   // 메인 컨테이너
  │   ├─ <ActivityBar>                 // 좌측 모드 바
  │   │   └─ <ModeButton /> × 6        // 모드 버튼들
  │   │
  │   ├─ <LeftPanel>                   // 좌측 패널
  │   │   ├─ <PanelHeader />           // 패널 헤더
  │   │   ├─ <PagesPanel />            // 페이지 목록
  │   │   ├─ <AssetsPanel />           // 에셋 목록
  │   │   └─ <TemplatesPanel />        // 템플릿 목록
  │   │
  │   ├─ <CanvasContainer>             // 캔버스 컨테이너
  │   │   ├─ <CanvasStage />           // Konva Stage 래퍼
  │   │   │   └─ Konva.Stage           // Konva 실제 Stage
  │   │   │       └─ Konva.Layer
  │   │   │           ├─ Konva.Text
  │   │   │           ├─ Konva.Image
  │   │   │           └─ Konva.Rect
  │   │   │
  │   │   ├─ <GridOverlay />           // 그리드 오버레이
  │   │   ├─ <GuidesOverlay />         // 가이드 오버레이
  │   │   └─ <SelectionBox />          // 다중 선택 박스
  │   │
  │   └─ <RightDock>                   // 우측 독
  │       ├─ <TabBar />                // 탭 바
  │       │   ├─ Inspector
  │       │   ├─ Layers
  │       │   ├─ Chat
  │       │   ├─ Brand
  │       │   └─ Data
  │       │
  │       └─ <TabContent>              // 탭 컨텐츠
  │           ├─ <InspectorTab />
  │           │   ├─ <PositionSection />
  │           │   ├─ <SizeSection />
  │           │   └─ <StyleSection />
  │           │
  │           ├─ <LayersTab />
  │           │   └─ <LayerTree />
  │           │       └─ <LayerItem /> × N
  │           │
  │           ├─ <ChatTab />
  │           │   ├─ <MessageList />
  │           │   └─ <CommandInput />
  │           │
  │           ├─ <BrandTab />
  │           │   ├─ <ColorPalette />
  │           │   └─ <TypographyPresets />
  │           │
  │           └─ <DataTab />
  │               └─ <DataBindings />
  │
  └─ <KeyboardShortcuts />             // 키보드 단축키 핸들러
```

### State Flow

```typescript
// EditorStore를 사용하는 컴포넌트들
EditorShell:       document, activePageId
TopBar:            zoom, pan, canSave
LeftPanel:         pages[], selectedPageId
CanvasStage:       currentPage.objects[], selectedIds
InspectorTab:      selectedObjects[]
LayersTab:         currentPage.objects[], selectedIds
```

---

## 다음 문서

- [002_DATA_MODEL.md](./002_DATA_MODEL.md) - 데이터 모델 상세
- [003_COMPONENT_SPEC.md](./003_COMPONENT_SPEC.md) - 컴포넌트 설계

---

**문서 버전**: v3.0.0
**마지막 업데이트**: 2025-11-19
