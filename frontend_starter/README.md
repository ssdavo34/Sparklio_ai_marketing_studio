# Sparklio AI Marketing Studio - Frontend

**버전**: 1.0.0
**프레임워크**: Next.js 14 (App Router)
**언어**: TypeScript
**스타일**: Tailwind CSS
**작성일**: 2025-11-15

---

## 프로젝트 개요

Sparklio AI Marketing Studio의 프론트엔드 애플리케이션입니다. AI 기반 마케팅 콘텐츠 생성 플랫폼으로, 자연어 명령을 통해 브로셔, 프레젠테이션, SNS 이미지 등 다양한 시각적 결과물을 제작할 수 있습니다.

---

## 기술 스택

### Core
- **Next.js** 14.2.33 - React 프레임워크 (App Router)
- **React** 18.3.1 - UI 라이브러리
- **TypeScript** 5 - 타입 안정성

### Styling
- **Tailwind CSS** 3.4.1 - 유틸리티 CSS 프레임워크
- **PostCSS** - CSS 전처리

### State Management & Data
- **Zustand** 5.0.2 - 경량 상태 관리
- **Axios** 1.7.9 - HTTP 클라이언트

### Editor
- **Fabric.js** 6.5.2 - Canvas 편집 엔진

### Development
- **ESLint** - 코드 린팅
- **Jest** - 테스트 프레임워크
- **Testing Library** - React 컴포넌트 테스트

---

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env.local` 파일을 생성하고 다음 내용을 추가하세요:

```env
# Backend API
NEXT_PUBLIC_API_URL=http://100.123.51.5:8000

# Environment
NEXT_PUBLIC_APP_ENV=development

# Upload settings
NEXT_PUBLIC_MAX_FILE_SIZE_MB=100

# MinIO
NEXT_PUBLIC_MINIO_ENDPOINT=http://100.123.51.5:9000
```

### 3. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

### 4. 테스트 페이지 확인

Backend 연동 상태를 확인하려면 [http://localhost:3000/test](http://localhost:3000/test)를 방문하세요.

---

## 프로젝트 구조

```
frontend_starter/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # 루트 레이아웃
│   ├── page.tsx           # 홈페이지
│   ├── globals.css        # 글로벌 스타일
│   └── test/              # 테스트 페이지
│       └── page.tsx
├── components/             # React 컴포넌트
│   ├── Editor/            # Editor 관련 (예정)
│   ├── Layout/            # 레이아웃 (예정)
│   ├── Projects/          # 프로젝트 관리 (예정)
│   ├── Common/            # 공통 컴포넌트 (예정)
│   └── HealthCheck.tsx    # Backend 헬스체크
├── lib/                    # 유틸리티
│   ├── api-client.ts      # API 클라이언트
│   └── fabric-helpers.ts  # Fabric.js 헬퍼 (예정)
├── hooks/                  # Custom React Hooks
│   ├── useEditor.ts       # (예정)
│   ├── useAuth.ts         # (예정)
│   └── useProjects.ts     # (예정)
├── store/                  # Zustand 상태 관리
│   ├── authStore.ts       # (예정)
│   ├── editorStore.ts     # (예정)
│   └── projectStore.ts    # (예정)
├── types/                  # TypeScript 타입 정의
│   └── index.ts           # 공통 타입
├── tests/                  # Jest 테스트
│   └── (예정)
├── daily_logs/            # 일일 작업 계획서
│   └── 2025-11-15.md
├── public/                # 정적 파일
├── .env.local             # 환경 변수 (Git 무시)
├── .env.example           # 환경 변수 예시
├── package.json           # 프로젝트 설정
├── tsconfig.json          # TypeScript 설정
├── tailwind.config.ts     # Tailwind 설정
└── README.md              # 이 파일
```

---

## 주요 기능 (구현 예정)

### Phase 1: 기본 UI 구축 (1-2주)
- [ ] 레이아웃 및 네비게이션
- [ ] 로그인/회원가입 페이지
- [ ] 대시보드 메인 페이지
- [ ] 자산 업로드 페이지
- [ ] 자산 목록 페이지

### Phase 2: 상태 관리 및 인증 (2-3주)
- [ ] Zustand 전역 상태 관리
- [ ] JWT 토큰 기반 인증
- [ ] 보호된 라우트
- [ ] 사용자 프로필 페이지

### Phase 3: Editor 구현 (2-3주)
- [ ] Fabric.js 통합
- [ ] 자연어 명령 처리
- [ ] 12개 Action Category 구현
- [ ] Workflow 통합
- [ ] Review System
- [ ] Export 기능

### Phase 4: 최적화 (1주, 선택)
- [ ] 성능 최적화
- [ ] Analytics 통합
- [ ] Accessibility (A11y)

---

## API 연동

### Backend API
- **Base URL**: `http://100.123.51.5:8000`
- **문서**: http://100.123.51.5:8000/docs

