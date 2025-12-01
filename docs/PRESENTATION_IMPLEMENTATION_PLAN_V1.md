# Sparklio – 프레젠테이션 모듈 B·C팀 설계/구현 계획서 (V1)

## 0. 목표 & 스코프

* **목표**

  * UI 스크린샷에 있는 프레젠테이션 탭을 기준으로
    사용자가 주제·유형·슬라이드 수·비율을 선택하면
    → LLM 에이전트(PresentationAgent)가 **완성된 슬라이드 구조(JSON)**를 생성
    → Canvas(1920×1080 등)에 슬라이드별 레이아웃을 적용해 바로 편집 가능한 상태로 보여주는 것.
* **이번 버전에서 확실히 끝낼 것**

  * `피치 덱` 1종을 **완결된 흐름**으로 구현
  * In-Memory 저장 + 조회/수정 API
  * UI에서 “생성 → 슬라이드 목록 표시 → 선택한 슬라이드 캔버스에 뿌리기”까지

---

## 1. 공통 개념 & 플로우

### 1.1 사용자 플로우 (UI 기준)

1. 좌측 사이드바(프레젠테이션 탭)에서 다음 항목을 선택

   * 프레젠테이션 주제 (텍스트)
   * 프레젠테이션 유형: `피치 덱 / 세일즈 덱 / 투자자 덱 / 비전 덱 / 내부 발표`
   * 슬라이드 수: `8장 / 10장 / 12장 / 15장`
   * 슬라이드 비율: `16:9 / 4:3 / 9:16`
2. **[프레젠테이션 생성] 버튼 클릭**
3. 우측 Chat 패널에 “프레젠테이션 생성 중…” 상태가 잠깐 표시
4. 생성 완료 후:

   * 하단/좌측에 **슬라이드 썸네일 목록** 생김
   * 첫 번째 슬라이드가 캔버스(Polotno)에 표시
5. 사용자는

   * 슬라이드별 텍스트 수정 (캔버스에서 직접)
   * 필요 시 Chat에 “3번 슬라이드를 좀 더 임팩트 있게 바꿔줘” 등 요청 → PATCH API로 반영(2차 버전)

### 1.2 시스템 플로우 (B·C팀 통합)

```text
[1] C팀: 사용자 입력 수집
    topic, deck_type, slide_count, aspect_ratio

[2] C팀 → B팀:
    POST /api/v1/presentations/generate

[3] B팀:
    - PresentationAgent 호출 (LLM Gateway → Claude 3.5 Haiku)
    - deck_type, slide_count에 맞는 슬라이드 JSON 생성
    - In-Memory 저장소에 presentation 저장
    - 응답으로 presentation_id + slides JSON 반환

[4] C팀:
    - 응답 받은 slides를 상태(store)에 저장
    - 슬라이드 썸네일 렌더링
    - 첫 슬라이드를 캔버스에 렌더링(템플릿 적용)

[5] 이후:
    - 슬라이드 내용 수정 → PATCH /api/v1/presentations/{id}
    - 저장된 덱 다시 열기 → GET /api/v1/presentations/{id}
```

---

## 2. B팀 설계

### 2.1 API 정의

#### 2.1.1 프레젠테이션 생성 (LLM 호출 포함)

* **Endpoint**: `POST /api/v1/presentations/generate`
* **목적**:
  UI에서 선택한 값 + 주제를 기반으로 **새 프레젠테이션을 생성**하고,
  슬라이드 구조를 JSON으로 반환한다.
* **Request (예시)**

```json
{
  "project_id": "UUID-OPTIONAL",
  "topic": "Sparklio AI 마케팅 스튜디오 소개",
  "deck_type": "pitch",       // pitch | sales | investor | vision | internal
  "slide_count": 12,          // 8 | 10 | 12 | 15
  "aspect_ratio": "16:9"      // "16:9" | "4:3" | "9:16"
}
```

* **Response (예시)**

