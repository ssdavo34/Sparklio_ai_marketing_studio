/**
 * Canvas Studio Store Types
 *
 * 모든 Store에서 사용하는 공통 타입 정의
 *
 * @author C팀 (Frontend Team)
 * @version 3.0
 */

// ============================================================================
// 모드 관련 타입
// ============================================================================

/**
 * Studio 작업 모드
 * - concept-board: 컨셉보드 (무드보드, 이미지/색상/키워드 수집)
 * - pitch-deck: 프리젠테이션 (슬라이드 형식)
 * - product-story: 상품상세 페이지 (세로 스크롤)
 * - brand-dna: 브랜드 DNA (P1에서 추가)
 * - ad-studio: 광고 스튜디오 (P1에서 추가)
 */
export type StudioMode =
  | 'concept-board'
  | 'pitch-deck'
  | 'product-story'
  | 'brand-dna'
  | 'ad-studio';

/**
 * 뷰 모드
 * - studio: 모든 패널 표시 (기본)
 * - canvas-focus: 캔버스만 전체 화면
 * - chat-focus: Chat 중심 모드 (우측 Dock 확대)
 */
export type ViewMode = 'studio' | 'canvas-focus' | 'chat-focus';

// ============================================================================
// 캔버스 객체 타입
// ============================================================================

/**
 * 캔버스 객체 타입
 */
export type CanvasObjectType = 'text' | 'image' | 'shape' | 'table' | 'chart';

/**
 * 캔버스 객체
 */
export interface CanvasObject {
  id: string;
  type: CanvasObjectType;
  fabricObject?: any; // fabric.Object (Phase 3에서 추가)
  props: Record<string, any>;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  locked: boolean;
  hidden: boolean;
}

// ============================================================================
// 페이지 관련 타입
// ============================================================================

/**
 * 페이지
 */
export interface Page {
  id: string;
  title: string;
  order: number;
  thumbnailUrl?: string;
  objects: CanvasObject[];
  canvasJson?: string; // Fabric.js JSON (Phase 3에서 추가)
  width: number;
  height: number;
}

// ============================================================================
// 문서 관련 타입
// ============================================================================

/**
 * 문서
 */
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

// ============================================================================
// Right Dock 탭 타입
// ============================================================================

/**
 * Right Dock 탭 ID
 */
export type RightDockTabId = 'chat' | 'inspector' | 'layers' | 'data' | 'brand';
