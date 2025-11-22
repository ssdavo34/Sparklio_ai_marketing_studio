/**
 * Canvas Store
 *
 * 캔버스 상태 관리 (줌, 팬, 그리드, Fabric.js 인스턴스)
 *
 * 관리하는 상태:
 * - Zoom: 줌 레벨 (25% ~ 400%)
 * - Pan: 캔버스 이동 (X, Y)
 * - Grid: 그리드 표시/크기
 * - Guidelines: 정렬선 표시
 * - Fabric.js Canvas 인스턴스 (Phase 3에서 추가)
 *
 * 미들웨어:
 * - devtools: Redux DevTools 연동 (persist는 사용하지 않음)
 *
 * @author C팀 (Frontend Team)
 * @version 3.0
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// ============================================================================
// 상태 인터페이스
// ============================================================================

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

  // Polotno Store Instance (v3.1에서 Fabric.js → Polotno로 변경)
  polotnoStore: any | null; // polotno Store

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

  setPolotnoStore: (store: any) => void;
}

// ============================================================================
// 기본값 상수
// ============================================================================

const DEFAULT_ZOOM = 1.0;
const MIN_ZOOM = 0.25;
const MAX_ZOOM = 4.0;
const ZOOM_STEP = 0.1;
const DEFAULT_GRID_SIZE = 10;

// ============================================================================
// Store 생성
// ============================================================================

export const useCanvasStore = create<CanvasState>()(
  devtools(
    (set, get) => ({
      // ========================================
      // 초기 상태
      // ========================================
      zoom: DEFAULT_ZOOM,
      minZoom: MIN_ZOOM,
      maxZoom: MAX_ZOOM,

      panX: 0,
      panY: 0,

      showGrid: false,
      gridSize: DEFAULT_GRID_SIZE,

      showGuidelines: true,

      polotnoStore: null,

      // ========================================
      // Zoom Actions
      // ========================================

      /**
       * 줌 레벨 설정
       * - 최소/최대 제한 적용
       * - Polotno Store의 setScale 호출
       */
      setZoom: (zoom) => {
        const { minZoom, maxZoom, polotnoStore } = get();
        const clampedZoom = Math.max(minZoom, Math.min(zoom, maxZoom));

        set({ zoom: clampedZoom });

        // Polotno Store에 줌 레벨 적용
        if (polotnoStore) {
          polotnoStore.setScale(clampedZoom);
        }
      },

      /**
       * 줌 인
       * - 단축키: Ctrl++
       * - 10%씩 증가
       */
      zoomIn: () => {
        const { zoom } = get();
        get().setZoom(zoom + ZOOM_STEP);
      },

      /**
       * 줌 아웃
       * - 단축키: Ctrl+-
       * - 10%씩 감소
       */
      zoomOut: () => {
        const { zoom } = get();
        get().setZoom(zoom - ZOOM_STEP);
      },

      /**
       * 모든 객체가 보이도록 줌 조정
       * - 단축키: Ctrl+0
       * - Polotno에서는 내장 기능 사용
       */
      zoomToFit: () => {
        const { polotnoStore } = get();
        if (!polotnoStore) return;

        // Polotno Store의 내장 줌 투 핏 사용
        // TODO: Block 3에서 상세 구현
        get().resetZoom();
      },

      /**
       * 줌을 100%로 리셋
       */
      resetZoom: () => {
        get().setZoom(DEFAULT_ZOOM);
      },

      // ========================================
      // Pan Actions
      // ========================================

      /**
       * 캔버스 이동 설정
       * - Polotno에서는 내장 Pan 기능 사용
       */
      setPan: (x, y) => {
        set({ panX: x, panY: y });

        // TODO: Block 3에서 Polotno Pan 기능 연동
      },

      /**
       * 캔버스 이동 리셋
       */
      resetPan: () => {
        get().setPan(0, 0);
      },

      // ========================================
      // Grid Actions
      // ========================================

      /**
       * 그리드 표시/숨김 토글
       * - 단축키: Ctrl+G
       */
      toggleGrid: () => {
        set((state) => ({ showGrid: !state.showGrid }));
      },

      /**
       * 그리드 크기 설정
       * - 10px, 50px 등
       */
      setGridSize: (size) => {
        set({ gridSize: size });
      },

      // ========================================
      // Guidelines Actions
      // ========================================

      /**
       * 정렬선 표시/숨김 토글
       */
      toggleGuidelines: () => {
        set((state) => ({ showGuidelines: !state.showGuidelines }));
      },

      // ========================================
      // Polotno Actions
      // ========================================

      /**
       * Polotno Store 인스턴스 저장
       * - PolotnoWorkspace에서 초기화 시 호출
       */
      setPolotnoStore: (store) => {
        set({ polotnoStore: store });
      },
    }),
    {
      name: 'CanvasStore', // DevTools 이름
    }
  )
);
