# Agents Demo Spec

**문서 버전**: v1.0
**작성일**: 2025-11-25
**작성자**: A팀 (백엔드/문서 총괄)
**목적**: 데모 V1의 멀티 에이전트 상세 스펙 정의

**상위 문서**: [SPARKLIO_DEMO_V1_PRD.md](./SPARKLIO_DEMO_V1_PRD.md)
**관련 문서**: [BACKEND_DEMO_APIS.md](./BACKEND_DEMO_APIS.md), [SHORTS_VIDEO_PIPELINE.md](./SHORTS_VIDEO_PIPELINE.md)

---

## 1. 에이전트 개요

### 1.1 에이전트 아키텍처 원칙

**멀티 에이전트 설계 전략**:
- **고성능 LLM**: 전략/요약/콘셉트에만 집중 사용 (GPT-4o, Gemini 2.0 Flash)
- **경량 LLM**: 반복 카피·레이아웃 생성 (Llama 3.2)
- **비LLM 로직**: 영상 조립, 데이터 변환 (ffmpeg, 파서)

**장점**:
- 비용 최적화
- LLM 의존도 감소
- 각 에이전트의 역할 명확화

### 1.2 에이전트 분류

| 카테고리 | 에이전트 | LLM | 역할 |
|---------|---------|-----|------|
| **Meeting** | MeetingFromUrlAgent | - | YouTube/Zoom URL → 텍스트 |
| | MeetingSummaryAgent | GPT-4o | 회의 요약/키메시지 추출 |
| **기획/카피/디자인** | StrategistAgent | GPT-4o | Campaign Brief 생성 |
| | ConceptAgent | Gemini 2.0 Flash | Concept 2-3개 생성 |
| | CopywriterAgent | Llama 3.2 | 채널별 카피 작성 |
| | DesignerAgent | Llama 3.2 | 레이아웃/톤 정보 생성 |
| **이미지/영상** | ShortsScriptAgent | GPT-4o | 쇼츠 스크립트 생성 |
| | VisualPromptAgent | GPT-4o mini | ComfyUI 프롬프트 생성 |
| | VideoBuilder | - | 영상 조립 (비LLM) |
| **품질/검토** | ReviewerAgent | Claude 3.5 Sonnet | 광고 규제 검토 |

---

## 2. Meeting 계열 에이전트

### 2.1 MeetingFromUrlAgent

**역할**: YouTube/Zoom URL에서 텍스트 추출

**입력**:
```python
{
  "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "language": "ko"  # Optional
}
```

**출력**:
```python
{
  "meeting_id": "550e8400-e29b-41d4-a716-446655440000",
  "transcript": {
    "text": "안녕하세요. 오늘은 제주 감귤을 활용한...",
    "source": "caption",  # caption | whisper_stt
    "language": "ko"
  }
}
```

**내부 로직**:
1. `yt-dlp`로 자막 다운로드 시도 (한국어/영어)
2. 자막 없을 경우:
   - Audio 추출 (`yt-dlp -f bestaudio`)
   - Whisper STT 호출 (`whisper-1` 모델)
3. 텍스트 정제 (중복 제거, 타임스탬프 제거)
4. DB 저장

**사용 LLM**: 없음 (yt-dlp, Whisper STT API)

**성능**:
- 자막 있을 경우: 10초 이내
- 자막 없을 경우: 30초 이내 (10분 회의 기준)

---

### 2.2 MeetingSummaryAgent

**역할**: 회의 텍스트 → 요약/키메시지

**입력**:
```python
{
  "transcript": "안녕하세요. 오늘은 제주 감귤을 활용한 신제품 젤리 런칭에 대해..."
}
```

**출력**:
```python
{
  "title": "제주 감귤 젤리 신제품 런칭 기획 회의",
  "one_line_summary": "국내산 제주 감귤을 활용한 건강한 젤리 신제품 기획",
  "key_messages": [
    "국내산 제주 감귤 100%",
    "합성 첨가물 무첨가",
    "어린이도 안심하고 먹을 수 있는 비타민 간식"
  ],
  "target_persona": "30-40대 엄마, 자녀 간식에 관심 많은 소비자",
  "problem": "시중 젤리는 합성 첨가물 과다",
  "solution": "천연 재료로 만든 건강한 젤리"
}
```

