# Konva.js 마이그레이션 계획서

**작성일**: 2025-11-18 23:30 KST
**예상 작업 기간**: 1-2일
**목표**: Fabric.js → Konva.js + Zustand + React 완전 전환

---

## 🎯 마이그레이션 목표

1. **Fabric.js 완전 제거** (textBaseline 버그, 렌더링 버그 해결)
2. **React 친화적 아키텍처** 구축 (react-konva 사용)
3. **안정적인 Undo/Redo** 구현 (Zustand 히스토리)
4. **Backend Generate API 완벽 통합** (textBaseline 버그 해결)

---

## 📦 설치할 패키지

```bash
# Konva.js 및 React 통합
npm install konva react-konva

# TypeScript 타입
npm install --save-dev @types/react-konva

# Zustand는 이미 설치됨
# "zustand": "^5.0.8" (package.json 확인 완료)
```

---

## 🏗️ 새로운 아키텍처

### 폴더 구조

```
components/canvas-studio-v2/        # 새로운 Konva 기반 에디터
├── KonvaCanvas.tsx                 # 메인 Canvas 컴포넌트 (Stage + Layer)
├── shapes/                         # 도형 컴포넌트
│   ├── RectangleShape.tsx
│   ├── CircleShape.tsx
│   ├── TriangleShape.tsx
│   └── TextShape.tsx
├── stores/
│   └── konvaCanvasStore.ts         # Zustand 상태 관리
├── hooks/
│   ├── useCanvasHistory.ts         # Undo/Redo 훅
│   ├── useShapeManagement.ts       # 도형 CRUD 훅
│   └── useKeyboardShortcuts.ts     # Ctrl+Z, Ctrl+C 등
├── adapters/
│   ├── backendToKonva.ts           # Backend JSON → Konva Shapes
│   └── konvaToBackend.ts           # Konva Shapes → Backend JSON
├── components/
│   ├── ToolbarKonva.tsx            # 도구 모음
│   ├── LayersPanelKonva.tsx        # 레이어 패널
│   └── InspectorPanelKonva.tsx     # 속성 패널
└── types.ts                        # TypeScript 타입 정의
```

### 기존 Fabric.js 코드 처리

```
components/canvas-studio/           # 기존 Fabric.js 코드
├── (보존하되 사용 안 함)
└── 참고용으로 유지, 나중에 삭제
```

---

## 🔧 Zustand Store 설계

```typescript
// konvaCanvasStore.ts

export interface Shape {
  id: string;                    // UUID
  type: 'rect' | 'circle' | 'triangle' | 'text';
  x: number;
  y: number;
  width?: number;                // rect, text
  height?: number;
  radius?: number;               // circle
  sides?: number;                // triangle
  rotation: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  text?: string;                 // text only
  fontSize?: number;
  fontFamily?: string;
  draggable: boolean;
  opacity: number;
}

export interface CanvasState {
  // Canvas 상태
  shapes: Shape[];
  selectedIds: string[];
  stageWidth: number;
  stageHeight: number;
  stageScale: number;
  stageX: number;
  stageY: number;

  // 히스토리 (Undo/Redo)
  history: Shape[][];            // 과거 상태들
  historyIndex: number;          // 현재 위치
  maxHistory: number;            // 최대 50개

  // Clipboard
  clipboard: Shape | null;

  // Actions
  addShape: (shape: Omit<Shape, 'id'>) => void;
  updateShape: (id: string, updates: Partial<Shape>) => void;
  removeShape: (id: string) => void;
  removeShapes: (ids: string[]) => void;

  selectShape: (id: string) => void;
  selectShapes: (ids: string[]) => void;
  deselectAll: () => void;

  duplicateSelected: () => void;
  deleteSelected: () => void;

  copySelected: () => void;
  paste: () => void;

  undo: () => void;
  redo: () => void;

  setStageSize: (width: number, height: number) => void;
  setStageTransform: (x: number, y: number, scale: number) => void;

  // 히스토리 저장 (내부용)
  saveHistory: () => void;
}
```

---

## 📝 구현 단계별 가이드

### Phase 1: 기본 설정 (30분)

**파일**: `components/canvas-studio-v2/KonvaCanvas.tsx`

```tsx
'use client';

import { Stage, Layer } from 'react-konva';
import { useCanvasStore } from './stores/konvaCanvasStore';

export function KonvaCanvas() {
  const { stageWidth, stageHeight, stageScale, stageX, stageY, shapes } = useCanvasStore();

  return (
    <Stage
      width={stageWidth}
      height={stageHeight}
      scaleX={stageScale}
      scaleY={stageScale}
      x={stageX}
      y={stageY}
    >
      <Layer>
        {shapes.map((shape) => {
          if (shape.type === 'rect') {
            return <RectangleShape key={shape.id} shape={shape} />;
          }
          // ... 다른 도형들
        })}
      </Layer>
    </Stage>
  );
}
```

