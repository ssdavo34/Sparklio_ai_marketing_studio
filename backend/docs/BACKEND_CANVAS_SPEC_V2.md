# Backend Canvas 추상 스펙 v2.0

**작성일**: 2025-11-19
**작성자**: B팀 (Backend Team)
**버전**: 2.0
**상태**: 확정 (C팀 피드백 반영 완료)

---

## 📋 목차

1. [개요](#개요)
2. [설계 원칙](#설계-원칙)
3. [전체 구조](#전체-구조)
4. [Document 스키마](#document-스키마)
5. [Page 스키마](#page-스키마)
6. [Object 스키마](#object-스키마)
7. [예시](#예시)
8. [Frontend 연동 가이드](#frontend-연동-가이드)

---

## 개요

### 목적

Backend Canvas 추상 스펙은 **에디터 구현 방식에 독립적인** 문서 표현 형식입니다.

- Backend는 이 추상 스펙만 제공
- Frontend는 Konva/Fabric/Three.js 등 자유롭게 선택
- 동일한 스펙에서 PDF/이미지 Export 등 확장 가능

### 버전 히스토리

| 버전 | 날짜 | 변경사항 |
|------|------|----------|
| **2.0** | 2025-11-19 | C팀 피드백 반영 (멀티페이지, Flat structure, 필수 속성 추가) |
| 1.0 | 2025-11-18 | 초안 (Fabric.js 기반) |

---

## 설계 원칙

### 1. 에디터 독립성 (Editor Agnostic)

❌ **나쁜 예** (Fabric.js 종속):
```json
{
  "version": "5.3.0",
  "objects": [
    { "type": "text", "originX": "left", "strokeDashArray": null }
  ]
}
```

✅ **좋은 예** (추상 스펙):
```json
{
  "objects": [
    { "type": "text", "x": 100, "y": 100, "text": "..." }
  ]
}
```

### 2. Flat Structure (성능 최적화)

❌ **나쁜 예** (중첩 구조):
```json
{
  "style": { "fontSize": 48, "fill": "#000" },
  "position": { "x": 100, "y": 100 },
  "size": { "width": 800, "height": 60 }
}
```

✅ **좋은 예** (Flat):
```json
{
  "x": 100,
  "y": 100,
  "width": 800,
  "height": 60,
  "fontSize": 48,
  "fill": "#000"
}
```

### 3. 명시적 ID 부여

모든 객체는 **고유 ID**를 가져야 합니다.

```json
{
  "id": "obj_001",  // 필수
  "type": "text",
  ...
}
```

### 4. Role 기반 의미 부여

객체의 **역할(role)**을 명시하여 Frontend가 특별한 처리를 할 수 있도록 합니다.

```json
{
  "type": "text",
  "role": "headline",  // Frontend: 글자 수 제한, 스타일 고정 등
  ...
}
```

---

## 전체 구조

### 최상위 구조

```json
{
  "document": {
    "id": "doc_abc123",
    "kind": "product_detail",
    "brandId": "brand_001",
    "title": "제품 상세페이지",
    "version": "2.0",
    "createdAt": "2025-11-19T10:00:00Z",
    "updatedAt": "2025-11-19T14:30:00Z",
    "brand": { ... },
    "pages": [ ... ]
  },
  "text": { ... },
  "meta": { ... }
}
```

### 구성 요소

| 필드 | 타입 | 설명 |
|------|------|------|
| `document` | DocumentPayload | 에디터 문서 스펙 (Canvas JSON) |
| `text` | TextPayload | LLM 생성 텍스트 (편의용, deprecated 예정) |
| `meta` | MetaPayload | 생성 메타데이터 (workflow, agents, tokens 등) |

---

## Document 스키마

### DocumentPayload

```typescript
interface DocumentPayload {
  id: string;                    // 문서 고유 ID (예: "doc_abc123")
  kind: DocumentKind;            // 문서 종류
  brandId?: string;              // 브랜드 ID (선택)
  title: string;                 // 문서 제목
  version: string;               // 스펙 버전 (현재 "2.0")
  createdAt: string;             // ISO 8601 형식
  updatedAt: string;             // ISO 8601 형식
  brand?: BrandInfo;             // 브랜드 정보 (선택)
  pages: PagePayload[];          // 페이지 배열 (1개 이상)
}
```

### DocumentKind

```typescript
type DocumentKind =
  | "product_detail"     // 제품 상세페이지
  | "sns"                // SNS 콘텐츠 (1:1, 4:5, 9:16 세트)
  | "presentation"       // 프레젠테이션 (멀티 슬라이드)
  | "brand_identity"     // 브랜드 아이덴티티
  | "ad_banner"          // 광고 배너
  ;
```

### BrandInfo

```typescript
interface BrandInfo {
  colors: {
    primary: string;           // HEX (예: "#3b82f6")
    secondary: string;
    accent: string;
    neutral?: {
      50: string;              // 색상 스케일
      100: string;
      // ... 900
    };
  };
  fonts: {
    heading: string;           // 폰트 패밀리 (예: "Pretendard")
    body: string;
    code?: string;
  };
  logo?: {
    url: string;               // 로고 이미지 URL
    width: number;             // px
    height: number;            // px
  };
  spacing?: {
    unit: number;              // 기본 간격 단위 (예: 8)
    scale: number[];           // 간격 스케일 (예: [4, 8, 12, 16, ...])
  };
}
```

---

## Page 스키마

### PagePayload

```typescript
interface PagePayload {
  id: string;                    // 페이지 고유 ID (예: "page_1")
  name?: string;                 // 페이지 이름 (예: "Instagram 1:1")
  width: number;                 // px (320~3840)
  height: number;                // px (320~3840)
  background: Background;        // 배경 스타일
  objects: ObjectPayload[];      // 객체 배열
  order?: number;                // 페이지 순서 (선택, 기본 0)
}
```

### Background

```typescript
type Background = BackgroundColor | BackgroundGradient | BackgroundImage;

interface BackgroundColor {
  type: "color";
  value: string;                 // HEX (예: "#ffffff")
}

interface BackgroundGradient {
  type: "gradient";
  gradientType: "linear" | "radial";
  angle?: number;                // linear인 경우 (0~360)
  stops: GradientStop[];
}

interface GradientStop {
  offset: number;                // 0.0 ~ 1.0
  color: string;                 // HEX
}

interface BackgroundImage {
  type: "image";
  src: string;                   // 이미지 URL
  fit: "cover" | "contain" | "fill";
  opacity?: number;              // 0.0 ~ 1.0
}
```

---

## Object 스키마

### ObjectPayload (Union Type)

```typescript
type ObjectPayload =
  | TextObject
  | ImageObject
  | ShapeObject
  | FrameObject
  | GroupObject
  ;
```

### 공통 속성 (BaseObject)

모든 객체가 공통으로 가지는 속성:

```typescript
interface BaseObject {
  // 필수 속성
  id: string;                    // 객체 고유 ID (예: "obj_001")
  type: ObjectType;              // 객체 타입
  x: number;                     // 위치 (px, Canvas 기준 좌상단)
  y: number;                     // 위치 (px)
  width: number;                 // 크기 (px)
  height: number;                // 크기 (px)

  // 선택 속성
  name?: string;                 // 레이어 이름 (예: "제품명 텍스트")
  role?: string;                 // 역할 (예: "headline", "main_visual")
  rotation?: number;             // 회전 각도 (deg, 0~360, 기본 0)
  opacity?: number;              // 투명도 (0.0~1.0, 기본 1.0)
  visible?: boolean;             // 가시성 (기본 true)
  locked?: boolean;              // 편집 잠금 (기본 false)
  zIndex?: number;               // 레이어 순서 (높을수록 위, 기본 배열 순서)
}
```

### ObjectType

```typescript
type ObjectType =
  | "text"       // 텍스트
  | "image"      // 이미지
  | "shape"      // 도형
  | "frame"      // 프레임 컨테이너
  | "group"      // 그룹
  ;
```

---

### TextObject

```typescript
interface TextObject extends BaseObject {
  type: "text";
  role?: TextRole;               // 텍스트 역할

  // 텍스트 내용
  text: string;                  // 실제 텍스트 내용

  // 폰트 스타일
  fontSize: number;              // 12~120px
  fontFamily: string;            // 예: "Pretendard", "Noto Sans KR"
  fontWeight?: FontWeight;       // 기본 "normal"
  fontStyle?: "normal" | "italic";  // 기본 "normal"

  // 텍스트 정렬 및 레이아웃
  textAlign?: "left" | "center" | "right" | "justify";  // 기본 "left"
  verticalAlign?: "top" | "middle" | "bottom";          // 기본 "top"
  lineHeight?: number;           // 배수 (예: 1.5, 기본 1.2)
  letterSpacing?: number;        // px (기본 0)

  // 색상
  fill: string;                  // HEX 또는 RGBA (예: "#1f2937")
  stroke?: string;               // 외곽선 색상 (선택)
  strokeWidth?: number;          // 외곽선 두께 (선택, 기본 0)

  // 장식
  underline?: boolean;           // 밑줄 (기본 false)
  linethrough?: boolean;         // 취소선 (기본 false)
}
```

#### TextRole

```typescript
type TextRole =
  | "headline"       // 메인 헤드라인 (최대 50자, 36~72px)
  | "subheadline"    // 서브 헤드라인 (최대 100자, 24~48px)
  | "body"           // 본문 (14~24px)
  | "caption"        // 캡션 (최대 200자, 12~16px)
  | "cta"            // CTA 버튼 텍스트 (최대 20자, 16~24px)
  ;
```

#### FontWeight

```typescript
type FontWeight =
  | "normal"
  | "bold"
  | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900
  ;
```

---

### ImageObject

```typescript
interface ImageObject extends BaseObject {
  type: "image";
  role?: "main_visual" | "product_image" | "logo" | "thumbnail";

  // 이미지 소스
  src: string;                   // 이미지 URL (HTTPS, S3 presigned URL 권장)
  alt?: string;                  // 대체 텍스트 (접근성)

  // 로딩
  loading?: "eager" | "lazy";    // 로딩 전략 (기본 "lazy")
  fallback?: string;             // 로딩 실패 시 대체 이미지 URL

  // 크롭 (선택)
  crop?: {
    x: number;                   // 크롭 시작 위치 (원본 이미지 기준)
    y: number;
    width: number;               // 크롭 크기
    height: number;
  };

  // 필터 (선택)
  filters?: {
    brightness?: number;         // 0.0~2.0 (1.0 = 원본)
    contrast?: number;           // 0.0~2.0 (1.0 = 원본)
    saturation?: number;         // 0.0~2.0 (1.0 = 원본)
    blur?: number;               // 0~10 (0 = 블러 없음)
  };

  // 메타데이터 (선택)
  assetId?: string;              // Backend Asset ID (DB 연결용)
}
```

---

### ShapeObject

```typescript
interface ShapeObject extends BaseObject {
  type: "shape";
  role?: "cta_button" | "background" | "decoration";

  // 도형 종류
  shapeType: ShapeType;

  // 색상
  fill?: string;                 // 채우기 색상 (HEX 또는 RGBA)
  stroke?: string;               // 외곽선 색상
  strokeWidth?: number;          // 외곽선 두께 (px, 기본 0)

  // 도형별 추가 속성
  cornerRadius?: number;         // rect: 모서리 둥글기 (px)
  radius?: number;               // circle: 반지름
  radiusX?: number;              // ellipse: X축 반지름
  radiusY?: number;              // ellipse: Y축 반지름
  sides?: number;                // polygon: 변의 개수
  points?: number[];             // line, arrow: 좌표 배열 [x1, y1, x2, y2, ...]
  pointerLength?: number;        // arrow: 화살표 길이
}
```

#### ShapeType

```typescript
type ShapeType =
  | "rect"       // 사각형
  | "circle"     // 원
  | "ellipse"    // 타원
  | "triangle"   // 삼각형
  | "polygon"    // 다각형
  | "line"       // 선
  | "arrow"      // 화살표
  ;
```

---

### FrameObject

```typescript
interface FrameObject extends BaseObject {
  type: "frame";
  role?: "container" | "section";

  // 내부 객체
  children: ObjectPayload[];     // 프레임 내부 객체 배열

  // 프레임 스타일
  background?: Background;       // 프레임 배경 (선택)
  padding?: number;              // 내부 여백 (px, 기본 0)
  border?: {
    width: number;               // 테두리 두께 (px)
    color: string;               // 테두리 색상 (HEX)
    radius?: number;             // 모서리 둥글기 (px)
  };
}
```

---

### GroupObject

```typescript
interface GroupObject extends BaseObject {
  type: "group";

  // 그룹 내 객체
  children: ObjectPayload[];     // 그룹화된 객체 배열
}
```

---

## 예시

### 1. Product Detail (단일 페이지)

```json
{
  "document": {
    "id": "doc_product_001",
    "kind": "product_detail",
    "brandId": "brand_sparklio",
    "title": "무선 이어폰 상세페이지",
    "version": "2.0",
    "createdAt": "2025-11-19T10:00:00Z",
    "updatedAt": "2025-11-19T14:30:00Z",
    "brand": {
      "colors": {
        "primary": "#3b82f6",
        "secondary": "#8b5cf6",
        "accent": "#10b981"
      },
      "fonts": {
        "heading": "Pretendard",
        "body": "Noto Sans KR"
      },
      "logo": {
        "url": "https://s3.amazonaws.com/sparklio/brand/logo.png",
        "width": 200,
        "height": 60
      }
    },
    "pages": [
      {
        "id": "page_main",
        "name": "Main",
        "width": 1080,
        "height": 1350,
        "background": {
          "type": "color",
          "value": "#ffffff"
        },
        "objects": [
          {
            "id": "obj_headline",
            "type": "text",
            "role": "headline",
            "name": "제품명",
            "text": "완벽한 소음 차단의 시작",
            "x": 100,
            "y": 100,
            "width": 880,
            "height": 60,
            "fontSize": 48,
            "fontFamily": "Pretendard",
            "fontWeight": "bold",
            "textAlign": "left",
            "lineHeight": 1.2,
            "fill": "#1f2937",
            "zIndex": 1
          },
          {
            "id": "obj_main_image",
            "type": "image",
            "role": "main_visual",
            "name": "제품 이미지",
            "src": "https://s3.amazonaws.com/sparklio/products/earbuds.png",
            "alt": "무선 이어폰 제품 이미지",
            "x": 100,
            "y": 200,
            "width": 880,
            "height": 660,
            "loading": "lazy",
            "fallback": "https://s3.amazonaws.com/sparklio/placeholder.png",
            "zIndex": 2
          },
          {
            "id": "obj_cta_bg",
            "type": "shape",
            "role": "cta_button",
            "name": "구매 버튼 배경",
            "shapeType": "rect",
            "x": 100,
            "y": 1000,
            "width": 200,
            "height": 60,
            "fill": "#3b82f6",
            "cornerRadius": 8,
            "zIndex": 3
          },
          {
            "id": "obj_cta_text",
            "type": "text",
            "role": "cta",
            "name": "구매 버튼 텍스트",
            "text": "지금 구매하기",
            "x": 150,
            "y": 1018,
            "width": 100,
            "height": 24,
            "fontSize": 18,
            "fontFamily": "Pretendard",
            "fontWeight": "bold",
            "textAlign": "center",
            "fill": "#ffffff",
            "zIndex": 4
          }
        ]
      }
    ]
  },
  "text": {
    "headline": "완벽한 소음 차단의 시작",
    "subheadline": "프리미엄 노이즈 캔슬링",
    "body": "당신의 일상에 집중할 수 있는 완벽한 정숙함을 경험하세요...",
    "bullets": ["ANC 기술", "30시간 재생", "IPX4 방수"],
    "cta": "지금 구매하기"
  },
  "meta": {
    "workflow": "product_content_pipeline",
    "agents_used": ["copywriter", "reviewer", "optimizer"],
    "elapsed_seconds": 12.5,
    "tokens_used": 1250
  }
}
```

---

### 2. SNS 콘텐츠 세트 (멀티 페이지)

```json
{
  "document": {
    "id": "doc_sns_001",
    "kind": "sns",
    "brandId": "brand_sparklio",
    "title": "무선 이어폰 SNS 세트",
    "version": "2.0",
    "pages": [
      {
        "id": "page_1x1",
        "name": "Instagram 1:1",
        "width": 1080,
        "height": 1080,
        "background": {
          "type": "gradient",
          "gradientType": "linear",
          "angle": 45,
          "stops": [
            { "offset": 0, "color": "#3b82f6" },
            { "offset": 1, "color": "#8b5cf6" }
          ]
        },
        "objects": [
          {
            "id": "obj_headline_1x1",
            "type": "text",
            "role": "headline",
            "text": "완벽한 소음 차단",
            "x": 540,
            "y": 400,
            "width": 600,
            "height": 80,
            "fontSize": 56,
            "fontFamily": "Pretendard",
            "fontWeight": "bold",
            "textAlign": "center",
            "fill": "#ffffff",
            "zIndex": 1
          }
        ]
      },
      {
        "id": "page_4x5",
        "name": "Instagram 4:5",
        "width": 1080,
        "height": 1350,
        "background": {
          "type": "gradient",
          "gradientType": "linear",
          "angle": 45,
          "stops": [
            { "offset": 0, "color": "#3b82f6" },
            { "offset": 1, "color": "#8b5cf6" }
          ]
        },
        "objects": [
          {
            "id": "obj_headline_4x5",
            "type": "text",
            "role": "headline",
            "text": "완벽한 소음 차단",
            "x": 540,
            "y": 600,
            "width": 600,
            "height": 80,
            "fontSize": 56,
            "fontFamily": "Pretendard",
            "fontWeight": "bold",
            "textAlign": "center",
            "fill": "#ffffff",
            "zIndex": 1
          }
        ]
      },
      {
        "id": "page_9x16",
        "name": "Instagram Story 9:16",
        "width": 1080,
        "height": 1920,
        "background": {
          "type": "gradient",
          "gradientType": "linear",
          "angle": 45,
          "stops": [
            { "offset": 0, "color": "#3b82f6" },
            { "offset": 1, "color": "#8b5cf6" }
          ]
        },
        "objects": [
          {
            "id": "obj_headline_9x16",
            "type": "text",
            "role": "headline",
            "text": "완벽한 소음 차단",
            "x": 540,
            "y": 900,
            "width": 600,
            "height": 80,
            "fontSize": 56,
            "fontFamily": "Pretendard",
            "fontWeight": "bold",
            "textAlign": "center",
            "fill": "#ffffff",
            "zIndex": 1
          }
        ]
      }
    ]
  }
}
```

---

## Frontend 연동 가이드

### 1. Adapter 패턴

**Backend 추상 스펙 → Frontend 에디터 형식 변환**

```typescript
// frontend/src/modules/editor/adapters/backend-to-editor.ts

import type { BackendDocument } from '@/types/backend';
import type { EditorDocument } from '@/modules/editor/types';

export function convertBackendToEditor(
  backendDoc: BackendDocument
): EditorDocument {
  return {
    id: backendDoc.id,
    kind: backendDoc.kind,
    title: backendDoc.title,
    brandId: backendDoc.brandId,
    pages: backendDoc.pages.map(convertPage),
    metadata: {
      version: backendDoc.version,
      tags: [],
      description: '',
    },
    createdAt: backendDoc.createdAt,
    updatedAt: backendDoc.updatedAt,
  };
}

function convertPage(backendPage: BackendPage): EditorPage {
  return {
    id: backendPage.id,
    name: backendPage.name || 'Page 1',
    width: backendPage.width,
    height: backendPage.height,
    background: convertBackground(backendPage.background),
    objects: backendPage.objects.map(convertObject),
    order: 0,
  };
}

function convertObject(backendObj: BackendObject): EditorObject {
  const baseProps = {
    id: backendObj.id,
    name: backendObj.name,
    x: backendObj.x,
    y: backendObj.y,
    width: backendObj.width,
    height: backendObj.height,
    rotation: backendObj.rotation || 0,
    opacity: backendObj.opacity || 1.0,
    visible: backendObj.visible !== false,
    locked: backendObj.locked || false,
    zIndex: backendObj.zIndex || 0,
  };

  switch (backendObj.type) {
    case 'text':
      return {
        ...baseProps,
        type: 'text',
        text: backendObj.text,
        fontSize: backendObj.fontSize,
        fontFamily: backendObj.fontFamily,
        fontWeight: backendObj.fontWeight || 'normal',
        fill: backendObj.fill,
        role: backendObj.role,
        // ... 기타 속성
      };

    case 'image':
      return {
        ...baseProps,
        type: 'image',
        src: backendObj.src,
        crop: backendObj.crop,
        filters: backendObj.filters,
        assetId: backendObj.assetId,
        altText: backendObj.alt,
      };

    case 'shape':
      return {
        ...baseProps,
        type: 'shape',
        shapeType: backendObj.shapeType,
        fill: backendObj.fill,
        stroke: backendObj.stroke,
        strokeWidth: backendObj.strokeWidth,
        cornerRadius: backendObj.cornerRadius,
      };

    default:
      throw new Error(`Unknown object type: ${backendObj.type}`);
  }
}
```

---

### 2. Konva 렌더링

```tsx
// frontend/components/KonvaRenderer.tsx

import { Stage, Layer, Text, Rect, Image } from 'react-konva';

function renderObject(obj: EditorObject) {
  switch (obj.type) {
    case 'text':
      return (
        <Text
          key={obj.id}
          text={obj.text}
          x={obj.x}
          y={obj.y}
          fontSize={obj.fontSize}
          fontFamily={obj.fontFamily}
          fill={obj.fill}
          rotation={obj.rotation}
          opacity={obj.opacity}
          visible={obj.visible}
        />
      );

    case 'image':
      return (
        <Image
          key={obj.id}
          image={loadedImage}
          x={obj.x}
          y={obj.y}
          width={obj.width}
          height={obj.height}
          rotation={obj.rotation}
          opacity={obj.opacity}
        />
      );

    case 'shape':
      if (obj.shapeType === 'rect') {
        return (
          <Rect
            key={obj.id}
            x={obj.x}
            y={obj.y}
            width={obj.width}
            height={obj.height}
            fill={obj.fill}
            cornerRadius={obj.cornerRadius}
            rotation={obj.rotation}
            opacity={obj.opacity}
          />
        );
      }
      break;
  }
}

export function KonvaRenderer({ page }: { page: EditorPage }) {
  return (
    <Stage width={page.width} height={page.height}>
      <Layer>
        {page.objects.map(renderObject)}
      </Layer>
    </Stage>
  );
}
```

---

### 3. Validation

```typescript
// frontend/utils/validation.ts

import { z } from 'zod';

const BackgroundColorSchema = z.object({
  type: z.literal('color'),
  value: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
});

const BackendTextObjectSchema = z.object({
  id: z.string(),
  type: z.literal('text'),
  role: z.enum(['headline', 'subheadline', 'body', 'caption', 'cta']).optional(),
  text: z.string(),
  x: z.number(),
  y: z.number(),
  width: z.number().positive(),
  height: z.number().positive(),
  fontSize: z.number().min(12).max(120),
  fontFamily: z.string(),
  fill: z.string(),
  // ... 기타 속성
});

export function validateBackendDocument(data: unknown) {
  return BackendDocumentSchema.parse(data);
}
```

---

## 변경 이력

| 버전 | 날짜 | 작성자 | 변경사항 |
|------|------|--------|----------|
| 2.0 | 2025-11-19 | B팀 | C팀 피드백 반영 (멀티페이지, Flat, 필수 속성) |
| 1.0 | 2025-11-18 | B팀 | 초안 작성 (Fabric.js 기반) |

---

**문서 종료**

**다음 단계**:
- [ ] Pydantic 스키마 구현 (`app/schemas/canvas.py`)
- [ ] 샘플 데이터 생성 (`backend/samples/product_detail.json`)
- [ ] Generator Service 수정 (스펙 v2.0 적용)

---

**작성자**: B팀 Backend
**검토자**: C팀 Frontend (피드백 반영 완료)
**최종 업데이트**: 2025-11-19
