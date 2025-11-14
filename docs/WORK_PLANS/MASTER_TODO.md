# Sparklio AI Marketing Studio - Master TODO

**최초 작성**: 2025-11-14 (금요일) 16:30
**최종 수정**: 2025-11-14 (금요일) 17:15
**프로젝트 기간**: 2025-11-14 ~ 2026-02-11 (90일)
**전체 진행률**: 16% (6/37 작업 완료)

---

## 📊 전체 현황 (대시보드)

### 팀별 진행 상황

| 팀 | 완료 | 진행중 | 대기 | 전체 | 진행률 |
|----|------|--------|------|------|--------|
| **Team A (Docs)** | 6 | 0 | 7 | 13 | 46% |
| **Team B (Backend)** | 0 | 0 | 13 | 13 | 0% |
| **Team C (Frontend)** | 0 | 0 | 14 | 14 | 0% |
| **전체** | 6 | 0 | 34 | 40 | 15% |

### 우선순위별 현황

| 우선순위 | 완료 | 진행중 | 대기 | 전체 |
|----------|------|--------|------|------|
| **P0 (긴급)** | 3 | 0 | 3 | 6 |
| **P1 (중요)** | 3 | 0 | 16 | 19 |
| **P2 (일반)** | 0 | 0 | 15 | 15 |

---

## 🎯 P0 (긴급 - 1주 이내)

### Team A (Docs & Architecture)

#### [P0-A1] Model Catalog 통일 ✅
- **담당**: Team A
- **상태**: ✅ 완료 (2025-11-14 17:10)
- **실제 소요**: 0.5시간
- **설명**: `Sparklio_V4_PRD_Final.md` + `LLM_ROUTER_POLICY.md` 동기화 완료
- **산출물**:
  - ✅ `docs/PRD/Sparklio_V4_PRD_Final.md` (업데이트)
  - ✅ `docs/PHASE0/LLM_ROUTER_POLICY.md` (업데이트)
  - ComfyUI 설명 강화 (LoRA + ControlNet + IPAdapter)
  - AnimateDiff 역할 명확화 (ComfyUI 통합 로컬 파이프라인)

#### [P0-A2] Agent 목록 통일 ✅
- **담당**: Team A
- **상태**: ✅ 완료 (2025-11-14 17:10)
- **실제 소요**: 0.5시간
- **설명**: PRD에 24개 에이전트 전체 목록 반영 완료
- **산출물**:
  - ✅ `docs/PRD/Sparklio_V4_PRD_Final.md` Section 7.2 업데이트
  - Creation Agents 9개 / Intelligence Agents 11개 / System Agents 4개

#### [P0-A3] PPC Ads 섹션 기존 PRD 반영 ✅
- **담당**: Team A
- **상태**: ✅ 완료 (2025-11-14 17:10)
- **실제 소요**: 0.2시간 (확인)
- **설명**: 이미 PRD Section 8.1에 상세 작성 완료 확인
- **산출물**:
  - ✅ `docs/PRD/Sparklio_V4_PRD_Final.md` Section 8.1 (기존 완료)

---

### Team B (Backend)

#### [P0-B1] Smart LLM Router 구현
- **담당**: Team B
- **상태**: 🔴 대기 (Team A의 P0-A1 완료 후 시작)
- **예상 소요**: 12시간 (3일)
- **목표일**: 2025-11-20
- **의존성**: [P0-A1] Model Catalog 통일 완료
- **설명**: 5가지 프리셋 모드, 비용 최적화, 예산 제어
- **산출물**:
  - `src/router/smart-llm-router.ts`
  - `src/router/model-catalog.ts`
  - `src/router/cost-estimator.ts`
  - API: `/api/llm/route`, `/api/llm/models`, `/api/llm/cost/estimate`
- **테스트**:
  - `tests/router/smart-llm-router.test.ts`

