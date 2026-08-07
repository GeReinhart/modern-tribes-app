import json
from uuid import UUID

from app.features.guitar.song import position_utils

_SONG_SELECT_FIELDS = (
    "id::text, url_param_id, project_id::text, title, author_id::text, tempo_bpm, beats_per_bar, capo, "
    "chord_diagram_style, chord_diagram_size, "
    "lyrics_line_spacing_px, lyrics_text_size_px, lyrics_chord_size_px, document_id::text, status, "
    "created_at, updated_at, created_by::text, updated_by::text"
)

_SONG_JOIN_SELECT_FIELDS = (
    "s.id::text, s.url_param_id, s.project_id::text, s.title, s.author_id::text, s.tempo_bpm, s.beats_per_bar, "
    "s.capo, s.chord_diagram_style, s.chord_diagram_size, "
    "s.lyrics_line_spacing_px, s.lyrics_text_size_px, s.lyrics_chord_size_px, s.document_id::text, s.status, "
    "s.created_at, s.updated_at, s.created_by::text, s.updated_by::text, a.name AS author_name"
)

_SONG_CHORD_JOIN_SELECT = """
    sc.id::text, sc.song_id::text, sc.position, sc.comment, sc.status,
    sc.created_at, sc.updated_at, sc.created_by::text, sc.updated_by::text,
    c.id::text AS chord_id, c.name AS chord_name, c.root_note AS chord_root_note,
    c.description AS chord_description, c.frets AS chord_frets, c.status AS chord_status,
    c.created_at AS chord_created_at, c.updated_at AS chord_updated_at,
    c.created_by::text AS chord_created_by, c.updated_by::text AS chord_updated_by
"""


async def get_project_id_for_song(pool, song_id: str) -> str | None:
    async with pool.acquire() as conn:
        row = await conn.fetchrow("SELECT project_id FROM guitar_songs WHERE id = $1", UUID(song_id))
    return str(row["project_id"]) if row else None


async def fetch_song_chord_context(pool, song_chord_id: str) -> dict | None:
    """Fetch a song-chord link's own fields plus its song's project_id, for access checks."""
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """SELECT sc.id::text, sc.song_id::text, sc.chord_id::text, sc.position, sc.status,
                      s.project_id::text AS project_id
               FROM guitar_songs_chords sc JOIN guitar_songs s ON s.id = sc.song_id
               WHERE sc.id = $1""",
            UUID(song_chord_id),
        )
    return dict(row) if row else None


async def fetch_songs(pool, project_id: str) -> list[dict]:
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            f"""SELECT {_SONG_JOIN_SELECT_FIELDS} FROM guitar_songs s
                LEFT JOIN guitar_song_author a ON a.id = s.author_id
                WHERE s.project_id = $1 AND s.status = 'active'
                ORDER BY s.title ASC, s.created_at ASC""",
            UUID(project_id),
        )
    return [dict(row) for row in rows]


async def fetch_song(pool, song_id: str) -> dict | None:
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            f"""SELECT {_SONG_JOIN_SELECT_FIELDS} FROM guitar_songs s
                LEFT JOIN guitar_song_author a ON a.id = s.author_id
                WHERE s.id = $1""",
            UUID(song_id),
        )
    return dict(row) if row else None


async def insert_song(
    pool, project_id: str, url_param_id: str, title: str, author_id: str | None,
    tempo_bpm: int, beats_per_bar: int, capo: int,
    chord_diagram_style: str, chord_diagram_size: str,
    lyrics_line_spacing_px: int, lyrics_text_size_px: int, lyrics_chord_size_px: int,
    document_id: str | None, user_id: str,
) -> dict:
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            f"""INSERT INTO guitar_songs (
                    project_id, url_param_id, title, author_id, tempo_bpm, beats_per_bar, capo,
                    chord_diagram_style, chord_diagram_size,
                    lyrics_line_spacing_px, lyrics_text_size_px, lyrics_chord_size_px,
                    document_id, created_by, updated_by
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14::uuid, $14::uuid)
                RETURNING {_SONG_SELECT_FIELDS}""",
            UUID(project_id), url_param_id, title, UUID(author_id) if author_id else None,
            tempo_bpm, beats_per_bar, capo,
            chord_diagram_style, chord_diagram_size,
            lyrics_line_spacing_px, lyrics_text_size_px, lyrics_chord_size_px,
            UUID(document_id) if document_id else None, UUID(user_id),
        )
    return dict(row)


async def set_song_document(pool, song_id: str, document_id: str, user_id: str) -> dict:
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            f"""UPDATE guitar_songs SET document_id = $1, updated_by = $2, updated_at = NOW()
                WHERE id = $3 RETURNING {_SONG_SELECT_FIELDS}""",
            UUID(document_id), UUID(user_id), UUID(song_id),
        )
    return dict(row)


async def set_song_author(pool, song_id: str, author_id: str | None, user_id: str) -> None:
    async with pool.acquire() as conn:
        await conn.execute(
            "UPDATE guitar_songs SET author_id = $1, updated_by = $2::uuid, updated_at = NOW() WHERE id = $3",
            UUID(author_id) if author_id else None, UUID(user_id), UUID(song_id),
        )


