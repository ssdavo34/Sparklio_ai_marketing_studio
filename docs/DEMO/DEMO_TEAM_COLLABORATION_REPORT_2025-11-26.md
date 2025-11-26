# DEMO Day 팀간 협업 보고서

**문서 버전**: v1.0
**작성일**: 2025-11-26
**작성자**: C팀 (Frontend)
**목적**: 기존 코드베이스 분석 + DEMO 요구사항 갭 분석 + 팀별 작업 분담

---

## 1. 핵심 결론: 기존 코드 최대한 활용 가능

### 1.1 좋은 소식

> **기존 `/studio/v3` 코드의 약 70%를 DEMO에 그대로 활용할 수 있습니다.**

| 영역 | 재활용률 | 설명 |
|------|---------|------|
| 3패널 레이아웃 | **100%** | `StudioLayout.tsx`, `useLayoutStore.ts` 그대로 사용 |
| Meeting AI | **100%** | `MeetingTab.tsx`, `meeting-api.ts` 완전 작동 |
| Chat 기본 UI | **90%** | `ChatTab`, `useChatStore.ts` 거의 완성 |
| 상태 관리 | **100%** | Zustand 기반 stores 모두 활용 |
| API 구조 | **80%** | `lib/api/` 구조 유지, 확장만 필요 |

### 1.2 추가 개발 필요한 것

| 영역 | 필요 작업량 | 담당 |
|------|-----------|------|
| **Concept Board 뷰** | 신규 개발 | C팀 |
| **4종 산출물 Preview 뷰** | 신규 개발 | C팀 |
| **NextActions 버튼** | Chat 확장 | C팀 |
| **Campaign 생성 API** | 신규 개발 | B팀 |
| **Concept/Asset 생성 API** | 신규 개발 | B팀 |
| **SSE 실시간 스트리밍** | 신규 개발 | B팀 + C팀 |

---

## 2. 기존 코드베이스 구조 요약

### 2.1 현재 Frontend 아키텍처

```
frontend/
├── app/studio/v3/page.tsx       # 진입점 (재활용)
├── components/canvas-studio/
│   ├── layout/
│   │   └── StudioLayout.tsx     # 3패널 레이아웃 (재활용)
│   ├── panels/
│   │   ├── left/
│   │   │   └── tabs/
│   │   │       └── MeetingTab.tsx   # Meeting AI (재활용)
│   │   └── right/
│   │       └── RightDock.tsx        # Chat Panel (재활용+확장)
│   ├── polotno/
│   │   └── PolotnoWorkspace.tsx     # Canvas (부분 활용)
│   └── stores/
│       ├── useLayoutStore.ts        # 레이아웃 상태 (재활용)
│       ├── useChatStore.ts          # Chat 상태 (재활용+확장)
│       └── useCanvasStore.ts        # Canvas 상태 (부분 활용)
├── lib/api/
│   └── meeting-api.ts               # Meeting API (재활용)
└── types/
    └── meeting.ts                   # 타입 정의 (재활용+확장)
```

### 2.2 현재 구현 완료된 기능

#### Meeting AI Pipeline (100% 완료)
- YouTube URL 입력 → Meeting 생성
- STT (Whisper) → Transcript 생성
- LLM 분석 → Summary, Agenda, Decisions, Action Items
- 분석 결과 화면 표시
- 폴링 기반 상태 업데이트

#### Chat System (90% 완료)
- 메시지 입력/전송
- LLM Gateway 연동
- Agent/Task 선택
- Canvas 자동 요소 추가 (Polotno 전용)

#### 3패널 레이아웃 (100% 완료)
- 좌/중/우 패널 구조
- 리사이즈 가능한 패널
- 패널 접기/펼치기
- localStorage 상태 저장

---

## 3. DEMO 요구사항 vs 현재 구현 갭 분석

### 3.1 중앙 뷰 (Center View) 갭

| DEMO 요구사항 | 현재 상태 | 갭 | 우선순위 |
|--------------|----------|-----|---------|
| Meeting Summary 뷰 | ❌ 없음 | 신규 개발 | P0 |
| **Concept Board 뷰** | ❌ 없음 | **신규 개발** | **P0** |
| Slides Preview 뷰 | ⚠️ Polotno 있음 | 확장 필요 | P1 |
| Detail Preview 뷰 | ❌ 없음 | 신규 개발 | P1 |
| Instagram Preview 뷰 | ❌ 없음 | 신규 개발 | P1 |
| Shorts Preview 뷰 | ❌ 없음 | 신규 개발 | P1 |

