#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ERRORS=0

fail() { echo "✗ $1"; ERRORS=$((ERRORS + 1)); }
ok()   { echo "  $1"; }

# Returns ok / warn / fail for a semver constraint against a node major version.
# warn = the major matches but a specific minor/patch is required (Docker image version matters).
semver_compatible() {
    local major="$1" constraint="$2"
    CONSTRAINT="$constraint" MAJOR="$major" node -e "
const major = parseInt(process.env.MAJOR);
const ranges = process.env.CONSTRAINT.split('||').map(r => r.trim());
for (const range of ranges) {
  const m = range.match(/[\^>=~]*\s*(\d+)\.(\d+)\.\d+/);
  if (!m) continue;
  const rMaj = parseInt(m[1]), rMin = parseInt(m[2]);
  if (range.startsWith('^')) {
    if (major === rMaj) { process.stdout.write(rMin===0?'ok':'warn'); process.exit(0); }
  } else if (range.includes('>=')) {
    if (major > rMaj) { process.stdout.write('ok'); process.exit(0); }
    if (major === rMaj) { process.stdout.write(rMin===0?'ok':'warn'); process.exit(0); }
  }
}
process.stdout.write('fail');
" 2>/dev/null || echo "unknown"
}

check_build_tool() {
    local label="$1" pkg="$ROOT_DIR/frontend/node_modules/$2/package.json"
    [ -f "$pkg" ] || return 0
    local engines
    engines=$(node -e "const p=require('$pkg'); console.log((p.engines||{}).node||'')" 2>/dev/null || true)
    [ -n "$engines" ] || return 0
    local status
    status=$(semver_compatible "$DOCKER_NODE_MAJOR" "$engines")
    case "$status" in
        ok)   ok "$label engines.node ($engines) compatible with node:$DOCKER_NODE_MAJOR ✓" ;;
        warn) echo "  ⚠ $label engines.node ($engines) requires specific minor/patch — ensure node:$DOCKER_NODE_MAJOR Docker image is up to date" ;;
        fail) fail "$label engines.node ($engines) incompatible with Dockerfile node:$DOCKER_NODE_MAJOR — upgrade Dockerfile.frontend" ;;
    esac
}

echo "==> Checking Docker packaging..."

# 1. engines.node must be declared in frontend/package.json
ENGINES_NODE=$(node -e "const p=require('$ROOT_DIR/frontend/package.json'); console.log((p.engines||{}).node||'')" 2>/dev/null || echo "")
if [ -z "$ENGINES_NODE" ]; then
    fail "engines.node not declared in frontend/package.json — add it to make the Node.js constraint explicit"
else
    ok "engines.node: $ENGINES_NODE ✓"
fi

# 2. Dockerfile.frontend node major must match local dev node major
DOCKER_TAG=$(grep -oP 'FROM node:\K\S+' "$ROOT_DIR/Dockerfile.frontend" | head -1)
DOCKER_NODE_MAJOR=$(echo "$DOCKER_TAG" | grep -oP '^\d+')
LOCAL_NODE_VERSION=$(node --version)
LOCAL_NODE_MAJOR=$(echo "$LOCAL_NODE_VERSION" | sed 's/v//' | cut -d. -f1)
if [ "$DOCKER_NODE_MAJOR" != "$LOCAL_NODE_MAJOR" ]; then
    fail "Node.js major mismatch: Dockerfile uses node:$DOCKER_NODE_MAJOR-*, local dev is $LOCAL_NODE_VERSION — update Dockerfile.frontend to node:$LOCAL_NODE_MAJOR-alpine"
else
    ok "Dockerfile node:$DOCKER_NODE_MAJOR matches local $LOCAL_NODE_VERSION ✓"
fi

# 3. Key build tools must be compatible with the Dockerfile node major
check_build_tool "vite" "vite"
check_build_tool "vite-plugin-pwa" "vite-plugin-pwa"

if [ "$ERRORS" -gt 0 ]; then
    echo ""
    echo "✗ Docker packaging check failed ($ERRORS error(s))"
    exit 1
fi

echo ""
echo "==> Docker packaging check OK"
