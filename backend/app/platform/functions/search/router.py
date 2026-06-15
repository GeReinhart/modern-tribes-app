from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel

from app.platform.core.database import get_database
from app.platform.core.authorization.models import PermissionEnum
from app.platform.core.authentication.router import get_current_user
from app.platform.core.authorization.router import require_any_permission_decorator
from app.platform.core.authorization.permissions import get_user_permissions
from app.platform.functions.search import repository as search_repository

router = APIRouter(prefix="/search", tags=["platform_search"])


class SearchResult(BaseModel):
    entity_id: str
    entity_type: str
    headline: str
    content_summary: Optional[str]
    routing_path: str
    tribe_name: Optional[str]
    project_name: Optional[str]


@router.get("/", response_model=list[SearchResult])
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def search(
    q: str = Query(..., min_length=2, description="Full-text search query"),
    current_user: dict = Depends(get_current_user),
):
    """Full-text search across accessible entities.

    **Permissions:** admin | can_access_attached_tribes
    """
    if not q.strip():
        return []

    pool = get_database()
    user_id = str(current_user["id"])
    user_permissions = await get_user_permissions(pool, user_id)

    try:
        if PermissionEnum.ADMIN in user_permissions:
            rows = await search_repository.search_admin(pool, q)
        else:
            rows = await search_repository.search_user(pool, user_id, q)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid search query",
        )

    return [
        SearchResult(
            entity_id=r["entity_id"],
            entity_type=r["entity_type"],
            headline=r["headline"],
            content_summary=r["content_summary"],
            routing_path=r["routing_path"],
            tribe_name=r["tribe_name"],
            project_name=r["project_name"],
        )
        for r in rows
    ]
