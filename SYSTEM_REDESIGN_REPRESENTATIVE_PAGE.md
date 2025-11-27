# Sparklio 컨셉 썸네일 시스템 재설계
## Representative Page 기반 아키텍처

**문서 버전**: v2.0  
**작성일**: 2025-11-27  
**대상 팀**: A팀 (Backend), B팀 (AI/Agent), C팀 (Frontend)

---

## 📌 변경 범위 (Scope)

이번 변경은 **"컨셉 썸네일 생성/표시 방식"**에만 한정합니다.

### 제거 항목
- ❌ **1080×1080 고정 가상 페이지** 기반 썸네일
- ❌ 컨셉 요약을 위한 별도 레이아웃/템플릿
- ❌ `conceptToPolotnoPage.ts` (가상 페이지 생성 로직)

### 도입 항목
- ✅ **실제 생산물 페이지(캔버스)를 축소한 썸네일**
- ✅ **대표 페이지(Representative Page)** 개념
- ✅ 포맷별 실제 비율 유지 (16:9, 9:16, 1:1, 4:5 등)

### 영향 영역
- **도메인 모델**: Concept, Page, Asset
- **DB 스키마**: 일부 필드 추가
- **백엔드 API**: 컨셉 조회/저장, 썸네일 생성
- **프론트엔드**: 스토어, Polotno 연동, UI 컴포넌트
- **에이전트(LLM)**: 최소 영향 (썸네일용 별도 포맷 요구 제거)

---

## 🎯 핵심 개념

### 1. 대표 페이지 (Representative Page)

**정의**  
하나의 컨셉 안에 여러 페이지(슬라이드용, 인스타용, 쇼츠용 등)가 있을 때,  
그 중 **한 페이지를 "대표 페이지"로 지정**하고,  
이 페이지를 축소한 이미지를 컨셉 썸네일로 사용한다.

**특징**
- 컨셉마다 대표 페이지는 **최대 1개** (없을 수도 있음)
- 대표 페이지의 **실제 width/height 기반으로 썸네일 비율을 맞춤**
- 포맷(16:9, 1:1, 9:16...) 정보도 이 대표 페이지에서 가져옴

### 2. 썸네일 = 축소본

- 썸네일 이미지는 **대표 페이지의 실제 렌더링 결과를 축소**한 것
- **픽셀 수만 줄이고, 비율은 그대로 유지**
  - 예: 1920×1080 → 384×216
- 따라서, 썸네일은 "축소된 실제 결과물"
- 유저가 캔버스를 열면 화면과 썸네일이 자연스럽게 이어짐

---

## 🗂️ 도메인 / DB 변경 설계

### Concept 도메인

```typescript
interface Concept {
  id: string;
  projectId: string;
  
  title: string;
  description?: string;
  
  // 🆕 대표 페이지 필드
  representativePageId?: string;      // 이 페이지를 썸네일로 사용
  representativeFormat?: CanvasFormat; // 'slide_16_9', 'instagram_1_1' 등
  
  createdAt: string;
  updatedAt: string;
}
```

### DB 마이그레이션 (PostgreSQL)

```sql
-- concepts 테이블에 컬럼 추가
ALTER TABLE concepts
  ADD COLUMN representative_page_id uuid NULL,
  ADD COLUMN representative_format text NULL;

-- 외래키 제약 (옵션)
ALTER TABLE concepts
  ADD CONSTRAINT fk_representative_page
  FOREIGN KEY (representative_page_id)
  REFERENCES design_pages(id)
  ON DELETE SET NULL;
```

### DesignPage 도메인

```typescript
interface DesignPage {
  id: string;
  conceptId: string;
  
  width: number;
  height: number;
  
  // 🆕 포맷 필드
  format: CanvasFormat; // 'slide_16_9' | 'instagram_1_1' | 'shorts_9_16' | ...
  
  // 🆕 썸네일 관련 필드
  thumbnailUrl?: string;          // S3 / MinIO URL
  thumbnailGeneratedAt?: string;  // ISO8601 타임스탬프
  
  // Polotno JSON 데이터
  polotnoJson?: any;
}
```

