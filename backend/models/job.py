"""
Job MongoDB Model
"""

from datetime import datetime
from typing import Optional, List
from beanie import Document, Indexed
from pydantic import Field, HttpUrl
import pymongo


class Job(Document):
    # Core info
    title: str
    company: str
    company_logo: Optional[str] = None
    location: str
    remote: bool = False
    india_based: bool = True

    # Details
    description: str = ""
    requirements: List[str] = []
    skills_required: List[str] = []
    experience_min: float = 0.0
    experience_max: float = 1.0

    # Salary
    salary_min_lpa: Optional[float] = None
    salary_max_lpa: Optional[float] = None
    salary_estimated: bool = False
    salary_display: str = ""  # e.g. "₹8–12 LPA"

    # Links
    apply_url: str
    source_url: str
    source_platform: str  # linkedin | wellfound | naukri | etc.
    external_id: str = ""  # platform-specific job id

    # Freshness
    posted_at: Optional[datetime] = None
    scraped_at: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = True

    # AI metadata
    embedding: Optional[List[float]] = None
    company_reputation_score: Optional[float] = None
    fresher_friendly: bool = True
    job_type: str = "full_time"  # full_time | internship | contract

    class Settings:
        name = "jobs"
        indexes = [
            pymongo.IndexModel([("source_platform", pymongo.ASCENDING), ("external_id", pymongo.ASCENDING)], unique=True),
            pymongo.IndexModel([("scraped_at", pymongo.DESCENDING)]),
            pymongo.IndexModel([("salary_min_lpa", pymongo.ASCENDING)]),
            pymongo.IndexModel([("is_active", pymongo.ASCENDING)]),
            pymongo.IndexModel([("title", pymongo.TEXT), ("description", pymongo.TEXT), ("skills_required", pymongo.TEXT)]),
        ]
