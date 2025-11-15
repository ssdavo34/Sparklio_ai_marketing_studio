# Sparklio AI Marketing Studio - 자산 저장소 설계 사양서

**버전**: 1.0
**작성일**: 2025-11-15
**작성자**: A Team
**상태**: Draft → Review 중

---

## 목차

1. [개요](#1-개요)
2. [아키텍처](#2-아키텍처)
3. [저장소 구조](#3-저장소-구조)
4. [데이터베이스 스키마](#4-데이터베이스-스키마)
5. [API 설계](#5-api-설계)
6. [ComfyUI 연동](#6-comfyui-연동)
7. [보안 및 접근 제어](#7-보안-및-접근-제어)
8. [환경별 구성](#8-환경별-구성)
9. [운영 정책](#9-운영-정책)
10. [구현 로드맵](#10-구현-로드맵)

---

## 1. 개요

### 1.1 목적

Sparklio AI Marketing Studio에서 생성되는 모든 디지털 자산(이미지, 비디오, 오디오, 텍스트, 문서)을 효율적으로 저장, 관리, 검색하기 위한 통합 저장소 시스템.

### 1.2 설계 원칙

1. **중앙 집중식 저장**: 모든 자산은 Mac mini MinIO에 통합 저장
2. **메타데이터 분리**: 바이너리는 MinIO, 메타데이터는 PostgreSQL
3. **확장 가능성**: 브랜드/프로젝트 단위 조직화
4. **보안 우선**: 프리사인 URL 기반 접근 제어
5. **자동화**: ComfyUI/LLM 생성 파일의 자동 업로드 및 등록

### 1.3 시스템 구성

| 노드 | 역할 | 저장 대상 |
|------|------|-----------|
| **Desktop (100.120.180.42)** | 생성 워커 | ComfyUI 로컬 출력 (임시) |
| **Mac mini (100.123.51.5)** | 중앙 저장소 | MinIO(바이너리) + PostgreSQL(메타데이터) |
| **Laptop (100.101.68.23)** | 프론트엔드 | 없음 (API 통해서만 접근) |

### 1.4 스토리지 확장성 및 마이그레이션 전략

#### 현재 구성 (Phase 1)
- **저장 위치**: Mac mini 512GB 내장 SSD
- **MinIO 데이터 경로**: Docker 볼륨 (`sparklio_minio_data`)
- **예상 용량**: 연간 ~180GB (브랜드 10개 기준)
- **운영 기간**: 최대 3년 (512GB 기준)

#### 확장 시나리오

**시나리오 1: 외장 SSD 연결** (용량 200GB 초과 시)
```bash
# Mac mini에 외장 SSD 연결
# MinIO 데이터를 외장 디스크로 이동

# 1. MinIO 중지
docker compose stop minio

# 2. 데이터 복사
rsync -av /var/lib/docker/volumes/sparklio_minio_data/_data/ /Volumes/External/minio_data/

# 3. docker-compose.yml 수정 (볼륨을 외장 디스크로 변경)
volumes:
  - /Volumes/External/minio_data:/data

# 4. MinIO 재시작
docker compose up -d minio
```

**시나리오 2: 클라우드 Object Storage 마이그레이션** (용량 500GB 초과 시)

옵션 A: **AWS S3**
- MinIO → S3 마이그레이션 도구 사용
- Backend API의 저장소 엔드포인트만 변경 (boto3 SDK 동일)
- 비용: ~$0.023/GB/월 (스탠다드)

옵션 B: **Wasabi**
- S3 호환 API
- 비용: ~$0.0059/GB/월 (저렴)
- 무제한 egress (다운로드 비용 없음)

옵션 C: **Backblaze B2**
- S3 호환 API
- 비용: ~$0.005/GB/월 (가장 저렴)

#### 마이그레이션 호환성 보장

**핵심 원칙**: 브랜드/프로젝트 단위 경로 설계로 이관 용이성 확보

```
# 경로 구조 (변경 없음)
images/{brand_id}/{project_id}/{YYYY}/{MM}/{DD}/{uuid}.ext

# 특정 브랜드만 클라우드로 이관
mc mirror local/dev-sparklio-assets/images/brand_abc/ \
          s3/prod-sparklio-assets/images/brand_abc/

# PostgreSQL 메타데이터 업데이트
UPDATE generated_assets
SET minio_path = REPLACE(minio_path, 'dev-sparklio-assets', 's3-sparklio-assets')
WHERE brand_id = 'brand_abc';
```

#### 하이브리드 스토리지 전략 (Phase 3 고려사항)

**Hot Storage** (Mac mini MinIO):
- 최근 30일 자산
- 자주 접근하는 자산
- 빠른 속도 요구

**Cold Storage** (클라우드 S3):
- 30일 이상 오래된 자산
- 아카이브된 프로젝트
- 비용 절감 우선

**자동 아카이빙 정책**:
```python
# 30일 경과 자산 자동 클라우드 이관
def auto_archive_old_assets():
    old_assets = db.query("""
        SELECT * FROM generated_assets
        WHERE created_at < NOW() - INTERVAL '30 days'
        AND status = 'active'
        AND minio_path LIKE 'dev-sparklio-assets%'
    """)

    for asset in old_assets:
        # MinIO → S3 복사
        copy_to_s3(asset.minio_path)

        # DB 업데이트
        update_asset_location(asset.id, s3_path)

        # MinIO 원본 삭제 (선택)
        delete_from_minio(asset.minio_path)
```

---

## 2. 아키텍처

### 2.1 전체 데이터 흐름

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. Desktop: ComfyUI/LLM 자산 생성                                │
│    → D:\AI\ComfyUI\ComfyUI\output\image_001.png                  │
└──────────────────┬──────────────────────────────────────────────┘
                   │
                   │ HTTP POST (via Tailscale)
                   ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. Mac mini Backend API                                          │
│    POST /api/v1/assets                                           │
│    - 파일 수신                                                    │
│    - brand_id, project_id 등 메타데이터 추출                      │
└──────────────────┬──────────────────────────────────────────────┘
                   │
                   ├──────────────────┬─────────────────────────────┐
                   ▼                  ▼                             ▼
┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────────┐
│ 3-A. MinIO 저장       │  │ 3-B. PostgreSQL 기록  │  │ 3-C. pgvector 임베딩  │
│ sparklio-assets/     │  │ generated_assets     │  │ (이미지 검색용)        │
│ images/brand_x/...   │  │ 테이블에 INSERT       │  │                      │
└──────────────────────┘  └──────────────────────┘  └──────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. API 응답                                                       │
│    {                                                             │
│      "asset_id": "uuid",                                         │
│      "presigned_url": "http://...?expires=3600",                 │
│      "minio_path": "images/brand_x/project_y/2025/11/15/..."    │
│    }                                                             │
└──────────────────┬──────────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. Frontend: 프리사인 URL로 자산 표시                              │
│    <img src="presigned_url" />                                   │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 역할 분리

| 컴포넌트 | 책임 |
|----------|------|
| **MinIO** | - 바이너리 파일 저장<br>- 버킷/오브젝트 관리<br>- Presigned URL 생성 |
| **PostgreSQL** | - 메타데이터 저장<br>- 검색/필터링<br>- 관계 관리 (브랜드-프로젝트-자산) |
| **pgvector** | - 이미지/텍스트 임베딩 저장<br>- 유사도 기반 검색 |
| **Backend API** | - 업로드 조율<br>- 프리사인 URL 생성<br>- 권한 검증 |

---

## 3. 저장소 구조

### 3.1 MinIO 버킷 구성

#### 운영 환경별 버킷

```
dev-sparklio-assets/          # 개발 환경
stage-sparklio-assets/        # 스테이징 환경
prod-sparklio-assets/         # 프로덕션 환경

dev-sparklio-temp/            # 개발 임시 파일 (7일 후 자동 삭제)
stage-sparklio-temp/
prod-sparklio-temp/

dev-sparklio-backups/         # 개발 백업
stage-sparklio-backups/
prod-sparklio-backups/
```

**현재 단계**: `dev-` prefix 사용

#### 3.2 자산 경로 구조 (핵심)

```
{env}-sparklio-assets/
├── images/
│   └── {brand_id}/
│       └── {project_id}/
│           └── {YYYY}/
│               └── {MM}/
│                   └── {DD}/
│                       └── {uuid}.{ext}
├── videos/
│   └── {brand_id}/
│       └── {project_id}/
│           └── {YYYY}/
│               └── {MM}/
│                   └── {DD}/
│                       └── {uuid}.{ext}
├── audio/
│   └── {brand_id}/...
├── documents/
│   └── {brand_id}/...
└── texts/
    └── {brand_id}/...
```

**예시 경로**:
```
dev-sparklio-assets/images/brand_abc123/campaign_winter2025/2025/11/15/9f2e4a1b-8c3d-4e5f-a6b7-1d2e3f4a5b6c.png
```

#### 3.3 경로 설계 이유

1. **`{brand_id}` 최상위 배치**
   - 브랜드별 자산 정리/이관/삭제 용이
   - 비용 분석 (어느 브랜드가 저장 공간을 많이 쓰는지)
   - 멀티테넌시 격리

2. **`{project_id}` 두 번째 레벨**
   - 캠페인/프로젝트 단위 관리
   - 프로젝트 종료 시 일괄 아카이빙

3. **날짜(`{YYYY}/{MM}/{DD}`) 세 번째 레벨**
   - 시간 기반 쿼리 최적화
   - 오래된 자산 아카이빙
   - 로그 추적

4. **`{uuid}.{ext}` 파일명**
   - 중복 방지
   - URL 안전성
   - 원본 파일명은 DB의 `original_name`에 저장

---

## 4. 데이터베이스 스키마

### 4.1 `generated_assets` 테이블 (메인)

```sql
CREATE TABLE generated_assets (
    -- 기본 식별자
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- 조직 구조
    brand_id            UUID NOT NULL,              -- 브랜드/클라이언트
    project_id          UUID,                       -- 캠페인/프로젝트 (NULL 가능)
    user_id             UUID NOT NULL,              -- 생성 요청 유저

    -- 자산 정보
    type                VARCHAR(50) NOT NULL,       -- 'image', 'video', 'audio', 'text', 'document'
    minio_path          TEXT NOT NULL,              -- MinIO 경로
    original_name       TEXT,                       -- 원본 파일명
    file_size           BIGINT NOT NULL,            -- bytes
    mime_type           VARCHAR(100),               -- 'image/png', 'video/mp4', ...
    checksum            TEXT,                       -- SHA-256 해시 (중복 방지)

    -- 생성 정보
    source              VARCHAR(50) NOT NULL,       -- 'comfyui', 'llm', 'uploader', 'api'
    source_metadata     JSONB,                      -- ComfyUI 워크플로우, LLM 프롬프트 등

    -- 상태 관리
    status              VARCHAR(20) DEFAULT 'active', -- 'active', 'archived', 'deleted'

    -- 임베딩 (pgvector)
    embedding           vector(1536),               -- OpenAI ada-002 또는 CLIP

    -- 추가 메타데이터
    metadata            JSONB,                      -- 자유 형식 메타데이터
    tags                TEXT[],                     -- 태그 배열

    -- 타임스탬프
    created_at          TIMESTAMP DEFAULT NOW(),
    updated_at          TIMESTAMP DEFAULT NOW(),
    deleted_at          TIMESTAMP                   -- Soft delete
);

-- 인덱스
CREATE INDEX idx_generated_assets_brand_created
ON generated_assets (brand_id, created_at DESC);

CREATE INDEX idx_generated_assets_project_created
ON generated_assets (project_id, created_at DESC)
WHERE project_id IS NOT NULL;

CREATE INDEX idx_generated_assets_type_status
ON generated_assets (type, status);

CREATE INDEX idx_generated_assets_user
ON generated_assets (user_id, created_at DESC);

CREATE INDEX idx_generated_assets_checksum
ON generated_assets (checksum)
WHERE checksum IS NOT NULL;

-- pgvector 인덱스 (유사도 검색)
CREATE INDEX idx_generated_assets_embedding
ON generated_assets USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Full-text search (태그)
CREATE INDEX idx_generated_assets_tags
ON generated_assets USING GIN (tags);
```

### 4.2 `brands` 테이블

```sql
CREATE TABLE brands (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(255) NOT NULL,
    slug            VARCHAR(255) UNIQUE NOT NULL,
    description     TEXT,
    logo_asset_id   UUID REFERENCES generated_assets(id),

    -- 설정
    settings        JSONB,                      -- 브랜드별 설정

    -- 상태
    status          VARCHAR(20) DEFAULT 'active',

    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);
```

### 4.3 `projects` 테이블

```sql
CREATE TABLE projects (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id        UUID NOT NULL REFERENCES brands(id),
    name            VARCHAR(255) NOT NULL,
    slug            VARCHAR(255) NOT NULL,
    description     TEXT,

    -- 프로젝트 기간
    start_date      DATE,
    end_date        DATE,

    -- 상태
    status          VARCHAR(20) DEFAULT 'active', -- 'active', 'completed', 'archived'

    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW(),

    UNIQUE(brand_id, slug)
);
```

### 4.4 `users` 테이블 (간소화)

```sql
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255) UNIQUE NOT NULL,
    name            VARCHAR(255),

    created_at      TIMESTAMP DEFAULT NOW()
);
```

### 4.5 텍스트 자산 전용 테이블 (선택적)

짧은 텍스트(SNS 캡션, 상품 설명)는 본문까지 DB 저장:

```sql
CREATE TABLE generated_texts (
    id              UUID PRIMARY KEY REFERENCES generated_assets(id),

    -- 텍스트 본문
    content         TEXT NOT NULL,              -- 실제 텍스트 내용
    content_length  INT,                        -- 글자 수

    -- 텍스트 타입
    text_type       VARCHAR(50),                -- 'caption', 'description', 'script', 'article'
    language        VARCHAR(10),                -- 'ko', 'en', 'ja', ...

    -- Full-text search
    content_tsv     tsvector GENERATED ALWAYS AS (to_tsvector('korean', content)) STORED
);

-- Full-text search 인덱스
CREATE INDEX idx_generated_texts_content_tsv
ON generated_texts USING GIN (content_tsv);
```

**사용 기준**:
- 텍스트 길이 < 10KB → `generated_texts`에 본문 저장
- 텍스트 길이 ≥ 10KB → MinIO에 `.txt` 파일로 저장, `generated_assets`에만 메타데이터

---

## 5. API 설계

### 5.1 자산 업로드

**엔드포인트**: `POST /api/v1/assets`

**요청** (multipart/form-data):
```json
{
  "file": <binary>,
  "brand_id": "uuid",
  "project_id": "uuid",           // optional
  "type": "image",                // auto-detect 가능
  "source": "comfyui",
  "source_metadata": {
    "workflow_id": "...",
    "prompt": "..."
  },
  "tags": ["winter", "campaign"],
  "metadata": { ... }             // 자유 형식
}
```

**응답**:
```json
{
  "asset_id": "9f2e4a1b-8c3d-4e5f-a6b7-1d2e3f4a5b6c",
  "presigned_url": "http://100.123.51.5:9000/dev-sparklio-assets/images/...?X-Amz-Expires=3600&...",
  "minio_path": "images/brand_abc/project_xyz/2025/11/15/9f2e4a1b....png",
  "file_size": 2048576,
  "mime_type": "image/png",
  "created_at": "2025-11-15T10:30:00Z"
}
```

**처리 흐름**:
1. 파일 수신 및 검증 (크기, MIME 타입)
2. `checksum` 계산 → 중복 확인
3. MinIO 경로 생성: `images/{brand_id}/{project_id}/{YYYY}/{MM}/{DD}/{uuid}.{ext}`
4. MinIO 업로드
5. PostgreSQL `generated_assets` INSERT
6. (선택) 임베딩 생성 (비동기)
7. Presigned URL 생성 (유효기간 1시간)
8. 응답 반환

### 5.2 자산 조회

**엔드포인트**: `GET /api/v1/assets/{asset_id}`

**응답**:
```json
{
  "asset_id": "uuid",
  "brand_id": "uuid",
  "project_id": "uuid",
  "type": "image",
  "original_name": "winter_campaign_hero.png",
  "file_size": 2048576,
  "mime_type": "image/png",
  "presigned_url": "http://...",   // 새로 생성
  "source": "comfyui",
  "tags": ["winter", "campaign"],
  "created_at": "2025-11-15T10:30:00Z"
}
```

### 5.3 자산 목록 조회

**엔드포인트**: `GET /api/v1/assets`

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

### 5.4 유사 자산 검색 (pgvector)

**엔드포인트**: `POST /api/v1/assets/search/similar`

**요청**:
```json
{
  "asset_id": "uuid",           // 기준 자산
  "limit": 10,
  "threshold": 0.8              // 유사도 임계값
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
      ...
    },
    ...
  ]
}
```

**SQL 예시**:
```sql
SELECT
    id,
    minio_path,
    1 - (embedding <=> (SELECT embedding FROM generated_assets WHERE id = $1)) AS similarity
FROM generated_assets
WHERE
    status = 'active'
    AND embedding IS NOT NULL
    AND 1 - (embedding <=> (SELECT embedding FROM generated_assets WHERE id = $1)) > $2
ORDER BY similarity DESC
LIMIT $3;
```

### 5.5 자산 삭제 (Soft Delete)

**엔드포인트**: `DELETE /api/v1/assets/{asset_id}`

**처리**:
- `status = 'deleted'` 업데이트
- `deleted_at = NOW()` 설정
- MinIO 파일은 유지 (30일 후 배치 삭제)

**Hard Delete**는 관리자 전용 API로 별도 구현.

---

## 6. ComfyUI 연동

### 6.1 연동 방식 선택

#### 방식 A: 폴더 Watcher (독립 프로세스)

**장점**: ComfyUI 수정 불필요
**단점**: 타이밍 이슈, 에러 추적 어려움

#### 방식 B: ComfyUI 워크플로우 내 HTTP 노드 ✅ 권장

**장점**:
- 워크플로우 완료 시점 정확히 알 수 있음
- 메타데이터(프롬프트, 파라미터) 즉시 전달 가능
- 에러 시 재시도 로직 명확

**단점**: ComfyUI 워크플로우 수정 필요

### 6.2 방식 B 구현 상세

#### ComfyUI 커스텀 노드 개발

**파일**: `custom_nodes/sparklio_uploader/`

```python
# custom_nodes/sparklio_uploader/nodes.py

import requests
import json
from pathlib import Path

class SparklioAssetUploader:
    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "images": ("IMAGE",),
                "brand_id": ("STRING", {"default": ""}),
                "project_id": ("STRING", {"default": ""}),
                "tags": ("STRING", {"default": ""}),
            },
        }

    RETURN_TYPES = ("STRING",)  # asset_id
    FUNCTION = "upload"
    CATEGORY = "Sparklio"

    def upload(self, images, brand_id, project_id, tags):
        # 이미지를 임시 파일로 저장
        temp_path = self._save_temp_image(images)

        # Sparklio Backend API 호출
        url = "http://100.123.51.5:8000/api/v1/assets"

        with open(temp_path, 'rb') as f:
            files = {'file': f}
            data = {
                'brand_id': brand_id,
                'project_id': project_id,
                'source': 'comfyui',
                'type': 'image',
                'tags': tags.split(','),
                'source_metadata': json.dumps({
                    'workflow': self._get_current_workflow()
                })
            }

            response = requests.post(url, files=files, data=data)
            response.raise_for_status()

            result = response.json()
            asset_id = result['asset_id']

            # 로컬 파일 삭제 (선택적)
            temp_path.unlink()

            return (asset_id,)

    def _save_temp_image(self, images):
        # ComfyUI 이미지 텐서 → PNG 파일
        ...

    def _get_current_workflow(self):
        # 현재 워크플로우 정보 추출
        ...

NODE_CLASS_MAPPINGS = {
    "SparklioAssetUploader": SparklioAssetUploader
}
```

#### ComfyUI 워크플로우 예시

```json
{
  "nodes": [
    {
      "id": 1,
      "type": "LoadImage",
      ...
    },
    {
      "id": 2,
      "type": "KSampler",
      ...
    },
    {
      "id": 3,
      "type": "SparklioAssetUploader",
      "inputs": {
        "images": ["2", 0],
        "brand_id": "brand_abc123",
        "project_id": "campaign_winter2025",
        "tags": "comfyui,generated,winter"
      }
    }
  ]
}
```

### 6.3 에러 처리 및 재시도

**Backend API가 실패할 경우**:

1. **로컬 백업**: `D:\AI\ComfyUI\ComfyUI\output\failed\` 폴더에 저장
2. **메타데이터 로그**: `failed_uploads.json`에 기록
3. **재시도 큐**: Backend API가 복구되면 자동 재업로드

**구현**:
```python
class SparklioAssetUploader:
    def upload(self, ...):
        try:
            # 업로드 시도
            ...
        except Exception as e:
            # 실패 시 로컬 저장
            failed_path = Path("output/failed") / f"{uuid.uuid4()}.png"
            shutil.copy(temp_path, failed_path)

            # 메타데이터 로그
            with open("failed_uploads.json", "a") as f:
                json.dump({
                    "file": str(failed_path),
                    "brand_id": brand_id,
                    "project_id": project_id,
                    "error": str(e),
                    "timestamp": datetime.now().isoformat()
                }, f)

            return (f"FAILED: {str(e)}",)
```

### 6.4 재시도 스크립트 (독립 프로세스)

**파일**: `D:\AI\ComfyUI\scripts\retry_failed_uploads.py`

```python
import json
import time
import requests
from pathlib import Path

RETRY_INTERVAL = 300  # 5분마다

def retry_failed_uploads():
    log_file = Path("ComfyUI/failed_uploads.json")

    if not log_file.exists():
        return

    with open(log_file, "r") as f:
        failed_uploads = [json.loads(line) for line in f]

    successful = []

    for upload in failed_uploads:
        try:
            with open(upload['file'], 'rb') as f:
                response = requests.post(
                    "http://100.123.51.5:8000/api/v1/assets",
                    files={'file': f},
                    data={
                        'brand_id': upload['brand_id'],
                        'project_id': upload['project_id'],
                        'source': 'comfyui',
                        'type': 'image'
                    }
                )
                response.raise_for_status()

                # 성공 시 로컬 파일 삭제
                Path(upload['file']).unlink()
                successful.append(upload)

        except Exception as e:
            print(f"Retry failed: {e}")

    # 성공한 항목 제거
    remaining = [u for u in failed_uploads if u not in successful]

    with open(log_file, "w") as f:
        for u in remaining:
            json.dump(u, f)
            f.write("\n")

if __name__ == "__main__":
    while True:
        retry_failed_uploads()
        time.sleep(RETRY_INTERVAL)
```

**실행** (Windows 시작 프로그램):
```powershell
cd D:\AI\ComfyUI
python scripts\retry_failed_uploads.py
```

---

## 7. 보안 및 접근 제어

### 7.1 Presigned URL 정책

**생성 조건**:
- 유효 사용자만 요청 가능 (JWT 인증)
- 브랜드/프로젝트 권한 확인

**URL 예시**:
```
http://100.123.51.5:9000/dev-sparklio-assets/images/brand_abc/project_xyz/2025/11/15/9f2e4a1b.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=...&X-Amz-Date=20251115T103000Z&X-Amz-Expires=3600&X-Amz-SignedHeaders=host&X-Amz-Signature=...
```

**유효기간**:
- 일반 조회: 1시간
- 다운로드 링크: 24시간
- 임베드(웹페이지): 7일

### 7.2 MinIO 버킷 정책

**비공개 원칙**:
- 모든 버킷은 기본적으로 **비공개**
- 접근은 **Presigned URL** 또는 **Backend API**를 통해서만

**MinIO 정책 예시**:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Deny",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::dev-sparklio-assets/*"
    }
  ]
}
```

### 7.3 백엔드 권한 검증

**API 요청 시 검증**:
1. JWT 토큰 확인 → `user_id` 추출
2. `brand_id`에 대한 접근 권한 확인 (`user_brand_permissions` 테이블)
3. 권한 있는 경우에만 Presigned URL 생성

**SQL 예시**:
```sql
-- 사용자 권한 확인
SELECT COUNT(*)
FROM user_brand_permissions
WHERE user_id = $1 AND brand_id = $2 AND permission IN ('read', 'write');
```

---

## 8. 환경별 구성

### 8.1 환경 정의

| 환경 | 용도 | MinIO 버킷 Prefix |
|------|------|-------------------|
| **dev** | 개발 및 테스트 | `dev-` |
| **stage** | 스테이징 (프로덕션 유사 환경) | `stage-` |
| **prod** | 프로덕션 | `prod-` |

### 8.2 환경별 설정 파일

**Backend `.env` 파일**:

```bash
# .env.dev
ENVIRONMENT=dev
MINIO_BUCKET_PREFIX=dev-
MINIO_ENDPOINT=100.123.51.5:9000
MINIO_ACCESS_KEY=sparklio
MINIO_SECRET_KEY=sparklio_minio_2025

# .env.prod
ENVIRONMENT=prod
MINIO_BUCKET_PREFIX=prod-
MINIO_ENDPOINT=minio.sparklio.com:9000
MINIO_ACCESS_KEY=***
MINIO_SECRET_KEY=***
```

### 8.3 버킷 초기화 스크립트

**파일**: `backend/scripts/init_minio_buckets.py`

```python
from minio import Minio
import os

def init_buckets():
    client = Minio(
        os.getenv("MINIO_ENDPOINT"),
        access_key=os.getenv("MINIO_ACCESS_KEY"),
        secret_key=os.getenv("MINIO_SECRET_KEY"),
        secure=False  # Tailscale 내부에서는 HTTP
    )

    prefix = os.getenv("MINIO_BUCKET_PREFIX", "dev-")

    buckets = [
        f"{prefix}sparklio-assets",
        f"{prefix}sparklio-temp",
        f"{prefix}sparklio-backups"
    ]

    for bucket in buckets:
        if not client.bucket_exists(bucket):
            client.make_bucket(bucket)
            print(f"Created bucket: {bucket}")

        # Lifecycle 정책 (temp 버킷만)
        if "temp" in bucket:
            # 7일 후 자동 삭제
            lifecycle = {
                "Rules": [
                    {
                        "Expiration": {"Days": 7},
                        "Status": "Enabled"
                    }
                ]
            }
            client.set_bucket_lifecycle(bucket, lifecycle)

if __name__ == "__main__":
    init_buckets()
```

---

## 9. 운영 정책

### 9.1 로컬 파일 정리 정책

**Desktop ComfyUI 출력 폴더**:
- MinIO 업로드 성공 후 3일간 로컬 보관
- 3일 후 자동 삭제 (디스크 공간 확보)

**구현**:
```python
# 크론잡 또는 스케줄러
def cleanup_old_outputs():
    cutoff_date = datetime.now() - timedelta(days=3)

    for file in Path("D:/AI/ComfyUI/ComfyUI/output").glob("*.png"):
        if file.stat().st_mtime < cutoff_date.timestamp():
            file.unlink()
```

### 9.2 MinIO Temp 버킷 정책

- **자동 삭제**: 7일 후 자동 삭제 (Lifecycle Policy)
- **용도**: 임시 업로드, 테스트 파일

### 9.3 Soft Delete 자산 정리

**30일 후 Hard Delete**:
```sql
-- 월 1회 실행
DELETE FROM generated_assets
WHERE status = 'deleted' AND deleted_at < NOW() - INTERVAL '30 days';
```

**MinIO 파일도 함께 삭제**:
```python
def cleanup_deleted_assets():
    # PostgreSQL에서 삭제 대상 조회
    deleted_assets = db.query(
        "SELECT minio_path FROM generated_assets WHERE status = 'deleted' AND deleted_at < NOW() - INTERVAL '30 days'"
    )

    # MinIO에서 파일 삭제
    for asset in deleted_assets:
        minio_client.remove_object(bucket, asset.minio_path)

    # DB에서도 삭제
    db.execute("DELETE FROM generated_assets WHERE ...")
```

### 9.4 백업 정책

**일일 백업**:
- PostgreSQL 덤프: 매일 02:00 (Mac mini cron)
- MinIO `sparklio-backups/` 버킷에 업로드

**주간 백업**:
- MinIO 전체 버킷 스냅샷 (mc mirror)

---

## 10. 구현 로드맵

### Phase 1: 기본 인프라 (1주)

- [x] MinIO 버킷 생성 (`dev-sparklio-assets`, `dev-sparklio-temp`, `dev-sparklio-backups`)
- [ ] PostgreSQL 스키마 생성 (`generated_assets`, `brands`, `projects`, `users`)
- [ ] pgvector 확장 활성화
- [ ] Backend API 기본 구조 (`/api/v1/assets` POST/GET)

### Phase 2: 업로드 및 조회 (1주)

- [ ] 파일 업로드 API 구현 (multipart/form-data)
- [ ] MinIO 경로 생성 로직 (`brand_id/project_id/YYYY/MM/DD/uuid.ext`)
- [ ] Presigned URL 생성
- [ ] 자산 목록 조회 API (필터링, 페이지네이션)

### Phase 3: ComfyUI 연동 (1주)

- [ ] ComfyUI 커스텀 노드 개발 (`SparklioAssetUploader`)
- [ ] 에러 처리 및 로컬 백업
- [ ] 재시도 스크립트 구현
- [ ] 워크플로우 테스트

### Phase 4: 고급 기능 (2주)

- [ ] pgvector 임베딩 생성 (CLIP/OpenAI)
- [ ] 유사 자산 검색 API
- [ ] 텍스트 자산 처리 (`generated_texts` 테이블)
- [ ] Full-text search

### Phase 5: 운영 및 모니터링 (1주)

- [ ] 로컬 파일 정리 스크립트
- [ ] Soft delete 자산 정리 (cron)
- [ ] 백업 자동화
- [ ] 디스크 사용량 모니터링 대시보드

---

## 부록 A: 파일 크기 및 용량 예상

### A.1 자산 타입별 평균 크기

| 타입 | 평균 크기 | 예시 |
|------|-----------|------|
| 이미지 (PNG) | 2-5 MB | ComfyUI 생성 이미지 |
| 이미지 (JPEG) | 500 KB - 2 MB | 최적화된 웹 이미지 |
| 비디오 (MP4, 1080p) | 50-200 MB | 30초 마케팅 영상 |
| 오디오 (MP3) | 3-10 MB | 1분 내레이션 |
| 텍스트 (TXT) | < 1 MB | LLM 생성 텍스트 |

### A.2 월간 생성량 예상 (브랜드 10개 기준)

| 타입 | 월 생성량 | 총 용량 |
|------|-----------|---------|
| 이미지 | 1,000개 | 3 GB |
| 비디오 | 100개 | 10 GB |
| 오디오 | 200개 | 1.5 GB |
| 텍스트 | 5,000개 | 100 MB |
| **합계** | | **~15 GB/월** |

**연간**: ~180 GB

**Mac mini 스토리지 권장**: 최소 500 GB (3년 운영 대비)

---

## 부록 B: 참고 자료

- [MinIO Python SDK 문서](https://min.io/docs/minio/linux/developers/python/minio-py.html)
- [pgvector 사용 가이드](https://github.com/pgvector/pgvector)
- [FastAPI 파일 업로드](https://fastapi.tiangolo.com/tutorial/request-files/)
- [ComfyUI 커스텀 노드 개발](https://github.com/comfyanonymous/ComfyUI/wiki/Custom-Nodes)

---

**문서 버전 이력**:
- v1.0 (2025-11-15): 초안 작성 (A Team)

**검토자**: -
**승인자**: -
**다음 검토일**: 2025-11-20
