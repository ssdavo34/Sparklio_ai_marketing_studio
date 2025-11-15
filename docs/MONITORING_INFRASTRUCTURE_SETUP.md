# MONITORING_INFRASTRUCTURE_SETUP.md
Sparklio V4 — 모니터링 인프라 구축 가이드
작성일: 2025-11-15
작성자: A팀 (Infrastructure Team)

---

# 1. 개요

## 목적
Sparklio V4 시스템의 실시간 모니터링 및 분석을 위한 인프라 구축

## 구성요소
1. **Apache Superset** - 비즈니스 인텔리전스 대시보드
2. **Prometheus + Grafana** - 실시간 메트릭 모니터링 (선택사항 - Docker 필요)
3. **FastAPI Metrics** - 애플리케이션 메트릭 수집
4. **PostgreSQL Monitoring** - 데이터베이스 쿼리 분석

---

# 2. Apache Superset 설치 및 설정

## 2.1 설치 방법 (Python 패키지)

### Mac mini에서 실행

```bash
# SSH 접속
ssh woosun@100.123.51.5

# Superset용 가상환경 생성
cd ~/sparklio_ai_marketing_studio
python3 -m venv superset_venv
source superset_venv/bin/activate

# Superset 설치
pip install apache-superset

# Superset DB 초기화
export FLASK_APP=superset
superset db upgrade

# 관리자 계정 생성
superset fab create-admin \
  --username admin \
  --firstname Admin \
  --lastname User \
  --email admin@sparklio.com \
  --password admin123

# 기본 role과 권한 설정
superset init

# Superset 실행
superset run -h 0.0.0.0 -p 8088 --with-threads --reload --debugger
```

## 2.2 백그라운드 실행 (프로덕션)

```bash
# nohup으로 백그라운드 실행
nohup superset run -h 0.0.0.0 -p 8088 &

# 또는 systemd 서비스로 등록 (권장)
# /etc/systemd/system/superset.service 파일 생성
```

## 2.3 PostgreSQL 데이터소스 연결

### Superset 웹 UI 접속
- URL: http://100.123.51.5:8088
- Username: admin
- Password: admin123

### 데이터베이스 추가
1. **Settings** → **Database Connections** → **+ Database**
2. **Database 이름**: Sparklio PostgreSQL
3. **SQLAlchemy URI**:
   ```
   postgresql://sparklio:password@localhost:5432/sparklio_db
   ```
4. **Test Connection** → **Connect**

---

# 3. Superset 8개 대시보드 설계

## 3.1 대시보드 목록

참고 문서: `K:\obsidian-k\Sparklio_ai_marketing_studio\최종계획\Agent정의\009.Sparklio 전용 Superset 대시보드 설계 템플릿.md`

### Dashboard 1: 워크플로우 실행 현황
**목적**: 전체 워크플로우 실행 통계 및 성공률

**차트**:
1. **일별 워크플로우 실행 수** (Line Chart)
   ```sql
   SELECT
     DATE(created_at) as date,
     COUNT(*) as workflow_count
   FROM workflows
   GROUP BY DATE(created_at)
   ORDER BY date DESC
   LIMIT 30;
   ```

2. **워크플로우 상태별 분포** (Pie Chart)
   ```sql
   SELECT
     status,
     COUNT(*) as count
   FROM workflows
   WHERE created_at >= NOW() - INTERVAL '7 days'
   GROUP BY status;
   ```

3. **평균 실행 시간** (Big Number)
   ```sql
   SELECT
     AVG(EXTRACT(EPOCH FROM (completed_at - created_at))) as avg_seconds
   FROM workflows
   WHERE status = 'completed'
     AND created_at >= NOW() - INTERVAL '7 days';
   ```

---

### Dashboard 2: 에이전트 성능 분석
**목적**: 각 에이전트별 성능 및 에러율 모니터링

**차트**:
1. **에이전트별 실행 횟수** (Bar Chart)
   ```sql
   SELECT
     agent_name,
     COUNT(*) as execution_count
   FROM agent_logs
   WHERE created_at >= NOW() - INTERVAL '7 days'
   GROUP BY agent_name
   ORDER BY execution_count DESC;
   ```

