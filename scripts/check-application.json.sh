#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
APP_JSON="$ROOT_DIR/application.json"

ERRORS=0

# ────────────────────────────────────────────────────────────
# 1. DIRECTORY STRUCTURE
# ────────────────────────────────────────────────────────────
echo "==> Checking directory structure..."

structure_lines=$(python3 - "$APP_JSON" << 'PYEOF'
import json, sys

with open(sys.argv[1]) as f:
    app = json.load(f)

def emit(packages, context):
    for pkg in packages:
        name = pkg.get("package", "?")
        for side in ("backend", "frontend"):
            if side in pkg:
                for path in pkg[side].get("path", []):
                    print(f"{context}/{name}/{side}|{path}")
        for sub in pkg.get("sub_packages", []):
            sub_name = sub.get("package", "?")
            for side in ("backend", "frontend"):
                if side in sub:
                    for path in sub[side].get("path", []):
                        print(f"{context}/{name}/{sub_name}/{side}|{path}")

emit(app["platform"]["core"],      "platform.core")
emit(app["platform"]["functions"], "platform.functions")
emit(app["platform"]["tools"],     "platform.tools")
emit(app["features"]["features"],  "features")
PYEOF
)

while IFS='|' read -r context raw_path; do
    dir="${raw_path%/**}"
    if [[ ! -d "$ROOT_DIR/$dir" ]]; then
        echo "  FAIL missing directory: $dir  [$context]"
        ERRORS=$((ERRORS + 1))
    fi
done <<< "$structure_lines"

# ────────────────────────────────────────────────────────────
# 2. FORBIDDEN DEPENDENCIES — platform must not import features
# ────────────────────────────────────────────────────────────
echo "==> Checking forbidden dependencies (platform must not import features)..."

# Backend Python: from app.features or import app.features
while IFS= read -r line; do
    echo "  FAIL [backend] ${line#"$ROOT_DIR"/}"
    ERRORS=$((ERRORS + 1))
done < <(grep -rn --include="*.py" \
    -e "from app\.features" \
    -e "import app\.features" \
    "$ROOT_DIR/backend/app/platform/" 2>/dev/null || true)

# Frontend TypeScript: any import whose path contains /features/
# Exception: platform/core/i18n/index.ts is the intentional aggregation point
# that merges all feature locale files into the single i18n resource bundle.
while IFS= read -r line; do
    echo "  FAIL [frontend] ${line#"$ROOT_DIR"/}"
    ERRORS=$((ERRORS + 1))
done < <(grep -rn --include="*.ts" --include="*.tsx" \
    -E "from ['\"][^'\"]*features/" \
    "$ROOT_DIR/frontend/src/app/platform/" 2>/dev/null \
    | grep -v "platform/core/i18n/index.ts" \
    || true)

# ────────────────────────────────────────────────────────────
# RESULT
# ────────────────────────────────────────────────────────────
echo ""
if [[ $ERRORS -gt 0 ]]; then
    echo "==> FAILED: $ERRORS violation(s) found." >&2
    exit 1
fi
cp application.json frontend/src/app
echo "==> application.json check OK"
