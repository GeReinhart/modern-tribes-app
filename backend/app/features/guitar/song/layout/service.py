from fastapi import HTTPException, status

from app.platform.core.authorization.project_access import check_project_access_or_admin
from app.platform.core.uploads.helpers import create_document_with_attachments, get_document_with_attachments
from app.platform.core.utils.document_helpers import update_document_content_with_revision
from app.features.guitar.chords import repository as chords_repo
from app.features.guitar.song import position_utils, song_lookup
from app.features.guitar.song.layout import block_content_service, repository as repo
from app.features.guitar.song.layout.default_template import DEFAULT_BLOCK_WIDTH_TWELFTHS, DEFAULT_LAYOUT_ROWS
from app.features.guitar.song.layout.lyrics_words import chord_ids_in_lyrics_words, rebuild_words
from app.features.guitar.song.layout.models import (
    CHORD_GRID_BLOCK_TYPE,
    CHORDS_BLOCK_TYPE,
    CUSTOM_BLOCK_TYPE,
    DEFAULT_CHORD_GRID_CHORD_SIZE_PX,
    REPEATABLE_BLOCK_TYPES,
    ROW_WIDTH_TWELFTHS,
    SECTIONS_BLOCK_TYPE,
    TITLE_EDITABLE_BLOCK_TYPES,
    BlockChordResponse,
    GuitarSongLayoutBlockContentUpdate,
    GuitarSongLayoutBlockResponse,
    GuitarSongLayoutColumnResponse,
    GuitarSongLayoutResponse,
    GuitarSongLayoutRowInput,
    GuitarSongLayoutRowResponse,
    GuitarSongLayoutSettingsResponse,
    GuitarSongLayoutSettingsUpdate,
    LyricsWordResponse,
)
from app.features.guitar.song.models import GuitarSongChordMove

_PADDING_DEFAULTS = {"padding_top_mm": 0, "padding_right_mm": 0, "padding_bottom_mm": 0, "padding_left_mm": 0}
_DEFAULT_CARD_BLOCK_TYPES = {"description", "chords", "videos", "custom"}
# These block types edit their title/body from the song's own page via update_block_content,
# independent of row/column structure -- a chord grid's title and comment reuse the exact same
# custom_title/custom_content_html fields a custom block's title and body already use.
_DOCUMENT_BACKED_BLOCK_TYPES = {CUSTOM_BLOCK_TYPE, CHORD_GRID_BLOCK_TYPE}
_SECTIONS_CONTENT_FIELDS = {"lyrics_text", "linked_to_block_id"}


def _serialize_chord_grid_rows(rows) -> list | None:
    if rows is None:
        return None
    return [[cell.model_dump() for cell in row] for row in rows]


def _serialize_block_chords(chords) -> list | None:
    if chords is None:
        return None
    return [c.model_dump() for c in chords]


def _resolve_sections_input(block) -> dict:
    """'sections'-only content fields, forced empty on any other block type or on a block that
    links to another (which never stores content of its own -- see linked_to_block_id). Always
    re-derives lyrics_words from lyrics_text: on a plain row replace the client resends its last-
    known copy of both unchanged, so this reconciles against itself and is a no-op; a stale or
    hand-edited payload self-heals instead of corrupting stored content."""
    if block.block_type != SECTIONS_BLOCK_TYPE or block.linked_to_block_id:
        return {"lyrics_text": None, "lyrics_words": None}
    if block.lyrics_text is None:
        return {"lyrics_text": None, "lyrics_words": None}
    old_words = [[w.model_dump() for w in line] for line in block.lyrics_words] if block.lyrics_words else None
    return {"lyrics_text": block.lyrics_text, "lyrics_words": rebuild_words(block.lyrics_text, old_words)}


