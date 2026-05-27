"""
Celery Application & Task Definitions
Scheduled background workers for autonomous job hunting
"""

import asyncio
from celery import Celery
from celery.schedules import crontab
from loguru import logger

from utils.config import settings

# Create Celery app
celery_app = Celery(
    "ai_job_hunter",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=["workers.tasks"],
)

# Configuration
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Kolkata",
    enable_utc=True,
    worker_prefetch_multiplier=1,
    task_acks_late=True,
)

# Scheduled tasks (Celery Beat)
celery_app.conf.beat_schedule = {
    # Scrape jobs every 2 hours
    "scrape-jobs-every-2-hours": {
        "task": "workers.tasks.scrape_all_jobs",
        "schedule": crontab(minute=0, hour="*/2"),
    },
    # Daily digest notification at 9 AM IST
    "daily-digest": {
        "task": "workers.tasks.send_daily_digests",
        "schedule": crontab(hour=9, minute=0),
    },
    # Match resumes against new jobs every 3 hours
    "match-resumes": {
        "task": "workers.tasks.match_all_resumes",
        "schedule": crontab(minute=30, hour="*/3"),
    },
}