**Prompt 구조**:
```
System: You are a professional meeting summarizer for marketing teams.

User:
다음 회의 내용을 분석하고, 아래 형식으로 요약해주세요.

[회의 내용]
{transcript}

[출력 형식]
- 회의 제목 (15자 이내)
- 한 줄 요약 (30자 이내)
- 핵심 키메시지 3-5개
- 타깃 페르소나 (구체적)
- 주요 문제
- 해결 방안
```

**사용 LLM**: OpenAI GPT-4o (`gpt-4o`)

**Pydantic 스키마**:
```python
class MeetingSummary(BaseModel):
    title: str = Field(max_length=50)
    one_line_summary: str = Field(max_length=100)
    key_messages: List[str] = Field(min_items=3, max_items=5)
    target_persona: str = Field(max_length=100)
    problem: str = Field(max_length=200)
    solution: str = Field(max_length=200)
```

**품질 기준**:
- 키메시지는 구체적이고 액션 가능해야 함
- 타깃은 구체적 페르소나여야 함 (예: "30-40대 엄마")

---

## 3. 기획/카피/디자인 계열 에이전트

### 3.1 StrategistAgent

**역할**: Campaign Brief 생성

**입력**:
```python
{
  "meeting_summary": { ... },
  "brand_kit": {
    "name": "제주 감귤 브랜드",
    "colors": ["#FFA500", "#FFD700"],
    "tone": "친근하고 안심되는 톤"
  }
}
```

**출력**:
```python
{
  "goal": "제주 감귤 젤리 신제품 런칭 및 인지도 확대",
  "target": "30-40대 엄마, 자녀 간식에 관심 많은 소비자",
  "core_message": "국내산 제주 감귤 100%, 합성 첨가물 무첨가, 건강한 비타민 간식",
  "tone": "친근하고 안심되는 톤",
  "channels": ["presentation", "detail_page", "instagram", "shorts"]
}
```

**Prompt 구조**:
```
System: You are a professional marketing strategist.

User:
다음 회의 요약과 브랜드 정보를 바탕으로 캠페인 브리프를 작성해주세요.

[회의 요약]
{meeting_summary}

[브랜드 정보]
{brand_kit}

[출력 형식]
- 캠페인 목표
- 타깃
- 핵심 메시지
- 톤앤매너
- 채널 전략
```

**사용 LLM**: OpenAI GPT-4o (`gpt-4o`)

---

### 3.2 ConceptAgent

**역할**: ConceptConfig 2-3개 생성

**입력**:
```python
{
  "campaign_brief": { ... },
  "brand_kit": { ... },
  "num_concepts": 2
}
```

**출력**:
```python
[
  {
    "concept_id": "concept-a",
    "title": "상큼한 하루 리프레시",
    "subtitle": "제주 감귤의 상큼함으로 하루를 상쾌하게",
    "core_message": "제주 감귤의 상큼함으로 하루를 상쾌하게",
    "tone_keywords": ["밝은", "경쾌한", "활기찬"],
    "color_palette": ["#FFA500", "#FFFFFF", "#FFD700"],
    "sample_headlines": [
      "아침마다 상큼하게, 제주 감귤 젤리",
      "하루를 깨우는 비타민 한 입"
    ]
  },
  {
    "concept_id": "concept-b",
    "title": "아이와 함께하는 비타민 간식",
    "subtitle": "엄마의 마음으로 만든 건강한 젤리",
    "core_message": "엄마의 마음으로 만든 건강한 젤리",
    "tone_keywords": ["따뜻한", "안심", "케어링"],
    "color_palette": ["#FFB6C1", "#FFFFFF", "#FFD700"],
    "sample_headlines": [
      "우리 아이 간식, 제주 감귤로 건강하게",
      "엄마가 선택한 천연 젤리"
    ]
  }
]
```

**Prompt 구조**:
```
System: You are a creative concept designer for marketing campaigns.

User:
다음 캠페인 브리프를 바탕으로 2개의 서로 다른 콘셉트를 생성해주세요.
각 콘셉트는 다른 타깃 세그먼트 또는 다른 메시지 각도를 가져야 합니다.

[캠페인 브리프]
{campaign_brief}

[출력 형식]
- 콘셉트 타이틀
- 서브타이틀
- 핵심 메시지
- 톤앤매너 키워드 3개
- 컬러 팔레트
- 샘플 헤드라인 2개
```

**사용 LLM**: Google Gemini 2.0 Flash (`gemini-2.0-flash-exp`)

