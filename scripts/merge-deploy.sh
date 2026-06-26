#!/usr/bin/env bash
set -euo pipefail

COMMIT_MSG="${1:-}"
FEATURE_BRANCH=$(git rev-parse --abbrev-ref HEAD)
BACKEND_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../backend" && pwd)"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

HAS_UNCOMMITTED=$(git status --porcelain)
COMMITS_AHEAD=$(git rev-list --count main..HEAD)

if [ -z "$COMMIT_MSG" ]; then
    if [ -n "$HAS_UNCOMMITTED" ]; then
        echo "✗ Uncommitted changes present. Provide a commit message."
        exit 1
    fi
    if [ "$COMMITS_AHEAD" -eq 0 ]; then
        echo "✗ No commits ahead of main and nothing to commit. Nothing to deploy."
        exit 1
    fi
    echo "==> No commit message provided, skipping commit (${COMMITS_AHEAD} commit(s) ahead of main)."
fi

echo "==> Check code..."
./scripts/check-docker-packaging.sh || { echo "✗ Docker packaging check failed. Aborting."; exit 1; }
./scripts/check-backend.sh || { echo "✗ Backend checks failed. Aborting."; exit 1; }
./scripts/check-frontend.sh || { echo "✗ Frontend checks failed. Aborting."; exit 1; }
echo "==> Test code..."
./scripts/run-backend-tests.sh || { echo "✗ Backend checks failed. Aborting."; exit 1; }


cd $ROOT_DIR
if [ -n "$COMMIT_MSG" ]; then
    echo "==> Committing on $FEATURE_BRANCH..."
    git add -A
    git commit -m "$COMMIT_MSG"
fi

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
