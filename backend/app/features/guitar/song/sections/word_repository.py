import json
from uuid import UUID

_CHORD_FIELDS = """
    c.id::text AS chord_id, c.name AS chord_name, c.root_note AS chord_root_note,
    c.description AS chord_description, c.frets AS chord_frets, c.status AS chord_status,
    c.created_at AS chord_created_at, c.updated_at AS chord_updated_at,
    c.created_by::text AS chord_created_by, c.updated_by::text AS chord_updated_by
"""


def _chord_from_row(row) -> dict:
    return {
        "id": row["chord_id"], "name": row["chord_name"], "root_note": row["chord_root_note"],
        "description": row["chord_description"], "frets": json.loads(row["chord_frets"]),
        "status": row["chord_status"], "created_at": row["chord_created_at"],
        "updated_at": row["chord_updated_at"], "created_by": row["chord_created_by"],
        "updated_by": row["chord_updated_by"],
    }


def _row_to_word_dict(row, chords: dict[str, dict]) -> dict:
    return {
        "id": row["id"], "line_index": row["line_index"], "word_index": row["word_index"],
        "text": row["word_text"], "chords": chords,
    }


async def fetch_word_context(pool, word_id: str) -> dict | None:
    """A word's own fields plus its song's project_id, for access checks."""
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """SELECT w.id::text, w.section_id::text, sec.song_id::text, s.project_id::text AS project_id
               FROM guitar_songs_section_words w
               JOIN guitar_songs_sections sec ON sec.id = w.section_id
               JOIN guitar_songs s ON s.id = sec.song_id
               WHERE w.id = $1""",
            UUID(word_id),
        )
    return dict(row) if row else None


async def _fetch_chords_by_word(conn, word_ids: list[str]) -> dict[str, dict[str, dict]]:
    if not word_ids:
        return {}
    rows = await conn.fetch(
        f"""SELECT wc.word_id::text, wc.position, {_CHORD_FIELDS}
            FROM guitar_songs_section_word_chords wc
            JOIN guitar_chords c ON c.id = wc.chord_id
            WHERE wc.word_id = ANY($1::uuid[])""",
        [UUID(wid) for wid in word_ids],
    )
    by_word: dict[str, dict[str, dict]] = {}
    for row in rows:
        by_word.setdefault(row["word_id"], {})[row["position"]] = _chord_from_row(row)
    return by_word


async def fetch_section_words(pool, section_id: str) -> list[dict]:
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            "SELECT id::text, line_index, word_index, word_text FROM guitar_songs_section_words "
            "WHERE section_id = $1 ORDER BY line_index ASC, word_index ASC",
            UUID(section_id),
        )
        chords_by_word = await _fetch_chords_by_word(conn, [row["id"] for row in rows])
    return [_row_to_word_dict(row, chords_by_word.get(row["id"], {})) for row in rows]


async def fetch_section_word(pool, word_id: str) -> dict | None:
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT id::text, line_index, word_index, word_text FROM guitar_songs_section_words WHERE id = $1",
            UUID(word_id),
        )
        if not row:
            return None
        chords_by_word = await _fetch_chords_by_word(conn, [row["id"]])
    return _row_to_word_dict(row, chords_by_word.get(row["id"], {}))


async def delete_section_words(pool, section_id: str) -> None:
    async with pool.acquire() as conn:
        await conn.execute("DELETE FROM guitar_songs_section_words WHERE section_id = $1", UUID(section_id))


async def insert_section_word(
    pool, section_id: str, line_index: int, word_index: int, word_text: str, user_id: str
) -> str:
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """INSERT INTO guitar_songs_section_words
                   (section_id, line_index, word_index, word_text, created_by, updated_by)
               VALUES ($1, $2, $3, $4, $5::uuid, $5::uuid) RETURNING id::text""",
            UUID(section_id), line_index, word_index, word_text, UUID(user_id),
        )
    return row["id"]


async def set_word_chord_at_position(pool, word_id: str, position: str, chord_id: str | None, user_id: str) -> None:
    async with pool.acquire() as conn:
        if chord_id:
            await conn.execute(
                """INSERT INTO guitar_songs_section_word_chords (word_id, position, chord_id, created_by, updated_by)
                   VALUES ($1, $2, $3, $4::uuid, $4::uuid)
                   ON CONFLICT (word_id, position) DO UPDATE
                       SET chord_id = $3, updated_by = $4::uuid, updated_at = NOW()""",
                UUID(word_id), position, UUID(chord_id), UUID(user_id),
            )
        else:
            await conn.execute(
                "DELETE FROM guitar_songs_section_word_chords WHERE word_id = $1 AND position = $2",
                UUID(word_id), position,
            )
