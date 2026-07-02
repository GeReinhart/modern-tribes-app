from uuid import UUID


_SELECT_FIELDS = """
    pt.id::text,
    pt.bookmark_id::text,
    pt.display_order,
    ub.page_path,
    ub.page_title
"""


async def list_pinned_tabs(pool, user_id: str) -> list:
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            f"""
            SELECT {_SELECT_FIELDS}
            FROM dashboard_pinned_tabs pt
            JOIN user_bookmarks ub ON ub.id = pt.bookmark_id
            WHERE pt.user_id = $1::uuid AND pt.status = 'active' AND ub.status = 'active'
            ORDER BY pt.display_order ASC, pt.created_at ASC
            """,
            UUID(user_id),
        )
    return [dict(row) for row in rows]


async def get_pinned_tab_by_id(pool, pinned_tab_id: str, user_id: str) -> dict | None:
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            f"""
            SELECT {_SELECT_FIELDS}
            FROM dashboard_pinned_tabs pt
            JOIN user_bookmarks ub ON ub.id = pt.bookmark_id
            WHERE pt.id = $1::uuid AND pt.status = 'active'
            """,
            UUID(pinned_tab_id),
        )
    if row is None:
        return None
    return dict(row)


async def is_bookmark_pinned(pool, user_id: str, bookmark_id: str) -> bool:
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT id FROM dashboard_pinned_tabs WHERE user_id = $1::uuid AND bookmark_id = $2::uuid AND status = 'active'",
            UUID(user_id),
            UUID(bookmark_id),
        )
    return row is not None


async def count_pinned_tabs(pool, user_id: str) -> int:
    async with pool.acquire() as conn:
        return await conn.fetchval(
            "SELECT COUNT(*) FROM dashboard_pinned_tabs WHERE user_id = $1::uuid AND status = 'active'",
            UUID(user_id),
        )


async def pin_bookmark(pool, user_id: str, bookmark_id: str, current_user_id: str) -> dict:
    async with pool.acquire() as conn:
        max_order = await conn.fetchval(
            "SELECT COALESCE(MAX(display_order), -1) FROM dashboard_pinned_tabs WHERE user_id = $1::uuid AND status = 'active'",
            UUID(user_id),
        )
        row = await conn.fetchrow(
            f"""
            INSERT INTO dashboard_pinned_tabs (user_id, bookmark_id, display_order, created_by, updated_by)
            VALUES ($1::uuid, $2::uuid, $3, $4::uuid, $4::uuid)
            RETURNING id::text, bookmark_id::text, display_order
            """,
            UUID(user_id),
            UUID(bookmark_id),
            max_order + 1,
            UUID(current_user_id),
        )
        ub = await conn.fetchrow(
            "SELECT page_path, page_title FROM user_bookmarks WHERE id = $1::uuid",
            UUID(bookmark_id),
        )
    return {**dict(row), "page_path": ub["page_path"], "page_title": ub["page_title"]}


async def unpin_tab(pool, pinned_tab_id: str, user_id: str) -> bool:
    async with pool.acquire() as conn:
        result = await conn.execute(
            "UPDATE dashboard_pinned_tabs SET status = 'archived', updated_at = NOW() "
            "WHERE id = $1::uuid AND user_id = $2::uuid AND status = 'active'",
            UUID(pinned_tab_id),
            UUID(user_id),
        )
    return result != "UPDATE 0"


async def get_bookmark_owner(pool, bookmark_id: str) -> str | None:
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT user_id::text FROM user_bookmarks WHERE id = $1::uuid AND status = 'active'",
            UUID(bookmark_id),
        )
    return row["user_id"] if row else None


async def has_pinned_tabs(pool, bookmark_id: str) -> bool:
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT id FROM dashboard_pinned_tabs WHERE bookmark_id = $1::uuid AND status = 'active'",
            UUID(bookmark_id),
        )
    return row is not None
