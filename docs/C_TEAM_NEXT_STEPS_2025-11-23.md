# C_TEAM_NEXT_STEPS_2025-11-23.md
버전: v1.0
작성일: 2025-11-23
대상: C팀 (Frontend / Canvas Studio / Chat UI)

---

## 1. 현재 C팀 완료 상태 요약

### 1.1 Ad Copy 라인

- `AdCopyOutput.tsx`
  - AdCopySimpleOutputV2 렌더링
  - 글자 수 표시 및 길이 초과 경고
  - 데스크톱/모바일 미리보기
  - 인라인 편집, Bullets 추가/삭제
- `QualityScore.tsx`
  - 필드별 점수/길이/가중치 표시
  - 7.0 미만 필드 자동 식별
  - **"자동 개선" 버튼** 추가 (필드별 최적화 트리거)
- `field-optimization-api.ts`
  - 필드별 최적화 API 연동
  - 원본 vs 개선안 **Diff 비교 UI** (AdCopyOutput 통합 완료)

### 1.2 Content Plan & Polotno 라인

- `response-type-detector.ts`
  - AI 응답 타입 자동 감지 (ad_copy / content_plan 등)
  - 신뢰도 기반 타입 판정
- `AIResponseRenderer.tsx`
  - 응답 타입에 따라 적절한 컴포넌트로 자동 라우팅
- `ChatPanel.tsx`
  - Chat → Renderer → AdCopy/ContentPlan/기타로 일원화된 플로우
- `ContentPlanViewer.tsx`
  - 5가지 레이아웃(cover, audience, overview, channels, cta) 페이지 뷰어
- `content-plan-to-polotno.ts`
  - 레이아웃별 Polotno 템플릿 변환
  - Cover: 강한 그라데이션 + 🚀
  - Audience: 파란 테마 + 👥
  - Overview: 초록 테마 + 📊
  - Channels: 주황 테마 + 📢
  - CTA: 분홍 테마 + ✨
- **1-click Canvas 적용**
  - ContentPlanViewer → Polotno 슬라이드/페이지로 자동 변환 버튼

### 1.3 내부용 Debug / QA 도구

- `AgentDebugPanel.tsx`
  - Raw LLM Output
  - Parsed Output (Agent Schema)
  - ValidationResult 상세
  - Error 정보
  - 복사/다운로드 기능
- `useAgentDebugger.ts`
  - Agent 실행 로그 수집 Hook
- Dev Mode 토글
  - `localStorage`/환경변수 기반 개발 모드
  - 개발 모드에서만 AgentDebugPanel 표시

**결론:**
C팀 P0~P1 작업(카피/컨텐츠 플로우/디버그 도구)은 "Copywriter + ContentPlan 라인" 기준으로 **사실상 1차 완결** 상태입니다.

---

## 2. 다음 우선순위: Strategist & 품질 시스템 연동

### 2.1 목표

- Top 5 Agent 롤아웃(Strategist/Reviewer/Optimizer/Designer) 중,
  **첫 번째 후보인 StrategistAgent** 결과를 잘 보여줄 수 있는 UI를 준비합니다.
- 이미 구현된:
  - AdCopyOutput
  - ContentPlanViewer
  - QualityScore
  - Agent Debug Panel
  과 자연스럽게 이어지는 **"전략 요약 뷰"**를 만드는 것이 핵심입니다.

---

## 3. P0 – Strategist 결과 UI 골격 잡기 (이번 주~다음 주 초)

> Backend에서 `strategist.campaign_strategy`가 나오는 즉시 꽂을 수 있도록,
> 먼저 **타입/컴포넌트/플로우 골격**을 잡는 작업입니다.

### 3.1 타입 정의

**파일 제안:**
- `components/canvas-studio/types/strategist.ts`

**할 일:**

1. `CampaignStrategyOutputV1` TypeScript 타입 정의
   - 스펙 기준 필드:
     - `core_message`, `positioning`, `big_idea`
     - `target_insights[]`
     - `strategic_pillars[]` (name, description, proof_points[])
     - `channel_strategy[]` (channel, role, message_angle, kpi)
     - `funnel_structure` (awareness/consideration/conversion)
     - `risk_factors[]`, `success_metrics[]`
2. 타입 가드/헬퍼 함수
   - ex) `isCampaignStrategyOutput(payload: unknown): payload is CampaignStrategyOutputV1`

### 3.2 StrategistStrategyView 컴포넌트 (v1)

**파일 제안:**
- `components/canvas-studio/components/StrategistStrategyView.tsx`

**구성 (v1):**

- 상단: **핵심 카드 2개**
  - Core Message
  - Big Idea
- 중간: 2단 레이아웃
  - 왼쪽: Strategic Pillars 리스트
  - 오른쪽: Channel Strategy 카드/테이블
- 하단: Funnel Structure 3단 컬럼
  - Awareness / Consideration / Conversion
- 우측/하단: Risk & Success Metrics
  - 위험 요소 리스트
  - 성공 지표 리스트

**필수 기능 (v1):**

- Read-only 뷰어 (편집 모드는 v2에서)
- 긴 텍스트는 줄바꿈/스크롤 처리로 가독성 확보
- 모바일/좁은 화면에서도 깨지지 않는 레이아웃 (flex/stack 반응형)

### 3.3 Chat/Renderer 통합 (신규 타입 대응)

1. `response-type-detector.ts`
   - Strategist 결과 타입 감지 로직 추가
   - 예: `type === "campaign_strategy"` 또는 payload shape 기반 판단
2. `AIResponseRenderer.tsx`
   - Strategist 타입일 때:
     - `<StrategistStrategyView data={parsed} />` 렌더
