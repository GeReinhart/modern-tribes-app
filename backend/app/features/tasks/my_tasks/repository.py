from uuid import UUID

_KANBAN_BASE = """
    SELECT DISTINCT ON (c.id)
        c.id AS id,
        c.feature_instance_id AS feature_instance_id,
        c.column_id AS column_id,
        c.title AS title,
        c.assigned_person_id AS assigned_person_id,
        c.size AS size,
        c.due_date AS due_date,
        c.force_on_dashboard AS force_on_dashboard,
        d.content_html AS document_content_html,
        pe.first_name || ' ' || pe.last_name AS assigned_person_name,
        pf.name AS feature_instance_name,
        p.id AS project_id,
        p.url_param_id AS project_url_param_id,
        p.name AS project_name,
        t.id AS tribe_id,
        t.url_param_id AS tribe_url_param_id,
        t.name AS tribe_name,
        col.name AS column_name,
        ARRAY(SELECT le.label_id::text FROM label_entities le WHERE le.entity_type = 'kanban_card' AND le.entity_id = c.id) AS label_ids
    FROM kanban_cards c
    JOIN projects_features pf ON pf.id = c.feature_instance_id AND pf.status = 'active'
    JOIN projects p ON p.id = pf.project_id AND p.status = 'active'
    LEFT JOIN tribes_projects tp ON tp.project_id = p.id
    LEFT JOIN tribes t ON t.id = tp.tribe_id AND t.status = 'active'
    JOIN kanban_columns col ON col.id = c.column_id AND col.status = 'active'
    LEFT JOIN documents d ON d.id = c.document_id
    LEFT JOIN persons pe ON pe.id = c.assigned_person_id
    WHERE c.status = 'active'
    AND (
        (
            (
                c.assigned_person_id IN (
                    SELECT u.person_id FROM users u WHERE u.id = $1 AND u.person_id IS NOT NULL
                    UNION
                    SELECT r.person_id FROM represents r WHERE r.user_id = $1 AND r.status = 'active'
                )
                OR c.assigned_person_id IS NULL
            )
            AND (c.due_date IS NOT NULL OR c.created_at < NOW() - INTERVAL '100 days')
        )
        OR (
            c.force_on_dashboard = TRUE
            AND EXISTS (
                SELECT 1 FROM positions pos
                JOIN persons per ON per.id = pos.person_id AND per.status = 'active'
                JOIN users u ON u.person_id = per.id AND u.id = $1
                JOIN tribes_projects tp2 ON tp2.tribe_id = pos.tribe_id
                WHERE tp2.project_id = p.id AND pos.status = 'active'
                UNION
                SELECT 1 FROM positions pos2
                JOIN represents rv ON rv.person_id = pos2.person_id AND rv.status = 'active'
                JOIN tribes_projects tp3 ON tp3.tribe_id = pos2.tribe_id
                WHERE rv.user_id = $1 AND tp3.project_id = p.id AND pos2.status = 'active'
            )
        )
    )
    AND col.position < (
        SELECT MAX(kc2.position) FROM kanban_columns kc2
        WHERE kc2.feature_instance_id = c.feature_instance_id AND kc2.status = 'active'
    )
"""

_TODO_BASE = """
    SELECT DISTINCT ON (i.id)
        i.id AS id,
        i.feature_instance_id AS feature_instance_id,
        i.title AS title,
        i.todo_status AS todo_status,
        i.assigned_person_id AS assigned_person_id,
        i.size AS size,
        i.due_date AS due_date,
        i.force_on_dashboard AS force_on_dashboard,
        d.content_html AS document_content_html,
        pe.first_name || ' ' || pe.last_name AS assigned_person_name,
        pf.name AS feature_instance_name,
        p.id AS project_id,
        p.url_param_id AS project_url_param_id,
        p.name AS project_name,
        t.id AS tribe_id,
        t.url_param_id AS tribe_url_param_id,
        t.name AS tribe_name,
        ARRAY(SELECT le.label_id::text FROM label_entities le WHERE le.entity_type = 'todo_item' AND le.entity_id = i.id) AS label_ids
    FROM todo_items i
    JOIN projects_features pf ON pf.id = i.feature_instance_id AND pf.status = 'active'
    JOIN projects p ON p.id = pf.project_id AND p.status = 'active'
    LEFT JOIN tribes_projects tp ON tp.project_id = p.id
    LEFT JOIN tribes t ON t.id = tp.tribe_id AND t.status = 'active'
    LEFT JOIN documents d ON d.id = i.document_id
    LEFT JOIN persons pe ON pe.id = i.assigned_person_id
    WHERE i.status = 'active'
    AND i.todo_status = 'todo'
    AND (
        (
            (
                i.assigned_person_id IN (
                    SELECT u.person_id FROM users u WHERE u.id = $1 AND u.person_id IS NOT NULL
                    UNION
                    SELECT r.person_id FROM represents r WHERE r.user_id = $1 AND r.status = 'active'
                )
                OR i.assigned_person_id IS NULL
            )
            AND (i.due_date IS NOT NULL OR i.created_at < NOW() - INTERVAL '100 days')
        )
        OR (
            i.force_on_dashboard = TRUE
            AND EXISTS (
                SELECT 1 FROM positions pos
                JOIN persons per ON per.id = pos.person_id AND per.status = 'active'
                JOIN users u ON u.person_id = per.id AND u.id = $1
                JOIN tribes_projects tp2 ON tp2.tribe_id = pos.tribe_id
                WHERE tp2.project_id = p.id AND pos.status = 'active'
                UNION
                SELECT 1 FROM positions pos2
                JOIN represents rv ON rv.person_id = pos2.person_id AND rv.status = 'active'
                JOIN tribes_projects tp3 ON tp3.tribe_id = pos2.tribe_id
                WHERE rv.user_id = $1 AND tp3.project_id = p.id AND pos2.status = 'active'
            )
        )
    )
"""

