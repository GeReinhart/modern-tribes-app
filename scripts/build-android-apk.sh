#!/bin/bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ANDROID_DIR="$ROOT_DIR/frontend/src/android"
MANIFEST="$ANDROID_DIR/twa-manifest.json"
KEYSTORE="$ANDROID_DIR/android-keystore.jks"
ASSETLINKS="$ROOT_DIR/frontend/public/.well-known/assetlinks.json"

echo "==> Modern Tribes — Android TWA Build"
echo ""

# Check dependencies
if ! command -v node &>/dev/null; then
  echo "ERROR: Node.js is required. Install from https://nodejs.org" >&2
  exit 1
fi
if ! command -v keytool &>/dev/null; then
  echo "ERROR: keytool is required (part of Java JDK). Install a JDK." >&2
  exit 1
fi

# Check manifest is configured
if grep -q "YOUR_PRODUCTION_DOMAIN" "$MANIFEST"; then
  echo "ERROR: Edit frontend/src/android/twa-manifest.json and replace YOUR_PRODUCTION_DOMAIN" >&2
  echo "       with your actual production domain (e.g. app.moderntribes.com)" >&2
  exit 1
fi

# Create keystore if it doesn't exist
if [ ! -f "$KEYSTORE" ]; then
  echo "==> No keystore found — creating one (you will be prompted for a password)."
  keytool -genkey -v \
    -keystore "$KEYSTORE" \
    -alias modern-tribes \
    -keyalg RSA -keysize 2048 -validity 10000
  echo ""
fi

# Install Bubblewrap globally if missing
if ! npx --no @bubblewrap/cli --version &>/dev/null 2>&1; then
  echo "==> Installing Bubblewrap CLI..."
  npm install -g @bubblewrap/cli
fi

cd "$ANDROID_DIR"

echo "==> Building APK with Bubblewrap..."
npx @bubblewrap/cli build

APK="$ANDROID_DIR/app-release-signed.apk"
if [ ! -f "$APK" ]; then
  echo "ERROR: APK not produced. Check the Bubblewrap output above." >&2
  exit 1
fi

DOWNLOADS_DIR="$ROOT_DIR/frontend/public/downloads"
mkdir -p "$DOWNLOADS_DIR"
cp "$APK" "$DOWNLOADS_DIR/modern-tribes.apk"

VERSION_CODE=$(node -e "const m=require('$MANIFEST');process.stdout.write(String(m.appVersionCode))")
VERSION_NAME=$(node -e "const m=require('$MANIFEST');process.stdout.write(m.appVersionName)")

echo "{\"versionCode\":$VERSION_CODE,\"versionName\":\"$VERSION_NAME\"}" \
  > "$ROOT_DIR/frontend/public/apk-version.json"

FRONTEND_ENV="$ROOT_DIR/frontend/.env"
if [ -f "$FRONTEND_ENV" ]; then
  sed -i "s/^VITE_APK_VERSION_CODE=.*/VITE_APK_VERSION_CODE=$VERSION_CODE/" "$FRONTEND_ENV"
fi

echo ""
echo "==> APK ready: $APK"
echo "==> Copied to: $DOWNLOADS_DIR/modern-tribes.apk (served at /downloads/modern-tribes.apk)"
echo "==> Version: $VERSION_NAME ($VERSION_CODE)"
echo "==> Updated frontend/public/apk-version.json and frontend/.env"
echo ""

# Extract fingerprint — prompt for keystore password so keytool doesn't fail silently
echo "==> Enter the keystore password to extract the SHA-256 fingerprint:"
read -rs KEYSTORE_PASS
FINGERPRINT=$(keytool -list -v \
  -keystore "$KEYSTORE" \
  -alias modern-tribes \
  -storepass "$KEYSTORE_PASS" 2>/dev/null \
  | grep "SHA256:" | head -1 | awk '{print $2}')
unset KEYSTORE_PASS

if [ -n "$FINGERPRINT" ]; then
  echo "==> SHA-256 fingerprint: $FINGERPRINT"
  echo ""
  echo "==> Updating $ASSETLINKS..."
  cat > "$ASSETLINKS" <<EOF
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.moderntribes.app",
      "sha256_cert_fingerprints": ["$FINGERPRINT"]
    }
  }
]
EOF
  echo "    Done. Commit frontend/public/.well-known/assetlinks.json."
fi

echo ""
echo "==> Next steps:"
echo "    1. Commit frontend/public/.well-known/assetlinks.json and frontend/public/downloads/modern-tribes.apk"
echo "    2. Deploy — the updated assetlinks.json must be live before Android will open links in the app."
