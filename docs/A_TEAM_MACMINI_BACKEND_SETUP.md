# 📦 A팀용 맥미니 백엔드 서버 상시 구동 설정서

**작성일**: 2025-11-21
**작성자**: A팀
**목적**: 맥미니에서 Docker Compose로 백엔드 서버 상시 구동 환경 구축

---

## 🎯 목표

맥미니(Control Tower)에서 Docker Compose로 다음 서비스들을 한 번에 구동:
- PostgreSQL (Database)
- Redis (Cache & Queue)
- MinIO (Object Storage)
- **Sparklio Backend (FastAPI, Port 8000/8001)**

재부팅 후에도 자동으로 서비스가 복구되도록 설정하여 B팀/C팀이 안정적으로 개발할 수 있는 환경 제공

---

## 📋 사전 준비사항

### 맥미니 필수 설치 항목
- [x] Docker Desktop for Mac (또는 Docker Engine)
- [x] docker-compose (Docker Desktop에 포함)
- [x] Git
- [x] sparklio_ai_marketing_studio 레포지토리 클론

### Tailscale 네트워크
- 맥미니 IP: `100.123.51.5`
- 데스크탑 IP: `100.120.180.42` (GPU Worker)

---

## 📁 디렉터리 구조

```
~/sparklio_ai_marketing_studio/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   └── services/
│   ├── requirements.txt
│   ├── Dockerfile              # ← 새로 생성
│   ├── .env.mini              # ← 맥미니 전용 환경변수
│   └── .env.mini.example      # ← 환경변수 템플릿
└── docker/
    └── mac-mini/
        ├── docker-compose.yml  # ← Backend 서비스 추가됨
        └── .env               # ← Docker Compose 환경변수
```

---

## 🚀 설정 단계

### Step 1: Backend Dockerfile 생성

`~/sparklio_ai_marketing_studio/backend/Dockerfile` 파일 생성:

```dockerfile
FROM python:3.11-slim

# 환경 변수 설정
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# 시스템 의존성 설치
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    curl \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Python 의존성 설치
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# 애플리케이션 코드 복사
COPY . .

# 필요한 디렉터리 생성
RUN mkdir -p /app/logs /app/uploads /app/temp

# 포트 노출
EXPOSE 8000 8001

# 헬스체크
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# 실행 명령
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
```

### Step 2: 환경 변수 파일 생성

`~/sparklio_ai_marketing_studio/backend/.env.mini` 파일 생성:

```env
# ============================================================================
# Sparklio Backend Environment Variables - Mac Mini Production
# ============================================================================

# Application Settings
ENV=production
DEBUG=false
GENERATOR_MODE=live
API_PORT=8000
ADMIN_PORT=8001

# ============================================================================
# Database Configuration
# ============================================================================
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_DB=sparklio
POSTGRES_USER=sparklio
POSTGRES_PASSWORD=YOUR_SECURE_PASSWORD_HERE  # ⚠️ 실제 비밀번호로 교체
DATABASE_URL=postgresql+psycopg2://sparklio:YOUR_SECURE_PASSWORD_HERE@postgres:5432/sparklio

# ============================================================================
# Redis Configuration
# ============================================================================
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=YOUR_REDIS_PASSWORD_HERE  # ⚠️ 실제 비밀번호로 교체
REDIS_URL=redis://:YOUR_REDIS_PASSWORD_HERE@redis:6379/0

# ============================================================================
# MinIO Configuration
# ============================================================================
MINIO_ENDPOINT=minio:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=YOUR_MINIO_PASSWORD_HERE  # ⚠️ 실제 비밀번호로 교체
MINIO_USE_SSL=false
MINIO_BUCKET_NAME=sparklio-assets

# ============================================================================
# GPU Worker Configuration (Desktop)
# ============================================================================
OLLAMA_BASE_URL=http://100.120.180.42:11434
COMFYUI_BASE_URL=http://100.120.180.42:8188
NANOBANANA_BASE_URL=http://100.120.180.42:8080  # 사용 시

# ============================================================================
# LLM API Keys
# ============================================================================
OPENAI_API_KEY=YOUR_OPENAI_API_KEY_HERE  # ⚠️ 실제 API 키로 교체
ANTHROPIC_API_KEY=YOUR_ANTHROPIC_API_KEY_HERE  # ⚠️ 실제 API 키로 교체
GOOGLE_API_KEY=YOUR_GOOGLE_API_KEY_HERE  # ⚠️ 실제 API 키로 교체

# ============================================================================
# LLM Model Configuration
# ============================================================================
DEFAULT_LLM_MODEL=gpt-4o-mini
GEMINI_TEXT_MODEL=gemini-2.5-flash
CLAUDE_MODEL=claude-3-sonnet-20240229

# ============================================================================
# CORS Configuration
# ============================================================================
CORS_ORIGINS=["http://localhost:3000", "http://100.123.51.5:3000", "http://100.120.180.42:3000"]
```

### Step 3: Docker Compose 설정 확인

