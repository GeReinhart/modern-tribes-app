Create a BDD test for a backend use case using pytest-bdd and Gherkin.

## Context

- Feature files: `backend/tests/features/<package-path>/<use-case>.feature`
- Step definitions: `backend/tests/bdd/<package-path>/test_<use-case>.py`
- `<package-path>` mirrors the app package, dropping `functions/` and `features/` segments
  - e.g. `app/platform/functions/people/persons/router.py` → `platform/people/persons`
- Shared fixtures: `backend/tests/conftest.py`
- Run all: `./scripts/run-backend-tests.sh`
- Run by tag: `./scripts/run-backend-tests.sh @wip`

## pytest-bdd API facts (8.x)

- `datatable` parameter in a step function receives `step.datatable.raw()` — a `list[list[str]]`.
  First row = headers, subsequent rows = data. An empty table (header row only) represents zero records.
- `docstring` parameter receives the raw triple-quoted text as a plain string.
- Neither needs any import; they are injected by name automatically when present in the function signature.
- Tags on a `Feature:` apply to every scenario in the file. Tags on a `Scenario:` apply only to that one.
  Scenario-level tags are placed on the line immediately before `Scenario:`.
- Every marker used in a `.feature` file must be registered in `backend/pyproject.toml` under
  `[tool.pytest.ini_options] markers = [...]` to avoid "unknown mark" warnings.

## Steps

### 1 — Understand the target

Ask (or infer from context):
- Which router file is being tested
- Which use cases to cover (always include at least: happy path, validation error, and auth/permission error)

### 2 — Read the router

For the target endpoint:
- HTTP method and exact URL path (as registered in `app/main.py`)
- Required / optional Pydantic fields (read the `Create` schema)
- Which helpers are called: `get_database`, `create_document`, `get_user_permissions`, permission decorators

### 3 — Create directories and `__init__.py`

```
backend/tests/features/<package-path>/
backend/tests/bdd/<package-path>/          ← add __init__.py at every level
```

### 4 — Write the Gherkin feature file

**Tag rules:**
- `@wip` on the `Feature:` line — applies to all scenarios by default
- Additional tags (e.g. `@error_case`) on individual `Scenario:` lines for cross-cutting concerns

**No `Background:` for authentication.** Put the auth `Given` step in each scenario explicitly so
the role is visible at a glance.

**Before/after DB state** uses a DataTable on the same step name `the <table> table contains:`.
An empty state is represented by a header-only table (no data rows).

**JSON body** uses a Gherkin docstring (triple-quoted block) under the `When` step.

```gherkin
@wip
Feature: <Domain action>
  As a <role>
  I want to <action>
  So that <benefit>

  Scenario: <METHOD> /<path> with a valid body — the new record appears in the database
    Given I am authenticated as an administrator
    And the <table> table contains:
      | field_a | field_b | status |
    When I <METHOD> /api/<path>/ with body:
      """
      {
        "field_a": "value_a",
        "field_b": "value_b"
      }
      """
    Then the response status code is <2xx>
    And the <table> table contains:
      | field_a  | field_b  | status |
      | value_a  | value_b  | active |

  Scenario: <METHOD> /<path> with a missing required field — <4xx> and the database is not modified
    Given I am authenticated as an administrator
    And the <table> table contains:
      | field_a | field_b | status |
    When I <METHOD> /api/<path>/ with body:
      """
      {
        "field_a": "value_a"
      }
      """
    Then the response status code is 422
    And the <table> table contains:
      | field_a | field_b | status |

  @error_case
  Scenario: <METHOD> /<path> as a non-admin user — 403 and the database is not modified
    Given I am authenticated as a regular user
    And the <table> table contains:
      | field_a | field_b | status |
    When I <METHOD> /api/<path>/ with body:
      """
      {
        "field_a": "value_a",
        "field_b": "value_b"
      }
      """
    Then the response status code is 403
    And the <table> table contains:
      | field_a | field_b | status |
```

### 5 — Update `backend/tests/conftest.py`

**`Fake<Entity>Store`** — one per domain entity being tested:

```python
class Fake<Entity>Store:
    def __init__(self):
        self._records: list[dict] = []

    def count(self) -> int:
        return len(self._records)

    def insert(self, record: dict) -> dict:
        self._records.append(record)
        return record

    def all(self) -> list[dict]:
        return list(self._records)

    def last(self) -> dict | None:
        return self._records[-1] if self._records else None
```

**`_make_fake_create_document`** — shared factory used by all client fixtures:

