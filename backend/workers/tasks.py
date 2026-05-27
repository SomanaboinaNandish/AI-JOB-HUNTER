"""
Celery Task Definitions
"""

import asyncio
from loguru import logger
from workers.celery_app import celery_app


def run_async(coro):
    """Helper to run async code in Celery sync context"""
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()


@celery_app.task(name="workers.tasks.scrape_all_jobs", bind=True, max_retries=3)
def scrape_all_jobs(self):
    """Run all scrapers and save new jobs"""
    try:
        from scrapers.orchestrator import run_all_scrapers
        result = run_async(run_all_scrapers())
        logger.info(f"✅ Scrape task complete: {result}")
        return result
    except Exception as e:
        logger.error(f"Scrape task failed: {e}")
        raise self.retry(exc=e, countdown=60 * 5)


@celery_app.task(name="workers.tasks.match_all_resumes")
def match_all_resumes():
    """Match all user resumes against recent jobs"""
    async def _run():
        from models.resume import Resume
        from models.job import Job
        from services.resume_service import ResumeService

        service = ResumeService()
        resumes = await Resume.find(Resume.is_active == True).to_list()
        recent_jobs = await Job.find(Job.is_active == True).sort(-Job.scraped_at).limit(50).to_list()

        for resume in resumes:
            for job in recent_jobs:
                try:
                    await service.match_job(resume.user_id, str(job.id))
                except Exception as e:
                    logger.debug(f"Match failed {resume.user_id} x {job.id}: {e}")

        logger.info(f"✅ Matched {len(resumes)} resumes against {len(recent_jobs)} jobs")

    run_async(_run())


@celery_app.task(name="workers.tasks.send_daily_digests")
def send_daily_digests():
    """Send daily job digest to all users with Telegram enabled"""
    async def _run():
        from datetime import datetime, timedelta
        from models.user import User
        from models.job import Job
        from services.notification_service import telegram_service

        users = await User.find(User.telegram_notifications == True).to_list()
        yesterday = datetime.utcnow() - timedelta(hours=24)
        new_jobs = await Job.find(
            Job.scraped_at >= yesterday,
            Job.is_active == True,
        ).sort(-Job.scraped_at).limit(20).to_list()

        if not new_jobs:
            logger.info("No new jobs for digest")
            return

        job_dicts = [{"title": j.title, "company": j.company, "salary_display": j.salary_display} for j in new_jobs]
        date_str = datetime.utcnow().strftime("%d %b %Y")

        for user in users:
            if user.telegram_chat_id:
                await telegram_service.send_daily_digest(user.telegram_chat_id, job_dicts, date_str)

        logger.info(f"✅ Sent daily digest to {len(users)} users")

    run_async(_run())


@celery_app.task(name="workers.tasks.send_instant_alert")
def send_instant_alert(user_id: str, job_id: str):
    """Send instant job alert to a specific user"""
    async def _run():
        from models.user import User
        from models.job import Job
        from models.job_match import JobMatch
        from services.notification_service import telegram_service

        user = await User.get(user_id)
        job = await Job.get(job_id)
        if not user or not job:
            return

        match = await JobMatch.find_one(
            JobMatch.user_id == user_id,
            JobMatch.job_id == job_id,
        )
        match_score = match.match_percentage if match else None

        if user.telegram_chat_id and user.telegram_notifications:
            await telegram_service.send_job_alert(
                chat_id=user.telegram_chat_id,
                job_title=job.title,
                company=job.company,
                salary_display=job.salary_display,
                match_score=match_score,
                apply_url=job.apply_url,
                location=job.location,
            )

    run_async(_run())


# Helper for manual task execution from FastAPI
async def run_job_search_task():
    scrape_all_jobs.delay()


async def run_resume_match_task(user_id: str):
    match_all_resumes.delay()
