# CANVAS_STUDIO_MIGRATION_GUIDE.md

# Canvas Studio v3 마이그레이션 가이드

- 작성일: 2025-11-15
- 작성자: A팀 (Infrastructure Team)
- 버전: v1.0
- 대상: C팀 (Frontend)

---

## 0. 개요

### 목적

기존 Sparklio Frontend (v2.0)에서 **Canvas Studio v3**로 안전하게 마이그레이션하는 방법을 제공합니다.

### 핵심 전략

**"기존 코드는 그대로 두고, 새로운 Canvas Studio만 추가"**

- ✅ 기존 `components/`, `lib/`, `store/` 폴더는 **변경하지 않음**
- ✅ 새로운 `app/studio/` 라우트와 `components/canvas-studio/` 폴더만 **추가**
- ✅ 롤백이 쉬움: 추가한 폴더만 삭제하면 원복

---

## 1. 마이그레이션 전 체크리스트

### 1.1 사전 준비

- [ ] **Git 백업**: 현재 코드를 별도 브랜치에 백업
  ```bash
  git checkout -b backup/before-canvas-studio-v3
  git push origin backup/before-canvas-studio-v3
  ```

- [ ] **의존성 확인**:
  ```bash
  npm list fabric zustand
  ```
  - `fabric`: 없으면 설치 (`npm install fabric @types/fabric`)
  - `zustand`: 이미 설치되어 있음 (기존 사용 중)

- [ ] **환경 변수 확인**:
  ```bash
  cat .env.local
  ```
  - `NEXT_PUBLIC_API_URL`: `http://localhost:8000` (또는 Mac mini URL)
  - 필요하면 추가: `NEXT_PUBLIC_CANVAS_STUDIO_ENABLED=true`

- [ ] **필독 문서 읽기** (총 2시간):
  - `C_TEAM_WORK_ORDER_CANVAS_STUDIO_v3.md`
  - `CANVAS_STUDIO_요약_지침서.md`
  - `K:\obsidian-k\...\에디터\001.Sparklio One-Page Creative Studio — UX & Layout Master Spec (v1).md`

### 1.2 현재 Frontend 구조 확인

```bash
cd K:\sparklio_ai_marketing_studio\frontend
ls -la
```

**예상 구조**:
```
frontend/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── Chat/
│   ├── Editor/
│   └── Layout/
├── lib/
│   └── api-client.ts
├── store/
│   ├── chat-store.ts
│   └── editor-store.ts
├── types/
└── hooks/
```

---

## 2. 마이그레이션 단계

### Step 1: 새로운 브랜치 생성

```bash
git checkout main
git pull origin main
git checkout -b feature/canvas-studio-v3
```

### Step 2: 의존성 설치

```bash
npm install fabric zustand
npm install -D @types/fabric
```

**package.json 확인**:
```json
{
  "dependencies": {
    "fabric": "^5.3.0",
    "zustand": "^4.4.0",
    "axios": "^1.6.0",
    "next": "14.0.0",
    "react": "^18.2.0",
    "tailwindcss": "^3.3.0"
  },
  "devDependencies": {
    "@types/fabric": "^5.3.0"
  }
}
```

### Step 3: 새로운 폴더 구조 생성

```bash
# app/studio 라우트 생성
mkdir -p app/studio
touch app/studio/page.tsx

# components/canvas-studio 폴더 생성
mkdir -p components/canvas-studio/{layout,right-dock,modes,canvas,editor-store,chat,components}

# 기본 파일 생성
touch components/canvas-studio/CanvasStudioShell.tsx
touch components/canvas-studio/layout/StudioLayout.tsx
touch components/canvas-studio/layout/ActivityBar.tsx
touch components/canvas-studio/layout/LeftPanel.tsx
touch components/canvas-studio/layout/CanvasViewport.tsx
touch components/canvas-studio/layout/RightDock.tsx
touch components/canvas-studio/layout/TopToolbar.tsx
```