```python
def _make_fake_create_document(store: Fake<Entity>Store):
    async def fake_create_document(pool, table, data):
        from datetime import datetime
        from uuid import UUID, uuid4
        now = datetime(2024, 1, 1, 0, 0, 0)
        record = {k: str(v) if isinstance(v, UUID) else v for k, v in data.items()}
        record["id"] = str(uuid4())
        record["created_at"] = now
        record["updated_at"] = now
        if table == "<target_table>":
            store.insert(record)
        return record
    return fake_create_document
```

**Client fixtures** — one per role. Patch at the **import site** (where the function name is bound),
not at the definition site:

```python
@pytest.fixture
def admin_client(<entity>_store):
    _test_app.dependency_overrides[get_current_user] = lambda: _ADMIN_USER
    with (
        patch("app.platform.core.authorization.router.get_database", return_value=MagicMock()),
        patch("app.platform.core.authorization.router.get_user_permissions",
              new=AsyncMock(return_value=["admin"])),
        patch("app.<router-module>.get_database", return_value=MagicMock()),
        patch("app.<router-module>.create_document",
              new=AsyncMock(side_effect=_make_fake_create_document(<entity>_store))),
    ):
        with TestClient(_test_app) as client:
            yield client
    _test_app.dependency_overrides.clear()

@pytest.fixture
def non_admin_client(<entity>_store):
    _test_app.dependency_overrides[get_current_user] = lambda: _REGULAR_USER
    with (
        patch("app.platform.core.authorization.router.get_database", return_value=MagicMock()),
        patch("app.platform.core.authorization.router.get_user_permissions",
              new=AsyncMock(return_value=["can_access_own_tribes"])),  # no admin
        patch("app.<router-module>.get_database", return_value=MagicMock()),
        patch("app.<router-module>.create_document",
              new=AsyncMock(side_effect=_make_fake_create_document(<entity>_store))),
    ):
        with TestClient(_test_app) as client:
            yield client
    _test_app.dependency_overrides.clear()
```

The four patch targets for every client fixture:
1. `app.platform.core.authorization.router.get_database` — used by the permission decorator
2. `app.platform.core.authorization.router.get_user_permissions` — used by the permission decorator
3. `app.<router-module>.get_database` — used by the route handler
4. `app.<router-module>.create_document` — (or whatever db helper is called) — records DB state

### 6 — Write the step definitions

**Key design:** auth `Given` steps store the client in `context["client"]`.
The `When` step reads from `context["client"]` — it never depends on `admin_client` or
`non_admin_client` directly. This makes all `When` and `Then` steps role-agnostic.

```python
@given("I am authenticated as an administrator")
def authenticated_admin(admin_client, context):
    context["client"] = admin_client

@given("I am authenticated as a regular user")
def authenticated_regular_user(non_admin_client, context):
    context["client"] = non_admin_client

def _assert_table(store, datatable):
    headers = datatable[0]
    expected_rows = datatable[1:]           # empty list = expected empty table
    actual = store.all()
    assert len(actual) == len(expected_rows), (
        f"Expected {len(expected_rows)} record(s), got {len(actual)}"
    )
    for expected, record in zip(expected_rows, actual):
        for i, field in enumerate(headers):
            assert str(record[field]) == expected[i], (
                f"{field}: expected {expected[i]!r}, got {record[field]!r}"
            )

@given("the <table> table contains:")
def given_table_state(<entity>_store, datatable):
    _assert_table(<entity>_store, datatable)

@when(parsers.re(r"I POST (?P<path>\S+) with body:"))
def post_with_body(context, path, docstring):
    context["response"] = context["client"].post(path, json=json.loads(docstring))

@then(parsers.parse("the response status code is {status_code:d}"))
def check_status_code(context, status_code):
    assert context["response"].status_code == status_code

@then("the <table> table contains:")
def then_table_state(<entity>_store, datatable):
    _assert_table(<entity>_store, datatable)
```

### 7 — Register markers in `pyproject.toml`

```toml
[tool.pytest.ini_options]
markers = [
    "wip: work in progress — scenarios actively being developed",
    "error_case: scenarios that verify error and rejection behaviour",
]
```

Add any new tag used in a `.feature` file here.

### 8 — Verify

```bash
python3 -m py_compile backend/tests/conftest.py
python3 -m py_compile backend/tests/bdd/<package-path>/test_<use-case>.py
```

### 9 — Hand off to the user

Tell the user to run:
```bash
./scripts/run-backend-tests.sh @wip
```
and ask for feedback on the output before marking the task done.
