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
- `frontend/src/app/features/glue/index.ts` — where frontend features register
- `frontend/src/app/platform/core/i18n/index.ts` — where locales are assembled
- `backend/app/features/registry.py` — backend feature registry
- `backend/app/features/__init__.py` — backend self-registration trigger

### 3. Present a scenario for approval

**Before writing any code**, describe to the user:

- Package path on backend: `backend/app/features/<feature>/<sub-feature>/`
- Package path on frontend: `frontend/src/app/features/<feature>/<sub-feature>/`
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
2. `frontend/src/app/platform/core/i18n/index.ts` — import and spread the new locales
3. `application.json` — add the feature entry under `features.features`

### 5. Full-stack features (backend + frontend)

In addition to the frontend steps above:

**Backend files to create under `backend/app/features/<feature>/`:**

| File | Purpose |
|------|---------|
| `__init__.py` | Registers router via `registry.register_feature(FeatureDefinition(...))` |
| `models.py` | Pydantic models |
| `repository.py` | Database queries |
| `router.py` | FastAPI router |

**Wiring (files to modify):**

1. `backend/app/features/__init__.py` — add `from app.features.<feature> import <sub>`
2. `backend/app/main.py` — import router and add `app.include_router(...)` with prefix `/api/features`
3. `application.json` — declare schema tables and paths

**Migration:** if schema changes are needed, add a new migration file under `backend/migrations/`.

### 6. Code quality constraints

Every file must respect the project hard constraints:

- Functions: max **30 lines**
- Files: max **300 lines** (React components: max **200 lines**)
- No logic inside JSX — extract into variables above `return`
- No duplicated logic — extract into shared utilities immediately
- Apply theme colors (`useTheme`) to all UI elements
- Use `useTranslation` for all user-facing strings (add keys to both locales)
- Never use `any` in TypeScript

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
