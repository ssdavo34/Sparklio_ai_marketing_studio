# Sparklio AI Marketing Studio - 최종 환경 설정 상태

**작성일**: 2025-11-15
**작성팀**: A팀 (인프라/환경 설정)
**버전**: Final v1.0
**상태**: 완료 (B/C팀 작업 준비 완료)

---

## 목차

1. [전체 시스템 개요](#1-전체-시스템-개요)
2. [노드별 상세 구성](#2-노드별-상세-구성)
3. [완료된 작업](#3-완료된-작업)
4. [남은 작업](#4-남은-작업)
5. [B/C팀 시작 가이드](#5-bc팀-시작-가이드)

---

## 1. 전체 시스템 개요

### 1.1 3-Node 하이브리드 인프라

```
┌────────────────────────────────────────────────────┐
│           Tailscale VPN Network                    │
│           (ssdavo34@ 계정)                         │
└────────────────────────────────────────────────────┘
       │                  │                  │
  ┌────▼──────┐     ┌─────▼──────┐     ┌────▼──────┐
  │ Desktop   │     │ Mac mini   │     │ Laptop    │
  │ GPU Worker│     │ Backend    │     │ Frontend  │
  │100.120... │     │100.123...  │     │100.101... │
  └───────────┘     └────────────┘     └───────────┘
```

### 1.2 역할 분담

| 노드 | Tailscale IP | 주요 역할 | 상태 |
|------|--------------|-----------|------|
| **Desktop** | 100.120.180.42 | AI 생성 워커 (Ollama, ComfyUI) | ✅ 설정 완료 |
| **Mac mini** | 100.123.51.5 | 백엔드 서버 (Docker, DB, MinIO) | ✅ 설정 완료 |
| **Laptop** | 100.101.68.23 | 프론트엔드 개발 환경 | ⏳ K: SSD 연결 시 |

### 1.3 포트 할당 (확정)

#### 공통 백엔드 서비스 (Mac mini)
- **PostgreSQL**: 5432
- **Redis**: 6379
- **MinIO API**: 9000
- **MinIO Console**: 9001

#### 팀별 개발 서비스
- **A팀 (Desktop)**:
  - Ollama: 11434
  - ComfyUI: 8188

- **B팀 (Mac mini Backend API)**:
  - FastAPI (dev): **8000**
  - FastAPI (test): **8001** (선택)

- **C팀 (Laptop Frontend)**:
  - Next.js: **3000**

---

## 2. 노드별 상세 구성

### 2.1 Desktop GPU Worker (100.120.180.42)

#### 시스템 정보
- **OS**: Windows 11
- **GPU**: NVIDIA RTX 4070 SUPER (12GB VRAM)
- **CPU**: Intel i7
- **역할**: AI 추론 및 생성 워커

#### 설치된 소프트웨어

**1. Ollama (Docker)**
```
컨테이너: ollama (from n8n starter kit)
포트: 11434
모델 저장소: Docker 볼륨 (self-hosted-ai-starter-kit_ollama_storage)
```

**설치된 LLM 모델**:
| 모델 | 크기 | 용도 | 상태 |
|------|------|------|------|
| `qwen2.5:7b` | 4.7 GB | 빠른 추론 | ✅ 설치됨 |
| `qwen2.5:14b` | 9.0 GB | 고품질 생성 | ✅ 설치됨 |
| `mistral-small` | 14 GB | 다국어/코딩 | ✅ 설치됨 |
| `llama3.2` | 2.0 GB | 경량 작업 | ✅ 설치됨 |

**총 모델 용량**: 29.7 GB

**Ollama 시작 방법**:
```powershell
# Docker 컨테이너가 자동 시작됨 (Docker Desktop 실행 시)
docker ps | grep ollama  # 상태 확인
```

**API 테스트**:
```powershell
curl http://100.120.180.42:11434/api/tags
```

---

**2. ComfyUI (단독 실행)**

⚠️ **중요**: ComfyUI는 Docker가 아니라 **Windows에서 직접 실행**합니다.

```
경로: D:\AI\ComfyUI\ComfyUI
Python: 내장 Python 3.9.6 (python_embeded/)
포트: 8188
```

**시작 방법**:
```powershell
cd D:\AI\ComfyUI\ComfyUI
.\python_embeded\python.exe main.py
```

**브라우저 접속**:
- 로컬: `http://localhost:8188`
- Tailscale: `http://100.120.180.42:8188`

**설치된 커스텀 노드**:
- ComfyUI-AnimateDiff-Evolved (비디오 생성)
- comfyui_controlnet_aux (이미지 제어)
- ComfyUI_IPAdapter_plus (스타일 일관성)

---

**3. FFmpeg**
```
경로: D:\AI\ffmpeg\ffmpeg-master-latest-win64-gpl\bin
버전: 2025-11-14 (최신)
PATH 등록: ✅ 완료
```

**테스트**:
```powershell
ffmpeg -version
```

---

**4. Faster-Whisper (GPU 가속)**
```
Python: 3.11.8
설치 경로: Python 3.11 site-packages
CUDA: 13.0 (GPU 가속)
```

---

### 2.2 Mac mini Backend Server (100.123.51.5)

#### 시스템 정보
- **OS**: macOS (Darwin 25.0.0, ARM64 M2)
- **CPU**: Apple M2
- **RAM**: 24GB
- **스토리지**: 512GB 내장 SSD
- **역할**: 백엔드 API 서버, 데이터베이스, 오브젝트 스토리지

#### Docker 서비스 (3개)

**프로젝트명**: `sparklio`

| 서비스 | 컨테이너명 | 포트 | 상태 | 용도 |
|--------|-----------|------|------|------|
| **PostgreSQL** | sparklio-postgres | 5432 | ✅ Running | 메인 데이터베이스 |
| **Redis** | sparklio-redis | 6379 | ✅ Running | 캐싱, 작업 큐 |
| **MinIO** | sparklio-minio | 9000, 9001 | ✅ Running | 오브젝트 스토리지 |

**Docker 시작**:
```bash
cd ~/sparklio_ai_marketing_studio/docker/mac-mini
docker compose up -d
```

**상태 확인**:
```bash
docker ps
```

---

#### PostgreSQL 설정

**접속 정보**:
```
Host: 100.123.51.5
Port: 5432
Database: sparklio
User: sparklio
Password: sparklio_secure_2025
```

**연결 문자열**:
```
postgresql://sparklio:sparklio_secure_2025@100.123.51.5:5432/sparklio
```

**생성된 테이블** (5개):
1. `users` - 사용자
2. `brands` - 브랜드
3. `projects` - 프로젝트/캠페인
4. `generated_assets` - 자산 메타데이터 (메인)
5. `generated_texts` - 텍스트 자산 전용

**확장 기능**:
- ✅ `pgvector` v0.8.1 (벡터 유사도 검색)
- ✅ `uuid-ossp` (UUID 생성)

**인덱스**: 7개 생성 (성능 최적화)

---

#### MinIO 설정

**접속 정보**:
```
API Endpoint: http://100.123.51.5:9000
Console: http://100.123.51.5:9001
Access Key: sparklio
Secret Key: sparklio_minio_2025
```

**생성된 버킷** (3개):
1. `dev-sparklio-assets` - 메인 자산 저장소
2. `dev-sparklio-temp` - 임시 파일 (7일 자동 삭제)
3. `dev-sparklio-backups` - 백업 저장소

**경로 구조**:
```
dev-sparklio-assets/
└── {asset_type}/              # images, videos, audio, documents, texts
    └── {brand_id}/
        └── {project_id}/
            └── {YYYY}/
                └── {MM}/
                    └── {DD}/
                        └── {uuid}.{ext}
```

**예시**:
```
dev-sparklio-assets/images/brand_abc123/campaign_winter2025/2025/11/15/9f2e4a1b-8c3d-4e5f-a6b7-1d2e3f4a5b6c.png
```

---

#### Redis 설정

```
Host: 100.123.51.5
Port: 6379
Password: (없음 - Tailscale 내부 네트워크)
```

**용도**:
- 세션 캐싱
- Celery 작업 큐 (Phase 2)
- 임시 데이터 저장

---

#### Backend Python 환경

```
경로: ~/sparklio_ai_marketing_studio/backend
Python: 3.11.14 (Homebrew)
가상환경: .venv
```

**설치된 패키지**:
- `fastapi` 0.115.0
- `uvicorn` 0.32.0
- `sqlalchemy` 2.0.35
- `asyncpg` 0.30.0
- `minio` 7.2.18
- `redis` 5.2.0
- `pgvector` 0.3.5
- 기타 (`pydantic`, `python-jose`, `passlib` 등)

**FastAPI 시작** (수동):
```bash
cd ~/sparklio_ai_marketing_studio/backend
source .venv/bin/activate
python app/main.py
```

**접속**: `http://100.123.51.5:8000`

---

### 2.3 Laptop Frontend Dev (100.101.68.23)

#### 시스템 정보
- **OS**: Windows 11
- **역할**: 프론트엔드 개발 환경 (Next.js)
- **상태**: ⏳ K: SSD 연결 시 설정

#### 필요 소프트웨어
- Node.js 20.x LTS
- pnpm 9.x
- Git

#### 프로젝트 경로
```
K:\sparklio_ai_marketing_studio\frontend
```

#### 환경 변수 (.env.local)
```bash
NEXT_PUBLIC_API_URL=http://100.123.51.5:8000
NEXT_PUBLIC_OLLAMA_URL=http://100.120.180.42:11434
NEXT_PUBLIC_COMFYUI_URL=http://100.120.180.42:8188
```

**개발 서버 시작**:
```powershell
cd K:\sparklio_ai_marketing_studio\frontend
pnpm dev
```

**접속**: `http://localhost:3000` 또는 `http://100.101.68.23:3000`

---

## 3. 완료된 작업

### 3.1 A팀 (인프라/환경 설정) ✅ 100% 완료

#### Desktop
- [x] Ollama 설치 및 LLM 모델 4개 다운로드
- [x] ComfyUI 설치 및 커스텀 노드 3개 추가
- [x] FFmpeg 설치 및 PATH 등록
- [x] Faster-Whisper 설치 (GPU 가속)
- [x] Tailscale 연결 확인

#### Mac mini
- [x] Docker 환경 구성 (3개 서비스)
- [x] PostgreSQL 데이터베이스 스키마 생성
- [x] pgvector 확장 활성화
- [x] MinIO 버킷 3개 생성
- [x] Backend Python 환경 (.venv) 설정
- [x] 초기화 스크립트 작성 (재현 가능)

#### 문서화
- [x] 자산 저장소 설계 사양서 (ASSET_STORAGE_SPEC.md)
- [x] Backend 구현 가이드 (BACKEND_IMPLEMENTATION_GUIDE.md)
- [x] A팀 완료 보고서 (A_TEAM_COMPLETION_REPORT.md)
- [x] 질문/이슈 추적 (BACKEND_QUESTIONS.md)
- [x] 최종 환경 설정 상태 (본 문서)

### 3.2 디렉토리 구조

```
K:\sparklio_ai_marketing_studio\
├── backend/                              # B팀 작업 공간
│   ├── app/
│   │   └── main.py                       # FastAPI 엔트리포인트
│   ├── scripts/
│   │   ├── init_minio_buckets.py         # MinIO 초기화
│   │   └── init_database.sql             # PostgreSQL 초기화
│   ├── requirements.txt
│   └── .env
├── frontend/                             # C팀 작업 공간 (예정)
├── docs/
│   ├── ASSET_STORAGE_SPEC.md             # 설계 사양서
│   ├── FINAL_ENVIRONMENT_STATUS.md       # 본 문서
│   └── handoff/
│       ├── BACKEND_IMPLEMENTATION_GUIDE.md
│       ├── A_TEAM_COMPLETION_REPORT.md
│       └── BACKEND_QUESTIONS.md
└── setup/
    ├── TAILSCALE_NETWORK.md
    ├── test_integration.ps1
    └── laptop/
        └── SETUP_GUIDE.md
```

---

## 4. 남은 작업

### 4.1 Desktop (선택적)

#### ComfyUI 시작
```powershell
cd D:\AI\ComfyUI\ComfyUI
.\python_embeded\python.exe main.py
```

**필요 시점**: 이미지/비디오 생성 작업 시

#### Ollama 확인
```powershell
docker ps | grep ollama
```

**상태**: Docker Desktop 실행 시 자동 시작

---

### 4.2 Mac mini (선택적)

#### FastAPI 자동 시작 (launchd)

현재는 수동 시작이지만, 원하면 자동 시작 설정 가능:

**1. launchd plist 파일 생성**
```bash
~/Library/LaunchAgents/com.sparklio.backend.plist
```

**2. 자동 시작 활성화**
```bash
launchctl load ~/Library/LaunchAgents/com.sparklio.backend.plist
```

**우선순위**: Low (수동 시작으로도 충분)

---

### 4.3 Laptop (K: SSD 연결 시)

- [ ] K: SSD를 Laptop에 연결
- [ ] Node.js 20.x LTS 설치
- [ ] pnpm 설치
- [ ] Git 설정
- [ ] Frontend 프로젝트 초기화 (C팀 작업)

---

## 5. B/C팀 시작 가이드

### 5.1 B팀 (Backend 개발)

#### 작업 환경
- **작업 PC**: Desktop 또는 Mac mini SSH 접속
- **경로**: `~/sparklio_ai_marketing_studio/backend` (Mac mini)
- **포트**: 8000 (FastAPI)

#### 시작 전 확인사항

1. **Mac mini Docker 서비스 확인**
```bash
ssh woosun@100.123.51.5
docker ps
```

예상 출력:
```
sparklio-postgres   Running
sparklio-redis      Running
sparklio-minio      Running
```

2. **데이터베이스 접속 테스트**
```bash
docker exec sparklio-postgres psql -U sparklio -d sparklio -c "\dt"
```

예상 출력: 5개 테이블 목록

3. **MinIO 접속 테스트**
```bash
curl http://100.123.51.5:9000/minio/health/live
```

예상 출력: `<MinIOHealthCheckResult>OK</MinIOHealthCheckResult>`

#### 제공된 문서

1. **설계 사양서**: [ASSET_STORAGE_SPEC.md](../ASSET_STORAGE_SPEC.md)
   - 전체 시스템 아키텍처
   - 데이터베이스 스키마
   - MinIO 경로 구조

2. **구현 가이드**: [handoff/BACKEND_IMPLEMENTATION_GUIDE.md](handoff/BACKEND_IMPLEMENTATION_GUIDE.md)
   - API 엔드포인트 스펙
   - 샘플 코드 (MinIO 업로드, Presigned URL, pgvector 검색)
   - 환경 변수 설정

3. **질문 추적**: [handoff/BACKEND_QUESTIONS.md](handoff/BACKEND_QUESTIONS.md)
   - 질문 양식
   - A팀과 소통 채널

#### 다음 작업

- [ ] FastAPI 프로젝트 구조 설계
- [ ] SQLAlchemy 모델 작성
- [ ] 파일 업로드 API 구현
- [ ] Presigned URL 생성
- [ ] 자산 조회/목록 API

---

### 5.2 C팀 (Frontend 개발)

#### 작업 환경
- **작업 PC**: Laptop (K: SSD 연결 후)
- **경로**: `K:\sparklio_ai_marketing_studio\frontend`
- **포트**: 3000 (Next.js)

#### 시작 전 확인사항

1. **K: SSD 연결 확인**
2. **Node.js 설치 확인**
```powershell
node --version  # v20.19.5 이상
pnpm --version  # 9.x
```

3. **Backend API 연결 테스트**
```powershell
curl http://100.123.51.5:8000/health
```

#### 환경 변수
```bash
# frontend/.env.local
NEXT_PUBLIC_API_URL=http://100.123.51.5:8000
NEXT_PUBLIC_OLLAMA_URL=http://100.120.180.42:11434
NEXT_PUBLIC_COMFYUI_URL=http://100.120.180.42:8188
```

#### 다음 작업

- [ ] Next.js 프로젝트 초기화
- [ ] Tailwind CSS 설정
- [ ] API 연동 (Backend)
- [ ] 자산 갤러리 UI
- [ ] 파일 업로드 UI

---

## 부록 A: 빠른 참조

### A.1 Tailscale IP 주소

| 노드 | IP | 호스트명 |
|------|----|----|
| Desktop | 100.120.180.42 | sweetlife |
| Mac mini | 100.123.51.5 | woosuns-mac-mini |
| Laptop | 100.101.68.23 | desktop-ecmkau8 |

### A.2 주요 포트

| 서비스 | 노드 | 포트 | 프로토콜 |
|--------|------|------|----------|
| Ollama | Desktop | 11434 | HTTP |
| ComfyUI | Desktop | 8188 | HTTP/WebSocket |
| PostgreSQL | Mac mini | 5432 | TCP |
| Redis | Mac mini | 6379 | TCP |
| MinIO API | Mac mini | 9000 | HTTP |
| MinIO Console | Mac mini | 9001 | HTTP |
| FastAPI | Mac mini | 8000 | HTTP |
| Next.js | Laptop | 3000 | HTTP |

### A.3 주요 명령어

#### Desktop
```powershell
# ComfyUI 시작
cd D:\AI\ComfyUI\ComfyUI
.\python_embeded\python.exe main.py

# Ollama 모델 목록
docker exec ollama ollama list

# Ollama 테스트
curl http://localhost:11434/api/tags
```

#### Mac mini
```bash
# Docker 상태 확인
docker ps

# PostgreSQL 접속
docker exec -it sparklio-postgres psql -U sparklio -d sparklio

# MinIO 버킷 목록 (Python)
python scripts/init_minio_buckets.py

# FastAPI 시작
cd ~/sparklio_ai_marketing_studio/backend
source .venv/bin/activate
python app/main.py
```

#### Laptop
```powershell
# Frontend 개발 서버
cd K:\sparklio_ai_marketing_studio\frontend
pnpm dev

# Backend API 테스트
curl http://100.123.51.5:8000/health
```

---

## 부록 B: 트러블슈팅

### B.1 Tailscale 연결 실패

**증상**: `ping 100.123.51.5` 실패

**해결**:
```powershell
# Windows
tailscale up

# macOS
sudo tailscale up
```

### B.2 Docker 서비스 중지

**증상**: PostgreSQL/Redis/MinIO 연결 실패

**해결**:
```bash
cd ~/sparklio_ai_marketing_studio/docker/mac-mini
docker compose up -d
```

### B.3 포트 충돌

**증상**: `Address already in use`

**해결**:
```bash
# 포트 사용 프로세스 확인
lsof -i :8000  # macOS
netstat -ano | findstr :8000  # Windows

# 프로세스 종료
kill -9 <PID>  # macOS
taskkill /PID <PID> /F  # Windows
```

### B.4 가상환경 활성화 실패

**증상**: `python: command not found`

**해결**:
```bash
# Python 경로 확인
which python3.11

# 가상환경 재생성
cd ~/sparklio_ai_marketing_studio/backend
python3.11 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

---

**작성**: A팀 리더
**검토**: -
**승인**: -
**배포일**: 2025-11-15
