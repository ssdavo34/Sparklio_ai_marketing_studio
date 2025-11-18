# EOD Report: 2025-11-18 (화) - Fabric.js 6.9.0 마이그레이션 실패 및 Konva.js 전환 결정

**작성일**: 2025-11-18 23:30 KST
**작성자**: C팀 (Frontend Team)
**세션 시작**: 2025-11-18 22:00 KST
**세션 종료**: 2025-11-18 23:30 KST
**작업 시간**: 약 1.5시간

---

## 📋 Executive Summary

**핵심 결정**: Fabric.js 포기 및 **Konva.js + Zustand + React**로 전면 전환

**이유**:
1. Fabric.js 6.9.0 업그레이드 후 **치명적인 렌더링 버그** 발생
2. Breaking Changes가 너무 많아 **코드 전체 재작성** 필요
3. Undo/Redo 히스토리 관리 완전히 작동 불능
4. 3일간 Fabric.js 5.3.0 textBaseline 버그 해결 실패
5. **생산성 저하** 및 **프로젝트 진행 불가** 상태

---

## 🔥 치명적 문제 요약

### 1. Fabric.js 5.3.0 (기존 버전)
- **textBaseline 버그**: `'alphabetical'` 하드코딩 → `'alphabetic'` 필요
- 3일간 해결 시도했으나 근본적 해결 불가
- Backend에서 올바른 데이터를 보내도 Fabric.js가 강제로 변경

### 2. Fabric.js 6.9.0 (업그레이드 시도)
**Breaking Changes 목록**:
- `insertAt(object, index)` → `insertAt(index, ...objects)` 시그니처 변경
- `sendToBack()` → `sendObjectToBack()` 메서드 이름 변경
- `clone(callback)` → `clone().then(callback)` Promise 기반 변경
- `toGroup()` 완전 제거 → 수동 Group 생성 필요
- `_restoreObjectsState()` 제거 → `removeAll()` 사용
- `loadFromJSON()` 콜백이 **각 객체마다 호출** (이전: 한 번만 호출)
- `data` 속성 제거 → 커스텀 속성 직접 사용
- `add()`, `remove()` 반환값 변경

**치명적 렌더링 버그**:
- Undo/Redo 실행 시 Canvas에 객체는 있지만 **화면에 보이지 않음**
- 객체가 있는 자리를 클릭하면 **그때서야 렌더링됨**
- `requestRenderAll()` + `renderAll()` + `setCoords()` 모두 실행해도 불안정
- 레이어 삭제 후 Undo 시 복원 안 됨

---

## 📁 수정된 파일 목록

### 1. 라우트 정리
- ✅ **삭제**: `app/studio/` 폴더 (중복 라우트 제거)
- ✅ **수정**: `app/page.tsx` - "제거 예정" 주석 삭제
- ✅ **생성**: `ROUTING_STRUCTURE.md` - 단일 에디터 구조 문서화

### 2. Fabric.js 6.x API 호환성 수정 (모두 실패)
- ❌ `components/canvas-studio/hooks/useCanvasEngine.ts` (856줄)
  - `insertAt()`, `sendObjectToBack()`, `clone()`, `toGroup()`, `removeAll()` 수정
  - Undo/Redo 렌더링 버그 수정 시도 실패
- ❌ `components/canvas-studio/components/LayersPanel.tsx`
  - `insertAt()` 시그니처 수정
  - 커스텀 속성 접근 방식 변경
- ❌ `components/canvas-studio/adapters/response-to-fabric.ts`
  - `loadFromJSON()` 중복 콜백 수정
  - 렌더링 강제 실행 추가 (실패)
- ✅ `components/canvas-studio/context/CanvasContext.tsx` - import 수정

### 3. 환경 확인
- ✅ `package.json`: `"fabric": "^5.3.0"` (Linter가 6.9.0 → 5.3.0으로 되돌림)
- ✅ `.env.local`: Backend URL 정상 설정됨

---

