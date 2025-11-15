# Canvas Studio v3 신규 구현 - C팀 요약 지침서

**작성일**: 2025-11-15
**작성자**: A팀 (PM)
**대상**: C팀장
**우선순위**: P0 (즉시 시작)

---

## 1. 개요

### 기존 구현 폐기 및 재설계 배경

**기존 C_TEAM_WORK_ORDER.md (v2.0)의 문제점**:
- ❌ 원페이지 에디터의 실제 UX/레이아웃과 맞지 않음
- ❌ VSCode 스타일 패널 구조 누락
- ❌ Concept Board, Pitch Deck, Product Story 등 멀티 모드 지원 부족
- ❌ 이미지/표/그래프 고급 편집 기능 명세 부족

**새로운 방향 (v3.0)**:
- ✅ VSCode 스타일 **좌측 Activity Bar + 좌측 패널 + 중앙 캔버스 + 우측 Dock** 구조
- ✅ **Concept Board / Pitch Deck / Product Story** 3개 모드를 하나의 에디터에서 전환
- ✅ **Spark Chat → Generator → Canvas 편집 → Export** 전체 플로우 완성
- ✅ 이미지/표/그래프 고급 편집 기능 포함

---

## 2. Sparklio Canvas Studio란?

**핵심 컨셉**:
> "하나의 화면에서 브랜드 킷, 컨셉보드, 상품상세, 프리젠테이션, 광고·쇼츠, SNS 세트까지
> **챗으로 생성 → 캔버스로 정밀 수정 → 한 번에 발행**하는 **단일 원페이지 에디터**"

**주요 특징**:
- **VSCode 스타일**: 개발자가 익숙한 패널 구조 (좌측 액티비티 바, 사이드 패널, 중앙 캔버스, 우측 Dock)
- **멀티 모드**: 하나의 에디터에서 Concept Board, Pitch Deck, Product Story 등을 전환
- **AI 통합**: Spark Chat에서 자연어로 명령 → 즉시 캔버스 업데이트
- **비파괴 편집**: 모든 편집 내용 Undo/Redo 가능, 원본 유지

---

## 3. 전체 레이아웃 구조 (VSCode 스타일)

```
┌───────────────────────────────────────────────────────────────────┐
│ [Top Toolbar: Studio / Canvas Focus / Chat Focus | 문서명 | 저장] │
├──┬────────────┬──────────────────────────────────┬────────────────┤
│ A│            │                                  │                │
│ c│  Left      │        Canvas Viewport          │   Right Dock   │
│ t│  Panel     │      (Fabric.js Canvas)         │                │
│ i│            │                                  │  ┌──────────┐  │
│ v│  ┌──────┐  │  ┌────────────────────────┐     │  │ Chat     │  │
│ i│  │Page 1│  │  │                        │     │  │Inspector │  │
│ t│  │Page 2│  │  │   [Canvas Area]        │     │  │Layers    │  │
│ y│  │Page 3│  │  │                        │     │  │Data      │  │
│  │  │  +   │  │  │                        │     │  │Brand     │  │
│ B│  └──────┘  │  └────────────────────────┘     │  └──────────┘  │
│ a│            │                                  │                │
│ r│            │                                  │  [Tab Content] │
│  │            │                                  │                │
└──┴────────────┴──────────────────────────────────┴────────────────┘
```

**구성 요소**:
1. **Top Toolbar**: 뷰 모드 전환, 문서명, 저장 버튼
2. **Activity Bar** (좌측 세로 아이콘 바, 56px):
   - Brand DNA, Concept Board, Product Story, Pitch Deck, Ad Studio 등
3. **Left Panel** (좌측 패널, 약 280px):
   - 페이지 썸네일 리스트 (Pitch Deck, Product Story)
   - 레이어/그룹 리스트 (Concept Board)
4. **Canvas Viewport** (중앙):
   - Fabric.js 기반 캔버스
   - 확대/축소, 그리드, 정렬 가이드
