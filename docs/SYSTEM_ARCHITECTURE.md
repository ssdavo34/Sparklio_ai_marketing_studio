# SYSTEM_ARCHITECTURE.md

# Sparklio V4.3 — System Architecture (v1.1)

- 문서명: SYSTEM_ARCHITECTURE.md
- 버전: v1.1
- 작성일: 2025-11-15
- 작성자: SeongEon Park (PM), ChatGPT(설계 보조)
- 상태: Draft (P0 범위 확정용)

---

## 1. 목적 (Purpose)

이 문서는 **Sparklio V4.3 전체 시스템 구조**를 한눈에 보여주는 최상위 아키텍처 문서다.

- 개별 스펙 문서를 **하나의 흐름으로 연결**하고,
- P0에서 반드시 구현해야 할 **최소 기능 조합**을 정의하며,
- Admin / Data Pipeline / Generators / One-Page Editor / (향후) Video Editor 간의 관계를 명확히 한다.

### 1.1 문서 버전 관리 정책

- 이 문서는 **Living Document**로, 시스템 구조 변경 시 지속 업데이트된다.
- 주요 변경 시 버전 번호 증가:
  - v1.0 → v1.1: Minor (섹션 추가/보완)
  - v1.x → v2.0: Major (아키텍처 전면 개편)
- 변경 이력은 문서 끝의 **Changelog** 섹션에 기록한다.
- Git 커밋 메시지 권장 형식:
  `docs(arch): [v1.1] Add infra/security/DoD sections`

---

## 2. 문서 지도 (Document Map)

### 2.1 제품 요구사항 계층

- `PRD_V1.0.md`
  - 최초 제품 요구사항 (수정하지 않는 히스토리 문서)
- `PRD_ADDENDUM_V4.3.md` *(추가 예정)*
  - V4.3에서 추가된 주요 기능 요구사항
    - Meeting AI
    - 10. 마케팅자료 자동 수집·학습
    - 11. 마케팅 템플릿 자동 생성기
    - 12. (유저/운영자 분리된) 대시보드/Analytics
    - Chat-First One-Page Studio 규정

### 2.2 아키텍처 & 스펙 계층

본 문서 `SYSTEM_ARCHITECTURE.md`는 아래 4개 스펙의 상위 개념이다.

- `ADMIN_CONSOLE_SPEC.md`
  → **운영/내부 도구** (Users, Jobs, Data Lab, Templates, Feature Flags 등)

- `DATA_PIPELINE_ARCHITECTURE.md`
  → **데이터·자기학습 엔진** (크롤링, 정제, 태깅, RAG, 템플릿 후보 생성 등)

- `ONE_PAGE_EDITOR_SPEC.md`
  → **사용자용 중앙 에디터** (이미지/텍스트 레이아웃 편집 도구)

- `GENERATORS_SPEC.md`
  → **생성 엔진** (Brand Kit, Product Detail, SNS, Presentation, Ad/Video Script 등)

추가 예정:

- `VIDEO_EDITOR_SPEC.md` *(P1)*
  → 영상 편집/타임라인 중심 에디터 (현재 문서에서는 범위 밖으로 둔다)

### 2.3 기타 기술·운영 문서

- `LLM_ROUTER_POLICY.md`
  - SmartRouter 정책, 모델 선택/비용 관리
- `BRAND_LEARNING_ENGINE.md`
  - 브랜드 학습/브랜드 RAG
- `INTEGRATION_LAYER.md`
  - 외부 채널(WordPress, SNS, Ads 플랫폼) 연동
- `TEAM_RESPONSIBILITIES.md`, `COLLABORATION_WORKFLOW.md`
  - 팀 작업 분장 및 협업 프로세스

---

## 3. 전체 플로우 개요 (End-to-End Flow)

### 3.1 상위 사용자 플로우

