#!/usr/bin/env bash
set -euo pipefail

if [ -z "${1:-}" ]; then
    echo "Usage: $0 \"<commit message>\""
    exit 1
fi

COMMIT_MSG="$1"
FEATURE_BRANCH=$(git rev-parse --abbrev-ref HEAD)
BACKEND_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../backend" && pwd)"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "==> Committing on $FEATURE_BRANCH..."
git add -A
git commit -m "$COMMIT_MSG"

echo "==> Merging $FEATURE_BRANCH into main..."
git checkout main
git merge "$FEATURE_BRANCH"

echo "==> Pushing main..."
git push origin main

echo "==> Checking out deploy..."
git checkout deploy

echo "==> Rebasing deploy onto main..."
git rebase main

echo "==> Pushing deploy..."
git push --force-with-lease origin deploy

echo "==> Upgrade prod database..."
cd $BACKEND_DIR
set -a && source .env.prod && set +a && alembic upgrade head

echo "==> Back to main..."
cd $ROOT_DIR
git checkout main

echo "==> Done."
