# MEETING_AI_SPEC.md

**문서 버전**: v1.0
**작성일**: 2025-11-14 (금요일) 17:15
**작성자**: Team A (Docs & Architecture)
**Phase**: P1 (Spec Document Draft)
**상태**: 초안 완료

---

## 1. 개요 (Overview)

Meeting AI는 회의 음성을 업로드하거나 실시간으로 녹음하여 **회의록 자동 요약 → 구조화 → 마케팅/기획 산출물 자동 생성 → 에디터 편집 → 발행**까지 이어지는 Sparklio의 핵심 생산성 기능입니다.

### 1.1 핵심 가치 제안 (Value Proposition)

- **회의에서 나온 모든 인사이트를 낭비하지 않음**
- **단 한 번의 녹음으로 10가지 산출물 자동 생성**
- **기획/마케팅/개발 회의 모두 지원**
- **B2B SaaS 핵심 Pain Point 해결**

### 1.2 자동 생성 산출물

1. **회의 요약 (핵심 논의 + 결정사항 + Action Items)**
2. **프리젠테이션 (10~20 슬라이드)**
3. **상품 상세페이지/기획서**
4. **마케팅 브리프**
5. **블로그 포스트**
6. **SNS 포스트 (Instagram, X, Threads)**
7. **영상 콘티/스토리보드**
8. **태스크 자동 생성 (Notion, Asana, Jira 연동)**

---

## 2. 시스템 아키텍처 (System Architecture)

Meeting AI는 **3-Node Hybrid 인프라**를 활용하여 Mac mini에서 LLM 라우팅을 수행하고, Desktop GPU에서 필요시 Qwen 로컬 LLM을 사용합니다.

### 2.1 아키텍처 다이어그램

```
┌─────────────────────────────────────────────────────────────┐
│                     Mac mini (M2 Server)                    │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ FastAPI Main Orchestrator                               │ │
│  │ ├─ Meeting API (/api/meeting/*)                         │ │
│  │ ├─ Smart LLM Router (Qwen/GPT-4o/Claude 자동 선택)      │ │
│  │ ├─ Celery Task Queue (Redis)                            │ │
│  │ ├─ PostgreSQL (Metadata)                                │ │
│  │ └─ MinIO (Audio/Transcript Storage)                     │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              ↕ Tailscale VPN
┌─────────────────────────────────────────────────────────────┐
│               Desktop RTX 4070 (GPU Worker)                 │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ STT Worker (Whisper-large-v3)                           │ │
│  │ LLM Worker (Qwen2.5-14B/32B via Ollama)                 │ │
│  │ Celery Worker (stt_queue, llm_queue)                    │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              ↕ HTTP/WebSocket
┌─────────────────────────────────────────────────────────────┐
│                  Laptop (Development/Frontend)              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Next.js App                                             │ │
│  │ ├─ /meeting-ai (Upload & Summary)                       │ │
│  │ ├─ /meeting-ai/[id] (Detail & Assets)                   │ │
│  │ └─ /editor/[assetId] (One-Page/Video Editor)            │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 노드별 역할

#### Mac mini (M2 Server)
- **API Gateway**: 모든 클라이언트 요청 수신
- **LLM Router**: Qwen (Local) vs GPT-4o/Claude (Cloud) 자동 선택
- **Orchestrator**: STT, MIA, Asset Generation 워크플로우 조율
- **DB/Storage**: 메타데이터(PostgreSQL), 파일(MinIO)

#### Desktop RTX 4070 (GPU Worker)
- **STT**: Whisper-large-v3 (GPU 가속)
- **Local LLM**: Qwen2.5-14B/32B (요약/구조화 작업)
- **Celery Worker**: `stt_queue`, `llm_queue` 태스크 처리

#### Laptop (Development)
- **Frontend**: Next.js UI
- **테스트**: 개발 중 QA

---

## 3. E2E 파이프라인 (End-to-End Flow)

```
User Upload Audio (mp3/m4a/wav)
          ↓
