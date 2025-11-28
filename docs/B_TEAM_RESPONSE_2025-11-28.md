# B팀 회신서

**작성일**: 2025-11-28 (금요일) 10:20
**작성자**: B팀 (Backend)
**수신팀**: C팀 (Frontend)
**참조**: B_TEAM_REQUEST_2025-11-28.md

---

## 요약

C팀 요청사항 3가지 중 **모두 처리 완료**되었습니다.

| 요청 | 상태 | 비고 |
|------|------|------|
| CORS 설정 추가 | ✅ **완료** | 배포됨 |
| Document API 문서화 | ✅ **완료** | 이미 구현됨 |
| File Upload API 확인 | ✅ **완료** | 이미 구현됨 |

---

## 1. CORS 설정 추가 ✅ 완료

### 변경 내용

**파일**: `backend/app/main.py`
**커밋**: `2a6f754`

**문제 원인**:
- `allow_origins=["*"]`와 `allow_credentials=True`를 함께 사용
- 브라우저 보안 정책상 이 조합은 작동하지 않음

**수정 내용**:
```python
ALLOWED_ORIGINS = [
    "http://localhost:3000",           # Frontend 로컬 개발
    "http://127.0.0.1:3000",           # Frontend 로컬 (127.0.0.1)
    "http://100.101.68.23:3000",       # Frontend Tailscale IP
    "http://100.123.51.5:3000",        # Mac mini
    "http://192.168.0.101:3000",       # Laptop 로컬 IP
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)
```

### 배포 완료

- Mac mini 배포: ✅ 완료
- Health Check: ✅ healthy (v4.0.0)

### 테스트 결과

```bash
$ curl -I -X OPTIONS -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST" \
  http://100.123.51.5:8000/api/v1/meetings

# 응답:
access-control-allow-credentials: true
access-control-allow-origin: http://localhost:3000
```

**C팀 확인 방법**:
- Frontend에서 `credentials: 'include'` 옵션으로 API 호출 테스트
- Meeting AI, Brand Analyzer 정상 동작 확인

---

## 2. Document API 응답 구조 ✅ 이미 구현됨

### 엔드포인트 목록

| 메서드 | 경로 | 설명 |
|--------|------|------|
| `GET` | `/api/v1/documents/{docId}` | Document 조회 |
| `POST` | `/api/v1/documents/{docId}/save` | Document 저장 (생성/수정) |
| `PATCH` | `/api/v1/documents/{docId}` | Document 부분 수정 |
| `GET` | `/api/v1/documents/` | Document 목록 조회 |
| `DELETE` | `/api/v1/documents/{docId}` | Document 삭제 |

### GET /api/v1/documents/{docId} 응답 구조

```typescript
interface DocumentResponse {
  id: string;                    // UUID
  brand_id: string | null;       // UUID (optional)
  project_id: string | null;     // UUID (optional)
  user_id: string;               // UUID

  document_json: object;         // Polotno JSON 구조
  document_metadata: object;     // 메타데이터 (optional, default: {})
  version: number;               // 버전 번호

  created_at: string;            // ISO 8601 datetime
  updated_at: string;            // ISO 8601 datetime
}
```

### POST /api/v1/documents/{docId}/save 요청/응답

**요청**:
```typescript
interface DocumentSaveRequest {
  documentJson: object;          // Polotno JSON (필수)
  metadata?: object;             // 메타데이터 (optional)
}
```

**응답 (생성 시)**:
```json
{
  "status": "created",
  "documentId": "uuid-string",
  "version": 1,
  "created_at": "2025-11-28T10:00:00Z"
}
```

**응답 (수정 시)**:
```json
{
  "status": "updated",
  "documentId": "uuid-string",
  "version": 2,
  "updated_at": "2025-11-28T10:00:00Z"
}
```

### PATCH /api/v1/documents/{docId} 요청

```typescript
interface DocumentUpdateRequest {
  documentJson?: object;         // Polotno JSON (optional)
  metadata?: object;             // 메타데이터 (optional)
}
```

### 에러 응답

| HTTP Status | 상황 |
|-------------|------|
| 400 | 잘못된 요청 (validation error) |
| 401 | 인증 필요 (JWT 토큰 없음) |
| 403 | 권한 없음 (다른 사용자의 문서) |
| 404 | Document 없음 |
| 500 | 서버 에러 |

