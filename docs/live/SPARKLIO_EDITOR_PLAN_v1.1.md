---
title: SPARKLIO_EDITOR_PLAN_v1.1
version: 1.1
status: live
owner_team: A_TEAM
created_at: 2025-11-20
updated_at: 2025-11-20
priority: CRITICAL
tags:
  - editor
  - polotno
  - layerhub
  - frontend
  - llm-integration
---

# SPARKLIO Editor Plan v1.1
Polotno → LayerHub 전환 전략 + 단계별 구현 지침 (A팀용 통합 문서)

## 🚨 최우선 알림
**2025-11-20 결정사항: C팀과 에디터를 Polotno 기반으로 완전 전환하기로 확정**

## 0. v1 → v1.1 변경 사항 요약

이 문서는 기존 `SPARKLIO_EDITOR_PLAN_v1`에 **C팀 보완사항**을 반영한 버전입니다.
핵심 변경점:

1. **환경 설정 / 키 관리** 명시 (`.env.local`, mock 플래그)
2. **에러 바운더리(에디터 전용 ErrorBoundary)** 추가
3. **성능 최적화 / 데이터 마이그레이션 / 테스트 / 에셋 / 협업 / 분석** 항목을
   → Phase 2~3용 **백로그**로 구조화
4. **Editor API / LLM 연동 인터페이스 / AICommand 모델** 명세 추가
5. A/B/C팀 관점에서 **무엇을 지금·나중에 할지**가 명확하도록 우선순위 태그 도입

이 문서는 **A팀 기준 상위 계획 + 정책 문서**이며,
실제 코드 수준 구현 지시서는 C팀용 `DEV_SCRIPT_EDITOR_POL0_v1` 등으로 분리한다.

---

## 1. 프로젝트 목적 및 현재 전략

### 1.1 목적

Sparklio는 "Canva + 마케팅 AI 에이전트"를 지향하는 웹 서비스이다.

핵심 플로우:

1. 사용자가 **브리프 / 회의록 / 브랜드 정보**를 입력하면
2. **LLM + Brand Kit + Meeting AI**가
3. **컨셉보드 / 카드뉴스 / 슬라이드 / 배너**를 자동 제안하고
4. 사용자는 **에디터에서 편집 → Export / 배포**까지 수행

### 1.2 현재 문제 상황

- Konva 기반 `/studio` 에디터는 **초기 상태**에 머물러 있고,
- 에디터 구현 난이도 때문에
  - LLM 플로우
  - Brand Kit / Meeting AI
  - Generator API
  등 전체 시스템의 진도가 막혀 있는 상태.

### 1.3 해결 전략 (요약)

1. **단기 (v1)**
   - Polotno SDK를 이용해 **에디터 v1**을 빠르게 완성
   - `/studio`를 Polotno 기반 Sparklio Studio v1로 전환
   - 전체 마케팅 플로우(LLM / Brand / Meeting AI)를 먼저 살리는 데 집중

2. **중장기 (v2)**
   - LayerHub(오픈소스) 기반 **자체 에디터 v2**를 개발
   - Sparklio 고유 중간 모델(SparklioDocument)을 중심으로
     Polotno → LayerHub로 **엔진 교체가 가능한 구조** 확보

3. **레이어 구조 원칙**
   - **SparklioDocument** = 진짜 데이터/문서 본체
   - Polotno / LayerHub = **뷰 + 편집 엔진**,
     중간 Adapter를 통해 SparklioDocument와 연결

---

## 2. 팀별 역할 (A/B/C)

### 2.1 A팀 (본 문서의 오너)

- 이 문서를 포함한 **Editor 관련 상위 스펙·원칙 관리**
- `docs/live` / `docs/archive` 구조 유지, 버전 관리
- 에디터 계획과
  - SYSTEM_ARCHITECTURE
  - UNIFIED_FEATURE_SPEC
  와의 **연결 관계** 정의
- Phase별 범위 / 우선순위 / 백로그 관리 (특히 v2 기능들)

### 2.2 B팀 (Backend / LLM / API)

- `/api/v1/generate`, `/api/v1/editor/*`, `/api/v1/llm/*` 등
  에디터와 연동되는 백엔드 API 설계 및 구현
- LLM 호출 및 Brand-aware 컨텐츠 생성 로직
- SparklioDocument의 **저장/로드/생성** API 구현
- 에셋 업로드(이미지, 폰트 등) 백엔드 지원

### 2.3 C팀 (Frontend / Editor)

- Polotno 기반 `/studio` v1 구현 (우선순위 1)
- `/studio/polotno`, `/studio/layerhub`, `/studio/konva`
  라우트 구성 및 병렬 실험 환경 구축
