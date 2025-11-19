# A팀 (Frontend) 작업 요청서

**발행일**: 2025-11-19
**프로젝트**: Sparklio Editor v2.0
**담당**: A팀 (Frontend/React/TypeScript)
**우선순위**: Phase 1 → Phase 8 순차 진행

---

## 📋 요청 개요

### 전체 목표

Sparklio Editor v2.0의 **모든 Frontend UI/UX**를 구현합니다.

- **기술 스택**: Next.js 14, React, TypeScript, Konva.js, Zustand, Tailwind CSS
- **전략**: "메뉴 하나씩 성공시키기"
- **각 Phase 종료 시**: 1차 성공 조건 달성 → 다음 Phase 진행

### 핵심 문서

반드시 먼저 읽어주세요:

1. [000_MASTER_PLAN.md](./000_MASTER_PLAN.md) - 프로젝트 전체 비전
2. [001_ARCHITECTURE.md](./001_ARCHITECTURE.md) - 시스템 아키텍처
3. [002_DATA_MODEL.md](./002_DATA_MODEL.md) - 데이터 모델
4. [005_PHASE1_IMPLEMENTATION.md](./005_PHASE1_IMPLEMENTATION.md) - Phase 1 상세 구현 가이드
5. [010_IMPLEMENTATION_ROADMAP.md](./010_IMPLEMENTATION_ROADMAP.md) - 전체 로드맵

---

## Phase 1: Canvas Studio (Week 1-3)

### 🎯 목표

**Konva.js + Zustand 기반 전문가급 에디터 완성**

사용자가 텍스트/이미지/도형을 자유롭게 추가·편집·삭제할 수 있어야 합니다.

### ✅ 1차 성공 조건

```
[ ] Konva + Zustand 기반 Editor v2 작동
[ ] 페이지 로딩 / 저장 (B팀 API 연동)
[ ] 텍스트 / 이미지 / 사각형 추가·이동·리사이즈·삭제
[ ] 선택 / 레이어 / Inspector 기본 속성 편집
[ ] 기존 Fabric.js 없이도 상품상세 1페이지 정도는 편하게 제작 가능
[ ] /editor 한 화면에서 작업 가능 (레이아웃 고정)
```

### 📂 작업 항목

#### Week 1: Core Architecture

```typescript
// 1. EditorStore (Zustand) 완성
// src/modules/editor/store/editorStore.ts

[ ] State 정의
    - document: EditorDocument | null
    - activePageId: string | null
    - selectedIds: string[]
    - clipboard: EditorObject | null
    - zoom, pan, tool, panels
    - history: { past, future, maxHistory: 50 }

[ ] Actions 구현
    - loadDocument(doc: EditorDocument)
    - saveDocument() → B팀 API 호출
    - updateObject(id, updates)
    - deleteObject(id)
    - undo(), redo()
    - saveHistory()

// 2. CanvasEngine (Konva) 완성
// src/modules/editor/core/CanvasEngine.tsx

[ ] Konva Stage/Layer 렌더링
    - EditorStore 구독 → Konva 동기화
    - 드래그, 리사이즈, 회전 이벤트
    - Transformer (선택 박스)

[ ] 이벤트 핸들러
    - onDragEnd → EditorStore.updateObject
    - onTransformEnd → EditorStore.updateObject
    - onClick → EditorStore.setSelectedIds

// 3. 타입 정의
// src/modules/editor/types/

[ ] document.ts
    - EditorDocument, EditorPage, EditorObject
    - TextObject, ImageObject, ShapeObject

[ ] design-tokens.ts
    - DesignTokens, ColorTokens, TypographyTokens
```

#### Week 2: UI Components

```typescript
// 1. TopBar
// src/modules/editor/components/TopBar/TopBar.tsx

[ ] 문서 제목 편집 (inline editable)
[ ] Undo/Redo 버튼 (disabled 상태 처리)
[ ] Zoom 컨트롤 (+/- /Fit)
[ ] 도구 선택 (Select, Text, Shape, Image)

// 2. LeftPanel
// src/modules/editor/components/LeftPanel/LeftPanel.tsx

[ ] Pages 탭
    - 페이지 목록 (썸네일 + 이름)
    - 추가/삭제/순서변경
[ ] 접기/펼치기 버튼

// 3. Canvas
// src/modules/editor/components/Canvas/Canvas.tsx

[ ] Konva Stage 컨테이너
[ ] Grid 표시 (옵션)
[ ] 스마트 가이드 (기본)

// 4. RightDock
// src/modules/editor/components/RightDock/RightDock.tsx

[ ] Inspector 탭
    - 선택 객체 속성 편집 (fontSize, fill, etc.)
[ ] Layers 탭
    - 계층 구조 트리
    - 잠금/숨김 토글
[ ] 접기/펼치기 버튼
```

