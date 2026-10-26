#!/bin/bash
# Puts the "إيجنت سهل" app for the Sahel agent demo on the Desktop (macOS). No Xcode needed.
# Run: bash scripts/make-shortcut.sh
set -e
PROJECT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$PROJECT/mac/إيجنت سهل.app"
DEST="$HOME/Desktop/إيجنت سهل.app"

[ -d "$SRC" ] || { echo "App bundle not found: $SRC"; exit 1; }

# ditto copies the bundle and overwrites an older copy in place.
/usr/bin/ditto "$SRC" "$DEST"
cp "$PROJECT/assets/sahel.icns" "$DEST/Contents/Resources/sahel.icns"
printf '%s' "$PROJECT" > "$DEST/Contents/Resources/project-path"
chmod +x "$DEST/Contents/MacOS/sahel-demo" "$PROJECT/start-demo.command"
/usr/bin/xattr -dr com.apple.quarantine "$DEST" 2>/dev/null || true
# Refresh Finder's icon cache for the bundle.
touch "$DEST"

echo "Desktop app ready: $DEST"
