# B팀 (Backend) 작업 요청서
Sparklio V4 — Backend Development Work Order
발행일: 2025-11-15
담당: B팀 (Backend Development Team)

---

# 📋 작업 개요

**프로젝트**: Sparklio V4 AI Marketing Studio Backend
**작업 폴더**: `K:\sparklio_ai_marketing_studio\backend_starter\`
**최종 병합 위치**: `K:\sparklio_ai_marketing_studio\backend\`
**Git 브랜치**: `feature/backend-development`

---

# 📁 작업 폴더 구조

```
K:\sparklio_ai_marketing_studio\
├── backend_starter/          ← B팀 작업 폴더 (여기서 개발)
│   ├── app/
│   ├── tests/
│   └── ...
│
├── backend/                  ← 최종 병합 대상 (작업 완료 후)
│
└── docs/                     ← 필수 참고 문서
```

**중요**:
- B팀은 `backend_starter/` 폴더에서만 작업합니다
- 완료 후 검토를 거쳐 `backend/`로 병합됩니다
- 직접 `backend/` 폴더를 수정하지 마세요

---

# 📚 필독 문서 (우선순위 순)

## ⭐⭐⭐ 필수 (시작 전 반드시 읽기)

### 1. 전체 시스템 이해
- **[FINAL_REPORT.md](K:\sparklio_ai_marketing_studio\docs\FINAL_REPORT.md)**
  - A팀 완료 현황 및 전체 개요
  - B팀이 해야 할 작업 목록

### 2. Backend 구조 이해
- **[STARTER_CODE_COMPLETE.md](K:\sparklio_ai_marketing_studio\docs\STARTER_CODE_COMPLETE.md)**
  - Backend 프로젝트 구조
  - Agent 구현 템플릿
  - API 엔드포인트 추가 방법

### 3. Agent 스키마
- **[AGENT_IO_SCHEMA_CATALOG.md](K:\sparklio_ai_marketing_studio\docs\AGENT_IO_SCHEMA_CATALOG.md)**
  - 24개 에이전트 전체 입출력 스키마
  - A2A 프로토콜 표준

### 4. SmartRouter 이해
- **[SMART_ROUTER_SPEC.md](K:\sparklio_ai_marketing_studio\docs\SMART_ROUTER_SPEC.md)**
  - SmartRouter 동작 원리
  - Intent Classification
  - Model Selection

## ⭐⭐ 중요 (Phase별로 참고)

### 5. 시스템 설계
- **[SYSTEM_IMPROVEMENT_PLAN.md](K:\sparklio_ai_marketing_studio\docs\SYSTEM_IMPROVEMENT_PLAN.md)**
  - Multi-Agent 아키텍처
  - DAG 기반 워크플로우
  - Context Engineering

### 6. 통합 레이어
- **[INTEGRATION_LAYER_COMPLETE.md](K:\sparklio_ai_marketing_studio\docs\INTEGRATION_LAYER_COMPLETE.md)**
  - Ollama Client 사용법
  - ComfyUI Client 사용법
  - Celery Worker 사용법

### 7. 배포 절차
- **[DEPLOYMENT_PROCEDURES.md](K:\sparklio_ai_marketing_studio\docs\DEPLOYMENT_PROCEDURES.md)**
  - Phase별 배포 절차
  - 헬스체크 방법
  - 문제 해결 가이드

## ⭐ 선택 (필요시 참고)

### 8. Editor 구현
- **[EDITOR_ENGINE_IMPLEMENTATION.md](K:\sparklio_ai_marketing_studio\docs\EDITOR_ENGINE_IMPLEMENTATION.md)**
  - Phase 5에서 필요

### 9. 추가 요구사항
- **[ADDITIONAL_REQUIREMENTS.md](K:\sparklio_ai_marketing_studio\docs\ADDITIONAL_REQUIREMENTS.md)**
  - 누락된 기능 목록

### 10. 환경 설정
- **[DEV_WORKFLOW.md](K:\sparklio_ai_marketing_studio\docs\DEV_WORKFLOW.md)**
  - Git 워크플로우
  - 포트 할당 규칙

---

# 📅 Phase별 작업 계획

## Phase 1: Foundation (1-2주) ⏳

### 목표
데이터베이스, 인증, 기본 CRUD API 구축

### 작업 목록

#### 1.1 Database 모델 (SQLAlchemy)
**파일**: `backend_starter/app/models/`

```python
# 생성할 파일들:
├── __init__.py
├── user.py           # User 모델
├── brand.py          # Brand 모델
├── project.py        # Project 모델
├── workflow.py       # Workflow, WorkflowNode 모델
├── agent_log.py      # AgentLog 모델
└── asset.py          # Asset 모델
```

**참고**: SYSTEM_IMPROVEMENT_PLAN.md 섹션 3.4 (DB 스키마)

#### 1.2 Alembic 마이그레이션
```bash
cd backend_starter
alembic init alembic
alembic revision --autogenerate -m "initial tables"
alembic upgrade head
```

#### 1.3 기본 CRUD API
**파일**: `backend_starter/app/api/v1/`
```python
├── brands.py         # Brand CRUD
├── projects.py       # Project CRUD
└── users.py          # User CRUD
```

#### 1.4 JWT 인증
**파일**: `backend_starter/app/auth/`
```python
├── __init__.py
├── jwt.py            # JWT 토큰 발급/검증
├── password.py       # 비밀번호 해싱
└── dependencies.py   # FastAPI dependencies
```

### Phase 1 완료 기준
- [ ] 모든 DB 테이블 생성 완료
- [ ] Alembic 마이그레이션 성공
- [ ] Brand/Project CRUD API 동작
- [ ] JWT 인증 테스트 통과
- [ ] Git 커밋 완료

---

## Phase 2: Core Agents (2-3주) 🚀

### 목표
핵심 에이전트 6개 구현

### 작업 목록

#### 2.1 StrategistAgent
**파일**: `backend_starter/app/agents/strategist.py`
- Brief → 전략 수립
- 타겟 오디언스 분석
- 채널 추천

#### 2.2 CopywriterAgent
**파일**: `backend_starter/app/agents/copywriter.py`
- Brief → 카피 생성
- 톤 매칭
- 길이 조절

#### 2.3 VisionGeneratorAgent
**파일**: `backend_starter/app/agents/vision_generator.py`
- Brief + Copy → 이미지 프롬프트 생성
- ComfyUI 연동
- 이미지 생성 및 MinIO 저장

#### 2.4 ReviewerAgent
**파일**: `backend_starter/app/agents/reviewer.py`
- 생성물 품질 검토
- Brief 일치도 확인
- 피드백 생성

#### 2.5 BrandAgent
**파일**: `backend_starter/app/agents/brand_agent.py`
- BrandKit 조회
- 브랜드 분석

#### 2.6 BriefAgent
**파일**: `backend_starter/app/agents/brief.py`
- 사용자 요구사항 → Brief 생성

### Phase 2 완료 기준
- [ ] 6개 에이전트 구현 완료
- [ ] 각 에이전트 단위 테스트 통과
- [ ] API 엔드포인트 동작 확인
- [ ] Git 커밋 완료

---

## Phase 3: Workflow Integration (1-2주) 🔄

### 목표
PMAgent DAG 실행 및 Workflow API

### 작업 목록

#### 3.1 PMAgent 완전 구현
**파일**: `backend_starter/app/agents/pm_agent.py`
- PlanBuilder: DAG 생성
- PlanExecutor: Celery 기반 실행
- Risk-based Strategy Review Gate

#### 3.2 Workflow API
**파일**: `backend_starter/app/api/v1/workflow.py`
```python
POST /api/v1/workflow/create      # Workflow 생성
GET  /api/v1/workflow/{id}/status # 진행 상황 조회
GET  /api/v1/workflow/{id}/result # 결과 조회
```

#### 3.3 DAG 실행 로직
- Topological sort
- 병렬 실행 (Celery groups)
- 에러 처리 및 재시도

### Phase 3 완료 기준
- [ ] PMAgent DAG 실행 성공
- [ ] Workflow API 동작
- [ ] 병렬 실행 확인 (레이턴시 22% 감소)
- [ ] Git 커밋 완료

---

## Phase 4: Monitoring (1주) 📊

### 목표
모니터링 시스템 구축

### 작업 목록

#### 4.1 Logging 강화
- 구조화된 로그 (JSON)
- Agent 실행 로그
- Context trace 로그

#### 4.2 Superset 대시보드
- PostgreSQL 연결
- 8개 대시보드 생성
- 참고: Agent정의/009.Sparklio 전용 Superset 대시보드 설계 템플릿.md

#### 4.3 Prometheus + Grafana
- Metrics 수집
- 실시간 대시보드

### Phase 4 완료 기준
- [ ] Superset 대시보드 동작
- [ ] Prometheus 메트릭 수집
- [ ] Grafana 대시보드 구성
- [ ] Git 커밋 완료

---

## Phase 5: Advanced Features (2-3주) ⚡

### 목표
고급 기능 구현

### 작업 목록

#### 5.1 TrendPipeline (Type B Agents)
- TrendCollectorAgent
- DataCleanerAgent
- EmbedderAgent
- IngestorAgent
- Celery Beat 스케줄링

#### 5.2 Video Pipeline
- ScenePlannerAgent
- VideoDirectorAgent
- Veo3 API 연동

#### 5.3 EditorAgent
- 자연어 → Canvas 수정
- Fabric.js 연동

### Phase 5 완료 기준
- [ ] TrendPipeline 동작
- [ ] Video 생성 성공
- [ ] EditorAgent 동작
- [ ] Git 커밋 완료

---

# 📝 일일 작업 계획서 양식

매일 작업 시작 전 작성하고, 종료 시 업데이트하세요.

## 일일 작업 계획서 템플릿

```markdown
# B팀 일일 작업 계획서
날짜: YYYY-MM-DD
작성자: [이름]
Phase: [현재 Phase]

