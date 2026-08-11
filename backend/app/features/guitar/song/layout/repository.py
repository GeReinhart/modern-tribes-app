import json
from collections import defaultdict
from uuid import UUID

from app.features.guitar.song import position_utils

_BLOCK_FIELDS = (
    "id::text, column_id::text, song_id::text, block_type, width_twelfths, zoom_percent, show_card, "
    "title_heading_level, padding_top_mm, padding_right_mm, padding_bottom_mm, padding_left_mm, "
    "custom_title, custom_document_id::text, chord_grid_rows, chord_grid_chord_size_px, "
    "lyrics_text, lyrics_words, linked_to_block_id::text, chords"
)


def _deserialize_block(row: dict) -> dict:
    block = dict(row)
    if block.get("chord_grid_rows") is not None:
        block["chord_grid_rows"] = json.loads(block["chord_grid_rows"])
    if block.get("lyrics_words") is not None:
        block["lyrics_words"] = json.loads(block["lyrics_words"])
    if block.get("chords") is not None:
        block["chords"] = json.loads(block["chords"])
    return block

_ROW_FIELDS = (
    "id::text, song_id::text, position, page_break_before, status, "
    "created_at, updated_at, created_by::text, updated_by::text"
)
_COLUMN_FIELDS = (
    "id::text, row_id::text, position, width_twelfths, align, "
    "padding_top_mm, padding_right_mm, padding_bottom_mm, padding_left_mm, "
    "separator_left, separator_right, status, "
    "created_at, updated_at, created_by::text, updated_by::text"
)
_SETTINGS_FIELDS = (
    "id::text, song_id::text, margin_top_mm, margin_right_mm, margin_bottom_mm, margin_left_mm, status, "
    "created_at, updated_at, created_by::text, updated_by::text"
)


async def fetch_row_context(pool, row_id: str) -> dict | None:
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """SELECT r.id::text, r.song_id::text, s.project_id::text AS project_id
               FROM guitar_songs_layout_rows r JOIN guitar_songs s ON s.id = r.song_id
               WHERE r.id = $1""",
            UUID(row_id),
        )
    return dict(row) if row else None


async def fetch_rows(pool, song_id: str) -> list[dict]:
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            f"SELECT {_ROW_FIELDS} FROM guitar_songs_layout_rows "
            "WHERE song_id = $1 AND status = 'active' ORDER BY position ASC",
            UUID(song_id),
        )
    return [dict(row) for row in rows]


async def _fetch_blocks_by_column(pool, song_id: str) -> dict[str, list[dict]]:
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            f"""SELECT {_BLOCK_FIELDS}
               FROM guitar_songs_layout_column_blocks
               WHERE song_id = $1 AND status = 'active' ORDER BY column_id, position ASC""",
            UUID(song_id),
        )
    grouped: dict[str, list[dict]] = defaultdict(list)
    for row in rows:
        grouped[row["column_id"]].append(_deserialize_block(row))
    return grouped


async def fetch_columns_for_song(pool, song_id: str) -> dict[str, list[dict]]:
    """All active columns for a song's active rows, grouped by row_id, each with its blocks."""
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            f"""SELECT {_COLUMN_FIELDS} FROM guitar_songs_layout_columns
                WHERE song_id = $1 AND status = 'active' ORDER BY row_id, position ASC""",
            UUID(song_id),
        )
    blocks_by_column = await _fetch_blocks_by_column(pool, song_id)
    grouped: dict[str, list[dict]] = defaultdict(list)
    for row in rows:
        column = dict(row)
        column["blocks"] = blocks_by_column.get(column["id"], [])
        grouped[row["row_id"]].append(column)
    return grouped


async def fetch_settings(pool, song_id: str) -> dict | None:
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            f"SELECT {_SETTINGS_FIELDS} FROM guitar_songs_layout_settings WHERE song_id = $1", UUID(song_id)
        )
    return dict(row) if row else None


async def insert_default_settings(pool, song_id: str, user_id: str) -> dict:
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            f"""INSERT INTO guitar_songs_layout_settings (song_id, created_by, updated_by)
                VALUES ($1, $2::uuid, $2::uuid) RETURNING {_SETTINGS_FIELDS}""",
            UUID(song_id), UUID(user_id),
        )
    return dict(row)