`~/sparklio_ai_marketing_studio/docker/mac-mini/docker-compose.yml`이 이미 업데이트됨:
- ✅ Backend 서비스 추가 완료
- ✅ 포트 매핑 (8000, 8001)
- ✅ 헬스체크 설정
- ✅ 자동 재시작 정책 (restart: unless-stopped)

### Step 4: Docker Compose 환경 변수

`~/sparklio_ai_marketing_studio/docker/mac-mini/.env` 파일 생성:

```env
# Docker Compose 전용 환경 변수
COMPOSE_PROJECT_NAME=sparklio

# PostgreSQL
POSTGRES_DB=sparklio
POSTGRES_USER=sparklio
POSTGRES_PASSWORD=YOUR_SECURE_PASSWORD_HERE

# Redis
REDIS_PASSWORD=YOUR_REDIS_PASSWORD_HERE

# MinIO
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=YOUR_MINIO_PASSWORD_HERE

# 포트 설정
API_PORT=8000
ADMIN_PORT=8001
POSTGRES_PORT=5432
REDIS_PORT=6379
MINIO_API_PORT=9000
MINIO_CONSOLE_PORT=9001
PGADMIN_PORT=5050

# GPU Worker URLs
OLLAMA_BASE_URL=http://100.120.180.42:11434
COMFYUI_BASE_URL=http://100.120.180.42:8188

# API Keys (백엔드에서 사용)
GOOGLE_API_KEY=YOUR_GOOGLE_API_KEY_HERE
OPENAI_API_KEY=YOUR_OPENAI_API_KEY_HERE
ANTHROPIC_API_KEY=YOUR_ANTHROPIC_API_KEY_HERE

# 운영 모드
GENERATOR_MODE=live
DEBUG=false
```

---

## 🖥️ 실행 방법

### 1. 최초 실행 (맥미니 터미널)

```bash
# 1. 프로젝트 디렉터리로 이동
cd ~/sparklio_ai_marketing_studio/docker/mac-mini

# 2. 백엔드 이미지 빌드 및 전체 스택 실행
docker compose up -d --build

# 3. 컨테이너 상태 확인
docker compose ps

# 4. 로그 확인 (문제 발생 시)
docker compose logs backend
docker compose logs -f  # 실시간 전체 로그
```

### 2. 헬스체크

```bash
# 맥미니 내부에서
curl http://localhost:8000/health
curl http://localhost:8001/api/v1/admin/stats

# 외부 (노트북/데스크탑)에서
curl http://100.123.51.5:8000/health
curl http://100.123.51.5:8001/api/v1/admin/stats
```

### 3. 서비스 관리

```bash
# 서비스 중지
docker compose stop

# 서비스 재시작
docker compose restart

# 특정 서비스만 재시작
docker compose restart backend

# 전체 스택 제거 (데이터는 유지)
docker compose down

# 전체 스택 및 데이터 제거 (주의!)
docker compose down -v
```

---

## 🔄 자동 시작 설정

### Docker Desktop 자동 시작 (macOS)

1. 상단 메뉴바 Docker 아이콘 클릭
2. **Preferences** → **General**
3. **"Start Docker Desktop when you log in"** 체크
4. **Apply & Restart**

### 재부팅 시 동작
- Docker Desktop이 자동으로 시작
- `restart: unless-stopped` 정책에 따라 모든 컨테이너 자동 복구
- B팀/C팀은 별도 조치 없이 바로 개발 가능

---

## 🔍 트러블슈팅

### 포트 충돌 발생 시
```bash
# 포트 사용 중인 프로세스 확인
lsof -i :8000
lsof -i :8001

# 기존 프로세스 종료 후 재시작
docker compose restart backend
```

### 데이터베이스 연결 실패 시
```bash
# PostgreSQL 상태 확인
docker compose exec postgres psql -U sparklio -d sparklio -c "SELECT 1;"

# 데이터베이스 재생성
docker compose exec postgres psql -U sparklio -c "DROP DATABASE IF EXISTS sparklio;"
docker compose exec postgres psql -U sparklio -c "CREATE DATABASE sparklio;"
```

### 백엔드 로그 확인
```bash
# 실시간 로그
docker compose logs -f backend

# 최근 100줄
docker compose logs --tail=100 backend

# 특정 시간 이후 로그
docker compose logs --since="2025-11-21T10:00:00" backend
```

---

## 📌 중요 참고사항

### 보안
- ⚠️ **절대 API 키를 Git에 커밋하지 마세요**
- `.env.mini` 파일은 `.gitignore`에 포함되어 있어야 함
- 실제 운영 시 강력한 비밀번호 사용 필수

### 네트워크
- 맥미니 Tailscale IP: `100.123.51.5`
- 모든 팀원은 Tailscale 네트워크에 연결되어 있어야 함
- 방화벽에서 8000, 8001 포트 허용 필요

### 백업
- PostgreSQL 데이터: `docker volume` 백업
- MinIO 데이터: 정기적인 스냅샷 권장

---

## 📞 연락처

문제 발생 시 연락:
- A팀 Slack: #a-team-infra
- 긴급: @a-team-oncall

---

**마지막 업데이트**: 2025-11-21 by A팀