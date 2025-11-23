# 🌅 아침 작업 지시서 템플릿 (Claude용)

**목적**: 매일 아침 새로운 Claude 세션에 이 문서를 제공하여 작업 연속성을 보장합니다.

**사용법**: 이 템플릿을 복사하여 날짜와 팀명을 채우고, Claude에게 "이 지시서를 읽고 작업을 시작해주세요"라고 요청하세요.

---

## 📋 작업 지시서 (YYYY-MM-DD, X팀)

**작성일**: [오늘 날짜와 요일을 powershell로 확인하여 기입]
**대상 팀**: [A팀 / B팀 / C팀]
**Claude 역할**: [QA & Testing / Backend Developer / Frontend Developer]

---

## 🎯 핵심 지시사항

### 1️⃣ 가장 먼저 할 일

**절대 순서를 지켜주세요:**

1. **현재 시간 확인 및 기록**
   ```bash
   powershell -Command "Get-Date -Format 'yyyy-MM-dd (dddd) HH:mm:ss'"
   ```
   - 출력된 시간을 모든 보고서 상단에 기록하세요

2. **필수 문서 8가지 읽기** (순서대로)
   - ✅ `docs/WORK_REGULATIONS.md` (규정집)
   - ✅ `docs/A_TEAM_API_CONTRACT_REVIEW_2025-11-18.md` (API 계약)
   - ✅ `docs/SYSTEM_ARCHITECTURE.md` (시스템 구조)
   - ✅ `docs/MAC_MINI_SERVER_GUIDELINES.md` (서버 가이드)
   - ✅ `backend/docs/AGENT_SPECIFICATIONS.md` (Agent 스펙)
   - ✅ `frontend/MAIN_EDITOR_PATH.md` (에디터 경로, C팀만)
   - ✅ [팀별 Handover 문서] (아래 참조)
   - ✅ `docs/PROJECT_STATUS_REPORT_2025-11-23.md` (프로젝트 상태)

3. **Daily Work Prep Guide 확인**
   - ✅ `docs/DAILY_WORK_PREP_GUIDE.md` 전체 읽기

---

## 📂 팀별 Handover 문서 위치

### A팀 (QA & Testing)
- **Handover**: `docs/A_TEAM_HANDOVER_2025-11-21.md` (또는 최신 날짜)
- **Golden Set**: `backend/tests/golden_set/reviewer_ad_copy_quality_check_v1.json`
- **Evaluation Guide**: `docs/REVIEWER_EVALUATION_GUIDE.md`

### B팀 (Backend)
- **Handover**: `backend/docs/B_TEAM_HANDOVER_GUIDE_2025-11-23.md` (또는 최신 날짜)
- **Integration Guides**:
  - `backend/docs/STRATEGIST_INTEGRATION_GUIDE_2025-11-23.md`
  - `backend/docs/REVIEWER_INTEGRATION_GUIDE_2025-11-23.md`

### C팀 (Frontend)
- **Handover**: `frontend/C_TEAM_HANDOFF.md`
- **필수**: `frontend/MAIN_EDITOR_PATH.md` ⚠️ **매우 중요**
- **Component Docs**: `frontend/docs/V3_COMPONENT_ARCHITECTURE.md`

---

## 🔍 서버 상태 확인 (필수)

### Mac mini Backend 서버
```bash
# Health check
curl http://100.123.51.5:8000/health

# SSH 접속 테스트
ssh woosun@100.123.51.5 "echo OK"

# Backend 코드 버전 확인
ssh woosun@100.123.51.5 "cd ~/sparklio_ai_marketing_studio/backend && git log -1 --oneline"
```

### Desktop GPU 서버 (Ollama)
```bash
# Ollama 상태 확인
curl http://100.120.180.42:11434/api/tags

# 사용 가능한 모델 확인
curl http://100.120.180.42:11434/api/tags | jq '.models[].name'
```

**기대 출력**:
- Mac mini: `{"status":"healthy"}` 또는 유사 응답
- Ollama: `qwen2.5:7b`, `llama3.2:3b` 등 모델 목록

---

## ⚠️ 절대 금지 규칙

### 전체 팀 공통

1. **Git Pull 절대 금지**
   - K: 드라이브 (SSD)가 항상 원본
   - Git Pull 하면 충돌 발생
   - Push만 허용

2. **시간 기록 필수**
   - 모든 보고서 상단에 작성일/작성시간 기재
   - 형식: `**작성일**: 2025-11-24 (일요일) 09:00`

3. **작업 완료 후 즉시 커밋**
   - 작업 단위마다 즉시 Git 커밋
   - 커밋 메시지에 날짜 포함: `[2025-11-24] feat: 작업 내용`

### C팀 전용 금지 규칙

1. **새 에디터 라우트 생성 절대 금지**
   - `/studio/v3` 하나만 존재
   - `/studio/v4`, `/canvas-studio2`, `/new-editor` 등 생성 금지

