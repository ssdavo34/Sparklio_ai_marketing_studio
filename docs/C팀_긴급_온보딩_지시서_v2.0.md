# C팀 긴급 온보딩 지시서 v2.0

**작성일**: 2025-11-15
**작성자**: C팀 (Frontend Team)
**긴급도**: 🚨 **최우선**
**상태**: ✅ **즉시 실행 필요**

---

## 🚨 중대한 발견사항

C팀이 이전에 **잘못된 전제**로 작업을 시작했습니다.

### ❌ 잘못된 가정 (이전)
```
- 다중 페이지 구조 (/dashboard, /projects, /editor 등)
- 전통적인 SaaS 랜딩 페이지
- 프로젝트 목록 페이지
- 별도 에디터 페이지
```

### ✅ 올바른 설계 (v2.0 기준)
```
Sparklio V4.3은 단일 페이지 애플리케이션(SPA)입니다!

/app 하나의 페이지에서:
1. Chat →
2. Generator →
3. One-Page Editor →
4. Export
까지 모든 흐름이 진행됩니다.

절대 다중 페이지 구조가 아닙니다!
```

---

## 📋 즉시 수행해야 할 작업

### 1단계: 잘못 개발된 코드 정리

**현재 문제 파일들**:

#### ❌ `frontend/app/page.tsx` (현재)
```typescript
// 잘못된 링크들
<Link href="/dashboard">시작하기</Link>
<Link href="/projects">프로젝트 관리</Link>
<Link href="/assets">에셋 라이브러리</Link>
```

**문제점**:
- 다중 페이지 구조 가정
- `/dashboard`, `/projects` 페이지는 존재하지 않아야 함
- `/app`이 곧 메인 애플리케이션 (SPA)

---

### 2단계: 올바른 구조 이해

#### ✅ 올바른 구조 (`C_TEAM_WORK_ORDER.md v2.0` 기준)

```
frontend/
├── app/
│   ├── layout.tsx          # Root Layout (SPA 구조)
│   ├── page.tsx            # Main Application (/app)
│   │                       # Chat + Editor + Inspector 모두 여기!
│   └── globals.css
│
├── components/
│   ├── Chat/
│   │   ├── ChatPanel.tsx           # 좌측 Chat UI
│   │   ├── MessageList.tsx
│   │   └── InputArea.tsx
│   │
│   ├── Editor/
│   │   ├── EditorCanvas.tsx        # 중앙 Canvas (Fabric.js)
│   │   ├── Toolbar.tsx
│   │   ├── Inspector.tsx           # 우측 Inspector
│   │   └── ObjectPanel.tsx
│   │
│   └── Layout/
│       ├── Sidebar.tsx             # 좌측 메뉴
│       ├── Header.tsx
│       └── StatusBar.tsx
```

---

## 🎯 핵심 원칙 (반드시 암기)

### 원칙 1: Chat-First, One-Page Studio

```
사용자가 /app에 접속하면:
1. 좌측에 Chat UI (대화 입력)
2. 중앙에 Canvas (Editor)
3. 우측에 Inspector (속성 편집)

이 3개 영역이 하나의 페이지에 모두 존재!
페이지 전환 없음!
```

### 원칙 2: 절대 금지

❌ **다중 페이지 구조**
```
잘못된 예:
/app/projects       ← 별도 페이지 (금지!)
/app/brands         ← 별도 페이지 (금지!)
/app/editor/[id]    ← 별도 페이지 (금지!)
```

✅ **올바른 예**
```
/app                ← 단일 페이지
  ├─ 좌측: Sidebar (메뉴)
  │   - 클릭 시 중앙 영역만 변경
  │   - URL 변경 없음!
  │
  ├─ 중앙: Chat + Editor
  │   - 상태에 따라 Chat 또는 Editor 표시
  │
  └─ 우측: Inspector/Properties
      - 선택된 Object 속성 표시
```

### 원칙 3: P0만 구현

| ✅ P0 (지금 구현) | ❌ P1 (나중에) |
|------------------|---------------|
| Brand Kit Generator | Meeting AI |
| Product Detail Generator | 이미지 기반 템플릿 생성 |
| SNS Generator | 다중 페이지 Editor |
| One-Page Editor (단일 페이지) | PPTX Export |
| PNG/PDF Export | Video Editor |

**P0 외 기능은 절대 구현하지 마세요!**

---

## 📚 필독 문서 (순서대로)

### ⭐⭐⭐ 최우선 (총 2시간 30분)

