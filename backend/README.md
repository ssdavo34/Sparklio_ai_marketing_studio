# Sparklio AI Marketing Studio - Backend Starter Code

**대상**: B팀 (Backend 개발)
**작성일**: 2025-11-15
**버전**: 1.0

---

## 개요

이 스타터 코드는 B팀이 Backend API 개발을 즉시 시작할 수 있도록 준비된 FastAPI 프로젝트입니다.

**포함된 기능**:
- ✅ FastAPI 애플리케이션 구조
- ✅ PostgreSQL 연동 (SQLAlchemy)
- ✅ MinIO Object Storage 연동
- ✅ 자산 업로드/조회/삭제 API (완전 구현)
- ✅ Presigned URL 생성
- ✅ 환경 변수 관리 (Pydantic Settings)

---

## 디렉토리 구조

```
backend_starter/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI 애플리케이션 엔트리포인트
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py           # 설정 관리 (Pydantic Settings)
│   │   └── database.py         # SQLAlchemy 설정
│   ├── models/
│   │   ├── __init__.py
│   │   └── asset.py            # GeneratedAsset 모델
│   ├── schemas/
│   │   ├── __init__.py
│   │   └── asset.py            # Pydantic 스키마
│   ├── services/
│   │   ├── __init__.py
│   │   └── storage.py          # MinIO 연동 서비스
│   └── api/
│       ├── __init__.py
│       └── v1/
│           ├── __init__.py
│           ├── router.py       # API 라우터 통합
│           └── endpoints/
│               ├── __init__.py
│               └── assets.py   # 자산 API 엔드포인트
├── tests/                      # 테스트 코드 (TODO)
├── README.md                   # 본 문서
└── requirements.txt            # Python 의존성
```

---

## 설치 및 실행

### 1. Mac mini에 코드 복사

```bash
# Laptop (K:\ 드라이브)에서 Mac mini로 복사
scp -r K:\sparklio_ai_marketing_studio\backend_starter/* woosun@100.123.51.5:~/sparklio_ai_marketing_studio/backend/
```

또는 Git을 통해:

```bash
# Git에 커밋 후 Mac mini에서 pull
git add backend/
git commit -m "[B팀] Add backend starter code"
git push origin dev

# Mac mini
ssh woosun@100.123.51.5
cd ~/sparklio_ai_marketing_studio/backend
git pull origin dev
```

### 2. Python 가상환경 설정

```bash
# Mac mini
cd ~/sparklio_ai_marketing_studio/backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 3. 환경 변수 확인

`.env` 파일이 이미 있는지 확인하고, 없으면 생성:

```bash
# .env 파일이 없으면
cat > .env << 'EOF'
# Application
APP_ENV=development
APP_HOST=0.0.0.0
APP_PORT=8000

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
MINIO_SECURE=False
MINIO_BUCKET_PREFIX=dev-

# AI Workers
OLLAMA_ENDPOINT=http://100.120.180.42:11434
COMFYUI_ENDPOINT=http://100.120.180.42:8188

# File Upload
MAX_FILE_SIZE_MB=100
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/webp,video/mp4,text/plain

# Presigned URL
PRESIGNED_URL_EXPIRY=3600

# Vector Search
EMBEDDING_DIMENSION=1536
EOF
```

### 4. FastAPI 서버 시작

```bash
# 개발 모드 (자동 재시작)
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# 또는 Python 직접 실행
python app/main.py
```

### 5. API 문서 확인

브라우저에서:
- Swagger UI: http://100.123.51.5:8000/docs
- ReDoc: http://100.123.51.5:8000/redoc

---

## API 사용 예시

### 1. 헬스 체크

```bash
curl http://100.123.51.5:8000/health
```

**응답**:
```json
{
  "status": "healthy",
  "services": {
    "api": "ok",
    "database": "ok",
    "storage": "ok"
  }
}
```

### 2. 자산 업로드

```bash
curl -X POST http://100.123.51.5:8000/api/v1/assets \
  -F 'file=@test-image.png' \
  -F 'brand_id=550e8400-e29b-41d4-a716-446655440000' \
  -F 'user_id=550e8400-e29b-41d4-a716-446655440001' \
  -F 'asset_type=image' \
  -F 'source=manual' \
  -F 'tags=test,banner'
```

**응답**:
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "brand_id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "550e8400-e29b-41d4-a716-446655440001",
  "type": "image",
  "minio_path": "dev-sparklio-assets/image/550e8400.../2025/11/15/abc123.png",
  "file_size": 123456,
  "status": "active",
  "presigned_url": "http://100.123.51.5:9000/dev-sparklio-assets/..."
}
```

### 3. 자산 목록 조회

```bash
curl "http://100.123.51.5:8000/api/v1/assets?brand_id=550e8400-e29b-41d4-a716-446655440000&page=1&page_size=20"
```

### 4. 자산 상세 조회

```bash
curl http://100.123.51.5:8000/api/v1/assets/123e4567-e89b-12d3-a456-426614174000
```

### 5. 자산 메타데이터 수정

```bash
curl -X PATCH http://100.123.51.5:8000/api/v1/assets/123e4567-e89b-12d3-a456-426614174000 \
  -H "Content-Type: application/json" \
  -d '{"tags": ["product", "banner", "new"], "status": "active"}'
```

### 6. 자산 삭제 (Soft Delete)