async def update_song(pool, song_id: str, updates: dict, user_id: str) -> dict | None:
    if not updates:
        return await fetch_song(pool, song_id)
    fields = {**updates, "updated_by": UUID(user_id)}
    set_clauses = []
    params: list = []
    for key, value in fields.items():
        params.append(value)
        set_clauses.append(f"{key} = ${len(params)}")
    params.append(UUID(song_id))
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            f"UPDATE guitar_songs SET {', '.join(set_clauses)}, updated_at = NOW() "
            f"WHERE id = ${len(params)} RETURNING {_SONG_SELECT_FIELDS}",
            *params,
        )
    return dict(row) if row else None


async def archive_song(pool, song_id: str, user_id: str) -> None:
    async with pool.acquire() as conn:
        await conn.execute(
            "UPDATE guitar_songs SET status = 'archived', updated_by = $1::uuid, updated_at = NOW() WHERE id = $2::uuid",
            UUID(user_id), UUID(song_id),
        )


def _row_to_song_chord_dict(row) -> dict:
    return {
        "id": row["id"], "song_id": row["song_id"], "position": row["position"],
        "comment": row["comment"], "status": row["status"],
        "created_at": row["created_at"], "updated_at": row["updated_at"],
        "created_by": row["created_by"], "updated_by": row["updated_by"],
        "chord": {
            "id": row["chord_id"], "name": row["chord_name"], "root_note": row["chord_root_note"],
            "description": row["chord_description"], "frets": json.loads(row["chord_frets"]),
            "status": row["chord_status"], "created_at": row["chord_created_at"],
            "updated_at": row["chord_updated_at"], "created_by": row["chord_created_by"],
            "updated_by": row["chord_updated_by"],
        },
    }


async def fetch_song_chords(pool, song_id: str) -> list[dict]:
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            f"""SELECT {_SONG_CHORD_JOIN_SELECT} FROM guitar_songs_chords sc
                JOIN guitar_chords c ON c.id = sc.chord_id
                WHERE sc.song_id = $1 AND sc.status = 'active'
                ORDER BY sc.position ASC""",
            UUID(song_id),
        )
    return [_row_to_song_chord_dict(row) for row in rows]


async def fetch_song_chord(pool, song_chord_id: str) -> dict | None:
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            f"""SELECT {_SONG_CHORD_JOIN_SELECT} FROM guitar_songs_chords sc
                JOIN guitar_chords c ON c.id = sc.chord_id
                WHERE sc.id = $1""",
            UUID(song_chord_id),
        )
    return _row_to_song_chord_dict(row) if row else None


async def find_song_chord_pair(pool, song_id: str, chord_id: str) -> dict | None:
    """Find an existing song-chord link for a (song_id, chord_id) pair, regardless of status."""
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT id::text, position, status FROM guitar_songs_chords WHERE song_id = $1 AND chord_id = $2",
            UUID(song_id), UUID(chord_id),
        )
    return dict(row) if row else None


async def next_song_chord_position(pool, song_id: str) -> int:
    async with pool.acquire() as conn:
        value = await conn.fetchval(
            "SELECT COALESCE(MAX(position), 0) + 1 FROM guitar_songs_chords WHERE song_id = $1 AND status = 'active'",
            UUID(song_id),
        )
    return value


async def insert_song_chord(
    pool, song_id: str, chord_id: str, position: int, comment: str | None, user_id: str
) -> str:
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """INSERT INTO guitar_songs_chords (song_id, chord_id, position, comment, created_by, updated_by)
               VALUES ($1, $2, $3, $4, $5::uuid, $5::uuid) RETURNING id::text""",
            UUID(song_id), UUID(chord_id), position, comment, UUID(user_id),
        )
    return row["id"]


async def reactivate_song_chord(pool, song_chord_id: str, position: int, comment: str | None, user_id: str) -> None:
    async with pool.acquire() as conn:
        await conn.execute(
            """UPDATE guitar_songs_chords SET status = 'active', position = $1, comment = $2, updated_by = $3::uuid
               WHERE id = $4""",
            position, comment, UUID(user_id), UUID(song_chord_id),
        )


async def update_song_chord_comment(pool, song_chord_id: str, comment: str | None, user_id: str) -> None:
    async with pool.acquire() as conn:
        await conn.execute(
            "UPDATE guitar_songs_chords SET comment = $1, updated_by = $2::uuid WHERE id = $3",
            comment, UUID(user_id), UUID(song_chord_id),
        )


async def archive_song_chord(pool, song_chord_id: str, user_id: str) -> None:
    async with pool.acquire() as conn:
        await conn.execute(
            "UPDATE guitar_songs_chords SET status = 'archived', updated_by = $1::uuid, updated_at = NOW() WHERE id = $2::uuid",
            UUID(user_id), UUID(song_chord_id),
        )


async def fetch_song_chords_sorted(pool, song_id: str) -> list[dict]:
    return await position_utils.fetch_ids_sorted_by_position(pool, "guitar_songs_chords", "song_id", song_id)


async def swap_song_chord_positions(pool, id_a: str, id_b: str, user_id: str) -> None:
    await position_utils.swap_positions(pool, "guitar_songs_chords", id_a, id_b, user_id)
