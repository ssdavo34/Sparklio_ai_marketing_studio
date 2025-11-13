# Sparklio AI Marketing Studio

> **"하나의 화면에서 모든 브랜드 콘텐츠를 만들고, 한 에디터에서 완성한다."**
>
> Chat-Driven Creation + Multi-Agent A2A + Smart LLM Router

## 🌟 Overview

Sparklio.ai는 **챗 기반**으로 브랜드 분석 → 마케팅 브리프 → 상품 상세/브로셔 → SNS → 프레젠테이션 → 광고/쇼츠 → 발행·리포트까지 **End-to-End로 자동화**하는 **AI 디자인 & 마케팅 OS**입니다.

### 💬 How It Works

1. **사용자는 대화(Chat)로만 원하는 것을 설명합니다.**
2. **멀티 에이전트(A2A) 시스템이 브리프·카피·이미지·영상·발행까지 분업/협업합니다.**
3. **모든 산출물은 통합 에디터(One Page Editor)에서 수정·완성됩니다.**
4. **영상은 전용 Video Studio에서 타임라인 기반으로 편집합니다.**

### ✨ Core Concepts

#### 🗨️ **Chat-Driven Creation**

- 모든 작업은 챗봇의 질문 → 답변 → 초안 생성으로 시작
- 단어 한두 개만 입력해도 메뉴별로 미리 설계된 질문 세트로 자동 가이드

#### 🔄 **Review Buffer (초안 검토 범퍼)**

- AI가 먼저 초안을 만들고, 사용자가 수정한 뒤 [생성] 버튼을 눌러 확정
- "AI가 다 해줬는데 마음에 안 든다"를 최소화하는 구조

#### 🤝 **Multi-Agent A2A System**

- Strategist / Copywriter / Vision / Video / Trend / Template 등 16개 에이전트
- A2A 프로토콜로 대화하며 작업을 분업

#### 🧠 **Smart LLM Router**

- Gemini, GPT, Claude, Llama, Mistral, NanoBanana, Sora2 등
- 여러 LLM·비전·비디오 모델을 비용·속도·품질 기준으로 자동 선택

#### 🎨 **One-Page Studio + Video Studio**

- 텍스트·이미지·브로셔·프레젠테이션·광고 세트는 모두 하나의 에디터에서 편집
- 영상(광고/쇼츠)은 별도의 Video Studio에서 관리

## 🚀 Quick Start

### Prerequisites
- Python 3.9+
- Node.js 18+
- PostgreSQL 14+
- Redis 7+
- CUDA 11.8+ (로컬 LLM 사용 시)

### Installation

```bash
# Clone repository
git clone https://github.com/sparklio/ai-marketing-studio.git
cd sparklio-ai-marketing-studio

# Backend setup
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Frontend setup
cd ../frontend
npm install

# Environment setup
cp .env.example .env
# Edit .env with your configuration
```

### 실행

```bash
# Start backend services
cd backend
python manage.py migrate
python manage.py runserver

# Start Celery worker
celery -A sparklio worker -l info

# Start frontend (new terminal)
cd frontend
npm run dev
```

웹 브라우저에서 `http://localhost:3000` 접속

## 🏗️ Architecture

### Runtime Architecture

#### Frontend

- **Next.js / React** - 서버사이드 렌더링 및 라우팅
- **Fabric.js 기반 Unified Editor** - 캔버스 기반 통합 편집
- **Video Studio** - 타임라인 + 스토리보드 영상 편집
- **WebSocket** - 실시간 이벤트 스트리밍

#### Backend

- **FastAPI** - REST API 서버
- **Celery** - 멀티 에이전트 및 비동기 작업 처리
- **APScheduler** - 예약 발행·트렌드 크롤링·리포트
- **FFmpeg Pipeline** - 영상 처리 및 변환

#### Data & Storage

- **PostgreSQL + pgvector** - RAG, 로그, 설정 관리
- **Redis** - 캐시 및 작업 큐
- **S3/MinIO** - 이미지·영상·에셋 스토리지

