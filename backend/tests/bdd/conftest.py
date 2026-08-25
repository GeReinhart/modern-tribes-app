import asyncio
import json
import re
from datetime import datetime, timedelta, timezone
from uuid import UUID

import asyncpg
import pytest
from pytest_bdd import given, parsers, then, when

from tests.db_helpers import TEST_DB_DSN, coerce, is_int_column, url_param_id_from_uuid
from tests.helpers import assert_table, expand_id, expand_json_ids, expand_path_ids, resolve_relative_date

_RELATIVE_DAYS_PATTERN = re.compile(r"^-(\d+)d$")


def _parse_created_at(value: str | None) -> datetime | None:
    """A plain ISO date is a fixed point in time, so any test asserting behavior relative to
    "now" (e.g. "created more/less than 100 days ago") would drift stale and eventually flip
    the wrong way as real time passes it by. A "-Nd" value instead means "N days before
    whenever this test actually runs", so that kind of assertion stays correct forever."""
    if not value:
        return None
    relative_match = _RELATIVE_DAYS_PATTERN.match(value)
    if relative_match:
        return datetime.now(timezone.utc) - timedelta(days=int(relative_match.group(1)))
    return datetime.fromisoformat(value).replace(tzinfo=timezone.utc)


def _run(coro):
    return asyncio.run(coro)


async def _conn():
    return await asyncpg.connect(TEST_DB_DSN, timeout=5)


# ── authentication step stubs ──────────────────────────────────────────────────

@given(parsers.re(r"I am authenticated as an administrator: user\.id (?P<user_id>\d{1,4})"))
def authenticated_admin(user_id, admin_client, context):
    context["client"] = admin_client


@given(parsers.re(r"I am authenticated as a regular user: user\.id (?P<user_id>\d{1,4})"))
def authenticated_regular_user(user_id, non_admin_client, context):
    context["client"] = non_admin_client


@given(parsers.re(r"I am authenticated as the person's owner: user\.id (?P<user_id>\d{1,4})"))
def authenticated_profile_owner(user_id, profile_owner_client, context):
    context["client"] = profile_owner_client


# ── Given: auth tables ─────────────────────────────────────────────────────────

@given("the users table contains:")
def given_users_table(datatable):
    async def _insert():
        conn = await _conn()
        try:
            headers = datatable[0]
            for row in datatable[1:]:
                rec = {headers[i]: expand_id(row[i]) for i in range(len(headers))}
                uid = rec["id"]
                email = rec.get("email", f"user_{uid[:8]}@test.com")
                person_id = rec.get("person_id")
                await conn.execute(
                    """INSERT INTO users(id, url_param_id, login, email, status)
                       VALUES($1, $2, $3, $4, $5)
                       ON CONFLICT (id) DO UPDATE SET
                           email = EXCLUDED.email,
                           status = EXCLUDED.status""",
                    UUID(uid),
                    url_param_id_from_uuid(uid),
                    email,
                    email,
                    rec.get("status", "active"),
                )
                if person_id:
                    await conn.execute(
                        "UPDATE users SET person_id = $1::uuid WHERE id = $2::uuid",
                        UUID(person_id),
                        UUID(uid),
                    )
        finally:
            await conn.close()
    _run(_insert())


@given("the roles table contains:")
def given_roles_table(datatable):
    async def _insert():
        conn = await _conn()
        try:
            headers = datatable[0]
            for row in datatable[1:]:
                rec = {headers[i]: row[i] for i in range(len(headers))}
                await conn.execute(
                    "INSERT INTO roles(name, status) VALUES($1, $2) ON CONFLICT (name) DO NOTHING",
                    rec["name"],
                    rec.get("status", "active"),
                )
        finally:
            await conn.close()
    _run(_insert())


@given("the role_permissions table contains:")
def given_role_permissions_table(datatable):
    async def _insert():
        conn = await _conn()
        try:
            headers = datatable[0]
            for row in datatable[1:]:
                rec = {headers[i]: row[i] for i in range(len(headers))}
                perm_name = rec["permission"]
                role_name = rec["role"]
                await conn.execute(
                    "INSERT INTO permissions(name) VALUES($1) ON CONFLICT (name) DO NOTHING",
                    perm_name,
                )
                role_id = await conn.fetchval("SELECT id FROM roles WHERE name = $1", role_name)
                perm_id = await conn.fetchval("SELECT id FROM permissions WHERE name = $1", perm_name)
                if role_id and perm_id:
                    await conn.execute(
                        "INSERT INTO role_permissions(role_id, permission_id) VALUES($1, $2) ON CONFLICT DO NOTHING",
                        role_id, perm_id,
                    )
        finally:
            await conn.close()
    _run(_insert())


@given("the user_roles table contains:")
def given_user_roles_table(datatable):
    async def _insert():
        conn = await _conn()
        try:
            headers = datatable[0]
            for row in datatable[1:]:
                rec = {headers[i]: row[i] for i in range(len(headers))}
                user_id = await conn.fetchval("SELECT id FROM users WHERE email = $1", rec["user"])
                role_id = await conn.fetchval("SELECT id FROM roles WHERE name = $1", rec["role"])
                if user_id and role_id:
                    await conn.execute(
                        "INSERT INTO user_roles(user_id, role_id) VALUES($1, $2) ON CONFLICT DO NOTHING",
                        user_id, role_id,
                    )
        finally:
            await conn.close()
    _run(_insert())


# ── Given: platform tables ─────────────────────────────────────────────────────

@given("the persons table contains:")
def given_persons_table(datatable):
    async def _insert():
        conn = await _conn()
        try:
            headers = datatable[0]
            for row in datatable[1:]:
                rec = {headers[i]: expand_id(row[i]) for i in range(len(headers))}
                await conn.execute(
                    """INSERT INTO persons(id, first_name, last_name, gender, status)
                       VALUES($1, $2, $3, $4, $5)
                       ON CONFLICT (id) DO NOTHING""",
                    UUID(rec["id"]),
                    rec["first_name"],
                    rec["last_name"],
                    rec.get("gender", "other"),
                    rec.get("status", "active"),
                )
        finally:
            await conn.close()
    _run(_insert())


@given("the represents table contains:")
def given_represents_table(datatable):
    async def _insert():
        conn = await _conn()
        try:
            headers = datatable[0]
            for row in datatable[1:]:
                rec = {headers[i]: expand_id(row[i]) for i in range(len(headers))}
                if not rec.get("user_id") or not rec.get("person_id"):
                    continue
                uid = rec.get("id")
                if uid:
                    await conn.execute(
                        """INSERT INTO represents(id, user_id, person_id, status)
                           VALUES($1, $2, $3, $4)
                           ON CONFLICT (id) DO NOTHING""",
                        UUID(uid),
                        UUID(rec["user_id"]),
                        UUID(rec["person_id"]),
                        rec.get("status", "active"),
                    )
                else:
                    await conn.execute(
                        """INSERT INTO represents(user_id, person_id, status)
                           VALUES($1, $2, $3)
                           ON CONFLICT (user_id, person_id) DO NOTHING""",
                        UUID(rec["user_id"]),
                        UUID(rec["person_id"]),
                        rec.get("status", "active"),
                    )
        finally:
            await conn.close()
    _run(_insert())


@given("the documents table contains:")
def given_documents_table(datatable):
    async def _insert():
        conn = await _conn()
        try:
            headers = datatable[0]
            for row in datatable[1:]:
                rec = {headers[i]: expand_id(row[i]) for i in range(len(headers))}
                uid = rec["id"]
                await conn.execute(
                    """INSERT INTO documents(id, content_html, status)
                       VALUES($1, $2, $3)
                       ON CONFLICT (id) DO NOTHING""",
                    UUID(uid),
                    rec.get("content_html"),
                    rec.get("status", "active"),
                )
        finally:
            await conn.close()
    _run(_insert())


@given("the journal_blocks table contains:")
def given_journal_blocks_table(datatable):
    async def _insert():
        conn = await _conn()
        try:
            headers = datatable[0]
            for row in datatable[1:]:
                rec = {headers[i]: expand_id(row[i]) for i in range(len(headers))}
                uid = rec["id"]
                document_id = rec.get("document_id")
                await conn.execute(
                    """INSERT INTO journal_blocks(id, feature_instance_id, date, document_id, position, status)
                       VALUES($1, $2, $3, $4, $5, $6)
                       ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status""",
                    UUID(uid),
                    UUID(rec["feature_instance_id"]),
                    coerce("date", rec["date"]),
                    UUID(document_id) if document_id else None,
                    coerce("position", rec.get("position", "0")),
                    rec.get("status", "active"),
                )
        finally:
            await conn.close()
    _run(_insert())


@given("the labels table contains:")
def given_labels_table(datatable):
    async def _insert():
        conn = await _conn()
        try:
            headers = datatable[0]
            for row in datatable[1:]:
                rec = {headers[i]: expand_id(row[i]) for i in range(len(headers))}
                uid = rec["id"]
                fi_id = rec.get("feature_instance_id")
                project_id = rec.get("project_id")
                position = int(rec.get("position") or 0)
                if fi_id:
                    await conn.execute(
                        """INSERT INTO labels(id, name, color, status, feature_instance_id, position)
                           VALUES($1, $2, $3, $4, $5, $6)
                           ON CONFLICT (id) DO NOTHING""",
                        UUID(uid),
                        rec.get("name", ""),
                        rec.get("color", "#000000"),
                        rec.get("status", "active"),
                        UUID(fi_id),
                        position,
                    )
                elif project_id:
                    await conn.execute(
                        """INSERT INTO labels(id, name, color, status, project_id, position)
                           VALUES($1, $2, $3, $4, $5, $6)
                           ON CONFLICT (id) DO NOTHING""",
                        UUID(uid),
                        rec.get("name", ""),
                        rec.get("color", "#000000"),
                        rec.get("status", "active"),
                        UUID(project_id),
                        position,
                    )
                else:
                    await conn.execute(
                        """INSERT INTO labels(id, name, color, status, position)
                           VALUES($1, $2, $3, $4, $5)
                           ON CONFLICT (id) DO NOTHING""",
                        UUID(uid),
                        rec.get("name", ""),
                        rec.get("color", "#000000"),
                        rec.get("status", "active"),
                        position,
                    )
        finally:
            await conn.close()
    _run(_insert())


