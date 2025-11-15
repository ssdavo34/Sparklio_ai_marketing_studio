# Sparklio - Frontend Team (C팀) 종합 가이드

**작성일**: 2025-11-15
**대상**: Frontend Team (C팀)
**작업 디렉토리**: K:\sparklio_ai_marketing_studio\frontend

---

## 핵심 책임사항

Team C는 **사용자가 보는 모든 것**을 책임집니다.

### 주요 구현 항목
- Chat Interface (실시간 대화)
- Text/Image/Video Editor
- Review Buffer Pattern
- PPC Ads Publishing UI
- Dashboard & Analytics
- Brand Kit Editor

---

## Backend API 의존성

### 핵심 원칙: Mock-First Development

Backend API 완성을 기다리지 않고 Mock 데이터로 선행 개발합니다.

### 매일 오전 필수 확인
```bash
code docs/API_CONTRACTS/changelog.md
```

### 사용 가능한 API (2025-11-15 기준)
- ✅ GET /health
- ✅ POST /api/v1/users/register
- ✅ POST /api/v1/users/login
- ✅ GET /api/v1/users/me
- ✅ GET/POST /api/v1/brands
- ✅ GET/POST /api/v1/projects
- ✅ GET/POST /api/v1/assets

---

## 기술 스택

- Next.js 14 (App Router)
- TypeScript 5.x
- Tailwind CSS 3.x
- React Query (서버 상태)
- Zustand (클라이언트 상태)
- Lexical/Tiptap (Rich Text Editor)
- Framer Motion (애니메이션)
- Recharts (차트)

---

## 협업 규칙

### 매일 오전 (09:00-09:30)
1. API Contract 변경 확인
2. 작업 규정 확인
3. Master TODO 확인
4. Git 상태 확인
5. 개발 서버 실행

### 매일 저녁 (18:00-18:30)
1. 작업 보고서 작성
2. 익일 계획서 작성
3. Git 커밋 & Push

### 작업 중
- 작업 완료 시 즉시 Git 커밋
- API 변경 시 타입 업데이트
- Mock 데이터 활용

---

## 금지사항

### 절대 금지
1. Backend 대기하며 작업 중단
2. Git Pull 사용 (SSD가 원본!)
3. 작업 보고서 미작성
4. API Contract 미확인
5. 다른 팀 Port 사용

---

## 우선순위

### Phase 1 (Week 1-2) - 진행 중
- ✅ Next.js 초기화
- ✅ Backend API 연동
- ⏳ 테스트 페이지 개선

### Phase 2 (Week 3-5)
- Editor Shell & Layout
- Chat Interface
- Text Editor
- Image Editor
- Review Buffer

### Phase 3 (Week 6-8)
- Video Studio
- Meeting AI
- Brand Kit Editor

### Phase 4 (Week 9-11)
- PPC Ads
- Dashboard
- Cost Alert

### Phase 5 (Week 12-13)
- UI 폴리싱
- 온보딩
- 반응형 & 접근성

---

## 핵심 원칙 3가지

1. Mock-First Development
2. API Contract-Driven
3. 즉시 커밋

---

## 매일 해야 할 3가지

1. 오전: API Contract 확인
2. 작업 중: 즉시 커밋
3. 저녁: 보고서 작성

---

## 절대 하지 말아야 할 3가지

1. Backend 대기
2. Git Pull
3. 보고서 미작성

---

**Frontend Team은 사용자 경험을 책임집니다!**
**90일 MVP 완성을 위해 매일 최선을 다합니다!** 🚀

