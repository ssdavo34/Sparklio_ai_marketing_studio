# Sparklio Canvas Studio v3.0 - State Management (Zustand)

**작성일**: 2025-11-16
**작성자**: C팀 (Frontend Team)
**버전**: v3.0
**상태**: 설계 완료

---

## 📋 목차

1. [개요](#1-개요)
2. [Store 구조](#2-store-구조)
3. [Store 상세 설계](#3-store-상세-설계)
4. [Store 간 상호작용](#4-store-간-상호작용)
5. [사용 예시](#5-사용-예시)
6. [Best Practices](#6-best-practices)

---

## 1. 개요

### 1.1 상태 관리 전략

Canvas Studio v3.0은 **Zustand**를 사용하여 전역 상태를 관리합니다.

**Zustand 선택 이유**:
- ✅ 간단한 API (Redux보다 훨씬 적은 보일러플레이트)
- ✅ TypeScript 완벽 지원
- ✅ React Hooks 기반
- ✅ 작은 번들 크기 (~1KB)
- ✅ 미들웨어 지원 (persist, devtools 등)

### 1.2 Store 분리 원칙

Canvas Studio의 상태는 **4개의 독립적인 Store**로 분리합니다:

1. **`useEditorStore`**: 에디터 전역 상태 (모드, 문서, 선택 객체 등)
2. **`useLayoutStore`**: 레이아웃 상태 (패널 너비, 접기/펼치기 등)
3. **`useCanvasStore`**: 캔버스 상태 (줌, 팬, 그리드 등)
4. **`useTabsStore`**: 탭 상태 (Right Dock 활성 탭)

**분리 이유**:
- 관심사 분리 (Separation of Concerns)
- 리렌더링 최적화 (변경된 Store만 리렌더링)
- 코드 가독성 향상
- 테스트 용이성

---

## 2. Store 구조

### 2.1 폴더 구조

```
components/canvas-studio/stores/
├── useEditorStore.ts      # 에디터 전역 상태
├── useLayoutStore.ts      # 레이아웃 상태
├── useCanvasStore.ts      # 캔버스 상태
├── useTabsStore.ts        # 탭 상태
├── types.ts               # 공통 타입
└── index.ts               # 공통 export
```

### 2.2 Store 의존성

```
useEditorStore (최상위, 다른 Store와 독립)
  ↓
useLayoutStore (Layout 관련 상태만)
  ↓
useCanvasStore (Canvas 관련 상태만)
  ↓
useTabsStore (Tabs 관련 상태만)
```

**원칙**:
- Store 간 순환 의존성 금지
- 필요 시 `useEditorStore`에서 중재 (Mediator Pattern)

---

## 3. Store 상세 설계

### 3.1 `useEditorStore.ts`

**역할**: 에디터 전역 상태 (모드, 문서, 선택 객체, 히스토리 등)

**상태**:

```typescript
// components/canvas-studio/stores/useEditorStore.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

export type StudioMode =
  | 'concept-board'
  | 'pitch-deck'
  | 'product-story'
  | 'brand-dna'
  | 'ad-studio';

export type ViewMode = 'studio' | 'canvas-focus' | 'chat-focus';

export interface CanvasObject {
  id: string;
  type: 'text' | 'image' | 'shape' | 'table' | 'chart';
  fabricObject?: fabric.Object; // Fabric.js 객체 참조
  props: Record<string, any>;
}

export interface Page {
  id: string;
  title: string;
  order: number;
  thumbnailUrl?: string;
  objects: CanvasObject[];
  canvasJson?: string; // Fabric.js JSON
}

export interface Document {
  id: string;
  title: string;
  mode: StudioMode;
  pages: Page[];
  currentPageId: string;
  brandId?: string;
  metadata: {
    createdAt: string;
    updatedAt: string;
    author: string;
  };
}

export interface EditorState {
  // Document
  document: Document | null;
  isSaved: boolean;
  isSaving: boolean;

  // Mode
  currentMode: StudioMode;
  viewMode: ViewMode;

  // Selection
  selectedObjectIds: string[];
  selectedPageId: string | null;

  // History (Undo/Redo)
  historyStack: any[];
  historyIndex: number;
  canUndo: boolean;
  canRedo: boolean;

  // Actions
  setDocument: (document: Document) => void;
  setCurrentMode: (mode: StudioMode) => void;
  setViewMode: (mode: ViewMode) => void;
  selectObjects: (objectIds: string[]) => void;
  selectPage: (pageId: string) => void;

  // Document Actions
  addPage: (page: Partial<Page>) => void;
  updatePage: (pageId: string, updates: Partial<Page>) => void;
  deletePage: (pageId: string) => void;
  duplicatePage: (pageId: string) => void;
  reorderPages: (fromIndex: number, toIndex: number) => void;

  // Object Actions
  addObject: (pageId: string, object: CanvasObject) => void;
  updateObject: (objectId: string, updates: Partial<CanvasObject>) => void;
  deleteObject: (objectId: string) => void;

  // History Actions
  pushHistory: (action: any) => void;
  undo: () => void;
  redo: () => void;

  // Save Actions
  saveDocument: () => Promise<void>;
  autoSave: () => Promise<void>;
}

export const useEditorStore = create<EditorState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial State
        document: null,
        isSaved: true,
        isSaving: false,
        currentMode: 'concept-board',
        viewMode: 'studio',
        selectedObjectIds: [],
        selectedPageId: null,
        historyStack: [],
        historyIndex: -1,
        canUndo: false,
        canRedo: false,

        // Actions
        setDocument: (document) => set({ document }),
        setCurrentMode: (mode) => set({ currentMode: mode }),
        setViewMode: (mode) => set({ viewMode: mode }),
        selectObjects: (objectIds) => set({ selectedObjectIds: objectIds }),
        selectPage: (pageId) => set({ selectedPageId: pageId }),

        // Document Actions
        addPage: (page) => {
          const doc = get().document;
          if (!doc) return;

          const newPage: Page = {
            id: page.id || `page-${Date.now()}`,
            title: page.title || 'Untitled Page',
            order: page.order ?? doc.pages.length,
            objects: [],
            ...page,
          };

          set({
            document: {
              ...doc,
              pages: [...doc.pages, newPage].sort((a, b) => a.order - b.order),
            },
            isSaved: false,
          });
        },

        updatePage: (pageId, updates) => {
          const doc = get().document;
          if (!doc) return;

          set({
            document: {
              ...doc,
              pages: doc.pages.map((page) =>
                page.id === pageId ? { ...page, ...updates } : page
              ),
            },
            isSaved: false,
          });
        },

        deletePage: (pageId) => {
          const doc = get().document;
          if (!doc) return;

          set({
            document: {
              ...doc,
              pages: doc.pages.filter((page) => page.id !== pageId),
            },
            isSaved: false,
          });
        },

        duplicatePage: (pageId) => {
          const doc = get().document;
          if (!doc) return;

          const pageToDuplicate = doc.pages.find((p) => p.id === pageId);
          if (!pageToDuplicate) return;

          const newPage: Page = {
            ...pageToDuplicate,
            id: `page-${Date.now()}`,
            title: `${pageToDuplicate.title} (Copy)`,
            order: pageToDuplicate.order + 0.5,
          };

          set({
            document: {
              ...doc,
              pages: [...doc.pages, newPage].sort((a, b) => a.order - b.order),
            },
            isSaved: false,
          });
        },

        reorderPages: (fromIndex, toIndex) => {
          const doc = get().document;
          if (!doc) return;

          const pages = [...doc.pages];
          const [movedPage] = pages.splice(fromIndex, 1);
          pages.splice(toIndex, 0, movedPage);

          // Update order
          pages.forEach((page, index) => {
            page.order = index;
          });

          set({ document: { ...doc, pages }, isSaved: false });
        },

        // Object Actions
        addObject: (pageId, object) => {
          const doc = get().document;
          if (!doc) return;

          set({
            document: {
              ...doc,
              pages: doc.pages.map((page) =>
                page.id === pageId
                  ? { ...page, objects: [...page.objects, object] }
                  : page
              ),
            },
            isSaved: false,
          });
        },

        updateObject: (objectId, updates) => {
          const doc = get().document;
          if (!doc) return;

          set({
            document: {
              ...doc,
              pages: doc.pages.map((page) => ({
                ...page,
                objects: page.objects.map((obj) =>
                  obj.id === objectId ? { ...obj, ...updates } : obj
                ),
              })),
            },
            isSaved: false,
          });
        },

        deleteObject: (objectId) => {
          const doc = get().document;
          if (!doc) return;

          set({
            document: {
              ...doc,
              pages: doc.pages.map((page) => ({
                ...page,
                objects: page.objects.filter((obj) => obj.id !== objectId),
              })),
            },
            isSaved: false,
          });
        },

        // History Actions
        pushHistory: (action) => {
          const { historyStack, historyIndex } = get();

          const newStack = historyStack.slice(0, historyIndex + 1);
          newStack.push(action);

          set({
            historyStack: newStack,
            historyIndex: newStack.length - 1,
            canUndo: true,
            canRedo: false,
          });
        },

        undo: () => {
          const { historyIndex, historyStack } = get();
          if (historyIndex < 0) return;

          const newIndex = historyIndex - 1;
          set({
            historyIndex: newIndex,
            canUndo: newIndex >= 0,
            canRedo: true,
          });

          // Apply undo action
          // TODO: Implement undo logic
        },

        redo: () => {
          const { historyIndex, historyStack } = get();
          if (historyIndex >= historyStack.length - 1) return;

          const newIndex = historyIndex + 1;
          set({
            historyIndex: newIndex,
            canUndo: true,
            canRedo: newIndex < historyStack.length - 1,
          });

          // Apply redo action
          // TODO: Implement redo logic
        },

        // Save Actions
        saveDocument: async () => {
          set({ isSaving: true });

          try {
            // TODO: Call API to save document
            await new Promise((resolve) => setTimeout(resolve, 1000));

            set({ isSaved: true, isSaving: false });
          } catch (error) {
            console.error('Failed to save document:', error);
            set({ isSaving: false });
          }
        },

        autoSave: async () => {
          const { isSaved, isSaving } = get();
          if (isSaved || isSaving) return;

          await get().saveDocument();
        },
      }),
      {
        name: 'canvas-studio-editor',
        partialize: (state) => ({
          document: state.document,
          currentMode: state.currentMode,
          viewMode: state.viewMode,
        }),
      }
    )
  )
);
```

---

### 3.2 `useLayoutStore.ts`

**역할**: 레이아웃 상태 (패널 너비, 접기/펼치기 등)

**상태**:

```typescript
// components/canvas-studio/stores/useLayoutStore.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

export interface LayoutState {
  // Left Panel
  leftPanelWidth: number;
  isLeftPanelCollapsed: boolean;
  leftPanelMinWidth: number;
  leftPanelMaxWidth: number;

  // Right Dock
  rightDockWidth: number;
  isRightDockCollapsed: boolean;
  rightDockMinWidth: number;
  rightDockMaxWidth: number;

  // Activity Bar
  activityBarWidth: number; // 고정 56px

  // Actions
  setLeftPanelWidth: (width: number) => void;
  toggleLeftPanel: () => void;
  setRightDockWidth: (width: number) => void;
  toggleRightDock: () => void;
  resetLayout: () => void;
}

const DEFAULT_LEFT_PANEL_WIDTH = 280;
const DEFAULT_RIGHT_DOCK_WIDTH = 360;

export const useLayoutStore = create<LayoutState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial State
        leftPanelWidth: DEFAULT_LEFT_PANEL_WIDTH,
        isLeftPanelCollapsed: false,
        leftPanelMinWidth: 200,
        leftPanelMaxWidth: 500,

        rightDockWidth: DEFAULT_RIGHT_DOCK_WIDTH,
        isRightDockCollapsed: false,
        rightDockMinWidth: 300,
        rightDockMaxWidth: 600,

        activityBarWidth: 56,

        // Actions
        setLeftPanelWidth: (width) => {
          const { leftPanelMinWidth, leftPanelMaxWidth } = get();
          const clampedWidth = Math.max(
            leftPanelMinWidth,
            Math.min(width, leftPanelMaxWidth)
          );
          set({ leftPanelWidth: clampedWidth });
        },

        toggleLeftPanel: () => {
          set((state) => ({ isLeftPanelCollapsed: !state.isLeftPanelCollapsed }));
        },

        setRightDockWidth: (width) => {
          const { rightDockMinWidth, rightDockMaxWidth } = get();
          const clampedWidth = Math.max(
            rightDockMinWidth,
            Math.min(width, rightDockMaxWidth)
          );
          set({ rightDockWidth: clampedWidth });
        },

        toggleRightDock: () => {
          set((state) => ({ isRightDockCollapsed: !state.isRightDockCollapsed }));
        },

        resetLayout: () => {
          set({
            leftPanelWidth: DEFAULT_LEFT_PANEL_WIDTH,
            isLeftPanelCollapsed: false,
            rightDockWidth: DEFAULT_RIGHT_DOCK_WIDTH,
            isRightDockCollapsed: false,
          });
        },
      }),
      {
        name: 'canvas-studio-layout',
      }
    )
  )
);
```

---

### 3.3 `useCanvasStore.ts`

**역할**: 캔버스 상태 (줌, 팬, 그리드 등)

**상태**:

```typescript
// components/canvas-studio/stores/useCanvasStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface CanvasState {
  // Zoom
  zoom: number;
  minZoom: number;
  maxZoom: number;

  // Pan
  panX: number;
  panY: number;

  // Grid
  showGrid: boolean;
  gridSize: number;

  // Guidelines
  showGuidelines: boolean;

  // Fabric.js Canvas Instance
  fabricCanvas: fabric.Canvas | null;

  // Actions
  setZoom: (zoom: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  zoomToFit: () => void;
  resetZoom: () => void;

  setPan: (x: number, y: number) => void;
  resetPan: () => void;

  toggleGrid: () => void;
  setGridSize: (size: number) => void;

  toggleGuidelines: () => void;

  setFabricCanvas: (canvas: fabric.Canvas) => void;
}

export const useCanvasStore = create<CanvasState>()(
  devtools((set, get) => ({
    // Initial State
    zoom: 1,
    minZoom: 0.25,
    maxZoom: 4,

    panX: 0,
    panY: 0,

    showGrid: false,
    gridSize: 10,

    showGuidelines: true,

    fabricCanvas: null,

    // Actions
    setZoom: (zoom) => {
      const { minZoom, maxZoom, fabricCanvas } = get();
      const clampedZoom = Math.max(minZoom, Math.min(zoom, maxZoom));

      set({ zoom: clampedZoom });

      if (fabricCanvas) {
        fabricCanvas.setZoom(clampedZoom);
        fabricCanvas.renderAll();
      }
    },

    zoomIn: () => {
      const { zoom } = get();
      get().setZoom(zoom + 0.1);
    },

    zoomOut: () => {
      const { zoom } = get();
      get().setZoom(zoom - 0.1);
    },

    zoomToFit: () => {
      const { fabricCanvas } = get();
      if (!fabricCanvas) return;

      // Calculate zoom to fit all objects
      const objects = fabricCanvas.getObjects();
      if (objects.length === 0) {
        get().resetZoom();
        return;
      }

      const group = new fabric.Group(objects);
      const zoom = Math.min(
        fabricCanvas.width! / group.width!,
        fabricCanvas.height! / group.height!
      ) * 0.9; // 90% to add padding

      get().setZoom(zoom);
    },

    resetZoom: () => {
      get().setZoom(1);
    },

    setPan: (x, y) => {
      set({ panX: x, panY: y });

      const { fabricCanvas } = get();
      if (fabricCanvas) {
        fabricCanvas.relativePan(new fabric.Point(x, y));
        fabricCanvas.renderAll();
      }
    },

    resetPan: () => {
      get().setPan(0, 0);
    },

    toggleGrid: () => {
      set((state) => ({ showGrid: !state.showGrid }));
    },

    setGridSize: (size) => {
      set({ gridSize: size });
    },

    toggleGuidelines: () => {
      set((state) => ({ showGuidelines: !state.showGuidelines }));
    },

    setFabricCanvas: (canvas) => {
      set({ fabricCanvas: canvas });
    },
  }))
);
```

---

### 3.4 `useTabsStore.ts`

**역할**: Right Dock 탭 상태

**상태**:

```typescript
// components/canvas-studio/stores/useTabsStore.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

export type RightDockTab = 'chat' | 'inspector' | 'layers' | 'data' | 'brand';

export interface TabsState {
  // Right Dock
  activeRightDockTab: RightDockTab;

  // Actions
  setActiveRightDockTab: (tab: RightDockTab) => void;
}

export const useTabsStore = create<TabsState>()(
  devtools(
    persist(
      (set) => ({
        // Initial State
        activeRightDockTab: 'chat',

        // Actions
        setActiveRightDockTab: (tab) => {
          set({ activeRightDockTab: tab });
        },
      }),
      {
        name: 'canvas-studio-tabs',
      }
    )
  )
);
```

---

## 4. Store 간 상호작용

### 4.1 View Mode 변경 시 Layout 자동 조정

```typescript
// useEditorStore.ts 내부
setViewMode: (mode) => {
  set({ viewMode: mode });

  // Layout Store 업데이트
  const layoutStore = useLayoutStore.getState();

  switch (mode) {
    case 'studio':
      layoutStore.setLeftPanelWidth(280);
      layoutStore.setRightDockWidth(360);
      if (layoutStore.isLeftPanelCollapsed) layoutStore.toggleLeftPanel();
      if (layoutStore.isRightDockCollapsed) layoutStore.toggleRightDock();
      break;

    case 'canvas-focus':
      if (!layoutStore.isLeftPanelCollapsed) layoutStore.toggleLeftPanel();
      if (!layoutStore.isRightDockCollapsed) layoutStore.toggleRightDock();
      break;

    case 'chat-focus':
      layoutStore.setLeftPanelWidth(48); // 최소화
      layoutStore.setRightDockWidth(window.innerWidth * 0.5); // 50%
      if (layoutStore.isLeftPanelCollapsed) layoutStore.toggleLeftPanel();
      if (layoutStore.isRightDockCollapsed) layoutStore.toggleRightDock();
      break;
  }
},
```

### 4.2 객체 선택 시 Inspector 탭 자동 전환

```typescript
// useEditorStore.ts 내부
selectObjects: (objectIds) => {
  set({ selectedObjectIds: objectIds });

  // 객체가 선택되면 Inspector 탭으로 자동 전환
  if (objectIds.length > 0) {
    const tabsStore = useTabsStore.getState();
    tabsStore.setActiveRightDockTab('inspector');
  }
},
```

---

## 5. 사용 예시

### 5.1 컴포넌트에서 Store 사용

```tsx
// components/canvas-studio/layout/LeftPanel.tsx
import { useLayoutStore } from '../stores/useLayoutStore';
import { useEditorStore } from '../stores/useEditorStore';

export function LeftPanel() {
  const leftPanelWidth = useLayoutStore((state) => state.leftPanelWidth);
  const isCollapsed = useLayoutStore((state) => state.isLeftPanelCollapsed);
  const currentMode = useEditorStore((state) => state.currentMode);

  if (isCollapsed) return null;

  return (
    <aside
      className="flex flex-col border-r bg-neutral-50"
      style={{ width: `${leftPanelWidth}px` }}
    >
      {currentMode === 'concept-board' ? (
        <LeftPanelConceptBoard />
      ) : (
        <LeftPanelPages />
      )}
    </aside>
  );
}
```

### 5.2 리사이즈 핸들러

```tsx
// components/canvas-studio/components/ResizablePanel.tsx
import { useLayoutStore } from '../stores/useLayoutStore';

export function LeftPanelResizeHandle() {
  const setLeftPanelWidth = useLayoutStore((state) => state.setLeftPanelWidth);

  const handleMouseDown = (e: React.MouseEvent) => {
    const startX = e.clientX;
    const startWidth = useLayoutStore.getState().leftPanelWidth;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      setLeftPanelWidth(startWidth + deltaX);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div
      className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-blue-500"
      onMouseDown={handleMouseDown}
    />
  );
}
```

### 5.3 Zoom Controls

```tsx
// components/canvas-studio/canvas/ZoomControls.tsx
import { useCanvasStore } from '../stores/useCanvasStore';

export function ZoomControls() {
  const zoom = useCanvasStore((state) => state.zoom);
  const zoomIn = useCanvasStore((state) => state.zoomIn);
  const zoomOut = useCanvasStore((state) => state.zoomOut);
  const resetZoom = useCanvasStore((state) => state.resetZoom);
  const zoomToFit = useCanvasStore((state) => state.zoomToFit);

  return (
    <div className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 shadow-md">
      <button onClick={zoomOut} className="text-neutral-600 hover:text-neutral-900">
        -
      </button>
      <button onClick={resetZoom} className="text-sm font-medium">
        {Math.round(zoom * 100)}%
      </button>
      <button onClick={zoomIn} className="text-neutral-600 hover:text-neutral-900">
        +
      </button>
      <button onClick={zoomToFit} className="text-xs text-neutral-600 hover:text-neutral-900">
        Fit
      </button>
    </div>
  );
}
```

---

## 6. Best Practices

### 6.1 선택적 구독 (Selective Subscription)

**나쁜 예** (전체 Store 구독):
```tsx
const store = useEditorStore(); // 모든 변경에 리렌더링
```

**좋은 예** (필요한 상태만 구독):
```tsx
const currentMode = useEditorStore((state) => state.currentMode);
const setCurrentMode = useEditorStore((state) => state.setCurrentMode);
```

### 6.2 Shallow Comparison

여러 상태를 동시에 사용할 때:

```tsx
import { shallow } from 'zustand/shallow';

const { zoom, panX, panY } = useCanvasStore(
  (state) => ({ zoom: state.zoom, panX: state.panX, panY: state.panY }),
  shallow
);
```

### 6.3 Store 외부에서 접근

컴포넌트 외부(예: 유틸 함수)에서 Store 접근:

```tsx
import { useEditorStore } from './stores/useEditorStore';

export function saveDocumentUtil() {
  const saveDocument = useEditorStore.getState().saveDocument;
  await saveDocument();
}
```

### 6.4 DevTools

개발 모드에서 Zustand DevTools 사용:

```tsx
import { devtools } from 'zustand/middleware';

export const useEditorStore = create<EditorState>()(
  devtools(
    (set, get) => ({
      // ... state and actions
    }),
    { name: 'EditorStore' } // DevTools 이름
  )
);
```

### 6.5 Persist

Local Storage에 상태 저장:

```tsx
import { persist } from 'zustand/middleware';

export const useLayoutStore = create<LayoutState>()(
  persist(
    (set, get) => ({
      // ... state and actions
    }),
    {
      name: 'canvas-studio-layout', // localStorage key
      partialize: (state) => ({ // 일부만 저장
        leftPanelWidth: state.leftPanelWidth,
        rightDockWidth: state.rightDockWidth,
      }),
    }
  )
);
```

---

## 📊 요약

### Store 역할

| Store | 역할 | 주요 상태 |
|-------|------|-----------|
| `useEditorStore` | 에디터 전역 상태 | 문서, 모드, 선택 객체, 히스토리 |
| `useLayoutStore` | 레이아웃 상태 | 패널 너비, 접기/펼치기 |
| `useCanvasStore` | 캔버스 상태 | 줌, 팬, 그리드, Fabric.js 인스턴스 |
| `useTabsStore` | 탭 상태 | 활성 탭 |

### 미들웨어

- ✅ `devtools`: Redux DevTools 연동 (개발 모드)
- ✅ `persist`: Local Storage 저장 (레이아웃, 탭 상태 등)

### 성능 최적화

- ✅ 선택적 구독 (Selective Subscription)
- ✅ Shallow Comparison
- ✅ Store 분리로 불필요한 리렌더링 방지

---

## ✅ 다음 단계

1. ✅ 이 문서 검토 및 승인
2. ⏳ Store 파일 생성 및 구현
3. ⏳ 컴포넌트에서 Store 사용 테스트

---

**작성 완료**: 2025-11-16
**검토자**: -
**승인자**: -
**상태**: ✅ 설계 완료