@given("the user_bookmarks table contains:")
def given_user_bookmarks_table(datatable):
    async def _insert():
        conn = await _conn()
        try:
            headers = datatable[0]
            for row in datatable[1:]:
                rec = {headers[i]: expand_id(row[i]) for i in range(len(headers))}
                uid = rec.get("id")
                user_id = rec.get("user_id")
                if not uid or not user_id:
                    continue
                await conn.execute(
                    """INSERT INTO user_bookmarks(id, user_id, page_path, page_title, display_order, status)
                       VALUES($1, $2, $3, $4, $5, $6)
                       ON CONFLICT (id) DO NOTHING""",
                    UUID(uid),
                    UUID(user_id),
                    rec.get("page_path", "/"),
                    rec.get("page_title", "Page"),
                    coerce("display_order", rec.get("display_order", "0")),
                    rec.get("status", "active"),
                )
        finally:
            await conn.close()
    _run(_insert())


@given("the user_bookmark table contains:")
def given_user_bookmark_table(datatable):
    given_user_bookmarks_table(datatable)


@given("the notifications table contains:")
def given_notifications_table(datatable):
    async def _insert():
        conn = await _conn()
        try:
            headers = datatable[0]
            for row in datatable[1:]:
                rec = {headers[i]: expand_id(row[i]) for i in range(len(headers))}
                uid = rec.get("id")
                target_user = rec.get("target_user_id")
                if not uid or not target_user:
                    continue
                url_param = rec.get("url_param_id", url_param_id_from_uuid(uid) + "xx")[:12]
                created_at = _parse_created_at(rec.get("created_at"))
                scheduled_for = _parse_created_at(rec.get("scheduled_for"))
                reminder_raw = rec.get("reminder_id")
                reminder_id = UUID(reminder_raw) if reminder_raw else None
                await conn.execute(
                    """INSERT INTO notifications(
                           id, url_param_id, target_user_id, message, notification_status,
                           scheduled_for, reminder_id, created_at
                       ) VALUES($1, $2, $3, $4, $5, $6, $7, COALESCE($8, NOW()))
                       ON CONFLICT (id) DO NOTHING""",
                    UUID(uid), url_param, UUID(target_user),
                    rec.get("message", "Test notification"),
                    rec.get("notification_status", "sent"),
                    scheduled_for, reminder_id, created_at,
                )
        finally:
            await conn.close()
    _run(_insert())


@given("the projects_documents table contains:")
def given_projects_documents_table(datatable):
    async def _insert():
        conn = await _conn()
        try:
            headers = datatable[0]
            for row in datatable[1:]:
                rec = {headers[i]: expand_id(row[i]) for i in range(len(headers))}
                uid = rec.get("id")
                if not uid:
                    continue
                await conn.execute(
                    """INSERT INTO projects_documents(id, url_param_id, project_id, document_id, title, status)
                       VALUES($1, $2, $3, $4, $5, $6)
                       ON CONFLICT (id) DO NOTHING""",
                    UUID(uid),
                    rec.get("url_param_id", url_param_id_from_uuid(uid)),
                    UUID(rec["project_id"]),
                    UUID(rec["document_id"]),
                    rec.get("title", "Document"),
                    rec.get("status", "active"),
                )
        finally:
            await conn.close()
    _run(_insert())


@given("the publications table contains:")
def given_publications_table(datatable):
    async def _insert():
        conn = await _conn()
        try:
            headers = datatable[0]
            for row in datatable[1:]:
                rec = {headers[i]: expand_id(row[i]) for i in range(len(headers))}
                uid = rec.get("id")
                if not uid:
                    continue
                await conn.execute(
                    """INSERT INTO publications(id, url_param_id, document_id, project_document_id, status)
                       VALUES($1, $2, $3, $4, $5)
                       ON CONFLICT (id) DO NOTHING""",
                    UUID(uid),
                    rec.get("url_param_id", url_param_id_from_uuid(uid)),
                    UUID(rec["document_id"]),
                    UUID(rec["project_document_id"]),
                    rec.get("status", "active"),
                )
        finally:
            await conn.close()
    _run(_insert())


@given("the app_config table contains:")
def given_app_config_table(datatable):
    async def _insert():
        conn = await _conn()
        try:
            headers = datatable[0]
            for row in datatable[1:]:
                rec = {headers[i]: expand_id(row[i]) for i in range(len(headers))}
                uid = rec.get("id")
                if not rec.get("key"):
                    continue
                await conn.execute(
                    """INSERT INTO app_config(id, key, value)
                       VALUES($1, $2, $3)
                       ON CONFLICT (id) DO NOTHING""",
                    UUID(uid) if uid else None,
                    rec.get("key", ""),
                    rec.get("value", ""),
                )
        finally:
            await conn.close()
    _run(_insert())


# ── Given: domain tables ───────────────────────────────────────────────────────

@given("the projects table contains:")
def given_projects_table(datatable):
    async def _insert():
        conn = await _conn()
        try:
            headers = datatable[0]
            for row in datatable[1:]:
                rec = {headers[i]: expand_id(row[i]) for i in range(len(headers))}
                uid = rec["id"]
                await conn.execute(
                    """INSERT INTO projects(id, url_param_id, name, status)
                       VALUES($1, $2, $3, $4)
                       ON CONFLICT (id) DO NOTHING""",
                    UUID(uid),
                    rec.get("url_param_id", url_param_id_from_uuid(uid)),
                    rec.get("name", "Project"),
                    rec.get("status", "active"),
                )
        finally:
            await conn.close()
    _run(_insert())


@given("the tribes table contains:")
def given_tribes_table(datatable):
    async def _insert():
        conn = await _conn()
        try:
            headers = datatable[0]
            for row in datatable[1:]:
                rec = {headers[i]: expand_id(row[i]) for i in range(len(headers))}
                uid = rec["id"]
                await conn.execute(
                    """INSERT INTO tribes(id, url_param_id, name, status)
                       VALUES($1, $2, $3, $4)
                       ON CONFLICT (id) DO NOTHING""",
                    UUID(uid),
                    rec.get("url_param_id", url_param_id_from_uuid(uid)),
                    rec.get("name", "Tribe"),
                    rec.get("status", "active"),
                )
        finally:
            await conn.close()
    _run(_insert())


@given("the tribes_projects table contains:")
def given_tribes_projects_table(datatable):
    async def _insert():
        conn = await _conn()
        try:
            headers = datatable[0]
            for row in datatable[1:]:
                rec = {headers[i]: expand_id(row[i]) for i in range(len(headers))}
                display_order = coerce("display_order", rec.get("display_order", "0"))
                await conn.execute(
                    """INSERT INTO tribes_projects(tribe_id, project_id, relation, display_order)
                       VALUES($1, $2, $3, $4)
                       ON CONFLICT (tribe_id, project_id) DO UPDATE SET
                           relation = EXCLUDED.relation,
                           display_order = EXCLUDED.display_order""",
                    UUID(rec["tribe_id"]),
                    UUID(rec["project_id"]),
                    rec.get("relation", "member"),
                    display_order,
                )
        finally:
            await conn.close()
    _run(_insert())


@given("the positions table contains:")
def given_positions_table(datatable):
    async def _insert():
        conn = await _conn()
        try:
            headers = datatable[0]
            for row in datatable[1:]:
                rec = {headers[i]: expand_id(row[i]) for i in range(len(headers))}
                uid = rec.get("id")
                if uid:
                    await conn.execute(
                        """INSERT INTO positions(id, tribe_id, person_id, position, status)
                           VALUES($1, $2, $3, $4, $5)
                           ON CONFLICT (tribe_id, person_id) DO NOTHING""",
                        UUID(uid),
                        UUID(rec["tribe_id"]),
                        UUID(rec["person_id"]),
                        rec.get("position", "member"),
                        rec.get("status", "active"),
                    )
                else:
                    await conn.execute(
                        """INSERT INTO positions(tribe_id, person_id, position, status)
                           VALUES($1, $2, $3, $4)
                           ON CONFLICT (tribe_id, person_id) DO NOTHING""",
                        UUID(rec["tribe_id"]),
                        UUID(rec["person_id"]),
                        rec.get("position", "member"),
                        rec.get("status", "active"),
                    )
        finally:
            await conn.close()
    _run(_insert())


@given("the projects_features table contains:")
def given_projects_features_table(datatable):
    async def _insert():
        conn = await _conn()
        try:
            headers = datatable[0]
            for row in datatable[1:]:
                rec = {headers[i]: expand_id(row[i]) for i in range(len(headers))}
                uid = rec["id"]
                await conn.execute(
                    """INSERT INTO projects_features(id, project_id, feature_type, name, icon, status, position)
                       VALUES($1, $2, $3, $4, $5, $6, $7)
                       ON CONFLICT (id) DO NOTHING""",
                    UUID(uid),
                    UUID(rec["project_id"]),
                    rec.get("feature_type", "kanban"),
                    rec.get("name") or None,
                    rec.get("icon") or None,
                    rec.get("status", "active"),
                    coerce("position", rec.get("position", "0")),
                )
        finally:
            await conn.close()
    _run(_insert())


@given("the kanban_columns table contains:")
def given_kanban_columns_table(datatable):
    async def _insert():
        conn = await _conn()
        try:
            headers = datatable[0]
            for row in datatable[1:]:
                rec = {headers[i]: expand_id(row[i]) for i in range(len(headers))}
                uid = rec["id"]
                await conn.execute(
                    """INSERT INTO kanban_columns(id, feature_instance_id, name, position, status)
                       VALUES($1, $2, $3, $4, $5)
                       ON CONFLICT (id) DO NOTHING""",
                    UUID(uid),
                    UUID(rec["feature_instance_id"]),
                    rec.get("name", "Column"),
                    coerce("position", rec.get("position", "0")),
                    rec.get("status", "active"),
                )
        finally:
            await conn.close()
    _run(_insert())


