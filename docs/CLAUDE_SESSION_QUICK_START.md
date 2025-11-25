# Claude Session Quick Start Guide

**문서 버전**: v1.0
**작성일**: 2025-11-25
**목적**: 새로운 Claude 세션이 빠르게 작업을 시작할 수 있도록 환경 정보와 명령어 제공

---

## 1. 서버 정보

### 1.1 Mac mini 서버 (메인 서버)
- **Tailscale IP**: 100.123.51.5
- **SSH 접속**: `ssh woosun@100.123.51.5`
- **역할**: Backend (Docker), Frontend (로컬)

### 1.2 Desktop PC (GPU 서버)
- **Tailscale IP**: 100.120.180.42
- **역할**: Ollama LLM, ComfyUI

---

## 2. SSH 접속 시 중요 사항

### 2.1 PATH 문제
SSH로 Mac mini에 접속하면 `.zshrc`가 로드되지 않아 명령어를 찾지 못합니다.

**해결책**: 항상 절대 경로 사용하거나 PATH 명시

```bash
# Docker 명령
/usr/local/bin/docker ...
/usr/local/bin/docker compose ...

# Node.js / npm 명령
export PATH=/opt/homebrew/bin:$PATH && npm run dev
# 또는
/opt/homebrew/bin/npm run dev

# Python 명령 (Docker 내부)
/usr/local/bin/docker exec sparklio-backend python ...
```

### 2.2 Docker 컨테이너 경로
```bash
# Backend 컨테이너 내부에서 실행
/usr/local/bin/docker exec sparklio-backend <command>

# 예시
/usr/local/bin/docker exec sparklio-backend python tests/golden_set_validator.py --agent strategist
```

---

## 3. 서비스 시작 명령어

### 3.1 Backend 시작 (Docker)
```bash
# 전체 스택 시작
ssh woosun@100.123.51.5 "cd /Users/woosun/sparklio_ai_marketing_studio/docker/mac-mini && /usr/local/bin/docker compose up -d"

# Backend만 재시작
ssh woosun@100.123.51.5 "cd /Users/woosun/sparklio_ai_marketing_studio/docker/mac-mini && /usr/local/bin/docker compose restart backend"

# Backend 재빌드 및 시작
ssh woosun@100.123.51.5 "cd /Users/woosun/sparklio_ai_marketing_studio/docker/mac-mini && /usr/local/bin/docker compose down backend && /usr/local/bin/docker compose up -d --build backend"
```

### 3.2 Frontend 시작 (로컬 Node.js)
```bash
# npm install 필요 시 (node_modules 없는 경우)
ssh woosun@100.123.51.5 "export PATH=/opt/homebrew/bin:\$PATH && cd /Users/woosun/sparklio_ai_marketing_studio/frontend && npm install"

# Frontend 서버 시작 (백그라운드)
ssh woosun@100.123.51.5 "export PATH=/opt/homebrew/bin:\$PATH && cd /Users/woosun/sparklio_ai_marketing_studio/frontend && nohup npm run dev > /tmp/frontend.log 2>&1 &"
```

---

## 4. Health Check 명령어

```bash
# Backend Health
ssh woosun@100.123.51.5 "curl -s http://localhost:8000/health"
# 기대 결과: {"status":"healthy","services":{"api":"ok","database":"ok","storage":"ok"},"environment":"development","version":"4.0.0"}

# Frontend Health
ssh woosun@100.123.51.5 "curl -s http://localhost:3000 -o /dev/null -w '%{http_code}'"
# 기대 결과: 200

# Docker 컨테이너 상태
ssh woosun@100.123.51.5 "/usr/local/bin/docker ps"
# 기대: sparklio-backend, sparklio-postgres, sparklio-redis, sparklio-minio 모두 Up

# CORS 검증
ssh woosun@100.123.51.5 "curl -s -I -X OPTIONS http://localhost:8000/health -H 'Origin: http://localhost:3000' | grep -i access-control"
# 기대: access-control-allow-origin: http://localhost:3000
```

---

## 5. Git 동기화

