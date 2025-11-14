# Sparklio AI Marketing Studio - 작업 규정집

**문서 버전**: v1.0
**최초 작성**: 2025-11-14 (금요일) 15:59
**최종 수정**: 2025-11-14 (금요일) 15:59
**작성자**: Team A (Docs & Architecture)

---

## 📌 프로젝트 개요

- **프로젝트명**: Sparklio AI Marketing Studio V4.4
- **목표**: 90일 내 MVP 완성 (2025-11-14 ~ 2026-02-11)
- **팀 구성**: 3-Team 병렬 작업 (Team A/B/C)
- **개발 환경**:
  - 주중(학원): 노트북 + SSD 600GB (K: 드라이브)
  - 주말/저녁(집): 데스크탑 RTX 4070 + 동일 SSD (K: 드라이브)
  - 24/7 서버: Mac mini M2 (woosun@100.123.51.5)

---

## ✅ 12대 작업 규정

### 규정 1: 시간 확인 필수 및 문서 날짜 기재
- 모든 작업 시작 시 현재 시간 확인: `powershell -Command "Get-Date -Format 'yyyy-MM-dd (dddd) HH:mm:ss'"`
- 모든 문서 상단에 다음 형식 필수 기재:
  ```markdown
  **최초 작성**: 2025-11-14 (금요일) 15:30
  **최종 수정**: 2025-11-14 (금요일) 16:45
  ```
- Git 커밋 메시지에도 날짜 포함: `[2025-11-14 15:30] feat: Smart LLM Router 구현 완료`

### 규정 2: 문서와 작업 보고는 항상 한글로
- 모든 문서(*.md)는 **한글 작성** 원칙
- 기술 용어는 영문 병기: `스마트 LLM 라우터 (Smart LLM Router)`
- 작업 보고서, 커밋 메시지, TODO 모두 한글 사용
- 예외: 코드, API 문서, 기술 스펙은 영문 허용

### 규정 3: 코드는 간결하게 작성
- 불필요한 추상화 금지 (YAGNI 원칙)
- 함수는 50줄 이내로 제한
- 중복 코드는 즉시 리팩토링
- 복잡한 로직은 주석으로 설명 추가

