# C팀 우선순위 TODO - B팀 충돌 분석 포함

**작성일**: 2025-11-27 (목요일)
**작성팀**: C팀 (Frontend)
**목적**: B팀과의 충돌 여부를 검토하고 안전한 병렬 작업 계획 수립

---

## 🔍 B팀 현재 작업 현황 분석

### B팀이 변경할 파일들 (예상)

| 파일 경로 | 작업 내용 | C팀 영향도 |
|----------|----------|-----------|
| `backend/app/services/agents/concept.py` | ConceptV1 스키마 추가, 프롬프트 업그레이드 | ⚠️ **중간** - API 응답 구조 변경 |
| `backend/app/api/v1/concepts.py` | 새 엔드포인트 추가 (`POST /from-prompt`) | ✅ **없음** - 신규 파일 |
| `backend/app/api/v1/__init__.py` | 라우터 등록 | ✅ **없음** - 기존 코드 유지 |
| `backend/app/models/campaign.py` (Phase 2) | Concept 테이블 추가 | ✅ **없음** - 신규 모델 |

### 현재 B팀 상태 (Git 기준)

**최근 커밋**:
```
0ee337c [2025-11-27][B] docs: B팀 일일 백엔드 보고서 작성
c16eac5 [2025-11-27][B] fix: ShortsScriptAgent max_tokens 8000으로 증가
1e59288 [2025-11-27][B] fix: Gemini Provider Safety 설정 추가
aa5b6a1 [2025-11-27][B] feat: Asset 생성 로직 구현 - ShortsScriptAgent 연동
```

**현재 작업 중**:
- ShortsScriptAgent 개선 (완료)
- Asset 생성 로직 구현 (완료)
- **ConceptAgent 업그레이드는 아직 시작 안 함** ✅

### 결론: B팀과 직접적인 충돌 가능성 **낮음**

**이유**:
1. B팀은 현재 Shorts/Asset 작업 중, ConceptAgent는 미착수
2. C팀이 요청한 작업은 **신규 파일 추가** (`concepts.py`) - 기존 코드 수정 최소
3. `concept.py` 수정도 **추가 확장**이지 기존 코드 변경 아님 (기존 `ConceptOutput`은 유지)

---

## 🚦 충돌 위험도별 작업 분류

### 🟢 **P0: Zero Conflict - 즉시 시작 가능** (5-6시간)

**특징**:
- B팀 코드와 완전히 독립적
- Mock 데이터 사용 → Backend 불필요
- 언제든지 실제 API로 전환 가능 (5분 작업)

| # | 작업 | 예상 시간 | 의존성 | 시작 시점 |
|---|------|----------|--------|----------|
| 1 | TypeScript 타입 정의 (`types/concept.ts`) | 30분 | 없음 | **지금 즉시** ✅ |
| 2 | Mock 데이터 생성 (`lib/mocks/conceptV1Mock.ts`) | 1시간 | Task #1 완료 후 | **지금 즉시** ✅ |
| 3 | `useConceptGenerate()` Hook (Mock 모드) | 30분 | Task #2 완료 후 | **지금 즉시** ✅ |
| 4 | ConceptBoardView UI 확장 | 2-3시간 | Task #1-3 완료 후 | **지금 즉시** ✅ |
| 5 | ChatPanel 모드 토글 추가 | 1시간 | Task #3 완료 후 | **지금 즉시** ✅ |

**총 작업 시간**: 5-6시간
**B팀 의존도**: 0%
**완료 후 상태**: 완전히 동작하는 UI (Mock 데이터로)

---

### 🟡 **P1: Low Conflict - 조율 후 시작** (30분)

**특징**:
- B팀과 같은 파일을 수정하지만, 다른 부분
- Git merge conflict 위험 낮음
- 간단한 Slack 알림으로 충분

| # | 작업 | 예상 시간 | 충돌 위험 | 조율 방법 |
|---|------|----------|----------|----------|
| 6 | `useGenerate()` Hook에 ConceptV1 타입 추가 | 15분 | ⚠️ 낮음 | Slack으로 B팀에 알림 |
| 7 | ChatPanel `addGenerateResponseToPolotno()` 개선 | 15분 | ⚠️ 낮음 | 기존 로직 유지, 새 모드만 추가 |

