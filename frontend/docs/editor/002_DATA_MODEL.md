# Canvas Studio v3 — Data Model

**관련 문서**: [000_MASTER_PLAN.md](./000_MASTER_PLAN.md), [001_ARCHITECTURE.md](./001_ARCHITECTURE.md)
**작성일**: 2025-11-19

---

## 📋 목차

1. [개요](#개요)
2. [EditorDocument](#editordocument)
3. [EditorPage](#editorpage)
4. [EditorObject](#editorobject)
5. [ObjectRole (서비스 레벨)](#objectrole-서비스-레벨)
6. [TemplateDefinition](#templatedefinition)
7. [TrendPattern](#trendpattern)
8. [DesignTokens](#designtokens)
9. [EditorCommand](#editorcommand)
10. [EditorStore State](#editorstore-state)

---

## 개요

### 설계 원칙

1. **타입 안전성**: 모든 필드는 TypeScript로 정의
2. **확장 가능성**: 새로운 객체 타입 추가 용이
3. **직렬화 가능**: JSON으로 변환 가능 (서버 통신)
4. **불변성**: Immer를 사용한 불변 업데이트

### 파일 위치

```
components/canvas-studio/types/
├── document.ts       # EditorDocument, EditorPage, EditorObject
├── design-tokens.ts  # DesignTokens, BrandPreset
├── commands.ts       # EditorCommand
└── store.ts          # EditorStore State
```

---

## EditorDocument

### 인터페이스

```typescript
export interface EditorDocument {
  id: string;                      // UUID
  title: string;                   // 문서 제목
  mode: EditorMode;                // 에디터 모드
  brandId?: string;                // 브랜드 ID (옵션)
  pages: EditorPage[];             // 페이지 배열
  tokens?: DesignTokens;           // 디자인 토큰
  createdAt: string;               // ISO 8601
  updatedAt: string;               // ISO 8601
  source?: DocumentSource;         // 문서 출처

  // 🆕 서비스 레벨 필드 (캠페인 & 성과 추적)
  projectId?: string;              // 프로젝트 ID
  campaignId?: string;             // 캠페인 ID
  variantId?: string;              // A/B 테스트 변형 ID
  templateId?: string;             // 사용된 템플릿 ID
  trendSnapshotId?: string;        // 트렌드 스냅샷 ID (생성 시점 트렌드)

  // 🆕 성과 데이터 (Publishing 후 수집)
  performance?: {
    ctr?: number;                  // Click-Through Rate (%)
    cvr?: number;                  // Conversion Rate (%)
    revenue?: number;              // 매출 ($)
    impressions?: number;          // 노출 수
    clicks?: number;               // 클릭 수
    avgTimeOnPage?: number;        // 평균 체류시간 (초)
    updatedAt?: string;            // 성과 데이터 업데이트 시각
  };
}

export type EditorMode =
  | 'concept-board'    // 컨셉 보드
  | 'pitch-deck'       // 피치 덱
  | 'product-story'    // 상품 상세
  | 'ad-studio'        // 광고 스튜디오
  | 'social-set'       // SNS 세트
  | 'blog-post';       // 블로그 포스트

export interface DocumentSource {
  kind: 'spark-chat' | 'meeting' | 'template' | 'manual' | 'auto-generated' | 'trend-snapshot';
  sourceId?: string;   // chatSessionId, meetingId, templateId
}
```

### 예시

```typescript
const document: EditorDocument = {
  id: 'doc-001',
  title: 'Product Launch Pitch Deck',
  mode: 'pitch-deck',
  brandId: 'brand-sparklio',
  pages: [
    // ... EditorPage[]
  ],
  tokens: {
    // ... DesignTokens
  },
  createdAt: '2025-11-19T10:00:00Z',
  updatedAt: '2025-11-19T12:30:00Z',
  source: {
    kind: 'meeting',
    sourceId: 'meeting-123'
  }
};
```

---

## EditorPage

### 인터페이스

```typescript
export interface EditorPage {
  id: string;                      // UUID
  name: string;                    // 페이지 이름
  kind: PageKind;                  // 페이지 종류
  width: number;                   // 너비 (px)
  height: number;                  // 높이 (px)
  objects: EditorObject[];         // 객체 배열
  background?: PageBackground;     // 배경
  layoutPresetId?: string;         // 레이아웃 프리셋 ID
  thumbnail?: string;              // 썸네일 URL
}

export type PageKind =
  | 'concept'          // 컨셉 보드
  | 'slide'            // 슬라이드
  | 'section'          // 섹션
  | 'ad'               // 광고
  | 'social'           // SNS
  | 'blog';            // 블로그

export interface PageBackground {
  type: 'color' | 'gradient' | 'image';
  color?: string;                  // 단색 배경
  gradient?: {                     // 그라데이션
    type: 'linear' | 'radial';
    colors: string[];
    angle?: number;                // 각도 (linear)
    center?: [number, number];     // 중심 (radial)
  };
  image?: {                        // 이미지 배경
    src: string;
    fit: 'cover' | 'contain' | 'fill';
    opacity?: number;
  };
}
```

### 페이지 사이즈 프리셋

```typescript
export const PAGE_PRESETS = {
  // 프레젠테이션
  '16:9': { width: 1920, height: 1080 },
  '4:3': { width: 1600, height: 1200 },

  // SNS
  'instagram-square': { width: 1080, height: 1080 },
  'instagram-portrait': { width: 1080, height: 1350 },
  'instagram-story': { width: 1080, height: 1920 },

  // 광고
  'facebook-feed': { width: 1200, height: 630 },
  'youtube-thumbnail': { width: 1280, height: 720 },

  // 웹
  'desktop': { width: 1440, height: 900 },
  'tablet': { width: 768, height: 1024 },
  'mobile': { width: 375, height: 667 },

  // 자유
  'custom': { width: 1080, height: 1350 },
};
```

---

## EditorObject

### 기본 인터페이스

```typescript
export interface EditorObjectBase {
  id: string;                      // UUID
  type: ObjectType;                // 객체 타입
  name?: string;                   // 객체 이름

  // 위치 & 크기
  x: number;                       // X 좌표
  y: number;                       // Y 좌표
  width?: number;                  // 너비
  height?: number;                 // 높이
  rotation: number;                // 회전 각도 (degree)

  // 시각 속성
  opacity: number;                 // 투명도 (0~1)
  visible: boolean;                // 표시 여부
  locked: boolean;                 // 잠금 여부

  // 계층
  zIndex?: number;                 // Z-index
  groupId?: string;                // 그룹 ID

  // 🆕 서비스 레벨 필드 (역할 & 출처)
  role?: ObjectRole;               // 콘텐츠 역할 (템플릿 자동 생성 시 사용)
  source?: ObjectSource;           // 객체 생성 출처

  // 데이터 바인딩
  dataBindings?: Record<string, any>;
}

export type ObjectType =
  | 'text'       // 텍스트
  | 'image'      // 이미지
  | 'shape'      // 도형
  | 'group'      // 그룹
  | 'table'      // 표
  | 'chart'      // 차트
  | 'video';     // 비디오
```

### Text Object

```typescript
export interface TextObject extends EditorObjectBase {
  type: 'text';
  text: string;                    // 텍스트 내용
  fontSize: number;                // 폰트 크기
  fontFamily: string;              // 폰트 패밀리
  fontWeight?: FontWeight;         // 폰트 굵기
  fontStyle?: 'normal' | 'italic'; // 폰트 스타일
  lineHeight?: number;             // 줄 간격
  letterSpacing?: number;          // 자간
  textAlign: 'left' | 'center' | 'right' | 'justify'; // 정렬
  verticalAlign?: 'top' | 'middle' | 'bottom'; // 수직 정렬
  fill: string;                    // 텍스트 색상
  stroke?: string;                 // 외곽선 색상
  strokeWidth?: number;            // 외곽선 굵기
}

export type FontWeight =
  | '100' | '200' | '300' | '400' | '500'
  | '600' | '700' | '800' | '900'
  | 'normal' | 'bold';
```

### Image Object

```typescript
export interface ImageObject extends EditorObjectBase {
  type: 'image';
  src: string;                     // 이미지 URL
  fit: 'contain' | 'cover' | 'fill'; // 이미지 핏
  placeholder?: boolean;           // 플레이스홀더 여부
  filters?: ImageFilter[];         // 필터 배열
  crop?: {                         // 크롭 정보
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface ImageFilter {
  type: 'blur' | 'brightness' | 'contrast' | 'grayscale' | 'sepia';
  value: number;                   // 필터 강도
}
```

### Shape Object

```typescript
export interface ShapeObject extends EditorObjectBase {
  type: 'shape';
  shapeType: ShapeType;            // 도형 종류
  fill?: string;                   // 채우기 색상
  stroke?: string;                 // 테두리 색상
  strokeWidth?: number;            // 테두리 굵기
  cornerRadius?: number;           // 모서리 둥글기
}

export type ShapeType =
  | 'rect'       // 사각형
  | 'circle'     // 원
  | 'ellipse'    // 타원
  | 'triangle'   // 삼각형
  | 'star'       // 별
  | 'polygon'    // 다각형
  | 'line'       // 선
  | 'arrow';     // 화살표
```

### Group Object

```typescript
export interface GroupObject extends EditorObjectBase {
  type: 'group';
  children: EditorObject[];        // 자식 객체 배열
  clipPath?: boolean;              // 클리핑 여부
}
```

### Union Type

```typescript
export type EditorObject =
  | TextObject
  | ImageObject
  | ShapeObject
  | GroupObject;
```

---

## ObjectRole (서비스 레벨)

### 개요

**ObjectRole**은 각 에디터 객체가 콘텐츠에서 어떤 **의미적 역할**을 수행하는지 정의합니다.

이는 다음 상황에서 핵심적으로 사용됩니다:
- **Meeting AI**: 회의록 내용 → 객체 매핑 ("이 텍스트는 headline, 저 이미지는 product-image")
- **Trend Engine**: 성공 패턴 학습 ("cta-button이 우측 하단에 있을 때 CTR 높음")
- **Auto Template**: 역할 기반 자동 생성 ("Instagram Ad에는 headline, product-image, cta-button 필수")
- **Spark Chat**: 자연어 명령 해석 ("헤드라인을 더 크게" → role='headline'인 객체 찾기)

### 인터페이스

```typescript
export type ObjectRole =
  // 텍스트 역할
  | 'headline'          // 주제목
  | 'subheadline'       // 부제목
  | 'body'              // 본문
  | 'caption'           // 캡션
  | 'quote'             // 인용구
  | 'price'             // 가격
  | 'discount'          // 할인율
  | 'cta-text'          // CTA 텍스트
  | 'label'             // 라벨
  | 'date'              // 날짜
  | 'author'            // 저자명

  // 이미지 역할
  | 'product-image'     // 제품 이미지
  | 'hero-image'        // 히어로 이미지
  | 'background-image'  // 배경 이미지
  | 'logo'              // 로고
  | 'icon'              // 아이콘
  | 'thumbnail'         // 썸네일
  | 'avatar'            // 아바타
  | 'before-after'      // 비포애프터

  // 인터랙션 역할
  | 'cta-button'        // CTA 버튼
  | 'link'              // 링크
  | 'form-input'        // 폼 입력
  | 'social-icon'       // SNS 아이콘

  // 장식 역할
  | 'badge'             // 배지
  | 'divider'           // 구분선
  | 'decoration'        // 장식 요소
  | 'background-shape'  // 배경 도형

  // 구조 역할
  | 'container'         // 컨테이너
  | 'section'           // 섹션
  | 'card'              // 카드
  | 'grid-item';        // 그리드 아이템

export interface ObjectSource {
  kind: 'user' | 'template' | 'auto-generated' | 'meeting' | 'trend-snapshot';
  templateId?: string;         // 템플릿 ID (kind='template')
  trendId?: string;            // 트렌드 패턴 ID (kind='auto-generated' | 'trend-snapshot')
  meetingId?: string;          // 회의 ID (kind='meeting')
  generatedAt?: string;        // 자동 생성 시각
}
```

### 사용 예시

```typescript
// Meeting AI → 자동 생성된 객체
const headlineObject: TextObject = {
  // ... EditorObjectBase
  type: 'text',
  text: '신제품 출시 기념 50% 할인',
  role: 'headline',              // 🎯 역할 정의
  source: {
    kind: 'meeting',
    meetingId: 'meeting-123',
    generatedAt: '2025-11-19T10:00:00Z'
  },
  // ... TextObject props
};

// Trend Engine → 자동 생성된 CTA 버튼
const ctaButton: ShapeObject = {
  // ... EditorObjectBase
  type: 'shape',
  shapeType: 'rect',
  role: 'cta-button',            // 🎯 CTA 버튼 역할
  source: {
    kind: 'auto-generated',
    trendId: 'trend-ig-story-001',
    generatedAt: '2025-11-19T10:05:00Z'
  },
  fill: '#FF5733',
  // ... ShapeObject props
};

// 사용자가 직접 추가한 객체 (역할 없음 가능)
const decorShape: ShapeObject = {
  // ... EditorObjectBase
  type: 'shape',
  shapeType: 'circle',
  role: 'decoration',            // 🎯 장식 요소
  source: {
    kind: 'user'
  },
  // ... ShapeObject props
};
```

### 역할 기반 쿼리 함수

```typescript
// 특정 역할의 객체 찾기
export function findObjectsByRole(
  page: EditorPage,
  role: ObjectRole
): EditorObject[] {
  return page.objects.filter(obj => obj.role === role);
}

// 헤드라인 업데이트 (Spark Chat에서 사용)
export function updateHeadline(
  page: EditorPage,
  newText: string
): EditorPage {
  const headlines = findObjectsByRole(page, 'headline');
  if (headlines.length === 0) return page;

  const headline = headlines[0];
  if (isTextObject(headline)) {
    headline.text = newText;
  }
  return page;
}
```

---

## TemplateDefinition

### 개요

**TemplateDefinition**은 재사용 가능한 템플릿의 메타데이터와 구조를 정의합니다.

Trend Engine이 학습한 패턴을 기반으로 자동 생성되거나, 디자이너가 직접 제작할 수 있습니다.

### 인터페이스

```typescript
export interface TemplateDefinition {
  id: string;                      // UUID
  name: string;                    // 템플릿 이름
  description?: string;            // 설명
  category: TemplateCategory;      // 카테고리
  tags: string[];                  // 태그

  // 템플릿 구조
  mode: EditorMode;                // 에디터 모드
  pages: EditorPage[];             // 페이지 템플릿
  tokens?: DesignTokens;           // 기본 디자인 토큰

  // 🆕 트렌드 연동
  trendPattern?: TrendPattern;     // 연관된 트렌드 패턴
  popularityScore?: number;        // 인기도 (0-100)
  performanceMetrics?: {
    avgCtr?: number;               // 평균 CTR
    avgCvr?: number;               // 평균 CVR
    usageCount?: number;           // 사용 횟수
  };

  // 메타데이터
  thumbnail?: string;              // 썸네일 URL
  createdAt: string;               // 생성 시각
  updatedAt: string;               // 업데이트 시각
  createdBy?: string;              // 생성자 (user | system)
}

export type TemplateCategory =
  | 'product-detail'    // 상품 상세
  | 'pitch-deck'        // 피치 덱
  | 'social-ad'         // SNS 광고
  | 'blog-post'         // 블로그
  | 'landing-page'      // 랜딩 페이지
  | 'email'             // 이메일
  | 'presentation';     // 프레젠테이션
```

### 예시

```typescript
const instagramAdTemplate: TemplateDefinition = {
  id: 'tpl-001',
  name: 'Instagram Feed - Left Image + Right Text',
  description: '좌측 제품 이미지 + 우측 텍스트 레이아웃 (2025년 11월 한국 시장 CTR 1위)',
  category: 'social-ad',
  tags: ['instagram', 'feed', 'left-right', 'korea'],

  mode: 'ad-studio',
  pages: [
    {
      id: 'page-1',
      name: 'Instagram Feed',
      kind: 'ad',
      width: 1080,
      height: 1080,
      objects: [
        {
          id: 'obj-1',
          type: 'image',
          role: 'product-image',      // 🎯 역할 정의
          x: 0,
          y: 0,
          width: 540,
          height: 1080,
          src: 'placeholder.jpg',
          placeholder: true,
          // ... ImageObject props
        },
        {
          id: 'obj-2',
          type: 'text',
          role: 'headline',           // 🎯 역할 정의
          text: '{{ headline }}',     // 플레이스홀더
          x: 600,
          y: 300,
          fontSize: 32,
          fontWeight: 'bold',
          // ... TextObject props
        },
        {
          id: 'obj-3',
          type: 'shape',
          role: 'cta-button',         // 🎯 역할 정의
          shapeType: 'rect',
          x: 600,
          y: 800,
          width: 400,
          height: 60,
          fill: '#FF5733',
          // ... ShapeObject props
        }
      ],
      background: {
        type: 'color',
        color: '#FFFFFF'
      }
    }
  ],

  // 🆕 트렌드 데이터
  trendPattern: {
    id: 'trend-ig-kr-2025-11',
    market: 'kr',
    channel: 'instagram',
    format: 'feed',
    layoutPattern: 'left-image-right-text',
    popularityScore: 92,
    sampleSources: [
      'https://instagram.com/p/example1',
      'https://instagram.com/p/example2'
    ]
  },
  popularityScore: 92,
  performanceMetrics: {
    avgCtr: 6.8,
    avgCvr: 3.2,
    usageCount: 1234
  },

  thumbnail: 'https://cdn.sparklio.ai/templates/tpl-001/thumb.jpg',
  createdAt: '2025-11-01T00:00:00Z',
  updatedAt: '2025-11-19T10:00:00Z',
  createdBy: 'system'  // Trend Engine이 자동 생성
};
```

---

## TrendPattern

### 개요

**TrendPattern**은 Trend Engine이 크롤링한 마케팅 데이터에서 추출한 **성공 패턴**을 정의합니다.

이 패턴은 TemplateDefinition 생성의 기반이 되며, 시장/채널/시기별로 달라집니다.

### 인터페이스

```typescript
export interface TrendPattern {
  id: string;                      // UUID
  name: string;                    // 패턴 이름

  // 시장 & 채널
  market: Market;                  // 시장
  channel: Channel;                // 채널
  format: Format;                  // 포맷

  // 레이아웃 패턴
  layoutPattern: LayoutPattern;    // 레이아웃 유형
  layoutStructure?: {              // 상세 구조
    sections: {
      role: ObjectRole;            // 섹션 역할
      position: 'top' | 'bottom' | 'left' | 'right' | 'center';
      sizeRatio: number;           // 크기 비율 (0-1)
    }[];
  };

  // 성과 데이터
  popularityScore: number;         // 인기도 (0-100)
  performanceMetrics?: {
    avgCtr?: number;               // 평균 CTR
    avgEngagement?: number;        // 평균 참여율
    sampleSize?: number;           // 샘플 수
  };

  // 출처
  sampleSources: string[];         // 샘플 URL 배열
  collectedAt: string;             // 수집 시각
  validUntil?: string;             // 유효 기간

  // 메타데이터
  createdAt: string;
  updatedAt: string;
}

export type Market = 'kr' | 'us' | 'jp' | 'global';

export type Channel =
  | 'instagram'
  | 'tiktok'
  | 'youtube'
  | 'facebook'
  | 'linkedin'
  | 'blog'
  | 'search-ad'
  | 'display-ad';

export type Format =
  | 'feed'           // 피드
  | 'story'          // 스토리
  | 'reels'          // 릴스
  | 'short'          // 쇼츠
  | 'banner'         // 배너
  | 'carousel';      // 캐러셀

export type LayoutPattern =
  | 'left-image-right-text'     // 좌 이미지 + 우 텍스트
  | 'right-image-left-text'     // 우 이미지 + 좌 텍스트
  | 'top-image-bottom-text'     // 상 이미지 + 하 텍스트
  | 'three-column-benefits'     // 3단 장점 나열
  | 'hero-center'               // 히어로 중앙 정렬
  | 'grid-2x2'                  // 2x2 그리드
  | 'grid-3x3'                  // 3x3 그리드
  | 'text-overlay-image'        // 이미지 위 텍스트 오버레이
  | 'split-screen'              // 화면 분할
  | 'z-pattern'                 // Z 패턴
  | 'f-pattern';                // F 패턴
```

### 예시

```typescript
const trendPattern: TrendPattern = {
  id: 'trend-ig-kr-2025-11',
  name: 'Instagram Feed - Left Image + Right Text (Korea 2025-11)',

  market: 'kr',
  channel: 'instagram',
  format: 'feed',

  layoutPattern: 'left-image-right-text',
  layoutStructure: {
    sections: [
      {
        role: 'product-image',
        position: 'left',
        sizeRatio: 0.5           // 50% 너비
      },
      {
        role: 'headline',
        position: 'right',
        sizeRatio: 0.3
      },
      {
        role: 'cta-button',
        position: 'right',
        sizeRatio: 0.2
      }
    ]
  },

  popularityScore: 92,
  performanceMetrics: {
    avgCtr: 6.8,
    avgEngagement: 12.3,
    sampleSize: 1500
  },

  sampleSources: [
    'https://instagram.com/p/example1',
    'https://instagram.com/p/example2',
    'https://instagram.com/p/example3'
  ],
  collectedAt: '2025-11-15T00:00:00Z',
  validUntil: '2025-12-31T23:59:59Z',

  createdAt: '2025-11-15T00:00:00Z',
  updatedAt: '2025-11-19T10:00:00Z'
};
```

---

## DesignTokens

### 인터페이스

```typescript
export interface DesignTokens {
  colors: ColorTokens;
  typography: TypographyTokens;
  spacing: SpacingTokens;
  shadows: ShadowTokens;
  borderRadius: RadiusTokens;
}

export interface ColorTokens {
  // 브랜드 컬러
  primary: string;
  secondary: string;
  accent: string;

  // 기본 컬러
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;

  // 상태 컬러
  success: string;
  warning: string;
  error: string;
  info: string;

  // 커스텀 팔레트
  palette?: {
    [key: string]: string;         // 자유 컬러
  };
}

export interface TypographyTokens {
  // 폰트 패밀리
  fontFamilies: {
    heading: string;
    body: string;
    mono: string;
  };

  // 폰트 크기
  fontSizes: {
    xs: number;    // 12px
    sm: number;    // 14px
    base: number;  // 16px
    lg: number;    // 18px
    xl: number;    // 20px
    '2xl': number; // 24px
    '3xl': number; // 30px
    '4xl': number; // 36px
    '5xl': number; // 48px
  };

  // 폰트 굵기
  fontWeights: {
    light: number;   // 300
    normal: number;  // 400
    medium: number;  // 500
    semibold: number; // 600
    bold: number;    // 700
  };

  // 줄 간격
  lineHeights: {
    tight: number;   // 1.25
    normal: number;  // 1.5
    relaxed: number; // 1.75
  };
}

export interface SpacingTokens {
  xs: number;    // 4px
  sm: number;    // 8px
  md: number;    // 16px
  lg: number;    // 24px
  xl: number;    // 32px
  '2xl': number; // 48px
  '3xl': number; // 64px
}

export interface ShadowTokens {
  sm: string;   // 작은 그림자
  md: string;   // 중간 그림자
  lg: string;   // 큰 그림자
  xl: string;   // 매우 큰 그림자
}

export interface RadiusTokens {
  none: number;  // 0
  sm: number;    // 2px
  md: number;    // 4px
  lg: number;    // 8px
  xl: number;    // 12px
  full: number;  // 9999px
}
```

### 브랜드 프리셋

```typescript
export interface BrandPreset {
  id: string;
  name: string;
  description?: string;
  tokens: DesignTokens;
  createdAt: string;
  updatedAt: string;
}
```

---

## EditorCommand

### 인터페이스

```typescript
export type EditorCommand =
  // 스타일 업데이트
  | {
      type: 'UPDATE_STYLE';
      targetIds: string[];
      style: Partial<EditorObjectBase>;
    }

  // 텍스트 교체
  | {
      type: 'REPLACE_TEXT';
      targetIds: string[];
      text: string;
    }

  // 이미지 교체
  | {
      type: 'SWAP_IMAGE';
      targetId: string;
      imageUrl: string;
    }

  // 레이아웃 재배치
  | {
      type: 'REARRANGE_LAYOUT';
      pageId: string;
      layout: 'grid' | 'stack' | 'hero-left' | 'hero-right';
    }

  // 브랜드 프리셋 적용
  | {
      type: 'APPLY_BRAND_PRESET';
      presetId: string;
    }

  // 객체 추가
  | {
      type: 'ADD_OBJECT';
      pageId: string;
      object: EditorObject;
    }

  // 객체 제거
  | {
      type: 'REMOVE_OBJECT';
      targetIds: string[];
    }

  // 페이지 생성 (템플릿 기반)
  | {
      type: 'CREATE_PAGE_FROM_TEMPLATE';
      templateId: string;
      position?: number;
    }

  // 디자인 토큰 설정
  | {
      type: 'SET_TOKENS';
      tokens: DesignTokens;
    };
```

### 사용 예시

```typescript
// AI가 생성한 명령
const commands: EditorCommand[] = [
  {
    type: 'UPDATE_STYLE',
    targetIds: ['text-1'],
    style: { fontSize: 48, fontWeight: 'bold' }
  },
  {
    type: 'REPLACE_TEXT',
    targetIds: ['text-1'],
    text: 'New Headline'
  }
];

// CommandExecutor로 실행
commands.forEach(cmd => {
  CommandExecutor.execute(cmd, editorStore);
});
```

---

## EditorStore State

### 인터페이스

```typescript
export interface EditorState {
  // 문서
  document: EditorDocument | null;
  activePageId: string | null;

  // 선택
  selectedIds: string[];
  hoveredId: string | null;

  // 클립보드
  clipboard: EditorObject | null;

  // 캔버스 뷰
  zoom: number;                    // 0.1 ~ 5.0
  pan: { x: number; y: number };
  canvasSize: { width: number; height: number };

  // UI
  tool: EditorTool;
  showGrid: boolean;
  snapToGrid: boolean;
  showRulers: boolean;
  showGuides: boolean;

  // 히스토리
  history: {
    past: EditorDocument[];
    future: EditorDocument[];
    maxHistory: number;
  };

  // 패널
  panels: {
    leftPanelOpen: boolean;
    rightPanelOpen: boolean;
    rightPanelTab: RightPanelTab;
  };

  // 멀티 문서 (Phase 2)
  openDocuments?: string[];        // 열린 문서 ID 배열
  activeDocumentId?: string;       // 활성 문서 ID
}

export type EditorTool =
  | 'select'     // 선택 도구
  | 'hand'       // 핸드 도구 (팬)
  | 'text'       // 텍스트 도구
  | 'shape'      // 도형 도구
  | 'image'      // 이미지 도구
  | 'pen';       // 펜 도구

export type RightPanelTab =
  | 'inspector'  // 속성 패널
  | 'layers'     // 레이어 패널
  | 'chat'       // 챗 패널
  | 'brand'      // 브랜드 패널
  | 'data';      // 데이터 패널
```

---

## 타입 가드 함수

```typescript
export function isTextObject(obj: EditorObject): obj is TextObject {
  return obj.type === 'text';
}

export function isImageObject(obj: EditorObject): obj is ImageObject {
  return obj.type === 'image';
}

export function isShapeObject(obj: EditorObject): obj is ShapeObject {
  return obj.type === 'shape';
}

export function isGroupObject(obj: EditorObject): obj is GroupObject {
  return obj.type === 'group';
}
```

---

## 다음 문서

- [003_COMPONENT_SPEC.md](./003_COMPONENT_SPEC.md) - 컴포넌트 설계
- [005_PHASE1_IMPLEMENTATION.md](./005_PHASE1_IMPLEMENTATION.md) - Phase 1 구현 가이드

---

**문서 버전**: v3.0.0
**마지막 업데이트**: 2025-11-19
