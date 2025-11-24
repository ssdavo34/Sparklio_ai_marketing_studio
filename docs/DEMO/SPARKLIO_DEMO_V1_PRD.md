# Sparklio AI Marketing Studio - Demo V1 PRD

**문서 버전**: v1.0
**작성일**: 2025-11-24
**작성자**: A팀 (백엔드/문서 총괄)
**목적**: 학원 발표용 데모 버전 제품 요구사항 정의

---

## 1. 제품 개요

### 1.1 데모 버전 목표

이번 학원 발표용 데모는 **"회의 한 번으로 마케팅 캠페인 풀패키지를 만드는 AI 마케팅 스튜디오"**의 핵심 플로우를 증명하는 것을 목표로 한다.

**핵심 메시지**:
> "회의 영상(URL) 하나와 브랜드 정보만으로,
> 프레젠테이션·상세페이지·인스타 광고·쇼츠 스크립트, 그리고 컨셉보드까지
> 한 번에 만들어주는 AI 마케팅 스튜디오"

### 1.2 타깃 사용자

- **마케터**: 회의 내용을 캠페인 브리프로 빠르게 전환하고 싶은 사람
- **기획자**: 여러 콘셉트를 비교하면서 방향을 잡고 싶은 사람
- **크리에이티브 팀**: PPT, 상세페이지, SNS 광고, 쇼츠를 일관된 톤으로 만들어야 하는 사람
- **대행사/프리랜서**: 클라이언트 회의 후 빠르게 초안을 제시해야 하는 사람

### 1.3 한 줄 컨셉

> "회의 URL 하나로, 마케팅 팀이 검토할 수 있는 **캠페인 초안 패키지**가 나온다."

---

## 2. 문제 정의

### 2.1 마케팅 팀의 현실

**문제 1: 회의는 넘쳐나는데 정리가 안 된다**
- 주간 회의, 기획 회의, 클라이언트 미팅이 쏟아지지만
- 회의록 작성, 핵심 메시지 추출, 타깃 정의가 수동 작업
- 회의 내용이 산출물로 연결되기까지 시간이 오래 걸림

**문제 2: 브리프·PPT·상세페이지·광고·쇼츠가 전부 따로 논다**
- PPT는 디자이너가, 상세페이지는 카피라이터가, 광고는 또 다른 팀이 따로 작업
- 같은 제품인데도 메시지, 톤, 컬러가 제각각
- 여러 버전을 만들어도 "어떤 콘셉트가 더 나은지" 비교하기 어려움

**문제 3: 브랜드 일관성이 깨진다**
- 각 채널별로 따로 작업하다 보니 브랜드 가이드를 놓치기 쉬움
- 광고 규제, 과장 표현 검토도 수동으로 해야 함

### 2.2 기존 워크플로우와의 비교

| 기존 방식 | Sparklio 방식 |
|---------|--------------|
| 회의 → 회의록 작성(수동) | 회의 URL → AI 자동 요약 |
| 브리프 작성(수동) | Meeting AI가 키메시지·타깃 추출 |
| PPT·상세·광고·쇼츠 개별 제작 | 멀티 에이전트가 한 번에 생성 |
| Figma/Miro에서 수동 정리 | Concept Board에서 자동 비교 |
| 광고 규제 수동 검토 | ReviewerAgent 자동 검토 |

### 2.3 우리가 해결하고자 하는 핵심 Pain Point

1. **회의 → 캠페인 전환 속도**: 회의 후 즉시 초안이 나와야 한다
2. **멀티 채널 일관성**: 같은 콘셉트 기반으로 모든 채널이 일관되게 나와야 한다
3. **콘셉트 비교 가능성**: 여러 콘셉트를 한 눈에 비교할 수 있어야 한다

---

## 3. 솔루션 개요 – Sparklio AI Marketing Studio

### 3.1 캔버스 스튜디오 한 화면 구성 (좌/중/우)

**원페이지 스튜디오 철학**:
- 모든 작업은 **하나의 화면(`/studio/demo`)** 안에서 진행된다
- 새로운 페이지 전환 없이 좌/중/우 패널로 모든 기능을 제공

**레이아웃**:
- **좌측 패널 (20%)**:
  - 브랜드 선택
  - Meeting 리스트
  - 프로젝트 정보