**Pydantic 스키마**:
```python
class ConceptConfig(BaseModel):
    concept_id: str
    title: str = Field(max_length=50)
    subtitle: str = Field(max_length=100)
    core_message: str = Field(max_length=200)
    tone_keywords: List[str] = Field(min_items=3, max_items=3)
    color_palette: List[str] = Field(min_items=3, max_items=5)
    sample_headlines: List[str] = Field(min_items=2, max_items=3)
```

---

### 3.3 CopywriterAgent

**역할**: 슬라이드/상세/인스타/쇼츠 카피 작성

**입력**:
```python
{
  "concept": { ... },
  "channel_type": "presentation",  # presentation | detail_page | instagram | shorts
  "brand_kit": { ... }
}
```

**출력 (Presentation)**:
```python
{
  "slides": [
    {
      "slide_number": 1,
      "type": "cover",
      "title": "상큼한 하루 리프레시",
      "subtitle": "제주 감귤 젤리"
    },
    {
      "slide_number": 2,
      "type": "content",
      "title": "문제 정의",
      "content": "시중 젤리는 합성 첨가물이 과다합니다."
    },
    // ... 총 5장
  ]
}
```

**출력 (Detail Page)**:
```python
{
  "title": "제주 감귤 젤리 - 상큼한 하루 리프레시",
  "one_liner": "국내산 제주 감귤 100%로 만든 상큼하고 건강한 젤리",
  "benefits": [
    "국내산 제주 감귤 100% 사용",
    "합성 첨가물 무첨가",
    "비타민 C 풍부",
    "어린이도 안심"
  ],
  "description": "바쁜 아침, 상큼한 제주 감귤 젤리 한 입이면...",
  "cta": "지금 바로 구매하기 →"
}
```

**출력 (Instagram)**:
```python
{
  "cards": [
    {
      "card_number": 1,
      "headline": "아침마다 상큼하게, 제주 감귤 젤리",
      "subcopy": "국내산 감귤 100%로 만든 건강한 간식",
      "cta": "지금 확인하기 →"
    },
    // ... 총 3장
  ]
}
```

**사용 LLM**: Ollama Llama 3.2 (`llama3.2:3b`)

**품질 기준**:
- 모든 카피는 Concept의 톤앤매너 유지
- ReviewerAgent 검토 통과 (광고 규제, 과장 표현 없음)

---

### 3.4 DesignerAgent

**역할**: 레이아웃/톤 정보 생성

**입력**:
```python
{
  "concept": { ... },
  "channel_type": "presentation"
}
```

**출력**:
```python
{
  "layout": {
    "background_color": "#FFA500",
    "text_color": "#FFFFFF",
    "font_family": "Pretendard",
    "font_size_title": "48px",
    "font_size_body": "24px"
  },
  "image_areas": [
    {
      "position": "center",
      "size": "60%",
      "description": "제주 감귤 비주얼"
    }
  ]
}
```

**사용 LLM**: Ollama Llama 3.2 (`llama3.2:3b`)

---

## 4. 이미지/영상 계열 에이전트

### 4.1 ShortsScriptAgent

**역할**: 쇼츠 스크립트 생성 (씬 단위)

**입력**:
```python
{
  "concept": { ... },
  "duration": 25,  # seconds
  "brand_kit": { ... }
}
```

**출력**:
```python
{
  "shorts_id": "shorts-001",
  "duration": 25,
  "scenes": [
    {
      "scene_number": 1,
      "duration": "0-4초",
      "role": "Hook",
      "visual": "아침 침대에서 일어나는 모습",
      "narration": "아침마다 피곤하신가요?",
      "onscreen_text": "피곤한 아침..."
    },
    // ... 총 6개 씬
  ]
}
```

**Prompt 구조**:
```
System: You are a professional shorts video script writer.

User:
다음 콘셉트를 바탕으로 {duration}초 쇼츠 스크립트를 작성해주세요.
Hook → Problem → Solution → Feature → Benefit → CTA 구조를 따르세요.

[콘셉트]
{concept}

[출력 형식]
- 씬 번호
- 길이 (초)
- 역할 (Hook/Problem/Solution/Feature/Benefit/CTA)
- 화면 설명
- 내레이션
- 자막
```

**사용 LLM**: OpenAI GPT-4o (`gpt-4o`)