[Mac mini] POST /api/meeting/upload
          ↓
[Desktop GPU] STT 작업 (Whisper-large-v3)
          ↓ (transcript.txt)
[Mac mini] 트랜스크립트 저장 (MinIO)
          ↓
[Mac mini] Meeting Intelligence Agent (MIA) 실행
          ↓ (Smart LLM Router: Qwen or Claude?)
[Desktop/Cloud] LLM 호출 (요약/구조화)
          ↓ (structured_summary.json)
[Mac mini] SmartRouter 판단
          ↓
[Mac mini] Asset Generator Agents 호출
          ↓ (presentation, product_detail, sns_posts, etc.)
[Frontend] One-Page Editor / Video Editor 로딩
          ↓
[User] 편집 후 발행 (WordPress, SNS, Notion)
```

---

## 4. Meeting Intelligence Agent (MIA) 상세 설계

### 4.1 입력 (Input)

```json
{
  "meeting_id": "uuid",
  "transcript": "회의 전체 텍스트...",
  "brand_kit": {
    "brand_name": "Sparklio",
    "tone": "professional",
    "colors": ["#FF5733", "#3498DB"]
  },
  "context": {
    "meeting_type": "auto_detect",
    "participants": ["홍길동", "김철수"]
  }
}
```

### 4.2 출력 (Output Schema)

```json
{
  "meeting_id": "uuid",
  "detected_meeting_type": "marketing|product|strategy|general",
  "summary": {
    "short": "1~2문장 요약",
    "detailed": "5~10문장 상세 요약"
  },
  "agenda": [
    {
      "topic": "Q1 마케팅 캠페인",
      "timestamp": "00:05:23",
      "speaker": "홍길동"
    }
  ],
  "discussion_points": [
    {
      "topic": "인플루언서 협업",
      "key_insights": ["예산 $10K", "3월 런칭"],
      "timestamp": "00:12:45"
    }
  ],
  "decisions": [
    {
      "decision": "Instagram Reels 우선 집중",
      "rationale": "타겟층 20~30대 집중",
      "timestamp": "00:18:30"
    }
  ],
  "action_items": [
    {
      "task": "Landing page 수정",
      "owner": "김철수",
      "due_date": "2025-02-15",
      "priority": "high"
    }
  ],
  "product_insights": [
    {
      "feature": "AI 자동 편집",
      "usp": "3분 안에 영상 생성",
      "competitive_advantage": "경쟁사 대비 5배 빠름"
    }
  ],
  "marketing_points": [
    {
      "channel": "Instagram",
      "message": "빠르고 쉬운 마케팅 자동화",
      "cta": "무료 체험 시작"
    }
  ],
  "recommended_assets": {
    "presentation": {
      "enabled": true,
      "reason": "캠페인 전략 논의, 의사결정 3개 이상",
      "estimated_slides": 12
    },
    "product_detail_page": {
      "enabled": true,
      "reason": "제품 기능 및 USP 언급",
      "estimated_sections": 5
    },
    "marketing_brief": {
      "enabled": true,
      "reason": "채널/타겟/메시지 명확함"
    },
    "blog_post": {
      "enabled": false,
      "reason": "블로그 콘텐츠 요소 부족"
    },
    "sns_posts": {
      "enabled": true,
      "reason": "SNS 전략 명시적 언급",
      "channels": ["instagram", "threads"]
    },
    "video_storyboard": {
      "enabled": true,
      "reason": "영상 콘티 논의, 장면 구성 언급",
      "estimated_scenes": 4
    }
  }
}
```

### 4.3 MIA 내부 모듈

1. **Preprocessor**: 타임스탬프, 화자 태깅
2. **Segmentation**: 주제별 세그먼트 분리
3. **Intent/Topic Classifier**: 회의 유형 자동 감지
4. **Structure Builder**: Agenda, Discussion, Decisions 추출
5. **Action Item Extractor**: 태스크, 책임자, 기한 추출
6. **Insight Extractor**: Product/Marketing 인사이트 도출
7. **Asset Recommendation Engine**: 생성물 추천 로직
8. **JSON Assembler**: 최종 JSON 생성

### 4.4 Smart LLM Router 통합

MIA는 **Smart LLM Router**를 사용하여 최적의 LLM을 자동 선택합니다:

```python
# Mac mini FastAPI
async def run_mia(meeting_id: str, transcript: str) -> dict:
    # 1단계: 요약 작업 (Qwen 14B 로컬 우선)
    summary_task = {
        "task_type": "summarization",
        "context_length": len(transcript),
        "quality_level": "standard"
    }
    summary_result = await smart_llm_router.route(summary_task, transcript)

    # 2단계: 구조화/인사이트 추출 (복잡도 높음 → Claude 가능)
    structure_task = {
        "task_type": "structured_analysis",
        "context_length": len(transcript),
        "quality_level": "high",
        "requires_reasoning": True
    }
    structured_result = await smart_llm_router.route(structure_task, summary_result)

    return structured_result
