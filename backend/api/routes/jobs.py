"""
Jobs API Routes
- List, filter, save, apply, search jobs
"""

from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel

from models.job import Job
from models.application import Application
from models.job_match import JobMatch
from models.search_history import SearchHistory
from api.routes.auth import get_current_user
from models.user import User

router = APIRouter()


# ── Schemas ───────────────────────────────────────────────────

class JobResponse(BaseModel):
    id: str
    title: str
    company: str
    company_logo: Optional[str]
    location: str
    remote: bool
    salary_min_lpa: Optional[float]
    salary_max_lpa: Optional[float]
    salary_display: str
    salary_estimated: bool
    experience_min: float
    experience_max: float
    skills_required: List[str]
    apply_url: str
    source_platform: str
    posted_at: Optional[datetime]
    scraped_at: datetime
    is_active: bool
    job_type: str
    fresher_friendly: bool
    match_score: Optional[int] = None
    is_saved: bool = False
    application_status: Optional[str] = None


# ── Endpoints ─────────────────────────────────────────────────

@router.get("", response_model=dict)
async def list_jobs(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    platform: Optional[str] = None,
    remote: Optional[bool] = None,
    min_salary: Optional[float] = None,
    max_experience: Optional[float] = None,
    job_type: Optional[str] = None,
    skills: Optional[str] = None,  # comma-separated
    sort_by: str = "scraped_at",  # scraped_at | salary | match_score
    current_user: User = Depends(get_current_user),
):
    """Get paginated job feed with filters"""
    query_filters = {Job.is_active: True}

    if platform:
        query_filters[Job.source_platform] = platform
    if remote is not None:
        query_filters[Job.remote] = remote
    if min_salary:
        query_filters[Job.salary_min_lpa] = {"$gte": min_salary}
    else:
        query_filters[Job.salary_min_lpa] = {"$gte": current_user.min_salary_lpa}
    if max_experience is not None:
        query_filters[Job.experience_max] = {"$lte": max_experience}
    if job_type:
        query_filters[Job.job_type] = job_type

    sort_field = Job.scraped_at if sort_by == "scraped_at" else Job.salary_min_lpa
    total = await Job.find(query_filters).count()
    jobs = await Job.find(query_filters).sort(-sort_field).skip((page - 1) * per_page).limit(per_page).to_list()

    # Enrich with match scores and application status
    job_ids = [str(j.id) for j in jobs]
    user_id = str(current_user.id)

    matches = await JobMatch.find(
        JobMatch.user_id == user_id,
        {"job_id": {"$in": job_ids}}
    ).to_list()
    match_map = {m.job_id: m.match_percentage for m in matches}

    applications = await Application.find(
        Application.user_id == user_id,
        {"job_id": {"$in": job_ids}}
    ).to_list()
    app_map = {a.job_id: a.status for a in applications}
    saved_ids = {a.job_id for a in applications if a.status == "saved"}

    result = []
    for job in jobs:
        jid = str(job.id)
        result.append(JobResponse(
            id=jid,
            title=job.title,
            company=job.company,
            company_logo=job.company_logo,
            location=job.location,
            remote=job.remote,
            salary_min_lpa=job.salary_min_lpa,
            salary_max_lpa=job.salary_max_lpa,
            salary_display=job.salary_display,
            salary_estimated=job.salary_estimated,
            experience_min=job.experience_min,
            experience_max=job.experience_max,
            skills_required=job.skills_required,
            apply_url=job.apply_url,
            source_platform=job.source_platform,
            posted_at=job.posted_at,
            scraped_at=job.scraped_at,
            is_active=job.is_active,
            job_type=job.job_type,
            fresher_friendly=job.fresher_friendly,
            match_score=match_map.get(jid),
            is_saved=jid in saved_ids,
            application_status=app_map.get(jid),
        ).model_dump())

    return {
        "jobs": result,
        "total": total,
        "page": page,
        "per_page": per_page,
        "pages": (total + per_page - 1) // per_page,
    }


@router.get("/{job_id}", response_model=dict)
async def get_job(
    job_id: str,
    current_user: User = Depends(get_current_user),
):
    job = await Job.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    match = await JobMatch.find_one(
        JobMatch.user_id == str(current_user.id),
        JobMatch.job_id == job_id,
    )
    app = await Application.find_one(
        Application.user_id == str(current_user.id),
        Application.job_id == job_id,
    )

    return {
        "job": job.model_dump(),
        "match": match.model_dump() if match else None,
        "application": app.model_dump() if app else None,
    }


@router.post("/{job_id}/save")
async def save_job(job_id: str, current_user: User = Depends(get_current_user)):
    job = await Job.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    existing = await Application.find_one(
        Application.user_id == str(current_user.id),
        Application.job_id == job_id,
    )
    if existing:
        return {"message": "Already saved", "status": existing.status}

    app = Application(user_id=str(current_user.id), job_id=job_id, status="saved")
    await app.insert()

    current_user.jobs_saved += 1
    await current_user.save()

    return {"message": "Job saved", "application_id": str(app.id)}


@router.post("/{job_id}/apply")
async def mark_applied(job_id: str, current_user: User = Depends(get_current_user)):
    app = await Application.find_one(
        Application.user_id == str(current_user.id),
        Application.job_id == job_id,
    )
    if app:
        app.status = "applied"
        app.applied_at = datetime.utcnow()
        app.last_updated = datetime.utcnow()
        await app.save()
    else:
        app = Application(
            user_id=str(current_user.id),
            job_id=job_id,
            status="applied",
            applied_at=datetime.utcnow(),
        )
        await app.insert()
        current_user.jobs_applied += 1
        await current_user.save()

    return {"message": "Application tracked", "status": "applied"}


@router.get("/saved/list")
async def get_saved_jobs(current_user: User = Depends(get_current_user)):
    apps = await Application.find(
        Application.user_id == str(current_user.id),
        Application.status == "saved",
    ).to_list()
    job_ids = [a.job_id for a in apps]
    jobs = await Job.find({"_id": {"$in": job_ids}}).to_list()
    return {"jobs": [j.model_dump() for j in jobs]}


@router.get("/applied/list")
async def get_applied_jobs(current_user: User = Depends(get_current_user)):
    apps = await Application.find(
        Application.user_id == str(current_user.id),
        Application.status != "saved",
    ).sort(-Application.last_updated).to_list()
    return {"applications": [a.model_dump() for a in apps]}
