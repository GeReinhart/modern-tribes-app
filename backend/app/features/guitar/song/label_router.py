from fastapi import APIRouter, Depends, status

from app.platform.core.authentication.router import get_current_user
from app.platform.core.authorization.router import require_any_permission_decorator
from app.platform.core.authorization.models import PermissionEnum
from app.platform.core.database import get_database
from app.platform.core.utils.db_helpers import resolve_url_param_id
from app.features.guitar.song import label_service
from app.features.guitar.song.label_models import GuitarSongLabel, GuitarSongLabelCreate, GuitarSongLabelUpdate

router = APIRouter(prefix="/guitar-songs", tags=["features_guitar_song_labels"])


@router.get("/projects/{project_id}/song-labels", response_model=list[GuitarSongLabel])
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def list_song_labels(project_id: str, current_user: dict = Depends(get_current_user)):
    """List the labels available for songs in this project (shared across every song tab).

    **Permissions:** admin | can_access_attached_tribes
    **Project access:** minimum position ≥ guest
    """
    pool = get_database()
    project_id = await resolve_url_param_id(pool, "projects", project_id)
    return await label_service.list_project_labels(pool, project_id, current_user)


@router.post(
    "/projects/{project_id}/song-labels", response_model=GuitarSongLabel, status_code=status.HTTP_201_CREATED
)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def create_song_label(
    project_id: str, data: GuitarSongLabelCreate, current_user: dict = Depends(get_current_user)
):
    """Create a new song label for this project.

    **Permissions:** admin | can_access_attached_tribes
    **Project access:** minimum position ≥ manager
    """
    pool = get_database()
    project_id = await resolve_url_param_id(pool, "projects", project_id)
    return await label_service.create_project_label(pool, project_id, data, current_user)


@router.patch("/song-labels/{label_id}", response_model=GuitarSongLabel)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def update_song_label(
    label_id: str, data: GuitarSongLabelUpdate, current_user: dict = Depends(get_current_user)
):
    """Rename or recolor a song label.

    **Permissions:** admin | can_access_attached_tribes
    **Project access:** minimum position ≥ manager
    """
    return await label_service.update_project_label(get_database(), label_id, data, current_user)


@router.delete("/song-labels/{label_id}", status_code=status.HTTP_204_NO_CONTENT)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def delete_song_label(label_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a song label.

    **Permissions:** admin | can_access_attached_tribes
    **Project access:** minimum position ≥ manager
    """
    await label_service.delete_project_label(get_database(), label_id, current_user)


@router.post("/songs/{song_id}/labels/{label_id}", status_code=status.HTTP_204_NO_CONTENT)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def add_song_label(song_id: str, label_id: str, current_user: dict = Depends(get_current_user)):
    """Attach a label to a song.

    **Permissions:** admin | can_access_attached_tribes
    **Project access:** minimum position ≥ member
    """
    pool = get_database()
    song_id = await resolve_url_param_id(pool, "guitar_songs", song_id)
    await label_service.add_label_to_song(pool, song_id, label_id, current_user)


@router.delete("/songs/{song_id}/labels/{label_id}", status_code=status.HTTP_204_NO_CONTENT)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def remove_song_label(song_id: str, label_id: str, current_user: dict = Depends(get_current_user)):
    """Detach a label from a song.

    **Permissions:** admin | can_access_attached_tribes
    **Project access:** minimum position ≥ member
    """
    pool = get_database()
    song_id = await resolve_url_param_id(pool, "guitar_songs", song_id)
    await label_service.remove_label_from_song(pool, song_id, label_id, current_user)
