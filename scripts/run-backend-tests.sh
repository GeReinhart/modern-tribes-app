#!/usr/bin/env bash
set -euo pipefail

BACKEND_DIR="$(cd "$(dirname "$0")/../backend" && pwd)"

cd "$BACKEND_DIR"

if ! venv/bin/python -m pytest --version &>/dev/null; then
    echo "pytest not found — installing test dependencies..."
    venv/bin/pip install pytest==8.4.0 pytest-bdd==8.1.0 pytest-asyncio==0.26.0
fi

PYTEST_ARGS=(
    "tests/bdd"
    "--verbose"
    "--tb=short"
    "--no-header"
)

if [[ -n "${1:-}" ]]; then
    # Strip leading '@' if present (e.g. '@wip' → 'wip')
    MARKER="${1#@}"
    echo "Running tests tagged: @${MARKER}"
    PYTEST_ARGS+=("-m" "$MARKER")
else
    echo "Running all backend BDD tests"
fi

echo ""
venv/bin/python -m pytest "${PYTEST_ARGS[@]}"
