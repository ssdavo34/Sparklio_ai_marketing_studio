# 저장 시스템 설계서 vs 현재 구현 GAP 분석 검토서

**작성일**: 2025-11-30
**작성자**: B팀 (Backend)
**검토 대상**: `SPARKLIO 저장 시스템 설계서 v1.1` vs 현재 백엔드 구현

---

## 1. 검토 범위

| 영역 | 설계서 제안 | 현재 구현 파일 | 상태 |
|------|------------|----------------|------|
| MinIO Client | `minio_client.py` | `app/integrations/minio_client.py` | ✅ 존재 |
| Storage Service | `storage.py` | `app/services/storage.py` | ✅ 존재 |
| Asset Model | `GeneratedAsset` | `app/models/asset.py` | ✅ 존재 |
| Asset API | `/api/v1/assets` | `app/api/v1/endpoints/assets.py` | ✅ 존재 |
| Asset Schema | Pydantic | `app/schemas/asset.py` | ✅ 존재 |
| Media Gateway | 이미지 생성 | `app/services/media/gateway.py` | ✅ 존재 |
| VisionGenerator | Agent | `app/services/agents/vision_generator.py` | ✅ 존재 |

---

## 2. 항목별 상세 GAP 분석

### 2.1 GeneratedAsset 모델 (`app/models/asset.py`)

**현재 구현:**
```python
class GeneratedAsset(Base):
    __tablename__ = "generated_assets"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    brand_id = Column(UUID(as_uuid=True), nullable=False)
    project_id = Column(UUID(as_uuid=True), nullable=True)
    user_id = Column(UUID(as_uuid=True), nullable=False)
    type = Column(String(50), nullable=False)  # 'image', 'video', 'text'
    minio_path = Column(Text, nullable=False)
    original_name = Column(Text, nullable=True)
    file_size = Column(BigInteger, nullable=False)
    mime_type = Column(String(100), nullable=True)
    checksum = Column(Text, nullable=True)
    source = Column(String(50), nullable=False)  # 'comfyui', 'ollama', 'manual'
    source_metadata = Column(JSONB, nullable=True)
    status = Column(String(20), default='active')
    embedding = Column(Vector(1536), nullable=True)  # pgvector
    asset_metadata = Column(JSONB, nullable=True)
    tags = Column(ARRAY(Text), nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())
    deleted_at = Column(TIMESTAMP, nullable=True)
```

**GAP 분석:**

| 필드 | 설계서 제안 | 현재 구현 | GAP |
|------|------------|----------|-----|
| `id` | UUID | ✅ 있음 | - |
| `brand_id` | UUID (nullable) | `nullable=False` | 설계서는 nullable 권장, **기존 유지 권장** |
| `project_id` | UUID (nullable) | ✅ `nullable=True` | 일치 |
| `type` | image/video/text | ✅ `String(50)` | 일치 |
| `minio_path` | Text | ✅ 있음 | 일치 |
| `embedding` | Vector(1536) | ✅ 있음 | 일치 |
| **`original_url`** | Text | ❌ **없음** | 🔴 추가 필요 |
| **`preview_url`** | Text | ❌ **없음** | 🔴 추가 필요 |
| **`thumb_url`** | Text | ❌ **없음** | 🔴 추가 필요 |

**결론**: 3종 URL 컬럼 추가 필요 (Alembic 마이그레이션)

> **`minio_path` vs URL 3종 관계 명확화**:
> - `minio_path`는 그대로 유지 (실제 MinIO 오브젝트 키/경로)
> - `original_url` / `preview_url` / `thumb_url`은 **해당 minio_path를 기반으로 생성되는 접근용 URL**
> - Presigned URL은 이 경로들을 기반으로 매 요청 시 새로 생성
> - 기존 코드에서 `minio_path` 사용하는 부분은 그대로 유지 가능

---

### 2.2 MinIO Client (`app/integrations/minio_client.py`)