```mermaid
flowchart TB
    subgraph User Flow
        U[User (Marketer/Owner)] --> Chat[Chat Interface (Generators)]
        Chat --> Gen[Generators]
        Gen --> Ed[One-Page Editor]
        Ed --> Pub[Publish / Export]
    end

    subgraph Data Pipeline (Offline / Background)
        Crawl[Crawler] --> Clean[Cleaner]
        Clean --> Tag[Tagger]
        Tag --> DB[(PostgreSQL - Marketing Docs)]
        DB --> Embed[Embedder]
        Embed --> Vec[(Vector DB / pgvector)]
        Tag --> Pattern[Pattern Miner]
        Pattern --> TplGen[Template Generator]
        TplGen --> TplDB[(template_candidates / templates)]
    end

    subgraph Admin Operations
        Admin[Admin Console] --> Approve[Template Approval]
        Approve --> TplDB
        Admin --> CrawlCtrl[Crawl Trigger]
        CrawlCtrl --> Crawl
    end

    TplDB --> Gen
    Vec --> Gen
    DB --> Gen
```

**핵심 포인트**

- 유저는 `/app` 에서 **Chat → Generator → One-Page Editor → Publish** 흐름을 경험한다.
- **Data Pipeline**은 백그라운드에서 마케팅 데이터를 수집/학습하여:
  - RAG 인덱스(Vec),
  - 템플릿 후보(TplDB)를 생성한다.
- **Admin Console**은:
  - 크롤링/인덱싱을 관리하고,
  - 템플릿을 승인하며,
  - 이 승인된 템플릿과 데이터가 **다음 Generation 요청에 반영**되도록 제어한다.

---

## 4. 런타임 & 인프라 아키텍처

### 4.1 컴포넌트 개요 (Logical)

- Frontend
  - `/` : 마케팅 랜딩 페이지
  - `/app` : Chat-First One-Page Studio (C팀 담당)
  - `/admin` : Admin Console (향후 C팀 담당, P0는 Shell 수준)

- Backend API (FastAPI)
  - Generation API (Generators)
  - Editor API (문서 저장/로드)
  - Admin API (Users, Templates, Data Lab, Jobs 등)

- Worker / Scheduler
  - Generators 실행(LLM 호출, 에이전트 오케스트레이션)
  - Data Pipeline 크롤링/배치 처리 (Celery + Celery Beat)

- Storage
  - PostgreSQL : 구조화 데이터 (users, jobs, documents, templates, marketing_docs 등)
  - pgvector / Vector DB : RAG 인덱스
  - MinIO : 이미지/원본 문서/에디터 JSON 백업

- LLM & 외부 서비스
  - SmartRouter를 통해 GPT / Gemini / Open-Source LLM 선택
  - OCR/컴퓨터 비전/API 등 (이미지 기반 기능은 P1부터)

### 4.2 Physical Infrastructure (3-Node Hybrid)

| Node | Role | Services | IP |
|------|------|----------|-----|
| **Mac mini** | Backend/DB/Storage | PostgreSQL, Redis, MinIO, FastAPI, Celery Worker, Superset | 100.123.51.5 |
| **Desktop (GPU)** | AI Workers | Ollama (LLM), ComfyUI (Image/Video Generation) | 100.120.180.42 |
| **Laptop** | Frontend Dev | Next.js Dev Server (로컬 개발용, 실서비스는 Mac mini) | 192.168.0.101 |

**동기화 정책 (코드/배포)**

- 주 개발 디렉토리: 외장 SSD 또는 K:/ (Windows)
- A팀이 관리하는 `sync_to_macmini.sh` 스크립트로:
  - SSD(K:/ 또는 외장) → Mac mini로 코드 동기화
  - Mac mini에서 실제 서비스/배포 수행
- **원칙**:
  - Git remote에 push/pull 하는 주체는 Mac mini/개발 노트북
  - SSD 자체를 Git origin처럼 사용하는 행위 금지
  - "어느 서버에서 무엇이 실행되는지" 명확한 표로 관리

### 4.3 Security & Authentication

#### 4.3.1 /app (사용자 영역)

- 인증:
  - JWT 기반 (access_token + refresh_token)
- 로그인/회원가입:
  - Email + Password
  - (P1) OAuth (Google, Naver 등) 확장
- Role:
  - `user` (기본)
  - `premium` (유료 플랜, 향후 추가)

#### 4.3.2 /admin (운영자 영역)

- 인증:
  - 별도 Admin 계정 (내부 운영자 전용)
- Role:
  - P0: `SuperAdmin` 1종
  - P1: `OpsAdmin`, `DataAdmin` 등 세분화 가능