### 규정 4: 주석 필수 작성 및 정확성 보장
- 모든 함수/클래스에 JSDoc/TSDoc 주석 필수
  ```typescript
  /**
   * LLM 라우터: 사용자 요청을 최적 모델로 라우팅
   * @param request - 사용자 입력 및 컨텍스트
   * @param mode - 라우팅 모드 (draft_fast | balanced | high_fidelity 등)
   * @returns 선택된 모델 정보 및 예상 비용
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
- **주석 작성 시 주의사항**:
  - 주석과 실제 코드가 불일치하면 즉시 수정
  - 코드 변경 시 관련 주석도 함께 업데이트
  - 주석이 코드보다 길면 코드 리팩토링 고려

### 규정 5: 규정은 100% 준수
- 본 규정집(`WORK_REGULATIONS.md`)은 **절대 규칙**
- 규정 위반 시 작업 중단 후 즉시 수정
- 규정 변경이 필요하면 Team A가 승인 후 전체 공지

### 규정 6: 테스트는 실전처럼
- 모든 기능에 단위 테스트 작성 (Jest/Vitest)
- E2E 테스트는 실제 사용자 시나리오 기반
- 테스트 실패 시 절대 merge 금지
- 테스트 커버리지 목표: 80% 이상

### 규정 7: 에러 대응 속도 향상 - 작업 후 보고서 작성 및 Git 커밋
- 매 작업 단위 완료 시 즉시 보고서 작성: `docs/WORK_REPORTS/2025-11-14_Team_A_Report.md`
- 보고서 작성 후 즉시 Git 커밋:
  ```bash
  git add .
  git commit -m "[2025-11-14 16:30] docs: P0 Model Catalog 통합 완료"
  git push origin [branch-name]
  ```
- VSCode 재부팅/PC 재부팅 시에도 작업 이력 유지
- 에러 발생 시 `docs/WORK_REPORTS/ERROR_LOG.md`에 즉시 기록

### 규정 8: SSD가 원본 - Git Pull 금지, Push만 허용
- **K: 드라이브 (SSD 600GB)가 항상 원본(Single Source of Truth)**
- Git Pull 절대 금지 (충돌 방지)
- 작업 흐름:
  ```bash
  # 학원 노트북에서 작업 완료 후
  git add .
  git commit -m "[2025-11-14 18:00] feat: Agent A2A Protocol 구현"
  git push origin feature/backend-core

  # 집 데스크탑에서 작업 시작 전 (SSD 연결)
  # Git Pull 하지 않음! SSD가 이미 최신 상태
  git status  # 확인만
  ```
- 원격 저장소는 **백업 용도**로만 사용
- 충돌 발생 시 **SSD 내용이 무조건 우선**

### 규정 9: Mac mini 서버 접속
- 접속 방법: `ssh woosun@100.123.51.5`
- Mac mini는 독립적으로 Git Pull 불가 (Team A가 동기화 담당)
- Team A가 주 1회 (금요일 통합 시) Mac mini에 배포:
  ```bash
  # Team A 작업
  ssh woosun@100.123.51.5
  cd /path/to/sparklio
  git fetch origin main
  git reset --hard origin/main
  npm install
  npm run build
  pm2 restart sparklio
  ```

### 규정 10: Team A가 Mac mini 서버 동기화 담당
- Team A만 Mac mini 서버 접근 권한 보유
- 매주 금요일 통합 후 Mac mini 배포
- Mac mini 상태 확인: Team A가 매일 09:00 헬스체크 수행
- Mac mini 장애 시 Team A가 즉시 복구

### 규정 11: 익일 작업 계획서 필수 작성
- 당일 작업 종료 시 **익일 작업 계획서** 필수 작성
- 파일 위치: `docs/WORK_PLANS/NEXT_DAY/2025-11-15_Team_A_Plan.md`
- 템플릿: `docs/NEXT_DAY_PLAN_TEMPLATE.md` 참조
- 작성 내용:
  - 오늘 완료한 작업 (3줄 요약)
  - 내일 작업 목록 (우선순위 순)
  - 예상 소요 시간
  - 의존성 (다른 팀 작업 대기 여부)
  - 필요한 리소스 (문서, API, 테스트 데이터 등)
- 작성 후 Git 커밋 필수:
  ```bash
  git add docs/WORK_PLANS/NEXT_DAY/
  git commit -m "[2025-11-14 18:30] docs: 익일(11/15) 작업 계획서 작성"
  git push origin [branch-name]
  ```

### 규정 12: 작업 시작 시 필독 문서 확인
- 매일 작업 시작 시 다음 순서로 문서 확인:
  1. **규정집**: `docs/WORK_REGULATIONS.md` (본 문서)
  2. **API 계약서**: `docs/API_CONTRACTS/` (최신 버전)
  3. **마스터 TODO**: `docs/WORK_PLANS/MASTER_TODO.md`
  4. **전일 작업 보고서**: `docs/WORK_REPORTS/2025-11-13_Team_A_Report.md`
  5. **당일 작업 계획서**: `docs/WORK_PLANS/NEXT_DAY/2025-11-14_Team_A_Plan.md`
  6. **최신 업데이트된 계획서**: `docs/WORK_PLANS/DETAILED_WORK_PLAN.md`
- 확인 완료 후 체크리스트 작성:
  ```markdown
  ## 2025-11-14 (금요일) 작업 시작 체크리스트
  - [x] WORK_REGULATIONS.md 확인
  - [x] API_CONTRACTS 최신 버전 확인
  - [x] MASTER_TODO 현재 상태 확인
  - [x] 전일(11/13) 작업 보고서 숙지
  - [x] 당일(11/14) 작업 계획서 확인
  - [x] DETAILED_WORK_PLAN 우선순위 확인
  ```

---

## 🔄 Git Workflow (SSD 기반)

### Branch 전략
```
main (원격 백업용, SSD가 원본)
├─ docs/phase0-completion (Team A)
├─ feature/backend-core (Team B)
└─ feature/frontend-ui (Team C)
```

### 작업 흐름
```bash
# 1. 작업 시작 (SSD 연결 확인)
cd K:\sparklio_ai_marketing_studio
git status

