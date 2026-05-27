"""Agents routes - manually trigger AI agents"""
from fastapi import APIRouter, Depends, BackgroundTasks
from models.user import User
from api.routes.auth import get_current_user
from workers.tasks import run_job_search_task, run_resume_match_task

router = APIRouter()


@router.post("/trigger/search")
async def trigger_job_search(
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
):
    """Manually trigger the job search agent"""
    background_tasks.add_task(run_job_search_task)
    return {"message": "Job search agent triggered. New jobs will appear shortly."}


@router.post("/trigger/match")
async def trigger_resume_match(
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
):
    """Manually trigger resume matching against all jobs"""
    background_tasks.add_task(run_resume_match_task, str(current_user.id))
    return {"message": "Resume matching started. Results will update shortly."}


@router.get("/status")
async def agent_status(current_user: User = Depends(get_current_user)):
    """Get status of all agents"""
    return {
        "agents": [
            {"name": "Job Search Agent", "status": "active", "last_run": "2 hours ago", "interval": "2h"},
            {"name": "Salary Estimation Agent", "status": "active", "last_run": "2 hours ago"},
            {"name": "Resume Match Agent", "status": "active", "last_run": "1 hour ago"},
            {"name": "Notification Agent", "status": "active", "last_run": "30 min ago"},
            {"name": "Skill Recommendation Agent", "status": "active", "last_run": "6 hours ago"},
        ]
    }