- SparklioDocument를 기준으로 한 Adapter 구현
  - SparklioDocument ↔ Polotno
  - (중기) SparklioDocument ↔ LayerHub
- Spark Chat / Meeting AI / Brand Kit UI 패널 통합

---

## 3. 아키텍처 방향 요약

### 3.1 라우트 구조 (3 Editor 동시 실험)

- `/studio`
  - 메인 Sparklio Studio v1 (Polotno 기반)
- `/studio/polotno`
  - Polotno 실험/확장 라우트
- `/studio/layerhub`
  - LayerHub 기반 v2 실험 라우트
- `/studio/konva`
  - 기존 Konva 에디터 "레거시/참고용" 보존 라우트

### 3.2 데이터 모델 (핵심)

```ts
// lib/sparklio/document.ts

export type SparklioElementType = 'text' | 'image' | 'shape' | 'frame';

export interface SparklioElement {
  id: string;
  type: SparklioElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  props: Record<string, any>; // 색, 폰트, 텍스트, 기타 스타일 정보
}

export interface SparklioPage {
  id: string;
  name: string;
  elements: SparklioElement[];
}

export interface SparklioDocument {
  id: string;
  kind: 'concept_board' | 'banner' | 'slide';
  title?: string;
  pages: SparklioPage[];
  brandId?: string;
  createdAt?: string;
  updatedAt?: string;
}
```

- **DB, LLM, Meeting AI, Brand Kit**는 모두 이 모델을 기준으로 동작
- Polotno/LayerHub는 이 모델을 받아 화면에 그리는 **Adapter 레이어**

### 3.3 Adapter 레이어

#### Polotno:

```ts
// lib/sparklio/adapters/polotno-adapter.ts
import type { SparklioDocument } from '../document';

export function sparklioToPolotno(doc: SparklioDocument): any {
  // TODO: SparklioDocument → Polotno project
  return {};
}

export function polotnoToSparklio(polotnoData: any): SparklioDocument {
  // TODO: Polotno project → SparklioDocument
  return {
    id: 'temp',
    kind: 'concept_board',
    title: 'Temp',
    pages: [],
  };
}
```

#### LayerHub (중장기):

```ts
// lib/sparklio/adapters/layerhub-adapter.ts
import type { SparklioDocument } from '../document';

export function sparklioToLayerhub(doc: SparklioDocument): any {
  // TODO: SparklioDocument → LayerHub project
  return {};
}

export function layerhubToSparklio(layerhubData: any): SparklioDocument {
  // TODO: LayerHub project → SparklioDocument
  return {
    id: 'temp',
    kind: 'concept_board',
    title: 'Temp',
    pages: [],
  };
}
```

---

## 4. 환경 설정 / 키 관리 (C팀 보완사항 반영)

### 4.1 .env.local (NOW)

```env
# Polotno SDK 공개 키 (테스트/연습용)
NEXT_PUBLIC_POLOTNO_KEY=your_key_here

# LayerHub 라이선스 키 (현재는 optional, 상용화 단계에서 논의)
NEXT_PUBLIC_LAYERHUB_LICENSE=optional_key

# 개발 단계에서는 Mock API 사용
NEXT_PUBLIC_USE_MOCK_API=true
```

- 실제 프로덕션 키/라이선스 정책은 **A팀 + B팀 + 사업 방향** 논의 후 확정
- v1.1의 초점은 **학원 발표 + 내부 프로토타입**이며, 상용화는 v2 단계에서 별도 검토

---

## 5. 에디터 오류 방지: Error Boundary (NOW)

에디터 영역은 외부 SDK(Polotno/LayerHub)를 사용하므로,
JS 에러 발생 시 전체 앱이 죽지 않도록 **전용 ErrorBoundary**를 둔다.

```tsx
// components/editor/EditorErrorBoundary.tsx
'use client';

import React from 'react';

interface EditorErrorBoundaryProps {
  children: React.ReactNode;
}

interface EditorErrorBoundaryState {
  hasError: boolean;
}

export class EditorErrorBoundary
  extends React.Component<EditorErrorBoundaryProps, EditorErrorBoundaryState>
{
  state: EditorErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(_: Error): EditorErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error('Editor crashed:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full items-center justify-center bg-neutral-900 text-neutral-300">
          <div className="text-center">
            <p className="text-sm font-medium">
              에디터가 예기치 않게 중단되었습니다.
            </p>
            <p className="mt-2 text-xs text-neutral-500">
              페이지를 새로고침한 후 다시 시도해주세요.
            </p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
```

