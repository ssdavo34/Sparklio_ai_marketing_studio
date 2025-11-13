# Technical Decision Document v1.0

> **Version**: 1.1
> **Date**: 2025-11-13 (목요일 오후 5:59)
> **Status**: Approved
> **Owner**: Engineering Team

---

## 1. Executive Summary

본 문서는 Sparklio.ai의 기술 스택 선정과 아키텍처 결정 사항을 기록합니다. 모든 기술 선택은 **확장성**, **개발 속도**, **비용 효율성**을 기준으로 평가되었습니다.

### 1.1 핵심 원칙
- **Simplicity First**: 복잡도를 최소화하여 빠른 개발
- **Local First**: 로컬 리소스 우선 활용으로 비용 절감 (3-Node Hybrid 환경)
- **API First**: 모든 기능을 API로 노출하여 확장성 확보
- **Event Driven**: 비동기 이벤트 기반 아키텍처
- **Chat-Driven Creation**: 대화 기반 콘텐츠 생성 with Review Buffer
- **Multi-Agent A2A**: 16개 전문 에이전트의 협업 시스템

---

## 2. 기술 스택 결정

### 2.1 Frontend Stack

| 레이어 | 기술 | 선정 이유 | 대안 검토 |
|--------|------|-----------|-----------|
| **Framework** | Next.js 14 | SSR/SSG, App Router, 성능 | Remix, SvelteKit |
| **UI Library** | React 18 | 생태계, 커뮤니티, 안정성 | Vue 3, Solid |
| **State** | Zustand + TanStack Query | 단순함, TypeScript | Redux, MobX |
| **Canvas** | Fabric.js 5 | 객체 모델, 이벤트 처리 | Konva, Paper.js |
| **Styling** | Tailwind CSS 3 | 유틸리티, 커스터마이징 | CSS Modules, Emotion |
| **WebSocket** | Socket.io | 재연결, 룸 관리 | Native WS, SignalR |
| **Build** | Turbopack | 빠른 HMR, Next.js 통합 | Webpack, Vite |

#### 2.1.1 Frontend 아키텍처 패턴

```typescript
// 폴더 구조
frontend/
├── app/                    # Next.js App Router
│   ├── (auth)/            # 인증 관련 라우트
│   ├── (main)/            # 메인 앱 라우트
│   └── api/               # API Routes
├── components/
│   ├── ui/                # 재사용 UI 컴포넌트
│   ├── editor/            # 에디터 관련
│   └── chat/              # 채팅 관련
├── hooks/                 # Custom React Hooks
├── lib/                   # 유틸리티 함수
├── stores/                # Zustand stores
└── types/                 # TypeScript 타입 정의
```

### 2.2 Backend Stack

| 레이어 | 기술 | 선정 이유 | 대안 검토 |
|--------|------|-----------|-----------|
| **Framework** | FastAPI 0.109 | 비동기, 타입 힌트, 성능 | Django, Flask |
| **Runtime** | Python 3.11 | AI 생태계, 라이브러리 | Node.js, Go |
| **Queue** | Celery 5.3 | 성숙도, 플러그인 | RQ, Dramatiq |
| **Scheduler** | APScheduler | 단순함, Python 네이티브 | Airflow, Prefect |
| **ORM** | SQLAlchemy 2.0 | 유연성, 성능 | Django ORM, Tortoise |
| **Validation** | Pydantic 2.5 | FastAPI 통합, 성능 | Marshmallow |
| **Testing** | Pytest | 플러그인, 픽스처 | unittest |

#### 2.2.1 Backend 아키텍처 패턴

```python
# Layered Architecture
backend/
├── app/
│   ├── api/               # API 엔드포인트
│   │   ├── v1/
│   │   │   ├── briefs.py
│   │   │   ├── assets.py
│   │   │   └── publish.py
│   ├── core/              # 핵심 설정
│   │   ├── config.py
│   │   ├── security.py
│   │   └── database.py
│   ├── models/            # DB 모델
│   │   ├── brand.py
│   │   ├── brief.py
│   │   └── asset.py
│   ├── services/          # 비즈니스 로직
│   │   ├── brand_analyzer.py
│   │   ├── content_generator.py
│   │   └── publisher.py
│   ├── agents/            # AI 에이전트
│   │   ├── base.py
│   │   ├── strategist.py
│   │   └── copywriter.py
│   └── workers/           # Celery 태스크
│       ├── generation.py
│       ├── analysis.py
│       └── publishing.py
```

### 2.3 Database & Storage

| 컴포넌트 | 기술 | 용도 | 선정 이유 |
|----------|------|------|-----------|
| **Primary DB** | PostgreSQL 15 | 트랜잭션 데이터 | ACID, JSON, 확장성 |
| **Vector DB** | pgvector | RAG 임베딩 | PostgreSQL 통합 |
| **Cache** | Redis 7 | 세션, 캐시, 큐 | 속도, Pub/Sub |
| **Object Storage** | MinIO | 이미지, 영상 | S3 호환, 자체 호스팅 |
| **File System** | Local + NFS | 임시 파일 | 빠른 I/O |

#### 2.3.1 데이터베이스 스키마 설계

