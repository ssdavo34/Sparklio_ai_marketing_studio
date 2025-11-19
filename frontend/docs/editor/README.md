# Canvas Studio v3 Documentation

**환영합니다!** 이 문서는 Canvas Studio v3의 설계 및 구현 가이드입니다.

---

## 📚 문서 목록

### 핵심 문서

1. **[000_MASTER_PLAN.md](./000_MASTER_PLAN.md)** ⭐
   - 프로젝트 비전 및 목표
   - 3가지 Sparklio 시나리오 (Meeting AI, URL 기반, Manual)
   - 핵심 차별점: AI + Learning + Automation
   - **시작점**: 먼저 이 문서를 읽으세요

2. **[001_ARCHITECTURE.md](./001_ARCHITECTURE.md)** 🏗️
   - 시스템 아키텍처
   - Headless Editor 패턴
   - 폴더 구조
   - 데이터 흐름

3. **[002_DATA_MODEL.md](./002_DATA_MODEL.md)** 📊
   - EditorDocument/Page/Object 스키마
   - ObjectRole (40+ 역할: headline, product-image, cta-button 등)
   - TemplateDefinition & TrendPattern
   - DesignTokens 구조

4. **[008_AGENTS_INTEGRATION.md](./008_AGENTS_INTEGRATION.md)** 🤖 **NEW**
   - Canvas Studio v3 ↔ 24 Multi-Agent 연계 맵
   - Agent Families (A~F 계열)
   - 메뉴별 에이전트 플로우 (Spark Chat, Meeting AI, Trend Engine 등)
   - EditorAgent, MeetingAIAgent, LayoutDesignerAgent 정의
   - **중요**: A/B팀 모두 필독

5. **[010_IMPLEMENTATION_ROADMAP.md](./010_IMPLEMENTATION_ROADMAP.md)** 📅
   - "메뉴 하나씩 성공시키기" 전략
   - Phase 1-8 상세 일정 (Week 1-13)
   - 각 Phase별 에이전트 연동 계획
   - A팀/B팀 작업 분담

6. **[005_PHASE1_IMPLEMENTATION.md](./005_PHASE1_IMPLEMENTATION.md)** 🚀
   - Phase 1 구현 가이드
   - 레이어 패널 구현
   - 정렬/분배 도구
   - 스마트 가이드
   - **개발 시작**: Phase 1 개발 시 참고

### 추가 문서

7. **[007_AI_INTEGRATION.md](./007_AI_INTEGRATION.md)** 🧠
   - Meeting AI 워크플로우
   - Spark Chat 통합
   - EditorCommand 프로토콜 (15+ 명령 타입)

8. **[009_TREND_ENGINE.md](./009_TREND_ENGINE.md)** 📈
   - 5단계 Trend Pipeline
   - TrendCollectorAgent → TemplateAgent 플로우
   - 자동 학습 및 템플릿 생성

9. **[TEAM_A_REQUEST.md](./TEAM_A_REQUEST.md)** 👨‍💻
   - Frontend 팀 공식 요청서
   - Phase 1-8 상세 작업 내용

10. **[TEAM_B_REQUEST.md](./TEAM_B_REQUEST.md)** 👨‍💻
    - Backend 팀 공식 요청서
    - API 스펙, DB 스키마, Agent 구현

---

## 🎯 현재 상태

### ✅ 완료 (Phase 0)

- Konva.js + Zustand 기반 아키텍처
- 기본 드래그, 선택, 변형
- Undo/Redo 시스템
- 기본 레이아웃 (TopBar + Panels + Canvas)

### 🔄 진행 중 (Phase 1)

- 레이어 패널
- 정렬/분배 도구
- 스마트 가이드
- 그룹 기능

### 📅 예정 (Phase 2+)

- 멀티 문서 탭
- 템플릿 시스템
- AI 통합 (Meeting AI, Spark Chat)
- Export & Publishing

---

## 🚀 빠른 시작

### 1. 문서 읽기 순서

