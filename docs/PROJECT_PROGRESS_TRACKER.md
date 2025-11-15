# Sparklio v4.3 프로젝트 작업 공정표

**프로젝트**: Sparklio v4.3 AI Marketing Studio
**시작일**: 2025-11-15
**목표 완료일**: 2026-01-17 (8주)
**최종 업데이트**: 2025-11-15 23:59

---

## 📊 전체 공정율

```
전체 공정율: 4.3%
├── A팀 (QA + PM): 13% ███░░░░░░░░░░░░░░░░░
├── B팀 (Backend): 5% ██░░░░░░░░░░░░░░░░░░
└── C팀 (Frontend): 0% ░░░░░░░░░░░░░░░░░░░░
```

**현재 상태**: 🔴 Critical - 대규모 작업 누락 발견
**예상 완료일**: 2026-01-17 (8주 후)
**일정 변경**: +4주 (기존 4주 → 현재 8주)

---

## 🎯 마일스톤

### Week 2 체크포인트 (2025-11-29)
- [ ] `/api/v1/generate` 1개 Generator 동작
- [ ] Canvas Studio 레이아웃 브라우저 표시
- [ ] Document Save API 동작
- **미달 시 조치**: 아키텍처 재검토

### Week 4 체크포인트 (2025-12-13)
- [ ] 3개 Generator 모두 동작
- [ ] Canvas 편집 가능
- [ ] Template System 동작
- **미달 시 조치**: P1 기능 추가 축소

### Week 6 체크포인트 (2025-12-27)
- [ ] E2E 시나리오 통과
- [ ] PNG Export 동작
- [ ] 에러율 < 5%
- **미달 시 조치**: 출시 연기

### Week 8 최종 완료 (2026-01-17)
- [ ] 모든 P0 기능 완료
- [ ] 통합 테스트 통과율 > 95%
- [ ] 성능 기준 충족 (p95 < 2s, p99 < 3s)
- [ ] 프로덕션 배포 준비 완료

---

## A팀 (QA + PM) 작업 공정 - 13%

### 완료 (13%)

#### 테스트 인프라 (100% 완료)
- [x] Playwright 설정 완료 (playwright.config.ts)
- [x] npm scripts 추가 (package.json)
- [x] 환경 변수 템플릿 작성 (.env.test.example)
- [x] .gitignore 업데이트
- [x] tests/README.md 작성

#### E2E 테스트 작성 (100% 완료)
- [x] V2 Chat-First SPA 테스트 24건
  - [x] 01-app-layout.spec.ts (14 tests)
  - [x] 02-generator-integration.spec.ts (10 tests)
- [x] V3 Canvas Studio 테스트 16건
  - [x] 01-layout.spec.ts (16 tests)

#### 통합 테스트 작성 (100% 완료)
- [x] Backend API 테스트 31건
  - [x] Generator API (3 tests)
  - [x] Documents API (5 tests)
  - [x] Editor API (2 tests)
  - [x] Templates API (7 tests)
  - [x] Admin API (5 tests)
  - [x] Performance Tests (9 tests)

#### 성능 테스트 설정 (100% 완료)
- [x] Artillery 설정 (api-load-test.yml)
- [x] 부하 테스트 4단계 정의
- [x] 커스텀 프로세서 작성 (processor.js)

#### 테스트 픽스처 (100% 완료)
- [x] test_data.sql 작성 (15개 엔티티)
- [x] 사용자 3명 생성
- [x] 브랜드 3개 생성
- [x] 프로젝트, 문서, 템플릿 생성
- [x] 성능 테스트 데이터 100개

#### 문서화 (100% 완료)
- [x] A팀 일일 보고서 (A_TEAM_DAILY_REPORT_2025_11_15.md)
- [x] 익일 작업 계획서 (A_TEAM_NEXT_DAY_PLAN_2025_11_16.md)
- [x] 프로젝트 종합 분석 (PROJECT_COMPREHENSIVE_ANALYSIS_2025_11_15.md)
- [x] A팀 규정집 (A_TEAM_GUIDELINES.md)
- [x] 프로젝트 공정표 (PROJECT_PROGRESS_TRACKER.md)

#### Git 관리 (100% 완료)
- [x] 커밋 2건 완료
- [x] 불필요한 파일 정리

### 미완료 (87%)