- C팀은 `/studio`와 각 실험 라우트(Polotno/LayerHub)에서 에디터 영역을 이 컴포넌트로 감싸도록 구현
- A팀은 "에디터 크래시 시 UX"에 대한 최소 가이드만 관리

---

## 6. Editor API / LLM 연동 인터페이스 (NOW)

### 6.1 EditorAPI 인터페이스

```ts
// lib/api/editor.ts
import type { SparklioDocument } from '@/lib/sparklio/document';

export interface EditorAPI {
  saveDocument(doc: SparklioDocument): Promise<void>;
  loadDocument(id: string): Promise<SparklioDocument>;
  generateFromPrompt(prompt: string): Promise<SparklioDocument>;
}
```

- **B팀 책임 범위**: 실제 구현: REST/GraphQL/Mock 중 택1
- **C팀 책임 범위**: 초기에는 `NEXT_PUBLIC_USE_MOCK_API=true` 상태에서 `EditorAPI`를 mock 구현으로 사용
- **A팀 역할**: EditorAPI가 SYSTEM_ARCHITECTURE / GENERATORS_SPEC와 모순 없이 정렬되도록 검토

### 6.2 AICommand / LLM 패널 인터페이스

```ts
// lib/sparklio/ai.ts
import type { SparklioDocument } from './document';

export type AICommandType = 'generate' | 'modify' | 'suggest';

export interface AICommand {
  type: AICommandType;
  prompt: string;
  context?: SparklioDocument;
}
```

- Spark Chat / Meeting AI / Brand Kit와 에디터가 상호작용할 때 **공통적으로 사용하는 명령 모델**
- 예시:
  - `generate`: "이 브리프로 카드뉴스를 새로 만들어줘"
  - `modify`: "이 타이틀을 더 강렬하게 바꿔줘"
  - `suggest`: "이 배너에서 바꿔야 할 부분 3가지만 추천해줘"

---

## 7. 테스트 전략 (NOW: 뼈대 / LATER: 실제 케이스)

C팀 제안에 따라, 초기에는 **테스트 파일 뼈대만 생성**하고 실제 테스트 케이스는 Phase 2 이후 확장한다.

### 7.1 테스트 파일 구조 제안

```txt
frontend/
  __tests__/
    adapters/
      polotno-adapter.test.ts
      layerhub-adapter.test.ts
      document-validation.test.ts
```

- **Phase 1 (지금)**: 파일 + 기본 스켈레톤만 생성, TODO 주석 추가
- **Phase 2**: 주요 컨버전/검증 로직에 대한 테스트 케이스 추가

---

## 8. 백로그 (Phase 2~3에서 다룰 항목들)

이 섹션은 **A팀이 관리하는 백로그**이며, v1.1에서는 "구조를 정의만 하고 실제 구현은 나중"에 진행한다.

### 8.1 성능 최적화 (BACKLOG)

- 큰 디자인 파일 처리 최적화 아이디어:
  - 이미지 lazy loading
  - 캔버스 가상화 (viewport 내 객체만 렌더링)
  - 저장 작업 debounce/throttle
- A팀 할 일: 향후 에디터 사용 로그/성능 데이터 기반으로 어떤 최적화부터 적용할지 우선순위 설정

### 8.2 Konva → SparklioDocument 마이그레이션 (BACKLOG)

```ts
// lib/sparklio/migration.ts
import type { SparklioDocument } from './document';

export function migrateKonvaToSparklio(konvaData: any): SparklioDocument {
  // TODO: 기존 Konva 데이터를 SparklioDocument로 변환
  return {
    id: 'legacy',
    kind: 'concept_board',
    title: 'Migrated from Konva',
    pages: [],
  };
}
```

- 현재는 `/studio/konva`를 "레거시 뷰어"로만 사용
- 실제 마이그레이션이 필요해질 경우에만 이 함수 구현 확대

### 8.3 에셋 관리 전략 (BACKLOG)

```ts
// lib/assets/manager.ts
export interface AssetManager {
  uploadImage(file: File): Promise<string>; // URL or ID
  listImages(): Promise<string[]>;
  // TODO: fonts, templates, brand assets
}
```

- 이미지 업로드(S3/Cloudinary/MinIO 등)
- 폰트 관리
- 템플릿 저장소
- Brand Kit 관련 에셋 구조

### 8.4 실시간 협업 대비 (Optional BACKLOG)

