# Canvas Studio v3.1 - 프로젝트 문서

> **Polotno 기반 Sparklio 에디터**
> **시작일**: 2025-11-22
> **예상 완료**: 2025-12-20

---

## 📚 문서 목록

### 🔥 빠르게 시작하기

| 문서 | 대상 | 읽는 시간 |
|------|------|----------|
| [📄 요약서](./EXECUTIVE_SUMMARY.md) | 모든 팀 | 2분 |
| [📘 마스터 플랜](./000_MASTER_PLAN.md) | 전체 개발팀 | 15분 |
| [📋 협조 요청서](./003_TEAM_COORDINATION_REQUEST.md) | Backend + QA | 10분 |

### 📖 상세 문서 (작성 예정)

- [ ] `001_TECHNICAL_SPEC.md` - 기술 스펙 (API, 데이터 모델)
- [ ] `002_BLOCK_IMPLEMENTATION.md` - Block별 구현 가이드
- [ ] `004_TROUBLESHOOTING.md` - 문제 해결 가이드
- [ ] `005_DEPLOYMENT.md` - 배포 가이드

---

## 🎯 프로젝트 개요

### 무엇을 만드나요?

**Polotno SDK를 Canvas 엔진으로 사용하면서, Sparklio만의 VSCode 스타일 UI를 유지하는 하이브리드 에디터**

### 왜 바꾸나요?

| 지표 | 개선 효과 |
|------|----------|
| 개발 기간 | 3개월 → **1개월 (60% 단축)** |
| 기능 완성도 | 기본 → **고급 (150% 향상)** |
| 안정성 | 미검증 → **검증됨 (80% 향상)** |

### 언제 완성되나요?

```
Week 1 (11/22~): 기초 + Polotno 통합
Week 2 (11/29~): 패널 + API 연동
Week 3 (12/06~): 모드 + AI
Week 4 (12/13~): 테스트 & 배포
```

---

## 🏗️ 아키텍처 한눈에 보기

```
Sparklio UI (우리가 만듦)
    ↓
Command Bridge (변환 계층)
    ↓
Polotno SDK (Canvas 엔진)
```

### 레이아웃

```
┌─────────────────────────────────────────┐
│  Top Toolbar (제목, 저장, 공유)          │
├────┬──────────────────────────────┬─────┤
│ A  │ Left Panel      │ Canvas     │  R  │
│ c  │ - Pages         │ Viewport   │  i  │
│ t  │ - Layers        │ (Polotno)  │  g  │
│ i  │ - Templates     │            │  h  │
│ v  │                 │            │  t  │
│ i  │                 │            │     │
│ t  │                 │            │  D  │
│ y  │                 │            │  o  │
│    │                 │            │  c  │
│ B  │                 │            │  k  │
│ a  │                 │            │     │
│ r  │                 │            │     │
└────┴──────────────────────────────┴─────┘
```

---

## 👥 팀별 역할

### C팀 (Frontend) - 우리
- ✅ UI/UX 구현
- ✅ Polotno 통합
- ✅ AI Agent 연동

### B팀 (Backend)
- 🟡 Canvas 저장 API
- 🟡 Brand Kit API

### A팀 (QA)
- 🟡 테스트 환경 구성
- 🟡 Polotno 제약 검증

---

## 🚀 개발 시작하기

### 1. 문서 읽기

```bash
# 빠른 이해 (2분)
cat EXECUTIVE_SUMMARY.md

# 전체 계획 (15분)
cat 000_MASTER_PLAN.md
```

### 2. 환경 설정

```bash
# 프로젝트 루트
cd frontend

# 의존성 설치 (이미 완료)
npm install

# 개발 서버 시작
npm run dev
```

### 3. 새 에디터 접속

```
기존: http://localhost:3000/studio/polotno
새로운: http://localhost:3000/studio/v3 (Block 1 완료 후)
```

---

## 📞 연락처

### Slack 채널
- **프로젝트 전체**: `#canvas-studio-v3`
- **긴급**: `@claude` (C팀 리드)

### 회의
- **주간 Sync**: 매주 월요일 10:00
- **문제 해결**: 수시 (Discord 음성)

---

## 📊 현재 진행 상황

### 완료됨 ✅
- [x] 마스터 플랜 작성
- [x] 타팀 협조 요청서 작성
- [x] 프로젝트 문서 구조 완성

### 진행 중 🔄
- [ ] Block 1: 기초 인프라
- [ ] Block 2: Polotno Workspace

### 대기 중 ⏳
- [ ] Block 3-7 구현
- [ ] 테스트 & 배포

---

## 🔗 외부 링크

- [Polotno 공식 문서](https://polotno.com/docs)
- [Polotno API Reference](https://polotno.com/docs/api)
- [Sparklio v3.0 PRD](../../002.%20Canvas%20Studio%20v3.1%20The%20All-in-One%20Creative%20Engine%20PRD.md)

---

## 📝 체인지로그

### 2025-11-22
- ✨ 프로젝트 시작
- 📄 마스터 플랜, 협조 요청서, 요약서 작성
- 🏗️ 문서 구조 완성

---

**마지막 업데이트**: 2025-11-22
**다음 업데이트**: Block 1 완료 후 (예정: 11/23)
