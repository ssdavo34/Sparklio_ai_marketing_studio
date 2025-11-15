# DEPLOYMENT_PROCEDURES.md
Sparklio V4 — 배포 절차서
작성일: 2025-11-15
작성자: A팀 (Infrastructure Team)

---

# 1. 목적

Sparklio V4 Multi-Agent 시스템의 **5단계 Phase별 배포 절차**를 상세히 정의합니다.
각 Phase는 이전 Phase가 안정적으로 동작해야 진행할 수 있습니다.

---

# 2. 배포 환경 정보

## 2.1 3-Node 구성

| Node | 호스트명 | Tailscale IP | 역할 | OS |
|------|----------|--------------|------|-----|
| Mac mini | mac-mini | 100.123.51.5 | Backend, DB, Redis, MinIO | macOS |
| Desktop | desktop | 100.120.180.42 | Ollama, ComfyUI, GPU Worker | Windows 11 |
| Laptop | laptop | 100.101.68.23 | Frontend (Next.js) | Windows/macOS |

---

## 2.2 서비스 포트 할당

[PORT_ALLOCATION.md](PORT_ALLOCATION.md) 참조.

**핵심 포트**:
- PostgreSQL: 5432
- Redis: 6379
- MinIO: 9000, 9001
- FastAPI: 8000
- Ollama: 11434
- ComfyUI: 8188
- Next.js: 3000

---

# 3. Phase 0: 사전 준비 (Prerequisites)

## 3.1 체크리스트

- [ ] 모든 노드에서 Tailscale 연결 확인
- [ ] Mac mini에서 PostgreSQL, Redis, MinIO 실행 중
- [ ] Desktop에서 Ollama 실행 중
- [ ] Git 저장소 최신 상태 (`git pull origin main`)
- [ ] Python 가상환경 설정 (`venv` 또는 `.venv`)
- [ ] Node.js 설치 확인 (v18+)

---

## 3.2 연결 테스트

### Mac mini → Desktop Ollama
```bash
# Mac mini에서 실행
curl http://100.120.180.42:11434/api/version
```

**Expected Output**:
```json
{"version": "0.1.0"}
```

### Mac mini → PostgreSQL
```bash
# Mac mini에서 실행
psql -U sparklio -d sparklio_db -c "SELECT 1;"
```

### Laptop → Mac mini FastAPI
```bash
# Laptop에서 실행
curl http://100.123.51.5:8000/health
```

---

# 4. Phase 1: Foundation (기반 구축)

## 4.1 목표
- DB 스키마 생성 (workflows, agent_logs, context_traces)
- PMAgent 기본 골격 배포
- SmartRouter 배포
- Ollama 통합 레이어 배포

---

## 4.2 배포 단계

### Step 1: DB 마이그레이션

```bash
# Mac mini에서 실행
cd ~/sparklio_ai_marketing_studio/backend
source .venv/bin/activate

# Alembic 마이그레이션 실행
alembic upgrade head
```

**확인**:
```sql
psql -U sparklio -d sparklio_db -c "\dt"
```

**Expected Tables**:
- workflows
- workflow_nodes
- workflow_edges
- agent_logs
- context_traces
- router_logs

---

### Step 2: Backend 코드 배포

```bash
# Mac mini에서 실행
cd ~/sparklio_ai_marketing_studio/backend
git pull origin dev

# 의존성 설치
pip install -r requirements.txt

# 환경 변수 확인
cat .env
```

**.env 예시**:
```env
DATABASE_URL=postgresql://sparklio:password@localhost:5432/sparklio_db
REDIS_URL=redis://localhost:6379/0
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
OLLAMA_BASE_URL=http://100.120.180.42:11434
```

---

### Step 3: FastAPI 서버 시작

```bash
# Mac mini에서 실행
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**헬스체크**:
```bash
curl http://100.123.51.5:8000/health
```

**Expected**:
```json
{"status": "ok", "version": "v4.0.0"}
```

---

### Step 4: Celery Worker 시작

```bash
# Mac mini에서 실행 (새 터미널)
cd ~/sparklio_ai_marketing_studio/backend
source .venv/bin/activate

