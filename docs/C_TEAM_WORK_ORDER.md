# C_TEAM_WORK_ORDER.md

# Sparklio V4.3 — C팀(Frontend) 작업 지시서 v2.0

- 작성일: 2025-11-15
- 작성자: A팀 (Infrastructure Team)
- 버전: v2.0 (전면 개정)
- 상태: **최종 확정본 - 즉시 작업 시작 가능**

---

## ⚠️ 중요 공지

**기존 C_TEAM_WORK_ORDER.md (v1.0)는 폐기되었습니다.**

v1.0의 문제점:
- ❌ Chat-First 구조 누락
- ❌ 다중 페이지 구조로 잘못 설계됨
- ❌ One-Page Editor 중심 개념 없음
- ❌ P0/P1 우선순위 혼재

**이 문서(v2.0)가 유일한 기준 문서입니다.**

---

## ⚠️ Mac mini 서버 관리 필수 규정 (2025-11-16 추가)

**C팀은 Backend API 통합 전 Mac mini 서버 상태를 확인해야 합니다.**

### 필수 준수사항:
1. **매일 작업 시작 전**: Mac mini Backend API 상태 확인
2. **API 통합 시**: OpenAPI 문서로 엔드포인트 존재 여부 확인
3. **API 불일치 발견 시**: B팀에 즉시 알림

**상세 가이드**: [MAC_MINI_SERVER_GUIDELINES.md](MAC_MINI_SERVER_GUIDELINES.md)

**⚠️ 중요**: Backend API 엔드포인트가 실제로 구현되었는지 확인하지 않고 Frontend 코드를 작성하면 통합 시 오류가 발생합니다. 반드시 `curl http://100.123.51.5:8000/docs` 또는 OpenAPI 스펙으로 확인하세요.

---

## 1. 핵심 설계 원칙 (반드시 숙지)

### 1.1 Chat-First, One-Page Studio

Sparklio V4.3은 **단일 페이지 애플리케이션(SPA)** 입니다.

```
사용자 경험:
1. /app 접속
2. Chat에서 "제품 A 상세페이지 만들어줘" 입력
3. Generator가 Draft 생성
4. One-Page Editor에서 수정
5. Export (PNG/PDF)

전체가 하나의 흐름, 페이지 전환 없음!
```

### 1.2 절대 금지 사항

❌ **다중 페이지 구조 금지**
```
잘못된 예 (v1.0):
/app/projects       ← 별도 페이지 (❌ 금지)
/app/brands         ← 별도 페이지 (❌ 금지)
/app/editor/[id]    ← 별도 페이지 (❌ 금지)

올바른 예 (v2.0):
/app                ← 단일 페이지
  ├─ 좌측: Navigation (메뉴)
  ├─ 중앙: Chat + Editor (항상 표시)
  └─ 우측: Inspector/Properties
```

✅ **올바른 구조**
- 모든 기능은 `/app` 단일 페이지 내의 **패널/섹션**으로 구현
- 좌측 메뉴 클릭 시 → 중앙 영역만 변경 (페이지 이동 아님)
- URL 변경 없이 상태 기반 UI 전환

⚠️ **중요: API vs 페이지 구분**
```
Backend API 존재           Frontend 페이지 구현
---------------------------------------------------
✅ /api/v1/brands         ❌ /app/brands (금지)
✅ /api/v1/projects       ❌ /app/projects (금지)
✅ /api/v1/generate       ✅ /app 내부 Chat 패널에서 호출만
```

**명확화:**
- Backend에 `/api/v1/brands`, `/api/v1/projects` API가 존재하는 것은 정상입니다
- 이는 데이터 관리를 위한 REST API일 뿐입니다
- **하지만 Frontend에서 `/app/brands` 또는 `/app/projects` 라우트를 만들면 안 됩니다**
- 모든 브랜드/프로젝트 관리는 `/app` 단일 페이지 내의 좌측 패널/모달로 구현하세요

### 1.3 우선순위: P0만 구현

| P0 (지금 구현) | P1 (나중에) |
|---------------|------------|
| Brand Kit Generator | Meeting AI |
| Product Detail Generator | 이미지 기반 템플릿 생성 |
| SNS Generator | 다중 페이지 Editor |
| One-Page Editor (단일 페이지) | PPTX Export |
| PNG/PDF Export | Video Editor |

