Create a BDD test for a backend use case using pytest-bdd and Gherkin.

## Context

- Feature files: `backend/tests/features/<package-path>/<use-case>.feature`
- Step definitions: `backend/tests/bdd/<package-path>/test_<use-case>.py`
- `<package-path>` mirrors the app package, dropping `functions/` and `features/` segments
  - `app/platform/functions/people/persons/router.py` → `platform/people/persons`
  - `app/features/bookmarks/router.py` → `features/bookmarks`
- Shared step definitions: `backend/tests/bdd/conftest.py`
- Auth fixtures + DB setup: `backend/tests/conftest.py`
- DB infrastructure: `backend/tests/db_helpers.py`
- ID/assertion helpers: `backend/tests/helpers.py`
- Run all: `./scripts/run-backend-tests.sh`
- Run by tag: `./scripts/run-backend-tests.sh @wip`

## Architecture: real-DB integration tests

**All tests run against a real PostgreSQL database** (`modern_tribes_test`).
No mocks except `get_current_user` (auth identity only).

Each test file creates a **mini FastAPI app** containing only the router under test, with
`lifespan=db_lifespan`. This wires `db.pool` to the test pool inside TestClient's event loop.
Tables are **truncated before every test** via the `clean_test_db` autouse fixture in
`tests/conftest.py`. Schema is applied once per session via `pytest_configure`.

Given steps insert data via `asyncio.run()` + a direct `asyncpg.connect()` (no pool).

## pytest-bdd API facts (8.x)

- `datatable` receives `step.datatable.raw()` — `list[list[str]]`. First row = headers.
  A header-only table represents zero records (empty state).
- `docstring` receives the raw triple-quoted block as a plain string.
- Neither needs an import; injected by name automatically.
- Tags on `Feature:` apply to every scenario. Tags on `Scenario:` apply to that one only.
- Every marker used in a `.feature` file must be registered in `backend/pyproject.toml`.

## Short IDs

Use 1–4 digit numeric short IDs in feature files: `0001`, `1001`, `6001`.
`expand_id("0001")` → `"00000000-0000-0000-0000-000000000001"`.
`expand_json_ids()` and `expand_path_ids()` expand short IDs recursively in JSON and URL paths.

## Fixed auth identities

The three auth constants in `tests/conftest.py` have fixed IDs. You must use these exact IDs
in `Background:` and `Given` steps, and always seed them in the `users` table:

| Step suffix | Constant | id | email |
|---|---|---|---|
| `user.id 0001` | `_ADMIN_USER` | `0001` | `admin@test.com` |
| `user.id 0002` | `_REGULAR_USER` | `0002` | `user@test.com` |
| `user.id 0003` | `_PROFILE_USER` | `0003` | `profile_user@test.com` |

The `user.id N` in auth step names is **descriptive only** — the fixture always returns the
pre-defined constant. No dynamic lookup is performed.

## Steps

### 1 — Understand the target

Read or infer:
- Which router file is being tested
- Which DB tables the endpoint reads/writes (check repository and router files)
- Which permission is required (for the `@error_case` scenario)
- Which use cases to cover: happy path, validation error, permission error

### 2 — Read the router and repository

For the target endpoint:
- HTTP method and exact URL path (as registered in `app/main.py`)
- Required / optional Pydantic fields (read the `Create` schema)
- All tables read (list in `Given` steps) and written (assert in `Then` steps)

### 3 — Create directories and `__init__.py`

```
backend/tests/features/<package-path>/
backend/tests/bdd/<package-path>/     ← add __init__.py at every level if missing
```

### 4 — Write the Gherkin feature file

**Tag rules:**
- `@wip` on the `Feature:` line — applies to all scenarios by default
- `@error_case` on individual `Scenario:` lines for permission/validation errors

**`Background:`** for shared auth data: users, roles, role_permissions, user_roles.
Always seed the auth users that will be used in scenarios (0001, 0002, 0003 as needed).