```sql
-- 주요 테이블 구조
CREATE TABLE brands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    brand_kit JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE briefs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID REFERENCES brands(id),
    type VARCHAR(50),
    content JSONB NOT NULL,
    status VARCHAR(20) DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brief_id UUID REFERENCES briefs(id),
    type VARCHAR(50),
    content JSONB,
    canvas_data JSONB,
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Vector extension for RAG
CREATE EXTENSION IF NOT EXISTS vector;
CREATE TABLE embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id UUID NOT NULL,
    source_type VARCHAR(50),
    chunk_text TEXT,
    embedding vector(1536),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX ON embeddings USING ivfflat (embedding vector_cosine_ops);
```

### 2.4 AI/ML Stack

README.md 및 LLM_ROUTER_POLICY.md에 정의된 최신 모델 카탈로그:

| 카테고리 | 모델/서비스 | 용도 | 배포 방식 | 비용/1K |
|----------|------------|------|-----------|---------|
| **Text (Cloud - Premium)** | GPT-5, GPT-4.1 | 최고 난이도 전략·분석 | API | $0.015, $0.012 |
| **Text (Cloud - High)** | GPT-4-Turbo, GPT-4o | 고품질 생성 | API | $0.01, $0.005 |
| **Text (Cloud - Fast)** | GPT-4o-mini, Gemini 2.5 Flash, Pi | 빠른 초안, 요약, 실시간 챗 | API | $0.0015, $0.0003, $0.0002 |
| **Text (Cloud - Balanced)** | Claude 3.5 Sonnet/Haiku, Gemini 2.5 Pro | 톤 안정, 긴 문서, 멀티모달 | API | $0.003, $0.0008, $0.0025 |
| **Text (Local)** | Llama 3.1 70B/8B, Qwen2 14B, Mistral 7B | 프라이버시, 비용 절감 | GGUF/vLLM | $0.0001, $0.00005 |
| **Image (Cloud)** | DALL-E 3, NanoBanana, Midjourney v6 | 브랜드 이미지, 썸네일 | API | $0.04, $0.01, $0.03 |
| **Image (Local)** | SD XL, SD 1.5 | 브랜드 특화 LoRA | Diffusers | $0.001 |
| **Video** | Sora2, Runway Gen-3, Pika Labs | 광고/쇼츠 합성 | API | $0.50/sec, $0.30/sec |
| **Embedding** | text-embedding-3-small, ada-002, e5-large-v2 | RAG 임베딩 | API/Local | $0.02/1M, $0.10/1M |
| **Speech** | Whisper, ElevenLabs | TTS/STT | API/Local | - |

#### 2.4.1 Smart LLM Router 구현 (LLM_ROUTER_POLICY.md 기반)

```python
class SmartRouter:
    """
    스마트 LLM 라우터
    - 16개 에이전트별 최적 모델 자동 선택
    - 5가지 프리셋 모드 지원
    - 브랜드 일관성 기반 라우팅
    """
    def __init__(self):
        self.calculator = RouterScoreCalculator()
        self.models = ModelRegistry()

        # 5가지 프리셋 모드
        self.presets = {
            'draft_fast': {      # 빠른 초안 (속도 우선)
                'weights': {'cost': 0.2, 'latency': 0.5, 'quality': 0.2},
                'models': ['gemini-2.5-flash', 'gpt-4o-mini', 'pi', 'mistral-7b']
            },
            'balanced': {         # 균형 (기본값)
                'weights': {'cost': 0.25, 'latency': 0.25, 'quality': 0.25},
                'models': ['gpt-4o', 'claude-3.5-sonnet', 'gemini-2.5-pro']
            },
            'high_fidelity': {   # 최고 품질 (품질 우선)
                'weights': {'cost': 0.1, 'latency': 0.1, 'quality': 0.6},
                'models': ['gpt-5', 'gpt-4.1', 'claude-3.5-sonnet']
            },
            'privacy_first': {   # 로컬 모델만 (프라이버시 우선)
                'weights': {'privacy': 0.5, 'quality': 0.2},
                'models': ['llama-3.1-70b', 'qwen2-14b', 'mistral-7b']
            },
            'cost_optimized': {  # 비용 최소화
                'weights': {'cost': 0.6, 'latency': 0.15, 'quality': 0.15},
                'models': ['mistral-7b', 'llama-3.1-8b', 'gemini-2.5-flash']
            }
        }

        # 에이전트별 최적 모델 매핑 (AGENTS_SPEC.md 연동)
        self.agent_preferences = {
            'StrategistAgent': {
                'primary': ['gpt-5', 'claude-3.5-sonnet', 'gpt-4.1'],
                'preset': 'high_fidelity'
            },
            'CopywriterAgent': {
                'primary': ['claude-3.5-sonnet', 'gpt-4o'],
                'preset': 'balanced'
            },
            'TrendCollectorAgent': {
                'primary': ['gemini-2.5-flash', 'pi'],
                'preset': 'draft_fast'
            },
            'DataCleanerAgent': {
                'primary': ['gemini-2.5-flash', 'gpt-4o-mini'],
                'preset': 'cost_optimized'
            }
        }

    def select_model(self, task: Task, agent_name: str = None) -> str:
        """
        최적 모델 선택
        Score = wC*Cost + wL*Latency + wQ*Quality + wR*Resource + wS*Privacy
        """

        # 에이전트별 프리퍼런스 우선
        if agent_name and agent_name in self.agent_preferences:
            pref = self.agent_preferences[agent_name]
            preset = self.presets[pref['preset']]

            # 우선순위 모델 시도
            for model in pref['primary']:
                if self.is_available(model):
                    return model

        # 민감 데이터 → 로컬 모델 강제
        if task.contains_pii or task.confidential:
            return self.select_from_preset('privacy_first')

        # 프리셋 기반 선택
        if task.priority == 'speed':
            return self.select_from_preset('draft_fast')
        elif task.priority == 'quality':
            return self.select_from_preset('high_fidelity')
        elif task.priority == 'cost':
            return self.select_from_preset('cost_optimized')

        # 기본: Balanced
        return self.select_from_preset('balanced')

    def select_from_preset(self, preset_name: str) -> str:
        """프리셋에서 가용한 첫 모델 선택"""
        preset = self.presets[preset_name]
        for model in preset['models']:
            if self.is_available(model):
                return model
        raise NoSuitableModelError()

    def is_available(self, model: str) -> bool:
        """모델 가용성 확인 (로컬 GPU 온라인 체크 포함)"""
        if model in ['llama-3.1-70b', 'sdxl', 'qwen2-14b']:
            # Desktop GPU 필요
            return self.check_node_health('desktop')
        elif model in ['llama-3.1-8b', 'mistral-7b']:
            # Laptop 또는 Desktop
            return self.check_node_health('laptop') or self.check_node_health('desktop')
        else:
            # 클라우드 모델은 항상 가용
            return True
```

