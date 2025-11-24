# Brand OS API Integration Guide

**작성일**: 2025-11-24
**작성자**: B팀 (Backend)
**대상**: A팀 (Frontend)
**참조**: SPARKLIO_MVP_MASTER_TRACKER.md - P0-1 Brand OS Module

---

## 📋 개요

Brand OS Module의 Backend API 구현이 완료되었습니다. 이 문서는 Frontend 통합을 위한 API 명세 및 사용 가이드입니다.

**구현 완료 항목 (2025-11-24):**
- ✅ DB Schema 설계 (brands, brand_documents 테이블)
- ✅ Alembic Migration 작성
- ✅ Brand Intake API 구현 (문서 업로드, URL 크롤링, 목록 조회, 삭제)
- ✅ BrandAnalyzerAgent 구현 (Brand DNA 자동 생성)

---

## 🗂 DB Schema

### Brand 모델
```python
class Brand(Base):
    id: UUID
    owner_id: UUID
    name: str
    slug: str
    description: str (optional)
    logo_url: str (optional)
    website_url: str (optional)
    industry: str (optional)
    tags: List[str] (optional)

    # Brand Kit (JSONB)
    brand_kit: {
        "logo_url": "https://...",
        "colors": {
            "primary": ["#FF5733", "#C70039"],
            "secondary": ["#33FF57", "#28B463"],
            "accent": ["#3357FF"]
        },
        "fonts": {
            "primary": "Montserrat",
            "secondary": "Open Sans",
            "weights": ["400", "600", "700"]
        },
        "tone_keywords": ["professional", "friendly", "innovative"],
        "forbidden_expressions": ["cheap", "discount", "free"],
        "key_messages": [
            "Innovation at its finest",
            "Quality you can trust"
        ],
        "target_audience": "2030 tech professionals",
        "brand_values": ["innovation", "transparency", "sustainability"]
    }

    # Brand DNA Card (BrandAnalyzerAgent 출력, JSONB)
    brand_dna: {
        "tone": "professional yet approachable",
        "key_messages": ["message1", "message2", "message3"],
        "target_audience": "detailed persona",
        "dos": ["Do this", "Do that"],
        "donts": ["Don't do this", "Avoid that"],
        "sample_copies": ["example1", "example2"],
        "analyzed_at": "2025-11-24T14:30:00Z",
        "analyzer_version": "v1.0"
    }

    created_at: datetime
    updated_at: datetime
    deleted_at: datetime (optional, soft delete)
```

### BrandDocument 모델
```python
class BrandDocument(Base):
    id: UUID
    brand_id: UUID (FK to brands.id, CASCADE delete)
    title: str (optional)
    document_type: Enum["pdf", "image", "text", "url", "brochure"]

    # 파일 정보
    file_url: str (optional) # S3/로컬 파일 경로
    source_url: str (optional) # 크롤링한 URL
    extracted_text: str (optional) # 추출된 텍스트

    # 메타데이터
    file_size: int (optional)
    mime_type: str (optional)
    processed: str = "pending" # "pending", "processing", "completed", "failed"
    document_metadata: JSONB (optional)

    created_at: datetime
    updated_at: datetime
```

---

## 🔌 API Endpoints

### 1. Brand CRUD (기존)

#### `POST /api/v1/brands`
브랜드 생성

**Request:**
```json
{
  "name": "TechCorp",
  "slug": "techcorp",
  "description": "혁신적인 IT 솔루션 기업",
  "logo_url": "https://...",
  "website_url": "https://techcorp.com",
  "industry": "IT",
  "tags": ["tech", "innovation"],
  "brand_kit": {
    "colors": {
      "primary": ["#FF5733"]
    }
  }
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "owner_id": "uuid",
  "name": "TechCorp",
  "slug": "techcorp",
  ...
  "created_at": "2025-11-24T14:30:00Z",
  "updated_at": "2025-11-24T14:30:00Z"
}
```

---