async def insert_settings_with_margins(pool, song_id: str, margins: dict, user_id: str) -> dict:
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            f"""INSERT INTO guitar_songs_layout_settings
                    (song_id, margin_top_mm, margin_right_mm, margin_bottom_mm, margin_left_mm, created_by, updated_by)
                VALUES ($1, $2, $3, $4, $5, $6::uuid, $6::uuid) RETURNING {_SETTINGS_FIELDS}""",
            UUID(song_id), margins["margin_top_mm"], margins["margin_right_mm"],
            margins["margin_bottom_mm"], margins["margin_left_mm"], UUID(user_id),
        )
    return dict(row)


async def ensure_settings(pool, song_id: str) -> dict:
    """Lazily create default settings for a song that predates this feature (or whose test
    fixture never seeded them), so reading a layout never crashes on a missing settings row."""
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            f"""INSERT INTO guitar_songs_layout_settings (song_id) VALUES ($1)
                ON CONFLICT (song_id) DO NOTHING RETURNING {_SETTINGS_FIELDS}""",
            UUID(song_id),
        )
    return dict(row) if row else await fetch_settings(pool, song_id)


async def update_settings(pool, song_id: str, updates: dict, user_id: str) -> dict:
    if not updates:
        return await fetch_settings(pool, song_id)
    fields = {**updates, "updated_by": UUID(user_id)}
    set_clauses = []
    params: list = []
    for key, value in fields.items():
        params.append(value)
        set_clauses.append(f"{key} = ${len(params)}")
    params.append(UUID(song_id))
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            f"""UPDATE guitar_songs_layout_settings SET {', '.join(set_clauses)}, updated_at = NOW()
                WHERE song_id = ${len(params)} RETURNING {_SETTINGS_FIELDS}""",
            *params,
        )
    return dict(row)


async def next_row_position(pool, song_id: str) -> int:
    async with pool.acquire() as conn:
        return await conn.fetchval(
            "SELECT COALESCE(MAX(position), 0) + 1 FROM guitar_songs_layout_rows "
            "WHERE song_id = $1 AND status = 'active'",
            UUID(song_id),
        )


async def row_position_before(pool, song_id: str, before_row_id: str, user_id: str) -> int:
    """Frees up `before_row_id`'s own position for a new row by pushing it and every row after
    it one slot further down -- position has no uniqueness constraint, so a single bulk shift
    is safe regardless of row processing order."""
    async with pool.acquire() as conn:
        async with conn.transaction():
            target_position = await conn.fetchval(
                "SELECT position FROM guitar_songs_layout_rows WHERE id = $1", UUID(before_row_id),
            )
            await conn.execute(
                """UPDATE guitar_songs_layout_rows SET position = position + 1, updated_by = $1::uuid, updated_at = NOW()
                   WHERE song_id = $2 AND status = 'active' AND position >= $3""",
                UUID(user_id), UUID(song_id), target_position,
            )
    return target_position


async def insert_row_with_columns(
    pool, song_id: str, position: int, page_break_before: bool, columns: list[dict], user_id: str
) -> tuple[str, list[str]]:
    """Returns (row_id, inserted_block_ids) -- the block ids are needed by copy_layout_from to
    remap linked_to_block_id from the source song's block ids to the newly-inserted ones."""
    async with pool.acquire() as conn:
        async with conn.transaction():
            row = await conn.fetchrow(
                """INSERT INTO guitar_songs_layout_rows (song_id, position, page_break_before, created_by, updated_by)
                   VALUES ($1, $2, $3, $4::uuid, $4::uuid) RETURNING id::text""",
                UUID(song_id), position, page_break_before, UUID(user_id),
            )
            row_id = row["id"]
            block_ids = await _insert_columns(conn, row_id, song_id, columns, user_id)
    return row_id, block_ids


async def _sections_block_ids_for_row(conn, row_id: str, status: str) -> list[str]:
    rows = await conn.fetch(
        """SELECT b.id::text AS id FROM guitar_songs_layout_column_blocks b
           JOIN guitar_songs_layout_columns c ON c.id = b.column_id
           WHERE c.row_id = $1 AND b.status = $2 AND b.block_type = 'sections'
           ORDER BY c.position, b.position""",
        UUID(row_id), status,
    )
    return [row["id"] for row in rows]