- 접근 제한 (P0 기본 가이드):
  - 최소한 비공개 URL + 별도 계정 관리
  - (선택) 특정 IP 대역 Whitelist
- Audit Log:
  - 모든 주요 Admin 액션 기록:
    - 템플릿 승인/수정
    - Feature Flag 변경
    - 유저 플랜/크레딧 조정
  - 테이블: `admin_audit_log`

#### 4.3.3 API 보안 공통 정책

- HTTPS Only (Production)
- Rate Limiting:
  - 유저별 100 req/min (Redis 기반)
- CORS:
  - 승인된 Frontend 도메인만 허용

### 4.4 Error Handling & Monitoring

#### 4.4.1 에러 분류

- **User Error**
  - 잘못된 입력, 권한 없음, 유효성 실패 등
  - HTTP 4xx 에러, 사용자 친화적 메시지 제공

- **System Error**
  - DB 연결 실패, LLM API 에러, 외부 서비스 장애 등
  - HTTP 5xx 에러, 내부적으로 로그 기록 및 알림

- **Critical Error**
  - 데이터 손실 가능성, 보안 침해 의심 상황 등
  - Slack/Webhook 알림 + Admin 대시보드에 표시

#### 4.4.2 로깅 정책

- 로그 레벨: `DEBUG / INFO / WARNING / ERROR / CRITICAL`
- 저장 위치:
  - Application Log → PostgreSQL `logs` 테이블 또는 중앙 로그 테이블
  - System Log → Mac mini `/var/log/sparklio/` 하위
- 보관 기간:
  - P0: 30일
  - P1: 90일 이상 + 아카이빙 전략 수립

#### 4.4.3 모니터링 (P0)

- Prometheus Metrics:
  - HTTP 요청 수/레이턴시
  - LLM 호출 수/비용
  - Worker Job 처리 성능

- Admin Console `/admin/system-health`:
  - 노드 Alive/Down, 기본 리소스 사용량 요약 표시

- P1:
  - Grafana 대시보드 및 Alert Rule 추가

---

## 5. Admin ↔ Data Pipeline ↔ Generators ↔ Editor 연결

### 5.1 템플릿 라이프사이클 (Admin → Generators)

#### 5.1.1 상태 흐름

1. Data Pipeline 또는 운영자 수동 입력으로 **템플릿 후보 생성**
   - 테이블: `template_candidates` (status: Draft)

2. Admin Console `/admin/templates`에서 검수
   - 내용 수정 / 메타데이터(업종/채널/페르소나) 태깅

3. Admin이 Status를 `Approved`로 변경
   - `templates` 테이블로 승격 또는 동기화

4. Generators는 항상 `templates` 테이블의 **Approved 템플릿만** 참조

#### 5.1.2 캐싱·동기화 정책 (v1.0)

- 템플릿 캐시 키:
  `template_cache:{kind}:{industry}:{channel}:{locale}`

- 플로우:
  1. Admin이 템플릿 승인/수정
  2. Backend:
     - `templates` 테이블 업데이트
     - 관련 캐시 키 삭제 (Redis `DEL template_cache:*`)
  3. Generators:
     - 다음 Generation 요청 시 캐시 미스 발생
     - DB에서 최신 Approved 템플릿 조회 → 캐시에 다시 적재
  4. 이후 TTL 동안 캐시 사용 (기본 300초, 환경변수/Flag로 조절)

#### 5.1.3 Feature Flags와의 연동

Generator는 템플릿 외에도 **Feature Flags**를 통해 동작을 제어받는다.

**예시 플래그**

- `GEN_PRODUCT_DETAIL_ENABLED`
  → Product Detail Generator 활성화 여부
- `GEN_SNS_LAYOUT_TEMPLATES`
  → SNS Generator에서 Layout Template 사용 여부
- `TEMPLATE_CACHE_TTL`
  → 템플릿 캐시 유효 시간(초)

**플로우**

1. Admin이 `/admin/feature-flags`에서 플래그 변경
2. Backend:
   - Redis에 `feature_flag:{flag_name}` 형태로 값 업데이트
3. Generator:
   - 매 요청 시 또는 TTL(예: 60초)마다 플래그 캐시를 갱신
   - 플래그가 OFF인 Generator:
     - "Coming Soon" 또는 "내부 테스트 중" 메시지를 반환