@given("the kanban_cards table contains:")
def given_kanban_cards_table(datatable):
    async def _insert():
        conn = await _conn()
        try:
            headers = datatable[0]
            for row in datatable[1:]:
                rec = {headers[i]: expand_id(row[i]) for i in range(len(headers))}
                uid = rec["id"]
                assigned = rec.get("assigned_person_id")
                due = rec.get("due_date")
                created_at = _parse_created_at(rec.get("created_at"))
                created_by = rec.get("created_by")
                fields = [
                    "id", "feature_instance_id", "column_id", "title",
                    "assigned_person_id", "due_date", "status", "position",
                ]
                values = [
                    UUID(uid),
                    UUID(rec["feature_instance_id"]),
                    UUID(rec["column_id"]),
                    rec.get("title", "Card"),
                    UUID(assigned) if assigned else None,
                    coerce("due_date", due) if due else None,
                    rec.get("status", "active"),
                    coerce("position", rec.get("position", "0")),
                ]
                if created_at is not None:
                    fields.append("created_at")
                    values.append(created_at)
                if created_by is not None:
                    fields.append("created_by")
                    values.append(UUID(created_by))
                placeholders = ", ".join(f"${i + 1}" for i in range(len(fields)))
                query = (
                    f"INSERT INTO kanban_cards({', '.join(fields)}) "
                    f"VALUES({placeholders}) ON CONFLICT (id) DO NOTHING"
                )
                await conn.execute(query, *values)
        finally:
            await conn.close()
    _run(_insert())


@given("the todo_items table contains:")
def given_todo_items_table(datatable):
    async def _insert():
        conn = await _conn()
        try:
            headers = datatable[0]
            for row in datatable[1:]:
                rec = {headers[i]: expand_id(row[i]) for i in range(len(headers))}
                uid = rec["id"]
                assigned = rec.get("assigned_person_id")
                due = rec.get("due_date")
                created_at = _parse_created_at(rec.get("created_at"))
                created_by = rec.get("created_by")
                fields = [
                    "id", "feature_instance_id", "title", "todo_status",
                    "assigned_person_id", "due_date", "status", "position",
                ]
                values = [
                    UUID(uid),
                    UUID(rec["feature_instance_id"]),
                    rec.get("title", "Todo"),
                    rec.get("todo_status", "todo"),
                    UUID(assigned) if assigned else None,
                    coerce("due_date", due) if due else None,
                    rec.get("status", "active"),
                    coerce("position", rec.get("position", "0")),
                ]
                if created_at is not None:
                    fields.append("created_at")
                    values.append(created_at)
                if created_by is not None:
                    fields.append("created_by")
                    values.append(UUID(created_by))
                placeholders = ", ".join(f"${i + 1}" for i in range(len(fields)))
                query = (
                    f"INSERT INTO todo_items({', '.join(fields)}) "
                    f"VALUES({placeholders}) ON CONFLICT (id) DO NOTHING"
                )
                await conn.execute(query, *values)
        finally:
            await conn.close()
    _run(_insert())


@given("the groceries_items table contains:")
def given_groceries_items_table(datatable):
    async def _insert():
        conn = await _conn()
        try:
            headers = datatable[0]
            for row in datatable[1:]:
                rec = {headers[i]: expand_id(row[i]) for i in range(len(headers))}
                await conn.execute(
                    """INSERT INTO groceries_items(id, name, description, unit, is_divisible, status)
                       VALUES($1, $2, $3, $4, $5, $6)
                       ON CONFLICT (id) DO NOTHING""",
                    UUID(rec["id"]),
                    rec.get("name", "Item"),
                    rec.get("description") or "",
                    rec.get("unit", "piece"),
                    (rec.get("is_divisible") or "true").lower() == "true",
                    rec.get("status", "active"),
                )
        finally:
            await conn.close()
    _run(_insert())


@given("the groceries_sections table contains:")
def given_groceries_sections_table(datatable):
    async def _insert():
        conn = await _conn()
        try:
            headers = datatable[0]
            for row in datatable[1:]:
                rec = {headers[i]: expand_id(row[i]) for i in range(len(headers))}
                await conn.execute(
                    """INSERT INTO groceries_sections(id, name, icon, position, status)
                       VALUES($1, $2, $3, $4, $5)
                       ON CONFLICT (id) DO NOTHING""",
                    UUID(rec["id"]),
                    rec.get("name", "Section"),
                    rec.get("icon") or None,
                    int(rec.get("position") or 0),
                    rec.get("status", "active"),
                )
        finally:
            await conn.close()
    _run(_insert())


@given("the groceries_item_sections table contains:")
def given_groceries_item_sections_table(datatable):
    async def _insert():
        conn = await _conn()
        try:
            headers = datatable[0]
            for row in datatable[1:]:
                rec = {headers[i]: expand_id(row[i]) for i in range(len(headers))}
                await conn.execute(
                    """INSERT INTO groceries_item_sections(groceries_item_id, groceries_section_id)
                       VALUES($1, $2)
                       ON CONFLICT DO NOTHING""",
                    UUID(rec["groceries_item_id"]),
                    UUID(rec["groceries_section_id"]),
                )
        finally:
            await conn.close()
    _run(_insert())


@given("the groceries_instance_items table contains:")
def given_groceries_instance_items_table(datatable):
    async def _insert():
        conn = await _conn()
        try:
            headers = datatable[0]
            for row in datatable[1:]:
                rec = {headers[i]: expand_id(row[i]) for i in range(len(headers))}
                await conn.execute(
                    """INSERT INTO groceries_instance_items(id, feature_instance_id, groceries_item_id, renewal_duration_days, status)
                       VALUES($1, $2, $3, $4, $5)
                       ON CONFLICT (id) DO NOTHING""",
                    UUID(rec["id"]),
                    UUID(rec["feature_instance_id"]),
                    UUID(rec["groceries_item_id"]),
                    int(rec.get("renewal_duration_days", "0")),
                    rec.get("status", "active"),
                )
        finally:
            await conn.close()
    _run(_insert())


@given("the groceries_lists table contains:")
def given_groceries_lists_table(datatable):
    async def _insert():
        conn = await _conn()
        try:
            headers = datatable[0]
            for row in datatable[1:]:
                rec = {headers[i]: expand_id(row[i]) for i in range(len(headers))}
                assigned = rec.get("assigned_person_id")
                await conn.execute(
                    """INSERT INTO groceries_lists(id, feature_instance_id, name, scheduled_date, list_status, assigned_person_id, force_on_dashboard, is_favorite, status)
                       VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9)
                       ON CONFLICT (id) DO NOTHING""",
                    UUID(rec["id"]),
                    UUID(rec["feature_instance_id"]),
                    rec.get("name") or None,
                    coerce("scheduled_date", rec["scheduled_date"]),
                    rec.get("list_status", "planned"),
                    UUID(assigned) if assigned else None,
                    (rec.get("force_on_dashboard") or "false").lower() == "true",
                    (rec.get("is_favorite") or "false").lower() == "true",
                    rec.get("status", "active"),
                )
        finally:
            await conn.close()
    _run(_insert())


@given("the groceries_list_items table contains:")
def given_groceries_list_items_table(datatable):
    async def _insert():
        conn = await _conn()
        try:
            headers = datatable[0]
            for row in datatable[1:]:
                rec = {headers[i]: expand_id(row[i]) for i in range(len(headers))}
                picked_up_at = rec.get("picked_up_at")
                groceries_item_id = rec.get("groceries_item_id")
                await conn.execute(
                    """INSERT INTO groceries_list_items(id, groceries_list_id, groceries_item_id, custom_name,
                                                          custom_unit, comment, quantity, picked_up, picked_up_at,
                                                          position, status)
                       VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                       ON CONFLICT (id) DO NOTHING""",
                    UUID(rec["id"]),
                    UUID(rec["groceries_list_id"]),
                    UUID(groceries_item_id) if groceries_item_id else None,
                    rec.get("custom_name") or None,
                    rec.get("custom_unit") or None,
                    rec.get("comment") or None,
                    float(rec.get("quantity", "0")),
                    (rec.get("picked_up") or "false").lower() == "true",
                    datetime.fromisoformat(picked_up_at) if picked_up_at else None,
                    coerce("position", rec.get("position", "0")),
                    rec.get("status", "active"),
                )
        finally:
            await conn.close()
    _run(_insert())


# ── Given: managed/delta tracking tables ──────────────────────────────────────

@given("the managed_roles table contains:")
def given_managed_roles_table(context, datatable):
    async def _snapshot_and_insert():
        conn = await _conn()
        try:
            existing = await conn.fetch("SELECT id FROM roles")
            context["_baseline_roles"] = {str(r["id"]) for r in existing}
            headers = datatable[0]
            for row in datatable[1:]:
                rec = {headers[i]: expand_id(row[i]) for i in range(len(headers))}
                uid = rec.get("id")
                if not uid:
                    continue
                await conn.execute(
                    """INSERT INTO roles(id, name, status) VALUES($1, $2, $3)
                       ON CONFLICT (id) DO NOTHING""",
                    UUID(uid),
                    rec.get("name", ""),
                    rec.get("status", "active"),
                )
        finally:
            await conn.close()
    _run(_snapshot_and_insert())


@given("the managed_users table contains:")
def given_managed_users_table(context, datatable):
    async def _snapshot_and_insert():
        conn = await _conn()
        try:
            existing = await conn.fetch("SELECT id FROM users")
            context["_baseline_users"] = {str(r["id"]) for r in existing}
            headers = datatable[0]
            for row in datatable[1:]:
                rec = {headers[i]: expand_id(row[i]) for i in range(len(headers))}
                uid = rec.get("id")
                if not uid:
                    continue
                email = rec.get("email", f"user_{uid[:8]}@test.com")
                login = rec.get("login", email)
                url_param = rec.get("url_param_id", url_param_id_from_uuid(uid))
                await conn.execute(
                    """INSERT INTO users(id, url_param_id, login, email, status)
                       VALUES($1, $2, $3, $4, $5)
                       ON CONFLICT (id) DO NOTHING""",
                    UUID(uid),
                    url_param,
                    login,
                    email,
                    rec.get("status", "active"),
                )
        finally:
            await conn.close()
    _run(_snapshot_and_insert())