celery -A app.celery worker --loglevel=info
```

**확인**:
```bash
celery -A app.celery inspect active
```

---

### Step 5: SmartRouter 테스트

```bash
curl -X POST http://100.123.51.5:8000/api/v1/router/route \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test_user",
    "request_text": "브랜드 색상 알려줘",
    "brand_id": "test_brand"
  }'
```

**Expected Response**:
```json
{
  "target_agent": "BrandAgent",
  "selected_model": "qwen2.5-7b",
  "risk_level": "low"
}
```

---

## 4.3 Phase 1 체크리스트

- [ ] DB 테이블 생성 완료
- [ ] FastAPI 서버 실행 중
- [ ] Celery Worker 실행 중
- [ ] SmartRouter 정상 응답
- [ ] Ollama 통합 테스트 성공
- [ ] 로그 확인 (에러 없음)

---

# 5. Phase 2: Core Agents (핵심 에이전트 배포)

## 5.1 목표
- StrategistAgent, CopywriterAgent, VisionGeneratorAgent, ReviewerAgent 배포
- BrandAgent, BriefAgent 배포

---

## 5.2 배포 단계

### Step 1: 코드 배포

```bash
# Mac mini에서 실행
cd ~/sparklio_ai_marketing_studio/backend
git pull origin dev

# 새 에이전트 코드 확인
ls app/agents/
# strategist.py, copywriter.py, vision.py, reviewer.py, brand.py, brief.py
```

---

### Step 2: 에이전트별 단위 테스트

```bash
# Mac mini에서 실행
pytest tests/test_strategist_agent.py -v
pytest tests/test_copywriter_agent.py -v
pytest tests/test_vision_agent.py -v
```

**Expected**: 모든 테스트 통과

---

### Step 3: A2A 통신 테스트

```bash
curl -X POST http://100.123.51.5:8000/api/v1/agents/strategist \
  -H "Content-Type: application/json" \
  -d '{
    "brand_id": "brand_test",
    "campaign_goal": "신제품 런칭",
    "target_audience": "MZ세대"
  }'
```

**Expected**: StrategistOutput JSON 응답

---

### Step 4: VisionGeneratorAgent → ComfyUI 연동 테스트

```bash
# Desktop ComfyUI 실행 확인
curl http://100.120.180.42:8188/system_stats
```

```bash
# Mac mini에서 VisionGeneratorAgent 호출
curl -X POST http://100.123.51.5:8000/api/v1/agents/vision \
  -H "Content-Type: application/json" \
  -d '{
    "brand_id": "test_brand",
    "brief": {...},
    "style": "minimalist"
  }'
```

---

## 5.3 Phase 2 체크리스트

- [ ] StrategistAgent 배포 완료
- [ ] CopywriterAgent 배포 완료
- [ ] VisionGeneratorAgent 배포 완료
- [ ] ReviewerAgent 배포 완료
- [ ] BrandAgent, BriefAgent 배포 완료
- [ ] A2A 통신 테스트 통과
- [ ] ComfyUI 연동 성공

---

# 6. Phase 3: Workflow Integration (워크플로우 통합)

## 6.1 목표
- PMAgent DAG 실행 기능 배포
- Risk-based Strategy Review 적용
- 병렬 실행 테스트

---

## 6.2 배포 단계

### Step 1: PMAgent 배포

```bash
# Mac mini에서 실행
cd ~/sparklio_ai_marketing_studio/backend
git pull origin dev

# PMAgent 테스트
pytest tests/test_pm_agent.py -v
```

---

### Step 2: DAG 실행 테스트

```bash
curl -X POST http://100.123.51.5:8000/api/v1/pm/create_workflow \
  -H "Content-Type: application/json" \
  -d '{
    "user_request": "SNS 이미지 1개 만들어줘",
    "brand_id": "test_brand"
  }'
