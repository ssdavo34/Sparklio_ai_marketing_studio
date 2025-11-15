# ONE_PAGE_EDITOR_SPEC.md

# Sparklio V4 — One-Page Editor Spec (v1.0)

- 문서명: ONE_PAGE_EDITOR_SPEC.md
- 버전: v1.0
- 작성일: 2025-11-15
- 작성자: SeongEon Park (PM), ChatGPT(설계 보조)
- 상태: Draft (P0 범위 확정용)

---

## 1. 개요 (Overview)

### 1.1 목적

이 문서는 **Sparklio V4의 중앙 에디터인 “One-Page Editor”** 의 기능, 데이터 모델, UI 구조, 에이전트 연동 방식을 정의한다.

One-Page Editor는 다음과 같은 모든 비디오 이외 산출물을 **단일 캔버스 경험**으로 다룬다.

- 브랜드 키트 기반 이미지/브로셔
- 상품 상세페이지/랜딩 페이지
- SNS 카드뉴스·썸네일
- 프리젠테이션(슬라이드)
- 잡지형/포스터형 레이아웃
- 광고용 이미지 크리에이티브

> 원칙: **“어디서 만들든, 결국 같은 에디터에서 수정·완성한다.”**  
> 비디오는 별도 Video Editor를 사용하지만, 레이아웃/콘셉트는 최대한 공유한다.

---

## 2. 시스템 내 역할과 위치

### 2.1 /app 구조에서의 위치

- `/app` 진입 시 기본 플로우:  
  **Landing → Chat(생성 시작) → One-Page Editor(초안 로딩) → Publish**
- 좌측 메뉴에서 선택하는 서비스:
  - 브랜드 킷, 마케팅 브리프, 상품 상세페이지, SNS, 프레젠테이션, 광고 이미지 등
- 각 서비스는:
  - **Generator**를 통해 “초안(JSON + 콘텐츠)”을 생성하고
  - **One-Page Editor**에서 최종 수정·보정한다.

### 2.2 Editor vs Video Editor

- One-Page Editor
  - 이미지·텍스트·레이아웃 중심 산출물
  - Fabric.js 스타일 캔버스, 레이어 중심
- Video Editor (별도 문서에서 정의)
  - 타임라인, 트랙, 키프레임 중심
  - 스토리보드/씬 정보는 가능한 한 공유하되, UI/데이터 모델은 분리

---

## 3. 핵심 UX 원칙

1. **Chat-First, Editor-Second**
   - 사용자는 먼저 챗으로 “무엇을 만들지” 정의
   - Generator가 초안을 만든 후 Editor에서 세밀하게 다듬는다.
2. **Template-First**
   - 무(無)에서 시작하기보다, 항상 “템플릿을 기반으로 수정”하는 흐름을 우선 제공.
3. **Role-Friendly**
   - 디자이너가 아니어도 쉽게 쓸 수 있는 단순한 조작
   - 동시에 디자이너가 사용할 때도 충분한 레이아웃/타이포 제어 제공
4. **일관된 경험**
   - 상품 상세, SNS, 프레젠테이션 등 출력물 종류가 달라도  
     동일한 에디터 구조와 조작 방식 유지.

---

## 4. 화면 구성 (UI Layout)

### 4.1 전체 레이아웃

- 상단: **Top Bar**
- 좌측: **Panel 영역**
  - 탭 구조: Layers / Templates / Assets / History
- 중앙: **Canvas 영역**
- 우측: **Inspector 패널**
  - 선택된 오브젝트 혹은 문서 속성 편집
- 우측/하단: **Chat 패널 (Editor Agent)**
  - 자연어 명령으로 스타일/레이아웃 변경

### 4.2 Top Bar (P0)

- 프로젝트/문서 이름
- Undo / Redo
- Zoom In/Out, Fit, 100%
- Device/Size Preset 선택
  - 예: 1080x1080, 1080x1350, A4, 16:9 등
- Export 버튼
  - PNG/JPEG/PDF (P0)
  - HTML/PPTX (P1 이후)
- “Apply Template” / “Variants” 등 주요 액션 버튼

### 4.3 Left Panel

