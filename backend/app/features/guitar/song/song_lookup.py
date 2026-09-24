from fastapi import HTTPException, status

from app.features.guitar.song import repository as repo


async def require_song_project(pool, song_id: str) -> str:
    project_id = await repo.get_project_id_for_song(pool, song_id)
    if project_id is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Song not found.")
    return project_id


async def require_song_editable(pool, song_id: str) -> None:
    """A completed song's content (title, layout, videos...) is locked -- it must be set back
    to draft before it can be edited again. Labels and archiving are deliberately exempt from
    this check (labels are metadata, not content; archiving is a separate concern)."""
    song = await repo.fetch_song(pool, song_id)
    if song and song.get("song_state") == "completed":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This song is completed. Set it back to draft to edit it.",
        )


async def require_layout_content_song(pool, song_id: str) -> None:
    """A song's content mode (free-form layout vs. a single uploaded PDF) is chosen once at
    creation and never changes -- a PDF song has no rows/columns/blocks to edit or render."""
    song = await repo.fetch_song(pool, song_id)
    if song and song.get("content_type") == "pdf":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This song's content is a PDF file, not a layout.",
        )