async def _remap_block_links_across_replace(conn, row_id: str, user_id: str, old_ids: list[str]) -> None:
    """replace_row archives and recreates EVERY block in the row on ANY edit to it, even one
    that has nothing to do with an existing 'sections' block (e.g. just adding a sibling column)
    -- so a block's id would otherwise churn on every unrelated edit. Content itself survives
    that churn for free (the client round-trips it as part of the block's own row), but a MIRROR
    (linked_to_block_id) is a foreign id, so any block anywhere in the song whose link named one
    of this row's just-archived 'sections' blocks -- including a block in THIS SAME row, whose
    pre-replace target id the client faithfully resent -- would otherwise dangle. This repoints
    every such link at whichever new 'sections' block now occupies the same ordinal position
    (1st, 2nd, ...) in the row; only a position with no successor (fewer 'sections' blocks after
    the edit) is left for _clear_links_to_archived_blocks to actually clear.

    `old_ids` must be exactly the row's 'sections' blocks that were active right before THIS call
    archived them -- never re-derived by querying status='archived' after the fact, since that
    would also match every 'sections' block any EARLIER replace_row call on this same row ever
    archived, which are still sitting there archived (nothing ever cleans them up). Once a row
    has been replaced more than once, that stale accumulation would pair old and new blocks
    incorrectly and point a mirror at the wrong sibling."""
    if not old_ids:
        return
    new_ids = await _sections_block_ids_for_row(conn, row_id, "active")
    for old_id, new_id in zip(old_ids, new_ids):
        await conn.execute(
            """UPDATE guitar_songs_layout_column_blocks SET linked_to_block_id = $1::uuid,
                   updated_by = $2::uuid, updated_at = NOW()
               WHERE linked_to_block_id = $3::uuid AND status = 'active'""",
            UUID(new_id), UUID(user_id), UUID(old_id),
        )


async def _clear_links_to_archived_blocks(conn, row_id: str, user_id: str) -> None:
    """Any active block still naming one of this row's now-archived 'sections' blocks as its
    linked_to_block_id loses its mirror rather than dangling -- it keeps its own (empty) content
    instead. Must run AFTER _remap_block_links_across_replace, so only a link whose target is
    genuinely gone (not just recreated with a new id by this same replace) is cleared."""
    await conn.execute(
        """UPDATE guitar_songs_layout_column_blocks SET linked_to_block_id = NULL,
               updated_by = $1::uuid, updated_at = NOW()
           WHERE status = 'active' AND linked_to_block_id IN (
               SELECT b.id FROM guitar_songs_layout_column_blocks b
               JOIN guitar_songs_layout_columns c ON c.id = b.column_id
               WHERE c.row_id = $2 AND b.status = 'archived'
           )""",
        UUID(user_id), UUID(row_id),
    )


async def replace_row(pool, row_id: str, song_id: str, page_break_before: bool, columns: list[dict], user_id: str) -> None:
    async with pool.acquire() as conn:
        async with conn.transaction():
            # Snapshotted before archiving anything -- see _remap_block_links_across_replace for
            # why this must not be re-derived from status='archived' after the fact.
            old_section_block_ids = await _sections_block_ids_for_row(conn, row_id, "active")
            await conn.execute(
                """UPDATE guitar_songs_layout_rows SET page_break_before = $1, updated_by = $2::uuid, updated_at = NOW()
                   WHERE id = $3""",
                page_break_before, UUID(user_id), UUID(row_id),
            )
            await conn.execute(
                "UPDATE guitar_songs_layout_columns SET status = 'archived', updated_by = $1::uuid, updated_at = NOW() "
                "WHERE row_id = $2 AND status = 'active'",
                UUID(user_id), UUID(row_id),
            )
            await conn.execute(
                """UPDATE guitar_songs_layout_column_blocks SET status = 'archived', updated_by = $1::uuid, updated_at = NOW()
                   WHERE status = 'active' AND column_id IN (SELECT id FROM guitar_songs_layout_columns WHERE row_id = $2)""",
                UUID(user_id), UUID(row_id),
            )
            await _insert_columns(conn, row_id, song_id, columns, user_id)
            await _remap_block_links_across_replace(conn, row_id, user_id, old_section_block_ids)
            await _clear_links_to_archived_blocks(conn, row_id, user_id)


