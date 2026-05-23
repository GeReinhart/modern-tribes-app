#!/usr/bin/env bash
set -euo pipefail

FRONTEND_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../frontend" && pwd)"

echo "==> Type-checking..."
cd "$FRONTEND_DIR"
npx tsc --noEmit

echo "==> Building..."
npx vite build --logLevel warn

echo "==> Frontend compile OK"
