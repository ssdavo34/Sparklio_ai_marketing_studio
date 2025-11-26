# C팀 (Frontend) 구현 TODO 리스트

**문서 버전**: v1.0
**작성일**: 2025-11-26
**작성자**: C팀 (Frontend)
**목적**: DEMO Day Frontend 구현 작업 상세 목록

---

## 1. 작업 개요

### 1.1 핵심 원칙

> **기존 `/studio/v3` 코드를 최대한 재활용하고, 필요한 부분만 확장**

| 접근법 | 설명 |
|--------|------|
| **재활용** | 기존 컴포넌트 그대로 사용 (70%) |
| **확장** | 기존 컴포넌트에 기능 추가 (20%) |
| **신규** | 새로 만드는 컴포넌트 (10%) |

### 1.2 작업 분류

| 분류 | 파일 수 | 예상 소요 |
|------|--------|----------|
| P0 (필수) | 6개 | 3일 |
| P1 (권장) | 4개 | 2일 |
| P2 (선택) | 2개 | 1일 |

---

## 2. P0 작업 (필수 - Demo 핵심)

### 2.1 Concept Board 뷰

**파일**: `components/canvas-studio/views/ConceptBoardView.tsx` (신규)

**설명**: DEMO의 하이라이트, 2-3개 Concept 카드를 가로로 배열

**구현 내용**:
```tsx
// ConceptBoardView.tsx
interface ConceptBoardViewProps {
  campaignId: string;
  onConceptSelect: (conceptId: string) => void;
  onAssetOpen: (assetType: string, assetId: string) => void;
}

// 포함 컴포넌트
- ConceptBoardHeader (Meeting/Brand 정보)
- ConceptCardGrid (가로 배열)
- ConceptCard (개별 카드)
  - CardHeader (타이틀, 서브타이틀)
  - CoreMessage
  - ToneKeywords (태그)
  - ColorPalette (컬러칩)
  - SampleHeadlines
  - AssetButtons (슬라이드/상세/인스타/쇼츠)
```

**스타일**:
- 카드: 흰 배경, 둥근 모서리, 그림자
- Hover: 테두리 색상 변경, 살짝 위로 이동
- 클릭: 브랜드 컬러 테두리

**예상 소요**: 1일

**Mock 데이터**: `frontend/public/mock-data/concept-board-sample.json`

---

### 2.2 NextActions 버튼 (Chat 확장)

**파일**: `components/canvas-studio/panels/right/RightDock.tsx` (확장)

**설명**: Chat 메시지에 행동 버튼 추가

**구현 내용**:
```tsx
// ChatMessage 확장
interface ChatMessage {
  // 기존 필드...
  next_actions?: NextAction[];
}

interface NextAction {
  id: string;
  label: string;
  action: string;
  payload?: Record<string, any>;
  variant?: 'primary' | 'secondary' | 'outline';
}

// 렌더링
{message.next_actions && (
  <div className="flex flex-wrap gap-2 mt-3">
    {message.next_actions.map(action => (
      <Button
        key={action.id}
        variant={action.variant || 'secondary'}
        size="sm"
        onClick={() => handleNextAction(action)}
      >
        {action.label}
      </Button>
    ))}
  </div>
)}
```

**핸들러**:
```tsx
function handleNextAction(action: NextAction) {
  switch (action.action) {
    case 'create_campaign':
      createCampaign(action.payload?.meeting_id);
      break;
    case 'open_concept_board':
      setCenterView('concept_board');
      break;
    case 'open_slides':
      setCenterView('slides_preview');
      setSelectedAssetId(action.payload?.asset_id);
      break;
    // ... 기타 액션
  }
}
```

**예상 소요**: 0.5일

---

### 2.3 뷰 전환 상태 관리

**파일**: `components/canvas-studio/stores/useCenterViewStore.ts` (신규)

**설명**: 중앙 뷰 전환 상태 관리

**구현 내용**:
```tsx
// useCenterViewStore.ts
import { create } from 'zustand';

type CenterViewType =
  | 'canvas'           // 기존 Polotno (기본값)
  | 'meeting_summary'
  | 'concept_board'
  | 'slides_preview'
  | 'detail_preview'
  | 'instagram_preview'
  | 'shorts_preview';

interface CenterViewState {
  currentView: CenterViewType;
  selectedConceptId: string | null;
  selectedAssetId: string | null;
  campaignId: string | null;

  setView: (view: CenterViewType) => void;
  setSelectedConcept: (conceptId: string) => void;
  setSelectedAsset: (assetId: string) => void;
  setCampaign: (campaignId: string) => void;
  resetView: () => void;
}

export const useCenterViewStore = create<CenterViewState>((set) => ({
  currentView: 'canvas',
  selectedConceptId: null,
  selectedAssetId: null,
  campaignId: null,

  setView: (view) => set({ currentView: view }),
  setSelectedConcept: (conceptId) => set({ selectedConceptId: conceptId }),
  setSelectedAsset: (assetId) => set({ selectedAssetId: assetId }),
  setCampaign: (campaignId) => set({ campaignId }),
  resetView: () => set({
    currentView: 'canvas',
    selectedConceptId: null,
    selectedAssetId: null,
  }),
}));
```

