# Backend API 구현 가이드 (A팀 → B팀 핸드오프)

**작성일**: 2025-11-15
**작성팀**: A팀 (인프라/환경 설정)
**대상팀**: B팀 (백엔드 개발)
**상태**: Ready for Implementation

---

## 1. 개요

A팀에서 Sparklio AI Marketing Studio의 자산 저장소 인프라를 구성 완료했습니다.
B팀은 이 문서를 기반으로 **FastAPI Backend API**를 구현해주시기 바랍니다.

### 완료된 작업 (A팀)

✅ MinIO 버킷 생성 (`dev-sparklio-assets`, `dev-sparklio-temp`, `dev-sparklio-backups`)
✅ PostgreSQL 데이터베이스 스키마 설계 및 생성
✅ pgvector 확장 활성화 (v0.8.1)
✅ Docker 환경 구성 (Mac mini)
✅ 자산 저장소 설계 사양서 작성 ([ASSET_STORAGE_SPEC.md](../ASSET_STORAGE_SPEC.md))

### B팀 구현 범위

- [ ] FastAPI 라우터 구현 (`/api/v1/assets/*`)
- [ ] 파일 업로드 엔드포인트
- [ ] MinIO 연동 로직 (업로드, 다운로드, Presigned URL)
- [ ] 자산 조회/목록/검색 API
- [ ] pgvector 임베딩 생성 및 유사도 검색
- [ ] 에러 처리 및 검증 로직

---

## 2. 인프라 환경 정보

### 2.1 Mac mini Backend Server

| 항목 | 값 |
|------|-----|
| **Tailscale IP** | `100.123.51.5` |
| **OS** | macOS (Darwin 25.0.0, ARM64 M2) |
| **Python** | 3.11.14 |
| **프로젝트 경로** | `~/sparklio_ai_marketing_studio/backend` |
| **가상환경** | `.venv` (Python 3.11.14) |

### 2.2 Docker 서비스

#### PostgreSQL
```bash
Container: sparklio-postgres
Host: 100.123.51.5:5432
Database: sparklio
User: sparklio
Password: sparklio_secure_2025
```

**연결 문자열**:
```
postgresql://sparklio:sparklio_secure_2025@100.123.51.5:5432/sparklio
```

#### MinIO
```bash
Container: sparklio-minio
API Endpoint: http://100.123.51.5:9000
Console: http://100.123.51.5:9001
Access Key: sparklio
Secret Key: sparklio_minio_2025
```

**Python 연결 예시**:
```python
from minio import Minio

client = Minio(
    "100.123.51.5:9000",
    access_key="sparklio",
    secret_key="sparklio_minio_2025",
    secure=False  # Tailscale 내부에서는 HTTP
)
```

#### Redis
```bash
Container: sparklio-redis
Host: 100.123.51.5:6379
```

---

## 3. 데이터베이스 스키마

### 3.1 핵심 테이블

#### `users`
```sql
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255) UNIQUE NOT NULL,
    name            VARCHAR(255),
    created_at      TIMESTAMP DEFAULT NOW()
);
```

#### `brands`
```sql
CREATE TABLE brands (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(255) NOT NULL,
    slug            VARCHAR(255) UNIQUE NOT NULL,
    description     TEXT,
    logo_asset_id   UUID REFERENCES generated_assets(id),
    settings        JSONB,
    status          VARCHAR(20) DEFAULT 'active',
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);
```

#### `projects`
```sql
CREATE TABLE projects (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id        UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    name            VARCHAR(255) NOT NULL,
    slug            VARCHAR(255) NOT NULL,
    description     TEXT,
    start_date      DATE,
    end_date        DATE,
    status          VARCHAR(20) DEFAULT 'active',
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW(),
    UNIQUE(brand_id, slug)
);
```

