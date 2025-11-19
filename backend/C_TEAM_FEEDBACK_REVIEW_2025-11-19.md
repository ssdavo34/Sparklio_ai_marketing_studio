# C팀 회신 검토 및 B팀 액션 플랜

**작성**: B팀 (Backend Team)
**검토일**: 2025-11-19
**기준 문서**: `frontend/docs/C_TEAM_RESPONSE_2025-11-19.md`

---

## 📋 요약

C팀으로부터 **매우 상세하고 건설적인 피드백**을 받았습니다! 🎉

**핵심 인사이트**:
1. ⚠️ **Konva는 JSON 직렬화를 사용하지 않음** - Fabric.js와 완전히 다른 접근 방식
2. ✅ **Backend는 추상 스펙만 제공**하고, Frontend가 Konva Components로 변환
3. 🎯 C팀이 **완전한 타입 시스템**(350줄)과 **Zustand Store**(450줄)를 이미 구현함
4. 📐 **멀티 페이지 지원** 필요 (SNS 1:1/4:5/9:16 세트)
5. 🎨 **Flat structure 선호** (성능 최적화)

---

## ✅ C팀이 제공한 정보

### 1. Konva 구조 이해 ✅

**핵심**:
- Konva는 **React Component 기반** (`react-konva` 사용)
- Backend → Frontend 데이터 흐름:
  ```
  Backend 추상 JSON
    ↓
  Frontend Adapter (C팀 구현)
    ↓
  EditorDocument (Zustand Store)
    ↓
  Konva <Stage>, <Layer>, <Text>, <Image> Components
  ```

**B팀 액션**:
- ✅ Konva JSON 생성 불필요 (기존 계획 변경)
- ✅ 추상 스펙 제공에 집중

---

### 2. Element 역할 정의 ✅

C팀이 정의한 역할:

#### TextRole
- `headline` - 최대 50자, 36~72px
- `subheadline` - 최대 100자, 24~48px
- `body` - 14~24px
- `caption` - 최대 200자, 12~16px
- `cta` - 최대 20자, 16~24px

#### ObjectType
- `text`, `image`, `shape`, `frame`, `group`

#### ShapeType
- `rect`, `circle`, `ellipse`, `triangle`, `polygon`, `line`, `arrow`

**B팀 액션**:
- ✅ 이 역할을 Generator/Agent 출력에 반영
- ✅ 타입 validation 추가

---

### 3. 렌더링 요구사항 ✅

**필수 속성**:
- 위치: `x`, `y`
- 크기: `width`, `height`
- 회전: `rotation` (deg)
- 투명도: `opacity` (0~1)
- 레이어: `zIndex`
- 상태: `visible`, `locked`
- ID: `id` (고유)

**폰트**:
- Pretendard, Roboto, Noto Sans KR
- 가중치, 스타일, 정렬, 줄 간격, 자간

**이미지**:
- HTTPS URL (S3 presigned URL)
- 크롭, 필터 지원
- `fallback`, `alt` 속성

**배경**:
- color, gradient, image

---

### 4. 구조 개선 제안 ✅

#### 🔧 제안 1: 멀티 페이지 구조

**기존 B팀 제안**:
```json
{
  "layout": { "width": 1200 },
  "elements": [...]
}
```

