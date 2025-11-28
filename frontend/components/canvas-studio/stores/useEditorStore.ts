/**
 * Editor Store
 *
 * 에디터 전역 상태 관리
 *
 * 관리하는 상태:
 * - Document: 현재 문서 데이터
 * - Mode: 작업 모드 (Concept Board, Pitch Deck 등)
 * - View Mode: 뷰 모드 (Studio, Canvas Focus, Chat Focus)
 * - Selection: 선택된 객체/페이지
 * - History: Undo/Redo 스택 (Phase 3에서 추가)
 * - Save: 저장 상태
 *
 * 미들웨어:
 * - persist: localStorage에 문서, 모드 저장
 * - devtools: Redux DevTools 연동
 *
 * @author C팀 (Frontend Team)
 * @version 3.0
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { StudioMode, ViewMode, Document, Page, CanvasObject } from './types';

// ============================================================================
// 상태 인터페이스
// ============================================================================

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export interface EditorState {
  // Document (URL 기반)
  projectId: string | null;
  documentId: string | null;
  document: Document | null;

  // Save State
  saveStatus: SaveStatus;
  lastSaved: Date | null;
  lastError: Error | null;
  isDirty: boolean;
  autoSaveEnabled: boolean;

  // Mode
  currentMode: StudioMode;
  viewMode: ViewMode;

  // Selection
  selectedObjectIds: string[];
  selectedPageId: string | null;

  // History (Phase 3에서 추가)
  // historyStack: any[];
  // historyIndex: number;
  // canUndo: boolean;
  // canRedo: boolean;

  // Actions - Route Info
  setRouteInfo: (projectId: string | null, documentId: string | null) => void;

  // Actions - Document
  setDocument: (document: Document | null) => void;
  setCurrentMode: (mode: StudioMode) => void;
  setViewMode: (mode: ViewMode) => void;

  // Actions - Save State
  setSaveStatus: (status: SaveStatus) => void;
  setDirty: (dirty: boolean) => void;
  setAutoSaveEnabled: (enabled: boolean) => void;
  setLastSaved: (date: Date | null) => void;
  setLastError: (error: Error | null) => void;

  // Actions - Selection
  selectObjects: (objectIds: string[]) => void;
  selectPage: (pageId: string) => void;

  // Actions - Pages
  addPage: (page: Partial<Page>) => void;
  updatePage: (pageId: string, updates: Partial<Page>) => void;
  deletePage: (pageId: string) => void;
  duplicatePage: (pageId: string) => void;
  reorderPages: (fromIndex: number, toIndex: number) => void;

  // Actions - Objects
  addObject: (pageId: string, object: CanvasObject) => void;
  updateObject: (objectId: string, updates: Partial<CanvasObject>) => void;
  deleteObject: (objectId: string) => void;

  // Actions - Save (Deprecated - useDocumentSync로 대체)
  saveDocument: () => Promise<void>;
  autoSave: () => Promise<void>;
}

// ============================================================================
// Store 생성
// ============================================================================

export const useEditorStore = create<EditorState>()(
  devtools(
    persist(
      (set, get) => ({
        // ========================================
        // 초기 상태
        // ========================================
        // Document (URL 기반)
        projectId: null,
        documentId: null,
        document: null,

        // Save State
        saveStatus: 'idle' as SaveStatus,
        lastSaved: null,
        lastError: null,
        isDirty: false,
        autoSaveEnabled: true, // 기본값 ON

        // Mode
        currentMode: 'planning',
        viewMode: 'studio',

        // Selection
        selectedObjectIds: [],
        selectedPageId: null,

        // ========================================
        // Route Info Actions
        // ========================================

        /**
         * URL 기반 라우트 정보 설정
         */
        setRouteInfo: (projectId, documentId) => {
          set({ projectId, documentId });
        },

        // ========================================
        // Document Actions
        // ========================================

        /**
         * 문서 설정
         */
        setDocument: (document) => {
          set({ document, saveStatus: 'idle', isDirty: false });
        },

        /**
         * 작업 모드 변경
         * - Concept Board, Pitch Deck, Product Story 등
         */
        setCurrentMode: (mode) => {
          set({ currentMode: mode });
        },

        /**
         * 뷰 모드 변경
         * - Studio, Canvas Focus, Chat Focus
         * - 레이아웃 자동 조정은 컴포넌트에서 처리
         */
        setViewMode: (mode) => {
          set({ viewMode: mode });
        },

        // ========================================
        // Save State Actions
        // ========================================

        /**
         * 저장 상태 설정
         */
        setSaveStatus: (status) => {
          set({ saveStatus: status });
        },

        /**
         * Dirty 플래그 설정
         */
        setDirty: (dirty) => {
          set({ isDirty: dirty });
        },

        /**
         * Auto-save 활성화/비활성화
         */
        setAutoSaveEnabled: (enabled) => {
          set({ autoSaveEnabled: enabled });
        },

        /**
         * 마지막 저장 시간 설정
         */
        setLastSaved: (date) => {
          set({ lastSaved: date });
        },

        /**
         * 마지막 에러 설정
         */
        setLastError: (error) => {
          set({ lastError: error });
        },

        // ========================================
        // Selection Actions
        // ========================================

        /**
         * 객체 선택
         * - 여러 객체 다중 선택 가능
         */
        selectObjects: (objectIds) => {
          set({ selectedObjectIds: objectIds });
        },

        /**
         * 페이지 선택
         */
        selectPage: (pageId) => {
          set({ selectedPageId: pageId });
        },

        // ========================================
        // Pages Actions
        // ========================================

        /**
         * 페이지 추가
         */
        addPage: (page) => {
          const doc = get().document;
          if (!doc) return;

          const newPage: Page = {
            id: page.id || `page-${Date.now()}`,
            title: page.title || 'Untitled Page',
            order: page.order ?? doc.pages.length,
            objects: [],
            width: page.width || 1920,
            height: page.height || 1080,
            ...page,
          };

          set({
            document: {
              ...doc,
              pages: [...doc.pages, newPage].sort((a, b) => a.order - b.order),
            },
            isDirty: true,
          });
        },

        /**
         * 페이지 업데이트
         */
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
            isDirty: true,
          });
        },

        /**
         * 페이지 삭제
         */
        deletePage: (pageId) => {
          const doc = get().document;
          if (!doc) return;

          set({
            document: {
              ...doc,
              pages: doc.pages.filter((page) => page.id !== pageId),
            },
            isDirty: true,
          });
        },

        /**
         * 페이지 복제
         */
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
            isDirty: true,
          });
        },

        /**
         * 페이지 순서 변경
         * - 드래그 & 드롭으로 순서 변경 시 사용
         */
        reorderPages: (fromIndex, toIndex) => {
          const doc = get().document;
          if (!doc) return;

          const pages = [...doc.pages];
          const [movedPage] = pages.splice(fromIndex, 1);
          pages.splice(toIndex, 0, movedPage);

          // order 업데이트
          pages.forEach((page, index) => {
            page.order = index;
          });

          set({ document: { ...doc, pages }, isSaved: false });
        },

        // ========================================
        // Objects Actions
        // ========================================

        /**
         * 객체 추가
         */
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
            isDirty: true,
          });
        },

        /**
         * 객체 업데이트
         */
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
            isDirty: true,
          });
        },

        /**
         * 객체 삭제
         */
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
            isDirty: true,
          });
        },

        // ========================================
        // Save Actions
        // ========================================

        /**
         * 문서 저장 (Deprecated)
         * - useDocumentSync Hook 사용 권장
         */
        saveDocument: async () => {
          set({ saveStatus: 'saving' });

          try {
            // TODO: Phase 3에서 API 호출 구현
            // await apiClient.post('/documents', get().document);

            // 임시: 1초 대기
            await new Promise((resolve) => setTimeout(resolve, 1000));

            set({ saveStatus: 'saved', isDirty: false, lastSaved: new Date() });
          } catch (error) {
            console.error('Failed to save document:', error);
            set({ saveStatus: 'error', lastError: error as Error });
          }
        },

        /**
         * 자동 저장 (Deprecated)
         * - useDocumentSync Hook 사용 권장
         */
        autoSave: async () => {
          const { isDirty, saveStatus } = get();
          if (!isDirty || saveStatus === 'saving') return;

          await get().saveDocument();
        },
      }),
      {
        name: 'canvas-studio-editor', // localStorage key
        // 일부 상태만 저장
        partialize: (state) => ({
          projectId: state.projectId,
          documentId: state.documentId,
          document: state.document,
          currentMode: state.currentMode,
          viewMode: state.viewMode,
          autoSaveEnabled: state.autoSaveEnabled,
        }),
      }
    ),
    {
      name: 'EditorStore', // DevTools 이름
    }
  )
);
