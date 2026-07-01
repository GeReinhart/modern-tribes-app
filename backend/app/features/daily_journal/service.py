from datetime import datetime, timezone
from uuid import UUID

from app.platform.functions.search import index_repository as search_index


async def index_block(pool, block_id: str, user_id: str) -> None:
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """SELECT jb.feature_instance_id, jb.date, d.content_text, d.content_summary
               FROM journal_blocks jb
               LEFT JOIN documents d ON d.id = jb.document_id
               WHERE jb.id = $1 AND jb.status != 'archived'""",
            UUID(block_id),
        )
    if not row:
        return
    path = await search_index._fetch_task_routing(pool, row["feature_instance_id"])
    if not path:
        return
    label_names = await search_index._fetch_label_names(pool, UUID(block_id), "journal_block")
    content_text = search_index._build_content_text("", label_names, row["content_text"])
    if not content_text:
        return
    day_str = row["date"].isoformat()
    routing_path = (
        f"/app/tribes/{path['tribe_url_param_id']}"
        f"/projects/{path['project_url_param_id']}"
        f"/{str(row['feature_instance_id'])}?date={day_str}"
    )
    await search_index._upsert(
        pool, "journal_block", block_id, content_text,
        row["content_summary"], routing_path, user_id,
        datetime.now(timezone.utc),
    )


async def archive_block_index(pool, block_id: str, user_id: str) -> None:
    await search_index.archive_entity(pool, "journal_block", block_id, user_id)