**현재**: Polotno Canvas 에디터 (디자인 편집용)
**DEMO 필요**: 6종 결과물 Preview 뷰

### 3.2 Chat 기능 갭

| DEMO 요구사항 | 현재 상태 | 갭 | 우선순위 |
|--------------|----------|-----|---------|
| 기본 채팅 UI | ✅ 완료 | - | - |
| **NextActions 버튼** | ❌ 없음 | **확장 필요** | **P0** |
| SSE 실시간 Narration | ❌ 없음 | 신규 개발 | P0 |
| 뷰 전환 연동 | ❌ 없음 | 신규 개발 | P0 |
| Progress 표시 | ⚠️ 부분 | 확장 필요 | P1 |

### 3.3 좌측 패널 갭

| DEMO 요구사항 | 현재 상태 | 갭 | 우선순위 |
|--------------|----------|-----|---------|
| Brand 선택 | ⚠️ Mock 데이터 | API 연동 | P1 |
| Meeting 리스트 | ✅ 완료 | - | - |
| Project 선택 | ⚠️ Mock 데이터 | API 연동 | P2 |

### 3.4 Backend API 갭 (B팀 필요)

| DEMO 요구사항 | 현재 상태 | 담당 |
|--------------|----------|------|
| Meeting 생성/조회 | ✅ 완료 | - |
| Meeting 분석 | ✅ 완료 | - |
| **Campaign 생성** | ❌ 없음 | **B팀** |
| **Concept 생성** | ❌ 없음 | **B팀** |
| **4종 산출물 생성** | ❌ 없음 | **B팀** |
| **SSE 스트리밍** | ❌ 없음 | **B팀** |
| Concept Board 데이터 조회 | ❌ 없음 | **B팀** |

---

## 4. 팀별 작업 분담

### 4.1 B팀 (Backend) 작업 목록

#### P0 (필수 - Demo 핵심)

| 작업 | API | 설명 | 예상 소요 |
|------|-----|------|----------|
| Campaign 생성 | `POST /api/v1/demo/meeting-to-campaign` | Meeting → Campaign Brief | 1일 |
| Concept 생성 | (위 API 내 포함) | 2-3개 Concept 자동 생성 | 1일 |
| 4종 산출물 생성 | `POST /api/v1/demo/campaign-to-assets` | Presentation/Detail/Instagram/Shorts | 2일 |
| **SSE 스트리밍** | `GET /api/v1/tasks/{id}/stream` | 실시간 진행상황 전송 | 1일 |
| Concept Board 데이터 | `GET /api/v1/demo/concept-board/{id}` | 전체 데이터 패키지 반환 | 0.5일 |

#### P1 (권장)

| 작업 | API | 설명 |
|------|-----|------|
| ReviewerAgent | (산출물 생성 내 포함) | 광고 규제/과장 표현 검토 |
| Brand API 연동 | `GET /api/v1/brands` | 실제 Brand 데이터 |

#### 데이터 스키마 (B팀 ↔ C팀 합의 필요)

```typescript
// Campaign 생성 응답
interface CampaignResponse {
  campaign_id: string;
  meeting_id: string;
  brand_id: string;
  brief: CampaignBrief;
  concepts: Concept[];
  status: 'generating' | 'ready' | 'failed';
}

// Concept 구조
interface Concept {
  concept_id: string;
  title: string;
  subtitle: string;
  core_message: string;
  tone_keywords: string[];
  color_palette: string[];
  sample_headlines: string[];
  linked_assets: {
    presentation_id: string;
    product_detail_id: string;
    instagram_ids: string[];
    shorts_script_id: string;
  };
}

// SSE 이벤트 구조
interface SSEEvent {
  type: 'progress' | 'complete' | 'error';
  message: string;
  progress?: number;  // 0-100
  data?: any;
}
```

---

### 4.2 C팀 (Frontend) 작업 목록

#### P0 (필수 - Demo 핵심)

