from datetime import datetime, timezone
from typing import List
from uuid import UUID

from app.features.tribes_projects.tribes.app_models import PersonWithPosition
from app.platform.core.utils.db_helpers import generate_url_param_id, row_to_dict
from app.platform.core.utils.document_helpers import update_document_content_with_revision


async def get_tribe_by_id(pool, tribe_id: str) -> dict | None:
    async with pool.acquire() as conn:
        row = await conn.fetchrow("SELECT * FROM tribes WHERE id = $1 AND status = 'active'", UUID(tribe_id))
    return row_to_dict(row) if row else None


async def create_tribe(pool, name: str, document_id: str, user_id: str) -> dict:
    now = datetime.now(timezone.utc)
    url_param_id = generate_url_param_id()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """INSERT INTO tribes (name, document_id, created_at, updated_at, created_by, updated_by, url_param_id)
               VALUES ($1, $2, $3, $4, $5, $5, $6) RETURNING *""",
            name,
            UUID(document_id),
            now,
            now,
            UUID(user_id),
            url_param_id,
        )
    return row_to_dict(row)


async def get_tribe_projects(pool, tribe_id: str) -> list[dict]:
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT tp.id, tp.tribe_id, tp.project_id, tp.relation, tp.created_at,
                   p.name AS project_name
            FROM tribes_projects tp
            JOIN projects p ON p.id = tp.project_id
            WHERE tp.tribe_id = $1
        """,
            UUID(tribe_id),
        )
    return [row_to_dict(row) for row in rows] if rows else []


async def sync_tribe_projects(pool, tribe_id: str, projects: list) -> list[dict]:
    now = datetime.now(timezone.utc)
    async with pool.acquire() as conn:
        await conn.execute("DELETE FROM tribes_projects WHERE tribe_id = $1", UUID(tribe_id))
        for proj in projects:
            await conn.execute(
                """INSERT INTO tribes_projects (tribe_id, project_id, relation, created_at)
                   VALUES ($1, $2, $3, $4)""",
                UUID(tribe_id),
                UUID(proj["project_id"]),
                proj["relation"],
                now,
            )
    return await get_tribe_projects(pool, tribe_id)


async def delete_tribe(pool, tribe_id: str) -> None:
    async with pool.acquire() as conn:
        await conn.execute("DELETE FROM tribes WHERE id = $1", UUID(tribe_id))


async def archive_tribe(pool, tribe_id: str, user_id: str) -> None:
    async with pool.acquire() as conn:
        await conn.execute(
            "UPDATE tribes SET status = 'archived', updated_at = $1, updated_by = $2 WHERE id = $3",
            datetime.now(timezone.utc),
            UUID(user_id),
            UUID(tribe_id),
        )


async def touch_tribe(pool, tribe_id: str, user_id: str) -> None:
    async with pool.acquire() as conn:
        await conn.execute(
            "UPDATE tribes SET updated_at = $1, updated_by = $2 WHERE id = $3",
            datetime.now(timezone.utc),
            UUID(user_id),
            UUID(tribe_id),
        )


async def update_tribe_name(pool, tribe_id: str, name: str, user_id: str) -> None:
    async with pool.acquire() as conn:
        await conn.execute(
            "UPDATE tribes SET name = $1, updated_at = $2, updated_by = $3 WHERE id = $4",
            name,
            datetime.now(timezone.utc),
            UUID(user_id),
            UUID(tribe_id),
        )


async def update_tribe_theme_code(pool, tribe_id: str, theme_code, user_id: str) -> None:
    async with pool.acquire() as conn:
        await conn.execute(
            "UPDATE tribes SET theme_code = $1, updated_at = $2, updated_by = $3 WHERE id = $4",
            theme_code,
            datetime.now(timezone.utc),
            UUID(user_id),
            UUID(tribe_id),
        )


async def update_tribe_document_id(pool, tribe_id: str, document_id: str, user_id: str) -> None:
    async with pool.acquire() as conn:
        await conn.execute(
            "UPDATE tribes SET document_id = $1, updated_at = $2, updated_by = $3 WHERE id = $4",
            UUID(document_id),
            datetime.now(timezone.utc),
            UUID(user_id),
            UUID(tribe_id),
        )


async def update_tribe_document_content(pool, document_id: str, content_html: str, user_id: str) -> None:
    await update_document_content_with_revision(pool, document_id, content_html, user_id)


async def create_positions(pool, tribe_id: str, positions_data: list, user_id: str) -> list[dict]:
    now = datetime.now(timezone.utc)
    created = []
    async with pool.acquire() as conn:
        for pos in positions_data:
            row = await conn.fetchrow(
                """INSERT INTO positions (tribe_id, person_id, position, created_at, updated_at, created_by, updated_by)
                   VALUES ($1, $2, $3, $4, $5, $6, $6) RETURNING *""",
                UUID(tribe_id),
                UUID(pos.person_id),
                pos.position,
                now,
                now,
                UUID(user_id),
            )
            created.append(row_to_dict(row))
    return created


async def get_positions_by_tribe(pool, tribe_id: str) -> list[dict]:
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            "SELECT * FROM positions WHERE tribe_id = $1 AND status = 'active'", UUID(tribe_id)
        )
    return [row_to_dict(row) for row in rows] if rows else []


async def sync_positions(
    pool, tribe_id: str, new_positions: list, current_positions: list[dict], user_id: str
) -> None:
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
                        "UPDATE positions SET position = $1, updated_at = $2, updated_by = $3 WHERE id = $4",
                        pos.position,
                        datetime.now(timezone.utc),
                        UUID(user_id),
                        UUID(position_id),
                    )
            else:
                now = datetime.now(timezone.utc)
                await conn.execute(
                    """INSERT INTO positions (tribe_id, person_id, position, created_at, updated_at, created_by, updated_by)
                       VALUES ($1, $2, $3, $4, $5, $6, $6)""",
                    UUID(tribe_id),
                    UUID(pos.person_id),
                    pos.position,
                    now,
                    now,
                    UUID(user_id),
                )


async def get_tribes_with_members_for_project(pool, project_id: str) -> list[dict]:
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT
                t.id           AS tribe_id,
                t.url_param_id AS tribe_url_param_id,
                t.name         AS tribe_name,
                p.id           AS person_id,
                p.first_name,
                p.last_name,
                pos.position
            FROM tribes t
            JOIN tribes_projects tp ON tp.tribe_id = t.id
            JOIN positions pos ON pos.tribe_id = t.id AND pos.status = 'active'
            JOIN persons p ON p.id = pos.person_id AND p.status = 'active'
            WHERE tp.project_id = $1 AND t.status = 'active'
            ORDER BY t.name, p.last_name, p.first_name
            """,
            UUID(project_id),
        )
    return [dict(r) for r in rows]


async def get_persons_with_positions(pool, positions: list[dict]) -> List[PersonWithPosition]:
    if not positions:
        return []
    person_ids = list(set(str(pos["person_id"]) for pos in positions if pos.get("person_id")))
    persons_map = {}
    async with pool.acquire() as conn:
        for person_id in person_ids:
            try:
                row = await conn.fetchrow(
                    "SELECT * FROM persons WHERE id = $1 AND status = 'active'", UUID(person_id)
                )
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
            updated_at=p["updated_at"],
        )
        for pos in positions
        if (p := persons_map.get(str(pos["person_id"])))
    ]