async def _resolve_block_input(pool, block, user_id: str) -> dict:
    """A custom block's rich text (and a chord grid's comment) is stored as a document, like a
    song's own description."""
    custom_document_id = None
    if block.block_type in _DOCUMENT_BACKED_BLOCK_TYPES:
        document = await create_document_with_attachments(pool, block.custom_content_html or "", [], user_id)
        custom_document_id = str(document["id"])
    return {
        "block_type": block.block_type, "width_twelfths": block.width_twelfths, "zoom_percent": block.zoom_percent,
        "show_card": block.show_card, "title_heading_level": block.title_heading_level,
        "padding_top_mm": block.padding_top_mm, "padding_right_mm": block.padding_right_mm,
        "padding_bottom_mm": block.padding_bottom_mm, "padding_left_mm": block.padding_left_mm,
        "custom_title": block.custom_title, "custom_document_id": custom_document_id,
        "chord_grid_rows": _serialize_chord_grid_rows(block.chord_grid_rows),
        "chord_grid_chord_size_px": block.chord_grid_chord_size_px,
        "linked_to_block_id": block.linked_to_block_id if block.block_type == SECTIONS_BLOCK_TYPE else None,
        "chords": _serialize_block_chords(block.chords),
        **_resolve_sections_input(block),
    }


async def _resolve_column_input(pool, column, user_id: str) -> dict:
    blocks = [await _resolve_block_input(pool, block, user_id) for block in column.blocks]
    return {
        "blocks": blocks, "width_twelfths": column.width_twelfths, "align": column.align,
        "padding_top_mm": column.padding_top_mm, "padding_right_mm": column.padding_right_mm,
        "padding_bottom_mm": column.padding_bottom_mm, "padding_left_mm": column.padding_left_mm,
    }


async def _require_row_context(pool, row_id: str) -> dict:
    context = await repo.fetch_row_context(pool, row_id)
    if context is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Layout row not found.")
    return context


async def _require_no_block_conflict(pool, song_id: str, columns: list, exclude_row_id: str | None = None) -> None:
    used = await repo.fetch_active_block_types(pool, song_id, exclude_row_id)
    requested = {
        block.block_type for c in columns for block in c.blocks if block.block_type not in REPEATABLE_BLOCK_TYPES
    }
    conflict = used & requested
    if conflict:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Block(s) already used elsewhere in the layout: {', '.join(sorted(conflict))}.",
        )


async def seed_default_layout(pool, song_id: str, user_id: str) -> None:
    """Give a brand new song the default row/column template. Callers are responsible for
    their own project-access check (invoked internally by song creation)."""
    await repo.insert_default_settings(pool, song_id, user_id)
    for row in DEFAULT_LAYOUT_ROWS:
        position = await repo.next_row_position(pool, song_id)
        columns = [
            {**_PADDING_DEFAULTS, **column, "blocks": [
                {
                    "block_type": bt, "width_twelfths": DEFAULT_BLOCK_WIDTH_TWELFTHS.get(bt, ROW_WIDTH_TWELFTHS),
                    "zoom_percent": 100,
                    # 'sections' ("Lyrics & Chords") parts default to the toned-down H5 (non-bold,
                    # italic) instead of every other type's H3 -- see render_block_title.
                    "title_heading_level": "h5" if bt == SECTIONS_BLOCK_TYPE else "h3",
                    "show_card": bt in _DEFAULT_CARD_BLOCK_TYPES, "custom_title": None, "custom_document_id": None,
                }
                for bt in column["block_types"]
            ]}
            for column in row["columns"]
        ]
        for column in columns:
            column.pop("block_types", None)
        await repo.insert_row_with_columns(pool, song_id, position, row["page_break_before"], columns, user_id)