#### LLM & Generators

- **OpenAI** - GPT 텍스트·DALL-E 이미지·Sora2 비디오
- **Google Gemini** - 빠른 요약 및 실시간 처리
- **Anthropic Claude** - 긴 문서 및 복잡한 분석
- **Local LLMs** - Llama3.1, Mistral 등 (프라이버시 우선)
- **NanoBanana** - 특화 이미지 생성

### Multi-Node Infrastructure (개발·사전 배포 환경)

```
┌────────────────────────┐     ┌────────────────────────┐     ┌────────────────────────┐
│  🖥 Desktop (주말)      │────│  💻 Laptop (평일)       │────│  🍎 Mac mini M2 (24/7)  │
│  RTX 4070 SUPER        │     │  RTX 4060 Laptop       │     │  M2 + Neural Engine     │
│  • 이미지/영상 추론     │     │  • 개발·시연·프론트     │     │  • API Server          │
│  • 로컬 LLM 7B~13B    │     │  • 테스트 환경          │     │  • DB/Redis            │
│  • Stable Diffusion    │     │  • 프레젠테이션        │     │  • Worker/Scheduler    │
└────────────────────────┘     └────────────────────────┘     └────────────────────────┘
                     Tailscale VPN + MinIO (Media) + Git (Code)
```

세 노드는 **Tailscale VPN**으로 안전하게 연결되며, 미디어 에셋은 **MinIO** (Mac mini 호스팅)에 중앙 저장하고, 코드/설정은 **Git** + 선택적 **rsync**로 동기화합니다.

## 🧩 Core Modules - 11 Core Functions

공통 기반(브랜드킷·RAG·Router·Editor·Publisher·Scheduler)을 중심으로 다음 11개 모듈이 동작합니다.

### 0. 🎨 공통 기반

- **Brand Kit**: 브랜드 컬러, 폰트, 톤·매너, 키 메시지를 JSON으로 관리
- **Smart Router**: LLM 모델을 비용·속도·품질 기준으로 자동 선택
- **Unified Editor**: 모든 콘텐츠를 한 화면에서 편집
- **Video Studio**: 타임라인 기반 영상 편집
- **Publisher**: 멀티채널 동시 발행 및 스케줄링
- **Scheduler**: 예약 작업 및 반복 작업 관리

### 1. 🔍 브랜드 분석 자동화

로고·웹사이트·PDF·이미지 등을 업로드하면 브랜드 컬러, 폰트, 톤·매너, 키 메시지를 분석해 **Brand Kit JSON**으로 정리합니다.

### 2. 📋 마케팅 브리프

캠페인 목표, 타깃, 채널, 예산 등을 챗 기반으로 정리해 다른 모든 모듈의 **"출발점"**이 되는 브리프를 생성합니다.

### 3. 🛍️ 상품상세설명서 / 브로셔

제품 정보 입력 + 브랜드/브리프 기반으로 상세페이지, 카탈로그, 브로셔 초안을 생성합니다.

### 4. 📱 SNS 마케팅

인스타그램/페북/릴스/쇼츠 등 채널별 길이·톤에 맞는 글/이미지 세트를 생성합니다.

### 5. 📊 프레젠테이션

10~12 슬라이드 구조 자동 제안 + 슬라이드별 카피/레이아웃/이미지 추천.

### 6. 🎬 광고 영상 / 쇼츠 제작

스토리보드, 씬 구성, 자막 스크립트, 컷 타임라인을 자동 생성하고 Video Studio에서 편집·렌더링합니다.

### 7. 🚀 발행·출력 관리 (+ PPC Ads)

- SNS, 블로그, 워드프레스, 파일(PDF/PNG/MP4) 발행 관리
- **PPC 광고** (Google Ads, Microsoft Ads, 네이버, 카카오 등) 자동 캠페인 설계·집행

### 8. 📝 블로그 (워드프레스)

AI가 글·이미지·메타 정보를 생성하고 WordPress REST API로 게시합니다.