5. **Right Dock** (우측 패널, 약 360px):
   - 5개 탭: Spark Chat, Inspector, Layers, Data, Brand

---

## 4. 3개 모드 (P0 범위)

### 4.1 Concept Board (컨셉보드)
- **용도**: 브랜드/캠페인 아이디어의 출발점
- **구성**: 이미지 타일, 색상칩, 폰트 샘플, 키워드 카드, 메모
- **기능**:
  - 이미지 자동 정렬 (Mood Wall, Palette Wall, Type Wall, Mixed)
  - 색상 팔레트 자동 추출
  - 키워드 생성
  - Brand Kit 저장 기능

### 4.2 Pitch Deck (프리젠테이션)
- **용도**: 10~20장짜리 슬라이드 프레젠테이션
- **구성**: 제목 슬라이드, 본문 슬라이드, 표, 그래프
- **기능**:
  - 다중 페이지 (좌측 패널에 썸네일 리스트)
  - 페이지 추가/삭제/복제/순서 변경
  - 섹션(챕터) 그룹핑

### 4.3 Product Story (상품상세)
- **용도**: 상품 상세페이지, 브로셔
- **구성**: Hero 이미지, 제품 특징, 스펙 표, 리뷰
- **기능**:
  - 스크롤형 긴 페이지 (1440×2560)
  - 섹션별 편집
  - 이미지 배경 제거

---

## 5. 우측 Dock 5개 탭

### 5.1 Spark Chat
- **용도**: AI와 대화하며 캔버스 편집
- **기능**:
  - "지금 슬라이드에 제목 추가해줘"
  - "2번째 표를 매출 기준 정렬해줘"
  - "컨셉보드 기반으로 이 페이지 레이아웃 새로 구성해줘"
- **특징**: 입력창이 절대 안 사라지도록 고정

### 5.2 Inspector
- **용도**: 선택한 오브젝트 속성 편집
- **기능**:
  - 텍스트: 폰트, 크기, 색, 정렬, 자간/행간
  - 이미지: 크기, 비율, 필터, 배경 제거, 그림자, 프레임
  - 표/그래프: 스타일, 데이터, 축/범례 설정

### 5.3 Layers
- **용도**: 페이지/보드의 모든 오브젝트 트리 구조 표시
- **기능**:
  - 잠금/숨김/이름 변경
  - 그룹/언그룹

### 5.4 Data
- **용도**: 현재 문서의 데이터 소스 관리
- **기능**:
  - 표 데이터, 외부 스프레드시트 링크, CSV
  - "이 데이터로 새 그래프 만들기" 버튼

### 5.5 Brand
- **용도**: 브랜드 킷 에셋 관리
- **기능**:
  - 로고, 색상 팔레트, 폰트, 버튼 스타일
  - 드래그 & 드롭으로 캔버스에 삽입

---

## 6. 폴더 구조 (기존 구조 유지, Canvas Studio만 추가)

**중요**: 기존 프로젝트를 건드리지 않고, 새로운 Canvas Studio만 추가합니다.