| 작업 | 파일 | 설명 | 예상 소요 |
|------|------|------|----------|
| **Concept Board 뷰** | `ConceptBoardView.tsx` | 가로 카드 그리드 | 1일 |
| **NextActions 버튼** | `ChatMessage.tsx` 확장 | Chat 응답에 버튼 추가 | 0.5일 |
| **뷰 전환 로직** | `useStudioStore.ts` | 중앙 뷰 상태 관리 | 0.5일 |
| **SSE 연동** | `useChatOrchestrator.ts` | 실시간 메시지 수신 | 0.5일 |
| Meeting Summary 뷰 | `MeetingSummaryView.tsx` | Meeting 분석 결과 표시 | 0.5일 |

#### P1 (권장)

| 작업 | 파일 | 설명 |
|------|------|------|
| Slides Preview 뷰 | `SlidesPreviewView.tsx` | Polotno Viewer 통합 |
| Detail Preview 뷰 | `DetailPreviewView.tsx` | 상세페이지 프리뷰 |
| Instagram Preview 뷰 | `InstagramPreviewView.tsx` | 인스타 카드 3종 |
| Shorts Preview 뷰 | `ShortsPreviewView.tsx` | 스크립트 + 영상 |

#### 구현 접근법: 기존 코드 활용

```tsx
// 1. 기존 StudioLayout 그대로 사용
// 파일: components/canvas-studio/layout/StudioLayout.tsx
// 변경: 없음 (100% 재활용)

// 2. 기존 ChatTab 확장 (NextActions 추가)
// 파일: components/canvas-studio/panels/right/RightDock.tsx
// 변경: ChatMessage에 nextActions 버튼 렌더링 추가

// 3. 중앙 뷰 스위칭 로직 추가
// 파일: 새로 만들기 - hooks/useCenterView.ts
type CenterViewType =
  | 'meeting_summary'
  | 'concept_board'
  | 'slides_preview'
  | 'detail_preview'
  | 'instagram_preview'
  | 'shorts_preview'
  | 'canvas';  // 기존 Polotno

// 4. 기존 MeetingTab 그대로 사용
// 파일: components/canvas-studio/panels/left/tabs/MeetingTab.tsx
// 변경: 없음 (100% 재활용)
```

---

### 4.3 A팀 (QA/문서) 작업 목록

| 작업 | 설명 | 우선순위 |
|------|------|---------|
| DEMO 시나리오 작성 | 발표용 스크립트 | P0 |
| QA 체크리스트 | 각 단계별 테스트 항목 | P0 |
| Mock 데이터 준비 | 제주 감귤 예시 데이터 | P1 |
| 발표 슬라이드 | 학원 발표용 PPT | P1 |

---

## 5. 의존성 및 작업 순서

### 5.1 Critical Path (핵심 경로)

```
Week 1 (B팀 먼저)
────────────────────────────────────────────────
B팀: Campaign/Concept 생성 API ─┐
                                 ├──→ C팀: Concept Board 뷰
B팀: SSE 스트리밍 API ──────────┘     ↓
                                     C팀: NextActions + 뷰 전환
                                      ↓
Week 2 (통합)                        C팀: 4종 Preview 뷰
────────────────────────────────────────────────
                                      ↓
                              A팀: 통합 QA + 데모 리허설
```

### 5.2 의존성 매트릭스

| C팀 작업 | B팀 의존성 | 병렬 가능? |
|---------|-----------|-----------|
| Concept Board 뷰 UI | ❌ 없음 (Mock으로 시작) | ✅ |
| Concept Board 데이터 연동 | Concept Board API | ❌ |
| NextActions 버튼 UI | ❌ 없음 | ✅ |
| NextActions 동작 연동 | Campaign API | ❌ |
| SSE 실시간 표시 | SSE API | ❌ |
| 4종 Preview 뷰 UI | ❌ 없음 (Mock으로 시작) | ✅ |
| 4종 Preview 데이터 | 산출물 생성 API | ❌ |

### 5.3 병렬 작업 전략

**Phase 1**: Mock 데이터로 UI 먼저 개발 (B팀 API 완료 전)
- C팀: Concept Board UI + Mock 데이터
- C팀: 4종 Preview UI + Mock 데이터
- B팀: API 개발 진행

