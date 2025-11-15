"""
Celery application configuration
"""

from celery import Celery
import os
from dotenv import load_dotenv

load_dotenv()

# Redis URL from environment
REDIS_URL = os.getenv("REDIS_URL", "redis://100.123.51.5:6379/0")

# Create Celery app
celery_app = Celery(
    "sparklio",
    broker=REDIS_URL,
    backend=REDIS_URL,
)

# Celery configuration
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Seoul",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=600,  # 10 minutes max per task
    task_soft_time_limit=540,  # 9 minutes soft limit
    worker_prefetch_multiplier=1,  # Process one task at a time
    worker_max_tasks_per_child=100,  # Restart worker after 100 tasks
)

# Auto-discover tasks
celery_app.autodiscover_tasks(["app.tasks"])

# Optional: Celery Beat schedule for TrendPipeline (Phase 5)
# from celery.schedules import crontab
# celery_app.conf.beat_schedule = {
#     'trend-collector': {
#         'task': 'app.tasks.trend.collect_trends',
#         'schedule': crontab(hour=2, minute=0),  # Run at 2 AM daily
#     },
# }
