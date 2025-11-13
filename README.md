# Sparklio AI Marketing Studio

> “하나의 화면에서 모든 브랜드 콘텐츠를 만들고, 한 에디터에서 완성한다.”

Sparklio.ai는 **챗 기반**으로 브랜드 분석 → 마케팅 브리프 → 상품 상세/브로셔 → SNS → 프레젠테이션 → 광고/쇼츠 → 발행·리포트까지  
**End-to-End로 자동화**하는 **AI 디자인 & 마케팅 OS**입니다.

- 사용자는 **대화(Chat)** 로만 원하는 것을 설명합니다.
- Sparklio의 **멀티 에이전트(A2A)** 시스템이 브리프·카피·이미지·영상·발행까지 분업/협업합니다.
- 모든 산출물은 **통합 에디터(One Page Editor)** 에서 수정·완성됩니다.
- 영상은 **전용 Video Studio** 에서 타임라인 기반으로 편집합니다.

---

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Git
- Node.js 18+ (for frontend development)
- Python 3.11+ (for backend development)

### Setup
```bash
# Clone the repository
git clone https://github.com/yourusername/Sparklio_ai_marketing_studio.git
cd Sparklio_ai_marketing_studio

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys (OpenAI, Gemini, Claude)

# Start services with Docker Compose
docker-compose up -d

# Run database migrations
docker-compose exec fastapi alembic upgrade head

# Access the application
# Frontend: http://localhost:3000
# API Docs: http://localhost:8000/docs
```

### Documentation Structure
```
docs/
├─ PRD/
│  └─ Sparklio_V4_PRD_Final.md        # Complete Product Requirements
├─ PHASE0/                             # MVP Foundation Documents
│  ├─ MVP_v0_SCOPE_PLAN.md            # Phase 0 scope and timeline
│  ├─ TECH_DECISION_v1.md             # Technical architecture decisions
│  ├─ AGENTS_SPEC.md                  # Multi-agent system specification
│  ├─ LLM_ROUTER_POLICY.md            # LLM routing and cost optimization
│  └─ DATA_PIPELINE_PLAN.md           # Data processing and RAG pipeline
└─ PHASE1/                             # Future phase documentation
```

---

## ✨ Core Concept

1. **Chat-Driven Creation**  
   - 모든 작업은 챗봇의 질문 → 답변 → 초안 생성으로 시작됩니다.
   - 단어 한두 개만 입력해도, 메뉴별로 미리 설계된 질문 세트로 자동 가이드합니다.

2. **Review Buffer (초안 검토 범퍼)**  
   - AI가 먼저 **초안**을 만들고, 사용자가 수정한 뒤 **[생성] 버튼**을 눌러 확정합니다.
   - “AI가 다 해줬는데 마음에 안 든다”를 최소화하는 구조입니다.

3. **Multi-Agent A2A System**  
   - Strategist / Copywriter / Vision / Video / Trend / Template 등 **16개 에이전트**가  
     A2A 프로토콜로 대화하며 작업을 분업합니다.

4. **Smart LLM Router**  
   - Gemini, GPT, Claude, Qwen, Llama, Mistral, NanoBanana, Sora2 등  
     여러 LLM·비전·비디오 모델을 **비용·속도·품질** 기준으로 자동 선택합니다.

5. **One-Page Studio + Video Studio**  
   - 텍스트·이미지·브로셔·프레젠테이션·광고 세트는 모두 **하나의 에디터**에서 편집하고,  
   - 영상(광고/쇼츠)은 **별도의 Video Studio** 에서 관리합니다.

---

## 🧩 Scope – 11 Core Modules

공통 기반(브랜드킷·RAG·Router·Editor·Publisher·Scheduler)을 중심으로  
다음 11개 모듈이 동작합니다.

1. **브랜드 분석 자동화**  
   - 로고·웹사이트·PDF·이미지 등을 업로드하면  
     브랜드 컬러, 폰트, 톤·매너, 키 메시지를 분석해 **Brand Kit JSON**으로 정리합니다.

2. **마케팅 브리프**  
   - 캠페인 목표, 타깃, 채널, 예산 등을 챗 기반으로 정리해  
     다른 모든 모듈의 “출발점”이 되는 브리프를 생성합니다.

3. **상품상세설명서 / 브로셔**  
   - 제품 정보 입력 + 브랜드/브리프 기반으로  
     상세페이지, 카탈로그, 브로셔 초안을 생성합니다.

4. **SNS 마케팅**  
   - 인스타그램/페북/릴스/쇼츠 등 채널별 길이·톤에 맞는 글/이미지 세트를 생성합니다.