**P0 외 기능은 절대 구현하지 마세요.**

---

## 2. 필독 문서 (작업 전 반드시 읽기)

### ⭐⭐⭐ 최우선 (총 2시간 소요)

1. **SYSTEM_ARCHITECTURE.md** ← **NEW! 가장 중요**
   - 경로: [K:\sparklio_ai_marketing_studio\docs\SYSTEM_ARCHITECTURE.md](K:\sparklio_ai_marketing_studio\docs\SYSTEM_ARCHITECTURE.md)
   - 읽기: 60분
   - 내용: 전체 시스템 구조, P0 범위, Chat-First 원칙
   - **이 문서가 최상위 기준입니다**

2. **ONE_PAGE_EDITOR_SPEC.md**
   - 경로: `K:\obsidian-k\Sparklio_ai_marketing_studio\최종계획\ONE_PAGE_EDITOR_SPEC.md`
   - 읽기: 40분
   - 내용: Editor 상세 스펙, UI 레이아웃, Action 모델

3. **GENERATORS_SPEC.md**
   - 경로: `K:\obsidian-k\Sparklio_ai_marketing_studio\최종계획\GENERATORS_SPEC.md`
   - 읽기: 30분
   - 내용: 3개 Generator (Brand Kit, Product Detail, SNS) 스펙

### ⭐⭐ 참고 (필요 시)

4. **DATA_PIPELINE_ARCHITECTURE.md**
   - RAG, 템플릿 시스템 이해용

5. **ADMIN_CONSOLE_SPEC.md**
   - Admin은 C팀 작업 아님 (참고만)

---

## 3. 작업 폴더

```
K:\sparklio_ai_marketing_studio\
└── frontend/          ← C팀 작업 폴더 (여기서 직접 개발)
```

**중요**:
- ✅ `frontend/` 폴더에서 직접 작업
- ✅ B팀과 폴더 충돌 없음 (B팀은 `backend/`)
- ✅ Git 브랜치: `feature/frontend-p0`에서 작업
- ❌ `frontend_starter/` 개념은 폐기됨

---

## 4. P0 작업 범위 (정확히 이것만)

### 4.1 구현 목표

**End-to-End 시나리오**:
```
1. 사용자가 /app 접속
2. Chat에 "제품 A 상세페이지 만들어줘" 입력
3. Product Detail Generator가 초안 생성
4. One-Page Editor에 로딩됨
5. 사용자가 텍스트/이미지 수정
6. PNG 파일로 Export
```

### 4.2 Phase별 작업 (P0만)

#### Phase 1: Foundation & Chat (1주)

**목표**: Next.js + 기본 구조 + Chat UI

- [ ] **Next.js 14 프로젝트 설정**
  - App Router (NOT Pages Router)
  - TypeScript
  - Tailwind CSS
  - 폴더 구조: `app/` (단일 페이지)

- [ ] **기본 레이아웃 (SPA 구조)**
  ```
  /app/layout.tsx
    ├─ 좌측: Sidebar (메뉴)
    ├─ 중앙: Main Content (Chat + Editor)
    └─ 우측: Inspector Panel
  ```

- [ ] **Chat UI**
  - Chat 입력창 (자연어)
  - 메시지 히스토리
  - Loading 상태
  - Error 메시지

- [ ] **API Client**
  - FastAPI 연결: `http://100.123.51.5:8000`
  - Generator 호출: `POST /api/v1/generate`
  - Error handling

- [ ] **State Management**
  - Zustand 설치
  - Global state:
    - `chatMessages`
    - `currentDocument` (Editor JSON)
    - `isGenerating`

**산출물**:
- `/app/page.tsx` (단일 페이지)
- Chat 컴포넌트
- API client 함수

---

#### Phase 2: One-Page Editor (2주)

**목표**: Fabric.js 기반 Editor 구현

- [ ] **Editor Canvas**
  - Fabric.js 통합
  - Canvas 초기화
  - Text/Image/Shape 렌더링

- [ ] **Layout Template 적용**
  - Generator가 보낸 Editor JSON 로딩
  - Template에서 Object 복원
  - Placeholder → 실제 콘텐츠 매핑

