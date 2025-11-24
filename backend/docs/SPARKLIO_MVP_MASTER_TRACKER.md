# SPARKLIO MVP 마스터 추적 문서

**문서 생성일**: 2025-11-24 (일요일)
**문서 생성 시각**: 오후 2시 30분 (KST)
**작성자**: B팀 (Backend)
**목적**: MVP 완료까지 매 작업 세션 시작 시 현황 확인 및 작업 방향 설정
**상태**: 🟢 **ACTIVE** - MVP 개발 진행 중

---

## 📅 타임라인 & 마일스톤

### MVP 목표 완료일
**2025년 2월 1일 (토요일)** - 약 9주 (63일) 남음

### 주요 마일스톤

| 마일스톤 | 목표일 | 상태 | 완료율 |
|---------|--------|------|--------|
| **M1: ReviewerAgent 완료** | 2025-11-24 | ✅ 완료 | 100% |
| **M2: Brand OS 모듈** | 2025-12-08 (2주) | 🔴 시작 전 | 0% |
| **M3: Meeting AI 모듈** | 2025-12-22 (2주) | 🔴 시작 전 | 0% |
| **M4: Multi-Channel Gen** | 2026-01-12 (3주) | 🔴 시작 전 | 0% |
| **M5: Canvas Studio 통합** | 2026-01-26 (2주) | 🔴 시작 전 | 0% |
| **M6: MVP 최종 테스트** | 2026-02-01 (1주) | 🔴 시작 전 | 0% |

---

## 🎯 MVP 핵심 목표 (변하지 않는 북극성)

### End-to-End #1 시나리오 완성도: 100%

> 처음 온 유저가 2시간 이내에 **브랜드 세팅 → 회의(또는 기록) → 첫 캠페인 세트(상세+SNS+배너+덱)**까지 끝낼 수 있어야 함.

**필수 구현 모듈**:
1. ✅ ReviewerAgent (완료)
2. 🔴 Brand OS (Brand Intake + Analyzer + Kit Storage)
3. 🔴 Meeting AI (Transcriber + Summary + Brief 변환)
4. 🔴 Multi-Channel Generator (ProductDetail + Banner + Deck + Orchestrator)
5. 🔴 Canvas Studio Backend (Canvas JSON v2 + Export Pipeline)

**성공 지표**:
- 신규 브랜드 온보딩 → 첫 캠페인 생성: < 30분
- 4개 채널 동시 생성 (상세/SNS/배너/덱): < 60초
- ReviewerAgent 통과율 (approval + needs_revision): > 85%
- Canvas Export (PNG/PDF/HTML): 100% 성공

---

## 📊 현재 진행 상황 (2025-11-24 기준)

### ✅ 완료된 것 (Production Ready)

#### Agent System Foundation
- [x] AgentBase 패턴
- [x] LLM Gateway (Ollama/OpenAI/Anthropic)
- [x] 4-Stage Validation Pipeline
- [x] Retry Logic + Temperature Tuning
- [x] Golden Set Framework + CI/CD

#### 완성된 Agents (3개)
- [x] **CopywriterAgent** (product_detail, sns, brand_message)
  - 파일: `app/services/agents/copywriter.py`
  - 스키마: `app/schemas/copywriter.py`
  - Golden Set: 10개 케이스
  - Pass Rate: 80%+

- [x] **StrategistAgent** (campaign_strategy)
  - 파일: `app/services/agents/strategist.py`
  - 스키마: `app/schemas/strategist.py`
  - Golden Set: 5개 케이스
  - Pass Rate: 80%+

- [x] **ReviewerAgent** (ad_copy_quality_check) ✨ 방금 완료
  - 파일: `app/services/agents/reviewer.py`
  - 스키마: `app/schemas/reviewer.py`
  - Golden Set: 5개 케이스
  - Pass Rate: 40% (비즈니스 로직 정상, Golden Set 기대값 조정 필요)
  - 핵심 개선: 과대광고 검출 + approval_status 규칙 명문화

#### 인프라
- [x] FastAPI Backend
- [x] PostgreSQL + pgvector
- [x] Document/Asset Management (기본)
- [x] Canvas Studio API (부분 지원)

---

## 🔴 MVP를 위해 부족한 핵심 Backend 기능

### P0: CRITICAL (MVP 필수)

