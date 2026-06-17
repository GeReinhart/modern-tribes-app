Strip all feature code from the project, leaving only the platform. The about page becomes the home page.

## What this skill does

Removes everything under `features/` on both backend and frontend, cleans up all wiring
(routing, i18n, main.py, tests), and redirects `/` → `/app/about`.

The list of features to remove is always derived from the current `application.json`
(`features.features[*]`). Do not hardcode package names — read the file first.

## Step 0 — Read current state

Before touching anything:
1. Determine the branch name:
   ```bash
   git tag --list '0.*.0' --sort=-version:refname | head -1
   ```
   Take the last tag (e.g. `0.3.0`), increment the minor version by 1, and create the branch:
   ```bash
   git checkout -b keep-only-platform-0.<x+1>.0
   ```
   Example: last tag is `0.3.0` → branch is `keep-only-platform-0.4.0`.
   If no tag exists yet, start at `keep-only-platform-0.1.0`.
2. Run `./scripts/check-area.sh` to confirm the branch is valid before proceeding.
3. Read:
   - `application.json` → collect every feature package name and its backend/frontend paths
   - `frontend/src/app/features/` → list actual directories present
   - `backend/app/features/` → list actual directories present

Cross-check: every directory present but not listed in `application.json` (or vice versa)
is worth noting before deletion. (Common: a `dashboard` feature listed in `application.json`
but never materialised on disk — safe to skip deletion, will vanish when the key is removed.)

## Step 1 — Delete feature code

For each feature listed under `application.json → features.features[*]`, delete:
- Every frontend path listed under `features[*].frontend.path` (strip the `/**` glob suffix to get the directory)
- Every backend path listed under `features[*].backend.path` (same)

Also delete any `frontend/src/app/features/` or `backend/app/features/` subdirectory
that exists on disk even if it is no longer in `application.json`.

```bash
# Pattern (repeat for each feature):
rm -rf <frontend_path_dir>
rm -rf <backend_path_dir>
```

## Step 2 — Delete feature tests

```bash
rm -rf backend/tests/bdd/features/        # Python test files for all features
rm -rf backend/tests/features/features/   # Gherkin .feature files for all features
```

## Step 3 — Empty the feature self-registration triggers

`backend/app/features/__init__.py` → empty file (removes all `import` lines that trigger self-registration)