**현재 구현 주요 메서드:**
- `ensure_bucket()` - 버킷 생성/확인 ✅
- `upload_file()` - 파일 업로드 ✅
- `download_file()` - 파일 다운로드 ✅
- `get_presigned_url()` - 1시간 만료 URL 생성 ✅
- `delete_file()` - 파일 삭제 ✅
- `list_objects()` - 객체 목록 ✅

**GAP 분석:**

| 항목 | 설계서 제안 | 현재 구현 | GAP |
|------|------------|----------|-----|
| Bucket 이름 | `sparklio-assets` | ✅ 사용 중 | 일치 |
| Presigned URL 만료 | 1시간 | ✅ `timedelta(hours=1)` | 일치 |
| 업로드 기능 | 있음 | ✅ 있음 | 일치 |
| **리사이즈 기능** | 3종 생성 | ❌ **없음** | 🔴 추가 필요 |

**결론**: MinIO Client 자체는 충분, 리사이즈는 별도 서비스에서 처리

---

### 2.3 Storage Service (`app/services/storage.py`)

**현재 구현 주요 메서드:**
- `generate_object_path()` - 경로 생성 ✅
- `upload_file()` - MinIO 업로드 + checksum ✅
- `get_presigned_url()` - URL 생성 ✅
- `delete_file()` - 파일 삭제 ✅
- `upload_file_async()` / `download_file_async()` - 비동기 래퍼 ✅

**현재 경로 생성 규칙:**
```python
def generate_object_path(self, asset_type, brand_id, project_id, file_extension):
    # {asset_type}/{brand_id}/{project_id}/{YYYY}/{MM}/{DD}/{uuid}.ext
    path = f"{asset_type}/{brand_id}/{project_part}/{now.year:04d}/{now.month:02d}/{now.day:02d}/{uuid4()}.{file_extension}"
```

**GAP 분석:**

| 항목 | 설계서 제안 | 현재 구현 | GAP |
|------|------------|----------|-----|
| 경로 구조 | `{type}/{brand_id}/{project_id}/{YYYY}/{MM}/{DD}/{uuid}.ext` | ✅ 일치 | - |
| **3종 파일 생성** | `original_`, `preview_`, `thumb_` 접두어 | ❌ **없음** | 🔴 추가 필요 |
| **리사이즈 로직** | Pillow 사용 | ❌ **없음** | 🔴 추가 필요 |

**결론**: 경로 규칙은 유지, 3종 파일 생성 로직 추가 필요

---

### 2.4 VisionGeneratorAgent (`app/services/agents/vision_generator.py`)

**현재 출력 스키마:**
```python
class GeneratedImage(BaseModel):
    image_id: str                      # 임시 ID (DB 저장 X)
    prompt_text: str
    image_url: Optional[str] = None    # Provider가 URL 제공 시
    image_base64: Optional[str] = None # ⚠️ Base64 직접 반환!
    width: int = 1024
    height: int = 1024
    seed_used: Optional[int] = None
    generation_time: float = 0.0
    status: str = "completed"
    error: Optional[str] = None
```

**GAP 분석:**

| 항목 | 설계서 제안 | 현재 구현 | GAP |
|------|------------|----------|-----|
| 응답 형식 | `{ asset_id, original_url, preview_url, thumb_url }` | `image_base64`, `image_url` | 🔴 **Base64 반환 중** |
| DB 저장 | `generated_assets` row 생성 | ❌ **저장 안 함** | 🔴 추가 필요 |
| Asset Ingestion | Pipeline 호출 | ❌ **없음** | 🔴 추가 필요 |

**결론**: VisionGeneratorAgent → Asset Ingestion Pipeline → URL 3종 반환으로 변경 필요

> **`image_base64` 필드 Deprecation 정책**:
> - P0 구현 시점부터 `image_base64` 필드는 **더 이상 사용하지 않는 방향**
> - 호환성을 위해 필드 자체는 한동안 유지하되, 새로운 UI/기능에서는 `asset_id + thumb/preview/original_url`만 사용
> - 프론트엔드에서 Base64 사용하던 코드는 **모두 URL 3종 기반으로 치환 필요**

