# Sparklio MVP v0 – Scope & Plan

**Version:** 0.1
**Date:** 2025-11-13
**Status:** Planning
**Phase:** 0 (Foundation)

---

## 🎯 MVP Objective

Build the **foundational infrastructure** for Sparklio AI Marketing Studio that enables:
1. Multi-agent A2A communication system
2. Smart LLM routing with cost optimization
3. Basic brand analysis and marketing brief generation
4. Simple content editor for text and images
5. Resource collection and RAG-based knowledge retrieval

**Goal**: Validate core architecture and demonstrate end-to-end workflow for ONE complete module (Brand Analysis).

---

## 📦 MVP Scope (Phase 0)

### In Scope

#### 1. Backend Infrastructure
- ✅ FastAPI server with REST endpoints
- ✅ PostgreSQL database with pgvector
- ✅ Redis for caching and job queues
- ✅ Celery worker setup
- ✅ MinIO/S3 for file storage
- ✅ Basic authentication (JWT)

#### 2. Multi-Agent Framework
- ✅ A2A protocol implementation
- ✅ Agent base class and registry
- ✅ PM Agent (workflow orchestration)
- ✅ Message queue (agent-to-agent communication)
- ✅ Agent lifecycle management

#### 3. LLM Router
- ✅ Router core logic (cost/speed/quality optimization)
- ✅ OpenAI GPT-4 integration
- ✅ Google Gemini integration
- ✅ Anthropic Claude integration
- ✅ Local LLM support (Ollama/Qwen/Llama)
- ✅ Usage tracking and cost calculation

#### 4. Module 1: Brand Analysis (Complete)
- ✅ File upload API (logo, documents, images)
- ✅ VisionAnalyzerAgent (color extraction, logo analysis)
- ✅ RAGAgent setup (document parsing and embedding)
- ✅ Brand Kit JSON generation
- ✅ Brand Kit storage and retrieval APIs

#### 5. Module 2: Marketing Brief (Basic)
- ✅ Chat-based interview flow
- ✅ StrategistAgent (question generation, brief structuring)
- ✅ Brief JSON storage
- ✅ Brief editing and retrieval

#### 6. Module 10: RAG Pipeline (Basic)
- ✅ File upload and parsing (PDF, DOCX, TXT)
- ✅ Text chunking and embedding
- ✅ pgvector storage
- ✅ Semantic search API
- ✅ Context retrieval for agents

#### 7. Frontend (Minimal)
- ✅ Next.js app setup
- ✅ Brand analysis upload interface
- ✅ Chat interface for brief generation
- ✅ Brand Kit display component
- ✅ Basic text editor (no Fabric.js yet)

#### 8. Infrastructure
- ✅ Docker Compose setup
- ✅ Environment configuration
- ✅ Database migrations (Alembic)
- ✅ Logging and monitoring setup

### Out of Scope (Phase 0)

❌ Advanced content modules (SNS, presentations, video)
❌ One-Page Editor (Fabric.js integration)
❌ Video Studio
❌ Publishing/distribution
❌ Trend analysis
❌ Template generation
❌ WordPress integration
❌ Advanced scheduling (APScheduler)
❌ Team collaboration features
❌ Analytics dashboard
❌ Mobile app
❌ Production Kubernetes deployment

---

## 🗓️ Timeline

**Total Duration:** 2 weeks (10 working days)

### Week 1: Backend Foundation

**Day 1-2: Project Setup**
- Initialize repository structure
- Set up Docker Compose (FastAPI, PostgreSQL, Redis, MinIO)
- Configure environment variables
- Database schema design (users, brands, briefs, resources, embeddings)
- Alembic migrations setup

**Day 3-4: Agent Framework**
- Implement A2A protocol (message format, queue)
- Create Agent base class
- Implement PM Agent
- Create agent registry and lifecycle management
- Unit tests for agent communication

**Day 5: LLM Router**
- Router core logic implementation
- OpenAI, Gemini, Claude client wrappers
- Ollama integration for local LLMs
- Cost tracking logic
- Router decision tests

### Week 2: Modules & Frontend

**Day 6-7: Brand Analysis Module**
- File upload API
- VisionAnalyzerAgent implementation
- Color extraction (OpenCV/PIL)
- Logo analysis (GPT-4V)
- Brand Kit JSON generation
- Storage and retrieval APIs

**Day 8: Marketing Brief Module**
- StrategistAgent implementation
- Chat conversation API
- Brief generation logic
- Brief storage

**Day 9: RAG Pipeline**
- File parsing (PyPDF2, python-docx)
- Text chunking
- Embedding generation (OpenAI)
- pgvector integration
- Semantic search API

**Day 10: Frontend & Integration**
- Next.js app setup
- Upload interface
- Chat UI component
- Brand Kit display
- Integration testing
- Documentation

---

## 🏗️ Architecture Diagram (MVP)

