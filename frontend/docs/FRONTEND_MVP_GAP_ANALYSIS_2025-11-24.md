# 🎯 SPARKLIO MVP - Frontend Gap Analysis & TODO

**작성일**: 2025-11-24
**작성자**: C팀 (Frontend Team)
**목적**: 마스터 PRD 기준 MVP 완성을 위한 부족한 부분 완벽 분석 및 TODO 생성

---

## 📊 분석 기준

**마스터 PRD의 E2E 시나리오 4개를 기준으로 분석:**
1. E2E #1 – 신규 브랜드 온보딩 + 첫 캠페인 생성
2. E2E #2 – 정기 마케팅 회의 → 리포트 + 다음 액션
3. E2E #3 – 숏폼 영상 캠페인
4. E2E #4 – 제안서/피치 덱 생성

**현재 상태 (2025-11-24 기준):**
- ✅ Canvas Studio (Polotno 기반) 완성
- ✅ Strategist 통합 완료
- ✅ Reviewer 통합 완료
- ✅ AIResponseRenderer (자동 타입 감지 & 렌더링)
- ✅ Chat 기능 (Backend Agent System 연동)

---

## 🔍 갭 분석: E2E #1 기준

### E2E #1: 신규 브랜드 온보딩 + 첫 캠페인 생성

| 단계 | 요구사항 ID | PRD 요구사항 | 현재 상태 | 갭 | 우선순위 |
|------|-------------|--------------|-----------|-----|----------|
| 1 | F-WS-01 | 워크스페이스 생성 (브랜드명, 업종, URL) | ❌ 없음 | 워크스페이스 관리 UI 전체 부재 | P0 |
| 2 | F-BR-01 | 브랜드 인테이크 (URL 크롤링, PDF, 텍스트) | ❌ 없음 | 브랜드 정보 수집 UI 부재 | P0 |
| 3 | F-BR-02 | 브랜드 키트 입력 (로고, 컬러, 폰트, 톤) | ⚠️ 부분 | BrandKitTab 존재하나 입력 UI 미구현 | P0 |
| 4 | F-BR-03 | BrandAnalyzer → DNA 카드 생성 | ❌ 없음 | Backend 연동 API 미구현 | P1 |
| 5 | F-MTG-01 | 미팅 녹음/메모 입력 | ❌ 없음 | Meeting AI UI 전체 부재 | P1 |
| 6 | F-MTG-03 | Meeting 요약 → 브리프 생성 버튼 | ❌ 없음 | Meeting → Brief 연결 부재 | P1 |
| 7 | F-BRF-01 | 브리프 입력/편집 UI | ❌ 없음 | Brief 관리 UI 부재 | P0 |
| 8 | F-GEN-01 | 멀티 채널 생성 (상세+SNS+배너+덱) | ⚠️ 부분 | ChatPanel에서 kind 선택만 가능, 멀티 채널 동시 생성 불가 | P0 |
| 9 | F-REV-02 | Reviewer 승인 규칙 적용 | ✅ 완료 | ReviewerReviewView 구현됨 | - |
| 10 | F-EDT-05 | Chat ↔ Canvas 양방향 연동 | ⚠️ 부분 | Chat에서 Canvas로는 가능, Canvas 컨텍스트 → Chat 전달 미구현 | P1 |
| 11 | F-PUB-01 | Export (PNG, PDF, PPTX, HTML) | ❌ 없음 | Polotno는 PNG만 가능, 나머지 미구현 | P2 |

### 갭 요약 (E2E #1)
**치명적 갭 (P0):**
1. 워크스페이스/프로젝트 관리 시스템 전체 부재
2. 브랜드 OS 입력 UI 부재
3. 브리프 관리 UI 부재
4. 멀티 채널 동시 생성 기능 부재

**중요 갭 (P1):**
1. Meeting AI UI 부재
2. Brand Analyzer 연동 부재
3. Canvas 컨텍스트 → Chat 전달 부재

---

## 🔍 갭 분석: E2E #2, #3, #4

### E2E #2: 정기 회의 → 리포트
- Meeting AI 부재로 **전체 시나리오 불가능**

