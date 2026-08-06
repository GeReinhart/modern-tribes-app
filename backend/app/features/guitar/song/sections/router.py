from fastapi import APIRouter, Depends, status

from app.platform.core.authentication.router import get_current_user
from app.platform.core.authorization.router import require_any_permission_decorator
from app.platform.core.authorization.models import PermissionEnum
from app.platform.core.database import get_database
from app.platform.core.utils.db_helpers import resolve_url_param_id
from app.features.guitar.song.models import GuitarSongChordMove
from app.features.guitar.song.song_lookup import require_song_project
from app.features.guitar.song.sections import service as sections_service
from app.features.guitar.song.sections.models import (
    GuitarSongSectionChordCreate,
    GuitarSongSectionChordResponse,
    GuitarSongSectionCreate,
    GuitarSongSectionLyricsUpdate,
    GuitarSongSectionResponse,
    GuitarSongSectionUpdate,
    GuitarSongSectionWordChordUpdate,
    GuitarSongSectionWordResponse,
    WordChordPosition,
)

router = APIRouter(prefix="/guitar-songs", tags=["features_guitar_song_sections"])


@router.post(
    "/songs/{song_id}/sections", response_model=GuitarSongSectionResponse, status_code=status.HTTP_201_CREATED
)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def create_section(
    song_id: str, data: GuitarSongSectionCreate, current_user: dict = Depends(get_current_user)
):
    """Add a structural section (intro, verse, chorus...) to a song, at the next position.

    **Permissions:** admin | can_access_attached_tribes
    **Project access:** minimum position ≥ member
    """
    pool = get_database()
    song_id = await resolve_url_param_id(pool, "guitar_songs", song_id)
    project_id = await require_song_project(pool, song_id)
    return await sections_service.create_section(pool, song_id, project_id, data, current_user)


@router.patch("/sections/{section_id}", response_model=GuitarSongSectionResponse)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def update_section(
    section_id: str, data: GuitarSongSectionUpdate, current_user: dict = Depends(get_current_user)
):
    """Rename a section's type or custom label.

    **Permissions:** admin | can_access_attached_tribes
    **Project access:** minimum position ≥ member
    """
    return await sections_service.update_section(get_database(), section_id, data, current_user)


@router.post("/sections/{section_id}/move", response_model=list[GuitarSongSectionResponse])
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def move_section(
    section_id: str, data: GuitarSongChordMove, current_user: dict = Depends(get_current_user)
):
    """Move a section up or down in the song's structure.

    **Permissions:** admin | can_access_attached_tribes
    **Project access:** minimum position ≥ manager
    """
    return await sections_service.move_section(get_database(), section_id, data, current_user)


@router.post(
    "/sections/{section_id}/duplicate", response_model=GuitarSongSectionResponse,
    status_code=status.HTTP_201_CREATED,
)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def duplicate_section(section_id: str, current_user: dict = Depends(get_current_user)):
    """Copy a section's structure (lyrics/word-chord attachments, or chord sequence) into a new
    section, so a verse's chord pattern can be reused under different lyrics.

    **Permissions:** admin | can_access_attached_tribes
    **Project access:** minimum position ≥ member
    """
    return await sections_service.duplicate_section(get_database(), section_id, current_user)


@router.delete("/sections/{section_id}", status_code=status.HTTP_204_NO_CONTENT)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def archive_section(section_id: str, current_user: dict = Depends(get_current_user)):
    """Remove a section from a song.

    **Permissions:** admin | can_access_attached_tribes
    **Project access:** minimum position ≥ manager
    """
    await sections_service.archive_section(get_database(), section_id, current_user)


@router.patch("/sections/{section_id}/lyrics", response_model=GuitarSongSectionResponse)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def update_section_lyrics(
    section_id: str, data: GuitarSongSectionLyricsUpdate, current_user: dict = Depends(get_current_user)
):
    """Edit a lyrics-mode section's text. Words unchanged by the edit keep their attached chord.

    **Permissions:** admin | can_access_attached_tribes
    **Project access:** minimum position ≥ member
    """
    return await sections_service.update_lyrics(get_database(), section_id, data, current_user)


@router.patch("/section-words/{word_id}/chords/{position}", response_model=GuitarSongSectionWordResponse)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def set_word_chord(
    word_id: str, position: WordChordPosition, data: GuitarSongSectionWordChordUpdate,
    current_user: dict = Depends(get_current_user),
):
    """Attach, replace or detach (chord_id: null) the chord at one of the 5 fixed positions
    around a word (before, start, middle, end, after) in a lyrics-mode section.

    **Permissions:** admin | can_access_attached_tribes
    **Project access:** minimum position ≥ member
    """
    return await sections_service.set_word_chord(get_database(), word_id, position, data, current_user)


@router.post(
    "/sections/{section_id}/chords", response_model=GuitarSongSectionChordResponse,
    status_code=status.HTTP_201_CREATED,
)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def add_chord_to_section(
    section_id: str, data: GuitarSongSectionChordCreate, current_user: dict = Depends(get_current_user)
):
    """Append a chord to a chords-only section's sequence (e.g. an intro riff).

    **Permissions:** admin | can_access_attached_tribes
    **Project access:** minimum position ≥ member
    """
    return await sections_service.add_chord_to_section(get_database(), section_id, data, current_user)


@router.post("/section-chords/{section_chord_id}/move", response_model=list[GuitarSongSectionChordResponse])
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def move_section_chord(
    section_chord_id: str, data: GuitarSongChordMove, current_user: dict = Depends(get_current_user)
):
    """Move a chord up or down in a chords-only section's sequence.

    **Permissions:** admin | can_access_attached_tribes
    **Project access:** minimum position ≥ manager
    """
    return await sections_service.move_section_chord(get_database(), section_chord_id, data, current_user)


@router.delete("/section-chords/{section_chord_id}", status_code=status.HTTP_204_NO_CONTENT)
@require_any_permission_decorator(PermissionEnum.ADMIN, PermissionEnum.CAN_ACCESS_OWN_TRIBES)
async def remove_chord_from_section(section_chord_id: str, current_user: dict = Depends(get_current_user)):
    """Remove a chord from a chords-only section's sequence.

    **Permissions:** admin | can_access_attached_tribes
    **Project access:** minimum position ≥ manager
    """
    await sections_service.remove_chord_from_section(get_database(), section_chord_id, current_user)
