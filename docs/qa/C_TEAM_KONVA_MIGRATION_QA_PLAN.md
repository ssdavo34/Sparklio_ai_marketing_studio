# C팀 Konva.js 전환 QA 전략 및 테스트 계획서

**작성일**: 2025-11-19 (수요일)
**작성자**: A팀 QA 리더
**대상**: C팀 Frontend (Canvas Editor)
**마이그레이션**: Fabric.js → Konva.js + React + Zustand
**참고 문서**: [EOD_REPORT_2025-11-18_FABRIC_MIGRATION_FAILURE.md](../../frontend/docs/EOD_REPORT_2025-11-18_FABRIC_MIGRATION_FAILURE.md)

---

## 📋 Executive Summary

### 전환 배경
C팀은 2025-11-18에 Fabric.js 6.9.0 마이그레이션 실패로 인해 **Konva.js + React + Zustand** 기반 Canvas 엔진으로 전면 전환을 결정했습니다.

**Fabric.js 주요 문제**:
- ❌ 치명적 렌더링 버그 (Undo/Redo 시 화면 표시 안 됨)
- ❌ 3일간 해결 실패한 textBaseline 버그 (`'alphabetical'` 하드코딩)
- ❌ 6.x Breaking Changes 과다 (전체 재작성 필요)
- ❌ 불안정한 API, 부실한 문서화

**Konva.js 선택 이유**:
- ✅ React 친화적 (`react-konva` 공식 라이브러리)
- ✅ 안정적 API (Breaking Changes 거의 없음)
- ✅ 우수한 문서 및 활발한 커뮤니티
- ✅ Zustand 상태 관리 통합 용이

### QA 목표
Konva.js 전환 후 **기존 Fabric.js에서 작동하던 모든 기능이 정상 작동**하고, **이전 버그가 해결**되었는지 검증합니다.

---

## 1️⃣ Konva.js 전환 개요

### 1.1 C팀 전환 계획 (4 Phase)

**출처**: [EOD_REPORT_2025-11-18_FABRIC_MIGRATION_FAILURE.md](../../frontend/docs/EOD_REPORT_2025-11-18_FABRIC_MIGRATION_FAILURE.md)

| Phase | 내용 | 소요 시간 | A팀 QA 시점 |
|-------|------|----------|------------|
| **Phase 1** | Konva.js 설치 및 기본 설정 | 1-2시간 | 설치 후 즉시 검증 |
| **Phase 2** | 아키텍처 설계 (Zustand Store) | 1시간 | 설계 리뷰 |
| **Phase 3** | Core 기능 구현 | 3-4시간 | 기능별 단위 테스트 |
| **Phase 4** | Backend 통합 | 2시간 | E2E 테스트 |

**총 예상 시간**: 7-9시간

---

### 1.2 새로운 아키텍처

**폴더 구조**:
```
components/canvas-studio-v2/  (새로 생성)
├── KonvaCanvas.tsx          # Konva Stage 컴포넌트
├── shapes/
│   ├── Rectangle.tsx
│   ├── Circle.tsx
│   ├── Triangle.tsx
│   └── Text.tsx
├── stores/
│   └── canvasStore.ts       # Zustand 상태 관리
├── hooks/
│   ├── useCanvasHistory.ts  # Undo/Redo
│   └── useShapeManagement.ts
└── types.ts
```

**Zustand Store 구조**:
```typescript
interface CanvasStore {
  shapes: Shape[];           // 모든 도형 데이터
  selectedIds: string[];     // 선택된 도형 ID
  history: Shape[][];        // Undo/Redo 스택
  historyIndex: number;

  addShape: (shape: Shape) => void;
  removeShape: (id: string) => void;
  updateShape: (id: string, updates: Partial<Shape>) => void;

  undo: () => void;
  redo: () => void;
}
```

---

## 2️⃣ QA 전략 개요

### 2.1 테스트 레벨

#### **Level 1: 단위 테스트 (C팀 책임)**
- Zustand Store 액션 테스트
- Shape 컴포넌트 렌더링 테스트
- Hooks 로직 테스트

**도구**: Vitest + React Testing Library

---

#### **Level 2: 통합 테스트 (A팀 주도)**
- 도형 추가/삭제/이동 통합 테스트
- Undo/Redo 히스토리 관리 테스트
- Layers Panel 연동 테스트

**도구**: Playwright (E2E)

---

