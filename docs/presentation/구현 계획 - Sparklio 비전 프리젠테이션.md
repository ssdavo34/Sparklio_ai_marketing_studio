아래 텍스트 그대로 복붙해서 “최종 구현 계획서”로 쓰셔도 됩니다.  
(C/B/A팀 공용 기준 문서로 써도 되는 수준으로 정리했습니다.)

---

# 구현 계획 - Sparklio 비전 프리젠테이션

이 계획은 **“Sparklio 비전 데크(Sparklio Vision Deck)”를 핵심 데모 시나리오**로 지원하기 위해,  
현재 프리젠테이션 기능을 단계적으로 업그레이드하는 것을 목표로 한다.

---

## 1. 사용자 검토 포인트 (IMPORTANT)

### 1.1 범위(Scope)

- 대상 기능: Canvas Studio 내 **프리젠테이션 생성·미리보기·편집·내보내기** 전 과정
    
- 목표:
    
    1. Sparklio 비전을 설명할 수 있는 **12–15장 규모**의 슬라이드 구조 지원
        
    2. **브랜드 테마(Brand Kit) 연동**이 가능한 템플릿 구조
        
    3. **SlidesPreviewView에서 직접 편집 가능한 라이트 에디터**
        
    4. **저장/복구 + 내보내기(Export) 최소 기능** 확보
        

### 1.2 B팀 의존성

이 계획은 아래 **백엔드 작업**에 의존한다.  
해당 항목은 B팀 요청서를 통해 별도로 처리된다.

- `PresentationAgent`
    
    - LLM: `claude-3-5-haiku-20241022`로 전환
        
    - 새로운 슬라이드 타입과 12–15장의 구조를 생성하도록 **프롬프트 업데이트**
        
- 프리젠테이션 저장용 API
    
    - `POST /api/v1/presentations`
        
    - `GET /api/v1/presentations/{id}`
        
    - `PATCH /api/v1/presentations/{id}`
        

---

## 2. 시스템 설계 개요

### 2.1 데이터 소스(Single Source of Truth)

- **단일 소스**: `slidesData: SlideData[]`
    
    - 타입 정의 위치: `frontend/types/demo.ts`
        
- 흐름:
    
    1. Backend `PresentationAgent` → `SlideData[]` 생성
        
    2. `useGeneratedAssetsStore` 또는 `usePresentationStore`에 저장
        
    3. `SlidesPreviewView`에서 **텍스트/노트 편집**
        
    4. “Canvas에서 편집” 시, 최신 `slidesData`를 기준으로 Polotno 페이지 재구성
        

> 원칙: **SlidesPreviewView에서의 편집 결과가 항상 최종 진실 데이터**가 되도록 한다.  
> Canvas는 `slidesData`의 “렌더링 표현체”로 취급한다.

---

## 3. Frontend 변경 사항 (C팀)

### 3.1 `demo.ts` – SlideData 확장

#### 3.1.1 slide_type 확장

- 변경 대상: `SlideData.slide_type`
    
- 기존: 제한적 타입(cover, problem, solution, …)
    
- 변경 후: Sparklio 비전 데크용 타입 추가
    

```ts
type SlideType =
  | 'default'              // 기존/알 수 없는 경우 기본값
  | 'cover'
  | 'problem'
  | 'solution'
  | 'features'
  | 'benefits'
  | 'cta'
  // Sparklio Vision Deck 확장
  | 'vision'
  | 'system_architecture'
  | 'agents_overview'
  | 'pipeline'
  | 'roadmap'
  | 'business_model'
  | 'team';
```

- **호환성 규칙**
    
    - 기존 데이터에서 `slide_type`이 없거나 알 수 없는 경우 → `"default"`로 간주
        
    - `"default"` 타입은 기존 템플릿(일반 텍스트 슬라이드 레이아웃)을 사용
        

#### 3.1.2 layout 필드 추가

- 목적: 같은 `slide_type`이라도 다양한 레이아웃을 선택 가능하게 함
    
- 예시 정의:
    

```ts
type SlideLayout =
  | 'standard'
  | 'two_column'
  | 'full_image'
  | 'stats'
  | 'process';
```

```ts
type SlideData = {
  id: string;
  slide_type: SlideType;
  layout?: SlideLayout;    // optional, 없으면 기본값 사용
  title?: string;
  subtitle?: string;
  content?: string;
  bullets?: string[];
  notes?: string;          // 발표자 노트
  // 기타 필드 (이미지/차트용 메타 등은 추후 확장)
};
```

- **기본 매핑 규칙 (문서에 고정 정의)**
    
    - `vision` → 기본 `layout = 'standard'`
        
    - `system_architecture` → 기본 `layout = 'process'`
        
    - `agents_overview` → 기본 `layout = 'two_column'`
        
    - `pipeline` → 기본 `layout = 'process'`
        
    - `roadmap` → 기본 `layout = 'stats'` 또는 커스텀(타임라인)
        
    - `business_model` → 기본 `layout = 'two_column'`
        
    - `team` → 기본 `layout = 'two_column'`
        

