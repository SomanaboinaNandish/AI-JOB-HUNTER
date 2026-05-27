"""Job Match model - stores AI resume-job match scores"""
from datetime import datetime
from typing import List, Optional
from beanie import Document
from pydantic import Field
import pymongo


class JobMatch(Document):
    user_id: str
    job_id: str
    resume_id: str

    match_score: float  # 0.0 to 1.0
    match_percentage: int  # 0 to 100

    matched_skills: List[str] = []
    missing_skills: List[str] = []
    improvement_suggestions: List[str] = []

    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "job_matches"
        indexes = [
            pymongo.IndexModel([("user_id", pymongo.ASCENDING), ("job_id", pymongo.ASCENDING)], unique=True),
            pymongo.IndexModel([("match_score", pymongo.DESCENDING)]),
        ]