**Phase 2**: API 연동 (B팀 API 완료 후)
- C팀: Mock → 실제 API 교체
- 통합 테스트

---

## 6. 인터페이스 계약 (B팀 ↔ C팀)

### 6.1 API 엔드포인트 목록

```typescript
// 1. Campaign 생성 (Meeting → Campaign + Concepts + Assets)
POST /api/v1/demo/meeting-to-campaign
Request: { meeting_id: string, brand_id: string }
Response: {
  task_id: string,  // SSE 구독용
  campaign_id: string
}

// 2. SSE 스트리밍
GET /api/v1/tasks/{task_id}/stream
Events:
  - { type: 'progress', message: '캠페인 브리프 생성 중...', progress: 10 }
  - { type: 'progress', message: 'Concept A 생성 중...', progress: 30 }
  - { type: 'progress', message: 'Concept A 슬라이드 생성 중...', progress: 50 }
  - { type: 'complete', message: '완료!', data: { campaign_id, concepts } }

// 3. Concept Board 데이터 조회
GET /api/v1/demo/concept-board/{campaign_id}
Response: ConceptBoardData (위 스키마 참조)

// 4. 산출물 상세 조회
GET /api/v1/presentations/{id}
GET /api/v1/product-details/{id}
GET /api/v1/instagram-ads/{id}
GET /api/v1/shorts-scripts/{id}
```

### 6.2 Chat 응답 구조 (B팀 → C팀)

```typescript
// Chat 응답에 NextActions 포함
interface ChatResponse {
  message: string;
  view?: CenterViewType;  // 자동 뷰 전환
  next_actions?: NextAction[];
}

interface NextAction {
  label: string;  // 버튼 텍스트
  action: string; // 'open_concept_board', 'open_slides', etc.
  payload?: Record<string, any>;  // conceptId, assetId 등
}
```

---

## 7. 리스크 및 대응 방안

### 7.1 기술 리스크

| 리스크 | 확률 | 영향 | 대응 방안 |
|--------|------|------|----------|
| SSE 구현 지연 | 중 | 높음 | Fallback: 폴링 방식으로 대체 |
| LLM 응답 느림 | 높음 | 중 | Mock 응답 준비, 타임아웃 설정 |
| Polotno 슬라이드 포맷 불일치 | 중 | 중 | 간단한 JSON 구조로 시작 |
| B팀 API 지연 | 중 | 높음 | Mock API로 C팀 먼저 진행 |

### 7.2 Fallback 계획

1. **SSE 실패 시**: 3초 폴링 + 로딩 스피너
2. **LLM 실패 시**: 미리 준비한 Mock 응답 반환
3. **이미지 생성 실패 시**: 플레이스홀더 이미지 사용
4. **영상 생성 건너뛰기**: 스크립트만 표시

---

## 8. Mock 데이터 준비 (A팀/C팀)

### 8.1 제주 감귤 젤리 예시

```typescript
// Mock Meeting Summary
const mockMeetingSummary = {
  title: "제주 감귤 젤리 신제품 런칭 기획 회의",
  one_line_summary: "국내산 제주 감귤을 활용한 건강한 젤리 신제품 기획",
  key_messages: [
    "국내산 제주 감귤 100%",
    "합성 첨가물 무첨가",
    "어린이도 안심하고 먹을 수 있는 비타민 간식"
  ],
  target_persona: "30-40대 엄마, 자녀 간식에 관심 많은 소비자",
  problem: "시중 젤리는 합성 첨가물 과다",
  solution: "천연 재료로 만든 건강한 젤리"
};

// Mock Concepts
const mockConcepts = [
  {
    concept_id: "concept-a",
    title: "상큼한 하루 리프레시",
    subtitle: "제주 감귤의 상큼함으로 하루를 상쾌하게",
    core_message: "제주 감귤의 상큼함으로 하루를 상쾌하게",
    tone_keywords: ["밝은", "경쾌한", "활기찬"],
    color_palette: ["#FFA500", "#FFFFFF", "#FFD700"],
    sample_headlines: [
      "아침마다 상큼하게, 제주 감귤 젤리",
      "하루를 깨우는 비타민 한 입"
    ]
  },
  {
    concept_id: "concept-b",
    title: "아이와 함께하는 비타민 간식",
    subtitle: "엄마가 안심하고 주는 건강한 간식",
    core_message: "우리 아이 첫 비타민은 제주 감귤 젤리로",
    tone_keywords: ["따뜻한", "신뢰", "안심"],
    color_palette: ["#FF8C00", "#FFFAF0", "#FFE4B5"],
    sample_headlines: [
      "엄마가 먼저 고른 비타민 간식",
      "우리 아이 첫 젤리, 제주 감귤로"
    ]
  }
];
```