```

**라우팅 규칙**:
- **Qwen 14B (Desktop Local)**: 요약, 단순 구조화 (< 4K tokens)
- **Qwen 32B (Desktop Local)**: 복잡한 분석, 인사이트 추출 (< 8K tokens)
- **GPT-4o (Cloud)**: 매우 긴 회의 (> 8K tokens), 다국어
- **Claude 3.5 Sonnet (Cloud)**: 고품질 인사이트, 복잡한 추론

**비용 최적화**:
- 70% 요청: Qwen 로컬 → $0.00
- 20% 요청: GPT-4o → ~$0.03/회의
- 10% 요청: Claude → ~$0.15/회의
- **평균 비용/회의**: < $0.01

---

## 5. API 명세서 (API Contracts)

### 5.1 POST /api/meeting/upload

**Request (multipart/form-data)**:
```json
{
  "audio_file": "<binary>",
  "meeting_title": "Q1 마케팅 전략 회의",
  "brand_kit_id": "uuid",
  "metadata": {
    "date": "2025-02-10",
    "participants": ["홍길동", "김철수"]
  }
}
```

**Response**:
```json
{
  "meeting_id": "uuid",
  "status": "processing",
  "progress": {
    "stt": "queued",
    "analysis": "pending",
    "generation": "pending"
  },
  "estimated_completion": "2025-02-10T15:23:00Z"
}
```

### 5.2 GET /api/meeting/{meeting_id}/status

**Response**:
```json
{
  "meeting_id": "uuid",
  "status": "completed",
  "progress": {
    "stt": "completed",
    "analysis": "completed",
    "generation": "ready"
  },
  "summary_available": true,
  "assets_recommended": 5
}
```

### 5.3 GET /api/meeting/{meeting_id}/summary

**Response**: (MIA 출력 JSON 전체)

### 5.4 POST /api/meeting/{meeting_id}/generate-assets

**Request**:
```json
{
  "assets": [
    "presentation",
    "product_detail_page",
    "sns_posts"
  ],
  "options": {
    "presentation_slides": 15,
    "sns_channels": ["instagram", "threads"]
  }
}
```

**Response**:
```json
{
  "task_id": "uuid",
  "assets_queued": 3,
  "estimated_completion": "2025-02-10T15:30:00Z"
}
```

### 5.5 WebSocket /ws/meeting/{meeting_id}

**실시간 진행 상황 업데이트**:
```json
{
  "event": "stt_completed",
  "meeting_id": "uuid",
  "progress": 33,
  "message": "음성 인식 완료"
}
```

```json
{
  "event": "mia_completed",
  "meeting_id": "uuid",
  "progress": 66,
  "summary_url": "/api/meeting/{id}/summary"
}
```

```json
{
  "event": "asset_generated",
  "meeting_id": "uuid",
  "asset_type": "presentation",
  "asset_id": "uuid",
  "progress": 90,
  "editor_url": "/editor/{asset_id}"
}
```

---

## 6. SmartRouter 통합 시나리오

### 6.1 회의 유형별 자동 라우팅

| Meeting Type | 기본 추천 산출물 | 라우팅 근거 |
|--------------|------------------|-------------|
| **Marketing** | SNS, Presentation, Brief | 채널/메시지/캠페인 논의 |
| **Product** | Product Detail, Deck, Video | 기능/USP/런칭 논의 |
| **Strategy** | Presentation, Brief | 로드맵/방향성 중심 |
| **General** | Presentation (최소) | 범용 회의 |

### 6.2 라우팅 판단 규칙

```python
# Mac mini - SmartRouter
def determine_assets(mia_output: dict) -> list:
    assets = []

    # 1단계: Meeting Type 기반
    if mia_output['detected_meeting_type'] == 'marketing':
        assets.extend(['presentation', 'marketing_brief', 'sns_posts'])

    # 2단계: 논의 내용 기반 조정
    if len(mia_output['product_insights']) > 0:
        assets.append('product_detail_page')

    if len(mia_output['marketing_points']) > 0:
        assets.extend(['sns_posts', 'blog_post'])

    if 'video' in mia_output.get('keywords', []):
        assets.append('video_storyboard')

    # 3단계: MIA 추천 우선 적용
    for asset, config in mia_output['recommended_assets'].items():
        if config['enabled'] and asset not in assets:
            assets.append(asset)

    return list(set(assets))  # 중복 제거
