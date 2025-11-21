# 🏗️ Sparklio AI Marketing Studio - 인프라 구성 가이드

**최종 업데이트**: 2025-11-21
**관리 팀**: A팀 (Infrastructure)

---

## 📌 시스템 아키텍처 개요

Sparklio는 분산 아키텍처로 구성되어 있으며, 각 머신이 특화된 역할을 수행합니다.

### 🖥️ 머신별 역할

| 머신 | 역할 | IP 주소 | 주요 서비스 |
|------|------|---------|------------|
| **맥미니** | Control Tower | `100.123.51.5` | Backend API, DB, Redis, MinIO |
| **데스크탑** | GPU Worker | `100.120.180.42` | Ollama, ComfyUI, LLM Services |
| **노트북** | Development | Dynamic | Frontend Dev, IDE |

### 🔗 네트워크 구성
- **Tailscale VPN**: 모든 머신 간 안전한 통신
- **Docker Network**: 컨테이너 간 내부 통신 (`sparklio-network`)

---

## 🚀 Quick Start

### 전체 시스템 구동 (맥미니에서)
```bash
cd ~/sparklio_ai_marketing_studio/docker/mac-mini
docker compose up -d
```

### 개발 환경 실행 (노트북에서)
```bash
cd K:\sparklio_ai_marketing_studio\frontend
npm run dev
```

### GPU 서비스 실행 (데스크탑에서)
```bash
# ComfyUI (로컬 실행)
cd D:\AI\ComfyUI
.\run_nvidia_gpu.bat

# Ollama (Docker)
docker run -d --gpus all -p 11434:11434 ollama/ollama
```

---

## 📦 서비스별 상세 정보

### 1️⃣ 맥미니 (Control Tower)

#### 실행 중인 서비스
| 서비스 | 컨테이너명 | 포트 | 용도 |
|--------|-----------|------|------|
| FastAPI Backend | `sparklio-backend` | 8000, 8001 | API 서버 |
| PostgreSQL | `sparklio-postgres` | 5432 | 데이터베이스 |
| Redis | `sparklio-redis` | 6379 | 캐시 & 큐 |
| MinIO | `sparklio-minio` | 9000, 9001 | 오브젝트 스토리지 |

#### 접속 URL
- Backend API: `http://100.123.51.5:8000`
- Admin API: `http://100.123.51.5:8001`
- MinIO Console: `http://100.123.51.5:9001`

### 2️⃣ 데스크탑 (GPU Worker)

#### 실행 중인 서비스
| 서비스 | 실행 방식 | 포트 | 용도 |
|--------|----------|------|------|
| Ollama | Docker | 11434 | LLM 추론 (Llama, Qwen) |
| ComfyUI | **로컬 앱** | 8188 | 이미지/비디오 생성 |

⚠️ **중요**: ComfyUI는 항상 로컬 앱으로 실행 (Docker 사용 안 함)

#### 접속 URL
- Ollama API: `http://100.120.180.42:11434`
- ComfyUI API: `http://100.120.180.42:8188`

### 3️⃣ 노트북 (Development)

#### 개발 도구
- **Frontend**: Next.js Dev Server (포트 3000)
- **IDE**: VSCode
- **API 타겟**: 맥미니 (`100.123.51.5:8000`)

---

## 🔧 환경 설정

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_BASE_URL=http://100.123.51.5:8000
NEXT_PUBLIC_ADMIN_API_BASE_URL=http://100.123.51.5:8001
NEXT_PUBLIC_EDITOR_MODE=polotno
```

### Backend (.env.mini)
```env
# Database
DATABASE_URL=postgresql+psycopg2://sparklio:password@postgres:5432/sparklio

# GPU Worker
OLLAMA_BASE_URL=http://100.120.180.42:11434
COMFYUI_BASE_URL=http://100.120.180.42:8188

# LLM Keys (절대 커밋 금지!)
OPENAI_API_KEY=your_key_here
GOOGLE_API_KEY=your_key_here
ANTHROPIC_API_KEY=your_key_here
```

---

## 🔍 헬스체크 & 모니터링

### 시스템 상태 확인
```bash
# 백엔드 헬스체크
curl http://100.123.51.5:8000/health