- [ ] **기본 편집 기능**
  - Object 선택/이동/크기조절
  - Text 편집 (폰트/색/크기)
  - Image 교체
  - Delete

- [ ] **Toolbar**
  - 기본 도구 (선택, 텍스트, 이미지, 도형)
  - Undo/Redo
  - Zoom In/Out

- [ ] **Inspector Panel**
  - 선택된 Object 속성 표시
  - 폰트, 색상, 크기 조절
  - 정렬 도구

**산출물**:
- Editor 컴포넌트
- Toolbar
- Inspector Panel
- Fabric.js 유틸 함수

---

#### Phase 3: Generator 연동 & Export (1주)

**목표**: Chat → Generator → Editor → Export 전체 흐름 완성

- [ ] **Generator 연동**
  - Brand Kit Generator 호출
  - Product Detail Generator 호출
  - SNS Generator 호출
  - Editor JSON 수신 → Canvas 로딩

- [ ] **Editor Agent (기본 5종 Action)**
  - `update_font` (폰트 변경)
  - `update_color` (색상 변경)
  - `update_size` (크기 조절)
  - `move_object` (위치 이동)
  - `delete_object` (삭제)

- [ ] **문서 저장/로드**
  - Save: `POST /api/v1/documents/{docId}/save`
  - Load: `GET /api/v1/documents/{docId}`
  - Auto-save (30초마다)

- [ ] **Export**
  - PNG Export
  - PDF Export (기본)
  - Download 버튼

**산출물**:
- Generator 통합 완료
- Export 기능
- End-to-End 테스트 성공

---

### 4.3 P0 완료 기준 (DoD)

**테스트 시나리오**:
```
1. /app 접속
2. Chat에 "스킨케어 브랜드 상품 상세페이지 만들어줘" 입력
3. Product Detail Generator 실행
4. Editor에 Draft 로딩 확인
5. 제목 텍스트 수정
6. 이미지 1개 교체
7. PNG Export
8. 파일 다운로드 확인
```

**통과 기준**:
- 위 시나리오 1회 이상 성공
- Console 에러 없음
- 3초 내 Editor 로딩
- PNG 파일 정상 다운로드

---

## 5. 기술 스택 (확정)

| 분류 | 기술 | 버전 |
|------|------|------|
| Framework | Next.js | 14.x (App Router) |
| Language | TypeScript | 5.x |
| Styling | Tailwind CSS | 3.x |
| State | Zustand | 4.x |
| Canvas | Fabric.js | 5.x |
| HTTP | Axios | 1.x |
| Testing | Jest + RTL | Latest |

**금지 기술**:
- ❌ Pages Router (App Router 사용)
- ❌ Redux (Zustand 사용)
- ❌ Styled Components (Tailwind 사용)
- ❌ Konva, Paper.js (Fabric.js만 사용)

---

## 6. 폴더 구조 (확정안)

```
frontend/
├── app/
│   ├── layout.tsx              # Root Layout (SPA 구조)
│   ├── page.tsx                # Main Page (/app)
│   └── globals.css
│
├── components/
│   ├── Chat/
│   │   ├── ChatPanel.tsx       # Chat UI
│   │   ├── MessageList.tsx
│   │   └── InputArea.tsx
│   │
│   ├── Editor/
│   │   ├── EditorCanvas.tsx    # Fabric.js Canvas
│   │   ├── Toolbar.tsx
│   │   ├── Inspector.tsx
│   │   └── ObjectPanel.tsx
│   │
│   ├── Layout/
│   │   ├── Sidebar.tsx         # 좌측 메뉴
│   │   ├── Header.tsx
│   │   └── StatusBar.tsx
│   │
│   └── Common/
│       ├── Button.tsx
│       ├── Input.tsx
│       └── Loading.tsx
│
├── lib/
│   ├── api-client.ts           # API 호출
│   ├── fabric-utils.ts         # Fabric.js 유틸
│   └── storage.ts              # LocalStorage 관리
│
├── store/
│   ├── chat-store.ts           # Chat state
│   ├── editor-store.ts         # Editor state
│   └── app-store.ts            # Global state
│
├── types/
│   ├── api.ts                  # API 타입
│   ├── editor.ts               # Editor 타입
│   └── generator.ts            # Generator 타입
│
├── hooks/
│   ├── useChat.ts
│   ├── useEditor.ts
│   └── useGenerator.ts
│
├── public/
│   └── assets/
│
├── .env.local
├── next.config.js
├── package.json
└── tsconfig.json
```

