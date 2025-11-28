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
import type { CanvasTemplate, PlatformType } from '@/types/canvas-templates';
import { getDefaultTemplate, getTemplateById } from '@/types/canvas-templates';
import type { ColorTheme, ThemeType } from '@/types/color-themes';
import { getDefaultTheme, getThemeById, generateGradientSVG } from '@/types/color-themes';
import type { StoreType } from 'polotno/model/store';

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
  polotnoStore: StoreType | null; // polotno Store

  // Canvas Template
  currentTemplate: CanvasTemplate;

  // Color Theme
  currentTheme: ColorTheme;

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

      currentTemplate: getDefaultTemplate(),
      currentTheme: getDefaultTheme(),

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

      // ========================================
      // Template Actions
      // ========================================

      /**
       * 템플릿 변경
       * - 캔버스 크기 자동 조정
       */
      setTemplate: (templateId) => {
        const template = getTemplateById(templateId);
        set({ currentTemplate: template });

        // Polotno Store의 페이지 크기 변경
        const { polotnoStore } = get();
        if (polotnoStore && polotnoStore.pages[0]) {
          polotnoStore.pages[0].set({
            width: template.width,
            height: template.height,
          });
        }
      },

      /**
       * 캔버스 크기 직접 조정
       * - 커스텀 크기 설정 시 사용
       */
      resizeCanvas: (width, height) => {
        const { polotnoStore } = get();
        if (polotnoStore && polotnoStore.pages[0]) {
          polotnoStore.pages[0].set({
            width,
            height,
          });

          // currentTemplate 업데이트 (커스텀으로)
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

      // ========================================
      // Theme Actions
      // ========================================

      /**
       * 테마 변경
       * - 캔버스 배경 색상 자동 변경
       */
      setTheme: (themeId) => {
        const theme = getThemeById(themeId);
        set({ currentTheme: theme });
        get().applyThemeToCanvas(theme);
      },

      /**
       * 테마를 캔버스에 적용
       * - 기존 배경 요소 제거 후 새 테마 적용
       */
      applyThemeToCanvas: (theme) => {
        const { polotnoStore } = get();
        if (!polotnoStore || !polotnoStore.activePage) return;

        const activePage = polotnoStore.activePage;

        try {
          // 기존 배경 요소 찾기 (selectable: false인 SVG/Rectangle)
          const backgroundElements = activePage.children.filter(
            (el: any) => el.selectable === false && (el.type === 'svg' || el.type === 'rect')
          );

          // 기존 배경 요소 제거
          backgroundElements.forEach((el: any) => el.remove());

          // 새 배경 추가 (width/height가 숫자인 경우만)
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

          // 배경을 맨 뒤로 보내기 (Polotno API 사용)
          const newBackground = activePage.children.find(
            (el: any) => el.selectable === false && el.type === 'svg'
          );
          if (newBackground && typeof newBackground.moveDown === 'function') {
            // moveDown을 여러 번 호출하여 맨 뒤로 보내기
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
      name: 'CanvasStore', // DevTools 이름
    }
  )
);