2. **에이전트별 평균 레이턴시** (Bar Chart)
   ```sql
   SELECT
     agent_name,
     AVG(latency_ms) as avg_latency_ms
   FROM agent_logs
   WHERE created_at >= NOW() - INTERVAL '7 days'
   GROUP BY agent_name
   ORDER BY avg_latency_ms DESC;
   ```

3. **에이전트별 성공률** (Table)
   ```sql
   SELECT
     agent_name,
     COUNT(*) as total,
     SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success,
     ROUND(100.0 * SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) / COUNT(*), 2) as success_rate
   FROM agent_logs
   WHERE created_at >= NOW() - INTERVAL '7 days'
   GROUP BY agent_name
   ORDER BY success_rate ASC;
   ```

4. **에러가 많은 에이전트 Top 5** (Bar Chart)
   ```sql
   SELECT
     agent_name,
     COUNT(*) as error_count
   FROM agent_logs
   WHERE status = 'error'
     AND created_at >= NOW() - INTERVAL '7 days'
   GROUP BY agent_name
   ORDER BY error_count DESC
   LIMIT 5;
   ```

---

### Dashboard 3: SmartRouter 분석
**목적**: SmartRouter의 의사결정 패턴 분석

**차트**:
1. **Intent 분류 분포** (Pie Chart)
   ```sql
   SELECT
     intent_type,
     COUNT(*) as count
   FROM router_logs
   WHERE created_at >= NOW() - INTERVAL '7 days'
   GROUP BY intent_type;
   ```

2. **선택된 모델 분포** (Pie Chart)
   ```sql
   SELECT
     selected_model,
     COUNT(*) as count
   FROM router_logs
   WHERE created_at >= NOW() - INTERVAL '7 days'
   GROUP BY selected_model;
   ```

3. **Risk Level 분포** (Bar Chart)
   ```sql
   SELECT
     risk_level,
     COUNT(*) as count
   FROM router_logs
   WHERE created_at >= NOW() - INTERVAL '7 days'
   GROUP BY risk_level;
   ```

4. **Context Minimization 효과** (Line Chart)
   ```sql
   SELECT
     DATE(created_at) as date,
     AVG(context_size_before) as avg_before,
     AVG(context_size_after) as avg_after
   FROM router_logs
   WHERE created_at >= NOW() - INTERVAL '30 days'
   GROUP BY DATE(created_at)
   ORDER BY date;
   ```

---

### Dashboard 4: 브랜드별 사용 현황
**목적**: 브랜드별 활동 및 생성물 분석

**차트**:
1. **브랜드별 프로젝트 수** (Bar Chart)
   ```sql
   SELECT
     b.name as brand_name,
     COUNT(p.id) as project_count
   FROM brands b
   LEFT JOIN projects p ON b.id = p.brand_id
   GROUP BY b.name
   ORDER BY project_count DESC
   LIMIT 10;
   ```

2. **브랜드별 생성 에셋 수** (Bar Chart)
   ```sql
   SELECT
     b.name as brand_name,
     COUNT(a.id) as asset_count
   FROM brands b
   LEFT JOIN projects p ON b.id = p.brand_id
   LEFT JOIN assets a ON p.id = a.project_id
   WHERE a.created_at >= NOW() - INTERVAL '30 days'
   GROUP BY b.name
   ORDER BY asset_count DESC
   LIMIT 10;
   ```

3. **브랜드별 평균 워크플로우 시간** (Table)
   ```sql
   SELECT
     b.name as brand_name,
     AVG(EXTRACT(EPOCH FROM (w.completed_at - w.created_at))) as avg_time_seconds
   FROM brands b
   JOIN projects p ON b.id = p.brand_id
   JOIN workflows w ON p.id = w.project_id
   WHERE w.status = 'completed'
   GROUP BY b.name
   ORDER BY avg_time_seconds DESC;
   ```