- **중앙 영역 (50-60%)**:
  - Concept Board (기본 뷰)
  - Slides 미리보기
  - Product Detail 미리보기
  - Instagram News 미리보기
  - Shorts Script & Preview

- **우측 패널 (25-30%)**:
  - **Chat 패널 (Sparklio Assistant)** ← 모든 액션의 시작점
  - Inspector (선택된 요소 상세)
  - Suggested Actions (Quick Chips)

### 3.2 "회의 → 캠페인 풀패키지" 자동 생성 플로우 개관

```
1. Meeting From URL
   └─> YouTube/Zoom 링크 입력

2. Meeting AI 요약
   └─> 회의 제목, 한 줄 요약, 핵심 키메시지, 타깃, 문제/해결 포인트

3. Campaign Brief 생성
   └─> 캠페인 목표, 타깃 페르소나, 핵심 메시지, 톤앤매너

4. Concept 생성 (2-3개)
   └─> Concept A: "상큼한 하루 리프레시"
   └─> Concept B: "아이와 함께하는 비타민 간식"

5. Multi-Output Generation (각 Concept별)
   ├─> Presentation (3-5 슬라이드)
   ├─> Product Detail Page (제목/혜택/상세)
   ├─> Instagram News Ad (카드 3종)
   └─> Shorts Script (20-30초, 씬 단위)

6. Concept Board
   └─> 모든 Concept와 산출물을 한 화면에서 비교

7. Shorts Video Generation (선택적)
   └─> Concept 선택 → 키프레임 이미지 → 영상 조립
```

### 3.3 주요 산출물 4종 + 컨셉보드 정의

#### 산출물 1: Presentation (미니 프레젠테이션)
- **목적**: 캠페인 개요를 빠르게 설명하는 3-5장 슬라이드
- **구성**: 커버, 문제 정의, 솔루션, 혜택, CTA
- **포맷**: Polotno 기반 슬라이드 JSON

#### 산출물 2: Product Detail Page (상품 상세페이지)
- **목적**: 웹/앱에서 사용할 상세페이지 텍스트
- **구성**: 제목, 한 줄 설명, 핵심 혜택 리스트, 상세 문단, CTA
- **포맷**: Markdown 또는 구조화된 JSON

#### 산출물 3: Instagram News Ad (인스타 뉴스 스타일 광고)
- **목적**: 인스타그램 피드/스토리용 카드형 광고
- **구성**: 3개 카드, 각각 헤드라인/서브카피/CTA
- **포맷**: 카드별 텍스트 + 레이아웃 정보

#### 산출물 4: Shorts Script (쇼츠 스크립트)
- **목적**: 20-30초 쇼츠/틱톡 광고용 시나리오
- **구성**: 씬 단위 ShotSpec (장면 설명, 대사, 자막, 시간)
- **포맷**: Shot 리스트 JSON

#### 컨셉보드 (Concept Board)
- **목적**: 여러 Concept를 Mixboard 느낌으로 한 화면에 비교
- **구성**:
  - 상단: Meeting/Brand 정보 요약
  - 하단: Concept 카드 2-3개 가로 배열
  - 각 카드: 타이틀, 핵심 메시지, 톤앤매너, 대표 헤드라인, 산출물 링크

---

## 4. 핵심 플로우 개요 (하이레벨)

### 4.1 Meeting From URL (유튜브/Zoom 링크)

**입력**:
- YouTube URL 또는 Zoom 녹화 URL
- 회의 제목 (선택적)

**처리**:
1. yt-dlp로 자막 다운로드 (또는 Audio 추출)
2. Whisper STT로 텍스트 변환 (자막 없을 경우)
3. DB에 Meeting 레코드 생성, 상태: `ready_for_summary`

**출력**:
- Meeting ID
- 회의 원본 텍스트 (transcript)

**API**: `POST /api/v1/meetings/from-url`

### 4.2 Meeting AI 요약 & 키메시지 추출

**입력**:
- Meeting ID
- Meeting transcript

**처리**:
1. MeetingSummaryAgent 실행
   - 회의 제목 생성
   - 한 줄 요약
   - 핵심 키메시지 3-5개 추출
   - 타깃 페르소나
   - 주요 문제/해결 포인트