### 9. 📈 트렌드 분석

외부 소스에서 마케팅/시장 트렌드를 수집·요약하고 콘텐츠/키워드 추천에 반영합니다.

### 10. 📚 마케팅 자료 자동 수집·학습

PDF·PPT·XLSX·이미지 등을 수집·파싱·임베딩해 브랜드/상품/시장에 특화된 RAG 기반 지식을 만듭니다.

### 11. 🎯 마케팅 템플릿 자동 생성기

자주 쓰이는 콘텐츠 유형(랜딩, 상세, 이메일, 카드뉴스, 슬라이드 등)을 JSON 템플릿 + 프롬프트 세트로 자동 생성합니다.

## 🎮 Usage Flow

### 기본 워크플로우
1. **입력**: 키워드/문장 입력 또는 파일 업로드 (PDF, PPT, Excel, 이미지)
2. **질문**: AI가 필요한 정보를 대화형으로 수집
3. **초안 생성**: Preview 모드로 초안 렌더링
4. **검토/수정**: Review Buffer에서 수정 및 보완
5. **확정**: [생성] 버튼으로 최종 확정
6. **발행**: 즉시 또는 예약 발행

### Review Buffer
- 모든 생성물은 초안 → 수정 → 확정의 검토 단계 거침
- 버전 히스토리 자동 관리
- 실시간 협업 지원

## 🧠 Multi-Agent A2A System

Sparklio는 **16개의 전문 에이전트**가 A2A 프로토콜로 협력하는 시스템입니다.

### 에이전트 목록

1. **StrategistAgent** - 캠페인 전략·구조 설계
2. **CopywriterAgent** - 카피/콘텐츠 작성
3. **VisionGeneratorAgent** - 이미지 생성
4. **VisionAnalyzerAgent** - 시각 품질 평가
5. **ScenePlannerAgent** - 영상 씬 구성
6. **StoryboardBuilderAgent** - 스토리보드 생성
7. **VideoDirectorAgent** - 영상 제작·컷 구성
8. **VideoReviewerAgent** - 영상 품질 검사
9. **TemplateAgent** - 템플릿 자동 생성
10. **TrendAgent** - 트렌드 인사이트
11. **DataCollectorAgent** - 자료 수집
12. **RAGAgent** - 지식 검색
13. **ADAgent** - 광고 퍼포먼스 최적화
14. **SecurityAgent** - 정책·보안 검증
15. **BudgetAgent** - 비용 추적
16. **PMAgent** - 워크플로 조율

### A2A I/O 규약

#### Request

```json
{
  "message_id": "uuid",
  "timestamp": "iso8601",
  "payload": {
    "task": "...",
    "data": { }
  }
}
```

#### Response

```json
{
  "message_id": "uuid",
  "timestamp": "iso8601",
  "status": "ok|error",
  "payload": { ... },
  "error": null
}
```

### 에이전트 협업 플로우

- **WebSocket EventBus** + **Celery Queue**로 메시지 전달
- 우선순위 큐: P0(인터랙티브) / P1(배치) / P2(학습)
- **Idempotency-Key**로 중복 방지
- **Dead-Letter Queue**로 실패 처리

### 오류 처리 & 복구

- 부분 실패 시 **Saga 패턴**으로 보정/보류
- 동시 수정 충돌: 에디터 락(soft) + 버전 비교 병합
- 재시도 전략: 지수 백오프(최대 3회), 회로차단기 적용

## 💡 Smart LLM Router

### 자동 모델 선택 알고리즘

```
Score = wC*Cost + wL*Latency + wQ*Quality + wR*Resource + wS*Sensitivity
```

- **Cost(C)**: 토큰·분당/영상 크레딧
- **Latency(L)**: 목표 응답시간 T90
- **Quality(Q)**: 내부 벤치마크/A/B 테스트 점수
- **Resource(R)**: 로컬 GPU 가용성 vs 클라우드 혼잡도
- **Sensitivity(S)**: 민감 데이터 처리 시 로컬 우선

### 프리셋 모드

