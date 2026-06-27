from datetime import datetime, timezone
from typing import Optional
from uuid import UUID

from app.platform.core.utils.document_helpers import strip_html, extract_content_summary


async def fetch_events(pool, feature_instance_id: str) -> list[dict]:
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """SELECT e.*,
                      d.content_html AS document_content_html,
                      ARRAY(
                          SELECT ep.person_id::text
                          FROM events_participants ep
                          WHERE ep.event_id = e.id AND ep.status = 'active'
                      ) AS participant_ids,
                      ARRAY(
                          SELECT le.label_id::text
                          FROM label_entities le
                          WHERE le.entity_type = 'event' AND le.entity_id = e.id
                      ) AS label_ids
               FROM events e
               LEFT JOIN documents d ON d.id = e.document_id
               WHERE e.feature_instance_id = $1 AND e.status = 'active'
               ORDER BY e.start_at ASC""",
            UUID(feature_instance_id),
        )
        event_ids = [r["id"] for r in rows]
        participants_map = await _fetch_participants_map(conn, event_ids)
        reminders_map = await _fetch_reminders_map(conn, event_ids)
    return [_enrich_row(dict(r), participants_map, reminders_map) for r in rows]


async def fetch_event(pool, event_id: str) -> Optional[dict]:
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """SELECT e.*,
                      d.content_html AS document_content_html,
                      ARRAY(
                          SELECT ep.person_id::text
                          FROM events_participants ep
                          WHERE ep.event_id = e.id AND ep.status = 'active'
                      ) AS participant_ids,
                      ARRAY(
                          SELECT le.label_id::text
                          FROM label_entities le
                          WHERE le.entity_type = 'event' AND le.entity_id = e.id
                      ) AS label_ids
               FROM events e
               LEFT JOIN documents d ON d.id = e.document_id
               WHERE e.id = $1""",
            UUID(event_id),
        )
        if not row:
            return None
        participants_map = await _fetch_participants_map(conn, [row["id"]])
        reminders_map = await _fetch_reminders_map(conn, [row["id"]])
    return _enrich_row(dict(row), participants_map, reminders_map)


async def _fetch_participants_map(conn, event_ids: list) -> dict:
    if not event_ids:
        return {}
    rows = await conn.fetch(
        """SELECT ep.event_id, ep.person_id, p.first_name || ' ' || p.last_name AS person_name
           FROM events_participants ep
           JOIN persons p ON p.id = ep.person_id
           WHERE ep.event_id = ANY($1) AND ep.status = 'active'""",
        event_ids,
    )
    result: dict = {}
    for r in rows:
        eid = str(r["event_id"])
        result.setdefault(eid, []).append({"person_id": str(r["person_id"]), "person_name": r["person_name"]})
    return result


async def _fetch_reminders_map(conn, event_ids: list) -> dict:
    if not event_ids:
        return {}
    rows = await conn.fetch(
        """SELECT id, event_id, remind_at, reminder_type, sent
           FROM events_reminders
           WHERE event_id = ANY($1) AND status = 'active'
           ORDER BY remind_at ASC""",
        event_ids,
    )
    result: dict = {}
    for r in rows:
        eid = str(r["event_id"])
        result.setdefault(eid, []).append({
            "id": str(r["id"]),
            "event_id": eid,
            "remind_at": r["remind_at"],
            "reminder_type": r["reminder_type"],
            "sent": r["sent"],
        })
    return result


def _enrich_row(row: dict, participants_map: dict, reminders_map: dict) -> dict:
    eid = str(row["id"])
    row["participants"] = participants_map.get(eid, [])
    row["reminders"] = reminders_map.get(eid, [])
    return row


async def _fetch_label_map(conn, label_ids: list) -> dict:
    if not label_ids:
        return {}
    rows = await conn.fetch(
        "SELECT id, name, color FROM labels WHERE id = ANY($1::uuid[])",
        [UUID(lid) for lid in label_ids],
    )
    return {str(r["id"]): {"id": str(r["id"]), "name": r["name"], "color": r["color"]} for r in rows}


