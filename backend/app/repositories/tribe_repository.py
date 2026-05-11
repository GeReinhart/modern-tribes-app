from datetime import datetime, timezone
from typing import List
from uuid import UUID

from ..models.app.tribes_with_positions import PersonWithPosition
from ..utils.db_helpers import row_to_dict


async def get_tribe_by_id(pool, tribe_id: str) -> dict | None:
    async with pool.acquire() as conn:
        row = await conn.fetchrow("SELECT * FROM tribes WHERE id = $1", UUID(tribe_id))
    return row_to_dict(row) if row else None


async def create_tribe(pool, name: str, document_id: str) -> dict:
    now = datetime.now(timezone.utc)
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """INSERT INTO tribes (name, document_id, project_ids, created_at, updated_at)
               VALUES ($1, $2, $3, $4, $5) RETURNING *""",
            name, UUID(document_id), [], now, now
        )
    return row_to_dict(row)


async def delete_tribe(pool, tribe_id: str) -> None:
    async with pool.acquire() as conn:
        await conn.execute("DELETE FROM tribes WHERE id = $1", UUID(tribe_id))


async def update_tribe_name(pool, tribe_id: str, name: str) -> None:
    async with pool.acquire() as conn:
        await conn.execute(
            "UPDATE tribes SET name = $1, updated_at = $2 WHERE id = $3",
            name, datetime.now(timezone.utc), UUID(tribe_id)
        )


async def update_tribe_document_id(pool, tribe_id: str, document_id: str) -> None:
    async with pool.acquire() as conn:
        await conn.execute(
            "UPDATE tribes SET document_id = $1, updated_at = $2 WHERE id = $3",
            UUID(document_id), datetime.now(timezone.utc), UUID(tribe_id)
        )


async def update_tribe_document_content(pool, document_id: str, content_html: str) -> None:
    async with pool.acquire() as conn:
        await conn.execute(
            "UPDATE documents SET content_html = $1, updated_at = $2 WHERE id = $3",
            content_html, datetime.now(timezone.utc), UUID(document_id)
        )


async def create_positions(pool, tribe_id: str, positions_data: list) -> list[dict]:
    now = datetime.now(timezone.utc)
    created = []
    async with pool.acquire() as conn:
        for pos in positions_data:
            row = await conn.fetchrow(
                """INSERT INTO positions (tribe_id, person_id, position, created_at, updated_at)
                   VALUES ($1, $2, $3, $4, $5) RETURNING *""",
                UUID(tribe_id), UUID(pos.person_id), pos.position, now, now
            )
            created.append(row_to_dict(row))
    return created


async def get_positions_by_tribe(pool, tribe_id: str) -> list[dict]:
    async with pool.acquire() as conn:
        rows = await conn.fetch("SELECT * FROM positions WHERE tribe_id = $1", UUID(tribe_id))
    return [row_to_dict(row) for row in rows] if rows else []


async def sync_positions(pool, tribe_id: str, new_positions: list, current_positions: list[dict]) -> None:
    current_map = {str(p["person_id"]): str(p["id"]) for p in current_positions}
    new_map = {pos.person_id: pos.position for pos in new_positions}
    async with pool.acquire() as conn:
        for person_id, position_id in current_map.items():
            if person_id not in new_map:
                await conn.execute("DELETE FROM positions WHERE id = $1", UUID(position_id))
        for pos in new_positions:
            if pos.person_id in current_map:
                position_id = current_map[pos.person_id]
                current_pos = next(p for p in current_positions if str(p["id"]) == position_id)
                if current_pos["position"] != pos.position:
                    await conn.execute(
                        "UPDATE positions SET position = $1, updated_at = $2 WHERE id = $3",
                        pos.position, datetime.now(timezone.utc), UUID(position_id)
                    )
            else:
                now = datetime.now(timezone.utc)
                await conn.execute(
                    """INSERT INTO positions (tribe_id, person_id, position, created_at, updated_at)
                       VALUES ($1, $2, $3, $4, $5)""",
                    UUID(tribe_id), UUID(pos.person_id), pos.position, now, now
                )


async def get_persons_with_positions(pool, positions: list[dict]) -> List[PersonWithPosition]:
    if not positions:
        return []
    person_ids = list(set(str(pos["person_id"]) for pos in positions if pos.get("person_id")))
    persons_map = {}
    async with pool.acquire() as conn:
        for person_id in person_ids:
            try:
                row = await conn.fetchrow("SELECT * FROM persons WHERE id = $1", UUID(person_id))
                if row:
                    persons_map[person_id] = row_to_dict(row)
            except Exception:
                continue
    return [
        PersonWithPosition(
            id=str(p["id"]),
            first_name=p["first_name"],
            last_name=p["last_name"],
            gender=p["gender"],
            document_id=p.get("document_id", ""),
            position=pos["position"],
            position_id=str(pos["id"]),
            created_at=p["created_at"],
            updated_at=p["updated_at"]
        )
        for pos in positions
        if (p := persons_map.get(str(pos["person_id"])))
    ]