```
frontend/
├── app/
│   ├── studio/                      # NEW: Canvas Studio 라우트
│   │   └── page.tsx
│   ├── layout.tsx                   # 기존 유지
│   └── page.tsx                     # 기존 유지
│
├── components/
│   ├── canvas-studio/               # NEW: Canvas Studio 전용 폴더
│   │   ├── CanvasStudioShell.tsx
│   │   ├── layout/
│   │   │   ├── StudioLayout.tsx
│   │   │   ├── ActivityBar.tsx
│   │   │   ├── LeftPanel.tsx
│   │   │   ├── CanvasViewport.tsx
│   │   │   └── RightDock.tsx
│   │   ├── right-dock/
│   │   │   ├── SparkChatTab.tsx
│   │   │   ├── InspectorTab.tsx
│   │   │   ├── LayersTab.tsx
│   │   │   ├── DataTab.tsx
│   │   │   └── BrandTab.tsx
│   │   ├── modes/
│   │   │   ├── modeConfig.ts
│   │   │   ├── ConceptBoardMode.tsx
│   │   │   ├── PitchDeckMode.tsx
│   │   │   └── ProductStoryMode.tsx
│   │   ├── canvas/
│   │   │   ├── canvasStore.ts
│   │   │   └── useCanvasCommands.ts
│   │   ├── editor-store/
│   │   │   └── useEditorStore.ts
│   │   └── chat/
│   │       └── chatStore.ts
│   │
│   ├── Chat/                        # 기존 유지
│   ├── Editor/                      # 기존 유지
│   └── Layout/                      # 기존 유지
│
├── lib/                             # 기존 유지
├── store/                           # 기존 유지
├── types/                           # 기존 유지
├── hooks/                           # 기존 유지
└── public/                          # 기존 유지
```

**롤백 방법**:
- `app/studio/` 폴더 삭제
- `components/canvas-studio/` 폴더 삭제
- 끝! (기존 코드 완전히 보존)

---

## 7. 기술 스택

| 분류 | 기술 | 버전 |
|------|------|------|
| Framework | Next.js | 14.x (App Router) |
| Language | TypeScript | 5.x |
| Styling | Tailwind CSS | 3.x |
| State | Zustand | 4.x |
| Canvas | Fabric.js | 5.x |
| HTTP | Axios | 1.x |

**추가 설치 필요**:
```bash
npm install fabric zustand
npm install -D @types/fabric
```

---

## 8. P0 작업 단계 (4주)

### Week 1: 기본 레이아웃
**목표**: VSCode 스타일 패널 구조 완성

- [ ] `app/studio/page.tsx` 생성
- [ ] `components/canvas-studio/` 폴더 구조 생성
- [ ] `StudioLayout.tsx` (좌/중/우 3분할)
- [ ] `ActivityBar.tsx` (작업 타입 전환)
- [ ] `LeftPanel.tsx` (더미 데이터)
- [ ] `CanvasViewport.tsx` (빈 캔버스)
- [ ] `RightDock.tsx` + 5개 탭 레이아웃
- [ ] `TopToolbar.tsx`

**산출물**: `/studio` 접속 시 VSCode 스타일 레이아웃 표시

---

### Week 2: 캔버스 & 페이지 관리
**목표**: Fabric.js 캔버스 및 페이지 썸네일 관리

- [ ] Fabric.js 초기화
- [ ] `canvasStore.ts` (캔버스 상태 관리)
- [ ] `LeftPanelPages.tsx` (페이지 썸네일 리스트)
- [ ] 페이지 추가/삭제/복제
- [ ] 페이지 클릭 시 캔버스 전환
- [ ] 텍스트/이미지 오브젝트 추가 (기본)

**산출물**: 페이지 관리 + 캔버스에 텍스트/이미지 추가 가능

---

### Week 3: 모드 시스템 & Chat 연동
**목표**: 3개 모드 구현 및 Chat 연동

- [ ] `modeConfig.ts` (모드별 설정)
- [ ] `ConceptBoardMode.tsx`
- [ ] `PitchDeckMode.tsx`
- [ ] `ProductStoryMode.tsx`
- [ ] `SparkChatTab.tsx` (Chat UI)
- [ ] Chat → Generator API 연동
- [ ] Generator 응답 → Canvas 로딩

**산출물**: Chat에서 "프리젠테이션 만들어줘" → Generator 호출 → Canvas 로딩

---

### Week 4: Inspector & 고급 편집
**목표**: Inspector 패널 및 이미지/표 편집 기능

- [ ] `InspectorTab.tsx` (속성 편집)
- [ ] 텍스트 편집: 폰트, 크기, 색상, 정렬
- [ ] 이미지 편집: 크기, 필터, 배경 제거 (stub)
- [ ] 표 생성 + 스타일링
- [ ] `LayersTab.tsx` (레이어 트리)
- [ ] Undo/Redo
- [ ] PNG Export

