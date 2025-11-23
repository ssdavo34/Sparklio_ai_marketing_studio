# B팀 작업 지침서 요약본

**기간**: 2025-11-25 ~ 2025-12-06 (2주)
**목표**: StrategistAgent 70% Pass Rate 달성 + 인프라 안정화
**우선순위**: 🔴 High

---

## 📋 즉시 조치 사항 (1-2일 이내)

### 1. TrendCollector 테스트 수정 ⚡
- **파일**: `backend/tests/test_intelligence_agents.py`
- **문제**: `analyze_trends` Task 미지원 오류
- **해결**: 테스트를 지원 Task로 변경
  ```python
  # 현재 (실패)
  task = "analyze_trends"

  # 변경 후 (성공)
  task = "category_trends"  # 또는 collect_trends, competitor_trends
  ```
- **담당**: Backend 개발자
- **기한**: 내일까지
- **검증**: `pytest tests/test_intelligence_agents.py::test_trend_collector_analyze_trends -v`

### 2. Docker Credential 이슈 해결 🐳
- **문제**: `docker-credential-desktop` 경로 오류
- **해결 방안**:
  ```bash
  # Mac Mini 서버에서 실행
  # Option 1: config 수정
  vi ~/.docker/config.json
  # "credsStore": "desktop" 라인 제거 또는 주석 처리

  # Option 2: Docker Desktop 재설치
  ```
- **담당**: DevOps / Backend
- **기한**: 2일 이내
- **검증**: `docker compose up -d` 성공 확인

---

## 🚀 Week 1 작업 (2025-11-25 ~ 2025-11-29)

### 화요일 (11/26): Pydantic 모델 작성
- **파일**: `backend/app/schemas/strategist.py` (신규 생성)
- **내용**:
  ```python
  # CampaignStrategyInputV1
  class CampaignStrategyInputV1(BaseModel):
      brand_name: str
      product_category: str
      target_audience: str
      campaign_objective: str
      budget_range: str
      tone: str
      # ... (전체는 STRATEGIST_AGENT_SPEC_V1.md 참고)

  # CampaignStrategyOutputV1
  class CampaignStrategyOutputV1(BaseModel):
      core_message: str = Field(..., min_length=20, max_length=150)
      positioning: str = Field(..., min_length=20, max_length=150)
      target_insights: List[str] = Field(..., min_items=2, max_items=5)
      big_idea: str = Field(..., min_length=10, max_length=100)
      strategic_pillars: List[StrategicPillar] = Field(..., min_items=2, max_items=4)
      channel_strategy: List[ChannelStrategy] = Field(..., min_items=2, max_items=5)
      funnel_structure: FunnelStructure
      risk_factors: List[str] = Field(..., min_items=1, max_items=5)
      success_metrics: List[str] = Field(..., min_items=2, max_items=5)
  ```
- **참고**: [STRATEGIST_AGENT_SPEC_V1.md](STRATEGIST_AGENT_SPEC_V1.md) Line 87-183

### 목요일 (11/28): StrategistAgent 구현
- **파일**: `backend/app/services/agents/strategist.py`
- **내용**:
  1. `campaign_strategy` Task 구현
  2. A팀이 작성한 프롬프트 통합 (PROMPT_STRATEGIST_CAMPAIGN_V1.md)
  3. LLM Gateway 연결
  4. Retry Logic 구현 (temperature 0.4 → 0.5 → 0.6, 3회)
- **참고 코드**: `copywriter.py` 구조 참고
- **검증**: 단위 테스트 작성 및 실행

### 금요일 (11/29): 4단계 Validation Pipeline 통합
- **파일**: `backend/app/services/validation/output_validator.py`
- **내용**:
  1. `strategist.campaign_strategy` 검증 로직 추가
  2. Schema → Length → Language → Quality 순서 구현
  3. Semantic Similarity 준비 (Week 2에 활용)
- **검증**: Validation 단위 테스트

---

## 🎯 Week 2 작업 (2025-12-02 ~ 2025-12-06)

### 월요일 (12/2): Golden Set Validator 실행
- **명령어**:
  ```bash
  cd backend
  python tests/golden_set_validator.py \
    --agent strategist \
    --report json \
    --output tests/golden_set_report_STRATEGIST_V1_2025-12-02.json
  ```
- **검증 기준**:
  - Golden Set 5개 케이스 (A팀이 금요일까지 작성)
  - 각 케이스별 점수 및 Pass/Fail 확인
- **예상 결과**: 초기 Pass Rate 30-40% (정상)

### 화요일-수요일 (12/3-12/4): 프롬프트 튜닝 & 70% 달성
- **작업**:
  1. 실패 케이스 분석 (어떤 필드에서 실패했는지)
  2. A팀과 협업하여 프롬프트 개선
  3. Semantic Similarity 가중치 조정
  4. 재실행 및 검증
- **목표**: **Pass Rate ≥ 70%, Avg Score ≥ 7.0/10**
- **최종 검증**:
  ```bash
  python tests/golden_set_validator.py \
    --agent strategist \
    --report json \
    --output tests/golden_set_report_STRATEGIST_FINAL_2025-12-04.json
  ```

