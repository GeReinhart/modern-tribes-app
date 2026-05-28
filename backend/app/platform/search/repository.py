from uuid import UUID

_HEADLINE_OPTIONS = "StartSel=<mark>,StopSel=</mark>,MaxFragments=3,MaxWords=30,MinWords=10"

_EXTRACT_TRIBE_URL_PARAM = "SPLIT_PART(SPLIT_PART(si.routing_path, '/tribes/', 2), '/', 1)"
_EXTRACT_PROJECT_URL_PARAM = "NULLIF(SPLIT_PART(SPLIT_PART(si.routing_path, '/projects/', 2), '/', 1), '')"

_SEARCH_ADMIN = f"""
WITH tsq AS (SELECT websearch_to_tsquery('french', $1) AS query)
SELECT
    si.entity_id::text,
    si.entity_type,
    si.content_summary,
    si.routing_path,
    t.name AS tribe_name,
    p.name AS project_name,
    ts_headline('french', si.content_text, tsq.query, '{_HEADLINE_OPTIONS}') AS headline,
    ts_rank(to_tsvector('french', si.content_text), tsq.query) AS rank
FROM search_index si
LEFT JOIN tribes t ON t.url_param_id = {_EXTRACT_TRIBE_URL_PARAM} AND t.status = 'active'
LEFT JOIN projects p ON p.url_param_id = {_EXTRACT_PROJECT_URL_PARAM} AND p.status = 'active'
CROSS JOIN tsq
WHERE si.status = 'active'
  AND si.content_text IS NOT NULL AND si.content_text != ''
  AND to_tsvector('french', si.content_text) @@ tsq.query
ORDER BY rank DESC
LIMIT 50
"""

_SEARCH_USER = f"""
WITH user_tribe_url_params AS (
    SELECT DISTINCT t.url_param_id
    FROM positions pos
    JOIN persons per ON per.id = pos.person_id AND per.status = 'active'
    JOIN users u ON u.person_id = per.id
    JOIN tribes t ON t.id = pos.tribe_id AND t.status = 'active'
    WHERE u.id = $1 AND pos.status = 'active'

    UNION

    SELECT DISTINCT t.url_param_id
    FROM positions pos
    JOIN represents r ON r.person_id = pos.person_id AND r.status = 'active'
    JOIN tribes t ON t.id = pos.tribe_id AND t.status = 'active'
    WHERE r.user_id = $1 AND pos.status = 'active'
),
tsq AS (SELECT websearch_to_tsquery('french', $2) AS query)
SELECT
    si.entity_id::text,
    si.entity_type,
    si.content_summary,
    si.routing_path,
    t.name AS tribe_name,
    p.name AS project_name,
    ts_headline('french', si.content_text, tsq.query, '{_HEADLINE_OPTIONS}') AS headline,
    ts_rank(to_tsvector('french', si.content_text), tsq.query) AS rank
FROM search_index si
LEFT JOIN tribes t ON t.url_param_id = {_EXTRACT_TRIBE_URL_PARAM} AND t.status = 'active'
LEFT JOIN projects p ON p.url_param_id = {_EXTRACT_PROJECT_URL_PARAM} AND p.status = 'active'
CROSS JOIN tsq
WHERE si.status = 'active'
  AND si.content_text IS NOT NULL AND si.content_text != ''
  AND to_tsvector('french', si.content_text) @@ tsq.query
  AND {_EXTRACT_TRIBE_URL_PARAM} IN (SELECT url_param_id FROM user_tribe_url_params)
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
