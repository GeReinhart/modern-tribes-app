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

echo ""
echo "==> APK ready: $APK"
echo "==> Copied to: $DOWNLOADS_DIR/modern-tribes.apk (served at /downloads/modern-tribes.apk)"
echo ""

# Extract and display fingerprint
FINGERPRINT=$(keytool -list -v -keystore "$KEYSTORE" -alias modern-tribes 2>/dev/null \
  | grep "SHA256:" | head -1 | awk '{print $2}')

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
echo "    1. Host the APK and note its public URL."
echo "    2. Set VITE_APK_DOWNLOAD_URL=<url> in your frontend environment."
echo "    3. Deploy the updated assetlinks.json (already written above)."