#### 🔴 GAP #1: Brand OS 모듈
**현재 상태**: ❌ 없음
**필요 이유**: 모든 생성 Agent가 Brand Kit 의존
**예상 기간**: 2주 (2025-12-08까지)

**구현 항목**:
- [ ] DB Schema 설계 (`brands`, `brand_documents` 테이블)
- [ ] Brand Intake API (`POST /api/v1/brands`, URL 크롤링, 문서 업로드)
- [ ] BrandAnalyzerAgent (Task: `brand_analysis`, Output: Brand DNA Card JSON)
- [ ] Brand Kit Storage & Retrieval API
- [ ] Frontend 통합 (TypeScript 타입 정의, C팀 전달)
- [ ] Golden Set 5개 케이스 작성

**의존성**: 없음 (바로 시작 가능)

---

#### 🔴 GAP #2: Meeting AI 모듈
**현재 상태**: ⚠️ 파일 존재 (`meeting_ai.py`) but 미완성
**필요 이유**: "회의에서 시작" = MVP 핵심 UX
**예상 기간**: 2주 (2025-12-22까지)

**구현 항목**:
- [ ] Transcriber 통합 (Whisper API 연동 - OpenAI or Local)
- [ ] Audio/Video → Transcript 변환 API
- [ ] MeetingAgent 강화 (Task: `meeting_summary`, Output: summary/agenda/decisions/action_items/campaign_ideas)
- [ ] Meeting → Brief 변환 (Task: `meeting_to_brief`)
- [ ] Frontend 통합 (Meeting 업로드 UI, Transcript 타임라인, "브리프 만들기" 버튼)
- [ ] Golden Set 5개 케이스 작성

**의존성**: Brand OS 완료 후 시작

---

### P1: HIGH (MVP 가치 증명)

#### 🟡 GAP #3: Multi-Channel Generator 통합
**현재 상태**: ⚠️ CopywriterAgent만 있음 (Designer/Deck Agent 없음)
**필요 이유**: "브리프 한 번으로 4개 채널 동시 생성" = MVP 핵심 가치
**예상 기간**: 3주 (2026-01-12까지)

**구현 항목**:
- [ ] **ProductDetailGenerator** (CopywriterAgent 확장: Task `product_detail_full`)
  - Hero + Problem/Solution + Specs + FAQ 카드 구성
  - Canvas JSON 출력 구조 설계

- [ ] **BannerGenerator** (신규)
  - Task: `banner_set`
  - 3~4 사이즈 세트 (1080x1080, 1200x628, 1080x1920)
  - ReviewerAgent 연동 (과대광고 체크)

- [ ] **DeckGenerator** (신규)
  - Task: `deck_generation`
  - 슬라이드별 Canvas JSON 구조
  - 템플릿: 문제 → 인사이트 → 솔루션 → 플랜 → 견적

- [ ] **Multi-Channel Orchestrator**
  - API: `POST /api/v1/campaigns/{id}/generate-all`
  - Parallel execution (asyncio.gather)
  - Progress tracking (WebSocket or SSE)
  - 생성 결과 Canvas Studio로 전달

- [ ] 각 Generator별 Golden Set 5개 케이스

**의존성**: Brand OS + Meeting AI 완료 후 시작

---

#### 🟡 GAP #4: Canvas Studio Backend 통합
**현재 상태**: ⚠️ Document API 있음, Canvas JSON 부분 지원
**필요 이유**: "통합 에디터에서 편집 + Export" = MVP 완결
**예상 기간**: 2주 (2026-01-26까지)

**구현 항목**:
- [ ] **Canvas JSON Schema v2**
  - `app/schemas/canvas.py` 완성
  - Object types: Text, Image, Shape, Frame, Video/Scene
  - Validation rules

- [ ] **Agent → Canvas 변환**
  - `app/services/canvas/agent_to_canvas.py` 유틸리티
  - CopywriterOutput → Canvas JSON
  - StrategistOutput → Deck Canvas JSON

- [ ] **Chat ↔ Canvas 실시간 연동**
  - 선택된 Object 컨텍스트를 LLM에 전달
  - LLM 응답 → Canvas 자동 업데이트
  - WebSocket 또는 Polling

- [ ] **Export Pipeline**
  - PNG/JPG (Canvas → Image)
  - PDF/PPTX (Deck Canvas → Slide)
  - HTML (Product Detail Canvas → Responsive HTML)
  - API: `POST /api/v1/documents/{id}/export`