2. **에디터 엔진 복제 금지**
   - `components/canvas-studio/` 만 사용
   - `components/canvas-studio-v2/`, `components/new-editor/` 등 복제 금지

3. **MAIN_EDITOR_PATH.md 필수 확인**
   - 모든 에디터 작업 전 이 파일 확인
   - 경로 변경 절대 금지

### B팀 전용 금지 규칙

1. **Backend 코드 변경 후 Mac mini 배포 필수**
   - 로컬에서만 작업하고 배포 안 하면 A팀 테스트 전부 실패
   - 배포 완료 후 A팀에 알림 필수

---

## 📝 작업 시작 프로토콜

### Step 1: 문서 확인 체크리스트

```markdown
## [날짜] 작업 시작 체크리스트

### 시간 확인
- [ ] 현재 시간 확인 완료: [시간 기입]

### 필수 문서 8가지
- [ ] WORK_REGULATIONS.md 읽음
- [ ] API 계약서 읽음
- [ ] SYSTEM_ARCHITECTURE.md 읽음
- [ ] MAC_MINI_SERVER_GUIDELINES.md 읽음
- [ ] AGENT_SPECIFICATIONS.md 읽음
- [ ] MAIN_EDITOR_PATH.md 읽음 (C팀만)
- [ ] 팀별 Handover 문서 읽음
- [ ] PROJECT_STATUS_REPORT 읽음

### 서버 상태
- [ ] Mac mini Backend 정상: [응답 기입]
- [ ] Desktop Ollama 정상: [응답 기입]

### Git 상태
- [ ] 로컬 Git 상태 확인: [상태 기입]
- [ ] 최근 커밋 확인: [커밋 해시 기입]
```

### Step 2: 오늘의 작업 목록 확인

**어디서 확인?**
1. 팀별 Handover 문서의 "Next Steps" 섹션
2. PROJECT_STATUS_REPORT의 "우선순위 작업" 섹션
3. 전일 작업 보고서의 "다음 작업 예고" 섹션

### Step 3: 작업 우선순위 결정

**우선순위 기준**:
1. **P0 (긴급)**: 블로킹 이슈, 서버 다운, 테스트 실패
2. **P1 (중요)**: 마일스톤 관련 작업, 다른 팀 의존성
3. **P2 (일반)**: 개선 작업, 문서화, 리팩토링

### Step 4: 작업 시작

**작업 시작 전 확인**:
- [ ] 작업 내용이 명확한가?
- [ ] 필요한 문서/스펙을 모두 읽었는가?
- [ ] 다른 팀 의존성이 있는가?
- [ ] 예상 소요 시간은?

---

## 🚀 팀별 Quick Start

### A팀 (QA & Testing)

**오늘의 작업 예시**:
1. Reviewer Golden Set 검증 (`backend/tests/golden_set/reviewer_ad_copy_quality_check_v1.json`)
2. Mac mini Backend API 통합 테스트
3. 테스트 결과 보고서 작성

**확인 사항**:
- Mac mini Backend 배포 상태 (B팀과 확인)
- Golden Set 테스트 케이스 최신 버전
- Evaluation Guide 기준 숙지

### B팀 (Backend)

**오늘의 작업 예시**:
1. ReviewerAgent 통합 완료 (Integration Guide 참조)
2. Mac mini 서버에 배포
3. A팀에 배포 완료 알림

**확인 사항**:
- 로컬 코드와 Mac mini 서버 코드 동기화
- Agent 스펙과 구현 일치 여부
- API 계약서와 엔드포인트 일치 여부

### C팀 (Frontend)

**오늘의 작업 예시**:
1. `/studio/v3` 에디터 개선
2. Strategist 응답 렌더링 컴포넌트 수정
3. Backend API 통합 테스트

**확인 사항**:
- MAIN_EDITOR_PATH.md 필수 확인 ⚠️
- Backend API 엔드포인트 정상 작동 확인
- 에디터 경로 `/studio/v3` 유지

---

## 📤 작업 종료 프로토콜

### 매일 18:00 전에 완료할 것

1. **모든 변경사항 Git 커밋**
   ```bash
   git add .
   git commit -m "[2025-11-24] feat: 작업 내용"
   git push origin main
   ```

2. **작업 보고서 작성**
   - 파일명: `docs/WORK_REPORTS/[날짜]_Team_[팀명]_Report.md`
   - 템플릿: `docs/WORK_REGULATIONS.md` 참조

3. **익일 작업 계획서 작성**
   - 파일명: `docs/WORK_PLANS/NEXT_DAY/[익일날짜]_Team_[팀명]_Plan.md`
   - 내용: 오늘 완료 작업 요약 + 내일 작업 목록

4. **서버 상태 확인 (B팀만)**
   - Mac mini 서버 코드 배포 완료 여부
   - Backend 서비스 정상 작동 확인
   - A팀에 배포 상태 공유

---

## 🆘 문제 발생 시 대응

### Mac mini 서버 다운

