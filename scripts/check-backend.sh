#!/usr/bin/env bash
set -euo pipefail

BACKEND_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../backend" && pwd)"

echo "==> Checking Python syntax..."
cd "$BACKEND_DIR"
python -m compileall -q app alembic

echo "==> Linting..."
"$BACKEND_DIR/venv/bin/ruff" check app

echo "==> Backend compile OK"
