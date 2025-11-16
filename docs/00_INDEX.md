# Sparklio v4 AI Marketing Studio - 문서 지도

**최종 업데이트**: 2025-11-16 16:30
**현재 Phase**: Phase 1 - LLM Gateway 구축 (Day 0)
**긴급 이슈**: 없음 (B팀 작업 시작, A팀 지원 체제 구축)

---

## 🚀 빠른 시작 (역할별 진입점)

### 👨‍💼 PM / 리더
**지금 당장 확인할 문서**:
1. ⭐ [현재 진행 상황](plans/CURRENT_PHASE.md) (1분)
2. [프로젝트 전체 구조](architecture/001_SYSTEM_OVERVIEW.md) (5분)
3. [이번 주 우선순위](plans/CURRENT_PRIORITIES.md) (2분)

### 👷 B팀 (Backend 개발자)
**LLM Gateway 구축 시작**:
1. ⭐ [B팀 작업 요청서](requests/2025-11-16_B팀_LLM_GATEWAY_REQUEST.md) (3분 요약본)
2. [상세 작업 지시서](requests/BACKEND_LLM_GATEWAY_WORK_ORDER.md) (전체 가이드)
3. [LLM Gateway Spec](specs/LLM_GATEWAY_SPEC_v1.0.md) (API 명세)
4. [Media Gateway Spec](specs/MEDIA_GATEWAY_SPEC_v1.0.md) (API 명세)

### 🔍 A팀 (QA & Testing)
**현재 작업**:
1. ⭐ [A팀 작업 목록](plans/A팀_CURRENT_TASKS.md) (B팀 작업 중 할 일)
2. [현재 Phase 상태](plans/CURRENT_PHASE.md)
3. [테스트 타임아웃 분석](reports/2025-11-15_TEST_TIMEOUT_ANALYSIS.md)
4. [A팀 규정집](guides/A팀_REGULATIONS.md)

### 🆕 새로운 팀원
**온보딩 순서**:
1. [신규 팀원 온보딩](guides/ONBOARDING.md) (10분)
2. [시스템 전체 구조](architecture/001_SYSTEM_OVERVIEW.md) (20분)
3. [일일 작업 흐름](guides/DAILY_WORKFLOW.md) (5분)
4. [현재 Phase](plans/CURRENT_PHASE.md) (5분)

### 🚨 에러 발생 시
1. [트러블슈팅 가이드](guides/TROUBLESHOOTING.md)
2. 관련 Spec 문서 확인
3. 최근 의사결정 기록 확인 ([decisions/](decisions/README.md))

---

## 📂 문서 구조

```
docs/
├── 00_INDEX.md                    ← 🌟 지금 보고 있는 문서 (시작점)
│
├── architecture/                  ← 시스템 설계 문서
│   ├── 001_SYSTEM_OVERVIEW.md
│   ├── 002_GATEWAY_PATTERN.md
│   └── 003_AGENT_ARCHITECTURE.md
│
├── specs/                         ← API/기술 명세서
│   ├── LLM_GATEWAY_SPEC_v1.0.md
│   ├── MEDIA_GATEWAY_SPEC_v1.0.md
│   └── API_CONTRACT_v1.0.md
│
├── decisions/                     ← 의사결정 기록 (ADR)
│   ├── README.md                  ← 결정 히스토리 요약
│   ├── 2025-11-16_001_WHY_GATEWAY.md
│   └── 2025-11-16_002_OLLAMA_FIRST.md
│
├── plans/                         ← 작업 계획
│   ├── CURRENT_PHASE.md           ← 🌟 현재 진행 상황 (매일 업데이트)
│   ├── CURRENT_PRIORITIES.md      ← 🌟 우선순위 (매일 업데이트)
│   └── 2025-11-16_LLM_GATEWAY_PLAN.md
│
├── requests/                      ← 팀 간 요청서
│   ├── 2025-11-16_B팀_LLM_GATEWAY_REQUEST.md
│   ├── BACKEND_LLM_GATEWAY_WORK_ORDER.md
│   └── template_team_request.md
│
├── reports/                       ← 분석 보고서
│   ├── 2025-11-16_LLM_CONNECTION_ANALYSIS.md
│   └── 2025-11-15_TEST_TIMEOUT_ANALYSIS.md
│
├── guides/                        ← 운영 가이드
│   ├── A팀_REGULATIONS.md         ← A팀 규정집
│   ├── ONBOARDING.md
│   ├── DAILY_WORKFLOW.md
│   └── TROUBLESHOOTING.md
│
└── meetings/                      ← 회의록/대화록
    ├── 2025-11-16_LLM_STRATEGY_DECISION.md
    └── template_meeting_notes.md
```

