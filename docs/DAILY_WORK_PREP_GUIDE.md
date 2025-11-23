# 📋 Daily Work Preparation Guide - 모든 팀 필수 가이드

**작성일**: 2025-11-24 (일요일)
**버전**: v2.0 (완전판)
**적용 대상**: A팀, B팀, C팀 전체
**중요도**: ⚠️ **매일 작업 시작 전 필수 확인**

---

## 📌 작업 시작 전 필수 체크

### 0️⃣ 시간 확인 및 기록

**매일 가장 먼저 해야 할 일**:

```bash
# Windows에서 현재 시간 확인
powershell -Command "Get-Date -Format 'yyyy-MM-dd (dddd) HH:mm:ss'"
```

**출력 예시**:
```
2025-11-24 (Sunday) 09:00:00
```

**모든 작업 보고서에 이 정보를 기록하세요**:
```markdown
**작업 시작**: 2025-11-24 (일요일) 09:00
**작업 종료**: 2025-11-24 (일요일) 18:00
```

---

## 1️⃣ 기본 가이드 문서 (필수 숙지)

### 📖 1.1 규정집

**파일**: `docs/WORK_REGULATIONS.md`

**필수 확인 사항**:
- [ ] 12대 작업 규정 확인
- [ ] 규정 1: 시간 확인 및 날짜 기재
- [ ] 규정 2: 한글 작성 원칙
- [ ] 규정 8: SSD가 원본, Git Pull 금지
- [ ] 규정 12: 작업 시작 전 필독 문서 확인

**Quick Check**:
```bash
# 규정집 읽기
cat docs/WORK_REGULATIONS.md | head -100
```

**핵심 규칙**:
- ✅ 모든 문서 작성 시 날짜 기재
- ✅ K: 드라이브 (SSD)가 항상 원본
- ✅ Git Pull 절대 금지, Push만 허용
- ✅ 작업 완료 후 즉시 커밋 및 보고서 작성

---

### 🔌 1.2 API 계약

**파일**: `docs/A_TEAM_API_CONTRACT_REVIEW_2025-11-18.md`

**필수 확인 사항**:
- [ ] Generate API 엔드포인트: `POST /api/v1/generate`
- [ ] 지원하는 kind: product_detail, sns_set, presentation_simple, brand_identity, content_review
- [ ] 요청/응답 스키마 구조
- [ ] Agent API 상태 (agents.py DEPRECATED)

**Quick Check**:
```bash
# 맥미니 Backend API 문서 확인
curl http://100.123.51.5:8000/docs

# 또는 로컬에서 API 계약 문서 확인
cat docs/A_TEAM_API_CONTRACT_REVIEW_2025-11-18.md | grep "Generate API"
```

**핵심 포인트**:
- Generate API는 정상 작동 중 ✅
- Agent API는 신규 구현 필요 ⚠️
- OpenAPI 문서로 최신 스펙 확인

---

### 🏗️ 1.3 서버 및 시스템 구조

**파일들**:
- `docs/SYSTEM_ARCHITECTURE.md` (전체 시스템 구조)
- `docs/MAC_MINI_SERVER_GUIDELINES.md` (맥미니 서버 가이드)

**서버 구조**:

| Node | Role | Services | IP |
|------|------|----------|-----|
| **Mac mini** | Backend/DB/Storage | PostgreSQL, Redis, MinIO, FastAPI, Celery Worker, Superset | 100.123.51.5 |
| **Desktop (GPU)** | AI Workers | Ollama (LLM), ComfyUI (Image/Video Generation) | 100.120.180.42 |
| **Laptop** | Frontend Dev | Next.js Dev Server (로컬 개발용) | 192.168.0.101 |

**필수 확인 사항**:
- [ ] Mac mini 서버 정상 작동 확인
- [ ] SSH 접속 방법: `ssh woosun@100.123.51.5`
- [ ] Backend API 엔드포인트: `http://100.123.51.5:8000`
- [ ] Desktop GPU 서버 (Ollama): `http://100.120.180.42:11434`

