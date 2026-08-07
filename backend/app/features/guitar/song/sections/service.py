from fastapi import HTTPException, status

from app.platform.core.authorization.project_access import check_project_access_or_admin
from app.features.guitar.song import chord_link_service, position_utils
from app.features.guitar.song.models import GuitarSongChordMove
from app.features.guitar.song.sections import repository as repo
from app.features.guitar.song.sections import word_reconciliation
from app.features.guitar.song.sections import word_repository as word_repo
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


async def _require_section_context(pool, section_id: str) -> dict:
    context = await repo.fetch_section_context(pool, section_id)
    if context is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Section not found.")
    return context


async def _require_valid_sections_block(pool, song_id: str, layout_block_id: str | None) -> None:
    if layout_block_id is None:
        return
    if not await repo.sections_block_exists(pool, song_id, layout_block_id):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="layout_block_id must reference an active 'Lyrics & Chords' block in this song.",
        )


async def _require_valid_link_target(pool, song_id: str, linked_to_section_id: str | None) -> None:
    """A link can only point at a "root" section (not itself a link) of the same song --
    no chains, no cross-song references."""
    if linked_to_section_id is None:
        return
    target = await repo.fetch_section_context(pool, linked_to_section_id)
    if target is None or target["song_id"] != song_id:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="linked_to_section_id must reference another section of this song.",
        )
    if target["linked_to_section_id"]:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Cannot link to a section that is itself a link.",
        )


async def _require_word_context(pool, word_id: str) -> dict:
    context = await word_repo.fetch_word_context(pool, word_id)
    if context is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Section word not found.")
    return context


def _word_response(word: dict) -> GuitarSongSectionWordResponse:
    chords = word["chords"]
    return GuitarSongSectionWordResponse(
        id=word["id"], line_index=word["line_index"], word_index=word["word_index"], text=word["text"],
        chord_before=chords.get("before"), chord_start=chords.get("start"), chord_middle=chords.get("middle"),
        chord_end=chords.get("end"), chord_after=chords.get("after"),
    )


async def _require_section_chord_context(pool, section_chord_id: str) -> dict:
    context = await repo.fetch_section_chord_context(pool, section_chord_id)
    if context is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Section chord not found.")
    return context


def _require_content_mode(context: dict, expected: str) -> None:
    if context["content_mode"] != expected:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"This section is not a '{expected}' section.",
        )


def _compute_display_labels(sections: list[dict]) -> dict[str, str]:
    """Number sections sharing the same type only when that type appears more than once."""
    counts: dict[str, int] = {}
    for section in sections:
        counts[section["type_label"]] = counts.get(section["type_label"], 0) + 1
    seen: dict[str, int] = {}
    labels: dict[str, str] = {}
    for section in sections:
        if section["custom_label"]:
            labels[section["id"]] = section["custom_label"]
        elif counts[section["type_label"]] > 1:
            seen[section["type_label"]] = seen.get(section["type_label"], 0) + 1
            labels[section["id"]] = f"{section['type_label']} {seen[section['type_label']]}"
        else:
            labels[section["id"]] = section["type_label"]
    return labels


async def _build_section_response(pool, row: dict, display_label: str) -> GuitarSongSectionResponse:
    # A link's own row never stores real content -- content_mode/lyrics_text/words/chords are
    # always resolved from the section it links to, while identity fields (position, labels,
    # layout_block_id, linked_to_section_id itself) stay the link's own.
    content_row = row
    if row["linked_to_section_id"]:
        content_row = await repo.fetch_section(pool, row["linked_to_section_id"])
    words: list[dict] = []
    chords: list[dict] = []
    if content_row["content_mode"] == "lyrics":
        words = await word_repo.fetch_section_words(pool, content_row["id"])
    else:
        chords = await repo.fetch_section_chords(pool, content_row["id"])
    return GuitarSongSectionResponse(
        **{**row, "content_mode": content_row["content_mode"], "lyrics_text": content_row["lyrics_text"]},
        display_label=display_label,
        words=[_word_response(w) for w in words],
        chords=[GuitarSongSectionChordResponse(**c) for c in chords],
    )


async def list_sections(pool, song_id: str) -> list[GuitarSongSectionResponse]:
    """Build the full, ordered list of a song's sections. Callers are responsible for their
    own project-access check (this is also used internally by the song detail response)."""
    rows = await repo.fetch_sections(pool, song_id)
    labels = _compute_display_labels(rows)
    return [await _build_section_response(pool, row, labels[row["id"]]) for row in rows]


async def _single_section_response(pool, song_id: str, section_id: str) -> GuitarSongSectionResponse:
    rows = await repo.fetch_sections(pool, song_id)
    labels = _compute_display_labels(rows)
    row = next(r for r in rows if r["id"] == section_id)
    return await _build_section_response(pool, row, labels[section_id])


