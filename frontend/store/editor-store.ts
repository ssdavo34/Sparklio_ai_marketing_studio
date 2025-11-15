import { create } from 'zustand';

/**
 * Editor Store
 *
 * One-Page Editor의 상태를 관리합니다.
 * - Canvas 인스턴스
 * - 현재 문서 (Editor JSON)
 * - 선택된 오브젝트
 * - History (Undo/Redo)
 */

export interface EditorDocument {
  documentId: string;
  type: 'product_detail' | 'sns' | 'brand_kit' | 'presentation';
  brandId?: string;
  pages: EditorPage[];
}

export interface EditorPage {
  id: string;
  name: string;
  width: number;
  height: number;
  background: string;
  objects: EditorObject[];
}

export interface EditorObject {
  id: string;
  type: 'text' | 'image' | 'shape' | 'group';
  role?: string; // TITLE, SUBTITLE, MAIN_VISUAL, etc.
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  props: Record<string, any>;
  bindings?: {
    field: string;
  };
}

interface EditorState {
  // 상태
  canvas: any | null; // fabric.Canvas (타입은 나중에 Fabric.js 설치 후 정확히 지정)
  currentDocument: EditorDocument | null;
  selectedObjectId: string | null;
  history: EditorDocument[];
  historyIndex: number;

  // 액션
  setCanvas: (canvas: any) => void;
  setCurrentDocument: (doc: EditorDocument | null) => void;
  setSelectedObjectId: (id: string | null) => void;
  updateObject: (objectId: string, props: Partial<EditorObject>) => void;
  addToHistory: () => void;
  undo: () => void;
  redo: () => void;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  // 초기 상태
  canvas: null,
  currentDocument: null,
  selectedObjectId: null,
  history: [],
  historyIndex: -1,

  // 액션 구현
  setCanvas: (canvas) => set({ canvas }),

  setCurrentDocument: (doc) => set({ currentDocument: doc }),

  setSelectedObjectId: (id) => set({ selectedObjectId: id }),

  updateObject: (objectId, props) =>
    set((state) => {
      if (!state.currentDocument) return state;

      const updatedDocument = {
        ...state.currentDocument,
        pages: state.currentDocument.pages.map((page) => ({
          ...page,
          objects: page.objects.map((obj) =>
            obj.id === objectId ? { ...obj, ...props } : obj
          ),
        })),
      };

      return { currentDocument: updatedDocument };
    }),

  addToHistory: () =>
    set((state) => {
      if (!state.currentDocument) return state;

      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push(state.currentDocument);

      return {
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    }),

  undo: () =>
    set((state) => {
      if (state.historyIndex <= 0) return state;

      const newIndex = state.historyIndex - 1;
      return {
        currentDocument: state.history[newIndex],
        historyIndex: newIndex,
      };
    }),

  redo: () =>
    set((state) => {
      if (state.historyIndex >= state.history.length - 1) return state;

      const newIndex = state.historyIndex + 1;
      return {
        currentDocument: state.history[newIndex],
        historyIndex: newIndex,
      };
    }),
}));
