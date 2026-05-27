"""Search history model"""
from datetime import datetime
from typing import Optional
from beanie import Document
from pydantic import Field
import pymongo


class SearchHistory(Document):
    user_id: str
    query: str
    filters: dict = {}
    results_count: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "search_history"
        indexes = [
            pymongo.IndexModel([("user_id", pymongo.ASCENDING)]),
            pymongo.IndexModel([("created_at", pymongo.DESCENDING)]),
        ]