---

### 2.5 NanoBanana Provider (`app/services/media/providers/nanobanana_provider.py`)

**현재 이미지 반환 방식 (문제점):**
```python
# Line 141-159
# Base64로 인코딩하여 반환
if isinstance(img_bytes, bytes):
    img_data = base64.b64encode(img_bytes).decode('utf-8')
else:
    img_data = base64.b64encode(bytes(img_bytes)).decode('utf-8')

outputs.append(MediaProviderOutput(
    type="image",
    format=img_format,
    data=img_data,  # ⚠️ Base64 문자열 직접 반환!
    width=width,
    height=height
))
```

**GAP 분석:**

| 항목 | 설계서 제안 | 현재 구현 | GAP |
|------|------------|----------|-----|
| 이미지 생성 | Gemini 2.5 Flash | ✅ `gemini-2.5-flash-image` | 일치 |
| **응답 형식** | URL 기반 | ❌ **Base64 인코딩 반환** | 🔴 문제 |
| **MinIO 저장** | 자동 저장 | ❌ **저장 안 함** | 🔴 추가 필요 |

**결론**: Provider 레벨 또는 Agent 레벨에서 MinIO 저장 연동 필요

---

### 2.6 Asset API (`app/api/v1/endpoints/assets.py`)

**현재 응답 스키마 (`app/schemas/asset.py`):**
```python
class AssetResponse(AssetBase):
    id: UUID
    user_id: UUID
    minio_path: str
    file_size: int
    mime_type: Optional[str] = None
    checksum: Optional[str] = None
    status: str
    created_at: datetime
    updated_at: datetime
    presigned_url: Optional[str] = None  # 단일 URL만!
```

**GAP 분석:**

| 항목 | 설계서 제안 | 현재 구현 | GAP |
|------|------------|----------|-----|
| 파일 업로드 | `/api/v1/assets` POST | ✅ 구현됨 | 일치 |
| 목록 조회 | 필터 + 페이지네이션 | ✅ 구현됨 | 일치 |
| Presigned URL | 응답에 포함 | ✅ `presigned_url` | 일치 |
| **3종 URL 반환** | `original_url`, `preview_url`, `thumb_url` | ❌ **단일 URL만** | 🔴 추가 필요 |

**결론**: AssetResponse 스키마에 3종 URL 필드 추가 필요

---

### 2.7 project_outputs 테이블

| 항목 | 설계서 제안 | 현재 구현 | GAP |
|------|------------|----------|-----|
| 테이블 존재 | `project_outputs` | ❌ **없음** | P1에서 추가 |
| 용도 | 프레젠테이션/상세/SNS/비디오 결과물 통합 저장 | - | - |

**`type` 값 후보 (enum)**:

| type 값 | 설명 | 사용처 |
|---------|------|--------|
| `presentation` | 프레젠테이션 슬라이드 | ConceptBoard → PPT |
| `detail` | 상세페이지 레이아웃 | 제품 상세 |
| `sns` | SNS 카드/포스트 | 인스타, 페북 등 |
| `video_plan` | 영상 스크립트 초안 | Video Pipeline PLAN |
| `video_final` | 완성된 영상 메타 | Video Pipeline RENDER |
| `template` | 저장된 템플릿 | 재사용 템플릿 |

---

### 2.8 chat_messages 테이블

| 항목 | 설계서 제안 | 현재 구현 | GAP |
|------|------------|----------|-----|
| 테이블 존재 | `chat_messages` | ❌ **없음** (프론트 Zustand만) | P2 선택 사항 |

**P2인 이유**:
- 현재 챗 기록은 프론트 Zustand에만 존재 (새로고침 시 초기화)
- 서버 저장이 필요한 케이스:
  - Meeting AI 대화 복구
  - 사용자 행동 분석/통계
  - 디버깅/CS 대응
- 당장 필수 기능은 아니므로 P2로 분류

---

## 3. GAP 요약 테이블