**총 작업 시간**: 30분
**B팀 의존도**: 10% (알림만 필요)

---

### 🔴 **P2: High Dependency - B팀 완료 후** (5분)

**특징**:
- B팀 API 엔드포인트 완성 필수
- 코드 수정 최소 (useMock 플래그만 변경)

| # | 작업 | 예상 시간 | B팀 작업 필요 | 대기 시간 |
|---|------|----------|--------------|----------|
| 8 | `useConceptGenerate()` Hook - useMock 플래그 OFF | 2분 | ✅ `/from-prompt` API 완성 | B팀 1-2시간 |
| 9 | 실제 API 연동 테스트 | 3분 | ✅ Mac mini 배포 완료 | B팀 1-2시간 |

**총 작업 시간**: 5분
**B팀 의존도**: 100%
**B팀 예상 작업 시간**: 1-2시간

---

## ✅ 우선순위 TODO 리스트

### 📋 Phase 1: 독립 작업 (지금 즉시 시작, 5-6시간)

#### ✅ Task 1: TypeScript 타입 정의 (30분) 🟢 P0

**파일**: `frontend/types/concept.ts` (신규 생성)

**작업 내용**:
```typescript
/**
 * ConceptV1 타입 정의 (CONCEPT_SPEC.md 기준)
 *
 * B팀 의존도: 0% - CONCEPT_SPEC.md 스펙만 참조
 */

export interface VisualWorld {
  color_palette: string;
  photo_style: string;
  layout_motifs: string[];
  hex_colors: string[];
}

export interface ChannelStrategy {
  shorts?: string;
  instagram_news?: string;
  product_detail?: string;
  presentation?: string;
}

export interface Guardrails {
  avoid_claims: string[];
  must_include: string[];
}

export interface ConceptMeta {
  brand_id?: string;
  project_id?: string;
  created_by: string;
  created_at: string;
  status: 'draft' | 'active' | 'archived';
}

export interface ConceptV1 {
  // 기본
  id: string;
  version: number;
  name: string;
  topic: string;
  mode: string;

  // 전략 핵심
  audience_insight: string;
  core_promise: string;
  brand_role: string;

  // 근거
  reason_to_believe: string[];

  // 크리에이티브
  creative_device: string;
  hook_patterns: string[];

  // 비주얼
  visual_world: VisualWorld;

  // 채널 전략
  channel_strategy: ChannelStrategy;

  // 가드레일
  guardrails: Guardrails;

  // 기존 호환
  target_audience: string;
  tone_and_manner: string;
  keywords: string[];

  // 메타
  meta: ConceptMeta;
}

export interface ConceptV1Response {
  concepts: ConceptV1[];
  reasoning: string;
}
```

**충돌 위험**: ❌ 없음 (신규 파일)
**시작 조건**: 없음 - **지금 즉시 시작 가능** ✅

---

#### ✅ Task 2: Mock 데이터 생성 (1시간) 🟢 P0

**파일**: `frontend/lib/mocks/conceptV1Mock.ts` (신규 생성)

