# 📋 세션 시작 체크리스트

**목적**: 매일 작업 시작 시 1분 안에 인프라/코드/문서 상태를 점검
**환경**: 맥미니(Backend/DB) + Desktop(ComfyUI/Ollama) + 노트북(개발 환경)
**사용 방법**: 위에서 아래로 순서대로 체크하며, 모든 항목이 ✅ 되면 작업 시작

**작성일**: 2025-11-18
**최종 업데이트**: 2025-11-18

---

## 1️⃣ 인프라 / 네트워크 상태 점검 (2분)

### 시간 확인
- [ ] **현재 날짜/요일/시간 확인**
  ```powershell
  # Windows (PowerShell)
  powershell -Command "Get-Date -Format 'yyyy-MM-dd (dddd) HH:mm:ss'"

  # macOS/Linux
  date "+%Y-%m-%d (%A) %H:%M:%S"
  ```
  > 📌 매일 작업 시작, 보고서 작성, Git 커밋 시마다 확인하여 문서에 기록

### 네트워크 연결
- [ ] **Tailscale VPN 연결 상태 확인**
  ```bash
  tailscale status
  # 또는
  tailscale status | grep -E "100.120.180.42|100.123.51.5"
  ```
  > 맥미니와 Desktop이 VPN에 연결되어 있어야 함

- [ ] **맥미니 M2 서버 연결 확인**
  ```bash
  ping -c 3 100.123.51.5
  # 또는
  curl -s --connect-timeout 3 http://100.123.51.5:8000/
  ```
  > 맥미니 IP: `100.123.51.5` (Tailscale)

- [ ] **Desktop RTX 4070 연결 확인**
  ```bash
  ping -c 3 100.120.180.42
  # 또는
  curl -s --connect-timeout 3 http://100.120.180.42:11434/api/tags | head -5
  ```
  > Desktop IP: `100.120.180.42` (Tailscale)

### 맥미니 인프라 상태
- [ ] **SSH 접속 확인**
  ```bash
  ssh woosun@100.123.51.5 "echo 'SSH OK'"
  ```

- [ ] **Docker 컨테이너 상태 확인**
  ```bash
  ssh woosun@100.123.51.5 "/Applications/Docker.app/Contents/Resources/bin/docker ps --format 'table {{.Names}}\t{{.Status}}'"
  ```
  > 확인 항목:
  > - `sparklio-postgres` → Up (healthy)
  > - `sparklio-redis` → Up (healthy)
  > - `sparklio-minio` → Up (healthy)

- [ ] **Backend FastAPI 서버 상태 확인**
  ```bash
  # Health Check API
  curl -s http://100.123.51.5:8000/health

  # 브라우저에서 확인
  # http://100.123.51.5:8000/docs (FastAPI Swagger UI)
  ```
  > 예상 응답: `{"status":"healthy","services":{"api":"ok","database":"ok","storage":"ok"}}`

### Desktop 인프라 상태
- [ ] **Ollama 서버 상태 확인**
  ```bash
  curl -s http://100.120.180.42:11434/api/tags | head -20
  ```
  > 설치된 모델 목록이 출력되어야 함:
  > - qwen2.5:7b
  > - mistral-small:latest
  > - qwen2.5:14b
  > - llama3.2:latest

- [ ] **ComfyUI 서버 상태 확인**
  ```bash
  curl -I --connect-timeout 3 http://100.120.180.42:8188

  # 브라우저에서 확인
  # http://100.120.180.42:8188
  ```
  > 예상 응답: `HTTP/1.1 200 OK` 또는 ComfyUI 웹 UI가 로드됨

---

## 2️⃣ Git / 코드 상태 점검 (1분)

- [ ] **현재 브랜치 및 상태 확인**
  ```bash
  cd K:\sparklio_ai_marketing_studio  # Windows
  # cd ~/sparklio_ai_marketing_studio  # macOS/Linux

  git branch
  git status
  ```
  > 현재 브랜치: `master` (또는 작업 중인 feature 브랜치)

- [ ] **원격 저장소 최신 상태 확인**
  ```bash
  git fetch origin
  git log origin/master --oneline -5
  ```