#### **Level 3: E2E 테스트 (A팀 주도)**
- Backend Generate API → Konva Canvas 통합
- 사용자 워크플로우 시나리오 테스트
- textBaseline 버그 완전 해결 검증

**도구**: Playwright + Backend API

---

### 2.2 테스트 우선순위

| 우선순위 | 테스트 항목 | Phase | 이유 |
|---------|-----------|-------|------|
| **P0** | Undo/Redo 정상 작동 | Phase 3 | Fabric.js 치명적 버그 해결 검증 |
| **P0** | textBaseline 버그 해결 | Phase 4 | 3일간 미해결 버그 완전 해결 검증 |
| **P0** | 도형 렌더링 정확성 | Phase 3 | 기본 기능 검증 |
| **P1** | Backend 통합 | Phase 4 | Generate API 응답 처리 |
| **P1** | Layers Panel 연동 | Phase 3 | UI 일관성 |
| **P2** | 성능 비교 (Fabric vs Konva) | Phase 4 | 전환 효과 측정 |

---

## 3️⃣ Phase별 QA 작업

### Phase 1: Konva.js 설치 및 기본 설정 (1-2시간)

#### A팀 QA 작업 (30분)

**[QA-01] 설치 검증**
```bash
# frontend/package.json 확인
cat frontend/package.json | grep konva

# 예상 결과:
# "konva": "^9.x.x"
# "react-konva": "^18.x.x"
# "@types/react-konva": "^18.x.x"
```

**성공 기준**:
- ✅ 3개 패키지 모두 설치됨
- ✅ 버전 호환성 확인 (Konva 9.x + react-konva 18.x)
- ✅ TypeScript 타입 정의 설치됨

---

**[QA-02] 기본 렌더링 테스트**

C팀이 작성한 간단한 테스트 페이지 확인:
```tsx
// frontend/app/konva-test/page.tsx
import { Stage, Layer, Rect } from 'react-konva';

export default function KonvaTestPage() {
  return (
    <Stage width={800} height={600}>
      <Layer>
        <Rect x={100} y={100} width={200} height={150} fill="red" />
      </Layer>
    </Stage>
  );
}
```

**검증**:
1. `http://localhost:3001/konva-test` 접속
2. 빨간 사각형이 (100, 100) 위치에 표시되는가?
3. 브라우저 콘솔에 에러 없는가?

**성공 기준**:
- ✅ Stage, Layer, Rect 정상 렌더링
- ✅ 콘솔 에러 없음
- ✅ React Strict Mode 경고 없음

---

### Phase 2: 아키텍처 설계 (1시간)

#### A팀 QA 작업 (30분)

**[QA-03] Zustand Store 설계 리뷰**

**검토 파일**: `frontend/components/canvas-studio-v2/stores/canvasStore.ts`

**체크리스트**:
- [ ] `shapes` 배열 타입 정의 명확한가? (Shape 인터페이스)
- [ ] `history` 스택 구조 올바른가? (깊은 복사 vs 얕은 복사)
- [ ] `historyIndex` 범위 검증 로직 있는가?
- [ ] `undo()`/`redo()` 로직이 히스토리 스택 올바르게 관리하는가?
- [ ] `addShape()` 시 history에 자동 추가되는가?

**리뷰 기준**:
- ✅ 불변성(Immutability) 유지 (Zustand immer 사용 권장)
- ✅ 히스토리 최대 크기 제한 (예: 50개)
- ✅ 타입 안전성 (TypeScript strict mode)

---

**[QA-04] 폴더 구조 검증**

**예상 구조**:
```
frontend/components/canvas-studio-v2/
├── KonvaCanvas.tsx
├── shapes/
│   ├── Rectangle.tsx
│   ├── Circle.tsx
│   ├── Triangle.tsx
│   └── Text.tsx
├── stores/
│   └── canvasStore.ts
├── hooks/
│   ├── useCanvasHistory.ts
│   └── useShapeManagement.ts
└── types.ts
```

**검증**:
- ✅ 폴더 구조가 계획대로 생성되었는가?
- ✅ `types.ts`에 Shape 인터페이스 정의되었는가?
- ✅ 기존 `canvas-studio/` 폴더는 유지되는가? (참고용)

---

### Phase 3: Core 기능 구현 (3-4시간)

#### A팀 QA 작업 (2시간)

**[QA-05] 도형 추가/삭제/이동 테스트**