**Quick Check**:
```bash
# Mac mini Backend 상태 확인
curl http://100.123.51.5:8000/health

# Desktop Ollama 상태 확인
curl http://100.120.180.42:11434/api/tags

# Mac mini SSH 접속 테스트
ssh woosun@100.123.51.5 "echo OK"
```

**핵심 포인트**:
- Mac mini가 메인 서버 (Backend + DB)
- Desktop은 AI 전용 (LLM, ComfyUI)
- 로컬 노트북은 개발 전용

---

### 🤖 1.4 LLM 및 에이전트 스펙

**파일**: `backend/docs/AGENT_SPECIFICATIONS.md`

**구현된 Agent (6개)**:
1. ✅ CopywriterAgent - 텍스트 콘텐츠 생성
2. ✅ StrategistAgent - 마케팅 전략 수립
3. ✅ DesignerAgent - 비주얼 콘텐츠 생성
4. ✅ ReviewerAgent - 콘텐츠 품질 검토
5. ✅ OptimizerAgent - 콘텐츠 최적화
6. ✅ EditorAgent - 에디터 자동 조작

**LLM Provider**:
- Ollama (기본): qwen2.5:7b, llama3.2:3b
- OpenAI (폴백): gpt-4o-mini
- Anthropic (옵션): claude-3-5-sonnet
- Gemini (옵션): gemini-1.5-pro

**필수 확인 사항**:
- [ ] 각 Agent의 입력/출력 스펙
- [ ] LLM Provider 우선순위
- [ ] Agent 공통 인터페이스 (AgentRequest/AgentResponse)

**Quick Check**:
```bash
# Agent 스펙 문서 읽기
cat backend/docs/AGENT_SPECIFICATIONS.md | grep "CopywriterAgent"

# Ollama 모델 목록 확인
curl http://100.120.180.42:11434/api/tags
```

---

### 🎨 1.5 MAIN_EDITOR_PATH.md

**파일**: `frontend/MAIN_EDITOR_PATH.md`

**메인 에디터 경로**: `/studio/v3`

**절대 금지 규칙**:
- 🚫 새 에디터 라우트 생성 금지 (`app/studio/v4/`, `app/canvas-studio2/` 등)
- 🚫 엔진 복제 금지 (`components/canvas-studio-v2/` 등)
- ✅ 항상 `components/canvas-studio/`에서만 작업

**필수 확인 사항**:
- [ ] 메인 경로: `http://localhost:3000/studio/v3`
- [ ] 작업 허용 디렉토리: `components/canvas-studio/`
- [ ] 사용 금지 경로: `/studio/polotno`, `/studio/layerhub`, `/editor`

**Quick Check**:
```bash
# 에디터 경로 확인
cat frontend/MAIN_EDITOR_PATH.md | head -30
```

**핵심 포인트**:
- `/studio/v3` 하나만 존재
- 모든 에디터 작업은 `components/canvas-studio/`에서만

---

### 📄 1.6 전일 작업 내용 및 인수인계 문서

**팀별 Handover 파일**:

| 팀 | Handover 파일 |
|-----|---------------|
| **A팀** | `docs/A_TEAM_HANDOVER_2025-11-21.md` |
| **B팀** | `backend/docs/B_TEAM_HANDOVER_GUIDE_2025-11-23.md` |
| **C팀** | `frontend/C_TEAM_HANDOFF.md` |

**필수 확인 사항**:
- [ ] 전일 완료 작업 확인
- [ ] 미완료/블로킹 이슈 확인
- [ ] 당일 작업 우선순위 파악
- [ ] 다른 팀 의존성 확인

