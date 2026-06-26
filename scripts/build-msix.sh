#!/bin/bash
# Build MSIX package for Microsoft Store
# Usage: bash scripts/build-msix.sh

set -e

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
STAGING="$PROJECT_DIR/src-tauri/target/release/msix-staging"
OUTPUT_DIR="$PROJECT_DIR/src-tauri/target/release/bundle/msix"
VERSION="0.1.1.0"
MSIX_NAME="Tales.Runner.UMT.Map.Manager_${VERSION}_x64.msix"
MAKEAPPX="/c/Program Files (x86)/Windows Kits/10/bin/10.0.22621.0/x64/makeappx.exe"
SIGNTOOL="/c/Program Files (x86)/Windows Kits/10/bin/10.0.22621.0/x64/signtool.exe"
CERT_SHA1="19B20FAE6AB5B5C8522629417ED501404533E73A"

echo "=== Step 1: Build release exe ==="
cd "$PROJECT_DIR"
npx tauri build --bundles none

echo "=== Step 2: Prepare staging directory ==="
rm -rf "$STAGING"
mkdir -p "$STAGING/icons"
cp src-tauri/target/release/tales-runner-umt-manager.exe "$STAGE/Tales Runner UMT Map Manager.exe"
cp src-tauri/Package.appxmanifest "$STAGING/AppxManifest.xml"
cp src-tauri/icons/StoreLogo.png "$STAGING/icons/"
cp src-tauri/icons/Square44x44Logo.png "$STAGING/icons/"
cp src-tauri/icons/Square71x71Logo.png "$STAGING/icons/"
cp src-tauri/icons/Square150x150Logo.png "$STAGING/icons/"
cp src-tauri/icons/Wide310x150Logo.png "$STAGING/icons/"
cp src-tauri/icons/SplashScreen.png "$STAGING/icons/"
echo "Staging ready: $(ls "$STAGING" | wc -l) files"

echo "=== Step 3: Pack MSIX ==="
mkdir -p "$OUTPUT_DIR"
MSYS_NO_PATHCONV=1 "$MAKEAPPX" pack /v /h SHA256 /d "$STAGING" /p "$OUTPUT_DIR/$MSIX_NAME" /o

echo "=== Step 4: Sign MSIX ==="
MSYS_NO_PATHCONV=1 "$SIGNTOOL" sign /fd SHA256 /sha1 "$CERT_SHA1" "$OUTPUT_DIR/$MSIX_NAME"

echo ""
echo "=== Done ==="
echo "MSIX: $OUTPUT_DIR/$MSIX_NAME"
ls -lh "$OUTPUT_DIR/$MSIX_NAME"