**출력**:
- MeetingSummary JSON
  ```json
  {
    "title": "제주 감귤 젤리 런칭 회의",
    "one_line_summary": "국내산 감귤을 활용한 건강한 젤리 신제품 기획",
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

**API**: `GET /api/v1/meetings/{id}` (상태 변경: `summary_ready`)

### 4.3 에이전트 기반 4개 산출물 생성

**입력**:
- Meeting ID
- Brand ID (선택된 브랜드 정보)

**처리 파이프라인**:
```
1. StrategistAgent
   └─> Campaign Brief 생성

2. ConceptAgent
   └─> ConceptConfig 2-3개 생성
       - Concept A: "상큼한 하루 리프레시"
       - Concept B: "아이와 함께하는 비타민 간식"

3. 각 Concept별로 병렬 실행:
   ├─> PresentationAgent → 3-5 슬라이드
   ├─> ProductDetailAgent → 상세페이지 텍스트
   ├─> InstagramNewsAdAgent → 카드 3종
   └─> ShortsScriptAgent → 씬 단위 스크립트

4. ReviewerAgent
   └─> 광고 규제, 과장 표현, 브랜드 일관성 검토
```

**출력**:
- Campaign ID
- Concept 리스트 (각각 4종 산출물 링크)

**API**: `POST /api/v1/demo/meeting-to-campaign`

### 4.4 컨셉보드에서 콘셉트 단위 비교

**입력**:
- Campaign ID 또는 Project ID

**처리**:
- DB에서 모든 Concept와 연결된 산출물 조회
- Concept Board용 데이터 패키지 생성

**출력**:
- ConceptBoardData JSON
  ```json
  {
    "meeting": { ... },
    "brand": { ... },
    "concepts": [
      {
        "concept_id": "...",
        "title": "상큼한 하루 리프레시",
        "core_message": "제주 감귤의 상큼함으로 하루를 상쾌하게",
        "tone_keywords": ["밝은", "경쾌한", "활기찬"],
        "color_palette": ["#FFA500", "#FFFFFF", "#FFD700"],
        "sample_headlines": [
          "아침마다 상큼하게, 제주 감귤 젤리",
          "하루를 깨우는 비타민 한 입"
        ],
        "linked_assets": {
          "presentation_id": "...",
          "product_detail_id": "...",
          "instagram_ids": ["...", "...", "..."],
          "shorts_script_id": "..."
        }
      },
      { ... }
    ]
  }
  ```

**API**: `GET /api/v1/demo/concept-board/{project_id}`

---

## 5. 데모 범위 (In/Out of Scope)

### 5.1 이번 발표에서 꼭 보여줄 기능 ✅

**Core Flow**:
- [x] Meeting From URL (YouTube 링크 → 자막/오디오 → 텍스트)
- [x] Meeting AI 요약 (제목, 한 줄 요약, 키메시지, 타깃)
- [x] Campaign Brief 생성
- [x] ConceptAgent가 2-3개 Concept 생성
- [x] 4종 산출물 생성 (Presentation/Detail/Instagram/Shorts)
- [x] Concept Board 화면 (가로 카드 레이아웃)

**Quality & UX**:
- [x] Chat 기반 원페이지 스튜디오 UX
- [x] 챗이 상태를 설명하는 Narration UI
- [x] Concept 카드 클릭 → 중앙 뷰 전환
- [x] ReviewerAgent 자동 검토

**Advanced (선택적)**:
- [~] Shorts Video Generation (키프레임 이미지 → ffmpeg 영상 조립)
- [~] ComfyUI 기반 이미지 생성

### 5.2 이번 데모에서 제외하는 기능 ❌

**장기 기능 (언급만)**:
- [ ] 자동 학습 (사용자 피드백 학습)
- [ ] 템플릿 마켓 (공유/판매)
- [ ] 장기 트렌드 크롤링
- [ ] 다국어 지원
- [ ] 실시간 협업 (멀티 유저)
- [ ] 버전 관리 (Git 스타일)

**기술적 제약**:
- [ ] 실제 YouTube 광고 집행 연동
- [ ] 완전한 Polotno 에디터 (읽기 전용 프리뷰만)
- [ ] 고도화된 디자인 시스템 (기본 레이아웃만)

---

## 6. UX 핵심 원칙: Chat 기반 원페이지 스튜디오

### 6.1 단일 화면 원칙 (One-Page Studio)

**라우트**: `/studio/demo` (또는 `/studio`의 데모 모드)

**원칙**:
- 데모 전체 플로우는 **하나의 화면** 안에서 진행된다
- 새로운 페이지 전환 없이, 중앙 영역만 전환된다
- 좌/중/우 패널 구조는 항상 유지된다

**장점**:
- 사용자가 컨텍스트를 잃지 않음
- 챗 히스토리가 계속 유지됨
- 발표 시 화면 전환이 자연스러움

### 6.2 Chat = 오케스트레이터 UI

**핵심 컨셉**:
- 사용자는 **모든 주요 액션을 챗에서 시작**한다
- UI 버튼/토글은 보조 수단일 뿐, 실제 스토리라인은 챗 대화로 설명/진행된다

**예시**:
```
유저: "이 회의 URL로 캠페인 만들어줘. https://www.youtube.com/watch?v=XXXXX"