```

### 6.3 Asset Generator 호출

```python
# Mac mini - Asset Generation Orchestrator
@celery.task
async def generate_all_assets(meeting_id: str, asset_list: list):
    for asset_type in asset_list:
        if asset_type == 'presentation':
            await DeckGeneratorAgent.generate(meeting_id)
        elif asset_type == 'product_detail_page':
            await ProductDetailGeneratorAgent.generate(meeting_id)
        elif asset_type == 'sns_posts':
            await SNSGeneratorAgent.generate(meeting_id)
        elif asset_type == 'video_storyboard':
            await VideoStoryboardAgent.generate(meeting_id)
        # ... 기타 에이전트
```

---

## 7. STT 파이프라인 (Speech-to-Text)

### 7.1 Whisper GPU 가속 (Desktop RTX 4070)

```python
# Desktop - Celery Worker (stt_queue)
from faster_whisper import WhisperModel

@celery.task(queue='stt_queue')
def transcribe_audio(meeting_id: str, audio_path: str) -> str:
    model = WhisperModel("large-v3", device="cuda", compute_type="float16")

    segments, info = model.transcribe(
        audio_path,
        language="ko",
        beam_size=5,
        vad_filter=True,  # Voice Activity Detection
        word_timestamps=True
    )

    transcript = []
    for segment in segments:
        transcript.append({
            "start": segment.start,
            "end": segment.end,
            "text": segment.text,
            "speaker": detect_speaker(segment)  # Diarization
        })

    # Mac mini MinIO에 저장
    save_to_minio(meeting_id, transcript)
    return meeting_id
```

### 7.2 성능 목표

- **처리 속도**: 1시간 회의 → 3~5분 STT
- **정확도**: 한국어 > 95% WER (Word Error Rate)
- **화자 분리**: pyannote-audio 사용 (선택적)

### 7.3 폴백 전략

1. **1차**: Whisper-large-v3 (Desktop GPU)
2. **2차**: Whisper.cpp (CPU 폴백)
3. **3차**: Google Cloud STT API (네트워크 장애 시)

---

## 8. 프론트엔드 UI/UX 플로우

### 8.1 페이지 구조

```
/app/meeting-ai
├─ page.tsx              (메인: 업로드 + 최근 회의 목록)
├─ [meetingId]/
│  ├─ page.tsx           (회의 상세: 요약 + 추천 산출물)
│  └─ components/
│     ├─ SummaryCard.tsx
│     ├─ AgendaAccordion.tsx
│     ├─ ActionItemsTable.tsx
│     └─ RecommendedAssets.tsx
└─ components/
   ├─ AudioUploader.tsx
   └─ ProgressTracker.tsx
