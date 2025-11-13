# Sparklio – Technical Decisions Document v1.0

**Version:** 1.0
**Date:** 2025-11-13
**Status:** Approved
**Reviewers:** Engineering Team

---

## 📋 Overview

This document outlines key technical decisions made for Sparklio AI Marketing Studio, including rationale, alternatives considered, and trade-offs.

---

## 🎯 Decision Summary Table

| # | Decision | Choice | Status |
|---|----------|--------|--------|
| 1 | Backend Framework | FastAPI | ✅ Approved |
| 2 | Frontend Framework | Next.js 14 (App Router) | ✅ Approved |
| 3 | Database | PostgreSQL + pgvector | ✅ Approved |
| 4 | Task Queue | Celery + Redis | ✅ Approved |
| 5 | Object Storage | MinIO (S3-compatible) | ✅ Approved |
| 6 | LLM Strategy | Multi-provider with Router | ✅ Approved |
| 7 | Agent Framework | Custom A2A Protocol | ✅ Approved |
| 8 | Editor Technology | Fabric.js | ✅ Approved |
| 9 | Video Editing | Custom Timeline Component | ✅ Approved |
| 10 | Embedding Model | OpenAI text-embedding-3 | ✅ Approved |
| 11 | Local LLM Runtime | Ollama | ✅ Approved |
| 12 | Deployment (Dev) | Docker Compose | ✅ Approved |
| 13 | Deployment (Prod) | Kubernetes | 🔄 Roadmap |

---

## 1️⃣ Backend Framework: FastAPI

### Decision
**Use FastAPI as the primary backend framework.**

### Rationale
1. **Performance**: Built on Starlette and Pydantic, one of the fastest Python frameworks
2. **Async Support**: Native async/await for I/O-bound operations (LLM API calls)
3. **Auto Documentation**: Automatic OpenAPI/Swagger generation
4. **Type Safety**: Pydantic models for request/response validation
5. **Modern Python**: Full type hints, Python 3.11+ features
6. **Ecosystem**: Rich ecosystem for AI/ML integrations

### Alternatives Considered
- **Django + DRF**: Rejected due to heavier framework, slower for async operations
- **Flask**: Rejected due to lack of native async support, manual documentation
- **NestJS (Node.js)**: Rejected to keep backend unified in Python (ML/AI ecosystem)

### Trade-offs
- ✅ Fast, modern, type-safe
- ✅ Great for AI/ML integrations
- ❌ Smaller ecosystem than Django
- ❌ Fewer built-in features (auth, admin panel)

### Implementation Notes
- Use FastAPI 0.104+
- Structure: Layered architecture (API → Services → Agents → Models)
- Enable CORS for frontend communication
- Use dependency injection for database sessions

---

## 2️⃣ Frontend Framework: Next.js 14 (App Router)

### Decision
**Use Next.js 14 with App Router for the frontend.**

### Rationale
1. **React Ecosystem**: Leverage React component ecosystem
2. **Server Components**: Reduce client-side JavaScript, improve performance
3. **File-based Routing**: Intuitive routing structure
4. **API Routes**: Backend-for-frontend pattern for proxying
5. **TypeScript Support**: First-class TypeScript integration
6. **SEO**: Server-side rendering for marketing pages
7. **Streaming**: Streaming UI updates for AI-generated content

### Alternatives Considered
- **Create React App**: Rejected due to lack of SSR, slower performance
- **Vue/Nuxt**: Rejected due to smaller ecosystem for enterprise components
- **SvelteKit**: Rejected due to smaller community, fewer libraries
- **Remix**: Considered, but Next.js has larger community

### Trade-offs
- ✅ Modern, performant, great DX
- ✅ Large ecosystem, strong community
- ❌ Learning curve for App Router
- ❌ Complexity for simple apps

### Implementation Notes
- Use App Router (not Pages Router)
- Implement Server Components where possible
- Client Components for interactive editor
- Use Server Actions for form submissions

---

## 3️⃣ Database: PostgreSQL + pgvector

### Decision
**Use PostgreSQL 15+ with pgvector extension for all data storage.**

### Rationale
1. **Relational + Vector**: Single database for structured data + embeddings
2. **pgvector**: Native vector similarity search (no separate vector DB)
3. **JSONB**: Flexible schema for Brand Kits, Briefs, etc.
4. **Reliability**: Battle-tested, ACID compliance
5. **Performance**: Excellent performance for 100K-1M vectors
6. **Cost**: No additional vector DB licensing costs

### Alternatives Considered
- **MongoDB + Separate Vector DB (Pinecone/Weaviate)**: Rejected due to complexity, cost
- **Supabase (PostgreSQL + pgvector)**: Considered for managed hosting (roadmap)
- **MySQL**: Rejected due to lack of vector support
- **ChromaDB/Qdrant**: Rejected; prefer unified database