챗: "알겠습니다. 회의 내용을 불러와서 요약하고, 캠페인 브리프를 만들게요."
    [내부: POST /api/v1/meetings/from-url 호출]

챗: "회의 요약이 준비됐어요.
     - 핵심 타깃: 30-40대 엄마
     - 주요 문제: 시중 젤리는 합성 첨가물 과다
     - 제안할 솔루션: 천연 재료 젤리

     이 내용으로 브랜드 {제주 감귤 브랜드} 기반 캠페인을 만들어볼까요?"

     [캠페인 만들기] 버튼
```

### 6.3 챗 메시지 ↔ 백엔드 파이프라인 1:1 매핑

**매핑 규칙**:

| 챗 입력 | 백엔드 API | 내부 에이전트 |
|--------|-----------|-------------|
| "이 회의로 캠페인 만들어줘" | `POST /api/v1/demo/meeting-to-campaign` | StrategistAgent, ConceptAgent |
| "캠페인 만들기" (버튼) | `POST /api/v1/demo/campaign-to-assets` | Presentation/Detail/Instagram/Shorts Agent |
| "Concept A로 쇼츠 만들어줘" | `POST /api/v1/demo/campaign-to-shorts` | ShortsScript, VisualPrompt, VideoBuilder |
| "컨셉보드 열기" (버튼) | `GET /api/v1/demo/concept-board/{id}` | 데이터 조회만 |

**구현**:
- OrchestratorAgent가 챗 입력을 해석
- Intent 분류 → 적절한 파이프라인 함수 호출
- 결과를 자연어 + 버튼으로 포장해서 프론트에 반환

### 6.4 상태를 챗이 설명하는 Narration UI

**원칙**:
- 백엔드 파이프라인의 각 단계를 챗이 실시간으로 설명한다
- "지금 어떤 에이전트가 무슨 일을 하는지" 사용자가 알 수 있어야 한다

**예시**:
```
챗: "회의 내용을 불러오는 중입니다..."
    → [내부: Meeting From URL 실행]

챗: "회의 요약 중..."
    → [내부: MeetingSummaryAgent 실행]

챗: "캠페인 브리프 생성 완료. 이제 2개 콘셉트를 만들게요."
    → [내부: ConceptAgent 실행]

챗: "Concept A 기반 슬라이드 생성 중..."
    → [내부: PresentationAgent 실행]

챗: "쇼츠용 키프레임 이미지 생성 중... (3/5)"
    → [내부: ComfyUI 호출, 진행률 표시]

챗: "모든 산출물이 준비됐어요. 아래 버튼을 눌러 확인해보세요."
    [컨셉보드 열기] [슬라이드 보기] [쇼츠 프리뷰 보기]
