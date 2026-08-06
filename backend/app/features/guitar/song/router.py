from fastapi import APIRouter, Depends, status

from app.platform.core.authentication.router import get_current_user
from app.platform.core.authorization.router import require_any_permission_decorator
from app.platform.core.authorization.models import PermissionEnum
from app.platform.core.database import get_database
from app.platform.core.utils.db_helpers import resolve_url_param_id
from app.features.guitar.song import service as song_service
from app.features.guitar.song.models import (
    GuitarSongCreate,
    GuitarSongDetailResponse,
    GuitarSongResponse,
    GuitarSongUpdate,
)

router = APIRouter(prefix="/guitar-songs", tags=["features_guitar_song"])


@router.get("/projects/{project_id}/songs", response_model=list[GuitarSongResponse])
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def list_songs(project_id: str, current_user: dict = Depends(get_current_user)):
    """List the songs in a project's shared songbook.

    **Permissions:** admin | can_access_attached_tribes
    **Project access:** minimum position ≥ guest
    """
    pool = get_database()
    project_id = await resolve_url_param_id(pool, "projects", project_id)
    return await song_service.list_songs(pool, project_id, current_user)


@router.post(
    "/projects/{project_id}/songs", response_model=GuitarSongResponse, status_code=status.HTTP_201_CREATED
)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def create_song(
    project_id: str, data: GuitarSongCreate, current_user: dict = Depends(get_current_user)
):
    """Add a song to the project's shared songbook.

    **Permissions:** admin | can_access_attached_tribes
    **Project access:** minimum position ≥ member
    """
    pool = get_database()
    project_id = await resolve_url_param_id(pool, "projects", project_id)
    return await song_service.create_song(pool, project_id, data, current_user)


@router.get("/songs/{song_id}", response_model=GuitarSongDetailResponse)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def get_song(song_id: str, current_user: dict = Depends(get_current_user)):
    """Get a song with its ordered chord progression.

    **Permissions:** admin | can_access_attached_tribes
    **Project access:** minimum position ≥ guest
    """
    pool = get_database()
    song_id = await resolve_url_param_id(pool, "guitar_songs", song_id)
    return await song_service.get_song(pool, song_id, current_user)


@router.patch("/songs/{song_id}", response_model=GuitarSongResponse)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def update_song(song_id: str, data: GuitarSongUpdate, current_user: dict = Depends(get_current_user)):
    """Update a song's title, author, tempo or time signature.

    **Permissions:** admin | can_access_attached_tribes
    **Project access:** minimum position ≥ member
    """
    pool = get_database()
    song_id = await resolve_url_param_id(pool, "guitar_songs", song_id)
    return await song_service.update_song(pool, song_id, data, current_user)


@router.post(
    "/songs/{song_id}/duplicate", response_model=GuitarSongDetailResponse, status_code=status.HTTP_201_CREATED
)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def duplicate_song(song_id: str, current_user: dict = Depends(get_current_user)):
    """Copy a whole song -- description, chords, sections, videos, labels and layout -- into a
    new song titled '<original> - COPIE'.

    **Permissions:** admin | can_access_attached_tribes
    **Project access:** minimum position ≥ member
    """
    pool = get_database()
    song_id = await resolve_url_param_id(pool, "guitar_songs", song_id)
    return await song_service.duplicate_song(pool, song_id, current_user)


@router.delete("/songs/{song_id}", status_code=status.HTTP_204_NO_CONTENT)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def archive_song(song_id: str, current_user: dict = Depends(get_current_user)):
    """Archive a song.

    **Permissions:** admin | can_access_attached_tribes
    **Project access:** minimum position ≥ manager
    """
    pool = get_database()
    song_id = await resolve_url_param_id(pool, "guitar_songs", song_id)
    await song_service.archive_song(pool, song_id, current_user)