### Phase 2: 도형 컴포넌트 (1시간)

**파일**: `components/canvas-studio-v2/shapes/RectangleShape.tsx`

```tsx
'use client';

import { Rect, Transformer } from 'react-konva';
import { useRef, useEffect } from 'react';
import { useCanvasStore } from '../stores/konvaCanvasStore';
import type { Shape } from '../types';

interface Props {
  shape: Shape;
}

export function RectangleShape({ shape }: Props) {
  const shapeRef = useRef<any>(null);
  const transformerRef = useRef<any>(null);
  const { selectedIds, updateShape, selectShape } = useCanvasStore();

  const isSelected = selectedIds.includes(shape.id);

  useEffect(() => {
    if (isSelected && transformerRef.current && shapeRef.current) {
      transformerRef.current.nodes([shapeRef.current]);
      transformerRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);

  return (
    <>
      <Rect
        ref={shapeRef}
        id={shape.id}
        x={shape.x}
        y={shape.y}
        width={shape.width}
        height={shape.height}
        fill={shape.fill}
        stroke={shape.stroke}
        strokeWidth={shape.strokeWidth}
        rotation={shape.rotation}
        draggable={shape.draggable}
        opacity={shape.opacity}
        onClick={() => selectShape(shape.id)}
        onDragEnd={(e) => {
          updateShape(shape.id, {
            x: e.target.x(),
            y: e.target.y(),
          });
        }}
        onTransformEnd={(e) => {
          const node = shapeRef.current;
          const scaleX = node.scaleX();
          const scaleY = node.scaleY();

          updateShape(shape.id, {
            x: node.x(),
            y: node.y(),
            width: Math.max(5, node.width() * scaleX),
            height: Math.max(5, node.height() * scaleY),
            rotation: node.rotation(),
          });

          node.scaleX(1);
          node.scaleY(1);
        }}
      />
      {isSelected && <Transformer ref={transformerRef} />}
    </>
  );
}
```

### Phase 3: Zustand Store 구현 (1시간)

**파일**: `components/canvas-studio-v2/stores/konvaCanvasStore.ts`

```typescript
import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { Shape, CanvasState } from '../types';

export const useCanvasStore = create<CanvasState>((set, get) => ({
  shapes: [],
  selectedIds: [],
  stageWidth: 800,
  stageHeight: 600,
  stageScale: 1,
  stageX: 0,
  stageY: 0,
  history: [[]],
  historyIndex: 0,
  maxHistory: 50,
  clipboard: null,

  addShape: (shapeData) => {
    const shape: Shape = {
      ...shapeData,
      id: uuidv4(),
    };
    set((state) => ({
      shapes: [...state.shapes, shape],
    }));
    get().saveHistory();
  },

  updateShape: (id, updates) => {
    set((state) => ({
      shapes: state.shapes.map((s) =>
        s.id === id ? { ...s, ...updates } : s
      ),
    }));
    get().saveHistory();
  },

  removeShape: (id) => {
    set((state) => ({
      shapes: state.shapes.filter((s) => s.id !== id),
      selectedIds: state.selectedIds.filter((sid) => sid !== id),
    }));
    get().saveHistory();
  },

  selectShape: (id) => {
    set({ selectedIds: [id] });
  },

  deselectAll: () => {
    set({ selectedIds: [] });
  },

  deleteSelected: () => {
    const { selectedIds } = get();
    set((state) => ({
      shapes: state.shapes.filter((s) => !selectedIds.includes(s.id)),
      selectedIds: [],
    }));
    get().saveHistory();
  },

  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex <= 0) return;

    const newIndex = historyIndex - 1;
    set({
      shapes: JSON.parse(JSON.stringify(history[newIndex])),
      historyIndex: newIndex,
    });
  },

  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex >= history.length - 1) return;

    const newIndex = historyIndex + 1;
    set({
      shapes: JSON.parse(JSON.stringify(history[newIndex])),
      historyIndex: newIndex,
    });
  },

  saveHistory: () => {
    const { shapes, history, historyIndex, maxHistory } = get();
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(JSON.parse(JSON.stringify(shapes)));

    if (newHistory.length > maxHistory) {
      newHistory.shift();
    } else {
      set({ historyIndex: historyIndex + 1 });
    }

    set({ history: newHistory });
  },

  // ... 나머지 actions
}));
```

