from fastapi import APIRouter, Depends, status

from app.platform.core.authentication.router import get_current_user
from app.platform.core.authorization.router import require_any_permission_decorator
from app.platform.core.authorization.models import PermissionEnum
from app.platform.core.database import get_database
from app.platform.core.utils.db_helpers import resolve_url_param_id
from app.features.guitar.song.models import GuitarSongChordMove
from app.features.guitar.song.song_lookup import require_song_project
from app.features.guitar.song.video import service as video_service
from app.features.guitar.song.video.models import (
    GuitarSongVideoCreate,
    GuitarSongVideoResponse,
    GuitarSongVideoUpdate,
)

router = APIRouter(prefix="/guitar-songs", tags=["features_guitar_song_videos"])


@router.post(
    "/songs/{song_id}/videos", response_model=GuitarSongVideoResponse, status_code=status.HTTP_201_CREATED
)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def add_video_to_song(
    song_id: str, data: GuitarSongVideoCreate, current_user: dict = Depends(get_current_user)
):
    """Add a video to a song, at the next position.

    **Permissions:** admin | can_access_attached_tribes
    **Project access:** minimum position ≥ member
    """
    pool = get_database()
    song_id = await resolve_url_param_id(pool, "guitar_songs", song_id)
    project_id = await require_song_project(pool, song_id)
    return await video_service.add_video_to_song(pool, song_id, project_id, data, current_user)


@router.patch("/videos/{video_id}", response_model=GuitarSongVideoResponse)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def update_video(video_id: str, data: GuitarSongVideoUpdate, current_user: dict = Depends(get_current_user)):
    """Edit a video's title or URL.

    **Permissions:** admin | can_access_attached_tribes
    **Project access:** minimum position ≥ member
    """
    return await video_service.update_video(get_database(), video_id, data, current_user)


@router.post("/videos/{video_id}/move", response_model=list[GuitarSongVideoResponse])
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def move_video(video_id: str, data: GuitarSongChordMove, current_user: dict = Depends(get_current_user)):
    """Move a video up or down in the song's video list.

    **Permissions:** admin | can_access_attached_tribes
    **Project access:** minimum position ≥ manager
    """
    return await video_service.move_video(get_database(), video_id, data, current_user)


@router.delete("/videos/{video_id}", status_code=status.HTTP_204_NO_CONTENT)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def remove_video_from_song(video_id: str, current_user: dict = Depends(get_current_user)):
    """Remove a video from a song.

    **Permissions:** admin | can_access_attached_tribes
    **Project access:** minimum position ≥ manager
    """
    await video_service.remove_video_from_song(get_database(), video_id, current_user)