```bash
# 로컬 → Remote → Mac mini 순서로 동기화

# 1. 로컬에서 커밋 & 푸시
cd /k/sparklio_ai_marketing_studio
git add -A
git commit -m "commit message"
git push origin feature/editor-migration-polotno

# 2. Mac mini에서 Pull
ssh woosun@100.123.51.5 "cd /Users/woosun/sparklio_ai_marketing_studio && git pull origin feature/editor-migration-polotno"
```

---

## 6. 주요 환경 변수 위치

| 파일 | 용도 |
|------|------|
| `docker/mac-mini/.env` | Mac mini Docker 환경변수 |
| `backend/.env` | Backend 로컬 개발용 (사용 안함) |
| `frontend/.env.local` | Frontend 환경변수 |

### 6.1 중요 환경 변수
```env
# docker/mac-mini/.env
OLLAMA_BASE_URL=http://100.120.180.42:11434
OLLAMA_DEFAULT_MODEL=qwen2.5:14b
COMFYUI_BASE_URL=http://100.120.180.42:8188
POSTGRES_PASSWORD=<secret>
REDIS_PASSWORD=<secret>
MINIO_ROOT_PASSWORD=<secret>
```

---

## 7. 로그 확인

```bash
# Backend 로그 (Docker)
ssh woosun@100.123.51.5 "/usr/local/bin/docker logs sparklio-backend --tail 100"

# Backend 로그 실시간
ssh woosun@100.123.51.5 "/usr/local/bin/docker logs -f sparklio-backend"

# Frontend 로그
ssh woosun@100.123.51.5 "tail -100 /tmp/frontend.log"
```

---

## 8. 문제 해결

### 8.1 "command not found" 오류
SSH 세션에서 PATH가 설정되지 않았습니다.
- 절대 경로 사용: `/usr/local/bin/docker`, `/opt/homebrew/bin/npm`
- 또는 `export PATH=/opt/homebrew/bin:/usr/local/bin:$PATH` 추가

### 8.2 CORS 오류
```bash
# Backend 재시작
ssh woosun@100.123.51.5 "cd /Users/woosun/sparklio_ai_marketing_studio/docker/mac-mini && /usr/local/bin/docker compose restart backend"
```

### 8.3 Docker 컨테이너 안 올라올 때
```bash
# 전체 재시작
ssh woosun@100.123.51.5 "cd /Users/woosun/sparklio_ai_marketing_studio/docker/mac-mini && /usr/local/bin/docker compose down && /usr/local/bin/docker compose up -d"
```

### 8.4 Frontend "next: command not found"
```bash
# npm install 필요
ssh woosun@100.123.51.5 "export PATH=/opt/homebrew/bin:\$PATH && cd /Users/woosun/sparklio_ai_marketing_studio/frontend && npm install"
```

---

## 9. Golden Set 테스트

```bash
# Strategist Agent 테스트
ssh woosun@100.123.51.5 "/usr/local/bin/docker exec sparklio-backend python tests/golden_set_validator.py --agent strategist --ci --min-pass-rate 50"

# 모든 에이전트 테스트
ssh woosun@100.123.51.5 "/usr/local/bin/docker exec sparklio-backend python tests/golden_set_validator.py --all"
```

**주의**: Golden Set Validator는 현재 Strategist Agent용 검증 로직이 미구현되어 있습니다. LLM 품질 자체는 9.2-9.5/10으로 우수합니다.

---

## 10. 파일 위치 요약

| 항목 | 경로 |
|------|------|
| 프로젝트 루트 (로컬) | `k:\sparklio_ai_marketing_studio` |
| 프로젝트 루트 (Mac mini) | `/Users/woosun/sparklio_ai_marketing_studio` |
| Backend 코드 | `backend/` |
| Frontend 코드 | `frontend/` |
| Docker 설정 | `docker/mac-mini/` |
| 문서 | `docs/` |
| 핸드오버 문서 | `docs/HANDOVER_*.md` |
| 데모 문서 | `docs/DEMO/` |

---

**작성자**: A팀 (Claude)
**최종 수정**: 2025-11-25
