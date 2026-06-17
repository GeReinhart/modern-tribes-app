#!/usr/bin/env bash
set -euo pipefail

BACKEND_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../backend" && pwd)"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

[ ! -f "$ROOT_DIR/.env" ] && cp "$ROOT_DIR/.env.example" "$ROOT_DIR/.env" && echo "==> Created $ROOT_DIR/.env from example"
[ ! -f "$BACKEND_DIR/.env" ] && cp "$BACKEND_DIR/.env.example" "$BACKEND_DIR/.env" && echo "==> Created $BACKEND_DIR/.env from example"

echo "==> Starting tools..."
cd "$ROOT_DIR"
podman-compose up -d

sleep 5


cd "$BACKEND_DIR"
if [ ! -f "venv/bin/activate" ]; then
  echo "==> Creating virtualenv..."
  python3 -m venv venv
  ./venv/bin/pip install -r requirements.txt
fi

echo "==> Upgrade database..."
set -a && source .env && set +a && ./venv/bin/alembic upgrade head

echo "==> Start backend..."
set -a && source .env && set +a && ./venv/bin/uvicorn app.main:app --reload --port 8000