### Trade-offs
- ✅ Unified database, simpler architecture
- ✅ Cost-effective
- ✅ Excellent for <1M vectors
- ❌ May need dedicated vector DB at massive scale (10M+ vectors)

### Implementation Notes
- Install pgvector extension
- Use `vector(1536)` for OpenAI embeddings
- Index: `CREATE INDEX USING ivfflat`
- Separate read replicas for heavy queries (roadmap)

---

## 4️⃣ Task Queue: Celery + Redis

### Decision
**Use Celery with Redis as the message broker for async task processing.**

### Rationale
1. **Python Native**: Seamless integration with FastAPI backend
2. **Mature**: Battle-tested for background jobs
3. **Scalability**: Distributed workers, easy horizontal scaling
4. **Retries**: Built-in retry logic for failed tasks
5. **Monitoring**: Flower for task monitoring
6. **Agent Orchestration**: Natural fit for multi-agent workflows

### Alternatives Considered
- **RQ (Redis Queue)**: Simpler but less feature-rich
- **Dramatiq**: Similar features, smaller community
- **Cloud Functions (AWS Lambda, Google Cloud Functions)**: Rejected due to cold start latency
- **Temporal**: Over-engineered for current needs

### Trade-offs
- ✅ Robust, scalable, feature-rich
- ✅ Great for long-running tasks
- ❌ Requires separate worker processes
- ❌ Monitoring complexity

### Implementation Notes
- Redis as broker and result backend
- Separate queues: `high`, `default`, `low`
- Task routing: Fast tasks (high), AI tasks (default), batch (low)
- Use Flower for monitoring

---

## 5️⃣ Object Storage: MinIO (S3-compatible)

### Decision
**Use MinIO for object storage in development, S3-compatible API for production.**

### Rationale
1. **S3 Compatibility**: Same API as AWS S3, easy migration
2. **Self-hosted**: Free for development, full control
3. **Performance**: High-performance for multi-node setup
4. **Migration Path**: Easy switch to AWS S3, Cloudflare R2, or Backblaze B2

### Alternatives Considered
- **AWS S3**: Production choice, but costly for dev/testing
- **Local Filesystem**: Rejected due to multi-node sync issues
- **Cloudflare R2**: Considered for production (zero egress fees)

### Trade-offs
- ✅ Free, self-hosted, S3-compatible
- ✅ Easy to migrate
- ❌ Requires separate service
- ❌ Manual backups in dev

### Implementation Notes
- Docker Compose: MinIO service
- Buckets: `sparklio-uploads`, `sparklio-outputs`, `sparklio-temp`
- Presigned URLs for client uploads
- Production: Migrate to Cloudflare R2 or AWS S3

---

## 6️⃣ LLM Strategy: Multi-Provider with Smart Router

### Decision
**Support multiple LLM providers with a smart router that selects models based on cost, speed, and quality.**

### Rationale
1. **Cost Optimization**: Use cheaper models for simple tasks
2. **Redundancy**: Fallback if one provider has downtime
3. **Model Specialization**: Different models excel at different tasks
4. **Future-Proof**: Easy to add new providers/models

### Supported Providers
- **OpenAI**: GPT-4, GPT-4 Turbo, GPT-3.5 Turbo, DALL-E 3
- **Google**: Gemini 2.0 Pro, Gemini 2.0 Flash
- **Anthropic**: Claude 3.5 Sonnet, Claude 3 Opus
- **Local**: Qwen, Llama 3, Mistral (via Ollama)

### Router Decision Matrix
- **Complexity**: Simple → Gemini Flash, Medium → GPT-4, Complex → Claude Opus
- **Cost Budget**: Low → Local LLM, Medium → Gemini, High → GPT-4
- **Speed**: Real-time → Gemini Flash, Batch → GPT-4 Turbo
- **Quality**: Draft → Local, Production → GPT-4/Claude

### Alternatives Considered
- **Single Provider (OpenAI only)**: Rejected due to cost and single point of failure
- **LangChain Router**: Considered but too heavyweight for our needs

### Trade-offs
- ✅ Cost savings (30-50%)
- ✅ Redundancy and reliability
- ✅ Model specialization
- ❌ Complexity in router logic
- ❌ Testing across multiple providers

### Implementation Notes
- Router class: `LLMRouter`
- Config: Model costs, speed benchmarks, quality scores
- Fallback chain: Primary → Secondary → Tertiary
- BudgetAgent tracks usage per user

---

## 7️⃣ Agent Framework: Custom A2A Protocol

### Decision
**Build a custom Agent-to-Agent (A2A) communication protocol instead of using existing frameworks.**

