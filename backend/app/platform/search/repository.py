from uuid import UUID

_HEADLINE_OPTIONS = "StartSel=<mark>,StopSel=</mark>,MaxFragments=3,MaxWords=30,MinWords=10"

_SEARCH_ADMIN = f"""
WITH tsq AS (SELECT websearch_to_tsquery('french', $1) AS query)
SELECT
    si.entity_id::text,
    si.entity_type,
    si.content_summary,
    si.tribe_id::text,
    t.name AS tribe_name,
    si.project_id::text,
    p.name AS project_name,
    si.project_document_id,
    si.page_url_param_id,
    ts_headline('french', si.content_text, tsq.query, '{_HEADLINE_OPTIONS}') AS headline,
    ts_rank(to_tsvector('french', si.content_text), tsq.query) AS rank
FROM search_index si
JOIN tribes t ON t.id = si.tribe_id AND t.status = 'active'
LEFT JOIN projects p ON p.id = si.project_id AND p.status = 'active'
CROSS JOIN tsq
WHERE si.status = 'active'
  AND si.content_text IS NOT NULL AND si.content_text != ''
  AND to_tsvector('french', si.content_text) @@ tsq.query
ORDER BY rank DESC
LIMIT 50
"""

_SEARCH_USER = f"""
WITH user_tribe_ids AS (
    SELECT DISTINCT pos.tribe_id
    FROM positions pos
    JOIN persons per ON per.id = pos.person_id AND per.status = 'active'
    JOIN users u ON u.person_id = per.id
    WHERE u.id = $1 AND pos.status = 'active'

    UNION

    SELECT DISTINCT pos.tribe_id
    FROM positions pos
    JOIN represents r ON r.person_id = pos.person_id AND r.status = 'active'
    WHERE r.user_id = $1 AND pos.status = 'active'
),
tsq AS (SELECT websearch_to_tsquery('french', $2) AS query)
SELECT
    si.entity_id::text,
    si.entity_type,
    si.content_summary,
    si.tribe_id::text,
    t.name AS tribe_name,
    si.project_id::text,
    p.name AS project_name,
    si.project_document_id,
    si.page_url_param_id,
    ts_headline('french', si.content_text, tsq.query, '{_HEADLINE_OPTIONS}') AS headline,
    ts_rank(to_tsvector('french', si.content_text), tsq.query) AS rank
FROM search_index si
JOIN tribes t ON t.id = si.tribe_id AND t.status = 'active'
LEFT JOIN projects p ON p.id = si.project_id AND p.status = 'active'
CROSS JOIN tsq
WHERE si.status = 'active'
  AND si.content_text IS NOT NULL AND si.content_text != ''
  AND to_tsvector('french', si.content_text) @@ tsq.query
  AND si.tribe_id IN (SELECT tribe_id FROM user_tribe_ids)
ORDER BY rank DESC
LIMIT 50
"""


async def search_admin(pool, q: str) -> list[dict]:
    async with pool.acquire() as conn:
        rows = await conn.fetch(_SEARCH_ADMIN, q)
    return [dict(r) for r in rows]


async def search_user(pool, user_id: str, q: str) -> list[dict]:
    async with pool.acquire() as conn:
        rows = await conn.fetch(_SEARCH_USER, UUID(user_id), q)
    return [dict(r) for r in rows]
