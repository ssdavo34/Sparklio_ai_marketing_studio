# 아키텍처 재설계 계획서

> **작성일**: 2025-12-01
> **작성자**: C팀
> **우선순위**: P0 (데모데이 전 필수)
> **최종 수정**: 2025-12-01 (캔버스 크기, 에디터 기능 추가)

---

## 1. 현재 문제점

### 1.1 캔버스 동기화 문제
- **Single Canvas**: `useCanvasStore`의 `polotnoStore`가 전역 싱글톤
- 모든 탭(Brand DNA, Detail Page, Instagram, Video 등)이 같은 캔버스 공유
- **결과**: Brand DNA → 1페이지, Detail Page → 2-3페이지... 혼합됨

### 1.2 문서-분석 연결 부재
- Brand DNA 분석 이력이 브랜드 단위로만 저장
- 어떤 문서로 분석했는지 기록 안됨
- 다른 문서 선택해도 이전 분석 이력 그대로 표시

### 1.3 프로젝트-문서 연결 부재
- 업로드한 문서들이 프로젝트별로 분류되지 않음
- 모든 문서가 한 곳에 섞여 있음

### 1.4 메뉴별 기능 미연결
- ActivityBar 메뉴들(12개)이 UI만 존재
- 대부분 백엔드/데이터와 실제 연결 안됨

### 1.5 에디터 기능 제한 (P2)
- 객체 변형: 정비율만 가능 (가로/세로 개별 확대 불가)
- 텍스트박스: 테두리/배경 설정 불가

---

## 2. 목표 아키텍처

```
Project (프로젝트)
├── documents[]                    # 업로드된 문서들
│   ├── document_1 (project_id: "proj-1")
│   ├── document_2 (project_id: "proj-1")
│   └── document_3 (project_id: null → "기타")
│
├── canvases                       # 채널별 독립 캔버스 (8개)
│   ├── brand-dna-canvas          # Brand Kit - Brand DNA 전용
│   ├── meeting-canvas            # Meeting AI - 브리프/서머리/카피 전용
│   ├── concept-canvas            # ConceptBoard 전용 (콘셉트 카드)
│   ├── presentation-canvas       # 프레젠테이션 전용
│   ├── detail-canvas             # 상세페이지 전용
│   ├── sns-canvas                # SNS 광고 전용 (페이지별 크기 다름)
│   ├── video-canvas              # 영상 스토리보드 전용
│   └── image-canvas              # 일반 이미지 전용
│
├── analyses[]                     # 분석 이력
│   ├── brand_dna_analysis (document_ids: ["doc-1", "doc-2"])
│   └── ...
│
└── chat_context                   # 채팅 컨텍스트
```

---

## 3. 캔버스 크기 설정

### 3.1 탭-캔버스 매핑 및 크기

| 탭 | 캔버스 타입 | 기본 크기 | 크기 변경 | 비고 |
|----|------------|----------|----------|------|
| ProjectTab | - | - | - | 관리 UI |
| UploadTab | - | - | - | 업로드 UI |
| **BrandKitTab** | brand-dna | 1080x1920 | ❌ 고정 | 세로 카드 |
| **MeetingTab** | meeting | 1920x1080 | ❌ 고정 | 가로 문서 |
| **ConceptBoardTab** | concept | 1080x1080 | ❌ 고정 | 정사각 카드 |
| **PresentationTab** | presentation | 1920x1080 | ⚠️ 프리셋 | 16:9 / 4:3 |
| **DetailTab** | detail | 860x∞ | ⚠️ 특수 | 폭 고정, 높이 무제한 |
| **SNSTab** | sns | 다양 | ✅ 프리셋 | 플랫폼별 (아래 참조) |
| **VideoTab** | video | 1080x1920 | ⚠️ 프리셋 | 9:16 / 16:9 / 1:1 |
| **ImageTab** | image | 1080x1080 | ✅ 자유 | 커스텀 입력 가능 |
| AssetsTab | - | - | - | 라이브러리 |
| SettingsTab | - | - | - | 설정 |

### 3.2 SNS 플랫폼별 크기 (페이지별 다름)

| 플랫폼 | 크기 | 비율 |
|--------|------|------|
| Instagram Feed | 1080x1080 | 1:1 |
| Instagram Story | 1080x1920 | 9:16 |
| Facebook Post | 1200x630 | ~1.9:1 |
| YouTube Shorts | 1080x1920 | 9:16 |
| YouTube Thumbnail | 1280x720 | 16:9 |

