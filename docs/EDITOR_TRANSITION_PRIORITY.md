# 🔴 최우선 과제: 에디터 전환 (Konva → Polotno)

**작성일**: 2025-11-20
**담당**: A팀 QA
**상태**: CRITICAL - 즉시 실행 필요

## 📢 긴급 공지

### C팀과의 결정사항 (2025-11-20)

**에디터를 Konva에서 Polotno로 완전 전환하기로 확정했습니다.**

이는 현재 프로젝트의 **최우선 과제**입니다.

---

## 🎯 전환 이유

### 현재 문제점
1. **Konva 에디터 구현 복잡도**
   - 기본 기능 구현에도 과도한 시간 소요
   - 텍스트 편집, 이미지 처리, 레이어 관리 등 모든 기능을 직접 구현해야 함

2. **전체 프로젝트 차질**
   - LLM 통합 지연
   - Brand Kit 연동 불가
   - Meeting AI 기능 구현 차단
   - Generator API 활용 불가

3. **데드라인 압박**
   - 학원 발표 일정 임박
   - MVP 데모 필요

### Polotno 선택 이유
1. **즉시 사용 가능한 에디터**
   - 상용 수준의 UI/UX
   - 모든 기본 기능 내장
   - Canva와 유사한 인터페이스

2. **빠른 통합**
   - SDK 형태로 제공
   - React 컴포넌트로 쉽게 임베드
   - 2주 내 완성 가능

3. **확장성**
   - 커스텀 패널 추가 가능
   - AI 기능 통합 용이
   - API 연동 지원

---

## 📋 실행 계획

### Phase 0: 즉시 실행 (오늘 ~ 3일)
- [ ] Polotno SDK 라이선스 확인 및 설치
- [ ] `/studio` 라우트를 Polotno로 교체
- [ ] 기본 에디터 UI 구성
- [ ] 기존 Konva 코드는 `/studio/konva`로 보존

### Phase 1: 핵심 통합 (3일 ~ 1주)
- [ ] SparklioDocument 모델 정의
- [ ] Polotno ↔ SparklioDocument 어댑터 구현
- [ ] EditorAPI 연동
- [ ] 저장/불러오기 기능

### Phase 2: AI 통합 (1주 ~ 2주)
- [ ] Spark Chat 패널 통합
- [ ] LLM 프롬프트 → 디자인 생성
- [ ] Brand Kit 연동
- [ ] Meeting AI 템플릿 적용

---

## 👥 팀별 역할

### A팀 (QA/문서)
- ✅ `SPARKLIO_EDITOR_PLAN_v1.1.md` 작성 완료
- ✅ 우선순위 문서 작성 완료
- [ ] 진행 상황 모니터링
- [ ] 테스트 계획 수립

### B팀 (Backend)
- [ ] EditorAPI 엔드포인트 구현
  - `/api/v1/editor/save`
  - `/api/v1/editor/load`
  - `/api/v1/editor/generate`
- [ ] SparklioDocument 스키마 정의
- [ ] 에셋 업로드 API 구현

### C팀 (Frontend) - **핵심 실행팀**
- [ ] **Polotno SDK 설치 및 설정** (최우선)
- [ ] **`/studio` 페이지 전환** (최우선)
- [ ] 에디터 컴포넌트 구현
- [ ] AI 패널 UI 구현
- [ ] 어댑터 로직 구현

---

## 🚨 주의사항

### 하지 말아야 할 것
- ❌ Konva 에디터 추가 개발 중단
- ❌ 복잡한 커스텀 기능 시도 금지
- ❌ 완벽주의 추구 금지

### 반드시 해야 할 것
- ✅ 작동하는 MVP 우선
- ✅ 기본 기능부터 구현
- ✅ 매일 진행 상황 공유

---

## 📊 성공 지표

### 1주차 목표
- Polotno 에디터 기본 동작
- 텍스트/이미지 추가 가능
- 저장/불러오기 가능

### 2주차 목표
- LLM 프롬프트로 디자인 생성
- Brand Kit 적용
- Export 기능 (PNG/PDF)

---

## 📞 커뮤니케이션

### 일일 체크인
- 매일 오전 10시 진행 상황 공유
- 블로커 즉시 보고
- Slack #editor-transition 채널 활용

### 주요 연락처
- A팀: 문서/테스트 지원
- B팀: API 관련 문의
- C팀: 프론트엔드 구현

---

## 🔗 관련 문서

- [SPARKLIO_EDITOR_PLAN_v1.1.md](./live/SPARKLIO_EDITOR_PLAN_v1.1.md) - 전체 계획
- [ISSUE_TRACKER.md](./ISSUE_TRACKER.md) - 이슈 관리
- [TEST_REPORT_GEMINI.md](./TEST_REPORT_GEMINI.md) - 최근 테스트 결과

---

## ⏰ 타임라인

```
2025-11-20 (오늘)
├── 결정 및 문서화 ✅
├── C팀에 전달 ⏳
└── Polotno SDK 검토 시작 ⏳

2025-11-21 ~ 23 (3일)
├── Polotno 기본 구현
└── /studio 라우트 전환

2025-11-24 ~ 27 (1주)
├── 핵심 기능 통합
└── API 연동

2025-11-28 ~ 12-03 (2주)
├── AI 기능 통합
├── 테스트 및 안정화
└── MVP 완성
```

---

**이 문서는 프로젝트의 최우선 과제를 명시합니다.**
**모든 팀은 이 전환 작업에 집중해주시기 바랍니다.**

---

**작성**: A팀 QA
**승인**: 대기 중
**상태**: ACTIVE - 진행 중