"""
RemoteOK Job Scraper
Uses public JSON API - reliable and fresh data
"""

from datetime import datetime
from typing import Optional
from loguru import logger

from scrapers.base import BaseScraper, ScrapedJob, random_delay


FRESHER_TAGS = {"junior", "entry", "graduate", "trainee", "intern", "fresher"}
TARGET_TAGS = {
    "python", "javascript", "typescript", "react", "nodejs", "golang",
    "django", "fastapi", "machinelearning", "ai", "backend", "fullstack",
    "software", "engineering", "developer"
}


class RemoteOKScraper(BaseScraper):
    platform_name = "remoteok"
    API_URL = "https://remoteok.com/api"

    async def scrape(self) -> list[ScrapedJob]:
        jobs = []
        try:
            # RemoteOK has a public JSON API
            response = await self.client.get(
                self.API_URL,
                headers={
                    "User-Agent": "Mozilla/5.0",
                    "Accept": "application/json",
                }
            )
            data = response.json()

            if isinstance(data, list):
                # First item is metadata
                for item in data[1:]:
                    try:
                        job = self._parse_item(item)
                        if job:
                            jobs.append(job)
                    except Exception as e:
                        logger.debug(f"[RemoteOK] Parse error: {e}")

        except Exception as e:
            logger.error(f"[RemoteOK] Failed: {e}")

        # Filter to fresher-friendly
        filtered = [j for j in jobs if self._is_relevant(j)]
        logger.info(f"[RemoteOK] Scraped {len(filtered)}/{len(jobs)} relevant jobs")
        return filtered[:50]

    def _parse_item(self, item: dict) -> Optional[ScrapedJob]:
        if not isinstance(item, dict):
            return None

        title = item.get("position", "")
        company = item.get("company", "Unknown")
        location = item.get("location", "Remote")
        apply_url = item.get("apply_url") or item.get("url", "")
        description = item.get("description", "")
        tags = item.get("tags", [])

        if not title or not apply_url:
            return None

        salary_min = item.get("salary_min")
        salary_max = item.get("salary_max")

        # Convert USD to INR LPA (approx)
        sal_min_lpa = None
        sal_max_lpa = None
        if salary_min:
            sal_min_lpa = round(float(salary_min) * 83 / 100000, 1)
        if salary_max:
            sal_max_lpa = round(float(salary_max) * 83 / 100000, 1)

        date_str = item.get("date", "")
        posted_at = None
        if date_str:
            try:
                posted_at = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
            except Exception:
                pass

        skills = list(set(tags) & TARGET_TAGS) + self.extract_skills(description)

        return ScrapedJob(
            title=title,
            company=company,
            location=location or "Remote",
            apply_url=apply_url,
            source_url=f"https://remoteok.com/remote-jobs/{item.get('id', '')}",
            source_platform=self.platform_name,
            description=description,
            skills_required=list(set(skills))[:15],
            salary_min_lpa=sal_min_lpa,
            salary_max_lpa=sal_max_lpa,
            remote=True,
            job_type="full_time",
            posted_at=posted_at,
            external_id=str(item.get("id", "")),
        )

    def _is_relevant(self, job: ScrapedJob) -> bool:
        """Check if job is relevant for freshers"""
        tags_set = set(t.lower() for t in job.skills_required)
        combined = f"{job.title} {job.description}".lower()

        has_target_skill = bool(tags_set & TARGET_TAGS)
        is_fresher = self.is_fresher_job(job.title, job.description)
        no_senior = not any(w in combined for w in ["senior", "staff", "principal", "lead", "manager", "5+ years", "7+ years"])

        return has_target_skill and (is_fresher or no_senior)
