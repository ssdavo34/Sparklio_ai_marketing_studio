# B팀 Agent 확장 플랜 검토 보고서 (A팀 QA 관점)

**작성일**: 2025-11-18 (화) 22:45
**작성자**: A팀 QA 리더
**검토 대상**: `backend/AGENT_EXPANSION_PLAN_2025-11-18.md`
**검토 방법**: QA 및 테스트 관점 집중 분석

---

## 📋 Executive Summary

### 검토 결과: ✅ 승인 (Minor 조정 권장)

- **계획 품질**: ⭐⭐⭐⭐⭐ (5/5) - 매우 체계적이고 현실적
- **QA 준비도**: ⭐⭐⭐⭐ (4/5) - 테스트 일정 명시됨, 세부 전략 필요
- **리스크 관리**: ⭐⭐⭐⭐ (4/5) - 주요 리스크 식별됨, 대응책 구체화 필요
- **일정 현실성**: ⭐⭐⭐⭐⭐ (5/5) - 8주 일정 매우 합리적

### 주요 의견

1. ✅ **우선순위 전략**: P0 → P1-A → P1-B → P2 순서 적절함
2. ✅ **8주 로드맵**: Phase별 2주씩, 현실적인 일정
3. ⚠️ **QA 리소스**: 각 Phase별 2일 테스트, A팀 리소스 확인 필요
4. ⚠️ **테스트 전략**: 단위 테스트 + 통합 테스트 + E2E 테스트 명확화 필요
5. ✅ **기술 스택**: LLM Gateway, Vision API, pgvector 등 검증된 기술 사용

---

## 1️⃣ 플랜 구조 검토

### 1.1 전체 구성: ✅ 우수

**긍정적 요소**:
- 📊 Executive Summary 제공 → 빠른 이해 가능
- 📋 현황 분석 → 확장 목록 → 일정 → 리스크 순서 논리적
- 📈 진행률 명시 (현재 30%, 목표 100%)
- 📐 Mermaid Gantt Chart → 시각화 우수

**개선 제안**:
- 없음. 문서 구조 매우 우수함.

---

## 2️⃣ 현황 분석 검토

### 2.1 구현된 Agent (6개) 분석: ✅ 정확

**검증 결과**:
| Agent | 위치 | 완성도 (B팀 평가) | A팀 검증 |
|-------|------|---------------------|---------|
| Copywriter | `copywriter.py` | 100% | ✅ 일치 |
| Strategist | `strategist.py` | 100% | ✅ 일치 |
| Designer | `designer.py` | 90% | ✅ ComfyUI Live 대기 중 |
| Reviewer | `reviewer.py` | 100% | ✅ 일치 |
| Optimizer | `optimizer.py` | 100% | ✅ 일치 |
| Editor | `editor.py` | 100% | ✅ 일치 |

**A팀 의견**:
- 6개 Agent 모두 정상 작동 확인 (2025-11-18 기준)
- Designer Agent의 90% 평가 적절 (ComfyUI Mock 모드만 테스트됨)

### 2.2 Workflow Orchestrator: ✅ 양호

**3개 워크플로우 검증**:
1. ProductContentWorkflow: ✅ 정상 작동
2. BrandIdentityWorkflow: ✅ 정상 작동
3. ContentReviewWorkflow: ✅ 정상 작동

**A팀 의견**:
- Sequential 실행 잘 작동함
- Parallel 실행은 향후 필요 시 추가

---

## 3️⃣ 확장 Agent 목록 검토

### 3.1 우선순위 적절성: ✅ 적절

**P0 (Phase 1 - 2주)**:
- VisionAnalyzerAgent ⭐⭐⭐⭐⭐

**A팀 의견**:
- ✅ **매우 적절**. Designer Agent 결과물 품질 검증에 필수적
- ✅ Vision API 비용 우려 → Mock 모드 우선 구현 전략 현명함

**P1-A (Phase 2 - 2주)**:
- ScenePlannerAgent
- TemplateAgent

**A팀 의견**:
- ✅ 적절. 영상 콘텐츠 및 템플릿 기능 확장에 필요
- 🟡 ScenePlanner는 비디오 생성 Agent와 함께 테스트 필요 (현재 미구현)

**P1-B (Phase 3 - 2주)**:
- TrendCollectorAgent
- DataCleanerAgent
- EmbedderAgent
- RAGAgent

**A팀 의견**:
- ✅ 매우 적절. 데이터 파이프라인 구축에 필수적
- ⚠️ **QA 리소스 부족 우려**: 4개 Agent를 2일 안에 E2E 테스트 어려움
  - **제안**: Phase 3를 3주로 연장 (테스트 1주 추가)