#### `generated_assets` (메인)
```sql
CREATE TABLE generated_assets (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- 조직 구조
    brand_id            UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
    project_id          UUID REFERENCES projects(id) ON DELETE SET NULL,
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- 자산 정보
    type                VARCHAR(50) NOT NULL,              -- 'image', 'video', 'audio', 'text', 'document'
    minio_path          TEXT NOT NULL,                     -- MinIO 경로
    original_name       TEXT,                              -- 원본 파일명
    file_size           BIGINT NOT NULL,                   -- bytes
    mime_type           VARCHAR(100),                      -- 'image/png', 'video/mp4', ...
    checksum            TEXT,                              -- SHA-256 해시

    -- 생성 정보
    source              VARCHAR(50) NOT NULL,              -- 'comfyui', 'llm', 'uploader', 'api'
    source_metadata     JSONB,                             -- 워크플로우, 프롬프트 등

    -- 상태 관리
    status              VARCHAR(20) DEFAULT 'active',      -- 'active', 'archived', 'deleted'

    -- 임베딩 (pgvector)
    embedding           vector(1536),                      -- OpenAI ada-002 또는 CLIP

    -- 추가 메타데이터
    metadata            JSONB,
    tags                TEXT[],

    -- 타임스탬프
    created_at          TIMESTAMP DEFAULT NOW(),
    updated_at          TIMESTAMP DEFAULT NOW(),
    deleted_at          TIMESTAMP
);
```

#### `generated_texts` (텍스트 전용)
```sql
CREATE TABLE generated_texts (
    id              UUID PRIMARY KEY REFERENCES generated_assets(id) ON DELETE CASCADE,
    content         TEXT NOT NULL,
    content_length  INT,
    text_type       VARCHAR(50),                           -- 'caption', 'description', 'script', 'article'
    language        VARCHAR(10)                            -- 'ko', 'en', 'ja', ...
);
```

### 3.2 인덱스

```sql
-- 브랜드별 자산 조회
CREATE INDEX idx_generated_assets_brand_created
ON generated_assets (brand_id, created_at DESC);

-- 프로젝트별 자산 조회
CREATE INDEX idx_generated_assets_project_created
ON generated_assets (project_id, created_at DESC)
WHERE project_id IS NOT NULL;

-- 타입/상태별 필터링
CREATE INDEX idx_generated_assets_type_status
ON generated_assets (type, status);

-- 중복 방지
CREATE INDEX idx_generated_assets_checksum
ON generated_assets (checksum)
WHERE checksum IS NOT NULL;

-- pgvector 유사도 검색
CREATE INDEX idx_generated_assets_embedding
ON generated_assets USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- 태그 검색
CREATE INDEX idx_generated_assets_tags
ON generated_assets USING GIN (tags);
```

---

## 4. MinIO 경로 구조

### 4.1 경로 규칙

```
{env}-sparklio-assets/
└── {asset_type}/
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

### 4.2 경로 생성 로직 (Python)

```python
from datetime import datetime
from uuid import uuid4
from pathlib import Path

def generate_minio_path(
    asset_type: str,      # 'images', 'videos', 'audio', 'documents', 'texts'
    brand_id: str,        # UUID
    project_id: str,      # UUID (optional)
    file_extension: str,  # '.png', '.mp4', etc.
    env: str = "dev"
) -> str:
    """
    MinIO 경로 생성

    Returns:
        'dev-sparklio-assets/images/brand_abc/project_xyz/2025/11/15/uuid.png'
    """
    now = datetime.now()
    asset_id = uuid4()

    # project_id가 없으면 'unassigned' 사용
    project_part = project_id if project_id else "unassigned"

    path = f"{env}-sparklio-assets/{asset_type}/{brand_id}/{project_part}/{now.year}/{now.month:02d}/{now.day:02d}/{asset_id}{file_extension}"

    return path
```

---

## 5. API 구현 가이드

### 5.1 필수 엔드포인트

#### POST `/api/v1/assets` - 파일 업로드

**요청** (multipart/form-data):
```python
# FastAPI 구현 예시
from fastapi import APIRouter, UploadFile, File, Form
from uuid import UUID

router = APIRouter(prefix="/api/v1")

@router.post("/assets")
async def upload_asset(
    file: UploadFile = File(...),
    brand_id: UUID = Form(...),
    project_id: UUID = Form(None),
    user_id: UUID = Form(...),
    source: str = Form("api"),
    tags: str = Form(""),              # 쉼표 구분 문자열
    metadata: str = Form("{}")         # JSON 문자열
):
    """
    자산 업로드

    1. 파일 검증 (크기, MIME 타입)
    2. Checksum 계산 (SHA-256)
    3. MinIO 경로 생성
    4. MinIO 업로드
    5. PostgreSQL INSERT
    6. Presigned URL 생성
    7. 응답 반환
    """
    # 구현 필요
    pass
