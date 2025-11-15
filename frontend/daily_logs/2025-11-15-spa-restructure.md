# 2025-11-15 작업 로그: SPA 구조 전환

**작성일**: 2025-11-15
**작성자**: C팀 (Frontend Team)
**작업 유형**: 🚨 **긴급 구조 재설계**

---

## 📋 작업 개요

### 중대한 발견

이전까지 **잘못된 전제**로 작업하고 있었습니다.

#### ❌ 잘못된 가정 (2025-11-14 이전)
```
- Sparklio V4.3을 다중 페이지 SaaS로 이해
- /dashboard, /projects, /editor 등 별도 페이지 구조
- 전통적인 랜딩 페이지 + 프로젝트 목록 패턴
```

#### ✅ 올바른 이해 (2025-11-15 이후)
```
Sparklio V4.3은 단일 페이지 애플리케이션(SPA)!

/app 하나의 페이지에서:
- Chat (좌측)
- Editor (중앙)
- Inspector (우측)
모두 동시에 표시되고, 페이지 전환 없이 작동
```

---

## 📚 필독 문서 숙지

### 읽은 문서 (총 2시간 30분)

1. **SYSTEM_ARCHITECTURE.md** (60분) ✅
   - 경로: `docs/SYSTEM_ARCHITECTURE.md`
   - 핵심: P0 범위, Chat-First 원칙, 전체 시스템 구조

2. **C_TEAM_WORK_ORDER.md v2.0** (40분) ✅
   - 경로: `docs/C_TEAM_WORK_ORDER.md`
   - 핵심: **v1.0 폐기됨**, SPA 구조 명시, 금지 사항

3. **ONE_PAGE_EDITOR_SPEC.md** (40분) ✅
   - 경로: `K:\obsidian-k\Sparklio_ai_marketing_studio\최종계획\ONE_PAGE_EDITOR_SPEC.md`
   - 핵심: Editor 레이아웃, Action 모델, Chat-First UX

4. **GENERATORS_SPEC.md** (30분, 일부) ✅
   - 경로: `K:\obsidian-k\Sparklio_ai_marketing_studio\최종계획\GENERATORS_SPEC.md`
   - 핵심: P0 3개 Generator (Brand Kit, Product Detail, SNS)

---

## 🔥 수행한 작업

### 1. 잘못된 파일 백업 및 삭제

```bash
# 백업
cp frontend/app/page.tsx frontend/app/page.tsx.backup

# 잘못된 보고서 삭제
rm docs/requests/C팀_홈페이지_구조_검토_보고서_001.md
```

**이유**:
- 이전 `page.tsx`는 다중 페이지 구조 가정
- `/dashboard`, `/projects` 등 존재하지 않아야 할 링크 포함

---

### 2. 올바른 SPA 구조로 재작성

#### 파일: `frontend/app/page.tsx`

**새 구조**:
```typescript
export default function SparklioCoreApp() {
  return (
    <div className="flex h-screen">
      {/* 좌측: Sidebar + Chat */}
      <div className="w-80 border-r flex flex-col">
        <Sidebar />
        <ChatPanel />
      </div>

      {/* 중앙: Editor Canvas */}
      <div className="flex-1">
        <TopBar />
        <Canvas />
      </div>

      {/* 우측: Inspector */}
      <div className="w-80 border-l">
        <Inspector />
      </div>
    </div>
  );
}
```

**핵심 특징**:
- ✅ 단일 페이지 (페이지 전환 없음)
- ✅ Chat, Editor, Inspector 동시 표시
- ✅ URL 변경 없이 상태 기반 UI 전환
- ✅ Tailwind CSS로 3-column 레이아웃

---

### 3. 긴급 온보딩 지시서 작성

#### 파일: `docs/C팀_긴급_온보딩_지시서_v2.0.md`

**내용**:
- 잘못된 가정 vs 올바른 설계 비교
- 필독 문서 리스트 (순서대로)
- P0 작업 범위 명확화
- 금지 사항 재확인
- Phase 1 체크리스트

---

## ✅ 완료한 작업

### 코드 변경

- [x] `app/page.tsx` 백업 (`.backup` 확장자)
- [x] `app/page.tsx` SPA 구조로 재작성
  - 좌측: Sidebar + Chat (w-80)
  - 중앙: TopBar + Canvas (flex-1)
  - 우측: Inspector (w-80)
