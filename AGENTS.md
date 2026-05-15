# Agent Coding Guidelines

## Code Quality — Hard Constraints

These rules apply to all code you write or modify, in any language or layer.

### Do Not Repeat Yourself

- **Never duplicate logic.** If the same logic appears in two places, extract it into a shared function, module, or utility before proceeding.
- **Never duplicate a data structure or constant.** Define it once, import it everywhere.
- **If you copy-paste code to adapt it slightly, stop.** Parameterize the difference instead.

### Function Size

- **A function must not exceed 30 lines.** If it does, split it. Each sub-function must have a single, named responsibility.
- **A function must do one thing.** If its name requires "and" to describe it, split it.

### File Size

- **A file must not exceed 300 lines.** If it does, split it by responsibility into separate files.
- **A file must have a single, clear responsibility.** Do not mix concerns in one file (e.g., routing + business logic + database access).

### Code Organization

- **Similar code must live in the same place.** Group by concern: all API calls together, all validators together, all utilities together.
- **When adding code, first check if a related file already exists.** Add to it rather than creating a new one, unless it would violate the file size rule.
- **New shared logic must go in a shared module immediately**, not inline at the call site.

### Refactoring Triggers

When you encounter any of the following, refactor before continuing:

- A function is longer than 30 lines
- A file is longer than 300 lines
- The same logic exists in more than one place
- A function name contains "and" or describes multiple steps
- A file imports from many unrelated modules (sign of mixed concerns)



---

## Backend


### Technical stack

- **FastAPI** - Modern, fast Python web framework
- **PostGres** - Database
- **Alembic** - Database migrations
- **Pydantic** - Data validation and settings

### Code Organization Rules

- **Routes must contain no business logic.** Extract it to a service.
- **Database access must not appear in routes or services.** It belongs in a repository function.
- **Shared utilities go in a dedicated `utils/` or `helpers/` module**, never inline in a route or service.
- **Pydantic schemas are not business objects.** Keep them in `schemas/`; keep domain logic in services.

### Files and directories

- backend: all the backend
- backend/app: all the backend code
- backend/scripts/init_schema.sql: database schema. this is the reference for the entities

- backend/data: do not look here
- backend/venv: do not look here

## Dependencies

- All dependencies must be declared in `requirements.txt` and pinned to specific versions.

## Tracking changes on entities

Any entity must have created_at (with current user_id), created_by, updated_at, updated_by (with current user_id) fields.
Those fields must be automatically updated by the database when the entity is created or updated.

## Tracking status on entities

Any entity must have a status field. Possible values are: 'pending', 'active', 'archived' 
By default, the query must check for status = 'active'.

## Frontend

### Technical stack

- **React** - UI library
- **TypeScript** - Language
- **Vite** - Build tool
- **TailwindCSS** - Utility-first CSS framework
- **PWA** - Progressive Web App support

### Code Organization Rules

- **Never use `any`.** Type everything explicitly.
- **API calls must not live in components.** They belong in dedicated service files.
- **Shared stateful logic must be extracted into a custom hook**, not duplicated across components.
- **Reusable UI elements must be extracted into a shared component** as soon as they appear in more than one place.
- **A React component file must not exceed 200 lines.** If it does, extract sub-components or hooks.
- **No logic inside JSX.** Extract conditions and transformations into variables or functions above the return statement.

### Files and directories

- frontend: all the frontend
- frontend/src: all the frontend code

- frontend/dist: do not look here
- frontend/node_modules: do not look here

## Dependencies

- All dependencies must be declared in `package.json` and pinned to specific versions.
