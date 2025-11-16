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

  // Fabric.js Canvas Instance (Phase 3에서 추가)
  fabricCanvas: any | null; // fabric.Canvas

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

  setFabricCanvas: (canvas: any) => void;
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

      fabricCanvas: null,

      // ========================================
      // Zoom Actions
      // ========================================

      /**
       * 줌 레벨 설정
       * - 최소/최대 제한 적용
       * - CSS transform scale로 전체 캔버스 확대/축소 ✅
       */
      setZoom: (zoom) => {
        const { minZoom, maxZoom } = get();
        const clampedZoom = Math.max(minZoom, Math.min(zoom, maxZoom));

        set({ zoom: clampedZoom });

        // CSS transform scale로 처리하므로 Fabric.js에서는 별도 작업 불필요
        // CanvasViewport.tsx에서 CSS transform 적용
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
       */
      zoomToFit: () => {
        const { fabricCanvas, minZoom, maxZoom } = get();
        if (!fabricCanvas) return;

        // 그리드 라인을 제외한 실제 객체들만 가져오기
        const objects = fabricCanvas.getObjects().filter((obj: any) => obj.name !== 'grid-line');

        if (objects.length === 0) {
          get().resetZoom();
          return;
        }

        // 모든 객체의 Bounding Box 계산
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;

        objects.forEach((obj: any) => {
          const bound = obj.getBoundingRect();
          minX = Math.min(minX, bound.left);
          minY = Math.min(minY, bound.top);
          maxX = Math.max(maxX, bound.left + bound.width);
          maxY = Math.max(maxY, bound.top + bound.height);
        });

        const objectsWidth = maxX - minX;
        const objectsHeight = maxY - minY;

        // 캔버스 크기
        const canvasWidth = fabricCanvas.getWidth();
        const canvasHeight = fabricCanvas.getHeight();

        // 패딩 (10%)
        const padding = 0.1;
        const availableWidth = canvasWidth * (1 - padding * 2);
        const availableHeight = canvasHeight * (1 - padding * 2);

        // 줌 레벨 계산 (작은 쪽에 맞춤)
        const zoomX = availableWidth / objectsWidth;
        const zoomY = availableHeight / objectsHeight;
        const newZoom = Math.min(zoomX, zoomY, maxZoom);
        const clampedZoom = Math.max(minZoom, newZoom);

        get().setZoom(clampedZoom);
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
       * - 마우스 드래그로 캔버스 이동 시 사용
       */
      setPan: (x, y) => {
        set({ panX: x, panY: y });

        // TODO: Phase 3에서 Fabric.js 캔버스에 적용
        // const { fabricCanvas } = get();
        // if (fabricCanvas) {
        //   fabricCanvas.relativePan(new fabric.Point(x, y));
        //   fabricCanvas.renderAll();
        // }
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
      // Fabric.js Actions
      // ========================================

      /**
       * Fabric.js 캔버스 인스턴스 저장
       * - Phase 3에서 캔버스 초기화 시 호출
       */
      setFabricCanvas: (canvas) => {
        set({ fabricCanvas: canvas });
      },
    }),
    {
      name: 'CanvasStore', // DevTools 이름
    }
  )
);