#### 테스트 실행 (0% 완료)
- [ ] Backend API 테스트 실행 (31 tests)
- [ ] 성능 테스트 실행
- [ ] E2E V2 테스트 실행 (24 tests)
- [ ] E2E V3 테스트 실행 (16 tests)

#### 테스트 결과 분석 (0% 완료)
- [ ] 테스트 결과 리포트 작성
- [ ] 성능 리포트 작성
- [ ] 버그 리포트 작성 (필요 시)

#### 인프라 문서화 (0% 완료)
- [ ] INFRA_SETUP.md 작성
- [ ] DEPLOYMENT.md 작성
- [ ] GIT_WORKFLOW.md 작성

#### Daily 프로세스 (0% 완료)
- [ ] Daily Standup 시작 (매일 09:00)
- [ ] 매일 종합 분석 수행
- [ ] 매일 공정율 업데이트
- [ ] 매일 Mac mini 서버 동기화

#### 주간 프로세스 (0% 완료)
- [ ] 주간 체크포인트 미팅
- [ ] 주간 종합 분석 보고서
- [ ] 주간 백업 (PostgreSQL, Redis, MinIO)

---

## B팀 (Backend) 작업 공정 - 5%

### 완료 (5%)

#### 프로젝트 기반 인프라 (100% 완료)
- [x] FastAPI 프로젝트 구조 설정
- [x] PostgreSQL 연결 설정
- [x] Redis 연결 설정
- [x] Alembic 마이그레이션 설정
- [x] 환경 변수 관리 (.env)

#### 인증 API (100% 완료)
- [x] POST /api/v1/auth/register - 회원가입
- [x] POST /api/v1/auth/login - 로그인
- [x] POST /api/v1/auth/logout - 로그아웃
- [x] POST /api/v1/auth/refresh - 토큰 갱신
- [x] GET /api/v1/auth/me - 내 정보 조회

#### Brand CRUD (100% 완료)
- [x] GET /api/v1/brands - 브랜드 목록
- [x] POST /api/v1/brands - 브랜드 생성
- [x] GET /api/v1/brands/{brandId} - 브랜드 조회
- [x] PATCH /api/v1/brands/{brandId} - 브랜드 수정

#### Project CRUD (100% 완료)
- [x] GET /api/v1/projects - 프로젝트 목록
- [x] POST /api/v1/projects - 프로젝트 생성
- [x] GET /api/v1/projects/{projectId} - 프로젝트 조회
- [x] PATCH /api/v1/projects/{projectId} - 프로젝트 수정

#### Asset 관리 (100% 완료)
- [x] POST /api/v1/assets/upload - 파일 업로드
- [x] GET /api/v1/assets/{assetId} - 파일 조회
- [x] DELETE /api/v1/assets/{assetId} - 파일 삭제
- [x] GET /api/v1/brands/{brandId}/assets - 브랜드 에셋 목록
- [x] MinIO 연동 완료

#### Base Agent 클래스 (100% 완료)
- [x] agents/base.py - BaseAgent 클래스
- [x] LLM Provider 인터페이스
- [x] OpenAI Provider
- [x] Claude Provider
- [x] Local LLM Provider
- [x] SmartRouter (비용 최적화)

#### Individual Agents (71% 완료 - 5/7개)
- [x] BriefAgent (agents/brief.py)
- [x] StrategistAgent (agents/strategist.py)
- [x] CopywriterAgent (agents/copywriter.py)
- [x] LayoutDesignerAgent (agents/layout.py)
- [x] ReviewerAgent (agents/reviewer.py)
- [ ] DataFetcherAgent (미구현)
- [ ] TemplateSelectorAgent (미구현)

### 미완료 (95%)

#### 🚨 Generator 오케스트레이션 (0% 완료) - CRITICAL
- [ ] generators/base.py - BaseGenerator 클래스
- [ ] generators/brand_kit.py - BrandKitGenerator
- [ ] generators/product_detail.py - ProductDetailGenerator
- [ ] generators/sns.py - SNSGenerator
- [ ] POST /api/v1/generate - 통합 생성 엔드포인트
- [ ] Agent 파이프라인 오케스트레이션 로직
- [ ] 중간 결과 캐싱
- [ ] 에러 핸들링 및 재시도