| 우선순위 | 항목 | 설계서 | 현재 | 작업 내용 |
|----------|------|--------|------|----------|
| 🔴 **P0** | GeneratedAsset 컬럼 | 3종 URL | ❌ 없음 | Alembic 마이그레이션 |
| 🔴 **P0** | Asset Ingestion Pipeline | 신규 서비스 | ❌ 없음 | `app/services/asset_ingestion.py` 생성 |
| 🔴 **P0** | VisionGeneratorAgent 응답 | URL 3종 반환 | Base64 반환 | 코드 수정 |
| 🔴 **P0** | AssetResponse 스키마 | 3종 URL | 단일 URL | 스키마 수정 |
| 🟡 P1 | project_outputs 테이블 | 통합 산출물 저장 | ❌ 없음 | 테이블 설계/마이그레이션 |
| ⚪ P2 | chat_messages 테이블 | 서버 챗 로그 | ❌ 없음 | 선택 사항 |

---

## 4. 기존 구현 유지 항목 (변경 불필요)

| 항목 | 현재 상태 | 결정 |
|------|----------|------|
| MinIO 버킷 `sparklio-assets` | ✅ 정상 | 유지 |
| 경로 규칙 `{type}/{brand_id}/...` | ✅ 정상 | 유지 |
| `generated_assets` 테이블 기본 구조 | ✅ 정상 | 컬럼만 추가 |
| `embedding` 컬럼 (pgvector) | ✅ 정상 | 유지 |
| Presigned URL 1시간 만료 | ✅ 정상 | 유지 |
| Asset CRUD API 기본 동작 | ✅ 정상 | 응답만 수정 |
| `brand_id` NOT NULL | ✅ 현재 구현 | 유지 (설계서와 다름) |

---

## 5. 설계서 수정 제안

| 설계서 항목 | 현재 설계서 | 수정 제안 | 이유 |
|------------|------------|----------|------|
| `brand_id` | nullable 권장 | **NOT NULL 유지** | 기존 구현 및 데이터 무결성 |
| `media_assets` 별도 테이블 | 생성 제안 | **생성 안 함** | `generated_assets` 확장으로 충분 |
| 임베딩 테이블 분리 | 언급 없음 | **분리 안 함** | 현재 `embedding` 컬럼 유지 |

---

## 6. P0 구현 계획 (승인 시)

### 6.1 작업 순서

```
1. [Alembic] GeneratedAsset 컬럼 추가
   ├── original_url TEXT
   ├── preview_url TEXT
   └── thumb_url TEXT

2. [Schema] AssetResponse 수정
   ├── original_url: Optional[str]
   ├── preview_url: Optional[str]
   └── thumb_url: Optional[str]

3. [Service] Asset Ingestion Pipeline 생성
   ├── app/services/asset_ingestion.py
   ├── ingest_image_from_base64()
   ├── ingest_image_from_url()
   └── _resize_and_upload() (Pillow)

4. [Agent] VisionGeneratorAgent 수정
   ├── MediaGateway 응답 받기
   ├── Asset Ingestion Pipeline 호출
   └── URL 3종 반환 (Base64 제거)

5. [API] Asset API 응답 수정
   └── 3종 URL presigned 생성
```

### 6.2 기존 데이터 마이그레이션 정책

> **기존 `generated_assets` row에 대한 처리 방침**

| 컬럼 | P0 단계 | 후속 작업 |
|------|---------|----------|
| `original_url` | 기존 `minio_path` 기준으로 역산하여 채움 | - |
| `preview_url` | **NULL 허용** (신규 에셋부터 채움) | P1에서 일괄 리사이즈 마이그레이션 검토 |
| `thumb_url` | **NULL 허용** (신규 에셋부터 채움) | P1에서 일괄 리사이즈 마이그레이션 검토 |

- P0에서는 **신규 생성 에셋**만 3종 URL을 채움
- 과거 에셋에 대한 일괄 리사이즈는 P1 이후 별도 마이그레이션으로 검토
- 프론트는 `preview_url`/`thumb_url`이 NULL이면 `original_url` 또는 presigned URL fallback