```

### 8.2 7단계 UX 플로우

#### Step 1: 업로드 페이지
```tsx
// AudioUploader Component
<DragDropZone accept=".mp3,.m4a,.wav">
  <Icon name="upload" />
  <Text>회의 녹음 파일을 드래그하거나 클릭하세요</Text>
</DragDropZone>

<Button icon="mic" variant="outline">
  실시간 녹음 시작
</Button>
```

#### Step 2: 분석 진행 (ProgressTracker)
```tsx
<ProgressBar stages={[
  { name: '음성 인식', status: 'completed', progress: 100 },
  { name: '회의 분석', status: 'in_progress', progress: 45 },
  { name: '산출물 추천', status: 'pending', progress: 0 }
]} />
```

#### Step 3: 요약 결과 화면
```tsx
<SummaryCard>
  <Heading>회의 요약</Heading>
  <Text>{summary.short}</Text>
  <Accordion title="상세 요약">
    {summary.detailed}
  </Accordion>
</SummaryCard>

<AgendaAccordion items={agenda} />

<ActionItemsTable>
  {action_items.map(item => (
    <TableRow>
      <Cell>{item.task}</Cell>
      <Cell>{item.owner}</Cell>
      <Cell>{item.due_date}</Cell>
      <Cell><Badge>{item.priority}</Badge></Cell>
    </TableRow>
  ))}
</ActionItemsTable>
```

#### Step 4: 추천 산출물 카드
```tsx
<Grid cols={3} gap={4}>
  {recommended_assets.map(asset => (
    <Card>
      <Icon name={asset.icon} size="xl" />
      <Heading>{asset.title}</Heading>
      <Text color="muted">{asset.reason}</Text>
      <Button onClick={() => generate(asset.type)}>
        생성하기
      </Button>
    </Card>
  ))}
</Grid>

<Button variant="primary" size="lg" fullWidth>
  추천된 모든 산출물 만들기
</Button>
```

#### Step 5: 생성 진행
```tsx
<AssetGenerationProgress>
  {assets.map(asset => (
    <ProgressItem>
      <Text>{asset.title}</Text>
      <ProgressBar value={asset.progress} />
      <Status>{asset.status}</Status>
    </ProgressItem>
  ))}
</AssetGenerationProgress>
```

#### Step 6: 에디터 로딩
```tsx
// 생성 완료 시 자동 리다이렉트
router.push(`/editor/${asset_id}`)
```

#### Step 7: 발행 옵션
```tsx
<PublishModal>
  <Checkbox label="PDF로 저장" />
  <Checkbox label="WordPress 발행" />
  <Checkbox label="Instagram 발행" />
  <Checkbox label="Notion에 Action Items 전송" />
  <Button>발행하기</Button>
</PublishModal>
```

---

## 9. 백엔드 작업 지시서 (Backend Tasks)

### 9.1 디렉토리 구조

```
backend/
├─ app/
│  ├─ api/
│  │  └─ meeting/
│  │     ├─ upload.py
│  │     ├─ status.py
│  │     ├─ summary.py
│  │     └─ generate.py
│  ├─ agents/
│  │  └─ meeting_intelligence_agent.py
│  ├─ workers/
│  │  ├─ stt_worker.py        (Desktop GPU)
│  │  └─ llm_worker.py         (Desktop GPU)
│  └─ services/
│     ├─ smart_llm_router.py
│     └─ asset_router.py
└─ celery_app.py
```

### 9.2 Celery 큐 구조

```python
# celery_app.py
app = Celery('sparklio')