```bash
# 1. SSH 접속 확인
ssh woosun@100.123.51.5 "echo OK"

# 2. Backend 재시작
ssh woosun@100.123.51.5 "cd ~/sparklio_ai_marketing_studio/backend && source venv/bin/activate && pkill -f uvicorn && nohup uvicorn app.main:app --host 0.0.0.0 --port 8000 > ../logs/backend.log 2>&1 &"

# 3. 상태 확인
curl http://100.123.51.5:8000/health
```

### 테스트 실패 (A팀)

1. Mac mini Backend 코드 버전 확인
2. Backend 배포 상태 확인 (B팀과 확인)
3. API 엔드포인트 정상 작동 확인
4. 테스트 환경 설정 확인 (`.env.test`)

### API 응답 불일치 (C팀)

1. Backend OpenAPI 문서 확인: `curl http://100.123.51.5:8000/docs`
2. B팀에 API 계약서 불일치 보고
3. Mock 데이터로 임시 작업 진행

---

## 📊 성공 지표

**작업이 잘 진행되고 있다면**:

- ✅ 매일 아침 8가지 필수 문서를 확인함
- ✅ 서버 상태 확인 후 작업 시작
- ✅ Git 커밋 메시지에 날짜 포함
- ✅ 작업 완료 후 즉시 보고서 작성
- ✅ 익일 작업 계획서 작성
- ✅ 팀 간 의존성 명확히 확인
- ✅ 절대 금지 규칙 100% 준수

**작업이 잘못되고 있다면**:

- ❌ 필수 문서 확인 없이 작업 시작
- ❌ 서버 상태 확인 없이 작업 진행
- ❌ Git Pull 사용 (충돌 발생)
- ❌ 시간 기록 누락
- ❌ 작업 보고서 미작성
- ❌ 새 에디터 라우트 생성 (C팀)
- ❌ Backend 배포 누락 (B팀)

---

## 🎓 Claude를 위한 추가 안내

### 문서 읽는 순서 (권장)

**1단계: 규정 및 시스템 이해 (30분)**
1. `WORK_REGULATIONS.md` - 작업 규정 숙지
2. `SYSTEM_ARCHITECTURE.md` - 전체 구조 이해
3. `MAC_MINI_SERVER_GUIDELINES.md` - 서버 사용법

**2단계: API 및 Agent 이해 (30분)**
4. `A_TEAM_API_CONTRACT_REVIEW_2025-11-18.md` - API 계약 확인
5. `AGENT_SPECIFICATIONS.md` - Agent 스펙 이해

**3단계: 에디터 및 팀별 작업 (20분)**
6. `MAIN_EDITOR_PATH.md` (C팀만) - 에디터 경로 확인
7. 팀별 Handover 문서 - 이전 작업 이해
8. `PROJECT_STATUS_REPORT` - 현재 진행 상황 파악

**3단계: 작업 시작 (10분)**
9. `DAILY_WORK_PREP_GUIDE.md` - 오늘의 체크리스트
10. 서버 상태 확인 → 작업 시작

### 작업 중 주의사항

1. **문서를 읽지 않고 추측하지 마세요**
   - 모든 스펙은 문서에 명시되어 있습니다
   - 확실하지 않으면 문서를 다시 읽으세요

2. **절대 금지 규칙은 예외 없음**
   - Git Pull 금지
   - 새 에디터 라우트 생성 금지
   - Backend 배포 누락 금지

3. **팀 간 의존성 확인**
   - A팀은 B팀 배포 상태 확인 필요
   - C팀은 Backend API 상태 확인 필요
   - B팀은 배포 후 A팀에 알림 필요

4. **시간 기록 습관화**
   - 모든 보고서 상단에 날짜/시간 기재
   - Git 커밋 메시지에도 날짜 포함

---

## ✅ 최종 체크리스트

**작업 시작 전**:
- [ ] 현재 시간 확인 및 기록
- [ ] 8가지 필수 문서 읽음
- [ ] 서버 상태 정상 확인
- [ ] Git 상태 확인
- [ ] 오늘의 작업 목록 파악
- [ ] 우선순위 결정 완료

**작업 중**:
- [ ] 문서 기반으로 작업
- [ ] 절대 금지 규칙 준수
- [ ] 작업 단위마다 즉시 커밋
- [ ] 팀 간 의존성 확인

**작업 종료 전**:
- [ ] 모든 변경사항 커밋 및 Push
- [ ] 작업 보고서 작성
- [ ] 익일 작업 계획서 작성
- [ ] 서버 상태 확인 (B팀)
- [ ] 시간 기록 완료

---

**이 문서를 읽었다면, 이제 작업을 시작할 준비가 되었습니다!**

**작업 시작 명령어**: "DAILY_WORK_PREP_GUIDE를 따라 작업을 시작합니다."

---

**문서 종료**

**작성일**: 2025-11-24 (일요일)
**버전**: v1.0
**대상**: 전체 팀 (A/B/C)
