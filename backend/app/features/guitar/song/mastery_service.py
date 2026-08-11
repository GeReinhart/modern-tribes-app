from app.platform.core.authorization.project_access import check_project_access_or_admin
from app.features.guitar.song import mastery_repository as repo, song_lookup
from app.features.guitar.song.mastery_models import GuitarSongMasteryResponse


async def set_my_mastery(pool, song_id: str, mastery_level: int, user: dict) -> GuitarSongMasteryResponse:
    """Rating your own mastery is a private, personal action -- open to any project member
    (including guests) and, unlike editorial fields, never locked by a completed song."""
    project_id = await song_lookup.require_song_project(pool, song_id)
    await check_project_access_or_admin(project_id, user, pool, min_position="guest")
    await repo.upsert_my_mastery(pool, song_id, user["id"], mastery_level)
    return GuitarSongMasteryResponse(my_mastery=mastery_level)
