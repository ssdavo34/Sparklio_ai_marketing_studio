# Sparklio AI Marketing Studio - Frontend Starter Code

**대상**: C팀 (Frontend 개발)
**작성일**: 2025-11-15
**버전**: 1.0

---

## 개요

이 스타터 코드는 C팀이 Next.js 14 (App Router) 기반 Frontend 개발을 즉시 시작할 수 있도록 준비된 프로젝트입니다.

**포함될 기능**:
- ✅ Next.js 14 App Router 구조
- ✅ TypeScript 설정
- ✅ Tailwind CSS 설정
- ✅ Backend API 클라이언트
- ✅ 환경 변수 관리
- ✅ 자산 업로드 예시 컴포넌트

---

## 설치 및 실행

### 1. Next.js 프로젝트 생성

```bash
# Laptop에서 실행
cd ~/sparklio_ai_marketing_studio
npx create-next-app@latest frontend --typescript --tailwind --app --use-npm

# 프롬프트 옵션:
# ✔ Would you like to use ESLint? … Yes
# ✔ Would you like to use `src/` directory? … No
# ✔ Would you like to use App Router? … Yes
# ✔ Would you like to customize the default import alias (@/*)? … No
```

### 2. 환경 변수 설정

```bash
cd ~/sparklio_ai_marketing_studio/frontend

# .env.local 파일 생성
cat > .env.local << 'EOF'
# Backend API
NEXT_PUBLIC_API_URL=http://100.123.51.5:8000

# Environment
NEXT_PUBLIC_APP_ENV=development

# Upload settings (for frontend display)
NEXT_PUBLIC_MAX_FILE_SIZE_MB=100
EOF
```

### 3. 필수 패키지 설치

```bash
# API 클라이언트
npm install axios

# UUID 생성
npm install uuid
npm install --save-dev @types/uuid

# 파일 업로드 (선택)
npm install react-dropzone

# 상태 관리 (선택)
npm install zustand
```

### 4. 개발 서버 시작

```bash
npm run dev

# 브라우저에서:
# http://localhost:3000
# 또는 Tailscale:
# http://100.101.68.23:3000
```

---

## 프로젝트 구조

```
frontend/
├── app/
│   ├── layout.tsx              # 루트 레이아웃
│   ├── page.tsx                # 홈페이지
│   ├── dashboard/
│   │   ├── page.tsx            # 대시보드 메인
│   │   └── assets/
│   │       ├── page.tsx        # 자산 목록
│   │       └── upload/
│   │           └── page.tsx    # 자산 업로드
│   └── api/                    # (선택) API 라우트 (프록시용)
│       └── proxy/
│           └── route.ts
├── components/
│   ├── AssetUpload.tsx         # 파일 업로드 컴포넌트
│   ├── AssetList.tsx           # 자산 목록 컴포넌트
│   └── AssetCard.tsx           # 자산 카드 컴포넌트
├── lib/
│   ├── api.ts                  # Backend API 클라이언트
│   └── types.ts                # TypeScript 타입 정의
├── public/
│   └── (이미지, 아이콘 등)
├── .env.local                  # 환경 변수 (Git에 커밋 안 됨)
├── next.config.js              # Next.js 설정
├── tailwind.config.ts          # Tailwind 설정
└── package.json
```

---

## 예시 코드

### 1. API 클라이언트 (lib/api.ts)

```typescript
import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://100.123.51.5:8000';

export const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 자산 업로드
export async function uploadAsset(formData: FormData) {
  const response = await axios.post(`${API_BASE}/api/v1/assets`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
}

// 자산 목록 조회
export async function listAssets(params: {
  brandId?: string;
  page?: number;
  pageSize?: number;
}) {
  const response = await api.get('/api/v1/assets', { params });
  return response.data;
}

// 자산 상세 조회
export async function getAsset(assetId: string) {
  const response = await api.get(`/api/v1/assets/${assetId}`);
  return response.data;
}

// 자산 삭제
export async function deleteAsset(assetId: string, hardDelete = false) {
  await api.delete(`/api/v1/assets/${assetId}`, {
    params: { hard_delete: hardDelete },
  });
}
```

### 2. 타입 정의 (lib/types.ts)

```typescript
export interface Asset {
  id: string;
  brand_id: string;
  project_id?: string;
  user_id: string;
  type: 'image' | 'video' | 'text';
  minio_path: string;
  original_name?: string;
  file_size: number;
  mime_type?: string;
  checksum?: string;
  source: 'comfyui' | 'ollama' | 'manual';
  status: 'active' | 'archived' | 'deleted';
  tags?: string[];
  created_at: string;
  updated_at: string;
  presigned_url?: string;
}

export interface AssetListResponse {
  total: number;
  page: number;
  page_size: number;
  assets: Asset[];
}
```

### 3. 파일 업로드 컴포넌트 (components/AssetUpload.tsx)

