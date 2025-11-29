# C팀 협조전: 3종 URL API 변경사항

**작성일**: 2025-11-30
**작성자**: B팀 (Backend)
**대상**: C팀 (Frontend)
**우선순위**: P0 (즉시 반영 필요)

---

## 1. 변경 요약

Asset API의 응답 구조가 변경되었습니다. 기존 `presigned_url` 하나로 반환하던 것을 **3종 URL**로 분리합니다.

| 필드 | 용도 | 해상도 | 사용처 |
|------|------|--------|--------|
| `original_url` | 원본 이미지 | 원본 크기 | 다운로드, 원본 보기, 편집 |
| `preview_url` | 프리뷰 | 긴 변 1080px | 캔버스, 상세뷰 |
| `thumb_url` | 썸네일 | 긴 변 200px | 목록, 그리드, 챗 |
| `presigned_url` | [legacy] | 원본 | **Deprecated** - original_url 사용 권장 |

---

## 2. 응답 구조 예시

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "brand_id": "...",
  "type": "image",
  "minio_path": "sparklio-images/brand123/...",
  "file_size": 245000,
  "status": "active",

  "original_url": "https://minio.../original_xxx.png?X-Amz-...",
  "preview_url": "https://minio.../preview_xxx.webp?X-Amz-...",
  "thumb_url": "https://minio.../thumb_xxx.webp?X-Amz-...",

  "presigned_url": "https://minio.../..."  // legacy, original_url과 동일
}
```

---

## 3. 프론트엔드 마이그레이션 가이드

### 3.1 AssetCard / AssetList (썸네일 표시)

```tsx
// Before
<img src={asset.presigned_url} />

// After
<img src={asset.thumb_url || asset.presigned_url} />
```

### 3.2 캔버스 / 상세뷰 (프리뷰 표시)

```tsx
// Before
<img src={asset.presigned_url} />

// After
<img src={asset.preview_url || asset.presigned_url} />
```

### 3.3 다운로드 / 원본 보기

```tsx
// Before
window.open(asset.presigned_url)

// After
window.open(asset.original_url || asset.presigned_url)
```

### 3.4 VisionGeneratorAgent 응답

```tsx
// Generated Image Response
interface GeneratedImage {
  image_id: string;
  prompt_text: string;

  // 신규 3종 URL (권장)
  asset_id?: string;        // DB 에셋 ID
  original_url?: string;    // 원본
  preview_url?: string;     // 프리뷰 (1080px)
  thumb_url?: string;       // 썸네일 (200px)

  // Legacy (Deprecated)
  image_url?: string;       // original_url 사용 권장
  image_base64?: string;    // 저장된 경우 null
}
```

---

## 4. Fallback 처리 권장

기존 데이터 호환을 위해 다음 순서로 fallback:

```tsx
// 썸네일
const thumbSrc = asset.thumb_url || asset.preview_url || asset.presigned_url;

// 프리뷰
const previewSrc = asset.preview_url || asset.original_url || asset.presigned_url;

// 원본
const originalSrc = asset.original_url || asset.presigned_url;
```

---

## 5. 영향받는 API 엔드포인트

| 엔드포인트 | 메서드 | 변경 내용 |
|-----------|--------|----------|
| `/api/v1/assets` | GET (list) | 3종 URL 포함 |
| `/api/v1/assets/{id}` | GET | 3종 URL 포함 |
| `/api/v1/assets` | POST | 3종 URL 포함 |
| `/api/v1/assets/{id}` | PATCH | 3종 URL 포함 |
| `/api/v1/agents/vision` | POST | GeneratedImage에 3종 URL |

---

## 6. 마이그레이션 일정

| 단계 | 내용 | 기간 |
|------|------|------|
| 1 | B팀 백엔드 배포 완료 | 완료 |
| 2 | C팀 프론트엔드 대응 | - |
| 3 | 통합 테스트 | - |
| 4 | `presigned_url` Deprecation 공지 | P2 |

---

## 7. 참고 문서

- [docs/STORAGE_SYSTEM_GAP_ANALYSIS_2025-11-30.md](./STORAGE_SYSTEM_GAP_ANALYSIS_2025-11-30.md)
- [app/services/asset_ingestion.py](../backend/app/services/asset_ingestion.py)
- [app/api/v1/endpoints/assets.py](../backend/app/api/v1/endpoints/assets.py)

---

## 8. 문의

질문이나 이슈가 있으면 B팀에 문의하세요.