#### 🚨 Agent API 폐쇄 (0% 완료) - CRITICAL
- [ ] ❌ POST /api/v1/agents/brief/generate 제거
- [ ] ❌ POST /api/v1/agents/strategy/generate 제거
- [ ] ❌ POST /api/v1/agents/copy/generate 제거
- [ ] ❌ POST /api/v1/agents/layout/generate 제거
- [ ] ❌ POST /api/v1/agents/review/generate 제거
- [ ] 외부 노출된 Agent API 모두 폐쇄
- [ ] Frontend에 아키텍처 변경 공지

#### Document API (0% 완료)
- [ ] POST /api/v1/documents - 문서 생성
- [ ] GET /api/v1/documents/{docId} - 문서 조회
- [ ] PATCH /api/v1/documents/{docId} - 문서 수정
- [ ] DELETE /api/v1/documents/{docId} - 문서 삭제
- [ ] GET /api/v1/documents - 문서 목록
- [ ] POST /api/v1/documents/{docId}/duplicate - 문서 복제

#### Editor Action API (0% 완료)
- [ ] POST /api/v1/editor/action - 편집 액션 실행
- [ ] GET /api/v1/editor/history/{docId} - 편집 히스토리 조회
- [ ] POST /api/v1/editor/undo - 실행 취소

#### Template System (0% 완료)
- [ ] GET /api/v1/templates - 템플릿 목록
- [ ] GET /api/v1/templates/{templateId} - 템플릿 조회
- [ ] POST /api/v1/templates - 템플릿 생성 (Admin)
- [ ] PATCH /api/v1/templates/{templateId} - 템플릿 수정 (Admin)
- [ ] DELETE /api/v1/templates/{templateId} - 템플릿 삭제 (Admin)
- [ ] GET /api/v1/templates/categories - 카테고리 목록
- [ ] POST /api/v1/templates/{templateId}/clone - 템플릿 복제

#### RAG & Brand Learning (0% 완료)
- [ ] Brand Voice 학습 파이프라인
- [ ] RAG 인덱스 구축
- [ ] 벡터 데이터베이스 (Chroma/Weaviate)
- [ ] 브랜드별 Embedding 저장

#### Admin Console API (0% 완료)
- [ ] GET /api/v1/admin/users - 사용자 관리
- [ ] GET /api/v1/admin/plans - 플랜 관리
- [ ] GET /api/v1/admin/agents - Agent 상태 모니터링
- [ ] GET /api/v1/admin/jobs - Job Queue 상태
- [ ] GET /api/v1/admin/logs - 로그 조회
- [ ] GET /api/v1/admin/errors - 에러 로그
- [ ] GET /api/v1/admin/templates - 템플릿 관리
- [ ] POST /api/v1/admin/feature-flags - Feature Flag 관리

#### Data Pipeline (0% 완료)
- [ ] Crawler - 마케팅 데이터 수집
- [ ] Cleaner - 데이터 정제
- [ ] Normalizer - 데이터 정규화
- [ ] Tagger - 산업/채널 분류
- [ ] Embedder - RAG 인덱스 생성
- [ ] Template Generator - 자동 템플릿 생성
- [ ] Pattern Miner - 패턴 학습

#### Concept Board API (0% 완료)
- [ ] POST /api/v1/concept-boards - 컨셉보드 생성
- [ ] GET /api/v1/concept-boards/{boardId} - 컨셉보드 조회
- [ ] PATCH /api/v1/concept-boards/{boardId} - 컨셉보드 수정
- [ ] POST /api/v1/concept-boards/{boardId}/tiles - 타일 추가
- [ ] DELETE /api/v1/concept-boards/{boardId}/tiles/{tileId} - 타일 삭제

#### Export API (0% 완료)
- [ ] POST /api/v1/export/png - PNG 내보내기
- [ ] POST /api/v1/export/pdf - PDF 내보내기

#### 소셜 로그인 (0% 완료)
- [ ] Google OAuth 연동
- [ ] Naver 로그인 연동
- [ ] Kakao 로그인 연동

#### LLM 통합 (70% 완료)
- [x] OpenAI API 연동
- [x] Claude API 연동
- [x] Local LLM 연동 (기본 구조)
- [ ] ComfyUI 연동 (이미지 생성)
- [ ] 비용 추적 및 최적화
- [ ] Rate Limiting

