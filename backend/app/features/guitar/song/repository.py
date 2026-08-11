from uuid import UUID

_SONG_SELECT_FIELDS = (
    "id::text, url_param_id, project_id::text, title, author_id::text, tempo_bpm, beats_per_bar, capo, "
    "chord_diagram_style, chord_diagram_size, "
    "lyrics_line_spacing_px, lyrics_text_size_px, lyrics_chord_size_px, document_id::text, "
    "song_state, difficulty, status, "
    "created_at, updated_at, created_by::text, updated_by::text"
)

_SONG_JOIN_SELECT_FIELDS = (
    "s.id::text, s.url_param_id, s.project_id::text, s.title, s.author_id::text, s.tempo_bpm, s.beats_per_bar, "
    "s.capo, s.chord_diagram_style, s.chord_diagram_size, "
    "s.lyrics_line_spacing_px, s.lyrics_text_size_px, s.lyrics_chord_size_px, s.document_id::text, "
    "s.song_state, s.difficulty, s.status, "
    "s.created_at, s.updated_at, s.created_by::text, s.updated_by::text, a.name AS author_name"
)

# One row per (song, distinct chord) pair used anywhere in a song's 'chords' blocks -- the same
# dedup-by-chord_id semantics as layout.service.collect_song_chords_union, but computed in SQL
# across every song in the list at once instead of one Python layout traversal per song.
_SONG_CHORD_STATS_CTE = """
    WITH song_chord_pairs AS (
        SELECT b.song_id, (elem->>'chord_id')::uuid AS chord_id
        FROM guitar_songs_layout_column_blocks b
        CROSS JOIN LATERAL jsonb_array_elements(b.chords) AS elem
        WHERE b.block_type = 'chords' AND b.status = 'active' AND b.chords IS NOT NULL
        GROUP BY b.song_id, (elem->>'chord_id')::uuid
    ),
    song_chord_stats AS (
        SELECT scp.song_id,
               COUNT(*)::int AS chord_count,
               COUNT(*) FILTER (WHERE gc.difficulty >= 4)::int AS difficult_chord_count
        FROM song_chord_pairs scp
        LEFT JOIN guitar_chords gc ON gc.id = scp.chord_id
        GROUP BY scp.song_id
    )
"""


async def get_project_id_for_song(pool, song_id: str) -> str | None:
    async with pool.acquire() as conn:
        row = await conn.fetchrow("SELECT project_id FROM guitar_songs WHERE id = $1", UUID(song_id))
    return str(row["project_id"]) if row else None


def _lyrics_search_condition(param_index: int) -> str:
    """Matches the search text against the song's title, author name, or any of its
    'sections' (lyrics & chords) blocks -- the literal meaning of "paroles"."""
    return (
        f"(s.title ILIKE ${param_index} OR a.name ILIKE ${param_index} OR EXISTS ("
        "SELECT 1 FROM guitar_songs_layout_column_blocks b WHERE b.song_id = s.id "
        f"AND b.block_type = 'sections' AND b.status = 'active' AND b.lyrics_text ILIKE ${param_index}))"
    )


def _song_filter_conditions(
    params: list, q: str | None, label_ids: list[str] | None, song_states: list[str] | None,
    difficulties: list[int] | None,
) -> list[str]:
    conditions = []
    if q:
        params.append(f"%{q}%")
        conditions.append(_lyrics_search_condition(len(params)))
    if song_states:
        params.append(song_states)
        conditions.append(f"s.song_state = ANY(${len(params)})")
    if difficulties:
        params.append(difficulties)
        conditions.append(f"(s.difficulty = ANY(${len(params)}) OR s.difficulty IS NULL)")
    if label_ids:
        params.append([UUID(label_id) for label_id in label_ids])
        conditions.append(
            "EXISTS (SELECT 1 FROM label_entities le WHERE le.entity_type = 'guitar_song' "
            f"AND le.entity_id = s.id AND le.label_id = ANY(${len(params)}))"
        )
    return conditions


async def fetch_songs(
    pool, project_id: str, user_id: str, q: str | None = None, label_ids: list[str] | None = None,
    song_states: list[str] | None = None, difficulties: list[int] | None = None,
    masteries: list[int] | None = None,
) -> list[dict]:
    params: list = [UUID(project_id)]
    conditions = ["s.project_id = $1", "s.status = 'active'"]
    conditions += _song_filter_conditions(params, q, label_ids, song_states, difficulties)
    params.append(UUID(user_id))
    mastery_user_param = len(params)
    if masteries:
        params.append(masteries)
        conditions.append(f"(gsm.mastery_level = ANY(${len(params)}) OR gsm.mastery_level IS NULL)")
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            f"""{_SONG_CHORD_STATS_CTE}
                SELECT {_SONG_JOIN_SELECT_FIELDS},
                       COALESCE(scs.chord_count, 0) AS chord_count,
                       COALESCE(scs.difficult_chord_count, 0) AS difficult_chord_count,
                       gsm.mastery_level AS my_mastery
                FROM guitar_songs s
                LEFT JOIN guitar_song_author a ON a.id = s.author_id
                LEFT JOIN song_chord_stats scs ON scs.song_id = s.id
                LEFT JOIN guitar_songs_mastery gsm
                    ON gsm.song_id = s.id AND gsm.user_id = ${mastery_user_param} AND gsm.status = 'active'
                WHERE {' AND '.join(conditions)}
                ORDER BY s.title ASC, s.created_at ASC""",
            *params,
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


