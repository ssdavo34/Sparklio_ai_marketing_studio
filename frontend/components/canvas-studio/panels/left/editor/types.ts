/**
 * Editor Panel Types
 *
 * 에디터 패널에서 사용하는 타입 정의
 *
 * @author C Team (Frontend Team)
 * @version 1.0
 */

import type { StoreType } from 'polotno/model/store';

// ============================================================================
// Element Types
// ============================================================================

export type ElementType = 'text' | 'image' | 'svg' | 'video' | 'line' | 'figure';

export interface CanvasElement {
  id: string;
  type: ElementType;
  name?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  opacity?: number;
  selectable?: boolean;
  // Text specific
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  fill?: string;
  align?: 'left' | 'center' | 'right';
  // Image specific
  src?: string;
  // SVG specific
  keepRatio?: boolean;
}

// ============================================================================
// Shape Types
// ============================================================================

export interface ShapeConfig {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  svg: string;
  defaultWidth: number;
  defaultHeight: number;
  defaultFill: string;
}

// ============================================================================
// Text Preset Types
// ============================================================================

export interface TextPreset {
  id: string;
  name: string;
  text: string;
  fontSize: number;
  fontWeight?: string;
  fontFamily?: string;
  fill?: string;
}

// ============================================================================
// Icon Types
// ============================================================================

export interface IconConfig {
  id: string;
  name: string;
  svg: string;
  category: string;
}

export type IconCategory = 'arrows' | 'social' | 'common' | 'business' | 'ui';

// ============================================================================
// Editor Tool Types
// ============================================================================

export type EditorToolId = 'shapes' | 'text' | 'images' | 'icons' | 'history';

export interface EditorTool {
  id: EditorToolId;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

// ============================================================================
// Editor Actions
// ============================================================================

export interface EditorActions {
  // Shape actions
  addShape: (shapeId: string) => void;

  // Text actions
  addText: (preset?: TextPreset) => void;

  // Image actions
  addImage: (src: string) => void;
  uploadImage: () => void;

  // Icon actions
  addIcon: (iconId: string) => void;

  // History actions
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;

  // Polotno store reference
  polotnoStore: StoreType | null;
}

// ============================================================================
// Section Props
// ============================================================================

export interface EditorSectionProps {
  isExpanded: boolean;
  onToggle: () => void;
  polotnoStore: StoreType | null;
}