**시나리오**:
1. Rectangle 버튼 클릭 → 빨간 사각형 추가
2. Circle 버튼 클릭 → 파란 원 추가
3. Triangle 버튼 클릭 → 녹색 삼각형 추가
4. 도형 클릭 → 선택 상태 (테두리 표시)
5. 도형 드래그 → 위치 이동
6. Delete 키 → 선택된 도형 삭제

**검증 항목**:
- ✅ 3개 도형 모두 화면에 표시되는가?
- ✅ 도형 클릭 시 선택 상태 표시되는가?
- ✅ 드래그 시 부드럽게 이동하는가?
- ✅ Delete 키로 삭제되는가?
- ✅ Zustand Store의 `shapes` 배열이 업데이트되는가?

**Playwright 테스트 스크립트**:
```typescript
// frontend/tests/e2e/konva-canvas.spec.ts
import { test, expect } from '@playwright/test';

test('도형 추가 및 삭제', async ({ page }) => {
  await page.goto('http://localhost:3001/canvas-studio-v2');

  // Rectangle 추가
  await page.click('button:has-text("Rectangle")');
  await expect(page.locator('canvas')).toBeVisible();

  // 도형 개수 확인 (Zustand devtools 또는 DOM 검증)
  const shapeCount = await page.evaluate(() => {
    return window.__ZUSTAND_STORE__.getState().shapes.length;
  });
  expect(shapeCount).toBe(1);

  // Circle 추가
  await page.click('button:has-text("Circle")');
  expect(await page.evaluate(() => window.__ZUSTAND_STORE__.getState().shapes.length)).toBe(2);

  // 첫 번째 도형 클릭 (선택)
  await page.click('canvas', { position: { x: 100, y: 100 } });

  // Delete 키
  await page.keyboard.press('Delete');
  expect(await page.evaluate(() => window.__ZUSTAND_STORE__.getState().shapes.length)).toBe(1);
});
```

---

**[QA-06] Undo/Redo 테스트 ⭐ **최우선****

**목적**: Fabric.js 치명적 버그 해결 검증

**시나리오**:
1. Rectangle 추가 (History: [State0, State1])
2. Circle 추가 (History: [State0, State1, State2])
3. **Undo** (Ctrl+Z) → Circle 제거, Rectangle만 남음
4. **검증**: Canvas에 Rectangle만 보이는가? ✅
5. **Redo** (Ctrl+Shift+Z) → Circle 다시 추가
6. **검증**: Canvas에 Rectangle + Circle 보이는가? ✅
7. Triangle 추가 (History: [State0, State1, State2, State3])
8. Undo 3회 → 모든 도형 제거
9. **검증**: Canvas 비어 있는가? ✅

**Fabric.js 문제 재현 방지**:
- ❌ Fabric.js: Undo 후 객체는 있지만 **화면에 보이지 않음**
- ✅ Konva.js: Undo 후 즉시 **화면 업데이트** 확인

**성공 기준**:
- ✅ Undo/Redo 10회 반복 → 모두 정상 작동
- ✅ 화면과 Zustand Store 상태 일치
- ✅ 히스토리 인덱스 범위 체크 (음수/초과 방지)

**Playwright 테스트**:
```typescript
test('Undo/Redo 정상 작동', async ({ page }) => {
  await page.goto('http://localhost:3001/canvas-studio-v2');

  // Rectangle 추가
  await page.click('button:has-text("Rectangle")');
  expect(await getShapeCount(page)).toBe(1);

  // Circle 추가
  await page.click('button:has-text("Circle")');
  expect(await getShapeCount(page)).toBe(2);

  // Undo (Ctrl+Z)
  await page.keyboard.press('Control+Z');
  await page.waitForTimeout(500); // 렌더링 대기
  expect(await getShapeCount(page)).toBe(1);

  // 화면에 실제로 1개만 표시되는지 검증 (시각적 테스트)
  const screenshot1 = await page.screenshot();
  // ... 이미지 비교 로직

  // Redo (Ctrl+Shift+Z)
  await page.keyboard.press('Control+Shift+Z');
  await page.waitForTimeout(500);
  expect(await getShapeCount(page)).toBe(2);
});
```

---

**[QA-07] Layers Panel 연동 테스트**