```

**Expected Response**:
```json
{
  "job_id": "workflow_12345",
  "status": "accepted",
  "workflow_spec": {...}
}
```

---

### Step 3: Workflow 진행 상황 모니터링

```bash
curl http://100.123.51.5:8000/api/v1/pm/status/workflow_12345
```

**Expected**:
```json
{
  "status": "running",
  "progress": 0.6,
  "current_node": "VisionGeneratorAgent"
}
```

---

### Step 4: 병렬 실행 테스트 (DAG)

**Workflow Spec** (예시):
```json
{
  "nodes": [
    {"node_id": "strategist", "agent_name": "StrategistAgent"},
    {"node_id": "copywriter", "agent_name": "CopywriterAgent", "dependencies": ["strategist"]},
    {"node_id": "vision", "agent_name": "VisionGeneratorAgent", "dependencies": ["strategist"]},
    {"node_id": "reviewer", "agent_name": "ReviewerAgent", "dependencies": ["copywriter", "vision"]}
  ]
}
```

**확인**: copywriter와 vision이 병렬 실행되는지 로그 확인

---

## 6.3 Phase 3 체크리스트

- [ ] PMAgent PlanBuilder 동작
- [ ] PMAgent PlanExecutor 동작
- [ ] DAG 실행 성공
- [ ] 병렬 실행 확인
- [ ] Risk-based Review 동작 (high risk 작업 시)

---

# 7. Phase 4: Monitoring (모니터링 구축)

## 7.1 목표
- Superset 설치 및 대시보드 구축
- Prometheus + Grafana 설치
- OpenTelemetry 연동

---

## 7.2 배포 단계

### Step 1: Superset 설치 (Docker)

```bash
# Mac mini에서 실행
docker run -d \
  --name superset \
  -p 8088:8088 \
  -e "SUPERSET_SECRET_KEY=sparklio_secret_$(openssl rand -base64 32)" \
  apache/superset

# 초기 설정
docker exec -it superset superset fab create-admin \
  --username admin \
  --firstname Superset \
  --lastname Admin \
  --email admin@sparklio.com \
  --password admin

docker exec -it superset superset db upgrade
docker exec -it superset superset init
```

**접속**: http://100.123.51.5:8088

---

### Step 2: Superset PostgreSQL 연결

Superset UI에서:
1. Settings → Database Connections
2. Add Database
3. PostgreSQL
4. SQLAlchemy URI: `postgresql://sparklio:password@localhost:5432/sparklio_db`
5. Test Connection → Save

---

### Step 3: Superset 대시보드 생성

[009.Sparklio 전용 Superset 대시보드 설계 템플릿.md](K:\obsidian-k\Sparklio_ai_marketing_studio\최종계획\Agent정의\009.Sparklio 전용 Superset 대시보드 설계 템플릿.md) 참조.

**8개 대시보드**:
1. Global Overview
2. Brand Kit Dashboard
3. Marketing Brief Dashboard
4. Generators Dashboard
5. Video Generation Dashboard
6. Editor Dashboard
7. TrendPipeline Dashboard
8. Publishing Dashboard

---

### Step 4: Prometheus 설치

```bash
# Mac mini에서 실행
docker run -d \
  --name prometheus \
  -p 9090:9090 \
  -v ~/sparklio_ai_marketing_studio/infrastructure/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml \
  prom/prometheus
```

**prometheus.yml** 예시:
```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'fastapi'
    static_configs:
      - targets: ['100.123.51.5:8000']
```

---

### Step 5: Grafana 설치

```bash
# Mac mini에서 실행
docker run -d \
  --name grafana \
  -p 3001:3000 \
  grafana/grafana
```

**접속**: http://100.123.51.5:3001

**설정**:
1. Add Data Source → Prometheus
2. URL: http://100.123.51.5:9090
3. Save & Test

---

### Step 6: OpenTelemetry 설치 (선택)

```bash
# Jaeger 설치
docker run -d \
  --name jaeger \
  -p 16686:16686 \
  -p 4317:4317 \
  jaegertracing/all-in-one:latest
```