---

### Dashboard 5: 시스템 리소스 사용률
**목적**: PostgreSQL, Redis, Celery 상태 모니터링

**차트**:
1. **PostgreSQL 연결 수** (Line Chart)
   ```sql
   SELECT
     NOW() as time,
     count(*) as connection_count
   FROM pg_stat_activity;
   ```

2. **PostgreSQL 데이터베이스 크기** (Big Number)
   ```sql
   SELECT
     pg_size_pretty(pg_database_size('sparklio_db')) as db_size;
   ```

3. **가장 느린 쿼리 Top 10** (Table)
   ```sql
   SELECT
     substring(query, 1, 50) as query_preview,
     mean_exec_time,
     calls
   FROM pg_stat_statements
   ORDER BY mean_exec_time DESC
   LIMIT 10;
   ```

4. **테이블별 크기** (Bar Chart)
   ```sql
   SELECT
     tablename,
     pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
   FROM pg_tables
   WHERE schemaname = 'public'
   ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
   LIMIT 10;
   ```

---

### Dashboard 6: 사용자 활동 분석
**목적**: 사용자별 활동 패턴 및 참여도

**차트**:
1. **일별 활성 사용자 수** (Line Chart)
   ```sql
   SELECT
     DATE(created_at) as date,
     COUNT(DISTINCT user_id) as active_users
   FROM projects
   WHERE created_at >= NOW() - INTERVAL '30 days'
   GROUP BY DATE(created_at)
   ORDER BY date;
   ```

2. **사용자별 프로젝트 수** (Bar Chart)
   ```sql
   SELECT
     u.email,
     COUNT(p.id) as project_count
   FROM users u
   LEFT JOIN projects p ON u.id = p.user_id
   GROUP BY u.email
   ORDER BY project_count DESC
   LIMIT 10;
   ```

3. **신규 가입 추이** (Line Chart)
   ```sql
   SELECT
     DATE(created_at) as date,
     COUNT(*) as new_users
   FROM users
   WHERE created_at >= NOW() - INTERVAL '90 days'
   GROUP BY DATE(created_at)
   ORDER BY date;
   ```

---

### Dashboard 7: 에셋 생성 분석
**목적**: 생성된 에셋 유형 및 품질 분석

**차트**:
1. **에셋 유형별 분포** (Pie Chart)
   ```sql
   SELECT
     asset_type,
     COUNT(*) as count
   FROM assets
   WHERE created_at >= NOW() - INTERVAL '30 days'
   GROUP BY asset_type;
   ```

2. **일별 에셋 생성 수** (Line Chart)
   ```sql
   SELECT
     DATE(created_at) as date,
     COUNT(*) as asset_count
   FROM assets
   WHERE created_at >= NOW() - INTERVAL '30 days'
   GROUP BY DATE(created_at)
   ORDER BY date;
   ```

3. **Review 통과율** (Big Number)
   ```sql
   SELECT
     ROUND(100.0 * SUM(CASE WHEN review_status = 'approved' THEN 1 ELSE 0 END) / COUNT(*), 2) as approval_rate
   FROM assets
   WHERE created_at >= NOW() - INTERVAL '7 days'
     AND review_status IS NOT NULL;
   ```

4. **평균 Review 점수** (Line Chart)
   ```sql
   SELECT
     DATE(created_at) as date,
     AVG(review_score) as avg_score
   FROM assets
   WHERE created_at >= NOW() - INTERVAL '30 days'
     AND review_score IS NOT NULL
   GROUP BY DATE(created_at)
   ORDER BY date;
   ```

---

### Dashboard 8: 에러 및 예외 추적
**목적**: 시스템 에러 패턴 및 트러블슈팅

**차트**:
1. **일별 에러 발생 수** (Line Chart)
   ```sql
   SELECT
     DATE(created_at) as date,
     COUNT(*) as error_count
   FROM agent_logs
   WHERE status = 'error'
     AND created_at >= NOW() - INTERVAL '30 days'
   GROUP BY DATE(created_at)
   ORDER BY date;
   ```