```

**기술 구현**:
- WebSocket 또는 Server-Sent Events (SSE)로 실시간 상태 스트리밍
- 프론트가 챗 메시지를 순차적으로 렌더링

### 6.5 컨셉보드/결과물을 챗에서 버튼/링크로 연결

**챗 응답 포맷**:
```json
{
  "message": "모든 산출물이 준비됐어요. 아래에서 결과를 확인하세요.",
  "view": "concept_board",
  "next_actions": [
    {
      "label": "컨셉보드 열기",
      "action": "open_concept_board",
      "payload": { "project_id": "..." }
    },
    {
      "label": "Concept A 슬라이드 보기",
      "action": "open_slides",
      "payload": { "concept_id": "...", "presentation_id": "..." }
    },
    {
      "label": "Concept B 쇼츠 프리뷰",
      "action": "open_shorts_preview",
      "payload": { "concept_id": "...", "shorts_id": "..." }
    }
  ]
}
```

**프론트 동작**:
- 버튼 클릭 시 `payload`를 기반으로 중앙 뷰 전환
- 챗 히스토리에 버튼이 포함되어 있어서 나중에 다시 클릭 가능

---

## 7. 기능 요구사항 요약

### 7.1 Meeting From URL

**기능**: YouTube/Zoom URL에서 회의 텍스트 추출

**요구사항**:
- yt-dlp로 자막 다운로드 (한국어/영어)
- 자막 없을 경우 Whisper STT로 오디오 → 텍스트 변환
- Meeting 레코드 생성, transcript 저장

**성능**:
- 10분 회의 기준 30초 이내 처리
- 자막 있을 경우 10초 이내

### 7.2 Meeting Summary & Key Message

**기능**: 회의 텍스트에서 핵심 정보 추출

**요구사항**:
- MeetingSummaryAgent 실행
- 제목, 한 줄 요약, 키메시지 3-5개, 타깃, 문제/해결 포인트 추출
- JSON 구조화 저장

**품질**:
- 키메시지는 구체적이고 액션 가능해야 함 (예: "국내산 제주 감귤 100%")
- 타깃은 구체적 페르소나여야 함 (예: "30-40대 엄마")

### 7.3 Multi-Output Generation (슬라이드/상세/인스타/쇼츠)

**기능**: 4종 산출물 자동 생성

**요구사항**:
- **Presentation**:
  - 3-5 슬라이드
  - Polotno JSON 포맷
  - 커버, 문제, 솔루션, 혜택, CTA 구조

- **Product Detail**:
  - 제목 (30자 이내)
  - 한 줄 설명 (50자 이내)
  - 핵심 혜택 3-5개 리스트
  - 상세 문단 (200-300자)
  - CTA 문구

- **Instagram News Ad**:
  - 카드 3종
  - 각 카드: 헤드라인 (20자), 서브카피 (40자), CTA (10자)
  - 레이아웃 정보 (이미지 영역/텍스트 영역 비율)

- **Shorts Script**:
  - 20-30초 분량
  - 씬 단위 ShotSpec (5-7개)
  - 각 shot: role, duration, narration, onscreen_text, scene_brief

**품질**:
- 모든 산출물은 같은 Concept 기반으로 일관된 톤/메시지 유지
- ReviewerAgent 검토 통과 (광고 규제, 과장 표현 없음)

### 7.4 Concept Board

**기능**: 여러 Concept를 한 화면에서 비교

**요구사항**:
- 가로 카드 레이아웃 (2-3개)
- 각 카드: 타이틀, 핵심 메시지, 톤앤매너, 샘플 헤드라인, 산출물 링크
- 카드 클릭 → 중앙 뷰 전환 (해당 Concept 산출물 필터링)
- 믹스보드/무드보드 느낌의 UI

**UX**:
- 직관적 비교 가능 (A vs B 콘셉트)
- 드래그앤드롭으로 카드 순서 변경 (선택적)

### 7.5 Shorts/영상 프리뷰 생성 (키프레임 + ffmpeg)

**기능**: Shorts Script → 키프레임 이미지 → 영상 조립

**요구사항**:
- ShortsScriptAgent 결과 기반
- 각 shot별 VisualPromptAgent → ComfyUI 프롬프트 생성
- ComfyUI 호출하여 키프레임 이미지 생성 (1024x1024 or 9:16 비율)
- VideoBuilder(ffmpeg)로 영상 조립:
  - 각 컷 길이 (duration)에 맞춰 이미지 표시
  - 자막 오버레이 (onscreen_text)
  - 컷 전환 효과 (fade/crossfade)
  - 최종 mp4 출력 (720p 또는 1080p)

**성능**:
- 5개 shot 기준 이미지 생성 1-2분
- 영상 조립 10초 이내

---

## 8. 기술 아키텍처 개요 (데모 버전)

### 8.1 백엔드: FastAPI + PostgreSQL + pgvector

**스택**:
- FastAPI 0.104+ (Python 3.11)
- PostgreSQL 15 with pgvector extension
- SQLAlchemy 2.0 (ORM)
- Pydantic v2 (스키마 검증)
- Celery (백그라운드 작업, 선택적)

**데이터베이스 테이블**:
- `meetings`: 회의 원본 데이터
- `meeting_transcripts`: 자막/STT 결과
- `meeting_summaries`: 요약/키메시지
- `campaigns`: 캠페인 브리프
- `concepts`: Concept 정의
- `presentations`, `product_details`, `instagram_ads`, `shorts_scripts`: 산출물

### 8.2 LLM Router (OpenAI + 로컬 LLM)

**전략**:
- **고성능 작업**: OpenAI GPT-4 Turbo (또는 GPT-4o)
  - MeetingSummaryAgent
  - StrategistAgent
  - ConceptAgent

- **경량 작업**: OpenAI GPT-3.5 Turbo 또는 로컬 LLM (Llama 3 8B)
  - CopywriterAgent (간단한 카피)
  - DesignerAgent (레이아웃 정보)

- **특수 작업**: Whisper (OpenAI API 또는 로컬 faster-whisper)
  - STT 전용

**비용 최적화**:
- 프롬프트 캐싱
- 토큰 수 제한
- 로컬 LLM 우선 사용 (품질 충분할 경우)

### 8.3 이미지/영상: ComfyUI + ffmpeg

**ComfyUI**:
- GPU 서버 (RTX 4070 SUPER 12GB VRAM)
- Stable Diffusion XL 또는 Flux
- API 엔드포인트: `http://100.120.180.42:8188`
- 워크플로우: 기존 템플릿 재사용