**Domain `Given` tables** go inside each `Scenario:`, covering every table the endpoint
reads. List them in FK-dependency order (parents before children — see section 9).

**Table state rule (applies to every table the endpoint writes):**
- **Before `When` (Given):** always show the initial state of the table — the rows that
  exist before the action. An empty table = header-only. This documents the starting point.
- **After `When` (Then):** always show the expected state of the table after the action.
  For insert scenarios: all rows that should now exist. For no-op scenarios (error cases):
  same rows as in Given (table unchanged).

**`Given the managed_<table> table contains:`** for mutation tests:
- Before `When`: header-only table = take a baseline snapshot of current IDs
- After `When` (Then): list only the new rows expected after the action

**`Then the response body is:`** uses a Gherkin docstring with JSON. Short IDs are expanded.

```gherkin
@wip
Feature: <Domain action>
  As a <role>
  I want to <action>
  So that <benefit>

  Background:
    Given the users table contains:
      | id   | email          | status |
      | 0001 | admin@test.com | active |
      | 0002 | user@test.com  | active |
    And the roles table contains:
      | name          | status |
      | administrator | active |
      | viewer        | active |
    And the role_permissions table contains:
      | role          | permission                 |
      | administrator | admin                      |
      | viewer        | can_access_attached_tribes |
    And the user_roles table contains:
      | user           | role          |
      | admin@test.com | administrator |
      | user@test.com  | viewer        |

  Scenario: POST /<path> with a valid body — the new record appears in the database
    Given I am authenticated as an administrator: user.id 0001
    And the projects table contains:
      | id   | name    | status |
      | 2001 | My Proj | active |
    And the managed_<target-table> table contains:
      | field_a | field_b | status |
    When I POST /api/<path>/ with body:
      """
      { "field_a": "value_a", "field_b": "value_b" }
      """
    Then the response status code is 201
    And the managed_<target-table> table contains:
      | field_a  | field_b  | status |
      | value_a  | value_b  | active |

  Scenario: POST /<path> with a missing required field — 422 and the database is not modified
    Given I am authenticated as an administrator: user.id 0001
    And the managed_<target-table> table contains:
      | field_a | field_b | status |
    When I POST /api/<path>/ with body:
      """
      { "field_a": "value_a" }
      """
    Then the response status code is 422
    And the managed_<target-table> table contains:
      | field_a | field_b | status |

  @error_case
  Scenario: POST /<path> as a non-admin user — 403 and the database is not modified
    Given I am authenticated as a regular user: user.id 0002
    And the managed_<target-table> table contains:
      | field_a | field_b | status |
    When I POST /api/<path>/ with body:
      """
      { "field_a": "value_a", "field_b": "value_b" }
      """
    Then the response status code is 403
    And the managed_<target-table> table contains:
      | field_a | field_b | status |
```

For GET endpoints, use `Then the response body is:` with a docstring JSON instead of
managed table assertions.

### 5 — Write the step definitions file

Each test file contains only:
1. A module-level mini FastAPI app with `lifespan=db_lifespan` and the target router
2. Auth fixture(s): at least the roles needed by the scenarios in this file
3. `@scenario(FEATURE, "...")` declarations

**No other mocks.** DB wiring is handled by `db_lifespan`. All step logic lives in
`tests/bdd/conftest.py`.

