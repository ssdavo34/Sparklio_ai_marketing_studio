# Content Plan → Multi-page Document Spec v2
**버전**: v2.0 (A팀 검토 완료)
**작성일**: 2025-11-23
**대상 Task**: `copywriter.content_plan`
**대상 Kind**: `ad_campaign_plan`

---

## 1. 목적

이 문서는 `copywriter.content_plan` Task의 Output JSON(`ContentPlanOutputV1`)을
프론트엔드에서 사용 가능한 **다중 페이지 문서 구조(`ContentPlanPagesSchema`)**로 변환하는 규칙을 정의합니다.

### 역할 분담
- **A팀**: content_plan Output 구조를 이 매핑에 최적화, 품질 기준 설정
- **B팀**: 변환 로직 구현 기준 (Python 함수)
- **C팀**: 페이지/레이아웃/블록 템플릿 설계 기준 (React 컴포넌트)

---

## 2. 입력 스키마: `ContentPlanOutputV1`

```typescript
interface ContentPlanOutputV1 {
  // 기본 정보
  title: string;                // 캠페인/강의 제목
  objectives: string[];         // 주요 목표 (2~5개)

  // 타겟 audience
  audience: {
    target_group: string;        // 타겟 그룹
    age_range: string;           // 연령대
    interests: string[];         // 관심사 (2~5개)
  };

  // 채널
  channels: string[];           // 노출 채널 (1~5개)

  // 콘텐츠 요소
  content_elements: Array<{
    type: "text" | "image" | "video" | "list";
    elements?: string[];         // type="text" 또는 "list"일 때
    description: string;         // type="image" 또는 "video"일 때
  }>;

  // CTA & 측정
  call_to_action: string;       // 행동 유도 문구
  measurement_metrics: string[]; // 측정 지표 (2~5개)
}
```

### A팀 검토 의견

#### 2.1 필드명 통일 (한/영)
**현재 문제**: `content_elements.type` 값이 한글/영어 혼재
- 기존: `"type": "텍스트"` 또는 `"type": "text"`
- 통일안: **영어로 통일** (`"text"`, `"image"`, `"video"`, `"list"`)

**이유**:
1. JSON Schema의 enum 값은 영어가 표준
2. B/C팀 코드에서 타입 체크 용이
3. 프롬프트에서 "type 값은 영어로만 출력" 명시 가능

#### 2.2 필드 추가 제안
```typescript
interface ContentPlanOutputV2 {
  // ... 기존 필드 ...

  // 추가 필드 (선택)
  campaign_type?: "course" | "product_launch" | "seminar" | "saas";  // 캠페인 유형
  duration?: string;            // 기간
  budget_range?: string;        // 예산 범위
}
```

**이유**: Pages 변환 시 campaign_type에 따라 페이지 구성을 다르게 할 수 있음

---

## 3. 출력 스키마: `ContentPlanPagesSchema`

프론트엔드로 전달되는 최종 구조:

```typescript
interface ContentPlanPagesSchema {
  type: "content_plan_pages";   // Response type 식별자
  campaign_info: {
    title: string;
    campaign_type?: string;
  };
  pages: Page[];
}

interface Page {
  page_id: string;              // 페이지 고유 ID (예: "page_1")
  layout: PageLayoutType;       // 레이아웃 타입
  blocks: Block[];              // 페이지 내 블록들
}

type PageLayoutType =
  | "cover"                     // 타이틀 + 목표
  | "audience"                  // 타겟/페르소나
  | "overview"                  // 콘텐츠 소개
  | "channels"                  // 채널별 전략
  | "cta";                      // 행동 유도

interface Block {
  block_id: string;             // 블록 고유 ID (예: "block_1")
  type: BlockType;              // 블록 타입
  content: BlockContent;        // 블록 내용
}

type BlockType =
  | "title"                     // 제목
  | "subtitle"                  // 소제목
  | "paragraph"                 // 본문 텍스트
  | "list"                      // 불릿/리스트
  | "image_placeholder"         // 이미지 플레이스홀더
  | "video_placeholder"         // 비디오 플레이스홀더
  | "cta_button";               // CTA 버튼

type BlockContent =
  | { text: string }                        // title, subtitle, paragraph, cta_button
  | { items: string[] }                     // list
  | { description: string; url?: string };  // image_placeholder, video_placeholder
```

---

## 4. 변환 규칙 (Mapping Logic)