#### Week 2-3: Object Manipulation

```typescript
// 1. Text Object
[ ] 더블클릭 → 인라인 편집
[ ] Inspector: fontSize, fontFamily, fontWeight, textAlign, fill

// 2. Image Object
[ ] 드래그 앤 드롭 업로드
    - B팀 POST /api/v1/upload/image 호출
    - Response URL → ImageObject.src
[ ] Inspector: fit (contain/cover/fill), opacity

// 3. Shape Object
[ ] 기본 도형: rect, circle, ellipse
[ ] Inspector: fill, stroke, strokeWidth, cornerRadius

// 4. Group/Ungroup
[ ] 다중 선택 → Ctrl+G (그룹 생성)
[ ] 그룹 선택 → Ctrl+Shift+G (언그룹)
```

#### Week 3: Advanced Features

```typescript
// 1. Alignment Tools
// src/modules/editor/features/alignment/AlignmentToolbar.tsx

[ ] 버튼: Left, Center, Right, Top, Middle, Bottom
[ ] Distribute Horizontally/Vertically

// 2. Smart Guides
// src/modules/editor/features/snap/SmartGuides.tsx

[ ] 드래그 시 다른 객체와의 정렬선 표시
[ ] 스냅 거리: 5px

// 3. Keyboard Shortcuts
[ ] Ctrl+Z (Undo), Ctrl+Y (Redo)
[ ] Ctrl+C/V (Copy/Paste)
[ ] Delete (삭제)
[ ] Arrow keys (1px 이동)
```

### 🔗 B팀 API 의존성

```
필수 API (B팀 제공 필요):

1. GET /api/v1/documents/:id
   - EditorDocument 조회

2. POST /api/v1/documents
   - EditorDocument 생성

3. PUT /api/v1/documents/:id
   - EditorDocument 저장

4. POST /api/v1/upload/image
   - 이미지 업로드 → MinIO URL 반환
```

### 📝 완료 기준

- [ ] `/editor` 페이지 접속 → 샘플 문서 로드
- [ ] 텍스트 추가 → 편집 → 저장 → 새로고침 → 유지됨
- [ ] 이미지 업로드 → 캔버스에 표시
- [ ] Undo/Redo 50회까지 작동
- [ ] 레이어 패널에서 객체 순서 변경 → 캔버스 반영

---

## Phase 2: Spark Chat (Week 4-5)

### 🎯 목표

**채팅 기반 브리프 → 자동 문서 생성**

### ✅ 1차 성공 조건

```
[ ] /spark 페이지에서 자연어 브리프 입력
[ ] LLM이 브리프 + 구조 제안 생성
[ ] "초안 만들기" 버튼 → EditorDocument 생성
[ ] 자동으로 /editor?docId=xxx 이동
```

### 📂 작업 항목

```typescript
// 1. Spark Chat UI
// src/app/spark/page.tsx

[ ] 채팅 입력창 (textarea)
[ ] 메시지 리스트 (user/assistant)
[ ] "초안 만들기" 버튼

// 2. API 연동
[ ] POST /api/v1/chat/analyze
    Request: { message: "나이키 에어맥스 인스타그램 광고" }
    Response: { chatSessionId, contentType, suggestedStructure }

[ ] POST /api/v1/chat/generate-document
    Request: { chatSessionId }
    Response: { documentId, document: EditorDocument }

// 3. Editor 이동
[ ] /editor?docId=xxx 이동
[ ] URL 파라미터 → GET /api/v1/documents/:id
[ ] EditorStore.loadDocument(document)

#### Week 5: Agent Integration

```typescript
// 1. Agent Execution Hook
// src/modules/editor/hooks/useAgent.ts

[ ] useAgent 훅 구현
    - POST /api/v1/agents/execute 호출
    - Loading 상태 관리
    - Error 핸들링

// 2. Agent Command Handler
// src/modules/editor/store/agentMiddleware.ts

[ ] Agent가 반환한 Command 리스트 실행
    - EditorStore.dispatch(commands)
    - History에 'Agent Action'으로 기록
```
```

### 📝 완료 기준

