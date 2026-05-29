from typing import List, Optional

from fastapi import APIRouter, Depends, Query, status

from app.platform.core.database import get_database
from app.platform.functions.publications.models import PublicationAdminItem
from app.platform.core.authorization.models import PermissionEnum
from app.platform.core.authentication.router import get_current_user
from app.platform.core.authorization.router import require_any_permission_decorator
from app.platform.functions.publications import service as publication_service
from app.platform.core.utils.db_helpers import resolve_url_param_id

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
    publication_id = await resolve_url_param_id(pool, "publications", publication_id)
    await publication_service.admin_unpublish(publication_id, pool)
    return None
