/**
 * Canvas Store
 *
 * 멀티 캔버스 상태 관리
 * - 9개의 독립 캔버스 (brand-dna, brief, meeting, concept, presentation, detail, sns, video, image)
 * - 각 탭이 자신의 캔버스만 사용
 * - 하위 호환성: polotnoStore getter는 activeCanvas 반환
 *
 * @author C팀 (Frontend Team)
 * @version 4.0 (2025-12-01 멀티캔버스)
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { CanvasTemplate, PlatformType } from '@/types/canvas-templates';
import { getDefaultTemplate, getTemplateById } from '@/types/canvas-templates';
import type { ColorTheme, ThemeType } from '@/types/color-themes';
import { getDefaultTheme, getThemeById, generateGradientSVG } from '@/types/color-themes';
import type { StoreType } from 'polotno/model/store';
import { type CanvasType, CANVAS_CONFIGS } from './types';

// ============================================================================
// 상태 인터페이스
// ============================================================================

export interface CanvasState {
  // ========================================
  // 멀티 캔버스 (v4.0)
  // ========================================

  /** 캔버스 타입별 Polotno Store 인스턴스 */
  canvases: Map<CanvasType, StoreType>;

  /** 현재 활성화된 캔버스 타입 */
  activeCanvasType: CanvasType;

  /**
   * 하위 호환성: 기존 코드가 polotnoStore에 접근 시 activeCanvas 반환
   * @deprecated getCanvas(activeCanvasType) 또는 activeCanvas 사용 권장
   */
  polotnoStore: StoreType | null;

  // ========================================
  // 기존 상태 (하위 호환)
  // ========================================

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

  // Canvas Template
  currentTemplate: CanvasTemplate;

  // Color Theme
  currentTheme: ColorTheme;

  // ========================================
  // 멀티 캔버스 Actions (v4.0)
  // ========================================

  /** 특정 타입의 캔버스 가져오기 */
  getCanvas: (type: CanvasType) => StoreType | null;

  /** 캔버스 등록 */
  setCanvas: (type: CanvasType, store: StoreType) => void;

  /** 활성 캔버스 타입 변경 */
  setActiveCanvas: (type: CanvasType) => void;

  /** 활성 캔버스 타입 변경 (alias) */
  setActiveCanvasType: (type: CanvasType) => void;

  /** 현재 활성 캔버스 가져오기 */
  getActiveCanvas: () => StoreType | null;

  // ========================================
  // 기존 Actions (하위 호환)
  // ========================================

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

  /** @deprecated setCanvas(type, store) 사용 권장 */
  setPolotnoStore: (store: StoreType) => void;

  setTemplate: (templateId: PlatformType) => void;
  resizeCanvas: (width: number, height: number) => void;

  setTheme: (themeId: ThemeType) => void;
  applyThemeToCanvas: (theme: ColorTheme) => void;
}

// ============================================================================
// 기본값 상수
// ============================================================================

const DEFAULT_ZOOM = 1.0;
const MIN_ZOOM = 0.25;
const MAX_ZOOM = 4.0;
const ZOOM_STEP = 0.1;
const DEFAULT_GRID_SIZE = 10;
const DEFAULT_CANVAS_TYPE: CanvasType = 'brand-dna';

// ============================================================================
// Store 생성
// ============================================================================