app.conf.task_routes = {
    'stt_worker.*': {'queue': 'stt_queue'},        # Desktop GPU
    'llm_worker.*': {'queue': 'llm_queue'},        # Desktop GPU or Cloud
    'mia_worker.*': {'queue': 'mia_queue'},        # Mac mini
    'asset_worker.*': {'queue': 'asset_queue'},    # Mac mini
}
```

### 9.3 주요 구현 파일

#### meeting/upload.py (Mac mini)
```python
from fastapi import APIRouter, UploadFile
from app.workers.stt_worker import transcribe_audio

router = APIRouter()

@router.post("/upload")
async def upload_meeting(audio_file: UploadFile, metadata: dict):
    meeting_id = generate_uuid()

    # MinIO에 오디오 저장
    audio_path = await save_to_minio(meeting_id, audio_file)

    # Desktop GPU에 STT 작업 전송
    transcribe_audio.apply_async(args=[meeting_id, audio_path], queue='stt_queue')

    return {
        "meeting_id": meeting_id,
        "status": "processing"
    }
```

#### agents/meeting_intelligence_agent.py (Mac mini)
```python
from app.services.smart_llm_router import SmartLLMRouter

class MeetingIntelligenceAgent:
    def __init__(self):
        self.router = SmartLLMRouter()

    async def analyze(self, meeting_id: str, transcript: str) -> dict:
        # 1단계: 요약 (Qwen 14B 로컬 우선)
        summary = await self.router.route({
            "task_type": "summarization",
            "prompt": f"다음 회의를 요약하세요:\n\n{transcript}"
        })

        # 2단계: 구조화 (Qwen 32B 또는 Claude)
        structure = await self.router.route({
            "task_type": "structured_extraction",
            "prompt": self.build_structure_prompt(transcript, summary)
        })

        # 3단계: 인사이트 추출
        insights = await self.extract_insights(structure)

        # 4단계: 산출물 추천
        recommendations = await self.recommend_assets(insights)

        return {
            "meeting_id": meeting_id,
            "summary": summary,
            **structure,
            **insights,
            "recommended_assets": recommendations
        }
```

---

## 10. 성능 목표 (Performance Targets)

| 단계 | 목표 시간 | 비용 |
|------|----------|------|
| **STT (1시간 회의)** | 3~5분 | $0.00 (로컬) |
| **MIA 분석** | 30초~1분 | $0.00~0.05 |
| **산출물 생성 (전체)** | 2~5분 | $0.10~0.50 |
| **전체 E2E** | < 10분 | < $0.60 |

### 10.1 확장성 (Scalability)

- **동시 회의 처리**: Desktop GPU 1대로 3~5개 동시 처리
- **대기열 관리**: Redis Celery Queue
- **비용 절감**: 70% 로컬 LLM 사용 → 월 LLM 비용 < $50

---

## 11. 통합 시나리오 (Integration Scenarios)

### 11.1 시나리오 1: 마케팅 전략 회의

**입력**: 30분 회의 (캠페인 목표, 채널 전략, 인플루언서 협업)

**MIA 출력**:
```json
{
  "detected_meeting_type": "marketing",
  "recommended_assets": {
    "presentation": { "enabled": true, "estimated_slides": 12 },
    "marketing_brief": { "enabled": true },
    "sns_posts": { "enabled": true, "channels": ["instagram", "threads"] },
    "video_storyboard": { "enabled": false }
  }
}
```

**자동 생성**:
1. 12슬라이드 프리젠테이션 (캠페인 전략 덱)
2. 마케팅 브리프 (타겟/메시지/채널)
3. SNS 포스트 초안 (Instagram 3개, Threads 2개)

**소요 시간**: 8분
**비용**: $0.15

---

### 11.2 시나리오 2: 상품 기획 회의

**입력**: 1시간 회의 (신제품 기능, USP, 경쟁 분석, 가격 전략)

**MIA 출력**:
```json
{
  "detected_meeting_type": "product",
  "product_insights": [
    {
      "feature": "AI 자동 편집",
      "usp": "3분 안에 영상 생성",
      "competitive_advantage": "경쟁사 대비 5배 빠름"
    }
  ],
  "recommended_assets": {
    "product_detail_page": { "enabled": true, "estimated_sections": 6 },
    "presentation": { "enabled": true, "estimated_slides": 18 },
    "video_storyboard": { "enabled": true, "estimated_scenes": 5 }
  }
}
```

**자동 생성**:
1. 상품 상세페이지 (6섹션: Hero, Features, USP, Pricing, CTA, FAQ)
2. 18슬라이드 프리젠테이션 (제품 소개 덱)
3. 영상 콘티 (5씬 스토리보드)

**소요 시간**: 12분
**비용**: $0.45

---

## 12. 배포 및 운영 (Deployment & Operations)

### 12.1 Docker Compose (Mac mini)

```yaml
version: '3.8'
services:
  fastapi:
    image: sparklio/backend:latest
    environment:
      - SMART_LLM_ROUTER_QWEN_URL=http://sparklio-desktop:11434
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
    ports:
      - "8000:8000"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  postgres:
    image: postgres:15
    environment:
      - POSTGRES_DB=sparklio
    volumes:
      - pgdata:/var/lib/postgresql/data

  minio:
    image: minio/minio
    command: server /data --console-address ":9001"
    ports:
      - "9000:9000"
      - "9001:9001"
    volumes:
      - minio_data:/data
