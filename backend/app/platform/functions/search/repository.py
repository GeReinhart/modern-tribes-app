_HEADLINE_OPTIONS = "StartSel=<mark>,StopSel=</mark>,MaxFragments=3,MaxWords=30,MinWords=10"

_SEARCH_ALL = f"""
WITH tsq AS (SELECT websearch_to_tsquery('french', $1) AS query)
SELECT
    si.entity_id::text,
    si.entity_type,
    si.content_summary,
    si.routing_path,
    NULL::text AS tribe_name,
    NULL::text AS project_name,
    ts_headline('french', si.content_text, tsq.query, '{_HEADLINE_OPTIONS}') AS headline,
    ts_rank(to_tsvector('french', si.content_text), tsq.query) AS rank
FROM search_index si
CROSS JOIN tsq
WHERE si.status = 'active'
  AND si.content_text IS NOT NULL AND si.content_text != ''
  AND to_tsvector('french', si.content_text) @@ tsq.query
ORDER BY rank DESC
LIMIT 50
"""


async def search_admin(pool, q: str) -> list[dict]:
    async with pool.acquire() as conn:
        rows = await conn.fetch(_SEARCH_ALL, q)
    return [dict(r) for r in rows]


async def search_user(pool, user_id: str, q: str) -> list[dict]:
    async with pool.acquire() as conn:
        rows = await conn.fetch(_SEARCH_ALL, q)
    return [dict(r) for r in rows]