**StudioLayout 연동**:
```tsx
// StudioLayout.tsx 수정
const { currentView } = useCenterViewStore();

// 중앙 영역 렌더링
{currentView === 'canvas' && <PolotnoWorkspace />}
{currentView === 'concept_board' && <ConceptBoardView />}
{currentView === 'slides_preview' && <SlidesPreviewView />}
{currentView === 'detail_preview' && <DetailPreviewView />}
{currentView === 'instagram_preview' && <InstagramPreviewView />}
{currentView === 'shorts_preview' && <ShortsPreviewView />}
{currentView === 'meeting_summary' && <MeetingSummaryView />}
```

**예상 소요**: 0.5일

---

### 2.4 SSE 실시간 연동

**파일**: `hooks/useSSEProgress.ts` (신규)

**설명**: Backend SSE 스트리밍 수신

**구현 내용**:
```tsx
// useSSEProgress.ts
import { useState, useEffect, useCallback } from 'react';
import { useChatStore } from '../stores/useChatStore';

interface SSEEvent {
  type: 'progress' | 'completed' | 'error';
  step: string;
  message: string;
  progress: number;
  campaign_id?: string;
  error?: string;
}

export function useSSEProgress(taskId: string | null) {
  const [progress, setProgress] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const { addMessage } = useChatStore();

  useEffect(() => {
    if (!taskId) return;

    const eventSource = new EventSource(
      `http://100.123.51.5:8000/api/v1/tasks/${taskId}/stream`
    );

    eventSource.onopen = () => {
      setIsConnected(true);
    };

    eventSource.onmessage = (event) => {
      const data: SSEEvent = JSON.parse(event.data);

      setProgress(data.progress);

      // Chat에 메시지 추가
      addMessage({
        role: 'assistant',
        content: data.message,
      });

      // 완료 시
      if (data.type === 'completed') {
        eventSource.close();
        // Concept Board로 전환
        useCenterViewStore.getState().setCampaign(data.campaign_id!);
        useCenterViewStore.getState().setView('concept_board');
      }

      // 에러 시
      if (data.type === 'error') {
        eventSource.close();
        addMessage({
          role: 'assistant',
          content: `오류가 발생했습니다: ${data.error}`,
        });
      }
    };

    eventSource.onerror = () => {
      setIsConnected(false);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [taskId, addMessage]);

  return { progress, isConnected };
}
```

**Fallback (폴링)**:
```tsx
// SSE 실패 시 폴링 방식
async function pollTaskStatus(taskId: string) {
  const response = await fetch(`/api/v1/tasks/${taskId}/status`);
  const data = await response.json();
  return data;
}
```

**예상 소요**: 0.5일

---

### 2.5 Meeting Summary 뷰

**파일**: `components/canvas-studio/views/MeetingSummaryView.tsx` (신규)

**설명**: Meeting 분석 결과 표시

**구현 내용**:
```tsx
// MeetingSummaryView.tsx
interface MeetingSummaryViewProps {
  meeting: MeetingSummary;
  onCreateCampaign: () => void;
}

// 레이아웃
<div className="p-8 max-w-4xl mx-auto">
  <h1 className="text-2xl font-bold mb-4">{meeting.title}</h1>

  <div className="bg-purple-50 p-4 rounded-lg mb-6">
    <p className="text-lg">{meeting.one_line_summary}</p>
  </div>

  <div className="mb-6">
    <h2 className="font-semibold mb-2">핵심 메시지</h2>
    <ul className="space-y-2">
      {meeting.key_messages.map((msg, i) => (
        <li key={i} className="flex items-center gap-2">
          <span className="text-purple-500">✓</span>
          {msg}
        </li>
      ))}
    </ul>
  </div>

  <div className="mb-6">
    <h2 className="font-semibold mb-2">타깃 페르소나</h2>
    <p>{meeting.target_persona}</p>
  </div>

  <Button onClick={onCreateCampaign} className="w-full">
    캠페인 만들기
  </Button>
</div>
```

**예상 소요**: 0.5일

---

### 2.6 Demo API 연동

**파일**: `lib/api/demo-api.ts` (신규)

**설명**: DEMO 전용 API 호출 함수

**구현 내용**:
```tsx
// demo-api.ts
const API_BASE = 'http://100.123.51.5:8000';