#### 2.4.2 비용 경보 시스템 (Cost Alert System)

```python
class CostAlertSystem:
    """
    영상·대용량 작업 시 예상 비용/시간 팝업 고지
    """
    def __init__(self):
        self.thresholds = {
            'warning': 1.0,   # $1 이상
            'approval': 5.0,  # $5 이상 승인 필요
            'critical': 20.0  # $20 이상 critical 경고
        }

    async def check_cost_alert(
        self,
        task: Task,
        selected_model: Model
    ) -> CostAlertResult:
        """비용 경보 확인 및 사용자 승인 요청"""

        estimated_cost = self.estimate_cost(task, selected_model)
        estimated_time = self.estimate_time(task, selected_model)

        if estimated_cost >= self.thresholds['critical']:
            return CostAlertResult(
                level='critical',
                cost=estimated_cost,
                time=estimated_time,
                requires_approval=True,
                message=f"⚠️ 높은 비용 예상: ${estimated_cost:.2f}\n"
                        f"예상 소요 시간: {estimated_time}초\n"
                        f"계속 진행하시겠습니까?"
            )
        elif estimated_cost >= self.thresholds['approval']:
            return CostAlertResult(
                level='approval',
                cost=estimated_cost,
                time=estimated_time,
                requires_approval=True,
                message=f"💰 예상 비용: ${estimated_cost:.2f}\n"
                        f"예상 소요 시간: {estimated_time}초"
            )

        return CostAlertResult(level='none', cost=estimated_cost)
```

### 2.5 Multi-Node Infrastructure (개발·사전 배포 환경)

Sparklio.ai는 **3-Node Hybrid 환경**에서 로컬/클라우드 리소스를 유연하게 활용합니다:

```
┌────────────────────────┐     ┌────────────────────────┐     ┌────────────────────────┐
│  🖥 Desktop (주말)      │────│  💻 Laptop (평일)       │────│  🍎 Mac mini M2 (24/7)  │
│  RTX 4070 SUPER        │     │  RTX 4060 Laptop       │     │  M2 + Neural Engine     │
│  • 이미지/영상 추론     │     │  • 개발·시연·프론트     │     │  • API Server          │
│  • 로컬 LLM 7B~70B    │     │  • 테스트 환경          │     │  • DB/Redis            │
│  • Stable Diffusion    │     │  • 경량 추론            │     │  • Worker/Scheduler    │
└────────────────────────┘     └────────────────────────┘     └────────────────────────┘
                     Tailscale VPN + MinIO (Media) + Git (Code)
```

#### 2.5.1 노드별 역할 및 사양

| 노드 | 역할 | 주요 워크로드 | 가용 시간 |
|------|------|--------------|----------|
| **Desktop** | 고성능 추론 | SDXL, Llama 70B, Qwen 14B, 영상 렌더링 | 주말 + 야간 |
| **Laptop** | 개발 + 경량 추론 | 프론트엔드, Llama 8B, Mistral 7B | 평일 근무시간 |
| **Mac mini M2** | API 서버 | FastAPI, DB, Redis, Celery Workers, APScheduler | 24/7 상시 |

#### 2.5.2 노드 간 동기화 전략

```python
class NodeAwareRouter:
    """
    노드 가용성 기반 라우팅
    """
    async def select_inference_node(
        self,
        model: str,
        task_priority: str
    ) -> str:
        """추론 노드 선택"""

        # Desktop GPU 온라인 체크
        desktop_available = await self.check_node_health('desktop')

        # 고성능 모델 → Desktop 우선
        if model in ['llama-70b', 'sdxl', 'qwen-14b']:
            if desktop_available:
                return 'desktop'
            else:
                # Fallback to cloud
                return 'cloud'

        # 경량 모델 → Laptop 또는 Desktop
        if model in ['llama-8b', 'mistral-7b']:
            laptop_available = await self.check_node_health('laptop')
            if laptop_available:
                return 'laptop'
            elif desktop_available:
                return 'desktop'
            else:
                return 'cloud'

        # 클라우드 모델
        return 'cloud'
```