- [x] 3-column 레이아웃 구현
- [x] Chat 입력창 UI
- [x] Canvas 영역 (1080x1350 placeholder)
- [x] Inspector 속성 패널 (disabled 상태)

### 문서 작성

- [x] 잘못된 보고서 삭제 (`C팀_홈페이지_구조_검토_보고서_001.md`)
- [x] 긴급 온보딩 지시서 작성 (`C팀_긴급_온보딩_지시서_v2.0.md`)
- [x] 일일 작업 로그 (이 문서)

---

## 🎯 다음 단계 (Phase 1 계속)

### 미완료 작업

#### 1. 컴포넌트 분리 (현재 단일 파일)

현재 `app/page.tsx`에 모든 UI가 있음. 분리 필요:

```
components/
├── Chat/
│   ├── ChatPanel.tsx        # 좌측 Chat UI
│   ├── MessageList.tsx      # 메시지 리스트
│   └── InputArea.tsx        # 입력창
│
├── Editor/
│   ├── EditorCanvas.tsx     # Fabric.js Canvas
│   ├── Toolbar.tsx          # Top Bar
│   └── Inspector.tsx        # 우측 Inspector
│
└── Layout/
    └── Sidebar.tsx          # 좌측 메뉴
```

#### 2. Zustand State 설정

```bash
npm install zustand
```

```typescript
// store/chat-store.ts
interface ChatState {
  messages: Message[];
  addMessage: (msg: Message) => void;
}

// store/editor-store.ts
interface EditorState {
  canvas: fabric.Canvas | null;
  currentDocument: any;
}
```

#### 3. API Client 확장

현재 `lib/api-client.ts`에 Authentication API만 있음.

추가 필요:
```typescript
// Generator 호출
export async function generateDocument(params: {
  kind: 'brand_kit' | 'product_detail' | 'sns';
  brandId: string;
  input: any;
}) {
  const response = await api.post('/api/v1/generate', params);
  return response.data;
}
```

#### 4. Fabric.js 통합

```bash
npm install fabric
npm install -D @types/fabric
```

```typescript
// components/Editor/EditorCanvas.tsx
import { fabric } from 'fabric';

useEffect(() => {
  const canvas = new fabric.Canvas('canvas', {
    width: 1080,
    height: 1350,
  });
}, []);
```

---

## 📊 Phase 1 진행률

### 전체 Phase 1 체크리스트 (1주 목표)

- [x] Next.js 14 프로젝트 설정 (이미 완료)
- [x] **SPA 레이아웃 구조** ✅ **완료!**
  - 좌측: Sidebar + Chat
  - 중앙: Canvas
  - 우측: Inspector
- [x] **기본 Chat UI** ✅ **완료!**
  - 입력창, 메시지 리스트
- [ ] **컴포넌트 분리**
  - ChatPanel, EditorCanvas, Inspector 등
- [ ] **State Management (Zustand)**
  - chat-store.ts, editor-store.ts
- [ ] **API Client 확장**
  - Generator 호출 함수

**진행률**: 50% (SPA 구조 + 기본 UI 완성)

---

## 🚨 중요 알림

### v1.0 문서는 폐기됨!

**폐기된 문서**:
- `C_TEAM_WORK_ORDER.md v1.0` (다중 페이지 구조로 잘못 설계)

**유효한 문서**:
- `C_TEAM_WORK_ORDER.md v2.0` (SPA 구조, 2025-11-15 작성)
- `SYSTEM_ARCHITECTURE.md v1.1` (최상위 문서)

---

## ✅ 검증 완료

### 브라우저 확인

- URL: http://localhost:3001
- 상태: ✅ 정상 작동
- 레이아웃: ✅ 3-column SPA 구조 확인
- Chat UI: ✅ 좌측에 표시
- Canvas: ✅ 중앙에 placeholder 표시
- Inspector: ✅ 우측에 속성 패널 표시

---

## 📝 학습한 내용

### 1. Sparklio V4.3의 핵심 아키텍처

```
Chat-First One-Page Studio
- 모든 작업이 단일 페이지에서 완료
- Chat → Generator → Editor → Export
- 페이지 전환 없음
```

### 2. P0 범위 (3개 Generator만)