## 오늘의 목표
- [ ] 목표 1
- [ ] 목표 2
- [ ] 목표 3

## 작업 내용
### 오전 (9:00-12:00)
- 작업 내용 설명

### 오후 (13:00-18:00)
- 작업 내용 설명

## 완료 사항
- [x] 완료한 작업 1
- [x] 완료한 작업 2

## 미완료 사항 (내일로 이월)
- [ ] 미완료 작업 1

## 발생한 문제
- 문제 1: 설명 및 해결 방법
- 문제 2: 설명 (미해결 시 에스컬레이션)

## Git 커밋
- 커밋 해시: abc123
- 커밋 메시지: "feat: Add User CRUD API"

## 다음 날 계획
- 내일 할 작업 간략 설명
```

**저장 위치**: `backend_starter/daily_logs/YYYY-MM-DD.md`

---

# 🔄 Git 작업 규칙

## 브랜치 전략

```
main (보호됨)
  └── dev (개발 메인)
       └── feature/backend-phase1  ← B팀 Phase 1
       └── feature/backend-phase2  ← B팀 Phase 2
       └── feature/backend-phase3  ← B팀 Phase 3
       ...
```

## 커밋 규칙

### 커밋 메시지 형식
```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type 종류
- `feat`: 새 기능
- `fix`: 버그 수정
- `docs`: 문서 수정
- `style`: 코드 포맷팅
- `refactor`: 리팩토링
- `test`: 테스트 추가/수정
- `chore`: 빌드/설정 변경