```
┌─────────────────────────────────────────────────────────┐
│                     Frontend (Next.js)                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Brand Upload │  │  Chat UI     │  │ Brand Kit    │  │
│  │  Interface   │  │ (Brief Gen)  │  │   Display    │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                          │ HTTP/WebSocket
                          ▼
┌─────────────────────────────────────────────────────────┐
│                   FastAPI Backend                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Brand API   │  │  Brief API   │  │  RAG API     │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│                          │                              │
│                   ┌──────▼──────┐                       │
│                   │  LLM Router  │                      │
│                   └──────┬──────┘                       │
│                          │                              │
│  ┌───────────────────────▼──────────────────────────┐  │
│  │          Multi-Agent System (A2A)                │  │
│  │  ┌────────────┐ ┌──────────────┐ ┌───────────┐  │  │
│  │  │ PM Agent   │ │ Strategist   │ │  Vision   │  │  │
│  │  │ (Celery)   │ │    Agent     │ │  Analyzer │  │  │
│  │  └────────────┘ └──────────────┘ └───────────┘  │  │
│  │  ┌────────────┐ ┌──────────────┐               │  │
│  │  │ RAG Agent  │ │ Copywriter   │               │  │
│  │  └────────────┘ └──────────────┘               │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
        ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  PostgreSQL  │  │    Redis     │  │    MinIO     │
│  + pgvector  │  │  (Queue/     │  │  (File       │
│              │  │   Cache)     │  │   Storage)   │
└──────────────┘  └──────────────┘  └──────────────┘
                          │
                ┌─────────┼─────────┐
                │         │         │
                ▼         ▼         ▼
        ┌─────────┐ ┌─────────┐ ┌─────────┐
        │ OpenAI  │ │ Gemini  │ │ Claude  │
        │  API    │ │  API    │ │  API    │
        └─────────┘ └─────────┘ └─────────┘
                ┌──────────┐
                │  Ollama  │
                │ (Local)  │
                └──────────┘
```

---

## 📊 Database Schema (MVP)

### Tables

**users**
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

**brands**
```sql
CREATE TABLE brands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    brand_kit JSONB,  -- Brand Kit JSON
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

**briefs**
```sql
CREATE TABLE briefs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    brand_id UUID REFERENCES brands(id) ON DELETE SET NULL,
    campaign_name VARCHAR(255),
    brief_data JSONB,  -- Brief JSON
    status VARCHAR(50) DEFAULT 'draft',  -- draft, completed
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

**resources**
```sql
CREATE TABLE resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    brand_id UUID REFERENCES brands(id) ON DELETE SET NULL,
    file_name VARCHAR(255),
    file_type VARCHAR(50),
    file_url TEXT,  -- S3/MinIO URL
    file_size INTEGER,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);
```

**embeddings**
```sql
CREATE TABLE embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource_id UUID REFERENCES resources(id) ON DELETE CASCADE,
    chunk_text TEXT,
    chunk_index INTEGER,
    embedding vector(1536),  -- pgvector
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX ON embeddings USING ivfflat (embedding vector_cosine_ops);
```

**llm_usage**
```sql
CREATE TABLE llm_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    model VARCHAR(100),
    task_type VARCHAR(100),
    tokens_input INTEGER,
    tokens_output INTEGER,
    cost DECIMAL(10, 6),
    latency_ms INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);
```

