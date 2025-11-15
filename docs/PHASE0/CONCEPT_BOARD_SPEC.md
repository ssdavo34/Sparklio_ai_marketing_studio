# Concept Board 기능 명세서

## 1. 개요

### 1.1 목적
Concept Board는 브랜드의 시각적 아이덴티티를 탐색하고 정의하기 위한 AI 기반 무드보드 생성 도구입니다. 사용자는 텍스트 프롬프트를 통해 브랜드 콘셉트를 표현하고, AI가 생성한 다양한 시각적 요소들을 3x3 그리드로 구성된 보드에서 확인하고 선택할 수 있습니다.

### 1.2 핵심 가치
- **빠른 시각적 탐색**: 텍스트 입력만으로 9개의 다양한 시각적 콘셉트 즉시 생성
- **브랜드 비주얼 스타일 정의**: 선택된 이미지들로부터 색상 팔레트, 톤앤매너 자동 추출
- **반복적 개선**: 여러 버전의 보드 생성 및 비교를 통한 최적의 비주얼 방향성 도출

### 1.3 주요 사용 시나리오
1. 신규 브랜드 생성 시 초기 비주얼 방향성 설정
2. 기존 브랜드의 리브랜딩 작업
3. 캠페인별 비주얼 테마 탐색
4. 클라이언트 미팅용 시각적 레퍼런스 준비

## 2. 기능 요구사항

### 2.1 컨셉 보드 생성
**입력**
- 브랜드 ID (필수)
- 프롬프트 텍스트 (필수, 최소 10자, 최대 500자)
  - 예시: "모던하고 미니멀한 럭셔리 화장품 브랜드, 차분한 베이지 톤, 자연스러운 질감"

**출력**
- 새로운 Concept Board ID
- 3x3 그리드 (9개 타일)
- 각 타일:
  - 고유 ID
  - AI 생성 이미지 URL
  - 썸네일 URL (로딩 최적화용)
  - 생성 타임스탬프
  - 선택 상태 (기본: false)

**처리 과정**
1. 사용자 프롬프트 검증
2. AI 이미지 생성 요청 (9개 병렬 처리)
3. 생성된 이미지 저장 및 썸네일 생성
4. 데이터베이스에 보드 및 타일 정보 저장
5. 클라이언트에 결과 반환

### 2.2 컨셉 보드 조회
**기능**
- 특정 브랜드의 모든 컨셉 보드 목록 조회
- 특정 컨셉 보드 상세 정보 조회 (모든 타일 포함)

**필터링 옵션**
- 생성일자 기준 정렬 (최신순/오래된순)
- 선택된 타일이 있는 보드만 필터링

### 2.3 타일 선택/해제
**기능**
- 사용자가 마음에 드는 타일을 선택/해제
- 선택된 타일은 시각적으로 구분 (테두리 하이라이트)
- 선택 상태는 실시간으로 서버에 저장

**제약사항**
- 하나의 보드 내에서 최소 1개, 최대 9개 선택 가능
- 선택된 타일만 Brand Visual Style 생성에 사용됨

### 2.4 Brand Visual Style 생성
**입력**
- 브랜드 ID
- 컨셉 보드 ID
- 선택된 타일들의 ID 배열 (최소 1개)

**출력**
- Brand Visual Style 객체:
  ```json
  {
    "id": "uuid",
    "brandId": "uuid",
    "conceptBoardId": "uuid",
    "colorPalette": {
      "primary": ["#2C3E50", "#34495E"],
      "secondary": ["#ECF0F1", "#BDC3C7"],
      "accent": ["#3498DB", "#E74C3C"]
    },
    "toneAndManner": {
      "mood": ["elegant", "modern", "minimal"],
      "style": ["clean", "sophisticated"],
      "atmosphere": "calm and professional"
    },
    "visualKeywords": [
      "minimalist",
      "geometric",
      "natural lighting",
      "soft shadows"
    ],
    "selectedTileIds": ["tile-id-1", "tile-id-3", "tile-id-7"],
    "createdAt": "2025-11-15T10:30:00Z"
  }
  ```

**처리 과정**
1. 선택된 타일들의 이미지 분석
2. 색상 팔레트 추출 (k-means clustering)
3. 시각적 특징 분석 (AI Vision API 활용)
4. 톤앤매너 키워드 생성
5. 결과 저장 및 반환

## 3. 데이터 모델

### 3.1 ConceptBoard
```typescript
interface ConceptBoard {
  id: string;                    // UUID
  brandId: string;               // 브랜드 ID (FK)
  prompt: string;                // 사용자 입력 프롬프트
  tiles: ConceptTile[];          // 9개 타일 배열
  createdAt: Date;
  updatedAt: Date;
}
```