```python
import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from pytest_bdd import scenario

from app.platform.core.authentication.router import get_current_user
from app.<package>.router import router
from tests.conftest import _ADMIN_USER, _REGULAR_USER, _PROFILE_USER
from tests.db_helpers import db_lifespan

_test_app = FastAPI(lifespan=db_lifespan)
_test_app.include_router(router, prefix="/api/<mount-prefix>")

FEATURE = "../../../../features/<package-path>/<use-case>.feature"


@pytest.fixture
def admin_client():
    _test_app.dependency_overrides[get_current_user] = lambda: _ADMIN_USER
    with TestClient(_test_app) as client:
        yield client
    _test_app.dependency_overrides.clear()


@pytest.fixture
def non_admin_client():
    _test_app.dependency_overrides[get_current_user] = lambda: _REGULAR_USER
    with TestClient(_test_app) as client:
        yield client
    _test_app.dependency_overrides.clear()


@pytest.fixture
def profile_owner_client():
    _test_app.dependency_overrides[get_current_user] = lambda: _PROFILE_USER
    with TestClient(_test_app) as client:
        yield client
    _test_app.dependency_overrides.clear()


@scenario(FEATURE, "POST /<path> with a valid body — the new record appears in the database")
def test_create_success():
    pass


@scenario(FEATURE, "POST /<path> with a missing required field — 422 and the database is not modified")
def test_create_missing_field():
    pass


@scenario(FEATURE, "POST /<path> as a non-admin user — 403 and the database is not modified")
def test_create_forbidden():
    pass
```

Only include the fixtures required by the scenarios in that file. `profile_owner_client` is
only needed if a scenario uses `"I am authenticated as the person's owner: user.id 0003"`.

### 6 — Shared steps already in `tests/bdd/conftest.py`

No re-declaration needed for these:

**Auth (Given):**

| Step | Fixture used |
|---|---|
| `I am authenticated as an administrator: user.id {N}` | `admin_client` |
| `I am authenticated as a regular user: user.id {N}` | `non_admin_client` |
| `I am authenticated as the person's owner: user.id {N}` | `profile_owner_client` |

**DB seed (Given):**

| Step | Notes |
|---|---|
| `the users table contains:` | auto-fills `url_param_id` and `login` from email |
| `the roles table contains:` | |
| `the role_permissions table contains:` | columns: `role` (name), `permission` (name) — upserts permission if absent |
| `the user_roles table contains:` | columns: `user` (email), `role` (name) |
| `the persons table contains:` | |
| `the represents table contains:` | |
| `the documents table contains:` | |
| `the labels table contains:` | |
| `the projects table contains:` | auto-fills `url_param_id` |
| `the tribes table contains:` | auto-fills `url_param_id` |
| `the tribes_projects table contains:` | columns: `tribe_id`, `project_id`, `relation` |
| `the positions table contains:` | columns: `tribe_id`, `person_id`, `position`, `status` |
| `the projects_features table contains:` | columns: `id`, `project_id`, `feature_type`, `name`, `status`, `position` |
| `the kanban_columns table contains:` | |
| `the kanban_cards table contains:` | |
| `the todo_items table contains:` | |
| `the user_bookmarks table contains:` | alias: `the user_bookmark table contains:` |
| `the notifications table contains:` | |
| `the projects_documents table contains:` | |
| `the publications table contains:` | |
| `the app_config table contains:` | |
| `the managed_roles table contains:` | snapshots baseline + seeds initial rows |
| `the managed_users table contains:` | snapshots baseline + seeds initial rows |
| `the created_users table contains:` | alias for `managed_users` mechanism |
| `the label_entities table contains:` | columns: `label_id`, `entity_type`, `entity_id` |
| `the user_tab_configs table contains:` | columns: `id`, `user_id`, `context_key`, `tab_configs` |

**HTTP (When):**

| Step | Notes |
|---|---|
| `I POST <path> with body:` | docstring = JSON body; short IDs expanded in path and body |
| `I PUT <path> with body:` | |
| `I PATCH <path> with body:` | |
| `I POST <path>` | no body |
| `I GET <path>` | |
| `I DELETE <path>` | |

**Assertions (Then):**