### 4.1 기본 페이지 구성

**최소 구성** (3 pages):
1. Cover (필수)
2. Overview (필수)
3. CTA (필수)

**표준 구성** (5 pages):
1. Cover
2. Audience
3. Overview
4. Channels
5. CTA

**페이지 수 결정 로직**:
```python
def determine_pages(content_plan: ContentPlanOutputV1) -> List[str]:
    pages = ["cover", "overview", "cta"]  # 최소 구성

    # Audience 추가 조건: target_group이 명확하거나 interests가 3개 이상
    if content_plan.audience.target_group and len(content_plan.audience.interests) >= 2:
        pages.insert(1, "audience")

    # Channels 추가 조건: channels가 2개 이상
    if len(content_plan.channels) >= 2:
        pages.insert(-1, "channels")  # CTA 직전에 삽입

    return pages
```

---

### 4.2 Page 1: Cover

**Layout**: `"cover"`

**원천 데이터**:
- `title`
- `objectives[]`

**Blocks 구성**:
```typescript
[
  {
    "block_id": "block_1",
    "type": "title",
    "content": { "text": content_plan.title }
  },
  {
    "block_id": "block_2",
    "type": "subtitle",
    "content": { "text": "주요 목표" }  // 고정 문구
  },
  {
    "block_id": "block_3",
    "type": "list",
    "content": {
      "items": content_plan.objectives.slice(0, 3)  // 최대 3개
    }
  }
]
```

**규칙**:
- objectives가 3개 초과 시 상위 3개만 사용
- objectives가 너무 길면 (50자 이상) 요약 필요

**예시**:
```json
{
  "page_id": "page_1",
  "layout": "cover",
  "blocks": [
    {
      "block_id": "block_1",
      "type": "title",
      "content": { "text": "AI 자동화 강의 광고" }
    },
    {
      "block_id": "block_2",
      "type": "subtitle",
      "content": { "text": "주요 목표" }
    },
    {
      "block_id": "block_3",
      "type": "list",
      "content": {
        "items": [
          "AI 기술 이해도 향상",
          "AI 자동화의 중요성 인식",
          "실무 활용 역량 강화"
        ]
      }
    }
  ]
}
```

---

### 4.3 Page 2: Audience (선택적)

**Layout**: `"audience"`

**원천 데이터**:
- `audience.target_group`
- `audience.age_range`
- `audience.interests[]`

**Blocks 구성**:
```typescript
[
  {
    "block_id": "block_1",
    "type": "subtitle",
    "content": { "text": "누가 들어야 할까요?" }  // 고정 문구
  },
  {
    "block_id": "block_2",
    "type": "paragraph",
    "content": {
      "text": generate_audience_description(content_plan.audience)
    }
  },
  {
    "block_id": "block_3",
    "type": "list",
    "content": {
      "items": content_plan.audience.interests
    }
  }
]
```

**자연어 생성 함수**:
```python
def generate_audience_description(audience: Audience) -> str:
    return (
        f"이 강의는 {audience.age_range} {audience.target_group}을 위한 과정입니다. "
        f"{', '.join(audience.interests[:3])}에 관심이 있는 분들께 특히 적합합니다."
    )
```

> **버그 수정**: `audience.audience.target_group` → `audience.target_group`

**예시**:
```json
{
  "page_id": "page_2",
  "layout": "audience",
  "blocks": [
    {
      "block_id": "block_1",
      "type": "subtitle",
      "content": { "text": "누가 들어야 할까요?" }
    },
    {
      "block_id": "block_2",
      "type": "paragraph",
      "content": {
        "text": "이 강의는 20-45세 IT 전문가, 비즈니스 관리자를 위한 과정입니다. 기술, 학습, 비즈니스 자동화에 관심이 있는 분들께 특히 적합합니다."
      }
    }
  ]
}
```

---

### 4.4 Page 3: Overview

**Layout**: `"overview"`

**원천 데이터**:
- `content_elements[]` 중 `type = "text"` 또는 `type = "list"`
- `content_elements[]` 중 `type = "image"` → 이미지 플레이스홀더

**Blocks 구성**:
```typescript
[
  {
    "block_id": "block_1",
    "type": "subtitle",
    "content": { "text": determine_overview_title(campaign_type) }
  },
  {
    "block_id": "block_2",
    "type": "paragraph",
    "content": {
      "text": merge_text_elements(content_elements)
    }
  },
  {
    "block_id": "block_3",  // 옵션
    "type": "image_placeholder",
    "content": {
      "description": find_image_element_description(content_elements)
    }
  }
]
```