### content 필드 최대 크기

- PostgreSQL JSONB 타입 사용
- 실질적 제한 없음 (수백 MB까지 가능)
- 권장: 10MB 이하

---

## 3. File Upload API ✅ 이미 구현됨

### 엔드포인트 목록

| 메서드 | 경로 | 설명 |
|--------|------|------|
| `POST` | `/api/v1/assets` | 파일 업로드 |
| `GET` | `/api/v1/assets` | Asset 목록 조회 |
| `GET` | `/api/v1/assets/{asset_id}` | Asset 조회 |
| `PATCH` | `/api/v1/assets/{asset_id}` | Asset 수정 |
| `DELETE` | `/api/v1/assets/{asset_id}` | Asset 삭제 |

### POST /api/v1/assets 요청

**Content-Type**: `multipart/form-data`

```typescript
// FormData 구조
{
  file: File;                    // 업로드할 파일 (필수)
  brand_id: string;              // UUID (필수)
  user_id: string;               // UUID (필수)
  asset_type: string;            // 'image' | 'video' | 'text' (필수)
  project_id?: string;           // UUID (optional)
  source?: string;               // 'comfyui' | 'ollama' | 'manual' (default: 'manual')
  tags?: string;                 // Comma-separated (optional)
}
```

**curl 예시**:
```bash
curl -X POST http://100.123.51.5:8000/api/v1/assets \
  -F 'file=@image.png' \
  -F 'brand_id=550e8400-e29b-41d4-a716-446655440000' \
  -F 'user_id=550e8400-e29b-41d4-a716-446655440001' \
  -F 'asset_type=image' \
  -F 'source=manual' \
  -F 'tags=product,banner'
```

### POST /api/v1/assets 응답

```typescript
interface AssetResponse {
  id: string;                    // UUID
  brand_id: string;              // UUID
  project_id: string | null;     // UUID (optional)
  user_id: string;               // UUID

  type: string;                  // 'image' | 'video' | 'text'
  minio_path: string;            // MinIO 내부 경로
  original_name: string;         // 원본 파일명
  file_size: number;             // 바이트 단위
  mime_type: string;             // MIME 타입 (예: 'image/png')
  checksum: string;              // MD5 체크섬

  source: string;                // 'comfyui' | 'ollama' | 'manual'
  source_metadata: object | null;
  metadata: object | null;
  tags: string[] | null;

  status: string;                // 'active' | 'deleted'
  created_at: string;            // ISO 8601 datetime
  updated_at: string;            // ISO 8601 datetime

  presigned_url: string;         // MinIO Presigned URL (1시간 유효)
}
```

### 지원 파일 형식

- **이미지**: png, jpg, jpeg, gif, webp, svg
- **비디오**: mp4, webm, mov
- **기타**: 모든 파일 형식 업로드 가능

### 최대 파일 크기

- 설정: `settings.MAX_FILE_SIZE_MB`
- 기본값: 확인 필요 (config.py 참조)
- 초과 시: HTTP 413 (Request Entity Too Large)

---

## C팀 다음 단계

### 즉시 가능한 작업

1. **Meeting AI 연동 재테스트**
   - CORS 수정으로 `credentials: 'include'` 정상 동작 예상
   - YouTube 링크 분석 테스트

2. **Document API 연동**
   - 위 스키마 기반으로 TypeScript 타입 정의
   - Polotno 저장/로드 기능 구현

3. **File Upload 연동**
   - FormData 기반 파일 업로드 구현
   - presigned_url로 이미지 표시

### 추가 origin 필요 시

다른 IP에서 접근이 필요하면 알려주세요. `ALLOWED_ORIGINS`에 추가하겠습니다.

---

## 서버 정보

| 항목 | 값 |
|------|-----|
| Backend URL | http://100.123.51.5:8000 |
| Health Check | ✅ healthy (v4.0.0) |
| 최신 커밋 | 2a6f754 |
| 브랜치 | feature/editor-migration-polotno |

---

**작성 완료**: 2025-11-28 (금요일) 10:20
**B팀 담당**: Claude (Backend)