```json
{
  "id": "pres_123",
  "project_id": "UUID-OPTIONAL",
  "topic": "Sparklio AI 마케팅 스튜디오 소개",
  "deck_type": "pitch",
  "slide_count": 12,
  "aspect_ratio": "16:9",
  "slides": [
    {
      "id": "s1",
      "order": 1,
      "type": "title",
      "layout": "title_center",
      "title": "Sparklio AI Marketing Studio",
      "subtitle": "브랜드 DNA 기반 AI 마케팅 OS",
      "bullets": [],
      "notes": "발표자 메모(선택)"
    },
    {
      "id": "s2",
      "order": 2,
      "type": "problem",
      "layout": "two_column",
      "title": "마케터가 겪는 문제",
      "bullets": [
        "채널은 늘어나는데 콘텐츠 제작 리소스는 부족",
        "툴은 많지만 하나의 워크플로우로 연결되지 않음",
        "AI를 도입해도 브랜드 일관성 유지가 어려움"
      ],
      "visual_hint": "before_after",
      "notes": ""
    }
    // ... 나머지 슬라이드들
  ],
  "created_at": "2025-11-30T12:00:00Z"
}
```

> **MVP 규칙**
>
> * `deck_type`은 UI에는 5개가 보이지만,
>   실제 구현은 **`pitch` 한 가지만 우선 지원**.
> * 나머지는 `501 Not Implemented` 혹은 `pitch 템플릿 재사용` 중 하나로 처리.

---

#### 2.1.2 프레젠테이션 조회

* **Endpoint**: `GET /api/v1/presentations/{id}`
* **설명**: 저장된 프레젠테이션 전체 구조 조회

```json
{
  "id": "pres_123",
  "topic": "...",
  "deck_type": "pitch",
  "slide_count": 12,
  "aspect_ratio": "16:9",
  "slides": [ ... ]
}
```

---

#### 2.1.3 프레젠테이션 수정 (슬라이드 텍스트 변경용)

* **Endpoint**: `PATCH /api/v1/presentations/{id}`

* **용도**:

  * C팀이 슬라이드 내용을 바꿨을 때
  * Chat 에이전트가 특정 슬라이드만 다시 쓸 때

* **Request 예시 (부분 업데이트)**

```json
{
  "slides": [
    {
      "id": "s3",
      "title": "해결책: Sparklio",
      "bullets": [
        "Brand OS로 브랜드 DNA를 자동 분석/저장",
        "Meeting AI로 회의 → 브리프 변환",
        "One-Page Studio에서 프리젠테이션/상세페이지/인스타/쇼츠까지 자동 생성"
      ]
    }
  ]
}
```

* **응답**: 업데이트된 전체 `presentation` or 최소한 `slides` 배열

---

### 2.2 데이터 모델 (MVP – In-Memory)

#### 2.2.1 Python 스키마(개념)

```python
class Slide(BaseModel):
    id: str
    order: int
    type: str            # title/problem/solution/benefits/features/usecases/pricing/closing/...
    layout: str          # title_center/two_column/three_bullets/comparison/timeline/...
    title: str
    subtitle: Optional[str] = None
    bullets: List[str] = []
    visual_hint: Optional[str] = None
    notes: Optional[str] = None

class Presentation(BaseModel):
    id: str
    project_id: Optional[str]
    topic: str
    deck_type: str
    slide_count: int
    aspect_ratio: str
    slides: List[Slide]
    created_at: datetime
    updated_at: datetime
```

#### 2.2.2 저장소

* MVP: `PRESENTATIONS_DB: Dict[str, Presentation]` 형태의 In-Memory 저장
* 후속: Postgres 테이블 전환

  * `presentations` / `presentation_slides` 2테이블 구조 권장

---

### 2.3 PresentationAgent 스펙

* **파일**: `backend/app/services/agents/presentation.py`
* **역할**:

  * `deck_type + slide_count + topic`을 입력받아
    **일관된 슬라이드 배열**을 생성하는 LLM 래퍼
* **LLM**: Claude 3.5 Haiku (Gateway 통해 호출)

#### 2.3.1 입력

```python
class PresentationAgentInput(BaseModel):
    topic: str
    deck_type: str      # pitch (MVP)
    slide_count: int
    aspect_ratio: str
```

