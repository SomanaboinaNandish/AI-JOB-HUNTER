import os
import sys
import asyncio
from typing import Optional
from mcp.server.fastmcp import FastMCP
from dotenv import load_dotenv

# 1. Setup paths to import from backend
# Resolve the path to backend directory (parent of mcp-server)
base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
backend_dir = os.path.join(base_dir, "backend")
sys.path.append(backend_dir)

# Load environment variables from backend/.env
env_path = os.path.join(backend_dir, ".env")
load_dotenv(env_path)

# Initialize FastMCP Server
mcp = FastMCP("AI Job Hunter")

# 2. Database Connection Helper
db_initialized = False

async def init_db_once():
    global db_initialized
    if not db_initialized:
        # Import Beanie database connection on-demand
        from database.connection import connect_db
        await connect_db()
        db_initialized = True

# 3. Define Tools

@mcp.tool()
async def search_local_jobs(query: str, limit: int = 5) -> str:
    """
    Search for job listings in the local MongoDB database matching a keyword.
    
    Args:
        query: The search term (e.g., 'React', 'FastAPI', 'Python').
        limit: Maximum number of search results to return.
    """
    await init_db_once()
    from models.job import Job

    # Search using regex across title, company, skills, or description
    jobs = await Job.find({
        "is_active": True,
        "$or": [
            {"title": {"$regex": query, "$options": "i"}},
            {"company": {"$regex": query, "$options": "i"}},
            {"skills_required": {"$regex": query, "$options": "i"}},
            {"description": {"$regex": query, "$options": "i"}}
        ]
    }).sort("-scraped_at").limit(limit).to_list()

    if not jobs:
        return f"No jobs found matching: '{query}'"

    results = []
    for job in jobs:
        results.append(
            f"Job ID: {job.id}\n"
            f"Title: {job.title}\n"
            f"Company: {job.company}\n"
            f"Location: {job.location} (Remote: {job.remote})\n"
            f"Salary: {job.salary_display if job.salary_display else 'Not specified'}\n"
            f"Skills: {', '.join(job.skills_required)}\n"
            f"Source Platform: {job.source_platform}\n"
            f"Apply Link: {job.apply_url}\n"
            f"----------------------------------------"
        )
    
    return "\n".join(results)

@mcp.tool()
async def get_application_stats(user_email: str) -> str:
    """
    Retrieve application metrics (counts of saved, applied, interviewing, offered, rejected) for a user.
    
    Args:
        user_email: The email address of the registered user.
    """
    await init_db_once()
    from models.user import User
    from models.application import Application

    user = await User.find_one(User.email == user_email)
    if not user:
        return f"Error: User not found with email '{user_email}'"

    user_id = str(user.id)
    apps = await Application.find(Application.user_id == user_id).to_list()

    if not apps:
        return f"User '{user_email}' has no applications tracked."

    # Aggregate counts
    stats = {}
    for app in apps:
        status = app.status
        stats[status] = stats.get(status, 0) + 1

    summary = [f"Application Stats for {user_email}:"]
    for status, count in stats.items():
        summary.append(f"- {status.capitalize()}: {count}")
    
    summary.append(f"Total Tracked Applications: {len(apps)}")
    return "\n".join(summary)

@mcp.tool()
async def trigger_scrapers_async() -> str:
    """
    Manually dispatch a Celery task to run all job scrapers (Lever, Greenhouse, RemoteOK, Wellfound) in the background.
    """
    await init_db_once()
    from workers.tasks import scrape_all_jobs
    
    scrape_all_jobs.delay()
    return "Background job search and scraping task successfully dispatched to Celery."

@mcp.tool()
async def run_scrapers_directly() -> str:
    """
    Directly run all web scrapers sequentially in the foreground (Blocking operation, returns results).
    """
    await init_db_once()
    from scrapers.orchestrator import run_all_scrapers
    
    result = await run_all_scrapers()
    return f"Foreground scraping completed. Results:\n{result}"

@mcp.tool()
async def match_resume_to_job(user_email: str, job_id: str) -> str:
    """
    Evaluate alignment between a user's uploaded resume and a specific job listing using AI matching.
    
    Args:
        user_email: The email address of the user.
        job_id: The ID of the target job listing.
    """
    await init_db_once()
    from models.user import User
    from services.resume_service import ResumeService

    user = await User.find_one(User.email == user_email)
    if not user:
        return f"Error: User not found with email '{user_email}'"

    service = ResumeService()
    try:
        result = await service.match_job(str(user.id), job_id)
        # Result includes match score and evaluation comments
        return f"Evaluation Score details:\n{result}"
    except Exception as e:
        return f"AI evaluation failed: {str(e)}"

@mcp.tool()
async def generate_cover_letter(user_email: str, job_id: str) -> str:
    """
    Generate an AI cover letter tailored to a job using the user's uploaded resume.
    
    Args:
        user_email: The email address of the user.
        job_id: The ID of the target job listing.
    """
    await init_db_once()
    from models.user import User
    from services.resume_service import ResumeService

    user = await User.find_one(User.email == user_email)
    if not user:
        return f"Error: User not found with email '{user_email}'"

    service = ResumeService()
    try:
        result = await service.generate_cover_letter(str(user.id), job_id)
        return f"Generated AI Cover Letter:\n\n{result}"
    except Exception as e:
        return f"AI Cover Letter generation failed: {str(e)}"

# 4. Entrypoint
if __name__ == "__main__":
    mcp.run()