async def create_section(
    pool, song_id: str, project_id: str, data: GuitarSongSectionCreate, user: dict
) -> GuitarSongSectionResponse:
    await check_project_access_or_admin(project_id, user, pool, min_position="member")
    await _require_valid_sections_block(pool, song_id, data.layout_block_id)
    await _require_valid_link_target(pool, song_id, data.linked_to_section_id)
    position = await repo.next_section_position(pool, song_id)
    section_id = await repo.insert_section(
        pool, song_id, position, data.type_label, data.custom_label, data.content_mode,
        data.layout_block_id, data.linked_to_section_id, user["id"],
    )
    return await _single_section_response(pool, song_id, section_id)


async def update_section(pool, section_id: str, data: GuitarSongSectionUpdate, user: dict) -> GuitarSongSectionResponse:
    context = await _require_section_context(pool, section_id)
    await check_project_access_or_admin(context["project_id"], user, pool, min_position="member")
    if "layout_block_id" in data.model_fields_set:
        await _require_valid_sections_block(pool, context["song_id"], data.layout_block_id)
    updates = data.model_dump(exclude_unset=True)
    await repo.update_section(pool, section_id, updates, user["id"])
    return await _single_section_response(pool, context["song_id"], section_id)


async def move_section(
    pool, section_id: str, data: GuitarSongChordMove, user: dict
) -> list[GuitarSongSectionResponse]:
    context = await _require_section_context(pool, section_id)
    await check_project_access_or_admin(context["project_id"], user, pool, min_position="manager")
    ordered = await repo.fetch_sections_sorted(pool, context["song_id"])
    target_id = position_utils.find_move_target_id(ordered, section_id, data.direction)
    if target_id:
        await repo.swap_section_positions(pool, section_id, target_id, user["id"])
    return await list_sections(pool, context["song_id"])


async def archive_section(pool, section_id: str, user: dict) -> None:
    context = await _require_section_context(pool, section_id)
    await check_project_access_or_admin(context["project_id"], user, pool, min_position="manager")
    if await repo.has_active_links_to(pool, section_id):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot remove a section that other sections are linked to. Unlink them first.",
        )
    await repo.archive_section(pool, section_id, user["id"])


async def _resolve_content_target(pool, context: dict) -> dict:
    """Where an edit to `context`'s section actually lands -- its own id, or (if it's a link)
    the section it mirrors, so writing lyrics/chords "through" a link keeps every section
    linked to the same source in sync."""
    if not context["linked_to_section_id"]:
        return context
    return await _require_section_context(pool, context["linked_to_section_id"])


async def update_lyrics(
    pool, section_id: str, data: GuitarSongSectionLyricsUpdate, user: dict
) -> GuitarSongSectionResponse:
    context = await _require_section_context(pool, section_id)
    target = await _resolve_content_target(pool, context)
    _require_content_mode(target, "lyrics")
    await check_project_access_or_admin(context["project_id"], user, pool, min_position="member")
    await repo.update_section_lyrics_text(pool, target["id"], data.text, user["id"])
    await _reconcile_words(pool, target["id"], data.text, user["id"])
    return await _single_section_response(pool, context["song_id"], section_id)


async def _reconcile_words(pool, section_id: str, text: str, user_id: str) -> None:
    """Replace a section's words with a fresh tokenization of its text, carrying the chords of
    any word the diff considers unchanged so editing text never resets unrelated attachments."""
    old_words = await word_repo.fetch_section_words(pool, section_id)
    new_tokens = word_reconciliation.tokenize_lyrics(text)
    carried = word_reconciliation.match_carried_chords(old_words, new_tokens)
    await word_repo.delete_section_words(pool, section_id)
    for index, (line_index, word_index, word_text) in enumerate(new_tokens):
        word_id = await word_repo.insert_section_word(pool, section_id, line_index, word_index, word_text, user_id)
        for position, chord_id in carried.get(index, {}).items():
            await word_repo.set_word_chord_at_position(pool, word_id, position, chord_id, user_id)


async def set_word_chord(
    pool, word_id: str, position: WordChordPosition, data: GuitarSongSectionWordChordUpdate, user: dict
) -> GuitarSongSectionWordResponse:
    context = await _require_word_context(pool, word_id)
    await check_project_access_or_admin(context["project_id"], user, pool, min_position="member")
    if data.chord_id:
        await chord_link_service.ensure_chord_in_song(pool, context["song_id"], data.chord_id, user["id"])
    await word_repo.set_word_chord_at_position(pool, word_id, position, data.chord_id, user["id"])
    row = await word_repo.fetch_section_word(pool, word_id)
    return _word_response(row)