@given("the created_users table contains:")
def given_created_users_table(context, datatable):
    async def _snapshot_and_insert():
        conn = await _conn()
        try:
            existing = await conn.fetch("SELECT id FROM users")
            context["_baseline_users"] = {str(r["id"]) for r in existing}
            headers = datatable[0]
            for row in datatable[1:]:
                rec = {headers[i]: expand_id(row[i]) for i in range(len(headers))}
                uid = rec.get("id")
                if not uid:
                    continue
                email = rec.get("email", f"user_{uid[:8]}@test.com")
                login = rec.get("login", email)
                url_param = rec.get("url_param_id", url_param_id_from_uuid(uid))
                await conn.execute(
                    """INSERT INTO users(id, url_param_id, login, email, status)
                       VALUES($1, $2, $3, $4, $5)
                       ON CONFLICT (id) DO NOTHING""",
                    UUID(uid),
                    url_param,
                    login,
                    email,
                    rec.get("status", "active"),
                )
        finally:
            await conn.close()
    _run(_snapshot_and_insert())


# ── When ──────────────────────────────────────────────────────────────────────

@when(parsers.re(r"I POST (?P<path>\S+) with body:"))
def post_with_json_body(context, path, docstring):
    body = expand_json_ids(json.loads(docstring))
    context["response"] = context["client"].post(expand_path_ids(path), json=body)


@when(parsers.re(r"I PUT (?P<path>\S+) with body:"))
def put_with_json_body(context, path, docstring):
    body = expand_json_ids(json.loads(docstring))
    context["response"] = context["client"].put(expand_path_ids(path), json=body)


@when(parsers.re(r"I PATCH (?P<path>\S+) with body:"))
def patch_with_json_body(context, path, docstring):
    body = expand_json_ids(json.loads(docstring))
    context["response"] = context["client"].patch(expand_path_ids(path), json=body)


@when(parsers.re(r"I PATCH (?P<path>\S+)$"))
def patch_no_body(context, path):
    context["response"] = context["client"].patch(expand_path_ids(path))


@when(parsers.re(r"I POST (?P<path>\S+)$"))
def post_no_body(context, path):
    context["response"] = context["client"].post(expand_path_ids(path))


@when(parsers.re(r"I GET (?P<path>\S+)"))
def get_resource(context, path):
    context["response"] = context["client"].get(expand_path_ids(path))


@when(parsers.re(r"I DELETE (?P<path>\S+) with body:"))
def delete_with_json_body(context, path, docstring):
    body = expand_json_ids(json.loads(docstring))
    context["response"] = context["client"].request(
        "DELETE", expand_path_ids(path), json=body
    )


@when(parsers.re(r"I DELETE (?P<path>\S+)"))
def delete_resource(context, path):
    context["response"] = context["client"].delete(expand_path_ids(path))


# ── Then: response assertions ─────────────────────────────────────────────────

@then(parsers.parse("the response status code is {status_code:d}"))
def check_status_code(context, status_code):
    assert context["response"].status_code == status_code, (
        f"Expected {status_code}, got {context['response'].status_code}: {context['response'].text}"
    )


@then(parsers.parse('the response content type is "{content_type}"'))
def check_content_type(context, content_type):
    actual = context["response"].headers.get("content-type", "")
    assert actual.startswith(content_type), f"Expected content type {content_type!r}, got {actual!r}"


@then("the response body is a valid PDF")
def check_response_is_pdf(context):
    assert context["response"].content.startswith(b"%PDF"), "Response body does not start with a PDF signature"


@when("I GET the same URL again")
def get_same_url_again(context):
    context["previous_response"] = context["response"]
    context["response"] = context["client"].get(str(context["response"].request.url))


@then("the response body is byte-identical to the previous response")
def check_response_identical_to_previous(context):
    assert context["response"].content == context["previous_response"].content, (
        "Expected the cached PDF bytes to be reused, but the response body changed"
    )


@then(parsers.parse("the guitar_songs_layout_pdf_cache table has a cached entry for song {song_id}"))
def check_pdf_cache_exists(song_id):
    async def _check():
        conn = await _conn()
        try:
            row = await conn.fetchrow(
                "SELECT content_hash, pdf_bytes FROM guitar_songs_layout_pdf_cache "
                "WHERE song_id = $1 AND status = 'active'",
                UUID(expand_id(song_id)),
            )
            assert row is not None, f"Expected a cached PDF row for song {song_id}"
            assert row["content_hash"], "Expected a non-empty content_hash"
            assert row["pdf_bytes"], "Expected non-empty pdf_bytes"
        finally:
            await conn.close()
    _run(_check())


@then(parsers.parse("block {block_id} still links to an active 'sections' block"))
def check_block_links_to_active_sections_block(block_id):
    """The new block a mirror is remapped to on a row replace has a server-generated id that
    can't be known ahead of time, so this checks the relationship holds rather than a literal id."""
    async def _check():
        conn = await _conn()
        try:
            row = await conn.fetchrow(
                """SELECT a.linked_to_block_id, b.status AS target_status, b.block_type AS target_block_type
                   FROM guitar_songs_layout_column_blocks a
                   LEFT JOIN guitar_songs_layout_column_blocks b ON b.id = a.linked_to_block_id
                   WHERE a.id = $1""",
                UUID(expand_id(block_id)),
            )
            assert row is not None, f"block {block_id} not found"
            assert row["linked_to_block_id"] is not None, f"block {block_id} has no linked_to_block_id"
            assert row["target_status"] == "active", f"block {block_id}'s link target is not active: {row['target_status']}"
            assert row["target_block_type"] == "sections", f"block {block_id}'s link target is not a 'sections' block"
        finally:
            await conn.close()
    _run(_check())


@then(parsers.parse("row {row_id}'s mirror block resolves to lyrics text {expected_text}"))
def check_row_mirror_block_resolves(row_id, expected_text):
    """A row replace archives and recreates EVERY block of the row, including both a mirror and
    its target when both sit in the same row -- so neither has a predictable id to assert on
    directly. Finds the row's current active linking 'sections' block by its row (stable across
    the replace) instead, and checks its link target's lyrics_text -- proof the link was
    repointed at the new target rather than left dangling or paired with the wrong sibling."""
    async def _check():
        conn = await _conn()
        try:
            row = await conn.fetchrow(
                """SELECT target.lyrics_text, target.status AS target_status
                   FROM guitar_songs_layout_column_blocks a
                   JOIN guitar_songs_layout_columns c ON c.id = a.column_id
                   JOIN guitar_songs_layout_column_blocks target ON target.id = a.linked_to_block_id
                   WHERE c.row_id = $1 AND a.status = 'active' AND a.block_type = 'sections'
                         AND a.linked_to_block_id IS NOT NULL""",
                UUID(expand_id(row_id)),
            )
            assert row is not None, f"row {row_id} has no active linking 'sections' block"
            assert row["target_status"] == "active", f"row {row_id}'s mirror target is not active: {row['target_status']}"
            assert row["lyrics_text"] == expected_text, f"expected lyrics text {expected_text!r}, got {row['lyrics_text']!r}"
        finally:
            await conn.close()
    _run(_check())


@then(parsers.parse("block {block_id} no longer links to a block"))
def check_block_link_cleared(block_id):
    async def _check():
        conn = await _conn()
        try:
            row = await conn.fetchrow(
                "SELECT linked_to_block_id FROM guitar_songs_layout_column_blocks WHERE id = $1",
                UUID(expand_id(block_id)),
            )
            assert row is not None, f"block {block_id} not found"
            assert row["linked_to_block_id"] is None, f"block {block_id} still links to {row['linked_to_block_id']}"
        finally:
            await conn.close()
    _run(_check())


@then("the response body is:")
def check_response_body(context, docstring):
    expected = expand_json_ids(json.loads(docstring))
    actual = context["response"].json()
    assert actual == expected, (
        f"Expected:\n{json.dumps(expected, indent=2)}\nActual:\n{json.dumps(actual, indent=2)}"
    )


def _check_includes(actual, expected, path="root"):
    if isinstance(expected, dict):
        assert isinstance(actual, dict), f"{path}: expected dict, got {type(actual).__name__}"
        for key, exp_val in expected.items():
            assert key in actual, f"{path}.{key}: key not found in response"
            _check_includes(actual[key], exp_val, f"{path}.{key}")
    elif isinstance(expected, list):
        assert isinstance(actual, list), f"{path}: expected list, got {type(actual).__name__}"
        assert len(actual) == len(expected), f"{path}: expected {len(expected)} item(s), got {len(actual)}"
        for i, (act_item, exp_item) in enumerate(zip(actual, expected)):
            _check_includes(act_item, exp_item, f"{path}[{i}]")
    else:
        assert actual == expected, f"{path}: expected {expected!r}, got {actual!r}"


@then("the response body includes:")
def check_response_body_includes(context, docstring):
    expected = expand_json_ids(json.loads(docstring))
    actual = context["response"].json()
    _check_includes(actual, expected)


# ── Then: DB-state assertions ─────────────────────────────────────────────────

async def _query_table(table: str, headers: list) -> list[dict]:
    conn = await _conn()
    try:
        cols = ", ".join(f'"{h}"' for h in headers)
        rows = await conn.fetch(f"SELECT {cols} FROM {table} ORDER BY created_at, id")
        return [dict(r) for r in rows]
    finally:
        await conn.close()