async def fetch_accessible_events(pool, user_id: str) -> list[dict]:
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT e.*,
                   d.content_html AS document_content_html,
                   ARRAY(
                       SELECT ep.person_id::text
                       FROM events_participants ep
                       WHERE ep.event_id = e.id AND ep.status = 'active'
                   ) AS participant_ids,
                   ARRAY(
                       SELECT le.label_id::text
                       FROM label_entities le
                       WHERE le.entity_type = 'event' AND le.entity_id = e.id
                   ) AS label_ids,
                   pf.name AS feature_instance_name,
                   p.id AS project_id,
                   p.url_param_id AS project_url_param_id,
                   p.name AS project_name
            FROM events e
            JOIN projects_features pf ON pf.id = e.feature_instance_id
                AND pf.status = 'active' AND pf.feature_type = 'events'
            JOIN projects p ON p.id = pf.project_id AND p.status = 'active'
            LEFT JOIN documents d ON d.id = e.document_id
            WHERE e.status = 'active'
            AND (
                EXISTS (
                    SELECT 1 FROM positions pos
                    JOIN persons per ON per.id = pos.person_id AND per.status = 'active'
                    JOIN users u ON u.person_id = per.id AND u.id = $1
                    JOIN tribes_projects tp ON tp.tribe_id = pos.tribe_id
                    WHERE tp.project_id = p.id AND pos.status = 'active'
                )
                OR EXISTS (
                    SELECT 1 FROM positions pos
                    JOIN represents r ON r.person_id = pos.person_id AND r.status = 'active'
                    JOIN tribes_projects tp ON tp.tribe_id = pos.tribe_id
                    WHERE r.user_id = $1 AND tp.project_id = p.id AND pos.status = 'active'
                )
            )
            ORDER BY e.start_at ASC
            """,
            UUID(user_id),
        )
        event_ids = [r["id"] for r in rows]
        participants_map = await _fetch_participants_map(conn, event_ids)
        reminders_map = await _fetch_reminders_map(conn, event_ids)
        all_label_ids = [str(lid) for r in rows for lid in (r["label_ids"] or [])]
        label_map = await _fetch_label_map(conn, list(set(all_label_ids)))
    return [_enrich_planning_row(dict(r), participants_map, reminders_map, label_map) for r in rows]


async def fetch_all_events_with_project(pool) -> list[dict]:
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT e.*,
                   d.content_html AS document_content_html,
                   ARRAY(
                       SELECT ep.person_id::text
                       FROM events_participants ep
                       WHERE ep.event_id = e.id AND ep.status = 'active'
                   ) AS participant_ids,
                   ARRAY(
                       SELECT le.label_id::text
                       FROM label_entities le
                       WHERE le.entity_type = 'event' AND le.entity_id = e.id
                   ) AS label_ids,
                   pf.name AS feature_instance_name,
                   p.id AS project_id,
                   p.url_param_id AS project_url_param_id,
                   p.name AS project_name
            FROM events e
            JOIN projects_features pf ON pf.id = e.feature_instance_id
                AND pf.status = 'active' AND pf.feature_type = 'events'
            JOIN projects p ON p.id = pf.project_id AND p.status = 'active'
            LEFT JOIN documents d ON d.id = e.document_id
            WHERE e.status = 'active'
            ORDER BY e.start_at ASC
            """,
        )
        event_ids = [r["id"] for r in rows]
        participants_map = await _fetch_participants_map(conn, event_ids)
        reminders_map = await _fetch_reminders_map(conn, event_ids)
        all_label_ids = [str(lid) for r in rows for lid in (r["label_ids"] or [])]
        label_map = await _fetch_label_map(conn, list(set(all_label_ids)))
    return [_enrich_planning_row(dict(r), participants_map, reminders_map, label_map) for r in rows]


def _enrich_planning_row(row: dict, participants_map: dict, reminders_map: dict, label_map: dict) -> dict:
    row = _enrich_row(row, participants_map, reminders_map)
    label_ids = [str(lid) for lid in (row.get("label_ids") or [])]
    row["labels"] = [label_map[lid] for lid in label_ids if lid in label_map]
    return row


async def insert_event(
    pool, feature_instance_id: str, title: str, start_at: datetime, end_at: datetime, all_day: bool, user_id: str, force_on_dashboard: bool = False
) -> dict:
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """INSERT INTO events (feature_instance_id, title, start_at, end_at, all_day, force_on_dashboard, created_by, updated_by)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $7) RETURNING *""",
            UUID(feature_instance_id), title, start_at, end_at, all_day, force_on_dashboard, UUID(user_id),
        )
    return dict(row)


async def update_event_basic(pool, event_id: str, updates: dict, user_id: str) -> None:
    if not updates:
        return
    now = datetime.now(timezone.utc)
    fields = {"updated_by": UUID(user_id), "updated_at": now, **updates}
    set_clauses = ", ".join(f"{k} = ${i + 2}" for i, k in enumerate(fields.keys()))
    async with pool.acquire() as conn:
        await conn.execute(
            f"UPDATE events SET {set_clauses} WHERE id = $1",
            UUID(event_id), *fields.values(),
        )


