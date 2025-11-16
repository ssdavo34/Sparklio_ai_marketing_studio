# Canvas Studio 금일 작업 완료 보고서 (2025-11-16)

**작성자**: C팀 Frontend Team (Claude)
**작성일**: 2025-11-16 (일요일) 23:38
**프로젝트**: Sparklio AI Marketing Studio - Canvas Studio Phase 4-5

---

## 📋 목차

1. [전체 공정 현황](#전체-공정-현황)
2. [금일 완료 작업](#금일-완료-작업)
3. [발견된 버그 및 문제점](#발견된-버그-및-문제점)
4. [익일 작업 지시](#익일-작업-지시)
5. [기술 참고사항](#기술-참고사항)

---

## 전체 공정 현황

### 📊 전체 진행률: **약 85%**

| Phase | 작업 항목 | 상태 | 진행률 | 완료일 | 비고 |
|-------|----------|------|--------|--------|------|
| **Phase 1** | Canvas Studio 기본 구조 | ✅ 완료 | 100% | 2025-11-10 | VSCode 스타일 레이아웃 |
| **Phase 2** | Zustand Store 통합 | ✅ 완료 | 100% | 2025-11-12 | useCanvasStore, useLayoutStore |
| **Phase 3** | Fabric.js 통합 및 고급 기능 | ✅ 완료 | 100% | 2025-11-15 | Layers, Inspector, Undo/Redo |
| **Phase 4** | Main App 통합 | ✅ 완료 | 100% | 2025-11-16 | 로그인 우회 모드 적용 |
| **Phase 5** | 사용자 경험 개선 | 🔄 진행 중 | 70% | - | Zoom 완료, Pan 버그 있음 |
| **Phase 6** | 백엔드 연동 | ⏳ 대기 | 0% | - | 백엔드 서버 준비 필요 |

### Phase 5 세부 진행률

| 기능 | 상태 | 진행률 | 비고 |
|------|------|--------|------|
| Zoom 시스템 (CSS transform) | ✅ 완료 | 100% | 정상 작동 |
| ZoomToFit | ✅ 완료 | 100% | 정상 작동 |
| 반응형 뷰포트 | ⚠️ 부분 완료 | 50% | 하단 잘림 버그 |
| 스크롤 기능 | ⚠️ 부분 완료 | 70% | 작동하나 컨트롤 위치 문제 |
| Pan (손 도구) | ❌ 버그 | 30% | 커서만 변경, 이동 안 됨 |

---

## 금일 완료 작업

### ✅ 1. Zoom 시스템 완전 재설계 (100% 완료)

**문제 인식**:
- 기존: Fabric.js `zoomToPoint()` 사용 → 객체 크기와 캔버스 줌이 따로 적용되어 구도가 깨짐
- 사용자 요구사항: "140% 줌일 때 캔버스와 객체가 동시에 140% 확대, 구도는 바뀌지 않아야 함"

**해결 방안**:
- CSS `transform: scale()` 사용으로 전환
- 캔버스 컨테이너 전체를 scale하여 캔버스와 객체가 함께 확대/축소

**수정 파일**:
1. `components/canvas-studio/stores/useCanvasStore.ts` (Line 108-116)
2. `components/canvas-studio/layout/CanvasViewport.tsx` (Line 75-79)
3. `components/canvas-studio/hooks/useCanvasEngine.ts` (Line 522-523, zoom useEffect 제거)

**핵심 코드**:
```typescript
// useCanvasStore.ts - Line 108-116
setZoom: (zoom) => {
  const { minZoom, maxZoom } = get();
  const clampedZoom = Math.max(minZoom, Math.min(zoom, maxZoom));
  set({ zoom: clampedZoom });
  // CSS transform scale로 처리하므로 Fabric.js에서는 별도 작업 불필요
},
```

```tsx
// CanvasViewport.tsx - Line 75-79
<div style={{
  transform: `scale(${zoom / 100})`,
  transformOrigin: 'center center',
  transition: 'transform 0.1s ease-out',
}}>
```

**테스트 결과**: ✅ 정상 작동 확인
- 100% 줌: 객체와 캔버스 기준 크기
- 140% 줌: 객체와 캔버스 동시에 140% 확대
- 50% 줌: 객체와 캔버스 동시에 50% 축소
- 구도 유지됨

---

### ✅ 2. 반응형 뷰포트 구현 (50% 완료 - 버그 있음)

**작업 내용**:
- `overflow-auto` 클래스 추가하여 스크롤 활성화
- flex-1로 남은 공간 최대 활용

**수정 파일**:
- `components/canvas-studio/layout/CanvasViewport.tsx` (Line 70)

**핵심 코드**:
```tsx
// Line 70
<section className="relative flex flex-1 items-center justify-center overflow-auto bg-neutral-100">
```

**테스트 결과**: ⚠️ 부분 작동
- ✅ 스크롤바 생성됨
- ❌ 하단이 잘림 (items-center justify-center 때문)
- ❌ 캔버스가 항상 중앙 정렬되어 상하단이 잘림

---

### ✅ 3. 스크롤 기능 추가 (70% 완료 - 컨트롤 위치 문제)

**작업 내용**:
- 캔버스 확대 시 상하좌우 자동 스크롤
- CSS transform scale과 연동

**테스트 결과**: ⚠️ 부분 작동
- ✅ 스크롤 자체는 작동
- ❌ 줌/하단 컨트롤이 absolute 위치로 인해 스크롤 시 함께 움직임
- ❌ 메뉴를 사용하려면 스크롤을 다시 조정해야 하는 불편

---

### ✅ 4. Pan(손 도구) 기능 구현 (30% 완료 - 버그)

**작업 내용**:
- 스페이스바 + 드래그로 캔버스 이동
- 커서 변경: `grab` → `grabbing`
- 텍스트 입력 중 자동 비활성화

**수정 파일**:
- `components/canvas-studio/hooks/useCanvasEngine.ts` (Line 578-664)

**핵심 코드**:
```typescript
// Line 578-664
useEffect(() => {
  let isPanning = false;
  let isSpacePressed = false;

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.code === 'Space' && !isSpacePressed) {
      isSpacePressed = true;
      fabricCanvas.selection = false;
      fabricCanvas.defaultCursor = 'grab';
    }
  };

  const handleMouseMove = (opt: any) => {
    if (isPanning && isSpacePressed) {
      const vpt = fabricCanvas.viewportTransform;
      if (vpt) {
        vpt[4] += evt.clientX - lastPosX;
        vpt[5] += evt.clientY - lastPosY;
        fabricCanvas.requestRenderAll();
      }
    }
  };

  // ... 이벤트 리스너 등록
}, [fabricCanvas]);
```

**테스트 결과**: ❌ 버그
- ✅ 스페이스바 누르면 `grab` 커서 표시
- ✅ 드래그 시 `grabbing` 커서 전환
- ❌ **캔버스가 이동하지 않음** (핵심 버그)

**버그 원인 분석**:
```
CSS 좌표계 (CanvasViewport)          Fabric.js 좌표계 (Canvas)
┌─────────────────────┐              ┌─────────────────────┐
│ <div transform=     │              │ viewportTransform   │
│   "scale(...)">     │  ❌ 충돌!    │   [4] = X ← 이걸 조작
│   <canvas />        │              │   [5] = Y           │
└─────────────────────┘              └─────────────────────┘
```

- CSS `transform: scale()`을 적용한 상태에서 Fabric.js `viewportTransform` 조작은 효과 없음
- 두 좌표계가 충돌하여 Pan이 작동하지 않음

---

### ✅ 5. ZoomToFit 기능 구현 (100% 완료)

**작업 내용**:
- 모든 객체의 Bounding Box 계산
- 10% 패딩으로 여백 확보
- 빈 캔버스일 때 100%로 리셋

**수정 파일**:
- `components/canvas-studio/stores/useCanvasStore.ts` (Line 142-190)

**핵심 코드**:
```typescript
// Line 142-190
zoomToFit: () => {
  const { fabricCanvas, minZoom, maxZoom } = get();
  if (!fabricCanvas) return;

  // 그리드 라인 제외한 실제 객체만
  const objects = fabricCanvas.getObjects().filter((obj: any) => obj.name !== 'grid-line');

  if (objects.length === 0) {
    get().resetZoom();
    return;
  }

  // Bounding Box 계산
  let minX = Infinity, minY = Infinity;
  let maxX = -Infinity, maxY = -Infinity;

  objects.forEach((obj: any) => {
    const bound = obj.getBoundingRect();
    minX = Math.min(minX, bound.left);
    minY = Math.min(minY, bound.top);
    maxX = Math.max(maxX, bound.left + bound.width);
    maxY = Math.max(maxY, bound.top + bound.height);
  });

  // 줌 레벨 계산 (10% 패딩)
  const padding = 0.1;
  const zoomX = (canvasWidth * (1 - padding * 2)) / (maxX - minX);
  const zoomY = (canvasHeight * (1 - padding * 2)) / (maxY - minY);
  const newZoom = Math.min(zoomX, zoomY, maxZoom);
  const clampedZoom = Math.max(minZoom, newZoom);

  get().setZoom(clampedZoom);
},
```

**테스트 결과**: ✅ 정상 작동
- ✅ 여러 객체가 모두 보임
- ✅ 10% 패딩 적용
- ✅ 빈 캔버스일 때 100%로 리셋
- ⚠️ 단, 스크롤 위치는 조정하지 않아 객체가 중앙에 오지 않을 수 있음

---

### ✅ 6. Git 커밋 완료

**커밋 정보**:
- **커밋 메시지**: `feat(canvas): 반응형 뷰포트, 스크롤, Pan 및 ZoomToFit 구현`
- **커밋 해시**: `2c29dd8`
- **브랜치**: `master` (origin/master보다 2커밋 앞섬)

**커밋된 파일**:
1. `app/page.tsx` - Canvas Studio 통합 및 인증 우회
2. `components/canvas-studio/components/InspectorPanel.tsx` - Canvas Settings 추가
3. `components/canvas-studio/hooks/useCanvasEngine.ts` - Pan 기능 추가 (버그 있음)
4. `components/canvas-studio/layout/CanvasViewport.tsx` - Zoom 및 스크롤 적용
5. `components/canvas-studio/stores/useCanvasStore.ts` - Zoom 및 ZoomToFit 구현

---

## 발견된 버그 및 문제점

### 🐛 버그 1: 하단이 잘림 - 반응형 구현 실패 (Critical)

**우선순위**: ⭐⭐⭐ (최고)

**증상**:
- 캔버스가 화면 중앙에 고정되어 있음
- 하단 컨트롤(Grid, Dock 토글)이 화면 밖으로 벗어남
- 스크롤해도 전체 캔버스가 보이지 않음

**스크린샷 참고**:
```
┌──────────────────────────────┐
│                              │
│     (상단 잘림)               │
├──────────────────────────────┤
│                              │
│        Canvas (일부만)        │
│                              │
├──────────────────────────────┤
│    (하단 잘림 - 못 봄)        │
│    Grid 버튼, Dock 버튼      │
└──────────────────────────────┘
```

**원인**:
```tsx
// CanvasViewport.tsx - Line 70
<section className="relative flex flex-1 items-center justify-center overflow-auto bg-neutral-100">
```
- `items-center justify-center`로 인해 캔버스가 항상 중앙 정렬
- 캔버스가 화면보다 클 때 상하단이 동일하게 잘림
- `overflow-auto`만으로는 해결되지 않음

**해결 방안**:
```tsx
// 수정 후 코드
<section className="relative flex flex-1 overflow-auto bg-neutral-100">
  <div className="m-auto p-8"> {/* wrapper 추가 */}
    <div style={{ transform: `scale(${zoom / 100})` }}>
      <canvas ref={canvasRef} />
    </div>
  </div>
</section>
```

**수정 포인트**:
1. `items-center justify-center` 제거
2. wrapper div 추가 (`m-auto p-8`)
3. wrapper가 자동으로 중앙 정렬하되, 스크롤 시 전체 영역 표시

---

### 🐛 버그 2: 스크롤 시 컨트롤이 화면 밖으로 벗어남 (High)

**우선순위**: ⭐⭐ (높음)

**증상**:
- 줌 컨트롤(우측 상단)이 스크롤 시 함께 움직임
- 하단 컨트롤(Grid, Dock)도 마찬가지
- 메뉴를 사용하려면 스크롤을 다시 조정해야 하는 불편

**원인**:
```tsx
// CanvasViewport.tsx - Line 102, 170, 201
{/* 줌 컨트롤 (우측 상단) */}
<div className="absolute right-4 top-4 ...">

{/* 좌측 하단 컨트롤 그룹 */}
<div className="absolute bottom-4 left-4 ...">

{/* 우측 하단 컨트롤 그룹 */}
<div className="absolute bottom-4 right-4 ...">
```
- `absolute` 위치로 section에 고정
- section이 스크롤되면 컨트롤도 함께 스크롤됨

**해결 방안 (2가지 옵션)**:

**Option 1 (권장)**: TopToolbar로 이동
- 줌 컨트롤을 TopToolbar에 통합
- 하단 컨트롤은 CanvasStudioShell 레벨로 이동

**Option 2 (임시)**: fixed 위치 사용
```tsx
{/* 줌 컨트롤 - fixed 위치 */}
<div className="fixed right-4 top-[60px] z-10 ...">

{/* 좌측 하단 - LeftPanel 너비 고려 */}
<div className={`fixed bottom-4 z-10 ${
  isLeftPanelCollapsed ? 'left-4' : 'left-[280px]'
} ...`}>

{/* 우측 하단 - RightDock 너비 고려 */}
<div className={`fixed bottom-4 z-10 ${
  isRightDockCollapsed ? 'right-4' : 'right-[280px]'
} ...`}>
```

---

### 🐛 버그 3: Pan(손 도구) 작동 안 함 (High)

**우선순위**: ⭐⭐ (높음)

**증상**:
- 스페이스바 누르면 `grab` 커서로 변경됨 ✅
- 드래그 시 `grabbing` 커서로 변경됨 ✅
- **드래그해도 캔버스가 이동하지 않음** ❌

**원인 분석**:
```typescript
// useCanvasEngine.ts - Line 625-636
const handleMouseMove = (opt: any) => {
  if (isPanning && isSpacePressed) {
    const evt = opt.e;
    const vpt = fabricCanvas.viewportTransform;
    if (vpt) {
      vpt[4] += evt.clientX - lastPosX;  // ← Fabric.js 좌표계
      vpt[5] += evt.clientY - lastPosY;
      fabricCanvas.requestRenderAll();
    }
  }
};
```

**근본 원인**:
```
┌─────────────────────────────────────────────────┐
│ CSS 좌표계 (CanvasViewport)                     │
│   <section>                                     │
│     scrollLeft, scrollTop ← 이걸 조작해야 함!   │
│                                                 │
│     <div transform="scale(...)">                │
│       <canvas />                                │
│     </div>                                      │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ Fabric.js 좌표계 (Canvas)                       │
│   viewportTransform[4] = X                      │
│   viewportTransform[5] = Y  ← 이걸 조작해도     │
│                                CSS scale 때문에  │
│   ❌ 효과 없음!                                 │
└─────────────────────────────────────────────────┘
```

- CSS `transform: scale()`을 적용한 상태에서 Fabric.js `viewportTransform` 조작은 효과 없음
- **좌표계 충돌**: CSS scale이 우선순위가 높아 Fabric.js transform이 무시됨

**해결 방안**:

**Option 1 (권장)**: Pan을 CSS scroll로 구현
```typescript
// sectionRef를 통해 접근
const handleMouseMove = (e: MouseEvent) => {
  if (isPanning && isSpacePressed && sectionRef?.current) {
    const section = sectionRef.current;
    section.scrollLeft -= e.clientX - lastPosX;
    section.scrollTop -= e.clientY - lastPosY;
    lastPosX = e.clientX;
    lastPosY = e.clientY;
  }
};
```

**필요한 수정**:
1. `CanvasViewport.tsx`에 sectionRef 추가
2. `CanvasContext.tsx`에 sectionRef 전달
3. `useCanvasEngine.ts`에서 sectionRef 받아서 scrollLeft/scrollTop 조작
4. Fabric.js 이벤트 대신 window 이벤트 사용

---

### 🐛 버그 4: ZoomToFit 후 객체가 중앙에 오지 않음 (Low)

**우선순위**: ⭐ (낮음)

**증상**:
- ZoomToFit 실행 시 줌 레벨은 정상 조정됨
- 하지만 객체들이 화면 중앙에 오지 않음
- 수동으로 스크롤해야 객체가 보임

**원인**:
- 줌 레벨만 조정하고 스크롤 위치는 조정하지 않음

**해결 방안**:
```typescript
// useCanvasStore.ts - zoomToFit 마지막에 추가
get().setZoom(clampedZoom);

// 스크롤 위치 조정 (CanvasViewport에서 처리)
// sectionRef를 통해 접근 필요
```

**또는 useEffect로 자동 스크롤**:
```tsx
// CanvasViewport.tsx
useEffect(() => {
  if (sectionRef.current) {
    const section = sectionRef.current;
    section.scrollLeft = (section.scrollWidth - section.clientWidth) / 2;
    section.scrollTop = (section.scrollHeight - section.clientHeight) / 2;
  }
}, [zoom]);
```

---

## 익일 작업 지시

### 🎯 작업 우선순위

| 순위 | 작업 | 소요 시간 예상 | 중요도 | 긴급도 |
|------|------|---------------|--------|--------|
| 1 | 버그 1 수정 (하단 잘림) | 30분 | ⭐⭐⭐ | 높음 |
| 2 | 버그 3 수정 (Pan 작동 안 함) | 1시간 | ⭐⭐ | 높음 |
| 3 | 버그 2 수정 (컨트롤 위치) | 30분 | ⭐⭐ | 중간 |
| 4 | 버그 4 수정 (ZoomToFit 스크롤) | 20분 | ⭐ | 낮음 |
| 5 | 통합 테스트 및 검증 | 30분 | ⭐⭐ | 중간 |
| 6 | Git 커밋 및 문서 업데이트 | 20분 | ⭐⭐⭐ | 높음 |

**총 예상 시간**: 약 3시간

---

### 📝 작업 1: 버그 1 수정 - 하단 잘림 문제 (우선순위 1)

**목표**: 캔버스가 화면에 전체적으로 보이도록 수정

**파일**: `components/canvas-studio/layout/CanvasViewport.tsx`

**현재 코드** (Line 70):
```tsx
<section className="relative flex flex-1 items-center justify-center overflow-auto bg-neutral-100">
  <div
    className="relative"
    onContextMenu={handleContextMenu}
    style={{ transform: `scale(${zoom / 100})` }}
  >
    <canvas ref={canvasRef} />
  </div>
</section>
```

**수정 코드**:
```tsx
<section className="relative flex flex-1 overflow-auto bg-neutral-100">
  <div className="m-auto p-8"> {/* wrapper 추가 */}
    <div
      className="relative"
      onContextMenu={handleContextMenu}
      style={{
        transform: `scale(${zoom / 100})`,
        transformOrigin: 'center center',
        transition: 'transform 0.1s ease-out',
      }}
    >
      <canvas ref={canvasRef} className="rounded-lg shadow-2xl" />
      {/* ... 나머지 동일 */}
    </div>
  </div>
</section>
```

**핵심 변경사항**:
1. `items-center justify-center` 제거
2. `<div className="m-auto p-8">` wrapper 추가
3. wrapper가 마진 auto로 중앙 정렬, 패딩 8로 여백 확보

**테스트 체크리스트**:
- [ ] 캔버스 전체가 화면에 보임
- [ ] 스크롤 시 상하단이 모두 접근 가능
- [ ] 하단 컨트롤(Grid, Dock)이 보임
- [ ] 줌 인 시 스크롤바 자동 생성
- [ ] 100% 줌일 때 캔버스가 중앙에 위치

---

### 📝 작업 2: 버그 3 수정 - Pan 작동 안 함 (우선순위 2)

**목표**: 스페이스바 + 드래그로 캔버스 이동 기능 정상화

**수정 파일**:
1. `components/canvas-studio/layout/CanvasViewport.tsx`
2. `components/canvas-studio/context/CanvasContext.tsx`
3. `components/canvas-studio/hooks/useCanvasEngine.ts`

#### 2-1. CanvasViewport에 sectionRef 추가

**파일**: `components/canvas-studio/layout/CanvasViewport.tsx`

**추가할 코드** (Line 28 이후):
```tsx
export function CanvasViewport() {
  const sectionRef = useRef<HTMLDivElement>(null); // ← 추가

  const {
    canvasRef,
    isReady,
    fabricCanvas,
    // ...
  } = useCanvas();

  // ...

  return (
    <section
      ref={sectionRef} // ← 추가
      className="relative flex flex-1 overflow-auto bg-neutral-100"
    >
```

#### 2-2. Context에 sectionRef 전달

**파일**: `components/canvas-studio/context/CanvasContext.tsx`

**수정할 위치**: CanvasContextValue 인터페이스

**현재 코드**:
```typescript
export interface CanvasContextValue {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  fabricCanvas: fabric.Canvas | null;
  isReady: boolean;
  // ...
}
```

**수정 코드**:
```typescript
export interface CanvasContextValue {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  sectionRef: React.RefObject<HTMLDivElement>; // ← 추가
  fabricCanvas: fabric.Canvas | null;
  isReady: boolean;
  // ...
}
```

**Provider 수정**:
```tsx
export function CanvasProvider({ children }: { children: React.ReactNode }) {
  const sectionRef = useRef<HTMLDivElement>(null); // ← 추가

  const engine = useCanvasEngine({ sectionRef }); // ← sectionRef 전달

  return (
    <CanvasContext.Provider value={{ ...engine, sectionRef }}>
      {children}
    </CanvasContext.Provider>
  );
}
```

#### 2-3. useCanvasEngine에서 Pan 로직 수정

**파일**: `components/canvas-studio/hooks/useCanvasEngine.ts`

**현재 코드** (Line 625-636):
```typescript
const handleMouseMove = (opt: any) => {
  if (isPanning && isSpacePressed) {
    const evt = opt.e;
    const vpt = fabricCanvas.viewportTransform;
    if (vpt) {
      vpt[4] += evt.clientX - lastPosX;
      vpt[5] += evt.clientY - lastPosY;
      fabricCanvas.requestRenderAll();
    }
    lastPosX = evt.clientX;
    lastPosY = evt.clientY;
  }
};

fabricCanvas.on('mouse:move', handleMouseMove);
```

**수정 코드**:
```typescript
// Props 인터페이스 추가 (파일 상단)
export interface UseCanvasEngineProps {
  sectionRef?: React.RefObject<HTMLDivElement>;
}

export function useCanvasEngine(props?: UseCanvasEngineProps): UseCanvasEngineReturn {
  const { sectionRef } = props || {};

  // ... (기존 코드)

  // Pan 기능 수정 (Line 578-664 전체 교체)
  useEffect(() => {
    if (!fabricCanvas || !sectionRef?.current) return;

    let isPanning = false;
    let isSpacePressed = false;
    let lastPosX = 0;
    let lastPosY = 0;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      if (e.code === 'Space' && !isSpacePressed) {
        e.preventDefault();
        isSpacePressed = true;
        fabricCanvas.selection = false;
        sectionRef.current!.style.cursor = 'grab';
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        isSpacePressed = false;
        isPanning = false;
        fabricCanvas.selection = true;
        sectionRef.current!.style.cursor = 'default';
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (isSpacePressed) {
        isPanning = true;
        sectionRef.current!.style.cursor = 'grabbing';
        lastPosX = e.clientX;
        lastPosY = e.clientY;
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (isPanning && isSpacePressed && sectionRef.current) {
        const section = sectionRef.current;
        section.scrollLeft -= e.clientX - lastPosX;
        section.scrollTop -= e.clientY - lastPosY;
        lastPosX = e.clientX;
        lastPosY = e.clientY;
      }
    };

    const handleMouseUp = () => {
      if (isPanning) {
        isPanning = false;
        if (isSpacePressed) {
          sectionRef.current!.style.cursor = 'grab';
        } else {
          sectionRef.current!.style.cursor = 'default';
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [fabricCanvas, sectionRef]);

  // ...
}
```

**핵심 변경사항**:
1. Fabric.js `viewportTransform` → CSS `scrollLeft/scrollTop`
2. Fabric.js 이벤트 → window 이벤트
3. sectionRef를 통해 section element 접근

**테스트 체크리스트**:
- [ ] 스페이스바 누르면 grab 커서
- [ ] 스페이스바 + 드래그 시 캔버스 이동 (상하)
- [ ] 스페이스바 + 드래그 시 캔버스 이동 (좌우)
- [ ] 마우스 버튼 떼면 grabbing → grab
- [ ] 스페이스바 떼면 기본 커서
- [ ] 텍스트 입력 중에는 비활성화

---

### 📝 작업 3: 버그 2 수정 - 컨트롤 위치 (우선순위 3)

**목표**: 스크롤 시에도 컨트롤이 화면에 고정

**파일**: `components/canvas-studio/layout/CanvasViewport.tsx`

**Option 1 (권장)**: TopToolbar로 이동
- 줌 컨트롤을 `TopToolbar.tsx`에 통합
- 하단 컨트롤은 `CanvasStudioShell.tsx`로 이동

**Option 2 (임시)**: fixed 위치 사용

**현재 코드** (Line 102):
```tsx
<div className="absolute right-4 top-4 ...">
```

**수정 코드**:
```tsx
<div className="fixed right-4 top-[60px] z-10 ...">
```

**하단 컨트롤 수정** (Line 170, 201):
```tsx
{/* 좌측 하단 */}
<div
  className={`fixed bottom-4 z-10 transition-all ${
    isLeftPanelCollapsed ? 'left-4' : 'left-[280px]'
  } ...`}
>

{/* 우측 하단 */}
<div
  className={`fixed bottom-4 z-10 transition-all ${
    isRightDockCollapsed ? 'right-4' : 'right-[280px]'
  } ...`}
>
```

**테스트 체크리스트**:
- [ ] 줌 컨트롤이 항상 우측 상단에 고정
- [ ] 스크롤 시 줌 컨트롤이 움직이지 않음
- [ ] 하단 컨트롤이 항상 하단에 고정
- [ ] LeftPanel collapse 시 좌측 컨트롤 위치 조정
- [ ] RightDock collapse 시 우측 컨트롤 위치 조정

---

### 📝 작업 4: 버그 4 수정 - ZoomToFit 스크롤 (우선순위 4)

**목표**: ZoomToFit 실행 시 객체가 화면 중앙에 오도록 스크롤 조정

**파일**: `components/canvas-studio/layout/CanvasViewport.tsx`

**추가할 코드**:
```tsx
// ZoomToFit 실행 시 자동으로 중앙 스크롤
useEffect(() => {
  if (sectionRef.current && zoom !== 1.0) {
    const section = sectionRef.current;
    // 중앙으로 스크롤
    section.scrollLeft = (section.scrollWidth - section.clientWidth) / 2;
    section.scrollTop = (section.scrollHeight - section.clientHeight) / 2;
  }
}, [zoom]);
```

**테스트 체크리스트**:
- [ ] ZoomToFit 실행 시 객체가 화면 중앙에 위치
- [ ] 수동 줌 조절 시에도 중앙 유지
- [ ] 100% 줌일 때도 중앙 정렬

---

### 📝 작업 5: 통합 테스트 (우선순위 5)

**목표**: 모든 기능이 함께 작동하는지 검증

**테스트 시나리오**:

1. **Zoom + Pan 통합**:
   - [ ] 140% 줌 → 스페이스바 + 드래그로 이동 → 정상 작동
   - [ ] 50% 줌 → 스페이스바 + 드래그로 이동 → 정상 작동
   - [ ] 줌 변경 후 Pan → 스크롤 위치 유지

2. **ZoomToFit + Pan**:
   - [ ] 여러 객체 생성 → ZoomToFit → 모두 보임
   - [ ] ZoomToFit 후 Pan → 정상 이동
   - [ ] 객체 추가 후 다시 ZoomToFit → 정상 조정

3. **Undo/Redo + Zoom**:
   - [ ] 객체 생성 → 줌 변경 → Undo → 객체만 삭제됨 (줌은 유지)
   - [ ] 줌은 히스토리에 포함되지 않음 확인

4. **객체 조작 + Zoom**:
   - [ ] 140% 줌 → 객체 선택 → 이동 → 정상 작동
   - [ ] 140% 줌 → 객체 크기 조절 → 정상 작동
   - [ ] 140% 줌 → 텍스트 입력 → 정상 작동

5. **반응형 테스트**:
   - [ ] 1920x1080 해상도 → 정상 표시
   - [ ] 1366x768 해상도 → 정상 표시
   - [ ] 브라우저 창 크기 조절 → 반응형 동작

---

### 📝 작업 6: Git 커밋 및 문서 업데이트 (우선순위 6)

**목표**: 모든 수정사항 커밋 및 문서화

**커밋 메시지**:
```
fix(canvas): 반응형 뷰포트, Pan 기능 및 컨트롤 위치 버그 수정

1. 반응형 뷰포트 수정
   - items-center justify-center 제거
   - wrapper div로 중앙 정렬 및 패딩 확보
   - 하단 잘림 문제 해결

2. Pan(손 도구) 기능 수정
   - Fabric.js viewportTransform → CSS scrollLeft/scrollTop
   - 좌표계 충돌 문제 해결
   - 스페이스바 + 드래그로 정상 이동

3. 컨트롤 위치 수정
   - absolute → fixed 위치로 변경
   - 스크롤 시에도 화면에 고정
   - LeftPanel/RightDock collapse 대응

4. ZoomToFit 스크롤 조정
   - 줌 변경 시 자동으로 중앙 스크롤
   - 객체가 화면 중앙에 위치

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

**커밋할 파일**:
- `components/canvas-studio/layout/CanvasViewport.tsx`
- `components/canvas-studio/context/CanvasContext.tsx`
- `components/canvas-studio/hooks/useCanvasEngine.ts`

**문서 업데이트**:
- 이 문서(CANVAS_STUDIO_EOD_2025-11-16.md)에 버그 수정 완료 기록
- 전체 진행률 업데이트 (85% → 95%)

---

## 기술 참고사항

### 주요 파일 구조

```
frontend/
├── app/
│   └── page.tsx                              # Main App (인증 우회 모드)
├── components/
│   └── canvas-studio/
│       ├── CanvasStudioShell.tsx             # Canvas Studio 최상위
│       ├── layout/
│       │   ├── CanvasViewport.tsx            # 🔥 중앙 캔버스 (주요 수정 대상)
│       │   ├── TopToolbar.tsx                # 상단 툴바
│       │   ├── LeftPanel.tsx                 # 좌측 Pages 패널
│       │   └── RightDock.tsx                 # 우측 Dock
│       ├── hooks/
│       │   └── useCanvasEngine.ts            # 🔥 Fabric.js 및 Pan (주요 수정 대상)
│       ├── stores/
│       │   ├── useCanvasStore.ts             # 🔥 Zoom, Pan, Grid (주요 수정 대상)
│       │   └── useLayoutStore.ts             # 패널 표시/숨김
│       ├── context/
│       │   └── CanvasContext.tsx             # 🔥 Canvas Context (sectionRef 추가 필요)
│       └── components/
│           ├── InspectorPanel.tsx            # 속성 편집
│           ├── LayersPanel.tsx               # 레이어 목록
│           └── ContextMenu.tsx               # 우클릭 메뉴
└── docs/
    └── CANVAS_STUDIO_EOD_2025-11-16.md       # 이 문서
```

---

### Zoom 시스템 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│ CanvasViewport.tsx                                          │
│                                                             │
│  <section className="overflow-auto">                       │
│    <div className="m-auto p-8">                            │
│      <div style={{ transform: `scale(${zoom / 100})` }}>  │
│        <canvas ref={canvasRef} />                          │
│      </div>                                                │
│    </div>                                                  │
│  </section>                                                │
│                                                             │
│  zoom 값 ← useCanvasStore.zoom                            │
└─────────────────────────────────────────────────────────────┘
                           ↑
                           │
┌─────────────────────────────────────────────────────────────┐
│ useCanvasStore.ts                                           │
│                                                             │
│  zoom: number (0.25 ~ 4.0)                                 │
│  setZoom(zoom: number) - CSS transform으로 처리             │
│  zoomIn() - zoom + 0.1                                     │
│  zoomOut() - zoom - 0.1                                    │
│  zoomToFit() - 객체에 맞춰 자동 조정                        │
│  resetZoom() - 1.0으로 리셋                                │
└─────────────────────────────────────────────────────────────┘
```

---

### Pan 시스템 아키텍처 (수정 후)

```
┌─────────────────────────────────────────────────────────────┐
│ useCanvasEngine.ts                                          │
│                                                             │
│  스페이스바 감지 (window.addEventListener)                  │
│  마우스 드래그 감지 (window.addEventListener)               │
│                                                             │
│  → sectionRef.current.scrollLeft -= deltaX                 │
│  → sectionRef.current.scrollTop -= deltaY                  │
│                                                             │
│  ✅ CSS scroll 직접 조작                                   │
└─────────────────────────────────────────────────────────────┘
                           ↑
                           │ sectionRef
                           │
┌─────────────────────────────────────────────────────────────┐
│ CanvasViewport.tsx                                          │
│                                                             │
│  const sectionRef = useRef<HTMLDivElement>(null);          │
│                                                             │
│  <section ref={sectionRef} className="overflow-auto">      │
│    {/* scrollLeft, scrollTop이 변경됨 */}                  │
│  </section>                                                │
└─────────────────────────────────────────────────────────────┘
                           ↑
                           │ sectionRef 전달
                           │
┌─────────────────────────────────────────────────────────────┐
│ CanvasContext.tsx                                           │
│                                                             │
│  const sectionRef = useRef<HTMLDivElement>(null);          │
│  const engine = useCanvasEngine({ sectionRef });           │
│                                                             │
│  <CanvasContext.Provider value={{ ...engine, sectionRef }}>│
└─────────────────────────────────────────────────────────────┘
```

---

### 좌표계 이해

#### ❌ 잘못된 방식 (기존 - 작동 안 함)
```
CSS 좌표계                     Fabric.js 좌표계
┌───────────────┐             ┌───────────────┐
│ transform:    │             │ viewport      │
│  scale(1.4)   │   ❌ 충돌   │  Transform    │
│               │             │  [4] = X      │
│   <canvas />  │             │  [5] = Y      │
└───────────────┘             └───────────────┘
```

#### ✅ 올바른 방식 (수정 후 - 정상 작동)
```
CSS 좌표계
┌─────────────────────────────┐
│ <section> (overflow-auto)   │
│   scrollLeft ← 이걸 조작!   │
│   scrollTop                 │
│                             │
│   <div transform="scale">   │
│     <canvas />              │
│   </div>                    │
└─────────────────────────────┘
```

---

### 디버깅 팁

#### Pan 동작 확인
```typescript
// useCanvasEngine.ts - handleMouseMove
console.log('Pan delta:', {
  dx: e.clientX - lastPosX,
  dy: e.clientY - lastPosY,
  scrollLeft: sectionRef.current?.scrollLeft,
  scrollTop: sectionRef.current?.scrollTop,
  isPanning,
  isSpacePressed,
});
```

#### Zoom 동작 확인
```typescript
// useCanvasStore.ts - setZoom
console.log('Zoom:', {
  oldZoom: get().zoom,
  newZoom: clampedZoom,
  percentage: `${Math.round(clampedZoom * 100)}%`,
});
```

#### 스크롤 위치 확인
```typescript
// CanvasViewport.tsx
useEffect(() => {
  if (sectionRef.current) {
    console.log('Scroll:', {
      scrollLeft: sectionRef.current.scrollLeft,
      scrollTop: sectionRef.current.scrollTop,
      scrollWidth: sectionRef.current.scrollWidth,
      scrollHeight: sectionRef.current.scrollHeight,
      clientWidth: sectionRef.current.clientWidth,
      clientHeight: sectionRef.current.clientHeight,
    });
  }
}, [zoom]);
```

---

### 알려진 제약사항

1. **Pan과 객체 드래그 충돌 방지**
   - 스페이스바 누른 상태: `fabricCanvas.selection = false`
   - 스페이스바 뗀 후: `fabricCanvas.selection = true`

2. **텍스트 입력 중 스페이스바 무시**
   ```typescript
   const target = e.target as HTMLElement;
   if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
     return; // 스페이스바 무시
   }
   ```

3. **CSS transform scale의 제약**
   - Fabric.js의 일부 기능(selection box 등)이 scale에 영향받을 수 있음
   - 현재는 정상 작동하지만, 추후 문제 발생 시 scale 값을 Fabric.js에도 전달하여 보정 필요

4. **스크롤 성능**
   - 대형 캔버스(3000x3000 이상)에서 스크롤이 느릴 수 있음
   - 필요시 `will-change: transform` CSS 속성 추가

---

## 요약

### ✅ 금일 완료
1. Zoom 시스템 재설계 (CSS transform scale) - **100% 완료**
2. ZoomToFit 구현 - **100% 완료**
3. 반응형 뷰포트 - **50% 완료** (버그 있음)
4. 스크롤 기능 - **70% 완료** (컨트롤 위치 문제)
5. Pan (손 도구) - **30% 완료** (작동 안 함)
6. Git 커밋 - **완료**

### ❌ 발견된 버그
1. **하단 잘림** (Critical) - items-center justify-center 때문
2. **컨트롤이 스크롤 시 벗어남** (High) - absolute → fixed 필요
3. **Pan 작동 안 함** (High) - 좌표계 충돌, CSS scroll로 수정 필요
4. **ZoomToFit 후 중앙 정렬 안 됨** (Low) - 스크롤 위치 조정 필요

### 🎯 익일 우선순위
1. 버그 1 수정 (30분)
2. 버그 3 수정 (1시간)
3. 버그 2 수정 (30분)
4. 버그 4 수정 (20분)
5. 통합 테스트 (30분)
6. Git 커밋 (20분)

**총 예상 시간**: 약 3시간

---

## 다음 세션 시작 시 체크리스트

**⚠️ 이 문서를 반드시 먼저 읽고 작업을 시작하세요!**

- [ ] 이 문서 전체 읽기 (특히 "발견된 버그" 섹션)
- [ ] 버그 우선순위 확인
- [ ] "익일 작업 지시" 순서대로 진행
- [ ] 각 작업 완료 후 테스트 체크리스트 확인
- [ ] 모든 작업 완료 후 이 문서 업데이트
- [ ] Git 커밋 및 푸시

---

**작성 완료**: 2025-11-16 (일) 23:38
**다음 리뷰**: 2025-11-17 (월) 작업 시작 전
**예상 완료**: 2025-11-17 (월) 작업 후 3시간