**P2 (Phase 4 - 2주)**:
- PMAgent
- SecurityAgent
- BudgetAgent
- ADAgent

**A팀 의견**:
- ✅ 적절. System Agent는 우선순위 낮음
- 🟡 PMAgent는 복잡도 높음 → 2주 충분한지 재검토 필요

---

## 4️⃣ 일정 검토 (QA 관점)

### 4.1 Phase 1 (2주) - VisionAnalyzerAgent

**B팀 계획**:
| 작업 | 소요 | 누적 |
|------|------|------|
| 클래스 구현 | 3일 | 3일 |
| Vision API 연동 | 2일 | 5일 |
| 품질 평가 로직 | 2일 | 7일 |
| 통합 테스트 (A팀) | 2일 | 9일 |
| 문서화 | 1일 | 10일 (2주) |

**A팀 의견**:
- ✅ **일정 적절**. 통합 테스트 2일 충분함
- ✅ 10개 테스트 케이스 준비 가능

**A팀 테스트 계획 (Phase 1)**:
- **Day 1**: Mock 모드 테스트 (5개 케이스)
  - 이미지 품질 점수 정확도
  - 품질 평가 항목 검증 (composition, colors, lighting)
  - 에러 핸들링 (잘못된 이미지 URL)
- **Day 2**: Live 모드 테스트 (5개 케이스)
  - Vision API (GPT-4V) 실제 호출
  - 응답 시간 측정 (< 5초)
  - 비용 추적

### 4.2 Phase 2 (2주) - ScenePlanner + Template

**B팀 계획**:
- ScenePlannerAgent: 3일
- TemplateAgent: 3일
- DB 스키마: 1일
- Redis 캐싱: 1일
- 통합 테스트 (A팀): 2일

**A팀 의견**:
- ⚠️ **일정 타이트함**. 2개 Agent + DB + Cache를 8일에 완성 후 2일 테스트는 부담
- **제안**: 통합 테스트 3일로 연장 (총 2.5주)

**A팀 테스트 계획 (Phase 2)**:
- **Day 1**: ScenePlannerAgent 단위 테스트
  - 15초/30초/60초 영상 씬 생성
  - Scene 개수 및 duration 검증
- **Day 2**: TemplateAgent 단위 테스트
  - 업종별 템플릿 생성 (5개 업종)
  - Template 캐싱 및 재사용
- **Day 3**: 통합 테스트 (추가)
  - Template 기반 콘텐츠 생성 워크플로우
  - Redis 캐시 hit rate 측정

### 4.3 Phase 3 (2주) - Intelligence Agents (4종)

**B팀 계획**:
- TrendCollectorAgent: 3일
- DataCleanerAgent: 2일
- EmbedderAgent: 2일
- RAGAgent: 2일
- 통합 테스트 (A팀): 2일

**A팀 의견**:
- ⚠️ **리스크 높음**. 4개 Agent를 2일에 E2E 테스트는 불가능
- **제안**: Phase 3를 **3주로 연장**
  - Week 1: TrendCollector + DataCleaner 구현
  - Week 2: Embedder + RAG 구현
  - **Week 3: E2E 테스트 집중 (1주)**

**A팀 테스트 계획 (Phase 3) - 제안**:
- **Week 3 (5일 테스트)**:
  - Day 1-2: 단위 테스트 (4개 Agent 각각)
  - Day 3-4: **E2E 파이프라인 테스트**
    - Trend 크롤링 → 정제 → 임베딩 → 저장 → RAG 검색
    - 성능 측정 (1000 records/sec)
  - Day 5: 문서화 및 버그 수정

### 4.4 Phase 4 (2주) - System Agents (4종)

**B팀 계획**:
- PMAgent, SecurityAgent, BudgetAgent, ADAgent 각 3일
- 통합 테스트: 2일

**A팀 의견**:
- ✅ 일정 적절 (System Agent는 복잡도 상대적으로 낮음)
- 🟡 PMAgent는 복잡도 높음 → 별도 Phase로 분리 고려

---

## 5️⃣ QA 리소스 및 테스트 전략

### 5.1 A팀 리소스 가용성

**현재 A팀 구성**: 1명 (Claude QA)