3. `ChatPanel.tsx`
   - Copywriter/ContentPlan과 동일한 플로우로 이어지는지 확인
   - Dev Mode에서 AgentDebugPanel과 함께 Strategist 결과도 확인 가능하게

**v1 방향:**
- 일단은 "읽기 전용 전략 요약 뷰"까지만 완료
- ContentPlan과의 딥한 연동(예: "이 전략으로 content_plan 재생성")은 P1에서 확장

---

## 4. P1 – Strategist + ContentPlan 연동 UX (다음 주)

### 4.1 ContentPlan 상단 "전략 요약" 섹션

- `ContentPlanViewer` 상단/우측에 탭/섹션 추가:
  - "전략 요약" 탭 클릭 시 StrategistStrategyView를 보여주기
- 플로우 예:
  1. 사용자가 content_plan 요청
  2. Backend: content_plan + strategist.campaign_strategy 둘 다 생성
  3. Frontend:
     - ContentPlanViewer 기본 표시
     - 상단 탭으로 "전략 요약" 전환 시 StrategistStrategyView 표시

### 4.2 전략 → 카피/캔버스 액션 버튼

- StrategistStrategyView 내부에 버튼 추가 (Hook만 연결해두기)
  - "이 전략으로 카피 다시 생성"
  - "이 전략 기반 슬라이드 만들기"
- 실제 API 연동은 B/A팀 상황에 따라 뒤에서 붙여도 되므로,
  - 일단 `onAction?` 형태의 Prop으로만 인터페이스 정의해 두면 좋음

---

## 5. P2 – 에디터/시스템 레벨 개선 (Undo/Redo, ID 관리, TODO 정리)

### 5.1 Undo/Redo 최소 버전

> 지금은 "결과물을 만들고, Polotno에 보내고, 수정"까지는 되지만
> "한 단계 전으로 되돌리기"가 없는 상태라, 사용성이 떨어질 수 있습니다.

**목표:**
- 최소한 "캔버스 상태 단위"로 Undo/Redo 스택을 만드는 기본 틀 구축

**아이디어:**

- `useCanvasStore` 또는 유사 전역 상태에서:
  - `history: CanvasDocumentState[]`
  - `historyIndex: number`
  - `undo()`, `redo()`, `pushHistory(nextState)` 액션
- 단, 첫 버전에서는:
  - "중요 액션"에서만 push (새 슬라이드 생성, 레이아웃 변경 등)
  - Polotno 내부의 세부 드로잉까지 다 추적하지는 않고,
    Document-level snapshot 위주로 구성

### 5.2 사용자 ID / 브랜드 ID 관리

> 현재 하드코딩/임시 값으로 들어간 userId/brandId를
> 최소한 타입/컨텍스트로 정리하는 단계입니다.

**할 일:**

1. 전역 컨텍스트/스토어 정의
   - 예: `useSessionStore` 또는 `AppContext`
   - 포함: `userId`, `brandId`, `workspaceId` 등
2. 기존 하드코딩 지점 치환
   - `TODO userId`, `TODO brandId` 등 1차 검색 후
   - 전역 스토어에서 값을 읽어오는 형태로 교체

> 아직 실제 인증/브랜드 DB와 연결하지 않아도 되고,
> "값을 한 곳에서 관리"하는 것만으로도 구조가 깔끔해집니다.

### 5.3 TODO 정리 (27개 주석)

**전략:**

- 한 번에 다 없애려 하지 말고, 3단계로 정리:
  1. **P0**: 위험/버그 관련 TODO (에러 처리, 타입 any, try/catch 등)
  2. **P1**: UX/리팩터링 관련 TODO
  3. **P2**: 아이디어/미래 계획성 TODO

**할 일:**

1. `grep "TODO"` 기준으로 목록화
2. `C_TEAM_TODO_LIST_2025-11-XX.md`로 문서화
3. P0/P1 항목부터 하나씩 처리 (매 스프린트 5~10개씩 제거하는 느낌)

---

## 6. 이번 주 C팀 우선순위 요약

1. **P0 – Strategist 라인 골격**
   - `strategist.ts` 타입 정의
   - `StrategistStrategyView.tsx` v1 (읽기 전용)
   - `AIResponseRenderer` / `response-type-detector`에 Strategist 타입 추가

2. **P1 – Strategist ↔ ContentPlan 연동**
   - ContentPlanViewer 상단/우측에 "전략 요약" 섹션/탭
   - 전략 뷰 → 향후 액션 버튼 위치만 미리 잡아두기

3. **P2 – 에디터/시스템 개선**
   - Undo/Redo 최소 버전 설계
   - userId/brandId 전역 컨텍스트 정리
   - TODO 주석 목록화 및 P0급부터 제거

---

## 7. 체크리스트

### Week 1 (이번 주)
- [ ] `strategist.ts` 타입 정의 완료
- [ ] `StrategistStrategyView.tsx` v1 컴포넌트 생성
- [ ] `response-type-detector.ts`에 Strategist 타입 감지 추가
- [ ] `AIResponseRenderer.tsx`에 Strategist 렌더링 추가
- [ ] 간단한 Mock 데이터로 StrategistStrategyView 동작 확인

### Week 2 (다음 주)
- [ ] ContentPlanViewer에 "전략 요약" 탭 추가
- [ ] Strategist ↔ ContentPlan 연동 플로우 확인
- [ ] 전략 기반 액션 버튼 위치 설정
- [ ] Undo/Redo 기본 설계 문서화
- [ ] userId/brandId 전역 스토어 구조 설계

---

이 지침대로라면,

- C팀은 지금까지 만든 **"Copywriter + ContentPlan + Debug" 완성도**를 유지한 채,
- 바로 **Strategist/Top 5 에이전트 시대를 위한 프론트 뼈대**를 깔아놓을 수 있습니다.