**시나리오**:
1. Rectangle, Circle, Triangle 순서로 추가
2. Layers Panel에 3개 레이어 표시되는가?
3. 레이어 순서가 올바른가? (Triangle → Circle → Rectangle, 위에서 아래)
4. 레이어 클릭 → Canvas에서 해당 도형 선택되는가?
5. 레이어 드래그 → 순서 변경 → Canvas Z-index 변경되는가?

**성공 기준**:
- ✅ Layers Panel과 Canvas 동기화
- ✅ Z-index 순서 올바름
- ✅ 레이어 클릭 시 Canvas 선택 상태 반영

---

**[QA-08] 그룹/언그룹 테스트**

**시나리오**:
1. Rectangle 2개 추가
2. 두 개 선택 (Shift + 클릭)
3. 그룹 생성 (Ctrl+G)
4. 그룹 드래그 → 두 개가 함께 이동하는가?
5. 언그룹 (Ctrl+Shift+G)
6. 개별 이동 가능한가?

**성공 기준**:
- ✅ 그룹 생성 시 Konva Group 객체 생성
- ✅ 그룹 드래그 시 자식 도형 함께 이동
- ✅ 언그룹 시 개별 도형으로 분리

---

### Phase 4: Backend 통합 (2시간)

#### A팀 QA 작업 (1.5시간)

**[QA-09] Generate API → Konva Shapes 변환 테스트 ⭐**

**목적**: Backend Generate API 응답을 Konva Shapes로 정확히 변환하는지 검증

**테스트 시나리오**:
1. Generate API 호출 (product_detail)
```bash
curl -X POST http://100.123.51.5:8000/api/v1/generate \
  -H "Content-Type: application/json" \
  -d '{
    "kind": "product_detail",
    "brandId": "test_brand",
    "input": {"prompt": "지성 피부용 진정 토너"}
  }'
```

2. 응답 받기:
```json
{
  "editorDocument": {
    "pages": [{
      "objects": [
        {
          "type": "text",
          "role": "PRODUCT_NAME",
          "props": {
            "text": "지성 피부용 진정 토너",
            "fontSize": 56,
            "fill": "#111111",
            "fontFamily": "Pretendard"
          },
          "bounds": {"x": 100, "y": 80, "width": 1000, "height": 100}
        }
      ]
    }]
  }
}
```

3. Frontend에서 Konva Text로 변환
4. Canvas에 정확히 렌더링되는지 확인

**검증 항목**:
- ✅ `text` 속성 → Konva Text `text` prop
- ✅ `fontSize`, `fill`, `fontFamily` 정확히 적용
- ✅ `bounds` → Konva `x`, `y`, `width`, `height`
- ✅ **textBaseline 버그 해결**: `textBaseline="alphabetic"` (Fabric.js는 `'alphabetical'` 오타)

---

**[QA-10] textBaseline 버그 완전 해결 검증 ⭐⭐⭐**

**목적**: 3일간 미해결이었던 Fabric.js textBaseline 버그가 Konva에서 완전히 해결되었는지 검증

**Fabric.js 문제**:
```javascript
// Fabric.js 5.3.0 하드코딩
textBaseline: 'alphabetical'  // ❌ 잘못된 값 (표준: 'alphabetic')
```

**Konva.js 검증**:
```typescript
// Konva Text 속성 확인
const text = new Konva.Text({
  text: '지성 피부용 진정 토너',
  fontSize: 56,
  fontFamily: 'Pretendard',
  fill: '#111111'
});

console.log(text.textBaseline());  // 기대값: undefined 또는 'alphabetic'
```

**테스트**:
1. Backend Generate API 응답 받기
2. Frontend에서 Konva Text 생성
3. `text.textBaseline()` 확인
4. 브라우저 DevTools로 실제 Canvas 렌더링 확인

**성공 기준**:
- ✅ Konva는 `textBaseline` 자동 처리 (기본값: `'alphabetic'`)
- ✅ Backend 응답에 `textBaseline` 필드 불필요
- ✅ 텍스트 세로 정렬 정확함
- ✅ Fabric.js처럼 강제 변경 없음

---

**[QA-11] E2E 워크플로우 테스트**

**전체 시나리오**:
1. 사용자가 Frontend에서 "제품 상세페이지 생성" 버튼 클릭
2. Backend Generate API 호출 (product_detail)
3. 응답 받기 (editorDocument JSON)
4. Konva Canvas에 렌더링
5. 사용자가 도형 수정 (위치 이동, 크기 조절, 텍스트 편집)
6. Undo/Redo 테스트
7. 저장 버튼 클릭 → Konva Shapes → Backend JSON 변환
8. Backend에 저장

