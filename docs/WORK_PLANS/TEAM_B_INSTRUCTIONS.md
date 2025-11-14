# Team B (Backend & Agent System) 작업 지시서

**최초 작성**: 2025-11-14 (금요일) 16:20
**최종 수정**: 2025-11-14 (금요일) 16:20
**대상 기간**: 2025-11-14 ~ 2026-02-11 (90일)
**담당**: Backend & Agent System Team

---

## 🎯 Team B의 역할

Team B는 **프로젝트의 심장**입니다.

### 핵심 책임
1. **Smart LLM Router 구현**: 5가지 프리셋 모드, 비용 최적화
2. **Agent A2A Protocol 구현**: 24개 에이전트 시스템
3. **Video Pipeline 구현**: VEo3, AnimateDiff, Sora2 통합
4. **ComfyUI Integration**: 로컬 이미지 생성 스택
5. **API 설계 및 구현**: Team C가 사용할 API 제공

---

## 📋 작업 범위

### Week 1-2 (Foundation) - 2025-11-14 ~ 2025-11-27

#### 1. Smart LLM Router 구현 ✅ 최우선
- **목표**: `/api/llm/route` 엔드포인트 완성
- **작업 내용**:
  - 5가지 프리셋 모드 구현 (draft_fast, balanced, high_fidelity, privacy_first, cost_optimized)
  - 모델 선택 알고리즘 (가중치 스코어 계산)
  - 비용 추정 로직
  - 예산 임계값 제어 ($1/$5/$20)
- **참조 문서**:
  - `docs/PHASE0/LLM_ROUTER_POLICY.md`
  - `docs/API_CONTRACTS/llm_router.json`
- **산출물**:
  - `src/router/smart-llm-router.ts`
  - `src/router/model-catalog.ts`
  - `src/router/cost-estimator.ts`
  - API 엔드포인트: `/api/llm/route`, `/api/llm/models`, `/api/llm/cost/estimate`
- **테스트**:
  - `tests/router/smart-llm-router.test.ts`
  - 모든 프리셋 모드 테스트
  - 비용 계산 정확도 테스트
- **예상 소요**: 12시간 (3일)

#### 2. Agent Base Class & A2A Protocol ✅ 최우선
- **목표**: 모든 에이전트의 기반 클래스 및 통신 프로토콜
- **작업 내용**:
  - `BaseAgent` 클래스 (공통 메서드: execute, validate, log 등)
  - A2A Message Format (JSON Schema)
  - Agent Registry (에이전트 등록/조회)
  - Message Queue (에이전트 간 메시지 전달)
- **참조 문서**:
  - `docs/PHASE0/AGENTS_SPEC.md`
  - `docs/API_CONTRACTS/agents.json` (작성 필요)
- **산출물**:
  - `src/agents/base-agent.ts`
  - `src/agents/a2a-protocol.ts`
  - `src/agents/agent-registry.ts`
  - `src/agents/message-queue.ts`
- **테스트**:
  - `tests/agents/base-agent.test.ts`
  - `tests/agents/a2a-protocol.test.ts`
- **예상 소요**: 10시간 (2.5일)

#### 3. API Contract 작성 (agents.json)
- **목표**: Agent A2A Protocol API 계약서
- **작업 내용**:
  - `/api/agent/execute` 엔드포인트 정의
  - `/api/agent/status` 엔드포인트 정의
  - A2A Message Schema 정의
- **산출물**:
  - `docs/API_CONTRACTS/agents.json`
  - `docs/API_CONTRACTS/changelog.md` 업데이트
- **예상 소요**: 2시간

---

### Week 3-5 (Core Features) - 2025-11-28 ~ 2025-12-18

#### 4. 9개 Creation Agents 구현
- **목표**: 콘텐츠 생성 에이전트 전체 구현
- **작업 내용**:
  1. **StrategistAgent**: 전략 수립
  2. **CopywriterAgent**: 텍스트 작성
  3. **VisionGeneratorAgent**: 이미지 생성 (DALL-E, ComfyUI 연동)
  4. **VisionAnalyzerAgent**: 이미지 분석
  5. **ScenePlannerAgent**: 영상 씬 계획
  6. **StoryboardBuilderAgent**: 스토리보드 생성
  7. **VideoDirectorAgent**: 영상 생성 지시
  8. **VideoReviewerAgent**: 영상 검토
  9. **TemplateAgent**: 템플릿 관리