**FastAPI 계측**:
```python
from opentelemetry import trace
from opentelemetry.exporter.jaeger import JaegerExporter
from opentelemetry.sdk.trace import TracerProvider

provider = TracerProvider()
provider.add_span_processor(
    BatchSpanProcessor(JaegerExporter(
        agent_host_name="100.123.51.5",
        agent_port=6831,
    ))
)
trace.set_tracer_provider(provider)
```

---

## 7.3 Phase 4 체크리스트

- [ ] Superset 실행 중
- [ ] PostgreSQL 연결 성공
- [ ] 8개 대시보드 생성 완료
- [ ] Prometheus 실행 중
- [ ] Grafana 실행 중
- [ ] 메트릭 수집 확인

---

# 8. Phase 5: Advanced Features (고급 기능)

## 8.1 목표
- TrendPipeline (Celery Beat) 배포
- Video Pipeline (Veo3) 배포
- EditorAgent 배포
- Context Engineering 전면 적용

---

## 8.2 배포 단계

### Step 1: Celery Beat 설정

```bash
# Mac mini에서 실행
cd ~/sparklio_ai_marketing_studio/backend

# celerybeat_schedule.py 확인
cat app/celerybeat_schedule.py
```

**예시**:
```python
from celery.schedules import crontab

CELERYBEAT_SCHEDULE = {
    'trend-collector': {
        'task': 'app.agents.trend.collector.run',
        'schedule': crontab(hour=2, minute=0),  # 매일 오전 2시
    },
}
```

**Celery Beat 실행**:
```bash
celery -A app.celery beat --loglevel=info
```

---

### Step 2: TrendPipeline 테스트

```bash
# 수동 트리거
curl -X POST http://100.123.51.5:8000/api/v1/trend/collect
```

**로그 확인**:
```bash
tail -f celery_beat.log
```

---

### Step 3: EditorAgent 배포

```bash
# Frontend 배포 (Laptop)
cd ~/sparklio_ai_marketing_studio/frontend
npm install
npm run build
npm start
```

**접속**: http://100.101.68.23:3000/editor

**테스트**: 자연어 명령 ("제목 글자를 크게 해줘")

---

## 8.3 Phase 5 체크리스트

- [ ] Celery Beat 실행 중
- [ ] TrendPipeline 정상 동작
- [ ] EditorAgent 배포 완료
- [ ] Video Pipeline 테스트 완료

---

# 9. 서비스 재시작 순서

장애 발생 시 또는 업데이트 후 재시작:

## 9.1 Mac mini

```bash
# 1. PostgreSQL 재시작
brew services restart postgresql@14

# 2. Redis 재시작
docker restart redis

# 3. MinIO 재시작
docker restart minio

# 4. FastAPI 재시작
pkill -f "uvicorn app.main"
cd ~/sparklio_ai_marketing_studio/backend
source .venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload &

# 5. Celery Worker 재시작
pkill -f "celery.*worker"
celery -A app.celery worker --loglevel=info &

# 6. Celery Beat 재시작 (Phase 5 이후)
pkill -f "celery.*beat"
celery -A app.celery beat --loglevel=info &
```

---

## 9.2 Desktop

```bash
# Ollama 재시작
ollama serve

# ComfyUI 재시작
cd /d/AI/ComfyUI
python main.py --listen 0.0.0.0 --port 8188
```

---

## 9.3 Laptop

```bash
# Frontend 재시작
cd ~/sparklio_ai_marketing_studio/frontend
npm run dev
```

---

# 10. 헬스체크 스크립트

전체 시스템 상태를 한 번에 확인하는 스크립트.

## 10.1 스크립트 생성

