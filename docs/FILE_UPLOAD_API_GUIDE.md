# File Upload API 연동 가이드

**작성일**: 2025-11-28
**작성자**: B팀 (Backend)
**대상**: C팀 (Frontend) - UploadTab.tsx 구현

---

## 1. API 엔드포인트

### 1.1 파일 업로드 (Multipart Form)

```
POST /api/v1/assets/
Content-Type: multipart/form-data
```

**요청 파라미터**:

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `file` | File | ✅ | 업로드할 파일 |
| `brand_id` | UUID | ✅ | 브랜드 ID |
| `user_id` | UUID | ✅ | 사용자 ID |
| `asset_type` | string | ✅ | `image`, `video`, `text` |
| `project_id` | UUID | ❌ | 프로젝트 ID (선택) |
| `source` | string | ❌ | 출처 (기본: `manual`) |
| `tags` | string | ❌ | 쉼표 구분 태그 (예: `product,banner`) |

**응답**:
```json
{
  "id": "uuid-string",
  "brand_id": "uuid-string",
  "project_id": null,
  "user_id": "uuid-string",
  "type": "image",
  "minio_path": "sparklio-assets/images/brand-id/filename.png",
  "original_name": "my-image.png",
  "file_size": 123456,
  "mime_type": "image/png",
  "checksum": "sha256-hash",
  "source": "manual",
  "tags": ["product", "banner"],
  "status": "active",
  "presigned_url": "https://100.123.51.5:9000/sparklio-assets/...",
  "created_at": "2025-11-28T12:00:00Z",
  "updated_at": "2025-11-28T12:00:00Z"
}
```

---

## 2. 프론트엔드 구현 예시

### 2.1 React (TypeScript)

```typescript
// lib/api/upload-api.ts

interface UploadAssetParams {
  file: File;
  brandId: string;
  userId: string;
  assetType: 'image' | 'video' | 'text';
  projectId?: string;
  source?: string;
  tags?: string[];
}

interface UploadAssetResponse {
  id: string;
  brand_id: string;
  project_id: string | null;
  user_id: string;
  type: string;
  minio_path: string;
  original_name: string;
  file_size: number;
  mime_type: string;
  checksum: string;
  source: string;
  tags: string[] | null;
  status: string;
  presigned_url: string;
  created_at: string;
  updated_at: string;
}

export async function uploadAsset(params: UploadAssetParams): Promise<UploadAssetResponse> {
  const formData = new FormData();

  formData.append('file', params.file);
  formData.append('brand_id', params.brandId);
  formData.append('user_id', params.userId);
  formData.append('asset_type', params.assetType);

  if (params.projectId) {
    formData.append('project_id', params.projectId);
  }

  if (params.source) {
    formData.append('source', params.source);
  }

  if (params.tags && params.tags.length > 0) {
    formData.append('tags', params.tags.join(','));
  }

  const response = await fetch('/api/v1/assets/', {
    method: 'POST',
    body: formData,
    // Content-Type은 자동으로 multipart/form-data로 설정됨
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Upload failed');
  }

  return response.json();
}
```

### 2.2 UploadTab.tsx 예시

```typescript
// components/canvas-studio/panels/left/tabs/UploadTab.tsx

import { useState, useCallback } from 'react';
import { uploadAsset } from '@/lib/api/upload-api';

interface UploadTabProps {
  brandId: string;
  userId: string;
  onUploadComplete?: (asset: UploadAssetResponse) => void;
}

export function UploadTab({ brandId, userId, onUploadComplete }: UploadTabProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setError(null);

    try {
      for (const file of Array.from(files)) {
        // 파일 타입 결정
        const assetType = file.type.startsWith('image/') ? 'image'
                        : file.type.startsWith('video/') ? 'video'
                        : 'text';

        const result = await uploadAsset({
          file,
          brandId,
          userId,
          assetType,
          source: 'canvas-upload',
          tags: ['user-upload']
        });

        onUploadComplete?.(result);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  }, [brandId, userId, onUploadComplete]);

  return (
    <div className="upload-tab">
      <input
        type="file"
        accept="image/*,video/*"
        multiple
        onChange={(e) => handleFileSelect(e.target.files)}
        disabled={isUploading}
      />

      {isUploading && <div>Uploading...</div>}
      {error && <div className="error">{error}</div>}
    </div>
  );
}
```

### 2.3 Polotno Canvas에 이미지 추가

```typescript
// 업로드 완료 후 Canvas에 이미지 추가
const handleUploadComplete = (asset: UploadAssetResponse) => {
  // presigned_url을 사용하여 Canvas에 이미지 추가
  store.activePage?.addElement({
    type: 'image',
    src: asset.presigned_url,
    x: 100,
    y: 100,
    width: 400,
    height: 300,
  });
};
```

---

## 3. 제한사항

| 항목 | 값 |
|------|-----|
| 최대 파일 크기 | 100MB |
| 허용 파일 타입 | `image/jpeg`, `image/png`, `image/webp`, `video/mp4`, `text/plain` |
| Presigned URL 유효시간 | 1시간 (3600초) |

---

## 4. 에러 처리

| HTTP 코드 | 에러 | 설명 |
|-----------|------|------|
| 413 | Request Entity Too Large | 파일 크기 100MB 초과 |
| 400 | Bad Request | 필수 파라미터 누락 |
| 500 | Internal Server Error | 서버 오류 |

---

## 5. 테스트

### cURL 테스트

```bash
# 이미지 업로드 테스트
curl -X POST http://100.123.51.5:8000/api/v1/assets/ \
  -F 'file=@/path/to/image.png' \
  -F 'brand_id=550e8400-e29b-41d4-a716-446655440000' \
  -F 'user_id=550e8400-e29b-41d4-a716-446655440001' \
  -F 'asset_type=image' \
  -F 'source=test' \
  -F 'tags=test,upload'
```

### 업로드된 에셋 조회

```bash
# 브랜드별 에셋 목록
curl "http://100.123.51.5:8000/api/v1/assets/?brand_id=uuid-here"

# 특정 에셋 조회
curl "http://100.123.51.5:8000/api/v1/assets/{asset_id}"
```

---

## 6. 참고사항

1. **Presigned URL**: 응답의 `presigned_url`은 1시간 후 만료됩니다. Canvas에서 이미지를 저장할 때는 `minio_path`를 저장하고, 표시할 때 새 presigned URL을 요청하세요.

2. **CORS**: 백엔드에서 CORS 설정이 되어 있어 프론트엔드에서 직접 호출 가능합니다.

3. **파일 이름**: 서버에서 UUID 기반으로 파일명을 생성하며, 원본 파일명은 `original_name`에 저장됩니다.

---

**문의**: B팀 문서에 댓글 또는 새 문서 작성