**작업 내용**:
```typescript
import type { ConceptV1, ConceptV1Response } from '@/types/concept';

/**
 * ConceptV1 Mock 데이터
 *
 * B팀 의존도: 0% - 실제 API 없이도 UI 개발 가능
 */

export const mockConceptV1_1: ConceptV1 = {
  id: 'CONCEPT_abc123',
  version: 1,
  name: '퇴근길 속 편한 단백질 루틴',
  topic: '단백질 스낵',
  mode: 'launch_campaign',

  // 전략 핵심
  audience_insight: '퇴근길에 허기져서 자꾸 편의점 과자를 사게 되는데, 내일 아침이 걱정된다.',
  core_promise: '배는 차게, 속은 편하게 채워주는 단백질 루틴',
  brand_role: '나를 챙겨주는 "퇴근 후 루틴" 가이드',

  // 근거
  reason_to_believe: [
    '당 5g 이하, 단백질 15g 이상',
    '위에 부담을 줄이는 원료 조합',
    '1,000명 이상의 직장인 후기'
  ],

  // 크리에이티브
  creative_device: '하루의 "마침표"를 찍는 작은 의식',
  hook_patterns: [
    '오늘도 무사히 버틴 당신에게',
    '퇴근 후 딱 5분, 내 몸을 위해 쓰자',
    '내일 아침을 위한 밤 9시 루틴'
  ],

  // 비주얼
  visual_world: {
    color_palette: '밤+네온 (퇴근길 도시 조명)',
    photo_style: '실내 조명 아래 책상/소파 컷',
    layout_motifs: ['루틴 체크리스트', 'ONE DAY 타임라인'],
    hex_colors: ['#1F2937', '#F59E0B', '#10B981']
  },

  // 채널 전략
  channel_strategy: {
    shorts: '퇴근 → 집 → 간식 → 편안한 표정 15초 내',
    instagram_news: '하루 루틴을 뉴스처럼 브리핑하는 톤',
    product_detail: '루틴 스토리 → 성분/근거 → 후기 순서'
  },

  // 가드레일
  guardrails: {
    avoid_claims: ['살 빠진다', '질병 치료', '즉각적인 효과'],
    must_include: ['위에 부담 적음', '퇴근 후 루틴']
  },

  // 기존 호환
  target_audience: '20-30대 직장인 (특히 야근/회식 잦은 이들)',
  tone_and_manner: '공감+위로, 실용적이되 따뜻한',
  keywords: ['퇴근', '루틴', '단백질', '편한', '속'],

  // 메타
  meta: {
    created_by: 'mock_generator',
    created_at: new Date().toISOString(),
    status: 'active'
  }
};

export const mockConceptV1_2: ConceptV1 = {
  // ... (컨셉 2 - "아침 활력 강조" 컨셉)
};

export const mockConceptV1_3: ConceptV1 = {
  // ... (컨셉 3 - "운동 효율 강조" 컨셉)
};

export const mockConceptV1Response: ConceptV1Response = {
  concepts: [mockConceptV1_1, mockConceptV1_2, mockConceptV1_3],
  reasoning: '3가지 서로 다른 시간대/상황별 컨셉을 생성했습니다. 퇴근길, 아침 활력, 운동 후로 차별화.'
};
```

**충돌 위험**: ❌ 없음 (신규 파일)
**시작 조건**: Task #1 완료 (타입 정의 필요)
**예상 시간**: 1시간 (3개 컨셉 각각 20분)

---

#### ✅ Task 3: `useConceptGenerate()` Hook - Mock 모드 (30분) 🟢 P0

**파일**: `frontend/components/canvas-studio/hooks/useConceptGenerate.ts` (신규 생성)

**작업 내용**:
```typescript
import { useState } from 'react';
import type { ConceptV1Response } from '@/types/concept';
import { mockConceptV1Response } from '@/lib/mocks/conceptV1Mock';

/**
 * useConceptGenerate Hook
 *
 * B팀 의존도: 0% (Mock 모드)
 *
 * useMock=true: Mock 데이터 사용 (기본값)
 * useMock=false: 실제 API 호출 (B팀 완료 후)
 */

interface UseConceptGenerateOptions {
  useMock?: boolean; // 👈 Mock/Real API 전환 플래그
}

export function useConceptGenerate(options: UseConceptGenerateOptions = { useMock: true }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResponse, setLastResponse] = useState<ConceptV1Response | null>(null);

  async function generateConcepts(
    prompt: string,
    conceptCount: number = 3,
    brandContext?: string
  ): Promise<ConceptV1Response> {
    setIsLoading(true);
    setError(null);

    try {
      if (options.useMock) {
        // 🟢 Mock 모드 - B팀 작업 불필요
        console.log('[useConceptGenerate] Mock 모드 사용');

        // 1초 대기 (로딩 시뮬레이션)
        await new Promise(resolve => setTimeout(resolve, 1000));

        const response = mockConceptV1Response;
        setLastResponse(response);
        return response;

      } else {
        // 🔴 Real API 모드 - B팀 완료 후 사용
        console.log('[useConceptGenerate] Real API 호출');

        const res = await fetch('http://100.123.51.5:8000/api/v1/concepts/from-prompt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt,
            concept_count: conceptCount,
            brand_context: brandContext
          })
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const response = await res.json();
        setLastResponse(response);
        return response;
      }

    } catch (e: any) {
      setError(e.message);
      throw e;
    } finally {
      setIsLoading(false);
    }
  }

  return { generateConcepts, isLoading, error, lastResponse };
}
```