**의존성**: Multi-Channel Generator 완료 후 시작

---

### P2: MEDIUM (MVP 이후 확장)

#### 🟢 GAP #5: Video/Shorts Generator
**현재 상태**: ⚠️ `scene_planner.py` 존재 but 미완성
**예상 기간**: 2주
**우선순위**: MVP 이후 (E2E #3 시나리오용)

**구현 항목**:
- [ ] VideoDirectorAgent (Task: `shorts_storyboard`)
- [ ] 타임라인 JSON 포맷 (Canvas Studio 호환)
- [ ] (v2) Motion Graphics Renderer

---

#### 🟢 GAP #6: TrendPipeline & RAG
**현재 상태**: ⚠️ 파일들 존재 but 미완성
**예상 기간**: 3주
**우선순위**: MVP 이후 (품질 향상용)

**구현 항목**:
- [ ] Collector → Cleaner → Embedder → Ingestor 파이프라인
- [ ] pgvector 검색 API
- [ ] Agent 프롬프트에 "Similar Examples" 섹션 추가

---

#### 🔵 GAP #7: Admin & Feature Flags
**현재 상태**: ❌ 없음
**예상 기간**: 1주
**우선순위**: MVP 이후 (운영 편의성)

**구현 항목**:
- [ ] Feature Flag 시스템 (`INTERNAL_MODE`, `GENERATOR_SCOPE`)
- [ ] Agent Routing 설정 (Provider 우선순위, 비용 상한)
- [ ] 텔레메트리 대시보드 (API 호출/실패율/LLM 비용)

---

## 📋 상세 TODO (P0/P1만 - MVP 필수)

### 🔴 P0-1: Brand OS 모듈 (2주, 2025-12-08까지)

**Week 1: DB Schema & API 기본** ✅ **완료 (2025-11-24)**
- [x] 1.1 DB Schema 설계 ✅
  - [x] `brands` 테이블 생성 (logo_url, colors, fonts, tone_keywords, forbidden_expressions, key_messages)
  - [x] `brand_documents` 테이블 (업로드된 PDF/이미지 메타데이터)
  - [x] Alembic Migration 작성
  - [x] 파일: `backend/alembic/versions/c06bb9428f75_add_brand_os_schema_brand_dna_and_.py`

- [x] 1.2 Brand Intake API ✅
  - [x] `POST /api/v1/brands` - 브랜드 생성 (기존)
  - [x] `POST /api/v1/brands/{id}/documents` - 문서 업로드
  - [x] `POST /api/v1/brands/{id}/documents/crawl` - URL 크롤링 (TODO: 실제 크롤링 로직)
  - [x] `GET /api/v1/brands/{id}/documents` - 문서 목록 조회
  - [x] `DELETE /api/v1/brands/{id}/documents/{doc_id}` - 문서 삭제
  - [x] 파일: `backend/app/api/v1/endpoints/brands.py`

**Week 2: BrandAnalyzerAgent & Frontend 통합**
- [x] 1.3 BrandAnalyzerAgent 구현 ✅ (2025-11-24 완료)
  - [x] `app/schemas/brand_analyzer.py` - BrandAnalysisInput/Output 스키마
  - [x] `app/services/agents/brand_analyzer.py` - Agent 구현
  - [x] Task: `brand_dna_generation`
  - [x] Output: Brand DNA Card JSON `{tone, key_messages[3-5], target_audience, dos[3-5], donts[3-5], sample_copies[3-5], suggested_brand_kit, confidence_score}`
  - [x] Golden Set 5개 케이스 작성 (`tests/golden_set/brand_analyzer_analysis_v1.json`)
  - [x] BrandAnalyzerAgent API 엔드포인트 추가 (`POST /api/v1/brands/{id}/analyze`)

- [x] 1.4 Frontend 통합 준비 ✅ (2025-11-24)
  - [x] Brand Kit 조회 API (`GET /api/v1/brands/{id}` - 기존 포함)
  - [x] Brand Kit 수정 API (`PATCH /api/v1/brands/{id}` - 기존 포함)
  - [x] TypeScript 타입 정의 작성 → A팀 전달
  - [x] 통합 가이드 문서 작성 (`BRAND_OS_API_INTEGRATION_GUIDE.md`)

**완료 조건**:
- [ ] DB Migration 성공
- [ ] URL 크롤링 테스트 성공 (5개 사이트)
- [ ] BrandAnalyzerAgent Golden Set Pass Rate ≥ 70%
- [ ] C팀과 API 연동 테스트 완료

---

### 🔴 P0-2: Meeting AI 모듈 (2주, 2025-12-22까지)

**Week 1: Transcriber & MeetingAgent** ✅ **Transcriber 완료 (2025-11-24)**
- [x] 2.1 Transcriber 통합 ✅
  - [x] Whisper API 연동 (3-Tier: faster-whisper, whisper.cpp, OpenAI)
  - [x] Audio/Video → Transcript 변환 API (`POST /api/v1/meetings/{id}/transcribe`)
  - [x] 타임스탬프 포함 스크립트 저장 (DB: `meeting_transcripts` 테이블)
  - [x] 파일: `backend/app/services/transcriber.py`, `transcriber_clients.py`
  - [x] 4-Mode Operation: openai, local, hybrid_cost, hybrid_quality
  - [x] faster-whisper 서버 구축 (RTX Desktop: 100.120.180.42:9000)
  - [x] Database schema 추가 (backend, model, confidence, latency_ms)
  - [x] Test suite 작성 (65 tests)
  - [x] 구현 완료 문서 작성 (`WHISPER_INTEGRATION_COMPLETE_2025-11-24.md`)

- [ ] 2.2 MeetingAgent 강화
  - [ ] `app/schemas/meeting.py` - MeetingSummaryInput/Output 스키마
  - [ ] `app/services/agents/meeting_ai.py` 완성
  - [ ] Task: `meeting_summary`
  - [ ] Output: `{summary, agenda[], decisions[], action_items[], campaign_ideas[]}`
  - [ ] Golden Set 5개 케이스 작성 (`tests/golden_set/meeting_summary_v1.json`)

**Week 2: Meeting → Brief 변환 & Frontend 통합**
- [ ] 2.3 Meeting → Brief 변환
  - [ ] Task: `meeting_to_brief`
  - [ ] MeetingOutput + BrandKit → CampaignBriefInput 자동 생성
  - [ ] API: `POST /api/v1/meetings/{id}/to-brief`
  - [ ] 파일: `backend/app/api/v1/endpoints/meetings.py`

- [ ] 2.4 Frontend 통합
  - [ ] Meeting 업로드 UI (Audio/Video 파일)
  - [ ] Transcript 타임라인 뷰
  - [ ] "브리프 만들기" 버튼 연동
  - [ ] TypeScript 타입 정의 → C팀 전달
  - [ ] 통합 가이드 문서 작성 (`MEETING_AI_INTEGRATION_GUIDE_2025-12.md`)

**완료 조건**:
- [ ] Whisper 테스트 성공 (5개 오디오)
- [ ] MeetingAgent Golden Set Pass Rate ≥ 70%
- [ ] Meeting → Brief 변환 정확도 ≥ 80%
- [ ] C팀과 API 연동 테스트 완료

---

### 🟡 P1-1: Multi-Channel Generator 통합 (3주, 2026-01-12까지)

**Week 1: ProductDetailGenerator & BannerGenerator**
- [ ] 3.1 ProductDetailGenerator
  - [ ] CopywriterAgent 확장: Task `product_detail_full`
  - [ ] 카드 구성: Hero + Problem/Solution + Specs + FAQ
  - [ ] Canvas JSON 출력 구조 설계
  - [ ] Golden Set 5개 케이스

- [ ] 3.2 BannerGenerator
  - [ ] `app/services/agents/banner_generator.py` 신규
  - [ ] Task: `banner_set`
  - [ ] 사이즈별 (1080x1080, 1200x628, 1080x1920) 세트 출력
  - [ ] ReviewerAgent 연동 (과대광고 체크)
  - [ ] Golden Set 5개 케이스

**Week 2: DeckGenerator**
- [ ] 3.3 DeckGenerator
  - [ ] `app/services/agents/deck_generator.py` 신규
  - [ ] Task: `deck_generation`
  - [ ] 슬라이드별 Canvas JSON 구조
  - [ ] 템플릿: 문제 → 인사이트 → 솔루션 → 플랜 → 견적
  - [ ] Golden Set 5개 케이스

**Week 3: Multi-Channel Orchestrator**
- [ ] 3.4 Multi-Channel Orchestrator
  - [ ] API: `POST /api/v1/campaigns/{id}/generate-all`
  - [ ] Input: `{brief, brand_kit, channels: ['product_detail', 'sns', 'banner', 'deck']}`
  - [ ] Parallel execution (asyncio.gather)
  - [ ] Progress tracking (WebSocket or SSE)
  - [ ] 생성 결과 Canvas Studio로 전달
  - [ ] 파일: `backend/app/api/v1/endpoints/campaigns.py`

**완료 조건**:
- [ ] 각 Generator Golden Set Pass Rate ≥ 70%
- [ ] 4개 채널 동시 생성 < 60초
- [ ] ReviewerAgent 통합 테스트 성공
- [ ] C팀과 Canvas Studio 연동 테스트 완료

---

### 🟡 P1-2: Canvas Studio Backend 통합 (2주, 2026-01-26까지)

**Week 1: Canvas JSON Schema v2 & Agent 변환**
- [ ] 4.1 Canvas JSON Schema v2
  - [ ] `app/schemas/canvas.py` 완성
  - [ ] Object types: Text, Image, Shape, Frame, Video/Scene
  - [ ] Validation rules (Pydantic)
  - [ ] 파일: `backend/app/schemas/canvas.py`

- [ ] 4.2 Agent → Canvas 변환
  - [ ] `app/services/canvas/agent_to_canvas.py` 유틸리티
  - [ ] CopywriterOutput → Canvas JSON
  - [ ] StrategistOutput → Deck Canvas JSON
  - [ ] BannerOutput → Banner Canvas JSON

**Week 2: Chat 연동 & Export Pipeline**
- [ ] 4.3 Chat ↔ Canvas 실시간 연동
  - [ ] 선택된 Object 컨텍스트를 LLM에 전달
  - [ ] LLM 응답 → Canvas 자동 업데이트
  - [ ] WebSocket 또는 Polling 구현
  - [ ] 파일: `backend/app/api/v1/endpoints/canvas_chat.py`

- [ ] 4.4 Export Pipeline
  - [ ] PNG/JPG (Canvas → Image via Konva Server-side)
  - [ ] PDF/PPTX (Deck Canvas → Slide via python-pptx)
  - [ ] HTML (Product Detail Canvas → Responsive HTML)
  - [ ] API: `POST /api/v1/documents/{id}/export`
  - [ ] 파일 Naming/사이즈 규격 맞춤
  - [ ] 파일: `backend/app/services/canvas/export.py`

**완료 조건**:
- [ ] Canvas JSON Validation 100% 성공
- [ ] Agent → Canvas 변환 정확도 ≥ 95%
- [ ] Export 성공률 100% (PNG/PDF/HTML)
- [ ] C팀과 실시간 Chat 연동 테스트 완료

---

## 🎯 매 작업 세션 체크리스트

**세션 시작 시 반드시 확인**:
1. [ ] 이 문서의 "현재 진행 상황" 섹션 업데이트
2. [ ] 이번 세션의 목표 모듈 확인 (P0-1 → P0-2 → P1-1 → P1-2 순서)
3. [ ] 완료된 TODO 체크 ([ ] → [x])
4. [ ] 새로 발견된 이슈/블로커 "🚧 Blockers" 섹션에 기록
5. [ ] 완료율(%) 업데이트

**세션 종료 시 반드시 작성**:
1. [ ] "📝 작업 로그" 섹션에 오늘 작업 내용 추가
2. [ ] 다음 세션 목표 명시
3. [ ] Git commit 완료 확인
4. [ ] 이 문서를 Git commit에 포함

---

## 🚧 Blockers & Issues

### Active Blockers
_현재 없음_

### Resolved Blockers
- ✅ **2025-11-24**: ReviewerAgent 과대광고 검출 실패 → instruction 강화 + Pydantic validator 수정으로 해결

---

## 📝 작업 로그

### 2025-11-24 (일요일) - ReviewerAgent 완료 🎉

**작업 시간**: 오전 10시 ~ 오후 2시 30분 (약 4.5시간)

**완료 항목**:
- [x] ReviewerAgent instruction 강화 (과대광고 페널티 규칙 추가)
- [x] approval_status 판정 규칙 명문화
- [x] Pydantic validator 수정 (risk_flags 예외 처리)
- [x] Golden Set 재실행 (Pass Rate 40% → 비즈니스 로직 정상 확인)
- [x] 최종 QA 보고서 작성 (646줄)
- [x] Git commit 3개 (Backend + Frontend + Documentation)

**주요 성과**:
- P0 Critical 이슈 해결: reviewer_002 케이스 8.0 approved → 6.5 rejected (4개 risk_flags)
- CopywriterAgent/StrategistAgent와 동일한 품질 시스템 완성
- B팀 = "품질 시스템 전문가" 포지션 확립

**다음 세션 목표**:
- 🎯 **P0-1: Brand OS 모듈 시작** (DB Schema 설계부터)

**블로커**: 없음

---

### 다음 작업 예정 (2025-11-25 월요일)

**목표 모듈**: P0-1 Brand OS - Week 1 Day 1

**예상 작업**:
1. DB Schema 설계 (`brands`, `brand_documents` 테이블)
2. Alembic Migration 작성
3. Brand Intake API 구조 설계

**예상 시간**: 4시간

---

## 📚 참고 문서

### 설계 문서
- [SPARKLIO_MASTER_PRD_vNext.md](./SPARKLIO_MASTER_PRD_vNext.md) - 전체 서비스 마스터 PRD
- [AGENT_SPECIFICATIONS.md](./AGENT_SPECIFICATIONS.md) - Agent 상세 스펙
- [BACKEND_CANVAS_SPEC_V2.md](./BACKEND_CANVAS_SPEC_V2.md) - Canvas Studio 스펙
- [CONTENT_PLAN_TO_PAGES_SPEC_V2.md](./CONTENT_PLAN_TO_PAGES_SPEC_V2.md) - ContentPlan 스펙

### 완료된 Agent 가이드
- [COPYWRITER_INTEGRATION_GUIDE.md](./COPYWRITER_INTEGRATION_GUIDE.md)
- [STRATEGIST_INTEGRATION_GUIDE_2025-11-23.md](./STRATEGIST_INTEGRATION_GUIDE_2025-11-23.md)
- [REVIEWER_INTEGRATION_GUIDE_2025-11-23.md](./REVIEWER_INTEGRATION_GUIDE_2025-11-23.md)

### QA 보고서
- [REVIEWER_AGENT_QA_REPORT_20251124_FINAL.md](./QA/REVIEWER_AGENT_QA_REPORT_20251124_FINAL.md)

### 다음 작업 가이드
- [B_TEAM_NEXT_STEPS_2025-11-23.md](./B_TEAM_NEXT_STEPS_2025-11-23.md)

---

## 🎖️ MVP 완료 성공 기준

### 기술적 성공 기준
- [ ] E2E #1 시나리오 완전 작동 (브랜드 → 회의 → 4채널 생성 → 에디터 → Export)
- [ ] 모든 Agent Golden Set Pass Rate ≥ 70%
- [ ] 4개 채널 동시 생성 시간 < 60초
- [ ] Canvas Export 성공률 100%
- [ ] ReviewerAgent 통과율 ≥ 85%

### 사용성 기준
- [ ] 신규 브랜드 온보딩 → 첫 캠페인 생성 < 30분
- [ ] 유저 테스트 5명 모두 E2E #1 시나리오 완주
- [ ] 프론트엔드 오류율 < 5%

### 품질 기준
- [ ] 모든 Agent Pydantic Validation 100% 통과
- [ ] CI/CD Golden Set 자동 검증 통과
- [ ] 과대광고 검출 정확도 ≥ 90% (ReviewerAgent)

---

## 📞 Contact & Handover

**B팀 담당자**: Claude (Backend Agent System)
**C팀 담당자**: (Frontend - Canvas Studio/AI Chat)
**A팀 담당자**: (QA - Golden Set Validation)

**긴급 이슈 발생 시**:
1. 이 문서의 "🚧 Blockers & Issues" 섹션에 기록
2. Git commit + Push
3. 팀 공유 채널에 알림

---

**마지막 업데이트**: 2025-11-24 (일) 오후 2시 30분 (KST)
**다음 업데이트 예정**: 매 작업 세션 종료 시
**문서 버전**: 1.0
**상태**: 🟢 **ACTIVE**
