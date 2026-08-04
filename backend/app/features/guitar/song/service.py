from fastapi import HTTPException, status

from app.platform.core.authorization.project_access import check_project_access_or_admin
from app.platform.core.utils.db_helpers import generate_url_param_id
from app.features.guitar.song import repository as repo
from app.features.guitar.song.models import (
    GuitarSongChordCreate,
    GuitarSongChordMove,
    GuitarSongChordResponse,
    GuitarSongChordUpdate,
    GuitarSongCreate,
    GuitarSongDetailResponse,
    GuitarSongResponse,
    GuitarSongUpdate,
)


async def _require_instance_project(pool, feature_instance_id: str) -> str:
    project_id = await repo.get_project_id_for_instance(pool, feature_instance_id)
    if project_id is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Feature instance not found.")
    return project_id


async def _require_song_project(pool, song_id: str) -> str:
    project_id = await repo.get_project_id_for_song(pool, song_id)
    if project_id is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Song not found.")
    return project_id


async def _require_song_chord_context(pool, song_chord_id: str) -> dict:
    context = await repo.fetch_song_chord_context(pool, song_chord_id)
    if context is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Song chord not found.")
    return context


async def list_songs(pool, feature_instance_id: str, user: dict) -> list[GuitarSongResponse]:
    project_id = await _require_instance_project(pool, feature_instance_id)
    await check_project_access_or_admin(project_id, user, pool, min_position="guest")
    rows = await repo.fetch_songs(pool, project_id)
    return [GuitarSongResponse(**row) for row in rows]


async def create_song(pool, feature_instance_id: str, data: GuitarSongCreate, user: dict) -> GuitarSongResponse:
    project_id = await _require_instance_project(pool, feature_instance_id)
    await check_project_access_or_admin(project_id, user, pool, min_position="member")
    row = await repo.insert_song(
        pool, project_id, generate_url_param_id(), data.title, data.author,
        data.tempo_bpm, data.beats_per_bar, user["id"],
    )
    return GuitarSongResponse(**row)


async def get_song(pool, song_id: str, user: dict) -> GuitarSongDetailResponse:
    project_id = await _require_song_project(pool, song_id)
    await check_project_access_or_admin(project_id, user, pool, min_position="guest")
    song_row = await repo.fetch_song(pool, song_id)
    chords = await repo.fetch_song_chords(pool, song_id)
    return GuitarSongDetailResponse(**song_row, chords=[GuitarSongChordResponse(**c) for c in chords])


async def update_song(pool, song_id: str, data: GuitarSongUpdate, user: dict) -> GuitarSongResponse:
    project_id = await _require_song_project(pool, song_id)
    await check_project_access_or_admin(project_id, user, pool, min_position="member")
    updates = data.model_dump(exclude_unset=True)
    row = await repo.update_song(pool, song_id, updates, user["id"])
    return GuitarSongResponse(**row)


async def archive_song(pool, song_id: str, user: dict) -> None:
    project_id = await _require_song_project(pool, song_id)
    await check_project_access_or_admin(project_id, user, pool, min_position="manager")
    await repo.archive_song(pool, song_id, user["id"])


async def add_chord_to_song(pool, song_id: str, data: GuitarSongChordCreate, user: dict) -> GuitarSongChordResponse:
    project_id = await _require_song_project(pool, song_id)
    await check_project_access_or_admin(project_id, user, pool, min_position="member")
    song_chord_id = await _link_chord_to_song(pool, song_id, data, user["id"])
    row = await repo.fetch_song_chord(pool, song_chord_id)
    return GuitarSongChordResponse(**row)


async def _link_chord_to_song(pool, song_id: str, data: GuitarSongChordCreate, user_id: str) -> str:
    """Link a chord to a song, reactivating a previously removed link instead of duplicating it."""
    existing = await repo.find_song_chord_pair(pool, song_id, data.chord_id)
    if existing and existing["status"] == "active":
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="This chord is already in the song.")
    position = await repo.next_song_chord_position(pool, song_id)
    if existing:
        await repo.reactivate_song_chord(pool, existing["id"], position, data.comment, user_id)
        return existing["id"]
    return await repo.insert_song_chord(pool, song_id, data.chord_id, position, data.comment, user_id)


async def update_song_chord_comment(
    pool, song_chord_id: str, data: GuitarSongChordUpdate, user: dict
) -> GuitarSongChordResponse:
    context = await _require_song_chord_context(pool, song_chord_id)
    await check_project_access_or_admin(context["project_id"], user, pool, min_position="member")
    await repo.update_song_chord_comment(pool, song_chord_id, data.comment, user["id"])
    row = await repo.fetch_song_chord(pool, song_chord_id)
    return GuitarSongChordResponse(**row)


async def move_song_chord(
    pool, song_chord_id: str, data: GuitarSongChordMove, user: dict
) -> list[GuitarSongChordResponse]:
    context = await _require_song_chord_context(pool, song_chord_id)
    await check_project_access_or_admin(context["project_id"], user, pool, min_position="manager")
    ordered = await repo.fetch_song_chords_sorted(pool, context["song_id"])
    idx = next((i for i, c in enumerate(ordered) if c["id"] == song_chord_id), None)
    target_idx = idx - 1 if data.direction == "prev" else idx + 1
    if idx is not None and 0 <= target_idx < len(ordered):
        await repo.swap_song_chord_positions(pool, song_chord_id, ordered[target_idx]["id"], user["id"])
    chords = await repo.fetch_song_chords(pool, context["song_id"])
    return [GuitarSongChordResponse(**c) for c in chords]


async def remove_chord_from_song(pool, song_chord_id: str, user: dict) -> None:
    context = await _require_song_chord_context(pool, song_chord_id)
    await check_project_access_or_admin(context["project_id"], user, pool, min_position="manager")
    await repo.archive_song_chord(pool, song_chord_id, user["id"])