**충돌 위험**: ❌ 없음 (신규 파일)
**시작 조건**: Task #1, #2 완료
**중요 포인트**:
- 기본값 `useMock: true` → **지금 즉시 동작**
- B팀 완료 후 `useMock: false`로 변경 (2분 작업)

---

#### ✅ Task 4: ConceptBoardView UI 확장 (2-3시간) 🟢 P0

**파일**: `frontend/components/canvas-studio/views/ConceptBoardView.tsx` (수정)

**작업 내용**:
1. ConceptV1 타입 import
2. 새 필드 UI 컴포넌트 추가:
   - Audience Insight 카드
   - Core Promise 배너
   - Reason to Believe 리스트
   - Creative Device 표시
   - Hook Patterns 배지
   - Channel Strategy 탭
   - Guardrails (피할/필수 표현) 뱃지

**충돌 위험**: ⚠️ **낮음** (기존 ConceptBoard 로직은 유지, 새 필드만 추가)
**시작 조건**: Task #1-3 완료
**Git 전략**: 새 브랜치 생성 (`feature/concept-v1-ui`)

---

#### ✅ Task 5: ChatPanel 모드 토글 (1시간) 🟢 P0

**파일**: `frontend/components/canvas-studio/components/ChatPanel.tsx` (수정)

**작업 내용**:
```typescript
// ChatPanel.tsx 상단에 모드 토글 추가

const [generateMode, setGenerateMode] = useState<'concept' | 'copy'>('concept');

// "컨셉 생성" 모드
if (generateMode === 'concept') {
  const { generateConcepts } = useConceptGenerate({ useMock: true });

  const concepts = await generateConcepts(userPrompt);
  // ConceptBoardView로 전달
}

// "카피 생성" 모드 (기존 로직)
if (generateMode === 'copy') {
  const { generate } = useGenerate();

  const result = await generate('product_detail', userPrompt);
  // 기존 Polotno 로직
}
```

**충돌 위험**: ⚠️ **낮음** (기존 로직 유지, 모드만 추가)
**시작 조건**: Task #3 완료 (useConceptGenerate Hook)

---

### 📋 Phase 2: 조율 작업 (30분) 🟡 P1

#### ⚠️ Task 6: `useGenerate()` Hook - ConceptV1 타입 추가 (15분)

**파일**: `frontend/components/canvas-studio/hooks/useGenerate.ts`

**작업 내용**:
```typescript
// ConceptV1 타입을 import (호환성 유지)
import type { ConceptV1 } from '@/types/concept';

// 기존 GenerateResponse에 conceptV1 필드 추가 (optional)
export interface GenerateResponse {
  // ... 기존 필드
  conceptV1?: ConceptV1; // 🆕 추가 (optional - 기존 API 호환)
}
```

**충돌 위험**: ⚠️ **낮음** (타입 추가만, 기존 로직 수정 없음)
**조율 방법**: Slack으로 B팀에 알림 ("useGenerate.ts 타입 추가 예정")

---

#### ⚠️ Task 7: ChatPanel `addGenerateResponseToPolotno()` 개선 (15분)

**파일**: `frontend/components/canvas-studio/components/ChatPanel.tsx`

**작업 내용**:
- 기존 로직 유지 (기존 CopywriterAgent 응답 처리)
- 새 `addConceptV1ToPolotno()` 함수 추가 (ConceptV1 전용)

**충돌 위험**: ⚠️ **낮음** (기존 함수 유지, 새 함수만 추가)
**조율 방법**: Git branch로 독립 작업

---

### 📋 Phase 3: B팀 의존 작업 (5분) 🔴 P2

#### 🔴 Task 8: `useConceptGenerate()` - useMock 플래그 OFF (2분)

**파일**: `frontend/components/canvas-studio/hooks/useConceptGenerate.ts`

