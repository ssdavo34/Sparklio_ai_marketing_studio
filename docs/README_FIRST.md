# 🚀 START HERE - 모든 Claude는 이 문서를 먼저 읽으세요

**목적**: 새로운 Claude 세션이 시작될 때 가장 먼저 읽어야 할 안내 문서

**날짜**: 2025-11-24 (일요일)

---

## ⚡ Quick Start (5분)

### 1️⃣ 현재 시간 확인

```bash
powershell -Command "Get-Date -Format 'yyyy-MM-dd (dddd) HH:mm:ss'"
```

### 2️⃣ 당신의 팀은?

- **A팀 (QA & Testing)** → [A팀 작업 시작하기](#a팀-qa--testing)
- **B팀 (Backend)** → [B팀 작업 시작하기](#b팀-backend)
- **C팀 (Frontend)** → [C팀 작업 시작하기](#c팀-frontend)

### 3️⃣ 필수 문서 확인

**모든 팀 공통 (순서대로 읽기)**:

1. ✅ [MORNING_BRIEFING_TEMPLATE.md](./MORNING_BRIEFING_TEMPLATE.md) - **가장 먼저 읽기**
2. ✅ [DAILY_WORK_PREP_GUIDE.md](./DAILY_WORK_PREP_GUIDE.md) - 매일 작업 준비 가이드
3. ✅ [WORK_REGULATIONS.md](./WORK_REGULATIONS.md) - 12대 작업 규정
4. ✅ [PROJECT_STATUS_REPORT_2025-11-23.md](./PROJECT_STATUS_REPORT_2025-11-23.md) - 프로젝트 현황

---

## 📋 팀별 작업 시작 가이드

### A팀 (QA & Testing)

**역할**: 품질 검증, Agent 평가, Golden Set 관리

**필수 문서 (순서대로)**:
1. [MORNING_BRIEFING_TEMPLATE.md](./MORNING_BRIEFING_TEMPLATE.md)
2. [DAILY_WORK_PREP_GUIDE.md](./DAILY_WORK_PREP_GUIDE.md) - A팀 섹션
3. [WORK_REGULATIONS.md](./WORK_REGULATIONS.md)
4. [MAC_MINI_SERVER_GUIDELINES.md](./MAC_MINI_SERVER_GUIDELINES.md)
5. [A_TEAM_API_CONTRACT_REVIEW_2025-11-18.md](./A_TEAM_API_CONTRACT_REVIEW_2025-11-18.md)
6. [A_TEAM_HANDOVER_2025-11-21.md](./A_TEAM_HANDOVER_2025-11-21.md) (최신 버전)
7. [REVIEWER_EVALUATION_GUIDE.md](./REVIEWER_EVALUATION_GUIDE.md)
8. [backend/tests/golden_set/reviewer_ad_copy_quality_check_v1.json](../backend/tests/golden_set/reviewer_ad_copy_quality_check_v1.json)

**서버 상태 확인**:
```bash
# Mac mini Backend
curl http://100.123.51.5:8000/health

# Desktop Ollama
curl http://100.120.180.42:11434/api/tags
```

**오늘의 작업 예시**:
- Reviewer Golden Set 검증
- Backend API 통합 테스트
- 테스트 결과 보고서 작성

---

### B팀 (Backend)

**역할**: Agent 구현, API 개발, Mac mini 서버 배포

**필수 문서 (순서대로)**:
1. [MORNING_BRIEFING_TEMPLATE.md](./MORNING_BRIEFING_TEMPLATE.md)
2. [DAILY_WORK_PREP_GUIDE.md](./DAILY_WORK_PREP_GUIDE.md) - B팀 섹션
3. [WORK_REGULATIONS.md](./WORK_REGULATIONS.md)
4. [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md)
5. [MAC_MINI_SERVER_GUIDELINES.md](./MAC_MINI_SERVER_GUIDELINES.md)
6. [backend/docs/AGENT_SPECIFICATIONS.md](../backend/docs/AGENT_SPECIFICATIONS.md)
7. [backend/docs/B_TEAM_HANDOVER_GUIDE_2025-11-23.md](../backend/docs/B_TEAM_HANDOVER_GUIDE_2025-11-23.md)
8. [backend/docs/REVIEWER_INTEGRATION_GUIDE_2025-11-23.md](../backend/docs/REVIEWER_INTEGRATION_GUIDE_2025-11-23.md)

**서버 배포 확인 (매우 중요)**:
```bash
# 로컬 코드 버전
git log -1 --oneline

# Mac mini 서버 코드 버전
ssh woosun@100.123.51.5 "cd ~/sparklio_ai_marketing_studio/backend && git log -1 --oneline"

# 불일치 시 즉시 배포 필요!
```

**오늘의 작업 예시**:
- ReviewerAgent 통합 완료
- Mac mini 서버에 배포
- A팀에 배포 완료 알림

---

### C팀 (Frontend)

**역할**: Canvas Studio 개발, Backend API 연동

**필수 문서 (순서대로)**:
1. [MORNING_BRIEFING_TEMPLATE.md](./MORNING_BRIEFING_TEMPLATE.md)
2. [DAILY_WORK_PREP_GUIDE.md](./DAILY_WORK_PREP_GUIDE.md) - C팀 섹션
3. [frontend/MAIN_EDITOR_PATH.md](../frontend/MAIN_EDITOR_PATH.md) ⚠️ **매우 중요**
4. [WORK_REGULATIONS.md](./WORK_REGULATIONS.md)
5. [A_TEAM_API_CONTRACT_REVIEW_2025-11-18.md](./A_TEAM_API_CONTRACT_REVIEW_2025-11-18.md)
6. [frontend/C_TEAM_HANDOFF.md](../frontend/C_TEAM_HANDOFF.md)
7. [frontend/docs/BACKEND_API_DISCOVERY_2025-11-22.md](../frontend/docs/BACKEND_API_DISCOVERY_2025-11-22.md)

**절대 금지 규칙 (C팀 전용)**:
- 🚫 새 에디터 라우트 생성 금지 (`/studio/v4`, `/canvas-studio2` 등)
- 🚫 에디터 엔진 복제 금지 (`components/canvas-studio-v2/` 등)
- ✅ 항상 `/studio/v3` 와 `components/canvas-studio/` 만 사용

**에디터 경로 확인**:
```bash
# 메인 경로 확인
cat frontend/MAIN_EDITOR_PATH.md | grep "메인 경로"

# 출력: **메인 경로:** `/studio/v3`
```

**오늘의 작업 예시**:
- `/studio/v3` 에디터 개선
- Strategist 응답 렌더링 수정
- Backend API 통합 테스트

---

## ⚠️ 절대 금지 규칙 (전체 팀)

### 1. Git Pull 절대 금지
```bash
# ❌ 절대 하지 마세요
git pull origin main

# ✅ Push만 허용
git push origin main
```

**이유**: K: 드라이브 (SSD)가 항상 원본. Git Pull 하면 충돌 발생.

### 2. 시간 기록 필수
```markdown
**작성일**: 2025-11-24 (일요일) 09:00
**작성시간**: 2025-11-24 (일요일) 18:00
```

모든 보고서 상단에 반드시 기재.

### 3. 작업 완료 후 즉시 커밋
```bash
git add .
git commit -m "[2025-11-24] feat: 작업 내용"
git push origin main
```

작업 단위마다 즉시 커밋. 하루 종료 시점에 몰아서 커밋 금지.

---

## 🔍 서버 정보

### Mac mini (Backend 서버)
- **IP**: 100.123.51.5
- **SSH**: `ssh woosun@100.123.51.5`
- **Backend API**: `http://100.123.51.5:8000`
- **Health Check**: `curl http://100.123.51.5:8000/health`
- **역할**: PostgreSQL, Redis, MinIO, FastAPI, Celery

### Desktop (GPU 서버)
- **IP**: 100.120.180.42
- **Ollama**: `http://100.120.180.42:11434`
- **ComfyUI**: `http://100.120.180.42:8188`
- **역할**: LLM (Ollama), Image Generation (ComfyUI)

### Laptop (개발 환경)
- **IP**: 192.168.0.101 (로컬)
- **Next.js Dev**: `http://localhost:3000`
- **역할**: Frontend 개발 전용

---

## 📊 프로젝트 현황 (2025-11-23 기준)

### ✅ 완료
- CopywriterAgent (Production)
- StrategistAgent (Production)
- ReviewerAgent (Design 완료, 통합 진행 중)
- Canvas Studio v3 (`/studio/v3`)
- Polotno Editor 통합
- Golden Set (Strategist 10개, Reviewer 5개)

### 🚧 진행 중
- ReviewerAgent Backend 통합 (B팀)
- ReviewerAgent Golden Set 검증 (A팀)
- Canvas Studio UI 개선 (C팀)

### 📌 다음 단계
- OptimizerAgent 설계 (A팀)
- DesignerAgent 구현 (B팀)
- Multi-page Canvas 지원 (C팀)

---

## 📞 긴급 상황 대응

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

1. Mac mini Backend 배포 상태 확인 (B팀과 확인)
2. API 엔드포인트 정상 작동 확인
3. 테스트 환경 설정 확인 (`.env.test`)

### API 불일치 (C팀)

1. Backend OpenAPI 문서 확인: `http://100.123.51.5:8000/docs`
2. B팀에 API 계약서 불일치 보고
3. Mock 데이터로 임시 작업

---

## ✅ 작업 시작 준비 완료 체크

**다음 항목을 모두 확인했다면 작업 시작 가능**:

- [ ] 현재 시간 확인 및 기록
- [ ] MORNING_BRIEFING_TEMPLATE.md 읽음
- [ ] DAILY_WORK_PREP_GUIDE.md 읽음
- [ ] 필수 문서 8가지 확인
- [ ] 팀별 Handover 문서 읽음
- [ ] 서버 상태 정상 확인
- [ ] Git 상태 확인
- [ ] 절대 금지 규칙 숙지
- [ ] 오늘의 작업 목록 파악

---

## 🎯 작업 시작 명령어

**모든 준비가 완료되었다면**:

```
"DAILY_WORK_PREP_GUIDE를 따라 [A팀/B팀/C팀] 작업을 시작합니다."
```

**또는**:

```
"MORNING_BRIEFING_TEMPLATE의 [A팀/B팀/C팀] 섹션을 확인하고 작업을 시작합니다."
```

---

**이 문서를 읽었다면, 이제 MORNING_BRIEFING_TEMPLATE.md로 이동하세요!**

**다음 문서**: [MORNING_BRIEFING_TEMPLATE.md](./MORNING_BRIEFING_TEMPLATE.md)

---

**작성일**: 2025-11-24 (일요일)
**버전**: v1.0
**대상**: 전체 팀 (A/B/C)
