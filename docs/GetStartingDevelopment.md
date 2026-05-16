# Get started with Development

## Prerequisites

- Node.js 18+
- ```sudo dnf install python3-devel```
- Docker & Docker Compose (for PostgreSQL and MailHog)
    - (or Podman & Podman Compose)

## Start the backend elements

### Tools with Podman
```bash
cp .env.example .env
podman-compose up -d
```

This starts
- PostgreSQL internal to the container
- pgAdmin on `localhost:8081` => http://localhost:8081 (admin@modern-tribes.com:admin123)
- MailHog UI on `localhost:8025` => http://localhost:8025
- MailHog SMTP internal to the container



To have logs from the containers:
```bash
podman-compose logs -f postgres
podman-compose logs -f pgadmin
podman-compose logs -f mailhog
```

Restart containers:
```bash
podman-compose restart postgres
podman-compose restart pgadmin
podman-compose restart mailhog
```

Stop all backend
```
podman-compose down
```

Remove volumes to reset the database:
```bash
podman-compose down -v
```

### Backend of the application with python commands

This allows a more reactive development loop.

```bash
cd backend
```

Set up the virtual environment:
```bash
rm -rf venv
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Initialize database schema and seed data (development only):
```bash
python scripts/init_db.py
```

Launch the backend with auto-reload:
```bash
./venv/bin/uvicorn app.main:app --reload --port 8000
```

This starts
- Backend of the application on `localhost:8000` => http://localhost:8000/docs


### Database Migrations

For schema changes, use Alembic migrations (see `MIGRATIONS.md`):

```bash
# Apply all migrations
set -a && source .env && set +a && alembic upgrade head


# Check migration status
set -a && source .env && set +a && alembic current
```

## Start the frontend


Get dependencies
```bash
cd frontend
npm install
```

Launch the frontend with auto-reload
```bash
npm run dev
```

The frontend will be available at http://localhost:3000



Build the app
```bash
npm run build
```