# 2. 작업 진행
# (코드 작성, 문서 업데이트 등)

# 3. 작업 완료 후 즉시 커밋
git add .
git commit -m "[2025-11-14 16:30] feat: Smart Router 구현 완료"

# 4. 원격 저장소에 백업 (Push만, Pull 금지!)
git push origin [branch-name]

# 5. 작업 보고서 작성
# docs/WORK_REPORTS/2025-11-14_Team_A_Report.md

# 6. 익일 작업 계획서 작성
# docs/WORK_PLANS/NEXT_DAY/2025-11-15_Team_A_Plan.md

# 7. 최종 커밋 & 마감
git add docs/
git commit -m "[2025-11-14 18:30] docs: 작업 보고서 및 익일 계획서 작성"
git push origin [branch-name]
```

### 환경 전환 시 (노트북 ↔ 데스크탑)
```bash
# 노트북에서 작업 종료 후
git push origin [branch-name]  # 원격 백업

# SSD를 데스크탑에 연결
# (K: 드라이브가 자동으로 최신 상태 유지)

# 데스크탑에서 작업 시작
cd K:\sparklio_ai_marketing_studio
git status  # 확인만! Pull 하지 않음
```

### 주간 통합 (매주 금요일)
```bash
# Team A 주도
cd K:\sparklio_ai_marketing_studio
git checkout main

# 각 팀 브랜치 merge
git merge docs/phase0-completion
git merge feature/backend-core
git merge feature/frontend-ui

# 통합 테스트
npm run test:integration
npm run build

# 성공 시 원격에 Push
git push origin main

# Mac mini 서버 배포
ssh woosun@100.123.51.5
cd /path/to/sparklio
git fetch origin main
git reset --hard origin/main
npm install
npm run build
pm2 restart sparklio
```

---

## 📁 문서 구조

```
K:\sparklio_ai_marketing_studio\
├─ docs\
│   ├─ WORK_REGULATIONS.md (본 문서 - 작업 규정집)
│   ├─ API_CONTRACTS\
│   │   ├─ README.md
│   │   ├─ llm_router.json
│   │   ├─ agents.json
│   │   └─ video_pipeline.json
│   ├─ WORK_REPORTS\
│   │   ├─ 2025-11-14_Team_A_Report.md
│   │   ├─ 2025-11-14_Team_B_Report.md
│   │   └─ ERROR_LOG.md
│   ├─ WORK_PLANS\
│   │   ├─ MASTER_TODO.md
│   │   ├─ DETAILED_WORK_PLAN.md
│   │   ├─ TEAM_A_INSTRUCTIONS.md
│   │   ├─ TEAM_B_INSTRUCTIONS.md
│   │   ├─ TEAM_C_INSTRUCTIONS.md
│   │   └─ NEXT_DAY\
│   │       ├─ 2025-11-15_Team_A_Plan.md
│   │       ├─ 2025-11-15_Team_B_Plan.md
│   │       └─ 2025-11-15_Team_C_Plan.md
│   ├─ PHASE0\ (기존 설계 문서)
│   └─ PRD\ (제품 요구사항 문서)
└─ src\ (소스 코드)
```

---

## 🚨 에러 대응 프로토콜

### VSCode 재부팅 시
1. SSD 연결 확인 (K: 드라이브)
2. `git status` 로 작업 상태 확인
3. `docs/WORK_REPORTS/[오늘날짜]_Team_X_Report.md` 최신 보고서 확인
4. 마지막 커밋 이후 작업 내용 복구
5. 작업 재개

### PC 재부팅 시
1. SSD 연결 확인
2. VSCode 재실행
3. `git log -5` 로 최근 커밋 확인
4. 익일 작업 계획서 확인 후 작업 재개

### Git Push 실패 시
1. 인터넷 연결 확인
2. 로컬 커밋은 유지된 상태이므로 작업 계속 가능
3. 연결 복구 후 다시 Push
4. 원격 저장소는 백업 용도이므로 Push 실패해도 작업 진행 가능

### SSD 인식 불가 시
1. **긴급 상황** - SSD가 원본이므로 즉시 복구 필요
2. 다른 PC에서 SSD 연결 시도
3. 복구 불가 시 원격 저장소에서 클론:
   ```bash
   git clone [repo-url] K:\sparklio_ai_marketing_studio
   ```
4. Team A에게 즉시 보고

---

## 📊 작업 보고서 작성 규칙

### 보고서 파일명
- 형식: `YYYY-MM-DD_Team_X_Report.md`
- 예시: `2025-11-14_Team_A_Report.md`

### 보고서 템플릿
```markdown
# [Team X] 작업 보고서

