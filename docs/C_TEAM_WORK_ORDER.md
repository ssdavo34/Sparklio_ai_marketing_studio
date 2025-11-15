# C_TEAM_WORK_ORDER.md
Sparklio V4 — C팀(Frontend) 작업 지시서
작성일: 2025-11-15
작성자: A팀 (Infrastructure Team)

---

# 1. 작업 개요

## 프로젝트
**Sparklio V4 AI Marketing Studio - Frontend Development**

## C팀 역할
프론트엔드 개발팀 (Frontend Team)

## 작업 기간
Phase 1-3: 약 6-8주 (Phase별 상세 일정은 아래 참조)

## 작업 폴더
```
frontend_starter/          ← C팀 작업 폴더 (여기서 개발)
frontend/                  ← 최종 병합 대상 (작업 완료 후)
```

**중요**:
- 모든 작업은 `frontend_starter/` 폴더에서 진행합니다
- Phase별 작업 완료 후 검토를 거쳐 `frontend/` 폴더로 병합합니다
- 병합 전까지는 `frontend_starter/`가 개발 환경입니다

---

# 2. 필독 문서

## 필독 문서 우선순위

### ⭐⭐⭐ 필수 (작업 시작 전 반드시 읽기)
1. **FINAL_REPORT.md**
   - 경로: `K:\sparklio_ai_marketing_studio\docs\FINAL_REPORT.md`
   - 내용: A팀 완료 보고서, 전체 시스템 이해
   - 읽는 시간: 30분

2. **EDITOR_ENGINE_IMPLEMENTATION.md**
   - 경로: `K:\sparklio_ai_marketing_studio\docs\EDITOR_ENGINE_IMPLEMENTATION.md`
   - 내용: Editor 엔진 구현 가이드 (Fabric.js 통합)
   - 읽는 시간: 45분

3. **AGENT_IO_SCHEMA_CATALOG.md**
   - 경로: `K:\sparklio_ai_marketing_studio\docs\AGENT_IO_SCHEMA_CATALOG.md`
   - 내용: 24개 에이전트 I/O 스키마 (API 이해)
   - 읽는 시간: 30분

4. **SMART_ROUTER_SPEC.md**
   - 경로: `K:\sparklio_ai_marketing_studio\docs\SMART_ROUTER_SPEC.md`
   - 내용: SmartRouter 스펙 (자연어 → Agent 라우팅)
   - 읽는 시간: 20분

### ⭐⭐ 중요 (Phase별 참고)
5. **SYSTEM_IMPROVEMENT_PLAN.md**
   - 경로: `K:\sparklio_ai_marketing_studio\docs\SYSTEM_IMPROVEMENT_PLAN.md`
   - 내용: 전체 시스템 아키텍처
   - 읽는 시간: 40분

6. **STARTER_CODE_COMPLETE.md**
   - 경로: `K:\sparklio_ai_marketing_studio\docs\STARTER_CODE_COMPLETE.md`
   - 내용: Backend 구조 이해 (API 연동 시 참고)
   - 읽는 시간: 20분

### ⭐ 참고 (필요 시)
7. **DEPLOYMENT_PROCEDURES.md**
   - 경로: `K:\sparklio_ai_marketing_studio\docs\DEPLOYMENT_PROCEDURES.md`
   - 내용: 배포 절차
   - 읽는 시간: 15분

8. **INTEGRATION_LAYER_COMPLETE.md**
   - 경로: `K:\sparklio_ai_marketing_studio\docs\INTEGRATION_LAYER_COMPLETE.md`
   - 내용: Backend 통합 레이어 (Ollama, ComfyUI)
   - 읽는 시간: 15분

9. **DEV_WORKFLOW.md**
   - 경로: `K:\sparklio_ai_marketing_studio\docs\DEV_WORKFLOW.md`
   - 내용: 개발 워크플로우
   - 읽는 시간: 10분

10. **PORT_ALLOCATION.md**
    - 경로: `K:\sparklio_ai_marketing_studio\docs\PORT_ALLOCATION.md`
    - 내용: 포트 할당 정보
    - 읽는 시간: 5분

---

# 3. Phase별 작업 계획

## Phase 1: Foundation (1-2주)

### 목표
Next.js 14 프로젝트 초기 설정 및 기본 구조 구축

### 작업 항목
- [ ] **Next.js 14 프로젝트 생성**
  - App Router 사용
  - TypeScript 설정
  - Tailwind CSS 설정
  - 폴더 구조 설계