**Pydantic 스키마**:
```python
class ShortsScene(BaseModel):
    scene_number: int
    duration: str
    role: Literal['Hook', 'Problem', 'Solution', 'Feature', 'Benefit', 'CTA']
    visual: str = Field(max_length=200)
    narration: str = Field(max_length=100)
    onscreen_text: str = Field(max_length=50)
```

---

### 4.2 VisualPromptAgent

**역할**: ComfyUI용 프롬프트 생성

**입력**:
```python
{
  "concept": { ... },
  "brand_kit": { ... },
  "scene": {
    "visual": "아침 침대에서 일어나는 모습",
    "tone_keywords": ["밝은", "경쾌한"]
  }
}
```

**출력**:
```python
{
  "prompt": "Bright morning scene, person waking up in bed, sunlight through window, warm colors, cinematic lighting, high quality",
  "negative_prompt": "dark, gloomy, low quality, blurry",
  "parameters": {
    "width": 1024,
    "height": 1024,
    "steps": 30,
    "cfg_scale": 7.0
  }
}
```

**사용 LLM**: OpenAI GPT-4o mini (`gpt-4o-mini`)

---

### 4.3 VideoBuilder

**역할**: 키프레임 이미지 → 영상 조립

**입력**:
```python
{
  "shots": [
    {
      "image_url": "https://minio.../keyframe-1.png",
      "duration": 4,  # seconds
      "subtitle": "피곤한 아침..."
    },
    // ...
  ]
}
```

**출력**:
```python
{
  "video_url": "https://minio.../shorts-001.mp4",
  "format": "mp4",
  "resolution": "1080x1920",  # 9:16 세로
  "duration": 25
}
```

**내부 로직** (ffmpeg):
1. 각 shot별 이미지 로드
2. duration에 맞춰 이미지 표시 시간 설정
3. 자막 오버레이 (burn-in)
4. 씬 전환 효과 (fade/crossfade)
5. 최종 mp4 출력

**사용 LLM**: 없음 (ffmpeg 7.1.2)

**ffmpeg 명령어 예시**:
```bash
ffmpeg \
  -loop 1 -t 4 -i keyframe-1.png \
  -loop 1 -t 4 -i keyframe-2.png \
  -filter_complex "[0:v]fade=t=out:st=3:d=1[v0]; \
                   [1:v]fade=t=in:st=0:d=1[v1]; \
                   [v0][v1]concat=n=2:v=1:a=0, \
                   drawtext=fontfile=/path/to/font.ttf:text='피곤한 아침...':fontsize=48:fontcolor=white:x=(w-text_w)/2:y=h-100" \
  -c:v libx264 -pix_fmt yuv420p \
  shorts-001.mp4
```

---

## 5. 품질/검토 계열 에이전트

### 5.1 ReviewerAgent

**역할**: 광고 규제, 과장 표현, 톤/브랜드 일관성 검사

**입력**:
```python
{
  "content_type": "product_detail",  # presentation | product_detail | instagram | shorts
  "content": {
    "title": "제주 감귤 젤리 - 상큼한 하루 리프레시",
    "description": "...",
    // ...
  },
  "brand_kit": { ... },
  "concept": { ... }
}
```

**출력**:
```python
{
  "approval_status": "approved",  # approved | needs_revision | rejected
  "overall_score": 85,  # 0-100
  "issues": [
    {
      "severity": "minor",  # critical | major | minor
      "category": "tone_consistency",
      "message": "톤이 약간 과하게 밝을 수 있음",
      "suggestion": "경쾌한 → 상쾌한으로 수정 권장"
    }
  ],
  "compliances": [
    {
      "check": "medical_claims",
      "status": "pass",
      "message": "의료/건강 관련 과장 표현 없음"
    },
    {
      "check": "superlatives",
      "status": "pass",
      "message": "최고, 1위 등 근거 없는 주장 없음"
    },
    {
      "check": "brand_guideline",
      "status": "pass",
      "message": "브랜드 가이드 준수"
    }
  ]
}
```

**검사 항목**:
- ❌ 의료/건강 관련 과장 표현
- ❌ "최고", "1위" 같은 근거 없는 주장
- ❌ 브랜드 가이드 위반 (톤앤매너)
- ❌ 경쟁사 비방
- ❌ 법적 리스크 키워드