#### `GET /api/v1/brands`
브랜드 목록 조회

**Query Params:**
- `skip`: int (default: 0)
- `limit`: int (default: 100)

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "name": "TechCorp",
    ...
  }
]
```

---

#### `GET /api/v1/brands/{brand_id}`
브랜드 상세 조회

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "name": "TechCorp",
  "brand_kit": {...},
  "brand_dna": {...},
  ...
}
```

---

#### `PATCH /api/v1/brands/{brand_id}`
브랜드 수정

**Request:**
```json
{
  "name": "TechCorp Updated",
  "brand_kit": {...},
  "brand_dna": {...}
}
```

**Response:** `200 OK`

---

#### `DELETE /api/v1/brands/{brand_id}`
브랜드 삭제 (Soft Delete)

**Query Params:**
- `hard_delete`: bool (default: false)

**Response:** `204 No Content`

---

### 2. Brand Document APIs (MVP P0-1 신규)

#### `POST /api/v1/brands/{brand_id}/documents`
브랜드 문서 업로드

**Request:** `multipart/form-data`
- `file`: File (required)
- `title`: string (optional)
- `document_type`: string (required) - "pdf", "image", "brochure"

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "brand_id": "uuid",
  "title": "브랜드 가이드라인.pdf",
  "document_type": "pdf",
  "file_url": "/tmp/brand_id/브랜드 가이드라인.pdf",
  "file_size": 1024000,
  "mime_type": "application/pdf",
  "processed": "pending",
  "document_metadata": {
    "original_filename": "브랜드 가이드라인.pdf",
    "upload_user_id": "uuid"
  },
  "created_at": "2025-11-24T14:30:00Z",
  "updated_at": "2025-11-24T14:30:00Z"
}
```

**파일 타입 검증:**
- `pdf`: `["application/pdf"]`
- `image`: `["image/jpeg", "image/png", "image/gif", "image/webp"]`
- `brochure`: `["application/pdf", "image/jpeg", "image/png"]`

---

#### `POST /api/v1/brands/{brand_id}/documents/crawl`
브랜드 URL 크롤링

**Request:**
```json
{
  "url": "https://techcorp.com/about",
  "title": "TechCorp About Page" // optional
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "brand_id": "uuid",
  "title": "Crawled from https://techcorp.com/about",
  "document_type": "url",
  "source_url": "https://techcorp.com/about",
  "processed": "pending",
  "document_metadata": {
    "crawl_user_id": "uuid",
    "crawl_requested_at": "2025-11-24T14:30:00Z"
  },
  "created_at": "2025-11-24T14:30:00Z",
  "updated_at": "2025-11-24T14:30:00Z"
}
```

**NOTE:**
- 현재 크롤링은 비동기 작업으로 처리됩니다 (백그라운드 태스크)
- `processed` 상태를 polling하여 완료 여부를 확인하세요
- TODO: 실제 크롤링 로직 구현 필요 (BeautifulSoup/Playwright)

---

#### `GET /api/v1/brands/{brand_id}/documents`
브랜드 문서 목록 조회

**Query Params:**
- `skip`: int (default: 0)
- `limit`: int (default: 100)

**Response:** `200 OK`
```json
{
  "documents": [
    {
      "id": "uuid",
      "brand_id": "uuid",
      "title": "브랜드 가이드라인.pdf",
      "document_type": "pdf",
      "processed": "completed",
      ...
    }
  ],
  "total": 5
}
```

---

#### `DELETE /api/v1/brands/{brand_id}/documents/{document_id}`
브랜드 문서 삭제

**Response:** `204 No Content`

---

### 3. BrandAnalyzerAgent API (TODO: 구현 필요)

#### `POST /api/v1/brands/{brand_id}/analyze`
브랜드 분석 및 Brand DNA 생성

**Request:**
```json
{
  "documents": [
    {
      "type": "pdf",
      "extracted_text": "EcoLife는 지속 가능한 라이프스타일을 제안합니다...",
      "title": "브랜드 가이드라인"
    },
    {
      "type": "url",
      "extracted_text": "Our Mission: Creating a sustainable future...",
      "title": "About Page"
    }
  ],
  "website_url": "https://ecolife.com", // optional
  "industry": "친환경 생활용품", // optional
  "existing_brand_kit": {...} // optional
}
```

**Response:** `200 OK`
```json
{
  "tone": "진정성 있고 따뜻한 톤, 환경 문제에 대한 진지함과 일상 속 실천 가능성을 동시에 전달",
  "key_messages": [
    "지속 가능한 내일을 위한 오늘의 선택",
    "품질과 환경, 두 마리 토끼를 모두 잡다",
    "작은 실천이 만드는 큰 변화"
  ],
  "target_audience": "환경 문제에 관심이 많은 2030 밀레니얼/Z세대, 윤리적 소비를 실천하며 일상 속 작은 변화를 중시하는 라이프스타일",
  "dos": [
    "환경 문제에 대한 진정성 있는 메시지 전달",
    "실제 사용 가능한 구체적인 실천 방법 제시",
    "제품의 친환경 인증, 소재 정보를 투명하게 공개"
  ],
  "donts": [
    "과도한 환경 보호 주장으로 부담감 주기",
    "비현실적이거나 극단적인 제안",
    "그린워싱으로 의심받을 수 있는 과장 광고"
  ],
  "sample_copies": [
    "오늘 하나, 내일의 지구를 위한 작은 실천",
    "품질은 타협하지 않습니다. 환경도 마찬가지로.",
    "일상이 바뀌면 지구가 바뀝니다"
  ],
  "suggested_brand_kit": {
    "primary_colors": ["#2E7D32", "#66BB6A"],
    "secondary_colors": ["#F5F5F5", "#8D6E63"],
    "fonts": {
      "primary": "Montserrat",
      "secondary": "Noto Sans KR"
    },
    "tone_keywords": ["진정성", "따뜻함", "실천", "지속가능"],
    "forbidden_expressions": ["완벽한", "100%", "절대"]
  },
  "confidence_score": 8.5,
  "analysis_notes": "브랜드 문서 2개 분석 완료. 추가 문서가 있으면 더 정확한 분석 가능"
}
```

**이 API는 다음 작업 후 사용 가능합니다:**
- BrandAnalyzerAgent 엔드포인트 추가
- Brand DNA를 `brands.brand_dna` JSONB 컬럼에 저장

---

## 🎨 Frontend Integration TODO

### 1. Brand Intake 페이지 구현
**필요 컴포넌트:**
- [ ] Brand 생성 폼
- [ ] 문서 업로드 컴포넌트 (Drag & Drop)
- [ ] URL 크롤링 입력 폼
- [ ] 업로드된 문서 목록 (진행 상태 표시)
- [ ] Brand DNA 생성 버튼 (분석 트리거)

**플로우:**
```
1. 브랜드 생성 (POST /brands)
2. 문서 업로드/크롤링 (POST /brands/{id}/documents)
   - 여러 문서 업로드 가능
   - processed 상태 polling (pending → completed)
