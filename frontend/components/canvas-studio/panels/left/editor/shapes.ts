/**
 * Shape Configurations
 *
 * 에디터에서 사용할 수 있는 도형 정의
 *
 * @author C Team (Frontend Team)
 * @version 1.0
 */

import { Square, Circle, Triangle, Star, Hexagon, Pentagon, Octagon, Diamond, Heart, Minus } from 'lucide-react';
import type { ShapeConfig } from './types';

// ============================================================================
// Basic Shapes
// ============================================================================

export const BASIC_SHAPES: ShapeConfig[] = [
  {
    id: 'rectangle',
    name: 'Rectangle',
    icon: Square,
    svg: '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="150"><rect width="200" height="150" fill="{fill}"/></svg>',
    defaultWidth: 200,
    defaultHeight: 150,
    defaultFill: '#4F46E5',
  },
  {
    id: 'square',
    name: 'Square',
    icon: Square,
    svg: '<svg xmlns="http://www.w3.org/2000/svg" width="150" height="150"><rect width="150" height="150" fill="{fill}"/></svg>',
    defaultWidth: 150,
    defaultHeight: 150,
    defaultFill: '#6366F1',
  },
  {
    id: 'circle',
    name: 'Circle',
    icon: Circle,
    svg: '<svg xmlns="http://www.w3.org/2000/svg" width="150" height="150"><circle cx="75" cy="75" r="75" fill="{fill}"/></svg>',
    defaultWidth: 150,
    defaultHeight: 150,
    defaultFill: '#10B981',
  },
  {
    id: 'ellipse',
    name: 'Ellipse',
    icon: Circle,
    svg: '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="120"><ellipse cx="100" cy="60" rx="100" ry="60" fill="{fill}"/></svg>',
    defaultWidth: 200,
    defaultHeight: 120,
    defaultFill: '#14B8A6',
  },
  {
    id: 'triangle',
    name: 'Triangle',
    icon: Triangle,
    svg: '<svg xmlns="http://www.w3.org/2000/svg" width="150" height="130"><polygon points="75,10 140,120 10,120" fill="{fill}"/></svg>',
    defaultWidth: 150,
    defaultHeight: 130,
    defaultFill: '#EAB308',
  },
  {
    id: 'star',
    name: 'Star',
    icon: Star,
    svg: '<svg xmlns="http://www.w3.org/2000/svg" width="150" height="150"><polygon points="75,10 90,55 135,55 100,85 115,130 75,105 35,130 50,85 15,55 60,55" fill="{fill}"/></svg>',
    defaultWidth: 150,
    defaultHeight: 150,
    defaultFill: '#EC4899',
  },
  {
    id: 'diamond',
    name: 'Diamond',
    icon: Diamond,
    svg: '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="150"><polygon points="60,10 110,75 60,140 10,75" fill="{fill}"/></svg>',
    defaultWidth: 120,
    defaultHeight: 150,
    defaultFill: '#8B5CF6',
  },
  {
    id: 'hexagon',
    name: 'Hexagon',
    icon: Hexagon,
    svg: '<svg xmlns="http://www.w3.org/2000/svg" width="150" height="130"><polygon points="37.5,10 112.5,10 150,65 112.5,120 37.5,120 0,65" fill="{fill}"/></svg>',
    defaultWidth: 150,
    defaultHeight: 130,
    defaultFill: '#F97316',
  },
  {
    id: 'pentagon',
    name: 'Pentagon',
    icon: Pentagon,
    svg: '<svg xmlns="http://www.w3.org/2000/svg" width="150" height="140"><polygon points="75,10 145,55 120,130 30,130 5,55" fill="{fill}"/></svg>',
    defaultWidth: 150,
    defaultHeight: 140,
    defaultFill: '#06B6D4',
  },
  {
    id: 'octagon',
    name: 'Octagon',
    icon: Octagon,
    svg: '<svg xmlns="http://www.w3.org/2000/svg" width="150" height="150"><polygon points="45,10 105,10 140,45 140,105 105,140 45,140 10,105 10,45" fill="{fill}"/></svg>',
    defaultWidth: 150,
    defaultHeight: 150,
    defaultFill: '#84CC16',
  },
  {
    id: 'heart',
    name: 'Heart',
    icon: Heart,
    svg: '<svg xmlns="http://www.w3.org/2000/svg" width="150" height="140" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="{fill}"/></svg>',
    defaultWidth: 150,
    defaultHeight: 140,
    defaultFill: '#EF4444',
  },
  {
    id: 'line-horizontal',
    name: 'Line',
    icon: Minus,
    svg: '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="10"><line x1="0" y1="5" x2="200" y2="5" stroke="{fill}" stroke-width="4"/></svg>',
    defaultWidth: 200,
    defaultHeight: 10,
    defaultFill: '#374151',
  },
];