#### [P0-B2] Agent Base Class & A2A Protocol
- **담당**: Team B
- **상태**: 🔴 대기 (Team A의 P0-A2 완료 후 시작)
- **예상 소요**: 10시간 (2.5일)
- **목표일**: 2025-11-21
- **의존성**: [P0-A2] Agent 목록 통일 완료
- **설명**: BaseAgent 클래스, A2A Message Format, Agent Registry
- **산출물**:
  - `src/agents/base-agent.ts`
  - `src/agents/a2a-protocol.ts`
  - `src/agents/agent-registry.ts`
- **테스트**:
  - `tests/agents/base-agent.test.ts`

---

### Team C (Frontend)

#### [P0-C1] Next.js 프로젝트 셋업
- **담당**: Team C
- **상태**: 🔴 대기
- **예상 소요**: 4시간 (1일)
- **목표일**: 2025-11-15
- **설명**: Next.js 14, TypeScript, Tailwind CSS 환경 구축
- **산출물**:
  - `package.json`
  - `tsconfig.json`
  - `tailwind.config.ts`
  - `src/app/`

---

## 🔥 P1 (중요 - 2주 이내)

### Team A (Docs)

#### [P1-A1] VIDEO_PIPELINE_SPEC.md 작성 ✅
- **담당**: Team A
- **상태**: ✅ 완료 (2025-11-14 17:00)
- **실제 소요**: 0.5시간
- **설명**: 광고영상 E2E 파이프라인 전체 명세 작성 완료
- **산출물**:
  - ✅ `docs/PHASE0/VIDEO_PIPELINE_SPEC.md` (신규 생성)
  - Mac mini → Desktop GPU 통신 구조
  - Qwen + AnimateDiff + ComfyUI 통합
  - 4개 API 엔드포인트 상세 설계

#### [P1-A2] COMFYUI_INTEGRATION.md 작성 ✅
- **담당**: Team A
- **상태**: ✅ 완료 (2025-11-14 17:00)
- **실제 소요**: 0.5시간
- **설명**: ComfyUI 통합 가이드 작성 완료
- **산출물**:
  - ✅ `docs/PHASE0/COMFYUI_INTEGRATION.md` (신규 생성)
  - ComfyUI 서버 설정 가이드
  - Workflow 템플릿 (광고 이미지, 모션 클립)
  - Brand LoRA 학습 및 적용 파이프라인
  - Python API 클라이언트 구현

#### [P1-A3] MEETING_AI_SPEC.md 작성 ✅
- **담당**: Team A
- **상태**: ✅ 완료 (2025-11-14 17:15)
- **실제 소요**: 0.5시간
- **설명**: 회의 AI 전체 명세 작성 완료
- **산출물**:
  - ✅ `docs/PHASE0/MEETING_AI_SPEC.md` (신규 생성)
  - 회의 음성 → 산출물 자동 생성 파이프라인
  - Whisper STT (Desktop GPU)
  - Meeting Intelligence Agent (MIA) 상세 설계
  - SmartRouter 통합 (8가지 산출물)
  - 7단계 UI/UX 플로우

#### [P1-A4] ONE_PAGE_EDITOR_SPEC.md Section 9.2 확장
- **담당**: Team A
- **상태**: 🔴 대기
- **예상 소요**: 2시간
- **목표일**: 2025-11-28
- **산출물**: `docs/PHASE0/ONE_PAGE_EDITOR_SPEC.md` 업데이트

---

### Team B (Backend)

#### [P1-B1] API Contract 작성 (agents.json)
- **담당**: Team B
- **상태**: 🔴 대기
- **예상 소요**: 2시간
- **목표일**: 2025-11-22
- **산출물**: `docs/API_CONTRACTS/agents.json`

#### [P1-B2] 9개 Creation Agents 구현
- **담당**: Team B
- **상태**: 🔴 대기 (P0-B2 완료 후)
- **예상 소요**: 30시간 (7.5일)
- **목표일**: 2025-12-05
- **의존성**: [P0-B2] Agent Base Class 완료
- **산출물**:
  - StrategistAgent, CopywriterAgent, VisionGeneratorAgent, VisionAnalyzerAgent
  - ScenePlannerAgent, StoryboardBuilderAgent, VideoDirectorAgent, VideoReviewerAgent, TemplateAgent

