/**
 * Editor State Management Store (Zustand)
 *
 * Centralized state management for the Sparklio editor
 * Manages document, selection, history, and UI state
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 * @date 2025-11-21
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { SparklioDocument, SparklioPage, SparklioObject } from '@/lib/sparklio/document';
import type { BrandKit } from '@/lib/sparklio/brand';
import { getBrandKitManager } from '@/lib/sparklio/brand';

// ============================================================================
// Types
// ============================================================================

export interface EditorState {
  // Document state
  document: SparklioDocument | null;
  currentPageId: string | null;
  isDirty: boolean;

  // Selection state
  selectedObjectIds: string[];
  hoveredObjectId: string | null;

  // History state
  history: SparklioDocument[];
  historyIndex: number;
  maxHistorySize: number;

  // UI state
  zoom: number;
  panX: number;
  panY: number;
  showGrid: boolean;
  showRulers: boolean;
  snapToGrid: boolean;
  gridSize: number;

  // Brand state
  activeBrandKit: BrandKit | null;

  // Clipboard
  clipboard: SparklioObject[];

  // Loading/error state
  isLoading: boolean;
  error: string | null;
}

export interface EditorActions {
  // Document actions
  setDocument: (document: SparklioDocument) => void;
  updateDocument: (updates: Partial<SparklioDocument>) => void;
  setCurrentPage: (pageId: string) => void;
  addPage: (page?: Partial<SparklioPage>) => void;
  deletePage: (pageId: string) => void;
  duplicatePage: (pageId: string) => void;
  reorderPages: (fromIndex: number, toIndex: number) => void;

  // Object actions
  addObject: (object: Partial<SparklioObject>, pageId?: string) => void;
  updateObject: (objectId: string, updates: Partial<SparklioObject>) => void;
  deleteObject: (objectId: string) => void;
  duplicateObject: (objectId: string) => void;
  moveObject: (objectId: string, dx: number, dy: number) => void;
  resizeObject: (objectId: string, width: number, height: number) => void;
  rotateObject: (objectId: string, rotation: number) => void;
  reorderObjects: (pageId: string, fromIndex: number, toIndex: number) => void;

  // Selection actions
  selectObject: (objectId: string, multi?: boolean) => void;
  selectObjects: (objectIds: string[]) => void;
  clearSelection: () => void;
  selectAll: () => void;
  setHoveredObject: (objectId: string | null) => void;

  // History actions
  undo: () => void;
  redo: () => void;
  pushHistory: () => void;
  clearHistory: () => void;

  // Clipboard actions
  copy: () => void;
  cut: () => void;
  paste: () => void;

  // Viewport actions
  setZoom: (zoom: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  setPan: (x: number, y: number) => void;
  resetPan: () => void;

  // UI actions
  toggleGrid: () => void;
  toggleRulers: () => void;
  toggleSnapToGrid: () => void;
  setGridSize: (size: number) => void;

  // Brand actions
  setActiveBrandKit: (brandKit: BrandKit) => void;

  // State actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export type EditorStore = EditorState & EditorActions;

// ============================================================================
// Initial State
// ============================================================================

const initialState: EditorState = {
  document: null,
  currentPageId: null,
  isDirty: false,

  selectedObjectIds: [],
  hoveredObjectId: null,

  history: [],
  historyIndex: -1,
  maxHistorySize: 50,

  zoom: 1,
  panX: 0,
  panY: 0,
  showGrid: true,
  showRulers: true,
  snapToGrid: true,
  gridSize: 20,

  activeBrandKit: null,

  clipboard: [],

  isLoading: false,
  error: null,
};

// ============================================================================
// Store Implementation
// ============================================================================

export const useEditorStore = create<EditorStore>()(
  devtools(
    persist(
      immer((set, get) => ({
        ...initialState,

        // ========================================================================
        // Document Actions
        // ========================================================================

        setDocument: (document) => {
          set((state) => {
            state.document = document;
            state.currentPageId = document.pages[0]?.id || null;
            state.isDirty = false;
            state.history = [document];
            state.historyIndex = 0;
          });
        },

        updateDocument: (updates) => {
          set((state) => {
            if (state.document) {
              Object.assign(state.document, updates);
              state.isDirty = true;
            }
          });
        },

        setCurrentPage: (pageId) => {
          set((state) => {
            state.currentPageId = pageId;
            state.selectedObjectIds = [];
          });
        },

        addPage: (pageData = {}) => {
          set((state) => {
            if (!state.document) return;

            const newPage: SparklioPage = {
              id: `page_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              name: pageData.name || `Page ${state.document.pages.length + 1}`,
              width: pageData.width || 1920,
              height: pageData.height || 1080,
              objects: pageData.objects || [],
              order: state.document.pages.length,
            };

            state.document.pages.push(newPage);
            state.currentPageId = newPage.id;
            state.isDirty = true;
          });

          get().pushHistory();
        },

        deletePage: (pageId) => {
          set((state) => {
            if (!state.document || state.document.pages.length === 1) return;

            const index = state.document.pages.findIndex(p => p.id === pageId);
            if (index === -1) return;

            state.document.pages.splice(index, 1);

            // Update current page if deleted
            if (state.currentPageId === pageId) {
              state.currentPageId = state.document.pages[0]?.id || null;
            }

            state.isDirty = true;
          });

          get().pushHistory();
        },

        duplicatePage: (pageId) => {
          set((state) => {
            if (!state.document) return;

            const page = state.document.pages.find(p => p.id === pageId);
            if (!page) return;

            const newPage: SparklioPage = {
              ...page,
              id: `page_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              name: `${page.name} (Copy)`,
              order: state.document.pages.length,
              objects: page.objects.map(obj => ({
                ...obj,
                id: `obj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              })),
            };

            state.document.pages.push(newPage);
            state.currentPageId = newPage.id;
            state.isDirty = true;
          });

          get().pushHistory();
        },

        reorderPages: (fromIndex, toIndex) => {
          set((state) => {
            if (!state.document) return;

            const [page] = state.document.pages.splice(fromIndex, 1);
            state.document.pages.splice(toIndex, 0, page);

            // Update order property
            state.document.pages.forEach((p, i) => {
              p.order = i;
            });

            state.isDirty = true;
          });

          get().pushHistory();
        },

        // ========================================================================
        // Object Actions
        // ========================================================================

        addObject: (objectData, pageId) => {
          set((state) => {
            if (!state.document) return;

            const targetPageId = pageId || state.currentPageId;
            const page = state.document.pages.find(p => p.id === targetPageId);
            if (!page) return;

            const newObject: SparklioObject = {
              id: `obj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              type: objectData.type || 'text',
              x: objectData.x ?? 100,
              y: objectData.y ?? 100,
              width: objectData.width,
              height: objectData.height,
              rotation: objectData.rotation || 0,
              opacity: objectData.opacity ?? 1,
              visible: objectData.visible ?? true,
              locked: objectData.locked || false,
              name: objectData.name,
              role: objectData.role,
              style: objectData.style || {},
              content: objectData.content,
              children: objectData.children || [],
            };

            page.objects.push(newObject);
            state.selectedObjectIds = [newObject.id];
            state.isDirty = true;
          });

          get().pushHistory();
        },

        updateObject: (objectId, updates) => {
          set((state) => {
            if (!state.document || !state.currentPageId) return;

            const page = state.document.pages.find(p => p.id === state.currentPageId);
            if (!page) return;

            const object = page.objects.find(obj => obj.id === objectId);
            if (!object) return;

            Object.assign(object, updates);
            state.isDirty = true;
          });

          get().pushHistory();
        },

        deleteObject: (objectId) => {
          set((state) => {
            if (!state.document || !state.currentPageId) return;

            const page = state.document.pages.find(p => p.id === state.currentPageId);
            if (!page) return;

            const index = page.objects.findIndex(obj => obj.id === objectId);
            if (index === -1) return;

            page.objects.splice(index, 1);
            state.selectedObjectIds = state.selectedObjectIds.filter(id => id !== objectId);
            state.isDirty = true;
          });

          get().pushHistory();
        },

        duplicateObject: (objectId) => {
          set((state) => {
            if (!state.document || !state.currentPageId) return;

            const page = state.document.pages.find(p => p.id === state.currentPageId);
            if (!page) return;

            const object = page.objects.find(obj => obj.id === objectId);
            if (!object) return;

            const newObject: SparklioObject = {
              ...object,
              id: `obj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              x: object.x + 20,
              y: object.y + 20,
            };

            page.objects.push(newObject);
            state.selectedObjectIds = [newObject.id];
            state.isDirty = true;
          });

          get().pushHistory();
        },

        moveObject: (objectId, dx, dy) => {
          set((state) => {
            if (!state.document || !state.currentPageId) return;

            const page = state.document.pages.find(p => p.id === state.currentPageId);
            if (!page) return;

            const object = page.objects.find(obj => obj.id === objectId);
            if (!object || object.locked) return;

            object.x += dx;
            object.y += dy;

            // Snap to grid if enabled
            if (state.snapToGrid) {
              object.x = Math.round(object.x / state.gridSize) * state.gridSize;
              object.y = Math.round(object.y / state.gridSize) * state.gridSize;
            }

            state.isDirty = true;
          });
        },

        resizeObject: (objectId, width, height) => {
          set((state) => {
            if (!state.document || !state.currentPageId) return;

            const page = state.document.pages.find(p => p.id === state.currentPageId);
            if (!page) return;

            const object = page.objects.find(obj => obj.id === objectId);
            if (!object || object.locked) return;

            object.width = width;
            object.height = height;
            state.isDirty = true;
          });
        },

        rotateObject: (objectId, rotation) => {
          set((state) => {
            if (!state.document || !state.currentPageId) return;

            const page = state.document.pages.find(p => p.id === state.currentPageId);
            if (!page) return;

            const object = page.objects.find(obj => obj.id === objectId);
            if (!object || object.locked) return;

            object.rotation = rotation;
            state.isDirty = true;
          });
        },

        reorderObjects: (pageId, fromIndex, toIndex) => {
          set((state) => {
            if (!state.document) return;

            const page = state.document.pages.find(p => p.id === pageId);
            if (!page) return;

            const [object] = page.objects.splice(fromIndex, 1);
            page.objects.splice(toIndex, 0, object);
            state.isDirty = true;
          });

          get().pushHistory();
        },

        // ========================================================================
        // Selection Actions
        // ========================================================================

        selectObject: (objectId, multi = false) => {
          set((state) => {
            if (multi) {
              if (state.selectedObjectIds.includes(objectId)) {
                state.selectedObjectIds = state.selectedObjectIds.filter(id => id !== objectId);
              } else {
                state.selectedObjectIds.push(objectId);
              }
            } else {
              state.selectedObjectIds = [objectId];
            }
          });
        },

        selectObjects: (objectIds) => {
          set((state) => {
            state.selectedObjectIds = objectIds;
          });
        },

        clearSelection: () => {
          set((state) => {
            state.selectedObjectIds = [];
          });
        },

        selectAll: () => {
          set((state) => {
            if (!state.document || !state.currentPageId) return;

            const page = state.document.pages.find(p => p.id === state.currentPageId);
            if (!page) return;

            state.selectedObjectIds = page.objects.map(obj => obj.id);
          });
        },

        setHoveredObject: (objectId) => {
          set((state) => {
            state.hoveredObjectId = objectId;
          });
        },

        // ========================================================================
        // History Actions
        // ========================================================================

        pushHistory: () => {
          set((state) => {
            if (!state.document) return;

            // Remove any history after current index
            state.history = state.history.slice(0, state.historyIndex + 1);

            // Add current state to history
            state.history.push(JSON.parse(JSON.stringify(state.document)));

            // Limit history size
            if (state.history.length > state.maxHistorySize) {
              state.history.shift();
            } else {
              state.historyIndex++;
            }
          });
        },

        undo: () => {
          set((state) => {
            if (state.historyIndex > 0) {
              state.historyIndex--;
              state.document = JSON.parse(JSON.stringify(state.history[state.historyIndex]));
              state.isDirty = true;
            }
          });
        },

        redo: () => {
          set((state) => {
            if (state.historyIndex < state.history.length - 1) {
              state.historyIndex++;
              state.document = JSON.parse(JSON.stringify(state.history[state.historyIndex]));
              state.isDirty = true;
            }
          });
        },

        clearHistory: () => {
          set((state) => {
            state.history = state.document ? [state.document] : [];
            state.historyIndex = state.document ? 0 : -1;
          });
        },

        // ========================================================================
        // Clipboard Actions
        // ========================================================================

        copy: () => {
          set((state) => {
            if (!state.document || !state.currentPageId || state.selectedObjectIds.length === 0) return;

            const page = state.document.pages.find(p => p.id === state.currentPageId);
            if (!page) return;

            state.clipboard = page.objects.filter(obj => state.selectedObjectIds.includes(obj.id));
          });
        },

        cut: () => {
          const { copy, deleteObject, selectedObjectIds } = get();
          copy();
          selectedObjectIds.forEach(id => deleteObject(id));
        },

        paste: () => {
          set((state) => {
            if (!state.document || !state.currentPageId || state.clipboard.length === 0) return;

            const page = state.document.pages.find(p => p.id === state.currentPageId);
            if (!page) return;

            const newObjects = state.clipboard.map(obj => ({
              ...obj,
              id: `obj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              x: obj.x + 20,
              y: obj.y + 20,
            }));

            page.objects.push(...newObjects);
            state.selectedObjectIds = newObjects.map(obj => obj.id);
            state.isDirty = true;
          });

          get().pushHistory();
        },

        // ========================================================================
        // Viewport Actions
        // ========================================================================

        setZoom: (zoom) => {
          set((state) => {
            state.zoom = Math.max(0.1, Math.min(5, zoom));
          });
        },

        zoomIn: () => {
          const { zoom, setZoom } = get();
          setZoom(zoom * 1.2);
        },

        zoomOut: () => {
          const { zoom, setZoom } = get();
          setZoom(zoom / 1.2);
        },

        resetZoom: () => {
          set((state) => {
            state.zoom = 1;
          });
        },

        setPan: (x, y) => {
          set((state) => {
            state.panX = x;
            state.panY = y;
          });
        },

        resetPan: () => {
          set((state) => {
            state.panX = 0;
            state.panY = 0;
          });
        },

        // ========================================================================
        // UI Actions
        // ========================================================================

        toggleGrid: () => {
          set((state) => {
            state.showGrid = !state.showGrid;
          });
        },

        toggleRulers: () => {
          set((state) => {
            state.showRulers = !state.showRulers;
          });
        },

        toggleSnapToGrid: () => {
          set((state) => {
            state.snapToGrid = !state.snapToGrid;
          });
        },

        setGridSize: (size) => {
          set((state) => {
            state.gridSize = Math.max(5, Math.min(100, size));
          });
        },

        // ========================================================================
        // Brand Actions
        // ========================================================================

        setActiveBrandKit: (brandKit) => {
          set((state) => {
            state.activeBrandKit = brandKit;
          });
        },

        // ========================================================================
        // State Actions
        // ========================================================================

        setLoading: (loading) => {
          set((state) => {
            state.isLoading = loading;
          });
        },

        setError: (error) => {
          set((state) => {
            state.error = error;
          });
        },

        reset: () => {
          set(initialState);
        },
      })),
      {
        name: 'sparklio-editor-storage',
        partialize: (state) => ({
          // Only persist UI preferences, not document data
          zoom: state.zoom,
          showGrid: state.showGrid,
          showRulers: state.showRulers,
          snapToGrid: state.snapToGrid,
          gridSize: state.gridSize,
        }),
      }
    ),
    { name: 'EditorStore' }
  )
);