async def _duplicate_block_for_copy(pool, block: dict, user_id: str) -> dict:
    """Custom blocks (and chord grids) get their own fresh document when copied, so editing the
    copy never touches the template's content. A 'sections' block's lyrics/chords copy over as
    plain data (no document involved) -- except linked_to_block_id, which names a block of the
    SOURCE song and is meaningless on the target; copy_layout_from remaps it afterward, once the
    new blocks (and their new ids) exist."""
    custom_document_id = None
    if block["block_type"] in _DOCUMENT_BACKED_BLOCK_TYPES:
        content_html = ""
        if block.get("custom_document_id"):
            source_document = await get_document_with_attachments(pool, block["custom_document_id"])
            content_html = source_document.get("content_html", "") if source_document else ""
        document = await create_document_with_attachments(pool, content_html, [], user_id)
        custom_document_id = str(document["id"])
    return {
        "block_type": block["block_type"], "width_twelfths": block["width_twelfths"],
        "zoom_percent": block["zoom_percent"], "show_card": block["show_card"],
        "title_heading_level": block["title_heading_level"],
        "padding_top_mm": block["padding_top_mm"], "padding_right_mm": block["padding_right_mm"],
        "padding_bottom_mm": block["padding_bottom_mm"], "padding_left_mm": block["padding_left_mm"],
        "custom_title": block.get("custom_title"), "custom_document_id": custom_document_id,
        "chord_grid_rows": block.get("chord_grid_rows"),
        "chord_grid_chord_size_px": block.get("chord_grid_chord_size_px", DEFAULT_CHORD_GRID_CHORD_SIZE_PX),
        "lyrics_text": block.get("lyrics_text"), "lyrics_words": block.get("lyrics_words"),
        "linked_to_block_id": None,
        # A 'chords' block's own list is plain chord_id/comment data (no document involved,
        # exactly like chord_grid_rows) -- the copy gets its own independent list, so editing one
        # afterwards never changes the other.
        "chords": block.get("chords"),
    }


async def copy_layout_from(pool, source_song_id: str, target_song_id: str, user_id: str) -> None:
    """Give a brand new song the same layout (margins + rows/columns/blocks) as an existing
    song, as a starting point instead of the hardcoded default. Callers are responsible for
    their own project-access check and for verifying the source song is in the same project."""
    source_settings = await repo.fetch_settings(pool, source_song_id)
    if source_settings is None:
        await repo.insert_default_settings(pool, target_song_id, user_id)
    else:
        await repo.insert_settings_with_margins(pool, target_song_id, source_settings, user_id)

    source_rows = await repo.fetch_rows(pool, source_song_id)
    columns_by_row = await repo.fetch_columns_for_song(pool, source_song_id)
    # A mirror link names a block of the source song, meaningless on the target -- collected here
    # (source block id -> its source link target id) and remapped once every block has been
    # inserted and we know each source id's corresponding new id, so a link can point anywhere in
    # the copy, not just within the same row.
    source_links: dict[str, str] = {}
    source_to_new_block_id: dict[str, str] = {}
    for row in source_rows:
        columns = []
        source_block_ids: list[str] = []
        for column in columns_by_row.get(row["id"], []):
            blocks = []
            for block in column["blocks"]:
                blocks.append(await _duplicate_block_for_copy(pool, block, user_id))
                source_block_ids.append(block["id"])
                if block.get("linked_to_block_id"):
                    source_links[block["id"]] = block["linked_to_block_id"]
            columns.append({
                "blocks": blocks, "width_twelfths": column["width_twelfths"], "align": column["align"],
                "padding_top_mm": column["padding_top_mm"], "padding_right_mm": column["padding_right_mm"],
                "padding_bottom_mm": column["padding_bottom_mm"], "padding_left_mm": column["padding_left_mm"],
            })
        if not columns:
            continue
        position = await repo.next_row_position(pool, target_song_id)
        _, new_block_ids = await repo.insert_row_with_columns(
            pool, target_song_id, position, row["page_break_before"], columns, user_id,
        )
        source_to_new_block_id.update(zip(source_block_ids, new_block_ids))

    for source_block_id, source_target_id in source_links.items():
        new_block_id = source_to_new_block_id.get(source_block_id)
        new_target_id = source_to_new_block_id.get(source_target_id)
        if new_block_id and new_target_id:
            await repo.update_block_link(pool, new_block_id, new_target_id, user_id)


def _lyrics_word_response(word: dict, chords_by_id: dict[str, dict]) -> LyricsWordResponse:
    chords = {
        position: chords_by_id[chord_id]
        for position, chord_id in word.get("chords", {}).items() if chord_id in chords_by_id
    }
    return LyricsWordResponse(text=word["text"], chords=chords)