1. **SYSTEM_ARCHITECTURE.md** (60분) ← **가장 중요!**
   - 경로: `K:\sparklio_ai_marketing_studio\docs\SYSTEM_ARCHITECTURE.md`
   - 내용: 전체 시스템 구조, P0 범위, Chat-First 원칙
   - **이 문서가 최상위 기준입니다**

2. **C_TEAM_WORK_ORDER.md v2.0** (40분)
   - 경로: `K:\sparklio_ai_marketing_studio\docs\C_TEAM_WORK_ORDER.md`
   - 내용: C팀 작업 지시, 폴더 구조, 기술 스택
   - **v1.0은 폐기됨! v2.0만 유효!**

3. **ONE_PAGE_EDITOR_SPEC.md** (40분)
   - 경로: `K:\obsidian-k\Sparklio_ai_marketing_studio\최종계획\ONE_PAGE_EDITOR_SPEC.md`
   - 내용: Editor 상세 스펙, UI 레이아웃, Action 모델

4. **GENERATORS_SPEC.md** (30분)
   - 경로: `K:\obsidian-k\Sparklio_ai_marketing_studio\최종계획\GENERATORS_SPEC.md`
   - 내용: 3개 Generator (Brand Kit, Product Detail, SNS) 스펙

---

## 🔥 즉시 실행할 작업

### Step 1: 잘못된 파일 삭제/수정

```bash
# 1. 현재 frontend/app/page.tsx 내용 확인
cat K:\sparklio_ai_marketing_studio\frontend\app\page.tsx

# 2. 잘못된 랜딩 페이지 삭제 예정 (백업 먼저)
cp K:\sparklio_ai_marketing_studio\frontend\app\page.tsx \
   K:\sparklio_ai_marketing_studio\frontend\app\page.tsx.backup

# 3. 올바른 SPA 구조로 재작성
```

### Step 2: 올바른 `/app/page.tsx` 구조

```typescript
// frontend/app/page.tsx (올바른 버전)
'use client';

import { useState } from 'react';
import ChatPanel from '@/components/Chat/ChatPanel';
import EditorCanvas from '@/components/Editor/EditorCanvas';
import Inspector from '@/components/Editor/Inspector';
import Sidebar from '@/components/Layout/Sidebar';

export default function App() {
  const [currentView, setCurrentView] = useState<'chat' | 'editor'>('chat');

  return (
    <div className="flex h-screen">
      {/* 좌측: Sidebar + Chat */}
      <div className="w-80 border-r flex flex-col">
        <Sidebar onViewChange={setCurrentView} />
        {currentView === 'chat' && <ChatPanel />}
      </div>

      {/* 중앙: Editor Canvas */}
      <div className="flex-1">
        <EditorCanvas />
      </div>

      {/* 우측: Inspector */}
      <div className="w-80 border-l">
        <Inspector />
      </div>
    </div>
  );
}
```

**핵심**:
- 단일 페이지
- Chat, Editor, Inspector 모두 동시에 존재
- Sidebar 클릭 시 중앙 영역만 변경 (URL 변경 없음)

---

### Step 3: 필독 문서 읽기 (2시간 30분)

```bash
# 1. SYSTEM_ARCHITECTURE.md (60분)
code K:\sparklio_ai_marketing_studio\docs\SYSTEM_ARCHITECTURE.md

# 2. C_TEAM_WORK_ORDER.md v2.0 (40분)
code K:\sparklio_ai_marketing_studio\docs\C_TEAM_WORK_ORDER.md

# 3. ONE_PAGE_EDITOR_SPEC.md (40분)
code K:\obsidian-k\Sparklio_ai_marketing_studio\최종계획\ONE_PAGE_EDITOR_SPEC.md

# 4. GENERATORS_SPEC.md (30분)
code K:\obsidian-k\Sparklio_ai_marketing_studio\최종계획\GENERATORS_SPEC.md
```

**읽기 완료 후 확인 사항**:
- [ ] Sparklio V4.3은 SPA인가? → YES
- [ ] /app 하나의 페이지에서 모든 작업이 가능한가? → YES
- [ ] Chat, Editor, Inspector가 동시에 표시되는가? → YES
- [ ] P0는 3개 Generator + One-Page Editor + Export인가? → YES

---

### Step 4: Phase 1 시작 (1주 작업)

#### 목표: Next.js + 기본 SPA 구조 + Chat UI