4. 플래그 값은 `LLM_ROUTER_POLICY.md`와 함께 운영 정책 문서에서 관리

---

### 5.2 Generators ↔ Data Pipeline (RAG/패턴 활용)

- Generators는 다음 세 가지 데이터를 Data Pipeline에서 가져와 사용한다.

1. **RAG 인덱스 (Vec)**
   - 업종/채널/페르소나/톤에 맞는 실제 마케팅 사례 검색
   - CopywriterAgent가 문장/구조를 만들 때 참고

2. **템플릿 (Templates)**
   - Content Template: 카피 구조/섹션 구조 정의
   - Layout Template: One-Page Editor에서 사용할 레이아웃 구조

3. **트렌드/패턴 요약 (Pattern Miner Output)**
   - 최근 트렌드 키워드, 자주 쓰이는 레이아웃 패턴, CTA 패턴 등

#### 5.2.1 Data Pipeline 실행 스케줄 (P0)

| Job | Trigger | Frequency | Tool |
|-----|---------|-----------|------|
| Crawler | Scheduled | 매일 02:00 KST | Celery Beat |
| Cleaner/Normalizer | Crawler 완료 후 | Event-driven | Celery Worker |
| Tagger | Cleaner 완료 후 | Event-driven | Celery Worker |
| Embedder/Indexer | Tagger 완료 후 | Event-driven | Celery Worker |
| Template Generator | Scheduled | 매주 일요일 03:00 | Celery Beat |
| Metrics Aggregator | Scheduled | 매일 04:00 KST | Celery Beat |

**수동 트리거**

- Admin Console `/admin/data-lab/crawlers`에서 "Run Now" 버튼을 통해
  Crawler 및 후속 파이프라인(선택 범위)을 즉시 실행할 수 있다.

---

### 5.3 Editor ↔ Data Pipeline (Editor Agent의 RAG/템플릿 활용)

#### 5.3.1 Editor Agent 동작 플로우

1. Editor의 Chat 패널에서 사용자가 자연어 명령을 입력
2. Editor Agent가 현재 문서 컨텍스트 수집
   - 문서 타입 (product_detail / sns_card / presentation 등)
   - 업종/페르소나/채널
   - 현재 레이아웃/폰트/컬러 정보
3. 명령 유형 판별
   - 스타일 변경: "더 고급스럽게", "더 심플하게"
   - 레이아웃 변경: "잡지형 스타일로"
   - 텍스트 톤 변경: "더 직관적인 카피로"
4. Data Pipeline 연동
   - RAG에서 해당 업종/채널의 사례 검색
   - Pattern/템플릿에서 해당 스타일의 레이아웃/타이포 패턴 조회
5. Action List 생성 (`ONE_PAGE_EDITOR_SPEC.md` 8.1 기반 확장)
   - 폰트/색/크기 변경, 오브젝트 재배치, 텍스트 톤 조정 등
6. Editor에 Action 적용 → History에 기록

#### 5.3.2 Action 모델의 패턴 출처 정보

Action에는 어떤 패턴/템플릿 기반으로 변경되었는지 출처를 포함할 수 있다.

```json
{
  "actions": [
    {
      "type": "update_object",
      "target": { "role": "TITLE" },
      "payload": { "props": { "fontSize": 60, "fill": "#222222" } },
      "source": {
        "pattern_id": "typography_luxury_ko_v1",
        "reason": "고급스러운 스킨케어 상세페이지 패턴"
      }
    }
  ]
}
```

#### 5.3.3 Editor 문서 저장/로드 플로우

**저장 (Save)**

1. 사용자가 Editor에서 "Save" 클릭 또는 Auto-save 트리거
2. Frontend:
   - 현재 Canvas 상태를 Editor JSON으로 직렬화
3. API 호출:
   - `POST /api/v1/documents/{docId}/save`
4. Backend:
   - PostgreSQL `documents` 테이블에 기본 메타데이터 저장/업데이트
     (title, type, brand_id, updated_at 등)
   - MinIO `editor-documents/{docId}.json`에 JSON 저장
   - `document_versions` 테이블에 버전 이력 기록 (version, size, created_at)

**로드 (Load)**

