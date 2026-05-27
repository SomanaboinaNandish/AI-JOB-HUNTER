"""Analytics routes"""
from fastapi import APIRouter, Depends
from models.user import User
from models.application import Application
from models.job_match import JobMatch
from models.search_history import SearchHistory
from api.routes.auth import get_current_user

router = APIRouter()


@router.get("/dashboard")
async def get_dashboard_analytics(current_user: User = Depends(get_current_user)):
    user_id = str(current_user.id)

    # Application stats
    all_apps = await Application.find(Application.user_id == user_id).to_list()
    status_counts = {}
    for app in all_apps:
        status_counts[app.status] = status_counts.get(app.status, 0) + 1

    # Match stats
    matches = await JobMatch.find(JobMatch.user_id == user_id).sort(-JobMatch.match_score).limit(5).to_list()
    avg_match = sum(m.match_percentage for m in matches) / len(matches) if matches else 0

    # Search history
    recent_searches = await SearchHistory.find(
        SearchHistory.user_id == user_id
    ).sort(-SearchHistory.created_at).limit(10).to_list()

    return {
        "summary": {
            "jobs_saved": status_counts.get("saved", 0),
            "jobs_applied": status_counts.get("applied", 0),
            "interviewing": status_counts.get("interviewing", 0),
            "offers": status_counts.get("offered", 0),
            "avg_match_score": round(avg_match, 1),
        },
        "application_funnel": status_counts,
        "top_matches": [{"job_id": m.job_id, "score": m.match_percentage} for m in matches],
        "recent_searches": [s.query for s in recent_searches],
    }
