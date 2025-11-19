# Canvas Studio v3 — Phase 1 Implementation Guide

**관련 문서**: [000_MASTER_PLAN.md](./000_MASTER_PLAN.md), [001_ARCHITECTURE.md](./001_ARCHITECTURE.md), [002_DATA_MODEL.md](./002_DATA_MODEL.md)
**작성일**: 2025-11-19
**목표**: Professional Editor Core 완성

---

## 📋 Phase 1 목표

**"전문가급 편집 도구 구현"**

### 완료 기준

- [ ] 레이어 패널 (계층 구조 표시)
- [ ] 그룹/언그룹 기능
- [ ] 정렬/분배 도구
- [ ] 스마트 가이드 (Smart Guides)
- [ ] 다중 선택 영역 (Marquee Selection)
- [ ] 리치 텍스트 에디터
- [ ] 이미지 업로드 시스템
- [ ] 도형 라이브러리

### 우선순위

**P0 (즉시 구현)**: 레이어 패널, 정렬/분배, 스마트 가이드, 그룹
**P1 (1주일 내)**: 다중 선택, 리치 텍스트, 이미지 업로드
**P2 (2주일 내)**: 도형 라이브러리, 고급 변형

---

## 1. 레이어 패널 (Layers Panel)

### 목표

**"Figma/Photoshop 수준의 레이어 관리"**

### 파일 구조

```
components/canvas-studio/layout/RightDock/tabs/LayersTab/
├── LayersTab.tsx           # 메인 컴포넌트
├── LayerTree.tsx           # 트리 구조
├── LayerItem.tsx           # 개별 레이어
├── LayerContextMenu.tsx    # 우클릭 메뉴
└── styles.module.css       # 스타일
```

### 구현 계획

#### 1.1 LayersTab.tsx

```typescript
'use client';

import { useEditorStore } from '@/components/canvas-studio/stores/useEditorStore';
import { LayerTree } from './LayerTree';
import { Search, Eye, Lock, Layers as LayersIcon } from 'lucide-react';

export function LayersTab() {
  const { document: doc, activePageId } = useEditorStore();
  const activePage = doc?.pages.find(p => p.id === activePageId);

  if (!activePage) {
    return (
      <div className="p-4 text-center text-gray-400">
        No active page
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-3 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-gray-700">
            Layers
          </h3>
          <div className="flex gap-1">
            <button className="p-1.5 hover:bg-gray-100 rounded">
              <Eye className="w-4 h-4" />
            </button>
            <button className="p-1.5 hover:bg-gray-100 rounded">
              <Lock className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search layers..."
            className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded"
          />
        </div>
      </div>

      {/* Layer Tree */}
      <div className="flex-1 overflow-y-auto">
        <LayerTree objects={activePage.objects} />
      </div>

      {/* Footer */}
      <div className="p-2 border-t border-gray-200 flex gap-1">
        <button className="flex-1 p-1.5 text-xs hover:bg-gray-100 rounded">
          + Add Layer
        </button>
        <button className="p-1.5 hover:bg-gray-100 rounded">
          <LayersIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
```

#### 1.2 LayerItem.tsx

```typescript
'use client';

import { useState } from 'react';
import { useEditorStore } from '@/components/canvas-studio/stores/useEditorStore';
import { EditorObject } from '@/components/canvas-studio/types/document';
import { Eye, EyeOff, Lock, Unlock, ChevronRight, ChevronDown } from 'lucide-react';
import { isGroupObject } from '@/components/canvas-studio/types/document';

interface LayerItemProps {
  object: EditorObject;
  depth?: number;
}

export function LayerItem({ object, depth = 0 }: LayerItemProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const {
    selectedIds,
    selectObject,
    updateObject,
  } = useEditorStore();

  const isSelected = selectedIds.includes(object.id);
  const isGroup = isGroupObject(object);

  return (
    <div>
      <div
        className={`
          flex items-center px-2 py-1.5 hover:bg-gray-50 cursor-pointer
          ${isSelected ? 'bg-blue-50 border-l-2 border-blue-500' : ''}
        `}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={() => selectObject(object.id)}
      >
        {/* Expand/Collapse */}
        {isGroup && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="mr-1"
          >
            {isExpanded ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronRight className="w-3 h-3" />
            )}
          </button>
        )}

        {/* Icon */}
        <div className="mr-2 w-4 h-4 flex items-center justify-center">
          {getObjectIcon(object.type)}
        </div>

        {/* Name */}
        <div className="flex-1 text-sm truncate">
          {object.name || `${object.type} ${object.id.slice(0, 4)}`}
        </div>

        {/* Visibility */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            updateObject(object.id, { visible: !object.visible });
          }}
          className="mr-1"
        >
          {object.visible ? (
            <Eye className="w-3 h-3 text-gray-400" />
          ) : (
            <EyeOff className="w-3 h-3 text-gray-400" />
          )}
        </button>

        {/* Lock */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            updateObject(object.id, { locked: !object.locked });
          }}
        >
          {object.locked ? (
            <Lock className="w-3 h-3 text-gray-400" />
          ) : (
            <Unlock className="w-3 h-3 text-gray-400" />
          )}
        </button>
      </div>

      {/* Children (for groups) */}
      {isGroup && isExpanded && (
        <div>
          {object.children.map(child => (
            <LayerItem
              key={child.id}
              object={child}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function getObjectIcon(type: string) {
  switch (type) {
    case 'text': return <span className="text-xs">T</span>;
    case 'image': return <span className="text-xs">📷</span>;
    case 'shape': return <span className="text-xs">▢</span>;
    case 'group': return <span className="text-xs">📁</span>;
    default: return <span className="text-xs">?</span>;
  }
}
```

