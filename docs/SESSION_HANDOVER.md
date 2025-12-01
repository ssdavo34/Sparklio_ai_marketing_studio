# 세션 인수인계 (2025-12-01 기준)

> **다음 Claude는 이 파일과 CLAUDE.md를 먼저 읽으세요**

---

## 현재 상태

- **브랜치**: `feature/editor-migration-polotno`
- **최신 커밋**: `4602781` - Canvas Size Preset UI (SNS, Presentation, Video)
- **Mac Mini 배포**: ❌ 미배포 (새 커밋 있음)
- **서버 상태**: ✅ healthy

---

## 오늘 완료한 작업 (2025-12-01)

### C팀 - Canvas Size Preset UI (4602781)

**SNS, Presentation, Video 탭에 캔버스 크기 프리셋 UI 추가:**

1. **SNSTab**: 플랫폼별 크기 템플릿 선택 시 캔버스 자동 변경
   - Instagram, Facebook, Twitter, LinkedIn, YouTube 템플릿
   - 사용자 정의 크기 입력 지원

2. **PresentationTab**: 슬라이드 비율 선택 UI
   - 16:9 와이드 (1920×1080)
   - 4:3 표준 (1024×768)
   - 9:16 세로 (모바일)

3. **VideoTab**: 영상 비율 선택 UI
   - 9:16 세로 (쇼츠, 릴스)
   - 16:9 가로 (YouTube)
   - 1:1 정사각 (Instagram)

---

### C팀 - Multi-Canvas Architecture Phase 1 (5f5572e)

**문제점 해결:**
- 모든 탭(Brand DNA, Meeting AI, ConceptBoard 등)이 하나의 캔버스를 공유하여 컨텐츠 혼합됨
- 예: Brand DNA 분석 결과와 Presentation 슬라이드가 같은 캔버스에 표시

**구현 내용:**

1. **CanvasType 정의** (`types.ts`)
   - 8개 캔버스 타입: brand-dna, meeting, concept, presentation, detail, sns, video, image
   - 각 타입별 기본 크기 및 프리셋 설정 (CANVAS_CONFIGS)

2. **useCanvasStore 멀티캔버스 지원** (`useCanvasStore.ts`)
   - `canvases: Map<CanvasType, StoreType>` 구조
   - `activeCanvasType` 상태 추가
   - `getCanvas()`, `setCanvas()`, `setActiveCanvas()`, `getActiveCanvas()` 액션
   - Selector: `selectActivePolotnoStore`, `selectCanvasByType`

3. **polotnoStoreSingleton 멀티캔버스 지원** (`polotnoStoreSingleton.ts`)
   - 기존 싱글톤 → 캔버스 타입별 Store 관리
   - `getOrCreateCanvasStore(type, apiKey)` 새 API

4. **PolotnoWorkspace 동적 렌더링** (`PolotnoWorkspace.tsx`)
   - `activeCanvasType` 변경 시 해당 캔버스로 자동 전환

5. **탭-캔버스 자동 연결** (`useLeftPanelStore.ts`)
   - `TAB_TO_CANVAS_MAP`: 탭별 캔버스 매핑
   - `setActiveTab()` 호출 시 자동으로 `setActiveCanvas()` 호출

6. **polotnoStore 참조 업데이트** (20+ 파일)
   - 모든 `state.polotnoStore` → `state.canvases.get(state.activeCanvasType)` 변경

### 이전 완료 작업 (Brand DNA 분석 개선)

- Brand DNA 분석 품질 개선 (문서 내용 기반 분석)
- Brand DNA 탭 전환 시 유지 (sharedBrandDNA)
- 문서 선택 변경 시 결과 숨김
- 익명 브랜드 분석 지원

---

## 🔴 다음에 반드시 수정해야 할 사항 (PENDING TASKS)

### P0 - Multi-Canvas Architecture Phase 2

**Backend 작업 (B팀):**
1. **BrandDNA에 document_ids 추가**
   - `backend/app/schemas/brand_analyzer.py`에 `document_ids: list[str]` 필드 추가
   - 분석 시 사용된 문서 ID들 저장

2. **Document에 project_id 추가**
   - `backend/app/models/document.py`에 `project_id: str | None` 필드 추가
   - 문서가 속한 프로젝트 연결 (null = "기타")

**Frontend 작업 (C팀):**
1. **문서별 분석 이력 필터링**
   - 선택된 문서에 해당하는 분석 이력만 표시
   - 이력에 분석 문서 이름 표시

2. ~~**SNS/Presentation 크기 프리셋 UI** (P1)~~ ✅ 완료 (4602781)
   - SNS, Presentation, Video 탭에 프리셋 UI 추가됨

**관련 설계 문서:** `docs/ARCHITECTURE_REDESIGN_PLAN.md`

---

## 알려진 이슈

| 이슈 | 상태 | 비고 |
|------|------|------|
| Brand DNA 이력-문서 연결 | 🔴 미구현 | Phase 2에서 구현 |
| Multi-Canvas Mac Mini 배포 | ❌ 미배포 | git pull 필요 |
| Alembic multiple heads | ⚠️ 존재 | `demo_20251126`과 `2025_11_30_project_outputs` 두 head |
| Video6 In-Memory Storage | ⚠️ MVP | 추후 DB로 이관 필요 |

---

## 다음 작업 우선순위

### P0 (Critical)
1. **Mac Mini 배포**: Multi-Canvas 커밋 배포
2. **E2E 테스트**: 탭 전환 시 캔버스 분리 확인
3. **Backend Phase 2**: document_ids, project_id 추가

### P1 (High)
4. ~~**SNS 크기 프리셋 UI**~~ ✅ 완료
5. **문서-분석 이력 연결**: BrandKitTab UI 개선

### P2 (Medium)
6. **Video Pipeline V2 E2E 테스트**
7. **레거시 에셋 마이그레이션**

---

## 주요 파일 위치

| 파일 | 용도 |
|------|------|
| `docs/ARCHITECTURE_REDESIGN_PLAN.md` | 멀티캔버스 설계 문서 |
| `frontend/components/canvas-studio/stores/types.ts` | CanvasType, CANVAS_CONFIGS |
| `frontend/components/canvas-studio/stores/useCanvasStore.ts` | 멀티캔버스 Store |
| `frontend/components/canvas-studio/stores/useLeftPanelStore.ts` | 탭-캔버스 매핑 |
| `frontend/components/canvas-studio/polotno/PolotnoWorkspace.tsx` | 캔버스 렌더링 |
| `frontend/components/canvas-studio/polotno/polotnoStoreSingleton.ts` | 캔버스 타입별 Store 관리 |

---

## 중요 명령어

```bash
# Mac Mini 배포
ssh woosun@100.123.51.5 "cd ~/sparklio_ai_marketing_studio && git pull origin feature/editor-migration-polotno"
ssh woosun@100.123.51.5 "/usr/local/bin/docker compose -f ~/sparklio_ai_marketing_studio/docker/mac-mini/docker-compose.yml restart backend"

# 헬스체크
curl http://100.123.51.5:8000/health
```

---

**마지막 업데이트**: 2025-12-01 by C팀
