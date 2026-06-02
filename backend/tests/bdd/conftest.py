import asyncio
import json
import re
from uuid import UUID

import asyncpg
import pytest
from pytest_bdd import given, parsers, then, when

from tests.db_helpers import TEST_DB_DSN, coerce, url_param_id_from_uuid
from tests.helpers import assert_table, expand_id, expand_json_ids, expand_path_ids


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
                await conn.execute(
                    """INSERT INTO users(id, url_param_id, login, email, status)
                       VALUES($1, $2, $3, $4, $5)
                       ON CONFLICT (id) DO NOTHING""",
                    UUID(uid),
                    url_param_id_from_uuid(uid),
                    email,
                    email,
                    rec.get("status", "active"),
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
                if fi_id:
                    await conn.execute(
                        """INSERT INTO labels(id, name, color, status, feature_instance_id)
                           VALUES($1, $2, $3, $4, $5)
                           ON CONFLICT (id) DO NOTHING""",
                        UUID(uid),
                        rec.get("name", ""),
                        rec.get("color", "#000000"),
                        rec.get("status", "active"),
                        UUID(fi_id),
                    )
                else:
                    await conn.execute(
                        """INSERT INTO labels(id, name, color, status)
                           VALUES($1, $2, $3, $4)
                           ON CONFLICT (id) DO NOTHING""",
                        UUID(uid),
                        rec.get("name", ""),
                        rec.get("color", "#000000"),
                        rec.get("status", "active"),
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
                await conn.execute(
                    """INSERT INTO notifications(id, url_param_id, target_user_id, message, notification_status)
                       VALUES($1, $2, $3, $4, $5)
                       ON CONFLICT (id) DO NOTHING""",
                    UUID(uid),
                    url_param,
                    UUID(target_user),
                    rec.get("message", "Test notification"),
                    rec.get("notification_status", "sent"),
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
                await conn.execute(
                    """INSERT INTO tribes_projects(tribe_id, project_id, relation)
                       VALUES($1, $2, $3) ON CONFLICT DO NOTHING""",
                    UUID(rec["tribe_id"]),
                    UUID(rec["project_id"]),
                    rec.get("relation", "member"),
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
                await conn.execute(
                    """INSERT INTO positions(id, tribe_id, person_id, position, status)
                       VALUES($1, $2, $3, $4, $5)
                       ON CONFLICT (tribe_id, person_id) DO NOTHING""",
                    UUID(uid) if uid else None,
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
                    """INSERT INTO projects_features(id, project_id, feature_type, name, status, position)
                       VALUES($1, $2, $3, $4, $5, $6)
                       ON CONFLICT (id) DO NOTHING""",
                    UUID(uid),
                    UUID(rec["project_id"]),
                    rec.get("feature_type", "kanban"),
                    rec.get("name", "Feature"),
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
                await conn.execute(
                    """INSERT INTO kanban_cards(id, feature_instance_id, column_id, title,
                       assigned_person_id, due_date, status, position)
                       VALUES($1, $2, $3, $4, $5, $6, $7, $8)
                       ON CONFLICT (id) DO NOTHING""",
                    UUID(uid),
                    UUID(rec["feature_instance_id"]),
                    UUID(rec["column_id"]),
                    rec.get("title", "Card"),
                    UUID(assigned) if assigned else None,
                    coerce("due_date", due) if due else None,
                    rec.get("status", "active"),
                    coerce("position", rec.get("position", "0")),
                )
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
                await conn.execute(
                    """INSERT INTO todo_items(id, feature_instance_id, title, todo_status,
                       assigned_person_id, due_date, status, position)
                       VALUES($1, $2, $3, $4, $5, $6, $7, $8)
                       ON CONFLICT (id) DO NOTHING""",
                    UUID(uid),
                    UUID(rec["feature_instance_id"]),
                    rec.get("title", "Todo"),
                    rec.get("todo_status", "todo"),
                    UUID(assigned) if assigned else None,
                    coerce("due_date", due) if due else None,
                    rec.get("status", "active"),
                    coerce("position", rec.get("position", "0")),
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


@when(parsers.re(r"I POST (?P<path>\S+)$"))
def post_no_body(context, path):
    context["response"] = context["client"].post(expand_path_ids(path))


@when(parsers.re(r"I GET (?P<path>\S+)"))
def get_resource(context, path):
    context["response"] = context["client"].get(expand_path_ids(path))


@when(parsers.re(r"I DELETE (?P<path>\S+)"))
def delete_resource(context, path):
    context["response"] = context["client"].delete(expand_path_ids(path))


# ── Then: response assertions ─────────────────────────────────────────────────

@then(parsers.parse("the response status code is {status_code:d}"))
def check_status_code(context, status_code):
    assert context["response"].status_code == status_code, (
        f"Expected {status_code}, got {context['response'].status_code}: {context['response'].text}"
    )


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


def _assert_db(table: str, datatable: list):
    headers = datatable[0]
    expected_rows = datatable[1:]
    actual_rows = _run(_query_table(table, headers))
    assert len(actual_rows) == len(expected_rows), (
        f"{table}: expected {len(expected_rows)} rows, got {len(actual_rows)}"
    )
    for i, (exp, act) in enumerate(zip(expected_rows, actual_rows)):
        for j, col in enumerate(headers):
            exp_val = expand_id(exp[j])
            act_val = act[col]
            act_str = str(act_val) if act_val is not None else ""
            assert act_str == exp_val, f"{table}[{i}].{col}: expected {exp_val!r}, got {act_str!r}"


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
