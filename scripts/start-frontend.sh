#!/usr/bin/env bash
set -euo pipefail

FRONT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../frontend" && pwd)"

[ ! -f "$FRONT_DIR/.env" ] && cp "$FRONT_DIR/.env.example" "$FRONT_DIR/.env" && echo "==> Created $FRONT_DIR/.env from example"

if [ ! -d "$FRONT_DIR/node_modules" ]; then
  echo "==> Installing dependencies..."
  cd "$FRONT_DIR" && npm install
fi

cd "$FRONT_DIR"
echo "==> Start frontend..."
npm run dev