#### [P1-B3] API Contract 작성 (video_pipeline.json, comfyui.json)
- **담당**: Team B
- **상태**: 🔴 대기
- **예상 소요**: 3시간
- **목표일**: 2025-12-06
- **의존성**: [P1-A1, P1-A2] 스펙 문서 완료
- **산출물**:
  - `docs/API_CONTRACTS/video_pipeline.json`
  - `docs/API_CONTRACTS/comfyui.json`

#### [P1-B4] Video Pipeline 구현
- **담당**: Team B
- **상태**: 🔴 대기
- **예상 소요**: 20시간 (5일)
- **목표일**: 2025-12-15
- **의존성**: [P1-A1, P1-B3] 완료
- **산출물**:
  - `src/video/veo3-connector.ts`
  - `src/video/animatediff-connector.ts`
  - `src/video/ffmpeg-processor.ts`

#### [P1-B5] ComfyUI Integration
- **담당**: Team B
- **상태**: 🔴 대기
- **예상 소요**: 15시간 (4일)
- **목표일**: 2025-12-18
- **의존성**: [P1-A2, P1-B3] 완료
- **산출물**:
  - `src/image/comfyui-connector.ts`
  - `src/image/workflow-manager.ts`

#### [P1-B6] 11개 Intelligence Agents 구현
- **담당**: Team B
- **상태**: 🔴 대기
- **예상 소요**: 25시간 (6일)
- **목표일**: 2025-12-25
- **산출물**:
  - TrendCollectorAgent, DataCleanerAgent, EmbedderAgent, IngestorAgent, ReviewerAgent
  - PerformanceAnalyzerAgent, SelfLearningAgent, BrandModelUpdaterAgent, RAGAgent, TrendAgent, DataCollectorAgent

---

### Team C (Frontend)

#### [P1-C1] Editor Shell & Layout
- **담당**: Team C
- **상태**: 🔴 대기 (P0-C1 완료 후)
- **예상 소요**: 8시간 (2일)
- **목표일**: 2025-11-18
- **산출물**:
  - `src/components/layout/Header.tsx`
  - `src/components/layout/Sidebar.tsx`

#### [P1-C2] Chat Interface
- **담당**: Team C
- **상태**: 🔴 대기
- **예상 소요**: 10시간 (2.5일)
- **목표일**: 2025-11-21
- **산출물**:
  - `src/components/chat/ChatInterface.tsx`
  - `src/mocks/chat.mock.ts`

#### [P1-C3] Text Editor
- **담당**: Team C
- **상태**: 🔴 대기
- **예상 소요**: 12시간 (3일)
- **목표일**: 2025-11-27
- **산출물**:
  - `src/components/editor/TextEditor.tsx`

#### [P1-C4] Image Editor
- **담당**: Team C
- **상태**: 🔴 대기
- **예상 소요**: 15시간 (4일)
- **목표일**: 2025-12-03
- **산출물**:
  - `src/components/editor/ImageEditor.tsx`

#### [P1-C5] Review Buffer Pattern UI
- **담당**: Team C
- **상태**: 🔴 대기
- **예상 소요**: 8시간 (2일)
- **목표일**: 2025-12-05
- **산출물**:
  - `src/components/review/ReviewBuffer.tsx`

#### [P1-C6] Video Studio Editor
- **담당**: Team C
- **상태**: 🔴 대기
- **예상 소요**: 20시간 (5일)
- **목표일**: 2025-12-18
- **의존성**: [P1-A4] 스펙 문서 완료
- **산출물**:
  - `src/components/video/VideoStudio.tsx`
  - `src/components/video/Timeline.tsx`

#### [P1-C7] Meeting AI UI
- **담당**: Team C
- **상태**: 🔴 대기
- **예상 소요**: 12시간 (3일)
- **목표일**: 2025-12-23
- **의존성**: [P1-A3] 스펙 문서 완료
- **산출물**:
  - `src/components/meeting/MeetingRecorder.tsx`

---

## ⚙️ P2 (일반 - 4주 이내)

### Team A (Docs)