### DB 마이그레이션

```sql
-- design_pages 테이블에 컬럼 추가
ALTER TABLE design_pages
  ADD COLUMN format text NOT NULL DEFAULT 'custom',
  ADD COLUMN thumbnail_url text NULL,
  ADD COLUMN thumbnail_generated_at timestamptz NULL;

-- 인덱스 (성능 최적화)
CREATE INDEX idx_design_pages_concept_id ON design_pages(concept_id);
CREATE INDEX idx_design_pages_format ON design_pages(format);
```

---

## 🔌 백엔드 API 설계 (A팀)

### 1. 컨셉 조회 API

#### GET `/api/concepts/{id}`

**응답 예시**:
```json
{
  "id": "concept-123",
  "title": "봄 신상 런칭 캠페인",
  "description": "슬라이드 + 피드 + 쇼츠 세트",
  "representativePageId": "page-456",
  "representativeFormat": "slide_16_9",
  
  "thumbnail": {
    "pageId": "page-456",
    "format": "slide_16_9",
    "url": "https://assets.sparklio.ai/thumbnails/page-456.jpg",
    "width": 1920,
    "height": 1080,
    "aspectRatio": 1.777,
    "generatedAt": "2025-11-27T03:21:00Z"
  },
  
  "pages": [
    {
      "id": "page-456",
      "format": "slide_16_9",
      "thumbnailUrl": "..."
    },
    {
      "id": "page-457",
      "format": "instagram_1_1",
      "thumbnailUrl": "..."
    }
  ]
}
```

**A팀 작업 포인트**:
- `ConceptDetailResponse` DTO에 `thumbnail` 필드 추가
- 내부적으로 `representative_page_id` 기반으로 `design_pages` 조인
- `thumbnail_url`이 비어 있으면 `thumbnail: null`
- 옵션: `?ensure_thumbnail=true` 쿼리 파라미터 지원 시 즉시 생성 시도

#### GET `/api/concepts`

**응답 예시** (목록 조회):
```json
[
  {
    "id": "concept-123",
    "title": "봄 신상 런칭",
    "representativePageId": "page-456",
    "representativeFormat": "slide_16_9",
    "thumbnailUrl": "https://assets.sparklio.ai/thumbnails/page-456.jpg",
    "pageCount": 3,
    "createdAt": "2025-11-27T00:00:00Z"
  }
]
```

### 2. 대표 페이지 지정 API

#### PATCH `/api/concepts/{id}/representative-page`

**요청**:
```json
{
  "pageId": "page-456"
}
```

**동작**:
1. 해당 concept의 소속 page인지 검증
2. `concepts.representative_page_id` 업데이트
3. `representative_format`은 해당 `page.format`으로 세팅
4. 썸네일이 없으면, 썸네일 생성 Job 큐에 추가 (비동기)

**응답**:
```json
{
  "success": true,
  "concept": {
    "id": "concept-123",
    "representativePageId": "page-456",
    "representativeFormat": "slide_16_9"
  }
}
```

### 3. 썸네일 생성/업로드 API

#### POST `/api/pages/{id}/thumbnail`

**요청**:
```json
{
  "dataUrl": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
  "width": 1920,
  "height": 1080
}
```

**동작**:
1. dataUrl 디코딩 → 이미지 파일로 변환
2. MinIO/S3에 업로드 (`thumbnails/page-{id}.jpg`)
3. `design_pages.thumbnail_url`, `thumbnail_generated_at` 업데이트

**응답**:
```json
{
  "success": true,
  "thumbnailUrl": "https://assets.sparklio.ai/thumbnails/page-456.jpg",
  "generatedAt": "2025-11-27T03:21:00Z"
}
```

---

## 🎨 프론트엔드 설계 (C팀)

### 1. Polotno Page ↔ DesignPage 매핑

Polotno page 객체의 `custom`에 다음 값 포함:

```typescript
page.custom = {
  designPageId: 'page-456',     // 백엔드의 page id
  conceptId: 'concept-123',     // 소속 컨셉
  format: 'slide_16_9',         // 포맷
  
  // 썸네일 생성 후 추가
  thumbnailDataUrl: 'data:image/jpeg;base64,...',
  thumbnailGeneratedAt: '2025-11-27T03:21:00Z'
};
```

### 2. 썸네일 생성 플로우

```typescript
// 1. Polotno 페이지에서 썸네일 생성
const thumbnailDataUrl = await page.toDataURL({
  mimeType: 'image/jpeg',
  quality: 0.7,
  pixelRatio: 0.2  // 20% 크기로 축소
});

// 2. 백엔드에 업로드
const response = await fetch(`/api/pages/${page.custom.designPageId}/thumbnail`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    dataUrl: thumbnailDataUrl,
    width: page.width,
    height: page.height
  })
});

// 3. 응답에서 thumbnailUrl 받아서 동기화
const { thumbnailUrl } = await response.json();
page.set({
  custom: {
    ...page.custom,
    thumbnailUrl,
    thumbnailGeneratedAt: new Date().toISOString()
  }
});
```

### 3. 컨셉 카드 컴포넌트

```tsx
interface ConceptThumbnailCardProps {
  concept: {
    id: string;
    title: string;
    thumbnailUrl?: string;
    representativeFormat?: CanvasFormat;
  };
}

export function ConceptThumbnailCard({ concept }: ConceptThumbnailCardProps) {
  // 포맷별 aspect ratio 계산
  const aspectRatio = getAspectRatio(concept.representativeFormat);
  
  return (
    <div className="concept-card">
      <div 
        className="thumbnail-container"
        style={{ aspectRatio }}  // 실제 포맷 비율 유지!
      >
        {concept.thumbnailUrl ? (
          <img src={concept.thumbnailUrl} alt={concept.title} />
        ) : (
          <div className="placeholder">썸네일 생성 중...</div>
        )}
      </div>
      <h3>{concept.title}</h3>
    </div>
  );
}
```

---

## 🤖 LLM / Agent 영향 (B팀)

### 제거할 요구사항

- ❌ "컨셉이 생성되면, 1080×1080 썸네일용 가상 캔버스를 하나 만든다"
- ❌ "썸네일용 페이지 위에 컨셉 키워드/톤/오퍼를 요약해서 배치한다"
- ❌ "썸네일용 포맷을 별도 템플릿으로 관리한다"

### 유지/추가할 요구사항

- ✅ 에이전트는 각각의 **실제 포맷**(슬라이드, 피드, 쇼츠)의 실제 레이아웃만 신경 쓴다
- ✅ 썸네일은 순수하게 **렌더 결과의 축소본**이므로, 에이전트 스펙에서 특별한 항목 불필요
- ✅ ConceptAgent는 여러 포맷의 페이지를 생성하되, 그 중 하나를 "대표"로 지정하는 로직 추가 고려

---

## 📋 팀별 작업 체크리스트

### A팀 (Backend) 체크리스트

- [ ] DB 마이그레이션 스크립트 작성
  - [ ] `concepts` 테이블: `representative_page_id`, `representative_format` 추가
  - [ ] `design_pages` 테이블: `format`, `thumbnail_url`, `thumbnail_generated_at` 추가
- [ ] API 엔드포인트 구현
  - [ ] `GET /api/concepts/{id}` - thumbnail 필드 포함
  - [ ] `GET /api/concepts` - thumbnailUrl 포함
  - [ ] `PATCH /api/concepts/{id}/representative-page` - 대표 페이지 지정
  - [ ] `POST /api/pages/{id}/thumbnail` - 썸네일 업로드
- [ ] DTO/스키마 업데이트
  - [ ] `ConceptDetailResponse`, `ConceptListResponse`
  - [ ] `DesignPageResponse`
- [ ] 썸네일 스토리지 설정 (MinIO/S3)
- [ ] 기존 데이터 마이그레이션 스크립트 (옵션)

### B팀 (AI/Agent) 체크리스트