- [ ] **API Client 구현**
  - FastAPI 연결 (http://100.123.51.5:8000)
  - SmartRouter 호출 함수
  - Error handling
  - TypeScript 타입 정의

- [ ] **인증 시스템 (Auth)**
  - JWT 토큰 관리
  - Login/Logout 페이지
  - Protected Routes
  - User Context

- [ ] **기본 레이아웃**
  - 헤더 (Header)
  - 사이드바 (Sidebar)
  - 네비게이션 (Navigation)
  - 반응형 디자인

- [ ] **State Management**
  - Zustand 또는 Jotai 설정
  - Global state 정의
  - User state
  - Editor state

### 산출물
- `frontend_starter/` 폴더 내 Next.js 프로젝트
- API client 라이브러리
- 인증 컴포넌트
- 기본 레이아웃 컴포넌트

---

## Phase 2: Core Features (2-3주)

### 목표
핵심 UI 컴포넌트 및 Editor 기본 기능 구현

### 작업 항목
- [ ] **프로젝트 관리 UI**
  - 프로젝트 목록 페이지
  - 프로젝트 생성/수정/삭제
  - 브랜드 선택
  - 프로젝트 대시보드

- [ ] **Editor 컴포넌트 (기본)**
  - Fabric.js 통합
  - Canvas 초기화
  - 자연어 입력 인터페이스
  - 기본 도형/텍스트 추가

- [ ] **Command Processor**
  - 자연어 명령 → SmartRouter API 호출
  - EditorAgent 응답 처리
  - Canvas 업데이트 로직
  - History 관리 (Undo/Redo)

- [ ] **Asset Library**
  - 이미지 업로드
  - MinIO 연동 (http://100.123.51.5:9000)
  - 썸네일 생성
  - Asset 검색/필터

- [ ] **브랜드 관리 UI**
  - BrandKit 조회/수정
  - 색상, 폰트, 로고 설정
  - 톤앤매너 설정

### 산출물
- 프로젝트 관리 페이지
- Editor 컴포넌트 (기본)
- Asset Library 컴포넌트
- 브랜드 관리 페이지

---

## Phase 3: Advanced Editor (2-3주)

### 목표
Editor 고급 기능 및 Workflow 통합

### 작업 항목
- [ ] **Editor 고급 기능**
  - 12개 Action Category 구현 (참고: EDITOR_ENGINE_IMPLEMENTATION.md)
    - Layout (add/move/resize/delete/group/align/distribute/layer)
    - Style (color/font/effect)
    - Content (text/image/shape)
  - Smart Snap (그리드, 가이드라인)
  - Multi-selection
  - Copy/Paste

- [ ] **Workflow Integration**
  - Workflow 실행 UI
  - 진행 상태 표시 (Progress bar)
  - Celery Task 상태 모니터링
  - 결과물 미리보기

- [ ] **Review System**
  - ReviewerAgent 결과 표시
  - 피드백 UI
  - 수정 요청 처리
  - Approval/Rejection

- [ ] **Real-time Collaboration (선택사항)**
  - WebSocket 연결 (Socket.io)
  - Multi-user editing
  - Cursor tracking

- [ ] **Export 기능**
  - PNG/JPG/SVG 다운로드
  - PDF 생성
  - PowerPoint 내보내기 (pptx)

### 산출물
- 완전한 Editor 컴포넌트
- Workflow 통합 UI
- Review 시스템
- Export 기능

---

## Phase 4: Monitoring & Optimization (1주, 선택사항)

### 목표
성능 최적화 및 사용자 경험 개선

### 작업 항목
- [ ] **성능 최적화**
  - Image lazy loading
  - Code splitting
  - Bundle size 최적화
  - React.memo, useMemo

- [ ] **사용자 피드백**
  - Toast notifications
  - Loading states
  - Error boundaries
  - Empty states

- [ ] **Analytics**
  - Google Analytics 또는 Mixpanel
  - User action tracking
  - Editor usage metrics

- [ ] **접근성 (A11y)**
  - ARIA labels
  - Keyboard navigation
  - Screen reader 지원

### 산출물
- 최적화된 프론트엔드 앱
- Analytics 통합
- A11y 지원

---

# 4. 일일 작업 계획서 양식

매일 작업 시작 전 작성하고, 작업 종료 시 업데이트합니다.

**파일 위치**: `frontend_starter/daily_logs/YYYY-MM-DD.md`

**양식**:

```markdown
# 일일 작업 계획서 - YYYY-MM-DD

## 작성자
- 이름: [이름]
- 날짜: YYYY-MM-DD
- Phase: [1/2/3/4]

---

## 오늘의 목표
1. [목표 1]
2. [목표 2]
3. [목표 3]

---

## 작업 항목

### 1. [작업 1 제목]
- **상태**: [진행 예정/진행 중/완료]
- **예상 시간**: [2시간]
- **실제 시간**: [2.5시간]
- **산출물**: [컴포넌트 파일 경로]
- **비고**: [특이사항]

### 2. [작업 2 제목]
- **상태**: [진행 중]
- **예상 시간**: [3시간]
- **실제 시간**: [진행 중]
- **산출물**: [파일 경로]
- **비고**: [막힌 부분, 해결 방법]

---

## 완료된 작업
- [x] 작업 1
- [x] 작업 2
- [ ] 작업 3 (미완료, 내일 계속)

---

## 학습한 내용
- [새로 배운 기술/개념]
- [참고한 문서/링크]

---

## 발생한 문제
### 문제 1: [문제 제목]
- **설명**: [문제 상세]
- **해결 방법**: [해결 과정]
- **참고**: [관련 링크/문서]

### 문제 2: [해결 안 됨]
- **설명**: [문제 상세]
- **시도한 방법**: [시도 1, 시도 2]
- **다음 액션**: [내일 A팀/B팀에게 문의]

---

## 내일 계획
1. [내일 작업 1]
2. [내일 작업 2]
3. [내일 작업 3]

---

## Git Commit
- [ ] 오전 커밋 (11:00-12:00)
- [ ] 오후 커밋 (15:00-16:00)
- [ ] 퇴근 전 커밋 (18:00-19:00)

**커밋 메시지 예시**:
- `feat(auth): Add login page with JWT integration`
- `feat(editor): Implement Fabric.js canvas initialization`
- `fix(api): Handle API error responses correctly`
```

---

# 5. Git 작업 규칙

## 5.1 브랜치 전략

```
main                    ← 운영 (병합 완료 후)
└── dev                 ← 개발 메인 브랜치
    ├── feature/auth           ← 기능별 브랜치
    ├── feature/editor
    ├── feature/project-mgmt
    └── feature/asset-library
```

## 5.2 커밋 메시지 포맷

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type
- **feat**: 새 기능
- **fix**: 버그 수정
- **docs**: 문서 변경
- **style**: 코드 포맷팅 (기능 변경 없음)
- **refactor**: 리팩토링
- **test**: 테스트 추가/수정
- **chore**: 빌드/설정 변경

### 예시
```bash
# Good
git commit -m "feat(auth): Add JWT token refresh logic"
git commit -m "feat(editor): Implement Fabric.js object selection"
git commit -m "fix(api): Handle 401 errors in API client"

# Bad
git commit -m "update"
git commit -m "fixed bug"
```

## 5.3 커밋 주기

### 권장
- **2-3시간마다 커밋** (작은 단위로 자주 커밋)
- 기능 단위로 커밋 (예: 컴포넌트 1개 완성 시)

### 최소
- **하루 1회 이상** (퇴근 전 반드시)

### 절대 금지
- 1주일에 1번 큰 커밋 (❌)
- "WIP" 커밋만 반복 (❌)

## 5.4 푸시 주기

- **하루 1회 이상** 원격 저장소에 push
- 작업 완료 시점에 즉시 push

---

# 6. 테스트 규칙

## 6.1 테스트 프레임워크

- **Unit Tests**: Jest + React Testing Library
- **E2E Tests**: Playwright (선택사항)

## 6.2 테스트 커버리지 목표

- **컴포넌트**: 70% 이상
- **Utils/Hooks**: 80% 이상

## 6.3 테스트 작성 규칙

```typescript
// Good: 컴포넌트 테스트
describe('EditorCanvas', () => {
  it('should initialize Fabric.js canvas', () => {
    render(<EditorCanvas />);
    const canvas = screen.getByTestId('editor-canvas');
    expect(canvas).toBeInTheDocument();
  });

  it('should handle natural language command', async () => {
    render(<EditorCanvas />);
    const input = screen.getByPlaceholderText('명령어 입력');
    fireEvent.change(input, { target: { value: '빨간색 원 추가' } });
    fireEvent.click(screen.getByText('실행'));
    await waitFor(() => {
      expect(screen.getByTestId('canvas-object-circle')).toBeInTheDocument();
    });
  });
});
```

## 6.4 테스트 실행

```bash
# 모든 테스트
npm test

# Watch mode
npm test -- --watch

# Coverage
npm test -- --coverage
```

---

# 7. 코드 품질 규칙

## 7.1 린터 (ESLint)

**설정**: `.eslintrc.json`

```json
{
  "extends": [
    "next/core-web-vitals",
    "plugin:@typescript-eslint/recommended",
    "prettier"
  ],
  "rules": {
    "no-console": "warn",
    "no-unused-vars": "error",
    "@typescript-eslint/no-explicit-any": "warn"
  }
}
```

**실행**:
```bash
npm run lint
npm run lint:fix  # 자동 수정
```

## 7.2 포맷터 (Prettier)

**설정**: `.prettierrc.json`

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2
}
```

**실행**:
```bash
npm run format
```

## 7.3 타입 체크 (TypeScript)

```bash
npm run type-check
```

**규칙**:
- `any` 타입 최소화
- 모든 함수에 타입 정의
- Props에 interface 정의

---

# 8. API 연동 가이드

## 8.1 FastAPI 엔드포인트

**Base URL**: `http://100.123.51.5:8000`

### 주요 엔드포인트

```typescript
// SmartRouter
POST /api/v1/router/route
{
  "user_id": "user123",
  "request_text": "빨간색 원 추가",
  "brand_id": "brand123"
}

// EditorAgent (예시, B팀 구현 후)
POST /api/v1/agents/editor/process
{
  "request_id": "req-001",
  "source_agent": "SmartRouter",
  "target_agent": "EditorAgent",
  "payload": {
    "command": "add_circle",
    "params": { "color": "red", "radius": 50 }
  }
}

// Workflow 실행
POST /api/v1/workflow/execute
{
  "project_id": "proj-123",
  "workflow_type": "brochure"
}
```

## 8.2 API Client 구현 예시

```typescript
// lib/api-client.ts
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://100.123.51.5:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// JWT 토큰 인터셉터
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// SmartRouter 호출
export async function routeRequest(userInput: string, brandId: string) {
  const response = await apiClient.post('/api/v1/router/route', {
    user_id: getCurrentUserId(),
    request_text: userInput,
    brand_id: brandId,
  });
  return response.data;
}

// EditorAgent 호출
export async function processEditorCommand(command: string, params: any) {
  const response = await apiClient.post('/api/v1/agents/editor/process', {
    request_id: generateRequestId(),
    source_agent: 'Frontend',
    target_agent: 'EditorAgent',
    payload: { command, params },
  });
  return response.data;
}
```

---

# 9. Editor 구현 가이드

## 9.1 Fabric.js 설치

```bash
npm install fabric
npm install @types/fabric --save-dev
```

## 9.2 기본 Canvas 컴포넌트

```typescript
// components/Editor/EditorCanvas.tsx
'use client';

import { useEffect, useRef } from 'react';
import { fabric } from 'fabric';

export default function EditorCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);

  useEffect(() => {
    if (canvasRef.current && !fabricRef.current) {
      fabricRef.current = new fabric.Canvas(canvasRef.current, {
        width: 800,
        height: 600,
        backgroundColor: '#ffffff',
      });
    }

    return () => {
      fabricRef.current?.dispose();
    };
  }, []);

  const addCircle = () => {
    if (!fabricRef.current) return;

    const circle = new fabric.Circle({
      radius: 50,
      fill: 'red',
      left: 100,
      top: 100,
    });

    fabricRef.current.add(circle);
  };

  return (
    <div>
      <canvas ref={canvasRef} data-testid="editor-canvas" />
      <button onClick={addCircle}>Add Circle</button>
    </div>
  );
}
```

## 9.3 자연어 명령 처리

```typescript
// components/Editor/CommandInput.tsx
'use client';

import { useState } from 'react';
import { routeRequest } from '@/lib/api-client';

interface CommandInputProps {
  brandId: string;
  onCommandExecuted: (result: any) => void;
}

export default function CommandInput({ brandId, onCommandExecuted }: CommandInputProps) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const result = await routeRequest(input, brandId);
      onCommandExecuted(result);
      setInput('');
    } catch (error) {
      console.error('Command execution failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-2">
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="명령어 입력 (예: 빨간색 원 추가)"
        className="flex-1 px-4 py-2 border rounded"
      />
      <button
        onClick={handleSubmit}
        disabled={loading}
        className="px-6 py-2 bg-blue-500 text-white rounded"
      >
        {loading ? '처리 중...' : '실행'}
      </button>
    </div>
  );
}
```

## 9.4 참고 문서

**필수**: [EDITOR_ENGINE_IMPLEMENTATION.md](K:\sparklio_ai_marketing_studio\docs\EDITOR_ENGINE_IMPLEMENTATION.md)

이 문서에서 다음 내용 참고:
- 4가지 Context (CanvasContext, CommandContext, EditorRules, HistoryContext)
- 12개 Action Category
- EditorAgent I/O 스키마

---

# 10. 폴더 구조 (권장)

```
frontend_starter/
├── app/                          # Next.js App Router
│   ├── (auth)/
│   │   ├── login/
│   │   └── signup/
│   ├── (dashboard)/
│   │   ├── projects/
│   │   ├── brands/
│   │   └── editor/[id]/
│   ├── layout.tsx
│   └── page.tsx
│
├── components/
│   ├── Editor/
│   │   ├── EditorCanvas.tsx
│   │   ├── CommandInput.tsx
│   │   ├── Toolbar.tsx
│   │   └── HistoryPanel.tsx
│   ├── Layout/
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   └── Navigation.tsx
│   ├── Projects/
│   │   ├── ProjectList.tsx
│   │   ├── ProjectCard.tsx
│   │   └── ProjectForm.tsx
│   └── Common/
│       ├── Button.tsx
│       ├── Input.tsx
│       └── Modal.tsx
│
├── lib/
│   ├── api-client.ts             # API 클라이언트
│   ├── fabric-helpers.ts         # Fabric.js 유틸
│   └── utils.ts
│
├── hooks/
│   ├── useEditor.ts
│   ├── useAuth.ts
│   └── useProjects.ts
│
├── store/
│   ├── auth-store.ts             # Zustand store
│   ├── editor-store.ts
│   └── project-store.ts
│
├── types/
│   ├── api.ts                    # API 타입 정의
│   ├── editor.ts
│   └── project.ts
│
├── tests/
│   ├── components/
│   └── lib/
│
├── daily_logs/                   # 일일 작업 계획서
│   ├── 2025-11-15.md
│   ├── 2025-11-16.md
│   └── ...
│
├── public/
│   └── assets/
│
├── .env.local
├── .eslintrc.json
├── .prettierrc.json
├── next.config.js
├── package.json
├── tsconfig.json
└── tailwind.config.ts
```

---

# 11. 환경 변수

**파일**: `frontend_starter/.env.local`

```bash
# API
NEXT_PUBLIC_API_URL=http://100.123.51.5:8000

# MinIO
NEXT_PUBLIC_MINIO_ENDPOINT=http://100.123.51.5:9000
NEXT_PUBLIC_MINIO_BUCKET=sparklio

# Analytics (선택)
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

---

# 12. 문제 발생 시 대응

## 12.1 문제 등급

### Level 1: 자체 해결 가능
- 컴포넌트 스타일 이슈
- 일반적인 버그
- 문서에 해결 방법이 있는 경우

**대응**: 스스로 해결, daily_logs에 기록

---

### Level 2: 팀 내 협의 필요
- API 응답 포맷 불일치
- 복잡한 상태 관리 이슈
- 성능 문제

**대응**:
1. Daily standup에서 논의
2. 팀 내 코드 리뷰
3. 해결 방법 문서화

---

### Level 3: A팀/B팀 협의 필요
- Backend API 변경 요청
- 인프라 이슈 (서버 접속 불가)
- 아키텍처 변경 필요

**대응**:
1. 즉시 A팀 또는 B팀에 알림
2. GitHub Issue 생성
3. 해결 때까지 대체 방안 사용

---

## 12.2 에스컬레이션

```
문제 발견
    ↓
자체 해결 시도 (1시간)
    ↓
[실패 시]
팀 내 논의 (Daily standup)
    ↓
[해결 안 되면]
A팀/B팀 협의 (GitHub Issue)
    ↓
[긴급 시]
즉시 Slack/Email 알림
```

---

# 13. 최종 체크리스트

## Phase 1 완료 시
- [ ] Next.js 14 프로젝트 생성 완료
- [ ] API Client 구현 및 테스트
- [ ] 인증 시스템 구현
- [ ] 기본 레이아웃 완성
- [ ] ESLint, Prettier 설정
- [ ] Git 커밋 규칙 준수
- [ ] Daily logs 작성 (매일)
- [ ] 테스트 커버리지 70% 이상

---

## Phase 2 완료 시
- [ ] 프로젝트 관리 UI 완성
- [ ] Editor 기본 기능 구현
- [ ] Fabric.js 통합
- [ ] SmartRouter 연동
- [ ] Asset Library 구현
- [ ] 브랜드 관리 UI 완성
- [ ] 테스트 커버리지 70% 이상

---

## Phase 3 완료 시
- [ ] Editor 12개 Action Category 완성
- [ ] Workflow 통합
- [ ] Review System 구현
- [ ] Export 기능 (PNG/JPG/PDF)
- [ ] E2E 테스트 작성
- [ ] 성능 최적화 (Lighthouse 80점 이상)

---

## 최종 병합 전 체크
- [ ] 모든 Phase 작업 완료
- [ ] 테스트 100% 통과
- [ ] ESLint 에러 0개
- [ ] Build 성공 (`npm run build`)
- [ ] 코드 리뷰 완료
- [ ] 문서 업데이트 (README, API docs)
- [ ] Git 커밋 메시지 정리
- [ ] `frontend_starter/` → `frontend/` 병합 준비

---

# 14. 기술 스택 요약

| 분류 | 기술 |
|------|------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| State | Zustand / Jotai |
| Canvas | Fabric.js |
| HTTP Client | Axios |
| Testing | Jest + React Testing Library |
| Linting | ESLint + Prettier |
| E2E Testing | Playwright (선택) |

---

# 15. 참고 자료

## 공식 문서
- Next.js: https://nextjs.org/docs
- Fabric.js: http://fabricjs.com/docs/
- Tailwind CSS: https://tailwindcss.com/docs

## 내부 문서
- [EDITOR_ENGINE_IMPLEMENTATION.md](K:\sparklio_ai_marketing_studio\docs\EDITOR_ENGINE_IMPLEMENTATION.md)
- [AGENT_IO_SCHEMA_CATALOG.md](K:\sparklio_ai_marketing_studio\docs\AGENT_IO_SCHEMA_CATALOG.md)
- [SMART_ROUTER_SPEC.md](K:\sparklio_ai_marketing_studio\docs\SMART_ROUTER_SPEC.md)

---

# 16. 연락처 및 지원

## A팀 (Infrastructure)
- **역할**: 인프라, 환경 설정, 아키텍처
- **문의**: 서버 접속 이슈, 환경 변수, 배포 관련

## B팀 (Backend)
- **역할**: FastAPI, Agent 구현, API
- **문의**: API 변경 요청, 에이전트 연동 이슈

## C팀 (Frontend)
- **역할**: Next.js, Editor, UI/UX
- **팀 내 협업**: Daily standup, 코드 리뷰

---

# 17. 시작하기

## Step 1: 환경 설정
```bash
# 1. 작업 폴더로 이동
cd K:\sparklio_ai_marketing_studio\frontend_starter

# 2. Next.js 프로젝트 생성
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir

# 3. 의존성 설치
npm install axios fabric zustand
npm install -D @types/fabric

# 4. 환경 변수 설정
cp .env.example .env.local
# .env.local 파일 편집
```

## Step 2: 필독 문서 읽기
- [ ] FINAL_REPORT.md (30분)
- [ ] EDITOR_ENGINE_IMPLEMENTATION.md (45분)
- [ ] AGENT_IO_SCHEMA_CATALOG.md (30분)
- [ ] SMART_ROUTER_SPEC.md (20분)

## Step 3: 첫 커밋
```bash
git checkout -b dev
git add .
git commit -m "chore: Initialize Next.js 14 project with TypeScript and Tailwind"
git push origin dev
```

## Step 4: Daily log 작성
```bash
# 오늘 날짜로 파일 생성
code frontend_starter/daily_logs/2025-11-15.md
```

---

# 18. 결론

**C팀(Frontend)의 역할**:
- Sparklio V4의 사용자 인터페이스 개발
- Editor 엔진 구현 (Fabric.js)
- Backend API 연동
- 사용자 경험 최적화

**A팀이 준비한 것**:
- ✅ 전체 시스템 설계
- ✅ Backend API 명세
- ✅ Editor 구현 가이드
- ✅ 작업 지시서 및 워크플로우

**C팀이 해야 할 것**:
- Phase 1-3 순차 진행
- 매일 작업 로그 작성
- 자주 커밋 (2-3시간마다)
- 테스트 작성 (70% 이상)
- 코드 품질 유지 (ESLint/Prettier)

---

**작성 완료일**: 2025-11-15
**다음 액션**: C팀 온보딩, Next.js 프로젝트 생성, Phase 1 시작

**Good luck, C팀! 🚀**