---

## 📚 카테고리별 최신 문서

### ⚙️ Architecture (시스템 설계)
| ID | 문서 | 상태 | 업데이트 | 설명 |
|----|------|------|----------|------|
| ARCH-001 | [System Overview](architecture/001_SYSTEM_OVERVIEW.md) | ✅ Approved | 2025-11-16 | Sparklio v4 전체 구조 |
| ARCH-002 | [Gateway Pattern](architecture/002_GATEWAY_PATTERN.md) | ✅ Approved | 2025-11-16 | LLM/Media Gateway 패턴 |
| ARCH-003 | [Agent Architecture](architecture/003_AGENT_ARCHITECTURE.md) | ✅ Approved | 2025-11-16 | 6개 Agent 설계 |

### 📋 Specifications (기술 명세)
| ID | 문서 | 버전 | 업데이트 | 설명 |
|----|------|------|----------|------|
| SPEC-001 | [LLM Gateway Spec](specs/LLM_GATEWAY_SPEC_v1.0.md) | v1.0 | 2025-11-16 | LLM Gateway API 명세 |
| SPEC-002 | [Media Gateway Spec](specs/MEDIA_GATEWAY_SPEC_v1.0.md) | v1.0 | 2025-11-16 | Media Gateway API 명세 |

### 🎯 Decisions (의사결정 기록)
| ID | 문서 | 날짜 | 결정 사항 |
|----|------|------|-----------|
| DEC-001 | [Why Gateway Pattern](decisions/2025-11-16_001_WHY_GATEWAY.md) | 2025-11-16 | Gateway 패턴 채택 이유 |
| DEC-002 | [Ollama First Strategy](decisions/2025-11-16_002_OLLAMA_FIRST.md) | 2025-11-16 | Ollama 우선, 확장 가능하게 |

### 📊 Current Work (현재 작업)
| 문서 | 업데이트 주기 | 마지막 업데이트 |
|------|--------------|-----------------|
| ⭐ [현재 Phase](plans/CURRENT_PHASE.md) | 매일 | 2025-11-16 15:35 |
| ⭐ [A팀 작업 목록](plans/A팀_CURRENT_TASKS.md) | 매일 | 2025-11-16 16:30 |
| ⭐ [우선순위](plans/CURRENT_PRIORITIES.md) | 매일 | 2025-11-16 15:35 |
| [B팀 요청서](requests/2025-11-16_B팀_LLM_GATEWAY_REQUEST.md) | 필요시 | 2025-11-16 |
| [B팀 작업 지시 회신](requests/2025-11-16_B팀_작업지시_회신.md) | 필요시 | 2025-11-16 |
| [C팀 문서 체계 안내](requests/2025-11-16_C팀_문서체계_안내.md) | 필요시 | 2025-11-16 |

---

## 🗓️ 타임라인 (최근 활동)

### 2025-11-16
- **16:30** - [A팀 작업 목록 작성](plans/A팀_CURRENT_TASKS.md) (B팀 작업 중 할 일 정리)
- **16:00** - [B팀 작업 지시 회신](requests/2025-11-16_B팀_작업지시_회신.md) (3개 질문 답변)
- **16:00** - [C팀 문서 체계 안내](requests/2025-11-16_C팀_문서체계_안내.md)
- **15:35** - 문서 체계 확립 (INDEX, 규정 생성)
- **14:00** - [LLM 연결 전략 분석](reports/2025-11-16_LLM_CONNECTION_ANALYSIS.md)
- **13:30** - [Gateway Pattern 의사결정](decisions/2025-11-16_001_WHY_GATEWAY.md)
- **13:00** - [B팀 작업 요청서 발송](requests/2025-11-16_B팀_LLM_GATEWAY_REQUEST.md)

### 2025-11-15
- **16:00** - [Backend API 테스트 타임아웃 분석](reports/2025-11-15_TEST_TIMEOUT_ANALYSIS.md)
- **15:00** - Mac mini 동기화 완료

---

## 🔍 주제별 문서 맵