- **참조 문서**:
  - `docs/PHASE0/AGENTS_SPEC.md`
- **산출물**:
  - `src/agents/creation/strategist-agent.ts`
  - `src/agents/creation/copywriter-agent.ts`
  - ... (각 에이전트 파일)
- **테스트**:
  - 각 에이전트별 단위 테스트
  - E2E 테스트: Text Creation 플로우
- **예상 소요**: 30시간 (7.5일)

#### 5. API Contract 작성 (video_pipeline.json, comfyui.json)
- **목표**: Video & ComfyUI API 계약서
- **작업 내용**:
  - `/api/video/generate` 정의
  - `/api/comfyui/generate` 정의
- **산출물**:
  - `docs/API_CONTRACTS/video_pipeline.json`
  - `docs/API_CONTRACTS/comfyui.json`
- **예상 소요**: 3시간

---

### Week 6-8 (Video & Intelligence) - 2025-12-19 ~ 2026-01-08

#### 6. Video Pipeline 구현 (VEo3, AnimateDiff)
- **목표**: 영상 생성 파이프라인 E2E
- **작업 내용**:
  - VEo3 API 연동
  - AnimateDiff 로컬 실행
  - Sora2 API 연동 (준비)
  - Runway Gen-3 API 연동 (준비)
  - FFmpeg 후처리 (자막, 음악, 전환 효과)
- **참조 문서**:
  - `docs/PHASE0/VIDEO_PIPELINE_SPEC.md` (Team A 작성 예정)
- **산출물**:
  - `src/video/veo3-connector.ts`
  - `src/video/animatediff-connector.ts`
  - `src/video/ffmpeg-processor.ts`
- **테스트**:
  - 영상 생성 E2E 테스트
  - FFmpeg 후처리 테스트
- **예상 소요**: 20시간 (5일)

#### 7. ComfyUI Integration (로컬 이미지 생성)
- **목표**: ComfyUI 서버 연동 및 워크플로우 관리
- **작업 내용**:
  - ComfyUI API 연동
  - Workflow JSON 템플릿 관리
  - LoRA/ControlNet 로드
  - Brand Color Adapter 적용
  - Multi-Ratio Output (1:1, 4:5, 9:16, 16:9)
- **참조 문서**:
  - `docs/PHASE0/COMFYUI_INTEGRATION.md` (Team A 작성 예정)
- **산출물**:
  - `src/image/comfyui-connector.ts`
  - `src/image/workflow-manager.ts`
  - `src/image/brand-color-adapter.ts`
- **테스트**:
  - ComfyUI 워크플로우 실행 테스트
  - Multi-Ratio 출력 테스트
- **예상 소요**: 15시간 (4일)

#### 8. 11개 Intelligence Agents 구현
- **목표**: 데이터 수집/분석/학습 에이전트
- **작업 내용**:
  1. **TrendCollectorAgent**: 트렌드 수집
  2. **DataCleanerAgent**: 데이터 정제
  3. **EmbedderAgent**: 임베딩 생성
  4. **IngestorAgent**: RAG 저장
  5. **ReviewerAgent**: 콘텐츠 검토
  6. **PerformanceAnalyzerAgent**: 성과 분석
  7. **SelfLearningAgent**: 자가 학습
  8. **BrandModelUpdaterAgent**: 브랜드 모델 업데이트
  9. **RAGAgent**: RAG 검색
  10. **TrendAgent**: 트렌드 분석
  11. **DataCollectorAgent**: 데이터 수집
- **참조 문서**:
  - `docs/PHASE0/AGENTS_SPEC.md`
  - `docs/PHASE0/BRAND_LEARNING_ENGINE.md`
  - `docs/PHASE0/DATA_PIPELINE_PLAN.md`
- **산출물**:
  - `src/agents/intelligence/*.ts` (11개 파일)
- **테스트**:
  - 각 에이전트별 단위 테스트
- **예상 소요**: 25시간 (6일)

---

### Week 9-11 (PPC Ads & Learning) - 2026-01-09 ~ 2026-01-29

