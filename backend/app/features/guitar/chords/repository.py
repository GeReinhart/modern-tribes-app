import json
from uuid import UUID

_SELECT_FIELDS = (
    "id::text, name, root_note, description, frets, status, "
    "created_at, updated_at, created_by::text, updated_by::text"
)


async def fetch_chords(pool, search: str | None, root_note: str | None) -> list[dict]:
    conditions = ["status = 'active'"]
    params: list = []
    if search:
        params.append(f"%{search}%")
        conditions.append(f"name ILIKE ${len(params)}")
    if root_note:
        params.append(root_note)
        conditions.append(f"root_note = ${len(params)}")
    where_clause = " AND ".join(conditions)
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            f"SELECT {_SELECT_FIELDS} FROM guitar_chords WHERE {where_clause} "
            "ORDER BY name ASC, created_at ASC",
            *params,
        )
    return [_row_to_dict(row) for row in rows]


async def fetch_chord(pool, chord_id: str) -> dict | None:
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            f"SELECT {_SELECT_FIELDS} FROM guitar_chords WHERE id = $1",
            UUID(chord_id),
        )
    return _row_to_dict(row) if row else None


async def fetch_chords_by_ids(pool, chord_ids: set[str]) -> dict[str, dict]:
    """Bulk-resolve chord ids referenced inline in another feature's JSONB content (e.g. a
    layout block's lyrics_words), keyed by id, to avoid an N+1 per reference."""
    if not chord_ids:
        return {}
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            f"SELECT {_SELECT_FIELDS} FROM guitar_chords WHERE id = ANY($1::uuid[])",
            [UUID(chord_id) for chord_id in chord_ids],
        )
    return {row["id"]: _row_to_dict(row) for row in rows}


async def insert_chord(
    pool, name: str, root_note: str, description: str | None, frets: list, user_id: str
) -> dict:
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            f"""
            INSERT INTO guitar_chords (name, root_note, description, frets, created_by, updated_by)
            VALUES ($1, $2, $3, $4::jsonb, $5::uuid, $5::uuid)
            RETURNING {_SELECT_FIELDS}
            """,
            name, root_note, description, json.dumps(frets), UUID(user_id),
        )
    return _row_to_dict(row)


async def update_chord(pool, chord_id: str, updates: dict, user_id: str) -> dict | None:
    if not updates:
        return await fetch_chord(pool, chord_id)
    fields = {**updates, "updated_by": UUID(user_id), "updated_at": "NOW()"}
    set_clauses = []
    params: list = []
    for key, value in fields.items():
        if key == "updated_at":
            set_clauses.append("updated_at = NOW()")
            continue
        params.append(json.dumps(value) if key == "frets" else value)
        cast = "::jsonb" if key == "frets" else ""
        set_clauses.append(f"{key} = ${len(params)}{cast}")
    params.append(UUID(chord_id))
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            f"UPDATE guitar_chords SET {', '.join(set_clauses)} "
            f"WHERE id = ${len(params)} RETURNING {_SELECT_FIELDS}",
            *params,
        )
    return _row_to_dict(row) if row else None


async def archive_chord(pool, chord_id: str, user_id: str) -> None:
    async with pool.acquire() as conn:
        await conn.execute(
            "UPDATE guitar_chords SET status = 'archived', updated_by = $1::uuid, updated_at = NOW() "
            "WHERE id = $2::uuid",
            UUID(user_id),
            UUID(chord_id),
        )


def _row_to_dict(row) -> dict:
    result = dict(row)
    result["frets"] = json.loads(result["frets"])
    return result