def _compare_rows(table: str, headers: list, expected_rows: list, actual_rows: list) -> None:
    assert len(actual_rows) == len(expected_rows), (
        f"{table}: expected {len(expected_rows)} rows, got {len(actual_rows)}"
    )
    for i, (exp, act) in enumerate(zip(expected_rows, actual_rows)):
        for j, col in enumerate(headers):
            act_val = act[col]
            if isinstance(act_val, bool):
                act_str = str(act_val).lower()
                exp_val = exp[j].lower()
            elif isinstance(act_val, int):
                act_str = str(act_val)
                exp_val = exp[j]
            else:
                if act_val is None:
                    act_str = ""
                elif isinstance(act_val, datetime):
                    act_str = act_val.isoformat()
                else:
                    act_str = str(act_val)
                exp_val = expand_id(exp[j])
                relative_date = resolve_relative_date(exp_val)
                if relative_date is not None:
                    exp_val = relative_date.isoformat()
            assert act_str == exp_val, f"{table}[{i}].{col}: expected {exp_val!r}, got {act_str!r}"


def _assert_db(table: str, datatable: list):
    headers = datatable[0]
    expected_rows = datatable[1:]
    actual_rows = _run(_query_table(table, headers))
    _compare_rows(table, headers, expected_rows, actual_rows)


@then("the persons table contains:")
def then_persons_table(datatable):
    _assert_db("persons", datatable)


@then("the represents table contains:")
def then_represents_table(datatable):
    _assert_db("represents", datatable)


@then("the documents table contains:")
def then_documents_table(datatable):
    _assert_db("documents", datatable)


@then("the labels table contains:")
def then_labels_table(datatable):
    _assert_db("labels", datatable)


@then("the app_config table contains:")
def then_app_config_table(datatable):
    _assert_db("app_config", datatable)


@then("the projects table contains:")
def then_projects_table(datatable):
    _assert_db("projects", datatable)


@then("the tribes table contains:")
def then_tribes_table(datatable):
    _assert_db("tribes", datatable)


@then("the positions table contains:")
def then_positions_table(datatable):
    _assert_db("positions", datatable)


@then("the managed_roles table contains:")
def then_managed_roles_table(context, datatable):
    headers = datatable[0]
    expected_rows = datatable[1:]
    baseline = context.get("_baseline_roles", set())

    async def _query():
        conn = await _conn()
        try:
            cols = ", ".join(f'"{h}"' for h in headers)
            if baseline:
                rows = await conn.fetch(
                    f"SELECT {cols} FROM roles WHERE id != ALL($1::uuid[]) ORDER BY created_at, id",
                    [UUID(bid) for bid in baseline],
                )
            else:
                rows = await conn.fetch(f"SELECT {cols} FROM roles ORDER BY created_at, id")
            return [dict(r) for r in rows]
        finally:
            await conn.close()

    actual_rows = _run(_query())
    assert len(actual_rows) == len(expected_rows), (
        f"managed_roles: expected {len(expected_rows)} rows, got {len(actual_rows)}"
    )
    for i, (exp, act) in enumerate(zip(expected_rows, actual_rows)):
        for j, col in enumerate(headers):
            exp_val = expand_id(exp[j])
            act_str = str(act[col]) if act[col] is not None else ""
            assert act_str == exp_val, f"managed_roles[{i}].{col}: expected {exp_val!r}, got {act_str!r}"


@then("the managed_users table contains:")
def then_managed_users_table(context, datatable):
    _then_delta_users(context, datatable, "managed_users")


@then("the created_users table contains:")
def then_created_users_table(context, datatable):
    _then_delta_users(context, datatable, "created_users")


def _then_delta_users(context, datatable, label):
    headers = datatable[0]
    expected_rows = datatable[1:]
    baseline = context.get("_baseline_users", set())

    async def _query():
        conn = await _conn()
        try:
            cols = ", ".join(f'"{h}"' for h in headers)
            if baseline:
                rows = await conn.fetch(
                    f"SELECT {cols} FROM users WHERE id != ALL($1::uuid[]) ORDER BY created_at, id",
                    [UUID(bid) for bid in baseline],
                )
            else:
                rows = await conn.fetch(f"SELECT {cols} FROM users ORDER BY created_at, id")
            return [dict(r) for r in rows]
        finally:
            await conn.close()

    actual_rows = _run(_query())
    assert len(actual_rows) == len(expected_rows), (
        f"{label}: expected {len(expected_rows)} rows, got {len(actual_rows)}"
    )
    for i, (exp, act) in enumerate(zip(expected_rows, actual_rows)):
        for j, col in enumerate(headers):
            exp_val = expand_id(exp[j])
            act_str = str(act[col]) if act[col] is not None else ""
            assert act_str == exp_val, f"{label}[{i}].{col}: expected {exp_val!r}, got {act_str!r}"


@then("the users table contains:")
def then_users_table(datatable):
    _assert_db("users", datatable)


@then("the notifications table contains:")
def then_notifications_table(datatable):
    _assert_db("notifications", datatable)


@then("the publications table contains:")
def then_publications_table(datatable):
    _assert_db("publications", datatable)


@then("the kanban_columns table contains:")
def then_kanban_columns_table(datatable):
    _assert_db("kanban_columns", datatable)


@then("the kanban_cards table contains:")
def then_kanban_cards_table(datatable):
    _assert_db("kanban_cards", datatable)


@then("the todo_items table contains:")
def then_todo_items_table(datatable):
    _assert_db("todo_items", datatable)


@then("the groceries_items table contains:")
def then_groceries_items_table(datatable):
    _assert_db("groceries_items", datatable)


@then("the groceries_sections table contains:")
def then_groceries_sections_table(datatable):
    _assert_db("groceries_sections", datatable)


@then("the groceries_item_sections table contains:")
def then_groceries_item_sections_table(datatable):
    _assert_db("groceries_item_sections", datatable)


@then("the groceries_instance_items table contains:")
def then_groceries_instance_items_table(datatable):
    _assert_db("groceries_instance_items", datatable)


@then("the groceries_lists table contains:")
def then_groceries_lists_table(datatable):
    _assert_db("groceries_lists", datatable)


@then("the groceries_list_items table contains:")
def then_groceries_list_items_table(datatable):
    _assert_db("groceries_list_items", datatable)


@then("the user_bookmarks table contains:")
def then_user_bookmarks_table(datatable):
    _assert_db("user_bookmarks", datatable)


@then("the projects_features table contains:")
def then_projects_features_table(datatable):
    _assert_db("projects_features", datatable)


@then("the tribes_projects table contains:")
def then_tribes_projects_table(datatable):
    headers = datatable[0]
    expected_rows = datatable[1:]

    async def _query():
        conn = await _conn()
        try:
            cols = ", ".join(f'"{h}"' for h in headers)
            rows = await conn.fetch(
                f"SELECT {cols} FROM tribes_projects ORDER BY tribe_id, project_id"
            )
            return [dict(r) for r in rows]
        finally:
            await conn.close()

    actual_rows = _run(_query())
    assert len(actual_rows) == len(expected_rows), (
        f"tribes_projects: expected {len(expected_rows)} rows, got {len(actual_rows)}"
    )
    for i, (exp, act) in enumerate(zip(expected_rows, actual_rows)):
        for j, col in enumerate(headers):
            act_val = act[col]
            act_str = str(act_val) if act_val is not None else ""
            exp_val = exp[j] if isinstance(act_val, int) else expand_id(exp[j])
            assert act_str == exp_val, f"tribes_projects[{i}].{col}: expected {exp_val!r}, got {act_str!r}"


@given("the label_entities table contains:")
def given_label_entities_table(datatable):
    async def _insert():
        conn = await _conn()
        try:
            for row in datatable[1:]:
                rec = {datatable[0][i]: expand_id(row[i]) for i in range(len(datatable[0]))}
                await conn.execute(
                    """INSERT INTO label_entities(label_id, entity_type, entity_id)
                       VALUES($1, $2, $3) ON CONFLICT DO NOTHING""",
                    UUID(rec["label_id"]),
                    rec["entity_type"],
                    UUID(rec["entity_id"]),
                )
        finally:
            await conn.close()
    _run(_insert())


@then("the label_entities table contains:")
def then_label_entities_table(datatable):
    _assert_db("label_entities", datatable)


@given("the user_tab_configs table contains:")
def given_user_tab_configs_table(datatable):
    async def _insert():
        conn = await _conn()
        try:
            for row in datatable[1:]:
                rec = {datatable[0][i]: expand_id(row[i]) for i in range(len(datatable[0]))}
                await conn.execute(
                    """INSERT INTO user_tab_configs(id, user_id, context_key, tab_configs)
                       VALUES($1, $2, $3, $4::jsonb) ON CONFLICT (id) DO NOTHING""",
                    UUID(rec["id"]),
                    UUID(rec["user_id"]),
                    rec["context_key"],
                    rec.get("tab_configs", "[]"),
                )
        finally:
            await conn.close()
    _run(_insert())


@then("the user_tab_configs table contains:")
def then_user_tab_configs_table(datatable):
    _assert_db("user_tab_configs", datatable)


@given("the user_quick_add_defaults table contains:")
def given_user_quick_add_defaults_table(datatable):
    async def _insert():
        conn = await _conn()
        try:
            headers = datatable[0]
            for row in datatable[1:]:
                rec = {headers[i]: expand_id(row[i]) for i in range(len(headers))}
                uid = rec.get("id")
                fi_id = rec.get("feature_instance_id")
                await conn.execute(
                    """INSERT INTO user_quick_add_defaults(id, user_id, quick_add_type, feature_instance_id, status)
                       VALUES(COALESCE($1, gen_random_uuid()), $2, $3, $4, $5)
                       ON CONFLICT (id) DO NOTHING""",
                    UUID(uid) if uid else None,
                    UUID(rec["user_id"]),
                    rec["quick_add_type"],
                    UUID(fi_id) if fi_id else None,
                    rec.get("status", "active"),
                )
        finally:
            await conn.close()
    _run(_insert())


@then("the user_quick_add_defaults table contains:")
def then_user_quick_add_defaults_table(datatable):
    _assert_db("user_quick_add_defaults", datatable)