**Overview 제목 결정**:
```python
def determine_overview_title(campaign_type: str) -> str:
    titles = {
        "course": "강의에서 무엇을 배우나요?",
        "product_launch": "제품의 핵심 기능",
        "seminar": "세미나에서 다룰 내용",
        "saas": "서비스 주요 기능"
    }
    return titles.get(campaign_type, "주요 내용")
```

**텍스트 요소 병합**:
```python
def merge_text_elements(content_elements: List[ContentElement]) -> str:
    text_elements = [e for e in content_elements if e.type == "text"]
    # elements 배열을 자연어로 연결
    texts = []
    for elem in text_elements:
        if elem.elements:
            texts.extend(elem.elements)

    return " ".join(texts[:3])  # 최대 3개 문장
```

**예시**:
```json
{
  "page_id": "page_3",
  "layout": "overview",
  "blocks": [
    {
      "block_id": "block_1",
      "type": "subtitle",
      "content": { "text": "강의에서 무엇을 배우나요?" }
    },
    {
      "block_id": "block_2",
      "type": "paragraph",
      "content": {
        "text": "AI와 자동화의 기본 원칙부터 최신 비즈니스 현장에서 활용되는 혁신적인 응용까지, 실전 중심으로 전반적인 내용을 다룹니다."
      }
    },
    {
      "block_id": "block_3",
      "type": "image_placeholder",
      "content": {
        "description": "AI 자동화와 관련된 시각 자료"
      }
    }
  ]
}
```

---

### 4.5 Page 4: Channels (선택적)

**Layout**: `"channels"`

**원천 데이터**:
- `channels[]`

**Blocks 구성**:
```typescript
[
  {
    "block_id": "block_1",
    "type": "subtitle",
    "content": { "text": "어디에서 노출될까요?" }
  },
  {
    "block_id": "block_2",
    "type": "list",
    "content": {
      "items": content_plan.channels
    }
  }
]
```

**생략 조건**:
- channels 개수가 1개 이하일 때
- 이 경우 Overview 페이지에 channels 정보를 추가 블록으로 포함

**예시**:
```json
{
  "page_id": "page_4",
  "layout": "channels",
  "blocks": [
    {
      "block_id": "block_1",
      "type": "subtitle",
      "content": { "text": "어디에서 노출될까요?" }
    },
    {
      "block_id": "block_2",
      "type": "list",
      "content": {
        "items": [
          "페이스북 광고",
          "인스타그램 스토리",
          "트위터 트윗",
          "이메일 마케팅"
        ]
      }
    }
  ]
}
```

---

### 4.6 Page 5: CTA

**Layout**: `"cta"`

**원천 데이터**:
- `call_to_action`
- `measurement_metrics[]` (선택)

**Blocks 구성**:
```typescript
[
  {
    "block_id": "block_1",
    "type": "subtitle",
    "content": { "text": generate_cta_title(call_to_action) }
  },
  {
    "block_id": "block_2",
    "type": "paragraph",
    "content": {
      "text": content_plan.call_to_action
    }
  },
  {
    "block_id": "block_3",  // 옵션 - measurement_metrics 표시
    "type": "list",
    "content": {
      "items": content_plan.measurement_metrics  // 성과 지표 표시
    }
  },
  {
    "block_id": "block_4",  // 옵션
    "type": "cta_button",
    "content": {
      "text": extract_button_text(call_to_action)
    }
  }
]
```

**CTA 제목 생성**:
```python
def generate_cta_title(call_to_action: str, campaign_type: Optional[str] = None) -> str:
    # call_to_action에서 핵심 동사 추출
    if "문의" in call_to_action:
        return "지금 바로 문의하세요"
    elif "신청" in call_to_action:
        return "지금 바로 신청하세요"
    elif "확인" in call_to_action or "링크" in call_to_action:
        return "자세한 정보 확인하기"
    else:
        # campaign_type에 따른 기본 제목
        if campaign_type == "course":
            return "강의 신청하기"
        elif campaign_type == "product_launch":
            return "제품 알아보기"
        elif campaign_type == "seminar":
            return "세미나 등록하기"
        else:
            return "지금 바로 시작하세요"
```