### 예시
```bash
git commit -m "feat(agent): Add StrategistAgent implementation

- Implement strategy generation
- Add Brief parsing logic
- Connect to Ollama for LLM calls

Closes #12"
```

## 커밋 주기

**중요**: 작업 중간중간 자주 커밋하세요!

- ✅ **권장**: 2-3시간마다 커밋
- ✅ **최소**: 하루 1회 이상 커밋
- ✅ **완료 시**: 각 기능 완료마다 커밋

### 커밋 체크리스트
- [ ] 코드가 실행되는가?
- [ ] 테스트가 통과하는가?
- [ ] Lint 에러가 없는가?
- [ ] 커밋 메시지가 명확한가?

---

# 🧪 테스트 규칙

## 단위 테스트 필수

모든 Agent는 반드시 단위 테스트를 작성해야 합니다.

### 테스트 파일 위치
```
backend_starter/tests/
├── test_strategist_agent.py
├── test_copywriter_agent.py
└── ...
```

### 테스트 작성 예시
```python
import pytest
from app.agents.strategist import StrategistAgent
from app.schemas.common import A2ARequest, SystemContext

@pytest.mark.asyncio
async def test_strategist_basic():
    """Test basic strategy generation"""
    agent = StrategistAgent()

    request = A2ARequest(
        request_id="test_001",
        source_agent="TestAgent",
        target_agent="StrategistAgent",
        system_context=SystemContext(
            brand_id="test_brand",
            task_type="strategy",
            risk_level="medium"
        ),
        payload={
            "campaign_goal": "신제품 런칭"
        }
    )

    response = await agent.process(request)

    assert response.status == "success"
    assert "strategy" in response.result
```

