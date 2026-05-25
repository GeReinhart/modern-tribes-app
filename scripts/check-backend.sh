#!/usr/bin/env bash
set -euo pipefail

BACKEND_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../backend" && pwd)"

echo "==> Checking Python syntax..."
cd "$BACKEND_DIR"
python -m compileall -q app features alembic

echo "==> Linting..."
ruff check app features

echo "==> Backend compile OK"