#### Monitoring & Logging (30% 완료)
- [x] Health Check API
- [x] Readiness Check API
- [x] Prometheus Metrics 기본
- [ ] Detailed Metrics (Agent별, API별)
- [ ] Error Tracking (Sentry)
- [ ] Structured Logging

---

## C팀 (Frontend) 작업 공정 - 0%

### 완료 (0%)

**주의**: 레거시 V2 컴포넌트 75% 완료되었으나, Canvas Studio v3와 호환 불가능하여 공정율에서 제외

### 미완료 (100%)

#### 🚨 Canvas Studio v3 - Phase 1: VSCode Layout (0% 완료) - CRITICAL

**Week 1 목표**:

##### 1.1 Shell & Layout (0/8 완료)
- [ ] `components/canvas-studio/CanvasStudioShell.tsx` - 최상위 컨테이너
- [ ] `components/canvas-studio/layout/ActivityBar.tsx` - 좌측 아이콘 바 (56px)
- [ ] `components/canvas-studio/layout/LeftPanel.tsx` - 좌측 패널 (280px, 리사이즈 가능)
- [ ] `components/canvas-studio/layout/CanvasViewport.tsx` - 중앙 캔버스
- [ ] `components/canvas-studio/layout/RightDock.tsx` - 우측 도크 (360px)
- [ ] `components/canvas-studio/layout/StatusBar.tsx` - 하단 상태바
- [ ] `components/canvas-studio/layout/Resizer.tsx` - 패널 리사이즈 핸들
- [ ] Zustand Store: `stores/canvasLayoutStore.ts`

**레이아웃 구조**:
```
[Activity Bar 56px] [Left Panel 280px] | [Canvas Viewport] | [Right Dock 360px]
                                        [Status Bar 24px]
```

##### 1.2 Activity Bar 메뉴 (0/5 완료)
- [ ] 📁 Explorer (파일 트리)
- [ ] 🔍 Search (검색)
- [ ] 📄 Pages (페이지 목록)
- [ ] 🎨 Assets (브랜드 에셋)
- [ ] ⚙️ Settings (설정)

##### 1.3 Right Dock 탭 (0/5 완료)
- [ ] 💬 Chat (AI 대화)
- [ ] 🔍 Inspector (속성 편집)
- [ ] 📚 Layers (레이어 관리)
- [ ] 📊 Data (데이터 소스)
- [ ] 🏷️ Brand (브랜드 정보)

##### 1.4 View Modes (0/3 완료)
- [ ] Studio Mode (3-column layout)
- [ ] Canvas Focus (Canvas 전체 화면, Right Dock만 유지)
- [ ] Chat Focus (Chat 전체 화면, Left Panel 숨김)

#### Canvas Studio v3 - Phase 2: Canvas Core (0% 완료)

**Week 2 목표**:

##### 2.1 Fabric.js 설정 (0/7 완료)
- [ ] Fabric.js 5.x 설치
- [ ] Canvas 초기화 로직
- [ ] Grid & Ruler
- [ ] Zoom & Pan
- [ ] Selection 핸들링
- [ ] Clipboard (복사/붙여넣기)
- [ ] Undo/Redo (History Stack)

##### 2.2 Page Management (0/4 완료)
- [ ] Page 생성/삭제
- [ ] Page 전환
- [ ] Page Thumbnail
- [ ] Multi-page Document 지원

##### 2.3 Object Rendering (0/5 완료)
- [ ] Text Object (Fabric.Textbox)
- [ ] Image Object (Fabric.Image)
- [ ] Shape Object (Rect, Circle, Path)
- [ ] Group Object (Fabric.Group)
- [ ] Custom Object (Logo, Icon)

##### 2.4 Zustand Stores (0/3 완료)
- [ ] `stores/canvasStore.ts` - Canvas 상태
- [ ] `stores/documentStore.ts` - Document 상태
- [ ] `stores/historyStore.ts` - Undo/Redo 스택

#### Canvas Studio v3 - Phase 3: Modes & Chat (0% 완료)

**Week 3 목표**:

##### 3.1 View Mode System (0/4 완료)
- [ ] Mode 전환 로직
- [ ] Layout 애니메이션
- [ ] Keyboard Shortcuts
- [ ] Mode 별 UI 조정