**ffmpeg**:
- 버전 7.1.2
- Docker 컨테이너 내장
- 이미지 → 영상 변환
- 자막 오버레이 (subtitle burn-in)

### 8.4 프론트엔드: Next.js + Canvas Studio(Concept Board 포함)

**스택**:
- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- Polotno Editor (read-only preview)

**주요 컴포넌트**:
- `/studio/demo` 라우트
- CanvasStudioLayout (좌/중/우 패널)
- ChatPanel (우측, Sparklio Assistant)
- ConceptBoard (중앙, 가로 카드 레이아웃)
- SlidesPreview, DetailPreview, InstagramPreview, ShortsPreview

---

## 9. 에이전트 구조 개요

### 9.1 Meeting Agent

**MeetingFromUrlAgent**:
- 역할: YouTube/Zoom URL에서 텍스트 추출
- 입력: URL, language
- 출력: Meeting ID, transcript

**MeetingSummaryAgent**:
- 역할: 회의 텍스트 → 요약/키메시지
- 입력: Meeting transcript
- 출력: MeetingSummary JSON
- LLM: GPT-4 Turbo

### 9.2 Strategist / Copywriter / Designer / ConceptAgent

**StrategistAgent**:
- 역할: Campaign Brief 생성
- 입력: MeetingSummary, Brand Kit
- 출력: CampaignBrief JSON
- LLM: GPT-4 Turbo

**ConceptAgent**:
- 역할: ConceptConfig 2-3개 생성
- 입력: CampaignBrief, Brand Kit
- 출력: ConceptConfig 리스트
- LLM: GPT-4 Turbo

**CopywriterAgent**:
- 역할: 슬라이드/상세/인스타/쇼츠 카피 작성
- 입력: Concept, Channel Type
- 출력: 채널별 텍스트
- LLM: GPT-3.5 Turbo (경량)

**DesignerAgent**:
- 역할: 레이아웃/톤 정보 생성
- 입력: Concept, Channel Type
- 출력: Layout JSON (색상, 폰트, 레이아웃 비율)
- LLM: GPT-3.5 Turbo

### 9.3 ShortsScriptAgent / VisualPromptAgent / VideoBuilder

**ShortsScriptAgent**:
- 역할: 쇼츠 스크립트 생성 (씬 단위)
- 입력: Concept, Brand Kit
- 출력: ShotSpec 리스트
- LLM: GPT-4 Turbo

**VisualPromptAgent**:
- 역할: ComfyUI용 프롬프트 생성
- 입력: Concept, Brand, Shot
- 출력: 프롬프트 문자열 + 파라미터
- LLM: GPT-3.5 Turbo