2. **에러 유형별 분포** (Pie Chart)
   ```sql
   SELECT
     error_type,
     COUNT(*) as count
   FROM agent_logs
   WHERE status = 'error'
     AND created_at >= NOW() - INTERVAL '7 days'
   GROUP BY error_type;
   ```

3. **최근 에러 로그 Top 20** (Table)
   ```sql
   SELECT
     created_at,
     agent_name,
     error_type,
     substring(error_message, 1, 100) as error_preview
   FROM agent_logs
   WHERE status = 'error'
   ORDER BY created_at DESC
   LIMIT 20;
   ```

4. **에러 복구 시간** (Bar Chart)
   ```sql
   SELECT
     agent_name,
     AVG(EXTRACT(EPOCH FROM (recovered_at - error_at))) as avg_recovery_seconds
   FROM agent_logs
   WHERE status = 'recovered'
     AND created_at >= NOW() - INTERVAL '7 days'
   GROUP BY agent_name;
   ```

---

# 4. FastAPI Prometheus 메트릭 통합

## 4.1 Prometheus Client 설치

```bash
# Mac mini에서
cd ~/sparklio_ai_marketing_studio/backend
source .venv/bin/activate
pip install prometheus-client
```

## 4.2 FastAPI 메트릭 익스포터 추가

**파일**: `backend/app/monitoring/prometheus_metrics.py`

```python
"""
Prometheus Metrics for FastAPI
"""

from prometheus_client import Counter, Histogram, Gauge, generate_latest, CONTENT_TYPE_LATEST
from fastapi import Response
import time

# Request counter
request_counter = Counter(
    'sparklio_http_requests_total',
    'Total HTTP requests',
    ['method', 'endpoint', 'status_code']
)

# Request latency
request_latency = Histogram(
    'sparklio_http_request_duration_seconds',
    'HTTP request latency',
    ['method', 'endpoint']
)

# Agent execution counter
agent_execution_counter = Counter(
    'sparklio_agent_executions_total',
    'Total agent executions',
    ['agent_name', 'status']
)

# Agent latency
agent_latency = Histogram(
    'sparklio_agent_duration_seconds',
    'Agent execution duration',
    ['agent_name']
)

# Workflow counter
workflow_counter = Counter(
    'sparklio_workflows_total',
    'Total workflows',
    ['status']
)

# Active workflows
active_workflows = Gauge(
    'sparklio_active_workflows',
    'Number of active workflows'
)

# Database connection pool
db_connection_pool = Gauge(
    'sparklio_db_connection_pool_size',
    'Database connection pool size'
)


def metrics_endpoint():
    """Prometheus metrics endpoint"""
    return Response(content=generate_latest(), media_type=CONTENT_TYPE_LATEST)
```

## 4.3 FastAPI 미들웨어 추가

**파일**: `backend/app/main.py` (수정)

```python
from app.monitoring.prometheus_metrics import (
    request_counter,
    request_latency,
    metrics_endpoint
)
from fastapi import Request
import time

# Prometheus metrics endpoint
@app.get("/metrics")
async def metrics():
    """Prometheus metrics"""
    return metrics_endpoint()

# Metrics middleware
@app.middleware("http")
async def prometheus_middleware(request: Request, call_next):
    """Track request metrics"""
    start_time = time.time()

    response = await call_next(request)

    # Record metrics
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
```

---

# 5. 간단한 메트릭 수집 시스템 (Docker 없이)

Docker가 없는 경우 Python 기반 간단한 메트릭 수집 시스템을 구축합니다.

## 5.1 메트릭 저장 스크립트

**파일**: `backend/app/monitoring/metrics_collector.py`

