#!/usr/bin/env bash
set -euo pipefail

BACKEND_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../backend" && pwd)"

set -a && source "$BACKEND_DIR/.env" && set +a

if [[ "$POSTGRES_HOST" != "localhost" && "$POSTGRES_HOST" != "127.0.0.1" ]]; then
  echo "ERROR: POSTGRES_HOST is '$POSTGRES_HOST' — refusing to reset a non-local database."
  exit 1
fi

echo "==> Terminating active connections to $POSTGRES_DB..."
podman exec modern_tribes_postgres psql -U "$POSTGRES_USER" -d postgres \
  -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$POSTGRES_DB' AND pid <> pg_backend_pid()"

echo "==> Dropping database $POSTGRES_DB..."
podman exec modern_tribes_postgres psql -U "$POSTGRES_USER" -d postgres \
  -c "DROP DATABASE IF EXISTS $POSTGRES_DB"

echo "==> Creating database $POSTGRES_DB..."
podman exec modern_tribes_postgres psql -U "$POSTGRES_USER" -d postgres \
  -c "CREATE DATABASE $POSTGRES_DB"

cd "$BACKEND_DIR"

echo "==> Running migrations..."
./venv/bin/alembic upgrade head

echo "==> Seeding data..."
./venv/bin/python scripts/init_db.py

echo "==> Done."