### Rationale
1. **Simplicity**: Existing frameworks (LangGraph, AutoGPT) are over-engineered for our needs
2. **Control**: Full control over agent behavior and communication
3. **Performance**: Lightweight, no unnecessary overhead
4. **Integration**: Seamless Celery integration
5. **Customization**: Easy to add custom agents

### A2A Protocol
- **Message Format**: JSON with `message_id`, `timestamp`, `from_agent`, `to_agent`, `payload`
- **Transport**: Redis pub/sub + Celery tasks
- **Orchestration**: PM Agent coordinates workflows
- **Logging**: All messages logged to `agent_logs` table

### Alternatives Considered
- **LangGraph**: Too complex, designed for different use cases
- **AutoGPT**: Agent autonomy not needed, we have structured workflows
- **CrewAI**: Considered, but wanted full control
- **Microsoft Semantic Kernel**: .NET-focused

### Trade-offs
- ✅ Lightweight, fast, full control
- ✅ Easy to understand and debug
- ❌ We maintain the framework
- ❌ No pre-built agent libraries

### Implementation Notes
- Base class: `BaseAgent`
- PM Agent: Orchestrates all workflows
- Agent registry: Dynamic agent loading
- Error handling: Retry logic, dead letter queue

---

## 8️⃣ Editor Technology: Fabric.js

### Decision
**Use Fabric.js for the One-Page Editor (text, images, layouts).**

### Rationale
1. **Canvas-Based**: HTML5 Canvas for high performance
2. **Rich Features**: Text, images, shapes, groups, layers
3. **Serialization**: Easy to save/load designs as JSON
4. **Customizable**: Full control over rendering
5. **Active Community**: Regular updates, good documentation

### Alternatives Considered
- **Konva.js**: Similar to Fabric, less feature-rich
- **Paper.js**: Vector graphics focused, less suitable for layouts
- **Lexical (Meta)**: Text editor only, not for visual layouts
- **TipTap**: Rich text only
- **Canva SDK**: Not available for self-hosted

### Trade-offs
- ✅ Powerful, flexible, performant
- ✅ Great for design tools
- ❌ Learning curve
- ❌ Canvas accessibility challenges

### Implementation Notes
- Wrapper component: `<FabricEditor>`
- Plugins: Text styling, image filters, templates
- Export: JSON, PNG, PDF
- Collaboration (roadmap): Sync canvas state via WebSocket

---

## 9️⃣ Video Editing: Custom Timeline Component

### Decision
**Build a custom timeline-based video editor component (not Fabric.js).**

### Rationale
1. **Specialized UI**: Video editing needs timeline, not canvas
2. **Performance**: HTML5 Video API + custom rendering
3. **Flexibility**: Full control over timeline UX
4. **Integration**: Easy to integrate with Sora2, local video generation

### Key Features
- Timeline tracks (video, audio, text overlays, effects)
- Frame-accurate scrubbing
- Transitions library
- Text overlays with keyframe animations
- Export to MP4, MOV, WEBM

### Alternatives Considered
- **Remotion**: React-based video, but designed for programmatic video
- **Video.js**: Player only, not an editor
- **ffmpeg.wasm**: Used for rendering, not UI
- **Third-party embeds (Kapwing, Descript)**: Not self-hosted

### Trade-offs
- ✅ Full control, tailored UX
- ✅ No licensing costs
- ❌ Development effort
- ❌ We maintain the component

### Implementation Notes
- Component: `<VideoStudio>`
- Backend: ffmpeg for rendering
- Storyboard: Separate component for scene planning
- Export: Use ffmpeg via Celery task

---

## 🔟 Embedding Model: OpenAI text-embedding-3

### Decision
**Use OpenAI `text-embedding-3-small` (1536 dimensions) for RAG embeddings.**

### Rationale
1. **Quality**: State-of-the-art embedding quality
2. **Cost**: $0.00002/1K tokens (very affordable)
3. **Speed**: Fast generation (<100ms for 512 tokens)
4. **Consistency**: Same provider as GPT models
5. **Dimensionality**: 1536 dims is optimal for pgvector performance

### Alternatives Considered
- **OpenAI text-embedding-3-large**: Higher cost, marginal quality gain
- **Google Gemini embeddings**: Considered, similar quality
- **Sentence Transformers (local)**: Free but lower quality
- **Cohere embeddings**: Good quality, but another provider

### Trade-offs
- ✅ Excellent quality, low cost
- ✅ Fast, reliable
- ❌ Vendor lock-in (can migrate if needed)

### Implementation Notes
- Model: `text-embedding-3-small`
- Chunk size: 512 tokens
- Batch processing: 100 chunks per request
- Fallback: Gemini embeddings if OpenAI fails

---

## 1️⃣1️⃣ Local LLM Runtime: Ollama

### Decision
**Use Ollama for running local LLMs (Qwen, Llama, Mistral).**

