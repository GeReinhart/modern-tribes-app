#!/usr/bin/env bash

# Will make sure
#   - the import are will organized
#   - the code is formatted

set -euo pipefail
FRONTEND_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../frontend" && pwd)"

echo "==> Organize TypedScript / React imports..."
cd "$FRONTEND_DIR"

# absolute imports + remove unused
npm run lint:fix || { echo "✗ absolute imports + remove unused failed. Aborting."; exit 1; }

# sort + format
npm run format || { echo "✗ sort + format failed. Aborting."; exit 1; }

# To address issues that do not require attention
npm audit fix || { echo "✗ audit failed. Aborting."; exit 1; }
# Run `npm audit fix --force` from time to time

# Check it's still building
npm run build  || { echo "✗ build failed. Aborting."; exit 1; }