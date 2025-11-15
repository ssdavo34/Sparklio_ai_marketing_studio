# Celery Setup Guide

Sparklio V4에서 Celery를 사용하는 방법입니다.

## 1. Celery Worker 시작

Mac mini에서 실행:

```bash
cd ~/sparklio_ai_marketing_studio/backend
source .venv/bin/activate

# Celery Worker 실행
celery -A app.celery_app worker --loglevel=info --concurrency=2
```

## 2. Celery Worker 상태 확인

```bash
# 실행 중인 task 확인
celery -A app.celery_app inspect active

# Worker 상태 확인
celery -A app.celery_app inspect stats
```

## 3. Celery Beat 시작 (Phase 5에서 필요)

```bash
# Celery Beat 스케줄러 실행 (TrendPipeline용)
celery -A app.celery_app beat --loglevel=info
```

## 4. Task 실행 테스트

Python에서 task 호출:

```python
from app.tasks.workflow import execute_workflow_node

# Async task 실행
result = execute_workflow_node.delay(
    node_id="test_node",
    agent_name="TestAgent",
    input_data={"test": "data"}
)

# 결과 확인
print(result.get(timeout=10))
```

## 5. 프로덕션 배포

systemd 서비스로 등록 (권장):

```bash
# /etc/systemd/system/sparklio-celery.service
[Unit]
Description=Sparklio Celery Worker
After=network.target

[Service]
Type=forking
User=woosun
WorkingDirectory=/Users/woosun/sparklio_ai_marketing_studio/backend
ExecStart=/Users/woosun/sparklio_ai_marketing_studio/backend/.venv/bin/celery -A app.celery_app worker --loglevel=info --concurrency=2 --detach
ExecStop=/bin/kill -TERM $MAINPID
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable sparklio-celery
sudo systemctl start sparklio-celery
sudo systemctl status sparklio-celery
```

## 6. 모니터링

Flower (Celery 모니터링 툴):

```bash
pip install flower
celery -A app.celery_app flower --port=5555
```

접속: http://100.123.51.5:5555

## 7. 문제 해결

### Redis 연결 실패
```bash
# Redis 상태 확인
docker ps | grep redis

# Redis 재시작
docker restart redis
```

### Worker가 Task를 받지 않음
```bash
# Celery purge (모든 pending task 삭제)
celery -A app.celery_app purge

# Worker 재시작
pkill -f "celery worker"
celery -A app.celery_app worker --loglevel=info
```

## 8. 다음 단계

Celery 설정 완료 후:
- [ ] PMAgent DAG 실행 로직 구현
- [ ] Workflow 실행 테스트
- [ ] Phase 4에서 모니터링 추가 (Flower, Superset)
