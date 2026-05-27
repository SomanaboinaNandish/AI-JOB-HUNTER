"""
AI Job Hunter - FastAPI Backend
Main application entry point
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from loguru import logger
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from api.middleware.logging import RequestLoggingMiddleware
from api.routes import auth, jobs, resume, notifications, analytics, agents, search
from database.connection import connect_db, close_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup/shutdown"""
    logger.info("🚀 Starting AI Job Hunter API...")

    await connect_db()

    logger.info("✅ Database connected")

    yield

    logger.info("🛑 Shutting down...")

    await close_db()


# Rate limiter
limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title="AI Job Hunter API",
    description="Autonomous AI-powered job hunting platform for freshers",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ─────────────────────────────────────────────────────────────
# CORS
# ─────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─────────────────────────────────────────────────────────────
# Middleware
# ─────────────────────────────────────────────────────────────
app.state.limiter = limiter

app.add_exception_handler(
    RateLimitExceeded,
    _rate_limit_exceeded_handler
)

app.add_middleware(
    GZipMiddleware,
    minimum_size=1000
)

app.add_middleware(
    RequestLoggingMiddleware
)

# ─────────────────────────────────────────────────────────────
# Routes
# ─────────────────────────────────────────────────────────────
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])

app.include_router(jobs.router, prefix="/jobs", tags=["Jobs"])

app.include_router(resume.router, prefix="/resume", tags=["Resume"])

app.include_router(
    notifications.router,
    prefix="/notifications",
    tags=["Notifications"]
)

app.include_router(
    analytics.router,
    prefix="/analytics",
    tags=["Analytics"]
)

app.include_router(
    agents.router,
    prefix="/agents",
    tags=["AI Agents"]
)

app.include_router(
    search.router,
    prefix="/search",
    tags=["Search"]
)


@app.get("/health", tags=["Health"])
async def health_check():
    return {
        "status": "healthy",
        "service": "AI Job Hunter API",
        "version": "1.0.0"
    }