### Rationale
1. **Easy Setup**: Simple installation, model management
2. **OpenAI-Compatible API**: Same API interface as OpenAI
3. **Model Library**: Pre-built models (Qwen, Llama, Mistral, etc.)
4. **Performance**: Optimized for inference
5. **Free**: No API costs for local models

### Supported Models
- **Qwen 2.5**: General purpose (7B, 14B)
- **Llama 3.2**: Multilingual (8B, 70B)
- **Mistral**: Efficient, good quality (7B)
- **Qwen Coder**: Code generation

### Alternatives Considered
- **LM Studio**: GUI-focused, less suitable for backend
- **vLLM**: More complex setup
- **Hugging Face Transformers**: Manual model loading, slower
- **LocalAI**: Similar to Ollama, smaller community

### Trade-offs
- ✅ Free, fast, easy to use
- ✅ OpenAI-compatible API
- ❌ Requires GPU (RTX 4070 SUPER on Desktop)
- ❌ Quality lower than GPT-4/Claude for complex tasks

### Implementation Notes
- Install Ollama on Desktop node (RTX 4070 SUPER)
- Expose API via Tailscale
- Router prioritizes local models for simple tasks
- Fallback to cloud models if local unavailable

---

## 1️⃣2️⃣ Deployment (Development): Docker Compose

### Decision
**Use Docker Compose for development and pre-production deployment.**

### Rationale
1. **Simplicity**: Easy to set up and manage
2. **Consistency**: Same environment across all nodes
3. **Multi-Node**: Works with Tailscale for distributed setup
4. **Fast Iteration**: Quick rebuilds and restarts

### Services
- **fastapi**: Backend API
- **celery-worker**: Background tasks
- **celery-beat**: Scheduled tasks (roadmap)
- **postgres**: Database
- **redis**: Cache and queue
- **minio**: Object storage
- **nextjs**: Frontend (dev server)

### Alternatives Considered
- **Kubernetes**: Overkill for dev, planned for production
- **Docker Swarm**: Less popular than Kubernetes
- **Manual setup**: Error-prone, inconsistent

### Trade-offs
- ✅ Simple, fast, easy to debug
- ✅ Good for 1-3 nodes
- ❌ Not production-grade
- ❌ Manual scaling

### Implementation Notes
- `docker-compose.yml` in project root
- Environment variables in `.env`
- Volumes for persistence
- Healthchecks for all services

---

## 1️⃣3️⃣ Deployment (Production): Kubernetes (Roadmap)

### Decision
**Plan to migrate to Kubernetes for production deployment.**

### Rationale
1. **Scalability**: Auto-scaling based on load
2. **High Availability**: Self-healing, rolling updates
3. **Industry Standard**: Well-supported, large ecosystem
4. **Cloud-Agnostic**: Deploy on AWS, GCP, Azure, or on-prem

### Alternatives Considered
- **AWS ECS**: AWS-specific, less portable
- **Google Cloud Run**: Good for stateless apps, less suitable for workers
- **Serverless (Lambda/Cloud Functions)**: Not suitable for long-running tasks

### Trade-offs
- ✅ Production-grade, scalable
- ✅ Cloud-agnostic
- ❌ Complex setup
- ❌ Higher operational overhead

### Implementation Notes (Roadmap)
- Use Helm charts
- Services: API, Workers, Postgres (RDS), Redis (ElastiCache)
- Ingress: NGINX or Traefik
- Monitoring: Prometheus + Grafana

---

## 🔧 Development Tools

### Code Quality
- **Black**: Code formatting (Python)
- **Flake8**: Linting (Python)
- **mypy**: Type checking (Python)
- **ESLint**: Linting (TypeScript/JavaScript)
- **Prettier**: Code formatting (TypeScript/JavaScript)

### Testing
- **pytest**: Backend unit/integration tests
- **Jest**: Frontend unit tests
- **Playwright**: End-to-end tests (roadmap)

### CI/CD
- **GitHub Actions**: Automated testing, linting, building
- **Pre-commit hooks**: Enforce formatting and linting

### Monitoring (Roadmap)
- **Sentry**: Error tracking
- **Prometheus + Grafana**: Metrics and dashboards
- **Flower**: Celery task monitoring

---

## 📊 Decision Review Process

1. **Proposal**: Engineer proposes new tech decision
2. **Discussion**: Team reviews rationale, alternatives, trade-offs
3. **Prototype**: Build small proof-of-concept if needed
4. **Approval**: Tech lead approves or requests revisions
5. **Documentation**: Update this document
6. **Implementation**: Integrate into codebase

---

## 🔄 Revision History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2025-11-13 | Initial version | Engineering Team |

---

## 📞 Questions or Suggestions?

Contact the tech lead or open a GitHub issue for discussion.

---

**Status**: Living Document – Updated as new decisions are made