async def _insert_columns(conn, row_id: str, song_id: str, columns: list[dict], user_id: str) -> list[str]:
    """Returns every inserted block's id, in the same row/column/position order as the input --
    needed by copy_layout_from to remap linked_to_block_id from source ids to newly-inserted ones."""
    inserted_block_ids: list[str] = []
    for position, column in enumerate(columns, start=1):
        column_row = await conn.fetchrow(
            """INSERT INTO guitar_songs_layout_columns (
                   row_id, song_id, position, width_twelfths, align,
                   padding_top_mm, padding_right_mm, padding_bottom_mm, padding_left_mm,
                   separator_left, separator_right,
                   created_by, updated_by
               ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::uuid, $12::uuid) RETURNING id::text""",
            UUID(row_id), UUID(song_id), position, column["width_twelfths"], column["align"],
            column["padding_top_mm"], column["padding_right_mm"], column["padding_bottom_mm"], column["padding_left_mm"],
            column["separator_left"], column["separator_right"],
            UUID(user_id),
        )
        column_id = column_row["id"]
        for block_position, block in enumerate(column["blocks"], start=1):
            custom_document_id = block.get("custom_document_id")
            chord_grid_rows = block.get("chord_grid_rows")
            lyrics_words = block.get("lyrics_words")
            linked_to_block_id = block.get("linked_to_block_id")
            chords = block.get("chords")
            block_row = await conn.fetchrow(
                """INSERT INTO guitar_songs_layout_column_blocks
                       (column_id, song_id, position, block_type, width_twelfths, zoom_percent, show_card,
                        title_heading_level, padding_top_mm, padding_right_mm, padding_bottom_mm, padding_left_mm,
                        custom_title, custom_document_id, chord_grid_rows, chord_grid_chord_size_px,
                        lyrics_text, lyrics_words, linked_to_block_id, chords,
                        created_by, updated_by)
                   VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15::jsonb, $16, $17,
                           $18::jsonb, $19, $20::jsonb, $21::uuid, $21::uuid)
                   RETURNING id::text""",
                UUID(column_id), UUID(song_id), block_position, block["block_type"], block["width_twelfths"],
                block["zoom_percent"], block["show_card"], block["title_heading_level"],
                block.get("padding_top_mm", 0), block.get("padding_right_mm", 0),
                block.get("padding_bottom_mm", 0), block.get("padding_left_mm", 0),
                block.get("custom_title"),
                UUID(custom_document_id) if custom_document_id else None,
                json.dumps(chord_grid_rows) if chord_grid_rows is not None else None,
                block.get("chord_grid_chord_size_px", 18),
                block.get("lyrics_text"),
                json.dumps(lyrics_words) if lyrics_words is not None else None,
                UUID(linked_to_block_id) if linked_to_block_id else None,
                json.dumps(chords) if chords is not None else None,
                UUID(user_id),
            )
            inserted_block_ids.append(block_row["id"])
    return inserted_block_ids


async def archive_row(pool, row_id: str, user_id: str) -> None:
    async with pool.acquire() as conn:
        async with conn.transaction():
            await conn.execute(
                "UPDATE guitar_songs_layout_rows SET status = 'archived', updated_by = $1::uuid, updated_at = NOW() "
                "WHERE id = $2",
                UUID(user_id), UUID(row_id),
            )
            await conn.execute(
                "UPDATE guitar_songs_layout_columns SET status = 'archived', updated_by = $1::uuid, updated_at = NOW() "
                "WHERE row_id = $2 AND status = 'active'",
                UUID(user_id), UUID(row_id),
            )
            await conn.execute(
                """UPDATE guitar_songs_layout_column_blocks SET status = 'archived', updated_by = $1::uuid, updated_at = NOW()
                   WHERE status = 'active' AND column_id IN (SELECT id FROM guitar_songs_layout_columns WHERE row_id = $2)""",
                UUID(user_id), UUID(row_id),
            )
            await _clear_links_to_archived_blocks(conn, row_id, user_id)


async def fetch_block(pool, block_id: str) -> dict | None:
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            f"SELECT {_BLOCK_FIELDS} FROM guitar_songs_layout_column_blocks WHERE id = $1",
            UUID(block_id),
        )
    return _deserialize_block(row) if row else None


async def fetch_block_context(pool, block_id: str) -> dict | None:
    """A block's own fields plus its song's project_id, for access checks."""
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """SELECT b.id::text, b.block_type, b.custom_document_id::text, b.song_id::text,
                      s.project_id::text AS project_id
               FROM guitar_songs_layout_column_blocks b
               JOIN guitar_songs s ON s.id = b.song_id
               WHERE b.id = $1""",
            UUID(block_id),
        )
    return dict(row) if row else None


async def update_block_title(pool, block_id: str, custom_title: str | None, user_id: str) -> None:
    async with pool.acquire() as conn:
        await conn.execute(
            """UPDATE guitar_songs_layout_column_blocks SET custom_title = $1, updated_by = $2::uuid, updated_at = NOW()
               WHERE id = $3""",
            custom_title, UUID(user_id), UUID(block_id),
        )


async def update_block_chord_grid_rows(pool, block_id: str, chord_grid_rows: list | None, user_id: str) -> None:
    async with pool.acquire() as conn:
        await conn.execute(
            """UPDATE guitar_songs_layout_column_blocks SET chord_grid_rows = $1::jsonb, updated_by = $2::uuid,
                   updated_at = NOW()
               WHERE id = $3""",
            json.dumps(chord_grid_rows) if chord_grid_rows is not None else None, UUID(user_id), UUID(block_id),
        )


