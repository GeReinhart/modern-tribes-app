from fastapi import HTTPException, status

from app.platform.core.authorization.project_access import check_project_access_or_admin
from app.platform.core.uploads.helpers import create_document_with_attachments, get_document_with_attachments
from app.platform.core.utils.document_helpers import update_document_content_with_revision
from app.features.guitar.song import position_utils, song_lookup
from app.features.guitar.song.layout import repository as repo
from app.features.guitar.song.layout.default_template import DEFAULT_LAYOUT_ROWS
from app.features.guitar.song.layout.models import (
    CUSTOM_BLOCK_TYPE,
    ROW_WIDTH_EIGHTHS,
    GuitarSongLayoutBlockContentUpdate,
    GuitarSongLayoutBlockResponse,
    GuitarSongLayoutColumnResponse,
    GuitarSongLayoutResponse,
    GuitarSongLayoutRowInput,
    GuitarSongLayoutRowResponse,
    GuitarSongLayoutSettingsResponse,
    GuitarSongLayoutSettingsUpdate,
)
from app.features.guitar.song.models import GuitarSongChordMove

_PADDING_DEFAULTS = {"padding_top_mm": 0, "padding_right_mm": 0, "padding_bottom_mm": 0, "padding_left_mm": 0}
_DEFAULT_CARD_BLOCK_TYPES = {"description", "chords", "videos", "custom"}


async def _resolve_block_input(pool, block, user_id: str) -> dict:
    """A custom block's rich text is stored as a document, like a song's own description."""
    custom_document_id = None
    if block.block_type == CUSTOM_BLOCK_TYPE:
        document = await create_document_with_attachments(pool, block.custom_content_html or "", [], user_id)
        custom_document_id = str(document["id"])
    return {
        "block_type": block.block_type, "width_eighths": block.width_eighths, "zoom_percent": block.zoom_percent,
        "show_card": block.show_card, "custom_title": block.custom_title, "custom_document_id": custom_document_id,
    }


async def _resolve_column_input(pool, column, user_id: str) -> dict:
    blocks = [await _resolve_block_input(pool, block, user_id) for block in column.blocks]
    return {
        "blocks": blocks, "width_eighths": column.width_eighths, "align": column.align,
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
        block.block_type for c in columns for block in c.blocks if block.block_type != CUSTOM_BLOCK_TYPE
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
                    "block_type": bt, "width_eighths": ROW_WIDTH_EIGHTHS, "zoom_percent": 100,
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
    """Custom blocks get their own fresh document when copied, so editing the copy never
    touches the template's content."""
    custom_document_id = None
    if block["block_type"] == CUSTOM_BLOCK_TYPE:
        content_html = ""
        if block.get("custom_document_id"):
            source_document = await get_document_with_attachments(pool, block["custom_document_id"])
            content_html = source_document.get("content_html", "") if source_document else ""
        document = await create_document_with_attachments(pool, content_html, [], user_id)
        custom_document_id = str(document["id"])
    return {
        "block_type": block["block_type"], "width_eighths": block["width_eighths"],
        "zoom_percent": block["zoom_percent"], "show_card": block["show_card"],
        "custom_title": block.get("custom_title"), "custom_document_id": custom_document_id,
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
    for row in source_rows:
        columns = []
        for column in columns_by_row.get(row["id"], []):
            blocks = [await _duplicate_block_for_copy(pool, block, user_id) for block in column["blocks"]]
            columns.append({
                "blocks": blocks, "width_eighths": column["width_eighths"], "align": column["align"],
                "padding_top_mm": column["padding_top_mm"], "padding_right_mm": column["padding_right_mm"],
                "padding_bottom_mm": column["padding_bottom_mm"], "padding_left_mm": column["padding_left_mm"],
            })
        if not columns:
            continue
        position = await repo.next_row_position(pool, target_song_id)
        await repo.insert_row_with_columns(pool, target_song_id, position, row["page_break_before"], columns, user_id)


async def _resolve_block_response(pool, block: dict) -> GuitarSongLayoutBlockResponse:
    custom_content_html = None
    if block["block_type"] == CUSTOM_BLOCK_TYPE and block.get("custom_document_id"):
        document = await get_document_with_attachments(pool, block["custom_document_id"])
        custom_content_html = document.get("content_html", "") if document else ""
    return GuitarSongLayoutBlockResponse(
        id=block["id"], block_type=block["block_type"], width_eighths=block["width_eighths"],
        zoom_percent=block["zoom_percent"], show_card=block["show_card"],
        custom_title=block.get("custom_title"), custom_content_html=custom_content_html,
    )


async def _to_column_response(pool, column: dict) -> GuitarSongLayoutColumnResponse:
    blocks = [await _resolve_block_response(pool, block) for block in column["blocks"]]
    return GuitarSongLayoutColumnResponse(**{**column, "blocks": blocks})


async def _to_row_response(pool, row: dict, columns: list[dict]) -> GuitarSongLayoutRowResponse:
    column_responses = [await _to_column_response(pool, column) for column in columns]
    return GuitarSongLayoutRowResponse(**row, columns=column_responses)


async def get_layout(pool, song_id: str) -> GuitarSongLayoutResponse:
    """Callers are responsible for their own project-access check (also used internally by
    the song detail response)."""
    settings = await repo.ensure_settings(pool, song_id)
    rows = await repo.fetch_rows(pool, song_id)
    columns_by_row = await repo.fetch_columns_for_song(pool, song_id)
    row_responses = [await _to_row_response(pool, row, columns_by_row.get(row["id"], [])) for row in rows]
    return GuitarSongLayoutResponse(settings=GuitarSongLayoutSettingsResponse(**settings), rows=row_responses)


async def add_row(pool, song_id: str, data: GuitarSongLayoutRowInput, user: dict) -> GuitarSongLayoutResponse:
    project_id = await song_lookup.require_song_project(pool, song_id)
    await check_project_access_or_admin(project_id, user, pool, min_position="member")
    await _require_no_block_conflict(pool, song_id, data.columns)
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


async def update_block_content(
    pool, block_id: str, data: GuitarSongLayoutBlockContentUpdate, user: dict
) -> GuitarSongLayoutBlockResponse:
    """A custom block's title and rich text are edited from the song's own page, independent
    of the layout row that places it -- this never touches row/column structure."""
    context = await repo.fetch_block_context(pool, block_id)
    if context is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Layout block not found.")
    if context["block_type"] != CUSTOM_BLOCK_TYPE:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Only custom blocks have editable content.")
    await check_project_access_or_admin(context["project_id"], user, pool, min_position="member")
    if "custom_title" in data.model_fields_set:
        await repo.update_block_title(pool, block_id, data.custom_title, user["id"])
    if "custom_content_html" in data.model_fields_set:
        await update_document_content_with_revision(
            pool, context["custom_document_id"], data.custom_content_html or "", user["id"]
        )
    block = await repo.fetch_block(pool, block_id)
    return await _resolve_block_response(pool, block)


async def update_settings(
    pool, song_id: str, data: GuitarSongLayoutSettingsUpdate, user: dict
) -> GuitarSongLayoutSettingsResponse:
    project_id = await song_lookup.require_song_project(pool, song_id)
    await check_project_access_or_admin(project_id, user, pool, min_position="member")
    updates = data.model_dump(exclude_unset=True)
    row = await repo.update_settings(pool, song_id, updates, user["id"])
    return GuitarSongLayoutSettingsResponse(**row)