def _resolve_sections_response(content_row: dict, chords_by_id: dict[str, dict]) -> dict:
    """Renders a 'sections' block's content fields from `content_row` -- the block's own row, or
    (through a link) the block it mirrors; either way, chord ids are resolved via the pre-fetched
    `chords_by_id` map instead of a query per reference."""
    lyrics_words = None
    if content_row.get("lyrics_words"):
        lyrics_words = [
            [_lyrics_word_response(word, chords_by_id) for word in line] for line in content_row["lyrics_words"]
        ]
    return {"lyrics_text": content_row.get("lyrics_text"), "lyrics_words": lyrics_words}


def _resolve_block_chords_response(block: dict, chords_by_id: dict[str, dict]) -> list[BlockChordResponse] | None:
    if block["block_type"] != CHORDS_BLOCK_TYPE or not block.get("chords"):
        return None
    return [
        BlockChordResponse(chord_id=item["chord_id"], chord=chords_by_id[item["chord_id"]], comment=item.get("comment"))
        for item in block["chords"] if item["chord_id"] in chords_by_id
    ]


async def _resolve_block_response(pool, block: dict, chords_by_id: dict[str, dict]) -> GuitarSongLayoutBlockResponse:
    custom_content_html = None
    if block["block_type"] in _DOCUMENT_BACKED_BLOCK_TYPES and block.get("custom_document_id"):
        document = await get_document_with_attachments(pool, block["custom_document_id"])
        custom_content_html = document.get("content_html", "") if document else ""
    sections_fields = {}
    if block["block_type"] == SECTIONS_BLOCK_TYPE:
        content_row = block
        if block.get("linked_to_block_id"):
            linked = await repo.fetch_block(pool, block["linked_to_block_id"])
            if linked is not None:
                content_row = linked
        sections_fields = _resolve_sections_response(content_row, chords_by_id)
    return GuitarSongLayoutBlockResponse(
        id=block["id"], block_type=block["block_type"], width_twelfths=block["width_twelfths"],
        zoom_percent=block["zoom_percent"], show_card=block["show_card"],
        title_heading_level=block["title_heading_level"],
        padding_top_mm=block["padding_top_mm"], padding_right_mm=block["padding_right_mm"],
        padding_bottom_mm=block["padding_bottom_mm"], padding_left_mm=block["padding_left_mm"],
        custom_title=block.get("custom_title"), custom_content_html=custom_content_html,
        chord_grid_rows=block.get("chord_grid_rows"), chord_grid_chord_size_px=block["chord_grid_chord_size_px"],
        linked_to_block_id=block.get("linked_to_block_id"),
        chords=_resolve_block_chords_response(block, chords_by_id),
        **sections_fields,
    )


async def _to_column_response(pool, column: dict, chords_by_id: dict[str, dict]) -> GuitarSongLayoutColumnResponse:
    blocks = [await _resolve_block_response(pool, block, chords_by_id) for block in column["blocks"]]
    return GuitarSongLayoutColumnResponse(**{**column, "blocks": blocks})


async def _to_row_response(
    pool, row: dict, columns: list[dict], chords_by_id: dict[str, dict]
) -> GuitarSongLayoutRowResponse:
    column_responses = [await _to_column_response(pool, column, chords_by_id) for column in columns]
    return GuitarSongLayoutRowResponse(**row, columns=column_responses)


def _collect_chord_ids(columns_by_row: dict) -> set[str]:
    ids: set[str] = set()
    for columns in columns_by_row.values():
        for column in columns:
            for block in column["blocks"]:
                ids |= chord_ids_in_lyrics_words(block.get("lyrics_words"))
                if block.get("chords"):
                    ids |= {item["chord_id"] for item in block["chords"]}
    return ids


def collect_song_chords_union(layout: GuitarSongLayoutResponse) -> list[BlockChordResponse]:
    """The song's own overall chord list is the deduplicated union of every 'chords' block's own
    list -- first occurrence (in row/column/block order) wins when the same chord appears in more
    than one block. Used by the chord-grid and lyrics-word chord pickers as "the song's own chord
    list"; each block still keeps its own independent comment for a shared chord."""
    seen: set[str] = set()
    union: list[BlockChordResponse] = []
    for row in layout.rows:
        for column in row.columns:
            for block in column.blocks:
                if block.block_type != CHORDS_BLOCK_TYPE or not block.chords:
                    continue
                for block_chord in block.chords:
                    if block_chord.chord_id in seen:
                        continue
                    seen.add(block_chord.chord_id)
                    union.append(block_chord)
    return union