- [ ] ConceptAgent 수정
  - [ ] 1080×1080 가상 페이지 생성 로직 **제거**
  - [ ] 실제 포맷(슬라이드, 피드, 쇼츠) 페이지만 생성
  - [ ] 생성된 페이지 중 하나를 `representativePage`로 지정하는 로직 추가 (옵션)
- [ ] Agent 응답 스키마 검토
  - [ ] 썸네일 관련 필드 제거
  - [ ] `pages` 배열에 `format` 필드 명시
- [ ] 기존 에이전트 테스트 케이스 업데이트

### C팀 (Frontend) 체크리스트

- [ ] **제거**: `conceptToPolotnoPage.ts` (가상 페이지 생성 로직)
- [ ] Polotno Page 매핑 규칙 통일
  - [ ] `page.custom`에 `designPageId`, `conceptId`, `format` 포함
- [ ] 썸네일 생성/업로드 유틸 함수 작성
  - [ ] `generateAndUploadThumbnail(page)`
- [ ] 컨셉 카드 컴포넌트 수정
  - [ ] 1:1 비율 제거
  - [ ] `aspect-ratio` CSS로 실제 포맷 비율 적용
  - [ ] `concept.thumbnailUrl` 사용
- [ ] 스토어 업데이트
  - [ ] `useChatStore.ts`: 가상 페이지 생성 로직 제거
  - [ ] `useConceptStore.ts`: 대표 페이지 지정 액션 추가
- [ ] 에디터 저장 플로우 수정
  - [ ] 페이지 저장 시 자동 썸네일 생성
  - [ ] 대표 페이지 변경 시 재생성

---

## 🚀 마이그레이션 계획

### Phase 1: 준비 (Week 1)
1. DB 스키마 변경 & 마이그레이션 스크립트
2. 기존 데이터 정리 (1080×1080 가상 페이지 폐기 결정)
3. API 스펙 합의 (A/C팀)

### Phase 2: 백엔드 구현 (Week 2)
1. API 엔드포인트 구현
2. 썸네일 스토리지 설정
3. API 테스트

### Phase 3: 프론트엔드 구현 (Week 2-3)
1. `conceptToPolotnoPage.ts` 제거
2. 썸네일 생성/업로드 로직 구현
3. UI 컴포넌트 수정 (aspect-ratio 적용)
4. 통합 테스트

### Phase 4: Agent 조정 (Week 3)
1. ConceptAgent 수정
2. 응답 스키마 업데이트
3. 테스트 케이스 업데이트

### Phase 5: 검증 & 배포 (Week 4)
1. E2E 테스트
2. 성능 테스트 (썸네일 로딩 속도)
3. 스테이징 배포
4. 프로덕션 배포

---

## 📊 기대 효과

### 사용자 경험 개선
- ✅ 썸네일과 실제 결과물이 일치하여 **직관성 향상**
- ✅ 포맷별 실제 비율 유지로 **시각적 일관성**
- ✅ 컨셉 선택 → 편집 전환 시 **자연스러운 UX**

### 시스템 단순화
- ✅ 가상 페이지 개념 제거로 **코드 복잡도 감소**
- ✅ "실제 캔버스 = 썸네일 원본"으로 **데이터 모델 단순화**
- ✅ LLM 에이전트의 책임 분리 (실제 콘텐츠만 생성)

### 유지보수성
- ✅ 코드 라인 수 감소 (예상: ~300 lines)
- ✅ 명확한 데이터 흐름
- ✅ 팀 간 인터페이스 단순화

---

## 🔗 관련 문서

- `ERROR_FIXES.md` - 현재 콘솔 에러 수정사항
- `THUMBNAIL_SYSTEM_V1.md` - 기존 시스템 (참고용, deprecated)
- Frontend: `frontend/lib/utils/thumbnail.ts`
- Backend: `backend/app/models/concept.py`, `backend/app/models/design_page.py`

---

**문서 관리**  
- 최초 작성: 2025-11-27
- 마지막 수정: 2025-11-27
- 담당자: Antigravity AI (with User)
- 승인 대기: A/B/C 팀 리드