- [ ] **로컬과 원격 동기화 상태 확인**
  ```bash
  git status
  ```
  > 확인 항목:
  > - "Your branch is up to date with 'origin/master'" ✅
  > - "Your branch is ahead of 'origin/master' by X commits" → 푸시 필요
  > - "Your branch is behind 'origin/master'" → 풀 필요

- [ ] **Uncommitted 변경사항 확인**
  ```bash
  git status
  ```
  > - "nothing to commit, working tree clean" ✅
  > - "Changes not staged" 또는 "Untracked files" 있으면 → 확인 후 커밋 여부 결정

- [ ] **작업 브랜치 확인**
  ```bash
  git branch --show-current
  ```
  > 올바른 브랜치에서 작업 중인지 확인 (보통 `master` 또는 `develop`)

---

## 3️⃣ 환경 변수 및 가상환경 점검 (1분)

### 환경 변수 파일 확인
- [ ] **Backend .env 파일 존재 확인**
  ```bash
  # 로컬 (노트북)
  ls -la K:\sparklio_ai_marketing_studio\backend\.env

  # 맥미니
  ssh woosun@100.123.51.5 "ls -la ~/sparklio_ai_marketing_studio/backend/.env"
  ```

- [ ] **핵심 환경 변수 확인 (맥미니)**
  ```bash
  ssh woosun@100.123.51.5 "cd ~/sparklio_ai_marketing_studio/backend && cat .env | grep -E 'APP_HOST|APP_PORT|DATABASE_URL|REDIS_URL|MINIO_ENDPOINT'"
  ```
  > 확인 항목:
  > - `APP_HOST=0.0.0.0`
  > - `APP_PORT=8000`
  > - `DATABASE_URL` 설정됨
  > - `REDIS_URL` 설정됨
  > - `MINIO_ENDPOINT` 설정됨

### 가상환경 확인
- [ ] **맥미니 Python 가상환경 확인**
  ```bash
  ssh woosun@100.123.51.5 "cd ~/sparklio_ai_marketing_studio/backend && ls -la .venv/bin/activate"
  ```
  > `.venv/bin/activate` 파일이 존재해야 함

- [ ] **가상환경 활성화 테스트 (맥미니)**
  ```bash
  ssh woosun@100.123.51.5 "cd ~/sparklio_ai_marketing_studio/backend && source .venv/bin/activate && python --version"
  ```
  > Python 3.11 이상이 출력되어야 함

### 의존성 확인 (선택적)
- [ ] **주요 패키지 설치 확인 (맥미니)**
  ```bash
  ssh woosun@100.123.51.5 "cd ~/sparklio_ai_marketing_studio/backend && source .venv/bin/activate && pip list | grep -E 'fastapi|openai|anthropic|google'"
  ```
  > 확인 항목:
  > - `fastapi`
  > - `openai`
  > - `anthropic`
  > - `google-generativeai`
  > - `google-genai`

---

## 4️⃣ 서비스 상태 빠른 점검 (1분)

### LLM Gateway 테스트
- [ ] **LLM Gateway 기본 호출 테스트**
  ```bash
  curl -s -X POST http://100.123.51.5:8000/api/v1/llm/generate \
    -H "Content-Type: application/json" \
    -d '{"prompt":"Hello","provider":"ollama","model":"qwen2.5:7b"}' | head -20
  ```
  > 정상 응답 시: JSON 형식의 LLM 응답 반환

### Agent API 테스트
- [ ] **Agent 목록 조회 테스트**
  ```bash
  curl -s http://100.123.51.5:8000/api/v1/agents/list | head -30
  ```
  > 예상 응답: 6개 Agent 목록 (copywriter, strategist, designer, reviewer, optimizer, editor)

### Media Gateway 테스트 (선택적)
- [ ] **🔲 TODO: ComfyUI 이미지 생성 간단 호출 테스트**
  ```bash
  # TODO: 실제 API 엔드포인트 확인 후 채우기
  # curl -X POST http://100.123.51.5:8000/api/v1/media/generate ...
  ```

---

## 5️⃣ 문서 읽기 / 오늘 작업 계획 확인 (2분)