1. 사용자가 "내 문서" 목록에서 문서 선택
2. `GET /api/v1/documents/{docId}`
   - PostgreSQL에서 메타 정보 조회
   - MinIO에서 Editor JSON 다운로드
3. Frontend:
   - Editor JSON을 Canvas에 복원
   - History Stack 초기화 또는 간단한 초기 상태 세팅

**Auto-save**

- 30초마다 변경사항이 있을 경우 자동 저장
- Frontend에서 Debounce (예: 5초) 후 Save API 호출
- UI 상에서는 "Saving… / Saved" 상태로만 표시, 사용자 작업 방해 없음

---

## 6. Meeting AI의 위치 정의

### 6.1 역할 분리

Meeting AI는 **두 단계의 역할**을 가진다.

1. **독립 서비스 (Meeting Service)**
   - 입력: 회의 녹음/Transcript
   - 출력:
     - 회의 요약
     - 액션 아이템
     - 요구사항/아이디어 추출 (Requirements)

   → `/app`에서 "Meeting" 메뉴로 접근 가능한 **독립 기능**.

2. **Generator 연계 기능**
   - Meeting Summary / Requirements를
     - Marketing Brief Generator,
     - Product Detail Generator,
     - Presentation Generator의 **입력 컨텍스트**로 사용
   - 예:
     - "지난 신제품 기획 회의 내용을 기반으로 브리프 만들어줘"
     - "회의 A를 바탕으로 투자제안 피치덱 초안 만들어줘"

### 6.2 문서 반영 방식

- `GENERATORS_SPEC.md`
  - 4.7 Meeting AI 섹션에서
    - "Meeting Summary 생성" + "다른 Generator로의 브리지 역할"을 모두 포함하도록 기술

- `PRD_ADDENDUM_V4.3.md`
  - Meeting AI를 **독립 메뉴 + Generator 연동 기능**으로 명시

---

## 7. Video Generator / Video Editor 상태

### 7.1 현재 결정 (P0 vs P1)

- **P0**
  - 영상 스크립트 / 스토리보드 / 씬 카드까지만 생성
  - One-Page Editor에서 "스토리보드 카드"로 다루는 수준까지

- **P1**
  - 별도 `VIDEO_EDITOR_SPEC.md` 작성
  - 타임라인/트랙/키프레임 기반 Video Editor 설계
  - 외부 Video 모델(Veo, Qwen-video 등)과의 연동

### 7.2 문서 위치

- `specifications/VIDEO_EDITOR_SPEC.md`
  (P1에서 작성 시작, 현재 문서에서는 범위 밖으로 둔다)

---

## 8. 통합 P0 범위 정의 (최소 기능 조합)

각 문서마다 따로 정의되어 있던 P0를 **현실적인 V4.3 P0 조합**으로 통합한다.

### 8.1 영역별 P0 기능

| 영역 | P0 기능 (최소) |
|------|---------------|
| **Generators** | Brand Kit, Product Detail, SNS (3종 Generator) |
| **Data Pipeline** | 크롤러 1개 소스, Cleaner/Normalizer, 기본 Tagger, 텍스트 기반 Template 5개 이상, Global RAG Index(단일 인덱스) |
| **One-Page Editor** | 단일 페이지 캔버스, Text/Image/Shape/Group 오브젝트, Layout Template 적용, Editor Agent 기본 액션 5종(폰트/색/크기/간단 레이아웃 조정), PNG/PDF Export |
| **Admin Console** | Users & Plans(기본 조회), Jobs & Queues(목록), Templates 승인(기본), Data Lab 크롤러 상태 조회(기본), Feature Flags, 간단 System Health(Alive/Down) |
| **템플릿 생성** | **텍스트 패턴 기반 템플릿 생성만 P0** (이미지 기반 레이아웃 추출은 P1) |
| **Meeting AI** | P0에서는 제외, P1에서 Transcription & Summary + Brief/Presentation 연동 |
| **Video** | Video Script/Storyboard Generator만 P0에 포함, Video Editor는 P1 |

### 8.2 P0 완료 기준 (Definition of Done)

각 영역별 P0 완료를 판단하는 기준:

| 영역 | 완료 기준 |
|------|----------|
| **Generators** | Brand Kit, Product Detail, SNS 각각에 대해 **Chat 입력 → Draft 생성 → Editor JSON 로딩**까지 성공 (수동 테스트) |
| **Data Pipeline** | 크롤러 1회 실행 → PostgreSQL에 최소 100개 문서 저장 → RAG Index 1개 생성 성공 |
| **One-Page Editor** | Template 적용 → 텍스트/이미지 수정 → PNG Export까지 UI에서 정상 동작 |
| **Admin Console** | Users 목록 조회, Templates 승인 플로우, Crawlers 수동 실행 버튼이 모두 정상 작동 |
| **통합 테스트** | 실제 유저 시나리오 기준: "제품 A 상세페이지 만들어줘" → Generator → Editor 수정 → Export까지 End-to-End 성공 1회 이상 |

**P0 Exit Criteria**

- 위 5개 영역 모두 완료 기준 통과
- B팀/C팀 각각 내부 테스트 완료 보고
- A팀이 Mac mini 환경에서 통합 End-to-End 테스트 1회 이상 성공 확인

---

## 9. 구현 단계 요약 (로드맵 관점)

### Phase P0 — "작동하는 Sparklio V4.3"

- 유저는 `/app`에서:
  - Brand Kit을 만들고
  - 상품 상세페이지와 SNS 카드를 생성
  - One-Page Editor에서 수정 후 Export(PNG/PDF)까지 가능

- 내부적으로:
  - Data Pipeline이 1개 소스에서 마케팅 데이터를 크롤링
  - 텍스트 기반 템플릿 및 RAG 인덱스를 제공
  - Admin에서 템플릿을 승인·관리

### Phase P1 — "차별화 기능 탑재"

- Meeting AI 전체 플로우
- 이미지 기반 템플릿 자동 생성 (잡지 표지 → 레이아웃 템플릿)
- 다중 페이지 Editor + PPTX Export
- Video Editor (타임라인 기반)
- Admin Analytics / A/B Testing, Experiment Console

---

## 10. 문서 간 연결 요약

- `SYSTEM_ARCHITECTURE.md` (본 문서)
  → 전체 그림, 플로우, P0/P1 범위, 문서 간 관계 정의

- `ADMIN_CONSOLE_SPEC.md`
  → 이 문서의 5.1, 5.1.3, 5.2.1, 4.4, 8장을 기준으로
  - Templates 승인/캐시/Feature Flags 플로우
  - Data Lab(크롤러/인덱스) 최소 기능
  - Logs & Errors 화면 구체화

- `DATA_PIPELINE_ARCHITECTURE.md`
  → 5장, 8장 내용을 반영해
  - 텍스트 기반 템플릿 생성(P0)
  - 이미지 기반 레이아웃 템플릿 생성(P1으로 명시)
    를 명확히 구분

- `ONE_PAGE_EDITOR_SPEC.md`
  → 5.3.1~5.3.3 내용을 반영해
  - Editor Agent가 RAG/패턴을 사용하는 구조
  - Action에 pattern_id/source를 포함하는 모델
  - 문서 저장/로드/Auto-save 플로우
    를 보완

- `GENERATORS_SPEC.md`
  → 5장(템플릿/데이터 의존성)과 6장(품질 루프)을
  이 문서의 5장, 6장과 일치시키고,
  Meeting AI의 역할(독립 서비스 + Generator 브리지)을 명확히 정리

---

## 11. Changelog

- **v1.1 (2025-11-15)**
  - Physical Infrastructure(4.2) 추가 (3-node hybrid 구조 명시)
  - Security & Authentication(4.3), Error Handling & Monitoring(4.4) 추가
  - Feature Flags 연동(5.1.3) 및 Data Pipeline 스케줄(5.2.1) 정의
  - Editor 문서 저장/로드 플로우(5.3.3) 추가
  - P0 완료 기준(8.2) 정의 및 Exit Criteria 명시
  - 문서 버전 관리 정책(1.1) 및 Changelog 섹션 추가

- **v1.0 (2025-11-15)**
  - 초기 버전: 문서 지도, End-to-End 플로우, 템플릿 라이프사이클,
    Editor Agent RAG 연동, Meeting AI 역할, 통합 P0 범위 정의

---

(끝)