---

## 7. API 연동 가이드

⚠️ **중요 공지 (2025-11-15)**

현재 B팀이 SYSTEM_ARCHITECTURE.md를 기반으로 API를 재구성 중입니다.
아래 명세는 **최종 목표 상태**이며, B팀 작업 완료 전까지는 일부 API가 다른 엔드포인트로 제공될 수 있습니다.

**진행 상황**:
- ✅ 인증 API (`/api/v1/users`) - 완료
- ✅ Brand/Project CRUD (`/api/v1/brands`, `/api/v1/projects`) - 완료
- ✅ Asset 관리 (`/api/v1/assets`) - 완료
- ✅ **Generator 통합 API (`/api/v1/generate`)** - 배포 완료 (2025-11-15 20:47)
- ⏳ Editor Action API - B팀 작업 중

**⚠️ 중요: Generator API 사용 전 필수 작업**

`/api/v1/generate` 엔드포인트를 사용하려면 **인증이 필수**입니다:

1. **먼저 로그인 UI 구현** (Phase 1에 추가)
   - 회원가입/로그인 컴포넌트 생성
   - `lib/api-client.ts`의 `login()`, `register()` 함수 사용
   - 성공 시 `localStorage`에 `access_token` 자동 저장됨

2. **테스트 계정 생성**
   ```typescript
   import { register, login } from '@/lib/api-client';

   // 1. 회원가입
   await register({
     email: 'test@sparklio.com',
     username: 'testuser',
     password: 'test1234',
     full_name: 'Test User'
   });

   // 2. 로그인
   const { access_token } = await login({
     email: 'test@sparklio.com',
     password: 'test1234'
   });
   // access_token이 자동으로 localStorage에 저장됨
   ```

3. **Generator 호출**
   ```typescript
   import { generateDocument } from '@/lib/api-client';

   // 로그인 후 호출 가능
   const result = await generateDocument({
     kind: 'brand_kit',
     brandId: 'brand_001',
     input: {
       brand: {
         name: '스파클리오',
         industry: 'beauty'
       }
     }
   });
   ```

**작업 순서**:
1. Phase 1-2: UI/Editor Canvas + **로그인/회원가입 UI**
2. Phase 3: Generator 연동 (로그인 후 테스트)
3. Phase 4: Editor Action 연동 (B팀 완료 후)

---

### 7.1 Backend API Endpoint

**Base URL**: `http://100.123.51.5:8000`

**P0 필수 API** (최종 목표 명세):

```typescript
// 1. Generator 호출
POST /api/v1/generate
{
  "kind": "product_detail",  // "brand_kit" | "product_detail" | "sns"
  "brandId": "brand_001",
  "locale": "ko-KR",
  "input": {
    "product": {
      "name": "스킨케어 세럼",
      "features": ["보습", "주름개선"],
      "price": 39000
    }
  }
}

Response:
{
  "taskId": "gen_123",
  "textBlocks": { ... },
  "editorDocument": {
    "documentId": "doc_123",
    "pages": [{
      "id": "page_1",
      "width": 1080,
      "height": 1350,
      "objects": [...]
    }]
  }
}

// 2. 문서 저장
POST /api/v1/documents/{docId}/save
{
  "documentJson": { ... },
  "metadata": { ... }
}

// 3. 문서 로드
GET /api/v1/documents/{docId}

// 4. Editor Action (Editor Agent)
POST /api/v1/editor/action
{
  "documentId": "doc_123",
  "actions": [{
    "type": "update_object",
    "target": { "role": "TITLE" },
    "payload": { "props": { "fontSize": 60 } }
  }]
}
```

### 7.2 API Client 구현 예시