**산출물**: Inspector 편집 + 표 생성 + PNG 다운로드

---

## 9. P0 완료 기준 (DoD)

**테스트 시나리오**:
```
1. /studio 접속
2. Activity Bar에서 "Pitch Deck" 선택
3. 좌측 패널에서 "New Document" 클릭
4. Spark Chat에서 "10장짜리 회사 소개 프레젠테이션 만들어줘" 입력
5. Generator 호출 → 10장의 슬라이드 생성
6. 좌측 패널에 10개 썸네일 표시
7. 첫 번째 슬라이드 클릭 → 캔버스에 로딩
8. 제목 텍스트 클릭 → Inspector에서 폰트 변경
9. 이미지 추가 → 크기 조절
10. PNG Export → 파일 다운로드
```

**통과 기준**:
- ✅ 위 시나리오 1회 이상 성공
- ✅ VSCode 스타일 레이아웃 완전히 동작
- ✅ 3개 모드 전환 가능
- ✅ Chat → Generator → Canvas 흐름 완성
- ✅ Inspector에서 기본 속성 편집 가능
- ✅ PNG Export 성공

---

## 10. API 연동

### 10.1 Backend API Endpoint

**Base URL**: `http://100.123.51.5:8000`

**Canvas Studio 관련 API**:

```typescript
// 1. Generator 호출 (기존)
POST /api/v1/generate
{
  "kind": "pitch_deck",
  "brandId": "brand_001",
  "locale": "ko-KR",
  "input": { ... }
}

// 2. Concept Board 생성 (NEW - B팀 구현 후)
POST /api/v1/concept-board/generate

// 3. 문서 저장
POST /api/v1/documents/{docId}/save

// 4. Editor Action
POST /api/v1/editor/action
```

### 10.2 API Client 확장

기존 `lib/api-client.ts`를 확장하여 Canvas Studio 전용 함수 추가:

```typescript
// Concept Board 생성
export async function generateConceptBoard(request: any) {
  const response = await api.post('/api/v1/concept-board/generate', request);
  return response.data;
}

// Concept Board 조회
export async function getConceptBoard(boardId: string) {
  const response = await api.get(`/api/v1/concept-board/${boardId}`);
  return response.data;
}
```

---

## 11. 필독 문서

### 최우선 (총 2시간)

1. **C_TEAM_WORK_ORDER_CANVAS_STUDIO_v3.md** ← **이 문서**
   - 경로: [docs/C_TEAM_WORK_ORDER_CANVAS_STUDIO_v3.md](K:\sparklio_ai_marketing_studio\docs\C_TEAM_WORK_ORDER_CANVAS_STUDIO_v3.md)
   - 읽기: 60분
   - 내용: 전체 Canvas Studio 구조, 컴포넌트, 작업 단계

2. **Sparklio One-Page Creative Studio — UX & Layout Master Spec (v1).md**
   - 경로: `K:\obsidian-k\Sparklio_ai_marketing_studio\최종계획\에디터\001.Sparklio One-Page Creative Studio — UX & Layout Master Spec (v1).md`
   - 읽기: 30분
   - 내용: UX 철학, 레이아웃 구조, 기능 명세

3. **FRONTEND_CANVAS_STUDIO_STRUCTURE_v1.md**
   - 경로: `K:\obsidian-k\Sparklio_ai_marketing_studio\최종계획\에디터\002.FRONTEND_CANVAS_STUDIO_STRUCTURE_v1.md`
   - 읽기: 30분
   - 내용: 프론트엔드 폴더 구조, 컴포넌트 구조

---

## 12. 시작 전 체크리스트

### C팀장님께