**기획/PM/신규 멤버:**
```
1. 000_MASTER_PLAN.md           (전체 비전 이해)
   ↓
2. 008_AGENTS_INTEGRATION.md    (에이전트 연계 맵)
   ↓
3. 010_IMPLEMENTATION_ROADMAP.md (Phase 1-8 계획)
```

**개발자 (A/B팀):**
```
1. 001_ARCHITECTURE.md          (아키텍처 이해)
   ↓
2. 002_DATA_MODEL.md            (데이터 구조 이해)
   ↓
3. 008_AGENTS_INTEGRATION.md    (에이전트 연계 맵)
   ↓
4. TEAM_A_REQUEST.md 또는 TEAM_B_REQUEST.md (팀별 요청서)
   ↓
5. 005_PHASE1_IMPLEMENTATION.md (실제 개발 시작)
```

### 2. 개발 시작 전 체크리스트

- [ ] 모든 핵심 문서 읽기
- [ ] Phase 1 범위 이해
- [ ] 로컬 개발 환경 설정
- [ ] `npm run dev` 실행 확인
- [ ] `/editor` 페이지 동작 확인

### 3. Phase 1 개발 순서

**Week 1**: 레이어 & 정렬
- Day 1-2: LayersTab 구현
- Day 3-4: AlignmentToolbar 구현
- Day 5: 그룹/언그룹 기능

**Week 2**: 스냅 & 선택
- Day 1-3: SmartGuides 구현
- Day 4-5: Marquee Selection 구현

**Week 3**: 텍스트 & 이미지
- Day 1-3: 리치 텍스트 에디터
- Day 4-5: 이미지 업로드 시스템

---

## 💡 핵심 개념

### Headless Editor 패턴

```
EditorStore (Zustand)  ←→  React Components  ←→  CanvasEngine (Konva)
   (상태 관리)              (UI 렌더링)            (캔버스 렌더링)
```

**핵심**: 모든 상태는 EditorStore에만 존재하고, Konva는 렌더링만 담당

### 데이터 흐름

```
User Action → Konva Event → EditorStore Update → React Re-render → Konva Sync
```

### 확장 포인트

- **새 객체 타입 추가**: `EditorObject` Union Type 확장
- **새 패널 추가**: `RightDock/tabs/` 폴더에 추가
- **새 도구 추가**: `features/` 폴더에 추가

---

## 📁 폴더 구조 요약

```
components/canvas-studio/
├── types/              # 타입 정의
├── stores/             # Zustand Store
├── core/               # CanvasEngine, Executor
├── layout/             # 레이아웃 컴포넌트
│   ├── TopToolbar/
│   ├── ActivityBar/
│   ├── LeftPanel/
│   ├── CanvasViewport/
│   └── RightDock/
├── canvas/             # 캔버스 컴포넌트
│   ├── KonvaStage/
│   ├── objects/
│   └── controls/
├── features/           # 기능 모듈
│   ├── alignment/
│   ├── snap/
│   ├── templates/
│   └── export/
├── adapters/           # Backend 연동
├── hooks/              # Custom Hooks
└── utils/              # 유틸리티
```

---

## 🛠️ 개발 가이드

### 새 기능 추가 시

1. **타입 정의** (`types/`)
2. **Store 액션** (`store/editorStore.ts`)
3. **UI 컴포넌트** (`components/`)
4. **유틸 함수** (`utils/`)
5. **테스트** (수동 → 자동화)

### 코딩 컨벤션

- **컴포넌트**: PascalCase (`LayersTab.tsx`)
- **파일**: kebab-case (`alignment-utils.ts`)
- **함수**: camelCase (`alignObjects()`)
- **타입**: PascalCase (`EditorObject`)
- **상수**: UPPER_SNAKE_CASE (`SNAP_THRESHOLD`)

---

## 🐛 디버깅 팁

### EditorStore 상태 확인

