from fastapi import APIRouter, Depends, Query, status
from typing import List, Optional

from ..auth.authentification import get_current_user
from ..auth.authorization import require_any_permission_decorator
from ...models.auth.auth import PermissionEnum
from ...models.app.publication import PublicationAdminItem
from ...core.database import get_database
from ...services import publication_service

router = APIRouter(prefix="/publications", tags=["app_publications"])


@router.get("/", response_model=List[PublicationAdminItem])
@require_any_permission_decorator(PermissionEnum.ADMIN)
async def list_publications_admin(
    q: Optional[str] = Query(None),
    tribe_id: Optional[str] = Query(None),
    project_id: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_user),
):
    pool = get_database()
    return await publication_service.list_publications_admin(pool, q, tribe_id, project_id)


@router.delete("/{publication_id}", status_code=status.HTTP_204_NO_CONTENT)
@require_any_permission_decorator(PermissionEnum.ADMIN)
async def delete_publication(
    publication_id: str,
    current_user: dict = Depends(get_current_user),
):
    pool = get_database()
    await publication_service.admin_unpublish(publication_id, pool)
    return None