**작업 내용**:
```typescript
// Before (Mock 모드)
const { generateConcepts } = useConceptGenerate({ useMock: true });

// After (Real API 모드)
const { generateConcepts } = useConceptGenerate({ useMock: false });
```

**B팀 작업 필요**:
- ✅ `POST /api/v1/concepts/from-prompt` 엔드포인트 완성
- ✅ Mac mini 배포 완료
- ✅ API 테스트 성공

**대기 시간**: 1-2시간 (B팀 작업 시간)

---

#### 🔴 Task 9: 실제 API 연동 테스트 (3분)

**테스트 시나리오**:
1. ChatPanel에서 "단백질 스낵 홍보" 입력
2. "컨셉 생성" 모드 선택
3. Real API 호출 확인
4. ConceptBoardView에 3개 컨셉 표시 확인
5. 모든 새 필드 (audience_insight, hook_patterns 등) 정상 표시 확인

**B팀 작업 필요**: ✅ 모든 Backend 작업 완료

---

## 📊 전체 작업 타임라인

```
시간축:  0h ───────────────── 5-6h ──────── 6-6.5h ──── 8-8.5h ──────→
         ▼                     ▼            ▼          ▼
C팀:    Task 1-5              Phase 1 완료  Phase 2    대기 → Phase 3
        (독립 작업)                         (조율)            (5분)
         ▲                                              ▲
B팀:    [현재: Shorts 작업]                           Task 완료 (1-2h)
                                                        ▼
                                                    API 배포
```

### 병렬 작업 가능 여부

| 시간대 | C팀 작업 | B팀 작업 | 충돌 여부 |
|--------|---------|---------|----------|
| **0-6시간** | Task 1-5 (Mock 기반 UI 개발) | Shorts/Asset 작업 | ✅ **병렬 가능** |
| **6-6.5시간** | Task 6-7 (타입 추가) | ConceptAgent 업그레이드 시작 | ⚠️ **조율 필요** (Slack) |
| **6.5-8시간** | 휴식/대기 | ConceptAgent + API 완성 | ✅ **병렬 가능** |
| **8-8.5시간** | Task 8-9 (플래그 변경 + 테스트) | Mac mini 배포 | ✅ **순차 작업** |

---

## 🎯 권장 실행 계획

### 오늘 (2025-11-27, 목요일)

#### 오전 (지금 즉시)
```
✅ C팀: Task 1-2 시작 (타입 + Mock 데이터)
   - 예상 완료: 1.5시간 후
   - 충돌 위험: 0%

✅ B팀: Shorts/Asset 작업 계속
   - 충돌 위험: 0%
```

#### 오후 (오전 작업 완료 후)
```
✅ C팀: Task 3-5 (Hook + UI + ChatPanel)
   - 예상 완료: 4시간 후
   - 충돌 위험: 0%

⚠️ B팀: ConceptAgent 업그레이드 시작 가능
   - C팀 작업 진행률 공유 (Slack)
   - 충돌 위험: 10% (조율 가능)
```

#### 저녁 (Phase 1 완료 후)
```
⚠️ C팀: Task 6-7 (타입 추가)
   - 예상 완료: 30분
   - B팀에 Slack 알림

🔴 B팀: API 엔드포인트 완성 + 배포
   - 예상 완료: 1-2시간
```

#### 밤 (B팀 완료 후)
```
🔴 C팀: Task 8-9 (플래그 OFF + 테스트)
   - 예상 완료: 5분
   - 전체 통합 테스트
```

---

## ✅ Git 브랜치 전략 (충돌 방지)

### C팀 브랜치
```bash
# Task 1-5: 독립 작업
git checkout -b feature/concept-v1-ui

# Task 6-7: 조율 작업
git checkout -b feature/concept-v1-integration

# Task 8-9: 통합
git checkout -b feature/concept-v1-real-api
```

### B팀 브랜치
```bash
# ConceptAgent 업그레이드
git checkout -b feature/concept-agent-v2

# API 엔드포인트 추가
git checkout -b feature/concept-api
```