export const useCanvasStore = create<CanvasState>()(
  devtools(
    (set, get) => ({
      // ========================================
      // 멀티 캔버스 초기 상태 (v4.0)
      // ========================================
      canvases: new Map<CanvasType, StoreType>(),
      activeCanvasType: DEFAULT_CANVAS_TYPE,

      // 하위 호환: null로 초기화 (실제 값은 selector에서 계산)
      // 기존 코드: polotnoStore를 직접 사용하는 경우 getActiveCanvas() 사용 권장
      polotnoStore: null,

      // ========================================
      // 기존 초기 상태 (하위 호환)
      // ========================================
      zoom: DEFAULT_ZOOM,
      minZoom: MIN_ZOOM,
      maxZoom: MAX_ZOOM,

      panX: 0,
      panY: 0,

      showGrid: false,
      gridSize: DEFAULT_GRID_SIZE,

      showGuidelines: true,

      currentTemplate: getDefaultTemplate(),
      currentTheme: getDefaultTheme(),

      // ========================================
      // 멀티 캔버스 Actions (v4.0)
      // ========================================

      /**
       * 특정 타입의 캔버스 가져오기
       */
      getCanvas: (type: CanvasType) => {
        return get().canvases.get(type) || null;
      },

      /**
       * 캔버스 등록
       * - 탭이 마운트될 때 자신의 캔버스를 등록
       */
      setCanvas: (type: CanvasType, store: StoreType) => {
        const { canvases } = get();
        const newCanvases = new Map(canvases);
        newCanvases.set(type, store);

        console.log(`[CanvasStore] Canvas registered: ${type}`);
        set({ canvases: newCanvases });
      },

      /**
       * 활성 캔버스 타입 변경
       * - 탭 전환 시 호출
       */
      setActiveCanvas: (type: CanvasType) => {
        console.log(`[CanvasStore] Active canvas changed: ${type}`);
        set({ activeCanvasType: type });
      },

      /**
       * 활성 캔버스 타입 변경 (alias for setActiveCanvas)
       */
      setActiveCanvasType: (type: CanvasType) => {
        console.log(`[CanvasStore] Active canvas type changed: ${type}`);
        set({ activeCanvasType: type });
      },

      /**
       * 현재 활성 캔버스 가져오기
       */
      getActiveCanvas: () => {
        const { canvases, activeCanvasType } = get();
        return canvases.get(activeCanvasType) || null;
      },

      // ========================================
      // 기존 Actions (하위 호환)
      // ========================================

      /**
       * 줌 레벨 설정
       */
      setZoom: (zoom) => {
        const { minZoom, maxZoom } = get();
        const clampedZoom = Math.max(minZoom, Math.min(zoom, maxZoom));

        set({ zoom: clampedZoom });

        // 활성 캔버스에 줌 적용
        const activeCanvas = get().getActiveCanvas();
        if (activeCanvas) {
          activeCanvas.setScale(clampedZoom);
        }
      },

      zoomIn: () => {
        const { zoom } = get();
        get().setZoom(zoom + ZOOM_STEP);
      },

      zoomOut: () => {
        const { zoom } = get();
        get().setZoom(zoom - ZOOM_STEP);
      },

      zoomToFit: () => {
        const activeCanvas = get().getActiveCanvas();
        if (!activeCanvas) return;
        get().resetZoom();
      },

      resetZoom: () => {
        get().setZoom(DEFAULT_ZOOM);
      },

      setPan: (x, y) => {
        set({ panX: x, panY: y });
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

      /**
       * @deprecated setCanvas(type, store) 사용 권장
       * 하위 호환: 기본 캔버스 타입으로 등록
       */
      setPolotnoStore: (store) => {
        const { activeCanvasType } = get();
        get().setCanvas(activeCanvasType, store);
      },

      /**
       * 템플릿 변경
       */
      setTemplate: (templateId) => {
        const template = getTemplateById(templateId);
        set({ currentTemplate: template });

        const activeCanvas = get().getActiveCanvas();
        if (activeCanvas && activeCanvas.pages[0]) {
          activeCanvas.pages[0].set({
            width: template.width,
            height: template.height,
          });
        }
      },

      /**
       * 캔버스 크기 직접 조정
       */
      resizeCanvas: (width, height) => {
        const activeCanvas = get().getActiveCanvas();
        if (activeCanvas && activeCanvas.pages[0]) {
          activeCanvas.pages[0].set({
            width,
            height,
          });

          set({
            currentTemplate: {
              id: 'custom',
              name: '사용자 정의',
              description: `${width}x${height}px`,
              width,
              height,
              aspectRatio: `${width}:${height}`,
              icon: '⚙️',
            },
          });
        }
      },

      /**
       * 테마 변경
       */
      setTheme: (themeId) => {
        const theme = getThemeById(themeId);
        set({ currentTheme: theme });
        get().applyThemeToCanvas(theme);
      },

      /**
       * 테마를 캔버스에 적용
       */
      applyThemeToCanvas: (theme) => {
        const activeCanvas = get().getActiveCanvas();
        if (!activeCanvas || !activeCanvas.activePage) return;

        const activePage = activeCanvas.activePage;

        try {
          // 기존 배경 요소 제거
          const backgroundElements = activePage.children.filter(
            (el: any) => el.selectable === false && (el.type === 'svg' || el.type === 'rect')
          );
          backgroundElements.forEach((el: any) => el.remove());

          // 새 배경 추가
          const pageWidth = typeof activePage.width === 'number' ? activePage.width : 1080;
          const pageHeight = typeof activePage.height === 'number' ? activePage.height : 1920;
          const svgContent = generateGradientSVG(theme, pageWidth, pageHeight);

          activePage.addElement({
            type: 'svg',
            x: 0,
            y: 0,
            width: pageWidth,
            height: pageHeight,
            src: `data:image/svg+xml;base64,${btoa(svgContent)}`,
            selectable: false,
            alwaysOnTop: false,
          });

          // 배경을 맨 뒤로
          const newBackground = activePage.children.find(
            (el: any) => el.selectable === false && el.type === 'svg'
          );
          if (newBackground && typeof newBackground.moveDown === 'function') {
            const childrenCount = activePage.children.length;
            for (let i = 0; i < childrenCount; i++) {
              newBackground.moveDown();
            }
          }
        } catch (error) {
          console.error('[applyThemeToCanvas] Error applying theme:', error);
        }
      },
    }),
    {
      name: 'CanvasStore',
    }
  )
);

// ============================================================================
// 헬퍼 함수
// ============================================================================

/**
 * 캔버스 타입에 맞는 기본 크기 가져오기
 */
export function getCanvasSize(type: CanvasType): { width: number; height: number } {
  const config = CANVAS_CONFIGS[type];
  return { width: config.width, height: config.height };
}

/**
 * 캔버스 타입에 프리셋이 있는지 확인
 */
export function hasPresets(type: CanvasType): boolean {
  return Boolean(CANVAS_CONFIGS[type].presets?.length);
}

/**
 * 캔버스 타입의 프리셋 목록 가져오기
 */
export function getPresets(type: CanvasType) {
  return CANVAS_CONFIGS[type].presets || [];
}

// ============================================================================
// Selectors (하위 호환)
// ============================================================================

/**
 * 활성 캔버스의 Polotno Store를 가져오는 selector
 *
 * @example
 * // 기존 방식 (더 이상 동작하지 않음)
 * const polotnoStore = useCanvasStore((state) => state.polotnoStore);
 *
 * // 새로운 방식 1: selector 사용
 * const polotnoStore = useCanvasStore(selectActivePolotnoStore);
 *
 * // 새로운 방식 2: getActiveCanvas 사용
 * const store = useCanvasStore((state) => state.getActiveCanvas());
 */
export const selectActivePolotnoStore = (state: CanvasState): StoreType | null => {
  return state.canvases.get(state.activeCanvasType) || null;
};

/**
 * 특정 타입의 캔버스를 가져오는 selector 생성
 */
export const selectCanvasByType = (type: CanvasType) => (state: CanvasState): StoreType | null => {
  return state.canvases.get(type) || null;
};