**성공 기준**:
- ✅ 전체 워크플로우 에러 없이 완료
- ✅ 생성 → 편집 → 저장 → 불러오기 → 재편집 가능
- ✅ textBaseline 버그 없음
- ✅ Undo/Redo 안정적

---

## 4️⃣ Fabric.js vs Konva.js 비교 테스트

### 4.1 목적
전환 효과를 정량적으로 측정합니다.

### 4.2 비교 항목

| 항목 | Fabric.js 5.3.0 | Konva.js 9.x | 개선 여부 |
|------|-----------------|--------------|----------|
| **Undo/Redo 정상 작동** | ❌ 화면 표시 안 됨 | ✅ 정상 | ✅ |
| **textBaseline 버그** | ❌ 'alphabetical' 하드코딩 | ✅ 자동 처리 | ✅ |
| **렌더링 안정성** | ⚠️ loadFromJSON 후 불안정 | ✅ 안정적 | ✅ |
| **React 통합** | ⚠️ 수동 관리 | ✅ react-konva | ✅ |
| **상태 관리** | ⚠️ Canvas 내부 | ✅ Zustand | ✅ |
| **도형 추가 속도** | 측정 필요 | 측정 필요 | 비교 |
| **메모리 사용량** | 측정 필요 | 측정 필요 | 비교 |
| **렌더링 FPS** | 측정 필요 | 측정 필요 | 비교 |

### 4.3 성능 벤치마크

**테스트 시나리오**:
- 도형 100개 추가 → 소요 시간 측정
- 도형 100개 드래그 → FPS 측정
- 메모리 사용량 (Chrome DevTools Performance)

**예상 결과**:
- Konva.js가 Fabric.js보다 가볍고 빠를 것으로 예상
- React 통합으로 개발 속도 향상

---

## 5️⃣ 회귀 테스트 체크리스트

### 5.1 Fabric.js에서 작동하던 기능 목록

**기존 기능 (Fabric.js)**:
- ✅ Canvas 초기화
- ✅ 도형 추가 (Rectangle, Circle, Triangle, Text)
- ✅ 도형 선택/이동/크기 조절
- ✅ 도형 삭제
- ✅ Layers Panel 표시
- ✅ 그룹/언그룹 (불안정)
- ❌ Undo/Redo (치명적 버그)
- ❌ Backend 통합 (textBaseline 버그)

**Konva.js에서 동일하게 작동해야 할 항목**:
- [ ] Canvas 초기화
- [ ] 도형 추가 (Rectangle, Circle, Triangle, Text)
- [ ] 도형 선택/이동/크기 조절
- [ ] 도형 삭제
- [ ] Layers Panel 표시
- [ ] 그룹/언그룹 (안정화)
- [ ] **Undo/Redo (버그 해결)** ⭐
- [ ] **Backend 통합 (textBaseline 버그 해결)** ⭐

---

## 6️⃣ 테스트 자동화

### 6.1 Playwright E2E 테스트

**파일**: `frontend/tests/e2e/konva-canvas.spec.ts`

**포함 테스트**:
1. 도형 추가/삭제
2. Undo/Redo
3. Layers Panel 연동
4. 그룹/언그룹
5. Backend 통합

**실행**:
```bash
cd frontend
npx playwright test
```

---

### 6.2 Visual Regression Testing

**도구**: Playwright Screenshot Comparison

**테스트**:
1. 도형 3개 추가 → 스크린샷 저장
2. Undo → 스크린샷 비교
3. Redo → 스크린샷 비교

**목적**: 시각적 버그 자동 감지

---

## 7️⃣ 버그 리포트 템플릿

**파일**: `docs/qa/KONVA_MIGRATION_BUG_REPORTS.md`

**포맷**:
```markdown
## Bug #K01: Undo 시 화면 깜빡임

**심각도**: Low
**발견 일시**: 2025-11-XX 14:30
**테스트 케이스**: QA-06 (Undo/Redo)

**재현 방법**:
1. 도형 3개 추가
2. Undo (Ctrl+Z) 빠르게 2회

**기대 결과**: 부드럽게 도형 제거
**실제 결과**: 화면이 0.1초 깜빡임

**원인 분석**: Konva Layer.batchDraw() 미사용

**해결 방안**:
```typescript
layer.batchDraw(); // 대신
stage.batchDraw(); // 사용
```

**우선순위**: P2 (UX 개선)
**담당**: C팀
```