```

### 12.2 Desktop GPU 환경

```bash
# Whisper-large-v3
docker run -d --gpus all \
  -v ./models:/models \
  -p 8001:8001 \
  sparklio/whisper-worker:latest

# Qwen2.5-14B/32B via Ollama
ollama pull qwen2.5:14b
ollama pull qwen2.5:32b

# Celery Worker
celery -A celery_app worker \
  -Q stt_queue,llm_queue \
  --concurrency=2
```

---

## 13. 테스트 계획 (Testing Plan)

### 13.1 단위 테스트

- `test_stt_worker.py`: Whisper STT 정확도
- `test_mia_agent.py`: MIA 출력 스키마 검증
- `test_smart_router.py`: LLM 라우팅 로직

### 13.2 통합 테스트

- `test_e2e_meeting_flow.py`: 업로드 → 요약 → 생성 전체 플로우

### 13.3 성능 테스트

- 동시 5개 회의 처리 (부하 테스트)
- 1시간 회의 처리 시간 측정

---

## 14. 향후 확장 계획 (Future Enhancements)

### Phase 2 (3개월 후)
- **실시간 회의 녹음**: 앱 내 녹음 기능
- **화자 분리**: pyannote-audio 통합
- **다국어 지원**: 영어, 일본어, 중국어

### Phase 3 (6개월 후)
- **회의 중 실시간 요약**: WebSocket 실시간 스트리밍
- **Zoom/Google Meet 통합**: API 연동
- **자동 캘린더 연동**: 회의 일정 자동 등록

---

## 15. 결론 (Conclusion)

Meeting AI는 Sparklio 플랫폼의 **생산성 혁신 핵심 기능**으로, 회의에서 나온 모든 아이디어와 인사이트를 자동으로 마케팅/기획 산출물로 전환하는 엔드투엔드 AI 파이프라인입니다.

**핵심 차별화 요소**:
1. ✅ **Mac mini LLM 라우팅**: 비용 70% 절감, 속도 2배 향상
2. ✅ **3-Node Hybrid 인프라**: 로컬 GPU + 클라우드 LLM 최적 조합
3. ✅ **SmartRouter 통합**: 회의 유형별 자동 산출물 추천
4. ✅ **One-Page Editor 연동**: 생성 후 즉시 편집 가능
5. ✅ **B2B SaaS Pain Point 해결**: 회의록 → 실행 가능한 산출물

**개발 우선순위**: P1 (다음 주 시작 예정)

---

**작성 완료 시각**: 2025-11-14 (목요일) 17:15
**다음 단계**: P0 문서 일괄 커밋 → P1 구현 준비