##### 3.2 Chat Integration (0/9 완료)
- [ ] Chat UI 컴포넌트
- [ ] Message 렌더링
- [ ] User Input
- [ ] Generator 호출 (POST /api/v1/generate)
- [ ] Streaming 응답 처리
- [ ] 대화 히스토리 유지
- [ ] Context 전달 (현재 Document, Brand)
- [ ] 생성 결과 Canvas 반영
- [ ] 에러 핸들링

##### 3.3 Brand & Data Panel (0/5 완료)
- [ ] Brand 정보 표시
- [ ] Color Palette 선택
- [ ] Font 선택
- [ ] Asset 불러오기
- [ ] Data Source 연결

#### Canvas Studio v3 - Phase 4: Inspector & Export (0% 완료)

**Week 4 목표**:

##### 4.1 Inspector Panel (0/8 완료)
- [ ] Text 속성 편집 (Font, Size, Color, Align)
- [ ] Image 속성 편집 (Crop, Filter, Opacity)
- [ ] Shape 속성 편집 (Fill, Stroke, Border)
- [ ] Layout 속성 (Position, Size, Rotation)
- [ ] Layer 순서 변경
- [ ] Lock/Unlock Object
- [ ] Visibility Toggle
- [ ] Batch Edit (다중 선택)

##### 4.2 Layers Panel (0/4 완료)
- [ ] Layer 트리 렌더링
- [ ] Drag & Drop 순서 변경
- [ ] Layer 그룹화
- [ ] Layer 검색

##### 4.3 Export UI (0/3 완료)
- [ ] PNG Export 버튼
- [ ] PDF Export 버튼 (P1)
- [ ] Export 옵션 (해상도, 품질)

##### 4.4 Document Save/Load (0/5 완료)
- [ ] Auto-save (5초 간격)
- [ ] Manual Save
- [ ] Document Load
- [ ] Version History (P1)
- [ ] Conflict Resolution

#### V2 Chat-First SPA (0% 완료, 레거시)

**주의**: V3로 전환 예정, V2는 후순위

- [ ] 레거시 V2 코드 검토
- [ ] V3와 충돌 방지
- [ ] 점진적 마이그레이션 계획

---

## 🚨 즉시 조치 사항

### CRITICAL (오늘 반드시)
- [x] 일정 재조율 공지 (4주 → 8주)
- [x] 종합 분석 보고서 작성
- [ ] B팀, C팀에게 현황 공유 (내일 09:00 Daily Standup)

### HIGH (이번 주)
- [ ] Generator Base 클래스 구현 (B팀)
- [ ] Canvas Studio 폴더 구조 생성 (C팀)
- [ ] Daily Standup 시작 (매일 09:00, 15분)

### MEDIUM (다음 주)
- [ ] Infrastructure 문서화 (A팀)
- [ ] E2E 테스트 시나리오 정의 (A팀)

---

## 📅 주차별 계획

### Week 1-2 (2025-11-16 ~ 2025-11-29) - 기반 작업