---

## 9. 일정 제안

### 9.1 1주차 (개발)

| 일 | B팀 | C팀 | A팀 |
|----|-----|-----|-----|
| Day 1 | Campaign API 설계 | Concept Board UI (Mock) | Mock 데이터 준비 |
| Day 2 | Campaign API 구현 | NextActions 버튼 | 데모 시나리오 |
| Day 3 | SSE 스트리밍 | 뷰 전환 로직 | QA 체크리스트 |
| Day 4 | 산출물 API | 4종 Preview UI (Mock) | 테스트 |
| Day 5 | API 테스트/수정 | API 연동 | 통합 테스트 |

### 9.2 2주차 (통합 + 데모 준비)

| 일 | 전체 |
|----|------|
| Day 1-2 | 통합 테스트 + 버그 수정 |
| Day 3 | 데모 리허설 |
| Day 4 | 최종 점검 |
| Day 5 | **DEMO DAY** |

---

## 10. 체크리스트

### 10.1 B팀 Checklist

- [ ] `POST /api/v1/demo/meeting-to-campaign` 구현
- [ ] `GET /api/v1/tasks/{id}/stream` SSE 구현
- [ ] `GET /api/v1/demo/concept-board/{id}` 구현
- [ ] StrategistAgent → Campaign Brief
- [ ] ConceptAgent → 2-3개 Concept
- [ ] PresentationAgent → 슬라이드 JSON
- [ ] ProductDetailAgent → 상세페이지 텍스트
- [ ] InstagramNewsAdAgent → 카드 3종
- [ ] ShortsScriptAgent → 씬 단위 스크립트
- [ ] ReviewerAgent → 품질 검토

### 10.2 C팀 Checklist

- [ ] `ConceptBoardView.tsx` 구현
- [ ] `MeetingSummaryView.tsx` 구현
- [ ] `SlidesPreviewView.tsx` 구현
- [ ] `DetailPreviewView.tsx` 구현
- [ ] `InstagramPreviewView.tsx` 구현
- [ ] `ShortsPreviewView.tsx` 구현
- [ ] Chat NextActions 버튼 추가
- [ ] SSE 연동 (useChatOrchestrator)
- [ ] 뷰 전환 상태 관리
- [ ] Chat ↔ View 동기화

### 10.3 통합 Checklist

- [ ] Meeting 생성 → Summary 표시 작동
- [ ] Campaign 생성 → Concept Board 표시 작동
- [ ] SSE로 진행상황 실시간 표시
- [ ] NextActions 버튼 클릭 → 뷰 전환
- [ ] 4종 산출물 Preview 모두 표시
- [ ] 에러 발생 시 Fallback 작동
- [ ] 데모 시나리오 전체 플로우 완주

---

## 11. 결론

### 11.1 핵심 메시지

1. **기존 코드 70% 재활용** - 새로 만드는 것보다 확장하는 접근
2. **B팀 API가 Critical Path** - C팀은 Mock으로 먼저 시작
3. **SSE가 UX 핵심** - 실시간 진행상황 표시 필수
4. **Concept Board가 데모 하이라이트** - 시각적 임팩트 중요

### 11.2 다음 액션

| 팀 | 즉시 해야 할 것 |
|----|----------------|
| B팀 | Campaign API 스키마 확정 → C팀 공유 |
| C팀 | Mock 데이터로 Concept Board UI 시작 |
| A팀 | 데모 시나리오 + Mock 데이터 준비 |

---

**문서 상태**: ✅ 완성
**검토 필요**: B팀 API 스키마 합의, 일정 조율
**버전**: v1.0
**최종 수정**: 2025-11-26