@given("the guitar_chords table contains:")
def given_guitar_chords_table(datatable):
    async def _insert():
        conn = await _conn()
        try:
            headers = datatable[0]
            for row in datatable[1:]:
                rec = {headers[i]: expand_id(row[i]) for i in range(len(headers))}
                uid = rec.get("id")
                await conn.execute(
                    """INSERT INTO guitar_chords(id, name, root_note, description, frets, difficulty, status)
                       VALUES(COALESCE($1, gen_random_uuid()), $2, $3, $4, $5::jsonb, $6, $7)
                       ON CONFLICT (id) DO NOTHING""",
                    UUID(uid) if uid else None,
                    rec.get("name", "Chord"),
                    rec.get("root_note", "C"),
                    rec.get("description") or None,
                    rec.get("frets", "[]"),
                    coerce("difficulty", rec.get("difficulty", "")),
                    rec.get("status", "active"),
                )
        finally:
            await conn.close()
    _run(_insert())


@then("the guitar_chords table contains:")
def then_guitar_chords_table(datatable):
    _assert_db("guitar_chords", datatable)


async def _find_or_create_song_author(conn, project_id: UUID, name: str | None) -> UUID | None:
    """guitar_songs.author is a proper entity (guitar_song_author) under the hood, but feature
    files still write a plain author name — resolve or create the matching row transparently."""
    if not name:
        return None
    row = await conn.fetchrow(
        "SELECT id FROM guitar_song_author WHERE project_id = $1 AND name = $2", project_id, name
    )
    if row:
        return row["id"]
    row = await conn.fetchrow(
        "INSERT INTO guitar_song_author (project_id, name) VALUES ($1, $2) RETURNING id", project_id, name
    )
    return row["id"]


@given("the guitar_songs table contains:")
def given_guitar_songs_table(datatable):
    async def _insert():
        conn = await _conn()
        try:
            headers = datatable[0]
            for row in datatable[1:]:
                rec = {
                    headers[i]: (row[i] if is_int_column(headers[i]) else expand_id(row[i]))
                    for i in range(len(headers))
                }
                uid = rec.get("id")
                if not uid:
                    continue
                document_id = rec.get("document_id")
                project_id = UUID(rec["project_id"])
                author_id = await _find_or_create_song_author(conn, project_id, rec.get("author") or None)
                await conn.execute(
                    """INSERT INTO guitar_songs(
                           id, url_param_id, project_id, title, author_id, tempo_bpm, beats_per_bar, capo,
                           chord_diagram_style, chord_diagram_size,
                           lyrics_line_spacing_px, lyrics_text_size_px, lyrics_chord_size_px,
                           document_id, difficulty, song_state, status
                       )
                       VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
                       ON CONFLICT (id) DO NOTHING""",
                    UUID(uid),
                    rec.get("url_param_id", url_param_id_from_uuid(uid)),
                    project_id,
                    rec.get("title", "Song"),
                    author_id,
                    coerce("tempo_bpm", rec.get("tempo_bpm", "120")),
                    coerce("beats_per_bar", rec.get("beats_per_bar", "4")),
                    coerce("capo", rec.get("capo", "0")),
                    rec.get("chord_diagram_style", "full"),
                    rec.get("chord_diagram_size", "m"),
                    coerce("lyrics_line_spacing_px", rec.get("lyrics_line_spacing_px", "10")),
                    coerce("lyrics_text_size_px", rec.get("lyrics_text_size_px", "16")),
                    coerce("lyrics_chord_size_px", rec.get("lyrics_chord_size_px", "18")),
                    UUID(document_id) if document_id else None,
                    coerce("difficulty", rec.get("difficulty", "")),
                    rec.get("song_state", "draft"),
                    rec.get("status", "active"),
                )
        finally:
            await conn.close()
    _run(_insert())


async def _query_guitar_songs(headers: list) -> list[dict]:
    plain_cols = [h for h in headers if h != "author"]
    select_parts = [f's."{c}"' for c in plain_cols]
    join_sql = ""
    if "author" in headers:
        select_parts.append("a.name AS author")
        join_sql = "LEFT JOIN guitar_song_author a ON a.id = s.author_id"
    conn = await _conn()
    try:
        rows = await conn.fetch(
            f"SELECT {', '.join(select_parts)} FROM guitar_songs s {join_sql} ORDER BY s.created_at, s.id"
        )
        return [dict(r) for r in rows]
    finally:
        await conn.close()


@then("the guitar_songs table contains:")
def then_guitar_songs_table(datatable):
    headers = datatable[0]
    expected_rows = datatable[1:]
    actual_rows = _run(_query_guitar_songs(headers))
    _compare_rows("guitar_songs", headers, expected_rows, actual_rows)


@given("the guitar_songs_mastery table contains:")
def given_guitar_songs_mastery_table(datatable):
    async def _insert():
        conn = await _conn()
        try:
            headers = datatable[0]
            for row in datatable[1:]:
                rec = {
                    headers[i]: (row[i] if is_int_column(headers[i]) else expand_id(row[i]))
                    for i in range(len(headers))
                }
                uid = rec.get("id")
                await conn.execute(
                    """INSERT INTO guitar_songs_mastery(id, song_id, user_id, mastery_level, status)
                       VALUES(COALESCE($1, gen_random_uuid()), $2, $3, $4, $5)
                       ON CONFLICT (id) DO NOTHING""",
                    UUID(uid) if uid else None,
                    UUID(rec["song_id"]),
                    UUID(rec["user_id"]),
                    coerce("mastery_level", rec.get("mastery_level", "")),
                    rec.get("status", "active"),
                )
        finally:
            await conn.close()
    _run(_insert())


@then("the guitar_songs_mastery table contains:")
def then_guitar_songs_mastery_table(datatable):
    _assert_db("guitar_songs_mastery", datatable)


@given("the guitar_song_author table contains:")
def given_guitar_song_author_table(datatable):
    async def _insert():
        conn = await _conn()
        try:
            headers = datatable[0]
            for row in datatable[1:]:
                rec = {
                    headers[i]: (row[i] if is_int_column(headers[i]) else expand_id(row[i]))
                    for i in range(len(headers))
                }
                uid = rec.get("id")
                await conn.execute(
                    """INSERT INTO guitar_song_author(id, project_id, name, status)
                       VALUES(COALESCE($1, gen_random_uuid()), $2, $3, $4)
                       ON CONFLICT (id) DO NOTHING""",
                    UUID(uid) if uid else None,
                    UUID(rec["project_id"]),
                    rec.get("name", "Author"),
                    rec.get("status", "active"),
                )
        finally:
            await conn.close()
    _run(_insert())


@then("the guitar_song_author table contains:")
def then_guitar_song_author_table(datatable):
    _assert_db("guitar_song_author", datatable)


@given("the guitar_songs_videos table contains:")
def given_guitar_songs_videos_table(datatable):
    async def _insert():
        conn = await _conn()
        try:
            headers = datatable[0]
            for row in datatable[1:]:
                rec = {
                    headers[i]: (row[i] if is_int_column(headers[i]) else expand_id(row[i]))
                    for i in range(len(headers))
                }
                uid = rec.get("id")
                await conn.execute(
                    """INSERT INTO guitar_songs_videos(id, song_id, title, url, position, status)
                       VALUES(COALESCE($1, gen_random_uuid()), $2, $3, $4, $5, $6)
                       ON CONFLICT (id) DO NOTHING""",
                    UUID(uid) if uid else None,
                    UUID(rec["song_id"]),
                    rec.get("title") or None,
                    rec.get("url", "https://example.com/video"),
                    coerce("position", rec.get("position", "1")),
                    rec.get("status", "active"),
                )
        finally:
            await conn.close()
    _run(_insert())


@then("the guitar_songs_videos table contains:")
def then_guitar_songs_videos_table(datatable):
    _assert_db("guitar_songs_videos", datatable)


@given("the guitar_songs_chords table contains:")
def given_guitar_songs_chords_table(datatable):
    async def _insert():
        conn = await _conn()
        try:
            headers = datatable[0]
            for row in datatable[1:]:
                rec = {
                    headers[i]: (row[i] if is_int_column(headers[i]) else expand_id(row[i]))
                    for i in range(len(headers))
                }
                uid = rec.get("id")
                await conn.execute(
                    """INSERT INTO guitar_songs_chords(id, song_id, chord_id, position, comment, status)
                       VALUES(COALESCE($1, gen_random_uuid()), $2, $3, $4, $5, $6)
                       ON CONFLICT (id) DO NOTHING""",
                    UUID(uid) if uid else None,
                    UUID(rec["song_id"]),
                    UUID(rec["chord_id"]),
                    coerce("position", rec.get("position", "1")),
                    rec.get("comment") or None,
                    rec.get("status", "active"),
                )
        finally:
            await conn.close()
    _run(_insert())


@then("the guitar_songs_chords table contains:")
def then_guitar_songs_chords_table(datatable):
    _assert_db("guitar_songs_chords", datatable)


@given("the guitar_songs_layout_settings table contains:")
def given_guitar_songs_layout_settings_table(datatable):
    async def _insert():
        conn = await _conn()
        try:
            headers = datatable[0]
            for row in datatable[1:]:
                rec = {
                    headers[i]: (row[i] if is_int_column(headers[i]) else expand_id(row[i]))
                    for i in range(len(headers))
                }
                uid = rec.get("id")
                await conn.execute(
                    """INSERT INTO guitar_songs_layout_settings(
                           id, song_id, margin_top_mm, margin_right_mm, margin_bottom_mm, margin_left_mm, status
                       )
                       VALUES(COALESCE($1, gen_random_uuid()), $2, $3, $4, $5, $6, $7)
                       ON CONFLICT (id) DO NOTHING""",
                    UUID(uid) if uid else None,
                    UUID(rec["song_id"]),
                    float(rec.get("margin_top_mm", "15.0")),
                    float(rec.get("margin_right_mm", "15.0")),
                    float(rec.get("margin_bottom_mm", "15.0")),
                    float(rec.get("margin_left_mm", "15.0")),
                    rec.get("status", "active"),
                )
        finally:
            await conn.close()
    _run(_insert())


@then("the guitar_songs_layout_settings table contains:")
def then_guitar_songs_layout_settings_table(datatable):
    _assert_db("guitar_songs_layout_settings", datatable)