### 3.2 ConceptTile
```typescript
interface ConceptTile {
  id: string;                    // UUID
  conceptBoardId: string;        // 컨셉 보드 ID (FK)
  position: number;              // 그리드 위치 (0-8)
  imageUrl: string;              // 원본 이미지 URL
  thumbnailUrl: string;          // 썸네일 URL (200x200)
  isSelected: boolean;           // 선택 여부
  metadata?: {
    width: number;
    height: number;
    format: string;
    size: number;                // bytes
  };
  createdAt: Date;
}
```

### 3.3 BrandVisualStyle
```typescript
interface BrandVisualStyle {
  id: string;                    // UUID
  brandId: string;               // 브랜드 ID (FK)
  conceptBoardId: string;        // 컨셉 보드 ID (FK)
  colorPalette: ColorPalette;
  toneAndManner: ToneAndManner;
  visualKeywords: string[];
  selectedTileIds: string[];     // 선택된 타일 ID 배열
  createdAt: Date;
}

interface ColorPalette {
  primary: string[];             // 주색상 (2-3개)
  secondary: string[];           // 보조색상 (2-3개)
  accent: string[];              // 강조색상 (1-2개)
}

interface ToneAndManner {
  mood: string[];                // 분위기 키워드
  style: string[];               // 스타일 키워드
  atmosphere: string;            // 전체적인 느낌
}
```

## 4. API 명세

### 4.1 POST /api/brands/:brandId/concept-boards
컨셉 보드 생성

**Request**
```json
{
  "prompt": "모던하고 미니멀한 럭셔리 화장품 브랜드"
}
```

**Response (201 Created)**
```json
{
  "id": "board-uuid",
  "brandId": "brand-uuid",
  "prompt": "모던하고 미니멀한 럭셔리 화장품 브랜드",
  "tiles": [
    {
      "id": "tile-uuid-1",
      "position": 0,
      "imageUrl": "https://...",
      "thumbnailUrl": "https://...",
      "isSelected": false,
      "createdAt": "2025-11-15T10:30:00Z"
    }
    // ... 8개 더
  ],
  "createdAt": "2025-11-15T10:30:00Z"
}
```

### 4.2 GET /api/brands/:brandId/concept-boards/:boardId
컨셉 보드 조회

**Response (200 OK)**
```json
{
  "id": "board-uuid",
  "brandId": "brand-uuid",
  "prompt": "...",
  "tiles": [...],
  "createdAt": "2025-11-15T10:30:00Z",
  "updatedAt": "2025-11-15T10:35:00Z"
}
```

### 4.3 PATCH /api/concept-boards/:boardId/tiles/:tileId
타일 선택 상태 업데이트

**Request**
```json
{
  "isSelected": true
}
```

**Response (200 OK)**
```json
{
  "id": "tile-uuid",
  "isSelected": true,
  "updatedAt": "2025-11-15T10:35:00Z"
}
```

### 4.4 POST /api/brands/:brandId/visual-styles
Brand Visual Style 생성

**Request**
```json
{
  "conceptBoardId": "board-uuid",
  "selectedTileIds": ["tile-1", "tile-3", "tile-7"]
}
```

**Response (201 Created)**
```json
{
  "id": "style-uuid",
  "brandId": "brand-uuid",
  "conceptBoardId": "board-uuid",
  "colorPalette": {
    "primary": ["#2C3E50", "#34495E"],
    "secondary": ["#ECF0F1", "#BDC3C7"],
    "accent": ["#3498DB"]
  },
  "toneAndManner": {
    "mood": ["elegant", "modern"],
    "style": ["minimal", "clean"],
    "atmosphere": "sophisticated and calm"
  },
  "visualKeywords": ["minimalist", "geometric", "soft lighting"],
  "selectedTileIds": ["tile-1", "tile-3", "tile-7"],
  "createdAt": "2025-11-15T10:40:00Z"
}
```

## 5. 사용자 인터페이스

### 5.1 레이아웃
```
┌─────────────────────────────────────────────┐
│  Concept Board - [브랜드명]                 │
├─────────────────────────────────────────────┤
│                                             │
│  [프롬프트 입력창 - 최대 500자]              │
│  "모던하고 미니멀한 럭셔리 화장품 브랜드..." │
│                                             │
│            [생성하기 버튼]                   │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│  ┌─────┬─────┬─────┐                       │
│  │  1  │  2  │  3  │                       │
│  ├─────┼─────┼─────┤                       │
│  │  4  │  5  │  6  │   3x3 Grid            │
│  ├─────┼─────┼─────┤                       │
│  │  7  │  8  │  9  │                       │
│  └─────┴─────┴─────┘                       │
│                                             │
│     [선택한 타일로 스타일 생성하기]          │
│                                             │
└─────────────────────────────────────────────┘
```