```typescript
// lib/api-client.ts
import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://100.123.51.5:8000';

export const apiClient = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Generator 호출
export async function generateDocument(params: {
  kind: 'brand_kit' | 'product_detail' | 'sns';
  brandId: string;
  input: any;
}) {
  const response = await apiClient.post('/api/v1/generate', params);
  return response.data;
}

// 문서 저장
export async function saveDocument(docId: string, data: any) {
  const response = await apiClient.post(`/api/v1/documents/${docId}/save`, data);
  return response.data;
}

// 문서 로드
export async function loadDocument(docId: string) {
  const response = await apiClient.get(`/api/v1/documents/${docId}`);
  return response.data;
}
```

---

## 8. One-Page Editor 구현 가이드

### 8.1 Fabric.js 초기화

```typescript
// components/Editor/EditorCanvas.tsx
'use client';

import { useEffect, useRef } from 'react';
import { fabric } from 'fabric';
import { useEditorStore } from '@/store/editor-store';

export default function EditorCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);
  const { currentDocument, setCanvas } = useEditorStore();

  useEffect(() => {
    if (!canvasRef.current) return;

    fabricRef.current = new fabric.Canvas(canvasRef.current, {
      width: 1080,
      height: 1350,
      backgroundColor: '#ffffff',
    });

    setCanvas(fabricRef.current);

    return () => {
      fabricRef.current?.dispose();
    };
  }, []);

  // Load Editor JSON
  useEffect(() => {
    if (!fabricRef.current || !currentDocument) return;

    fabricRef.current.clear();

    currentDocument.pages[0].objects.forEach((obj) => {
      if (obj.type === 'text') {
        const text = new fabric.Text(obj.props.text, {
          left: obj.bounds.x,
          top: obj.bounds.y,
          fontSize: obj.props.fontSize,
          fill: obj.props.fill,
        });
        fabricRef.current?.add(text);
      }
      // ... 다른 타입 처리
    });

    fabricRef.current.renderAll();
  }, [currentDocument]);

  return <canvas ref={canvasRef} />;
}
```

### 8.2 Chat → Generator → Editor 플로우

```typescript
// components/Chat/ChatPanel.tsx
'use client';

import { useState } from 'react';
import { generateDocument } from '@/lib/api-client';
import { useEditorStore } from '@/store/editor-store';
import { useChatStore } from '@/store/chat-store';

export default function ChatPanel() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const { addMessage } = useChatStore();
  const { setCurrentDocument } = useEditorStore();

  const handleSubmit = async () => {
    if (!input.trim()) return;

    addMessage({ role: 'user', content: input });
    setLoading(true);

    try {
      // Generator 호출
      const result = await generateDocument({
        kind: 'product_detail',
        brandId: 'brand_001',
        input: { product: { name: input } },
      });

      // Editor에 로딩
      setCurrentDocument(result.editorDocument);

      addMessage({
        role: 'assistant',
        content: '상세페이지 초안이 생성되었습니다. 우측 Editor에서 수정하세요.',
      });
    } catch (error) {
      addMessage({ role: 'assistant', content: '오류가 발생했습니다.' });
    } finally {
      setLoading(false);
      setInput('');
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4">
        {/* 메시지 리스트 */}
      </div>
      <div className="p-4 border-t">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
          placeholder="상품 상세페이지 만들어줘"
          className="w-full px-4 py-2 border rounded"
        />
      </div>
    </div>
  );
}
```

### 8.3 State Management (Zustand)

```typescript
// store/editor-store.ts
import { create } from 'zustand';
import { fabric } from 'fabric';

interface EditorState {
  canvas: fabric.Canvas | null;
  currentDocument: any;
  setCanvas: (canvas: fabric.Canvas) => void;
  setCurrentDocument: (doc: any) => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  canvas: null,
  currentDocument: null,
  setCanvas: (canvas) => set({ canvas }),
  setCurrentDocument: (doc) => set({ currentDocument: doc }),
}));

// store/chat-store.ts
import { create } from 'zustand';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatState {
  messages: Message[];
  addMessage: (msg: Message) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  addMessage: (msg) => set((state) => ({
    messages: [...state.messages, msg],
  })),
}));
```

---

## 9. Export 기능

### 9.1 PNG Export