### E2E #3: 숏폼 영상
- VideoDirector Agent 연동 부재
- 타임라인 뷰 부재
- 영상 렌더링 기능 부재
- **v1 스코프 외** (Phase 4)

### E2E #4: 제안서/피치 덱
- Deck Generator 연동 부재
- 슬라이드 뷰 편집 부재
- **부분적 구현 가능** (현재 Canvas로 페이지 단위 작업은 가능)

---

## 📋 핵심 컴포넌트별 갭 분석

### 1. 워크스페이스 & 프로젝트 관리
**현재 상태:** 전무
**필요 컴포넌트:**
- `app/workspace/page.tsx` - 워크스페이스 목록
- `app/workspace/[id]/page.tsx` - 워크스페이스 상세
- `app/workspace/[id]/project/[projectId]/page.tsx` - 프로젝트 상세
- `components/workspace/WorkspaceList.tsx`
- `components/workspace/WorkspaceForm.tsx`
- `components/workspace/ProjectList.tsx`
- `components/workspace/ProjectForm.tsx`
- `lib/api/workspace-api.ts`
- `lib/api/project-api.ts`

### 2. 브랜드 OS
**현재 상태:** BrandKitTab 껍데기만 존재
**필요 컴포넌트:**
- `components/brand/BrandIntakeForm.tsx` - URL/PDF/텍스트 입력
- `components/brand/BrandKitEditor.tsx` - 로고, 컬러, 폰트, 톤 입력
- `components/brand/BrandDNACard.tsx` - BrandAnalyzer 결과 표시
- `lib/api/brand-api.ts` - 브랜드 CRUD
- `lib/api/brand-analyzer-api.ts` - BrandAnalyzer 연동

### 3. Meeting AI
**현재 상태:** 전무
**필요 컴포넌트:**
- `components/meeting/MeetingUpload.tsx` - 오디오/비디오/텍스트 업로드
- `components/meeting/MeetingSummary.tsx` - 요약 결과 표시
- `components/meeting/MeetingToBriefButton.tsx` - Brief 생성 버튼
- `lib/api/meeting-api.ts` - Meeting AI 연동

### 4. 브리프 관리
**현재 상태:** 전무
**필요 컴포넌트:**
- `components/brief/BriefEditor.tsx` - 브리프 입력/편집
- `components/brief/BriefViewer.tsx` - 브리프 읽기 전용 뷰
- `components/brief/BriefFieldOptimizer.tsx` - Strategist 대화형 보완
- `lib/api/brief-api.ts` - Brief CRUD

### 5. 멀티 채널 생성기
**현재 상태:** ChatPanel에서 kind 하나씩만 선택 가능
**필요 컴포넌트:**
- `components/generator/MultiChannelGenerator.tsx` - 여러 채널 동시 선택
- `components/generator/ChannelPreview.tsx` - 채널별 미리보기
- `components/generator/GenerationQueue.tsx` - 생성 진행 상황
- `lib/api/multi-channel-api.ts` - 멀티 채널 생성

### 6. Canvas ↔ Chat 양방향 연동
**현재 상태:** Chat → Canvas는 가능, 역방향 불가
**필요 기능:**
- 선택된 오브젝트 정보를 Chat에 자동 전달
- "이 텍스트를 더 위트 있게" 같은 맥락 인식
- `hooks/useCanvasContext.ts` - Canvas 컨텍스트 추출

### 7. Asset Library
**현재 상태:** UploadTab, PhotosTab 껍데기만 존재
**필요 컴포넌트:**
- `components/asset/AssetUploader.tsx` - 파일 업로드
- `components/asset/AssetGallery.tsx` - 자산 갤러리
- `components/asset/AssetSearch.tsx` - 검색/필터
- `lib/api/asset-api.ts` - Asset CRUD

### 8. Template 시스템
**현재 상태:** TemplateSelector 껍데기만 존재
**필요 컴포넌트:**
- `components/template/TemplateGallery.tsx` - 템플릿 갤러리
- `components/template/TemplatePreview.tsx` - 템플릿 미리보기
- `components/template/TemplateApplier.tsx` - 템플릿 적용
- `lib/api/template-api.ts` - Template CRUD

