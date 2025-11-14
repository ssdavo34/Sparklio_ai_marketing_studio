# [Team A] 익일 작업 계획서

**계획 대상 날짜**: 2025-11-15 (토요일)
**계획서 작성 시간**: 2025-11-14 (금요일) 16:25
**작성자**: Team A (Docs & Architecture)
**브랜치**: docs/phase0-completion

---

## 📋 오늘 완료한 작업 (3줄 요약)

1. 작업 규정집 및 템플릿 전체 완성 - 12대 규정, 보고서/계획서 템플릿 작성
2. Team A/B/C 작업 지시서 완성 - 90일 로드맵 및 상세 작업 범위 정의
3. Master TODO 및 상세 작업 계획서 완성 - 37개 작업 목록화, Phase 1~5 타임라인

---

## 🎯 내일 작업 목록 (우선순위 순)

### 우선순위 1 (긴급 - 반드시 완료)

#### 1. [P0-A1] Model Catalog 통일
- **예상 소요 시간**: 2시간
- **작업 내용**:
  - `Sparklio_V4_PRD_Final.md` Section 5 업데이트
    - VEo3, AnimateDiff, ComfyUI 신규 모델 추가
    - 기존 Text/Image/Video 카탈로그에 통합
  - `V4.4_PRD.md` Section 5.1 업데이트
    - 누락된 GPT-4.1, GPT-4-Turbo, DALL·E 2 복원
    - 비용 단가 통일 (LLM_ROUTER_POLICY.md 기준)
  - `LLM_ROUTER_POLICY.md` 최종 검토
    - Model Catalog의 Single Source of Truth로 확정
- **목표**:
  - 3개 문서의 Model Catalog 100% 일치
  - LLM_ROUTER_POLICY.md를 기준 문서로 확립
- **산출물**:
  - `docs/PRD/Sparklio_V4_PRD_Final.md` (업데이트)
  - `docs/V4.4_PRD.md` (업데이트)
  - `docs/PHASE0/LLM_ROUTER_POLICY.md` (업데이트)

#### 2. [P0-A2] Agent 목록 통일
- **예상 소요 시간**: 1시간 30분
- **작업 내용**:
  - `V4.4_PRD.md` Section 6 전체 업데이트
    - Creation Agents (9개) 전체 명시
      - StrategistAgent, CopywriterAgent, VisionGeneratorAgent, VisionAnalyzerAgent
      - ScenePlannerAgent, StoryboardBuilderAgent, VideoDirectorAgent, VideoReviewerAgent, TemplateAgent
    - Intelligence Agents (11개) 추가
      - TrendCollectorAgent, DataCleanerAgent, EmbedderAgent, IngestorAgent, ReviewerAgent
      - PerformanceAnalyzerAgent, SelfLearningAgent, BrandModelUpdaterAgent, RAGAgent, TrendAgent, DataCollectorAgent
    - System Agents (4개) 추가
      - PMAgent, SecurityAgent, BudgetAgent, ADAgent
  - AGENTS_SPEC.md와 100% 일치 확인
- **목표**:
  - V4.4 PRD에 24개 에이전트 전체 반영
  - 각 에이전트별 역할 및 입출력 명시
- **산출물**:
  - `docs/V4.4_PRD.md` Section 6 (업데이트)

#### 3. [P0-A3] PPC Ads 섹션 기존 PRD 반영
- **예상 소요 시간**: 2시간
- **작업 내용**:
  - `Sparklio_V4_PRD_Final.md` Section 8에 "8.1 PPC Ads Publishing" 추가
    - V4.4 PRD Section 8.1 내용 전체 복사
    - 입력 (목적/예산/지역/기간/입찰전략/랜딩/전환/키워드/소재)
    - 처리 단계 (8단계 플로우)
      1. 정책 가드
      2. 캠페인 설계
      3. 그룹/키워드 생성
      4. 소재 생성/매핑
      5. Review Buffer
      6. 집행/스케줄
      7. 관측/최적화
      8. 이상징후 제어
    - 출력 (캠페인/그룹/광고 ID, CTR/CPC/CPA/ROAS)
    - API 계약 (4개 엔드포인트)
  - Google Ads, Naver, Kakao 플랫폼 명시
- **목표**:
  - PPC Ads 기능을 Sparklio 공식 제품 범위로 확정
  - 기존 PRD에 완전 통합
- **산출물**:
  - `docs/PRD/Sparklio_V4_PRD_Final.md` Section 8 (업데이트)

---

### 우선순위 2 (중요 - 가능하면 완료)

#### 4. P0 문서 최종 검토 및 Git 커밋
- **예상 소요 시간**: 30분
- **작업 내용**:
  - 3개 문서 통합 결과 재확인
  - 날짜/시간 최종 업데이트
  - Git 커밋 메시지 작성
- **목표**:
  - P0 완료 커밋
- **산출물**:
  - Git 커밋 (P0-A1, P0-A2, P0-A3)

---

### 우선순위 3 (일반 - 시간 남으면 진행)

#### 5. P1 스펙 문서 작성 준비
- **예상 소요 시간**: 1시간
- **작업 내용**:
  - VIDEO_PIPELINE_SPEC.md 구조 초안
  - COMFYUI_INTEGRATION.md 구조 초안
  - MEETING_AI_SPEC.md 구조 초안
