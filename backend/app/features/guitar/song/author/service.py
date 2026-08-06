from app.platform.core.authorization.project_access import check_project_access_or_admin
from app.features.guitar.song.author import repository as repo
from app.features.guitar.song.author.models import GuitarSongAuthorResponse


async def list_authors(pool, project_id: str, user: dict) -> list[GuitarSongAuthorResponse]:
    await check_project_access_or_admin(project_id, user, pool, min_position="guest")
    rows = await repo.fetch_authors(pool, project_id)
    return [GuitarSongAuthorResponse(**row) for row in rows]


async def resolve_or_create_author(pool, project_id: str, name: str | None, user_id: str) -> str | None:
    """Find an existing author by name within the project, or create one. Returns its id,
    or None if no name was given (an author is optional)."""
    name = (name or "").strip()
    if not name:
        return None
    existing = await repo.find_author_by_name(pool, project_id, name)
    if existing:
        return existing["id"]
    created = await repo.insert_author(pool, project_id, name, user_id)
    return created["id"]
