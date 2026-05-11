from uuid import UUID

from ..utils.db_helpers import row_with_json_to_dict


async def update_user_roles(conn, user_id: str, role_ids: list[str]) -> None:
    await conn.execute("DELETE FROM user_roles WHERE user_id = $1::uuid", UUID(user_id))
    if role_ids:
        await conn.executemany(
            "INSERT INTO user_roles (user_id, role_id) VALUES ($1::uuid, $2::uuid)",
            [(UUID(user_id), UUID(rid)) for rid in role_ids]
        )


async def get_user_with_roles_and_permissions(pool, user_id: str) -> dict | None:
    async with pool.acquire() as conn:
        result = await conn.fetchrow(
            """
            SELECT
                u.*,
                COALESCE(
                    json_agg(DISTINCT jsonb_build_object(
                        'id', r.id,
                        'name', r.name,
                        'description', r.description,
                        'created_at', r.created_at,
                        'updated_at', r.updated_at
                    )) FILTER (WHERE r.id IS NOT NULL),
                    '[]'::json
                ) as roles,
                COALESCE(
                    json_agg(DISTINCT r.id::text) FILTER (WHERE r.id IS NOT NULL),
                    '[]'::json
                ) as role_ids,
                COALESCE(
                    json_agg(DISTINCT p.name) FILTER (WHERE p.id IS NOT NULL),
                    '[]'::json
                ) as permissions
            FROM users u
            LEFT JOIN user_roles ur ON u.id = ur.user_id
            LEFT JOIN roles r ON ur.role_id = r.id
            LEFT JOIN role_permissions rp ON r.id = rp.role_id
            LEFT JOIN permissions p ON rp.permission_id = p.id
            WHERE u.id = $1::uuid
            GROUP BY u.id, u.login, u.email, u.person_id, u.created_at, u.updated_at
            """,
            UUID(user_id)
        )
    return row_with_json_to_dict(result) if result else None

async def get_users_with_roles_and_permissions(pool) -> list[dict]:
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT
                u.*,
                COALESCE(
                        json_agg(DISTINCT jsonb_build_object(
                        'id', r.id,
                        'name', r.name,
                        'description', r.description,
                        'created_at', r.created_at,
                        'updated_at', r.updated_at
                    )) FILTER (WHERE r.id IS NOT NULL),
                        '[]'::json
                ) as roles,
                COALESCE(
                        json_agg(DISTINCT r.id::text) FILTER (WHERE r.id IS NOT NULL),
                        '[]'::json
                ) as role_ids,
                COALESCE(
                        json_agg(DISTINCT p.name) FILTER (WHERE p.id IS NOT NULL),
                        '[]'::json
                ) as permissions
            FROM users u
                     LEFT JOIN user_roles ur ON u.id = ur.user_id
                     LEFT JOIN roles r ON ur.role_id = r.id
                     LEFT JOIN role_permissions rp ON r.id = rp.role_id
                     LEFT JOIN permissions p ON rp.permission_id = p.id
            GROUP BY u.id, u.login, u.email, u.person_id, u.created_at, u.updated_at
            """
        )
    return [row_with_json_to_dict(row) for row in rows]