### 9. Export & Publishing
**현재 상태:** Polotno PNG만 가능
**필요 기능:**
- PDF Export (jsPDF)
- PPTX Export (PptxGenJS)
- HTML Export (상세페이지용)
- 파일 Naming 규칙
- `lib/export/pdf-exporter.ts`
- `lib/export/pptx-exporter.ts`
- `lib/export/html-exporter.ts`

---

## 🎯 MVP 우선순위 정의

### MVP v1.0 스코프 (E2E #1 완성)
**목표:** 신규 브랜드가 첫 캠페인 산출물을 만들 수 있다.

**필수 (P0):**
1. 워크스페이스 & 프로젝트 관리
2. 브랜드 키트 입력
3. 브리프 입력/편집
4. 멀티 채널 생성 (상세+SNS+배너)
5. Canvas 편집 (기존 완성)
6. 기본 Export (PNG, PDF)

**중요 (P1):**
1. Meeting AI 통합
2. Brand Analyzer 연동
3. Canvas Context → Chat
4. Asset Library 기본 기능
5. Template 기본 기능

**추후 (P2):**
1. PPTX Export
2. HTML Export
3. 영상 생성 (E2E #3)
4. 고급 Asset 검색
5. 고급 Template 편집

---

## ✅ TODO: MVP v1.0 완성 로드맵

### Phase 1: 데이터 아키텍처 & 라우팅 (1주)
**목표:** 워크스페이스/프로젝트/브랜드/브리프 구조 확립

#### 1.1 라우팅 구조 설계
- [ ] `app/workspace/page.tsx` - 워크스페이스 목록 페이지
- [ ] `app/workspace/[id]/page.tsx` - 워크스페이스 대시보드
- [ ] `app/workspace/[id]/brand/page.tsx` - 브랜드 키트 페이지
- [ ] `app/workspace/[id]/project/[projectId]/page.tsx` - 프로젝트 상세
- [ ] `app/workspace/[id]/project/[projectId]/brief/page.tsx` - 브리프 페이지
- [ ] `app/workspace/[id]/project/[projectId]/generate/page.tsx` - 생성 페이지
- [ ] 기존 `/studio/v3` → 프로젝트 컨텍스트 내에서만 접근하도록 수정

#### 1.2 타입 정의
- [ ] `types/workspace.ts` - Workspace, Project 타입
- [ ] `types/brand.ts` - Brand, BrandKit, BrandDNA 타입
- [ ] `types/brief.ts` - Brief, BriefInput 타입
- [ ] `types/asset.ts` - Asset, Template 타입

#### 1.3 Zustand Store 추가
- [ ] `stores/useWorkspaceStore.ts` - 워크스페이스 상태
- [ ] `stores/useBrandStore.ts` - 브랜드 상태
- [ ] `stores/useBriefStore.ts` - 브리프 상태
- [ ] `stores/useProjectStore.ts` - 프로젝트 상태

#### 1.4 API 클라이언트
- [ ] `lib/api/workspace-api.ts` - Workspace CRUD
- [ ] `lib/api/brand-api.ts` - Brand CRUD
- [ ] `lib/api/brief-api.ts` - Brief CRUD
- [ ] `lib/api/project-api.ts` - Project CRUD

---

### Phase 2: 브랜드 OS 구현 (1주)
**목표:** 브랜드 정보 입력 및 DNA 생성 가능

#### 2.1 브랜드 인테이크 UI
- [ ] `components/brand/BrandIntakeForm.tsx`
  - URL 입력 필드
  - 파일 업로드 (PDF/이미지)
  - 텍스트 입력 (자유 형식)
  - "분석 시작" 버튼

#### 2.2 브랜드 키트 에디터
- [ ] `components/brand/BrandKitEditor.tsx`
  - 로고 업로드
  - 컬러 피커 (주 컬러, 보조 컬러)
  - 폰트 선택기
  - 톤 키워드 입력
  - 금지 표현 입력
  - 대표 메시지 입력

#### 2.3 Brand DNA 카드
- [ ] `components/brand/BrandDNACard.tsx`
  - tone, key_messages, target_audience 표시
  - dos/donts, sample_copies 표시
  - 편집 버튼 (BrandKitEditor로 이동)

#### 2.4 BrandAnalyzer 연동
- [ ] `lib/api/brand-analyzer-api.ts`
  - analyzeBrand(url, text, files) 함수
  - Backend `/api/v1/agents/brand-analyzer/execute` 연동

#### 2.5 기존 BrandKitTab 업데이트
- [ ] 현재 껍데기를 실제 BrandKitEditor로 교체
- [ ] Workspace Context 연동

---

### Phase 3: 브리프 관리 구현 (1주)
**목표:** 브리프 입력/편집 가능

#### 3.1 브리프 에디터
- [ ] `components/brief/BriefEditor.tsx`
  - 목표 입력
  - 타겟 입력
  - 인사이트 입력
  - 주요 메시지 입력
  - 채널 선택 (체크박스)
  - 예산 입력
  - 기간 입력
  - KPI 입력
  - 저장/수정 버튼

#### 3.2 브리프 뷰어
- [ ] `components/brief/BriefViewer.tsx`
  - 읽기 전용 브리프 표시
  - "편집" 버튼 → BriefEditor 모드 전환

#### 3.3 Strategist 대화형 보완
- [ ] `components/brief/BriefFieldOptimizer.tsx`
  - 누락 필드 감지
  - "이 필드를 채워주세요" 질문 생성
  - Chat 인터페이스로 대화
  - 응답을 Brief에 자동 반영

#### 3.4 Brief API
- [ ] `lib/api/brief-api.ts`
  - createBrief(projectId, briefInput)
  - updateBrief(briefId, briefInput)
  - getBrief(briefId)
  - optimizeBriefField(briefId, field) - Strategist 연동

---

### Phase 4: 멀티 채널 생성 구현 (1.5주)
**목표:** 브리프 기반으로 여러 채널 동시 생성

#### 4.1 멀티 채널 생성기 UI
- [ ] `components/generator/MultiChannelSelector.tsx`
  - 채널 체크박스 (상품상세, SNS, 배너, 덱)
  - 각 채널별 옵션 (사이즈, 포맷 등)
  - "모두 생성" 버튼

#### 4.2 생성 진행 상황 UI
- [ ] `components/generator/GenerationProgress.tsx`
  - 채널별 진행률 (0%, 50%, 100%)
  - 로딩 스피너
  - 에러 표시
  - "생성 완료된 것만 보기" 버튼

#### 4.3 채널별 프리뷰
- [ ] `components/generator/ChannelPreviewGrid.tsx`
  - 생성된 채널들을 그리드로 표시
  - 각 카드에 채널명, 썸네일, "편집" 버튼
  - "편집" → Canvas Studio로 이동

#### 4.4 멀티 채널 API
- [ ] `lib/api/multi-channel-api.ts`
  - generateMultiChannel(briefId, channels[]) 함수
  - Promise.all로 병렬 생성
  - 각 채널별 결과를 배열로 반환

#### 4.5 기존 ChatPanel 리팩토링
- [ ] kind 선택을 멀티 선택으로 확장
- [ ] 또는 ChatPanel은 단일 생성 전용으로 유지하고 별도 페이지 생성

---

### Phase 5: Canvas ↔ Chat 양방향 연동 (0.5주)
**목표:** Canvas에서 선택한 요소를 Chat에 전달

#### 5.1 Canvas Context Hook
- [ ] `hooks/useCanvasContext.ts`
  - getSelectedElementInfo() - 타입, 텍스트, 위치, 크기 반환
  - getActivePageInfo() - 페이지 전체 정보 반환

#### 5.2 Chat Store 업데이트
- [ ] `stores/useChatStore.ts`
  - canvasContext 필드 추가
  - setCanvasContext(context) 함수 추가
  - sendMessage 시 context를 함께 전송

#### 5.3 RightDock ChatTab 업데이트
- [ ] Canvas 선택 변경 감지
- [ ] 선택된 요소 정보를 Chat에 자동 표시
- [ ] "선택된 요소: 텍스트 '...' " 같은 힌트

#### 5.4 Backend Payload 수정
- [ ] Chat API 호출 시 canvas_context 필드 추가
- [ ] Backend가 이를 활용하도록 요청 (B팀 협업)

---

### Phase 6: Asset Library & Template (1주)
**목표:** 자산 업로드 및 템플릿 사용 가능

#### 6.1 Asset 업로더
- [ ] `components/asset/AssetUploader.tsx`
  - 드래그 앤 드롭
  - 파일 선택
  - 업로드 진행률
  - 태그 입력

#### 6.2 Asset 갤러리
- [ ] `components/asset/AssetGallery.tsx`
  - 그리드 뷰
  - 썸네일 표시
  - 클릭 시 Canvas에 추가

#### 6.3 Template 갤러리
- [ ] `components/template/TemplateGallery.tsx`
  - 카테고리별 템플릿 표시
  - 프리뷰 모달
  - "사용하기" 버튼

#### 6.4 Template 적용
- [ ] `components/template/TemplateApplier.tsx`
  - 템플릿 JSON을 Canvas에 로드
  - 브랜드 컬러/폰트 자동 교체

#### 6.5 기존 Tab 업데이트
- [ ] UploadTab → AssetUploader 통합
- [ ] PhotosTab → AssetGallery (타입: 이미지) 통합
- [ ] ElementsTab → TemplateGallery (타입: 요소) 통합

---

### Phase 7: Export 구현 (1주)
**목표:** PNG, PDF, PPTX, HTML Export

#### 7.1 PDF Export
- [ ] `lib/export/pdf-exporter.ts`
  - jsPDF 사용
  - Canvas → Image → PDF 변환
  - 페이지 단위 Export

#### 7.2 PPTX Export
- [ ] `lib/export/pptx-exporter.ts`
  - PptxGenJS 사용
  - Canvas JSON → PPTX Slide 변환
  - 텍스트, 이미지, 도형 변환

#### 7.3 HTML Export
- [ ] `lib/export/html-exporter.ts`
  - 상품상세페이지용 HTML 생성
  - 인라인 CSS
  - 반응형 레이아웃

#### 7.4 Export UI
- [ ] `components/export/ExportModal.tsx`
  - 포맷 선택 (PNG, PDF, PPTX, HTML)
  - 파일명 입력
  - 사이즈/해상도 옵션
  - "다운로드" 버튼

#### 7.5 TopToolbar 업데이트
- [ ] "Export" 버튼 추가
- [ ] ExportModal 열기

---

### Phase 8: Meeting AI 통합 (Optional - P1)
**목표:** E2E #2 시나리오 지원

#### 8.1 Meeting Upload UI
- [ ] `components/meeting/MeetingUpload.tsx`
  - 오디오/비디오 파일 업로드
  - 텍스트 메모 입력
  - "분석 시작" 버튼

#### 8.2 Meeting Summary UI
- [ ] `components/meeting/MeetingSummary.tsx`
  - 요약 표시
  - 안건 리스트
  - 결정 사항
  - 액션 아이템
  - "브리프 생성" 버튼

#### 8.3 Meeting API
- [ ] `lib/api/meeting-api.ts`
  - uploadMeeting(file, text) 함수
  - getMeetingSummary(meetingId) 함수
  - createBriefFromMeeting(meetingId) 함수

#### 8.4 라우팅 추가
- [ ] `app/workspace/[id]/meeting/page.tsx` - Meeting 목록
- [ ] `app/workspace/[id]/meeting/[meetingId]/page.tsx` - Meeting 상세

---

## 📐 아키텍처 원칙

### 1. 데이터 흐름
```
Workspace → Project → Brief → Multi-Channel Generate → Canvas Studio → Export
                ↓
             Brand Kit (모든 단계에서 참조)
```

### 2. 라우팅 구조
```
/workspace                          워크스페이스 목록
/workspace/[id]                     워크스페이스 대시보드
/workspace/[id]/brand               브랜드 키트
/workspace/[id]/meeting             Meeting 목록
/workspace/[id]/meeting/[mid]       Meeting 상세
/workspace/[id]/project/[pid]       프로젝트 대시보드
/workspace/[id]/project/[pid]/brief 브리프
/workspace/[id]/project/[pid]/generate 멀티 채널 생성
/studio/v3?projectId=xxx            Canvas Studio (프로젝트 컨텍스트)
```

### 3. Zustand Store 구조
```typescript
useWorkspaceStore     - 워크스페이스 전역 상태
useBrandStore         - 브랜드 키트 상태
useProjectStore       - 현재 프로젝트 상태
useBriefStore         - 현재 브리프 상태
useCanvasStore        - Canvas 상태 (기존)
useChatStore          - Chat 상태 (기존)
useLeftPanelStore     - Left Panel 상태 (기존)
useTabsStore          - Tab 상태 (기존)
```

### 4. API 클라이언트 구조
```
lib/api/
  workspace-api.ts    - Workspace CRUD
  brand-api.ts        - Brand CRUD
  brand-analyzer-api.ts - BrandAnalyzer Agent
  meeting-api.ts      - Meeting AI
  brief-api.ts        - Brief CRUD
  project-api.ts      - Project CRUD
  multi-channel-api.ts - Multi-Channel Generator
  strategist-api.ts   - Strategist (기존)
  reviewer-api.ts     - Reviewer (기존)
  generator.ts        - Single Channel (기존)
  asset-api.ts        - Asset Library
  template-api.ts     - Template System
```

---

## 🎯 완성 기준 (Definition of Done)

### MVP v1.0 완성 조건
1. ✅ 워크스페이스를 생성하고 브랜드 키트를 입력할 수 있다
2. ✅ 브리프를 작성하고 편집할 수 있다
3. ✅ 브리프 기반으로 상품상세+SNS+배너를 동시에 생성할 수 있다
4. ✅ 생성된 산출물을 Canvas에서 편집할 수 있다 (기존 완성)
5. ✅ 편집한 결과를 PNG, PDF로 Export 할 수 있다
6. ✅ Reviewer가 모든 생성 결과에 점수를 매기고 리스크를 표시한다 (기존 완성)
7. ✅ Canvas에서 선택한 요소를 Chat에 전달하여 수정 요청할 수 있다

### 검증 시나리오
```
1. 워크스페이스 "스타트업 A" 생성
2. 브랜드 키트 입력 (로고, 컬러, 톤)
3. 프로젝트 "신제품 런칭" 생성
4. 브리프 작성 (목표, 타겟, 메시지, 채널)
5. 멀티 채널 생성 (상세, SNS, 배너)
6. Reviewer 점수 확인
7. Canvas에서 배너 헤드라인 수정
8. Chat으로 "이 헤드라인을 더 임팩트 있게" 요청
9. 수정된 결과 확인
10. PDF Export
```

---

## 📅 예상 일정

| Phase | 내용 | 예상 기간 | 우선순위 |
|-------|------|-----------|----------|
| Phase 1 | 데이터 아키텍처 & 라우팅 | 1주 | P0 |
| Phase 2 | 브랜드 OS | 1주 | P0 |
| Phase 3 | 브리프 관리 | 1주 | P0 |
| Phase 4 | 멀티 채널 생성 | 1.5주 | P0 |
| Phase 5 | Canvas ↔ Chat 연동 | 0.5주 | P1 |
| Phase 6 | Asset & Template | 1주 | P1 |
| Phase 7 | Export | 1주 | P0 |
| Phase 8 | Meeting AI (Optional) | 1주 | P1 |

**총 예상 기간:** 7주 (P0만) ~ 8주 (P1 포함)

---

## 🚀 다음 단계

1. **이 문서를 팀과 공유하여 우선순위 합의**
2. **Phase 1부터 순차 진행**
3. **각 Phase마다 Backend 팀과 API 스펙 확인**
4. **완성된 Phase는 MAIN_EDITOR_PATH.md에 히스토리 기록**

---

## 📝 참고 문서

- [MAIN_EDITOR_PATH.md](../MAIN_EDITOR_PATH.md) - 에디터 경로 가이드
- [V3_LAYOUT_SPECIFICATION.md](./V3_LAYOUT_SPECIFICATION.md) - Canvas Studio 레이아웃 스펙
- Backend: B_TEAM_NEXT_STEPS_2025-11-23.md
- 마스터 PRD (사용자 제공)

---

**작성자:** C팀 (Frontend Team)
**최종 수정:** 2025-11-24