**B팀**:
- [ ] Generator 오케스트레이션 (generators/base.py, 3개 Generator)
- [ ] POST /api/v1/generate 엔드포인트
- [ ] Agent API 폐쇄 (모든 /agents/* 제거)
- [ ] Document API 6개 엔드포인트

**C팀**:
- [ ] Canvas Studio 폴더 구조 생성
- [ ] Phase 1: VSCode Layout 완료 (8개 컴포넌트)
- [ ] Fabric.js 설정 및 학습

**A팀**:
- [ ] Backend API 테스트 실행 (매일)
- [ ] 성능 테스트 실행 (매일)
- [ ] Daily Standup 주관 (매일 09:00)
- [ ] 매일 종합 분석 및 공정율 업데이트
- [ ] Infrastructure 문서화 (INFRA_SETUP.md, DEPLOYMENT.md, GIT_WORKFLOW.md)

### Week 3-4 (2025-11-30 ~ 2025-12-13) - 통합 작업

**B팀**:
- [ ] Template System 7개 API
- [ ] RAG & Brand Learning 파이프라인
- [ ] DataFetcherAgent, TemplateSelectorAgent 구현
- [ ] Editor Action API 3개

**C팀**:
- [ ] Phase 2: Canvas Core 완료 (Fabric.js, Pages, Objects)
- [ ] Phase 3: Modes & Chat 완료 (Generator 연동)

**A팀**:
- [ ] E2E V3 Phase 1 테스트 실행
- [ ] E2E V3 Phase 2 테스트 실행
- [ ] E2E V3 Phase 3 테스트 실행
- [ ] 주간 체크포인트 관리

### Week 5-6 (2025-12-14 ~ 2025-12-27) - 완성도 향상

**B팀**:
- [ ] Admin Console API 8개
- [ ] Export API 2개
- [ ] Concept Board API 5개
- [ ] 소셜 로그인 (Google, Naver, Kakao)

**C팀**:
- [ ] Phase 4: Inspector & Export 완료
- [ ] Document Save/Load
- [ ] Auto-save 구현

**A팀**:
- [ ] 통합 테스트 실행 (E2E 전체)
- [ ] 성능 테스트 종합 분석
- [ ] 버그 수정 추적 및 검증

### Week 7-8 (2025-12-28 ~ 2026-01-17) - 버퍼 & 출시 준비

**B팀**:
- [ ] Data Pipeline 구축 (P1)
- [ ] ComfyUI 연동
- [ ] 성능 최적화

**C팀**:
- [ ] UI/UX 개선
- [ ] 반응형 레이아웃 최적화
- [ ] 접근성 개선

**A팀**:
- [ ] 최종 통합 테스트
- [ ] 프로덕션 배포 검증
- [ ] 모니터링 설정
- [ ] 출시 문서 작성

---

## 📊 리스크 관리

### 타임라인 리스크

| 리스크 | 확률 | 영향 | 대응 |
|-------|------|------|------|
| 8주도 부족 | 30% | HIGH | 주간 체크포인트로 조기 감지 |
| Generator 리팩터링 실패 | 20% | CRITICAL | Week 1 집중 투입 |
| Canvas Studio 학습 곡선 | 40% | MEDIUM | Fabric.js 샘플 코드 제공 |
| 팀 간 통신 부재 | 50% | MEDIUM | Daily standup 강제 |

### 기술 리스크

| 리스크 | 대응 |
|-------|------|
| LLM 비용 폭증 | SmartRouter 우선 구현, 비용 트래킹 |
| ComfyUI 설정 실패 | Mock Image Provider로 대체 (P0) |
| Template 품질 저하 | Admin 승인 워크플로우 필수 |
| Fabric.js 성능 이슈 | Lazy Loading, Offscreen Rendering |

---

## 📈 공정율 계산 방법

### A팀 공정율
```
완료 작업 수 / 전체 작업 수 × 100
= (테스트 인프라 + E2E 테스트 + 통합 테스트 + 성능 테스트 + 문서화) / (모든 작업)
= 13 / 100 = 13%
```

### B팀 공정율
```
완료 작업 수 / 전체 작업 수 × 100
= (인증 + Brand + Project + Asset + BaseAgent + Individual Agents 5개) / (모든 작업)
= 29 / 574 ≈ 5%
```

### C팀 공정율
```
완료 작업 수 / 전체 작업 수 × 100
= 0 / 320 = 0%
(레거시 V2는 v3와 호환 불가하여 제외)
```

### 전체 공정율
```
(A팀 작업량 × A팀 공정율 + B팀 작업량 × B팀 공정율 + C팀 작업량 × C팀 공정율) / 전체 작업량
= (100 × 0.13 + 574 × 0.05 + 320 × 0.00) / 994
= (13 + 28.7 + 0) / 994
= 41.7 / 994
≈ 4.3%
```

---

## 📌 우선순위 정의

### P0 (반드시 8주 내)
- Brand Kit Generator
- Product Detail Generator
- SNS Generator
- Canvas Studio 기본 편집
- PNG Export
- Template System
- Document Save/Load

### P1 (9주 이후)
- Meeting AI Generator
- Video Script Generator
- Chart/Graph
- Admin Dashboard
- Data Pipeline 고도화

---

## 🔄 업데이트 이력

| 날짜 | 업데이트 내용 | 업데이트자 |
|------|-------------|----------|
| 2025-11-15 | 초기 작성, 전체 공정율 4.3% 확정 | A팀 |
| 2025-11-16 | Daily Standup 시작, 테스트 실행 결과 반영 예정 | A팀 |

---

**다음 업데이트**: 2025-11-16 17:00 (매일)
**작성자**: A팀 QA + PM
**승인**: 대기 중
