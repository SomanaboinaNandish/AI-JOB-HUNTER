"""
Base Scraper - Shared scraping infrastructure
- Rotating user agents
- Random delays
- Retry logic
- Anti-block mechanisms
"""

import asyncio
import random
from typing import Optional, Dict, Any
from dataclasses import dataclass, field
from datetime import datetime

import httpx
from bs4 import BeautifulSoup
from fake_useragent import UserAgent
from tenacity import retry, stop_after_attempt, wait_exponential
from loguru import logger


@dataclass
class ScrapedJob:
    title: str
    company: str
    location: str
    apply_url: str
    source_url: str
    source_platform: str
    description: str = ""
    requirements: list = field(default_factory=list)
    skills_required: list = field(default_factory=list)
    experience_min: float = 0.0
    experience_max: float = 1.0
    salary_min_lpa: Optional[float] = None
    salary_max_lpa: Optional[float] = None
    remote: bool = False
    job_type: str = "full_time"
    posted_at: Optional[datetime] = None
    external_id: str = ""
    company_logo: Optional[str] = None


UA = UserAgent()

DELAYS = {
    "short": (1.0, 3.0),
    "medium": (3.0, 7.0),
    "long": (7.0, 15.0),
}


async def random_delay(level: str = "short"):
    low, high = DELAYS.get(level, DELAYS["short"])
    await asyncio.sleep(random.uniform(low, high))


def get_random_headers() -> Dict[str, str]:
    return {
        "User-Agent": UA.random,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "Connection": "keep-alive",
        "DNT": "1",
        "Upgrade-Insecure-Requests": "1",
    }


class BaseScraper:
    """Base class for all job scrapers"""

    platform_name: str = "unknown"

    FRESHER_KEYWORDS = [
        "fresher", "fresh graduate", "entry level", "0-1 years",
        "0 to 1 year", "junior", "trainee", "graduate engineer",
        "campus hire", "internship", "new grad",
    ]

    SEARCH_TERMS = [
        "SDE 1 fresher",
        "Software Engineer fresher",
        "Backend Developer fresher",
        "AI Engineer fresher",
        "GenAI Engineer",
        "Python Developer fresher",
        "Full Stack Developer fresher",
        "Cybersecurity Analyst fresher",
        "Graduate Engineer Trainee",
        "Junior Software Engineer",
    ]

    def __init__(self):
        self.client = httpx.AsyncClient(
            timeout=30.0,
            follow_redirects=True,
            headers=get_random_headers(),
        )

    async def __aenter__(self):
        return self

    async def __aexit__(self, *args):
        await self.client.aclose()

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
    async def fetch(self, url: str, **kwargs) -> Optional[str]:
        """Fetch URL with retry logic and anti-block measures"""
        try:
            self.client.headers.update(get_random_headers())
            await random_delay("short")
            response = await self.client.get(url, **kwargs)
            response.raise_for_status()
            return response.text
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 429:
                logger.warning(f"Rate limited on {url}, waiting...")
                await random_delay("long")
                raise
            logger.error(f"HTTP error fetching {url}: {e}")
            raise
        except Exception as e:
            logger.error(f"Error fetching {url}: {e}")
            raise

    def parse_salary_inr(self, salary_text: str) -> tuple[Optional[float], Optional[float]]:
        """Parse salary string into min/max LPA"""
        if not salary_text:
            return None, None

        import re
        salary_text = salary_text.lower().replace(",", "")

        # Remove currency symbols
        salary_text = re.sub(r"[₹$€£]", "", salary_text)

        # Find numbers
        nums = re.findall(r"\d+(?:\.\d+)?", salary_text)
        if not nums:
            return None, None

        nums = [float(n) for n in nums]

        # Convert to LPA if in thousands or monthly
        if "lakh" in salary_text or "lpa" in salary_text or "l/a" in salary_text:
            pass  # already in LPA
        elif "month" in salary_text or "monthly" in salary_text:
            nums = [n * 12 / 100000 for n in nums]  # monthly to LPA
        elif max(nums) > 1000:
            nums = [n / 100000 for n in nums]  # raw to LPA

        if len(nums) == 1:
            return nums[0], nums[0] * 1.3
        return min(nums[:2]), max(nums[:2])

    def extract_skills(self, text: str) -> list[str]:
        """Extract skills from job description"""
        SKILL_KEYWORDS = [
            "python", "javascript", "typescript", "java", "golang", "rust", "c++",
            "react", "nextjs", "nodejs", "django", "fastapi", "flask", "spring",
            "postgresql", "mongodb", "redis", "mysql", "elasticsearch",
            "docker", "kubernetes", "aws", "gcp", "azure", "terraform",
            "git", "linux", "rest api", "graphql",
            "machine learning", "deep learning", "nlp", "llm", "langchain",
            "tensorflow", "pytorch", "scikit-learn", "pandas", "numpy",
            "data structures", "algorithms", "system design",
            "sql", "nosql", "microservices", "ci/cd",
        ]
        text_lower = text.lower()
        return [skill for skill in SKILL_KEYWORDS if skill in text_lower]

    def is_fresher_job(self, title: str, description: str) -> bool:
        """Check if job is suitable for freshers"""
        combined = f"{title} {description}".lower()
        return any(keyword in combined for keyword in self.FRESHER_KEYWORDS)

    async def scrape(self) -> list[ScrapedJob]:
        """Override in subclass"""
        raise NotImplementedError
