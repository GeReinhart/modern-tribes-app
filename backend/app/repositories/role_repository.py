from uuid import UUID

from ..utils.db_helpers import row_with_json_to_dict


async def update_role_permissions(conn, role_id: str, permission_ids: list[str]) -> None:
    await conn.execute("DELETE FROM role_permissions WHERE role_id = $1::uuid", UUID(role_id))
    if permission_ids:
        await conn.executemany(
            "INSERT INTO role_permissions (role_id, permission_id) VALUES ($1::uuid, $2::uuid)",
            [(UUID(role_id), UUID(pid)) for pid in permission_ids]
        )


async def get_role_with_permissions(pool, role_id: str) -> dict | None:
    async with pool.acquire() as conn:
        result = await conn.fetchrow(
            """
            SELECT
                r.*,
                COALESCE(
                    json_agg(DISTINCT jsonb_build_object(
                        'id', p.id,
                        'name', p.name,
                        'description', p.description,
                        'created_at', p.created_at,
                        'updated_at', p.updated_at
                    )) FILTER (WHERE p.id IS NOT NULL),
                    '[]'::json
                ) AS permissions,
                COALESCE(
                    json_agg(DISTINCT p.id::text) FILTER (WHERE p.id IS NOT NULL),
                    '[]'::json
                ) AS permission_ids
            FROM roles r
            LEFT JOIN role_permissions rp ON r.id = rp.role_id
            LEFT JOIN permissions p ON rp.permission_id = p.id
            WHERE r.id = $1::uuid
            GROUP BY r.id, r.name, r.description, r.created_at, r.updated_at
            """,
            UUID(role_id)
        )
    return row_with_json_to_dict(result) if result else None


async def get_roles_with_permissions(pool) -> list[dict]:
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT
                r.*,
                COALESCE(
                    json_agg(DISTINCT jsonb_build_object(
                        'id', p.id,
                        'name', p.name,
                        'description', p.description,
                        'created_at', p.created_at,
                        'updated_at', p.updated_at
                    )) FILTER (WHERE p.id IS NOT NULL),
                    '[]'::json
                ) AS permissions,
                COALESCE(
                    json_agg(DISTINCT p.id::text) FILTER (WHERE p.id IS NOT NULL),
                    '[]'::json
                ) AS permission_ids
            FROM roles r
            LEFT JOIN role_permissions rp ON r.id = rp.role_id
            LEFT JOIN permissions p ON rp.permission_id = p.id
            GROUP BY r.id, r.name, r.description, r.created_at, r.updated_at
            """
        )
    return [row_with_json_to_dict(row) for row in rows]
