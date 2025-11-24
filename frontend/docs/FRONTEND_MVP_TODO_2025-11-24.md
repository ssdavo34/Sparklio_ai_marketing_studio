# ✅ SPARKLIO Frontend MVP - TODO List

**작성일**: 2025-11-24
**목표**: MVP v1.0 완성 (E2E #1 시나리오 구현)
**기준 문서**: FRONTEND_MVP_GAP_ANALYSIS_2025-11-24.md

---

## 📊 전체 진행 상황

- **Phase 1**: ⬜️⬜️⬜️⬜️ 0/4 (0%)
- **Phase 2**: ⬜️⬜️⬜️⬜️⬜️ 0/5 (0%)
- **Phase 3**: ⬜️⬜️⬜️⬜️ 0/4 (0%)
- **Phase 4**: ⬜️⬜️⬜️⬜️⬜️ 0/5 (0%)
- **Phase 5**: ⬜️⬜️⬜️⬜️ 0/4 (0%)
- **Phase 6**: ⬜️⬜️⬜️⬜️⬜️ 0/5 (0%)
- **Phase 7**: ⬜️⬜️⬜️⬜️⬜️ 0/5 (0%)

**전체 진행률**: 0/32 (0%)

---

## 🎯 Phase 1: 데이터 아키텍처 & 라우팅

**목표**: 워크스페이스/프로젝트/브랜드/브리프 구조 확립
**예상 기간**: 1주
**우선순위**: P0

### 1.1 TypeScript 타입 정의

- [ ] **1.1.1** `types/workspace.ts` 생성
  ```typescript
  export interface Workspace {
    id: string;
    name: string;
    industry: string;
    websiteUrl?: string;
    createdAt: string;
    updatedAt: string;
  }

  export interface Project {
    id: string;
    workspaceId: string;
    name: string;
    status: 'idea' | 'planning' | 'in_progress' | 'completed';
    createdAt: string;
    updatedAt: string;
  }
  ```

- [ ] **1.1.2** `types/brand.ts` 생성
  ```typescript
  export interface BrandKit {
    id: string;
    workspaceId: string;
    logo?: string;
    primaryColor: string;
    secondaryColor?: string;
    fonts: string[];
    tone: string[];
    forbiddenExpressions: string[];
    keyMessages: string[];
    createdAt: string;
    updatedAt: string;
  }

  export interface BrandDNA {
    tone: string;
    key_messages: string[];
    target_audience: string;
    dos: string[];
    donts: string[];
    sample_copies: string[];
  }
  ```

- [ ] **1.1.3** `types/brief.ts` 생성
  ```typescript
  export interface Brief {
    id: string;
    projectId: string;
    goal: string;
    target: string;
    insight: string;
    keyMessages: string[];
    channels: string[];
    budget?: number;
    startDate?: string;
    endDate?: string;
    kpis: string[];
    createdAt: string;
    updatedAt: string;
  }
  ```

- [ ] **1.1.4** `types/asset.ts` 생성
  ```typescript
  export interface Asset {
    id: string;
    workspaceId: string;
    name: string;
    type: 'image' | 'video' | 'document' | 'font';
    url: string;
    thumbnailUrl?: string;
    tags: string[];
    createdAt: string;
  }

  export interface Template {
    id: string;
    name: string;
    category: 'banner' | 'detail' | 'sns' | 'deck';
    thumbnailUrl: string;
    canvasJson: object;
    createdAt: string;
  }
  ```

### 1.2 Zustand Store 생성

- [ ] **1.2.1** `stores/useWorkspaceStore.ts` 생성
  ```typescript
  interface WorkspaceStore {
    workspaces: Workspace[];
    currentWorkspace: Workspace | null;
    setWorkspaces: (workspaces: Workspace[]) => void;
    setCurrentWorkspace: (workspace: Workspace | null) => void;
    addWorkspace: (workspace: Workspace) => void;
    updateWorkspace: (id: string, data: Partial<Workspace>) => void;
    deleteWorkspace: (id: string) => void;
  }
  ```

- [ ] **1.2.2** `stores/useBrandStore.ts` 생성
  ```typescript
  interface BrandStore {
    brandKit: BrandKit | null;
    brandDNA: BrandDNA | null;
    setBrandKit: (kit: BrandKit | null) => void;
    setBrandDNA: (dna: BrandDNA | null) => void;
  }
  ```

- [ ] **1.2.3** `stores/useProjectStore.ts` 생성
  ```typescript
  interface ProjectStore {
    projects: Project[];
    currentProject: Project | null;
    setProjects: (projects: Project[]) => void;
    setCurrentProject: (project: Project | null) => void;
    addProject: (project: Project) => void;
    updateProject: (id: string, data: Partial<Project>) => void;
  }
  ```

- [ ] **1.2.4** `stores/useBriefStore.ts` 생성
  ```typescript
  interface BriefStore {
    brief: Brief | null;
    setBrief: (brief: Brief | null) => void;
    updateBriefField: (field: keyof Brief, value: any) => void;
  }
  ```

### 1.3 API 클라이언트 생성

- [ ] **1.3.1** `lib/api/workspace-api.ts` 생성
  ```typescript
  export async function getWorkspaces(): Promise<Workspace[]>
  export async function getWorkspace(id: string): Promise<Workspace>
  export async function createWorkspace(data: Omit<Workspace, 'id' | 'createdAt' | 'updatedAt'>): Promise<Workspace>
  export async function updateWorkspace(id: string, data: Partial<Workspace>): Promise<Workspace>
  export async function deleteWorkspace(id: string): Promise<void>
  ```

- [ ] **1.3.2** `lib/api/brand-api.ts` 생성
  ```typescript
  export async function getBrandKit(workspaceId: string): Promise<BrandKit>
  export async function createBrandKit(data: Omit<BrandKit, 'id' | 'createdAt' | 'updatedAt'>): Promise<BrandKit>
  export async function updateBrandKit(id: string, data: Partial<BrandKit>): Promise<BrandKit>
  ```

- [ ] **1.3.3** `lib/api/brief-api.ts` 생성
  ```typescript
  export async function getBrief(projectId: string): Promise<Brief>
  export async function createBrief(data: Omit<Brief, 'id' | 'createdAt' | 'updatedAt'>): Promise<Brief>
  export async function updateBrief(id: string, data: Partial<Brief>): Promise<Brief>
  ```

- [ ] **1.3.4** `lib/api/project-api.ts` 생성
  ```typescript
  export async function getProjects(workspaceId: string): Promise<Project[]>
  export async function getProject(id: string): Promise<Project>
  export async function createProject(data: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project>
  export async function updateProject(id: string, data: Partial<Project>): Promise<Project>
  ```

### 1.4 라우팅 구조 생성

- [ ] **1.4.1** `app/workspace/page.tsx` 생성
  - 워크스페이스 목록 표시
  - "새 워크스페이스" 버튼
  - 각 카드 클릭 → 워크스페이스 대시보드 이동

- [ ] **1.4.2** `app/workspace/[id]/page.tsx` 생성
  - 워크스페이스 대시보드
  - 브랜드 키트 상태 표시
  - 프로젝트 목록 표시
  - "새 프로젝트" 버튼

- [ ] **1.4.3** `app/workspace/[id]/brand/page.tsx` 생성
  - 브랜드 키트 페이지
  - BrandKitEditor 컴포넌트 배치

- [ ] **1.4.4** `app/workspace/[id]/project/[projectId]/page.tsx` 생성
  - 프로젝트 대시보드
  - 브리프 상태 표시
  - "브리프 작성" 버튼
  - "콘텐츠 생성" 버튼
  - 생성된 산출물 목록

---

## 🎯 Phase 2: 브랜드 OS 구현

**목표**: 브랜드 정보 입력 및 DNA 생성 가능
**예상 기간**: 1주
**우선순위**: P0

### 2.1 브랜드 인테이크 UI

- [ ] **2.1.1** `components/brand/BrandIntakeForm.tsx` 생성
  - URL 입력 필드
  - 파일 업로드 (드래그 앤 드롭)
  - 텍스트 에디터 (자유 입력)
  - "분석 시작" 버튼
  - 로딩 상태 표시

- [ ] **2.1.2** BrandIntakeForm 스타일링
  - 3단계 탭 UI (URL / 파일 / 텍스트)
  - 업로드 진행률 바
  - 업로드된 파일 목록 표시

### 2.2 브랜드 키트 에디터

- [ ] **2.2.1** `components/brand/BrandKitEditor.tsx` 생성
  - 로고 업로드 섹션
  - 컬러 피커 (주 컬러, 보조 컬러)
  - 폰트 선택 드롭다운
  - 톤 키워드 입력 (태그 형식)
  - 금지 표현 입력 (리스트 형식)
  - 대표 메시지 텍스트 에어리어
  - "저장" 버튼

- [ ] **2.2.2** 컬러 피커 컴포넌트
  - react-colorful 또는 native input[type="color"]
  - HEX 값 표시
  - 최근 사용 컬러 표시

- [ ] **2.2.3** 태그 입력 컴포넌트
  - Enter로 태그 추가
  - X 버튼으로 태그 삭제
  - 톤 키워드용, 금지 표현용 재사용

### 2.3 Brand DNA 카드

- [ ] **2.3.1** `components/brand/BrandDNACard.tsx` 생성
  - tone 표시 (배지 형식)
  - key_messages 리스트
  - target_audience 표시
  - dos/donts 2열 레이아웃
  - sample_copies 카드 형식
  - "편집" 버튼 (BrandKitEditor 열기)

### 2.4 BrandAnalyzer 연동

- [ ] **2.4.1** `lib/api/brand-analyzer-api.ts` 생성
  ```typescript
  export interface AnalyzeBrandRequest {
    url?: string;
    text?: string;
    files?: File[];
  }

  export async function analyzeBrand(request: AnalyzeBrandRequest): Promise<BrandDNA>
  ```

- [ ] **2.4.2** Backend 연동
  - POST `/api/v1/agents/brand-analyzer/execute`
  - task: 'brand_analysis'
  - payload: { url, text, files }

### 2.5 기존 컴포넌트 업데이트

- [ ] **2.5.1** `components/canvas-studio/panels/left/tabs/BrandKitTab.tsx` 업데이트
  - 현재 껍데기를 BrandKitEditor로 교체
  - useWorkspaceStore에서 currentWorkspace 가져오기
  - useBrandStore에서 brandKit 가져오기
  - 없으면 "브랜드 키트를 먼저 설정하세요" 메시지

---

## 🎯 Phase 3: 브리프 관리 구현

**목표**: 브리프 입력/편집 가능
**예상 기간**: 1주
**우선순위**: P0

### 3.1 브리프 에디터

- [ ] **3.1.1** `components/brief/BriefEditor.tsx` 생성
  - 목표 입력 (textarea)
  - 타겟 입력 (textarea)
  - 인사이트 입력 (textarea)
  - 주요 메시지 입력 (리스트 형식, 추가/삭제 가능)
  - 채널 선택 (체크박스: 상품상세, SNS, 배너, 덱)
  - 예산 입력 (number)
  - 기간 입력 (date range)
  - KPI 입력 (리스트 형식)
  - "저장" 버튼
  - "취소" 버튼

- [ ] **3.1.2** BriefEditor 폼 유효성 검사
  - 필수 필드 체크 (목표, 타겟, 채널)
  - 에러 메시지 표시

### 3.2 브리프 뷰어

- [ ] **3.2.1** `components/brief/BriefViewer.tsx` 생성
  - 읽기 전용 브리프 표시
  - 섹션별 정리된 레이아웃
  - "편집" 버튼 → BriefEditor 모드 전환
  - "콘텐츠 생성" 버튼

### 3.3 Strategist 대화형 보완

- [ ] **3.3.1** `components/brief/BriefFieldOptimizer.tsx` 생성
  - 누락 필드 자동 감지
  - "이 필드를 채워주세요" 질문 표시
  - Chat 인터페이스 (useChatStore 재사용)
  - AI 응답을 Brief에 자동 반영
  - "최적화 완료" 버튼

- [ ] **3.3.2** `lib/api/brief-api.ts` 업데이트
  ```typescript
  export async function optimizeBriefField(
    briefId: string,
    field: keyof Brief,
    currentValue: any
  ): Promise<any>
  ```

### 3.4 라우팅 추가

- [ ] **3.4.1** `app/workspace/[id]/project/[projectId]/brief/page.tsx` 생성
  - BriefViewer 또는 BriefEditor 표시
  - Brief 없으면 "브리프를 작성하세요" + BriefEditor 자동 오픈

---

## 🎯 Phase 4: 멀티 채널 생성 구현

**목표**: 브리프 기반으로 여러 채널 동시 생성
**예상 기간**: 1.5주
**우선순위**: P0

### 4.1 멀티 채널 생성기 UI

- [ ] **4.1.1** `components/generator/MultiChannelSelector.tsx` 생성
  - 채널 체크박스 그리드
    - [ ] 상품상세 (사이즈 옵션: 자사몰, 네이버, 쿠팡)
    - [ ] SNS (포맷: 피드, 릴스, 스토리)
    - [ ] 배너 (사이즈: 1080x1080, 1200x628, 1080x1920)
    - [ ] 덱 (템플릿: 제안서, 보고서, 피치)
  - "모두 선택" / "선택 해제" 버튼
  - "생성 시작" 버튼

- [ ] **4.1.2** 채널별 옵션 패널
  - 각 채널 체크 시 옵션 펼침
  - 드롭다운 또는 라디오 버튼으로 세부 옵션 선택

### 4.2 생성 진행 상황 UI

- [ ] **4.2.1** `components/generator/GenerationProgress.tsx` 생성
  - 채널별 카드 표시
  - 진행률 바 (0%, 50%, 100%)
  - 로딩 스피너 (진행 중)
  - 체크 아이콘 (완료)
  - 에러 아이콘 (실패)
  - "재시도" 버튼 (실패 시)

- [ ] **4.2.2** WebSocket 또는 Polling으로 실시간 업데이트
  - 생성 상태를 주기적으로 확인
  - 완료된 채널은 자동으로 프리뷰 표시

### 4.3 채널별 프리뷰

- [ ] **4.3.1** `components/generator/ChannelPreviewGrid.tsx` 생성
  - 생성된 채널들을 그리드 레이아웃
  - 각 카드에:
    - 채널명 (예: "상품상세 - 자사몰")
    - 썸네일 이미지
    - Reviewer 점수 배지
    - "편집" 버튼 → Canvas Studio 열기
    - "재생성" 버튼

- [ ] **4.3.2** 썸네일 생성
  - Canvas JSON → 썸네일 이미지 변환
  - html-to-image 또는 Polotno toDataURL 사용

### 4.4 멀티 채널 API

- [ ] **4.4.1** `lib/api/multi-channel-api.ts` 생성
  ```typescript
  export interface MultiChannelRequest {
    briefId: string;
    channels: {
      type: 'product_detail' | 'sns' | 'banner' | 'deck';
      options: any;
    }[];
  }

  export interface MultiChannelResponse {
    jobId: string;
    channels: {
      type: string;
      status: 'pending' | 'in_progress' | 'completed' | 'failed';
      result?: any;
      error?: string;
    }[];
  }

  export async function generateMultiChannel(request: MultiChannelRequest): Promise<MultiChannelResponse>
  export async function getMultiChannelStatus(jobId: string): Promise<MultiChannelResponse>
  ```

- [ ] **4.4.2** Backend 연동
  - POST `/api/v1/generate/multi-channel`
  - GET `/api/v1/generate/multi-channel/{jobId}/status`

### 4.5 라우팅 추가

- [ ] **4.5.1** `app/workspace/[id]/project/[projectId]/generate/page.tsx` 생성
  - MultiChannelSelector 표시
  - GenerationProgress 표시 (생성 시작 후)
  - ChannelPreviewGrid 표시 (생성 완료 후)

---

## 🎯 Phase 5: Canvas ↔ Chat 양방향 연동

**목표**: Canvas에서 선택한 요소를 Chat에 전달
**예상 기간**: 0.5주
**우선순위**: P1

### 5.1 Canvas Context Hook

- [ ] **5.1.1** `hooks/useCanvasContext.ts` 생성
  ```typescript
  export function useCanvasContext() {
    const polotnoStore = useCanvasStore((state) => state.polotnoStore);

    function getSelectedElementInfo() {
      const selected = polotnoStore?.selectedElements[0];
      if (!selected) return null;

      return {
        type: selected.type,
        text: selected.text,
        x: selected.x,
        y: selected.y,
        width: selected.width,
        height: selected.height,
        // ... 기타 속성
      };
    }

    function getActivePageInfo() {
      const page = polotnoStore?.activePage;
      // ... 페이지 정보 반환
    }

    return { getSelectedElementInfo, getActivePageInfo };
  }
  ```

### 5.2 Chat Store 업데이트

- [ ] **5.2.1** `stores/useChatStore.ts` 업데이트
  ```typescript
  interface ChatStore {
    // ... 기존 필드
    canvasContext: any | null;
    setCanvasContext: (context: any) => void;
  }
  ```

- [ ] **5.2.2** sendMessage 함수 수정
  - canvasContext를 payload에 포함
  - Backend에 전달

### 5.3 RightDock ChatTab 업데이트

- [ ] **5.3.1** `components/canvas-studio/panels/right/RightDock.tsx` 수정
  - ChatTab에서 useCanvasContext 사용
  - 선택 변경 감지 (useEffect)
  - 선택된 요소 정보를 Chat 상단에 표시
    - "선택된 요소: 텍스트 '안녕하세요'" 같은 힌트
  - Chat 입력 시 자동으로 컨텍스트 포함

### 5.4 Backend Payload 확인

- [ ] **5.4.1** Chat API 호출 시 canvas_context 필드 추가
  - B팀에 스펙 전달
  - Backend가 이를 활용하는지 확인

---

## 🎯 Phase 6: Asset Library & Template

**목표**: 자산 업로드 및 템플릿 사용 가능
**예상 기간**: 1주
**우선순위**: P1

### 6.1 Asset 업로더

- [ ] **6.1.1** `components/asset/AssetUploader.tsx` 생성
  - 드래그 앤 드롭 영역
  - 파일 선택 버튼
  - 업로드 진행률 표시
  - 태그 입력 (쉼표로 구분)
  - 업로드 완료 후 목록에 추가

- [ ] **6.1.2** `lib/api/asset-api.ts` 생성
  ```typescript
  export async function uploadAsset(file: File, workspaceId: string, tags: string[]): Promise<Asset>
  export async function getAssets(workspaceId: string, type?: string): Promise<Asset[]>
  export async function deleteAsset(id: string): Promise<void>
  ```

### 6.2 Asset 갤러리

- [ ] **6.2.1** `components/asset/AssetGallery.tsx` 생성
  - 그리드 레이아웃 (3~4열)
  - 썸네일 표시
  - 파일명, 태그 표시
  - 클릭 시 Canvas에 추가
  - 우클릭 메뉴 (삭제, 편집)

- [ ] **6.2.2** Asset 검색/필터
  - 태그 필터
  - 타입 필터 (이미지, 비디오, 문서)
  - 날짜 정렬

### 6.3 Template 갤러리

- [ ] **6.3.1** `components/template/TemplateGallery.tsx` 생성
  - 카테고리 탭 (배너, 상세, SNS, 덱)
  - 템플릿 카드 그리드
  - 썸네일, 이름 표시
  - "미리보기" 버튼 → 모달 열기
  - "사용하기" 버튼 → Canvas에 로드

- [ ] **6.3.2** `lib/api/template-api.ts` 생성
  ```typescript
  export async function getTemplates(category?: string): Promise<Template[]>
  export async function getTemplate(id: string): Promise<Template>
  ```

### 6.4 Template 적용

- [ ] **6.4.1** `components/template/TemplateApplier.tsx` 생성
  - 템플릿 JSON을 Canvas에 로드
  - 브랜드 컬러 자동 교체 (BrandKit 연동)
  - 브랜드 폰트 자동 교체
  - 로고 자동 삽입

### 6.5 기존 Tab 업데이트

- [ ] **6.5.1** `components/canvas-studio/panels/left/tabs/UploadTab.tsx` 업데이트
  - AssetUploader 통합
  - 업로드 후 AssetGallery 자동 갱신

- [ ] **6.5.2** `components/canvas-studio/panels/left/tabs/PhotosTab.tsx` 업데이트
  - AssetGallery (type: 'image') 통합

- [ ] **6.5.3** `components/canvas-studio/panels/left/tabs/ElementsTab.tsx` 업데이트
  - TemplateGallery (category: 'element') 통합

---

## 🎯 Phase 7: Export 구현

**목표**: PNG, PDF, PPTX, HTML Export
**예상 기간**: 1주
**우선순위**: P0

### 7.1 PDF Export

- [ ] **7.1.1** `lib/export/pdf-exporter.ts` 생성
  ```typescript
  export async function exportToPdf(
    polotnoStore: any,
    filename: string
  ): Promise<Blob>
  ```

- [ ] **7.1.2** jsPDF 설치 및 구현
  - `npm install jspdf`
  - Canvas → Image (toDataURL)
  - Image → PDF (addImage)
  - 페이지 단위 Export (멀티 페이지 지원)

### 7.2 PPTX Export

- [ ] **7.2.1** `lib/export/pptx-exporter.ts` 생성
  ```typescript
  export async function exportToPptx(
    polotnoStore: any,
    filename: string
  ): Promise<Blob>
  ```

- [ ] **7.2.2** PptxGenJS 설치 및 구현
  - `npm install pptxgenjs`
  - Canvas JSON → PPTX Slide 변환
  - 텍스트, 이미지, 도형 변환
  - 레이아웃 보존

### 7.3 HTML Export

- [ ] **7.3.1** `lib/export/html-exporter.ts` 생성
  ```typescript
  export async function exportToHtml(
    polotnoStore: any,
    filename: string
  ): Promise<string>
  ```

- [ ] **7.3.2** Canvas JSON → HTML 변환
  - 상품상세페이지 구조 생성
  - 인라인 CSS
  - 반응형 레이아웃
  - 이미지 Base64 임베딩 또는 URL

### 7.4 Export UI

- [ ] **7.4.1** `components/export/ExportModal.tsx` 생성
  - 포맷 선택 (라디오 버튼: PNG, PDF, PPTX, HTML)
  - 파일명 입력
  - 해상도 옵션 (PNG용)
  - 페이지 범위 (PDF/PPTX용)
  - "다운로드" 버튼
  - 진행률 표시

### 7.5 TopToolbar 업데이트

- [ ] **7.5.1** `components/canvas-studio/layout/TopToolbar.tsx` 업데이트
  - "Export" 버튼 추가
  - ExportModal 열기
  - 다운로드 완료 토스트 메시지

---

## 🚀 다음 단계

### 즉시 시작 (P0)
1. **Phase 1.1**: TypeScript 타입 정의 (1~2일)
2. **Phase 1.2**: Zustand Store 생성 (1~2일)
3. **Phase 1.3**: API 클라이언트 생성 (2~3일)

### Backend 협업 필요
- [ ] Multi-Channel API 스펙 확인 (B팀)
- [ ] BrandAnalyzer API 스펙 확인 (B팀)
- [ ] Canvas Context를 Chat에 전달하는 스펙 논의 (B팀)

### 설치 필요 패키지
```bash
npm install jspdf pptxgenjs react-colorful html-to-image
```

---

## 📝 작업 규칙

1. **모든 작업은 `components/canvas-studio/` 내에서 수행**
2. **새 라우트는 `app/` 에만 생성**
3. **완료된 항목은 [x] 로 체크**
4. **각 Phase 완료 시 MAIN_EDITOR_PATH.md에 히스토리 기록**
5. **Git 커밋은 Phase 단위로 수행**

---

**작성자:** C팀 (Frontend Team)
**최종 수정:** 2025-11-24