```typescript
// components/Editor/ExportButton.tsx
'use client';

import { useEditorStore } from '@/store/editor-store';

export default function ExportButton() {
  const { canvas } = useEditorStore();

  const handleExportPNG = () => {
    if (!canvas) return;

    const dataURL = canvas.toDataURL({
      format: 'png',
      quality: 1,
      multiplier: 2, // 2x resolution
    });

    const link = document.createElement('a');
    link.href = dataURL;
    link.download = 'sparklio-export.png';
    link.click();
  };

  return (
    <button
      onClick={handleExportPNG}
      className="px-4 py-2 bg-blue-600 text-white rounded"
    >
      PNG 다운로드
    </button>
  );
}
```

### 9.2 PDF Export (기본)

```typescript
// lib/pdf-export.ts
import jsPDF from 'jspdf';

export function exportToPDF(canvas: fabric.Canvas) {
  const dataURL = canvas.toDataURL({ format: 'png' });

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'px',
    format: [1080, 1350],
  });

  pdf.addImage(dataURL, 'PNG', 0, 0, 1080, 1350);
  pdf.save('sparklio-export.pdf');
}
```

---

## 10. 환경 변수

```bash
# frontend/.env.local

# API
NEXT_PUBLIC_API_URL=http://100.123.51.5:8000

# MinIO (P1에서 사용)
NEXT_PUBLIC_MINIO_ENDPOINT=http://100.123.51.5:9000
```

---

## 11. Git 작업 규칙

### 11.1 브랜치 전략

```
main
└── feature/frontend-p0    ← C팀 작업 브랜치
```

### 11.2 커밋 규칙

```bash
# 커밋 메시지 형식
<type>(<scope>): <subject>

# 예시
feat(chat): Add chat panel UI
feat(editor): Implement Fabric.js canvas
feat(export): Add PNG export functionality
fix(api): Handle generator error responses
```

### 11.3 커밋 주기

- **2-3시간마다 커밋** (작은 단위)
- **하루 1회 이상 push**

---

## 12. 테스트

### 12.1 P0 테스트 범위

```typescript
// __tests__/components/Editor/EditorCanvas.test.tsx
import { render } from '@testing-library/react';
import EditorCanvas from '@/components/Editor/EditorCanvas';

describe('EditorCanvas', () => {
  it('should initialize Fabric.js canvas', () => {
    const { container } = render(<EditorCanvas />);
    const canvas = container.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
  });

  it('should load document JSON', () => {
    // Editor JSON 로딩 테스트
  });
});
```

### 12.2 목표 커버리지

- Components: 70% 이상
- Utilities: 80% 이상

---

## 13. 문제 발생 시

### Level 1: 자체 해결 (1시간 시도)
- 컴포넌트 버그
- 스타일 이슈

### Level 2: 팀 내 협의
- 복잡한 상태 관리
- 성능 이슈

### Level 3: A팀/B팀 협의
- Backend API 변경 요청
- 인프라 이슈

**연락 방법**:
- GitHub Issue 생성
- 문서: [TEAM_RESPONSIBILITIES.md](K:\sparklio_ai_marketing_studio\docs\TEAM_RESPONSIBILITIES.md) 참고

---

## 14. 시작하기

### Step 1: 환경 설정

```bash
# 1. 작업 폴더로 이동
cd K:\sparklio_ai_marketing_studio\frontend

# 2. Next.js 프로젝트 생성
npx create-next-app@latest . --typescript --tailwind --app

# 3. 의존성 설치
npm install axios fabric zustand jspdf
npm install -D @types/fabric

# 4. 환경 변수 설정
echo "NEXT_PUBLIC_API_URL=http://100.123.51.5:8000" > .env.local
```

### Step 2: 필독 문서 (총 2시간 30분)

- [ ] SYSTEM_ARCHITECTURE.md (60분)
- [ ] ONE_PAGE_EDITOR_SPEC.md (40분)
- [ ] GENERATORS_SPEC.md (30분)

### Step 3: 첫 커밋

```bash
git checkout -b feature/frontend-p0
git add .
git commit -m "chore: Initialize Next.js 14 project for P0"
git push origin feature/frontend-p0
```

### Step 4: Phase 1 시작

- Chat UI 구현부터 시작
- 매일 작업 진행 상황 기록

---

## 15. P0 완료 체크리스트