### Phase 4: Backend 통합 (1시간)

**파일**: `components/canvas-studio-v2/adapters/backendToKonva.ts`

```typescript
import type { GenerateResponse } from '@/lib/api/types';
import type { Shape } from '../types';

export function convertBackendToKonvaShapes(response: GenerateResponse): Shape[] {
  const { canvas_json } = response.document;

  if (!canvas_json || !Array.isArray(canvas_json.objects)) {
    return [];
  }

  return canvas_json.objects.map((obj: any) => {
    // Fabric.js JSON → Konva Shape 변환
    const baseShape = {
      id: obj.id || uuidv4(),
      x: obj.left || 0,
      y: obj.top || 0,
      rotation: obj.angle || 0,
      fill: obj.fill || '#000000',
      stroke: obj.stroke || '#000000',
      strokeWidth: obj.strokeWidth || 0,
      draggable: true,
      opacity: obj.opacity || 1,
    };

    switch (obj.type) {
      case 'rect':
        return {
          ...baseShape,
          type: 'rect' as const,
          width: obj.width || 100,
          height: obj.height || 100,
        };
      case 'circle':
        return {
          ...baseShape,
          type: 'circle' as const,
          radius: obj.radius || 50,
        };
      case 'text':
      case 'i-text':
        return {
          ...baseShape,
          type: 'text' as const,
          text: obj.text || '',
          fontSize: obj.fontSize || 16,
          fontFamily: obj.fontFamily || 'Arial',
          width: obj.width || 200,
        };
      default:
        return null;
    }
  }).filter(Boolean) as Shape[];
}
```

---

## ✅ 마이그레이션 체크리스트

### 설치 및 설정
- [ ] `npm install konva react-konva @types/react-konva`
- [ ] `components/canvas-studio-v2/` 폴더 생성
- [ ] `types.ts` 타입 정의 작성

### 기본 Canvas
- [ ] `KonvaCanvas.tsx` - Stage, Layer 설정
- [ ] Zustand Store 기본 구조 (`konvaCanvasStore.ts`)
- [ ] 초기 렌더링 테스트 (빈 Canvas 표시)

### 도형 기능
- [ ] `RectangleShape.tsx` - 사각형
- [ ] `CircleShape.tsx` - 원
- [ ] `TriangleShape.tsx` - 삼각형 (Polygon 사용)
- [ ] `TextShape.tsx` - 텍스트
- [ ] 도형 추가 버튼 연동

### 상호작용
- [ ] 도형 선택 (클릭)
- [ ] 도형 이동 (드래그)
- [ ] 도형 크기 조절 (Transformer)
- [ ] 도형 회전

### 편집 기능
- [ ] Undo/Redo (Ctrl+Z, Ctrl+Shift+Z)
- [ ] Copy/Paste (Ctrl+C, Ctrl+V)
- [ ] Delete (Delete 키)
- [ ] Duplicate (Ctrl+D)

### UI 패널
- [ ] `ToolbarKonva.tsx` - 도형 추가 버튼
- [ ] `LayersPanelKonva.tsx` - 레이어 목록
- [ ] `InspectorPanelKonva.tsx` - 속성 편집

### Backend 통합
- [ ] `backendToKonva.ts` - Backend JSON → Konva Shapes
- [ ] `konvaToBackend.ts` - Konva Shapes → Backend JSON
- [ ] Generate API 통합 테스트
- [ ] textBaseline 버그 해결 확인

### 최종 테스트
- [ ] 도형 3개 추가 → 모두 보이는가?
- [ ] Undo/Redo 5회 → 정확히 작동하는가?
- [ ] Backend Generate → 데이터 정확히 로드되는가?
- [ ] Layers Panel → 순서 변경 작동하는가?
- [ ] Copy/Paste → 위치 정확한가?

---

## 🎓 참고 자료

### Konva.js
- 공식 사이트: https://konvajs.org/
- React 통합: https://konvajs.org/docs/react/Intro.html
- API 문서: https://konvajs.org/api/Konva.html

### React-Konva 예제
- Drag and Drop: https://konvajs.org/docs/react/Drag_And_Drop.html
- Transformer: https://konvajs.org/docs/react/Transformer.html
- Events: https://konvajs.org/docs/react/Events.html

### Zustand
- 공식 문서: https://github.com/pmndrs/zustand
- TypeScript: https://github.com/pmndrs/zustand#typescript

---

**작성 완료**: 2025-11-18 23:30 KST
**예상 완료일**: 2025-11-20 (목)