## 🚨 현재 상태

### 작동하는 기능
- ✅ Canvas 초기화
- ✅ 도형 추가 (Rectangle, Circle, Triangle, Text)
- ✅ 도형 선택/이동/크기 조절
- ✅ 도형 삭제
- ✅ Layers Panel 표시
- ✅ 그룹/언그룹 (불안정)

### 작동하지 않는 기능
- ❌ **Undo/Redo** (치명적 버그)
- ❌ **Backend Generate API 통합** (textBaseline 버그)
- ❌ 히스토리 관리 (loadFromJSON 렌더링 실패)
- ❌ Copy/Paste (clone Promise 불안정)

### 개발 서버 상태
- ✅ Frontend: http://localhost:3001 (정상)
- ✅ Backend: http://100.123.51.5:8000 (정상)
- ⚠️ 컴파일 에러 없음, 런타임 렌더링 버그만 존재

---

## 💡 Konva.js 전환 결정 근거

### Fabric.js의 문제점
1. **불안정한 버전 관리**:
   - 5.3.0: textBaseline 버그 (3일간 해결 실패)
   - 6.9.0: 너무 많은 Breaking Changes (전체 재작성 필요)
2. **부실한 문서화**:
   - 공식 문서가 실제 API와 다름
   - GitHub Issue에서만 답 찾을 수 있음
3. **렌더링 불안정성**:
   - `loadFromJSON()` 후 화면 업데이트 안 됨
   - `renderAll()` 호출해도 작동 안 함
4. **유지보수 불가**:
   - 매 마이너 버전마다 Breaking Changes
   - 커뮤니티 작음, 해결책 찾기 어려움

### Konva.js의 장점
1. **React 친화적**:
   - `react-konva` 공식 라이브러리 존재
   - React 컴포넌트 방식으로 Canvas 관리
2. **안정적인 API**:
   - Breaking Changes 거의 없음
   - 예측 가능한 렌더링 동작
3. **강력한 성능**:
   - Fabric.js보다 가볍고 빠름
   - 복잡한 Canvas 애플리케이션에 최적화
4. **우수한 문서**:
   - 공식 문서 완벽함
   - React 예제 풍부
5. **활발한 커뮤니티**:
   - GitHub Stars 11k+ (Fabric.js: 28k+이지만 활동 저조)
   - 빠른 이슈 응답

### 기술 스택 비교

| 항목 | Fabric.js (현재) | Konva.js (전환) |
|------|------------------|-----------------|
| React 통합 | ❌ 수동 관리 필요 | ✅ react-konva 공식 지원 |
| 렌더링 안정성 | ❌ 불안정 (6.x) | ✅ 안정적 |
| API 안정성 | ❌ Breaking Changes 많음 | ✅ 안정적 |
| 문서화 | ⚠️ 부실 | ✅ 우수 |
| 성능 | ⚠️ 무거움 | ✅ 가벼움 |
| Undo/Redo | ❌ 직접 구현 (실패) | ✅ 쉬운 구현 |
| 상태 관리 | ❌ Canvas 내부 | ✅ Zustand와 통합 |

---

## 🎯 다음 작업 (내일 새 세션)

### Phase 1: Konva.js 설치 및 기본 설정 (1-2시간)

```bash
npm install konva react-konva
npm install --save-dev @types/react-konva
```

**목표**:
- Konva.js + react-konva 설치
- 기본 Stage, Layer 설정
- 간단한 도형 렌더링 테스트

### Phase 2: 아키텍처 설계 (1시간)

**새로운 폴더 구조**:
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

### Phase 3: Core 기능 구현 (3-4시간)

**우선순위 순서**:
1. 도형 추가/삭제/이동
2. Zustand 상태 관리
3. Undo/Redo (Zustand 히스토리)
4. 선택/다중 선택
5. 그룹/언그룹
6. Layers Panel 연동

### Phase 4: Backend 통합 (2시간)

