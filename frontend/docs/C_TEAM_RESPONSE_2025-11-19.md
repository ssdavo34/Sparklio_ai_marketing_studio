# C팀 회신 - B팀 협조 요청에 대한 응답

**발신**: C팀 (Frontend Team)
**수신**: B팀 (Backend Team)
**회신일**: 2025-11-19
**기준 문서**: `backend/C_TEAM_COORDINATION_REQUEST_2025-11-19.md`

---

## 📋 회신 요약

✅ **1. Konva JSON 샘플 제공** - 완료
✅ **2. Element 역할 정의** - 완료
✅ **3. 렌더링 요구사항** - 완료
✅ **4. 추상 스펙 피드백** - 완료

---

## 1️⃣ Konva JSON 샘플

### ⚠️ 중요: Konva는 JSON 직렬화를 사용하지 않습니다!

**핵심 포인트**:
- Konva.js는 Fabric.js와 달리 **자체 JSON 직렬화 형식이 없습니다**
- Konva는 **React 컴포넌트 기반**으로 렌더링됩니다 (react-konva 사용)
- 따라서 **Backend는 Konva JSON을 생성할 필요가 없습니다!**

### ✅ C팀이 제안하는 해결책

**Backend는 "추상 스펙"만 제공하고, Frontend가 Konva로 변환합니다.**

```json
{
  "documentId": "doc_abc123",
  "type": "product_detail",
  "version": "1.0",
  "canvas": {
    "width": 1080,
    "height": 1350,
    "background": "#ffffff"
  },
  "objects": [
    {
      "id": "elem_001",
      "type": "text",
      "role": "headline",
      "content": "완벽한 소음 차단의 시작",
      "x": 100,
      "y": 100,
      "width": 880,
      "height": 60,
      "fontSize": 48,
      "fontFamily": "Pretendard",
      "fontWeight": "bold",
      "fill": "#1f2937",
      "textAlign": "left"
    },
    {
      "id": "elem_002",
      "type": "image",
      "role": "main_visual",
      "src": "https://s3.amazonaws.com/sparklio/product.png",
      "x": 100,
      "y": 200,
      "width": 880,
      "height": 660
    },
    {
      "id": "elem_003",
      "type": "shape",
      "role": "cta_button",
      "shapeType": "rect",
      "x": 100,
      "y": 1000,
      "width": 200,
      "height": 60,
      "fill": "#3b82f6",
      "cornerRadius": 8
    }
  ]
}
```

### Frontend 변환 예시 (react-konva)

```tsx
// Frontend Adapter: Backend JSON → Konva Components
import { Stage, Layer, Text, Rect, Image } from 'react-konva';

function renderObject(obj: BackendObject) {
  switch (obj.type) {
    case 'text':
      return (
        <Text
          key={obj.id}
          text={obj.content}
          x={obj.x}
          y={obj.y}
          fontSize={obj.fontSize}
          fontFamily={obj.fontFamily}
          fill={obj.fill}
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
        />
      );
    case 'shape':
      return (
        <Rect
          key={obj.id}
          x={obj.x}
          y={obj.y}
          width={obj.width}
          height={obj.height}
          fill={obj.fill}
          cornerRadius={obj.cornerRadius}
        />
      );
  }
}
```

---

## 2️⃣ Element 역할(Role) 정의

C팀이 현재 구현한 `EditorDocument` 타입 기준으로 정의합니다.

### TextRole (텍스트 역할)

| Role | 설명 | 용도 | 제약사항 |
|------|------|------|----------|
| `headline` | 메인 헤드라인 | 제품명, 페이지 제목 | 최대 50자, 폰트 크기 36~72px |
| `subheadline` | 서브 헤드라인 | 부제, 캐치프레이즈 | 최대 100자, 폰트 크기 24~48px |
| `body` | 본문 텍스트 | 제품 설명, 상세 내용 | 폰트 크기 14~24px |
| `caption` | 캡션 | 이미지 설명, 주석 | 최대 200자, 폰트 크기 12~16px |
| `cta` | CTA 버튼 텍스트 | "구매하기", "자세히 보기" 등 | 최대 20자, 폰트 크기 16~24px |

### ObjectType (객체 타입)

| Type | 설명 | Backend 필수 속성 |
|------|------|------------------|
| `text` | 텍스트 | `content`, `fontSize`, `fontFamily`, `fill` |
| `image` | 이미지 | `src` (URL), `width`, `height` |
| `shape` | 도형 | `shapeType`, `fill`, `width`, `height` |
| `frame` | 프레임 컨테이너 | `children` (내부 객체 배열) |
| `group` | 그룹 | `children` (그룹화된 객체 배열) |