#### [P2-A1] BRAND_LEARNING_ENGINE.md 재학습 트리거 추가
- **담당**: Team A
- **상태**: 🔴 대기
- **예상 소요**: 2시간
- **목표일**: 2025-12-10
- **산출물**: `docs/PHASE0/BRAND_LEARNING_ENGINE.md` 업데이트

#### [P2-A2] TECH_DECISION_v1.md Multi-Node 상세화
- **담당**: Team A
- **상태**: 🔴 대기
- **예상 소요**: 3시간
- **목표일**: 2025-12-12
- **산출물**: `docs/PHASE0/TECH_DECISION_v1.md` 업데이트

#### [P2-A3] LLM_ROUTER_POLICY.md 비용 추적 로직 확장
- **담당**: Team A
- **상태**: 🔴 대기
- **예상 소요**: 2시간
- **목표일**: 2025-12-15
- **산출물**: `docs/PHASE0/LLM_ROUTER_POLICY.md` Section 7.5 추가

---

### Team B (Backend)

#### [P2-B1] PPC Ads API 구현
- **담당**: Team B
- **상태**: 🔴 대기
- **예상 소요**: 20시간 (5일)
- **목표일**: 2026-01-10
- **산출물**:
  - `src/ppc/google-ads-connector.ts`
  - `src/ppc/naver-ads-connector.ts`
  - `src/ppc/kakao-ads-connector.ts`

#### [P2-B2] Brand Learning Loop 구현
- **담당**: Team B
- **상태**: 🔴 대기
- **예상 소요**: 18시간 (4.5일)
- **목표일**: 2026-01-17
- **산출물**:
  - `src/learning/self-learning-loop.ts`

#### [P2-B3] 4개 System Agents 구현
- **담당**: Team B
- **상태**: 🔴 대기
- **예상 소요**: 10시간 (2.5일)
- **목표일**: 2026-01-20
- **산출물**:
  - PMAgent, SecurityAgent, BudgetAgent, ADAgent

#### [P2-B4] Multi-Node Orchestration 구현
- **담당**: Team B
- **상태**: 🔴 대기
- **예상 소요**: 12시간 (3일)
- **목표일**: 2026-01-25
- **산출물**:
  - `src/orchestration/node-router.ts`

#### [P2-B5] 성능 최적화 & 버그 수정
- **담당**: Team B
- **상태**: 🔴 대기
- **예상 소요**: 15시간 (4일)
- **목표일**: 2026-02-05
- **설명**: API 응답 최적화, 메모리 누수 수정

---

### Team C (Frontend)

#### [P2-C1] PPC Ads Publishing UI
- **담당**: Team C
- **상태**: 🔴 대기
- **예상 소요**: 15시간 (4일)
- **목표일**: 2026-01-15
- **산출물**:
  - `src/components/ppc/CampaignForm.tsx`

#### [P2-C2] Dashboard & Analytics
- **담당**: Team C
- **상태**: 🔴 대기
- **예상 소요**: 10시간 (2.5일)
- **목표일**: 2026-01-20
- **산출물**:
  - `src/components/dashboard/Dashboard.tsx`

#### [P2-C3] Cost Alert & Budget Control UI
- **담당**: Team C
- **상태**: 🔴 대기
- **예상 소요**: 8시간 (2일)
- **목표일**: 2026-01-23
- **산출물**:
  - `src/components/cost/CostAlertModal.tsx`

#### [P2-C4] UI/UX 폴리싱
- **담당**: Team C
- **상태**: 🔴 대기
- **예상 소요**: 12시간 (3일)
- **목표일**: 2026-02-03
- **설명**: 애니메이션, 로딩, 에러 상태 UI

#### [P2-C5] 온보딩 플로우
- **담당**: Team C
- **상태**: 🔴 대기
- **예상 소요**: 8시간 (2일)
- **목표일**: 2026-02-06
- **산출물**: 초기 설정 마법사, 튜토리얼

#### [P2-C6] 반응형 & 접근성
- **담당**: Team C
- **상태**: 🔴 대기
- **예상 소요**: 10시간 (2.5일)
- **목표일**: 2026-02-09
- **설명**: 모바일/태블릿 최적화, ARIA 지원