#### 2.5.3 저장소 동기화

- **코드**: Git (GitHub/GitLab)
- **미디어 에셋**: MinIO (Mac mini 호스팅) - S3 호환
- **데이터베이스**: PostgreSQL (Mac mini) + 정기 백업
- **설정 파일**: rsync + Git

### 2.6 Infrastructure & DevOps

| 영역 | 기술 | 용도 | 선정 이유 |
|------|------|------|-----------|
| **Container** | Docker | 컨테이너화 | 표준, 생태계 |
| **Orchestration** | Docker Compose | 로컬 오케스트레이션 | 단순함 |
| **VPN** | Tailscale | 3-Node 연결 | Zero-config, Mesh Network |
| **CI/CD** | GitHub Actions | 자동화 | GitHub 통합 |
| **Monitoring** | Prometheus + Grafana | 메트릭 | 오픈소스, 확장성 |
| **Logging** | Loki + Promtail | 로그 수집 | Grafana 통합 |
| **Tracing** | OpenTelemetry | 분산 추적 | 표준, 벤더 중립 |
| **GPU Monitoring** | nvidia-smi + Prometheus | GPU 사용률 추적 | Desktop/Laptop GPU 모니터링 |

#### 2.6.1 Docker Compose 구성

```yaml
version: '3.9'

services:
  postgres:
    image: pgvector/pgvector:pg15
    environment:
      POSTGRES_DB: sparklio
      POSTGRES_USER: sparklio
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"

  minio:
    image: minio/minio
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: ${MINIO_USER}
      MINIO_ROOT_PASSWORD: ${MINIO_PASSWORD}
    volumes:
      - minio_data:/data
    ports:
      - "9000:9000"
      - "9001:9001"

  backend:
    build: ./backend
    depends_on:
      - postgres
      - redis
      - minio
    environment:
      DATABASE_URL: postgresql://sparklio:${DB_PASSWORD}@postgres/sparklio
      REDIS_URL: redis://redis:6379
      MINIO_ENDPOINT: minio:9000
    volumes:
      - ./backend:/app
    ports:
      - "8000:8000"

  celery:
    build: ./backend
    command: celery -A app.workers worker -l info
    depends_on:
      - backend
      - redis
    environment:
      CELERY_BROKER_URL: redis://redis:6379

  frontend:
    build: ./frontend
    depends_on:
      - backend
    environment:
      NEXT_PUBLIC_API_URL: http://backend:8000
    volumes:
      - ./frontend:/app
    ports:
      - "3000:3000"

volumes:
  postgres_data:
  redis_data:
  minio_data:
```

---

## 3. 주요 기술 결정 사항

### 3.1 아키텍처 패턴 결정

| 패턴 | 선택 | 이유 | 대안 |
|------|------|------|------|
| **API Style** | REST + WebSocket | 단순함, 실시간 | GraphQL, gRPC |
| **Creation Flow** | Chat-Driven + Review Buffer | UX 최적화, 수정 용이 | Direct Generation |
| **Agent Comm** | A2A Protocol (Message Bus) | 확장성, 모듈화 | Direct Function Call |
| **State Sync** | Event Sourcing Lite | 이력 관리 | CRDT, OT |
| **Auth** | JWT + Refresh | Stateless | Session, OAuth only |
| **File Handle** | Stream + Chunk | 대용량 처리 | Direct upload |
| **Caching** | Multi-layer | 성능 최적화 | Simple cache |

### 3.2 Chat-Driven Creation & Review Buffer

Sparklio.ai의 핵심 UX 패턴:

```typescript
// Chat-Driven Creation Flow
interface CreationFlow {
  // 1. 사용자 입력 (키워드/문장)
  userInput: string;

  // 2. AI 질문 세트 (메뉴별 사전 설계)
  questions: Question[];

  // 3. 초안 생성 (Preview)
  draft: ContentDraft;

  // 4. Review Buffer (수정 단계)
  reviewBuffer: {
    status: 'draft' | 'reviewing' | 'approved';
    userEdits: Edit[];
    aiSuggestions: Suggestion[];
  };

  // 5. 최종 확정 ([생성] 버튼)
  finalContent: Content;
}

// Review Buffer Implementation
class ReviewBuffer {
  /**
   * AI가 먼저 초안을 만들고, 사용자가 수정한 뒤 [생성] 버튼을 눌러 확정
   * "AI가 다 해줬는데 마음에 안 든다"를 최소화하는 구조
   */

  async createDraft(brief: Brief): Promise<ContentDraft> {
    // AI가 초안 생성
    const draft = await this.generateDraft(brief);

    return {
      content: draft,
      status: 'draft',
      canEdit: true,
      canApprove: true
    };
  }

  async applyUserEdits(draft: ContentDraft, edits: Edit[]): Promise<ContentDraft> {
    // 사용자 수정 적용
    const updated = this.applyEdits(draft, edits);

    // AI 추가 제안 (선택적)
    const suggestions = await this.generateSuggestions(updated);

    return {
      ...updated,
      status: 'reviewing',
      suggestions
    };
  }

  async approve(draft: ContentDraft): Promise<Content> {
    // 최종 확정
    return {
      ...draft.content,
      status: 'approved',
      version: draft.version + 1,
      approvedAt: new Date()
    };
  }
}
```

