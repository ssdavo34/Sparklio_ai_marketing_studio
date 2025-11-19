/**
 * Sparklio Editor Store (Zustand + Immer)
 *
 * 데이터 우선 설계 (Data-First Design):
 * - 이 Store가 "진짜" 데이터 (Single Source of Truth)
 * - Konva는 이 데이터를 "렌더링만" 함
 * - 모든 편집 작업은 Store를 통해서만 수행
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { v4 as uuidv4 } from 'uuid';
import type {
  EditorDocument,
  EditorObject,
  EditorPage,
  Position,
} from '../types/document';
import type { EditorStore, EditorTool, RightPanelTab } from '../types/store';

// ========================================
// Initial State
// ========================================

const INITIAL_STATE = {
  // Document
  document: null,
  activePageId: null,

  // Selection
  selectedIds: [],
  hoveredId: null,

  // Clipboard
  clipboard: null,

  // Canvas View
  zoom: 1.0,
  pan: { x: 0, y: 0 },
  canvasSize: { width: 1080, height: 1350 },

  // UI
  tool: 'select' as EditorTool,
  showGrid: false,
  snapToGrid: true,
  showRulers: true,
  showGuides: true,

  // History
  history: {
    past: [],
    future: [],
    maxHistory: 50,
  },

  // Panels
  panels: {
    leftPanelOpen: true,
    rightPanelOpen: true,
    rightPanelTab: 'inspector' as RightPanelTab,
  },
};

// ========================================
// Store Implementation
// ========================================

export const useEditorStore = create<EditorStore>()(
  immer((set, get) => ({
    ...INITIAL_STATE,

    // ========================================
    // Document Actions
    // ========================================

    loadDocument: (doc) =>
      set((draft) => {
        draft.document = doc;
        draft.activePageId = doc.pages[0]?.id || null;
        draft.selectedIds = [];
        draft.history.past = [];
        draft.history.future = [];
      }),

    clearDocument: () =>
      set((draft) => {
        draft.document = null;
        draft.activePageId = null;
        draft.selectedIds = [];
        draft.history.past = [];
        draft.history.future = [];
      }),

    updateDocumentMetadata: (updates) =>
      set((draft) => {
        if (draft.document) {
          Object.assign(draft.document, updates);
          draft.document.updatedAt = new Date().toISOString();
        }
      }),

    // ========================================
    // Page Actions
    // ========================================

    setActivePage: (pageId) =>
      set((draft) => {
        draft.activePageId = pageId;
        draft.selectedIds = []; // 페이지 전환 시 선택 해제
      }),

    addPage: (page) =>
      set((draft) => {
        if (draft.document) {
          draft.document.pages.push(page);
          get().saveHistory();
        }
      }),

    removePage: (pageId) =>
      set((draft) => {
        if (draft.document) {
          draft.document.pages = draft.document.pages.filter(
            (p) => p.id !== pageId
          );
          // 활성 페이지가 삭제된 경우 첫 페이지로 전환
          if (draft.activePageId === pageId) {
            draft.activePageId = draft.document.pages[0]?.id || null;
          }
          get().saveHistory();
        }
      }),

    reorderPages: (pageIds) =>
      set((draft) => {
        if (draft.document) {
          const pageMap = new Map(draft.document.pages.map((p) => [p.id, p]));
          draft.document.pages = pageIds
            .map((id) => pageMap.get(id))
            .filter(Boolean) as EditorPage[];
          get().saveHistory();
        }
      }),

    // ========================================
    // Object Actions
    // ========================================

    addObject: (pageId, obj) =>
      set((draft) => {
        if (!draft.document) return;
        const page = draft.document.pages.find((p) => p.id === pageId);
        if (page) {
          page.objects.push(obj);
          get().saveHistory();
        }
      }),

    updateObject: (id, updates) =>
      set((draft) => {
        if (!draft.document) return;
        const page = draft.document.pages.find((p) => p.id === draft.activePageId);
        if (!page) return;

        const obj = page.objects.find((o) => o.id === id);
        if (obj) {
          Object.assign(obj, updates);
          // saveHistory는 드래그 끝날 때만 호출 (성능 최적화)
        }
      }),

    removeObject: (id) =>
      set((draft) => {
        if (!draft.document) return;
        const page = draft.document.pages.find((p) => p.id === draft.activePageId);
        if (page) {
          page.objects = page.objects.filter((o) => o.id !== id);
          draft.selectedIds = draft.selectedIds.filter((sid) => sid !== id);
          get().saveHistory();
        }
      }),

    removeObjects: (ids) =>
      set((draft) => {
        if (!draft.document) return;
        const page = draft.document.pages.find((p) => p.id === draft.activePageId);
        if (page) {
          page.objects = page.objects.filter((o) => !ids.includes(o.id));
          draft.selectedIds = draft.selectedIds.filter((sid) => !ids.includes(sid));
          get().saveHistory();
        }
      }),

    duplicateObject: (id) =>
      set((draft) => {
        if (!draft.document) return;
        const page = draft.document.pages.find((p) => p.id === draft.activePageId);
        if (!page) return;

        const original = page.objects.find((o) => o.id === id);
        if (original) {
          const duplicate = {
            ...original,
            id: uuidv4(),
            x: original.x + 20, // 약간 오른쪽 아래로 이동
            y: original.y + 20,
          };
          page.objects.push(duplicate);
          draft.selectedIds = [duplicate.id]; // 복사본 선택
          get().saveHistory();
        }
      }),

    // ========================================
    // Selection Actions
    // ========================================

    selectObject: (id) =>
      set((draft) => {
        draft.selectedIds = [id];
      }),

    selectObjects: (ids) =>
      set((draft) => {
        draft.selectedIds = ids;
      }),

    selectAll: () =>
      set((draft) => {
        if (!draft.document) return;
        const page = draft.document.pages.find((p) => p.id === draft.activePageId);
        if (page) {
          draft.selectedIds = page.objects.map((o) => o.id);
        }
      }),

    deselectAll: () =>
      set((draft) => {
        draft.selectedIds = [];
      }),

    setHoveredId: (id) =>
      set((draft) => {
        draft.hoveredId = id;
      }),

    // ========================================
    // Layer Order Actions
    // ========================================

    bringToFront: (id) =>
      set((draft) => {
        if (!draft.document) return;
        const page = draft.document.pages.find((p) => p.id === draft.activePageId);
        if (!page) return;

        const index = page.objects.findIndex((o) => o.id === id);
        if (index !== -1) {
          const [obj] = page.objects.splice(index, 1);
          page.objects.push(obj); // 배열 끝 = 최상위
          get().saveHistory();
        }
      }),

    sendToBack: (id) =>
      set((draft) => {
        if (!draft.document) return;
        const page = draft.document.pages.find((p) => p.id === draft.activePageId);
        if (!page) return;

        const index = page.objects.findIndex((o) => o.id === id);
        if (index !== -1) {
          const [obj] = page.objects.splice(index, 1);
          page.objects.unshift(obj); // 배열 시작 = 최하위
          get().saveHistory();
        }
      }),

    bringForward: (id) =>
      set((draft) => {
        if (!draft.document) return;
        const page = draft.document.pages.find((p) => p.id === draft.activePageId);
        if (!page) return;

        const index = page.objects.findIndex((o) => o.id === id);
        if (index !== -1 && index < page.objects.length - 1) {
          [page.objects[index], page.objects[index + 1]] = [
            page.objects[index + 1],
            page.objects[index],
          ];
          get().saveHistory();
        }
      }),

    sendBackward: (id) =>
      set((draft) => {
        if (!draft.document) return;
        const page = draft.document.pages.find((p) => p.id === draft.activePageId);
        if (!page) return;

        const index = page.objects.findIndex((o) => o.id === id);
        if (index > 0) {
          [page.objects[index], page.objects[index - 1]] = [
            page.objects[index - 1],
            page.objects[index],
          ];
          get().saveHistory();
        }
      }),

    // ========================================
    // Clipboard Actions
    // ========================================

    copySelected: () =>
      set((draft) => {
        if (!draft.document || draft.selectedIds.length === 0) return;
        const page = draft.document.pages.find((p) => p.id === draft.activePageId);
        if (!page) return;

        const firstSelected = page.objects.find((o) => o.id === draft.selectedIds[0]);
        if (firstSelected) {
          draft.clipboard = { ...firstSelected }; // Deep copy는 Immer가 처리
        }
      }),

    cut: () => {
      get().copySelected();
      const selectedIds = get().selectedIds;
      get().removeObjects(selectedIds);
    },

    paste: () =>
      set((draft) => {
        if (!draft.clipboard || !draft.document) return;
        const page = draft.document.pages.find((p) => p.id === draft.activePageId);
        if (!page) return;

        const newObj = {
          ...draft.clipboard,
          id: uuidv4(),
          x: draft.clipboard.x + 20,
          y: draft.clipboard.y + 20,
        };
        page.objects.push(newObj);
        draft.selectedIds = [newObj.id];
        get().saveHistory();
      }),

    // ========================================
    // History Actions (Undo/Redo)
    // ========================================

    saveHistory: () =>
      set((draft) => {
        if (!draft.document) return;

        const snapshot = JSON.parse(JSON.stringify(draft.document)); // Deep copy
        draft.history.past.push(snapshot);

        // future 초기화 (새 작업 시)
        draft.history.future = [];

        // 최대 히스토리 개수 제한
        if (draft.history.past.length > draft.history.maxHistory) {
          draft.history.past.shift();
        }
      }),

    undo: () =>
      set((draft) => {
        if (draft.history.past.length === 0) return;

        const current = draft.document;
        const previous = draft.history.past.pop();

        if (current) {
          draft.history.future.push(JSON.parse(JSON.stringify(current)));
        }

        draft.document = previous!;
        draft.selectedIds = []; // 선택 해제
      }),

    redo: () =>
      set((draft) => {
        if (draft.history.future.length === 0) return;

        const current = draft.document;
        const next = draft.history.future.pop();

        if (current) {
          draft.history.past.push(JSON.parse(JSON.stringify(current)));
        }

        draft.document = next!;
        draft.selectedIds = [];
      }),

    // ========================================
    // Canvas View Actions
    // ========================================

    setZoom: (zoom) =>
      set((draft) => {
        draft.zoom = Math.max(0.1, Math.min(5.0, zoom));
      }),

    setPan: (pan) =>
      set((draft) => {
        draft.pan = pan;
      }),

    resetView: () =>
      set((draft) => {
        draft.zoom = 1.0;
        draft.pan = { x: 0, y: 0 };
      }),

    fitToScreen: () => {
      // TODO: Canvas 크기를 기준으로 줌/팬 자동 조정
      get().resetView();
    },

    // ========================================
    // UI Actions
    // ========================================

    setTool: (tool) =>
      set((draft) => {
        draft.tool = tool;
      }),

    toggleGrid: () =>
      set((draft) => {
        draft.showGrid = !draft.showGrid;
      }),

    toggleSnapToGrid: () =>
      set((draft) => {
        draft.snapToGrid = !draft.snapToGrid;
      }),

    toggleLeftPanel: () =>
      set((draft) => {
        draft.panels.leftPanelOpen = !draft.panels.leftPanelOpen;
      }),

    toggleRightPanel: () =>
      set((draft) => {
        draft.panels.rightPanelOpen = !draft.panels.rightPanelOpen;
      }),

    setRightPanelTab: (tab) =>
      set((draft) => {
        draft.panels.rightPanelTab = tab;
      }),
  }))
);