async def get_layout(pool, song_id: str) -> GuitarSongLayoutResponse:
    """Callers are responsible for their own project-access check (also used internally by
    the song detail response)."""
    settings = await repo.ensure_settings(pool, song_id)
    rows = await repo.fetch_rows(pool, song_id)
    columns_by_row = await repo.fetch_columns_for_song(pool, song_id)
    chords_by_id = await chords_repo.fetch_chords_by_ids(pool, _collect_chord_ids(columns_by_row))
    row_responses = [
        await _to_row_response(pool, row, columns_by_row.get(row["id"], []), chords_by_id) for row in rows
    ]
    return GuitarSongLayoutResponse(settings=GuitarSongLayoutSettingsResponse(**settings), rows=row_responses)


async def add_row(
    pool, song_id: str, data: GuitarSongLayoutRowInput, user: dict, insert_before_row_id: str | None = None,
) -> GuitarSongLayoutResponse:
    project_id = await song_lookup.require_song_project(pool, song_id)
    await check_project_access_or_admin(project_id, user, pool, min_position="member")
    await _require_no_block_conflict(pool, song_id, data.columns)
    if insert_before_row_id:
        before_context = await _require_row_context(pool, insert_before_row_id)
        if before_context["song_id"] != song_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Layout row not found.")
        position = await repo.row_position_before(pool, song_id, insert_before_row_id, user["id"])
    else:
        position = await repo.next_row_position(pool, song_id)
    columns = [await _resolve_column_input(pool, c, user["id"]) for c in data.columns]
    await repo.insert_row_with_columns(pool, song_id, position, data.page_break_before, columns, user["id"])
    return await get_layout(pool, song_id)


async def replace_row(pool, row_id: str, data: GuitarSongLayoutRowInput, user: dict) -> GuitarSongLayoutResponse:
    context = await _require_row_context(pool, row_id)
    await check_project_access_or_admin(context["project_id"], user, pool, min_position="member")
    await _require_no_block_conflict(pool, context["song_id"], data.columns, exclude_row_id=row_id)
    columns = [await _resolve_column_input(pool, c, user["id"]) for c in data.columns]
    await repo.replace_row(pool, row_id, context["song_id"], data.page_break_before, columns, user["id"])
    return await get_layout(pool, context["song_id"])


async def move_row(pool, row_id: str, data: GuitarSongChordMove, user: dict) -> GuitarSongLayoutResponse:
    context = await _require_row_context(pool, row_id)
    await check_project_access_or_admin(context["project_id"], user, pool, min_position="manager")
    ordered = await repo.fetch_rows_sorted(pool, context["song_id"])
    target_id = position_utils.find_move_target_id(ordered, row_id, data.direction)
    if target_id:
        await repo.swap_row_positions(pool, row_id, target_id, user["id"])
    return await get_layout(pool, context["song_id"])


async def remove_row(pool, row_id: str, user: dict) -> None:
    context = await _require_row_context(pool, row_id)
    await check_project_access_or_admin(context["project_id"], user, pool, min_position="manager")
    await repo.archive_row(pool, row_id, user["id"])


async def _chords_by_id_for_single_block(pool, block: dict) -> dict[str, dict]:
    ids = chord_ids_in_lyrics_words(block.get("lyrics_words"))
    if block.get("linked_to_block_id"):
        linked = await repo.fetch_block(pool, block["linked_to_block_id"])
        if linked is not None:
            ids |= chord_ids_in_lyrics_words(linked.get("lyrics_words"))
    if block.get("chords"):
        ids |= {item["chord_id"] for item in block["chords"]}
    return await chords_repo.fetch_chords_by_ids(pool, ids)