**Quick Check**:
```bash
# A팀 최신 handover 확인
ls -lt docs/*HANDOVER*.md | head -1

# B팀 최신 handover 확인
ls -lt backend/docs/*HANDOVER*.md | head -1

# C팀 handover 확인
cat frontend/C_TEAM_HANDOFF.md
```

**핵심 포인트**:
- 전일 작업 내용 숙지 필수
- 블로킹 이슈가 있으면 즉시 해결 계획 수립
- 팀 간 의존성 파악

---

### 📊 1.7 매일의 프로젝트 스테이터스 레포트

**파일**: `docs/PROJECT_STATUS_REPORT_2025-11-23.md`

**필수 확인 사항**:
- [ ] 전체 프로젝트 진행 상황
- [ ] 팀별 우선순위 작업
- [ ] 긴급/블로킹 이슈
- [ ] 주간 마일스톤

**Quick Check**:
```bash
# 최신 프로젝트 스테이터스 확인
ls -lt docs/PROJECT_STATUS_REPORT*.md | head -1

# 내용 읽기
cat docs/PROJECT_STATUS_REPORT_2025-11-23.md | head -100
```

**핵심 포인트**:
- 전체 팀의 작업 현황 파악
- 긴급 이슈가 있으면 우선 대응
- 마일스톤 달성 여부 확인

---

## 2️⃣ 팀별 작업 준비 (공통 + 팀별)

### 🔍 A팀 (QA & Architecture)

#### 작업 시작 전 체크리스트