1. **Layers 탭**
   - 레이어 트리 (그룹/오브젝트 구조)
   - 가시성(toggle), 잠금, 정렬 순서 변경 (Drag & Drop)

2. **Templates 탭**
   - 현재 선택한 Generator 타입에 맞는 템플릿 목록
   - Origin 필터:
     - `image_layout` (잡지 표지/포스터 기반)
     - `text_pattern` (텍스트 패턴 기반)
     - `manual` (디자이너 수동 제작)
   - 템플릿 썸네일 클릭 → 캔버스에 적용 (기존 요소 유지/교체 옵션 선택)

3. **Assets 탭**
   - 브랜드 키트 기반 자산:
     - 로고, 컬러 팔레트, 폰트 스타일, 아이콘, 이미지 등
   - 업로드한 이미지/아이콘

4. **History 탭**
   - 에디터 액션 로그 + Chat 명령과 연결
   - 특정 지점으로 되돌리기 가능

### 4.4 Right Panel (Inspector)

- 선택 대상에 따라 동적 변경:

1. **문서/페이지 선택 시**
   - 캔버스 크기, 배경색, 그리드/가이드 설정
   - 마진/세이프존 설정

2. **텍스트 선택 시**
   - 폰트 패밀리, 크기, 굵기, 자간, 행간
   - 정렬, 색상, 드롭 쉐도우, 아웃라인
   - 프리셋 텍스트 스타일(“헤드라인”, “캡션” 등)

3. **이미지 선택 시**
   - 크기/위치
   - 자르기(Crop)
   - 마스크, 둥근 모서리, 테두리

4. **도형/프레임 선택 시**
   - Fill/Stroke
   - 코너 라운딩
   - 그림자, 블러(필요 시)

### 4.5 Chat 패널 (Editor Agent)

- 위치: 우측 하단 Dock 형태
- 기능:
  - “제목을 더 눈에 띄게 해줘”
  - “전체 톤을 고급스러운 느낌으로 바꿔줘”
  - “이 배너를 1:1 비율 카드뉴스로 변환해줘”
- 내부 동작:
  - 자연어 → Action List(JSON) 변환 → 에디터에 적용
  - 각 액션은 History에 기록

---

## 5. 문서/캔버스 모델

### 5.1 기본 개념

- **Document**
  - 하나의 프로젝트/산출물
- **Page(또는 Artboard)**
  - SNS 카드뉴스 여러 장, 프리젠테이션 슬라이드 등에 해당
- **Layer**
  - 각 Page 안의 오브젝트 계층 구조
- **Object**
  - Text / Image / Shape / Group / Frame / Component 등

### 5.2 JSON 구조 개요

```json
{
  "documentId": "doc_123",
  "type": "product_detail", 
  "brandId": "brand_001",
  "pages": [
    {
      "id": "page_1",
      "name": "Main",
      "width": 1080,
      "height": 1350,
      "background": "#FFFFFF",
      "objects": [
        {
          "id": "obj_title",
          "type": "text",
          "role": "TITLE",
          "bounds": { "x": 80, "y": 120, "width": 920, "height": 120 },
          "props": {
            "text": "제품 한 줄 카피",
            "fontFamily": "Pretendard",
            "fontSize": 48,
            "fontWeight": 700,
            "fill": "#111111",
            "textAlign": "center"
          },
          "bindings": {
            "field": "product.headline"
          }
        },
        {
          "id": "obj_main_image",
          "type": "image",
          "role": "MAIN_VISUAL",
          "bounds": { "x": 100, "y": 280, "width": 880, "height": 600 },
          "props": {
            "src": "https://.../placeholder.png",
            "fit": "cover"
          },
          "bindings": {
            "field": "product.main_image"
          }
        }
      ]
    }
  ]
}
role:

TITLE, SUBTITLE, MAIN_VISUAL, BADGE, CTA_BUTTON, PRICE_TAG 등

bindings.field:

Generator가 채워 넣을 데이터 필드 이름.
```
```
```

## 6. 오브젝트 타입 정의

### 6.1 Text

- 필수 속성:
    
    - `text`, `fontFamily`, `fontSize`, `fontWeight`, `fill`, `textAlign`
        
- 옵션:
    
    - `lineHeight`, `letterSpacing`, `decoration`, `shadow`
        