**SNS 캔버스 구현**: 하나의 캔버스 내에서 페이지별로 다른 크기 적용
```typescript
// SNS 탭에서 플랫폼 선택 시
snsCanvas.addPage({ width: 1080, height: 1080 }); // Instagram Feed
snsCanvas.addPage({ width: 1080, height: 1920 }); // Instagram Story
```

---

## 4. 현재 메뉴 구조 분석

### 4.1 ActivityBar 메뉴 (12개)

| 카테고리 | 메뉴 ID | 이름 | 현재 상태 | 필요 연결 |
|----------|---------|------|-----------|-----------|
| **프로젝트** | project | Project | ⚠️ 부분 | 프로젝트 CRUD, 문서 연결 |
| | upload | Upload | ⚠️ 부분 | 프로젝트별 문서 저장 |
| **전략** | brandkit | Brand Kit | ⚠️ 부분 | 분석-문서 연결, 캔버스 분리 |
| | meeting | Meeting AI | ✅ 작동 | 캔버스 분리 필요 |
| | conceptboard | ConceptBoard | ⚠️ UI만 | 콘셉트 CRUD, 캔버스 분리 |
| **채널** | presentation | Presentation | ⚠️ 부분 | 독립 캔버스 |
| | detail | 상세페이지 | ⚠️ 부분 | 독립 캔버스 |
| | sns | SNS 광고 | ⚠️ 부분 | 독립 캔버스, 크기 선택 |
| | video | 영상 | ⚠️ 부분 | 독립 캔버스, Video6 연결 |
| | image | 이미지 | ⚠️ 부분 | 독립 캔버스 |
| **라이브러리** | assets | Assets | ⚠️ 부분 | 프로젝트별 에셋 |
| **시스템** | settings | Settings | ✅ 작동 | - |

### 4.2 상단 툴바 요소

| 요소 | 현재 상태 | 필요 연결 |
|------|-----------|-----------|
| 프로젝트 선택기 | ⚠️ UI만 | 실제 프로젝트 전환 |
| 저장 버튼 | ⚠️ 부분 | 프로젝트별 저장 |
| Export | ✅ 작동 | - |
| Share | ❌ 없음 | 공유 기능 |

---

## 5. 구현 단계

### Phase 0: 데이터 스키마 변경 (Backend) - B팀

#### 5.0.1 Document 테이블 수정
```python
# 변경
class Document:
    id: str
    brand_id: str
    project_id: str | None  # 추가: 프로젝트 연결 (null = "기타")
    ...
```

#### 5.0.2 BrandDNA 스키마 수정
```python
# 변경
class BrandDNA:
    id: str
    brand_id: str
    document_ids: list[str]  # 추가: 분석에 사용된 문서들
    ...
```

#### 5.0.3 Canvas 테이블 신규
```python
class ProjectCanvas:
    id: str
    project_id: str
    canvas_type: str  # 8종류
    polotno_json: dict
    created_at: datetime
    updated_at: datetime
```

---

### Phase 1: Multi-Canvas Store (Frontend) - C팀

#### 5.1.1 useCanvasStore 수정

```typescript
// 변경: 멀티 캔버스
interface CanvasState {
  canvases: Map<CanvasType, StoreType>;
  activeCanvasType: CanvasType;

  // 하위 호환성: 기존 코드가 polotnoStore 접근 시 activeCanvas 반환
  polotnoStore: StoreType | null; // getter로 구현

  // Actions
  getCanvas: (type: CanvasType) => StoreType | null;
  setCanvas: (type: CanvasType, store: StoreType) => void;
  setActiveCanvas: (type: CanvasType) => void;
  initializeCanvas: (type: CanvasType, config: CanvasConfig) => StoreType;
}

type CanvasType =
  | 'brand-dna'      // Brand Kit (1080x1920)
  | 'meeting'        // Meeting AI (1920x1080)
  | 'concept'        // ConceptBoard (1080x1080)
  | 'presentation'   // Presentation (1920x1080, 프리셋)
  | 'detail'         // 상세페이지 (860x∞)
  | 'sns'            // SNS 광고 (페이지별 다름)
  | 'video'          // 영상 (1080x1920, 프리셋)
  | 'image';         // 이미지 (자유)

interface CanvasConfig {
  width: number;
  height: number;
  allowResize: boolean;
  presets?: { name: string; width: number; height: number }[];
}
```

#### 5.1.2 PolotnoWorkspace 수정
- 단일 인스턴스 → activeCanvasType에 따른 동적 렌더링
- 탭 전환 시 `setActiveCanvas(type)` 호출

---

### Phase 2: 프로젝트-문서 연결 (Frontend + Backend)

#### 5.2.1 UploadTab 수정
- 업로드 시 `project_id` 자동 지정 (현재 프로젝트)
- "기타" 문서 → 프로젝트로 이동 기능