### 3.3 Multi-Agent A2A System

16개 전문 에이전트의 협업 아키텍처 (AGENTS_SPEC.md 기반):

```python
# A2A Protocol Implementation
class A2AProtocol:
    """
    Agent-to-Agent 통신 프로토콜
    - WebSocket EventBus + Celery Queue
    - 우선순위 큐: P0(인터랙티브) / P1(배치) / P2(학습)
    - Idempotency-Key로 중복 방지
    """
    def __init__(self):
        self.message_schema = {
            "message_id": str,
            "timestamp": datetime,
            "sender": str,          # 발신 에이전트
            "receiver": str,        # 수신 에이전트
            "correlation_id": Optional[str],  # 상위 작업 ID
            "priority": str,        # P0 / P1 / P2
            "payload": dict
        }

    async def send_message(self, message: dict):
        """에이전트 간 메시지 전송"""
        validated = self.validate(message)

        # Priority Queue로 전송
        queue_name = f"agent.{message['receiver']}.{message['priority']}"
        await self.broker.publish(
            routing_key=queue_name,
            body=json.dumps(validated)
        )

    async def handle_response(self, response: dict):
        """응답 처리"""
        if response['status'] == 'error':
            await self.handle_error(response)
        else:
            await self.process_result(response)

# Agent 협업 워크플로우 예시
class PresentationWorkflow:
    """
    프레젠테이션 생성 워크플로우
    PMAgent → StrategistAgent → CopywriterAgent → VisionGeneratorAgent
    """
    async def execute(self, brief: Brief):
        # 1. PMAgent: 워크플로 조율
        plan = await self.pm_agent.create_plan(brief)

        # 2. StrategistAgent: 전략 수립
        strategy = await self.strategist_agent.develop_strategy(plan)

        # 3. CopywriterAgent: 슬라이드별 카피 작성
        copies = await self.copywriter_agent.write_slides(strategy)

        # 4. VisionGeneratorAgent: 이미지 생성
        images = await self.vision_agent.generate_images(copies)

        # 5. 통합 및 반환
        return self.assemble_presentation(copies, images)
```

### 3.4 Canvas 모델 설계

```typescript
interface CanvasModel {
  version: number;
  objects: CanvasObject[];
  background: string;
  metadata: {
    brandKit: BrandKit;
    brief: Brief;
    lastModified: Date;
  };
}

interface CanvasObject {
  id: string;
  type: 'text' | 'image' | 'shape' | 'group';
  props: ObjectProps;
  transform: Transform;
  styles: Styles;
  interactions: Interaction[];
}

// Action DSL for State Sync
type Action =
  | { type: 'ADD_OBJECT'; payload: CanvasObject }
  | { type: 'UPDATE_OBJECT'; id: string; payload: Partial<CanvasObject> }
  | { type: 'DELETE_OBJECT'; id: string }
  | { type: 'REORDER'; from: number; to: number };
```

### 3.5 에이전트 목록 (16개)

AGENTS_SPEC.md에 정의된 전체 에이전트 구조:

**Creation Agents (9개):**
1. StrategistAgent - 캠페인 전략·구조 설계
2. CopywriterAgent - 카피/콘텐츠 작성
3. VisionGeneratorAgent - 이미지 생성
4. VisionAnalyzerAgent - 시각 품질 평가
5. ScenePlannerAgent - 영상 씬 구성
6. StoryboardBuilderAgent - 스토리보드 생성
7. VideoDirectorAgent - 영상 제작·컷 구성
8. VideoReviewerAgent - 영상 품질 검사
9. TemplateAgent - 템플릿 자동 생성

**Intelligence Agents (11개):**
- TrendCollectorAgent ← DATA_PIPELINE_PLAN.md Collector
- DataCleanerAgent ← DATA_PIPELINE_PLAN.md Cleaner
- EmbedderAgent ← DATA_PIPELINE_PLAN.md Embedder
- IngestorAgent ← DATA_PIPELINE_PLAN.md Ingestor
- ReviewerAgent ← BRAND_LEARNING_ENGINE.md Self-Learning Loop
- PerformanceAnalyzerAgent ← BRAND_LEARNING_ENGINE.md Performance Analyzer
- SelfLearningAgent ← BRAND_LEARNING_ENGINE.md Core
- BrandModelUpdaterAgent ← BRAND_LEARNING_ENGINE.md
- RAGAgent ← DATA_PIPELINE_PLAN.md RAG Engine
- TrendAgent, DataCollectorAgent

**System Agents (4개):**
- PMAgent - 워크플로 조율
- SecurityAgent - 정책·보안 검증
- BudgetAgent - 비용 추적
- ADAgent - 광고 퍼포먼스 최적화

---

## 4. 기술 선택 비교 분석

### 4.1 Backend Framework 비교

| 기준 | FastAPI | Django | Flask | Node.js |
|------|---------|--------|-------|---------|
| **성능** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| **개발 속도** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| **타입 안정성** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ |
| **AI 생태계** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| **비동기 지원** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| **문서화** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |

**결정**: FastAPI - 타입 힌트, 자동 문서화, 높은 성능

### 4.2 Database 비교