**Phase별 소요 리소스**:
| Phase | 테스트 일수 (B팀 계획) | 제안 일수 | 리소스 |
|-------|------------------------|----------|--------|
| Phase 1 | 2일 | 2일 | 1명 × 2일 = ✅ 가능 |
| Phase 2 | 2일 | 3일 | 1명 × 3일 = ✅ 가능 |
| Phase 3 | 2일 | **5일** | 1명 × 5일 = ⚠️ 타이트 |
| Phase 4 | 2일 | 2일 | 1명 × 2일 = ✅ 가능 |

**A팀 의견**:
- Phase 1, 2, 4는 리소스 충분
- **Phase 3는 5일 테스트 권장** (현재 2일은 불가능)

### 5.2 테스트 전략

#### 5.2.1 단위 테스트 (Unit Test)

**책임**: B팀

**도구**: pytest

**커버리지 목표**: 80% 이상

**A팀 요청**:
- 각 Agent마다 최소 5개 테스트 케이스
- Mock 모드 + Live 모드 분리
- CI/CD 파이프라인에 통합

#### 5.2.2 통합 테스트 (Integration Test)

**책임**: A팀 주도, B팀 지원

**도구**: pytest + Docker Compose

**테스트 항목**:
- Agent 간 데이터 전달 (AgentRequest → AgentResponse)
- Workflow Orchestrator 실행
- LLM Gateway, Media Gateway 연동

**예상 소요**:
- Phase 1: 1일
- Phase 2: 2일
- Phase 3: 3일
- Phase 4: 1일

#### 5.2.3 E2E 테스트 (End-to-End Test)

**책임**: A팀 주도

**도구**: curl + Python script

**테스트 시나리오**:
- Generate API 호출 → Agent 실행 → Canvas JSON 생성
- 전체 워크플로우 (Copywriter → Reviewer → Optimizer)
- 성능 측정 (응답 시간, 토큰 사용량)

**예상 소요**:
- Phase 1: 1일
- Phase 2: 1일
- Phase 3: **2일** (데이터 파이프라인 복잡도 높음)
- Phase 4: 1일

---

## 6️⃣ 리스크 분석 (QA 관점)

### 6.1 B팀이 식별한 리스크

| 리스크 | Phase | B팀 대응책 | A팀 평가 |
|--------|-------|-----------|---------|
| Vision API 비용 | Phase 1 | Mock 모드 우선 | ✅ 적절 |
| 크롤링 차단 | Phase 3 | User-Agent 로테이션 | ✅ 적절 |

**A팀 의견**:
- ✅ 주요 리스크 잘 식별됨
- 아래 추가 리스크 고려 필요

### 6.2 A팀 추가 리스크 식별

#### 리스크 1: Phase 3 테스트 리소스 부족 ⚠️ High

**설명**:
- 4개 Agent (TrendCollector, DataCleaner, Embedder, RAG)를 2일에 E2E 테스트 불가능

**영향**:
- 버그 미발견 → 프로덕션 배포 후 장애 발생

**대응책**:
- Phase 3를 3주로 연장 (테스트 1주 추가)
- 또는 A팀 리소스 추가 투입

**담당**: A팀 + B팀 협의

#### 리스크 2: pgvector 성능 검증 미흡 🟡 Medium

**설명**:
- Phase 3의 RAGAgent는 pgvector에 의존
- 검색 성능 (Retrieval@10 > 0.85) 달성 여부 불확실

**영향**:
- RAG 검색 느림 → 사용자 경험 저하

**대응책**:
- Phase 3 시작 전 pgvector 성능 벤치마크 (A팀 실행)
- 인덱스 최적화 전략 수립

**담당**: A팀 (벤치마크) + B팀 (최적화)

#### 리스크 3: PMAgent 복잡도 과소평가 🟡 Medium

**설명**:
- PMAgent는 전체 워크플로우 조율 Agent
- 복잡도 높음 → 2주 안에 완성 어려울 수 있음

**영향**:
- Phase 4 일정 지연

**대응책**:
- PMAgent를 별도 Phase로 분리 (Phase 5, 2주)
- 또는 Phase 4를 3주로 연장

**담당**: B팀 재검토

---

## 7️⃣ 종합 평가 및 권장 조치

### 7.1 종합 평가

| 항목 | 점수 | 비고 |
|------|------|------|
| 계획 품질 | 10/10 | 매우 체계적, 문서화 우수 |
| 우선순위 전략 | 10/10 | P0 → P1 → P2 논리적 |
| 일정 현실성 | 8/10 | Phase 3 타이트함 |
| QA 준비도 | 7/10 | 테스트 일정 명시, 전략 구체화 필요 |
| 리스크 관리 | 8/10 | 주요 리스크 식별, 추가 리스크 대응 필요 |
| **전체 평균** | **8.6/10** | **승인 (조정 권장)** |