#### 5.2.2 ProjectTab 수정
- 프로젝트별 문서 목록 표시
- 문서 이동/삭제 기능

---

### Phase 3: 문서-분석 이력 연결

#### 5.3.1 BrandKitTab 수정
- 분석 시 `document_ids` 저장
- 문서 선택 변경 시 해당 문서 분석만 표시
- 드롭다운에 문서명 표시

---

### Phase 4: 메뉴별 캔버스 연결

각 탭에서 자신의 캔버스만 사용하도록 수정:
- 탭 마운트 시 `setActiveCanvas(canvasType)` 호출
- 캔버스로 보내기 시 해당 타입 캔버스에 추가

---

### Phase 5: 에디터 기능 개선 (P2)

#### 5.5.1 객체 비정비율 변형
- Polotno 설정: `lockAspectRatio: false`

#### 5.5.2 텍스트박스 스타일
- `fill`, `stroke`, `strokeWidth` 속성 UI 추가

---

## 6. 구현 우선순위 (데모데이 기준)

### Must Have (P0)
1. **Multi-Canvas Store** - 캔버스 분리 없이는 데모 불가
2. **탭-캔버스 연결** - 각 탭이 자기 캔버스 사용
3. **문서-분석 연결** - Brand DNA 핵심 기능
4. **프로젝트-문서 연결** - 기본 정리 기능

### Should Have (P1)
5. SNS 크기 프리셋 UI
6. Presentation/Video 크기 프리셋 UI
7. 프로젝트 전환 기능

### Could Have (P2)
8. 에디터 기능 개선 (비정비율 변형, 텍스트 스타일)
9. 문서 이동/삭제
10. 공유 기능

---

## 7. 리스크 및 대응

### 7.1 기존 코드 파손 리스크
- **위험**: `polotnoStore` 직접 참조하는 코드 많음
- **대응**:
  1. `polotnoStore` getter를 `activeCanvas` 반환으로 변경
  2. 기존 코드 동작 유지하면서 점진적 마이그레이션

### 7.2 데이터 마이그레이션
- **위험**: 기존 저장 데이터 호환성
- **대응**:
  1. 데모데이 전이므로 기존 데이터 삭제 가능
  2. 새 스키마로 시작

### 7.3 시간 부족
- **위험**: 전체 구현 불가
- **대응**:
  1. P0만 구현
  2. 나머지는 "준비 중" UI로 처리

---

## 8. 실행 계획

### Day 1 (오늘) - C팀

| 순서 | 작업 | 파일 |
|------|------|------|
| 1 | ✅ 설계 문서 완성 | 이 문서 |
| 2 | useCanvasStore 멀티캔버스 구조 변경 | useCanvasStore.ts |
| 3 | CanvasType 정의 및 기본 설정 | types.ts |
| 4 | PolotnoWorkspace 동적 렌더링 | PolotnoWorkspace.tsx |

### Day 2 - C팀 + B팀(합류)

| 순서 | 작업 | 담당 |
|------|------|------|
| 5 | 각 탭에 setActiveCanvas 연결 | C팀 |
| 6 | BrandDNA document_ids 추가 | B팀 |
| 7 | Document project_id 추가 | B팀 |
| 8 | BrandKitTab 문서-분석 연결 | C팀 |

### Day 3 - 통합 테스트

| 순서 | 작업 |
|------|------|
| 9 | E2E 테스트 |
| 10 | 버그 수정 |
| 11 | SNS/Presentation 크기 프리셋 (시간 있으면) |

---

## 9. B팀 작업 지침

### 충돌 없는 작업 (Day 1 바로 가능)
- Video Pipeline V2 E2E 테스트
- Alembic multiple heads 정리
- API 문서화

### Day 2부터 합류
- BrandDNA에 `document_ids: list[str]` 추가
- Document에 `project_id: str | None` 추가
- ProjectCanvas 테이블/API 생성 (시간 있으면)

---

## 10. 영향받는 파일 목록

### Backend (B팀)
- `backend/app/schemas/brand_analyzer.py`
- `backend/app/models/document.py`
- `backend/app/api/v1/documents.py`
- 신규: `backend/app/models/project_canvas.py`

### Frontend (C팀)
- `frontend/components/canvas-studio/stores/useCanvasStore.ts`
- `frontend/components/canvas-studio/stores/types.ts`
- `frontend/components/canvas-studio/polotno/PolotnoWorkspace.tsx`
- `frontend/components/canvas-studio/panels/left/tabs/*.tsx` (8개 탭)
- `frontend/lib/api/brand-api.ts`

---

**C팀 Phase 1 구현 시작합니다.**