@given("the guitar_songs_layout_rows table contains:")
def given_guitar_songs_layout_rows_table(datatable):
    async def _insert():
        conn = await _conn()
        try:
            headers = datatable[0]
            for row in datatable[1:]:
                rec = {
                    headers[i]: (row[i] if is_int_column(headers[i]) else expand_id(row[i]))
                    for i in range(len(headers))
                }
                uid = rec.get("id")
                await conn.execute(
                    """INSERT INTO guitar_songs_layout_rows(id, song_id, position, page_break_before, status)
                       VALUES(COALESCE($1, gen_random_uuid()), $2, $3, $4, $5)
                       ON CONFLICT (id) DO NOTHING""",
                    UUID(uid) if uid else None,
                    UUID(rec["song_id"]),
                    coerce("position", rec.get("position", "1")),
                    rec.get("page_break_before", "false").lower() == "true",
                    rec.get("status", "active"),
                )
        finally:
            await conn.close()
    _run(_insert())


@then("the guitar_songs_layout_rows table contains:")
def then_guitar_songs_layout_rows_table(datatable):
    _assert_db("guitar_songs_layout_rows", datatable)


@given("the guitar_songs_layout_columns table contains:")
def given_guitar_songs_layout_columns_table(datatable):
    async def _insert():
        conn = await _conn()
        try:
            headers = datatable[0]
            for row in datatable[1:]:
                rec = {
                    headers[i]: (row[i] if is_int_column(headers[i]) else expand_id(row[i]))
                    for i in range(len(headers))
                }
                uid = rec.get("id")
                await conn.execute(
                    """INSERT INTO guitar_songs_layout_columns(
                           id, row_id, song_id, position, width_twelfths, align,
                           padding_top_mm, padding_right_mm, padding_bottom_mm, padding_left_mm, status
                       )
                       VALUES(COALESCE($1, gen_random_uuid()), $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                       ON CONFLICT (id) DO NOTHING""",
                    UUID(uid) if uid else None,
                    UUID(rec["row_id"]),
                    UUID(rec["song_id"]),
                    coerce("position", rec.get("position", "1")),
                    coerce("width_twelfths", rec.get("width_twelfths", "12")),
                    rec.get("align", "left"),
                    float(rec.get("padding_top_mm", "0")),
                    float(rec.get("padding_right_mm", "0")),
                    float(rec.get("padding_bottom_mm", "0")),
                    float(rec.get("padding_left_mm", "0")),
                    rec.get("status", "active"),
                )
        finally:
            await conn.close()
    _run(_insert())


async def _query_layout_columns(headers: list) -> list[dict]:
    """Columns inserted together (same row) share one transaction timestamp, so ordering by
    created_at/id (the generic _assert_db query) is not deterministic — order by the row's
    then the column's own position instead, matching reading order top-to-bottom, left-to-right."""
    cols = ", ".join(f'c."{h}"' for h in headers)
    conn = await _conn()
    try:
        rows = await conn.fetch(
            f'SELECT {cols} FROM guitar_songs_layout_columns c '
            'JOIN guitar_songs_layout_rows r ON r.id = c.row_id '
            'ORDER BY r.position ASC, c.position ASC, c.created_at ASC, c.id ASC'
        )
        return [dict(r) for r in rows]
    finally:
        await conn.close()


@then("the guitar_songs_layout_columns table contains:")
def then_guitar_songs_layout_columns_table(datatable):
    headers = datatable[0]
    expected_rows = datatable[1:]
    actual_rows = _run(_query_layout_columns(headers))
    _compare_rows("guitar_songs_layout_columns", headers, expected_rows, actual_rows)


@given("the guitar_songs_layout_column_blocks table contains:")
def given_guitar_songs_layout_column_blocks_table(datatable):
    async def _insert():
        conn = await _conn()
        try:
            headers = datatable[0]
            for row in datatable[1:]:
                rec = {
                    headers[i]: (row[i] if is_int_column(headers[i]) else expand_id(row[i]))
                    for i in range(len(headers))
                }
                uid = rec.get("id")
                custom_document_id = rec.get("custom_document_id")
                chord_grid_rows = rec.get("chord_grid_rows")
                lyrics_words = rec.get("lyrics_words")
                linked_to_block_id = rec.get("linked_to_block_id")
                chords = rec.get("chords")
                await conn.execute(
                    """INSERT INTO guitar_songs_layout_column_blocks(
                           id, column_id, song_id, position, block_type, width_twelfths, custom_title,
                           custom_document_id, chord_grid_rows, lyrics_text, lyrics_words,
                           linked_to_block_id, chords, status
                       )
                       VALUES(COALESCE($1, gen_random_uuid()), $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10,
                              $11::jsonb, $12, $13::jsonb, $14)
                       ON CONFLICT (id) DO NOTHING""",
                    UUID(uid) if uid else None,
                    UUID(rec["column_id"]),
                    UUID(rec["song_id"]),
                    coerce("position", rec.get("position", "1")),
                    rec.get("block_type", "title"),
                    coerce("width_twelfths", rec.get("width_twelfths", "12")),
                    rec.get("custom_title") or None,
                    UUID(custom_document_id) if custom_document_id else None,
                    chord_grid_rows or None,
                    rec.get("lyrics_text") or None,
                    lyrics_words or None,
                    UUID(linked_to_block_id) if linked_to_block_id else None,
                    chords or None,
                    rec.get("status", "active"),
                )
        finally:
            await conn.close()
    _run(_insert())


async def _query_layout_column_blocks(headers: list) -> list[dict]:
    """Blocks inserted together (same row's columns) share one transaction timestamp — order by
    the row's, then the column's, then the block's own position, matching reading order."""
    cols = ", ".join(f'b."{h}"' for h in headers)
    conn = await _conn()
    try:
        rows = await conn.fetch(
            f'SELECT {cols} FROM guitar_songs_layout_column_blocks b '
            'JOIN guitar_songs_layout_columns c ON c.id = b.column_id '
            'JOIN guitar_songs_layout_rows r ON r.id = c.row_id '
            'ORDER BY r.position ASC, c.position ASC, b.position ASC, b.created_at ASC, b.id ASC'
        )
        return [dict(r) for r in rows]
    finally:
        await conn.close()


@then("the guitar_songs_layout_column_blocks table contains:")
def then_guitar_songs_layout_column_blocks_table(datatable):
    headers = datatable[0]
    expected_rows = datatable[1:]
    actual_rows = _run(_query_layout_column_blocks(headers))
    _compare_rows("guitar_songs_layout_column_blocks", headers, expected_rows, actual_rows)


@given("the search_index table contains:")
def given_search_index_table(datatable):
    async def _insert():
        conn = await _conn()
        try:
            headers = datatable[0]
            for row in datatable[1:]:
                rec = {headers[i]: expand_id(row[i]) for i in range(len(headers))}
                entity_id = rec.get("entity_id")
                entity_type = rec.get("entity_type")
                if not entity_id or not entity_type:
                    continue
                await conn.execute(
                    """INSERT INTO search_index
                           (entity_type, entity_id, content_text, content_summary, routing_path, status)
                       VALUES($1, $2, $3, $4, $5, $6)
                       ON CONFLICT (entity_type, entity_id) DO NOTHING""",
                    entity_type,
                    UUID(entity_id),
                    rec.get("content_text", ""),
                    rec.get("content_summary"),
                    rec.get("routing_path", "/app"),
                    rec.get("status", "active"),
                )
        finally:
            await conn.close()
    _run(_insert())


@then("the search_index table contains:")
def then_search_index_table(datatable):
    _assert_db("search_index", datatable)


def _parse_dt(value: str | None):
    if not value:
        return None
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


@given("the events table contains:")
def given_events_table(datatable):
    async def _insert():
        conn = await _conn()
        try:
            headers = datatable[0]
            for row in datatable[1:]:
                rec = {headers[i]: expand_id(row[i]) for i in range(len(headers))}
                uid = rec.get("id")
                if not uid:
                    continue
                await conn.execute(
                    """INSERT INTO events(id, feature_instance_id, title, start_at, end_at, all_day, color, status)
                       VALUES($1, $2, $3, $4, $5, $6, $7, $8)
                       ON CONFLICT (id) DO NOTHING""",
                    UUID(uid),
                    UUID(rec["feature_instance_id"]),
                    rec.get("title", "Event"),
                    _parse_dt(rec.get("start_at")),
                    _parse_dt(rec.get("end_at")),
                    rec.get("all_day", "false").lower() == "true",
                    rec.get("color", "#6b7280"),
                    rec.get("status", "active"),
                )
        finally:
            await conn.close()
    _run(_insert())


@then("the events table contains:")
def then_events_table(datatable):
    _assert_db("events", datatable)


@given("the events_participants table contains:")
def given_events_participants_table(datatable):
    async def _insert():
        conn = await _conn()
        try:
            headers = datatable[0]
            for row in datatable[1:]:
                rec = {headers[i]: expand_id(row[i]) for i in range(len(headers))}
                uid = rec.get("id")
                if not uid:
                    continue
                await conn.execute(
                    """INSERT INTO events_participants(id, event_id, person_id, status)
                       VALUES($1, $2, $3, $4)
                       ON CONFLICT (id) DO NOTHING""",
                    UUID(uid),
                    UUID(rec["event_id"]),
                    UUID(rec["person_id"]),
                    rec.get("status", "active"),
                )
        finally:
            await conn.close()
    _run(_insert())


@then("the events_participants table contains:")
def then_events_participants_table(datatable):
    headers = datatable[0]
    expected_rows = datatable[1:]

    async def _query():
        conn = await _conn()
        try:
            cols = ", ".join(f'"{h}"' for h in headers)
            rows = await conn.fetch(
                f"SELECT {cols} FROM events_participants ORDER BY created_at, id"
            )
            return [dict(r) for r in rows]
        finally:
            await conn.close()

    actual_rows = _run(_query())
    assert len(actual_rows) == len(expected_rows), (
        f"events_participants: expected {len(expected_rows)} rows, got {len(actual_rows)}"
    )
    for i, (exp, act) in enumerate(zip(expected_rows, actual_rows)):
        for j, col in enumerate(headers):
            act_val = act[col]
            act_str = str(act_val) if act_val is not None else ""
            exp_val = exp[j] if isinstance(act_val, int) else expand_id(exp[j])
            assert act_str == exp_val, (
                f"events_participants[{i}].{col}: expected {exp_val!r}, got {act_str!r}"
            )


