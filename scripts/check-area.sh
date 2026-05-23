#!/usr/bin/env bash
set -euo pipefail

# Check we're not on main or deploy
branch=$(git rev-parse --abbrev-ref HEAD)
if [[ "$branch" == "main" || "$branch" == "deploy" ]]; then
    echo "ERROR: Current branch is '$branch'. Switch to a feature branch." >&2
    exit 1
fi

# Check working tree is clean
if ! git diff --quiet || ! git diff --cached --quiet; then
    echo "ERROR: Uncommitted changes detected. Commit or stash them first." >&2
    git status --short >&2
    exit 1
fi

# Check for untracked files
if [[ -n $(git ls-files --others --exclude-standard) ]]; then
    echo "ERROR: Untracked files detected:" >&2
    git ls-files --others --exclude-standard >&2
    exit 1
fi