**생성 후 구조**:
```
frontend/
├── app/
│   ├── studio/                   # NEW
│   │   └── page.tsx
│   ├── layout.tsx                # 기존 유지
│   └── page.tsx                  # 기존 유지
│
├── components/
│   ├── canvas-studio/            # NEW
│   │   ├── CanvasStudioShell.tsx
│   │   ├── layout/
│   │   ├── right-dock/
│   │   ├── modes/
│   │   ├── canvas/
│   │   ├── editor-store/
│   │   └── chat/
│   │
│   ├── Chat/                     # 기존 유지
│   ├── Editor/                   # 기존 유지
│   └── Layout/                   # 기존 유지
```

### Step 4: 최소 동작 코드 작성 (app/studio/page.tsx)

```tsx
// app/studio/page.tsx
import { CanvasStudioShell } from "@/components/canvas-studio/CanvasStudioShell";

export default function StudioPage() {
  return <CanvasStudioShell />;
}
```

### Step 5: CanvasStudioShell 구현 (최소 버전)

```tsx
// components/canvas-studio/CanvasStudioShell.tsx
"use client";

export function CanvasStudioShell() {
  return (
    <div className="flex h-screen items-center justify-center bg-neutral-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold">Canvas Studio v3</h1>
        <p className="mt-4 text-neutral-600">
          VSCode 스타일 원페이지 에디터 - 구현 중
        </p>
      </div>
    </div>
  );
}
```

### Step 6: 테스트 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:3000/studio` 접속

**확인 사항**:
- ✅ "Canvas Studio v3" 텍스트가 표시되면 성공
- ✅ 기존 `/` 루트는 정상 동작 (변경 없음)
- ✅ Console 에러 없음

### Step 7: 첫 커밋

```bash
git add .
git commit -m "feat(canvas-studio): Initialize Canvas Studio v3 shell"
git push origin feature/canvas-studio-v3
```

---

## 3. 단계별 구현 가이드

### Phase 1: VSCode 스타일 레이아웃 구현 (Week 1)

**목표**: 좌측 Activity Bar + 좌측 패널 + 중앙 캔버스 + 우측 Dock 구조 완성

#### 3.1 StudioLayout 구현

```tsx
// components/canvas-studio/layout/StudioLayout.tsx
"use client";

import { ActivityBar } from "./ActivityBar";
import { LeftPanel } from "./LeftPanel";
import { CanvasViewport } from "./CanvasViewport";
import { RightDock } from "./RightDock";
import { TopToolbar } from "./TopToolbar";

export function StudioLayout() {
  return (
    <div className="flex h-screen flex-col">
      {/* 상단 툴바 */}
      <TopToolbar />

      <div className="flex flex-1 overflow-hidden">
        {/* 좌측 Activity 바 */}
        <ActivityBar />

        {/* 좌측 패널 + 중앙 캔버스 + 우측 Dock */}
        <div className="flex flex-1 overflow-hidden">
          <LeftPanel />
          <CanvasViewport />
          <RightDock />
        </div>
      </div>
    </div>
  );
}
```

#### 3.2 CanvasStudioShell 업데이트

```tsx
// components/canvas-studio/CanvasStudioShell.tsx
"use client";

import { StudioLayout } from "./layout/StudioLayout";

export function CanvasStudioShell() {
  return (
    <div className="h-screen">
      <StudioLayout />
    </div>
  );
}
```

#### 3.3 TopToolbar 구현

```tsx
// components/canvas-studio/layout/TopToolbar.tsx
"use client";

export function TopToolbar() {
  return (
    <header className="flex h-12 items-center justify-between border-b bg-white px-4">
      <div className="flex items-center gap-4">
        <h1 className="text-sm font-semibold">Canvas Studio</h1>
        <div className="text-xs text-neutral-500">무제 문서</div>
      </div>

      <div className="flex items-center gap-2">
        <button className="rounded px-3 py-1 text-sm hover:bg-neutral-100">
          Studio View
        </button>
        <button className="rounded px-3 py-1 text-sm hover:bg-neutral-100">
          저장
        </button>
      </div>
    </header>
  );
}
```