@given("the push_subscriptions table contains:")
def given_push_subscriptions_table(datatable):
    async def _insert():
        conn = await _conn()
        try:
            headers = datatable[0]
            for row in datatable[1:]:
                rec = {headers[i]: expand_id(row[i]) for i in range(len(headers))}
                uid = rec.get("id")
                if not uid:
                    continue
                await conn.execute(
                    """INSERT INTO push_subscriptions(id, user_id, endpoint, p256dh, auth, status)
                       VALUES($1, $2, $3, $4, $5, $6)
                       ON CONFLICT (id) DO NOTHING""",
                    UUID(uid),
                    UUID(rec["user_id"]),
                    rec["endpoint"],
                    rec.get("p256dh", ""),
                    rec.get("auth", ""),
                    rec.get("status", "active"),
                )
        finally:
            await conn.close()
    _run(_insert())


@then("the push_subscriptions table contains:")
def then_push_subscriptions_table(datatable):
    _assert_db("push_subscriptions", datatable)


@given("the dashboard_pinned_tabs table contains:")
def given_dashboard_pinned_tabs_table(datatable):
    async def _insert():
        conn = await _conn()
        try:
            headers = datatable[0]
            for row in datatable[1:]:
                rec = {headers[i]: expand_id(row[i]) for i in range(len(headers))}
                uid = rec.get("id")
                user_id = rec.get("user_id")
                bookmark_id = rec.get("bookmark_id")
                if not user_id or not bookmark_id:
                    continue
                if uid:
                    await conn.execute(
                        """INSERT INTO dashboard_pinned_tabs(id, user_id, bookmark_id, display_order, status)
                           VALUES($1, $2, $3, $4, $5)
                           ON CONFLICT (id) DO NOTHING""",
                        UUID(uid),
                        UUID(user_id),
                        UUID(bookmark_id),
                        coerce("display_order", rec.get("display_order", "0")),
                        rec.get("status", "active"),
                    )
                else:
                    await conn.execute(
                        """INSERT INTO dashboard_pinned_tabs(user_id, bookmark_id, display_order, status)
                           VALUES($1, $2, $3, $4)""",
                        UUID(user_id),
                        UUID(bookmark_id),
                        coerce("display_order", rec.get("display_order", "0")),
                        rec.get("status", "active"),
                    )
        finally:
            await conn.close()
    _run(_insert())


@then("the dashboard_pinned_tabs table contains:")
def then_dashboard_pinned_tabs_table(datatable):
    _assert_db("dashboard_pinned_tabs", datatable)


@given("the reminders table contains:")
def given_reminders_table(datatable):
    async def _insert():
        conn = await _conn()
        try:
            headers = datatable[0]
            for row in datatable[1:]:
                rec = {headers[i]: expand_id(row[i]) for i in range(len(headers))}
                uid = rec.get("id")
                if not uid:
                    continue
                remind_at_raw = rec.get("remind_at")
                remind_at = _parse_created_at(remind_at_raw) if remind_at_raw else None
                sent_raw = rec.get("sent", "false")
                sent = sent_raw.lower() == "true" if isinstance(sent_raw, str) else bool(sent_raw)
                created_by_raw = rec.get("created_by")
                await conn.execute(
                    """INSERT INTO reminders(id, entity_type, entity_id, remind_at, reminder_type, sent, created_by)
                       VALUES($1, $2, $3, $4, $5, $6, $7)
                       ON CONFLICT (id) DO NOTHING""",
                    UUID(uid), rec["entity_type"], UUID(rec["entity_id"]), remind_at,
                    rec.get("reminder_type", "notification"), sent,
                    UUID(created_by_raw) if created_by_raw else None,
                )
        finally:
            await conn.close()
    _run(_insert())


@given("the recipes table contains:")
def given_recipes_table(datatable):
    async def _insert():
        conn = await _conn()
        try:
            headers = datatable[0]
            for row in datatable[1:]:
                rec = {headers[i]: expand_id(row[i]) for i in range(len(headers))}
                uid = rec.get("id")
                if not uid:
                    continue
                document_id = rec.get("document_id")
                await conn.execute(
                    """INSERT INTO recipes(id, feature_instance_id, name, servings, document_id, status)
                       VALUES($1, $2, $3, $4, $5, $6)
                       ON CONFLICT (id) DO NOTHING""",
                    UUID(uid),
                    UUID(rec["feature_instance_id"]),
                    rec.get("name", "Recipe"),
                    int(rec.get("servings", "1")),
                    UUID(document_id) if document_id else None,
                    rec.get("status", "active"),
                )
        finally:
            await conn.close()
    _run(_insert())


@then("the recipes table contains:")
def then_recipes_table(datatable):
    _assert_db("recipes", datatable)


@given("the recipe_ingredients table contains:")
def given_recipe_ingredients_table(datatable):
    async def _insert():
        conn = await _conn()
        try:
            headers = datatable[0]
            for row in datatable[1:]:
                rec = {headers[i]: expand_id(row[i]) for i in range(len(headers))}
                uid = rec.get("id")
                if not uid:
                    continue
                groceries_item_id = rec.get("groceries_item_id")
                await conn.execute(
                    """INSERT INTO recipe_ingredients(
                           id, recipe_id, groceries_item_id, custom_name, custom_unit, quantity, position, status
                       )
                       VALUES($1, $2, $3, $4, $5, $6, $7, $8)
                       ON CONFLICT (id) DO NOTHING""",
                    UUID(uid),
                    UUID(rec["recipe_id"]),
                    UUID(groceries_item_id) if groceries_item_id else None,
                    rec.get("custom_name") or None,
                    rec.get("custom_unit") or None,
                    float(rec.get("quantity", "0")),
                    coerce("position", rec.get("position", "0")),
                    rec.get("status", "active"),
                )
        finally:
            await conn.close()
    _run(_insert())


@then("the recipe_ingredients table contains:")
def then_recipe_ingredients_table(datatable):
    _assert_db("recipe_ingredients", datatable)


@given("the meals table contains:")
def given_meals_table(datatable):
    async def _insert():
        conn = await _conn()
        try:
            headers = datatable[0]
            for row in datatable[1:]:
                rec = {headers[i]: expand_id(row[i]) for i in range(len(headers))}
                uid = rec.get("id")
                if not uid:
                    continue
                await conn.execute(
                    """INSERT INTO meals(id, feature_instance_id, title, start_at, end_at, headcount, status)
                       VALUES($1, $2, $3, $4, $5, $6, $7)
                       ON CONFLICT (id) DO NOTHING""",
                    UUID(uid),
                    UUID(rec["feature_instance_id"]),
                    rec.get("title", "Meal"),
                    _parse_dt(rec.get("start_at")),
                    _parse_dt(rec.get("end_at")),
                    int(rec.get("headcount", "0")),
                    rec.get("status", "active"),
                )
        finally:
            await conn.close()
    _run(_insert())


@then("the meals table contains:")
def then_meals_table(datatable):
    _assert_db("meals", datatable)


@given("the meal_participants table contains:")
def given_meal_participants_table(datatable):
    async def _insert():
        conn = await _conn()
        try:
            headers = datatable[0]
            for row in datatable[1:]:
                rec = {headers[i]: expand_id(row[i]) for i in range(len(headers))}
                uid = rec.get("id")
                if not uid:
                    continue
                await conn.execute(
                    """INSERT INTO meal_participants(id, meal_id, person_id, status)
                       VALUES($1, $2, $3, $4)
                       ON CONFLICT (id) DO NOTHING""",
                    UUID(uid),
                    UUID(rec["meal_id"]),
                    UUID(rec["person_id"]),
                    rec.get("status", "active"),
                )
        finally:
            await conn.close()
    _run(_insert())


@then("the meal_participants table contains:")
def then_meal_participants_table(datatable):
    _assert_db("meal_participants", datatable)


@given("the meal_recipes table contains:")
def given_meal_recipes_table(datatable):
    async def _insert():
        conn = await _conn()
        try:
            headers = datatable[0]
            for row in datatable[1:]:
                rec = {headers[i]: expand_id(row[i]) for i in range(len(headers))}
                await conn.execute(
                    """INSERT INTO meal_recipes(meal_id, recipe_id)
                       VALUES($1, $2)
                       ON CONFLICT (meal_id, recipe_id) DO NOTHING""",
                    UUID(rec["meal_id"]),
                    UUID(rec["recipe_id"]),
                )
        finally:
            await conn.close()
    _run(_insert())


@then("the meal_recipes table contains:")
def then_meal_recipes_table(datatable):
    _assert_db("meal_recipes", datatable)


@then("the reminders table contains:")
def then_reminders_table(datatable):
    async def _query_active_reminders(headers):
        conn = await _conn()
        try:
            cols = ", ".join(f'"{h}"' for h in headers)
            rows = await conn.fetch(
                f"SELECT {cols} FROM reminders WHERE status = 'active' ORDER BY created_at, id"
            )
            return [dict(r) for r in rows]
        finally:
            await conn.close()
    headers = datatable[0]
    expected_rows = datatable[1:]
    actual_rows = _run(_query_active_reminders(headers))
    assert len(actual_rows) == len(expected_rows), (
        f"reminders: expected {len(expected_rows)} rows, got {len(actual_rows)}"
    )
    for i, (exp, act) in enumerate(zip(expected_rows, actual_rows)):
        for j, col in enumerate(headers):
            act_val = act[col]
            if isinstance(act_val, bool):
                act_str = str(act_val).lower()
                exp_val = exp[j].lower()
            elif isinstance(act_val, int):
                act_str = str(act_val)
                exp_val = exp[j]
            else:
                act_str = "" if act_val is None else (act_val.isoformat() if isinstance(act_val, datetime) else str(act_val))
                exp_val = expand_id(exp[j])
            assert act_str == exp_val, f"reminders[{i}].{col}: expected {exp_val!r}, got {act_str!r}"