```

**응답**:
```json
{
  "asset_id": "9f2e4a1b-8c3d-4e5f-a6b7-1d2e3f4a5b6c",
  "presigned_url": "http://100.123.51.5:9000/dev-sparklio-assets/images/...?X-Amz-Expires=3600&...",
  "minio_path": "dev-sparklio-assets/images/brand_abc/project_xyz/2025/11/15/9f2e4a1b....png",
  "file_size": 2048576,
  "mime_type": "image/png",
  "checksum": "sha256:abc123...",
  "created_at": "2025-11-15T10:30:00Z"
}
```

#### GET `/api/v1/assets/{asset_id}` - 자산 조회

**응답**:
```json
{
  "asset_id": "uuid",
  "brand_id": "uuid",
  "project_id": "uuid",
  "user_id": "uuid",
  "type": "image",
  "original_name": "winter_campaign_hero.png",
  "file_size": 2048576,
  "mime_type": "image/png",
  "presigned_url": "http://...",
  "source": "comfyui",
  "tags": ["winter", "campaign"],
  "metadata": { ... },
  "created_at": "2025-11-15T10:30:00Z",
  "updated_at": "2025-11-15T10:30:00Z"
}
```

#### GET `/api/v1/assets` - 자산 목록

**쿼리 파라미터**:
```
?brand_id=uuid
&project_id=uuid
&type=image
&status=active
&tags=winter,campaign
&limit=20
&offset=0
&sort=created_at:desc
```

**응답**:
```json
{
  "total": 156,
  "limit": 20,
  "offset": 0,
  "assets": [
    { ... },
    { ... }
  ]
}
```

#### POST `/api/v1/assets/search/similar` - 유사 자산 검색

**요청**:
```json
{
  "asset_id": "uuid",
  "limit": 10,
  "threshold": 0.8
}
```

**응답**:
```json
{
  "results": [
    {
      "asset_id": "uuid",
      "similarity": 0.95,
      "presigned_url": "...",
      "type": "image",
      "tags": ["winter"]
    }
  ]
}
```

#### DELETE `/api/v1/assets/{asset_id}` - 자산 삭제 (Soft Delete)

**처리 로직**:
```python
@router.delete("/assets/{asset_id}")
async def delete_asset(asset_id: UUID):
    """
    Soft Delete:
    - status = 'deleted'
    - deleted_at = NOW()
    - MinIO 파일은 유지 (30일 후 배치 삭제)
    """
    # 구현 필요
    pass
```

---

## 6. 핵심 구현 샘플 코드

### 6.1 MinIO 파일 업로드

```python
from minio import Minio
from io import BytesIO
import hashlib

def upload_to_minio(
    client: Minio,
    bucket: str,
    object_path: str,
    file_data: bytes,
    content_type: str
) -> dict:
    """
    MinIO에 파일 업로드

    Returns:
        {
            "minio_path": "dev-sparklio-assets/images/...",
            "file_size": 1024,
            "checksum": "sha256:..."
        }
    """
    # Checksum 계산
    checksum = hashlib.sha256(file_data).hexdigest()

    # 파일 업로드
    client.put_object(
        bucket_name=bucket,
        object_name=object_path,
        data=BytesIO(file_data),
        length=len(file_data),
        content_type=content_type
    )

    return {
        "minio_path": f"{bucket}/{object_path}",
        "file_size": len(file_data),
        "checksum": f"sha256:{checksum}"
    }
```

### 6.2 Presigned URL 생성

```python
from datetime import timedelta

def generate_presigned_url(
    client: Minio,
    bucket: str,
    object_path: str,
    expires: timedelta = timedelta(hours=1)
) -> str:
    """
    Presigned URL 생성 (읽기 전용)

    Args:
        expires: URL 유효기간 (기본 1시간)

    Returns:
        "http://100.123.51.5:9000/dev-sparklio-assets/...?X-Amz-Expires=3600&..."
    """
    url = client.presigned_get_object(
        bucket_name=bucket,
        object_name=object_path,
        expires=expires
    )

    return url