#### 3.4 ActivityBar 구현

```tsx
// components/canvas-studio/layout/ActivityBar.tsx
"use client";

const ACTIVITIES = [
  { id: "concept-board", label: "Concept Board", icon: "C" },
  { id: "pitch-deck", label: "Pitch Deck", icon: "D" },
  { id: "product-story", label: "Product Story", icon: "P" },
];

export function ActivityBar() {
  return (
    <nav className="flex w-14 flex-col border-r bg-neutral-950 text-neutral-100">
      {ACTIVITIES.map((item) => (
        <button
          key={item.id}
          className="flex h-12 items-center justify-center text-xs hover:bg-neutral-800"
          title={item.label}
        >
          {item.icon}
        </button>
      ))}
    </nav>
  );
}
```

#### 3.5 LeftPanel, CanvasViewport, RightDock 구현 (최소 버전)

```tsx
// components/canvas-studio/layout/LeftPanel.tsx
"use client";

export function LeftPanel() {
  return (
    <aside className="flex w-72 flex-col border-r bg-neutral-50">
      <div className="p-4">
        <h2 className="text-sm font-semibold">Pages</h2>
      </div>
    </aside>
  );
}

// components/canvas-studio/layout/CanvasViewport.tsx
"use client";

export function CanvasViewport() {
  return (
    <main className="relative flex flex-1 items-center justify-center overflow-hidden bg-neutral-100">
      <div className="text-neutral-400">Canvas Area</div>
    </main>
  );
}

// components/canvas-studio/layout/RightDock.tsx
"use client";

const TABS = ["Chat", "Inspector", "Layers", "Data", "Brand"];

export function RightDock() {
  return (
    <aside className="flex w-[360px] flex-col border-l bg-white">
      <div className="flex border-b">
        {TABS.map((tab) => (
          <button
            key={tab}
            className="flex-1 px-3 py-2 text-xs hover:bg-neutral-50"
          >
            {tab}
          </button>
        ))}
      </div>
      <div className="flex-1 p-4">
        <div className="text-sm text-neutral-400">Tab Content</div>
      </div>
    </aside>
  );
}
```

**테스트**:
```bash
npm run dev
```

`http://localhost:3000/studio` 접속 시 VSCode 스타일 레이아웃이 표시되면 성공!

---

### Phase 2: Fabric.js 캔버스 통합 (Week 2)

#### 3.6 Fabric.js 캔버스 초기화

```tsx
// components/canvas-studio/layout/CanvasViewport.tsx
"use client";

import { useEffect, useRef } from "react";
import { fabric } from "fabric";

export function CanvasViewport() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Fabric.js 캔버스 초기화
    fabricRef.current = new fabric.Canvas(canvasRef.current, {
      width: 1920,
      height: 1080,
      backgroundColor: "#ffffff",
    });

    // 더미 텍스트 추가
    const text = new fabric.Text("Canvas Studio v3", {
      left: 100,
      top: 100,
      fontSize: 48,
      fill: "#000000",
    });
    fabricRef.current.add(text);

    return () => {
      fabricRef.current?.dispose();
    };
  }, []);

  return (
    <main className="relative flex flex-1 items-center justify-center overflow-hidden bg-neutral-100">
      <canvas ref={canvasRef} />
    </main>
  );
}
```

**테스트**: `/studio` 접속 시 "Canvas Studio v3" 텍스트가 캔버스에 표시되면 성공!

---

### Phase 3: Zustand 전역 상태 관리 (Week 3)

#### 3.7 Editor Store 구현

