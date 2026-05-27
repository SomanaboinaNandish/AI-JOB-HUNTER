"""Search routes - semantic + natural language job search"""
from typing import Optional
from fastapi import APIRouter, Depends, Query
from models.user import User
from models.search_history import SearchHistory
from api.routes.auth import get_current_user
from services.search_service import SearchService

router = APIRouter()
search_service = SearchService()


@router.get("")
async def semantic_search(
    q: str = Query(..., description="Natural language search query"),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=50),
    current_user: User = Depends(get_current_user),
):
    """
    Semantic search with natural language support.
    Example: 'Find remote AI fresher jobs above 10 LPA'
    """
    results = await search_service.semantic_search(
        query=q,
        user_id=str(current_user.id),
        page=page,
        per_page=per_page,
    )

    # Log search history
    history = SearchHistory(
        user_id=str(current_user.id),
        query=q,
        results_count=results.get("total", 0),
    )
    await history.insert()

    return results


@router.get("/suggestions")
async def search_suggestions(
    q: str = Query(...),
    current_user: User = Depends(get_current_user),
):
    """Auto-complete suggestions"""
    return await search_service.get_suggestions(q)