```bash
# Mac mini에서 실행
cat > ~/sparklio_healthcheck.sh << 'EOF'
#!/bin/bash

echo "=== Sparklio V4 Health Check ==="

# PostgreSQL
echo -n "PostgreSQL: "
psql -U sparklio -d sparklio_db -c "SELECT 1;" > /dev/null 2>&1 && echo "OK" || echo "FAIL"

# Redis
echo -n "Redis: "
docker exec redis redis-cli ping > /dev/null 2>&1 && echo "OK" || echo "FAIL"

# MinIO
echo -n "MinIO: "
curl -s http://localhost:9000/minio/health/live > /dev/null && echo "OK" || echo "FAIL"

# FastAPI
echo -n "FastAPI: "
curl -s http://localhost:8000/health > /dev/null && echo "OK" || echo "FAIL"

# Ollama
echo -n "Ollama: "
curl -s http://100.120.180.42:11434/api/version > /dev/null && echo "OK" || echo "FAIL"

# Celery Worker
echo -n "Celery Worker: "
celery -A app.celery inspect active > /dev/null 2>&1 && echo "OK" || echo "FAIL"

echo "=== End of Health Check ==="
EOF

chmod +x ~/sparklio_healthcheck.sh
```

---

## 10.2 실행

```bash
~/sparklio_healthcheck.sh
```

**Expected Output**:
```
=== Sparklio V4 Health Check ===
PostgreSQL: OK
Redis: OK
MinIO: OK
FastAPI: OK
Ollama: OK
Celery Worker: OK
=== End of Health Check ===
```

---

# 11. 롤백 절차

배포 중 문제 발생 시 이전 버전으로 복구.

## 11.1 코드 롤백

```bash
# Mac mini에서 실행
cd ~/sparklio_ai_marketing_studio/backend
git log --oneline -10  # 최근 커밋 확인

# 이전 커밋으로 롤백
git reset --hard <commit-hash>

# 서비스 재시작
~/sparklio_healthcheck.sh
```

---

## 11.2 DB 롤백

```bash
# Alembic downgrade
cd ~/sparklio_ai_marketing_studio/backend
source .venv/bin/activate

alembic downgrade -1  # 한 단계 롤백
```

---

# 12. 로그 위치

| 서비스 | 로그 파일 |
|--------|-----------|
| FastAPI | `~/sparklio_ai_marketing_studio/backend/logs/fastapi.log` |
| Celery Worker | `~/sparklio_ai_marketing_studio/backend/logs/celery_worker.log` |
| Celery Beat | `~/sparklio_ai_marketing_studio/backend/logs/celery_beat.log` |
| PostgreSQL | `/usr/local/var/log/postgresql@14.log` |
| Ollama | `%USERPROFILE%\.ollama\logs\` (Windows) |

---

# 13. 문제 해결 (Troubleshooting)

## 13.1 FastAPI 시작 실패

**증상**: `uvicorn` 실행 시 에러

**해결**:
```bash
# 환경 변수 확인
cat .env

# DB 연결 테스트
psql -U sparklio -d sparklio_db -c "SELECT 1;"

# 의존성 재설치
pip install -r requirements.txt --force-reinstall
```

---

## 13.2 Celery Worker 연결 실패

**증상**: `celery worker` 실행 시 Redis 연결 에러

**해결**:
```bash
# Redis 상태 확인
docker ps | grep redis

# Redis 재시작
docker restart redis

# Celery 재시작
celery -A app.celery worker --loglevel=info
```

---

## 13.3 Ollama 연결 실패

**증상**: VisionGeneratorAgent 호출 시 타임아웃

**해결**:
```bash
# Desktop에서 Ollama 실행 확인
ollama list

# Tailscale 연결 확인
tailscale status

# Mac mini에서 연결 테스트
curl http://100.120.180.42:11434/api/version
```

---

# 14. 다음 단계

배포 완료 후:

1. **성능 튜닝**: [PERFORMANCE_TUNING_GUIDE.md](PERFORMANCE_TUNING_GUIDE.md)
2. **재해 복구 계획**: [DISASTER_RECOVERY_PLAN.md](DISASTER_RECOVERY_PLAN.md)
3. **사용자 교육**: B팀, C팀 대상

---

**작성 완료일**: 2025-11-15
**관련 문서**:
- [SYSTEM_IMPROVEMENT_PLAN.md](SYSTEM_IMPROVEMENT_PLAN.md)
- [PORT_ALLOCATION.md](PORT_ALLOCATION.md)
- [DEV_WORKFLOW.md](DEV_WORKFLOW.md)
