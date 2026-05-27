"""
Greenhouse & Lever Job Board Scrapers
Both have clean JSON APIs — no Playwright needed
"""

import re
from datetime import datetime
from typing import Optional, List
from loguru import logger

from scrapers.base import BaseScraper, ScrapedJob, random_delay

# Well-known companies using Greenhouse that hire freshers
GREENHOUSE_COMPANIES = [
    "airbnb", "stripe", "notion", "figma", "linear", "vercel",
    "cloudflare", "datadog", "mixpanel", "segment", "brex",
    "scale-ai", "cohere", "anthropic", "openai",
]

LEVER_COMPANIES = [
    "netflix", "lyft", "reddit", "evernote", "carta",
    "intercom", "attentive", "benchling", "lattice",
]

FRESHER_PATTERN = re.compile(
    r"\b(fresher|entry.?level|0.?1\s*year|new.?grad|junior|graduate|intern)\b",
    re.IGNORECASE,
)


class GreenhouseScraper(BaseScraper):
    platform_name = "greenhouse"

    async def scrape(self) -> list[ScrapedJob]:
        all_jobs = []
        for company in GREENHOUSE_COMPANIES:
            try:
                jobs = await self._scrape_company(company)
                all_jobs.extend(jobs)
                await random_delay("medium")
            except Exception as e:
                logger.debug(f"[Greenhouse] {company}: {e}")

        logger.info(f"[Greenhouse] Total: {len(all_jobs)} jobs")
        return all_jobs

    async def _scrape_company(self, company: str) -> list[ScrapedJob]:
        url = f"https://boards-api.greenhouse.io/v1/boards/{company}/jobs?content=true"
        try:
            response = await self.client.get(url)
            if response.status_code != 200:
                return []
            data = response.json()
            jobs = data.get("jobs", [])
        except Exception:
            return []

        result = []
        for job in jobs:
            parsed = self._parse_job(job, company)
            if parsed and self._is_fresher_relevant(parsed):
                result.append(parsed)

        return result

    def _parse_job(self, item: dict, company: str) -> Optional[ScrapedJob]:
        title = item.get("title", "")
        if not title:
            return None

        apply_url = item.get("absolute_url", "")
        location_data = item.get("location", {})
        location = location_data.get("name", "Remote") if isinstance(location_data, dict) else str(location_data)

        content = item.get("content", "")
        # Strip HTML
        content = re.sub(r"<[^>]+>", " ", content)

        date_str = item.get("updated_at", "")
        posted_at = None
        if date_str:
            try:
                posted_at = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
            except Exception:
                pass

        return ScrapedJob(
            title=title,
            company=company.replace("-", " ").title(),
            location=location,
            apply_url=apply_url,
            source_url=apply_url,
            source_platform=self.platform_name,
            description=content[:2000],
            skills_required=self.extract_skills(content),
            remote="remote" in location.lower(),
            job_type="full_time",
            posted_at=posted_at,
            external_id=str(item.get("id", "")),
        )

    def _is_fresher_relevant(self, job: ScrapedJob) -> bool:
        combined = f"{job.title} {job.description}".lower()
        no_senior = not any(w in combined for w in ["senior", "staff", "principal", "lead", "director", "vp", "5+", "7+", "10+"])
        return no_senior or bool(FRESHER_PATTERN.search(combined))


class LeverScraper(BaseScraper):
    platform_name = "lever"

    async def scrape(self) -> list[ScrapedJob]:
        all_jobs = []
        for company in LEVER_COMPANIES:
            try:
                jobs = await self._scrape_company(company)
                all_jobs.extend(jobs)
                await random_delay("medium")
            except Exception as e:
                logger.debug(f"[Lever] {company}: {e}")

        logger.info(f"[Lever] Total: {len(all_jobs)} jobs")
        return all_jobs

    async def _scrape_company(self, company: str) -> list[ScrapedJob]:
        url = f"https://api.lever.co/v0/postings/{company}?mode=json"
        try:
            response = await self.client.get(url)
            if response.status_code != 200:
                return []
            jobs = response.json()
        except Exception:
            return []

        result = []
        for job in jobs:
            parsed = self._parse_job(job, company)
            if parsed:
                result.append(parsed)
        return result

    def _parse_job(self, item: dict, company: str) -> Optional[ScrapedJob]:
        title = item.get("text", "")
        if not title:
            return None

        apply_url = item.get("hostedUrl", item.get("applyUrl", ""))
        location = item.get("categories", {}).get("location", "Remote")
        description_list = item.get("descriptionPlain", item.get("description", ""))
        desc = re.sub(r"<[^>]+>", " ", description_list)

        combined = f"{title} {desc}".lower()
        no_senior = not any(w in combined for w in ["senior", "staff", "principal", "lead", "5+"])

        if not no_senior and not FRESHER_PATTERN.search(combined):
            return None

        created = item.get("createdAt", 0)
        posted_at = datetime.fromtimestamp(created / 1000) if created else None

        return ScrapedJob(
            title=title,
            company=company.title(),
            location=location,
            apply_url=apply_url,
            source_url=apply_url,
            source_platform=self.platform_name,
            description=desc[:2000],
            skills_required=self.extract_skills(desc),
            remote="remote" in location.lower(),
            job_type="full_time",
            posted_at=posted_at,
            external_id=item.get("id", ""),
        )