### 목요일-금요일 (12/5-12/6): Production Ready 준비
- **작업**:
  1. 최종 결과 리포트 작성 (STRATEGIST_PRODUCTION_READY_2025-12-06.md)
  2. API 엔드포인트 테스트 (C팀과 협업)
  3. 성능 측정 (응답 시간, 비용)
  4. Production Ready 마킹 (70% 달성 시)

---

## 📊 병행 작업 (2주 내)

### 코드 커버리지 개선 (35% → 50%)
- **우선순위 영역**:
  1. `app/services/agents/strategist.py` (신규 Agent)
  2. `app/services/agents/copywriter.py` (기존 P0 Agent)
  3. `app/services/llm/gateway.py` (핵심 로직)
- **목표**: 각 Agent별 70% 커버리지
- **도구**: `pytest --cov` 활용

### 레거시 코드 정리
- **대상**: `app/generators/` (커버리지 0%)
- **1단계**: 사용 여부 조사
  ```bash
  # API 호출 확인
  grep -r "generators" backend/app/api/

  # 프론트엔드 호출 확인 (C팀과 협업)
  ```
- **2단계**: 미사용 확인 시 완전 삭제
  - 브랜치 백업: `git checkout -b archive/generators-legacy`
  - 삭제: `git rm -rf app/generators/`
- **기한**: 2주 이내

---

## ✅ 체크리스트

### Week 1 마감 (11/29 금요일)
- [ ] TrendCollector 테스트 수정 완료
- [ ] Docker 환경 정상화
- [ ] Pydantic 모델 작성 (CampaignStrategyInputV1, OutputV1)
- [ ] StrategistAgent 구현 (campaign_strategy Task)
- [ ] 4단계 Validation Pipeline 통합
- [ ] 단위 테스트 작성

### Week 2 마감 (12/6 금요일)
- [ ] Golden Set Validator 실행 (초기)
- [ ] **Pass Rate ≥ 70% 달성** ⭐
- [ ] **Avg Score ≥ 7.0/10 달성** ⭐
- [ ] Production Ready 리포트 작성
- [ ] API 엔드포인트 정상 동작 확인
- [ ] 코드 커버리지 ≥ 50%
- [ ] 레거시 코드 정리 완료

---

## 📞 커뮤니케이션

### Daily Standup (매일 오전 10시)
- 어제 완료: ?
- 오늘 계획: ?
- 블로커: ?

### Weekly Review (금요일 오후 4시)
- Week 1 (11/29): 구현 완료 확인
- Week 2 (12/6): 70% 달성 확인 및 회고

### Slack 채널
- **#backend-dev**: 일반 개발 논의
- **#agent-quality**: A팀과 품질 관련 논의 (프롬프트, Golden Set)

### 담당자 연락
- **A팀 (QA/Architecture)**: 프롬프트, Golden Set, 품질 기준 문의
- **C팀 (Frontend)**: API 연동, UI 테스트 협업

---

## 🎁 참고 문서

### 필수
- [STRATEGIST_AGENT_SPEC_V1.md](STRATEGIST_AGENT_SPEC_V1.md) - 완전한 기술 사양서
- [STRATEGIST_AGENT_WORK_ORDER.md](STRATEGIST_AGENT_WORK_ORDER.md) - 상세 작업 지시서
- [PROJECT_STATUS_REPORT_2025-11-23.md](PROJECT_STATUS_REPORT_2025-11-23.md) - 전체 프로젝트 현황

### 참고
- [COPYWRITER_PRODUCTION_READY_2025-11-23.md](COPYWRITER_PRODUCTION_READY_2025-11-23.md) - Copywriter 성공 사례
- [AGENT_QUALITY_ROLLOUT_PLAN_2025-11.md](AGENT_QUALITY_ROLLOUT_PLAN_2025-11.md) - 장기 확장 계획

### 코드 참고
- `backend/app/services/agents/copywriter.py` - Agent 구조 참고
- `backend/app/services/validation/output_validator.py` - Validation 로직
- `backend/tests/golden_set_validator.py` - Golden Set 검증

---

## 💡 성공 Tips

1. **CopywriterAgent 참고하기**
   - 이미 70% 달성한 성공 케이스
   - 코드 구조, Retry Logic, Validation 로직 재사용

2. **A팀과 긴밀히 협업**
   - 프롬프트 품질이 Pass Rate의 50% 결정
   - 실패 케이스 발견 시 즉시 공유

3. **점진적 개선**
   - Week 1: 구현 완료 (Pass Rate 30-40% OK)
   - Week 2 초반: 50-60% 목표
   - Week 2 후반: 70% 최종 달성

4. **테스트 우선**
   - 코드 작성 전 단위 테스트 작성
   - CI 통과 확인 후 PR 생성

---

**화이팅! 2주 후 StrategistAgent Production Ready를 기대합니다!** 🚀

---

**작성일**: 2025-11-23
**작성자**: A팀 (QA & Architecture)
**버전**: v1.0