> 이 매핑 표는 `slidesTemplate.ts` 구현 시 기준이 되며,  
> layout이 명시되지 않으면 위 기본값을 따른다.

---

### 3.2 `slidesTemplate.ts` – 테마/브랜드 연동

#### 3.2.1 BrandTheme 타입 정의

- 목적: 프리젠테이션 템플릿이 브랜드 키트 정보를 활용 가능하도록 설계
    

```ts
export type BrandTheme = {
  primaryColor: string;
  accentColor?: string;
  backgroundColor?: string;
  fontFamily?: string;
  logoUrl?: string;
};
```

#### 3.2.2 함수 시그니처 확장

```ts
export function buildSlidesPagesFromData(
  slides: SlideData[],
  options?: {
    brandTheme?: BrandTheme;
  }
) {
  // ...
}
```

#### 3.2.3 Fallback 규칙

- `options.brandTheme`가 없는 경우:
    
    - 기존 고정 디자인 사용
        
        - 상단 그라디언트: `#6366F1 → #8B5CF6`
            
        - 기본 폰트: 기존 Noto Sans 등
            
- `brandTheme.logoUrl`이 없으면 로고 영역은 숨김 처리
    

> 이 규칙을 문서에 명시해 두어, BrandKit이 준비되지 않아도  
> 프리젠테이션 기능이 **항상 동작**하도록 한다.

---

### 3.3 `SlidesPreviewView.tsx` – 라이트 에디터 + 저장/내보내기

#### 3.3.1 Light Editor 기능

- 기능:
    
    - 슬라이드 제목/부제목/본문/노트를 **프리뷰 화면에서 직접 편집**
        
    - 구현:
        
        - `contentEditable` 또는 `<input>/<textarea>` 사용
            
        - 변경 시 **직접 `slidesData`를 업데이트**
            
- 설계 원칙:
    
    - **SlidesPreviewView에서의 편집 결과 = `slidesData`의 최신 상태**
        
    - Canvas(Polotno) 편집과의 동기화 전략:
        
        - v1: SlidesPreviewView에서 편집 → `slidesData` 업데이트
            
        - “Canvas에서 편집” 버튼 클릭 시,  
            **현재 `slidesData`를 기준으로 Polotno 페이지를 재구성**한다.
            
        - Canvas 상에서의 레이아웃/디자인 수정은  
            **프리뷰의 텍스트와 충돌하지 않는 방향**으로 제한(텍스트 구조 자체는 `slidesData` 기준 유지)
            

#### 3.3.2 저장 기능

- UI:
    
    - SlidesPreviewView 상단 또는 Toolbar에 `"저장"` 버튼 추가
        
- 동작:
    
    - 클릭 시:
        
        1. 현재 `slidesData`를 읽어서
            
        2. 프론트 스토어의 `saveStatus`를 `saving`으로 변경
            
        3. `/api/v1/presentations/{id}` (또는 POST) 호출
            
        4. 성공 시 `saveStatus = 'saved'`, 실패 시 `saveStatus = 'error'`
            
- 상태 정의 예시:
    

```ts
type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';
```

> 추후 자동 저장(디바운스 기반)을 붙일 수 있도록,  
> “**저장 로직은 훅/스토어에 캡슐화, 버튼은 트리거 역할**”로 설계한다.

#### 3.3.3 내보내기 기능

- UI:
    
    - `"내보내기"` 버튼 추가
        
- v1 동작:
    
    - 기존 `ExportDialog.tsx`를 재사용
        
    - 프리젠테이션 모드에서는:
        
        - “PNG (슬라이드별 이미지)” 옵션만 **활성화**
            
        - “PDF”, “PPTX”는 UI에는 노출하되 **Disabled** 상태로 표시 (향후 계획 시각화)
            

---

### 3.4 `usePresentationStore.ts` – 프리젠테이션 상태 관리

- 목적:
    
    - 프리젠테이션 전용 상태(슬라이드 목록, 활성 슬라이드, 저장 상태)를 일관되게 관리
        
- 상태 예시:
    

```ts
type PresentationState = {
  presentationId?: string;       // /api/v1/presentations/{id}
  slides: SlideData[];
  activeSlideId?: string;
  isDirty: boolean;
  saveStatus: SaveStatus;        // 'idle' | 'saving' | 'saved' | 'error'
};
```

- v1 전략:
    
    - 새로운 파일 `usePresentationStore.ts`를 바로 만들 수도 있지만,
        
    - 초기에는 **`useGeneratedAssetsStore` 내부에 `presentation` 네임스페이스를 추가**하는 방식으로 시작:
        
        - 예: `presentation: PresentationState`
            
    - 추후 복잡도가 높아질 경우:
        
        - 스토어 API(메서드 이름, 파라미터)를 유지한 채,  
            구현만 `usePresentationStore`로 분리할 수 있도록 설계한다.
            

---

## 4. Backend 변경 사항 (B팀 의존)

### 4.1 PresentationAgent – Claude 3.5 Haiku & 구조 확장

- LLM 변경:
    
    - `model = "claude-3-5-haiku-20241022"`
        