---

## 2. 정렬/분배 도구 (Alignment & Distribution)

### 목표

**"여러 객체를 정밀하게 정렬/분배"**

### 파일 구조

```
components/canvas-studio/features/alignment/
├── AlignmentToolbar.tsx     # 툴바 UI
├── alignmentUtils.ts         # 정렬 계산 로직
└── types.ts                  # 타입 정의
```

### 구현 계획

#### 2.1 alignmentUtils.ts

```typescript
import { EditorObject } from '@/components/canvas-studio/types/document';

export type AlignmentType =
  | 'left' | 'center' | 'right'
  | 'top' | 'middle' | 'bottom';

export type DistributionType =
  | 'horizontal' | 'vertical';

/**
 * 객체들을 정렬
 */
export function alignObjects(
  objects: EditorObject[],
  type: AlignmentType
): EditorObject[] {
  if (objects.length === 0) return objects;

  // Bounding box 계산
  const bounds = getBoundingBox(objects);

  return objects.map(obj => {
    const updates: Partial<EditorObject> = {};

    switch (type) {
      case 'left':
        updates.x = bounds.minX;
        break;
      case 'center':
        updates.x = bounds.centerX - (obj.width || 0) / 2;
        break;
      case 'right':
        updates.x = bounds.maxX - (obj.width || 0);
        break;
      case 'top':
        updates.y = bounds.minY;
        break;
      case 'middle':
        updates.y = bounds.centerY - (obj.height || 0) / 2;
        break;
      case 'bottom':
        updates.y = bounds.maxY - (obj.height || 0);
        break;
    }

    return { ...obj, ...updates };
  });
}

/**
 * 객체들을 균등 분배
 */
export function distributeObjects(
  objects: EditorObject[],
  type: DistributionType
): EditorObject[] {
  if (objects.length < 3) return objects;

  // 정렬 순서대로 정렬
  const sorted = [...objects].sort((a, b) => {
    return type === 'horizontal'
      ? a.x - b.x
      : a.y - b.y;
  });

  const bounds = getBoundingBox(sorted);
  const totalSize = sorted.reduce((sum, obj) => {
    return sum + (type === 'horizontal'
      ? (obj.width || 0)
      : (obj.height || 0));
  }, 0);

  const availableSpace = type === 'horizontal'
    ? bounds.maxX - bounds.minX - totalSize
    : bounds.maxY - bounds.minY - totalSize;

  const gap = availableSpace / (sorted.length - 1);

  let currentPos = type === 'horizontal'
    ? sorted[0].x
    : sorted[0].y;

  return sorted.map(obj => {
    const updates: Partial<EditorObject> = {};

    if (type === 'horizontal') {
      updates.x = currentPos;
      currentPos += (obj.width || 0) + gap;
    } else {
      updates.y = currentPos;
      currentPos += (obj.height || 0) + gap;
    }

    return { ...obj, ...updates };
  });
}

/**
 * Bounding Box 계산
 */
function getBoundingBox(objects: EditorObject[]) {
  const xs = objects.map(o => o.x);
  const ys = objects.map(o => o.y);
  const rights = objects.map(o => o.x + (o.width || 0));
  const bottoms = objects.map(o => o.y + (o.height || 0));

  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const maxX = Math.max(...rights);
  const maxY = Math.max(...bottoms);

  return {
    minX,
    minY,
    maxX,
    maxY,
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2,
  };
}
```

#### 2.2 AlignmentToolbar.tsx

