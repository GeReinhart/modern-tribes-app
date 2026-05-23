#!/usr/bin/env bash

BACKEND_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../backend" && pwd)"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "==> Starting tools..."
cd "$ROOT_DIR"
podman-compose up -d

cd "$BACKEND_DIR"
echo "==> Upgrade database..."
set -a && source .env && set +a && alembic upgrade head

echo "==> Start backend..."
set -a && source .env && set +a && ./venv/bin/uvicorn app.main:app --reload --port 8000
