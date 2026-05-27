"""
MongoDB async connection using Motor + Beanie ODM
"""

from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from loguru import logger

from utils.config import settings
from models.user import User
from models.job import Job
from models.resume import Resume
from models.application import Application
from models.notification import Notification
from models.job_match import JobMatch
from models.search_history import SearchHistory

_client: AsyncIOMotorClient = None


async def connect_db():
    global _client
    _client = AsyncIOMotorClient(settings.MONGODB_URI)
    db = _client[settings.MONGODB_DB_NAME]

    await init_beanie(
        database=db,
        document_models=[
            User,
            Job,
            Resume,
            Application,
            Notification,
            JobMatch,
            SearchHistory,
        ],
    )
    logger.info(f"✅ Connected to MongoDB: {settings.MONGODB_DB_NAME}")


async def close_db():
    global _client
    if _client:
        _client.close()
        logger.info("MongoDB connection closed")


def get_db():
    return _client[settings.MONGODB_DB_NAME]
