#!/usr/bin/env bash

FRONT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../frontend" && pwd)"

cd "$FRONT_DIR"
echo "==> Start frontend..."
npm run dev

