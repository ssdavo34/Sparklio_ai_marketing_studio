# C팀 → B팀 회신: Video Pipeline V2

**작성일**: 2025-11-29 01:15 KST
**작성자**: C팀 (Frontend)
**참조**: B_TEAM_VIDEO_PIPELINE_V2_REQUEST_2025-11-29.md

---

## 검토 완료 ✅

B팀 협조전 검토했습니다. 아래 각 항목에 대한 C팀 의견입니다.

---

## 1. 모드 선택 UI

### C팀 의견: ✅ 챗 세그먼트 방식 권장

```
[현재 RightDock Chat 패널 플로우]

User: "향수 광고 쇼츠 만들어줘"
        ↓
AI: "영상 제작을 시작할게요. 어떤 방식으로 진행할까요?"
        ↓
┌─────────────────────────────────────────────────────────────┐
│ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ │
│ │  기존 이미지    │ │   하이브리드    │ │   새로 제작     │ │
│ │     활용       │ │                 │ │                 │ │
│ │ 빠름 · 무료   │ │ 균형 · 일부비용 │ │ 창의적 · 비용↑  │ │
│ └─────────────────┘ └─────────────────┘ └─────────────────┘ │
└─────────────────────────────────────────────────────────────┘
        ↓ (클릭)
[PLAN 결과 화면으로 이동]
```

**장점**:
- 별도 페이지 이동 없이 자연스러운 대화 흐름
- 기존 Chat 패널 UX와 일관성 유지
- 구현 복잡도 낮음

**비용 표시 방식 제안**:
- 무료: `🆓 무료`
- 일부 비용: `💰 예상 ₩500~1,000`
- 높은 비용: `💎 예상 ₩2,000+`

---

## 2. PLAN 결과 확인/수정 화면

### C팀 의견: ✅ `ShortsPreviewView` 확장 권장

**기존 컴포넌트 재사용 가능**:

| 컴포넌트 | 위치 | 재사용 가능 기능 |
|----------|------|-----------------|
| `ShortsPreviewView` | `views/ShortsPreviewView.tsx` | 씬 목록, 씬 상세, 네비게이션 |
| `PagesTab` | `panels/left/tabs/PagesTab.tsx` | 드래그앤드롭 (react-beautiful-dnd) |
| `LayersPanel` | `components/LayersPanel.tsx` | 순서 변경 UI |

**제안 UI 구조**:

```
┌─────────────────────────────────────────────────────────────────┐
│ 헤더: ← 뒤로 | 🎬 PLAN 수정 | [확정 후 렌더링] 버튼            │
├──────────────────────┬──────────────────────────────────────────┤
│ 씬 목록 (DnD 가능)   │  씬 상세 편집                            │
│ ┌──────────────────┐ │  ┌────────────────────────────────────┐  │
│ │ ≡ 씬1: 인트로    │ │  │ 🖼️ 이미지 (클릭시 Asset Pool)     │  │
│ └──────────────────┘ │  │ ────────────────────────────────── │  │
│ ┌──────────────────┐ │  │ 📝 캡션: [수정 가능 텍스트필드]   │  │
│ │ ≡ 씬2: 특징 소개 │ │  │ ⏱️ 시간: [2초 ▼]                  │  │
│ └──────────────────┘ │  │ 🎵 전환: [fade ▼]                  │  │
│ ┌──────────────────┐ │  └────────────────────────────────────┘  │
│ │ ≡ 씬3: CTA       │ │                                          │
│ └──────────────────┘ │                                          │
├──────────────────────┴──────────────────────────────────────────┤
│ [+ 씬 추가] [🗑️ 선택 삭제]                                      │
└─────────────────────────────────────────────────────────────────┘
```

**구현 예상**: 기존 `ShortsPreviewView` 확장 (편집 모드 추가)

---

## 3. 렌더링 상태 표시

### C팀 의견: ✅ 신규 컴포넌트 필요

**기존 로딩 컴포넌트**: 없음 (spinner만 있음)

**제안 구현**:

```tsx
// components/canvas-studio/components/RenderProgress.tsx

export function RenderProgress({
  progress,
  estimatedTime,
  status
}: {
  progress: number;      // 0-100
  estimatedTime: string; // "약 30초"
  status: 'preparing' | 'rendering' | 'finalizing' | 'completed' | 'error';
}) {
  return (
    <div className="p-4 bg-white rounded-lg shadow">
      {/* 프로그레스 바 */}
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-purple-600 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* 상태 텍스트 */}
      <div className="mt-2 flex justify-between text-sm">
        <span>{STATUS_TEXT[status]}</span>
        <span>{progress}% • {estimatedTime}</span>
      </div>
    </div>
  );
}
```

