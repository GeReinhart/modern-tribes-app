from fastapi import HTTPException, status

from app.platform.core.authorization.project_access import check_project_access_or_admin
from app.platform.core.uploads.helpers import create_document_with_attachments, get_document_with_attachments
from app.platform.core.utils.db_helpers import generate_url_param_id
from app.platform.core.utils.document_helpers import update_document_content_with_revision
from app.platform.functions.labels import repository as labels_repo
from app.platform.functions.labels.repository import fetch_label_ids_for_entity
from app.features.guitar.song import chord_link_service, position_utils, song_lookup
from app.features.guitar.song.label_service import ENTITY_TYPE as SONG_LABEL_ENTITY_TYPE
from app.features.guitar.song import repository as repo
from app.features.guitar.song.author import repository as author_repo
from app.features.guitar.song.author.service import resolve_or_create_author
from app.features.guitar.song.layout.service import copy_layout_from, get_layout, seed_default_layout
from app.features.guitar.song.sections.service import duplicate_sections_for_song, list_sections
from app.features.guitar.song.video import repository as video_repo
from app.features.guitar.song.video.service import list_videos
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

_require_song_project = song_lookup.require_song_project


async def _require_song_chord_context(pool, song_chord_id: str) -> dict:
    context = await repo.fetch_song_chord_context(pool, song_chord_id)
    if context is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Song chord not found.")
    return context


async def list_songs(pool, project_id: str, user: dict) -> list[GuitarSongResponse]:
    await check_project_access_or_admin(project_id, user, pool, min_position="guest")
    rows = await repo.fetch_songs(pool, project_id)
    responses = []
    for row in rows:
        label_ids = await fetch_label_ids_for_entity(pool, SONG_LABEL_ENTITY_TYPE, row["id"])
        responses.append(GuitarSongResponse(
            **{**row, "author": row.get("author_name")}, description_html="", label_ids=label_ids,
        ))
    return responses


async def create_song(pool, project_id: str, data: GuitarSongCreate, user: dict) -> GuitarSongResponse:
    await check_project_access_or_admin(project_id, user, pool, min_position="member")
    if data.copy_from_song_id:
        return await _create_song_from_copy(pool, project_id, data, user)
    if data.template_song_id:
        await _require_song_in_project(pool, project_id, data.template_song_id)
    document_id = None
    if data.description_html:
        document = await create_document_with_attachments(pool, data.description_html, [], user["id"])
        document_id = str(document["id"])
    author_id = await resolve_or_create_author(pool, project_id, data.author, user["id"])
    row = await repo.insert_song(
        pool, project_id, generate_url_param_id(), data.title, author_id,
        data.tempo_bpm, data.beats_per_bar, data.capo,
        data.chord_diagram_style, data.chord_diagram_size,
        data.lyrics_line_spacing_px, data.lyrics_text_size_px, data.lyrics_chord_size_px,
        document_id, user["id"],
    )
    if data.template_song_id:
        await copy_layout_from(pool, data.template_song_id, row["id"], user["id"])
    elif not data.blank_layout:
        await seed_default_layout(pool, row["id"], user["id"])
    return await _build_song_response(pool, row)


async def _create_song_from_copy(pool, project_id: str, data: GuitarSongCreate, user: dict) -> GuitarSongResponse:
    """'copy_from_song_id' brings over everything from the source song -- description, chords,
    sections, videos, labels and layout -- except title/author, which stay whatever the caller
    provided (unlike duplicate_song's auto '<title> - COPIE')."""
    await _require_song_in_project(pool, project_id, data.copy_from_song_id)
    source_row = await repo.fetch_song(pool, data.copy_from_song_id)
    document_id = await _duplicate_song_description(pool, source_row.get("document_id"), user["id"])
    author_id = await resolve_or_create_author(pool, project_id, data.author, user["id"])
    row = await repo.insert_song(
        pool, project_id, generate_url_param_id(), data.title, author_id,
        source_row["tempo_bpm"], source_row["beats_per_bar"], source_row["capo"],
        source_row["chord_diagram_style"], source_row["chord_diagram_size"],
        source_row["lyrics_line_spacing_px"], source_row["lyrics_text_size_px"], source_row["lyrics_chord_size_px"],
        document_id, user["id"],
    )
    await _copy_song_content(pool, data.copy_from_song_id, row["id"], user["id"])
    return await _build_song_response(pool, row)


async def _require_song_in_project(pool, project_id: str, other_song_id: str) -> None:
    """The referenced song (template or copy source) must belong to the same project --
    otherwise a member could pull in content from a song they can't see. Checked before any
    writes, so a bad reference never leaves a half-created song behind."""
    other_project_id = await repo.get_project_id_for_song(pool, other_song_id)
    if other_project_id != project_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Song not found in this project.")


async def get_song(pool, song_id: str, user: dict) -> GuitarSongDetailResponse:
    project_id = await _require_song_project(pool, song_id)
    await check_project_access_or_admin(project_id, user, pool, min_position="guest")
    song_row = await repo.fetch_song(pool, song_id)
    chords = await repo.fetch_song_chords(pool, song_id)
    sections = await list_sections(pool, song_id)
    videos = await list_videos(pool, song_id)
    layout = await get_layout(pool, song_id)
    song_response = await _build_song_response(pool, song_row)
    return GuitarSongDetailResponse(
        **song_response.model_dump(), chords=[GuitarSongChordResponse(**c) for c in chords],
        sections=sections, videos=videos, layout=layout,
    )


