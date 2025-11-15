# Laptop 개발 환경 설정 가이드

Sparklio AI Marketing Studio - Laptop (Frontend 개발 환경)

## 시스템 요구사항

- OS: Windows 10/11
- Node.js: 20.x LTS
- pnpm: 9.x
- Python: 3.11.8+
- Git
- Tailscale (3-Node VPN 연결)

## Tailscale IP 주소

설정 시 필요한 Tailscale IP 주소:
- **Desktop** (GPU Worker): `100.x.x.x` (확인 필요)
- **Mac mini** (Backend Server): `100.123.51.5`
- **Laptop** (Frontend Dev): `100.x.x.x` (확인 필요)

## 1. Tailscale 설정

### 1-1. Tailscale 설치 확인
```powershell
tailscale status
```

만약 설치되지 않았다면:
1. https://tailscale.com/download/windows 에서 다운로드
2. 설치 후 계정 로그인
3. `tailscale status`로 연결 확인

### 1-2. 3-Node 연결 확인
```powershell
# Desktop GPU Worker 연결 테스트
ping [Desktop_Tailscale_IP]

# Mac mini Backend 연결 테스트
ping 100.123.51.5

# Mac mini API 연결 테스트
curl http://100.123.51.5:8000/health
```

## 2. Node.js 환경 설정

### 2-1. Node.js 버전 확인
```powershell
node --version  # v20.19.5 또는 상위 버전
npm --version
```

### 2-2. pnpm 설치
```powershell
npm install -g pnpm
pnpm --version  # 9.x 확인
```

## 3. Python 환경 설정 (선택사항)

백엔드 개발/테스트 시 필요:

```powershell
python --version  # Python 3.11.8 또는 상위 버전 확인
```

## 4. 프로젝트 설정

### 4-1. 프로젝트 디렉토리
```powershell
cd K:\sparklio_ai_marketing_studio
```

### 4-2. Frontend 설정 (Next.js)
```powershell
cd frontend
pnpm install
```

### 4-3. 환경변수 설정
```powershell
# .env.local 파일 생성
cp .env.example .env.local

# .env.local 편집
notepad .env.local
```

`.env.local` 내용:
```env
# Mac mini Backend API (Tailscale)
NEXT_PUBLIC_API_URL=http://100.123.51.5:8000
NEXT_PUBLIC_API_VERSION=v1

# Desktop GPU Worker Services (Tailscale)
NEXT_PUBLIC_OLLAMA_URL=http://[Desktop_IP]:11434
NEXT_PUBLIC_COMFYUI_URL=http://[Desktop_IP]:8188

# Development
NODE_ENV=development
NEXT_PUBLIC_DEBUG=true
```

### 4-4. 개발 서버 실행
```powershell
pnpm dev
```

Frontend 접속: http://localhost:3000

## 5. Git 설정 (선택사항)

```powershell
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# 프로젝트 초기화 (아직 안했다면)
cd K:\sparklio_ai_marketing_studio
git init
```

## 6. IDE 설정 (VSCode 권장)

### 6-1. VSCode Extensions
- ESLint
- Prettier
- Tailwind CSS IntelliSense
- Python (백엔드 작업 시)
- GitLens

### 6-2. VSCode 설정
프로젝트 루트에 `.vscode/settings.json` 생성:
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "[python]": {
    "editor.defaultFormatter": "ms-python.black-formatter"
  }
}
```

## 7. 연결 테스트

### 7-1. Backend API 테스트
```powershell
# Health check
curl http://100.123.51.5:8000/health

# API docs
start http://100.123.51.5:8000/docs
```

### 7-2. Desktop GPU Worker 테스트
```powershell
# Ollama 연결 테스트
curl http://[Desktop_IP]:11434/api/tags

# ComfyUI 연결 테스트
start http://[Desktop_IP]:8188
```

## 8. 개발 워크플로우

### 8-1. 일반적인 작업 흐름
1. K: SSD를 Laptop에 연결
2. Tailscale 연결 확인
3. Frontend 개발 서버 실행 (`pnpm dev`)
4. 브라우저에서 http://localhost:3000 접속
5. 코드 수정 및 Hot Reload 확인
6. Mac mini Backend API와 통신 테스트
7. Desktop GPU Worker 서비스 호출 테스트

### 8-2. 전체 시스템 구조
```
┌─────────────────┐
│  Laptop (You)   │  Frontend Dev (Next.js)
│  localhost:3000 │  Port 3000
└────────┬────────┘
         │ Tailscale VPN
         ├─────────────────────────┐
         │                         │
┌────────▼──────────┐    ┌────────▼──────────┐
│   Mac mini M2     │    │  Desktop RTX 4070 │
│   100.123.51.5    │    │  100.x.x.x        │
│                   │    │                   │
│ FastAPI :8000     │    │ Ollama :11434     │
│ PostgreSQL :5432  │    │ ComfyUI :8188     │
│ Redis :6379       │    │                   │
│ MinIO :9000       │    │                   │
└───────────────────┘    └───────────────────┘
```

## 트러블슈팅

### Q1: Tailscale 연결이 안 됨
```powershell
tailscale status
tailscale up
```

### Q2: pnpm 명령어가 인식 안 됨
```powershell
# PowerShell 재시작 후
npm install -g pnpm
```

### Q3: Backend API 연결 실패
- Mac mini가 켜져 있는지 확인
- Mac mini에서 Docker 컨테이너 실행 중인지 확인:
  ```bash
  ssh woosun@100.123.51.5 "docker ps"
  ```

### Q4: Frontend Hot Reload 안 됨
```powershell
# 개발 서버 재시작
pnpm dev
```

## 다음 단계

1. ✅ Tailscale 3-Node 연결 확인
2. ✅ Frontend 개발 서버 실행
3. ✅ Backend API 연결 테스트
4. ✅ Desktop GPU Worker 연결 테스트
5. ⬜ 첫 번째 컴포넌트 개발
6. ⬜ API 통합 테스트

---

**참고:** 이 가이드는 K: SSD를 Laptop에 연결했을 때 실행하세요.