3. Brand DNA 생성 (POST /brands/{id}/analyze)
   - 모든 문서의 extracted_text를 전달
   - Brand DNA Card 받기
4. Brand Kit 수동 수정 (PATCH /brands/{id})
   - suggested_brand_kit을 brand_kit에 저장
   - 사용자가 컬러, 폰트 등 수정 가능
```

---

### 2. TypeScript Types
```typescript
// types/brand.ts

export type DocumentType = 'pdf' | 'image' | 'text' | 'url' | 'brochure';

export interface BrandKit {
  logo_url?: string;
  colors?: {
    primary?: string[];
    secondary?: string[];
    accent?: string[];
  };
  fonts?: {
    primary?: string;
    secondary?: string;
    weights?: string[];
  };
  tone_keywords?: string[];
  forbidden_expressions?: string[];
  key_messages?: string[];
  target_audience?: string;
  brand_values?: string[];
}

export interface BrandDNA {
  tone: string;
  key_messages: string[];
  target_audience: string;
  dos: string[];
  donts: string[];
  sample_copies: string[];
  analyzed_at: string;
  analyzer_version: string;
}

export interface Brand {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  description?: string;
  logo_url?: string;
  website_url?: string;
  industry?: string;
  tags?: string[];
  brand_kit?: BrandKit;
  brand_dna?: BrandDNA;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface BrandDocument {
  id: string;
  brand_id: string;
  title?: string;
  document_type: DocumentType;
  file_url?: string;
  source_url?: string;
  extracted_text?: string;
  file_size?: number;
  mime_type?: string;
  processed: 'pending' | 'processing' | 'completed' | 'failed';
  document_metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface BrandDocumentListResponse {
  documents: BrandDocument[];
  total: number;
}
```

---

### 3. API Client Example
```typescript
// lib/api/brand-api.ts

export const brandApi = {
  // Brand CRUD
  create: async (data: BrandCreate) =>
    apiClient.post<Brand>('/brands', data),

  list: async (skip = 0, limit = 100) =>
    apiClient.get<Brand[]>('/brands', { params: { skip, limit } }),

  get: async (brandId: string) =>
    apiClient.get<Brand>(`/brands/${brandId}`),

  update: async (brandId: string, data: BrandUpdate) =>
    apiClient.patch<Brand>(`/brands/${brandId}`, data),

  delete: async (brandId: string, hardDelete = false) =>
    apiClient.delete(`/brands/${brandId}`, { params: { hard_delete: hardDelete } }),

  // Document APIs
  uploadDocument: async (brandId: string, file: File, documentType: DocumentType, title?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('document_type', documentType);
    if (title) formData.append('title', title);

    return apiClient.post<BrandDocument>(
      `/brands/${brandId}/documents`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
  },

  crawlUrl: async (brandId: string, url: string, title?: string) =>
    apiClient.post<BrandDocument>(
      `/brands/${brandId}/documents/crawl`,
      { url, title }
    ),

  listDocuments: async (brandId: string, skip = 0, limit = 100) =>
    apiClient.get<BrandDocumentListResponse>(
      `/brands/${brandId}/documents`,
      { params: { skip, limit } }
    ),

  deleteDocument: async (brandId: string, documentId: string) =>
    apiClient.delete(`/brands/${brandId}/documents/${documentId}`),

  // BrandAnalyzerAgent (TODO: API 구현 후 사용 가능)
  analyze: async (brandId: string, data: BrandAnalysisInput) =>
    apiClient.post<BrandDNAOutput>(`/brands/${brandId}/analyze`, data)
};
```

---

## 🚀 Next Steps (Backend)

### P1 우선순위 작업:
- [ ] BrandAnalyzerAgent API 엔드포인트 추가 (`POST /brands/{id}/analyze`)
- [ ] S3 파일 업로드 로직 구현 (현재 임시 경로 사용)
- [ ] 실제 URL 크롤링 로직 구현 (BeautifulSoup/Playwright)
- [ ] PDF/이미지 텍스트 추출 (PyPDF2, Tesseract OCR)
- [ ] 백그라운드 태스크 처리 (Celery/FastAPI BackgroundTasks)

### P2 우선순위 작업:
- [ ] BrandDocument 처리 상태 WebSocket 실시간 업데이트
- [ ] Brand DNA 버전 관리 (히스토리 저장)
- [ ] Brand Kit 템플릿 기능 (산업별 템플릿 제공)

---

## 📞 문의

**Backend 담당**: B팀
**참조 문서**:
- `backend/docs/SPARKLIO_MVP_MASTER_TRACKER.md`
- `backend/app/services/agents/brand_analyzer.py`
- `backend/app/api/v1/endpoints/brands.py`
- `backend/app/models/brand.py`

---

**End of Document**