- 기능:
    
    - 입력: 사용자 요청 + 브랜드 정보 + 사용 목적(예: “Sparklio 비전 IR 덱”)
        
    - 출력: `SlideData[]` 스키마에 맞는 12–15장 슬라이드
        
- 요구사항:
    
    - `slide_type`과 `layout`은 **frontend `types/demo.ts`와 동일 규격**을 사용
        
    - 발표자 노트(`notes`) 필드를 반드시 포함
        

### 4.2 SlideData 스키마 공유

- 원칙:
    
    - SlideData 구조는 **단일 스펙 문서**에 정의하고,
        
    - 프론트(TypeScript)와 백엔드(Python/Pydantic)가 이를 각각 반영
        
- 방법:
    
    - `docs/SLIDEDATA_SCHEMA.md` (예시) 에 JSON Schema 또는 필드 표로 정의
        
    - `types/demo.ts`와 `backend/app/schemas/presentation.py`가  
        이 문서를 기준으로 동기화되도록 관리
        

### 4.3 `/api/v1/presentations` 엔드포인트

- 예시 스펙:
    

1. `POST /api/v1/presentations`
    
    - Body: `{ slides: SlideData[], meta?: {...} }`
        
    - Response: `{ id: string, ... }`
        
2. `GET /api/v1/presentations/{id}`
    
    - Response: `{ id: string, slides: SlideData[], meta?: {...} }`
        
3. `PATCH /api/v1/presentations/{id}`
    
    - Body: `{ slides?: SlideData[], meta?: {...} }`
        
    - Response: `{ id: string, ... }`
        

> C팀은 이 엔드포인트에 의존해 저장/불러오기를 구현한다.

---

## 5. 검증 계획

### 5.1 수동 검증

#### 5.1.1 Mock 데이터 테스트

- “Sparklio 비전” Mock 데이터(12–15장)를 준비하여:
    
    - `SlidesPreviewView`에서 모든 슬라이드가 정상 렌더링되는지 확인
        
    - 각 `slide_type`에 맞는 기본 `layout`이 적용되어 있는지 확인
        

#### 5.1.2 편집 테스트

1. `SlidesPreviewView`에서 특정 슬라이드를 선택
    
2. 제목/본문/노트를 수정
    
3. 슬라이드 이동(다른 슬라이드로 갔다가 돌아오기)
    
4. 변경 사항이 **유지**되는지 확인
    
5. 저장 버튼 클릭 후 새로고침/재진입 시에도 수정 내용이 유지되는지 확인
    

#### 5.1.3 Canvas 변환 테스트

1. “Canvas에서 편집” 버튼 클릭
    
2. Polotno 캔버스에서:
    
    - BrandTheme의 색상/폰트가 적용됐는지 확인
        
    - 슬라이드 구조가 Preview와 일치하는지 확인
        

#### 5.1.4 내보내기 테스트

1. “내보내기” 버튼 클릭
    
2. `ExportDialog`가 열리는지 확인
    
3. “PNG” 옵션을 선택했을 때:
    
    - 최소한 Mock 동작(파일 다운로드 또는 콘솔 로그 등)이 수행되는지 확인
        
4. “PDF / PPTX”는 Disabled 상태로 표시되는지 확인
    

#### 5.1.5 에러/엣지 케이스

- 슬라이드가 0장일 때:
    
    - Preview/Canvas에서 에러 없이 “빈 상태” UI가 표시되는지
        
- `slide_type`이 정의되지 않은 값일 때:
    
    - `"default"` 타입으로 처리되는지
        
- 저장 실패 시:
    
    - `saveStatus = 'error'`로 전환되고, UI에 에러 상태가 표시되는지
        

### 5.2 (선택) 자동화 테스트

- 최소 1개 이상 단위 테스트 권장 (B/C팀 협의)
    

예시:

- `slidesTemplate.ts` 단위 테스트
    
    - 특정 `SlideData`(`slide_type = 'system_architecture', layout = 'process'`)를 넣었을 때  
        생성되는 레이아웃 구조가 예상된 구조를 따르는지 검증
        

---

## 6. 마이그레이션 및 호환성

1. 기존 6장 Mock 기반 프리젠테이션은:
    
    - `slide_type`이 없으면 `"default"`로 처리
        
    - 기존 레이아웃 로직을 그대로 사용
        
2. 새로운 Sparklio 비전 데크는:
    
    - 확장된 `slide_type`/`layout`과 BrandTheme를 사용
        
    - 기존 기능에 영향을 주지 않고 **병행 사용** 가능
        

---

이 문서 기준으로,

- C팀: `demo.ts`, `slidesTemplate.ts`, `SlidesPreviewView.tsx`, 스토어(USE…) 변경을 우선 진행
    
- B팀: `PresentationAgent` Haiku 전환 + SlideData 스키마 정합 + `/presentations` API 구현
    

까지 진행하면,  
**“Sparklio 비전 프리젠테이션(12–15장)”을 대표 데모로 안정적으로 돌릴 수 있는 v1**을 만들 수 있습니다.