```tsx
// components/canvas-studio/editor-store/useEditorStore.ts
import { create } from "zustand";

interface Page {
  id: string;
  name: string;
  thumbnailUrl?: string;
}

interface EditorState {
  mode: "concept-board" | "pitch-deck" | "product-story";
  currentActivity: string;
  viewMode: "studio" | "canvas-focus" | "chat-focus";

  pages: Page[];
  currentPageId: string | null;

  isLeftPanelCollapsed: boolean;
  isRightDockCollapsed: boolean;
  rightDockTab: "chat" | "inspector" | "layers" | "data" | "brand";

  setActivity: (activity: string) => void;
  setViewMode: (mode: "studio" | "canvas-focus" | "chat-focus") => void;
  setCurrentPageId: (pageId: string) => void;
  setRightDockTab: (tab: string) => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  mode: "concept-board",
  currentActivity: "concept-board",
  viewMode: "studio",
  pages: [],
  currentPageId: null,
  isLeftPanelCollapsed: false,
  isRightDockCollapsed: false,
  rightDockTab: "chat",

  setActivity: (activity) => set({ currentActivity: activity }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setCurrentPageId: (pageId) => set({ currentPageId: pageId }),
  setRightDockTab: (tab) => set({ rightDockTab: tab as any }),
}));
```

#### 3.8 ActivityBar에서 Store 사용

```tsx
// components/canvas-studio/layout/ActivityBar.tsx
"use client";

import { useEditorStore } from "../editor-store/useEditorStore";

const ACTIVITIES = [
  { id: "concept-board", label: "Concept Board", icon: "C" },
  { id: "pitch-deck", label: "Pitch Deck", icon: "D" },
  { id: "product-story", label: "Product Story", icon: "P" },
];

export function ActivityBar() {
  const { currentActivity, setActivity } = useEditorStore();

  return (
    <nav className="flex w-14 flex-col border-r bg-neutral-950 text-neutral-100">
      {ACTIVITIES.map((item) => (
        <button
          key={item.id}
          onClick={() => setActivity(item.id)}
          className={`flex h-12 items-center justify-center text-xs ${
            currentActivity === item.id ? "bg-neutral-800" : "hover:bg-neutral-800"
          }`}
          title={item.label}
        >
          {item.icon}
        </button>
      ))}
    </nav>
  );
}
```

**테스트**: Activity Bar 클릭 시 활성 상태가 변경되면 성공!

---

## 4. 기존 코드와의 공존

### 4.1 기존 `/` 루트는 그대로 유지

```tsx
// app/page.tsx (기존 메인 페이지)
export default function HomePage() {
  return (
    <div>
      <h1>Sparklio 메인 페이지</h1>
      <a href="/studio">Canvas Studio로 이동</a>
    </div>
  );
}
```

### 4.2 기존 API Client 확장

```typescript
// lib/api-client.ts (기존 파일에 추가)

// Canvas Studio Document API (추가)
export async function createDocument(data: any) {
  const response = await api.post('/api/v1/documents', data);
  return response.data;
}

export async function getDocument(documentId: string) {
  const response = await api.get(`/api/v1/documents/${documentId}`);
  return response.data;
}

export async function updateDocument(documentId: string, data: any) {
  const response = await api.patch(`/api/v1/documents/${documentId}`, data);
  return response.data;
}
```

### 4.3 기존 Store는 건드리지 않음

```
store/
├── chat-store.ts       # 기존 유지 (건드리지 않음)
└── editor-store.ts     # 기존 유지 (건드리지 않음)

components/canvas-studio/editor-store/
└── useEditorStore.ts   # 새로운 Store (Canvas Studio 전용)
```

---

## 5. 롤백 방법

Canvas Studio v3가 문제가 있을 경우, 즉시 롤백할 수 있습니다.

### 방법 1: 폴더 삭제

```bash
# Canvas Studio 관련 폴더만 삭제
rm -rf app/studio
rm -rf components/canvas-studio

# 의존성 원복 (필요시)
npm uninstall fabric @types/fabric

# 기존 코드로 복구
git checkout main
```

### 방법 2: Git Revert

```bash
# 이전 커밋으로 되돌리기
git log  # 커밋 해시 확인
git revert <commit-hash>
git push origin feature/canvas-studio-v3
```

---

## 6. 주의 사항

### 6.1 절대 하지 말 것

