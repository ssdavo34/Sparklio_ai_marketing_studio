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

// ============================================================================
// 멀티 캔버스 타입 (2025-12-01 추가)
// ============================================================================

/**
 * 캔버스 타입 (8개)
 * 각 탭이 독립적인 캔버스를 가짐
 */
export type CanvasType =
  | 'brand-dna'      // Brand Kit (1080x1920)
  | 'meeting'        // Meeting AI (1920x1080)
  | 'concept'        // ConceptBoard (1080x1080)
  | 'presentation'   // Presentation (1920x1080, 프리셋)
  | 'detail'         // 상세페이지 (860x가변)
  | 'sns'            // SNS 광고 (페이지별 다름)
  | 'video'          // 영상 (1080x1920, 프리셋)
  | 'image';         // 이미지 (자유)

/**
 * 캔버스 기본 설정
 */
export interface CanvasConfig {
  type: CanvasType;
  width: number;
  height: number;
  allowResize: boolean;
  presets?: CanvasPreset[];
}

/**
 * 캔버스 크기 프리셋
 */
export interface CanvasPreset {
  id: string;
  name: string;
  width: number;
  height: number;
}

/**
 * 캔버스 기본 설정값
 */
export const CANVAS_CONFIGS: Record<CanvasType, CanvasConfig> = {
  'brand-dna': {
    type: 'brand-dna',
    width: 1080,
    height: 1920,
    allowResize: false,
  },
  'meeting': {
    type: 'meeting',
    width: 1920,
    height: 1080,
    allowResize: false,
  },
  'concept': {
    type: 'concept',
    width: 1080,
    height: 1080,
    allowResize: false,
  },
  'presentation': {
    type: 'presentation',
    width: 1920,
    height: 1080,
    allowResize: false,
    presets: [
      { id: '16:9', name: '16:9 (와이드)', width: 1920, height: 1080 },
      { id: '4:3', name: '4:3 (표준)', width: 1024, height: 768 },
    ],
  },
  'detail': {
    type: 'detail',
    width: 860,
    height: 3000, // 가변 높이, 초기값
    allowResize: false, // 폭 고정, 높이만 가변
  },
  'sns': {
    type: 'sns',
    width: 1080,
    height: 1080,
    allowResize: false,
    presets: [
      { id: 'ig-feed', name: 'Instagram Feed', width: 1080, height: 1080 },
      { id: 'ig-story', name: 'Instagram Story', width: 1080, height: 1920 },
      { id: 'fb-post', name: 'Facebook Post', width: 1200, height: 630 },
      { id: 'yt-shorts', name: 'YouTube Shorts', width: 1080, height: 1920 },
      { id: 'yt-thumb', name: 'YouTube Thumbnail', width: 1280, height: 720 },
    ],
  },
  'video': {
    type: 'video',
    width: 1080,
    height: 1920,
    allowResize: false,
    presets: [
      { id: '9:16', name: '세로 (9:16)', width: 1080, height: 1920 },
      { id: '16:9', name: '가로 (16:9)', width: 1920, height: 1080 },
      { id: '1:1', name: '정사각 (1:1)', width: 1080, height: 1080 },
    ],
  },
  'image': {
    type: 'image',
    width: 1080,
    height: 1080,
    allowResize: true, // 자유 크기
  },
};