async def add_chord_to_section(
    pool, section_id: str, data: GuitarSongSectionChordCreate, user: dict
) -> GuitarSongSectionChordResponse:
    context = await _require_section_context(pool, section_id)
    target = await _resolve_content_target(pool, context)
    _require_content_mode(target, "chords_only")
    await check_project_access_or_admin(context["project_id"], user, pool, min_position="member")
    await chord_link_service.ensure_chord_in_song(pool, context["song_id"], data.chord_id, user["id"])
    position = await repo.next_section_chord_position(pool, target["id"])
    section_chord_id = await repo.insert_section_chord(pool, target["id"], data.chord_id, position, user["id"])
    row = await repo.fetch_section_chord(pool, section_chord_id)
    return GuitarSongSectionChordResponse(**row)


async def move_section_chord(
    pool, section_chord_id: str, data: GuitarSongChordMove, user: dict
) -> list[GuitarSongSectionChordResponse]:
    context = await _require_section_chord_context(pool, section_chord_id)
    await check_project_access_or_admin(context["project_id"], user, pool, min_position="manager")
    ordered = await repo.fetch_section_chords_sorted(pool, context["section_id"])
    target_id = position_utils.find_move_target_id(ordered, section_chord_id, data.direction)
    if target_id:
        await repo.swap_section_chord_positions(pool, section_chord_id, target_id, user["id"])
    chords = await repo.fetch_section_chords(pool, context["section_id"])
    return [GuitarSongSectionChordResponse(**c) for c in chords]


async def remove_chord_from_section(pool, section_chord_id: str, user: dict) -> None:
    context = await _require_section_chord_context(pool, section_chord_id)
    await check_project_access_or_admin(context["project_id"], user, pool, min_position="manager")
    await repo.delete_section_chord(pool, section_chord_id)


async def duplicate_section(pool, section_id: str, user: dict) -> GuitarSongSectionResponse:
    """Copy a section's structure -- lyrics with their word-chord attachments, or a chords-only
    sequence -- into a new section, since verses often reuse the same chords under new lyrics.
    Duplicating a link creates another link to the same source, rather than a blank section --
    the copy stays in sync too, instead of quietly losing its content."""
    context = await _require_section_context(pool, section_id)
    await check_project_access_or_admin(context["project_id"], user, pool, min_position="member")
    original = await repo.fetch_section(pool, section_id)
    new_position = await repo.next_section_position(pool, context["song_id"])
    new_section_id = await repo.insert_section(
        pool, context["song_id"], new_position, original["type_label"], original["custom_label"],
        original["content_mode"], original["layout_block_id"], original["linked_to_section_id"], user["id"],
    )
    if not original["linked_to_section_id"]:
        if original["content_mode"] == "lyrics":
            await repo.update_section_lyrics_text(pool, new_section_id, original["lyrics_text"] or "", user["id"])
            await _copy_words(pool, section_id, new_section_id, user["id"])
        else:
            await _copy_section_chords(pool, section_id, new_section_id, user["id"])
    return await _single_section_response(pool, context["song_id"], new_section_id)


async def duplicate_sections_for_song(pool, source_song_id: str, target_song_id: str, user_id: str) -> None:
    """Copy every section of a song (lyrics + word-chord attachments, or a chord sequence) into
    another song, preserving order, for whole-song duplication. Callers are responsible for
    their own project-access check.

    A source section's layout_block_id is never carried over -- it points at a block belonging
    to the source song's own layout, which is meaningless (or worse, wrong) on the target song,
    so every copied section starts unassigned. Same for a link: it points at a section of the
    SOURCE song, so the copy gets an independent snapshot of the shared content instead --
    there's no source-song section on the target to link to."""
    for row in await repo.fetch_sections(pool, source_song_id):
        content_row = row
        content_section_id = row["id"]
        if row["linked_to_section_id"]:
            content_row = await repo.fetch_section(pool, row["linked_to_section_id"])
            content_section_id = content_row["id"]
        new_position = await repo.next_section_position(pool, target_song_id)
        new_section_id = await repo.insert_section(
            pool, target_song_id, new_position, row["type_label"], row["custom_label"], content_row["content_mode"],
            None, None, user_id,
        )
        if content_row["content_mode"] == "lyrics":
            await repo.update_section_lyrics_text(pool, new_section_id, content_row["lyrics_text"] or "", user_id)
            await _copy_words(pool, content_section_id, new_section_id, user_id)
        else:
            await _copy_section_chords(pool, content_section_id, new_section_id, user_id)


async def _copy_words(pool, source_section_id: str, target_section_id: str, user_id: str) -> None:
    for word in await word_repo.fetch_section_words(pool, source_section_id):
        new_word_id = await word_repo.insert_section_word(
            pool, target_section_id, word["line_index"], word["word_index"], word["text"], user_id,
        )
        for position, chord in word["chords"].items():
            await word_repo.set_word_chord_at_position(pool, new_word_id, position, chord["id"], user_id)


async def _copy_section_chords(pool, source_section_id: str, target_section_id: str, user_id: str) -> None:
    for index, section_chord in enumerate(await repo.fetch_section_chords(pool, source_section_id), start=1):
        await repo.insert_section_chord(pool, target_section_id, section_chord["chord"]["id"], index, user_id)