```bash
# 1. 작업 폴더 이동
cd K:\sparklio_ai_marketing_studio\frontend

# 2. 의존성 설치
npm install axios fabric zustand jspdf
npm install -D @types/fabric

# 3. 환경 변수 설정
echo "NEXT_PUBLIC_API_URL=http://100.123.51.5:8000" > .env.local

# 4. Git 브랜치 생성
git checkout -b feature/frontend-p0-v2

# 5. 첫 커밋
git add .
git commit -m "chore: Reset to SPA structure (v2.0)"
git push origin feature/frontend-p0-v2
```

#### Phase 1 체크리스트

- [ ] **SPA 레이아웃 구조**
  - `app/page.tsx`: 좌측(Sidebar+Chat) + 중앙(Canvas) + 우측(Inspector)
  - 단일 페이지, URL 변경 없음

- [ ] **Chat UI 구현**
  - `components/Chat/ChatPanel.tsx`
  - 입력창, 메시지 리스트, Loading 상태

- [ ] **API Client**
  - `lib/api-client.ts`
  - Generator 호출: `POST /api/v1/generate`

- [ ] **State Management**
  - Zustand 설치
  - `store/chat-store.ts`, `store/editor-store.ts`

---

## 🚫 금지 사항 재확인

### ❌ 절대 하지 마세요

1. **다중 페이지 구조**
   ```
   /app/projects       ← 만들지 마세요!
   /app/dashboard      ← 만들지 마세요!
   /app/editor/[id]    ← 만들지 마세요!
   ```

2. **P1 기능 구현**
   - Meeting AI
   - Video Editor
   - PPTX Export
   - 이미지 기반 템플릿 생성

3. **독단적 기술 스택 변경**
   - Redux 사용 금지 (Zustand만)
   - Pages Router 금지 (App Router만)
   - Styled Components 금지 (Tailwind만)

### ✅ 반드시 하세요

1. **SYSTEM_ARCHITECTURE.md 기준 준수**
2. **SPA 구조 유지** (단일 `/app` 페이지)
3. **P0 범위만 구현** (3개 Generator + One-Page Editor + Export)
4. **2-3시간마다 커밋**
5. **필독 문서 완독 후 작업 시작**

---

## 📊 P0 완료 기준 (Definition of Done)

**End-to-End 시나리오**:
```
1. 사용자가 /app 접속
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
- **모든 작업이 /app 단일 페이지에서 완료**

---

## 🎯 최종 목표 재확인

### C팀의 P0 목표

> "Chat에서 자연어 입력 → Generator → One-Page Editor → PNG Export까지 작동하는 **단일 페이지 애플리케이션(SPA)**"

### 완료 기준

> "제품 상세페이지 만들어줘" → Draft 생성 → 수정 → Export → 파일 다운로드 성공
>
> **모든 과정이 /app 하나의 페이지에서 완료**

---

## 📞 문제 발생 시

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
- `TEAM_RESPONSIBILITIES.md` 참고

---

## ✅ 체크리스트 (작업 시작 전)

### 문서 읽기 완료 확인

- [ ] SYSTEM_ARCHITECTURE.md (60분) 완독
- [ ] C_TEAM_WORK_ORDER.md v2.0 (40분) 완독
- [ ] ONE_PAGE_EDITOR_SPEC.md (40분) 완독
- [ ] GENERATORS_SPEC.md (30분) 완독

### 핵심 개념 이해 확인

- [ ] Sparklio V4.3은 **SPA**다 (다중 페이지 아님)
- [ ] `/app` 하나의 페이지에서 모든 작업 완료
- [ ] Chat, Editor, Inspector 동시 표시
- [ ] P0는 3개 Generator + One-Page Editor + Export
- [ ] v1.0 문서는 폐기됨, v2.0만 유효

### 작업 준비 완료 확인

- [ ] 잘못된 `app/page.tsx` 백업 완료
- [ ] 의존성 설치 완료 (axios, fabric, zustand, jspdf)
- [ ] 환경 변수 설정 (`.env.local`)
- [ ] Git 브랜치 생성 (`feature/frontend-p0-v2`)

---

## 🚀 즉시 시작!

**다음 액션**:
1. 필독 문서 읽기 (2시간 30분)
2. 잘못된 코드 정리
3. SPA 구조로 재작성
4. Phase 1 시작 (Chat UI 구현)

**작업 기간**: 4주 (Phase 1-3)

**Good luck, C팀! 올바른 길로 다시 시작합니다! 🚀**

---

**작성 완료일**: 2025-11-15
**버전**: v2.0 (긴급 수정본)
**긴급도**: 🚨 최우선
**대상 팀 액션**: C팀 온보딩 및 Phase 1 즉시 시작
