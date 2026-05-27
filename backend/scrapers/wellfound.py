"""
Wellfound (AngelList) Job Scraper
Targets: startup fresher roles, AI/ML, SDE positions
"""

import re
from datetime import datetime
from typing import Optional
from bs4 import BeautifulSoup
from loguru import logger

from scrapers.base import BaseScraper, ScrapedJob, random_delay


class WellfoundScraper(BaseScraper):
    platform_name = "wellfound"
    BASE_URL = "https://wellfound.com"

    SEARCH_URLS = [
        "https://wellfound.com/jobs?role=Software+Engineer&experience=entry_level",
        "https://wellfound.com/jobs?role=Backend+Engineer&experience=entry_level",
        "https://wellfound.com/jobs?role=Full+Stack+Engineer&experience=entry_level",
        "https://wellfound.com/jobs?role=Machine+Learning+Engineer&experience=entry_level",
        "https://wellfound.com/jobs?role=AI+Engineer&experience=entry_level",
    ]

    async def scrape(self) -> list[ScrapedJob]:
        jobs = []
        for url in self.SEARCH_URLS:
            try:
                page_jobs = await self._scrape_page(url)
                jobs.extend(page_jobs)
                await random_delay("medium")
            except Exception as e:
                logger.error(f"[Wellfound] Failed scraping {url}: {e}")

        logger.info(f"[Wellfound] Scraped {len(jobs)} jobs")
        return jobs

    async def _scrape_page(self, url: str) -> list[ScrapedJob]:
        html = await self.fetch(url)
        if not html:
            return []

        soup = BeautifulSoup(html, "lxml")
        jobs = []

        # Wellfound job cards
        job_cards = soup.find_all("div", attrs={"data-test": "StartupResult"})
        if not job_cards:
            job_cards = soup.find_all("div", class_=re.compile(r"styles_component|JobListing"))

        for card in job_cards[:20]:
            try:
                job = self._parse_card(card)
                if job:
                    jobs.append(job)
            except Exception as e:
                logger.debug(f"[Wellfound] Card parse error: {e}")

        return jobs

    def _parse_card(self, card) -> Optional[ScrapedJob]:
        # Title
        title_el = card.find(["h2", "h3", "a"], class_=re.compile(r"title|role|position", re.I))
        title = title_el.get_text(strip=True) if title_el else ""
        if not title:
            return None

        # Company
        company_el = card.find(["span", "a", "div"], class_=re.compile(r"company|startup", re.I))
        company = company_el.get_text(strip=True) if company_el else "Unknown"

        # Location
        location_el = card.find(class_=re.compile(r"location|loc", re.I))
        location = location_el.get_text(strip=True) if location_el else "Remote / India"
        remote = "remote" in location.lower()

        # Apply URL
        link = card.find("a", href=True)
        apply_url = f"{self.BASE_URL}{link['href']}" if link and link["href"].startswith("/") else (link["href"] if link else url)

        # Salary
        salary_el = card.find(class_=re.compile(r"salary|compensation|comp", re.I))
        salary_text = salary_el.get_text(strip=True) if salary_el else ""
        sal_min, sal_max = self.parse_salary_inr(salary_text)

        # Skills from description snippet
        desc_el = card.find(class_=re.compile(r"description|snippet|summary", re.I))
        desc = desc_el.get_text(strip=True) if desc_el else ""

        return ScrapedJob(
            title=title,
            company=company,
            location=location,
            apply_url=apply_url,
            source_url=apply_url,
            source_platform=self.platform_name,
            description=desc,
            skills_required=self.extract_skills(desc),
            salary_min_lpa=sal_min,
            salary_max_lpa=sal_max,
            remote=remote,
            experience_min=0.0,
            experience_max=1.0,
            external_id=apply_url.split("/")[-1],
        )