// ============================================================================
// Arrow Shapes
// ============================================================================

export const ARROW_SHAPES: ShapeConfig[] = [
  {
    id: 'arrow-right',
    name: 'Arrow Right',
    icon: Square, // Will use custom SVG in UI
    svg: '<svg xmlns="http://www.w3.org/2000/svg" width="150" height="80"><polygon points="0,20 100,20 100,0 150,40 100,80 100,60 0,60" fill="{fill}"/></svg>',
    defaultWidth: 150,
    defaultHeight: 80,
    defaultFill: '#3B82F6',
  },
  {
    id: 'arrow-left',
    name: 'Arrow Left',
    icon: Square,
    svg: '<svg xmlns="http://www.w3.org/2000/svg" width="150" height="80"><polygon points="150,20 50,20 50,0 0,40 50,80 50,60 150,60" fill="{fill}"/></svg>',
    defaultWidth: 150,
    defaultHeight: 80,
    defaultFill: '#3B82F6',
  },
  {
    id: 'arrow-up',
    name: 'Arrow Up',
    icon: Square,
    svg: '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="150"><polygon points="20,150 20,50 0,50 40,0 80,50 60,50 60,150" fill="{fill}"/></svg>',
    defaultWidth: 80,
    defaultHeight: 150,
    defaultFill: '#3B82F6',
  },
  {
    id: 'arrow-down',
    name: 'Arrow Down',
    icon: Square,
    svg: '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="150"><polygon points="20,0 20,100 0,100 40,150 80,100 60,100 60,0" fill="{fill}"/></svg>',
    defaultWidth: 80,
    defaultHeight: 150,
    defaultFill: '#3B82F6',
  },
];

// ============================================================================
// Callout Shapes
// ============================================================================

export const CALLOUT_SHAPES: ShapeConfig[] = [
  {
    id: 'speech-bubble',
    name: 'Speech Bubble',
    icon: Square,
    svg: '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="150"><path d="M10,10 h180 a10,10 0 0 1 10,10 v80 a10,10 0 0 1 -10,10 h-120 l-20,30 l0,-30 h-40 a10,10 0 0 1 -10,-10 v-80 a10,10 0 0 1 10,-10" fill="{fill}"/></svg>',
    defaultWidth: 200,
    defaultHeight: 150,
    defaultFill: '#F3F4F6',
  },
  {
    id: 'rounded-rectangle',
    name: 'Rounded Rectangle',
    icon: Square,
    svg: '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="120"><rect width="200" height="120" rx="20" ry="20" fill="{fill}"/></svg>',
    defaultWidth: 200,
    defaultHeight: 120,
    defaultFill: '#E0E7FF',
  },
];

// ============================================================================
// All Shapes Combined
// ============================================================================

export const ALL_SHAPES = [...BASIC_SHAPES, ...ARROW_SHAPES, ...CALLOUT_SHAPES];

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * SVG 템플릿에서 색상을 대체
 */
export function generateShapeSVG(shape: ShapeConfig, fill?: string): string {
  const fillColor = fill || shape.defaultFill;
  return shape.svg.replace(/{fill}/g, fillColor);
}

/**
 * SVG를 Data URI로 변환
 */
export function svgToDataUri(svg: string): string {
  return 'data:image/svg+xml;base64,' + btoa(svg);
}

/**
 * Shape ID로 Shape 찾기
 */
export function getShapeById(shapeId: string): ShapeConfig | undefined {
  return ALL_SHAPES.find((shape) => shape.id === shapeId);
}