async def update_song(pool, song_id: str, data: GuitarSongUpdate, user: dict) -> GuitarSongResponse:
    project_id = await _require_song_project(pool, song_id)
    await check_project_access_or_admin(project_id, user, pool, min_position="member")
    updates = data.model_dump(exclude_unset=True, exclude={"description_html", "author"})
    await repo.update_song(pool, song_id, updates, user["id"])
    if "description_html" in data.model_fields_set:
        await _update_song_description(pool, song_id, data.description_html, user["id"])
    if "author" in data.model_fields_set:
        author_id = await resolve_or_create_author(pool, project_id, data.author, user["id"])
        await repo.set_song_author(pool, song_id, author_id, user["id"])
    row = await repo.fetch_song(pool, song_id)
    return await _build_song_response(pool, row)


async def _update_song_description(pool, song_id: str, description_html: str | None, user_id: str) -> None:
    row = await repo.fetch_song(pool, song_id)
    document_id = row.get("document_id")
    if not document_id:
        document = await create_document_with_attachments(pool, description_html or "", [], user_id)
        await repo.set_song_document(pool, song_id, str(document["id"]), user_id)
    else:
        await update_document_content_with_revision(pool, str(document_id), description_html or "", user_id)


async def _resolve_author_name(pool, row: dict) -> str | None:
    """Rows from a joined SELECT (fetch_song/fetch_songs) already carry author_name.
    Rows straight from an INSERT/UPDATE ... RETURNING don't (no join possible there)."""
    if "author_name" in row:
        return row["author_name"]
    author_id = row.get("author_id")
    if not author_id:
        return None
    author = await author_repo.fetch_author(pool, author_id)
    return author["name"] if author else None


async def _build_song_response(pool, row: dict) -> GuitarSongResponse:
    document_id = row.get("document_id")
    description_html = ""
    if document_id:
        document = await get_document_with_attachments(pool, str(document_id))
        if document:
            description_html = document.get("content_html", "")
    author_name = await _resolve_author_name(pool, row)
    label_ids = await fetch_label_ids_for_entity(pool, SONG_LABEL_ENTITY_TYPE, row["id"])
    return GuitarSongResponse(
        **{**row, "author": author_name}, description_html=description_html, label_ids=label_ids
    )


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
    return await chord_link_service.ensure_chord_in_song(pool, song_id, data.chord_id, user_id, data.comment)


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
    target_id = position_utils.find_move_target_id(ordered, song_chord_id, data.direction)
    if target_id:
        await repo.swap_song_chord_positions(pool, song_chord_id, target_id, user["id"])
    chords = await repo.fetch_song_chords(pool, context["song_id"])
    return [GuitarSongChordResponse(**c) for c in chords]


async def remove_chord_from_song(pool, song_chord_id: str, user: dict) -> None:
    context = await _require_song_chord_context(pool, song_chord_id)
    await check_project_access_or_admin(context["project_id"], user, pool, min_position="manager")
    await repo.archive_song_chord(pool, song_chord_id, user["id"])


async def duplicate_song(pool, song_id: str, user: dict) -> GuitarSongDetailResponse:
    """Copy a whole song -- description, chords, sections, videos, labels and layout -- into a
    new song titled '<original> - COPIE', so a setlist variant can start from a full copy."""
    project_id = await _require_song_project(pool, song_id)
    await check_project_access_or_admin(project_id, user, pool, min_position="member")
    source_row = await repo.fetch_song(pool, song_id)
    document_id = await _duplicate_song_description(pool, source_row.get("document_id"), user["id"])
    new_row = await repo.insert_song(
        pool, project_id, generate_url_param_id(), f'{source_row["title"]} - COPIE', source_row.get("author_id"),
        source_row["tempo_bpm"], source_row["beats_per_bar"], source_row["capo"],
        source_row["chord_diagram_style"], source_row["chord_diagram_size"],
        source_row["lyrics_line_spacing_px"], source_row["lyrics_text_size_px"], source_row["lyrics_chord_size_px"],
        document_id, user["id"],
    )
    await _copy_song_content(pool, song_id, new_row["id"], user["id"])
    return await get_song(pool, new_row["id"], user)


async def _copy_song_content(pool, source_song_id: str, target_song_id: str, user_id: str) -> None:
    await _duplicate_song_chords(pool, source_song_id, target_song_id, user_id)
    await duplicate_sections_for_song(pool, source_song_id, target_song_id, user_id)
    await _duplicate_song_videos(pool, source_song_id, target_song_id, user_id)
    await _duplicate_song_labels(pool, source_song_id, target_song_id)
    await copy_layout_from(pool, source_song_id, target_song_id, user_id)


async def _duplicate_song_description(pool, source_document_id: str | None, user_id: str) -> str | None:
    if not source_document_id:
        return None
    source_document = await get_document_with_attachments(pool, str(source_document_id))
    content_html = source_document.get("content_html", "") if source_document else ""
    document = await create_document_with_attachments(pool, content_html, [], user_id)
    return str(document["id"])


async def _duplicate_song_chords(pool, source_song_id: str, target_song_id: str, user_id: str) -> None:
    for song_chord in await repo.fetch_song_chords(pool, source_song_id):
        position = await repo.next_song_chord_position(pool, target_song_id)
        await repo.insert_song_chord(
            pool, target_song_id, song_chord["chord"]["id"], position, song_chord.get("comment"), user_id,
        )


async def _duplicate_song_videos(pool, source_song_id: str, target_song_id: str, user_id: str) -> None:
    for video in await list_videos(pool, source_song_id):
        position = await video_repo.next_video_position(pool, target_song_id)
        await video_repo.insert_video(pool, target_song_id, video.title, video.url, position, user_id)


async def _duplicate_song_labels(pool, source_song_id: str, target_song_id: str) -> None:
    for label_id in await fetch_label_ids_for_entity(pool, SONG_LABEL_ENTITY_TYPE, source_song_id):
        await labels_repo.add_entity_label(pool, target_song_id, SONG_LABEL_ENTITY_TYPE, label_id)
