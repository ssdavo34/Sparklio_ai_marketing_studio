# C팀 작업 완료 인수인계 문서

**작성일:** 2025-11-23
**작성자:** C팀 (Frontend Team)
**다음 세션:** 이 문서를 기반으로 작업 계속

---

## 📋 목차

1. [작업 요약](#작업-요약)
2. [수정된 버그 목록](#수정된-버그-목록)
3. [현재 시스템 상태](#현재-시스템-상태)
4. [미해결 이슈](#미해결-이슈)
5. [다음 작업 우선순위](#다음-작업-우선순위)
6. [기술 아키텍처](#기술-아키텍처)
7. [주요 파일 구조](#주요-파일-구조)

---

## 작업 요약

### ✅ 완료된 작업

1. **AI 에이전트 역할 매핑 완료** (8개 역할 → 백엔드 에이전트 연결)
2. **Abstract Class 에러 수정** (`brief: 'template'` → `brief: 'strategist'`)
3. **한국어 응답 문제 해결** (5개 백엔드 에이전트에 `language: 'ko'` 기본값 추가)
4. **Canvas Studio 페이지 구조 복구** (StudioLayout + ActivityBar 추가)
5. **View Mode/전체화면 확인** (이미 구현되어 있음)

### 🔧 수정된 파일

**Frontend:**
- `app/canvas-studio/page.tsx` - StudioLayout 구조로 재작성
- `components/canvas-studio/stores/useChatStore.ts` - 에이전트 매핑 수정 (line 605)

**Backend:**
- `app/services/agents/copywriter.py` - 한국어 지원 추가 (lines 136-138)
- `app/services/agents/strategist.py` - 한국어 지원 추가 (lines 134-136)
- `app/services/agents/editor.py` - 한국어 지원 추가 (lines 143-145)
- `app/services/agents/optimizer.py` - 한국어 지원 추가 (lines 134-136)
- `app/services/agents/reviewer.py` - 한국어 지원 추가 (lines 134-136)

---

## 수정된 버그 목록

### 🐛 Bug #1: Abstract Class Instantiation Error

**증상:**
```
Internal server error: Can't instantiate abstract class TemplateAgent with abstract method name
```

**원인:**
`useChatStore.ts`에서 `brief: 'template'`로 매핑했으나, 백엔드의 `template` 에이전트는 추상 클래스로 직접 인스턴스화 불가능.

**해결:**
**파일:** `frontend/components/canvas-studio/stores/useChatStore.ts` (line 605)

```typescript
// Before:
brief: 'template',        // ❌ Abstract class

// After:
brief: 'strategist',      // ✅ Concrete implementation
```

**커밋:** `fix: AI 챗 abstract class 에러 및 한국어 응답 문제 수정`

---

### 🐛 Bug #2: Korean Language Not Working

**증상:**
AI 에이전트가 한국어로 응답하지 않음 (영어로만 응답)

**원인:**
백엔드 에이전트의 `_enhance_payload` 메서드가 `language` 파라미터를 처리하지 않음.

**해결:**
5개 백엔드 에이전트 파일에 언어 기본값 추가:

**파일:**
- `backend/app/services/agents/copywriter.py`
- `backend/app/services/agents/strategist.py`
- `backend/app/services/agents/editor.py`
- `backend/app/services/agents/optimizer.py`
- `backend/app/services/agents/reviewer.py`

**추가 코드:**
```python
# 언어 설정 추가 (기본값: 한국어)
if "language" not in enhanced:
    enhanced["language"] = "ko"
```

**커밋:** `fix: AI 챗 abstract class 에러 및 한국어 응답 문제 수정`

---

### 🐛 Bug #3: Missing UI Components (ActivityBar, LeftPanel)

**증상:**
- Top Toolbar 버튼 작동 안 함
- ActivityBar (좌측 아이콘 바) 완전히 사라짐
- LeftPanel 표시 안 됨

**원인:**
`app/canvas-studio/page.tsx`가 StudioLayout을 사용하지 않고 직접 컴포넌트 렌더링. ActivityBar가 누락됨.

**해결:**
**파일:** `frontend/app/canvas-studio/page.tsx` (전체 재작성)

```typescript
'use client';

import dynamic from 'next/dynamic';

// 모든 컴포넌트를 dynamic import로 로드 (SSR 방지)
const StudioLayout = dynamic(
  () => import('@/components/canvas-studio/layout/StudioLayout').then((mod) => ({ default: mod.StudioLayout })),
  { ssr: false }
);

const TopToolbar = dynamic(
  () => import('@/components/canvas-studio/layout/TopToolbar').then((mod) => ({ default: mod.TopToolbar })),
  { ssr: false }
);

const ActivityBar = dynamic(
  () => import('@/components/canvas-studio/layout/ActivityBar').then((mod) => ({ default: mod.ActivityBar })),
  { ssr: false }
);

const LeftPanel = dynamic(
  () => import('@/components/canvas-studio/layout/LeftPanel').then((mod) => ({ default: mod.LeftPanel })),
  { ssr: false }
);

const PolotnoWorkspace = dynamic(
  () => import('@/components/canvas-studio/polotno/PolotnoWorkspace').then((mod) => ({ default: mod.PolotnoWorkspace })),
  { ssr: false }
);

const RightDock = dynamic(
  () => import('@/components/canvas-studio/panels/right/RightDock').then((mod) => ({ default: mod.RightDock })),
  { ssr: false }
);

export default function CanvasStudioPage() {
  return (
    <StudioLayout
      topToolbar={<TopToolbar />}
      activityBar={<ActivityBar />}
      leftPanel={<LeftPanel />}
      canvas={<PolotnoWorkspace />}
      rightDock={<RightDock />}
    />
  );
}
```

**커밋 대기 중:** 이 파일은 아직 커밋되지 않음.

---

## 현재 시스템 상태

### ✅ 완전히 구현된 기능 (95%+)

1. **AI 콘텐츠 편집 시스템** - 사용자가 AI 생성 콘텐츠를 완전히 편집 가능
2. **Inspector Panel** - 선택한 객체의 속성 편집 (위치, 크기, 색상, 폰트 등)
3. **Layers Panel** - 레이어 순서 변경, 잠금, 표시/숨김
4. **Multi-page 관리** - 페이지 추가/삭제/순서 변경
5. **Professional Layout System** - 5가지 레이아웃 (Hero, Split, Minimal, Classic, Modern)
6. **View Mode/전체화면** - Edit/View 모드 토글 (TopToolbar에 구현됨)
7. **AI Chat Interface** - ChatDock에서 AI와 대화하며 콘텐츠 생성
8. **Agent Role System** - 8개 역할 (Brief, Strategist, Copywriter, Reviewer, Optimizer, Editor, Vision, Custom)
9. **Base64 Image Handling** - CORS 문제 해결 (이미지를 Base64로 변환)

### ⚠️ 부분 구현된 기능

1. **Save/Load API** - 로컬 저장은 가능하나 서버 연동 미완성
2. **Upload Tab** - UI는 있으나 완전히 기능하지 않음
3. **Brand Kit Tab** - 폰트/로고 일부만 구현

### ❌ 미구현 기능

1. **Undo/Redo** - 전혀 구현되지 않음
2. **Photos Tab** - Unsplash 통합 미구현
3. **Context Menu** - 현재 비활성화 상태

---

## 미해결 이슈

### 🚨 Critical Issue: Content Parsing Mismatch

**문제 설명:**
AI가 반환하는 JSON 구조와 Canvas 렌더링 로직이 불일치하여 **결과물이 만족스럽지 않음**.

**현재 상황:**

**AI 응답 예시 (Strategist Agent):**
```json
{
  "content_plan": {
    "title": "겨울 세일 광고 캠페인",
    "objectives": ["브랜드 인지도 향상", "매출 증대"],
    "target_audience": {
      "age": "25-40",
      "interests": ["패션", "라이프스타일"]
    },
    "channels": ["Instagram", "Facebook", "YouTube"],
    "content_elements": [
      {
        "type": "hero_image",
        "description": "겨울 패션 모델 이미지",
        "specifications": {
          "style": "minimalist",
          "colors": ["white", "blue", "gray"]
        }
      },
      {
        "type": "headline",
        "text": "겨울 세일 최대 50% 할인"
      },
      {
        "type": "body_copy",
        "text": "따뜻한 겨울을 위한 특별한 제안..."
      }
    ],
    "timeline": {...},
    "kpis": {...}
  }
}
```

**현재 파서가 기대하는 형식 (ad_copy):**
```json
{
  "headline": "겨울 세일 최대 50% 할인",
  "subheadline": "따뜻한 겨울을 위한 특별한 제안",
  "body": "본문 텍스트...",
  "bullets": ["포인트 1", "포인트 2"],
  "cta": "지금 쇼핑하기"
}
```

**결과:**
- Canvas에는 이미지만 표시됨
- 텍스트 콘텐츠가 제대로 렌더링되지 않음
- 다중 페이지 생성 안 됨

**원인:**

**파일:** `frontend/components/canvas-studio/stores/useChatStore.ts` (lines 187-434)

`parseAndAddToCanvas` 함수가 단순 ad_copy 형식만 처리:

```typescript
private parseAndAddToCanvas(aiResponse: string) {
  // ... JSON 파싱

  // ❌ 문제: ad_copy 형식만 처리
  const { headline, subheadline, body, bullets, cta } = parsed;

  // content_plan, sns 등 다른 형식은 처리 불가
  // content_elements 배열 처리 로직 없음
  // 자동 다중 페이지 생성 로직 없음
}
```

**영향:**
- 사용자 경험 매우 나쁨 (User quote: "이 부분은 전혀 결과물로 만족 할 수 없는데")
- AI의 풍부한 응답이 Canvas에 제대로 반영되지 않음
- 전문적인 광고 결과물 생성 불가

---

## 다음 작업 우선순위

사용자와 논의 결과 **Depth-First 전략** 채택:
→ 모든 기능을 얕게 구현하는 것보다, 핵심 기능을 완벽하게 만드는 것이 우선.

### 🔥 Priority 1: Smart JSON Parsing System (최우선)

**목표:** 다양한 AI 응답 형식을 지능적으로 파싱하고 Canvas에 렌더링

**구현 사항:**

1. **Multiple Format Support**
   - `content_plan` 형식 (Strategist Agent)
   - `ad_copy` 형식 (Copywriter Agent)
   - `sns` 형식 (소셜 미디어 전용)
   - 기타 커스텀 형식

2. **Content Element Type Rendering**
   ```typescript
   // content_elements 배열 처리
   content_elements.forEach(element => {
     switch(element.type) {
       case 'hero_image':
         // 이미지 생성 + 배치
         break;
       case 'headline':
         // 헤드라인 텍스트 추가
         break;
       case 'body_copy':
         // 본문 텍스트 추가
         break;
       case 'bullet_list':
         // 불릿 리스트 렌더링
         break;
       case 'cta_button':
         // CTA 버튼 추가
         break;
       case 'video_placeholder':
         // 비디오 영역 표시
         break;
     }
   });
   ```

3. **Auto Multi-page Generation**
   ```typescript
   // 콘텐츠 양에 따라 자동으로 페이지 분할
   if (content_elements.length > 5) {
     // 새 페이지 생성
     // 콘텐츠를 페이지별로 분배
   }
   ```

4. **Layout Auto-selection Improvement**
   ```typescript
   // content_plan 구조 분석하여 최적 레이아웃 선택
   const layout = selectLayoutByContentStructure(content_plan);
   ```

**예상 작업 시간:** 2-3시간

**파일 수정 필요:**
- `frontend/components/canvas-studio/stores/useChatStore.ts` (parseAndAddToCanvas 함수 전면 개선)

---

### 🔥 Priority 2: Agent Task Type Strategies

**목표:** Task type에 따라 다른 파싱 전략 적용

**구현 사항:**

```typescript
// Task type별 처리 전략
const parsingStrategies = {
  'content_plan': parseContentPlan,     // 다중 페이지, 복잡한 구조
  'ad_copy': parseAdCopy,               // 단일 페이지, 간단한 구조
  'sns': parseSNS,                      // 소셜 미디어 최적화
  'email': parseEmail,                  // 이메일 레이아웃
  'landing_page': parseLandingPage,     // 랜딩 페이지 구조
};

const strategy = parsingStrategies[task] || parseAdCopy;
strategy(aiResponse);
```

**예상 작업 시간:** 1-2시간

---

### 🔥 Priority 3: AI Prompt Engineering

**목표:** AI 응답 품질 향상 및 일관성 확보

**구현 사항:**

1. **System Prompt 개선**
   - Canvas 렌더링에 최적화된 JSON 구조 요청
   - 이미지 생성 프롬프트 품질 향상
   - 텍스트 길이 제한 명시

2. **Response Validation**
   ```typescript
   // AI 응답 검증 및 자동 수정
   function validateAndFixResponse(response) {
     // 필수 필드 확인
     // 이미지 프롬프트 품질 검증
     // 텍스트 길이 검증
   }
   ```

**예상 작업 시간:** 1-2시간

**파일 수정 필요:**
- `frontend/components/canvas-studio/stores/useChatStore.ts` (sendMessage 함수)
- `backend/app/services/agents/*.py` (각 에이전트의 프롬프트)

---

### 🔥 Priority 4: Layout Design Enhancement

**목표:** 더 전문적이고 다양한 레이아웃 템플릿

**구현 사항:**

1. **새로운 레이아웃 추가**
   - E-commerce 전용 레이아웃
   - 소셜 미디어 전용 레이아웃 (Instagram, Facebook 최적화)
   - 이메일 레이아웃
   - 랜딩 페이지 레이아웃

2. **레이아웃 품질 개선**
   - 타이포그래피 개선 (폰트 크기, 간격, 계층 구조)
   - 색상 시스템 개선 (브랜드 컬러 활용)
   - 이미지-텍스트 균형 최적화

**예상 작업 시간:** 3-4시간

**파일 수정 필요:**
- `frontend/components/canvas-studio/layouts/*.ts` (새 레이아웃 추가)

---

### 🔥 Priority 5: Image Generation Quality

**목표:** ComfyUI 워크플로우 최적화 및 이미지 품질 향상

**구현 사항:**

1. **프롬프트 품질 향상**
   - 더 구체적이고 전문적인 이미지 프롬프트
   - 스타일 가이드 적용 (minimalist, modern, classic 등)

2. **ComfyUI 워크플로우 개선**
   - 해상도 최적화
   - 렌더링 속도 개선

**예상 작업 시간:** 2-3시간

**파일 확인 필요:**
- `backend/app/services/agents/designer.py`
- ComfyUI 워크플로우 설정

---

### 📌 Priority 6-10: 기타 기능 (차순위)

6. **Undo/Redo 구현** (2-3시간)
7. **Save/Load API 연동** (1-2시간)
8. **Photos Tab (Unsplash)** (2-3시간)
9. **Upload Tab 완성** (1-2시간)
10. **Brand Kit Tab 완성** (2-3시간)

---

## 기술 아키텍처

### Frontend Stack

- **Framework:** Next.js 13+ (App Router)
- **State Management:** Zustand (with devtools + persist middleware)
- **Canvas Engine:** Polotno SDK (MobX state tree 기반)
- **UI Components:** Tailwind CSS + Lucide Icons
- **Dynamic Imports:** SSR 방지를 위해 모든 Canvas 컴포넌트 dynamic import

### Backend Stack

- **Framework:** FastAPI
- **Agent System:** 21개 에이전트 (Creation, System, Intelligence)
- **AI Gateway:** LLM Gateway Client (Claude API 연동)
- **Media Gateway:** ComfyUI 연동 (이미지 생성)

### Agent Architecture

**Frontend → Backend Agent Mapping:**

```typescript
// frontend/components/canvas-studio/stores/useChatStore.ts (lines 604-613)
const agentMap: Record<AgentRole, string> = {
  brief: 'strategist',       // ✅ Brief Generator → strategist
  strategist: 'strategist',  // ✅ Strategist → strategist
  copywriter: 'copywriter',  // ✅ Copywriter → copywriter
  reviewer: 'reviewer',      // ✅ Reviewer → reviewer
  optimizer: 'optimizer',    // ✅ Optimizer (CRO) → optimizer
  editor: 'editor',          // ✅ Editor → editor
  vision: 'designer',        // ✅ Vision → designer
  custom: 'copywriter',      // ✅ Custom → copywriter (default)
};
```

**Backend Available Agents (21개):**

```python
# backend/app/api/v1/endpoints/agents_new.py (lines 100-128)

# Creation Agents (10개):
- copywriter      # 텍스트 콘텐츠 생성
- strategist      # 마케팅 전략 수립
- designer        # 비주얼 콘텐츠 생성 (ComfyUI 연동)
- reviewer        # 콘텐츠 품질 검토
- optimizer       # 콘텐츠 최적화 (CRO)
- editor          # 콘텐츠 편집/교정
- meeting_ai      # 회의록 작성
- vision_analyzer # 이미지 분석
- scene_planner   # 장면 기획
- template        # ⚠️ Abstract class (직접 사용 불가)

# System Agents (4개):
- pm              # 프로젝트 관리
- qa              # 품질 보증
- error_handler   # 에러 처리
- logger          # 로깅

# Intelligence Agents (7개):
- trend_collector      # 트렌드 수집
- data_cleaner         # 데이터 정제
- embedder             # 임베딩 생성
- rag                  # RAG 검색
- ingestor             # 데이터 수집
- performance_analyzer # 성능 분석
- self_learning        # 자기 학습
```

### State Management Structure

```
Zustand Stores (4개):

1. useEditorStore (EditorDocument 관리)
   - document: EditorDocument
   - setDocument()
   - addPage()
   - deletePage()
   - reorderPages()

2. useLayoutStore (레이아웃 상태 관리)
   - leftPanelWidth
   - rightDockWidth
   - isLeftPanelCollapsed
   - isRightDockCollapsed
   - isViewMode
   - setViewMode()

3. useLeftPanelStore (좌측 패널 탭 관리)
   - activeTab: LeftPanelTab
   - setActiveTab()

4. useChatStore (AI 챗 상태 관리)
   - messages: ChatMessage[]
   - currentRole: AgentRole
   - isGenerating: boolean
   - sendMessage()
   - parseAndAddToCanvas() ← ⚠️ 개선 필요
```

### Layout Structure

```
Canvas Studio Layout (VSCode-style):

┌─────────────────────────────────────────────────────────────┐
│ TopToolbar (56px, 고정)                                      │
│ - Edit/View 모드 토글, Export, Share 버튼                    │
├────┬──────────────┬─────────────────────────┬───────────────┤
│    │              │                         │               │
│ A  │  LeftPanel   │   Canvas Area           │  RightDock    │
│ c  │  (가변)      │   (중앙, Polotno)       │  (가변)       │
│ t  │              │                         │               │
│ i  │  - Pages     │   - PolotnoWorkspace    │  - ChatDock   │
│ v  │  - Elements  │   - Zoom controls       │  - Inspector  │
│ i  │  - Text      │   - Canvas viewport     │  - Layers     │
│ t  │  - Upload    │                         │               │
│ y  │  - Photos    │                         │               │
│    │  - BrandKit  │                         │               │
│ B  │              │                         │               │
│ a  │              │                         │               │
│ r  │              │                         │               │
│    │              │                         │               │
│ (  │              │                         │               │
│ 5  │              │                         │               │
│ 6  │              │                         │               │
│ p  │              │                         │               │
│ x  │              │                         │               │
│ )  │              │                         │               │
└────┴──────────────┴─────────────────────────┴───────────────┘

- ActivityBar: 56px 고정, 좌측 아이콘 바
- LeftPanel: 가변 (min 240px, max 480px, default 320px)
- Canvas: flex-1 (남은 공간 전체)
- RightDock: 가변 (min 280px, max 600px, default 360px)

View Mode: ActivityBar, LeftPanel, RightDock 숨김 (Canvas만 표시)
```

---

## 주요 파일 구조

### 📂 Frontend Files

#### Entry Point
```
app/
  canvas-studio/
    page.tsx                    ⭐ Canvas Studio 진입점 (최근 수정됨)
```

#### Layout Components
```
components/canvas-studio/layout/
  StudioLayout.tsx              ⭐ 전체 레이아웃 컨테이너 (resize 핸들러 포함)
  TopToolbar.tsx                  Edit/View 모드 토글, Export 버튼
  ActivityBar.tsx               ⭐ 좌측 아이콘 바 (Pages, Elements, Text 등)
  LeftPanel.tsx                   좌측 패널 (탭별 컨텐츠)
```

#### Polotno Integration
```
components/canvas-studio/polotno/
  PolotnoWorkspace.tsx          ⭐ Polotno 에디터 wrapper
  PolotnoEditor.tsx               Polotno 실제 렌더링
```

#### Right Dock Panels
```
components/canvas-studio/panels/right/
  RightDock.tsx                   우측 Dock 컨테이너
  ChatDock.tsx                  ⭐ AI 챗 인터페이스 (useChatStore 사용)
  InspectorPanel.tsx              선택 객체 속성 편집
  LayersPanel.tsx                 레이어 순서/잠금 관리
```

#### State Management
```
components/canvas-studio/stores/
  useEditorStore.ts               EditorDocument 관리
  useLayoutStore.ts               레이아웃 상태 관리
  useLeftPanelStore.ts            좌측 패널 탭 관리
  useChatStore.ts               ⭐⭐⭐ AI 챗 상태 + parseAndAddToCanvas (개선 필요!)
  index.ts                        모든 store export
```

#### Layout Templates
```
components/canvas-studio/layouts/
  LayoutSelector.ts               레이아웃 선택 로직
  hero-ad.ts                      Hero 레이아웃
  split-ad.ts                     Split 레이아웃
  minimal-ad.ts                   Minimal 레이아웃
  classic-ad.ts                   Classic 레이아웃
  modern-ad.ts                    Modern 레이아웃
```

#### API Client
```
lib/
  llm-gateway-client.ts         ⭐ LLM Gateway API 클라이언트 (한국어 지원 추가됨)
```

---

### 📂 Backend Files

#### Agent API Endpoints
```
backend/app/api/v1/endpoints/
  agents_new.py                 ⭐ Agent 실행 엔드포인트 (21개 에이전트 정의)
```

#### Agent Implementations
```
backend/app/services/agents/
  copywriter.py                 ⭐ 수정됨 (한국어 지원)
  strategist.py                 ⭐ 수정됨 (한국어 지원)
  editor.py                     ⭐ 수정됨 (한국어 지원)
  optimizer.py                  ⭐ 수정됨 (한국어 지원)
  reviewer.py                   ⭐ 수정됨 (한국어 지원)
  designer.py                     이미지 생성 (ComfyUI 연동)
  template.py                   ⚠️ Abstract class (직접 사용 불가)
```

---

## 코드 참고 자료

### ⚠️ 개선 필요: parseAndAddToCanvas 함수

**위치:** `frontend/components/canvas-studio/stores/useChatStore.ts` (lines 187-434)

**현재 문제점:**
1. ad_copy 형식만 처리 (`{headline, subheadline, body, bullets, cta}`)
2. content_plan, sns 등 다른 형식 미지원
3. content_elements 배열 처리 로직 없음
4. 자동 다중 페이지 생성 없음
5. 레이아웃 선택이 단순함 (첫 번째 레이아웃만 사용)

**개선 방향:**
```typescript
// 개선 버전 (pseudo-code)
private async parseAndAddToCanvas(aiResponse: string) {
  const parsed = JSON.parse(aiResponse);

  // 1. Response 형식 감지
  const format = detectResponseFormat(parsed);

  // 2. Format별 파싱 전략 선택
  switch(format) {
    case 'content_plan':
      return this.parseContentPlan(parsed.content_plan);
    case 'ad_copy':
      return this.parseAdCopy(parsed);
    case 'sns':
      return this.parseSNS(parsed);
    default:
      return this.parseGeneric(parsed);
  }
}

private async parseContentPlan(contentPlan: any) {
  const { content_elements, channels, target_audience } = contentPlan;

  // 3. Content elements 순회하며 Canvas 객체 생성
  for (const element of content_elements) {
    switch(element.type) {
      case 'hero_image':
        await this.addHeroImage(element);
        break;
      case 'headline':
        this.addHeadline(element);
        break;
      case 'body_copy':
        this.addBodyCopy(element);
        break;
      case 'bullet_list':
        this.addBulletList(element);
        break;
      case 'cta_button':
        this.addCTAButton(element);
        break;
    }
  }

  // 4. 콘텐츠 양에 따라 자동 페이지 분할
  if (content_elements.length > 5) {
    this.splitIntoMultiplePages(content_elements);
  }

  // 5. 레이아웃 자동 선택 (content 구조 기반)
  const layout = this.selectLayoutByStructure(content_elements);
  this.applyLayout(layout);
}
```

---

## Git 커밋 히스토리

### 이미 커밋된 내용:

**Commit 1:** `fix: AI 챗 abstract class 에러 및 한국어 응답 문제 수정`
- `frontend/components/canvas-studio/stores/useChatStore.ts` (brief: template → strategist)
- `backend/app/services/agents/copywriter.py` (한국어 지원)
- `backend/app/services/agents/strategist.py` (한국어 지원)
- `backend/app/services/agents/editor.py` (한국어 지원)
- `backend/app/services/agents/optimizer.py` (한국어 지원)
- `backend/app/services/agents/reviewer.py` (한국어 지원)

### 커밋 대기 중:

**Commit 2 (예정):** `fix: Canvas Studio page.tsx - StudioLayout 구조 복구 및 ActivityBar 추가`
- `app/canvas-studio/page.tsx` (StudioLayout 재작성)

**Commit 3 (예정):** `docs: C팀 작업 완료 인수인계 문서 추가`
- `C_TEAM_HANDOFF.md` (본 문서)

---

## 다음 Claude에게

### 🎯 즉시 시작할 작업

1. **Smart JSON Parsing System 구현 시작**
   - 파일: `frontend/components/canvas-studio/stores/useChatStore.ts`
   - 함수: `parseAndAddToCanvas` 전면 개선
   - 참고: 위의 "개선 방향" pseudo-code

2. **테스트 시나리오:**
   - Strategist agent로 "겨울 세일 광고 캠페인 기획해줘" 요청
   - content_plan 응답이 Canvas에 제대로 렌더링되는지 확인
   - 다중 페이지 생성 확인

3. **사용자 피드백 주시:**
   - 사용자는 결과물 품질에 매우 민감함
   - "만족스럽지 않다"는 피드백이 나오면 즉시 개선 필요

### 📚 필독 자료

1. **Polotno SDK 문서:** 객체 추가/수정 방법 숙지
2. **useChatStore.ts 전체 코드:** 현재 파싱 로직 이해
3. **백엔드 Agent 응답 형식:** 각 agent가 반환하는 JSON 구조 파악

### ⚠️ 주의 사항

1. **절대 하지 말 것:**
   - `brief: 'template'` 사용 금지 (Abstract class)
   - UI 컴포넌트 구조 함부로 변경 금지 (특히 StudioLayout)
   - 사용자 피드백 없이 대규모 리팩토링 금지

2. **반드시 할 것:**
   - 파일 수정 전 git status 확인
   - 커밋 전 사용자에게 변경 내용 설명
   - 한국어 응답 확인 (`language: 'ko'`)

### 🤝 협업 방식

- 사용자는 **Depth-First 전략**을 선호함 (완벽한 핵심 기능 우선)
- 결과물 품질에 대한 기준이 높음
- 명확한 설명과 투명한 커뮤니케이션 중요
- 문제가 생기면 솔직하게 인정하고 빠르게 수정

---

## 연락처 및 참고

**Branch:** `feature/editor-migration-polotno`
**Main Branch:** `main`
**작업 일자:** 2025-11-23
**C팀 Frontend 담당**

**다음 세션 시작 시:**
1. 이 문서 먼저 읽기
2. git status로 현재 상태 확인
3. Priority 1 작업 시작

**Good luck! 🚀**