```

### 6.3 PostgreSQL INSERT

```python
from sqlalchemy import insert
from datetime import datetime
from uuid import UUID

async def create_asset_record(
    db,  # AsyncSession
    brand_id: UUID,
    user_id: UUID,
    asset_type: str,
    minio_path: str,
    original_name: str,
    file_size: int,
    mime_type: str,
    checksum: str,
    source: str,
    project_id: UUID = None,
    tags: list = None,
    metadata: dict = None,
    source_metadata: dict = None
) -> UUID:
    """
    자산 레코드 생성

    Returns:
        생성된 asset_id (UUID)
    """
    stmt = insert(GeneratedAssets).values(
        brand_id=brand_id,
        project_id=project_id,
        user_id=user_id,
        type=asset_type,
        minio_path=minio_path,
        original_name=original_name,
        file_size=file_size,
        mime_type=mime_type,
        checksum=checksum,
        source=source,
        source_metadata=source_metadata,
        metadata=metadata,
        tags=tags or [],
        status='active',
        created_at=datetime.now()
    ).returning(GeneratedAssets.id)

    result = await db.execute(stmt)
    await db.commit()

    asset_id = result.scalar_one()
    return asset_id
```

### 6.4 pgvector 유사도 검색

```python
from sqlalchemy import text

async def search_similar_assets(
    db,
    reference_asset_id: UUID,
    limit: int = 10,
    threshold: float = 0.8
) -> list:
    """
    pgvector 기반 유사 자산 검색

    Args:
        reference_asset_id: 기준 자산 ID
        limit: 결과 개수
        threshold: 최소 유사도 (0~1)

    Returns:
        [
            {
                "asset_id": "uuid",
                "similarity": 0.95,
                "minio_path": "...",
                "type": "image"
            }
        ]
    """
    query = text("""
        SELECT
            id,
            minio_path,
            type,
            1 - (embedding <=> (SELECT embedding FROM generated_assets WHERE id = :ref_id)) AS similarity
        FROM generated_assets
        WHERE
            status = 'active'
            AND embedding IS NOT NULL
            AND id != :ref_id
            AND 1 - (embedding <=> (SELECT embedding FROM generated_assets WHERE id = :ref_id)) > :threshold
        ORDER BY similarity DESC
        LIMIT :limit
    """)

    result = await db.execute(
        query,
        {"ref_id": reference_asset_id, "threshold": threshold, "limit": limit}
    )

    rows = result.fetchall()

    return [
        {
            "asset_id": str(row.id),
            "similarity": float(row.similarity),
            "minio_path": row.minio_path,
            "type": row.type
        }
        for row in rows
    ]
```

---

## 7. 환경 변수 설정

`backend/.env` 파일에 다음 설정 추가:

```bash
# PostgreSQL
DATABASE_URL=postgresql://sparklio:sparklio_secure_2025@100.123.51.5:5432/sparklio

# MinIO
MINIO_ENDPOINT=100.123.51.5:9000
MINIO_ACCESS_KEY=sparklio
MINIO_SECRET_KEY=sparklio_minio_2025
MINIO_BUCKET_PREFIX=dev-
MINIO_SECURE=false

# Redis
REDIS_URL=redis://100.123.51.5:6379

# API 설정
ENVIRONMENT=dev
API_VERSION=v1
PRESIGNED_URL_EXPIRES=3600  # 1시간 (초)
```

---

## 8. 검증 및 에러 처리

### 8.1 파일 검증

```python
from fastapi import HTTPException

# 허용 MIME 타입
ALLOWED_MIME_TYPES = {
    "image": ["image/png", "image/jpeg", "image/webp", "image/gif"],
    "video": ["video/mp4", "video/webm", "video/quicktime"],
    "audio": ["audio/mpeg", "audio/wav", "audio/ogg"],
    "document": ["application/pdf", "application/msword"]
}

# 최대 파일 크기 (100MB)
MAX_FILE_SIZE = 100 * 1024 * 1024