#### 9. PPC Ads Publishing API 구현
- **목표**: Google Ads, Naver, Kakao 자동 집행
- **작업 내용**:
  - Google Ads API 연동
  - Naver 검색광고 API 연동
  - Kakao Moment API 연동
  - 캠페인 생성/관리
  - 성과 추적 (CTR, CPC, CPA, ROAS)
- **참조 문서**:
  - `docs/PRD/Sparklio_V4_PRD_Final.md` Section 8.1
  - `docs/API_CONTRACTS/ppc_ads.json` (작성 필요)
- **산출물**:
  - `src/ppc/google-ads-connector.ts`
  - `src/ppc/naver-ads-connector.ts`
  - `src/ppc/kakao-ads-connector.ts`
  - API: `/api/ppc/publish`, `/api/ppc/status`
- **테스트**:
  - 각 플랫폼별 API 연동 테스트
  - 캠페인 생성 E2E 테스트
- **예상 소요**: 20시간 (5일)

#### 10. Brand Learning Loop 구현
- **목표**: 자동 재학습 시스템
- **작업 내용**:
  - 성과 데이터 수집
  - 재학습 트리거 감지
  - 브랜드 모델 업데이트 (Fine-tuning)
  - A/B 테스트 엔진
- **참조 문서**:
  - `docs/PHASE0/BRAND_LEARNING_ENGINE.md`
- **산출물**:
  - `src/learning/self-learning-loop.ts`
  - `src/learning/brand-model-updater.ts`
  - `src/learning/ab-test-engine.ts`
- **테스트**:
  - 재학습 트리거 테스트
  - 모델 업데이트 테스트
- **예상 소요**: 18시간 (4.5일)

#### 11. 4개 System Agents 구현
- **작업 내용**:
  1. **PMAgent**: 프로젝트 관리
  2. **SecurityAgent**: 보안 검사
  3. **BudgetAgent**: 예산 관리
  4. **ADAgent**: 광고 관리
- **산출물**:
  - `src/agents/system/*.ts` (4개 파일)
- **예상 소요**: 10시간 (2.5일)

---

### Week 12-13 (Integration & Polish) - 2026-01-30 ~ 2026-02-11

#### 12. Multi-Node Orchestration 구현
- **목표**: 3-Node 하이브리드 인프라 라우팅
- **작업 내용**:
  - 노드 헬스체크 (Desktop GPU, Laptop, Mac mini)
  - 작업 분산 라우팅
  - Failover 처리
  - Cloud GPU 대체 전략
- **참조 문서**:
  - `docs/PHASE0/TECH_DECISION_v1.md`
- **산출물**:
  - `src/orchestration/node-router.ts`
  - `src/orchestration/health-checker.ts`
  - `src/orchestration/failover-handler.ts`
- **예상 소요**: 12시간 (3일)

#### 13. 성능 최적화 & 버그 수정
- **작업 내용**:
  - API 응답 시간 최적화
  - 메모리 누수 수정
  - 에러 핸들링 개선
  - 로깅 추가
- **예상 소요**: 15시간 (4일)

---

## 🔄 일일 작업 루틴

### 매일 오전 (09:00 - 09:30)
1. **필독 문서 확인**
   - `docs/WORK_REGULATIONS.md`
   - `docs/API_CONTRACTS/changelog.md` ⭐ 중요
   - `docs/WORK_PLANS/MASTER_TODO.md`
   - `docs/WORK_REPORTS/[어제날짜]_Team_B_Report.md`
   - `docs/WORK_PLANS/NEXT_DAY/[오늘날짜]_Team_B_Plan.md`

2. **환경 확인**
   ```bash
   cd K:\sparklio_ai_marketing_studio
   git status
   git checkout feature/backend-core
   npm run dev  # 개발 서버 실행
   ```

### 작업 중 (수시)
- **API 설계 변경 시 즉시 Contract 업데이트** (규정 중요!)
  ```bash
  # 1. API Contract JSON 수정
  code docs/API_CONTRACTS/llm_router.json

  # 2. Changelog 업데이트
  code docs/API_CONTRACTS/changelog.md

  # 3. Git 커밋
  git add docs/API_CONTRACTS/
  git commit -m "[2025-11-14 10:30] api: LLM Router API 업데이트"
  git push origin feature/backend-core

  # 4. Team C에게 공지 (Slack/Discord)
  ```

