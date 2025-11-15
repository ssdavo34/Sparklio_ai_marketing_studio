# ADDITIONAL_REQUIREMENTS.md
Sparklio V4 — 추가 요구사항 및 갭 분석
작성일: 2025-11-15
작성자: A팀 (Infrastructure Team)

---

# 목적

SYSTEM_IMPROVEMENT_PLAN.md에서 제안한 Multi-Agent 아키텍처 통합을 위해
**아직 준비되지 않은 문서, 인프라, 도구, 프로세스**를 식별하고 우선순위를 부여합니다.

---

# 1. 누락된 문서 (Missing Documentation)

## 1.1 SmartRouter 구현 가이드
**현재 상태**: Agent 정의 문서에서 개념만 언급됨
**필요한 내용**:
- SmartRouter 라우팅 규칙 상세 스펙
- 모델 선택 알고리즘 (Qwen vs Llama vs Gemini)
- Context Minimization 실행 로직
- 에이전트 선택 의사결정 트리
- 에러 처리 및 폴백 전략

**우선순위**: ⭐⭐⭐ (High) - PMAgent 구현 전에 필요

**제안 파일명**: `SMART_ROUTER_SPEC.md`

---

## 1.2 Brand Learning Engine 상세 스펙
**현재 상태**: CONTEXT_ROUTING_POLICY에서 간략히 언급
**필요한 내용**:
- BrandKit 생성 프로세스 (색상/폰트/톤 추출)
- 브랜드 임베딩 생성 방법 (pgvector 활용)
- 브랜드 스타일 재학습 트리거 조건
- BrandKit 버전 관리 전략
- BrandLearningAgent 입출력 스키마

**우선순위**: ⭐⭐ (Medium) - Phase 2에서 필요

**제안 파일명**: `BRAND_LEARNING_ENGINE_SPEC.md`

---

## 1.3 Editor Engine 구현 가이드
**현재 상태**: EDITOR_CONTEXT_MODEL.md가 개념 모델만 제공
**필요한 내용**:
- Fabric.js Canvas JSON ↔ Editor Agent 인터페이스
- 자연어 명령 파서 구현 (NLU → Action JSON)
- Target Selection 알고리즘 구체적 코드
- Editor Agent Pydantic 스키마
- Canvas Update Manager 구현
- Undo/Redo 시스템 설계

**우선순위**: ⭐⭐⭐ (High) - 에디터는 핵심 기능

**제안 파일명**: `EDITOR_ENGINE_IMPLEMENTATION.md`

---

## 1.4 TrendPipeline 배치 작업 스펙
**현재 상태**: Type B 에이전트로 분류만 됨
**필요한 내용**:
- Celery Beat 스케줄링 설정
- TrendCollectorAgent 소스 (Instagram, TikTok, Pinterest API)
- DataCleanerAgent 정제 규칙
- EmbedderAgent 임베딩 모델 선택 (sentence-transformers?)
- IngestorAgent RAG 저장 전략 (pgvector)
- 실패 시 재시도 정책

**우선순위**: ⭐⭐ (Medium) - Phase 3-4에서 필요

**제안 파일명**: `TRENDPIPELINE_BATCH_SPEC.md`

---

## 1.5 Video Pipeline 상세 워크플로우
**현재 상태**: 에이전트 정의에서 ScenePlanner → Storyboard → VideoDirector → Reviewer 언급
**필요한 내용**:
- 각 에이전트별 입출력 JSON 스키마
- Veo3 API 연동 방법 (Google AI Studio)
- ComfyUI AnimateDiff 워크플로우 JSON
- 씬 전환 타이밍 계산 로직
- 프롬프트 품질 평가 기준
- 실패 구간 재생성 전략

**우선순위**: ⭐ (Low) - Phase 5 이후

**제안 파일명**: `VIDEO_PIPELINE_WORKFLOW.md`

---

## 1.6 에이전트별 입출력 스키마 전체 카탈로그
**현재 상태**: 일부 에이전트만 Pydantic 스키마 존재
**필요한 내용**:
- 24개 에이전트 전체 입출력 Pydantic 모델
- A2A Request/Response 표준 템플릿
- 에러 응답 표준 포맷
- Context Layer별 필드 매핑 테이블

**우선순위**: ⭐⭐⭐ (High) - 모든 Phase에서 필요

**제안 파일명**: `AGENT_IO_SCHEMA_CATALOG.md`

---

# 2. 누락된 인프라 구성요소 (Missing Infrastructure)

## 2.1 Celery Worker 설정 (Mac mini)
**현재 상태**: Redis만 실행 중, Celery 미설치
**필요한 작업**:
```bash
# Mac mini에서 실행 필요
pip install celery[redis]
celery -A app.celery worker --loglevel=info
```
**설정 파일**: `backend/app/celery_config.py`
**우선순위**: ⭐⭐⭐ (High) - PMAgent 실행 전 필수