### Phase 1 완료
- [ ] Next.js 14 프로젝트 생성
- [ ] SPA 레이아웃 구조 (Sidebar + Main + Inspector)
- [ ] Chat UI 구현
- [ ] API Client 구현
- [ ] Zustand State 설정

### Phase 2 완료
- [ ] Fabric.js Canvas 초기화
- [ ] Editor JSON 로딩
- [ ] Object 렌더링 (Text/Image/Shape)
- [ ] 기본 편집 (선택/이동/크기조절)
- [ ] Toolbar 구현
- [ ] Inspector Panel 구현

### Phase 3 완료
- [ ] 3개 Generator 연동 (Brand Kit, Product Detail, SNS)
- [ ] Chat → Generator → Editor 흐름 완성
- [ ] Editor Agent 5종 Action 구현
- [ ] 문서 저장/로드
- [ ] PNG Export
- [ ] PDF Export (기본)

### 최종 통과
- [ ] End-to-End 테스트 성공
- [ ] 테스트 커버리지 70% 이상
- [ ] ESLint 에러 0개
- [ ] Build 성공

---

## 16. 금지 사항 재확인

❌ **절대 하지 마세요**:
1. 다중 페이지 구조 (페이지별 라우팅)
2. P1 기능 구현 (Meeting AI, Video, PPTX 등)
3. Redux, MobX 사용 (Zustand만)
4. Pages Router 사용 (App Router만)
5. 독단적 기술 스택 변경

✅ **반드시 하세요**:
1. SYSTEM_ARCHITECTURE.md 기준 준수
2. SPA 구조 유지
3. P0 범위만 구현
4. 2-3시간마다 커밋
5. 테스트 작성 (70% 이상)

---

## 17. 최종 확인

**C팀의 P0 목표**:
> "Chat에서 자연어 입력 → Generator → One-Page Editor → PNG Export까지 작동하는 단일 페이지 애플리케이션"

**완료 기준**:
> "제품 상세페이지 만들어줘" → Draft 생성 → 수정 → Export → 파일 다운로드 성공

**작업 기간**: 4주 (Phase 1-3)

---

**작성 완료일**: 2025-11-15
**버전**: v2.0 (전면 개정)
**다음 액션**: C팀 온보딩, 필독 문서 읽기, Phase 1 시작

**Good luck, C팀! 🚀**

---

## 📌 추가 작업: Concept Board (Phase 1)

**우선순위**: P1 (Generator 완료 후 진행)
**예상 소요**: 1-2주
**담당 문서**: `docs/CONCEPT_BOARD_C_TEAM_TASKS.md`

### 작업 개요

Mixboard 스타일 무드보드 기능을 구현합니다. **Phase 1은 Mock Provider 기반**으로 진행하며, 나노바나나 API 스펙 확보 후 Phase 2에서 실제 연동합니다.

**Phase 1 핵심 작업**:
1. Concept Board UI/UX 구현 (3×3 타일 그리드)
2. API 연동 (생성, 조회, 수정)
3. 타일 선택 및 컬러 팔레트 표시
4. Brand Kit 저장 기능 (Brand Visual Style)

**상세 작업 내역**:
- `docs/CONCEPT_BOARD_C_TEAM_TASKS.md` 참고
- B팀 API가 완료되면 즉시 연동 가능하도록 준비

**체크리스트**:
1. [ ] CONCEPT_BOARD_SPEC.md 확인 (30분)
2. [ ] CONCEPT_BOARD_C_TEAM_TASKS.md 숙지 (1시간)
3. [ ] B팀 API 완료 대기
4. [ ] UI/UX 컴포넌트 구현
5. [ ] API 연동 및 테스트

---

## Changelog

- **v2.1 (2025-11-15)**
  - Concept Board 추가 작업 섹션 추가
  - CONCEPT_BOARD_C_TEAM_TASKS.md 참조 링크 추가

- **v2.0 (2025-11-15)**
  - 전면 재작성
  - Chat-First SPA 구조 명시
  - P0 범위 명확화 (3개 Generator만)
  - One-Page Editor 중심 설계
  - 다중 페이지 구조 금지 명시
  - SYSTEM_ARCHITECTURE.md 기준 반영

- **v1.0 (폐기됨)**
  - 다중 페이지 구조로 잘못 설계
  - P0/P1 혼재
  - Chat-First 개념 누락