| P0 (지금) | P1 (나중) |
|-----------|----------|
| Brand Kit Generator | Meeting AI |
| Product Detail Generator | 이미지 기반 템플릿 |
| SNS Generator | 다중 페이지 Editor |
| One-Page Editor (단일 페이지) | PPTX Export |
| PNG/PDF Export | Video Editor |

### 3. 금지 사항

❌ **절대 하지 말 것**:
1. 다중 페이지 구조 (`/dashboard`, `/projects` 등)
2. P1 기능 구현 (Meeting AI, Video, PPTX)
3. Redux 사용 (Zustand만)
4. Pages Router (App Router만)

---

## 🎯 다음 작업일 계획 (2025-11-16)

### 우선순위 작업

1. **컴포넌트 분리** (2시간)
   - `components/Chat/ChatPanel.tsx` 생성
   - `components/Editor/EditorCanvas.tsx` 생성
   - `components/Editor/Inspector.tsx` 생성
   - `components/Layout/Sidebar.tsx` 생성

2. **Zustand 설치 및 설정** (1시간)
   - `npm install zustand`
   - `store/chat-store.ts` 작성
   - `store/editor-store.ts` 작성

3. **API Client 확장** (1시간)
   - `generateDocument()` 함수 추가
   - TypeScript 타입 정의

4. **Fabric.js 기초 통합** (2시간)
   - `npm install fabric @types/fabric`
   - Canvas 초기화
   - 간단한 Text Object 렌더링 테스트

---

## 📸 스크린샷

**현재 `/app` 페이지 구조**:
```
┌─────────────┬──────────────────────┬─────────────┐
│   Sidebar   │      Canvas          │  Inspector  │
│    (Chat)   │   (1080x1350)        │  (Properties)│
│             │                      │             │
│  💬 새로 만들기 │      🎨 Canvas       │   🔧 속성     │
│  ✏️ 에디터    │                      │             │
│             │                      │             │
│  [메시지]    │   Placeholder       │  [폰트 크기]  │
│             │                      │  [색상]      │
│  [입력창]    │                      │             │
└─────────────┴──────────────────────┴─────────────┘
```

---

## 🔧 기술 스택 (확정)

| 분류 | 기술 | 상태 |
|------|------|------|
| Framework | Next.js 14 (App Router) | ✅ 설치됨 |
| Language | TypeScript 5.x | ✅ 설정됨 |
| Styling | Tailwind CSS 3.x | ✅ 사용 중 |
| State | Zustand | ⏳ 다음 |
| Canvas | Fabric.js | ⏳ 다음 |
| HTTP | Axios | ✅ 설치됨 |

---

## 💬 Notes

### 오늘의 교훈

1. **필독 문서를 먼저 읽어야 한다**
   - SYSTEM_ARCHITECTURE.md는 최상위 기준 문서
   - v1.0/v2.0 버전 확인 필수

2. **가정하지 말고 확인하라**
   - "SaaS니까 대시보드가 있겠지" ❌
   - "문서에 명시된 대로" ✅

3. **SPA는 정말 하나의 페이지다**
   - `/app` = 전체 애플리케이션
   - 페이지 전환 없이 상태 변경으로 UI 전환

---

## ✅ Git 커밋 예정

```bash
git add .
git commit -m "feat: Restructure to SPA (Chat-First One-Page Studio)

- BREAKING CHANGE: 다중 페이지 구조에서 SPA로 전환
- app/page.tsx: 3-column layout (Sidebar+Chat / Canvas / Inspector)
- 백업: app/page.tsx.backup
- 문서: C팀_긴급_온보딩_지시서_v2.0.md 추가
- 참고: SYSTEM_ARCHITECTURE.md, C_TEAM_WORK_ORDER.md v2.0

SPA 구조:
- 좌측: Sidebar + Chat Panel (w-80)
- 중앙: TopBar + Canvas (flex-1, 1080x1350)
- 우측: Inspector Panel (w-80)

다음: 컴포넌트 분리, Zustand, Fabric.js 통합"
```

---

**작업 완료 시간**: 2025-11-15 18:00
**소요 시간**: 3시간 (문서 읽기 2.5h + 구현 0.5h)
**다음 작업 시작**: 2025-11-16 Phase 1 계속