---

## 8️⃣ 테스트 일정

### C팀 작업 완료 시점별 A팀 QA

| C팀 Phase 완료 시점 | A팀 QA 작업 | 소요 시간 |
|--------------------|-----------|----------|
| **Phase 1 완료** | QA-01, QA-02 (설치 검증) | 30분 |
| **Phase 2 완료** | QA-03, QA-04 (설계 리뷰) | 30분 |
| **Phase 3 완료** | QA-05 ~ QA-08 (기능 테스트) | 2시간 |
| **Phase 4 완료** | QA-09 ~ QA-11 (통합 테스트) | 1.5시간 |

**총 A팀 소요 시간**: 4.5시간

---

## 9️⃣ 성공 기준 (종합)

### 9.1 필수 (P0)
- ✅ Undo/Redo 10회 반복 → 모두 정상 작동 (화면 표시 확인)
- ✅ textBaseline 버그 완전 해결 (Backend 응답 정확히 렌더링)
- ✅ 도형 추가/삭제/이동 100% 정상
- ✅ Backend 통합 E2E 테스트 통과

### 9.2 중요 (P1)
- ✅ Layers Panel 연동 100% 정상
- ✅ 그룹/언그룹 안정적 작동
- ✅ Playwright E2E 테스트 자동화 완료

### 9.3 개선 (P2)
- ✅ Fabric.js 대비 성능 향상 (FPS, 메모리)
- ✅ Visual Regression Testing 통과

---

## 🔟 리스크 및 대응

### 리스크 1: Konva.js 예상치 못한 버그 발견
**가능성**: Medium
**영향**: High

**대응책**:
- 초기 Phase 1, 2에서 빠른 검증
- 버그 발견 시 즉시 C팀에 피드백
- 필요 시 Fabric.js 롤백 계획 유지 (단, 가능성 낮음)

---

### 리스크 2: Backend JSON → Konva Shapes 변환 복잡도
**가능성**: Medium
**영향**: Medium

**대응책**:
- Phase 4에서 충분한 시간 할애 (2시간)
- Adapter 패턴 사용 (기존 Fabric.js Adapter 참고)
- 단위 테스트 작성 (변환 로직)

---

### 리스크 3: 개발 시간 초과
**가능성**: Low
**영향**: Low

**대응책**:
- Konva.js 문서가 우수하여 빠른 개발 가능
- React 친화적이어서 학습 곡선 낮음
- 7-9시간 예상은 충분히 현실적

---

## 1️⃣1️⃣ 산출물

### 11.1 테스트 보고서
**파일**: `docs/qa/KONVA_MIGRATION_TEST_REPORT.md`

**포함 내용**:
- Phase별 테스트 결과
- Fabric.js vs Konva.js 비교 분석
- 발견된 버그 목록
- 성능 벤치마크 데이터
- 최종 승인 여부

---

### 11.2 회귀 테스트 결과
**파일**: `docs/qa/KONVA_REGRESSION_TEST_RESULTS.md`

**포맷**:
```markdown
| 기능 | Fabric.js | Konva.js | 상태 |
|------|-----------|----------|------|
| Canvas 초기화 | ✅ | ✅ | 통과 |
| 도형 추가 | ✅ | ✅ | 통과 |
| Undo/Redo | ❌ | ✅ | **개선** |
| textBaseline | ❌ | ✅ | **해결** |
```

---

## 1️⃣2️⃣ 참고 문서

1. **[EOD_REPORT_2025-11-18_FABRIC_MIGRATION_FAILURE.md](../../frontend/docs/EOD_REPORT_2025-11-18_FABRIC_MIGRATION_FAILURE.md)** - Fabric.js 실패 원인 분석
2. **[Konva.js 공식 문서](https://konvajs.org/)** - Konva API
3. **[react-konva 문서](https://konvajs.org/docs/react/)** - React 통합
4. **[Zustand 공식 문서](https://github.com/pmndrs/zustand)** - 상태 관리

---

**작성 완료**: 2025-11-19 (수) 11:30
**검토자**: C팀 Frontend 리더 (검토 요청)
**승인자**: A팀 QA 리더
**다음 단계**: C팀 Phase 1 완료 시 QA-01, QA-02 실행
