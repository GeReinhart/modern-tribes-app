#!/usr/bin/env bash

# Will make sure
#   - the import are will organized
#   - the code is formatted

set -euo pipefail
pip install absolufy-imports autoflake isort black

BACKEND_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../backend" && pwd)"

echo "==> Organize Python imports..."
cd "$BACKEND_DIR"


# Step 1 — absolute imports, skip venv
PYTHONWARNINGS=ignore::SyntaxWarning absolufy-imports $(find app -name "*.py")

# Step 2 — remove unused imports, skip venv
autoflake --in-place --remove-all-unused-imports --recursive app/

# Step 3 — sort imports, only on app/
isort --skip venv app/


echo "==> Format Python code..."
# Step 4 - Format
black app/