```python
"""
Simple Metrics Collector (without Prometheus)
Stores metrics in PostgreSQL
"""

from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import os

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://sparklio:password@localhost:5432/sparklio_db")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()


class SystemMetric(Base):
    """System metrics table"""
    __tablename__ = "system_metrics"

    id = Column(Integer, primary_key=True)
    metric_name = Column(String, index=True)
    metric_value = Column(Float)
    metric_type = Column(String)  # counter, gauge, histogram
    labels = Column(JSON)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)


# Create table
Base.metadata.create_all(engine)


class MetricsCollector:
    """Simple metrics collector"""

    def __init__(self):
        self.session = SessionLocal()

    def record_metric(self, name: str, value: float, metric_type: str = "gauge", labels: dict = None):
        """Record a metric"""
        metric = SystemMetric(
            metric_name=name,
            metric_value=value,
            metric_type=metric_type,
            labels=labels or {}
        )
        self.session.add(metric)
        self.session.commit()

    def increment_counter(self, name: str, labels: dict = None):
        """Increment a counter"""
        self.record_metric(name, 1.0, "counter", labels)

    def set_gauge(self, name: str, value: float, labels: dict = None):
        """Set a gauge value"""
        self.record_metric(name, value, "gauge", labels)

    def record_histogram(self, name: str, value: float, labels: dict = None):
        """Record histogram value"""
        self.record_metric(name, value, "histogram", labels)


# Global instance
metrics_collector = MetricsCollector()
```

---

# 6. 대시보드 접속 정보

## Superset
- **URL**: http://100.123.51.5:8088
- **Username**: admin
- **Password**: admin123

## FastAPI Metrics (Prometheus 형식)
- **URL**: http://100.123.51.5:8000/metrics

---

# 7. 모니터링 인프라 시작 스크립트

**파일**: `infrastructure/start_monitoring.sh`

```bash
#!/bin/bash

# Mac mini에서 실행
echo "Starting monitoring infrastructure..."

# Superset 시작
cd ~/sparklio_ai_marketing_studio
source superset_venv/bin/activate
nohup superset run -h 0.0.0.0 -p 8088 > logs/superset.log 2>&1 &
echo "Superset started on port 8088"

# FastAPI 시작 (metrics 포함)
cd ~/sparklio_ai_marketing_studio/backend
source .venv/bin/activate
nohup uvicorn app.main:app --host 0.0.0.0 --port 8000 > logs/fastapi.log 2>&1 &
echo "FastAPI started on port 8000"

echo "Monitoring infrastructure is running!"
echo "- Superset: http://100.123.51.5:8088"
echo "- Metrics: http://100.123.51.5:8000/metrics"
```

---

# 8. Docker 기반 설치 (선택사항)

Docker가 설치된 경우 사용할 수 있는 docker-compose 설정

**파일**: `infrastructure/docker-compose.monitoring.yml`

```yaml
version: '3.8'

services:
  superset:
    image: apache/superset:latest
    ports:
      - "8088:8088"
    environment:
      - SUPERSET_SECRET_KEY=sparklio_monitoring_secret_key_2025
    volumes:
      - superset_data:/app/superset_home

  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin123
    volumes:
      - grafana_data:/var/lib/grafana

volumes:
  superset_data:
  prometheus_data:
  grafana_data:
```

**실행**:
```bash
docker-compose -f infrastructure/docker-compose.monitoring.yml up -d
```

---

# 9. 헬스체크 및 문제 해결

## Superset 헬스체크
```bash
curl http://100.123.51.5:8088/health
```

## FastAPI Metrics 확인
```bash
curl http://100.123.51.5:8000/metrics
```

## 로그 확인
```bash
# Superset 로그
tail -f ~/sparklio_ai_marketing_studio/logs/superset.log

# FastAPI 로그
tail -f ~/sparklio_ai_marketing_studio/logs/fastapi.log
```

---

# 10. 다음 단계

- [ ] Superset 8개 대시보드 생성 완료
- [ ] Prometheus 메트릭 수집 확인
- [ ] Grafana 대시보드 구성 (Docker 설치 후)
- [ ] 알림 시스템 구축 (이메일, Slack)
- [ ] 성능 벤치마크 수행

---

**작성 완료일**: 2025-11-15
**다음 액션**: Superset 설치 및 PostgreSQL 연결
