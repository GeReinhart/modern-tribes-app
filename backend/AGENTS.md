# Agent Coding Guidelines

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


- **MUST**: all SQL queries must be under `backend/app/repositories`

### Files and directories

- backend: all the backend
- backend/app: all the backend code
- backend/scripts/init_schema.sql: database schema. this is the reference for the entities
- backend/scripts/data-dev: init the dev database. should show the different possibilities offered by the application

- backend/data: do not look here
- backend/venv: do not look here

- **MUST**: when adding a new entity:
  - add the corresponding migration step in `backend/alembic/versions`
  - update `backend/scripts/init_schema.sql` and `backend/scripts/init_db.sh` 
  - add examples of data under `backend/scripts/data-dev`




## Dependencies

- All dependencies must be declared in `requirements.txt` and pinned to specific versions.

## Tracking changes on entities

Any entity must have created_at (with current user_id), created_by, updated_at, updated_by (with current user_id) fields.
Those fields must be automatically updated by the database when the entity is created or updated.

## Tracking status on entities

Any entity must have a status field. Possible values are: 'pending', 'active', 'archived' 
By default, the query must check for status = 'active'.