**agent_logs**
```sql
CREATE TABLE agent_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_name VARCHAR(100),
    workflow_id UUID,
    message_id UUID,
    payload JSONB,
    status VARCHAR(50),
    error TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🔌 API Endpoints (MVP)

### Authentication
- `POST /api/v1/auth/register` – Register user
- `POST /api/v1/auth/login` – Login (returns JWT)
- `GET /api/v1/auth/me` – Get current user

### Brand Analysis
- `POST /api/v1/brand/upload` – Upload brand files
- `POST /api/v1/brand/analyze` – Trigger brand analysis
- `GET /api/v1/brand/{brand_id}` – Get Brand Kit
- `PATCH /api/v1/brand/{brand_id}` – Update Brand Kit

### Marketing Brief
- `POST /api/v1/brief/chat` – Send chat message, get response
- `POST /api/v1/brief/generate` – Finalize brief
- `GET /api/v1/brief/{brief_id}` – Retrieve brief
- `PATCH /api/v1/brief/{brief_id}` – Update brief

### RAG / Resources
- `POST /api/v1/resources/upload` – Upload file
- `POST /api/v1/resources/index` – Index file content
- `POST /api/v1/resources/search` – Semantic search
- `GET /api/v1/resources` – List resources
- `DELETE /api/v1/resources/{resource_id}` – Delete resource

### LLM Router
- `POST /api/v1/llm/complete` – Generic completion (for testing)
- `GET /api/v1/llm/usage` – Get usage statistics

---

## 🧪 Testing Strategy

### Unit Tests
- Agent communication (A2A protocol)
- LLM Router decision logic
- File parsing functions
- Embedding generation
- Brand Kit JSON structure

### Integration Tests
- End-to-end brand analysis workflow
- Brief generation workflow
- RAG indexing and search
- API endpoint responses

### Manual Tests
- Upload various file formats
- Chat conversation flows
- Brand Kit accuracy
- UI responsiveness

### Test Coverage Goal
- Backend: > 80%
- Critical paths: 100%

---

## 📈 Success Criteria (MVP)

### Functional
- ✅ User can upload brand files and receive Brand Kit JSON
- ✅ User can complete marketing brief via chat
- ✅ System can index and search uploaded documents
- ✅ LLM Router selects appropriate model based on task
- ✅ Agents communicate via A2A protocol

### Non-Functional
- ✅ Brand analysis completes in < 2 minutes
- ✅ Brief generation completes in < 5 minutes
- ✅ API response time < 3 seconds (non-AI endpoints)
- ✅ System handles 10 concurrent users
- ✅ Zero data loss on file uploads

### User Experience
- ✅ Intuitive upload interface
- ✅ Clear progress indicators
- ✅ Helpful error messages
- ✅ Brand Kit is editable

---

## 🚧 Known Limitations (MVP)

1. **Single User Mode**: No team collaboration
2. **Basic Editor**: No visual layout editor (Fabric.js)
3. **Limited File Formats**: PDF, DOCX, TXT, PNG, JPG only
4. **No Publishing**: Cannot publish content to external platforms
5. **Manual File Upload**: No URL crawling or email integration
6. **Basic Auth**: No OAuth, SSO, or MFA
7. **Local Development Only**: No production deployment
8. **English Only**: No multi-language support

---

## 🛠️ Tech Stack (MVP)

### Backend
- Python 3.11+
- FastAPI
- Celery + Redis
- PostgreSQL 15 + pgvector
- MinIO (S3-compatible)
- Alembic (migrations)
- Pydantic (validation)

### Frontend
- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- React Query
- Zustand (state management)

### AI/ML
- OpenAI GPT-4, GPT-4V
- Google Gemini Pro
- Anthropic Claude 3.5
- Ollama (local LLMs)
- OpenAI Embeddings

### DevOps
- Docker & Docker Compose
- GitHub Actions (CI)
- pytest (testing)
- Black/Flake8 (linting)

---

## 📚 Dependencies

### Python (Backend)
```
fastapi==0.104.1
celery==5.3.4
redis==5.0.1
psycopg2-binary==2.9.9
pgvector==0.2.4
sqlalchemy==2.0.23
alembic==1.13.0
pydantic==2.5.0
openai==1.3.7
google-generativeai==0.3.1
anthropic==0.7.0
PyPDF2==3.0.1
python-docx==1.1.0
python-multipart==0.0.6
boto3==1.29.7
opencv-python==4.8.1
Pillow==10.1.0
```

### Frontend
```json
{
  "next": "14.0.3",
  "react": "18.2.0",
  "typescript": "5.3.2",
  "tailwindcss": "3.3.5",
  "@tanstack/react-query": "5.8.4",
  "zustand": "4.4.7",
  "axios": "1.6.2"
}
```

---

## 📋 Deliverables (End of Phase 0)

1. **Codebase**
   - Backend with all MVP APIs
   - Frontend with basic UI
   - Docker Compose setup
   - Database migrations

2. **Documentation**
   - API documentation (Swagger/OpenAPI)
   - Setup guide (README)
   - Architecture diagrams
   - Agent specifications

3. **Demo**
   - Working brand analysis flow
   - Working brief generation flow
   - RAG search demonstration

4. **Tests**
   - Unit tests (80%+ coverage)
   - Integration tests for core workflows
   - Test documentation

---

## 🔄 Next Steps (Post-MVP)

After Phase 0 completion, proceed to:

**Phase 1: Core Modules**
- Content generation modules (SNS, Product Details, Blog)
- One-Page Editor (Fabric.js integration)
- Enhanced RAG pipeline
- Template system

**Phase 2: Advanced Features**
- Video Studio
- Publishing automation
- Trend analysis
- Performance optimization

**Phase 3: Production**
- Kubernetes deployment
- Team collaboration
- Analytics dashboard
- Mobile responsiveness

---

## 🎯 Key Risks & Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| LLM API rate limits | High | Medium | Implement retry logic, use multiple providers |
| Cost overruns (API usage) | High | Medium | BudgetAgent monitoring, user quotas |
| Complex agent coordination | Medium | High | Thorough testing, PM Agent orchestration |
| File parsing errors | Medium | Medium | Support limited formats, clear error messages |
| Performance issues | Medium | Low | Caching, async processing, load testing |

---

## 📞 Contacts

- **Product Lead**: TBD
- **Tech Lead**: TBD
- **Backend Engineer**: TBD
- **Frontend Engineer**: TBD

---

**Status**: Ready for Development
**Next Review**: End of Week 1 (Day 5)