1. **선행 작업**:
   - ✅ 기존 프로젝트 백업 (Git 커밋 확인)
   - ✅ Node.js, npm 버전 확인
   - ✅ Next.js 14 App Router 환경 확인

2. **작업 시작**:
   - `feature/canvas-studio-v3` 브랜치 생성
   - `app/studio/` 폴더 생성
   - `components/canvas-studio/` 폴더 생성

3. **첫 커밋**:
   ```bash
   git checkout -b feature/canvas-studio-v3
   mkdir -p app/studio
   mkdir -p components/canvas-studio
   git add .
   git commit -m "feat(canvas-studio): Initialize Canvas Studio v3 structure"
   git push origin feature/canvas-studio-v3
   ```

---

## 13. 주요 차이점 (v2.0 → v3.0)

| 항목 | v2.0 (폐기) | v3.0 (신규) |
|------|-------------|-------------|
| **레이아웃** | Chat-First SPA | VSCode 스타일 패널 구조 |
| **모드** | 단일 모드 | 3개 모드 (Concept Board, Pitch Deck, Product Story) |
| **좌측 패널** | 없음 | 페이지 썸네일 리스트 |
| **우측 Dock** | 단순 Inspector | 5개 탭 (Chat, Inspector, Layers, Data, Brand) |
| **캔버스** | 기본 Fabric.js | 고급 편집 (이미지 배경 제거, 표, 그래프) |
| **폴더 구조** | `app/page.tsx` 중심 | `components/canvas-studio/` 독립 |

---

## 14. 리스크 및 대응

### 리스크 1: 기존 코드와 충돌
**대응**: `components/canvas-studio/` 폴더에만 작업, 기존 폴더 건드리지 않음

### 리스크 2: Fabric.js 학습 곡선
**대응**: Week 1에 Fabric.js 기본 튜토리얼 진행, 샘플 코드 제공

### 리스크 3: Generator API 의존성
**대응**: Week 3까지는 더미 데이터로 진행, B팀 API 완료 대기

### 리스크 4: 일정 지연
**대응**: Phase별 DoD 명확히 설정, 주간 체크인으로 진행 상황 확인

---

## 15. 문제 발생 시 에스컬레이션

| Level | 대상 | 상황 |
|-------|------|------|
| **L1** | 팀 내 협의 | 컴포넌트 구현 방식, 기술 선택 |
| **L2** | A팀 (PM) | API 스펙 변경, 우선순위 조정 |
| **L3** | 전체 회의 | 아키텍처 변경, 일정 조율 |

**연락 방법**: GitHub Issue 생성 + 라벨 `canvas-studio`

---

## 16. 다음 단계

1. **이 문서 공유**:
   - C팀장님께 전달

2. **킥오프 미팅** (30분):
   - 일시: 즉시 또는 익일
   - 안건: Canvas Studio 개요, Phase별 일정, 역할 분담

3. **작업 시작**:
   - C팀: `feature/canvas-studio-v3` 브랜치 생성
   - Phase 1: VSCode 스타일 레이아웃부터 시작

4. **주간 체크인**:
   - 매주 금요일 15분 진행 상황 공유
   - Blocker 확인

---

## 17. 최종 확인

**Canvas Studio v3의 목표**:
> "VSCode 스타일의 원페이지 에디터에서 Chat → Generator → Canvas 편집 → Export까지 작동하는 완전한 크리에이티브 스튜디오 구현"

**P0 목표**:
> "Pitch Deck 모드에서 10장짜리 프레젠테이션 생성 → 편집 → PNG Export 성공"

**예상 효과**:
- 브랜드별 일관된 크리에이티브 제작 환경
- AI 통합으로 빠른 초안 생성
- 정밀한 수동 편집 지원
- 멀티 모드로 다양한 출력물 대응 (컨셉보드, 프리젠테이션, 상품상세 등)

---

**작성 완료**: 2025-11-15
**버전**: v1.0
**문의**: A팀 (PM)

**Good luck, C팀! 🚀**
