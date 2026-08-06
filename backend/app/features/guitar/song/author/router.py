from fastapi import APIRouter, Depends

from app.platform.core.authentication.router import get_current_user
from app.platform.core.authorization.router import require_any_permission_decorator
from app.platform.core.authorization.models import PermissionEnum
from app.platform.core.database import get_database
from app.platform.core.utils.db_helpers import resolve_url_param_id
from app.features.guitar.song.author import service as author_service
from app.features.guitar.song.author.models import GuitarSongAuthorResponse

router = APIRouter(prefix="/guitar-song-authors", tags=["features_guitar_song_authors"])


@router.get("/projects/{project_id}", response_model=list[GuitarSongAuthorResponse])
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def list_authors(project_id: str, current_user: dict = Depends(get_current_user)):
    """List the project's shared songbook authors, for use as an autocomplete suggestion list.

    **Permissions:** admin | can_access_attached_tribes
    **Project access:** minimum position ≥ guest
    """
    pool = get_database()
    project_id = await resolve_url_param_id(pool, "projects", project_id)
    return await author_service.list_authors(pool, project_id, current_user)
