# 시스템 환경 세팅 계획서

**날짜**: 2025-11-15 (토요일)
**작성 시간**: 2025-11-14 (금요일) 17:20
**작성자**: Team A (Docs & Architecture)
**목적**: 3-Node Hybrid 인프라 완전 구축
**예상 소요 시간**: 6~8시간

---

## 📋 목차

1. [작업 개요](#1-작업-개요)
2. [노드별 설치 계획](#2-노드별-설치-계획)
3. [Mac mini M2 Server 설정](#3-mac-mini-m2-server-설정)
4. [Desktop RTX 4070 설정](#4-desktop-rtx-4070-설정)
5. [Laptop 개발 환경 설정](#5-laptop-개발-환경-설정)
6. [네트워크 연결 (Tailscale VPN)](#6-네트워크-연결-tailscale-vpn)
7. [통합 테스트](#7-통합-테스트)
8. [Team B/C 시작 준비](#8-team-bc-시작-준비)

---

## 1. 작업 개요

### 1.1 목표
- 3-Node Hybrid 인프라 완전 구축
- Mac mini: 24/7 API Server + DB + Redis
- Desktop: GPU Worker (Whisper, Qwen, ComfyUI, AnimateDiff)
- Laptop: 개발 환경 + Frontend
- Tailscale VPN으로 노드 간 안전한 통신

### 1.2 완료 기준
- ✅ Mac mini에서 FastAPI 서버 실행 (http://localhost:8000)
- ✅ Desktop GPU Worker 연결 확인
- ✅ Tailscale VPN으로 Mac mini ↔ Desktop 통신
- ✅ PostgreSQL, Redis, MinIO 정상 동작
- ✅ Ollama + Qwen 2.5-14B 로컬 실행
- ✅ ComfyUI 서버 실행 (Desktop GPU)
- ✅ Laptop에서 Next.js 개발 서버 실행

### 1.3 작업 순서
1. Mac mini 설정 (2시간)
2. Desktop GPU 설정 (2.5시간)
3. Laptop 설정 (0.5시간)
4. Tailscale 연결 (0.5시간)
5. 통합 테스트 (1시간)
6. 문서화 (0.5시간)

---

## 2. 노드별 설치 계획

### 2.1 Mac mini M2 (24/7 Server)

**역할**: API Gateway, DB, Redis, Celery Scheduler, MinIO

**설치 항목**:
- Docker Desktop for Mac
- PostgreSQL (Docker)
- Redis (Docker)
- MinIO (Docker)
- Python 3.11 (FastAPI)
- Node.js 20 LTS
- Git
- Tailscale

**포트 할당**:
- FastAPI: 8000
- PostgreSQL: 5432
- Redis: 6379
- MinIO: 9000 (API), 9001 (Console)

---

### 2.2 Desktop RTX 4070 (GPU Worker)

**역할**: Whisper STT, Qwen LLM, ComfyUI, AnimateDiff

**설치 항목**:
- NVIDIA Driver 최신
- CUDA 12.1 + cuDNN
- Docker Desktop for Windows
- Ollama (Qwen 2.5-14B, Qwen 2.5-32B)
- ComfyUI + Custom Nodes
- Whisper-large-v3 (faster-whisper)
- Python 3.11
- Git
- Tailscale

**포트 할당**:
- Ollama: 11434
- ComfyUI: 8188
- Whisper API: 8001
- Celery Worker: (내부)

---

### 2.3 Laptop RTX 4060 (Development)

**역할**: Frontend 개발, 테스트, 프레젠테이션

**설치 항목**:
- Node.js 20 LTS
- pnpm 9.x
- VS Code
- Git
- Docker Desktop (선택)
- Tailscale

**포트 할당**:
- Next.js Dev: 3000
- Storybook: 6006

---

## 3. Mac mini M2 Server 설정

### 3.1 Docker Desktop 설치
```bash
# Homebrew 설치 (이미 설치된 경우 스킵)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Docker Desktop 설치
brew install --cask docker

# Docker 실행 확인
docker --version
docker ps
```

### 3.2 Docker Compose 파일 작성

**파일 위치**: `K:\sparklio_ai_marketing_studio\docker\mac-mini\docker-compose.yml`

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: sparklio-postgres
    environment:
      POSTGRES_DB: sparklio
      POSTGRES_USER: sparklio
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    container_name: sparklio-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped

  minio:
    image: minio/minio:latest
    container_name: sparklio-minio
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: ${MINIO_ROOT_USER}
      MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD}
    ports:
      - "9000:9000"
      - "9001:9001"
    volumes:
      - minio_data:/data
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
  minio_data:
```

### 3.3 환경 변수 설정

**파일 위치**: `K:\sparklio_ai_marketing_studio\docker\mac-mini\.env`

```bash
# PostgreSQL
POSTGRES_PASSWORD=sparklio_secure_password_2025

# MinIO
MINIO_ROOT_USER=sparklio
MINIO_ROOT_PASSWORD=sparklio_minio_2025

# FastAPI
DATABASE_URL=postgresql://sparklio:sparklio_secure_password_2025@localhost:5432/sparklio
REDIS_URL=redis://localhost:6379/0

# LLM API Keys
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Desktop GPU Worker (Tailscale)
DESKTOP_OLLAMA_URL=http://sparklio-desktop:11434
DESKTOP_COMFYUI_URL=http://sparklio-desktop:8188
DESKTOP_WHISPER_URL=http://sparklio-desktop:8001
```

### 3.4 Docker 컨테이너 실행

```bash
cd K:\sparklio_ai_marketing_studio\docker\mac-mini
docker-compose up -d

# 상태 확인
docker-compose ps
docker-compose logs -f
```

### 3.5 FastAPI 백엔드 설정

```bash
cd K:\sparklio_ai_marketing_studio

# Python 가상 환경
python3 -m venv venv
source venv/bin/activate  # Mac/Linux
# venv\Scripts\activate   # Windows

# 의존성 설치
pip install -r requirements.txt

# DB 마이그레이션 (추후)
# alembic upgrade head

# 서버 실행 테스트
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**확인**: http://localhost:8000/docs (FastAPI Swagger UI)

---

## 4. Desktop RTX 4070 설정

### 4.1 NVIDIA Driver + CUDA 설치

```powershell
# NVIDIA Driver 확인
nvidia-smi

# CUDA Toolkit 12.1 설치
# https://developer.nvidia.com/cuda-downloads
# Windows > x86_64 > 11 > exe (network)
```

### 4.2 Ollama 설치 및 Qwen 모델 다운로드

```powershell
# Ollama 설치
# https://ollama.com/download/windows

# Qwen 모델 다운로드
ollama pull qwen2.5:14b
ollama pull qwen2.5:32b

# 실행 확인
ollama run qwen2.5:14b "안녕하세요"

# API 서버 확인
curl http://localhost:11434/api/tags
```

### 4.3 ComfyUI 설치

```powershell
# Git 클론
cd C:\AI
git clone https://github.com/comfyanonymous/ComfyUI.git
cd ComfyUI

# Python 가상 환경
python -m venv venv
venv\Scripts\activate

# PyTorch + CUDA 설치
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121

# ComfyUI 의존성 설치
pip install -r requirements.txt

# 실행 테스트
python main.py --listen 0.0.0.0 --port 8188

# 백그라운드 실행 (이후)
# pythonw main.py --listen 0.0.0.0 --port 8188
```

**확인**: http://localhost:8188 (ComfyUI Web UI)

### 4.4 ComfyUI Custom Nodes 설치

```powershell
cd ComfyUI\custom_nodes

# AnimateDiff
git clone https://github.com/Kosinkadink/ComfyUI-AnimateDiff-Evolved.git

# ControlNet
git clone https://github.com/Fannovel16/comfyui_controlnet_aux.git

# IPAdapter
git clone https://github.com/cubiq/ComfyUI_IPAdapter_plus.git

# Manager (선택)
git clone https://github.com/ltdrdata/ComfyUI-Manager.git

# 의존성 설치
cd ComfyUI-AnimateDiff-Evolved
pip install -r requirements.txt
cd ..\..

# ComfyUI 재시작
```

### 4.5 Whisper API 서버 설정

```powershell
# faster-whisper 설치
pip install faster-whisper

# Whisper API 서버 작성
# 파일: C:\AI\whisper-api\server.py
```

**server.py**:
```python
from fastapi import FastAPI, UploadFile, File
from faster_whisper import WhisperModel
import uvicorn
import tempfile

app = FastAPI()

model = WhisperModel("large-v3", device="cuda", compute_type="float16")

@app.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    # 임시 파일 저장
    with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name

    # 음성 인식
    segments, info = model.transcribe(tmp_path, language="ko")

    result = {
        "language": info.language,
        "duration": info.duration,
        "segments": [
            {"start": s.start, "end": s.end, "text": s.text}
            for s in segments
        ]
    }

    return result

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)
```

```powershell
# 실행
python server.py
```

**확인**: http://localhost:8001/docs

### 4.6 Celery Worker 설정

```powershell
cd K:\sparklio_ai_marketing_studio

# Celery Worker 실행
celery -A app.celery_app worker -Q stt_queue,llm_queue,gpu_queue --concurrency=2 --loglevel=info
```

---

## 5. Laptop 개발 환경 설정

### 5.1 Node.js 설치

```bash
# Node.js 20 LTS 다운로드
# https://nodejs.org/

node --version  # v20.x.x
npm --version   # 10.x.x

# pnpm 설치
npm install -g pnpm@9
pnpm --version
```

### 5.2 프로젝트 클론 (이미 완료)

```bash
cd K:\sparklio_ai_marketing_studio

# 의존성 설치 (추후 Team C 작업 시)
# cd frontend
# pnpm install
```

### 5.3 VS Code Extensions 권장

- ESLint
- Prettier
- Tailwind CSS IntelliSense
- Python
- Docker
- GitLens

---

## 6. 네트워크 연결 (Tailscale VPN)

### 6.1 Tailscale 설치

**Mac mini**:
```bash
# Homebrew로 설치
brew install tailscale

# 실행
sudo tailscaled install-system-daemon
tailscale up

# 로그인 후 확인
tailscale status
```

**Desktop (Windows)**:
```powershell
# Tailscale 다운로드
# https://tailscale.com/download/windows

# 설치 후 로그인
tailscale status
```

**Laptop (Windows)**:
```powershell
# 동일하게 설치
tailscale status
```

### 6.2 노드 이름 설정

**Mac mini**:
```bash
tailscale set --hostname sparklio-mac-mini
```

**Desktop**:
```powershell
tailscale set --hostname sparklio-desktop
```

**Laptop**:
```powershell
tailscale set --hostname sparklio-laptop
```

### 6.3 연결 확인

**Mac mini에서**:
```bash
ping sparklio-desktop
curl http://sparklio-desktop:11434/api/tags  # Ollama 확인
curl http://sparklio-desktop:8188  # ComfyUI 확인
```

**Desktop에서**:
```powershell
ping sparklio-mac-mini
curl http://sparklio-mac-mini:8000/docs  # FastAPI 확인
```

---

## 7. 통합 테스트

### 7.1 테스트 체크리스트

**Mac mini**:
- [ ] PostgreSQL 연결: `psql -h localhost -U sparklio -d sparklio`
- [ ] Redis 연결: `redis-cli ping`
- [ ] MinIO 접속: http://localhost:9001
- [ ] FastAPI Swagger: http://localhost:8000/docs

**Desktop**:
- [ ] Ollama API: `curl http://localhost:11434/api/generate -d '{"model":"qwen2.5:14b","prompt":"Hello"}'`
- [ ] ComfyUI Web UI: http://localhost:8188
- [ ] Whisper API: http://localhost:8001/docs
- [ ] GPU 확인: `nvidia-smi`

**Tailscale 통신**:
- [ ] Mac mini → Desktop Ollama: `curl http://sparklio-desktop:11434/api/tags`
- [ ] Mac mini → Desktop ComfyUI: `curl http://sparklio-desktop:8188`
- [ ] Desktop → Mac mini FastAPI: `curl http://sparklio-mac-mini:8000/docs`

### 7.2 E2E 테스트 시나리오

**시나리오 1: LLM Router 테스트**

Mac mini에서:
```bash
curl -X POST http://localhost:8000/api/llm/route \
  -H "Content-Type: application/json" \
  -d '{
    "task": {
      "task_type": "summarization",
      "context_length": 500,
      "quality_level": "standard"
    },
    "prompt": "Sparklio는 AI 마케팅 플랫폼입니다."
  }'
```

**기대 결과**: Qwen 로컬 모델로 라우팅, 요약 결과 반환

---

## 8. Team B/C 시작 준비

### 8.1 Team B (Backend) 작업 환경

**Git 브랜치 생성**:
```bash
git checkout -b feature/smart-llm-router
git checkout -b feature/agent-base-class
```

**작업 디렉토리**:
```
backend/
├── app/
│   ├── router/
│   │   ├── smart_llm_router.py  (Team B 작업)
│   │   ├── model_catalog.py     (Team B 작업)
│   │   └── cost_estimator.py    (Team B 작업)
│   ├── agents/
│   │   ├── base_agent.py        (Team B 작업)
│   │   └── a2a_protocol.py      (Team B 작업)
│   └── main.py
```

**API Contract 참조**:
- `docs/API_CONTRACTS/llm_router.json`
- `docs/PHASE0/LLM_ROUTER_POLICY.md`

---

### 8.2 Team C (Frontend) 작업 환경

**Git 브랜치 생성**:
```bash
git checkout -b feature/nextjs-setup
git checkout -b feature/editor-shell
```

**작업 디렉토리**:
```
frontend/
├── src/
│   ├── app/
│   │   ├── page.tsx
│   │   ├── layout.tsx
│   │   └── editor/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.tsx       (Team C 작업)
│   │   │   └── Sidebar.tsx      (Team C 작업)
│   │   └── chat/
│   └── lib/
```

**Mock 데이터 작성**:
```
frontend/
└── src/
    └── mocks/
        ├── chat.mock.ts        (Team C 작성)
        ├── agents.mock.ts      (Team C 작성)
        └── editor.mock.ts      (Team C 작성)
```

---

## 9. 작업 완료 후 체크리스트

### 9.1 필수 확인 사항
- [ ] Mac mini Docker 컨테이너 3개 실행 중 (PostgreSQL, Redis, MinIO)
- [ ] Mac mini FastAPI 서버 실행 (http://localhost:8000/docs)
- [ ] Desktop Ollama + Qwen 2.5-14B 실행
- [ ] Desktop ComfyUI 서버 실행 (http://localhost:8188)
- [ ] Desktop Whisper API 서버 실행 (http://localhost:8001/docs)
- [ ] Tailscale VPN 3개 노드 연결 완료
- [ ] Mac mini → Desktop 통신 확인
- [ ] `.env` 파일 작성 완료
- [ ] Git 커밋 & Push

### 9.2 문서 작성
- [ ] 환경 설정 완료 보고서: `docs/WORK_REPORTS/2025-11-15_Setup_Complete.md`
- [ ] 트러블슈팅 기록: `docs/TROUBLESHOOTING.md`

### 9.3 Team B/C 공지
- [ ] Slack/Discord에 환경 구축 완료 공지
- [ ] API 엔드포인트 URL 공유
- [ ] `.env.example` 파일 공유
- [ ] Team B/C 작업 시작 가능 알림

---

## 10. 예상 소요 시간 (상세)

| 작업 | 예상 시간 | 난이도 |
|------|----------|--------|
| Mac mini Docker 설정 | 1시간 | ⭐⭐ |
| Mac mini FastAPI 설정 | 1시간 | ⭐⭐ |
| Desktop CUDA + Driver | 0.5시간 | ⭐ |
| Desktop Ollama + Qwen | 1시간 | ⭐⭐ |
| Desktop ComfyUI 설치 | 1.5시간 | ⭐⭐⭐ |
| Desktop Whisper API | 0.5시간 | ⭐⭐ |
| Laptop 설정 | 0.5시간 | ⭐ |
| Tailscale VPN 연결 | 0.5시간 | ⭐ |
| 통합 테스트 | 1시간 | ⭐⭐⭐ |
| 문서화 | 0.5시간 | ⭐ |
| **합계** | **8시간** | - |

---

## 11. 트러블슈팅 (사전 준비)

### 11.1 Docker 컨테이너 접속 안됨
```bash
# 컨테이너 재시작
docker-compose restart

# 로그 확인
docker-compose logs -f postgres
docker-compose logs -f redis
```

### 11.2 Ollama 모델 로딩 실패
```powershell
# 모델 삭제 후 재다운로드
ollama rm qwen2.5:14b
ollama pull qwen2.5:14b

# GPU 메모리 확인
nvidia-smi
```

### 11.3 ComfyUI Custom Node 에러
```powershell
# 의존성 재설치
cd ComfyUI\custom_nodes\ComfyUI-AnimateDiff-Evolved
pip install -r requirements.txt --upgrade

# ComfyUI 재시작
```

### 11.4 Tailscale 연결 안됨
```bash
# 재로그인
tailscale logout
tailscale up

# 방화벽 확인 (Windows)
# Windows Defender Firewall > Allow an app
```

---

## 12. 참고 문서

- `docs/PHASE0/LLM_ROUTER_POLICY.md` - Smart LLM Router 정책
- `docs/PHASE0/VIDEO_PIPELINE_SPEC.md` - 영상 파이프라인 명세
- `docs/PHASE0/COMFYUI_INTEGRATION.md` - ComfyUI 통합 가이드
- `docs/WORK_REGULATIONS.md` - 작업 규정집
- `docs/API_CONTRACTS/` - API 계약서 폴더

---

**작성 완료 후 Git 커밋**:
```bash
git add docs/WORK_PLANS/2025-11-15_SETUP_PLAN.md
git commit -m "[2025-11-14 17:20] docs: 내일 시스템 환경 세팅 계획서 작성"
git push origin master
```

---

**내일(토요일) 작업 시작 전 확인**:
1. 이 문서를 처음부터 끝까지 한 번 읽기
2. 필요한 다운로드 미리 받기 (Docker Desktop, Ollama, CUDA Toolkit)
3. `.env` 파일에 들어갈 API Key 준비
4. 작업 시간 확보 (8시간)
5. 커피 준비 ☕

**화이팅!** 🚀
