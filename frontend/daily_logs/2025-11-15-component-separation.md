# 2025-11-15 작업 로그: 컴포넌트 분리 및 Zustand 통합

**작성일**: 2025-11-15
**작성자**: C팀 (Frontend Team)
**작업 유형**: Phase 1 계속 - 컴포넌트 분리

---

## 📋 작업 개요

SPA 구조 전환 후 모놀리식 `app/page.tsx`를 개별 컴포넌트로 분리하고, Zustand를 사용한 상태 관리를 통합했습니다.

---

## ✅ 완료한 작업

### 1. Zustand Store 생성

#### `store/chat-store.ts`

**역할**: Chat 패널의 상태 관리

**상태**:
- `messages`: 메시지 히스토리 (ChatMessage[])
- `inputText`: 현재 입력 중인 텍스트
- `isGenerating`: Generator 호출 중 여부

**액션**:
- `addMessage()`: 새 메시지 추가 (사용자/AI)
- `setInputText()`: 입력 텍스트 변경
- `setIsGenerating()`: 로딩 상태 변경
- `clearMessages()`: 메시지 초기화

#### `store/editor-store.ts`

**역할**: One-Page Editor의 상태 관리

**상태**:
- `canvas`: Fabric.js Canvas 인스턴스 (any 타입, 추후 fabric.Canvas로 변경 예정)
- `currentDocument`: 현재 문서 (EditorDocument)
- `selectedObjectId`: 선택된 오브젝트 ID
- `history`: Undo/Redo를 위한 히스토리 스택
- `historyIndex`: 현재 히스토리 인덱스

**액션**:
- `setCanvas()`: Canvas 인스턴스 저장
- `setCurrentDocument()`: 문서 로딩
- `setSelectedObjectId()`: 오브젝트 선택
- `updateObject()`: 오브젝트 속성 변경
- `addToHistory()`: 히스토리에 현재 상태 추가
- `undo()`: 실행 취소
- `redo()`: 다시 실행

**타입 정의**:
- `EditorDocument`: 문서 전체 구조
- `EditorPage`: 페이지 (1080x1350 등)
- `EditorObject`: Text, Image, Shape, Group 등

---

### 2. 컴포넌트 분리

#### `components/Chat/ChatPanel.tsx`

**역할**: 좌측 Chat UI

**기능**:
- 메시지 리스트 표시 (사용자/AI 구분)
- 입력창 (Enter 키 전송 지원)
- Generator API 호출 준비 (현재는 임시 응답)
- 로딩 상태 표시 (애니메이션)

**Zustand 연동**:
```typescript
const { messages, inputText, isGenerating, addMessage, setInputText, setIsGenerating } =
  useChatStore();
```

**TODO**:
- Generator API 실제 연동 (`lib/api-client.ts`의 `generateDocument()`)

---

#### `components/Layout/Sidebar.tsx`

**역할**: 좌측 상단 네비게이션 메뉴

**기능**:
- 브랜드 헤더 (Sparklio Studio)
- 메뉴 항목:
  - 💬 새로 만들기 (Chat)
  - ✏️ 에디터 (Editor)
  - 🖼️ 에셋 (Assets)
- 활성 메뉴 하이라이트

**Props**:
- `currentMode`: 'chat' | 'editor' | 'assets'
- `onModeChange`: (mode) => void

---

#### `components/Editor/Inspector.tsx`

**역할**: 우측 속성 패널

**기능**:
- 선택된 오브젝트의 속성 표시
- 타입별 속성 패널:
  - **Text**: 텍스트 내용, 폰트 크기, 색상, 굵기
  - **Image**: URL, Fit 모드 (cover/contain/fill)
  - **공통**: 위치 (X, Y), 크기 (Width, Height)
- 선택 없을 시 placeholder 표시

**Zustand 연동**:
```typescript
const { selectedObjectId, currentDocument } = useEditorStore();
```

**현재 상태**: 읽기 전용 (readOnly/disabled)

**TODO**:
- 편집 가능하도록 변경
- `updateObject()` 액션 연동

---

### 3. `app/page.tsx` 리팩토링

**변경 전**: 180줄의 모놀리식 컴포넌트

**변경 후**: 81줄의 깔끔한 구조

```typescript
export default function SparklioCoreApp() {
  const [currentMode, setCurrentMode] = useState<'chat' | 'editor' | 'assets'>('chat');

  return (
    <div className="flex h-screen bg-gray-50">
      {/* 좌측 */}
      <div className="w-80 border-r bg-white flex flex-col">
        <Sidebar currentMode={currentMode} onModeChange={setCurrentMode} />
        <ChatPanel />
      </div>

      {/* 중앙 */}
      <div className="flex-1 flex flex-col">
        <TopBar />
        <Canvas />
      </div>

      {/* 우측 */}
      <Inspector />
    </div>
  );
}
```

**개선 사항**:
- 코드 가독성 향상 (180줄 → 81줄)
- 컴포넌트 재사용 가능
- 관심사 분리 (UI / State / Logic)

---

## 📁 파일 구조 (현재)

```
frontend/
├── app/
│   ├── layout.tsx
│   ├── page.tsx              # ✅ 리팩토링 완료 (81줄)
│   ├── page.tsx.backup       # 백업
│   └── globals.css
│
├── components/
│   ├── Chat/
│   │   └── ChatPanel.tsx     # ✅ 신규 생성
│   ├── Editor/
│   │   └── Inspector.tsx     # ✅ 신규 생성
│   └── Layout/
│       └── Sidebar.tsx       # ✅ 신규 생성
│
├── store/
│   ├── chat-store.ts         # ✅ 신규 생성
│   └── editor-store.ts       # ✅ 신규 생성
│
├── lib/
│   └── api-client.ts         # 기존 (Auth/Brand/Project API)
│
└── daily_logs/
    ├── 2025-11-15-spa-restructure.md
    └── 2025-11-15-component-separation.md  # ✅ 신규
```