---

## 2.2 Celery Beat 스케줄러 (TrendPipeline용)
**현재 상태**: 미설치
**필요한 작업**:
```bash
celery -A app.celery beat --loglevel=info
```
**설정 파일**: `backend/app/celerybeat_schedule.py`
**예시 스케줄**:
```python
CELERYBEAT_SCHEDULE = {
    'trend-collector': {
        'task': 'app.agents.trend.collector.run',
        'schedule': crontab(hour=2, minute=0),  # 매일 오전 2시
    },
}
```
**우선순위**: ⭐⭐ (Medium) - Phase 3-4

---

## 2.3 OpenTelemetry + Jaeger 분산 추적 시스템
**현재 상태**: 미설치
**필요한 작업**:
1. Jaeger 설치 (Docker):
```bash
docker run -d -p 16686:16686 -p 4317:4317 jaegertracing/all-in-one:latest
```
2. OpenTelemetry 계측:
```python
from opentelemetry import trace
from opentelemetry.exporter.jaeger import JaegerExporter

tracer = trace.get_tracer(__name__)
```
**우선순위**: ⭐⭐ (Medium) - Phase 4 모니터링

---

## 2.4 Superset 설치 및 대시보드 설정 스크립트
**현재 상태**: 대시보드 설계만 완료, 실제 설치 안 됨
**필요한 작업**:
1. Superset 설치 (Docker):
```bash
docker run -d -p 8088:8088 \
  -e "SUPERSET_SECRET_KEY=sparklio_secret" \
  apache/superset
```
2. PostgreSQL 연결 설정
3. 8개 대시보드 생성 스크립트 (SQL + JSON)

**우선순위**: ⭐⭐ (Medium) - Phase 4

**제안 디렉토리**: `infrastructure/superset/`

---

## 2.5 Prometheus 메트릭 수집 설정
**현재 상태**: 미설치
**필요한 작업**:
1. Prometheus 설치 (Docker):
```bash
docker run -d -p 9090:9090 prom/prometheus
```
2. FastAPI 메트릭 익스포터:
```python
from prometheus_client import Counter, Histogram
request_counter = Counter('api_requests_total', 'Total API requests')
```
3. `prometheus.yml` 설정

**우선순위**: ⭐⭐ (Medium) - Phase 4

---

## 2.6 Grafana 대시보드 (실시간 메트릭용)
**현재 상태**: 미설치
**필요한 작업**:
1. Grafana 설치 (Docker):
```bash
docker run -d -p 3001:3000 grafana/grafana
```
2. Prometheus 데이터소스 연결
3. 기본 대시보드 생성 (CPU, Memory, Latency, Error Rate)

**우선순위**: ⭐⭐ (Medium) - Phase 4

---

# 3. 누락된 통합 레이어 (Missing Integration Points)

## 3.1 Ollama ↔ FastAPI 통합 레이어
**현재 상태**: Ollama는 Desktop에서 실행 중이지만 FastAPI와 연결 안 됨
**필요한 작업**:
- `backend/app/integrations/ollama_client.py` 생성
- HTTP 클라이언트로 `http://100.120.180.42:11434` 호출
- 모델 선택 로직 (Qwen 2.5 7B vs 14B)
- 에러 처리 및 재시도 로직

**예시 코드**:
```python
import httpx

class OllamaClient:
    def __init__(self, base_url="http://100.120.180.42:11434"):
        self.base_url = base_url
        self.client = httpx.AsyncClient()

    async def generate(self, model: str, prompt: str):
        response = await self.client.post(
            f"{self.base_url}/api/generate",
            json={"model": model, "prompt": prompt}
        )
        return response.json()
```

**우선순위**: ⭐⭐⭐ (High) - Phase 1

---

## 3.2 ComfyUI ↔ FastAPI 통합 레이어
**현재 상태**: ComfyUI는 Desktop에서 실행 예정이지만 API 연동 미설계
**필요한 작업**:
- ComfyUI API 엔드포인트 확인 (WebSocket vs HTTP)
- Workflow JSON 전송 클라이언트
- 생성 진행률 모니터링
- 결과 이미지 MinIO 저장

**예시 코드**:
```python
class ComfyUIClient:
    async def queue_prompt(self, workflow_json: dict):
        # ComfyUI API 호출
        pass

    async def get_progress(self, prompt_id: str):
        # 진행률 조회
        pass
```

**우선순위**: ⭐⭐⭐ (High) - Phase 2

---

