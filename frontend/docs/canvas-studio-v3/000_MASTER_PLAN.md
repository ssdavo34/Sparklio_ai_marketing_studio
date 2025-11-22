# Canvas Studio v3.1 - Polotno 기반 에디터 마스터 플랜

> **작성일**: 2025-11-22
> **작성자**: C팀 (Frontend Team)
> **프로젝트**: Sparklio Canvas Studio v3.1 Migration to Polotno
> **상태**: 🟢 Active Development

---

## 📋 목차

1. [프로젝트 개요](#프로젝트-개요)
2. [기술 스택 변경](#기술-스택-변경)
3. [아키텍처 설계](#아키텍처-설계)
4. [구현 로드맵](#구현-로드맵)
5. [타팀 협조 사항](#타팀-협조-사항)
6. [리스크 관리](#리스크-관리)

---

## 프로젝트 개요

### 🎯 목표

**Polotno SDK를 Canvas 엔진으로 사용하면서도, Sparklio만의 VSCode 스타일 UI/UX를 유지하는 하이브리드 에디터 구축**

### 🔑 핵심 결정 사항

| 항목 | 기존 계획 (v3.0) | 변경 후 (v3.1) |
|------|-----------------|---------------|
| **Canvas 엔진** | Fabric.js + Konva | **Polotno SDK** |
| **상태 관리** | Zustand (Canvas 상태) | **Zustand (UI) + Polotno Store (Canvas)** |
| **UI 레이아웃** | VSCode 스타일 | **동일 유지** |
| **에이전트 연동** | Canvas API 직접 호출 | **Command Bridge 패턴** |

### 📊 예상 효과

| 지표 | 예상 개선 |
|------|----------|
| 개발 기간 | **60% 단축** (3개월 → 1개월) |
| 코드 안정성 | **+80%** (Polotno 검증된 엔진) |
| 기능 완성도 | **+150%** (Undo/Redo, 히스토리, 단축키 기본 제공) |
| 유지보수 비용 | **-70%** (Canvas 로직 외부화) |

---

## 기술 스택 변경

### Before & After

```diff
# Canvas Rendering Engine
- Fabric.js / Konva (직접 구현)
+ Polotno SDK (통합 솔루션)

# State Management
- Zustand (모든 상태)
+ Zustand (UI/Layout) + Polotno Store (Canvas)

# 개발 복잡도
- High (모든 기능 직접 구현)
+ Medium (Polotno API 활용)
```

### Polotno SDK 선택 이유

#### ✅ 장점

1. **즉시 사용 가능한 고급 기능**
   - 다중 페이지/레이어 관리
   - Undo/Redo 히스토리
   - 텍스트/이미지/도형 편집
   - 키보드 단축키
   - 정렬/분포/그룹화

2. **안정성 검증**
   - 수천 개 프로젝트에서 사용 중
   - 정기 업데이트 및 버그 수정
   - TypeScript 지원

3. **확장성**
   - 커스텀 요소 추가 가능
   - 플러그인 시스템
   - API를 통한 외부 제어

#### ⚠️ 제약 사항

1. **라이선스 비용**
   - 개발: 무료 (워터마크)
   - 프로덕션: 유료 ($99/월~)

2. **커스터마이징 한계**
   - Polotno가 지원하지 않는 기능은 직접 구현 필요
   - 일부 내부 동작 수정 제한

3. **번들 크기**
   - Polotno SDK ~500KB
   - 초기 로딩 시간 고려 필요

---

## 아키텍처 설계

### 전체 구조도

```
┌─────────────────────────────────────────────────────────┐
│                    Top Toolbar (48px)                    │
├────┬────────────────────────────────────────────────┬────┤
│ A  │  Left Panel (280px)    │  Canvas Viewport    │ R  │
│ c  ├────────────────────────┤                      │ i  │
│ t  │ - Pages Panel          │  ┌────────────────┐  │ g  │
│ i  │ - Layers Panel         │  │                │  │ h  │
│ v  │ - Templates Panel      │  │   Polotno      │  │ t  │
│ i  │                        │  │   Workspace    │  │    │
│ t  │ (Collapsible)          │  │                │  │ D  │
│ y  │                        │  │   (Canvas)     │  │ o  │
│    │                        │  │                │  │ c  │
│ B  │                        │  └────────────────┘  │ k  │
│ a  │                        │                      │    │
│ r  │                        │  Zoom Controls       │ 3  │
│    │                        │                      │ 6  │
│ 5  │                        │                      │ 0  │
│ 6  │                        │                      │ p  │
│ p  │                        │                      │ x  │
│ x  │                        │                      │    │
└────┴────────────────────────┴──────────────────────┴────┘
```

### 폴더 구조

```
frontend/
├── components/
│   ├── canvas-studio/           # 🆕 새 v3.1 에디터
│   │   ├── layout/
│   │   │   ├── StudioLayout.tsx
│   │   │   ├── TopToolbar.tsx
│   │   │   ├── ActivityBar.tsx
│   │   │   ├── LeftPanel.tsx
│   │   │   ├── RightDock.tsx
│   │   │   └── CanvasViewport.tsx
│   │   ├── polotno/
│   │   │   ├── PolotnoWorkspace.tsx       # Polotno 래퍼
│   │   │   ├── polotnoStoreBridge.ts      # Bridge Layer
│   │   │   └── commands/
│   │   │       ├── applyAiCommand.ts
│   │   │       └── templateCommands.ts
│   │   ├── stores/
│   │   │   ├── useEditorStore.ts
│   │   │   ├── useLayoutStore.ts
│   │   │   ├── useCanvasStore.ts
│   │   │   └── useTabsStore.ts
│   │   ├── panels/
│   │   │   ├── left/
│   │   │   │   ├── PagesPanel.tsx
│   │   │   │   ├── LayersPanel.tsx
│   │   │   │   └── TemplatesPanel.tsx
│   │   │   └── right/
│   │   │       ├── ChatTab.tsx
│   │   │       ├── InspectorTab.tsx
│   │   │       ├── LayersTab.tsx
│   │   │       ├── DataTab.tsx
│   │   │       └── BrandTab.tsx
│   │   └── ai/
│   │       ├── SparkChatPanel.tsx
│   │       └── agentsBridge.ts
│   └── polotno-studio/          # 기존 POC (보존)
├── app/
│   └── studio/
│       ├── v3/                  # 🆕 새 에디터 라우트
│       │   └── page.tsx
│       └── polotno/             # 기존 라우트 (백업)
│           └── page.tsx
└── docs/
    └── canvas-studio-v3/        # 🆕 프로젝트 문서
        ├── 000_MASTER_PLAN.md
        ├── 001_TECHNICAL_SPEC.md
        ├── 002_BLOCK_IMPLEMENTATION.md
        └── 003_TEAM_COORDINATION.md
```

### 데이터 플로우

```
┌──────────────────┐
│   User Action    │
└────────┬─────────┘
         │
         ↓
┌──────────────────┐      ┌──────────────────┐
│  Sparklio UI     │ ←──→ │  Zustand Store   │
│  (Our Custom)    │      │  (UI/Layout)     │
└────────┬─────────┘      └──────────────────┘
         │
         │ Commands
         ↓
┌──────────────────┐
│  Bridge Layer    │  ← Canvas Commands Interface
└────────┬─────────┘
         │
         ↓
┌──────────────────┐      ┌──────────────────┐
│  Polotno Store   │ ←──→ │  Polotno Canvas  │
│  (Canvas State)  │      │  (Rendering)     │
└──────────────────┘      └──────────────────┘
```

### 핵심 설계 원칙

#### 1. **관심사의 분리 (Separation of Concerns)**

```typescript
// ✅ Good: UI와 Canvas 로직 분리
// UI Layer (Sparklio)
const handleZoomIn = () => {
  useCanvasStore.getState().zoomIn();
};

// Canvas Layer (Polotno)
zoomIn: () => {
  const { polotnoStore, zoom } = get();
  const newZoom = zoom + 0.1;
  set({ zoom: newZoom });
  polotnoStore?.setZoom(newZoom);
}
```

#### 2. **Command Pattern으로 AI 연동**

```typescript
// AI Agent → Canvas Commands → Polotno
type CanvasCommand =
  | { type: 'add-text'; text: string; style?: any }
  | { type: 'replace-image'; elementId: string; url: string }
  | { type: 'apply-brand'; brandId: string };

// Bridge가 변환
function applyCommandsToPolotno(commands: CanvasCommand[], store: any) {
  // Polotno API 호출
}
```

#### 3. **Singleton Pattern으로 Store 관리**

```typescript
// Polotno Store는 앱 전체에서 하나만 존재
let polotnoStoreSingleton: any | null = null;

export function PolotnoWorkspace() {
  useEffect(() => {
    if (!polotnoStoreSingleton) {
      polotnoStoreSingleton = createStore({
        key: process.env.NEXT_PUBLIC_POLOTNO_API_KEY!,
      });
    }
  }, []);
}
```

---

## 구현 로드맵

### 전체 타임라인

```
Week 1: Block 1-3 (기초 인프라 + Polotno 통합 + 레이아웃)
Week 2: Block 4-5 (Left Panel + Right Dock)
Week 3: Block 6-7 (Mode System + AI Agent)
Week 4: 테스트 & 최적화
```

### Block별 상세 계획

#### 📦 Block 1: 기초 인프라 (1-2시간)

**목표**: 프로젝트 구조 생성 및 라우팅 설정

**할 일**:
- [ ] `components/canvas-studio/` 폴더 구조 생성
- [ ] `stores/` 빈 스켈레톤 생성
- [ ] `app/studio/v3/page.tsx` 생성
- [ ] 라우팅 테스트

**완료 조건**:
- `/studio/v3` 접속 시 "Hello World" 표시
- 기존 `/studio/polotno`는 정상 동작

**예상 이슈**: 없음

---

#### 📦 Block 2: Polotno Workspace Wrapper (2-3시간)

**목표**: Polotno SDK를 Canvas Viewport에 통합

**할 일**:
- [ ] `PolotnoWorkspace.tsx` 구현
- [ ] `useCanvasStore`에 `polotnoStore` 참조 추가
- [ ] `CanvasViewport`에서 PolotnoWorkspace 렌더링
- [ ] API 키 하드코딩 → 환경변수 전환 시도

**완료 조건**:
- `/studio/v3`에서 Polotno 캔버스 표시
- 텍스트/이미지 추가 가능
- 콘솔에 API 키 관련 에러 없음

**예상 이슈**:
- ⚠️ 환경변수 문제 재발 가능 → 하드코딩 우선 사용

---

#### 📦 Block 3: 기본 레이아웃 (3-4시간)

**목표**: VSCode 스타일 레이아웃 골격 구현

**할 일**:
- [ ] `StudioLayout.tsx` (Flexbox 구조)
- [ ] `TopToolbar.tsx` (제목 + 저장 버튼)
- [ ] `ActivityBar.tsx` (모드 아이콘만)
- [ ] `LeftPanel.tsx` (빈 패널)
- [ ] `RightDock.tsx` (빈 패널)
- [ ] `useLayoutStore` 구현 (패널 너비/접기)

**완료 조건**:
- VSCode 스타일 레이아웃 표시
- 패널 리사이즈 동작
- Polotno 캔버스가 중앙에 정상 표시

**예상 이슈**:
- ⚠️ 높이 계산 오류 → `h-screen`, `h-full` 명시적 사용

---

#### 📦 Block 4: Left Panel - Pages (2-3시간)

**목표**: 페이지 목록 및 관리 기능

**할 일**:
- [ ] `PagesPanel.tsx` 구현
- [ ] Polotno `store.pages` 구독
- [ ] 페이지 추가/삭제/선택 UI
- [ ] 썸네일 표시 (선택사항)

**완료 조건**:
- 페이지 목록 표시
- 페이지 추가 시 캔버스에 반영
- 페이지 선택 시 캔버스 전환

**예상 이슈**: 없음

---

#### 📦 Block 5: Right Dock - Inspector (2-3시간)

**목표**: 선택된 요소 속성 편집

**할 일**:
- [ ] `InspectorTab.tsx` 구현
- [ ] `store.selectedElements` 구독
- [ ] 기본 속성 편집 UI (위치, 크기, 회전)
- [ ] 속성 변경 시 Polotno 업데이트

**완료 조건**:
- 요소 선택 시 Inspector 표시
- 속성 변경 시 캔버스 실시간 반영

**예상 이슈**: 없음

---

#### 📦 Block 6: Mode System (2-3시간)

**목표**: Activity Bar 모드 전환 기능

**할 일**:
- [ ] Activity Bar 버튼 동작 구현
- [ ] `useEditorStore`에 `currentMode` 추가
- [ ] `applyModePreset()` 구현 (캔버스 사이즈 변경)
- [ ] 모드별 아이콘 추가

**완료 조건**:
- 모드 전환 시 캔버스 사이즈 변경
- 각 모드별 프리셋 적용

**예상 이슈**: 없음

---

#### 📦 Block 7: AI Agent Bridge (3-4시간)

**목표**: Spark Chat과 Canvas 연동

**할 일**:
- [ ] `CanvasCommand` 타입 정의
- [ ] `applyCommandsToPolotno()` 구현
- [ ] `ChatTab` 테스트 UI (간단한 명령)
- [ ] "텍스트 추가" 명령 테스트

**완료 조건**:
- 채팅에서 "텍스트 추가해줘" 입력 시 캔버스에 텍스트 생성
- 명령 로그 출력

**예상 이슈**:
- ⚠️ LLM 응답 파싱 → 우선 하드코딩 명령으로 테스트

---

## 타팀 협조 사항

### 🔴 A팀 (QA) 요청사항

#### 1. 테스트 환경 준비
- **요청**: `/studio/v3` 라우트 테스트 계정 생성
- **기한**: Block 3 완료 후 (1주차 말)
- **비고**: 기존 `/studio/polotno`와 분리된 환경

#### 2. Polotno 무료 버전 제약 확인
- **요청**: 워터마크, 기능 제한 사항 문서화
- **기한**: Block 2 완료 후
- **비고**: 프로덕션 배포 전 유료 전환 필요 여부 판단

### 🔵 B팀 (Backend) 요청사항

#### 1. Canvas State 저장 API 검토
- **요청**: Polotno JSON 포맷으로 저장 가능한지 확인
- **기한**: Block 5 완료 후 (2주차 말)
- **샘플 데이터**:
```json
{
  "version": "1.0",
  "pages": [
    {
      "id": "page1",
      "width": 1920,
      "height": 1080,
      "children": [...]
    }
  ]
}
```

#### 2. Brand Kit API 연동
- **요청**: Brand 색상/폰트 데이터 제공 API
- **기한**: Block 7 시작 전 (3주차 초)
- **필요 데이터**:
  - 브랜드 컬러 팔레트
  - 브랜드 폰트 목록
  - 로고 에셋 URL

---

## 리스크 관리

### 🔴 High Risk

#### 1. 환경변수 로드 문제
**증상**: `process.env.NEXT_PUBLIC_POLOTNO_API_KEY`가 빌드 시 `undefined`
**영향**: Polotno 초기화 실패
**완화 계획**:
- 단기: API 키 하드코딩 사용
- 중기: Next.js 환경변수 로드 메커니즘 재검토
- 장기: 서버사이드에서 키 주입 방식 검토

#### 2. Polotno 무료 버전 제약
**증상**: 워터마크, 일부 기능 제한
**영향**: 클라이언트 데모 시 전문성 저하
**완화 계획**:
- 단기: 무료 버전으로 개발 진행
- 중기: 프로덕션 배포 전 유료 플랜 구매 ($99/월)
- 장기: 자체 엔진 전환 검토 (6개월 후)

### 🟡 Medium Risk

#### 3. 성능 이슈 (번들 크기)
**증상**: Polotno SDK ~500KB, 초기 로딩 느림
**영향**: 사용자 경험 저하
**완화 계획**:
- Code Splitting: Dynamic Import 사용
- Lazy Loading: 에디터 진입 시에만 로드
- CDN 활용: Polotno 캐싱

#### 4. TypeScript 타입 불일치
**증상**: Polotno API 타입 정의 부족
**영향**: 개발 생산성 저하
**완화 계획**:
- `@types/polotno` 커스텀 타입 정의
- `any` 타입 최소화, 점진적 타입 추가

### 🟢 Low Risk

#### 5. UI/UX 일관성
**증상**: Polotno 기본 UI와 Sparklio UI 충돌
**영향**: 사용자 혼란
**완화 계획**:
- Polotno UI 완전 숨김 (Canvas만 표시)
- Sparklio 커스텀 UI로 모든 기능 제공

---

## 성공 지표 (KPI)

### 개발 진행률
- [ ] Block 1-3 완료: 1주차 말
- [ ] Block 4-5 완료: 2주차 말
- [ ] Block 6-7 완료: 3주차 말
- [ ] 테스트 & 배포: 4주차 말

### 품질 지표
- **버그 수**: < 5개 (Critical)
- **TypeScript 에러**: 0개
- **테스트 커버리지**: > 60% (핵심 기능)
- **성능**: 초기 로딩 < 3초

### 비즈니스 지표
- **개발 비용**: 기존 계획 대비 60% 절감
- **유지보수 시간**: 주당 < 4시간
- **기능 완성도**: v3.0 대비 150% 향상

---

## 다음 단계

1. ✅ 마스터 플랜 승인
2. ⏭️ 기술 스펙 문서 작성 (`001_TECHNICAL_SPEC.md`)
3. ⏭️ 타팀 협조 요청서 발송 (`003_TEAM_COORDINATION.md`)
4. ⏭️ Block 1 구현 시작

---

**문서 버전**: v1.0
**최종 수정**: 2025-11-22
**다음 리뷰**: 2025-11-25 (Block 3 완료 후)
