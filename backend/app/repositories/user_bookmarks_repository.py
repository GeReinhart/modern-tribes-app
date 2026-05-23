from uuid import UUID


async def get_bookmarks(pool, user_id: str) -> list:
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            "SELECT id::text, page_path, page_title, display_order "
            "FROM user_bookmarks "
            "WHERE user_id = $1::uuid AND status = 'active' "
            "ORDER BY display_order ASC, created_at ASC",
            UUID(user_id),
        )
    return [dict(row) for row in rows]


async def add_bookmark(pool, user_id: str, page_path: str, page_title: str, current_user_id: str) -> dict:
    async with pool.acquire() as conn:
        max_order = await conn.fetchval(
            "SELECT COALESCE(MAX(display_order), -1) FROM user_bookmarks "
            "WHERE user_id = $1::uuid AND status = 'active'",
            UUID(user_id),
        )
        row = await conn.fetchrow(
            """
            INSERT INTO user_bookmarks (user_id, page_path, page_title, display_order, created_by, updated_by)
            VALUES ($1::uuid, $2, $3, $4, $5::uuid, $5::uuid)
            ON CONFLICT (user_id, page_path) DO UPDATE SET
                page_title = EXCLUDED.page_title,
                status = 'active',
                updated_by = EXCLUDED.updated_by,
                updated_at = NOW()
            RETURNING id::text, page_path, page_title, display_order
            """,
            UUID(user_id), page_path, page_title, max_order + 1, UUID(current_user_id),
        )
    return dict(row)


async def remove_bookmark(pool, user_id: str, bookmark_id: str) -> None:
    async with pool.acquire() as conn:
        await conn.execute(
            "UPDATE user_bookmarks SET status = 'archived', updated_at = NOW() "
            "WHERE id = $1::uuid AND user_id = $2::uuid",
            UUID(bookmark_id), UUID(user_id),
        )


async def reorder_bookmarks(pool, user_id: str, ordered_ids: list, current_user_id: str) -> list:
    async with pool.acquire() as conn:
        for order, bookmark_id in enumerate(ordered_ids):
            await conn.execute(
                "UPDATE user_bookmarks SET display_order = $1, updated_by = $2::uuid, updated_at = NOW() "
                "WHERE id = $3::uuid AND user_id = $4::uuid AND status = 'active'",
                order, UUID(current_user_id), UUID(bookmark_id), UUID(user_id),
            )
        rows = await conn.fetch(
            "SELECT id::text, page_path, page_title, display_order "
            "FROM user_bookmarks "
            "WHERE user_id = $1::uuid AND status = 'active' "
            "ORDER BY display_order ASC, created_at ASC",
            UUID(user_id),
        )
    return [dict(row) for row in rows]
