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
 */
export type StudioMode = 'planning' | 'editor' | 'video' | 'admin';

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
 * 캔버스 객체 기본 속성
 */
export interface CanvasObjectBase {
  id: string;
  type: CanvasObjectType;
  fabricObject?: any; // fabric.Object (Phase 3에서 추가)
  x: number;
  y: number;
  width?: number;
  height?: number;
  rotation?: number;
  opacity?: number;
  locked?: boolean;
  hidden?: boolean;
}

/**
 * 텍스트 객체
 */
export interface TextObject extends CanvasObjectBase {
  type: 'text';
  text: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: number | string;
  fill?: string;
  align?: 'left' | 'center' | 'right';
  lineHeight?: number;
  letterSpacing?: number;
}

/**
 * 도형 객체
 */
export interface ShapeObject extends CanvasObjectBase {
  type: 'shape';
  shapeType: 'rect' | 'circle' | 'line' | 'polygon';
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  cornerRadius?: number;
  radius?: number; // circle 전용
}

/**
 * 이미지 객체
 */
export interface ImageObject extends CanvasObjectBase {
  type: 'image';
  assetId?: string;
  src?: string;
  fit?: 'cover' | 'contain' | 'fill';
}

/**
 * 캔버스 객체 (Union Type)
 */
export type CanvasObject = TextObject | ShapeObject | ImageObject;

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
export type RightDockTabId = 'chat' | 'inspector' | 'layers' | 'data' | 'brand' | 'ai-settings';