❌ **기존 폴더 변경 금지**:
- `components/Chat/`
- `components/Editor/`
- `components/Layout/`
- `lib/api-client.ts` (확장만 가능, 기존 코드 변경 금지)
- `store/chat-store.ts`
- `store/editor-store.ts`

❌ **기존 라우트 변경 금지**:
- `app/page.tsx` (메인 페이지)
- `app/layout.tsx` (루트 레이아웃)

### 6.2 반드시 할 것

✅ **새로운 폴더에만 작업**:
- `app/studio/`
- `components/canvas-studio/`

✅ **Git 커밋 주기적으로**:
- 2-3시간마다 커밋
- 의미 있는 커밋 메시지

✅ **테스트**:
- 매번 `npm run dev` 실행
- 기존 `/` 루트도 정상 동작하는지 확인

---

## 7. 문제 해결

### 문제 1: Fabric.js 타입 에러

**증상**:
```
Cannot find module 'fabric' or its corresponding type declarations.
```

**해결**:
```bash
npm install fabric @types/fabric
```

### 문제 2: Zustand 상태 업데이트 안 됨

**증상**: Activity Bar 클릭 시 상태 변경 안 됨

**해결**:
```tsx
// useEditorStore.ts에서 set 함수 확인
setActivity: (activity) => set({ currentActivity: activity }),
```

### 문제 3: 기존 페이지 깨짐

**증상**: `/` 루트 접속 시 에러

**해결**:
- Canvas Studio 폴더만 삭제하고 재시작
- 기존 코드를 변경했다면 Git Revert

---

## 8. 마이그레이션 체크리스트

### 사전 준비
- [ ] Git 백업 브랜치 생성
- [ ] 의존성 확인 (fabric, zustand)
- [ ] 환경 변수 확인
- [ ] 필독 문서 읽기

### Step-by-Step
- [ ] 새로운 브랜치 생성 (`feature/canvas-studio-v3`)
- [ ] 의존성 설치 (`npm install fabric zustand`)
- [ ] 폴더 구조 생성 (`app/studio`, `components/canvas-studio`)
- [ ] 최소 동작 코드 작성 (`app/studio/page.tsx`)
- [ ] 테스트 (`http://localhost:3000/studio`)
- [ ] 첫 커밋

### Phase 1 (Week 1)
- [ ] StudioLayout 구현
- [ ] TopToolbar 구현
- [ ] ActivityBar 구현
- [ ] LeftPanel, CanvasViewport, RightDock 구현
- [ ] VSCode 스타일 레이아웃 완성

### Phase 2 (Week 2)
- [ ] Fabric.js 캔버스 초기화
- [ ] 더미 텍스트/이미지 추가
- [ ] 페이지 썸네일 리스트 구현

### Phase 3 (Week 3)
- [ ] Zustand Editor Store 구현
- [ ] ActivityBar에서 Store 사용
- [ ] 3개 모드 구현 (Concept Board, Pitch Deck, Product Story)

### Phase 4 (Week 4)
- [ ] Chat UI 구현
- [ ] Inspector 패널 구현
- [ ] Generator API 연동
- [ ] End-to-End 테스트

---

## 9. 최종 확인

**마이그레이션 완료 기준**:
- ✅ `/studio` 접속 시 Canvas Studio v3 표시
- ✅ VSCode 스타일 레이아웃 완성
- ✅ Fabric.js 캔버스 동작
- ✅ Activity Bar 클릭 시 모드 전환
- ✅ 기존 `/` 루트 정상 동작 (변경 없음)
- ✅ Console 에러 없음
- ✅ Build 성공 (`npm run build`)

**롤백 준비**:
- ✅ 백업 브랜치 존재 (`backup/before-canvas-studio-v3`)
- ✅ Canvas Studio 폴더만 삭제하면 원복 가능
- ✅ 기존 코드 변경 없음

---

**작성 완료일**: 2025-11-15
**버전**: v1.0
**문의**: A팀 (PM)

**Good luck, C팀! 🚀**