### 7.2 A팀 최종 의견: ✅ 승인

**긍정적 평가**:
1. ✅ 8주 로드맵 현실적이고 달성 가능
2. ✅ 우선순위 전략 명확 (P0 → P1 → P2)
3. ✅ 각 Agent의 역할과 KPI 명확히 정의됨
4. ✅ Mock 모드 우선 구현 전략 현명함

**개선 권장사항**:
1. ⚠️ **Phase 3를 3주로 연장** (테스트 1주 추가)
2. ⚠️ **Phase 2 통합 테스트 3일로 연장**
3. 🟡 **PMAgent 일정 재검토** (별도 Phase 고려)

### 7.3 권장 조정 일정

**원안 (B팀)**:
- Phase 1: 2주
- Phase 2: 2주
- Phase 3: 2주
- Phase 4: 2주
- **총 8주**

**A팀 제안**:
- Phase 1: 2주 (변경 없음)
- Phase 2: **2.5주** (+3일 테스트)
- Phase 3: **3주** (+1주 테스트)
- Phase 4: 2주 (변경 없음)
- **총 9.5주**

**영향**:
- 완료일: 2026-01-13 → 2026-02-03 (+3주)
- 비용: 일정 연장으로 인한 인건비 증가 (약 10%)

**A팀 최종 권장**:
- **Option 1**: 9.5주 일정 채택 (품질 우선)
- **Option 2**: 8주 유지 + A팀 리소스 추가 투입 (외부 QA 1명)
- **Option 3**: Phase 3, 4를 병렬 진행 (리스크 높음, 비추천)

---

## 8️⃣ A팀 액션 아이템

### 8.1 즉시 실행 (P0)

1. ✅ **본 검토 보고서 작성 완료** (2025-11-18)
2. ⬜ **B팀, C팀과 공유** (2025-11-19)
3. ⬜ **일정 조정 협의** (2025-11-19)

### 8.2 Phase 1 시작 전 (P1)

1. ⬜ **Phase 1 테스트 계획서 작성**
   - 파일: `docs/testing/PHASE1_TEST_PLAN.md`
   - 내용: 10개 테스트 케이스 상세 정의
   - 담당: A팀
   - 기한: 2025-11-22

2. ⬜ **VisionAnalyzerAgent Mock 데이터 준비**
   - 테스트용 이미지 10개 (고품질 5개, 저품질 5개)
   - 기대 품질 점수 사전 정의
   - 담당: A팀
   - 기한: 2025-11-22

### 8.3 Phase 3 시작 전 (P1)

1. ⬜ **pgvector 성능 벤치마크**
   - 10,000개 레코드 삽입 속도
   - 검색 속도 (top_k=10)
   - 담당: A팀
   - 기한: 2025-12-13

2. ⬜ **크롤링 테스트 환경 구축**
   - Naver, Instagram Mock API
   - 담당: A팀 + B팀
   - 기한: 2025-12-13

---

## 9️⃣ 다음 단계

### A팀

1. ✅ 본 검토 보고서 작성 완료
2. ⬜ B팀, C팀과 일정 조정 협의
3. ⬜ Phase 1 테스트 계획서 작성 시작

### B팀

1. ⬜ A팀 검토 의견 검토
2. ⬜ 일정 조정안 검토 (9.5주 vs 8주)
3. ⬜ Phase 1 착수 준비

### 협업

1. ⬜ 2025-11-19 (수) 온라인 미팅 (A팀 + B팀)
   - 안건: 일정 조정, QA 리소스, 테스트 전략
   - 시간: 30분
2. ⬜ Phase별 Kick-off 미팅 (각 Phase 시작 전 1일)

---

## 📚 참고 문서

1. **B팀 확장 플랜**: `backend/AGENT_EXPANSION_PLAN_2025-11-18.md` ⭐
2. **A팀 API 검토**: `docs/A_TEAM_API_CONTRACT_REVIEW_2025-11-18.md`
3. **스펙 문서**: `docs/AGENTS_SPEC.md`
4. **B팀 EOD**: `backend/EOD_REPORT_2025-11-18.md`

---

**보고서 종료**

**다음 작업**: Phase 1 테스트 계획서 작성 (`docs/testing/PHASE1_TEST_PLAN.md`)

---

**작성자**: A팀 QA 리더
**검토자**: B팀 Backend 리더 (검토 요청)
**최종 업데이트**: 2025-11-18 (화) 22:45

**A팀 결론**: ✅ **승인 (일정 조정 권장: 8주 → 9.5주)**
