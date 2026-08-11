import re

from fastapi import APIRouter, Depends, Response, status

from app.platform.core.authentication.router import get_current_user
from app.platform.core.authorization.router import require_any_permission_decorator
from app.platform.core.authorization.models import PermissionEnum
from app.platform.core.database import get_database
from app.platform.core.utils.db_helpers import resolve_url_param_id
from app.features.guitar.song.models import GuitarSongChordMove
from app.features.guitar.song.service import get_song
from app.features.guitar.song.layout import service as layout_service
from app.features.guitar.song.layout.models import (
    GuitarSongLayoutBlockContentUpdate,
    GuitarSongLayoutBlockResponse,
    GuitarSongLayoutResponse,
    GuitarSongLayoutRowInput,
    GuitarSongLayoutSettingsResponse,
    GuitarSongLayoutSettingsUpdate,
    LyricsWordChordUpdate,
    WordChordPosition,
)
from app.features.guitar.song.layout.pdf_service import render_song_pdf

router = APIRouter(prefix="/guitar-songs", tags=["features_guitar_song_layout"])


def _safe_pdf_filename(title: str) -> str:
    cleaned = re.sub(r"[^A-Za-z0-9 _-]", "", title).strip() or "song"
    return f"{cleaned[:100]}.pdf"


@router.post("/songs/{song_id}/layout/rows", response_model=GuitarSongLayoutResponse, status_code=status.HTTP_201_CREATED)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def add_layout_row(
    song_id: str, data: GuitarSongLayoutRowInput, insert_before_row_id: str | None = None,
    current_user: dict = Depends(get_current_user),
):
    """Add a row to a song's presentation/print layout -- at the end, or immediately before
    insert_before_row_id (a row of the same song) if given.

    **Permissions:** admin | can_access_attached_tribes
    **Project access:** minimum position ≥ member
    """
    pool = get_database()
    song_id = await resolve_url_param_id(pool, "guitar_songs", song_id)
    return await layout_service.add_row(pool, song_id, data, current_user, insert_before_row_id)


@router.put("/layout/rows/{row_id}", response_model=GuitarSongLayoutResponse)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def replace_layout_row(row_id: str, data: GuitarSongLayoutRowInput, current_user: dict = Depends(get_current_user)):
    """Replace a row's page-break flag and its whole set of columns at once.

    **Permissions:** admin | can_access_attached_tribes
    **Project access:** minimum position ≥ member
    """
    return await layout_service.replace_row(get_database(), row_id, data, current_user)


@router.post("/layout/rows/{row_id}/move", response_model=GuitarSongLayoutResponse)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def move_layout_row(row_id: str, data: GuitarSongChordMove, current_user: dict = Depends(get_current_user)):
    """Move a row up or down in the layout.

    **Permissions:** admin | can_access_attached_tribes
    **Project access:** minimum position ≥ manager
    """
    return await layout_service.move_row(get_database(), row_id, data, current_user)


@router.delete("/layout/rows/{row_id}", status_code=status.HTTP_204_NO_CONTENT)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def remove_layout_row(row_id: str, current_user: dict = Depends(get_current_user)):
    """Remove a row (and its columns) from the layout.

    **Permissions:** admin | can_access_attached_tribes
    **Project access:** minimum position ≥ manager
    """
    await layout_service.remove_row(get_database(), row_id, current_user)


@router.patch("/songs/{song_id}/layout/settings", response_model=GuitarSongLayoutSettingsResponse)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def update_layout_settings(
    song_id: str, data: GuitarSongLayoutSettingsUpdate, current_user: dict = Depends(get_current_user)
):
    """Update a song's print page margins and footer spacing.

    **Permissions:** admin | can_access_attached_tribes
    **Project access:** minimum position ≥ member
    """
    pool = get_database()
    song_id = await resolve_url_param_id(pool, "guitar_songs", song_id)
    return await layout_service.update_settings(pool, song_id, data, current_user)


@router.patch("/layout/blocks/{block_id}", response_model=GuitarSongLayoutBlockResponse)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def update_layout_block_content(
    block_id: str, data: GuitarSongLayoutBlockContentUpdate, current_user: dict = Depends(get_current_user)
):
    """Edit a custom block's title and rich text from the song's own page, independent of its
    position in the layout template.

    **Permissions:** admin | can_access_attached_tribes
    **Project access:** minimum position ≥ member
    """
    return await layout_service.update_block_content(get_database(), block_id, data, current_user)


@router.patch(
    "/layout/blocks/{block_id}/lyrics-words/{line_index}/{word_index}/chords/{position}",
    response_model=GuitarSongLayoutBlockResponse,
)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def set_lyrics_word_chord(
    block_id: str, line_index: int, word_index: int, position: WordChordPosition,
    data: LyricsWordChordUpdate, current_user: dict = Depends(get_current_user),
):
    """Attach, replace or detach (chord_id: null) the chord at one of the 5 fixed positions
    around a word (before, start, middle, end, after) in a lyrics-mode 'sections' block.

    **Permissions:** admin | can_access_attached_tribes
    **Project access:** minimum position ≥ member
    """
    return await layout_service.set_lyrics_word_chord(
        get_database(), block_id, line_index, word_index, position, data.chord_id, current_user,
    )


@router.get("/songs/{song_id}/layout/pdf")
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def download_layout_pdf(song_id: str, current_user: dict = Depends(get_current_user)):
    """Download the song as a printable PDF, laid out per its presentation template.

    **Permissions:** admin | can_access_attached_tribes
    **Project access:** minimum position ≥ guest
    """
    pool = get_database()
    song_id = await resolve_url_param_id(pool, "guitar_songs", song_id)
    song = await get_song(pool, song_id, current_user)
    pdf_bytes = await render_song_pdf(pool, song, current_user["id"])
    filename = _safe_pdf_filename(song.title)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