| 기준 | PostgreSQL | MongoDB | MySQL | DynamoDB |
|------|------------|---------|-------|----------|
| **ACID** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **JSON 지원** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| **확장성** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **벡터 지원** | ⭐⭐⭐⭐⭐ | ⭐ | ⭐ | ⭐ |
| **비용** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| **운영 복잡도** | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

**결정**: PostgreSQL - pgvector 지원, JSONB, 성숙도

### 4.3 Canvas Library 비교

| 기준 | Fabric.js | Konva | Paper.js | PixiJS |
|------|-----------|--------|----------|--------|
| **객체 모델** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| **이벤트 처리** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **성능** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **문서화** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| **플러그인** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ |
| **학습 곡선** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |

**결정**: Fabric.js - 풍부한 객체 모델, 에디터 특화 기능

---

## 5. 성능 최적화 전략

### 5.1 Frontend 최적화

```typescript
// 1. Code Splitting
const Editor = dynamic(() => import('@/components/editor'), {
  ssr: false,
  loading: () => <EditorSkeleton />
});

// 2. Image Optimization
<Image
  src={imageUrl}
  alt="Product"
  width={800}
  height={600}
  placeholder="blur"
  blurDataURL={blurUrl}
  priority={isAboveFold}
/>

// 3. State Management Optimization
const useOptimizedStore = create(
  subscribeWithSelector(
    devtools(
      immer((set) => ({
        // Immer for immutability
        updateCanvas: (updater) => set((state) => {
          updater(state.canvas);
        })
      }))
    )
  )
);
```

### 5.2 Backend 최적화

```python
# 1. Database Query Optimization
from sqlalchemy.orm import selectinload, joinedload

async def get_brief_with_assets(brief_id: UUID):
    return await db.query(Brief)\
        .options(
            selectinload(Brief.assets),
            joinedload(Brief.brand)
        )\
        .filter(Brief.id == brief_id)\
        .first()

# 2. Caching Strategy
@cache(expire=3600)
async def get_brand_kit(brand_id: str):
    return await brand_service.get_kit(brand_id)

# 3. Async Processing
async def generate_content(brief: Brief):
    tasks = [
        generate_headline(brief),
        generate_body(brief),
        generate_cta(brief)
    ]
    results = await asyncio.gather(*tasks)
    return combine_results(results)
```

### 5.3 인프라 최적화

```yaml
# Nginx Configuration
upstream backend {
    least_conn;
    server backend1:8000 weight=3;
    server backend2:8000 weight=2;
    keepalive 32;
}

server {
    location /api/ {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Connection "";

        # Caching
        proxy_cache_valid 200 1m;
        proxy_cache_bypass $http_cache_control;

        # Compression
        gzip on;
        gzip_types application/json;
    }

    location /ws/ {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

---

## 6. 보안 고려사항

### 6.1 보안 스택

| 영역 | 기술/방법 | 구현 |
|------|----------|------|
| **인증** | JWT + Refresh Token | Access 15분, Refresh 7일 |
| **권한** | RBAC + ABAC | Casbin 정책 엔진 |
| **암호화** | TLS 1.3 | Let's Encrypt |
| **데이터** | AES-256-GCM | 민감 데이터 암호화 |
| **API 보안** | Rate Limiting | Redis 기반 |
| **입력 검증** | Pydantic | 자동 검증 |
| **XSS 방지** | CSP Headers | Strict CSP |
| **CSRF** | Double Submit | Token + Cookie |

### 6.2 보안 구현 예시

```python
# API Rate Limiting
from fastapi_limiter import FastAPILimiter
from fastapi_limiter.depends import RateLimiter

@app.get("/api/generate")
@dependencies(RateLimiter(times=10, seconds=60))
async def generate_content(request: GenerateRequest):
    return await content_service.generate(request)

# Input Sanitization
from bleach import clean

class SanitizedInput(BaseModel):
    content: str

    @validator('content')
    def sanitize_content(cls, v):
        return clean(v, tags=[], strip=True)

# Encryption
from cryptography.fernet import Fernet

class EncryptionService:
    def __init__(self, key: bytes):
        self.cipher = Fernet(key)

    def encrypt_pii(self, data: str) -> str:
        return self.cipher.encrypt(data.encode()).decode()

    def decrypt_pii(self, encrypted: str) -> str:
        return self.cipher.decrypt(encrypted.encode()).decode()
```

---

## 7. 확장성 고려사항

### 7.1 수평 확장 전략

```mermaid
graph TB
    LB[Load Balancer]
    LB --> API1[API Server 1]
    LB --> API2[API Server 2]
    LB --> API3[API Server 3]

    API1 --> Cache[Redis Cache]
    API2 --> Cache
    API3 --> Cache

    API1 --> DB[(PostgreSQL)]
    API2 --> DB
    API3 --> DB

    API1 --> Queue[Celery Queue]
    API2 --> Queue
    API3 --> Queue

    Queue --> Worker1[Worker 1]
    Queue --> Worker2[Worker 2]
    Queue --> Worker3[Worker 3]
```

### 7.2 데이터베이스 확장

- **Read Replicas**: 읽기 부하 분산
- **Partitioning**: 시간 기반 파티셔닝
- **Connection Pooling**: PgBouncer
- **Caching Layer**: Redis + Query Cache

### 7.3 마이크로서비스 전환 계획

```yaml
# Phase 1: Monolith (Current)
services:
  - sparklio-api

