# Sparklio Editor v2.0 — Implementation Roadmap

**작성일**: 2025-11-19
**버전**: 2.0.0
**전략**: "메뉴 하나씩 성공시키기"

---

## 📋 목차

1. [구현 전략](#구현-전략)
2. [Phase 1: Canvas Studio](#phase-1-canvas-studio-에디터-심장)
3. [Phase 2: Spark Chat](#phase-2-spark-chat-브리프-→-에디터)
4. [Phase 3: Meeting AI](#phase-3-meeting-ai-회의-→-에디터)
5. [Phase 4: Asset Library](#phase-4-asset-library-에셋-관리)
6. [Phase 5: Publish Hub](#phase-5-publish-hub-내보내기)
7. [Phase 6: Admin Console v1](#phase-6-admin-console-v1-수동-관리)
8. [Phase 7: Trend Engine](#phase-7-trend-engine-자동-학습)
9. [Phase 8: Insight Radar](#phase-8-insight-radar-성과-분석)
10. [팀별 작업 분담](#팀별-작업-분담)

---

## 구현 전략

### 핵심 원칙

1. **메뉴 하나씩 성공시키기**: 각 Phase마다 "1차 성공 조건"을 명확히 정의
2. **순차적 의존성**: 뒤 Phase가 앞 Phase를 뜯지 않고 재사용
3. **최소 기능 먼저**: Level 1 성공 조건 달성 → 다음 Phase 진행
4. **백엔드-프론트엔드 병렬**: API 스펙 먼저 합의 → 동시 개발

### 전체 타임라인 (예상)

```
Week 1-3:   Phase 1 (Canvas Studio)
Week 4-5:   Phase 2 (Spark Chat)
Week 6-7:   Phase 3 (Meeting AI)
Week 8:     Phase 4 (Asset Library)
Week 9:     Phase 5 (Publish Hub)
Week 10:    Phase 6 (Admin Console v1)
Week 11-12: Phase 7 (Trend Engine)
Week 13:    Phase 8 (Insight Radar)
```

---

## Phase 1: Canvas Studio (에디터 심장)

### 왜 1번?

- 나머지 메뉴들이 모두 EditorDocument를 만들어 Editor로 보냄
- 이게 안정적이어야 Meeting AI / Spark Chat / 템플릿이 의미 있음

### ✅ 1차 성공 조건

```
[ ] Konva + Zustand 기반 Editor v2 작동
[ ] 페이지 로딩 / 저장 (백엔드 CRUD)
[ ] 텍스트 / 이미지 / 사각형 추가·이동·리사이즈·삭제
[ ] 선택 / 레이어 / Inspector 기본 속성 편집
[ ] 기존 Fabric.js 없이도 상품상세 1페이지 정도는 편하게 제작 가능
[ ] /editor 한 화면에서 작업 가능 (레이아웃 고정)
```

### 🔧 Frontend 작업 (A팀)

#### 1.1 Core Architecture (Week 1)

```
[ ] EditorStore (Zustand) 완성
    - document, activePageId, selectedIds, clipboard
    - zoom, pan, tool, panels
    - history (undo/redo with maxHistory: 50)
    - CRUD actions: loadDocument, saveDocument, updateObject, deleteObject

[ ] CanvasEngine (Konva) 완성
    - Konva Stage/Layer 렌더링
    - EditorStore 구독 → Konva 동기화
    - 드래그, 리사이즈, 회전 이벤트
    - 선택/다중선택 (Transformer)

[ ] EditorDocument 타입 정의
    - types/document.ts (EditorDocument, EditorPage, EditorObject)
    - types/design-tokens.ts (DesignTokens)
```

#### 1.2 UI Components (Week 2)

```
[ ] TopBar
    - 문서 제목 편집
    - Undo/Redo 버튼
    - Zoom 컨트롤 (+/- /Fit)
    - 도구 선택 (Select, Text, Shape, Image)

[ ] LeftPanel
    - Pages 탭 (페이지 목록, 추가/삭제/순서변경)
    - 접기/펼치기 버튼

[ ] Canvas
    - Konva Stage 컨테이너
    - Grid 표시 (옵션)
    - 스마트 가이드 (기본)

[ ] RightDock
    - Inspector 탭 (선택 객체 속성 편집)
    - Layers 탭 (계층 구조, 잠금/숨김)
    - 접기/펼치기 버튼
```

#### 1.3 Object Manipulation (Week 2-3)

```
[ ] Text Object
    - 더블클릭 → 인라인 편집
    - Inspector: fontSize, fontFamily, fontWeight, textAlign, fill

[ ] Image Object
    - 드래그 앤 드롭 업로드 (MinIO)
    - Inspector: fit (contain/cover/fill), opacity

[ ] Shape Object
    - 기본 도형: rect, circle, ellipse
    - Inspector: fill, stroke, strokeWidth, cornerRadius

[ ] Group/Ungroup
    - 다중 선택 → Ctrl+G (그룹)
    - 그룹 선택 → Ctrl+Shift+G (언그룹)
```

#### 1.4 Advanced Features (Week 3)

```
[ ] Alignment Tools
    - AlignmentToolbar: Left, Center, Right, Top, Middle, Bottom
    - Distribute Horizontally/Vertically

[ ] Smart Guides
    - 드래그 시 다른 객체와의 정렬선 표시
    - 스냅 거리: 5px

[ ] Keyboard Shortcuts
    - Ctrl+Z (Undo), Ctrl+Y (Redo)
    - Ctrl+C/V (Copy/Paste)
    - Delete (삭제)
    - Arrow keys (1px 이동)
```

### 🔧 Backend 작업 (B팀)

#### 1.1 Database Schema (Week 1)

```sql
-- documents 테이블
CREATE TABLE documents (
    id UUID PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    mode VARCHAR(50),
    brand_id UUID,
    content JSONB NOT NULL,  -- EditorDocument 전체
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_documents_brand_id ON documents(brand_id);
CREATE INDEX idx_documents_created_at ON documents(created_at DESC);
```

#### 1.2 API Endpoints (Week 1-2)

```
[ ] POST   /api/v1/documents
    Request: { title, mode, brandId?, content: EditorDocument }
    Response: { id, ...document }

[ ] GET    /api/v1/documents/:id
    Response: EditorDocument

[ ] PUT    /api/v1/documents/:id
    Request: { content: EditorDocument }
    Response: { success: true }

[ ] DELETE /api/v1/documents/:id
    Response: { success: true }

[ ] GET    /api/v1/documents?brandId=xxx&limit=20
    Response: { documents: [...] }
```

#### 1.3 MinIO Integration (Week 2)

```
[ ] 이미지 업로드 API
    POST /api/v1/upload/image
    - multipart/form-data
    - MinIO 'editor-images' 버킷에 저장
    - Response: { url: "https://minio.../image.jpg" }

[ ] 이미지 삭제 API (옵션)
    DELETE /api/v1/upload/image/:filename
```

---

## Phase 2: Spark Chat (브리프 → 에디터)

### 왜 2번?

- 서비스 아이덴티티: "채팅 기반 브리프 → 자동 산출물"
- AI가 뼈대를 만들어주는 에디터로 포지셔닝

### 🤖 연동 에이전트

**핵심 에이전트:**
- **PMAgent** (A): 워크플로우 계획 및 태스크 분배
- **StrategistAgent** (A): 캠페인 전략 및 구조 설계
- **CopywriterAgent** (B): 섹션별 카피 생성
- **EditorAgent** (D): EditorCommand[] 생성 및 EditorDocument 조립
- **LLMRouterAgent** (F): 모델 선택 및 비용 최적화

**에이전트 플로우:**
```
사용자 입력 → PMAgent (브리프 정리)
  → StrategistAgent (전략 수립)
  → CopywriterAgent (카피 생성)
  → EditorAgent (EditorDocument 변환)
  → Canvas Studio
```

**참고**: [008_AGENTS_INTEGRATION.md](./008_AGENTS_INTEGRATION.md#phase-2-spark-chat-brief--editor)

### ✅ 1차 성공 조건

```
[ ] /spark 페이지에서 브랜드/상품/목표/채널을 자연어로 입력
[ ] LLM이 간단한 브리프 + 구조 제안 생성
[ ] "초안 만들기" 버튼 → EditorDocument 생성 → 백엔드 저장
[ ] 자동으로 /editor?docId=xxx 이동, 문서 로드
[ ] 템플릿/트렌드 몰라도 됨 (기본 레이아웃 + 샘플 텍스트만)
[ ] PMAgent, StrategistAgent, CopywriterAgent, EditorAgent 연동
```

### 🔧 Frontend 작업 (A팀)

#### 2.1 Spark Chat UI (Week 4)

```
[ ] /spark 페이지 생성
    - 채팅 입력창 (자연어 브리프)
    - 메시지 리스트 (user/assistant)
    - "초안 만들기" 버튼

[ ] 브리프 입력 예시
    - "나이키 에어맥스 신제품 인스타그램 광고 만들어줘"
    - "5만원 할인 이벤트 블로그 포스트 작성해줘"

[ ] LLM 응답 표시
    - 콘텐츠 타입: "Instagram Ad"
    - 제안 구조: "헤드라인, 제품 이미지, CTA 버튼"
```

#### 2.2 Editor 연동 (Week 4-5)

```
[ ] "초안 만들기" 버튼 클릭
    - POST /api/v1/chat/generate-document
    - Response: { documentId, document: EditorDocument }

[ ] /editor?docId=xxx 이동
    - URL 파라미터에서 docId 추출
    - GET /api/v1/documents/:id
    - EditorStore.loadDocument(document)
```

### 🔧 Backend 작업 (B팀)

#### 2.1 Chat Analysis (Week 4)

```python
[ ] POST /api/v1/chat/analyze
    Request: { message: "나이키 에어맥스 인스타그램 광고" }
    Response: {
        chatSessionId: "chat-123",
        contentType: "instagram-ad",
        suggestedStructure: [
            { role: "headline", suggestion: "신제품 출시" },
            { role: "product-image", suggestion: "제품 이미지 필요" },
            { role: "cta-button", suggestion: "지금 구매하기" }
        ]
    }

[ ] LLM 프롬프트 설계
    - System: "당신은 마케팅 브리프를 분석하는 전문가입니다"
    - User: 사용자 메시지
    - Output: JSON 형식
```

#### 2.2 Document Generation (Week 4-5)

```python
[ ] POST /api/v1/chat/generate-document
    Request: {
        chatSessionId: "chat-123",
        brandId?: "nike-kr"
    }
    Response: {
        documentId: "doc-456",
        document: EditorDocument
    }

[ ] 기본 템플릿 로직
    - contentType에 따라 기본 레이아웃 선택
    - Instagram Ad → 1080x1080, 좌측 이미지 + 우측 텍스트
    - 각 Object에 role 할당
    - 샘플 텍스트 채우기 (LLM 생성)
```

---

## Phase 3: Meeting AI (회의 → 에디터)

### 왜 3번?

- Spark Chat이 "텍스트 브리프 출발"
- Meeting AI는 "음성/회의 출발" 경로
- 둘 다 Editor로 떨어지므로 Canvas + Spark 먼저 필요

### 🤖 연동 에이전트

**핵심 에이전트:**
- **MeetingAIAgent** (D): 회의록 분석 및 섹션 추출 (신규)
- **StrategistAgent** (A): 회의 결정사항 → 캠페인 전략 매핑
- **CopywriterAgent** (B): 회의 내용 → 역할별 텍스트 변환
- **LayoutDesignerAgent** (C): 레이아웃 제안 (계획)
- **EditorAgent** (D): MeetingToEditorCommand 프로토콜 실행

**에이전트 플로우:**
```
회의록 업로드 → MeetingAIAgent (ASR + 섹션 파싱)
  → StrategistAgent (전략 매핑)
  → CopywriterAgent (콘텐츠 초안)
  → EditorAgent (EditorDocument 생성)
  → Canvas Studio
```

**참고**: [008_AGENTS_INTEGRATION.md](./008_AGENTS_INTEGRATION.md#phase-3-meeting-ai-meeting--editor)

### ✅ 1차 성공 조건

```
[ ] Meeting 메뉴에서 음성 파일 업로드 → meetingId 발급
[ ] 간단 요약(5-10줄) + 섹션 리스트 보여주기
[ ] "이 회의로 상품상세 만들기" 버튼 → EditorDocument 생성
[ ] /editor?docId=... 이동
[ ] 템플릿/트렌드 반영 안 해도 됨 (2차 목표)
[ ] MeetingAIAgent, StrategistAgent, CopywriterAgent, EditorAgent 연동
```

### 🔧 Frontend 작업 (A팀)

#### 3.1 Meeting UI (Week 6)

```
[ ] /meetings 페이지 생성
    - 음성 파일 업로드 (drag & drop)
    - 회의록 텍스트 입력 (옵션)
    - "분석 시작" 버튼

[ ] 분석 결과 표시
    - 회의 요약 (5-10줄)
    - 섹션 리스트 (headline, body, cta 등)
    - "문서 생성" 버튼 (contentType 선택 가능)
```

#### 3.2 Editor 연동 (Week 6)

```
[ ] "문서 생성" 버튼 클릭
    - POST /api/v1/meetings/generate-document
    - Response: { documentId, document }

[ ] /editor?docId=xxx 이동
```

### 🔧 Backend 작업 (B팀)

#### 3.1 Speech-to-Text (Week 6)

```python
[ ] POST /api/v1/meetings/upload
    Request: multipart/form-data (audio file)
    - Whisper API 호출 (음성 → 텍스트)
    - Meeting 레코드 생성 (transcript 저장)
    Response: { meetingId, transcript }
```

#### 3.2 Meeting Analysis (Week 6-7)

```python
[ ] POST /api/v1/meetings/analyze
    Request: { meetingId }
    - LLM으로 회의록 분석
    - 콘텐츠 타입 분류
    - 섹션별 추출 (role + content)
    Response: {
        meetingId,
        summary: { contentType, sections: [...] }
    }

[ ] LLM 프롬프트
    - "회의록을 분석하여 구조화된 콘텐츠를 추출하세요"
    - Output: JSON { contentType, sections: [{ role, content }] }
```

#### 3.3 Document Generation (Week 7)

```python
[ ] POST /api/v1/meetings/generate-document
    Request: { meetingId, templateId? }
    - 회의 분석 결과 로드
    - 기본 템플릿 선택 (contentType 기반)
    - 회의록 내용 → 각 Object에 매핑
    - EditorDocument 생성 및 저장
    Response: { documentId, document }
```

---

## Phase 4: Asset Library (에셋 관리)

### 왜 4번?

- 에디터가 돌아가고, Spark/Meeting이 문서를 만드는데
- 이미지/로고/브랜드 자산이 불편하면 실제 사용성 떨어짐

### ✅ 1차 성공 조건

```
[ ] 이미지 업로드 → MinIO 저장 → URL 리턴
[ ] 에디터 우측/좌측 패널에서 Asset 목록 조회
[ ] Drag&Drop 또는 클릭으로 캔버스에 이미지 삽입
[ ] 템플릿은 수동 등록만 (자동 생성은 Phase 7)
```

### 🔧 Frontend 작업 (A팀)

#### 4.1 Assets Tab (Week 8)

```
[ ] RightDock/tabs/AssetsTab.tsx 생성
    - 이미지 목록 (썸네일 그리드)
    - 업로드 버튼 (파일 선택 또는 drag & drop)
    - 검색/필터 (브랜드별, 날짜별)

[ ] 이미지 삽입
    - 이미지 클릭 → 캔버스에 ImageObject 추가
    - 또는 드래그 → 캔버스에 드롭
```

#### 4.2 Templates Tab (Week 8)

```
[ ] LeftPanel/tabs/TemplatesTab.tsx 생성
    - 템플릿 목록 (카테고리별)
    - 템플릿 미리보기 (썸네일)
    - "사용하기" 버튼 → 새 문서 생성
```

### 🔧 Backend 작업 (B팀)

#### 4.1 Assets API (Week 8)

```python
[ ] GET /api/v1/assets?brandId=xxx&type=image
    Response: { assets: [{ id, url, name, createdAt }] }

[ ] POST /api/v1/assets
    Request: multipart/form-data
    - MinIO 업로드
    - DB에 asset 레코드 생성
    Response: { id, url }

[ ] DELETE /api/v1/assets/:id
```

#### 4.2 Templates API (Week 8)

```python
[ ] GET /api/v1/templates?category=social-ad
    Response: { templates: [TemplateDefinition] }

[ ] GET /api/v1/templates/:id
    Response: TemplateDefinition

[ ] POST /api/v1/templates (Admin only)
    Request: TemplateDefinition
    - 수동 템플릿 등록
```

---

## Phase 5: Publish Hub (내보내기)

### 왜 5번?

- "만들 수는 있는데, 쓰려면 export 필요"
- 최소한 이미지/PNG, PDF 내보내야 실전 사용 가능

### ✅ 1차 성공 조건

```
[ ] Editor 상단 또는 Publish 메뉴에서:
    - 현재 페이지 → PNG 다운로드
    - 전체 페이지 → PDF 다운로드
    - 발행 이력 간단 저장 (docId, 날짜, 타입)
```

### 🔧 Frontend 작업 (A팀)

#### 5.1 Export UI (Week 9)

```
[ ] TopBar에 "Export" 버튼 추가
    - PNG (현재 페이지)
    - PDF (전체 페이지)
    - 다운로드 진행 상태 표시

[ ] Konva Stage → Image 변환
    - stage.toDataURL() → PNG
    - 각 페이지 이미지 → PDF 생성 (jsPDF)
```

#### 5.2 Publish History (Week 9)

```
[ ] /publish 페이지 (옵션)
    - 발행 이력 목록
    - 각 발행 항목: 날짜, 문서명, 타입, 다운로드 링크
```

### 🔧 Backend 작업 (B팀)

#### 5.1 Export API (Week 9)

```python
[ ] POST /api/v1/documents/:id/export
    Request: { format: "png" | "pdf", pageIds?: [...] }
    - Konva JSON → 서버 렌더링 (node-canvas 또는 Playwright)
    - PNG/PDF 생성
    - MinIO 저장 또는 직접 Response
    Response: { url: "..." } 또는 Binary

[ ] 발행 이력 저장
    - publishes 테이블
    - documentId, format, publishedAt, url
```

---

## Phase 6: Admin Console v1 (수동 관리)

### 왜 6번?

- 지금까지는 "유저가 잘 쓰는지"만 봄
- Admin이 있어야 Template / Trend / 모델 정책 관리 가능
- 수동 템플릿/브랜드 토큰 관리만으로도 의미 있음

### ✅ 1차 성공 조건

```
[ ] 브랜드/프로젝트 리스트 & 기본 설정 편집
[ ] 브랜드 컬러/폰트/로고 업로드
[ ] 템플릿 리스트
    - 수동 등록한 TemplateDefinition 목록
    - "에디터에서 열기" 버튼
```

### 🔧 Frontend 작업 (A팀)

#### 6.1 Admin Dashboard (Week 10)

```
[ ] /admin 페이지 생성
    - 브랜드 리스트 (테이블)
    - 프로젝트/캠페인 리스트
    - 통계 (문서 수, 발행 수)

[ ] /admin/brands/:id 페이지
    - 브랜드 기본 정보 편집
    - DesignTokens 편집 (색상, 폰트)
    - 로고 업로드

[ ] /admin/templates 페이지
    - 템플릿 목록 (카테고리별)
    - "새 템플릿 추가" → 수동 입력 폼
    - "에디터에서 열기" 버튼
```

### 🔧 Backend 작업 (B팀)

#### 6.1 Admin API (Week 10)

```python
[ ] GET /api/v1/admin/brands
[ ] POST /api/v1/admin/brands
[ ] PUT /api/v1/admin/brands/:id
[ ] DELETE /api/v1/admin/brands/:id

[ ] GET /api/v1/admin/templates
[ ] POST /api/v1/admin/templates
[ ] PUT /api/v1/admin/templates/:id
[ ] DELETE /api/v1/admin/templates/:id
```

---

## Phase 7: Trend Engine (자동 학습)

### 왜 이렇게 뒤?

- "데이터 쌓이면서 빛나는 장기 기능"
- 앞에 것들이 돌아가야 "뭘 크롤링하고, 어떤 포맷 필요한지" 감 잡힘

### 🤖 연동 에이전트 (5-Stage Pipeline)

**핵심 에이전트 (E 계열):**
- **TrendCollectorAgent**: 마케팅 데이터 크롤링 (Instagram, TikTok, Pinterest)
- **DataCleanerAgent**: HTML 제거, 중복 제거, OCR 정제
- **EmbedderAgent**: 텍스트/이미지 임베딩 생성
- **TrendAgent**: 레이아웃 패턴 추출 및 TrendPattern 생성
- **TemplateAgent**: TrendPattern → TemplateDefinition 자동 생성
- **IngestorAgent**: PostgreSQL 저장 및 Redis 캐싱

**보조 에이전트:**
- **CopywriterAgent** (B): Placeholder 카피 생성
- **VisionDesignerAgent** (C): 이미지 스타일 가이드
- **SelfLearningAgent** (E): 브랜드 벡터 자동 조정
- **PerformanceAnalyzerAgent** (E): 성과 데이터 분석

**파이프라인 플로우:**
```
TrendCollectorAgent (크롤링)
  → DataCleanerAgent (정제)
  → EmbedderAgent (임베딩)
  → TrendAgent (패턴 분석)
  → TemplateAgent (템플릿 생성)
  → IngestorAgent (DB 저장)
  → 사용자 서비스에서 "트렌드 템플릿" 사용 가능
```

**참고**:
- [008_AGENTS_INTEGRATION.md](./008_AGENTS_INTEGRATION.md#phase-7-trend-engine-자동-학습)
- [009_TREND_ENGINE.md](./009_TREND_ENGINE.md) - 5단계 파이프라인 상세
- [AGENTS_SPEC.md](../../../../docs/PHASE0/AGENTS_SPEC.md) - TrendPipeline 섹션

### ✅ 1차 성공 조건 (내부용)

```
[ ] Admin 메뉴에서만 사용
[ ] 채널/시장 선택 → "트렌드 수집 실행" (수동 트리거)
[ ] TrendCollectorAgent → DataCleanerAgent → EmbedderAgent → TrendAgent 파이프라인 작동
[ ] TrendRecord/TrendPattern 목록 조회
[ ] "이 패턴으로 템플릿 3개 생성" → TemplateAgent 호출 → TemplateDefinition 생성
[ ] 생성된 템플릿은 EditorDocument 구조 (편집 가능)
[ ] 일반 유저 메뉴에는 노출 안 함 (실험용/내부 전용)
```

### 🔧 Frontend 작업 (A팀)

#### 7.1 Trend Admin UI (Week 11)

```
[ ] /admin/trends 페이지
    - Learning Plan 목록 (채널/시장/스케줄)
    - "수집 실행" 버튼 (수동 트리거)
    - TrendPattern 목록 (인기도 순)

[ ] /admin/trends/:id 페이지
    - 패턴 상세 (layoutPattern, popularityScore, sampleSources)
    - "템플릿 생성" 버튼 → count 입력
```

### 🔧 Backend 작업 (B팀)

#### 7.1 Trend Collector (Week 11)

```python
[ ] 데이터 수집 (009_TREND_ENGINE.md 참고)
    - Meta Ad Library API
    - TikTok Creative Center (Playwright)
    - Pinterest Trends
    - RawTrendData 저장

[ ] POST /api/v1/admin/trends/collect
    Request: { source: "meta_ad_library", market: "kr" }
    - Collector 실행 (비동기)
    Response: { taskId, status: "running" }
```

#### 7.2 Pattern Mining (Week 11-12)

```python
[ ] Cleaner & Normalizer
    - RawTrendData → CleanedTrendData
    - 이미지 분석, 레이아웃 타입 분류

[ ] Pattern Miner
    - CleanedTrendData → TrendPattern
    - 인기도 점수 계산

[ ] GET /api/v1/admin/trends/patterns?market=kr&channel=instagram
    Response: { patterns: [TrendPattern] }
```

#### 7.3 Template Generator (Week 12)

```python
[ ] POST /api/v1/admin/trends/:patternId/generate-templates
    Request: { count: 3, brandId? }
    - TrendPattern → TemplateDefinition 변환
    - EditorDocument 생성 (role/position 반영)
    Response: { templates: [TemplateDefinition] }

[ ] 생성된 템플릿은 Admin에서만 조회 가능
    - 검증 후 일반 유저에게 공개
```

---

## Phase 8: Insight Radar (성과 분석)

### 왜 제일 마지막?

- 데이터가 쌓여야 의미 있음
- Publish 안 되면 "빈 그래프"만 보게 됨

### ✅ 1차 성공 조건

```
[ ] 외부 광고/분석 연동 없어도 됨
[ ] 발행 횟수, 유형, 문서/템플릿 사용 빈도 보여주기
[ ] 나중에 광고/분석 API 붙이면서 CTR/CVR, 매출 등 확장
```

### 🔧 Frontend 작업 (A팀)

#### 8.1 Insight Dashboard (Week 13)

```
[ ] /insights 페이지
    - 발행 통계 (일별, 월별)
    - 문서 타입별 분포 (pie chart)
    - 템플릿 사용 순위 (bar chart)
    - 브랜드별 활동 (테이블)
```

### 🔧 Backend 작업 (B팀)

#### 8.1 Analytics API (Week 13)

```python
[ ] GET /api/v1/insights/summary
    Response: {
        totalDocuments, totalPublishes,
        documentsByType: { "instagram-ad": 123, ... },
        topTemplates: [{ templateId, usageCount }]
    }

[ ] GET /api/v1/insights/performance?documentId=xxx
    - 성과 데이터 조회 (CTR, CVR, revenue)
    - 아직 외부 연동 없으면 null 반환
```

---

## 팀별 작업 분담

### A팀 (Frontend) 주요 책임

```
✅ Phase 1: Canvas Studio UI/UX 완성
✅ Phase 2: Spark Chat UI 및 Editor 연동
✅ Phase 3: Meeting AI UI 및 Editor 연동
✅ Phase 4: Asset Library UI (Assets/Templates 탭)
✅ Phase 5: Export UI 및 Publish History
✅ Phase 6: Admin Console UI (Brands/Templates 관리)
✅ Phase 7: Trend Admin UI (Learning Plans/Patterns)
✅ Phase 8: Insight Dashboard UI
```

### B팀 (Backend) 주요 책임

```
✅ Phase 1: Documents CRUD API, MinIO 이미지 업로드
✅ Phase 2: Chat Analysis/Generation API, LLM 통합
✅ Phase 3: Meeting Upload/Analysis/Generation API, Whisper 통합
✅ Phase 4: Assets/Templates API
✅ Phase 5: Export API (PNG/PDF 생성)
✅ Phase 6: Admin API (Brands/Templates CRUD)
✅ Phase 7: Trend Collector/Miner/Generator 파이프라인
✅ Phase 8: Insights/Analytics API
```

---

## 다음 단계

1. **각 팀이 Phase 1부터 시작**
2. **매 Phase 종료 시 "1차 성공 조건" 체크**
3. **성공 → 다음 Phase 진행**
4. **실패 → 해당 Phase 재작업**

---

**문서 버전**: v2.0.0
**마지막 업데이트**: 2025-11-19
