"""
User MongoDB Model using Beanie ODM
"""

from datetime import datetime
from typing import Optional, List
from beanie import Document, Indexed
from pydantic import EmailStr, Field
import pymongo


class User(Document):
    email: Indexed(EmailStr, unique=True)
    full_name: str
    hashed_password: Optional[str] = None
    google_id: Optional[str] = None
    avatar_url: Optional[str] = None
    is_active: bool = True
    is_verified: bool = False

    # Notification preferences
    telegram_chat_id: Optional[str] = None
    email_notifications: bool = True
    telegram_notifications: bool = False
    notification_frequency: str = "instant"  # instant | daily | weekly

    # Job preferences
    preferred_roles: List[str] = []
    preferred_locations: List[str] = []
    min_salary_lpa: float = 8.0
    remote_only: bool = False

    # Stats
    jobs_saved: int = 0
    jobs_applied: int = 0
    resume_uploaded: bool = False

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    last_login: Optional[datetime] = None

    class Settings:
        name = "users"
        indexes = [
            pymongo.IndexModel([("email", pymongo.ASCENDING)], unique=True),
            pymongo.IndexModel([("google_id", pymongo.ASCENDING)]),
        ]