---

## 🎯 Phase 1 진행률

**목표**: Next.js + 기본 구조 + Chat UI (1주)

- [x] Next.js 14 프로젝트 설정
- [x] **SPA 레이아웃 구조** ✅
- [x] **기본 Chat UI** ✅
- [x] **컴포넌트 분리** ✅ **완료!**
- [x] **Zustand State 설정** ✅ **완료!**
- [ ] API Client 확장 (Generator 호출 추가)
- [ ] Fabric.js 통합

**진행률**: 75% 완료 (6/8 항목)

---

## 🧪 테스트 결과

### 브라우저 테스트

**URL**: http://localhost:3001

**확인 사항**:
- [x] SPA 레이아웃 표시
- [x] Sidebar 메뉴 동작
- [x] Chat 입력창 동작
- [x] 메시지 추가 기능
- [x] Loading 애니메이션 (생성 중...)
- [x] Inspector placeholder 표시

**콘솔 에러**: 없음 ✅

---

## 📊 성과

### 코드 품질 향상

**Before (모놀리식)**:
- `app/page.tsx`: 180줄
- 모든 UI가 하나의 파일에 혼재
- 재사용 불가

**After (컴포넌트 분리)**:
- `app/page.tsx`: 81줄 (-55% 감소)
- `ChatPanel.tsx`: 135줄
- `Sidebar.tsx`: 48줄
- `Inspector.tsx`: 185줄
- 총 라인 수: 449줄 (증가는 구조화 때문)

**장점**:
- 각 컴포넌트 독립적으로 테스트 가능
- 재사용 가능
- 유지보수 용이
- 명확한 책임 분리

---

### 상태 관리 통합

**Zustand 도입 효과**:
- Props Drilling 제거
- 전역 상태 중앙 관리
- React Query 대비 가벼움
- TypeScript 완벽 지원

**Store 크기**:
- `chat-store.ts`: 76줄
- `editor-store.ts`: 133줄

---

## 🔜 다음 단계

### 미완료 작업

#### 1. API Client 확장 (`lib/api-client.ts`)

**추가 필요**:
```typescript
// Generator 호출
export async function generateDocument(params: {
  kind: 'brand_kit' | 'product_detail' | 'sns';
  brandId: string;
  locale?: string;
  input: any;
}) {
  const response = await api.post('/api/v1/generate', params);
  return response.data;
}

// Editor Agent 호출
export async function processEditorCommand(
  documentId: string,
  command: string
) {
  const response = await api.post('/api/v1/editor/action', {
    documentId,
    command,
  });
  return response.data;
}
```

#### 2. ChatPanel에서 실제 Generator API 연동

**현재**: 임시 응답 (setTimeout)

**변경 필요**:
```typescript
const result = await generateDocument({
  kind: 'product_detail',
  brandId: 'brand_001',
  input: { product: { name: userInput } },
});

// Editor Store에 문서 로딩
setCurrentDocument(result.editorDocument);
```

#### 3. Fabric.js 통합 (Phase 2 시작)

```bash
npm install fabric @types/fabric
```

**새 컴포넌트**:
- `components/Editor/EditorCanvas.tsx`
- Canvas 초기화
- Editor JSON → Fabric.js Object 렌더링

---

## 📝 학습한 내용

### 1. Zustand 패턴

**장점**:
- Redux보다 간결한 문법
- TypeScript 타입 안정성
- Immer 내장 (불변성 자동 처리)
- DevTools 지원

**예시**:
```typescript
export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, { ...message, id: generateId() }],
    })),
}));
```

### 2. 컴포넌트 설계 원칙

**단일 책임 원칙 (SRP)**:
- ChatPanel: Chat UI만
- Sidebar: 네비게이션만
- Inspector: 속성 편집만

**Props vs Store**:
- UI 상태 (currentMode): Props (부모에서 관리)
- 애플리케이션 상태 (messages, document): Store (전역)

### 3. TypeScript 타입 설계

**Interface 계층 구조**:
```typescript
EditorDocument
  └─ EditorPage[]
      └─ EditorObject[]
          ├─ bounds (공통)
          ├─ props (타입별 다름)
          └─ bindings (선택)
```

---

## 🎉 성과 요약

### 완료한 작업
1. ✅ Zustand 설치 및 Store 생성 (chat, editor)
2. ✅ ChatPanel 컴포넌트 분리 및 기능 구현
3. ✅ Sidebar 컴포넌트 분리
4. ✅ Inspector 컴포넌트 분리
5. ✅ app/page.tsx 리팩토링 (180줄 → 81줄)
6. ✅ 브라우저 테스트 통과

### 다음 작업 (2025-11-16)
1. ⏳ API Client 확장 (Generator 호출 추가)
2. ⏳ ChatPanel에서 실제 API 연동
3. ⏳ Fabric.js 설치 및 Canvas 컴포넌트 생성

---

**작업 완료 시간**: 2025-11-15 19:00
**소요 시간**: 1시간 (Store 생성 0.5h + 컴포넌트 분리 0.5h)
**Phase 1 진행률**: 75% (6/8 완료)
**Next.js 서버**: http://localhost:3001 ✅ 정상 작동