// Campaign 생성
export async function createCampaign(
  meetingId: string,
  brandId?: string
): Promise<{ task_id: string; campaign_id: string }> {
  const response = await fetch(`${API_BASE}/api/v1/demo/meeting-to-campaign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      meeting_id: meetingId,
      brand_id: brandId,
      num_concepts: 2,
    }),
  });

  if (!response.ok) {
    throw new Error('Campaign creation failed');
  }

  const result = await response.json();
  return result.data;
}

// Concept Board 데이터 조회
export async function getConceptBoard(
  campaignId: string
): Promise<ConceptBoardData> {
  const response = await fetch(
    `${API_BASE}/api/v1/demo/concept-board/${campaignId}`
  );

  if (!response.ok) {
    throw new Error('Failed to fetch concept board');
  }

  const result = await response.json();
  return result.data;
}

// Presentation 조회
export async function getPresentation(
  presentationId: string
): Promise<Presentation> {
  const response = await fetch(
    `${API_BASE}/api/v1/assets/presentations/${presentationId}`
  );

  if (!response.ok) {
    throw new Error('Failed to fetch presentation');
  }

  const result = await response.json();
  return result.data;
}

// Product Detail 조회
export async function getProductDetail(
  detailId: string
): Promise<ProductDetail> {
  const response = await fetch(
    `${API_BASE}/api/v1/assets/product-details/${detailId}`
  );

  if (!response.ok) {
    throw new Error('Failed to fetch product detail');
  }

  const result = await response.json();
  return result.data;
}

// Instagram Ads 조회
export async function getInstagramAds(
  conceptId: string
): Promise<InstagramAds> {
  const response = await fetch(
    `${API_BASE}/api/v1/assets/instagram-ads/${conceptId}`
  );

  if (!response.ok) {
    throw new Error('Failed to fetch instagram ads');
  }

  const result = await response.json();
  return result.data;
}

// Shorts Script 조회
export async function getShortsScript(
  shortsId: string
): Promise<ShortsScript> {
  const response = await fetch(
    `${API_BASE}/api/v1/assets/shorts-scripts/${shortsId}`
  );

  if (!response.ok) {
    throw new Error('Failed to fetch shorts script');
  }

  const result = await response.json();
  return result.data;
}
```

**예상 소요**: 0.5일

---

## 3. P1 작업 (권장)

### 3.1 Slides Preview 뷰

**파일**: `components/canvas-studio/views/SlidesPreviewView.tsx` (신규)

**구현 내용**:
- 슬라이드 5장 표시
- 이전/다음 네비게이션
- 슬라이드 번호 표시
- 컨셉보드 돌아가기 버튼

**예상 소요**: 0.5일

---

### 3.2 Detail Preview 뷰

**파일**: `components/canvas-studio/views/DetailPreviewView.tsx` (신규)

**구현 내용**:
- 상세페이지 형식 표시
- Title, OneLiner, Benefits, Description, CTA

**예상 소요**: 0.5일

---

### 3.3 Instagram Preview 뷰

**파일**: `components/canvas-studio/views/InstagramPreviewView.tsx` (신규)

**구현 내용**:
- 카드 3종 가로 배열
- 각 카드: Headline, Subcopy, CTA
- 이미지 영역 플레이스홀더

**예상 소요**: 0.5일

---

### 3.4 Shorts Preview 뷰

**파일**: `components/canvas-studio/views/ShortsPreviewView.tsx` (신규)

**구현 내용**:
- 씬 리스트 (6개)
- 각 씬: Role, Duration, Narration, OnscreenText
- (Optional) 키프레임 이미지
- (Optional) 비디오 플레이어

**예상 소요**: 0.5일

---

## 4. P2 작업 (선택)

### 4.1 Progress Bar 컴포넌트

**파일**: `components/shared/ProgressBar.tsx` (신규)

**구현 내용**:
- SSE progress 값 시각화
- 단계별 텍스트 표시

---

### 4.2 Concept Card 애니메이션

**구현 내용**:
- Framer Motion 적용
- 카드 등장 애니메이션
- 선택 시 하이라이트 효과

---

## 5. 타입 정의

**파일**: `types/demo.ts` (신규)

```tsx
// types/demo.ts

// Concept Board 데이터
export interface ConceptBoardData {
  campaign_id: string;
  meeting: MeetingInfo;
  brand: BrandInfo;
  brief: CampaignBrief;
  concepts: Concept[];
  status: 'ready' | 'processing' | 'failed';
  created_at: string;
}

export interface MeetingInfo {
  meeting_id: string;
  title: string;
  one_line_summary: string;
  key_messages: string[];
  target_persona: string;
}

export interface BrandInfo {
  brand_id: string;
  name: string;
  primary_color: string;
  secondary_color: string;
}

export interface CampaignBrief {
  goal: string;
  target: string;
  core_message: string;
  tone: string;
}

export interface Concept {
  concept_id: string;
  title: string;
  subtitle: string;
  core_message: string;
  tone_keywords: string[];
  color_palette: string[];
  sample_headlines: string[];
  linked_assets: LinkedAssets;
}

export interface LinkedAssets {
  presentation_id: string;
  product_detail_id: string;
  instagram_ids: string[];
  shorts_script_id: string;
  shorts_video_url: string | null;
}

// Presentation
export interface Presentation {
  presentation_id: string;
  concept_id: string;
  title: string;
  slides: Slide[];
}

export interface Slide {
  slide_number: number;
  type: 'cover' | 'problem' | 'solution' | 'benefits' | 'cta';
  title: string;
  subtitle?: string;
  content?: string;
  bullets?: string[];
  cta_text?: string;
  background_color: string;
}

// Product Detail
export interface ProductDetail {
  detail_id: string;
  concept_id: string;
  title: string;
  one_liner: string;
  benefits: string[];
  description: string;
  cta: string;
}

// Instagram Ads
export interface InstagramAds {
  concept_id: string;
  cards: InstagramCard[];
}

export interface InstagramCard {
  card_id: string;
  card_number: number;
  headline: string;
  subcopy: string;
  cta: string;
  image_prompt: string;
}

// Shorts Script
export interface ShortsScript {
  shorts_id: string;
  concept_id: string;
  title: string;
  duration_seconds: number;
  scenes: Scene[];
  video_url: string | null;
}

export interface Scene {
  scene_number: number;
  duration: string;
  role: 'Hook' | 'Problem' | 'Solution' | 'Feature' | 'Benefit' | 'CTA';
  visual: string;
  narration: string;
  onscreen_text: string;
  image_prompt: string;
}

// Chat NextAction
export interface NextAction {
  id: string;
  label: string;
  action: string;
  payload?: Record<string, any>;
  variant?: 'primary' | 'secondary' | 'outline';
}
```

---

## 6. 파일 구조

```
frontend/
├── components/canvas-studio/
│   ├── views/                      # 신규 디렉토리
│   │   ├── ConceptBoardView.tsx    # P0
│   │   ├── MeetingSummaryView.tsx  # P0
│   │   ├── SlidesPreviewView.tsx   # P1
│   │   ├── DetailPreviewView.tsx   # P1
│   │   ├── InstagramPreviewView.tsx # P1
│   │   └── ShortsPreviewView.tsx   # P1
│   ├── stores/
│   │   ├── useCenterViewStore.ts   # P0 신규
│   │   └── useChatStore.ts         # 확장
│   └── panels/right/
│       └── RightDock.tsx           # 확장 (NextActions)
├── hooks/
│   └── useSSEProgress.ts           # P0 신규
├── lib/api/
│   └── demo-api.ts                 # P0 신규
├── types/
│   └── demo.ts                     # P0 신규
└── public/mock-data/               # B팀 제공
    ├── concept-board-sample.json
    ├── presentation-sample.json
    ├── product-detail-sample.json
    ├── instagram-ads-sample.json
    └── shorts-script-sample.json
```

---

## 7. 일정

| Day | 작업 | 상태 |
|-----|------|------|
| **Day 1** | Concept Board UI (Mock) + 타입 정의 | 대기 |
| **Day 2** | NextActions + 뷰 전환 Store + SSE Hook | 대기 |
| **Day 3** | Demo API 연동 + 4종 Preview UI | 대기 |
| **Day 4** | 통합 테스트 + 버그 수정 | 대기 |
| **Day 5** | DEMO DAY | 대기 |

---

## 8. 체크리스트

### P0 완료 체크

- [ ] `ConceptBoardView.tsx` 구현
- [ ] `MeetingSummaryView.tsx` 구현
- [ ] NextActions 버튼 추가 (RightDock)
- [ ] `useCenterViewStore.ts` 구현
- [ ] `useSSEProgress.ts` 구현
- [ ] `demo-api.ts` 구현
- [ ] `types/demo.ts` 구현
- [ ] StudioLayout 뷰 스위칭 연동

### P1 완료 체크

- [ ] `SlidesPreviewView.tsx` 구현
- [ ] `DetailPreviewView.tsx` 구현
- [ ] `InstagramPreviewView.tsx` 구현
- [ ] `ShortsPreviewView.tsx` 구현

### 통합 테스트 체크

- [ ] Mock 데이터로 Concept Board 표시
- [ ] NextActions 버튼 클릭 → 뷰 전환
- [ ] API 연동 후 실제 데이터 표시
- [ ] SSE 진행상황 실시간 표시
- [ ] 에러 시 Fallback 동작

---

**문서 상태**: ✅ 완성
**다음 액션**: Day 1 작업 시작
**버전**: v1.0
**최종 수정**: 2025-11-26
