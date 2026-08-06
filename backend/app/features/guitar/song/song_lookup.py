from fastapi import HTTPException, status

from app.features.guitar.song import repository as repo


async def require_song_project(pool, song_id: str) -> str:
    project_id = await repo.get_project_id_for_song(pool, song_id)
    if project_id is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Song not found.")
    return project_id