- **작업 완료 시 즉시 Git 커밋** (규정 7)
  ```bash
  git add src/
  git commit -m "[2025-11-14 14:30] feat: Smart LLM Router 구현 완료"
  git push origin feature/backend-core
  ```

- **주석 작성 필수** (규정 4)
  ```typescript
  /**
   * Smart LLM Router: 사용자 요청을 최적 모델로 라우팅
   *
   * @param request - 사용자 입력 및 컨텍스트
   * @param mode - 라우팅 모드 (draft_fast | balanced 등)
   * @returns 선택된 모델 정보 및 예상 비용
   *
   * @example
   * const result = await routeToOptimalModel({
   *   prompt: "인스타그램 릴스 스크립트 작성",
   *   mode: "balanced"
   * });
   * // => { selectedModel: "gpt-4o", estimatedCost: 0.015 }
   */
  async function routeToOptimalModel(request: Request, mode: RouterMode): Promise<ModelSelection> {
    // 1. 요청 분석 (텍스트/이미지/영상 판별)
    const taskType = analyzeTaskType(request);

    // 2. 모드별 가중치 적용
    const weights = ROUTER_PRESETS[mode];

    // 3. 최적 모델 선택
    return selectBestModel(taskType, weights);
  }
  ```

### 매일 저녁 (18:00 - 18:30)
1. **작업 보고서 작성**
   - `docs/WORK_REPORTS/[오늘날짜]_Team_B_Report.md`

2. **익일 작업 계획서 작성**
   - `docs/WORK_PLANS/NEXT_DAY/[내일날짜]_Team_B_Plan.md`

3. **Git 커밋 & 마감**
   ```bash
   git add docs/
   git commit -m "[2025-11-14 18:30] docs: Team B 작업 보고서 및 익일 계획서"
   git push origin feature/backend-core
   ```

---

## 📅 주간 작업 루틴

### 매주 금요일 (통합의 날)

#### 오전 (09:00 - 12:00): 테스트 & 버그 수정
```bash
npm run test
npm run test:integration
npm run lint
```

#### 오후 (14:00 - 17:00): Team A와 통합
- Team A가 `main` 브랜치로 merge 진행
- 충돌 해결 협조
- 통합 테스트 참여

---

## 🚨 에러 대응 (Team B 전용)

### API 에러 발생 시
1. **즉시 로그 확인**
   ```bash
   pm2 logs sparklio --lines 100
   ```

2. **에러 재현**
   - 동일 요청 재실행
   - 에러 로그 캡처

3. **에러 보고**
   - `docs/WORK_REPORTS/ERROR_LOG.md`에 기록
   - Team A에게 공지

### 테스트 실패 시
- **절대 merge 금지** (규정 6)
- 테스트 수정 후 재실행
- 모든 테스트 통과 전까지 작업 중단

---

## 🎯 90일 마일스톤

| 주차 | 목표 | 핵심 산출물 |
|------|------|-------------|
| Week 1-2 | Foundation | Smart LLM Router, Agent Base Class |
| Week 3-5 | Core Agents | 9개 Creation Agents 완성 |
| Week 6-8 | Video & Intelligence | Video Pipeline, ComfyUI, 11개 Intelligence Agents |
| Week 9-11 | PPC & Learning | PPC Ads API, Brand Learning Loop |
| Week 12-13 | Integration | Multi-Node Orchestration, 최적화 |

---

## 📝 Team B 전용 체크리스트

### API 설계 시
- [ ] OpenAPI 3.0 스펙 준수
- [ ] `docs/API_CONTRACTS/` JSON 파일 작성
- [ ] `changelog.md` 업데이트
- [ ] Team C에게 공지
- [ ] 예시 포함 (example 필드)

### 코드 작성 시
- [ ] 주석 필수 작성 (JSDoc/TSDoc)
- [ ] 간결하게 작성 (50줄 이내 함수)
- [ ] 테스트 작성 (80% 커버리지 목표)
- [ ] 에러 핸들링 추가

### 작업 완료 시
- [ ] 즉시 Git 커밋
- [ ] 작업 보고서 작성
- [ ] 익일 계획서 작성

---

**Team B는 프로젝트의 심장입니다.**
**API 설계가 잘못되면 전체 프로젝트가 지연됩니다.**
**API Contract First 원칙을 반드시 준수하세요.**