### 6.3 Asset Ingestion Pipeline 에러 처리 정책

> **트랜잭션 및 에러 복구 방침**

```
Ingestion Pipeline 기본 정책:
├── MinIO 업로드 + DB insert가 둘 다 성공해야 최종 성공
├── original 업로드 실패 → 전체 실패 (롤백)
├── preview/thumb 생성 실패 시:
│   ├── P0 단계: original만 있는 에셋도 허용 (partial success)
│   ├── 에러는 Sentry/로그에 남겨서 모니터링
│   └── preview_url, thumb_url은 NULL로 저장
└── 추후 P1에서 비동기 리사이즈 워커로 분리 검토
```

- **고아 객체 방지**: DB insert 실패 시 MinIO 업로드 롤백 (삭제)
- **Half-broken 에셋 허용**: original만 있어도 사용 가능 (preview/thumb는 선택)

### 6.4 예상 파일 변경

| 파일 | 변경 내용 |
|------|----------|
| `backend/alembic/versions/xxxx_add_asset_url_columns.py` | 신규 마이그레이션 |
| `backend/app/models/asset.py` | 3종 URL 컬럼 추가 |
| `backend/app/schemas/asset.py` | 3종 URL 필드 추가 |
| `backend/app/services/asset_ingestion.py` | **신규 생성** |
| `backend/app/services/agents/vision_generator.py` | 응답 구조 변경 |
| `backend/app/api/v1/endpoints/assets.py` | 응답 생성 로직 수정 |

### 6.5 리사이즈 규격 (설계서 기준)

| 종류 | 크기 | 포맷 | 용도 |
|------|------|------|------|
| `original` | 원본 그대로 | PNG | 다운로드, 원본 보기 |
| `preview` | 긴 변 1080px | WEBP | 캔버스, 상세뷰, 편집 |
| `thumb` | 긴 변 200px | WEBP | 목록, 챗 썸네일, 그리드 |

---

## 7. 검토 요청 사항

### 7.1 확인 필요

- [ ] P0 작업 순서 동의 여부
- [ ] 리사이즈 규격 (1080px / 200px) 적절 여부
- [ ] `brand_id` NOT NULL 유지 동의 여부
- [ ] `media_assets` 별도 테이블 생성 안 함 동의 여부

### 7.2 결정 필요

- [ ] P1 `project_outputs` 테이블 구현 시점
- [ ] P2 `chat_messages` 도입 여부

---

## 8. 결론

**설계서 방향은 적절하며**, 현재 구현과의 GAP을 채우는 P0 작업이 필요합니다.

**핵심 변경점:**
1. DB 컬럼 3개 추가 (`original_url`, `preview_url`, `thumb_url`)
2. Asset Ingestion Pipeline 신규 서비스 생성
3. VisionGeneratorAgent Base64 반환 → URL 3종 반환으로 변경

**유지 사항:**
- `generated_assets` 테이블 (별도 `media_assets` 불필요)
- MinIO 버킷/경로 구조
- `embedding` 컬럼 통합 유지
- `brand_id` NOT NULL

---

**검토 완료 후 승인해 주시면 구현을 시작하겠습니다.**

---

마지막 업데이트: 2025-11-30 by B팀

---

## Appendix: 피드백 반영 이력

| 피드백 | 반영 위치 | 내용 |
|--------|----------|------|
| minio_path vs URL 3종 관계 | 2.1 결론 하단 | 역할 구분 명확화 |
| 기존 데이터 마이그레이션 | 6.2 신규 섹션 | NULL 허용 정책, P1 일괄 처리 |
| Asset Ingestion 에러 처리 | 6.3 신규 섹션 | 트랜잭션, partial success 정책 |
| image_base64 Deprecation | 2.4 결론 하단 | 호환성 유지 + 사용 중단 방향 |
| project_outputs type enum | 2.7 테이블 추가 | 6종 type 값 후보 |
| chat_messages P2 이유 | 2.8 설명 추가 | 사용 케이스 명시 |