```ts
// lib/collab/adapter.ts
import type { SparklioDocument } from '@/lib/sparklio/document';

export interface CollaborationAdapter {
  connect(documentId: string): void;
  onUpdate(callback: (doc: SparklioDocument) => void): void;
  broadcast(changes: any): void;
}
```

- 향후 WebSocket / CRDT / Liveblocks 등 도입 시 사용
- v1.1에서는 설계 레벨에서만 고려, 구현은 보류

### 8.5 모니터링 / 분석 (BACKLOG)

```ts
// lib/analytics/editor-analytics.ts
export interface EditorAnalytics {
  trackEvent(name: string, payload?: Record<string, any>): void;
  trackError(error: Error, context?: Record<string, any>): void;
  trackPerformance(metric: string, value: number): void;
}
```

- 사용자 행동 추적 (어떤 기능을 얼마나 쓰는지)
- 에디터 크래시/에러 로깅 (Sentry 연동 등)
- 로딩 시간, 렌더링 성능 지표 수집

---

## 9. Phase / 우선순위 정리 (A팀용 표)

| 항목 | 우선순위 | Phase | 담당 | 비고 |
|------|---------|--------|-------|------|
| **`/studio` Polotno 메인 전환** | **🔴 CRITICAL** | **0-1** | **C** | **최우선 과제** |
| `/studio/polotno`, `/studio/layerhub`, `/studio/konva` 라우트 구성 | NOW | 0 | C | 3 Editor 병행 실험 구조 |
| SparklioDocument 모델 정의 | NOW | 1 | A/B/C | 전체 시스템 공통 모델 |
| Polotno Adapter 뼈대 | NOW | 1 | C | 변환 로직은 점진 구현 |
| EditorErrorBoundary | NOW | 1 | C | 최소한의 안정성 확보 |
| EditorAPI 인터페이스 | NOW | 1 | A/B | 구현은 B, 사용은 C |
| AICommand 인터페이스 | NOW | 1 | A/B/C | Spark Chat/Meeting AI 축 |
| LayerHub Adapter 뼈대 | LATER | 3 | C | v2용 실험 |
| 성능 최적화 (lazy load 등) | LATER | 2-3 | B/C | 사용 패턴 보고 결정 |
| Konva → Sparklio 마이그레이션 | LATER | 2-3 | C | 필요 시에만 |
| 에셋 관리(이미지/폰트/템플릿) | LATER | 2-3 | B/C | 백엔드/프론트 협업 |
| 실시간 협업 어댑터 | LATER | 3+ | B/C | 선택적 기능 |
| Analytics / Sentry 연동 | LATER | 2-3 | B/C | 운영 단계에서 중요 |

---

## 10. A팀 To-Do (v1.1 기준)

### 즉시 실행 (2025-11-20)

1. ✅ 이 문서를 `docs/live/SPARKLIO_EDITOR_PLAN_v1.1.md`로 저장
2. 기존 v1 문서가 있다면 `docs/archive/`로 이동
3. SYSTEM_ARCHITECTURE / UNIFIED_FEATURE_SPEC에 "Editor 구현은 SPARKLIO_EDITOR_PLAN_v1.1 참조" 링크 추가

### C팀 전달사항

- v1.1에서 **NOW**로 표시된 항목을 기준으로
- 특히 **`/studio` Polotno 메인 전환**을 최우선으로
- `DEV_SCRIPT_EDITOR_POL0_v1` (또는 유사 명칭)의 실행용 지시서 생성 요청

### B팀 전달사항

- `EditorAPI`, `AICommand`, `SparklioDocument`를 백엔드 스키마/엔드포인트에 반영 요청

### 백로그 관리

- 백로그 항목(8장)은 별도 `BACKLOG_EDITOR_V2.md`로 분리 생성 예정
- 이 문서에서는 링크만 유지

이로써 A팀 관점에서 **에디터 전략, 우선순위, 문서 경로, 팀 간 인터페이스**가 v1.1 기준으로 정리된 상태를 유지한다.

---

## 📌 결정 사항 기록

### 2025-11-20 에디터 전환 결정

- **결정 내용**: C팀과 협의하여 Konva 기반 에디터를 **Polotno 기반으로 완전 전환**
- **배경**:
  - Konva 에디터 구현 복잡도로 전체 프로젝트 진행 차질
  - LLM/Brand Kit/Meeting AI 통합 지연
  - 학원 발표 데드라인 임박
- **액션 아이템**:
  - C팀: Polotno SDK 즉시 도입 및 `/studio` 전환
  - B팀: EditorAPI 백엔드 구현
  - A팀: 문서화 및 프로젝트 관리
- **목표**: 2주 내 작동하는 에디터 v1 완성

---

**문서 끝**