### 테스트 실행
```bash
# 전체 테스트
pytest

# 특정 파일
pytest tests/test_strategist_agent.py -v

# 커버리지 확인
pytest --cov=app
```

---

# 📊 코드 품질 규칙

## Lint & Format

### Black (코드 포맷팅)
```bash
black app/ tests/
```

### Flake8 (린트)
```bash
flake8 app/ tests/
```

### MyPy (타입 체크)
```bash
mypy app/
```

## 코드 리뷰 체크리스트

Pull Request 생성 전 확인:

- [ ] 모든 테스트 통과
- [ ] Black 포맷팅 완료
- [ ] Flake8 에러 0개
- [ ] 타입 힌트 추가 (mypy)
- [ ] Docstring 작성
- [ ] 일일 작업 계획서 업데이트

---

# 🚨 문제 발생 시 대응

## 1단계: 자가 해결 시도 (30분)
- 문서 재확인
- 로그 확인
- 검색 (StackOverflow, 문서)

## 2단계: 팀 내 공유 (1시간)
- 팀 채널에 문제 공유
- 다른 팀원에게 도움 요청

## 3단계: 에스컬레이션 (즉시)
- A팀에게 문의
- 문제 상세 기록:
  - 에러 메시지
  - 재현 단계
  - 시도한 해결 방법
  - 로그 파일

---

# 📞 연락처 및 리소스

## A팀 (Infrastructure)
- 역할: 환경 설정, 통합 레이어, 문서 지원
- 연락: [연락 방법]

## C팀 (Frontend)
- 역할: UI/UX, Editor 컴포넌트
- 연락: [연락 방법]

## 서버 정보
- Mac mini: 100.123.51.5 (PostgreSQL, Redis, MinIO, FastAPI)
- Desktop: 100.120.180.42 (Ollama, ComfyUI, GPU)
- Laptop: 100.101.68.23 (Frontend 개발)

---

# ✅ 최종 체크리스트 (Phase 완료 시)

## Phase 완료 전 확인사항

- [ ] 모든 기능 구현 완료
- [ ] 단위 테스트 작성 및 통과
- [ ] 통합 테스트 통과
- [ ] API 문서 업데이트 (Swagger)
- [ ] 코드 리뷰 완료
- [ ] Git 커밋 및 Push
- [ ] Pull Request 생성
- [ ] 일일 작업 계획서 모두 작성
- [ ] README 업데이트 (필요시)

## 병합 전 최종 확인

- [ ] `backend_starter/` → `backend/` 병합 준비
- [ ] 모든 파일 conflict 해결
- [ ] 최종 테스트 실행
- [ ] 배포 테스트 (staging)
- [ ] A팀 승인

---

# 🎯 성공 기준

## Phase별 KPI

| Phase | KPI | 목표 |
|-------|-----|------|
| Phase 1 | API 응답 시간 | < 200ms |
| Phase 2 | Agent 성공률 | > 90% |
| Phase 3 | Workflow 레이턴시 | < 18s |
| Phase 4 | 모니터링 커버리지 | 100% |
| Phase 5 | 전체 기능 완성도 | 100% |

## 전체 목표

- **성능**: 23s → 18s (22% 개선)
- **컨텍스트**: 15KB → 8KB (47% 축소)
- **성공률**: 85% → 95%

---

# 📅 마일스톤

| 날짜 | 마일스톤 | 완료 |
|------|----------|------|
| Week 1-2 | Phase 1 완료 | [ ] |
| Week 3-5 | Phase 2 완료 | [ ] |
| Week 6-7 | Phase 3 완료 | [ ] |
| Week 8 | Phase 4 완료 | [ ] |
| Week 9-11 | Phase 5 완료 | [ ] |

---

**발행일**: 2025-11-15
**최종 업데이트**: 2025-11-15
**담당**: B팀 (Backend Development Team)

**시작하기**: `backend_starter/` 폴더로 이동하여 Phase 1부터 시작하세요!
