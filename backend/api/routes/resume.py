"""
Resume API Routes
- Upload PDF
- Parse & embed
- AI match against jobs
- Cover letter generation
"""

import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks
from fastapi.responses import JSONResponse

from models.user import User
from models.resume import Resume
from api.routes.auth import get_current_user
from services.resume_service import ResumeService

router = APIRouter()
resume_service = ResumeService()

UPLOAD_DIR = "uploads/resumes"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/upload")
async def upload_resume(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    """Upload resume PDF and trigger async processing"""
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted")

    if file.size and file.size > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 5MB)")

    # Save file
    filename = f"{uuid.uuid4()}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, filename)

    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)

    # Create resume record
    resume = Resume(
        user_id=str(current_user.id),
        filename=file.filename,
        file_path=file_path,
        file_size=len(content),
    )
    await resume.insert()

    # Update user
    current_user.resume_uploaded = True
    await current_user.save()

    # Trigger background processing
    background_tasks.add_task(resume_service.process_resume, str(resume.id), file_path)

    return {
        "message": "Resume uploaded successfully. Processing in background.",
        "resume_id": str(resume.id),
    }


@router.get("/me")
async def get_my_resume(current_user: User = Depends(get_current_user)):
    resume = await Resume.find_one(
        Resume.user_id == str(current_user.id),
        Resume.is_active == True,
    )
    if not resume:
        raise HTTPException(status_code=404, detail="No resume found. Please upload one.")
    return resume.model_dump()


@router.post("/match/{job_id}")
async def match_resume_to_job(
    job_id: str,
    current_user: User = Depends(get_current_user),
):
    """Calculate match score between user's resume and a specific job"""
    result = await resume_service.match_job(str(current_user.id), job_id)
    return result


@router.post("/cover-letter/{job_id}")
async def generate_cover_letter(
    job_id: str,
    current_user: User = Depends(get_current_user),
):
    """Generate AI cover letter for a job"""
    result = await resume_service.generate_cover_letter(str(current_user.id), job_id)
    return result


@router.get("/analysis")
async def get_resume_analysis(current_user: User = Depends(get_current_user)):
    """Get AI analysis of user's resume"""
    resume = await Resume.find_one(
        Resume.user_id == str(current_user.id),
        Resume.is_active == True,
    )
    if not resume:
        raise HTTPException(status_code=404, detail="No resume found")

    return {
        "skills": resume.skills,
        "strengths": resume.strengths,
        "improvement_areas": resume.improvement_areas,
        "suggested_roles": resume.suggested_roles,
        "summary": resume.summary,
    }