```typescript
'use client';

import { useEditorStore } from '@/components/canvas-studio/stores/useEditorStore';
import { alignObjects, distributeObjects } from './alignmentUtils';
import {
  AlignLeft, AlignCenter, AlignRight,
  AlignTop, AlignMiddle, AlignBottom,
  DistributeHorizontal, DistributeVertical
} from 'lucide-react';

export function AlignmentToolbar() {
  const { document: doc, activePageId, selectedIds, updateObject } = useEditorStore();

  const activePage = doc?.pages.find(p => p.id === activePageId);
  const selectedObjects = activePage?.objects.filter(o => selectedIds.includes(o.id)) || [];

  const disabled = selectedObjects.length < 2;

  const handleAlign = (type: string) => {
    const aligned = alignObjects(selectedObjects, type as any);
    aligned.forEach(obj => {
      updateObject(obj.id, { x: obj.x, y: obj.y });
    });
  };

  const handleDistribute = (type: 'horizontal' | 'vertical') => {
    const distributed = distributeObjects(selectedObjects, type);
    distributed.forEach(obj => {
      updateObject(obj.id, { x: obj.x, y: obj.y });
    });
  };

  return (
    <div className="flex items-center gap-1 p-2 bg-white border-b border-gray-200">
      {/* Align */}
      <div className="flex gap-0.5 mr-2">
        <ToolButton
          icon={<AlignLeft />}
          onClick={() => handleAlign('left')}
          disabled={disabled}
          title="Align Left"
        />
        <ToolButton
          icon={<AlignCenter />}
          onClick={() => handleAlign('center')}
          disabled={disabled}
          title="Align Center"
        />
        <ToolButton
          icon={<AlignRight />}
          onClick={() => handleAlign('right')}
          disabled={disabled}
          title="Align Right"
        />
      </div>

      <div className="w-px h-4 bg-gray-300" />

      <div className="flex gap-0.5 mx-2">
        <ToolButton
          icon={<AlignTop />}
          onClick={() => handleAlign('top')}
          disabled={disabled}
          title="Align Top"
        />
        <ToolButton
          icon={<AlignMiddle />}
          onClick={() => handleAlign('middle')}
          disabled={disabled}
          title="Align Middle"
        />
        <ToolButton
          icon={<AlignBottom />}
          onClick={() => handleAlign('bottom')}
          disabled={disabled}
          title="Align Bottom"
        />
      </div>

      <div className="w-px h-4 bg-gray-300" />

      {/* Distribute */}
      <div className="flex gap-0.5 ml-2">
        <ToolButton
          icon={<DistributeHorizontal />}
          onClick={() => handleDistribute('horizontal')}
          disabled={selectedObjects.length < 3}
          title="Distribute Horizontally"
        />
        <ToolButton
          icon={<DistributeVertical />}
          onClick={() => handleDistribute('vertical')}
          disabled={selectedObjects.length < 3}
          title="Distribute Vertically"
        />
      </div>
    </div>
  );
}

function ToolButton({ icon, onClick, disabled, title }: any) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`
        p-1.5 rounded transition-colors
        ${disabled
          ? 'opacity-30 cursor-not-allowed'
          : 'hover:bg-gray-100 cursor-pointer'}
      `}
    >
      {icon}
    </button>
  );
}
```

---

## 3. 스마트 가이드 (Smart Guides)

### 목표

**"드래그 시 자동 스냅 & 가이드 라인 표시"**

### 파일 구조

```
components/canvas-studio/features/snap/
├── SmartGuides.tsx          # 가이드 렌더링
├── snapUtils.ts             # 스냅 계산
└── types.ts                 # 타입
```

### 구현 계획

#### 3.1 snapUtils.ts

