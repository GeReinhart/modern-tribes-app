import json
from uuid import UUID

from app.features.guitar.song import position_utils

_SECTION_SELECT_FIELDS = (
    "id::text, song_id::text, position, type_label, custom_label, content_mode, lyrics_text, status, "
    "created_at, updated_at, created_by::text, updated_by::text"
)

_SECTION_CHORD_JOIN_SELECT = """
    sc.id::text, sc.section_id::text, sc.position,
    c.id::text AS chord_id, c.name AS chord_name, c.root_note AS chord_root_note,
    c.description AS chord_description, c.frets AS chord_frets, c.status AS chord_status,
    c.created_at AS chord_created_at, c.updated_at AS chord_updated_at,
    c.created_by::text AS chord_created_by, c.updated_by::text AS chord_updated_by
"""


async def fetch_section_context(pool, section_id: str) -> dict | None:
    """A section's own fields plus its song's project_id, for access checks."""
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """SELECT sec.id::text, sec.song_id::text, sec.content_mode, sec.status,
                      s.project_id::text AS project_id
               FROM guitar_songs_sections sec JOIN guitar_songs s ON s.id = sec.song_id
               WHERE sec.id = $1""",
            UUID(section_id),
        )
    return dict(row) if row else None


async def fetch_section_chord_context(pool, section_chord_id: str) -> dict | None:
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """SELECT sc.id::text, sc.section_id::text, sec.song_id::text, s.project_id::text AS project_id
               FROM guitar_songs_section_chords sc
               JOIN guitar_songs_sections sec ON sec.id = sc.section_id
               JOIN guitar_songs s ON s.id = sec.song_id
               WHERE sc.id = $1""",
            UUID(section_chord_id),
        )
    return dict(row) if row else None


async def fetch_sections(pool, song_id: str) -> list[dict]:
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            f"SELECT {_SECTION_SELECT_FIELDS} FROM guitar_songs_sections "
            "WHERE song_id = $1 AND status = 'active' ORDER BY position ASC",
            UUID(song_id),
        )
    return [dict(row) for row in rows]


async def fetch_section(pool, section_id: str) -> dict | None:
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            f"SELECT {_SECTION_SELECT_FIELDS} FROM guitar_songs_sections WHERE id = $1", UUID(section_id)
        )
    return dict(row) if row else None


async def next_section_position(pool, song_id: str) -> int:
    async with pool.acquire() as conn:
        return await conn.fetchval(
            "SELECT COALESCE(MAX(position), 0) + 1 FROM guitar_songs_sections WHERE song_id = $1 AND status = 'active'",
            UUID(song_id),
        )


async def insert_section(
    pool, song_id: str, position: int, type_label: str, custom_label: str | None, content_mode: str, user_id: str
) -> str:
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """INSERT INTO guitar_songs_sections (song_id, position, type_label, custom_label, content_mode,
                                                   created_by, updated_by)
               VALUES ($1, $2, $3, $4, $5, $6::uuid, $6::uuid) RETURNING id::text""",
            UUID(song_id), position, type_label, custom_label, content_mode, UUID(user_id),
        )
    return row["id"]


async def update_section(pool, section_id: str, updates: dict, user_id: str) -> None:
    if not updates:
        return
    fields = {**updates, "updated_by": UUID(user_id)}
    set_clauses = []
    params: list = []
    for key, value in fields.items():
        params.append(value)
        set_clauses.append(f"{key} = ${len(params)}")
    params.append(UUID(section_id))
    async with pool.acquire() as conn:
        await conn.execute(
            f"UPDATE guitar_songs_sections SET {', '.join(set_clauses)}, updated_at = NOW() "
            f"WHERE id = ${len(params)}",
            *params,
        )


async def update_section_lyrics_text(pool, section_id: str, text: str, user_id: str) -> None:
    async with pool.acquire() as conn:
        await conn.execute(
            "UPDATE guitar_songs_sections SET lyrics_text = $1, updated_by = $2::uuid, updated_at = NOW() "
            "WHERE id = $3",
            text, UUID(user_id), UUID(section_id),
        )


async def archive_section(pool, section_id: str, user_id: str) -> None:
    async with pool.acquire() as conn:
        await conn.execute(
            "UPDATE guitar_songs_sections SET status = 'archived', updated_by = $1::uuid, updated_at = NOW() "
            "WHERE id = $2",
            UUID(user_id), UUID(section_id),
        )


async def fetch_sections_sorted(pool, song_id: str) -> list[dict]:
    return await position_utils.fetch_ids_sorted_by_position(pool, "guitar_songs_sections", "song_id", song_id)


async def swap_section_positions(pool, id_a: str, id_b: str, user_id: str) -> None:
    await position_utils.swap_positions(pool, "guitar_songs_sections", id_a, id_b, user_id)


def _row_to_section_chord_dict(row) -> dict:
    return {
        "id": row["id"], "section_id": row["section_id"], "position": row["position"],
        "chord": {
            "id": row["chord_id"], "name": row["chord_name"], "root_note": row["chord_root_note"],
            "description": row["chord_description"], "frets": json.loads(row["chord_frets"]),
            "status": row["chord_status"], "created_at": row["chord_created_at"],
            "updated_at": row["chord_updated_at"], "created_by": row["chord_created_by"],
            "updated_by": row["chord_updated_by"],
        },
    }


async def fetch_section_chords(pool, section_id: str) -> list[dict]:
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            f"""SELECT {_SECTION_CHORD_JOIN_SELECT} FROM guitar_songs_section_chords sc
                JOIN guitar_chords c ON c.id = sc.chord_id
                WHERE sc.section_id = $1 AND sc.status = 'active'
                ORDER BY sc.position ASC""",
            UUID(section_id),
        )
    return [_row_to_section_chord_dict(row) for row in rows]


async def fetch_section_chord(pool, section_chord_id: str) -> dict | None:
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            f"""SELECT {_SECTION_CHORD_JOIN_SELECT} FROM guitar_songs_section_chords sc
                JOIN guitar_chords c ON c.id = sc.chord_id
                WHERE sc.id = $1""",
            UUID(section_chord_id),
        )
    return _row_to_section_chord_dict(row) if row else None


async def next_section_chord_position(pool, section_id: str) -> int:
    async with pool.acquire() as conn:
        return await conn.fetchval(
            "SELECT COALESCE(MAX(position), 0) + 1 FROM guitar_songs_section_chords "
            "WHERE section_id = $1 AND status = 'active'",
            UUID(section_id),
        )


async def insert_section_chord(pool, section_id: str, chord_id: str, position: int, user_id: str) -> str:
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """INSERT INTO guitar_songs_section_chords (section_id, chord_id, position, created_by, updated_by)
               VALUES ($1, $2, $3, $4::uuid, $4::uuid) RETURNING id::text""",
            UUID(section_id), UUID(chord_id), position, UUID(user_id),
        )
    return row["id"]


async def fetch_section_chords_sorted(pool, section_id: str) -> list[dict]:
    return await position_utils.fetch_ids_sorted_by_position(
        pool, "guitar_songs_section_chords", "section_id", section_id
    )


async def swap_section_chord_positions(pool, id_a: str, id_b: str, user_id: str) -> None:
    await position_utils.swap_positions(pool, "guitar_songs_section_chords", id_a, id_b, user_id)


async def delete_section_chord(pool, section_chord_id: str) -> None:
    async with pool.acquire() as conn:
        await conn.execute("DELETE FROM guitar_songs_section_chords WHERE id = $1", UUID(section_chord_id))