**C팀 작업 가능**: ✅ (간단한 컴포넌트)

---

## 4. Asset Pool 이미지 선택

### C팀 의견: ✅ 신규 컴포넌트 필요

**기존 관련 컴포넌트**:

| 컴포넌트 | 재사용 가능 여부 |
|----------|------------------|
| `ImageGenerationPanel` | 일부 (이미지 표시 로직) |
| `UnsplashSearchModal` | 일부 (그리드 레이아웃) |
| `PagesTab` | 썸네일 표시 로직 |

**제안 구현**:

```tsx
// components/canvas-studio/modals/AssetPoolModal.tsx

interface AssetPoolModalProps {
  isOpen: boolean;
  onClose: () => void;
  assets: Asset[];
  selectedIds: string[];
  onSelect: (selectedAssets: Asset[]) => void;  // 순서 유지
  maxSelect?: number;
}
```

**UI 제안**:

```
┌─────────────────────────────────────────────────────────────────┐
│ Asset Pool                                      [X] 닫기        │
├─────────────────────────────────────────────────────────────────┤
│ 🔍 검색...                    [전체선택] [선택해제]            │
├─────────────────────────────────────────────────────────────────┤
│ ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐   │
│ │  ①   │ │  ②   │ │       │ │  ③   │ │       │ │       │   │
│ │ 🖼️   │ │ 🖼️   │ │ 🖼️   │ │ 🖼️   │ │ 🖼️   │ │ 🖼️   │   │
│ │       │ │       │ │       │ │       │ │       │ │       │   │
│ └───────┘ └───────┘ └───────┘ └───────┘ └───────┘ └───────┘   │
│                                                                 │
│ 선택된 순서: [img1] → [img2] → [img4]                          │
├─────────────────────────────────────────────────────────────────┤
│                              [취소]  [확인 (3개 선택)]          │
└─────────────────────────────────────────────────────────────────┘
```

**기능**:
- [x] 멀티셀렉트 (Ctrl+클릭)
- [x] 순서 표시 (선택 순서대로 번호)
- [x] 순서 변경 (선택된 이미지 드래그)
- [x] 검색/필터

---

## 5. 기존 API 호환성

### C팀 의견: ✅ 옵션 B (제거) 권장

**현재 `/video6/generate` 사용 현황**:

| 위치 | 사용 여부 |
|------|----------|
| Frontend 코드 | ❌ 없음 |
| 문서 | B팀 협조전에만 언급 |

**이유**:
- 프론트엔드에서 아직 Video6 API 연동 없음
- 깔끔한 시작이 가능
- 레거시 코드 관리 부담 없음

**단, 필요 시 옵션 C (내부 리다이렉트) 수용 가능**

---

## 작업 가능 시점

| 컴포넌트 | 예상 작업량 | 시점 |
|----------|------------|------|
| 모드 선택 UI (챗 세그먼트) | 2-3시간 | Phase 2 시작 시 |
| PLAN 수정 화면 | 4-6시간 | Phase 2 |
| RenderProgress | 1시간 | Phase 2 |
| AssetPoolModal | 3-4시간 | Phase 2 |

**총 예상**: ~12시간 (Phase 2)

---

## 추가 제안

### 1. 공통 타입 정의 필요

```typescript
// types/video-pipeline.ts

export interface VideoScene {
  id: string;
  scene_number: number;
  image_url: string;
  caption: string;
  duration_seconds: number;
  transition: 'fade' | 'cut' | 'slide' | 'zoom';
}

export interface VideoPlan {
  id: string;
  mode: 'REUSE' | 'HYBRID' | 'CREATIVE';
  scenes: VideoScene[];
  total_duration: number;
  status: 'draft' | 'confirmed' | 'rendering' | 'completed';
}
```

### 2. WebSocket 진행률 업데이트 권장

렌더링 진행률을 실시간으로 받기 위해 WebSocket 또는 SSE 사용 권장

```
Client ←────── WebSocket ──────→ Server
       {"type": "progress", "value": 45, "eta": "15초"}
```

---

## 요약

| 항목 | C팀 의견 |
|------|----------|
| 모드 선택 UI | ✅ 챗 세그먼트 방식 |
| PLAN 수정 화면 | ✅ ShortsPreviewView 확장 |
| 렌더링 상태 | ✅ 신규 RenderProgress 컴포넌트 |
| Asset Pool | ✅ 신규 AssetPoolModal 컴포넌트 |
| 기존 API | ✅ 옵션 B (제거) |
| 작업 시점 | Phase 2 시작 시 (~12시간) |

---

**추가 논의 필요 시**: Slack 또는 이 문서에 코멘트 부탁드립니다.

C팀 드림