```typescript
import { EditorObject } from '@/components/canvas-studio/types/document';

export interface SnapPoint {
  type: 'center' | 'edge';
  axis: 'x' | 'y';
  value: number;
  objectId: string;
}

export interface SnapResult {
  snapped: boolean;
  x: number;
  y: number;
  guides: SnapGuide[];
}

export interface SnapGuide {
  axis: 'x' | 'y';
  value: number;
  start: number;
  end: number;
}

const SNAP_THRESHOLD = 5; // 5px

/**
 * 객체를 다른 객체들에 스냅
 */
export function snapToObjects(
  draggedObject: EditorObject,
  otherObjects: EditorObject[],
  threshold: number = SNAP_THRESHOLD
): SnapResult {
  const result: SnapResult = {
    snapped: false,
    x: draggedObject.x,
    y: draggedObject.y,
    guides: [],
  };

  // 스냅 포인트 생성
  const snapPoints = otherObjects.flatMap(obj =>
    getObjectSnapPoints(obj)
  );

  const draggedPoints = getObjectSnapPoints(draggedObject);

  // X축 스냅
  for (const draggedPoint of draggedPoints.filter(p => p.axis === 'x')) {
    for (const snapPoint of snapPoints.filter(p => p.axis === 'x')) {
      const distance = Math.abs(draggedPoint.value - snapPoint.value);

      if (distance < threshold) {
        const offset = snapPoint.value - draggedPoint.value;
        result.x = draggedObject.x + offset;
        result.snapped = true;

        result.guides.push({
          axis: 'x',
          value: snapPoint.value,
          start: Math.min(draggedObject.y, snapPoint.value),
          end: Math.max(draggedObject.y + (draggedObject.height || 0), snapPoint.value),
        });

        break;
      }
    }
  }

  // Y축 스냅 (동일 로직)
  // ...

  return result;
}

function getObjectSnapPoints(obj: EditorObject): SnapPoint[] {
  const points: SnapPoint[] = [];
  const width = obj.width || 0;
  const height = obj.height || 0;

  // Center
  points.push({
    type: 'center',
    axis: 'x',
    value: obj.x + width / 2,
    objectId: obj.id,
  });

  points.push({
    type: 'center',
    axis: 'y',
    value: obj.y + height / 2,
    objectId: obj.id,
  });

  // Edges
  points.push(
    { type: 'edge', axis: 'x', value: obj.x, objectId: obj.id },
    { type: 'edge', axis: 'x', value: obj.x + width, objectId: obj.id },
    { type: 'edge', axis: 'y', value: obj.y, objectId: obj.id },
    { type: 'edge', axis: 'y', value: obj.y + height, objectId: obj.id }
  );

  return points;
}
```

---

## 4. 그룹 기능 (Grouping)

### EditorStore 액션 추가

```typescript
// components/canvas-studio/stores/useEditorStore.ts

groupObjects: (ids: string[]) => {
  set((draft) => {
    const page = draft.document?.pages.find(p => p.id === draft.activePageId);
    if (!page || ids.length < 2) return;

    const objects = page.objects.filter(o => ids.includes(o.id));
    const remainingObjects = page.objects.filter(o => !ids.includes(o.id));

    // Create group
    const groupId = uuidv4();
    const groupObject: GroupObject = {
      id: groupId,
      type: 'group',
      x: Math.min(...objects.map(o => o.x)),
      y: Math.min(...objects.map(o => o.y)),
      rotation: 0,
      opacity: 1,
      visible: true,
      locked: false,
      children: objects,
    };

    page.objects = [...remainingObjects, groupObject];
    draft.selectedIds = [groupId];

    get().saveHistory();
  });
},

ungroupObjects: (id: string) => {
  set((draft) => {
    const page = draft.document?.pages.find(p => p.id === draft.activePageId);
    if (!page) return;

    const group = page.objects.find(o => o.id === id);
    if (!group || !isGroupObject(group)) return;

    // Ungroup
    const others = page.objects.filter(o => o.id !== id);
    page.objects = [...others, ...group.children];
    draft.selectedIds = group.children.map(c => c.id);

    get().saveHistory();
  });
},
```

---

## 5. 개발 순서

### Week 1: 레이어 & 정렬

1. **Day 1-2**: LayersTab 구현
2. **Day 3-4**: AlignmentToolbar 구현
3. **Day 5**: 그룹/언그룹 기능

### Week 2: 스냅 & 선택

1. **Day 1-3**: SmartGuides 구현
2. **Day 4-5**: Marquee Selection 구현

### Week 3: 텍스트 & 이미지

1. **Day 1-3**: 리치 텍스트 에디터
2. **Day 4-5**: 이미지 업로드 시스템

---

## 6. 테스트 체크리스트

### 레이어 패널
- [ ] 레이어 목록 표시
- [ ] 선택 동기화 (레이어 ↔ 캔버스)
- [ ] 표시/숨김 토글
- [ ] 잠금/잠금해제 토글
- [ ] 그룹 펼치기/접기

### 정렬/분배
- [ ] 좌/중/우 정렬
- [ ] 상/중/하 정렬
- [ ] 가로 균등 분배
- [ ] 세로 균등 분배

### 스마트 가이드
- [ ] 중심선 스냅
- [ ] 모서리 스냅
- [ ] 가이드 라인 표시
- [ ] 그리드 스냅

### 그룹
- [ ] 다중 선택 후 그룹 생성
- [ ] 그룹 드래그
- [ ] 그룹 해제
- [ ] 그룹 내부 선택

---

**문서 버전**: v3.0.0
**마지막 업데이트**: 2025-11-19