5. **프레젠테이션**  
   - 10~12 슬라이드 구조 자동 제안 + 슬라이드별 카피/레이아웃/이미지 추천.

6. **광고 영상 / 쇼츠 제작**  
   - 스토리보드, 씬 구성, 자막 스크립트, 컷 타임라인을 자동 생성하고  
   - Video Studio에서 편집·렌더링합니다.

7. **발행·출력 관리 (+ PPC Ads)**  
   - SNS, 블로그, 워드프레스, 파일(PDF/PNG/MP4) 발행 관리  
   - **PPC 광고(Google Ads, Microsoft Ads, 네이버, 카카오 등) 자동 캠페인 설계·집행 (로드맵)**

8. **블로그 (워드프레스)**  
   - AI가 글·이미지·메타 정보를 생성하고 WordPress REST API로 게시합니다.

9. **트렌드 분석**  
   - 외부 소스에서 마케팅/시장 트렌드를 수집·요약하고  
     콘텐츠/키워드 추천에 반영합니다.

10. **마케팅 자료 자동 수집·학습**  
    - PDF·PPT·XLSX·이미지 등을 수집·파싱·임베딩해  
      브랜드/상품/시장에 특화된 RAG 기반 지식을 만듭니다.

11. **마케팅 템플릿 자동 생성기**  
    - 자주 쓰이는 콘텐츠 유형(랜딩, 상세, 이메일, 카드뉴스, 슬라이드 등)을  
      JSON 템플릿 + 프롬프트 세트로 자동 생성합니다.

각 모듈은 PRD 상에서 다음 순서로 정의됩니다.

- **입력 (Input)**  
- **처리 로직 & A2A 플로우**  
- **출력 포맷**  
- **API 계약**  
- **에디터 인터페이스(UX)**  
- **AC(Acceptance Criteria)**  
- **KPI**

---

## 🏗️ Architecture Overview

### Runtime Architecture

- **Frontend**
  - Next.js / React
  - Fabric.js 기반 **Unified Editor**
  - Video Studio (타임라인 + 스토리보드)
  - WebSocket 기반 실시간 이벤트

- **Backend**
  - FastAPI (REST API)
  - Celery (멀티 에이전트 및 비동기 작업)
  - APScheduler (예약 발행·트렌드 크롤링·리포트)

- **Data & Storage**
  - PostgreSQL + pgvector (RAG, 로그, 설정)
  - Redis (캐시/Queue)
  - S3/MinIO (이미지·영상·에셋 저장)

- **LLM & Generators**
  - OpenAI (텍스트·이미지·비디오)
  - Google Gemini
  - Anthropic Claude
  - Local LLMs (Qwen, Llama, Mistral 등)
  - NanoBanana / DALL·E (이미지)
  - Sora2 (비디오, 로드맵)

### Multi-Node Infra (개발·사전 배포 환경)

- 🖥 **Desktop (RTX 4070 SUPER)** – 이미지/영상/로컬 LLM 추론
- 💻 **Laptop (RTX 4060 Laptop)** – 개발·시연·프론트엔드
- 🍎 **Mac mini M2** – 24/7 서버 (API/DB/Worker/Scheduler)

세 노드는 **Tailscale**로 연결되며,  
대용량 에셋은 **S3/MinIO + rsync** 로 동기화됩니다.

---

## 🧠 Multi-Agent A2A System

Sparklio는 16개의 에이전트가 A2A 프로토콜로 협력합니다.

- StrategistAgent – 캠페인 전략·구조 설계
- CopywriterAgent – 카피/콘텐츠 작성
- VisionGeneratorAgent – 이미지 생성
- VisionAnalyzerAgent – 시각 품질 평가
- ScenePlannerAgent – 영상 씬 구성
- StoryboardBuilderAgent – 스토리보드 생성
- VideoDirectorAgent – 영상 제작·컷 구성
- VideoReviewerAgent – 영상 품질 검사
- TemplateAgent – 템플릿 자동 생성
- TrendAgent – 트렌드 인사이트
- DataCollectorAgent – 자료 수집
- RAGAgent – 지식 검색
- ADAgent – 광고 퍼포먼스 최적화
- SecurityAgent – 정책·보안 검증
- BudgetAgent – 비용 추적
- PM Agent – 워크플로 조율

**A2A I/O 규약**

```json
{
  "message_id": "uuid",
  "timestamp": "iso8601",
  "payload": { "task": "...", "data": { } }
}
→
{
  "message_id": "uuid",
  "timestamp": "iso8601",
  "status": "ok|error",
  "payload": { ... },
  "error": null
}