_KANBAN_LABEL_EXISTS = (
    "SELECT 1 FROM label_entities le3 WHERE le3.entity_type = 'kanban_card' AND le3.entity_id = c.id"
    " AND le3.label_id IN (SELECT id FROM labels WHERE name = (SELECT name FROM labels WHERE id = {}))"
)
_TODO_LABEL_EXISTS = (
    "SELECT 1 FROM label_entities le3 WHERE le3.entity_type = 'todo_item' AND le3.entity_id = i.id"
    " AND le3.label_id IN (SELECT id FROM labels WHERE name = (SELECT name FROM labels WHERE id = {}))"
)


def _build_filter_clauses(filters: dict, id_col: str, label_exists: str) -> tuple[str, list]:
    clauses = []
    params = []
    idx = 2
    for key, col in [("tribe_id", "t.id"), ("project_id", "p.id"), ("person_id", id_col)]:
        if filters.get(key):
            clauses.append(f"{col} = ${idx}")
            params.append(UUID(filters[key]))
            idx += 1
    if filters.get("label_id"):
        clauses.append(f"EXISTS ({label_exists.format(f'${idx}')})")
        params.append(UUID(filters["label_id"]))
    return (" AND " + " AND ".join(clauses)) if clauses else "", params


async def _fetch_label_details(conn, label_ids: list[str]) -> dict[str, dict]:
    if not label_ids:
        return {}
    rows = await conn.fetch(
        "SELECT id, name, color FROM labels WHERE id = ANY($1::uuid[])",
        [UUID(lid) for lid in label_ids],
    )
    return {str(r["id"]): {"id": str(r["id"]), "name": r["name"], "color": r["color"]} for r in rows}


def _kanban_row_to_dict(row, label_map: dict) -> dict:
    label_ids = [str(lid) for lid in (row.get("label_ids") or [])]
    return {
        "id": str(row["id"]),
        "feature_instance_id": str(row["feature_instance_id"]),
        "column_id": str(row["column_id"]),
        "column_name": row["column_name"],
        "title": row["title"],
        "assigned_person_id": str(row["assigned_person_id"]) if row.get("assigned_person_id") else None,
        "assigned_person_name": row.get("assigned_person_name"),
        "size": row.get("size"),
        "due_date": row.get("due_date"),
        "force_on_dashboard": row.get("force_on_dashboard", False) or False,
        "document_content_html": row.get("document_content_html"),
        "feature_instance_name": row["feature_instance_name"],
        "project_id": str(row["project_id"]),
        "project_url_param_id": row.get("project_url_param_id"),
        "project_name": row["project_name"],
        "tribe_id": str(row["tribe_id"]) if row.get("tribe_id") else None,
        "tribe_url_param_id": row.get("tribe_url_param_id"),
        "tribe_name": row.get("tribe_name"),
        "label_ids": label_ids,
        "labels": [label_map[lid] for lid in label_ids if lid in label_map],
    }


def _todo_row_to_dict(row, label_map: dict) -> dict:
    label_ids = [str(lid) for lid in (row.get("label_ids") or [])]
    return {
        "id": str(row["id"]),
        "feature_instance_id": str(row["feature_instance_id"]),
        "title": row["title"],
        "todo_status": row["todo_status"],
        "assigned_person_id": str(row["assigned_person_id"]) if row.get("assigned_person_id") else None,
        "assigned_person_name": row.get("assigned_person_name"),
        "size": row.get("size"),
        "due_date": row.get("due_date"),
        "force_on_dashboard": row.get("force_on_dashboard", False) or False,
        "document_content_html": row.get("document_content_html"),
        "feature_instance_name": row["feature_instance_name"],
        "project_id": str(row["project_id"]),
        "project_url_param_id": row.get("project_url_param_id"),
        "project_name": row["project_name"],
        "tribe_id": str(row["tribe_id"]) if row.get("tribe_id") else None,
        "tribe_url_param_id": row.get("tribe_url_param_id"),
        "tribe_name": row.get("tribe_name"),
        "label_ids": label_ids,
        "labels": [label_map[lid] for lid in label_ids if lid in label_map],
    }


async def fetch_my_tasks_kanban(pool, user_id: str, filters: dict) -> list[dict]:
    extra_where, extra_params = _build_filter_clauses(filters, "c.assigned_person_id", _KANBAN_LABEL_EXISTS)
    query = _KANBAN_BASE + extra_where + " ORDER BY c.id, t.name ASC NULLS LAST"
    async with pool.acquire() as conn:
        rows = await conn.fetch(query, UUID(user_id), *extra_params)
        all_label_ids = list({lid for r in rows for lid in (r["label_ids"] or [])})
        label_map = await _fetch_label_details(conn, all_label_ids)
    return [_kanban_row_to_dict(r, label_map) for r in rows]


async def fetch_my_tasks_todo(pool, user_id: str, filters: dict) -> list[dict]:
    extra_where, extra_params = _build_filter_clauses(filters, "i.assigned_person_id", _TODO_LABEL_EXISTS)
    query = _TODO_BASE + extra_where + " ORDER BY i.id, t.name ASC NULLS LAST"
    async with pool.acquire() as conn:
        rows = await conn.fetch(query, UUID(user_id), *extra_params)
        all_label_ids = list({lid for r in rows for lid in (r["label_ids"] or [])})
        label_map = await _fetch_label_details(conn, all_label_ids)
    return [_todo_row_to_dict(r, label_map) for r in rows]