---

## 🗓️ 주요 마일스톤

| 날짜 | 마일스톤 | 산출물 |
|------|----------|--------|
| **2025-11-21** | P0 완료 (Foundation) | Model Catalog, Agent 명세, Smart Router, Next.js 셋업 |
| **2025-12-05** | Text/Image Creation E2E | 9개 Creation Agents, Text/Image Editor |
| **2025-12-18** | P1 완료 (Core Features) | Video Pipeline, ComfyUI, Video Studio UI |
| **2026-01-08** | Video Creation E2E | 전체 영상 생성 플로우 완성 |
| **2026-01-29** | P2 완료 (PPC & Learning) | PPC Ads, Brand Learning Loop |
| **2026-02-11** | MVP 완성 & 배포 | 전체 시스템 통합 완료 |

---

## 📈 주간 체크포인트

### Week 1 (2025-11-14 ~ 2025-11-20)
- [x] [P0-A1] Model Catalog 통일 ✅ (2025-11-14)
- [x] [P0-A2] Agent 목록 통일 ✅ (2025-11-14)
- [x] [P0-A3] PPC Ads 섹션 반영 ✅ (2025-11-14)
- [x] [P1-A1] VIDEO_PIPELINE_SPEC.md ✅ (2025-11-14)
- [x] [P1-A2] COMFYUI_INTEGRATION.md ✅ (2025-11-14)
- [x] [P1-A3] MEETING_AI_SPEC.md ✅ (2025-11-14)
- [ ] [P0-B1] Smart LLM Router 구현 (Team B 시작 가능)
- [ ] [P0-C1] Next.js 프로젝트 셋업 (Team C 시작 가능)

### Week 2 (2025-11-21 ~ 2025-11-27)
- [ ] [P0-B2] Agent Base Class & A2A Protocol (Team B 시작 가능)
- [ ] [P1-C1] Editor Shell & Layout
- [ ] [P1-C2] Chat Interface

### Week 3-5 (2025-11-28 ~ 2025-12-18)
- [ ] [P1-B2] 9개 Creation Agents 구현
- [ ] [P1-C3] Text Editor
- [ ] [P1-C4] Image Editor
- [ ] [P1-B4] Video Pipeline 구현
- [ ] [P1-C6] Video Studio Editor

### Week 6-8 (2025-12-19 ~ 2026-01-08)
- [ ] [P1-B6] 11개 Intelligence Agents
- [ ] [P1-C7] Meeting AI UI
- [ ] 통합 테스트

### Week 9-11 (2026-01-09 ~ 2026-01-29)
- [ ] [P2-B1] PPC Ads API
- [ ] [P2-C1] PPC Ads UI
- [ ] [P2-B2] Brand Learning Loop
- [ ] [P2-C2] Dashboard

### Week 12-13 (2026-01-30 ~ 2026-02-11)
- [ ] [P2-B4] Multi-Node Orchestration
- [ ] [P2-C4] UI/UX 폴리싱
- [ ] 최종 통합 & 배포

---

## 🚨 중요 알림

### 규정 준수
- 모든 작업 완료 시 **즉시 Git 커밋** (규정 7)
- 매일 **작업 보고서 + 익일 계획서** 작성 (규정 11)
- 문서는 항상 **한글 작성** (규정 2)
- **SSD가 원본** - Git Pull 금지 (규정 8)

### 의존성 체크
- P0-B1은 P0-A1 완료 후 시작
- P0-B2는 P0-A2 완료 후 시작
- P1-B2는 P0-B2 완료 후 시작
- Team C는 **Mock 데이터로 선행 개발** (Team B 대기 안함)

### 주간 통합 (매주 금요일)
- Team A 주도로 `main` 브랜치 통합
- 통합 테스트 필수
- Mac mini 서버 배포 (Team A)

---

**본 문서는 전체 프로젝트의 Single Source of Truth입니다.**
**매일 업데이트하며, 모든 팀원이 확인해야 합니다.**
