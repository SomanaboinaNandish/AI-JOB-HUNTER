"""Resume model"""
from datetime import datetime
from typing import Optional, List
from beanie import Document
from pydantic import Field
from bson import ObjectId
import pymongo


class Resume(Document):
    user_id: str
    filename: str
    file_path: str
    file_size: int = 0

    # Parsed content
    raw_text: str = ""
    skills: List[str] = []
    education: List[dict] = []
    experience: List[dict] = []
    certifications: List[str] = []
    projects: List[dict] = []

    # AI analysis
    embedding: Optional[List[float]] = None
    summary: str = ""
    strengths: List[str] = []
    improvement_areas: List[str] = []
    suggested_roles: List[str] = []

    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "resumes"
        indexes = [
            pymongo.IndexModel([("user_id", pymongo.ASCENDING)]),
        ]
