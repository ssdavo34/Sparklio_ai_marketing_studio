/**
 * Polotno Types
 *
 * Polotno SDK의 타입 정의
 * - any 타입 제거를 위한 인터페이스
 * - MobX Store tree 기반
 *
 * @author C팀 (Frontend Team)
 * @version 1.0
 * @date 2025-11-28
 * @reference https://polotno.com/docs
 */

// ============================================================================
// Core Types
// ============================================================================

export interface PolotnoElement {
  id: string;
  type: PolotnoElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  opacity?: number;
  selectable?: boolean;
  locked?: boolean;
  delete: () => void;
  set: (props: Partial<PolotnoElement>) => void;
  toJSON: () => any;
}

export type PolotnoElementType =
  | 'text'
  | 'image'
  | 'svg'
  | 'shape'
  | 'line'
  | 'video'
  | 'figure';

export interface PolotnoTextElement extends PolotnoElement {
  type: 'text';
  text: string;
  fontSize: number;
  fontFamily: string;
  fontWeight?: string | number;
  fontStyle?: 'normal' | 'italic';
  fill: string;
  align: 'left' | 'center' | 'right' | 'justify';
  lineHeight?: number;
  letterSpacing?: number;
}

export interface PolotnoImageElement extends PolotnoElement {
  type: 'image';
  src: string;
  cropX?: number;
  cropY?: number;
  cropWidth?: number;
  cropHeight?: number;
}

export interface PolotnoSVGElement extends PolotnoElement {
  type: 'svg';
  src: string;
  fill?: string;
}

export interface PolotnoPage {
  id: string;
  width: number;
  height: number;
  background?: string;
  children: PolotnoElement[];
  addElement: (config: PolotnoElementConfig) => PolotnoElement;
  remove: () => void;
  delete: () => void;
  toJSON: () => any;
  set: (props: Partial<PolotnoPageConfig>) => void;
}

export interface PolotnoElementConfig {
  type: PolotnoElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  opacity?: number;
  selectable?: boolean;
  locked?: boolean;

  // Text-specific
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string | number;
  fontStyle?: 'normal' | 'italic';
  fill?: string;
  align?: 'left' | 'center' | 'right' | 'justify';
  lineHeight?: number;
  letterSpacing?: number;

  // Image-specific
  src?: string;
  cropX?: number;
  cropY?: number;
  cropWidth?: number;
  cropHeight?: number;
}

export interface PolotnoPageConfig {
  width: number;
  height: number;
  background?: string;
}

// ============================================================================
// Store Types
// ============================================================================

export interface PolotnoStore {
  // Pages
  pages: PolotnoPage[];
  activePage: PolotnoPage | null;
  addPage: (config?: PolotnoPageConfig) => PolotnoPage;
  setPage: (pageId: string) => void;
  selectPage: (pageId: string) => void;
  deletePage: (pageId: string) => void;

  // Elements
  selectedElements: PolotnoElement[];
  selectElements: (elementIds: string[]) => void;
  deleteElements: (elementIds: string[]) => void;

  // State
  width: number;
  height: number;
  scale: number;
  zoomIn: () => void;
  zoomOut: () => void;
  zoomToFit: () => void;

  // History
  history: {
    canUndo: boolean;
    canRedo: boolean;
    undo: () => void;
    redo: () => void;
    clear: () => void;
  };

  // JSON
  toJSON: () => PolotnoJSON;
  loadJSON: (json: PolotnoJSON) => void;

  // Export
  toDataURL: (options?: ExportOptions) => Promise<string>;
  toBlob: (options?: ExportOptions) => Promise<Blob>;
}

export interface PolotnoJSON {
  width: number;
  height: number;
  pages: any[];
  fonts?: string[];
  unit?: 'px' | 'mm' | 'in';
}

export interface ExportOptions {
  pixelRatio?: number;
  mimeType?: 'image/png' | 'image/jpeg';
  quality?: number;
  pageId?: string;
}

// ============================================================================
// Store Creation
// ============================================================================

export interface PolotnoStoreConfig {
  key: string;
  showCredit?: boolean;
}

export type CreateStoreFunction = (config: PolotnoStoreConfig) => PolotnoStore;