**작업 날짜**: 2025-11-14 (금요일)
**작성 시간**: 18:30
**작성자**: Team A
**브랜치**: docs/phase0-completion

---

## ✅ 완료 작업

1. **작업명**: Model Catalog 통합
   - 소요 시간: 2시간 30분
   - 변경 파일:
     - `docs/PRD/Sparklio_V4_PRD_Final.md`
     - `docs/PHASE0/LLM_ROUTER_POLICY.md`
   - 커밋 해시: `abc1234`
   - 상태: ✅ 완료

2. **작업명**: Agent 목록 통일
   - 소요 시간: 1시간 45분
   - 변경 파일:
     - `docs/V4.4_PRD.md`
   - 커밋 해시: `def5678`
   - 상태: ✅ 완료

---

## 🚧 진행 중 작업

1. **작업명**: PPC Ads 섹션 추가
   - 진행률: 60%
   - 예상 완료: 2025-11-15 10:00
   - 블로커: 없음

---

## 🐛 발견된 에러

1. **에러 내용**: VSCode 재부팅 (15:30)
   - 원인: 메모리 부족
   - 해결: VSCode 재시작 후 작업 재개
   - 손실된 작업: 없음 (Git 커밋 완료 상태)

---

## 📌 다음 작업 예고

- 내일(11/15) 09:00부터 P1 작업 시작
- VIDEO_PIPELINE_SPEC.md 작성 예정
- 예상 소요 시간: 4시간

---

## 💬 특이사항

- 없음
```

---

## 🎯 작업 시작 프로토콜

사용자가 **"오늘 작업을 시작해주세요"** 라고 요청하면:

### Claude의 응답 순서

1. **현재 시간 확인 및 인사**
   ```
   안녕하세요! 현재 시간은 2025-11-14 (금요일) 09:00입니다.
   오늘 작업을 시작하겠습니다.
   ```

2. **필독 문서 확인 체크리스트**
   ```
   ## 작업 시작 전 필독 문서 확인
   - [ ] WORK_REGULATIONS.md
   - [ ] API_CONTRACTS (최신 버전)
   - [ ] MASTER_TODO.md
   - [ ] 전일 작업 보고서
   - [ ] 당일 작업 계획서
   - [ ] DETAILED_WORK_PLAN.md

   확인을 시작합니다...
   ```

3. **각 문서 읽기 및 요약**
   - 규정집 확인 → 주요 규정 상기
   - API 계약서 → 최신 변경사항 확인
   - 마스터 TODO → 전체 진행률 파악
   - 전일 보고서 → 어제 완료/미완료 작업 파악
   - 당일 계획서 → 오늘 할 일 목록 확인
   - 상세 계획서 → 우선순위 재확인

4. **오늘의 작업 목록 제시**
   ```
   ## 2025-11-14 (금요일) 작업 계획

   ### 우선순위 1 (긴급)
   1. [P0] Model Catalog 통합 (예상 2시간)

   ### 우선순위 2 (중요)
   2. [P0] Agent 목록 통일 (예상 1.5시간)

   ### 우선순위 3 (일반)
   3. [P0] PPC Ads 섹션 추가 (예상 2시간)

   첫 번째 작업(Model Catalog 통합)을 시작해도 될까요?
   ```

5. **사용자 승인 후 작업 시작**

---

## 📝 문서 버전 관리

- 본 규정집 수정 시 버전 업데이트
- 변경 이력:
  - v1.0 (2025-11-14 15:59): 최초 작성

---

**본 규정집은 Sparklio AI Marketing Studio 프로젝트의 절대 규칙입니다.**
**모든 팀원은 100% 준수해야 합니다.**