### 5.2 인터랙션
- **타일 호버**: 확대 효과 + 그림자
- **타일 클릭**: 선택/해제 토글 (파란색 테두리)
- **타일 더블클릭**: 전체화면 모달로 이미지 확대 보기
- **생성 버튼**:
  - 로딩 중: 스피너 + "생성 중..." 메시지
  - 완료: 타일들이 순차적으로 페이드인
- **스타일 생성 버튼**:
  - 선택된 타일 없으면 비활성화
  - 클릭 시 로딩 상태 + 완료 후 Visual Style 페이지로 이동

### 5.3 반응형 디자인
- **Desktop (1200px+)**: 3x3 그리드, 타일 크기 300x300px
- **Tablet (768-1199px)**: 3x3 그리드, 타일 크기 200x200px
- **Mobile (<768px)**: 2x4.5 그리드 (스크롤), 타일 크기 150x150px

## 6. 기술 스택 및 구현 가이드

### 6.1 Backend (Phase 1 - Mock)
- **언어**: TypeScript
- **프레임워크**: Express.js
- **데이터베이스**: PostgreSQL (Prisma ORM)
- **이미지 생성**: Mock ImageProvider (랜덤 Unsplash 이미지)
- **이미지 처리**: Sharp (썸네일 생성, 리사이징)
- **색상 추출**: node-vibrant 또는 color-thief

### 6.2 Frontend (Phase 1)
- **프레임워크**: React + TypeScript
- **상태 관리**: React Query (서버 상태) + Context API (UI 상태)
- **스타일링**: TailwindCSS
- **그리드 레이아웃**: CSS Grid
- **이미지 최적화**: Progressive loading (썸네일 → 원본)

### 6.3 향후 확장 (Phase 2)
- **Real AI 연동**: OpenAI DALL-E 3 또는 Midjourney API
- **고급 이미지 분석**: Google Cloud Vision API
- **버전 관리**: 여러 Concept Board 비교 뷰
- **협업 기능**: 팀원들과 타일 선택 공유

## 7. 성능 및 제약사항

### 7.1 성능 목표
- 컨셉 보드 생성 시간: 30초 이내 (9개 이미지 생성)
- 타일 선택 응답 시간: 200ms 이내
- 썸네일 로딩 시간: 1초 이내
- Visual Style 생성 시간: 5초 이내

### 7.2 제약사항
- 브랜드당 최대 50개 Concept Board 저장
- 이미지 최대 크기: 2048x2048px
- 프롬프트 최대 길이: 500자
- 동시 생성 제한: 사용자당 1개 (진행 중인 생성이 있으면 대기)

### 7.3 에러 처리
- **이미지 생성 실패**: 해당 타일만 재시도 버튼 표시
- **네트워크 에러**: 자동 재시도 (최대 3회)
- **타임아웃**: 사용자에게 명확한 에러 메시지 + 재시도 옵션

## 8. 보안 및 권한

### 8.1 인증/인가
- 모든 API는 인증된 사용자만 접근 가능
- 사용자는 자신이 속한 브랜드의 Concept Board만 조회/수정 가능

### 8.2 데이터 보호
- 이미지는 CDN에 저장 (퍼블릭 접근 가능)
- Concept Board 메타데이터는 브랜드별로 격리
- 삭제된 보드의 이미지는 7일 후 자동 삭제

## 9. 테스트 계획

### 9.1 Unit Tests
- ConceptBoard 생성 로직
- 색상 팔레트 추출 알고리즘
- 타일 선택 상태 관리

### 9.2 Integration Tests
- API 엔드포인트 (4개 모두)
- 데이터베이스 CRUD 작업
- 이미지 처리 파이프라인

### 9.3 E2E Tests
- 컨셉 보드 생성 플로우
- 타일 선택 및 Visual Style 생성 플로우
- 에러 상황 시나리오

## 10. 향후 로드맵

### Phase 1 (현재)
- Mock ImageProvider 기반 MVP
- 기본 UI/UX 구현
- 핵심 API 4개 구축

### Phase 2
- Real AI 이미지 생성 연동
- 고급 이미지 분석 (객체 인식, 스타일 분류)
- 버전 비교 기능

### Phase 3
- 협업 기능 (댓글, 투표)
- 템플릿 라이브러리
- 스타일 가이드 자동 생성 (PDF 내보내기)
