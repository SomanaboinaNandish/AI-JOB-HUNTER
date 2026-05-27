"""Application tracking model"""
from datetime import datetime
from typing import Optional, List
from beanie import Document
from pydantic import Field
import pymongo


class Application(Document):
    user_id: str
    job_id: str

    status: str = "saved"  # saved | applied | interviewing | offered | rejected | withdrawn
    notes: str = ""
    applied_at: Optional[datetime] = None
    last_updated: datetime = Field(default_factory=datetime.utcnow)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    # AI-generated cover letter
    cover_letter: Optional[str] = None
    resume_version: Optional[str] = None

    class Settings:
        name = "applications"
        indexes = [
            pymongo.IndexModel([("user_id", pymongo.ASCENDING), ("job_id", pymongo.ASCENDING)], unique=True),
            pymongo.IndexModel([("status", pymongo.ASCENDING)]),
        ]