```typescript
// 브라우저 콘솔에서
window.__EDITOR_STORE__ = useEditorStore.getState();
console.log(window.__EDITOR_STORE__.document);
```

### Konva Stage 확인

```typescript
// CanvasEngine에서
console.log(engineRef.current?.stage.toJSON());
```

### History 확인

```typescript
const { history } = useEditorStore();
console.log('Past:', history.past.length);
console.log('Future:', history.future.length);
```

---

## 📞 도움말

### 자주 묻는 질문

**Q: 새 객체 타입을 어떻게 추가하나요?**
A: [002_DATA_MODEL.md](./002_DATA_MODEL.md#editorobject) 참고

**Q: 패널을 어떻게 추가하나요?**
A: [001_ARCHITECTURE.md](./001_ARCHITECTURE.md#컴포넌트-계층) 참고

**Q: AI 통합은 언제 하나요?**
A: Phase 4 (Meeting AI, Spark Chat)

### 기술 스택

- **UI**: React + Next.js 14 + TypeScript
- **State**: Zustand (+ Immer)
- **Canvas**: Konva.js (react-konva)
- **Style**: Tailwind CSS
- **Icons**: Lucide React

---

## 🎨 디자인 리소스

### Figma 참고

- 레이아웃: VSCode + Figma 스타일
- 컬러: Tailwind 기본 팔레트
- 아이콘: Lucide Icons

### 인스피레이션

- **Figma**: 레이어 패널, 정렬 도구
- **Canva**: 직관적인 UX, 템플릿
- **Notion**: 유연한 레이아웃
- **VSCode**: 패널 시스템, 탭

---

## 📊 성능 목표

- **초기 로딩**: < 2초
- **드래그 FPS**: 60fps
- **Undo/Redo**: < 50ms
- **큰 문서 (100+ 객체)**: 부드러운 동작

---

## 🔄 업데이트 로그

### 2025-11-19 (v3.0) 🆕

**Canvas Studio v3 업그레이드:**
- ✅ Editor v2.0 → Canvas Studio v3 리브랜딩
- ✅ Fabric.js 제거, Konva.js 단독 사용
- ✅ 폴더 구조 변경: `src/modules/editor/` → `components/canvas-studio/`
- ✅ 레거시 에디터 완전 제거

**에이전트 연계 문서 추가:**
- ✅ [008_AGENTS_INTEGRATION.md](./008_AGENTS_INTEGRATION.md) 작성
  - Canvas Studio v3 ↔ 24 Multi-Agent 연계 맵
  - Agent Families (A~F 계열) 정리
  - 메뉴별 에이전트 플로우 (Spark Chat, Meeting AI, Trend Engine)
  - EditorAgent, MeetingAIAgent, LayoutDesignerAgent 정의

**기존 문서 보완:**
- ✅ [010_IMPLEMENTATION_ROADMAP.md](./010_IMPLEMENTATION_ROADMAP.md) 업데이트
  - Phase 2, 3, 7에 에이전트 연동 섹션 추가
  - 각 Phase별 사용 에이전트 명시

**문서 구조 개선:**
- ✅ README.md 업데이트 (문서 읽기 순서 개선)
- ✅ [000_MASTER_PLAN.md](./000_MASTER_PLAN.md) 에 3가지 시나리오 추가
- ✅ [002_DATA_MODEL.md](./002_DATA_MODEL.md) 에 ObjectRole, TrendPattern 추가

**참고 자료:**
- [AGENTS_SPEC.md](../../../../docs/PHASE0/AGENTS_SPEC.md) - 24개 에이전트 상세 스펙

### 2025-11-18
- ✅ 문서 시스템 구축
- ✅ Phase 0 완료
- ✅ Phase 1 계획 수립

### 다음 업데이트
- Phase 1 개발 시작
- 레이어 패널 구현
- 정렬 도구 구현
- Phase 2 (Spark Chat) 에이전트 통합

---

**Happy Coding! 🚀**

궁금한 점이 있으면 언제든 문의하세요.
