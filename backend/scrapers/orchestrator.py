"""
Scraper Orchestrator
Runs all scrapers concurrently, deduplicates, saves to MongoDB
"""

import asyncio
from datetime import datetime
from typing import List
from loguru import logger

from scrapers.base import ScrapedJob
from scrapers.remoteok import RemoteOKScraper
from scrapers.wellfound import WellfoundScraper
from scrapers.greenhouse_lever import GreenhouseScraper, LeverScraper
from models.job import Job
from services.salary_service import SalaryEstimationService

salary_service = SalaryEstimationService()


async def run_all_scrapers() -> dict:
    """Run all scrapers concurrently and save results"""
    logger.info("🔍 Starting job scraping across all platforms...")

    scrapers = [
        RemoteOKScraper(),
        WellfoundScraper(),
        GreenhouseScraper(),
        LeverScraper(),
    ]

    # Run concurrently
    tasks = [scraper.scrape() for scraper in scrapers]
    results = await asyncio.gather(*tasks, return_exceptions=True)

    all_jobs: List[ScrapedJob] = []
    for i, result in enumerate(results):
        if isinstance(result, Exception):
            logger.error(f"Scraper {scrapers[i].platform_name} failed: {result}")
        else:
            all_jobs.extend(result)
            logger.info(f"✅ {scrapers[i].platform_name}: {len(result)} jobs")

    # Save to database (deduplicate by platform + external_id)
    saved, skipped = await save_jobs(all_jobs)

    summary = {
        "total_scraped": len(all_jobs),
        "saved": saved,
        "skipped_duplicates": skipped,
        "timestamp": datetime.utcnow().isoformat(),
    }
    logger.info(f"📊 Scraping complete: {summary}")
    return summary


async def save_jobs(scraped_jobs: List[ScrapedJob]) -> tuple[int, int]:
    """Save scraped jobs to MongoDB, skip duplicates"""
    saved = 0
    skipped = 0

    for sj in scraped_jobs:
        try:
            # Check duplicate
            existing = await Job.find_one(
                Job.source_platform == sj.source_platform,
                Job.external_id == sj.external_id,
            )
            if existing:
                skipped += 1
                continue

            # Estimate salary if missing
            sal_min = sj.salary_min_lpa
            sal_max = sj.salary_max_lpa
            estimated = False

            if not sal_min:
                estimation = await salary_service.estimate(
                    title=sj.title,
                    company=sj.company,
                    location=sj.location,
                    skills=sj.skills_required,
                )
                sal_min = estimation.get("min_lpa")
                sal_max = estimation.get("max_lpa")
                estimated = True

            # Build display string
            if sal_min and sal_max:
                salary_display = f"₹{sal_min:.0f}–{sal_max:.0f} LPA"
                if estimated:
                    salary_display += " (est.)"
            elif sal_min:
                salary_display = f"₹{sal_min:.0f}+ LPA"
            else:
                salary_display = "Salary not disclosed"

            job = Job(
                title=sj.title,
                company=sj.company,
                company_logo=sj.company_logo,
                location=sj.location,
                remote=sj.remote,
                description=sj.description,
                requirements=sj.requirements,
                skills_required=sj.skills_required,
                experience_min=sj.experience_min,
                experience_max=sj.experience_max,
                salary_min_lpa=sal_min,
                salary_max_lpa=sal_max,
                salary_estimated=estimated,
                salary_display=salary_display,
                apply_url=sj.apply_url,
                source_url=sj.source_url,
                source_platform=sj.source_platform,
                external_id=sj.external_id,
                posted_at=sj.posted_at,
                job_type=sj.job_type,
                is_active=True,
                fresher_friendly=True,
            )
            await job.insert()
            saved += 1

        except Exception as e:
            logger.debug(f"Error saving job {sj.title}: {e}")

    return saved, skipped