```typescript
'use client';

import { useState } from 'react';
import { uploadAsset } from '@/lib/api';
import { v4 as uuidv4 } from 'uuid';

export default function AssetUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('brand_id', '550e8400-e29b-41d4-a716-446655440000'); // TODO: 실제 브랜드 ID
    formData.append('user_id', uuidv4()); // TODO: 로그인한 사용자 ID
    formData.append('asset_type', 'image');
    formData.append('source', 'manual');
    formData.append('tags', 'test,upload');

    try {
      const result = await uploadAsset(formData);
      console.log('Upload successful:', result);
      alert('업로드 성공!');
      setFile(null);
    } catch (err) {
      console.error('Upload failed:', err);
      setError('업로드 실패: ' + (err as Error).message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-6 border rounded-lg">
      <h2 className="text-2xl font-bold mb-4">자산 업로드</h2>

      <input
        type="file"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        className="mb-4 block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer"
      />

      {file && (
        <div className="mb-4">
          <p className="text-sm text-gray-600">
            파일: {file.name} ({(file.size / 1024).toFixed(2)} KB)
          </p>
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 text-red-700 bg-red-100 rounded">
          {error}
        </div>
      )}

      <button
        onClick={handleUpload}
        disabled={!file || uploading}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
      >
        {uploading ? '업로드 중...' : '업로드'}
      </button>
    </div>
  );
}
```

### 4. 자산 목록 페이지 (app/dashboard/assets/page.tsx)

```typescript
'use client';

import { useEffect, useState } from 'react';
import { listAssets } from '@/lib/api';
import { AssetListResponse } from '@/lib/types';

export default function AssetsPage() {
  const [data, setData] = useState<AssetListResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAssets() {
      try {
        const result = await listAssets({ page: 1, pageSize: 20 });
        setData(result);
      } catch (err) {
        console.error('Failed to fetch assets:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchAssets();
  }, []);

  if (loading) return <div>로딩 중...</div>;
  if (!data) return <div>데이터를 불러올 수 없습니다.</div>;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">자산 목록</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {data.assets.map((asset) => (
          <div key={asset.id} className="border rounded-lg p-4">
            {asset.presigned_url && (
              <img
                src={asset.presigned_url}
                alt={asset.original_name || 'Asset'}
                className="w-full h-48 object-cover rounded mb-2"
              />
            )}
            <h3 className="font-semibold">{asset.original_name}</h3>
            <p className="text-sm text-gray-600">
              {(asset.file_size / 1024).toFixed(2)} KB
            </p>
            <div className="flex flex-wrap gap-1 mt-2">
              {asset.tags?.map((tag, i) => (
                <span key={i} className="text-xs bg-gray-200 px-2 py-1 rounded">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex justify-between items-center">
        <p className="text-sm text-gray-600">
          총 {data.total}개 자산 (페이지 {data.page})
        </p>
        {/* TODO: 페이지네이션 버튼 추가 */}
      </div>
    </div>
  );
}
```

---

## 다음 단계 (C팀 구현 과제)

### Phase 1: 기본 UI 구축 (1주차)

- [ ] 레이아웃 및 네비게이션
- [ ] 로그인/회원가입 페이지
- [ ] 대시보드 메인 페이지
- [ ] 자산 업로드 페이지 (완성도 높이기)
- [ ] 자산 목록 페이지 (필터링, 정렬)

### Phase 2: 상태 관리 및 인증 (2주차)

- [ ] Zustand 또는 Redux로 전역 상태 관리
- [ ] JWT 토큰 기반 인증 구현
- [ ] 보호된 라우트 (로그인 필요)
- [ ] 사용자 프로필 페이지

### Phase 3: 고급 기능 (3주차)

- [ ] 파일 드래그앤드롭 업로드 (react-dropzone)
- [ ] 자산 미리보기 모달
- [ ] 자산 편집 (메타데이터, 태그)
- [ ] 일괄 작업 (선택 삭제, 다운로드)

### Phase 4: AI 생성 통합 (4주차)

- [ ] AI 텍스트 생성 UI (Ollama 연동)
- [ ] AI 이미지 생성 UI (ComfyUI 연동)
- [ ] 생성 중 진행 상태 표시
- [ ] 생성 이력 관리

---

## 참고 문서

- **개발 워크플로우**: [docs/DEV_WORKFLOW.md](../docs/DEV_WORKFLOW.md)
- **포트 할당**: [docs/PORT_ALLOCATION.md](../docs/PORT_ALLOCATION.md)
- **Backend API 문서**: http://100.123.51.5:8000/docs

---

## 문제 해결

### 1. Backend API 연결 실패

```bash
# Backend 서버 실행 확인 (Mac mini)
ssh woosun@100.123.51.5 'lsof -i :8000'

# CORS 에러 시 Backend의 CORS 설정 확인
```

### 2. 환경 변수 로드 안 됨

```bash
# .env.local 파일 확인
cat .env.local

# Next.js는 NEXT_PUBLIC_ prefix 필요
NEXT_PUBLIC_API_URL=http://100.123.51.5:8000

# 서버 재시작
npm run dev
```

---

**작성자**: A Team Leader
**업데이트**: 2025-11-15