`backend/app/features/registry.py` → **delete this file** (it's the feature registry singleton;
it's not in a feature sub-directory but lives directly under `backend/app/features/`).

`frontend/src/main.tsx` → remove any `import '@/app/features/...'` lines (feature self-registration side-effects)

## Step 4 — `backend/app/main.py`

Remove all imports from `app.features.*` and every router registration block
labelled `# Features — ...`, including any `get_all_routers()` loop.
Keep all `# Platform — ...` blocks untouched.

## Step 5 — `frontend/src/app/platform/core/i18n/index.ts`

Remove every import that comes from `@/app/features/*/locales/` and every
corresponding spread inside the `resources` object.
Keep only the platform locale imports (`en`, `fr`).

## Step 6 — `frontend/src/app/AuthBootstrapApp.tsx`

- Remove every import that resolves from `@/app/features/`
- Remove the `BookmarksProvider` wrapper (or whichever context provider comes from features) and its import
- Remove every `<Route>` whose component or path belongs to a feature
  (dashboard, tribes, projects, feature admin pages, etc.)
- Change every redirect to `/app/dashboard` (or whatever the old home was) to `/app/about`
- In `AdminLandingRedirect`: remove the `canAssignProjects` branch (project assignment
  was a feature concern); keep only `isAdmin → /admin/monitoring` and
  `canManagePeople → /admin/people`; fallback → `/app/about`

## Step 7 — `frontend/src/app/platform/core/layout/AdminNavigation.tsx`

- Identify nav items whose `path` points to a feature admin route (e.g. `/admin/tribes`, `/admin/features`)
- Remove those items from `ALL_ITEMS`
- Remove the corresponding string literals from the `AdminPage` type union
- Remove any `NavItem` field and filter logic that was only needed for those items
  (e.g. `projectsAssignerVisible`, `canAssignProjects`)

## Step 7b — `frontend/src/app/platform/core/authorization/useAdminAccess.ts`

`canAssignProjects` (`can_assign_projects` permission) was feature-only (project assignment belonged to tribes-projects). Remove it:
- Remove `canAssignProjects: boolean` from the `AdminAccess` interface
- Remove the `const canAssignProjects = ...` line
- Remove it from the `hasAdminAccess` expression
- Remove it from the returned object

## Step 8 — `frontend/src/app/platform/core/about/AboutPage.tsx`

- Remove the `AboutFeatures` import and the entire features section it renders
- **Delete `frontend/src/app/platform/core/about/AboutFeatures.tsx`** — it becomes unreachable
  and references `application.json` at the `features.features` path which is now gone.
- Simplify breadcrumbs to a single entry `[{ label: t('about.title') }]`
  (this is now the home page — no back navigation needed)
- Remove `menuActions` / `navigate` if the only action was "return"

## Step 8b — Scan platform service files for dead feature API calls

After removing feature routes and components, grep for any remaining references to feature
API endpoint paths inside platform service files. These are string literals, not imports —
they won't be caught by the import checker in `check-application.json.sh`.

```bash
grep -rn "'/features/" frontend/src/app/platform/
grep -rn '"/features/' frontend/src/app/platform/
grep -rn "'/api/features/" frontend/src/app/platform/
```

For each match found:
- If the method is still called by any surviving component → it must be refactored to use a platform endpoint
- If the method is dead (no callers after feature routes were removed) → delete the method entirely

This was the source of a subtle bug (404s at runtime) where `publication.service.ts` still
had `publish()` and `unpublish()` methods calling feature endpoints that no longer existed,
even though no component called them — they were invisible to static checks.

## Step 9 — `application.json`

- Remove the entire `"features"` top-level key
- Update the top-level `"description"` to drop any mention of features
- Scan **every platform package `description` field** for stale feature references and fix them.
  After the last run, the following were found:

  | Package | Field | Before | After |
  |---|---|---|---|
  | `search` | en[0] | "…todo items and kanban cards" | "…documents and publications" |
  | `people` | en[2] | "persons associated with tribes" | "physical person records" |
  | `authorization` | en[2] | "project-level access checks" | "access checks" |
  | `app-config` | en[1] | "branding and feature flags" | "branding" |
  | `labels` | en[1] | "(documents, tasks, etc.)" | "(documents, etc.)" |

  (Apply the same fix in `fr` for each.)

- Run `./scripts/check-application.json.sh` at the end — it copies `application.json` to
  `frontend/src/app/application.json` on success, so no manual copy is needed.

## Step 10 — `scripts/check-application.json.sh`

Guard the features emit call so the script doesn't crash when the key is absent:

```python
if "features" in app:
    emit(app["features"].get("features", []), "features")
```

## Step 11 — `backend/scripts/data-dev/` and `backend/scripts/init_db.py`

**Delete feature seed CSV files.** For each removed feature, look up its `schema` entries in
`application.json` to know which tables were involved, then delete the matching CSVs.
Also delete any CSVs whose data depends on a removed table (e.g. `project_documents.csv`
depends on `projects`; `publications.csv` depends on `project_documents`).

In `init_db.py`:
- Remove every `create_<entity>` method that loaded a deleted CSV
- Remove calls to those methods from `run()`
- Remove the corresponding entries from `clear_tables()` **only if they are platform tables** — `init_db.py` must never reference feature tables, not even to clear them
- Remove the corresponding lines from the summary `print` block
- Remove any now-unused imports (`re`, `_strip_html`, etc.)

**Keep** `create_app_config()` and any method that only touches platform tables.

**One-time stale-data cleanup** — after stripping features, the feature tables still exist
in the DB (migrations are not removed) and may contain old data. Clear them with a direct
SQL statement against the dev/test database before re-running `init_db.py`:

```sql
-- Run once to wipe stale feature data; adjust table list to match removed features
TRUNCATE TABLE
  kanban_cards, kanban_columns,
  todo_items,
  projects_features,
  user_bookmarks, user_tab_configs,
  tribes_projects, positions,
  projects, tribes
CASCADE;
```

Then run `init_db.py` normally to reseed the platform tables.

## Step 12 — `backend/scripts/init_schema.sql`

Remove every table that belongs to a feature. The list of feature tables comes from the
`schema` entries under each feature in `application.json` (before it was stripped).

For each feature table:
- Remove its `CREATE TABLE IF NOT EXISTS` block
- Remove all related `CREATE INDEX` / `CREATE UNIQUE INDEX` lines
- Remove its `CREATE OR REPLACE TRIGGER update_<table>_updated_at` line
- Remove the final `ALTER TABLE` lines at the bottom of the file that reference feature tables

**Cross-table dependencies** — platform tables may hold FKs to feature tables. Before removing
the referenced feature table, update the platform table:
- If the FK column is needed by other platform tables (e.g. `project_document_id` in
  `publications` and `document_pages` both reference `projects_documents(id)`, and
  `projects_documents` is itself a feature table being removed), **drop only the FK constraint**
  and make the column a plain nullable UUID. Add a comment: "feature FK removed; features re-attach via migration".
- If the FK column is purely decorative (e.g. `feature_instance_id` on `labels`), drop the column
  entirely and remove any index or unique constraint that depended on it.

**Concrete case from this run:**
- `projects_documents` was the `tribes-projects` feature table — removed entirely
- `publications.project_document_id` and `document_pages.project_document_id` both had FKs to it → made nullable
- `labels.feature_instance_id` referenced `projects_features(id)` → column dropped, unique indexes `labels_name_feature_unique` and `idx_labels_feature_instance` dropped; `labels_name_global_unique` simplified from `WHERE feature_instance_id IS NULL` to unconditional

After editing, verify the file creates cleanly with no FK violations by scanning for `REFERENCES`
pointing to removed tables.

## Step 13 — `backend/tests/bdd/conftest.py`

Identify step definitions (both `@given` and `@then`) that reference tables belonging
exclusively to deleted features. The tables to look for are the `schema` entries listed
under each removed feature in `application.json` (e.g. `user_bookmarks`, `kanban_columns`,
`todo_items`, `projects_features`, `user_tab_configs`, `tribes`, `positions`, `tribes_projects`).

Remove:
- Every `given_<table>_table` / `then_<table>_table` step for those tables
- Any alias steps that call the removed steps
- Any helper functions that are now dead (e.g. `_parse_created_at` if nothing uses it)
- Unused imports that only supported the removed helpers

Simplify any step that conditionally handles a feature-only field
(e.g. `given_labels_table` with a `feature_instance_id` branch) to the simpler platform-only path.

**Keep** any step whose table is still referenced by a remaining platform test.
Check by grepping `backend/tests/features/platform/` for the table name before deleting.

**Also check platform `.feature` files for Given steps that set up feature tables** — e.g.
`archive_publication.feature` used `Given the projects table contains:` as an FK precondition
for `projects_documents`. Since `projects_documents.project_id` becomes a plain nullable UUID
after Step 12, the projects setup step is no longer needed. Remove it from the feature file.

**Also update `given_projects_documents_table`** in `conftest.py` — since `project_id` is now
nullable (the FK was dropped), change `UUID(rec["project_id"])` to
`UUID(project_id) if project_id else None`. Any test that omits `project_id` from the column
list will work correctly.

**Also update `given_publications_table`** for the same reason: `project_document_id` is now
nullable, so handle it with `UUID(project_document_id) if project_document_id else None`.

## Step 14 — Alembic migration to drop feature tables

`reset-db.sh` runs `alembic upgrade head`, not `init_schema.sql`. This means the feature
tables are still created by migration `001` after every DB reset unless you add a migration
that explicitly drops them.

Create `backend/alembic/versions/002_remove_features.py` (increment to the next available
number if 002 already exists):

```python
"""Remove feature tables and decouple platform FKs

Revision ID: 002
Revises: 001
Create Date: <today>
"""
from alembic import op

revision = '002'
down_revision = '001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Make project_document_id nullable in platform tables before dropping projects_documents
    op.execute("ALTER TABLE publications ALTER COLUMN project_document_id DROP NOT NULL")
    op.execute("ALTER TABLE document_pages ALTER COLUMN project_document_id DROP NOT NULL")

    # Drop feature_instance_id column from labels (purely decorative FK to projects_features)
    op.execute("ALTER TABLE labels DROP COLUMN IF EXISTS feature_instance_id")

    # Drop feature tables — CASCADE removes FK constraints in referencing tables
    op.execute("DROP TABLE IF EXISTS kanban_cards CASCADE")
    op.execute("DROP TABLE IF EXISTS kanban_columns CASCADE")
    op.execute("DROP TABLE IF EXISTS todo_items CASCADE")
    op.execute("DROP TABLE IF EXISTS user_tab_configs CASCADE")
    op.execute("DROP TABLE IF EXISTS user_bookmarks CASCADE")
    op.execute("DROP TABLE IF EXISTS projects_documents CASCADE")
    op.execute("DROP TABLE IF EXISTS tribes_projects CASCADE")
    op.execute("DROP TABLE IF EXISTS positions CASCADE")
    op.execute("DROP TABLE IF EXISTS projects_features CASCADE")
    op.execute("DROP TABLE IF EXISTS projects CASCADE")
    op.execute("DROP TABLE IF EXISTS tribes CASCADE")

    # Recreate labels unique index without the feature_instance_id partial condition
    op.execute("DROP INDEX IF EXISTS labels_name_global_unique")
    op.execute("DROP INDEX IF EXISTS labels_name_feature_unique")
    op.execute("DROP INDEX IF EXISTS idx_labels_feature_instance")
    op.execute("CREATE UNIQUE INDEX labels_name_global_unique ON labels (name)")


def downgrade() -> None:
    pass
```

**The table list must match the feature schema entries** collected in Step 0. Update it if
features were added or renamed since this was written.

Also update `backend/scripts/init_db.py`:
- Change `ALEMBIC_REVISION = "001"` to match the new head revision (e.g. `"002"`)

Also update `backend/scripts/init_schema.sql`:
- Update the header comment `-- Reflects full schema (alembic revision NNN)` to the new revision

Verify the migration chain parses cleanly:
```bash
source backend/venv/bin/activate && python -m alembic history
```

## Verification

```bash
./scripts/check-application.json.sh
./scripts/check-backend.sh
./scripts/run-backend-tests.sh
./scripts/check-frontend.sh
```

All must pass. The app should launch with `/app/about` as the home page.

## Final step — update this skill

After a successful run, update `.claude/commands/keep-only-platform.md` to reflect
what was found during this execution:

- If a new wiring point was discovered (a new file that imports features, a new CSV
  pattern, a new registration trigger), add it to the relevant step.
- If a step was unnecessary (nothing to clean there), note it so future runs can skip it faster.
- If the project gained new conventions since the last run (new script, new test pattern),
  add a corresponding step.

The goal is that each execution makes the next one easier and more complete.