## 3.3 Desktop GPU Worker 통신 프로토콜
**현재 상태**: Desktop (100.120.180.42)에서 GPU 작업 실행 계획만 있음
**필요한 설계**:
- Celery Worker를 Desktop에도 실행할지?
- 아니면 HTTP API로 작업 큐 관리?
- 작업 우선순위 정책 (이미지 vs 영상)
- GPU 메모리 부족 시 처리 방법

**제안 방식**: Celery Worker를 Desktop에서도 실행
```bash
# Desktop (Windows)에서
celery -A app.celery worker -Q gpu_tasks --loglevel=info
```

**우선순위**: ⭐⭐⭐ (High) - Phase 2

---

## 3.4 Cross-Node 에러 전파 및 재시도 메커니즘
**현재 상태**: 3-node 구조이지만 노드 간 에러 처리 전략 없음
**필요한 설계**:
- Ollama 실패 시 폴백 (로컬 모델 → OpenAI API)
- ComfyUI 타임아웃 처리
- Desktop 오프라인 시 대응
- 재시도 정책 (exponential backoff)

**제안 구현**:
```python
from tenacity import retry, stop_after_attempt, wait_exponential

@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10))
async def call_ollama_with_retry(prompt: str):
    return await ollama_client.generate(prompt)
```

**우선순위**: ⭐⭐⭐ (High) - Phase 1

---

# 4. 누락된 운영 절차 (Missing Operational Procedures)

## 4.1 Phase별 배포 절차서
**현재 상태**: 5-phase 로드맵은 있지만 배포 방법 없음
**필요한 내용**:
- Phase 1 배포 체크리스트
- DB 마이그레이션 스크립트 실행 순서
- 서비스 재시작 순서 (PostgreSQL → Redis → FastAPI → Celery)
- 헬스체크 방법
- 롤백 조건

**우선순위**: ⭐⭐⭐ (High)

**제안 파일명**: `DEPLOYMENT_PROCEDURES.md`

---

## 4.2 롤백 절차서
**현재 상태**: 없음
**필요한 내용**:
- DB 스키마 롤백 방법
- 코드 롤백 (Git 브랜치 전략)
- Celery 작업 중단 방법
- 사용자 영향 최소화 전략

**우선순위**: ⭐⭐ (Medium)

**제안 파일명**: `ROLLBACK_PROCEDURES.md`

---

## 4.3 재해 복구 계획 (Disaster Recovery)
**현재 상태**: 없음
**필요한 내용**:
- PostgreSQL 백업 전략 (pg_dump 자동화)
- MinIO 데이터 백업
- Desktop 오프라인 시 대응
- Mac mini 장애 시 대응
- 전체 시스템 복구 소요 시간 목표 (RTO)

**우선순위**: ⭐⭐ (Medium)

**제안 파일명**: `DISASTER_RECOVERY_PLAN.md`

---

## 4.4 성능 튜닝 가이드라인
**현재 상태**: 성능 목표만 제시 (23s → 18s)
**필요한 내용**:
- PostgreSQL 쿼리 최적화 방법
- Redis 캐싱 전략
- Celery Worker 스케일링 기준
- GPU 메모리 최적화
- Context 크기 축소 기법

**우선순위**: ⭐⭐ (Medium)

**제안 파일명**: `PERFORMANCE_TUNING_GUIDE.md`

---

# 5. 누락된 개발 도구 (Missing Development Tools)

## 5.1 에이전트 테스트 프레임워크
**현재 상태**: 없음
**필요한 기능**:
- 개별 에이전트 단위 테스트 (pytest)
- A2A 통신 목(mock) 생성 도구
- Context 검증 유틸리티
- 에이전트 응답 시간 측정

**예시 구조**:
```
backend/tests/
  ├── test_strategist_agent.py
  ├── test_copywriter_agent.py
  ├── test_pm_agent.py
  └── fixtures/
      ├── mock_brandkit.json
      └── mock_brief.json
```

**우선순위**: ⭐⭐⭐ (High) - 모든 Phase에서 필요

---

## 5.2 워크플로우 시각화 도구
**현재 상태**: DAG JSON 정의만 있음
**필요한 기능**:
- WorkflowSpec JSON → 그래프 시각화 (Graphviz, Mermaid)
- 실행 중 워크플로우 진행률 표시
- 병목 구간 하이라이트

**제안 방식**: Mermaid 자동 생성
```python
def workflow_to_mermaid(workflow_spec: WorkflowSpec) -> str:
    mermaid = "graph TD\n"
    for edge in workflow_spec.edges:
        mermaid += f"  {edge.from_node} --> {edge.to_node}\n"
    return mermaid
```

**우선순위**: ⭐⭐ (Medium)

---

## 5.3 Context 디버깅 유틸리티
**현재 상태**: Context Engineering 프레임워크만 있음
**필요한 기능**:
- Context Layer별 크기 측정
- 불필요한 필드 탐지
- Context 전파 경로 추적
- Context Minimization 시뮬레이터