### Merge 순서 (충돌 최소화)
```
1. C팀 feature/concept-v1-ui → main (독립적)
2. B팀 feature/concept-agent-v2 → main (독립적)
3. B팀 feature/concept-api → main
4. C팀 feature/concept-v1-real-api → main (B팀 완료 후)
```

---

## 🚨 충돌 발생 시 대응 방안

### Scenario 1: B팀이 `concept.py`를 먼저 수정한 경우

**영향**: ❌ 없음
**이유**: C팀은 Frontend만 수정, Backend 파일 건드리지 않음

---

### Scenario 2: B팀 API 응답 구조가 예상과 다른 경우

**영향**: ⚠️ 중간 (Task 8에서 타입 조정 필요)
**대응**:
1. B팀이 실제 응답 JSON 예시 공유
2. C팀이 `types/concept.ts` 수정 (5분)
3. Mock 데이터도 동일하게 수정 (5분)

**예방책**:
- C팀이 먼저 CONCEPT_SPEC.md 기반 타입 정의
- B팀이 이 타입을 참조해서 API 구현
- → **이미 진행 중** ✅

---

### Scenario 3: C팀과 B팀이 동시에 `ChatPanel.tsx` 수정

**영향**: ⚠️ 낮음 (다른 부분 수정)
**대응**:
- C팀: 새 함수 `addConceptV1ToPolotno()` 추가
- B팀: ChatPanel 건드리지 않을 가능성 높음
- Git merge conflict 발생 시 수동 해결 (10분)

---

## 📞 커뮤니케이션 체크리스트

### C팀 → B팀 알림 포인트

- [ ] Task 1-2 시작 시: "ConceptV1 타입 정의 + Mock 데이터 작업 시작합니다"
- [ ] Task 3-5 시작 시: "UI 개발 진행 중, API는 Mock 사용 중"
- [ ] Task 6-7 시작 시: "⚠️ useGenerate.ts, ChatPanel.tsx 수정 예정 (타입 추가)"
- [ ] Phase 1 완료 시: "✅ Mock 기반 UI 완성, API 준비되면 연동 가능"
- [ ] Task 8 전: "API 엔드포인트 완성되었나요? 테스트 가능한가요?"

### B팀 → C팀 알림 포인트

- [ ] ConceptAgent 작업 시작 시: "ConceptAgent v2.0 업그레이드 시작"
- [ ] API 엔드포인트 완성 시: "✅ POST /from-prompt 완성, 응답 예시: ..."
- [ ] Mac mini 배포 완료 시: "✅ 배포 완료, http://100.123.51.5:8000/api/v1/concepts/from-prompt 사용 가능"

---

## 📈 성공 지표

### C팀 작업 완료 기준

**Phase 1 완료**:
- [ ] ConceptV1 타입 정의 완료
- [ ] Mock 데이터 3개 컨셉 생성 완료
- [ ] useConceptGenerate Hook 동작 (Mock 모드)
- [ ] ConceptBoardView에 모든 새 필드 표시
- [ ] ChatPanel "컨셉 생성" 모드 동작
- [ ] **Mock 데이터로 완전히 동작하는 UI** ✅

**Phase 3 완료** (B팀 완료 후):
- [ ] useMock=false로 전환
- [ ] 실제 API 호출 성공
- [ ] 3개 컨셉 정상 생성 확인
- [ ] 모든 필드 (audience_insight, hook_patterns 등) 정상 표시

---

## 🎉 최종 요약

### C팀 독립 작업 가능 여부: ✅ **95% 가능**

- **5-6시간**: 완전히 독립적 (Mock 기반 UI 개발)
- **30분**: 조율 필요 (Slack 알림만)
- **5분**: B팀 대기 필요 (플래그 변경)

### B팀과의 충돌 위험: ✅ **매우 낮음**

- **파일 충돌**: 거의 없음 (C팀=Frontend, B팀=Backend)
- **타입 불일치**: CONCEPT_SPEC.md로 사전 합의됨
- **병렬 작업**: 완전히 가능

### 권장 시작 시점: ✅ **지금 즉시**

**첫 작업**: Task 1 (TypeScript 타입 정의, 30분)

---

**작성 완료**: 2025-11-27 (목요일)
**다음 단계**: Task 1 시작 (TypeScript 타입 정의)