### 주요 엔드포인트

#### SmartRouter
```typescript
POST /api/v1/router/route
{
  "user_id": "string",
  "request_text": "string",
  "brand_id": "string",
  "project_id": "string"
}
```

#### EditorAgent
```typescript
POST /api/v1/editor/process
{
  "canvas": object,
  "command": { "raw": "string" },
  "rules": object
}
```

#### Assets
```typescript
GET    /api/v1/assets              # 목록 조회
POST   /api/v1/assets              # 업로드
GET    /api/v1/assets/{id}         # 상세 조회
DELETE /api/v1/assets/{id}         # 삭제
```

---

## 개발 가이드

### 코드 스타일
- ESLint 규칙 준수
- Prettier 자동 포맷팅
- TypeScript strict mode

### 컴포넌트 작성
- 함수형 컴포넌트 사용
- 'use client' 지시어 명시 (클라이언트 컴포넌트)
- TypeScript 타입 명시

예시:
```typescript
'use client';

interface Props {
  title: string;
  onSubmit: () => void;
}

export default function MyComponent({ title, onSubmit }: Props) {
  return <div>{title}</div>;
}
```

### API 호출
`lib/api-client.ts`의 함수 사용:

```typescript
import { routeRequest, listAssets } from '@/lib/api-client';

// SmartRouter 호출
const result = await routeRequest('브랜드 이미지 생성해줘', brandId);

// Asset 목록 조회
const assets = await listAssets({ brandId, page: 1, pageSize: 20 });
```

---

## 테스트

### 단위 테스트
```bash
npm test
```

### 테스트 Watch 모드
```bash
npm run test:watch
```

### 커버리지
- 컴포넌트: 70% 이상
- Utils: 80% 이상

---

## 빌드 및 배포

### Production 빌드
```bash
npm run build
```

### Production 서버 실행
```bash
npm start
```

---

## Git 커밋 규칙

### 커밋 메시지 포맷
```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type
- `feat`: 새로운 기능
- `fix`: 버그 수정
- `docs`: 문서 수정
- `style`: 코드 포맷팅
- `refactor`: 리팩토링
- `test`: 테스트 추가/수정
- `chore`: 기타 작업

### 예시
```
feat(editor): Add natural language command parser

Implemented command parser for editor using LLM.
Supports 12 action categories.

Closes #123
```

### 커밋 주기
- 2-3시간마다 커밋 (권장)
- 최소 1일 1회 커밋

---

## 참고 문서

### 필수 (⭐⭐⭐)
1. [FINAL_REPORT.md](../docs/FINAL_REPORT.md)
2. [EDITOR_ENGINE_IMPLEMENTATION.md](../docs/EDITOR_ENGINE_IMPLEMENTATION.md)
3. [AGENT_IO_SCHEMA_CATALOG.md](../docs/AGENT_IO_SCHEMA_CATALOG.md)
4. [SMART_ROUTER_SPEC.md](../docs/SMART_ROUTER_SPEC.md)

### 중요 (⭐⭐)
5. [SYSTEM_IMPROVEMENT_PLAN.md](../docs/SYSTEM_IMPROVEMENT_PLAN.md)
6. [STARTER_CODE_COMPLETE.md](../docs/STARTER_CODE_COMPLETE.md)

### 참고 (⭐)
7. [DEPLOYMENT_PROCEDURES.md](../docs/DEPLOYMENT_PROCEDURES.md)
8. [C_TEAM_WORK_ORDER.md](../C_TEAM_WORK_ORDER.md)

---

## 문제 해결

### Backend API 연결 실패
1. Backend 서버 실행 확인:
   ```bash
   curl http://100.123.51.5:8000/health
   ```

2. CORS 설정 확인
3. 환경 변수 확인 (.env.local)

### 환경 변수 로드 안 됨
- `NEXT_PUBLIC_` prefix 필요
- 서버 재시작 필요 (환경 변수 변경 시)

---

## 라이센스

Private - Sparklio AI Marketing Studio

---

## 팀 연락처

**C팀 (Frontend)**
- 프로젝트 문의: [Issues](https://github.com/...)

**Backend API 담당**
- B팀과 협의

---

**마지막 업데이트**: 2025-11-15
