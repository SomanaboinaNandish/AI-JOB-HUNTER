"""Notification model"""
from datetime import datetime
from typing import Optional
from beanie import Document
from pydantic import Field
import pymongo


class Notification(Document):
    user_id: str
    type: str  # new_job | match_alert | system | weekly_digest
    title: str
    message: str
    job_id: Optional[str] = None
    is_read: bool = False
    channel: str = "in_app"  # in_app | telegram | email
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "notifications"
        indexes = [
            pymongo.IndexModel([("user_id", pymongo.ASCENDING), ("is_read", pymongo.ASCENDING)]),
            pymongo.IndexModel([("created_at", pymongo.DESCENDING)]),
        ]
