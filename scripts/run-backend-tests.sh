#!/usr/bin/env bash
set -euo pipefail

BACKEND_DIR="$(cd "$(dirname "$0")/../backend" && pwd)"
COVERAGE_THRESHOLD=80

cd "$BACKEND_DIR"

if ! venv/bin/python -m pytest --version &>/dev/null; then
    echo "pytest not found — installing test dependencies..."
    venv/bin/pip install pytest==8.4.0 pytest-bdd==8.1.0 pytest-asyncio==0.26.0
fi

if ! venv/bin/python -m pytest --co -q --no-header 2>/dev/null | grep -q "pytest-cov"; then
    venv/bin/pip install pytest-cov==6.1.0 &>/dev/null || true
fi

PYTEST_ARGS=(
    "tests/bdd"
    "--verbose"
    "--tb=short"
    "--no-header"
)

if [[ -n "${1:-}" ]]; then
    MARKER="${1#@}"
    echo "Running tests tagged: @${MARKER}"
    PYTEST_ARGS+=("-m" "$MARKER")
    echo ""
    venv/bin/python -m pytest "${PYTEST_ARGS[@]}"
    exit 0
fi

echo "Running all backend BDD tests"
echo ""

if ! venv/bin/python -m pytest "${PYTEST_ARGS[@]}"; then
    echo ""
    echo "Tests FAILED — skipping coverage report."
    exit 1
fi

echo ""
echo "All tests passed — generating coverage report..."
echo ""

COVERAGE_OUTPUT=$(venv/bin/python -m pytest \
    tests/bdd \
    --no-header -q \
    --cov=app \
    --cov-report=term-missing \
    --cov-config=pyproject.toml \
    2>&1)

echo "$COVERAGE_OUTPUT" | grep -E "^(app/|Name|------|----|TOTAL)"

echo ""
echo "--- Coverage warnings (< ${COVERAGE_THRESHOLD}%) ---"

WARNINGS=()
while IFS= read -r line; do
    if [[ "$line" =~ ^app/ ]]; then
        module=$(echo "$line" | awk '{print $1}')
        pct=$(echo "$line" | grep -oP '\d+(?=%)' | tail -1)
        if [[ -n "$pct" && "$pct" -lt "$COVERAGE_THRESHOLD" ]]; then
            WARNINGS+=("$(printf "%03d %s" "$pct" "$module")")
        fi
    fi
done <<< "$COVERAGE_OUTPUT"

if [[ "${#WARNINGS[@]}" -eq 0 ]]; then
    echo "  All modules are above ${COVERAGE_THRESHOLD}% line coverage."
else
    while IFS= read -r entry; do
        pct=$(echo "$entry" | awk '{print $1}' | sed 's/^0*//')
        module=$(echo "$entry" | awk '{print $2}')
        printf "  WARNING: %-60s %s%%\n" "$module" "$pct"
    done < <(printf '%s\n' "${WARNINGS[@]}" | sort -rn)
fi