def validate_upload_file(file: UploadFile, asset_type: str):
    """파일 검증"""
    # MIME 타입 검증
    if file.content_type not in ALLOWED_MIME_TYPES.get(asset_type, []):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed: {ALLOWED_MIME_TYPES[asset_type]}"
        )

    # 파일 크기 검증 (UploadFile.size는 모든 플랫폼에서 지원되지 않으므로 읽으면서 체크)
    # 구현 시 chunk로 읽어서 크기 체크
```

### 8.2 에러 응답 포맷

```json
{
  "error": {
    "code": "INVALID_FILE_TYPE",
    "message": "File type 'application/zip' is not allowed for asset type 'image'",
    "details": {
      "allowed_types": ["image/png", "image/jpeg", "image/webp"]
    }
  }
}
```

---

## 9. 테스트 가이드

### 9.1 수동 테스트

#### MinIO 연결 테스트
```python
from minio import Minio

client = Minio(
    "100.123.51.5:9000",
    access_key="sparklio",
    secret_key="sparklio_minio_2025",
    secure=False
)

# 버킷 목록 조회
buckets = client.list_buckets()
for bucket in buckets:
    print(bucket.name)

# 예상 출력:
# dev-sparklio-assets
# dev-sparklio-temp
# dev-sparklio-backups
```

#### PostgreSQL 연결 테스트
```python
from sqlalchemy import create_engine, text

engine = create_engine("postgresql://sparklio:sparklio_secure_2025@100.123.51.5:5432/sparklio")

with engine.connect() as conn:
    result = conn.execute(text("SELECT COUNT(*) FROM generated_assets"))
    print(f"Assets count: {result.scalar()}")
```

### 9.2 API 테스트 (cURL)

```bash
# 파일 업로드
curl -X POST http://100.123.51.5:8000/api/v1/assets \
  -F "file=@test_image.png" \
  -F "brand_id=550e8400-e29b-41d4-a716-446655440000" \
  -F "user_id=550e8400-e29b-41d4-a716-446655440001" \
  -F "source=api" \
  -F "tags=test,winter"

# 자산 조회
curl http://100.123.51.5:8000/api/v1/assets/{asset_id}

# 목록 조회
curl "http://100.123.51.5:8000/api/v1/assets?limit=10&offset=0"
```

---

## 10. 참고 문서

1. **전체 설계 사양서**: [ASSET_STORAGE_SPEC.md](../ASSET_STORAGE_SPEC.md)
2. **MinIO Python SDK**: https://min.io/docs/minio/linux/developers/python/minio-py.html
3. **pgvector 문서**: https://github.com/pgvector/pgvector
4. **FastAPI 파일 업로드**: https://fastapi.tiangolo.com/tutorial/request-files/

---

## 11. 질문/이슈

B팀 구현 중 질문이나 이슈가 있으면:
- A팀에게 문의
- 또는 `docs/handoff/BACKEND_QUESTIONS.md`에 기록

---

## 부록 A: SQLAlchemy 모델 예시

```python
# backend/app/models/assets.py

from sqlalchemy import Column, String, BigInteger, TIMESTAMP, ForeignKey, ARRAY, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from pgvector.sqlalchemy import Vector
import uuid
from datetime import datetime

from app.database import Base

class GeneratedAsset(Base):
    __tablename__ = "generated_assets"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # 조직 구조
    brand_id = Column(UUID(as_uuid=True), ForeignKey("brands.id"), nullable=False)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"))
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    # 자산 정보
    type = Column(String(50), nullable=False)
    minio_path = Column(Text, nullable=False)
    original_name = Column(Text)
    file_size = Column(BigInteger, nullable=False)
    mime_type = Column(String(100))
    checksum = Column(Text)

    # 생성 정보
    source = Column(String(50), nullable=False)
    source_metadata = Column(JSONB)

    # 상태
    status = Column(String(20), default="active")

    # 임베딩
    embedding = Column(Vector(1536))

    # 메타데이터
    metadata = Column(JSONB)
    tags = Column(ARRAY(Text))

    # 타임스탬프
    created_at = Column(TIMESTAMP, default=datetime.now)
    updated_at = Column(TIMESTAMP, default=datetime.now, onupdate=datetime.now)
    deleted_at = Column(TIMESTAMP)
```

---

**작성**: A팀 리더
**승인**: -
**배포일**: 2025-11-15