### 어제 작업 내용 확인
- [ ] **어제 EOD(End of Day) 보고서 확인**
  ```bash
  # 가장 최근 EOD 보고서 찾기
  ls -lt K:\sparklio_ai_marketing_studio\docs\reports\*EOD*.md | head -3

  # 파일 읽기 (예시)
  # cat K:\sparklio_ai_marketing_studio\docs\reports\TEAM_ALL_EOD_REPORT_2025-11-17.md
  ```
  > 확인 항목:
  > - 어제 완료된 작업
  > - 진행 중인 작업
  > - 오늘 우선순위

- [ ] **각 팀별 전일 작업 보고서 확인**
  ```bash
  # A팀 보고서
  ls -lt K:\sparklio_ai_marketing_studio\docs\reports\*A*.md | head -1

  # B팀 보고서
  ls -lt K:\sparklio_ai_marketing_studio\backend\*EOD*.md | head -1

  # C팀 보고서
  ls -lt K:\sparklio_ai_marketing_studio\docs\*C팀*.md | head -1
  ```

### 오늘 작업 계획 확인
- [ ] **"준비 완료 보고서" 또는 익일 작업 계획 확인**
  ```bash
  # 최근 작업 계획서/지시서 찾기
  ls -lt K:\sparklio_ai_marketing_studio\docs\*WORK*.md | head -3
  ls -lt K:\sparklio_ai_marketing_studio\docs\WORK_PLANS\*.md | head -3
  ```
  > 읽어야 할 문서 예시:
  > - `NEXT_DAY_WORK_ORDER_*.md`
  > - `SESSION_START_CHECKLIST.md` (본 문서)
  > - `TEAM_*_INSTRUCTIONS.md`

- [ ] **오늘 P0 / P1 작업 목록 재확인**
  ```
  📌 EOD 보고서 또는 작업 계획서에서:

  P0 (최우선):
  - [ ] ...
  - [ ] ...

  P1 (중요):
  - [ ] ...
  - [ ] ...

  P2 (여유 시):
  - [ ] ...
  ```

- [ ] **MASTER_TODO.md 확인 (전체 프로젝트 진행 상황)**
  ```bash
  cat K:\sparklio_ai_marketing_studio\docs\WORK_PLANS\MASTER_TODO.md | head -100
  ```

---

## ✅ 최종 체크

모든 체크리스트를 완료했다면:

- [ ] **인프라 상태**: 🟢 맥미니 + Desktop 모두 정상
- [ ] **Git 상태**: 🟢 동기화됨, 작업 브랜치 확인
- [ ] **환경 변수**: 🟢 .env 파일 존재, 핵심 변수 설정됨
- [ ] **서비스 상태**: 🟢 LLM Gateway, Agent API 정상 응답
- [ ] **문서 확인**: 🟢 어제 EOD, 오늘 작업 계획 파악 완료

**→ 작업 시작 준비 완료! 🚀**

---

## 📝 참고사항

### 자주 사용하는 명령어 모음

**맥미니 Backend 서버 재시작**:
```bash
ssh woosun@100.123.51.5 "pkill -f uvicorn && cd ~/sparklio_ai_marketing_studio/backend && source .venv/bin/activate && nohup python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 > /tmp/backend.log 2>&1 &"
```

**Docker 컨테이너 재시작**:
```bash
ssh woosun@100.123.51.5 "cd ~/sparklio_ai_marketing_studio/docker/mac-mini && /Applications/Docker.app/Contents/Resources/bin/docker-compose restart"
```

**Git 빠른 동기화**:
```bash
git fetch origin && git status && git log origin/master --oneline -5
```

### 문제 발생 시 체크 포인트

**Backend 서버 응답 없음**:
1. Docker 컨테이너 상태 확인 (`docker ps`)
2. Backend 프로세스 확인 (`ssh woosun@100.123.51.5 "ps aux | grep uvicorn"`)
3. Backend 로그 확인 (`ssh woosun@100.123.51.5 "tail -50 /tmp/backend.log"`)

**의존성 에러 발생**:
1. requirements.txt 확인
2. 가상환경 재설치 (`pip install -r requirements.txt`)
3. 누락된 패키지 수동 설치

**네트워크 연결 불가**:
1. Tailscale 재시작 (`tailscale down && tailscale up`)
2. 맥미니/Desktop 네트워크 설정 확인
3. 방화벽 설정 확인

---

**작성자**: A팀 QA 리더
**업데이트 이력**:
- 2025-11-18: 초안 작성