**Prompt 구조**:
```
System: You are a professional advertising compliance reviewer.

User:
다음 광고 콘텐츠를 검토하고, 광고 규제 및 과장 표현 여부를 판단해주세요.

[콘텐츠]
{content}

[브랜드 가이드]
{brand_kit}

[검사 항목]
1. 의료/건강 관련 과장 표현
2. 최상급 표현 근거 확인
3. 브랜드 톤앤매너 일치
4. 법적 리스크 키워드

[출력 형식]
- 승인 상태 (approved/needs_revision/rejected)
- 전체 점수 (0-100)
- 이슈 리스트
- 준수 사항
```

**사용 LLM**: Anthropic Claude 3.5 Sonnet (`claude-3-5-sonnet-20241022`)

**품질 기준**:
- overall_score 80점 이상 → approved
- 60-79점 → needs_revision
- 60점 미만 → rejected

---

## 6. 에이전트 실행 플로우

### 6.1 Meeting → Campaign 파이프라인

```
1. MeetingFromUrlAgent
   └─> YouTube URL → 텍스트

2. MeetingSummaryAgent
   └─> 텍스트 → 요약/키메시지

3. StrategistAgent
   └─> 요약 + Brand Kit → Campaign Brief

4. ConceptAgent
   └─> Campaign Brief → Concept 2-3개

5. 각 Concept별 병렬 실행:
   ├─> CopywriterAgent (Presentation)
   ├─> CopywriterAgent (Product Detail)
   ├─> CopywriterAgent (Instagram)
   └─> ShortsScriptAgent

6. ReviewerAgent
   └─> 모든 산출물 검토
```

### 6.2 Shorts 영상 파이프라인

```
1. ShortsScriptAgent
   └─> Concept → Shorts Script (씬 단위)

2. VisualPromptAgent (각 씬별 병렬)
   └─> 씬 → ComfyUI 프롬프트

3. ComfyUI 호출 (각 씬별 병렬)
   └─> 프롬프트 → 키프레임 이미지

4. VideoBuilder
   └─> 키프레임 이미지 → mp4 영상
```

---

## 7. 에이전트 공통 기능

### 7.1 Retry Logic

**모든 LLM 에이전트는 최대 3회 재시도**:
```python
MAX_RETRIES = 3
RETRY_DELAY = [1, 2, 4]  # seconds (exponential backoff)

for attempt in range(MAX_RETRIES):
    try:
        result = llm_call(...)
        break
    except Exception as e:
        if attempt < MAX_RETRIES - 1:
            time.sleep(RETRY_DELAY[attempt])
        else:
            raise
```

### 7.2 Temperature 조정

| 에이전트 | Temperature | 이유 |
|---------|------------|------|
| MeetingSummaryAgent | 0.2 | 정확성 우선 |
| StrategistAgent | 0.3 | 전략은 일관성 필요 |
| ConceptAgent | 0.7 | 창의성 필요 |
| CopywriterAgent | 0.5 | 균형 |
| ShortsScriptAgent | 0.4 | 구조화된 출력 |
| VisualPromptAgent | 0.6 | 창의적 프롬프트 |
| ReviewerAgent | 0.1 | 검토는 엄격하게 |

### 7.3 로깅

**모든 에이전트는 구조화된 로깅**:
```python
logger.info(
    "agent_execution",
    extra={
        "agent": "MeetingSummaryAgent",
        "meeting_id": meeting_id,
        "duration": 12.5,  # seconds
        "tokens_used": 1234,
        "status": "success"
    }
)
```

---

## 8. 성능 기준

| 에이전트 | 예상 시간 | Token 사용 (평균) |
|---------|----------|-----------------|
| MeetingFromUrlAgent | 10-30초 | - |
| MeetingSummaryAgent | 5-10초 | 1500 tokens |
| StrategistAgent | 5-10초 | 1200 tokens |
| ConceptAgent | 10-15초 | 2000 tokens |
| CopywriterAgent (각) | 5-8초 | 800 tokens |
| ShortsScriptAgent | 10-15초 | 1500 tokens |
| VisualPromptAgent | 3-5초 | 300 tokens |
| VideoBuilder | 10-20초 | - |
| ReviewerAgent | 8-12초 | 1000 tokens |

**전체 파이프라인** (Meeting → Campaign):
- 예상 시간: 2-3분
- 총 Token 사용: ~15,000 tokens

---

**문서 상태**: ✅ 완성
**다음 문서**: [CONCEPT_BOARD_SPEC.md](./CONCEPT_BOARD_SPEC.md)
**버전**: v1.0
**최종 수정**: 2025-11-25