# Phase 2: Service Separation (6 months)
services:
  - auth-service
  - content-service
  - publishing-service
  - sparklio-gateway

# Phase 3: Full Microservices (12 months)
services:
  - auth-service
  - brand-service
  - brief-service
  - generation-service
  - publishing-service
  - notification-service
  - analytics-service
  - api-gateway
```

---

## 8. 모니터링 및 관측성

### 8.1 메트릭 수집

```python
# Prometheus Metrics
from prometheus_client import Counter, Histogram, Gauge

request_count = Counter('api_requests_total', 'Total API requests')
request_duration = Histogram('api_request_duration_seconds', 'API request duration')
active_users = Gauge('active_users', 'Currently active users')

@app.middleware("http")
async def track_metrics(request: Request, call_next):
    start = time.time()
    response = await call_next(request)

    request_count.inc()
    request_duration.observe(time.time() - start)

    return response
```

### 8.2 로깅 전략

```python
# Structured Logging
import structlog

logger = structlog.get_logger()

logger.info(
    "content_generated",
    user_id=user.id,
    brief_id=brief.id,
    model=selected_model,
    tokens=token_count,
    duration=generation_time
)
```

### 8.3 알림 규칙

| 메트릭 | 임계값 | 액션 |
|--------|--------|------|
| API Error Rate | > 1% | PagerDuty 알림 |
| Response Time P95 | > 3s | Slack 경고 |
| Memory Usage | > 80% | Auto-scale |
| Queue Length | > 1000 | Worker 추가 |
| DB Connections | > 80% | Connection pool 확장 |

---

## 9. 개발 환경 설정

### 9.1 개발 도구

```bash
# Development Setup Script
#!/bin/bash

# Python Environment
python -m venv venv
source venv/bin/activate
pip install -r requirements-dev.txt

# Pre-commit Hooks
pre-commit install

# Environment Variables
cp .env.example .env

# Database Setup
docker-compose up -d postgres redis minio
alembic upgrade head

# Frontend Setup
cd frontend
npm install
npm run dev
```

### 9.2 코드 품질 도구

| 도구 | 용도 | 설정 |
|------|------|------|
| **Black** | Python 포매팅 | line-length=100 |
| **Ruff** | Python 린팅 | select=["E", "F", "I"] |
| **Prettier** | JS/TS 포매팅 | semi=false |
| **ESLint** | JS/TS 린팅 | extends=next |
| **Husky** | Git Hooks | pre-commit, pre-push |
| **Jest** | Unit Testing | coverage > 80% |
| **Cypress** | E2E Testing | Chrome, Firefox |

---

## 10. 마이그레이션 전략

### 10.1 데이터베이스 마이그레이션

```python
# Alembic Migration
"""Add vector extension and embeddings table

Revision ID: 001
"""
from alembic import op
import sqlalchemy as sa
from pgvector.sqlalchemy import Vector

def upgrade():
    op.execute('CREATE EXTENSION IF NOT EXISTS vector')

    op.create_table(
        'embeddings',
        sa.Column('id', sa.UUID(), primary_key=True),
        sa.Column('embedding', Vector(1536)),
        sa.Column('metadata', sa.JSON())
    )

    op.create_index(
        'ix_embeddings_vector',
        'embeddings',
        ['embedding'],
        postgresql_using='ivfflat',
        postgresql_ops={'embedding': 'vector_cosine_ops'}
    )

def downgrade():
    op.drop_table('embeddings')
```

### 10.2 API 버전 관리

```python
# API Versioning Strategy
from fastapi import APIRouter

# v1 API (Current)
v1_router = APIRouter(prefix="/api/v1")

@v1_router.post("/generate")
async def generate_v1(request: GenerateRequestV1):
    return await generate_service.process_v1(request)

# v2 API (Future)
v2_router = APIRouter(prefix="/api/v2")

@v2_router.post("/generate")
async def generate_v2(request: GenerateRequestV2):
    return await generate_service.process_v2(request)

