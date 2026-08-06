from fastapi import HTTPException, status

from app.platform.core.authorization.project_access import check_project_access_or_admin
from app.features.guitar.song import position_utils
from app.features.guitar.song.models import GuitarSongChordMove
from app.features.guitar.song.video import repository as repo
from app.features.guitar.song.video.models import (
    GuitarSongVideoCreate,
    GuitarSongVideoResponse,
    GuitarSongVideoUpdate,
)


async def _require_video_context(pool, video_id: str) -> dict:
    context = await repo.fetch_video_context(pool, video_id)
    if context is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Video not found.")
    return context


async def list_videos(pool, song_id: str) -> list[GuitarSongVideoResponse]:
    """Callers are responsible for their own project-access check (also used internally by
    the song detail response)."""
    rows = await repo.fetch_videos(pool, song_id)
    return [GuitarSongVideoResponse(**row) for row in rows]


async def add_video_to_song(
    pool, song_id: str, project_id: str, data: GuitarSongVideoCreate, user: dict
) -> GuitarSongVideoResponse:
    await check_project_access_or_admin(project_id, user, pool, min_position="member")
    position = await repo.next_video_position(pool, song_id)
    video_id = await repo.insert_video(pool, song_id, data.title, data.url, position, user["id"])
    row = await repo.fetch_video(pool, video_id)
    return GuitarSongVideoResponse(**row)


async def update_video(pool, video_id: str, data: GuitarSongVideoUpdate, user: dict) -> GuitarSongVideoResponse:
    context = await _require_video_context(pool, video_id)
    await check_project_access_or_admin(context["project_id"], user, pool, min_position="member")
    updates = data.model_dump(exclude_unset=True)
    await repo.update_video(pool, video_id, updates, user["id"])
    row = await repo.fetch_video(pool, video_id)
    return GuitarSongVideoResponse(**row)


async def move_video(pool, video_id: str, data: GuitarSongChordMove, user: dict) -> list[GuitarSongVideoResponse]:
    context = await _require_video_context(pool, video_id)
    await check_project_access_or_admin(context["project_id"], user, pool, min_position="manager")
    ordered = await repo.fetch_videos_sorted(pool, context["song_id"])
    target_id = position_utils.find_move_target_id(ordered, video_id, data.direction)
    if target_id:
        await repo.swap_video_positions(pool, video_id, target_id, user["id"])
    return await list_videos(pool, context["song_id"])


async def remove_video_from_song(pool, video_id: str, user: dict) -> None:
    context = await _require_video_context(pool, video_id)
    await check_project_access_or_admin(context["project_id"], user, pool, min_position="manager")
    await repo.archive_video(pool, video_id, user["id"])