- 역할:
    
    - 헤드라인, 바디, 캡션, 라벨 등
        

### 6.2 Image

- 필수:
    
    - `src` (또는 placeholder)
        
- 옵션:
    
    - `fit` (cover/contain), `borderRadius`, `stroke`, `shadow`
        
- 역할:
    
    - 제품 이미지, 모델 컷, 아이콘, 패턴 등
        

### 6.3 Shape

- 타입:
    
    - `rect`, `circle`, `triangle`, `line`, `polygon`
        
- 역할:
    
    - 구분선, 박스, 배지, 배경 플레이트 등
        

### 6.4 Frame

- 내부에 다른 오브젝트를 포함하는 컨테이너
    
- 레이아웃:
    
    - `layout: "free" | "vertical" | "horizontal"`
        
    - Auto-layout 유사 기능(P1 이후)
        

### 6.5 Group

- 여러 오브젝트를 묶어 이동/스케일링
    
- 역할:
    
    - 배지(원 + 텍스트), 카드(배경 + 텍스트 + 버튼) 등
        

---

## 7. 템플릿 시스템

### 7.1 템플릿 타입

1. **Layout Template**
    
    - 레이아웃/오브젝트 구조(+ 스타일 기본값)만 정의
        
    - 이미지/텍스트 내용은 Placeholder로 구성
        
    - 출처:
        
        - `image_layout` (잡지 표지 등 → 자동 분석)
            
        - `manual`
            
2. **Content Template (문구 템플릿)**
    
    - “문장 구조, 메시지 흐름”을 LLM이 참고하는 텍스트 템플릿
        
    - 에디터보다는 Generator/LLM 측에서 사용
        
3. **Hybrid Template**
    
    - Layout Template + Content Template의 조합
        

### 7.2 Layout Template JSON 예시

`{   "templateId": "tpl_magazine_style_01",   "origin": "image_layout",   "type": "sns_card",   "industry": ["beauty"],   "channel": ["instagram"],   "persona": ["직장인 여성"],   "document": {     "pages": [       {         "id": "page_1",         "width": 1080,         "height": 1350,         "background": "#FDF8F2",         "objects": [           {             "id": "obj_title",             "type": "text",             "role": "TITLE",             "props": { "fontSize": 52, "fontWeight": 700 },             "bindings": { "field": "headline" }           },           {             "id": "obj_badge",             "type": "group",             "role": "BADGE",             "objects": [               { "type": "circle", "props": { "fill": "#FF5C5C" } },               { "type": "text", "props": { "text": "신상", "fontSize": 18 } }             ]           }         ]       }     ]   } }`

---

## 8. Editor Agent 연동 (자연어 → Action)

### 8.1 Action 모델

Editor Agent는 자연어 명령을 아래 형태의 Action 리스트로 변환한다.

```json
{
  "actions": [
    {
      "type": "update_object",
      "target": { "role": "TITLE" },
      "payload": {
        "props": { "fontSize": 60, "fill": "#FF6600" }
      }
    },
    {
      "type": "apply_template",
      "target": { "pageId": "page_1" },
      "payload": {
        "templateId": "tpl_magazine_style_02",
        "pattern_id": "pattern_001",
        "source": "text_pattern"
      }
    },
    {
      "type": "rearrange_layout",
      "target": { "pageId": "page_1" },
      "payload": {
        "layoutPreset": "magazine_cover_dense"
      }
    }
  ]
}
```

**Action 구조 설명**:
- `type`: Action 타입 (아래 목록 참조)
- `target`: 적용 대상 (role, objectId, pageId 등)
- `payload`: Action별 파라미터
- `pattern_id` (선택): 텍스트 패턴 ID (apply_template 시)
- `source` (선택): 템플릿 출처 (`text_pattern` | `image_layout` | `manual`)

**P0 대표 액션 타입**:

- `update_object` : 색상, 폰트, 크기, 위치 조정
- `replace_image` : 이미지 교체
- `apply_template` : 특정 템플릿으로 교체/병합
- `rearrange_layout` : 역할 단위로 재정렬

**P1 액션 타입**:
- `create_variant` : 비율/포맷을 바꾼 새 페이지 생성 (P1)
- `add_object` : 새 오브젝트 추가 (P1)
- `delete_object` : 오브젝트 삭제 (P1)
    