```markdown
## 2025-11-24 (일요일) A팀 작업 시작 체크리스트

### 0. 시간 확인
- [ ] 현재 시간: `powershell -Command "Get-Date -Format 'yyyy-MM-dd (dddd) HH:mm:ss'"`
- [ ] 보고서에 시간 기록

### 1. 기본 가이드 문서
- [ ] WORK_REGULATIONS.md 확인
- [ ] API 계약서 확인 (A_TEAM_API_CONTRACT_REVIEW)
- [ ] SYSTEM_ARCHITECTURE.md 확인
- [ ] MAC_MINI_SERVER_GUIDELINES.md 확인
- [ ] AGENT_SPECIFICATIONS.md 확인
- [ ] MAIN_EDITOR_PATH.md 확인
- [ ] A팀 Handover 문서 확인
- [ ] PROJECT_STATUS_REPORT 확인

### 2. A팀 전용 문서
- [ ] `docs/TASK_SCHEMA_CATALOG_V2.md` (Task Schema 카탈로그)
- [ ] `backend/tests/golden_set/*.json` (Golden Set 테스트 케이스)
- [ ] `docs/STRATEGIST_EVALUATION_GUIDE.md` (Strategist 평가 가이드)
- [ ] `docs/REVIEWER_EVALUATION_GUIDE.md` (Reviewer 평가 가이드)

### 3. 서버 상태 확인
- [ ] Mac mini Backend: `curl http://100.123.51.5:8000/health`
- [ ] Desktop Ollama: `curl http://100.120.180.42:11434/api/tags`
- [ ] PostgreSQL 접속: `ssh woosun@100.123.51.5 "psql -U postgres -d sparklio -c 'SELECT 1'"`

### 4. Git 상태 확인
- [ ] `git status` - 로컬 변경사항 확인
- [ ] `git log -5` - 최근 커밋 확인
```

**Quick Start Script** (A팀):
```bash
#!/bin/bash
# A팀 작업 시작 스크립트

echo "========================================="
echo "A팀 작업 시작 준비"
echo "========================================="

# 1. 시간 확인
echo "1. 현재 시간:"
powershell -Command "Get-Date -Format 'yyyy-MM-dd (dddd) HH:mm:ss'"

# 2. 서버 상태 확인
echo ""
echo "2. Mac mini Backend 상태:"
curl -s http://100.123.51.5:8000/health | jq .

echo ""
echo "3. Desktop Ollama 상태:"
curl -s http://100.120.180.42:11434/api/tags | jq '.models | length'

# 4. Git 상태
echo ""
echo "4. Git 상태:"
git status

echo ""
echo "========================================="
echo "작업 준비 완료!"
echo "========================================="
```

---

### ⚙️ B팀 (Backend)

#### 작업 시작 전 체크리스트

```markdown
## 2025-11-24 (일요일) B팀 작업 시작 체크리스트

### 0. 시간 확인
- [ ] 현재 시간: `powershell -Command "Get-Date -Format 'yyyy-MM-dd (dddd) HH:mm:ss'"`
- [ ] 보고서에 시간 기록

### 1. 기본 가이드 문서
- [ ] WORK_REGULATIONS.md 확인
- [ ] API 계약서 확인 (A_TEAM_API_CONTRACT_REVIEW)
- [ ] SYSTEM_ARCHITECTURE.md 확인
- [ ] MAC_MINI_SERVER_GUIDELINES.md 확인
- [ ] AGENT_SPECIFICATIONS.md 확인
- [ ] B팀 Handover 문서 확인
- [ ] PROJECT_STATUS_REPORT 확인

### 2. B팀 전용 문서
- [ ] `backend/docs/STRATEGIST_INTEGRATION_GUIDE_2025-11-23.md` (Strategist 통합 가이드)
- [ ] `backend/docs/REVIEWER_INTEGRATION_GUIDE_2025-11-23.md` (Reviewer 통합 가이드)
- [ ] `backend/app/schemas/*.py` (Pydantic 스키마)
- [ ] `backend/docs/LLM_INTEGRATION_GUIDE.md` (LLM 통합 가이드)

### 3. 서버 상태 확인
- [ ] Mac mini Backend: `curl http://100.123.51.5:8000/health`
- [ ] Mac mini 서버 코드 버전: `ssh woosun@100.123.51.5 "cd ~/sparklio_ai_marketing_studio/backend && git log -1 --oneline"`
- [ ] 로컬 코드 버전: `git log -1 --oneline`
- [ ] 코드 동기화 여부 확인

### 4. Docker 상태 확인
- [ ] `ssh woosun@100.123.51.5 "docker ps"`
- [ ] PostgreSQL 컨테이너 상태
- [ ] Redis 컨테이너 상태

### 5. 배포 필요 여부
- [ ] 전일 Backend 코드 변경 있었는지 확인
- [ ] 변경 있으면 Mac mini에 배포 완료 여부 확인
- [ ] 미배포 시 즉시 배포
```

**Quick Start Script** (B팀):
```bash
#!/bin/bash
# B팀 작업 시작 스크립트

echo "========================================="
echo "B팀 작업 시작 준비"
echo "========================================="

# 1. 시간 확인
echo "1. 현재 시간:"
powershell -Command "Get-Date -Format 'yyyy-MM-dd (dddd) HH:mm:ss'"

# 2. 서버 상태 확인
echo ""
echo "2. Mac mini Backend 상태:"
curl -s http://100.123.51.5:8000/health | jq .

# 3. 코드 동기화 확인
echo ""
echo "3. 로컬 코드 버전:"
git log -1 --oneline

echo ""
echo "4. Mac mini 서버 코드 버전:"
ssh woosun@100.123.51.5 "cd ~/sparklio_ai_marketing_studio/backend && git log -1 --oneline"

# 5. Docker 상태
echo ""
echo "5. Mac mini Docker 컨테이너:"
ssh woosun@100.123.51.5 "docker ps --format 'table {{.Names}}\t{{.Status}}'"

echo ""
echo "========================================="
echo "작업 준비 완료!"
echo "========================================="
```

---

### 🎨 C팀 (Frontend)

#### 작업 시작 전 체크리스트

```markdown
## 2025-11-24 (일요일) C팀 작업 시작 체크리스트

### 0. 시간 확인
- [ ] 현재 시간: `powershell -Command "Get-Date -Format 'yyyy-MM-dd (dddd) HH:mm:ss'"`
- [ ] 보고서에 시간 기록

### 1. 기본 가이드 문서
- [ ] WORK_REGULATIONS.md 확인
- [ ] API 계약서 확인 (A_TEAM_API_CONTRACT_REVIEW)
- [ ] SYSTEM_ARCHITECTURE.md 확인
- [ ] MAIN_EDITOR_PATH.md 확인 ⚠️ **매우 중요**
- [ ] C팀 Handover 문서 확인
- [ ] PROJECT_STATUS_REPORT 확인

### 2. C팀 전용 문서
- [ ] `frontend/MAIN_EDITOR_PATH.md` ⚠️ **필수**
- [ ] `frontend/lib/sparklio/types/*.ts` (TypeScript 타입 정의)
- [ ] `frontend/components/canvas-studio/` (에디터 컴포넌트)
- [ ] `frontend/docs/BACKEND_API_DISCOVERY_2025-11-22.md` (Backend API 발견 문서)

### 3. 에디터 경로 확인
- [ ] 메인 경로: `/studio/v3` 확인
- [ ] 절대 금지: 새 라우트 생성 금지
- [ ] 작업 디렉토리: `components/canvas-studio/` 확인

### 4. Backend API 확인
- [ ] Mac mini Backend: `curl http://100.123.51.5:8000/health`
- [ ] OpenAPI 문서: `curl http://100.123.51.5:8000/docs`
- [ ] 환경 변수: `.env.local` 확인 (`NEXT_PUBLIC_API_URL`)

### 5. 로컬 개발 서버
- [ ] `npm run dev` 실행
- [ ] `http://localhost:3000/studio/v3` 접속 확인
```

**Quick Start Script** (C팀):
```bash
#!/bin/bash
# C팀 작업 시작 스크립트

echo "========================================="
echo "C팀 작업 시작 준비"
echo "========================================="

# 1. 시간 확인
echo "1. 현재 시간:"
powershell -Command "Get-Date -Format 'yyyy-MM-dd (dddd) HH:mm:ss'"

# 2. MAIN_EDITOR_PATH 확인
echo ""
echo "2. 메인 에디터 경로 확인:"
cat frontend/MAIN_EDITOR_PATH.md | grep "메인 경로"

# 3. Backend API 상태
echo ""
echo "3. Mac mini Backend 상태:"
curl -s http://100.123.51.5:8000/health | jq .

# 4. 환경 변수 확인
echo ""
echo "4. 환경 변수 확인:"
cat frontend/.env.local | grep NEXT_PUBLIC_API_URL

# 5. Git 상태
echo ""
echo "5. Git 상태:"
git status

echo ""
echo "========================================="
echo "작업 준비 완료!"
echo "========================================="
```

---

## 3️⃣ 작업 종료 전 체크리스트

### 모든 팀 공통

```markdown
## 작업 종료 체크리스트 (매일 18:00)

### 1. 시간 기록
- [ ] 작업 종료 시간 기록: `powershell -Command "Get-Date -Format 'yyyy-MM-dd (dddd) HH:mm:ss'"`

### 2. Git 커밋
- [ ] 모든 변경사항 커밋
- [ ] 커밋 메시지에 날짜 포함: `[2025-11-24] feat: 작업 내용`
- [ ] 원격 저장소에 Push

### 3. 작업 보고서 작성
- [ ] `docs/WORK_REPORTS/2025-11-24_Team_X_Report.md` 작성
- [ ] 완료 작업 기록
- [ ] 미완료 작업 기록
- [ ] 발견된 에러 기록
- [ ] 다음 작업 예고

### 4. 익일 작업 계획서 작성
- [ ] `docs/WORK_PLANS/NEXT_DAY/2025-11-25_Team_X_Plan.md` 작성
- [ ] 작업 목록 및 우선순위 정리
- [ ] 예상 소요 시간 기재
- [ ] 의존성 명시

### 5. 서버 상태 확인 (B팀만)
- [ ] Mac mini 서버에 코드 배포 완료 여부 확인
- [ ] Backend 서비스 정상 작동 확인
- [ ] A팀에 배포 완료 알림
```

---

## 4️⃣ 자주 발생하는 실수 방지

### ❌ 하지 말아야 할 것

1. **Git Pull 금지**
   - K: 드라이브 (SSD)가 원본
   - Git Pull 하면 충돌 발생
   - Push만 허용

2. **새 에디터 라우트 생성 금지 (C팀)**
   - `/studio/v3` 하나만 사용
   - `/studio/v4`, `/canvas-studio2` 등 생성 금지

3. **Backend 코드 변경 후 배포 누락 (B팀)**
   - Backend 코드 변경 시 반드시 Mac mini에 배포
   - 배포 안 하면 A팀 테스트 전부 실패

4. **시간 기록 누락**
   - 모든 보고서에 날짜/시간 필수 기재
   - 규정 1 준수

---

## 5️⃣ 긴급 상황 대응

### Mac mini 서버 다운

```bash
# 1. SSH 접속 확인
ssh woosun@100.123.51.5 "echo OK"

# 2. Backend 프로세스 확인
ssh woosun@100.123.51.5 "ps aux | grep uvicorn"

# 3. Backend 재시작
ssh woosun@100.123.51.5 "cd ~/sparklio_ai_marketing_studio/backend && source venv/bin/activate && pkill -f uvicorn && nohup uvicorn app.main:app --host 0.0.0.0 --port 8000 > ../logs/backend.log 2>&1 &"

# 4. 상태 확인
sleep 5
curl http://100.123.51.5:8000/health
```

### SSD 인식 불가

```bash
# 1. 다른 PC에서 SSD 연결 시도
# 2. 복구 불가 시 원격 저장소에서 클론
git clone https://github.com/your-repo/sparklio_ai_marketing_studio.git K:\sparklio_ai_marketing_studio

# 3. A팀에 즉시 보고
```

---

## 6️⃣ 요약

### 필수 문서 8가지 (매일 확인)

1. ✅ **규정** - `docs/WORK_REGULATIONS.md`
2. ✅ **API 계약** - `docs/A_TEAM_API_CONTRACT_REVIEW_2025-11-18.md`
3. ✅ **서버 및 시스템 구조** - `docs/SYSTEM_ARCHITECTURE.md`, `docs/MAC_MINI_SERVER_GUIDELINES.md`
4. ✅ **LLM 및 에이전트 스팩** - `backend/docs/AGENT_SPECIFICATIONS.md`
5. ✅ **MAIN_EDITOR_PATH** - `frontend/MAIN_EDITOR_PATH.md`
6. ✅ **전일 작업 및 인수인계** - 팀별 Handover 문서
7. ✅ **프로젝트 스테이터스 레포트** - `docs/PROJECT_STATUS_REPORT_2025-11-23.md`
8. ✅ **날짜/시간 확인 및 기록** - 모든 보고서에 기재

### 작업 플로우

```
작업 시작
  ↓
시간 확인 및 기록
  ↓
8가지 필수 문서 확인
  ↓
팀별 전용 문서 확인
  ↓
서버 상태 확인
  ↓
작업 시작
  ↓
(작업 중)
  ↓
작업 완료 후 즉시 커밋
  ↓
작업 보고서 작성
  ↓
익일 작업 계획서 작성
  ↓
Git Push
  ↓
작업 종료
```

---

**작성 완료일**: 2025-11-24 (일요일)
**버전**: v2.0 (완전판)
**다음 액션**: 전체 팀 공유, 매일 체크리스트 준수

**⚠️ 이 가이드는 매일 작업 시작 전 필수 확인사항입니다.**