```bash
curl -X DELETE http://100.123.51.5:8000/api/v1/assets/123e4567-e89b-12d3-a456-426655440000
```

### 7. 자산 삭제 (Hard Delete)

```bash
curl -X DELETE "http://100.123.51.5:8000/api/v1/assets/123e4567-e89b-12d3-a456-426655440000?hard_delete=true"
```

---

## ⚠️ API 정책 (2025-11-15 업데이트)

### 공식 외부 API (Public API)

✅ **`POST /api/v1/generate`** - 통합 Generator API (권장)
- P0 지원: `kind="brand_kit"`
- P1 확장: `product_detail`, `sns`, `presentation`
- 사용 예시: [frontend/lib/api-client.ts](../frontend/lib/api-client.ts)

### 내부 전용 API (Internal/Deprecated)

⚠️ **`/api/v1/agents/*`** - Agent 개별 호출 API (Deprecated)
- **상태**: 내부 전용, 외부 사용 금지
- **이유**: Agent는 내부 구성 요소로, 직접 노출하지 않음
- **대체**: `/api/v1/generate` 사용
- **제거 예정**: P1 이후

#### Deprecated 엔드포인트 목록

| Endpoint | 대체 방법 |
|----------|----------|
| `POST /api/v1/agents/brief/generate` | `POST /api/v1/generate` (kind: `marketing_brief`) |
| `POST /api/v1/agents/brand/analyze/{id}` | `POST /api/v1/generate` (kind: `brand_kit`) |
| `POST /api/v1/agents/strategy/generate` | **내부 Agent 호출** (Generator 파이프라인) |
| `POST /api/v1/agents/copy/generate` | **내부 Agent 호출** (Generator 파이프라인) |
| `POST /api/v1/agents/vision/generate` | **내부 Agent 호출** (Generator 파이프라인) |
| `POST /api/v1/agents/review/content` | **내부 Agent 호출** (Generator 파이프라인) |

**중요**: 프론트엔드는 `/agents/*`를 직접 호출하지 말고, 항상 `/generate`를 사용하세요.

---

## 다음 단계 (B팀 구현 과제)

이 스타터 코드는 **자산 관리 API**의 기본 CRUD를 제공합니다. B팀은 다음 기능을 추가로 구현해주세요:

### Phase 1: 기본 엔티티 추가 (1주차)

- [ ] `users` 모델 및 API (회원 관리)
- [ ] `brands` 모델 및 API (브랜드 관리)
- [ ] `projects` 모델 및 API (프로젝트 관리)
- [ ] 외래 키 관계 설정 (GeneratedAsset → User/Brand/Project)

### Phase 2: 인증 및 권한 (2주차)

- [ ] JWT 기반 인증 (`/api/v1/auth/login`, `/api/v1/auth/register`)
- [ ] 사용자별 자산 접근 권한 확인
- [ ] 브랜드별 역할 관리 (Owner, Editor, Viewer)

### Phase 3: 고급 기능 (3주차)

- [ ] pgvector 임베딩 생성 (비동기 작업)
- [ ] 유사 자산 검색 API (`/api/v1/assets/{id}/similar`)
- [ ] 태그 기반 검색 개선 (GIN 인덱스 활용)
- [ ] 자산 통계 API (`/api/v1/stats/assets`)

### Phase 4: AI 워커 통합 (4주차)

- [ ] Ollama API 연동 (`/api/v1/ai/generate-text`)
- [ ] ComfyUI 워크플로우 실행 (`/api/v1/ai/generate-image`)
- [ ] 생성된 자산 자동 저장

---

## 참고 문서

- **Backend 구현 가이드**: [docs/handoff/BACKEND_IMPLEMENTATION_GUIDE.md](../docs/handoff/BACKEND_IMPLEMENTATION_GUIDE.md)
- **설계 사양서**: [docs/ASSET_STORAGE_SPEC.md](../docs/ASSET_STORAGE_SPEC.md)
- **개발 워크플로우**: [docs/DEV_WORKFLOW.md](../docs/DEV_WORKFLOW.md)
- **포트 할당**: [docs/PORT_ALLOCATION.md](../docs/PORT_ALLOCATION.md)

---

## 문제 해결

### 1. ModuleNotFoundError: No module named 'app'

```bash
# Python 경로 확인
export PYTHONPATH="${PYTHONPATH}:$(pwd)"

# 또는 app 디렉토리에서 실행하지 말고 상위 디렉토리에서 실행
cd ~/sparklio_ai_marketing_studio/backend
uvicorn app.main:app --reload
```

### 2. Database connection failed

```bash
# PostgreSQL 실행 확인
docker ps | grep sparklio-postgres

# 연결 테스트
docker exec sparklio-postgres psql -U sparklio -d sparklio -c "SELECT 1"
```

### 3. MinIO connection failed

```bash
# MinIO 실행 확인
docker ps | grep sparklio-minio

# 버킷 확인
python3 << EOF
from minio import Minio
client = Minio("100.123.51.5:9000", access_key="sparklio", secret_key="sparklio_minio_2025", secure=False)
print([b.name for b in client.list_buckets()])
EOF
```

---

## 질문 및 이슈

질문이 있으면 [docs/handoff/BACKEND_QUESTIONS.md](../docs/handoff/BACKEND_QUESTIONS.md)에 기록해주세요.

---

**작성자**: A Team Leader
**업데이트**: 2025-11-15