**VideoBuilder**:
- 역할: 키프레임 이미지 → 영상 조립
- 입력: Shot 리스트 + 이미지 URL 리스트
- 출력: mp4 파일 URL
- 기술: ffmpeg (비LLM)

### 9.4 ReviewerAgent (광고 규제/과장 점검)

**ReviewerAgent**:
- 역할: 광고 규제, 과장 표현, 톤/브랜드 일관성 검사
- 입력: 산출물 텍스트 (모든 채널)
- 출력: Review Report (통과/수정 필요, 이슈 리스트)
- LLM: GPT-4 Turbo

**검사 항목**:
- [ ] 의료/건강 관련 과장 표현
- [ ] "최고", "1위" 같은 근거 없는 주장
- [ ] 브랜드 가이드 위반 (톤앤매너)
- [ ] 경쟁사 비방
- [ ] 법적 리스크 키워드

---

## 10. 데모 평가 기준 & 성공 조건

### 10.1 학원 발표 시 성공 기준

**스토리 자연스러움**:
- [ ] "회의 → 캠페인 풀패키지" 플로우가 한 눈에 이해되는가?
- [ ] 챗 기반 UX가 직관적으로 느껴지는가?
- [ ] 컨셉보드가 "믹스보드" 느낌을 주는가?

**에이전트 설명력**:
- [ ] 각 에이전트의 역할이 명확한가?
- [ ] "왜 멀티 에이전트가 필요한지" 설득력 있게 설명되는가?

**결과물 품질**:
- [ ] 슬라이드/상세/인스타/쇼츠가 일관된 톤을 유지하는가?
- [ ] Concept A vs B가 명확히 구분되는가?
- [ ] 텍스트가 실제 마케팅 자료로 쓸 만한 수준인가?

**발표 완성도**:
- [ ] 슬라이드 8-10장으로 스토리가 완결되는가?
- [ ] 라이브 데모가 끊김 없이 진행되는가?
- [ ] 마무리 멘트가 강렬한가? ("회의 한 번으로 캠페인 초안 패키지")

### 10.2 기술적 성공 기준

**안정성**:
- [ ] 데모 중 에러 없이 플로우 완주
- [ ] Meeting From URL 성공률 95% 이상
- [ ] 에이전트 실행 오류 0건

**성능**:
- [ ] Meeting From URL → 요약: 30초 이내
- [ ] 캠페인 생성 (4종 산출물): 2분 이내
- [ ] 쇼츠 영상 생성 (키프레임 포함): 3분 이내

**품질**:
- [ ] ReviewerAgent 검토 통과율 90% 이상
- [ ] 사용자가 "실제로 쓸 만하다"고 느낄 수준

**UX**:
- [ ] 챗 Narration이 실시간으로 표시되는가?
- [ ] 중앙 뷰 전환이 자연스러운가?
- [ ] Concept Board 카드 클릭이 직관적인가?

---

## 참고 문서

- [SPARKLIO_DEMO_V1_STORY_AND_FLOW.md](./SPARKLIO_DEMO_V1_STORY_AND_FLOW.md) - 발표 스토리 & 데모 흐름
- [CHAT_ONEPAGE_STUDIO_PRINCIPLES.md](./CHAT_ONEPAGE_STUDIO_PRINCIPLES.md) - 챗 기반 원페이지 스튜디오 원칙
- [FRONTEND_DEMO_FLOW.md](./FRONTEND_DEMO_FLOW.md) - 프론트엔드 데모 플로우
- [BACKEND_DEMO_APIS.md](./BACKEND_DEMO_APIS.md) - 백엔드 API 명세
- [AGENTS_DEMO_SPEC.md](./AGENTS_DEMO_SPEC.md) - 에이전트 상세 스펙
- [CONCEPT_BOARD_SPEC.md](./CONCEPT_BOARD_SPEC.md) - 컨셉보드 스펙
- [SHORTS_VIDEO_PIPELINE.md](./SHORTS_VIDEO_PIPELINE.md) - 쇼츠 영상 파이프라인
- [DEMO_QA_CHECKLIST.md](./DEMO_QA_CHECKLIST.md) - 발표 전 QA 체크리스트

---

**문서 상태**: ✅ 완성
**다음 단계**: 나머지 8개 문서 작성
**버전**: v1.0
**최종 수정**: 2025-11-24