- **Draft Fast**: 빠른 초안 생성 (속도 우선)
- **Balanced**: 균형잡힌 품질과 속도
- **High-Fidelity**: 최고 품질 (품질 우선)

### 지원 모델 카탈로그

| 모델 | 분류 | 강점 | 주요 용도 |
|------|------|------|-----------|
| **Gemini 2.5 Flash** | Cloud | 속도/가성비 | 요약, SNS, 실시간 챗 |
| **GPT-4o mini / 5** | Cloud | 균형/고품질 | 초안/고난도 전략 |
| **Claude 3.5 Haiku/Sonnet** | Cloud | 톤 안정/긴문서 | 브리프/상품상세 |
| **Qwen2-14B** | Local | 가성비/길이 | 템플릿/프레젠테이션 |
| **Llama3.1-8B** | Local | 균형 | 프레젠테이션/요약 |
| **Mistral-7B** | Local | 경량/속도 | 트렌드 분석 |
| **NanoBanana** | Cloud | 이미지 | 썸네일/시각 아이디어 |
| **DALL·E 3** | Cloud | 일관성 | 브랜드 이미지 |
| **Sora2** | Cloud | 비디오 | 광고/쇼츠 합성 |
| **Pi** | Cloud | 대화 | 가벼운 어시스트 |

### 비용 경보 시스템

- 영상·대용량 작업 시 예상 비용/시간 팝업 고지
- 사용자 승인 후 진행
- 실시간 비용 대시보드 제공

## 🔐 Security & Privacy

- 개인정보 최소 수집 원칙
- 고객 데이터 모델 재학습 미사용 (Opt-in 별도)
- OAuth 토큰 Vault 보관
- 모든 트랜잭션 감사 로그
- GDPR/CCPA 준수

## 📊 Performance KPIs

### 목표 지표
- 초안 생성 시간: < 3분
- 발행 성공률: > 99%
- 브랜드 일관성: > 95%
- API 응답시간 P90: < 1초
- 영상 생성 (30초): < 2분

### 모니터링
- Router 비용/속도 히트맵
- 큐 대기시간 대시보드
- 에이전트별 성능 지표
- 사용자 만족도 추적

## 🗓️ Roadmap

### MVP v0 (Current)
- ✅ 채팅 인터페이스
- ✅ 브랜드킷 + 브리프
- ✅ 상품상세 + 블로그
- ✅ Review Buffer
- ✅ 기본 Router

### v1.1 (Q1 2025)
- 🚧 영상/쇼츠 생성
- 🚧 트렌드 분석 고도화
- 🚧 PPC 광고 자동화

### v1.2 (Q2 2025)
- 📅 팀 협업 기능
- 📅 고급 에디터 명령
- 📅 비용 대시보드

## 🤝 Contributing

기여를 환영합니다! [CONTRIBUTING.md](CONTRIBUTING.md) 참조

### 개발 가이드
- 코드 스타일: Black (Python), Prettier (JS/TS)
- 커밋 메시지: Conventional Commits
- 브랜치 전략: Git Flow
- 테스트: 최소 80% 커버리지

## 📝 Documentation

- [API 문서](docs/api/README.md)
- [에이전트 스펙](docs/AGENTS_SPEC.md)
- [E2E 테스트 플랜](docs/E2E_TEST_PLAN.md)
- [LLM 라우터 정책](docs/LLM_ROUTER_POLICY.md)
- [데이터 파이프라인](docs/DATA_PIPELINE_PLAN.md)

## 📞 Support

- GitHub Issues: [버그 리포트 및 기능 요청](https://github.com/sparklio/ai-marketing-studio/issues)
- Email: support@sparklio.ai
- Discord: [Community Server](https://discord.gg/sparklio)

## 📄 License

Proprietary - Sparklio.ai © 2025

---

**Built with ❤️ by Sparklio Team**

> 이 프로젝트는 활발히 개발 중입니다. 최신 업데이트는 [CHANGELOG.md](CHANGELOG.md)를 확인하세요.