#### 2.3.2 출력 (LLM JSON)

* LLM 프롬프트에서 바로 `slides` 배열을 JSON으로 내도록 지시
* B팀은 이 JSON을 `Slide` 모델로 검증 후 반환

```json
{
  "slides": [
    {
      "order": 1,
      "type": "title",
      "layout": "title_center",
      "title": "...",
      "subtitle": "..."
    },
    {
      "order": 2,
      "type": "problem",
      "layout": "two_column",
      "title": "...",
      "bullets": ["...", "..."]
    }
    // ...
  ]
}
```

#### 2.3.3 Pitch 덱 기본 구조(12장 기준)

PresentationAgent 내부에 **슬라이드 타입 시퀀스**를 고정해 둔다.

1. title
2. problem
3. why_now
4. solution_overview
5. core_modules
6. differentiators
7. demo_flow
8. architecture
9. target_users
10. business_model
11. roadmap_status
12. closing_next_steps

> slide_count가 8/10/15일 때는 일부 타입 생략/분할 규칙만 정의.

---

### 2.4 B팀 TODO 요약

1. `Presentation` / `Slide` Pydantic 모델 정의
2. In-Memory 저장소 및 CRUD 함수
3. `PresentationAgent` 구현

   * LLM Gateway 연동
   * pitch 덱용 system prompt 작성
4. API 3개 구현

   * `POST /api/v1/presentations/generate`
   * `GET /api/v1/presentations/{id}`
   * `PATCH /api/v1/presentations/{id}`
5. 최소 통합 테스트

   * 가짜 topic으로 generate 호출 → slides 길이/구조 검증

---

## 3. C팀 설계

### 3.1 UI 컴포넌트 구조

1. **PresentationSidebar** (좌측 패널)

   * 입력 요소

     * 주제 입력 필드
     * 프레젠테이션 유형 버튼 그룹
     * 슬라이드 수 버튼 그룹
     * 비율 선택 버튼 그룹
     * [프레젠테이션 생성] 버튼
   * 상태: `topic, deckType, slideCount, aspectRatio, isGenerating`

2. **SlidesStrip / SlidesList** (하단 또는 좌측 슬라이드 썸네일 영역)

   * 현재 Presentation의 슬라이드 목록 표시
   * 클릭한 슬라이드를 **현재 활성 슬라이드**로 설정

3. **PresentationCanvasView**

   * 활성 슬라이드를 Polotno 페이지로 렌더링
   * `layout` 타입에 따라 미리 정의된 템플릿을 적용

     * `title_center` → 중앙 헤드라인 + 서브타이틀 텍스트 박스
     * `two_column` → 좌측 불릿, 우측 이미지 자리
     * 등등

4. **Chat 패널 (우측)**

   * 처음 진입 시: “프레젠테이션 도움 설명” 메시지
   * 나중에: 특정 슬라이드 개선 요청 → PATCH API 호출 연결 (2단계 기능)

---

### 3.2 상태 관리 (store 설계 예시)

```ts
type Slide = {
  id: string;
  order: number;
  type: string;
  layout: string;
  title: string;
  subtitle?: string;
  bullets: string[];
  visualHint?: string;
  notes?: string;
};

type PresentationState = {
  currentPresentationId?: string;
  topic: string;
  deckType: 'pitch' | 'sales' | 'investor' | 'vision' | 'internal';
  slideCount: 8 | 10 | 12 | 15;
  aspectRatio: '16:9' | '4:3' | '9:16';

  slides: Slide[];
  activeSlideId?: string;

  isGenerating: boolean;
  error?: string;

  actions: {
    setTopic(...);
    setDeckType(...);
    setSlideCount(...);
    setAspectRatio(...);
    generatePresentation();      // POST /presentations/generate
    setActiveSlide(id: string);
    updateSlideContent(partial: SlidePartial); // PATCH /presentations/{id}
  };
};
```

Zustand 등의 전역 store에 넣고, `PresentationSidebar`, `SlidesStrip`, `PresentationCanvasView`가 공유.

---

### 3.3 생성 버튼 클릭 시 플로우