**버튼 텍스트 추출**:
```python
def extract_button_text(call_to_action: str) -> str:
    # 간단한 행동 유도 문구 추출
    patterns = [
        ("문의", "무료 문의하기"),
        ("신청", "신청하기"),
        ("링크", "자세히 보기"),
        ("확인", "확인하기")
    ]

    for keyword, button_text in patterns:
        if keyword in call_to_action:
            return button_text

    return "자세히 보기"
```

**예시**:
```json
{
  "page_id": "page_5",
  "layout": "cta",
  "blocks": [
    {
      "block_id": "block_1",
      "type": "subtitle",
      "content": { "text": "지금 바로 확인해 보세요" }
    },
    {
      "block_id": "block_2",
      "type": "paragraph",
      "content": {
        "text": "자세한 정보 및 무료 시연 문의는 아래 링크를 클릭하세요."
      }
    },
    {
      "block_id": "block_3",
      "type": "cta_button",
      "content": {
        "text": "무료 시연 문의하기"
      }
    }
  ]
}
```

---

## 5. 완성 예시 (Full Example)

### 5.1 Input
```json
{
  "title": "AI 자동화 강의 광고",
  "objectives": [
    "AI 기술 이해도 향상",
    "AI 자동화의 중요성 인식"
  ],
  "audience": {
    "target_group": "IT 전문가, 비즈니스 관리자",
    "age_range": "20-45세",
    "interests": ["기술", "학습", "비즈니스 자동화"]
  },
  "channels": ["페이스북 광고", "인스타그램 스토리"],
  "content_elements": [
    {
      "type": "text",
      "elements": ["AI와 자동화의 기본 원칙부터 실전 활용까지"],
      "description": ""
    },
    {
      "type": "image",
      "description": "AI 자동화와 관련된 시각 자료"
    }
  ],
  "call_to_action": "자세한 정보 및 무료 시연 문의는 아래 링크를 클릭하세요.",
  "measurement_metrics": ["광고 클릭률(CTR)", "시청 시간"]
}
```

### 5.2 Output
```json
{
  "type": "content_plan_pages",
  "campaign_info": {
    "title": "AI 자동화 강의 광고",
    "campaign_type": "course"
  },
  "pages": [
    {
      "page_id": "page_1",
      "layout": "cover",
      "blocks": [
        {
          "block_id": "block_1",
          "type": "title",
          "content": { "text": "AI 자동화 강의 광고" }
        },
        {
          "block_id": "block_2",
          "type": "subtitle",
          "content": { "text": "주요 목표" }
        },
        {
          "block_id": "block_3",
          "type": "list",
          "content": {
            "items": [
              "AI 기술 이해도 향상",
              "AI 자동화의 중요성 인식"
            ]
          }
        }
      ]
    },
    {
      "page_id": "page_2",
      "layout": "audience",
      "blocks": [
        {
          "block_id": "block_1",
          "type": "subtitle",
          "content": { "text": "누가 들어야 할까요?" }
        },
        {
          "block_id": "block_2",
          "type": "paragraph",
          "content": {
            "text": "이 강의는 20-45세 IT 전문가, 비즈니스 관리자를 위한 과정입니다. 기술, 학습, 비즈니스 자동화에 관심이 있는 분들께 특히 적합합니다."
          }
        }
      ]
    },
    {
      "page_id": "page_3",
      "layout": "overview",
      "blocks": [
        {
          "block_id": "block_1",
          "type": "subtitle",
          "content": { "text": "강의에서 무엇을 배우나요?" }
        },
        {
          "block_id": "block_2",
          "type": "paragraph",
          "content": {
            "text": "AI와 자동화의 기본 원칙부터 실전 활용까지"
          }
        },
        {
          "block_id": "block_3",
          "type": "image_placeholder",
          "content": {
            "description": "AI 자동화와 관련된 시각 자료"
          }
        }
      ]
    },
    {
      "page_id": "page_4",
      "layout": "channels",
      "blocks": [
        {
          "block_id": "block_1",
          "type": "subtitle",
          "content": { "text": "어디에서 노출될까요?" }
        },
        {
          "block_id": "block_2",
          "type": "list",
          "content": {
            "items": [
              "페이스북 광고",
              "인스타그램 스토리"
            ]
          }
        }
      ]
    },
    {
      "page_id": "page_5",
      "layout": "cta",
      "blocks": [
        {
          "block_id": "block_1",
          "type": "subtitle",
          "content": { "text": "지금 바로 확인해 보세요" }
        },
        {
          "block_id": "block_2",
          "type": "paragraph",
          "content": {
            "text": "자세한 정보 및 무료 시연 문의는 아래 링크를 클릭하세요."
          }
        },
        {
          "block_id": "block_3",
          "type": "cta_button",
          "content": {
            "text": "무료 시연 문의하기"
          }
        }
      ]
    }
  ]
}
```