app.include_router(v1_router)
app.include_router(v2_router)
```

---

## 11. 비용 최적화

### 11.1 리소스 할당

| 서비스 | 개발 | 스테이징 | 프로덕션 |
|--------|------|----------|----------|
| **API Server** | 1 CPU, 2GB | 2 CPU, 4GB | 4 CPU, 8GB |
| **PostgreSQL** | 10GB | 50GB | 100GB+ |
| **Redis** | 1GB | 4GB | 8GB |
| **MinIO** | 50GB | 200GB | 1TB+ |
| **Worker** | 2 CPU, 4GB | 4 CPU, 8GB | 8 CPU, 16GB |

### 11.2 비용 절감 전략

- **Spot Instances**: 배치 작업용
- **Reserved Capacity**: DB, Redis
- **Auto-scaling**: 트래픽 기반
- **Cold Storage**: 오래된 에셋
- **CDN**: 정적 자원 캐싱

---

## 12. 결론 및 향후 계획

### 12.1 기술 부채 관리

- 분기별 리팩토링 스프린트
- 의존성 업데이트 자동화
- 기술 부채 백로그 관리

### 12.2 향후 고려 기술

- **GraphQL**: API 유연성 (v2.0)
- **Kubernetes**: 오케스트레이션 (Scale)
- **Kafka**: 이벤트 스트리밍 (Scale)
- **Elasticsearch**: 고급 검색 (v1.5)

### 12.3 변경 이력

| 날짜 | 버전 | 변경 내용 | 승인자 |
|------|------|-----------|--------|
| 2025-01-13 | 1.0 | 초기 작성 | CTO |
| 2025-11-13 (목) | 1.1 | Multi-Node Infrastructure, Smart LLM Router, Chat-Driven Creation, Review Buffer, 16개 Agent 상세, 비용 경보 시스템 추가 | CTO |

---

## 13. 부록: 문서 간 통합 매핑

### 13.1 Phase 0 문서 관계도

```
TECH_DECISION_v1.md (본 문서)
├── 기술 스택 및 인프라 결정
├── Multi-Node Infrastructure 정의
└── Smart LLM Router 정책 참조
    │
    ├─→ LLM_ROUTER_POLICY.md
    │   ├── 5가지 프리셋 모드 (draft_fast, balanced, high_fidelity, privacy_first, cost_optimized)
    │   ├── 에이전트별 최적 모델 매핑
    │   ├── 브랜드 일관성 기반 라우팅
    │   └── 비용 경보 시스템 (Cost Alert System)
    │
    ├─→ AGENTS_SPEC.md
    │   ├── 16개 에이전트 상세 스펙
    │   ├── A2A Protocol 정의
    │   ├── Creation Agents (9개)
    │   ├── Intelligence Agents (11개)
    │   └── System Agents (4개)
    │
    ├─→ DATA_PIPELINE_PLAN.md
    │   ├── TrendPipeline (7단계)
    │   ├── TrendCollectorAgent 구현
    │   ├── DataCleanerAgent 구현
    │   └── RAG Engine 통합
    │
    ├─→ BRAND_LEARNING_ENGINE.md
    │   ├── Self-Learning Loop (4단계)
    │   ├── ReviewerAgent 구현
    │   ├── PerformanceAnalyzerAgent 구현
    │   ├── Brand Style Extractor
    │   └── A/B Testing Engine
    │
    └─→ MVP_v0_SCOPE_PLAN.md
        ├── Phase 0/1/2/3 로드맵
        └── 우선순위 기능 정의
```

### 13.2 주요 통합 포인트

| 기술 요소 | 정의 문서 | 구현 상세 | 연관 에이전트 |
|----------|----------|----------|--------------|
| **Smart LLM Router** | TECH_DECISION (본 문서) | LLM_ROUTER_POLICY.md | 모든 에이전트 |
| **Multi-Node Infra** | TECH_DECISION (본 문서) | README.md | NodeAwareRouter |
| **A2A Protocol** | AGENTS_SPEC.md | TECH_DECISION (본 문서) | 16개 전체 |
| **Review Buffer** | TECH_DECISION (본 문서) | Frontend 구현 | ReviewerAgent |
| **TrendPipeline** | DATA_PIPELINE_PLAN.md | AGENTS_SPEC.md | TrendCollectorAgent 등 7개 |
| **Brand Learning** | BRAND_LEARNING_ENGINE.md | AGENTS_SPEC.md | SelfLearningAgent 등 4개 |
| **Cost Alert** | LLM_ROUTER_POLICY.md | TECH_DECISION (본 문서) | BudgetAgent |

### 13.3 구현 우선순위 (MVP v0 기준)

**Phase 0 (기반 구축):**
1. Multi-Node Infrastructure 설정 (Tailscale + MinIO + PostgreSQL)
2. FastAPI + Celery 기본 구조
3. BaseAgent 클래스 및 A2A Protocol
4. Smart LLM Router 기본 구현

**Phase 1 (핵심 에이전트):**
1. PMAgent, StrategistAgent, CopywriterAgent
2. Review Buffer 프론트엔드
3. Chat-Driven Creation Flow
4. Unified Editor (Fabric.js)

**Phase 2 (확장):**
1. VisionGeneratorAgent, VideoDirectorAgent
2. TrendPipeline (TrendCollectorAgent → RAGAgent)
3. Brand Learning Engine (ReviewerAgent → SelfLearningAgent)
4. 비용 경보 시스템 (Cost Alert)

---

## 14. 결론

TECH_DECISION_v1.1은 Sparklio.ai의 **실제 개발 가능한 수준**의 기술 스택과 아키텍처를 정의합니다.

### 14.1 핵심 결정 요약

- **3-Node Hybrid 환경**: Desktop (RTX 4070) + Laptop (RTX 4060) + Mac mini M2 (24/7)
- **Smart LLM Router**: 5가지 프리셋 + 16개 에이전트별 최적화
- **Chat-Driven Creation**: 대화 → 질문 → 초안 → Review Buffer → 확정
- **Multi-Agent A2A**: 16개 전문 에이전트의 Message Bus 기반 협업
- **비용 최적화**: 로컬 GPU 우선 + 클라우드 Fallback + 비용 경보

### 14.2 확장 가능성

모든 기술 결정은 향후 확장을 고려하여 설계되었습니다:
- GPU Clustering (NVIDIA Triton / RunPod)
- Kubernetes 오케스트레이션
- 마이크로서비스 전환 (Phase 3)
- GraphQL API (v2.0)

본 문서는 **MVP v0 → v1 → v2** 전체 로드맵의 기술적 기반이 됩니다.
