/**
 * Sample EditorDocument for Testing
 *
 * 테스트용 하드코딩 문서:
 * - 사각형 2개 (파란색, 주황색)
 * - 텍스트 1개 (헤드라인)
 */

import { v4 as uuidv4 } from 'uuid';
import type { EditorDocument, EditorPage, TextObject, ShapeObject } from '../types/document';

// ========================================
// Sample Objects
// ========================================

const textHeadline: TextObject = {
  id: uuidv4(),
  type: 'text',
  text: 'Sparklio Editor 2.0',
  x: 100,
  y: 50,
  width: 800,
  height: 80,
  rotation: 0,
  opacity: 1,
  visible: true,
  locked: false,
  zIndex: 3,
  fontSize: 64,
  fontFamily: 'Pretendard',
  fontWeight: 'bold',
  fill: '#1f2937',
  stroke: undefined,
  strokeWidth: 0,
  align: 'left',
  verticalAlign: 'top',
  lineHeight: 1.2,
  letterSpacing: 0,
  textBaseline: 'top',
  role: 'headline',
};

const rectBlue: ShapeObject = {
  id: uuidv4(),
  type: 'shape',
  shapeType: 'rect',
  x: 100,
  y: 200,
  width: 300,
  height: 200,
  rotation: 0,
  opacity: 1,
  visible: true,
  locked: false,
  zIndex: 1,
  fill: '#3b82f6',
  stroke: '#1e40af',
  strokeWidth: 4,
  cornerRadius: 12,
};

const rectOrange: ShapeObject = {
  id: uuidv4(),
  type: 'shape',
  shapeType: 'rect',
  x: 450,
  y: 250,
  width: 350,
  height: 180,
  rotation: -5,
  opacity: 0.9,
  visible: true,
  locked: false,
  zIndex: 2,
  fill: '#f97316',
  stroke: '#c2410c',
  strokeWidth: 3,
  cornerRadius: 8,
};

const circleGreen: ShapeObject = {
  id: uuidv4(),
  type: 'shape',
  shapeType: 'circle',
  x: 600,
  y: 500,
  width: 160, // 지름
  height: 160,
  rotation: 0,
  opacity: 1,
  visible: true,
  locked: false,
  zIndex: 4,
  fill: '#10b981',
  stroke: '#059669',
  strokeWidth: 3,
};

const textBody: TextObject = {
  id: uuidv4(),
  type: 'text',
  text: 'Konva + Zustand + React\nHeadless Architecture',
  x: 100,
  y: 480,
  width: 400,
  height: 100,
  rotation: 0,
  opacity: 1,
  visible: true,
  locked: false,
  zIndex: 5,
  fontSize: 24,
  fontFamily: 'Pretendard',
  fontWeight: 'normal',
  fill: '#4b5563',
  stroke: undefined,
  strokeWidth: 0,
  align: 'left',
  verticalAlign: 'top',
  lineHeight: 1.5,
  letterSpacing: 0,
  textBaseline: 'top',
  role: 'body',
};

// ========================================
// Sample Page
// ========================================

const samplePage: EditorPage = {
  id: uuidv4(),
  name: 'Page 1',
  width: 1080,
  height: 1350,
  background: {
    type: 'solid',
    color: '#ffffff',
  },
  objects: [
    rectBlue,
    rectOrange,
    textHeadline,
    circleGreen,
    textBody,
  ],
  order: 0,
};

// ========================================
// Sample Document
// ========================================

export const sampleDocument: EditorDocument = {
  id: uuidv4(),
  kind: 'product_detail',
  brandId: 'brand_sample_001',
  title: 'Sparklio Editor 2.0 - Test Document',
  pages: [samplePage],
  metadata: {
    tags: ['test', 'konva', 'poc'],
    description: 'Phase 1 Day 2 - First Rendering Test',
    thumbnail: undefined,
    version: '1.0.0',
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// ========================================
// Multi-Page Sample (for testing pagination)
// ========================================

const page2: EditorPage = {
  id: uuidv4(),
  name: 'Page 2',
  width: 1080,
  height: 1350,
  background: {
    type: 'solid',
    color: '#f3f4f6',
  },
  objects: [
    {
      ...textHeadline,
      id: uuidv4(),
      text: 'Page 2 - Multi Page Test',
      fill: '#7c3aed',
    },
    {
      ...rectBlue,
      id: uuidv4(),
      x: 200,
      y: 300,
      fill: '#8b5cf6',
    },
  ],
  order: 1,
};

export const multiPageDocument: EditorDocument = {
  ...sampleDocument,
  id: uuidv4(),
  title: 'Multi-Page Test Document',
  pages: [samplePage, page2],
};
