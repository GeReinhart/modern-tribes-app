# Create New Feature

This skill guides the process of creating a new feature for the modern-tribes-app project.

## Process

### 1. Prerequisites

Before starting, ensure you are on a feature branch (not `main`):

```bash
git checkout -b feature/<feature-name>
```

Run all check scripts to confirm green light:

```bash
./scripts/check-area.sh
./scripts/check-application.json.sh
./scripts/check-backend.sh
./scripts/run-backend-tests.sh
./scripts/check-frontend.sh
```

Read `application.json` to understand the current project structure.

### 2. Study existing patterns

Before writing any code, explore an existing feature that is structurally similar:

- `backend/app/features/tasks/` and `frontend/src/app/features/tasks/` — feature with sub-packages
- `backend/app/features/bookmarks/` — simpler single-package feature
- `frontend/src/app/features/glue/index.ts` — where frontend features self-register (**critical wiring**)
- `frontend/src/app/platform/core/i18n/index.ts` — where locales are assembled
- `backend/app/features/registry.py` — backend feature registry
- `backend/app/features/__init__.py` — backend self-registration trigger (**critical wiring**)

### 3. Present a scenario for approval

**Before writing any code**, describe to the user:

- Package path on backend: `backend/app/features/<feature>/`
- Package path on frontend: `frontend/src/app/features/<feature>/`
- Whether a backend is needed (no backend needed for pure client-side features)
- Files to create (list them)
- Files to modify (list them)
- UI behaviour (what the user sees)
- Any backend schema / API endpoints

Wait for user approval before proceeding.

### 4. Frontend-only features (pure client-side)

When a feature has no backend (e.g., uses only browser APIs):

**Files to create under `frontend/src/app/features/<group>/<sub>/`:**

| File | Purpose |
|------|---------|
| `index.ts` | Registers with `registerFeature({ feature_type, label, component })` |
| `<Name>Tab.tsx` | Main tab component — receives `FeatureTabProps` |
| Sub-components | Extract into separate files when each exceeds ~20 lines |
| Custom hooks | Extract stateful logic into `use<Name>.ts` |
| Utilities | Pure logic in dedicated `.ts` files |
| `locales/en.ts` | English i18n strings |
| `locales/fr.ts` | French i18n strings |

**Wiring (files to modify):**

1. `frontend/src/app/features/glue/index.ts` — add `import '../<group>/<sub>';`
2. `frontend/src/app/platform/core/i18n/index.ts` — import and spread the new locales in both `en` and `fr` blocks
3. `application.json` — add the feature entry under `features.features`

### 5. Full-stack features (backend + frontend)

In addition to the frontend steps above:

**Backend files to create under `backend/app/features/<feature>/`:**

| File | Purpose |
|------|---------|
| `__init__.py` | Registers router via `registry.register_feature(FeatureDefinition(...))` |
| `models.py` | Pydantic models |
| `repository.py` | Database queries |
| `router.py` | FastAPI router — prefix must be unique (e.g. `/events`, `/my-labels`) |
| `label_service.py` | If the feature needs labels or per-feature access checks |

**Critical wiring (two places, both required):**

1. `backend/app/features/__init__.py` — add `from app.features import <feature>  # noqa: F401 — triggers self-registration`
2. `frontend/src/app/features/glue/index.ts` — add `import '../<feature>';`

> ⚠️ Missing either of these produces "Type de fonctionnalité inconnu : <feature>" at runtime. The backend registry and frontend registry are independent — both must be updated.

**Router mounting:** feature routers do **not** go in `main.py`. They self-register via `registry.register_feature()` and are collected by `get_all_routers()`, which mounts all of them under `/api/features/tasks`. The router's own `prefix` (e.g. `/events`) becomes the final path segment: `/api/features/tasks/events/...`.

**Schema and migrations:** when new tables are needed:

1. Add `CREATE TABLE IF NOT EXISTS ...` blocks to `backend/scripts/init_schema.sql`
2. Create a new migration file `backend/alembic/versions/<NNN>_<description>.py` following the pattern in existing migrations (see `001_initial_schema.py`)
3. Add dev-data CSV files under `backend/scripts/data-dev/<table>.csv`
4. Update `backend/scripts/init_db.py`:
   - Add the new tables to the `clear_tables` list (in dependency order — children before parents)
   - Add a `create_<feature>()` method and call it in the main async flow

**Scheduler:** if the feature needs a background task (e.g. reminders):

1. Create `backend/app/features/<feature>/scheduler.py` with an `async def <feature>_scheduler()` loop
2. Add the config interval to `backend/app/platform/core/config.py`
3. Import and start the scheduler in `backend/app/main.py` alongside `mail_scheduler`

### 6. Code quality constraints

Every file must respect the project hard constraints:

- Functions: max **30 lines**
- Files: max **300 lines** (React components: max **200 lines**)
- No logic inside JSX — extract into variables above `return`
- No duplicated logic — extract into shared utilities immediately
- Apply theme colors (`useTheme`) to all UI elements
- Use `useTranslation` for all user-facing strings (add keys to both locales)
- Never use `any` in TypeScript
- Check available `IconName` values in `ThemedSvgIcon.tsx` before using an icon name
- Check component prop signatures (e.g. `EditorJoditComponent` uses `content=` not `value=`) before importing

### 7. Run checks after implementation

```bash
./scripts/check-application.json.sh
./scripts/check-backend.sh
./scripts/run-backend-tests.sh
./scripts/check-frontend.sh
```

All checks must pass before considering the feature complete.

### 8. Ask user to test

Per project rules, **do not launch the app yourself**. Ask the user to test and provide feedback.