### LLM Gateway 구축 관련
**의사결정 과정**:
1. 왜? → [DEC-001: Why Gateway](decisions/2025-11-16_001_WHY_GATEWAY.md)
2. 무엇을? → [ARCH-002: Gateway Pattern](architecture/002_GATEWAY_PATTERN.md)
3. 어떻게? → [SPEC-001: LLM Gateway Spec](specs/LLM_GATEWAY_SPEC_v1.0.md)

**실행 계획**:
1. 전체 계획 → [PLAN-001: LLM Gateway Plan](plans/2025-11-16_LLM_GATEWAY_PLAN.md)
2. B팀 요청 → [B팀 요청서](requests/2025-11-16_B팀_LLM_GATEWAY_REQUEST.md)
3. 상세 지침 → [작업 지시서](requests/BACKEND_LLM_GATEWAY_WORK_ORDER.md)

**현재 상태**:
- ⭐ [CURRENT_PHASE.md](plans/CURRENT_PHASE.md)

### Agent 시스템 관련
- 설계: [ARCH-003: Agent Architecture](architecture/003_AGENT_ARCHITECTURE.md)
- 리팩터링 계획: [작업 지시서 Phase 2](requests/BACKEND_LLM_GATEWAY_WORK_ORDER.md#phase-2)

### 테스트 관련
- 타임아웃 분석: [2025-11-15 분석 보고서](reports/2025-11-15_TEST_TIMEOUT_ANALYSIS.md)
- A팀 규정: [A팀 규정집](guides/A팀_REGULATIONS.md)

---

## 📊 문서 상태 대시보드

### 승인 완료 (Approved)
- ✅ ARCH-001: System Overview
- ✅ ARCH-002: Gateway Pattern
- ✅ ARCH-003: Agent Architecture
- ✅ SPEC-001: LLM Gateway Spec v1.0
- ✅ SPEC-002: Media Gateway Spec v1.0
- ✅ DEC-001: Why Gateway Pattern
- ✅ DEC-002: Ollama First Strategy

### 작업 중 (In Progress)
- 📝 PLAN-001: LLM Gateway Plan (B팀 대기)
- 📝 CURRENT_PHASE.md (매일 업데이트)

### 검토 대기 (Review)
- 🔍 없음

---

## 📖 문서 작성 규칙

모든 문서는 다음 규칙을 따릅니다:

### 1. 파일 명명 규칙
- **날짜 기반**: `YYYY-MM-DD_일련번호_제목.md`
  - 예: `2025-11-16_001_WHY_GATEWAY.md`
- **버전 기반**: `제목_vX.Y.md`
  - 예: `LLM_GATEWAY_SPEC_v1.0.md`
- **현재 상태**: `CURRENT_*.md`
  - 예: `CURRENT_PHASE.md`

### 2. 문서 헤더 필수 항목
```yaml
---
doc_id: ARCH-001
title: 문서 제목
created: 2025-11-16
updated: 2025-11-16
status: approved | review | draft | deprecated
authors: A팀 (Claude + QA)
related:
  - SPEC-001
  - DEC-001
---
```

### 3. 필수 섹션
1. **TL;DR** (30초 요약)
2. **목차** (5개 이상 섹션 시)
3. **본문**
4. **관련 문서** (하단)

자세한 규칙: [문서 작성 규정](guides/DOCUMENT_STANDARDS.md)

---

## 🔗 외부 참조

### Obsidian 개인 메모
- `K:\obsidian-k\Sparklio_ai_marketing_studio\`
- ⚠️ 개인 메모는 공식 문서가 아닙니다
- 공식화 필요 시 이 문서 체계로 이관하세요

### 레거시 문서
- `docs/legacy/` 폴더에 보관
- 새 팀원은 읽을 필요 없음

---

## ❓ FAQ

**Q: 어떤 문서부터 읽어야 하나요?**
A: 역할에 따라 "빠른 시작" 섹션 참고

**Q: 문서가 너무 많아요**
A: `CURRENT_PHASE.md` 하나만 보세요. 거기서 필요한 문서만 링크됩니다.

**Q: 문서를 새로 만들어야 하는데요?**
A: [문서 작성 규정](guides/DOCUMENT_STANDARDS.md) 참고

**Q: 이 체계는 누가 관리하나요?**
A: A팀 (Claude + QA)이 매일 업데이트합니다.

---

**마지막 업데이트**: 2025-11-16 16:30 by Claude (A팀)
**다음 업데이트 예정**: 2025-11-16 18:30 (B팀 체크인 후)