**C팀 제안** (채택!):
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
        "objects": [...]
      }
    ]
  }
}
```

**B팀 결정**: ✅ **C팀 제안 채택**
- SNS 세트 (1:1, 4:5, 9:16) 동시 생성 가능
- 프레젠테이션 슬라이드 지원 확장 용이

---

#### 🔧 제안 2: Flat Structure

**기존 B팀 제안**:
```json
{
  "style": { "fontSize": 48 },
  "position": { "x": 100 },
  "size": { "width": 800 }
}
```

**C팀 제안** (채택!):
```json
{
  "x": 100,
  "y": 100,
  "width": 800,
  "fontSize": 48
}
```

**B팀 결정**: ✅ **C팀 제안 채택**
- 성능 최적화
- TypeScript 타입 정의 간소화
- Konva 네이티브 구조와 호환

---

#### 🔧 제안 3: 필수 속성 추가

C팀 요청:
- `id` (필수)
- `zIndex` (레이어 순서)
- `rotation` (회전)
- `opacity` (투명도)
- `visible` (가시성)
- `locked` (편집 잠금)

**B팀 결정**: ✅ **모두 채택**

---

#### 🔧 제안 4: 이미지 로딩/그라데이션

C팀 요청:
- 이미지: `loading`, `fallback`, `alt`
- 배경: `gradient` 지원 (linear, radial)

**B팀 결정**: ✅ **채택**

---

#### 🔧 제안 5: TypeScript 타입 정의

C팀 요청:
- OpenAPI 스펙 또는 TypeScript 타입 공유
- JSON Schema / Zod Schema 제공

**B팀 결정**: ✅ **채택**
- `backend/types/canvas.ts` 생성 (Frontend와 공유)
- Pydantic 모델 → TypeScript 자동 변환

---

## 🎯 B팀 최종 결정: Backend 추상 스펙 v2.0

C팀 피드백을 모두 반영한 **최종 스펙**:

```json
{
  "document": {
    "id": "doc_abc123",
    "kind": "product_detail",
    "brandId": "brand_001",
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
        "id": "page_1",
        "name": "Main",
        "width": 1080,
        "height": 1350,
        "background": {
          "type": "color",
          "value": "#ffffff"
        },
        "objects": [
          {
            "id": "obj_001",
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
            "fontStyle": "normal",
            "textAlign": "left",
            "lineHeight": 1.2,
            "letterSpacing": 0,
            "fill": "#1f2937",
            "rotation": 0,
            "opacity": 1.0,
            "visible": true,
            "locked": false,
            "zIndex": 1
          },
          {
            "id": "obj_002",
            "type": "image",
            "role": "main_visual",
            "name": "제품 이미지",
            "src": "https://s3.amazonaws.com/sparklio/products/earbuds.png",
            "x": 100,
            "y": 200,
            "width": 880,
            "height": 660,
            "crop": null,
            "filters": null,
            "loading": "lazy",
            "fallback": "https://s3.amazonaws.com/sparklio/placeholder.png",
            "alt": "무선 이어폰 제품 이미지",
            "rotation": 0,
            "opacity": 1.0,
            "visible": true,
            "locked": false,
            "zIndex": 2
          },
          {
            "id": "obj_003",
            "type": "shape",
            "role": "cta_button",
            "name": "구매 버튼 배경",
            "shapeType": "rect",
            "x": 100,
            "y": 1000,
            "width": 200,
            "height": 60,
            "fill": "#3b82f6",
            "stroke": null,
            "strokeWidth": 0,
            "cornerRadius": 8,
            "rotation": 0,
            "opacity": 1.0,
            "visible": true,
            "locked": false,
            "zIndex": 3
          }
        ]
      }
    ]
  },
  "text": {
    "headline": "완벽한 소음 차단의 시작",
    "subheadline": "프리미엄 노이즈 캔슬링",
    "body": "당신의 일상에 집중할 수 있는 완벽한 정숙함...",
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

## 📋 B팀 액션 아이템 (우선순위)

### P0: 즉시 시작 (오늘~내일)

#### [TASK-A] 추상 스펙 v2.0 확정 문서 작성 ⭐⭐⭐
- **소요**: 2시간
- **산출물**: `docs/BACKEND_CANVAS_SPEC_V2.md`
- **내용**:
  - 최종 JSON 구조
  - 필드별 설명 및 제약사항
  - ObjectType별 필수/선택 속성
  - 예시 (product_detail, sns, presentation)

#### [TASK-B] Pydantic 스키마 생성 ⭐⭐⭐
- **소요**: 3시간
- **산출물**: `app/schemas/canvas.py`
- **내용**:
  ```python
  # app/schemas/canvas.py
  from pydantic import BaseModel, Field
  from typing import List, Optional, Literal

  class BackgroundColor(BaseModel):
      type: Literal["color"] = "color"
      value: str = Field(..., pattern="^#[0-9A-Fa-f]{6}$")

  class BackgroundGradient(BaseModel):
      type: Literal["gradient"] = "gradient"
      gradientType: Literal["linear", "radial"]
      angle: Optional[int] = 0
      stops: List[dict]

  class BackendTextObject(BaseModel):
      id: str
      type: Literal["text"] = "text"
      role: Literal["headline", "subheadline", "body", "caption", "cta"]
      text: str
      x: float
      y: float
      width: float
      height: float
      fontSize: int = Field(..., ge=12, le=120)
      fontFamily: str
      # ... 모든 속성

  class BackendPage(BaseModel):
      id: str
      name: str = "Page 1"
      width: int = Field(..., ge=320, le=3840)
      height: int = Field(..., ge=320, le=3840)
      background: BackgroundColor | BackgroundGradient
      objects: List[BackendTextObject | BackendImageObject | BackendShapeObject]

  class BackendDocument(BaseModel):
      id: str
      kind: Literal["product_detail", "sns", "presentation"]
      brandId: Optional[str]
      title: str
      version: str = "2.0"
      pages: List[BackendPage]
  ```

#### [TASK-C] product_detail.json 샘플 생성 ⭐⭐
- **소요**: 1시간
- **산출물**: `backend/samples/product_detail.json`
- **내용**: 실제 제품 상세페이지 예시 (완전한 JSON)

---

### P1: 중요 (내일~모레)

#### [TASK-D] Generator Service 수정 ⭐⭐
- **소요**: 4시간
- **수정 파일**: `app/services/generator/service.py`
- **변경사항**:
  - `_build_response()` 메서드 리팩토링
  - 기존 `canvas_json` → 새 `document` 구조
  - Pydantic 스키마 적용

#### [TASK-E] Canvas Builder 제거/통합 ⭐
- **소요**: 2시간
- **수정 파일**: `app/services/canvas/`
- **변경사항**:
  - `fabric_builder.py` Deprecated 표시
  - 새로운 `document_builder.py` 생성 (추상 스펙 생성)
  - Helper 함수: `create_text_object()`, `create_image_object()` 등

#### [TASK-F] TypeScript 타입 자동 생성 ⭐
- **소요**: 2시간
- **도구**: `pydantic-to-typescript` 또는 수동 생성
- **산출물**: `backend/types/canvas.ts` (Frontend 공유용)

---

### P2: 선택 (여유 시)

#### [TASK-G] OpenAPI 스펙 업데이트
- **소요**: 1시간
- **파일**: `docs/OPENAPI_SPEC_V4_AGENT.md` 업데이트
- **내용**: Generate API 응답 형식 변경 반영

#### [TASK-H] Validation 테스트 작성
- **소요**: 2시간
- **파일**: `tests/test_canvas_schema.py`
- **내용**: Pydantic 스키마 validation 테스트

---

## 🗓️ 협업 일정

| 날짜 | B팀 작업 | C팀 작업 | 비고 |
|------|----------|----------|------|
| **11/19 (오늘)** | - 스펙 문서 작성<br>- Pydantic 스키마 생성<br>- 샘플 데이터 제공 | - Adapter 구현 시작 | |
| **11/20 (내일)** | - Generator Service 수정<br>- TypeScript 타입 생성 | - Adapter 완성<br>- 테스트 케이스 작성 | |
| **11/21 (모레)** | - 테스트 데이터 생성<br>- API 응답 검증 | - Zustand Store 통합 | |
| **11/22-23** | 양팀 협업: E2E 통합 테스트 | | |

---

## 💡 C팀 질문에 대한 답변

### 질문 1: 멀티 페이지 지원 여부

**답변**: ✅ **지원합니다!**

SNS 콘텐츠 생성 시:
```json
{
  "documentId": "doc_sns_001",
  "kind": "sns",
  "pages": [
    { "id": "p1", "name": "Instagram 1:1", "width": 1080, "height": 1080, "objects": [...] },
    { "id": "p2", "name": "Instagram 4:5", "width": 1080, "height": 1350, "objects": [...] },
    { "id": "p3", "name": "Instagram Story 9:16", "width": 1080, "height": 1920, "objects": [...] }
  ]
}
```

**구현 방식**:
- Generator가 `kind="sns"` 감지 시 3개 페이지 자동 생성
- 동일한 텍스트/이미지, 레이아웃만 비율별 조정
- Workflow: `Copywriter (1회) → 3개 Canvas 생성`

---

### 질문 2: 브랜드 키트 정보

**답변**: ✅ **포함합니다!**

```json
{
  "document": {
    ...
    "brand": {
      "colors": {
        "primary": "#3b82f6",
        "secondary": "#8b5cf6",
        "accent": "#10b981",
        "neutral": {
          "50": "#f9fafb",
          "900": "#111827"
        }
      },
      "fonts": {
        "heading": "Pretendard",
        "body": "Noto Sans KR",
        "code": "JetBrains Mono"
      },
      "logo": {
        "url": "https://s3.../logo.png",
        "width": 200,
        "height": 60
      },
      "spacing": {
        "unit": 8,
        "scale": [4, 8, 12, 16, 24, 32, 48, 64]
      }
    }
  }
}
```

**구현 방식**:
- `brandId`로 DB에서 브랜드 정보 조회
- Generator 응답에 자동 포함
- Frontend가 에디터 UI (컬러 피커, 폰트 선택기)에 활용

---

## ✅ 체크리스트

오늘 작업:
- [x] C팀 회신 검토 완료
- [x] B팀 액션 플랜 수립
- [ ] [TASK-A] 추상 스펙 v2.0 문서 작성
- [ ] [TASK-B] Pydantic 스키마 생성
- [ ] [TASK-C] product_detail.json 샘플 생성

내일 작업:
- [ ] [TASK-D] Generator Service 수정
- [ ] [TASK-E] Canvas Builder 리팩토링
- [ ] [TASK-F] TypeScript 타입 생성

---

## 📞 다음 액션

### B팀 (즉시)
1. 이 검토 문서를 C팀과 공유 (Slack)
2. [TASK-A~C] 착수 (오늘 완료 목표)
3. 샘플 데이터 제공 → C팀 Adapter 개발 지원

### C팀 (대기)
1. B팀 샘플 데이터 받으면 Adapter 테스트
2. 타입 불일치/누락 즉시 피드백

### 양팀 (11/22~)
1. E2E 통합 테스트
2. 에지 케이스 검증
3. 성능 측정

---

**검토 완료!**

**작성**: B팀 Backend
**검토일**: 2025-11-19
**다음 리뷰**: 2025-11-20 (C팀 Adapter 완성 후)