---

## 6. 구현 책임

### 6.1 B팀
- `ContentPlanOutputV1` → `ContentPlanPagesSchema` 변환 함수 구현
- 변환 전/후 로그 남기기 (디버깅 용이성)
- Unit test 작성 (최소 5개 시나리오)

### 6.2 C팀
- `type = "content_plan_pages"` 응답 감지
- `layout` 타입별 페이지 템플릿 구현
- `block` 타입별 렌더링 컴포넌트 구현
- 페이지 네비게이션 UI (페이지 이동, 진행도 표시)

### 6.3 A팀
- `content_plan` 프롬프트에 변환 규칙 반영
- Golden Set 작성 (최소 5개)
- 변환 결과 검증 (pages 구조가 올바른지)

---

## 7. 검증 기준

### 7.1 변환 성공 기준
- 모든 필수 페이지 존재 (cover, overview, cta)
- 각 페이지에 최소 1개 이상의 block 존재
- block_id, page_id가 중복 없이 고유함
- 모든 block의 type이 유효한 BlockType 값
- content 필드가 type에 맞는 구조

### 7.2 품질 기준
- 페이지 수: 3~5개 (적절한 분량)
- 각 페이지 블록 수: 2~4개 (가독성)
- 텍스트 길이 적정 (paragraph는 200자 이내)
- List items 개수 적정 (3~5개)

### 7.3 Golden Set
- 최소 5개 케이스
- 시나리오: 강의(2), 제품 출시(2), 세미나(1)
- 각 케이스: Input + Expected Pages 구조

---

## 8. A팀 최종 검토 의견

### 8.1 ✅ 확정 사항
1. 페이지 레이아웃 타입 5가지 적절함 (cover, audience, overview, channels, cta)
2. 블록 타입 7가지 충분함 (현재 요구사항 커버)
3. 변환 규칙 명확함 (B팀이 구현 가능한 수준)

### 8.2 ✅ 버그 수정 완료
1. **generate_audience_description 함수 버그 수정**
   - `audience.audience.target_group` → `audience.target_group`
2. **measurement_metrics 활용 추가**
   - CTA 페이지에 list 블록으로 성과 지표 표시
3. **campaign_type 기본값 처리**
   - generate_cta_title에 campaign_type 파라미터 추가
   - campaign_type이 없을 때도 적절한 기본 제목 반환

### 8.3 ⚠️ B팀 구현 시 주의사항
1. **content_elements.type 값 영어 통일**
   - 프롬프트에서 "type 값은 text, image, video, list 중 하나" 명시
   - B팀 validation에서 한글 값 발견 시 자동 변환 또는 에러 처리

2. **campaign_type 필드 권장**
   - Optional이지만 프롬프트에서 자주 채우도록 유도
   - 없을 때 기본값: "course" 또는 title 분석으로 추론

3. **constraints 기본값 중앙 관리**
   - Pydantic에서 기본값 설정 (20/30/80/3/20)
   - 사용자가 constraints를 비워도 자동 적용

### 8.4 📋 다음 단계
1. **B팀**: 변환 함수 구현 (`content_plan_to_pages.py`)
   - Input: ContentPlanOutputV1
   - Output: ContentPlanPagesSchema
   - Unit test 최소 5개 시나리오
2. **C팀**: Pages 렌더러 구현 (React 컴포넌트)
   - layout별 템플릿 컴포넌트
   - block별 렌더링 컴포넌트
   - 페이지 네비게이션 UI
3. **A팀**: Golden Set 10개 작성 후 변환 결과 검증
   - 파일: `backend/tests/golden_sets/copywriter/content_plan_golden_set.json`
   - 각 케이스: Input + Expected Pages 구조

---

**작성**: A팀
**최종 검토**: 2025-11-23
**다음 리뷰**: 변환 함수 구현 후 Golden Set 검증