- **목표**:
  - 다음 주 P1 작업 준비

---

## 🔗 의존성 (다른 팀 작업 대기)

### Team B 대기 사항
- 없음 (Team A가 P0 문서 완성 후 Team B 작업 시작 가능)

### Team C 대기 사항
- 없음 (Team C는 독립적으로 Next.js 셋업 가능)

---

## 📚 필요한 리소스

### 문서
- [x] `docs/PRD/Sparklio_V4_PRD_Final.md` (기존 PRD)
- [x] `docs/V4.4_PRD.md` (새 PRD)
- [x] `docs/PHASE0/LLM_ROUTER_POLICY.md` (LLM Router 정책)
- [x] `docs/PHASE0/AGENTS_SPEC.md` (에이전트 명세)

### API / 데이터
- 해당 없음 (문서 작업)

### 개발 환경
- [x] VSCode
- [x] SSD 연결 (K: 드라이브)

### 외부 서비스
- 해당 없음

---

## 🚨 예상되는 블로커

### 1. Model Catalog 비용 단가 불일치
- **내용**: 3개 문서에서 모델 비용이 서로 다를 가능성
- **발생 확률**: 중간
- **영향**:
  - 작업 지연 예상 시간: 30분
- **사전 대응 방안**:
  - LLM_ROUTER_POLICY.md를 기준으로 통일
  - 불일치 발견 시 즉시 수정

### 2. Agent 목록 누락/추가 발견
- **내용**: V4.4 PRD와 AGENTS_SPEC.md 간 불일치
- **발생 확률**: 낮음
- **사전 대응 방안**:
  - AGENTS_SPEC.md를 기준으로 24개 전체 확인

---

## ⏰ 예상 일정

| 시간 | 작업 | 비고 |
|------|------|------|
| 09:00 - 09:30 | 작업 시작 준비 (필독 문서 확인) | 규정 12 준수 |
| 09:30 - 11:30 | [P0-A1] Model Catalog 통일 | 우선순위 1 |
| 11:30 - 13:00 | [P0-A2] Agent 목록 통일 | 우선순위 1 |
| 13:00 - 14:00 | 점심 휴식 | |
| 14:00 - 16:00 | [P0-A3] PPC Ads 섹션 반영 | 우선순위 1 |
| 16:00 - 16:30 | P0 문서 최종 검토 & Git 커밋 | 우선순위 2 |
| 16:30 - 17:30 | (선택) P1 스펙 문서 준비 | 우선순위 3 |
| 17:30 - 18:00 | 작업 보고서 & 익일 계획서 작성 | 규정 7, 11 |

**총 예상 작업 시간**: 6시간 (휴식 제외)

---

## 🎯 내일의 목표 (핵심 KPI)

1. **완료 목표**: P0-A1, P0-A2, P0-A3 100% 완료
2. **커밋 목표**: 최소 3회 커밋 (각 작업별 1회)
3. **문서화 목표**: Model Catalog, Agent 명세, PPC Ads 통합 완료
4. **다음 단계 준비**: P1 스펙 문서 구조 초안 (선택)

---

## 💡 내일 유의사항

### 작업 우선순위
- **P0 작업 완료가 최우선**
- P0 완료 후 Team B가 Smart LLM Router 구현 시작 가능
- P0 완료 후 Team C는 독립적으로 Next.js 셋업 가능

### 규정 준수
- 작업 완료 시 즉시 Git 커밋 (규정 7)
- 문서 수정 시 날짜/시간 업데이트 (규정 1)
- 한글로 작성 (규정 2)

### 협업 포인트
- P0 완료 후 Team B/C에게 공지
- API Contract는 Team B가 작성 (대기)

---

## 📝 작업 시작 체크리스트 (내일 아침 확인용)

### 필독 문서 확인 (규정 12)
- [ ] `docs/WORK_REGULATIONS.md` 확인
- [ ] `docs/API_CONTRACTS/changelog.md` 확인
- [ ] `docs/WORK_PLANS/MASTER_TODO.md` 확인
- [ ] `docs/WORK_REPORTS/2025-11-14_Team_A_Report.md` (오늘 작성한 보고서) 확인
- [ ] `docs/WORK_PLANS/NEXT_DAY/2025-11-15_Team_A_Plan.md` (본 문서) 확인
- [ ] `docs/WORK_PLANS/DETAILED_WORK_PLAN.md` 확인

### 환경 확인
- [ ] SSD 연결 확인 (K: 드라이브)
- [ ] Git 상태 확인: `git status`
- [ ] 브랜치 확인: `git branch` (docs/phase0-completion)

### 시간 확인 (규정 1)
```bash
powershell -Command "Get-Date -Format 'yyyy-MM-dd (dddd) HH:mm:ss'"
```

---

**작성 완료 후 Git 커밋 필수:**
```bash
git add docs/WORK_PLANS/NEXT_DAY/
git commit -m "[2025-11-14 16:30] docs: 익일(11/15) Team A 작업 계획서 작성"
git push origin docs/phase0-completion
```
