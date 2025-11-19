# Sparklio Editor 2.0 (Konva + Zustand + React)

**작성일**: 2025-11-19
**버전**: 0.1.0 (Phase 1 - Day 1)
**상태**: ✅ 타입 정의 및 Store 구현 완료

---

## 📋 개요

Sparklio Editor 2.0은 **Konva.js + Zustand + React** 기반의 차세대 Canvas 에디터입니다.

### 핵심 설계 원칙

1. **Data-First (데이터 우선)**
   - Zustand Store = 단일 진실 소스 (Single Source of Truth)
   - Konva = 렌더링만 담당 (View Layer)

2. **Headless 구조**
   - 상태 관리와 렌더링 완전 분리
   - Backend, LLM Agent, UI가 모두 동일한 데이터 모델 사용

3. **TypeScript First**
   - 모든 타입 정의 완료 (document.ts, store.ts)
   - 컴파일 타임 안전성 보장

---

## 🗂️ 폴더 구조

```
src/modules/editor/
├── types/              # TypeScript 타입 정의
│   ├── document.ts     # EditorDocument, EditorObject 등
│   ├── store.ts        # EditorStore, EditorActions 등
│   └── index.ts        # Export 통합
│
├── store/              # Zustand 상태 관리
│   └── editorStore.ts  # 메인 Store (Immer 기반)
│
├── core/               # Core Engine (TODO)
│   └── CanvasEngine.ts
│
├── components/         # React 컴포넌트 (TODO)
│   ├── EditorShell.tsx
│   ├── CanvasStage.tsx
│   └── ...
│
├── hooks/              # Custom Hooks (TODO)
│   ├── useEditor.ts
│   └── useCanvas.ts
│
└── adapters/           # Backend 연동 (TODO)
    ├── document-adapter.ts
    └── generator-adapter.ts
```

---

## 📊 데이터 모델

### EditorDocument (문서)

```typescript
type EditorDocument = {
  id: string;
  kind: 'product_detail' | 'sns' | 'presentation' | ...;
  brandId?: string;
  title: string;
  pages: EditorPage[];        // 멀티 페이지 지원
  metadata: DocumentMetadata;
  createdAt: string;
  updatedAt: string;
};
```

### EditorPage (페이지)

```typescript
type EditorPage = {
  id: string;
  name: string;
  width: number;              // Canvas 크기
  height: number;
  background: PageBackground; // 색상/그라데이션/이미지
  objects: EditorObject[];    // 도형, 텍스트, 이미지 등
  order: number;
};
```

### EditorObject (객체)

```typescript
type EditorObject =
  | TextObject      // 텍스트 (headline, body, cta 등)
  | ImageObject     // 이미지 (크롭, 필터 지원)
  | ShapeObject     // 도형 (rect, circle, polygon 등)
  | FrameObject     // 프레임 (children 포함)
  | GroupObject;    // 그룹
```

**공통 속성** (BaseObject):
- `id`, `x`, `y`, `width`, `height`
- `rotation`, `opacity`, `visible`, `locked`, `zIndex`

---

## 🔧 Zustand Store

### State (상태)

```typescript
{
  // Document
  document: EditorDocument | null;
  activePageId: string | null;

  // Selection
  selectedIds: string[];
  hoveredId: string | null;

  // Canvas View
  zoom: number;         // 0.1 ~ 5.0
  pan: Position;

  // History (Undo/Redo)
  history: {
    past: EditorDocument[];
    future: EditorDocument[];
    maxHistory: 50;
  };

  // UI
  tool: 'select' | 'hand' | 'text' | 'shape' | ...;
  panels: { leftPanelOpen, rightPanelOpen, ... };
}
```

### Actions (액션)

```typescript
// Document
loadDocument(doc)
clearDocument()

// Objects
addObject(pageId, obj)
updateObject(id, updates)
removeObject(id)
duplicateObject(id)

// Selection
selectObject(id)
selectObjects(ids)
deselectAll()

// History
undo()
redo()
saveHistory()

// Layer Order
bringToFront(id)
sendToBack(id)

// Clipboard
copySelected()
paste()
```

---

## 🎯 다음 단계 (Phase 1 - Day 2)

### 1. CanvasEngine 구현 (Headless)
- Konva Stage + Layer 초기화
- Zustand ↔ Konva 동기화
- 드래그/리사이즈/회전 이벤트 → Store 업데이트

### 2. 기본 컴포넌트 구현
- `EditorShell.tsx` - 전체 레이아웃
- `CanvasStage.tsx` - Konva Stage 래퍼
- `ObjectRenderer.tsx` - EditorObject → Konva Node

### 3. 첫 렌더링 테스트
- 하드코딩된 EditorDocument 로드
- 사각형 2개 + 텍스트 1개 렌더링
- 클릭 선택, 드래그 이동 확인

---

## ✅ 완료된 작업 (Phase 1 - Day 1)

- [x] 폴더 구조 생성
- [x] **EditorDocument** 타입 정의 (완벽)
- [x] **EditorStore** 타입 정의
- [x] **Zustand Store** 구현 (Immer 기반)
- [x] 모든 CRUD 액션 구현
- [x] Undo/Redo 히스토리 관리
- [x] Layer Order 관리
- [x] Clipboard (복사/붙여넣기)

---

## 📦 의존성

```json
{
  "konva": "^9.3.18",
  "react-konva": "^18.2.10",
  "zustand": "^5.0.2",
  "immer": "^10.1.1",
  "uuid": "^10.0.0"
}
```

---

## 🚀 사용 예시 (예정)

```typescript
import { useEditorStore } from '@/modules/editor/store/editorStore';

function MyEditor() {
  const { document, addObject, undo, redo } = useEditorStore();

  const handleAddRect = () => {
    const rect: ShapeObject = {
      id: uuidv4(),
      type: 'shape',
      shapeType: 'rect',
      x: 100,
      y: 100,
      width: 200,
      height: 100,
      fill: '#0066cc',
      // ... 기타 속성
    };
    addObject(document.pages[0].id, rect);
  };

  return (
    <div>
      <button onClick={handleAddRect}>Add Rectangle</button>
      <button onClick={undo}>Undo</button>
      <button onClick={redo}>Redo</button>
      {/* Canvas 렌더링 */}
    </div>
  );
}
```

---

## 📝 참고 문서

- [POC 결과](../../app/poc/) - Konva + Zustand 검증 완료
- [KONVA_MIGRATION_PLAN.md](../../docs/KONVA_MIGRATION_PLAN.md) - 전체 마이그레이션 계획
- [Konva 공식 문서](https://konvajs.org/)
- [Zustand 공식 문서](https://github.com/pmndrs/zustand)

---

**다음 작업**: Phase 1 - Day 2 (CanvasEngine + 기본 렌더링)
**예상 소요**: 4-5시간
**목표**: Fabric.js 완전 대체 달성 ✅