**제안 도구**:
```python
class ContextDebugger:
    def measure_size(self, context: dict) -> int:
        """Context 크기 (bytes) 측정"""
        return len(json.dumps(context).encode('utf-8'))

    def find_unused_fields(self, context: dict, agent_name: str) -> list:
        """에이전트가 사용하지 않는 필드 탐지"""
        pass
```

**우선순위**: ⭐⭐ (Medium)

---

## 5.4 비용 추정 도구
**현재 상태**: 없음
**필요한 기능**:
- Brief → 예상 생성 비용 계산
- 모델별 비용 비교 (Qwen vs Gemini vs OpenAI)
- 월간 비용 예측
- 비용 초과 알림

**제안 구현**:
```python
class CostEstimator:
    COST_PER_TOKEN = {
        "qwen2.5-7b": 0.0,  # 로컬 무료
        "gemini-1.5-pro": 0.00025,
        "gpt-4": 0.03,
    }

    def estimate(self, brief: Brief, model: str) -> float:
        tokens = self._estimate_tokens(brief)
        return tokens * self.COST_PER_TOKEN[model]
```

**우선순위**: ⭐⭐ (Medium) - Phase 4 BudgetAgent 연동

---

# 6. 우선순위별 실행 계획

## Phase 0 (즉시 필요 - Starter Code 생성 전)

⭐⭐⭐ **Critical**:
1. **SMART_ROUTER_SPEC.md** 작성
2. **AGENT_IO_SCHEMA_CATALOG.md** 작성
3. **EDITOR_ENGINE_IMPLEMENTATION.md** 작성
4. **Ollama ↔ FastAPI 통합 레이어** 구현
5. **ComfyUI ↔ FastAPI 통합 레이어** 설계
6. **Desktop GPU Worker 통신 프로토콜** 설계
7. **Cross-Node 에러 처리** 전략 수립
8. **Celery Worker 설정** (Mac mini)
9. **에이전트 테스트 프레임워크** 구축
10. **DEPLOYMENT_PROCEDURES.md** 작성

---

## Phase 1 (Foundation 구축 시)

⭐⭐ **Important**:
1. **BRAND_LEARNING_ENGINE_SPEC.md** 작성
2. **OpenTelemetry + Jaeger** 설치
3. **워크플로우 시각화 도구** 개발
4. **ROLLBACK_PROCEDURES.md** 작성

---

## Phase 2-3 (Core Agents 구현 시)

⭐⭐ **Important**:
1. **TRENDPIPELINE_BATCH_SPEC.md** 작성
2. **Celery Beat 스케줄러** 설정
3. **Context 디버깅 유틸리티** 개발
4. **비용 추정 도구** 개발

---

## Phase 4 (모니터링 구축 시)

⭐⭐ **Important**:
1. **Superset 설치 및 대시보드** 구축
2. **Prometheus + Grafana** 설치
3. **DISASTER_RECOVERY_PLAN.md** 작성
4. **PERFORMANCE_TUNING_GUIDE.md** 작성

---

## Phase 5 (고급 기능)

⭐ **Nice-to-have**:
1. **VIDEO_PIPELINE_WORKFLOW.md** 작성

---

# 7. 다음 단계 제안

SYSTEM_IMPROVEMENT_PLAN.md와 이 문서를 기반으로
다음 작업을 제안합니다:

## 즉시 시작 가능한 작업 (Phase 0)

### 1️⃣ SMART_ROUTER_SPEC.md 작성
SmartRouter는 모든 에이전트 호출의 시작점이므로 가장 먼저 설계해야 합니다.

### 2️⃣ AGENT_IO_SCHEMA_CATALOG.md 작성
24개 에이전트의 입출력 스키마를 표준화해야 Starter Code 생성이 가능합니다.

### 3️⃣ Ollama 통합 레이어 구현
`backend/app/integrations/ollama_client.py` 생성하여
Desktop Ollama와 FastAPI를 연결합니다.

### 4️⃣ Celery Worker 설정
Mac mini에서 Celery Worker를 실행하여
PMAgent의 비동기 작업 실행을 준비합니다.

### 5️⃣ 에이전트 테스트 프레임워크
`backend/tests/` 디렉토리 구조를 만들고
첫 번째 테스트 케이스를 작성합니다.

---

# 8. 결론

SYSTEM_IMPROVEMENT_PLAN.md에서 제안한 개선사항을 실행하기 위해서는
**위의 10개 Critical 항목을 먼저 완료**해야 합니다.

이후 B팀(Backend)과 C팀(Frontend)이 Starter Code를 기반으로
본격적인 개발을 시작할 수 있습니다.

---

**작성 완료일**: 2025-11-15
**다음 문서**: SMART_ROUTER_SPEC.md (추천)