### ShapeType (도형 종류)

| ShapeType | 설명 | 추가 속성 |
|-----------|------|----------|
| `rect` | 사각형 | `cornerRadius` (선택) |
| `circle` | 원 | `radius` |
| `ellipse` | 타원 | `radiusX`, `radiusY` |
| `triangle` | 삼각형 | - |
| `polygon` | 다각형 | `sides` (변의 개수) |
| `line` | 선 | `points` (좌표 배열) |
| `arrow` | 화살표 | `points`, `pointerLength` |

---

## 3️⃣ 렌더링 요구사항

### 필수 메타데이터 체크리스트

#### ✅ 폰트 관련
- [x] **폰트 패밀리**: Pretendard, Roboto, Noto Sans KR
- [x] **폰트 가중치**: 100~900 (또는 normal, bold)
- [x] **폰트 스타일**: normal, italic
- [x] **텍스트 정렬**: left, center, right, justify
- [x] **줄 간격**: lineHeight (배수, 기본 1.5)
- [x] **자간**: letterSpacing (px)

#### ✅ 색상 관련
- [x] **색상 형식**: HEX (#RRGGBB) 또는 RGBA (rgba(r,g,b,a))
- [x] **브랜드 컬러 팔레트**: primary, secondary, accent (각 6종)
- [x] **투명도**: opacity (0~1)

#### ✅ 이미지 관련
- [x] **이미지 URL 형식**: HTTPS URL (S3 presigned URL 권장)
- [x] **이미지 크기**: width, height (px)
- [x] **크롭 정보**: `crop: { x, y, width, height }` (선택)
- [x] **필터**: brightness, contrast, saturation, blur (선택)
- [ ] ~~Base64 인코딩~~ (권장하지 않음, 성능 이슈)

#### ✅ 레이아웃 관련
- [x] **위치**: x, y (px, Canvas 기준)
- [x] **크기**: width, height (px)
- [x] **회전**: rotation (deg, 0~360)
- [x] **레이어 순서**: zIndex (숫자, 높을수록 위)
- [x] **가시성**: visible (boolean)
- [x] **편집 잠금**: locked (boolean)

#### ⚠️ 반응형 지원
- [ ] **모바일/태블릿**: 현재 미지원 (Desktop만)
- [ ] 향후 확장 예정: `breakpoints: { mobile, tablet, desktop }`

#### ❌ 애니메이션
- [ ] **애니메이션 메타데이터**: 현재 미지원
- [ ] Phase 2 이후 검토 예정

### 추가 요구사항

1. **문서 메타데이터**
   ```json
   {
     "documentId": "doc_123",
     "kind": "product_detail",  // 문서 종류
     "brandId": "brand_abc",    // 브랜드 ID (선택)
     "title": "제품 상세페이지",
     "createdAt": "2025-11-19T10:00:00Z",
     "updatedAt": "2025-11-19T14:30:00Z"
   }
   ```

2. **페이지 정보**
   ```json
   {
     "id": "page_1",
     "name": "Main",
     "width": 1080,
     "height": 1350,
     "background": {
       "type": "color",       // 또는 "gradient", "image"
       "value": "#ffffff"
     }
   }
   ```

3. **객체 공통 속성**
   ```json
   {
     "id": "obj_001",          // 필수, 고유 ID
     "type": "text",           // 필수, 객체 타입
     "role": "headline",       // 선택, 역할 (AI가 인식)
     "name": "제품명 텍스트",   // 선택, 레이어 이름
     "x": 100,                 // 필수
     "y": 100,                 // 필수
     "width": 800,             // 필수
     "height": 60,             // 필수
     "rotation": 0,            // 선택, 기본 0
     "opacity": 1.0,           // 선택, 기본 1.0
     "visible": true,          // 선택, 기본 true
     "locked": false,          // 선택, 기본 false
     "zIndex": 1               // 선택, 기본 배열 순서
   }
   ```

---

## 4️⃣ Backend 추상 스펙 피드백

### ✅ 긍정적인 부분

1. **명확한 구조**
   - `position`/`size` 분리가 깔끔함
   - `type`/`role` 구분이 명확함

2. **에디터 독립성**
   - Fabric/Konva 어떤 것이든 변환 가능한 추상 스펙
   - Frontend의 자유도가 높음

3. **확장 가능성**
   - `bindings` 필드로 동적 데이터 연결 가능
   - PDF/이미지 Export 등 확장 용이

### 🔧 개선 필요 부분

#### 1. 구조 변경 제안

**현재 B팀 제안**:
```json
{
  "layout": { "width": 1200, "height": 1600 },
  "elements": [ ... ]
}
```

**C팀 제안** (EditorDocument 기준):
```json
{
  "document": {
    "id": "doc_123",
    "kind": "product_detail",
    "pages": [
      {
        "id": "page_1",
        "width": 1080,
        "height": 1350,
        "background": { "type": "color", "value": "#ffffff" },
        "objects": [ ... ]
      }
    ]
  }
}
```

**이유**:
- 멀티 페이지 지원 (SNS 1:1/4:5/9:16 세트, 프레젠테이션 슬라이드)
- `layout` → `page` 개념으로 확장 가능

#### 2. 객체 속성 통합

**현재**:
```json
{
  "style": { "fontSize": 48 },
  "position": { "x": 100 },
  "size": { "width": 800 }
}
```

**C팀 제안** (flat structure):
```json
{
  "x": 100,
  "y": 100,
  "width": 800,
  "height": 60,
  "fontSize": 48,
  "fontFamily": "Pretendard",
  "fill": "#1f2937"
}
```

**이유**:
- Konva는 flat structure 선호 (성능 최적화)
- 중첩 객체 접근 오버헤드 감소
- TypeScript 타입 정의 간소화

#### 3. 필수 속성 추가

- **`id`**: 모든 객체에 고유 ID 필수 (선택/편집/삭제 시 사용)
- **`zIndex`**: 레이어 순서 명시 (배열 순서만으로는 부족)
- **`rotation`**: 회전 각도 (deg)
- **`opacity`**: 투명도 (0~1)
- **`visible`**: 가시성 (숨김/보임)
- **`locked`**: 편집 잠금 (사용자가 실수로 수정 방지)

#### 4. 이미지 로딩 상태

```json
{
  "type": "image",
  "src": "https://s3.../image.png",
  "loading": "lazy",           // "eager" | "lazy"
  "fallback": "https://.../placeholder.png",  // 로딩 실패 시 대체 이미지
  "alt": "제품 이미지"          // 접근성 (스크린 리더)
}
```

#### 5. 그라데이션 배경 지원

```json
{
  "background": {
    "type": "gradient",
    "gradientType": "linear",   // "linear" | "radial"
    "angle": 45,                // linear인 경우
    "stops": [
      { "offset": 0, "color": "#3b82f6" },
      { "offset": 1, "color": "#8b5cf6" }
    ]
  }
}
```

### 💡 추가 제안

#### 1. TypeScript 타입 정의 제공

Backend가 **OpenAPI 스펙** 또는 **TypeScript 타입 정의**를 함께 제공하면 더 좋습니다.

```typescript
// backend/types/canvas.ts (Frontend와 공유)
export interface BackendDocument {
  documentId: string;
  type: 'product_detail' | 'sns' | 'presentation';
  pages: BackendPage[];
}

export interface BackendPage {
  id: string;
  width: number;
  height: number;
  objects: BackendObject[];
}

export type BackendObject =
  | BackendTextObject
  | BackendImageObject
  | BackendShapeObject;
```

#### 2. 샘플 데이터 제공

Backend가 각 `documentKind`별 **샘플 JSON**을 제공하면 Frontend 개발이 훨씬 빨라집니다.

```
backend/samples/
├── product_detail.json
├── sns_1x1.json
├── sns_4x5.json
└── presentation.json
```

#### 3. Validation Schema

Backend 응답의 유효성을 검증할 수 있도록 **JSON Schema** 또는 **Zod Schema** 제공을 권장합니다.

```typescript
import { z } from 'zod';

const BackendObjectSchema = z.object({
  id: z.string(),
  type: z.enum(['text', 'image', 'shape']),
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
  // ...
});
```

---

## 📄 첨부 파일

### 1. Sparklio EditorDocument 타입 정의 (완전판)
**파일 경로**: `frontend/src/modules/editor/types/document.ts`

이 파일에 C팀이 구현한 **완전한 타입 시스템**이 정의되어 있습니다.
- 350줄의 TypeScript 타입 정의
- TextObject, ImageObject, ShapeObject, FrameObject, GroupObject
- 모든 속성과 설명 포함

### 2. Zustand EditorStore 구현
**파일 경로**: `frontend/src/modules/editor/store/editorStore.ts`

Backend JSON을 어떻게 Frontend State로 관리하는지 참고할 수 있습니다.
- 450줄의 완전한 State 관리 로직
- CRUD, Selection, History, Clipboard 모두 구현

---

## 🔄 제안: Frontend Adapter 방식

### Backend → Frontend 데이터 흐름

```
Backend API
  ↓
  (추상 JSON)
  ↓
Frontend Adapter ← C팀이 구현
  ↓
  (EditorDocument)
  ↓
Zustand Store
  ↓
Konva Renderer
```

### Adapter 예시

```typescript
// frontend/src/modules/editor/adapters/backend-to-editor.ts

import type { BackendDocument } from '@/types/backend';
import type { EditorDocument } from '@/modules/editor/types';

export function convertBackendToEditor(
  backendDoc: BackendDocument
): EditorDocument {
  return {
    id: backendDoc.documentId,
    kind: backendDoc.type,
    title: backendDoc.title || 'Untitled',
    brandId: backendDoc.brandId,
    pages: backendDoc.pages.map(convertPage),
    metadata: {
      version: backendDoc.version,
      tags: [],
      description: '',
    },
    createdAt: backendDoc.createdAt || new Date().toISOString(),
    updatedAt: backendDoc.updatedAt || new Date().toISOString(),
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
        text: backendObj.content,
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

## 📅 협업 일정

### C팀 제안 일정

| 단계 | 작업 | 담당 | 기간 | 상태 |
|------|------|------|------|------|
| **1. 타입 정의** | EditorDocument 완성 | C팀 | 완료 | ✅ |
| **2. Adapter 구현** | Backend → Editor 변환 | C팀 | 1일 | 📅 11/20 |
| **3. Backend 스펙 확정** | 추상 JSON 스펙 | B팀 | 1일 | ⏳ 대기 |
| **4. 샘플 데이터** | product_detail 샘플 | B팀 | 1일 | ⏳ 대기 |
| **5. 통합 테스트** | E2E 테스트 | 양팀 | 2일 | 📅 11/22-23 |

---

## ✅ 체크리스트

- [x] 1. Konva JSON 샘플 제공 완료 (설명: Konva는 JSON 직렬화 없음)
- [x] 2. Element 역할 정의 완료 (TextRole, ObjectType, ShapeType)
- [x] 3. 렌더링 요구사항 공유 완료 (필수 메타데이터 + 추가 요구사항)
- [x] 4. 추상 스펙 피드백 완료 (5가지 개선 사항 + 3가지 추가 제안)
- [ ] B팀에 회신 완료 알림 (Slack) ← **다음 액션**

---

## 💬 추가 논의 사항

### 질문 1: 멀티 페이지 지원 여부

SNS 콘텐츠의 경우 1:1, 4:5, 9:16 세 가지 비율을 동시에 생성해야 합니다.
Backend가 **하나의 documentId에 여러 pages**를 담아서 보낼 수 있나요?

**C팀 희망 구조**:
```json
{
  "documentId": "doc_sns_001",
  "kind": "sns",
  "pages": [
    { "id": "p1", "name": "1:1", "width": 1080, "height": 1080, "objects": [...] },
    { "id": "p2", "name": "4:5", "width": 1080, "height": 1350, "objects": [...] },
    { "id": "p3", "name": "9:16", "width": 1080, "height": 1920, "objects": [...] }
  ]
}
```

### 질문 2: 브랜드 키트 정보

Backend가 Document와 함께 **브랜드 정보 (컬러, 폰트, 로고)**를 함께 보내주나요?

**C팀 희망 구조**:
```json
{
  "documentId": "doc_001",
  "brandId": "brand_abc",
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
      "url": "https://s3.../logo.png",
      "width": 200,
      "height": 60
    }
  },
  "pages": [ ... ]
}
```

---

## 📞 다음 액션

### C팀 (즉시)
- [x] 이 회신 문서 작성 완료
- [ ] B팀에 Slack 알림 (`#backend-frontend-integration`)
- [ ] Adapter 구현 시작 (11/20)

### B팀 (요청)
- [ ] 회신 검토 및 피드백 (11/20)
- [ ] 추상 스펙 확정 (멀티 페이지, 브랜드 정보 포함 여부 결정)
- [ ] 샘플 데이터 제공 (`product_detail.json`)

### 양팀 협업 (11/22~)
- [ ] E2E 통합 테스트
- [ ] 에지 케이스 검증
- [ ] 성능 측정 (렌더링 FPS, 메모리 사용량)

---

**회신 완료!**

**발신**: C팀 Frontend
**회신일**: 2025-11-19
**다음 체크인**: 2025-11-20 오전 (B팀 피드백 대기)

---

## 🔄 변경 이력

| 날짜 | 작성자 | 변경 내용 |
|------|--------|----------|
| 2025-11-19 | C팀 | 초안 작성 및 완료 |
