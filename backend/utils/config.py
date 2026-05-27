"""
Application configuration using Pydantic Settings
"""

from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    # App
    APP_ENV: str = "development"
    APP_PORT: int = 8000
    FRONTEND_URL: str = "http://localhost:3000"
    SECRET_KEY: str = "change-me"

    # Database
    MONGODB_URI: str = "mongodb://localhost:27017/aijobhunter"
    MONGODB_DB_NAME: str = "aijobhunter"

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    CELERY_BROKER_URL: str = "redis://localhost:6379/1"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/2"

    # Auth
    JWT_SECRET: str = "jwt-secret"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 10080

    GOOGLE_CLIENT_ID: Optional[str] = None
    GOOGLE_CLIENT_SECRET: Optional[str] = None
    GOOGLE_REDIRECT_URI: str = "http://localhost:8000/auth/google/callback"

    # OpenAI / Gemini
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4o"
    OPENAI_EMBEDDING_MODEL: str = "text-embedding-3-small"
    OPENAI_BASE_URL: Optional[str] = None
    GEMINI_API_KEY: str = ""

    # Telegram
    TELEGRAM_BOT_TOKEN: Optional[str] = None
    TELEGRAM_CHAT_ID: Optional[str] = None

    # Email
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    EMAILS_FROM_NAME: str = "AI Job Hunter"
    EMAILS_FROM_EMAIL: str = "noreply@aijobhunter.com"

    # Scraping
    SCRAPE_INTERVAL_HOURS: int = 2
    MAX_CONCURRENT_SCRAPERS: int = 5
    SCRAPE_TIMEOUT_SECONDS: int = 30
    PLAYWRIGHT_HEADLESS: bool = True

    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 60

    # Filtering
    MIN_SALARY_LPA: float = 8.0
    MAX_EXPERIENCE_YEARS: int = 1


settings = Settings()