- [ ] Spark Chat 입력 → LLM 응답 표시
- [ ] "초안 만들기" → 새 문서 생성 → Editor 이동
- [ ] Editor에서 생성된 문서 편집 가능

---

## Phase 3: Meeting AI (Week 6-7)

### 🎯 목표

**음성/회의록 → 자동 문서 생성**

### ✅ 1차 성공 조건

```
[ ] Meeting 메뉴에서 음성 파일 업로드
[ ] 간단 요약 + 섹션 리스트 표시
[ ] "문서 생성" 버튼 → EditorDocument 생성
[ ] /editor?docId=... 이동
```

### 📂 작업 항목

```typescript
// 1. Meeting UI
// src/app/meetings/page.tsx

[ ] 음성 파일 업로드 (drag & drop)
[ ] 회의록 텍스트 입력 (옵션)
[ ] "분석 시작" 버튼

// 2. 분석 결과 표시
[ ] 회의 요약 (5-10줄)
[ ] 섹션 리스트 (headline, body, cta)
[ ] "문서 생성" 버튼

// 3. API 연동
[ ] POST /api/v1/meetings/upload
[ ] POST /api/v1/meetings/analyze
[ ] POST /api/v1/meetings/generate-document
```

### 📝 완료 기준

- [ ] 음성 파일 업로드 → 요약 표시
- [ ] "문서 생성" → Editor 이동
- [ ] 회의 내용이 문서에 반영됨

---

## Phase 4: Asset Library (Week 8)

### 🎯 목표

**이미지/템플릿 에셋 관리**

### 📂 작업 항목

```typescript
// 1. Assets Tab
// src/modules/editor/components/RightDock/tabs/AssetsTab.tsx

[ ] 이미지 목록 (썸네일 그리드)
[ ] 업로드 버튼 (drag & drop)
[ ] 검색/필터

// 2. Templates Tab
// src/modules/editor/components/LeftPanel/tabs/TemplatesTab.tsx

[ ] 템플릿 목록 (카테고리별)
[ ] 미리보기
[ ] "사용하기" 버튼
```

---

## Phase 5: Publish Hub (Week 9)

### 🎯 목표

**PNG/PDF 내보내기**

### 📂 작업 항목

```typescript
// 1. Export UI
// src/modules/editor/components/TopBar/ExportButton.tsx

[ ] Export 버튼 → 드롭다운
    - PNG (현재 페이지)
    - PDF (전체 페이지)

// 2. Konva → Image 변환
[ ] stage.toDataURL() → PNG 다운로드
[ ] jsPDF로 PDF 생성
```

---

## Phase 6: Admin Console (Week 10)

### 📂 작업 항목

```typescript
// src/app/admin/*

[ ] 브랜드 리스트 & 편집
[ ] 템플릿 리스트 & 수동 등록
[ ] 통계 대시보드 (기본)
```

---

## Phase 7: Trend Engine (Week 11-12)

### 📂 작업 항목

```typescript
// src/app/admin/trends/*

[ ] Learning Plan 목록
[ ] TrendPattern 목록
[ ] "템플릿 생성" 버튼
```

---

## Phase 8: Insight Radar (Week 13)

### 📂 작업 항목

```typescript
// src/app/insights/*

[ ] 발행 통계 차트
[ ] 템플릿 사용 순위
[ ] 브랜드별 활동
```

---

## 🚀 시작 방법

### 1. 문서 읽기 (필수)

```
1. docs/editor/000_MASTER_PLAN.md
2. docs/editor/001_ARCHITECTURE.md
3. docs/editor/002_DATA_MODEL.md
4. docs/editor/005_PHASE1_IMPLEMENTATION.md
```

### 2. 개발 환경 설정

```bash
cd k:/sparklio_ai_marketing_studio/frontend
npm install
npm run dev
```

### 3. Phase 1부터 시작

```
src/modules/editor/ 폴더에서 작업
- store/editorStore.ts 먼저
- core/CanvasEngine.tsx 두 번째
- components/* 순차적으로
```

### 4. B팀과 협업

```
- API 스펙 먼저 합의
- Postman/Thunder Client로 API 테스트
- Mock 데이터로 개발 진행 가능
```

---

## 📞 질문 & 지원

- **문서 관련**: 이 요청서의 "핵심 문서" 섹션 참고
- **API 관련**: B팀에게 문의
- **기술 스택**: 001_ARCHITECTURE.md 참고
- **데이터 모델**: 002_DATA_MODEL.md 참고

---

**작성자**: Sparklio Development Team
**마지막 업데이트**: 2025-11-19