async def update_event_size(pool, event_id: str, size: Optional[int], clear_size: bool, user_id: str) -> None:
    uid = UUID(user_id)
    eid = UUID(event_id)
    async with pool.acquire() as conn:
        if clear_size:
            await conn.execute("UPDATE events SET size = NULL, updated_by = $1 WHERE id = $2", uid, eid)
        elif size is not None:
            await conn.execute("UPDATE events SET size = $1, updated_by = $2 WHERE id = $3", size, uid, eid)


async def upsert_document(pool, event_id: str, content_html: str, user_id: str) -> None:
    uid = UUID(user_id)
    eid = UUID(event_id)
    content_text = strip_html(content_html)
    content_summary = extract_content_summary(content_html)
    now = datetime.now(timezone.utc)
    async with pool.acquire() as conn:
        doc_id = await conn.fetchval("SELECT document_id FROM events WHERE id = $1", eid)
        if doc_id is None:
            new_doc_id = await conn.fetchval(
                """INSERT INTO documents (content_html, content_text, content_summary, created_by, updated_by)
                   VALUES ($1, $2, $3, $4, $4) RETURNING id""",
                content_html, content_text, content_summary, uid,
            )
            await conn.execute("UPDATE events SET document_id = $1 WHERE id = $2", new_doc_id, eid)
        else:
            await conn.execute(
                """UPDATE documents SET content_html=$1, content_text=$2, content_summary=$3,
                   updated_at=$4, updated_by=$5 WHERE id=$6""",
                content_html, content_text, content_summary, now, uid, doc_id,
            )


async def set_participants(pool, event_id: str, person_ids: list[str], user_id: str) -> None:
    eid = UUID(event_id)
    uid = UUID(user_id)
    pids = [UUID(pid) for pid in person_ids]
    async with pool.acquire() as conn:
        await conn.execute(
            "UPDATE events_participants SET status = 'archived', updated_by = $1 WHERE event_id = $2",
            uid, eid,
        )
        for pid in pids:
            await conn.execute(
                """INSERT INTO events_participants (event_id, person_id, created_by, updated_by)
                   VALUES ($1, $2, $3, $3)
                   ON CONFLICT (event_id, person_id) DO UPDATE
                   SET status = 'active', updated_by = $3, updated_at = NOW()""",
                eid, pid, uid,
            )


async def set_reminders(pool, event_id: str, reminders: list[dict], user_id: str) -> None:
    eid = UUID(event_id)
    uid = UUID(user_id)
    async with pool.acquire() as conn:
        await conn.execute(
            "UPDATE events_reminders SET status = 'archived', updated_by = $1 WHERE event_id = $2",
            uid, eid,
        )
        for r in reminders:
            await conn.execute(
                """INSERT INTO events_reminders (event_id, remind_at, reminder_type, created_by, updated_by)
                   VALUES ($1, $2, $3, $4, $4)""",
                eid, r["remind_at"], r["reminder_type"], uid,
            )


async def delete_event(pool, event_id: str) -> None:
    async with pool.acquire() as conn:
        await conn.execute("DELETE FROM events WHERE id = $1", UUID(event_id))


async def fetch_due_reminders(pool) -> list[dict]:
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """SELECT r.id, r.event_id, r.reminder_type, e.title AS event_title,
                      e.start_at AS event_start_at, e.feature_instance_id,
                      e.created_by AS event_creator_id
               FROM events_reminders r
               JOIN events e ON e.id = r.event_id AND e.status = 'active'
               WHERE r.remind_at <= NOW() AND r.sent = FALSE AND r.status = 'active'""",
        )
    return [dict(r) for r in rows]


async def mark_reminder_sent(pool, reminder_id: str) -> None:
    async with pool.acquire() as conn:
        await conn.execute(
            "UPDATE events_reminders SET sent = TRUE, updated_at = NOW() WHERE id = $1",
            UUID(reminder_id),
        )


async def fetch_participant_users(pool, event_id: str) -> list[dict]:
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """SELECT u.id AS user_id, u.email, p.first_name || ' ' || p.last_name AS person_name
               FROM events_participants ep
               JOIN persons p ON p.id = ep.person_id AND p.status = 'active'
               JOIN users u ON u.person_id = p.id AND u.status = 'active'
               WHERE ep.event_id = $1 AND ep.status = 'active'""",
            UUID(event_id),
        )
    return [dict(r) for r in rows]