async def update_block_chord_grid_chord_size_px(pool, block_id: str, chord_grid_chord_size_px: int, user_id: str) -> None:
    async with pool.acquire() as conn:
        await conn.execute(
            """UPDATE guitar_songs_layout_column_blocks SET chord_grid_chord_size_px = $1, updated_by = $2::uuid,
                   updated_at = NOW()
               WHERE id = $3""",
            chord_grid_chord_size_px, UUID(user_id), UUID(block_id),
        )


async def update_block_chords(pool, block_id: str, chords: list | None, user_id: str) -> None:
    async with pool.acquire() as conn:
        await conn.execute(
            """UPDATE guitar_songs_layout_column_blocks SET chords = $1::jsonb, updated_by = $2::uuid,
                   updated_at = NOW()
               WHERE id = $3""",
            json.dumps(chords) if chords is not None else None, UUID(user_id), UUID(block_id),
        )


async def sections_block_exists(pool, song_id: str, block_id: str) -> bool:
    async with pool.acquire() as conn:
        return await conn.fetchval(
            """SELECT 1 FROM guitar_songs_layout_column_blocks
               WHERE id = $1 AND song_id = $2 AND block_type = 'sections' AND status = 'active'""",
            UUID(block_id), UUID(song_id),
        ) is not None


async def update_block_lyrics(pool, block_id: str, lyrics_text: str | None, lyrics_words: list, user_id: str) -> None:
    async with pool.acquire() as conn:
        await conn.execute(
            """UPDATE guitar_songs_layout_column_blocks SET lyrics_text = $1, lyrics_words = $2::jsonb,
                   updated_by = $3::uuid, updated_at = NOW()
               WHERE id = $4""",
            lyrics_text, json.dumps(lyrics_words), UUID(user_id), UUID(block_id),
        )


async def update_block_lyrics_words(pool, block_id: str, lyrics_words: list, user_id: str) -> None:
    async with pool.acquire() as conn:
        await conn.execute(
            """UPDATE guitar_songs_layout_column_blocks SET lyrics_words = $1::jsonb, updated_by = $2::uuid,
                   updated_at = NOW()
               WHERE id = $3""",
            json.dumps(lyrics_words), UUID(user_id), UUID(block_id),
        )


async def update_block_link(pool, block_id: str, linked_to_block_id: str | None, user_id: str) -> None:
    async with pool.acquire() as conn:
        await conn.execute(
            """UPDATE guitar_songs_layout_column_blocks SET linked_to_block_id = $1::uuid, updated_by = $2::uuid,
                   updated_at = NOW()
               WHERE id = $3""",
            UUID(linked_to_block_id) if linked_to_block_id else None, UUID(user_id), UUID(block_id),
        )


async def clear_block_sections_content(pool, block_id: str, user_id: str) -> None:
    """A block that just became a link never stores its own content -- clears whatever it had
    before linking, so the read response (which substitutes the target's content) never leaves
    stale content sitting underneath a link that would resurface if the link were removed."""
    async with pool.acquire() as conn:
        await conn.execute(
            """UPDATE guitar_songs_layout_column_blocks
                   SET lyrics_text = NULL, lyrics_words = NULL,
                       updated_by = $1::uuid, updated_at = NOW()
               WHERE id = $2""",
            UUID(user_id), UUID(block_id),
        )


async def fetch_active_block_types(pool, song_id: str, exclude_row_id: str | None = None) -> set[str]:
    query = (
        "SELECT b.block_type FROM guitar_songs_layout_column_blocks b "
        "JOIN guitar_songs_layout_columns c ON c.id = b.column_id "
        "WHERE b.song_id = $1 AND b.status = 'active' AND b.block_type != 'custom'"
    )
    params: list = [UUID(song_id)]
    if exclude_row_id:
        query += " AND c.row_id != $2"
        params.append(UUID(exclude_row_id))
    async with pool.acquire() as conn:
        rows = await conn.fetch(query, *params)
    return {row["block_type"] for row in rows}


async def fetch_rows_sorted(pool, song_id: str) -> list[dict]:
    return await position_utils.fetch_ids_sorted_by_position(pool, "guitar_songs_layout_rows", "song_id", song_id)


async def swap_row_positions(pool, id_a: str, id_b: str, user_id: str) -> None:
    await position_utils.swap_positions(pool, "guitar_songs_layout_rows", id_a, id_b, user_id)
