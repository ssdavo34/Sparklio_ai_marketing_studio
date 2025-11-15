# 수정 요청서 #REQ-001

## 기본 정보

| 항목 | 내용 |
|------|------|
| 요청 팀 | A팀 (Infrastructure) |
| 대상 팀 | B팀 (Backend) |
| 작성일 | 2025-01-15 |
| 우선순위 | Medium |
| 상태 | 요청 중 |

---

## 요청 내용

### 수정이 필요한 파일 및 위치

- [ ] 새 파일 생성: `backend/app/monitoring/prometheus_metrics.py`
- [ ] 새 파일 생성: `backend/app/monitoring/__init__.py`

### 요청 사유

시스템 모니터링을 위해 Prometheus 메트릭 수집 기능이 필요합니다.
A팀이 Prometheus/Grafana 인프라를 구축했으며, Backend 애플리케이션에서 메트릭을 노출해야 합니다.

### 구현 요청 사항

1. **Prometheus 메트릭 정의**
   - HTTP 요청 메트릭 (Counter, Histogram)
   - Agent 실행 메트릭
   - LLM 호출 메트릭
   - 워크플로우 메트릭
   - 데이터베이스 메트릭

2. **메트릭 엔드포인트**
   - 기존 `main.py`에 `/metrics` 엔드포인트 추가
   - Prometheus가 스크랩할 수 있도록 설정

3. **미들웨어 통합**
   - HTTP 요청 자동 추적 미들웨어

---

## 참고 자료

### A팀이 작성한 초안

A팀이 시스템 이해를 바탕으로 작성한 코드 초안입니다.
B팀에서 검토 후 수정하여 사용해주세요.

**파일 위치**:
- 초안: `docs/references/prometheus_metrics_draft.py` (A팀이 별도 첨부)
- 최종: `backend/app/monitoring/prometheus_metrics.py` (B팀이 작성)

### 주요 메트릭 카테고리

```python
# 1. HTTP Request Metrics
request_counter = Counter(...)
request_latency = Histogram(...)

# 2. Agent Metrics
agent_execution_counter = Counter(...)
agent_latency = Histogram(...)

# 3. LLM Metrics
llm_tokens_used = Counter(...)
llm_latency = Histogram(...)

# 4. Workflow Metrics
workflow_counter = Counter(...)
active_workflows = Gauge(...)

# 5. Context Metrics
context_size_bytes = Histogram(...)
```

### main.py 수정 예시

```python
from app.monitoring.prometheus_metrics import (
    request_counter,
    request_latency,
    metrics_endpoint
)

# Prometheus middleware
@app.middleware("http")
async def prometheus_middleware(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)

    latency = time.time() - start_time
    request_counter.labels(
        method=request.method,
        endpoint=request.url.path,
        status_code=response.status_code
    ).inc()

    request_latency.labels(
        method=request.method,
        endpoint=request.url.path
    ).observe(latency)

    return response

# Metrics endpoint
@app.get("/metrics")
async def metrics():
    return metrics_endpoint()
```

---

## 예상 작업 시간

- 파일 생성 및 메트릭 정의: 30분
- main.py 통합: 15분
- 테스트: 15분

**총 예상 시간**: 1시간

---

## 테스트 방법

### 1. 메트릭 엔드포인트 테스트

```bash
curl http://localhost:8000/metrics
```

**기대 결과**:
```
# HELP sparklio_http_requests_total Total HTTP requests
# TYPE sparklio_http_requests_total counter
sparklio_http_requests_total{method="GET",endpoint="/health",status_code="200"} 5.0
...
```

### 2. Prometheus 연동 테스트

A팀이 Prometheus 설정에서 Backend를 스크랩하도록 이미 설정했습니다.
(`monitoring/prometheus.yml`)

```yaml
scrape_configs:
  - job_name: 'sparklio-backend'
    static_configs:
      - targets: ['localhost:8000']
    metrics_path: '/metrics'
```

---

## 완료 기준

- [ ] `backend/app/monitoring/prometheus_metrics.py` 파일 생성
- [ ] `backend/app/monitoring/__init__.py` 파일 생성
- [ ] `main.py`에 Prometheus 미들웨어 추가
- [ ] `/metrics` 엔드포인트 작동 확인
- [ ] 주요 메트릭 노출 확인 (HTTP, Agent, LLM 등)
- [ ] Git 커밋 및 동기화

---

## 추가 요청사항

### requirements.txt 업데이트

아래 패키지가 이미 설치되어 있는지 확인 부탁드립니다.

```txt
prometheus-client==0.19.0
```

만약 없다면 `requirements.txt`에 추가해주세요.

---

## 참고 문서

- Prometheus Python Client: https://github.com/prometheus/client_python
- FastAPI Middleware: https://fastapi.tiangolo.com/tutorial/middleware/
- A팀 모니터링 설정: `docs/MONITORING_INFRASTRUCTURE_SETUP.md`

---

## 작업 완료 시

B팀 담당자님께서 작업 완료 후 아래 내용을 사용자에게 보고해주세요:

```markdown
## ✅ REQ-001 작업 완료

**요청서**: REQ-001-A-to-B-add-prometheus-metrics
**담당자**: [B팀 담당자명]
**완료일**: YYYY-MM-DD

### 변경 사항
- backend/app/monitoring/prometheus_metrics.py 생성
- backend/app/main.py 수정 (Prometheus 미들웨어 추가)
- requirements.txt 업데이트 (prometheus-client 추가)

### 테스트 결과
- /metrics 엔드포인트 정상 작동 확인
- 주요 메트릭 노출 확인

### Git 커밋
- Commit: [커밋 해시]
- 메시지: "feat: Add Prometheus metrics collection"
```

---

**작성자**: A팀
**검토자**: -
**승인자**: -