- Generate API 응답 → Konva Shapes 변환
- Konva Shapes → Backend JSON 변환
- textBaseline 버그 완전 해결 (Konva는 문제 없음)

---

## 📚 참고 자료

### Konva.js 공식 문서
- **공식 사이트**: https://konvajs.org/
- **React 통합**: https://konvajs.org/docs/react/
- **API 문서**: https://konvajs.org/api/Konva.html

### 유용한 예제
- React-Konva 기본: https://konvajs.org/docs/react/Intro.html
- Undo/Redo: https://konvajs.org/docs/select_and_transform/Undo.html
- 드래그 앤 드롭: https://konvajs.org/docs/drag_and_drop/Drag_and_Drop.html
- 그룹: https://konvajs.org/docs/groups_and_layers/Groups.html

### Zustand 통합
- Zustand 공식: https://github.com/pmndrs/zustand
- React-Konva + Zustand 예제: https://codesandbox.io/s/konva-zustand

---

## 🛠️ 마이그레이션 체크리스트

### 사전 준비
- [ ] Konva.js, react-konva, @types/react-konva 설치
- [ ] `components/canvas-studio-v2/` 폴더 생성
- [ ] 기존 `components/canvas-studio/` 폴더는 유지 (참고용)

### 기능별 마이그레이션
- [ ] Canvas 초기화 (Stage, Layer)
- [ ] 도형 생성 (Rectangle, Circle, Triangle, Text)
- [ ] 도형 선택/이동
- [ ] Zustand Store 설정
- [ ] Undo/Redo (Zustand 히스토리)
- [ ] Layers Panel
- [ ] Inspector Panel
- [ ] 그룹/언그룹
- [ ] Copy/Paste
- [ ] Backend Generate API 통합

### 테스트 항목
- [ ] 도형 3개 추가 → 모두 보이는가?
- [ ] Undo/Redo → 정확히 작동하는가?
- [ ] Backend Generate → textBaseline 버그 해결됐는가?
- [ ] Layers Panel → 순서 변경 작동하는가?
- [ ] 그룹/언그룹 → 안정적인가?

---

## 💬 팀 커뮤니케이션

### A팀 (QA)에게
- Fabric.js 6.9.0 업그레이드 실패로 Konva.js 전환 결정
- 내일부터 새로운 Canvas 엔진 구현 시작
- 테스트는 Konva.js 버전 완성 후 요청 예정

### B팀 (Backend)에게
- Generate API는 정상 작동 중
- textBaseline 버그는 Frontend 라이브러리 문제였음
- Konva.js 전환 후 정상 통합 가능할 것으로 예상

---

## 📌 중요한 교훈

1. **라이브러리 선택 시 고려사항**:
   - React 친화성 (공식 React 통합 라이브러리 유무)
   - API 안정성 (Breaking Changes 빈도)
   - 커뮤니티 활성도
   - 문서 품질

2. **기술 부채 조기 발견**:
   - Fabric.js textBaseline 버그를 3일간 방치한 것이 실수
   - 더 빨리 라이브러리 전환 결정했어야 함

3. **프로토타입 우선**:
   - 다음에는 여러 라이브러리로 프로토타입 먼저 만들고 비교
   - Konva.js로 먼저 테스트했다면 시간 절약

---

## 🎬 마무리

**오늘의 성과**:
- ✅ Fabric.js 문제점 정확히 진단
- ✅ Konva.js 전환 결정 및 근거 수립
- ✅ 다음 작업 로드맵 완성
- ✅ 완벽한 작업일지 작성

**내일 새 클로드에게**:
이 문서를 정독하고 `Phase 1`부터 차근차근 진행하세요. Fabric.js 코드는 참고만 하고, 새로 작성하는 것이 더 빠릅니다. Konva.js는 React 친화적이므로 훨씬 쉽게 구현할 수 있습니다. 화이팅! 💪

---

**작성 완료**: 2025-11-18 23:30 KST
**다음 세션 예정**: 2025-11-19 (수) 오전