# Admin 통계
curl http://100.123.51.5:8001/api/v1/admin/stats

# LLM 서비스 상태
curl http://100.123.51.5:8000/api/v1/llm/health

# GPU Worker 상태
curl http://100.120.180.42:11434/api/tags  # Ollama
curl http://100.120.180.42:8188/system_stats  # ComfyUI
```

### Docker 컨테이너 상태 (맥미니)
```bash
docker compose ps
docker compose logs --tail=50 backend
```

---

## 🚨 트러블슈팅 가이드

### 문제: 백엔드 API 접속 불가

#### 체크리스트
1. **맥미니 전원 상태**
   ```bash
   ping 100.123.51.5
   ```

2. **Docker 서비스 상태**
   ```bash
   ssh user@100.123.51.5
   docker compose ps
   ```

3. **포트 확인**
   ```bash
   telnet 100.123.51.5 8000
   ```

### 문제: ComfyUI 연결 실패

#### 해결 방법
1. **데스크탑에서 ComfyUI 실행 확인**
   ```bash
   # PowerShell (데스크탑)
   cd D:\AI\ComfyUI
   .\run_nvidia_gpu.bat
   ```

2. **방화벽 규칙 확인**
   - Windows Defender 방화벽에서 8188 포트 허용

### 문제: Database 연결 에러

#### 해결 방법
```bash
# 맥미니에서
docker compose exec postgres psql -U sparklio -c "SELECT 1;"
docker compose restart postgres backend
```

---

## 🔐 보안 가이드라인

### DO's ✅
- API 키는 항상 `.env` 파일에 저장
- 강력한 비밀번호 사용
- Tailscale VPN 항상 연결
- 정기적인 백업 수행

### DON'Ts ❌
- **절대 API 키를 Git에 커밋하지 않기**
- 공용 네트워크에서 서비스 노출 금지
- 기본 비밀번호 사용 금지
- `.env` 파일 공유 금지

---

## 📊 리소스 사용량 가이드

### 맥미니 (권장 사양)
- CPU: 4 cores 이상
- RAM: 16GB 이상
- Storage: 100GB 이상 여유 공간

### 데스크탑 (GPU Worker)
- GPU: RTX 4070 이상
- VRAM: 12GB 이상
- RAM: 32GB 이상

---

## 🔄 백업 & 복구

### 데이터 백업
```bash
# PostgreSQL 백업
docker compose exec postgres pg_dump -U sparklio sparklio > backup.sql

# MinIO 백업
docker compose exec minio mc mirror sparklio/ /backup/
```

### 복구
```bash
# PostgreSQL 복구
docker compose exec -T postgres psql -U sparklio sparklio < backup.sql

# 전체 스택 재구성
docker compose down
docker compose up -d --build
```

---

## 📚 관련 문서

- [맥미니 백엔드 설정](./A_TEAM_MACMINI_BACKEND_SETUP.md)
- [에디터 마이그레이션 계획](./SPARKLIO_EDITOR_PLAN_v1.1.md)
- [LLM Provider 사양](../backend/LLM_PROVIDER_SPEC.md)

---

## 🆘 지원 & 연락처

### Slack 채널
- `#a-team-infra` - 인프라 관련
- `#b-team-backend` - 백엔드 관련
- `#c-team-frontend` - 프론트엔드 관련

### 긴급 연락
- A팀 온콜: `@a-team-oncall`
- 시스템 장애: `#incident-response`

---

## 📝 변경 이력

| 날짜 | 변경 내용 | 담당자 |
|------|----------|--------|
| 2025-11-21 | 초기 문서 작성 | A팀 |
| 2025-11-21 | Docker Compose 백엔드 추가 | A팀 |
| 2025-11-20 | 에디터 마이그레이션 반영 | A팀 |

---

**© 2025 Sparklio AI Marketing Studio - Infrastructure Team**