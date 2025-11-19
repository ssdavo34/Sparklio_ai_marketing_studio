/**
 * Zustand EditorStore 타입 정의
 */

import type {
  EditorDocument,
  EditorObject,
  EditorPage,
  Position,
} from './document';

// ========================================
// Editor State
// ========================================

export type EditorState = {
  // ---------- Document ----------
  document: EditorDocument | null;   // 현재 편집 중인 문서
  activePageId: string | null;       // 현재 활성 페이지 ID

  // ---------- Selection ----------
  selectedIds: string[];             // 선택된 객체 ID 배열
  hoveredId: string | null;          // 마우스 호버 중인 객체 ID

  // ---------- Clipboard ----------
  clipboard: EditorObject | null;    // 복사된 객체

  // ---------- Canvas View ----------
  zoom: number;                      // 줌 레벨 (0.1 ~ 5.0)
  pan: Position;                     // 팬 위치 (x, y)
  canvasSize: { width: number; height: number };

  // ---------- UI State ----------
  tool: EditorTool;                  // 현재 선택된 도구
  showGrid: boolean;                 // 그리드 표시 여부
  snapToGrid: boolean;               // 그리드 스냅 활성화
  showRulers: boolean;               // 눈금자 표시
  showGuides: boolean;               // 가이드라인 표시

  // ---------- History (Undo/Redo) ----------
  history: HistoryState;

  // ---------- Panels ----------
  panels: PanelState;
};

export type EditorTool =
  | 'select'                         // 선택 도구
  | 'hand'                           // 팬 도구
  | 'text'                           // 텍스트 추가
  | 'shape'                          // 도형 추가
  | 'image'                          // 이미지 추가
  | 'frame';                         // 프레임 추가

export type HistoryState = {
  past: EditorDocument[];            // Undo 스택
  future: EditorDocument[];          // Redo 스택
  maxHistory: number;                // 최대 히스토리 개수 (기본 50)
};

export type PanelState = {
  leftPanelOpen: boolean;            // 좌측 패널 (Pages, Assets)
  rightPanelOpen: boolean;           // 우측 패널 (Inspector, Chat)
  rightPanelTab: RightPanelTab;      // 우측 패널 활성 탭
};

export type RightPanelTab =
  | 'inspector'                      // 속성 패널
  | 'chat'                           // Chat 패널
  | 'assets'                         // 에셋 검색
  | 'settings';                      // 문서 설정

// ========================================
// Editor Actions
// ========================================

export type EditorActions = {
  // ---------- Document ----------
  loadDocument: (doc: EditorDocument) => void;
  clearDocument: () => void;
  updateDocumentMetadata: (updates: Partial<EditorDocument>) => void;

  // ---------- Page ----------
  setActivePage: (pageId: string) => void;
  addPage: (page: EditorPage) => void;
  removePage: (pageId: string) => void;
  reorderPages: (pageIds: string[]) => void;

  // ---------- Objects ----------
  addObject: (pageId: string, obj: EditorObject) => void;
  updateObject: (id: string, updates: Partial<EditorObject>) => void;
  removeObject: (id: string) => void;
  removeObjects: (ids: string[]) => void;
  duplicateObject: (id: string) => void;

  // ---------- Selection ----------
  selectObject: (id: string) => void;
  selectObjects: (ids: string[]) => void;
  selectAll: () => void;
  deselectAll: () => void;
  setHoveredId: (id: string | null) => void;

  // ---------- Layer Order ----------
  bringToFront: (id: string) => void;
  sendToBack: (id: string) => void;
  bringForward: (id: string) => void;
  sendBackward: (id: string) => void;

  // ---------- Clipboard ----------
  copySelected: () => void;
  cut: () => void;
  paste: () => void;

  // ---------- History ----------
  undo: () => void;
  redo: () => void;
  saveHistory: () => void;         // 현재 상태를 히스토리에 저장

  // ---------- Canvas View ----------
  setZoom: (zoom: number) => void;
  setPan: (pan: Position) => void;
  resetView: () => void;            // 줌/팬 초기화
  fitToScreen: () => void;          // 페이지를 화면에 맞춤

  // ---------- UI ----------
  setTool: (tool: EditorTool) => void;
  toggleGrid: () => void;
  toggleSnapToGrid: () => void;
  toggleLeftPanel: () => void;
  toggleRightPanel: () => void;
  setRightPanelTab: (tab: RightPanelTab) => void;
};

// ========================================
// Combined Store Type
// ========================================

export type EditorStore = EditorState & EditorActions;