### 8.2 Undo/History 연동

- 모든 Action은 에디터의 Undo Stack에 push
- History 탭에서 "어떤 Chat 명령 → 어떤 Action들" 이 실행되었는지 확인 가능

### 8.3 Document Save/Load 플로우

#### 8.3.1 문서 저장 (Save)

**API Endpoint**: `POST /api/v1/documents/{docId}/save`

**흐름**:
```
1. 사용자가 수정 완료 또는 Auto-save 트리거 (30초마다)
2. Frontend: Editor Canvas 상태 → Editor JSON 변환
3. POST /api/v1/documents/{docId}/save
   {
     "documentJson": { "pages": [...], "objects": [...] },
     "metadata": {
       "lastEditedAt": "2025-11-15T10:30:00Z",
       "editorVersion": "1.0"
     }
   }
4. Backend: PostgreSQL documents 테이블에 저장
   - document_json: JSONB 컬럼에 저장
   - version: 자동 증가 (버전 관리)
5. Response: { "status": "saved", "version": 2, "savedAt": "..." }
```

**버전 관리**:
- 매 저장 시 version 자동 증가
- History 탭에서 이전 버전 복원 가능 (P1)

#### 8.3.2 문서 로드 (Load)

**API Endpoint**: `GET /api/v1/documents/{docId}`

**흐름**:
```
1. 사용자가 프로젝트 선택 또는 Generator 결과 로딩
2. GET /api/v1/documents/{docId}
3. Backend: PostgreSQL에서 조회
4. Response:
   {
     "id": "doc_123",
     "documentJson": { "pages": [...] },
     "metadata": { ... },
     "version": 2,
     "createdAt": "...",
     "updatedAt": "..."
   }
5. Frontend: Editor JSON → Fabric.js Canvas 렌더링
```

#### 8.3.3 Auto-save 구현

**Frontend 로직** (예시):
```typescript
// useEffect로 30초마다 자동 저장
useEffect(() => {
  const interval = setInterval(() => {
    if (hasUnsavedChanges) {
      await saveDocument(currentDocumentId, editorCanvas.toJSON());
      setHasUnsavedChanges(false);
    }
  }, 30000); // 30초

  return () => clearInterval(interval);
}, [hasUnsavedChanges]);
```

**저장 상태 표시**:
- "저장 중..." → "모든 변경사항 저장됨" (상단 표시)
- 마지막 저장 시간 표시: "2분 전 저장"

---

## 9. Export 및 통합

### 9.1 Export 포맷 (P0)

- PNG, JPEG
    
- PDF (단일/다중 페이지)
    
- 에디터 JSON (DB 저장용)
    

### 9.2 P1 이후

- HTML (간단한 랜딩 페이지)
    
- PPTX (프리젠테이션 내보내기)
    
- Reusable Component Library (헤더/푸터/카드 등)
    

---

## 10. 기술 스택 및 아키텍처

- Frontend
    
    - Next.js + React
        
    - Canvas 라이브러리: Fabric.js 또는 유사 라이브러리 기반 커스텀 래퍼
        
- State 관리
    
    - React Query / Zustand 등으로 캔버스 상태 + 서버 동기화
        
- 저장
    
    - 에디터 JSON은 Backend API 통해 PostgreSQL/MinIO에 저장
        
- 퍼포먼스
    
    - Lazy loading, offscreen canvas, 썸네일 렌더링 최적화
        

---

## 11. 단계별 범위 (P0 / P1)

### P0

- 단일 페이지 기반 캔버스
    
- Text·Image·Shape·Group 관리
    
- Layout Template 적용
    
- Editor Agent 기본 액션 5~6종
    
- PNG/JPEG/PDF Export
    

### P1 이후

- 다중 페이지(SNS 시리즈, 프레젠테이션)
    
- Auto-layout(Frame) 기능
    
- PPTX/HTML Export
    
- Component Library
    
- 고급 Grid/Guides, Smart Align
- 다중 페이지(SNS 시리즈, 프레젠테이션)
    
- Auto-layout(Frame) 기능
    
- PPTX/HTML Export
    
- Component Library
    
- 고급 Grid/Guides, Smart Align
