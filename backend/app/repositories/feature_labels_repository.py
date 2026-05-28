from typing import Optional
from uuid import UUID


async def fetch_labels_for_feature(pool, feature_instance_id: str) -> list[dict]:
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            "SELECT id, name, color, position FROM labels WHERE feature_instance_id = $1 AND status = 'active' ORDER BY position ASC",
            UUID(feature_instance_id),
        )
    return [
        {"id": str(r["id"]), "name": r["name"], "color": r["color"], "position": r["position"]} for r in rows
    ]


async def fetch_label_by_id(pool, label_id: str) -> Optional[dict]:
    async with pool.acquire() as conn:
        row = await conn.fetchrow("SELECT * FROM labels WHERE id = $1", UUID(label_id))
    return dict(row) if row else None


async def insert_feature_label(pool, feature_instance_id: str, name: str, color: str, user_id: str) -> dict:
    async with pool.acquire() as conn:
        position = await conn.fetchval(
            "SELECT COALESCE(MAX(position), -1) + 1 FROM labels WHERE feature_instance_id = $1",
            UUID(feature_instance_id),
        )
        row = await conn.fetchrow(
            """INSERT INTO labels (name, color, position, feature_instance_id, status, created_by, updated_by)
               VALUES ($1, $2, $3, $4, 'active', $5, $5) RETURNING id, name, color, position""",
            name,
            color,
            position,
            UUID(feature_instance_id),
            UUID(user_id),
        )
    return {"id": str(row["id"]), "name": row["name"], "color": row["color"], "position": row["position"]}


async def update_feature_label(
    pool, label_id: str, name: Optional[str], color: Optional[str], user_id: str
) -> Optional[dict]:
    async with pool.acquire() as conn:
        if name is not None:
            await conn.execute(
                "UPDATE labels SET name = $1, updated_by = $2 WHERE id = $3",
                name,
                UUID(user_id),
                UUID(label_id),
            )
        if color is not None:
            await conn.execute(
                "UPDATE labels SET color = $1, updated_by = $2 WHERE id = $3",
                color,
                UUID(user_id),
                UUID(label_id),
            )
        row = await conn.fetchrow(
            "SELECT id, name, color, position FROM labels WHERE id = $1", UUID(label_id)
        )
    return (
        {"id": str(row["id"]), "name": row["name"], "color": row["color"], "position": row["position"]}
        if row
        else None
    )


async def delete_feature_label(pool, label_id: str) -> None:
    async with pool.acquire() as conn:
        await conn.execute("DELETE FROM labels WHERE id = $1", UUID(label_id))


async def add_entity_label(pool, entity_id: str, entity_type: str, label_id: str) -> None:
    async with pool.acquire() as conn:
        await conn.execute(
            "INSERT INTO label_entities (label_id, entity_type, entity_id) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING",
            UUID(label_id),
            entity_type,
            UUID(entity_id),
        )


async def remove_entity_label(pool, entity_id: str, entity_type: str, label_id: str) -> None:
    async with pool.acquire() as conn:
        await conn.execute(
            "DELETE FROM label_entities WHERE entity_type = $1 AND entity_id = $2 AND label_id = $3",
            entity_type,
            UUID(entity_id),
            UUID(label_id),
        )


async def toggle_entity_label(pool, entity_id: str, entity_type: str, label_id: str) -> list[str]:
    eid, lid = UUID(entity_id), UUID(label_id)
    async with pool.acquire() as conn:
        existing = await conn.fetchval(
            "SELECT 1 FROM label_entities WHERE entity_type = $1 AND entity_id = $2 AND label_id = $3",
            entity_type,
            eid,
            lid,
        )
        if existing:
            await conn.execute(
                "DELETE FROM label_entities WHERE entity_type = $1 AND entity_id = $2 AND label_id = $3",
                entity_type,
                eid,
                lid,
            )
        else:
            await conn.execute(
                "INSERT INTO label_entities (label_id, entity_type, entity_id) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING",
                lid,
                entity_type,
                eid,
            )
        rows = await conn.fetch(
            "SELECT label_id::text FROM label_entities WHERE entity_type = $1 AND entity_id = $2",
            entity_type,
            eid,
        )
    return [r["label_id"] for r in rows]


async def search_feature_labels(pool, name: str, limit: int = 20) -> list[dict]:
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """SELECT id, name, color, feature_instance_id FROM labels
               WHERE feature_instance_id IS NOT NULL AND status = 'active' AND name ILIKE $1
               ORDER BY name ASC LIMIT $2""",
            f"%{name}%",
            limit,
        )
    return [
        {
            "id": str(r["id"]),
            "name": r["name"],
            "color": r["color"],
            "feature_instance_id": str(r["feature_instance_id"]),
        }
        for r in rows
    ]


async def fetch_label_details(pool, label_ids: list[str]) -> dict[str, dict]:
    if not label_ids:
        return {}
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            "SELECT id, name, color FROM labels WHERE id = ANY($1::uuid[])",
            [UUID(lid) for lid in label_ids],
        )
    return {str(r["id"]): {"id": str(r["id"]), "name": r["name"], "color": r["color"]} for r in rows}
