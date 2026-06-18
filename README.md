# Modern Tribes App

## Vision

Modern life calls for lightweight, flexible tools to organise the groups we belong to — families, sports clubs, project teams, event crews. **Modern Tribes** calls these groups *tribes*.

Key ideas:

- A person can belong to many tribes simultaneously, whether long-lived (a family) or short-lived (a weekend event).
- **User ≠ Person.** An adult can represent a child or anyone without their own account.
- Tribes own projects, and projects host pluggable feature modules — Kanban boards, todo lists, documents, and more.

## Stack

| Layer | Technology |
| --- | --- |
| Backend | Python 3.12 · FastAPI · asyncpg |
| Database | PostgreSQL 16 (JSONB, full-text search, Alembic migrations) |
| Frontend | React 18 · TypeScript · Vite · Tailwind CSS · PWA |
| Auth | Magic-link (passwordless) · JWT + refresh tokens |
| Email | SMTP via MailHog (dev) |
| Packaging | Docker / Podman |

## Features

### Platform (tag `0.1.x`)

A reusable base that can be forked to bootstrap any new application.

**Technical**
- Passwordless authentication via magic link + JWT
- Granular permission system with roles
- Entity lifecycle (active / archived) with full audit trail
- Internationalisation (i18n) — EN / FR
- Themeable UI with multiple colour themes
- Progressive Web App + TWA (Trusted Web Activity) support
- Outbound email with scheduling
- Rich-text editor with image upload and storage
- Document revision history
- Full-text search on document content
- Database schema migrations (Alembic)
- Docker / Podman packaging

**Functional**
- User / Person separation (one user can represent multiple people)
- Rich document management with pages, content editing, attachments and revisions

### Application features (tag `1.x.y`)

~ Pluggable modules added on the top of the platform:

- **Tribe management** with per-tribe membership and roles
- Projects attached to tribes
- Project documents and publication workflow
- **Todo list** — tasks with status tracking, notes, and archive
- **Kanban** — columnar board (up to 4 columns), card notes, theme-coloured columns

## Development setup

### Prerequisites

- Node.js 18+
- Python 3.12+ and `python3-devel` (`sudo dnf install python3-devel` on Fedora)
- Docker Compose or Podman Compose

### 1 — Infrastructure (PostgreSQL, pgAdmin, MailHog) and Backend

```bash
./scripts/start-backend.sh       # or: docker compose up -d
```

| Service | URL |
| --- | --- |
| pgAdmin | http://localhost:8081 |
| MailHog | http://localhost:8025 |
| PostgreSQL | localhost:5432 |

#### Init database

```bash
./script/reset-db.sh
```

#### Check area before coding

```bash
./script/check-area.sh
./script/check-backend.sh
./script/check-frontend.sh
```

#### Tests

```bash
./script/run-backend-tests.sh
```


### 2 — Frontend

```bash
./scripts/start-frontend.sh    
```

| Service    | URL |
|------------| --- |
| Front      | http://localhost:3000 |

## Project goals

This project serves two purposes:

1. **Practical tool** — a real application for organizing everyday tribe life.
2. **Technical showcase** — exploration of a modern full-stack Python/React architecture and a concrete experiment in collaborative development with Generative AI.

## Known prod instances

- https://www.reinhart.online/public/publications (hosted on https://www.clever.cloud/)

## License

Apache 2.0 — see [LICENSE](./LICENSE).