async def update_block_content(
    pool, block_id: str, data: GuitarSongLayoutBlockContentUpdate, user: dict
) -> GuitarSongLayoutBlockResponse:
    """A custom block's title and rich text, a chord grid's title/comment/grid data, or a
    'sections' block's lyrics/mirror link, are edited from the song's own page, independent of
    the layout row that places it -- this never touches row/column structure."""
    context = await repo.fetch_block_context(pool, block_id)
    if context is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Layout block not found.")
    fields_sent = data.model_fields_set
    if "custom_title" in fields_sent and context["block_type"] not in TITLE_EDITABLE_BLOCK_TYPES:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="This block type has no editable title.")
    if (fields_sent & {"custom_content_html", "chord_grid_rows"}) and context["block_type"] not in _DOCUMENT_BACKED_BLOCK_TYPES:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Only custom blocks and chord grids have that kind of content."
        )
    sections_fields_sent = fields_sent & _SECTIONS_CONTENT_FIELDS
    if sections_fields_sent and context["block_type"] != SECTIONS_BLOCK_TYPE:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Only 'Lyrics & Chords' blocks have that kind of content."
        )
    if "chords" in fields_sent and context["block_type"] != CHORDS_BLOCK_TYPE:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Only 'chords' blocks have that kind of content.")
    if "chord_grid_chord_size_px" in fields_sent and context["block_type"] != CHORD_GRID_BLOCK_TYPE:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Only chord grids have a chord size.")
    await check_project_access_or_admin(context["project_id"], user, pool, min_position="member")
    if "custom_title" in fields_sent:
        await repo.update_block_title(pool, block_id, data.custom_title, user["id"])
    if "custom_content_html" in fields_sent:
        await update_document_content_with_revision(
            pool, context["custom_document_id"], data.custom_content_html or "", user["id"]
        )
    if "chord_grid_rows" in fields_sent:
        await repo.update_block_chord_grid_rows(
            pool, block_id, _serialize_chord_grid_rows(data.chord_grid_rows), user["id"],
        )
    if "chord_grid_chord_size_px" in fields_sent:
        await repo.update_block_chord_grid_chord_size_px(pool, block_id, data.chord_grid_chord_size_px, user["id"])
    if "chords" in fields_sent:
        await repo.update_block_chords(pool, block_id, _serialize_block_chords(data.chords), user["id"])
    if sections_fields_sent:
        block = await repo.fetch_block(pool, block_id)
        await block_content_service.apply_sections_content(pool, block_id, block, data, user["id"])
    block = await repo.fetch_block(pool, block_id)
    chords_by_id = await _chords_by_id_for_single_block(pool, block)
    return await _resolve_block_response(pool, block, chords_by_id)


async def set_lyrics_word_chord(
    pool, block_id: str, line_index: int, word_index: int, position, chord_id: str | None, user: dict
) -> GuitarSongLayoutBlockResponse:
    """Attach, replace or detach (chord_id: None) the chord at one of the 5 fixed positions
    around a word (before, start, middle, end, after) in a lyrics-mode 'sections' block."""
    context = await repo.fetch_block_context(pool, block_id)
    if context is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Layout block not found.")
    if context["block_type"] != SECTIONS_BLOCK_TYPE:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Only 'Lyrics & Chords' blocks have words."
        )
    await check_project_access_or_admin(context["project_id"], user, pool, min_position="member")
    block = await block_content_service.set_lyrics_word_chord(
        pool, block_id, line_index, word_index, position, chord_id, user["id"],
    )
    chords_by_id = await _chords_by_id_for_single_block(pool, block)
    return await _resolve_block_response(pool, block, chords_by_id)


async def update_settings(
    pool, song_id: str, data: GuitarSongLayoutSettingsUpdate, user: dict
) -> GuitarSongLayoutSettingsResponse:
    project_id = await song_lookup.require_song_project(pool, song_id)
    await check_project_access_or_admin(project_id, user, pool, min_position="member")
    updates = data.model_dump(exclude_unset=True)
    row = await repo.update_settings(pool, song_id, updates, user["id"])
    return GuitarSongLayoutSettingsResponse(**row)