1. 사용자가 `[프레젠테이션 생성]` 버튼 클릭
2. `generatePresentation()` 호출

   * `isGenerating = true`로 설정
   * `POST /api/v1/presentations/generate` 요청

```ts
// 의사 코드
const generatePresentation = async () => {
  set({ isGenerating: true, error: undefined });

  const body = {
    topic: state.topic,
    deck_type: state.deckType,
    slide_count: state.slideCount,
    aspect_ratio: state.aspectRatio,
  };

  const res = await fetch('/api/v1/presentations/generate', { method: 'POST', body: JSON.stringify(body) });

  // 응답 파싱 후:
  set({
    currentPresentationId: res.id,
    slides: res.slides,
    activeSlideId: res.slides[0]?.id,
    isGenerating: false,
  });
};
```

3. 응답 성공 시

   * 썸네일 리스트 렌더링
   * 첫 슬라이드를 캔버스에 로드

4. 실패 시

   * `error` 상태에 메시지 저장
   * 토스트나 에러 박스로 사용자에게 알림

---

### 3.4 슬라이드 → 캔버스 매핑 규칙 (템플릿)

C팀은 **layout 값에 따라 Polotno 요소를 배치**하는 템플릿을 만든다.

예:

* `layout = "title_center"`

  * 페이지 중앙에 큰 텍스트 박스(Title)
  * 아래쪽에 작은 텍스트 박스(Subtitle)
* `layout = "two_column"`

  * 좌측: bullets를 리스트 형태 텍스트 박스
  * 우측: Placeholder 이미지 박스
* `layout = "three_bullets"`

  * 상단: title
  * 하단: 3개의 컬럼 텍스트 박스

> 처음에는 3~4개의 layout만 지원해도 충분.
> 나중에 템플릿 수를 늘려갈 수 있음.

---

### 3.5 C팀 TODO 요약

1. **Presentation 탭 UI** 마무리

   * 입력 폼 + 버튼 그룹 → store와 양방향 바인딩
2. **API 연동**

   * `generatePresentation()`에서 B팀 API 호출
   * 응답 데이터 → slides 상태로 저장
3. **슬라이드 썸네일 리스트**

   * order 순서대로 썸네일 렌더
   * 클릭 시 `activeSlideId` 변경
4. **캔버스 템플릿 3~4종 구현**

   * `title_center`, `two_column`, `three_bullets`, `comparison` 정도
5. **에러/로딩 처리**

   * 생성 중 버튼 비활성화 + 스피너
   * 실패 시 에러 표시

---

## 4. 단계별 우선순위 & 체크포인트

### Phase 1 – E2E “한 번 돌아가게 만들기”

* B팀

  * PresentationAgent(LLM) + `POST /presentations/generate` 구현
  * In-Memory 저장소로 minimum CRUD
* C팀

  * UI 입력 폼 + generate 버튼
  * API 연동 후 슬라이드 제목만 캔버스에 찍히게

✅ 목표: “주제 입력 → 버튼 클릭 → 최소 3장 슬라이드가 생기고, 제목이 캔버스에 보인다”

---

### Phase 2 – Pitch 덱 12장 완성 + 레이아웃

* B팀

  * pitch 덱 12장 타입 시퀀스 고정
  * 슬라이드별 필드 구성 안정화
* C팀

  * 썸네일, 활성 슬라이드 전환
  * 레이아웃 템플릿 3~4개 적용

✅ 목표: “Sparklio 피치 덱 12장을 자동 생성해서, 발표에 바로 쓸 수 있는 수준”

---

### Phase 3 – 수정/저장/재열기

* B팀

  * `GET /presentations/{id}`, `PATCH /presentations/{id}` 완료
* C팀

  * 텍스트 수정 → PATCH 호출 → 상태 동기화
  * 프로젝트별 프레젠테이션 목록(선택)

✅ 목표: “생성한 덱을 수정·저장하고 다시 열 수 있는 수준”

---

이 정도면 B팀·C팀 모두 **“지금 UI 기준으로 무엇을 어떻게 구현해야 하는지”**가 한 번에 보일 거예요.
