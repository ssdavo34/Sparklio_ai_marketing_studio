# 멀티 팀 개발 워크플로우 가이드

**프로젝트**: Sparklio AI Marketing Studio
**대상**: A팀 (인프라), B팀 (백엔드), C팀 (프론트엔드)
**환경**: 3-Node 하이브리드 시스템 (동시 개발 지원)

---

## 목차

1. [팀 역할 및 작업 범위](#1-팀-역할-및-작업-범위)
2. [작업 디렉토리 구조](#2-작업-디렉토리-구조)
3. [Git 브랜치 전략](#3-git-브랜치-전략)
4. [포트 할당 및 충돌 방지](#4-포트-할당-및-충돌-방지)
5. [환경 변수 관리](#5-환경-변수-관리)
6. [팀 간 협업 프로토콜](#6-팀-간-협업-프로토콜)
7. [테스트 워크플로우](#7-테스트-워크플로우)
8. [배포 프로세스](#8-배포-프로세스)
9. [문제 해결 가이드](#9-문제-해결-가이드)

---

## 1. 팀 역할 및 작업 범위

### A팀: 인프라 및 환경 설정

**책임 범위**:
- Docker Compose 구성 관리 (PostgreSQL, Redis, MinIO)
- 데이터베이스 스키마 관리
- Object Storage 버킷 관리
- AI 워커 설정 (Ollama, ComfyUI)
- 시스템 모니터링 및 성능 최적화

**작업 위치**:
- **Desktop (100.120.180.42)**: AI 워커 관리
- **Mac mini (100.123.51.5)**: 백엔드 인프라 관리

**주요 파일**:
```
backend/
├── docker-compose.yml          # 인프라 서비스 정의
├── scripts/
│   ├── init_database.sql       # PostgreSQL 스키마
│   └── init_minio_buckets.py   # MinIO 버킷 초기화
└── .env                        # 인프라 환경 변수
```

**시작 명령어** (Mac mini):
```bash
cd ~/sparklio_ai_marketing_studio/backend
docker compose up -d
```

---

### B팀: Backend API 개발

**책임 범위**:
- FastAPI 애플리케이션 개발
- RESTful API 엔드포인트 구현
- 비즈니스 로직 및 데이터 모델
- MinIO 연동 (Presigned URL, 파일 업로드/다운로드)
- pgvector 유사도 검색 구현

**작업 위치**:
- **Mac mini (100.123.51.5)**: FastAPI 서버 개발 및 실행

**주요 파일**:
```
backend/
├── app/
│   ├── main.py                 # FastAPI 애플리케이션 엔트리포인트
│   ├── models/                 # SQLAlchemy 모델
│   ├── routers/                # API 라우터 (assets, projects, brands)
│   ├── services/               # 비즈니스 로직 (storage, database)
│   ├── schemas/                # Pydantic 스키마
│   └── config.py               # 설정 관리
├── tests/                      # 테스트 코드
└── requirements.txt            # Python 의존성
```

**시작 명령어** (Mac mini):
```bash
cd ~/sparklio_ai_marketing_studio/backend
source .venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**API 접근**:
- 개발 서버: `http://100.123.51.5:8000`
- API 문서: `http://100.123.51.5:8000/docs`

---

### C팀: Frontend 개발

**책임 범위**:
- Next.js 애플리케이션 개발
- UI/UX 컴포넌트 구현
- Backend API 연동
- 사용자 인증 및 상태 관리
- 자산 업로드/다운로드 인터페이스

**작업 위치**:
- **Laptop (100.101.68.23)**: Next.js 개발 서버

**주요 파일**:
```
frontend/
├── app/                        # Next.js 13+ App Router
│   ├── layout.tsx              # 루트 레이아웃
│   ├── page.tsx                # 홈페이지
│   ├── dashboard/              # 대시보드 페이지
│   └── api/                    # API 라우트 (프록시)
├── components/                 # React 컴포넌트
├── lib/                        # 유틸리티 및 API 클라이언트
├── public/                     # 정적 자산
└── .env.local                  # 프론트엔드 환경 변수
```

**시작 명령어** (Laptop):
```bash
cd ~/sparklio_ai_marketing_studio/frontend
npm run dev
```

**앱 접근**:
- 개발 서버: `http://localhost:3000`
- 또는 Tailscale: `http://100.101.68.23:3000`

---

## 2. 작업 디렉토리 구조

### 전체 프로젝트 구조

```
sparklio_ai_marketing_studio/
├── backend/                    # Backend (A팀 + B팀)
│   ├── app/                    # FastAPI 애플리케이션 (B팀)
│   ├── scripts/                # 초기화 스크립트 (A팀)
│   ├── tests/                  # 테스트 (B팀)
│   ├── docker-compose.yml      # 인프라 (A팀)
│   ├── .env                    # 환경 변수 (A팀 + B팀)
│   └── requirements.txt        # Python 의존성 (B팀)
│
├── frontend/                   # Frontend (C팀)
│   ├── app/                    # Next.js 페이지
│   ├── components/             # React 컴포넌트
│   ├── lib/                    # 유틸리티
│   ├── .env.local              # 환경 변수
│   └── package.json            # NPM 의존성
│
├── docs/                       # 문서 (공통)
│   ├── ASSET_STORAGE_SPEC.md
│   ├── FINAL_ENVIRONMENT_STATUS.md
│   ├── DEV_WORKFLOW.md         # 본 문서
│   ├── PORT_ALLOCATION.md
│   └── handoff/
│       ├── A_TEAM_COMPLETION_REPORT.md
│       ├── BACKEND_IMPLEMENTATION_GUIDE.md
│       └── BACKEND_QUESTIONS.md
│
└── README.md                   # 프로젝트 개요
```

---

## 3. Git 브랜치 전략

### 브랜치 구조

```
main                    # 프로덕션 브랜치 (병합만 허용)
└── dev                 # 개발 통합 브랜치
    ├── feature/a-*     # A팀 기능 브랜치
    ├── feature/b-*     # B팀 기능 브랜치
    └── feature/c-*     # C팀 기능 브랜치
```

### 브랜치 네이밍 규칙

**A팀 (인프라)**:
```bash
feature/a-docker-compose-update
feature/a-minio-bucket-policy
feature/a-database-migration-v2
```

**B팀 (백엔드)**:
```bash
feature/b-asset-upload-api
feature/b-presigned-url-service
feature/b-vector-similarity-search
```

**C팀 (프론트엔드)**:
```bash
feature/c-asset-upload-ui
feature/c-dashboard-layout
feature/c-authentication-flow
```

### 작업 흐름

#### 1. 새로운 기능 작업 시작

```bash
# dev 브랜치에서 최신 코드 가져오기
git checkout dev
git pull origin dev

# 기능 브랜치 생성
git checkout -b feature/{team}-{feature-name}

# 예시:
# A팀: git checkout -b feature/a-redis-cache
# B팀: git checkout -b feature/b-asset-list-api
# C팀: git checkout -b feature/c-upload-modal
```

#### 2. 작업 중 커밋

```bash
# 변경 사항 확인
git status

# 파일 스테이징
git add {파일명}

# 커밋 (커밋 메시지 규칙 참고)
git commit -m "[B팀] Add asset upload API endpoint"
```

**커밋 메시지 규칙**:
```
[팀명] {동작} {대상}

예시:
[A팀] Add MinIO lifecycle policy for temp bucket
[B팀] Implement presigned URL generation service
[C팀] Update dashboard layout with sidebar
```

#### 3. 브랜치 푸시 및 Pull Request

```bash
# 원격 저장소에 푸시
git push origin feature/{team}-{feature-name}
```

**Pull Request 작성 규칙**:

제목:
```
[{팀명}] {기능 요약}

예시:
[B팀] Asset Upload API Implementation
[C팀] Dashboard UI Redesign
```

본문 (템플릿):
```markdown
## 변경 사항
- [ ] 자산 업로드 엔드포인트 추가 (`POST /api/assets`)
- [ ] MinIO 파일 업로드 로직 구현
- [ ] 파일 크기 및 타입 검증

## 테스트
- [ ] 단위 테스트 통과 (pytest)
- [ ] API 문서 자동 생성 확인
- [ ] 통합 테스트 (MinIO 연동)

## 관련 이슈
- Closes #12

## 리뷰어
@a-team-leader @b-team-member

## 체크리스트
- [ ] 환경 변수는 `.env`에 정의됨
- [ ] 하드코딩된 설정 없음
- [ ] 에러 핸들링 구현
- [ ] 로깅 추가
```

#### 4. 코드 리뷰 및 병합

**리뷰어 규칙**:
- A팀 PR: 최소 1명의 A팀 멤버 승인 필요
- B팀 PR: 최소 1명의 B팀 멤버 + (옵션) A팀 인프라 리뷰
- C팀 PR: 최소 1명의 C팀 멤버 + (옵션) B팀 API 리뷰

**병합 순서**:
```
feature/{team}-{name} → dev (리뷰 후 Squash & Merge)
dev → main (주기적 릴리스, Merge Commit)
```

#### 5. 브랜치 정리

```bash
# 병합 후 로컬 브랜치 삭제
git branch -d feature/{team}-{feature-name}

# 원격 브랜치는 자동 삭제 (GitHub 설정)
```

---

## 4. 포트 할당 및 충돌 방지

### 포트 할당 표

**자세한 내용**: [PORT_ALLOCATION.md](./PORT_ALLOCATION.md) 참고

| 서비스 | 포트 | 노드 | 팀 | 비고 |
|--------|------|------|-----|------|
| **공통 인프라** | | | | |
| PostgreSQL | 5432 | Mac mini | A팀 | 모든 팀 사용 |
| Redis | 6379 | Mac mini | A팀 | 모든 팀 사용 |
| MinIO API | 9000 | Mac mini | A팀 | Presigned URL 생성용 |
| MinIO Console | 9001 | Mac mini | A팀 | 웹 UI (개발 시 확인용) |
| **AI 워커** | | | | |
| Ollama | 11434 | Desktop | A팀 | LLM 추론 서버 |
| ComfyUI | 8188 | Desktop | A팀 | 이미지/비디오 생성 |
| **Backend** | | | | |
| FastAPI (dev) | 8000 | Mac mini | B팀 | 메인 개발 서버 |
| FastAPI (test) | 8001 | Mac mini | B팀 | (선택) 통합 테스트용 |
| **Frontend** | | | | |
| Next.js | 3000 | Laptop | C팀 | 개발 서버 |

### 포트 충돌 방지 규칙

**규칙 1: 팀별 전용 포트만 사용**
- A팀: 11434, 8188 (AI 워커)
- B팀: 8000, 8001 (Backend)
- C팀: 3000 (Frontend)

**규칙 2: 공통 인프라 포트 변경 금지**
- PostgreSQL (5432), Redis (6379), MinIO (9000, 9001)은 A팀만 변경 가능

**규칙 3: 새로운 서비스 추가 시 사전 협의**
```bash
# 잘못된 예 (포트 충돌 위험)
uvicorn app.main:app --port 3000  # C팀 Next.js와 충돌!

# 올바른 예 (할당된 포트 사용)
uvicorn app.main:app --port 8000  # B팀 전용 포트
```

### 포트 사용 확인

**Mac mini에서 포트 점유 확인**:
```bash
# 특정 포트 확인
lsof -i :8000

# 또는
netstat -an | grep 8000
```

**Desktop (Windows)에서 포트 확인**:
```powershell
# 특정 포트 확인
netstat -ano | findstr :11434
```

---

## 5. 환경 변수 관리

### 환경 변수 파일 구조

각 팀은 **별도의 환경 변수 파일**을 사용합니다:

```
backend/.env          # A팀 + B팀 공통 (Mac mini)
frontend/.env.local   # C팀 전용 (Laptop)
```

### Backend 환경 변수 (`backend/.env`)

**A팀 관리 항목** (인프라 설정):
```bash
# PostgreSQL
POSTGRES_HOST=100.123.51.5
POSTGRES_PORT=5432
POSTGRES_DB=sparklio
POSTGRES_USER=sparklio
POSTGRES_PASSWORD=sparklio_secure_2025

# Redis
REDIS_HOST=100.123.51.5
REDIS_PORT=6379

# MinIO
MINIO_ENDPOINT=100.123.51.5:9000
MINIO_ACCESS_KEY=sparklio
MINIO_SECRET_KEY=sparklio_minio_2025
MINIO_BUCKET_PREFIX=dev-

# AI Workers
OLLAMA_ENDPOINT=http://100.120.180.42:11434
COMFYUI_ENDPOINT=http://100.120.180.42:8188
```

**B팀 관리 항목** (애플리케이션 설정):
```bash
# FastAPI
APP_ENV=development
APP_HOST=0.0.0.0
APP_PORT=8000
API_SECRET_KEY=your-secret-key-here-change-in-production

# 파일 업로드 제한
MAX_FILE_SIZE_MB=100
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/webp,video/mp4,text/plain

# Presigned URL 유효기간 (초)
PRESIGNED_URL_EXPIRY=3600

# Vector Search
EMBEDDING_DIMENSION=1536
```

### Frontend 환경 변수 (`frontend/.env.local`)

**C팀 관리 항목**:
```bash
# Backend API
NEXT_PUBLIC_API_URL=http://100.123.51.5:8000

# 환경
NEXT_PUBLIC_APP_ENV=development

# 업로드 설정 (프론트 표시용)
NEXT_PUBLIC_MAX_FILE_SIZE_MB=100
```

### 환경 변수 변경 프로토콜

#### A팀이 인프라 설정 변경 시

1. `backend/.env` 파일 업데이트
2. B팀에게 알림 (Slack, GitHub Issue)
3. 문서 업데이트 (`FINAL_ENVIRONMENT_STATUS.md`)

**예시**:
```bash
# MinIO 포트 변경 (9000 → 9010)
# 1. A팀: backend/.env 수정
MINIO_ENDPOINT=100.123.51.5:9010

# 2. B팀에게 알림
# "MinIO 포트가 9000 → 9010으로 변경되었습니다. .env 파일을 pull 하세요."

# 3. B팀: 환경 변수 리로드
source .venv/bin/activate
uvicorn app.main:app --reload  # 자동 재시작
```

#### B팀이 API 엔드포인트 변경 시

1. C팀에게 변경 사항 알림
2. API 문서 업데이트 (`http://100.123.51.5:8000/docs`)

**예시**:
```bash
# API 경로 변경 (/assets → /api/v1/assets)
# 1. B팀: FastAPI 라우터 수정
# 2. C팀에게 알림 및 문서 공유
# "자산 업로드 엔드포인트가 /api/v1/assets로 변경되었습니다."

# 3. C팀: API 클라이언트 업데이트
# frontend/lib/api.ts
const API_BASE = process.env.NEXT_PUBLIC_API_URL + '/api/v1';
```

### 환경 변수 보안 규칙

**절대 금지**:
- `.env` 파일을 Git에 커밋 (`.gitignore`에 추가됨)
- 코드에 비밀번호/API 키 하드코딩
- Slack, 이메일에 비밀번호 공유

**권장 사항**:
- `.env.example` 파일로 템플릿 제공
- 비밀번호는 개인적으로 전달 (보안 채널)
- 프로덕션 환경은 별도 `.env.production` 사용

---

## 6. 팀 간 협업 프로토콜

### 의존성 관계

```
C팀 (Frontend) → B팀 (Backend API) → A팀 (인프라)
```

### 협업 시나리오

#### 시나리오 1: A팀이 데이터베이스 스키마 변경

**단계**:
1. A팀: 스키마 변경 계획 공유 (GitHub Issue)
2. B팀: 영향 받는 모델/API 확인
3. A팀: 마이그레이션 스크립트 작성 (`scripts/migrations/`)
4. B팀: SQLAlchemy 모델 업데이트
5. C팀: (필요 시) 프론트엔드 타입 업데이트

**예시**:
```sql
-- A팀: 새로운 컬럼 추가
ALTER TABLE generated_assets
ADD COLUMN visibility VARCHAR(20) DEFAULT 'private';

-- B팀: Pydantic 스키마 업데이트
class AssetSchema(BaseModel):
    visibility: str = 'private'  # 새 필드 추가
```

#### 시나리오 2: B팀이 새로운 API 엔드포인트 추가

**단계**:
1. B팀: API 스펙 문서 작성 (OpenAPI/Swagger)
2. C팀: API 스펙 리뷰 및 피드백
3. B팀: 구현 및 테스트
4. B팀: API 문서 업데이트 (자동 생성: `/docs`)
5. C팀: API 클라이언트 통합

**예시**:
```python
# B팀: 새로운 엔드포인트 추가
@router.get("/api/assets/{asset_id}/similar")
async def get_similar_assets(asset_id: str):
    """유사한 자산 검색 (pgvector 유사도)"""
    # 구현...
```

```typescript
// C팀: API 클라이언트 추가
export async function getSimilarAssets(assetId: string) {
  const response = await fetch(`${API_BASE}/assets/${assetId}/similar`);
  return response.json();
}
```

#### 시나리오 3: C팀이 새로운 UI 기능 요청

**단계**:
1. C팀: GitHub Issue로 기능 요청 (목업 첨부)
2. B팀: Backend API 필요 여부 확인
3. (필요 시) B팀: API 개발 우선
4. C팀: UI 구현 및 통합

**예시**:
```markdown
# GitHub Issue: [C팀] 자산 일괄 삭제 기능 추가

## 요구사항
- 대시보드에서 여러 자산 선택 후 삭제
- 삭제 전 확인 모달 표시

## Backend 요청사항
- [ ] DELETE /api/assets/batch 엔드포인트 추가 (B팀)
- 요청 형식: `{"asset_ids": ["uuid1", "uuid2"]}`
```

### 커뮤니케이션 채널

**GitHub Issues**: 기능 요청, 버그 리포트, 문서 질문
- 라벨: `team:a`, `team:b`, `team:c`, `priority:high`, `type:bug`, `type:feature`

**GitHub Discussions**: 설계 논의, 아키텍처 결정

**Pull Request 리뷰**: 코드 품질, 스타일 가이드 준수

**질문 추적 문서**: `docs/handoff/BACKEND_QUESTIONS.md` (B팀 → A팀)

---

## 7. 테스트 워크플로우

### A팀: 인프라 테스트

**테스트 항목**:
- Docker 컨테이너 헬스 체크
- PostgreSQL 연결 테스트
- MinIO 버킷 접근 테스트
- Redis 연결 테스트

**테스트 스크립트** (Mac mini):
```bash
#!/bin/bash
# backend/scripts/test_infrastructure.sh

# PostgreSQL 테스트
docker exec sparklio-postgres psql -U sparklio -d sparklio -c "SELECT 1"

# Redis 테스트
docker exec sparklio-redis redis-cli ping

# MinIO 테스트
python3 << EOF
from minio import Minio
client = Minio("100.123.51.5:9000", access_key="sparklio", secret_key="sparklio_minio_2025", secure=False)
print("Buckets:", [b.name for b in client.list_buckets()])
EOF
```

### B팀: Backend API 테스트

**테스트 레벨**:
1. **단위 테스트** (pytest): 개별 함수/클래스
2. **통합 테스트** (pytest + testcontainers): DB/MinIO 연동
3. **API 테스트** (pytest + httpx): 엔드포인트

**테스트 실행** (Mac mini):
```bash
cd ~/sparklio_ai_marketing_studio/backend
source .venv/bin/activate

# 단위 테스트
pytest tests/unit/

# 통합 테스트
pytest tests/integration/

# 전체 테스트 (커버리지 포함)
pytest --cov=app tests/
```

**테스트 작성 예시**:
```python
# tests/integration/test_asset_upload.py
import pytest
from fastapi.testclient import TestClient
from app.main import app

@pytest.fixture
def client():
    return TestClient(app)

def test_upload_asset(client):
    """자산 업로드 통합 테스트"""
    files = {"file": ("test.png", b"fake image data", "image/png")}
    data = {"brand_id": "test-brand-id", "project_id": "test-project-id"}

    response = client.post("/api/assets", files=files, data=data)

    assert response.status_code == 201
    assert "asset_id" in response.json()
```

### C팀: Frontend 테스트

**테스트 레벨**:
1. **컴포넌트 테스트** (Jest + React Testing Library)
2. **E2E 테스트** (Playwright/Cypress)

**테스트 실행** (Laptop):
```bash
cd ~/sparklio_ai_marketing_studio/frontend

# 컴포넌트 테스트
npm test

# E2E 테스트
npm run test:e2e
```

### 팀 간 통합 테스트

**시나리오 테스트**: Frontend → Backend → MinIO

**테스트 절차**:
1. C팀: E2E 테스트에서 실제 Backend API 호출
2. B팀: 테스트 환경 (포트 8001) 제공
3. A팀: 테스트 전용 MinIO 버킷 (`test-sparklio-assets`) 제공

**예시** (Playwright):
```typescript
// frontend/tests/e2e/asset-upload.spec.ts
import { test, expect } from '@playwright/test';

test('자산 업로드 플로우', async ({ page }) => {
  await page.goto('http://localhost:3000/dashboard');

  // 파일 업로드
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles('./tests/fixtures/test-image.png');

  // 업로드 버튼 클릭
  await page.click('button:has-text("업로드")');

  // 성공 메시지 확인
  await expect(page.locator('.toast-success')).toBeVisible();
});
```

---

## 8. 배포 프로세스

### 환경별 배포 전략

| 환경 | 브랜치 | 트리거 | 대상 |
|------|--------|--------|------|
| **Development** | `dev` | Push | Mac mini (자동) |
| **Staging** | `stage` | PR 승인 | Mac mini (수동) |
| **Production** | `main` | 릴리스 태그 | (미정) |

### 개발 환경 배포 (자동)

**Backend (B팀)**:
```bash
# dev 브랜치에 병합되면 자동 재시작 (--reload 모드)
cd ~/sparklio_ai_marketing_studio/backend
git pull origin dev
source .venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**Frontend (C팀)**:
```bash
# dev 브랜치에 병합되면 자동 재빌드
cd ~/sparklio_ai_marketing_studio/frontend
git pull origin dev
npm install  # 의존성 업데이트
npm run dev
```

### 스테이징 환경 배포 (수동)

**체크리스트**:
- [ ] 모든 테스트 통과
- [ ] 데이터베이스 마이그레이션 확인
- [ ] 환경 변수 업데이트 (`.env.staging`)
- [ ] 백업 생성

**배포 명령**:
```bash
# Mac mini
cd ~/sparklio_ai_marketing_studio/backend
git checkout stage
git pull origin stage

# 데이터베이스 마이그레이션
docker exec sparklio-postgres psql -U sparklio -d sparklio < scripts/migrations/v2.sql

# 서비스 재시작
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### 프로덕션 배포 (미정)

**추후 고려사항**:
- 클라우드 마이그레이션 (AWS, GCP, Azure)
- Docker 이미지 빌드 및 레지스트리 푸시
- Kubernetes 오케스트레이션
- CI/CD 파이프라인 (GitHub Actions)

---

## 9. 문제 해결 가이드

### 시나리오 1: Backend API 연결 실패

**증상**:
```
C팀 Frontend: fetch failed (http://100.123.51.5:8000/api/assets)
```

**진단**:
```bash
# 1. B팀: FastAPI 서버 실행 중인지 확인
lsof -i :8000

# 2. C팀: 네트워크 연결 확인
curl http://100.123.51.5:8000/health

# 3. Tailscale VPN 연결 확인
tailscale status
```

**해결**:
```bash
# Backend 재시작 (Mac mini)
cd ~/sparklio_ai_marketing_studio/backend
source .venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 시나리오 2: 데이터베이스 연결 오류

**증상**:
```
B팀: sqlalchemy.exc.OperationalError: could not connect to server
```

**진단**:
```bash
# A팀: PostgreSQL 컨테이너 상태 확인
docker ps | grep sparklio-postgres

# PostgreSQL 로그 확인
docker logs sparklio-postgres
```

**해결**:
```bash
# PostgreSQL 재시작
docker restart sparklio-postgres

# 또는 전체 인프라 재시작
cd ~/sparklio_ai_marketing_studio/backend
docker compose restart
```

### 시나리오 3: MinIO 파일 업로드 실패

**증상**:
```
B팀: minio.error.S3Error: Access Denied
```

**진단**:
```bash
# MinIO 콘솔 접속 (브라우저)
# http://100.123.51.5:9001

# 또는 Python으로 연결 테스트
python3 << EOF
from minio import Minio
client = Minio("100.123.51.5:9000", access_key="sparklio", secret_key="sparklio_minio_2025", secure=False)
client.list_buckets()
EOF
```

**해결**:
1. `.env` 파일에서 `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY` 확인
2. 버킷 권한 확인 (MinIO Console)
3. MinIO 재시작: `docker restart sparklio-minio`

### 시나리오 4: 포트 충돌

**증상**:
```
B팀: OSError: [Errno 48] Address already in use (port 8000)
```

**진단**:
```bash
# 포트 8000 사용 프로세스 확인
lsof -i :8000

# 출력 예:
# COMMAND   PID USER   FD   TYPE DEVICE SIZE/OFF NODE NAME
# Python  12345 user    3u  IPv4  0t0  TCP *:8000 (LISTEN)
```

**해결**:
```bash
# 프로세스 종료
kill -9 12345

# 또는 다른 포트 사용
uvicorn app.main:app --port 8001
```

### 시나리오 5: Git 병합 충돌

**증상**:
```
CONFLICT (content): Merge conflict in backend/app/main.py
```

**해결**:
```bash
# 1. 현재 작업 저장
git stash

# 2. 최신 dev 브랜치 가져오기
git checkout dev
git pull origin dev

# 3. 기능 브랜치로 돌아가기
git checkout feature/b-my-feature

# 4. dev 브랜치 병합
git merge dev

# 5. 충돌 파일 수동 편집
# (VSCode에서 충돌 마커 확인: <<<<<<<, =======, >>>>>>>)

# 6. 충돌 해결 후 커밋
git add .
git commit -m "[B팀] Resolve merge conflict with dev"

# 7. 푸시
git push origin feature/b-my-feature
```

### 시나리오 6: 환경 변수 로드 실패

**증상**:
```
B팀: KeyError: 'POSTGRES_HOST' (환경 변수 없음)
```

**진단**:
```bash
# .env 파일 존재 확인
ls -la ~/sparklio_ai_marketing_studio/backend/.env

# 환경 변수 로드 확인
cd ~/sparklio_ai_marketing_studio/backend
source .venv/bin/activate
python -c "import os; from dotenv import load_dotenv; load_dotenv(); print(os.getenv('POSTGRES_HOST'))"
```

**해결**:
```bash
# .env 파일 생성 (없는 경우)
cp .env.example .env

# .env 파일 편집
nano .env

# FastAPI 재시작
uvicorn app.main:app --reload
```

---

## 추가 리소스

### 문서 참고

- **전체 설계**: [docs/ASSET_STORAGE_SPEC.md](../ASSET_STORAGE_SPEC.md)
- **환경 상태**: [docs/FINAL_ENVIRONMENT_STATUS.md](../FINAL_ENVIRONMENT_STATUS.md)
- **포트 할당**: [docs/PORT_ALLOCATION.md](./PORT_ALLOCATION.md)
- **Backend 가이드**: [docs/handoff/BACKEND_IMPLEMENTATION_GUIDE.md](../handoff/BACKEND_IMPLEMENTATION_GUIDE.md)
- **A팀 완료 보고서**: [docs/handoff/A_TEAM_COMPLETION_REPORT.md](../handoff/A_TEAM_COMPLETION_REPORT.md)

### 유용한 명령어 모음

**Mac mini (Backend)**:
```bash
# 인프라 상태 확인
docker ps

# Backend 서버 시작
cd ~/sparklio_ai_marketing_studio/backend
source .venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# 데이터베이스 접속
docker exec -it sparklio-postgres psql -U sparklio -d sparklio

# MinIO 버킷 확인
python scripts/init_minio_buckets.py
```

**Desktop (AI Worker)**:
```bash
# Ollama 모델 확인
docker exec ollama ollama list

# ComfyUI 시작
cd /d/AI/ComfyUI
./python_embeded/python.exe main.py --listen 0.0.0.0 --port 8188
```

**Laptop (Frontend)**:
```bash
# Frontend 개발 서버 시작
cd ~/sparklio_ai_marketing_studio/frontend
npm run dev

# 프로덕션 빌드 테스트
npm run build
npm start
```

---

**작성일**: 2025-11-15
**작성자**: A Team Leader
**버전**: 1.0
**다음 업데이트**: PORT_ALLOCATION.md 작성 예정