| Step | Notes |
|---|---|
| `the response status code is {N}` | |
| `the response body is:` | docstring = JSON; short IDs expanded |
| `the persons table contains:` | full table assertion |
| `the represents table contains:` | |
| `the documents table contains:` | |
| `the labels table contains:` | |
| `the app_config table contains:` | |
| `the projects table contains:` | |
| `the tribes table contains:` | |
| `the positions table contains:` | |
| `the managed_roles table contains:` | delta from baseline taken in Given |
| `the managed_users table contains:` | delta from baseline taken in Given |
| `the created_users table contains:` | delta from baseline taken in Given |
| `the users table contains:` | full table assertion |
| `the notifications table contains:` | full table assertion |
| `the publications table contains:` | full table assertion |
| `the kanban_columns table contains:` | full table assertion |
| `the kanban_cards table contains:` | full table assertion |
| `the todo_items table contains:` | full table assertion |
| `the user_bookmarks table contains:` | full table assertion |
| `the projects_features table contains:` | full table assertion |
| `the label_entities table contains:` | full table assertion; columns: `label_id`, `entity_type`, `entity_id` |
| `the user_tab_configs table contains:` | full table assertion; columns: `user_id`, `context_key`, `tab_configs` |

### 7 — DB helpers reference

**`tests/db_helpers.py`:**
- `TEST_DB_DSN` — `postgresql://admin:password123@localhost:5432/modern_tribes_test`
- `db_lifespan` — FastAPI lifespan; creates asyncpg pool, sets `db.pool`, cleans up
- `setup_test_database()` — creates DB + runs `alembic upgrade head` (called once via `pytest_configure`)
- `truncate_all_tables()` — truncates all public tables except `alembic_version` (called before each test)
- `coerce(col, val)` — converts strings to UUID / date / int based on column name and value pattern
- `url_param_id_from_uuid(uuid_str)` — last 6 hex chars of the UUID (deterministic short ID)

**`tests/helpers.py`:**
- `expand_id(value)` — `"0001"` → full UUID string
- `expand_path_ids(path)` — expands short IDs in URL path segments
- `expand_json_ids(data)` — recursively expands short IDs in parsed JSON
- `assert_table(actual, datatable, label)` — asserts list of dicts matches a Gherkin datatable
- `assert_table_contains(actual, datatable, label)` — subset check (any-order)

### 8 — Auto-filled columns

| Table | Column | Auto value |
|---|---|---|
| `users` | `url_param_id` | `url_param_id_from_uuid(id)` |
| `users` | `login` | same as `email` |
| `projects` | `url_param_id` | `url_param_id_from_uuid(id)` |
| `tribes` | `url_param_id` | `url_param_id_from_uuid(id)` |
| `permissions` | auto-upserted by name | no explicit `id` needed |

### 9 — FK insert order

Always declare `Given` tables in dependency order (parent before child):

1. `roles`, `permissions`
2. `persons`
3. `users` (→ persons)
4. `role_permissions` (→ roles, permissions)
5. `user_roles` (→ users, roles)
6. `tribes`, `projects`
7. `represents` (→ users, persons)
8. `positions` (→ tribes, persons)
9. `tribes_projects` (→ tribes, projects)
10. `projects_features` (→ projects)
11. `kanban_columns` (→ projects_features)
12. `kanban_cards` (→ kanban_columns, projects_features)
13. `todo_items` (→ projects_features)
14. `documents`
15. `labels` (→ projects_features)
16. `projects_documents` (→ projects, documents)
17. `publications` (→ documents, projects_documents)

### 10 — Register markers in `pyproject.toml`

```toml
[tool.pytest.ini_options]
markers = [
    "wip: work in progress — scenarios actively being developed",
    "error_case: scenarios that verify error and rejection behaviour",
]
```

Add any new tag used in a `.feature` file here.

### 11 — Verify

```bash
python3 -m py_compile backend/tests/bdd/<package-path>/test_<use-case>.py
./scripts/check-backend.sh
```

### 12 — Hand off to the user

Tell the user to run:
```bash
./scripts/run-backend-tests.sh @wip
```
and ask for feedback on the output before marking the task done.
